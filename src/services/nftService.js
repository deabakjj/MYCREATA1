/**
 * nftService.js
 * NFT 관련 비즈니스 로직을 처리하는 서비스
 */

const Web3 = require('web3');
const User = require('../models/user');
const Wallet = require('../models/wallet');
const Activity = require('../models/activity');
const logger = require('../utils/logger');
const config = require('../config');

// ABI 가져오기
const NestNFTABI = require('../../contracts/build/contracts/NestNFT.json').abi;

// Web3 인스턴스 생성
const web3 = new Web3(new Web3.providers.HttpProvider(config.blockchain.rpcURL));

// 컨트랙트 인스턴스 생성
const nftContract = new web3.eth.Contract(
  NestNFTABI,
  config.blockchain.contracts.nestNFT
);

/**
 * 사용자에게 NFT를 발행합니다.
 * @param {string} userId - 사용자 ID
 * @param {string} typeId - NFT 유형 ID
 * @param {Object} metadata - NFT 메타데이터
 * @returns {Promise<string>} 발행된 NFT ID
 */
const mintNFT = async (userId, typeId, metadata) => {
  try {
    // 사용자 및 지갑 정보 조회
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    
    const wallet = await Wallet.findOne({ userId: userId });
    if (!wallet) {
      throw new Error('지갑 정보를 찾을 수 없습니다.');
    }
    
    // 메타데이터 IPFS에 업로드 (실제 구현 시에는 IPFS 업로드 로직 추가 필요)
    const metadataURI = await uploadMetadataToIPFS(metadata);
    
    // 플랫폼 지갑 주소 (관리자 지갑)
    const platformWallet = config.blockchain.platformWallet;
    
    // 트랜잭션 데이터 생성
    const txData = nftContract.methods.mint(
      wallet.address,
      typeId,
      metadataURI
    ).encodeABI();
    
    // 트랜잭션 서명 (관리자 계정으로)
    const signedTx = await signTransaction(platformWallet, config.blockchain.contracts.nestNFT, txData);
    
    // 트랜잭션 전송
    const receipt = await web3.eth.sendSignedTransaction(signedTx);
    
    // NFT ID 가져오기 (이벤트에서 추출)
    const nftId = extractNFTIdFromReceipt(receipt);
    
    // 활동 기록 저장
    await Activity.create({
      userId,
      type: 'NFT_MINT',
      details: {
        nftId,
        typeId,
        txHash: receipt.transactionHash
      },
      timestamp: new Date()
    });
    
    logger.info(`NFT 발행 완료: 사용자 ${userId}, NFT ID ${nftId}`);
    return nftId;
  } catch (error) {
    logger.error(`NFT 발행 실패: ${error.message}`);
    throw new Error('NFT 발행 중 오류가 발생했습니다.');
  }
};

/**
 * 메타데이터를 IPFS에 업로드합니다.
 * @param {Object} metadata - 메타데이터
 * @returns {Promise<string>} IPFS URI
 */
const uploadMetadataToIPFS = async (metadata) => {
  try {
    // 실제 구현 시에는 IPFS 업로드 로직 추가 필요
    // 예시: Pinata, Infura IPFS 등의 서비스 사용
    
    // 개발 환경에서는 가상 URI 반환
    return `ipfs://QmExample/${Date.now()}.json`;
  } catch (error) {
    logger.error(`메타데이터 업로드 실패: ${error.message}`);
    throw new Error('메타데이터 업로드 중 오류가 발생했습니다.');
  }
};

/**
 * 트랜잭션에 서명합니다.
 * @param {string} fromAddress - 발신자 주소
 * @param {string} toAddress - 수신자 주소 (컨트랙트 주소)
 * @param {string} data - 트랜잭션 데이터
 * @returns {Promise<string>} 서명된 트랜잭션
 */
