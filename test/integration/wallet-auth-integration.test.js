/**
 * @file 인증 및 지갑 통합 테스트
 * @description 인증 및 지갑 연동 흐름 테스트
 */

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const authService = require('../../src/auth/authService');
const walletService = require('../../src/blockchain/walletService');
const keyManager = require('../../src/utils/keyManager');
const User = require('../../src/models/user');
const Wallet = require('../../src/models/wallet');

describe('Authentication and Wallet Integration', () => {
  // 모킹을 위한 샌드박스
  let sandbox;
  
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  
  afterEach(() => {
    sandbox.restore();
  });
  
  describe('Social Login to Wallet Creation Flow', () => {
    it('should register a user with social login and create a wallet', async () => {
      // 모델 스텁
      const userSaveStub = sinon.stub().resolves();
      const walletSaveStub = sinon.stub().resolves();
      
      const userStub = {
        _id: 'user_id',
        email: 'social@example.com',
        name: 'Social User',
        socialProvider: 'google',
        socialId: 'google_123',
        profileImage: 'profile.jpg',
        isActive: true,
        wallet: {},
        save: userSaveStub
      };
      
      const walletStub = {
        _id: 'wallet_id',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        encryptedPrivateKey: '{"encrypted":"data"}',
        encryptedMnemonic: '{"encrypted":"mnemonic"}',
        save: walletSaveStub
      };
      
      // 모델 파인더 스텁
      sandbox.stub(User, 'findOne').resolves(null);
      sandbox.stub(User, 'findById').resolves(userStub);
      sandbox.stub(Wallet, 'findOne').resolves(null);
      
      // 생성자 스텁
      sandbox.stub(User, 'prototype').returns(userStub);
      sandbox.stub(Wallet, 'prototype').returns(walletStub);
      
      // 지갑 생성 스텁
      sandbox.stub(walletService, 'generateEthereumWallet').resolves({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        privateKey: 'private_key',
        mnemonic: 'mnemonic phrase',
        encryptedMnemonic: { iv: 'iv', encryptedData: 'data', authTag: 'tag' }
      });
      
      // 개인키 암호화 스텁
      sandbox.stub(walletService, 'encryptPrivateKey').returns({
        iv: 'iv',
        encryptedData: 'encrypted_data',
        authTag: 'auth_tag',
        salt: 'salt'
      });
      
      // 키 관리자 스텁
      sandbox.stub(keyManager, 'encryptData').returns({
        iv: 'iv',
        encryptedData: 'encrypted_data',
        authTag: 'auth_tag',
        algorithm: 'aes-256-gcm'
      });
      
      // JWT 스텁
      sandbox.stub(require('jsonwebtoken'), 'sign').returns('test_jwt_token');
      
      // JSON 문자열화 스텁
      sandbox.stub(JSON, 'stringify').returns('{"json":"data"}');
      
      // 테스트 데이터
      const socialData = {
        provider: 'google',
        socialId: 'google_123',
        email: 'social@example.com',
        name: 'Social User',
        profileImage: 'profile.jpg'
      };
      
      // 소셜 로그인
      const loginResult = await authService.socialLogin(socialData);
      
      // 소셜 로그인 결과 검증
      expect(loginResult).to.have.property('user').that.is.an('object');
      expect(loginResult).to.have.property('token').that.is.a('string');
      expect(loginResult).to.have.property('refreshToken').that.is.a('string');
      expect(loginResult).to.have.property('isNewUser').to.be.true;
      
      // 지갑 정보 검증
      expect(userStub.wallet).to.have.property('address').that.equals('0x1234567890abcdef1234567890abcdef12345678');
    });
  });
  
  describe('Wallet Key Recovery Flow', () => {
    it('should encrypt and decrypt private key correctly', () => {
      // 테스트 데이터
      const privateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const password = 'secure_password';
      
      // 키 파생 스텁
      sandbox.stub(keyManager, 'deriveKeyFromPassword').returns({
        key: 'derived_key',
        salt: 'derived_salt'
      });
      
      // 암호화/복호화 스텁
      const encryptStub = sandbox.stub(keyManager, 'encryptData').returns({
        iv: 'iv',
        encryptedData: 'encrypted_data',
        authTag: 'auth_tag'
      });
      
      const decryptStub = sandbox.stub(keyManager, 'decryptData').returns(privateKey);
      
      // 개인키 암호화
      const encrypted = walletService.encryptPrivateKey(privateKey, password);
      
      // 암호화 결과 검증
      expect(encrypted).to.have.property('iv').that.equals('iv');
      expect(encrypted).to.have.property('encryptedData').that.equals('encrypted_data');
      expect(encrypted).to.have.property('authTag').that.equals('auth_tag');
      expect(encrypted).to.have.property('salt').that.equals('derived_salt');
      
      // 개인키 복호화
      const decrypted = walletService.decryptPrivateKey(encrypted, password);
      
      // 복호화 결과 검증
      expect(decrypted).to.equal(privateKey);
      expect(encryptStub.calledOnce).to.be.true;
      expect(decryptStub.calledOnce).to.be.true;
    });
    
    it('should shard and recover mnemonic correctly', () => {
      // 테스트 데이터
      const mnemonic = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12';
      const totalShards = 3;
      const threshold = 2;
      const shards = ['shard1', 'shard2', 'shard3'];
      
      // 비밀 분할/복구 스텁
      sandbox.stub(keyManager, 'splitSecret').returns(shards);
      sandbox.stub(keyManager, 'recoverSecret').returns(mnemonic);
      
      // 니모닉 분할
      const resultShards = walletService.shardMnemonic(mnemonic, totalShards, threshold);
      
      // 분할 결과 검증
      expect(resultShards).to.deep.equal(shards);
      
      // 니모닉 복구
      const recoveredMnemonic = walletService.recoverFromShards(resultShards.slice(0, 2));
      
      // 복구 결과 검증
      expect(recoveredMnemonic).to.equal(mnemonic);
    });
  });
  
  describe('Full Authentication and Wallet Workflow', () => {
    it('should handle the complete user registration and wallet creation flow', async () => {
      // 모델 스텁
      const userSaveStub = sinon.stub().resolves();
      const walletSaveStub = sinon.stub().resolves();
      
      const userStub = {
        _id: 'user_id',
        email: 'test@example.com',
        name: 'Test User',
        socialProvider: 'local',
        wallet: {},
        save: userSaveStub
      };
      
      const walletStub = {
        _id: 'wallet_id',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        encryptedPrivateKey: '{"encrypted":"data"}',
        encryptedMnemonic: '{"encrypted":"mnemonic"}',
        save: walletSaveStub
      };
      
      // 모델 파인더 스텁
      sandbox.stub(User, 'findOne').resolves(null);
      sandbox.stub(User, 'findById').resolves(userStub);
      sandbox.stub(Wallet, 'findOne').resolves(null);
      
      // 생성자 스텁
      sandbox.stub(User, 'prototype').returns(userStub);
      sandbox.stub(Wallet, 'prototype').returns(walletStub);
      
      // 지갑 생성 스텁
      sandbox.stub(walletService, 'generateEthereumWallet').resolves({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        privateKey: 'private_key',
        mnemonic: 'mnemonic phrase',
        encryptedMnemonic: { iv: 'iv', encryptedData: 'data', authTag: 'tag' }
      });
      
      // 개인키 암호화 스텁
      sandbox.stub(walletService, 'encryptPrivateKey').returns({
        iv: 'iv',
        encryptedData: 'encrypted_data',
        authTag: 'auth_tag',
        salt: 'salt'
      });
      
      // 키 관리자 스텁
      sandbox.stub(keyManager, 'encryptData').returns({
        iv: 'iv',
        encryptedData: 'encrypted_data',
        authTag: 'auth_tag',
        algorithm: 'aes-256-gcm'
      });
      
      sandbox.stub(keyManager, 'decryptData').returns('decrypted_data');
      
      // JWT 스텁
      sandbox.stub(require('jsonwebtoken'), 'sign').returns('test_jwt_token');
      sandbox.stub(require('jsonwebtoken'), 'verify').returns({ id: 'user_id' });
      
      // JSON 스텁
      sandbox.stub(JSON, 'stringify').returns('{"json":"data"}');
      sandbox.stub(JSON, 'parse').returns({ parsed: 'data' });
      
      // 1. 사용자 등록
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };
      
      const registerResult = await authService.register(userData);
      
      // 등록 결과 검증
      expect(registerResult).to.have.property('user').that.is.an('object');
      expect(registerResult).to.have.property('token').that.is.a('string');
      expect(registerResult.user).to.have.property('wallet').that.is.an('object');
      
      // 2. 로그인 테스트
      // 비밀번호 일치 스텁
      userStub.matchPassword = sinon.stub().resolves(true);
      
      const loginResult = await authService.login('test@example.com', 'password123');
      
      // 로그인 결과 검증
      expect(loginResult).to.have.property('user').that.is.an('object');
      expect(loginResult).to.have.property('token').that.is.a('string');
      expect(loginResult.user).to.have.property('wallet').that.is.an('object');
      
      // 3. 토큰 갱신 테스트
      const refreshResult = await authService.refreshAccessToken('valid_refresh_token');
      
      // 토큰 갱신 결과 검증
      expect(refreshResult).to.have.property('token').that.is.a('string');
      
      // 4. 로그아웃 테스트
      const logoutResult = await authService.logout('user_id');
      
      // 로그아웃 결과 검증
      expect(logoutResult).to.be.true;
      expect(userStub.refreshToken).to.be.undefined;
    });
  });
});
