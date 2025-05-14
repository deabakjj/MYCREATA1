/**
 * @file 데이터베이스 연결 설정
 * @description MongoDB 데이터베이스 연결을 관리합니다.
 */

const mongoose = require('mongoose');
const config = require('./index');
const logger = require('../utils/logger');

// MongoDB 연결 옵션
const options = config.db.options;

/**
 * 데이터베이스 연결 함수
 * @returns {Promise} MongoDB 연결 프로미스
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.db.uri, options);
    
    logger.info(`MongoDB 연결 성공: ${conn.connection.host}`);
    
    // 연결 이벤트 리스너 설정
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB 연결 오류: ${err}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB 연결 해제됨. 재연결 시도 중...');
      setTimeout(connectDB, 5000);
    });
    
    return conn;
  } catch (error) {
    logger.error(`MongoDB 연결 실패: ${error.message}`);
    process.exit(1);
  }
};

/**
 * 데이터베이스 연결 해제 함수
 * @returns {Promise} MongoDB 연결 해제 프로미스
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB 연결 해제됨');
  } catch (error) {
    logger.error(`MongoDB 연결 해제 실패: ${error.message}`);
  }
};

module.exports = {
  connectDB,
  disconnectDB,
};
