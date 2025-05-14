/**
 * useNFT.js
 * NFT 관련 커스텀 훅
 */

import { useState, useCallback } from 'react';
import api from '../services/api';

/**
 * NFT 관련 기능을 제공하는 훅
 * NFT 목록 조회, 전송 등의 기능 포함
 */
const useNFT = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [currentNft, setCurrentNft] = useState(null);

  /**
   * 사용자가 보유한 NFT 목록 조회
   * @param {Object} options - 필터, 정렬 등 옵션
   */
  const getUserNFTs = useCallback(async (options = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/nft/user', {
        params: options
      });
      
      setNfts(response.data.nfts);
      
      return response.data.nfts;
    } catch (err) {
      console.error('NFT 목록 조회 오류:', err);
      setError(err.response?.data?.message || 'NFT 목록을 불러오는 중 오류가 발생했습니다.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 특정 NFT 상세 정보 조회
   * @param {string} tokenId - NFT 토큰 ID
   */
  const getNFTById = useCallback(async (tokenId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/nft/${tokenId}`);
      
      setCurrentNft(response.data.nft);
      
      return response.data.nft;
    } catch (err) {
      console.error('NFT 정보 조회 오류:', err);
      setError(err.response?.data?.message || 'NFT 정보를 불러오는 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * NFT 전송
   * @param {string} tokenId - 전송할 NFT 토큰 ID
   * @param {string} receiverNestId - 수신자 Nest ID
   */
  const transferNFT = useCallback(async (tokenId, receiverNestId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post(`/nft/${tokenId}/transfer`, {
        receiverNestId
      });
      
      // NFT 목록 갱신
      await getUserNFTs();
      
      return response.data;
    } catch (err) {
      console.error('NFT 전송 오류:', err);
      setError(err.response?.data?.message || 'NFT 전송 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [getUserNFTs]);

  /**
   * NFT 유형별 조회
   * @param {string} type - NFT 유형
   */
  const getNFTsByType = useCallback(async (type) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/nft/user', {
        params: { type }
      });
      
      return response.data.nfts;
    } catch (err) {
      console.error('NFT 유형별 조회 오류:', err);
      setError(err.response?.data?.message || 'NFT 유형별 목록을 불러오는 중 오류가 발생했습니다.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * NFT 속성 조회
   * @param {string} tokenId - NFT 토큰 ID
   */
  const getNFTAttributes = useCallback(async (tokenId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/nft/${tokenId}/attributes`);
      
      return response.data.attributes;
    } catch (err) {
      console.error('NFT 속성 조회 오류:', err);
      setError(err.response?.data?.message || 'NFT 속성을 불러오는 중 오류가 발생했습니다.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * NFT 보유자 통계 조회
   */
  const getNFTStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/nft/stats');
      
      return response.data.stats;
    } catch (err) {
      console.error('NFT 통계 조회 오류:', err);
      setError(err.response?.data?.message || 'NFT 통계를 불러오는 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * NFT 이미지 URL 조회
   * @param {string} tokenId - NFT 토큰 ID
   */
  const getNFTImageUrl = useCallback(async (tokenId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/nft/${tokenId}/image`);
      
      return response.data.imageUrl;
    } catch (err) {
      console.error('NFT 이미지 URL 조회 오류:', err);
      setError(err.response?.data?.message || 'NFT 이미지 URL을 불러오는 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * NFT 뱃지로 사용 설정
   * @param {string} tokenId - NFT 토큰 ID
   */
  const setNFTAsBadge = useCallback(async (tokenId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post(`/nft/${tokenId}/set-as-badge`);
      
      return response.data;
    } catch (err) {
      console.error('NFT 뱃지 설정 오류:', err);
      setError(err.response?.data?.message || 'NFT 뱃지 설정 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 사용자의 뱃지로 설정된 NFT 조회
   */
  const getUserBadgeNFT = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/nft/user/badge');
      
      return response.data.nft;
    } catch (err) {
      console.error('사용자 뱃지 NFT 조회 오류:', err);
      setError(err.response?.data?.message || '사용자 뱃지 NFT를 불러오는 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    nfts,
    currentNft,
    loading,
    error,
    getUserNFTs,
    getNFTById,
    transferNFT,
    getNFTsByType,
    getNFTAttributes,
    getNFTStats,
    getNFTImageUrl,
    setNFTAsBadge,
    getUserBadgeNFT
  };
};

export default useNFT;
