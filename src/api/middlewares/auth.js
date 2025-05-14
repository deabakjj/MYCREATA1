/**
 * @file 인증 미들웨어
 * @description 사용자 인증 및 권한 확인을 위한 미들웨어
 */

const jwt = require('jsonwebtoken');
const config = require('../../config');
const User = require('../../models/user');

/**
 * JWT 토큰을 검증하고 사용자를 인증하는 미들웨어
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 * @returns {Function} 다음 미들웨어 호출 또는 에러 응답
 */
const authenticate = async (req, res, next) => {
  try {
    // 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new Error('인증 토큰이 제공되지 않았습니다.');
      error.status = 401;
      return next(error);
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      const error = new Error('인증 토큰이 유효하지 않습니다.');
      error.status = 401;
      return next(error);
    }
    
    // 토큰 검증
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // 사용자 조회
    const user = await User.findById(decoded.id);
    
    if (!user) {
      const error = new Error('사용자를 찾을 수 없습니다.');
      error.status = 401;
      return next(error);
    }
    
    // 사용자 정보를 요청 객체에 추가
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      const err = new Error('인증 토큰이 유효하지 않습니다.');
      err.status = 401;
      return next(err);
    }
    
    if (error.name === 'TokenExpiredError') {
      const err = new Error('인증 토큰이 만료되었습니다.');
      err.status = 401;
      return next(err);
    }
    
    next(error);
  }
};

/**
 * 사용자 역할 기반 인증 미들웨어
 * 
 * @param {String[]} roles - 허용되는 역할 배열
 * @returns {Function} 역할 검사 미들웨어 함수
 */
const authorize = (roles = []) => {
  // 역할이 단일 문자열인 경우 배열로 변환
  if (typeof roles === 'string') {
    roles = [roles];
  }
  
  return (req, res, next) => {
    // authenticate 미들웨어가 먼저 실행되어야 함
    if (!req.user) {
      const error = new Error('인증되지 않은 사용자입니다.');
      error.status = 401;
      return next(error);
    }
    
    // 역할 검사 (역할이 빈 배열이면 모든 인증된 사용자 허용)
    if (roles.length && !roles.includes(req.user.role)) {
      const error = new Error('이 작업을 수행할 권한이 없습니다.');
      error.status = 403;
      return next(error);
    }
    
    // 다음 미들웨어 실행
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
