import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useXp } from '../../context/XpContext';

/**
 * 미션 상세 페이지 컴포넌트
 * 
 * 선택한 미션의 세부 정보를 표시하고
 * 미션 참여, 제출, 완료 기능을 제공합니다.
 */
const MissionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    missions, 
    activeMissions, 
    completedMissions, 
    loadMissions, 
    startMission, 
    completeMission, 
    isLoading 
  } = useXp();
  
  const [mission, setMission] = useState(null);
  const [missionStatus, setMissionStatus] = useState('available'); // available, active, completed
  const [submissionData, setSubmissionData] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // 미션 데이터 로드
  useEffect(() => {
    loadMissions();
  }, []);
  
  // 현재 미션 데이터 및 상태 설정
  useEffect(() => {
    if (missions && missions.length > 0) {
      const currentMission = missions.find(m => m.id === id);
      
      if (currentMission) {
        setMission(currentMission);
        
        // 미션 상태 확인
        if (completedMissions.some(cm => cm.id === id)) {
          setMissionStatus('completed');
        } else if (activeMissions.some(am => am.id === id)) {
          setMissionStatus('active');
        } else {
          setMissionStatus('available');
        }
      } else {
        // 미션을 찾을 수 없는 경우
        navigate('/missions', { replace: true });
      }
    }
  }, [missions, activeMissions, completedMissions, id]);
  
  // 미션 시작 핸들러
  const handleStartMission = async () => {
    try {
      setErrorMessage('');
      const result = await startMission(id);
      
      if (result) {
        setMissionStatus('active');
        setSuccessMessage('미션이 시작되었습니다! 미션을 완료하고 보상을 획득하세요.');
      }
    } catch (error) {
      setErrorMessage('미션을 시작하는 중 오류가 발생했습니다. 다시 시도해주세요.');
      console.error('Error starting mission:', error);
    }
  };
  
  // 미션 제출 핸들러
  const handleSubmitMission = async () => {
    if (!submissionData.trim()) {
      setErrorMessage('미션 제출 내용을 입력해주세요.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setErrorMessage('');
      
      const result = await completeMission(id, submissionData);
      
      if (result) {
        setMissionStatus('completed');
        setSuccessMessage('미션이 성공적으로 완료되었습니다! 보상이 지급되었습니다.');
      }
    } catch (error) {
      setErrorMessage('미션 제출 중 오류가 발생했습니다. 다시 시도해주세요.');
      console.error('Error completing mission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading || !mission) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <button 
            onClick={() => navigate('/missions')}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            미션 목록으로 돌아가기
          </button>
        </div>
        
        {/* 미션 헤더 */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start">
              <div>
                <div className="flex gap-2 mb-3">
                  {/* 미션 상태 배지 */}
                  {missionStatus === 'completed' ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      완료됨
                    </span>
                  ) : missionStatus === 'active' ? (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      진행 중
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      참여 가능
                    </span>
                  )}
                  
                  {/* 미션 카테고리 배지 */}
                  {mission.category === 'daily' && (
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full">
                      데일리
                    </span>
                  )}
                  {mission.category === 'weekly' && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                      위클리
                    </span>
                  )}
                  {mission.category === 'monthly' && (
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                      먼슬리
                    </span>
                  )}
                  {mission.category === 'special' && (
                    <span className="px-3 py-1 bg-pink-100 text-pink-800 text-sm rounded-full">
                      스페셜
                    </span>
                  )}
                  {mission.category === 'community' && (
                    <span className="px-3 py-1 bg-teal-100 text-teal-800 text-sm rounded-full">
                      커뮤니티
                    </span>
                  )}
                </div>
                
                <h1 className="text-3xl font-bold mb-3">{mission.title}</h1>
                
                {mission.deadline && (
                  <p className="text-blue-100 flex items-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(mission.deadline).toLocaleDateString()} 까지
                  </p>
                )}
              </div>
              
              <div className="mt-6 md:mt-0 flex flex-col items-end">
                {mission.difficulty && (
                  <div className="flex mb-3">
                    <span className="text-sm text-blue-100 mr-2">난이도:</span>
                    <div className="flex">
                      {Array.from({ length: mission.difficulty }, (_, i) => (
                        <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      {Array.from({ length: 5 - mission.difficulty }, (_, i) => (
                        <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white opacity-30" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                )}
                
                {mission.estimatedTime && (
                  <div className="flex items-center text-sm text-blue-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    예상 소요 시간: {mission.estimatedTime}분
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {/* 보상 정보 */}
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                +{mission.xpReward} XP
              </div>
              
              {mission.nestReward > 0 && (
                <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  +{mission.nestReward} NEST
                </div>
              )}
              
              {mission.nftReward && (
                <div className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  NFT 보상: {mission.nftReward.name || '특별 NFT'}
                </div>
              )}
            </div>
            
            {/* 미션 설명 */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 text-gray-800">미션 설명</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-line">{mission.description}</p>
                
                {mission.requirements && (
                  <div className="mt-6">
                    <h3 className="text-lg font-bold mb-2 text-gray-800">미션 요구사항</h3>
                    <ul className="list-disc pl-6 space-y-2 text-gray-700">
                      {mission.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {mission.tips && (
                  <div className="mt-6">
                    <h3 className="text-lg font-bold mb-2 text-gray-800">미션 팁</h3>
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                      <p className="text-gray-700">{mission.tips}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* 미션 참여 섹션 */}
            <div>
              {errorMessage && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
                  {errorMessage}
                </div>
              )}
              
              {successMessage && (
                <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
                  {successMessage}
                </div>
              )}
              
              {missionStatus === 'available' ? (
                <div className="text-center">
                  <button
                    onClick={handleStartMission}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    미션 시작하기
                  </button>
                </div>
              ) : missionStatus === 'active' ? (
                <div>
                  <h3 className="text-lg font-bold mb-3 text-gray-800">미션 제출</h3>
                  
                  <div className="mb-4">
                    <textarea
                      value={submissionData}
                      onChange={(e) => setSubmissionData(e.target.value)}
                      placeholder="미션 결과물을 입력하세요..."
                      className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    ></textarea>
                  </div>
                  
                  <div className="text-center">
                    <button
                      onClick={handleSubmitMission}
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? '제출 중...' : '미션 제출하기'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-green-100 p-6 rounded-lg text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-green-800">미션 완료!</h3>
                  <p className="text-green-700 mb-4">
                    미션을 성공적으로 완료했습니다. 보상이 지급되었습니다.
                  </p>
                  
                  {mission.completedAt && (
                    <p className="text-sm text-green-600">
                      완료 일시: {new Date(mission.completedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 관련 미션 추천 */}
        {mission.relatedMissions && mission.relatedMissions.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">관련 미션</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mission.relatedMissions.map((relatedMission, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <h3 className="font-bold mb-2">{relatedMission.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{relatedMission.description}</p>
                  
                  <div className="flex gap-2 mb-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      +{relatedMission.xpReward} XP
                    </span>
                  </div>
                  
                  <button
                    onClick={() => navigate(`/missions/${relatedMission.id}`)}
                    className="w-full py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    미션 보기
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MissionDetailPage;
