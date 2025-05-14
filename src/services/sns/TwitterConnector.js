const SNSConnectorInterface = require('./SNSConnectorInterface');
const axios = require('axios');
const { TwitterApi } = require('twitter-api-v2');
const sharp = require('sharp');
const logger = require('../../utils/logger');

/**
 * Twitter 연동 서비스
 * Twitter API를 통해 NFT 및 뱃지 공유 기능 제공
 */
class TwitterConnector extends SNSConnectorInterface {
  /**
   * 생성자
   * @param {Object} config - 연결 구성 정보
   */
  constructor(config = {}) {
    super(config);
    this.platform = 'twitter';
    this.apiClient = null;
    this.userContext = null;
  }

  /**
   * 연결 초기화
   * @returns {Promise<boolean>} 연결 성공 여부
   */
  async initialize() {
    try {
      // 필수 설정 확인
      if (!this.config.apiKey || !this.config.apiSecret) {
        throw new Error('Missing required Twitter API credentials');
      }

      logger.info('Twitter connector initialized');
      return true;
    } catch (error) {
      logger.error(`Twitter initialization error: ${error.message}`);
      return false;
    }
  }

  /**
   * Twitter API 연결
   * @param {Object} credentials - 인증 정보 (accessToken, accessSecret 포함)
   * @returns {Promise<boolean>} 연결 성공 여부
   */
  async connect(credentials) {
    try {
      if (!credentials.accessToken || !credentials.accessSecret) {
        throw new Error('Missing required access tokens');
      }

      // Twitter API 클라이언트 생성
      this.apiClient = new TwitterApi({
        appKey: this.config.apiKey,
        appSecret: this.config.apiSecret,
        accessToken: credentials.accessToken,
        accessSecret: credentials.accessSecret
      });

      // 사용자 정보로 연결 상태 확인
      const user = await this.apiClient.v2.me();
      this.userContext = user.data;
      this.isConnected = true;

      logger.info(`Connected to Twitter as @${this.userContext.username}`);
      return true;
    } catch (error) {
      this.isConnected = false;
      logger.error(`Twitter connection error: ${error.message}`);
      return this.handleError(error);
    }
  }

  /**
   * Twitter 연결 해제
   * @returns {Promise<boolean>} 연결 해제 성공 여부
   */
  async disconnect() {
    try {
      this.apiClient = null;
      this.userContext = null;
      this.isConnected = false;
      logger.info('Twitter connection ended');
      return true;
    } catch (error) {
      logger.error(`Twitter disconnect error: ${error.message}`);
      return this.handleError(error);
    }
  }

  /**
   * 기본 트윗 게시
   * @param {Object} content - 게시할 콘텐츠
   * @param {Object} options - 게시 옵션
   * @returns {Promise<Object>} 게시 결과
   */
  async post(content, options = {}) {
    try {
      this._checkConnection();

      const { text, mediaIds = [] } = content;

      if (!text && mediaIds.length === 0) {
        throw new Error('Tweet must contain text or media');
      }

      const tweetData = { text: text || '' };

      // 미디어 ID가 있으면 추가
      if (mediaIds.length > 0) {
        tweetData.media = { media_ids: mediaIds };
      }

      // 트윗 게시
      const tweet = await this.apiClient.v2.tweet(tweetData);

      logger.info(`Tweet posted with id: ${tweet.data.id}`);
      return {
        success: true,
        post: tweet.data,
        platform: this.platform,
        url: `https://twitter.com/${this.userContext.username}/status/${tweet.data.id}`
      };
    } catch (error) {
      logger.error(`Error posting tweet: ${error.message}`);
      return this.handleError(error);
    }
  }

  /**
   * 이미지 업로드
   * @param {Buffer|string} imageData - 이미지 데이터 또는 URL
   * @returns {Promise<string>} 업로드된 미디어 ID
   * @private
   */
  async _uploadMedia(imageData) {
    try {
      this._checkConnection();

      let mediaBuffer;

      if (typeof imageData === 'string' && imageData.startsWith('http')) {
        // URL에서 이미지 다운로드
        const response = await axios.get(imageData, { responseType: 'arraybuffer' });
        mediaBuffer = Buffer.from(response.data, 'binary');
      } else if (Buffer.isBuffer(imageData)) {
        mediaBuffer = imageData;
      } else {
        throw new Error('Invalid image data format');
      }

      // 이미지 최적화 (Twitter 권장 사항)
      const optimizedImage = await sharp(mediaBuffer)
        .resize(1200, 675, {
          fit: sharp.fit.inside,
          withoutEnlargement: true
        })
        .jpeg({ quality: 90 })
        .toBuffer();

      // 미디어 업로드
      const mediaId = await this.apiClient.v1.uploadMedia(optimizedImage, { mimeType: 'image/jpeg' });
      
      logger.info(`Media uploaded with id: ${mediaId}`);
      return mediaId;
    } catch (error) {
      logger.error(`Error uploading media: ${error.message}`);
      throw error;
    }
  }

