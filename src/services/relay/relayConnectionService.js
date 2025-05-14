/**
 * Relay Connection 서비스
 * 
 * 외부 DApp과 Nest 플랫폼 간의 연결을 관리하는 서비스입니다.
 * 연결 생성, 조회, 갱신, 철회 등의 기능을 제공합니다.
 */

const RelayConnection = require('../../models/relay/relayConnection');
const User = require('../../models/user');
const NestId = require('../../models/nestId');
const Wallet = require('../../models/wallet');
const logger = require('../../utils/logger');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../../config');

/**
 * Relay Connection 서비스 클래스
 */
class RelayConnectionService {
  /**
   * 새 연결 생성
   * 
   * @param {Object} connectionData - 연결 데이터
   * @param {string} connectionData.userId - 사용자 ID
   * @param {string} connectionData.nestIdId - Nest ID
   * @param {string} connectionData.walletId - 지갑 ID
   * @param {Object} connectionData.dapp - DApp 정보
   * @param {Object} connectionData.permissions - 권한 설정
   * @param {Object} connectionData.metadata - 메타데이터
   * @param {number} expiresIn - 만료 시간 (밀리초)
   * @returns {Promise<Object>} 생성된 연결 및 액세스 토큰
   */
  async createConnection(connectionData, expiresIn = null) {
    try {
      // 필수 데이터 확인
      if (!connectionData.userId || !connectionData.nestIdId || !connectionData.walletId || !connectionData.dapp) {
        throw new Error('필수 데이터가 누락되었습니다.');
      }

      // 사용자, Nest ID, 지갑 확인
      const [user, nestId, wallet] = await Promise.all([
        User.findById(connectionData.userId),
        NestId.findById(connectionData.nestIdId),
        Wallet.findById(connectionData.walletId)
      ]);

      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      if (!nestId) {
        throw new Error('Nest ID를 찾을 수 없습니다.');
      }

      if (!wallet) {
        throw new Error('지갑을 찾을 수 없습니다.');
      }

      // 사용자가 Nest ID와 지갑의 소유자인지 확인
      if (nestId.owner.toString() !== user._id.toString()) {
        throw new Error('사용자가 Nest ID의 소유자가 아닙니다.');
      }

      if (wallet.user.toString() !== user._id.toString()) {
        throw new Error('사용자가 지갑의 소유자가 아닙니다.');
      }

      // DApp 정보 검증
      if (!connectionData.dapp.name || !connectionData.dapp.domain) {
        throw new Error('DApp 정보가 유효하지 않습니다.');
      }

      // 기존 연결 확인 (같은 사용자, 같은 DApp 도메인에 대한 활성 연결)
      const existingConnections = await RelayConnection.findActiveByDomain(
        connectionData.dapp.domain,
        connectionData.userId
      );

      // 기존 연결이 있으면 갱신
      if (existingConnections.length > 0) {
        const existingConnection = existingConnections[0];
        await existingConnection.renew(expiresIn);

        // 권한 업데이트
        if (connectionData.permissions) {
          existingConnection.permissions = {
            ...existingConnection.permissions,
            ...connectionData.permissions
          };
          await existingConnection.save();
        }

        // 액세스 토큰 생성
        const accessToken = this._generateAccessToken(existingConnection);

        return {
          connection: existingConnection,
          accessToken,
          isNew: false
        };
      }

      // 새 연결 생성
      const connectionKey = crypto.randomBytes(32).toString('hex');
      
      // 만료 시간 설정
      let expiresAt = null;
      if (expiresIn) {
        expiresAt = new Date(Date.now() + expiresIn);
      } else {
        // 기본 30일
        expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }

      // 인증 토큰 생성
      const token = crypto.randomBytes(32).toString('hex');
      const refreshToken = crypto.randomBytes(32).toString('hex');

      // 연결 객체 생성
      const connection = new RelayConnection({
        connectionKey,
        name: `${connectionData.dapp.name} 연결`,
        user: connectionData.userId,
        nestId: connectionData.nestIdId,
        wallet: connectionData.walletId,
        dapp: {
          name: connectionData.dapp.name,
          domain: connectionData.dapp.domain,
          logoUrl: connectionData.dapp.logoUrl || null,
          description: connectionData.dapp.description || null,
          registered: this._isRegisteredDapp(connectionData.dapp.domain)
        },
        status: 'active',
        permissions: connectionData.permissions || {
          readNestId: true,
          readWalletAddress: true,
          readWalletBalance: false,
          requestSignature: false,
          autoSign: false,
          autoSignMaxAmount: 0,
          useGasless: false,
          readUserProfile: false
        },
        metadata: connectionData.metadata || {},
        session: {
          expiresAt,
          token,
          refreshToken
        }
      });

      // 저장
      await connection.save();

      // 액세스 토큰 생성
      const accessToken = this._generateAccessToken(connection);

      logger.info(`새 Relay 연결 생성: ${connection._id}`, { userId: connectionData.userId });

      return {
        connection,
        accessToken,
        isNew: true
      };
    } catch (error) {
      logger.error('Relay 연결 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 연결 정보 조회
   * 
   * @param {string} connectionId - 연결 ID
   * @returns {Promise<Object>} 연결 정보
   */
  async getConnection(connectionId) {
    try {
      const connection = await RelayConnection.findById(connectionId)
        .populate('user', 'name email profileImage')
        .populate('nestId', 'name domain')
        .populate('wallet', 'address balance');

      if (!connection) {
        throw new Error('연결을 찾을 수 없습니다.');
      }

      return connection;
    } catch (error) {
      logger.error(`Relay 연결 조회 실패 ${connectionId}:`, error);
      throw error;
    }
  }

  /**
   * 연결 키로 연결 정보 조회
   * 
   * @param {string} connectionKey - 연결 키
   * @returns {Promise<Object>} 연결 정보
   */
  async getConnectionByKey(connectionKey) {
    try {
      const connection = await RelayConnection.findActiveByKey(connectionKey)
        .populate('user', 'name email profileImage')
        .populate('nestId', 'name domain')
        .populate('wallet', 'address balance');

      if (!connection) {
        throw new Error('유효한 연결을 찾을 수 없습니다.');
      }

      return connection;
    } catch (error) {
      logger.error('Relay 연결 키 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자의 연결 목록 조회
   * 
   * @param {string} userId - 사용자 ID
   * @param {boolean} activeOnly - 활성 연결만 조회
   * @returns {Promise<Array>} 연결 목록
   */
  async getUserConnections(userId, activeOnly = true) {
    try {
      let query = { user: userId };

      if (activeOnly) {
        query.status = 'active';
        query.$or = [
          { 'session.expiresAt': { $gt: new Date() } },
          { 'session.expiresAt': null }
        ];
      }

      const connections = await RelayConnection.find(query)
        .populate('nestId', 'name domain')
        .populate('wallet', 'address');

      return connections;
    } catch (error) {
      logger.error(`사용자 Relay 연결 목록 조회 실패 ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 연결 갱신
   * 
   * @param {string} connectionId - 연결 ID
   * @param {number} expiresIn - 만료 시간 (밀리초)
   * @returns {Promise<Object>} 갱신된 연결 및 액세스 토큰
   */
  async renewConnection(connectionId, expiresIn = null) {
    try {
      const connection = await RelayConnection.findById(connectionId);

      if (!connection) {
        throw new Error('연결을 찾을 수 없습니다.');
      }

      if (connection.status === 'revoked') {
        throw new Error('철회된 연결은 갱신할 수 없습니다.');
      }

      // 연결 갱신
      await connection.renew(expiresIn);

      // 액세스 토큰 생성
      const accessToken = this._generateAccessToken(connection);

      return {
        connection,
        accessToken
      };
    } catch (error) {
      logger.error(`Relay 연결 갱신 실패 ${connectionId}:`, error);
      throw error;
    }
  }

  /**
   * 연결 철회
   * 
   * @param {string} connectionId - 연결 ID
   * @returns {Promise<Object>} 철회 결과
   */
  async revokeConnection(connectionId) {
    try {
      const connection = await RelayConnection.findById(connectionId);

      if (!connection) {
        throw new Error('연결을 찾을 수 없습니다.');
      }

      // 연결 철회
      await connection.revoke();

      return {
        success: true,
        message: '연결이 성공적으로 철회되었습니다.'
      };
    } catch (error) {
      logger.error(`Relay 연결 철회 실패 ${connectionId}:`, error);
      throw error;
    }
  }

  /**
   * 연결 권한 업데이트
   * 
   * @param {string} connectionId - 연결 ID
   * @param {Object} permissions - 업데이트할 권한
   * @returns {Promise<Object>} 업데이트된 연결
   */
  async updateConnectionPermissions(connectionId, permissions) {
    try {
      const connection = await RelayConnection.findById(connectionId);

      if (!connection) {
        throw new Error('연결을 찾을 수 없습니다.');
      }

      if (connection.status !== 'active') {
        throw new Error('활성 상태가 아닌 연결의 권한을 업데이트할 수 없습니다.');
      }

      // 권한 업데이트
      connection.permissions = {
        ...connection.permissions,
        ...permissions
      };

      // 저장
      await connection.save();

      return connection;
    } catch (error) {
      logger.error(`Relay 연결 권한 업데이트 실패 ${connectionId}:`, error);
      throw error;
    }
  }

  /**
   * 도메인이 등록된 DApp인지 확인
   * 
   * @param {string} domain - 도메인
   * @returns {boolean} 등록 여부
   * @private
   */
  _isRegisteredDapp(domain) {
    // 등록된 DApp 목록 확인 (예시)
    const registeredDapps = [
      'app.creatachain.com',
      'marketplace.creatachain.com',
      'swap.creatachain.com',
      'bridge.creatachain.com',
      'dao.creatachain.com'
    ];

    return registeredDapps.includes(domain);
  }

  /**
   * 액세스 토큰 생성
   * 
   * @param {Object} connection - 연결 객체
   * @returns {string} 액세스 토큰
   * @private
   */
  _generateAccessToken(connection) {
    // 서명에 필요한 비밀 키
    const secretKey = config.jwt.secret || 'nest-relay-jwt-secret';

    // 토큰에 포함할 데이터
    const payload = {
      connectionId: connection._id,
      connectionKey: connection.connectionKey,
      userId: connection.user,
      dappDomain: connection.dapp.domain,
      permissions: connection.permissions,
      type: 'relay'
    };

    // 토큰 만료 시간 설정
    const options = {
      expiresIn: '1h' // 1시간 후 만료
    };

    // 토큰 생성
    return jwt.sign(payload, secretKey, options);
  }

  /**
   * 액세스 토큰 검증
   * 
   * @param {string} token - 액세스 토큰
   * @returns {Promise<Object>} 검증된 토큰 데이터 및 연결 정보
   */
  async verifyAccessToken(token) {
    try {
      // 서명에 필요한 비밀 키
      const secretKey = config.jwt.secret || 'nest-relay-jwt-secret';

      // 토큰 검증
      const decoded = jwt.verify(token, secretKey);

      // 연결 정보 조회
      const connection = await RelayConnection.findById(decoded.connectionId);

      if (!connection) {
        throw new Error('연결을 찾을 수 없습니다.');
      }

      if (connection.status !== 'active') {
        throw new Error('연결이 활성 상태가 아닙니다.');
      }

      // 만료 확인
      if (connection.session.expiresAt && new Date() > new Date(connection.session.expiresAt)) {
        throw new Error('연결이 만료되었습니다.');
      }

      // 연결 사용 로깅
      await connection.logUsage();

      return {
        decoded,
        connection
      };
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new Error('유효하지 않거나 만료된 토큰입니다.');
      }

      logger.error('Relay 액세스 토큰 검증 실패:', error);
      throw error;
    }
  }

  /**
   * 토큰 갱신
   * 
   * @param {string} refreshToken - 갱신 토큰
   * @returns {Promise<Object>} 새 액세스 토큰 및 연결 정보
   */
  async refreshToken(refreshToken) {
    try {
      // refreshToken으로 연결 찾기
      const connection = await RelayConnection.findOne({
        'session.refreshToken': refreshToken,
        status: 'active'
      });

      if (!connection) {
        throw new Error('유효하지 않은 갱신 토큰입니다.');
      }

      // 만료 확인
      if (connection.session.expiresAt && new Date() > new Date(connection.session.expiresAt)) {
        throw new Error('연결이 만료되었습니다.');
      }

      // 새 액세스 토큰 생성
      const accessToken = this._generateAccessToken(connection);

      return {
        connection,
        accessToken
      };
    } catch (error) {
      logger.error('Relay 토큰 갱신 실패:', error);
      throw error;
    }
  }
}

module.exports = new RelayConnectionService();
