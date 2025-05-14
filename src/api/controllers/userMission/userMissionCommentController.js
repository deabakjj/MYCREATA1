/**
 * 유저 미션 댓글 컨트롤러
 * 
 * 유저 생성 미션 댓글 관련 API 엔드포인트 처리를 담당하는 컨트롤러입니다.
 * 댓글 생성, 조회, 수정, 삭제 및 좋아요 처리를 위한 컨트롤러 메서드를 포함합니다.
 */

const userMissionCommentService = require('../../../services/userMission/userMissionCommentService');
const { responseHandler } = require('../../../utils/responseHandler');
const { ApiError } = require('../../../utils/errors');
const { validateRequest } = require('../../middlewares/validationMiddleware');
const logger = require('../../../utils/logger');

/**
 * 미션 댓글 생성
 * 
 * @route POST /api/user-missions/:missionId/comments
 * @access 인증 필요
 */
exports.createComment = [
  validateRequest({
    body: {
      content: { type: 'string', required: true, minLength: 1, maxLength: 1000 },
      parentId: { type: 'string', required: false }
    }
  }),
  async (req, res, next) => {
    try {
      const { missionId } = req.params;
      const { content, parentId } = req.body;
      const userId = req.user.id;

      const comment = await userMissionCommentService.createComment(
        userId, 
        missionId, 
        content, 
        parentId
      );

      return responseHandler.success(res, {
        comment,
        message: '댓글이 성공적으로 작성되었습니다.'
      });
    } catch (error) {
      logger.error('댓글 생성 중 오류 발생:', error);
      return next(error);
    }
  }
];

/**
 * 미션 댓글 목록 조회
 * 
 * @route GET /api/user-missions/:missionId/comments
 * @access 공개
 */
exports.getCommentsByMission = [
  validateRequest({
    query: {
      page: { type: 'number', required: false, default: 1 },
      limit: { type: 'number', required: false, default: 20 },
      sortBy: { type: 'string', required: false, default: 'createdAt' },
      sortOrder: { type: 'string', required: false, default: 'desc', enum: ['asc', 'desc'] },
      includeReplies: { type: 'boolean', required: false, default: true }
    }
  }),
  async (req, res, next) => {
    try {
      const { missionId } = req.params;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc',
        includeReplies: req.query.includeReplies !== 'false'
      };

      const result = await userMissionCommentService.getCommentsByMissionId(missionId, options);

      return responseHandler.success(res, result);
    } catch (error) {
      logger.error('미션 댓글 목록 조회 중 오류 발생:', error);
      return next(error);
    }
  }
];

/**
 * 댓글 상세 조회
 * 
 * @route GET /api/user-missions/comments/:commentId
 * @access 공개
 */
exports.getComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const comment = await userMissionCommentService.getCommentById(commentId);

    return responseHandler.success(res, { comment });
  } catch (error) {
    logger.error('댓글 상세 조회 중 오류 발생:', error);
    return next(error);
  }
};

/**
 * 댓글 수정
 * 
 * @route PUT /api/user-missions/comments/:commentId
 * @access 인증 필요 (작성자만)
 */
exports.updateComment = [
  validateRequest({
    body: {
      content: { type: 'string', required: true, minLength: 1, maxLength: 1000 }
    }
  }),
  async (req, res, next) => {
    try {
      const { commentId } = req.params;
      const { content } = req.body;
      const userId = req.user.id;

      const updatedComment = await userMissionCommentService.updateComment(
        commentId, 
        userId, 
        content
      );

      return responseHandler.success(res, {
        comment: updatedComment,
        message: '댓글이 성공적으로 수정되었습니다.'
      });
    } catch (error) {
      logger.error('댓글 수정 중 오류 발생:', error);
      return next(error);
    }
  }
];

/**
 * 댓글 삭제
 * 
 * @route DELETE /api/user-missions/comments/:commentId
 * @access 인증 필요 (작성자 또는 관리자)
 */
exports.deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const result = await userMissionCommentService.deleteComment(commentId, userId);

    if (!result) {
      throw new ApiError(500, '댓글 삭제 중 오류가 발생했습니다.');
    }

    return responseHandler.success(res, {
      message: '댓글이 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    logger.error('댓글 삭제 중 오류 발생:', error);
    return next(error);
  }
};

/**
 * 댓글 좋아요 토글
 * 
 * @route POST /api/user-missions/comments/:commentId/like
 * @access 인증 필요
 */
exports.toggleLike = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const result = await userMissionCommentService.toggleLike(commentId, userId);

    return responseHandler.success(res, {
      ...result,
      message: result.liked ? '댓글을 좋아합니다.' : '댓글 좋아요를 취소했습니다.'
    });
  } catch (error) {
    logger.error('댓글 좋아요 토글 중 오류 발생:', error);
    return next(error);
  }
};

/**
 * 사용자 댓글 통계 조회
 * 
 * @route GET /api/user-missions/users/:userId/comment-stats
 * @access 공개
 */
exports.getUserCommentStats = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const stats = await userMissionCommentService.getUserCommentStats(userId);

    return responseHandler.success(res, { stats });
  } catch (error) {
    logger.error('사용자 댓글 통계 조회 중 오류 발생:', error);
    return next(error);
  }
};

/**
 * 미션 댓글 전체 삭제 (관리자 전용)
 * 
 * @route DELETE /api/user-missions/:missionId/comments
 * @access 인증 필요 (관리자만)
 */
exports.deleteAllMissionComments = async (req, res, next) => {
  try {
    const { missionId } = req.params;
    const adminId = req.user.id;

    // 관리자 권한 확인은 서비스에서 처리
    const deletedCount = await userMissionCommentService.deleteAllMissionComments(missionId, adminId);

    return responseHandler.success(res, {
      deletedCount,
      message: `총 ${deletedCount}개의 댓글이 삭제되었습니다.`
    });
  } catch (error) {
    logger.error('미션 댓글 전체 삭제 중 오류 발생:', error);
    return next(error);
  }
};
