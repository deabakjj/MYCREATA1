/**
 * @file 서버 설정
 * @description 환경 변수 및 애플리케이션 설정 관리
 */

require('dotenv').config();

const config = {
  // 환경 설정
  env: process.env.NODE_ENV || 'development',
  
  // 서버 설정
  port: parseInt(process.env.PORT, 10) || 3000,
  
  // 데이터베이스 설정
  mongodb: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/nest',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },
  
  // JWT 설정
  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret_do_not_use_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  // CORS 설정
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  },
  
  // 속도 제한 설정
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000, // 1분
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100 // 1분당 최대 요청 수
  },
  
  // 블록체인 설정
  blockchain: {
    creataMainnetRpc: process.env.CREATA_RPC_MAINNET || 'https://cvm.node.creatachain.com',
    creataTestnetRpc: process.env.CREATA_RPC_TESTNET || 'https://consensus.testnet.cvm.creatachain.com',
    contracts: {
      nestToken: process.env.NEST_TOKEN_ADDRESS,
      nestNft: process.env.NEST_NFT_ADDRESS,
      nestNameRegistry: process.env.NEST_NAME_REGISTRY_ADDRESS,
      nestSwap: process.env.NEST_SWAP_ADDRESS
    },
    mainnetChainId: 1000, // CIP-20 Chain Mainnet
    testnetChainId: 9000  // CIP-20 Chain Testnet
  },
  
  // 관리자 계정 설정
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@nestplatform.com',
    password: process.env.ADMIN_PASSWORD || 'change_this_password'
  },
  
  // Web3Auth 설정
  web3Auth: {
    clientId: process.env.WEB3_AUTH_CLIENT_ID,
    secret: process.env.WEB3_AUTH_SECRET
  },
  
  // Redis 설정
  redis: {
    enabled: process.env.REDIS_ENABLED === 'true',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'nest:',
    // 캐싱 설정
    cache: {
      defaultTTL: parseInt(process.env.REDIS_CACHE_DEFAULT_TTL, 10) || 300, // 기본 5분
      // 경로별 캐싱 TTL 설정
      paths: {
        '/api/users': 600, // 10분
        '/api/missions': 300, // 5분
        '/api/nest-ids': 1800, // 30분
        '/api/analytics': 3600 // 1시간
      }
    }
  },
  
  // 분석 설정
  analytics: {
    enabled: process.env.ANALYTICS_ENABLED === 'true',
    anonymizeIps: process.env.ANALYTICS_ANONYMIZE_IPS === 'true',
    retentionDays: parseInt(process.env.ANALYTICS_RETENTION_DAYS, 10) || 90
  },
  
  // 암호화 설정
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'default_encryption_key_32_bytes_long',
    dataKey: process.env.DATA_ENCRYPTION_KEY || 'default_data_encryption_key_32_bytes',
    mnemonicKey: process.env.MNEMONIC_ENCRYPTION_KEY || 'default_mnemonic_key_32_bytes_long',
    salt: process.env.ENCRYPTION_SALT || 'nest_platform_default_salt',
    privateKeyPepper: process.env.PRIVATE_KEY_PEPPER || 'nest_private_key_pepper'
  },
  
  // 이메일 설정
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    from: process.env.EMAIL_FROM || 'Nest Platform <noreply@nestplatform.com>'
  },
  
  // 로깅 설정
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

// 개발 환경에서만 설정 로깅
if (config.env === 'development') {
  const safeConfig = { ...config };
  
  // 민감한 정보 숨기기
  safeConfig.jwt.secret = '********';
  safeConfig.admin.password = '********';
  safeConfig.mongodb.uri = safeConfig.mongodb.uri.replace(/:[^:]*@/, ':********@');
  
  if (safeConfig.redis.password) {
    safeConfig.redis.password = '********';
  }
  
  if (safeConfig.web3Auth.secret) {
    safeConfig.web3Auth.secret = '********';
  }
  
  if (safeConfig.email.auth.pass) {
    safeConfig.email.auth.pass = '********';
  }
  
  if (safeConfig.encryption.key) {
    safeConfig.encryption.key = '********';
  }
  
  if (safeConfig.encryption.dataKey) {
    safeConfig.encryption.dataKey = '********';
  }
  
  if (safeConfig.encryption.mnemonicKey) {
    safeConfig.encryption.mnemonicKey = '********';
  }
  
  if (safeConfig.encryption.salt) {
    safeConfig.encryption.salt = '********';
  }
  
  if (safeConfig.encryption.privateKeyPepper) {
    safeConfig.encryption.privateKeyPepper = '********';
  }
  
  console.log('서버 설정:', JSON.stringify(safeConfig, null, 2));
}

module.exports = config;
