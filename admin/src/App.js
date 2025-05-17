import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from './context/AuthContext';

// Layout
import MainLayout from './components/layout/MainLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import MissionManagement from './pages/MissionManagement';
import RewardsManagement from './pages/RewardsManagement';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

const App = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  // 권한 확인
  const isAdmin = user && (user.role === 'admin' || user.role === 'superadmin');

  // 로드 중이면 로딩 인디케이터 표시
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // 인증된 사용자만 접근 가능한 라우트를 위한 래퍼 컴포넌트
  const PrivateRoute = ({ children }) => {
    return isAuthenticated ? (
      isAdmin ? (
        children
      ) : (
        // 인증은 됐지만 관리자가 아닌 경우
        <Navigate to="/unauthorized" state={{ from: location }} replace />
      )
    ) : (
      // 인증되지 않은 경우 로그인 페이지로 리디렉션
      <Navigate to="/login" state={{ from: location }} replace />
    );
  };

  return (
    <Routes>
      {/* 공개 라우트 */}
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
      
      {/* 관리자 라우트 */}
      <Route path="/" element={
        <PrivateRoute>
          <MainLayout />
        </PrivateRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="missions" element={<MissionManagement />} />
        <Route path="rewards" element={<RewardsManagement />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      
      {/* 404 페이지 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
