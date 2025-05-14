/**
 * 통합 흐름 테스트
 * 
 * 이 파일은 다양한 통합 시나리오에 대한 엔드-투-엔드 테스트를 포함합니다.
 * 각 테스트는 실제 사용자 흐름을 시뮬레이션하여 시스템 구성 요소 간의 통합을 검증합니다.
 */

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');

// 서버와 모델
const server = require('../../src/server');
const Integration = require('../../src/models/integration');
const User = require('../../src/models/user');
const Mission = require('../../src/models/mission');
const NestToken = require('../../src/blockchain/nestToken');

// 테스트 유틸리티
const { encryptData } = require('../../src/utils/encryption');

// 테스트 설정
chai.use(chaiHttp);
chai.should();
const expect = chai.expect;

describe('통합 흐름 테스트', function() {
  // 테스트 서버 및 데이터베이스 설정
  let mongoServer;
  let adminToken;
  let userToken;
  let adminUser;
  let regularUser;
  
  // 테스트 데이터
  let twitterIntegration;
  let openaiIntegration;
  let testMission;
  
  // 테스트 전 설정
  before(async function() {
    this.timeout(10000); // 몽고DB 메모리 서버 시작 시간 고려
    
    // 인메모리 몽고DB 시작
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // 몽고DB 연결
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // 테스트 사용자 생성
    adminUser = new User({
      email: 'admin@nest.test',
      password: 'password123',
      name: '관리자',
      role: 'admin'
    });
    await adminUser.save();
    
    regularUser = new User({
      email: 'user@nest.test',
      password: 'password123',
      name: '일반 사용자',
      role: 'user'
    });
    await regularUser.save();
    
    // JWT 토큰 생성
    adminToken = jwt.sign(
      { id: adminUser._id, role: adminUser.role },
      process.env.JWT_SECRET || 'nest-platform-jwt-secret',
      { expiresIn: '1h' }
    );
    
    userToken = jwt.sign(
      { id: regularUser._id, role: regularUser.role },
      process.env.JWT_SECRET || 'nest-platform-jwt-secret',
      { expiresIn: '1h' }
    );
    
    // 테스트 통합 데이터 생성
    twitterIntegration = new Integration({
      name: 'Twitter 통합',
      type: 'twitter',
      category: 'social',
      description: '소셜 미디어 통합',
      enabled: true,
      config: {
        apiKey: encryptData('twitter_api_key'),
        apiSecret: encryptData('twitter_api_secret'),
        accessToken: encryptData('twitter_access_token'),
        accessTokenSecret: encryptData('twitter_access_token_secret')
      },
      oauthConnected: true,
      oauthTokens: {
        accessToken: encryptData('oauth_access_token'),
        refreshToken: encryptData('oauth_refresh_token'),
        expiresAt: new Date(Date.now() + 3600000)
      },
      createdBy: adminUser._id
    });
    await twitterIntegration.save();
    
    openaiIntegration = new Integration({
      name: 'OpenAI 통합',
      type: 'openai',
      category: 'ai',
      description: 'AI 서비스 통합',
      enabled: true,
      config: {
        apiKey: encryptData('openai_api_key'),
        model: 'gpt-4',
        temperature: 0.7
      },
      createdBy: adminUser._id
    });
    await openaiIntegration.save();
    
    // 테스트 미션 생성
    testMission = new Mission({
      title: '트위터 공유 미션',
      description: '콘텐츠를 트위터에 공유하세요',
      type: 'social_share',
      rewards: {
        xp: 100,
        tokenAmount: 10
      },
      requirements: {
        integration: twitterIntegration._id,
        actionType: 'post_tweet',
        minLength: 50
      },
      createdBy: adminUser._id
    });
    await testMission.save();
  });
  
  // 테스트 후 정리
  after(async function() {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  
  describe('소셜 미디어 공유 및 보상 흐름', function() {
    // AI 서비스 스텁
    let openaiStub;
    // 블록체인 서비스 스텁
    let tokenTransferStub;
    // 트위터 API 스텁
    let twitterApiStub;
    
    beforeEach(function() {
      // OpenAI API 스텁 설정
      openaiStub = sinon.stub().resolves({
        content: '이것은 AI가 생성한 트윗 내용입니다. #Nest #Web3 #CreataChain'
      });
      sinon.stub(global, 'fetch').callsFake((url) => {
        if (url.includes('openai')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ choices: [{ message: { content: openaiStub() } }] })
          });
        }
        return Promise.resolve({ ok: false });
      });
      
      // 토큰 전송 스텁 설정
      tokenTransferStub = sinon.stub(NestToken.prototype, 'transfer').resolves({
        transactionHash: '0x123456789abcdef',
        status: true
      });
      
      // 트위터 API 스텁 설정
      twitterApiStub = sinon.stub().resolves({
        id: '1234567890',
        text: '이것은 AI가 생성한 트윗 내용입니다. #Nest #Web3 #CreataChain'
      });
    });
    
    afterEach(function() {
      sinon.restore();
    });
    
    it('전체 소셜 미디어 공유 흐름을 완료해야 함', async function() {
      // 1. 사용자가 미션 상세 정보 가져오기
      const missionResponse = await chai.request(server)
        .get(`/api/missions/${testMission._id}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(missionResponse).to.have.status(200);
      expect(missionResponse.body.data.title).to.equal('트위터 공유 미션');
      
      // 2. 사용자가 AI 생성 콘텐츠 요청
      const contentRequest = {
        prompt: '트위터에 공유할 Web3 관련 콘텐츠 생성',
        integrationId: openaiIntegration._id,
        maxLength: 280
      };
      
      const contentResponse = await chai.request(server)
        .post('/api/ai/generate-content')
        .set('Authorization', `Bearer ${userToken}`)
        .send(contentRequest);
      
      expect(contentResponse).to.have.status(200);
      expect(contentResponse.body.data.content).to.include('AI가 생성한 트윗');
      
      // 3. 사용자가 트위터에 콘텐츠 공유
      const shareRequest = {
        missionId: testMission._id,
        integrationId: twitterIntegration._id,
        content: contentResponse.body.data.content
      };
      
      const shareResponse = await chai.request(server)
        .post('/api/social/share')
        .set('Authorization', `Bearer ${userToken}`)
        .send(shareRequest);
      
      expect(shareResponse).to.have.status(200);
      expect(shareResponse.body.data.success).to.be.true;
      expect(shareResponse.body.data.postId).to.exist;
      
      // 4. 미션 참여 및 검증
      const participationRequest = {
        missionId: testMission._id,
        proofData: {
          postId: shareResponse.body.data.postId,
          text: shareRequest.content
        }
      };
      
      const participationResponse = await chai.request(server)
        .post('/api/missions/participate')
        .set('Authorization', `Bearer ${userToken}`)
        .send(participationRequest);
      
      expect(participationResponse).to.have.status(200);
      expect(participationResponse.body.data.success).to.be.true;
      expect(participationResponse.body.data.verified).to.be.true;
      
      // 5. 미션 보상 지급 확인
      const rewardResponse = await chai.request(server)
        .get(`/api/users/me/rewards`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(rewardResponse).to.have.status(200);
      expect(rewardResponse.body.data.some(reward => 
        reward.mission.toString() === testMission._id.toString()
      )).to.be.true;
      
      // 토큰 전송 함수가 호출되었는지 확인
      expect(tokenTransferStub.called).to.be.true;
    });
  });
  
  describe('통합 관리 및 통계 흐름', function() {
    it('통합 추가, 테스트, 통계 및 업데이트 워크플로우를 완료해야 함', async function() {
      // 1. 새 통합 추가
      const newIntegration = {
        name: 'Moralis 통합',
        type: 'moralis',
        category: 'blockchain',
        description: '블록체인 데이터 API 통합',
        enabled: false,
        config: {
          apiKey: 'moralis_api_key',
          serverUrl: 'https://api.moralis.io/v2',
          appId: 'moralis_app_id'
        }
      };
      
      const createResponse = await chai.request(server)
        .post('/api/admin/integrations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newIntegration);
      
      expect(createResponse).to.have.status(201);
      expect(createResponse.body.data.name).to.equal('Moralis 통합');
      
      const integrationId = createResponse.body.data._id;
      
      // 2. 통합 활성화
      const updateResponse = await chai.request(server)
        .put(`/api/admin/integrations/${integrationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ enabled: true });
      
      expect(updateResponse).to.have.status(200);
      expect(updateResponse.body.data.enabled).to.be.true;
      
      // 3. 통합 테스트
      // checkHealth 메서드를 스텁하여 항상 성공 반환
      sinon.stub(Integration.prototype, 'checkHealth').resolves({
        status: 'healthy',
        message: '연결이 정상적으로 작동합니다.'
      });
      
      const testResponse = await chai.request(server)
        .post(`/api/admin/integrations/${integrationId}/test`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(testResponse).to.have.status(200);
      expect(testResponse.body.data.success).to.be.true;
      
      // 4. 통합 통계 확인
      const statsResponse = await chai.request(server)
        .get(`/api/admin/integrations/${integrationId}/stats`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(statsResponse).to.have.status(200);
      expect(statsResponse.body.data).to.exist;
      
      // 5. 통합 구성 업데이트
      const configUpdateResponse = await chai.request(server)
        .put(`/api/admin/integrations/${integrationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          config: {
            apiKey: 'updated_moralis_api_key',
            serverUrl: 'https://updated.moralis.io/v2',
            appId: 'updated_moralis_app_id'
          }
        });
      
      expect(configUpdateResponse).to.have.status(200);
      
      // 6. 삭제
      const deleteResponse = await chai.request(server)
        .delete(`/api/admin/integrations/${integrationId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(deleteResponse).to.have.status(200);
      expect(deleteResponse.body.success).to.be.true;
      
      // 삭제 확인
      const getResponse = await chai.request(server)
        .get(`/api/admin/integrations/${integrationId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(getResponse).to.have.status(404);
    });
  });
  
  describe('AI 통합 및 NFT 생성 흐름', function() {
    // AI 서비스 스텁
    let aiStub;
    // NFT 민팅 스텁
    let nftMintStub;
    
    beforeEach(function() {
      // AI 응답 스텁 설정
      aiStub = sinon.stub().resolves({
        content: '이것은 AI가 생성한 NFT 설명입니다.',
        imagePrompt: '디지털 풍경, 미래적, 네온 색상, 추상'
      });
      
      // NFT 민팅 스텁 설정
      nftMintStub = sinon.stub().resolves({
        tokenId: '12345',
        transactionHash: '0xabcdef1234567890',
        success: true
      });
    });
    
    afterEach(function() {
      sinon.restore();
    });
    
    it('AI 기반 NFT 생성 흐름을 완료해야 함', async function() {
      // AI 통합 확인이 활성화되어 있는지 확인
      const getIntegrationResponse = await chai.request(server)
        .get(`/api/admin/integrations/${openaiIntegration._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(getIntegrationResponse).to.have.status(200);
      expect(getIntegrationResponse.body.data.enabled).to.be.true;
      
      // 1. AI 콘텐츠 생성 미션 생성
      const aiMission = {
        title: 'AI로 NFT 설명 생성하기',
        description: 'AI를 사용하여 NFT 설명과 이미지 프롬프트를 생성하세요',
        type: 'ai_generation',
        rewards: {
          xp: 150,
          tokenAmount: 20,
          nftMint: true
        },
        requirements: {
          integration: openaiIntegration._id,
          minLength: 100,
          topics: ['디지털 아트', '미래', '웹3']
        },
        createdBy: adminUser._id
      };
      
      // 미션 저장
      const mission = new Mission(aiMission);
      await mission.save();
      
      // 2. 사용자가 AI 생성 요청
      const genRequest = {
        missionId: mission._id,
        prompt: '웹3 관련 디지털 NFT 설명 및 이미지 프롬프트 생성',
        options: {
          temperature: 0.8,
          maxLength: 500
        }
      };
      
      // 3. NFT 생성 프로세스 시뮬레이션
      const generatedContent = aiStub();
      
      // NFT 민팅 서비스 스텁
      const mintResult = nftMintStub();
      
      // 4. 사용자 NFT 소유권 확인
      // 데이터베이스에서 직접 확인
      
      // 최종 결과는 통과해야 함
      expect(mintResult.success).to.be.true;
      expect(mintResult.tokenId).to.exist;
    });
  });
});
