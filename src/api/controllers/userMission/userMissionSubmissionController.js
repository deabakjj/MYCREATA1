/**
 * 유저 미션 제출물 컨트롤러
 * 
 * 유저 생성 미션 제출물 관련 API 엔드포인트 처리를 담당하는 컨트롤러입니다.
 * 제출물 생성, 조회, 수정, 삭제 및 평가 처리를 위한 컨트롤러 메서드를 포함합니다.
 */

const userMissionSubmissionService = require('../../../services/userMission/userMissionSubmissionService');
const { responseHandler } = require('../../../utils/responseHandler');
const { ApiError } = require('../../../utils/errors');
const { validateRequest } = require('../../middlewares/validationMiddleware');
const logger = require('../../../utils/logger');

/**
 * 미션 제출물 생성
 * 
 * @route POST /api/user-missions/:missionId/submissions
 * @access 인증 필요
 */
exports.createSubmission = [
  validateRequest({
    body: {
      fields: { 
        type: 'array', 
        required: true,
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', required: true },
            type: { type: 'string', required: true, enum: ['텍스트', '장문텍스트', '이미지', '파일', '링크', '체크박스', '날짜'] },
            textValue: { type: 'string', required: false },
            imageUrl: { type: 'string', required: false },
            file: { 
              type: 'object', 
              required: false,
              properties: {
                url: { type: 'string', required: true },
                name: { type: 'string', required: true },
                size: { type: 'number', required: false },
                type: { type: 'string', required: false }
              }
            },
            linkUrl: { type: 'string', required: false },
            checkboxValue: { type: 'boolean', required: false },
            dateValue: { type: 'string', required: false }
          }
        }
      },
      isPublic: { type: 'boolean', required: false, default: true }
    }
  }),
  async (req, res, next) => {
    try {
      const { missionId } = req.params;
      const submissionData = req.body;
      const userId = req.user.id;

      const submission = await userMissionSubmissionService.createSubmission(
        missionId, 
        submissionData, 
        userId
      );

      return responseHandler.success(res, {
        submission,
        message: '제출물이 성공적으로 제출되었습니다.'
      }, 201);
    } catch (error) {
      logger.error('제출물 생성 중 오류 발생:', error);
      return next(error);
    }
  }
];

/**
 * 제출물 상세 조회
 * 
 * @route GET /api/user-missions/submissions/:submissionId
 * @access 공개 (미션 설정에 따라 제한)
 */
exports.getSubmission = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user ? req.user.id : null;

    const submission = await userMissionSubmissionService.getSubmission(submissionId, userId);

    return responseHandler.success(res, { submission });
  } catch (error) {
    logger.error('제출물 조회 중 오류 발생:', error);
    return next(error);
  }
};

/**
 * 미션별 제출물 목록 조회
 * 
 * @route GET /api/user-missions/:missionId/submissions
 * @access 공개 (미션 설정에 따라 제한)
 */
exports.getSubmissionsByMission = [
  validateRequest({
    query: {
      page: { type: 'number', required: false, default: 1 },
      limit: { type: 'number', required: false, default: 20 },
      sort: { type: 'string', required: false, default: '-createdAt' },
      status: { type: 'string', required: false, enum: ['대기', '승인', '반려'] },
      submitter: { type: 'string', required: false },
      search: { type: 'string', required: false }
    }
  }),
  async (req, res, next) => {
    try {
      const { missionId } = req.params;
      const userId = req.user ? req.user.id : null;
      
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sort: req.query.sort || '-createdAt'
      };

      // 필터 설정
      const filter = {};
      
      if (req.query.status) {
        filter.status = req.query.status;
      }
      
      if (req.query.submitter) {
        filter.submitter = req.query.submitter;
      }
      
      if (req.query.search) {
        filter.search = req.query.search;
      }

      const result = await userMissionSubmissionService.getSubmissionsByMission(
        missionId, 
        filter, 
        options, 
        userId
      );

      return responseHandler.success(res, result);
    } catch (error) {
      logger.error('미션별 제출물 목록 조회 중 오류 발생:', error);
      return next(error);
    }
  }
];

/**
 * 사용자별 제출물 목록 조회
 * 
 * @route GET /api/user-missions/users/:userId/submissions
 * @access 공개 (미션 설정에 따라 제한)
 */
exports.getSubmissionsByUser = [
  validateRequest({
    query: {
      page: { type: 'number', required: false, default: 1 },
      limit: { type: 'number', required: false, default: 20 },
      sort: { type: 'string', required: false, default: '-createdAt' },
      status: { type: 'string', required: false, enum: ['대기', '승인', '반려'] },
      isPublic: { type: 'boolean', required: false },
      search: { type: 'string', required: false }
    }
  }),
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sort: req.query.sort || '-createdAt'
      };

      // 필터 설정
      const filter = {};
      
      if (req.query.status) {
        filter.status = req.query.status;
      }
      
      if (req.query.isPublic !== undefined) {
        filter.isPublic = req.query.isPublic === 'true';
      }
      
      if (req.query.search) {
        filter.search = req.query.search;
      }

      const result = await userMissionSubmissionService.getSubmissionsByUser(
        userId, 
        filter, 
        options
      );

      return responseHandler.success(res, result);
    } catch (error) {
      logger.error('사용자별 제출물 목록 조회 중 오류 발생:', error);
      return next(error);
    }
  }
];

