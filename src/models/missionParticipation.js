/**
 * @file 미션 참여 모델
 * @description 사용자의 미션 참여 정보를 저장하는 MongoDB 스키마 및 모델 정의
 */

const mongoose = require('mongoose');

/**
 * 미션 참여 스키마 정의
 */
const missionParticipationSchema = new mongoose.Schema(
  {
    // 참여 사용자
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    // 참여 미션
    mission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mission',
      required: true,
    },
    
    // 참여 상태
    status: {
      type: String,
      enum: ['started', 'submitted', 'completed', 'rejected', 'abandoned'],
      default: 'started',
    },
    
    // 시작 시간
    startedAt: {
      type: Date,
      default: Date.now,
    },
    
    // 제출 시간
    submittedAt: {
      type: Date,
    },
    
    // 완료 시간
    completedAt: {
      type: Date,
    },
    
    // 완료 증명 (제출물)
    submission: {
      content: mongoose.Schema.Types.Mixed,
      files: [
        {
          url: String,
          contentType: String,
          size: Number,
          filename: String,
        },
      ],
    },
    
    // 평가 결과
    evaluation: {
      score: {
        type: Number,
        min: 0,
        max: 100,
      },
      feedback: String,
      evaluatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // AI 평가의 경우 null
      },
      evaluatedAt: Date,
      aiEvaluation: mongoose.Schema.Types.Mixed,
    },
    
    // 보상 지급 정보
    rewards: {
      xp: {
        amount: Number,
        awarded: {
          type: Boolean,
          default: false,
        },
        awardedAt: Date,
      },
      nestToken: {
        amount: Number,
        txHash: String,
        awarded: {
          type: Boolean,
          default: false,
        },
        awardedAt: Date,
      },
      ctaToken: {
        amount: Number,
        txHash: String,
        awarded: {
          type: Boolean,
          default: false,
        },
        awardedAt: Date,
      },
      nft: {
        tokenId: String,
        txHash: String,
        awarded: {
          type: Boolean,
          default: false,
        },
        awardedAt: Date,
      },
    },
    
    // 그룹 미션 정보
    group: {
      groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MissionGroup',
      },
      role: String,
      contribution: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
    
    // 미션 진행 관련 데이터
    progressData: {
      steps: [{
        stepNumber: Number,
        completed: Boolean,
        completedAt: Date,
        data: mongoose.Schema.Types.Mixed,
      }],
      currentStep: {
        type: Number,
        default: 1,
      },
      totalSteps: Number,
    },
    
    // 완료 시간 (밀리초)
    completionTime: Number,
    
    // 사용자 활동 기록
    activityLog: [{
      action: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
      data: mongoose.Schema.Types.Mixed,
    }],
  },
  {
    timestamps: true,
  }
);

/**
 * 인덱스 생성
 */
missionParticipationSchema.index({ user: 1, mission: 1 }, { unique: true });
missionParticipationSchema.index({ mission: 1, status: 1 });
missionParticipationSchema.index({ user: 1, status: 1 });
missionParticipationSchema.index({ status: 1, submittedAt: 1 });

/**
 * 미션 제출 메서드
 * 
 * @param {Object} submission - 제출 데이터
 * @returns {Promise} 저장된 참여 객체
 */
missionParticipationSchema.methods.submitMission = async function(submission) {
  this.status = 'submitted';
  this.submittedAt = new Date();
  this.submission = submission;
  
  // 활동 로그에 제출 기록 추가
  this.activityLog.push({
    action: 'mission_submitted',
    timestamp: this.submittedAt,
    data: { submissionId: submission._id },
  });
  
  return this.save();
};

/**
 * 미션 완료 메서드
 * 
 * @param {Object} evaluation - 평가 데이터
 * @param {Object} rewards - 보상 데이터
 * @returns {Promise} 저장된 참여 객체
 */
