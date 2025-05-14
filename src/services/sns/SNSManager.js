const TwitterConnector = require('./TwitterConnector');
const FacebookConnector = require('./FacebookConnector');
const logger = require('../../utils/logger');

/**
 * SNS 관리자 클래스
 * 여러 SNS 플랫폼 연동을 통합적으로 관리하는 인터페이스 제공
 */
class SNSManager {
  /**
   * 생성자
   * @param {Object} config - 설정 정보
   */
  constructor(config = {}) {
    this.config = config;
    this.connectors = {};
    this.availablePlatforms = ['twitter', 'facebook'];
  }

  /**
   * 모든 SNS 커넥터 초기화
   * @returns {Promise<Object>} 초기화 결과
   */
  async initialize() {
    const results = {};
    
    // Twitter 초기화
    if (this.config.twitter) {
      try {
        const twitterConnector = new TwitterConnector(this.config.twitter);
        const success = await twitterConnector.initialize();
        
        if (success) {
          this.connectors.twitter = twitterConnector;
          results.twitter = { success: true };
        } else {
          results.twitter = { success: false, error: 'Failed to initialize Twitter connector' };
        }
      } catch (error) {
        logger.error(`Error initializing Twitter connector: ${error.message}`);
        results.twitter = { success: false, error: error.message };
      }
    }
    
    // Facebook 초기화
    if (this.config.facebook) {
      try {
        const facebookConnector = new FacebookConnector(this.config.facebook);
        const success = await facebookConnector.initialize();
        
        if (success) {
          this.connectors.facebook = facebookConnector;
          results.facebook = { success: true };
        } else {
          results.facebook = { success: false, error: 'Failed to initialize Facebook connector' };
        }
      } catch (error) {
        logger.error(`Error initializing Facebook connector: ${error.message}`);
        results.facebook = { success: false, error: error.message };
      }
    }
    
    logger.info(`SNS Manager initialized with connectors: ${Object.keys(this.connectors).join(', ')}`);
    return results;
  }

  /**
   * 특정 플랫폼 커넥터 가져오기
   * @param {string} platform - 플랫폼 이름
   * @returns {Object|null} 커넥터 객체 또는 null
   */
  getConnector(platform) {
    if (!this.availablePlatforms.includes(platform)) {
      logger.error(`Unsupported platform: ${platform}`);
      return null;
    }
    
    return this.connectors[platform] || null;
  }

  /**
   * 모든 활성 커넥터 가져오기
   * @returns {Object} 플랫폼별 커넥터 맵
   */
  getAllConnectors() {
    return this.connectors;
  }

  /**
   * 특정 플랫폼 연결
   * @param {string} platform - 플랫폼 이름
   * @param {Object} credentials - 인증 정보
   * @returns {Promise<Object>} 연결 결과
   */
  async connect(platform, credentials) {
    try {
      const connector = this.getConnector(platform);
      if (!connector) {
        throw new Error(`Connector for ${platform} not found or not initialized`);
      }
      
      const result = await connector.connect(credentials);
      if (result === true || (result && result.success)) {
        logger.info(`Connected to ${platform}`);
        return { success: true, platform };
      } else {
        logger.error(`Failed to connect to ${platform}`);
        return result;
      }
    } catch (error) {
      logger.error(`Error connecting to ${platform}: ${error.message}`);
      return { success: false, platform, error: error.message };
    }
  }

  /**
   * 특정 플랫폼 연결 해제
   * @param {string} platform - 플랫폼 이름
   * @returns {Promise<Object>} 연결 해제 결과
   */
  async disconnect(platform) {
    try {
      const connector = this.getConnector(platform);
      if (!connector) {
        throw new Error(`Connector for ${platform} not found or not initialized`);
      }
      
      const result = await connector.disconnect();
      if (result === true || (result && result.success)) {
        logger.info(`Disconnected from ${platform}`);
        return { success: true, platform };
      } else {
        logger.error(`Failed to disconnect from ${platform}`);
        return result;
      }
    } catch (error) {
      logger.error(`Error disconnecting from ${platform}: ${error.message}`);
      return { success: false, platform, error: error.message };
    }
  }

