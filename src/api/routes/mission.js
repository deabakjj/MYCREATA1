/**
 * @file 미션 라우터
 * @description 미션 관련 API 엔드포인트 정의
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const missionController = require('../controllers/missionController');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth');
const { cacheMiddleware, invalidateEntityCache } = require('../middlewares/cache');
const config = require('../../config');

const router = express.Router();

// 모든 미션 라우트에 인증 미들웨어 적용
router.use(authenticate);

/**
 * @route GET /api/missions
 * @desc 미션 목록 조회
 * @access Private
 */
router.get('/', 
  cacheMiddleware({ 
    ttl: config.redis.cache.paths['/api/missions'] || config.redis.cache.defaultTTL,
    keyGenerator: (req) => `missions:list:${req.query.page || '1'}:${req.query.limit || '10'}:${req.query.sort || 'createdAt'}`
  }),
  missionController.getMissions
);

/**
 * @route GET /api/missions/active
 * @desc 활성화된 미션 목록 조회
 * @access Private
 */
router.get('/active', 
  cacheMiddleware({ 
    ttl: 180, // 3분 (새로운 미션이 활성화될 수 있으므로 비교적 짧게 설정)
    keyGenerator: (req) => `missions:active:${req.query.page || '1'}:${req.query.limit || '10'}`
  }),
  missionController.getActiveMissions
);

/**
 * @route GET /api/missions/recommended
 * @desc 사용자 맞춤형 미션 추천
 * @access Private
 */
router.get('/recommended', missionController.getRecommendedMissions);

/**
 * @route GET /api/missions/:id
 * @desc 특정 미션 상세 정보 조회
 * @access Private
 */
router.get(
  '/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('유효한 미션 ID가 아닙니다.'),
    validate,
  ],
  cacheMiddleware({ 
    ttl: 300, // 5분
    keyGenerator: (req) => `mission:detail:${req.params.id}`
  }),
  missionController.getMissionById
);

/**
 * @route POST /api/missions/:id/start
 * @desc 미션 시작
 * @access Private
 */
router.post(
  '/:id/start',
  [
    param('id')
      .isMongoId()
      .withMessage('유효한 미션 ID가 아닙니다.'),
    validate,
  ],
  missionController.startMission
);

/**
 * @route POST /api/missions/:id/submit
 * @desc 미션 제출
 * @access Private
 */
router.post(
  '/:id/submit',
  [
    param('id')
      .isMongoId()
      .withMessage('유효한 미션 ID가 아닙니다.'),
    body('content')
      .notEmpty()
      .withMessage('제출 내용은 필수 항목입니다.'),
    validate,
  ],
  missionController.submitMission
);

/**
 * @route GET /api/missions/:id/participants
 * @desc 미션 참여자 목록 조회
 * @access Private
 */
router.get(
  '/:id/participants',
  [
    param('id')
      .isMongoId()
      .withMessage('유효한 미션 ID가 아닙니다.'),
    validate,
  ],
  missionController.getMissionParticipants
);

/**
 * @route GET /api/missions/:id/stats
 * @desc 미션 통계 조회
 * @access Private
 */
router.get(
  '/:id/stats',
  [
    param('id')
      .isMongoId()
      .withMessage('유효한 미션 ID가 아닙니다.'),
    validate,
  ],
  missionController.getMissionStats
);

// 관리자 전용 라우트

/**
 * @route POST /api/missions
 * @desc 새 미션 생성
 * @access Private (Admin)
 */
router.post(
  '/',
  [
    authorize(['admin']),
    body('title')
      .notEmpty()
      .withMessage('미션 제목은 필수 항목입니다.')
      .isLength({ max: 100 })
      .withMessage('미션 제목은 100자를 초과할 수 없습니다.'),
    body('description')
      .notEmpty()
      .withMessage('미션 설명은 필수 항목입니다.')
      .isLength({ max: 1000 })
      .withMessage('미션 설명은 1000자를 초과할 수 없습니다.'),
    body('type')
      .isIn(['attendance', 'comment', 'quiz', 'ai', 'social', 'creative', 'custom'])
      .withMessage('유효한 미션 유형이 아닙니다.'),
    body('rewards.xp')
      .isInt({ min: 0 })
      .withMessage('XP 보상은 0 이상이어야 합니다.'),
    validate,
  ],
  missionController.createMission
);

/**
 * @route PUT /api/missions/:id
 * @desc 미션 업데이트
 * @access Private (Admin)
 */
router.put(
  '/:id',
  [
    authorize(['admin']),
    param('id')
      .isMongoId()
      .withMessage('유효한 미션 ID가 아닙니다.'),
    body('title')
      .optional()
      .isLength({ max: 100 })
      .withMessage('미션 제목은 100자를 초과할 수 없습니다.'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('미션 설명은 1000자를 초과할 수 없습니다.'),
    validate,
  ],
  missionController.updateMission
);

/**
 * @route DELETE /api/missions/:id
 * @desc 미션 삭제
 * @access Private (Admin)
 */
router.delete(
  '/:id',
  [
    authorize(['admin']),
    param('id')
      .isMongoId()
      .withMessage('유효한 미션 ID가 아닙니다.'),
    validate,
  ],
  missionController.deleteMission
);

/**
 * @route PUT /api/missions/:id/status
 * @desc 미션 상태 업데이트
 * @access Private (Admin)
 */
router.put(
  '/:id/status',
  [
    authorize(['admin']),
    param('id')
      .isMongoId()
      .withMessage('유효한 미션 ID가 아닙니다.'),
    body('status')
      .isIn(['draft', 'active', 'completed', 'cancelled'])
      .withMessage('유효한 상태가 아닙니다.'),
    validate,
  ],
  missionController.updateMissionStatus
);

/**
 * @route PUT /api/missions/:id/evaluate/:participationId
 * @desc 미션 제출물 평가
 * @access Private (Admin)
 */
router.put(
  '/:id/evaluate/:participationId',
  [
    authorize(['admin']),
    param('id')
      .isMongoId()
      .withMessage('유효한 미션 ID가 아닙니다.'),
    param('participationId')
      .isMongoId()
      .withMessage('유효한 참여 ID가 아닙니다.'),
    body('score')
      .isInt({ min: 0, max: 100 })
      .withMessage('점수는 0~100 사이의 정수여야 합니다.'),
    body('feedback')
      .optional()
      .isLength({ max: 500 })
      .withMessage('피드백은 500자를 초과할 수 없습니다.'),
    validate,
  ],
  missionController.evaluateMissionSubmission
);

module.exports = router;
