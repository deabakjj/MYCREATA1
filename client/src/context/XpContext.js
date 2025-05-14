import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

/**
 * 경험치(XP) 컨텍스트
 * 
 * 사용자의 경험치, 레벨, 미션 참여 상태 등을 관리합니다.
 * 이 시스템은 실제로는 NFT와 블록체인 활동에 기반하지만,
 * 사용자에게는 일반적인 게임 경험치 시스템처럼 보입니다.
 */
const XpContext = createContext();

export const XpProvider = ({ children }) => {
  const { user } = useAuth();
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [rank, setRank] = useState(null);
  const [missions, setMissions] = useState([]);
  const [activeMissions, setActiveMissions] = useState([]);
  const [completedMissions, setCompletedMissions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 레벨 계산 함수
  const calculateLevel = (xpValue) => {
    // 간단한 레벨 계산식: 레벨 = sqrt(xp / 100)의 내림
    return Math.floor(Math.sqrt(xpValue / 100)) + 1;
  };

  // 다음 레벨까지 필요한 XP 계산
  const calculateXpForNextLevel = (currentLevel) => {
    return Math.pow(currentLevel, 2) * 100;
  };

  // 사용자가 로그인하면 XP 및 미션 데이터 로드
  useEffect(() => {
    if (user) {
      loadXpData();
      loadMissions();
    } else {
      // 사용자가 로그아웃하면 데이터 초기화
      setXp(0);
      setLevel(1);
      setRank(null);
      setMissions([]);
      setActiveMissions([]);
      setCompletedMissions([]);
    }
  }, [user]);

  // XP 데이터 로드 함수
  const loadXpData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('nest-auth-token');
      
      // XP 데이터 가져오기
      const response = await fetch('/api/xp/user-stats', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch XP data');
      }
      
      const data = await response.json();
      
      setXp(data.xp);
      setLevel(calculateLevel(data.xp));
      setRank(data.rank);
    } catch (err) {
      console.error('Error loading XP data:', err);
      setError('XP 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 미션 데이터 로드 함수
  const loadMissions = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('nest-auth-token');
      
      // 전체 미션 리스트 가져오기
      const missionsResponse = await fetch('/api/missions', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!missionsResponse.ok) {
        throw new Error('Failed to fetch missions');
      }
      
      const missionsData = await missionsResponse.json();
      setMissions(missionsData);
      
      // 활성 미션 가져오기
      const activeMissionsResponse = await fetch('/api/missions/active', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (activeMissionsResponse.ok) {
        const activeMissionsData = await activeMissionsResponse.json();
        setActiveMissions(activeMissionsData);
      }
      
      // 완료된 미션 가져오기
      const completedMissionsResponse = await fetch('/api/missions/completed', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (completedMissionsResponse.ok) {
        const completedMissionsData = await completedMissionsResponse.json();
        setCompletedMissions(completedMissionsData);
      }
    } catch (err) {
      console.error('Error loading missions data:', err);
      setError('미션 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 미션 시작 함수
  const startMission = async (missionId) => {
    if (!user) return null;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('nest-auth-token');
      
      const response = await fetch(`/api/missions/${missionId}/start`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start mission');
      }
      
      const result = await response.json();
      
      // 활성 미션 업데이트
      await loadMissions();
      
      return result;
    } catch (err) {
      console.error('Error starting mission:', err);
      setError(err.message || '미션 시작 중 오류가 발생했습니다.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // 미션 완료 함수
  const completeMission = async (missionId, submissionData) => {
    if (!user) return null;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('nest-auth-token');
      
      const response = await fetch(`/api/missions/${missionId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ submissionData })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to complete mission');
      }
      
      const result = await response.json();
      
      // XP 및 미션 데이터 새로고침
      await loadXpData();
      await loadMissions();
      
      return result;
    } catch (err) {
      console.error('Error completing mission:', err);
      setError(err.message || '미션 완료 중 오류가 발생했습니다.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // 출석 체크 함수
  const checkIn = async () => {
    if (!user) return null;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('nest-auth-token');
      
      const response = await fetch('/api/activities/check-in', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Check-in failed');
      }
      
      const result = await response.json();
      
      // XP 데이터 새로고침
      await loadXpData();
      
      return result;
    } catch (err) {
      console.error('Error during check-in:', err);
      setError(err.message || '출석 체크 중 오류가 발생했습니다.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <XpContext.Provider
      value={{
        xp,
        level,
        rank,
        missions,
        activeMissions,
        completedMissions,
        isLoading,
        error,
        calculateXpForNextLevel,
        loadXpData,
        loadMissions,
        startMission,
        completeMission,
        checkIn
      }}
    >
      {children}
    </XpContext.Provider>
  );
};

// XP 컨텍스트 사용을 위한 커스텀 훅
export const useXp = () => {
  const context = useContext(XpContext);
  if (context === undefined) {
    throw new Error('useXp must be used within an XpProvider');
  }
  return context;
};

export default XpContext;
