/**
 * mockService.js
 * 백엔드 API 개발 전 목업 데이터 제공 서비스
 */

// 지연 시간 시뮬레이션 유틸리티
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 로컬 스토리지 키
const MOCK_USER_KEY = 'nest-mock-user';
const MOCK_TOKEN_KEY = 'nest-mock-token';

// 목업 사용자 데이터
const mockUsers = [
  {
    id: 1,
    name: '김지훈',
    email: 'john@example.com',
    profileImage: '',
    socialProvider: 'google',
    nestId: 'john.nest',
    walletAddress: '0x8f7492d8d29b34d7c3ab1a06b5b798a473b356ae',
    level: 12,
    xp: 1205,
    tokenBalance: 1520,
    nftCount: 3
  },
  {
    id: 2,
    name: '관리자',
    email: 'admin@example.com',
    profileImage: '',
    socialProvider: 'local',
    nestId: 'admin.nest',
    walletAddress: '0x3a6482d8d29b34d7c3ab1a06b5b798a473b789de',
    level: 20,
    xp: 2100,
    tokenBalance: 5000,
    nftCount: 8,
    role: 'admin'
  }
];

/**
 * 소셜 로그인 모킹
 * @param {string} provider - 소셜 로그인 제공자 (google, kakao, apple)
 * @returns {Promise<Object>} 소셜 로그인 URL
 */
export const mockSocialLoginUrl = async (provider) => {
  await delay(500);
  return {
    url: `https://example.com/auth/${provider}`,
    state: 'mock-state'
  };
};

/**
 * 소셜 로그인 콜백 모킹
 * @param {string} provider - 소셜 로그인 제공자
 * @param {string} code - 인증 코드
 * @returns {Promise<Object>} 인증 정보
 */
export const mockSocialCallback = async (provider, code) => {
  await delay(1000);
  
  // 목업 사용자 선택 (첫 번째 사용자)
  const user = { ...mockUsers[0] };
  
  // 소셜 제공자 설정
  user.socialProvider = provider;
  
  // 목업 토큰 생성
  const token = `mock-token-${provider}-${Date.now()}`;
  
  // 로컬 스토리지에 저장
  localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
  localStorage.setItem(MOCK_TOKEN_KEY, token);
  
  return {
    user,
    token,
    isNewUser: false
  };
};

/**
 * 로그아웃 모킹
 * @returns {Promise<Object>} 로그아웃 결과
 */
export const mockLogout = async () => {
  await delay(300);
  
  // 로컬 스토리지에서 제거
  localStorage.removeItem(MOCK_USER_KEY);
  localStorage.removeItem(MOCK_TOKEN_KEY);
  
  return { success: true };
};

/**
 * 사용자 정보 가져오기 모킹
 * @returns {Promise<Object>} 사용자 정보
 */
export const mockGetUserInfo = async () => {
  await delay(300);
  
  const userJson = localStorage.getItem(MOCK_USER_KEY);
  if (!userJson) {
    throw new Error('Unauthorized');
  }
  
  return {
    user: JSON.parse(userJson)
  };
};

/**
 * 토큰 유효성 검사 모킹
 * @returns {Promise<Object>} 유효성 검사 결과
 */
export const mockVerifyToken = async () => {
  await delay(200);
  
  const token = localStorage.getItem(MOCK_TOKEN_KEY);
  if (!token) {
    throw new Error('Invalid token');
  }
  
  return { valid: true };
};

/**
 * 토큰 잔액 조회 모킹
 * @returns {Promise<Object>} 토큰 잔액 정보
 */
export const mockGetTokenBalance = async () => {
  await delay(500);
  
  const userJson = localStorage.getItem(MOCK_USER_KEY);
  if (!userJson) {
    throw new Error('Unauthorized');
  }
  
  const user = JSON.parse(userJson);
  
  return {
    balance: user.tokenBalance,
    symbol: 'NEST',
    decimals: 18
  };
};

/**
 * 목업 데이터 초기화
 * @returns {Promise<boolean>} 초기화 성공 여부
 */
export const initMockData = async () => {
  try {
    // 기존 목업 데이터 클리어
    localStorage.removeItem(MOCK_USER_KEY);
    localStorage.removeItem(MOCK_TOKEN_KEY);
    
    return true;
  } catch (error) {
    console.error("목업 데이터 초기화 오류:", error);
    return false;
  }
};

/**
 * 개발 모드에서만 사용할 목업 서비스
 * 개발이 완료되면 실제 서비스로 대체해야 함
 */
export const mockServices = {
  // 인증 관련
  getSocialLoginUrl: mockSocialLoginUrl,
  handleSocialCallback: mockSocialCallback,
  logout: mockLogout,
  getUserInfo: mockGetUserInfo,
  verifyToken: mockVerifyToken,
  
  // 토큰 관련
  getTokenBalance: mockGetTokenBalance,
  
  // 유틸리티
  initMockData
};

export default mockServices;
