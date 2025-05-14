/**
 * @file 미션 모델
 * @description 플랫폼 미션 정보를 저장하는 MongoDB 스키마 및 모델 정의
 */

const mongoose = require('mongoose');

/**
 * 미션 스키마 정의
 */
const missionSchema = new mongoose.Schema(
  {
    // 미션 기본 정보
    title: {
      type: String,
      required: [true, '미션 제목은 필수 항목입니다.'],
      trim: true,
      maxlength: [100, '미션 제목은 100자를 초과할 수 없습니다.'],
    },
    description: {
      type: String,
      required: [true, '미션 설명은 필수 항목입니다.'],
      maxlength: [1000, '미션 설명은 1000자를 초과할 수 없습니다.'],
    },
    
    // 미션 상태
    status: {
      type: String,
      enum: ['draft', 'active', 'completed', 'cancelled'],
      default: 'draft',
    },
    
    // 미션 유형
    type: {
      type: String,
      enum: ['attendance', 'comment', 'quiz', 'ai', 'social', 'creative', 'custom'],
      required: [true, '미션 유형은 필수 항목입니다.'],
    },
    
    // 미션 난이도
    difficulty: {
      type: Number,
      min: 1,
      max: 5,
      default: 1,
    },
    
    // 미션 기간
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    
    // 미션 생성자
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    
    // 미션 참여 요구사항
    requirements: {
      minLevel: {
        type: Number,
        default: 1,
      },
      requiredNFTs: [String],
      whitelistedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }],
      maxParticipants: {
        type: Number,
      },
    },
    
    // 미션 보상
    rewards: {
      xp: {
        type: Number,
        required: [true, 'XP 보상은 필수 항목입니다.'],
        min: [0, 'XP 보상은 0 이상이어야 합니다.'],
      },
      nestToken: {
        type: Number,
        default: 0,
        min: [0, 'NEST 토큰 보상은 0 이상이어야 합니다.'],
      },
      ctaToken: {
        type: Number,
        default: 0,
        min: [0, 'CTA 토큰 보상은 0 이상이어야 합니다.'],
      },
      nft: {
        enabled: {
          type: Boolean,
          default: false,
        },
        tokenType: {
          type: Number,
        },
        metadata: {
          type: mongoose.Schema.Types.Mixed,
        },
      },
    },
    
    // 미션 컨텐츠 (예: 퀴즈 질문, 창작 과제 등)
    content: {
      type: mongoose.Schema.Types.Mixed,
    },
    
    // AI 관련 설정 (AI 미션인 경우)
    aiSettings: {
      model: {
        type: String,
        enum: ['gpt4', 'claude', 'custom'],
      },
      prompt: {
        type: String,
      },
      evaluationCriteria: {
        type: mongoose.Schema.Types.Mixed,
      },
    },
    
    // 성공 기준
    successCriteria: {
      type: mongoose.Schema.Types.Mixed,
    },
    
    // 통계
    stats: {
      participantCount: {
        type: Number,
        default: 0,
      },
      completionCount: {
        type: Number,
        default: 0,
      },
      totalTokensRewarded: {
        nest: {
          type: Number,
          default: 0,
        },
        cta: {
          type: Number,
          default: 0,
        },
      },
      totalXpRewarded: {
        type: Number,
        default: 0,
      },
      // 캐시된 평균 완료 시간 (밀리초)
      averageCompletionTime: {
        type: Number,
        default: 0,
      },
    },
    
    // 태그
    tags: [String],
    
    // 이미지 URL
    imageUrl: String,
    
    // 반복 설정
    recurrence: {
      enabled: {
        type: Boolean,
        default: false,
      },
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'custom'],
      },
      customPattern: {
        type: String, // cron 패턴
      },
      endAfterOccurrence: {
        type: Number,
      },
      endDate: {
        type: Date,
      },
    },
    
    // 그룹 미션 설정
    groupSettings: {
      isGroupMission: {
        type: Boolean,
        default: false,
      },
      minGroupSize: {
        type: Number,
        min: 2,
      },
      maxGroupSize: {
        type: Number,
      },
      autoMatchmaking: {
        type: Boolean,
        default: false,
      },
      matchmakingCriteria: {
        type: mongoose.Schema.Types.Mixed,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * 미션 참여 가상 필드
 */
missionSchema.virtual('participants', {
  ref: 'MissionParticipation',
  localField: '_id',
  foreignField: 'mission',
});

/**
 * 인덱스 생성
 */
missionSchema.index({ status: 1, startDate: 1, endDate: 1 });
missionSchema.index({ creator: 1 });
missionSchema.index({ type: 1 });
missionSchema.index({ tags: 1 });

/**
 * 현재 활성화된 미션 조회 정적 메서드
 * 
 * @returns {Promise<Array>} 활성화된 미션 목록
 */
missionSchema.statics.getActiveMissions = function() {
  const now = new Date();
  
  return this.find({
    status: 'active',
    startDate: { $lte: now },
    $or: [
      { endDate: { $gte: now } },
      { endDate: null }
    ]
  }).sort({ startDate: -1 });
};

/**
 * 사용자 맞춤형 미션 조회 정적 메서드
 * 
 * @param {Object} user - 사용자 객체
 * @returns {Promise<Array>} 사용자 맞춤형 미션 목록
 */
missionSchema.statics.getPersonalizedMissions = function(user) {
  const now = new Date();
  
  return this.find({
    status: 'active',
    startDate: { $lte: now },
    $or: [
      { endDate: { $gte: now } },
      { endDate: null }
    ],
    'requirements.minLevel': { $lte: user.level },
    $or: [
      { 'requirements.whitelistedUsers': { $exists: false } },
      { 'requirements.whitelistedUsers': { $size: 0 } },
      { 'requirements.whitelistedUsers': user._id }
    ]
  }).sort({ difficulty: 1, startDate: -1 });
};

/**
 * 미션의 현재 상태 업데이트 메서드
 * 
 * @returns {Promise} 저장된 미션 객체
 */
missionSchema.methods.updateStatus = async function() {
  const now = new Date();
  
  // 종료 날짜가 지났으면 completed로 변경
  if (this.endDate && this.endDate < now && this.status === 'active') {
    this.status = 'completed';
    await this.save();
  }
  
  // 시작 날짜가 되었으면 draft에서 active로 변경
  if (this.startDate <= now && this.status === 'draft') {
    this.status = 'active';
    await this.save();
  }
  
  return this;
};

// 미션 모델 생성 및 내보내기
const Mission = mongoose.model('Mission', missionSchema);

module.exports = Mission;
