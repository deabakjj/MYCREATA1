/**
 * @file 활동 모델
 * @description 사용자 활동을 기록하는 MongoDB 스키마 및 모델 정의
 */

const mongoose = require('mongoose');

/**
 * 활동 스키마 정의
 */
const activitySchema = new mongoose.Schema(
  {
    // 활동 사용자
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    
    // 활동 유형
    type: {
      type: String,
      enum: [
        'login',              // 로그인
        'wallet_created',     // 지갑 생성
        'nestid_registered',  // .nest ID 등록
        'attendance',         // 출석 체크
        'mission_started',    // 미션 시작
        'mission_completed',  // 미션 완료
        'comment_created',    // 댓글 작성
        'level_up',           // 레벨업
        'token_earned',       // 토큰 획득
        'token_spent',        // 토큰 사용
        'token_swapped',      // 토큰 교환
        'nft_earned',         // NFT 획득
        'nft_transferred',    // NFT 전송
        'profile_updated',    // 프로필 업데이트
        'social_share',       // 소셜 공유
        'group_joined',       // 그룹 참여
        'custom',             // 커스텀 활동
      ],
      required: true,
      index: true,
    },
    
    // 활동 내용
    data: {
      type: mongoose.Schema.Types.Mixed,
    },
    
    // 활동 메타데이터
    metadata: {
      ip: String,
      userAgent: String,
      platform: String,
      device: String,
      location: {
        country: String,
        region: String,
        city: String,
      },
    },
    
    // 관련 객체 참조
    relatedTo: {
      model: {
        type: String,
        enum: ['User', 'Mission', 'Comment', 'Wallet', 'NFT', 'Transaction', 'Group'],
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'relatedTo.model',
      },
    },
    
    // NFT 발행 여부
    nftIssued: {
      type: Boolean,
      default: false,
    },
    
    // 보상 정보
    rewards: {
      xp: Number,
      nestToken: Number,
      ctaToken: Number,
      nft: {
        tokenId: String,
        tokenType: Number,
      },
    },
  },
  {
    timestamps: true,
  }
);

/**
 * 인덱스 생성
 */
activitySchema.index({ createdAt: -1 });
activitySchema.index({ user: 1, type: 1, createdAt: -1 });
activitySchema.index({ 'relatedTo.model': 1, 'relatedTo.id': 1 });

/**
 * 최근 활동 조회 정적 메서드
 * 
 * @param {ObjectId} userId - 사용자 ID
 * @param {number} limit - 조회할 활동 수
 * @returns {Promise<Array>} 활동 목록
 */
activitySchema.statics.getRecentActivities = function(userId, limit = 20) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('relatedTo.id');
};

/**
 * 특정 유형의 오늘 활동 조회 정적 메서드
 * 
 * @param {ObjectId} userId - 사용자 ID
 * @param {string} type - 활동 유형
 * @returns {Promise<Array>} 활동 목록
 */
activitySchema.statics.getTodayActivitiesByType = function(userId, type) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return this.find({
    user: userId,
    type: type,
    createdAt: { $gte: today },
  }).sort({ createdAt: -1 });
};

/**
 * 활동 유형별 집계 정적 메서드
 * 
 * @param {ObjectId} userId - 사용자 ID
 * @returns {Promise<Object>} 활동 유형별 통계
 */
activitySchema.statics.getActivityStatsByType = async function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        lastActivity: { $max: '$createdAt' },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

/**
 * 활동 트렌드 집계 정적 메서드 (일별)
 * 
 * @param {ObjectId} userId - 사용자 ID
 * @param {number} days - 조회할 날짜 수
 * @returns {Promise<Object>} 일별 활동 통계
 */
activitySchema.statics.getDailyActivityTrend = async function(userId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);
  startDate.setHours(0, 0, 0, 0);
  
  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        },
        count: { $sum: 1 },
        activities: {
          $push: {
            type: '$type',
            createdAt: '$createdAt',
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        date: {
          $dateFromParts: {
            year: '$_id.year',
            month: '$_id.month',
            day: '$_id.day',
          },
        },
        count: 1,
        activities: 1,
      },
    },
    { $sort: { date: 1 } },
  ]);
};

/**
 * NFT 발행 대상 활동 조회 정적 메서드
 * 
 * @returns {Promise<Array>} NFT 발행 대상 활동 목록
 */
activitySchema.statics.getPendingNFTActivities = function() {
  return this.find({
    nftIssued: false,
    'rewards.nft.tokenType': { $exists: true, $ne: null },
  }).populate('user');
};

// 활동 모델 생성 및 내보내기
const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;
