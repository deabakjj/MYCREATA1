/**
 * @file 사용자 컨트롤러
 * @description 사용자 관련 요청 처리 컨트롤러
 */

const User = require('../../models/user');
const Wallet = require('../../models/wallet');
const Activity = require('../../models/activity');
const MissionParticipation = require('../../models/missionParticipation');
const walletService = require('../../blockchain/walletService');
const logger = require('../../utils/logger');

/**
 * 현재 사용자 프로필 조회
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // 사용자 정보 조회 (관계 데이터 포함)
    const user = await User.findById(userId);
    
    if (!user) {
      const error = new Error('사용자를 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }
    
    // 지갑 정보 조회
    const wallet = await Wallet.findOne({ user: userId });
    
    // 프로필 통계 정보
    const stats = {
      // 기본 통계
      ...user.stats,
      
      // 추가 통계
      missions: {
        ...user.stats.missions,
      },
    };
    
    // 반환할 프로필 정보
    const profile = {
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      wallet: user.wallet,
      level: user.level,
      xp: user.xp,
      stats,
      createdAt: user.createdAt,
    };
    
    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 사용자 프로필 업데이트
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { name, profileImage } = req.body;
    
    // 사용자 정보 조회
    const user = await User.findById(userId);
    
    if (!user) {
      const error = new Error('사용자를 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }
    
    // 업데이트할 정보
    if (name) user.name = name;
    if (profileImage) user.profileImage = profileImage;
    
    // 저장
    await user.save();
    
    // 활동 기록
    await Activity.create({
      user: userId,
      type: 'profile_updated',
      data: {
        updates: {
          name: name ? true : false,
          profileImage: profileImage ? true : false,
        },
      },
      metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
    
    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
      },
      message: '프로필이 업데이트되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 사용자 활동 내역 조회
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const getActivities = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // 페이지네이션
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    
    // 타입 필터링
    const type = req.query.type;
    
    // 쿼리 생성
    const query = { user: userId };
    if (type) query.type = type;
    
    // 활동 내역 조회 (최신순)
    const activities = await Activity.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // 총 개수 조회
    const total = await Activity.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: activities,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 사용자 통계 조회
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const getStatistics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // 사용자 정보 조회
    const user = await User.findById(userId);
    
    if (!user) {
      const error = new Error('사용자를 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }
    
    // 지갑 정보 조회
    const wallet = await Wallet.findOne({ user: userId });
    
    // 미션 참여 정보 조회
    const missionStats = await MissionParticipation.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
    
    // 활동 타입별 통계
    const activityStats = await Activity.getActivityStatsByType(userId);
    
    // 일별 활동 트렌드 (최근 7일)
    const activityTrend = await Activity.getDailyActivityTrend(userId, 7);
    
    // 통계 정보 구성
    const statistics = {
      level: user.level,
      xp: user.xp,
      nextLevelXp: (user.level + 1) * 100, // 간단한 레벨업 계산식
      
      attendance: {
        totalDays: user.stats.attendance.totalDays,
        streak: user.stats.attendance.streak,
        lastCheckIn: user.stats.attendance.lastCheckIn,
      },
      
      missions: {
        total: missionStats.reduce((acc, stat) => acc + stat.count, 0),
        completed: missionStats.find(stat => stat._id === 'completed')?.count || 0,
        inProgress: missionStats.find(stat => stat._id === 'started')?.count || 0,
        submitted: missionStats.find(stat => stat._id === 'submitted')?.count || 0,
      },
      
      wallet: wallet ? {
        tokenBalances: wallet.tokenBalances,
        nftCount: wallet.nfts.length,
        transactionCount: wallet.transactions.length,
      } : null,
      
      activities: {
        total: activityStats.reduce((acc, stat) => acc + stat.count, 0),
        byType: activityStats,
        trend: activityTrend,
      },
    };
    
    res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 출석 체크
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const checkAttendance = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // 사용자 정보 조회
    const user = await User.findById(userId);
    
    if (!user) {
      const error = new Error('사용자를 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }
    
    // 출석 체크 실행
    const attendanceResult = await user.checkAttendance();
    
    if (!attendanceResult.success) {
      return res.status(400).json({
        success: false,
        message: attendanceResult.message,
      });
    }
    
    // 출석 보상 지급 (XP)
    const xpReward = 10;
    const xpResult = await user.addXP(xpReward);
    
    // 연속 출석 보너스
    let bonusXp = 0;
    if (attendanceResult.attendance.streak >= 7) {
      // 7일 연속 출석 보너스
      bonusXp = 20;
      await user.addXP(bonusXp);
    }
    
    // 지갑 정보 조회
    const wallet = await Wallet.findOne({ user: userId });
    
    // 활동 기록
    await Activity.create({
      user: userId,
      type: 'attendance',
      data: {
        streak: attendanceResult.attendance.streak,
        totalDays: attendanceResult.attendance.totalDays,
        xpEarned: xpReward + bonusXp,
        levelUp: xpResult.didLevelUp,
      },
      rewards: {
        xp: xpReward + bonusXp,
      },
      metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
    
    res.status(200).json({
      success: true,
      data: {
        attendance: attendanceResult.attendance,
        rewards: {
          xp: xpReward + bonusXp,
          bonusXp,
          currentXP: xpResult.currentXP,
          currentLevel: xpResult.currentLevel,
          didLevelUp: xpResult.didLevelUp,
        },
      },
      message: '출석 체크가 완료되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 현재 레벨 및 XP 정보 조회
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const getLevelInfo = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // 사용자 정보 조회
    const user = await User.findById(userId);
    
    if (!user) {
      const error = new Error('사용자를 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }
    
    // 간단한 레벨업 계산식
    const currentLevelXp = user.level * 100;
    const nextLevelXp = (user.level + 1) * 100;
    const xpForNextLevel = nextLevelXp - user.xp;
    const progress = Math.floor(((user.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100);
    
    res.status(200).json({
      success: true,
      data: {
        level: user.level,
        xp: user.xp,
        nextLevelXp,
        xpForNextLevel,
        progress,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 사용자 참여 미션 목록 조회
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const getUserMissions = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // 페이지네이션
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    
    // 상태 필터링
    const status = req.query.status;
    
    // 쿼리 생성
    const query = { user: userId };
    if (status) query.status = status;
    
    // 미션 참여 목록 조회 (최신순)
    const missionParticipations = await MissionParticipation.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('mission', 'title type difficulty rewards');
    
    // 총 개수 조회
    const total = await MissionParticipation.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: missionParticipations,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 특정 사용자 정보 조회 (퍼블릭 정보만)
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // 사용자 정보 조회
    const user = await User.findById(id);
    
    if (!user) {
      const error = new Error('사용자를 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }
    
    // 지갑 정보 조회
    const wallet = await Wallet.findOne({ user: id });
    
    // 퍼블릭 프로필 정보
    const profile = {
      _id: user._id,
      name: user.name,
      profileImage: user.profileImage,
      level: user.level,
      wallet: {
        address: user.wallet?.address,
        nestId: user.wallet?.nestId,
      },
      stats: {
        attendance: {
          totalDays: user.stats.attendance.totalDays,
          streak: user.stats.attendance.streak,
        },
        missions: {
          completed: user.stats.missions.completed,
        },
        nfts: {
          owned: user.stats.nfts.owned,
        },
      },
      createdAt: user.createdAt,
    };
    
    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Nest ID로 사용자 정보 조회 (퍼블릭 정보만)
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const getUserByNestId = async (req, res, next) => {
  try {
    const { nestId } = req.params;
    
    // Nest ID에서 이름 부분 추출
    const name = nestId.replace('.nest', '');
    
    // 온체인에서 주소 조회
    const address = await walletService.getAddressByNestId(name);
    
    if (!address) {
      const error = new Error('등록되지 않은 Nest ID입니다.');
      error.status = 404;
      throw error;
    }
    
    // 주소로 지갑 조회
    const wallet = await Wallet.findOne({ address });
    
    if (!wallet) {
      const error = new Error('해당 Nest ID를 가진 사용자를 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }
    
    // 사용자 정보 조회
    const user = await User.findById(wallet.user);
    
    if (!user) {
      const error = new Error('사용자를 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }
    
    // 퍼블릭 프로필 정보
    const profile = {
      _id: user._id,
      name: user.name,
      profileImage: user.profileImage,
      level: user.level,
      wallet: {
        address: wallet.address,
        nestId,
      },
      stats: {
        attendance: {
          totalDays: user.stats.attendance.totalDays,
          streak: user.stats.attendance.streak,
        },
        missions: {
          completed: user.stats.missions.completed,
        },
        nfts: {
          owned: user.stats.nfts.owned,
        },
      },
      createdAt: user.createdAt,
    };
    
    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * XP 추가 (개발용 또는 관리자용)
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const addXp = async (req, res, next) => {
  try {
    const { userId, amount } = req.body;
    
    // 사용자 정보 조회
    const user = await User.findById(userId);
    
    if (!user) {
      const error = new Error('사용자를 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }
    
    // XP 추가
    const result = await user.addXP(amount);
    
    // 활동 기록
    await Activity.create({
      user: userId,
      type: 'token_earned',
      data: {
        xpEarned: amount,
        levelUp: result.didLevelUp,
        adminAction: true,
        adminId: req.user._id,
      },
      rewards: {
        xp: amount,
      },
      metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
    
    res.status(200).json({
      success: true,
      data: {
        userId,
        xpAdded: amount,
        currentXP: result.currentXP,
        currentLevel: result.currentLevel,
        didLevelUp: result.didLevelUp,
      },
      message: `${amount} XP가 추가되었습니다.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 사용자 검색
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const searchUsers = async (req, res, next) => {
  try {
    // 검색 쿼리
    const { query, email, nestId, walletAddress, sort, order } = req.query;
    
    // 페이지네이션
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    
    // 쿼리 생성
    const searchQuery = {};
    
    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ];
    }
    
    if (email) {
      searchQuery.email = { $regex: email, $options: 'i' };
    }
    
    if (nestId) {
      searchQuery['wallet.nestId'] = nestId;
    }
    
    if (walletAddress) {
      searchQuery['wallet.address'] = walletAddress;
    }
    
    // 정렬
    const sortOptions = {};
    if (sort) {
      sortOptions[sort] = order === 'desc' ? -1 : 1;
    } else {
      sortOptions.createdAt = -1; // 기본 정렬: 최신순
    }
    
    // 사용자 검색
    const users = await User.find(searchQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);
    
    // 총 개수 조회
    const total = await User.countDocuments(searchQuery);
    
    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 사용자 상태 업데이트 (활성화/비활성화)
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    // 사용자 정보 조회
    const user = await User.findById(id);
    
    if (!user) {
      const error = new Error('사용자를 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }
    
    // 상태 업데이트
    user.isActive = isActive;
    await user.save();
    
    // 지갑 상태도 업데이트
    if (user.wallet && user.wallet.address) {
      const wallet = await Wallet.findOne({ address: user.wallet.address });
      
      if (wallet) {
        wallet.status = isActive ? 'active' : 'inactive';
        await wallet.save();
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        isActive: user.isActive,
      },
      message: `사용자가 ${isActive ? '활성화' : '비활성화'}되었습니다.`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getActivities,
  getStatistics,
  checkAttendance,
  getLevelInfo,
  getUserMissions,
  getUserById,
  getUserByNestId,
  addXp,
  searchUsers,
  updateUserStatus,
};
