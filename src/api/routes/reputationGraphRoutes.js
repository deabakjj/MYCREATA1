/**
 * 평판 그래프 라우트
 * 
 * 평판 그래프 관련 API 라우트를 정의합니다.
 * 인증, 권한 검사 미들웨어를 적용하고 컨트롤러와 연결합니다.
 */

const express = require('express');
const router = express.Router();

// 컨트롤러 임포트
const reputationGraphController = require('../controllers/reputationGraphController');

// 미들웨어 임포트
const { authenticate } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

/**
 * 사용자 평판 관련 라우트
 */

// 사용자 평판 점수 조회
router.get('/users/:userId/scores', reputationGraphController.getUserReputationScores);

// 사용자 평판 그래프 조회
router.get('/users/:userId/graph', reputationGraphController.getUserReputationGraph);

// 평판 그래프 시각화 데이터
router.get('/users/:userId/visualization', reputationGraphController.getReputationVisualization);

// 평판 점수 비교
router.get('/users/:userId/comparison', reputationGraphController.getReputationComparison);

// 사용자 평판 점수 계산 작업 시작 (인증 필요)
router.post('/users/:userId/compute', authenticate, reputationGraphController.computeUserReputation);

// AI 평판 분석 및 인사이트 (인증 필요)
router.get('/users/:userId/insights', authenticate, reputationGraphController.getAIReputationInsights);

/**
 * 도메인 및 통계 관련 라우트
 */

// 특정 도메인의 상위 사용자 목록
router.get('/domains/:domain/top-users', reputationGraphController.getTopUsersByDomain);

// 계산 작업 상태 확인 (관리자 전용)
router.get('/computations/:computationId', authenticate, checkRole(['admin']), reputationGraphController.getComputationStatus);

// 평판 그래프 전체 통계 (관리자 전용)
router.get('/stats', authenticate, checkRole(['admin']), reputationGraphController.getReputationGraphStats);

module.exports = router;
