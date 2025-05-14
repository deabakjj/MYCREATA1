/**
 * 유저 미션 컨트롤러
 * 
 * 유저 생성 미션 관련 API 엔드포인트 처리를 담당하는 컨트롤러입니다.
 * 미션 생성, 조회, 수정, 삭제 및 관련 기능을 위한 컨트롤러 메서드를 포함합니다.
 */

const userMissionService = require('../../../services/userMission/userMissionService');
const { responseHandler } = require('../../../utils/responseHandler');
const { ApiError } = require('../../../utils/errors');
const { validateRequest } = require('../../middlewares/validationMiddleware');
const logger = require('../../../utils/logger');

/**
 * 미션 생성
 * 
 * @route POST /api/user-missions
 * @access 인증 필요
 */
exports.createMission = [
  validateRequest({
    body: {
      title: { type: 'string', required: true, minLength: 2, maxLength: 100 },
      description: { type: 'string', required: true, minLength: 10, maxLength: 5000 },
      category: { type: 'string', required: true },
      submissionType: { type: 'string', required: true, enum: ['텍스트', '이미지', '파일', '링크', '복합'] },
      submissionFields: { type: 'array', required: false },
      difficulty: { type: 'number', required: false, min: 1, max: 5, default: 1 },
      tags: { type: 'array', required: false },
      imageUrl: { type: 'string', required: false },
      duration: { 
        type: 'object', 
        required: false,
        properties: {
          startDate: { type: 'string', format: 'date-time', required: false },
          endDate: { type: 'string', format: 'date-time', required: false }
        }
      },
      maxParticipants: { type: 'number', required: false, min: 0 },
      isPublic: { type: 'boolean', required: false, default: true },
      community: {
        type: 'object',
        required: false,
        properties: {
          commentEnabled: { type: 'boolean', required: false, default: true },
          resultSharing: { type: 'string', required: false, enum: ['모두', '참여자만', '승인됨만', '비공개'], default: '모두' }
        }
      },
      rewards: {
        type: 'object',
        required: false,
        properties: {
          xp: { type: 'number', required: false, min: 0, default: 0 },
          nestToken: {
            type: 'object',
            required: false,
            properties: {
              amount: { type: 'number', required: false, min: 0, default: 0 },
              type: { type: 'string', required: false, enum: ['고정', '예산'], default: '고정' },
              budget: { type: 'number', required: false, min: 0 }
            }
          },
          nft: {
            type: 'object',
            required: false,
            properties: {
              enabled: { type: 'boolean', required: false, default: false },
              collectionId: { type: 'string', required: false },
              metadata: {
                type: 'object',
                required: false,
                properties: {
                  name: { type: 'string', required: false },
                  description: { type: 'string', required: false },
                  imageUrl: { type: 'string', required: false }
                }
              }
            }
          },
          badge: {
            type: 'object',
            required: false,
            properties: {
              enabled: { type: 'boolean', required: false, default: false },
              badgeId: { type: 'string', required: false }
            }
          }
        }
      },
      funding: {
        type: 'object',
        required: false,
        properties: {
          enabled: { type: 'boolean', required: false, default: false },
          targetAmount: { type: 'number', required: false, min: 0 },
          startDate: { type: 'string', format: 'date-time', required: false },
          endDate: { type: 'string', format: 'date-time', required: false }
        }
      },
      approvalType: { type: 'string', required: false, enum: ['자동', '수동', 'DAO', '투표'], default: '수동' },
      approvalThreshold: { type: 'number', required: false, min: 50, max: 100, default: 75 }
    }
  }),
  async (req, res, next) => {
    try {
      const missionData = req.body;
      const userId = req.user.id;

      const mission = await userMissionService.createMission(missionData, userId);

      return responseHandler.success(res, {
        mission,
        message: '미션이 성공적으로 생성되었습니다.'
      }, 201);
    } catch (error) {
      logger.error('미션 생성 중 오류 발생:', error);
      return next(error);
    }
  }
];

/**
 * 미션 상세 조회
 * 
 * @route GET /api/user-missions/:missionId
 * @access 공개 (일부 제한)
 */
