/**
 * Integration API 테스트
 * 
 * 이 파일은 통합 관련 API 엔드포인트를 테스트합니다.
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

// 테스트 유틸리티
const { encryptData } = require('../../src/utils/encryption');

// 테스트 설정
chai.use(chaiHttp);
chai.should();
const expect = chai.expect;

describe('통합 API 테스트', function() {
  // 테스트 서버 및 데이터베이스 설정
  let mongoServer;
  let adminToken;
  let userToken;
  let testIntegration;
  let adminUser;
  let regularUser;

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
    testIntegration = new Integration({
      name: 'Test Integration',
      type: 'twitter',
      category: 'social',
      description: '테스트용 통합',
      enabled: true,
      config: {
        apiKey: encryptData('test_api_key'),
        apiSecret: encryptData('test_api_secret')
      },
      createdBy: adminUser._id
    });
    await testIntegration.save();
  });
  
  // 테스트 후 정리
  after(async function() {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  
  // 각 테스트 전 데이터베이스 초기화
  beforeEach(async function() {
    // 여기서 필요한 경우 추가 설정
  });
  
  // 각 테스트 후 정리
  afterEach(function() {
    sinon.restore();
  });
  
  // GET /api/admin/integrations 테스트
  describe('GET /api/admin/integrations', function() {
    it('관리자는 모든 통합 목록을 가져올 수 있어야 함', function(done) {
      chai.request(server)
        .get('/api/admin/integrations')
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body.success).to.be.true;
          expect(res.body.data).to.be.an('array');
          expect(res.body.data.length).to.be.at.least(1);
          
          // 민감한 데이터가 마스킹되었는지 확인
          const integration = res.body.data.find(i => i.name === 'Test Integration');
          expect(integration).to.exist;
          expect(integration.config.apiKey).to.equal('••••••••');
          expect(integration.config.apiSecret).to.equal('••••••••');
          
          done();
        });
    });
    
    it('일반 사용자는 통합 목록에 접근할 수 없어야 함', function(done) {
      chai.request(server)
        .get('/api/admin/integrations')
        .set('Authorization', `Bearer ${userToken}`)
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.body).to.be.an('object');
          expect(res.body.success).to.be.false;
          
          done();
        });
    });
    
    it('인증되지 않은 요청은 거부되어야 함', function(done) {
      chai.request(server)
        .get('/api/admin/integrations')
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.be.an('object');
          expect(res.body.success).to.be.false;
          
          done();
        });
    });
    
    it('카테고리로 필터링된 통합 목록을 반환해야 함', function(done) {
      chai.request(server)
        .get('/api/admin/integrations?category=social')
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body.success).to.be.true;
          expect(res.body.data).to.be.an('array');
          
          // 모든 결과가 social 카테고리인지 확인
          res.body.data.forEach(integration => {
            expect(integration.category).to.equal('social');
          });
          
          done();
        });
    });
  });
  
  // GET /api/admin/integrations/:id 테스트
  describe('GET /api/admin/integrations/:id', function() {
    it('관리자는 특정 통합의 상세 정보를 볼 수 있어야 함', function(done) {
      chai.request(server)
        .get(`/api/admin/integrations/${testIntegration._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body.success).to.be.true;
          expect(res.body.data).to.be.an('object');
          expect(res.body.data.name).to.equal('Test Integration');
          
          // 민감한 데이터가 마스킹되었는지 확인
          expect(res.body.data.config.apiKey).to.equal('••••••••');
          expect(res.body.data.config.apiSecret).to.equal('••••••••');
          
          done();
        });
    });
    
    it('존재하지 않는 통합 ID로 요청하면 404를 반환해야 함', function(done) {
      const nonExistentId = mongoose.Types.ObjectId();
      
      chai.request(server)
        .get(`/api/admin/integrations/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.be.an('object');
          expect(res.body.success).to.be.false;
          
          done();
        });
    });
  });
  
  // POST /api/admin/integrations 테스트
  describe('POST /api/admin/integrations', function() {
    it('관리자는 새 통합을 생성할 수 있어야 함', function(done) {
      const newIntegration = {
        name: 'New Integration',
        type: 'facebook',
        category: 'social',
        description: '새로운 테스트 통합',
        enabled: false,
        config: {
          appId: 'test_app_id',
          appSecret: 'test_app_secret'
        }
      };
      
      chai.request(server)
        .post('/api/admin/integrations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newIntegration)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.be.an('object');
          expect(res.body.success).to.be.true;
          expect(res.body.data).to.be.an('object');
          expect(res.body.data.name).to.equal('New Integration');
          expect(res.body.data.type).to.equal('facebook');
          
          // ID가 할당되었는지 확인
          expect(res.body.data._id).to.exist;
          
          // 민감한 데이터가 마스킹되었는지 확인
          expect(res.body.data.config.appSecret).to.equal('••••••••');
          
          done();
        });
    });
    
    it('같은 이름의 통합이 이미 있으면 400을 반환해야 함', function(done) {
      const duplicateIntegration = {
        name: 'Test Integration', // 이미 존재하는 이름
        type: 'facebook',
        category: 'social',
        description: '중복 이름 테스트',
        enabled: false,
        config: {
          appId: 'test_app_id',
          appSecret: 'test_app_secret'
        }
      };
      
      chai.request(server)
        .post('/api/admin/integrations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateIntegration)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.be.an('object');
          expect(res.body.success).to.be.false;
          expect(res.body.message).to.include('already exists');
          
          done();
        });
    });
  });
  
  // PUT /api/admin/integrations/:id 테스트
  describe('PUT /api/admin/integrations/:id', function() {
    it('관리자는 기존 통합을 업데이트할 수 있어야 함', function(done) {
      const updates = {
        name: 'Updated Integration',
        description: '업데이트된 테스트 통합',
        enabled: false
      };
      
      chai.request(server)
        .put(`/api/admin/integrations/${testIntegration._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body.success).to.be.true;
          expect(res.body.data).to.be.an('object');
          expect(res.body.data.name).to.equal('Updated Integration');
          expect(res.body.data.description).to.equal('업데이트된 테스트 통합');
          expect(res.body.data.enabled).to.be.false;
          
          // 기존 설정이 유지되는지 확인
          expect(res.body.data.type).to.equal('twitter');
          
          done();
        });
    });
    
    it('민감한 구성 값을 업데이트할 수 있어야 함', function(done) {
      const updates = {
        config: {
          apiKey: 'new_api_key',
          apiSecret: 'new_api_secret'
        }
      };
      
      chai.request(server)
        .put(`/api/admin/integrations/${testIntegration._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body.success).to.be.true;
          expect(res.body.data).to.be.an('object');
          
          // 민감한 데이터가 마스킹되었는지 확인
          expect(res.body.data.config.apiKey).to.equal('••••••••');
          expect(res.body.data.config.apiSecret).to.equal('••••••••');
          
          done();
        });
    });
    
    it('존재하지 않는 통합 ID로 업데이트 요청하면 404를 반환해야 함', function(done) {
      const nonExistentId = mongoose.Types.ObjectId();
      
      chai.request(server)
        .put(`/api/admin/integrations/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name' })
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.be.an('object');
          expect(res.body.success).to.be.false;
          
          done();
        });
    });
  });
  
  // DELETE /api/admin/integrations/:id 테스트
  describe('DELETE /api/admin/integrations/:id', function() {
    it('관리자는 통합을 삭제할 수 있어야 함', function(done) {
      // 먼저 삭제할 새 통합 생성
      const tempIntegration = new Integration({
        name: 'Temp Integration',
        type: 'twitter',
        category: 'social',
        description: '삭제용 임시 통합',
        enabled: true,
        createdBy: adminUser._id
      });
      
      tempIntegration.save()
        .then(savedIntegration => {
          chai.request(server)
            .delete(`/api/admin/integrations/${savedIntegration._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body).to.be.an('object');
              expect(res.body.success).to.be.true;
              
              // 실제로 삭제되었는지 확인
              Integration.findById(savedIntegration._id)
                .then(result => {
                  expect(result).to.be.null;
                  done();
                })
                .catch(done);
            });
        })
        .catch(done);
    });
    
    it('존재하지 않는 통합 ID로 삭제 요청하면 404를 반환해야 함', function(done) {
      const nonExistentId = mongoose.Types.ObjectId();
      
      chai.request(server)
        .delete(`/api/admin/integrations/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.be.an('object');
          expect(res.body.success).to.be.false;
          
          done();
        });
    });
  });
  
  // POST /api/admin/integrations/:id/test 테스트
  describe('POST /api/admin/integrations/:id/test', function() {
    it('활성화된 통합을 테스트할 수 있어야 함', function(done) {
      // checkHealth 메서드를 스텁하여 항상 성공 반환
      const checkHealthStub = sinon.stub(Integration.prototype, 'checkHealth').resolves({
        status: 'healthy',
        message: '연결이 정상적으로 작동합니다.'
      });
      
      chai.request(server)
        .post(`/api/admin/integrations/${testIntegration._id}/test`)
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body.success).to.be.true;
          expect(res.body.data).to.be.an('object');
          expect(res.body.data.success).to.be.true;
          expect(res.body.data.status).to.equal('healthy');
          
          // 스텁이 호출되었는지 확인
          expect(checkHealthStub.calledOnce).to.be.true;
          
          done();
        });
    });
    
    it('비활성화된 통합을 테스트하면 400을 반환해야 함', function(done) {
      // 테스트 통합을 비활성화
      Integration.findByIdAndUpdate(testIntegration._id, { enabled: false }, { new: true })
        .then(() => {
          chai.request(server)
            .post(`/api/admin/integrations/${testIntegration._id}/test`)
            .set('Authorization', `Bearer ${adminToken}`)
            .end((err, res) => {
              expect(res).to.have.status(400);
              expect(res.body).to.be.an('object');
              expect(res.body.success).to.be.false;
              expect(res.body.message).to.include('not enabled');
              
              // 테스트 후 다시 활성화
              Integration.findByIdAndUpdate(testIntegration._id, { enabled: true })
                .then(() => done())
                .catch(done);
            });
        })
        .catch(done);
    });
  });
  
  // GET /api/admin/integrations/types 테스트
  describe('GET /api/admin/integrations/types', function() {
    it('사용 가능한 통합 유형 목록을 반환해야 함', function(done) {
      chai.request(server)
        .get('/api/admin/integrations/types')
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body.success).to.be.true;
          expect(res.body.data).to.be.an('array');
          expect(res.body.data.length).to.be.at.least(1);
          
          // 각 유형이 필요한 필드를 가지고 있는지 확인
          res.body.data.forEach(type => {
            expect(type).to.have.property('id');
            expect(type).to.have.property('name');
            expect(type).to.have.property('description');
            expect(type).to.have.property('configFields').that.is.an('array');
          });
          
          done();
        });
    });
  });
  
  // POST /api/admin/integrations/:id/sync 테스트
  describe('POST /api/admin/integrations/:id/sync', function() {
    it('활성화된 통합을 동기화할 수 있어야 함', function(done) {
      chai.request(server)
        .post(`/api/admin/integrations/${testIntegration._id}/sync`)
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body.success).to.be.true;
          expect(res.body.data).to.be.an('object');
          expect(res.body.data.success).to.be.true;
          expect(res.body.data.lastSynced).to.exist;
          
          done();
        });
    });
    
    it('비활성화된 통합을 동기화하면 400을 반환해야 함', function(done) {
      // 테스트 통합을 비활성화
      Integration.findByIdAndUpdate(testIntegration._id, { enabled: false }, { new: true })
        .then(() => {
          chai.request(server)
            .post(`/api/admin/integrations/${testIntegration._id}/sync`)
            .set('Authorization', `Bearer ${adminToken}`)
            .end((err, res) => {
              expect(res).to.have.status(400);
              expect(res.body).to.be.an('object');
              expect(res.body.success).to.be.false;
              expect(res.body.message).to.include('not enabled');
              
              // 테스트 후 다시 활성화
              Integration.findByIdAndUpdate(testIntegration._id, { enabled: true })
                .then(() => done())
                .catch(done);
            });
        })
        .catch(done);
    });
  });
  
  // OAuth 관련 테스트
  describe('OAuth 관련 API', function() {
    it('OAuth URL을 가져올 수 있어야 함', function(done) {
      chai.request(server)
        .get('/api/admin/integrations/oauth/twitter')
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body.success).to.be.true;
          expect(res.body.data).to.be.an('object');
          expect(res.body.data.url).to.be.a('string').that.includes('oauth/authorize');
          
          done();
        });
    });
    
    it('OAuth 콜백을 처리할 수 있어야 함', function(done) {
      chai.request(server)
        .post('/api/admin/integrations/oauth/twitter/callback')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: 'test_auth_code' })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body.success).to.be.true;
          expect(res.body.data).to.be.an('object');
          expect(res.body.data.success).to.be.true;
          
          done();
        });
    });
    
    it('OAuth 인증 코드 없이 콜백을 호출하면 400을 반환해야 함', function(done) {
      chai.request(server)
        .post('/api/admin/integrations/oauth/twitter/callback')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({}) // 코드 없음
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.be.an('object');
          expect(res.body.success).to.be.false;
          expect(res.body.message).to.include('code is required');
          
          done();
        });
    });
    
    it('OAuth 액세스를 취소할 수 있어야 함', function(done) {
      // 먼저 OAuth 연결 설정
      Integration.findByIdAndUpdate(
        testIntegration._id,
        { 
          oauthConnected: true,
          oauthTokens: {
            accessToken: encryptData('mock_access_token'),
            refreshToken: encryptData('mock_refresh_token'),
            expiresAt: new Date(Date.now() + 3600000)
          }
        },
        { new: true }
      )
        .then(() => {
          chai.request(server)
            .post(`/api/admin/integrations/${testIntegration._id}/revoke`)
            .set('Authorization', `Bearer ${adminToken}`)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body).to.be.an('object');
              expect(res.body.success).to.be.true;
              expect(res.body.data).to.be.an('object');
              expect(res.body.data.success).to.be.true;
              
              // 실제로 취소되었는지 확인
              Integration.findById(testIntegration._id)
                .then(integration => {
                  expect(integration.oauthConnected).to.be.false;
                  expect(integration.oauthTokens.accessToken).to.be.null;
                  done();
                })
                .catch(done);
            });
        })
        .catch(done);
    });
  });
});
