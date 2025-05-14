import React, { useState, useEffect } from 'react';
import { useToken } from '../../context/TokenContext';

/**
 * 토큰 교환 페이지 컴포넌트
 * 
 * NEST 토큰과 CTA 토큰 간의 교환(스왑) 기능을 제공합니다.
 * 사용자에게 친숙한 인터페이스로 백그라운드에서는 실제 블록체인 교환이 이루어집니다.
 */
const TokenSwapPage = () => {
  const { nestBalance, ctaBalance, swapRate, loadBalances, swapCtaToNest, swapNestToCta, isLoading, error } = useToken();
  
  // 스왑 방향 및 입력값 상태
  const [swapDirection, setSwapDirection] = useState('cta-to-nest'); // 'cta-to-nest' 또는 'nest-to-cta'
  const [inputAmount, setInputAmount] = useState('');
  const [outputAmount, setOutputAmount] = useState('');
  
  // 트랜잭션 상태
  const [isSwapping, setIsSwapping] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // 최초 로드 시 잔액 가져오기
  useEffect(() => {
    loadBalances();
  }, []);
  
  // 입력값 변경 시 출력값 계산
  useEffect(() => {
    if (!inputAmount || isNaN(inputAmount)) {
      setOutputAmount('');
      return;
    }
    
    const amount = parseFloat(inputAmount);
    
    if (swapDirection === 'cta-to-nest') {
      setOutputAmount((amount * swapRate).toString());
    } else {
      setOutputAmount((amount / swapRate).toString());
    }
  }, [inputAmount, swapDirection, swapRate]);
  
  // 스왑 방향 전환 핸들러
  const handleSwapDirection = () => {
    setSwapDirection(prev => prev === 'cta-to-nest' ? 'nest-to-cta' : 'cta-to-nest');
    setInputAmount('');
    setOutputAmount('');
  };
  
  // 입력값 변경 핸들러
  const handleInputChange = (e) => {
    const value = e.target.value;
    
    // 숫자와 소수점만 허용
    if (value === '' || (/^\d*\.?\d*$/).test(value)) {
      setInputAmount(value);
    }
  };
  
  // 최대값 설정 핸들러
  const handleSetMax = () => {
    if (swapDirection === 'cta-to-nest') {
      setInputAmount(ctaBalance.toString());
    } else {
      setInputAmount(nestBalance.toString());
    }
  };
  
  // 스왑 수행 핸들러
  const handleSwap = async () => {
    if (!inputAmount || isNaN(inputAmount) || parseFloat(inputAmount) <= 0) {
      setErrorMessage('유효한 금액을 입력해주세요.');
      return;
    }
    
    const amount = parseFloat(inputAmount);
    
    // 잔액 확인
    if (swapDirection === 'cta-to-nest' && amount > ctaBalance) {
      setErrorMessage('CTA 잔액이 부족합니다.');
      return;
    } else if (swapDirection === 'nest-to-cta' && amount > nestBalance) {
      setErrorMessage('NEST 잔액이 부족합니다.');
      return;
    }
    
    try {
      setIsSwapping(true);
      setErrorMessage('');
      setSuccessMessage('');
      
      let result;
      
      if (swapDirection === 'cta-to-nest') {
        result = await swapCtaToNest(amount);
      } else {
        result = await swapNestToCta(amount);
      }
      
      if (result && result.txHash) {
        setTxHash(result.txHash);
        
        const fromToken = swapDirection === 'cta-to-nest' ? 'CTA' : 'NEST';
        const toToken = swapDirection === 'cta-to-nest' ? 'NEST' : 'CTA';
        const toAmount = swapDirection === 'cta-to-nest' 
          ? amount * swapRate 
          : amount / swapRate;
        
        setSuccessMessage(
          `성공적으로 ${amount} ${fromToken}를 ${toAmount} ${toToken}로 교환했습니다.`
        );
        
        // 입력값 초기화
        setInputAmount('');
        setOutputAmount('');
        
        // 잔액 새로고침
        loadBalances();
      }
    } catch (err) {
      console.error('Swap error:', err);
      setErrorMessage('토큰 교환 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSwapping(false);
    }
  };
  
  // 마운트 시 에러 메시지 초기화
  useEffect(() => {
    if (error) {
      setErrorMessage(error);
    }
  }, [error]);
  
  if (isLoading && !nestBalance && !ctaBalance) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">토큰 교환</h1>
        <p className="text-gray-600 mb-8">NEST 토큰과 CTA 토큰을 교환하세요</p>
        
        <div className="max-w-md mx-auto">
          {/* 지갑 잔액 카드 */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-lg font-bold mb-4 text-gray-800">내 토큰 잔액</h2>
            
            <div className="flex justify-between mb-3">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-xs">NEST</span>
                </div>
                <span className="font-medium">NEST Token</span>
              </div>
              <span className="font-bold">{nestBalance.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-xs">CTA</span>
                </div>
                <span className="font-medium">CTA Token</span>
              </div>
              <span className="font-bold">{ctaBalance.toLocaleString()}</span>
            </div>
          </div>
          
          {/* 스왑 카드 */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">토큰 교환</h2>
              <div className="text-sm text-gray-500 flex items-center">
                <span>교환 비율: 1 CTA = {swapRate} NEST</span>
                <div className="relative ml-2 group">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    이 교환 비율은 CreataChain 메인넷에 의해 결정됩니다.
                  </div>
                </div>
              </div>
            </div>
            
            {/* 입력 필드 (From) */}
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">From</span>
                <span className="text-sm text-gray-500">
                  잔액: {
                    swapDirection === 'cta-to-nest' 
                      ? ctaBalance.toLocaleString() 
                      : nestBalance.toLocaleString()
                  } {swapDirection === 'cta-to-nest' ? 'CTA' : 'NEST'}
                </span>
              </div>
              
              <div className="relative">
                <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden">
                  <div className="flex-1 px-4 py-3">
                    <input
                      type="text"
                      className="w-full bg-transparent outline-none text-right text-lg"
                      placeholder="0.0"
                      value={inputAmount}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="px-4 py-3 flex items-center bg-gray-200">
                    <div className="w-6 h-6 rounded-full mr-2 flex items-center justify-center">
                      <span className={`font-bold text-xs ${swapDirection === 'cta-to-nest' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'} rounded-full w-full h-full flex items-center justify-center`}>
                        {swapDirection === 'cta-to-nest' ? 'CTA' : 'NEST'}
                      </span>
                    </div>
                    <span className="font-medium">
                      {swapDirection === 'cta-to-nest' ? 'CTA' : 'NEST'}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={handleSetMax}
                  className="absolute right-20 top-1/2 transform -translate-y-1/2 text-xs text-blue-600 font-medium bg-gray-100 px-2 py-1 rounded"
                >
                  최대
                </button>
              </div>
            </div>
            
            {/* 교환 방향 버튼 */}
            <div className="flex justify-center mb-4">
              <button
                onClick={handleSwapDirection}
                className="bg-gray-100 p-2 rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>
            
            {/* 출력 필드 (To) */}
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">To</span>
                <span className="text-sm text-gray-500">
                  잔액: {
                    swapDirection === 'cta-to-nest' 
                      ? nestBalance.toLocaleString() 
                      : ctaBalance.toLocaleString()
                  } {swapDirection === 'cta-to-nest' ? 'NEST' : 'CTA'}
                </span>
              </div>
              
              <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden">
                <div className="flex-1 px-4 py-3">
                  <input
                    type="text"
                    className="w-full bg-transparent outline-none text-right text-lg"
                    placeholder="0.0"
                    value={outputAmount}
                    disabled
                  />
                </div>
                
                <div className="px-4 py-3 flex items-center bg-gray-200">
                  <div className="w-6 h-6 rounded-full mr-2 flex items-center justify-center">
                    <span className={`font-bold text-xs ${swapDirection === 'cta-to-nest' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'} rounded-full w-full h-full flex items-center justify-center`}>
                      {swapDirection === 'cta-to-nest' ? 'NEST' : 'CTA'}
                    </span>
                  </div>
                  <span className="font-medium">
                    {swapDirection === 'cta-to-nest' ? 'NEST' : 'CTA'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* 에러 및 성공 메시지 */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {errorMessage}
              </div>
            )}
            
            {successMessage && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                {successMessage}
              </div>
            )}
            
            {/* 교환 버튼 */}
            <button
              onClick={handleSwap}
              disabled={isSwapping || !inputAmount || parseFloat(inputAmount) <= 0}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSwapping ? '교환 중...' : '교환하기'}
            </button>
          </div>
          
          {/* 교환 세부 정보 */}
          {txHash && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold mb-4 text-gray-800">트랜잭션 세부 정보</h2>
              
              <div className="text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">트랜잭션 해시:</span>
                  <span className="font-medium text-blue-600 truncate max-w-[200px]">
                    {txHash}
                  </span>
                </div>
                
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">상태:</span>
                  <span className="font-medium text-green-600">완료됨</span>
                </div>
                
                <a 
                  href={`https://catena.explorer.creatachain.com/tx/${txHash}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center justify-center mt-4"
                >
                  블록 탐색기에서 보기
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TokenSwapPage;
