import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

/**
 * 토큰 컨텍스트
 * 
 * NEST 토큰과 CTA 토큰의 잔액을 관리하고 스왑 기능을 제공합니다.
 * 토큰 관련 작업은 백엔드에서 처리되며 사용자에게는 일반적인 포인트 시스템처럼 보입니다.
 */
const TokenContext = createContext();

export const TokenProvider = ({ children }) => {
  const { user } = useAuth();
  const [nestBalance, setNestBalance] = useState(0);
  const [ctaBalance, setCtaBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [swapRate, setSwapRate] = useState(1000); // 기본 교환 비율: 1 CTA = 1000 NEST

  // 사용자가 로그인하면 토큰 잔액 로드
  useEffect(() => {
    if (user) {
      loadBalances();
    } else {
      // 사용자가 로그아웃하면 잔액 초기화
      setNestBalance(0);
      setCtaBalance(0);
    }
  }, [user]);

  // 토큰 잔액 로드 함수
  const loadBalances = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('nest-auth-token');
      
      // NEST 토큰 잔액 가져오기
      const nestResponse = await fetch('/api/tokens/nest/balance', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!nestResponse.ok) {
        throw new Error('Failed to fetch NEST balance');
      }
      
      const nestData = await nestResponse.json();
      setNestBalance(nestData.balance);
      
      // CTA 토큰 잔액 가져오기
      const ctaResponse = await fetch('/api/tokens/cta/balance', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!ctaResponse.ok) {
        throw new Error('Failed to fetch CTA balance');
      }
      
      const ctaData = await ctaResponse.json();
      setCtaBalance(ctaData.balance);
      
      // 현재 교환 비율 가져오기
      const rateResponse = await fetch('/api/tokens/swap/rate');
      
      if (rateResponse.ok) {
        const rateData = await rateResponse.json();
        setSwapRate(rateData.rate);
      }
    } catch (err) {
      console.error('Error loading token balances:', err);
      setError('토큰 잔액을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // CTA를 NEST로 스왑하는 함수
  const swapCtaToNest = async (ctaAmount) => {
    if (!user) return null;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('nest-auth-token');
      
      const response = await fetch('/api/tokens/swap/cta-to-nest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: ctaAmount })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Swap failed');
      }
      
      const result = await response.json();
      
      // 잔액 업데이트
      setCtaBalance(prev => prev - ctaAmount);
      setNestBalance(prev => prev + (ctaAmount * swapRate));
      
      return result;
    } catch (err) {
      console.error('Error swapping CTA to NEST:', err);
      setError(err.message || 'CTA를 NEST로 교환하는 중 오류가 발생했습니다.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // NEST를 CTA로 스왑하는 함수
  const swapNestToCta = async (nestAmount) => {
    if (!user) return null;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('nest-auth-token');
      
      const response = await fetch('/api/tokens/swap/nest-to-cta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: nestAmount })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Swap failed');
      }
      
      const result = await response.json();
      
      // 잔액 업데이트
      setNestBalance(prev => prev - nestAmount);
      setCtaBalance(prev => prev + (nestAmount / swapRate));
      
      return result;
    } catch (err) {
      console.error('Error swapping NEST to CTA:', err);
      setError(err.message || 'NEST를 CTA로 교환하는 중 오류가 발생했습니다.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // 다른 사용자에게 NEST 토큰 전송 함수
  const transferNest = async (recipientId, amount) => {
    if (!user) return null;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('nest-auth-token');
      
      const response = await fetch('/api/tokens/nest/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientId,
          amount
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Transfer failed');
      }
      
      const result = await response.json();
      
      // 잔액 업데이트
      setNestBalance(prev => prev - amount);
      
      return result;
    } catch (err) {
      console.error('Error transferring NEST:', err);
      setError(err.message || 'NEST 전송 중 오류가 발생했습니다.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TokenContext.Provider
      value={{
        nestBalance,
        ctaBalance,
        swapRate,
        isLoading,
        error,
        loadBalances,
        swapCtaToNest,
        swapNestToCta,
        transferNest
      }}
    >
      {children}
    </TokenContext.Provider>
  );
};

// 토큰 컨텍스트 사용을 위한 커스텀 훅
export const useToken = () => {
  const context = useContext(TokenContext);
  if (context === undefined) {
    throw new Error('useToken must be used within a TokenProvider');
  }
  return context;
};

export default TokenContext;
