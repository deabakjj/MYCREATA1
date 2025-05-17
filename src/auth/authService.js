/**
 * @file 인증 서비스
 * @description 사용자 인증 및 지갑 생성 기능을 제공하는 서비스
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Web3 = require('web3');
const config = require('../config');
const User = require('../models/user');
const Wallet = require('../models/wallet');
const logger = require('../utils/logger');
const { 
  generateEthereumWallet, 
  encryptPrivateKey 
} = require('../blockchain/walletService');
const keyManager = require('../utils/keyManager');

/**
 * 사용자 등록(회원가입) 처리
 * 
 * @param {Object} userData - 사용자 등록 데이터
 * @returns {Promise<Object>} 등록된 사용자 정보 및 토큰
 */
const register = async (userData) => {
  const { email, password, name } = userData;
  
  // 이메일 중복 검사
  const existingUser = await User.findOne({ email });
  
  if (existingUser) {
    throw new Error('이미 등록된 이메일입니다.');
  }
  
  // 새 사용자 생성
  const user = new User({
    email,
    password,
    name,
    socialProvider: 'local',
  });
  
  // 사용자 저장
  await user.save();
  
  // 지갑 자동 생성
  const wallet = await createWalletForUser(user._id, password);
  
  // 사용자 정보에 지갑 주소 업데이트
  user.wallet = {
    address: wallet.address,
    createdAt: new Date(),
  };
  
  await user.save();
  
  // 토큰 생성
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  
  // 리프레시 토큰 저장
  user.refreshToken = refreshToken;
  await user.save();
  
  // 민감한 정보 제외하고 반환
  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    wallet: {
      address: wallet.address,
    },
  };
  
  return {
    user: userResponse,
    token,
    refreshToken,
  };
};

/**
 * 이메일과 비밀번호로 로그인
 * 
 * @param {string} email - 사용자 이메일
 * @param {string} password - 사용자 비밀번호
 * @returns {Promise<Object>} 로그인한 사용자 정보 및 토큰
 */
const login = async (email, password) => {
  // 이메일로 사용자 조회 (비밀번호 필드 포함)
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    throw new Error('등록되지 않은 이메일입니다.');
  }
  
  // 소셜 로그인 사용자 확인
  if (user.socialProvider !== 'local') {
    throw new Error(`${user.socialProvider} 로그인을 사용해주세요.`);
  }
  
  // 비밀번호 확인
  const isMatch = await user.matchPassword(password);
  
  if (!isMatch) {
    throw new Error('비밀번호가 일치하지 않습니다.');
  }
  
  // 계정 상태 확인
  if (!user.isActive) {
    throw new Error('비활성화된 계정입니다. 관리자에게 문의하세요.');
  }
  
  // 토큰 생성
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  
  // 리프레시 토큰 저장
  user.refreshToken = refreshToken;
  await user.save();
  
  // 민감한 정보 제외하고 반환
  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    wallet: user.wallet,
    profileImage: user.profileImage,
    level: user.level,
    xp: user.xp,
    stats: user.stats,
  };
  
  return {
    user: userResponse,
    token,
    refreshToken,
  };
};

/**
 * 소셜 로그인 처리
 * 
 * @param {Object} socialData - 소셜 로그인 데이터
 * @returns {Promise<Object>} 로그인한 사용자 정보 및 토큰
 */
const socialLogin = async (socialData) => {
  const { provider, socialId, email, name, profileImage } = socialData;
  
  // 기존 사용자 조회 (소셜 ID로)
  let user = await User.findOne({
    socialProvider: provider,
    socialId: socialId,
  });
  
  // 소셜 ID로 찾지 못했다면 이메일로 조회
  if (!user && email) {
    user = await User.findOne({ email });
  }
  
  // 사용자가 존재하지 않으면 새로 생성
  if (!user) {
    user = new User({
      name,
      email,
      socialProvider: provider,
      socialId,
      profileImage: profileImage || 'default.png',
      isActive: true,
    });
    
    // 사용자 저장
    await user.save();
    
    // 지갑 자동 생성 (소셜 로그인은 임의 비밀번호 사용)
    const randomPassword = crypto.randomBytes(16).toString('hex');
    const wallet = await createWalletForUser(user._id, randomPassword);
    
    // 사용자 정보에 지갑 주소 업데이트
    user.wallet = {
      address: wallet.address,
      createdAt: new Date(),
    };
    
    await user.save();
  } else {
    // 기존 사용자라면 정보 업데이트
    user.socialProvider = provider;
    user.socialId = socialId;
    
    // 프로필 이미지가 있고 기본 이미지를 사용 중이면 업데이트
    if (profileImage && user.profileImage === 'default.png') {
      user.profileImage = profileImage;
    }
    
    await user.save();
    
    // 지갑이 없다면 생성
    if (!user.wallet || !user.wallet.address) {
      // 소셜 로그인은 임의 비밀번호 사용
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const wallet = await createWalletForUser(user._id, randomPassword);
      
      user.wallet = {
        address: wallet.address,
        createdAt: new Date(),
      };
      
      await user.save();
    }
  }
  
  // 토큰 생성
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  
  // 리프레시 토큰 저장
  user.refreshToken = refreshToken;
  await user.save();
  
  // 민감한 정보 제외하고 반환
  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    wallet: user.wallet,
    profileImage: user.profileImage,
    level: user.level,
    xp: user.xp,
    stats: user.stats,
  };
  
  return {
    user: userResponse,
    token,
    refreshToken,
    isNewUser: !user.wallet || !user.wallet.address,
  };
};

