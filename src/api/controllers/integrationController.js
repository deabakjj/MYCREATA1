/**
 * Integration Controller
 * 
 * Handles API requests related to external service integrations
 * Used by the admin panel to manage authentication providers, social media,
 * blockchain services, and other third-party integrations.
 */

const Integration = require('../../models/integration');
const { encryptData, decryptData } = require('../../utils/encryption');
const logger = require('../../utils/logger');
const { errorResponse, successResponse } = require('../../utils/responseHandler');

/**
 * Get all integrations
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with integrations
 */
exports.getAllIntegrations = async (req, res) => {
  try {
    // Get query parameters for filtering
    const { category, type, enabled } = req.query;
    
    // Build query object based on parameters
    const query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (type) {
      query.type = type;
    }
    
    if (enabled !== undefined) {
      query.enabled = enabled === 'true';
    }
    
    // Get all integrations matching the query
    const integrations = await Integration.find(query);
    
    // Remove sensitive information before sending response
    const safeIntegrations = integrations.map(integration => {
      const integrationObj = integration.toObject();
      
      // Remove sensitive fields
      if (integrationObj.config) {
        // Only include non-sensitive fields or mask sensitive ones
        Object.keys(integrationObj.config).forEach(key => {
          if (key.toLowerCase().includes('key') || 
              key.toLowerCase().includes('secret') || 
              key.toLowerCase().includes('password') || 
              key.toLowerCase().includes('token')) {
            integrationObj.config[key] = '••••••••';
          }
        });
      }
      
      // Remove OAuth tokens
      if (integrationObj.oauthTokens) {
        delete integrationObj.oauthTokens.accessToken;
        delete integrationObj.oauthTokens.refreshToken;
      }
      
      return integrationObj;
    });
    
    return successResponse(res, 'Integrations retrieved successfully', safeIntegrations);
  } catch (error) {
    logger.error('Error retrieving integrations:', error);
    return errorResponse(res, 'Failed to retrieve integrations', 500);
  }
};

/**
 * Get integration by ID
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with integration
 */
exports.getIntegrationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find integration by ID
    const integration = await Integration.findById(id);
    
    if (!integration) {
      return errorResponse(res, 'Integration not found', 404);
    }
    
    // Remove sensitive information before sending response
    const integrationObj = integration.toObject();
    
    // Remove sensitive fields
    if (integrationObj.config) {
      // Only include non-sensitive fields or mask sensitive ones
      Object.keys(integrationObj.config).forEach(key => {
        if (key.toLowerCase().includes('key') || 
            key.toLowerCase().includes('secret') || 
            key.toLowerCase().includes('password') || 
            key.toLowerCase().includes('token')) {
          integrationObj.config[key] = '••••••••';
        }
      });
    }
    
    // Remove OAuth tokens
    if (integrationObj.oauthTokens) {
      delete integrationObj.oauthTokens.accessToken;
      delete integrationObj.oauthTokens.refreshToken;
    }
    
    return successResponse(res, 'Integration retrieved successfully', integrationObj);
  } catch (error) {
    logger.error(`Error retrieving integration ${req.params.id}:`, error);
    return errorResponse(res, 'Failed to retrieve integration', 500);
  }
};

/**
 * Create new integration
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with created integration
 */
exports.createIntegration = async (req, res) => {
  try {
    const { name, type, category, description, enabled, config } = req.body;
    
    // Check if integration with the same name already exists
    const existingIntegration = await Integration.findOne({ name });
    
    if (existingIntegration) {
      return errorResponse(res, 'Integration with this name already exists', 400);
    }
    
    // Encrypt sensitive data in config
    let secureConfig = { ...config };
    
    if (config) {
      // Encrypt sensitive fields
      Object.keys(config).forEach(key => {
        if (key.toLowerCase().includes('key') || 
            key.toLowerCase().includes('secret') || 
            key.toLowerCase().includes('password') || 
            key.toLowerCase().includes('token')) {
          secureConfig[key] = encryptData(config[key]);
        }
      });
    }
    
    // Create new integration
    const integration = new Integration({
      name,
      type,
      category: category || getDefaultCategory(type),
      description,
      enabled: enabled || false,
      config: secureConfig,
      createdBy: req.user?._id // Assuming user info is available through authentication middleware
    });
    
    // Save integration to database
    await integration.save();
    
    // Remove sensitive information before sending response
    const integrationObj = integration.toObject();
    
    // Mask sensitive fields
    if (integrationObj.config) {
      Object.keys(integrationObj.config).forEach(key => {
        if (key.toLowerCase().includes('key') || 
            key.toLowerCase().includes('secret') || 
            key.toLowerCase().includes('password') || 
            key.toLowerCase().includes('token')) {
          integrationObj.config[key] = '••••••••';
        }
      });
    }
    
    return successResponse(res, 'Integration created successfully', integrationObj, 201);
  } catch (error) {
    logger.error('Error creating integration:', error);
    return errorResponse(res, 'Failed to create integration', 500);
  }
};