/**
 * 제출물 평가 (승인/반려)
 * 
 * @route PATCH /api/user-missions/submissions/:submissionId/evaluate
 * @access 인증 필요 (미션 작성자 또는 관리자)
 */
exports.evaluateSubmission = [
  validateRequest({
    body: {
      status: { type: 'string', required: true, enum: ['승인', '반려'] },
      score: { type: 'number', required: false, min: 0, max: 100 },
      comment: { type: 'string', required: false },
      reason: { type: 'string', required: false }
    }
  }),
  async (req, res, next) => {
    try {
      const { submissionId } = req.params;
      const evaluationData = req.body;
      const userId = req.user.id;

      const submission = await userMissionSubmissionService.evaluateSubmission(
        submissionId, 
        evaluationData, 
        userId
      );

      const message = evaluationData.status === '승인' 
        ? '제출물이 성공적으로 승인되었습니다.' 
        : '제출물이 반려되었습니다.';

      return responseHandler.success(res, {
        submission,
        message
      });
    } catch (error) {
      logger.error('제출물 평가 중 오류 발생:', error);
      return next(error);
    }
  }
];

/**
 * DAO 투표
 * 
 * @route POST /api/user-missions/submissions/:submissionId/vote
 * @access 인증 필요
 */
exports.voteSubmission = [
  validateRequest({
    body: {
      approved: { type: 'boolean', required: true },
      comment: { type: 'string', required: false }
    }
  }),
  async (req, res, next) => {
    try {
      const { submissionId } = req.params;
      const voteData = req.body;
      const userId = req.user.id;

      const submission = await userMissionSubmissionService.voteSubmission(
        submissionId, 
        voteData, 
        userId
      );

      return responseHandler.success(res, {
        submission,
        message: '투표가 성공적으로 처리되었습니다.'
      });
    } catch (error) {
      logger.error('제출물 투표 중 오류 발생:', error);
      return next(error);
    }
  }
];

/**
 * 제출물 업데이트 (본인만 가능)
 * 
 * @route PUT /api/user-missions/submissions/:submissionId
 * @access 인증 필요 (작성자만)
 */
exports.updateSubmission = [
  validateRequest({
    body: {
      content: { 
        type: 'object', 
        required: false,
        properties: {
          fields: { 
            type: 'array', 
            required: true,
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', required: true },
                type: { type: 'string', required: true, enum: ['텍스트', '장문텍스트', '이미지', '파일', '링크', '체크박스', '날짜'] },
                textValue: { type: 'string', required: false },
                imageUrl: { type: 'string', required: false },
                file: { 
                  type: 'object', 
                  required: false,
                  properties: {
                    url: { type: 'string', required: true },
                    name: { type: 'string', required: true },
                    size: { type: 'number', required: false },
                    type: { type: 'string', required: false }
                  }
                },
                linkUrl: { type: 'string', required: false },
                checkboxValue: { type: 'boolean', required: false },
                dateValue: { type: 'string', required: false }
              }
            }
          }
        }
      },
      isPublic: { type: 'boolean', required: false }
    }
  }),
  async (req, res, next) => {
    try {
      const { submissionId } = req.params;
      const updateData = req.body;
      const userId = req.user.id;

      const submission = await userMissionSubmissionService.updateSubmission(
        submissionId, 
        updateData, 
        userId
      );

      return responseHandler.success(res, {
        submission,
        message: '제출물이 성공적으로 수정되었습니다.'
      });
    } catch (error) {
      logger.error('제출물 업데이트 중 오류 발생:', error);
      return next(error);
    }
  }
];

/**
 * 제출물 삭제 (본인 또는 관리자만 가능)
 * 
 * @route DELETE /api/user-missions/submissions/:submissionId
 * @access 인증 필요 (작성자 또는 관리자)
 */
exports.deleteSubmission = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user.id;

    const result = await userMissionSubmissionService.deleteSubmission(submissionId, userId);

    if (!result.success) {
      throw new ApiError(500, '제출물 삭제 중 오류가 발생했습니다.');
    }

    return responseHandler.success(res, {
      message: '제출물이 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    logger.error('제출물 삭제 중 오류 발생:', error);
    return next(error);
  }
};

/**
 * 내 제출물 목록 조회
 * 
 * @route GET /api/user-missions/my-submissions
 * @access 인증 필요
 */
exports.getMySubmissions = [
  validateRequest({
    query: {
      page: { type: 'number', required: false, default: 1 },
      limit: { type: 'number', required: false, default: 20 },
      sort: { type: 'string', required: false, default: '-createdAt' },
      status: { type: 'string', required: false, enum: ['대기', '승인', '반려'] },
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
      const filter = {};
      
      if (req.query.status) {
        filter.status = req.query.status;
      }
      
      if (req.query.search) {
        filter.search = req.query.search;
      }

      const result = await userMissionSubmissionService.getSubmissionsByUser(
        userId, 
        filter, 
        options
      );

      return responseHandler.success(res, result);
    } catch (error) {
      logger.error('내 제출물 목록 조회 중 오류 발생:', error);
      return next(error);
    }
  }
];
