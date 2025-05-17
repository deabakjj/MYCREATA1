/**
 * @file 지갑 서비스
 * @description 이더리움 및 CreataChain 지갑 생성 및 관리 기능 제공
 */

const crypto = require('crypto');
const Web3 = require('web3');
const { hdkey } = require('ethereumjs-wallet');
const bip39 = require('bip39');
const logger = require('../utils/logger');
const config = require('../config');
const keyManager = require('../utils/keyManager');

// Web3 인스턴스 생성
const mainnetWeb3 = new Web3(config.blockchain.creataMainnetRpc);
const testnetWeb3 = new Web3(config.blockchain.creataTestnetRpc);

// 현재 환경에 맞는 Web3 선택
const getWeb3 = (network = 'mainnet') => {
  return network === 'testnet' ? testnetWeb3 : mainnetWeb3;
};

/**
 * 이더리움 지갑 생성
 * 
 * @returns {Promise<Object>} 생성된 지갑 정보 (주소, 개인키)
 */
const generateEthereumWallet = async () => {
  try {
    // 니모닉 생성 (24단어)
    const mnemonic = bip39.generateMnemonic(256);
    
    // 니모닉에서 시드 생성
    const seed = await bip39.mnemonicToSeed(mnemonic);
    
    // HD 지갑 생성
    const hdWallet = hdkey.fromMasterSeed(seed);
    
    // 경로에서 첫 번째 계정 도출
    const path = "m/44'/60'/0'/0/0";
    const wallet = hdWallet.derivePath(path).getWallet();
    
    // 주소와 개인키 추출
    const address = '0x' + wallet.getAddress().toString('hex');
    const privateKey = wallet.getPrivateKey().toString('hex');
    
    // 니모닉 암호화
    const encryptedMnemonic = keyManager.encryptData(mnemonic, config.encryption.mnemonicKey);
    
    logger.info(`새 이더리움 지갑 생성됨: ${address}`);
    
    return {
      address,
      privateKey,
      mnemonic,
      encryptedMnemonic,
    };
  } catch (error) {
    logger.error(`지갑 생성 오류: ${error.message}`);
    throw new Error('지갑 생성 중 오류가 발생했습니다.');
  }
};

/**
 * 니모닉 암호화
 * @deprecated keyManager.encryptData 사용 권장
 * @param {string} mnemonic - 암호화할 니모닉
 * @returns {Object} 암호화된 니모닉 정보
 */
const encryptMnemonic = (mnemonic) => {
  try {
    return keyManager.encryptData(mnemonic, config.encryption.mnemonicKey);
  } catch (error) {
    logger.error(`니모닉 암호화 오류: ${error.message}`);
    throw new Error('니모닉 암호화 중 오류가 발생했습니다.');
  }
};

/**
 * 니모닉 복호화
 * @deprecated keyManager.decryptData 사용 권장
 * @param {Object} encryptedMnemonic - 암호화된 니모닉 정보
 * @returns {string} 복호화된 니모닉
 */
const decryptMnemonic = (encryptedMnemonic) => {
  try {
    return keyManager.decryptData(encryptedMnemonic, config.encryption.mnemonicKey);
  } catch (error) {
    logger.error(`니모닉 복호화 오류: ${error.message}`);
    throw new Error('니모닉 복호화 중 오류가 발생했습니다.');
  }
};

/**
 * 트랜잭션 서명 및 전송
 * 
 * @param {Object} txData - 트랜잭션 데이터
 * @param {string} privateKey - 개인키
 * @param {string} network - 네트워크 (mainnet 또는 testnet)
 * @returns {Promise<string>} 트랜잭션 해시
 */
const signAndSendTransaction = async (txData, privateKey, network = 'mainnet') => {
  try {
    const web3 = getWeb3(network);
    
    // 트랜잭션 서명
    const signedTx = await web3.eth.accounts.signTransaction(
      txData,
      privateKey
    );
    
    // 서명된 트랜잭션 전송
    const receipt = await web3.eth.sendSignedTransaction(
      signedTx.rawTransaction
    );
    
    logger.info(`트랜잭션 전송 성공: ${receipt.transactionHash}`);
    
    return receipt.transactionHash;
  } catch (error) {
    logger.error(`트랜잭션 전송 오류: ${error.message}`);
    throw new Error('트랜잭션 전송 중 오류가 발생했습니다: ' + error.message);
  }
};

/**
 * 트랜잭션 서명 (전송하지 않음)
 * 
 * @param {Object} txData - 트랜잭션 데이터
 * @param {string} privateKey - 개인키
 * @param {string} network - 네트워크 (mainnet 또는 testnet)
 * @returns {Promise<Object>} 서명된 트랜잭션
 */
const signTransaction = async (txData, privateKey, network = 'mainnet') => {
  try {
    const web3 = getWeb3(network);
    
    // 트랜잭션 서명
    const signedTx = await web3.eth.accounts.signTransaction(
      txData,
      privateKey
    );
    
    return signedTx;
  } catch (error) {
    logger.error(`트랜잭션 서명 오류: ${error.message}`);
    throw new Error('트랜잭션 서명 중 오류가 발생했습니다: ' + error.message);
  }
};

