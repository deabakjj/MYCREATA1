// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Migrations
 * @dev 이 컨트랙트는 마이그레이션 상태를 관리합니다.
 * 이것은 Truffle이 마이그레이션을 관리하는 데 사용됩니다.
 */
contract Migrations {
    address public owner;
    uint public last_completed_migration;

    // 소유자만 함수를 실행할 수 있도록 제한하는 modifier
    modifier restricted() {
        require(msg.sender == owner, "This function is restricted to the contract's owner");
        _;
    }

    // 생성자에서 컨트랙트 배포자를 소유자로 설정
    constructor() {
        owner = msg.sender;
    }

    // 완료된 마이그레이션 번호를 설정하는 함수
    function setCompleted(uint completed) public restricted {
        last_completed_migration = completed;
    }

    // 새로운 인스턴스로 마이그레이션하는 함수
    function upgrade(address new_address) public restricted {
        Migrations upgraded = Migrations(new_address);
        upgraded.setCompleted(last_completed_migration);
    }
}
