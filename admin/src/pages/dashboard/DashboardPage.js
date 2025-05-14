import React, { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  CurrencyDollarIcon, 
  CollectionIcon, 
  ClipboardCheckIcon 
} from '@heroicons/react/outline';
import Layout from '../../components/layout/Layout';
import StatsCard from '../../components/dashboard/StatsCard';
import RecentActivitiesCard from '../../components/dashboard/RecentActivitiesCard';
import PopularMissionsCard from '../../components/dashboard/PopularMissionsCard';
import TokenEconomyChart from '../../components/dashboard/TokenEconomyChart';
import UserActivityChart from '../../components/dashboard/UserActivityChart';

/**
 * 관리자 대시보드 페이지
 */
const DashboardPage = () => {
  // 통계 데이터 상태
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTokens: 0,
    tokenExchangeRate: 0,
    totalNFTs: 0,
    activeMissions: 0,
    completedMissions: 0
  });
  
  // 데이터 로딩 상태
  const [loading, setLoading] = useState(true);
  
  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // API 호출 (실제로는 API 서비스 사용)
        // const response = await dashboardService.getStats();
        
        // 임시 데이터 (개발용)
        setTimeout(() => {
          setStats({
            totalUsers: 1234,
            activeUsers: 567,
            totalTokens: 10000000,
            tokenExchangeRate: 1000,
            totalNFTs: 789,
            activeMissions: 45,
            completedMissions: 123
          });
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('대시보드 데이터 로드 오류:', error);
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // 통계 카드 데이터
  const statsCards = [
    {
      title: '전체 사용자',
      value: stats.totalUsers.toLocaleString(),
      subtitle: `활성 사용자: ${stats.activeUsers.toLocaleString()}`,
      icon: <UsersIcon className="h-8 w-8 text-blue-500" />,
      color: 'blue'
    },
    {
      title: 'NEST 토큰',
      value: stats.totalTokens.toLocaleString(),
      subtitle: `교환 비율: 1 CTA = ${stats.tokenExchangeRate} NEST`,
      icon: <CurrencyDollarIcon className="h-8 w-8 text-green-500" />,
      color: 'green'
    },
    {
      title: '발행된 NFT',
      value: stats.totalNFTs.toLocaleString(),
      subtitle: '다양한 NFT 뱃지와 보상',
      icon: <CollectionIcon className="h-8 w-8 text-purple-500" />,
      color: 'purple'
    },
    {
      title: '미션',
      value: stats.activeMissions.toLocaleString(),
      subtitle: `완료된 미션: ${stats.completedMissions}`,
      icon: <ClipboardCheckIcon className="h-8 w-8 text-orange-500" />,
      color: 'orange'
    }
  ];
  
  return (
    <Layout>
      <div className="container mx-auto">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">대시보드</h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* 통계 카드 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statsCards.map((card, index) => (
                <StatsCard
                  key={index}
                  title={card.title}
                  value={card.value}
                  subtitle={card.subtitle}
                  icon={card.icon}
                  color={card.color}
                />
              ))}
            </div>
            
            {/* 차트 및 활동 내역 그리드 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* 토큰 이코노미 차트 */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">토큰 이코노미</h2>
                <TokenEconomyChart />
              </div>
              
              {/* 사용자 활동 차트 */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">사용자 활동</h2>
                <UserActivityChart />
              </div>
            </div>
            
            {/* 추가 정보 그리드 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 최근 활동 */}
              <RecentActivitiesCard />
              
              {/* 인기 미션 */}
              <PopularMissionsCard />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default DashboardPage;
