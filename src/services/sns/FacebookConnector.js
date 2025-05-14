const SNSConnectorInterface = require('./SNSConnectorInterface');
const axios = require('axios');
const FormData = require('form-data');
const sharp = require('sharp');
const logger = require('../../utils/logger');

/**
 * Facebook 연동 서비스
 * Facebook Graph API를 통해 NFT 및 뱃지 공유 기능 제공
 */
class FacebookConnector extends SNSConnectorInterface {
  /**
   * 생성자
   * @param {Object} config - 연결 구성 정보
   */
  constructor(config = {}) {
    super(config);
    this.platform = 'facebook';
    this.accessToken = null;
    this.userId = null;
    this.apiVersion = config.apiVersion || 'v18.0'; // Facebook Graph API 버전
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
  }

  /**
   * 연결 초기화
   * @returns {Promise<boolean>} 연결 성공 여부
   */
  async initialize() {
    try {
      // 필수 설정 확인
      if (!this.config.appId || !this.config.appSecret) {
        throw new Error('Missing required Facebook API credentials');
      }

      logger.info('Facebook connector initialized');
      return true;
    } catch (error) {
      logger.error(`Facebook initialization error: ${error.message}`);
      return false;
    }
  }

  /**
   * Facebook Graph API 연결
   * @param {Object} credentials - 인증 정보 (accessToken 포함)
   * @returns {Promise<boolean>} 연결 성공 여부
   */
  async connect(credentials) {
    try {
      if (!credentials.accessToken) {
        throw new Error('Missing required access token');
      }

      this.accessToken = credentials.accessToken;

      // 토큰 유효성 및 사용자 정보 확인
      const response = await axios.get(`${this.baseUrl}/me`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name'
        }
      });

      if (!response.data || !response.data.id) {
        throw new Error('Invalid access token or user not found');
      }

      this.userId = response.data.id;
      this.userName = response.data.name;
      this.isConnected = true;

