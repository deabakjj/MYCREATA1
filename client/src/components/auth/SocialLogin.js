import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaGoogle, FaApple } from 'react-icons/fa';
import { RiKakaoTalkFill } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';

/**
 * 소셜 로그인 컴포넌트
 * 
 * 구글, 카카오, 애플 로그인을 지원하며 로그인 시 자동으로 Web3 지갑을 생성합니다.
 * Web3Auth 또는 Magic.link를 사용하여 사용자 경험을 Web2와 유사하게 유지합니다.
 */
const SocialLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithGoogle, loginWithKakao, loginWithApple } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (error) {
      console.error('Google login failed:', error);
      alert('로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    try {
      setIsLoading(true);
      await loginWithKakao();
      navigate('/dashboard');
    } catch (error) {
      console.error('Kakao login failed:', error);
      alert('로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setIsLoading(true);
      await loginWithApple();
      navigate('/dashboard');
    } catch (error) {
      console.error('Apple login failed:', error);
      alert('로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Nest에 로그인하세요</h2>
      <div className="space-y-4">
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="flex items-center justify-center w-full py-3 px-4 bg-white text-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          <FaGoogle className="mr-3" />
          <span>{isLoading ? '로그인 중...' : 'Google로 계속하기'}</span>
        </button>
        
        <button
          onClick={handleKakaoLogin}
          disabled={isLoading}
          className="flex items-center justify-center w-full py-3 px-4 bg-yellow-300 text-black rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          <RiKakaoTalkFill className="mr-3" />
          <span>{isLoading ? '로그인 중...' : '카카오로 계속하기'}</span>
        </button>
        
        <button
          onClick={handleAppleLogin}
          disabled={isLoading}
          className="flex items-center justify-center w-full py-3 px-4 bg-black text-white rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          <FaApple className="mr-3" />
          <span>{isLoading ? '로그인 중...' : 'Apple로 계속하기'}</span>
        </button>
      </div>
      
      <p className="mt-6 text-center text-sm text-gray-600">
        로그인하면 Nest의 이용약관 및 개인정보처리방침에 동의하게 됩니다.
        <br/>
        Web3 지갑이 자동으로 생성됩니다.
      </p>
    </div>
  );
};

export default SocialLogin;
