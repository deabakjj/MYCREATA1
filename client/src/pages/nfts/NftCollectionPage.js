import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNft } from '../../context/NftContext';

/**
 * NFT 컬렉션 페이지 컴포넌트
 * 
 * 사용자가 소유한 NFT 컬렉션을 표시하고
 * 필터링, 정렬, 관리 기능을 제공합니다.
 */
const NftCollectionPage = () => {
  const { user } = useAuth();
  const { nfts, badges, loadNfts, setDisplayBadge, isLoading } = useNft();
  
  // 필터 및 정렬 상태
  const [filter, setFilter] = useState('all'); // all, badges, rewards, achievements
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, rarity
  
  // 필터링된 NFT 목록
  const [filteredNfts, setFilteredNfts] = useState([]);
  
  // 모달 상태
  const [selectedNft, setSelectedNft] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // NFT 로드
  useEffect(() => {
    loadNfts();
  }, []);
  
  // NFT 필터링 및 정렬
  useEffect(() => {
    if (!nfts && !badges) return;
    
    let filtered = [];
    
    // 필터 적용
    if (filter === 'all') {
      filtered = [...nfts, ...badges];
    } else if (filter === 'badges') {
      filtered = [...badges];
    } else if (filter === 'rewards') {
      filtered = nfts.filter(nft => nft.category === 'reward');
    } else if (filter === 'achievements') {
      filtered = nfts.filter(nft => nft.category === 'achievement');
    }
    
    // 검색어 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(nft => 
        nft.name.toLowerCase().includes(query) || 
        nft.description.toLowerCase().includes(query)
      );
    }
    
    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.mintedAt) - new Date(b.mintedAt);
        case 'rarity':
          return b.rarity - a.rarity;
        case 'newest':
        default:
          return new Date(b.mintedAt) - new Date(a.mintedAt);
      }
    });
    
    setFilteredNfts(filtered);
  }, [nfts, badges, filter, searchQuery, sortBy]);
  
  // NFT 상세 정보 모달 열기
  const openNftDetails = (nft) => {
    setSelectedNft(nft);
    setIsModalOpen(true);
  };
  
  // 대표 배지 설정 핸들러
  const handleSetDisplayBadge = async (badgeId) => {
    await setDisplayBadge(badgeId);
    setIsModalOpen(false);
  };
  
  // NFT 카드 컴포넌트
  const NftCard = ({ nft }) => {
    const isBadge = badges.some(badge => badge.id === nft.id);
    const isDisplayBadge = user?.displayBadgeId === nft.id;
    
    return (
      <div 
        className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer transition-transform hover:transform hover:scale-105 hover:shadow-md"
        onClick={() => openNftDetails(nft)}
      >
        <div className="relative aspect-square bg-gray-100">
          {nft.imageUrl ? (
            <img 
              src={nft.imageUrl} 
              alt={nft.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          )}
          
          {isDisplayBadge && (
            <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          
          {nft.rarity && (
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-50 rounded text-xs text-white">
              {nft.rarity >= 9 ? '레전더리' : 
               nft.rarity >= 7 ? '에픽' : 
               nft.rarity >= 5 ? '레어' : 
               nft.rarity >= 3 ? '언커먼' : '커먼'}
            </div>
          )}
        </div>
        
        <div className="p-3">
          <h3 className="font-bold text-sm mb-1 truncate">{nft.name}</h3>
          <div className="flex justify-between items-center">
            <div className="flex items-center text-xs text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {new Date(nft.mintedAt).toLocaleDateString()}
            </div>
            
            {isBadge && (
              <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded">
                배지
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">NFT 컬렉션</h1>
        <p className="text-gray-600 mb-8">내가 소유한 NFT 배지와 보상을 관리하세요</p>
        
        {/* 필터 및 검색 영역 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div className="flex flex-wrap gap-2">
              <button 
                className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setFilter('all')}
              >
                전체
              </button>
              <button 
                className={`px-4 py-2 rounded-lg ${filter === 'badges' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setFilter('badges')}
              >
                배지
              </button>
              <button 
                className={`px-4 py-2 rounded-lg ${filter === 'rewards' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setFilter('rewards')}
              >
                보상
              </button>
              <button 
                className={`px-4 py-2 rounded-lg ${filter === 'achievements' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setFilter('achievements')}
              >
                업적
              </button>
            </div>
            
            <div className="flex">
              <select 
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">최신순</option>
                <option value="oldest">오래된순</option>
                <option value="rarity">희귀도순</option>
              </select>
            </div>
          </div>
          
          <div className="relative">
            <input
              type="text"
              placeholder="NFT 검색..."
              className="w-full px-4 py-2 pl-10 bg-gray-100 rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
        
        {/* NFT 그리드 */}
        {filteredNfts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredNfts.map((nft, index) => (
              <NftCard key={index} nft={nft} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-xl font-bold text-gray-700 mb-2">NFT가 없습니다</h3>
            <p className="text-gray-500 mb-6">
              {filter === 'all' 
                ? '아직 획득한 NFT가 없습니다.' 
                : filter === 'badges' 
                  ? '아직 획득한 배지가 없습니다.' 
                  : filter === 'rewards' 
                    ? '아직 획득한 보상이 없습니다.' 
                    : '아직 획득한 업적이 없습니다.'}
              <br />
              미션을 수행하여 특별한 NFT를 획득해보세요!
            </p>
            <Link
              to="/missions"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              미션 찾아보기
            </Link>
          </div>
        )}
      </div>
      
      {/* NFT 상세 정보 모달 */}
      {isModalOpen && selectedNft && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl overflow-hidden max-w-md w-full">
            <div className="relative aspect-square bg-gray-100">
              {selectedNft.imageUrl ? (
                <img 
                  src={selectedNft.imageUrl} 
                  alt={selectedNft.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              )}
              
              <button 
                className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1"
                onClick={() => setIsModalOpen(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">{selectedNft.name}</h2>
                
                {selectedNft.rarity && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                    {selectedNft.rarity >= 9 ? '레전더리' : 
                    selectedNft.rarity >= 7 ? '에픽' : 
                    selectedNft.rarity >= 5 ? '레어' : 
                    selectedNft.rarity >= 3 ? '언커먼' : '커먼'}
                  </span>
                )}
              </div>
              
              <p className="text-gray-600 mb-4">
                {selectedNft.description}
              </p>
              
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">획득 날짜:</span>
                  <span className="font-medium">{new Date(selectedNft.mintedAt).toLocaleDateString()}</span>
                </div>
                
                {selectedNft.source && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">획득 방법:</span>
                    <span className="font-medium">{selectedNft.source}</span>
                  </div>
                )}
                
                {selectedNft.tokenId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">토큰 ID:</span>
                    <span className="font-medium truncate max-w-[200px]">#{selectedNft.tokenId}</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-2">
                {badges.some(badge => badge.id === selectedNft.id) && (
                  <button
                    onClick={() => handleSetDisplayBadge(selectedNft.id)}
                    className={`w-full py-2 ${
                      user?.displayBadgeId === selectedNft.id
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-purple-600 text-white'
                    } rounded-lg`}
                    disabled={user?.displayBadgeId === selectedNft.id}
                  >
                    {user?.displayBadgeId === selectedNft.id ? '현재 대표 배지' : '대표 배지로 설정'}
                  </button>
                )}
                
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-2 bg-gray-100 text-gray-800 rounded-lg"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NftCollectionPage;
