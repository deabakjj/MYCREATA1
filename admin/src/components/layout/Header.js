import React from 'react';
import { BellIcon, MenuIcon } from '@heroicons/react/outline';

/**
 * 관리자 패널 헤더 컴포넌트
 * @param {Object} props - 속성
 * @param {function} props.toggleSidebar - 사이드바 토글 함수
 */
const Header = ({ toggleSidebar }) => {
  return (
    <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
      {/* 좌측: 햄버거 메뉴 */}
      <button
        className="md:hidden text-gray-600 focus:outline-none"
        onClick={toggleSidebar}
      >
        <MenuIcon className="w-6 h-6" />
      </button>
      
      {/* 타이틀 */}
      <div className="md:ml-0 ml-4">
        <h1 className="text-xl font-semibold text-gray-800">Nest 관리자</h1>
      </div>
      
      {/* 우측: 알림 및 프로필 */}
      <div className="flex items-center space-x-4">
        {/* 알림 */}
        <div className="relative">
          <button className="text-gray-600 focus:outline-none">
            <BellIcon className="w-6 h-6" />
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
              3
            </span>
          </button>
        </div>
        
        {/* 프로필 */}
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            <img
              src="/admin-avatar.jpg"
              alt="Admin"
              className="h-full w-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/32';
              }}
            />
          </div>
          <span className="ml-2 text-sm font-medium text-gray-700 hidden md:block">
            관리자
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
