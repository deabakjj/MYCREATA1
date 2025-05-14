import axios from 'axios';

/**
 * 관리자 API 서비스 기본 설정
 * 모든 API 요청에 공통적으로 적용되는 설정과 인터셉터 정의
 */

// API 기본 URL 설정
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Axios 인스턴스 생성
const api = axios.create({
  baseURL,
  timeout: 30000, // 30초 타임아웃
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 인증 토큰 추가
api.interceptors.request.use(
  (config) => {
    // 로컬 스토리지에서 인증 토큰 가져오기
    const token = localStorage.getItem('admin_token');
    
    // 토큰이 있으면 헤더에 추가
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 오류 처리 및 토큰 만료 대응
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 인증 오류(401) 처리 - 토큰 만료 등
    if (error.response && error.response.status === 401) {
      // 토큰 제거 및 로그인 페이지로 리다이렉트
      localStorage.removeItem('admin_token');
      window.location.href = '/admin/login';
    }
    
    // 권한 오류(403) 처리
    if (error.response && error.response.status === 403) {
      // 권한 없음 페이지로 리다이렉트 또는 경고 표시
      console.error('접근 권한이 없습니다.');
    }
    
    return Promise.reject(error);
  }
);

export default api;

/**
 * API 오류 메시지 추출 유틸리티 함수
 * @param {Error} error - Axios 오류 객체
 * @returns {string} 사용자에게 표시할 오류 메시지
 */
export const getErrorMessage = (error) => {
  if (error.response && error.response.data && error.response.data.message) {
    return error.response.data.message;
  }
  
  if (error.message) {
    // 타임아웃 오류 메시지 변환
    if (error.message.includes('timeout')) {
      return '서버 응답 시간이 초과되었습니다. 나중에 다시 시도해주세요.';
    }
    return error.message;
  }
  
  return '오류가 발생했습니다. 나중에 다시 시도해주세요.';
};

/**
 * 파일 업로드용 API 인스턴스
 * multipart/form-data 요청을 위한 별도 설정
 */
export const fileApi = axios.create({
  baseURL,
  timeout: 60000, // 파일 업로드는 더 긴 타임아웃 (60초)
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// 파일 업로드 API에도 동일한 인터셉터 적용
fileApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

fileApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);
