/**
 * 그룹 미션 참여 모델
 * 
 * 이 모델은 그룹 미션에 참여하는 사용자 그룹과 그 진행 상황을 정의합니다.
 * 그룹 구성, 그룹 내 개인별 진행 상황, 그룹 목표 달성도 등을 추적합니다.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * 그룹 미션 참여 스키마
 */
const GroupMissionParticipationSchema = new Schema({
  // 참여 중인 그룹 미션 ID
  groupMission: {
    type: Schema.Types.ObjectId,
    ref: 'GroupMission',
    required: true
  },
  
  // 그룹 정보
  group: {
    // 그룹명
    name: {
      type: String,
      required: true,
      trim: true
    },
    
    // 그룹 설명
    description: {
      type: String,
      trim: true
    },
    
    // 그룹 아이콘/이미지 URL
    imageUrl: {
      type: String,
      trim: true
    },
    
    // 그룹 형성 방식
    formationType: {
      type: String,
      enum: ['auto_match', 'self_form', 'admin_assigned'],
      default: 'auto_match'
    },
    
    // 그룹 형성 시간
    formedAt: {
      type: Date,
      default: Date.now
    },
    
    // 그룹 리더
    leader: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // 리더 교체 이력
    leaderHistory: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      startedAt: {
        type: Date
      },
      endedAt: {
        type: Date
      },
      reason: {
        type: String,
        trim: true
      }
    }]
  },
  
  // 그룹 구성원 목록
  members: [{
    // 사용자 ID
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    // 참여 상태
    status: {
      type: String,
      enum: ['invited', 'pending', 'active', 'paused', 'left', 'kicked', 'completed'],
      default: 'active'
    },
    
    // 참여 시작 시간
    joinedAt: {
      type: Date,
      default: Date.now
    },
    
    // 탈퇴/제명 시간
    leftAt: {
      type: Date
    },
    
    // 탈퇴/제명 사유
    leaveReason: {
      type: String,
      trim: true
    },
    
    // 개인별 목표 진행 상황
    objectives: [{
      // 목표 ID (GroupMission의 memberObjectives 참조)
      objectiveId: {
        type: Schema.Types.ObjectId
      },
      
      // 목표 설명 (참조용)
      description: {
        type: String,
        trim: true
      },
      
      // 목표치
      target: {
        type: Number,
        min: 0
      },
      
      // 현재 진행도
      progress: {
        type: Number,
        min: 0,
        default: 0
      },
      
      // 마지막 업데이트 시간
      lastUpdated: {
        type: Date,
        default: Date.now
      },
      
      // 목표 완료 여부
      completed: {
        type: Boolean,
        default: false
      },
      
      // 목표 완료 시간
      completedAt: {
        type: Date
      },
      
      // 진행 이력
      history: [{
        timestamp: {
          type: Date,
          default: Date.now
        },
        progressDelta: {
          type: Number
        },
        totalProgress: {
          type: Number
        },
        note: {
          type: String,
          trim: true
        }
      }]
    }],
    
    // 기여도 평가
    contribution: {
      // 자동 기여도 점수 (활동 기반)
      autoScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      
      // 동료 평가 점수 (다른 구성원의 평가)
      peerScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      
      // 리더 평가 점수
      leaderScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      
      // 최종 기여도 점수 (가중치 적용)
      finalScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      
      // 기여도 순위 (그룹 내)
      rank: {
        type: Number,
        min: 1
      },
      
      // 그룹 내 상위 % (백분위)
      percentile: {
        type: Number,
        min: 0,
        max: 100
      }
    },
    
    // 받은 피드백 (다른 구성원들로부터)
    receivedFeedback: [{
      from: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      
      // 익명 여부
      anonymous: {
        type: Boolean,
        default: false
      },
      
      // 점수 (1-5)
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      
      // 코멘트
      comment: {
        type: String,
        trim: true
      },
      
      // 피드백 영역
      aspect: {
        type: String,
        enum: ['communication', 'contribution', 'helpfulness', 'leadership', 'overall'],
        default: 'overall'
      },
      
      // 피드백 시간
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    
    // 활동 로그
    activityLog: [{
      // 활동 유형
      type: {
        type: String,
        enum: ['progress_update', 'chat_message', 'upload', 'comment', 'vote', 'review', 'custom'],
        required: true
      },
      
      // 활동 시간
      timestamp: {
        type: Date,
        default: Date.now
      },
      
      // 활동 상세 정보
      details: {
        type: Object
      },
      
      // 활동 점수 (기여도 계산용)
      activityScore: {
        type: Number,
        min: 0,
        default: 1
      }
    }],
    
    // 개인별 보상 지급 정보
    rewards: {
      // 기본 보상 지급 여부
      baseRewardPaid: {
        type: Boolean,
        default: false
      },
      
      // 기본 보상 지급 시간
      baseRewardPaidAt: {
        type: Date
      },
      
      // 보너스 보상 지급 내역
      bonusRewards: [{
        // 보너스 유형
        type: {
          type: String,
          enum: ['full_completion', 'early_completion', 'top_contributor', 'custom'],
          required: true
        },
        
        // 보너스 내용
        xp: {
          type: Number,
          default: 0
        },
        
        tokenAmount: {
          type: Number,
          default: 0
        },
        
        // 보너스 지급 시간
        paidAt: {
          type: Date,
          default: Date.now
        },
        
        // 보너스 지급 사유
        reason: {
          type: String,
          trim: true
        }
      }],
      
      // NFT 지급 정보 (있는 경우)
      nft: {
        issued: {
          type: Boolean,
          default: false
        },
        
        tokenId: {
          type: String,
          trim: true
        },
        
        transactionHash: {
          type: String,
          trim: true
        },
        
        issuedAt: {
          type: Date
        }
      }
    }
  }],
  
  // 그룹 전체 목표 진행 상황
  groupObjectives: [{
    // 목표 ID (GroupMission의 groupObjectives 참조)
    objectiveId: {
      type: Schema.Types.ObjectId
    },
    
    // 목표 설명 (참조용)
    description: {
      type: String,
      trim: true
    },
    
    // 목표치
    target: {
      type: Number,
      min: 0
    },
    
    // 현재 진행도
    progress: {
      type: Number,
      min: 0,
      default: 0
    },
    
    // 진행률 (%)
    progressPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    
    // 마지막 업데이트 시간
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    
    // 목표 완료 여부
    completed: {
      type: Boolean,
      default: false
    },
    
    // 목표 완료 시간
    completedAt: {
      type: Date
    },
    
    // 진행 이력
    history: [{
      timestamp: {
        type: Date,
        default: Date.now
      },
      progressDelta: {
        type: Number
      },
      totalProgress: {
        type: Number
      },
      progressPercentage: {
        type: Number
      },
      updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      note: {
        type: String,
        trim: true
      }
    }]
  }],
  
  // 그룹 단계 진행 현황 (단계별 미션인 경우)
  stageProgress: [{
    // 단계 번호
    stageIndex: {
      type: Number,
      required: true
    },
    
    // 단계명
    name: {
      type: String,
      trim: true
    },
    
    // 단계 상태
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'skipped'],
      default: 'not_started'
    },
    
    // 시작 시간
    startedAt: {
      type: Date
    },
    
    // 완료 시간
    completedAt: {
      type: Date
    },
    
    // 단계별 진행률 (%)
    progressPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  }],
  
  // 그룹 채팅 메시지
  chatMessages: [{
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    content: {
      type: String,
      required: true,
      trim: true
    },
    
    timestamp: {
      type: Date,
      default: Date.now
    },
    
    // 첨부 파일 URL (있는 경우)
    attachments: [{
      type: String,
      trim: true
    }],
    
    // 읽은 멤버 목록
    readBy: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      readAt: {
        type: Date
      }
    }]
  }],
  
  // 그룹 투표 내역
  votes: [{
    // 투표 제목
    title: {
      type: String,
      required: true,
      trim: true
    },
    
    // 투표 설명
    description: {
      type: String,
      trim: true
    },
    
    // 생성자
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    // 생성 시간
    createdAt: {
      type: Date,
      default: Date.now
    },
    
    // 투표 마감 시간
    expiresAt: {
      type: Date,
      required: true
    },
    
    // 투표 종류 (단일/복수)
    voteType: {
      type: String,
      enum: ['single', 'multiple'],
      default: 'single'
    },
    
    // 투표 항목
    options: [{
      text: {
        type: String,
        required: true,
        trim: true
      },
      
      // 득표수
      votes: {
        type: Number,
        default: 0
      }
    }],
    
    // 투표 참여자
    voters: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      
      // 선택한 항목 인덱스
      selectedOptions: [{
        type: Number
      }],
      
      // 투표 시간
      votedAt: {
        type: Date,
        default: Date.now
      }
    }],
    
    // 투표 상태
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active'
    },
    
    // 결과 공개 여부
    resultsVisible: {
      type: Boolean,
      default: true
    }
  }],
  
  // 그룹 전체 현황
  status: {
    // 그룹 상태
    current: {
      type: String,
      enum: ['forming', 'active', 'paused', 'completed', 'failed', 'disbanded'],
      default: 'forming'
    },
    
    // 상태 업데이트 시간
    updatedAt: {
      type: Date,
      default: Date.now
    },
    
    // 목표 달성률 (%)
    completionPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    
    // 미션 시작 시간
    startedAt: {
      type: Date
    },
    
    // 미션 완료 시간
    completedAt: {
      type: Date
    },
    
    // 조기 완료 여부
    completedEarly: {
      type: Boolean,
      default: false
    },
    
    // 조기 완료 일수 (일)
    daysCompletedEarly: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  
  // 그룹 알림 내역
  notifications: [{
    // 알림 유형
    type: {
      type: String,
      enum: ['milestone', 'reminder', 'member_join', 'member_leave', 'stage_complete', 'chat', 'vote', 'custom'],
      required: true
    },
    
    // 알림 제목
    title: {
      type: String,
      required: true,
      trim: true
    },
    
    // 알림 내용
    content: {
      type: String,
      trim: true
    },
    
    // 알림 시간
    timestamp: {
      type: Date,
      default: Date.now
    },
    
    // 관련 사용자 (있는 경우)
    relatedUser: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // 읽은 멤버 목록
    readBy: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      readAt: {
        type: Date
      }
    }]
  }],
  
  // 그룹 보상 정보
  groupRewards: {
    // 그룹 보상 지급 여부
    rewardPaid: {
      type: Boolean,
      default: false
    },
    
    // 보상 지급 시간
    paidAt: {
      type: Date
    },
    
    // 보상 내역
    xp: {
      type: Number,
      default: 0
    },
    
    tokenAmount: {
      type: Number,
      default: 0
    },
    
    // NFT 지급 정보 (있는 경우)
    nft: {
      issued: {
        type: Boolean,
        default: false
      },
      
      tokenId: {
        type: String,
        trim: true
      },
      
      transactionHash: {
        type: String,
        trim: true
      },
      
      issuedAt: {
        type: Date
      }
    },
    
    // 보너스 보상 여부
    bonusRewardPaid: {
      type: Boolean,
      default: false
    },
    
    // 보너스 내역
    bonusRewards: {
      xp: {
        type: Number,
        default: 0
      },
      
      tokenAmount: {
        type: Number,
        default: 0
      }
    },
    
    // 보상 배분 방식
    distributionMethod: {
      type: String,
      enum: ['equal', 'contribution_based'],
      default: 'equal'
    }
  },
  
  // 그룹 피드백 및 평가
  feedback: {
    // 미션에 대한 그룹 피드백
    missionFeedback: {
      // 평점 (1-5)
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      
      // 피드백 코멘트
      comment: {
        type: String,
        trim: true
      },
      
      // 개선점 제안
      improvements: [{
        type: String,
        trim: true
      }],
      
      // 피드백 제출 시간
      submittedAt: {
        type: Date
      }
    },
    
    // 미션 난이도 평가
    difficultyRating: {
      type: Number,
      min: 1,
      max: 5
    },
    
    // 그룹 자체 평가
    groupSelfAssessment: {
      // 협업 효율성 (1-5)
      collaboration: {
        type: Number,
        min: 1,
        max: 5
      },
      
      // 그룹 내 의사소통 (1-5)
      communication: {
        type: Number,
        min: 1,
        max: 5
      },
      
      // 목표 달성 만족도 (1-5)
      achievement: {
        type: Number,
        min: 1,
        max: 5
      },
      
      // 향후 개선점
      improvements: [{
        type: String,
        trim: true
      }],
      
      // 평가 제출 시간
      submittedAt: {
        type: Date
      }
    }
  },
  
  // 생성 및 수정 정보
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
GroupMissionParticipationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

