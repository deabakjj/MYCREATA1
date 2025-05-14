import api, { getErrorMessage } from './api';

/**
 * 보상 관리 서비스
 * 관리자 패널에서 보상 관리 기능에 대한 API 호출 모듈
 */
const rewardService = {
  /**
   * 보상 지급 내역 조회
   * @param {Object} params - 필터링, 정렬, 페이징 옵션
   * @returns {Promise<Object>} 보상 지급 내역 및 페이징 정보
   */
  getRewards: async (params = {}) => {
    try {
      const response = await api.get('/admin/rewards', { params });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 수동 보상 지급
   * @param {Object} rewardData - 보상 지급 정보 (사용자, 유형, 금액, 사유 등)
   * @returns {Promise<Object>} 보상 지급 결과
   */
  issueReward: async (rewardData) => {
    try {
      const response = await api.post('/admin/rewards', rewardData);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 보상 거래 취소/롤백
   * @param {string|number} id - 보상 거래 ID
   * @param {Object} reason - 취소 사유
   * @returns {Promise<Object>} 취소 결과
   */
  cancelReward: async (id, reason) => {
    try {
      const response = await api.post(`/admin/rewards/${id}/cancel`, { reason });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 보상 거래 세부 정보 조회
   * @param {string|number} id - 보상 거래 ID
   * @returns {Promise<Object>} 보상 거래 세부 정보
   */
  getRewardDetail: async (id) => {
    try {
      const response = await api.get(`/admin/rewards/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 보상 거래 블록체인 상태 확인
   * @param {string|number} id - 보상 거래 ID
   * @returns {Promise<Object>} 블록체인 상태 정보
   */
  checkBlockchainStatus: async (id) => {
    try {
      const response = await api.get(`/admin/rewards/${id}/blockchain-status`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 실패한 보상 거래 재시도
   * @param {string|number} id - 보상 거래 ID
   * @returns {Promise<Object>} 재시도 결과
   */
  retryFailedReward: async (id) => {
    try {
      const response = await api.post(`/admin/rewards/${id}/retry`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 일괄 보상 지급 (CSV 업로드)
   * @param {File} file - 보상 지급 정보가 포함된 CSV 파일
   * @returns {Promise<Object>} 일괄 처리 결과
   */
  batchIssueRewards: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/admin/rewards/batch', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * NFT 보상 상세 정보 조회
   * @param {string|number} id - NFT ID
   * @returns {Promise<Object>} NFT 보상 상세 정보
   */
  getNftRewardDetail: async (id) => {
    try {
      const response = await api.get(`/admin/rewards/nft/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * NFT 보상 메타데이터 업데이트
   * @param {string|number} id - NFT ID
   * @param {Object} metadata - 업데이트할 메타데이터
   * @returns {Promise<Object>} 업데이트 결과
   */
  updateNftMetadata: async (id, metadata) => {
    try {
      const response = await api.put(`/admin/rewards/nft/${id}/metadata`, metadata);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 보상 통계 요약 조회
   * @param {Object} params - 필터링 옵션 (기간 등)
   * @returns {Promise<Object>} 보상 요약 통계
   */
  getRewardStats: async (params = {}) => {
    try {
      const response = await api.get('/admin/rewards/stats', { params });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 보상 거래 로그 내보내기 (CSV/Excel)
   * @param {Object} params - 내보내기 옵션 (포맷, 필터 등)
   * @returns {Promise<Blob>} 내보내기 파일 데이터
   */
  exportRewardLogs: async (params = {}) => {
    try {
      const response = await api.get('/admin/rewards/export', {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 토큰 에어드롭 실행
   * @param {Object} airdropData - 에어드롭 정보 (대상, 금액, 사유 등)
   * @returns {Promise<Object>} 에어드롭 실행 결과
   */
  executeAirdrop: async (airdropData) => {
    try {
      const response = await api.post('/admin/rewards/airdrop', airdropData);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 사용자별 보상 내역 조회
   * @param {string|number} userId - 사용자 ID
   * @param {Object} params - 필터링, 정렬, 페이징 옵션
   * @returns {Promise<Object>} 사용자별 보상 내역
   */
  getUserRewards: async (userId, params = {}) => {
    try {
      const response = await api.get(`/admin/rewards/user/${userId}`, { params });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }
};

export default rewardService;
