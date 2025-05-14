/**
 * xpService.js
 * 경험치(XP) 관련 비즈니스 로직을 처리하는 서비스
 */

const User = require('../models/user');
const Activity = require('../models/activity');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * 레벨별 필요 XP 표
 * 레벨이 높아질수록 필요 XP가 증가하는 구조
 */
const LEVEL_XP_REQUIREMENTS = {
  1: 0,     // 레벨 1 (시작 레벨)
  2: 100,   // 레벨 2가 되기 위한 XP
  3: 300,   // 레벨 3가 되기 위한 XP
  4: 600,   // 레벨 4가 되기 위한 XP
  5: 1000,  // 레벨 5가 되기 위한 XP
  6: 1500,  // 레벨 6가 되기 위한 XP
  7: 2100,  // 레벨 7가 되기 위한 XP
  8: 2800,  // 레벨 8가 되기 위한 XP
  9: 3600,  // 레벨 9가 되기 위한 XP
  10: 4500, // 레벨 10가 되기 위한 XP
  // 추가 레벨은 필요에 따라 확장
};

/**
 * 주어진 XP에 해당하는 레벨을 계산합니다.
 * @param {number} xp - 경험치
 * @returns {number} 레벨
 */
const calculateLevel = (xp) => {
  let level = 1;
  
  // 최대 레벨까지 반복하여 현재 XP에 맞는 레벨 찾기
  const maxLevel = Math.max(...Object.keys(LEVEL_XP_REQUIREMENTS).map(Number));
  
  for (let i = 2; i <= maxLevel; i++) {
    if (xp >= LEVEL_XP_REQUIREMENTS[i]) {
      level = i;
    } else {
      break;
    }
  }
  
  return level;
};

/**
 * 다음 레벨까지 필요한 XP를 계산합니다.
 * @param {number} currentXP - 현재 경험치
 * @param {number} currentLevel - 현재 레벨
 * @returns {Object} 다음 레벨 정보
 */
const calculateNextLevelInfo = (currentXP, currentLevel) => {
  const maxLevel = Math.max(...Object.keys(LEVEL_XP_REQUIREMENTS).map(Number));
  
  // 이미 최대 레벨인 경우
  if (currentLevel >= maxLevel) {
    return {
      nextLevel: maxLevel,
      nextLevelXP: LEVEL_XP_REQUIREMENTS[maxLevel],
      remainingXP: 0,
      progress: 100
    };
  }
  
  const nextLevel = currentLevel + 1;
  const nextLevelXP = LEVEL_XP_REQUIREMENTS[nextLevel];
  const currentLevelXP = LEVEL_XP_REQUIREMENTS[currentLevel];
  const remainingXP = nextLevelXP - currentXP;
  
  // 현재 레벨에서 다음 레벨까지의 진행도(%)
  const levelRange = nextLevelXP - currentLevelXP;
  const progress = Math.round(((currentXP - currentLevelXP) / levelRange) * 100);
  
  return {
    nextLevel,
    nextLevelXP,
    remainingXP,
    progress
  };
};

/**
 * 사용자의 XP 상태를 조회합니다.
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} XP 상태 정보
 */
const getXPStatus = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    
    const currentXP = user.xp || 0;
    const currentLevel = calculateLevel(currentXP);
    const nextLevelInfo = calculateNextLevelInfo(currentXP, currentLevel);
    
    return {
      userId,
      currentXP,
      currentLevel,
      ...nextLevelInfo
    };
  } catch (error) {
    logger.error(`XP 상태 조회 실패: ${error.message}`);
    throw new Error('XP 상태를 조회하는 중 오류가 발생했습니다.');
  }
};

/**
 * 사용자에게 XP를 추가합니다.
 * @param {string} userId - 사용자 ID
 * @param {number} amount - 추가할 XP 양
 * @param {string} reason - XP 추가 이유
 * @returns {Promise<Object>} 업데이트된 XP 상태
 */
