/**
 * Relay 통합 흐름 테스트
 * 
 * 외부 DApp과 Nest 플랫폼 간의 연결 및 트랜잭션 흐름을 테스트합니다.
 * 실제 사용자 시나리오를 시뮬레이션하여 전체 시스템이 올바르게 작동하는지 확인합니다.
 */

const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const { expect } = chai;

const app = require('../../src/server');
const User = require('../../src/models/user');
const NestId = require('../../src/models/nestId');
const Wallet = require('../../src/models/wallet');
const RelayConnection = require('../../src/models/relay/relayConnection');
const RelayTransaction = require('../../src/models/relay/relayTransaction');
const walletService = require('../../src/services/walletService');
const config = require('../../src/config');

// Chai HTTP 설정
chai.use(chaiHttp);

describe('Relay 통합 흐름', () => {
  let testUser;
  let testNestId;
  let testWallet;
  let testToken;
  let dappInfo;

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

    // DApp 정보
    dappInfo = {
      name: '테스트 DApp',
      domain: 'test.example.com',
      logoUrl: 'https://test.example.com/logo.png',
      description: '테스트 DApp 설명'
    };

    // 서명 함수 모킹
    sinon.stub(walletService, 'signTransaction').resolves('0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234');
  });

  // 테스트 데이터 정리
  after(async () => {
    // 모킹 복원
    walletService.signTransaction.restore();

    // 데이터 정리
    await RelayTransaction.deleteMany({});
    await RelayConnection.deleteMany({});
    await Wallet.deleteMany({});
    await NestId.deleteMany({});
    await User.deleteMany({});
  });

  /**
   * 시나리오 1: 연결 - 서명 - 완료 흐름
   * 
   * 전체 흐름:
   * 1. 사용자가 DApp에 연결
   * 2. DApp이 서명 요청
   * 3. 사용자가 서명 요청 승인
   * 4. DApp이 트랜잭션 완료 보고
   */
  describe('시나리오 1: 연결 - 서명 - 완료 흐름', () => {
    let connectionKey;
    let accessToken;
    let transactionId;

    it('1. 사용자가 DApp에 연결할 수 있어야 함', async () => {
      const connectionData = {
        connectionData: {
          nestIdId: testNestId._id,
          walletId: testWallet._id,
          dapp: dappInfo,
          permissions: {
            readNestId: true,
            readWalletAddress: true,
            readWalletBalance: true,
            requestSignature: true,
            autoSign: false,
            autoSignMaxAmount: 0,
            useGasless: true,
            readUserProfile: true
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
      expect(res.body.connection.dapp.name).to.equal(dappInfo.name);
      expect(res.body.connection.dapp.domain).to.equal(dappInfo.domain);

      // 다음 테스트를 위해 정보 저장
      connectionKey = res.body.connection.connectionKey;
      accessToken = res.body.accessToken;
    });

    it('2. DApp이 서명 요청을 생성할 수 있어야 함', async () => {
      const requestData = {
        connectionKey,
        requestType: 'signMessage',
        requestData: {
          raw: 'Hello, Nest Flow Test!'
        }
      };

      const res = await chai.request(app)
        .post('/api/relay/dapp/transactions')
        .set('Referer', `https://${dappInfo.domain}`)
        .send(requestData);

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('transactionId');
      expect(res.body).to.have.property('status');
      expect(res.body.status).to.equal('pending');
      expect(res.body).to.have.property('expiresAt');
      expect(res.body).to.have.property('autoApproved');
      expect(res.body.autoApproved).to.equal(false);

      // 다음 테스트를 위해 정보 저장
      transactionId = res.body.transactionId;
    });

    it('3. 사용자가 서명 요청을 확인할 수 있어야 함', async () => {
      const res = await chai.request(app)
        .get(`/api/relay/transactions/${transactionId}`)
        .set('Authorization', testToken);

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('transactionId');
      expect(res.body).to.have.property('requestType');
      expect(res.body).to.have.property('requestData');
      expect(res.body.transactionId).to.equal(transactionId);
      expect(res.body.requestData.raw).to.equal('Hello, Nest Flow Test!');
      expect(res.body.status).to.equal('pending');
    });

    it('4. 사용자가 서명 요청을 승인할 수 있어야 함', async () => {
      const res = await chai.request(app)
        .post(`/api/relay/transactions/${transactionId}/approve`)
        .set('Authorization', testToken);

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('transactionId');
      expect(res.body).to.have.property('status');
      expect(res.body).to.have.property('signature');
      expect(res.body.transactionId).to.equal(transactionId);
      expect(res.body.status).to.equal('approved');
      expect(res.body.signature).to.be.a('string');
    });

    it('5. DApp이 서명 요청 상태를 확인할 수 있어야 함', async () => {
      const res = await chai.request(app)
        .get(`/api/relay/dapp/transactions/${transactionId}/status`)
        .set('Referer', `https://${dappInfo.domain}`);

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('transactionId');
      expect(res.body).to.have.property('status');
      expect(res.body).to.have.property('signature');
      expect(res.body.transactionId).to.equal(transactionId);
      expect(res.body.status).to.equal('approved');
      expect(res.body.signature).to.be.a('string');
    });

    it('6. DApp이 트랜잭션 완료를 보고할 수 있어야 함', async () => {
      const res = await chai.request(app)
        .post(`/api/relay/dapp/transactions/${transactionId}/complete`)
        .set('Referer', `https://${dappInfo.domain}`)
        .send({
          txHash: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
          blockNumber: 12345678
        });

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('transactionId');
      expect(res.body).to.have.property('status');
      expect(res.body.transactionId).to.equal(transactionId);
      expect(res.body.status).to.equal('completed');

      // 트랜잭션이 완료되었는지 확인
      const completedTransaction = await RelayTransaction.findOne({ transactionId });
      expect(completedTransaction.status).to.equal('completed');
      expect(completedTransaction.blockchain.txHash).to.equal('0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');
      expect(completedTransaction.blockchain.blockNumber).to.equal(12345678);
    });
  });

  /**
   * 시나리오 2: 연결 - 서명 거부 흐름
   * 
   * 전체 흐름:
   * 1. 사용자가 DApp에 연결
   * 2. DApp이 서명 요청
   * 3. 사용자가 서명 요청 거부
   * 4. DApp이 거부 상태 확인
   */
  describe('시나리오 2: 연결 - 서명 거부 흐름', () => {
    let connectionKey;
    let accessToken;
    let transactionId;

    it('1. 사용자가 DApp에 연결할 수 있어야 함', async () => {
      const connectionData = {
        connectionData: {
          nestIdId: testNestId._id,
          walletId: testWallet._id,
          dapp: {
            name: '거부 테스트 DApp',
            domain: 'reject.example.com',
            logoUrl: 'https://reject.example.com/logo.png',
            description: '거부 테스트 DApp 설명'
          },
          permissions: {
            readNestId: true,
            readWalletAddress: true,
            requestSignature: true,
            autoSign: false
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

      // 다음 테스트를 위해 정보 저장
      connectionKey = res.body.connection.connectionKey;
      accessToken = res.body.accessToken;
    });

    it('2. DApp이 서명 요청을 생성할 수 있어야 함', async () => {
      const requestData = {
        connectionKey,
        requestType: 'signTransaction',
        requestData: {
          transaction: {
            to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            value: '100',
            data: '0x',
            gasLimit: '21000',
            gasPrice: '5000000000'
          }
        }
      };

      const res = await chai.request(app)
        .post('/api/relay/dapp/transactions')
        .set('Referer', 'https://reject.example.com')
        .send(requestData);

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('transactionId');
      expect(res.body.status).to.equal('pending');

      // 다음 테스트를 위해 정보 저장
      transactionId = res.body.transactionId;
    });

    it('3. 사용자가 서명 요청을 거부할 수 있어야 함', async () => {
      const res = await chai.request(app)
        .post(`/api/relay/transactions/${transactionId}/reject`)
        .set('Authorization', testToken)
        .send({ reason: '금액이 너무 큽니다' });

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('transactionId');
      expect(res.body).to.have.property('status');
      expect(res.body.transactionId).to.equal(transactionId);
      expect(res.body.status).to.equal('rejected');
    });

    it('4. DApp이 거부된 상태를 확인할 수 있어야 함', async () => {
      const res = await chai.request(app)
        .get(`/api/relay/dapp/transactions/${transactionId}/status`)
        .set('Referer', 'https://reject.example.com');

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('transactionId');
      expect(res.body).to.have.property('status');
      expect(res.body).to.have.property('error');
      expect(res.body.transactionId).to.equal(transactionId);
      expect(res.body.status).to.equal('rejected');
      expect(res.body.error).to.equal('금액이 너무 큽니다');
    });
  });

  /**
   * 시나리오 3: 자동 승인 흐름
   * 
   * 전체 흐름:
   * 1. 사용자가 DApp에 연결 (자동 승인 권한 포함)
   * 2. DApp이 서명 요청 (자동 승인 한도 내)
   * 3. 요청이 자동으로 승인되는지 확인
   */
  describe('시나리오 3: 자동 승인 흐름', () => {
    let connectionKey;

    it('1. 사용자가 자동 승인 권한으로 DApp에 연결할 수 있어야 함', async () => {
      const connectionData = {
        connectionData: {
          nestIdId: testNestId._id,
          walletId: testWallet._id,
          dapp: {
            name: '자동 승인 DApp',
            domain: 'auto.example.com',
            logoUrl: 'https://auto.example.com/logo.png',
            description: '자동 승인 테스트 DApp 설명'
          },
          permissions: {
            readNestId: true,
            readWalletAddress: true,
            requestSignature: true,
            autoSign: true,
            autoSignMaxAmount: 1.0, // 1 CTA 이하 자동 승인
            useGasless: true
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
      expect(res.body.connection.permissions.autoSign).to.equal(true);
      expect(res.body.connection.permissions.autoSignMaxAmount).to.equal(1.0);

      // 다음 테스트를 위해 정보 저장
      connectionKey = res.body.connection.connectionKey;
    });

    it('2. 자동 승인 한도 내의 트랜잭션이 자동으로 승인되어야 함', async () => {
      const requestData = {
        connectionKey,
        requestType: 'signTransaction',
        requestData: {
          transaction: {
            to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            value: '0.5', // 한도 내
            data: '0x',
            gasLimit: '21000',
            gasPrice: '5000000000'
          }
        }
      };

      const res = await chai.request(app)
        .post('/api/relay/dapp/transactions')
        .set('Referer', 'https://auto.example.com')
        .send(requestData);

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('transactionId');
      expect(res.body).to.have.property('status');
      expect(res.body).to.have.property('signature');
      expect(res.body).to.have.property('autoApproved');
      expect(res.body.status).to.equal('approved');
      expect(res.body.autoApproved).to.equal(true);
      expect(res.body.signature).to.be.a('string');
    });

    it('3. 자동 승인 한도 초과 트랜잭션은 자동 승인되지 않아야 함', async () => {
      const requestData = {
        connectionKey,
        requestType: 'signTransaction',
        requestData: {
          transaction: {
            to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            value: '2.0', // 한도 초과
            data: '0x',
            gasLimit: '21000',
            gasPrice: '5000000000'
          }
        }
      };

      const res = await chai.request(app)
        .post('/api/relay/dapp/transactions')
        .set('Referer', 'https://auto.example.com')
        .send(requestData);

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('transactionId');
      expect(res.body).to.have.property('status');
      expect(res.body.status).to.equal('pending');
      expect(res.body).to.not.have.property('signature');
      expect(res.body).to.have.property('autoApproved');
      expect(res.body.autoApproved).to.equal(false);
    });
  });

  /**
   * 시나리오 4: 가스리스 트랜잭션 흐름
   * 
   * 전체 흐름:
   * 1. 사용자가 DApp에 연결 (가스리스 권한 포함)
   * 2. DApp이 가스리스 트랜잭션 요청
   * 3. 사용자가 승인
   * 4. 트랜잭션 완료 보고
   */
  describe('시나리오 4: 가스리스 트랜잭션 흐름', () => {
    let connectionKey;
    let transactionId;

    it('1. 사용자가 가스리스 권한으로 DApp에 연결할 수 있어야 함', async () => {
      const connectionData = {
        connectionData: {
          nestIdId: testNestId._id,
          walletId: testWallet._id,
          dapp: {
            name: '가스리스 DApp',
            domain: 'gasless.example.com',
            logoUrl: 'https://gasless.example.com/logo.png',
            description: '가스리스 테스트 DApp 설명'
          },
          permissions: {
            readNestId: true,
            readWalletAddress: true,
            requestSignature: true,
            useGasless: true
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
      expect(res.body.connection.permissions.useGasless).to.equal(true);

      // 다음 테스트를 위해 정보 저장
      connectionKey = res.body.connection.connectionKey;
    });

    it('2. DApp이 가스리스 트랜잭션 요청을 생성할 수 있어야 함', async () => {
      const requestData = {
        connectionKey,
        requestType: 'signTransaction',
        requestData: {
          transaction: {
            to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            value: '0.1',
            data: '0x',
            gasLimit: '21000',
            gasPrice: '0' // 가스리스 트랜잭션
          }
        },
        gaslessTransaction: true
      };

      const res = await chai.request(app)
        .post('/api/relay/dapp/transactions')
        .set('Referer', 'https://gasless.example.com')
        .send(requestData);

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('transactionId');
      expect(res.body.status).to.equal('pending');

      // 다음 테스트를 위해 정보 저장
      transactionId = res.body.transactionId;

      // 가스리스 트랜잭션인지 확인
      const transaction = await RelayTransaction.findOne({ transactionId });
      expect(transaction.gaslessTransaction).to.equal(true);
    });

    it('3. 사용자가 가스리스 트랜잭션 요청을 승인할 수 있어야 함', async () => {
      const res = await chai.request(app)
        .post(`/api/relay/transactions/${transactionId}/approve`)
        .set('Authorization', testToken);

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('transactionId');
      expect(res.body).to.have.property('status');
      expect(res.body).to.have.property('signature');
      expect(res.body.transactionId).to.equal(transactionId);
      expect(res.body.status).to.equal('approved');
    });

    it('4. DApp이 가스리스 트랜잭션 완료를 보고할 수 있어야 함', async () => {
      const res = await chai.request(app)
        .post(`/api/relay/dapp/transactions/${transactionId}/complete`)
        .set('Referer', 'https://gasless.example.com')
        .send({
          txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          blockNumber: 87654321
        });

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('transactionId');
      expect(res.body).to.have.property('status');
      expect(res.body.transactionId).to.equal(transactionId);
      expect(res.body.status).to.equal('completed');

      // 트랜잭션이 완료되었는지 확인
      const completedTransaction = await RelayTransaction.findOne({ transactionId });
      expect(completedTransaction.status).to.equal('completed');
      expect(completedTransaction.gaslessTransaction).to.equal(true);
      expect(completedTransaction.blockchain.txHash).to.equal('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
    });
  });
});
