import React from 'react';
import { Link } from 'react-router-dom';

/**
 * 푸터 컴포넌트
 * 
 * 앱 하단에 표시되는 푸터 섹션입니다.
 * 링크, 소셜 미디어, 저작권 정보를 포함합니다.
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 로고 및 간단한 설명 */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center mb-4">
              <div className="bg-blue-600 text-white font-bold text-xl w-10 h-10 rounded-full flex items-center justify-center mr-2">
                N
              </div>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">Nest</span>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Web3를 모르게 사용하는 대중화 플랫폼
              <br />
              CreataChain의 Catena 메인넷 기반
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://twitter.com/creatachain" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                aria-label="Twitter"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a 
                href="https://github.com/creatachain" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                aria-label="GitHub"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
              <a 
                href="https://t.me/creatachain" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                aria-label="Telegram"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.053 5.56-5.023c.24-.213-.054-.333-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.654-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                </svg>
              </a>
            </div>
          </div>
          
          {/* 빠른 링크 */}
          <div>
            <h3 className="text-gray-800 dark:text-white font-medium mb-4">빠른 링크</h3>
            <nav className="flex flex-col space-y-2">
              <Link to="/" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm">
                홈
              </Link>
              <Link to="/dashboard" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm">
                대시보드
              </Link>
              <Link to="/missions" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm">
                미션
              </Link>
              <Link to="/nfts" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm">
                NFT 컬렉션
              </Link>
              <Link to="/tokens/swap" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm">
                토큰 교환
              </Link>
            </nav>
          </div>
          
          {/* 커뮤니티 */}
          <div>
            <h3 className="text-gray-800 dark:text-white font-medium mb-4">커뮤니티</h3>
            <nav className="flex flex-col space-y-2">
              <a 
                href="https://creatachain.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
              >
                CreataChain 홈페이지
              </a>
              <a 
                href="https://creatachain.com/developers" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
              >
                개발자 문서
              </a>
              <a 
                href="https://catena.explorer.creatachain.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
              >
                블록 탐색기
              </a>
              <a 
                href="https://creatachain.medium.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
              >
                블로그
              </a>
              <a 
                href="https://discord.gg/creatachain" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
              >
                Discord
              </a>
            </nav>
          </div>
          
          {/* 리소스 */}
          <div>
            <h3 className="text-gray-800 dark:text-white font-medium mb-4">리소스</h3>
            <nav className="flex flex-col space-y-2">
              <a 
                href="/faq" 
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
              >
                자주 묻는 질문
              </a>
              <a 
                href="/terms" 
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
              >
                이용약관
              </a>
              <a 
                href="/privacy" 
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
              >
                개인정보처리방침
              </a>
              <a 
                href="mailto:support@creatachain.com" 
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
              >
                고객 지원
              </a>
            </nav>
          </div>
        </div>
        
        {/* 저작권 */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
            &copy; {currentYear} Nest Platform. 모든 권리 보유.
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-xs text-center mt-2">
            Powered by <a 
              href="https://creatachain.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-blue-600 dark:hover:text-blue-400"
            >
              CreataChain
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
