/**
 * XP 누적량 분석 모듈
 * 
 * 커뮤니티 활동 기반 XP 누적량을 분석하여 사용자 참여도, 레벨 진행 속도,
 * 활동 유형별 XP 기여도 등을 추적합니다.
 */

const User = require('../models/user');
const Activity = require('../models/activity');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

/**
 * XP 누적량 분석 클래스
 */
class XpAccumulationAnalytics {
  /**
   * 지정된 기간 동안의 XP 누적 지표 계산
   * @param {Object} options - 분석 옵션
   * @param {Date} options.startDate - 시작 날짜
   * @param {Date} options.endDate - 종료 날짜
   * @returns {Promise<Object>} 분석 결과
   */
  async calculateXpMetrics(options = {}) {
    try {
      const { startDate, endDate } = options;
      
      // 날짜 범위 설정
      const dateRange = {};
      if (startDate) dateRange.createdAt = { $gte: startDate };
      if (endDate) dateRange.createdAt = { ...dateRange.createdAt, $lte: endDate };
      
      // 전체 XP 통계
      const xpStats = await Activity.aggregate([
        {
          $match: {
            ...dateRange,
            'metadata.xp': { $exists: true, $gt: 0 }
          }
        },
        {
          $group: {
            _id: null,
            totalXp: { $sum: '$metadata.xp' },
            totalActivities: { $sum: 1 },
            uniqueUsers: { $addToSet: '$user' },
            avgXpPerActivity: { $avg: '$metadata.xp' },
            maxXp: { $max: '$metadata.xp' },
            minXp: { $min: '$metadata.xp' }
          }
        },
        {
          $project: {
            _id: 0,
            totalXp: 1,
            totalActivities: 1,
            uniqueUsers: { $size: '$uniqueUsers' },
            avgXpPerActivity: 1,
            maxXp: 1,
            minXp: 1
          }
        }
      ]);
      
      // 활동 유형별 XP 통계
      const xpByActivityType = await Activity.aggregate([
        {
          $match: {
            ...dateRange,
            'metadata.xp': { $exists: true, $gt: 0 }
          }
        },
        {
          $group: {
            _id: '$type',
            totalXp: { $sum: '$metadata.xp' },
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: '$user' },
            avgXp: { $avg: '$metadata.xp' }
          }
        },
        {
          $project: {
            type: '$_id',
            _id: 0,
            totalXp: 1,
            count: 1,
            uniqueUsers: { $size: '$uniqueUsers' },
            avgXp: 1
          }
        },
        {
          $sort: { totalXp: -1 }
        }
      ]);
      
      // 사용자별 XP 통계
      const xpByUser = await Activity.aggregate([
        {
          $match: {
            ...dateRange,
            'metadata.xp': { $exists: true, $gt: 0 }
          }
        },
        {
          $group: {
            _id: '$user',
            totalXp: { $sum: '$metadata.xp' },
            activityCount: { $sum: 1 },
            firstActivity: { $min: '$createdAt' },
            lastActivity: { $max: '$createdAt' },
            avgXpPerActivity: { $avg: '$metadata.xp' }
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
        },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            username: '$userInfo.username',
            level: '$userInfo.level',
            totalXp: 1,
            activityCount: 1,
            firstActivity: 1,
            lastActivity: 1,
            avgXpPerActivity: 1,
            daysActive: {
              $divide: [
                { $subtract: ['$lastActivity', '$firstActivity'] },
                24 * 60 * 60 * 1000 // 밀리초를 일 단위로 변환
              ]
            }
          }
        },
        {
          $addFields: {
            xpPerDay: {
              $cond: [
                { $gt: ['$daysActive', 0] },
                { $divide: ['$totalXp', '$daysActive'] },
                '$totalXp' // 하루 이내에 모든 활동이 있는 경우
              ]
            }
          }
        },
        {
          $sort: { totalXp: -1 }
        },
        {
          $limit: 1000 // 상위 1000명만 반환
        }
      ]);
      