exports.getMission = async (req, res, next) => {
  try {
    const { missionId } = req.params;
    const userId = req.user ? req.user.id : null;

    const mission = await userMissionService.getMission(missionId, userId);

    return responseHandler.success(res, { mission });
  } catch (error) {
    logger.error('미션 조회 중 오류 발생:', error);
    return next(error);
  }
};

/**
 * 미션 목록 조회
 * 
 * @route GET /api/user-missions
 * @access 공개
 */
exports.getMissions = [
  validateRequest({
    query: {
      page: { type: 'number', required: false, default: 1 },
      limit: { type: 'number', required: false, default: 20 },
      sort: { type: 'string', required: false, default: '-createdAt' },
      status: { type: 'string', required: false, enum: ['대기', '활성', '종료', '취소', '반려'] },
      isPublic: { type: 'boolean', required: false },
      creator: { type: 'string', required: false },
      category: { type: 'string', required: false },
      tag: { type: 'string', required: false },
      difficulty: { type: 'number', required: false, min: 1, max: 5 },
      active: { type: 'boolean', required: false },
      started: { type: 'boolean', required: false },
      search: { type: 'string', required: false }
    }
  }),
  async (req, res, next) => {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sort: req.query.sort || '-createdAt'
      };

      // 필터 매개변수 수집
      const filter = {};
      const filterFields = ['status', 'isPublic', 'creator', 'category', 'tag', 'difficulty', 'active', 'started', 'search'];
      
      for (const field of filterFields) {
        if (req.query[field] !== undefined) {
          // 불리언 값 처리
          if (field === 'isPublic' || field === 'active' || field === 'started') {
            filter[field] = req.query[field] === 'true';
          } else {
            filter[field] = req.query[field];
          }
        }
      }

      const result = await userMissionService.getMissions(filter, options);

      return responseHandler.success(res, result);
    } catch (error) {
      logger.error('미션 목록 조회 중 오류 발생:', error);
      return next(error);
    }
  }
];

/**
 * 미션 수정
 * 
 * @route PUT /api/user-missions/:missionId
 * @access 인증 필요 (작성자만)
 */
exports.updateMission = [
  validateRequest({
    body: {
      title: { type: 'string', required: false, minLength: 2, maxLength: 100 },
      description: { type: 'string', required: false, minLength: 10, maxLength: 5000 },
      category: { type: 'string', required: false },
      tags: { type: 'array', required: false },
      difficulty: { type: 'number', required: false, min: 1, max: 5 },
      imageUrl: { type: 'string', required: false },
      submissionType: { type: 'string', required: false, enum: ['텍스트', '이미지', '파일', '링크', '복합'] },
      submissionFields: { type: 'array', required: false },
      'duration.endDate': { type: 'string', format: 'date-time', required: false },
      maxParticipants: { type: 'number', required: false, min: 0 },
      isPublic: { type: 'boolean', required: false },
      community: {
        type: 'object',
        required: false,
        properties: {
          commentEnabled: { type: 'boolean', required: false },
          resultSharing: { type: 'string', required: false, enum: ['모두', '참여자만', '승인됨만', '비공개'] }
        }
      },
      rewards: {
        type: 'object',
        required: false,
        properties: {
          xp: { type: 'number', required: false, min: 0 },
          nestToken: {
            type: 'object',
            required: false,
            properties: {
              amount: { type: 'number', required: false, min: 0 },
              type: { type: 'string', required: false, enum: ['고정', '예산'] },
              budget: { type: 'number', required: false, min: 0 }
            }
          },
          nft: {
            type: 'object',
            required: false,
            properties: {
              enabled: { type: 'boolean', required: false },
              collectionId: { type: 'string', required: false },
              metadata: {
                type: 'object',
                required: false,
                properties: {
                  name: { type: 'string', required: false },
                  description: { type: 'string', required: false },
                  imageUrl: { type: 'string', required: false }
                }
              }
            }
          },
          badge: {
            type: 'object',
            required: false,
            properties: {
              enabled: { type: 'boolean', required: false },
              badgeId: { type: 'string', required: false }
            }
          }
        }
      }
    }
  }),
  async (req, res, next) => {
    try {
      const { missionId } = req.params;
      const updateData = req.body;
      const userId = req.user.id;

      const updatedMission = await userMissionService.updateMission(missionId, updateData, userId);

      return responseHandler.success(res, {
        mission: updatedMission,
        message: '미션이 성공적으로 수정되었습니다.'
      });
    } catch (error) {
      logger.error('미션 수정 중 오류 발생:', error);
      return next(error);
    }
  }
];

