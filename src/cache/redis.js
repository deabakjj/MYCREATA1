/**
 * @file Redis 캐싱 서비스
 * @description 서버 성능 향상을 위한 Redis 캐싱 기능 구현
 */

const Redis = require('ioredis');
const config = require('../config');
const logger = require('../utils/logger');

// Redis 클라이언트 설정
let redisClient = null;

/**
 * Redis 클라이언트 초기화
 * @returns {Object} Redis 클라이언트 인스턴스
 */
const initRedis = () => {
  try {
    // 이미 초기화되어 있으면 기존 인스턴스 반환
    if (redisClient !== null) {
      return redisClient;
    }

    // Redis 연결 옵션
    const redisOptions = {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3
    };

    // Redis 클라이언트 생성
    redisClient = new Redis(redisOptions);

    // 이벤트 리스너 설정
    redisClient.on('connect', () => {
      logger.info('Redis 서버에 연결되었습니다.');
    });

    redisClient.on('error', (err) => {
      logger.error(`Redis 연결 오류: ${err.message}`);
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis 서버에 재연결 중입니다.');
    });

    return redisClient;
  } catch (error) {
    logger.error(`Redis 초기화 오류: ${error.message}`);
    throw new Error('Redis 초기화 중 오류가 발생했습니다.');
  }
};

/**
 * Redis 클라이언트 가져오기 (필요 시 초기화)
 * @returns {Object} Redis 클라이언트 인스턴스
 */
const getClient = () => {
  if (!redisClient) {
    return initRedis();
  }
  return redisClient;
};

/**
 * Redis 클라이언트 종료
 * @returns {Promise<boolean>} 성공 여부
 */
const closeRedis = async () => {
  try {
    if (redisClient) {
      await redisClient.quit();
      redisClient = null;
      logger.info('Redis 연결이 종료되었습니다.');
    }
    return true;
  } catch (error) {
    logger.error(`Redis 연결 종료 오류: ${error.message}`);
    throw new Error('Redis 연결을 종료하는 중 오류가 발생했습니다.');
  }
};

/**
 * 캐시에 데이터 저장
 * @param {string} key - 저장할 키
 * @param {any} value - 저장할 값
 * @param {number} ttl - 만료 시간(초) (선택사항)
 * @returns {Promise<boolean>} 성공 여부
 */
const setCache = async (key, value, ttl = null) => {
  try {
    const client = getClient();
    
    // 객체나 배열은 JSON 문자열로 변환
    const valueToStore = typeof value === 'object' 
      ? JSON.stringify(value) 
      : value.toString();
    
    if (ttl) {
      await client.set(key, valueToStore, 'EX', ttl);
    } else {
      await client.set(key, valueToStore);
    }
    
    return true;
  } catch (error) {
    logger.error(`캐시 저장 오류: ${error.message}`);
    return false;
  }
};

/**
 * 캐시에서 데이터 조회
 * @param {string} key - 조회할 키
 * @returns {Promise<any>} 조회된 값 (없으면 null)
 */
const getCache = async (key) => {
  try {
    const client = getClient();
    const value = await client.get(key);
    
    if (!value) {
      return null;
    }
    
    // JSON 문자열인 경우 객체로 변환
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  } catch (error) {
    logger.error(`캐시 조회 오류: ${error.message}`);
    return null;
  }
};

/**
 * 캐시에서 데이터 삭제
 * @param {string} key - 삭제할 키
 * @returns {Promise<boolean>} 성공 여부
 */
const deleteCache = async (key) => {
  try {
    const client = getClient();
    await client.del(key);
    return true;
  } catch (error) {
    logger.error(`캐시 삭제 오류: ${error.message}`);
    return false;
  }
};

/**
 * 패턴과 일치하는 모든 키 삭제
 * @param {string} pattern - 키 패턴 (예: 'user:*')
 * @returns {Promise<boolean>} 성공 여부
 */
