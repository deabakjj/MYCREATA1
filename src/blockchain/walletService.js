/**
 * @file 지갑 서비스
 * @description 블록체인 지갑 관련 기능을 제공하는 서비스
 */

const Web3 = require('web3');
const ethers = require('ethers');
const config = require('../config');
const logger = require('../utils/logger');

// CreataChain RPC URL (환경에 따라 다름)
const RPC_URL = config.env === 'production' 
  ? config.blockchain.mainnet.rpc
  : config.blockchain.testnet.rpc;

// Web3 인스턴스 생성
const web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL));

/**
 * 새 이더리움 지갑 생성
 * 
 * @returns {Promise<Object>} 생성된 지갑 정보 (주소 및 개인키)
 */
const generateEthereumWallet = async () => {
  try {
    // 새 계정 생성
    const account = web3.eth.accounts.create();
    
    return {
      address: account.address,
      privateKey: account.privateKey,
    };
  } catch (error) {
    logger.error(`이더리움 지갑 생성 실패: ${error.message}`);
    throw new Error('지갑 생성 중 오류가 발생했습니다.');
  }
};

/**
 * 계정 추상화를 통한 지갑 생성 (ERC-4337 기반)
 * 
 * @param {string} email - 사용자 이메일 (소셜 ID)
 * @returns {Promise<Object>} 생성된 AA 지갑 정보
 */
const generateAAWallet = async (email) => {
  try {
    // 실제 구현에서는 Biconomy, ZeroDev, Etherspot 등의 AA SDK 활용
    // 여기서는 간단한 데모로 유사 로직만 구현
    
    // 이메일을 시드로 사용하여 일관된 지갑 주소 생성
    const seedHash = web3.utils.keccak256(email);
    const wallet = ethers.Wallet.fromMnemonic(
      ethers.utils.entropyToMnemonic(seedHash.slice(2, 34))
    );
    
    // AA 지갑은 실제로는 더 복잡한 배포 과정 필요
    // 여기서는 개념적 구현만 포함
    
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      type: 'aa',
    };
  } catch (error) {
    logger.error(`AA 지갑 생성 실패: ${error.message}`);
    throw new Error('AA 지갑 생성 중 오류가 발생했습니다.');
  }
};

/**
 * 토큰 잔액 조회
 * 
 * @param {string} address - 지갑 주소
 * @param {string} tokenAddress - 토큰 컨트랙트 주소 (null이면 기본 CTA)
 * @returns {Promise<string>} 토큰 잔액
 */
const getTokenBalance = async (address, tokenAddress = null) => {
  try {
    // 기본 코인(CTA) 잔액 조회
    if (!tokenAddress) {
      const balance = await web3.eth.getBalance(address);
      return web3.utils.fromWei(balance, 'ether');
    }
    
    // ERC20 토큰 잔액 조회
    const minABI = [
      {
        constant: true,
        inputs: [{ name: '_owner', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: 'balance', type: 'uint256' }],
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'decimals',
        outputs: [{ name: '', type: 'uint8' }],
        type: 'function',
      },
    ];
    
    const contract = new web3.eth.Contract(minABI, tokenAddress);
    const decimals = await contract.methods.decimals().call();
    const balance = await contract.methods.balanceOf(address).call();
    
    return balance / Math.pow(10, decimals);
  } catch (error) {
    logger.error(`토큰 잔액 조회 실패: ${error.message}`);
    throw new Error('토큰 잔액 조회 중 오류가 발생했습니다.');
  }
};

/**
 * ERC20 토큰 전송
 * 
 * @param {string} privateKey - 발신자 개인키
 * @param {string} to - 수신자 주소
 * @param {string} tokenAddress - 토큰 컨트랙트 주소
 * @param {number} amount - 전송량
 * @returns {Promise<Object>} 트랜잭션 결과
 */
