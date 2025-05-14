import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  ClipboardListIcon,
  GiftIcon,
  ChartBarIcon,
  CogIcon,
  LogoutIcon
} from '@heroicons/react/outline';

/**
 * 관리자 패널 사이드바 컴포넌트
 */
const Sidebar = () => {
  const location = useLocation();
  
  // 현재 활성화된 메뉴 아이템 확인
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  // 메뉴 아이템 목록
  const menuItems = [
    {
      title: '대시보드',
      path: '/admin',
      icon: <HomeIcon className="w-6 h-6" />
    },
    {
      title: '사용자 관리',
      path: '/admin/users',
      icon: <UsersIcon className="w-6 h-6" />
    },
    {
      title: '미션 관리',
      path: '/admin/missions',
      icon: <ClipboardListIcon className="w-6 h-6" />
    },
    {
      title: '보상 관리',
      path: '/admin/rewards',
      icon: <GiftIcon className="w-6 h-6" />
    },
    {
      title: '통계',
      path: '/admin/stats',
      icon: <ChartBarIcon className="w-6 h-6" />
    },
    {
      title: '설정',
      path: '/admin/settings',
      icon: <CogIcon className="w-6 h-6" />
    }
  ];
  
  return (
    <div className="bg-primary-dark text-white h-screen w-64 flex flex-col">
      {/* 로고 */}
      <div className="p-6 flex items-center">
        <img src="/logo.svg" alt="Nest Admin" className="h-8 w-auto" />
        <span className="ml-3 text-xl font-bold">Nest Admin</span>
      </div>
      
      {/* 메뉴 아이템 */}
      <nav className="flex-1 overflow-y-auto">
        <ul className="px-2 py-4">
          {menuItems.map((item) => (
            <li key={item.path} className="mb-2">
              <Link
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary text-white'
                    : 'hover:bg-primary-light/20'
                }`}
              >
                {item.icon}
                <span className="ml-3">{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* 로그아웃 버튼 */}
      <div className="p-4 border-t border-gray-700">
        <button
          className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-primary-light/20 transition-colors"
          onClick={() => {/* 로그아웃 처리 */}}
        >
          <LogoutIcon className="w-6 h-6" />
          <span className="ml-3">로그아웃</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
