const NestToken = artifacts.require("NestToken");
const NestNFT = artifacts.require("NestNFT");
const NestNameRegistry = artifacts.require("NestNameRegistry");
const NestDAO = artifacts.require("dao/NestDAO");

module.exports = async function(deployer, network, accounts) {
  // 관리자 계정 (첫 번째 계정)
  const admin = accounts[0];
  
  console.log(`Setting up mission and DApp integration configurations on ${network} with admin account: ${admin}`);

  // 이미 배포된 컨트랙트 참조
  const nestToken = await NestToken.deployed();
  const nestNFT = await NestNFT.deployed();
  const nestNameRegistry = await NestNameRegistry.deployed();
  const nestDAO = await NestDAO.deployed();
  
  // 개발 환경 혹은 테스트넷에서만 실행
  if (network === 'development' || network === 'testnet') {
    console.log('Configuring test missions and DApp integration...');
    
    // 1. 미션 관련 NFT 유형 추가
    console.log('Creating mission-related NFT types...');
    
    // AI 관련 NFT
    await nestNFT.createNFTType(
      'AI Mission NFT',
      'Awarded for completing AI-related missions',
      true, // 전송 가능
      { from: admin }
    );
    
    // 그룹 미션 NFT
    await nestNFT.createNFTType(
      'Group Mission NFT',
      'Awarded for completing group missions',
      true, // 전송 가능
      { from: admin }
    );
    
    // 사용자 생성 미션 NFT
    await nestNFT.createNFTType(
      'User Created Mission NFT',
      'Awarded for completing user-created missions',
      true, // 전송 가능
      { from: admin }
    );
    
    // 2. 테스트 .nest 도메인 등록
    console.log('Registering test .nest domains...');
    
    // 관리자 계정에 테스트 도메인 등록
    await nestNameRegistry.registerName(
      'admin',  // 이름
      admin,    // 주소
      { from: admin }
    );
    
    // 테스트 계정에 도메인 등록 (테스트 계정이 있다면)
    if (accounts.length > 1) {
      await nestNameRegistry.registerName(
        'test',       // 이름
        accounts[1],  // 주소
        { from: admin }
      );
      
      await nestNameRegistry.registerName(
        'partner',    // 이름
        accounts[2],  // 주소
        { from: admin }
      );
    }
    
    // 3. DApp 통합 테스트를 위한 허용 목록 설정
    console.log('Setting up DApp integration whitelist...');
    
    // Admin은 기본적으로 NFT 민팅 권한이 있음
    
    // 테스트 계정에 NFT 민팅 권한 부여 (테스트 계정이 있다면)
    if (accounts.length > 1) {
      await nestNFT.addMinter(accounts[1], { from: admin });
      console.log(`Added account ${accounts[1]} as NFT minter`);
      
      // 토큰 전송 권한 설정 (화이트리스트에 추가)
      // 참고: 이 기능은 NestToken 컨트랙트에 구현되어 있어야 함
      if (typeof nestToken.addToWhitelist === 'function') {
        await nestToken.addToWhitelist(accounts[1], { from: admin });
        console.log(`Added account ${accounts[1]} to token whitelist`);
      }
    }
    
    // 4. 사용자 생성 미션 및 그룹 미션을 위한 DAO 설정
    console.log('Configuring DAO for user missions...');
    
    // 사용자 생성 미션 제안 최소 토큰량 설정
    if (typeof nestDAO.setMinTokensForProposal === 'function') {
      const minTokensForProposal = web3.utils.toWei('50', 'ether'); // 50 NEST
      await nestDAO.setMinTokensForProposal(minTokensForProposal, { from: admin });
      console.log(`Set minimum tokens for mission proposal to ${minTokensForProposal}`);
    }
  }
  
  console.log('Mission and DApp integration configuration completed successfully');
};
