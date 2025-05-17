/**
 * @file NFT API 엔드포인트 테스트
 * @description NFT 관련 API 엔드포인트 테스트 케이스
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { expect } = require('chai');
const app = require('../../src/server');
const User = require('../../src/models/user');
const { generateAuthToken } = require('../../src/utils/testHelpers');
const nftService = require('../../src/services/nftService');
const sinon = require('sinon');

describe('NFT API', () => {
  let authToken;
  let adminAuthToken;
  let testUser;
  let testAdmin;

  before(async () => {
    // 테스트 사용자 생성
    testUser = new User({
      email: 'test.user@example.com',
      displayName: 'Test User',
      role: 'user',
    });
    await testUser.save();

    // 테스트 관리자 생성
    testAdmin = new User({
      email: 'admin@example.com',
      displayName: 'Admin User',
      role: 'admin',
    });
    await testAdmin.save();

    // 인증 토큰 생성
    authToken = generateAuthToken(testUser);
    adminAuthToken = generateAuthToken(testAdmin);
  });

  after(async () => {
    // 테스트 데이터 정리
    await User.deleteMany({
      email: { $in: ['test.user@example.com', 'admin@example.com'] }
    });
  });

  beforeEach(() => {
    // 모든 서비스 함수 스텁 초기화
    sinon.restore();
  });

  describe('GET /api/nfts', () => {
    it('인증 없이 접근할 경우 401 응답을 반환해야 함', async () => {
      const res = await request(app)
        .get('/api/nfts')
        .expect(401);
      
      expect(res.body).to.have.property('error');
    });

    it('유효한 인증으로 접근할 경우 200 응답과 NFT 목록을 반환해야 함', async () => {
      // NFT 서비스 스텁 생성
      const mockNFTs = [
        {
          id: '1',
          name: 'Test NFT 1',
          description: 'Test Description 1',
          tokenId: '101',
          owner: testUser.id,
          metadata: { image: 'test1.png' },
          type: 'badge'
        },
        {
          id: '2',
          name: 'Test NFT 2',
          description: 'Test Description 2',
          tokenId: '102',
          owner: testUser.id,
          metadata: { image: 'test2.png' },
          type: 'reward'
        }
      ];

      sinon.stub(nftService, 'getAllNFTs').resolves({
        nfts: mockNFTs,
        totalCount: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      });

      const res = await request(app)
        .get('/api/nfts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('nfts').to.be.an('array').with.lengthOf(2);
      expect(res.body.data).to.have.property('totalCount', 2);
    });

    it('페이지네이션 파라미터를 처리해야 함', async () => {
      sinon.stub(nftService, 'getAllNFTs').resolves({
        nfts: [],
        totalCount: 100,
        page: 2,
        limit: 20,
        totalPages: 5
      });

      const res = await request(app)
        .get('/api/nfts?page=2&limit=20')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.body.data).to.have.property('page', 2);
      expect(res.body.data).to.have.property('limit', 20);
      expect(res.body.data).to.have.property('totalPages', 5);
      
      // getAllNFTs가 올바른 페이지네이션 파라미터로 호출되었는지 확인
      expect(nftService.getAllNFTs.calledWith(2, 20)).to.be.true;
    });
  });

  describe('GET /api/nfts/:id', () => {
    it('존재하는 NFT ID로 요청할 경우 200 응답과 NFT 정보를 반환해야 함', async () => {
      const mockNFT = {
        id: 'nft123',
        name: 'Test NFT',
        description: 'Test Description',
        tokenId: '101',
        owner: testUser.id,
        metadata: { image: 'test.png' },
        type: 'badge'
      };

      sinon.stub(nftService, 'getNFTById').resolves(mockNFT);

      const res = await request(app)
        .get('/api/nfts/nft123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('data', mockNFT);
    });

    it('존재하지 않는 NFT ID로 요청할 경우 404 응답을 반환해야 함', async () => {
      sinon.stub(nftService, 'getNFTById').resolves(null);

      const res = await request(app)
        .get('/api/nfts/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
      
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('error');
    });
  });

  describe('POST /api/nfts/mint', () => {
    it('관리자 권한 없이 요청할 경우 403 응답을 반환해야 함', async () => {
      const res = await request(app)
        .post('/api/nfts/mint')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipientId: testUser.id,
          metadata: { name: 'New NFT', image: 'new.png' },
          type: 'badge'
        })
        .expect(403);
      
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('error');
    });

    it('관리자 권한으로 유효한 데이터를 보낼 경우 201 응답과 발급된 NFT 정보를 반환해야 함', async () => {
      const mintData = {
        recipientId: testUser.id,
        metadata: { name: 'New NFT', image: 'new.png' },
        type: 'badge'
      };

      const mockNFT = {
        id: 'newnft123',
        tokenId: '201',
        owner: testUser.id,
        ...mintData
      };

      sinon.stub(nftService, 'mintNFT').resolves(mockNFT);

      const res = await request(app)
        .post('/api/nfts/mint')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(mintData)
        .expect(201);
      
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('data', mockNFT);
    });

    it('필수 필드가 누락된 경우 400 응답을 반환해야 함', async () => {
      const res = await request(app)
        .post('/api/nfts/mint')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send({
          // recipientId 누락
          metadata: { name: 'New NFT', image: 'new.png' },
          type: 'badge'
        })
        .expect(400);
      
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('error');
    });
  });

  describe('POST /api/nfts/transfer', () => {
    it('유효한 전송 요청에 대해 200 응답과 전송 결과를 반환해야 함', async () => {
      const transferData = {
        nftId: 'nft123',
        recipientId: 'user456'
      };

      const mockResult = {
        success: true,
        txHash: '0x123abc...',
        from: testUser.id,
        to: 'user456',
        nftId: 'nft123'
      };

      sinon.stub(nftService, 'transferNFT').resolves(mockResult);

      const res = await request(app)
        .post('/api/nfts/transfer')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transferData)
        .expect(200);
      
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('data', mockResult);
    });

    it('필수 필드가 누락된 경우 400 응답을 반환해야 함', async () => {
      const res = await request(app)
        .post('/api/nfts/transfer')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // nftId 누락
          recipientId: 'user456'
        })
        .expect(400);
      
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('error');
    });
  });

  describe('GET /api/nfts/:id/history', () => {
    it('NFT 거래 기록을 조회할 경우 200 응답과 기록 목록을 반환해야 함', async () => {
      const mockHistory = [
        {
          timestamp: new Date(),
          from: 'user123',
          to: testUser.id,
          txHash: '0xabc123...'
        },
        {
          timestamp: new Date(),
          from: testUser.id,
          to: 'user456',
          txHash: '0xdef456...'
        }
      ];

      sinon.stub(nftService, 'getNFTHistory').resolves(mockHistory);

      const res = await request(app)
        .get('/api/nfts/nft123/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.be.an('array').with.lengthOf(2);
    });
  });

  describe('GET /api/nfts/owner/:userId', () => {
    it('사용자 보유 NFT 목록을 조회할 경우 200 응답과 NFT 목록을 반환해야 함', async () => {
      const mockNFTs = [
        {
          id: 'nft123',
          name: 'User NFT 1',
          tokenId: '301',
          owner: testUser.id,
          type: 'badge'
        },
        {
          id: 'nft456',
          name: 'User NFT 2',
          tokenId: '302',
          owner: testUser.id,
          type: 'reward'
        }
      ];

      sinon.stub(nftService, 'getNFTsByOwner').resolves({
        nfts: mockNFTs,
        totalCount: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      });

      const res = await request(app)
        .get(`/api/nfts/owner/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('nfts').to.be.an('array').with.lengthOf(2);
      expect(res.body.data.nfts[0]).to.have.property('owner', testUser.id);
    });
  });

  describe('GET /api/nfts/type/:type', () => {
    it('유형별 NFT 목록을 조회할 경우 200 응답과 NFT 목록을 반환해야 함', async () => {
      const mockNFTs = [
        {
          id: 'nft123',
          name: 'Badge NFT 1',
          tokenId: '401',
          type: 'badge'
        },
        {
          id: 'nft456',
          name: 'Badge NFT 2',
          tokenId: '402',
          type: 'badge'
        }
      ];

      sinon.stub(nftService, 'getNFTsByType').resolves({
        nfts: mockNFTs,
        totalCount: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      });

      const res = await request(app)
        .get('/api/nfts/type/badge')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('nfts').to.be.an('array').with.lengthOf(2);
      expect(res.body.data.nfts[0]).to.have.property('type', 'badge');
    });
  });

  describe('GET /api/nfts/badges', () => {
    it('뱃지 NFT 목록을 조회할 경우 200 응답과 NFT 목록을 반환해야 함', async () => {
      const mockNFTs = [
        {
          id: 'nft123',
          name: 'Badge NFT 1',
          tokenId: '501',
          type: 'badge'
        },
        {
          id: 'nft456',
          name: 'Badge NFT 2',
          tokenId: '502',
          type: 'badge'
        }
      ];

      sinon.stub(nftService, 'getNFTsByType').resolves({
        nfts: mockNFTs,
        totalCount: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      });

      const res = await request(app)
        .get('/api/nfts/badges')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('nfts').to.be.an('array').with.lengthOf(2);
      expect(nftService.getNFTsByType.calledWith('badge', 1, 10)).to.be.true;
    });
  });

  describe('오류 처리', () => {
    it('서비스에서 오류가 발생할 경우 500 응답을 반환해야 함', async () => {
      sinon.stub(nftService, 'getAllNFTs').rejects(new Error('서비스 내부 오류'));

      const res = await request(app)
        .get('/api/nfts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);
      
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('error');
    });
  });
});
