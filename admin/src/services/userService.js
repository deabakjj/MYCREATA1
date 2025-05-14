import api, { getErrorMessage } from './api';

/**
 * 사용자 관리 서비스
 * 관리자 패널에서 사용자 관리 기능에 대한 API 호출 모듈
 */
const userService = {
  /**
   * 사용자 목록 조회
   * @param {Object} params - 필터링, 정렬, 페이징 옵션
   * @returns {Promise<Object>} 사용자 목록 및 페이징 정보
   */
  getUsers: async (params = {}) => {
    try {
      const response = await api.get('/admin/users', { params });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 단일 사용자 상세 조회
   * @param {string|number} id - 사용자 ID
   * @returns {Promise<Object>} 사용자 상세 정보
   */
  getUser: async (id) => {
    try {
      const response = await api.get(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 사용자 정보 수정
   * @param {string|number} id - 사용자 ID
   * @param {Object} userData - 수정할 사용자 데이터
   * @returns {Promise<Object>} 수정된 사용자 정보
   */
  updateUser: async (id, userData) => {
    try {
      const response = await api.put(`/admin/users/${id}`, userData);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 사용자 계정 비활성화/활성화
   * @param {string|number} id - 사용자 ID
   * @param {boolean} isActive - 활성화 여부
   * @returns {Promise<Object>} 처리 결과
   */
  toggleUserStatus: async (id, isActive) => {
    try {
      const response = await api.patch(`/admin/users/${id}/status`, { isActive });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 사용자 지갑 정보 조회
   * @param {string|number} id - 사용자 ID
   * @returns {Promise<Object>} 사용자 지갑 정보
   */
  getUserWallet: async (id) => {
    try {
      const response = await api.get(`/admin/users/${id}/wallet`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 사용자 활동 로그 조회
   * @param {string|number} id - 사용자 ID
   * @param {Object} params - 필터링, 정렬, 페이징 옵션
   * @returns {Promise<Object>} 사용자 활동 로그
   */
  getUserActivities: async (id, params = {}) => {
    try {
      const response = await api.get(`/admin/users/${id}/activities`, { params });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 사용자 보유 NFT 목록 조회
   * @param {string|number} id - 사용자 ID
   * @param {Object} params - 필터링, 정렬, 페이징 옵션
   * @returns {Promise<Object>} 사용자 NFT 목록
   */
  getUserNfts: async (id, params = {}) => {
    try {
      const response = await api.get(`/admin/users/${id}/nfts`, { params });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 사용자에게 토큰 수동 지급
   * @param {string|number} id - 사용자 ID
   * @param {Object} tokenData - 토큰 지급 정보 (금액, 사유 등)
   * @returns {Promise<Object>} 토큰 지급 결과
   */
  issueTokens: async (id, tokenData) => {
    try {
      const response = await api.post(`/admin/users/${id}/tokens`, tokenData);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 사용자에게 XP 수동 지급/차감
   * @param {string|number} id - 사용자 ID
   * @param {Object} xpData - XP 지급 정보 (금액, 사유 등)
   * @returns {Promise<Object>} XP 지급 결과
   */
  adjustXp: async (id, xpData) => {
    try {
      const response = await api.post(`/admin/users/${id}/xp`, xpData);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 사용자 Nest ID (.nest 도메인) 관리
   * @param {string|number} id - 사용자 ID
   * @param {Object} nestIdData - Nest ID 정보
   * @returns {Promise<Object>} 처리 결과
   */
  manageNestId: async (id, nestIdData) => {
    try {
      const response = await api.post(`/admin/users/${id}/nest-id`, nestIdData);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 사용자 토큰 거래 내역 조회
   * @param {string|number} id - 사용자 ID
   * @param {Object} params - 필터링, 정렬, 페이징 옵션
   * @returns {Promise<Object>} 토큰 거래 내역
   */
  getUserTransactions: async (id, params = {}) => {
    try {
      const response = await api.get(`/admin/users/${id}/transactions`, { params });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 사용자 통계 요약 조회
   * @returns {Promise<Object>} 사용자 요약 통계 (총 사용자 수, 활성 사용자 수 등)
   */
  getUserStats: async () => {
    try {
      const response = await api.get('/admin/users/stats');
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 사용자 데이터 내보내기 (CSV/Excel)
   * @param {Object} params - 내보내기 옵션 (포맷, 필터 등)
   * @returns {Promise<Blob>} 내보내기 파일 데이터
   */
  exportUsers: async (params = {}) => {
    try {
      const response = await api.get('/admin/users/export', {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }
};

export default userService;