/**
 * Update integration by ID
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with updated integration
 */
exports.updateIntegration = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, category, description, enabled, config } = req.body;
    
    // Find integration by ID
    const integration = await Integration.findById(id);
    
    if (!integration) {
      return errorResponse(res, 'Integration not found', 404);
    }
    
    // If updating name, check if new name already exists (except for this integration)
    if (name && name !== integration.name) {
      const existingIntegration = await Integration.findOne({ name, _id: { $ne: id } });
      
      if (existingIntegration) {
        return errorResponse(res, 'Integration with this name already exists', 400);
      }
      
      integration.name = name;
    }
    
    // Update basic fields
    if (type) integration.type = type;
    if (category) integration.category = category;
    if (description !== undefined) integration.description = description;
    if (enabled !== undefined) integration.enabled = enabled;
    
    // Update config if provided
    if (config) {
      // Get existing decrypted config
      const existingConfig = integration.getSecureConfig();
      let updatedConfig = { ...existingConfig };
      
      // Update with new values
      Object.keys(config).forEach(key => {
        // If the field is sensitive and the value is masked, keep the existing value
        if ((key.toLowerCase().includes('key') || 
             key.toLowerCase().includes('secret') || 
             key.toLowerCase().includes('password') || 
             key.toLowerCase().includes('token')) && 
             config[key] === '••••••••') {
          // Keep existing value
        } else {
          // Otherwise update with new value
          if ((key.toLowerCase().includes('key') || 
               key.toLowerCase().includes('secret') || 
               key.toLowerCase().includes('password') || 
               key.toLowerCase().includes('token'))) {
            // Encrypt sensitive data
            updatedConfig[key] = encryptData(config[key]);
          } else {
            updatedConfig[key] = config[key];
          }
        }
      });
      
      integration.config = updatedConfig;
    }
    
    // Set updated metadata
    integration.updatedAt = new Date();
    integration.updatedBy = req.user?._id; // Assuming user info is available through authentication middleware
    
    // Save updated integration
    await integration.save();
    
    // Remove sensitive information before sending response
    const integrationObj = integration.toObject();
    
    // Mask sensitive fields
    if (integrationObj.config) {
      Object.keys(integrationObj.config).forEach(key => {
        if (key.toLowerCase().includes('key') || 
            key.toLowerCase().includes('secret') || 
            key.toLowerCase().includes('password') || 
            key.toLowerCase().includes('token')) {
          integrationObj.config[key] = '••••••••';
        }
      });
    }
    
    // Remove OAuth tokens
    if (integrationObj.oauthTokens) {
      delete integrationObj.oauthTokens.accessToken;
      delete integrationObj.oauthTokens.refreshToken;
    }
    
    return successResponse(res, 'Integration updated successfully', integrationObj);
  } catch (error) {
    logger.error(`Error updating integration ${req.params.id}:`, error);
    return errorResponse(res, 'Failed to update integration', 500);
  }
};

/**
 * Delete integration by ID
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with success message
 */
exports.deleteIntegration = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find integration by ID
    const integration = await Integration.findById(id);
    
    if (!integration) {
      return errorResponse(res, 'Integration not found', 404);
    }
    
    // Delete integration
    await integration.deleteOne();
    
    return successResponse(res, 'Integration deleted successfully');
  } catch (error) {
    logger.error(`Error deleting integration ${req.params.id}:`, error);
    return errorResponse(res, 'Failed to delete integration', 500);
  }
};

/**
 * Test integration connection
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with test results
 */
