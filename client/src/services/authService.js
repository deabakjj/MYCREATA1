/**
 * authService.js
 * 인증 관련 API 요청을 처리하는 서비스
 */

import api from './api';

/**
 * 소셜 로그인 URL 가져오기
 * @param {string} provider - 소셜 로그인 제공자 (google, kakao, apple)
 * @returns {Promise<Object>} 소셜 로그인 URL
 */
export const getSocialLoginUrl = async (provider) => {
  const response = await api.get(`/auth/${provider}`);
  return response.data;
};

/**
 * 소셜 로그인 콜백 처리
 * @param {string} provider - 소셜 로그인 제공자
 * @param {string} code - 인증 코드
 * @returns {Promise<Object>} 인증 정보
 */
export const handleSocialCallback = async (provider, code) => {
  const response = await api.post(`/auth/${provider}/callback`, { code });
  return response.data;
};

/**
 * 로그아웃
 * @returns {Promise<Object>} 로그아웃 결과
 */
export const logout = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

/**
 * 사용자 정보 가져오기
 * @returns {Promise<Object>} 사용자 정보
 */
export const getUserInfo = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

/**
 * 토큰 유효성 검사
 * @returns {Promise<Object>} 유효성 검사 결과
 */
export const verifyToken = async () => {
  const response = await api.get('/auth/verify-token');
  return response.data;
};

/**
 * 사용자 프로필 업데이트
 * @param {Object} userData - 업데이트할 사용자 데이터
 * @returns {Promise<Object>} 업데이트된 사용자 정보
 */
export const updateUserProfile = async (userData) => {
  const response = await api.put('/user/profile', userData);
  return response.data;
};

/**
 * 프로필 이미지 업로드
 * @param {File} file - 업로드할 이미지 파일
 * @returns {Promise<Object>} 업로드 결과
 */
export const uploadProfileImage = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  
  const response = await api.post('/user/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return response.data;
};

/**
 * 비밀번호 재설정 요청
 * @param {string} email - 사용자 이메일
 * @returns {Promise<Object>} 요청 결과
 */
export const requestPasswordReset = async (email) => {
  const response = await api.post('/auth/request-password-reset', { email });
  return response.data;
};

/**
 * 비밀번호 재설정
 * @param {string} token - 재설정 토큰
 * @param {string} newPassword - 새 비밀번호
 * @returns {Promise<Object>} 재설정 결과
 */
export const resetPassword = async (token, newPassword) => {
  const response = await api.post('/auth/reset-password', {
    token,
    newPassword
  });
  return response.data;
};

/**
 * 계정 탈퇴
 * @returns {Promise<Object>} 탈퇴 결과
 */
export const deleteAccount = async () => {
  const response = await api.delete('/user/account');
  return response.data;
};

/**
 * 계정 복구
 * @param {string} token - 복구 토큰
 * @returns {Promise<Object>} 복구 결과
 */
export const recoverAccount = async (token) => {
  const response = await api.post('/auth/recover-account', { token });
  return response.data;
};

export default {
  getSocialLoginUrl,
  handleSocialCallback,
  logout,
  getUserInfo,
  verifyToken,
  updateUserProfile,
  uploadProfileImage,
  requestPasswordReset,
  resetPassword,
  deleteAccount,
  recoverAccount
};