/**
 * 활성 상태의 그룹 참여 조회
 */
GroupMissionParticipationSchema.statics.findActiveGroups = function() {
  return this.find({
    'status.current': 'active'
  });
};

/**
 * 특정 사용자의 그룹 참여 내역 조회
 */
GroupMissionParticipationSchema.statics.findByUser = function(userId) {
  return this.find({
    'members.user': userId,
    'members.status': { $in: ['active', 'completed'] }
  });
};

/**
 * 특정 그룹 미션의 모든 참여 그룹 조회
 */
GroupMissionParticipationSchema.statics.findByGroupMission = function(groupMissionId) {
  return this.find({
    groupMission: groupMissionId
  });
};

/**
 * 그룹 완료율 계산 메서드
 */
GroupMissionParticipationSchema.methods.calculateCompletionPercentage = function() {
  if (!this.groupObjectives || this.groupObjectives.length === 0) {
    return 0;
  }
  
  let totalWeight = this.groupObjectives.length;
  let completedWeight = 0;
  
  this.groupObjectives.forEach(objective => {
    completedWeight += (objective.progress / objective.target);
  });
  
  return Math.round((completedWeight / totalWeight) * 100);
};

/**
 * 사용자 개별 기여도 점수 계산 메서드
 */
GroupMissionParticipationSchema.methods.calculateContributionScores = function() {
  if (!this.members || this.members.length === 0) {
    return;
  }
  
  // 기여도 계산 로직 구현
  // 활동 로그, 피어 평가 등을 종합하여 점수 계산
  
  // 기여도 순위 계산
  const sortedMembers = [...this.members].sort((a, b) => {
    return b.contribution.finalScore - a.contribution.finalScore;
  });
  
  sortedMembers.forEach((member, index) => {
    member.contribution.rank = index + 1;
    
    // 백분위 계산
    member.contribution.percentile = Math.round(
      ((this.members.length - index) / this.members.length) * 100
    );
  });
  
  return sortedMembers;
};

// 모델 생성 및 내보내기
const GroupMissionParticipation = mongoose.model('GroupMissionParticipation', GroupMissionParticipationSchema);
module.exports = GroupMissionParticipation;
