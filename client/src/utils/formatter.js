/**
 * formatter.js
 * 다양한 형식 변환 및 포맷팅 유틸리티 함수 모음
 */

/**
 * 숫자를 통화 형식으로 변환
 * @param {number} amount - 변환할 금액
 * @param {string} currency - 통화 유형 (NEST, CTA 등)
 * @param {number} decimals - 소수점 자릿수 (기본값: 2)
 * @returns {string} 통화 형식으로 변환된 문자열
 */
export const formatCurrency = (amount, currency = 'NEST', decimals = 2) => {
  if (amount === undefined || amount === null) {
    return `0 ${currency}`;
  }
  
  // 숫자로 변환
  const numAmount = Number(amount);
  
  // NaN 체크
  if (isNaN(numAmount)) {
    return `0 ${currency}`;
  }
  
  // 소수점 자릿수 제한
  const formattedAmount = numAmount.toFixed(decimals);
  
  // 천 단위 콤마 추가
  const parts = formattedAmount.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return `${parts.join('.')} ${currency}`;
};

/**
 * 날짜를 원하는 형식으로 변환
 * @param {Date|string|number} date - 변환할 날짜
 * @param {string} format - 날짜 형식 (기본값: 'YYYY-MM-DD')
 * @returns {string} 형식화된 날짜 문자열
 */
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) {
    return '';
  }
  
  const d = new Date(date);
  
  // 유효한 날짜인지 확인
  if (isNaN(d.getTime())) {
    return '';
  }
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  // 형식에 따라 변환
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

/**
 * 날짜를 상대적 시간으로 변환 (예: "5분 전", "2일 전")
 * @param {Date|string|number} date - 변환할 날짜
 * @returns {string} 상대적 시간 문자열
 */
export const formatRelativeTime = (date) => {
  if (!date) {
    return '';
  }
  
  const d = new Date(date);
  
  // 유효한 날짜인지 확인
  if (isNaN(d.getTime())) {
    return '';
  }
  
  const now = new Date();
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffMonth / 12);
  
  if (diffSec < 60) {
    return '방금 전';
  } else if (diffMin < 60) {
    return `${diffMin}분 전`;
  } else if (diffHour < 24) {
    return `${diffHour}시간 전`;
  } else if (diffDay < 30) {
    return `${diffDay}일 전`;
  } else if (diffMonth < 12) {
    return `${diffMonth}개월 전`;
  } else {
    return `${diffYear}년 전`;
  }
};

/**
 * 지갑 주소를 줄임표로 축약 (예: "0x1234...5678")
 * @param {string} address - 지갑 주소
 * @param {number} startChars - 앞에 표시할 문자 수 (기본값: 6)
 * @param {number} endChars - 뒤에 표시할 문자 수 (기본값: 4)
 * @returns {string} 축약된 주소
 */
export const shortenAddress = (address, startChars = 6, endChars = 4) => {
  if (!address) {
    return '';
  }
  
  if (address.length <= startChars + endChars) {
    return address;
  }
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

/**
 * 트랜잭션 해시를 줄임표로 축약
 * @param {string} txHash - 트랜잭션 해시
 * @param {number} startChars - 앞에 표시할 문자 수 (기본값: 6)
 * @param {number} endChars - 뒤에 표시할 문자 수 (기본값: 4)
 * @returns {string} 축약된 해시
 */
export const shortenTxHash = (txHash, startChars = 6, endChars = 4) => {
  return shortenAddress(txHash, startChars, endChars);
};

/**
 * 숫자에 천 단위 콤마 추가
 * @param {number} value - 변환할 숫자
 * @returns {string} 콤마가 추가된 숫자 문자열
 */
export const formatNumber = (value) => {
  if (value === undefined || value === null) {
    return '0';
  }
  
  // 숫자로 변환
  const numValue = Number(value);
  
  // NaN 체크
  if (isNaN(numValue)) {
    return '0';
  }
  
  // 정수 부분만 콤마 추가
  const parts = numValue.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return parts.join('.');
};

/**
 * 파일 크기를 보기 좋은 형식으로 변환 (예: "1.5 MB")
 * @param {number} bytes - 바이트 단위 파일 크기
 * @param {number} decimals - 소수점 자릿수 (기본값: 2)
 * @returns {string} 형식화된 파일 크기
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) {
    return '0 Bytes';
  }
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
};

/**
 * XP 수치를 형식화 (예: "1,234 XP")
 * @param {number} xp - XP 값
 * @returns {string} 형식화된 XP 문자열
 */
export const formatXP = (xp) => {
  if (xp === undefined || xp === null) {
    return '0 XP';
  }
  
  return `${formatNumber(xp)} XP`;
};

/**
 * 레벨 정보를 형식화 (예: "레벨 5")
 * @param {number} level - 레벨 값
 * @returns {string} 형식화된 레벨 문자열
 */
export const formatLevel = (level) => {
  if (level === undefined || level === null) {
    return '레벨 1';
  }
  
  return `레벨 ${level}`;
};

/**
 * NFT ID를 형식화
 * @param {string} tokenId - NFT 토큰 ID
 * @returns {string} 형식화된 NFT ID
 */
export const formatNFTId = (tokenId) => {
  if (!tokenId) {
    return '';
  }
  
  // 숫자인 경우 앞에 # 추가
  if (/^\d+$/.test(tokenId)) {
    return `#${tokenId}`;
  }
  
  return tokenId;
};

/**
 * 전화번호 형식화 (예: "010-1234-5678")
 * @param {string} phoneNumber - 전화번호
 * @returns {string} 형식화된 전화번호
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) {
    return '';
  }
  
  // 숫자만 추출
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // 한국 전화번호 형식 적용
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  return phoneNumber;
};

/**
 * 이메일 주소 마스킹 (예: "ex***@example.com")
 * @param {string} email - 이메일 주소
 * @returns {string} 마스킹된 이메일 주소
 */
export const maskEmail = (email) => {
  if (!email) {
    return '';
  }
  
  const [username, domain] = email.split('@');
  
  if (!username || !domain) {
    return email;
  }
  
  // 사용자 이름 마스킹
  let maskedUsername = '';
  if (username.length <= 2) {
    maskedUsername = username.charAt(0) + '*'.repeat(username.length - 1);
  } else {
    maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
  }
  
  return `${maskedUsername}@${domain}`;
};

/**
 * 가스비 형식화 (예: "0.005 CTA")
 * @param {number} gasAmount - 가스비 양
 * @returns {string} 형식화된 가스비
 */
export const formatGasFee = (gasAmount) => {
  return formatCurrency(gasAmount, 'CTA', 5);
};

/**
 * 진행 상태 퍼센트 형식화 (예: "75%")
 * @param {number} value - 진행 값
 * @param {number} total - 전체 값
 * @returns {string} 퍼센트 형식 문자열
 */
export const formatProgressPercent = (value, total) => {
  if (!value || !total || total === 0) {
    return '0%';
  }
  
  const percent = Math.round((value / total) * 100);
  return `${percent}%`;
};

export default {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  shortenAddress,
  shortenTxHash,
  formatNumber,
  formatFileSize,
  formatXP,
  formatLevel,
  formatNFTId,
  formatPhoneNumber,
  maskEmail,
  formatGasFee,
  formatProgressPercent
};
