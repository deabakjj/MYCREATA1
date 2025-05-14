/**
 * 통합 UI 테스트
 * 
 * 이 파일은 통합 관리 UI에 대한 엔드-투-엔드 테스트를 포함합니다.
 * Puppeteer를 사용하여 실제 브라우저에서 UI 상호작용을 테스트합니다.
 */

const puppeteer = require('puppeteer');
const { expect } = require('chai');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

// 테스트 모델과 설정
const User = require('../../src/models/user');
const Integration = require('../../src/models/integration');
const { encryptData } = require('../../src/utils/encryption');

describe('통합 UI 테스트', function() {
  // 타임아웃 증가
  this.timeout(30000);
  
  // 테스트 설정
  let browser;
  let page;
  let mongoServer;
  let adminUser;
  let adminToken;
  let testIntegration;
  
  before(async function() {
    // 인메모리 몽고DB 시작
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // 몽고DB 연결
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // 테스트 관리자 생성
    adminUser = new User({
      email: 'admin@nest.test',
      password: 'password123',
      name: '관리자',
      role: 'admin'
    });
    await adminUser.save();
    
    // JWT 토큰 생성
    adminToken = jwt.sign(
      { id: adminUser._id, role: adminUser.role },
      process.env.JWT_SECRET || 'nest-platform-jwt-secret',
      { expiresIn: '1h' }
    );
    
    // 테스트 통합 생성
    testIntegration = new Integration({
      name: 'Twitter 테스트 통합',
      type: 'twitter',
      category: 'social',
      description: 'UI 테스트용 트위터 통합',
      enabled: true,
      config: {
        apiKey: encryptData('twitter_api_key'),
        apiSecret: encryptData('twitter_api_secret')
      },
      createdBy: adminUser._id
    });
    await testIntegration.save();
    
    // 브라우저 실행
    browser = await puppeteer.launch({ 
      headless: true, // 테스트 디버깅을 위해 false로 설정 가능
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // 새 페이지 열기
    page = await browser.newPage();
    
    // 뷰포트 설정
    await page.setViewport({ width: 1280, height: 800 });
    
    // 토큰 설정 (로컬 스토리지)
    await page.evaluateOnNewDocument((token) => {
      localStorage.setItem('authToken', token);
    }, adminToken);
  });
  
  after(async function() {
    // 브라우저 닫기
    if (browser) {
      await browser.close();
    }
    
    // 데이터베이스 연결 종료
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  
  describe('통합 설정 페이지', function() {
    it('통합 설정 페이지가 정상적으로 로드되어야 함', async function() {
      // 통합 설정 페이지로 이동
      await page.goto('http://localhost:3000/admin/settings/integrations', { waitUntil: 'networkidle2' });
      
      // 페이지 타이틀 확인
      const pageTitle = await page.$eval('h5', el => el.textContent);
      expect(pageTitle).to.include('Integration Settings');
      
      // 트위터 통합이 표시되는지 확인
      const twitterIntegration = await page.waitForSelector('div:has-text("Twitter 테스트 통합")');
      expect(twitterIntegration).to.exist;
    });
    
    it('통합 상세 정보를 표시해야 함', async function() {
      // 통합 설정 페이지로 이동
      await page.goto('http://localhost:3000/admin/settings/integrations', { waitUntil: 'networkidle2' });
      
      // 트위터 통합 아코디언 클릭
      await page.click('div:has-text("Twitter 테스트 통합")');
      
      // 상세 정보가 표시되는지 확인
      await page.waitForSelector('div:has-text("UI 테스트용 트위터 통합")');
      
      // '활성' 칩이 표시되어야 함
      const activeChip = await page.$('span:has-text("Active")');
      expect(activeChip).to.exist;
    });
    
    it('새 통합을 추가할 수 있어야 함', async function() {
      // 통합 설정 페이지로 이동
      await page.goto('http://localhost:3000/admin/settings/integrations', { waitUntil: 'networkidle2' });
      
      // 통합 추가 버튼 클릭
      await page.click('button:has-text("Add Integration")');
      
      // 다이얼로그가 열리는지 확인
      await page.waitForSelector('div[role="dialog"]');
      
      // 통합 유형 선택
      await page.click('div[role="button"]');
      await page.waitForSelector('li[role="option"]:has-text("Discord")');
      await page.click('li[role="option"]:has-text("Discord")');
      
      // 추가 버튼 클릭
      await page.click('button:has-text("Add")');
      
      // 편집 폼이 표시되는지 확인
      await page.waitForSelector('h5:has-text("Add New Integration")');
      
      // 이름 입력
      await page.type('input[name="name"]', 'Discord 테스트 통합');
      
      // 설명 입력
      await page.type('textarea[name="description"]', 'UI 테스트용 디스코드 통합');
      
      // 저장 버튼 클릭
      await page.click('button:has-text("Save Integration")');
      
      // 저장 성공 메시지 확인
      await page.waitForSelector('div:has-text("Integration added successfully")');
      
      // 목록에 새 통합이 표시되는지 확인
      const discordIntegration = await page.waitForSelector('div:has-text("Discord 테스트 통합")');
      expect(discordIntegration).to.exist;
    });
    
    it('통합을 편집할 수 있어야 함', async function() {
      // 통합 설정 페이지로 이동
      await page.goto('http://localhost:3000/admin/settings/integrations', { waitUntil: 'networkidle2' });
      
      // 트위터 통합 아코디언 클릭
      await page.click('div:has-text("Twitter 테스트 통합")');
      
      // 편집 버튼 클릭
      await page.waitForSelector('button:has-text("Edit")');
      await page.click('button:has-text("Edit")');
      
      // 편집 폼이 표시되는지 확인
      await page.waitForSelector('h5:has-text("Edit Integration")');
      
      // 이름 업데이트
      await page.evaluate(() => {
        document.querySelector('input[name="name"]').value = '';
      });
      await page.type('input[name="name"]', 'Twitter 업데이트된 통합');
      
      // 저장 버튼 클릭
      await page.click('button:has-text("Save Integration")');
      
      // 저장 성공 메시지 확인
      await page.waitForSelector('div:has-text("Integration updated successfully")');
      
      // 목록에 업데이트된 통합이 표시되는지 확인
      const updatedIntegration = await page.waitForSelector('div:has-text("Twitter 업데이트된 통합")');
      expect(updatedIntegration).to.exist;
    });
    
    it('통합을 테스트할 수 있어야 함', async function() {
      // 통합 설정 페이지로 이동
      await page.goto('http://localhost:3000/admin/settings/integrations', { waitUntil: 'networkidle2' });
      
      // 트위터 통합 아코디언 클릭
      await page.click('div:has-text("Twitter 업데이트된 통합")');
      
      // 테스트 연결 버튼 클릭
      await page.waitForSelector('button:has-text("Test Connection")');
      await page.click('button:has-text("Test Connection")');
      
      // 테스트 결과 확인 (mocked API 응답)
      await page.waitForSelector('div:has-text("Connection test completed")');
    });
    
    it('통합을 삭제할 수 있어야 함', async function() {
      // 통합 설정 페이지로 이동
      await page.goto('http://localhost:3000/admin/settings/integrations', { waitUntil: 'networkidle2' });
      
      // Discord 통합 아코디언 클릭
      await page.click('div:has-text("Discord 테스트 통합")');
      
      // 삭제 버튼 클릭
      await page.waitForSelector('button:has-text("Delete")');
      await page.click('button:has-text("Delete")');
      
      // 확인 대화상자 처리
      page.on('dialog', async dialog => {
        expect(dialog.type()).to.equal('confirm');
        expect(dialog.message()).to.include('Are you sure');
        await dialog.accept();
      });
      
      // 삭제 성공 메시지 확인
      await page.waitForSelector('div:has-text("Integration removed successfully")');
      
      // 통합이 목록에서 제거되었는지 확인
      await page.waitForTimeout(1000); // 애니메이션 및 DOM 업데이트 대기
      const content = await page.content();
      expect(content).to.not.include('Discord 테스트 통합');
    });
  });
  
  describe('통합 기능 테스트', function() {
    it('소셜 미디어 공유 UI 흐름을 완료해야 함', async function() {
      // 미션 상세 페이지로 이동
      await page.goto(`http://localhost:3000/missions/detail/${testMission._id}`, { waitUntil: 'networkidle2' });
      
      // 미션 참여 버튼 클릭
      await page.click('button:has-text("Start Mission")');
      
      // AI 콘텐츠 생성 버튼 클릭
      await page.click('button:has-text("Generate Content")');
      
      // 생성된 콘텐츠가 표시되는지 확인
      await page.waitForSelector('textarea:has-text("AI가 생성한")');
      
      // 공유 버튼 클릭
      await page.click('button:has-text("Share on Twitter")');
      
      // 공유 성공 메시지 확인
      await page.waitForSelector('div:has-text("Successfully shared on Twitter")');
      
      // 미션 완료 버튼 클릭
      await page.click('button:has-text("Complete Mission")');
      
      // 완료 성공 메시지 확인
      await page.waitForSelector('div:has-text("Mission completed successfully")');
      
      // 보상 정보가 표시되는지 확인
      await page.waitForSelector('div:has-text("You earned")');
    });
    
    it('OAuth 인증 UI 흐름을 시뮬레이션해야 함', async function() {
      // 통합 설정 페이지로 이동
      await page.goto('http://localhost:3000/admin/settings/integrations', { waitUntil: 'networkidle2' });
      
      // 새 통합 추가 버튼 클릭
      await page.click('button:has-text("Add Integration")');
      
      // 다이얼로그가 열리는지 확인
      await page.waitForSelector('div[role="dialog"]');
      
      // OAuth 기반 통합 유형 선택 (Facebook)
      await page.click('div[role="button"]');
      await page.waitForSelector('li[role="option"]:has-text("Facebook")');
      await page.click('li[role="option"]:has-text("Facebook")');
      
      // 추가 버튼 클릭
      await page.click('button:has-text("Add")');
      
      // 편집 폼이 표시되는지 확인
      await page.waitForSelector('h5:has-text("Add New Integration")');
      
      // 이름 및 설정 입력
      await page.type('input[name="name"]', 'Facebook OAuth 테스트');
      
      // 활성화 스위치 켜기
      await page.click('span.MuiSwitch-root');
      
      // 저장 버튼 클릭
      await page.click('button:has-text("Save Integration")');
      
      // 저장 성공 메시지 확인
      await page.waitForSelector('div:has-text("Integration added successfully")');
      
      // Facebook 통합 아코디언 클릭
      await page.click('div:has-text("Facebook OAuth 테스트")');
      
      // OAuth 인증 버튼이 있는지 확인 (실제로는 테스트 환경에서 OAuth 인증을 시뮬레이션만 함)
      const oauthElement = await page.$('div:has-text("Redirect URI")');
      expect(oauthElement).to.exist;
    });
  });
});
