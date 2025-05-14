/**
 * NFT 보유 분석 모듈
 * 
 * 사용자별 NFT 보유 현황을 분석하고, 희귀도, 카테고리, 획득 방법 등에 따른
 * 보유 패턴을 추적합니다.
 */

const User = require('../models/user');
const Activity = require('../models/activity');
const Wallet = require('../models/wallet');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

/**
 * NFT 보유 분석 클래스
 */
class NftOwnershipAnalytics {
  /**
   * 지정된 기간 동안의 NFT 보유 지표 계산
   * @param {Object} options - 분석 옵션
   * @param {Date} options.startDate - 시작 날짜
   * @param {Date} options.endDate - 종료 날짜
   * @returns {Promise<Object>} 분석 결과
   */
  async calculateNftMetrics(options = {}) {
    try {
      const { startDate, endDate } = options;
      
      // 날짜 범위 설정
      const dateRange = {};
      if (startDate) dateRange.createdAt = { $gte: startDate };
      if (endDate) dateRange.createdAt = { ...dateRange.createdAt, $lte: endDate };
      
      // 전체 NFT 통계
      const nftStats = await Activity.aggregate([
        {
          $match: {
            ...dateRange,
            category: 'blockchain',
            type: { $in: ['nft_received', 'nft_created'] }
          }
        },
        {
          $group: {
            _id: null,
            totalNfts: { $sum: 1 },
            uniqueUsers: { $addToSet: '$user' }
          }
        },
        {
          $project: {
            _id: 0,
            totalNfts: 1,
            uniqueUsers: { $size: '$uniqueUsers' }
          }
        }
      ]);
      
      // 전체 사용자 수 (지갑 보유자)
      const totalUsers = await Wallet.countDocuments();
      
      // 사용자별 NFT 보유 통계
      const nftOwnershipByUser = await Activity.aggregate([
        {
          $match: {
            ...dateRange,
            category: 'blockchain',
            type: { $in: ['nft_received', 'nft_created'] }
          }
        },
        {
          $group: {
            _id: '$user',
            nftCount: { $sum: 1 },
            firstNft: { $min: '$createdAt' },
            latestNft: { $max: '$createdAt' },
            nftTypes: { $addToSet: '$metadata.nftType' },
            rarities: { $addToSet: '$metadata.rarity' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        {
          $unwind: {
            path: '$userInfo',
            preserveNullAndEmptyArrays: true
          }
        }
      ]);
      
      // NFT 분포 계산
      const nftDistribution = this._calculateNftDistribution(nftOwnershipByUser);
      
      // 희귀도별 NFT 통계
      const nftByRarity = await Activity.aggregate([
        {
          $match: {
            ...dateRange,
            category: 'blockchain',
            type: { $in: ['nft_received', 'nft_created'] },
            'metadata.rarity': { $exists: true }
          }
        },
        {
          $group: {
            _id: '$metadata.rarity',
            count: { $sum: 1 },
            uniqueOwners: { $addToSet: '$user' }
          }
        },
        {
          $project: {
            rarity: '$_id',
            _id: 0,
            count: 1,
            uniqueOwners: { $size: '$uniqueOwners' },
            avgPerOwner: { $divide: ['$count', { $size: '$uniqueOwners' }] }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);
      
      // NFT 유형별 통계
      const nftByType = await Activity.aggregate([
        {
          $match: {
            ...dateRange,
            category: 'blockchain',
            type: { $in: ['nft_received', 'nft_created'] },
            'metadata.nftType': { $exists: true }
          }
        },
        {
          $group: {
            _id: '$metadata.nftType',
            count: { $sum: 1 },
            uniqueOwners: { $addToSet: '$user' }
          }
        },
        {
          $project: {
            nftType: '$_id',
            _id: 0,
            count: 1,
            uniqueOwners: { $size: '$uniqueOwners' },
            avgPerOwner: { $divide: ['$count', { $size: '$uniqueOwners' }] }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);
      
      // 획득 방법별 통계
      const nftByAcquisitionMethod = await Activity.aggregate([
        {
          $match: {
            ...dateRange,
            category: 'blockchain',
            type: { $in: ['nft_received', 'nft_created'] }
          }
        },
        {
          $addFields: {
            acquisitionMethod: {
              $cond: [
                { $eq: ['$type', 'nft_created'] },
                'created',
                {
                  $cond: [
                    { $eq: ['$metadata.source', 'mission_reward'] },
                    'mission_reward',
                    {
                      $cond: [
                        { $eq: ['$metadata.source', 'purchase'] },
                        'purchase',
                        {
                          $cond: [
                            { $eq: ['$metadata.source', 'airdrop'] },
                            'airdrop',
                            'other'
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          }
        },
        {
          $group: {
            _id: '$acquisitionMethod',
            count: { $sum: 1 },
            uniqueOwners: { $addToSet: '$user' }
          }
        },
        {
          $project: {
            acquisitionMethod: '$_id',
            _id: 0,
            count: 1,
            uniqueOwners: { $size: '$uniqueOwners' },
            avgPerOwner: { $divide: ['$count', { $size: '$uniqueOwners' }] }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);
      
      // 시계열 데이터 (월별 NFT 발행 및 보유)
      const timeseriesData = await this._getTimeseriesData(options);
      
      // 평균 NFT 보유 계산
      const totalNfts = nftStats.length > 0 ? nftStats[0].totalNfts : 0;
      const uniqueNftOwners = nftStats.length > 0 ? nftStats[0].uniqueUsers : 0;
      
      const avgNftPerOwner = uniqueNftOwners > 0 ? totalNfts / uniqueNftOwners : 0;
      const avgNftPerUser = totalUsers > 0 ? totalNfts / totalUsers : 0;
      
      // 종합 요약
      return {
        summary: {
          totalNfts,
          uniqueNftOwners,
          totalUsers,
          avgNftPerOwner,
          avgNftPerUser,
          ownershipRate: totalUsers > 0 ? (uniqueNftOwners / totalUsers) * 100 : 0
        },
        distribution: nftDistribution,
        nftByRarity,
        nftByType,
        nftByAcquisitionMethod,
        timeseriesData,
        period: {
          startDate: startDate || 'All time',
          endDate: endDate || new Date()
        }
      };
    } catch (error) {
      logger.error('NFT 보유 분석 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * NFT 분포 계산
   * @param {Array} nftOwnershipByUser - 사용자별 NFT 보유 데이터
   * @returns {Object} NFT 분포 통계
   * @private
   */
  _calculateNftDistribution(nftOwnershipByUser) {
    // NFT 개수별 사용자 분포
    const countRanges = [
      { min: 1, max: 1, label: '1개' },
      { min: 2, max: 5, label: '2-5개' },
      { min: 6, max: 10, label: '6-10개' },
      { min: 11, max: 20, label: '11-20개' },
      { min: 21, max: 50, label: '21-50개' },
      { min: 51, max: null, label: '51개 이상' }
    ];
    
    const distribution = countRanges.map(range => {
      const usersInRange = nftOwnershipByUser.filter(user => 
        user.nftCount >= range.min && 
        (range.max === null || user.nftCount <= range.max)
      );
      
      return {
        range: range.label,
        userCount: usersInRange.length,
        percentage: nftOwnershipByUser.length > 0 ? 
          (usersInRange.length / nftOwnershipByUser.length) * 100 : 0,
        totalNfts: usersInRange.reduce((sum, user) => sum + user.nftCount, 0)
      };
    });
    
    // 희귀도 조합별 분포
    const rarityGroups = {};
    
    nftOwnershipByUser.forEach(user => {
      const rarities = user.rarities || [];
      
      // 사용자의 보유 희귀도 조합을 문자열로 변환
      const rarityKey = [...rarities].sort().join(',');
      
      if (!rarityGroups[rarityKey]) {
        rarityGroups[rarityKey] = {
          rarities: rarities,
          userCount: 0,
          totalNfts: 0
        };
      }
      
      rarityGroups[rarityKey].userCount++;
      rarityGroups[rarityKey].totalNfts += user.nftCount;
    });
    
    return {
      byCount: distribution,
      byRarityMix: Object.values(rarityGroups)
        .sort((a, b) => b.userCount - a.userCount)
        .slice(0, 10) // 상위 10개만 반환
    };
  }
  
  /**
   * 시계열 데이터 가져오기 (월별 NFT 발행 및 보유)
   * @param {Object} options - 분석 옵션
   * @returns {Promise<Array>} 월별 시계열 데이터
   * @private
   */
  async _getTimeseriesData(options = {}) {
    const { startDate, endDate, groupBy = 'month' } = options;
    
    // 날짜 범위 설정
    const dateRange = {};
    if (startDate) dateRange.createdAt = { $gte: startDate };
    if (endDate) dateRange.createdAt = { ...dateRange.createdAt, $lte: endDate };
    
    // 날짜 형식 설정
    let dateFormat;
    switch (groupBy) {
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        dateFormat = '%Y-%U';
        break;
      default:
        dateFormat = '%Y-%m';
    }
    
    // 월별 NFT 발행량
    const monthlyNftIssuance = await Activity.aggregate([
      {
        $match: {
          ...dateRange,
          category: 'blockchain',
          type: { $in: ['nft_received', 'nft_created'] }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: dateFormat, date: '$createdAt' } },
            type: '$type'
          },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$user' }
        }
      },
      {
        $project: {
          date: '$_id.date',
          type: '$_id.type',
          _id: 0,
          count: 1,
          uniqueUsers: { $size: '$uniqueUsers' }
        }
      },
      {
        $sort: { date: 1 }
      }
    ]);
    
    // 날짜와 발행 유형별로 데이터 그룹화
    const dateMap = new Map();
    
    // 모든 고유 날짜 가져오기
    const allDates = new Set(monthlyNftIssuance.map(item => item.date));
    
    // 각 날짜별 데이터 초기화
    for (const date of allDates) {
      dateMap.set(date, {
        date,
        totalNfts: 0,
        createdNfts: 0,
        receivedNfts: 0,
        uniqueUsers: new Set()
      });
    }
    
    // 데이터 채우기
    monthlyNftIssuance.forEach(item => {
      if (dateMap.has(item.date)) {
        const data = dateMap.get(item.date);
        data.totalNfts += item.count;
        
        if (item.type === 'nft_created') {
          data.createdNfts = item.count;
        } else if (item.type === 'nft_received') {
          data.receivedNfts = item.count;
        }
        
        // 고유 사용자 추가 (Set이므로 중복 불가)
        item.uniqueUsers.forEach(user => data.uniqueUsers.add(user));
      }
    });
    
    // 고유 사용자 수로 변환
    const result = [];
    for (const [date, data] of dateMap.entries()) {
      result.push({
        ...data,
        uniqueUsers: data.uniqueUsers.size
      });
    }
    
    // 날짜순으로 정렬
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }
  
  /**
   * 사용자 세그먼트별 NFT 보유 패턴 분석
   * @param {Object} options - 분석 옵션
   * @returns {Promise<Object>} 세그먼트별 분석 결과
   */
  async analyzeNftByUserSegment(options = {}) {
    try {
      const { startDate, endDate } = options;
      
      // 날짜 범위 설정
      const dateRange = {};
      if (startDate) dateRange.createdAt = { $gte: startDate };
      if (endDate) dateRange.createdAt = { ...dateRange.createdAt, $lte: endDate };
      
      // 가입 기간별 세그먼트 정의
      const joinDateSegments = [
        { 
          name: '신규 사용자', 
          filter: { 
            createdAt: { 
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
            } 
          } 
        },
        { 
          name: '일반 사용자', 
          filter: { 
            createdAt: { 
              $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
            } 
          } 
        },
        { 
          name: '장기 사용자', 
          filter: { 
            createdAt: { 
              $lt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) 
            } 
          } 
        }
      ];
      
      // 세그먼트별 NFT 패턴 분석
      const nftByJoinDate = [];
      
      for (const segment of joinDateSegments) {
        // 해당 세그먼트 사용자 찾기
        const usersInSegment = await User.find({
          ...segment.filter
        }).select('_id');
        
        const userIds = usersInSegment.map(u => u._id);
        
        // 사용자 수가 없으면 스킵
        if (userIds.length === 0) {
          nftByJoinDate.push({
            segment: segment.name,
            userCount: 0,
            nftOwners: 0,
            totalNfts: 0,
            avgNftPerUser: 0,
            avgNftPerOwner: 0,
            ownershipRate: 0
          });
          continue;
        }
        
        // 해당 세그먼트의 NFT 활동 통계
        const nftStats = await Activity.aggregate([
          {
            $match: {
              ...dateRange,
              user: { $in: userIds },
              category: 'blockchain',
              type: { $in: ['nft_received', 'nft_created'] }
            }
          },
          {
            $group: {
              _id: null,
              totalNfts: { $sum: 1 },
              uniqueOwners: { $addToSet: '$user' }
            }
          }
        ]);
        
        const stats = nftStats.length > 0 ? nftStats[0] : {
          totalNfts: 0,
          uniqueOwners: []
        };
        
        const uniqueOwnersCount = stats.uniqueOwners ? stats.uniqueOwners.length : 0;
        
        nftByJoinDate.push({
          segment: segment.name,
          userCount: userIds.length,
          nftOwners: uniqueOwnersCount,
          totalNfts: stats.totalNfts,
          avgNftPerUser: userIds.length > 0 ? stats.totalNfts / userIds.length : 0,
          avgNftPerOwner: uniqueOwnersCount > 0 ? stats.totalNfts / uniqueOwnersCount : 0,
          ownershipRate: userIds.length > 0 ? (uniqueOwnersCount / userIds.length) * 100 : 0
        });
      }
      
      // 활동 수준별 세그먼트 정의 (월간 활동 기준)
      const activityLevelSegments = [
        { name: '비활동 사용자', minActivity: 0, maxActivity: 0 },
        { name: '저활동 사용자', minActivity: 1, maxActivity: 5 },
        { name: '일반 활동 사용자', minActivity: 6, maxActivity: 20 },
        { name: '고활동 사용자', minActivity: 21, maxActivity: null }
      ];
      
      // 최근 30일간 활동 수 계산
      const lastMonth = new Date();
      lastMonth.setDate(lastMonth.getDate() - 30);
      
      const userActivities = await Activity.aggregate([
        {
          $match: {
            createdAt: { $gte: lastMonth }
          }
        },
        {
          $group: {
            _id: '$user',
            activityCount: { $sum: 1 }
          }
        }
      ]);
      
      // 사용자 ID별 활동 수 맵 생성
      const userActivityMap = new Map();
      userActivities.forEach(ua => {
        userActivityMap.set(ua._id.toString(), ua.activityCount);
      });
      
      // 세그먼트별 NFT 패턴 분석
      const nftByActivityLevel = [];
      
      // 모든 사용자 가져오기
      const allUsers = await User.find().select('_id');
      const allUserIds = allUsers.map(u => u._id.toString());
      
      for (const segment of activityLevelSegments) {
        // 활동 수준에 맞는 사용자 필터링
        const userIds = allUserIds.filter(uid => {
          const activityCount = userActivityMap.get(uid) || 0;
          return (
            activityCount >= segment.minActivity &&
            (segment.maxActivity === null || activityCount <= segment.maxActivity)
          );
        }).map(uid => mongoose.Types.ObjectId(uid));
        
        // 사용자 수가 없으면 스킵
        if (userIds.length === 0) {
          nftByActivityLevel.push({
            segment: segment.name,
            userCount: 0,
            nftOwners: 0,
            totalNfts: 0,
            avgNftPerUser: 0,
            avgNftPerOwner: 0,
            ownershipRate: 0
          });
          continue;
        }
        
        // 해당 세그먼트의 NFT 활동 통계
        const nftStats = await Activity.aggregate([
          {
            $match: {
              ...dateRange,
              user: { $in: userIds },
              category: 'blockchain',
              type: { $in: ['nft_received', 'nft_created'] }
            }
          },
          {
            $group: {
              _id: null,
              totalNfts: { $sum: 1 },
              uniqueOwners: { $addToSet: '$user' }
            }
          }
        ]);
        
        const stats = nftStats.length > 0 ? nftStats[0] : {
          totalNfts: 0,
          uniqueOwners: []
        };
        
        const uniqueOwnersCount = stats.uniqueOwners ? stats.uniqueOwners.length : 0;
        
        nftByActivityLevel.push({
          segment: segment.name,
          userCount: userIds.length,
          nftOwners: uniqueOwnersCount,
          totalNfts: stats.totalNfts,
          avgNftPerUser: userIds.length > 0 ? stats.totalNfts / userIds.length : 0,
          avgNftPerOwner: uniqueOwnersCount > 0 ? stats.totalNfts / uniqueOwnersCount : 0,
          ownershipRate: userIds.length > 0 ? (uniqueOwnersCount / userIds.length) * 100 : 0
        });
      }
      
      // 소셜 인증 경로별 분석
      const nftByAuthProvider = await Activity.aggregate([
        {
          $match: {
            ...dateRange,
            category: 'blockchain',
            type: { $in: ['nft_received', 'nft_created'] }
          }
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
          $group: {
            _id: '$userInfo.authProvider',
            totalNfts: { $sum: 1 },
            uniqueOwners: { $addToSet: '$user' }
          }
        },
        {
          $lookup: {
            from: 'users',
            let: { provider: '$_id' },
            pipeline: [
              { 
                $match: { 
                  $expr: { $eq: ['$authProvider', '$$provider'] }
                } 
              },
              { $count: 'total' }
            ],
            as: 'totalProviderUsers'
          }
        },
        {
          $project: {
            authProvider: '$_id',
            _id: 0,
            totalNfts: 1,
            nftOwners: { $size: '$uniqueOwners' },
            totalUsers: { $arrayElemAt: ['$totalProviderUsers.total', 0] }
          }
        },
        {
          $addFields: {
            avgNftPerUser: { 
              $cond: [
                { $gt: ['$totalUsers', 0] },
                { $divide: ['$totalNfts', '$totalUsers'] },
                0
              ]
            },
            avgNftPerOwner: { 
              $cond: [
                { $gt: ['$nftOwners', 0] },
                { $divide: ['$totalNfts', '$nftOwners'] },
                0
              ]
            },
            ownershipRate: { 
              $cond: [
                { $gt: ['$totalUsers', 0] },
                { $multiply: [{ $divide: ['$nftOwners', '$totalUsers'] }, 100] },
                0
              ]
            }
          }
        },
        {
          $sort: { avgNftPerUser: -1 }
        }
      ]);
      
      return {
        byJoinDate: nftByJoinDate,
        byActivityLevel: nftByActivityLevel,
        byAuthProvider: nftByAuthProvider,
        period: {
          startDate: startDate || 'All time',
          endDate: endDate || new Date()
        }
      };
    } catch (error) {
      logger.error('사용자 세그먼트별 NFT 분석 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * NFT 보유 패턴과 사용자 행동 상관관계 분석
   * @param {Object} options - 분석 옵션
   * @returns {Promise<Object>} 상관관계 분석 결과
   */
  async analyzeNftEngagementCorrelation(options = {}) {
    try {
      const { startDate, endDate } = options;
      
      // 날짜 범위 설정
      const dateRange = {};
      if (startDate) dateRange.createdAt = { $gte: startDate };
      if (endDate) dateRange.createdAt = { ...dateRange.createdAt, $lte: endDate };
      
      // 모든 사용자별 NFT 보유 통계
      const userNftOwnership = await Activity.aggregate([
        {
          $match: {
            ...dateRange,
            category: 'blockchain',
            type: { $in: ['nft_received', 'nft_created'] }
          }
        },
        {
          $group: {
            _id: '$user',
            nftCount: { $sum: 1 },
            firstNft: { $min: '$createdAt' },
            rarities: { $addToSet: '$metadata.rarity' }
          }
        }
      ]);
      
      // 사용자 ID별 NFT 보유 맵 생성
      const userNftMap = new Map();
      userNftOwnership.forEach(u => {
        userNftMap.set(u._id.toString(), {
          nftCount: u.nftCount,
          firstNft: u.firstNft,
          hasRare: (u.rarities || []).some(r => r === 'rare' || r === 'epic' || r === 'legendary')
        });
      });
      
      // 활동 통계 (NFT 획득 이후 30일간)
      const userActivities = [];
      
      for (const userNft of userNftOwnership) {
        const userId = userNft._id;
        const firstNftDate = userNft.firstNft;
        
        // 첫 번째 NFT 획득 이후 30일 날짜 계산
        const afterDate = new Date(firstNftDate);
        afterDate.setDate(afterDate.getDate() + 30);
        
        // NFT 획득 이후 활동
        const postNftActivities = await Activity.aggregate([
          {
            $match: {
              user: userId,
              createdAt: { $gt: firstNftDate, $lte: afterDate }
            }
          },
          {
            $group: {
              _id: '$category',
              count: { $sum: 1 }
            }
          }
        ]);
        
        // 활동 유형별 카운트 맵
        const activityMap = {};
        postNftActivities.forEach(activity => {
          activityMap[activity._id] = activity.count;
        });
        
        // 미션 참여 횟수
        const missionActivities = await Activity.aggregate([
          {
            $match: {
              user: userId,
              createdAt: { $gt: firstNftDate, $lte: afterDate },
              type: 'mission_participation'
            }
          },
          {
            $count: 'total'
          }
        ]);
        
        const missionCount = missionActivities.length > 0 ? missionActivities[0].total : 0;
        
        // 소셜 공유 횟수
        const socialShareActivities = await Activity.aggregate([
          {
            $match: {
              user: userId,
              createdAt: { $gt: firstNftDate, $lte: afterDate },
              type: 'social_share'
            }
          },
          {
            $count: 'total'
          }
        ]);
        
        const socialShareCount = socialShareActivities.length > 0 ? socialShareActivities[0].total : 0;
        
        // 결과 추가
        userActivities.push({
          userId: userId.toString(),
          nftCount: userNft.nftCount,
          platformActivities: activityMap['platform'] || 0,
          blockchainActivities: activityMap['blockchain'] || 0,
          socialActivities: activityMap['social'] || 0,
          missionCount,
          socialShareCount,
          hasRareNft: (userNft.rarities || []).some(r => r === 'rare' || r === 'epic' || r === 'legendary')
        });
      }
      
      // 상관관계 분석 - NFT 보유 수량과 활동 간
      const nftCountCorrelation = this._calculateCorrelation(userActivities.map(u => u.nftCount), userActivities.map(u => u.platformActivities + u.blockchainActivities + u.socialActivities));
      
      // NFT 보유량 기반 세그먼트 정의
      const nftCountSegments = [
        { name: '0 NFT', min: 0, max: 0 },
        { name: '1 NFT', min: 1, max: 1 },
        { name: '2-5 NFT', min: 2, max: 5 },
        { name: '6-10 NFT', min: 6, max: 10 },
        { name: '10+ NFT', min: 11, max: null }
      ];
      
      // 세그먼트별 참여도 계산
      const engagementByNftCount = [];
      
      // 모든 사용자 가져오기
      const allUsers = await User.find().select('_id');
      
      for (const segment of nftCountSegments) {
        const userIdsInSegment = allUsers
          .map(u => u._id.toString())
          .filter(uid => {
            const nftInfo = userNftMap.get(uid);
            const nftCount = nftInfo ? nftInfo.nftCount : 0;
            return (
              nftCount >= segment.min &&
              (segment.max === null || nftCount <= segment.max)
            );
          });
        
        // 활동 통계
        const activityStats = await Activity.aggregate([
          {
            $match: {
              user: { $in: userIdsInSegment.map(id => mongoose.Types.ObjectId(id)) },
              ...dateRange
            }
          },
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 },
              uniqueUsers: { $addToSet: '$user' }
            }
          },
          {
            $project: {
              activityType: '$_id',
              _id: 0,
              count: 1,
              uniqueUsers: { $size: '$uniqueUsers' }
            }
          }
        ]);
        
        // 통계 집계
        const totalActivities = activityStats.reduce((sum, a) => sum + a.count, 0);
        const activeUsers = new Set();
        activityStats.forEach(a => a.uniqueUsers.forEach(u => activeUsers.add(u.toString())));
        
        engagementByNftCount.push({
          segment: segment.name,
          userCount: userIdsInSegment.length,
          activeUserCount: activeUsers.size,
          activeRate: userIdsInSegment.length > 0 ? 
            (activeUsers.size / userIdsInSegment.length) * 100 : 0,
          totalActivities,
          activitiesPerUser: userIdsInSegment.length > 0 ? 
            totalActivities / userIdsInSegment.length : 0,
          topActivities: activityStats
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
        });
      }
      
      // 희귀 NFT 보유 여부에 따른 참여도 차이
      const usersWithRareNft = userNftOwnership
        .filter(u => (u.rarities || []).some(r => r === 'rare' || r === 'epic' || r === 'legendary'))
        .map(u => u._id);
      
      const usersWithoutRareNft = userNftOwnership
        .filter(u => !(u.rarities || []).some(r => r === 'rare' || r === 'epic' || r === 'legendary'))
        .map(u => u._id);
      
      // 희귀 NFT 보유 사용자 활동 통계
      const rareNftUserActivities = await Activity.aggregate([
        {
          $match: {
            user: { $in: usersWithRareNft },
            ...dateRange
          }
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: '$user' }
          }
        }
      ]);
      
      // 일반 NFT만 보유 사용자 활동 통계
      const normalNftUserActivities = await Activity.aggregate([
        {
          $match: {
            user: { $in: usersWithoutRareNft },
            ...dateRange
          }
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: '$user' }
          }
        }
      ]);
      
      // 활동 카테고리별 통계 변환
      const rareNftActivitiesMap = {};
      rareNftUserActivities.forEach(a => {
        rareNftActivitiesMap[a._id] = {
          count: a.count,
          uniqueUsers: a.uniqueUsers.length
        };
      });
      
      const normalNftActivitiesMap = {};
      normalNftUserActivities.forEach(a => {
        normalNftActivitiesMap[a._id] = {
          count: a.count,
          uniqueUsers: a.uniqueUsers.length
        };
      });
      
      return {
        overview: {
          nftCountCorrelation,
          userCount: userNftOwnership.length,
          avgEngagementScore: userActivities.reduce((sum, u) => 
            sum + (u.platformActivities + u.blockchainActivities + u.socialActivities), 0) / userActivities.length
        },
        engagementByNftCount,
        engagementByRarity: {
          withRareNft: {
            userCount: usersWithRareNft.length,
            activities: rareNftActivitiesMap,
            avgActivitiesPerUser: (
              rareNftActivitiesMap.platform?.count || 0 + 
              rareNftActivitiesMap.blockchain?.count || 0 + 
              rareNftActivitiesMap.social?.count || 0
            ) / (usersWithRareNft.length || 1)
          },
          withoutRareNft: {
            userCount: usersWithoutRareNft.length,
            activities: normalNftActivitiesMap,
            avgActivitiesPerUser: (
              normalNftActivitiesMap.platform?.count || 0 + 
              normalNftActivitiesMap.blockchain?.count || 0 + 
              normalNftActivitiesMap.social?.count || 0
            ) / (usersWithoutRareNft.length || 1)
          }
        },
        period: {
          startDate: startDate || 'All time',
          endDate: endDate || new Date()
        }
      };
    } catch (error) {
      logger.error('NFT 보유와 활동 상관관계 분석 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * 피어슨 상관계수 계산
   * @param {Array<number>} x - X 값 배열
   * @param {Array<number>} y - Y 값 배열
   * @returns {number} 상관계수
   * @private
   */
  _calculateCorrelation(x, y) {
    const n = x.length;
    if (n === 0 || n !== y.length) return 0;
    
    // 평균 계산
    const meanX = x.reduce((sum, val) => sum + val, 0) / n;
    const meanY = y.reduce((sum, val) => sum + val, 0) / n;
    
    // 공분산 및 표준편차 계산
    let covariance = 0;
    let varX = 0;
    let varY = 0;
    
    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      covariance += dx * dy;
      varX += dx * dx;
      varY += dy * dy;
    }
    
    // 상관계수 계산
    if (varX === 0 || varY === 0) return 0;
    return covariance / Math.sqrt(varX * varY);
  }
}

module.exports = new NftOwnershipAnalytics();
