/**
 * @file Web3Auth 로그인 컨트롤러
 * @description Web3Auth 소셜 로그인 처리
 */

const web3AuthUtils = require('../../utils/web3AuthUtils');
const authService = require('../../auth/authService');
const Wallet = require('../../models/wallet');
const User = require('../../models/user');
const logger = require('../../utils/logger');
const responseHandler = require('../../utils/responseHandler');

/**
 * Web3Auth 토큰 검증 및 로그인 처리
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const web3AuthLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return responseHandler.badRequest(res, 'Web3Auth 토큰이 필요합니다');
    }
    
    // 토큰 검증
    const verifiedToken = await web3AuthUtils.verifyWeb3AuthToken(idToken);
    
    // 사용자 정보 추출
    const userInfo = web3AuthUtils.extractUserInfo(verifiedToken);
    
    // 소셜 로그인 처리
    const socialData = {
      provider: userInfo.provider || 'web3auth',
      socialId: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      profileImage: userInfo.profileImage
    };
    
    // 기존 계정이 있는지 확인
    let user = await User.findOne({
      $or: [
        { email: socialData.email },
        { socialId: socialData.socialId, socialProvider: socialData.provider }
      ]
    });
    
    // 토큰에서 지갑 주소 추출
    const walletAddress = web3AuthUtils.deriveWalletAddressFromToken(verifiedToken);
    
    let loginResult;
    
    if (user) {
      // 기존 사용자 - 소셜 로그인 처리
      loginResult = await authService.socialLogin(socialData);
      
      // 지갑 주소 업데이트 (Web3Auth에서 제공된 주소 사용)
      if (walletAddress) {
        // 기존 지갑 확인
        let wallet = await Wallet.findOne({ user: user._id });
        
        if (wallet) {
          // 지갑 주소 업데이트
          wallet.address = walletAddress;
          wallet.creationMethod = 'web3auth';
          wallet.updatedAt = new Date();
          await wallet.save();
        } else {
          // 새 지갑 생성
          wallet = new Wallet({
            user: user._id,
            address: walletAddress,
            creationMethod: 'web3auth',
            status: 'active',
            tokenBalances: {
              nest: 0,
              cta: 0,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          await wallet.save();
        }
        
        // 사용자 정보 업데이트
        user.wallet = {
          address: walletAddress,
          createdAt: new Date(),
        };
        await user.save();
      }
    } else {
      // 새 사용자 - 가입 및 로그인 처리
      loginResult = await authService.socialLogin(socialData);
      
      // 새로 생성된 사용자 가져오기
      user = await User.findOne({
        socialId: socialData.socialId,
        socialProvider: socialData.provider
      });
      
      // 지갑 정보 업데이트 (필요한 경우)
      if (user && walletAddress) {
        const wallet = new Wallet({
          user: user._id,
          address: walletAddress,
          creationMethod: 'web3auth',
          status: 'active',
          tokenBalances: {
            nest: 0,
            cta: 0,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await wallet.save();
        
        user.wallet = {
          address: walletAddress,
          createdAt: new Date(),
        };
        await user.save();
      }
    }
    
    // 응답
    responseHandler.success(res, {
      message: '로그인 성공',
      data: loginResult
    });
  } catch (error) {
    logger.error(`Web3Auth 로그인 오류: ${error.message}`);
    responseHandler.error(res, error);
  }
};

/**
 * Web3Auth 클라이언트 설정 제공
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const getWeb3AuthConfig = (req, res) => {
  try {
    const config = web3AuthUtils.getWeb3AuthClientConfig();
    
    responseHandler.success(res, {
      message: 'Web3Auth 설정 조회 성공',
      data: config
    });
  } catch (error) {
    logger.error(`Web3Auth 설정 조회 오류: ${error.message}`);
    responseHandler.error(res, error);
  }
};

module.exports = {
  web3AuthLogin,
  getWeb3AuthConfig
};
