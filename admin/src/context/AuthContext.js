import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

// 인증 컨텍스트 생성
const AuthContext = createContext();

// 인증 상태 제공자 컴포넌트
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 토큰이 변경되면 API 헤더에 설정
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // 앱 로드 시 사용자 정보 가져오기
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        
        if (response.data && response.data.user) {
          setUser(response.data.user);
          setIsAuthenticated(true);
        } else {
          // 유효하지 않은 응답
          setToken(null);
        }
      } catch (err) {
        console.error('사용자 정보 로드 실패:', err);
        setToken(null);
        setError('인증 세션이 만료되었습니다. 다시 로그인해주세요.');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // 로그인 함수
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data && response.data.token) {
        setToken(response.data.token);
        setUser(response.data.user);
        setIsAuthenticated(true);
        return true;
      } else {
        throw new Error('로그인 응답이 유효하지 않습니다.');
      }
    } catch (err) {
      setError(err.response?.data?.message || '로그인에 실패했습니다.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃 함수
  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  // 컨텍스트 값
  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 커스텀 훅
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내에서만 사용할 수 있습니다');
  }
  return context;
};

export default AuthContext;
