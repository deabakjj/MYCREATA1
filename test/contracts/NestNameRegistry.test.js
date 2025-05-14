const NestNameRegistry = artifacts.require("NestNameRegistry");
const { expectRevert, expectEvent, time } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');

contract("NestNameRegistry", function (accounts) {
  const [admin, registrar, user1, user2, user3] = accounts;
  
  // 각 테스트 전에 새로운 레지스트리 컨트랙트 배포
  beforeEach(async function () {
    this.registry = await NestNameRegistry.new(admin);
    
    // registrar에게 REGISTRAR_ROLE 부여
    await this.registry.grantRole(await this.registry.REGISTRAR_ROLE(), registrar, { from: admin });
  });

  describe("초기 상태", function () {
    it("관리자에게 모든 역할이 부여되어야 함", async function () {
      const isDefaultAdmin = await this.registry.hasRole(await this.registry.DEFAULT_ADMIN_ROLE(), admin);
      const isManager = await this.registry.hasRole(await this.registry.MANAGER_ROLE(), admin);
      const isRegistrar = await this.registry.hasRole(await this.registry.REGISTRAR_ROLE(), admin);
      const isPauser = await this.registry.hasRole(await this.registry.PAUSER_ROLE(), admin);

      assert.equal(isDefaultAdmin, true, "관리자에게 DEFAULT_ADMIN_ROLE이 없음");
      assert.equal(isManager, true, "관리자에게 MANAGER_ROLE이 없음");
      assert.equal(isRegistrar, true, "관리자에게 REGISTRAR_ROLE이 없음");
      assert.equal(isPauser, true, "관리자에게 PAUSER_ROLE이 없음");
    });

    it("네임스페이스가 올바르게 설정되어야 함", async function () {
      const namespace = await this.registry.NAMESPACE();
      assert.equal(namespace, ".nest", "네임스페이스가 잘못됨");
    });

    it("최소 및 최대 이름 길이가 올바르게 설정되어야 함", async function () {
      const minLength = await this.registry.MIN_NAME_LENGTH();
      const maxLength = await this.registry.MAX_NAME_LENGTH();
      
      assert.equal(minLength.toNumber(), 3, "최소 이름 길이가 잘못됨");
      assert.equal(maxLength.toNumber(), 32, "최대 이름 길이가 잘못됨");
    });

    it("기본 등록 기간이 올바르게 설정되어야 함", async function () {
      const defaultPeriod = await this.registry.defaultRegistrationPeriod();
      const oneDayInSeconds = 24 * 60 * 60;
      const oneYearInSeconds = 365 * oneDayInSeconds;
      
      assert.equal(defaultPeriod.toNumber(), oneYearInSeconds, "기본 등록 기간이 잘못됨");
    });

    it("기본 주소별 최대 등록 수가 올바르게 설정되어야 함", async function () {
      const defaultLimit = await this.registry.defaultAddressNameLimit();
      assert.equal(defaultLimit.toNumber(), 5, "기본 주소별 최대 등록 수가 잘못됨");
    });
  });

  describe("이름 등록", function () {
    it("registrar 역할이 있는 계정이 이름을 등록해야 함", async function () {
      const result = await this.registry.register("testname", user1, { from: registrar });
      
      expectEvent(result, "NameRegistered", {
        name: "testname",
        owner: user1
      });
      
      const address = await this.registry.getAddress("testname");
      assert.equal(address, user1, "등록된 주소가 잘못됨");
      
      const name = await this.registry.getName(user1);
      assert.equal(name, "testname", "등록된 이름이 잘못됨");
    });

    it("registrar 역할이 없는 계정은 다른 계정의 이름을 등록할 수 없어야 함", async function () {
      await expectRevert(
        this.registry.register("testname", user1, { from: user2 }),
        "AccessControl: account " + user2.toLowerCase() + " is missing role " + await this.registry.REGISTRAR_ROLE()
      );
    });

    it("사용자가 직접 자신의 이름을 등록해야 함", async function () {
      const result = await this.registry.registerSelf("testname", { from: user1 });
      
      expectEvent(result, "NameRegistered", {
        name: "testname",
        owner: user1
      });
      
      const address = await this.registry.getAddress("testname");
      assert.equal(address, user1, "등록된 주소가 잘못됨");
      
      const name = await this.registry.getName(user1);
      assert.equal(name, "testname", "등록된 이름이 잘못됨");
    });

    it("이름이 이미 등록되어 있으면 등록이 실패해야 함", async function () {
      await this.registry.register("testname", user1, { from: registrar });
      
      await expectRevert(
        this.registry.register("testname", user2, { from: registrar }),
        "Name already registered"
      );
      
      await expectRevert(
        this.registry.registerSelf("testname", { from: user2 }),
        "Name already registered"
      );
    });

    it("제한된 이름은 등록할 수 없어야 함", async function () {
      await this.registry.setNameRestriction("restricted", true, { from: admin });
      
      await expectRevert(
        this.registry.register("restricted", user1, { from: registrar }),
        "Name is restricted"
      );
      
      await expectRevert(
        this.registry.registerSelf("restricted", { from: user1 }),
        "Name is restricted"
      );
    });

    it("최소 길이보다 짧은 이름은 등록할 수 없어야 함", async function () {
      await expectRevert(
        this.registry.register("ab", user1, { from: registrar }),
        "Invalid name"
      );
      
      await expectRevert(
        this.registry.registerSelf("ab", { from: user1 }),
        "Invalid name"
      );
    });

    it("최대 길이를 초과하는 이름은 등록할 수 없어야 함", async function () {
      const longName = "a".repeat(33);
      
      await expectRevert(
        this.registry.register(longName, user1, { from: registrar }),
        "Invalid name"
      );
      
      await expectRevert(
        this.registry.registerSelf(longName, { from: user1 }),
        "Invalid name"
      );
    });

    it("허용되지 않는 문자가 포함된 이름은 등록할 수 없어야 함", async function () {
      await expectRevert(
        this.registry.register("test@name", user1, { from: registrar }),
        "Invalid name"
      );
      
      await expectRevert(
        this.registry.registerSelf("test@name", { from: user1 }),
        "Invalid name"
      );
    });

    it("하이픈으로 시작하거나 끝나는 이름은 등록할 수 없어야 함", async function () {
      await expectRevert(
        this.registry.register("-testname", user1, { from: registrar }),
        "Invalid name"
      );
      
      await expectRevert(
        this.registry.register("testname-", user1, { from: registrar }),
        "Invalid name"
      );
    });

    it("연속된 하이픈이 있는 이름은 등록할 수 없어야 함", async function () {
      await expectRevert(
        this.registry.register("test--name", user1, { from: registrar }),
        "Invalid name"
      );
    });

    it("대문자로 된 이름이 소문자로 변환되어 등록되어야 함", async function () {
      await this.registry.register("TestName", user1, { from: registrar });
      
      const address = await this.registry.getAddress("testname");
      assert.equal(address, user1, "등록된 주소가 잘못됨 (대소문자 처리)");
      
      const name = await this.registry.getName(user1);
      assert.equal(name, "testname", "등록된 이름이 잘못됨 (대소문자 처리)");
    });

    it("주소별 최대 등록 수를 초과하면 등록이 실패해야 함", async function () {
      // 기본 최대 등록 수를 1로 설정
      await this.registry.setDefaultAddressNameLimit(1, { from: admin });
      
      await this.registry.register("testname1", user1, { from: registrar });
      
      await expectRevert(
        this.registry.register("testname2", user1, { from: registrar }),
        "Address has reached name limit"
      );
    });

    it("주소별 개별 최대 등록 수 설정이 적용되어야 함", async function () {
      // 기본 최대 등록 수를 1로 설정
      await this.registry.setDefaultAddressNameLimit(1, { from: admin });
      
      // user1의 최대 등록 수를 2로 설정
      await this.registry.setAddressNameLimit(user1, 2, { from: admin });
      
      await this.registry.register("testname1", user1, { from: registrar });
      await this.registry.register("testname2", user1, { from: registrar });
      
      await expectRevert(
        this.registry.register("testname3", user1, { from: registrar }),
        "Address has reached name limit"
      );
    });
  });

  describe("이름 갱신", function () {
    beforeEach(async function () {
      await this.registry.register("testname", user1, { from: registrar });
    });

    it("이름 소유자가 이름을 갱신해야 함", async function () {
      const initialExpiration = await this.registry.getExpiration("testname");
      
      // 1일 경과
      await time.increase(time.duration.days(1));
      
      const result = await this.registry.renewName("testname", { from: user1 });
      
      expectEvent(result, "NameRenewed", {
        name: "testname"
      });
      
      const newExpiration = await this.registry.getExpiration("testname");
      assert.isTrue(newExpiration.gt(initialExpiration), "만료 시간이 갱신되지 않음");
    });

    it("이름 소유자가 아닌 계정은 이름을 갱신할 수 없어야 함", async function () {
      await expectRevert(
        this.registry.renewName("testname", { from: user2 }),
        "Not the owner"
      );
    });

    it("등록되지 않은 이름은 갱신할 수 없어야 함", async function () {
      await expectRevert(
        this.registry.renewName("nonexistent", { from: user1 }),
        "Name not registered"
      );
    });
  });

  describe("이름 소유권 이전", function () {
    beforeEach(async function () {
      await this.registry.register("testname", user1, { from: registrar });
    });

    it("이름 소유자가 다른 계정으로 이름을 이전해야 함", async function () {
      const result = await this.registry.transferName("testname", user2, { from: user1 });
      
      expectEvent(result, "NameTransferred", {
        name: "testname",
        oldOwner: user1,
        newOwner: user2
      });
      
      const address = await this.registry.getAddress("testname");
      assert.equal(address, user2, "이전된 주소가 잘못됨");
      
      const oldOwnerName = await this.registry.getName(user1);
      assert.equal(oldOwnerName, "", "이전 소유자의 이름이 초기화되지 않음");
      
      const newOwnerName = await this.registry.getName(user2);
      assert.equal(newOwnerName, "testname", "새 소유자의 이름이 잘못됨");
    });

    it("이름 소유자가 아닌 계정은 이름을 이전할 수 없어야 함", async function () {
      await expectRevert(
        this.registry.transferName("testname", user2, { from: user3 }),
        "Not the owner"
      );
    });

    it("등록되지 않은 이름은 이전할 수 없어야 함", async function () {
      await expectRevert(
        this.registry.transferName("nonexistent", user2, { from: user1 }),
        "Name not registered"
      );
    });

    it("0 주소로는 이름을 이전할 수 없어야 함", async function () {
      await expectRevert(
        this.registry.transferName("testname", "0x0000000000000000000000000000000000000000", { from: user1 }),
        "New owner is zero address"
      );
    });

    it("새 소유자가 이미 최대 등록 수에 도달했으면 이전이 실패해야 함", async function () {
      // 기본 최대 등록 수를 1로 설정
      await this.registry.setDefaultAddressNameLimit(1, { from: admin });
      
      // user2에게 이름 등록
      await this.registry.register("user2name", user2, { from: registrar });
      
      await expectRevert(
        this.registry.transferName("testname", user2, { from: user1 }),
        "New owner has reached name limit"
      );
    });
  });

  describe("이름 해제", function () {
    beforeEach(async function () {
      await this.registry.register("testname", user1, { from: registrar });
    });

    it("이름 소유자가 이름을 해제해야 함", async function () {
      const result = await this.registry.releaseName("testname", { from: user1 });
      
      expectEvent(result, "NameReleased", {
        name: "testname",
        owner: user1
      });
      
      const address = await this.registry.getAddress("testname");
      assert.equal(address, "0x0000000000000000000000000000000000000000", "이름이 해제되지 않음");
      
      const name = await this.registry.getName(user1);
      assert.equal(name, "", "소유자의 이름이 초기화되지 않음");
    });

    it("이름 소유자가 아닌 계정은 이름을 해제할 수 없어야 함", async function () {
      await expectRevert(
        this.registry.releaseName("testname", { from: user2 }),
        "Not the owner"
      );
    });

    it("등록되지 않은 이름은 해제할 수 없어야 함", async function () {
      await expectRevert(
        this.registry.releaseName("nonexistent", { from: user1 }),
        "Name not registered"
      );
    });
  });

  describe("이름 만료", function () {
    beforeEach(async function () {
      // 기본 등록 기간을 1일로 설정
      await this.registry.setDefaultRegistrationPeriod(time.duration.days(1), { from: admin });
      
      await this.registry.register("testname", user1, { from: registrar });
    });

    it("만료된 이름은 조회되지 않아야 함", async function () {
      // 2일 경과 (등록 기간 초과)
      await time.increase(time.duration.days(2));
      
      const address = await this.registry.getAddress("testname");
      assert.equal(address, "0x0000000000000000000000000000000000000000", "만료된 이름이 조회됨");
      
      const name = await this.registry.getName(user1);
      assert.equal(name, "", "만료된 이름이 조회됨");
    });

    it("만료된 이름은 다시 등록 가능해야 함", async function () {
      // 2일 경과 (등록 기간 초과)
      await time.increase(time.duration.days(2));
      
      await this.registry.register("testname", user2, { from: registrar });
      
      const address = await this.registry.getAddress("testname");
      assert.equal(address, user2, "만료된 이름이 다시 등록되지 않음");
    });
  });

  describe("이름 제한", function () {
    it("이름 제한을 설정/해제해야 함", async function () {
      await this.registry.setNameRestriction("restricted", true, { from: admin });
      
      await expectRevert(
        this.registry.register("restricted", user1, { from: registrar }),
        "Name is restricted"
      );
      
      await this.registry.setNameRestriction("restricted", false, { from: admin });
      
      await this.registry.register("restricted", user1, { from: registrar });
      
      const address = await this.registry.getAddress("restricted");
      assert.equal(address, user1, "제한이 해제된 이름이 등록되지 않음");
    });

    it("관리자 역할이 없는 계정은 이름 제한을 설정할 수 없어야 함", async function () {
      await expectRevert(
        this.registry.setNameRestriction("restricted", true, { from: user1 }),
        "AccessControl: account " + user1.toLowerCase() + " is missing role " + await this.registry.MANAGER_ROLE()
      );
    });
  });

  describe("설정 관리", function () {
    it("기본 등록 기간을 변경해야 함", async function () {
      const newPeriod = time.duration.days(30);
      await this.registry.setDefaultRegistrationPeriod(newPeriod, { from: admin });
      
      const updatedPeriod = await this.registry.defaultRegistrationPeriod();
      assert.equal(updatedPeriod.toString(), newPeriod.toString(), "기본 등록 기간이 변경되지 않음");
    });

    it("기본 주소별 최대 등록 수를 변경해야 함", async function () {
      const newLimit = 10;
      await this.registry.setDefaultAddressNameLimit(newLimit, { from: admin });
      
      const updatedLimit = await this.registry.defaultAddressNameLimit();
      assert.equal(updatedLimit.toNumber(), newLimit, "기본 주소별 최대 등록 수가 변경되지 않음");
    });

    it("주소별 개별 최대 등록 수를 설정해야 함", async function () {
      const individualLimit = 3;
      await this.registry.setAddressNameLimit(user1, individualLimit, { from: admin });
      
      // 사용자에게 이름 등록
      await this.registry.register("name1", user1, { from: registrar });
      await this.registry.register("name2", user1, { from: registrar });
      await this.registry.register("name3", user1, { from: registrar });
      
      await expectRevert(
        this.registry.register("name4", user1, { from: registrar }),
        "Address has reached name limit"
      );
    });

    it("관리자 역할이 없는 계정은 설정을 변경할 수 없어야 함", async function () {
      await expectRevert(
        this.registry.setDefaultRegistrationPeriod(time.duration.days(30), { from: user1 }),
        "AccessControl: account " + user1.toLowerCase() + " is missing role " + await this.registry.MANAGER_ROLE()
      );
      
      await expectRevert(
        this.registry.setDefaultAddressNameLimit(10, { from: user1 }),
        "AccessControl: account " + user1.toLowerCase() + " is missing role " + await this.registry.MANAGER_ROLE()
      );
      
      await expectRevert(
        this.registry.setAddressNameLimit(user2, 3, { from: user1 }),
        "AccessControl: account " + user1.toLowerCase() + " is missing role " + await this.registry.MANAGER_ROLE()
      );
    });
  });

  describe("일시 중지 기능", function () {
    beforeEach(async function () {
      await this.registry.pause({ from: admin });
    });

    it("일시 중지되면 이름 등록이 실패해야 함", async function () {
      await expectRevert(
        this.registry.register("testname", user1, { from: registrar }),
        "Pausable: paused"
      );
      
      await expectRevert(
        this.registry.registerSelf("testname", { from: user1 }),
        "Pausable: paused"
      );
    });

    it("일시 중지 해제 후 이름 등록이 다시 가능해야 함", async function () {
      await this.registry.unpause({ from: admin });
      
      await this.registry.register("testname", user1, { from: registrar });
      
      const address = await this.registry.getAddress("testname");
      assert.equal(address, user1, "이름 등록이 실패함");
    });

    it("권한이 없는 사용자는 컨트랙트를 일시 중지/해제할 수 없어야 함", async function () {
      await expectRevert(
        this.registry.unpause({ from: user1 }),
        "AccessControl: account " + user1.toLowerCase() + " is missing role " + await this.registry.PAUSER_ROLE()
      );
    });
  });

  describe("유틸리티 함수", function () {
    it("전체 도메인 이름을 반환해야 함", async function () {
      const fullDomain = await this.registry.getFullDomain("testname");
      assert.equal(fullDomain, "testname.nest", "전체 도메인 이름이 잘못됨");
    });

    it("대문자로 된 이름의 전체 도메인 이름을 소문자로 반환해야 함", async function () {
      const fullDomain = await this.registry.getFullDomain("TestName");
      assert.equal(fullDomain, "testname.nest", "전체 도메인 이름이 잘못됨 (대소문자 처리)");
    });
  });
});
