/**
 * @file 사용자 라우터
 * @description 사용자 관련 API 엔드포인트 정의
 */

const express = require('express');
const { body, param } = require('express-validator');
const userController = require('../controllers/userController');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

// 모든 사용자 라우트에 인증 미들웨어 적용
router.use(authenticate);

/**
 * @route GET /api/users/profile
 * @desc 현재 사용자 프로필 조회
 * @access Private
 */
router.get('/profile', userController.getProfile);

/**
 * @route PUT /api/users/profile
 * @desc 사용자 프로필 업데이트
 * @access Private
 */
router.put(
  '/profile',
  [
    body('name')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('이름은 2~50자 사이여야 합니다.'),
    body('profileImage').optional(),
    validate,
  ],
  userController.updateProfile
);

/**
 * @route GET /api/users/activities
 * @desc 사용자 활동 내역 조회
 * @access Private
 */
router.get('/activities', userController.getActivities);

/**
 * @route GET /api/users/statistics
 * @desc 사용자 통계 조회
 * @access Private
 */
router.get('/statistics', userController.getStatistics);

/**
 * @route POST /api/users/check-attendance
 * @desc 출석 체크
 * @access Private
 */
router.post('/check-attendance', userController.checkAttendance);

/**
 * @route GET /api/users/level
 * @desc 현재 레벨 및 XP 정보 조회
 * @access Private
 */
router.get('/level', userController.getLevelInfo);

/**
 * @route GET /api/users/missions
 * @desc 사용자 참여 미션 목록 조회
 * @access Private
 */
router.get('/missions', userController.getUserMissions);

/**
 * @route GET /api/users/:id
 * @desc 특정 사용자 정보 조회 (퍼블릭 정보만)
 * @access Private
 */
router.get(
  '/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('유효한 사용자 ID가 아닙니다.'),
    validate,
  ],
  userController.getUserById
);

/**
 * @route GET /api/users/by-nestid/:nestId
 * @desc Nest ID로 사용자 정보 조회 (퍼블릭 정보만)
 * @access Private
 */
router.get(
  '/by-nestid/:nestId',
  [
    param('nestId')
      .matches(/^[a-z0-9-]+(\.nest)$/)
      .withMessage('유효한 Nest ID 형식이 아닙니다.'),
    validate,
  ],
  userController.getUserByNestId
);

/**
 * @route POST /api/users/add-xp
 * @desc XP 추가 (개발용 또는 관리자용)
 * @access Private (Admin only)
 */
router.post(
  '/add-xp',
  [
    authorize(['admin']),
    body('userId')
      .isMongoId()
      .withMessage('유효한 사용자 ID가 아닙니다.'),
    body('amount')
      .isInt({ min: 1 })
      .withMessage('XP는 1 이상이어야 합니다.'),
    validate,
  ],
  userController.addXp
);

/**
 * @route GET /api/users/search
 * @desc 사용자 검색
 * @access Private (Admin only)
 */
router.get(
  '/search',
  authorize(['admin']),
  userController.searchUsers
);

/**
 * @route PUT /api/users/:id/status
 * @desc 사용자 상태 업데이트 (활성화/비활성화)
 * @access Private (Admin only)
 */
router.put(
  '/:id/status',
  [
    authorize(['admin']),
    param('id')
      .isMongoId()
      .withMessage('유효한 사용자 ID가 아닙니다.'),
    body('isActive')
      .isBoolean()
      .withMessage('활성화 상태는 불리언(true/false)이어야 합니다.'),
    validate,
  ],
  userController.updateUserStatus
);

module.exports = router;
