/**
 * useXP.js
 * 경험치(XP) 관련 커스텀 훅
 */

import { useState, useContext, useCallback } from 'react';
import AuthContext from '../context/AuthContext';
import api from '../services/api';

/**
 * 경험치(XP) 관련 기능을 제공하는 훅
 * XP 상태 조회, 활동 내역 조회, 리더보드 조회 등의 기능 포함
 */
const useXP = () => {
  const { state, dispatch } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [xpStatus, setXpStatus] = useState({
    currentXP: 0,
    currentLevel: 1,
    nextLevel: 2,
    nextLevelXP: 100,
    remainingXP: 100,
    progress: 0
  });
  const [xpHistory, setXpHistory] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  /**
   * XP 상태 조회
   */
  const getXPStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/xp/status');
      
      setXpStatus(response.data);
      
      // 사용자 정보 업데이트 (레벨)
      if (state.user && response.data.currentLevel !== state.user.level) {
        dispatch({
          type: 'USER_UPDATE',
          payload: {
            ...state.user,
            level: response.data.currentLevel,
            xp: response.data.currentXP
          }
        });
      }
      
      return response.data;
    } catch (err) {
      console.error('XP 상태 조회 오류:', err);
      setError(err.response?.data?.message || 'XP 상태를 불러오는 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [state.user, dispatch]);

  /**
   * XP 획득 내역 조회
   * @param {Object} options - 페이징, 정렬 등 옵션
   */
  const getXPHistory = useCallback(async (options = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/xp/history', {
        params: options
      });
      
      setXpHistory(response.data.history);
      
      return response.data.history;
    } catch (err) {
      console.error('XP 내역 조회 오류:', err);
      setError(err.response?.data?.message || 'XP 획득 내역을 불러오는 중 오류가 발생했습니다.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * XP 리더보드 조회
   * @param {Object} options - 페이징 등 옵션
   */
  const getLeaderboard = useCallback(async (options = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/xp/leaderboard', {
        params: options
      });
      
      setLeaderboard(response.data.leaderboard);
      
      return response.data.leaderboard;
    } catch (err) {
      console.error('리더보드 조회 오류:', err);
      setError(err.response?.data?.message || '리더보드를 불러오는 중 오류가 발생했습니다.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 특정 활동에 대한 XP 획득
   * @param {string} activityType - 활동 유형
   * @param {string} detail - 활동 세부 정보 (선택사항)
   */
  const awardXPForActivity = useCallback(async (activityType, detail = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/xp/award', {
        activityType,
        detail
      });
      
      // XP 상태 갱신
      await getXPStatus();
      
      return response.data;
    } catch (err) {
      console.error('XP 획득 오류:', err);
      setError(err.response?.data?.message || 'XP 획득 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [getXPStatus]);

  /**
   * 사용자의 리더보드 순위 조회
   */
  const getUserRank = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/xp/user-rank');
      
      return response.data.rank;
    } catch (err) {
      console.error('사용자 순위 조회 오류:', err);
      setError(err.response?.data?.message || '사용자 순위를 불러오는 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 특정 레벨에 필요한 XP 조회
   * @param {number} level - 조회할 레벨
   */
  const getRequiredXPForLevel = useCallback(async (level) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/xp/level-requirement/${level}`);
      
      return response.data.requiredXP;
    } catch (err) {
      console.error('레벨 요구사항 조회 오류:', err);
      setError(err.response?.data?.message || '레벨 요구사항을 불러오는 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 활동 유형별 XP 보상 금액 조회
   */
  const getXPRewardAmounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/xp/reward-amounts');
      
      return response.data.rewards;
    } catch (err) {
      console.error('XP 보상 금액 조회 오류:', err);
      setError(err.response?.data?.message || 'XP 보상 금액을 불러오는 중 오류가 발생했습니다.');
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 일일 획득한 XP 총량 조회
   */
  const getDailyXPTotal = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/xp/daily-total');
      
      return response.data.total;
    } catch (err) {
      console.error('일일 XP 총량 조회 오류:', err);
      setError(err.response?.data?.message || '일일 XP 총량을 불러오는 중 오류가 발생했습니다.');
      return 0;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    xpStatus,
    xpHistory,
    leaderboard,
    loading,
    error,
    getXPStatus,
    getXPHistory,
    getLeaderboard,
    awardXPForActivity,
    getUserRank,
    getRequiredXPForLevel,
    getXPRewardAmounts,
    getDailyXPTotal
  };
};

export default useXP;
