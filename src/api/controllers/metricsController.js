/**
 * @file Metrics Controller
 * @description Controller for metrics endpoints used by Prometheus and admin dashboard
 */

const { register, collectDefaultMetrics, Gauge, Counter } = require('prom-client');
const UserModel = require('../../models/user');
const WalletModel = require('../../models/wallet');
const ActivityModel = require('../../models/activity');
const { responseHandler } = require('../../utils/responseHandler');
const logger = require('../../utils/logger');

// Enable default metrics collection (CPU, memory, event loop, etc.)
collectDefaultMetrics({ prefix: 'nest_' });

// Initialize custom metrics
const activeUsers = new Gauge({
  name: 'nest_active_users',
  help: 'Number of active users in the last 30 days',
  labelNames: ['type']
});

const nftMintsTotal = new Counter({
  name: 'nest_nft_mints_total',
  help: 'Total number of NFTs minted',
  labelNames: ['type']
});

const tokenTransfersTotal = new Counter({
  name: 'nest_token_transfers_total',
  help: 'Total number of token transfers',
  labelNames: ['direction']
});

const missionCompletionsTotal = new Counter({
  name: 'nest_mission_completions_total',
  help: 'Total number of missions completed',
  labelNames: ['type']
});

const userConversionRate = new Gauge({
  name: 'nest_user_conversion_rate',
  help: 'Percentage of Web2 users converted to Web3 users'
});

const newUsersTotal = new Gauge({
  name: 'nest_new_users_total',
  help: 'Total number of new users'
});

const convertedUsersTotal = new Gauge({
  name: 'nest_converted_users_total',
  help: 'Total number of users converted from Web2 to Web3'
});

const walletRetentionRate = new Gauge({
  name: 'nest_wallet_retention_rate',
  help: 'Percentage of wallets retained after reward distribution'
});

const totalWallets = new Gauge({
  name: 'nest_total_wallets',
  help: 'Total number of wallets created'
});

const retainedWallets = new Gauge({
  name: 'nest_retained_wallets',
  help: 'Number of wallets still active after reward distribution'
});

const tokenExchangeVolumeCta = new Gauge({
  name: 'nest_token_exchange_volume_cta',
  help: 'Total volume of CTA exchanged'
});

const tokenExchangeVolumeNest = new Gauge({
  name: 'nest_token_exchange_volume_nest',
  help: 'Total volume of NEST exchanged'
});

const tokenExchangesTotal = new Counter({
  name: 'nest_token_exchanges_total',
  help: 'Total number of token exchanges'
});

const averageXp = new Gauge({
  name: 'nest_average_xp',
  help: 'Average XP per user'
});

const totalXp = new Gauge({
  name: 'nest_total_xp',
  help: 'Total XP accumulated by all users'
});

const averageLevel = new Gauge({
  name: 'nest_average_level',
  help: 'Average user level'
});

const totalNfts = new Gauge({
  name: 'nest_total_nfts',
  help: 'Total number of NFTs minted'
});

const nftHolders = new Gauge({
  name: 'nest_nft_holders',
  help: 'Number of users holding at least one NFT'
});

const averageNftsPerUser = new Gauge({
  name: 'nest_average_nfts_per_user',
  help: 'Average number of NFTs per user'
});

const nftByType = new Gauge({
  name: 'nest_nft_by_type',
  help: 'Number of NFTs by type',
  labelNames: ['type']
});

const usersByLevel = new Gauge({
  name: 'nest_users_by_level',
  help: 'Number of users by level',
  labelNames: ['level']
});

/**
 * @description Get general application metrics for Prometheus
 */
const getGeneralMetrics = async (req, res) => {
  try {
    // Collect and send all registered metrics
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('Error generating metrics', { error });
    res.status(500).end();
  }
};

/**
 * @description Get blockchain related metrics for Prometheus
 */
const getBlockchainMetrics = async (req, res) => {
  try {
    // Update blockchain metrics here before returning
    await updateBlockchainMetrics();
    
    // Return only blockchain related metrics
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('Error generating blockchain metrics', { error });
    res.status(500).end();
  }
};

/**
 * @description Get smart contract metrics for Prometheus
 */
