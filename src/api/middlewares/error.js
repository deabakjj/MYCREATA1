/**
 * @file 오류 처리 미들웨어
 * @description 애플리케이션 전반의 오류를 처리하는 미들웨어
 */

const logger = require('../../utils/logger');
const config = require('../../config');

/**
 * 에러 처리 미들웨어
 * 모든 에러를 일관된 형식으로 처리합니다.
 * 
 * @param {Error} err - 발생한 오류 객체
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 * @returns {Response} JSON 형식의 에러 응답
 */
const errorMiddleware = (err, req, res, next) => {
  // 기본 상태 코드는 500 (서버 오류)
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || '서버 오류가 발생했습니다.';
  
  // 스택 트레이스는 개발 환경에서만 포함
  const stack = config.isDev ? err.stack : undefined;
  
  // 오류 로깅
  if (statusCode >= 500) {
    logger.error(`${statusCode} - ${message}`, {
      path: req.path,
      method: req.method,
      ip: req.ip,
      stack,
    });
  } else {
    logger.warn(`${statusCode} - ${message}`, {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
  }
  
  // 클라이언트에 오류 응답
  res.status(statusCode).json({
    success: false,
    error: {
      status: statusCode,
      message,
      ...(config.isDev && { stack }), // 개발 환경에서만 스택 추가
    },
    timestamp: new Date().toISOString(),
  });
};

module.exports = errorMiddleware;
