/**
 * missionService.js
 * 미션 관련 API 요청을 처리하는 서비스
 */

import api from './api';

/**
 * 미션 목록 조회
 * @param {Object} filter - 필터 조건
 * @param {Object} options - 페이징, 정렬 등 옵션
 * @returns {Promise<Object>} 미션 목록
 */
export const getMissions = async (filter = {}, options = {}) => {
  const response = await api.get('/missions', {
    params: {
      ...filter,
      ...options
    }
  });
  return response.data;
};

/**
 * 특정 미션 상세 정보 조회
 * @param {string} missionId - 미션 ID
 * @returns {Promise<Object>} 미션 정보
 */
export const getMissionById = async (missionId) => {
  const response = await api.get(`/missions/${missionId}`);
  return response.data;
};

/**
 * 사용자가 참여 중인 미션 목록 조회
 * @param {Object} options - 페이징 등 옵션
 * @returns {Promise<Object>} 미션 목록
 */
export const getUserInProgressMissions = async (options = {}) => {
  const response = await api.get('/missions/user/in-progress', {
    params: options
  });
  return response.data;
};

/**
 * 사용자가 완료한 미션 목록 조회
 * @param {Object} options - 페이징 등 옵션
 * @returns {Promise<Object>} 미션 목록
 */
export const getUserCompletedMissions = async (options = {}) => {
  const response = await api.get('/missions/user/completed', {
    params: options
  });
  return response.data;
};

/**
 * 미션 참여
 * @param {string} missionId - 참여할 미션 ID
 * @returns {Promise<Object>} 참여 결과
 */
export const participateMission = async (missionId) => {
  const response = await api.post(`/missions/${missionId}/participate`);
  return response.data;
};

/**
 * 미션 완료 제출
 * @param {string} missionId - 완료할 미션 ID
 * @param {Object} submissionData - 제출 데이터
 * @returns {Promise<Object>} 제출 결과
 */
export const submitMissionCompletion = async (missionId, submissionData) => {
  const response = await api.post(`/missions/${missionId}/complete`, submissionData);
  return response.data;
};

/**
 * 미션 참여 취소
 * @param {string} missionId - 취소할 미션 ID
 * @returns {Promise<Object>} 취소 결과
 */
export const cancelMissionParticipation = async (missionId) => {
  const response = await api.post(`/missions/${missionId}/cancel`);
  return response.data;
};

/**
 * AI 미션 제안 요청
 * @param {Object} preferences - 사용자 선호도
 * @returns {Promise<Object>} 제안 목록
 */
export const suggestMission = async (preferences = {}) => {
  const response = await api.post('/missions/suggest', preferences);
  return response.data;
};

/**
 * 일일 출석 체크 미션 완료
 * @returns {Promise<Object>} 완료 결과
 */
export const completeCheckInMission = async () => {
  const response = await api.post('/missions/check-in');
  return response.data;
};

/**
 * 미션 참여자 목록 조회
 * @param {string} missionId - 미션 ID
 * @param {Object} options - 페이징 등 옵션
 * @returns {Promise<Object>} 참여자 목록
 */
export const getMissionParticipants = async (missionId, options = {}) => {
  const response = await api.get(`/missions/${missionId}/participants`, {
    params: options
  });
  return response.data;
};

/**
 * 미션 생성 (관리자용)
 * @param {Object} missionData - 미션 데이터
 * @returns {Promise<Object>} 생성된 미션
 */
export const createMission = async (missionData) => {
  const response = await api.post('/missions', missionData);
  return response.data;
};

/**
 * 미션 업데이트 (관리자용)
 * @param {string} missionId - 미션 ID
 * @param {Object} updateData - 업데이트 데이터
 * @returns {Promise<Object>} 업데이트된 미션
 */
export const updateMission = async (missionId, updateData) => {
  const response = await api.put(`/missions/${missionId}`, updateData);
  return response.data;
};

/**
 * 미션 삭제 (관리자용)
 * @param {string} missionId - 미션 ID
 * @returns {Promise<Object>} 삭제 결과
 */
export const deleteMission = async (missionId) => {
  const response = await api.delete(`/missions/${missionId}`);
  return response.data;
};

/**
 * 미션 카테고리 목록 조회
 * @returns {Promise<Object>} 카테고리 목록
 */
export const getMissionCategories = async () => {
  const response = await api.get('/missions/categories');
  return response.data;
};

/**
 * 특정 카테고리의 미션 목록 조회
 * @param {string} categoryId - 카테고리 ID
 * @param {Object} options - 페이징 등 옵션
 * @returns {Promise<Object>} 미션 목록
 */
export const getMissionsByCategory = async (categoryId, options = {}) => {
  const response = await api.get(`/missions/category/${categoryId}`, {
    params: options
  });
  return response.data;
};

/**
 * 인기 미션 목록 조회
 * @param {Object} options - 페이징 등 옵션
 * @returns {Promise<Object>} 미션 목록
 */
export const getPopularMissions = async (options = {}) => {
  const response = await api.get('/missions/popular', {
    params: options
  });
  return response.data;
};

/**
 * 마감 임박 미션 목록 조회
 * @param {Object} options - 페이징 등 옵션
 * @returns {Promise<Object>} 미션 목록
 */
export const getEndingSoonMissions = async (options = {}) => {
  const response = await api.get('/missions/ending-soon', {
    params: options
  });
  return response.data;
};

export default {
  getMissions,
  getMissionById,
  getUserInProgressMissions,
  getUserCompletedMissions,
  participateMission,
  submitMissionCompletion,
  cancelMissionParticipation,
  suggestMission,
  completeCheckInMission,
  getMissionParticipants,
  createMission,
  updateMission,
  deleteMission,
  getMissionCategories,
  getMissionsByCategory,
  getPopularMissions,
  getEndingSoonMissions
};
