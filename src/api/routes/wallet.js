/**
 * @file 지갑 라우터
 * @description 지갑 관련 API 엔드포인트 정의
 */

const express = require('express');
const { body, param } = require('express-validator');
const walletController = require('../controllers/walletController');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

// 모든 지갑 라우트에 인증 미들웨어 적용
router.use(authenticate);

/**
 * @route GET /api/wallets/me
 * @desc 현재 사용자의 지갑 정보 조회
 * @access Private
 */
router.get('/me', walletController.getMyWallet);

/**
 * @route GET /api/wallets/balance
 * @desc 지갑 잔액 조회
 * @access Private
 */
router.get('/balance', walletController.getWalletBalance);

/**
 * @route GET /api/wallets/transactions
 * @desc 지갑 트랜잭션 내역 조회
 * @access Private
 */
router.get('/transactions', walletController.getTransactions);

/**
 * @route GET /api/wallets/nfts
 * @desc 지갑 NFT 목록 조회
 * @access Private
 */
router.get('/nfts', walletController.getNFTs);

/**
 * @route POST /api/wallets/swap
 * @desc 토큰 스왑 (CTA <-> NEST)
 * @access Private
 */
router.post(
  '/swap',
  [
    body('fromToken')
      .isIn(['CTA', 'NEST'])
      .withMessage('지원하지 않는 토큰 유형입니다.'),
    body('amount')
      .isNumeric()
      .withMessage('금액은 숫자여야 합니다.')
      .isFloat({ min: 0.000001 })
      .withMessage('금액은 0보다 커야 합니다.'),
    validate,
  ],
  walletController.swapTokens
);

/**
 * @route POST /api/wallets/transfer
 * @desc 토큰 전송
 * @access Private
 */
router.post(
  '/transfer',
  [
    body('to')
      .notEmpty()
      .withMessage('수신자 주소는 필수 항목입니다.')
      .matches(/^(0x)?[0-9a-fA-F]{40}$|^[\w-]+(\.nest)$/)
      .withMessage('유효한 이더리움 주소 또는 Nest ID를 입력하세요.'),
    body('token')
      .isIn(['CTA', 'NEST'])
      .withMessage('지원하지 않는 토큰 유형입니다.'),
    body('amount')
      .isNumeric()
      .withMessage('금액은 숫자여야 합니다.')
      .isFloat({ min: 0.000001 })
      .withMessage('금액은 0보다 커야 합니다.'),
    validate,
  ],
  walletController.transferTokens
);

/**
 * @route POST /api/wallets/register-nest-id
 * @desc Nest ID 등록
 * @access Private
 */
router.post(
  '/register-nest-id',
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
  walletController.registerNestId
);

/**
 * @route GET /api/wallets/nest-id
 * @desc 내 Nest ID 조회
 * @access Private
 */
router.get('/nest-id', walletController.getMyNestId);

/**
 * @route GET /api/wallets/address/:nestId
 * @desc Nest ID로 지갑 주소 조회
 * @access Private
 */
router.get(
  '/address/:nestId',
  [
    param('nestId')
      .matches(/^[a-z0-9-]+(\.nest)$/)
      .withMessage('유효한 Nest ID 형식이 아닙니다.'),
    validate,
  ],
  walletController.getAddressByNestId
);

/**
 * @route POST /api/wallets/transfer-nft
 * @desc NFT 전송
 * @access Private
 */
router.post(
  '/transfer-nft',
  [
    body('to')
      .notEmpty()
      .withMessage('수신자 주소는 필수 항목입니다.')
      .matches(/^(0x)?[0-9a-fA-F]{40}$|^[\w-]+(\.nest)$/)
      .withMessage('유효한 이더리움 주소 또는 Nest ID를 입력하세요.'),
    body('tokenId')
      .notEmpty()
      .withMessage('토큰 ID는 필수 항목입니다.'),
    validate,
  ],
  walletController.transferNFT
);

/**
 * @route GET /api/wallets/daily-limit
 * @desc 일일 스왑 한도 조회
 * @access Private
 */
router.get('/daily-limit', walletController.getDailySwapLimit);

/**
 * @route GET /api/wallets/address/:address/transactions
 * @desc 특정 주소의 트랜잭션 내역 조회 (퍼블릭)
 * @access Private
 */
router.get(
  '/address/:address/transactions',
  [
    param('address')
      .matches(/^(0x)?[0-9a-fA-F]{40}$/)
      .withMessage('유효한 이더리움 주소를 입력하세요.'),
    validate,
  ],
  walletController.getAddressTransactions
);

/**
 * @route POST /api/wallets/update-status
 * @desc 지갑 상태 업데이트
 * @access Private
 */
router.post(
  '/update-status',
  [
    body('status')
      .isIn(['active', 'inactive', 'suspended'])
      .withMessage('유효한 상태가 아닙니다.'),
    validate,
  ],
  walletController.updateWalletStatus
);

module.exports = router;
