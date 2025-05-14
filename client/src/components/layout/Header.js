import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToken } from '../../context/TokenContext';
import { useTheme } from '../../context/ThemeContext';

/**
 * 헤더 컴포넌트
 * 
 * 내비게이션 메뉴, 사용자 프로필 정보, 테마 전환 버튼을 포함하는
 * 앱 상단 헤더 컴포넌트입니다.
 */
const Header = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { nestBalance, ctaBalance } = useToken();
  const { theme, toggleTheme } = useTheme();
  
  // 모바일 메뉴 상태
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // 로그아웃 핸들러
  const handleLogout = async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  // 활성 네비게이션 스타일
  const activeNavStyle = "text-blue-600 font-bold";
  const defaultNavStyle = "text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400";
  
  return (
    <header className="bg-white shadow-sm dark:bg-gray-800 sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <Link to="/" className="flex items-center">
            <div className="bg-blue-600 text-white font-bold text-xl w-10 h-10 rounded-full flex items-center justify-center mr-2">
              N
            </div>
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">Nest</span>
          </Link>
          
          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex items-center space-x-6">
            {user ? (
              <>
                <NavLink 
                  to="/dashboard" 
                  className={location.pathname === '/dashboard' ? activeNavStyle : defaultNavStyle}
                >
                  대시보드
                </NavLink>
                <NavLink 
                  to="/missions" 
                  className={location.pathname.includes('/missions') ? activeNavStyle : defaultNavStyle}
                >
                  미션
                </NavLink>
                <NavLink 
                  to="/nfts" 
                  className={location.pathname === '/nfts' ? activeNavStyle : defaultNavStyle}
                >
                  NFT 컬렉션
                </NavLink>
                <NavLink 
                  to="/tokens/swap" 
                  className={location.pathname === '/tokens/swap' ? activeNavStyle : defaultNavStyle}
                >
                  토큰 교환
                </NavLink>
              </>
            ) : (
              <>
                <NavLink 
                  to="/" 
                  className={location.pathname === '/' ? activeNavStyle : defaultNavStyle}
                >
                  홈
                </NavLink>
                <a 
                  href="https://creatachain.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={defaultNavStyle}
                >
                  Creata Chain
                </a>
              </>
            )}
          </nav>
          
          {/* 사용자 프로필 및 로그인 버튼 */}
          <div className="flex items-center">
            {/* 테마 전환 버튼 */}
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
              aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            
            {user ? (
              <div className="flex items-center ml-4">
                {/* 토큰 잔액 표시 */}
                <div className="hidden md:flex items-center mr-4 text-sm">
                  <div className="flex items-center mr-3">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mr-1">
                      <span className="text-white font-bold text-xs">N</span>
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {nestBalance ? nestBalance.toLocaleString() : '0'}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-1">
                      <span className="text-white font-bold text-xs">C</span>
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {ctaBalance ? ctaBalance.toLocaleString() : '0'}
                    </span>
                  </div>
                </div>
                
                {/* 프로필 드롭다운 */}
                <div className="relative">
                  <Link to="/profile" className="flex items-center">
                    <div className="relative">
                      {user.profileImageUrl ? (
                        <img 
                          src={user.profileImageUrl} 
                          alt="프로필" 
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                      
                      {user.displayBadgeId && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    
                    <span className="ml-2 hidden md:block font-medium text-gray-700 dark:text-gray-300 truncate max-w-[100px]">
                      {user.displayName || '사용자'}
                    </span>
                  </Link>
                </div>
              </div>
            ) : (
              <Link 
                to="/" 
                className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                시작하기
              </Link>
            )}
            
            {/* 모바일 메뉴 버튼 */}
            <button
              className="ml-4 md:hidden p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* 모바일 메뉴 */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-gray-200 dark:border-gray-700">
            <nav className="flex flex-col space-y-3 pb-3">
              {user ? (
                <>
                  <NavLink 
                    to="/dashboard" 
                    className={`px-3 py-2 rounded-md ${location.pathname === '/dashboard' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    대시보드
                  </NavLink>
                  <NavLink 
                    to="/missions" 
                    className={`px-3 py-2 rounded-md ${location.pathname.includes('/missions') ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    미션
                  </NavLink>
                  <NavLink 
                    to="/nfts" 
                    className={`px-3 py-2 rounded-md ${location.pathname === '/nfts' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    NFT 컬렉션
                  </NavLink>
                  <NavLink 
                    to="/tokens/swap" 
                    className={`px-3 py-2 rounded-md ${location.pathname === '/tokens/swap' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    토큰 교환
                  </NavLink>
                  <NavLink 
                    to="/profile" 
                    className={`px-3 py-2 rounded-md ${location.pathname === '/profile' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    내 프로필
                  </NavLink>
                  
                  {/* 토큰 잔액 (모바일) */}
                  <div className="px-3 py-2 flex justify-between">
                    <div className="flex items-center">
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                        <span className="text-white font-bold text-xs">N</span>
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">NEST</span>
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {nestBalance ? nestBalance.toLocaleString() : '0'}
                    </span>
                  </div>
                  
                  <div className="px-3 py-2 flex justify-between">
                    <div className="flex items-center">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-2">
                        <span className="text-white font-bold text-xs">C</span>
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">CTA</span>
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {ctaBalance ? ctaBalance.toLocaleString() : '0'}
                    </span>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 text-left text-red-600 dark:text-red-400"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <NavLink 
                    to="/" 
                    className={`px-3 py-2 rounded-md ${location.pathname === '/' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    홈
                  </NavLink>
                  <a 
                    href="https://creatachain.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-md text-gray-700 dark:text-gray-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Creata Chain
                  </a>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
