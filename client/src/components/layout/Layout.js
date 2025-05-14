import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useTheme } from '../../context/ThemeContext';

/**
 * 레이아웃 컴포넌트
 * 
 * 모든 페이지에 공통으로 적용되는 Header와 Footer를 포함합니다.
 * 테마 설정에 따라 다크모드를 적용합니다.
 */
const Layout = () => {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'dark' : ''}`}>
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
