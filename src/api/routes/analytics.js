/**
 * 분석 API 라우트
 * 
 * 분석 관련 엔드포인트 정의
 */

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// 모든 분석 API는 인증 및 관리자 권한 필요
router.use(authMiddleware.verifyToken);
router.use(roleMiddleware.isAdmin);

/**
 * 사용자 전환률 관련 엔드포인트
 */
// 사용자 전환률 지표 조회
router.get('/user-conversion', analyticsController.getUserConversion);

// 사용자 전환률 추세 조회
router.get('/user-conversion/trends', analyticsController.getUserConversionTrends);

// 사용자 세그먼트별 전환률 조회
router.get('/user-conversion/segments', analyticsController.getUserConversionBySegment);

// 전환 퍼널 분석 조회
router.get('/user-conversion/funnel', analyticsController.getConversionFunnel);

/**
 * 지갑 유지율 관련 엔드포인트
 */
// 지갑 유지율 지표 조회
router.get('/wallet-retention', analyticsController.getWalletRetention);

// 보상 유형별 지갑 유지율 조회
router.get('/wallet-retention/reward-type', analyticsController.getWalletRetentionByRewardType);

// 활동 패턴별 지갑 유지율 조회
router.get('/wallet-retention/activity-pattern', analyticsController.getWalletRetentionByActivityPattern);

/**
 * 토큰 교환 관련 엔드포인트
 */
// 토큰 교환 지표 조회
router.get('/token-exchange', analyticsController.getTokenExchange);

// 사용자 세그먼트별 토큰 교환 패턴 조회
router.get('/token-exchange/user-segment', analyticsController.getTokenExchangeByUserSegment);

// 토큰 교환 금액 분포 조회
router.get('/token-exchange/amount-distribution', analyticsController.getTokenExchangeAmountDistribution);

// 교환 이후 행동 패턴 조회
router.get('/token-exchange/post-behavior', analyticsController.getPostExchangeBehavior);

/**
 * XP 누적 관련 엔드포인트
 */
// XP 누적 지표 조회
router.get('/xp-accumulation', analyticsController.getXpAccumulation);

// 사용자 세그먼트별 XP 누적 패턴 조회
router.get('/xp-accumulation/user-segment', analyticsController.getXpAccumulationByUserSegment);

// 레벨 진행 속도 조회
router.get('/xp-accumulation/level-progression', analyticsController.getLevelProgression);

// 활동 유형별 XP 효율성 조회
router.get('/xp-accumulation/activity-efficiency', analyticsController.getActivityEfficiency);

/**
 * NFT 보유 관련 엔드포인트
 */
// NFT 보유 지표 조회
router.get('/nft-ownership', analyticsController.getNftOwnership);

// 사용자 세그먼트별 NFT 보유 패턴 조회
router.get('/nft-ownership/user-segment', analyticsController.getNftOwnershipByUserSegment);

// NFT 보유와 사용자 참여도 상관관계 조회
router.get('/nft-ownership/engagement-correlation', analyticsController.getNftEngagementCorrelation);

/**
 * 종합 대시보드
 */
// 종합 분석 대시보드 데이터 조회
router.get('/dashboard', analyticsController.getDashboardOverview);

module.exports = router;