      logger.info(`Connected to Facebook as ${this.userName} (${this.userId})`);
      return true;
    } catch (error) {
      this.isConnected = false;
      logger.error(`Facebook connection error: ${error.message}`);
      return this.handleError(error);
    }
  }

  /**
   * Facebook 연결 해제
   * @returns {Promise<boolean>} 연결 해제 성공 여부
   */
  async disconnect() {
    try {
      this.accessToken = null;
      this.userId = null;
      this.userName = null;
      this.isConnected = false;
      logger.info('Facebook connection ended');
      return true;
    } catch (error) {
      logger.error(`Facebook disconnect error: ${error.message}`);
      return this.handleError(error);
    }
  }

  /**
   * 기본 포스트 게시
   * @param {Object} content - 게시할 콘텐츠
   * @param {Object} options - 게시 옵션
   * @returns {Promise<Object>} 게시 결과
   */
  async post(content, options = {}) {
    try {
      this._checkConnection();

      const { text, link, image } = content;
      const { targetId = this.userId } = options;

      if (!text && !link && !image) {
        throw new Error('Post must contain text, link, or image');
      }

      const endpoint = `${this.baseUrl}/${targetId}/feed`;
      const formData = {};

      // 텍스트 추가
      if (text) {
        formData.message = text;
      }

      // 링크 추가
      if (link) {
        formData.link = link;
      }

      // 이미지가 있는 경우 별도 처리
      if (image) {
        return await this._postWithImage(text, image, options);
      }

      // 포스트 게시
      const response = await axios.post(endpoint, null, {
        params: {
          ...formData,
          access_token: this.accessToken
        }
      });

      if (!response.data || !response.data.id) {
        throw new Error('Failed to create post');
      }

      const postId = response.data.id;
      logger.info(`Facebook post created with id: ${postId}`);

      return {
        success: true,
        post: {
          id: postId,
          text: text || ''
        },
        platform: this.platform,
        url: `https://facebook.com/${postId}`
      };
    } catch (error) {
      logger.error(`Error posting to Facebook: ${error.message}`);
      return this.handleError(error);
    }
  }

  /**
   * 이미지가 포함된 포스트 게시
   * @param {string} text - 게시글 텍스트
   * @param {Buffer|string} image - 이미지 데이터 또는 URL
   * @param {Object} options - 게시 옵션
   * @returns {Promise<Object>} 게시 결과
   * @private
   */
  async _postWithImage(text, image, options = {}) {
    try {
      this._checkConnection();

      const { targetId = this.userId } = options;
      let imageBuffer;

      // 이미지 데이터 가져오기
      if (typeof image === 'string' && image.startsWith('http')) {
        // URL에서 이미지 다운로드
        const response = await axios.get(image, { responseType: 'arraybuffer' });
        imageBuffer = Buffer.from(response.data, 'binary');
      } else if (Buffer.isBuffer(image)) {
        imageBuffer = image;
      } else {
        throw new Error('Invalid image data format');
      }

      // 이미지 최적화
      const optimizedImage = await sharp(imageBuffer)
        .resize(1200, 630, {
          fit: sharp.fit.inside,
          withoutEnlargement: true
        })
        .jpeg({ quality: 90 })
        .toBuffer();

      // 이미지 업로드
      const formData = new FormData();
      formData.append('source', optimizedImage, { filename: 'image.jpg', contentType: 'image/jpeg' });
      formData.append('access_token', this.accessToken);

      // 이미지 업로드 엔드포인트
      const photoEndpoint = `${this.baseUrl}/${targetId}/photos`;
      
      // 텍스트가 있으면 추가
      if (text) {
        formData.append('message', text);
      }

      const headers = {
        ...formData.getHeaders()
      };

      // 이미지 업로드 후 포스트 생성
      const response = await axios.post(photoEndpoint, formData, { headers });

      if (!response.data || !response.data.id) {
        throw new Error('Failed to upload photo');
      }

      const postId = response.data.post_id || response.data.id;
      logger.info(`Facebook photo post created with id: ${postId}`);

      return {
        success: true,
        post: {
          id: postId,
          text: text || '',
          photo_id: response.data.id
        },
        platform: this.platform,
        url: `https://facebook.com/${postId}`
      };
    } catch (error) {
      logger.error(`Error posting image to Facebook: ${error.message}`);
      return this.handleError(error);
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

      // 기본 텍스트 구성
      let postText = options.text || `Check out my NFT: ${nft.name || 'Nest NFT'}`;
      
      // 설명 추가
      if (nft.description) {
        postText += `\n\n${nft.description.substring(0, 200)}${nft.description.length > 200 ? '...' : ''}`;
      }
      
      // 해시태그 추가
      const hashtags = options.hashtags || ['NestNFT', 'Web3', 'CreataChain'];
      postText += `\n\n${hashtags.map(tag => `#${tag.replace(/^#/, '')}`).join(' ')}`;
      
      // NFT 링크가 있다면 추가
      if (nft.url) {
        postText += `\n\n${nft.url}`;
      }

      // 이미지와 함께 포스트 게시
      return await this._postWithImage(postText, nft.image, options);
    } catch (error) {
      logger.error(`Error sharing NFT on Facebook: ${error.message}`);
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

      // 기본 텍스트 구성
      let postText = options.text || `I earned a new badge: ${badge.name || 'Nest Badge'}`;
      
      // 설명 추가
      if (badge.description) {
        postText += `\n\n${badge.description.substring(0, 200)}${badge.description.length > 200 ? '...' : ''}`;
      }
      
      // 해시태그 추가
      const hashtags = options.hashtags || ['NestBadge', 'Achievement', 'CreataChain'];
      postText += `\n\n${hashtags.map(tag => `#${tag.replace(/^#/, '')}`).join(' ')}`;

      // 이미지와 함께 포스트 게시
      return await this._postWithImage(postText, badge.image, options);
    } catch (error) {
      logger.error(`Error sharing badge on Facebook: ${error.message}`);
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
      let postText = options.text || `I just completed: ${achievement.title}`;
      
      // 설명 추가
      if (achievement.description) {
        postText += `\n\n${achievement.description.substring(0, 200)}${achievement.description.length > 200 ? '...' : ''}`;
      }
      
      // XP 정보 추가
      if (achievement.xp) {
        postText += `\n\nEarned ${achievement.xp} XP`;
      }
      
      // 해시태그 추가
      const hashtags = options.hashtags || ['NestAchievement', 'CreataChain'];
      postText += `\n\n${hashtags.map(tag => `#${tag.replace(/^#/, '')}`).join(' ')}`;

      // 이미지가 있으면 이미지와 함께 게시, 없으면 텍스트만 게시
      if (achievement.image) {
        return await this._postWithImage(postText, achievement.image, options);
      } else {
        return await this.post({ text: postText }, options);
      }
    } catch (error) {
      logger.error(`Error sharing achievement on Facebook: ${error.message}`);
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
      
      // 기본 텍스트 구성
      let postText = options.text || `Check out my Nest profile: ${profileData.nestId}`;
      
      // 통계 정보 추가
      if (profileData.stats) {
        if (profileData.stats.level) {
          postText += `\n\nLevel: ${profileData.stats.level}`;
        }
        if (profileData.stats.xp) {
          postText += ` | XP: ${profileData.stats.xp}`;
        }
        if (profileData.stats.nfts) {
          postText += ` | NFTs: ${profileData.stats.nfts}`;
        }
      }
      
      // 해시태그 추가
      const hashtags = options.hashtags || ['NestProfile', 'CreataChain', 'Web3'];
      postText += `\n\n${hashtags.map(tag => `#${tag.replace(/^#/, '')}`).join(' ')}`;
      
      // 프로필 링크 추가
      if (profileData.url) {
        postText += `\n\n${profileData.url}`;
      }

      // 이미지와 함께 포스트 게시
      return await this._postWithImage(postText, profileCardImage, options);
    } catch (error) {
      logger.error(`Error sharing profile card on Facebook: ${error.message}`);
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
   * @param {string} postId - 게시물 ID
   * @returns {Promise<Object>} 반응 데이터
   */
  async getPostEngagement(postId) {
    try {
      this._checkConnection();

      // 게시물 정보 조회
      const response = await axios.get(`${this.baseUrl}/${postId}`, {
        params: {
          access_token: this.accessToken,
          fields: 'reactions.summary(true),comments.summary(true),shares'
        }
      });

      if (!response.data || !response.data.id) {
        throw new Error('Post not found');
      }

      // 반응 정보 추출
      const reactions = response.data.reactions?.summary?.total_count || 0;
      const comments = response.data.comments?.summary?.total_count || 0;
      const shares = response.data.shares?.count || 0;
      
      return {
        success: true,
        platform: this.platform,
        postId,
        engagements: {
          reactions,
          comments,
          shares
        }
      };
    } catch (error) {
      logger.error(`Error getting post engagement from Facebook: ${error.message}`);
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
      const response = await axios.get(`${this.baseUrl}/me`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name,picture.type(large),link,friends.summary(true)'
        }
      });

      if (!response.data || !response.data.id) {
        throw new Error('User not found');
      }

      return {
        success: true,
        platform: this.platform,
        profile: {
          id: response.data.id,
          name: response.data.name,
          profileImage: response.data.picture?.data?.url,
          link: response.data.link,
          friendCount: response.data.friends?.summary?.total_count
        }
      };
    } catch (error) {
      logger.error(`Error getting profile from Facebook: ${error.message}`);
      return this.handleError(error);
    }
  }

  /**
   * 연결 상태 확인
   * @throws {Error} 연결되지 않은 경우 에러
   * @private
   */
  _checkConnection() {
    if (!this.accessToken || !this.userId || !this.isConnected) {
      throw new Error('Not connected to Facebook API');
    }
  }

  /**
   * 에러 핸들링
   * @param {Error} error - 에러 객체
   * @returns {Object} 처리된 에러 정보
   */
  handleError(error) {
    // API 응답 에러인 경우
    if (error.response && error.response.data) {
      const { error: apiError } = error.response.data;
      
      if (apiError) {
        logger.error(`Facebook API Error [${apiError.code}]: ${apiError.message}`);
        
        return {
          success: false,
          platform: this.platform,
          error: apiError.message,
          code: apiError.code
        };
      }
    }
    
    // 기본 에러 처리
    logger.error(`Facebook Error: ${error.message}`);
    return {
      success: false,
      platform: this.platform,
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    };
  }
}

module.exports = FacebookConnector;
