/**
 * @file 키 관리 유틸리티 테스트
 * @description 암호화 키 관리 및 키 복원 기능을 테스트합니다.
 */

const { expect } = require('chai');
const keyManager = require('../../src/utils/keyManager');

describe('키 관리 유틸리티 테스트', () => {
  describe('데이터 암호화/복호화', () => {
    it('문자열 데이터를 암호화하고 복호화해야 함', () => {
      const data = 'test-data-string';
      const secretKey = 'test-secret-key';
      
      const encrypted = keyManager.encryptData(data, secretKey);
      
      // 암호화된 결과가 올바른 프로퍼티를 가져야 함
      expect(encrypted).to.have.property('iv').to.be.a('string');
      expect(encrypted).to.have.property('encryptedData').to.be.a('string');
      expect(encrypted).to.have.property('authTag').to.be.a('string');
      expect(encrypted).to.have.property('algorithm', 'aes-256-gcm');
      
      // 데이터가 원본과 달라야 함
      expect(encrypted.encryptedData).to.not.equal(data);
      
      // 복호화된 데이터가 원본과 일치해야 함
      const decrypted = keyManager.decryptData(encrypted, secretKey);
      expect(decrypted).to.equal(data);
    });
    
    it('JSON 데이터를 암호화하고 복호화해야 함', () => {
      const data = JSON.stringify({ key: 'value', nested: { key: 'value' } });
      const secretKey = 'test-secret-key';
      
      const encrypted = keyManager.encryptData(data, secretKey);
      const decrypted = keyManager.decryptData(encrypted, secretKey);
      
      expect(decrypted).to.equal(data);
      expect(JSON.parse(decrypted)).to.deep.equal(JSON.parse(data));
    });
    
    it('잘못된 키로 복호화하면 에러가 발생해야 함', () => {
      const data = 'test-data-string';
      const secretKey = 'test-secret-key';
      const wrongKey = 'wrong-secret-key';
      
      const encrypted = keyManager.encryptData(data, secretKey);
      
      expect(() => keyManager.decryptData(encrypted, wrongKey)).to.throw();
    });
  });
  
  describe('비밀 분할 및 복구', () => {
    it('비밀을 분할하고 모든 조각으로 복구해야 함', () => {
      const secret = 'my-secret-mnemonic-phrase';
      const totalShards = 3;
      const threshold = 2;
      
      const shards = keyManager.splitSecret(secret, totalShards, threshold);
      
      // 조각 수가 올바른지 확인
      expect(shards).to.be.an('array').with.lengthOf(totalShards);
      
      // 모든 조각으로 복구
      const recovered = keyManager.recoverSecret(shards);
      expect(recovered).to.equal(secret);
    });
    
    it('임계값만큼의 조각으로 비밀을 복구해야 함', () => {
      const secret = 'my-secret-mnemonic-phrase';
      const totalShards = 5;
      const threshold = 3;
      
      const shards = keyManager.splitSecret(secret, totalShards, threshold);
      
      // 임계값만큼의 조각만 사용
      const partialShards = shards.slice(0, threshold);
      const recovered = keyManager.recoverSecret(partialShards);
      
      expect(recovered).to.equal(secret);
    });
    
    it('임계값 미만의 조각으로는 복구할 수 없어야 함', () => {
      const secret = 'my-secret-mnemonic-phrase';
      const totalShards = 5;
      const threshold = 3;
      
      const shards = keyManager.splitSecret(secret, totalShards, threshold);
      
      // 임계값보다 적은 조각 사용
      const partialShards = shards.slice(0, threshold - 1);
      
      expect(() => keyManager.recoverSecret(partialShards)).to.throw();
    });
  });
  
  describe('비밀번호 기반 키 파생', () => {
    it('동일한 비밀번호와 솔트로 동일한 키를 생성해야 함', () => {
      const password = 'user-password';
      const salt = 'fixed-salt';
      
      const result1 = keyManager.deriveKeyFromPassword(password, salt);
      const result2 = keyManager.deriveKeyFromPassword(password, salt);
      
      expect(result1.key).to.equal(result2.key);
      expect(result1.salt).to.equal(salt);
    });
    
    it('솔트를 제공하지 않으면 새로운 솔트를 생성해야 함', () => {
      const password = 'user-password';
      
      const result = keyManager.deriveKeyFromPassword(password);
      
      expect(result).to.have.property('key').to.be.a('string');
      expect(result).to.have.property('salt').to.be.a('string');
      expect(result.salt).to.not.be.empty;
    });
    
    it('서로 다른 비밀번호로 다른 키를 생성해야 함', () => {
      const password1 = 'user-password-1';
      const password2 = 'user-password-2';
      const salt = 'fixed-salt';
      
      const result1 = keyManager.deriveKeyFromPassword(password1, salt);
      const result2 = keyManager.deriveKeyFromPassword(password2, salt);
      
      expect(result1.key).to.not.equal(result2.key);
    });
  });
  
  describe('엔드 투 엔드 시나리오', () => {
    it('비밀번호로 파생된 키를 사용해 데이터를 암호화하고 복호화해야 함', () => {
      const password = 'user-secure-password';
      const data = 'sensitive-data-to-protect';
      
      // 비밀번호에서 키 파생
      const { key, salt } = keyManager.deriveKeyFromPassword(password);
      
      // 파생된 키로 데이터 암호화
      const encrypted = keyManager.encryptData(data, key);
      
      // 동일한 비밀번호와 솔트에서 키 다시 파생
      const { key: derivedKey } = keyManager.deriveKeyFromPassword(password, salt);
      
      // 파생된 키로 데이터 복호화
      const decrypted = keyManager.decryptData(encrypted, derivedKey);
      
      expect(decrypted).to.equal(data);
    });
    
    it('민감한 데이터를 분할하고 재결합하는 전체 흐름을 테스트', () => {
      const password = 'user-secure-password';
      const privateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      
      // 비밀번호에서 키 파생
      const { key, salt } = keyManager.deriveKeyFromPassword(password);
      
      // 개인키 암호화
      const encryptedPrivateKey = keyManager.encryptData(privateKey, key);
      
      // 암호화된 개인키를 3개 조각으로 분할 (임계값 2)
      const shards = keyManager.splitSecret(JSON.stringify(encryptedPrivateKey), 3, 2);
      
      // 2개 조각으로 암호화된 개인키 복구
      const recoveredEncryptedPK = JSON.parse(keyManager.recoverSecret(shards.slice(0, 2)));
      
      // 동일한 비밀번호와 솔트에서 키 다시 파생
      const { key: derivedKey } = keyManager.deriveKeyFromPassword(password, salt);
      
      // 암호화된 개인키 복호화
      const recoveredPrivateKey = keyManager.decryptData(recoveredEncryptedPK, derivedKey);
      
      expect(recoveredPrivateKey).to.equal(privateKey);
    });
  });
});
