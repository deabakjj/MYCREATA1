/**
 * IntegrationService - Handles API calls for integrations with external services
 * 
 * This service manages all the API communications related to third-party integrations
 * such as auth providers (Magic.link, Web3Auth), social media platforms, and other web3 services.
 */

import api from './api';

/**
 * Service for managing all integrations in the Nest platform
 */
class IntegrationService {
  /**
   * Fetches all active integrations
   * 
   * @returns {Promise<Array>} The list of active integrations
   */
  async getIntegrations() {
    try {
      const response = await api.get('/api/admin/integrations');
      return response.data;
    } catch (error) {
      console.error('Error fetching integrations:', error);
      throw error;
    }
  }

  /**
   * Fetches a specific integration by ID
   * 
   * @param {string} integrationId - The ID of the integration to fetch
   * @returns {Promise<Object>} The integration details
   */
  async getIntegrationById(integrationId) {
    try {
      const response = await api.get(`/api/admin/integrations/${integrationId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching integration ${integrationId}:`, error);
      throw error;
    }
  }

  /**
   * Updates an existing integration
   * 
   * @param {string} integrationId - The ID of the integration to update
   * @param {Object} integrationData - The updated integration data
   * @returns {Promise<Object>} The updated integration
   */
  async updateIntegration(integrationId, integrationData) {
    try {
      const response = await api.put(`/api/admin/integrations/${integrationId}`, integrationData);
      return response.data;
    } catch (error) {
      console.error(`Error updating integration ${integrationId}:`, error);
      throw error;
    }
  }

  /**
   * Adds a new integration
   * 
   * @param {Object} integrationData - The integration data to add
   * @returns {Promise<Object>} The newly added integration
   */
  async addIntegration(integrationData) {
    try {
      const response = await api.post('/api/admin/integrations', integrationData);
      return response.data;
    } catch (error) {
      console.error('Error adding integration:', error);
      throw error;
    }
  }

  /**
   * Removes an integration
   * 
   * @param {string} integrationId - The ID of the integration to remove
   * @returns {Promise<Object>} The result of the operation
   */
  async removeIntegration(integrationId) {
    try {
      const response = await api.delete(`/api/admin/integrations/${integrationId}`);
      return response.data;
    } catch (error) {
      console.error(`Error removing integration ${integrationId}:`, error);
      throw error;
    }
  }

  /**
   * Tests an integration's connection
   * 
   * @param {string} integrationId - The ID of the integration to test
   * @returns {Promise<Object>} The test results
   */
  async testIntegration(integrationId) {
    try {
      const response = await api.post(`/api/admin/integrations/${integrationId}/test`);
      return response.data;
    } catch (error) {
      console.error(`Error testing integration ${integrationId}:`, error);
      throw error;
    }
  }

  /**
   * Fetches all available integration types and their configuration options
   * 
   * @returns {Promise<Array>} The list of available integration types
   */
  async getIntegrationTypes() {
    try {
      const response = await api.get('/api/admin/integrations/types');
      return response.data;
    } catch (error) {
      console.error('Error fetching integration types:', error);
      throw error;
    }
  }

  /**
   * Fetches statistics for a specific integration
   * 
   * @param {string} integrationId - The ID of the integration
   * @returns {Promise<Object>} The integration statistics
   */
  async getIntegrationStats(integrationId) {
    try {
      const response = await api.get(`/api/admin/integrations/${integrationId}/stats`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching integration stats for ${integrationId}:`, error);
      throw error;
    }
  }

  /**
   * Sync data with a specific integration
   * 
   * @param {string} integrationId - The ID of the integration
   * @returns {Promise<Object>} The result of the sync operation
   */
  async syncIntegration(integrationId) {
    try {
      const response = await api.post(`/api/admin/integrations/${integrationId}/sync`);
      return response.data;
    } catch (error) {
      console.error(`Error syncing integration ${integrationId}:`, error);
      throw error;
    }
  }

  /**
   * Fetches OAuth authorization URL for a specific integration type
   * 
   * @param {string} integrationType - The type of integration (e.g., 'twitter', 'facebook')
   * @returns {Promise<string>} The OAuth authorization URL
   */
  async getOAuthUrl(integrationType) {
    try {
      const response = await api.get(`/api/admin/integrations/oauth/${integrationType}`);
      return response.data.url;
    } catch (error) {
      console.error(`Error fetching OAuth URL for ${integrationType}:`, error);
      throw error;
    }
  }

  /**
   * Completes OAuth flow with authorization code
   * 
   * @param {string} integrationType - The type of integration
   * @param {string} code - The authorization code
   * @returns {Promise<Object>} The result of the OAuth flow
   */
  async completeOAuth(integrationType, code) {
    try {
      const response = await api.post(`/api/admin/integrations/oauth/${integrationType}/callback`, { code });
      return response.data;
    } catch (error) {
      console.error(`Error completing OAuth for ${integrationType}:`, error);
      throw error;
    }
  }

  /**
   * Revokes OAuth access for a specific integration
   * 
   * @param {string} integrationId - The ID of the integration
   * @returns {Promise<Object>} The result of the revoke operation
   */
  async revokeOAuth(integrationId) {
    try {
      const response = await api.post(`/api/admin/integrations/${integrationId}/revoke`);
      return response.data;
    } catch (error) {
      console.error(`Error revoking OAuth for integration ${integrationId}:`, error);
      throw error;
    }
  }

  /**
   * Fetches integration webhooks
   * 
   * @param {string} integrationId - The ID of the integration
   * @returns {Promise<Array>} The list of webhooks for the integration
   */
  async getIntegrationWebhooks(integrationId) {
    try {
      const response = await api.get(`/api/admin/integrations/${integrationId}/webhooks`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching webhooks for integration ${integrationId}:`, error);
      throw error;
    }
  }

  /**
   * Updates webhook settings for an integration
   * 
   * @param {string} integrationId - The ID of the integration
   * @param {string} webhookId - The ID of the webhook
   * @param {Object} webhookData - The updated webhook data
   * @returns {Promise<Object>} The updated webhook
   */
  async updateWebhook(integrationId, webhookId, webhookData) {
    try {
      const response = await api.put(`/api/admin/integrations/${integrationId}/webhooks/${webhookId}`, webhookData);
      return response.data;
    } catch (error) {
      console.error(`Error updating webhook ${webhookId} for integration ${integrationId}:`, error);
      throw error;
    }
  }
}

export default new IntegrationService();