const deleteByPattern = async (pattern) => {
  try {
    const client = getClient();
    
    // SCAN을 사용하여 패턴과 일치하는 모든 키 찾기
    let cursor = '0';
    let keys = [];
    
    do {
      const result = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = result[0];
      keys = [...keys, ...result[1]];
    } while (cursor !== '0');
    
    // 키가 있으면 삭제
    if (keys.length > 0) {
      await client.del(...keys);
      logger.info(`패턴 '${pattern}'과 일치하는 ${keys.length}개의 키가 삭제되었습니다.`);
    }
    
    return true;
  } catch (error) {
    logger.error(`패턴 삭제 오류: ${error.message}`);
    return false;
  }
};

/**
 * 키 존재 여부 확인
 * @param {string} key - 확인할 키
 * @returns {Promise<boolean>} 존재 여부
 */
const exists = async (key) => {
  try {
    const client = getClient();
    const result = await client.exists(key);
    return result === 1;
  } catch (error) {
    logger.error(`키 존재 확인 오류: ${error.message}`);
    return false;
  }
};

/**
 * 키 만료 시간 설정
 * @param {string} key - 대상 키
 * @param {number} ttl - 만료 시간(초)
 * @returns {Promise<boolean>} 성공 여부
 */
const expire = async (key, ttl) => {
  try {
    const client = getClient();
    await client.expire(key, ttl);
    return true;
  } catch (error) {
    logger.error(`키 만료 설정 오류: ${error.message}`);
    return false;
  }
};

/**
 * 해시 필드에 값 저장
 * @param {string} key - 해시 키
 * @param {string} field - 해시 필드
 * @param {any} value - 저장할 값
 * @returns {Promise<boolean>} 성공 여부
 */
const hset = async (key, field, value) => {
  try {
    const client = getClient();
    
    // 객체나 배열은 JSON 문자열로 변환
    const valueToStore = typeof value === 'object' 
      ? JSON.stringify(value) 
      : value.toString();
    
    await client.hset(key, field, valueToStore);
    return true;
  } catch (error) {
    logger.error(`해시 필드 저장 오류: ${error.message}`);
    return false;
  }
};

/**
 * 해시 필드에서 값 조회
 * @param {string} key - 해시 키
 * @param {string} field - 해시 필드
 * @returns {Promise<any>} 조회된 값 (없으면 null)
 */
const hget = async (key, field) => {
  try {
    const client = getClient();
    const value = await client.hget(key, field);
    
    if (!value) {
      return null;
    }
    
    // JSON 문자열인 경우 객체로 변환
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  } catch (error) {
    logger.error(`해시 필드 조회 오류: ${error.message}`);
    return null;
  }
};

/**
 * 해시 전체 조회
 * @param {string} key - 해시 키
 * @returns {Promise<Object>} 해시 전체 값 (없으면 빈 객체)
 */
const hgetall = async (key) => {
  try {
    const client = getClient();
    const hash = await client.hgetall(key);
    
    if (!hash || Object.keys(hash).length === 0) {
      return {};
    }
    
    // 각 필드의 값이 JSON 문자열인 경우 객체로 변환
    const result = {};
    for (const field in hash) {
      try {
        result[field] = JSON.parse(hash[field]);
      } catch (e) {
        result[field] = hash[field];
      }
    }
    
    return result;
  } catch (error) {
    logger.error(`해시 전체 조회 오류: ${error.message}`);
    return {};
  }
};

/**
 * 리스트에 항목 추가 (왼쪽)
 * @param {string} key - 리스트 키
 * @param {any} value - 추가할 값
 * @returns {Promise<boolean>} 성공 여부
 */
const lpush = async (key, value) => {
  try {
    const client = getClient();
    
    // 객체나 배열은 JSON 문자열로 변환
    const valueToStore = typeof value === 'object' 
      ? JSON.stringify(value) 
      : value.toString();
    
    await client.lpush(key, valueToStore);
    return true;
  } catch (error) {
    logger.error(`리스트 항목 추가(왼쪽) 오류: ${error.message}`);
    return false;
  }
};

/**
 * 리스트에 항목 추가 (오른쪽)
 * @param {string} key - 리스트 키
 * @param {any} value - 추가할 값
 * @returns {Promise<boolean>} 성공 여부
 */