/**
 * 토큰 리프레시
 * 
 * @param {string} refreshToken - 리프레시 토큰
 * @returns {Promise<Object>} 새로운 액세스 토큰
 */
const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error('리프레시 토큰이 제공되지 않았습니다.');
  }
  
  try {
    // 리프레시 토큰 검증
    const decoded = jwt.verify(refreshToken, config.jwt.secret);
    
    // 사용자 조회
    const user = await User.findById(decoded.id).select('+refreshToken');
    
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    
    // 저장된 리프레시 토큰과 비교
    if (user.refreshToken !== refreshToken) {
      throw new Error('유효하지 않은 리프레시 토큰입니다.');
    }
    
    // 새 액세스 토큰 생성
    const newAccessToken = generateToken(user._id);
    
    return {
      token: newAccessToken,
    };
  } catch (error) {
    throw new Error('리프레시 토큰 검증 실패: ' + error.message);
  }
};

/**
 * 사용자 로그아웃
 * 
 * @param {string} userId - 사용자 ID
 * @returns {Promise<boolean>} 로그아웃 성공 여부
 */
const logout = async (userId) => {
  // 사용자의 리프레시 토큰 삭제
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('사용자를 찾을 수 없습니다.');
  }
  
  user.refreshToken = undefined;
  await user.save();
  
  return true;
};

/**
 * 비밀번호 재설정 토큰 생성
 * 
 * @param {string} email - 사용자 이메일
 * @returns {Promise<Object>} 비밀번호 재설정 토큰 정보
 */
const generatePasswordResetToken = async (email) => {
  // 이메일로 사용자 조회
  const user = await User.findOne({ email });
  
  if (!user) {
    throw new Error('등록되지 않은 이메일입니다.');
  }
  
  // 소셜 로그인 사용자 확인
  if (user.socialProvider !== 'local') {
    throw new Error(`${user.socialProvider} 로그인을 사용 중입니다. 비밀번호를 재설정할 수 없습니다.`);
  }
  
  // 재설정 토큰 생성 (랜덤 문자열)
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  // 토큰 해시 저장
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // 토큰 만료 시간 설정 (10분)
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  
  await user.save();
  
  return {
    resetToken,
    user,
  };
};

/**
 * 비밀번호 재설정
 * 
 * @param {string} resetToken - 비밀번호 재설정 토큰
 * @param {string} newPassword - 새 비밀번호
 * @returns {Promise<boolean>} 재설정 성공 여부
 */
const resetPassword = async (resetToken, newPassword) => {
  // 토큰 해시
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // 유효한 토큰을 가진 사용자 조회
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  
  if (!user) {
    throw new Error('유효하지 않거나 만료된 토큰입니다.');
  }
  
  // 새 비밀번호 설정
  user.password = newPassword;
  
  // 재설정 토큰 초기화
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  
  await user.save();
  
  return true;
};

/**
 * 사용자의 지갑 생성
 * 
 * @param {ObjectId} userId - 사용자 ID
 * @param {string} password - 암호화에 사용할 비밀번호
 * @returns {Promise<Object>} 생성된 지갑 정보
 */
const createWalletForUser = async (userId, password) => {
  try {
    // 사용자 조회
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    
    // 이미 지갑이 있는지 확인
    const existingWallet = await Wallet.findOne({ user: userId });
    
    if (existingWallet) {
      return existingWallet;
    }
    
    // 새 이더리움 지갑 생성
    const { address, privateKey, mnemonic, encryptedMnemonic } = await generateEthereumWallet();
    
    // 개인키 암호화 (안전한 방식으로)
    const encryptedPrivateKeyData = encryptPrivateKey(privateKey, password);
    
    // 지갑 모델 생성
    const wallet = new Wallet({
      user: userId,
      address,
      encryptedPrivateKey: JSON.stringify(encryptedPrivateKeyData),
      encryptedMnemonic: JSON.stringify(encryptedMnemonic),
      creationMethod: 'auto',
      status: 'active',
      tokenBalances: {
        nest: 0,
        cta: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // 지갑 저장
    await wallet.save();
    
    logger.info(`사용자 ${userId}의 새 지갑이 생성되었습니다: ${address}`);
    
    return wallet;
  } catch (error) {
    logger.error(`지갑 생성 실패: ${error.message}`);
    throw new Error('지갑 생성 중 오류가 발생했습니다: ' + error.message);
  }
};

/**
 * JWT 토큰 생성
 * 
 * @param {ObjectId} id - 사용자 ID
 * @returns {string} JWT 토큰
 */
const generateToken = (id) => {
  return jwt.sign({ id }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

/**
 * 리프레시 토큰 생성
 * 
 * @param {ObjectId} id - 사용자 ID
 * @returns {string} 리프레시 토큰
 */
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, config.jwt.secret, {
    expiresIn: '7d', // 리프레시 토큰은 더 긴 만료 시간
  });
};

module.exports = {
  register,
  login,
  socialLogin,
  refreshAccessToken,
  logout,
  generatePasswordResetToken,
  resetPassword,
  createWalletForUser,
};
