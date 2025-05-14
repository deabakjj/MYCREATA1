/**
 * Integration Routes
 * 
 * API routes for managing external service integrations
 * Used by the admin panel to configure and interact with third-party services
 */

const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integrationController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.verifyToken);

// Apply admin role check to all routes
router.use(roleMiddleware.checkRole('admin'));

// GET /api/admin/integrations - Get all integrations
router.get('/', integrationController.getAllIntegrations);

// GET /api/admin/integrations/types - Get all integration types
router.get('/types', integrationController.getIntegrationTypes);

// GET /api/admin/integrations/:id - Get integration by ID
router.get('/:id', integrationController.getIntegrationById);

// POST /api/admin/integrations - Create new integration
router.post('/', integrationController.createIntegration);

// PUT /api/admin/integrations/:id - Update integration by ID
router.put('/:id', integrationController.updateIntegration);

// DELETE /api/admin/integrations/:id - Delete integration by ID
router.delete('/:id', integrationController.deleteIntegration);

// POST /api/admin/integrations/:id/test - Test integration connection
router.post('/:id/test', integrationController.testIntegration);

// GET /api/admin/integrations/:id/stats - Get integration statistics
router.get('/:id/stats', integrationController.getIntegrationStats);

// POST /api/admin/integrations/:id/sync - Sync data with integration
router.post('/:id/sync', integrationController.syncIntegration);

// GET /api/admin/integrations/oauth/:type - Get OAuth authorization URL
router.get('/oauth/:type', integrationController.getOAuthUrl);

// POST /api/admin/integrations/oauth/:type/callback - Handle OAuth callback
router.post('/oauth/:type/callback', integrationController.handleOAuthCallback);

// POST /api/admin/integrations/:id/revoke - Revoke OAuth access
router.post('/:id/revoke', integrationController.revokeOAuth);

// GET /api/admin/integrations/:id/webhooks - Get webhooks for an integration
router.get('/:id/webhooks', integrationController.getWebhooks);

// PUT /api/admin/integrations/:id/webhooks/:webhookId - Update webhook for an integration
router.put('/:id/webhooks/:webhookId', integrationController.updateWebhook);

module.exports = router;