/**
 * 지갑 잔액 조회
 * 
 * @param {string} address - 지갑 주소
 * @param {string} network - 네트워크 (mainnet 또는 testnet)
 * @returns {Promise<string>} 잔액 (wei 단위)
 */
const getWalletBalance = async (address, network = 'mainnet') => {
  try {
    const web3 = getWeb3(network);
    
    // 잔액 조회
    const balance = await web3.eth.getBalance(address);
    
    return balance;
  } catch (error) {
    logger.error(`잔액 조회 오류: ${error.message}`);
    throw new Error('잔액 조회 중 오류가 발생했습니다.');
  }
};

/**
 * 토큰 잔액 조회
 * 
 * @param {string} address - 지갑 주소
 * @param {string} tokenAddress - 토큰 컨트랙트 주소
 * @param {string} network - 네트워크 (mainnet 또는 testnet)
 * @returns {Promise<string>} 토큰 잔액
 */
const getTokenBalance = async (address, tokenAddress, network = 'mainnet') => {
  try {
    const web3 = getWeb3(network);
    
    // ERC20 ABI - balanceOf 함수만 포함
    const minimalABI = [
      {
        constant: true,
        inputs: [{ name: '_owner', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: 'balance', type: 'uint256' }],
        type: 'function',
      },
    ];
    
    // 토큰 컨트랙트 인스턴스 생성
    const tokenContract = new web3.eth.Contract(minimalABI, tokenAddress);
    
    // 토큰 잔액 조회
    const balance = await tokenContract.methods.balanceOf(address).call();
    
    return balance;
  } catch (error) {
    logger.error(`토큰 잔액 조회 오류: ${error.message}`);
    throw new Error('토큰 잔액 조회 중 오류가 발생했습니다.');
  }
};

/**
 * 니모닉 분산 저장 (Shamir's Secret Sharing 사용)
 * 
 * @param {string} mnemonic - 니모닉
 * @param {number} totalShards - 총 조각 수 (기본값: 3)
 * @param {number} threshold - 복구에 필요한 최소 조각 수 (기본값: 2)
 * @returns {Array<string>} 니모닉 조각
 */
const shardMnemonic = (mnemonic, totalShards = 3, threshold = 2) => {
  try {
    // keyManager를 사용하여 보다 안전한 방식으로 비밀 분할
    return keyManager.splitSecret(mnemonic, totalShards, threshold);
  } catch (error) {
    logger.error(`니모닉 샤딩 오류: ${error.message}`);
    throw new Error('니모닉 샤딩 중 오류가 발생했습니다.');
  }
};

/**
 * 니모닉 샤드 복구
 * 
 * @param {Array<string>} shards - 니모닉 조각
 * @returns {string} 복구된 니모닉
 */
const recoverFromShards = (shards) => {
  try {
    // keyManager를 사용하여 비밀 복구
    return keyManager.recoverSecret(shards);
  } catch (error) {
    logger.error(`니모닉 복구 오류: ${error.message}`);
    throw new Error('니모닉 복구 중 오류가 발생했습니다.');
  }
};

/**
 * 개인키 암호화
 * 
 * @param {string} privateKey - 암호화할 개인키
 * @param {string} password - 암호화에 사용할 비밀번호
 * @returns {Object} 암호화된 개인키 정보
 */
const encryptPrivateKey = (privateKey, password) => {
  try {
    // 비밀번호로부터 키 파생
    const { key, salt } = keyManager.deriveKeyFromPassword(password);
    
    // 개인키 암호화
    const encryptedData = keyManager.encryptData(privateKey, key);
    
    // 솔트 추가
    return {
      ...encryptedData,
      salt
    };
  } catch (error) {
    logger.error(`개인키 암호화 오류: ${error.message}`);
    throw new Error('개인키 암호화 중 오류가 발생했습니다.');
  }
};

/**
 * 개인키 복호화
 * 
 * @param {Object} encryptedData - 암호화된 개인키 정보
 * @param {string} password - 암호화에 사용한 비밀번호
 * @returns {string} 복호화된 개인키
 */
const decryptPrivateKey = (encryptedData, password) => {
  try {
    const { salt } = encryptedData;
    
    // 비밀번호로부터 키 파생
    const { key } = keyManager.deriveKeyFromPassword(password, salt);
    
    // 개인키 복호화
    return keyManager.decryptData(encryptedData, key);
  } catch (error) {
    logger.error(`개인키 복호화 오류: ${error.message}`);
    throw new Error('개인키 복호화 중 오류가 발생했습니다.');
  }
};

module.exports = {
  generateEthereumWallet,
  encryptMnemonic,
  decryptMnemonic,
  signAndSendTransaction,
  signTransaction,
  getWalletBalance,
  getTokenBalance,
  shardMnemonic,
  recoverFromShards,
  encryptPrivateKey,
  decryptPrivateKey
};
