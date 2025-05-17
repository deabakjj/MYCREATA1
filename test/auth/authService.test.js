/**
 * @file 인증 서비스 테스트
 * @description 사용자 등록, 로그인, 소셜 로그인, 지갑 생성 기능 테스트
 */

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const authService = require('../../src/auth/authService');
const walletService = require('../../src/blockchain/walletService');
const User = require('../../src/models/user');
const Wallet = require('../../src/models/wallet');
const config = require('../../src/config');

describe('Auth Service', () => {
  // 모킹을 위한 샌드박스
  let sandbox;
  
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  
  afterEach(() => {
    sandbox.restore();
  });
  
  describe('register', () => {
    it('should register a new user with wallet', async () => {
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
        save: walletSaveStub
      };
      
      // 모델 파인더 스텁
      sandbox.stub(User, 'findOne').resolves(null);
      sandbox.stub(mongoose.Model.prototype, 'save').resolves();
      
      // 생성자 스텁
      sandbox.stub(User, 'prototype').returns(userStub);
      sandbox.stub(Wallet, 'prototype').returns(walletStub);
      
      // 지갑 생성 스텁
      sandbox.stub(walletService, 'generateEthereumWallet').resolves({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        privateKey: 'private_key',
        mnemonic: 'mnemonic',
        encryptedMnemonic: { iv: 'iv', encryptedData: 'data', authTag: 'tag' }
      });
      
      // 토큰 생성 스텁
      sandbox.stub(jwt, 'sign').returns('test_jwt_token');
      
      // 테스트 데이터
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };
      
      // 함수 호출
      const result = await authService.register(userData);
      
      // 검증
      expect(result).to.have.property('user').that.is.an('object');
      expect(result).to.have.property('token').that.is.a('string');
      expect(result).to.have.property('refreshToken').that.is.a('string');
      expect(result.user).to.have.property('_id').that.equals('user_id');
      expect(result.user).to.have.property('email').that.equals('test@example.com');
      expect(result.user).to.have.property('wallet').that.is.an('object');
      expect(userSaveStub.calledTwice).to.be.true; // 두 번 호출됨 (초기 저장 + 지갑 연결 후)
    });
    
    it('should throw error if email already exists', async () => {
      // 모델 스텁
      sandbox.stub(User, 'findOne').resolves({
        _id: 'existing_user_id',
        email: 'existing@example.com'
      });
      
      // 테스트 데이터
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User'
      };
      
      // 함수 호출 및 검증
      try {
        await authService.register(userData);
        // 여기에 도달하면 안 됨
        expect.fail('Expected function to throw error');
      } catch (error) {
        expect(error.message).to.equal('이미 등록된 이메일입니다.');
      }
    });
  });
  
  describe('login', () => {
    it('should login a user successfully', async () => {
      // 모델 스텁
      const userSaveStub = sinon.stub().resolves();
      
      const userStub = {
        _id: 'user_id',
        email: 'test@example.com',
        name: 'Test User',
        socialProvider: 'local',
        isActive: true,
        wallet: { address: '0x1234567890abcdef1234567890abcdef12345678' },
        matchPassword: sinon.stub().resolves(true),
        save: userSaveStub
      };
      
      // 모델 파인더 스텁
      sandbox.stub(User, 'findOne').returns({
        select: sinon.stub().resolves(userStub)
      });
      
      // 토큰 생성 스텁
      sandbox.stub(jwt, 'sign').returns('test_jwt_token');
      
      // 함수 호출
      const result = await authService.login('test@example.com', 'password123');
      
      // 검증
      expect(result).to.have.property('user').that.is.an('object');
      expect(result).to.have.property('token').that.is.a('string');
      expect(result).to.have.property('refreshToken').that.is.a('string');
      expect(result.user).to.have.property('_id').that.equals('user_id');
      expect(result.user).to.have.property('email').that.equals('test@example.com');
      expect(userSaveStub.calledOnce).to.be.true; // 리프레시 토큰 저장 시 호출됨
    });
    
    it('should throw error if password does not match', async () => {
      // 모델 스텁
      const userStub = {
        _id: 'user_id',
        email: 'test@example.com',
        name: 'Test User',
        socialProvider: 'local',
        isActive: true,
        matchPassword: sinon.stub().resolves(false)
      };
      
      // 모델 파인더 스텁
      sandbox.stub(User, 'findOne').returns({
        select: sinon.stub().resolves(userStub)
      });
      
      // 함수 호출 및 검증
      try {
        await authService.login('test@example.com', 'wrong_password');
        // 여기에 도달하면 안 됨
        expect.fail('Expected function to throw error');
      } catch (error) {
        expect(error.message).to.equal('비밀번호가 일치하지 않습니다.');
      }
    });
  });
  
  describe('createWalletForUser', () => {
    it('should create a wallet for a user', async () => {
      // 모델 스텁
      const userStub = {
        _id: 'user_id',
        email: 'test@example.com',
        name: 'Test User'
      };
      
      const walletSaveStub = sinon.stub().resolves();
      
      const walletStub = {
        _id: 'wallet_id',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        save: walletSaveStub
      };
      
      // 모델 파인더 스텁
      sandbox.stub(User, 'findById').resolves(userStub);
      sandbox.stub(Wallet, 'findOne').resolves(null);
      
      // 생성자 스텁
      sandbox.stub(Wallet, 'prototype').returns(walletStub);
      
      // 지갑 생성 스텁
      sandbox.stub(walletService, 'generateEthereumWallet').resolves({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        privateKey: 'private_key',
        mnemonic: 'mnemonic',
        encryptedMnemonic: { iv: 'iv', encryptedData: 'data', authTag: 'tag' }
      });
      
      // 개인키 암호화 스텁
      sandbox.stub(walletService, 'encryptPrivateKey').returns({
        iv: 'iv',
        encryptedData: 'encrypted_data',
        authTag: 'auth_tag',
        salt: 'salt'
      });
      
      // JSON 문자열화 스텁
      sandbox.stub(JSON, 'stringify').returns('{"json":"data"}');
      
      // 함수 호출
      const result = await authService.createWalletForUser('user_id', 'password123');
      
      // 검증
      expect(result).to.have.property('address').that.equals('0x1234567890abcdef1234567890abcdef12345678');
      expect(walletSaveStub.calledOnce).to.be.true;
    });
    
    it('should return existing wallet if found', async () => {
      // 모델 스텁
      const userStub = {
        _id: 'user_id',
        email: 'test@example.com',
        name: 'Test User'
      };
      
      const existingWalletStub = {
        _id: 'wallet_id',
        address: '0x1234567890abcdef1234567890abcdef12345678'
      };
      
      // 모델 파인더 스텁
      sandbox.stub(User, 'findById').resolves(userStub);
      sandbox.stub(Wallet, 'findOne').resolves(existingWalletStub);
      
      // 함수 호출
      const result = await authService.createWalletForUser('user_id', 'password123');
      
      // 검증
      expect(result).to.equal(existingWalletStub);
      expect(walletService.generateEthereumWallet.called).to.be.false;
    });
  });
  
  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      // 토큰 검증 스텁
      sandbox.stub(jwt, 'verify').returns({ id: 'user_id' });
      
      // 토큰 생성 스텁
      sandbox.stub(jwt, 'sign').returns('new_access_token');
      
      // 모델 스텁
      const userStub = {
        _id: 'user_id',
        email: 'test@example.com',
        name: 'Test User',
        refreshToken: 'valid_refresh_token'
      };
      
      // 모델 파인더 스텁
      sandbox.stub(User, 'findById').returns({
        select: sinon.stub().resolves(userStub)
      });
      
      // 함수 호출
      const result = await authService.refreshAccessToken('valid_refresh_token');
      
      // 검증
      expect(result).to.have.property('token').that.equals('new_access_token');
    });
    
    it('should throw error if refresh token is invalid', async () => {
      // 토큰 검증 스텁
      sandbox.stub(jwt, 'verify').throws(new Error('Invalid token'));
      
      // 함수 호출 및 검증
      try {
        await authService.refreshAccessToken('invalid_refresh_token');
        // 여기에 도달하면 안 됨
        expect.fail('Expected function to throw error');
      } catch (error) {
        expect(error.message).to.include('리프레시 토큰 검증 실패');
      }
    });
  });
  
  describe('socialLogin', () => {
    it('should create new user if not exists', async () => {
      // 모델 스텁
      const userSaveStub = sinon.stub().resolves();
      const walletSaveStub = sinon.stub().resolves();
      
      const userStub = {
        _id: 'user_id',
        email: 'social@example.com',
        name: 'Social User',
        socialProvider: 'google',
        socialId: 'google_123',
        profileImage: 'default.png',
        isActive: true,
        wallet: {},
        save: userSaveStub
      };
      
      const walletStub = {
        _id: 'wallet_id',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        save: walletSaveStub
      };
      
      // 모델 파인더 스텁
      sandbox.stub(User, 'findOne').resolves(null);
      
      // 생성자 스텁
      sandbox.stub(User, 'prototype').returns(userStub);
      sandbox.stub(Wallet, 'prototype').returns(walletStub);
      
      // 지갑 생성 스텁
      sandbox.stub(authService, 'createWalletForUser').resolves({
        address: '0x1234567890abcdef1234567890abcdef12345678'
      });
      
      // 토큰 생성 스텁
      sandbox.stub(jwt, 'sign').returns('test_jwt_token');
      
      // 테스트 데이터
      const socialData = {
        provider: 'google',
        socialId: 'google_123',
        email: 'social@example.com',
        name: 'Social User',
        profileImage: 'profile.jpg'
      };
      
      // 함수 호출
      const result = await authService.socialLogin(socialData);
      
      // 검증
      expect(result).to.have.property('user').that.is.an('object');
      expect(result).to.have.property('token').that.is.a('string');
      expect(result).to.have.property('refreshToken').that.is.a('string');
      expect(result).to.have.property('isNewUser').that.is.a('boolean');
      expect(result.user).to.have.property('email').that.equals('social@example.com');
      expect(userSaveStub.called).to.be.true;
    });
    
    it('should update existing user if found by email', async () => {
      // 모델 스텁
      const userSaveStub = sinon.stub().resolves();
      
      const existingUserStub = {
        _id: 'user_id',
        email: 'social@example.com',
        name: 'Existing User',
        socialProvider: 'local',
        profileImage: 'default.png',
        wallet: { address: '0x1234567890abcdef1234567890abcdef12345678' },
        save: userSaveStub
      };
      
      // 모델 파인더 스텁
      const findOneStub = sandbox.stub(User, 'findOne');
      findOneStub.onFirstCall().resolves(null); // 소셜 ID로 검색 시
      findOneStub.onSecondCall().resolves(existingUserStub); // 이메일로 검색 시
      
      // 토큰 생성 스텁
      sandbox.stub(jwt, 'sign').returns('test_jwt_token');
      
      // 테스트 데이터
      const socialData = {
        provider: 'google',
        socialId: 'google_123',
        email: 'social@example.com',
        name: 'Social User',
        profileImage: 'profile.jpg'
      };
      
      // 함수 호출
      const result = await authService.socialLogin(socialData);
      
      // 검증
      expect(result).to.have.property('user').that.is.an('object');
      expect(result.user).to.have.property('email').that.equals('social@example.com');
      expect(existingUserStub.socialProvider).to.equal('google');
      expect(existingUserStub.socialId).to.equal('google_123');
      expect(existingUserStub.profileImage).to.equal('profile.jpg');
      expect(userSaveStub.called).to.be.true;
    });
  });
  
  describe('logout', () => {
    it('should log out a user successfully', async () => {
      // 모델 스텁
      const userSaveStub = sinon.stub().resolves();
      
      const userStub = {
        _id: 'user_id',
        email: 'test@example.com',
        name: 'Test User',
        refreshToken: 'old_refresh_token',
        save: userSaveStub
      };
      
      // 모델 파인더 스텁
      sandbox.stub(User, 'findById').resolves(userStub);
      
      // 함수 호출
      const result = await authService.logout('user_id');
      
      // 검증
      expect(result).to.be.true;
      expect(userStub.refreshToken).to.be.undefined;
      expect(userSaveStub.calledOnce).to.be.true;
    });
    
    it('should throw error if user not found', async () => {
      // 모델 파인더 스텁
      sandbox.stub(User, 'findById').resolves(null);
      
      // 함수 호출 및 검증
      try {
        await authService.logout('non_existent_user_id');
        // 여기에 도달하면 안 됨
        expect.fail('Expected function to throw error');
      } catch (error) {
        expect(error.message).to.equal('사용자를 찾을 수 없습니다.');
      }
    });
  });
});
