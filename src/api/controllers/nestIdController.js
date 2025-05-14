/**
 * @file Nest ID 컨트롤러
 * @description Nest ID(.nest 도메인) 관련 요청 처리 컨트롤러
 */

const User = require('../../models/user');
const Wallet = require('../../models/wallet');
const Activity = require('../../models/activity');
const walletService = require('../../blockchain/walletService');
const logger = require('../../utils/logger');

/**
 * 내 Nest ID 조회
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const getMyNestId = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // 지갑 정보 조회
    const wallet = await Wallet.findOne({ user: userId });
    
    if (!wallet) {
      const error = new Error('지갑을 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }
    
    // 온체인에서 Nest ID 조회
    const nestId = await walletService.getNestId(wallet.address);
    
    // 지갑 정보 업데이트 (Nest ID가 있는 경우)
    if (nestId && (!wallet.nestId || wallet.nestId !== nestId)) {
      wallet.nestId = nestId;
      await wallet.save();
      
      // 사용자 정보도 업데이트
      await User.findByIdAndUpdate(userId, {
        'wallet.nestId': nestId,
      });
    }
    
    // Nest ID가 없는 경우
    if (!nestId) {
      return res.status(200).json({
        success: true,
        data: {
          nestId: null,
          registered: false,
        },
        message: '등록된 Nest ID가 없습니다.',
      });
    }
    
    // ID 등록 정보 조회
    const registrationInfo = await walletService.getNestIdInfo(nestId.replace('.nest', ''));
    
    res.status(200).json({
      success: true,
      data: {
        nestId,
        registered: true,
        expiresAt: registrationInfo?.expiresAt,
        registeredAt: registrationInfo?.registeredAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Nest ID 등록
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const registerNestId = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { name } = req.body;
    
    // 소문자 변환
    const lowercaseName = name.toLowerCase();
    
    // 지갑 정보 조회
    const wallet = await Wallet.findOne({ user: userId });
    
    if (!wallet) {
      const error = new Error('지갑을 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }
    
    // 지갑 상태 확인
    if (wallet.status !== 'active') {
      const error = new Error('활성화된 지갑이 아닙니다.');
      error.status = 403;
      throw error;
    }
    
    // 이미 Nest ID가 있는지 확인
    const existingNestId = await walletService.getNestId(wallet.address);
    
    if (existingNestId) {
      const error = new Error('이미 Nest ID가 등록되어 있습니다.');
      error.status = 400;
      throw error;
    }
    
    // 이미 사용 중인 이름인지 확인
    const isAvailable = await walletService.checkNestIdAvailability(lowercaseName);
    
    if (!isAvailable) {
      const error = new Error('이미 사용 중인 이름입니다.');
      error.status = 400;
      throw error;
    }
    
    // 제한된 이름인지 확인
    const isRestricted = await walletService.isNestIdRestricted(lowercaseName);
    
    if (isRestricted) {
      const error = new Error('등록할 수 없는 이름입니다.');
      error.status = 400;
      throw error;
    }
    
    // TODO: 실제 개발 시에는 비공개 키 처리 로직 보안 강화 필요
    // 테스트 환경에서는 임시로 관리자 지갑 비공개 키 사용
    const privateKey = process.env.ADMIN_WALLET_PRIVATE_KEY; // 실제 구현에서 수정 필요
    
    // Nest ID 등록 실행
    const result = await walletService.registerNestId(privateKey, lowercaseName);
    
    // 지갑 정보 업데이트
    wallet.nestId = result.nestId;
    await wallet.save();
    
    // 사용자 정보 업데이트
    await User.findByIdAndUpdate(userId, {
      'wallet.nestId': result.nestId,
    });
    
    // 활동 기록
    await Activity.create({
      user: userId,
      type: 'nestid_registered',
      data: {
        nestId: result.nestId,
        txHash: result.txHash,
      },
      relatedTo: {
        model: 'Wallet',
        id: wallet._id,
      },
      metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
    
    res.status(201).json({
      success: true,
      data: {
        nestId: result.nestId,
        txHash: result.txHash,
        timestamp: new Date(),
      },
      message: 'Nest ID가 등록되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Nest ID 사용 가능 여부 확인
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const checkNestIdAvailability = async (req, res, next) => {
  try {
    const { name } = req.params;
    
    // 소문자 변환
    const lowercaseName = name.toLowerCase();
    
    // 이미 사용 중인 이름인지 확인
    const isAvailable = await walletService.checkNestIdAvailability(lowercaseName);
    
    if (!isAvailable) {
      return res.status(200).json({
        success: true,
        data: {
          name: lowercaseName,
          isAvailable: false,
          reason: 'already_registered',
        },
        message: '이미 사용 중인 이름입니다.',
      });
    }
    
    // 제한된 이름인지 확인
    const isRestricted = await walletService.isNestIdRestricted(lowercaseName);
    
    if (isRestricted) {
      return res.status(200).json({
        success: true,
        data: {
          name: lowercaseName,
          isAvailable: false,
          reason: 'restricted',
        },
        message: '등록할 수 없는 이름입니다.',
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        name: lowercaseName,
        isAvailable: true,
        fullId: `${lowercaseName}.nest`,
      },
      message: '사용 가능한 이름입니다.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Nest ID로 지갑 주소 조회
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const getAddressByNestId = async (req, res, next) => {
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
    
    res.status(200).json({
      success: true,
      data: {
        nestId,
        address,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 지갑 주소로 Nest ID 조회
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const getNestIdByAddress = async (req, res, next) => {
  try {
    const { address } = req.params;
    
    // 온체인에서 Nest ID 조회
    const nestId = await walletService.getNestId(address);
    
    if (!nestId) {
      return res.status(200).json({
        success: true,
        data: {
          address,
          nestId: null,
          registered: false,
        },
        message: '등록된 Nest ID가 없습니다.',
      });
    }
    
    // ID 등록 정보 조회
    const registrationInfo = await walletService.getNestIdInfo(nestId.replace('.nest', ''));
    
    res.status(200).json({
      success: true,
      data: {
        address,
        nestId,
        registered: true,
        expiresAt: registrationInfo?.expiresAt,
        registeredAt: registrationInfo?.registeredAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 내 Nest ID 갱신 (만료 기간 연장)
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const renewMyNestId = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // 지갑 정보 조회
    const wallet = await Wallet.findOne({ user: userId });
    
    if (!wallet) {
      const error = new Error('지갑을 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }
    
    // 지갑 상태 확인
    if (wallet.status !== 'active') {
      const error = new Error('활성화된 지갑이 아닙니다.');
      error.status = 403;
      throw error;
    }
    
    // Nest ID가 있는지 확인
    const nestId = await walletService.getNestId(wallet.address);
    
    if (!nestId) {
      const error = new Error('등록된 Nest ID가 없습니다.');
      error.status = 404;
      throw error;
    }
    
    // Nest ID에서 이름 부분 추출
    const name = nestId.replace('.nest', '');
    
    // TODO: 실제 개발 시에는 비공개 키 처리 로직 보안 강화 필요
    // 테스트 환경에서는 임시로 관리자 지갑 비공개 키 사용
    const privateKey = process.env.ADMIN_WALLET_PRIVATE_KEY; // 실제 구현에서 수정 필요
    
    // Nest ID 갱신 실행
    const result = await walletService.renewNestId(privateKey, name);
    
    // 활동 기록
    await Activity.create({
      user: userId,
      type: 'custom',
      data: {
        action: 'nestid_renewed',
        nestId,
        txHash: result.txHash,
      },
      relatedTo: {
        model: 'Wallet',
        id: wallet._id,
      },
      metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
    
    res.status(200).json({
      success: true,
      data: {
        nestId,
        txHash: result.txHash,
        expiresAt: result.expiresAt,
      },
      message: 'Nest ID가 갱신되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 내 Nest ID 해제
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const releaseMyNestId = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // 지갑 정보 조회
    const wallet = await Wallet.findOne({ user: userId });
    
    if (!wallet) {
      const error = new Error('지갑을 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }
    
    // 지갑 상태 확인
    if (wallet.status !== 'active') {
      const error = new Error('활성화된 지갑이 아닙니다.');
      error.status = 403;
      throw error;
    }
    
    // Nest ID가 있는지 확인
    const nestId = await walletService.getNestId(wallet.address);
    
    if (!nestId) {
      const error = new Error('등록된 Nest ID가 없습니다.');
      error.status = 404;
      throw error;
    }
    
    // Nest ID에서 이름 부분 추출
    const name = nestId.replace('.nest', '');
    
    // TODO: 실제 개발 시에는 비공개 키 처리 로직 보안 강화 필요
    // 테스트 환경에서는 임시로 관리자 지갑 비공개 키 사용
    const privateKey = process.env.ADMIN_WALLET_PRIVATE_KEY; // 실제 구현에서 수정 필요
    
    // Nest ID 해제 실행
    const result = await walletService.releaseNestId(privateKey, name);
    
    // 지갑 정보 업데이트
    wallet.nestId = null;
    await wallet.save();
    
    // 사용자 정보 업데이트
    await User.findByIdAndUpdate(userId, {
      'wallet.nestId': null,
    });
    
    // 활동 기록
    await Activity.create({
      user: userId,
      type: 'custom',
      data: {
        action: 'nestid_released',
        nestId,
        txHash: result.txHash,
      },
      relatedTo: {
        model: 'Wallet',
        id: wallet._id,
      },
      metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
    
    res.status(200).json({
      success: true,
      data: {
        txHash: result.txHash,
      },
      message: 'Nest ID가 해제되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 모든 Nest ID 목록 조회 (관리자 전용)
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const getAllNestIds = async (req, res, next) => {
  try {
    // 페이지네이션
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    
    // 필터링
    const { search } = req.query;
    
    // DB에서 nestId가 있는 모든 지갑 조회
    const query = { nestId: { $ne: null } };
    
    if (search) {
      query.nestId = { $regex: search, $options: 'i' };
    }
    
    const wallets = await Wallet.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email');
    
    // 총 개수 조회
    const total = await Wallet.countDocuments(query);
    
    // 결과 가공
    const nestIds = wallets.map(wallet => ({
      nestId: wallet.nestId,
      address: wallet.address,
      user: wallet.user,
      createdAt: wallet.createdAt,
    }));
    
    res.status(200).json({
      success: true,
      data: nestIds,
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
 * Nest ID 제한 설정 (예약/금지) (관리자 전용)
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const restrictNestId = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { name, isRestricted } = req.body;
    
    // 소문자 변환
    const lowercaseName = name.toLowerCase();
    
    // TODO: 실제 개발 시에는 비공개 키 처리 로직 보안 강화 필요
    // 테스트 환경에서는 임시로 관리자 지갑 비공개 키 사용
    const privateKey = process.env.ADMIN_WALLET_PRIVATE_KEY; // 실제 구현에서 수정 필요
    
    // Nest ID 제한 설정
    const result = await walletService.setNameRestriction(privateKey, lowercaseName, isRestricted);
    
    // 활동 기록
    await Activity.create({
      user: userId,
      type: 'custom',
      data: {
        action: isRestricted ? 'nestid_restricted' : 'nestid_unrestricted',
        name: lowercaseName,
        txHash: result.txHash,
      },
      metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
    
    res.status(200).json({
      success: true,
      data: {
        name: lowercaseName,
        isRestricted,
        txHash: result.txHash,
      },
      message: `Nest ID가 ${isRestricted ? '제한' : '제한 해제'}되었습니다.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 특정 사용자를 위한 Nest ID 등록 (관리자 전용)
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const registerNestIdForUser = async (req, res, next) => {
  try {
    const adminId = req.user._id;
    const { userId, name } = req.body;
    
    // 소문자 변환
    const lowercaseName = name.toLowerCase();
    
    // 사용자 정보 조회
    const user = await User.findById(userId);
    
    if (!user) {
      const error = new Error('사용자를 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }
    
    // 지갑 정보 조회
    const wallet = await Wallet.findOne({ user: userId });
    
    if (!wallet) {
      const error = new Error('지갑을 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }
    
    // 이미 Nest ID가 있는지 확인
    const existingNestId = await walletService.getNestId(wallet.address);
    
    if (existingNestId) {
      const error = new Error('이미 Nest ID가 등록되어 있습니다.');
      error.status = 400;
      throw error;
    }
    
    // 이미 사용 중인 이름인지 확인
    const isAvailable = await walletService.checkNestIdAvailability(lowercaseName);
    
    if (!isAvailable) {
      const error = new Error('이미 사용 중인 이름입니다.');
      error.status = 400;
      throw error;
    }
    
    // 제한된 이름인지 확인
    const isRestricted = await walletService.isNestIdRestricted(lowercaseName);
    
    if (isRestricted) {
      const error = new Error('등록할 수 없는 이름입니다.');
      error.status = 400;
      throw error;
    }
    
    // TODO: 실제 개발 시에는 비공개 키 처리 로직 보안 강화 필요
    // 테스트 환경에서는 임시로 관리자 지갑 비공개 키 사용
    const privateKey = process.env.ADMIN_WALLET_PRIVATE_KEY; // 실제 구현에서 수정 필요
    
    // Nest ID 등록 실행
    const result = await walletService.registerNestId(privateKey, lowercaseName);
    
    // 지갑 정보 업데이트
    wallet.nestId = result.nestId;
    await wallet.save();
    
    // 사용자 정보 업데이트
    user.wallet.nestId = result.nestId;
    await user.save();
    
    // 활동 기록 (관리자)
    await Activity.create({
      user: adminId,
      type: 'custom',
      data: {
        action: 'admin_registered_nestid',
        forUser: userId,
        nestId: result.nestId,
        txHash: result.txHash,
      },
      metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
    
    // 활동 기록 (사용자)
    await Activity.create({
      user: userId,
      type: 'nestid_registered',
      data: {
        nestId: result.nestId,
        txHash: result.txHash,
        byAdmin: adminId,
      },
      relatedTo: {
        model: 'Wallet',
        id: wallet._id,
      },
      metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
    
    res.status(201).json({
      success: true,
      data: {
        userId,
        nestId: result.nestId,
        txHash: result.txHash,
        timestamp: new Date(),
      },
      message: '사용자를 위한 Nest ID가 등록되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNestId,
  registerNestId,
  checkNestIdAvailability,
  getAddressByNestId,
  getNestIdByAddress,
  renewMyNestId,
  releaseMyNestId,
  getAllNestIds,
  restrictNestId,
  registerNestIdForUser,
};
