/**
 * missionService.js
 * 미션 관련 비즈니스 로직을 처리하는 서비스
 */

const Mission = require('../models/mission');
const MissionParticipation = require('../models/missionParticipation');
const User = require('../models/user');
const xpService = require('./xpService');
const nftService = require('./nftService');
const tokenService = require('./tokenService');
const logger = require('../utils/logger');

/**
 * 모든 미션 목록을 조회합니다.
 * @param {Object} filter - 조회 필터 (선택사항)
 * @param {Object} options - 정렬, 페이징 등 옵션 (선택사항)
 * @returns {Promise<Array>} 미션 목록
 */
const getAllMissions = async (filter = {}, options = {}) => {
  try {
    const { sort = { createdAt: -1 }, limit = 10, skip = 0 } = options;
    const missions = await Mission.find(filter)
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .populate('createdBy', 'nestId username');
    
    return missions;
  } catch (error) {
    logger.error(`미션 목록 조회 실패: ${error.message}`);
    throw new Error('미션 목록을 불러오는 중 오류가 발생했습니다.');
  }
};

/**
 * 특정 미션 정보를 조회합니다.
 * @param {string} missionId - 미션 ID
 * @returns {Promise<Object>} 미션 정보
 */
const getMissionById = async (missionId) => {
  try {
    const mission = await Mission.findById(missionId)
      .populate('createdBy', 'nestId username')
      .populate({
        path: 'participants',
        select: 'user status completedAt rewards',
        populate: {
          path: 'user',
          select: 'nestId username'
        }
      });
    
    if (!mission) {
      throw new Error('해당 미션을 찾을 수 없습니다.');
    }
    
    return mission;
  } catch (error) {
    logger.error(`미션 조회 실패: ${error.message}`);
    throw new Error('미션 정보를 불러오는 중 오류가 발생했습니다.');
  }
};

/**
 * 새로운 미션을 생성합니다.
 * @param {Object} missionData - 미션 생성 데이터
 * @returns {Promise<Object>} 생성된 미션 정보
 */
const createMission = async (missionData) => {
  try {
    // 미션 생성 권한 확인
    const creatorUser = await User.findById(missionData.createdBy);
    if (!creatorUser) {
      throw new Error('미션 생성 권한이 없습니다.');
    }
    
    // 미션 생성
    const mission = new Mission({
      ...missionData,
      status: 'active',
      participantCount: 0,
      completionCount: 0,
      createdAt: new Date()
    });
    
    await mission.save();
    return mission;
  } catch (error) {
    logger.error(`미션 생성 실패: ${error.message}`);
    throw new Error('미션 생성 중 오류가 발생했습니다.');
  }
};

/**
 * 미션 정보를 업데이트합니다.
 * @param {string} missionId - 미션 ID
 * @param {Object} updateData - 업데이트할 데이터
 * @returns {Promise<Object>} 업데이트된 미션 정보
 */
const updateMission = async (missionId, updateData) => {
  try {
    // 업데이트 가능한 필드 제한
    const allowedFields = ['title', 'description', 'requirements', 'xpReward', 'tokenReward', 'nftReward', 'deadline', 'status'];
    const updates = {};
    
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = updateData[key];
      }
    });
    
    // 미션 업데이트
    const mission = await Mission.findByIdAndUpdate(
      missionId,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!mission) {
      throw new Error('해당 미션을 찾을 수 없습니다.');
    }
    
    return mission;
  } catch (error) {
    logger.error(`미션 업데이트 실패: ${error.message}`);
    throw new Error('미션 업데이트 중 오류가 발생했습니다.');
  }
};

/**
 * 미션에 참여합니다.
 * @param {string} missionId - 미션 ID
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} 참여 정보
 */
const participateMission = async (missionId, userId) => {
  try {
    // 미션 조회
    const mission = await Mission.findById(missionId);
    if (!mission) {
      throw new Error('해당 미션을 찾을 수 없습니다.');
    }
    
    // 미션 상태 확인
    if (mission.status !== 'active') {
      throw new Error('참여할 수 없는 미션입니다.');
    }
    
    // 이미 참여했는지 확인
    const existingParticipation = await MissionParticipation.findOne({
      mission: missionId,
      user: userId
    });
    
    if (existingParticipation) {
      throw new Error('이미 참여한 미션입니다.');
    }
    
    // 참여 정보 생성
    const participation = new MissionParticipation({
      mission: missionId,
      user: userId,
      status: 'in_progress',
      startedAt: new Date()
    });
    
    await participation.save();
    
    // 미션 참여자 수 업데이트
    await Mission.findByIdAndUpdate(missionId, {
      $inc: { participantCount: 1 }
    });
    
    return participation;
  } catch (error) {
    logger.error(`미션 참여 실패: ${error.message}`);
    throw new Error('미션 참여 중 오류가 발생했습니다.');
  }
};

/**
 * 미션 완료를 제출합니다.
 * @param {string} missionId - 미션 ID
 * @param {string} userId - 사용자 ID
 * @param {Object} submissionData - 제출 데이터
 * @returns {Promise<Object>} 업데이트된 참여 정보
 */
