/**
 * relayTransactionService.js
 * 
 * 외부 DApp과의 트랜잭션 릴레이 서비스
 * Nest 사용자의 트랜잭션을 외부 DApp으로 중계하고 관리하는 기능 제공
 */

const crypto = require('crypto');
const WalletService = require('../../blockchain/walletService');
const NestIdService = require('../nestIdService');
const logger = require('../../utils/logger');
const keyManager = require('../../utils/keyManager');

/**
 * 릴레이 트랜잭션 관리 서비스
 */
class RelayTransactionService {
  constructor() {
    this.walletService = new WalletService();
    this.nestIdService = new NestIdService();
  }

  /**
   * 트랜잭션 요청을 릴레이하여 처리
   * @param {Object} relayRequest - 릴레이 요청 정보
   * @param {string} relayRequest.nestId - 사용자 Nest ID
   * @param {string} relayRequest.method - 호출 메서드 (eth_sendTransaction, eth_signTransaction 등)
   * @param {Object} relayRequest.params - 트랜잭션 파라미터
   * @param {string} relayRequest.dappApiKey - DApp API 키
   * @returns {Promise<Object>} 처리된 트랜잭션 결과
   */
  async relayTransaction(relayRequest) {
    try {
      logger.info(`트랜잭션 릴레이 요청 시작: ${relayRequest.nestId}, 메서드: ${relayRequest.method}`);
      
      // Nest ID에서 사용자 정보 조회
      const userId = await this.nestIdService.getUserIdByNestId(relayRequest.nestId);
      
      if (!userId) {
        logger.error(`존재하지 않는 Nest ID: ${relayRequest.nestId}`);
        throw new Error('유효하지 않은 Nest ID입니다');
      }
      
      // 사용자의 지갑 정보 가져오기
      const userWallet = await this.walletService.getUserWallet(userId);
      
      if (!userWallet) {
        logger.error(`사용자 지갑을 찾을 수 없음: ${userId}`);
        throw new Error('사용자 지갑을 찾을 수 없습니다');
      }
      
      // 트랜잭션 메서드에 따른 처리
      switch (relayRequest.method) {
        case 'eth_sendTransaction':
          return await this._handleSendTransaction(userWallet, relayRequest.params);
          
        case 'eth_signTransaction':
          return await this._handleSignTransaction(userWallet, relayRequest.params);
          
        case 'eth_sign':
          return await this._handleSign(userWallet, relayRequest.params);
          
        case 'personal_sign':
          return await this._handlePersonalSign(userWallet, relayRequest.params);
          
        case 'eth_signTypedData_v4':
          return await this._handleSignTypedData(userWallet, relayRequest.params);
          
        default:
          logger.error(`지원하지 않는 메서드: ${relayRequest.method}`);
          throw new Error('지원하지 않는 메서드입니다');
      }
    } catch (error) {
      logger.error(`트랜잭션 릴레이 실패: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * 트랜잭션 상태 조회
   * @param {string} txId - 트랜잭션 ID
   * @returns {Promise<Object>} 트랜잭션 상태 정보
   */
  async getTransactionStatus(txId) {
    try {
      // 트랜잭션 ID로 상태 조회 구현
      // 실제 구현에서는 데이터베이스 또는 블록체인에서 상태 조회
      
      // 예시 응답
      return {
        txId,
        status: 'confirmed', // pending, confirmed, failed
        blockNumber: 12345678,
        blockHash: '0x...',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`트랜잭션 상태 조회 실패: ${error.message}`);
      throw new Error('트랜잭션 상태 조회 중 오류가 발생했습니다');
    }
  }
  
  /**
   * 사용자의 트랜잭션 기록 조회
   * @param {string} nestId - 사용자 Nest ID
   * @param {Object} options - 조회 옵션 (페이지네이션 등)
   * @returns {Promise<Array<Object>>} 트랜잭션 기록 목록
   */
  async getUserTransactions(nestId, options) {
    try {
      // Nest ID에서 사용자 정보 조회
      const userId = await this.nestIdService.getUserIdByNestId(nestId);
      
      if (!userId) {
        logger.error(`존재하지 않는 Nest ID: ${nestId}`);
        throw new Error('유효하지 않은 Nest ID입니다');
      }
      
      // 페이지네이션 옵션 처리
      const page = options.page || 1;
      const limit = options.limit || 10;
      
      // 예시 응답 (실제로는 데이터베이스에서 조회)
      return [
        {
          txId: '0x123...',
          method: 'eth_sendTransaction',
          status: 'confirmed',
          timestamp: new Date().toISOString(),
          dapp: 'Example DApp'
        },
        // 추가 트랜잭션 기록...
      ];
    } catch (error) {
      logger.error(`사용자 트랜잭션 기록 조회 실패: ${error.message}`);
      throw new Error('트랜잭션 기록 조회 중 오류가 발생했습니다');
    }
  }
  
  /**
   * eth_sendTransaction 메서드 처리
   * @private
   * @param {Object} wallet - 사용자 지갑 정보
   * @param {Object} params - 트랜잭션 파라미터
   * @returns {Promise<Object>} 트랜잭션 결과
   */
  async _handleSendTransaction(wallet, params) {
    try {
      // 지갑 서비스를 통해 트랜잭션 전송
      const privateKey = await keyManager.decryptPrivateKey(wallet.encryptedPrivateKey);
      
      // 트랜잭션 파라미터 준비
      const tx = this._prepareTransaction(params);
      
      // 트랜잭션 서명 및 전송
      const signedTx = await this.walletService.signTransaction(privateKey, tx);
      const txHash = await this.walletService.sendSignedTransaction(signedTx);
      
      // 트랜잭션 결과 저장 및 반환
      return {
        success: true,
        txHash,
        status: 'pending'
      };
    } catch (error) {
      logger.error(`sendTransaction 처리 실패: ${error.message}`);
      throw new Error('트랜잭션 전송 중 오류가 발생했습니다');
    }
  }
  
  /**
   * eth_signTransaction 메서드 처리
   * @private
   * @param {Object} wallet - 사용자 지갑 정보
   * @param {Object} params - 트랜잭션 파라미터
   * @returns {Promise<Object>} 서명된 트랜잭션
   */
  async _handleSignTransaction(wallet, params) {
    try {
      // 지갑 서비스를 통해 트랜잭션 서명
      const privateKey = await keyManager.decryptPrivateKey(wallet.encryptedPrivateKey);
      
      // 트랜잭션 파라미터 준비
      const tx = this._prepareTransaction(params);
      
      // 트랜잭션 서명
      const signedTx = await this.walletService.signTransaction(privateKey, tx);
      
      return {
        success: true,
        signedTransaction: signedTx
      };
    } catch (error) {
      logger.error(`signTransaction 처리 실패: ${error.message}`);
      throw new Error('트랜잭션 서명 중 오류가 발생했습니다');
    }
  }
  
  /**
   * eth_sign 메서드 처리
   * @private
   * @param {Object} wallet - 사용자 지갑 정보
   * @param {Object} params - 서명 파라미터
   * @returns {Promise<Object>} 서명 결과
   */
  async _handleSign(wallet, params) {
    try {
      // 지갑 서비스를 통해 메시지 서명
      const privateKey = await keyManager.decryptPrivateKey(wallet.encryptedPrivateKey);
      
      // 메시지 준비
      const message = params[1]; // params[0]은 주소, params[1]은 메시지
      
      // 메시지 서명
      const signature = await this.walletService.signMessage(privateKey, message);
      
      return {
        success: true,
        signature
      };
    } catch (error) {
      logger.error(`sign 처리 실패: ${error.message}`);
      throw new Error('메시지 서명 중 오류가 발생했습니다');
    }
  }
  
  /**
   * personal_sign 메서드 처리
   * @private
   * @param {Object} wallet - 사용자 지갑 정보
   * @param {Object} params - 서명 파라미터
   * @returns {Promise<Object>} 서명 결과
   */
  async _handlePersonalSign(wallet, params) {
    try {
      // 지갑 서비스를 통해 개인 메시지 서명
      const privateKey = await keyManager.decryptPrivateKey(wallet.encryptedPrivateKey);
      
      // 메시지 준비 (personal_sign에서는 params[0]이 메시지, params[1]이 주소)
      const message = params[0];
      
      // 개인 메시지 서명
      const signature = await this.walletService.signPersonalMessage(privateKey, message);
      
      return {
        success: true,
        signature
      };
    } catch (error) {
      logger.error(`personalSign 처리 실패: ${error.message}`);
      throw new Error('개인 메시지 서명 중 오류가 발생했습니다');
    }
  }
  
  /**
   * eth_signTypedData_v4 메서드 처리
   * @private
   * @param {Object} wallet - 사용자 지갑 정보
   * @param {Object} params - 서명 파라미터
   * @returns {Promise<Object>} 서명 결과
   */
  async _handleSignTypedData(wallet, params) {
    try {
      // 지갑 서비스를 통해 타입 데이터 서명
      const privateKey = await keyManager.decryptPrivateKey(wallet.encryptedPrivateKey);
      
      // 타입 데이터 준비 (params[0]은 주소, params[1]은 타입 데이터)
      const typedData = JSON.parse(params[1]);
      
      // 타입 데이터 서명
      const signature = await this.walletService.signTypedData(privateKey, typedData);
      
      return {
        success: true,
        signature
      };
    } catch (error) {
      logger.error(`signTypedData 처리 실패: ${error.message}`);
      throw new Error('타입 데이터 서명 중 오류가 발생했습니다');
    }
  }
  
  /**
   * 트랜잭션 파라미터 준비
   * @private
   * @param {Object} params - 원본 트랜잭션 파라미터
   * @returns {Object} 준비된 트랜잭션 객체
   */
  _prepareTransaction(params) {
    // 트랜잭션 파라미터 유효성 검사 및 기본값 설정
    const tx = { ...params[0] }; // 첫 번째 파라미터가 트랜잭션 객체
    
    // 필수 필드 확인
    if (!tx.to) {
      throw new Error('수신자 주소가 지정되지 않았습니다');
    }
    
    // gas 기본값 설정
    if (!tx.gas && !tx.gasLimit) {
      tx.gas = '0x55730'; // 약 350,000 gas
    }
    
    // gasPrice 기본값 설정 (또는 EIP-1559 활용)
    if (!tx.gasPrice && !tx.maxFeePerGas) {
      // 실제 구현에서는 현재 네트워크 상황에 따라 동적으로 설정
      tx.gasPrice = '0x3b9aca00'; // 1 Gwei
    }
    
    return tx;
  }
}

module.exports = RelayTransactionService;
