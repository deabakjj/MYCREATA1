/**
 * CORS 옵션 미들웨어
 * 
 * 외부 DApp에서의 API 요청을 허용하기 위한 CORS(Cross-Origin Resource Sharing) 설정을 제공합니다.
 * 허용된 도메인 목록을 관리하고 요청 출처를 검증합니다.
 */

const cors = require('cors');
const config = require('../../config');
const logger = require('../../utils/logger');

// 허용된 도메인 목록 (설정에서 로드)
const allowedOrigins = config.cors?.allowedOrigins || [
  // 기본 허용 도메인
  'http://localhost:3000',
  'http://localhost:3001',
  'https://app.creatachain.com',
  'https://marketplace.creatachain.com',
  'https://swap.creatachain.com',
  'https://bridge.creatachain.com',
  'https://dao.creatachain.com'
];

// CORS 설정 옵션
const corsOptions = {
  origin: function (origin, callback) {
    // 개발 환경 또는 API 도구에서의 요청 허용 (origin이 없을 수 있음)
    if (!origin) {
      return callback(null, true);
    }
    
    // 허용된 도메인 확인
    if (isAllowedOrigin(origin, allowedOrigins)) {
      callback(null, true);
    } else {
      logger.warn(`CORS 오류: 허용되지 않은 도메인에서의 요청 (${origin})`);
      callback(new Error('CORS 정책에 의해 차단됨'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24시간 (초 단위)
};

/**
 * 도메인이 허용 목록에 있는지 확인
 * 
 * @param {string} origin - 요청 출처 도메인
 * @param {Array} allowedOrigins - 허용된 도메인 목록
 * @returns {boolean} 허용 여부
 */
function isAllowedOrigin(origin, allowedOrigins) {
  // 정확히 일치하는 도메인 확인
  if (allowedOrigins.includes(origin)) {
    return true;
  }
  
  // 와일드카드 도메인 확인 (예: *.creatachain.com)
  for (const allowed of allowedOrigins) {
    if (allowed.startsWith('*.')) {
      const domain = allowed.substring(2);
      if (origin.endsWith(domain) && origin.includes('://')) {
        // 서브도메인 추출
        const subdomain = origin.split('://')[1].split(domain)[0];
        // 서브도메인이 있고 마지막 문자가 .인 경우
        if (subdomain && subdomain.endsWith('.')) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * 동적 CORS 설정 (특정 도메인만 허용)
 * 
 * @param {Array} origins - 허용할 도메인 목록
 * @returns {Function} CORS 미들웨어
 */
function corsWithSpecificOrigins(origins) {
  const specificOptions = { ...corsOptions };
  
  specificOptions.origin = function (origin, callback) {
    // 개발 환경 또는 API 도구에서의 요청 허용 (origin이 없을 수 있음)
    if (!origin) {
      return callback(null, true);
    }
    
    // 허용된 도메인 확인
    if (isAllowedOrigin(origin, origins)) {
      callback(null, true);
    } else {
      logger.warn(`CORS 오류: 허용되지 않은 도메인에서의 요청 (${origin})`);
      callback(new Error('CORS 정책에 의해 차단됨'));
    }
  };
  
  return cors(specificOptions);
}

// 기본 CORS 미들웨어 (모든 허용 도메인)
const corsWithOptions = cors(corsOptions);

module.exports = corsWithOptions;
module.exports.corsWithSpecificOrigins = corsWithSpecificOrigins;
module.exports.isAllowedOrigin = isAllowedOrigin;
