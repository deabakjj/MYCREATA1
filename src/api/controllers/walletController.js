/**
 * @file 지갑 컨트롤러
 * @description 지갑 관련 요청 처리 컨트롤러
 */

const User = require('../../models/user');
const Wallet = require('../../models/wallet');
const Activity = require('../../models/activity');
const walletService = require('../../blockchain/walletService');
const logger = require('../../utils/logger');
const securityManager = require('../../utils/security');

/**
 * 현재 사용자의 지갑 정보 조회
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const getMyWallet = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // 지갑 정보 조회
    const wallet = await Wallet.findOne({ user: userId });
    
    if (!wallet) {
      const error = new Error('지갑을 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }
    
    // 온체인 지갑 정보 조회
    const nestId = await walletService.getNestId(wallet.address);
    
    res.status(200).json({
      success: true,
      data: {
        ...wallet.toObject(),
        nestId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 지갑 잔액 조회
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const getWalletBalance = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // 지갑 정보 조회
    const wallet = await Wallet.findOne({ user: userId });
    
    if (!wallet) {
      const error = new Error('지갑을 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }
    
    // 블록체인 상의 실시간 잔액 조회
    const ctaBalance = await walletService.getTokenBalance(wallet.address);
    
    // NEST 토큰 컨트랙트 주소
    const nestTokenAddress = process.env.NODE_ENV === 'production'
      ? process.env.NEST_TOKEN_ADDRESS
      : process.env.TESTNET_NEST_TOKEN_ADDRESS;
    
    const nestBalance = await walletService.getTokenBalance(wallet.address, nestTokenAddress);
    
    // 데이터베이스 잔액 업데이트
    wallet.tokenBalances = {
      cta: parseFloat(ctaBalance),
      nest: parseFloat(nestBalance),
    };
    
    await wallet.save();
    
    res.status(200).json({
      success: true,
      data: {
        cta: parseFloat(ctaBalance),
        nest: parseFloat(nestBalance),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 지갑 트랜잭션 내역 조회
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const getTransactions = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // 페이지네이션
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    
    // 지갑 정보 조회
    const wallet = await Wallet.findOne({ user: userId });
    
    if (!wallet) {
      const error = new Error('지갑을 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }
    
    // 트랜잭션 내역 조회 (최신순)
    const transactions = wallet.transactions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(skip, skip + limit);
    
    const total = wallet.transactions.length;
    
    res.status(200).json({
      success: true,
      data: transactions,
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
 * 지갑 NFT 목록 조회
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const getNFTs = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // 지갑 정보 조회
    const wallet = await Wallet.findOne({ user: userId });
    
    if (!wallet) {
      const error = new Error('지갑을 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }
    
    // NFT 목록 조회 (최신순)
    const nfts = wallet.nfts.sort((a, b) => b.acquiredAt - a.acquiredAt);
    
    res.status(200).json({
      success: true,
      data: nfts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 토큰 스왑 (CTA <-> NEST)
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const swapTokens = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { fromToken, amount } = req.body;
    
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
    
    // 화이트리스트 확인 (수수료 제로 스왑)
    if (process.env.WHITELIST_ONLY_SWAP === 'true' && !wallet.isWhitelisted) {
      const error = new Error('화이트리스트에 등록된 지갑만 스왑이 가능합니다.');
      error.status = 403;
      throw error;
    }
    
    // 일일 스왑 한도 확인
    const limitCheck = wallet.checkDailySwapLimit(fromToken === 'CTA' ? amount : amount * 0.001);
    
    if (!limitCheck.canSwap) {
      const error = new Error('일일 스왑 한도를 초과했습니다.');
      error.status = 403;
      throw error;
    }
    
    // 잔액 확인
    if (fromToken === 'CTA' && wallet.tokenBalances.cta < amount) {
      const error = new Error('CTA 잔액이 부족합니다.');
      error.status = 400;
      throw error;
    }
    
    if (fromToken === 'NEST' && wallet.tokenBalances.nest < amount) {
      const error = new Error('NEST 잔액이 부족합니다.');
      error.status = 400;
      throw error;
    }
    
    // 비공개 키 처리 로직 수정
    const handlePrivateKey = async (privateKey, password) => {
      try {
        // 비공개 키 검증
        if (!securityManager.validatePrivateKey(privateKey)) {
          throw new Error('유효하지 않은 비공개 키 형식입니다.');
        }

        // 비공개 키 암호화
        const encryptedData = securityManager.encryptPrivateKey(privateKey, password);
        
        return encryptedData;
      } catch (error) {
        logger.error('비공개 키 처리 실패:', error);
        throw error;
      }
    };
    
    // 비공개 키 처리
    const encryptedData = await handlePrivateKey(req.body.privateKey, req.body.password);
    
    // 비공개 키 저장
    wallet.privateKey = encryptedData;
    
    await wallet.save();
    
    res.status(200).json({
      success: true,
      data: {
        ...wallet.toObject(),
      },
    });
  } catch (error) {
    next(error);
  }
};