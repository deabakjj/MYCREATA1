import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNft } from '../../context/NftContext';
import { useXp } from '../../context/XpContext';
import NestIdRegistration from '../../components/auth/NestIdRegistration';

/**
 * 프로필 페이지 컴포넌트
 * 
 * 사용자의 프로필 정보, NestID 관리, 대표 배지 설정 등
 * 사용자 계정 관련 기능을 제공합니다.
 */
const ProfilePage = () => {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { badges, setDisplayBadge, isLoading: nftLoading } = useNft();
  const { xp, level, rank, isLoading: xpLoading } = useXp();
  
  // 프로필 수정 상태
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // 사용자 정보 로드
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
    }
  }, [user]);
  
  // 프로필 저장 핸들러
  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      setErrorMessage('닉네임을 입력해주세요.');
      return;
    }
    
    try {
      setIsSaving(true);
      setErrorMessage('');
      
      const token = localStorage.getItem('nest-auth-token');
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          displayName,
          bio
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      const result = await response.json();
      
      // 성공 메시지 설정
      setSuccessMessage('프로필이 성공적으로 업데이트되었습니다.');
      
      // 편집 모드 종료
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setErrorMessage('프로필 업데이트 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // 배지 선택 핸들러
  const handleSelectBadge = async (badgeId) => {
    try {
      await setDisplayBadge(badgeId);
      setSuccessMessage('대표 배지가 변경되었습니다.');
    } catch (err) {
      console.error('Error setting display badge:', err);
      setErrorMessage('배지 설정 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };
  
  // 로그아웃 핸들러
  const handleLogout = async () => {
    try {
      await logout();
      // 로그아웃 후 홈페이지로 리다이렉션은 AuthContext에서 처리
    } catch (err) {
      console.error('Error logging out:', err);
      setErrorMessage('로그아웃 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };
  
  if (authLoading || nftLoading || xpLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-gray-800">로그인이 필요합니다</h1>
          <p className="text-gray-600 mb-6">프로필을 확인하려면 로그인해주세요.</p>
          <a href="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            로그인 페이지로 이동
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">내 프로필</h1>
        <p className="text-gray-600 mb-8">계정 정보를 관리하고 NestID를 등록하세요</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽 열: 프로필 정보 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              {errorMessage && (
                <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
                  {errorMessage}
                </div>
              )}
              
              {successMessage && (
                <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg">
                  {successMessage}
                </div>
              )}
              
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center">
                  <div className="relative">
                    {user.profileImageUrl ? (
                      <img 
                        src={user.profileImageUrl} 
                        alt="프로필 이미지" 
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    
                    {user.displayBadgeId && badges.length > 0 && (
                      <div className="absolute -bottom-2 -right-2">
                        {badges.map((badge, index) => (
                          badge.id === user.displayBadgeId && (
                            <img 
                              key={index}
                              src={badge.imageUrl} 
                              alt={badge.name} 
                              className="w-10 h-10 rounded-full border-2 border-white"
                            />
                          )
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4">
                    <h2 className="text-2xl font-bold">{user.displayName || '익명 사용자'}</h2>
                    <p className="text-blue-600">
                      {user.nestId ? `${user.nestId}.nest` : '아직 등록된 NestID가 없습니다'}
                    </p>
                    
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <span className="flex items-center mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        레벨 {level}
                      </span>
                      
                      <span className="flex items-center mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        랭킹 {rank || '-'}
                      </span>
                      
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {xp} XP
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {isEditing ? '취소' : '프로필 편집'}
                </button>
              </div>
              
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                      닉네임
                    </label>
                    <input
                      type="text"
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      maxLength={20}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                      자기소개
                    </label>
                    <textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-32"
                      maxLength={200}
                      placeholder="자신을 간단히 소개해주세요 (최대 200자)"
                    ></textarea>
                    <p className="text-xs text-gray-500 text-right mt-1">
                      {bio.length}/200
                    </p>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? '저장 중...' : '저장하기'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-bold mb-2 text-gray-800">자기소개</h3>
                  <p className="text-gray-600 mb-6">
                    {bio || '아직 작성된 자기소개가 없습니다.'}
                  </p>
                  
                  <h3 className="text-lg font-bold mb-2 text-gray-800">계정 정보</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-500">이메일</span>
                      <span className="font-medium">{user.email}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-500">가입일</span>
                      <span className="font-medium">
                        {user.createdAt 
                          ? new Date(user.createdAt).toLocaleDateString() 
                          : '정보 없음'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-500">로그인 방식</span>
                      <span className="font-medium capitalize">
                        {user.authProvider || '이메일'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-500">지갑 주소</span>
                      <span className="font-medium text-sm truncate max-w-[250px]">
                        {user.walletAddress || '정보 없음'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* NestID 등록 섹션 */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold mb-6 text-gray-800">NestID 관리</h2>
              <NestIdRegistration />
            </div>
            
            {/* 로그아웃 버튼 */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-6 text-gray-800">계정 관리</h2>
              
              <button
                onClick={handleLogout}
                className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
          
          {/* 오른쪽 열: 배지 및 활동 */}
          <div>
            {/* 대표 배지 섹션 */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold mb-4 text-gray-800">대표 배지</h2>
              
              {badges.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-4">
                  {badges.map((badge, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-2 cursor-pointer transition-all ${
                        user.displayBadgeId === badge.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => handleSelectBadge(badge.id)}
                    >
                      <div className="aspect-square bg-gray-100 rounded-md mb-2 overflow-hidden">
                        {badge.imageUrl ? (
                          <img
                            src={badge.imageUrl}
                            alt={badge.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-center">
                        <p className="font-medium text-sm truncate">{badge.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {new Date(badge.mintedAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {user.displayBadgeId === badge.id && (
                        <div className="mt-2 text-center">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            현재 대표 배지
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-gray-500 mb-4">
                    아직 획득한 배지가 없습니다.
                    <br />
                    미션을 수행하여 특별한 배지를 획득해보세요!
                  </p>
                  <a 
                    href="/missions" 
                    className="text-blue-600 hover:underline"
                  >
                    미션 찾아보기
                  </a>
                </div>
              )}
            </div>
            
            {/* 최근 활동 섹션 */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">최근 활동</h2>
              
              {user.activities && user.activities.length > 0 ? (
                <div className="space-y-4">
                  {user.activities.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                        {activity.type === 'mission_completed' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        {activity.type === 'nft_received' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                          </svg>
                        )}
                        {activity.type === 'token_earned' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        {activity.type === 'level_up' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        )}
                        {activity.type === 'check_in' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <p className="font-medium text-sm">{activity.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.createdAt).toLocaleDateString()} {new Date(activity.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      
                      {activity.reward && (
                        <div className="ml-4">
                          <div className="flex items-center text-sm">
                            {activity.reward.type === 'xp' && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                +{activity.reward.amount} XP
                              </span>
                            )}
                            {activity.reward.type === 'nest' && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                +{activity.reward.amount} NEST
                              </span>
                            )}
                            {activity.reward.type === 'badge' && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                배지 획득
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500 mb-4">
                    아직 활동 기록이 없습니다.
                    <br />
                    미션에 참여하고 다양한 활동을 통해 보상을 받아보세요!
                  </p>
                  <a 
                    href="/missions" 
                    className="text-blue-600 hover:underline"
                  >
                    미션 찾아보기
                  </a>
                </div>
              )}
              
              {user.activities && user.activities.length > 5 && (
                <div className="mt-4 text-center">
                  <a 
                    href="/activity" 
                    className="text-blue-600 hover:underline"
                  >
                    모든 활동 보기
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