const transferERC20Token = async (privateKey, to, tokenAddress, amount) => {
  try {
    // 계정 생성
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;
    
    // 토큰 컨트랙트 인스턴스 생성
    const minABI = [
      {
        constant: false,
        inputs: [
          { name: '_to', type: 'address' },
          { name: '_value', type: 'uint256' },
        ],
        name: 'transfer',
        outputs: [{ name: '', type: 'bool' }],
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'decimals',
        outputs: [{ name: '', type: 'uint8' }],
        type: 'function',
      },
    ];
    
    const contract = new web3.eth.Contract(minABI, tokenAddress);
    
    // 토큰 소수점 확인
    const decimals = await contract.methods.decimals().call();
    
    // 전송량에 소수점 적용
    const tokenAmount = amount * Math.pow(10, decimals);
    
    // 전송 트랜잭션 생성
    const tx = {
      from: account.address,
      to: tokenAddress,
      gas: 100000,
      data: contract.methods.transfer(to, tokenAmount).encodeABI(),
    };
    
    // 트랜잭션 전송
    const receipt = await web3.eth.sendTransaction(tx);
    
    // 지갑에서 계정 제거 (보안)
    web3.eth.accounts.wallet.remove(account.address);
    
    return {
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    logger.error(`토큰 전송 실패: ${error.message}`);
    throw new Error('토큰 전송 중 오류가 발생했습니다.');
  }
};

/**
 * NFT 민팅
 * 
 * @param {string} privateKey - 발신자 개인키
 * @param {string} to - 수신자 주소
 * @param {string} nftAddress - NFT 컨트랙트 주소
 * @param {number} tokenTypeId - 토큰 유형 ID
 * @param {string} tokenURI - 토큰 메타데이터 URI
 * @returns {Promise<Object>} 트랜잭션 결과
 */
const mintNFT = async (privateKey, to, nftAddress, tokenTypeId, tokenURI) => {
  try {
    // 계정 생성
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;
    
    // NFT 컨트랙트 ABI (실제 NestNFT 컨트랙트에 맞게 수정 필요)
    const nftABI = [
      {
        inputs: [
          { name: 'to', type: 'address' },
          { name: 'typeId', type: 'uint256' },
          { name: 'uri', type: 'string' },
        ],
        name: 'safeMint',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ];
    
    // 컨트랙트 인스턴스 생성
    const contract = new web3.eth.Contract(nftABI, nftAddress);
    
    // 민팅 트랜잭션 생성
    const tx = {
      from: account.address,
      to: nftAddress,
      gas: 500000,
      data: contract.methods.safeMint(to, tokenTypeId, tokenURI).encodeABI(),
    };
    
    // 트랜잭션 전송
    const receipt = await web3.eth.sendTransaction(tx);
    
    // 이벤트에서 토큰 ID 추출
    const tokenId = receipt.logs[0].topics[3];
    
    // 지갑에서 계정 제거 (보안)
    web3.eth.accounts.wallet.remove(account.address);
    
    return {
      success: true,
      txHash: receipt.transactionHash,
      tokenId,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    logger.error(`NFT 민팅 실패: ${error.message}`);
    throw new Error('NFT 민팅 중 오류가 발생했습니다.');
  }
};

/**
 * Nest ID 등록
 * 
 * @param {string} privateKey - 발신자 개인키
 * @param {string} name - 등록할 이름 (예: 'example', .nest는 자동으로 붙음)
 * @returns {Promise<Object>} 트랜잭션 결과
 */
const registerNestId = async (privateKey, name) => {
  try {
    // 계정 생성
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;
    
    // Nest 레지스트리 컨트랙트 주소
    const registryAddress = config.env === 'production'
      ? config.blockchain.mainnet.contracts.nestNameRegistry
      : config.blockchain.testnet.contracts.nestNameRegistry;
    
    // Nest 레지스트리 ABI
    const registryABI = [
      {
        inputs: [{ name: 'name', type: 'string' }],
        name: 'registerSelf',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ];
    
    // 컨트랙트 인스턴스 생성
    const contract = new web3.eth.Contract(registryABI, registryAddress);
    
    // 등록 트랜잭션 생성
    const tx = {
      from: account.address,
      to: registryAddress,
      gas: 300000,
      data: contract.methods.registerSelf(name).encodeABI(),
    };
    
    // 트랜잭션 전송
    const receipt = await web3.eth.sendTransaction(tx);
    
    // 지갑에서 계정 제거 (보안)
    web3.eth.accounts.wallet.remove(account.address);
    
    return {
      success: true,
      txHash: receipt.transactionHash,
      nestId: `${name}.nest`,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    logger.error(`Nest ID 등록 실패: ${error.message}`);
    throw new Error('Nest ID 등록 중 오류가 발생했습니다.');
  }
};

/**
 * Nest ID 조회
 * 
 * @param {string} address - 지갑 주소
 * @returns {Promise<string>} Nest ID
 */
const getNestId = async (address) => {
  try {
    // Nest 레지스트리 컨트랙트 주소
    const registryAddress = config.env === 'production'
      ? config.blockchain.mainnet.contracts.nestNameRegistry
      : config.blockchain.testnet.contracts.nestNameRegistry;
    
    // Nest 레지스트리 ABI
    const registryABI = [
      {
        inputs: [{ name: 'addr', type: 'address' }],
        name: 'getName',
        outputs: [{ name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
      },
    ];
    
    // 컨트랙트 인스턴스 생성
    const contract = new web3.eth.Contract(registryABI, registryAddress);
    
    // Nest ID 조회
    const name = await contract.methods.getName(address).call();
    
    if (!name) {
      return null;
    }
    
    return `${name}.nest`;
  } catch (error) {
    logger.error(`Nest ID 조회 실패: ${error.message}`);
    throw new Error('Nest ID 조회 중 오류가 발생했습니다.');
  }
};

/**
 * 토큰 스왑 (CTA <-> NEST)
 * 
 * @param {string} privateKey - 발신자 개인키
 * @param {string} fromToken - 전환할 토큰 ('CTA' 또는 'NEST')
 * @param {number} amount - 전환할 양
 * @returns {Promise<Object>} 트랜잭션 결과
 */
const swapTokens = async (privateKey, fromToken, amount) => {
  try {
    // 계정 생성
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;
    
    // Nest 스왑 컨트랙트 주소
    const swapAddress = config.env === 'production'
      ? config.blockchain.mainnet.contracts.nestSwap
      : config.blockchain.testnet.contracts.nestSwap;
    
    // 토큰 주소
    const nestTokenAddress = config.env === 'production'
      ? config.blockchain.mainnet.contracts.nestToken
      : config.blockchain.testnet.contracts.nestToken;
    
    // ERC20 ABI
    const erc20ABI = [
      {
        inputs: [
          { name: 'spender', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ],
        name: 'approve',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'decimals',
        outputs: [{ name: '', type: 'uint8' }],
        type: 'function',
      },
    ];
    
    // Nest 스왑 ABI
    const swapABI = [
      {
        inputs: [{ name: 'ctaAmount', type: 'uint256' }],
        name: 'swapCtaToNest',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [{ name: 'nestAmount', type: 'uint256' }],
        name: 'swapNestToCta',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ];
    
    // 트랜잭션 실행
    let receipt;
    
    if (fromToken === 'CTA') {
      // CTA -> NEST 전환
      // CTA는 네이티브 토큰이므로 직접 전송
      const swapContract = new web3.eth.Contract(swapABI, swapAddress);
      
      const tx = {
        from: account.address,
        to: swapAddress,
        gas: 200000,
        value: web3.utils.toWei(amount.toString(), 'ether'),
        data: swapContract.methods.swapCtaToNest(web3.utils.toWei(amount.toString(), 'ether')).encodeABI(),
      };
      
      receipt = await web3.eth.sendTransaction(tx);
    } else if (fromToken === 'NEST') {
      // NEST -> CTA 전환
      // 먼저 NEST 토큰 사용 승인
      const nestContract = new web3.eth.Contract(erc20ABI, nestTokenAddress);
      const decimals = await nestContract.methods.decimals().call();
      const tokenAmount = amount * Math.pow(10, decimals);
      
      const approveTx = {
        from: account.address,
        to: nestTokenAddress,
        gas: 100000,
        data: nestContract.methods.approve(swapAddress, tokenAmount).encodeABI(),
      };
      
      await web3.eth.sendTransaction(approveTx);
      
      // 이후 스왑 실행
      const swapContract = new web3.eth.Contract(swapABI, swapAddress);
      
      const swapTx = {
        from: account.address,
        to: swapAddress,
        gas: 200000,
        data: swapContract.methods.swapNestToCta(tokenAmount).encodeABI(),
      };
      
      receipt = await web3.eth.sendTransaction(swapTx);
    } else {
      throw new Error('지원하지 않는 토큰 유형입니다.');
    }
    
    // 지갑에서 계정 제거 (보안)
    web3.eth.accounts.wallet.remove(account.address);
    
    return {
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      fromToken,
      toToken: fromToken === 'CTA' ? 'NEST' : 'CTA',
      fromAmount: amount,
      // 실제로는 이벤트에서 받은 금액을 추출해야 함
    };
  } catch (error) {
    logger.error(`토큰 스왑 실패: ${error.message}`);
    throw new Error('토큰 스왑 중 오류가 발생했습니다.');
  }
};

module.exports = {
  generateEthereumWallet,
  generateAAWallet,
  getTokenBalance,
  transferERC20Token,
  mintNFT,
  registerNestId,
  getNestId,
  swapTokens,
};
