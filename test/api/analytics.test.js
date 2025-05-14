/**
 * 분석 API 테스트
 * 
 * 분석 엔드포인트에 대한 테스트
 */

const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');
const app = require('../../src/server');
const userConversion = require('../../src/analytics/userConversion');
const walletRetention = require('../../src/analytics/walletRetention');
const tokenExchange = require('../../src/analytics/tokenExchange');
const xpAccumulation = require('../../src/analytics/xpAccumulation');
const nftOwnership = require('../../src/analytics/nftOwnership');
const authMiddleware = require('../../src/api/middlewares/authMiddleware');
const roleMiddleware = require('../../src/api/middlewares/roleMiddleware');

describe('분석 API 테스트', () => {
  // 인증 및 권한 미들웨어 스텁 설정
  let verifyTokenStub;
  let isAdminStub;
  
  // Mock 데이터
  const mockPeriodOptions = {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31')
  };
  
  // 사용자 전환 분석 데이터
  const mockConversionMetrics = {
    summary: {
      totalUsers: 1000,
      usersWithWallet: 700,
      usersWithBlockchainActivity: 500,
      walletConversionRate: '70.00',
      activityConversionRate: '71.43',
      totalConversionRate: '50.00'
    },
    providerStats: [],
    timeseriesData: [],
    period: mockPeriodOptions
  };
  
  // 지갑 유지율 분석 데이터
  const mockRetentionMetrics = {
    summary: {
      totalWallets: 700,
      retainedWallets: 500,
      longTermRetainedWallets: 400,
      retentionRate: 71.43,
      longTermRetentionRate: 57.14,
      averageRetentionDays: 65.3,
      averagePostRewardActivities: 5.8,
      activeWalletRate: 60.0
    },
    retentionByProvider: [],
    timeseriesData: [],
    period: {
      ...mockPeriodOptions,
      retentionDays: 30
    }
  };
  
  // 토큰 교환 분석 데이터
  const mockExchangeMetrics = {
    summary: {
      totalExchanges: 1500,
      uniqueUsers: 450,
      totalCtaToNest: 900,
      totalNestToCta: 600,
      ctaToNestAmount: 90000,
      nestToCtaAmount: 60000000,
      conversionRatio: '0.6667',
      netFlow: '-59910000.00',
      netFlowDirection: 'nest_to_cta'
    },
    exchangeStats: [],
    timeseriesData: [],
    period: {
      ...mockPeriodOptions,
      direction: 'both'
    }
  };
  
  // XP 누적 분석 데이터
  const mockXpMetrics = {
    summary: {
      totalXp: 500000,
      totalActivities: 10000,
      uniqueUsers: 800,
      avgXpPerActivity: 50,
      maxXp: 500,
      minXp: 5
    },
    xpByActivityType: [],
    topUsers: [],
    xpByLevel: [],
    timeseriesData: [],
    period: mockPeriodOptions
  };
  
  // NFT 보유 분석 데이터
  const mockNftMetrics = {
    summary: {
      totalNfts: 5000,
      uniqueNftOwners: 600,
      totalUsers: 1000,
      avgNftPerOwner: 8.33,
      avgNftPerUser: 5,
      ownershipRate: 60
    },
    distribution: {
      byCount: [],
      byRarityMix: []
    },
    nftByRarity: [],
    nftByType: [],
    nftByAcquisitionMethod: [],
    timeseriesData: [],
    period: mockPeriodOptions
  };
  
  // 대시보드 데이터
  const mockDashboardData = {
    userConversion: {
      totalConversionRate: '50.00',
      totalUsers: 1000,
      usersWithWallet: 700,
      usersWithBlockchainActivity: 500
    },
    walletRetention: {
      retentionRate: 71.43,
      longTermRetentionRate: 57.14,
      activeWalletRate: 60.0
    },
    tokenExchange: {
      conversionRatio: '0.6667',
      netFlow: '-59910000.00',
      netFlowDirection: 'nest_to_cta'
    },
    xpAccumulation: {
      totalXp: 500000,
      avgXpPerUser: 625,
      totalActivities: 10000
    },
    nftOwnership: {
      totalNfts: 5000,
      avgNftPerOwner: 8.33,
      ownershipRate: 60
    },
    period: mockPeriodOptions
  };
  
  before(() => {
    // 인증 및 권한 미들웨어 스텁 생성
    verifyTokenStub = sinon.stub(authMiddleware, 'verifyToken');
    isAdminStub = sinon.stub(roleMiddleware, 'isAdmin');
    
    // 미들웨어 통과
    verifyTokenStub.callsFake((req, res, next) => {
      req.user = { id: 'admin123', role: 'admin' };
      next();
    });
    
    isAdminStub.callsFake((req, res, next) => {
      next();
    });
  });
  
  after(() => {
    // 스텁 복원
    verifyTokenStub.restore();
    isAdminStub.restore();
  });
  
  beforeEach(() => {
    // 각 분석 모듈의 메서드에 대한 스텁 생성
    sinon.stub(userConversion, 'calculateConversionMetrics').resolves(mockConversionMetrics);
    sinon.stub(userConversion, 'analyzeConversionTrends').resolves({
      intervalType: 'month',
      periods: 6,
      trendsData: [],
      changes: {}
    });
    sinon.stub(userConversion, 'analyzeSegmentConversion').resolves({
      segments: [],
      timestamp: new Date()
    });
    sinon.stub(userConversion, 'analyzeConversionFunnel').resolves({
      funnel: [],
      overallConversionRate: '50.00',
      conversionBySource: [],
      period: mockPeriodOptions
    });
    
    sinon.stub(walletRetention, 'calculateRetentionMetrics').resolves(mockRetentionMetrics);
    sinon.stub(walletRetention, 'analyzeRetentionByRewardType').resolves({
      retentionByRewardType: [],
      retentionByTokenAmount: [],
      retentionByNftRarity: [],
      period: mockPeriodOptions
    });
    sinon.stub(walletRetention, 'analyzeRetentionByActivityPattern').resolves({
      retentionByMissionCount: [],
      retentionBySocialConnection: [],
      period: mockPeriodOptions
    });
    
    sinon.stub(tokenExchange, 'calculateExchangeMetrics').resolves(mockExchangeMetrics);
    sinon.stub(tokenExchange, 'analyzeExchangeByUserSegment').resolves({
      byActivityLevel: [],
      byAuthProvider: [],
      period: mockPeriodOptions
    });
    sinon.stub(tokenExchange, 'analyzeExchangeAmountDistribution').resolves({
      ctaToNestDistribution: [],
      nestToCtaDistribution: [],
      userCountByExchanges: [],
      period: mockPeriodOptions
    });
    sinon.stub(tokenExchange, 'analyzePostExchangeBehavior').resolves({
      ctaToNest: {},
      nestToCta: {},
      period: mockPeriodOptions
    });
    
    sinon.stub(xpAccumulation, 'calculateXpMetrics').resolves(mockXpMetrics);
    sinon.stub(xpAccumulation, 'analyzeXpByUserSegment').resolves({
      byJoinDate: [],
      byActivityLevel: [],
      byAuthProvider: [],
      period: mockPeriodOptions
    });
    sinon.stub(xpAccumulation, 'analyzeLevelProgression').resolves({
      levelProgression: [],
      activityContribution: [],
      levelUpFrequency: [],
      period: mockPeriodOptions
    });
    sinon.stub(xpAccumulation, 'analyzeActivityEfficiency').resolves({
      activityEfficiency: [],
      levelEstimations: [],
      period: mockPeriodOptions
    });
    
    sinon.stub(nftOwnership, 'calculateNftMetrics').resolves(mockNftMetrics);
    sinon.stub(nftOwnership, 'analyzeNftByUserSegment').resolves({
      byJoinDate: [],
      byActivityLevel: [],
      byAuthProvider: [],
      period: mockPeriodOptions
    });
    sinon.stub(nftOwnership, 'analyzeNftEngagementCorrelation').resolves({
      overview: {},
      engagementByNftCount: [],
      engagementByRarity: {},
      period: mockPeriodOptions
    });
  });
  
  afterEach(() => {
    // 모든 스텁 복원
    sinon.restore();
  });
  
  // 테스트 케이스: 사용자 전환률 관련
  describe('GET /api/analytics/user-conversion', () => {
    it('사용자 전환률 지표를 조회할 수 있다', async () => {
      const res = await request(app)
        .get('/api/analytics/user-conversion')
        .query({ startDate: '2024-01-01', endDate: '2024-12-31' });
      
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('summary');
      expect(res.body.data.summary.totalConversionRate).to.equal('50.00');
    });
    
    it('사용자 전환률 추세를 조회할 수 있다', async () => {
      const res = await request(app)
        .get('/api/analytics/user-conversion/trends')
        .query({ intervalType: 'month', periods: 6 });
      
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('trendsData');
      expect(res.body.data.intervalType).to.equal('month');
    });
    
    it('사용자 세그먼트별 전환률을 조회할 수 있다', async () => {
      const res = await request(app)
        .get('/api/analytics/user-conversion/segments')
        .query({ startDate: '2024-01-01', endDate: '2024-12-31' });
      
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('segments');
      expect(res.body.data).to.have.property('timestamp');
    });
    
    it('전환 퍼널 분석을 조회할 수 있다', async () => {
      const res = await request(app)
        .get('/api/analytics/user-conversion/funnel')
        .query({ startDate: '2024-01-01', endDate: '2024-12-31' });
      
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('funnel');
      expect(res.body.data.overallConversionRate).to.equal('50.00');
    });
  });
  
  // 테스트 케이스: 지갑 유지율 관련
  describe('GET /api/analytics/wallet-retention', () => {
    it('지갑 유지율 지표를 조회할 수 있다', async () => {
      const res = await request(app)
        .get('/api/analytics/wallet-retention')
        .query({ startDate: '2024-01-01', endDate: '2024-12-31', retentionDays: 30 });
      
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('summary');
      expect(res.body.data.summary.retentionRate).to.equal(71.43);
    });
    
    it('보상 유형별 지갑 유지율을 조회할 수 있다', async () => {
      const res = await request(app)
        .get('/api/analytics/wallet-retention/reward-type')
        .query({ startDate: '2024-01-01', endDate: '2024-12-31' });
      
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('retentionByRewardType');
      expect(res.body.data).to.have.property('retentionByTokenAmount');
      expect(res.body.data).to.have.property('retentionByNftRarity');
    });
    
    it('활동 패턴별 지갑 유지율을 조회할 수 있다', async () => {
      const res = await request(app)
        .get('/api/analytics/wallet-retention/activity-pattern')
        .query({ startDate: '2024-01-01', endDate: '2024-12-31' });
      
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('retentionByMissionCount');
      expect(res.body.data).to.have.property('retentionBySocialConnection');
    });
  });
  
  // 테스트 케이스: 토큰 교환 관련
  describe('GET /api/analytics/token-exchange', () => {
    it('토큰 교환 지표를 조회할 수 있다', async () => {
      const res = await request(app)
        .get('/api/analytics/token-exchange')
        .query({ startDate: '2024-01-01', endDate: '2024-12-31', direction: 'both' });
      
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('summary');
      expect(res.body.data.summary.conversionRatio).to.equal('0.6667');
    });
    
    it('사용자 세그먼트별 토큰 교환 패턴을 조회할 수 있다', async () => {
      const res = await request(app)
        .get('/api/analytics/token-exchange/user-segment')
        .query({ startDate: '2024-01-01', endDate: '2024-12-31' });
      
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('byActivityLevel');
      expect(res.body.data).to.have.property('byAuthProvider');
    });
    
    it('토큰 교환 금액 분포를 조회할 수 있다', async () => {
      const res = await request(app)
        .get('/api/analytics/token-exchange/amount-distribution')
        .query({ startDate: '2024-01-01', endDate: '2024-12-31' });
      
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('ctaToNestDistribution');
      expect(res.body.data).to.have.property('nestToCtaDistribution');
      expect(res.body.data).to.have.property('userCountByExchanges');
    });
    
    it('교환 이후 행동 패턴을 조회할 수 있다', async () => {
      const res = await request(app)
        .get('/api/analytics/token-exchange/post-behavior')
        .query({ startDate: '2024-01-01', endDate: '2024-12-31', daysAfter: 30 });
      
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('ctaToNest');
      expect(res.body.data).to.have.property('nestToCta');
    });
  });
  
  // 테스트 케이스: XP 누적 관련
  describe('GET /api/analytics/xp-accumulation', () => {
    it('XP 누적 지표를 조회할 수 있다', async () => {
      const res = await request(app)
        .get('/api/analytics/xp-accumulation')
        .query({ startDate: '2024-01-01', endDate: '2024-12-31' });
      
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('summary');
      expect(res.body.data.summary.totalXp).to.equal(500000);
    });
    
    it('사용자 세그먼트별 XP 누적 패턴을 조회할 수 있다', async () => {
      const res = await request(app)
        .get('/api/analytics/xp-accumulation/user-segment')
        .query({ startDate: '2024-01-01', endDate: '2024-12-31' });
      
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('byJoinDate');
      expect(res.body.data).to.have.property('byActivityLevel');
      expect(res.body.data).to.have.property('byAuthProvider');
    });
    
    it('레벨 진행 속도를 조회할 수 있다', async () => {
      const res = await request(app)
        .get('/api/analytics/xp-accumulation/level-progression')
        .query({ startDate: '2024-01-01', endDate: '2024-12-31' });
      
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('levelProgression');
      expect(res.body.data).to.have.property('activityContribution');
      expect(res.body.data).to.have.property('levelUpFrequency');
    });
    
    it('활동 유형별 XP 효율성을 조회할 수 있다', async () => {
      const res = await request(app)
        .get('/api/analytics/xp-accumulation/activity-efficiency')
        .query({ startDate: '2024-01-01', endDate: '2024-12-31' });
      
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('activityEfficiency');
      expect(res.body.data).to.have.property('levelEstimations');
    });
  });
  
  // 테스트 케이스: NFT 보유 관련
  describe('GET /api/analytics/nft-ownership', () => {
    it('NFT 보유 지표를 조회할 수 있다', async () => {
      const res = await request(app)
        .get('/api/analytics/nft-ownership')
        .query({ startDate: '2024-01-01', endDate: '2024-12-31' });
      
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('summary');
      expect(res.body.data.summary.totalNfts).to.equal(5000);
    });
    
    it('사용자 세그먼트별 NFT 보유 패턴을 조회할 수 있다', async () => {
      const res = await request(app)
        .get('/api/analytics/nft-ownership/user-segment')
        .query({ startDate: '2024-01-01', endDate: '2024-12-31' });
      
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('byJoinDate');
      expect(res.body.data).to.have.property('byActivityLevel');
      expect(res.body.data).to.have.property('byAuthProvider');
    });
    
    it('NFT 보유와 사용자 참여도 상관관계를 조회할 수 있다', async () => {
      const res = await request(app)
        .get('/api/analytics/nft-ownership/engagement-correlation')
        .query({ startDate: '2024-01-01', endDate: '2024-12-31' });
      
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('overview');
      expect(res.body.data).to.have.property('engagementByNftCount');
      expect(res.body.data).to.have.property('engagementByRarity');
    });
  });
  
  // 테스트 케이스: 종합 대시보드
  describe('GET /api/analytics/dashboard', () => {
    it('종합 분석 대시보드 데이터를 조회할 수 있다', async () => {
      const res = await request(app)
        .get('/api/analytics/dashboard')
        .query({ startDate: '2024-01-01', endDate: '2024-12-31' });
      
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('userConversion');
      expect(res.body.data).to.have.property('walletRetention');
      expect(res.body.data).to.have.property('tokenExchange');
      expect(res.body.data).to.have.property('xpAccumulation');
      expect(res.body.data).to.have.property('nftOwnership');
    });
  });
  
  // 테스트 케이스: 오류 처리
  describe('에러 핸들링', () => {
    it('내부 서버 오류가 발생할 경우 적절한 에러 응답을 반환한다', async () => {
      // 오류 발생 시뮬레이션
      userConversion.calculateConversionMetrics.restore();
      sinon.stub(userConversion, 'calculateConversionMetrics').rejects(new Error('내부 서버 오류'));
      
      const res = await request(app)
        .get('/api/analytics/user-conversion')
        .query({ startDate: '2024-01-01', endDate: '2024-12-31' });
      
      expect(res.status).to.equal(500);
      expect(res.body).to.have.property('error');
    });
    
    it('인증되지 않은 사용자는 접근할 수 없다', async () => {
      // 인증 실패 시뮬레이션
      verifyTokenStub.restore();
      verifyTokenStub = sinon.stub(authMiddleware, 'verifyToken').callsFake((req, res, next) => {
        return res.status(401).json({ error: '인증이 필요합니다' });
      });
      
      const res = await request(app)
        .get('/api/analytics/user-conversion')
        .query({ startDate: '2024-01-01', endDate: '2024-12-31' });
      
      expect(res.status).to.equal(401);
    });
    
    it('관리자 권한이 없으면 접근할 수 없다', async () => {
      // 권한 없음 시뮬레이션
      verifyTokenStub.restore();
      isAdminStub.restore();
      
      verifyTokenStub = sinon.stub(authMiddleware, 'verifyToken').callsFake((req, res, next) => {
        req.user = { id: 'user123', role: 'user' };
        next();
      });
      
      isAdminStub = sinon.stub(roleMiddleware, 'isAdmin').callsFake((req, res, next) => {
        return res.status(403).json({ error: '접근 권한이 없습니다' });
      });
      
      const res = await request(app)
        .get('/api/analytics/user-conversion')
        .query({ startDate: '2024-01-01', endDate: '2024-12-31' });
      
      expect(res.status).to.equal(403);
    });
    
    it('잘못된 형식의 날짜가 입력되면 오류를 반환한다', async () => {
      const res = await request(app)
        .get('/api/analytics/user-conversion')
        .query({ startDate: 'invalid-date', endDate: '2024-12-31' });
      
      expect(res.status).to.equal(500);
    });
  });
});
