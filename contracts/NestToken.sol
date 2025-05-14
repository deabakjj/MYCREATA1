// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title NestToken
 * @notice Nest 플랫폼의 CIP20 호환 토큰입니다.
 * @dev 이 토큰은 다음 기능을 포함합니다:
 * - 화이트리스트 주소만 전송 허용 기능 (on/off toggle)
 * - 블랙리스트 주소 제한 기능 (KYT+관리자 수동 제어)
 * - 특정 주소 전송/거래 제한 (ex: 거래소 등)
 */
contract NestToken is ERC20, ERC20Burnable, Pausable, AccessControl {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BLACKLISTER_ROLE = keccak256("BLACKLISTER_ROLE");
    bytes32 public constant WHITELISTER_ROLE = keccak256("WHITELISTER_ROLE");

    // 총 공급량: 100억 NEST
    uint256 public constant TOTAL_SUPPLY = 10000000000 * 10**18;

    // 화이트리스트 모드 활성화 여부
    bool public whitelistMode = false;
    
    // 주소별 화이트리스트 상태
    mapping(address => bool) public whitelist;
    
    // 주소별 블랙리스트 상태
    mapping(address => bool) public blacklist;
    
    // 전송 제한 주소 (예: 거래소)
    mapping(address => bool) public restrictedAddresses;

    /**
     * @dev 컨트랙트 생성자
     * @param admin 관리자 주소 (모든 권한 부여)
     */
    constructor(address admin) ERC20("Nest Token", "NEST") {
        _setupRoles(admin);
        _mint(admin, TOTAL_SUPPLY);
    }

    /**
     * @dev 관리자 역할 설정
     * @param admin 관리자 주소
     */
    function _setupRoles(address admin) private {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(BLACKLISTER_ROLE, admin);
        _grantRole(WHITELISTER_ROLE, admin);
    }

    /**
     * @dev 화이트리스트 모드 토글
     * @param _enabled 활성화 여부
     */
    function setWhitelistMode(bool _enabled) external onlyRole(WHITELISTER_ROLE) {
        whitelistMode = _enabled;
    }

    /**
     * @dev 주소를 화이트리스트에 추가
     * @param _account 추가할 주소
     */
    function addToWhitelist(address _account) external onlyRole(WHITELISTER_ROLE) {
        whitelist[_account] = true;
    }

    /**
     * @dev 주소를 화이트리스트에서 제거
     * @param _account 제거할 주소
     */
    function removeFromWhitelist(address _account) external onlyRole(WHITELISTER_ROLE) {
        whitelist[_account] = false;
    }

    /**
     * @dev 여러 주소를 화이트리스트에 추가
     * @param _accounts 추가할 주소 배열
     */
    function addMultipleToWhitelist(address[] calldata _accounts) external onlyRole(WHITELISTER_ROLE) {
        for (uint256 i = 0; i < _accounts.length; i++) {
            whitelist[_accounts[i]] = true;
        }
    }

    /**
     * @dev 주소를 블랙리스트에 추가
     * @param _account 추가할 주소
     */
    function addToBlacklist(address _account) external onlyRole(BLACKLISTER_ROLE) {
        blacklist[_account] = true;
    }

    /**
     * @dev 주소를 블랙리스트에서 제거
     * @param _account 제거할 주소
     */
    function removeFromBlacklist(address _account) external onlyRole(BLACKLISTER_ROLE) {
        blacklist[_account] = false;
    }

    /**
     * @dev 여러 주소를 블랙리스트에 추가
     * @param _accounts 추가할 주소 배열
     */
    function addMultipleToBlacklist(address[] calldata _accounts) external onlyRole(BLACKLISTER_ROLE) {
        for (uint256 i = 0; i < _accounts.length; i++) {
            blacklist[_accounts[i]] = true;
        }
    }

    /**
     * @dev 제한된 주소 설정 (예: 거래소)
     * @param _account 제한할 주소
     * @param _restricted 제한 여부
     */
    function setAddressRestriction(address _account, bool _restricted) external onlyRole(DEFAULT_ADMIN_ROLE) {
        restrictedAddresses[_account] = _restricted;
    }

    /**
     * @dev 토큰 전송 전 검증
     * @param from 발신자 주소
     * @param to 수신자 주소
     * @param amount 전송량
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        // 화이트리스트 모드가 활성화된 경우, 발신자와 수신자가 화이트리스트에 있어야 함
        if (whitelistMode) {
            require(whitelist[from] || from == address(0), "Sender not whitelisted");
            require(whitelist[to] || to == address(0), "Recipient not whitelisted");
        }
        
        // 블랙리스트 검사
        require(!blacklist[from], "Sender is blacklisted");
        require(!blacklist[to], "Recipient is blacklisted");
        
        // 제한된 주소 검사
        require(!restrictedAddresses[from], "Sender is restricted");
        require(!restrictedAddresses[to], "Recipient is restricted");
        
        super._beforeTokenTransfer(from, to, amount);
    }

    /**
     * @dev 컨트랙트 일시 중지
     */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev 컨트랙트 일시 중지 해제
     */
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev 새 토큰 발행
     * @param to 수신자 주소
     * @param amount 발행량
     */
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
}
