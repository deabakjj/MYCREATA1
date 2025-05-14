/**
 * walletService.js
 * 지갑 관련 API 요청을 처리하는 서비스
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
 * 거래 확인
 * @param {string} txHash - 트랜잭션 해시
 * @returns {Promise<Object>} 거래 정보
 */
export const getTransactionStatus = async (txHash) => {
  const response = await api.get(`/wallet/transaction/${txHash}`);
  return response.data;
};

/**
 * 지갑 주소 조회
 * @returns {Promise<Object>} 지갑 주소
 */
export const getWalletAddress = async () => {
  const response = await api.get('/wallet/address');
  return response.data;
};

/**
 * QR 코드 생성 (결제용)
 * @param {number} amount - 결제 금액
 * @param {string} memo - 메모 (선택사항)
 * @returns {Promise<Object>} QR 코드 데이터
 */
export const generatePaymentQR = async (amount, memo = '') => {
  const response = await api.post('/wallet/payment-qr', {
    amount,
    memo
  });
  return response.data;
};

/**
 * QR 코드 스캔 결과 처리
 * @param {string} qrData - QR 코드 데이터
 * @returns {Promise<Object>} 처리 결과
 */
export const processQRScan = async (qrData) => {
  const response = await api.post('/wallet/process-qr', { qrData });
  return response.data;
};

/**
 * 가스 요금 추정
 * @param {string} txType - 트랜잭션 유형
 * @param {Object} params - 트랜잭션 파라미터
 * @returns {Promise<Object>} 가스 요금 정보
 */
export const estimateGasFee = async (txType, params = {}) => {
  const response = await api.post('/wallet/estimate-gas', {
    txType,
    params
  });
  return response.data;
};

/**
 * 거래 영수증 가져오기
 * @param {string} txHash - 트랜잭션 해시
 * @returns {Promise<Object>} 거래 영수증
 */
export const getTransactionReceipt = async (txHash) => {
  const response = await api.get(`/wallet/receipt/${txHash}`);
  return response.data;
};

export default {
  getTokenBalance,
  getTransactionHistory,
  getTransferLimits,
  transferTokens,
  swapCTAtoNEST,
  swapNESTtoCTA,
  getTransactionStatus,
  getWalletAddress,
  generatePaymentQR,
  processQRScan,
  estimateGasFee,
  getTransactionReceipt
};
