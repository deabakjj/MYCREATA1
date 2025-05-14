import api, { fileApi, getErrorMessage } from './api';

/**
 * 미션 관리 서비스
 * 미션 CRUD 및 관련 기능에 대한 API 호출 모듈
 */
const missionService = {
  /**
   * 모든 미션 목록 조회
   * @param {Object} params - 필터링, 정렬, 페이징 옵션
   * @returns {Promise<Object>} 미션 목록 및 페이징 정보
   */
  getMissions: async (params = {}) => {
    try {
      const response = await api.get('/admin/missions', { params });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 단일 미션 상세 조회
   * @param {string|number} id - 미션 ID
   * @returns {Promise<Object>} 미션 상세 정보
   */
  getMission: async (id) => {
    try {
      const response = await api.get(`/admin/missions/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 새 미션 생성
   * @param {Object} missionData - 생성할 미션 데이터
   * @returns {Promise<Object>} 생성된 미션 정보
   */
  createMission: async (missionData) => {
    try {
      const response = await api.post('/admin/missions', missionData);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 미션 정보 수정
   * @param {string|number} id - 미션 ID
   * @param {Object} missionData - 수정할 미션 데이터
   * @returns {Promise<Object>} 수정된 미션 정보
   */
  updateMission: async (id, missionData) => {
    try {
      const response = await api.put(`/admin/missions/${id}`, missionData);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 미션 삭제
   * @param {string|number} id - 미션 ID
   * @returns {Promise<Object>} 삭제 결과
   */
  deleteMission: async (id) => {
    try {
      const response = await api.delete(`/admin/missions/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 미션 상태 변경 (활성/비활성/완료 등)
   * @param {string|number} id - 미션 ID
   * @param {string} status - 변경할 상태
   * @returns {Promise<Object>} 변경 결과
   */
  updateMissionStatus: async (id, status) => {
    try {
      const response = await api.patch(`/admin/missions/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 미션 NFT 이미지 업로드
   * @param {File} file - 업로드할 이미지 파일
   * @returns {Promise<Object>} 업로드 결과 (URL 등)
   */
  uploadNftImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fileApi.post('/admin/missions/upload-nft-image', formData);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 미션 참여 통계 조회
   * @param {string|number} id - 미션 ID
   * @param {Object} params - 필터링, 정렬, 페이징 옵션
   * @returns {Promise<Object>} 미션 참여 통계
   */
  getMissionParticipation: async (id, params = {}) => {
    try {
      const response = await api.get(`/admin/missions/${id}/participation`, { params });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 미션 결과물 조회 (사용자 제출 내용)
   * @param {string|number} missionId - 미션 ID
   * @param {string|number} userId - 사용자 ID
   * @returns {Promise<Object>} 사용자 미션 결과물
   */
  getMissionSubmission: async (missionId, userId) => {
    try {
      const response = await api.get(`/admin/missions/${missionId}/submissions/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 미션 수동 보상 지급
   * @param {string|number} missionId - 미션 ID
   * @param {string|number} userId - 사용자 ID
   * @param {Object} rewardData - 보상 정보 (XP, 토큰, NFT 등)
   * @returns {Promise<Object>} 보상 지급 결과
   */
  issueReward: async (missionId, userId, rewardData) => {
    try {
      const response = await api.post(`/admin/missions/${missionId}/rewards/${userId}`, rewardData);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 미션 복제
   * @param {string|number} id - 복제할 미션 ID
   * @returns {Promise<Object>} 복제된 미션 정보
   */
  duplicateMission: async (id) => {
    try {
      const response = await api.post(`/admin/missions/${id}/duplicate`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 미션 통계 요약 조회
   * @returns {Promise<Object>} 미션 요약 통계 (총 미션 수, 활성 미션 수 등)
   */
  getMissionStats: async () => {
    try {
      const response = await api.get('/admin/missions/stats');
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 미션 카테고리 목록 조회
   * @returns {Promise<Array>} 카테고리 목록
   */
  getMissionCategories: async () => {
    try {
      const response = await api.get('/admin/missions/categories');
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 미션 내보내기 (CSV/Excel)
   * @param {Object} params - 내보내기 옵션 (포맷, 필터 등)
   * @returns {Promise<Blob>} 내보내기 파일 데이터
   */
  exportMissions: async (params = {}) => {
    try {
      const response = await api.get('/admin/missions/export', {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }
};

export default missionService;
