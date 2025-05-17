/**
 * integrationService.js
 * 
 * 외부 DApp과의 통합을 관리하는 서비스
 * Nest 플랫폼의 모듈들을 외부 서비스와 연동하는 기능 제공
 */

const Integration = require('../models/integration');
const WalletService = require('../blockchain/walletService');
const NestIdService = require('./nestIdService');
const logger = require('../utils/logger');
const responseHandler = require('../utils/responseHandler');

/**
 * 외부 DApp 등록 서비스
 */
class IntegrationService {
  /**
   * 새 DApp 통합 등록
   * @param {Object} dappInfo - DApp 정보
   * @param {string} dappInfo.name - DApp 이름
   * @param {string} dappInfo.description - DApp 설명
   * @param {string} dappInfo.callbackUrl - 콜백 URL
   * @param {string} dappInfo.owner - 소유자 ID
   * @param {Array<string>} dappInfo.permissions - 요청 권한 목록
   * @returns {Promise<Object>} 생성된 통합 정보
   */
  async registerDApp(dappInfo) {
    try {
      // API 키 생성
      const apiKey = this._generateApiKey();
      
      // 비밀 키 생성
      const secretKey = this._generateSecretKey();
      
      // 통합 정보 생성
      const integration = new Integration({
        name: dappInfo.name,
        description: dappInfo.description,
        callbackUrl: dappInfo.callbackUrl,
        owner: dappInfo.owner,
        apiKey,
        secretKey,
        permissions: dappInfo.permissions || [],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // 저장 및 반환
      await integration.save();
      
      // 비밀 키는 최초 한 번만 반환, DB에는 해시값으로 저장
      return {
        _id: integration._id,
        name: integration.name,
        apiKey: integration.apiKey,
        secretKey, // 생성 시에만 평문으로 반환
        permissions: integration.permissions,
        status: integration.status
      };
    } catch (error) {
      logger.error(`DApp 등록 실패: ${error.message}`);
      throw new Error('DApp 등록 중 오류가 발생했습니다');
    }
  }
  
  /**
   * 등록된 DApp 정보 조회
   * @param {string} apiKey - API 키
   * @returns {Promise<Object>} 통합 정보
   */
  async getDAppInfo(apiKey) {
    try {
      const integration = await Integration.findOne({ apiKey, status: 'active' });
      
      if (!integration) {
        throw new Error('통합 정보를 찾을 수 없습니다');
      }
      
      return {
        _id: integration._id,
        name: integration.name,
        description: integration.description,
        callbackUrl: integration.callbackUrl,
        permissions: integration.permissions,
        status: integration.status,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt
      };
    } catch (error) {
      logger.error(`DApp 정보 조회 실패: ${error.message}`);
      throw new Error('DApp 정보 조회 중 오류가 발생했습니다');
    }
  }
  
  /**
   * 통합 상태 업데이트
   * @param {string} apiKey - API 키
   * @param {string} status - 새 상태 ('active', 'inactive', 'suspended')
   * @returns {Promise<Object>} 업데이트된 통합 정보
   */
  async updateDAppStatus(apiKey, status) {
    try {
      const validStatuses = ['active', 'inactive', 'suspended'];
      
      if (!validStatuses.includes(status)) {
        throw new Error('유효하지 않은 상태값입니다');
      }
      
      const integration = await Integration.findOneAndUpdate(
        { apiKey },
        { status, updatedAt: new Date() },
        { new: true }
      );
      
      if (!integration) {
        throw new Error('통합 정보를 찾을 수 없습니다');
      }
      
      return {
        _id: integration._id,
        name: integration.name,
        status: integration.status,
        updatedAt: integration.updatedAt
      };
    } catch (error) {
      logger.error(`DApp 상태 업데이트 실패: ${error.message}`);
      throw new Error('DApp 상태 업데이트 중 오류가 발생했습니다');
    }
  }
  
  /**
   * 통합에 대한 권한 업데이트
   * @param {string} apiKey - API 키
   * @param {Array<string>} permissions - 새 권한 목록
   * @returns {Promise<Object>} 업데이트된 통합 정보
   */
  async updateDAppPermissions(apiKey, permissions) {
    try {
      const integration = await Integration.findOneAndUpdate(
        { apiKey },
        { permissions, updatedAt: new Date() },
        { new: true }
      );
      
      if (!integration) {
        throw new Error('통합 정보를 찾을 수 없습니다');
      }
      
      return {
        _id: integration._id,
        name: integration.name,
        permissions: integration.permissions,
        updatedAt: integration.updatedAt
      };
    } catch (error) {
      logger.error(`DApp 권한 업데이트 실패: ${error.message}`);
      throw new Error('DApp 권한 업데이트 중 오류가 발생했습니다');
    }
  }
  
  /**
   * 외부 DApp과 사용자 지갑 연동
   * @param {string} apiKey - API 키
   * @param {string} userId - 사용자 ID
   * @param {Array<string>} permissions - 부여된 권한 목록
   * @returns {Promise<Object>} 연동 정보
   */
  async connectUserToDApp(apiKey, userId, permissions) {
    try {
      // 통합 정보 확인
      const integration = await Integration.findOne({ apiKey, status: 'active' });
      
      if (!integration) {
        throw new Error('유효하지 않은 API 키입니다');
      }
      
      // 요청된 권한이 통합에 허용된 권한인지 확인
      const validPermissions = permissions.filter(
        permission => integration.permissions.includes(permission)
      );
      
      // 사용자의 지갑 정보 가져오기
      const walletService = new WalletService();
      const userWallet = await walletService.getUserWallet(userId);
      
      // 사용자의 Nest ID 정보 가져오기
      const nestIdService = new NestIdService();
      const userNestId = await nestIdService.getUserNestId(userId);
      
      // 연동 정보 생성 및 저장
      const connectionData = {
        userId,
        dappId: integration._id,
        dappName: integration.name,
        permissions: validPermissions,
        nestId: userNestId,
        status: 'connected',
        connectedAt: new Date()
      };
      
      // 연결 정보 반환
      return {
        dappName: integration.name,
        nestId: userNestId,
        permissions: validPermissions,
        connectedAt: connectionData.connectedAt
      };
    } catch (error) {
      logger.error(`사용자-DApp 연동 실패: ${error.message}`);
      throw new Error('사용자와 DApp 연동 중 오류가 발생했습니다');
    }
  }
  
  /**
   * API 키 생성 유틸리티
   * @private
   * @returns {string} 생성된 API 키
   */
  _generateApiKey() {
    return 'nst_' + this._generateRandomString(32);
  }
  
  /**
   * 비밀 키 생성 유틸리티
   * @private
   * @returns {string} 생성된 비밀 키
   */
  _generateSecretKey() {
    return 'nst_secret_' + this._generateRandomString(40);
  }
  
  /**
   * 랜덤 문자열 생성 유틸리티
   * @private
   * @param {number} length - 문자열 길이
   * @returns {string} 생성된 랜덤 문자열
   */
  _generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }
}

module.exports = IntegrationService;
