/**
 * @file 캐싱 미들웨어
 * @description API 응답을 캐싱하기 위한 Express 미들웨어
 */

const redisCache = require('../cache/redis');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * API 응답 캐싱 미들웨어
 * @param {Object} options - 캐싱 옵션
 * @returns {Function} Express 미들웨어 함수
 */
const cacheMiddleware = (options = {}) => {
  const {
    ttl = 300, // 기본 TTL: 300초(5분)
    keyPrefix = 'api:',
    checkCache = true, // 캐시 확인 여부 (비활성화 가능)
    saveCache = true,  // 캐시 저장 여부 (비활성화 가능)
    keyGenerator = null // 커스텀 키 생성 함수
  } = options;

  return async (req, res, next) => {
    try {
      // Redis가 활성화되어 있지 않은 경우 미들웨어 건너뛰기
      if (!config.redis || !config.redis.enabled) {
        return next();
      }

      // 캐시 키 생성
      const cacheKey = keyGenerator 
        ? keyGenerator(req) 
        : `${keyPrefix}${req.method}:${req.originalUrl}`;

      // 캐시 확인 여부가 비활성화된 경우 바로 다음 미들웨어로 이동
      if (!checkCache) {
        // 원본 res.send 함수 저장
        const originalSend = res.send;

        // res.send 함수 오버라이드
        res.send = function(body) {
          if (saveCache && res.statusCode >= 200 && res.statusCode < 300) {
            // 성공 응답만 캐싱
            redisCache.setCache(cacheKey, body, ttl)
              .catch(err => logger.error(`응답 캐싱 오류: ${err.message}`));
          }
          
          // 원본 send 함수 호출
          return originalSend.call(this, body);
        };

        return next();
      }

      // 캐시에서 데이터 조회
      const cachedResponse = await redisCache.getCache(cacheKey);

      if (cachedResponse) {
        // 캐시된 데이터가 있으면 반환
        logger.debug(`캐시된 응답 반환: ${cacheKey}`);
        
        // 캐시 헤더 추가
        res.set('X-Cache', 'HIT');
        
        return res.send(cachedResponse);
      } else {
        // 캐시된 데이터가 없으면 원본 res.send 함수 저장
        const originalSend = res.send;

        // res.send 함수 오버라이드
        res.send = function(body) {
          if (saveCache && res.statusCode >= 200 && res.statusCode < 300) {
            // 성공 응답만 캐싱
            redisCache.setCache(cacheKey, body, ttl)
              .catch(err => logger.error(`응답 캐싱 오류: ${err.message}`));
          }
          
          // 캐시 헤더 추가
          res.set('X-Cache', 'MISS');
          
          // 원본 send 함수 호출
          return originalSend.call(this, body);
        };

        next();
      }
    } catch (error) {
      logger.error(`캐싱 미들웨어 오류: ${error.message}`);
      next();
    }
  };
};

/**
 * 캐시 무효화 함수
 * @param {string} pattern - 무효화할 캐시 키 패턴
 * @returns {Promise<boolean>} 성공 여부
 */
const invalidateCache = async (pattern) => {
  try {
    if (!config.redis || !config.redis.enabled) {
      return true;
    }
    
    return await redisCache.deleteByPattern(pattern);
  } catch (error) {
    logger.error(`캐시 무효화 오류: ${error.message}`);
    return false;
  }
};

/**
 * 특정 엔티티 관련 캐시 무효화
 * @param {string} entityType - 엔티티 유형 (예: 'user', 'mission')
 * @param {string} entityId - 엔티티 ID (선택사항)
 * @returns {Promise<boolean>} 성공 여부
 */
const invalidateEntityCache = async (entityType, entityId = null) => {
  try {
    if (!config.redis || !config.redis.enabled) {
      return true;
    }
    
    const pattern = entityId
      ? `api:*:*/${entityType}*/${entityId}*`
      : `api:*:*/${entityType}*`;
    
    return await redisCache.deleteByPattern(pattern);
  } catch (error) {
    logger.error(`엔티티 캐시 무효화 오류: ${error.message}`);
    return false;
  }
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
  invalidateEntityCache
};
