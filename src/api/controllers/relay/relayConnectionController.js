/**
 * Relay Connection 컨트롤러
 * 
 * 외부 DApp과 Nest 플랫폼 간의 연결을 관리하는 API 엔드포인트를 제공합니다.
 * 이 컨트롤러를 통해 연결 생성, 조회, 갱신, 철회 등의 기능을 처리합니다.
 */

const relayConnectionService = require('../../../services/relay/relayConnectionService');
const responseHandler = require('../../../utils/responseHandler');
const logger = require('../../../utils/logger');

/**
 * 새 연결 생성
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.createConnection = async (req, res) => {
  try {
    const { connectionData, expiresIn } = req.body;
    
    // 토큰에서 사용자 ID 설정
    connectionData.userId = req.user.id;
    
    const result = await relayConnectionService.createConnection(connectionData, expiresIn);
    
    // 응답에서 민감한 정보 제거
    const sanitizedConnection = sanitizeConnection(result.connection);
    
    return responseHandler.success(res, {
      connection: sanitizedConnection,
      accessToken: result.accessToken,
      isNew: result.isNew
    });
  } catch (error) {
    logger.error('연결 생성 실패:', error);
    return responseHandler.error(res, error.message, error.statusCode);
  }
};

/**
 * 연결 정보 조회
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getConnection = async (req, res) => {
  try {
    const { connectionId } = req.params;
    
    // 연결 조회
    const connection = await relayConnectionService.getConnection(connectionId);
    
    // 사용자 소유 확인
    if (connection.user._id.toString() !== req.user.id) {
      return responseHandler.forbidden(res, '이 연결에 접근할 권한이 없습니다.');
    }
    
    // 응답에서 민감한 정보 제거
    const sanitizedConnection = sanitizeConnection(connection);
    
    return responseHandler.success(res, sanitizedConnection);
  } catch (error) {
    logger.error('연결 조회 실패:', error);
    return responseHandler.error(res, error.message, error.statusCode);
  }
};

/**
 * 연결 키로 연결 정보 조회 (DApp에서 사용)
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getConnectionByKey = async (req, res) => {
  try {
    const { connectionKey } = req.params;
    
    // 연결 조회
    const connection = await relayConnectionService.getConnectionByKey(connectionKey);
    
    // 도메인 검증 (Referer 또는 Origin 헤더로 확인)
    const requestDomain = req.headers.referer || req.headers.origin;
    if (!requestDomain || !requestDomain.includes(connection.dapp.domain)) {
      return responseHandler.forbidden(res, '허용되지 않은 도메인에서 요청되었습니다.');
    }
    
    // DApp에 필요한 정보만 추출
    const dappConnectionInfo = {
      id: connection._id,
      connectionKey: connection.connectionKey,
      status: connection.status,
      permissions: connection.permissions,
      nestId: connection.nestId.name ? {
        name: connection.nestId.name,
        domain: connection.nestId.domain
      } : null,
      wallet: connection.permissions.readWalletAddress ? {
        address: connection.wallet.address
      } : null,
      user: connection.permissions.readUserProfile ? {
        name: connection.user.name,
        profileImage: connection.user.profileImage
      } : null
    };
    
    return responseHandler.success(res, dappConnectionInfo);
  } catch (error) {
    logger.error('연결 키 조회 실패:', error);
    return responseHandler.error(res, error.message, error.statusCode);
  }
};

/**
 * 사용자의 연결 목록 조회
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getUserConnections = async (req, res) => {
  try {
    const userId = req.user.id;
    const { activeOnly } = req.query;
    
    // 활성 연결만 조회할지 여부
    const showActiveOnly = activeOnly !== 'false';
    
    // 연결 목록 조회
    const connections = await relayConnectionService.getUserConnections(userId, showActiveOnly);
    
    // 응답에서 민감한 정보 제거
    const sanitizedConnections = connections.map(sanitizeConnection);
    
    return responseHandler.success(res, sanitizedConnections);
  } catch (error) {
    logger.error('사용자 연결 목록 조회 실패:', error);
    return responseHandler.error(res, error.message, error.statusCode);
  }
};

/**
 * 연결 갱신
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.renewConnection = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { expiresIn } = req.body;
    
    // 연결 정보 조회
    const connection = await relayConnectionService.getConnection(connectionId);
    
    // 사용자 소유 확인
    if (connection.user._id.toString() !== req.user.id) {
      return responseHandler.forbidden(res, '이 연결에 접근할 권한이 없습니다.');
    }
    
    // 연결 갱신
    const result = await relayConnectionService.renewConnection(connectionId, expiresIn);
    
    // 응답에서 민감한 정보 제거
    const sanitizedConnection = sanitizeConnection(result.connection);
    
    return responseHandler.success(res, {
      connection: sanitizedConnection,
      accessToken: result.accessToken
    });
  } catch (error) {
    logger.error('연결 갱신 실패:', error);
    return responseHandler.error(res, error.message, error.statusCode);
  }
};

/**
 * 연결 철회
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.revokeConnection = async (req, res) => {
  try {
    const { connectionId } = req.params;
    
    // 연결 정보 조회
    const connection = await relayConnectionService.getConnection(connectionId);
    
    // 사용자 소유 확인
    if (connection.user._id.toString() !== req.user.id) {
      return responseHandler.forbidden(res, '이 연결에 접근할 권한이 없습니다.');
    }
    
    // 연결 철회
    const result = await relayConnectionService.revokeConnection(connectionId);
    
    return responseHandler.success(res, result);
  } catch (error) {
    logger.error('연결 철회 실패:', error);
    return responseHandler.error(res, error.message, error.statusCode);
  }
};

/**
 * 연결 권한 업데이트
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.updateConnectionPermissions = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { permissions } = req.body;
    
    // 연결 정보 조회
    const connection = await relayConnectionService.getConnection(connectionId);
    
    // 사용자 소유 확인
    if (connection.user._id.toString() !== req.user.id) {
      return responseHandler.forbidden(res, '이 연결에 접근할 권한이 없습니다.');
    }
    
    // 권한 업데이트
    const updatedConnection = await relayConnectionService.updateConnectionPermissions(connectionId, permissions);
    
    // 응답에서 민감한 정보 제거
    const sanitizedConnection = sanitizeConnection(updatedConnection);
    
    return responseHandler.success(res, sanitizedConnection);
  } catch (error) {
    logger.error('연결 권한 업데이트 실패:', error);
    return responseHandler.error(res, error.message, error.statusCode);
  }
};

/**
 * 액세스 토큰 검증 및 연결 정보 반환 (DApp에서 사용)
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.verifyAccessToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return responseHandler.badRequest(res, '액세스 토큰이 필요합니다.');
    }
    
    // 토큰 검증
    const result = await relayConnectionService.verifyAccessToken(token);
    
    // 도메인 검증 (Referer 또는 Origin 헤더로 확인)
    const requestDomain = req.headers.referer || req.headers.origin;
    if (!requestDomain || !requestDomain.includes(result.connection.dapp.domain)) {
      return responseHandler.forbidden(res, '허용되지 않은 도메인에서 요청되었습니다.');
    }
    
    // DApp에 필요한 정보만 추출
    const dappConnectionInfo = {
      id: result.connection._id,
      connectionKey: result.connection.connectionKey,
      status: result.connection.status,
      permissions: result.connection.permissions,
      expiresAt: result.connection.session.expiresAt,
      valid: true
    };
    
    return responseHandler.success(res, dappConnectionInfo);
  } catch (error) {
    logger.error('액세스 토큰 검증 실패:', error);
    
    // 특정 오류에 대한 맞춤형 응답
    if (error.message.includes('만료') || error.message.includes('유효하지 않')) {
      return responseHandler.unauthorized(res, {
        valid: false,
        message: error.message
      });
    }
    
    return responseHandler.error(res, error.message, error.statusCode);
  }
};

/**
 * 토큰 갱신 (DApp에서 사용)
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return responseHandler.badRequest(res, '갱신 토큰이 필요합니다.');
    }
    
    // 토큰 갱신
    const result = await relayConnectionService.refreshToken(refreshToken);
    
    // 도메인 검증 (Referer 또는 Origin 헤더로 확인)
    const requestDomain = req.headers.referer || req.headers.origin;
    if (!requestDomain || !requestDomain.includes(result.connection.dapp.domain)) {
      return responseHandler.forbidden(res, '허용되지 않은 도메인에서 요청되었습니다.');
    }
    
    // 응답 반환
    return responseHandler.success(res, {
      accessToken: result.accessToken,
      expiresAt: result.connection.session.expiresAt
    });
  } catch (error) {
    logger.error('토큰 갱신 실패:', error);
    return responseHandler.error(res, error.message, error.statusCode);
  }
};

/**
 * 연결 정보에서 민감한 데이터 제거
 * 
 * @param {Object} connection - 연결 객체
 * @returns {Object} 민감한 정보가 제거된 연결 객체
 * @private
 */
function sanitizeConnection(connection) {
  // 객체 복사
  const sanitized = {
    ...connection.toObject()
  };
  
  // 세션 토큰 및 민감한 정보 삭제
  if (sanitized.session) {
    delete sanitized.session.token;
    delete sanitized.session.refreshToken;
  }
  
  return sanitized;
}
