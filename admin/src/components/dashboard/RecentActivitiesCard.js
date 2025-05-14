import React, { useState, useEffect } from 'react';
import { 
  UserAddIcon, 
  CurrencyDollarIcon, 
  CollectionIcon, 
  ClipboardCheckIcon 
} from '@heroicons/react/outline';

/**
 * 최근 활동 카드 컴포넌트
 */
const RecentActivitiesCard = () => {
  // 최근 활동 데이터 상태
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // API 호출 (실제로는 API 서비스 사용)
        // const response = await activityService.getRecentActivities();
        
        // 임시 데이터 (개발용)
        setTimeout(() => {
          setActivities([
            {
              id: 1,
              type: 'user_register',
              user: '김민수',
              nestId: 'minsu.nest',
              timestamp: new Date(Date.now() - 25 * 60 * 1000), // 25분 전
              description: '새로운 사용자 등록'
            },
            {
              id: 2,
              type: 'token_transfer',
              user: '이지현',
              nestId: 'jihyun.nest',
              amount: 500,
              timestamp: new Date(Date.now() - 42 * 60 * 1000), // 42분 전
              description: '미션 완료 토큰 보상'
            },
            {
              id: 3,
              type: 'nft_mint',
              user: '박준호',
              nestId: 'junho.nest',
              nftId: 'Level5Badge',
              timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5시간 전
              description: '레벨 5 달성 뱃지 획득'
            },
            {
              id: 4,
              type: 'mission_complete',
              user: '최수영',
              nestId: 'sooyoung.nest',
              missionId: 'daily-check-in',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2시간 전
              description: '일일 출석 체크 미션 완료'
            },
            {
              id: 5,
              type: 'token_swap',
              user: '정다운',
              nestId: 'dawoon.nest',
              fromAmount: 0.1,
              fromToken: 'CTA',
              toAmount: 100,
              toToken: 'NEST',
              timestamp: new Date(Date.now() - 3.2 * 60 * 60 * 1000), // 3.2시간 전
              description: 'CTA ↔ NEST 토큰 스왑'
            }
          ]);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('최근 활동 데이터 로드 오류:', error);
        setLoading(false);
      }
    };
    
    fetchActivities();
  }, []);
  
  // 활동 유형에 따른 아이콘 매핑
  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_register':
        return <UserAddIcon className="h-6 w-6 text-blue-500" />;
      case 'token_transfer':
      case 'token_swap':
        return <CurrencyDollarIcon className="h-6 w-6 text-green-500" />;
      case 'nft_mint':
        return <CollectionIcon className="h-6 w-6 text-purple-500" />;
      case 'mission_complete':
        return <ClipboardCheckIcon className="h-6 w-6 text-orange-500" />;
      default:
        return <UserAddIcon className="h-6 w-6 text-gray-500" />;
    }
  };
  
  // 상대적 시간 표시 (예: "5분 전")
  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const diffMs = now - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    
    if (diffMin < 1) {
      return '방금 전';
    } else if (diffMin < 60) {
      return `${diffMin}분 전`;
    } else if (diffHour < 24) {
      return `${diffHour}시간 전`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">최근 활동</h2>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {activity.description}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {activity.nestId ? (
                    <span className="font-medium">{activity.nestId}</span>
                  ) : (
                    <span className="font-medium">{activity.user}</span>
                  )}
                  {activity.amount && (
                    <span> • {activity.amount} {activity.toToken || 'NEST'}</span>
                  )}
                </p>
              </div>
              <div className="flex-shrink-0 text-xs text-gray-500">
                {getRelativeTime(activity.timestamp)}
              </div>
            </div>
          ))}
          
          {activities.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              최근 활동이 없습니다.
            </p>
          )}
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          className="text-sm font-medium text-primary hover:text-primary-dark"
          onClick={() => {/* 모든 활동 보기 */}}
        >
          모든 활동 보기
        </button>
      </div>
    </div>
  );
};

export default RecentActivitiesCard;
