/**
 * SNS 커넥터 인터페이스
 * 모든 SNS 연동 서비스의 기본 인터페이스로, 각 플랫폼 구현체는 이 인터페이스를 따라야 함
 */
class SNSConnectorInterface {
  /**
   * 생성자
   * @param {Object} config - 연결 구성 정보
   */
  constructor(config) {
    if (new.target === SNSConnectorInterface) {
      throw new Error('Cannot instantiate abstract class');
    }
    
    this.config = config;
    this.isConnected = false;
  }

  /**
   * 연결 초기화
   * @returns {Promise<boolean>} 연결 성공 여부
   */
  async initialize() {
    throw new Error('Method not implemented');
  }

  /**
   * SNS 플랫폼 연결
   * @param {Object} credentials - 인증 정보
   * @returns {Promise<boolean>} 연결 성공 여부
   */
  async connect(credentials) {
    throw new Error('Method not implemented');
  }

  /**
   * SNS 플랫폼 연결 해제
   * @returns {Promise<boolean>} 연결 해제 성공 여부
   */
  async disconnect() {
    throw new Error('Method not implemented');
  }

  /**
   * 연결 상태 확인
   * @returns {boolean} 연결 상태
   */
  isConnected() {
    return this.isConnected;
  }

  /**
   * 콘텐츠 게시
   * @param {Object} content - 게시할 콘텐츠 (텍스트, 이미지 등)
   * @param {Object} options - 게시 옵션
   * @returns {Promise<Object>} 게시 결과
   */
  async post(content, options) {
    throw new Error('Method not implemented');
  }

  /**
   * NFT 공유
   * @param {Object} nft - 공유할 NFT 데이터
   * @param {Object} options - 공유 옵션
   * @returns {Promise<Object>} 공유 결과
   */
  async shareNFT(nft, options) {
    throw new Error('Method not implemented');
  }

  /**
   * 뱃지 공유
   * @param {Object} badge - 공유할 뱃지 데이터
   * @param {Object} options - 공유 옵션
   * @returns {Promise<Object>} 공유 결과
   */
  async shareBadge(badge, options) {
    throw new Error('Method not implemented');
  }

  /**
   * 활동 성과 공유
   * @param {Object} achievement - 공유할 활동 성과 데이터
   * @param {Object} options - 공유 옵션
   * @returns {Promise<Object>} 공유 결과
   */
  async shareAchievement(achievement, options) {
    throw new Error('Method not implemented');
  }

  /**
   * 프로필 카드 생성 및 공유
   * @param {Object} profileData - 프로필 데이터
   * @param {Object} options - 공유 옵션
   * @returns {Promise<Object>} 공유 결과
   */
  async shareProfileCard(profileData, options) {
    throw new Error('Method not implemented');
  }

  /**
   * 게시물 반응 조회
   * @param {string} postId - 게시물 ID
   * @returns {Promise<Object>} 반응 데이터
   */
  async getPostEngagement(postId) {
    throw new Error('Method not implemented');
  }

  /**
   * 프로필 정보 가져오기
   * @returns {Promise<Object>} 프로필 정보
   */
  async getProfile() {
    throw new Error('Method not implemented');
  }

  /**
   * 에러 핸들링
   * @param {Error} error - 에러 객체
   * @returns {Object} 처리된 에러 정보
   */
  handleError(error) {
    console.error(`SNS Connector Error: ${error.message}`);
    return {
      success: false,
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    };
  }
}

module.exports = SNSConnectorInterface;
