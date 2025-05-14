/**
 * nestIdService.js
 * Nest ID (.nest 도메인) 관련 비즈니스 로직을 처리하는 서비스
 */

const Web3 = require('web3');
const User = require('../models/user');
const Wallet = require('../models/wallet');
const Activity = require('../models/activity');
const logger = require('../utils/logger');
const config = require('../config');

// ABI 가져오기
const NestNameRegistryABI = require('../../contracts/build/contracts/NestNameRegistry.json').abi;

// Web3 인스턴스 생성
const web3 = new Web3(new Web3.providers.HttpProvider(config.blockchain.rpcURL));

// 컨트랙트 인스턴스 생성
const nameRegistryContract = new web3.eth.Contract(
  NestNameRegistryABI,
  config.blockchain.contracts.nestNameRegistry
);

/**
 * Nest ID의 유효성을 검사합니다.
 * @param {string} nestId - 검사할 Nest ID
 * @returns {boolean} 유효성 여부
 */
const validateNestId = (nestId) => {
  // Nest ID 유효성 검사 규칙
  const nestIdRegex = /^[a-z0-9][a-z0-9-]{2,29}\.nest$/;
  if (!nestIdRegex.test(nestId)) {
    return false;
  }
  
  // 예약어 체크
  const reservedWords = ['admin', 'system', 'nest', 'token', 'nft', 'dao', 'wallet', 'creata', 'cta'];
  const name = nestId.split('.')[0];
  if (reservedWords.includes(name)) {
    return false;
  }
  
  return true;
};

/**
 * Nest ID가 이미 등록되어 있는지 확인합니다.
 * @param {string} nestId - 확인할 Nest ID
 * @returns {Promise<boolean>} 등록 여부
 */
const isNestIdRegistered = async (nestId) => {
  try {
    const name = nestId.split('.')[0];
    const owner = await nameRegistryContract.methods.getOwner(name).call();
    
    // 소유자가 없는 경우 (0x0 주소)
    if (owner === '0x0000000000000000000000000000000000000000') {
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error(`Nest ID 등록 확인 실패: ${error.message}`);
    throw new Error('Nest ID 등록 여부를 확인하는 중 오류가 발생했습니다.');
  }
};

/**
 * Nest ID를 등록합니다.
 * @param {string} userId - 사용자 ID
 * @param {string} nestId - 등록할 Nest ID
 * @returns {Promise<Object>} 등록 결과
 */
const registerNestId = async (userId, nestId) => {
  try {
    // Nest ID 유효성 검사
    if (!validateNestId(nestId)) {
      throw new Error('유효하지 않은 Nest ID 형식입니다.');
    }
    
    // 이미 등록되어 있는지 확인
    const isRegistered = await isNestIdRegistered(nestId);
    if (isRegistered) {
      throw new Error('이미 등록된 Nest ID입니다.');
    }
    
    // 사용자 및 지갑 정보 조회
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      throw new Error('지갑 정보를 찾을 수 없습니다.');
    }
    
    // 이미 Nest ID가 있는지 확인
    if (user.nestId) {
      throw new Error('이미 Nest ID가 등록되어 있습니다.');
    }
    
    // 플랫폼 지갑 주소 (관리자 지갑)
    const platformWallet = config.blockchain.platformWallet;
    
    // 이름 추출
    const name = nestId.split('.')[0];
    
    // 트랜잭션 데이터 생성
    const txData = nameRegistryContract.methods.register(
      name,
      wallet.address
    ).encodeABI();
    
    // 트랜잭션 서명 (관리자 계정으로)
    const signedTx = await signTransaction(platformWallet, config.blockchain.contracts.nestNameRegistry, txData);
    
    // 트랜잭션 전송
    const receipt = await web3.eth.sendSignedTransaction(signedTx);
    
    // 사용자 정보 업데이트
    user.nestId = nestId;
    await user.save();
    
    // 활동 기록 저장
    await Activity.create({
      userId,
      type: 'NESTID_REGISTERED',
      details: {
        nestId,
        txHash: receipt.transactionHash
      },
      timestamp: new Date()
    });
    
    // XP 보상 (필요 시)
    if (config.features.xpRewards && config.features.xpRewards.nestIdRegistration) {
      const xpService = require('./xpService');
      await xpService.addXP(userId, config.features.xpRewards.nestIdRegistration, 'Nest ID 등록');
    }
    
    logger.info(`Nest ID 등록 완료: 사용자 ${userId}, Nest ID ${nestId}`);
    
    return {
      nestId,
      txHash: receipt.transactionHash
    };
  } catch (error) {
    logger.error(`Nest ID 등록 실패: ${error.message}`);
    throw new Error('Nest ID 등록 중 오류가 발생했습니다.');
  }
};

