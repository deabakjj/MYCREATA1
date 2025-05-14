/**
 * validator.js
 * 다양한 유효성 검사 유틸리티 함수 모음
 */

/**
 * 이메일 주소 유효성 검사
 * @param {string} email - 검사할 이메일 주소
 * @returns {boolean} 유효성 여부
 */
export const isValidEmail = (email) => {
  if (!email) {
    return false;
  }
  
  // 이메일 형식 검사
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Nest ID 유효성 검사
 * @param {string} nestId - 검사할 Nest ID
 * @returns {boolean} 유효성 여부
 */
export const isValidNestId = (nestId) => {
  if (!nestId) {
    return false;
  }
  
  // Nest ID 형식 검사 (소문자, 숫자, 하이픈 + .nest 도메인)
  const nestIdRegex = /^[a-z0-9][a-z0-9-]{2,29}\.nest$/;
  
  if (!nestIdRegex.test(nestId)) {
    return false;
  }
  
  // 예약어 체크
  const reservedWords = ['admin', 'system', 'nest', 'token', 'nft', 'dao', 'wallet', 'creata', 'cta'];
  const name = nestId.split('.')[0];
  if (reservedWords.includes(name)) {
    return false;
  }
  
  return true;
};

/**
 * 비밀번호 강도 검사
 * @param {string} password - 검사할 비밀번호
 * @returns {Object} 검사 결과
 */
export const checkPasswordStrength = (password) => {
  if (!password) {
    return {
      isValid: false,
      score: 0,
      message: '비밀번호를 입력해주세요.'
    };
  }
  
  let score = 0;
  const messages = [];
  
  // 길이 검사
  if (password.length < 8) {
    messages.push('비밀번호는 8자 이상이어야 합니다.');
  } else {
    score += 1;
  }
  
  // 대문자 포함 검사
  if (!/[A-Z]/.test(password)) {
    messages.push('대문자를 포함해야 합니다.');
  } else {
    score += 1;
  }
  
  // 소문자 포함 검사
  if (!/[a-z]/.test(password)) {
    messages.push('소문자를 포함해야 합니다.');
  } else {
    score += 1;
  }
  
  // 숫자 포함 검사
  if (!/[0-9]/.test(password)) {
    messages.push('숫자를 포함해야 합니다.');
  } else {
    score += 1;
  }
  
  // 특수 문자 포함 검사
  if (!/[^A-Za-z0-9]/.test(password)) {
    messages.push('특수 문자를 포함해야 합니다.');
  } else {
    score += 1;
  }
  
  // 최종 점수 및 메시지
  let message = '';
  let isValid = false;
  
  if (score < 2) {
    message = '매우 약한 비밀번호입니다.';
  } else if (score < 3) {
    message = '약한 비밀번호입니다.';
  } else if (score < 4) {
    message = '보통 강도의 비밀번호입니다.';
    isValid = true;
  } else if (score < 5) {
    message = '강한 비밀번호입니다.';
    isValid = true;
  } else {
    message = '매우 강한 비밀번호입니다.';
    isValid = true;
  }
  
  return {
    isValid,
    score,
    message,
    details: messages
  };
};

/**
 * 전화번호 유효성 검사
 * @param {string} phoneNumber - 검사할 전화번호
 * @returns {boolean} 유효성 여부
 */
export const isValidPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) {
    return false;
  }
  
  // 숫자만 추출
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // 한국 전화번호 형식 검사 (010XXXXXXXX)
  const phoneRegex = /^(01[016789])(\d{3,4})(\d{4})$/;
  
  return phoneRegex.test(cleaned);
};

/**
 * URL 유효성 검사
 * @param {string} url - 검사할 URL
 * @returns {boolean} 유효성 여부
 */
