/**
 * qrGenerator.js
 * QR 코드 생성 및 관리를 위한 유틸리티 함수 모음
 */

import QRCode from 'qrcode';

/**
 * QR 코드 데이터 URL 생성
 * @param {string} data - QR 코드에 포함할 데이터
 * @param {Object} options - QR 코드 생성 옵션
 * @returns {Promise<string>} QR 코드 데이터 URL
 */
export const generateQRDataURL = async (data, options = {}) => {
  try {
    // 기본 옵션
    const defaultOptions = {
      errorCorrectionLevel: 'H', // 'L', 'M', 'Q', 'H'
      margin: 1,
      width: 300,
      color: {
        dark: '#000000', // 검은색
        light: '#FFFFFF' // 흰색
      }
    };
    
    // 사용자 옵션과 병합
    const mergedOptions = { ...defaultOptions, ...options };
    
    // QR 코드 생성 (데이터 URL)
    const dataURL = await QRCode.toDataURL(data, mergedOptions);
    
    return dataURL;
  } catch (error) {
    console.error('QR 코드 생성 오류:', error);
    throw new Error('QR 코드 생성 중 오류가 발생했습니다.');
  }
};

/**
 * Canvas 요소에 QR 코드 렌더링
 * @param {string} data - QR 코드에 포함할 데이터
 * @param {HTMLCanvasElement} canvas - QR 코드를 렌더링할 캔버스 요소
 * @param {Object} options - QR 코드 생성 옵션
 * @returns {Promise<void>}
 */
export const renderQRToCanvas = async (data, canvas, options = {}) => {
  try {
    // 기본 옵션
    const defaultOptions = {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };
    
    // 사용자 옵션과 병합
    const mergedOptions = { ...defaultOptions, ...options };
    
    // QR 코드 생성 (캔버스 요소에 렌더링)
    await QRCode.toCanvas(canvas, data, mergedOptions);
  } catch (error) {
    console.error('QR 코드 렌더링 오류:', error);
    throw new Error('QR 코드 렌더링 중 오류가 발생했습니다.');
  }
};

/**
 * Nest ID 형식의 QR 코드 데이터 생성
 * @param {string} nestId - QR 코드에 포함할 Nest ID
 * @returns {string} QR 코드 데이터
 */
export const generateNestIdQRData = (nestId) => {
  // 유효성 검사
  if (!nestId) {
    throw new Error('Nest ID가 필요합니다.');
  }
  
  // Nest ID 형식의 QR 코드 데이터 생성
  // 형식: nest://{nestId}
  return `nest://${nestId}`;
};

/**
 * 결제용 QR 코드 데이터 생성
 * @param {string} senderNestId - 발신자 Nest ID
 * @param {string} receiverNestId - 수신자 Nest ID
 * @param {number} amount - 금액
 * @param {string} tokenType - 토큰 유형 (NEST, CTA 등)
 * @param {string} memo - 메모 (선택사항)
 * @returns {string} QR 코드 데이터
 */
export const generatePaymentQRData = (senderNestId, receiverNestId, amount, tokenType = 'NEST', memo = '') => {
  // 유효성 검사
  if (!receiverNestId) {
    throw new Error('수신자 Nest ID가 필요합니다.');
  }
  
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    throw new Error('유효한 금액이 필요합니다.');
  }
  
  // JSON 형식의 QR 코드 데이터 생성
  const qrData = {
    type: 'payment',
    sender: senderNestId,
    receiver: receiverNestId,
    amount: Number(amount),
    token: tokenType,
    memo,
    timestamp: new Date().getTime()
  };
  
  return JSON.stringify(qrData);
};

/**
 * NFT 전송용 QR 코드 데이터 생성
 * @param {string} senderNestId - 발신자 Nest ID
 * @param {string} receiverNestId - 수신자 Nest ID
 * @param {string} tokenId - NFT 토큰 ID
 * @param {string} memo - 메모 (선택사항)
 * @returns {string} QR 코드 데이터
 */
