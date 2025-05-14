/**
 * UserMissionCommentService
 * 
 * 사용자 미션 댓글 관련 비즈니스 로직을 처리하는 서비스
 * - 미션 댓글 생성, 조회, 수정, 삭제 기능
 * - 댓글 기반 XP 지급 및 NFT 보상 연동
 * - 댓글 알림 및 상호작용 처리
 */

const mongoose = require('mongoose');
const UserMissionComment = require('../../models/userMissionComment');
const UserMission = require('../../models/userMission');
const User = require('../../models/user');
const xpService = require('../xpService');
const nftService = require('../nftService');
const tokenService = require('../tokenService');
const { NotFoundError, ValidationError, UnauthorizedError } = require('../../utils/errors');
const logger = require('../../utils/logger');

/**
 * 미션 댓글 생성
 * @param {string} userId - 댓글 작성자 ID
 * @param {string} missionId - 미션 ID
 * @param {string} content - 댓글 내용
 * @param {string} [parentId] - 부모 댓글 ID (대댓글인 경우)
 * @returns {Promise<Object>} - 생성된 댓글 객체
 */
async function createComment(userId, missionId, content, parentId = null) {
  try {
    // 입력값 검증
    if (!userId || !missionId || !content) {
      throw new ValidationError('필수 입력값이 누락되었습니다.');
    }

    // 미션 존재 여부 확인
    const mission = await UserMission.findById(missionId);
    if (!mission) {
      throw new NotFoundError('해당 미션을 찾을 수 없습니다.');
    }

    // 부모 댓글 존재 여부 확인 (대댓글인 경우)
    if (parentId) {
      const parentComment = await UserMissionComment.findById(parentId);
      if (!parentComment) {
        throw new NotFoundError('부모 댓글을 찾을 수 없습니다.');
      }
      
      // 대댓글의 대댓글 방지 (1단계만 허용)
      if (parentComment.parentId) {
        throw new ValidationError('대댓글에는 답글을 달 수 없습니다.');
      }
    }

    // 댓글 생성
    const comment = new UserMissionComment({
      user: userId,
      mission: missionId,
      content,
      parentId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await comment.save();

    // 댓글 작성에 대한 XP 보상 지급
    const xpAmount = parentId ? 5 : 10; // 대댓글은 5 XP, 일반 댓글은 10 XP
    await xpService.awardXp(userId, xpAmount, 'COMMENT', `미션 댓글 작성 - ${mission.title}`);

    // 댓글 알림 처리 (미션 작성자에게)
    if (mission.user.toString() !== userId) {
      // 알림 처리 로직 (별도 알림 서비스 연동 필요)
    }

    // 일정 조건 만족 시 NFT 보상 처리
    await checkAndProcessNftReward(userId);

    return comment;
  } catch (error) {
    logger.error(`댓글 생성 중 오류 발생: ${error.message}`, { userId, missionId });
    throw error;
  }
}

/**
 * 미션 댓글 조회
 * @param {string} missionId - 미션 ID
 * @param {Object} options - 조회 옵션 (페이지네이션, 정렬 등)
 * @returns {Promise<Object>} - 댓글 목록 및 메타데이터
 */
async function getCommentsByMissionId(missionId, options = {}) {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeReplies = true
    } = options;

    const skip = (page - 1) * limit;
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // 주 댓글만 조회하는 쿼리 (parentId가 없는 경우)
    const query = { mission: missionId, parentId: null };
    
    // 댓글 수 카운트
    const totalComments = await UserMissionComment.countDocuments(query);
    
    // 댓글 조회
    let comments = await UserMissionComment.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('user', 'username profileImage nestId')
      .lean();

    // 대댓글 포함 여부에 따라 처리
    if (includeReplies) {
      // 조회된 주 댓글의 ID 목록
      const commentIds = comments.map(comment => comment._id);
      
      // 대댓글 조회
      const replies = await UserMissionComment.find({
        mission: missionId,
        parentId: { $in: commentIds }
      })
        .populate('user', 'username profileImage nestId')
        .lean();

      // 대댓글을 주 댓글에 매핑
      const repliesByParentId = replies.reduce((acc, reply) => {
        const parentId = reply.parentId.toString();
        acc[parentId] = acc[parentId] || [];
        acc[parentId].push(reply);
        return acc;
      }, {});

      // 각 주 댓글에 대댓글 추가
      comments = comments.map(comment => {
        const commentId = comment._id.toString();
        return {
          ...comment,
          replies: repliesByParentId[commentId] || []
        };
      });
    }

    return {
      comments,
      pagination: {
        total: totalComments,
        page,
        limit,
        pages: Math.ceil(totalComments / limit)
      }
    };
  } catch (error) {
    logger.error(`미션 댓글 조회 중 오류 발생: ${error.message}`, { missionId });
    throw error;
  }
}

