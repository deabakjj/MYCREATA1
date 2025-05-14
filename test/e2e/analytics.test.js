const { expect } = require('chai');
const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { beforeEach, afterEach, before, after, describe, it } = require('mocha');

// Helper functions
const waitForElement = async (driver, locator, timeout = 10000) => {
  return driver.wait(until.elementLocated(locator), timeout);
};

const waitForElementVisible = async (driver, element, timeout = 10000) => {
  return driver.wait(until.elementIsVisible(element), timeout);
};

describe('Analytics Dashboard E2E Tests', function() {
  let driver;
  let baseUrl = 'http://localhost:3000'; // Update based on your application's URL
  
  before(async function() {
    // This hook runs once before all tests
    this.timeout(30000); // Increase timeout for setup
    
    // Setup chrome options
    const options = new chrome.Options();
    options.addArguments('--headless'); // Run in headless mode for CI/CD pipelines
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    
    // Create and configure WebDriver
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
    
    // Login to the application
    await driver.get(`${baseUrl}/login`);
    await driver.findElement(By.name('email')).sendKeys('admin@nestplatform.com');
    await driver.findElement(By.name('password')).sendKeys('Secure!Password123');
    await driver.findElement(By.css('button[type="submit"]')).click();
    
    // Wait for dashboard to load after login
    await driver.wait(until.elementLocated(By.css('.dashboard-container')), 5000);
  });
  
  after(async function() {
    // This hook runs once after all tests
    if (driver) {
      await driver.quit();
    }
  });
  
  beforeEach(async function() {
    // Navigate to analytics dashboard before each test
    await driver.get(`${baseUrl}/admin/analytics`);
    await driver.wait(until.elementLocated(By.css('.analytics-dashboard')), 5000);
  });
  
  describe('Analytics Navigation', function() {
    it('Should navigate between different analytics sections', async function() {
      // Test navigation to user conversion page
      await driver.findElement(By.css('a[href*="user-conversion"]')).click();
      await waitForElement(driver, By.css('.user-conversion-page'));
      expect(await driver.findElement(By.css('h4')).getText()).to.include('사용자 전환률');
      
      // Test navigation to wallet retention page
      await driver.findElement(By.css('a[href*="wallet-retention"]')).click();
      await waitForElement(driver, By.css('.wallet-retention-page'));
      expect(await driver.findElement(By.css('h4')).getText()).to.include('지갑 유지율');
      
      // Test navigation to token exchange page
      await driver.findElement(By.css('a[href*="token-exchange"]')).click();
      await waitForElement(driver, By.css('.token-exchange-page'));
      expect(await driver.findElement(By.css('h4')).getText()).to.include('토큰 교환율');
      
      // Test navigation to XP accumulation page
      await driver.findElement(By.css('a[href*="xp-accumulation"]')).click();
      await waitForElement(driver, By.css('.xp-accumulation-page'));
      expect(await driver.findElement(By.css('h4')).getText()).to.include('XP 누적량');
      
      // Test navigation to NFT ownership page
      await driver.findElement(By.css('a[href*="nft-ownership"]')).click();
      await waitForElement(driver, By.css('.nft-ownership-page'));
      expect(await driver.findElement(By.css('h4')).getText()).to.include('NFT 보유');
    });
  });
  
  describe('Filtering Analytics Data', function() {
    it('Should filter data based on time range', async function() {
      // Navigate to user conversion page
      await driver.findElement(By.css('a[href*="user-conversion"]')).click();
      await waitForElement(driver, By.css('.user-conversion-page'));
      
      // Select different time ranges and verify filter is applied
      const timeRangeSelect = await driver.findElement(By.css('select[name="timeRange"]'));
      
      // Last 7 days
      await timeRangeSelect.click();
      await driver.findElement(By.css('option[value="last7Days"]')).click();
      await driver.wait(until.elementLocated(By.css('.loading-indicator, .chart-container')), 5000);
      await driver.wait(until.elementLocated(By.css('.chart-container')), 10000);
      
      // Last 30 days
      await timeRangeSelect.click();
      await driver.findElement(By.css('option[value="last30Days"]')).click();
      await driver.wait(until.elementLocated(By.css('.loading-indicator, .chart-container')), 5000);
      await driver.wait(until.elementLocated(By.css('.chart-container')), 10000);
      
      // Last 90 days
      await timeRangeSelect.click();
      await driver.findElement(By.css('option[value="last90Days"]')).click();
      await driver.wait(until.elementLocated(By.css('.loading-indicator, .chart-container')), 5000);
      await driver.wait(until.elementLocated(By.css('.chart-container')), 10000);
    });
    
    it('Should filter data based on user segment', async function() {
      // Navigate to XP accumulation page
      await driver.findElement(By.css('a[href*="xp-accumulation"]')).click();
      await waitForElement(driver, By.css('.xp-accumulation-page'));
      
      // Select different user segments and verify filter is applied
      const userSegmentSelect = await driver.findElement(By.css('select[name="userSegment"]'));
      
      // All users
      await userSegmentSelect.click();
      await driver.findElement(By.css('option[value="all"]')).click();
      await driver.wait(until.elementLocated(By.css('.loading-indicator, .chart-container')), 5000);
      await driver.wait(until.elementLocated(By.css('.chart-container')), 10000);
      
      // Beginners
      await userSegmentSelect.click();
      await driver.findElement(By.css('option[value="beginner"]')).click();
      await driver.wait(until.elementLocated(By.css('.loading-indicator, .chart-container')), 5000);
      await driver.wait(until.elementLocated(By.css('.chart-container')), 10000);
      
      // Intermediate users
      await userSegmentSelect.click();
      await driver.findElement(By.css('option[value="intermediate"]')).click();
      await driver.wait(until.elementLocated(By.css('.loading-indicator, .chart-container')), 5000);
      await driver.wait(until.elementLocated(By.css('.chart-container')), 10000);
    });
    
    it('Should filter data using custom date range', async function() {
      // Navigate to NFT ownership page
      await driver.findElement(By.css('a[href*="nft-ownership"]')).click();
      await waitForElement(driver, By.css('.nft-ownership-page'));
      
      // Select custom date range
      const timeRangeSelect = await driver.findElement(By.css('select[name="timeRange"]'));
      await timeRangeSelect.click();
      await driver.findElement(By.css('option[value="custom"]')).click();
      
      // Set start date (3 months ago)
      const startDateInput = await driver.findElement(By.css('input[name="startDate"]'));
      await startDateInput.clear();
      await startDateInput.sendKeys('2023-02-01');
      
      // Set end date (current month)
      const endDateInput = await driver.findElement(By.css('input[name="endDate"]'));
      await endDateInput.clear();
      await endDateInput.sendKeys('2023-05-01');
      
      // Apply filter
      await driver.findElement(By.css('button.apply-filter-btn')).click();
      
      // Wait for charts to update
      await driver.wait(until.elementLocated(By.css('.loading-indicator, .chart-container')), 5000);
      await driver.wait(until.elementLocated(By.css('.chart-container')), 10000);
    });
  });
  
  describe('Chart Interactions', function() {
    it('Should toggle between chart types', async function() {
      // Navigate to NFT ownership page
      await driver.findElement(By.css('a[href*="nft-ownership"]')).click();
      await waitForElement(driver, By.css('.nft-ownership-page'));
      
      // Find the chart toggle buttons
      const barChartButton = await driver.findElement(By.css('button[value="bar"]'));
      const pieChartButton = await driver.findElement(By.css('button[value="pie"]'));
      
      // Toggle to pie chart
      await pieChartButton.click();
      await driver.wait(until.elementLocated(By.css('.recharts-pie')), 5000);
      
      // Toggle back to bar chart
      await barChartButton.click();
      await driver.wait(until.elementLocated(By.css('.recharts-bar')), 5000);
    });
    
    it('Should display tooltip on chart hover', async function() {
      // Navigate to XP accumulation page
      await driver.findElement(By.css('a[href*="xp-accumulation"]')).click();
      await waitForElement(driver, By.css('.xp-accumulation-page'));
      
      // Wait for chart to load
      const chart = await waitForElement(driver, By.css('.recharts-wrapper'));
      
      // Hover over a chart point to display tooltip
      const chartArea = await driver.findElement(By.css('.recharts-surface'));
      await driver.actions().move({ origin: chartArea }).perform();
      
      // Verify tooltip is displayed
      await waitForElement(driver, By.css('.recharts-tooltip-wrapper'));
    });
  });
  
  describe('Data Export', function() {
    it('Should export analytics data in different formats', async function() {
      // Navigate to user conversion page
      await driver.findElement(By.css('a[href*="user-conversion"]')).click();
      await waitForElement(driver, By.css('.user-conversion-page'));
      
      // Find export buttons
      const exportButtons = await driver.findElements(By.css('.export-btn'));
      
      // Test CSV export
      await exportButtons[0].click(); // CSV button
      // Here we'd normally validate the downloaded file,
      // but in headless testing environment, we can only verify the click worked
      
      // Test Excel export
      await exportButtons[1].click(); // Excel button
      
      // Test JSON export
      await exportButtons[2].click(); // JSON button
    });
  });
  
  describe('Analytics Summary Cards', function() {
    it('Should display insights in summary cards', async function() {
      // Navigate to XP accumulation page
      await driver.findElement(By.css('a[href*="xp-accumulation"]')).click();
      await waitForElement(driver, By.css('.xp-accumulation-page'));
      
      // Wait for summary section to load
      await waitForElement(driver, By.css('.analytics-summary-card'));
      
      // Verify the presence of insights
      const summaryCards = await driver.findElements(By.css('.analytics-summary-card'));
      expect(summaryCards.length).to.be.greaterThan(0);
      
      // Verify content of insights
      const firstCardContent = await summaryCards[0].findElement(By.css('.card-content')).getText();
      expect(firstCardContent.length).to.be.greaterThan(0);
      
      // Verify insights bullet points
      const insightItems = await summaryCards[0].findElements(By.css('.insight-item'));
      expect(insightItems.length).to.be.greaterThan(0);
    });
  });
  
  describe('KPI Cards', function() {
    it('Should display KPI metrics with trends', async function() {
      // Navigate to NFT ownership page
      await driver.findElement(By.css('a[href*="nft-ownership"]')).click();
      await waitForElement(driver, By.css('.nft-ownership-page'));
      
      // Wait for KPI cards to load
      await waitForElement(driver, By.css('.kpi-card'));
      
      // Verify the presence of KPI cards
      const kpiCards = await driver.findElements(By.css('.kpi-card'));
      expect(kpiCards.length).to.be.greaterThan(0);
      
      // Verify content of KPI cards
      for (const card of kpiCards) {
        const title = await card.findElement(By.css('.kpi-title')).getText();
        const value = await card.findElement(By.css('.kpi-value')).getText();
        
        expect(title.length).to.be.greaterThan(0);
        expect(value.length).to.be.greaterThan(0);
      }
      
      // Check for trend indicators
      const trendIndicators = await driver.findElements(By.css('.trend-indicator'));
      expect(trendIndicators.length).to.be.greaterThan(0);
    });
  });
  
  describe('Responsive Design', function() {
    it('Should adapt layout for different screen sizes', async function() {
      // Navigate to token exchange page
      await driver.findElement(By.css('a[href*="token-exchange"]')).click();
      await waitForElement(driver, By.css('.token-exchange-page'));
      
      // Test different screen sizes
      const screenSizes = [
        { width: 1920, height: 1080 },  // Desktop
        { width: 768, height: 1024 },   // Tablet
        { width: 375, height: 812 }     // Mobile
      ];
      
      for (const size of screenSizes) {
        // Resize window
        await driver.manage().window().setRect(size);
        
        // Wait for layout to adjust
        await driver.sleep(1000);
        
        // Check if charts are visible
        const charts = await driver.findElements(By.css('.recharts-wrapper'));
        expect(charts.length).to.be.greaterThan(0);
        
        // For mobile view, check if menu is collapsed
        if (size.width <= 768) {
          const menuToggle = await driver.findElements(By.css('.menu-toggle-btn'));
          if (menuToggle.length > 0) {
            // Check if menu is collapsed
            const sideMenu = await driver.findElement(By.css('.side-menu'));
            const isVisible = await sideMenu.isDisplayed();
            expect(isVisible).to.be.false;
            
            // Toggle menu
            await menuToggle[0].click();
            await driver.wait(until.elementIsVisible(sideMenu), 3000);
            
            // Close menu for next tests
            await menuToggle[0].click();
            await driver.wait(until.elementIsNotVisible(sideMenu), 3000);
          }
        }
      }
    });
  });
});
