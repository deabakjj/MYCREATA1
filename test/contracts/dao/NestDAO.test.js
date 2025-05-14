const NestDAO = artifacts.require("dao/NestDAO");
const NestToken = artifacts.require("NestToken");
const NestNFT = artifacts.require("NestNFT");
const { expectRevert, expectEvent, time, BN } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');

contract("NestDAO", function (accounts) {
  const [admin, proposer, executor, voter1, voter2, voter3, user1, user2] = accounts;
  
  // 초기 설정값
  const proposalThreshold = web3.utils.toWei("100", "ether"); // 100 NEST
  const defaultQuorum = web3.utils.toWei("1000", "ether"); // 1000 NEST
  const defaultThreshold = 5100; // 51%
  const minVotingPeriod = 60 * 60 * 24; // 1일
  const maxVotingPeriod = 60 * 60 * 24 * 7; // 7일
  
  // 테스트용 금액
  const proposerTokens = web3.utils.toWei("500", "ether"); // 500 NEST
  const voterTokens = web3.utils.toWei("200", "ether"); // 200 NEST
  
  beforeEach(async function () {
    // NEST 토큰 배포
    this.nestToken = await NestToken.new(admin);
    
    // NFT 배포
    this.nestNFT = await NestNFT.new(admin);
    
    // XP 컨트랙트 주소 (실제 배포 없이 더미 주소 사용)
    this.xpContract = "0x0000000000000000000000000000000000000001";
    
    // DAO 배포
    this.dao = await NestDAO.new(
      admin,
      this.nestToken.address,
      this.nestNFT.address,
      this.xpContract,
      proposalThreshold,
      defaultQuorum,
      defaultThreshold,
      minVotingPeriod,
      maxVotingPeriod
    );
    
    // 역할 부여
    await this.dao.grantRole(await this.dao.PROPOSER_ROLE(), proposer, { from: admin });
    await this.dao.grantRole(await this.dao.EXECUTOR_ROLE(), executor, { from: admin });
    await this.dao.grantRole(await this.dao.VOTER_ROLE(), voter1, { from: admin });
    
    // 테스트용 토큰 분배
    await this.nestToken.transfer(proposer, proposerTokens, { from: admin });
    await this.nestToken.transfer(voter1, voterTokens, { from: admin });
    await this.nestToken.transfer(voter2, voterTokens, { from: admin });
    await this.nestToken.transfer(voter3, voterTokens, { from: admin });
    
    // NFT 유형 생성
    await this.nestNFT.createNFTType("투표권 NFT", "DAO 투표권", true, { from: admin });
    
    // NFT 발행
    await this.nestNFT.safeMint(voter2, 1, "ipfs://test1", { from: admin });
    await this.nestNFT.safeMint(voter3, 1, "ipfs://test2", { from: admin });
    await this.nestNFT.safeMint(voter3, 1, "ipfs://test3", { from: admin });
  });

  describe("초기 상태", function () {
    it("설정값이 올바르게 설정되어야 함", async function () {
      const votingToken = await this.dao.votingToken();
      const votingNFT = await this.dao.votingNFT();
      const xpContractAddress = await this.dao.xpContractAddress();
      const _proposalThreshold = await this.dao.proposalThreshold();
      const _defaultQuorum = await this.dao.defaultQuorum();
      const _defaultThreshold = await this.dao.defaultThreshold();
      const _minVotingPeriod = await this.dao.minVotingPeriod();
      const _maxVotingPeriod = await this.dao.maxVotingPeriod();
      
      assert.equal(votingToken, this.nestToken.address, "투표 토큰 주소가 잘못됨");
      assert.equal(votingNFT, this.nestNFT.address, "투표권 NFT 주소가 잘못됨");
      assert.equal(xpContractAddress, this.xpContract, "XP 계약 주소가 잘못됨");
      assert.equal(_proposalThreshold.toString(), proposalThreshold.toString(), "제안 최소 토큰 수가 잘못됨");
      assert.equal(_defaultQuorum.toString(), defaultQuorum.toString(), "기본 정족수가 잘못됨");
      assert.equal(_defaultThreshold.toString(), defaultThreshold.toString(), "기본 가결 기준이 잘못됨");
      assert.equal(_minVotingPeriod.toString(), minVotingPeriod.toString(), "최소 투표 기간이 잘못됨");
      assert.equal(_maxVotingPeriod.toString(), maxVotingPeriod.toString(), "최대 투표 기간이 잘못됨");
    });

    it("역할이 올바르게 부여되어야 함", async function () {
      const isAdminDefault = await this.dao.hasRole(await this.dao.DEFAULT_ADMIN_ROLE(), admin);
      const isAdminProposer = await this.dao.hasRole(await this.dao.PROPOSER_ROLE(), admin);
      const isAdminExecutor = await this.dao.hasRole(await this.dao.EXECUTOR_ROLE(), admin);
      const isAdminVoter = await this.dao.hasRole(await this.dao.VOTER_ROLE(), admin);
      const isAdminPauser = await this.dao.hasRole(await this.dao.PAUSER_ROLE(), admin);
      
      const isProposer = await this.dao.hasRole(await this.dao.PROPOSER_ROLE(), proposer);
      const isExecutor = await this.dao.hasRole(await this.dao.EXECUTOR_ROLE(), executor);
      const isVoter = await this.dao.hasRole(await this.dao.VOTER_ROLE(), voter1);
      
      assert.equal(isAdminDefault, true, "관리자에게 DEFAULT_ADMIN_ROLE이 없음");
      assert.equal(isAdminProposer, true, "관리자에게 PROPOSER_ROLE이 없음");
      assert.equal(isAdminExecutor, true, "관리자에게 EXECUTOR_ROLE이 없음");
      assert.equal(isAdminVoter, true, "관리자에게 VOTER_ROLE이 없음");
      assert.equal(isAdminPauser, true, "관리자에게 PAUSER_ROLE이 없음");
      
      assert.equal(isProposer, true, "proposer에게 PROPOSER_ROLE이 없음");
      assert.equal(isExecutor, true, "executor에게 EXECUTOR_ROLE이 없음");
      assert.equal(isVoter, true, "voter1에게 VOTER_ROLE이 없음");
    });
  });

  describe("제안 생성", function () {
    it("제안자 역할이 있는 계정이 제안을 생성해야 함", async function () {
      const now = await time.latest();
      const startTime = now.add(time.duration.hours(1));
      const endTime = startTime.add(time.duration.days(3));
      
      const result = await this.dao.createProposal(
        "테스트 제안",
        "이것은 테스트 제안입니다.",
        startTime,
        endTime,
        0, // 기본 정족수 사용
        0, // 기본 가결 기준 사용
        0, // TokenBased
        { from: proposer }
      );
      
      expectEvent(result, "ProposalCreated", {
        proposalId: "1",
        proposer: proposer,
        title: "테스트 제안",
        startTime: startTime,
        endTime: endTime,
        votingPowerStrategy: "0"
      });
      
      const proposalInfo = await this.dao.getProposalInfo(1);
      
      assert.equal(proposalInfo.id.toString(), "1", "제안 ID가 잘못됨");
      assert.equal(proposalInfo.proposer, proposer, "제안자가 잘못됨");
      assert.equal(proposalInfo.title, "테스트 제안", "제안 제목이 잘못됨");
      assert.equal(proposalInfo.description, "이것은 테스트 제안입니다.", "제안 설명이 잘못됨");
      assert.equal(proposalInfo.quorum.toString(), defaultQuorum.toString(), "정족수가 잘못됨");
      assert.equal(proposalInfo.threshold.toString(), defaultThreshold.toString(), "가결 기준이 잘못됨");
      assert.equal(proposalInfo.state.toString(), "0", "제안 상태가 잘못됨"); // Pending
    });

    it("충분한 토큰이 있는 일반 사용자도 제안을 생성해야 함", async function () {
      const now = await time.latest();
      const startTime = now.add(time.duration.hours(1));
      const endTime = startTime.add(time.duration.days(3));
      
      // user1에게 충분한 토큰 전송
      await this.nestToken.transfer(user1, proposalThreshold, { from: admin });
      
      const result = await this.dao.createProposal(
        "사용자 제안",
        "이것은 사용자 제안입니다.",
        startTime,
        endTime,
        0, // 기본 정족수 사용
        0, // 기본 가결 기준 사용
        0, // TokenBased
        { from: user1 }
      );
      
      expectEvent(result, "ProposalCreated", {
        proposalId: "1",
        proposer: user1
      });
    });

    it("충분한 토큰이 없는 일반 사용자는 제안을 생성할 수 없어야 함", async function () {
      const now = await time.latest();
      const startTime = now.add(time.duration.hours(1));
      const endTime = startTime.add(time.duration.days(3));
      
      await expectRevert(
        this.dao.createProposal(
          "실패할 제안",
          "이 제안은 실패해야 합니다.",
          startTime,
          endTime,
          0,
          0,
          0,
          { from: user2 }
        ),
        "Insufficient tokens to create proposal"
      );
    });

    it("잘못된 투표 기간은 제안 생성이 실패해야 함", async function () {
      const now = await time.latest();
      
      // 과거 시작 시간
      await expectRevert(
        this.dao.createProposal(
          "과거 시작",
          "이 제안은 실패해야 합니다.",
          now.sub(time.duration.hours(1)),
          now.add(time.duration.days(3)),
          0,
          0,
          0,
          { from: proposer }
        ),
        "Start time must be in the future"
      );
      
      // 종료 시간이 시작 시간보다 이전
      await expectRevert(
        this.dao.createProposal(
          "잘못된 종료 시간",
          "이 제안은 실패해야 합니다.",
          now.add(time.duration.hours(2)),
          now.add(time.duration.hours(1)),
          0,
          0,
          0,
          { from: proposer }
        ),
        "End time must be after start time"
      );
      
      // 최소 투표 기간보다 짧음
      await expectRevert(
        this.dao.createProposal(
          "너무 짧은 기간",
          "이 제안은 실패해야 합니다.",
          now.add(time.duration.hours(1)),
          now.add(time.duration.hours(2)),
          0,
          0,
          0,
          { from: proposer }
        ),
        "Voting period too short"
      );
      
      // 최대 투표 기간보다 김
      await expectRevert(
        this.dao.createProposal(
          "너무 긴 기간",
          "이 제안은 실패해야 합니다.",
          now.add(time.duration.hours(1)),
          now.add(time.duration.days(30)),
          0,
          0,
          0,
          { from: proposer }
        ),
        "Voting period too long"
      );
    });
  });

  describe("투표", function () {
    beforeEach(async function () {
      // 제안 생성
      const now = await time.latest();
      this.startTime = now.add(time.duration.hours(1));
      this.endTime = this.startTime.add(time.duration.days(3));
      
      await this.dao.createProposal(
        "투표 테스트 제안",
        "이것은 투표 테스트를 위한 제안입니다.",
        this.startTime,
        this.endTime,
        0, // 기본 정족수 사용
        0, // 기본 가결 기준 사용
        0, // TokenBased
        { from: proposer }
      );
      
      // 시간 이동 (투표 시작)
      await time.increaseTo(this.startTime.add(time.duration.minutes(1)));
    });

    it("투표권이 있는 사용자가 투표해야 함", async function () {
      const result = await this.dao.castVote(1, 1, { from: voter1 }); // 1: 찬성
      
      expectEvent(result, "VoteCast", {
        voter: voter1,
        proposalId: "1",
        vote: "1", // 찬성
        votingPower: voterTokens
      });
      
      const proposalInfo = await this.dao.getProposalInfo(1);
      assert.equal(proposalInfo.forVotes.toString(), voterTokens.toString(), "찬성 투표 수가 잘못됨");
      
      const [hasVoted, vote, votingPower] = await this.dao.getReceipt(1, voter1);
      assert.equal(hasVoted, true, "투표 여부가 잘못됨");
      assert.equal(vote.toString(), "1", "투표 유형이 잘못됨");
      assert.equal(votingPower.toString(), voterTokens.toString(), "투표 가중치가 잘못됨");
    });

    it("다양한 투표 유형이 올바르게 집계되어야 함", async function () {
      // voter1: 찬성
      await this.dao.castVote(1, 1, { from: voter1 });
      
      // voter2: 반대
      await this.dao.castVote(1, 0, { from: voter2 });
      
      // voter3: 기권
      await this.dao.castVote(1, 2, { from: voter3 });
      
      const proposalInfo = await this.dao.getProposalInfo(1);
      
      assert.equal(proposalInfo.forVotes.toString(), voterTokens.toString(), "찬성 투표 수가 잘못됨");
      assert.equal(proposalInfo.againstVotes.toString(), voterTokens.toString(), "반대 투표 수가 잘못됨");
      assert.equal(proposalInfo.abstainVotes.toString(), voterTokens.toString(), "기권 투표 수가 잘못됨");
    });

    it("투표권이 없는 사용자는 투표할 수 없어야 함", async function () {
      await expectRevert(
        this.dao.castVote(1, 1, { from: user2 }),
        "No voting rights"
      );
    });

    it("이미 투표한 사용자는 다시 투표할 수 없어야 함", async function () {
      await this.dao.castVote(1, 1, { from: voter1 });
      
      await expectRevert(
        this.dao.castVote(1, 0, { from: voter1 }),
        "Already voted"
      );
    });

    it("제안이 활성 상태가 아니면 투표할 수 없어야 함", async function () {
      // 새 제안 생성 (미래 시작)
      const now = await time.latest();
      const futureStartTime = now.add(time.duration.days(1));
      const futureEndTime = futureStartTime.add(time.duration.days(3));
      
      await this.dao.createProposal(
        "미래 제안",
        "이 제안은 아직 시작되지 않았습니다.",
        futureStartTime,
        futureEndTime,
        0,
        0,
        0,
        { from: proposer }
      );
      
      // 아직 시작되지 않은 제안에 투표
      await expectRevert(
        this.dao.castVote(2, 1, { from: voter1 }),
        "Proposal is not active"
      );
      
      // 첫 번째 제안 취소
      await this.dao.cancelProposal(1, { from: proposer });
      
      // 취소된 제안에 투표
      await expectRevert(
        this.dao.castVote(1, 1, { from: voter2 }),
        "Proposal is not active"
      );
    });
  });

  describe("제안 상태 및 실행", function () {
    beforeEach(async function () {
      // 제안 생성
      const now = await time.latest();
      this.startTime = now.add(time.duration.hours(1));
      this.endTime = this.startTime.add(time.duration.days(3));
      
      await this.dao.createProposal(
        "상태 테스트 제안",
        "이것은 제안 상태 테스트를 위한 제안입니다.",
        this.startTime,
        this.endTime,
        web3.utils.toWei("500", "ether"), // 정족수 500
        5000, // 50% 가결 기준
        0, // TokenBased
        { from: proposer }
      );
    });

    it("제안 상태가 올바르게 변경되어야 함", async function () {
      // Pending
      let state = await this.dao.getProposalState(1);
      assert.equal(state.toString(), "0", "초기 상태가 잘못됨 (Pending)");
      
      // Active
      await time.increaseTo(this.startTime.add(time.duration.minutes(1)));
      state = await this.dao.getProposalState(1);
      assert.equal(state.toString(), "1", "활성 상태가 잘못됨 (Active)");
      
      // Canceled
      await this.dao.cancelProposal(1, { from: proposer });
      state = await this.dao.getProposalState(1);
      assert.equal(state.toString(), "2", "취소 상태가 잘못됨 (Canceled)");
    });

    it("정족수와 가결 기준에 따라 상태가 결정되어야 함", async function () {
      // 새 제안 생성
      const now = await time.latest();
      const startTime = now.add(time.duration.hours(1));
      const endTime = startTime.add(time.duration.days(3));
      
      await this.dao.createProposal(
        "가결 테스트 제안",
        "이것은 가결 테스트를 위한 제안입니다.",
        startTime,
        endTime,
        web3.utils.toWei("500", "ether"), // 정족수 500
        5000, // 50% 가결 기준
        0, // TokenBased
        { from: proposer }
      );
      
      // 활성 상태로 만들기
      await time.increaseTo(startTime.add(time.duration.minutes(1)));
      
      // 투표
      await this.dao.castVote(2, 1, { from: voter1 }); // 찬성
      await this.dao.castVote(2, 1, { from: voter2 }); // 찬성
      await this.dao.castVote(2, 0, { from: voter3 }); // 반대
      
      // 투표 종료
      await time.increaseTo(endTime.add(time.duration.minutes(1)));
      
      // 가결 확인
      const state = await this.dao.getProposalState(2);
      assert.equal(state.toString(), "4", "가결 상태가 잘못됨 (Succeeded)");
    });

    it("정족수 미달 시 부결되어야 함", async function () {
      // 새 제안 생성 (높은 정족수)
      const now = await time.latest();
      const startTime = now.add(time.duration.hours(1));
      const endTime = startTime.add(time.duration.days(3));
      
      await this.dao.createProposal(
        "정족수 테스트 제안",
        "이것은 정족수 테스트를 위한 제안입니다.",
        startTime,
        endTime,
        web3.utils.toWei("1000", "ether"), // 정족수 1000
        5000, // 50% 가결 기준
        0, // TokenBased
        { from: proposer }
      );
      
      // 활성 상태로 만들기
      await time.increaseTo(startTime.add(time.duration.minutes(1)));
      
      // 투표 (정족수 미달)
      await this.dao.castVote(2, 1, { from: voter1 }); // 200 토큰
      
      // 투표 종료
      await time.increaseTo(endTime.add(time.duration.minutes(1)));
      
      // 부결 확인
      const state = await this.dao.getProposalState(2);
      assert.equal(state.toString(), "3", "부결 상태가 잘못됨 (Defeated)");
    });

    it("득표율 미달 시 부결되어야 함", async function () {
      // 새 제안 생성
      const now = await time.latest();
      const startTime = now.add(time.duration.hours(1));
      const endTime = startTime.add(time.duration.days(3));
      
      await this.dao.createProposal(
        "득표율 테스트 제안",
        "이것은 득표율 테스트를 위한 제안입니다.",
        startTime,
        endTime,
        web3.utils.toWei("500", "ether"), // 정족수 500
        7000, // 70% 가결 기준
        0, // TokenBased
        { from: proposer }
      );
      
      // 활성 상태로 만들기
      await time.increaseTo(startTime.add(time.duration.minutes(1)));
      
      // 투표 (60% 찬성, 40% 반대)
      await this.dao.castVote(2, 1, { from: voter1 }); // 찬성 200
      await this.dao.castVote(2, 1, { from: voter2 }); // 찬성 200
      await this.dao.castVote(2, 0, { from: voter3 }); // 반대 200
      
      // 투표 종료
      await time.increaseTo(endTime.add(time.duration.minutes(1)));
      
      // 부결 확인 (60% < 70%)
      const state = await this.dao.getProposalState(2);
      assert.equal(state.toString(), "3", "부결 상태가 잘못됨 (Defeated)");
    });

    it("가결된 제안만 실행할 수 있어야 함", async function () {
      // 새 제안 생성
      const now = await time.latest();
      const startTime = now.add(time.duration.hours(1));
      const endTime = startTime.add(time.duration.days(3));
      
      await this.dao.createProposal(
        "실행 테스트 제안",
        "이것은 실행 테스트를 위한 제안입니다.",
        startTime,
        endTime,
        web3.utils.toWei("500", "ether"), // 정족수 500
        5000, // 50% 가결 기준
        0, // TokenBased
        { from: proposer }
      );
      
      // 활성 상태로 만들기
      await time.increaseTo(startTime.add(time.duration.minutes(1)));
      
      // 투표
      await this.dao.castVote(2, 1, { from: voter1 }); // 찬성
      await this.dao.castVote(2, 1, { from: voter2 }); // 찬성
      await this.dao.castVote(2, 0, { from: voter3 }); // 반대
      
      // 투표 종료
      await time.increaseTo(endTime.add(time.duration.minutes(1)));
      
      // 가결 확인
      const state = await this.dao.getProposalState(2);
      assert.equal(state.toString(), "4", "가결 상태가 잘못됨 (Succeeded)");
      
      // 실행
      const result = await this.dao.executeProposal(2, { from: executor });
      
      expectEvent(result, "ProposalExecuted", {
        proposalId: "2"
      });
      
      // 실행 상태 확인
      const newState = await this.dao.getProposalState(2);
      assert.equal(newState.toString(), "7", "실행 상태가 잘못됨 (Executed)");
    });

    it("가결되지 않은 제안은 실행할 수 없어야 함", async function () {
      // 제안 취소
      await this.dao.cancelProposal(1, { from: proposer });
      
      // 취소된 제안 실행 시도
      await expectRevert(
        this.dao.executeProposal(1, { from: executor }),
        "Proposal cannot be executed"
      );
      
      // 새 제안 생성
      const now = await time.latest();
      const startTime = now.add(time.duration.hours(1));
      const endTime = startTime.add(time.duration.days(3));
      
      await this.dao.createProposal(
        "부결 테스트 제안",
        "이것은 부결 테스트를 위한 제안입니다.",
        startTime,
        endTime,
        web3.utils.toWei("500", "ether"), // 정족수 500
        5000, // 50% 가결 기준
        0, // TokenBased
        { from: proposer }
      );
      
      // 활성 상태로 만들기
      await time.increaseTo(startTime.add(time.duration.minutes(1)));
      
      // 투표 (부결될 비율)
      await this.dao.castVote(2, 0, { from: voter1 }); // 반대
      await this.dao.castVote(2, 0, { from: voter2 }); // 반대
      await this.dao.castVote(2, 1, { from: voter3 }); // 찬성
      
      // 투표 종료
      await time.increaseTo(endTime.add(time.duration.minutes(1)));
      
      // 부결 확인
      const state = await this.dao.getProposalState(2);
      assert.equal(state.toString(), "3", "부결 상태가 잘못됨 (Defeated)");
      
      // 부결된 제안 실행 시도
      await expectRevert(
        this.dao.executeProposal(2, { from: executor }),
        "Proposal cannot be executed"
      );
    });

    it("실행 권한이 없는 계정은 제안을 실행할 수 없어야 함", async function () {
      // 새 제안 생성 및 가결
      const now = await time.latest();
      const startTime = now.add(time.duration.hours(1));
      const endTime = startTime.add(time.duration.days(3));
      
      await this.dao.createProposal(
        "권한 테스트 제안",
        "이것은 권한 테스트를 위한 제안입니다.",
        startTime,
        endTime,
        web3.utils.toWei("500", "ether"), // 정족수 500
        5000, // 50% 가결 기준
        0, // TokenBased
        { from: proposer }
      );
      
      // 활성 상태로 만들기
      await time.increaseTo(startTime.add(time.duration.minutes(1)));
      
      // 투표
      await this.dao.castVote(2, 1, { from: voter1 }); // 찬성
      await this.dao.castVote(2, 1, { from: voter2 }); // 찬성
      await this.dao.castVote(2, 0, { from: voter3 }); // 반대
      
      // 투표 종료
      await time.increaseTo(endTime.add(time.duration.minutes(1)));
      
      // 권한 없는 계정의 실행 시도
      await expectRevert(
        this.dao.executeProposal(2, { from: user1 }),
        "Must have executor role to execute"
      );
    });
  });

  describe("제안 취소", function () {
    beforeEach(async function () {
      // 제안 생성
      const now = await time.latest();
      this.startTime = now.add(time.duration.hours(1));
      this.endTime = this.startTime.add(time.duration.days(3));
      
      await this.dao.createProposal(
        "취소 테스트 제안",
        "이것은 제안 취소 테스트를 위한 제안입니다.",
        this.startTime,
        this.endTime,
        0, // 기본 정족수 사용
        0, // 기본 가결 기준 사용
        0, // TokenBased
        { from: proposer }
      );
    });

    it("제안자가 제안을 취소해야 함", async function () {
      const result = await this.dao.cancelProposal(1, { from: proposer });
      
      expectEvent(result, "ProposalCanceled", {
        proposalId: "1"
      });
      
      const proposalInfo = await this.dao.getProposalInfo(1);
      assert.equal(proposalInfo.canceled, true, "취소 상태가 잘못됨");
      assert.equal(proposalInfo.state.toString(), "2", "취소 상태가 잘못됨 (Canceled)");
    });

    it("관리자가 제안을 취소해야 함", async function () {
      const result = await this.dao.cancelProposal(1, { from: admin });
      
      expectEvent(result, "ProposalCanceled", {
        proposalId: "1"
      });
      
      const proposalInfo = await this.dao.getProposalInfo(1);
      assert.equal(proposalInfo.canceled, true, "취소 상태가 잘못됨");
    });

    it("제안자나 관리자가 아닌 계정은 제안을 취소할 수 없어야 함", async function () {
      await expectRevert(
        this.dao.cancelProposal(1, { from: user1 }),
        "Only proposer or admin can cancel"
      );
    });

    it("완료된 제안은 취소할 수 없어야 함", async function () {
      // 투표 시작
      await time.increaseTo(this.startTime.add(time.duration.minutes(1)));
      
      // 충분한 투표
      await this.dao.castVote(1, 1, { from: voter1 }); // 찬성
      await this.dao.castVote(1, 1, { from: voter2 }); // 찬성
      
      // 투표 종료
      await time.increaseTo(this.endTime.add(time.duration.minutes(1)));
      
      // 실행
      await this.dao.executeProposal(1, { from: executor });
      
      // 실행된 제안 취소 시도
      await expectRevert(
        this.dao.cancelProposal(1, { from: proposer }),
        "Cannot cancel proposal in current state"
      );
    });
  });

  describe("투표 가중치 계산", function () {
    it("토큰 기반 투표 가중치가 올바르게 계산되어야 함", async function () {
      const votingPower = await this.dao.calculateVotingPower(voter1, 0); // TokenBased
      assert.equal(votingPower.toString(), voterTokens.toString(), "토큰 기반 투표 가중치가 잘못됨");
    });

    it("NFT 기반 투표 가중치가 올바르게 계산되어야 함", async function () {
      // voter2 (NFT 1개)
      let votingPower = await this.dao.calculateVotingPower(voter2, 1); // NFTBased
      assert.equal(votingPower.toString(), "1", "NFT 기반 투표 가중치가 잘못됨 (voter2)");
      
      // voter3 (NFT 2개)
      votingPower = await this.dao.calculateVotingPower(voter3, 1); // NFTBased
      assert.equal(votingPower.toString(), "2", "NFT 기반 투표 가중치가 잘못됨 (voter3)");
      
      // user1 (NFT 0개)
      votingPower = await this.dao.calculateVotingPower(user1, 1); // NFTBased
      assert.equal(votingPower.toString(), "0", "NFT 기반 투표 가중치가 잘못됨 (user1)");
    });

    it("혼합 기반 투표 가중치가 올바르게 계산되어야 함", async function () {
      // voter1 (토큰 200, NFT 0개)
      let votingPower = await this.dao.calculateVotingPower(voter1, 2); // HybridBased
      assert.equal(votingPower.toString(), voterTokens.toString(), "혼합 기반 투표 가중치가 잘못됨 (voter1)");
      
      // voter2 (토큰 200, NFT 1개)
      votingPower = await this.dao.calculateVotingPower(voter2, 2); // HybridBased
      
      // 예상 가중치: 200e18 + 1e18 = 201e18
      const expectedVotingPower = new BN(voterTokens).add(new BN(web3.utils.toWei("1", "ether")));
      assert.equal(votingPower.toString(), expectedVotingPower.toString(), "혼합 기반 투표 가중치가 잘못됨 (voter2)");
    });

    it("투표 가중치에 따라 투표 결과가 영향을 받아야 함", async function () {
      // 제안 생성 (NFT 기반)
      const now = await time.latest();
      const startTime = now.add(time.duration.hours(1));
      const endTime = startTime.add(time.duration.days(3));
      
      await this.dao.createProposal(
        "NFT 기반 제안",
        "이것은 NFT 기반 투표 테스트를 위한 제안입니다.",
        startTime,
        endTime,
        5, // 정족수 5
        5000, // 50% 가결 기준
        1, // NFTBased
        { from: proposer }
      );
      
      // 활성 상태로 만들기
      await time.increaseTo(startTime.add(time.duration.minutes(1)));
      
      // voter2 (NFT 1개): 반대
      await this.dao.castVote(1, 0, { from: voter2 });
      
      // voter3 (NFT 2개): 찬성
      await this.dao.castVote(1, 1, { from: voter3 });
      
      // 제안 정보 조회
      const proposalInfo = await this.dao.getProposalInfo(1);
      
      // NFT 투표 가중치에 따라 투표 결과 확인
      assert.equal(proposalInfo.forVotes.toString(), "2", "찬성 투표 수가 잘못됨"); // voter3의 NFT 2개
      assert.equal(proposalInfo.againstVotes.toString(), "1", "반대 투표 수가 잘못됨"); // voter2의 NFT 1개
    });
  });

  describe("설정 변경", function () {
    it("관리자가 투표 토큰 주소를 변경해야 함", async function () {
      // 새 토큰 컨트랙트 배포
      const newToken = await NestToken.new(admin);
      
      const result = await this.dao.setVotingToken(newToken.address, { from: admin });
      
      expectEvent(result, "VotingTokenSet", {
        newVotingToken: newToken.address
      });
      
      const votingToken = await this.dao.votingToken();
      assert.equal(votingToken, newToken.address, "투표 토큰 주소가 변경되지 않음");
    });

    it("관리자가 투표권 NFT 주소를 변경해야 함", async function () {
      // 새 NFT 컨트랙트 배포
      const newNFT = await NestNFT.new(admin);
      
      const result = await this.dao.setVotingNFT(newNFT.address, { from: admin });
      
      expectEvent(result, "VotingNFTSet", {
        newVotingNFT: newNFT.address
      });
      
      const votingNFT = await this.dao.votingNFT();
      assert.equal(votingNFT, newNFT.address, "투표권 NFT 주소가 변경되지 않음");
    });

    it("관리자가 XP 계약 주소를 변경해야 함", async function () {
      const newXPContract = "0x0000000000000000000000000000000000000002";
      
      const result = await this.dao.setXPContract(newXPContract, { from: admin });
      
      expectEvent(result, "XPContractSet", {
        newXPContract: newXPContract
      });
      
      const xpContractAddress = await this.dao.xpContractAddress();
      assert.equal(xpContractAddress, newXPContract, "XP 계약 주소가 변경되지 않음");
    });

    it("관리자가 제안 최소 토큰 수를 변경해야 함", async function () {
      const newProposalThreshold = web3.utils.toWei("200", "ether");
      
      const result = await this.dao.setProposalThreshold(newProposalThreshold, { from: admin });
      
      expectEvent(result, "ProposalThresholdSet", {
        newProposalThreshold: newProposalThreshold
      });
      
      const proposalThreshold = await this.dao.proposalThreshold();
      assert.equal(proposalThreshold.toString(), newProposalThreshold.toString(), "제안 최소 토큰 수가 변경되지 않음");
    });

    it("관리자가 기본 정족수를 변경해야 함", async function () {
      const newDefaultQuorum = web3.utils.toWei("2000", "ether");
      
      const result = await this.dao.setDefaultQuorum(newDefaultQuorum, { from: admin });
      
      expectEvent(result, "QuorumSet", {
        newDefaultQuorum: newDefaultQuorum
      });
      
      const defaultQuorum = await this.dao.defaultQuorum();
      assert.equal(defaultQuorum.toString(), newDefaultQuorum.toString(), "기본 정족수가 변경되지 않음");
    });

    it("관리자가 기본 가결 기준을 변경해야 함", async function () {
      const newDefaultThreshold = 6000; // 60%
      
      const result = await this.dao.setDefaultThreshold(newDefaultThreshold, { from: admin });
      
      expectEvent(result, "ThresholdSet", {
        newDefaultThreshold: newDefaultThreshold.toString()
      });
      
      const defaultThreshold = await this.dao.defaultThreshold();
      assert.equal(defaultThreshold.toString(), newDefaultThreshold.toString(), "기본 가결 기준이 변경되지 않음");
    });

    it("관리자가 투표 기간을 변경해야 함", async function () {
      const newMinVotingPeriod = 60 * 60 * 12; // 12시간
      const newMaxVotingPeriod = 60 * 60 * 24 * 14; // 14일
      
      const result = await this.dao.setVotingPeriod(newMinVotingPeriod, newMaxVotingPeriod, { from: admin });
      
      expectEvent(result, "VotingPeriodSet", {
        minVotingPeriod: new BN(newMinVotingPeriod),
        maxVotingPeriod: new BN(newMaxVotingPeriod)
      });
      
      const minVotingPeriod = await this.dao.minVotingPeriod();
      const maxVotingPeriod = await this.dao.maxVotingPeriod();
      assert.equal(minVotingPeriod.toString(), newMinVotingPeriod.toString(), "최소 투표 기간이 변경되지 않음");
      assert.equal(maxVotingPeriod.toString(), newMaxVotingPeriod.toString(), "최대 투표 기간이 변경되지 않음");
    });

    it("관리자가 아닌 계정은 설정을 변경할 수 없어야 함", async function () {
      await expectRevert(
        this.dao.setVotingToken(this.nestToken.address, { from: user1 }),
        "AccessControl: account " + user1.toLowerCase() + " is missing role " + await this.dao.DEFAULT_ADMIN_ROLE()
      );
      
      await expectRevert(
        this.dao.setVotingNFT(this.nestNFT.address, { from: user1 }),
        "AccessControl: account " + user1.toLowerCase() + " is missing role " + await this.dao.DEFAULT_ADMIN_ROLE()
      );
      
      await expectRevert(
        this.dao.setXPContract(this.xpContract, { from: user1 }),
        "AccessControl: account " + user1.toLowerCase() + " is missing role " + await this.dao.DEFAULT_ADMIN_ROLE()
      );
      
      await expectRevert(
        this.dao.setProposalThreshold(1000, { from: user1 }),
        "AccessControl: account " + user1.toLowerCase() + " is missing role " + await this.dao.DEFAULT_ADMIN_ROLE()
      );
      
      await expectRevert(
        this.dao.setDefaultQuorum(1000, { from: user1 }),
        "AccessControl: account " + user1.toLowerCase() + " is missing role " + await this.dao.DEFAULT_ADMIN_ROLE()
      );
      
      await expectRevert(
        this.dao.setDefaultThreshold(5000, { from: user1 }),
        "AccessControl: account " + user1.toLowerCase() + " is missing role " + await this.dao.DEFAULT_ADMIN_ROLE()
      );
      
      await expectRevert(
        this.dao.setVotingPeriod(1000, 2000, { from: user1 }),
        "AccessControl: account " + user1.toLowerCase() + " is missing role " + await this.dao.DEFAULT_ADMIN_ROLE()
      );
    });

    it("잘못된 가결 기준 설정은 실패해야 함", async function () {
      // 100%를 초과하는 가결 기준
      await expectRevert(
        this.dao.setDefaultThreshold(10001, { from: admin }),
        "Threshold cannot exceed 100%"
      );
    });

    it("잘못된 투표 기간 설정은 실패해야 함", async function () {
      // 최소 투표 기간이 최대 투표 기간보다 긴 경우
      await expectRevert(
        this.dao.setVotingPeriod(1000, 500, { from: admin }),
        "Min voting period must be <= max voting period"
      );
    });
  });

  describe("역할 관리", function () {
    it("관리자가 역할을 부여해야 함", async function () {
      // user1에게 PROPOSER_ROLE 부여
      await this.dao.grantRole(await this.dao.PROPOSER_ROLE(), user1, { from: admin });
      
      const isProposer = await this.dao.hasRole(await this.dao.PROPOSER_ROLE(), user1);
      assert.equal(isProposer, true, "역할이 부여되지 않음");
    });

    it("관리자가 역할을 제거해야 함", async function () {
      // proposer에게서 PROPOSER_ROLE 제거
      await this.dao.revokeRole(await this.dao.PROPOSER_ROLE(), proposer, { from: admin });
      
      const isProposer = await this.dao.hasRole(await this.dao.PROPOSER_ROLE(), proposer);
      assert.equal(isProposer, false, "역할이 제거되지 않음");
    });

    it("관리자가 아닌 계정은 역할을 부여하거나 제거할 수 없어야 함", async function () {
      await expectRevert(
        this.dao.grantRole(await this.dao.PROPOSER_ROLE(), user1, { from: user2 }),
        "AccessControl: account " + user2.toLowerCase() + " is missing role " + await this.dao.DEFAULT_ADMIN_ROLE()
      );
      
      await expectRevert(
        this.dao.revokeRole(await this.dao.PROPOSER_ROLE(), proposer, { from: user2 }),
        "AccessControl: account " + user2.toLowerCase() + " is missing role " + await this.dao.DEFAULT_ADMIN_ROLE()
      );
    });
  });

  describe("일시 중지 기능", function () {
    it("일시 중지 권한이 있는 계정이 컨트랙트를 일시 중지해야 함", async function () {
      await this.dao.pause({ from: admin });
      
      const paused = await this.dao.paused();
      assert.equal(paused, true, "일시 중지 상태가 잘못됨");
      
      // 일시 중지 상태에서는 제안 생성이 실패해야 함
      const now = await time.latest();
      const startTime = now.add(time.duration.hours(1));
      const endTime = startTime.add(time.duration.days(3));
      
      await expectRevert(
        this.dao.createProposal(
          "실패할 제안",
          "이 제안은 실패해야 합니다.",
          startTime,
          endTime,
          0,
          0,
          0,
          { from: proposer }
        ),
        "Pausable: paused"
      );
    });

    it("일시 중지 권한이 있는 계정이 컨트랙트를 일시 중지 해제해야 함", async function () {
      // 일시 중지
      await this.dao.pause({ from: admin });
      
      // 일시 중지 해제
      await this.dao.unpause({ from: admin });
      
      const paused = await this.dao.paused();
      assert.equal(paused, false, "일시 중지 해제 상태가 잘못됨");
      
      // 일시 중지 해제 후 제안 생성이 성공해야 함
      const now = await time.latest();
      const startTime = now.add(time.duration.hours(1));
      const endTime = startTime.add(time.duration.days(3));
      
      await this.dao.createProposal(
        "성공할 제안",
        "이 제안은 성공해야 합니다.",
        startTime,
        endTime,
        0,
        0,
        0,
        { from: proposer }
      );
    });

    it("일시 중지 권한이 없는 계정은 컨트랙트를 일시 중지하거나 해제할 수 없어야 함", async function () {
      await expectRevert(
        this.dao.pause({ from: user1 }),
        "AccessControl: account " + user1.toLowerCase() + " is missing role " + await this.dao.PAUSER_ROLE()
      );
      
      // 일시 중지 후
      await this.dao.pause({ from: admin });
      
      await expectRevert(
        this.dao.unpause({ from: user1 }),
        "AccessControl: account " + user1.toLowerCase() + " is missing role " + await this.dao.PAUSER_ROLE()
      );
    });
  });
});
