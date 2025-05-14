/**
 * Integration Model for Nest Platform
 * 
 * This model defines the schema for storing integration configurations
 * for external services such as authentication providers, social media,
 * blockchain services, and other third-party APIs.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Integration Schema
 * - Handles all external service integrations for the Nest platform
 * - Stores API keys, secrets, and configuration settings
 * - Tracks usage statistics and connection status
 */
const IntegrationSchema = new Schema({
  // Basic information
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  type: {
    type: String,
    required: true,
    enum: [
      // Authentication providers
      'magic_link', 'web3auth', 'metamask', 'wallet_connect',
      
      // Social platforms
      'twitter', 'facebook', 'discord', 'telegram', 'instagram',
      
      // Blockchain services
      'moralis', 'alchemy', 'infura', 'the_graph',
      
      // Payment gateways
      'stripe', 'paypal', 'circle',
      
      // AI services
      'openai', 'claude', 'hugging_face',
      
      // Other integrations
      'email_service', 'sms_service', 'push_notification', 'custom'
    ]
  },
  
  // Integration category for grouping in UI
  category: {
    type: String,
    required: true,
    enum: ['auth', 'social', 'blockchain', 'payment', 'ai', 'other'],
    default: 'other'
  },
  
  description: {
    type: String,
    trim: true
  },
  
  // Active status
  enabled: {
    type: Boolean,
    default: false
  },
  
  // Configuration object (encrypted in database)
  // Contains API keys, secrets, endpoints, etc.
  config: {
    type: Object,
    default: {}
  },
  
  // Webhook configurations
  webhooks: [{
    endpoint: {
      type: String,
      trim: true
    },
    eventType: {
      type: String,
      trim: true
    },
    secret: {
      type: String,
      trim: true
    },
    enabled: {
      type: Boolean,
      default: true
    },
    lastTriggered: {
      type: Date
    },
    failureCount: {
      type: Number,
      default: 0
    }
  }],
  
  // OAuth specific fields
  oauthConnected: {
    type: Boolean,
    default: false
  },
  
  oauthTokens: {
    accessToken: String,
    refreshToken: String,
    expiresAt: Date,
    scope: String
  },
  
  // Statistics and monitoring
  stats: {
    lastSynced: Date,
    usageCount: {
      type: Number,
      default: 0
    },
    connectedUsers: {
      type: Number,
      default: 0
    },
    dailyApiCalls: {
      type: Number,
      default: 0
    },
    monthlyApiCalls: {
      type: Number,
      default: 0
    },
    failureRate: {
      type: Number,
      default: 0
    }
  },
  
  // Health check information
  health: {
    status: {
      type: String,
      enum: ['healthy', 'degraded', 'failing', 'unknown'],
      default: 'unknown'
    },
    lastChecked: Date,
    message: String
  },
  
  // Custom fields specific to this integration
  customFields: {
    type: Object,
    default: {}
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, { 
  timestamps: true,
  // Add virtual getters when converting to JSON
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Virtual field to determine if API credentials need to be refreshed
 */
IntegrationSchema.virtual('needsRefresh').get(function() {
  if (!this.oauthTokens || !this.oauthTokens.expiresAt) {
    return false;
  }
  
  // Check if token expires in the next 24 hours
  const expiryDate = new Date(this.oauthTokens.expiresAt);
  const oneDayFromNow = new Date();
  oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
  
  return expiryDate < oneDayFromNow;
});

/**
 * Pre-save middleware to update timestamps
 */
IntegrationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

/**
 * Static method to find integrations by category
 * 
 * @param {string} category - Category name
 * @returns {Promise<Array>} List of integrations in the category
 */
IntegrationSchema.statics.findByCategory = function(category) {
  return this.find({ category });
};

/**
 * Static method to find active integrations
 * 
 * @returns {Promise<Array>} List of enabled integrations
 */
IntegrationSchema.statics.findEnabled = function() {
  return this.find({ enabled: true });
};

/**
 * Static method to find integrations needing OAuth refresh
 * 
 * @returns {Promise<Array>} List of integrations needing refresh
 */
IntegrationSchema.statics.findNeedingRefresh = function() {
  const oneDayFromNow = new Date();
  oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
  
  return this.find({
    oauthConnected: true,
    'oauthTokens.expiresAt': { $lt: oneDayFromNow }
  });
};

/**
 * Method to securely get configuration
 * In a real implementation, sensitive fields would be encrypted/decrypted here
 * 
 * @returns {Object} Decrypted configuration object
 */
IntegrationSchema.methods.getSecureConfig = function() {
  // In a real implementation, we would decrypt sensitive fields here
  return this.config;
};

/**
 * Method to check health of integration connection
 * 
 * @returns {Promise<Object>} Health status object
 */
IntegrationSchema.methods.checkHealth = async function() {
  // Implementation would depend on the specific integration type
  // This is a placeholder for custom health check logic
  
  try {
    // Example health check implementation
    // const result = await performHealthCheck(this.type, this.getSecureConfig());
    const result = { status: 'healthy', message: 'Connection working properly' };
    
    // Update the health information
    this.health.status = result.status;
    this.health.message = result.message;
    this.health.lastChecked = new Date();
    
    await this.save();
    
    return result;
  } catch (error) {
    const result = { 
      status: 'failing', 
      message: `Health check failed: ${error.message}` 
    };
    
    this.health.status = 'failing';
    this.health.message = result.message;
    this.health.lastChecked = new Date();
    
    await this.save();
    
    return result;
  }
};

/**
 * Method to increment usage statistics
 * 
 * @returns {Promise<void>}
 */
IntegrationSchema.methods.incrementUsage = async function() {
  this.stats.usageCount += 1;
  this.stats.dailyApiCalls += 1;
  this.stats.monthlyApiCalls += 1;
  
  await this.save();
};

/**
 * Method to track a failed API call
 * 
 * @param {Error} error - The error that occurred
 * @returns {Promise<void>}
 */
IntegrationSchema.methods.trackFailure = async function(error) {
  // Calculate new failure rate based on total calls
  const totalCalls = this.stats.usageCount || 1;
  this.stats.failureRate = ((this.stats.failureRate * (totalCalls - 1)) + 1) / totalCalls;
  
  // Update health status if failure rate exceeds threshold
  if (this.stats.failureRate > 0.1) { // 10% failure rate threshold
    this.health.status = 'degraded';
    this.health.message = `High failure rate (${(this.stats.failureRate * 100).toFixed(2)}%)`;
  }
  
  if (this.stats.failureRate > 0.5) { // 50% failure rate threshold
    this.health.status = 'failing';
    this.health.message = `Critical failure rate (${(this.stats.failureRate * 100).toFixed(2)}%)`;
  }
  
  this.health.lastChecked = new Date();
  
  await this.save();
};

/**
 * Method to reset daily and monthly counters
 * Called by a scheduled task
 * 
 * @returns {Promise<void>}
 */
IntegrationSchema.methods.resetCounters = async function(type) {
  if (type === 'daily' || type === 'all') {
    this.stats.dailyApiCalls = 0;
  }
  
  if (type === 'monthly' || type === 'all') {
    this.stats.monthlyApiCalls = 0;
  }
  
  await this.save();
};

// Create and export the model
const Integration = mongoose.model('Integration', IntegrationSchema);
module.exports = Integration;
