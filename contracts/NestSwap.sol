// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title NestSwap
 * @notice CTA와 NEST 토큰 간의 교환(스왑)을 위한 컨트랙트
 * @dev 이 컨트랙트는 다음 기능을 제공합니다:
 * - CTA에서 NEST로의 교환
 * - NEST에서 CTA로의 교환
 * - 교환 비율 관리
 * - 화이트리스트 및 제한 기능
 */
contract NestSwap is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant RATE_SETTER_ROLE = keccak256("RATE_SETTER_ROLE");
    bytes32 public constant WHITELIST_MANAGER_ROLE = keccak256("WHITELIST_MANAGER_ROLE");
    bytes32 public constant WITHDRAWAL_ROLE = keccak256("WITHDRAWAL_ROLE");

    // CTA 토큰 컨트랙트 주소
    IERC20 public ctaToken;
    
    // NEST 토큰 컨트랙트 주소
    IERC20 public nestToken;
    
    // 교환 비율: 1 CTA = ctaToNestRate NEST
    uint256 public ctaToNestRate;
    
    // 교환 비율: 1 NEST = nestToCtaRate CTA
    uint256 public nestToCtaRate;
    
    // 화이트리스트 모드 활성화 여부
    bool public whitelistMode = false;
    
    // 주소별 화이트리스트 상태
    mapping(address => bool) public whitelist;
    
    // 주소별 일일 최대 교환량 (CTA 기준)
    mapping(address => uint256) public dailyLimits;
    
    // 기본 일일 최대 교환량 (CTA 기준)
    uint256 public defaultDailyLimit;
    
    // 주소별 일일 교환 누적량
    mapping(address => uint256) public dailySwapped;
    
    // 주소별 마지막 교환 일자 (UNIX 타임스탬프의 일자 부분)
    mapping(address => uint256) public lastSwapDay;

    // 이벤트
    event SwapCtaToNest(address indexed user, uint256 ctaAmount, uint256 nestAmount);
    event SwapNestToCta(address indexed user, uint256 nestAmount, uint256 ctaAmount);
    event RateUpdated(uint256 ctaToNestRate, uint256 nestToCtaRate);
    event WhitelistModeUpdated(bool enabled);
    event AddedToWhitelist(address indexed account);
    event RemovedFromWhitelist(address indexed account);
    event DailyLimitUpdated(address indexed account, uint256 limit);
    event DefaultDailyLimitUpdated(uint256 limit);
    event TokensWithdrawn(address indexed token, address indexed to, uint256 amount);

    /**
     * @dev 컨트랙트 생성자
     * @param admin 관리자 주소
     * @param _ctaToken CTA 토큰 주소
     * @param _nestToken NEST 토큰 주소
     * @param _ctaToNestRate 초기 CTA->NEST 교환 비율
     * @param _nestToCtaRate 초기 NEST->CTA 교환 비율
     * @param _defaultDailyLimit 기본 일일 최대 교환량
     */
    constructor(
        address admin,
        address _ctaToken,
        address _nestToken,
        uint256 _ctaToNestRate,
        uint256 _nestToCtaRate,
        uint256 _defaultDailyLimit
    ) {
        require(_ctaToken != address(0), "CTA token address cannot be zero");
        require(_nestToken != address(0), "NEST token address cannot be zero");
        require(_ctaToNestRate > 0, "CTA to NEST rate must be positive");
        require(_nestToCtaRate > 0, "NEST to CTA rate must be positive");
        
        _setupRoles(admin);
        
        ctaToken = IERC20(_ctaToken);
        nestToken = IERC20(_nestToken);
        ctaToNestRate = _ctaToNestRate;
        nestToCtaRate = _nestToCtaRate;
        defaultDailyLimit = _defaultDailyLimit;
    }

    /**
     * @dev 관리자 역할 설정
     * @param admin 관리자 주소
     */
    function _setupRoles(address admin) private {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(RATE_SETTER_ROLE, admin);
        _grantRole(WHITELIST_MANAGER_ROLE, admin);
        _grantRole(WITHDRAWAL_ROLE, admin);
    }

    /**
     * @dev CTA를 NEST로 교환
     * @param ctaAmount 교환할 CTA 양
     * @return 받은 NEST 양
     */
    function swapCtaToNest(uint256 ctaAmount) external whenNotPaused nonReentrant returns (uint256) {
        require(ctaAmount > 0, "Amount must be positive");
        
        // 화이트리스트 확인
        if (whitelistMode) {
            require(whitelist[msg.sender], "Not whitelisted");
        }
        
        // 일일 한도 확인
        _checkAndUpdateDailyLimit(msg.sender, ctaAmount);
        
        // 받을 NEST 양 계산
        uint256 nestAmount = (ctaAmount * ctaToNestRate);
        
        // 컨트랙트가 충분한 NEST를 가지고 있는지 확인
        require(nestToken.balanceOf(address(this)) >= nestAmount, "Insufficient NEST in contract");
        
        // CTA 전송 (사용자 -> 컨트랙트)
        require(ctaToken.transferFrom(msg.sender, address(this), ctaAmount), "CTA transfer failed");
        
        // NEST 전송 (컨트랙트 -> 사용자)
        require(nestToken.transfer(msg.sender, nestAmount), "NEST transfer failed");
        
        emit SwapCtaToNest(msg.sender, ctaAmount, nestAmount);
        
        return nestAmount;
    }

    /**
     * @dev NEST를 CTA로 교환
     * @param nestAmount 교환할 NEST 양
     * @return 받은 CTA 양
     */
    function swapNestToCta(uint256 nestAmount) external whenNotPaused nonReentrant returns (uint256) {
        require(nestAmount > 0, "Amount must be positive");
        
        // 화이트리스트 확인
        if (whitelistMode) {
            require(whitelist[msg.sender], "Not whitelisted");
        }
        
        // 받을 CTA 양 계산
        uint256 ctaAmount = (nestAmount * nestToCtaRate) / 1e18;
        
        // 일일 한도 확인
        _checkAndUpdateDailyLimit(msg.sender, ctaAmount);
        
        // 컨트랙트가 충분한 CTA를 가지고 있는지 확인
        require(ctaToken.balanceOf(address(this)) >= ctaAmount, "Insufficient CTA in contract");
        
        // NEST 전송 (사용자 -> 컨트랙트)
        require(nestToken.transferFrom(msg.sender, address(this), nestAmount), "NEST transfer failed");
        
        // CTA 전송 (컨트랙트 -> 사용자)
        require(ctaToken.transfer(msg.sender, ctaAmount), "CTA transfer failed");
        
        emit SwapNestToCta(msg.sender, nestAmount, ctaAmount);
        
        return ctaAmount;
    }

    /**
     * @dev 일일 한도 확인 및 업데이트
     * @param user 사용자 주소
     * @param ctaAmount CTA 양
     */
    function _checkAndUpdateDailyLimit(address user, uint256 ctaAmount) internal {
        uint256 today = block.timestamp / 1 days;
        uint256 userLimit = _getUserDailyLimit(user);
        
        // 새 날짜면 누적량 초기화
        if (lastSwapDay[user] < today) {
            dailySwapped[user] = 0;
            lastSwapDay[user] = today;
        }
        
        // 한도 확인
        require(dailySwapped[user] + ctaAmount <= userLimit, "Daily limit exceeded");
        
        // 누적량 업데이트
        dailySwapped[user] += ctaAmount;
    }

    /**
     * @dev 사용자별 일일 한도 조회
     * @param user 사용자 주소
     * @return 일일 한도
     */
    function _getUserDailyLimit(address user) internal view returns (uint256) {
        uint256 limit = dailyLimits[user];
        
        // 개별 설정이 없으면 기본값 반환
        return limit > 0 ? limit : defaultDailyLimit;
    }

    /**
     * @dev 교환 비율 설정
     * @param _ctaToNestRate 새 CTA->NEST 교환 비율
     * @param _nestToCtaRate 새 NEST->CTA 교환 비율
     */
    function setRates(uint256 _ctaToNestRate, uint256 _nestToCtaRate) external onlyRole(RATE_SETTER_ROLE) {
        require(_ctaToNestRate > 0, "CTA to NEST rate must be positive");
        require(_nestToCtaRate > 0, "NEST to CTA rate must be positive");
        
        ctaToNestRate = _ctaToNestRate;
        nestToCtaRate = _nestToCtaRate;
        
        emit RateUpdated(_ctaToNestRate, _nestToCtaRate);
    }

    /**
     * @dev 화이트리스트 모드 토글
     * @param _enabled 활성화 여부
     */
    function setWhitelistMode(bool _enabled) external onlyRole(WHITELIST_MANAGER_ROLE) {
        whitelistMode = _enabled;
        
        emit WhitelistModeUpdated(_enabled);
    }

    /**
     * @dev 주소를 화이트리스트에 추가
     * @param _account 추가할 주소
     */
    function addToWhitelist(address _account) external onlyRole(WHITELIST_MANAGER_ROLE) {
        whitelist[_account] = true;
        
        emit AddedToWhitelist(_account);
    }

    /**
     * @dev 주소를 화이트리스트에서 제거
     * @param _account 제거할 주소
     */
    function removeFromWhitelist(address _account) external onlyRole(WHITELIST_MANAGER_ROLE) {
        whitelist[_account] = false;
        
        emit RemovedFromWhitelist(_account);
    }

    /**
     * @dev 여러 주소를 화이트리스트에 추가
     * @param _accounts 추가할 주소 배열
     */
    function addMultipleToWhitelist(address[] calldata _accounts) external onlyRole(WHITELIST_MANAGER_ROLE) {
        for (uint256 i = 0; i < _accounts.length; i++) {
            whitelist[_accounts[i]] = true;
            emit AddedToWhitelist(_accounts[i]);
        }
    }

    /**
     * @dev 사용자별 일일 한도 설정
     * @param _account 대상 주소
     * @param _limit 일일 한도
     */
    function setDailyLimit(address _account, uint256 _limit) external onlyRole(WHITELIST_MANAGER_ROLE) {
        dailyLimits[_account] = _limit;
        
        emit DailyLimitUpdated(_account, _limit);
    }

    /**
     * @dev 기본 일일 한도 설정
     * @param _limit 일일 한도
     */
    function setDefaultDailyLimit(uint256 _limit) external onlyRole(WHITELIST_MANAGER_ROLE) {
        defaultDailyLimit = _limit;
        
        emit DefaultDailyLimitUpdated(_limit);
    }

    /**
     * @dev 컨트랙트에서 토큰 인출
     * @param _token 인출할 토큰 주소
     * @param _to 수신자 주소
     * @param _amount 인출 양
     */
    function withdrawTokens(address _token, address _to, uint256 _amount) external onlyRole(WITHDRAWAL_ROLE) {
        require(_to != address(0), "Cannot withdraw to zero address");
        
        IERC20 token = IERC20(_token);
        require(token.transfer(_to, _amount), "Token transfer failed");
        
        emit TokensWithdrawn(_token, _to, _amount);
    }

    /**
     * @dev 사용자의 일일 한도 및 사용량 조회
     * @param _account 조회할 주소
     * @return limit 일일 한도
     * @return used 일일 사용량
     * @return remaining 남은 한도
     */
    function getDailyLimitInfo(address _account) external view returns (uint256 limit, uint256 used, uint256 remaining) {
        uint256 today = block.timestamp / 1 days;
        limit = _getUserDailyLimit(_account);
        
        if (lastSwapDay[_account] < today) {
            used = 0;
        } else {
            used = dailySwapped[_account];
        }
        
        remaining = used >= limit ? 0 : limit - used;
        
        return (limit, used, remaining);
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
