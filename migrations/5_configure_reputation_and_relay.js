const NestToken = artifacts.require("NestToken");
const NestNFT = artifacts.require("NestNFT");
const NestNameRegistry = artifacts.require("NestNameRegistry");
const NestDAO = artifacts.require("dao/NestDAO");

module.exports = async function(deployer, network, accounts) {
  // 관리자 계정 (첫 번째 계정)
  const admin = accounts[0];
  
  console.log(`Setting up reputation graph and relay configuration on ${network} with admin account: ${admin}`);

  // 이미 배포된 컨트랙트 참조
  const nestToken = await NestToken.deployed();
  const nestNFT = await NestNFT.deployed();
  const nestNameRegistry = await NestNameRegistry.deployed();
  const nestDAO = await NestDAO.deployed();
  
  // 개발 환경 혹은 테스트넷에서만 실행
  if (network === 'development' || network === 'testnet') {
    console.log('Configuring reputation graph and relay components...');
    
    // 1. 평판 관련 NFT 유형 추가
    console.log('Creating reputation-related NFT types...');
    
    // 평판 뱃지 NFT
    await nestNFT.createNFTType(
      'Reputation Badge NFT',
      'Represents achievements in the reputation graph',
      false, // 전송 불가
      { from: admin }
    );
    
    // 2. Relay 권한 설정
    console.log('Configuring relay permissions...');
    
    // 관리자에게 relay 권한 부여 (NestNameRegistry에 이 기능이 있다고 가정)
    if (typeof nestNameRegistry.addRelayAuthority === 'function') {
      await nestNameRegistry.addRelayAuthority(admin, { from: admin });
      console.log(`Added admin as relay authority`);
      
      // 테스트 계정에도 relay 권한 부여 (테스트 계정이 있다면)
      if (accounts.length > 1) {
        await nestNameRegistry.addRelayAuthority(accounts[1], { from: admin });
        console.log(`Added account ${accounts[1]} as relay authority`);
      }
    }
    
    // 3. 평판 점수 초기화 (DAO에서 관리한다고 가정)
    console.log('Initializing reputation scores...');
    
    if (typeof nestDAO.initializeReputationSettings === 'function') {
      const baseScore = 100;
      const actionValues = {
        comment: 5,
        mission: 10,
        attendance: 2,
        groupMission: 15,
        userMission: 20
      };
      
      // JSON으로 설정값 전달 (실제 컨트랙트 함수에 맞게 구현 필요)
      await nestDAO.initializeReputationSettings(
        baseScore,
        JSON.stringify(actionValues),
        { from: admin }
      );
      
      console.log('Initialized reputation scoring system');
    }
  }
  
  console.log('Reputation graph and relay configuration completed successfully');
};