exports.testIntegration = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find integration by ID
    const integration = await Integration.findById(id);
    
    if (!integration) {
      return errorResponse(res, 'Integration not found', 404);
    }
    
    // If integration is not enabled, return error
    if (!integration.enabled) {
      return errorResponse(res, 'Integration is not enabled', 400);
    }
    
    // Perform health check
    const healthResult = await integration.checkHealth();
    
    return successResponse(res, 'Integration test completed', {
      success: healthResult.status === 'healthy',
      message: healthResult.message,
      status: healthResult.status
    });
  } catch (error) {
    logger.error(`Error testing integration ${req.params.id}:`, error);
    return errorResponse(res, 'Failed to test integration', 500);
  }
};

/**
 * Get all available integration types
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with integration types
 */
exports.getIntegrationTypes = async (req, res) => {
  try {
    // This would typically come from a configuration file or database
    // Here we're hardcoding for demonstration purposes
    const integrationTypes = [
      {
        id: 'magic_link',
        name: 'Magic Link',
        description: 'Email-based authentication without passwords',
        category: 'auth',
        authType: 'apikey',
        configFields: [
          { name: 'publishableKey', label: 'Publishable Key', type: 'text' },
          { name: 'secretKey', label: 'Secret Key', type: 'secret' },
          { name: 'callbackUrl', label: 'Callback URL', type: 'text' }
        ]
      },
      {
        id: 'web3auth',
        name: 'Web3Auth',
        description: 'Multi-chain wallet authentication',
        category: 'auth',
        authType: 'oauth',
        configFields: [
          { name: 'clientId', label: 'Client ID', type: 'text' },
          { name: 'clientSecret', label: 'Client Secret', type: 'secret' },
          { name: 'network', label: 'Network', type: 'select', options: ['mainnet', 'testnet'] }
        ]
      },
      {
        id: 'twitter',
        name: 'Twitter',
        description: 'Twitter social media integration',
        category: 'social',
        authType: 'oauth',
        configFields: [
          { name: 'apiKey', label: 'API Key', type: 'text' },
          { name: 'apiSecret', label: 'API Secret', type: 'secret' },
          { name: 'accessToken', label: 'Access Token', type: 'secret' },
          { name: 'accessTokenSecret', label: 'Access Token Secret', type: 'secret' }
        ]
      },
      {
        id: 'facebook',
        name: 'Facebook',
        description: 'Facebook social media integration',
        category: 'social',
        authType: 'oauth',
        configFields: [
          { name: 'appId', label: 'App ID', type: 'text' },
          { name: 'appSecret', label: 'App Secret', type: 'secret' },
          { name: 'scope', label: 'Scope', type: 'text', default: 'public_profile,email' }
        ]
      },
      {
        id: 'moralis',
        name: 'Moralis',
        description: 'Web3 API for blockchain data',
        category: 'blockchain',
        authType: 'apikey',
        configFields: [
          { name: 'apiKey', label: 'API Key', type: 'secret' },
          { name: 'serverUrl', label: 'Server URL', type: 'text' },
          { name: 'appId', label: 'App ID', type: 'text' }
        ]
      },
      {
        id: 'alchemy',
        name: 'Alchemy',
        description: 'Blockchain infrastructure and developer platform',
        category: 'blockchain',
        authType: 'apikey',
        configFields: [
          { name: 'apiKey', label: 'API Key', type: 'secret' },
          { name: 'rpcUrl', label: 'RPC URL', type: 'text' },
          { name: 'network', label: 'Network', type: 'select', options: ['mainnet', 'testnet', 'goerli'] }
        ]
      },
      {
        id: 'openai',
        name: 'OpenAI',
        description: 'AI service for generating text, images, and more',
        category: 'ai',
        authType: 'apikey',
        configFields: [
          { name: 'apiKey', label: 'API Key', type: 'secret' },
          { name: 'model', label: 'Default Model', type: 'text', default: 'gpt-4' },
          { name: 'temperature', label: 'Temperature', type: 'number', default: 0.7 }
        ]
      },
      {
        id: 'claude',
        name: 'Claude AI',
        description: 'Anthropic\'s Claude AI assistant',
        category: 'ai',
        authType: 'apikey',
        configFields: [
          { name: 'apiKey', label: 'API Key', type: 'secret' },
          { name: 'model', label: 'Default Model', type: 'text', default: 'claude-3-opus-20240229' },
          { name: 'temperature', label: 'Temperature', type: 'number', default: 0.7 }
        ]
      },
      {
        id: 'stripe',
        name: 'Stripe',
        description: 'Payment processing platform',
        category: 'payment',
        authType: 'apikey',
        configFields: [
          { name: 'publishableKey', label: 'Publishable Key', type: 'text' },
          { name: 'secretKey', label: 'Secret Key', type: 'secret' },
          { name: 'webhookSecret', label: 'Webhook Secret', type: 'secret' }
        ]
      }
    ];
    
    return successResponse(res, 'Integration types retrieved successfully', integrationTypes);
  } catch (error) {
    logger.error('Error retrieving integration types:', error);
    return errorResponse(res, 'Failed to retrieve integration types', 500);
  }
};