const rpush = async (key, value) => {
  try {
    const client = getClient();
    
    // 객체나 배열은 JSON 문자열로 변환
    const valueToStore = typeof value === 'object' 
      ? JSON.stringify(value) 
      : value.toString();
    
    await client.rpush(key, valueToStore);
    return true;
  } catch (error) {
    logger.error(`리스트 항목 추가(오른쪽) 오류: ${error.message}`);
    return false;
  }
};

/**
 * 리스트 항목 범위 조회
 * @param {string} key - 리스트 키
 * @param {number} start - 시작 인덱스
 * @param {number} stop - 종료 인덱스
 * @returns {Promise<Array>} 리스트 항목 (없으면 빈 배열)
 */
const lrange = async (key, start, stop) => {
  try {
    const client = getClient();
    const items = await client.lrange(key, start, stop);
    
    if (!items || items.length === 0) {
      return [];
    }
    
    // 각 항목이 JSON 문자열인 경우 객체로 변환
    return items.map(item => {
      try {
        return JSON.parse(item);
      } catch (e) {
        return item;
      }
    });
  } catch (error) {
    logger.error(`리스트 항목 범위 조회 오류: ${error.message}`);
    return [];
  }
};

/**
 * 정렬된 집합에 항목 추가
 * @param {string} key - 정렬된 집합 키
 * @param {number} score - 점수
 * @param {any} value - 추가할 값
 * @returns {Promise<boolean>} 성공 여부
 */
const zadd = async (key, score, value) => {
  try {
    const client = getClient();
    
    // 객체나 배열은 JSON 문자열로 변환
    const valueToStore = typeof value === 'object' 
      ? JSON.stringify(value) 
      : value.toString();
    
    await client.zadd(key, score, valueToStore);
    return true;
  } catch (error) {
    logger.error(`정렬된 집합 항목 추가 오류: ${error.message}`);
    return false;
  }
};

/**
 * 정렬된 집합에서 점수 범위로 항목 조회
 * @param {string} key - 정렬된 집합 키
 * @param {number} min - 최소 점수
 * @param {number} max - 최대 점수
 * @param {Object} options - 추가 옵션 (선택사항)
 * @returns {Promise<Array>} 항목 목록 (없으면 빈 배열)
 */
const zrangebyscore = async (key, min, max, options = {}) => {
  try {
    const client = getClient();
    
    const { withScores = false, limit = null } = options;
    let args = [key, min, max];
    
    if (withScores) {
      args.push('WITHSCORES');
    }
    
    if (limit) {
      args = [...args, 'LIMIT', limit.offset, limit.count];
    }
    
    const items = await client.zrangebyscore(...args);
    
    if (!items || items.length === 0) {
      return [];
    }
    
    if (withScores) {
      // 항목과 점수가 번갈아 있는 배열을 객체로 변환
      const result = [];
      for (let i = 0; i < items.length; i += 2) {
        try {
          result.push({
            value: JSON.parse(items[i]),
            score: parseFloat(items[i + 1])
          });
        } catch (e) {
          result.push({
            value: items[i],
            score: parseFloat(items[i + 1])
          });
        }
      }
      return result;
    } else {
      // 각 항목이 JSON 문자열인 경우 객체로 변환
      return items.map(item => {
        try {
          return JSON.parse(item);
        } catch (e) {
          return item;
        }
      });
    }
  } catch (error) {
    logger.error(`정렬된 집합 항목 조회 오류: ${error.message}`);
    return [];
  }
};

/**
 * 캐시 서버 상태 확인
 * @returns {Promise<boolean>} 정상 여부
 */
const ping = async () => {
  try {
    const client = getClient();
    const response = await client.ping();
    return response === 'PONG';
  } catch (error) {
    logger.error(`Redis 상태 확인 오류: ${error.message}`);
    return false;
  }
};

module.exports = {
  initRedis,
  getClient,
  closeRedis,
  setCache,
  getCache,
  deleteCache,
  deleteByPattern,
  exists,
  expire,
  hset,
  hget,
  hgetall,
  lpush,
  rpush,
  lrange,
  zadd,
  zrangebyscore,
  ping
};
