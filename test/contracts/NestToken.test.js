const NestToken = artifacts.require("NestToken");
const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');

contract("NestToken", function (accounts) {
  const [admin, user1, user2, user3] = accounts;
  const TOTAL_SUPPLY = web3.utils.toBN("10000000000000000000000000000"); // 100억 토큰 (18 소수점)

  // 각 테스트 전에 새로운 토큰 컨트랙트 배포
  beforeEach(async function () {
    this.token = await NestToken.new(admin);
  });

  describe("초기 상태", function () {
    it("토큰 이름이 올바르게 설정되어야 함", async function () {
      const name = await this.token.name();
      assert.equal(name, "Nest Token", "토큰 이름이 잘못됨");
    });

    it("토큰 심볼이 올바르게 설정되어야 함", async function () {
      const symbol = await this.token.symbol();
      assert.equal(symbol, "NEST", "토큰 심볼이 잘못됨");
    });

    it("총 공급량이 올바르게 설정되어야 함", async function () {
      const totalSupply = await this.token.totalSupply();
      assert.equal(totalSupply.toString(), TOTAL_SUPPLY.toString(), "총 공급량이 잘못됨");
    });

    it("관리자가 모든 토큰을 가지고 있어야 함", async function () {
      const adminBalance = await this.token.balanceOf(admin);
      assert.equal(adminBalance.toString(), TOTAL_SUPPLY.toString(), "관리자 잔액이 잘못됨");
    });

    it("관리자에게 모든 역할이 부여되어야 함", async function () {
      const isDefaultAdmin = await this.token.hasRole(await this.token.DEFAULT_ADMIN_ROLE(), admin);
      const isPauser = await this.token.hasRole(await this.token.PAUSER_ROLE(), admin);
      const isMinter = await this.token.hasRole(await this.token.MINTER_ROLE(), admin);
      const isBlacklister = await this.token.hasRole(await this.token.BLACKLISTER_ROLE(), admin);
      const isWhitelister = await this.token.hasRole(await this.token.WHITELISTER_ROLE(), admin);

      assert.equal(isDefaultAdmin, true, "관리자에게 DEFAULT_ADMIN_ROLE이 없음");
      assert.equal(isPauser, true, "관리자에게 PAUSER_ROLE이 없음");
      assert.equal(isMinter, true, "관리자에게 MINTER_ROLE이 없음");
      assert.equal(isBlacklister, true, "관리자에게 BLACKLISTER_ROLE이 없음");
      assert.equal(isWhitelister, true, "관리자에게 WHITELISTER_ROLE이 없음");
    });

    it("화이트리스트 모드가 기본적으로 비활성화되어야 함", async function () {
      const whitelistMode = await this.token.whitelistMode();
      assert.equal(whitelistMode, false, "화이트리스트 모드 상태가 잘못됨");
    });
  });

  describe("토큰 전송", function () {
    const amount = web3.utils.toBN("1000000000000000000"); // 1 NEST

    beforeEach(async function () {
      // 테스트 사용자에게 토큰 전송
      await this.token.transfer(user1, amount, { from: admin });
    });

    it("토큰을 성공적으로 전송해야 함", async function () {
      await this.token.transfer(user2, amount, { from: user1 });
      const user2Balance = await this.token.balanceOf(user2);
      assert.equal(user2Balance.toString(), amount.toString(), "전송된 금액이 잘못됨");
    });

    it("잔액이 부족하면 전송이 실패해야 함", async function () {
      const tooMuch = amount.mul(web3.utils.toBN("2"));
      await expectRevert(
        this.token.transfer(user2, tooMuch, { from: user1 }),
        "ERC20: transfer amount exceeds balance"
      );
    });

    it("일시 중지되면 전송이 실패해야 함", async function () {
      await this.token.pause({ from: admin });
      await expectRevert(
        this.token.transfer(user2, amount, { from: user1 }),
        "Pausable: paused"
      );
    });
  });

  describe("화이트리스트 기능", function () {
    const amount = web3.utils.toBN("1000000000000000000"); // 1 NEST

    beforeEach(async function () {
      // 사용자에게 토큰 전송
      await this.token.transfer(user1, amount.mul(web3.utils.toBN("10")), { from: admin });
      await this.token.transfer(user2, amount.mul(web3.utils.toBN("10")), { from: admin });
    });

    it("화이트리스트 모드를 활성화/비활성화해야 함", async function () {
      await this.token.setWhitelistMode(true, { from: admin });
      let mode = await this.token.whitelistMode();
      assert.equal(mode, true, "화이트리스트 모드 활성화 실패");

      await this.token.setWhitelistMode(false, { from: admin });
      mode = await this.token.whitelistMode();
      assert.equal(mode, false, "화이트리스트 모드 비활성화 실패");
    });

    it("권한이 없는 사용자는 화이트리스트 모드를 변경할 수 없어야 함", async function () {
      await expectRevert(
        this.token.setWhitelistMode(true, { from: user1 }),
        "AccessControl: account " + user1.toLowerCase() + " is missing role " + await this.token.WHITELISTER_ROLE()
      );
    });

    it("주소를 화이트리스트에 추가/제거해야 함", async function () {
      await this.token.addToWhitelist(user1, { from: admin });
      let isWhitelisted = await this.token.whitelist(user1);
      assert.equal(isWhitelisted, true, "화이트리스트 추가 실패");

      await this.token.removeFromWhitelist(user1, { from: admin });
      isWhitelisted = await this.token.whitelist(user1);
      assert.equal(isWhitelisted, false, "화이트리스트 제거 실패");
    });

    it("여러 주소를 한 번에 화이트리스트에 추가해야 함", async function () {
      await this.token.addMultipleToWhitelist([user1, user2, user3], { from: admin });
      const isUser1Whitelisted = await this.token.whitelist(user1);
      const isUser2Whitelisted = await this.token.whitelist(user2);
      const isUser3Whitelisted = await this.token.whitelist(user3);
      assert.equal(isUser1Whitelisted, true, "user1 화이트리스트 추가 실패");
      assert.equal(isUser2Whitelisted, true, "user2 화이트리스트 추가 실패");
      assert.equal(isUser3Whitelisted, true, "user3 화이트리스트 추가 실패");
    });

    it("화이트리스트 모드가 활성화되면 화이트리스트에 없는 주소 간 전송이 실패해야 함", async function () {
      await this.token.setWhitelistMode(true, { from: admin });
      await expectRevert(
        this.token.transfer(user2, amount, { from: user1 }),
        "Sender not whitelisted"
      );
    });

    it("화이트리스트 모드가 활성화되어도 화이트리스트에 있는 주소 간 전송은 성공해야 함", async function () {
      await this.token.setWhitelistMode(true, { from: admin });
      await this.token.addToWhitelist(user1, { from: admin });
      await this.token.addToWhitelist(user2, { from: admin });

      await this.token.transfer(user2, amount, { from: user1 });
      const user2Balance = await this.token.balanceOf(user2);
      assert.equal(user2Balance.toString(), amount.mul(web3.utils.toBN("11")).toString(), "전송된 금액이 잘못됨");
    });
  });

  describe("블랙리스트 기능", function () {
    const amount = web3.utils.toBN("1000000000000000000"); // 1 NEST

    beforeEach(async function () {
      // 사용자에게 토큰 전송
      await this.token.transfer(user1, amount.mul(web3.utils.toBN("10")), { from: admin });
      await this.token.transfer(user2, amount.mul(web3.utils.toBN("10")), { from: admin });
    });

    it("주소를 블랙리스트에 추가/제거해야 함", async function () {
      await this.token.addToBlacklist(user1, { from: admin });
      let isBlacklisted = await this.token.blacklist(user1);
      assert.equal(isBlacklisted, true, "블랙리스트 추가 실패");

      await this.token.removeFromBlacklist(user1, { from: admin });
      isBlacklisted = await this.token.blacklist(user1);
      assert.equal(isBlacklisted, false, "블랙리스트 제거 실패");
    });

    it("여러 주소를 한 번에 블랙리스트에 추가해야 함", async function () {
      await this.token.addMultipleToBlacklist([user1, user2, user3], { from: admin });
      const isUser1Blacklisted = await this.token.blacklist(user1);
      const isUser2Blacklisted = await this.token.blacklist(user2);
      const isUser3Blacklisted = await this.token.blacklist(user3);
      assert.equal(isUser1Blacklisted, true, "user1 블랙리스트 추가 실패");
      assert.equal(isUser2Blacklisted, true, "user2 블랙리스트 추가 실패");
      assert.equal(isUser3Blacklisted, true, "user3 블랙리스트 추가 실패");
    });

    it("블랙리스트에 있는 주소에서의 전송이 실패해야 함", async function () {
      await this.token.addToBlacklist(user1, { from: admin });
      await expectRevert(
        this.token.transfer(user2, amount, { from: user1 }),
        "Sender is blacklisted"
      );
    });

    it("블랙리스트에 있는 주소로의 전송이 실패해야 함", async function () {
      await this.token.addToBlacklist(user2, { from: admin });
      await expectRevert(
        this.token.transfer(user2, amount, { from: user1 }),
        "Recipient is blacklisted"
      );
    });
  });

  describe("제한된 주소 기능", function () {
    const amount = web3.utils.toBN("1000000000000000000"); // 1 NEST

    beforeEach(async function () {
      // 사용자에게 토큰 전송
      await this.token.transfer(user1, amount.mul(web3.utils.toBN("10")), { from: admin });
      await this.token.transfer(user2, amount.mul(web3.utils.toBN("10")), { from: admin });
    });

    it("제한된 주소를 설정/해제해야 함", async function () {
      await this.token.setAddressRestriction(user1, true, { from: admin });
      await expectRevert(
        this.token.transfer(user2, amount, { from: user1 }),
        "Sender is restricted"
      );

      await this.token.setAddressRestriction(user1, false, { from: admin });
      await this.token.transfer(user2, amount, { from: user1 });
      const user2Balance = await this.token.balanceOf(user2);
      assert.equal(user2Balance.toString(), amount.mul(web3.utils.toBN("11")).toString(), "전송된 금액이 잘못됨");
    });

    it("제한된 주소로의 전송이 실패해야 함", async function () {
      await this.token.setAddressRestriction(user2, true, { from: admin });
      await expectRevert(
        this.token.transfer(user2, amount, { from: user1 }),
        "Recipient is restricted"
      );
    });
  });

  describe("발행 및 소각 기능", function () {
    const amount = web3.utils.toBN("1000000000000000000"); // 1 NEST

    it("새 토큰을 발행해야 함", async function () {
      const initialTotalSupply = await this.token.totalSupply();
      await this.token.mint(user1, amount, { from: admin });
      
      const user1Balance = await this.token.balanceOf(user1);
      assert.equal(user1Balance.toString(), amount.toString(), "발행된 금액이 잘못됨");
      
      const newTotalSupply = await this.token.totalSupply();
      assert.equal(
        newTotalSupply.toString(),
        initialTotalSupply.add(amount).toString(),
        "총 공급량이 잘못 증가됨"
      );
    });

    it("권한이 없는 사용자는 토큰을 발행할 수 없어야 함", async function () {
      await expectRevert(
        this.token.mint(user1, amount, { from: user1 }),
        "AccessControl: account " + user1.toLowerCase() + " is missing role " + await this.token.MINTER_ROLE()
      );
    });

    it("토큰을 소각해야 함", async function () {
      await this.token.transfer(user1, amount, { from: admin });
      const initialTotalSupply = await this.token.totalSupply();
      
      await this.token.burn(amount, { from: user1 });
      
      const user1Balance = await this.token.balanceOf(user1);
      assert.equal(user1Balance.toString(), "0", "소각 후 잔액이 잘못됨");
      
      const newTotalSupply = await this.token.totalSupply();
      assert.equal(
        newTotalSupply.toString(),
        initialTotalSupply.sub(amount).toString(),
        "총 공급량이 잘못 감소됨"
      );
    });
  });

  describe("일시 중지 기능", function () {
    it("컨트랙트를 일시 중지/재개해야 함", async function () {
      await this.token.pause({ from: admin });
      let paused = await this.token.paused();
      assert.equal(paused, true, "일시 중지 실패");

      await this.token.unpause({ from: admin });
      paused = await this.token.paused();
      assert.equal(paused, false, "일시 중지 해제 실패");
    });

    it("권한이 없는 사용자는 컨트랙트를 일시 중지할 수 없어야 함", async function () {
      await expectRevert(
        this.token.pause({ from: user1 }),
        "AccessControl: account " + user1.toLowerCase() + " is missing role " + await this.token.PAUSER_ROLE()
      );
    });
  });
});