      // 레벨별 XP 분포
      const xpByLevel = await User.aggregate([
        {
          $match: {
            level: { $exists: true, $gt: 0 }
          }
        },
        {
          $group: {
            _id: '$level',
            userCount: { $sum: 1 },
            totalXp: { $sum: '$xp' },
            avgXp: { $avg: '$xp' }
          }
        },
        {
          $project: {
            level: '$_id',
            _id: 0,
            userCount: 1,
            totalXp: 1,
            avgXp: 1
          }
        },
        {
          $sort: { level: 1 }
        }
      ]);
      
      // 시계열 XP 누적 데이터
      const timeseriesData = await this._getTimeseriesData(options);
      
      return {
        summary: xpStats.length > 0 ? xpStats[0] : {
          totalXp: 0,
          totalActivities: 0,
          uniqueUsers: 0,
          avgXpPerActivity: 0,
          maxXp: 0,
          minXp: 0
        },
        xpByActivityType,
        topUsers: xpByUser.slice(0, 100), // 상위 100명만 요약에 포함
        xpByLevel,
        timeseriesData,
        period: {
          startDate: startDate || 'All time',
          endDate: endDate || new Date()
        }
      };
    } catch (error) {
      logger.error('XP 누적량 분석 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 시계열 데이터 가져오기 (일별 XP 누적)
   * @param {Object} options - 분석 옵션
   * @returns {Promise<Array>} 일별 시계열 데이터
   * @private
   */
  async _getTimeseriesData(options = {}) {
    const { startDate, endDate, groupBy = 'day' } = options;
    
    // 날짜 범위 설정
    const dateRange = {};
    if (startDate) dateRange.createdAt = { $gte: startDate };
    if (endDate) dateRange.createdAt = { ...dateRange.createdAt, $lte: endDate };
    
    // 날짜 형식 설정
    let dateFormat;
    switch (groupBy) {
      case 'week':
        dateFormat = '%Y-%U'; // 연도-주차
        break;
      case 'month':
        dateFormat = '%Y-%m'; // 연도-월
        break;
      default:
        dateFormat = '%Y-%m-%d'; // 연도-월-일
    }
    
    // 일별 XP 획득량
    const dailyXp = await Activity.aggregate([
      {
        $match: {
          ...dateRange,
          'metadata.xp': { $exists: true, $gt: 0 }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: dateFormat, date: '$createdAt' } }
          },
          xp: { $sum: '$metadata.xp' },
          activities: { $sum: 1 },
          uniqueUsers: { $addToSet: '$user' }
        }
      },
      {
        $project: {
          date: '$_id.date',
          _id: 0,
          xp: 1,
          activities: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          xpPerActivity: { $divide: ['$xp', '$activities'] },
          xpPerUser: {
            $cond: [
              { $gt: [{ $size: '$uniqueUsers' }, 0] },
              { $divide: ['$xp', { $size: '$uniqueUsers' }] },
              0
            ]
          }
        }
      },
      {
        $sort: { date: 1 }
      }
    ]);
    
    // 누적 XP 계산
    let cumulativeXp = 0;
    const timeseriesWithCumulative = dailyXp.map(day => {
      cumulativeXp += day.xp;
      return {
        ...day,
        cumulativeXp
      };
    });
    
    return timeseriesWithCumulative;
  }

  /**
   * 사용자 세그먼트별 XP 누적 패턴 분석
   * @param {Object} options - 분석 옵션
   * @returns {Promise<Object>} 세그먼트별 분석 결과
   */
  async analyzeXpByUserSegment(options = {}) {
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
      
      // 세그먼트별 XP 패턴 분석
      const xpByJoinDate = [];
      
      for (const segment of joinDateSegments) {
        // 해당 세그먼트 사용자 찾기
        const usersInSegment = await User.find({
          ...segment.filter
        }).select('_id');
        
        const userIds = usersInSegment.map(u => u._id);
        
        // 사용자 수가 없으면 스킵
        if (userIds.length === 0) {
          xpByJoinDate.push({
            segment: segment.name,
            userCount: 0,
            totalXp: 0,
            avgXpPerUser: 0,
            avgActivitiesPerUser: 0,
            avgXpPerActivity: 0
          });
          continue;
        }
        
        // 해당 세그먼트의 XP 활동 통계
        const xpStats = await Activity.aggregate([
          {
            $match: {
              ...dateRange,
              user: { $in: userIds },
              'metadata.xp': { $exists: true, $gt: 0 }
            }
          },
          {
            $group: {
              _id: null,
              totalXp: { $sum: '$metadata.xp' },
              totalActivities: { $sum: 1 },
              uniqueUsers: { $addToSet: '$user' }
            }
          }
        ]);
        
        const stats = xpStats.length > 0 ? xpStats[0] : {
          totalXp: 0,
          totalActivities: 0,
          uniqueUsers: []
        };
        
        const uniqueUsersCount = stats.uniqueUsers ? stats.uniqueUsers.length : 0;
        
        xpByJoinDate.push({
          segment: segment.name,
          userCount: userIds.length,
          activeUserCount: uniqueUsersCount,
          activeRate: userIds.length > 0 ? (uniqueUsersCount / userIds.length) * 100 : 0,
          totalXp: stats.totalXp,
          avgXpPerUser: uniqueUsersCount > 0 ? stats.totalXp / uniqueUsersCount : 0,
          avgActivitiesPerUser: uniqueUsersCount > 0 ? stats.totalActivities / uniqueUsersCount : 0,
          avgXpPerActivity: stats.totalActivities > 0 ? stats.totalXp / stats.totalActivities : 0
        });
      }
      
      // 활동 수준별 세그먼트 정의
      const activityLevelSegments = [
        { name: '저활동 사용자', minActivity: 1, maxActivity: 5 },
        { name: '보통 활동 사용자', minActivity: 6, maxActivity: 20 },
        { name: '고활동 사용자', minActivity: 21, maxActivity: 50 },
        { name: '최고 활동 사용자', minActivity: 51, maxActivity: null }
      ];
      
      // 세그먼트별 XP 패턴 분석
      const xpByActivityLevel = [];
      
      for (const segment of activityLevelSegments) {
        // 활동 수준에 맞는 사용자 찾기
        const usersQuery = [
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
              activityCount: { $size: '$activities' }
            }
          },
          {
            $match: {
              activityCount: {
                $gte: segment.minActivity,
                ...(segment.maxActivity ? { $lt: segment.maxActivity } : {})
              }
            }
          },
          {
            $project: {
              _id: 1
            }
          }
        ];
        
        const usersInSegment = await User.aggregate(usersQuery);
        
        const userIds = usersInSegment.map(u => u._id);
        
        // 사용자 수가 없으면 스킵
        if (userIds.length === 0) {
          xpByActivityLevel.push({
            segment: segment.name,
            userCount: 0,
            totalXp: 0,
            avgXpPerUser: 0,
            avgActivitiesPerUser: 0,
            avgXpPerActivity: 0
          });
          continue;
        }
        
        // 해당 세그먼트의 XP 활동 통계
        const xpStats = await Activity.aggregate([
          {
            $match: {
              ...dateRange,
              user: { $in: userIds },
              'metadata.xp': { $exists: true, $gt: 0 }
            }
          },
          {
            $group: {
              _id: null,
              totalXp: { $sum: '$metadata.xp' },
              totalActivities: { $sum: 1 },
              uniqueUsers: { $addToSet: '$user' }
            }
          }
        ]);
        
        const stats = xpStats.length > 0 ? xpStats[0] : {
          totalXp: 0,
          totalActivities: 0,
          uniqueUsers: []
        };
        
        const uniqueUsersCount = stats.uniqueUsers ? stats.uniqueUsers.length : 0;
        
        xpByActivityLevel.push({
          segment: segment.name,
          userCount: userIds.length,
          activeUserCount: uniqueUsersCount,
          activeRate: userIds.length > 0 ? (uniqueUsersCount / userIds.length) * 100 : 0,
          totalXp: stats.totalXp,
          avgXpPerUser: uniqueUsersCount > 0 ? stats.totalXp / uniqueUsersCount : 0,
          avgActivitiesPerUser: uniqueUsersCount > 0 ? stats.totalActivities / uniqueUsersCount : 0,
          avgXpPerActivity: stats.totalActivities > 0 ? stats.totalXp / stats.totalActivities : 0
        });
      }
      
      // 소셜 인증 경로별 분석
      const xpByAuthProvider = await Activity.aggregate([
        {
          $match: {
            ...dateRange,
            'metadata.xp': { $exists: true, $gt: 0 }
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
            totalXp: { $sum: '$metadata.xp' },
            totalActivities: { $sum: 1 },
            uniqueUsers: { $addToSet: '$user' }
          }
        },
        {
          $project: {
            authProvider: '$_id',
            _id: 0,
            totalXp: 1,
            totalActivities: 1,
            uniqueUsers: { $size: '$uniqueUsers' },
            avgXpPerUser: { $divide: ['$totalXp', { $size: '$uniqueUsers' }] },
            avgXpPerActivity: { $divide: ['$totalXp', '$totalActivities'] },
            avgActivitiesPerUser: { $divide: ['$totalActivities', { $size: '$uniqueUsers' }] }
          }
        },
        {
          $sort: { avgXpPerUser: -1 }
        }
      ]);
      
      return {
        byJoinDate: xpByJoinDate,
        byActivityLevel: xpByActivityLevel,
        byAuthProvider: xpByAuthProvider,
        period: {
          startDate: startDate || 'All time',
          endDate: endDate || new Date()
        }
      };
    } catch (error) {
      logger.error('사용자 세그먼트별 XP 분석 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 레벨 진행 속도 및 XP 획득 패턴 분석
   * @param {Object} options - 분석 옵션
   * @returns {Promise<Object>} 레벨 진행 분석 결과
   */
  async analyzeLevelProgression(options = {}) {
    try {
      const { startDate, endDate } = options;
      
      // 날짜 범위 설정
      const dateRange = {};
      if (startDate) dateRange.createdAt = { $gte: startDate };
      if (endDate) dateRange.createdAt = { ...dateRange.createdAt, $lte: endDate };
      
      // 레벨업 기록 찾기
      const levelUpActivities = await Activity.find({
        ...dateRange,
        type: 'level_up'
      }).sort({ createdAt: 1 });
      
      // 레벨별 소요 시간 분석
      const levelProgressionMap = new Map();
      
      // 사용자별 레벨업 시간 추적
      const userLevelUpMap = new Map();
      
      for (const activity of levelUpActivities) {
        const userId = activity.user.toString();
        const level = activity.metadata.level;
        const timestamp = activity.createdAt;
        
        if (!userLevelUpMap.has(userId)) {
          userLevelUpMap.set(userId, []);
        }
        
        userLevelUpMap.get(userId).push({
          level,
          timestamp
        });
      }
      
      // 각 레벨별 소요 시간 계산
      for (const [userId, levelUps] of userLevelUpMap.entries()) {
        if (levelUps.length <= 1) continue;
        
        // 레벨업 기록을 시간순으로 정렬
        levelUps.sort((a, b) => a.timestamp - b.timestamp);
        
        // 각 레벨 간 소요 시간 계산
        for (let i = 1; i < levelUps.length; i++) {
          const currentLevel = levelUps[i].level;
          const prevLevel = levelUps[i - 1].level;
          const timeDiff = levelUps[i].timestamp - levelUps[i - 1].timestamp; // 밀리초
          
          // 레벨 스킵한 경우 처리
          if (currentLevel - prevLevel > 1) continue;
          
          if (!levelProgressionMap.has(currentLevel)) {
            levelProgressionMap.set(currentLevel, []);
          }
          
          levelProgressionMap.get(currentLevel).push({
            userId,
            timeTaken: timeDiff,
            days: timeDiff / (24 * 60 * 60 * 1000)
          });
        }
      }
      
      // 레벨별 통계 계산
      const levelProgression = [];
      
      for (const [level, progressions] of levelProgressionMap.entries()) {
        if (progressions.length === 0) continue;
        
        const totalTime = progressions.reduce((acc, p) => acc + p.timeTaken, 0);
        const avgTime = totalTime / progressions.length;
        const minTime = Math.min(...progressions.map(p => p.timeTaken));
        const maxTime = Math.max(...progressions.map(p => p.timeTaken));
        
        levelProgression.push({
          level,
          usersCount: progressions.length,
          avgDays: avgTime / (24 * 60 * 60 * 1000),
          minDays: minTime / (24 * 60 * 60 * 1000),
          maxDays: maxTime / (24 * 60 * 60 * 1000),
          medianDays: this._calculateMedian(progressions.map(p => p.days))
        });
      }
      
      // 순서대로 정렬
      levelProgression.sort((a, b) => a.level - b.level);
      
      // 레벨별 요구 XP와 소요 일수 관계 분석
      const levelRequirements = await this._getLevelRequirements();
      
      // 레벨별 XP 요구량 대비 소요 시간 분석
      const levelAnalysis = levelProgression.map(level => {
        const requirement = levelRequirements.find(req => req.level === level.level);
        const xpRequired = requirement ? requirement.xpRequired : null;
        
        return {
          ...level,
          xpRequired,
          daysPerXp: xpRequired && level.avgDays ? level.avgDays / xpRequired : null
        };
      });
      
      // 활동 유형별 레벨업 기여도 분석
      const activityContribution = await Activity.aggregate([
        {
          $match: {
            ...dateRange,
            'metadata.xp': { $exists: true, $gt: 0 }
          }
        },
        {
          $group: {
            _id: '$type',
            totalXp: { $sum: '$metadata.xp' },
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'activities',
            let: { activityType: '$_id' },
            pipeline: [
              { 
                $match: { 
                  $expr: { 
                    $and: [
                      { $eq: ['$type', '$$activityType'] },
                      { $eq: ['$category', 'blockchain'] }
                    ]
                  },
                  ...dateRange
                } 
              },
              { $count: 'total' }
            ],
            as: 'blockchainCount'
          }
        },
        {
          $project: {
            type: '$_id',
            _id: 0,
            totalXp: 1,
            count: 1,
            contributionPercent: { $multiply: [{ $divide: ['$totalXp', '$count'] }, 100] }
          }
        },
        {
          $sort: { totalXp: -1 }
        }
      ]);
      
      // 레벨업 빈도 분석 (날짜별)
      const levelUpFrequency = await Activity.aggregate([
        {
          $match: {
            ...dateRange,
            type: 'level_up'
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
            },
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: '$user' }
          }
        },
        {
          $project: {
            date: '$_id.date',
            _id: 0,
            count: 1,
            uniqueUsers: { $size: '$uniqueUsers' }
          }
        },
        {
          $sort: { date: 1 }
        }
      ]);
      
      return {
        levelProgression: levelAnalysis,
        activityContribution,
        levelUpFrequency,
        period: {
          startDate: startDate || 'All time',
          endDate: endDate || new Date()
        }
      };
    } catch (error) {
      logger.error('레벨 진행 분석 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * 중간값 계산 유틸리티 함수
   * @param {Array<number>} values - 값 배열
   * @returns {number} 중간값
   * @private
   */
  _calculateMedian(values) {
    if (values.length === 0) return 0;
    
    // 값을 오름차순으로 정렬
    const sorted = [...values].sort((a, b) => a - b);
    
    const mid = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      // 짝수 개의 항목이 있는 경우 중간 두 값의 평균
      return (sorted[mid - 1] + sorted[mid]) / 2;
    } else {
      // 홀수 개의 항목이 있는 경우 중간값
      return sorted[mid];
    }
  }
  
  /**
   * 레벨별 XP 요구량 가져오기
   * @returns {Promise<Array>} 레벨별 XP 요구량
   * @private
   */
  async _getLevelRequirements() {
    try {
      // 여기서는 하드코딩된 값을 반환하지만, 실제로는 DB나 설정 파일에서 가져옴
      return [
        { level: 1, xpRequired: 0 },
        { level: 2, xpRequired: 100 },
        { level: 3, xpRequired: 300 },
        { level: 4, xpRequired: 600 },
        { level: 5, xpRequired: 1000 },
        { level: 6, xpRequired: 1500 },
        { level: 7, xpRequired: 2100 },
        { level: 8, xpRequired: 2800 },
        { level: 9, xpRequired: 3600 },
        { level: 10, xpRequired: 4500 },
        { level: 11, xpRequired: 5500 },
        { level: 12, xpRequired: 6600 },
        { level: 13, xpRequired: 7800 },
        { level: 14, xpRequired: 9100 },
        { level: 15, xpRequired: 10500 },
        { level: 16, xpRequired: 12000 },
        { level: 17, xpRequired: 13600 },
        { level: 18, xpRequired: 15300 },
        { level: 19, xpRequired: 17100 },
        { level: 20, xpRequired: 19000 }
      ];
    } catch (error) {
      logger.error('레벨 요구량 가져오기 중 오류 발생:', error);
      return [];
    }
  }
  
  /**
   * 활동 유형별 XP 효율성 분석 (투자 시간 대비 XP 효율)
   * @param {Object} options - 분석 옵션
   * @returns {Promise<Object>} 활동 효율성 분석 결과
   */
  async analyzeActivityEfficiency(options = {}) {
    try {
      const { startDate, endDate } = options;
      
      // 날짜 범위 설정
      const dateRange = {};
      if (startDate) dateRange.createdAt = { $gte: startDate };
      if (endDate) dateRange.createdAt = { ...dateRange.createdAt, $lte: endDate };
      
      // 활동 유형별 평균 소요 시간 (예상치)
      const activityDurations = {
        'mission_participation': 10, // 미션 참여: 10분
        'daily_check_in': 1, // 출석 체크: 1분
        'comment_created': 3, // 댓글 작성: 3분
        'post_created': 15, // 게시물 작성: 15분
        'mission_completed': 30, // 미션 완료: 30분
        'badge_earned': 5, // 뱃지 획득: 5분
        'referral': 5, // 친구 추천: 5분
        'social_share': 2, // 소셜 공유: 2분
        'profile_updated': 5, // 프로필 업데이트: 5분
        'vote_casted': 2, // 투표: 2분
        'nft_created': 20 // NFT 생성: 20분
      };
      
      // 활동 유형별 XP 획득량
      const activityXp = await Activity.aggregate([
        {
          $match: {
            ...dateRange,
            'metadata.xp': { $exists: true, $gt: 0 }
          }
        },
        {
          $group: {
            _id: '$type',
            totalXp: { $sum: '$metadata.xp' },
            count: { $sum: 1 },
            avgXp: { $avg: '$metadata.xp' }
          }
        },
        {
          $project: {
            type: '$_id',
            _id: 0,
            totalXp: 1,
            count: 1,
            avgXp: 1
          }
        }
      ]);
      
      // 활동 유형별 효율성 계산
      const activityEfficiency = activityXp.map(activity => {
        const duration = activityDurations[activity.type] || 5; // 기본값 5분
        const xpPerMinute = activity.avgXp / duration;
        
        return {
          ...activity,
          estimatedDuration: duration,
          xpPerMinute,
          efficiency: xpPerMinute * 60 // 시간당 XP
        };
      });
      
      // 효율성 기준으로 정렬
      activityEfficiency.sort((a, b) => b.efficiency - a.efficiency);
      
      // 레벨업 소요 시간 추정
      const levelEstimations = [];
      const levelRequirements = await this._getLevelRequirements();
      
      // 상위 3개 효율적인 활동 추출
      const topActivities = activityEfficiency.slice(0, 3);
      
      // 각 레벨 달성 시간 추정
      for (let i = 1; i < levelRequirements.length; i++) {
        const prevLevel = levelRequirements[i-1];
        const currentLevel = levelRequirements[i];
        const xpNeeded = currentLevel.xpRequired - prevLevel.xpRequired;
        
        const estimations = topActivities.map(activity => {
          const timeInMinutes = xpNeeded / activity.xpPerMinute;
          const activitiesNeeded = Math.ceil(xpNeeded / activity.avgXp);
          
          return {
            activityType: activity.type,
            timeInMinutes,
            timeInHours: timeInMinutes / 60,
            activitiesNeeded
          };
        });
        
        levelEstimations.push({
          fromLevel: prevLevel.level,
          toLevel: currentLevel.level,
          xpNeeded,
          estimations
        });
      }
      
      return {
        activityEfficiency,
        levelEstimations,
        period: {
          startDate: startDate || 'All time',
          endDate: endDate || new Date()
        }
      };
    } catch (error) {
      logger.error('활동 효율성 분석 중 오류 발생:', error);
      throw error;
    }
  }
}

module.exports = new XpAccumulationAnalytics();