/**
 * 댓글 상세 조회
 * @param {string} commentId - 댓글 ID
 * @returns {Promise<Object>} - 댓글 객체
 */
async function getCommentById(commentId) {
  try {
    const comment = await UserMissionComment.findById(commentId)
      .populate('user', 'username profileImage nestId')
      .lean();

    if (!comment) {
      throw new NotFoundError('댓글을 찾을 수 없습니다.');
    }

    // 대댓글인 경우 부모 댓글 정보 포함
    if (comment.parentId) {
      const parentComment = await UserMissionComment.findById(comment.parentId)
        .populate('user', 'username profileImage nestId')
        .lean();
      
      if (parentComment) {
        comment.parentComment = parentComment;
      }
    }
    // 주 댓글인 경우 대댓글 목록 포함
    else {
      const replies = await UserMissionComment.find({ parentId: commentId })
        .populate('user', 'username profileImage nestId')
        .sort({ createdAt: 1 })
        .lean();
      
      comment.replies = replies;
    }

    return comment;
  } catch (error) {
    logger.error(`댓글 상세 조회 중 오류 발생: ${error.message}`, { commentId });
    throw error;
  }
}

/**
 * 댓글 수정
 * @param {string} commentId - 댓글 ID
 * @param {string} userId - 요청 사용자 ID
 * @param {string} content - 수정할 내용
 * @returns {Promise<Object>} - 수정된 댓글 객체
 */
async function updateComment(commentId, userId, content) {
  try {
    // 입력값 검증
    if (!commentId || !userId || !content) {
      throw new ValidationError('필수 입력값이 누락되었습니다.');
    }

    // 댓글 조회
    const comment = await UserMissionComment.findById(commentId);
    if (!comment) {
      throw new NotFoundError('댓글을 찾을 수 없습니다.');
    }

    // 수정 권한 확인
    if (comment.user.toString() !== userId) {
      throw new UnauthorizedError('댓글 수정 권한이 없습니다.');
    }

    // 댓글 수정
    comment.content = content;
    comment.updatedAt = new Date();
    comment.isEdited = true;

    await comment.save();

    return comment;
  } catch (error) {
    logger.error(`댓글 수정 중 오류 발생: ${error.message}`, { commentId, userId });
    throw error;
  }
}

/**
 * 댓글 삭제
 * @param {string} commentId - 댓글 ID
 * @param {string} userId - 요청 사용자 ID
 * @returns {Promise<boolean>} - 삭제 성공 여부
 */
async function deleteComment(commentId, userId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 댓글 조회
    const comment = await UserMissionComment.findById(commentId).session(session);
    if (!comment) {
      throw new NotFoundError('댓글을 찾을 수 없습니다.');
    }

    // 삭제 권한 확인 (작성자 또는 관리자)
    const user = await User.findById(userId).session(session);
    if (comment.user.toString() !== userId && !user.isAdmin) {
      throw new UnauthorizedError('댓글 삭제 권한이 없습니다.');
    }

    // 주 댓글인 경우 대댓글 함께 삭제
    if (!comment.parentId) {
      await UserMissionComment.deleteMany({ parentId: commentId }).session(session);
    }

    // 댓글 삭제
    await UserMissionComment.findByIdAndDelete(commentId).session(session);

    // 삭제에 따른 XP 감소 (선택적)
    // await xpService.reduceXp(comment.user, 5, 'COMMENT_DELETED', '댓글 삭제');

    await session.commitTransaction();
    return true;
  } catch (error) {
    await session.abortTransaction();
    logger.error(`댓글 삭제 중 오류 발생: ${error.message}`, { commentId, userId });
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * 댓글 좋아요 토글
 * @param {string} commentId - 댓글 ID
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} - 좋아요 정보
 */
