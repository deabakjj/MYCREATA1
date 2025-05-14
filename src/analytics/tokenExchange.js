/**
 * 토큰 교환율 분석 모듈
 * 
 * CTA와 NEST 토큰 간의 교환 패턴 및 비율을 분석합니다.
 * 교환 거래 추세, 사용자 그룹별 교환 패턴, 교환 금액 분포 등을 추적합니다.
 */

const Activity = require('../models/activity');
const User = require('../models/user');
const Wallet = require('../models/wallet');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

/**
 * 토큰 교환율 분석 클래스
 */
class TokenExchangeAnalytics {
  /**
   * 지정된 기간 동안의 토큰 교환 지표 계산
   * @param {Object} options - 분석 옵션
   * @param {Date} options.startDate - 시작 날짜
   * @param {Date} options.endDate - 종료 날짜
   * @param {String} options.direction - 교환 방향 ('cta_to_nest', 'nest_to_cta', 'both')
   * @returns {Promise<Object>} 분석 결과
   */
  async calculateExchangeMetrics(options = {}) {
    try {
      const { startDate, endDate, direction = 'both' } = options;
      
      // 날짜 범위 설정
      const dateRange = {};
      if (startDate) dateRange.createdAt = { $gte: startDate };
      if (endDate) dateRange.createdAt = { ...dateRange.createdAt, $lte: endDate };
      
      // 교환 방향 필터
      const directionFilter = {};
      if (direction === 'cta_to_nest') {
        directionFilter.type = 'token_exchange_in'; // CTA -> NEST
      } else if (direction === 'nest_to_cta') {
        directionFilter.type = 'token_exchange_out'; // NEST -> CTA
      } else {
        directionFilter.$or = [
          { type: 'token_exchange_in' },
          { type: 'token_exchange_out' }
        ];
      }
      
      // 교환 통계 집계
      const exchangeStats = await Activity.aggregate([
        { 
          $match: { 
            ...dateRange,
            ...directionFilter,
            category: 'blockchain'
          } 
        },
        {
          $addFields: {
            // in은 CTA->NEST, out은 NEST->CTA
            exchangeDirection: {
              $cond: [
                { $eq: ['$type', 'token_exchange_in'] },
                'cta_to_nest',
                'nest_to_cta'
              ]
            }
          }
        },
        {
          $group: {
            _id: '$exchangeDirection',
            count: { $sum: 1 },
            totalAmount: { $sum: '$metadata.amount' },
            uniqueUsers: { $addToSet: '$user' },
            averageAmount: { $avg: '$metadata.amount' },
            minAmount: { $min: '$metadata.amount' },
            maxAmount: { $max: '$metadata.amount' }
          }
        },
        {
          $project: {
            direction: '$_id',
            count: 1,
            totalAmount: 1,
            uniqueUsers: { $size: '$uniqueUsers' },
            averageAmount: 1,
            minAmount: 1,
            maxAmount: 1
          }
        }
      ]);
      
      // 전체 요약 통계
      let summary = {
        totalExchanges: 0,
        uniqueUsers: new Set(),
        totalCtaToNest: 0,
        totalNestToCta: 0,
        ctaToNestAmount: 0,
        nestToCtaAmount: 0
      };
      
      exchangeStats.forEach(stat => {
        summary.totalExchanges += stat.count;
        
        if (stat.direction === 'cta_to_nest') {
          summary.totalCtaToNest += stat.count;
          summary.ctaToNestAmount += stat.totalAmount;
        } else {
          summary.totalNestToCta += stat.count;
          summary.nestToCtaAmount += stat.totalAmount;
        }
      });
      
      // 고유 사용자 수 계산
      const uniqueUsers = await Activity.aggregate([
        { 
          $match: { 
            ...dateRange,
            ...directionFilter,
            category: 'blockchain'
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
      
      summary.uniqueUsers = uniqueUsers.length > 0 ? uniqueUsers[0].total : 0;
      
      // 전환율 계산 (CTA->NEST vs NEST->CTA)
      const conversionRatio = summary.totalCtaToNest > 0 ? 
        (summary.totalNestToCta / summary.totalCtaToNest) : 0;
      
      const netFlow = summary.ctaToNestAmount - summary.nestToCtaAmount;
      
      // 시계열 데이터
      const timeseriesData = await this._getTimeseriesData(options);
      
      return {
        summary: {
          ...summary,
          conversionRatio: conversionRatio.toFixed(4),
          netFlow: netFlow.toFixed(2),
          netFlowDirection: netFlow > 0 ? 'cta_to_nest' : 'nest_to_cta'
        },
        exchangeStats,
        timeseriesData,
        period: {
          startDate: startDate || 'All time',
          endDate: endDate || new Date(),
          direction
        }
      };
    } catch (error) {
      logger.error('토큰 교환율 분석 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 시계열 데이터 가져오기 (일별/주별/월별 교환 추이)
   * @param {Object} options - 분석 옵션
   * @returns {Promise<Array>} 시계열 데이터
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
    
    // CTA -> NEST 교환 시계열 데이터
    const ctaToNestData = await Activity.aggregate([
      { 
        $match: { 
          ...dateRange,
          type: 'token_exchange_in',
          category: 'blockchain'
        } 
      },
      {
        $group: {
          _id: { 
            date: { $dateToString: { format: dateFormat, date: '$createdAt' } }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$metadata.amount' },
          uniqueUsers: { $addToSet: '$user' }
        }
      },
      {
        $project: {
          date: '$_id.date',
          count: 1,
          totalAmount: 1,
          uniqueUsers: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { date: 1 } }
    ]);
    
    // NEST -> CTA 교환 시계열 데이터
    const nestToCtaData = await Activity.aggregate([
      { 
        $match: { 
          ...dateRange,
          type: 'token_exchange_out',
          category: 'blockchain'
        } 
      },
      {
        $group: {
          _id: { 
            date: { $dateToString: { format: dateFormat, date: '$createdAt' } }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$metadata.amount' },
          uniqueUsers: { $addToSet: '$user' }
        }
      },
      {
        $project: {
          date: '$_id.date',
          count: 1,
          totalAmount: 1,
          uniqueUsers: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { date: 1 } }
    ]);
    
    // 모든 날짜 수집
    const dateMap = new Map();
    
    // 모든 고유 날짜 가져오기
    const allDates = new Set([
      ...ctaToNestData.map(item => item.date),
      ...nestToCtaData.map(item => item.date)
    ]);
    
    // 각 날짜별 데이터 초기화
    for (const date of allDates) {
      dateMap.set(date, {
        date,
        ctaToNest: {
          count: 0,
          totalAmount: 0,
          uniqueUsers: 0
        },
        nestToCta: {
          count: 0,
          totalAmount: 0,
          uniqueUsers: 0
        },
        netFlow: 0,
        ratio: 0
      });
    }
    
    // 데이터 채우기: CTA -> NEST
    ctaToNestData.forEach(item => {
      if (dateMap.has(item.date)) {
        dateMap.get(item.date).ctaToNest = {
          count: item.count,
          totalAmount: item.totalAmount,
          uniqueUsers: item.uniqueUsers
        };
      }
    });
    
    // 데이터 채우기: NEST -> CTA
    nestToCtaData.forEach(item => {
      if (dateMap.has(item.date)) {
        dateMap.get(item.date).nestToCta = {
          count: item.count,
          totalAmount: item.totalAmount,
          uniqueUsers: item.uniqueUsers
        };
      }
    });
    
    // 순 흐름과 비율 계산
    for (const [date, data] of dateMap.entries()) {
      data.netFlow = data.ctaToNest.totalAmount - data.nestToCta.totalAmount;
      data.ratio = data.ctaToNest.count > 0 ? 
        (data.nestToCta.count / data.ctaToNest.count) : 0;
    }
    
    // 날짜순으로 정렬된 배열로 변환
    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * 사용자 세그먼트별 토큰 교환 패턴 분석
   * @param {Object} options - 분석 옵션
   * @returns {Promise<Object>} 세그먼트별 분석 결과
   */
  async analyzeExchangeByUserSegment(options = {}) {
    try {
      const { startDate, endDate } = options;
      
      // 날짜 범위 설정
      const dateRange = {};
      if (startDate) dateRange.createdAt = { $gte: startDate };
      if (endDate) dateRange.createdAt = { ...dateRange.createdAt, $lte: endDate };
      
      // 사용자 활동 수준별 세그먼트 정의
      const activitySegments = [
        { name: '초보 사용자', minActivity: 0, maxActivity: 5 },
        { name: '일반 사용자', minActivity: 5, maxActivity: 20 },
        { name: '활발한 사용자', minActivity: 20, maxActivity: 50 },
        { name: '최상위 사용자', minActivity: 50, maxActivity: null }
      ];
      
      // 세그먼트별 교환 패턴 분석
      const segmentAnalysis = [];
      
      for (const segment of activitySegments) {
        // 활동 수준에 맞는 사용자 찾기
        const usersQuery = {
          // 활동 수 기반 필터링
          activityCount: {
            $gte: segment.minActivity,
            ...(segment.maxActivity ? { $lt: segment.maxActivity } : {})
          }
        };
        
        const usersInSegment = await User.find(usersQuery).select('_id');
        const userIds = usersInSegment.map(u => u._id);
        
        // 해당 세그먼트의 CTA -> NEST 교환
        const ctaToNestExchanges = await Activity.aggregate([
          { 
            $match: { 
              ...dateRange,
              user: { $in: userIds },
              type: 'token_exchange_in',
              category: 'blockchain'
            } 
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              totalAmount: { $sum: '$metadata.amount' },
              uniqueUsers: { $addToSet: '$user' },
              avgAmount: { $avg: '$metadata.amount' }
            }
          }
        ]);
        
        // 해당 세그먼트의 NEST -> CTA 교환
        const nestToCtaExchanges = await Activity.aggregate([
          { 
            $match: { 
              ...dateRange,
              user: { $in: userIds },
              type: 'token_exchange_out',
              category: 'blockchain'
            } 
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              totalAmount: { $sum: '$metadata.amount' },
              uniqueUsers: { $addToSet: '$user' },
              avgAmount: { $avg: '$metadata.amount' }
            }
          }
        ]);
        
        // 결과 집계
        const ctaToNest = ctaToNestExchanges.length > 0 ? {
          count: ctaToNestExchanges[0].count,
          totalAmount: ctaToNestExchanges[0].totalAmount,
          uniqueUsers: ctaToNestExchanges[0].uniqueUsers.length,
          avgAmount: ctaToNestExchanges[0].avgAmount
        } : {
          count: 0,
          totalAmount: 0,
          uniqueUsers: 0,
          avgAmount: 0
        };
        
        const nestToCta = nestToCtaExchanges.length > 0 ? {
          count: nestToCtaExchanges[0].count,
          totalAmount: nestToCtaExchanges[0].totalAmount,
          uniqueUsers: nestToCtaExchanges[0].uniqueUsers.length,
          avgAmount: nestToCtaExchanges[0].avgAmount
        } : {
          count: 0,
          totalAmount: 0,
          uniqueUsers: 0,
          avgAmount: 0
        };
        
        // 사용자당 평균 교환 횟수
        const usersWithExchanges = new Set([
          ...(ctaToNestExchanges.length > 0 ? ctaToNestExchanges[0].uniqueUsers : []),
          ...(nestToCtaExchanges.length > 0 ? nestToCtaExchanges[0].uniqueUsers : [])
        ]);
        
        const exchangesPerUser = usersWithExchanges.size > 0 ? 
          (ctaToNest.count + nestToCta.count) / usersWithExchanges.size : 0;
        
        // 순 흐름과 비율 계산
        const netFlow = ctaToNest.totalAmount - nestToCta.totalAmount;
        const exchangeRatio = ctaToNest.count > 0 ? 
          nestToCta.count / ctaToNest.count : 0;
        
        // 세그먼트별 결과 추가
        segmentAnalysis.push({
          segment: segment.name,
          totalUsers: userIds.length,
          usersWithExchanges: usersWithExchanges.size,
          exchangesPerUser: exchangesPerUser.toFixed(2),
          ctaToNest,
          nestToCta,
          netFlow: netFlow.toFixed(2),
          exchangeRatio: exchangeRatio.toFixed(4),
          preferredDirection: netFlow > 0 ? 'cta_to_nest' : 'nest_to_cta'
        });
      }
      
      // 사용자 유형별 분석 (소셜 로그인 소스)
      const authProviderAnalysis = await Activity.aggregate([
        { 
          $match: { 
            ...dateRange,
            category: 'blockchain',
            $or: [
              { type: 'token_exchange_in' },
              { type: 'token_exchange_out' }
            ]
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
          $addFields: {
            exchangeDirection: {
              $cond: [
                { $eq: ['$type', 'token_exchange_in'] },
                'cta_to_nest',
                'nest_to_cta'
              ]
            }
          }
        },
        {
          $group: {
            _id: {
              provider: '$userInfo.authProvider',
              direction: '$exchangeDirection'
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$metadata.amount' },
            uniqueUsers: { $addToSet: '$user' }
          }
        },
        {
          $project: {
            provider: '$_id.provider',
            direction: '$_id.direction',
            count: 1,
            totalAmount: 1,
            uniqueUsers: { $size: '$uniqueUsers' }
          }
        },
        { $sort: { provider: 1, direction: 1 } }
      ]);
      
      // 인증 제공업체별 그룹화
      const providerGroups = {};
      
      authProviderAnalysis.forEach(item => {
        if (!providerGroups[item.provider]) {
          providerGroups[item.provider] = {
            provider: item.provider,
            ctaToNest: {
              count: 0,
              totalAmount: 0,
              uniqueUsers: 0
            },
            nestToCta: {
              count: 0,
              totalAmount: 0,
              uniqueUsers: 0
            }
          };
        }
        
        if (item.direction === 'cta_to_nest') {
          providerGroups[item.provider].ctaToNest = {
            count: item.count,
            totalAmount: item.totalAmount,
            uniqueUsers: item.uniqueUsers
          };
        } else {
          providerGroups[item.provider].nestToCta = {
            count: item.count,
            totalAmount: item.totalAmount,
            uniqueUsers: item.uniqueUsers
          };
        }
      });
      
      // 비율 및 순 흐름 계산
      for (const provider in providerGroups) {
        const data = providerGroups[provider];
        data.netFlow = data.ctaToNest.totalAmount - data.nestToCta.totalAmount;
        data.exchangeRatio = data.ctaToNest.count > 0 ? 
          data.nestToCta.count / data.ctaToNest.count : 0;
        data.preferredDirection = data.netFlow > 0 ? 'cta_to_nest' : 'nest_to_cta';
      }
      
      return {
        byActivityLevel: segmentAnalysis,
        byAuthProvider: Object.values(providerGroups),
        period: {
          startDate: startDate || 'All time',
          endDate: endDate || new Date()
        }
      };
    } catch (error) {
      logger.error('사용자 세그먼트별 교환 패턴 분석 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 토큰 교환 금액 분포 분석
   * @param {Object} options - 분석 옵션
   * @returns {Promise<Object>} 금액 분포 분석 결과
   */
  async analyzeExchangeAmountDistribution(options = {}) {
    try {
      const { startDate, endDate } = options;
      
      // 날짜 범위 설정
      const dateRange = {};
      if (startDate) dateRange.createdAt = { $gte: startDate };
      if (endDate) dateRange.createdAt = { ...dateRange.createdAt, $lte: endDate };
      
      // CTA -> NEST 금액 분포
      const ctaToNestAmountRanges = [
        { min: 0, max: 10, label: '0-10 CTA' },
        { min: 10, max: 50, label: '10-50 CTA' },
        { min: 50, max: 100, label: '50-100 CTA' },
        { min: 100, max: 500, label: '100-500 CTA' },
        { min: 500, max: 1000, label: '500-1000 CTA' },
        { min: 1000, max: null, label: '1000+ CTA' }
      ];
      
      const ctaToNestDistribution = [];
      
      for (const range of ctaToNestAmountRanges) {
        const amountFilter = {};
        if (range.min !== null) amountFilter['metadata.amount'] = { $gte: range.min };
        if (range.max !== null) amountFilter['metadata.amount'] = { ...amountFilter['metadata.amount'], $lt: range.max };
        
        const exchangesInRange = await Activity.aggregate([
          {
            $match: {
              ...dateRange,
              type: 'token_exchange_in',
              category: 'blockchain',
              ...amountFilter
            }
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              totalAmount: { $sum: '$metadata.amount' },
              uniqueUsers: { $addToSet: '$user' }
            }
          }
        ]);
        
        const count = exchangesInRange.length > 0 ? exchangesInRange[0].count : 0;
        const totalAmount = exchangesInRange.length > 0 ? exchangesInRange[0].totalAmount : 0;
        const uniqueUsers = exchangesInRange.length > 0 ? exchangesInRange[0].uniqueUsers.length : 0;
        
        ctaToNestDistribution.push({
          range: range.label,
          count,
          totalAmount,
          uniqueUsers,
          averageAmount: count > 0 ? totalAmount / count : 0
        });
      }
      
      // NEST -> CTA 금액 분포
      const nestToCtaAmountRanges = [
        { min: 0, max: 1000, label: '0-1000 NEST' },
        { min: 1000, max: 5000, label: '1K-5K NEST' },
        { min: 5000, max: 10000, label: '5K-10K NEST' },
        { min: 10000, max: 50000, label: '10K-50K NEST' },
        { min: 50000, max: 100000, label: '50K-100K NEST' },
        { min: 100000, max: null, label: '100K+ NEST' }
      ];
      
      const nestToCtaDistribution = [];
      
      for (const range of nestToCtaAmountRanges) {
        const amountFilter = {};
        if (range.min !== null) amountFilter['metadata.amount'] = { $gte: range.min };
        if (range.max !== null) amountFilter['metadata.amount'] = { ...amountFilter['metadata.amount'], $lt: range.max };
        
        const exchangesInRange = await Activity.aggregate([
          {
            $match: {
              ...dateRange,
              type: 'token_exchange_out',
              category: 'blockchain',
              ...amountFilter
            }
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              totalAmount: { $sum: '$metadata.amount' },
              uniqueUsers: { $addToSet: '$user' }
            }
          }
        ]);
        
        const count = exchangesInRange.length > 0 ? exchangesInRange[0].count : 0;
        const totalAmount = exchangesInRange.length > 0 ? exchangesInRange[0].totalAmount : 0;
        const uniqueUsers = exchangesInRange.length > 0 ? exchangesInRange[0].uniqueUsers.length : 0;
        
        nestToCtaDistribution.push({
          range: range.label,
          count,
          totalAmount,
          uniqueUsers,
          averageAmount: count > 0 ? totalAmount / count : 0
        });
      }
      
      // 교환 건수별 사용자 분포
      const exchangeCountRanges = [
        { min: 1, max: 2, label: '1-2 교환' },
        { min: 3, max: 5, label: '3-5 교환' },
        { min: 6, max: 10, label: '6-10 교환' },
        { min: 11, max: 20, label: '11-20 교환' },
        { min: 21, max: null, label: '21+ 교환' }
      ];
      
      // 사용자별 교환 횟수 집계
      const userExchangeCounts = await Activity.aggregate([
        {
          $match: {
            ...dateRange,
            category: 'blockchain',
            $or: [
              { type: 'token_exchange_in' },
              { type: 'token_exchange_out' }
            ]
          }
        },
        {
          $group: {
            _id: '$user',
            exchangeCount: { $sum: 1 }
          }
        }
      ]);
      
      const userCountByExchanges = [];
      
      for (const range of exchangeCountRanges) {
        const usersInRange = userExchangeCounts.filter(user => 
          user.exchangeCount >= range.min && 
          (range.max === null || user.exchangeCount < range.max)
        );
        
        userCountByExchanges.push({
          range: range.label,
          userCount: usersInRange.length,
          percentage: userExchangeCounts.length > 0 ? 
            (usersInRange.length / userExchangeCounts.length) * 100 : 0
        });
      }
      
      return {
        ctaToNestDistribution,
        nestToCtaDistribution,
        userCountByExchanges,
        period: {
          startDate: startDate || 'All time',
          endDate: endDate || new Date()
        }
      };
    } catch (error) {
      logger.error('토큰 교환 금액 분포 분석 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 교환 이후 보유량 및 활동 패턴 분석
   * @param {Object} options - 분석 옵션
   * @returns {Promise<Object>} 보유량 및 활동 패턴 분석 결과
   */
  async analyzePostExchangeBehavior(options = {}) {
    try {
      const { startDate, endDate, daysAfter = 30 } = options;
      
      // 날짜 범위 설정
      const dateRange = {};
      if (startDate) dateRange.createdAt = { $gte: startDate };
      if (endDate) dateRange.createdAt = { ...dateRange.createdAt, $lte: endDate };
      
      // CTA -> NEST 교환 후 행동 패턴
      const ctaToNestUsers = await Activity.aggregate([
        {
          $match: {
            ...dateRange,
            type: 'token_exchange_in',
            category: 'blockchain'
          }
        },
        {
          $sort: { createdAt: 1 }
        },
        {
          $group: {
            _id: '$user',
            firstExchange: { $first: '$createdAt' },
            exchangeCount: { $sum: 1 },
            totalAmount: { $sum: '$metadata.amount' }
          }
        }
      ]);
      
      const ctaToNestBehavior = [];
      
      for (const user of ctaToNestUsers) {
        // 교환 후 30일간의 활동 분석
        const afterDate = new Date(user.firstExchange);
        afterDate.setDate(afterDate.getDate() + daysAfter);
        
        const postExchangeActivities = await Activity.aggregate([
          {
            $match: {
              user: user._id,
              createdAt: { $gt: user.firstExchange, $lte: afterDate }
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
        postExchangeActivities.forEach(activity => {
          activityMap[activity._id] = activity.count;
        });
        
        // NEST 토큰 사용 활동 (전송, 스테이킹 등)
        const nestUsageActivities = await Activity.aggregate([
          {
            $match: {
              user: user._id,
              createdAt: { $gt: user.firstExchange, $lte: afterDate },
              category: 'blockchain',
              type: { $in: ['token_sent', 'token_staked', 'token_unstaked'] }
            }
          },
          {
            $count: 'total'
          }
        ]);
        
        const nestUsageCount = nestUsageActivities.length > 0 ? nestUsageActivities[0].total : 0;
        
        // NFT 관련 활동
        const nftActivities = await Activity.aggregate([
          {
            $match: {
              user: user._id,
              createdAt: { $gt: user.firstExchange, $lte: afterDate },
              category: 'blockchain',
              type: { $in: ['nft_received', 'nft_sent', 'nft_created'] }
            }
          },
          {
            $count: 'total'
          }
        ]);
        
        const nftActivityCount = nftActivities.length > 0 ? nftActivities[0].total : 0;
        
        // 미션 참여 활동
        const missionActivities = await Activity.aggregate([
          {
            $match: {
              user: user._id,
              createdAt: { $gt: user.firstExchange, $lte: afterDate },
              type: 'mission_participation'
            }
          },
          {
            $count: 'total'
          }
        ]);
        
        const missionCount = missionActivities.length > 0 ? missionActivities[0].total : 0;
        
        // 결과 추가
        ctaToNestBehavior.push({
          userId: user._id,
          exchangeAmount: user.totalAmount,
          exchangeCount: user.exchangeCount,
          blockchainActivities: activityMap['blockchain'] || 0,
          platformActivities: activityMap['platform'] || 0,
          socialActivities: activityMap['social'] || 0,
          nestUsageCount,
          nftActivityCount,
          missionCount,
          isActive: (activityMap['blockchain'] || 0) > 0 || (activityMap['platform'] || 0) > 0
        });
      }
      
      // 각 행동 패턴별 집계
      const totalUsers = ctaToNestBehavior.length;
      const activeUsers = ctaToNestBehavior.filter(u => u.isActive).length;
      const usersWithNestUsage = ctaToNestBehavior.filter(u => u.nestUsageCount > 0).length;
      const usersWithNftActivity = ctaToNestBehavior.filter(u => u.nftActivityCount > 0).length;
      const usersWithMissions = ctaToNestBehavior.filter(u => u.missionCount > 0).length;
      
      // NEST -> CTA 교환 후 행동 패턴 (동일한 분석)
      const nestToCtaUsers = await Activity.aggregate([
        {
          $match: {
            ...dateRange,
            type: 'token_exchange_out',
            category: 'blockchain'
          }
        },
        {
          $sort: { createdAt: 1 }
        },
        {
          $group: {
            _id: '$user',
            firstExchange: { $first: '$createdAt' },
            exchangeCount: { $sum: 1 },
            totalAmount: { $sum: '$metadata.amount' }
          }
        }
      ]);
      
      const nestToCtaBehavior = [];
      
      // 동일한 분석 로직 적용 (NEST -> CTA)
      for (const user of nestToCtaUsers) {
        const afterDate = new Date(user.firstExchange);
        afterDate.setDate(afterDate.getDate() + daysAfter);
        
        const postExchangeActivities = await Activity.aggregate([
          {
            $match: {
              user: user._id,
              createdAt: { $gt: user.firstExchange, $lte: afterDate }
            }
          },
          {
            $group: {
              _id: '$category',
              count: { $sum: 1 }
            }
          }
        ]);
        
        const activityMap = {};
        postExchangeActivities.forEach(activity => {
          activityMap[activity._id] = activity.count;
        });
        
        // 이후 CTA 사용 활동 (일반 블록체인 활동)
        const ctaUsageActivities = await Activity.aggregate([
          {
            $match: {
              user: user._id,
              createdAt: { $gt: user.firstExchange, $lte: afterDate },
              category: 'blockchain',
              type: { $in: ['token_sent', 'token_received'] }
            }
          },
          {
            $count: 'total'
          }
        ]);
        
        const ctaUsageCount = ctaUsageActivities.length > 0 ? ctaUsageActivities[0].total : 0;
        
        nestToCtaBehavior.push({
          userId: user._id,
          exchangeAmount: user.totalAmount,
          exchangeCount: user.exchangeCount,
          blockchainActivities: activityMap['blockchain'] || 0,
          platformActivities: activityMap['platform'] || 0,
          socialActivities: activityMap['social'] || 0,
          ctaUsageCount,
          isActive: (activityMap['blockchain'] || 0) > 0 || (activityMap['platform'] || 0) > 0
        });
      }
      
      // NEST -> CTA 집계
      const totalNestToCtaUsers = nestToCtaBehavior.length;
      const activeNestToCtaUsers = nestToCtaBehavior.filter(u => u.isActive).length;
      const usersWithCtaUsage = nestToCtaBehavior.filter(u => u.ctaUsageCount > 0).length;
      
      return {
        ctaToNest: {
          totalUsers,
          activeUsers,
          activeRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
          usersWithNestUsage,
          nestUsageRate: totalUsers > 0 ? (usersWithNestUsage / totalUsers) * 100 : 0,
          usersWithNftActivity,
          nftActivityRate: totalUsers > 0 ? (usersWithNftActivity / totalUsers) * 100 : 0,
          usersWithMissions,
          missionRate: totalUsers > 0 ? (usersWithMissions / totalUsers) * 100 : 0,
          averageBlockchainActivities: totalUsers > 0 ? 
            ctaToNestBehavior.reduce((sum, u) => sum + u.blockchainActivities, 0) / totalUsers : 0,
          averagePlatformActivities: totalUsers > 0 ? 
            ctaToNestBehavior.reduce((sum, u) => sum + u.platformActivities, 0) / totalUsers : 0
        },
        nestToCta: {
          totalUsers: totalNestToCtaUsers,
          activeUsers: activeNestToCtaUsers,
          activeRate: totalNestToCtaUsers > 0 ? (activeNestToCtaUsers / totalNestToCtaUsers) * 100 : 0,
          usersWithCtaUsage,
          ctaUsageRate: totalNestToCtaUsers > 0 ? (usersWithCtaUsage / totalNestToCtaUsers) * 100 : 0,
          averageBlockchainActivities: totalNestToCtaUsers > 0 ? 
            nestToCtaBehavior.reduce((sum, u) => sum + u.blockchainActivities, 0) / totalNestToCtaUsers : 0,
          averagePlatformActivities: totalNestToCtaUsers > 0 ? 
            nestToCtaBehavior.reduce((sum, u) => sum + u.platformActivities, 0) / totalNestToCtaUsers : 0
        },
        period: {
          startDate: startDate || 'All time',
          endDate: endDate || new Date(),
          daysAfter
        }
      };
    } catch (error) {
      logger.error('교환 이후 행동 패턴 분석 중 오류 발생:', error);
      throw error;
    }
  }
}

module.exports = new TokenExchangeAnalytics();