const addXP = async (userId, amount, reason) => {
  try {
    // 유효성 검사
    if (amount <= 0) {
      throw new Error('XP는 0보다 커야 합니다.');
    }
    
    // 사용자 조회
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    
    // 현재 상태 기록
    const oldXP = user.xp || 0;
    const oldLevel = calculateLevel(oldXP);
    
    // XP 업데이트
    user.xp = oldXP + amount;
    const newXP = user.xp;
    const newLevel = calculateLevel(newXP);
    
    // 사용자 정보 저장
    await user.save();
    
    // 활동 기록 저장
    await Activity.create({
      userId,
      type: 'XP_ADDED',
      details: {
        amount,
        reason,
        oldXP,
        newXP,
        oldLevel,
        newLevel
      },
      timestamp: new Date()
    });
    
    // 레벨업 체크
    const leveledUp = newLevel > oldLevel;
    
    if (leveledUp) {
      // 레벨업 활동 기록
      await Activity.create({
        userId,
        type: 'LEVEL_UP',
        details: {
          oldLevel,
          newLevel
        },
        timestamp: new Date()
      });
      
      logger.info(`사용자 ${userId} 레벨업: ${oldLevel} → ${newLevel}`);
      
      // 레벨업 보상 처리 (필요 시)
      if (config.features.levelUpRewards) {
        await processLevelUpRewards(userId, newLevel);
      }
    }
    
    logger.info(`XP 추가: 사용자 ${userId}, 양 ${amount}, 이유: ${reason}`);
    
    // 업데이트된 XP 상태 반환
    return getXPStatus(userId);
  } catch (error) {
    logger.error(`XP 추가 실패: ${error.message}`);
    throw new Error('XP 추가 중 오류가 발생했습니다.');
  }
};

/**
 * 레벨업 보상을 처리합니다.
 * @param {string} userId - 사용자 ID
 * @param {number} level - 달성한 레벨
 * @returns {Promise<void>}
 */
const processLevelUpRewards = async (userId, level) => {
  try {
    // 레벨별 보상 설정
    const rewards = config.features.levelUpRewards[level];
    
    if (!rewards) {
      logger.info(`레벨 ${level}에 대한 보상이 설정되지 않았습니다.`);
      return;
    }
    
    // 토큰 보상
    if (rewards.tokens) {
      const tokenService = require('./tokenService');
      await tokenService.transferTokens(userId, rewards.tokens, `레벨 ${level} 달성 보상`);
    }
    
    // NFT 보상
    if (rewards.nft) {
      const nftService = require('./nftService');
      await nftService.mintNFT(userId, rewards.nft, {
        title: `레벨 ${level} 달성 배지`,
        description: `레벨 ${level}에 도달한 것을 축하합니다!`,
        level
      });
    }
    
    logger.info(`레벨 ${level} 보상 지급 완료: 사용자 ${userId}`);
  } catch (error) {
    logger.error(`레벨업 보상 처리 실패: ${error.message}`);
    throw new Error('레벨업 보상 처리 중 오류가 발생했습니다.');
  }
};

/**
 * 사용자의 XP 활동 내역을 조회합니다.
 * @param {string} userId - 사용자 ID
 * @param {Object} options - 정렬, 페이징 등 옵션 (선택사항)
 * @returns {Promise<Array>} XP 활동 내역
 */
const getXPHistory = async (userId, options = {}) => {
  try {
    const { sort = { timestamp: -1 }, limit = 10, skip = 0 } = options;
    
    // XP 관련 활동 조회
    const xpActivities = await Activity.find({
      userId,
      type: { $in: ['XP_ADDED', 'LEVEL_UP'] }
    })
      .sort(sort)
      .limit(limit)
      .skip(skip);
    
    // 활동 데이터 가공
    const history = xpActivities.map(activity => {
      const { type, details, timestamp } = activity;
      
      if (type === 'XP_ADDED') {
        return {
          id: activity._id,
          type: 'xp_added',
          amount: details.amount,
          reason: details.reason,
          oldXP: details.oldXP,
          newXP: details.newXP,
          timestamp
        };
      } else if (type === 'LEVEL_UP') {
        return {
          id: activity._id,
          type: 'level_up',
          oldLevel: details.oldLevel,
          newLevel: details.newLevel,
          timestamp
        };
      }
    });
    
    return history;
  } catch (error) {
    logger.error(`XP 활동 내역 조회 실패: ${error.message}`);
    throw new Error('XP 활동 내역을 조회하는 중 오류가 발생했습니다.');
  }
};

