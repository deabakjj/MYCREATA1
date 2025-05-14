// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title NestNameRegistry
 * @notice .nest 도메인 이름 레지스트리 시스템
 * @dev 이 컨트랙트는 사용자 친화적 ID(example.nest)를 지갑 주소에 매핑합니다.
 * ENS(Ethereum Name Service)와 유사하게 작동하지만 Nest 플랫폼에 최적화되어 있습니다.
 */
contract NestNameRegistry is AccessControl, Pausable {
    using Strings for string;

    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // 등록 최소 길이
    uint8 public constant MIN_NAME_LENGTH = 3;
    
    // 등록 최대 길이
    uint8 public constant MAX_NAME_LENGTH = 32;
    
    // 네임스페이스 (항상 .nest)
    string public constant NAMESPACE = ".nest";

    // 이름 => 주소 매핑
    mapping(string => address) private _nameToAddress;
    
    // 주소 => 이름 매핑
    mapping(address => string) private _addressToName;
    
    // 이름 => 만료 시간 매핑
    mapping(string => uint256) private _expirations;
    
    // 이름 가용성 (true = 예약됨 또는 금지됨)
    mapping(string => bool) private _restricted;
    
    // 주소별 등록 가능한 최대 이름 수
    mapping(address => uint256) private _addressNameLimit;
    
    // 주소별 등록한 이름 수
    mapping(address => uint256) private _addressNameCount;
    
    // 기본 등록 기간 (1년)
    uint256 public defaultRegistrationPeriod = 365 days;
    
    // 기본 주소별 최대 등록 수
    uint256 public defaultAddressNameLimit = 5;

    // 이벤트
    event NameRegistered(string indexed name, address indexed owner, uint256 expiresAt);
    event NameRenewed(string indexed name, uint256 expiresAt);
    event NameTransferred(string indexed name, address indexed oldOwner, address indexed newOwner);
    event NameReleased(string indexed name, address indexed owner);
    event NameRestricted(string indexed name, bool restricted);

    /**
     * @dev 컨트랙트 생성자
     * @param admin 관리자 주소 (모든 권한 부여)
     */
    constructor(address admin) {
        _setupRoles(admin);
    }

    /**
     * @dev 관리자 역할 설정
     * @param admin 관리자 주소
     */
    function _setupRoles(address admin) private {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MANAGER_ROLE, admin);
        _grantRole(REGISTRAR_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    /**
     * @dev 이름 등록
     * @param name 등록할 이름 (예: "example", ".nest"는 자동으로 붙음)
     * @param owner 소유자 주소
     * @return 성공 여부
     */
    function register(string calldata name, address owner) external whenNotPaused onlyRole(REGISTRAR_ROLE) returns (bool) {
        string memory lowerName = _toLower(name);
        
        // 유효성 검사
        require(_isValidName(lowerName), "Invalid name");
        require(!_isNameRegistered(lowerName), "Name already registered");
        require(!_restricted[lowerName], "Name is restricted");
        
        // 주소별 등록 제한 확인
        require(
            _addressNameCount[owner] < _getAddressNameLimit(owner),
            "Address has reached name limit"
        );
        
        // 등록
        _nameToAddress[lowerName] = owner;
        
        // 이전 이름이 있으면 초기화
        string memory oldName = _addressToName[owner];
        if (bytes(oldName).length > 0) {
            _nameToAddress[oldName] = address(0);
        }
        
        // 새 이름 설정
        _addressToName[owner] = lowerName;
        
        // 만료 시간 설정
        uint256 expiresAt = block.timestamp + defaultRegistrationPeriod;
        _expirations[lowerName] = expiresAt;
        
        // 등록 수 증가
        _addressNameCount[owner]++;
        
        emit NameRegistered(lowerName, owner, expiresAt);
        
        return true;
    }

    /**
     * @dev 사용자가 직접 이름 등록 (금액 지불 필요 - 실제 구현에서는 추가 로직 필요)
     * @param name 등록할 이름 (예: "example", ".nest"는 자동으로 붙음)
     * @return 성공 여부
     */
    function registerSelf(string calldata name) external whenNotPaused returns (bool) {
        string memory lowerName = _toLower(name);
        
        // 유효성 검사
        require(_isValidName(lowerName), "Invalid name");
        require(!_isNameRegistered(lowerName), "Name already registered");
        require(!_restricted[lowerName], "Name is restricted");
        
        // 주소별 등록 제한 확인
        require(
            _addressNameCount[msg.sender] < _getAddressNameLimit(msg.sender),
            "Address has reached name limit"
        );
        
        // 여기에 결제 로직이 들어갈 수 있음
        // require(paymentToken.transferFrom(msg.sender, address(this), price), "Payment failed");
        
        // 등록
        _nameToAddress[lowerName] = msg.sender;
        
        // 이전 이름이 있으면 초기화
        string memory oldName = _addressToName[msg.sender];
        if (bytes(oldName).length > 0) {
            _nameToAddress[oldName] = address(0);
        }
        
        // 새 이름 설정
        _addressToName[msg.sender] = lowerName;
        
        // 만료 시간 설정
        uint256 expiresAt = block.timestamp + defaultRegistrationPeriod;
        _expirations[lowerName] = expiresAt;
        
        // 등록 수 증가
        _addressNameCount[msg.sender]++;
        
        emit NameRegistered(lowerName, msg.sender, expiresAt);
        
        return true;
    }

    /**
     * @dev 이름 갱신
     * @param name 갱신할 이름
     * @return 성공 여부
     */
    function renewName(string calldata name) external whenNotPaused returns (bool) {
        string memory lowerName = _toLower(name);
        
        // 유효성 검사
        require(_isNameRegistered(lowerName), "Name not registered");
        require(_nameToAddress[lowerName] == msg.sender, "Not the owner");
        
        // 만료 시간 갱신
        uint256 expiresAt = block.timestamp + defaultRegistrationPeriod;
        _expirations[lowerName] = expiresAt;
        
        emit NameRenewed(lowerName, expiresAt);
        
        return true;
    }

    /**
     * @dev 이름 소유권 이전
     * @param name 이전할 이름
     * @param newOwner 새 소유자 주소
     * @return 성공 여부
     */
    function transferName(string calldata name, address newOwner) external whenNotPaused returns (bool) {
        string memory lowerName = _toLower(name);
        
        // 유효성 검사
        require(_isNameRegistered(lowerName), "Name not registered");
        require(_nameToAddress[lowerName] == msg.sender, "Not the owner");
        require(newOwner != address(0), "New owner is zero address");
        
        // 주소별 등록 제한 확인
        require(
            _addressNameCount[newOwner] < _getAddressNameLimit(newOwner),
            "New owner has reached name limit"
        );
        
        // 소유권 이전
        _nameToAddress[lowerName] = newOwner;
        
        // 이전 소유자 정보 업데이트
        _addressToName[msg.sender] = "";
        _addressNameCount[msg.sender]--;
        
        // 새 소유자 정보 업데이트
        string memory oldName = _addressToName[newOwner];
        if (bytes(oldName).length > 0) {
            _nameToAddress[oldName] = address(0);
        }
        
        _addressToName[newOwner] = lowerName;
        _addressNameCount[newOwner]++;
        
        emit NameTransferred(lowerName, msg.sender, newOwner);
        
        return true;
    }

    /**
     * @dev 이름 해제
     * @param name 해제할 이름
     * @return 성공 여부
     */
    function releaseName(string calldata name) external whenNotPaused returns (bool) {
        string memory lowerName = _toLower(name);
        
        // 유효성 검사
        require(_isNameRegistered(lowerName), "Name not registered");
        require(_nameToAddress[lowerName] == msg.sender, "Not the owner");
        
        // 이름 해제
        _nameToAddress[lowerName] = address(0);
        _addressToName[msg.sender] = "";
        _expirations[lowerName] = 0;
        
        // 등록 수 감소
        _addressNameCount[msg.sender]--;
        
        emit NameReleased(lowerName, msg.sender);
        
        return true;
    }

    /**
     * @dev 이름의 소유자 주소 조회
     * @param name 조회할 이름
     * @return 소유자 주소
     */
    function getAddress(string calldata name) external view returns (address) {
        string memory lowerName = _toLower(name);
        
        // 만료 확인
        if (_isExpired(lowerName)) {
            return address(0);
        }
        
        return _nameToAddress[lowerName];
    }

    /**
     * @dev 주소의 기본 이름 조회
     * @param addr 조회할 주소
     * @return 기본 이름
     */
    function getName(address addr) external view returns (string memory) {
        string memory name = _addressToName[addr];
        
        // 만료 확인
        if (_isExpired(name)) {
            return "";
        }
        
        return name;
    }

    /**
     * @dev 이름의 만료 시간 조회
     * @param name 조회할 이름
     * @return 만료 시간 (UNIX 타임스탬프)
     */
    function getExpiration(string calldata name) external view returns (uint256) {
        return _expirations[_toLower(name)];
    }

    /**
     * @dev 이름의 유효성을 설정합니다 (제한/해제)
     * @param name 대상 이름
     * @param isRestricted 제한 여부
     */
    function setNameRestriction(string calldata name, bool isRestricted) external onlyRole(MANAGER_ROLE) {
        string memory lowerName = _toLower(name);
        _restricted[lowerName] = isRestricted;
        
        emit NameRestricted(lowerName, isRestricted);
    }

    /**
     * @dev 주소별 최대 등록 수 설정
     * @param addr 대상 주소
     * @param limit 최대 등록 수
     */
    function setAddressNameLimit(address addr, uint256 limit) external onlyRole(MANAGER_ROLE) {
        _addressNameLimit[addr] = limit;
    }

    /**
     * @dev 기본 등록 기간 설정
     * @param period 등록 기간 (초 단위)
     */
    function setDefaultRegistrationPeriod(uint256 period) external onlyRole(MANAGER_ROLE) {
        defaultRegistrationPeriod = period;
    }

    /**
     * @dev 기본 주소별 최대 등록 수 설정
     * @param limit 최대 등록 수
     */
    function setDefaultAddressNameLimit(uint256 limit) external onlyRole(MANAGER_ROLE) {
        defaultAddressNameLimit = limit;
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

    /**
     * @dev 이름이 유효한지 확인
     * @param name 확인할 이름
     * @return 유효 여부
     */
    function _isValidName(string memory name) internal pure returns (bool) {
        bytes memory nameBytes = bytes(name);
        
        // 길이 확인
        if (nameBytes.length < MIN_NAME_LENGTH || nameBytes.length > MAX_NAME_LENGTH) {
            return false;
        }
        
        // 문자 확인 (영문 소문자, 숫자, 하이픈만 허용)
        for (uint i = 0; i < nameBytes.length; i++) {
            bytes1 char = nameBytes[i];
            
            bool isLowercaseLetter = (char >= 0x61 && char <= 0x7A); // a-z
            bool isDigit = (char >= 0x30 && char <= 0x39); // 0-9
            bool isHyphen = (char == 0x2D); // -
            
            if (!(isLowercaseLetter || isDigit || isHyphen)) {
                return false;
            }
        }
        
        // 첫 글자와 마지막 글자는 하이픈이 아니어야 함
        if (nameBytes[0] == 0x2D || nameBytes[nameBytes.length - 1] == 0x2D) {
            return false;
        }
        
        // 연속된 하이픈은 허용하지 않음
        for (uint i = 1; i < nameBytes.length; i++) {
            if (nameBytes[i] == 0x2D && nameBytes[i - 1] == 0x2D) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * @dev 이름이 등록되어 있는지 확인
     * @param name 확인할 이름
     * @return 등록 여부
     */
    function _isNameRegistered(string memory name) internal view returns (bool) {
        address owner = _nameToAddress[name];
        
        // 주소가 0이 아니고 만료되지 않았으면 등록된 것으로 간주
        return owner != address(0) && !_isExpired(name);
    }

    /**
     * @dev 이름이 만료되었는지 확인
     * @param name 확인할 이름
     * @return 만료 여부
     */
    function _isExpired(string memory name) internal view returns (bool) {
        uint256 expiresAt = _expirations[name];
        
        // 만료 시간이 0이거나 현재 시간보다 작으면 만료됨
        return expiresAt == 0 || expiresAt < block.timestamp;
    }

    /**
     * @dev 주소별 최대 등록 수 조회
     * @param addr 대상 주소
     * @return 최대 등록 수
     */
    function _getAddressNameLimit(address addr) internal view returns (uint256) {
        uint256 limit = _addressNameLimit[addr];
        
        // 개별 설정이 없으면 기본값 반환
        return limit > 0 ? limit : defaultAddressNameLimit;
    }

    /**
     * @dev 문자열을 소문자로 변환
     * @param str 변환할 문자열
     * @return 소문자로 변환된 문자열
     */
    function _toLower(string memory str) internal pure returns (string memory) {
        bytes memory bStr = bytes(str);
        bytes memory bLower = new bytes(bStr.length);
        
        for (uint i = 0; i < bStr.length; i++) {
            // 대문자인 경우 소문자로 변환
            if (bStr[i] >= 0x41 && bStr[i] <= 0x5A) {
                bLower[i] = bytes1(uint8(bStr[i]) + 32);
            } else {
                bLower[i] = bStr[i];
            }
        }
        
        return string(bLower);
    }

    /**
     * @dev 이름의 전체 도메인 반환 (이름 + .nest)
     * @param name 기본 이름
     * @return 전체 도메인
     */
    function getFullDomain(string calldata name) external pure returns (string memory) {
        return string(abi.encodePacked(_toLower(name), NAMESPACE));
    }
}
