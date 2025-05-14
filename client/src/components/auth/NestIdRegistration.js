import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import QRCode from 'react-qr-code';

/**
 * NestID 등록 및 관리 컴포넌트
 * 
 * 사용자가 자신의 고유 .nest ID를 생성하고 관리할 수 있습니다.
 * 이 ID는 실제 블록체인 지갑 주소와 매핑되며, 사용자에게는 친숙한 ID 형태로 표시됩니다.
 */
const NestIdRegistration = () => {
  const { user } = useAuth();
  const [nestId, setNestId] = useState('');
  const [isAvailable, setIsAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 사용자가 이미 NestID를 가지고 있는지 확인
  useEffect(() => {
    const checkExistingNestId = async () => {
      if (user && user.walletAddress) {
        try {
          // 백엔드 API를 통해 사용자의 NestID를 조회합니다
          const response = await fetch(`/api/nest-id/user/${user.walletAddress}`);
          const data = await response.json();
          
          if (data.nestId) {
            setNestId(data.nestId);
            setSuccessMessage(`당신의 Nest ID는 ${data.nestId}.nest 입니다`);
          }
        } catch (error) {
          console.error('Failed to fetch existing NestID:', error);
        }
      }
    };

    checkExistingNestId();
  }, [user]);

  // NestID 가용성 체크
  const checkAvailability = async () => {
    if (!nestId.trim()) {
      setErrorMessage('Nest ID를 입력해주세요');
      return;
    }

    setIsChecking(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // 백엔드 API를 통해 NestID 가용성을 확인합니다
      const response = await fetch(`/api/nest-id/check/${nestId}`);
      const data = await response.json();
      
      setIsAvailable(data.isAvailable);
      
      if (data.isAvailable) {
        setSuccessMessage(`${nestId}.nest 는 사용 가능합니다!`);
      } else {
        setErrorMessage(`${nestId}.nest 는 이미 사용 중입니다. 다른 ID를 시도해주세요.`);
      }
    } catch (error) {
      console.error('Failed to check NestID availability:', error);
      setErrorMessage('ID 확인 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsChecking(false);
    }
  };

  // NestID 등록
  const registerNestId = async () => {
    if (!isAvailable) {
      setErrorMessage('먼저 ID 가용성을 확인해주세요');
      return;
    }

    setIsRegistering(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // 백엔드 API를 통해 NestID를 등록합니다
      const response = await fetch('/api/nest-id/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          walletAddress: user.walletAddress,
          nestId: nestId
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage(`${nestId}.nest가 성공적으로 등록되었습니다!`);
      } else {
        setErrorMessage(data.message || '등록 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('Failed to register NestID:', error);
      setErrorMessage('등록 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsRegistering(false);
    }
  };

  // QR 코드 데이터 생성
  const getQrCodeData = () => {
    if (!nestId) return '';
    return `https://nest.platform/${nestId}`;
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Nest ID 생성</h2>
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}
      
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {errorMessage}
        </div>
      )}
      
      <div className="mb-6">
        <label htmlFor="nestId" className="block text-sm font-medium text-gray-700 mb-2">
          원하는 Nest ID 입력
        </label>
        <div className="flex">
          <input
            type="text"
            id="nestId"
            value={nestId}
            onChange={(e) => setNestId(e.target.value.toLowerCase())}
            placeholder="예: john123"
            className="flex-1 p-3 border rounded-l-md focus:ring-blue-500 focus:border-blue-500"
            disabled={isChecking || isRegistering}
          />
          <span className="inline-flex items-center px-3 py-3 bg-gray-200 text-gray-700 border border-l-0 rounded-r-md">
            .nest
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          이 ID는 블록체인 주소 대신 사용됩니다. 한번 등록하면 변경할 수 없습니다.
        </p>
      </div>
      
      <div className="flex gap-3 mb-6">
        <button
          onClick={checkAvailability}
          disabled={isChecking || isRegistering || !nestId.trim()}
          className="flex-1 py-3 px-4 bg-gray-200 text-gray-800 font-medium rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
        >
          {isChecking ? '확인 중...' : 'ID 확인'}
        </button>
        
        <button
          onClick={registerNestId}
          disabled={!isAvailable || isRegistering || isChecking}
          className="flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isRegistering ? '등록 중...' : 'ID 등록'}
        </button>
      </div>
      
      {nestId && (
        <div className="mt-8 text-center">
          <h3 className="text-lg font-medium mb-4">당신의 Nest QR 코드</h3>
          <div className="inline-block p-3 bg-white rounded-lg shadow-sm">
            <QRCode value={getQrCodeData()} size={180} />
          </div>
          <p className="mt-3 text-sm text-gray-600">
            이 QR 코드를 스캔하면 당신의 Nest ID로 연결됩니다.
          </p>
        </div>
      )}
    </div>
  );
};

export default NestIdRegistration;
