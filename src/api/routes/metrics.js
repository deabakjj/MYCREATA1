/**
 * @file Metrics API routes
 * @description Provides API endpoints for Prometheus metrics
 */

const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');
const metricsController = require('../controllers/metricsController');

/**
 * @route GET /api/metrics
 * @description Get general application metrics
 * @access Public (for Prometheus scraping)
 */
router.get('/', metricsController.getGeneralMetrics);

/**
 * @route GET /api/metrics/blockchain
 * @description Get blockchain related metrics
 * @access Public (for Prometheus scraping)
 */
router.get('/blockchain', metricsController.getBlockchainMetrics);

/**
 * @route GET /api/metrics/contracts
 * @description Get smart contract metrics
 * @access Public (for Prometheus scraping)
 */
router.get('/contracts', metricsController.getContractMetrics);

/**
 * @route GET /api/metrics/dashboards/user-conversion
 * @description Get user conversion metrics for admin dashboard
 * @access Private (Admin only)
 */
router.get(
  '/dashboards/user-conversion',
  authMiddleware,
  roleMiddleware(['admin']),
  metricsController.getUserConversionMetrics
);

/**
 * @route GET /api/metrics/dashboards/wallet-retention
 * @description Get wallet retention metrics for admin dashboard
 * @access Private (Admin only)
 */
router.get(
  '/dashboards/wallet-retention',
  authMiddleware,
  roleMiddleware(['admin']),
  metricsController.getWalletRetentionMetrics
);

/**
 * @route GET /api/metrics/dashboards/token-exchange
 * @description Get token exchange metrics for admin dashboard
 * @access Private (Admin only)
 */
router.get(
  '/dashboards/token-exchange',
  authMiddleware,
  roleMiddleware(['admin']),
  metricsController.getTokenExchangeMetrics
);

/**
 * @route GET /api/metrics/dashboards/xp-accumulation
 * @description Get XP accumulation metrics for admin dashboard
 * @access Private (Admin only)
 */
router.get(
  '/dashboards/xp-accumulation',
  authMiddleware,
  roleMiddleware(['admin']),
  metricsController.getXpAccumulationMetrics
);

/**
 * @route GET /api/metrics/dashboards/nft-ownership
 * @description Get NFT ownership metrics for admin dashboard
 * @access Private (Admin only)
 */
router.get(
  '/dashboards/nft-ownership',
  authMiddleware,
  roleMiddleware(['admin']),
  metricsController.getNftOwnershipMetrics
);

module.exports = router;
