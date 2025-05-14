/**
 * useAuth.js
 * 인증 관련 커스텀 훅
 */

import { useState, useEffect, useContext, useCallback } from 'react';
import AuthContext from '../context/AuthContext';
import api from '../services/api';

/**
 * 인증 관련 기능을 제공하는 훅
 * 로그인, 로그아웃, 사용자 정보 등의 기능 포함
 */
const useAuth = () => {
  const { state, dispatch } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 초기화 (페이지 로드 시 로컬 스토리지에서 토큰 확인)
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // 토큰 유효성 검사
          dispatch({ type: 'AUTH_INIT' });
          setLoading(true);
          
          const response = await api.get('/auth/me');
          
          if (response.data.user) {
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: {
                user: response.data.user,
                token
              }
            });
          } else {
            // 토큰은 있지만 사용자 정보가 없는 경우
            localStorage.removeItem('token');
            dispatch({ type: 'AUTH_FAIL' });
          }
        } catch (err) {
          console.error('인증 초기화 오류:', err);
          localStorage.removeItem('token');
          dispatch({ type: 'AUTH_FAIL' });
        } finally {
          setLoading(false);
        }
      }
    };
    
    initAuth();
  }, [dispatch]);

  /**
   * 소셜 로그인 처리
   * @param {string} provider - 소셜 로그인 제공자 (google, kakao, apple)
   */
  const socialLogin = useCallback(async (provider) => {
    try {
      setLoading(true);
      setError(null);
      
      // 소셜 로그인 URL 가져오기
      const response = await api.get(`/auth/${provider}`);
      
      // 소셜 로그인 페이지로 리디렉션
      window.location.href = response.data.authUrl;
    } catch (err) {
      console.error('소셜 로그인 오류:', err);
      setError(err.response?.data?.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 소셜 로그인 콜백 처리
   * @param {string} provider - 소셜 로그인 제공자
   * @param {string} code - 인증 코드
   */
  const handleSocialCallback = useCallback(async (provider, code) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post(`/auth/${provider}/callback`, { code });
      
      const { token, user } = response.data;
      
      // 토큰을 로컬 스토리지에 저장
      localStorage.setItem('token', token);
      
      // 상태 업데이트
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user,
          token
        }
      });
      
      return user;
    } catch (err) {
      console.error('소셜 로그인 콜백 오류:', err);
      setError(err.response?.data?.message || '로그인 처리 중 오류가 발생했습니다.');
      dispatch({ type: 'AUTH_FAIL' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  /**
   * 로그아웃 처리
   */
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      
      // 서버에 로그아웃 요청
      await api.post('/auth/logout');
      
      // 로컬 스토리지에서 토큰 제거
      localStorage.removeItem('token');
      
      // 상태 초기화
      dispatch({ type: 'AUTH_LOGOUT' });
    } catch (err) {
      console.error('로그아웃 오류:', err);
      // 에러가 발생해도 로컬에서는 로그아웃 처리
      localStorage.removeItem('token');
      dispatch({ type: 'AUTH_LOGOUT' });
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  /**
   * 사용자 정보 업데이트
   * @param {Object} userData - 업데이트할 사용자 데이터
   */
  const updateUserProfile = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put('/user/profile', userData);
      
      // 상태 업데이트
      dispatch({
        type: 'USER_UPDATE',
        payload: response.data.user
      });
      
      return response.data.user;
    } catch (err) {
      console.error('프로필 업데이트 오류:', err);
      setError(err.response?.data?.message || '프로필 업데이트 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  /**
   * 사용자 프로필 이미지 업로드
   * @param {File} file - 업로드할 이미지 파일
   */
  const uploadProfileImage = useCallback(async (file) => {
    try {
      setLoading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await api.post('/user/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // 상태 업데이트
      dispatch({
        type: 'USER_UPDATE',
        payload: {
          ...state.user,
          avatar: response.data.avatarUrl
        }
      });
      
      return response.data.avatarUrl;
    } catch (err) {
      console.error('이미지 업로드 오류:', err);
      setError(err.response?.data?.message || '이미지 업로드 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [dispatch, state.user]);

  return {
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    loading,
    error,
    socialLogin,
    handleSocialCallback,
    logout,
    updateUserProfile,
    uploadProfileImage
  };
};

export default useAuth;
