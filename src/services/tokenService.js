/**
 * tokenService.js
 * 토큰 관련 비즈니스 로직을 처리하는 서비스
 */

const Web3 = require('web3');
const User = require('../models/user');
const Wallet = require('../models/wallet');
const Activity = require('../models/activity');
const logger = require('../utils/logger');
const config = require('../config');

// ABI 가져오기
const NestTokenABI = require('../../contracts/build/contracts/NestToken.json').abi;
const NestSwapABI = require('../../contracts/build/contracts/NestSwap.json').abi;

// Web3 인스턴스 생성
const web3 = new Web3(new Web3.providers.HttpProvider(config.blockchain.rpcURL));

// 컨트랙트 인스턴스 생성
const tokenContract = new web3.eth.Contract(
  NestTokenABI,
  config.blockchain.contracts.nestToken
);

const swapContract = new web3.eth.Contract(
  NestSwapABI,
  config.blockchain.contracts.nestSwap
);

/**
 * 사용자 토큰 잔액을 조회합니다.
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} 토큰 잔액 정보
 */
const getTokenBalance = async (userId) => {
  try {
    // 사용자 및 지갑 정보 조회
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      throw new Error('지갑 정보를 찾을 수 없습니다.');
    }
    
    // NEST 토큰 잔액 조회
    const nestBalance = await tokenContract.methods.balanceOf(wallet.address).call();
    
    // CTA 토큰 잔액 조회 (네이티브 토큰)
    const ctaBalance = await web3.eth.getBalance(wallet.address);
    
    return {
      nest: web3.utils.fromWei(nestBalance, 'ether'),
      cta: web3.utils.fromWei(ctaBalance, 'ether')
    };
  } catch (error) {
    logger.error(`토큰 잔액 조회 실패: ${error.message}`);
    throw new Error('토큰 잔액을 조회하는 중 오류가 발생했습니다.');
  }
};

/**
 * 사용자에게 NEST 토큰을 전송합니다.
 * @param {string} userId - 사용자 ID
 * @param {number} amount - 토큰 양
 * @param {string} reason - 전송 이유
 * @returns {Promise<Object>} 트랜잭션 영수증
 */
const transferTokens = async (userId, amount, reason) => {
  try {
    // 사용자 및 지갑 정보 조회
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      throw new Error('지갑 정보를 찾을 수 없습니다.');
    }
    
    // 플랫폼 지갑 주소 (관리자 지갑)
    const platformWallet = config.blockchain.platformWallet;
    
    // Wei 단위로 변환
    const amountInWei = web3.utils.toWei(amount.toString(), 'ether');
    
    // 트랜잭션 데이터 생성
    const txData = tokenContract.methods.transfer(
      wallet.address,
      amountInWei
    ).encodeABI();
    
    // 트랜잭션 서명 (관리자 계정으로)
    const signedTx = await signTransaction(platformWallet, config.blockchain.contracts.nestToken, txData);
    
    // 트랜잭션 전송
    const receipt = await web3.eth.sendSignedTransaction(signedTx);
    
    // 활동 기록 저장
    await Activity.create({
      userId,
      type: 'TOKEN_RECEIVED',
      details: {
        amount,
        tokenType: 'NEST',
        reason,
        txHash: receipt.transactionHash
      },
      timestamp: new Date()
    });
    
    logger.info(`토큰 전송 완료: 사용자 ${userId}, 양 ${amount} NEST, 이유: ${reason}`);
    return receipt;
  } catch (error) {
    logger.error(`토큰 전송 실패: ${error.message}`);
    throw new Error('토큰 전송 중 오류가 발생했습니다.');
  }
};

/**
 * 사용자 간 NEST 토큰을 전송합니다.
 * @param {string} fromUserId - 발신자 사용자 ID
 * @param {string} toUserId - 수신자 사용자 ID
 * @param {number} amount - 토큰 양
 * @param {string} memo - 메모
 * @returns {Promise<Object>} 트랜잭션 영수증
 */
