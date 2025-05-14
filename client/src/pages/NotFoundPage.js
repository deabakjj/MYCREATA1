import React from 'react';
import { Link } from 'react-router-dom';

/**
 * 404 페이지 컴포넌트
 * 
 * 존재하지 않는 URL로 접근했을 때 표시되는 페이지입니다.
 */
const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-md w-full p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h1 className="text-5xl font-bold mb-4 text-gray-800 dark:text-white">404</h1>
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">페이지를 찾을 수 없습니다</h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          <br />
          잘못된 URL을 입력했는지 확인해주세요.
        </p>
        
        <div className="space-y-4">
          <Link
            to="/"
            className="block w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            홈으로 돌아가기
          </Link>
          
          <Link
            to="/dashboard"
            className="block w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            대시보드로 이동
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
