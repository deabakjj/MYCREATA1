const NestNFT = artifacts.require("NestNFT");
const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');

contract("NestNFT", function (accounts) {
  const [admin, user1, user2, user3] = accounts;
  
  // 각 테스트 전에 새로운 NFT 컨트랙트 배포
  beforeEach(async function () {
    this.nft = await NestNFT.new(admin);
  });

  describe("초기 상태", function () {
    it("NFT 이름이 올바르게 설정되어야 함", async function () {
      const name = await this.nft.name();
      assert.equal(name, "Nest NFT", "NFT 이름이 잘못됨");
    });

    it("NFT 심볼이 올바르게 설정되어야 함", async function () {
      const symbol = await this.nft.symbol();
      assert.equal(symbol, "NESTNFT", "NFT 심볼이 잘못됨");
    });

    it("관리자에게 모든 역할이 부여되어야 함", async function () {
      const isDefaultAdmin = await this.nft.hasRole(await this.nft.DEFAULT_ADMIN_ROLE(), admin);
      const isPauser = await this.nft.hasRole(await this.nft.PAUSER_ROLE(), admin);
      const isMinter = await this.nft.hasRole(await this.nft.MINTER_ROLE(), admin);
      const isNFTManager = await this.nft.hasRole(await this.nft.NFT_MANAGER_ROLE(), admin);

      assert.equal(isDefaultAdmin, true, "관리자에게 DEFAULT_ADMIN_ROLE이 없음");
      assert.equal(isPauser, true, "관리자에게 PAUSER_ROLE이 없음");
      assert.equal(isMinter, true, "관리자에게 MINTER_ROLE이 없음");
      assert.equal(isNFTManager, true, "관리자에게 NFT_MANAGER_ROLE이 없음");
    });
  });

  describe("NFT 유형 관리", function () {
    it("NFT 유형을 생성해야 함", async function () {
      const result = await this.nft.createNFTType(
        "출석 체크 NFT",
        "매일 출석 체크 보상으로 지급되는 NFT",
        true,
        { from: admin }
      );
      
      const typeId = result.logs[0].args.typeId.toNumber();
      const typeInfo = await this.nft.nftTypes(typeId);
      
      assert.equal(typeInfo.name, "출석 체크 NFT", "NFT 유형 이름이 잘못됨");
      assert.equal(typeInfo.description, "매일 출석 체크 보상으로 지급되는 NFT", "NFT 유형 설명이 잘못됨");
      assert.equal(typeInfo.transferable, true, "NFT 유형 전송 가능 여부가 잘못됨");
      assert.equal(typeInfo.exists, true, "NFT 유형 존재 여부가 잘못됨");
    });

    it("NFT 유형 정보를 업데이트해야 함", async function () {
      // 유형 생성
      const result = await this.nft.createNFTType(
        "출석 체크 NFT",
        "매일 출석 체크 보상으로 지급되는 NFT",
        true,
        { from: admin }
      );
      
      const typeId = result.logs[0].args.typeId.toNumber();
      
      // 유형 업데이트
      await this.nft.updateNFTType(
        typeId,
        "업데이트된 NFT",
        "업데이트된 설명",
        false,
        { from: admin }
      );
      
      const updatedTypeInfo = await this.nft.nftTypes(typeId);
      
      assert.equal(updatedTypeInfo.name, "업데이트된 NFT", "NFT 유형 이름 업데이트 실패");
      assert.equal(updatedTypeInfo.description, "업데이트된 설명", "NFT 유형 설명 업데이트 실패");
      assert.equal(updatedTypeInfo.transferable, false, "NFT 유형 전송 가능 여부 업데이트 실패");
    });

    it("권한이 없는 사용자는 NFT 유형을 생성할 수 없어야 함", async function () {
      await expectRevert(
        this.nft.createNFTType(
          "출석 체크 NFT",
          "매일 출석 체크 보상으로 지급되는 NFT",
          true,
          { from: user1 }
        ),
        "AccessControl: account " + user1.toLowerCase() + " is missing role " + await this.nft.NFT_MANAGER_ROLE()
      );
    });

    it("존재하지 않는 NFT 유형을 업데이트할 수 없어야 함", async function () {
      await expectRevert(
        this.nft.updateNFTType(
          999,
          "업데이트된 NFT",
          "업데이트된 설명",
          false,
          { from: admin }
        ),
        "NFT type does not exist"
      );
    });
  });

  describe("NFT 발행", function () {
    let typeId;
    
    beforeEach(async function () {
      // 테스트용 NFT 유형 생성
      const result = await this.nft.createNFTType(
        "테스트 NFT",
        "테스트용 NFT",
        true,
        { from: admin }
      );
      
      typeId = result.logs[0].args.typeId.toNumber();
    });

    it("NFT를 발행해야 함", async function () {
      const result = await this.nft.safeMint(
        user1,
        typeId,
        "ipfs://QmTestHash",
        { from: admin }
      );
      
      const tokenId = result.logs[0].args.tokenId.toNumber();
      const owner = await this.nft.ownerOf(tokenId);
      const tokenURI = await this.nft.tokenURI(tokenId);
      const tokenTypeId = await this.nft.tokenTypes(tokenId);
      
      assert.equal(owner, user1, "NFT 소유자가 잘못됨");
      assert.equal(tokenURI, "ipfs://QmTestHash", "NFT URI가 잘못됨");
      assert.equal(tokenTypeId.toNumber(), typeId, "NFT 유형 ID가 잘못됨");
    });

    it("권한이 없는 사용자는 NFT를 발행할 수 없어야 함", async function () {
      await expectRevert(
        this.nft.safeMint(
          user1,
          typeId,
          "ipfs://QmTestHash",
          { from: user1 }
        ),
        "AccessControl: account " + user1.toLowerCase() + " is missing role " + await this.nft.MINTER_ROLE()
      );
    });

    it("존재하지 않는 NFT 유형으로 NFT를 발행할 수 없어야 함", async function () {
      await expectRevert(
        this.nft.safeMint(
          user1,
          999,
          "ipfs://QmTestHash",
          { from: admin }
        ),
        "NFT type does not exist"
      );
    });

    it("여러 NFT를 한 번에 발행해야 함", async function () {
      const recipients = [user1, user2, user3];
      const result = await this.nft.batchMint(
        recipients,
        typeId,
        "ipfs://QmTestHash",
        { from: admin }
      );
      
      const tokenIds = result.logs
        .filter(log => log.event === "NFTMinted")
        .map(log => log.args.tokenId.toNumber());
      
      assert.equal(tokenIds.length, 3, "발행된 NFT 수가 잘못됨");
      
      for (let i = 0; i < tokenIds.length; i++) {
        const owner = await this.nft.ownerOf(tokenIds[i]);
        assert.equal(owner, recipients[i], `${i}번째 NFT 소유자가 잘못됨`);
      }
    });
  });

  describe("NFT 전송 제한", function () {
    let transferableTypeId;
    let nonTransferableTypeId;
    let transferableTokenId;
    let nonTransferableTokenId;
    
    beforeEach(async function () {
      // 전송 가능한 NFT 유형 생성
      let result = await this.nft.createNFTType(
        "전송 가능 NFT",
        "전송 가능한 NFT",
        true,
        { from: admin }
      );
      
      transferableTypeId = result.logs[0].args.typeId.toNumber();
      
      // 전송 불가능한 NFT 유형 생성
      result = await this.nft.createNFTType(
        "전송 불가능 NFT",
        "전송 불가능한 NFT",
        false,
        { from: admin }
      );
      
      nonTransferableTypeId = result.logs[0].args.typeId.toNumber();
      
      // 전송 가능한 NFT 발행
      result = await this.nft.safeMint(
        user1,
        transferableTypeId,
        "ipfs://QmTransferableHash",
        { from: admin }
      );
      
      transferableTokenId = result.logs[0].args.tokenId.toNumber();
      
      // 전송 불가능한 NFT 발행
      result = await this.nft.safeMint(
        user1,
        nonTransferableTypeId,
        "ipfs://QmNonTransferableHash",
        { from: admin }
      );
      
      nonTransferableTokenId = result.logs[0].args.tokenId.toNumber();
      
      // NFT 전송 승인
      await this.nft.approve(user2, transferableTokenId, { from: user1 });
      await this.nft.approve(user2, nonTransferableTokenId, { from: user1 });
    });

    it("전송 가능한 NFT는 전송되어야 함", async function () {
      await this.nft.transferFrom(user1, user2, transferableTokenId, { from: user2 });
      const newOwner = await this.nft.ownerOf(transferableTokenId);
      assert.equal(newOwner, user2, "전송 가능한 NFT 전송 실패");
    });

    it("전송 불가능한 NFT는 전송이 실패해야 함", async function () {
      await expectRevert(
        this.nft.transferFrom(user1, user2, nonTransferableTokenId, { from: user2 }),
        "This NFT is not transferable"
      );
    });

    it("일시 중지되면 전송이 실패해야 함", async function () {
      await this.nft.pause({ from: admin });
      await expectRevert(
        this.nft.transferFrom(user1, user2, transferableTokenId, { from: user2 }),
        "Pausable: paused"
      );
    });
  });

  describe("일시 중지 기능", function () {
    it("컨트랙트를 일시 중지/재개해야 함", async function () {
      await this.nft.pause({ from: admin });
      let paused = await this.nft.paused();
      assert.equal(paused, true, "일시 중지 실패");

      await this.nft.unpause({ from: admin });
      paused = await this.nft.paused();
      assert.equal(paused, false, "일시 중지 해제 실패");
    });

    it("권한이 없는 사용자는 컨트랙트를 일시 중지할 수 없어야 함", async function () {
      await expectRevert(
        this.nft.pause({ from: user1 }),
        "AccessControl: account " + user1.toLowerCase() + " is missing role " + await this.nft.PAUSER_ROLE()
      );
    });
  });

  describe("NFT 조회 기능", function () {
    let typeId;
    let tokenIds = [];
    
    beforeEach(async function () {
      // NFT 유형 생성
      const result = await this.nft.createNFTType(
        "조회 테스트 NFT",
        "조회 테스트용 NFT",
        true,
        { from: admin }
      );
      
      typeId = result.logs[0].args.typeId.toNumber();
      
      // 사용자별로 여러 개의 NFT 발행
      for (let i = 0; i < 3; i++) {
        const mintResult = await this.nft.safeMint(
          user1,
          typeId,
          `ipfs://QmTestHash${i}`,
          { from: admin }
        );
        
        tokenIds.push(mintResult.logs[0].args.tokenId.toNumber());
      }
    });

    it("사용자가 보유한 NFT 수를 조회해야 함", async function () {
      const balance = await this.nft.balanceOf(user1);
      assert.equal(balance.toNumber(), 3, "사용자의 NFT 수가 잘못됨");
    });

    it("토큰 ID로 소유자를 조회해야 함", async function () {
      for (let i = 0; i < tokenIds.length; i++) {
        const owner = await this.nft.ownerOf(tokenIds[i]);
        assert.equal(owner, user1, `${i}번째 NFT 소유자가 잘못됨`);
      }
    });

    it("인덱스로 토큰 ID를 조회해야 함", async function () {
      for (let i = 0; i < tokenIds.length; i++) {
        const tokenId = await this.nft.tokenOfOwnerByIndex(user1, i);
        assert.include(tokenIds, tokenId.toNumber(), `인덱스 ${i}의 토큰 ID가 잘못됨`);
      }
    });

    it("전체 NFT 공급량을 조회해야 함", async function () {
      const totalSupply = await this.nft.totalSupply();
      assert.equal(totalSupply.toNumber(), tokenIds.length, "총 공급량이 잘못됨");
    });

    it("전체 인덱스로 토큰 ID를 조회해야 함", async function () {
      for (let i = 0; i < tokenIds.length; i++) {
        const tokenId = await this.nft.tokenByIndex(i);
        assert.include(tokenIds, tokenId.toNumber(), `전체 인덱스 ${i}의 토큰 ID가 잘못됨`);
      }
    });

    it("토큰 URI를 조회해야 함", async function () {
      for (let i = 0; i < tokenIds.length; i++) {
        const uri = await this.nft.tokenURI(tokenIds[i]);
        assert.equal(uri, `ipfs://QmTestHash${i}`, `토큰 ${tokenIds[i]}의 URI가 잘못됨`);
      }
    });
  });
});
