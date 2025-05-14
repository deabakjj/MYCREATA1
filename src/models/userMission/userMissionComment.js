/**
 * 유저 생성 미션 댓글 모델
 * 
 * 유저 생성 미션과 제출물에 대한 댓글을 관리합니다.
 * 댓글 내용, 좋아요, 대댓글 등을 포함합니다.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * 유저 생성 미션 댓글 스키마
 */
const UserMissionCommentSchema = new Schema({
  // 댓글 대상 타입 (미션 or 제출물)
  targetType: {
    type: String,
    required: true,
    enum: ['mission', 'submission'],
    index: true
  },

  // 댓글 대상 ID
  targetId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'targetType',
    index: true
  },

  // 댓글 작성자
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // 댓글 내용
  content: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 1000
  },

  // 부모 댓글 (대댓글인 경우)
  parentComment: {
    type: Schema.Types.ObjectId,
    ref: 'UserMissionComment',
    index: true
  },

  // 대댓글 수
  replyCount: {
    type: Number,
    default: 0,
    min: 0
  },

  // 좋아요
  likes: {
    // 좋아요 수
    count: {
      type: Number,
      default: 0,
      min: 0
    },

    // 좋아요 누른 사용자 목록
    users: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  },

  // 미션 생성자의 베스트 댓글 선정 여부
  isBest: {
    type: Boolean,
    default: false
  },

  // 댓글 상태
  status: {
    type: String,
    required: true,
    enum: ['활성', '삭제됨', '숨김', '신고됨'],
    default: '활성',
    index: true
  },

  // 삭제된 이유 (관리자에 의해 삭제된 경우)
  deletedReason: {
    type: String,
    trim: true
  },

  // 생성 및 업데이트 시간
  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

/**
 * 저장 전 훅
 */
UserMissionCommentSchema.pre('save', function(next) {
  // 업데이트 시간 갱신
  this.updatedAt = new Date();
  next();
});

/**
 * 인덱스 설정
 */
UserMissionCommentSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
UserMissionCommentSchema.index({ author: 1, createdAt: -1 });
UserMissionCommentSchema.index({ parentComment: 1, createdAt: 1 });
UserMissionCommentSchema.index({ isBest: 1 });

/**
 * 미션별 댓글 조회
 */
UserMissionCommentSchema.statics.findByMission = function(missionId) {
  return this.find({
    targetType: 'mission',
    targetId: missionId,
    status: '활성',
    parentComment: null
  }).sort({ createdAt: -1 });
};

/**
 * 제출물별 댓글 조회
 */
UserMissionCommentSchema.statics.findBySubmission = function(submissionId) {
  return this.find({
    targetType: 'submission',
    targetId: submissionId,
    status: '활성',
    parentComment: null
  }).sort({ createdAt: -1 });
};

/**
 * 대댓글 조회
 */
UserMissionCommentSchema.statics.findReplies = function(commentId) {
  return this.find({
    parentComment: commentId,
    status: '활성'
  }).sort({ createdAt: 1 });
};

/**
 * 사용자별 댓글 조회
 */
UserMissionCommentSchema.statics.findByUser = function(userId) {
  return this.find({
    author: userId,
    status: '활성'
  }).sort({ createdAt: -1 });
};

/**
 * 베스트 댓글 조회
 */
UserMissionCommentSchema.statics.findBestComments = function(targetType, targetId) {
  return this.find({
    targetType,
    targetId,
    status: '활성',
    isBest: true
  }).sort({ createdAt: -1 });
};

/**
 * 댓글 좋아요 추가
 */
UserMissionCommentSchema.methods.addLike = async function(userId) {
  // 이미 좋아요를 누른 경우 체크
  if (this.likes.users.includes(userId)) {
    return this;
  }

  // 좋아요 추가
  this.likes.users.push(userId);
  this.likes.count += 1;
  
  return this.save();
};

/**
 * 댓글 좋아요 취소
 */
UserMissionCommentSchema.methods.removeLike = async function(userId) {
  // 좋아요를 누른 적이 없는 경우 체크
  const userIndex = this.likes.users.indexOf(userId);
  if (userIndex === -1) {
    return this;
  }

  // 좋아요 취소
  this.likes.users.splice(userIndex, 1);
  this.likes.count -= 1;
  
  return this.save();
};

/**
 * 댓글 삭제 (소프트 딜리트)
 */
UserMissionCommentSchema.methods.softDelete = async function(reason) {
  this.status = '삭제됨';
  this.deletedReason = reason;
  
  return this.save();
};

/**
 * 댓글 숨김
 */
UserMissionCommentSchema.methods.hide = async function() {
  this.status = '숨김';
  
  return this.save();
};

/**
 * 댓글 신고
 */
UserMissionCommentSchema.methods.report = async function() {
  this.status = '신고됨';
  
  return this.save();
};

/**
 * 댓글 복구
 */
UserMissionCommentSchema.methods.restore = async function() {
  this.status = '활성';
  this.deletedReason = null;
  
  return this.save();
};

/**
 * 베스트 댓글 설정
 */
UserMissionCommentSchema.methods.markAsBest = async function() {
  this.isBest = true;
  
  return this.save();
};

/**
 * 베스트 댓글 해제
 */
UserMissionCommentSchema.methods.unmarkAsBest = async function() {
  this.isBest = false;
  
  return this.save();
};

/**
 * 대댓글 수 증가
 */
UserMissionCommentSchema.methods.incrementReplyCount = async function() {
  this.replyCount += 1;
  
  return this.save();
};

/**
 * 대댓글 수 감소
 */
UserMissionCommentSchema.methods.decrementReplyCount = async function() {
  if (this.replyCount > 0) {
    this.replyCount -= 1;
  }
  
  return this.save();
};

// 모델 생성 및 내보내기
const UserMissionComment = mongoose.model('UserMissionComment', UserMissionCommentSchema);
module.exports = UserMissionComment;
