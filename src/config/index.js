/**
 * @file 서버 환경 설정 및 구성 변수 관리
 * @description 환경 변수에서 설정을 로드하고 기본값을 제공합니다.
 */

require('dotenv').config();

// 환경 변수를 가져오거나 기본값을 사용
const config = {
  // 서버 설정
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  isDev: process.env.NODE_ENV !== 'production',
  
  // 데이터베이스 설정
  db: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/nest-platform',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  
  // JWT 설정
  jwt: {
    secret: process.env.JWT_SECRET || 'nest-platform-secret-key',
    expiresIn: process.env.JWT_EXPIRATION || '7d',
  },
  
  // 블록체인 설정
  blockchain: {
    mainnet: {
      rpc: process.env.CREATA_MAINNET_RPC || 'https://cvm.node.creatachain.com',
      chainId: parseInt(process.env.MAINNET_CHAIN_ID, 10) || 1000,
      contracts: {
        nestToken: process.env.NEST_TOKEN_ADDRESS,
        nestNFT: process.env.NEST_NFT_ADDRESS,
        nestNameRegistry: process.env.NEST_NAME_REGISTRY_ADDRESS,
        nestSwap: process.env.NEST_SWAP_ADDRESS,
      },
    },
    testnet: {
      rpc: process.env.CREATA_TESTNET_RPC || 'https://consensus.testnet.cvm.creatachain.com',
      chainId: parseInt(process.env.TESTNET_CHAIN_ID, 10) || 9000,
      contracts: {
        nestToken: process.env.TESTNET_NEST_TOKEN_ADDRESS,
        nestNFT: process.env.TESTNET_NEST_NFT_ADDRESS,
        nestNameRegistry: process.env.TESTNET_NEST_NAME_REGISTRY_ADDRESS,
        nestSwap: process.env.TESTNET_NEST_SWAP_ADDRESS,
      },
    },
  },
  
  // 지갑 설정
  wallet: {
    adminPrivateKey: process.env.ADMIN_WALLET_PRIVATE_KEY,
    gasPriceMultiplier: parseFloat(process.env.GAS_PRICE_MULTIPLIER) || 1.2,
  },
  
  // 소셜 로그인 설정
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    kakao: {
      clientId: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
    },
  },
  
  // Magic.link 또는 Web3Auth 설정
  web3Auth: {
    type: process.env.WEB3_AUTH_TYPE || 'magic', // 'magic' 또는 'web3auth'
    magic: {
      publishableKey: process.env.MAGIC_PUBLISHABLE_KEY,
      secretKey: process.env.MAGIC_SECRET_KEY,
    },
    web3auth: {
      clientId: process.env.WEB3AUTH_CLIENT_ID,
      clientSecret: process.env.WEB3AUTH_CLIENT_SECRET,
    },
  },
  
  // Biconomy 설정 (가스비 처리)
  biconomy: {
    apiKey: process.env.BICONOMY_API_KEY,
    apiId: process.env.BICONOMY_API_ID,
  },
  
  // 로깅 설정
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  
  // CORS 설정
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001').split(','),
    credentials: true,
  },
  
  // 요청 제한 설정
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000, // 기본 1분
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // 기본 분당 최대 100회
  },
  
  // 파일 업로드 설정
  upload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5000000, // 기본 5MB
  },
};

const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'NEST_TOKEN_ADDRESS',
  'NEST_NFT_ADDRESS',
  'ADMIN_WALLET_PRIVATE_KEY',
  'RECAPTCHA_SITE_KEY',
  'RECAPTCHA_SECRET_KEY',
  'PUSH_VAPID_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN'
];

// 환경 변수 검증
const validateEnvVars = () => {
  const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingVars.length > 0) {
    const error = new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    console.error(error.message);
    process.exit(1);
  }
  
  // 프로덕션 환경에서의 추가 검증
  if (process.env.NODE_ENV === 'production') {
    const productionRequiredVars = [
      'LOG_LEVEL',
      'SENTRY_DSN',
      'REDIS_URL',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'AWS_REGION',
      'AWS_S3_BUCKET'
    ];
    
    const missingProdVars = productionRequiredVars.filter(envVar => !process.env[envVar]);
    
    if (missingProdVars.length > 0) {
      const error = new Error(`Missing required production environment variables: ${missingProdVars.join(', ')}`);
      console.error(error.message);
      process.exit(1);
    }
  }
};

// 환경 변수 검증 실행
validateEnvVars();

module.exports = config;
