const NestToken = artifacts.require("NestToken");
const NestNFT = artifacts.require("NestNFT");
const NestNameRegistry = artifacts.require("NestNameRegistry");
const NestSwap = artifacts.require("NestSwap");

module.exports = async function(deployer, network, accounts) {
  // 관리자 계정 (첫 번째 계정)
  const admin = accounts[0];
  
  // 배포 네트워크에 따라 설정 조정
  let ctaTokenAddress;
  
  if (network === 'mainnet') {
    // 메인넷의 CTA 토큰 주소 (실제 주소로 대체해야 함)
    ctaTokenAddress = process.env.CTA_MAINNET_ADDRESS || '0x1234567890123456789012345678901234567890';
  } else if (network === 'testnet') {
    // 테스트넷의 CTA 토큰 주소 (실제 주소로 대체해야 함)
    ctaTokenAddress = process.env.CTA_TESTNET_ADDRESS || '0x1234567890123456789012345678901234567890';
  } else {
    // 개발 환경이나 기타 네트워크에서는 가상의 토큰 주소 사용
    ctaTokenAddress = '0x0000000000000000000000000000000000000000';
    console.log('Warning: Using a dummy CTA token address for development');
  }

  console.log(`Deploying to ${network} with admin account: ${admin}`);

  // 1. NEST 토큰 배포
  console.log('Deploying NestToken...');
  await deployer.deploy(NestToken, admin);
  const nestToken = await NestToken.deployed();
  console.log(`NestToken deployed at: ${nestToken.address}`);

  // 2. NEST NFT 배포
  console.log('Deploying NestNFT...');
  await deployer.deploy(NestNFT, admin);
  const nestNFT = await NestNFT.deployed();
  console.log(`NestNFT deployed at: ${nestNFT.address}`);

  // 3. 이름 레지스트리 배포
  console.log('Deploying NestNameRegistry...');
  await deployer.deploy(NestNameRegistry, admin);
  const nestNameRegistry = await NestNameRegistry.deployed();
  console.log(`NestNameRegistry deployed at: ${nestNameRegistry.address}`);

  // 4. 스왑 컨트랙트 배포
  console.log('Deploying NestSwap...');
  
  // 교환 비율 설정 (1 CTA = 1000 NEST, 1 NEST = 0.001 CTA)
  const ctaToNestRate = 1000;
  const nestToCtaRate = web3.utils.toWei('0.001', 'ether'); // 18 자리 소수점으로 변환
  const defaultDailyLimit = web3.utils.toWei('1000', 'ether'); // 하루 최대 1000 CTA
  
  await deployer.deploy(
    NestSwap, 
    admin, 
    ctaTokenAddress, 
    nestToken.address, 
    ctaToNestRate, 
    nestToCtaRate, 
    defaultDailyLimit
  );
  const nestSwap = await NestSwap.deployed();
  console.log(`NestSwap deployed at: ${nestSwap.address}`);

  // 5. 스왑 컨트랙트에 NEST 토큰 초기 공급
  if (network !== 'mainnet') {
    console.log('Transferring initial NEST tokens to NestSwap...');
    const initialSupply = web3.utils.toWei('1000000', 'ether'); // 초기 100만 NEST
    await nestToken.transfer(nestSwap.address, initialSupply, { from: admin });
    console.log(`Transferred ${initialSupply} NEST to NestSwap`);
  }

  // 6. NFT 유형 생성 (개발 환경에서만)
  if (network === 'development') {
    console.log('Creating initial NFT types...');
    
    // 출석 체크 NFT
    await nestNFT.createNFTType(
      'Attendance NFT',
      'Awarded for daily attendance',
      true, // 전송 가능
      { from: admin }
    );
    
    // 댓글 작성 NFT
    await nestNFT.createNFTType(
      'Comment NFT',
      'Awarded for writing comments',
      true, // 전송 가능
      { from: admin }
    );
    
    // 레벨업 NFT (전송 불가)
    await nestNFT.createNFTType(
      'Level Up NFT',
      'Awarded upon reaching a new level',
      false, // 전송 불가
      { from: admin }
    );
    
    console.log('Created initial NFT types');
  }

  console.log('All contracts deployed successfully');
  console.log({
    NestToken: nestToken.address,
    NestNFT: nestNFT.address,
    NestNameRegistry: nestNameRegistry.address,
    NestSwap: nestSwap.address
  });
};
