import api, { getErrorMessage } from './api';

/**
 * 관리자 인증 서비스
 * 로그인, 로그아웃, 인증 상태 확인 등 관리자 인증 관련 기능
 */
const authService = {
  /**
   * 관리자 로그인
   * @param {Object} credentials - 로그인 자격 증명 (이메일, 비밀번호)
   * @returns {Promise<Object>} 로그인 응답 (토큰, 사용자 정보 등)
   */
  login: async (credentials) => {
    try {
      const response = await api.post('/admin/auth/login', credentials);
      
      // 토큰을 로컬 스토리지에 저장
      if (response.data.token) {
        localStorage.setItem('admin_token', response.data.token);
        localStorage.setItem('admin_user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
  
  /**
   * 관리자 로그아웃
   * 로컬 스토리지에서 관리자 정보 제거
   */
  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    
    // 백엔드 로그아웃 API가 있다면 호출 (선택적)
    try {
      api.post('/admin/auth/logout');
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error);
    }
  },
  
  /**
   * 현재 로그인한 관리자 정보 가져오기
   * @returns {Object|null} 관리자 정보 또는 로그인되지 않은 경우 null
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem('admin_user');
    return userStr ? JSON.parse(userStr) : null;
  },
  
  /**
   * 인증 상태 확인
   * @returns {boolean} 로그인 상태 여부
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('admin_token');
  },
  
  /**
   * 토큰 유효성 검사 및 사용자 정보 갱신
   * 백엔드에 현재 토큰이 유효한지 확인하고 사용자 정보 새로고침
   * @returns {Promise<boolean>} 토큰 유효성 여부
   */
  validateToken: async () => {
    try {
      const response = await api.get('/admin/auth/validate');
      
      // 최신 사용자 정보로 업데이트
      if (response.data.user) {
        localStorage.setItem('admin_user', JSON.stringify(response.data.user));
      }
      
      return true;
    } catch (error) {
      console.error('토큰 검증 실패:', error);
      
      // 인증 오류면 로그아웃 처리
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        authService.logout();
      }
      
      return false;
    }
  },
  
  /**
   * 비밀번호 변경
   * @param {Object} passwordData - 현재 비밀번호와 새 비밀번호
   * @returns {Promise<Object>} 응답 데이터
   */
  changePassword: async (passwordData) => {
    try {
      const response = await api.post('/admin/auth/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
  
  /**
   * 비밀번호 재설정 요청 (잊어버린 경우)
   * @param {string} email - 관리자 이메일
   * @returns {Promise<Object>} 응답 데이터
   */
  requestPasswordReset: async (email) => {
    try {
      const response = await api.post('/admin/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
  
  /**
   * 비밀번호 재설정 완료
   * @param {Object} resetData - 토큰과 새 비밀번호
   * @returns {Promise<Object>} 응답 데이터
   */
  resetPassword: async (resetData) => {
    try {
      const response = await api.post('/admin/auth/reset-password', resetData);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }
};

export default authService;