async function toggleLike(commentId, userId) {
  try {
    // 댓글 조회
    const comment = await UserMissionComment.findById(commentId);
    if (!comment) {
      throw new NotFoundError('댓글을 찾을 수 없습니다.');
    }

    // 좋아요 목록에서 사용자 ID 확인
    const userIndex = comment.likes.indexOf(userId);
    
    // 이미 좋아요를 누른 경우 제거, 아니면 추가
    if (userIndex !== -1) {
      comment.likes.splice(userIndex, 1);
    } else {
      comment.likes.push(userId);
      
      // 댓글 작성자가 자신의 댓글이 아닌 경우에만 XP 보상
      if (comment.user.toString() !== userId) {
        // 댓글 작성자에게 보상
        await xpService.awardXp(
          comment.user,
          2,
          'COMMENT_LIKED',
          '댓글 좋아요 받음'
        );
      }
    }

    await comment.save();

    return {
      liked: userIndex === -1,
      likeCount: comment.likes.length
    };
  } catch (error) {
    logger.error(`댓글 좋아요 토글 중 오류 발생: ${error.message}`, { commentId, userId });
    throw error;
  }
}

/**
 * 사용자의 댓글 활동 통계 조회
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} - 댓글 활동 통계
 */
async function getUserCommentStats(userId) {
  try {
    // 사용자가 작성한 총 댓글 수
    const totalComments = await UserMissionComment.countDocuments({ user: userId });
    
    // 사용자가 작성한 주 댓글 수
    const mainComments = await UserMissionComment.countDocuments({ 
      user: userId,
      parentId: null
    });
    
    // 사용자가 작성한 대댓글 수
    const replies = await UserMissionComment.countDocuments({ 
      user: userId,
      parentId: { $ne: null }
    });
    
    // 사용자가 받은 총 좋아요 수
    const pipeline = [
      { $match: { user: mongoose.Types.ObjectId(userId) } },
      { $project: { likeCount: { $size: "$likes" } } },
      { $group: { _id: null, totalLikes: { $sum: "$likeCount" } } }
    ];
    
    const likeResults = await UserMissionComment.aggregate(pipeline);
    const totalLikes = likeResults.length > 0 ? likeResults[0].totalLikes : 0;
    
    // 가장 많은 좋아요를 받은 댓글
    const topComments = await UserMissionComment.find({ user: userId })
      .sort({ "likes.length": -1 })
      .limit(3)
      .populate('mission', 'title')
      .lean();
    
    return {
      totalComments,
      mainComments,
      replies,
      totalLikes,
      topComments: topComments.map(comment => ({
        id: comment._id,
        content: comment.content,
        missionTitle: comment.mission?.title || '삭제된 미션',
        likeCount: comment.likes.length,
        createdAt: comment.createdAt
      }))
    };
  } catch (error) {
    logger.error(`사용자 댓글 통계 조회 중 오류 발생: ${error.message}`, { userId });
    throw error;
  }
}

/**
 * 사용자의 댓글 활동 기반 NFT 보상 처리
 * @param {string} userId - 사용자 ID
 * @returns {Promise<boolean>} - NFT 발행 여부
 */
