import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useXp } from '../../context/XpContext';
import { useToken } from '../../context/TokenContext';
import { useNft } from '../../context/NftContext';

/**
 * 대시보드 페이지 컴포넌트
 * 
 * 로그인한 사용자의 메인 대시보드를 제공합니다.
 * 사용자의 활동, 보상, XP, 미션 상태 등을 표시합니다.
 */
const DashboardPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { 
    xp, 
    level, 
    rank, 
    activeMissions, 
    loadXpData, 
    loadMissions, 
    isLoading: xpLoading 
  } = useXp();
  const { 
    nestBalance, 
    ctaBalance, 
    loadBalances, 
    isLoading: tokenLoading 
  } = useToken();
  const { 
    badges, 
    loadNfts, 
    isLoading: nftLoading 
  } = useNft();

  // 비로그인 사용자는 홈으로 리다이렉트
  if (!user && !authLoading) {
    return <Navigate to="/" replace />;
  }

  // 필요한 데이터 로드
  useEffect(() => {
    if (user) {
      loadXpData();
      loadMissions();
      loadBalances();
      loadNfts();
    }
  }, [user]);

  // 로딩 중 표시
  if (authLoading || xpLoading || tokenLoading || nftLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // XP 진행 상태 계산
  const calculateProgress = () => {
    const currentLevelXp = Math.pow(level - 1, 2) * 100;
    const nextLevelXp = Math.pow(level, 2) * 100;
    const xpRange = nextLevelXp - currentLevelXp;
    const userProgress = xp - currentLevelXp;
    
    return (userProgress / xpRange) * 100;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 환영 메시지 및 요약 정보 */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white p-8 mb-8 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                안녕하세요, {user?.displayName || '사용자'}님!
              </h1>
              <p className="text-blue-100 mb-4">
                오늘도 Nest에서 활동하고 보상을 받아보세요.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <p className="text-sm text-blue-100">레벨</p>
                  <p className="text-2xl font-bold">{level}</p>
                </div>
                
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <p className="text-sm text-blue-100">경험치</p>
                  <p className="text-2xl font-bold">{xp} XP</p>
                </div>
                
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <p className="text-sm text-blue-100">랭킹</p>
                  <p className="text-2xl font-bold">{rank || '-'}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 md:mt-0">
              <div className="flex flex-col items-center">
                <div className="relative">
                  {badges && badges.length > 0 ? (
                    <img 
                      src={badges[0].imageUrl} 
                      alt="대표 배지" 
                      className="w-24 h-24 rounded-full border-4 border-white"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1.5 border-2 border-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <p className="mt-2 font-medium">
                  {user?.nestId ? `${user.nestId}.nest` : '아직 등록된 ID가 없습니다'}
                </p>
              </div>
            </div>
          </div>
          
          {/* 레벨 진행 상황 */}
          <div className="mt-8">
            <div className="flex justify-between mb-2 text-sm">
              <span>레벨 {level}</span>
              <span>레벨 {level + 1}</span>
            </div>
            <div className="h-3 bg-blue-900 bg-opacity-30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                style={{ width: `${calculateProgress()}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 토큰 및 자산 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              내 토큰
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-xs">NEST</span>
                  </div>
                  <div>
                    <p className="font-medium">NEST Token</p>
                    <p className="text-sm text-gray-500">내부 포인트 / 보상</p>
                  </div>
                </div>
                <p className="text-xl font-bold">{nestBalance.toLocaleString()}</p>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-xs">CTA</span>
                  </div>
                  <div>
                    <p className="font-medium">CTA Token</p>
                    <p className="text-sm text-gray-500">교환 가능 토큰</p>
                  </div>
                </div>
                <p className="text-xl font-bold">{ctaBalance.toLocaleString()}</p>
              </div>
              
              <div className="flex justify-center mt-4">
                <button className="py-2 px-4 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors">
                  토큰 교환
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              내 NFT 컬렉션
            </h2>
            
            {badges && badges.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {badges.slice(0, 6).map((badge, index) => (
                  <div key={index} className="relative group">
                    <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={badge.imageUrl} 
                        alt={badge.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                      <span className="text-white text-xs font-medium px-2 py-1 text-center">
                        {badge.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  아직 획득한 NFT가 없습니다. 
                  <br />
                  미션을 수행하여 특별한 NFT를 획득해보세요!
                </p>
              </div>
            )}
            
            <div className="flex justify-center mt-4">
              <button className="py-2 px-4 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition-colors">
                컬렉션 보기
              </button>
            </div>
          </div>
        </div>

        {/* 활성 미션 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            활성 미션
          </h2>
          
          {activeMissions && activeMissions.length > 0 ? (
            <div className="space-y-4">
              {activeMissions.map((mission, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{mission.title}</h3>
                      <p className="text-gray-600 mb-3">{mission.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          +{mission.xpReward} XP
                        </span>
                        
                        {mission.nestReward > 0 && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            +{mission.nestReward} NEST
                          </span>
                        )}
                        
                        {mission.nftReward && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                            NFT 보상
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <button className="py-1.5 px-3 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                          미션으로 이동
                        </button>
                        
                        <div className="flex items-center text-sm text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {mission.deadline ? new Date(mission.deadline).toLocaleDateString() : '무기한'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4 flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-yellow-100 border-2 border-yellow-400 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <span className="text-xs mt-1 text-gray-500">진행 중</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-gray-500 mb-3">현재 진행 중인 미션이 없습니다.</p>
              <button className="py-2 px-4 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors">
                미션 찾아보기
              </button>
            </div>
          )}
        </div>

        {/* 빠른 액션 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            오늘의 활동
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors flex flex-col items-center justify-center text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <p className="font-medium">출석 체크</p>
              <p className="text-xs text-gray-500">+50 XP</p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors flex flex-col items-center justify-center text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="font-medium">댓글 작성</p>
              <p className="text-xs text-gray-500">+10 XP / 댓글</p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors flex flex-col items-center justify-center text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <p className="font-medium">미션 찾기</p>
              <p className="text-xs text-gray-500">다양한 미션에 참여하세요</p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors flex flex-col items-center justify-center text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <p className="font-medium">랭킹 확인</p>
              <p className="text-xs text-gray-500">현재 순위: {rank || '-'}</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