const getContractMetrics = async (req, res) => {
  try {
    // Update contract metrics here before returning
    await updateContractMetrics();
    
    // Return only contract related metrics
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('Error generating contract metrics', { error });
    res.status(500).end();
  }
};

/**
 * @description Get user conversion metrics for admin dashboard
 */
const getUserConversionMetrics = async (req, res) => {
  try {
    const { timeframe } = req.query;
    const metrics = await calculateUserConversionMetrics(timeframe);
    responseHandler.success(res, metrics);
  } catch (error) {
    logger.error('Error fetching user conversion metrics', { error });
    responseHandler.error(res, error.message);
  }
};

/**
 * @description Get wallet retention metrics for admin dashboard
 */
const getWalletRetentionMetrics = async (req, res) => {
  try {
    const { timeframe } = req.query;
    const metrics = await calculateWalletRetentionMetrics(timeframe);
    responseHandler.success(res, metrics);
  } catch (error) {
    logger.error('Error fetching wallet retention metrics', { error });
    responseHandler.error(res, error.message);
  }
};

/**
 * @description Get token exchange metrics for admin dashboard
 */
const getTokenExchangeMetrics = async (req, res) => {
  try {
    const { timeframe } = req.query;
    const metrics = await calculateTokenExchangeMetrics(timeframe);
    responseHandler.success(res, metrics);
  } catch (error) {
    logger.error('Error fetching token exchange metrics', { error });
    responseHandler.error(res, error.message);
  }
};

/**
 * @description Get XP accumulation metrics for admin dashboard
 */
const getXpAccumulationMetrics = async (req, res) => {
  try {
    const { timeframe } = req.query;
    const metrics = await calculateXpAccumulationMetrics(timeframe);
    responseHandler.success(res, metrics);
  } catch (error) {
    logger.error('Error fetching XP accumulation metrics', { error });
    responseHandler.error(res, error.message);
  }
};

/**
 * @description Get NFT ownership metrics for admin dashboard
 */
const getNftOwnershipMetrics = async (req, res) => {
  try {
    const { timeframe } = req.query;
    const metrics = await calculateNftOwnershipMetrics(timeframe);
    responseHandler.success(res, metrics);
  } catch (error) {
    logger.error('Error fetching NFT ownership metrics', { error });
    responseHandler.error(res, error.message);
  }
};

/**
 * @description Update blockchain metrics
 * @private
 */
const updateBlockchainMetrics = async () => {
  try {
    // Example: Update token transfers metric from blockchain
    // This would typically query the blockchain for recent transfers
    const recentTransfers = await ActivityModel.countDocuments({
      type: 'token_transfer',
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    });
    
    // Update metrics
    tokenTransfersTotal.reset();
    tokenTransfersTotal.inc({ direction: 'outgoing' }, recentTransfers * 0.6); // Example split
    tokenTransfersTotal.inc({ direction: 'incoming' }, recentTransfers * 0.4);
  } catch (error) {
    logger.error('Error updating blockchain metrics', { error });
  }
};

/**
 * @description Update contract metrics
 * @private
 */
const updateContractMetrics = async () => {
  try {
    // Example: Update NFT mints metric from blockchain
    // This would typically query the NFT contract for recent mints
    const recentMints = await ActivityModel.countDocuments({
      type: 'nft_mint',
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    });
    
    // Update metrics
    nftMintsTotal.reset();
    nftMintsTotal.inc({ type: 'attendance' }, recentMints * 0.3); // Example distribution
    nftMintsTotal.inc({ type: 'comment' }, recentMints * 0.25);
    nftMintsTotal.inc({ type: 'ranking' }, recentMints * 0.2);
    nftMintsTotal.inc({ type: 'ai' }, recentMints * 0.15);
    nftMintsTotal.inc({ type: 'group' }, recentMints * 0.1);
  } catch (error) {
    logger.error('Error updating contract metrics', { error });
  }
};

/**
 * @description Calculate user conversion metrics
 * @private
 * @param {string} timeframe - The timeframe to calculate metrics for (e.g., '30d', '90d')
 */
