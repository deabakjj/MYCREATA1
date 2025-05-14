/**
 * tokenService.js
 * 토큰 관련 API 요청을 처리하는 서비스
 */

import api from './api';

/**
 * 토큰 잔액 조회
 * @returns {Promise<Object>} 토큰 잔액 정보
 */
export const getTokenBalance = async () => {
  const response = await api.get('/wallet/balance');
  return response.data;
};

/**
 * 토큰 전송
 * @param {string} receiverNestId - 수신자 Nest ID
 * @param {number} amount - 전송할 금액
 * @param {string} memo - 메모 (선택사항)
 * @returns {Promise<Object>} 전송 결과
 */
export const transferTokens = async (receiverNestId, amount, memo = '') => {
  const response = await api.post('/wallet/transfer', {
    receiverNestId,
    amount,
    memo
  });
  return response.data;
};

/**
 * CTA를 NEST로 스왑
 * @param {number} amount - 스왑할 CTA 금액
 * @returns {Promise<Object>} 스왑 결과
 */
export const swapCTAtoNEST = async (amount) => {
  const response = await api.post('/wallet/swap/cta-to-nest', { amount });
  return response.data;
};

/**
 * NEST를 CTA로 스왑
 * @param {number} amount - 스왑할 NEST 금액
 * @returns {Promise<Object>} 스왑 결과
 */
export const swapNESTtoCTA = async (amount) => {
  const response = await api.post('/wallet/swap/nest-to-cta', { amount });
  return response.data;
};

/**
 * 거래 내역 조회
 * @param {Object} options - 페이징, 정렬 등 옵션
 * @returns {Promise<Object>} 거래 내역
 */
export const getTransactionHistory = async (options = {}) => {
  const response = await api.get('/wallet/transactions', { params: options });
  return response.data;
};

/**
 * 전송 한도 조회
 * @returns {Promise<Object>} 전송 한도 정보
 */
export const getTransferLimits = async () => {
  const response = await api.get('/wallet/limits');
  return response.data;
};

/**
 * 거래 확인
 * @param {string} txHash - 트랜잭션 해시
 * @returns {Promise<Object>} 거래 정보
 */
export const getTransactionStatus = async (txHash) => {
  const response = await api.get(`/wallet/transaction/${txHash}`);
  return response.data;
};

/**
 * 환율 조회
 * @returns {Promise<Object>} 환율 정보
 */
export const getExchangeRate = async () => {
  const response = await api.get('/wallet/exchange-rate');
  return response.data;
};

/**
 * 토큰 가격 조회
 * @returns {Promise<Object>} 토큰 가격 정보
 */
export const getTokenPrice = async () => {
  const response = await api.get('/wallet/token-price');
  return response.data;
};

/**
 * 토큰 가격 히스토리 조회
 * @param {string} period - 기간 (day, week, month, year)
 * @returns {Promise<Object>} 가격 히스토리
 */
export const getTokenPriceHistory = async (period = 'week') => {
  const response = await api.get(`/wallet/token-price-history/${period}`);
  return response.data;
};

/**
 * 스왑 이력 조회
 * @param {Object} options - 페이징, 정렬 등 옵션
 * @returns {Promise<Object>} 스왑 이력
 */
export const getSwapHistory = async (options = {}) => {
  const response = await api.get('/wallet/swap-history', { params: options });
  return response.data;
};

/**
 * 토큰 정보 조회
 * @returns {Promise<Object>} 토큰 정보
 */
export const getTokenInfo = async () => {
  const response = await api.get('/wallet/token-info');
  return response.data;
};

/**
 * 토큰 보상 이력 조회
 * @param {Object} options - 페이징, 정렬 등 옵션
 * @returns {Promise<Object>} 보상 이력
 */
export const getRewardHistory = async (options = {}) => {
  const response = await api.get('/wallet/reward-history', { params: options });
  return response.data;
};

/**
 * 토큰 스테이킹
 * @param {number} amount - 스테이킹할 금액
 * @param {number} period - 스테이킹 기간 (일)
 * @returns {Promise<Object>} 스테이킹 결과
 */
export const stakeTokens = async (amount, period) => {
  const response = await api.post('/wallet/stake', { amount, period });
  return response.data;
};

/**
 * 스테이킹 정보 조회
 * @returns {Promise<Object>} 스테이킹 정보
 */
export const getStakingInfo = async () => {
  const response = await api.get('/wallet/staking-info');
  return response.data;
};

/**
 * 토큰 언스테이킹
 * @param {string} stakingId - 스테이킹 ID
 * @returns {Promise<Object>} 언스테이킹 결과
 */
export const unstakeTokens = async (stakingId) => {
  const response = await api.post('/wallet/unstake', { stakingId });
  return response.data;
};

/**
 * 유통량 조회
 * @returns {Promise<Object>} 유통량 정보
 */
export const getCirculatingSupply = async () => {
  const response = await api.get('/wallet/circulating-supply');
  return response.data;
};

export default {
  getTokenBalance,
  transferTokens,
  swapCTAtoNEST,
  swapNESTtoCTA,
  getTransactionHistory,
  getTransferLimits,
  getTransactionStatus,
  getExchangeRate,
  getTokenPrice,
  getTokenPriceHistory,
  getSwapHistory,
  getTokenInfo,
  getRewardHistory,
  stakeTokens,
  getStakingInfo,
  unstakeTokens,
  getCirculatingSupply
};
