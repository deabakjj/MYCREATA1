/**
 * useNestId.js
 * Nest ID 관련 커스텀 훅
 */

import { useState, useContext, useCallback } from 'react';
import AuthContext from '../context/AuthContext';
import api from '../services/api';

/**
 * Nest ID 관련 기능을 제공하는 훅
 * ID 등록, 검색, QR 코드 생성 등의 기능 포함
 */
const useNestId = () => {
  const { state, dispatch } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [qrCodeData, setQrCodeData] = useState(null);

  /**
   * Nest ID 유효성 검사
   * @param {string} nestId - 검사할 Nest ID
   * @returns {boolean} 유효성 여부
   */
  const validateNestId = useCallback((nestId) => {
    // Nest ID 유효성 검사 규칙
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
  }, []);

  /**
   * Nest ID 등록 가능 여부 확인
   * @param {string} nestId - 확인할 Nest ID
   */
  const checkNestIdAvailability = useCallback(async (nestId) => {
    try {
      setLoading(true);
      setError(null);
      
      // 유효성 검사
      if (!validateNestId(nestId)) {
        throw new Error('유효하지 않은 Nest ID 형식입니다.');
      }
      
      const response = await api.get(`/nestid/check/${nestId}`);
      
      return response.data.available;
    } catch (err) {
      console.error('Nest ID 확인 오류:', err);
      setError(err.response?.data?.message || 'Nest ID 확인 중 오류가 발생했습니다.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [validateNestId]);

  /**
   * Nest ID 등록
   * @param {string} nestId - 등록할 Nest ID
   */
  const registerNestId = useCallback(async (nestId) => {
    try {
      setLoading(true);
      setError(null);
      
      // 유효성 검사
      if (!validateNestId(nestId)) {
        throw new Error('유효하지 않은 Nest ID 형식입니다.');
      }
      
      // 등록 가능 여부 확인
      const isAvailable = await checkNestIdAvailability(nestId);
      if (!isAvailable) {
        throw new Error('이미 등록된 Nest ID입니다.');
      }
      
      const response = await api.post('/nestid/register', { nestId });
      
      // 사용자 정보 업데이트
      dispatch({
        type: 'USER_UPDATE',
        payload: {
          ...state.user,
          nestId
        }
      });
      
      return response.data;
    } catch (err) {
      console.error('Nest ID 등록 오류:', err);
      setError(err.response?.data?.message || 'Nest ID 등록 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [validateNestId, checkNestIdAvailability, dispatch, state.user]);

  /**
   * Nest ID 업데이트
   * @param {string} newNestId - 새로운 Nest ID
   */
  const updateNestId = useCallback(async (newNestId) => {
    try {
      setLoading(true);
      setError(null);
      
      // 유효성 검사
      if (!validateNestId(newNestId)) {
        throw new Error('유효하지 않은 Nest ID 형식입니다.');
      }
      
      // 등록 가능 여부 확인
      const isAvailable = await checkNestIdAvailability(newNestId);
      if (!isAvailable) {
        throw new Error('이미 등록된 Nest ID입니다.');
      }
      
      const response = await api.put('/nestid/update', { nestId: newNestId });
      
      // 사용자 정보 업데이트
      dispatch({
        type: 'USER_UPDATE',
        payload: {
          ...state.user,
          nestId: newNestId
        }
      });
      
      return response.data;
    } catch (err) {
      console.error('Nest ID 업데이트 오류:', err);
      setError(err.response?.data?.message || 'Nest ID 업데이트 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [validateNestId, checkNestIdAvailability, dispatch, state.user]);

  /**
   * Nest ID로 사용자 검색
   * @param {string} query - 검색어
   * @param {Object} options - 페이징 등 옵션
   */
  const searchNestId = useCallback(async (query, options = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      // 검색어가 너무 짧은 경우
      if (query.length < 2) {
        throw new Error('검색어는 2글자 이상이어야 합니다.');
      }
      
      const response = await api.get('/nestid/search', {
        params: {
          query,
          ...options
        }
      });
      
      setSearchResults(response.data.results);
      
      return response.data.results;
    } catch (err) {
      console.error('Nest ID 검색 오류:', err);
      setError(err.response?.data?.message || 'Nest ID 검색 중 오류가 발생했습니다.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Nest ID로 사용자 조회
   * @param {string} nestId - 조회할 Nest ID
   */
  const getUserByNestId = useCallback(async (nestId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/nestid/user/${nestId}`);
      
      return response.data.user;
    } catch (err) {
      console.error('사용자 조회 오류:', err);
      setError(err.response?.data?.message || '사용자 조회 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Nest ID를 위한 QR 코드 데이터 생성
   * @param {string} nestId - QR 코드를 생성할 Nest ID
   */
  const generateQRCode = useCallback(async (nestId = null) => {
    try {
      setLoading(true);
      setError(null);
      
      // nestId가 제공되지 않은 경우 현재 사용자의 Nest ID 사용
      const targetNestId = nestId || state.user?.nestId;
      
      if (!targetNestId) {
        throw new Error('Nest ID가 필요합니다.');
      }
      
      const response = await api.get(`/nestid/qrcode/${targetNestId}`);
      
      setQrCodeData(response.data.qrData);
      
      return response.data.qrData;
    } catch (err) {
      console.error('QR 코드 생성 오류:', err);
      setError(err.response?.data?.message || 'QR 코드 생성 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [state.user]);

  return {
    nestId: state.user?.nestId,
    searchResults,
    qrCodeData,
    loading,
    error,
    validateNestId,
    checkNestIdAvailability,
    registerNestId,
    updateNestId,
    searchNestId,
    getUserByNestId,
    generateQRCode
  };
};

export default useNestId;
