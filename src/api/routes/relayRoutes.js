/**
 * Relay API 라우트
 * 
 * 외부 DApp과 Nest 플랫폼 간의 연결 및 트랜잭션을 관리하는 엔드포인트를 정의합니다.
 */

const express = require('express');
const router = express.Router();
const relayConnectionController = require('../controllers/relay/relayConnectionController');
const relayTransactionController = require('../controllers/relay/relayTransactionController');
const authMiddleware = require('../middlewares/authMiddleware');
const corsWithOptions = require('../middlewares/corsWithOptions');

// ==================== 사용자 엔드포인트 (인증 필요) ====================

// 연결 관리
router.post('/connections', authMiddleware.authenticate, relayConnectionController.createConnection);
router.get('/connections', authMiddleware.authenticate, relayConnectionController.getUserConnections);
router.get('/connections/:connectionId', authMiddleware.authenticate, relayConnectionController.getConnection);
router.post('/connections/:connectionId/renew', authMiddleware.authenticate, relayConnectionController.renewConnection);
router.delete('/connections/:connectionId', authMiddleware.authenticate, relayConnectionController.revokeConnection);
router.patch('/connections/:connectionId/permissions', authMiddleware.authenticate, relayConnectionController.updateConnectionPermissions);

// 트랜잭션 관리
router.get('/transactions', authMiddleware.authenticate, relayTransactionController.getUserTransactions);
router.get('/transactions/:transactionId', authMiddleware.authenticate, relayTransactionController.getTransaction);
router.post('/transactions/:transactionId/approve', authMiddleware.authenticate, relayTransactionController.approveTransaction);
router.post('/transactions/:transactionId/reject', authMiddleware.authenticate, relayTransactionController.rejectTransaction);

// ==================== DApp 엔드포인트 (CORS 처리 필요) ====================

// 연결 관리 (DApp용)
router.get('/dapp/connections/:connectionKey', corsWithOptions, relayConnectionController.getConnectionByKey);
router.post('/dapp/verify-token', corsWithOptions, relayConnectionController.verifyAccessToken);
router.post('/dapp/refresh-token', corsWithOptions, relayConnectionController.refreshToken);

// 트랜잭션 관리 (DApp용)
router.post('/dapp/transactions', corsWithOptions, relayTransactionController.createSignatureRequest);
router.get('/dapp/transactions/:transactionId/status', corsWithOptions, relayTransactionController.getSignatureRequestStatus);
router.post('/dapp/transactions/:transactionId/complete', corsWithOptions, relayTransactionController.completeTransaction);
router.post('/dapp/transactions/:transactionId/fail', corsWithOptions, relayTransactionController.failTransaction);

module.exports = router;
