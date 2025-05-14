/**
 * storage.js
 * 로컬 스토리지 관리를 위한 유틸리티 함수 모음
 */

/**
 * 로컬 스토리지에 데이터 저장
 * @param {string} key - 저장할 데이터의 키
 * @param {any} value - 저장할 데이터 값
 */
export const setItem = (key, value) => {
  try {
    // 객체나 배열인 경우 JSON 문자열로 변환
    const serializedValue = typeof value === 'object' 
      ? JSON.stringify(value) 
      : String(value);
    
    localStorage.setItem(key, serializedValue);
    return true;
  } catch (error) {
    console.error('로컬 스토리지 저장 오류:', error);
    return false;
  }
};

/**
 * 로컬 스토리지에서 데이터 가져오기
 * @param {string} key - 가져올 데이터의 키
 * @param {any} defaultValue - 데이터가 없을 경우 기본값
 * @returns {any} 저장된 데이터
 */
export const getItem = (key, defaultValue = null) => {
  try {
    const value = localStorage.getItem(key);
    
    if (value === null) {
      return defaultValue;
    }
    
    // JSON 형식인지 확인하고 파싱
    try {
      return JSON.parse(value);
    } catch {
      // JSON이 아닐 경우 원래 값 반환
      return value;
    }
  } catch (error) {
    console.error('로컬 스토리지 조회 오류:', error);
    return defaultValue;
  }
};

/**
 * 로컬 스토리지에서 데이터 삭제
 * @param {string} key - 삭제할 데이터의 키
 * @returns {boolean} 삭제 성공 여부
 */
export const removeItem = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('로컬 스토리지 삭제 오류:', error);
    return false;
  }
};

/**
 * 로컬 스토리지 전체 비우기
 * @returns {boolean} 성공 여부
 */
export const clearStorage = () => {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('로컬 스토리지 비우기 오류:', error);
    return false;
  }
};

/**
 * 로컬 스토리지에 저장된 모든 키 가져오기
 * @returns {Array<string>} 키 목록
 */
export const getAllKeys = () => {
  try {
    return Object.keys(localStorage);
  } catch (error) {
    console.error('로컬 스토리지 키 목록 조회 오류:', error);
    return [];
  }
};

/**
 * 로컬 스토리지에 데이터가 존재하는지 확인
 * @param {string} key - 확인할 데이터의 키
 * @returns {boolean} 존재 여부
 */
export const hasItem = (key) => {
  try {
    return localStorage.getItem(key) !== null;
  } catch (error) {
    console.error('로컬 스토리지 확인 오류:', error);
    return false;
  }
};

/**
 * 로컬 스토리지 데이터 만료 시간 포함하여 저장
 * @param {string} key - 저장할 데이터의 키
 * @param {any} value - 저장할 데이터 값
 * @param {number} ttl - 만료 시간(밀리초)
 */
export const setItemWithExpiry = (key, value, ttl) => {
  try {
    const now = new Date();
    
    // 만료 시간이 포함된 객체
    const item = {
      value,
      expiry: now.getTime() + ttl
    };
    
    // 객체를 JSON 문자열로 변환하여 저장
    localStorage.setItem(key, JSON.stringify(item));
    return true;
  } catch (error) {
    console.error('로컬 스토리지 만료 시간 저장 오류:', error);
    return false;
  }
};

/**
 * 만료 시간이 포함된 로컬 스토리지 데이터 가져오기
 * @param {string} key - 가져올 데이터의 키
 * @param {any} defaultValue - 데이터가 없거나 만료된 경우 기본값
 * @returns {any} 저장된 데이터
 */
export const getItemWithExpiry = (key, defaultValue = null) => {
  try {
    const itemStr = localStorage.getItem(key);
    
    // 데이터가 없는 경우
    if (!itemStr) {
      return defaultValue;
    }
    
    // JSON 파싱
    const item = JSON.parse(itemStr);
    const now = new Date();
    
    // 만료 시간 확인
    if (now.getTime() > item.expiry) {
      // 만료된 데이터 삭제
      localStorage.removeItem(key);
      return defaultValue;
    }
    
    return item.value;
  } catch (error) {
    console.error('로컬 스토리지 만료 시간 조회 오류:', error);
    return defaultValue;
  }
};

/**
 * 로컬 스토리지 사용 가능 여부 확인
 * @returns {boolean} 사용 가능 여부
 */
export const isLocalStorageAvailable = () => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

export default {
  setItem,
  getItem,
  removeItem,
  clearStorage,
  getAllKeys,
  hasItem,
  setItemWithExpiry,
  getItemWithExpiry,
  isLocalStorageAvailable
};