  /**
   * 모든 연결된 플랫폼에 동일한 콘텐츠 게시
   * @param {Object} content - 게시할 콘텐츠
   * @param {Object} options - 게시 옵션
   * @returns {Promise<Object>} 게시 결과
   */
  async postToAll(content, options = {}) {
    const results = {};
    const platforms = options.platforms || Object.keys(this.connectors);
    
    // 각 플랫폼별로 게시
    for (const platform of platforms) {
      try {
        const connector = this.getConnector(platform);
        if (!connector) {
          results[platform] = { success: false, error: `Connector for ${platform} not found or not initialized` };
          continue;
        }
        
        if (!connector.isConnected) {
          results[platform] = { success: false, error: `Not connected to ${platform}` };
          continue;
        }
        
        const result = await connector.post(content, options);
        results[platform] = result;
      } catch (error) {
        logger.error(`Error posting to ${platform}: ${error.message}`);
        results[platform] = { success: false, platform, error: error.message };
      }
    }
    
    return results;
  }

  /**
   * 모든 연결된 플랫폼에 NFT 공유
   * @param {Object} nft - 공유할 NFT 데이터
   * @param {Object} options - 공유 옵션
   * @returns {Promise<Object>} 공유 결과
   */
  async shareNFTToAll(nft, options = {}) {
    const results = {};
    const platforms = options.platforms || Object.keys(this.connectors);
    
    // 각 플랫폼별로 NFT 공유
    for (const platform of platforms) {
      try {
        const connector = this.getConnector(platform);
        if (!connector) {
          results[platform] = { success: false, error: `Connector for ${platform} not found or not initialized` };
          continue;
        }
        
        if (!connector.isConnected) {
          results[platform] = { success: false, error: `Not connected to ${platform}` };
          continue;
        }
        
        const result = await connector.shareNFT(nft, options);
        results[platform] = result;
      } catch (error) {
        logger.error(`Error sharing NFT to ${platform}: ${error.message}`);
        results[platform] = { success: false, platform, error: error.message };
      }
    }
    
    return results;
  }

  /**
   * 모든 연결된 플랫폼에 뱃지 공유
   * @param {Object} badge - 공유할 뱃지 데이터
   * @param {Object} options - 공유 옵션
   * @returns {Promise<Object>} 공유 결과
   */
  async shareBadgeToAll(badge, options = {}) {
    const results = {};
    const platforms = options.platforms || Object.keys(this.connectors);
    
    // 각 플랫폼별로 뱃지 공유
    for (const platform of platforms) {
      try {
        const connector = this.getConnector(platform);
        if (!connector) {
          results[platform] = { success: false, error: `Connector for ${platform} not found or not initialized` };
          continue;
        }
        
        if (!connector.isConnected) {
          results[platform] = { success: false, error: `Not connected to ${platform}` };
          continue;
        }
        
        const result = await connector.shareBadge(badge, options);
        results[platform] = result;
      } catch (error) {
        logger.error(`Error sharing badge to ${platform}: ${error.message}`);
        results[platform] = { success: false, platform, error: error.message };
      }
    }
    
    return results;
  }

  /**
   * 모든 연결된 플랫폼에 활동 성과 공유
   * @param {Object} achievement - 공유할 활동 성과 데이터
   * @param {Object} options - 공유 옵션
   * @returns {Promise<Object>} 공유 결과
   */
  async shareAchievementToAll(achievement, options = {}) {
    const results = {};
    const platforms = options.platforms || Object.keys(this.connectors);
    
    // 각 플랫폼별로 활동 성과 공유
    for (const platform of platforms) {
      try {
        const connector = this.getConnector(platform);
        if (!connector) {
          results[platform] = { success: false, error: `Connector for ${platform} not found or not initialized` };
          continue;
        }
        
        if (!connector.isConnected) {
          results[platform] = { success: false, error: `Not connected to ${platform}` };
          continue;
        }
        
        const result = await connector.shareAchievement(achievement, options);
        results[platform] = result;
      } catch (error) {
        logger.error(`Error sharing achievement to ${platform}: ${error.message}`);
        results[platform] = { success: false, platform, error: error.message };
      }
    }
    
    return results;
  }