export const generateNFTTransferQRData = (senderNestId, receiverNestId, tokenId, memo = '') => {
  // 유효성 검사
  if (!receiverNestId) {
    throw new Error('수신자 Nest ID가 필요합니다.');
  }
  
  if (!tokenId) {
    throw new Error('NFT 토큰 ID가 필요합니다.');
  }
  
  // JSON 형식의 QR 코드 데이터 생성
  const qrData = {
    type: 'nft_transfer',
    sender: senderNestId,
    receiver: receiverNestId,
    tokenId,
    memo,
    timestamp: new Date().getTime()
  };
  
  return JSON.stringify(qrData);
};

/**
 * QR 코드 데이터 파싱
 * @param {string} qrData - QR 코드 데이터
 * @returns {Object} 파싱된 데이터
 */
export const parseQRData = (qrData) => {
  try {
    // Nest ID 형식 확인
    if (qrData.startsWith('nest://')) {
      const nestId = qrData.replace('nest://', '');
      return {
        type: 'nestid',
        nestId
      };
    }
    
    // JSON 형식 확인
    try {
      const jsonData = JSON.parse(qrData);
      
      // type 필드에 따라 구분
      if (jsonData.type) {
        return jsonData;
      }
      
      return {
        type: 'unknown',
        data: jsonData
      };
    } catch {
      // JSON이 아닌 일반 문자열
      return {
        type: 'text',
        text: qrData
      };
    }
  } catch (error) {
    console.error('QR 코드 데이터 파싱 오류:', error);
    throw new Error('QR 코드 데이터 파싱 중 오류가 발생했습니다.');
  }
};

/**
 * SVG 문자열로 QR 코드 생성
 * @param {string} data - QR 코드에 포함할 데이터
 * @param {Object} options - QR 코드 생성 옵션
 * @returns {Promise<string>} SVG 문자열
 */
export const generateQRSVG = async (data, options = {}) => {
  try {
    // 기본 옵션
    const defaultOptions = {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };
    
    // 사용자 옵션과 병합
    const mergedOptions = { ...defaultOptions, ...options };
    
    // QR 코드 생성 (SVG 문자열)
    const svgString = await QRCode.toString(data, {
      ...mergedOptions,
      type: 'svg'
    });
    
    return svgString;
  } catch (error) {
    console.error('QR 코드 SVG 생성 오류:', error);
    throw new Error('QR 코드 SVG 생성 중 오류가 발생했습니다.');
  }
};

/**
 * QR 코드 로고 추가 (캔버스)
 * @param {HTMLCanvasElement} canvas - QR 코드가 그려진 캔버스
 * @param {string} logoUrl - 로고 이미지 URL
 * @param {number} logoSize - 로고 크기 (QR 코드 크기 대비 비율, 0.0 ~ 1.0)
 * @returns {Promise<void>}
 */
export const addLogoToQRCanvas = async (canvas, logoUrl, logoSize = 0.2) => {
  try {
    return new Promise((resolve, reject) => {
      const ctx = canvas.getContext('2d');
      const qrSize = canvas.width;
      
      // 로고 이미지 로드
      const logo = new Image();
      logo.onload = () => {
        try {
          // 로고 크기 계산
          const logoWidth = qrSize * logoSize;
          const logoHeight = logoWidth * (logo.height / logo.width);
          
          // 로고를 중앙에 배치
          const logoX = (qrSize - logoWidth) / 2;
          const logoY = (qrSize - logoHeight) / 2;
          
          // 로고 영역에 하얀색 배경 추가
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(logoX, logoY, logoWidth, logoHeight);
          
          // 로고 그리기
          ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
          
          resolve();
        } catch (error) {
          reject(new Error('로고 추가 중 오류가 발생했습니다.'));
        }
      };
      
      logo.onerror = () => {
        reject(new Error('로고 이미지 로드 중 오류가 발생했습니다.'));
      };
      
      logo.src = logoUrl;
    });
  } catch (error) {
    console.error('QR 코드 로고 추가 오류:', error);
    throw error;
  }
};

export default {
  generateQRDataURL,
  renderQRToCanvas,
  generateNestIdQRData,
  generatePaymentQRData,
  generateNFTTransferQRData,
  parseQRData,
  generateQRSVG,
  addLogoToQRCanvas
};
