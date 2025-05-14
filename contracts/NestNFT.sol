// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title NestNFT
 * @notice Nest 플랫폼의 CIP721 호환 NFT 컨트랙트입니다.
 * @dev 이 컨트랙트는 다양한 유형의 NFT를 발행하며, 다음 기능을 포함합니다:
 * - 출석 체크, 댓글 작성, 랭킹 진입 등 행동 기반 NFT 발행
 * - NFT 유형별 메타데이터 관리
 * - NFT 전송 제한 기능
 */
contract NestNFT is ERC721, ERC721Enumerable, ERC721URIStorage, Pausable, AccessControl {
    using Counters for Counters.Counter;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant NFT_MANAGER_ROLE = keccak256("NFT_MANAGER_ROLE");

    // 토큰 ID 카운터
    Counters.Counter private _tokenIdCounter;

    // NFT 유형 구조체
    struct NFTType {
        string name;        // NFT 유형 이름
        string description; // NFT 유형 설명
        bool transferable;  // 전송 가능 여부
        bool exists;        // 유형 존재 여부
    }

    // NFT 유형 ID => NFT 유형 정보
    mapping(uint256 => NFTType) public nftTypes;
    
    // 토큰 ID => NFT 유형 ID
    mapping(uint256 => uint256) public tokenTypes;
    
    // NFT 유형 카운터
    Counters.Counter private _nftTypeCounter;

    // 발행 이벤트
    event NFTMinted(address indexed to, uint256 indexed tokenId, uint256 indexed nftTypeId);
    
    // NFT 유형 생성 이벤트
    event NFTTypeCreated(uint256 indexed typeId, string name, string description, bool transferable);

    /**
     * @dev 컨트랙트 생성자
     * @param admin 관리자 주소 (모든 권한 부여)
     */
    constructor(address admin) ERC721("Nest NFT", "NESTNFT") {
        _setupRoles(admin);
    }

    /**
     * @dev 관리자 역할 설정
     * @param admin 관리자 주소
     */
    function _setupRoles(address admin) private {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(NFT_MANAGER_ROLE, admin);
    }

    /**
     * @dev NFT 유형 생성
     * @param name 유형 이름
     * @param description 유형 설명
     * @param transferable 전송 가능 여부
     * @return 생성된 NFT 유형 ID
     */
    function createNFTType(
        string memory name,
        string memory description,
        bool transferable
    ) public onlyRole(NFT_MANAGER_ROLE) returns (uint256) {
        _nftTypeCounter.increment();
        uint256 typeId = _nftTypeCounter.current();
        
        nftTypes[typeId] = NFTType({
            name: name,
            description: description,
            transferable: transferable,
            exists: true
        });
        
        emit NFTTypeCreated(typeId, name, description, transferable);
        
        return typeId;
    }

    /**
     * @dev NFT 유형 정보 업데이트
     * @param typeId 유형 ID
     * @param name 새 이름
     * @param description 새 설명
     * @param transferable 새 전송 가능 여부
     */
    function updateNFTType(
        uint256 typeId,
        string memory name,
        string memory description,
        bool transferable
    ) public onlyRole(NFT_MANAGER_ROLE) {
        require(nftTypes[typeId].exists, "NFT type does not exist");
        
        nftTypes[typeId].name = name;
        nftTypes[typeId].description = description;
        nftTypes[typeId].transferable = transferable;
    }

    /**
     * @dev NFT 발행
     * @param to 수신자 주소
     * @param typeId NFT 유형 ID
     * @param uri 토큰 메타데이터 URI
     * @return 발행된 토큰 ID
     */
    function safeMint(
        address to,
        uint256 typeId,
        string memory uri
    ) public onlyRole(MINTER_ROLE) returns (uint256) {
        require(nftTypes[typeId].exists, "NFT type does not exist");
        
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        
        tokenTypes[tokenId] = typeId;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        emit NFTMinted(to, tokenId, typeId);
        
        return tokenId;
    }

    /**
     * @dev 여러 NFT 한 번에 발행
     * @param recipients 수신자 주소 배열
     * @param typeId NFT 유형 ID
     * @param uri 토큰 메타데이터 URI
     * @return 발행된 토큰 ID 배열
     */
    function batchMint(
        address[] calldata recipients,
        uint256 typeId,
        string memory uri
    ) public onlyRole(MINTER_ROLE) returns (uint256[] memory) {
        require(nftTypes[typeId].exists, "NFT type does not exist");
        
        uint256[] memory tokenIds = new uint256[](recipients.length);
        
        for (uint256 i = 0; i < recipients.length; i++) {
            _tokenIdCounter.increment();
            uint256 tokenId = _tokenIdCounter.current();
            
            tokenTypes[tokenId] = typeId;
            
            _safeMint(recipients[i], tokenId);
            _setTokenURI(tokenId, uri);
            
            tokenIds[i] = tokenId;
            emit NFTMinted(recipients[i], tokenId, typeId);
        }
        
        return tokenIds;
    }

    /**
     * @dev 토큰 전송 전 제한 확인
     * @param from 발신자 주소
     * @param to 수신자 주소
     * @param tokenId 토큰 ID
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) whenNotPaused {
        // 0 주소에서 전송(발행) 또는 0 주소로 전송(소각)은 항상 허용
        if (from != address(0) && to != address(0)) {
            // 전송 가능 여부 확인
            uint256 typeId = tokenTypes[tokenId];
            require(nftTypes[typeId].transferable, "This NFT is not transferable");
        }
        
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
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

    // 오버라이드 필요한 함수들

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