/**
 * Nest ID로 사용자를 조회합니다.
 * @param {string} nestId - 조회할 Nest ID
 * @returns {Promise<Object>} 사용자 정보
 */
const getUserByNestId = async (nestId) => {
  try {
    // Nest ID로 사용자 조회
    const user = await User.findOne({ nestId });
    if (!user) {
      throw new Error('해당 Nest ID를 가진 사용자를 찾을 수 없습니다.');
    }
    
    return {
      userId: user._id,
      username: user.username,
      nestId: user.nestId,
      avatar: user.avatar,
      level: user.level || 1
    };
  } catch (error) {
    logger.error(`Nest ID로 사용자 조회 실패: ${error.message}`);
    throw new Error('Nest ID로 사용자를 조회하는 중 오류가 발생했습니다.');
  }
};

/**
 * 주소로 Nest ID를 조회합니다.
 * @param {string} address - 조회할 주소
 * @returns {Promise<string>} Nest ID
 */
const getNestIdByAddress = async (address) => {
  try {
    // 주소로 지갑 조회
    const wallet = await Wallet.findOne({ address: address.toLowerCase() });
    if (!wallet) {
      throw new Error('해당 주소를 가진 지갑을 찾을 수 없습니다.');
    }
    
    // 사용자 조회
    const user = await User.findById(wallet.userId);
    if (!user || !user.nestId) {
      throw new Error('Nest ID가 등록되지 않은 사용자입니다.');
    }
    
    return user.nestId;
  } catch (error) {
    logger.error(`주소로 Nest ID 조회 실패: ${error.message}`);
    throw new Error('주소로 Nest ID를 조회하는 중 오류가 발생했습니다.');
  }
};

/**
 * Nest ID로 주소를 조회합니다.
 * @param {string} nestId - 조회할 Nest ID
 * @returns {Promise<string>} 주소
 */
const getAddressByNestId = async (nestId) => {
  try {
    // Nest ID 유효성 검사
    if (!validateNestId(nestId)) {
      throw new Error('유효하지 않은 Nest ID 형식입니다.');
    }
    
    // 이름 추출
    const name = nestId.split('.')[0];
    
    // 컨트랙트에서 주소 조회
    const address = await nameRegistryContract.methods.getAddress(name).call();
    
    // 주소가 없는 경우 (0x0 주소)
    if (address === '0x0000000000000000000000000000000000000000') {
      throw new Error('등록되지 않은 Nest ID입니다.');
    }
    
    return address;
  } catch (error) {
    logger.error(`Nest ID로 주소 조회 실패: ${error.message}`);
    throw new Error('Nest ID로 주소를 조회하는 중 오류가 발생했습니다.');
  }
};

/**
 * Nest ID 소유권을 확인합니다.
 * @param {string} userId - 사용자 ID
 * @param {string} nestId - 확인할 Nest ID
 * @returns {Promise<boolean>} 소유권 여부
 */