const signTransaction = async (fromAddress, toAddress, data) => {
  try {
    // 개발 환경에서는 테스트용 비공개 키 사용
    // 실제 환경에서는 보안을 위해 KMS 등 사용 필요
    const privateKey = config.blockchain.platformPrivateKey;
    
    // 논스 가져오기
    const nonce = await web3.eth.getTransactionCount(fromAddress);
    
    // 가스 가격 및 한도 추정
    const gasPrice = await web3.eth.getGasPrice();
    const gasLimit = await web3.eth.estimateGas({
      from: fromAddress,
      to: toAddress,
      data
    });
    
    // 트랜잭션 객체 생성
    const txObject = {
      nonce: web3.utils.toHex(nonce),
      gasPrice: web3.utils.toHex(gasPrice),
      gasLimit: web3.utils.toHex(gasLimit),
      to: toAddress,
      data,
      value: '0x0',
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
 * 트랜잭션 영수증에서 NFT ID를 추출합니다.
 * @param {Object} receipt - 트랜잭션 영수증
 * @returns {string} NFT ID
 */
const extractNFTIdFromReceipt = (receipt) => {
  try {
    // 실제 구현 시에는 이벤트에서 NFT ID 추출 로직 필요
    // 예시: Transfer 이벤트에서 tokenId 파라미터 추출
    
    // 개발 환경에서는 가상 NFT ID 반환
    return `${Date.now()}`;
  } catch (error) {
    logger.error(`NFT ID 추출 실패: ${error.message}`);
    throw new Error('NFT ID 추출 중 오류가 발생했습니다.');
  }
};

/**
 * 사용자가 보유한 NFT 목록을 조회합니다.
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Array>} NFT 목록
 */
const getUserNFTs = async (userId) => {
  try {
    // 사용자 및 지갑 정보 조회
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      throw new Error('지갑 정보를 찾을 수 없습니다.');
    }
    
    // 사용자가 보유한 NFT 토큰 ID 목록 조회
    const tokenIds = await nftContract.methods.getTokensByOwner(wallet.address).call();
    
    // 각 토큰 ID에 대한 메타데이터 조회
    const nfts = await Promise.all(tokenIds.map(async (tokenId) => {
      const tokenURI = await nftContract.methods.tokenURI(tokenId).call();
      const metadata = await fetchMetadataFromURI(tokenURI);
      
      return {
        tokenId,
        tokenURI,
        metadata
      };
    }));
    
    return nfts;
  } catch (error) {
    logger.error(`사용자 NFT 목록 조회 실패: ${error.message}`);
    throw new Error('NFT 목록을 불러오는 중 오류가 발생했습니다.');
  }
};

/**
 * URI에서 메타데이터를 가져옵니다.
 * @param {string} uri - 메타데이터 URI
 * @returns {Promise<Object>} 메타데이터
 */
const fetchMetadataFromURI = async (uri) => {
  try {
    // 실제 구현 시에는 IPFS 또는 HTTP에서 메타데이터 가져오기 로직 필요
    
    // 개발 환경에서는 가상 메타데이터 반환
    return {
      name: 'Example NFT',
      description: 'This is an example NFT',
      image: 'ipfs://QmExample/image.png',
      attributes: [
        {
          trait_type: 'Rarity',
          value: 'Common'
        }
      ]
    };
  } catch (error) {
    logger.error(`메타데이터 가져오기 실패: ${error.message}`);
    throw new Error('메타데이터를 가져오는 중 오류가 발생했습니다.');
  }
};

/**
 * NFT를 전송합니다.
 * @param {string} fromUserId - 발신자 사용자 ID
 * @param {string} toUserId - 수신자 사용자 ID
 * @param {string} tokenId - 토큰 ID
 * @returns {Promise<Object>} 트랜잭션 영수증
 */
const transferNFT = async (fromUserId, toUserId, tokenId) => {
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
    
    // NFT 소유권 확인
    const owner = await nftContract.methods.ownerOf(tokenId).call();
    if (owner.toLowerCase() !== fromWallet.address.toLowerCase()) {
      throw new Error('NFT의 소유자가 아닙니다.');
    }
    
    // 트랜잭션 데이터 생성
    const txData = nftContract.methods.transferFrom(
      fromWallet.address,
      toWallet.address,
      tokenId
    ).encodeABI();
    
    // 트랜잭션 서명
    const signedTx = await signTransaction(fromWallet.address, config.blockchain.contracts.nestNFT, txData);
    
    // 트랜잭션 전송
    const receipt = await web3.eth.sendSignedTransaction(signedTx);
    
    // 활동 기록 저장
    await Activity.create({
      userId: fromUserId,
      type: 'NFT_TRANSFER_SENT',
      details: {
        tokenId,
        toUserId,
        txHash: receipt.transactionHash
      },
      timestamp: new Date()
    });
    
    await Activity.create({
      userId: toUserId,
      type: 'NFT_TRANSFER_RECEIVED',
      details: {
        tokenId,
        fromUserId,
        txHash: receipt.transactionHash
      },
      timestamp: new Date()
    });
    
    logger.info(`NFT 전송 완료: 토큰 ID ${tokenId}, 발신자 ${fromUserId}, 수신자 ${toUserId}`);
    return receipt;
  } catch (error) {
    logger.error(`NFT 전송 실패: ${error.message}`);
    throw new Error('NFT 전송 중 오류가 발생했습니다.');
  }
};

module.exports = {
  mintNFT,
  getUserNFTs,
  transferNFT
};
