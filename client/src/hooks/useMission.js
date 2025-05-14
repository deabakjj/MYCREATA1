/**
 * useMission.js
 * 미션 관련 커스텀 훅
 */

import { useState, useCallback } from 'react';
import api from '../services/api';

/**
 * 미션 관련 기능을 제공하는 훅
 * 미션 목록 조회, 참여, 완료 등의 기능 포함
 */
const useMission = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [missions, setMissions] = useState([]);
  const [currentMission, setCurrentMission] = useState(null);
  const [userMissions, setUserMissions] = useState({
    inProgress: [],
    completed: []
  });

  /**
   * 미션 목록 조회
   * @param {Object} filter - 필터 조건
   * @param {Object} options - 페이징, 정렬 등 옵션
   */
  const getMissions = useCallback(async (filter = {}, options = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/missions', {
        params: {
          ...filter,
          ...options
        }
      });
      
      setMissions(response.data.missions);
      
      return response.data.missions;
    } catch (err) {
      console.error('미션 목록 조회 오류:', err);
      setError(err.response?.data?.message || '미션 목록을 불러오는 중 오류가 발생했습니다.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 특정 미션 상세 정보 조회
   * @param {string} missionId - 미션 ID
   */
  const getMissionById = useCallback(async (missionId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/missions/${missionId}`);
      
      setCurrentMission(response.data.mission);
      
      return response.data.mission;
    } catch (err) {
      console.error('미션 정보 조회 오류:', err);
      setError(err.response?.data?.message || '미션 정보를 불러오는 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 사용자가 참여 중인 미션 목록 조회
   */
  const getUserInProgressMissions = useCallback(async (options = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/missions/user/in-progress', {
        params: options
      });
      
      setUserMissions(prev => ({
        ...prev,
        inProgress: response.data.missions
      }));
      
      return response.data.missions;
    } catch (err) {
      console.error('참여 중인 미션 조회 오류:', err);
      setError(err.response?.data?.message || '참여 중인 미션 목록을 불러오는 중 오류가 발생했습니다.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 사용자가 완료한 미션 목록 조회
   */
  const getUserCompletedMissions = useCallback(async (options = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/missions/user/completed', {
        params: options
      });
      
      setUserMissions(prev => ({
        ...prev,
        completed: response.data.missions
      }));
      
      return response.data.missions;
    } catch (err) {
      console.error('완료한 미션 조회 오류:', err);
      setError(err.response?.data?.message || '완료한 미션 목록을 불러오는 중 오류가 발생했습니다.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 미션 참여
   * @param {string} missionId - 참여할 미션 ID
   */
  const participateMission = useCallback(async (missionId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post(`/missions/${missionId}/participate`);
      
      // 참여 중인 미션 목록 갱신
      await getUserInProgressMissions();
      
      return response.data;
    } catch (err) {
      console.error('미션 참여 오류:', err);
      setError(err.response?.data?.message || '미션 참여 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [getUserInProgressMissions]);

  /**
   * 미션 완료 제출
   * @param {string} missionId - 완료할 미션 ID
   * @param {Object} submissionData - 제출 데이터
   */
  const submitMissionCompletion = useCallback(async (missionId, submissionData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post(`/missions/${missionId}/complete`, submissionData);
      
      // 미션 목록 갱신
      await getUserInProgressMissions();
      await getUserCompletedMissions();
      
      return response.data;
    } catch (err) {
      console.error('미션 완료 제출 오류:', err);
      setError(err.response?.data?.message || '미션 완료 제출 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [getUserInProgressMissions, getUserCompletedMissions]);

  /**
   * 미션 참여 취소
   * @param {string} missionId - 취소할 미션 ID
   */
  const cancelMissionParticipation = useCallback(async (missionId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post(`/missions/${missionId}/cancel`);
      
      // 참여 중인 미션 목록 갱신
      await getUserInProgressMissions();
      
      return response.data;
    } catch (err) {
      console.error('미션 참여 취소 오류:', err);
      setError(err.response?.data?.message || '미션 참여 취소 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [getUserInProgressMissions]);

  /**
   * AI 미션 제안 요청
   * @param {Object} preferences - 사용자 선호도
   */
  const suggestMission = useCallback(async (preferences = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/missions/suggest', preferences);
      
      return response.data.suggestions;
    } catch (err) {
      console.error('미션 제안 오류:', err);
      setError(err.response?.data?.message || '미션 제안을 불러오는 중 오류가 발생했습니다.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 일일 출석 체크 미션 완료
   */
  const completeCheckInMission = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/missions/check-in');
      
      // 완료한 미션 목록 갱신
      await getUserCompletedMissions();
      
      return response.data;
    } catch (err) {
      console.error('출석 체크 오류:', err);
      setError(err.response?.data?.message || '출석 체크 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [getUserCompletedMissions]);

  /**
   * 미션 참여자 목록 조회
   * @param {string} missionId - 미션 ID
   * @param {Object} options - 페이징 등 옵션
   */
  const getMissionParticipants = useCallback(async (missionId, options = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/missions/${missionId}/participants`, {
        params: options
      });
      
      return response.data.participants;
    } catch (err) {
      console.error('미션 참여자 조회 오류:', err);
      setError(err.response?.data?.message || '미션 참여자 목록을 불러오는 중 오류가 발생했습니다.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    missions,
    currentMission,
    userMissions,
    loading,
    error,
    getMissions,
    getMissionById,
    getUserInProgressMissions,
    getUserCompletedMissions,
    participateMission,
    submitMissionCompletion,
    cancelMissionParticipation,
    suggestMission,
    completeCheckInMission,
    getMissionParticipants
  };
};

export default useMission;
