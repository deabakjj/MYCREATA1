/**
 * @file 미션 컨트롤러
 * @description 미션 관련 요청 처리 컨트롤러
 */

const Mission = require('../../models/mission');
const MissionParticipation = require('../../models/missionParticipation');
const User = require('../../models/user');
const Activity = require('../../models/activity');
const Wallet = require('../../models/wallet');
const walletService = require('../../blockchain/walletService');
const logger = require('../../utils/logger');
const mongoose = require('mongoose');

/**
 * 미션 목록 조회
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const getMissions = async (req, res, next) => {
  try {
    // 페이지네이션
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    
    // 필터링
    const { type, status, difficulty, search, tag } = req.query;
    
    // 정렬
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    
    // 쿼리 생성
    const query = {};
    
    if (type) query.type = type;
    if (status) query.status = status;
    if (difficulty) query.difficulty = parseInt(difficulty, 10);
    if (search) query.title = { $regex: search, $options: 'i' };
    if (tag) query.tags = tag;
    
    // 미션 목록 조회
    const missions = await Mission.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);
    
    // 총 개수 조회
    const total = await Mission.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: missions,
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
 * 활성화된 미션 목록 조회
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const getActiveMissions = async (req, res, next) => {
  try {
    // 페이지네이션
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    
    // 필터링
    const { type, difficulty, search, tag } = req.query;
    
    // 정렬
    const sortBy = req.query.sortBy || 'startDate';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    
    // 활성화된 미션 쿼리
    const now = new Date();
    const query = {
      status: 'active',
      startDate: { $lte: now },
      $or: [
        { endDate: { $gte: now } },
        { endDate: null }
      ]
    };
    
    if (type) query.type = type;
    if (difficulty) query.difficulty = parseInt(difficulty, 10);
    if (search) query.title = { $regex: search, $options: 'i' };
    if (tag) query.tags = tag;
    
    // 활성화된 미션 조회
    const missions = await Mission.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);
    
    // 총 개수 조회
    const total = await Mission.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: missions,
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
 * 사용자 맞춤형 미션 추천
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const getRecommendedMissions = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // 사용자 정보 조회
    const user = await User.findById(userId);
    
    if (!user) {
      const error = new Error('사용자를 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }
    
    // 사용자가 참여 중인 미션 ID 목록 조회
    const participatingMissions = await MissionParticipation.find({
      user: userId,
      status: { $in: ['started', 'submitted'] },
    }).distinct('mission');
    
    // 사용자 맞춤형 미션 조회
    const recommendedMissions = await Mission.getPersonalizedMissions(user);
    
    // 이미 참여 중인 미션 제외
    const filteredMissions = recommendedMissions.filter(
      mission => !participatingMissions.includes(mission._id)
    );
    
    // 레벨 기반 추천
    const levelBasedMissions = filteredMissions.filter(
      mission => mission.difficulty <= user.level
    );
    
    // 완료한 미션 유형 기반 추천
    const completedMissionTypes = await MissionParticipation.find({
      user: userId,
      status: 'completed',
    }).distinct('mission.type');
    
    const typeBasedMissions = filteredMissions.filter(
      mission => completedMissionTypes.includes(mission.type)
    );
    
    // 최종 추천 미션 (최대 10개)
    let finalRecommendations = [...new Set([...levelBasedMissions, ...typeBasedMissions])];
    finalRecommendations = finalRecommendations.slice(0, 10);
    
    res.status(200).json({
      success: true,
      data: finalRecommendations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 특정 미션 상세 정보 조회
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const getMissionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // 미션 정보 조회
    const mission = await Mission.findById(id);
    
    if (!mission) {
      const error = new Error('미션을 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }
    
    // 미션 상태 업데이트 (날짜에 따라 자동 업데이트)
    await mission.updateStatus();
    
    // 사용자의 미션 참여 정보 조회
    const participation = await MissionParticipation.findOne({
      user: userId,
      mission: id,
    });
    
    // 미션 참여 가능 여부 확인
    let canParticipate = true;
    let cannotParticipateReason = null;
    
    // 이미 참여 중인지 확인
    if (participation) {
      canParticipate = false;
      cannotParticipateReason = '이미 참여 중인 미션입니다.';
    }
    
    // 미션이 활성 상태인지 확인
    if (mission.status !== 'active') {
      canParticipate = false;
      cannotParticipateReason = '현재 참여 가능한 미션이 아닙니다.';
    }
    
    // 최대 참여자 수 확인
    if (mission.requirements.maxParticipants) {
      const participantCount = await MissionParticipation.countDocuments({
        mission: id,
      });
      
      if (participantCount >= mission.requirements.maxParticipants) {
        canParticipate = false;
        cannotParticipateReason = '최대 참여자 수에 도달했습니다.';
      }
    }
    
    // 사용자 레벨 확인
    if (mission.requirements.minLevel > req.user.level) {
      canParticipate = false;
      cannotParticipateReason = `최소 레벨 ${mission.requirements.minLevel}이 필요합니다.`;
    }
    
    // 화이트리스트 확인
    if (
      mission.requirements.whitelistedUsers &&
      mission.requirements.whitelistedUsers.length > 0 &&
      !mission.requirements.whitelistedUsers.includes(userId)
    ) {
      canParticipate = false;
      cannotParticipateReason = '참여 권한이 없습니다.';
    }
    
    res.status(200).json({
      success: true,
      data: {
        mission,
        participation,
        canParticipate,
        cannotParticipateReason,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 미션 시작
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const startMission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // 미션 정보 조회
    const mission = await Mission.findById(id);
    
    if (!mission) {
      const error = new Error('미션을 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }
    
    // 미션 상태 업데이트 (날짜에 따라 자동 업데이트)
    await mission.updateStatus();
    
    // 미션이 활성 상태인지 확인
    if (mission.status !== 'active') {
      const error = new Error('현재 참여 가능한 미션이 아닙니다.');
      error.status = 400;
      throw error;
    }
    
    // 이미 참여 중인지 확인
    const existingParticipation = await MissionParticipation.findOne({
      user: userId,
      mission: id,
    });
    
    if (existingParticipation) {
      const error = new Error('이미 참여 중인 미션입니다.');
      error.status = 400;
      throw error;
    }
    
    // 최대 참여자 수 확인
    if (mission.requirements.maxParticipants) {
      const participantCount = await MissionParticipation.countDocuments({
        mission: id,
      });
      
      if (participantCount >= mission.requirements.maxParticipants) {
        const error = new Error('최대 참여자 수에 도달했습니다.');
        error.status = 400;
        throw error;
      }
    }
    
    // 사용자 레벨 확인
    if (mission.requirements.minLevel > req.user.level) {
      const error = new Error(`최소 레벨 ${mission.requirements.minLevel}이 필요합니다.`);
      error.status = 400;
      throw error;
    }
    
    // 화이트리스트 확인
    if (
      mission.requirements.whitelistedUsers &&
      mission.requirements.whitelistedUsers.length > 0 &&
      !mission.requirements.whitelistedUsers.includes(userId)
    ) {
      const error = new Error('참여 권한이 없습니다.');
      error.status = 403;
      throw error;
    }
    
    // 미션 참여 생성
    const participation = new MissionParticipation({
      user: userId,
      mission: id,
      status: 'started',
      startedAt: new Date(),
      progressData: {
        currentStep: 1,
        totalSteps: mission.content?.steps?.length || 1,
      },
    });
    
    await participation.save();
    
    // 미션 통계 업데이트
    mission.stats.participantCount += 1;
    await mission.save();
    
    // 활동 기록
    await Activity.create({
      user: userId,
      type: 'mission_started',
      data: {
        missionId: id,
        missionTitle: mission.title,
        missionType: mission.type,
      },
      relatedTo: {
        model: 'Mission',
        id: mission._id,
      },
      metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
    
    res.status(201).json({
      success: true,
      data: participation,
      message: '미션 참여가 시작되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 미션 제출
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const submitMission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { content, files } = req.body;
    
    // 참여 정보 조회
    const participation = await MissionParticipation.findOne({
      user: userId,
      mission: id,
    });
    
    if (!participation) {
      const error = new Error('참여 중인 미션이 아닙니다.');
      error.status = 404;
      throw error;
    }
    
    // 이미 제출했는지 확인
    if (participation.status !== 'started') {
      const error = new Error('이미 제출한 미션입니다.');
      error.status = 400;
      throw error;
    }
    
    // 미션 정보 조회
    const mission = await Mission.findById(id);
    
    if (!mission) {
      const error = new Error('미션을 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }
    
    // 미션 제출
    const submission = {
      content,
      files: files || [],
    };
    
    await participation.submitMission(submission);
    
    // AI 미션인 경우 자동 평가
    if (mission.type === 'ai' && mission.aiSettings) {
      // 실제로는 AI 평가 서비스 호출 필요
      const aiEvaluation = {
        score: Math.floor(Math.random() * 40) + 60, // 60~100점 랜덤 (샘플용)
        feedback: '자동 평가되었습니다.',
      };
      
      // 보상 계산
      const xpReward = mission.rewards.xp;
      const nestTokenReward = mission.rewards.nestToken;
      const ctaTokenReward = mission.rewards.ctaToken;
      
      // 완료 처리
      await participation.completeMission(
        {
          score: aiEvaluation.score,
          feedback: aiEvaluation.feedback,
          aiEvaluation,
          evaluatedAt: new Date(),
        },
        {
          xp: xpReward,
          nestToken: nestTokenReward,
          ctaToken: ctaTokenReward,
        }
      );
      
      // 사용자 XP 추가
      const user = await User.findById(userId);
      await user.addXP(xpReward);
      
      // 미션 통계 업데이트
      mission.stats.completionCount += 1;
      mission.stats.totalXpRewarded += xpReward;
      mission.stats.totalTokensRewarded.nest += nestTokenReward || 0;
      mission.stats.totalTokensRewarded.cta += ctaTokenReward || 0;
      
      // 평균 완료 시간 업데이트
      if (participation.completionTime) {
        if (mission.stats.averageCompletionTime === 0) {
          mission.stats.averageCompletionTime = participation.completionTime;
        } else {
          mission.stats.averageCompletionTime = Math.floor(
            (mission.stats.averageCompletionTime * (mission.stats.completionCount - 1) +
              participation.completionTime) /
              mission.stats.completionCount
          );
        }
      }
      
      await mission.save();
      
      // 토큰 보상 지급 (실제로는 블록체인 트랜잭션 필요)
      if (nestTokenReward || ctaTokenReward) {
        const wallet = await Wallet.findOne({ user: userId });
        
        if (wallet) {
          // 지갑 잔액 업데이트
          if (nestTokenReward) {
            wallet.tokenBalances.nest += nestTokenReward;
            
            // 트랜잭션 기록 추가
            wallet.transactions.push({
              type: 'reward',
              token: 'NEST',
              amount: nestTokenReward,
              from: 'system',
              to: wallet.address,
              timestamp: new Date(),
              status: 'confirmed',
              description: `${mission.title} 미션 보상`,
            });
          }
          
          if (ctaTokenReward) {
            wallet.tokenBalances.cta += ctaTokenReward;
            
            // 트랜잭션 기록 추가
            wallet.transactions.push({
              type: 'reward',
              token: 'CTA',
              amount: ctaTokenReward,
              from: 'system',
              to: wallet.address,
              timestamp: new Date(),
              status: 'confirmed',
              description: `${mission.title} 미션 보상`,
            });
          }
          
          await wallet.save();
        }
      }
      
      // NFT 보상 지급 (필요한 경우)
      if (mission.rewards.nft && mission.rewards.nft.enabled) {
        // 실제로는 NFT 민팅 로직 필요
        // ...
      }
      
      // 활동 기록
      await Activity.create({
        user: userId,
        type: 'mission_completed',
        data: {
          missionId: id,
          missionTitle: mission.title,
          missionType: mission.type,
          score: aiEvaluation.score,
          rewards: {
            xp: xpReward,
            nestToken: nestTokenReward,
            ctaToken: ctaTokenReward,
          },
        },
        rewards: {
          xp: xpReward,
          nestToken: nestTokenReward,
          ctaToken: ctaTokenReward,
        },
        relatedTo: {
          model: 'Mission',
          id: mission._id,
        },
        metadata: {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });
      
      return res.status(200).json({
        success: true,
        data: {
          participation,
          evaluation: {
            score: aiEvaluation.score,
            feedback: aiEvaluation.feedback,
          },
          rewards: {
            xp: xpReward,
            nestToken: nestTokenReward,
            ctaToken: ctaTokenReward,
          },
        },
        message: '미션이 제출되고 자동 평가되었습니다.',
      });
    }
    
    // 일반 미션인 경우 (관리자 평가 대기)
    // 활동 기록
    await Activity.create({
      user: userId,
      type: 'mission_submitted',
      data: {
        missionId: id,
        missionTitle: mission.title,
        missionType: mission.type,
      },
      relatedTo: {
        model: 'Mission',
        id: mission._id,
      },
      metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
    
    res.status(200).json({
      success: true,
      data: participation,
      message: '미션이 제출되었습니다. 평가 후 보상이 지급됩니다.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 미션 참여자 목록 조회
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const getMissionParticipants = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // 페이지네이션
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    
    // 상태 필터링
    const status = req.query.status;
    
    // 쿼리 생성
    const query = { mission: id };
    if (status) query.status = status;
    
    // 참여자 목록 조회
    const participants = await MissionParticipation.find(query)
      .sort({ startedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name profileImage level');
    
    // 총 개수 조회
    const total = await MissionParticipation.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: participants,
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
 * 미션 통계 조회
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const getMissionStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // 미션 정보 조회
    const mission = await Mission.findById(id);
    
    if (!mission) {
      const error = new Error('미션을 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }
    
    // 참여자 통계
    const stats = await MissionParticipation.getMissionCompletionStats(id);
    
    // 통계 정보 반환
    res.status(200).json({
      success: true,
      data: {
        mission: {
          _id: mission._id,
          title: mission.title,
          type: mission.type,
          difficulty: mission.difficulty,
          status: mission.status,
          startDate: mission.startDate,
          endDate: mission.endDate,
        },
        stats: {
          ...mission.stats,
          participants: stats,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// 관리자 전용 컨트롤러 함수

/**
 * 새 미션 생성
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const createMission = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const missionData = req.body;
    
    // 미션 생성
    const mission = new Mission({
      ...missionData,
      creator: userId,
      // 기본값 설정
      status: missionData.status || 'draft',
      startDate: missionData.startDate || new Date(),
      stats: {
        participantCount: 0,
        completionCount: 0,
        totalTokensRewarded: {
          nest: 0,
          cta: 0,
        },
        totalXpRewarded: 0,
        averageCompletionTime: 0,
      },
    });
    
    await mission.save();
    
    // 활동 기록
    await Activity.create({
      user: userId,
      type: 'custom',
      data: {
        action: 'mission_created',
        missionId: mission._id,
        missionTitle: mission.title,
      },
      relatedTo: {
        model: 'Mission',
        id: mission._id,
      },
      metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
    
    res.status(201).json({
      success: true,
      data: mission,
      message: '미션이 생성되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 미션 업데이트
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const updateMission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const updateData = req.body;
    
    // 미션 정보 조회
    const mission = await Mission.findById(id);
    
    if (!mission) {
      const error = new Error('미션을 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }
    
    // 이미 활성화된 미션인 경우 중요 필드 수정 불가
    if (mission.status === 'active' && updateData.status !== 'cancelled') {
      // 수정 가능한 필드만 추출
      const allowedUpdates = [
        'title',
        'description',
        'imageUrl',
        'tags',
        'endDate',
      ];
      
      // 허용되지 않은 필드 제거
      Object.keys(updateData).forEach(key => {
        if (!allowedUpdates.includes(key)) {
          delete updateData[key];
        }
      });
    }
    
    // 미션 업데이트
    Object.keys(updateData).forEach(key => {
      mission[key] = updateData[key];
    });
    
    await mission.save();
    
    // 활동 기록
    await Activity.create({
      user: userId,
      type: 'custom',
      data: {
        action: 'mission_updated',
        missionId: mission._id,
        missionTitle: mission.title,
        updatedFields: Object.keys(updateData),
      },
      relatedTo: {
        model: 'Mission',
        id: mission._id,
      },
      metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
    
    res.status(200).json({
      success: true,
      data: mission,
      message: '미션이 업데이트되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 미션 삭제
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const deleteMission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // 미션 정보 조회
    const mission = await Mission.findById(id);
    
    if (!mission) {
      const error = new Error('미션을 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }
    
    // 활성화된 미션이거나 참여자가 있는 경우 삭제 불가
    if (mission.status === 'active') {
      const error = new Error('활성화된 미션은 삭제할 수 없습니다. 대신 취소 상태로 변경하세요.');
      error.status = 400;
      throw error;
    }
    
    const participantCount = await MissionParticipation.countDocuments({
      mission: id,
    });
    
    if (participantCount > 0) {
      const error = new Error('이미 참여자가 있는 미션은 삭제할 수 없습니다. 대신 취소 상태로 변경하세요.');
      error.status = 400;
      throw error;
    }
    
    // 미션 삭제
    await mission.remove();
    
    // 활동 기록
    await Activity.create({
      user: userId,
      type: 'custom',
      data: {
        action: 'mission_deleted',
        missionId: id,
        missionTitle: mission.title,
      },
      metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
    
    res.status(200).json({
      success: true,
      message: '미션이 삭제되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 미션 상태 업데이트
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const updateMissionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { status } = req.body;
    
    // 미션 정보 조회
    const mission = await Mission.findById(id);
    
    if (!mission) {
      const error = new Error('미션을 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }
    
    // 현재 상태와 같은 경우 변경 불필요
    if (mission.status === status) {
      return res.status(200).json({
        success: true,
        data: mission,
        message: '미션 상태가 이미 해당 상태입니다.',
      });
    }
    
    // 특정 상태 변경에 대한 제약 조건
    if (mission.status === 'completed' && status !== 'cancelled') {
      const error = new Error('완료된 미션의 상태는 변경할 수 없습니다.');
      error.status = 400;
      throw error;
    }
    
    // 상태 업데이트
    mission.status = status;
    
    // 상태가 활성화로 변경된 경우 시작 시간 설정
    if (status === 'active' && !mission.startDate) {
      mission.startDate = new Date();
    }
    
    // 상태가 완료로 변경된 경우 종료 시간 설정
    if (status === 'completed' && !mission.endDate) {
      mission.endDate = new Date();
    }
    
    await mission.save();
    
    // 활동 기록
    await Activity.create({
      user: userId,
      type: 'custom',
      data: {
        action: 'mission_status_updated',
        missionId: mission._id,
        missionTitle: mission.title,
        previousStatus: mission.status,
        newStatus: status,
      },
      relatedTo: {
        model: 'Mission',
        id: mission._id,
      },
      metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
    
    res.status(200).json({
      success: true,
      data: mission,
      message: `미션 상태가 '${status}'(으)로 변경되었습니다.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 미션 제출물 평가
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const evaluateMissionSubmission = async (req, res, next) => {
  try {
    const { id, participationId } = req.params;
    const userId = req.user._id;
    const { score, feedback, approved } = req.body;
    
    // 참여 정보 조회
    const participation = await MissionParticipation.findOne({
      _id: participationId,
      mission: id,
    }).populate('user');
    
    if (!participation) {
      const error = new Error('미션 참여 정보를 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }
    
    // 제출 상태인지 확인
    if (participation.status !== 'submitted') {
      const error = new Error('제출된 미션만 평가할 수 있습니다.');
      error.status = 400;
      throw error;
    }
    
    // 미션 정보 조회
    const mission = await Mission.findById(id);
    
    if (!mission) {
      const error = new Error('미션을 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }
    
    // 승인 여부에 따라 처리
    if (approved === false) {
      // 반려 처리
      await participation.rejectMission(feedback || '미션 요구사항을 충족하지 않습니다.');
      
      // 활동 기록
      await Activity.create({
        user: participation.user._id,
        type: 'custom',
        data: {
          action: 'mission_rejected',
          missionId: mission._id,
          missionTitle: mission.title,
          feedback,
          evaluatedBy: userId,
        },
        relatedTo: {
          model: 'Mission',
          id: mission._id,
        },
        metadata: {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });
      
      return res.status(200).json({
        success: true,
        data: participation,
        message: '미션이 반려되었습니다.',
      });
    }
    
    // 승인 처리
    // 보상 계산
    const xpReward = mission.rewards.xp;
    const nestTokenReward = mission.rewards.nestToken;
    const ctaTokenReward = mission.rewards.ctaToken;
    
    // 완료 처리
    await participation.completeMission(
      {
        score,
        feedback: feedback || '좋은 결과물입니다!',
        evaluatedBy: userId,
        evaluatedAt: new Date(),
      },
      {
        xp: xpReward,
        nestToken: nestTokenReward,
        ctaToken: ctaTokenReward,
      }
    );
    
    // 사용자 XP 추가
    await participation.user.addXP(xpReward);
    
    // 미션 통계 업데이트
    mission.stats.completionCount += 1;
    mission.stats.totalXpRewarded += xpReward;
    mission.stats.totalTokensRewarded.nest += nestTokenReward || 0;
    mission.stats.totalTokensRewarded.cta += ctaTokenReward || 0;
    
    // 평균 완료 시간 업데이트
    if (participation.completionTime) {
      if (mission.stats.averageCompletionTime === 0) {
        mission.stats.averageCompletionTime = participation.completionTime;
      } else {
        mission.stats.averageCompletionTime = Math.floor(
          (mission.stats.averageCompletionTime * (mission.stats.completionCount - 1) +
            participation.completionTime) /
            mission.stats.completionCount
        );
      }
    }
    
    await mission.save();
    
    // 토큰 보상 지급 (실제로는 블록체인 트랜잭션 필요)
    if (nestTokenReward || ctaTokenReward) {
      const wallet = await Wallet.findOne({ user: participation.user._id });
      
      if (wallet) {
        // 지갑 잔액 업데이트
        if (nestTokenReward) {
          wallet.tokenBalances.nest += nestTokenReward;
          
          // 트랜잭션 기록 추가
          wallet.transactions.push({
            type: 'reward',
            token: 'NEST',
            amount: nestTokenReward,
            from: 'system',
            to: wallet.address,
            timestamp: new Date(),
            status: 'confirmed',
            description: `${mission.title} 미션 보상`,
          });
        }
        
        if (ctaTokenReward) {
          wallet.tokenBalances.cta += ctaTokenReward;
          
          // 트랜잭션 기록 추가
          wallet.transactions.push({
            type: 'reward',
            token: 'CTA',
            amount: ctaTokenReward,
            from: 'system',
            to: wallet.address,
            timestamp: new Date(),
            status: 'confirmed',
            description: `${mission.title} 미션 보상`,
          });
        }
        
        await wallet.save();
      }
    }
    
    // NFT 보상 지급 (필요한 경우)
    if (mission.rewards.nft && mission.rewards.nft.enabled) {
      // 실제로는 NFT 민팅 로직 필요
      // ...
    }
    
    // 활동 기록
    await Activity.create({
      user: participation.user._id,
      type: 'mission_completed',
      data: {
        missionId: id,
        missionTitle: mission.title,
        missionType: mission.type,
        score,
        evaluatedBy: userId,
        rewards: {
          xp: xpReward,
          nestToken: nestTokenReward,
          ctaToken: ctaTokenReward,
        },
      },
      rewards: {
        xp: xpReward,
        nestToken: nestTokenReward,
        ctaToken: ctaTokenReward,
      },
      relatedTo: {
        model: 'Mission',
        id: mission._id,
      },
      metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
    
    res.status(200).json({
      success: true,
      data: {
        participation,
        evaluation: {
          score,
          feedback: feedback || '좋은 결과물입니다!',
        },
        rewards: {
          xp: xpReward,
          nestToken: nestTokenReward,
          ctaToken: ctaTokenReward,
        },
      },
      message: '미션 평가가 완료되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMissions,
  getActiveMissions,
  getRecommendedMissions,
  getMissionById,
  startMission,
  submitMission,
  getMissionParticipants,
  getMissionStats,
  createMission,
  updateMission,
  deleteMission,
  updateMissionStatus,
  evaluateMissionSubmission,
};
