import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

/**
 * NFT 컨텍스트
 * 
 * 사용자의 NFT 컬렉션을 관리합니다.
 * 미션 완료, 활동 참여, 랭킹 획득 등을 통해 얻는 NFT를
 * 사용자 친화적인 방식으로 표시합니다.
 */
const NftContext = createContext();

export const NftProvider = ({ children }) => {
  const { user } = useAuth();
  const [nfts, setNfts] = useState([]);
  const [badges, setBadges] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 사용자가 로그인하면 NFT 데이터 로드
  useEffect(() => {
    if (user) {
      loadNfts();
    } else {
      // 사용자가 로그아웃하면 데이터 초기화
      setNfts([]);
      setBadges([]);
    }
  }, [user]);

  // NFT 데이터 로드 함수
  const loadNfts = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('nest-auth-token');
      
      // NFT 데이터 가져오기
      const response = await fetch('/api/nfts', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch NFT data');
      }
      
      const data = await response.json();
      
      // NFT 데이터를 카테고리별로 분류
      const badgeNfts = data.filter(nft => nft.category === 'badge');
      const otherNfts = data.filter(nft => nft.category !== 'badge');
      
      setBadges(badgeNfts);
      setNfts(otherNfts);
    } catch (err) {
      console.error('Error loading NFT data:', err);
      setError('NFT 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // NFT 상세 정보 가져오기
  const getNftDetails = async (nftId) => {
    if (!user) return null;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('nest-auth-token');
      
      const response = await fetch(`/api/nfts/${nftId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch NFT details');
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error fetching NFT details:', err);
      setError('NFT 상세 정보를 가져오는 중 오류가 발생했습니다.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // NFT 전송 함수
  const transferNft = async (nftId, recipientId) => {
    if (!user) return null;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('nest-auth-token');
      
      const response = await fetch(`/api/nfts/${nftId}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ recipientId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'NFT transfer failed');
      }
      
      const result = await response.json();
      
      // NFT 목록 새로고침
      await loadNfts();
      
      return result;
    } catch (err) {
      console.error('Error transferring NFT:', err);
      setError(err.message || 'NFT 전송 중 오류가 발생했습니다.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // 대표 배지 설정 함수
  const setDisplayBadge = async (badgeId) => {
    if (!user) return null;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('nest-auth-token');
      
      const response = await fetch('/api/user/display-badge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ badgeId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to set display badge');
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error setting display badge:', err);
      setError(err.message || '대표 배지 설정 중 오류가 발생했습니다.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // NFT 뱃지 공유 함수 (SNS)
  const shareBadge = async (badgeId, platform) => {
    if (!user) return null;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('nest-auth-token');
      
      const response = await fetch(`/api/nfts/${badgeId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ platform })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to share badge');
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error sharing badge:', err);
      setError(err.message || '배지 공유 중 오류가 발생했습니다.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <NftContext.Provider
      value={{
        nfts,
        badges,
        isLoading,
        error,
        loadNfts,
        getNftDetails,
        transferNft,
        setDisplayBadge,
        shareBadge
      }}
    >
      {children}
    </NftContext.Provider>
  );
};

// NFT 컨텍스트 사용을 위한 커스텀 훅
export const useNft = () => {
  const context = useContext(NftContext);
  if (context === undefined) {
    throw new Error('useNft must be used within an NftProvider');
  }
  return context;
};

export default NftContext;