/**
 * XP 리더보드를 조회합니다.
 * @param {Object} options - 조회 옵션 (선택사항)
 * @returns {Promise<Array>} 리더보드 목록
 */
const getLeaderboard = async (options = {}) => {
  try {
    const { limit = 10, skip = 0 } = options;
    
    // XP 기준으로 정렬된 사용자 목록 조회
    const leaderboard = await User.find({}, 'username nestId xp avatar')
      .sort({ xp: -1 })
      .limit(limit)
      .skip(skip);
    
    // 레벨 정보 추가
    return leaderboard.map((user, index) => {
      const level = calculateLevel(user.xp || 0);
      return {
        rank: skip + index + 1,
        userId: user._id,
        username: user.username,
        nestId: user.nestId,
        avatar: user.avatar,
        xp: user.xp || 0,
        level
      };
    });
  } catch (error) {
    logger.error(`리더보드 조회 실패: ${error.message}`);
    throw new Error('리더보드를 조회하는 중 오류가 발생했습니다.');
  }
};

/**
 * 특정 활동 유형에 대한 XP 보상 금액을 조회합니다.
 * @param {string} activityType - 활동 유형
 * @returns {number} XP 보상 금액
 */
const getXPRewardForActivity = (activityType) => {
  // 활동 유형별 XP 보상 설정
  const xpRewards = {
    daily_check_in: 10,           // 일일 출석
    mission_completion: 20,        // 미션 완료
    comment: 5,                    // 댓글 작성
    first_mission: 50,             // 첫 미션 완료
    profile_completion: 30,        // 프로필 완성
    referral: 100,                 // 친구 초대
    social_share: 15,              // 소셜 공유
    consecutive_login_week: 70,    // 일주일 연속 로그인
    // 추가 활동 유형은 필요에 따라 확장
  };
  
  return xpRewards[activityType] || 0;
};

/**
 * 특정 활동에 대한 XP를 부여합니다.
 * @param {string} userId - 사용자 ID
 * @param {string} activityType - 활동 유형
 * @param {string} detail - 활동 세부 정보 (선택사항)
 * @returns {Promise<Object>} 업데이트된 XP 상태
 */
const awardXPForActivity = async (userId, activityType, detail = '') => {
  try {
    const xpAmount = getXPRewardForActivity(activityType);
    
    if (xpAmount <= 0) {
      logger.warn(`등록되지 않은 활동 유형: ${activityType}`);
      throw new Error('해당 활동에 대한 XP 보상이 설정되지 않았습니다.');
    }
    
    // 일일 한도 체크 (필요 시)
    if (config.features.xpDailyLimit) {
      const isExceeded = await checkDailyXPLimit(userId);
      if (isExceeded) {
        logger.info(`일일 XP 한도 초과: 사용자 ${userId}`);
        throw new Error('오늘의 XP 획득 한도에 도달했습니다.');
      }
    }
    
    // XP 추가
    const reason = `${activityType}${detail ? ': ' + detail : ''}`;
    return await addXP(userId, xpAmount, reason);
  } catch (error) {
    logger.error(`활동 XP 부여 실패: ${error.message}`);
    throw new Error('활동에 대한 XP 부여 중 오류가 발생했습니다.');
  }
};

/**
 * 일일 XP 한도를 체크합니다.
 * @param {string} userId - 사용자 ID
 * @returns {Promise<boolean>} 한도 초과 여부
 */
const checkDailyXPLimit = async (userId) => {
  try {
    // 오늘 날짜 설정
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 오늘 획득한 XP 조회
    const todayXP = await Activity.find({
      userId,
      type: 'XP_ADDED',
      timestamp: { $gte: today }
    });
    
    // 오늘 획득한 총 XP 계산
    let totalTodayXP = 0;
    todayXP.forEach(activity => {
      totalTodayXP += activity.details.amount;
    });
    
    // 일일 한도와 비교
    const dailyLimit = config.features.xpDailyLimit.amount || 500;
    return totalTodayXP >= dailyLimit;
  } catch (error) {
    logger.error(`일일 XP 한도 체크 실패: ${error.message}`);
    throw new Error('일일 XP 한도를 확인하는 중 오류가 발생했습니다.');
  }
};

module.exports = {
  getXPStatus,
  addXP,
  getXPHistory,
  getLeaderboard,
  awardXPForActivity,
  calculateLevel
};
