import React, { createContext, useState, useContext, useEffect } from 'react';

/**
 * 테마 컨텍스트
 * 
 * 애플리케이션 전체의 테마(라이트/다크 모드)를 관리합니다.
 * 사용자 설정은 localStorage에 저장되어 세션 간에 유지됩니다.
 */
const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // 초기 테마 설정 (localStorage 또는 시스템 설정에서 가져옴)
  const [theme, setTheme] = useState(() => {
    // localStorage에서 테마 설정 가져오기
    const savedTheme = localStorage.getItem('nest-theme');
    if (savedTheme) {
      return savedTheme;
    }
    
    // 시스템 설정에서 테마 가져오기 (dark 모드 선호도 확인)
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    // 기본값은 light 모드
    return 'light';
  });

  // 테마 변경 함수
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // 특정 테마로 설정하는 함수
  const setSpecificTheme = (newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setTheme(newTheme);
    }
  };

  // 테마 변경 시 localStorage에 저장 및 document에 클래스 적용
  useEffect(() => {
    localStorage.setItem('nest-theme', theme);
    
    // HTML document에 테마 클래스 적용
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // 시스템 테마 변경 감지 및 적용
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // localStorage에 저장된 테마 설정이 없는 경우에만 시스템 설정을 따름
      if (!localStorage.getItem('nest-theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    // 이벤트 리스너 등록
    mediaQuery.addEventListener('change', handleChange);
    
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: setSpecificTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 테마 컨텍스트 사용을 위한 커스텀 훅
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