  /**
   * 모든 연결된 플랫폼에 프로필 카드 공유
   * @param {Object} profileData - 프로필 데이터
   * @param {Object} options - 공유 옵션
   * @returns {Promise<Object>} 공유 결과
   */
  async shareProfileCardToAll(profileData, options = {}) {
    const results = {};
    const platforms = options.platforms || Object.keys(this.connectors);
    
    // 각 플랫폼별로 프로필 카드 공유
    for (const platform of platforms) {
      try {
        const connector = this.getConnector(platform);
        if (!connector) {
          results[platform] = { success: false, error: `Connector for ${platform} not found or not initialized` };
          continue;
        }
        
        if (!connector.isConnected) {
          results[platform] = { success: false, error: `Not connected to ${platform}` };
          continue;
        }
        
        const result = await connector.shareProfileCard(profileData, options);
        results[platform] = result;
      } catch (error) {
        logger.error(`Error sharing profile card to ${platform}: ${error.message}`);
        results[platform] = { success: false, platform, error: error.message };
      }
    }
    
    return results;
  }

  /**
   * 모든 연결된 플랫폼에서 사용자 프로필 정보 가져오기
   * @returns {Promise<Object>} 프로필 정보
   */
  async getAllProfiles() {
    const results = {};
    
    // 각 플랫폼별로 프로필 정보 조회
    for (const platform of Object.keys(this.connectors)) {
      try {
        const connector = this.getConnector(platform);
        if (!connector || !connector.isConnected) {
          continue;
        }
        
        const result = await connector.getProfile();
        results[platform] = result;
      } catch (error) {
        logger.error(`Error getting profile from ${platform}: ${error.message}`);
        results[platform] = { success: false, platform, error: error.message };
      }
    }
    
    return results;
  }

  /**
   * 특정 플랫폼에 게시물 반응 조회
   * @param {string} platform - 플랫폼 이름
   * @param {string} postId - 게시물 ID
   * @returns {Promise<Object>} 게시물 반응 정보
   */
  async getPostEngagement(platform, postId) {
    try {
      const connector = this.getConnector(platform);
      if (!connector) {
        throw new Error(`Connector for ${platform} not found or not initialized`);
      }
      
      if (!connector.isConnected) {
        throw new Error(`Not connected to ${platform}`);
      }
      
      return await connector.getPostEngagement(postId);
    } catch (error) {
      logger.error(`Error getting post engagement from ${platform}: ${error.message}`);
      return { success: false, platform, error: error.message };
    }
  }

  /**
   * 새로운 SNS 플랫폼 커넥터 추가
   * @param {string} platform - 플랫폼 이름
   * @param {Object} connector - 커넥터 객체
   * @returns {boolean} 추가 성공 여부
   */
  addConnector(platform, connector) {
    try {
      if (!platform || typeof platform !== 'string') {
        throw new Error('Invalid platform name');
      }
      
      if (!connector || typeof connector.initialize !== 'function') {
        throw new Error('Invalid connector object');
      }
      
      // 플랫폼 이름 추가
      if (!this.availablePlatforms.includes(platform)) {
        this.availablePlatforms.push(platform);
      }
      
      // 커넥터 추가
      this.connectors[platform] = connector;
      logger.info(`Added connector for ${platform}`);
      
      return true;
    } catch (error) {
      logger.error(`Error adding connector for ${platform}: ${error.message}`);
      return false;
    }
  }

  /**
   * 계정 연결 상태 확인
   * @param {string} platform - 플랫폼 이름
   * @returns {boolean} 연결 상태
   */
  isConnected(platform) {
    const connector = this.getConnector(platform);
    return connector ? connector.isConnected : false;
  }

  /**
   * 모든 계정 연결 상태 확인
   * @returns {Object} 플랫폼별 연결 상태
   */
  getConnectionStatus() {
    const status = {};
    
    for (const platform of this.availablePlatforms) {
      const connector = this.getConnector(platform);
      status[platform] = {
        available: !!connector,
        connected: connector ? connector.isConnected : false
      };
    }
    
    return status;
  }
}

module.exports = SNSManager;
