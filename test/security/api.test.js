/**
 * API 보안 테스트
 * 
 * API 엔드포인트의 보안 취약점을 테스트합니다.
 * OWASP Top 10 취약점 및 기타 보안 위험에 대한 테스트를 포함합니다.
 */

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../src/server');
const expect = chai.expect;

// JWT 토큰 조작을 위한 라이브러리
const jwt = require('jsonwebtoken');

chai.use(chaiHttp);

describe('API 보안 테스트', () => {
  // 테스트용 계정 정보
  let normalUser;
  let adminUser;
  let normalUserToken;
  let adminUserToken;
  let expiredToken;

  before(async () => {
    // 테스트용 사용자 생성 및 토큰 발급
    // 실제 구현 시 테스트 DB를 사용하여 테스트 사용자 생성 필요
    normalUserToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
    adminUserToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
    expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
  });

  describe('인증 및 권한 테스트', () => {
    it('인증이 필요한 API에 토큰 없이 접근 시 401 에러가 발생해야 함', (done) => {
      chai.request(app)
        .get('/api/user-missions/my-created')
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });

    it('만료된 토큰으로 접근 시 401 에러가 발생해야 함', (done) => {
      chai.request(app)
        .get('/api/user-missions/my-created')
        .set('Authorization', `Bearer ${expiredToken}`)
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });

    it('조작된 토큰으로 접근 시 401 에러가 발생해야 함', (done) => {
      // 유효한 토큰 구조를 유지하되 페이로드 변경
      const tamperedPayload = {
        id: 'fake_user_id',
        roles: ['admin'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60)
      };
      
      // 다른 시크릿으로 서명하여 조작된 토큰 생성
      const tamperedToken = jwt.sign(tamperedPayload, 'fake_secret');
      
      chai.request(app)
        .get('/api/user-missions/my-created')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });

    it('권한이 없는 API에 접근 시 403 에러가 발생해야 함', (done) => {
      chai.request(app)
        .get('/api/reputation/stats')
        .set('Authorization', `Bearer ${normalUserToken}`)
        .end((err, res) => {
          expect(res).to.have.status(403);
          done();
        });
    });

    it('적절한 권한으로 API 접근 시 성공해야 함', (done) => {
      chai.request(app)
        .get('/api/reputation/stats')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
    });
  });

  describe('입력 검증 테스트', () => {
    it('SQL 인젝션 시도에 대해 방어해야 함', (done) => {
      const sqlInjectionPayload = {
        username: "' OR 1=1 --",
        password: "password"
      };
      
      chai.request(app)
        .post('/api/auth/login')
        .send(sqlInjectionPayload)
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });

    it('XSS 공격 시도에 대해 방어해야 함', (done) => {
      const xssPayload = {
        content: "<script>alert('XSS')</script>악성 스크립트"
      };
      
      chai.request(app)
        .post('/api/user-missions/1234/comments')
        .set('Authorization', `Bearer ${normalUserToken}`)
        .send(xssPayload)
        .end((err, res) => {
          // 응답에 스크립트 태그가 이스케이프 처리되어 있어야 함
          expect(res.body.comment.content).to.not.include('<script>');
          done();
        });
    });

    it('매개변수 오염 공격에 대해 방어해야 함', (done) => {
      chai.request(app)
        .get('/api/users?role=user&role=admin')
        .set('Authorization', `Bearer ${normalUserToken}`)
        .end((err, res) => {
          expect(res).to.have.status(403);
          done();
        });
    });

    it('대량 파라미터 전송에 대해 방어해야 함', (done) => {
      // 너무 큰 요청 페이로드 생성
      const largePayload = {
        data: 'a'.repeat(11 * 1024 * 1024) // 11MB
      };
      
      chai.request(app)
        .post('/api/user-missions')
        .set('Authorization', `Bearer ${normalUserToken}`)
        .send(largePayload)
        .end((err, res) => {
          expect(res).to.have.status(413);
          done();
        });
    });
  });

  describe('속도 제한 테스트', () => {
    it('짧은 시간 내에 많은 요청을 보낼 경우 속도 제한이 적용되어야 함', (done) => {
      // 연속으로 여러 요청 전송
      const requests = [];
      for (let i = 0; i < 100; i++) {
        requests.push(
          chai.request(app)
            .get('/api/missions')
            .set('Authorization', `Bearer ${normalUserToken}`)
        );
      }
      
      // 마지막 요청 확인
      Promise.all(requests).then(responses => {
        const lastResponse = responses[responses.length - 1];
        expect(lastResponse).to.have.status(429);
        done();
      }).catch(done);
    });
  });

  describe('민감 정보 노출 테스트', () => {
    it('사용자 정보 응답에 암호 해시가 포함되어서는 안 됨', (done) => {
      chai.request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${normalUserToken}`)
        .end((err, res) => {
          expect(res.body).to.not.have.property('passwordHash');
          expect(res.body).to.not.have.property('password');
          done();
        });
    });

    it('오류 응답에 내부 기술 정보가 노출되어서는 안 됨', (done) => {
      chai.request(app)
        .get('/api/non-existent-endpoint')
        .set('Authorization', `Bearer ${normalUserToken}`)
        .end((err, res) => {
          expect(res.body).to.not.have.property('stack');
          expect(res.body.message).to.not.include('at ');
          done();
        });
    });
  });

  describe('보안 헤더 테스트', () => {
    it('적절한 보안 헤더가 설정되어 있어야 함', (done) => {
      chai.request(app)
        .get('/')
        .end((err, res) => {
          expect(res.headers).to.have.property('x-content-type-options', 'nosniff');
          expect(res.headers).to.have.property('x-frame-options', 'SAMEORIGIN');
          expect(res.headers).to.have.property('strict-transport-security');
          expect(res.headers).to.have.property('x-xss-protection');
          expect(res.headers).to.have.property('content-security-policy');
          done();
        });
    });
  });

  describe('CSRF 방어 테스트', () => {
    it('상태 변경 요청에 CSRF 토큰 검증이 이루어져야 함', (done) => {
      chai.request(app)
        .post('/api/user-missions')
        .set('Authorization', `Bearer ${normalUserToken}`)
        .set('Origin', 'https://malicious-site.com')
        .send({ title: '테스트 미션' })
        .end((err, res) => {
          expect(res).to.have.status(403);
          done();
        });
    });
  });
});