const transferTokensBetweenUsers = async (fromUserId, toUserId, amount, memo) => {
  try {
    // 발신자 및 수신자 지갑 정보 조회
    const fromWallet = await Wallet.findOne({ userId: fromUserId });
    if (!fromWallet) {
      throw new Error('발신자 지갑 정보를 찾을 수 없습니다.');
    }
    
    const toWallet = await Wallet.findOne({ userId: toUserId });
    if (!toWallet) {
      throw new Error('수신자 지갑 정보를 찾을 수 없습니다.');
    }
    
    // Wei 단위로 변환
    const amountInWei = web3.utils.toWei(amount.toString(), 'ether');
    
    // 잔액 확인
    const balance = await tokenContract.methods.balanceOf(fromWallet.address).call();
    if (BigInt(balance) < BigInt(amountInWei)) {
      throw new Error('잔액이 부족합니다.');
    }
    
    // 화이트리스트 확인 (필요 시)
    if (config.features.useTokenWhitelist) {
      const isWhitelisted = await tokenContract.methods.isWhitelisted(toWallet.address).call();
      if (!isWhitelisted) {
        throw new Error('수신자가 화이트리스트에 등록되어 있지 않습니다.');
      }
    }
    
    // 블랙리스트 확인 (필요 시)
    if (config.features.useTokenBlacklist) {
      const isBlacklisted = await tokenContract.methods.isBlacklisted(fromWallet.address).call() || 
                            await tokenContract.methods.isBlacklisted(toWallet.address).call();
      if (isBlacklisted) {
        throw new Error('블랙리스트에 등록된 계정과 거래할 수 없습니다.');
      }
    }
    
    // 트랜잭션 데이터 생성
    const txData = tokenContract.methods.transfer(
      toWallet.address,
      amountInWei
    ).encodeABI();
    
    // 트랜잭션 서명
    const signedTx = await signTransaction(fromWallet.address, config.blockchain.contracts.nestToken, txData);
    
    // 트랜잭션 전송
    const receipt = await web3.eth.sendSignedTransaction(signedTx);
    
    // 활동 기록 저장 (발신자)
    await Activity.create({
      userId: fromUserId,
      type: 'TOKEN_SENT',
      details: {
        amount,
        tokenType: 'NEST',
        toUserId,
        memo,
        txHash: receipt.transactionHash
      },
      timestamp: new Date()
    });
    
    // 활동 기록 저장 (수신자)
    await Activity.create({
      userId: toUserId,
      type: 'TOKEN_RECEIVED',
      details: {
        amount,
        tokenType: 'NEST',
        fromUserId,
        memo,
        txHash: receipt.transactionHash
      },
      timestamp: new Date()
    });
    
    logger.info(`사용자 간 토큰 전송 완료: 발신자 ${fromUserId}, 수신자 ${toUserId}, 양 ${amount} NEST`);
    return receipt;
  } catch (error) {
    logger.error(`사용자 간 토큰 전송 실패: ${error.message}`);
    throw new Error('토큰 전송 중 오류가 발생했습니다.');
  }
};

/**
 * CTA 토큰을 NEST 토큰으로 교환합니다.
 * @param {string} userId - 사용자 ID
 * @param {number} ctaAmount - CTA 토큰 양
 * @returns {Promise<Object>} 교환 결과
 */
const swapCTAtoNEST = async (userId, ctaAmount) => {
  try {
    // 사용자 및 지갑 정보 조회
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      throw new Error('지갑 정보를 찾을 수 없습니다.');
    }
    
    // Wei 단위로 변환
    const amountInWei = web3.utils.toWei(ctaAmount.toString(), 'ether');
    
    // CTA 잔액 확인
    const ctaBalance = await web3.eth.getBalance(wallet.address);
    if (BigInt(ctaBalance) < BigInt(amountInWei)) {
      throw new Error('CTA 잔액이 부족합니다.');
    }
    
    // 교환 비율 조회
    const exchangeRate = await swapContract.methods.getExchangeRate().call();
    
    // 예상 NEST 양 계산
    const expectedNestAmount = BigInt(amountInWei) * BigInt(exchangeRate) / BigInt(10**18);
    
    // 트랜잭션 데이터 생성
    const txData = swapContract.methods.swapCTAtoNEST().encodeABI();
    
    // 트랜잭션 서명
    const signedTx = await signTransaction(
      wallet.address,
      config.blockchain.contracts.nestSwap,
      txData,
      amountInWei
    );
    
    // 트랜잭션 전송
    const receipt = await web3.eth.sendSignedTransaction(signedTx);
    
    // 교환된 NEST 양 계산 (이벤트에서 추출)
    const nestAmount = extractSwapAmountFromReceipt(receipt);
    
    // 활동 기록 저장
    await Activity.create({
      userId,
      type: 'TOKEN_SWAP',
      details: {
        fromAmount: ctaAmount,
        fromToken: 'CTA',
        toAmount: web3.utils.fromWei(nestAmount.toString(), 'ether'),
        toToken: 'NEST',
        txHash: receipt.transactionHash
      },
      timestamp: new Date()
    });
    
    logger.info(`토큰 교환 완료: 사용자 ${userId}, ${ctaAmount} CTA -> ${web3.utils.fromWei(nestAmount.toString(), 'ether')} NEST`);
    
    return {
      fromAmount: ctaAmount,
      fromToken: 'CTA',
      toAmount: web3.utils.fromWei(nestAmount.toString(), 'ether'),
      toToken: 'NEST',
      txHash: receipt.transactionHash
    };
  } catch (error) {
    logger.error(`토큰 교환 실패: ${error.message}`);
    throw new Error('토큰 교환 중 오류가 발생했습니다.');
  }
};

