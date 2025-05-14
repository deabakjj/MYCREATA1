/**
 * @file 인증 라우터
 * @description 인증 관련 API 엔드포인트 정의
 */

const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc 새 사용자 등록 (회원가입)
 * @access Public
 */
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('이름은 필수 항목입니다.'),
    body('email').isEmail().withMessage('유효한 이메일 주소를 입력하세요.'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('비밀번호는 최소 6자 이상이어야 합니다.'),
    validate,
  ],
  authController.register
);

/**
 * @route POST /api/auth/login
 * @desc 기존 사용자 로그인 (이메일/비밀번호)
 * @access Public
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('유효한 이메일 주소를 입력하세요.'),
    body('password').notEmpty().withMessage('비밀번호를 입력하세요.'),
    validate,
  ],
  authController.login
);

/**
 * @route POST /api/auth/social-login
 * @desc 소셜 로그인 처리
 * @access Public
 */
router.post(
  '/social-login',
  [
    body('provider')
      .isIn(['google', 'kakao', 'apple'])
      .withMessage('지원하지 않는 소셜 로그인 제공자입니다.'),
    body('socialId').notEmpty().withMessage('소셜 ID는 필수 항목입니다.'),
    validate,
  ],
  authController.socialLogin
);

/**
 * @route POST /api/auth/refresh
 * @desc 액세스 토큰 갱신
 * @access Public
 */
router.post(
  '/refresh',
  [
    body('refreshToken').notEmpty().withMessage('리프레시 토큰은 필수 항목입니다.'),
    validate,
  ],
  authController.refreshToken
);

/**
 * @route POST /api/auth/logout
 * @desc 사용자 로그아웃
 * @access Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route POST /api/auth/password/forgot
 * @desc 비밀번호 찾기 (재설정 이메일 발송)
 * @access Public
 */
router.post(
  '/password/forgot',
  [
    body('email').isEmail().withMessage('유효한 이메일 주소를 입력하세요.'),
    validate,
  ],
  authController.forgotPassword
);

/**
 * @route POST /api/auth/password/reset/:resetToken
 * @desc 비밀번호 재설정
 * @access Public
 */
router.post(
  '/password/reset/:resetToken',
  [
    body('password')
      .isLength({ min: 6 })
      .withMessage('비밀번호는 최소 6자 이상이어야 합니다.'),
    validate,
  ],
  authController.resetPassword
);

/**
 * @route GET /api/auth/me
 * @desc 현재 로그인한 사용자 정보 조회
 * @access Private
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @route PUT /api/auth/change-password
 * @desc 비밀번호 변경
 * @access Private
 */
router.put(
  '/change-password',
  [
    authenticate,
    body('currentPassword').notEmpty().withMessage('현재 비밀번호는 필수 항목입니다.'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('새 비밀번호는 최소 6자 이상이어야 합니다.'),
    validate,
  ],
  authController.changePassword
);

/**
 * @route POST /api/auth/wallet
 * @desc 사용자 지갑 생성
 * @access Private
 */
router.post(
  '/wallet',
  authenticate,
  authController.createWallet
);

module.exports = router;