const calculateUserConversionMetrics = async (timeframe = '30d') => {
  // Convert timeframe to days
  const days = timeframe.endsWith('d') 
    ? parseInt(timeframe.slice(0, -1)) 
    : 30; // Default to 30 days
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  try {
    // Get total new users in the timeframe
    const totalNewUsers = await UserModel.countDocuments({
      createdAt: { $gte: startDate }
    });
    
    // Get users who converted (made at least one Web3 transaction)
    const convertedUsers = await UserModel.countDocuments({
      createdAt: { $gte: startDate },
      'onchainActivity.firstTransactionDate': { $ne: null }
    });
    
    // Calculate conversion rate
    const conversionRate = totalNewUsers > 0 
      ? (convertedUsers / totalNewUsers) * 100 
      : 0;
    
    // Update Prometheus metrics
    newUsersTotal.set(totalNewUsers);
    convertedUsersTotal.set(convertedUsers);
    userConversionRate.set(conversionRate);
    
    // Return data for the admin dashboard
    return {
      conversionRate,
      totalNewUsers,
      convertedUsers,
      timeSeries: await getUserConversionTimeSeries(days)
    };
  } catch (error) {
    logger.error('Error calculating user conversion metrics', { error });
    throw error;
  }
};

/**
 * @description Calculate wallet retention metrics
 * @private
 * @param {string} timeframe - The timeframe to calculate metrics for (e.g., '30d', '90d')
 */
const calculateWalletRetentionMetrics = async (timeframe = '30d') => {
  // Implementation similar to calculateUserConversionMetrics
  // This would calculate wallet retention after rewards
  return {
    retentionRate: 85.2, // Example data
    totalWallets: 5243,
    retainedWallets: 4467,
    timeSeries: [] // Time series data would go here
  };
};

/**
 * @description Calculate token exchange metrics
 * @private
 * @param {string} timeframe - The timeframe to calculate metrics for (e.g., '30d', '90d')
 */
const calculateTokenExchangeMetrics = async (timeframe = '30d') => {
  // Implementation for token exchange metrics
  return {
    ctaVolume: 15420,
    nestVolume: 15420000,
    exchangeCount: 2341,
    averageExchangeSize: 6.59,
    timeSeries: []
  };
};

/**
 * @description Calculate XP accumulation metrics
 * @private
 * @param {string} timeframe - The timeframe to calculate metrics for (e.g., '30d', '90d')
 */
const calculateXpAccumulationMetrics = async (timeframe = '30d') => {
  // Implementation for XP accumulation metrics
  return {
    averageXp: 1250,
    totalXp: 6534250,
    averageLevel: 3.7,
    xpDistribution: {
      '0-500': 1235,
      '501-1000': 1876,
      '1001-2000': 1123,
      '2001-5000': 841,
      '5001+': 347
    },
    timeSeries: []
  };
};

/**
 * @description Calculate NFT ownership metrics
 * @private
 * @param {string} timeframe - The timeframe to calculate metrics for (e.g., '30d', '90d')
 */
const calculateNftOwnershipMetrics = async (timeframe = '30d') => {
  // Implementation for NFT ownership metrics
  return {
    totalNfts: 18540,
    nftHolders: 3211,
    averageNftsPerUser: 5.8,
    nftsByType: {
      attendance: 7532,
      comment: 6248,
      ranking: 2845,
      ai: 1267,
      group: 648
    },
    timeSeries: []
  };
};

/**
 * @description Get time series data for user conversion over time
 * @private
 * @param {number} days - Number of days to include in the time series
 */
const getUserConversionTimeSeries = async (days) => {
  // This would typically query the database to get daily conversion metrics
  // Example implementation returning mock data
  const timeSeries = [];
  const today = new Date();
  
  for (let i = days; i > 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    timeSeries.push({
      date: date.toISOString().split('T')[0],
      newUsers: Math.floor(Math.random() * 50) + 10,
      convertedUsers: Math.floor(Math.random() * 30) + 5
    });
  }
  
  return timeSeries;
};

module.exports = {
  getGeneralMetrics,
  getBlockchainMetrics,
  getContractMetrics,
  getUserConversionMetrics,
  getWalletRetentionMetrics,
  getTokenExchangeMetrics,
  getXpAccumulationMetrics,
  getNftOwnershipMetrics
};
