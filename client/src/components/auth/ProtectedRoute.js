import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * 인증된 사용자만 접근 가능한 라우트를 보호하는 컴포넌트
 * 
 * @param {Object} props 컴포넌트 속성
 * @param {JSX.Element} props.children 보호할 자식 컴포넌트
 * @param {string} [props.redirectTo='/'] 인증되지 않은 경우 리디렉션할 경로
 * @returns {JSX.Element} 인증 상태에 따라 자식 컴포넌트 또는 리디렉션
 */
const ProtectedRoute = ({ children, redirectTo = '/' }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  
  // 인증 상태 로딩 중인 경우
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // 인증되지 않은 경우 리디렉션
  if (!user) {
    // 현재 위치를 state로 전달하여 로그인 후 원래 페이지로 돌아갈 수 있도록 함
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }
  
  // 인증된 경우 자식 컴포넌트 렌더링
  return children;
};

export default ProtectedRoute;
