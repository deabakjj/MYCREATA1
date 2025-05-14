/**
 * 사용자 전환률 분석 모듈
 * 
 * Web2 사용자가 Web3 기능을 얼마나 활용하는지 분석합니다.
 * 소셜 로그인 사용자의 지갑 생성 및 블록체인 활동 전환률을 추적합니다.
 */

const User = require('../models/user');
const Activity = require('../models/activity');
const Wallet = require('../models/wallet');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

/**
 * 사용자 전환률 분석 클래스
 */
class UserConversionAnalytics {
  /**
   * 지정된 기간 동안의 사용자 전환률 지표 계산
   * @param {Object} options - 분석 옵션
   * @param {Date} options.startDate - 시작 날짜
   * @param {Date} options.endDate - 종료 날짜
   * @param {string} options.source - 특정 소셜 로그인 소스 필터 (선택 사항)
   * @returns {Promise<Object>} 분석 결과
   */
  async calculateConversionMetrics(options = {}) {
    try {
      const { startDate, endDate, source } = options;
      
      // 날짜 범위 설정
      const dateRange = {};
      if (startDate) dateRange.createdAt = { $gte: startDate };
      if (endDate) dateRange.createdAt = { ...dateRange.createdAt, $lte: endDate };
      
      // 소셜 로그인 소스 필터
      const sourceFilter = source ? { authProvider: source } : {};
      
      // 집계 쿼리
      const conversionMetrics = await User.aggregate([
        { 
          $match: { 
            ...dateRange,
            ...sourceFilter,
            // 소셜 로그인 사용자만 필터링
            authProvider: { $ne: null }
          } 
        },
        {
          $lookup: {
            from: 'wallets',
            localField: '_id',
            foreignField: 'user',
            as: 'wallet'
          }
        },
        {
          $lookup: {
            from: 'activities',
            localField: '_id',
            foreignField: 'user',
            as: 'activities'
          }
        },
        {
          $project: {
            _id: 1,
            username: 1,
            authProvider: 1,
            createdAt: 1,
            hasWallet: { $cond: [{ $gt: [{ $size: '$wallet' }, 0] }, true, false] },
            walletCreatedAt: { $arrayElemAt: ['$wallet.createdAt', 0] },
            activityCount: { $size: '$activities' },
            blockchainActivity: {
              $gt: [
                { 
                  $size: { 
                    $filter: { 
                      input: '$activities', 
                      as: 'activity', 
                      cond: { $eq: ['$$activity.category', 'blockchain'] }
                    }
                  } 
                }, 
                0
              ]
            }
          }
        },
        {
          $group: {
            _id: '$authProvider',
            totalUsers: { $sum: 1 },
            usersWithWallet: { $sum: { $cond: ['$hasWallet', 1, 0] } },
            usersWithBlockchainActivity: { $sum: { $cond: ['$blockchainActivity', 1, 0] } },
            avgWalletCreationTime: { 
              $avg: { 
                $cond: [
                  '$hasWallet', 
                  { $subtract: ['$walletCreatedAt', '$createdAt'] }, 
                  null
                ]
              } 
            },
            avgActivitiesPerUser: { $avg: '$activityCount' }
          }
        }
      ]);

      // 전체 통계 계산
      const totalStats = conversionMetrics.reduce((acc, provider) => {
        acc.totalUsers += provider.totalUsers;
        acc.usersWithWallet += provider.usersWithWallet;
        acc.usersWithBlockchainActivity += provider.usersWithBlockchainActivity;
        return acc;
      }, { totalUsers: 0, usersWithWallet: 0, usersWithBlockchainActivity: 0 });
      
      // 전환률 계산
      const walletConversionRate = totalStats.totalUsers > 0 ? 
        (totalStats.usersWithWallet / totalStats.totalUsers) * 100 : 0;
        
      const activityConversionRate = totalStats.usersWithWallet > 0 ? 
        (totalStats.usersWithBlockchainActivity / totalStats.usersWithWallet) * 100 : 0;
        
      const totalConversionRate = totalStats.totalUsers > 0 ? 
        (totalStats.usersWithBlockchainActivity / totalStats.totalUsers) * 100 : 0;
      
      // 시계열 데이터 (일별 가입 및 전환)
      const timeseriesData = await this._getTimeseriesData(options);
      
      return {
        summary: {
          totalUsers: totalStats.totalUsers,
          usersWithWallet: totalStats.usersWithWallet,
          usersWithBlockchainActivity: totalStats.usersWithBlockchainActivity,
          walletConversionRate: walletConversionRate.toFixed(2),
          activityConversionRate: activityConversionRate.toFixed(2),
          totalConversionRate: totalConversionRate.toFixed(2)
        },
        providerStats: conversionMetrics,
        timeseriesData,
        period: {
          startDate: startDate || 'All time',
          endDate: endDate || new Date()
        }
      };
    } catch (error) {
      logger.error('사용자 전환률 분석 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 시계열 데이터 가져오기 (일별 가입 및 전환)
   * @param {Object} options - 분석 옵션
   * @returns {Promise<Array>} 일별 시계열 데이터
   * @private
   */
  async _getTimeseriesData(options) {
    const { startDate, endDate, source } = options;
    
    // 날짜 범위 설정
    const dateRange = {};
    if (startDate) dateRange.createdAt = { $gte: startDate };
    if (endDate) dateRange.createdAt = { ...dateRange.createdAt, $lte: endDate };
    
    // 소셜 로그인 소스 필터
    const sourceFilter = source ? { authProvider: source } : {};
    
    // 일별 신규 사용자
    const dailySignups = await User.aggregate([
      { 
        $match: { 
          ...dateRange,
          ...sourceFilter,
          authProvider: { $ne: null }
        } 
      },
      {
        $group: {
          _id: { 
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } 
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // 일별 지갑 생성
    const dailyWalletCreations = await Wallet.aggregate([
      { 
        $match: dateRange
      },
      {
        $group: {
          _id: { 
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } 
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // 일별 블록체인 활동
    const dailyBlockchainActivities = await Activity.aggregate([
      { 
        $match: { 
          ...dateRange,
          category: 'blockchain'
        } 
      },
      {
        $group: {
          _id: { 
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } 
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // 데이터 병합
    const dateMap = new Map();
    
    // 모든 날짜 수집
    const allDates = new Set([
      ...dailySignups.map(item => item._id),
      ...dailyWalletCreations.map(item => item._id),
      ...dailyBlockchainActivities.map(item => item._id)
    ]);
    
    // 각 날짜별 데이터 초기화
    for (const date of allDates) {
      dateMap.set(date, {
        date,
        newUsers: 0,
        newWallets: 0,
        blockchainActivities: 0
      });
    }
    
    // 데이터 채우기
    dailySignups.forEach(item => {
      if (dateMap.has(item._id)) {
        dateMap.get(item._id).newUsers = item.count;
      }
    });
    
    dailyWalletCreations.forEach(item => {
      if (dateMap.has(item._id)) {
        dateMap.get(item._id).newWallets = item.count;
      }
    });
    
    dailyBlockchainActivities.forEach(item => {
      if (dateMap.has(item._id)) {
        dateMap.get(item._id).blockchainActivities = item.count;
      }
    });
    
    // 날짜순으로 정렬된 배열로 변환
    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * 기간별 전환률 변화 추세 분석
   * @param {Object} options - 분석 옵션
   * @returns {Promise<Object>} 추세 분석 결과
   */
  async analyzeConversionTrends(options = {}) {
    try {
      const { intervalType = 'month', periods = 6 } = options;
      
      // 현재 날짜
      const now = new Date();
      
      // 분석 기간 설정
      const intervals = [];
      for (let i = 0; i < periods; i++) {
        const endDate = new Date(now);
        
        // 기간 타입에 따른 날짜 설정
        if (intervalType === 'day') {
          endDate.setDate(now.getDate() - i);
          const startDate = new Date(endDate);
          startDate.setDate(endDate.getDate() - 1);
          intervals.push({ startDate, endDate });
        } else if (intervalType === 'week') {
          endDate.setDate(now.getDate() - (i * 7));
          const startDate = new Date(endDate);
          startDate.setDate(endDate.getDate() - 7);
          intervals.push({ startDate, endDate });
        } else if (intervalType === 'month') {
          endDate.setMonth(now.getMonth() - i);
          const startDate = new Date(endDate);
          startDate.setMonth(endDate.getMonth() - 1);
          intervals.push({ startDate, endDate });
        }
      }
      
      // 각 기간별 전환률 계산
      const trendsData = [];
      for (const interval of intervals) {
        const metrics = await this.calculateConversionMetrics({
          startDate: interval.startDate,
          endDate: interval.endDate
        });
        
        trendsData.push({
          period: {
            start: interval.startDate,
            end: interval.endDate
          },
          walletConversionRate: parseFloat(metrics.summary.walletConversionRate),
          activityConversionRate: parseFloat(metrics.summary.activityConversionRate),
          totalConversionRate: parseFloat(metrics.summary.totalConversionRate),
          newUsers: metrics.summary.totalUsers
        });
      }
      
      // 첫 번째와 마지막 기간의 전환률 변화
      const firstPeriod = trendsData[trendsData.length - 1];
      const lastPeriod = trendsData[0];
      
      const walletConversionChange = lastPeriod.walletConversionRate - firstPeriod.walletConversionRate;
      const activityConversionChange = lastPeriod.activityConversionRate - firstPeriod.activityConversionRate;
      const totalConversionChange = lastPeriod.totalConversionRate - firstPeriod.totalConversionRate;
      
      return {
        intervalType,
        periods,
        trendsData: trendsData.reverse(), // 시간순 정렬
        changes: {
          walletConversionChange: walletConversionChange.toFixed(2),
          activityConversionChange: activityConversionChange.toFixed(2),
          totalConversionChange: totalConversionChange.toFixed(2),
          walletConversionPercentChange: firstPeriod.walletConversionRate > 0 ? 
            ((walletConversionChange / firstPeriod.walletConversionRate) * 100).toFixed(2) : 'N/A',
          activityConversionPercentChange: firstPeriod.activityConversionRate > 0 ? 
            ((activityConversionChange / firstPeriod.activityConversionRate) * 100).toFixed(2) : 'N/A',
          totalConversionPercentChange: firstPeriod.totalConversionRate > 0 ? 
            ((totalConversionChange / firstPeriod.totalConversionRate) * 100).toFixed(2) : 'N/A'
        }
      };
    } catch (error) {
      logger.error('전환률 추세 분석 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 사용자 세그먼트별 전환률 분석
   * @param {Object} options - 분석 옵션
   * @returns {Promise<Object>} 세그먼트별 분석 결과
   */
  async analyzeSegmentConversion(options = {}) {
    try {
      const segments = options.segments || [
        { name: '신규 사용자', filter: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        { name: '기존 사용자', filter: { createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        { name: '활발한 사용자', filter: { lastActivityAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
        { name: '비활동 사용자', filter: { lastActivityAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }
      ];
      
      const segmentResults = [];
      
      for (const segment of segments) {
        // 사용자 수 계산
        const totalUsers = await User.countDocuments({
          ...segment.filter,
          authProvider: { $ne: null }
        });
        
        // 지갑 생성한 사용자 수
        const usersWithWallet = await User.countDocuments({
          ...segment.filter,
          authProvider: { $ne: null },
          _id: { $in: await Wallet.distinct('user') }
        });
        
        // 블록체인 활동한 사용자 수
        const usersWithBlockchainActivity = await User.countDocuments({
          ...segment.filter,
          authProvider: { $ne: null },
          _id: { $in: await Activity.distinct('user', { category: 'blockchain' }) }
        });
        
        // 전환률 계산
        const walletConversionRate = totalUsers > 0 ? 
          (usersWithWallet / totalUsers) * 100 : 0;
          
        const activityConversionRate = usersWithWallet > 0 ? 
          (usersWithBlockchainActivity / usersWithWallet) * 100 : 0;
          
        const totalConversionRate = totalUsers > 0 ? 
          (usersWithBlockchainActivity / totalUsers) * 100 : 0;
        
        segmentResults.push({
          segment: segment.name,
          totalUsers,
          usersWithWallet,
          usersWithBlockchainActivity,
          walletConversionRate: walletConversionRate.toFixed(2),
          activityConversionRate: activityConversionRate.toFixed(2),
          totalConversionRate: totalConversionRate.toFixed(2)
        });
      }
      
      return {
        segments: segmentResults,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('세그먼트 전환률 분석 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 전환 경로 및 퍼널 분석
   * @param {Object} options - 분석 옵션
   * @returns {Promise<Object>} 퍼널 분석 결과
   */
  async analyzeConversionFunnel(options = {}) {
    try {
      const { startDate, endDate } = options;
      
      // 날짜 범위 설정
      const dateRange = {};
      if (startDate) dateRange.createdAt = { $gte: startDate };
      if (endDate) dateRange.createdAt = { ...dateRange.createdAt, $lte: endDate };
      
      // 퍼널 단계 정의
      const funnelStages = [
        { name: '회원가입', count: await User.countDocuments({ ...dateRange, authProvider: { $ne: null } }) },
        { name: '프로필 완성', count: await User.countDocuments({ ...dateRange, authProvider: { $ne: null }, profileCompleted: true }) },
        { name: '지갑 생성', count: await Wallet.countDocuments({ ...dateRange }) },
        { name: '첫 토큰 수령', count: await Activity.countDocuments({ ...dateRange, type: 'token_received', category: 'blockchain' }) },
        { name: '첫 NFT 획득', count: await Activity.countDocuments({ ...dateRange, type: 'nft_received', category: 'blockchain' }) },
        { name: '첫 미션 참여', count: await Activity.countDocuments({ ...dateRange, type: 'mission_participation' }) },
        { name: '지속적 활동', count: await User.countDocuments({ ...dateRange, authProvider: { $ne: null }, activityCount: { $gt: 5 } }) }
      ];
      
      // 단계별 전환률 계산
      const funnelWithRates = funnelStages.map((stage, index) => {
        if (index === 0) {
          return {
            ...stage,
            conversionRate: 100,
            dropoffRate: 0
          };
        }
        
        const prevStage = funnelStages[index - 1];
        const conversionRate = prevStage.count > 0 ? (stage.count / prevStage.count) * 100 : 0;
        const dropoffRate = 100 - conversionRate;
        
        return {
          ...stage,
          conversionRate: conversionRate.toFixed(2),
          dropoffRate: dropoffRate.toFixed(2)
        };
      });
      
      // 전체 전환률 (마지막 단계 / 첫 단계)
      const overallConversionRate = funnelStages[0].count > 0 ? 
        (funnelStages[funnelStages.length - 1].count / funnelStages[0].count) * 100 : 0;
      
      // 유입 경로별 분석
      const conversionBySource = await User.aggregate([
        { 
          $match: { 
            ...dateRange,
            authProvider: { $ne: null }
          } 
        },
        {
          $lookup: {
            from: 'wallets',
            localField: '_id',
            foreignField: 'user',
            as: 'wallet'
          }
        },
        {
          $project: {
            authProvider: 1,
            hasWallet: { $cond: [{ $gt: [{ $size: '$wallet' }, 0] }, true, false] }
          }
        },
        {
          $group: {
            _id: '$authProvider',
            totalUsers: { $sum: 1 },
            usersWithWallet: { $sum: { $cond: ['$hasWallet', 1, 0] } }
          }
        },
        {
          $project: {
            source: '$_id',
            totalUsers: 1,
            usersWithWallet: 1,
            conversionRate: { 
              $multiply: [
                { $divide: ['$usersWithWallet', '$totalUsers'] },
                100
              ]
            }
          }
        },
        { $sort: { conversionRate: -1 } }
      ]);
      
      return {
        funnel: funnelWithRates,
        overallConversionRate: overallConversionRate.toFixed(2),
        conversionBySource,
        period: {
          startDate: startDate || 'All time',
          endDate: endDate || new Date()
        }
      };
    } catch (error) {
      logger.error('전환 퍼널 분석 중 오류 발생:', error);
      throw error;
    }
  }
}

module.exports = new UserConversionAnalytics();
