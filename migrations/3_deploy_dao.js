const NestDAO = artifacts.require("dao/NestDAO");
const NestToken = artifacts.require("NestToken");
const NestNFT = artifacts.require("NestNFT");

module.exports = async function(deployer, network, accounts) {
  // 관리자 계정 (첫 번째 계정)
  const admin = accounts[0];
  
  console.log(`Deploying DAO contracts to ${network} with admin account: ${admin}`);

  // 이미 배포된 NEST 토큰과 NFT 컨트랙트 참조
  const nestToken = await NestToken.deployed();
  const nestNFT = await NestNFT.deployed();
  
  console.log('Deploying NestDAO...');
  
  // DAO 최소 토큰 보유량 설정 (투표 참여를 위한 최소 요구 토큰 수)
  const minTokensToVote = web3.utils.toWei('100', 'ether'); // 100 NEST
  
  // 투표 기간 (초 단위)
  const votingPeriod = 60 * 60 * 24 * 7; // 7일
  
  // DAO 컨트랙트 배포
  await deployer.deploy(
    NestDAO, 
    admin, 
    nestToken.address, 
    nestNFT.address, 
    minTokensToVote, 
    votingPeriod
  );
  
  const nestDAO = await NestDAO.deployed();
  console.log(`NestDAO deployed at: ${nestDAO.address}`);
  
  // 개발 환경에서 추가 설정
  if (network === 'development') {
    console.log('Setting up DAO for development...');
    
    // DAO NFT 유형 생성 (투표권 NFT)
    await nestNFT.createNFTType(
      'DAO Voting NFT',
      'Represents voting power in the DAO',
      false, // 전송 불가
      { from: admin }
    );
    
    // NFT 타입 ID 가져오기 (일반적으로 4번째 타입, 인덱스는 3)
    const daoNftTypeId = 3;
    
    // DAO 컨트랙트에 투표권 NFT 타입 설정
    await nestDAO.setVotingNFTTypeId(daoNftTypeId, { from: admin });
    
    console.log(`Configured DAO with voting NFT type ID: ${daoNftTypeId}`);
  }
  
  console.log('DAO contracts deployed successfully');
  console.log({
    NestDAO: nestDAO.address
  });
};
