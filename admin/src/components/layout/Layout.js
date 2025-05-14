import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

/**
 * 관리자 패널 레이아웃 컴포넌트
 * @param {Object} props - 속성
 * @param {React.ReactNode} props.children - 자식 컴포넌트
 */
const Layout = ({ children }) => {
  // 모바일에서 사이드바 표시 여부
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // 사이드바 토글 함수
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* 사이드바 - 데스크톱 */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      
      {/* 사이드바 - 모바일 */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* 배경 오버레이 */}
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={toggleSidebar}
            aria-hidden="true"
          ></div>
          
          {/* 사이드바 */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-primary-dark">
            <Sidebar />
          </div>
        </div>
      )}
      
      {/* 메인 콘텐츠 */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header toggleSidebar={toggleSidebar} />
        
        {/* 페이지 콘텐츠 */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
