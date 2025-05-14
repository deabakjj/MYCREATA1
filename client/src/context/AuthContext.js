import React, { createContext, useState, useContext, useEffect } from 'react';

/**
 * 인증 컨텍스트
 * 
 * 사용자 인증 및 Web3 지갑 관리를 담당합니다.
 * Web3Auth 또는 Magic.link와 같은 Web3 소셜 로그인 솔루션을 통합합니다.
 * Web3 요소는 백엔드에서 처리되며 사용자에게는 일반적인 로그인 경험을 제공합니다.
 */
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 사용자 세션 초기화 - 앱 시작시 실행
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // 세션 확인 (토큰이 localStorage나 쿠키에 저장되어 있는지)
        const token = localStorage.getItem('nest-auth-token');
        
        if (token) {
          // 토큰 검증 및 사용자 정보 가져오기
          const response = await fetch('/api/auth/verify', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // 토큰이 유효하지 않으면 제거
            localStorage.removeItem('nest-auth-token');
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Authentication initialization error:', err);
        setError('인증 초기화 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // 구글 로그인 함수
  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      
      // Web3Auth 또는 백엔드 API를 통한 구글 로그인 요청
      const response = await fetch('/api/auth/google', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Google login failed');
      }
      
      const data = await response.json();
      
      // 인증 토큰 저장
      localStorage.setItem('nest-auth-token', data.token);
      
      // 사용자 정보 설정
      setUser(data.user);
      
      return data.user;
    } catch (err) {
      console.error('Google login error:', err);
      setError('구글 로그인 중 오류가 발생했습니다.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 카카오 로그인 함수
  const loginWithKakao = async () => {
    try {
      setIsLoading(true);
      
      // 카카오 로그인 로직
      const response = await fetch('/api/auth/kakao', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Kakao login failed');
      }
      
      const data = await response.json();
      
      localStorage.setItem('nest-auth-token', data.token);
      setUser(data.user);
      
      return data.user;
    } catch (err) {
      console.error('Kakao login error:', err);
      setError('카카오 로그인 중 오류가 발생했습니다.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 애플 로그인 함수
  const loginWithApple = async () => {
    try {
      setIsLoading(true);
      
      // 애플 로그인 로직
      const response = await fetch('/api/auth/apple', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Apple login failed');
      }
      
      const data = await response.json();
      
      localStorage.setItem('nest-auth-token', data.token);
      setUser(data.user);
      
      return data.user;
    } catch (err) {
      console.error('Apple login error:', err);
      setError('애플 로그인 중 오류가 발생했습니다.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 로그아웃 함수
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // 백엔드 로그아웃 요청 (필요한 경우)
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('nest-auth-token')}`
        }
      });
      
      // 로컬 스토리지에서 토큰 제거
      localStorage.removeItem('nest-auth-token');
      
      // 사용자 상태 초기화
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError('로그아웃 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 지갑 정보 가져오기 (사용자에게 보여줄 간단한 정보만)
  const getWalletInfo = async () => {
    if (!user) return null;
    
    try {
      const response = await fetch('/api/wallet/info', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('nest-auth-token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch wallet info');
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error fetching wallet info:', err);
      setError('지갑 정보를 가져오는 중 오류가 발생했습니다.');
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        loginWithGoogle,
        loginWithKakao,
        loginWithApple,
        logout,
        getWalletInfo
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// 인증 컨텍스트 사용을 위한 커스텀 훅
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