async function checkAndProcessNftReward(userId) {
  try {
    // 사용자 댓글 통계 조회
    const stats = await getUserCommentStats(userId);
    
    // NFT 발행 조건 체크 (예: 총 50개 이상 댓글 작성 시)
    if (stats.totalComments >= 50 && !await hasCommentMilestoneNft(userId, 50)) {
      // NFT 메타데이터 생성
      const metadata = {
        name: "소통의 달인",
        description: "50개 이상의 댓글을 작성한 활발한 커뮤니티 기여자입니다.",
        image: "ipfs://QmXyz...", // IPFS 이미지 링크 (예시)
        attributes: [
          { trait_type: "카테고리", value: "커뮤니티" },
          { trait_type: "등급", value: "실버" },
          { trait_type: "댓글 수", value: stats.totalComments }
        ]
      };
      
      // NFT 발행
      await nftService.mintNft(
        userId,
        "COMMENT_MILESTONE_50",
        metadata,
        "댓글 50개 작성 기념 NFT"
      );
      
      // 토큰 보상 (옵션)
      await tokenService.awardTokens(userId, 50, "COMMENT_MILESTONE", "댓글 50개 작성 보상");
      
      return true;
    }
    
    // 100개 이상 댓글 작성 시 추가 NFT
    if (stats.totalComments >= 100 && !await hasCommentMilestoneNft(userId, 100)) {
      const metadata = {
        name: "소통의 장인",
        description: "100개 이상의 댓글을 작성한 뛰어난 커뮤니티 기여자입니다.",
        image: "ipfs://QmAbc...", // IPFS 이미지 링크 (예시)
        attributes: [
          { trait_type: "카테고리", value: "커뮤니티" },
          { trait_type: "등급", value: "골드" },
          { trait_type: "댓글 수", value: stats.totalComments }
        ]
      };
      
      // NFT 발행
      await nftService.mintNft(
        userId,
        "COMMENT_MILESTONE_100",
        metadata,
        "댓글 100개 작성 기념 NFT"
      );
      
      // 토큰 보상 (옵션)
      await tokenService.awardTokens(userId, 100, "COMMENT_MILESTONE", "댓글 100개 작성 보상");
      
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error(`댓글 NFT 보상 처리 중 오류 발생: ${error.message}`, { userId });
    return false;
  }
}

/**
 * 사용자가 특정 댓글 마일스톤 NFT를 보유하고 있는지 확인
 * @param {string} userId - 사용자 ID
 * @param {number} milestone - 마일스톤 수 (50, 100 등)
 * @returns {Promise<boolean>} - NFT 보유 여부
 */
async function hasCommentMilestoneNft(userId, milestone) {
  try {
    // nftService를 통해 사용자의 특정 타입 NFT 보유 여부 확인
    const nfts = await nftService.getUserNfts(userId, `COMMENT_MILESTONE_${milestone}`);
    return nfts.length > 0;
  } catch (error) {
    logger.error(`댓글 마일스톤 NFT 확인 중 오류 발생: ${error.message}`, { userId, milestone });
    return false;
  }
}

/**
 * 특정 미션의 댓글 및 대댓글 전체 삭제 (관리자 기능)
 * @param {string} missionId - 미션 ID
 * @param {string} adminId - 관리자 ID
 * @returns {Promise<number>} - 삭제된 댓글 수
 */
async function deleteAllMissionComments(missionId, adminId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 관리자 권한 확인
    const admin = await User.findById(adminId).session(session);
    if (!admin || !admin.isAdmin) {
      throw new UnauthorizedError('관리자 권한이 필요합니다.');
    }

    // 미션 존재 여부 확인
    const mission = await UserMission.findById(missionId).session(session);
    if (!mission) {
      throw new NotFoundError('해당 미션을 찾을 수 없습니다.');
    }

    // 미션의 모든 댓글 삭제
    const result = await UserMissionComment.deleteMany({ mission: missionId }).session(session);

    await session.commitTransaction();
    return result.deletedCount;
  } catch (error) {
    await session.abortTransaction();
    logger.error(`미션 댓글 전체 삭제 중 오류 발생: ${error.message}`, { missionId, adminId });
    throw error;
  } finally {
    session.endSession();
  }
}

module.exports = {
  createComment,
  getCommentsByMissionId,
  getCommentById,
  updateComment,
  deleteComment,
  toggleLike,
  getUserCommentStats,
  checkAndProcessNftReward,
  hasCommentMilestoneNft,
  deleteAllMissionComments
};
