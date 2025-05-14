/**
 * @file Nest ID 라우터
 * @description Nest ID(.nest 도메인) 관련 API 엔드포인트 정의
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const nestIdController = require('../controllers/nestIdController');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

// 모든 Nest ID 라우트에 인증 미들웨어 적용
router.use(authenticate);

/**
 * @route GET /api/nest-ids/my
 * @desc 내 Nest ID 조회
 * @access Private
 */
router.get('/my', nestIdController.getMyNestId);

/**
 * @route POST /api/nest-ids/register
 * @desc Nest ID 등록
 * @access Private
 */
router.post(
  '/register',
  [
    body('name')
      .notEmpty()
      .withMessage('이름은 필수 항목입니다.')
      .isLength({ min: 3, max: 32 })
      .withMessage('이름은 3~32자 사이여야 합니다.')
      .matches(/^[a-z0-9-]+$/)
      .withMessage('이름은 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다.'),
    validate,
  ],
  nestIdController.registerNestId
);

/**
 * @route GET /api/nest-ids/check/:name
 * @desc Nest ID 사용 가능 여부 확인
 * @access Private
 */
router.get(
  '/check/:name',
  [
    param('name')
      .isLength({ min: 3, max: 32 })
      .withMessage('이름은 3~32자 사이여야 합니다.')
      .matches(/^[a-z0-9-]+$/)
      .withMessage('이름은 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다.'),
    validate,
  ],
  nestIdController.checkNestIdAvailability
);

/**
 * @route GET /api/nest-ids/:nestId/address
 * @desc Nest ID로 지갑 주소 조회
 * @access Private
 */
router.get(
  '/:nestId/address',
  [
    param('nestId')
      .matches(/^[a-z0-9-]+(\.nest)$/)
      .withMessage('유효한 Nest ID 형식이 아닙니다.'),
    validate,
  ],
  nestIdController.getAddressByNestId
);

/**
 * @route GET /api/nest-ids/address/:address
 * @desc 지갑 주소로 Nest ID 조회
 * @access Private
 */
router.get(
  '/address/:address',
  [
    param('address')
      .matches(/^(0x)?[0-9a-fA-F]{40}$/)
      .withMessage('유효한 이더리움 주소를 입력하세요.'),
    validate,
  ],
  nestIdController.getNestIdByAddress
);

/**
 * @route PUT /api/nest-ids/my
 * @desc 내 Nest ID 갱신 (만료 기간 연장)
 * @access Private
 */
router.put('/my', nestIdController.renewMyNestId);

/**
 * @route DELETE /api/nest-ids/my
 * @desc 내 Nest ID 해제
 * @access Private
 */
router.delete('/my', nestIdController.releaseMyNestId);

// 관리자 전용 라우트

/**
 * @route GET /api/nest-ids
 * @desc 모든 Nest ID 목록 조회
 * @access Private (Admin)
 */
router.get(
  '/',
  authorize(['admin']),
  nestIdController.getAllNestIds
);

/**
 * @route POST /api/nest-ids/restrict
 * @desc Nest ID 제한 설정 (예약/금지)
 * @access Private (Admin)
 */
router.post(
  '/restrict',
  [
    authorize(['admin']),
    body('name')
      .notEmpty()
      .withMessage('이름은 필수 항목입니다.')
      .isLength({ min: 3, max: 32 })
      .withMessage('이름은 3~32자 사이여야 합니다.')
      .matches(/^[a-z0-9-]+$/)
      .withMessage('이름은 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다.'),
    body('isRestricted')
      .isBoolean()
      .withMessage('제한 상태는 불리언(true/false)이어야 합니다.'),
    validate,
  ],
  nestIdController.restrictNestId
);

/**
 * @route POST /api/nest-ids/register-for-user
 * @desc 특정 사용자를 위한 Nest ID 등록 (관리자 전용)
 * @access Private (Admin)
 */
router.post(
  '/register-for-user',
  [
    authorize(['admin']),
    body('userId')
      .isMongoId()
      .withMessage('유효한 사용자 ID가 아닙니다.'),
    body('name')
      .notEmpty()
      .withMessage('이름은 필수 항목입니다.')
      .isLength({ min: 3, max: 32 })
      .withMessage('이름은 3~32자 사이여야 합니다.')
      .matches(/^[a-z0-9-]+$/)
      .withMessage('이름은 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다.'),
    validate,
  ],
  nestIdController.registerNestIdForUser
);

module.exports = router;
