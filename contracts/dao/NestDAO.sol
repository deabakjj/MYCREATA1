// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title NestDAO
 * @notice Nest 플랫폼의 DAO 투표 모듈
 * @dev 이 컨트랙트는 다음 기능을 제공합니다:
 * - 제안 생성 및 관리
 * - 투표 기능 (투표 가중치 포함)
 * - 투표 권한 확인 (토큰 또는 NFT 기반)
 * - 제안 실행
 */
contract NestDAO is AccessControl, Pausable, ReentrancyGuard {
    using Counters for Counters.Counter;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    bytes32 public constant VOTER_ROLE = keccak256("VOTER_ROLE");

    // 제안 상태
    enum ProposalState {
        Pending,    // 대기 중
        Active,     // 활성 상태
        Canceled,   // 취소됨
        Defeated,   // 부결됨
        Succeeded,  // 가결됨
        Queued,     // 대기열에 있음
        Expired,    // 만료됨
        Executed    // 실행됨
    }

    // 투표 유형
    enum VoteType {
        Against,    // 반대
        For,        // 찬성
        Abstain     // 기권
    }

    // 투표 가중치 계산 방식
    enum VotingPowerStrategy {
        TokenBased,     // 토큰 기반 (1토큰 = 1표)
        NFTBased,       // NFT 기반 (1 NFT = 1표)
        HybridBased,    // 혼합 (토큰 + NFT)
        XPBased         // 경험치(XP) 기반
    }

    // 제안 구조체
    struct Proposal {
        uint256 id;                      // 제안 ID
        address proposer;                // 제안자 주소
        string title;                    // 제안 제목
        string description;              // 제안 설명
        uint256 startTime;               // 투표 시작 시간
        uint256 endTime;                 // 투표 종료 시간
        uint256 forVotes;                // 찬성 투표 수
        uint256 againstVotes;            // 반대 투표 수
        uint256 abstainVotes;            // 기권 투표 수
        uint256 quorum;                  // 정족수 (투표 성립을 위한 최소 투표 수)
        uint256 threshold;               // 가결 기준 (성공을 위한 최소 찬성 비율, 10000 = 100%)
        bool canceled;                   // 취소 여부
        bool executed;                   // 실행 여부
        VotingPowerStrategy votingPowerStrategy;  // 투표 가중치 계산 방식
        mapping(address => Receipt) receipts;     // 사용자별 투표 내역
    }

    // 투표 영수증 구조체
    struct Receipt {
        bool hasVoted;           // 투표 여부
        VoteType vote;           // 투표 유형
        uint256 votingPower;     // 투표 가중치
    }

    // 제안 정보 (반환용)
    struct ProposalInfo {
        uint256 id;                      // 제안 ID
        address proposer;                // 제안자 주소
        string title;                    // 제안 제목
        string description;              // 제안 설명
        uint256 startTime;               // 투표 시작 시간
        uint256 endTime;                 // 투표 종료 시간
        uint256 forVotes;                // 찬성 투표 수
        uint256 againstVotes;            // 반대 투표 수
        uint256 abstainVotes;            // 기권 투표 수
        uint256 quorum;                  // 정족수
        uint256 threshold;               // 가결 기준
        bool canceled;                   // 취소 여부
        bool executed;                   // 실행 여부
        ProposalState state;             // 제안 상태
        VotingPowerStrategy votingPowerStrategy;  // 투표 가중치 계산 방식
    }

    // 제안 ID 카운터
    Counters.Counter private _proposalIdCounter;

    // 제안 ID => 제안 매핑
    mapping(uint256 => Proposal) private _proposals;

    // 제안 ID 목록
    uint256[] private _proposalIds;

    // 투표 토큰 주소 (NEST 토큰)
    IERC20 public votingToken;

    // 투표권 NFT 주소
    IERC721 public votingNFT;

    // XP 계약 인터페이스 (XP 기반 투표 가중치용)
    address public xpContractAddress;

    // 최소 제안 요구 토큰 수
    uint256 public proposalThreshold;

    // 기본 정족수
    uint256 public defaultQuorum;

    // 기본 가결 기준 (100% = 10000)
    uint256 public defaultThreshold;

    // 최소 투표 기간 (초)
    uint256 public minVotingPeriod;

    // 최대 투표 기간 (초)
    uint256 public maxVotingPeriod;

    // 이벤트
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        uint256 startTime,
        uint256 endTime,
        VotingPowerStrategy votingPowerStrategy
    );
    event ProposalCanceled(uint256 indexed proposalId);
    event ProposalExecuted(uint256 indexed proposalId);
    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        uint8 vote,
        uint256 votingPower
    );
    event VotingTokenSet(address indexed newVotingToken);
    event VotingNFTSet(address indexed newVotingNFT);
    event XPContractSet(address indexed newXPContract);
    event ProposalThresholdSet(uint256 newProposalThreshold);
    event QuorumSet(uint256 newQuorum);
    event ThresholdSet(uint256 newThreshold);
    event VotingPeriodSet(uint256 minVotingPeriod, uint256 maxVotingPeriod);

    /**
     * @dev 컨트랙트 생성자
     * @param admin 관리자 주소
     * @param _votingToken 투표 토큰 주소 (NEST)
     * @param _votingNFT 투표권 NFT 주소
     * @param _xpContractAddress XP 계약 주소
     * @param _proposalThreshold 제안 최소 토큰 수
     * @param _defaultQuorum 기본 정족수
     * @param _defaultThreshold 기본 가결 기준 (100% = 10000)
     * @param _minVotingPeriod 최소 투표 기간 (초)
     * @param _maxVotingPeriod 최대 투표 기간 (초)
     */
    constructor(
        address admin,
        address _votingToken,
        address _votingNFT,
        address _xpContractAddress,
        uint256 _proposalThreshold,
        uint256 _defaultQuorum,
        uint256 _defaultThreshold,
        uint256 _minVotingPeriod,
        uint256 _maxVotingPeriod
    ) {
        require(_votingToken != address(0), "Voting token cannot be zero address");
        require(_defaultThreshold <= 10000, "Threshold cannot exceed 100%");
        require(_minVotingPeriod <= _maxVotingPeriod, "Min voting period must be <= max voting period");

        _setupRoles(admin);
        
        votingToken = IERC20(_votingToken);
        votingNFT = IERC721(_votingNFT);
        xpContractAddress = _xpContractAddress;
        proposalThreshold = _proposalThreshold;
        defaultQuorum = _defaultQuorum;
        defaultThreshold = _defaultThreshold;
        minVotingPeriod = _minVotingPeriod;
        maxVotingPeriod = _maxVotingPeriod;
    }

    /**
     * @dev 관리자 역할 설정
     * @param admin 관리자 주소
     */
    function _setupRoles(address admin) private {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(PROPOSER_ROLE, admin);
        _grantRole(EXECUTOR_ROLE, admin);
        _grantRole(VOTER_ROLE, admin);
    }

    /**
     * @dev 새 제안 생성
     * @param title 제안 제목
     * @param description 제안 설명
     * @param startTime 투표 시작 시간
     * @param endTime 투표 종료 시간
     * @param quorum 정족수 (0이면 기본값 사용)
     * @param threshold 가결 기준 (0이면 기본값 사용)
     * @param votingPowerStrategy 투표 가중치 계산 방식
     * @return 생성된 제안 ID
     */
    function createProposal(
        string memory title,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        uint256 quorum,
        uint256 threshold,
        VotingPowerStrategy votingPowerStrategy
    ) external whenNotPaused nonReentrant returns (uint256) {
        // 제안자 역할이 있거나, 최소 토큰을 보유하고 있어야 함
        require(
            hasRole(PROPOSER_ROLE, msg.sender) || votingToken.balanceOf(msg.sender) >= proposalThreshold,
            "Insufficient tokens to create proposal"
        );
        
        // 투표 기간 유효성 검사
        require(startTime >= block.timestamp, "Start time must be in the future");
        require(endTime > startTime, "End time must be after start time");
        require(endTime - startTime >= minVotingPeriod, "Voting period too short");
        require(endTime - startTime <= maxVotingPeriod, "Voting period too long");
        
        // 제안 ID 생성
        _proposalIdCounter.increment();
        uint256 proposalId = _proposalIdCounter.current();
        
        // 정족수와 가결 기준이 0이면 기본값 사용
        uint256 _quorum = quorum > 0 ? quorum : defaultQuorum;
        uint256 _threshold = threshold > 0 ? threshold : defaultThreshold;
        
        // 제안 생성
        Proposal storage newProposal = _proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.proposer = msg.sender;
        newProposal.title = title;
        newProposal.description = description;
        newProposal.startTime = startTime;
        newProposal.endTime = endTime;
        newProposal.quorum = _quorum;
        newProposal.threshold = _threshold;
        newProposal.votingPowerStrategy = votingPowerStrategy;
        
        // 제안 ID 목록에 추가
        _proposalIds.push(proposalId);
        
        emit ProposalCreated(proposalId, msg.sender, title, startTime, endTime, votingPowerStrategy);
        
        return proposalId;
    }

    /**
     * @dev 제안에 투표
     * @param proposalId 제안 ID
     * @param vote 투표 유형 (0: 반대, 1: 찬성, 2: 기권)
     */
    function castVote(uint256 proposalId, uint8 vote) external whenNotPaused nonReentrant {
        require(vote <= uint8(VoteType.Abstain), "Invalid vote type");
        
        // 유효한 제안인지 확인
        require(_proposalExists(proposalId), "Proposal does not exist");
        
        // 제안 상태 확인
        ProposalState state = getProposalState(proposalId);
        require(state == ProposalState.Active, "Proposal is not active");
        
        Proposal storage proposal = _proposals[proposalId];
        
        // 이미 투표했는지 확인
        require(!proposal.receipts[msg.sender].hasVoted, "Already voted");
        
        // 투표 권한 확인
        require(hasVoteRight(msg.sender), "No voting rights");
        
        // 투표 가중치 계산
        uint256 votingPower = calculateVotingPower(msg.sender, proposal.votingPowerStrategy);
        require(votingPower > 0, "Voting power is zero");
        
        // 투표 기록
        proposal.receipts[msg.sender].hasVoted = true;
        proposal.receipts[msg.sender].vote = VoteType(vote);
        proposal.receipts[msg.sender].votingPower = votingPower;
        
        // 투표 집계
        if (vote == uint8(VoteType.Against)) {
            proposal.againstVotes += votingPower;
        } else if (vote == uint8(VoteType.For)) {
            proposal.forVotes += votingPower;
        } else {
            proposal.abstainVotes += votingPower;
        }
        
        emit VoteCast(msg.sender, proposalId, vote, votingPower);
    }

    /**
     * @dev 제안 취소
     * @param proposalId 제안 ID
     */
    function cancelProposal(uint256 proposalId) external nonReentrant {
        require(_proposalExists(proposalId), "Proposal does not exist");
        
        Proposal storage proposal = _proposals[proposalId];
        
        // 제안자 또는 관리자만 취소 가능
        require(
            proposal.proposer == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Only proposer or admin can cancel"
        );
        
        // 상태 확인
        ProposalState state = getProposalState(proposalId);
        require(
            state == ProposalState.Pending || state == ProposalState.Active,
            "Cannot cancel proposal in current state"
        );
        
        // 취소 상태로 변경
        proposal.canceled = true;
        
        emit ProposalCanceled(proposalId);
    }

    /**
     * @dev 제안 실행
     * @param proposalId 제안 ID
     */
    function executeProposal(uint256 proposalId) external nonReentrant {
        require(_proposalExists(proposalId), "Proposal does not exist");
        require(hasRole(EXECUTOR_ROLE, msg.sender), "Must have executor role to execute");
        
        // 상태 확인
        ProposalState state = getProposalState(proposalId);
        require(state == ProposalState.Succeeded, "Proposal cannot be executed");
        
        Proposal storage proposal = _proposals[proposalId];
        
        // 실행 상태로 변경
        proposal.executed = true;
        
        emit ProposalExecuted(proposalId);
        
        // 여기에서 제안 내용에 따른 실행 로직 추가 가능
        // 예: 외부 컨트랙트 호출, 시스템 설정 변경 등
    }

    /**
     * @dev 제안 상태 조회
     * @param proposalId 제안 ID
     * @return 제안 상태
     */
    function getProposalState(uint256 proposalId) public view returns (ProposalState) {
        require(_proposalExists(proposalId), "Proposal does not exist");
        
        Proposal storage proposal = _proposals[proposalId];
        
        if (proposal.canceled) {
            return ProposalState.Canceled;
        }
        
        if (proposal.executed) {
            return ProposalState.Executed;
        }
        
        if (block.timestamp < proposal.startTime) {
            return ProposalState.Pending;
        }
        
        if (block.timestamp <= proposal.endTime) {
            return ProposalState.Active;
        }
        
        // 투표 종료 후 정족수 확인
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        if (totalVotes < proposal.quorum) {
            return ProposalState.Defeated; // 정족수 미달
        }
        
        // 가결 여부 확인
        uint256 totalValidVotes = proposal.forVotes + proposal.againstVotes;
        if (totalValidVotes == 0) {
            return ProposalState.Defeated; // 유효 투표 없음
        }
        
        uint256 forVotesPercent = (proposal.forVotes * 10000) / totalValidVotes;
        if (forVotesPercent >= proposal.threshold) {
            return ProposalState.Succeeded; // 가결
        } else {
            return ProposalState.Defeated; // 부결
        }
    }

    /**
     * @dev 제안 정보 조회
     * @param proposalId 제안 ID
     * @return 제안 정보
     */
    function getProposalInfo(uint256 proposalId) external view returns (ProposalInfo memory) {
        require(_proposalExists(proposalId), "Proposal does not exist");
        
        Proposal storage proposal = _proposals[proposalId];
        
        return ProposalInfo({
            id: proposal.id,
            proposer: proposal.proposer,
            title: proposal.title,
            description: proposal.description,
            startTime: proposal.startTime,
            endTime: proposal.endTime,
            forVotes: proposal.forVotes,
            againstVotes: proposal.againstVotes,
            abstainVotes: proposal.abstainVotes,
            quorum: proposal.quorum,
            threshold: proposal.threshold,
            canceled: proposal.canceled,
            executed: proposal.executed,
            state: getProposalState(proposalId),
            votingPowerStrategy: proposal.votingPowerStrategy
        });
    }

    /**
     * @dev 사용자의 투표 내역 조회
     * @param proposalId 제안 ID
     * @param voter 투표자 주소
     * @return hasVoted 투표 여부
     * @return vote 투표 유형
     * @return votingPower 투표 가중치
     */
    function getReceipt(uint256 proposalId, address voter) external view returns (
        bool hasVoted,
        uint8 vote,
        uint256 votingPower
    ) {
        require(_proposalExists(proposalId), "Proposal does not exist");
        
        Receipt storage receipt = _proposals[proposalId].receipts[voter];
        
        return (
            receipt.hasVoted,
            uint8(receipt.vote),
            receipt.votingPower
        );
    }

    /**
     * @dev 모든 제안 ID 조회
     * @return 모든 제안 ID 배열
     */
    function getAllProposalIds() external view returns (uint256[] memory) {
        return _proposalIds;
    }

    /**
     * @dev 제안 필터링 (상태별)
     * @param state 필터링할 상태
     * @return 필터링된 제안 ID 배열
     */
    function filterProposalsByState(ProposalState state) external view returns (uint256[] memory) {
        uint256[] memory filteredIds = new uint256[](_proposalIds.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < _proposalIds.length; i++) {
            uint256 proposalId = _proposalIds[i];
            if (getProposalState(proposalId) == state) {
                filteredIds[count] = proposalId;
                count++;
            }
        }
        
        // 필터링된 ID 배열 크기 조정
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = filteredIds[i];
        }
        
        return result;
    }

    /**
     * @dev 사용자의 투표 가중치 계산
     * @param user 사용자 주소
     * @param strategy 투표 가중치 계산 방식
     * @return 투표 가중치
     */
    function calculateVotingPower(address user, VotingPowerStrategy strategy) public view returns (uint256) {
        if (strategy == VotingPowerStrategy.TokenBased) {
            // 토큰 기반 (1토큰 = 1표)
            return votingToken.balanceOf(user);
        } else if (strategy == VotingPowerStrategy.NFTBased) {
            // NFT 기반 (1 NFT = 1표)
            return votingNFT.balanceOf(user);
        } else if (strategy == VotingPowerStrategy.HybridBased) {
            // 혼합 (토큰 + NFT)
            uint256 tokenPower = votingToken.balanceOf(user);
            uint256 nftPower = votingNFT.balanceOf(user);
            return tokenPower + (nftPower * 1e18); // NFT당 1토큰과 동일한 가중치
        } else if (strategy == VotingPowerStrategy.XPBased) {
            // XP 기반
            return _getXP(user);
        }
        
        return 0;
    }

    /**
     * @dev 사용자의 XP 조회
     * @param user 사용자 주소
     * @return XP 값
     */
    function _getXP(address user) internal view returns (uint256) {
        if (xpContractAddress == address(0)) {
            return 0;
        }
        
        // XP 컨트랙트 호출 로직
        // 실제 구현에서는 적절한 인터페이스를 통해 호출해야 함
        // 예: IXPContract(xpContractAddress).getXP(user);
        
        // 임시 반환 (테스트용)
        return 1;
    }

    /**
     * @dev 사용자의 투표 권한 확인
     * @param user 사용자 주소
     * @return 투표 권한 여부
     */
    function hasVoteRight(address user) public view returns (bool) {
        // VOTER_ROLE이 있거나, 토큰 또는 NFT를 보유하고 있으면 투표 가능
        return hasRole(VOTER_ROLE, user) || 
               votingToken.balanceOf(user) > 0 || 
               votingNFT.balanceOf(user) > 0 ||
               _getXP(user) > 0;
    }

    /**
     * @dev 제안이 존재하는지 확인
     * @param proposalId 제안 ID
     * @return 존재 여부
     */
    function _proposalExists(uint256 proposalId) internal view returns (bool) {
        return proposalId > 0 && proposalId <= _proposalIdCounter.current() && 
               _proposals[proposalId].proposer != address(0);
    }

    /**
     * @dev 투표 토큰 주소 설정
     * @param _votingToken 새 투표 토큰 주소
     */
    function setVotingToken(address _votingToken) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_votingToken != address(0), "Voting token cannot be zero address");
        votingToken = IERC20(_votingToken);
        emit VotingTokenSet(_votingToken);
    }

    /**
     * @dev 투표권 NFT 주소 설정
     * @param _votingNFT 새 투표권 NFT 주소
     */
    function setVotingNFT(address _votingNFT) external onlyRole(DEFAULT_ADMIN_ROLE) {
        votingNFT = IERC721(_votingNFT);
        emit VotingNFTSet(_votingNFT);
    }

    /**
     * @dev XP 계약 주소 설정
     * @param _xpContractAddress 새 XP 계약 주소
     */
    function setXPContract(address _xpContractAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        xpContractAddress = _xpContractAddress;
        emit XPContractSet(_xpContractAddress);
    }

    /**
     * @dev 제안 최소 토큰 수 설정
     * @param _proposalThreshold 새 제안 최소 토큰 수
     */
    function setProposalThreshold(uint256 _proposalThreshold) external onlyRole(DEFAULT_ADMIN_ROLE) {
        proposalThreshold = _proposalThreshold;
        emit ProposalThresholdSet(_proposalThreshold);
    }

    /**
     * @dev 기본 정족수 설정
     * @param _defaultQuorum 새 기본 정족수
     */
    function setDefaultQuorum(uint256 _defaultQuorum) external onlyRole(DEFAULT_ADMIN_ROLE) {
        defaultQuorum = _defaultQuorum;
        emit QuorumSet(_defaultQuorum);
    }

    /**
     * @dev 기본 가결 기준 설정
     * @param _defaultThreshold 새 기본 가결 기준
     */
    function setDefaultThreshold(uint256 _defaultThreshold) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_defaultThreshold <= 10000, "Threshold cannot exceed 100%");
        defaultThreshold = _defaultThreshold;
        emit ThresholdSet(_defaultThreshold);
    }

    /**
     * @dev 투표 기간 설정
     * @param _minVotingPeriod 새 최소 투표 기간
     * @param _maxVotingPeriod 새 최대 투표 기간
     */
    function setVotingPeriod(uint256 _minVotingPeriod, uint256 _maxVotingPeriod) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_minVotingPeriod <= _maxVotingPeriod, "Min voting period must be <= max voting period");
        minVotingPeriod = _minVotingPeriod;
        maxVotingPeriod = _maxVotingPeriod;
        emit VotingPeriodSet(_minVotingPeriod, _maxVotingPeriod);
    }

    /**
     * @dev 역할 부여
     * @param role 역할
     * @param account 계정 주소
     */
    function grantRole(bytes32 role, address account) public override onlyRole(getRoleAdmin(role)) {
        super.grantRole(role, account);
    }

    /**
     * @dev 역할 제거
     * @param role 역할
     * @param account 계정 주소
     */
    function revokeRole(bytes32 role, address account) public override onlyRole(getRoleAdmin(role)) {
        super.revokeRole(role, account);
    }

    /**
     * @dev 컨트랙트 일시 중지
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev 컨트랙트 일시 중지 해제
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}