/**
 * NEST 토큰을 CTA 토큰으로 교환합니다.
 * @param {string} userId - 사용자 ID
 * @param {number} nestAmount - NEST 토큰 양
 * @returns {Promise<Object>} 교환 결과
 */
const swapNESTtoCTA = async (userId, nestAmount) => {
  try {
    // 사용자 및 지갑 정보 조회
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      throw new Error('지갑 정보를 찾을 수 없습니다.');
    }
    
    // Wei 단위로 변환
    const amountInWei = web3.utils.toWei(nestAmount.toString(), 'ether');
    
    // NEST 잔액 확인
    const nestBalance = await tokenContract.methods.balanceOf(wallet.address).call();
    if (BigInt(nestBalance) < BigInt(amountInWei)) {
      throw new Error('NEST 잔액이 부족합니다.');
    }
    
    // 허용량 설정
    const allowanceTxData = tokenContract.methods.approve(
      config.blockchain.contracts.nestSwap,
      amountInWei
    ).encodeABI();
    
    // 허용량 트랜잭션 서명
    const allowanceSignedTx = await signTransaction(wallet.address, config.blockchain.contracts.nestToken, allowanceTxData);
    
    // 허용량 트랜잭션 전송
    await web3.eth.sendSignedTransaction(allowanceSignedTx);
    
    // 교환 비율 조회
    const exchangeRate = await swapContract.methods.getExchangeRate().call();
    
    // 예상 CTA 양 계산
    const expectedCtaAmount = BigInt(amountInWei) / BigInt(exchangeRate) * BigInt(10**18);
    
    // 트랜잭션 데이터 생성
    const txData = swapContract.methods.swapNESTtoCTA(amountInWei).encodeABI();
    
    // 트랜잭션 서명
    const signedTx = await signTransaction(wallet.address, config.blockchain.contracts.nestSwap, txData);
    
    // 트랜잭션 전송
    const receipt = await web3.eth.sendSignedTransaction(signedTx);
    
    // 교환된 CTA 양 계산 (이벤트에서 추출)
    const ctaAmount = extractSwapAmountFromReceipt(receipt);
    
    // 활동 기록 저장
    await Activity.create({
      userId,
      type: 'TOKEN_SWAP',
      details: {
        fromAmount: nestAmount,
        fromToken: 'NEST',
        toAmount: web3.utils.fromWei(ctaAmount.toString(), 'ether'),
        toToken: 'CTA',
        txHash: receipt.transactionHash
      },
      timestamp: new Date()
    });
    
    logger.info(`토큰 교환 완료: 사용자 ${userId}, ${nestAmount} NEST -> ${web3.utils.fromWei(ctaAmount.toString(), 'ether')} CTA`);
    
    return {
      fromAmount: nestAmount,
      fromToken: 'NEST',
      toAmount: web3.utils.fromWei(ctaAmount.toString(), 'ether'),
      toToken: 'CTA',
      txHash: receipt.transactionHash
    };
  } catch (error) {
    logger.error(`토큰 교환 실패: ${error.message}`);
    throw new Error('토큰 교환 중 오류가 발생했습니다.');
  }
};

/**
 * 트랜잭션 영수증에서 교환 금액을 추출합니다.
 * @param {Object} receipt - 트랜잭션 영수증
 * @returns {BigInt} 교환된 금액
 */
