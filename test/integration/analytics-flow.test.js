const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../../src/server');
const User = require('../../src/models/user');
const Activity = require('../../src/models/activity');
const analyticsService = require('../../src/services/analyticsService');

describe('Analytics Integration Flow Tests', function() {
  let adminToken;
  let sandbox;
  
  before(async function() {
    // Create a sinon sandbox for mocking and testing
    sandbox = sinon.createSandbox();
    
    // Mock admin user
    const adminUser = {
      _id: new mongoose.Types.ObjectId(),
      email: 'admin@nestplatform.com',
      username: 'admin',
      roles: ['admin', 'user'],
      nestId: 'admin.nest'
    };
    
    // Mock the User.findOne method to return the admin user
    sandbox.stub(User, 'findOne').resolves(adminUser);
    
    // Generate admin JWT token
    const jwtSecret = process.env.JWT_SECRET || 'test-secret-key';
    adminToken = jwt.sign({ 
      id: adminUser._id.toString(),
      email: adminUser.email,
      username: adminUser.username,
      roles: adminUser.roles 
    }, jwtSecret, { expiresIn: '1h' });
    
    // Mock activity creation
    sandbox.stub(Activity, 'create').resolves({});
  });
  
  after(function() {
    // Clean up the sandbox after tests
    sandbox.restore();
  });
  
  describe('User Conversion Analytics Flow', function() {
    it('Should retrieve user conversion data with proper filters', async function() {
      // Mock the analytics service method
      const mockConversionData = {
        totalUsers: 1000,
        convertedUsers: 450,
        conversionRate: 45,
        conversionBySource: [
          { source: 'google', count: 150, rate: 60 },
          { source: 'kakao', count: 200, rate: 50 },
          { source: 'apple', count: 100, rate: 30 }
        ],
        trends: []
      };
      
      sandbox.stub(analyticsService, 'getUserConversionData').resolves(mockConversionData);
      
      const response = await request(app)
        .get('/api/analytics/user-conversion')
        .query({
          timeRange: 'last30Days',
          userSegment: 'all',
          startDate: '2023-04-01',
          endDate: '2023-05-01'
        })
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('totalUsers', 1000);
      expect(response.body.data).to.have.property('conversionRate', 45);
    });
  });
  
  describe('Wallet Retention Analytics Flow', function() {
    it('Should retrieve wallet retention data with proper filters', async function() {
      // Mock the analytics service method
      const mockRetentionData = {
        totalWallets: 800,
        retainedWallets: 560,
        retentionRate: 70,
        retentionByRewardType: [
          { type: 'token', count: 300, rate: 80 },
          { type: 'nft', count: 200, rate: 65 },
          { type: 'xp', count: 60, rate: 50 }
        ],
        trends: []
      };
      
      sandbox.stub(analyticsService, 'getWalletRetentionData').resolves(mockRetentionData);
      
      const response = await request(app)
        .get('/api/analytics/wallet-retention')
        .query({
          timeRange: 'last90Days',
          userSegment: 'all',
          rewardType: 'all'
        })
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('totalWallets', 800);
      expect(response.body.data).to.have.property('retentionRate', 70);
    });
  });
  
  describe('Token Exchange Analytics Flow', function() {
    it('Should retrieve token exchange data with proper filters', async function() {
      // Mock the analytics service method
      const mockExchangeData = {
        totalExchanges: 1200,
        totalCtaVolume: 25000,
        totalNestVolume: 25000000,
        averageExchangeSize: 20.83,
        exchangeByUserSegment: [
          { segment: 'beginner', count: 500, volume: 8000 },
          { segment: 'intermediate', count: 400, volume: 10000 },
          { segment: 'advanced', count: 200, volume: 5000 },
          { segment: 'VIP', count: 100, volume: 2000 }
        ],
        trends: []
      };
      
      sandbox.stub(analyticsService, 'getTokenExchangeData').resolves(mockExchangeData);
      
      const response = await request(app)
        .get('/api/analytics/token-exchange')
        .query({
          timeRange: 'last30Days',
          userSegment: 'all',
          exchangeDirection: 'all'
        })
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('totalExchanges', 1200);
      expect(response.body.data).to.have.property('totalCtaVolume', 25000);
    });
  });
  
  describe('XP Accumulation Analytics Flow', function() {
    it('Should retrieve XP accumulation data with proper filters', async function() {
      // Mock the analytics service method
      const mockXpData = {
        totalUsers: 1500,
        totalXp: 750000,
        averageXp: 500,
        averageLevel: 3.2,
        activeUsers: 1200,
        xpByActivityType: [
          { type: 'attendance', xp: 200000, users: 1000 },
          { type: 'comment', xp: 150000, users: 800 },
          { type: 'ranking', xp: 180000, users: 500 },
          { type: 'ai', xp: 120000, users: 600 },
          { type: 'group', xp: 100000, users: 400 }
        ],
        trends: []
      };
      
      sandbox.stub(analyticsService, 'getXpAccumulationData').resolves(mockXpData);
      
      const response = await request(app)
        .get('/api/analytics/xp-accumulation')
        .query({
          timeRange: 'last30Days',
          userSegment: 'all',
          activityType: 'all'
        })
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('totalUsers', 1500);
      expect(response.body.data).to.have.property('averageXp', 500);
    });
    
    it('Should retrieve XP summary data for dashboard', async function() {
      // Mock the analytics service method
      const mockSummaryData = {
        averageXp: 500,
        averageXpChange: 15,
        maxXpUser: 'john.nest',
        maxXp: 5000,
        averageLevel: 3.2,
        averageLevelChange: 0.5,
        activeUsers: 1200,
        activeUsersChange: 8,
        xpAccumulationPattern: '사용자들은 주로 출석 체크와 댓글 작성을 통해 XP를 획득하고 있으며, 평일 오전 9시부터 11시 사이에 가장 활발한 활동을 보입니다.',
        userEngagementSummary: '사용자 참여도는 지난 30일 동안 꾸준히 증가했으며, 특히 그룹 미션 기능 도입 이후 참여율이 25% 상승했습니다.',
        levelProgressionSummary: '레벨 2에서 레벨 3으로의 진행이 가장 활발하며, 레벨 5 이상의 고급 사용자는 전체의 15%를 차지합니다.',
        insights: {
          xpPattern: [
            '출석 체크는 가장 인기 있는 XP 획득 방법으로, 전체 XP의 40%를 차지합니다.',
            '주말보다 평일에 더 많은 XP가 획득되고 있습니다.',
            '사용자당 일일 평균 XP 획득량은 25XP입니다.'
          ],
          engagement: [
            '댓글 작성 활동이 가장 높은 참여도를 보이고 있습니다.',
            '첫 미션 완료 후 30일 이내에 추가 미션에 참여하는 비율은 65%입니다.',
            '신규 사용자의 첫 주 참여율은 45%입니다.'
          ],
          levelProgression: [
            '신규 사용자의 70%가 첫 달에 레벨 2에 도달합니다.',
            '레벨 4 이상 사용자의 NFT 보유량은 평균보다 3배 높습니다.',
            '적극적인 사용자는 월평균 0.8 레벨이 상승합니다.'
          ]
        }
      };
      
      sandbox.stub(analyticsService, 'getXpSummaryData').resolves(mockSummaryData);
      
      const response = await request(app)
        .get('/api/analytics/xp-summary')
        .query({
          timeRange: 'last30Days',
          userSegment: 'all',
          activityType: 'all'
        })
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('averageXp', 500);
      expect(response.body.data).to.have.property('insights');
      expect(response.body.data.insights).to.have.property('xpPattern');
    });
  });
  
  describe('NFT Ownership Analytics Flow', function() {
    it('Should retrieve NFT ownership data with proper filters', async function() {
      // Mock the analytics service method
      const mockNftData = {
        totalNfts: 3500,
        totalNftsChange: 12,
        averageNftsPerUser: 2.8,
        averageNftsChange: 0.3,
        topNftHolder: 'alex.nest',
        topNftCount: 45,
        nftHolders: 1250,
        nftHoldersChange: 5,
        nftByType: [
          { type: 'attendance', count: 1500 },
          { type: 'comment', count: 800 },
          { type: 'ranking', count: 700 },
          { type: 'ai', count: 300 },
          { type: 'group', count: 200 }
        ],
        nftOwnershipPattern: '사용자당 평균 2.8개의 NFT를 보유하고 있으며, 출석 체크 NFT가 가장 많이 발행되었습니다. NFT 보유량은 사용자 참여도와 강한 상관관계를 보입니다.',
        nftEngagementCorrelation: 'NFT 보유량이 많은 사용자일수록 플랫폼 내 체류 시간이 길고, 미션 완료율이 높으며, 토큰 교환 활동도 활발합니다.',
        segmentDistribution: '상위 5%의 사용자가 전체 NFT의 30%를 보유하고 있으며, 중급 사용자 그룹이 가장 많은 NFT를 보유하고 있습니다.',
        dailyMintTrend: [
          { date: '2023-04-01', mintCount: 50 },
          { date: '2023-04-02', mintCount: 55 },
          { date: '2023-04-03', mintCount: 48 }
        ],
        nftOwnershipRateTrend: [
          { date: '2023-04-01', ownershipRate: 70 },
          { date: '2023-04-02', ownershipRate: 72 },
          { date: '2023-04-03', ownershipRate: 75 }
        ],
        insights: {
          ownershipPattern: [
            '신규 사용자의 60%가 첫 달에 적어도 하나의 NFT를 획득합니다.',
            'NFT 보유량이 5개 이상인 사용자는 플랫폼 이탈률이 30% 낮습니다.',
            '출석 체크 NFT는 가장 많이 발행되었지만, 랭킹 NFT가 가장 높은 가치를 지니고 있습니다.'
          ],
          engagementCorrelation: [
            'NFT 보유량이 많은 사용자는 일일 로그인 빈도가 2.5배 높습니다.',
            'NFT 보유량과 미션 완료율 사이에는 0.78의 상관계수가 있습니다.',
            'NFT 보유자의 평균 활동 시간은 비보유자보다 45분 더 깁니다.'
          ],
          segmentDistribution: [
            '중급 사용자 그룹이 전체 NFT의 45%를 보유하고 있습니다.',
            'VIP 사용자의 95%가 희귀 NFT를 적어도 하나 보유하고 있습니다.',
            '초보자 사용자는 주로 출석 체크와 댓글 작성 NFT를 보유하고 있습니다.'
          ]
        }
      };
      
      sandbox.stub(analyticsService, 'getNftOwnershipData').resolves(mockNftData);
      
      const response = await request(app)
        .get('/api/analytics/nft-ownership')
        .query({
          timeRange: 'last30Days',
          userSegment: 'all',
          nftType: 'all'
        })
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('totalNfts', 3500);
      expect(response.body.data).to.have.property('averageNftsPerUser', 2.8);
    });
    
    it('Should retrieve NFT segment data for charts', async function() {
      // Mock the analytics service method
      const mockSegmentData = [
        { userLevel: 'beginner', nftCount: 1.5, primaryActivityType: 'attendance' },
        { userLevel: 'intermediate', nftCount: 3.2, primaryActivityType: 'comment' },
        { userLevel: 'advanced', nftCount: 7.5, primaryActivityType: 'ranking' },
        { userLevel: 'VIP', nftCount: 15.3, primaryActivityType: 'ai' }
      ];
      
      sandbox.stub(analyticsService, 'getNftByUserSegmentData').resolves(mockSegmentData);
      
      const response = await request(app)
        .get('/api/analytics/nft-by-segment')
        .query({
          timeRange: 'last30Days'
        })
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.be.an('array');
      expect(response.body.data).to.have.length(4);
    });
    
    it('Should retrieve NFT correlation data for scatter plot', async function() {
      // Mock the analytics service method
      const mockCorrelationData = [
        { userId: 'user1', userLevel: 'beginner', nftCount: 2, engagementScore: 45, retentionDays: 20, weeklyActiveMinutes: 85, missionCompletionRate: 30 },
        { userId: 'user2', userLevel: 'intermediate', nftCount: 5, engagementScore: 68, retentionDays: 45, weeklyActiveMinutes: 120, missionCompletionRate: 65 },
        { userId: 'user3', userLevel: 'advanced', nftCount: 12, engagementScore: 82, retentionDays: 90, weeklyActiveMinutes: 200, missionCompletionRate: 85 },
        { userId: 'user4', userLevel: 'VIP', nftCount: 25, engagementScore: 95, retentionDays: 150, weeklyActiveMinutes: 350, missionCompletionRate: 95 }
      ];
      
      sandbox.stub(analyticsService, 'getNftEngagementCorrelationData').resolves(mockCorrelationData);
      
      const response = await request(app)
        .get('/api/analytics/nft-correlation')
        .query({
          timeRange: 'last90Days'
        })
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.be.an('array');
      expect(response.body.data[0]).to.have.property('userId');
      expect(response.body.data[0]).to.have.property('nftCount');
      expect(response.body.data[0]).to.have.property('engagementScore');
    });
  });
  
  describe('Analytics Data Export Flow', function() {
    it('Should export analytics data in various formats', async function() {
      // Mock the analytics service export methods
      sandbox.stub(analyticsService, 'exportUserConversionData').resolves({ filename: 'user_conversion_export.csv' });
      sandbox.stub(analyticsService, 'exportWalletRetentionData').resolves({ filename: 'wallet_retention_export.xlsx' });
      sandbox.stub(analyticsService, 'exportTokenExchangeData').resolves({ filename: 'token_exchange_export.json' });
      
      // Test CSV export
      const csvResponse = await request(app)
        .get('/api/analytics/export/user-conversion')
        .query({
          format: 'csv',
          timeRange: 'last30Days',
          userSegment: 'all'
        })
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(csvResponse.status).to.equal(200);
      expect(csvResponse.body).to.have.property('filename', 'user_conversion_export.csv');
      
      // Test Excel export
      const xlsxResponse = await request(app)
        .get('/api/analytics/export/wallet-retention')
        .query({
          format: 'xlsx',
          timeRange: 'last90Days',
          userSegment: 'all'
        })
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(xlsxResponse.status).to.equal(200);
      expect(xlsxResponse.body).to.have.property('filename', 'wallet_retention_export.xlsx');
      
      // Test JSON export
      const jsonResponse = await request(app)
        .get('/api/analytics/export/token-exchange')
        .query({
          format: 'json',
          timeRange: 'last30Days',
          userSegment: 'all'
        })
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(jsonResponse.status).to.equal(200);
      expect(jsonResponse.body).to.have.property('filename', 'token_exchange_export.json');
    });
  });
  
  describe('Analytics Dashboard API Flow', function() {
    it('Should retrieve combined metrics for the analytics dashboard', async function() {
      // Mock the analytics service method
      const mockDashboardData = {
        conversionRate: 45,
        retentionRate: 70,
        activeUsers: 1200,
        totalNfts: 3500,
        averageXp: 500,
        tokenExchangeVolume: 25000,
        trends: {
          users: [/* data points */],
          nfts: [/* data points */],
          xp: [/* data points */],
          tokens: [/* data points */]
        },
        topPerformers: {
          users: [/* top users */],
          nfts: [/* top NFTs */],
          missions: [/* top missions */]
        }
      };
      
      sandbox.stub(analyticsService, 'getDashboardData').resolves(mockDashboardData);
      
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .query({
          timeRange: 'last30Days'
        })
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('conversionRate', 45);
      expect(response.body.data).to.have.property('retentionRate', 70);
      expect(response.body.data).to.have.property('trends');
      expect(response.body.data).to.have.property('topPerformers');
    });
  });
});