const verifyNestIdOwnership = async (userId, nestId) => {
  try {
    // 사용자 정보 조회
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    
    // Nest ID 일치 여부 확인
    if (user.nestId !== nestId) {
      return false;
    }
    
    // 이름 추출
    const name = nestId.split('.')[0];
    
    // 지갑 정보 조회
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      throw new Error('지갑 정보를 찾을 수 없습니다.');
    }
    
    // 컨트랙트에서 소유자 조회
    const owner = await nameRegistryContract.methods.getOwner(name).call();
    
    // 소유자 일치 여부 확인
    return owner.toLowerCase() === wallet.address.toLowerCase();
  } catch (error) {
    logger.error(`Nest ID 소유권 확인 실패: ${error.message}`);
    throw new Error('Nest ID 소유권을 확인하는 중 오류가 발생했습니다.');
  }
};

/**
 * Nest ID를 업데이트합니다. (사용자당 한 번만 가능)
 * @param {string} userId - 사용자 ID
 * @param {string} newNestId - 새로운 Nest ID
 * @returns {Promise<Object>} 업데이트 결과
 */
const updateNestId = async (userId, newNestId) => {
  try {
    // Nest ID 유효성 검사
    if (!validateNestId(newNestId)) {
      throw new Error('유효하지 않은 Nest ID 형식입니다.');
    }
    
    // 이미 등록되어 있는지 확인
    const isRegistered = await isNestIdRegistered(newNestId);
    if (isRegistered) {
      throw new Error('이미 등록된 Nest ID입니다.');
    }
    
    // 사용자 및 지갑 정보 조회
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      throw new Error('지갑 정보를 찾을 수 없습니다.');
    }
    
    // 기존 Nest ID 확인
    if (!user.nestId) {
      throw new Error('기존 Nest ID가 없습니다. 등록을 먼저 해주세요.');
    }
    
    // 이름 변경 권한 확인
    if (!user.canChangeNestId) {
      throw new Error('Nest ID 변경 권한이 없습니다. 관리자에게 문의하세요.');
    }
    
    // 기존 이름 추출
    const oldName = user.nestId.split('.')[0];
    
    // 새 이름 추출
    const newName = newNestId.split('.')[0];
    
    // 플랫폼 지갑 주소 (관리자 지갑)
    const platformWallet = config.blockchain.platformWallet;
    
    // 기존 등록 취소
    const unregisterTxData = nameRegistryContract.methods.unregister(oldName).encodeABI();
    const unregisterSignedTx = await signTransaction(platformWallet, config.blockchain.contracts.nestNameRegistry, unregisterTxData);
    await web3.eth.sendSignedTransaction(unregisterSignedTx);
    
    // 새 이름 등록
    const registerTxData = nameRegistryContract.methods.register(
      newName,
      wallet.address
    ).encodeABI();
    const registerSignedTx = await signTransaction(platformWallet, config.blockchain.contracts.nestNameRegistry, registerTxData);
    const receipt = await web3.eth.sendSignedTransaction(registerSignedTx);
    
    // 사용자 정보 업데이트
    const oldNestId = user.nestId;
    user.nestId = newNestId;
    user.canChangeNestId = false; // 변경 권한 제거
    await user.save();
    
    // 활동 기록 저장
    await Activity.create({
      userId,
      type: 'NESTID_UPDATED',
      details: {
        oldNestId,
        newNestId,
        txHash: receipt.transactionHash
      },
      timestamp: new Date()
    });
    
    logger.info(`Nest ID 업데이트 완료: 사용자 ${userId}, ${oldNestId} → ${newNestId}`);
    
    return {
      oldNestId,
      newNestId,
      txHash: receipt.transactionHash
    };
  } catch (error) {
    logger.error(`Nest ID 업데이트 실패: ${error.message}`);
    throw new Error('Nest ID 업데이트 중 오류가 발생했습니다.');
  }
};

/**
 * Nest ID 목록을 검색합니다.
 * @param {string} query - 검색어
 * @param {Object} options - 검색 옵션 (선택사항)
 * @returns {Promise<Array>} 검색 결과
 */
