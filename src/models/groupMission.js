/**
 * 그룹 미션 모델
 * 
 * 이 모델은 그룹 단위로 수행되는 미션을 정의합니다.
 * 여러 사용자가 함께 참여하여 공동의 목표를 달성하는 형태의 미션입니다.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * 그룹 미션 스키마
 */
const GroupMissionSchema = new Schema({
  // 기본 정보
  title: {
    type: String,
    required: true,
    trim: true
  },
  
  description: {
    type: String,
    required: true,
    trim: true
  },
  
  // 미션 유형 (소셜, 교육, 창작 등)
  type: {
    type: String,
    required: true,
    enum: ['social', 'education', 'creation', 'governance', 'contribution', 'custom'],
    default: 'social'
  },
  
  // 미션 이미지 URL
  imageUrl: {
    type: String,
    trim: true
  },
  
  // 미션 난이도 (1-5)
  difficulty: {
    type: Number,
    min: 1,
    max: 5,
    default: 2
  },
  
  // 그룹 크기 설정
  groupSettings: {
    minMembers: {
      type: Number,
      required: true,
      min: 2,
      default: 2
    },
    maxMembers: {
      type: Number,
      required: true,
      min: 2,
      default: 5
    },
    autoMatch: {
      type: Boolean,
      default: true
    },
    // 자동 매칭 시 고려할 요소들
    matchingCriteria: {
      byInterest: {
        type: Boolean,
        default: true
      },
      byActivity: {
        type: Boolean,
        default: false
      },
      byLevel: {
        type: Boolean,
        default: true
      },
      byLocation: {
        type: Boolean,
        default: false
      }
    },
    // 그룹 형성 마감 시간
    formationDeadline: {
      type: Date
    }
  },
  
  // 미션 기간 설정
  timeSettings: {
    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: true
    },
    // 단계별 진행 여부
    hasStages: {
      type: Boolean,
      default: false
    },
    // 단계 목록 (hasStages가 true인 경우)
    stages: [{
      name: {
        type: String,
        required: true
      },
      description: {
        type: String
      },
      durationDays: {
        type: Number,
        min: 1,
        required: true
      },
      // 이전 단계 완료 필요 여부
      requiresPreviousStage: {
        type: Boolean,
        default: true
      }
    }]
  },
  
  // 목표 및 완료 조건
  objectives: {
    // 전체 그룹 공통 목표
    groupObjectives: [{
      description: {
        type: String,
        required: true
      },
      target: {
        type: Number,
        min: 1,
        required: true
      },
      currentProgress: {
        type: Number,
        default: 0
      },
      // 진행 단위 (예: 회, 개, %)
      unit: {
        type: String,
        default: '회'
      },
      optional: {
        type: Boolean,
        default: false
      }
    }],
    
    // 개인별 달성 목표
    memberObjectives: [{
      description: {
        type: String,
        required: true
      },
      target: {
        type: Number,
        min: 1,
        required: true
      },
      // 진행 단위 (예: 회, 개, %)
      unit: {
        type: String,
        default: '회'
      },
      optional: {
        type: Boolean,
        default: false
      }
    }],
    
    // 전체 그룹 목표 완료 조건 (모든 목표 / 특정 비율)
    completionCriteria: {
      type: String,
      enum: ['all', 'percentage'],
      default: 'all'
    },
    
    // 'percentage'인 경우, 완료 기준 비율 (%)
    completionPercentage: {
      type: Number,
      min: 1,
      max: 100,
      default: 80
    }
  },
  
  // 보상 정보
  rewards: {
    // 그룹 공통 보상
    groupRewards: {
      xp: {
        type: Number,
        default: 0
      },
      tokenAmount: {
        type: Number,
        default: 0
      },
      nft: {
        issue: {
          type: Boolean,
          default: false
        },
        type: {
          type: String,
          enum: ['badge', 'artwork', 'certificate', 'custom'],
          default: 'badge'
        },
        rarity: {
          type: String,
          enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
          default: 'common'
        }
      }
    },
    
    // 개인별 보상 (그룹 보상과 별개로 개인에게 지급)
    memberRewards: {
      xp: {
        type: Number,
        default: 0
      },
      tokenAmount: {
        type: Number,
        default: 0
      },
      nft: {
        issue: {
          type: Boolean,
          default: false
        },
        type: {
          type: String,
          enum: ['badge', 'artwork', 'certificate', 'custom'],
          default: 'badge'
        },
        rarity: {
          type: String,
          enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
          default: 'common'
        }
      }
    },
    
    // 성과 기반 추가 보상
    bonusRewards: {
      // 전체 달성률 100% 보너스
      fullCompletion: {
        xp: {
          type: Number,
          default: 0
        },
        tokenAmount: {
          type: Number,
          default: 0
        }
      },
      // 기간 내 조기 완료 보너스
      earlyCompletion: {
        xp: {
          type: Number,
          default: 0
        },
        tokenAmount: {
          type: Number,
          default: 0
        }
      },
      // 우수 기여자 보너스 (상위 X%)
      topContributor: {
        xp: {
          type: Number,
          default: 0
        },
        tokenAmount: {
          type: Number,
          default: 0
        },
        percentage: {
          type: Number,
          min: 1,
          max: 50,
          default: 20
        }
      }
    }
  },
  
  // 상호작용 설정
  interactions: {
    // 채팅 기능 활성화
    enableChat: {
      type: Boolean,
      default: true
    },
    // 진행 상황 공유 가능 여부
    shareProgress: {
      type: Boolean,
      default: true
    },
    // 상호 평가 활성화
    enablePeerRating: {
      type: Boolean,
      default: false
    },
    // 투표 기능 활성화
    enableVoting: {
      type: Boolean,
      default: false
    },
    // 기여도 측정 방식
    contributionTracking: {
      type: String,
      enum: ['equal', 'activity', 'peer_rating', 'leader_rating', 'automatic'],
      default: 'equal'
    }
  },
  
  // 가입 조건
  joinRequirements: {
    // 미션 가입 승인 필요 여부
    requireApproval: {
      type: Boolean,
      default: false
    },
    // 최소 레벨 요구사항
    minLevel: {
      type: Number,
      min: 0,
      default: 0
    },
    // 특정 NFT 소유 필요 여부
    requireNFT: {
      active: {
        type: Boolean,
        default: false
      },
      contractAddress: {
        type: String,
        trim: true
      },
      tokenIdList: [{
        type: String,
        trim: true
      }]
    },
    // 최소 토큰 보유량
    minTokenHolding: {
      active: {
        type: Boolean,
        default: false
      },
      amount: {
        type: Number,
        default: 0
      }
    },
    // 특정 태그/관심사 요구
    requiredTags: [{
      type: String,
      trim: true
    }]
  },
  
  // 미션 상태
  status: {
    type: String,
    enum: ['draft', 'registration', 'forming_groups', 'in_progress', 'completed', 'cancelled'],
    default: 'draft'
  },
  
  // 미션 관련 설정들
  settings: {
    // 공개 여부
    isPublic: {
      type: Boolean,
      default: true
    },
    // 피드에 표시 여부
    showInFeed: {
      type: Boolean,
      default: true
    },
    // 피드백 수집 여부
    collectFeedback: {
      type: Boolean,
      default: false
    },
    // 자동 참가자 알림
    enableNotifications: {
      type: Boolean,
      default: true
    }
  },
  
  // 태그 및 카테고리
  tags: [{
    type: String,
    trim: true
  }],
  
  category: {
    type: String,
    trim: true
  },
  
  // 관련 통합 서비스 ID (소셜 미디어, AI 서비스 등)
  integrations: [{
    type: Schema.Types.ObjectId,
    ref: 'Integration'
  }],
  
  // 생성 및 수정 정보
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
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
 * 수정 시 updatedAt 자동 업데이트
 */
GroupMissionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

/**
 * 현재 진행 중인 그룹 미션 조회
 */
GroupMissionSchema.statics.findActive = function() {
  return this.find({
    status: 'in_progress',
    'timeSettings.endDate': { $gt: new Date() }
  });
};

/**
 * 특정 사용자의 참여 가능한 미션 목록 조회
 */
GroupMissionSchema.statics.findAvailableForUser = function(userId, userLevel, userTags) {
  return this.find({
    status: { $in: ['registration', 'forming_groups'] },
    'timeSettings.endDate': { $gt: new Date() },
    'joinRequirements.minLevel': { $lte: userLevel },
    $or: [
      { 'joinRequirements.requiredTags': { $size: 0 } },
      { 'joinRequirements.requiredTags': { $in: userTags } }
    ]
  });
};

/**
 * 그룹 형성 단계에서 자동 매칭이 필요한 미션 조회
 */
GroupMissionSchema.statics.findNeedingMatching = function() {
  return this.find({
    status: 'forming_groups',
    'groupSettings.autoMatch': true,
    'groupSettings.formationDeadline': { $lt: new Date() }
  });
};

// 모델 생성 및 내보내기
const GroupMission = mongoose.model('GroupMission', GroupMissionSchema);
module.exports = GroupMission;
