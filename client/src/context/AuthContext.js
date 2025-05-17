import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import authService from '../services/authService';

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

  // 인증 상태 확인 함수
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      // 토큰 가져오기
      const token = localStorage.getItem('nest-auth-token');
      
      if (token) {
        try {
          // 백엔드 API 호출하여 토큰 검증
          const response = await api.get('/auth/me');
          setUser(response.data.user);
        } catch (err) {
          // 토큰이 유효하지 않은 경우
          console.error('Token verification failed:', err);
          localStorage.removeItem('nest-auth-token');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Auth status check error:', err);
      setError('인증 상태 확인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 앱 시작 시 인증 상태 확인
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // 구글 로그인 함수
  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 백엔드에서 구글 로그인 URL 가져오기
      const authData = await authService.getSocialLoginUrl('google');
      
      // 팝업 창 열기
      const popup = window.open(authData.url, 'googleLogin', 'width=600,height=700');
      
      // 팝업 창 닫힘 및 메시지 수신 대기
      return new Promise((resolve, reject) => {
        window.addEventListener('message', async (event) => {
          // 보안 검사: 이벤트 출처 확인
          if (event.origin !== window.location.origin) return;
          
          try {
            // 인증 코드 처리
            if (event.data.type === 'social-callback' && event.data.provider === 'google') {
              popup.close();
              
              // 백엔드에 인증 코드 전송
              const response = await authService.handleSocialCallback('google', event.data.code);
              
              // 인증 토큰 저장
              localStorage.setItem('nest-auth-token', response.token);
              
              // 사용자 정보 설정
              setUser(response.user);
              resolve(response.user);
            }
          } catch (err) {
            console.error('Google login processing error:', err);
            setError('구글 로그인 처리 중 오류가 발생했습니다.');
            reject(err);
          }
        });
      });
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
      setError(null);
      
      // 백엔드에서 카카오 로그인 URL 가져오기
      const authData = await authService.getSocialLoginUrl('kakao');
      
      // 팝업 창 열기
      const popup = window.open(authData.url, 'kakaoLogin', 'width=600,height=700');
      
      // 팝업 창 닫힘 및 메시지 수신 대기
      return new Promise((resolve, reject) => {
        window.addEventListener('message', async (event) => {
          // 보안 검사: 이벤트 출처 확인
          if (event.origin !== window.location.origin) return;
          
          try {
            // 인증 코드 처리
            if (event.data.type === 'social-callback' && event.data.provider === 'kakao') {
              popup.close();
              
              // 백엔드에 인증 코드 전송
              const response = await authService.handleSocialCallback('kakao', event.data.code);
              
              // 인증 토큰 저장
              localStorage.setItem('nest-auth-token', response.token);
              
              // 사용자 정보 설정
              setUser(response.user);
              resolve(response.user);
            }
          } catch (err) {
            console.error('Kakao login processing error:', err);
            setError('카카오 로그인 처리 중 오류가 발생했습니다.');
            reject(err);
          }
        });
      });
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
      setError(null);
      
      // 백엔드에서 애플 로그인 URL 가져오기
      const authData = await authService.getSocialLoginUrl('apple');
      
      // 팝업 창 열기
      const popup = window.open(authData.url, 'appleLogin', 'width=600,height=700');
      
      // 팝업 창 닫힘 및 메시지 수신 대기
      return new Promise((resolve, reject) => {
        window.addEventListener('message', async (event) => {
          // 보안 검사: 이벤트 출처 확인
          if (event.origin !== window.location.origin) return;
          
          try {
            // 인증 코드 처리
            if (event.data.type === 'social-callback' && event.data.provider === 'apple') {
              popup.close();
              
              // 백엔드에 인증 코드 전송
              const response = await authService.handleSocialCallback('apple', event.data.code);
              
              // 인증 토큰 저장
              localStorage.setItem('nest-auth-token', response.token);
              
              // 사용자 정보 설정
              setUser(response.user);
              resolve(response.user);
            }
          } catch (err) {
            console.error('Apple login processing error:', err);
            setError('애플 로그인 처리 중 오류가 발생했습니다.');
            reject(err);
          }
        });
      });
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
      setError(null);
      
      // 백엔드 로그아웃 API 호출
      await authService.logout();
      
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

  // 지갑 정보 가져오기
  const getWalletInfo = async () => {
    if (!user) return null;
    
    try {
      const walletInfo = await api.get('/wallet/info');
      return walletInfo.data;
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
        getWalletInfo,
        checkAuthStatus
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
