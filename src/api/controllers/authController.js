/**
 * @file 인증 컨트롤러
 * @description 인증 관련 요청 처리 컨트롤러
 */

const authService = require('../../auth/authService');
const User = require('../../models/user');
const Activity = require('../../models/activity');
const logger = require('../../utils/logger');

/**
 * 사용자 등록(회원가입) 처리
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    
    // 회원가입 서비스 호출
    const result = await authService.register({ name, email, password });
    
    // 활동 기록
    await Activity.create({
      user: result.user._id,
      type: 'wallet_created',
      data: {
        walletAddress: result.user.wallet.address,
      },
      metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
    
    res.status(201).json({
      success: true,
      data: result,
      message: '회원가입이 완료되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 사용자 로그인 처리
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // 로그인 서비스 호출
    const result = await authService.login(email, password);
    
    // 활동 기록
    await Activity.create({
      user: result.user._id,
      type: 'login',
      data: {
        method: 'email',
      },
      metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
    
    res.status(200).json({
      success: true,
      data: result,
      message: '로그인이 완료되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 소셜 로그인 처리
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const socialLogin = async (req, res, next) => {
  try {
    const { provider, socialId, email, name, profileImage } = req.body;
    
    // 소셜 로그인 서비스 호출
    const result = await authService.socialLogin({
      provider,
      socialId,
      email,
      name,
      profileImage,
    });
    
    // 활동 기록
    await Activity.create({
      user: result.user._id,
      type: 'login',
      data: {
        method: provider,
      },
      metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
    
    // 새 사용자인 경우 지갑 생성 활동 기록
    if (result.isNewUser) {
      await Activity.create({
        user: result.user._id,
        type: 'wallet_created',
        data: {
          walletAddress: result.user.wallet.address,
        },
        metadata: {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });
    }
    
    res.status(200).json({
      success: true,
      data: result,
      message: '소셜 로그인이 완료되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 액세스 토큰 갱신
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    // 토큰 갱신 서비스 호출
    const result = await authService.refreshAccessToken(refreshToken);
    
    res.status(200).json({
      success: true,
      data: result,
      message: '토큰이 갱신되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 사용자 로그아웃
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const logout = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // 로그아웃 서비스 호출
    await authService.logout(userId);
    
    res.status(200).json({
      success: true,
      message: '로그아웃되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 비밀번호 찾기 (재설정 이메일 발송)
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // 비밀번호 재설정 토큰 생성 서비스 호출
    const { resetToken, user } = await authService.generatePasswordResetToken(email);
    
    // 여기서는 실제 이메일 발송 대신 토큰 반환 (개발 환경)
    // 프로덕션에서는 이메일 발송 로직 구현 필요
    res.status(200).json({
      success: true,
      message: '비밀번호 재설정 안내가 이메일로 발송되었습니다.',
      data: {
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
        resetUrl: `${req.protocol}://${req.get('host')}/api/auth/password/reset/${resetToken}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 비밀번호 재설정
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const resetPassword = async (req, res, next) => {
  try {
    const { resetToken } = req.params;
    const { password } = req.body;
    
    // 비밀번호 재설정 서비스 호출
    await authService.resetPassword(resetToken, password);
    
    res.status(200).json({
      success: true,
      message: '비밀번호가 재설정되었습니다. 새 비밀번호로 로그인해주세요.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 현재 로그인한 사용자 정보 조회
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const getMe = async (req, res, next) => {
  try {
    // 사용자 정보 조회 (관계 데이터 포함)
    const user = await User.findById(req.user._id);
    
    if (!user) {
      const error = new Error('사용자를 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }
    
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 비밀번호 변경
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // 사용자 조회 (비밀번호 필드 포함)
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      const error = new Error('사용자를 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }
    
    // 소셜 로그인 사용자 확인
    if (user.socialProvider !== 'local') {
      const error = new Error(`${user.socialProvider} 로그인을 사용 중입니다. 비밀번호를 변경할 수 없습니다.`);
      error.status = 400;
      throw error;
    }
    
    // 현재 비밀번호 확인
    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      const error = new Error('현재 비밀번호가 일치하지 않습니다.');
      error.status = 401;
      throw error;
    }
    
    // 새 비밀번호 설정
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: '비밀번호가 변경되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 사용자 지갑 생성
 * 
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const createWallet = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // 이미 지갑이 있는지 확인
    const user = await User.findById(userId);
    
    if (user.wallet && user.wallet.address) {
      const error = new Error('이미 지갑이 생성되어 있습니다.');
      error.status = 400;
      throw error;
    }
    
    // 지갑 생성 서비스 호출
    const wallet = await authService.createWalletForUser(userId);
    
    // 사용자 정보에 지갑 주소 업데이트
    user.wallet = {
      address: wallet.address,
      createdAt: new Date(),
    };
    
    await user.save();
    
    // 활동 기록
    await Activity.create({
      user: userId,
      type: 'wallet_created',
      data: {
        walletAddress: wallet.address,
      },
      metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
    
    res.status(201).json({
      success: true,
      data: {
        address: wallet.address,
      },
      message: '지갑이 생성되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  socialLogin,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  changePassword,
  createWallet,
};
