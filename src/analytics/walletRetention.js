/**
 * 지갑 유지율 분석 모듈
 * 
 * 보상 지급 이후 사용자가 지갑을 계속 사용하는지 분석합니다.
 * 지갑 생성 후 지속적인 활동과 토큰/NFT 보유 상태를 추적합니다.
 */

const User = require('../models/user');
const Activity = require('../models/activity');
const Wallet = require('../models/wallet');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

/**
 * 지갑 유지율 분석 클래스
 */
class WalletRetentionAnalytics {
  /**
   * 지정된 기간 동안의 지갑 유지율 지표 계산
   * @param {Object} options - 분석 옵션
   * @param {Date} options.startDate - 시작 날짜
   * @param {Date} options.endDate - 종료 날짜
   * @param {Number} options.retentionDays - 유지 기간(일) (기본값: 30)
   * @returns {Promise<Object>} 분석 결과
   */
  async calculateRetentionMetrics(options = {}) {
    try {
      const { startDate, endDate, retentionDays = 30 } = options;
      
      // 날짜 범위 설정
      const dateRange = {};
      if (startDate) dateRange.createdAt = { $gte: startDate };
      if (endDate) dateRange.createdAt = { ...dateRange.createdAt, $lte: endDate };
      
      // 지갑 생성 사용자 집계
      const walletRetention = await Wallet.aggregate([
        { 
          $match: dateRange
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        {
          $unwind: '$userInfo'
        },
        {
          $lookup: {
            from: 'activities',
            let: { userId: '$user' },
            pipeline: [
              { 
                $match: { 
                  $expr: { 
                    $and: [
                      { $eq: ['$user', '$$userId'] },
                      { $eq: ['$category', 'blockchain'] }
                    ]
                  }
                }
              }
            ],
            as: 'blockchainActivities'
          }
        },
        {
          $addFields: {
            // 지갑 생성 후 지정된 기간(retentionDays) 이후 날짜
            retentionDate: {
              $add: ['$createdAt', retentionDays * 24 * 60 * 60 * 1000]
            },
            // 첫 보상 받은 활동 찾기
            firstReward: {
              $filter: {
                input: '$blockchainActivities',
                as: 'activity',
                cond: {
                  $or: [
                    { $eq: ['$$activity.type', 'token_received'] },
                    { $eq: ['$$activity.type', 'nft_received'] }
                  ]
                }
              }
            }
          }
        },
        {
          $addFields: {
            hasReceivedReward: { $gt: [{ $size: '$firstReward' }, 0] },
            firstRewardDate: { $min: '$firstReward.createdAt' },
            // 마지막 블록체인 활동 시간
            lastBlockchainActivity: { $max: '$blockchainActivities.createdAt' },
          }
        },
        {
          $match: {
            hasReceivedReward: true,
            // 보상 받은 지갑만 대상으로 함
            retentionDate: { $lte: new Date() }
            // 유지율 측정 기간이 지난 지갑만
          }
        },
        {
          $addFields: {
            // 보상 이후 지정된 기간(retentionDays) 이후 날짜
            postRewardRetentionDate: {
              $add: ['$firstRewardDate', retentionDays * 24 * 60 * 60 * 1000]
            },
            // 보상 이후 활동들
            postRewardActivities: {
              $filter: {
                input: '$blockchainActivities',
                as: 'activity',
                cond: {
                  $gt: ['$$activity.createdAt', '$firstRewardDate']
                }
              }
            }
          }
        },
        {
          $addFields: {
            // 보상 후 기간 내 활동 여부
            isRetained: {
              $cond: [
                { $gt: ['$lastBlockchainActivity', '$firstRewardDate'] },
                true,
                false
              ]
            },
            // 보상 후 특정 기간(retentionDays) 이후에도 활동 여부
            isLongTermRetained: {
              $cond: [
                { $gt: ['$lastBlockchainActivity', '$postRewardRetentionDate'] },
                true,
                false
              ]
            },
            // 보상부터 마지막 활동까지의 시간(밀리초)
            retentionTime: {
              $cond: [
                { $gt: ['$lastBlockchainActivity', '$firstRewardDate'] },
                { $subtract: ['$lastBlockchainActivity', '$firstRewardDate'] },
                0
              ]
            },
            // 보상 후 활동 횟수
            postRewardActivityCount: { $size: '$postRewardActivities' }
          }
        },
        {
          $group: {
            _id: null,
            totalWallets: { $sum: 1 },
            retainedWallets: { $sum: { $cond: ['$isRetained', 1, 0] } },
            longTermRetainedWallets: { $sum: { $cond: ['$isLongTermRetained', 1, 0] } },
            averageRetentionTime: { $avg: '$retentionTime' },
            averagePostRewardActivities: { $avg: '$postRewardActivityCount' },
            activeWallets: { $sum: { $cond: [{ $gt: ['$postRewardActivityCount', 3] }, 1, 0] } }
          }
        },
        {
          $project: {
            _id: 0,
            totalWallets: 1,
            retainedWallets: 1,
            longTermRetainedWallets: 1,
            retentionRate: {
              $multiply: [
                { $divide: ['$retainedWallets', '$totalWallets'] },
                100
              ]
            },
            longTermRetentionRate: {
              $multiply: [
                { $divide: ['$longTermRetainedWallets', '$totalWallets'] },
                100
              ]
            },
            // 평균 유지 기간(일)
            averageRetentionDays: {
              $divide: [
                { $divide: ['$averageRetentionTime', 1000 * 60 * 60] },
                24
              ]
            },
            averagePostRewardActivities: 1,
            activeWalletRate: {
              $multiply: [
                { $divide: ['$activeWallets', '$totalWallets'] },
                100
              ]
            }
          }
        }
      ]);

      // 소셜 로그인 제공업체별 유지율
      const retentionByProvider = await Wallet.aggregate([
        { 
          $match: dateRange
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        {
          $unwind: '$userInfo'
        },
        {
          $lookup: {
            from: 'activities',
            let: { userId: '$user' },
            pipeline: [
              { 
                $match: { 
                  $expr: { 
                    $and: [
                      { $eq: ['$user', '$$userId'] },
                      { $eq: ['$category', 'blockchain'] }
                    ]
                  }
                }
              }
            ],
            as: 'blockchainActivities'
          }
        },
        {
          $addFields: {
            hasReceivedReward: { 
              $gt: [
                { 
                  $size: { 
                    $filter: {
                      input: '$blockchainActivities',
                      as: 'activity',
                      cond: {
                        $or: [
                          { $eq: ['$$activity.type', 'token_received'] },
                          { $eq: ['$$activity.type', 'nft_received'] }
                        ]
                      }
                    } 
                  } 
                }, 
                0
              ]
            },
            firstRewardDate: { 
              $min: { 
                $map: { 
                  input: { 
                    $filter: {
                      input: '$blockchainActivities',
                      as: 'activity',
                      cond: {
                        $or: [
                          { $eq: ['$$activity.type', 'token_received'] },
                          { $eq: ['$$activity.type', 'nft_received'] }
                        ]
                      }
                    } 
                  }, 
                  as: 'reward',
                  in: '$$reward.createdAt'
                } 
              } 
            },
            lastBlockchainActivity: { $max: '$blockchainActivities.createdAt' },
          }
        },
        {
          $match: {
            hasReceivedReward: true,
            firstRewardDate: { $ne: null }
          }
        },
        {
          $addFields: {
            isRetained: {
              $cond: [
                { $gt: ['$lastBlockchainActivity', '$firstRewardDate'] },
                true,
                false
              ]
            }
          }
        },
        {
          $group: {
            _id: '$userInfo.authProvider',
            totalWallets: { $sum: 1 },
            retainedWallets: { $sum: { $cond: ['$isRetained', 1, 0] } }
          }
        },
        {
          $project: {
            provider: '$_id',
            totalWallets: 1,
            retainedWallets: 1,
            retentionRate: {
              $multiply: [
                { $divide: ['$retainedWallets', '$totalWallets'] },
                100
              ]
            }
          }
        },
        { $sort: { retentionRate: -1 } }
      ]);
      
      // 시계열 데이터 (월별 유지율 변화)
      const timeseriesData = await this._getTimeseriesRetention(options);
      
      return {
        summary: walletRetention.length > 0 ? walletRetention[0] : {
          totalWallets: 0,
          retainedWallets: 0,
          longTermRetainedWallets: 0,
          retentionRate: 0,
          longTermRetentionRate: 0,
          averageRetentionDays: 0,
          averagePostRewardActivities: 0,
          activeWalletRate: 0
        },
        retentionByProvider,
        timeseriesData,
        period: {
          startDate: startDate || 'All time',
          endDate: endDate || new Date(),
          retentionDays
        }
      };
    } catch (error) {
      logger.error('지갑 유지율 분석 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 시계열 데이터 가져오기 (월별 유지율)
   * @param {Object} options - 분석 옵션
   * @returns {Promise<Array>} 월별 시계열 데이터
   * @private
   */
  async _getTimeseriesRetention(options) {
    const { retentionDays = 30, months = 12 } = options;
    
    const timeseriesData = [];
    const now = new Date();
    
    for (let i = 0; i < months; i++) {
      const endDate = new Date(now);
      endDate.setMonth(now.getMonth() - i);
      
      const startDate = new Date(endDate);
      startDate.setMonth(endDate.getMonth() - 1);
      
      // 해당 월의 지갑 생성 수
      const newWallets = await Wallet.countDocuments({
        createdAt: { $gte: startDate, $lt: endDate }
      });
      
      // 보상을 받은 지갑 수
      const rewardedWallets = await Activity.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lt: endDate },
            category: 'blockchain',
            $or: [
              { type: 'token_received' },
              { type: 'nft_received' }
            ]
          }
        },
        {
          $group: {
            _id: '$user',
            firstReward: { $min: '$createdAt' }
          }
        },
        {
          $count: 'total'
        }
      ]);
      
      // 보상 후 활동이 있는 지갑 수
      const retainedWallets = await Activity.aggregate([
        // 해당 월의 첫 보상 활동을 찾음
        {
          $match: {
            createdAt: { $gte: startDate, $lt: endDate },
            category: 'blockchain',
            $or: [
              { type: 'token_received' },
              { type: 'nft_received' }
            ]
          }
        },
        {
          $group: {
            _id: '$user',
            firstReward: { $min: '$createdAt' }
          }
        },
        // 첫 보상 이후의 활동을 찾음
        {
          $lookup: {
            from: 'activities',
            let: { userId: '$_id', rewardDate: '$firstReward' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$user', '$$userId'] },
                      { $gt: ['$createdAt', '$$rewardDate'] }
                    ]
                  }
                }
              }
            ],
            as: 'postRewardActivities'
          }
        },
        {
          $match: {
            'postRewardActivities.0': { $exists: true }
          }
        },
        {
          $count: 'total'
        }
      ]);
      
      const totalRewardedWallets = rewardedWallets.length > 0 ? rewardedWallets[0].total : 0;
      const totalRetainedWallets = retainedWallets.length > 0 ? retainedWallets[0].total : 0;
      
      const retentionRate = totalRewardedWallets > 0 ?
        (totalRetainedWallets / totalRewardedWallets) * 100 : 0;
      
      timeseriesData.push({
        period: {
          start: startDate,
          end: endDate
        },
        newWallets,
        rewardedWallets: totalRewardedWallets,
        retainedWallets: totalRetainedWallets,
        retentionRate: retentionRate.toFixed(2)
      });
    }
    
    // 날짜순으로 정렬
    return timeseriesData.reverse();
  }

  /**
   * 보상 유형별 유지율 분석
   * @param {Object} options - 분석 옵션
   * @returns {Promise<Object>} 보상 유형별 분석 결과
   */
  async analyzeRetentionByRewardType(options = {}) {
    try {
      const { startDate, endDate, retentionDays = 30 } = options;
      
      // 날짜 범위 설정
      const dateRange = {};
      if (startDate) dateRange.createdAt = { $gte: startDate };
      if (endDate) dateRange.createdAt = { ...dateRange.createdAt, $lte: endDate };

      // 보상 유형별 유지율 (토큰 vs NFT vs 둘 다)
      const retentionByRewardType = await Activity.aggregate([
        {
          $match: {
            ...dateRange,
            category: 'blockchain',
            $or: [
              { type: 'token_received' },
              { type: 'nft_received' }
            ]
          }
        },
        {
          $sort: { createdAt: 1 }
        },
        {
          $group: {
            _id: '$user',
            firstTokenReward: {
              $min: {
                $cond: [
                  { $eq: ['$type', 'token_received'] },
                  '$createdAt',
                  null
                ]
              }
            },
            firstNftReward: {
              $min: {
                $cond: [
                  { $eq: ['$type', 'nft_received'] },
                  '$createdAt',
                  null
                ]
              }
            },
            firstReward: { $min: '$createdAt' },
            rewardTypes: { $addToSet: '$type' }
          }
        },
        {
          $addFields: {
            rewardCategory: {
              $switch: {
                branches: [
                  { 
                    case: { 
                      $and: [
                        { $ne: ['$firstTokenReward', null] },
                        { $ne: ['$firstNftReward', null] }
                      ]
                    }, 
                    then: 'both' 
                  },
                  { 
                    case: { $ne: ['$firstTokenReward', null] }, 
                    then: 'token_only' 
                  },
                  { 
                    case: { $ne: ['$firstNftReward', null] }, 
                    then: 'nft_only' 
                  }
                ],
                default: 'unknown'
              }
            }
          }
        },
        {
          $lookup: {
            from: 'activities',
            let: { userId: '$_id', rewardDate: '$firstReward' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$user', '$$userId'] },
                      { $gt: ['$createdAt', '$$rewardDate'] }
                    ]
                  }
                }
              }
            ],
            as: 'postRewardActivities'
          }
        },
        {
          $addFields: {
            isRetained: { $gt: [{ $size: '$postRewardActivities' }, 0] },
            postRewardActivityCount: { $size: '$postRewardActivities' }
          }
        },
        {
          $group: {
            _id: '$rewardCategory',
            totalUsers: { $sum: 1 },
            retainedUsers: { $sum: { $cond: ['$isRetained', 1, 0] } },
            avgPostRewardActivities: { $avg: '$postRewardActivityCount' }
          }
        },
        {
          $project: {
            rewardType: '$_id',
            totalUsers: 1,
            retainedUsers: 1,
            retentionRate: {
              $multiply: [
                { $divide: ['$retainedUsers', '$totalUsers'] },
                100
              ]
            },
            avgPostRewardActivities: 1
          }
        },
        {
          $sort: { retentionRate: -1 }
        }
      ]);
      
      // 보상 금액별 유지율 (토큰)
      const tokenValueRanges = [
        { min: 0, max: 10, label: '0-10 NEST' },
        { min: 10, max: 50, label: '10-50 NEST' },
        { min: 50, max: 100, label: '50-100 NEST' },
        { min: 100, max: 500, label: '100-500 NEST' },
        { min: 500, max: null, label: '500+ NEST' }
      ];
      
      const retentionByTokenAmount = [];
      
      for (const range of tokenValueRanges) {
        const amountFilter = {};
        if (range.min !== null) amountFilter['metadata.amount'] = { $gte: range.min };
        if (range.max !== null) amountFilter['metadata.amount'] = { ...amountFilter['metadata.amount'], $lt: range.max };
        
        const usersWithTokenReward = await Activity.aggregate([
          {
            $match: {
              ...dateRange,
              category: 'blockchain',
              type: 'token_received',
              ...amountFilter
            }
          },
          {
            $sort: { createdAt: 1 }
          },
          {
            $group: {
              _id: '$user',
              firstReward: { $min: '$createdAt' }
            }
          }
        ]);
        
        const userIds = usersWithTokenReward.map(u => u._id);
        
        const retainedUsersCount = await Activity.aggregate([
          {
            $match: {
              user: { $in: userIds },
              createdAt: { $gt: { $arrayElemAt: ['$firstReward', 0] } }
            }
          },
          {
            $group: {
              _id: '$user'
            }
          },
          {
            $count: 'total'
          }
        ]);
        
        const totalUsers = userIds.length;
        const retainedUsers = retainedUsersCount.length > 0 ? retainedUsersCount[0].total : 0;
        const retentionRate = totalUsers > 0 ? (retainedUsers / totalUsers) * 100 : 0;
        
        retentionByTokenAmount.push({
          range: range.label,
          totalUsers,
          retainedUsers,
          retentionRate: retentionRate.toFixed(2)
        });
      }
      
      // NFT 희귀도별 유지율
      const nftRarityLevels = [
        { level: 'common', label: '일반' },
        { level: 'uncommon', label: '비일반' },
        { level: 'rare', label: '희귀' },
        { level: 'epic', label: '에픽' },
        { level: 'legendary', label: '전설' }
      ];
      
      const retentionByNftRarity = [];
      
      for (const rarity of nftRarityLevels) {
        const usersWithNftReward = await Activity.aggregate([
          {
            $match: {
              ...dateRange,
              category: 'blockchain',
              type: 'nft_received',
              'metadata.rarity': rarity.level
            }
          },
          {
            $sort: { createdAt: 1 }
          },
          {
            $group: {
              _id: '$user',
              firstReward: { $min: '$createdAt' }
            }
          }
        ]);
        
        const userIds = usersWithNftReward.map(u => u._id);
        
        const retainedUsersCount = await Activity.aggregate([
          {
            $match: {
              user: { $in: userIds },
              createdAt: { $gt: { $arrayElemAt: ['$firstReward', 0] } }
            }
          },
          {
            $group: {
              _id: '$user'
            }
          },
          {
            $count: 'total'
          }
        ]);
        
        const totalUsers = userIds.length;
        const retainedUsers = retainedUsersCount.length > 0 ? retainedUsersCount[0].total : 0;
        const retentionRate = totalUsers > 0 ? (retainedUsers / totalUsers) * 100 : 0;
        
        retentionByNftRarity.push({
          rarity: rarity.label,
          totalUsers,
          retainedUsers,
          retentionRate: retentionRate.toFixed(2)
        });
      }
      
      return {
        retentionByRewardType,
        retentionByTokenAmount,
        retentionByNftRarity,
        period: {
          startDate: startDate || 'All time',
          endDate: endDate || new Date(),
          retentionDays
        }
      };
    } catch (error) {
      logger.error('보상 유형별 유지율 분석 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 사용자 활동 패턴과 지갑 유지율 상관관계 분석
   * @param {Object} options - 분석 옵션
   * @returns {Promise<Object>} 활동 패턴 분석 결과
   */
  async analyzeRetentionByActivityPattern(options = {}) {
    try {
      const { startDate, endDate } = options;
      
      // 날짜 범위 설정
      const dateRange = {};
      if (startDate) dateRange.createdAt = { $gte: startDate };
      if (endDate) dateRange.createdAt = { ...dateRange.createdAt, $lte: endDate };
      
      // 미션 참여 횟수별 유지율
      const missionCountRanges = [
        { min: 0, max: 1, label: '0-1 미션' },
        { min: 1, max: 5, label: '1-5 미션' },
        { min: 5, max: 10, label: '5-10 미션' },
        { min: 10, max: null, label: '10+ 미션' }
      ];
      
      const retentionByMissionCount = [];
      
      for (const range of missionCountRanges) {
        // 미션 참여 횟수별 사용자 그룹 찾기
        const usersInRange = await User.aggregate([
          {
            $lookup: {
              from: 'activities',
              localField: '_id',
              foreignField: 'user',
              as: 'activities'
            }
          },
          {
            $addFields: {
              missionCount: {
                $size: {
                  $filter: {
                    input: '$activities',
                    as: 'activity',
                    cond: { $eq: ['$$activity.type', 'mission_participation'] }
                  }
                }
              }
            }
          },
          {
            $match: {
              ...dateRange,
              missionCount: { $gte: range.min, ...(range.max ? { $lt: range.max } : {}) }
            }
          },
          {
            $project: {
              _id: 1
            }
          }
        ]);
        
        const userIds = usersInRange.map(u => u._id);
        
        // 해당 사용자 그룹의 지갑 유지율 계산
        const wallets = await Wallet.aggregate([
          {
            $match: {
              user: { $in: userIds }
            }
          },
          {
            $lookup: {
              from: 'activities',
              let: { userId: '$user' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$user', '$$userId'] },
                        { $eq: ['$category', 'blockchain'] }
                      ]
                    }
                  }
                }
              ],
              as: 'blockchainActivities'
            }
          },
          {
            $addFields: {
              hasReward: { 
                $gt: [
                  { 
                    $size: { 
                      $filter: {
                        input: '$blockchainActivities',
                        as: 'activity',
                        cond: {
                          $or: [
                            { $eq: ['$$activity.type', 'token_received'] },
                            { $eq: ['$$activity.type', 'nft_received'] }
                          ]
                        }
                      } 
                    } 
                  }, 
                  0
                ]
              },
              firstRewardDate: { 
                $min: { 
                  $map: { 
                    input: { 
                      $filter: {
                        input: '$blockchainActivities',
                        as: 'activity',
                        cond: {
                          $or: [
                            { $eq: ['$$activity.type', 'token_received'] },
                            { $eq: ['$$activity.type', 'nft_received'] }
                          ]
                        }
                      } 
                    }, 
                    as: 'reward',
                    in: '$$reward.createdAt'
                  } 
                } 
              },
              lastActivity: { $max: '$blockchainActivities.createdAt' }
            }
          },
          {
            $match: {
              hasReward: true,
              firstRewardDate: { $ne: null }
            }
          },
          {
            $addFields: {
              isRetained: { $gt: ['$lastActivity', '$firstRewardDate'] }
            }
          },
          {
            $group: {
              _id: null,
              totalWallets: { $sum: 1 },
              retainedWallets: { $sum: { $cond: ['$isRetained', 1, 0] } }
            }
          }
        ]);
        
        const totalWallets = wallets.length > 0 ? wallets[0].totalWallets : 0;
        const retainedWallets = wallets.length > 0 ? wallets[0].retainedWallets : 0;
        const retentionRate = totalWallets > 0 ? (retainedWallets / totalWallets) * 100 : 0;
        
        retentionByMissionCount.push({
          missionRange: range.label,
          totalUsers: userIds.length,
          usersWithWallet: totalWallets,
          retainedWallets,
          retentionRate: retentionRate.toFixed(2)
        });
      }
      
      // 소셜 연동 유무별 유지율
      const socialIntegrations = [
        { connected: true, label: '소셜 연동 사용자' },
        { connected: false, label: '소셜 연동 미사용자' }
      ];
      
      const retentionBySocialConnection = [];
      
      for (const integration of socialIntegrations) {
        // 소셜 연동 여부에 따른 사용자 그룹 찾기
        const usersQuery = integration.connected ? 
          { hasSocialIntegration: true } : 
          { hasSocialIntegration: { $ne: true } };
        
        const usersInGroup = await User.find({
          ...dateRange,
          ...usersQuery
        }).select('_id');
        
        const userIds = usersInGroup.map(u => u._id);
        
        // 해당 사용자 그룹의 지갑 유지율 계산
        const wallets = await Wallet.aggregate([
          {
            $match: {
              user: { $in: userIds }
            }
          },
          {
            $lookup: {
              from: 'activities',
              let: { userId: '$user' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$user', '$$userId'] },
                        { $eq: ['$category', 'blockchain'] }
                      ]
                    }
                  }
                }
              ],
              as: 'blockchainActivities'
            }
          },
          {
            $addFields: {
              hasReward: { 
                $gt: [
                  { 
                    $size: { 
                      $filter: {
                        input: '$blockchainActivities',
                        as: 'activity',
                        cond: {
                          $or: [
                            { $eq: ['$$activity.type', 'token_received'] },
                            { $eq: ['$$activity.type', 'nft_received'] }
                          ]
                        }
                      } 
                    } 
                  }, 
                  0
                ]
              },
              firstRewardDate: { 
                $min: { 
                  $map: { 
                    input: { 
                      $filter: {
                        input: '$blockchainActivities',
                        as: 'activity',
                        cond: {
                          $or: [
                            { $eq: ['$$activity.type', 'token_received'] },
                            { $eq: ['$$activity.type', 'nft_received'] }
                          ]
                        }
                      } 
                    }, 
                    as: 'reward',
                    in: '$$reward.createdAt'
                  } 
                } 
              },
              lastActivity: { $max: '$blockchainActivities.createdAt' }
            }
          },
          {
            $match: {
              hasReward: true,
              firstRewardDate: { $ne: null }
            }
          },
          {
            $addFields: {
              isRetained: { $gt: ['$lastActivity', '$firstRewardDate'] }
            }
          },
          {
            $group: {
              _id: null,
              totalWallets: { $sum: 1 },
              retainedWallets: { $sum: { $cond: ['$isRetained', 1, 0] } }
            }
          }
        ]);
        
        const totalWallets = wallets.length > 0 ? wallets[0].totalWallets : 0;
        const retainedWallets = wallets.length > 0 ? wallets[0].retainedWallets : 0;
        const retentionRate = totalWallets > 0 ? (retainedWallets / totalWallets) * 100 : 0;
        
        retentionBySocialConnection.push({
          socialStatus: integration.label,
          totalUsers: userIds.length,
          usersWithWallet: totalWallets,
          retainedWallets,
          retentionRate: retentionRate.toFixed(2)
        });
      }
      
      return {
        retentionByMissionCount,
        retentionBySocialConnection,
        period: {
          startDate: startDate || 'All time',
          endDate: endDate || new Date()
        }
      };
    } catch (error) {
      logger.error('활동 패턴별 유지율 분석 중 오류 발생:', error);
      throw error;
    }
  }
}

module.exports = new WalletRetentionAnalytics();
