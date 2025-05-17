import axios from 'axios';

// 환경 변수에서 API URL 가져오기
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 파일 업로드용 별도 인스턴스
const fileApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

/**
 * API 오류 메시지 추출 함수
 * @param {Error} error - axios 오류 객체
 * @returns {string} 사용자에게 표시할 오류 메시지
 */
const getErrorMessage = (error) => {
  if (error.response && error.response.data && error.response.data.message) {
    return error.response.data.message;
  } else if (error.response && error.response.statusText) {
    return `${error.response.status}: ${error.response.statusText}`;
  } else if (error.message) {
    return error.message;
  } else {
    return '알 수 없는 오류가 발생했습니다.';
  }
};

// 요청 인터셉터: 토큰 추가 및 요청 로깅
api.interceptors.request.use(
  (config) => {
    // 로컬 스토리지에서 토큰 가져오기
    const token = localStorage.getItem('token');
    
    // 토큰이 있으면 헤더에 추가
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('API 요청 오류:', error);
    return Promise.reject(error);
  }
);

// 파일 API에도 동일한 인터셉터 적용
fileApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('File API 요청 오류:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 토큰 만료 처리 및 응답 로깅
const responseInterceptor = (response) => {
  return response;
};

const errorInterceptor = (error) => {
  // 인증 에러 (401) 처리
  if (error.response && error.response.status === 401) {
    // 토큰 만료 등의 이유로 인증 실패
    localStorage.removeItem('token');
    
    // 현재 페이지가 로그인 페이지가 아니면 로그인 페이지로 리디렉션
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  } else if (error.response && error.response.status === 403) {
    // 권한 에러 (403) 처리
    console.error('권한이 부족합니다:', error.response.data);
  } else if (error.response && error.response.status === 429) {
    // 요청 비율 제한 (429) 처리
    console.error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요:', error.response.data);
  }
  
  return Promise.reject(error);
};

api.interceptors.response.use(responseInterceptor, errorInterceptor);
fileApi.interceptors.response.use(responseInterceptor, errorInterceptor);

export { fileApi, getErrorMessage };
export default api;
