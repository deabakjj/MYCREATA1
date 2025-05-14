/**
 * nftService.js
 * NFT 관련 API 요청을 처리하는 서비스
 */

import api from './api';

/**
 * 사용자가 보유한 NFT 목록 조회
 * @param {Object} options - 필터, 정렬 등 옵션
 * @returns {Promise<Object>} NFT 목록
 */
export const getUserNFTs = async (options = {}) => {
  const response = await api.get('/nft/user', {
    params: options
  });
  return response.data;
};

/**
 * 특정 NFT 상세 정보 조회
 * @param {string} tokenId - NFT 토큰 ID
 * @returns {Promise<Object>} NFT 정보
 */
export const getNFTById = async (tokenId) => {
  const response = await api.get(`/nft/${tokenId}`);
  return response.data;
};

/**
 * NFT 전송
 * @param {string} tokenId - 전송할 NFT 토큰 ID
 * @param {string} receiverNestId - 수신자 Nest ID
 * @returns {Promise<Object>} 전송 결과
 */
export const transferNFT = async (tokenId, receiverNestId) => {
  const response = await api.post(`/nft/${tokenId}/transfer`, {
    receiverNestId
  });
  return response.data;
};

/**
 * NFT 유형별 조회
 * @param {string} type - NFT 유형
 * @returns {Promise<Object>} NFT 목록
 */
export const getNFTsByType = async (type) => {
  const response = await api.get('/nft/user', {
    params: { type }
  });
  return response.data;
};

/**
 * NFT 속성 조회
 * @param {string} tokenId - NFT 토큰 ID
 * @returns {Promise<Object>} NFT 속성
 */
export const getNFTAttributes = async (tokenId) => {
  const response = await api.get(`/nft/${tokenId}/attributes`);
  return response.data;
};

/**
 * NFT 보유자 통계 조회
 * @returns {Promise<Object>} NFT 통계
 */
export const getNFTStats = async () => {
  const response = await api.get('/nft/stats');
  return response.data;
};

/**
 * NFT 이미지 URL 조회
 * @param {string} tokenId - NFT 토큰 ID
 * @returns {Promise<Object>} 이미지 URL
 */
export const getNFTImageUrl = async (tokenId) => {
  const response = await api.get(`/nft/${tokenId}/image`);
  return response.data;
};

/**
 * NFT 뱃지로 사용 설정
 * @param {string} tokenId - NFT 토큰 ID
 * @returns {Promise<Object>} 설정 결과
 */
export const setNFTAsBadge = async (tokenId) => {
  const response = await api.post(`/nft/${tokenId}/set-as-badge`);
  return response.data;
};

/**
 * 사용자의 뱃지로 설정된 NFT 조회
 * @returns {Promise<Object>} 뱃지 NFT
 */
export const getUserBadgeNFT = async () => {
  const response = await api.get('/nft/user/badge');
  return response.data;
};

/**
 * NFT 컬렉션 조회
 * @param {string} collectionId - 컬렉션 ID
 * @param {Object} options - 페이징 등 옵션
 * @returns {Promise<Object>} 컬렉션 정보
 */
export const getNFTCollection = async (collectionId, options = {}) => {
  const response = await api.get(`/nft/collection/${collectionId}`, {
    params: options
  });
  return response.data;
};

/**
 * 컬렉션 목록 조회
 * @param {Object} options - 페이징 등 옵션
 * @returns {Promise<Object>} 컬렉션 목록
 */
export const getNFTCollections = async (options = {}) => {
  const response = await api.get('/nft/collections', {
    params: options
  });
  return response.data;
};

/**
 * NFT 발행 (관리자용)
 * @param {Object} nftData - NFT 데이터
 * @returns {Promise<Object>} 발행된 NFT
 */
export const mintNFT = async (nftData) => {
  const response = await api.post('/nft/mint', nftData);
  return response.data;
};

/**
 * NFT 발행 상태 조회
 * @param {string} mintingId - 발행 ID
 * @returns {Promise<Object>} 발행 상태
 */
export const getNFTMintingStatus = async (mintingId) => {
  const response = await api.get(`/nft/minting-status/${mintingId}`);
  return response.data;
};

/**
 * NFT 이전 기록 조회
 * @param {string} tokenId - NFT 토큰 ID
 * @returns {Promise<Object>} 이전 기록
 */
export const getNFTTransferHistory = async (tokenId) => {
  const response = await api.get(`/nft/${tokenId}/history`);
  return response.data;
};

/**
 * NFT 메타데이터 조회
 * @param {string} tokenId - NFT 토큰 ID
 * @returns {Promise<Object>} 메타데이터
 */
export const getNFTMetadata = async (tokenId) => {
  const response = await api.get(`/nft/${tokenId}/metadata`);
  return response.data;
};

/**
 * NFT 희귀도 조회
 * @param {string} tokenId - NFT 토큰 ID
 * @returns {Promise<Object>} 희귀도 정보
 */
export const getNFTRarity = async (tokenId) => {
  const response = await api.get(`/nft/${tokenId}/rarity`);
  return response.data;
};

export default {
  getUserNFTs,
  getNFTById,
  transferNFT,
  getNFTsByType,
  getNFTAttributes,
  getNFTStats,
  getNFTImageUrl,
  setNFTAsBadge,
  getUserBadgeNFT,
  getNFTCollection,
  getNFTCollections,
  mintNFT,
  getNFTMintingStatus,
  getNFTTransferHistory,
  getNFTMetadata,
  getNFTRarity
};