/**
 * Get integration statistics
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with integration statistics
 */
exports.getIntegrationStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find integration by ID
    const integration = await Integration.findById(id);
    
    if (!integration) {
      return errorResponse(res, 'Integration not found', 404);
    }
    
    // Get basic stats
    const stats = {
      ...integration.stats,
      health: integration.health,
      lastUpdated: integration.updatedAt
    };
    
    // Get additional stats based on integration type
    // This would typically involve fetching data from the integration's API
    // Here we're just returning the basic stats
    
    return successResponse(res, 'Integration statistics retrieved successfully', stats);
  } catch (error) {
    logger.error(`Error retrieving integration statistics for ${req.params.id}:`, error);
    return errorResponse(res, 'Failed to retrieve integration statistics', 500);
  }
};

/**
 * Sync data with integration
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with sync results
 */
exports.syncIntegration = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find integration by ID
    const integration = await Integration.findById(id);
    
    if (!integration) {
      return errorResponse(res, 'Integration not found', 404);
    }
    
    // If integration is not enabled, return error
    if (!integration.enabled) {
      return errorResponse(res, 'Integration is not enabled', 400);
    }
    
    // Perform sync operation based on integration type
    // This would typically involve fetching data from the integration's API
    // and updating local data
    // Here we're just updating the lastSynced timestamp
    
    integration.stats.lastSynced = new Date();
    await integration.save();
    
    return successResponse(res, 'Integration synced successfully', {
      success: true,
      lastSynced: integration.stats.lastSynced
    });
  } catch (error) {
    logger.error(`Error syncing integration ${req.params.id}:`, error);
    return errorResponse(res, 'Failed to sync integration', 500);
  }
};

/**
 * Get OAuth authorization URL
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with OAuth URL
 */
exports.getOAuthUrl = async (req, res) => {
  try {
    const { type } = req.params;
    
    // Generate OAuth URL based on integration type
    // This would typically involve using a library specific to the OAuth provider
    // Here we're just returning a mock URL
    
    const redirectUri = `${req.protocol}://${req.get('host')}/api/admin/integrations/oauth/${type}/callback`;
    const oauthUrl = `https://example.com/oauth/authorize?client_id=mock_client_id&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=read,write`;
    
    return successResponse(res, 'OAuth URL generated successfully', { url: oauthUrl });
  } catch (error) {
    logger.error(`Error generating OAuth URL for ${req.params.type}:`, error);
    return errorResponse(res, 'Failed to generate OAuth URL', 500);
  }
};

/**
 * Handle OAuth callback
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with OAuth result
 */
exports.handleOAuthCallback = async (req, res) => {
  try {
    const { type } = req.params;
    const { code } = req.body;
    
    if (!code) {
      return errorResponse(res, 'Authorization code is required', 400);
    }
    
    // Find integration by type
    const integration = await Integration.findOne({ type });
    
    if (!integration) {
      return errorResponse(res, 'Integration not found', 404);
    }
    
    // Exchange authorization code for access token
    // This would typically involve using a library specific to the OAuth provider
    // Here we're just updating the integration with mock tokens
    
    integration.oauthConnected = true;
    integration.oauthTokens = {
      accessToken: encryptData('mock_access_token'),
      refreshToken: encryptData('mock_refresh_token'),
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      scope: 'read,write'
    };
    
    await integration.save();
    
    return successResponse(res, 'OAuth authorization completed successfully', {
      success: true,
      integration: integration.name
    });
  } catch (error) {
    logger.error(`Error handling OAuth callback for ${req.params.type}:`, error);
    return errorResponse(res, 'Failed to complete OAuth authorization', 500);
  }
};

/**
 * Revoke OAuth access
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with revoke result
 */
