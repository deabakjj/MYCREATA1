/**
 * @file NFT 관련 API 컨트롤러
 * @description NFT 관련 API 요청 처리 로직
 */

const nftService = require('../../services/nftService');
const logger = require('../../utils/logger');
const responseHandler = require('../../utils/responseHandler');

/**
 * @function getNFTs
 * @description 모든 NFT 목록을 조회합니다.
 */
const getNFTs = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const nfts = await nftService.getAllNFTs(parseInt(page), parseInt(limit));
    responseHandler.success(res, {
      message: 'NFT 목록을 성공적으로 조회했습니다.',
      data: nfts
    });
  } catch (error) {
    logger.error(`NFT 목록 조회 중 오류: ${error.message}`);
    responseHandler.error(res, error);
  }
};

/**
 * @function getNFTById
 * @description 특정 ID를 가진 NFT를 조회합니다.
 */
const getNFTById = async (req, res) => {
  try {
    const { id } = req.params;
    const nft = await nftService.getNFTById(id);
    if (!nft) {
      return responseHandler.notFound(res, 'NFT를 찾을 수 없습니다.');
    }
    responseHandler.success(res, {
      message: 'NFT를 성공적으로 조회했습니다.',
      data: nft
    });
  } catch (error) {
    logger.error(`NFT 조회 중 오류: ${error.message}`);
    responseHandler.error(res, error);
  }
};

/**
 * @function mintNFT
 * @description 새로운 NFT를 발행합니다.
 */
const mintNFT = async (req, res) => {
  try {
    const { recipientId, metadata, type } = req.body;
    
    if (!recipientId || !metadata || !type) {
      return responseHandler.badRequest(res, '필수 필드가 누락되었습니다: recipientId, metadata, type');
    }
    
    const nft = await nftService.mintNFT(recipientId, metadata, type);
    responseHandler.created(res, {
      message: 'NFT가 성공적으로 발행되었습니다.',
      data: nft
    });
  } catch (error) {
    logger.error(`NFT 발행 중 오류: ${error.message}`);
    responseHandler.error(res, error);
  }
};

/**
 * @function transferNFT
 * @description NFT를 다른 사용자에게 전송합니다.
 */
const transferNFT = async (req, res) => {
  try {
    const { nftId, recipientId } = req.body;
    const userId = req.user.id;
    
    if (!nftId || !recipientId) {
      return responseHandler.badRequest(res, '필수 필드가 누락되었습니다: nftId, recipientId');
    }
    
    const result = await nftService.transferNFT(userId, nftId, recipientId);
    responseHandler.success(res, {
      message: 'NFT가 성공적으로 전송되었습니다.',
      data: result
    });
  } catch (error) {
    logger.error(`NFT 전송 중 오류: ${error.message}`);
    responseHandler.error(res, error);
  }
};

/**
 * @function getNFTHistory
 * @description 특정 NFT의 거래 기록을 조회합니다.
 */
const getNFTHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await nftService.getNFTHistory(id);
    
    responseHandler.success(res, {
      message: 'NFT 거래 기록을 성공적으로 조회했습니다.',
      data: history
    });
  } catch (error) {
    logger.error(`NFT 거래 기록 조회 중 오류: ${error.message}`);
    responseHandler.error(res, error);
  }
};

/**
 * @function getNFTsByOwner
 * @description 특정 사용자가 보유한 NFT 목록을 조회합니다.
 */
const getNFTsByOwner = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const nfts = await nftService.getNFTsByOwner(userId, parseInt(page), parseInt(limit));
    responseHandler.success(res, {
      message: '사용자의 NFT 목록을 성공적으로 조회했습니다.',
      data: nfts
    });
  } catch (error) {
    logger.error(`사용자의 NFT 목록 조회 중 오류: ${error.message}`);
    responseHandler.error(res, error);
  }
};

/**
 * @function getNFTsByType
 * @description 특정 유형의 NFT 목록을 조회합니다.
 */
const getNFTsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const nfts = await nftService.getNFTsByType(type, parseInt(page), parseInt(limit));
    responseHandler.success(res, {
      message: `${type} 유형의 NFT 목록을 성공적으로 조회했습니다.`,
      data: nfts
    });
  } catch (error) {
    logger.error(`NFT 유형별 목록 조회 중 오류: ${error.message}`);
    responseHandler.error(res, error);
  }
};

/**
 * @function getBadgeNFTs
 * @description 모든 뱃지 유형의 NFT 목록을 조회합니다.
 */
const getBadgeNFTs = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const nfts = await nftService.getNFTsByType('badge', parseInt(page), parseInt(limit));
    responseHandler.success(res, {
      message: '뱃지 유형의 NFT 목록을 성공적으로 조회했습니다.',
      data: nfts
    });
  } catch (error) {
    logger.error(`뱃지 NFT 목록 조회 중 오류: ${error.message}`);
    responseHandler.error(res, error);
  }
};

/**
 * @function getRewardNFTs
 * @description 모든 보상 유형의 NFT 목록을 조회합니다.
 */
const getRewardNFTs = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const nfts = await nftService.getNFTsByType('reward', parseInt(page), parseInt(limit));
    responseHandler.success(res, {
      message: '보상 유형의 NFT 목록을 성공적으로 조회했습니다.',
      data: nfts
    });
  } catch (error) {
    logger.error(`보상 NFT 목록 조회 중 오류: ${error.message}`);
    responseHandler.error(res, error);
  }
};

/**
 * @function getAchievementNFTs
 * @description 모든 업적 유형의 NFT 목록을 조회합니다.
 */
const getAchievementNFTs = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const nfts = await nftService.getNFTsByType('achievement', parseInt(page), parseInt(limit));
    responseHandler.success(res, {
      message: '업적 유형의 NFT 목록을 성공적으로 조회했습니다.',
      data: nfts
    });
  } catch (error) {
    logger.error(`업적 NFT 목록 조회 중 오류: ${error.message}`);
    responseHandler.error(res, error);
  }
};

module.exports = {
  getNFTs,
  getNFTById,
  mintNFT,
  transferNFT,
  getNFTHistory,
  getNFTsByOwner,
  getNFTsByType,
  getBadgeNFTs,
  getRewardNFTs,
  getAchievementNFTs
};
