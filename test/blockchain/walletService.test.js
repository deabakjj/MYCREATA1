/**
 * @file 지갑 서비스 테스트
 * @description 지갑 생성, 개인키 암호화, 트랜잭션 서명 기능 테스트
 */

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const Web3 = require('web3');
const walletService = require('../../src/blockchain/walletService');
const keyManager = require('../../src/utils/keyManager');
const config = require('../../src/config');

describe('Wallet Service', () => {
  // Web3 모킹을 위한 샌드박스
  let sandbox;
  
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  
  afterEach(() => {
    sandbox.restore();
  });
  
  describe('generateEthereumWallet', () => {
    it('should generate a valid Ethereum wallet', async () => {
      // 함수 호출
      const wallet = await walletService.generateEthereumWallet();
      
      // 검증
      expect(wallet).to.have.property('address').that.is.a('string');
      expect(wallet.address).to.match(/^0x[a-fA-F0-9]{40}$/); // 올바른 이더리움 주소 형식
      expect(wallet).to.have.property('privateKey').that.is.a('string');
      expect(wallet).to.have.property('mnemonic').that.is.a('string');
      expect(wallet).to.have.property('encryptedMnemonic').that.is.an('object');
    });
  });
  
  describe('encryptPrivateKey and decryptPrivateKey', () => {
    it('should encrypt and decrypt private key correctly', () => {
      // 테스트 데이터
      const privateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const password = 'secure_password';
      
      // 개인키 암호화
      const encrypted = walletService.encryptPrivateKey(privateKey, password);
      
      // 검증
      expect(encrypted).to.have.property('iv').that.is.a('string');
      expect(encrypted).to.have.property('encryptedData').that.is.a('string');
      expect(encrypted).to.have.property('authTag').that.is.a('string');
      expect(encrypted).to.have.property('salt').that.is.a('string');
      
      // 개인키 복호화
      const decrypted = walletService.decryptPrivateKey(encrypted, password);
      
      // 검증
      expect(decrypted).to.equal(privateKey);
    });
    
    it('should throw error when using incorrect password for decryption', () => {
      // 테스트 데이터
      const privateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const correctPassword = 'correct_password';
      const wrongPassword = 'wrong_password';
      
      // 개인키 암호화
      const encrypted = walletService.encryptPrivateKey(privateKey, correctPassword);
      
      // 복호화 시도 (잘못된 비밀번호 사용)
      expect(() => {
        walletService.decryptPrivateKey(encrypted, wrongPassword);
      }).to.throw(Error);
    });
  });
  
  describe('signTransaction', () => {
    it('should sign a transaction correctly', async () => {
      // Web3 모킹
      const mockWeb3 = {
        eth: {
          accounts: {
            signTransaction: sinon.stub().resolves({
              rawTransaction: '0xsigned_transaction',
              transactionHash: '0xtx_hash'
            })
          }
        }
      };
      
      // getWeb3 함수 스텁
      sandbox.stub(Web3.prototype, 'eth').value(mockWeb3.eth);
      
      // 테스트 데이터
      const txData = {
        to: '0x1234567890abcdef1234567890abcdef12345678',
        value: '1000000000000000000', // 1 ETH
        gas: 21000,
        gasPrice: '20000000000' // 20 Gwei
      };
      const privateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      
      // 트랜잭션 서명
      const signedTx = await walletService.signTransaction(txData, privateKey);
      
      // 검증
      expect(signedTx).to.have.property('rawTransaction').that.is.a('string');
      expect(signedTx).to.have.property('transactionHash').that.is.a('string');
    });
  });
  
  describe('shardMnemonic and recoverFromShards', () => {
    it('should shard and recover mnemonic correctly', () => {
      // 테스트 데이터
      const mnemonic = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12';
      const totalShards = 3;
      const threshold = 2;
      
      // 키 관리자 스텁
      sandbox.stub(keyManager, 'splitSecret').returns(['shard1', 'shard2', 'shard3']);
      sandbox.stub(keyManager, 'recoverSecret').returns(mnemonic);
      
      // 니모닉 분할
      const shards = walletService.shardMnemonic(mnemonic, totalShards, threshold);
      
      // 검증
      expect(shards).to.be.an('array').with.lengthOf(3);
      
      // 니모닉 복구
      const recovered = walletService.recoverFromShards(shards.slice(0, 2));
      
      // 검증
      expect(recovered).to.equal(mnemonic);
      expect(keyManager.splitSecret.calledOnce).to.be.true;
      expect(keyManager.recoverSecret.calledOnce).to.be.true;
    });
  });
});
