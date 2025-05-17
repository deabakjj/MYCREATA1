require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

// 환경 변수에서 개인키를 가져옴 (배포용)
const privateKey = process.env.ADMIN_WALLET_PRIVATE_KEY || '';

module.exports = {
  networks: {
    // 개발용 로컬 네트워크 설정
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*", // 모든 네트워크 ID와 매칭
    },
    
    // CreataChain Testnet 설정
    testnet: {
      provider: () => new HDWalletProvider(
        privateKey,
        process.env.CREATA_TESTNET_RPC || 'https://consensus.testnet.cvm.creatachain.com'
      ),
      network_id: process.env.TESTNET_CHAIN_ID || 9000,
      gas: 5500000,
      gasPrice: 20000000000, // 20 Gwei
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    
    // CreataChain Mainnet 설정
    mainnet: {
      provider: () => new HDWalletProvider(
        privateKey,
        process.env.CREATA_MAINNET_RPC || 'https://cvm.node.creatachain.com'
      ),
      network_id: process.env.MAINNET_CHAIN_ID || 1000,
      gas: 5500000,
      gasPrice: 20000000000, // 20 Gwei
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: false // 메인넷에서는 dryRun을 수행함
    },
  },

  // 컴파일러 설정
  compilers: {
    solc: {
      version: "0.8.19",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
        evmVersion: "london"
      }
    }
  },

  // 배포 디렉토리 설정
  contracts_directory: './contracts/',
  contracts_build_directory: './build/contracts/',
  migrations_directory: './migrations/',

  // Mocha 테스팅 옵션
  mocha: {
    timeout: 100000
  },

  // 플러그인 설정
  plugins: [
    'truffle-plugin-verify'
  ],

  // 계약 검증용 API 키 설정 (optional)
  api_keys: {
    etherscan: process.env.ETHERSCAN_API_KEY
  }
};