const submitMissionCompletion = async (missionId, userId, submissionData) => {
  try {
    // 참여 정보 조회
    const participation = await MissionParticipation.findOne({
      mission: missionId,
      user: userId
    });
    
    if (!participation) {
      throw new Error('미션 참여 정보를 찾을 수 없습니다.');
    }
    
    if (participation.status !== 'in_progress') {
      throw new Error('이미 완료되었거나 취소된 미션입니다.');
    }
    
    // 완료 상태로 업데이트
    participation.status = 'completed';
    participation.completedAt = new Date();
    participation.submission = submissionData;
    await participation.save();
    
    // 미션 완료자 수 업데이트
    await Mission.findByIdAndUpdate(missionId, {
      $inc: { completionCount: 1 }
    });
    
    // 미션 정보 조회
    const mission = await Mission.findById(missionId);
    
    // 보상 지급
    await processRewards(mission, userId, participation);
    
    return participation;
  } catch (error) {
    logger.error(`미션 완료 제출 실패: ${error.message}`);
    throw new Error('미션 완료 제출 중 오류가 발생했습니다.');
  }
};

/**
 * 미션 보상을 처리합니다.
 * @param {Object} mission - 미션 정보
 * @param {string} userId - 사용자 ID
 * @param {Object} participation - 참여 정보
 * @returns {Promise<void>}
 */
const processRewards = async (mission, userId, participation) => {
  try {
    const rewards = {
      xp: 0,
      token: 0,
      nft: null
    };
    
    // XP 보상 처리
    if (mission.xpReward && mission.xpReward > 0) {
      await xpService.addXP(userId, mission.xpReward, `미션 완료: ${mission.title}`);
      rewards.xp = mission.xpReward;
    }
    
    // 토큰 보상 처리
    if (mission.tokenReward && mission.tokenReward > 0) {
      await tokenService.transferTokens(userId, mission.tokenReward, `미션 완료: ${mission.title}`);
      rewards.token = mission.tokenReward;
    }
    
    // NFT 보상 처리
    if (mission.nftReward) {
      const nftId = await nftService.mintNFT(userId, mission.nftReward, {
        title: mission.title,
        description: `${mission.title} 미션 완료 기념 NFT`,
        missionId: mission._id.toString()
      });
      rewards.nft = nftId;
    }
    
    // 보상 정보 업데이트
    participation.rewards = rewards;
    await participation.save();
    
    logger.info(`사용자 ${userId}에게 미션 ${mission._id} 보상 지급 완료`);
  } catch (error) {
    logger.error(`보상 처리 실패: ${error.message}`);
    throw new Error('보상 처리 중 오류가 발생했습니다.');
  }
};

/**
 * 사용자가 완료한 미션 목록을 조회합니다.
 * @param {string} userId - 사용자 ID
 * @param {Object} options - 정렬, 페이징 등 옵션 (선택사항)
 * @returns {Promise<Array>} 미션 목록
 */
const getUserCompletedMissions = async (userId, options = {}) => {
  try {
    const { sort = { completedAt: -1 }, limit = 10, skip = 0 } = options;
    
    const participations = await MissionParticipation.find({
      user: userId,
      status: 'completed'
    })
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .populate({
        path: 'mission',
        select: 'title description xpReward tokenReward nftReward'
      });
    
    return participations;
  } catch (error) {
    logger.error(`사용자 완료 미션 조회 실패: ${error.message}`);
    throw new Error('완료한 미션 목록을 불러오는 중 오류가 발생했습니다.');
  }
};

/**
 * 사용자가 진행 중인 미션 목록을 조회합니다.
 * @param {string} userId - 사용자 ID
 * @param {Object} options - 정렬, 페이징 등 옵션 (선택사항)
 * @returns {Promise<Array>} 미션 목록
 */
const getUserInProgressMissions = async (userId, options = {}) => {
  try {
    const { sort = { startedAt: -1 }, limit = 10, skip = 0 } = options;
    
    const participations = await MissionParticipation.find({
      user: userId,
      status: 'in_progress'
    })
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .populate({
        path: 'mission',
        select: 'title description deadline xpReward tokenReward nftReward'
      });
    
    return participations;
  } catch (error) {
    logger.error(`사용자 진행 중 미션 조회 실패: ${error.message}`);
    throw new Error('진행 중인 미션 목록을 불러오는 중 오류가 발생했습니다.');
  }
};

/**
 * 미션 참여를 취소합니다.
 * @param {string} missionId - 미션 ID
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} 업데이트된 참여 정보
 */
const cancelMissionParticipation = async (missionId, userId) => {
  try {
    const participation = await MissionParticipation.findOne({
      mission: missionId,
      user: userId
    });
    
    if (!participation) {
      throw new Error('미션 참여 정보를 찾을 수 없습니다.');
    }
    
    if (participation.status !== 'in_progress') {
      throw new Error('이미 완료되었거나 취소된 미션입니다.');
    }
    
    // 취소 상태로 업데이트
    participation.status = 'cancelled';
    participation.cancelledAt = new Date();
    await participation.save();
    
    // 미션 참여자 수 업데이트
    await Mission.findByIdAndUpdate(missionId, {
      $inc: { participantCount: -1 }
    });
    
    return participation;
  } catch (error) {
    logger.error(`미션 참여 취소 실패: ${error.message}`);
    throw new Error('미션 참여 취소 중 오류가 발생했습니다.');
  }
};

module.exports = {
  getAllMissions,
  getMissionById,
  createMission,
  updateMission,
  participateMission,
  submitMissionCompletion,
  getUserCompletedMissions,
  getUserInProgressMissions,
  cancelMissionParticipation
};
