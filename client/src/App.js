import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 레이아웃 및 공통 컴포넌트
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// 페이지
import HomePage from './pages/home/HomePage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProfilePage from './pages/profile/ProfilePage';
import MissionsListPage from './pages/missions/MissionsListPage';
import MissionDetailPage from './pages/missions/MissionDetailPage';
import NftCollectionPage from './pages/nfts/NftCollectionPage';
import TokenSwapPage from './pages/tokens/TokenSwapPage';
import NotFoundPage from './pages/NotFoundPage';

// 컨텍스트 프로바이더
import { useAuth } from './context/AuthContext';
import { TokenProvider } from './context/TokenContext';
import { XpProvider } from './context/XpContext';
import { NftProvider } from './context/NftContext';

/**
 * 앱 컴포넌트
 * 
 * 라우팅 및 전역 상태 관리를 설정합니다.
 * 모든 컨텍스트 프로바이더를 포함하고 있습니다.
 */
function App() {
  const { user, isLoading, checkAuthStatus } = useAuth();
  
  // 페이지 로드 시 인증 상태 확인
  useEffect(() => {
    checkAuthStatus();
  }, []);
  
  // 인증 상태 로딩 중이면 로딩 화면 표시
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <TokenProvider>
      <XpProvider>
        <NftProvider>
          <Routes>
            {/* 레이아웃 적용 라우트 */}
            <Route path="/" element={<Layout />}>
              {/* 공개 라우트 */}
              <Route index element={<HomePage />} />
              
              {/* 보호된 라우트 */}
              <Route path="dashboard" element={
                user ? <DashboardPage /> : <Navigate to="/" replace />
              } />
              <Route path="profile" element={
                user ? <ProfilePage /> : <Navigate to="/" replace />
              } />
              <Route path="missions" element={
                user ? <MissionsListPage /> : <Navigate to="/" replace />
              } />
              <Route path="missions/:id" element={
                user ? <MissionDetailPage /> : <Navigate to="/" replace />
              } />
              <Route path="nfts" element={
                user ? <NftCollectionPage /> : <Navigate to="/" replace />
              } />
              <Route path="tokens/swap" element={
                user ? <TokenSwapPage /> : <Navigate to="/" replace />
              } />
              
              {/* 404 페이지 */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
          
          {/* 토스트 알림 */}
          <ToastContainer 
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </NftProvider>
      </XpProvider>
    </TokenProvider>
  );
}

export default App;
