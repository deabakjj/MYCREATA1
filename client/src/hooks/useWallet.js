/**
 * useWallet.js
 * 지갑 관련 커스텀 훅
 */

import { useState, useEffect, useContext, useCallback } from 'react';
import AuthContext from '../context/AuthContext';
import api from '../services/api';

/**
 * 지갑 관련 기능을 제공하는 훅
 * 잔액 조회, 토큰 전송, 스왑 등의 기능 포함
 */
const useWallet = () => {
  const { state } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [balance, setBalance] = useState({
    nest: '0',
    cta: '0'
  });
  const [transactions, setTransactions] = useState([]);
  const [transferLimits, setTransferLimits] = useState({
    dailyLimit: 0,
    totalSent: 0,
    remaining: 0
  });

  // 사용자가 인증되었을 때 지갑 정보 조회
  useEffect(() => {
    if (state.isAuthenticated) {
      getBalance();
      getTransferLimits();
    }
  }, [state.isAuthenticated]);

  /**
   * 토큰 잔액 조회
   */
  const getBalance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/wallet/balance');
      
      setBalance({
        nest: response.data.nest,
        cta: response.data.cta
      });
      
      return response.data;
    } catch (err) {
      console.error('잔액 조회 오류:', err);
      setError(err.response?.data?.message || '잔액 조회 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 거래 내역 조회
   * @param {Object} options - 페이징, 정렬 등 옵션
   */
  const getTransactions = useCallback(async (options = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/wallet/transactions', { params: options });
      
      setTransactions(response.data.transactions);
      
      return response.data.transactions;
    } catch (err) {
      console.error('거래 내역 조회 오류:', err);
      setError(err.response?.data?.message || '거래 내역 조회 중 오류가 발생했습니다.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 전송 한도 조회
   */
  const getTransferLimits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/wallet/limits');
      
      setTransferLimits({
        dailyLimit: response.data.dailyLimit,
        totalSent: response.data.totalSent,
        remaining: response.data.remaining
      });
      
      return response.data;
    } catch (err) {
      console.error('전송 한도 조회 오류:', err);
      setError(err.response?.data?.message || '전송 한도 조회 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 토큰 전송
   * @param {string} receiverNestId - 수신자 Nest ID
   * @param {number} amount - 전송할 금액
   * @param {string} memo - 메모 (선택사항)
   */
  const transferTokens = useCallback(async (receiverNestId, amount, memo = '') => {
    try {
      setLoading(true);
      setError(null);
      
      // 숫자 형식 검사
      if (isNaN(amount) || amount <= 0) {
        throw new Error('유효한 금액을 입력해주세요.');
      }
      
      // 잔액 검사
      if (parseFloat(amount) > parseFloat(balance.nest)) {
        throw new Error('잔액이 부족합니다.');
      }
      
      // 한도 검사
      if (parseFloat(amount) > transferLimits.remaining) {
        throw new Error('일일 전송 한도를 초과했습니다.');
      }
      
      const response = await api.post('/wallet/transfer', {
        receiverNestId,
        amount,
        memo
      });
      
      // 잔액 및 한도 갱신
      await getBalance();
      await getTransferLimits();
      
      return response.data;
    } catch (err) {
      console.error('토큰 전송 오류:', err);
      setError(err.response?.data?.message || '토큰 전송 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [balance.nest, transferLimits.remaining, getBalance, getTransferLimits]);

  /**
   * CTA를 NEST로 스왑
   * @param {number} amount - 스왑할 CTA 금액
   */
  const swapCTAtoNEST = useCallback(async (amount) => {
    try {
      setLoading(true);
      setError(null);
      
      // 숫자 형식 검사
      if (isNaN(amount) || amount <= 0) {
        throw new Error('유효한 금액을 입력해주세요.');
      }
      
      // 잔액 검사
      if (parseFloat(amount) > parseFloat(balance.cta)) {
        throw new Error('CTA 잔액이 부족합니다.');
      }
      
      const response = await api.post('/wallet/swap/cta-to-nest', { amount });
      
      // 잔액 갱신
      await getBalance();
      
      return response.data;
    } catch (err) {
      console.error('CTA → NEST 스왑 오류:', err);
      setError(err.response?.data?.message || '토큰 스왑 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [balance.cta, getBalance]);

  /**
   * NEST를 CTA로 스왑
   * @param {number} amount - 스왑할 NEST 금액
   */
  const swapNESTtoCTA = useCallback(async (amount) => {
    try {
      setLoading(true);
      setError(null);
      
      // 숫자 형식 검사
      if (isNaN(amount) || amount <= 0) {
        throw new Error('유효한 금액을 입력해주세요.');
      }
      
      // 잔액 검사
      if (parseFloat(amount) > parseFloat(balance.nest)) {
        throw new Error('NEST 잔액이 부족합니다.');
      }
      
      const response = await api.post('/wallet/swap/nest-to-cta', { amount });
      
      // 잔액 갱신
      await getBalance();
      
      return response.data;
    } catch (err) {
      console.error('NEST → CTA 스왑 오류:', err);
      setError(err.response?.data?.message || '토큰 스왑 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [balance.nest, getBalance]);

  /**
   * 거래 확인
   * @param {string} txHash - 트랜잭션 해시
   */
  const getTransactionStatus = useCallback(async (txHash) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/wallet/transaction/${txHash}`);
      
      return response.data;
    } catch (err) {
      console.error('거래 확인 오류:', err);
      setError(err.response?.data?.message || '거래 확인 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 지갑 주소 조회
   */
  const getWalletAddress = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/wallet/address');
      
      return response.data.address;
    } catch (err) {
      console.error('지갑 주소 조회 오류:', err);
      setError(err.response?.data?.message || '지갑 주소 조회 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    balance,
    transactions,
    transferLimits,
    loading,
    error,
    getBalance,
    getTransactions,
    getTransferLimits,
    transferTokens,
    swapCTAtoNEST,
    swapNESTtoCTA,
    getTransactionStatus,
    getWalletAddress
  };
};

export default useWallet;
