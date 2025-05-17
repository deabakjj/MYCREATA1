/**
 * @file NFT 관련 API 라우트 정의
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const cache = require('../middlewares/cache');
const { 
  getNFTs, 
  getNFTById, 
  mintNFT, 
  transferNFT, 
  getNFTHistory,
  getNFTsByOwner,
  getNFTsByType,
  getBadgeNFTs,
  getRewardNFTs,
  getAchievementNFTs
} = require('../controllers/nftController');

/**
 * @swagger
 * /api/nfts:
 *   get:
 *     summary: 모든 NFT 목록 조회
 *     description: 시스템에 등록된 모든 NFT 목록을 조회합니다.
 *     tags: [NFT]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 페이지당 NFT 수
 *     responses:
 *       200:
 *         description: 성공적으로 NFT 목록을 조회했습니다.
 */
router.get('/', authMiddleware, cache.route(300), getNFTs);

/**
 * @swagger
 * /api/nfts/{id}:
 *   get:
 *     summary: 특정 NFT 조회
 *     description: 특정 ID를 가진 NFT를 조회합니다.
 *     tags: [NFT]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: NFT ID
 *     responses:
 *       200:
 *         description: 성공적으로 NFT를 조회했습니다.
 *       404:
 *         description: NFT를 찾을 수 없습니다.
 */
router.get('/:id', authMiddleware, cache.route(300), getNFTById);

/**
 * @swagger
 * /api/nfts/mint:
 *   post:
 *     summary: NFT 발행
 *     description: 새로운 NFT를 발행합니다.
 *     tags: [NFT]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *               - metadata
 *               - type
 *             properties:
 *               recipientId:
 *                 type: string
 *                 description: 수신자 ID
 *               metadata:
 *                 type: object
 *                 description: NFT 메타데이터
 *               type:
 *                 type: string
 *                 description: NFT 유형 (badge, reward, achievement 등)
 *     responses:
 *       201:
 *         description: 성공적으로 NFT를 발행했습니다.
 *       400:
 *         description: 잘못된 요청 데이터입니다.
 */
router.post('/mint', authMiddleware, roleMiddleware(['admin']), mintNFT);

/**
 * @swagger
 * /api/nfts/transfer:
 *   post:
 *     summary: NFT 전송
 *     description: NFT를 다른 사용자에게 전송합니다.
 *     tags: [NFT]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nftId
 *               - recipientId
 *             properties:
 *               nftId:
 *                 type: string
 *                 description: 전송할 NFT ID
 *               recipientId:
 *                 type: string
 *                 description: 수신자 ID
 *     responses:
 *       200:
 *         description: 성공적으로 NFT를 전송했습니다.
 *       400:
 *         description: 잘못된 요청 데이터입니다.
 *       404:
 *         description: NFT를 찾을 수 없습니다.
 */
router.post('/transfer', authMiddleware, transferNFT);

/**
 * @swagger
 * /api/nfts/{id}/history:
 *   get:
 *     summary: NFT 거래 기록 조회
 *     description: 특정 NFT의 거래 기록을 조회합니다.
 *     tags: [NFT]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: NFT ID
 *     responses:
 *       200:
 *         description: 성공적으로 NFT 거래 기록을 조회했습니다.
 *       404:
 *         description: NFT를 찾을 수 없습니다.
 */
router.get('/:id/history', authMiddleware, cache.route(300), getNFTHistory);

/**
 * @swagger
 * /api/nfts/owner/{userId}:
 *   get:
 *     summary: 사용자 보유 NFT 조회
 *     description: 특정 사용자가 보유한 NFT 목록을 조회합니다.
 *     tags: [NFT]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: 사용자 ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 페이지당 NFT 수
 *     responses:
 *       200:
 *         description: 성공적으로 사용자의 NFT 목록을 조회했습니다.
 */
router.get('/owner/:userId', authMiddleware, cache.route(300), getNFTsByOwner);

/**
 * @swagger
 * /api/nfts/type/{type}:
 *   get:
 *     summary: 유형별 NFT 조회
 *     description: 특정 유형의 NFT 목록을 조회합니다.
 *     tags: [NFT]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         schema:
 *           type: string
 *         required: true
 *         description: NFT 유형 (badge, reward, achievement 등)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 페이지당 NFT 수
 *     responses:
 *       200:
 *         description: 성공적으로 유형별 NFT 목록을 조회했습니다.
 */
router.get('/type/:type', authMiddleware, cache.route(300), getNFTsByType);

/**
 * @swagger
 * /api/nfts/badges:
 *   get:
 *     summary: 뱃지 NFT 조회
 *     description: 모든 뱃지 유형의 NFT 목록을 조회합니다.
 *     tags: [NFT]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 페이지당 NFT 수
 *     responses:
 *       200:
 *         description: 성공적으로 뱃지 NFT 목록을 조회했습니다.
 */
router.get('/badges', authMiddleware, cache.route(300), getBadgeNFTs);

/**
 * @swagger
 * /api/nfts/rewards:
 *   get:
 *     summary: 보상 NFT 조회
 *     description: 모든 보상 유형의 NFT 목록을 조회합니다.
 *     tags: [NFT]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 페이지당 NFT 수
 *     responses:
 *       200:
 *         description: 성공적으로 보상 NFT 목록을 조회했습니다.
 */
router.get('/rewards', authMiddleware, cache.route(300), getRewardNFTs);

/**
 * @swagger
 * /api/nfts/achievements:
 *   get:
 *     summary: 업적 NFT 조회
 *     description: 모든 업적 유형의 NFT 목록을 조회합니다.
 *     tags: [NFT]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 페이지당 NFT 수
 *     responses:
 *       200:
 *         description: 성공적으로 업적 NFT 목록을 조회했습니다.
 */
router.get('/achievements', authMiddleware, cache.route(300), getAchievementNFTs);

module.exports = router;