  /**
   * NFT 공유
   * @param {Object} nft - 공유할 NFT 데이터
   * @param {Object} options - 공유 옵션
   * @returns {Promise<Object>} 공유 결과
   */
  async shareNFT(nft, options = {}) {
    try {
      this._checkConnection();

      // NFT 데이터 확인
      if (!nft || !nft.image) {
        throw new Error('Invalid NFT data. Image is required');
      }

      // 이미지 업로드
      const mediaId = await this._uploadMedia(nft.image);

      // 기본 텍스트 구성
      let tweetText = options.text || `Check out my NFT: ${nft.name || 'Nest NFT'}`;
      
      // 설명 추가
      if (nft.description) {
        tweetText += `\n\n${nft.description.substring(0, 100)}${nft.description.length > 100 ? '...' : ''}`;
      }
      
      // 해시태그 추가
      const hashtags = options.hashtags || ['#NestNFT', '#Web3', '#CreataChain'];
      tweetText += `\n\n${hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')}`;
      
      // NFT 링크 추가
      if (nft.url) {
        tweetText += `\n\n${nft.url}`;
      }

      // 트윗 게시
      return await this.post({
        text: tweetText,
        mediaIds: [mediaId]
      }, options);
    } catch (error) {
      logger.error(`Error sharing NFT: ${error.message}`);
      return this.handleError(error);
    }
  }

  /**
   * 뱃지 공유
   * @param {Object} badge - 공유할 뱃지 데이터
   * @param {Object} options - 공유 옵션
   * @returns {Promise<Object>} 공유 결과
   */
  async shareBadge(badge, options = {}) {
    try {
      this._checkConnection();

      // 뱃지 데이터 확인
      if (!badge || !badge.image) {
        throw new Error('Invalid badge data. Image is required');
      }

      // 이미지 업로드
      const mediaId = await this._uploadMedia(badge.image);

      // 기본 텍스트 구성
      let tweetText = options.text || `I earned a new badge: ${badge.name || 'Nest Badge'}`;
      
      // 뱃지 설명 추가
      if (badge.description) {
        tweetText += `\n\n${badge.description.substring(0, 100)}${badge.description.length > 100 ? '...' : ''}`;
      }
      
      // 해시태그 추가
      const hashtags = options.hashtags || ['#NestBadge', '#Achievement', '#CreataChain'];
      tweetText += `\n\n${hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')}`;
      
      // 트윗 게시
      return await this.post({
        text: tweetText,
        mediaIds: [mediaId]
      }, options);
    } catch (error) {
      logger.error(`Error sharing badge: ${error.message}`);
      return this.handleError(error);
    }
  }

  /**
   * 활동 성과 공유
   * @param {Object} achievement - 공유할 활동 성과 데이터
   * @param {Object} options - 공유 옵션
   * @returns {Promise<Object>} 공유 결과
   */
  async shareAchievement(achievement, options = {}) {
    try {
      this._checkConnection();

      // 성과 데이터 확인
      if (!achievement || !achievement.title) {
        throw new Error('Invalid achievement data. Title is required');
      }

      // 기본 텍스트 구성
      let tweetText = options.text || `I just completed: ${achievement.title}`;
      
      // 상세 정보 추가
      if (achievement.description) {
        tweetText += `\n\n${achievement.description.substring(0, 100)}${achievement.description.length > 100 ? '...' : ''}`;
      }
      
      // XP 정보 추가
      if (achievement.xp) {
        tweetText += `\n\nEarned ${achievement.xp} XP`;
      }
      
      // 해시태그 추가
      const hashtags = options.hashtags || ['#NestAchievement', '#CreataChain'];
      tweetText += `\n\n${hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')}`;

      // 이미지가 있으면 업로드
      let mediaIds = [];
      if (achievement.image) {
        const mediaId = await this._uploadMedia(achievement.image);
        mediaIds.push(mediaId);
      }
      
      // 트윗 게시
      return await this.post({
        text: tweetText,
        mediaIds
      }, options);
    } catch (error) {
      logger.error(`Error sharing achievement: ${error.message}`);
      return this.handleError(error);
    }
  }

