import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useXp } from '../../context/XpContext';

/**
 * 미션 목록 페이지 컴포넌트
 * 
 * 사용자가 참여할 수 있는 미션 목록을 표시하고
 * 필터링 및 카테고리별 정렬 기능을 제공합니다.
 */
const MissionsListPage = () => {
  const { user } = useAuth();
  const { missions, activeMissions, completedMissions, loadMissions, startMission, isLoading } = useXp();
  
  // 미션 필터 및 정렬 상태
  const [filter, setFilter] = useState('all'); // all, active, completed
  const [category, setCategory] = useState('all'); // all, daily, weekly, special
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, xp-high, xp-low
  
  // 필터링된 미션 목록
  const [filteredMissions, setFilteredMissions] = useState([]);
  
  // 미션 로드
  useEffect(() => {
    loadMissions();
  }, []);
  
  // 미션 필터링 및 정렬
  useEffect(() => {
    if (!missions) return;
    
    let filtered = [...missions];
    
    // 상태 필터링
    if (filter === 'active') {
      filtered = filtered.filter(mission => 
        activeMissions.some(am => am.id === mission.id)
      );
    } else if (filter === 'completed') {
      filtered = filtered.filter(mission => 
        completedMissions.some(cm => cm.id === mission.id)
      );
    } else if (filter === 'available') {
      filtered = filtered.filter(mission => 
        !activeMissions.some(am => am.id === mission.id) && 
        !completedMissions.some(cm => cm.id === mission.id)
      );
    }
    
    // 카테고리 필터링
    if (category !== 'all') {
      filtered = filtered.filter(mission => mission.category === category);
    }
    
    // 검색어 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(mission => 
        mission.title.toLowerCase().includes(query) || 
        mission.description.toLowerCase().includes(query)
      );
    }
    
    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'xp-high':
          return b.xpReward - a.xpReward;
        case 'xp-low':
          return a.xpReward - b.xpReward;
        case 'newest':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
    
    setFilteredMissions(filtered);
  }, [missions, activeMissions, completedMissions, filter, category, searchQuery, sortBy]);
  
  // 미션 시작 핸들러
  const handleStartMission = async (missionId) => {
    await startMission(missionId);
  };
  
  // 미션 상태 배지 컴포넌트
  const MissionStatusBadge = ({ mission }) => {
    const isActive = activeMissions.some(am => am.id === mission.id);
    const isCompleted = completedMissions.some(cm => cm.id === mission.id);
    
    if (isCompleted) {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          완료됨
        </span>
      );
    } else if (isActive) {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          진행 중
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          참여 가능
        </span>
      );
    }
  };
  
  // 미션 카테고리 배지 컴포넌트
  const MissionCategoryBadge = ({ category }) => {
    switch (category) {
      case 'daily':
        return (
          <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
            데일리
          </span>
        );
      case 'weekly':
        return (
          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
            위클리
          </span>
        );
      case 'monthly':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
            먼슬리
          </span>
        );
      case 'special':
        return (
          <span className="px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-full">
            스페셜
          </span>
        );
      case 'community':
        return (
          <span className="px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-full">
            커뮤니티
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
            기타
          </span>
        );
    }
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
        <h1 className="text-3xl font-bold mb-2 text-gray-800">미션</h1>
        <p className="text-gray-600 mb-8">다양한 미션을 수행하고 보상을 획득하세요</p>
        
        {/* 필터 및 검색 영역 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div className="flex flex-wrap gap-2">
              <button 
                className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setFilter('all')}
              >
                전체
              </button>
              <button 
                className={`px-4 py-2 rounded-lg ${filter === 'available' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setFilter('available')}
              >
                참여 가능
              </button>
              <button 
                className={`px-4 py-2 rounded-lg ${filter === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setFilter('active')}
              >
                진행 중
              </button>
              <button 
                className={`px-4 py-2 rounded-lg ${filter === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setFilter('completed')}
              >
                완료됨
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
                <option value="xp-high">경험치 높은순</option>
                <option value="xp-low">경험치 낮은순</option>
              </select>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="미션 검색..."
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
            
            <div>
              <select 
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg w-full md:w-auto"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="all">모든 카테고리</option>
                <option value="daily">데일리</option>
                <option value="weekly">위클리</option>
                <option value="monthly">먼슬리</option>
                <option value="special">스페셜</option>
                <option value="community">커뮤니티</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* 미션 목록 */}
        {filteredMissions.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredMissions.map((mission, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex gap-2 mb-2">
                        <MissionStatusBadge mission={mission} />
                        <MissionCategoryBadge category={mission.category} />
                      </div>
                      <h2 className="text-xl font-bold mb-2">{mission.title}</h2>
                      <p className="text-gray-600 mb-4">{mission.description}</p>
                    </div>
                    
                    {mission.difficulty && (
                      <div className="flex items-center">
                        <div className="flex">
                          {Array.from({ length: mission.difficulty }, (_, i) => (
                            <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                          {Array.from({ length: 5 - mission.difficulty }, (_, i) => (
                            <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      +{mission.xpReward} XP
                    </div>
                    
                    {mission.nestReward > 0 && (
                      <div className="px-3 py-1.5 bg-green-100 text-green-800 rounded-lg flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        +{mission.nestReward} NEST
                      </div>
                    )}
                    
                    {mission.nftReward && (
                      <div className="px-3 py-1.5 bg-purple-100 text-purple-800 rounded-lg flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        NFT 보상
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-center">
                    {mission.deadline && (
                      <p className="text-sm text-gray-500 flex items-center mb-4 sm:mb-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(mission.deadline).toLocaleDateString()} 까지
                      </p>
                    )}
                    
                    <div className="flex gap-3">
                      {activeMissions.some(am => am.id === mission.id) ? (
                        <Link
                          to={`/missions/${mission.id}`}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          계속하기
                        </Link>
                      ) : completedMissions.some(cm => cm.id === mission.id) ? (
                        <Link
                          to={`/missions/${mission.id}`}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          다시보기
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleStartMission(mission.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          시작하기
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-bold text-gray-700 mb-2">미션이 없습니다</h3>
            <p className="text-gray-500 mb-6">
              {filter === 'all' 
                ? '현재 사용 가능한 미션이 없습니다.' 
                : filter === 'active' 
                  ? '현재 진행 중인 미션이 없습니다.' 
                  : filter === 'completed' 
                    ? '완료한 미션이 없습니다.' 
                    : '현재 참여 가능한 미션이 없습니다.'}
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                모든 미션 보기
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MissionsListPage;
