/**
 * 분석 API 컨트롤러
 * 
 * 다양한 분석 모듈에 접근하여 플랫폼 데이터 분석 결과를 제공합니다.
 */

const userConversion = require('../../analytics/userConversion');
const walletRetention = require('../../analytics/walletRetention');
const tokenExchange = require('../../analytics/tokenExchange');
const xpAccumulation = require('../../analytics/xpAccumulation');
const nftOwnership = require('../../analytics/nftOwnership');
const { responseHandler } = require('../../utils/responseHandler');
const logger = require('../../utils/logger');

/**
 * 기간 옵션 객체 생성
 * @param {Object} req - 요청 객체
 * @returns {Object} 날짜 범위 옵션
 */
const getPeriodOptions = (req) => {
  const { startDate, endDate } = req.query;
  const options = {};
  
  if (startDate) {
    options.startDate = new Date(startDate);
  }
  
  if (endDate) {
    options.endDate = new Date(endDate);
  }
  
  return options;
};

/**
 * 사용자 전환률 지표 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getUserConversion = async (req, res) => {
  try {
    const options = getPeriodOptions(req);
    const metrics = await userConversion.calculateConversionMetrics(options);
    
    return responseHandler.success(res, metrics);
  } catch (error) {
    logger.error('사용자 전환률 지표 조회 중 오류 발생:', error);
    return responseHandler.error(res, error);
  }
};

/**
 * 사용자 전환률 추세 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getUserConversionTrends = async (req, res) => {
  try {
    const { intervalType, periods } = req.query;
    const options = {
      intervalType: intervalType || 'month',
      periods: periods ? parseInt(periods) : 6
    };
    
    const trends = await userConversion.analyzeConversionTrends(options);
    
    return responseHandler.success(res, trends);
  } catch (error) {
    logger.error('사용자 전환률 추세 조회 중 오류 발생:', error);
    return responseHandler.error(res, error);
  }
};

/**
 * 사용자 세그먼트별 전환률 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getUserConversionBySegment = async (req, res) => {
  try {
    const options = getPeriodOptions(req);
    const segmentData = await userConversion.analyzeSegmentConversion(options);
    
    return responseHandler.success(res, segmentData);
  } catch (error) {
    logger.error('사용자 세그먼트별 전환률 조회 중 오류 발생:', error);
    return responseHandler.error(res, error);
  }
};

/**
 * 전환 퍼널 분석 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getConversionFunnel = async (req, res) => {
  try {
    const options = getPeriodOptions(req);
    const funnelData = await userConversion.analyzeConversionFunnel(options);
    
    return responseHandler.success(res, funnelData);
  } catch (error) {
    logger.error('전환 퍼널 분석 조회 중 오류 발생:', error);
    return responseHandler.error(res, error);
  }
};

/**
 * 지갑 유지율 지표 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getWalletRetention = async (req, res) => {
  try {
    const options = getPeriodOptions(req);
    
    // 유지 기간 추가
    if (req.query.retentionDays) {
      options.retentionDays = parseInt(req.query.retentionDays);
    }
    
    const metrics = await walletRetention.calculateRetentionMetrics(options);
    
    return responseHandler.success(res, metrics);
  } catch (error) {
    logger.error('지갑 유지율 지표 조회 중 오류 발생:', error);
    return responseHandler.error(res, error);
  }
};

/**
 * 보상 유형별 지갑 유지율 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getWalletRetentionByRewardType = async (req, res) => {
  try {
    const options = getPeriodOptions(req);
    
    // 유지 기간 추가
    if (req.query.retentionDays) {
      options.retentionDays = parseInt(req.query.retentionDays);
    }
    
    const metrics = await walletRetention.analyzeRetentionByRewardType(options);
    
    return responseHandler.success(res, metrics);
  } catch (error) {
    logger.error('보상 유형별 지갑 유지율 조회 중 오류 발생:', error);
    return responseHandler.error(res, error);
  }
};

/**
 * 활동 패턴별 지갑 유지율 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getWalletRetentionByActivityPattern = async (req, res) => {
  try {
    const options = getPeriodOptions(req);
    const metrics = await walletRetention.analyzeRetentionByActivityPattern(options);
    
    return responseHandler.success(res, metrics);
  } catch (error) {
    logger.error('활동 패턴별 지갑 유지율 조회 중 오류 발생:', error);
    return responseHandler.error(res, error);
  }
};

/**
 * 토큰 교환 지표 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getTokenExchange = async (req, res) => {
  try {
    const options = getPeriodOptions(req);
    
    // 교환 방향 추가
    if (req.query.direction) {
      options.direction = req.query.direction;
    }
    
    const metrics = await tokenExchange.calculateExchangeMetrics(options);
    
    return responseHandler.success(res, metrics);
  } catch (error) {
    logger.error('토큰 교환 지표 조회 중 오류 발생:', error);
    return responseHandler.error(res, error);
  }
};

/**
 * 사용자 세그먼트별 토큰 교환 패턴 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getTokenExchangeByUserSegment = async (req, res) => {
  try {
    const options = getPeriodOptions(req);
    const metrics = await tokenExchange.analyzeExchangeByUserSegment(options);
    
    return responseHandler.success(res, metrics);
  } catch (error) {
    logger.error('사용자 세그먼트별 토큰 교환 패턴 조회 중 오류 발생:', error);
    return responseHandler.error(res, error);
  }
};

/**
 * 토큰 교환 금액 분포 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getTokenExchangeAmountDistribution = async (req, res) => {
  try {
    const options = getPeriodOptions(req);
    const metrics = await tokenExchange.analyzeExchangeAmountDistribution(options);
    
    return responseHandler.success(res, metrics);
  } catch (error) {
    logger.error('토큰 교환 금액 분포 조회 중 오류 발생:', error);
    return responseHandler.error(res, error);
  }
};

/**
 * 교환 이후 행동 패턴 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getPostExchangeBehavior = async (req, res) => {
  try {
    const options = getPeriodOptions(req);
    
    // 관찰 기간 추가
    if (req.query.daysAfter) {
      options.daysAfter = parseInt(req.query.daysAfter);
    }
    
    const metrics = await tokenExchange.analyzePostExchangeBehavior(options);
    
    return responseHandler.success(res, metrics);
  } catch (error) {
    logger.error('교환 이후 행동 패턴 조회 중 오류 발생:', error);
    return responseHandler.error(res, error);
  }
};

/**
 * XP 누적 지표 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getXpAccumulation = async (req, res) => {
  try {
    const options = getPeriodOptions(req);
    const metrics = await xpAccumulation.calculateXpMetrics(options);
    
    return responseHandler.success(res, metrics);
  } catch (error) {
    logger.error('XP 누적 지표 조회 중 오류 발생:', error);
    return responseHandler.error(res, error);
  }
};

/**
 * 사용자 세그먼트별 XP 누적 패턴 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getXpAccumulationByUserSegment = async (req, res) => {
  try {
    const options = getPeriodOptions(req);
    const metrics = await xpAccumulation.analyzeXpByUserSegment(options);
    
    return responseHandler.success(res, metrics);
  } catch (error) {
    logger.error('사용자 세그먼트별 XP 누적 패턴 조회 중 오류 발생:', error);
    return responseHandler.error(res, error);
  }
};

/**
 * 레벨 진행 속도 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getLevelProgression = async (req, res) => {
  try {
    const options = getPeriodOptions(req);
    const metrics = await xpAccumulation.analyzeLevelProgression(options);
    
    return responseHandler.success(res, metrics);
  } catch (error) {
    logger.error('레벨 진행 속도 조회 중 오류 발생:', error);
    return responseHandler.error(res, error);
  }
};

/**
 * 활동 유형별 XP 효율성 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getActivityEfficiency = async (req, res) => {
  try {
    const options = getPeriodOptions(req);
    const metrics = await xpAccumulation.analyzeActivityEfficiency(options);
    
    return responseHandler.success(res, metrics);
  } catch (error) {
    logger.error('활동 유형별 XP 효율성 조회 중 오류 발생:', error);
    return responseHandler.error(res, error);
  }
};

/**
 * NFT 보유 지표 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getNftOwnership = async (req, res) => {
  try {
    const options = getPeriodOptions(req);
    const metrics = await nftOwnership.calculateNftMetrics(options);
    
    return responseHandler.success(res, metrics);
  } catch (error) {
    logger.error('NFT 보유 지표 조회 중 오류 발생:', error);
    return responseHandler.error(res, error);
  }
};

/**
 * 사용자 세그먼트별 NFT 보유 패턴 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getNftOwnershipByUserSegment = async (req, res) => {
  try {
    const options = getPeriodOptions(req);
    const metrics = await nftOwnership.analyzeNftByUserSegment(options);
    
    return responseHandler.success(res, metrics);
  } catch (error) {
    logger.error('사용자 세그먼트별 NFT 보유 패턴 조회 중 오류 발생:', error);
    return responseHandler.error(res, error);
  }
};

/**
 * NFT 보유와 사용자 참여도 상관관계 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getNftEngagementCorrelation = async (req, res) => {
  try {
    const options = getPeriodOptions(req);
    const metrics = await nftOwnership.analyzeNftEngagementCorrelation(options);
    
    return responseHandler.success(res, metrics);
  } catch (error) {
    logger.error('NFT 보유와 사용자 참여도 상관관계 조회 중 오류 발생:', error);
    return responseHandler.error(res, error);
  }
};

/**
 * 종합 분석 대시보드 데이터 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getDashboardOverview = async (req, res) => {
  try {
    const options = getPeriodOptions(req);
    
    // 병렬로 모든 주요 지표 조회
    const [
      conversionMetrics,
      retentionMetrics,
      exchangeMetrics,
      xpMetrics,
      nftMetrics
    ] = await Promise.all([
      userConversion.calculateConversionMetrics(options),
      walletRetention.calculateRetentionMetrics(options),
      tokenExchange.calculateExchangeMetrics(options),
      xpAccumulation.calculateXpMetrics(options),
      nftOwnership.calculateNftMetrics(options)
    ]);
    
    // 통합 대시보드 데이터 생성
    const dashboardData = {
      userConversion: {
        totalConversionRate: conversionMetrics.summary.totalConversionRate,
        totalUsers: conversionMetrics.summary.totalUsers,
        usersWithWallet: conversionMetrics.summary.usersWithWallet,
        usersWithBlockchainActivity: conversionMetrics.summary.usersWithBlockchainActivity
      },
      walletRetention: {
        retentionRate: retentionMetrics.summary.retentionRate,
        longTermRetentionRate: retentionMetrics.summary.longTermRetentionRate,
        activeWalletRate: retentionMetrics.summary.activeWalletRate
      },
      tokenExchange: {
        conversionRatio: exchangeMetrics.summary.conversionRatio,
        netFlow: exchangeMetrics.summary.netFlow,
        netFlowDirection: exchangeMetrics.summary.netFlowDirection
      },
      xpAccumulation: {
        totalXp: xpMetrics.summary.totalXp,
        avgXpPerUser: xpMetrics.summary.totalXp / xpMetrics.summary.uniqueUsers,
        totalActivities: xpMetrics.summary.totalActivities
      },
      nftOwnership: {
        totalNfts: nftMetrics.summary.totalNfts,
        avgNftPerOwner: nftMetrics.summary.avgNftPerOwner,
        ownershipRate: nftMetrics.summary.ownershipRate
      },
      period: options.startDate && options.endDate ? {
        startDate: options.startDate,
        endDate: options.endDate
      } : {
        startDate: 'All time',
        endDate: new Date()
      }
    };
    
    return responseHandler.success(res, dashboardData);
  } catch (error) {
    logger.error('종합 분석 대시보드 데이터 조회 중 오류 발생:', error);
    return responseHandler.error(res, error);
  }
};
