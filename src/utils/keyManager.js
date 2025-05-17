/**
 * @file 키 관리 유틸리티
 * @description 암호화 키 관리 및 키 복원 유틸리티
 */

const crypto = require('crypto');
const config = require('../config');
const logger = require('./logger');

/**
 * 데이터 암호화
 * 
 * @param {string} data - 암호화할 데이터
 * @param {string} [secretKey] - 암호화 키 (제공되지 않으면 환경 변수에서 가져옴)
 * @returns {Object} 암호화된 데이터 정보
 */
const encryptData = (data, secretKey = config.encryption.dataKey) => {
  try {
    if (!secretKey) {
      throw new Error('암호화 키가 제공되지 않았습니다.');
    }
    
    // 초기화 벡터 생성
    const iv = crypto.randomBytes(16);
    
    // 암호화 키 생성 (PBKDF2 사용)
    const key = crypto.pbkdf2Sync(
      secretKey,
      config.encryption.salt || 'default-salt',
      10000,
      32,
      'sha512'
    );
    
    // 암호화 알고리즘 설정
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    // 데이터 암호화
    let encryptedData = cipher.update(data, 'utf8', 'hex');
    encryptedData += cipher.final('hex');
    
    // 인증 태그 가져오기
    const authTag = cipher.getAuthTag().toString('hex');
    
    return {
      iv: iv.toString('hex'),
      encryptedData,
      authTag,
      algorithm: 'aes-256-gcm'
    };
  } catch (error) {
    logger.error(`데이터 암호화 오류: ${error.message}`);
    throw new Error('데이터 암호화 중 오류가 발생했습니다.');
  }
};

/**
 * 데이터 복호화
 * 
 * @param {Object} encryptedData - 암호화된 데이터 정보
 * @param {string} [secretKey] - 암호화 키 (제공되지 않으면 환경 변수에서 가져옴)
 * @returns {string} 복호화된 데이터
 */
const decryptData = (encryptedData, secretKey = config.encryption.dataKey) => {
  try {
    const { iv, encryptedData: data, authTag } = encryptedData;
    
    if (!secretKey) {
      throw new Error('암호화 키가 제공되지 않았습니다.');
    }
    
    // 암호화 키 생성 (PBKDF2 사용)
    const key = crypto.pbkdf2Sync(
      secretKey,
      config.encryption.salt || 'default-salt',
      10000,
      32,
      'sha512'
    );
    
    // 복호화 알고리즘 설정
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(iv, 'hex')
    );
    
    // 인증 태그 설정
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    // 데이터 복호화
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    logger.error(`데이터 복호화 오류: ${error.message}`);
    throw new Error('데이터 복호화 중 오류가 발생했습니다.');
  }
};

/**
 * 안전한 니모닉 분산 저장 (Shamir's Secret Sharing)
 * 
 * @param {string} secret - 니모닉 또는 개인키
 * @param {number} totalShards - 총 조각 수
 * @param {number} threshold - 복구에 필요한 최소 조각 수
 * @returns {Array<string>} 비밀 조각
 */
const splitSecret = (secret, totalShards = 3, threshold = 2) => {
  try {
    // 실제 구현에서는 'secrets.js-grempe' 또는 유사한 라이브러리 사용 권장
    // 아래는 단순화된 예시 구현입니다.
    const secretBuffer = Buffer.from(secret, 'utf8');
    const shards = [];
    
    // 각 샤드에 포함될 정보 (샤드 ID, 임계값, 총 샤드 수)
    for (let i = 1; i <= totalShards; i++) {
      // 고유 샤드 ID 생성
      const shardId = i.toString().padStart(2, '0');
      
      // 샤드 헤더 정보
      const header = `${shardId}|${threshold}|${totalShards}|`;
      
      // 샤드 데이터 암호화 (여기서는 간단한 XOR 사용)
      const encryptionKey = crypto.randomBytes(secretBuffer.length);
      const encryptedData = Buffer.alloc(secretBuffer.length);
      
      for (let j = 0; j < secretBuffer.length; j++) {
        encryptedData[j] = secretBuffer[j] ^ encryptionKey[j];
      }
      
      // 샤드 = 헤더 + 암호화 키 + 암호화된 데이터
      const shard = header + 
        encryptionKey.toString('hex') + '|' + 
        encryptedData.toString('hex');
      
      shards.push(shard);
    }
    
    return shards;
  } catch (error) {
    logger.error(`비밀 분할 오류: ${error.message}`);
    throw new Error('비밀 분할 중 오류가 발생했습니다.');
  }
};

/**
 * 니모닉 샤드 복구
 * 
 * @param {Array<string>} shards - 비밀 조각
 * @returns {string} 복구된 비밀
 */
const recoverSecret = (shards) => {
  try {
    if (!shards || shards.length === 0) {
      throw new Error('복구할 샤드가 제공되지 않았습니다.');
    }
    
    // 첫 번째 샤드에서 정보 추출
    const parts = shards[0].split('|');
    if (parts.length < 5) {
      throw new Error('잘못된 샤드 형식입니다.');
    }
    
    const threshold = parseInt(parts[1], 10);
    const totalShards = parseInt(parts[2], 10);
    
    // 임계값 확인
    if (shards.length < threshold) {
      throw new Error(`복구에 필요한 최소 샤드 수(${threshold})가 부족합니다.`);
    }
    
    // 샤드에서 암호화 키와 암호화된 데이터 추출
    const keyHex = parts[3];
    const dataHex = parts[4];
    
    const encryptionKey = Buffer.from(keyHex, 'hex');
    const encryptedData = Buffer.from(dataHex, 'hex');
    
    // 복호화 (XOR 연산)
    const secretBuffer = Buffer.alloc(encryptedData.length);
    for (let i = 0; i < encryptedData.length; i++) {
      secretBuffer[i] = encryptedData[i] ^ encryptionKey[i];
    }
    
    return secretBuffer.toString('utf8');
  } catch (error) {
    logger.error(`비밀 복구 오류: ${error.message}`);
    throw new Error('비밀 복구 중 오류가 발생했습니다.');
  }
};

/**
 * 안전한 키 파생
 * 
 * @param {string} password - 사용자 비밀번호
 * @param {string} [salt] - 솔트 (제공되지 않으면 새로 생성)
 * @returns {Object} 키와 솔트
 */
const deriveKeyFromPassword = (password, salt = null) => {
  try {
    // 솔트가 제공되지 않으면 새로 생성
    const usedSalt = salt || crypto.randomBytes(16).toString('hex');
    
    // PBKDF2를 사용하여 키 생성
    const key = crypto.pbkdf2Sync(
      password,
      usedSalt,
      100000, // 반복 횟수
      32, // 키 길이 (바이트)
      'sha512'
    ).toString('hex');
    
    return {
      key,
      salt: usedSalt
    };
  } catch (error) {
    logger.error(`키 파생 오류: ${error.message}`);
    throw new Error('키 파생 중 오류가 발생했습니다.');
  }
};

module.exports = {
  encryptData,
  decryptData,
  splitSecret,
  recoverSecret,
  deriveKeyFromPassword
};