/**
 * 미션 상태 변경
 * 
 * @route PATCH /api/user-missions/:missionId/status
 * @access 인증 필요 (작성자 또는 관리자)
 */
exports.changeMissionStatus = [
  validateRequest({
    body: {
      status: { type: 'string', required: true, enum: ['활성', '종료', '취소', '반려'] },
      reason: { type: 'string', required: false }
    }
  }),
  async (req, res, next) => {
    try {
      const { missionId } = req.params;
      const { status, reason } = req.body;
      const userId = req.user.id;

      const updatedMission = await userMissionService.changeMissionStatus(
        missionId,
        status,
        userId,
        reason
      );

      return responseHandler.success(res, {
        mission: updatedMission,
        message: `미션 상태가 "${status}"(으)로 성공적으로 변경되었습니다.`
      });
    } catch (error) {
      logger.error('미션 상태 변경 중 오류 발생:', error);
      return next(error);
    }
  }
];

/**
 * 미션 펀딩 추가
 * 
 * @route POST /api/user-missions/:missionId/funding
 * @access 인증 필요
 */
exports.addFunding = [
  validateRequest({
    body: {
      amount: { type: 'number', required: true, min: 0.1 }
    }
  }),
  async (req, res, next) => {
    try {
      const { missionId } = req.params;
      const { amount } = req.body;
      const userId = req.user.id;

      const updatedMission = await userMissionService.addFunding(missionId, userId, amount);

      return responseHandler.success(res, {
        mission: updatedMission,
        message: `${amount} NEST 토큰이 성공적으로 펀딩되었습니다.`
      });
    } catch (error) {
      logger.error('미션 펀딩 추가 중 오류 발생:', error);
      return next(error);
    }
  }
];

/**
 * 인기 미션 목록 조회
 * 
 * @route GET /api/user-missions/popular
 * @access 공개
 */
exports.getPopularMissions = [
  validateRequest({
    query: {
      limit: { type: 'number', required: false, default: 10, min: 1, max: 50 }
    }
  }),
  async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const missions = await userMissionService.getPopularMissions(limit);

      return responseHandler.success(res, { missions });
    } catch (error) {
      logger.error('인기 미션 목록 조회 중 오류 발생:', error);
      return next(error);
    }
  }
];

/**
 * 최신 미션 목록 조회
 * 
 * @route GET /api/user-missions/recent
 * @access 공개
 */
exports.getRecentMissions = [
  validateRequest({
    query: {
      limit: { type: 'number', required: false, default: 10, min: 1, max: 50 }
    }
  }),
  async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const missions = await userMissionService.getRecentMissions(limit);

      return responseHandler.success(res, { missions });
    } catch (error) {
      logger.error('최신 미션 목록 조회 중 오류 발생:', error);
      return next(error);
    }
  }
];

/**
 * 추천 미션 목록 조회
 * 
 * @route GET /api/user-missions/recommended
 * @access 인증 필요
 */
exports.getRecommendedMissions = [
  validateRequest({
    query: {
      limit: { type: 'number', required: false, default: 10, min: 1, max: 50 }
    }
  }),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 10;
      
      const missions = await userMissionService.getRecommendedMissions(userId, limit);

      return responseHandler.success(res, { missions });
    } catch (error) {
      logger.error('추천 미션 목록 조회 중 오류 발생:', error);
      return next(error);
    }
  }
];

/**
 * 미션 삭제 (관리자 전용)
 * 
 * @route DELETE /api/user-missions/:missionId
 * @access 인증 필요 (관리자만)
 */