exports.revokeOAuth = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find integration by ID
    const integration = await Integration.findById(id);
    
    if (!integration) {
      return errorResponse(res, 'Integration not found', 404);
    }
    
    // If integration is not using OAuth, return error
    if (!integration.oauthConnected) {
      return errorResponse(res, 'Integration is not using OAuth', 400);
    }
    
    // Revoke OAuth access
    // This would typically involve calling the OAuth provider's revoke endpoint
    // Here we're just updating the integration
    
    integration.oauthConnected = false;
    integration.oauthTokens = {
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      scope: null
    };
    
    await integration.save();
    
    return successResponse(res, 'OAuth access revoked successfully', {
      success: true
    });
  } catch (error) {
    logger.error(`Error revoking OAuth for integration ${req.params.id}:`, error);
    return errorResponse(res, 'Failed to revoke OAuth access', 500);
  }
};

/**
 * Get webhooks for an integration
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with webhooks
 */
exports.getWebhooks = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find integration by ID
    const integration = await Integration.findById(id);
    
    if (!integration) {
      return errorResponse(res, 'Integration not found', 404);
    }
    
    // Return webhooks with sensitive data masked
    const webhooks = integration.webhooks.map(webhook => {
      const webhookObj = webhook.toObject ? webhook.toObject() : webhook;
      
      // Mask secret
      if (webhookObj.secret) {
        webhookObj.secret = '••••••••';
      }
      
      return webhookObj;
    });
    
    return successResponse(res, 'Webhooks retrieved successfully', webhooks);
  } catch (error) {
    logger.error(`Error retrieving webhooks for integration ${req.params.id}:`, error);
    return errorResponse(res, 'Failed to retrieve webhooks', 500);
  }
};

/**
 * Update webhook for an integration
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with updated webhook
 */
exports.updateWebhook = async (req, res) => {
  try {
    const { id, webhookId } = req.params;
    const { endpoint, eventType, secret, enabled } = req.body;
    
    // Find integration by ID
    const integration = await Integration.findById(id);
    
    if (!integration) {
      return errorResponse(res, 'Integration not found', 404);
    }
    
    // Find webhook by ID
    const webhookIndex = integration.webhooks.findIndex(webhook => 
      webhook._id.toString() === webhookId);
    
    if (webhookIndex === -1) {
      return errorResponse(res, 'Webhook not found', 404);
    }
    
    // Update webhook fields
    if (endpoint) {
      integration.webhooks[webhookIndex].endpoint = endpoint;
    }
    
    if (eventType) {
      integration.webhooks[webhookIndex].eventType = eventType;
    }
    
    if (secret && secret !== '••••••••') {
      integration.webhooks[webhookIndex].secret = encryptData(secret);
    }
    
    if (enabled !== undefined) {
      integration.webhooks[webhookIndex].enabled = enabled;
    }
    
    // Save integration
    await integration.save();
    
    // Return updated webhook with sensitive data masked
    const updatedWebhook = integration.webhooks[webhookIndex].toObject();
    
    // Mask secret
    if (updatedWebhook.secret) {
      updatedWebhook.secret = '••••••••';
    }
    
    return successResponse(res, 'Webhook updated successfully', updatedWebhook);
  } catch (error) {
    logger.error(`Error updating webhook ${req.params.webhookId} for integration ${req.params.id}:`, error);
    return errorResponse(res, 'Failed to update webhook', 500);
  }
};

/**
 * Helper function to get default category based on integration type
 * 
 * @param {string} type - Integration type
 * @returns {string} - Default category
 */
function getDefaultCategory(type) {
  const authTypes = ['magic_link', 'web3auth', 'metamask', 'wallet_connect'];
  const socialTypes = ['twitter', 'facebook', 'discord', 'telegram', 'instagram'];
  const blockchainTypes = ['moralis', 'alchemy', 'infura', 'the_graph'];
  const paymentTypes = ['stripe', 'paypal', 'circle'];
  const aiTypes = ['openai', 'claude', 'hugging_face'];
  
  if (authTypes.includes(type)) return 'auth';
  if (socialTypes.includes(type)) return 'social';
  if (blockchainTypes.includes(type)) return 'blockchain';
  if (paymentTypes.includes(type)) return 'payment';
  if (aiTypes.includes(type)) return 'ai';
  
  return 'other';
}
