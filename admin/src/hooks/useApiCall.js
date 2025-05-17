import { useState, useCallback } from 'react';

/**
 * API 호출 상태를 관리하는 커스텀 훅
 * 로딩 상태, 에러 상태 및 데이터를 한 번에 관리
 * 
 * @returns {Object} 로딩 상태, 에러, 데이터 및 API 래퍼 함수
 */
const useApiCall = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  /**
   * API 호출 래퍼 함수
   * 로딩 상태를 자동으로 관리하고 에러 처리
   * 
   * @param {Function} apiFunction - 실행할 API 함수
   * @param {Array} args - API 함수에 전달할 인자들
   * @param {Function} onSuccess - 성공 시 콜백 함수 (선택사항)
   * @param {Function} onError - 에러 발생 시 콜백 함수 (선택사항)
   * @returns {Promise<any>} API 호출 결과
   */
  const callApi = useCallback(async (apiFunction, args = [], onSuccess = null, onError = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiFunction(...args);
      setData(result);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      setError(err.message || '알 수 없는 오류가 발생했습니다.');
      
      if (onError) {
        onError(err);
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 에러 상태 초기화
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * 데이터 상태 초기화
   */
  const clearData = useCallback(() => {
    setData(null);
  }, []);

  /**
   * 모든 상태 초기화
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    loading,
    error,
    data,
    callApi,
    clearError,
    clearData,
    reset
  };
};

export default useApiCall;