exports.deleteMission = async (req, res, next) => {
  try {
    const { missionId } = req.params;
    const userId = req.user.id;

    const result = await userMissionService.deleteMission(missionId, userId);

    return responseHandler.success(res, {
      message: '미션이 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    logger.error('미션 삭제 중 오류 발생:', error);
    return next(error);
  }
};

/**
 * 내가 생성한 미션 목록 조회
 * 
 * @route GET /api/user-missions/my-created
 * @access 인증 필요
 */
exports.getMyCreatedMissions = [
  validateRequest({
    query: {
      page: { type: 'number', required: false, default: 1 },
      limit: { type: 'number', required: false, default: 20 },
      sort: { type: 'string', required: false, default: '-createdAt' },
      status: { type: 'string', required: false, enum: ['대기', '활성', '종료', '취소', '반려'] },
      search: { type: 'string', required: false }
    }
  }),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sort: req.query.sort || '-createdAt'
      };

      // 필터 설정
      const filter = {
        creator: userId
      };

      if (req.query.status) {
        filter.status = req.query.status;
      }

      if (req.query.search) {
        filter.search = req.query.search;
      }

      const result = await userMissionService.getMissions(filter, options);

      return responseHandler.success(res, result);
    } catch (error) {
      logger.error('내가 생성한 미션 목록 조회 중 오류 발생:', error);
      return next(error);
    }
  }
];

/**
 * 내가 참여한 미션 목록 조회
 * 
 * @route GET /api/user-missions/my-participated
 * @access 인증 필요
 */
exports.getMyParticipatedMissions = [
  validateRequest({
    query: {
      page: { type: 'number', required: false, default: 1 },
      limit: { type: 'number', required: false, default: 20 },
      sort: { type: 'string', required: false, default: '-participatedAt' },
      status: { type: 'string', required: false, enum: ['활성', '종료'] },
      submissionStatus: { type: 'string', required: false, enum: ['대기', '승인', '반려'] },
      search: { type: 'string', required: false }
    }
  }),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sort: req.query.sort || '-participatedAt'
      };

      // 필터 설정
      const filter = {
        submissionStatus: req.query.submissionStatus,
        status: req.query.status,
        search: req.query.search
      };

      // null 또는 undefined 값 제거
      Object.keys(filter).forEach(key => 
        (filter[key] === undefined || filter[key] === null) && delete filter[key]
      );

      const result = await userMissionService.getParticipatedMissions(userId, filter, options);

      return responseHandler.success(res, result);
    } catch (error) {
      logger.error('내가 참여한 미션 목록 조회 중 오류 발생:', error);
      return next(error);
    }
  }
];

/**
 * 미션 통계 조회
 * 
 * @route GET /api/user-missions/stats
 * @access 인증 필요 (관리자)
 */
exports.getMissionStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // 관리자 권한 확인은 서비스에서 처리
    const stats = await userMissionService.getMissionStats(userId);

    return responseHandler.success(res, { stats });
  } catch (error) {
    logger.error('미션 통계 조회 중 오류 발생:', error);
    return next(error);
  }
};

/**
 * 미션 카테고리 목록 조회
 * 
 * @route GET /api/user-missions/categories
 * @access 공개
 */
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await userMissionService.getCategories();
    
    return responseHandler.success(res, { categories });
  } catch (error) {
    logger.error('미션 카테고리 목록 조회 중 오류 발생:', error);
    return next(error);
  }
};

/**
 * 인기 태그 목록 조회
 * 
 * @route GET /api/user-missions/tags/popular
 * @access 공개
 */
exports.getPopularTags = [
  validateRequest({
    query: {
      limit: { type: 'number', required: false, default: 20, min: 1, max: 100 }
    }
  }),
  async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const tags = await userMissionService.getPopularTags(limit);
      
      return responseHandler.success(res, { tags });
    } catch (error) {
      logger.error('인기 태그 목록 조회 중 오류 발생:', error);
      return next(error);
    }
  }
];
