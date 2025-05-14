/**
 * @file 유효성 검사 미들웨어
 * @description express-validator를 사용한 요청 데이터 유효성 검사 미들웨어
 */

const { validationResult } = require('express-validator');

/**
 * 요청 데이터 유효성 검사 미들웨어
 * express-validator의 검증 결과를 확인하고 오류가 있으면 응답
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 * @returns {Function} 다음 미들웨어 호출 또는 에러 응답
 */
const validate = (req, res, next) => {
  // 유효성 검사 결과 확인
  const errors = validationResult(req);
  
  // 오류가 없으면 다음 미들웨어로 진행
  if (errors.isEmpty()) {
    return next();
  }
  
  // 오류가 있으면 400 응답
  const extractedErrors = errors.array().map(err => ({
    [err.param]: err.msg
  }));
  
  return res.status(400).json({
    success: false,
    error: {
      status: 400,
      message: '요청 데이터 유효성 검사 실패',
      details: extractedErrors,
    },
    timestamp: new Date().toISOString(),
  });
};

module.exports = validate;
