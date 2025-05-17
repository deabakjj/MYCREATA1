/**
 * @file Web3Auth 라우트
 * @description Web3Auth 관련 API 엔드포인트
 */

const express = require('express');
const router = express.Router();
const { web3AuthLogin, getWeb3AuthConfig } = require('../controllers/web3AuthController');
const cache = require('../middlewares/cache');

/**
 * @swagger
 * /api/auth/web3auth/login:
 *   post:
 *     summary: Web3Auth 로그인
 *     description: Web3Auth 토큰으로 로그인 또는 가입 처리
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Web3Auth에서 발급받은 ID 토큰
 *     responses:
 *       200:
 *         description: 로그인 성공
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 */
router.post('/login', web3AuthLogin);

/**
 * @swagger
 * /api/auth/web3auth/config:
 *   get:
 *     summary: Web3Auth 클라이언트 설정
 *     description: Web3Auth 클라이언트측 설정 정보 제공
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: 설정 정보 조회 성공
 */
router.get('/config', cache.route(3600), getWeb3AuthConfig);

module.exports = router;
