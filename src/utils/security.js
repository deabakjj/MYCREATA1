const crypto = require('crypto');
const logger = require('./logger');

class SecurityManager {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
    this.saltLength = 64;
    this.tagLength = 16;
  }

  /**
   * 비공개 키 암호화
   * @param {string} privateKey - 암호화할 비공개 키
   * @param {string} password - 암호화에 사용할 비밀번호
   * @returns {Object} 암호화된 데이터와 메타데이터
   */
  encryptPrivateKey(privateKey, password) {
    try {
      // 솔트 생성
      const salt = crypto.randomBytes(this.saltLength);
      
      // 키 유도
      const key = crypto.pbkdf2Sync(
        password,
        salt,
        100000,
        this.keyLength,
        'sha512'
      );
      
      // IV 생성
      const iv = crypto.randomBytes(this.ivLength);
      
      // 암호화
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      const encrypted = Buffer.concat([
        cipher.update(privateKey, 'utf8'),
        cipher.final()
      ]);
      
      // 인증 태그
      const tag = cipher.getAuthTag();
      
      return {
        encrypted: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        salt: salt.toString('base64'),
        tag: tag.toString('base64')
      };
    } catch (error) {
      logger.error('비공개 키 암호화 실패:', error);
      throw new Error('비공개 키 암호화 중 오류가 발생했습니다.');
    }
  }

  /**
   * 비공개 키 복호화
   * @param {Object} encryptedData - 암호화된 데이터와 메타데이터
   * @param {string} password - 복호화에 사용할 비밀번호
   * @returns {string} 복호화된 비공개 키
   */
  decryptPrivateKey(encryptedData, password) {
    try {
      const { encrypted, iv, salt, tag } = encryptedData;
      
      // 키 유도
      const key = crypto.pbkdf2Sync(
        password,
        Buffer.from(salt, 'base64'),
        100000,
        this.keyLength,
        'sha512'
      );
      
      // 복호화
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        key,
        Buffer.from(iv, 'base64')
      );
      
      decipher.setAuthTag(Buffer.from(tag, 'base64'));
      
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encrypted, 'base64')),
        decipher.final()
      ]);
      
      return decrypted.toString('utf8');
    } catch (error) {
      logger.error('비공개 키 복호화 실패:', error);
      throw new Error('비공개 키 복호화 중 오류가 발생했습니다.');
    }
  }

  /**
   * 비공개 키 검증
   * @param {string} privateKey - 검증할 비공개 키
   * @returns {boolean} 유효성 여부
   */
  validatePrivateKey(privateKey) {
    try {
      // 기본 형식 검증
      if (!/^[0-9a-fA-F]{64}$/.test(privateKey)) {
        return false;
      }
      
      // 추가적인 검증 로직
      // (예: 체크섬 검증, 키 길이 검증 등)
      
      return true;
    } catch (error) {
      logger.error('비공개 키 검증 실패:', error);
      return false;
    }
  }
}

module.exports = new SecurityManager(); 