  /**
   * 프로필 카드 생성 및 공유
   * @param {Object} profileData - 프로필 데이터
   * @param {Object} options - 공유 옵션
   * @returns {Promise<Object>} 공유 결과
   */
  async shareProfileCard(profileData, options = {}) {
    try {
      this._checkConnection();

      // 프로필 데이터 확인
      if (!profileData || !profileData.nestId) {
        throw new Error('Invalid profile data. Nest ID is required');
      }

      // 프로필 카드 이미지 생성 (별도 서비스 필요)
      const profileCardImage = await this._generateProfileCard(profileData);
      
      // 이미지 업로드
      const mediaId = await this._uploadMedia(profileCardImage);

      // 기본 텍스트 구성
      let tweetText = options.text || `Check out my Nest profile: ${profileData.nestId}`;
      
      // 통계 정보 추가
      if (profileData.stats) {
        if (profileData.stats.level) {
          tweetText += `\n\nLevel: ${profileData.stats.level}`;
        }
        if (profileData.stats.xp) {
          tweetText += ` | XP: ${profileData.stats.xp}`;
        }
        if (profileData.stats.nfts) {
          tweetText += ` | NFTs: ${profileData.stats.nfts}`;
        }
      }
      
      // 해시태그 추가
      const hashtags = options.hashtags || ['#NestProfile', '#CreataChain', '#Web3'];
      tweetText += `\n\n${hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')}`;
      
      // 프로필 링크 추가
      if (profileData.url) {
        tweetText += `\n\n${profileData.url}`;
      }

      // 트윗 게시
      return await this.post({
        text: tweetText,
        mediaIds: [mediaId]
      }, options);
    } catch (error) {
      logger.error(`Error sharing profile card: ${error.message}`);
      return this.handleError(error);
    }
  }

  /**
   * 프로필 카드 이미지 생성
   * @param {Object} profileData - 프로필 데이터
   * @returns {Promise<Buffer>} 생성된 이미지 버퍼
   * @private
   */
  async _generateProfileCard(profileData) {
    // 여기서는 실제 이미지 생성 로직을 구현하지 않습니다.
    // 외부 이미지 생성 서비스를 호출하거나 Canvas, SVG 라이브러리를 사용하여 구현할 수 있습니다.
    // 테스트를 위해 더미 이미지 제공
    
    // 더미 이미지 반환 (실제로는 profileData를 기반으로 동적 생성)
    return Buffer.from('dummy_image_data');
  }

  /**
   * 게시물 반응 조회
   * @param {string} postId - 트윗 ID
   * @returns {Promise<Object>} 반응 데이터
   */
  async getPostEngagement(postId) {
    try {
      this._checkConnection();

      // 트윗 정보 조회
      const tweet = await this.apiClient.v2.singleTweet(postId, {
        'tweet.fields': ['public_metrics']
      });

      if (!tweet.data) {
        throw new Error('Tweet not found');
      }

      const { public_metrics } = tweet.data;
      
      return {
        success: true,
        platform: this.platform,
        postId,
        engagements: {
          likes: public_metrics.like_count,
          retweets: public_metrics.retweet_count,
          quotes: public_metrics.quote_count,
          replies: public_metrics.reply_count
        }
      };
    } catch (error) {
      logger.error(`Error getting post engagement: ${error.message}`);
      return this.handleError(error);
    }
  }

  /**
   * 사용자 프로필 정보 가져오기
   * @returns {Promise<Object>} 프로필 정보
   */
  async getProfile() {
    try {
      this._checkConnection();

      // 사용자 정보 조회
      const user = await this.apiClient.v2.me({
        'user.fields': ['profile_image_url', 'description', 'public_metrics']
      });

      if (!user.data) {
        throw new Error('User not found');
      }

      return {
        success: true,
        platform: this.platform,
        profile: {
          id: user.data.id,
          username: user.data.username,
          name: user.data.name,
          description: user.data.description,
          profileImage: user.data.profile_image_url,
          metrics: user.data.public_metrics
        }
      };
    } catch (error) {
      logger.error(`Error getting profile: ${error.message}`);
      return this.handleError(error);
    }
  }

  /**
   * 연결 상태 확인
   * @throws {Error} 연결되지 않은 경우 에러
   * @private
   */
  _checkConnection() {
    if (!this.apiClient || !this.isConnected) {
      throw new Error('Not connected to Twitter API');
    }
  }

  /**
   * 에러 핸들링
   * @param {Error} error - 에러 객체
   * @returns {Object} 처리된 에러 정보
   */
  handleError(error) {
    // API 응답 에러인 경우
    if (error.response) {
      const { errors } = error.response.data || { errors: [] };
      const codes = errors.map(e => e.code).join(', ');
      const messages = errors.map(e => e.message).join('; ');
      
      logger.error(`Twitter API Error [${codes}]: ${messages}`);
      
      return {
        success: false,
        platform: this.platform,
        error: messages,
        code: codes
      };
    }
    
    // 기본 에러 처리
    logger.error(`Twitter Error: ${error.message}`);
    return {
      success: false,
      platform: this.platform,
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    };
  }
}

module.exports = TwitterConnector;
