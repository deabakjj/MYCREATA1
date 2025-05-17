/**
 * @file Web3Auth 서버 측 유틸리티
 * @description Web3Auth 연동을 위한 백엔드 유틸리티 함수들
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');
const config = require('../config');
const logger = require('./logger');

/**
 * Web3Auth 토큰 검증
 * @param {string} idToken - Web3Auth ID 토큰
 * @returns {Promise<Object>} 검증된 토큰 정보
 */
const verifyWeb3AuthToken = async (idToken) => {
  try {
    // JWK URL
    const jwksUrl = 'https://api.openlogin.com/.well-known/jwks.json';
    
    // JWKS 가져오기
    const jwksResponse = await axios.get(jwksUrl);
    const jwks = jwksResponse.data;
    
    // 토큰 디코딩 (서명 확인 전)
    const decoded = jwt.decode(idToken, { complete: true });
    if (!decoded) {
      throw new Error('유효하지 않은 Web3Auth 토큰 형식');
    }
    
    // 서명에 사용된 키 ID
    const { kid } = decoded.header;
    
    // 해당 키 찾기
    const key = jwks.keys.find(k => k.kid === kid);
    if (!key) {
      throw new Error('Web3Auth 토큰 서명에 사용된 키를 찾을 수 없음');
    }
    
    // PEM 형식으로 변환
    const publicKey = convertJwkToPem(key);
    
    // 토큰 검증
    const verifiedToken = jwt.verify(idToken, publicKey, {
      algorithms: ['RS256'],
      audience: config.web3Auth.clientId,
      issuer: 'https://api.openlogin.com' 
    });
    
    return verifiedToken;
  } catch (error) {
    logger.error(`Web3Auth 토큰 검증 실패: ${error.message}`);
    throw new Error('Web3Auth 토큰 검증 중 오류 발생: ' + error.message);
  }
};

/**
 * JWK를 PEM 형식으로 변환
 * @param {Object} jwk - JWK 키 객체
 * @returns {string} PEM 형식 공개키
 */
const convertJwkToPem = (jwk) => {
  return jwkToPem(jwk);
};

/**
 * Web3Auth 토큰에서 사용자 정보 추출
 * @param {Object} verifiedToken - 검증된 토큰 정보
 * @returns {Object} 사용자 정보
 */
const extractUserInfo = (verifiedToken) => {
  const { 
    email, 
    name, 
    picture, 
    sub, 
    verifier, 
    verifierId 
  } = verifiedToken;
  
  return {
    email,
    name,
    profileImage: picture,
    sub, // 고유 ID
    provider: verifier, // 소셜 로그인 제공자 (google, facebook 등)
    providerId: verifierId, // 소셜 로그인에서의 ID
  };
};

/**
 * Web3Auth 사용자 토큰으로부터 지갑 주소 파생
 * @param {Object} verifiedToken - 검증된 토큰 정보
 * @returns {string} 지갑 주소
 */
const deriveWalletAddressFromToken = (verifiedToken) => {
  try {
    if (!verifiedToken.walletAddress) {
      throw new Error('토큰에 지갑 주소 정보가 없습니다');
    }
    
    return verifiedToken.walletAddress;
  } catch (error) {
    logger.error(`Web3Auth 토큰에서 지갑 주소 파생 오류: ${error.message}`);
    throw new Error('Web3Auth 토큰에서 지갑 주소를 파생할 수 없습니다');
  }
};

/**
 * Web3Auth 클라이언트 측에서 사용할 설정 가져오기
 * @returns {Object} Web3Auth 클라이언트 설정
 */
const getWeb3AuthClientConfig = () => {
  return {
    clientId: config.web3Auth.clientId,
    redirectUrl: config.web3Auth.redirectUrl || window.location.origin,
    network: config.web3Auth.network || 'mainnet'
  };
};

/**
 * Web3Auth 소셜 로그인 상태에서 서버 자체 JWT 발급
 * @param {Object} userInfo - Web3Auth에서 추출한 사용자 정보
 * @returns {Object} JWT 토큰 정보
 */
const issueServerJWT = async (userInfo) => {
  try {
    // 여기서는 내부 authService.js를 직접 호출하는 대신
    // 백엔드 API를 호출하는 방식으로 구현
    const apiUrl = `${config.api.baseUrl}/auth/web3auth`;
    
    const response = await axios.post(apiUrl, {
      userInfo
    });
    
    return response.data;
  } catch (error) {
    logger.error(`서버 JWT 발급 오류: ${error.message}`);
    throw new Error('서버 JWT 발급 중 오류가 발생했습니다');
  }
};

module.exports = {
  verifyWeb3AuthToken,
  extractUserInfo,
  deriveWalletAddressFromToken,
  getWeb3AuthClientConfig,
  issueServerJWT
};
