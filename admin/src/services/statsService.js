import api, { getErrorMessage } from './api';

/**
 * 통계 서비스
 * 관리자 패널의 데이터 대시보드 및 통계 리포트 기능에 대한 API 호출 모듈
 */
const statsService = {
  /**
   * 대시보드 요약 통계 조회
   * @returns {Promise<Object>} 대시보드 요약 통계
   */
  getDashboardStats: async () => {
    try {
      const response = await api.get('/admin/stats/dashboard');
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 사용자 활동 통계 조회
   * @param {Object} params - 필터링 옵션 (기간 등)
   * @returns {Promise<Object>} 사용자 활동 통계
   */
  getUserActivityStats: async (params = {}) => {
    try {
      const response = await api.get('/admin/stats/user-activity', { params });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 미션 참여 통계 조회
   * @param {Object} params - 필터링 옵션 (기간, 미션 유형 등)
   * @returns {Promise<Object>} 미션 참여 통계
   */
  getMissionStats: async (params = {}) => {
    try {
      const response = await api.get('/admin/stats/missions', { params });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 토큰 경제 통계 조회
   * @param {Object} params - 필터링 옵션 (기간 등)
   * @returns {Promise<Object>} 토큰 경제 통계
   */
  getTokenEconomyStats: async (params = {}) => {
    try {
      const response = await api.get('/admin/stats/token-economy', { params });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * NFT 발행 통계 조회
   * @param {Object} params - 필터링 옵션 (기간, NFT 유형 등)
   * @returns {Promise<Object>} NFT 발행 통계
   */
  getNftStats: async (params = {}) => {
    try {
      const response = await api.get('/admin/stats/nfts', { params });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 사용자 증가율 통계 조회
   * @param {Object} params - 필터링 옵션 (기간, 집계 단위 등)
   * @returns {Promise<Object>} 사용자 증가율 통계
   */
  getUserGrowthStats: async (params = {}) => {
    try {
      const response = await api.get('/admin/stats/user-growth', { params });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 사용자 유지율 통계 조회
   * @param {Object} params - 필터링 옵션 (기간, 코호트 등)
   * @returns {Promise<Object>} 사용자 유지율 통계
   */
  getUserRetentionStats: async (params = {}) => {
    try {
      const response = await api.get('/admin/stats/user-retention', { params });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * XP 분포 통계 조회
   * @returns {Promise<Object>} XP 분포 통계
   */
  getXpDistributionStats: async () => {
    try {
      const response = await api.get('/admin/stats/xp-distribution');
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 일별/주별/월별 활동 추이 조회
   * @param {string} period - 기간 유형 ('daily', 'weekly', 'monthly')
   * @param {Object} params - 필터링 옵션 (시작일, 종료일 등)
   * @returns {Promise<Object>} 기간별 활동 추이
   */
  getActivityTrend: async (period, params = {}) => {
    try {
      const response = await api.get(`/admin/stats/activity-trend/${period}`, { params });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 실시간 활동 로그 스트림 조회
   * @param {Object} params - 필터링 옵션
   * @returns {Promise<Object>} 실시간 활동 로그
   */
  getLiveActivityStream: async (params = {}) => {
    try {
      const response = await api.get('/admin/stats/live-activity', { params });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 커스텀 통계 쿼리 실행
   * @param {Object} queryParams - 커스텀 쿼리 파라미터
   * @returns {Promise<Object>} 쿼리 결과
   */
  executeCustomQuery: async (queryParams) => {
    try {
      const response = await api.post('/admin/stats/custom-query', queryParams);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 통계 데이터 내보내기 (CSV/Excel)
   * @param {string} reportType - 보고서 유형
   * @param {Object} params - 내보내기 옵션 (포맷, 필터 등)
   * @returns {Promise<Blob>} 내보내기 파일 데이터
   */
  exportStats: async (reportType, params = {}) => {
    try {
      const response = await api.get(`/admin/stats/export/${reportType}`, {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }
};

export default statsService;
