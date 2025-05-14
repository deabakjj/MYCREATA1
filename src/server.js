/**
 * @file 서버 시작점
 * @description Express 서버 설정 및 API 라우트 정의
 */

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { connectDB, disconnectDB } = require('./config/database');
const config = require('./config');
const logger = require('./utils/logger');
const errorMiddleware = require('./api/middlewares/error');

// 라우터 가져오기
const authRoutes = require('./api/routes/auth');
const userRoutes = require('./api/routes/user');
const walletRoutes = require('./api/routes/wallet');
const nestIdRoutes = require('./api/routes/nestId');
const nftRoutes = require('./api/routes/nft');
const missionRoutes = require('./api/routes/mission');
const userMissionRoutes = require('./api/routes/userMissionRoutes');
const groupMissionRoutes = require('./api/routes/groupMissionRoutes');
const relayRoutes = require('./api/routes/relayRoutes');
const reputationGraphRoutes = require('./api/routes/reputationGraphRoutes');
const analyticsRoutes = require('./api/routes/analytics');

// Express 앱 초기화
const app = express();

// 데이터베이스 연결
connectDB();

// 보안 미들웨어
app.use(helmet());

// CORS 설정
app.use(cors(config.cors));

// gzip 압축
app.use(compression());

// 요청 로깅
app.use(morgan('combined', { stream: logger.stream }));

// JSON 파싱
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 요청 제한 설정
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.'
});

// 모든 요청에 속도 제한 적용
app.use(limiter);

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    name: 'Nest Platform API',
    version: '1.0.0',
    status: 'active',
  });
});

// API 라우트
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/nest-ids', nestIdRoutes);
app.use('/api/nfts', nftRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/user-missions', userMissionRoutes);
app.use('/api/group-missions', groupMissionRoutes);
app.use('/api/relay', relayRoutes);
app.use('/api/reputation', reputationGraphRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 핸들러
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
});

// 에러 핸들러
app.use(errorMiddleware);

// 서버 시작
const PORT = config.port;

const server = app.listen(PORT, () => {
  logger.info(`서버가 ${PORT} 포트에서 실행 중입니다.`);
  logger.info(`환경: ${config.env}`);
});

// 종료 시그널 처리
process.on('SIGTERM', () => {
  logger.info('SIGTERM 신호를 받았습니다. 서버를 종료합니다.');
  gracefulShutdown();
});

process.on('SIGINT', () => {
  logger.info('SIGINT 신호를 받았습니다. 서버를 종료합니다.');
  gracefulShutdown();
});

// 예상치 못한 에러 처리
process.on('uncaughtException', (error) => {
  logger.error(`미처리 예외: ${error.message}`, { stack: error.stack });
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('미처리 거부: ', reason);
  gracefulShutdown();
});

// 서버를 안전하게 종료하는 함수
const gracefulShutdown = () => {
  logger.info('서비스를 종료하는 중...');
  
  server.close(async () => {
    logger.info('Express 서버가 종료되었습니다.');
    
    try {
      await disconnectDB();
      logger.info('안전하게 종료되었습니다.');
      process.exit(0);
    } catch (error) {
      logger.error('종료 중 오류 발생:', error);
      process.exit(1);
    }
  });

  // 강제 종료 타이머 (30초 후 강제 종료)
  setTimeout(() => {
    logger.error('정상적으로 종료되지 않았습니다. 강제 종료합니다.');
    process.exit(1);
  }, 30000);
};

module.exports = app;
