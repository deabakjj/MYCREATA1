/**
 * Relay API 테스트
 * 
 * 외부 DApp과 Nest 플랫폼 간의 연결 및 트랜잭션을 관리하는 API 엔드포인트를 테스트합니다.
 */

const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const mongoose = require('mongoose');
const { expect } = chai;

const app = require('../../src/server');
const User = require('../../src/models/user');
const NestId = require('../../src/models/nestId');
const Wallet = require('../../src/models/wallet');
const RelayConnection = require('../../src/models/relay/relayConnection');
const RelayTransaction = require('../../src/models/relay/relayTransaction');
const config = require('../../src/config');

// Chai HTTP 설정
chai.use(chaiHttp);

describe('Relay API', () => {
  let testUser;
  let testNestId;
  let testWallet;
  let testToken;
  let testConnection;
  let testTransaction;

  // 테스트 데이터 생성
  before(async () => {
    // 테스트 데이터베이스 연결 확인
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('테스트는 테스트 환경에서만 실행할 수 있습니다.');
    }

    // 테스트 사용자 생성
    testUser = await User.create({
      name: '테스트 사용자',
      email: 'test@example.com',
      password: 'password123',
      profileImage: 'https://example.com/profile.jpg'
    });

    // 테스트 Nest ID 생성
    testNestId = await NestId.create({
      name: 'test',
      domain: 'test.nest',
      owner: testUser._id
    });

    // 테스트 지갑 생성
    testWallet = await Wallet.create({
      address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', // 테스트용 개인키
      balance: 100,
      user: testUser._id
    });

    // 테스트 토큰 생성 (JWT)
    testToken = 'Bearer ' + require('jsonwebtoken').sign(
      { id: testUser._id, email: testUser.email },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    // 테스트 연결 생성
    testConnection = await RelayConnection.create({
      connectionKey: 'test-connection-key',
      name: '테스트 연결',
      user: testUser._id,
      nestId: testNestId._id,
      wallet: testWallet._id,
      dapp: {
        name: '테스트 DApp',
        domain: 'test.example.com',
        logoUrl: 'https://test.example.com/logo.png',
        description: '테스트 DApp 설명',
        registered: true
      },
      status: 'active',
      permissions: {
        readNestId: true,
        readWalletAddress: true,
        readWalletBalance: true,
        requestSignature: true,
        autoSign: false,
        autoSignMaxAmount: 0,
        useGasless: true,
        readUserProfile: true
      },
      session: {
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 하루 후 만료
        token: 'test-session-token',
        refreshToken: 'test-refresh-token'
      }
    });

    // 테스트 트랜잭션 생성
    testTransaction = await RelayTransaction.create({
      connection: testConnection._id,
      user: testUser._id,
      requestType: 'signMessage',
      requestData: {
        raw: 'Hello, Nest!',
        humanReadable: {
          actionType: 'Sign Message',
          actionDescription: 'Sign: "Hello, Nest!"'
        }
      },
      status: 'pending',
      timestamps: {
        requested: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10분 후 만료
      }
    });
  });

  // 테스트 데이터 정리
  after(async () => {
    await RelayTransaction.deleteMany({});
    await RelayConnection.deleteMany({});
    await Wallet.deleteMany({});
    await NestId.deleteMany({});
    await User.deleteMany({});
  });

  // Relay 연결 API 테스트
  describe('연결 API', () => {
    // 새 연결 생성 테스트
    it('POST /api/relay/connections - 새 연결을 생성할 수 있어야 함', async () => {
      const connectionData = {
        connectionData: {
          nestIdId: testNestId._id,
          walletId: testWallet._id,
          dapp: {
            name: '새 DApp',
            domain: 'new.example.com',
            logoUrl: 'https://new.example.com/logo.png',
            description: '새 DApp 설명'
          },
          permissions: {
            readNestId: true,
            readWalletAddress: true,
            readWalletBalance: false,
            requestSignature: true,
            autoSign: false,
            autoSignMaxAmount: 0,
            useGasless: false,
            readUserProfile: false
          }
        }
      };

      const res = await chai.request(app)
        .post('/api/relay/connections')
        .set('Authorization', testToken)
        .send(connectionData);

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body.connection).to.be.an('object');
      expect(res.body.accessToken).to.be.a('string');
      expect(res.body.isNew).to.be.a('boolean');
      expect(res.body.connection.dapp.name).to.equal('새 DApp');
      expect(res.body.connection.dapp.domain).to.equal('new.example.com');
    });

    // 사용자의 연결 목록 조회 테스트
    it('GET /api/relay/connections - 사용자의 연결 목록을 조회할 수 있어야 함', async () => {
      const res = await chai.request(app)
        .get('/api/relay/connections')
        .set('Authorization', testToken)
        .query({ activeOnly: 'true' });

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.least(1);
      expect(res.body[0]).to.have.property('name');
      expect(res.body[0]).to.have.property('dapp');
    });

    // 연결 상세 정보 조회 테스트
    it('GET /api/relay/connections/:connectionId - 연결 상세 정보를 조회할 수 있어야 함', async () => {
      const res = await chai.request(app)
        .get(`/api/relay/connections/${testConnection._id}`)
        .set('Authorization', testToken);

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('_id');
      expect(res.body).to.have.property('name');
      expect(res.body).to.have.property('dapp');
      expect(res.body.dapp.name).to.equal('테스트 DApp');
    });

    // 연결 키로 연결 정보 조회 테스트
    it('GET /api/relay/dapp/connections/:connectionKey - 연결 키로 연결 정보를 조회할 수 있어야 함', async () => {
      const res = await chai.request(app)
        .get(`/api/relay/dapp/connections/${testConnection.connectionKey}`)
        .set('Referer', 'https://test.example.com');

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('connectionKey');
      expect(res.body).to.have.property('permissions');
      expect(res.body).to.have.property('nestId');
      expect(res.body.connectionKey).to.equal(testConnection.connectionKey);
    });

    // 연결 갱신 테스트
    it('POST /api/relay/connections/:connectionId/renew - 연결을 갱신할 수 있어야 함', async () => {
      const res = await chai.request(app)
        .post(`/api/relay/connections/${testConnection._id}/renew`)
        .set('Authorization', testToken)
        .send({ expiresIn: 7 * 24 * 60 * 60 * 1000 }); // 7일 후 만료

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('connection');
      expect(res.body).to.have.property('accessToken');
      
      // 만료 시간이 갱신되었는지 확인
      const updatedConnection = await RelayConnection.findById(testConnection._id);
      const originalExpires = new Date(testConnection.session.expiresAt).getTime();
      const updatedExpires = new Date(updatedConnection.session.expiresAt).getTime();
      expect(updatedExpires).to.be.greaterThan(originalExpires);
    });

    // 연결 권한 업데이트 테스트
    it('PATCH /api/relay/connections/:connectionId/permissions - 연결 권한을 업데이트할 수 있어야 함', async () => {
      const permissions = {
        readWalletBalance: true,
        autoSign: true,
        autoSignMaxAmount: 0.1
      };

      const res = await chai.request(app)
        .patch(`/api/relay/connections/${testConnection._id}/permissions`)
        .set('Authorization', testToken)
        .send({ permissions });

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('permissions');
      expect(res.body.permissions.readWalletBalance).to.equal(true);
      expect(res.body.permissions.autoSign).to.equal(true);
      expect(res.body.permissions.autoSignMaxAmount).to.equal(0.1);
    });

    // 토큰 검증 테스트
    it('POST /api/relay/dapp/verify-token - 액세스 토큰을 검증할 수 있어야 함', async () => {
      // 먼저 액세스 토큰 생성
      const renewRes = await chai.request(app)
        .post(`/api/relay/connections/${testConnection._id}/renew`)
        .set('Authorization', testToken)
        .send({});

      const accessToken = renewRes.body.accessToken;

      const res = await chai.request(app)
        .post('/api/relay/dapp/verify-token')
        .set('Referer', 'https://test.example.com')
        .send({ token: accessToken });

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('valid');
      expect(res.body.valid).to.equal(true);
    });

    // 연결 철회 테스트
    it('DELETE /api/relay/connections/:connectionId - 연결을 철회할 수 있어야 함', async () => {
      const res = await chai.request(app)
        .delete(`/api/relay/connections/${testConnection._id}`)
        .set('Authorization', testToken);

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('success');
      expect(res.body.success).to.equal(true);
      
      // 연결이 철회되었는지 확인
      const updatedConnection = await RelayConnection.findById(testConnection._id);
      expect(updatedConnection.status).to.equal('revoked');
    });
  });

  // Relay 트랜잭션 API 테스트
  describe('트랜잭션 API', () => {
    // 테스트를 위한 새 연결 생성
    let activeConnection;
    
    before(async () => {
      activeConnection = await RelayConnection.create({
        connectionKey: 'active-connection-key',
        name: '활성 연결',
        user: testUser._id,
        nestId: testNestId._id,
        wallet: testWallet._id,
        dapp: {
          name: '활성 DApp',
          domain: 'active.example.com',
          logoUrl: 'https://active.example.com/logo.png',
          description: '활성 DApp 설명',
          registered: true
        },
        status: 'active',
        permissions: {
          readNestId: true,
          readWalletAddress: true,
          readWalletBalance: true,
          requestSignature: true,
          autoSign: false,
          autoSignMaxAmount: 0,
          useGasless: true,
          readUserProfile: true
        },
        session: {
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 하루 후 만료
          token: 'active-session-token',
          refreshToken: 'active-refresh-token'
        }
      });
    });

    // 서명 요청 생성 테스트
    it('POST /api/relay/dapp/transactions - 서명 요청을 생성할 수 있어야 함', async () => {
      const requestData = {
        connectionKey: activeConnection.connectionKey,
        requestType: 'signMessage',
        requestData: {
          raw: 'Hello, Active Nest!'
        }
      };

      const res = await chai.request(app)
        .post('/api/relay/dapp/transactions')
        .set('Referer', 'https://active.example.com')
        .send(requestData);

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('transactionId');
      expect(res.body).to.have.property('status');
      expect(res.body.status).to.equal('pending');
      expect(res.body).to.have.property('expiresAt');
      expect(res.body).to.have.property('autoApproved');
      expect(res.body.autoApproved).to.equal(false);
    });

    // 트랜잭션 상태 조회 테스트
    it('GET /api/relay/dapp/transactions/:transactionId/status - 트랜잭션 상태를 조회할 수 있어야 함', async () => {
      const signRes = await chai.request(app)
        .post('/api/relay/dapp/transactions')
        .set('Referer', 'https://active.example.com')
        .send({
          connectionKey: activeConnection.connectionKey,
          requestType: 'signMessage',
          requestData: {
            raw: 'Status Check Message'
          }
        });

      const transactionId = signRes.body.transactionId;

      const res = await chai.request(app)
        .get(`/api/relay/dapp/transactions/${transactionId}/status`)
        .set('Referer', 'https://active.example.com');

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('transactionId');
      expect(res.body).to.have.property('status');
      expect(res.body.transactionId).to.equal(transactionId);
    });

    // 사용자의 트랜잭션 목록 조회 테스트
    it('GET /api/relay/transactions - 사용자의 트랜잭션 목록을 조회할 수 있어야 함', async () => {
      const res = await chai.request(app)
        .get('/api/relay/transactions')
        .set('Authorization', testToken);

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('transactions');
      expect(res.body.transactions).to.be.an('array');
      expect(res.body).to.have.property('pagination');
    });

    // 트랜잭션 상세 조회 테스트
    it('GET /api/relay/transactions/:transactionId - 트랜잭션 상세 정보를 조회할 수 있어야 함', async () => {
      // 테스트용 트랜잭션 생성
      const newTransaction = await RelayTransaction.create({
        connection: activeConnection._id,
        user: testUser._id,
        transactionId: 'test-transaction-id',
        requestType: 'signMessage',
        requestData: {
          raw: 'Detail Check Message',
          humanReadable: {
            actionType: 'Sign Message',
            actionDescription: 'Sign: "Detail Check Message"'
          }
        },
        status: 'pending',
        timestamps: {
          requested: new Date(),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10분 후 만료
        }
      });

      const res = await chai.request(app)
        .get(`/api/relay/transactions/${newTransaction.transactionId}`)
        .set('Authorization', testToken);

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('_id');
      expect(res.body).to.have.property('transactionId');
      expect(res.body).to.have.property('requestType');
      expect(res.body).to.have.property('requestData');
      expect(res.body.transactionId).to.equal(newTransaction.transactionId);
      expect(res.body.requestData.raw).to.equal('Detail Check Message');
    });

    // 서명 요청 승인 테스트 (모킹 필요)
    it('POST /api/relay/transactions/:transactionId/approve - 서명 요청을 승인할 수 있어야 함', async () => {
      // 테스트용 트랜잭션 생성
      const approveTransaction = await RelayTransaction.create({
        connection: activeConnection._id,
        user: testUser._id,
        transactionId: 'approve-transaction-id',
        requestType: 'signMessage',
        requestData: {
          raw: 'Approve Test Message',
          humanReadable: {
            actionType: 'Sign Message',
            actionDescription: 'Sign: "Approve Test Message"'
          }
        },
        status: 'pending',
        timestamps: {
          requested: new Date(),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10분 후 만료
        }
      });

      // 서명 생성 함수 모킹
      const walletService = require('../../src/services/walletService');
      const signTransactionStub = sinon.stub(walletService, 'signTransaction').resolves('0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234');

      const res = await chai.request(app)
        .post(`/api/relay/transactions/${approveTransaction.transactionId}/approve`)
        .set('Authorization', testToken);

      // 모킹 복원
      signTransactionStub.restore();

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('transactionId');
      expect(res.body).to.have.property('status');
      expect(res.body).to.have.property('signature');
      expect(res.body.transactionId).to.equal(approveTransaction.transactionId);
      expect(res.body.status).to.equal('approved');

      // 트랜잭션이 승인되었는지 확인
      const updatedTransaction = await RelayTransaction.findOne({ transactionId: approveTransaction.transactionId });
      expect(updatedTransaction.status).to.equal('approved');
      expect(updatedTransaction.signatureResult.signature).to.exist;
    });

    // 서명 요청 거부 테스트
    it('POST /api/relay/transactions/:transactionId/reject - 서명 요청을 거부할 수 있어야 함', async () => {
      // 테스트용 트랜잭션 생성
      const rejectTransaction = await RelayTransaction.create({
        connection: activeConnection._id,
        user: testUser._id,
        transactionId: 'reject-transaction-id',
        requestType: 'signMessage',
        requestData: {
          raw: 'Reject Test Message',
          humanReadable: {
            actionType: 'Sign Message',
            actionDescription: 'Sign: "Reject Test Message"'
          }
        },
        status: 'pending',
        timestamps: {
          requested: new Date(),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10분 후 만료
        }
      });

      const res = await chai.request(app)
        .post(`/api/relay/transactions/${rejectTransaction.transactionId}/reject`)
        .set('Authorization', testToken)
        .send({ reason: '테스트 거부 사유' });

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('transactionId');
      expect(res.body).to.have.property('status');
      expect(res.body.transactionId).to.equal(rejectTransaction.transactionId);
      expect(res.body.status).to.equal('rejected');

      // 트랜잭션이 거부되었는지 확인
      const updatedTransaction = await RelayTransaction.findOne({ transactionId: rejectTransaction.transactionId });
      expect(updatedTransaction.status).to.equal('rejected');
      expect(updatedTransaction.signatureResult.error).to.equal('테스트 거부 사유');
    });

    // 트랜잭션 완료 보고 테스트
    it('POST /api/relay/dapp/transactions/:transactionId/complete - 트랜잭션 완료를 보고할 수 있어야 함', async () => {
      // 승인된 테스트용 트랜잭션 생성
      const completeTransaction = await RelayTransaction.create({
        connection: activeConnection._id,
        user: testUser._id,
        transactionId: 'complete-transaction-id',
        requestType: 'signTransaction',
        requestData: {
          transaction: {
            to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            value: '0.1',
            data: '0x'
          },
          humanReadable: {
            actionType: 'Transaction',
            actionDescription: 'Send to 0x742d35...',
            amount: '0.1 CTA',
            assetType: 'CTA'
          }
        },
        status: 'approved',
        signatureResult: {
          signature: '0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234'
        },
        timestamps: {
          requested: new Date(),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10분 후 만료
          responded: new Date()
        }
      });

      const res = await chai.request(app)
        .post(`/api/relay/dapp/transactions/${completeTransaction.transactionId}/complete`)
        .set('Referer', 'https://active.example.com')
        .send({
          txHash: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
          blockNumber: 12345678
        });

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('transactionId');
      expect(res.body).to.have.property('status');
      expect(res.body.transactionId).to.equal(completeTransaction.transactionId);
      expect(res.body.status).to.equal('completed');

      // 트랜잭션이 완료되었는지 확인
      const updatedTransaction = await RelayTransaction.findOne({ transactionId: completeTransaction.transactionId });
      expect(updatedTransaction.status).to.equal('completed');
      expect(updatedTransaction.blockchain.txHash).to.equal('0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');
      expect(updatedTransaction.blockchain.blockNumber).to.equal(12345678);
    });

    // 트랜잭션 실패 보고 테스트
    it('POST /api/relay/dapp/transactions/:transactionId/fail - 트랜잭션 실패를 보고할 수 있어야 함', async () => {
      // 승인된 테스트용 트랜잭션 생성
      const failTransaction = await RelayTransaction.create({
        connection: activeConnection._id,
        user: testUser._id,
        transactionId: 'fail-transaction-id',
        requestType: 'signTransaction',
        requestData: {
          transaction: {
            to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            value: '0.1',
            data: '0x'
          },
          humanReadable: {
            actionType: 'Transaction',
            actionDescription: 'Send to 0x742d35...',
            amount: '0.1 CTA',
            assetType: 'CTA'
          }
        },
        status: 'approved',
        signatureResult: {
          signature: '0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234'
        },
        timestamps: {
          requested: new Date(),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10분 후 만료
          responded: new Date()
        }
      });

      const res = await chai.request(app)
        .post(`/api/relay/dapp/transactions/${failTransaction.transactionId}/fail`)
        .set('Referer', 'https://active.example.com')
        .send({
          error: '트랜잭션 가스 부족'
        });

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('transactionId');
      expect(res.body).to.have.property('status');
      expect(res.body.transactionId).to.equal(failTransaction.transactionId);
      expect(res.body.status).to.equal('failed');

      // 트랜잭션이 실패로 표시되었는지 확인
      const updatedTransaction = await RelayTransaction.findOne({ transactionId: failTransaction.transactionId });
      expect(updatedTransaction.status).to.equal('failed');
      expect(updatedTransaction.signatureResult.error).to.equal('트랜잭션 가스 부족');
    });
  });
});
