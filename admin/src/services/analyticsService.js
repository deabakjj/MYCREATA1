/**
 * 분석 API 서비스
 * 
 * 관리자 패널에서 분석 API를 호출하기 위한 서비스
 */

import axios from 'axios';
import { handleError } from './api';

/**
 * 날짜 범위 쿼리 매개변수 생성
 * @param {Object} options - 날짜 범위 옵션
 * @returns {string} 쿼리 문자열
 */
const buildDateRangeParams = (options = {}) => {
  const params = new URLSearchParams();
  
  if (options.startDate) {
    params.append('startDate', options.startDate.toISOString());
  }
  
  if (options.endDate) {
    params.append('endDate', options.endDate.toISOString());
  }
  
  return params.toString();
};

/**
 * 분석 서비스 클래스
 */
class AnalyticsService {
  /**
   * 사용자 전환률 지표 조회
   * @param {Object} options - 조회 옵션
   * @param {Date} options.startDate - 시작 날짜
   * @param {Date} options.endDate - 종료 날짜
   * @returns {Promise<Object>} 사용자 전환률 지표
   */
  async getUserConversion(options = {}) {
    try {
      const params = buildDateRangeParams(options);
      const response = await axios.get(`/api/analytics/user-conversion?${params}`);
      return response.data.data;
    } catch (error) {
      return handleError(error, '사용자 전환률 지표 조회 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 사용자 전환률 추세 조회
   * @param {Object} options - 조회 옵션
   * @param {string} options.intervalType - 간격 유형 ('day', 'week', 'month')
   * @param {number} options.periods - 기간 수
   * @returns {Promise<Object>} 사용자 전환률 추세
   */
  async getUserConversionTrends(options = {}) {
    try {
      const params = new URLSearchParams();
      
      if (options.intervalType) {
        params.append('intervalType', options.intervalType);
      }
      
      if (options.periods) {
        params.append('periods', options.periods);
      }
      
      const response = await axios.get(`/api/analytics/user-conversion/trends?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      return handleError(error, '사용자 전환률 추세 조회 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 사용자 세그먼트별 전환률 조회
   * @param {Object} options - 조회 옵션
   * @param {Date} options.startDate - 시작 날짜
   * @param {Date} options.endDate - 종료 날짜
   * @returns {Promise<Object>} 사용자 세그먼트별 전환률
   */
  async getUserConversionBySegment(options = {}) {
    try {
      const params = buildDateRangeParams(options);
      const response = await axios.get(`/api/analytics/user-conversion/segments?${params}`);
      return response.data.data;
    } catch (error) {
      return handleError(error, '사용자 세그먼트별 전환률 조회 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 전환 퍼널 분석 조회
   * @param {Object} options - 조회 옵션
   * @param {Date} options.startDate - 시작 날짜
   * @param {Date} options.endDate - 종료 날짜
   * @returns {Promise<Object>} 전환 퍼널 분석
   */
  async getConversionFunnel(options = {}) {
    try {
      const params = buildDateRangeParams(options);
      const response = await axios.get(`/api/analytics/user-conversion/funnel?${params}`);
      return response.data.data;
    } catch (error) {
      return handleError(error, '전환 퍼널 분석 조회 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 지갑 유지율 지표 조회
   * @param {Object} options - 조회 옵션
   * @param {Date} options.startDate - 시작 날짜
   * @param {Date} options.endDate - 종료 날짜
   * @param {number} options.retentionDays - 유지 기간(일)
   * @returns {Promise<Object>} 지갑 유지율 지표
   */
  async getWalletRetention(options = {}) {
    try {
      const params = new URLSearchParams(buildDateRangeParams(options));
      
      if (options.retentionDays) {
        params.append('retentionDays', options.retentionDays);
      }
      
      const response = await axios.get(`/api/analytics/wallet-retention?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      return handleError(error, '지갑 유지율 지표 조회 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 보상 유형별 지갑 유지율 조회
   * @param {Object} options - 조회 옵션
   * @param {Date} options.startDate - 시작 날짜
   * @param {Date} options.endDate - 종료 날짜
   * @returns {Promise<Object>} 보상 유형별 지갑 유지율
   */
  async getWalletRetentionByRewardType(options = {}) {
    try {
      const params = buildDateRangeParams(options);
      const response = await axios.get(`/api/analytics/wallet-retention/reward-type?${params}`);
      return response.data.data;
    } catch (error) {
      return handleError(error, '보상 유형별 지갑 유지율 조회 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 활동 패턴별 지갑 유지율 조회
   * @param {Object} options - 조회 옵션
   * @param {Date} options.startDate - 시작 날짜
   * @param {Date} options.endDate - 종료 날짜
   * @returns {Promise<Object>} 활동 패턴별 지갑 유지율
   */
  async getWalletRetentionByActivityPattern(options = {}) {
    try {
      const params = buildDateRangeParams(options);
      const response = await axios.get(`/api/analytics/wallet-retention/activity-pattern?${params}`);
      return response.data.data;
    } catch (error) {
      return handleError(error, '활동 패턴별 지갑 유지율 조회 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 토큰 교환 지표 조회
   * @param {Object} options - 조회 옵션
   * @param {Date} options.startDate - 시작 날짜
   * @param {Date} options.endDate - 종료 날짜
   * @param {string} options.direction - 교환 방향 ('cta_to_nest', 'nest_to_cta', 'both')
   * @returns {Promise<Object>} 토큰 교환 지표
   */
  async getTokenExchange(options = {}) {
    try {
      const params = new URLSearchParams(buildDateRangeParams(options));
      
      if (options.direction) {
        params.append('direction', options.direction);
      }
      
      const response = await axios.get(`/api/analytics/token-exchange?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      return handleError(error, '토큰 교환 지표 조회 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 사용자 세그먼트별 토큰 교환 패턴 조회
   * @param {Object} options - 조회 옵션
   * @param {Date} options.startDate - 시작 날짜
   * @param {Date} options.endDate - 종료 날짜
   * @returns {Promise<Object>} 사용자 세그먼트별 토큰 교환 패턴
   */
  async getTokenExchangeByUserSegment(options = {}) {
    try {
      const params = buildDateRangeParams(options);
      const response = await axios.get(`/api/analytics/token-exchange/user-segment?${params}`);
      return response.data.data;
    } catch (error) {
      return handleError(error, '사용자 세그먼트별 토큰 교환 패턴 조회 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 토큰 교환 금액 분포 조회
   * @param {Object} options - 조회 옵션
   * @param {Date} options.startDate - 시작 날짜
   * @param {Date} options.endDate - 종료 날짜
   * @returns {Promise<Object>} 토큰 교환 금액 분포
   */
  async getTokenExchangeAmountDistribution(options = {}) {
    try {
      const params = buildDateRangeParams(options);
      const response = await axios.get(`/api/analytics/token-exchange/amount-distribution?${params}`);
      return response.data.data;
    } catch (error) {
      return handleError(error, '토큰 교환 금액 분포 조회 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 교환 이후 행동 패턴 조회
   * @param {Object} options - 조회 옵션
   * @param {Date} options.startDate - 시작 날짜
   * @param {Date} options.endDate - 종료 날짜
   * @param {number} options.daysAfter - 관찰 기간(일)
   * @returns {Promise<Object>} 교환 이후 행동 패턴
   */
  async getPostExchangeBehavior(options = {}) {
    try {
      const params = new URLSearchParams(buildDateRangeParams(options));
      
      if (options.daysAfter) {
        params.append('daysAfter', options.daysAfter);
      }
      
      const response = await axios.get(`/api/analytics/token-exchange/post-behavior?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      return handleError(error, '교환 이후 행동 패턴 조회 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * XP 누적 지표 조회
   * @param {Object} options - 조회 옵션
   * @param {Date} options.startDate - 시작 날짜
   * @param {Date} options.endDate - 종료 날짜
   * @returns {Promise<Object>} XP 누적 지표
   */
  async getXpAccumulation(options = {}) {
    try {
      const params = buildDateRangeParams(options);
      const response = await axios.get(`/api/analytics/xp-accumulation?${params}`);
      return response.data.data;
    } catch (error) {
      return handleError(error, 'XP 누적 지표 조회 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 사용자 세그먼트별 XP 누적 패턴 조회
   * @param {Object} options - 조회 옵션
   * @param {Date} options.startDate - 시작 날짜
   * @param {Date} options.endDate - 종료 날짜
   * @returns {Promise<Object>} 사용자 세그먼트별 XP 누적 패턴
   */
  async getXpAccumulationByUserSegment(options = {}) {
    try {
      const params = buildDateRangeParams(options);
      const response = await axios.get(`/api/analytics/xp-accumulation/user-segment?${params}`);
      return response.data.data;
    } catch (error) {
      return handleError(error, '사용자 세그먼트별 XP 누적 패턴 조회 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 레벨 진행 속도 조회
   * @param {Object} options - 조회 옵션
   * @param {Date} options.startDate - 시작 날짜
   * @param {Date} options.endDate - 종료 날짜
   * @returns {Promise<Object>} 레벨 진행 속도
   */
  async getLevelProgression(options = {}) {
    try {
      const params = buildDateRangeParams(options);
      const response = await axios.get(`/api/analytics/xp-accumulation/level-progression?${params}`);
      return response.data.data;
    } catch (error) {
      return handleError(error, '레벨 진행 속도 조회 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 활동 유형별 XP 효율성 조회
   * @param {Object} options - 조회 옵션
   * @param {Date} options.startDate - 시작 날짜
   * @param {Date} options.endDate - 종료 날짜
   * @returns {Promise<Object>} 활동 유형별 XP 효율성
   */
  async getActivityEfficiency(options = {}) {
    try {
      const params = buildDateRangeParams(options);
      const response = await axios.get(`/api/analytics/xp-accumulation/activity-efficiency?${params}`);
      return response.data.data;
    } catch (error) {
      return handleError(error, '활동 유형별 XP 효율성 조회 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * NFT 보유 지표 조회
   * @param {Object} options - 조회 옵션
   * @param {Date} options.startDate - 시작 날짜
   * @param {Date} options.endDate - 종료 날짜
   * @returns {Promise<Object>} NFT 보유 지표
   */
  async getNftOwnership(options = {}) {
    try {
      const params = buildDateRangeParams(options);
      const response = await axios.get(`/api/analytics/nft-ownership?${params}`);
      return response.data.data;
    } catch (error) {
      return handleError(error, 'NFT 보유 지표 조회 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 사용자 세그먼트별 NFT 보유 패턴 조회
   * @param {Object} options - 조회 옵션
   * @param {Date} options.startDate - 시작 날짜
   * @param {Date} options.endDate - 종료 날짜
   * @returns {Promise<Object>} 사용자 세그먼트별 NFT 보유 패턴
   */
  async getNftOwnershipByUserSegment(options = {}) {
    try {
      const params = buildDateRangeParams(options);
      const response = await axios.get(`/api/analytics/nft-ownership/user-segment?${params}`);
      return response.data.data;
    } catch (error) {
      return handleError(error, '사용자 세그먼트별 NFT 보유 패턴 조회 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * NFT 보유와 사용자 참여도 상관관계 조회
   * @param {Object} options - 조회 옵션
   * @param {Date} options.startDate - 시작 날짜
   * @param {Date} options.endDate - 종료 날짜
   * @returns {Promise<Object>} NFT 보유와 사용자 참여도 상관관계
   */
  async getNftEngagementCorrelation(options = {}) {
    try {
      const params = buildDateRangeParams(options);
      const response = await axios.get(`/api/analytics/nft-ownership/engagement-correlation?${params}`);
      return response.data.data;
    } catch (error) {
      return handleError(error, 'NFT 보유와 사용자 참여도 상관관계 조회 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 종합 분석 대시보드 데이터 조회
   * @param {Object} options - 조회 옵션
   * @param {Date} options.startDate - 시작 날짜
   * @param {Date} options.endDate - 종료 날짜
   * @returns {Promise<Object>} 종합 분석 대시보드 데이터
   */
  async getDashboardOverview(options = {}) {
    try {
      const params = buildDateRangeParams(options);
      const response = await axios.get(`/api/analytics/dashboard?${params}`);
      return response.data.data;
    } catch (error) {
      return handleError(error, '종합 분석 대시보드 데이터 조회 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 데이터 내보내기 (CSV)
   * @param {string} endpoint - API 엔드포인트
   * @param {Object} options - 조회 옵션
   * @returns {Promise<Blob>} CSV 데이터
   */
  async exportCsv(endpoint, options = {}) {
    try {
      const params = new URLSearchParams(buildDateRangeParams(options));
      params.append('format', 'csv');
      
      const response = await axios.get(`/api/analytics/${endpoint}/export?${params.toString()}`, {
        responseType: 'blob'
      });
      
      return response.data;
    } catch (error) {
      return handleError(error, '데이터 내보내기 중 오류가 발생했습니다.');
    }
  }
}

// 분석 서비스 인스턴스 생성
const analyticsService = new AnalyticsService();

export default analyticsService;