const searchNestIds = async (query, options = {}) => {
  try {
    const { limit = 10, skip = 0 } = options;
    
    // 검색어가 너무 짧은 경우
    if (query.length < 2) {
      throw new Error('검색어는 2글자 이상이어야 합니다.');
    }
    
    // Nest ID로 사용자 검색
    const users = await User.find(
      { nestId: { $regex: query, $options: 'i' } },
      'username nestId avatar level'
    )
      .limit(limit)
      .skip(skip);
    
    return users.map(user => ({
      userId: user._id,
      username: user.username,
      nestId: user.nestId,
      avatar: user.avatar,
      level: user.level || 1
    }));
  } catch (error) {
    logger.error(`Nest ID 검색 실패: ${error.message}`);
    throw new Error('Nest ID 검색 중 오류가 발생했습니다.');
  }
};

/**
 * Nest ID를 위한 QR 코드 데이터를 생성합니다.
 * @param {string} nestId - Nest ID
 * @returns {Promise<string>} QR 코드 데이터
 */
const generateQRCodeData = async (nestId) => {
  try {
    // Nest ID 유효성 검사
    if (!validateNestId(nestId)) {
      throw new Error('유효하지 않은 Nest ID 형식입니다.');
    }
    
    // 등록 여부 확인
    const isRegistered = await isNestIdRegistered(nestId);
    if (!isRegistered) {
      throw new Error('등록되지 않은 Nest ID입니다.');
    }
    
    // QR 코드 데이터 생성
    // 형식: nest://{nestId}
    const qrData = `nest://${nestId}`;
    
    return qrData;
  } catch (error) {
    logger.error(`QR 코드 데이터 생성 실패: ${error.message}`);
    throw new Error('QR 코드 데이터 생성 중 오류가 발생했습니다.');
  }
};

/**
 * 트랜잭션에 서명합니다.
 * @param {string} fromAddress - 발신자 주소
 * @param {string} toAddress - 수신자 주소 (컨트랙트 주소)
 * @param {string} data - 트랜잭션 데이터
 * @param {string} value - 전송할 이더 양 (선택사항)
 * @returns {Promise<string>} 서명된 트랜잭션
 */
const signTransaction = async (fromAddress, toAddress, data, value = '0x0') => {
  try {
    // 개발 환경에서는 테스트용 비공개 키 사용
    // 실제 환경에서는 보안을 위해 KMS 등 사용 필요
    const privateKey = config.blockchain.privateKeys[fromAddress] || config.blockchain.platformPrivateKey;
    
    // 논스 가져오기
    const nonce = await web3.eth.getTransactionCount(fromAddress);
    
    // 가스 가격 및 한도 추정
    const gasPrice = await web3.eth.getGasPrice();
    const gasLimit = await web3.eth.estimateGas({
      from: fromAddress,
      to: toAddress,
      data,
      value
    });
    
    // 트랜잭션 객체 생성
    const txObject = {
      nonce: web3.utils.toHex(nonce),
      gasPrice: web3.utils.toHex(gasPrice),
      gasLimit: web3.utils.toHex(gasLimit),
      to: toAddress,
      data,
      value,
      chainId: config.blockchain.chainId
    };
    
    // 트랜잭션 서명
    const signedTx = await web3.eth.accounts.signTransaction(txObject, privateKey);
    return signedTx.rawTransaction;
  } catch (error) {
    logger.error(`트랜잭션 서명 실패: ${error.message}`);
    throw new Error('트랜잭션 서명 중 오류가 발생했습니다.');
  }
};

module.exports = {
  validateNestId,
  isNestIdRegistered,
  registerNestId,
  getUserByNestId,
  getNestIdByAddress,
  getAddressByNestId,
  verifyNestIdOwnership,
  updateNestId,
  searchNestIds,
  generateQRCodeData
};