missionParticipationSchema.methods.completeMission = async function(evaluation, rewards) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.evaluation = {
    ...this.evaluation,
    ...evaluation,
    evaluatedAt: new Date(),
  };
  
  // 완료 시간 계산 (밀리초)
  if (this.startedAt) {
    this.completionTime = this.completedAt - this.startedAt;
  }
  
  // 보상 정보 설정
  if (rewards) {
    if (rewards.xp) {
      this.rewards.xp = {
        amount: rewards.xp,
        awarded: rewards.xp > 0,
        awardedAt: rewards.xp > 0 ? new Date() : null,
      };
    }
    
    if (rewards.nestToken) {
      this.rewards.nestToken = {
        amount: rewards.nestToken,
        txHash: rewards.nestTokenTxHash,
        awarded: rewards.nestToken > 0,
        awardedAt: rewards.nestToken > 0 ? new Date() : null,
      };
    }
    
    if (rewards.ctaToken) {
      this.rewards.ctaToken = {
        amount: rewards.ctaToken,
        txHash: rewards.ctaTokenTxHash,
        awarded: rewards.ctaToken > 0,
        awardedAt: rewards.ctaToken > 0 ? new Date() : null,
      };
    }
    
    if (rewards.nft) {
      this.rewards.nft = {
        tokenId: rewards.nft.tokenId,
        txHash: rewards.nft.txHash,
        awarded: true,
        awardedAt: new Date(),
      };
    }
  }
  
  // 활동 로그에 완료 기록 추가
  this.activityLog.push({
    action: 'mission_completed',
    timestamp: this.completedAt,
    data: {
      evaluation: {
        score: this.evaluation.score,
      },
      rewards: {
        xp: this.rewards.xp?.amount,
        nestToken: this.rewards.nestToken?.amount,
        ctaToken: this.rewards.ctaToken?.amount,
        nft: this.rewards.nft?.tokenId,
      },
    },
  });
  
  return this.save();
};

/**
 * 미션 거부 메서드
 * 
 * @param {string} reason - 거부 이유
 * @returns {Promise} 저장된 참여 객체
 */
missionParticipationSchema.methods.rejectMission = async function(reason) {
  this.status = 'rejected';
  this.evaluation = {
    ...this.evaluation,
    feedback: reason,
    evaluatedAt: new Date(),
  };
  
  // 활동 로그에 거부 기록 추가
  this.activityLog.push({
    action: 'mission_rejected',
    timestamp: new Date(),
    data: { reason },
  });
  
  return this.save();
};

/**
 * 사용자가 완료한 최근 미션 조회 정적 메서드
 * 
 * @param {ObjectId} userId - 사용자 ID
 * @param {number} limit - 조회할 미션 수
 * @returns {Promise<Array>} 완료된 미션 목록
 */
missionParticipationSchema.statics.getUserCompletedMissions = function(userId, limit = 10) {
  return this.find({
    user: userId,
    status: 'completed',
  })
    .sort({ completedAt: -1 })
    .limit(limit)
    .populate('mission', 'title type difficulty rewards');
};

/**
 * 미션의 완료율 조회 정적 메서드
 * 
 * @param {ObjectId} missionId - 미션 ID
 * @returns {Promise<Object>} 미션 완료율 통계
 */
missionParticipationSchema.statics.getMissionCompletionStats = async function(missionId) {
  const stats = await this.aggregate([
    { $match: { mission: mongoose.Types.ObjectId(missionId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);
  
  const result = {
    total: 0,
    started: 0,
    submitted: 0,
    completed: 0,
    rejected: 0,
    abandoned: 0,
  };
  
  // 통계 데이터 정리
  stats.forEach((stat) => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });
  
  // 완료율 계산
  result.completionRate = result.total > 0 ? (result.completed / result.total) * 100 : 0;
  
  // 평균 완료 시간 계산
  const timeStats = await this.aggregate([
    {
      $match: {
        mission: mongoose.Types.ObjectId(missionId),
        status: 'completed',
        completionTime: { $exists: true, $ne: null },
      },
    },
    {
      $group: {
        _id: null,
        avgTime: { $avg: '$completionTime' },
        minTime: { $min: '$completionTime' },
        maxTime: { $max: '$completionTime' },
      },
    },
  ]);
  
  if (timeStats.length > 0) {
    result.averageCompletionTime = timeStats[0].avgTime;
    result.minCompletionTime = timeStats[0].minTime;
    result.maxCompletionTime = timeStats[0].maxTime;
  }
  
  return result;
};

// 미션 참여 모델 생성 및 내보내기
const MissionParticipation = mongoose.model('MissionParticipation', missionParticipationSchema);

module.exports = MissionParticipation;