export const isValidUrl = (url) => {
  if (!url) {
    return false;
  }
  
  try {
    // URL 객체 생성 시도
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * 숫자 유효성 검사
 * @param {string|number} value - 검사할 값
 * @returns {boolean} 숫자 여부
 */
export const isValidNumber = (value) => {
  if (value === undefined || value === null || value === '') {
    return false;
  }
  
  return !isNaN(Number(value));
};

/**
 * 양의 정수 유효성 검사
 * @param {string|number} value - 검사할 값
 * @returns {boolean} 양의 정수 여부
 */
export const isPositiveInteger = (value) => {
  if (!isValidNumber(value)) {
    return false;
  }
  
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
};

/**
 * 소수점 자리수 검사
 * @param {string|number} value - 검사할 값
 * @param {number} digits - 허용할 소수점 자리수
 * @returns {boolean} 유효성 여부
 */
export const hasValidDecimalPlaces = (value, digits) => {
  if (!isValidNumber(value)) {
    return false;
  }
  
  const stringValue = String(value);
  
  if (!stringValue.includes('.')) {
    return true;
  }
  
  const decimalPart = stringValue.split('.')[1];
  return decimalPart.length <= digits;
};

/**
 * 토큰 금액 유효성 검사
 * @param {string|number} amount - 검사할 금액
 * @param {number} balance - 현재 잔액
 * @returns {Object} 검사 결과
 */
export const validateTokenAmount = (amount, balance) => {
  if (!amount || amount === '') {
    return {
      isValid: false,
      message: '금액을 입력해주세요.'
    };
  }
  
  if (!isValidNumber(amount)) {
    return {
      isValid: false,
      message: '유효한 숫자를 입력해주세요.'
    };
  }
  
  const numAmount = Number(amount);
  
  if (numAmount <= 0) {
    return {
      isValid: false,
      message: '0보다 큰 금액을 입력해주세요.'
    };
  }
  
  if (!hasValidDecimalPlaces(amount, 6)) {
    return {
      isValid: false,
      message: '소수점 6자리까지만 입력 가능합니다.'
    };
  }
  
  if (balance !== undefined && numAmount > Number(balance)) {
    return {
      isValid: false,
      message: '잔액이 부족합니다.'
    };
  }
  
  return {
    isValid: true,
    message: '유효한 금액입니다.'
  };
};

/**
 * 한글 이름 유효성 검사
 * @param {string} name - 검사할 이름
 * @returns {boolean} 유효성 여부
 */
export const isValidKoreanName = (name) => {
  if (!name) {
    return false;
  }
  
  // 한글만 포함되어 있는지 검사
  const koreanRegex = /^[가-힣]{2,}$/;
  return koreanRegex.test(name);
};

/**
 * 영문 이름 유효성 검사
 * @param {string} name - 검사할 이름
 * @returns {boolean} 유효성 여부
 */
export const isValidEnglishName = (name) => {
  if (!name) {
    return false;
  }
  
  // 영문만 포함되어 있는지 검사
  const englishRegex = /^[A-Za-z]+(\s[A-Za-z]+)*$/;
  return englishRegex.test(name);
};

/**
 * 입력값 필수 여부 검사
 * @param {string} value - 검사할 값
 * @returns {boolean} 유효성 여부
 */
export const isRequired = (value) => {
  if (value === undefined || value === null) {
    return false;
  }
  
  if (typeof value === 'string') {
    return value.trim() !== '';
  }
  
  return true;
};

/**
 * 최소 길이 검사
 * @param {string} value - 검사할 값
 * @param {number} minLength - 최소 길이
 * @returns {boolean} 유효성 여부
 */
export const minLength = (value, minLength) => {
  if (!value) {
    return false;
  }
  
  return String(value).length >= minLength;
};

/**
 * 최대 길이 검사
 * @param {string} value - 검사할 값
 * @param {number} maxLength - 최대 길이
 * @returns {boolean} 유효성 여부
 */
export const maxLength = (value, maxLength) => {
  if (!value) {
    return true;
  }
  
  return String(value).length <= maxLength;
};

export default {
  isValidEmail,
  isValidNestId,
  checkPasswordStrength,
  isValidPhoneNumber,
  isValidUrl,
  isValidNumber,
  isPositiveInteger,
  hasValidDecimalPlaces,
  validateTokenAmount,
  isValidKoreanName,
  isValidEnglishName,
  isRequired,
  minLength,
  maxLength
};