const extractSwapAmountFromReceipt = (receipt) => {
  try {
    // 실제 구현 시에는 이벤트에서 교환 금액 추출 로직 필요
    // 예시: SwapCompleted 이벤트에서 amount 파라미터 추출
    
    // 개발 환경에서는 가상 교환 금액 반환
    return BigInt(receipt.logs[0].data) || BigInt('1000000000000000000');
  } catch (error) {
    logger.error(`교환 금액 추출 실패: ${error.message}`);
    throw new Error('교환 금액 추출 중 오류가 발생했습니다.');
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

/**
 * 토큰 전송 한도를 확인합니다.
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} 한도 정보
 */
const getTransferLimits = async (userId) => {
  try {
    // 사용자 및 지갑 정보 조회
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    
    // 일일 한도 설정 (설정에서 가져오거나 기본값 사용)
    const dailyLimit = config.features.tokenTransferLimits?.dailyLimit || '1000';
    
    // 오늘 전송한 총량 조회
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTransfers = await Activity.find({
      userId,
      type: 'TOKEN_SENT',
      timestamp: { $gte: today }
    });
    
    // 오늘 전송한 총량 계산
    let totalSent = 0;
    todayTransfers.forEach(transfer => {
      totalSent += Number(transfer.details.amount);
    });
    
    return {
      dailyLimit: Number(dailyLimit),
      totalSent,
      remaining: Math.max(0, Number(dailyLimit) - totalSent)
    };
  } catch (error) {
    logger.error(`토큰 전송 한도 조회 실패: ${error.message}`);
    throw new Error('토큰 전송 한도를 조회하는 중 오류가 발생했습니다.');
  }
};

/**
 * 토큰 거래 내역을 조회합니다.
 * @param {string} userId - 사용자 ID
 * @param {Object} options - 정렬, 페이징 등 옵션 (선택사항)
 * @returns {Promise<Array>} 거래 내역
 */
const getTransactionHistory = async (userId, options = {}) => {
  try {
    const { sort = { timestamp: -1 }, limit = 10, skip = 0 } = options;
    
    // 토큰 관련 활동 조회
    const tokenActivities = await Activity.find({
      userId,
      type: { $in: ['TOKEN_SENT', 'TOKEN_RECEIVED', 'TOKEN_SWAP'] }
    })
      .sort(sort)
      .limit(limit)
      .skip(skip);
    
    // 활동 데이터 가공
    const transactions = tokenActivities.map(activity => {
      const { type, details, timestamp } = activity;
      
      let transactionType, amount, token, direction, otherParty, memo;
      
      switch (type) {
        case 'TOKEN_SENT':
          transactionType = 'transfer';
          amount = details.amount;
          token = details.tokenType;
          direction = 'out';
          otherParty = details.toUserId;
          memo = details.memo;
          break;
        case 'TOKEN_RECEIVED':
          transactionType = 'transfer';
          amount = details.amount;
          token = details.tokenType;
          direction = 'in';
          otherParty = details.fromUserId || 'system';
          memo = details.memo || details.reason;
          break;
        case 'TOKEN_SWAP':
          transactionType = 'swap';
          amount = `${details.fromAmount} ${details.fromToken} → ${details.toAmount} ${details.toToken}`;
          token = `${details.fromToken}/${details.toToken}`;
          direction = null;
          otherParty = null;
          memo = '토큰 교환';
          break;
      }
      
      return {
        id: activity._id,
        transactionType,
        amount,
        token,
        direction,
        otherParty,
        memo,
        timestamp,
        txHash: details.txHash
      };
    });
    
    return transactions;
  } catch (error) {
    logger.error(`토큰 거래 내역 조회 실패: ${error.message}`);
    throw new Error('토큰 거래 내역을 조회하는 중 오류가 발생했습니다.');
  }
};

/**
 * 화이트리스트에 주소를 추가합니다. (관리자 전용)
 * @param {string} address - 추가할 주소
 * @returns {Promise<Object>} 트랜잭션 영수증
 */
const addToWhitelist = async (address) => {
  try {
    // 플랫폼 지갑 주소 (관리자 지갑)
    const platformWallet = config.blockchain.platformWallet;
    
    // 트랜잭션 데이터 생성
    const txData = tokenContract.methods.addToWhitelist(address).encodeABI();
    
    // 트랜잭션 서명 (관리자 계정으로)
    const signedTx = await signTransaction(platformWallet, config.blockchain.contracts.nestToken, txData);
    
    // 트랜잭션 전송
    const receipt = await web3.eth.sendSignedTransaction(signedTx);
    
    logger.info(`화이트리스트에 주소 추가 완료: ${address}`);
    return receipt;
  } catch (error) {
    logger.error(`화이트리스트 추가 실패: ${error.message}`);
    throw new Error('화이트리스트에 주소를 추가하는 중 오류가 발생했습니다.');
  }
};

/**
 * 블랙리스트에 주소를 추가합니다. (관리자 전용)
 * @param {string} address - 추가할 주소
 * @returns {Promise<Object>} 트랜잭션 영수증
 */
const addToBlacklist = async (address) => {
  try {
    // 플랫폼 지갑 주소 (관리자 지갑)
    const platformWallet = config.blockchain.platformWallet;
    
    // 트랜잭션 데이터 생성
    const txData = tokenContract.methods.addToBlacklist(address).encodeABI();
    
    // 트랜잭션 서명 (관리자 계정으로)
    const signedTx = await signTransaction(platformWallet, config.blockchain.contracts.nestToken, txData);
    
    // 트랜잭션 전송
    const receipt = await web3.eth.sendSignedTransaction(signedTx);
    
    logger.info(`블랙리스트에 주소 추가 완료: ${address}`);
    return receipt;
  } catch (error) {
    logger.error(`블랙리스트 추가 실패: ${error.message}`);
    throw new Error('블랙리스트에 주소를 추가하는 중 오류가 발생했습니다.');
  }
};

module.exports = {
  getTokenBalance,
  transferTokens,
  transferTokensBetweenUsers,
  swapCTAtoNEST,
  swapNESTtoCTA,
  getTransferLimits,
  getTransactionHistory,
  addToWhitelist,
  addToBlacklist
};
