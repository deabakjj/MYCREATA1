const NestSwap = artifacts.require("NestSwap");
const NestToken = artifacts.require("NestToken");
const { expectRevert, expectEvent, BN } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');

// CTA 토큰을 시뮬레이션하기 위한 모의 컨트랙트
const MockERC20 = artifacts.require("NestToken"); // CTA 토큰 대신 NestToken을 사용

contract("NestSwap", function (accounts) {
  const [admin, rateSetter, whitelistManager, withdrawalRole, user1, user2, user3] = accounts;
  
  // 초기 설정값
  const initialCtaToNestRate = new BN("1000"); // 1 CTA = 1000 NEST
  const initialNestToCtaRate = new BN(web3.utils.toWei("0.001", "ether")); // 1 NEST = 0.001 CTA
  const defaultDailyLimit = new BN(web3.utils.toWei("100", "ether")); // 100 CTA
  
  // 테스트용 금액
  const ctaAmount = new BN(web3.utils.toWei("10", "ether")); // 10 CTA
  const nestAmount = new BN(web3.utils.toWei("10000", "ether")); // 10000 NEST
  
  beforeEach(async function () {
    // 모의 CTA 토큰 배포
    this.ctaToken = await MockERC20.new(admin);
    
    // NEST 토큰 배포
    this.nestToken = await NestToken.new(admin);
    
    // 스왑 컨트랙트 배포
    this.swap = await NestSwap.new(
      admin,
      this.ctaToken.address,
      this.nestToken.address,
      initialCtaToNestRate,
      initialNestToCtaRate,
      defaultDailyLimit
    );
    
    // 역할 부여
    await this.swap.grantRole(await this.swap.RATE_SETTER_ROLE(), rateSetter, { from: admin });
    await this.swap.grantRole(await this.swap.WHITELIST_MANAGER_ROLE(), whitelistManager, { from: admin });
    await this.swap.grantRole(await this.swap.WITHDRAWAL_ROLE(), withdrawalRole, { from: admin });
    
    // 사용자에게 토큰 전송
    await this.ctaToken.transfer(user1, ctaAmount.mul(new BN('10')), { from: admin });
    await this.nestToken.transfer(user1, nestAmount.mul(new BN('10')), { from: admin });
    
    // 스왑 컨트랙트에 토큰 공급
    await this.ctaToken.transfer(this.swap.address, ctaAmount.mul(new BN('100')), { from: admin });
    await this.nestToken.transfer(this.swap.address, nestAmount.mul(new BN('100')), { from: admin });
    
    // 토큰 사용 승인
    await this.ctaToken.approve(this.swap.address, ctaAmount.mul(new BN('10')), { from: user1 });
    await this.nestToken.approve(this.swap.address, nestAmount.mul(new BN('10')), { from: user1 });
  });

  describe("초기 상태", function () {
    it("토큰 주소가 올바르게 설정되어야 함", async function () {
      const ctaTokenAddress = await this.swap.ctaToken();
      const nestTokenAddress = await this.swap.nestToken();
      
      assert.equal(ctaTokenAddress, this.ctaToken.address, "CTA 토큰 주소가 잘못됨");
      assert.equal(nestTokenAddress, this.nestToken.address, "NEST 토큰 주소가 잘못됨");
    });

    it("교환 비율이 올바르게 설정되어야 함", async function () {
      const ctaToNestRate = await this.swap.ctaToNestRate();
      const nestToCtaRate = await this.swap.nestToCtaRate();
      
      assert.equal(ctaToNestRate.toString(), initialCtaToNestRate.toString(), "CTA->NEST 교환 비율이 잘못됨");
      assert.equal(nestToCtaRate.toString(), initialNestToCtaRate.toString(), "NEST->CTA 교환 비율이 잘못됨");
    });

    it("기본 일일 한도가 올바르게 설정되어야 함", async function () {
      const limit = await this.swap.defaultDailyLimit();
      assert.equal(limit.toString(), defaultDailyLimit.toString(), "기본 일일 한도가 잘못됨");
    });

    it("화이트리스트 모드가 기본적으로 비활성화되어야 함", async function () {
      const whitelistMode = await this.swap.whitelistMode();
      assert.equal(whitelistMode, false, "화이트리스트 모드 상태가 잘못됨");
    });

    it("관리자에게 모든 역할이 부여되어야 함", async function () {
      const isDefaultAdmin = await this.swap.hasRole(await this.swap.DEFAULT_ADMIN_ROLE(), admin);
      const isPauser = await this.swap.hasRole(await this.swap.PAUSER_ROLE(), admin);
      const isRateSetter = await this.swap.hasRole(await this.swap.RATE_SETTER_ROLE(), admin);
      const isWhitelistManager = await this.swap.hasRole(await this.swap.WHITELIST_MANAGER_ROLE(), admin);
      const isWithdrawalRole = await this.swap.hasRole(await this.swap.WITHDRAWAL_ROLE(), admin);

      assert.equal(isDefaultAdmin, true, "관리자에게 DEFAULT_ADMIN_ROLE이 없음");
      assert.equal(isPauser, true, "관리자에게 PAUSER_ROLE이 없음");
      assert.equal(isRateSetter, true, "관리자에게 RATE_SETTER_ROLE이 없음");
      assert.equal(isWhitelistManager, true, "관리자에게 WHITELIST_MANAGER_ROLE이 없음");
      assert.equal(isWithdrawalRole, true, "관리자에게 WITHDRAWAL_ROLE이 없음");
    });
  });

  describe("CTA->NEST 교환", function () {
    it("CTA를 NEST로 교환해야 함", async function () {
      const userCtaBalanceBefore = await this.ctaToken.balanceOf(user1);
      const userNestBalanceBefore = await this.nestToken.balanceOf(user1);
      
      const swapAmount = new BN(web3.utils.toWei("1", "ether")); // 1 CTA
      const expectedNestAmount = swapAmount.mul(initialCtaToNestRate); // 1 CTA * 1000 = 1000 NEST
      
      const result = await this.swap.swapCtaToNest(swapAmount, { from: user1 });
      
      expectEvent(result, "SwapCtaToNest", {
        user: user1,
        ctaAmount: swapAmount,
        nestAmount: expectedNestAmount
      });
      
      const userCtaBalanceAfter = await this.ctaToken.balanceOf(user1);
      const userNestBalanceAfter = await this.nestToken.balanceOf(user1);
      
      assert.equal(
        userCtaBalanceBefore.sub(userCtaBalanceAfter).toString(),
        swapAmount.toString(),
        "CTA 잔액 변화가 잘못됨"
      );
      
      assert.equal(
        userNestBalanceAfter.sub(userNestBalanceBefore).toString(),
        expectedNestAmount.toString(),
        "NEST 잔액 변화가 잘못됨"
      );
    });

    it("0보다 큰 금액만 교환할 수 있어야 함", async function () {
      await expectRevert(
        this.swap.swapCtaToNest(0, { from: user1 }),
        "Amount must be positive"
      );
    });

    it("컨트랙트에 충분한 NEST가 없으면 교환이 실패해야 함", async function () {
      // 컨트랙트의 모든 NEST 토큰을 인출
      await this.nestToken.transfer(admin, await this.nestToken.balanceOf(this.swap.address), { from: admin });
      
      await expectRevert(
        this.swap.swapCtaToNest(ctaAmount, { from: user1 }),
        "Insufficient NEST in contract"
      );
    });
  });

  describe("NEST->CTA 교환", function () {
    it("NEST를 CTA로 교환해야 함", async function () {
      const userCtaBalanceBefore = await this.ctaToken.balanceOf(user1);
      const userNestBalanceBefore = await this.nestToken.balanceOf(user1);
      
      const swapAmount = new BN(web3.utils.toWei("1000", "ether")); // 1000 NEST
      const expectedCtaAmount = swapAmount.mul(initialNestToCtaRate).div(new BN(web3.utils.toWei("1", "ether"))); // 1000 NEST * 0.001 = 1 CTA
      
      const result = await this.swap.swapNestToCta(swapAmount, { from: user1 });
      
      expectEvent(result, "SwapNestToCta", {
        user: user1,
        nestAmount: swapAmount,
        ctaAmount: expectedCtaAmount
      });
      
      const userCtaBalanceAfter = await this.ctaToken.balanceOf(user1);
      const userNestBalanceAfter = await this.nestToken.balanceOf(user1);
      
      assert.equal(
        userCtaBalanceAfter.sub(userCtaBalanceBefore).toString(),
        expectedCtaAmount.toString(),
        "CTA 잔액 변화가 잘못됨"
      );
      
      assert.equal(
        userNestBalanceBefore.sub(userNestBalanceAfter).toString(),
        swapAmount.toString(),
        "NEST 잔액 변화가 잘못됨"
      );
    });

    it("0보다 큰 금액만 교환할 수 있어야 함", async function () {
      await expectRevert(
        this.swap.swapNestToCta(0, { from: user1 }),
        "Amount must be positive"
      );
    });

    it("컨트랙트에 충분한 CTA가 없으면 교환이 실패해야 함", async function () {
      // 컨트랙트의 모든 CTA 토큰을 인출
      await this.ctaToken.transfer(admin, await this.ctaToken.balanceOf(this.swap.address), { from: admin });
      
      await expectRevert(
        this.swap.swapNestToCta(nestAmount, { from: user1 }),
        "Insufficient CTA in contract"
      );
    });
  });

  describe("일일 한도", function () {
    beforeEach(async function () {
      // 기본 일일 한도를 5 CTA로 설정
      await this.swap.setDefaultDailyLimit(web3.utils.toWei("5", "ether"), { from: whitelistManager });
    });

    it("일일 한도 내에서 교환이 성공해야 함", async function () {
      const swapAmount = new BN(web3.utils.toWei("3", "ether")); // 3 CTA
      
      // 첫 번째 교환
      await this.swap.swapCtaToNest(swapAmount, { from: user1 });
      
      // 두 번째 교환 (한도 내)
      await this.swap.swapCtaToNest(swapAmount.div(new BN("3")), { from: user1 }); // 1 CTA
    });

    it("일일 한도를 초과하면 교환이 실패해야 함", async function () {
      const swapAmount = new BN(web3.utils.toWei("3", "ether")); // 3 CTA
      
      // 첫 번째 교환
      await this.swap.swapCtaToNest(swapAmount, { from: user1 });
      
      // 두 번째 교환 (한도 초과)
      await expectRevert(
        this.swap.swapCtaToNest(swapAmount, { from: user1 }),
        "Daily limit exceeded"
      );
    });

    it("사용자별 일일 한도가 설정되어야 함", async function () {
      // user1의 일일 한도를 10 CTA로 설정
      await this.swap.setDailyLimit(user1, web3.utils.toWei("10", "ether"), { from: whitelistManager });
      
      const swapAmount = new BN(web3.utils.toWei("7", "ether")); // 7 CTA
      
      // 한도 내에서 교환 (기본 한도는 5 CTA지만 user1은 10 CTA)
      await this.swap.swapCtaToNest(swapAmount, { from: user1 });
      
      // user2는 기본 한도 적용 (5 CTA)
      await this.ctaToken.transfer(user2, swapAmount, { from: admin });
      await this.ctaToken.approve(this.swap.address, swapAmount, { from: user2 });
      
      await expectRevert(
        this.swap.swapCtaToNest(swapAmount, { from: user2 }),
        "Daily limit exceeded"
      );
    });

    it("일일 한도 정보를 조회해야 함", async function () {
      // user1의 일일 한도를 10 CTA로 설정
      await this.swap.setDailyLimit(user1, web3.utils.toWei("10", "ether"), { from: whitelistManager });
      
      const swapAmount = new BN(web3.utils.toWei("3", "ether")); // 3 CTA
      
      // 교환 수행
      await this.swap.swapCtaToNest(swapAmount, { from: user1 });
      
      const [limit, used, remaining] = await this.swap.getDailyLimitInfo(user1);
      
      assert.equal(limit.toString(), web3.utils.toWei("10", "ether"), "일일 한도가 잘못됨");
      assert.equal(used.toString(), swapAmount.toString(), "사용된 한도가 잘못됨");
      assert.equal(remaining.toString(), new BN(web3.utils.toWei("7", "ether")).toString(), "남은 한도가 잘못됨");
    });
  });

  describe("화이트리스트 기능", function () {
    beforeEach(async function () {
      // 화이트리스트 모드 활성화
      await this.swap.setWhitelistMode(true, { from: whitelistManager });
      
      // user1을 화이트리스트에 추가
      await this.swap.addToWhitelist(user1, { from: whitelistManager });
    });

    it("화이트리스트에 있는 사용자만 교환할 수 있어야 함", async function () {
      const swapAmount = new BN(web3.utils.toWei("1", "ether")); // 1 CTA
      
      // user1 (화이트리스트에 있음)
      await this.swap.swapCtaToNest(swapAmount, { from: user1 });
      
      // user2 (화이트리스트에 없음)
      await this.ctaToken.transfer(user2, swapAmount, { from: admin });
      await this.ctaToken.approve(this.swap.address, swapAmount, { from: user2 });
      
      await expectRevert(
        this.swap.swapCtaToNest(swapAmount, { from: user2 }),
        "Not whitelisted"
      );
    });

    it("화이트리스트 모드를 비활성화하면 모든 사용자가 교환할 수 있어야 함", async function () {
      await this.swap.setWhitelistMode(false, { from: whitelistManager });
      
      const swapAmount = new BN(web3.utils.toWei("1", "ether")); // 1 CTA
      
      // user2 (화이트리스트에 없음)
      await this.ctaToken.transfer(user2, swapAmount, { from: admin });
      await this.ctaToken.approve(this.swap.address, swapAmount, { from: user2 });
      
      await this.swap.swapCtaToNest(swapAmount, { from: user2 });
    });

    it("여러 주소를 화이트리스트에 추가해야 함", async function () {
      await this.swap.addMultipleToWhitelist([user2, user3], { from: whitelistManager });
      
      const swapAmount = new BN(web3.utils.toWei("1", "ether")); // 1 CTA
      
      // user2 (이제 화이트리스트에 있음)
      await this.ctaToken.transfer(user2, swapAmount, { from: admin });
      await this.ctaToken.approve(this.swap.address, swapAmount, { from: user2 });
      
      await this.swap.swapCtaToNest(swapAmount, { from: user2 });
    });

    it("주소를 화이트리스트에서 제거해야 함", async function () {
      await this.swap.removeFromWhitelist(user1, { from: whitelistManager });
      
      const swapAmount = new BN(web3.utils.toWei("1", "ether")); // 1 CTA
      
      await expectRevert(
        this.swap.swapCtaToNest(swapAmount, { from: user1 }),
        "Not whitelisted"
      );
    });
  });

  describe("교환 비율 설정", function () {
    it("교환 비율을 변경해야 함", async function () {
      const newCtaToNestRate = new BN("2000"); // 1 CTA = 2000 NEST
      const newNestToCtaRate = new BN(web3.utils.toWei("0.0005", "ether")); // 1 NEST = 0.0005 CTA
      
      const result = await this.swap.setRates(newCtaToNestRate, newNestToCtaRate, { from: rateSetter });
      
      expectEvent(result, "RateUpdated", {
        ctaToNestRate: newCtaToNestRate,
        nestToCtaRate: newNestToCtaRate
      });
      
      const ctaToNestRate = await this.swap.ctaToNestRate();
      const nestToCtaRate = await this.swap.nestToCtaRate();
      
      assert.equal(ctaToNestRate.toString(), newCtaToNestRate.toString(), "CTA->NEST 교환 비율 변경 실패");
      assert.equal(nestToCtaRate.toString(), newNestToCtaRate.toString(), "NEST->CTA 교환 비율 변경 실패");
    });

    it("권한이 없는 사용자는 교환 비율을 변경할 수 없어야 함", async function () {
      await expectRevert(
        this.swap.setRates(2000, web3.utils.toWei("0.0005", "ether"), { from: user1 }),
        "AccessControl: account " + user1.toLowerCase() + " is missing role " + await this.swap.RATE_SETTER_ROLE()
      );
    });

    it("0보다 큰 교환 비율만 설정할 수 있어야 함", async function () {
      await expectRevert(
        this.swap.setRates(0, web3.utils.toWei("0.0005", "ether"), { from: rateSetter }),
        "CTA to NEST rate must be positive"
      );
      
      await expectRevert(
        this.swap.setRates(2000, 0, { from: rateSetter }),
        "NEST to CTA rate must be positive"
      );
    });

    it("새 교환 비율이 교환에 적용되어야 함", async function () {
      const newCtaToNestRate = new BN("2000"); // 1 CTA = 2000 NEST
      await this.swap.setRates(newCtaToNestRate, initialNestToCtaRate, { from: rateSetter });
      
      const swapAmount = new BN(web3.utils.toWei("1", "ether")); // 1 CTA
      const expectedNestAmount = swapAmount.mul(newCtaToNestRate); // 1 CTA * 2000 = 2000 NEST
      
      const result = await this.swap.swapCtaToNest(swapAmount, { from: user1 });
      
      expectEvent(result, "SwapCtaToNest", {
        user: user1,
        ctaAmount: swapAmount,
        nestAmount: expectedNestAmount
      });
    });
  });

  describe("토큰 인출", function () {
    it("관리자가 컨트랙트에서 토큰을 인출해야 함", async function () {
      const withdrawAmount = new BN(web3.utils.toWei("5", "ether"));
      const initialBalance = await this.ctaToken.balanceOf(admin);
      
      const result = await this.swap.withdrawTokens(
        this.ctaToken.address,
        admin,
        withdrawAmount,
        { from: withdrawalRole }
      );
      
      expectEvent(result, "TokensWithdrawn", {
        _token: this.ctaToken.address,
        _to: admin,
        _amount: withdrawAmount
      });
      
      const finalBalance = await this.ctaToken.balanceOf(admin);
      assert.equal(
        finalBalance.sub(initialBalance).toString(),
        withdrawAmount.toString(),
        "인출된 금액이 잘못됨"
      );
    });

    it("권한이 없는 사용자는 토큰을 인출할 수 없어야 함", async function () {
      await expectRevert(
        this.swap.withdrawTokens(this.ctaToken.address, user1, 1000, { from: user1 }),
        "AccessControl: account " + user1.toLowerCase() + " is missing role " + await this.swap.WITHDRAWAL_ROLE()
      );
    });

    it("0 주소로는 토큰을 인출할 수 없어야 함", async function () {
      await expectRevert(
        this.swap.withdrawTokens(
          this.ctaToken.address,
          "0x0000000000000000000000000000000000000000",
          1000,
          { from: withdrawalRole }
        ),
        "Cannot withdraw to zero address"
      );
    });
  });

  describe("일시 중지 기능", function () {
    beforeEach(async function () {
      await this.swap.pause({ from: admin });
    });

    it("일시 중지되면 교환이 실패해야 함", async function () {
      await expectRevert(
        this.swap.swapCtaToNest(1000, { from: user1 }),
        "Pausable: paused"
      );
      
      await expectRevert(
        this.swap.swapNestToCta(1000, { from: user1 }),
        "Pausable: paused"
      );
    });

    it("일시 중지 해제 후 교환이 다시 가능해야 함", async function () {
      await this.swap.unpause({ from: admin });
      
      const swapAmount = new BN(web3.utils.toWei("1", "ether")); // 1 CTA
      await this.swap.swapCtaToNest(swapAmount, { from: user1 });
    });

    it("권한이 없는 사용자는 컨트랙트를 일시 중지/해제할 수 없어야 함", async function () {
      await expectRevert(
        this.swap.unpause({ from: user1 }),
        "AccessControl: account " + user1.toLowerCase() + " is missing role " + await this.swap.PAUSER_ROLE()
      );
    });
  });
});
