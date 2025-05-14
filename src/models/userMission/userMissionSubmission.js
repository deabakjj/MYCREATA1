/**
 * 유저 생성 미션 제출물 모델
 * 
 * 사용자가 유저 생성 미션에 제출한 내용을 관리합니다.
 * 제출 내용, 승인 상태, 평가 정보 등을 포함합니다.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * 유저 생성 미션 제출물 스키마
 */
const UserMissionSubmissionSchema = new Schema({
  // 연결된 미션
  mission: {
    type: Schema.Types.ObjectId,
    ref: 'UserMission',
    required: true,
    index: true
  },

  // 제출자
  submitter: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // 제출 내용
  content: {
    // 미션 제출 필드별 내용
    fields: [{
      // 필드 이름
      name: {
        type: String,
        required: true,
        trim: true
      },

      // 필드 타입
      type: {
        type: String,
        required: true,
        enum: ['텍스트', '장문텍스트', '이미지', '파일', '링크', '체크박스', '날짜'],
        default: '텍스트'
      },

      // 텍스트 값
      textValue: {
        type: String,
        trim: true
      },

      // 이미지 URL
      imageUrl: {
        type: String,
        trim: true
      },

      // 파일 정보
      file: {
        url: { type: String, trim: true },
        name: { type: String, trim: true },
        size: { type: Number },
        type: { type: String, trim: true }
      },

      // 링크 URL
      linkUrl: {
        type: String,
        trim: true
      },

      // 체크박스 선택 값
      checkboxValue: {
        type: Boolean
      },

      // 날짜 값
      dateValue: {
        type: Date
      }
    }],

    // 요약 (검색 및 표시용)
    summary: {
      type: String,
      trim: true
    }
  },

  // 제출 상태
  status: {
    type: String,
    required: true,
    enum: ['대기', '승인', '반려', '보류'],
    default: '대기',
    index: true
  },

  // 제출 평가
  evaluation: {
    // 평가자
    evaluator: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },

    // 평가 점수 (0~100)
    score: {
      type: Number,
      min: 0,
      max: 100
    },

    // 평가 코멘트
    comment: {
      type: String,
      trim: true
    },

    // 평가 시간
    evaluatedAt: {
      type: Date
    }
  },

  // DAO 투표 결과
  daoVote: {
    // 찬성 투표 수
    approvalCount: {
      type: Number,
      min: 0,
      default: 0
    },

    // 반대 투표 수
    rejectionCount: {
      type: Number,
      min: 0,
      default: 0
    },

    // 투표자 목록
    voters: [{
      // 투표자
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },

      // 투표 결과 (true: 찬성, false: 반대)
      approved: {
        type: Boolean
      },

      // 투표 시간
      votedAt: {
        type: Date,
        default: Date.now
      },

      // 투표 코멘트
      comment: {
        type: String,
        trim: true
      }
    }],

    // 투표 종료 시간
    endTime: {
      type: Date
    }
  },

  // 제출 공개 여부
  isPublic: {
    type: Boolean,
    default: true
  },

  // 통계
  stats: {
    // 좋아요 수
    likeCount: {
      type: Number,
      min: 0,
      default: 0
    },

    // 댓글 수
    commentCount: {
      type: Number,
      min: 0,
      default: 0
    },

    // 조회 수
    viewCount: {
      type: Number,
      min: 0,
      default: 0
    }
  },

  // 반려 이유 (반려된 경우)
  rejectionReason: {
    type: String,
    trim: true
  },

  // 보상 지급 정보
  rewards: {
    // XP 보상 지급 여부
    xpPaid: {
      type: Boolean,
      default: false
    },

    // XP 보상 지급 시간
    xpPaidAt: {
      type: Date
    },

    // XP 보상 지급 금액
    xpAmount: {
      type: Number,
      min: 0,
      default: 0
    },

    // NEST 토큰 보상 지급 여부
    tokenPaid: {
      type: Boolean,
      default: false
    },

    // NEST 토큰 보상 지급 시간
    tokenPaidAt: {
      type: Date
    },

    // NEST 토큰 보상 지급 금액
    tokenAmount: {
      type: Number,
      min: 0,
      default: 0
    },

    // NEST 토큰 보상 트랜잭션 해시
    tokenTxHash: {
      type: String,
      trim: true
    },

    // NFT 보상 지급 여부
    nftPaid: {
      type: Boolean,
      default: false
    },

    // NFT 보상 지급 시간
    nftPaidAt: {
      type: Date
    },

    // NFT ID
    nftId: {
      type: String,
      trim: true
    },

    // NFT 민팅 트랜잭션 해시
    nftTxHash: {
      type: String,
      trim: true
    },

    // 뱃지 보상 지급 여부
    badgePaid: {
      type: Boolean,
      default: false
    },

    // 뱃지 보상 지급 시간
    badgePaidAt: {
      type: Date
    },

    // 뱃지 ID
    badgeId: {
      type: Schema.Types.ObjectId,
      ref: 'Badge'
    }
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
UserMissionSubmissionSchema.pre('save', function(next) {
  // 업데이트 시간 갱신
  this.updatedAt = new Date();
  next();
});

/**
 * 인덱스 설정
 */
UserMissionSubmissionSchema.index({ mission: 1, submitter: 1 }, { unique: true });
UserMissionSubmissionSchema.index({ 'content.summary': 'text' });
UserMissionSubmissionSchema.index({ status: 1, isPublic: 1 });
UserMissionSubmissionSchema.index({ createdAt: -1 });

/**
 * 사용자별 제출물 조회
 */
UserMissionSubmissionSchema.statics.findByUser = function(userId) {
  return this.find({ submitter: userId });
};

/**
 * 미션별 제출물 조회
 */
UserMissionSubmissionSchema.statics.findByMission = function(missionId) {
  return this.find({ mission: missionId });
};

/**
 * 미션별 승인된 제출물 조회
 */
UserMissionSubmissionSchema.statics.findApprovedByMission = function(missionId) {
  return this.find({
    mission: missionId,
    status: '승인',
    isPublic: true
  });
};

/**
 * 평가 대기 중인 제출물 조회
 */
UserMissionSubmissionSchema.statics.findPendingEvaluation = function(missionId) {
  return this.find({
    mission: missionId,
    status: '대기'
  });
};

/**
 * 제출물 승인
 */
UserMissionSubmissionSchema.methods.approve = async function(evaluatorId, score, comment) {
  this.status = '승인';
  this.evaluation = {
    evaluator: evaluatorId,
    score: score || 100,
    comment: comment || '승인되었습니다.',
    evaluatedAt: new Date()
  };
  this.updatedAt = new Date();
  return this.save();
};

/**
 * 제출물 반려
 */
UserMissionSubmissionSchema.methods.reject = async function(evaluatorId, reason, score = 0) {
  this.status = '반려';
  this.rejectionReason = reason || '요구사항을 충족하지 않습니다.';
  this.evaluation = {
    evaluator: evaluatorId,
    score: score,
    comment: reason || '요구사항을 충족하지 않습니다.',
    evaluatedAt: new Date()
  };
  this.updatedAt = new Date();
  return this.save();
};

/**
 * DAO 투표 추가
 */
UserMissionSubmissionSchema.methods.addVote = async function(userId, approved, comment) {
  // 이미 투표한 사용자인지 확인
  const existingVote = this.daoVote.voters.find(
    voter => voter.user.toString() === userId.toString()
  );

  if (existingVote) {
    // 투표를 변경하는 경우
    if (existingVote.approved !== approved) {
      // 이전 투표 카운트 감소
      if (existingVote.approved) {
        this.daoVote.approvalCount -= 1;
      } else {
        this.daoVote.rejectionCount -= 1;
      }

      // 새 투표 카운트 증가
      if (approved) {
        this.daoVote.approvalCount += 1;
      } else {
        this.daoVote.rejectionCount += 1;
      }

      // 투표 정보 업데이트
      existingVote.approved = approved;
      existingVote.votedAt = new Date();
      existingVote.comment = comment;
    }
  } else {
    // 새로운 투표
    this.daoVote.voters.push({
      user: userId,
      approved,
      votedAt: new Date(),
      comment
    });

    // 투표 카운트 증가
    if (approved) {
      this.daoVote.approvalCount += 1;
    } else {
      this.daoVote.rejectionCount += 1;
    }
  }

  this.updatedAt = new Date();
  return this.save();
};

/**
 * DAO 투표 결과 처리
 */
UserMissionSubmissionSchema.methods.processVoteResult = async function(approvalThreshold) {
  const totalVotes = this.daoVote.approvalCount + this.daoVote.rejectionCount;
  
  if (totalVotes === 0) {
    return false;
  }
  
  const approvalRate = (this.daoVote.approvalCount / totalVotes) * 100;
  
  if (approvalRate >= approvalThreshold) {
    this.status = '승인';
    this.evaluation = {
      evaluator: null, // DAO 투표로 결정됨
      score: approvalRate,
      comment: `DAO 투표 결과 승인되었습니다. (찬성률: ${approvalRate.toFixed(2)}%)`,
      evaluatedAt: new Date()
    };
  } else {
    this.status = '반려';
    this.rejectionReason = `DAO 투표 결과 반려되었습니다. (찬성률: ${approvalRate.toFixed(2)}%)`;
  }
  
  this.updatedAt = new Date();
  return this.save();
};

/**
 * XP 보상 지급 처리
 */
UserMissionSubmissionSchema.methods.payXpReward = async function(amount) {
  if (this.status !== '승인') {
    throw new Error('승인된 제출물에만 보상을 지급할 수 있습니다.');
  }
  
  if (this.rewards.xpPaid) {
    throw new Error('이미 XP 보상이 지급되었습니다.');
  }
  
  this.rewards.xpPaid = true;
  this.rewards.xpPaidAt = new Date();
  this.rewards.xpAmount = amount;
  
  this.updatedAt = new Date();
  return this.save();
};

/**
 * 토큰 보상 지급 처리
 */
UserMissionSubmissionSchema.methods.payTokenReward = async function(amount, txHash) {
  if (this.status !== '승인') {
    throw new Error('승인된 제출물에만 보상을 지급할 수 있습니다.');
  }
  
  if (this.rewards.tokenPaid) {
    throw new Error('이미 토큰 보상이 지급되었습니다.');
  }
  
  this.rewards.tokenPaid = true;
  this.rewards.tokenPaidAt = new Date();
  this.rewards.tokenAmount = amount;
  this.rewards.tokenTxHash = txHash;
  
  this.updatedAt = new Date();
  return this.save();
};

/**
 * NFT 보상 지급 처리
 */
UserMissionSubmissionSchema.methods.payNftReward = async function(nftId, txHash) {
  if (this.status !== '승인') {
    throw new Error('승인된 제출물에만 보상을 지급할 수 있습니다.');
  }
  
  if (this.rewards.nftPaid) {
    throw new Error('이미 NFT 보상이 지급되었습니다.');
  }
  
  this.rewards.nftPaid = true;
  this.rewards.nftPaidAt = new Date();
  this.rewards.nftId = nftId;
  this.rewards.nftTxHash = txHash;
  
  this.updatedAt = new Date();
  return this.save();
};

/**
 * 뱃지 보상 지급 처리
 */
UserMissionSubmissionSchema.methods.payBadgeReward = async function(badgeId) {
  if (this.status !== '승인') {
    throw new Error('승인된 제출물에만 보상을 지급할 수 있습니다.');
  }
  
  if (this.rewards.badgePaid) {
    throw new Error('이미 뱃지 보상이 지급되었습니다.');
  }
  
  this.rewards.badgePaid = true;
  this.rewards.badgePaidAt = new Date();
  this.rewards.badgeId = badgeId;
  
  this.updatedAt = new Date();
  return this.save();
};

/**
 * 제출물 통계 업데이트
 */
UserMissionSubmissionSchema.methods.updateStats = async function(stats) {
  if (typeof stats !== 'object') {
    throw new Error('통계 데이터는 객체여야 합니다.');
  }
  
  // 통계 업데이트
  for (const [key, value] of Object.entries(stats)) {
    if (this.stats[key] !== undefined) {
      this.stats[key] = value;
    }
  }
  
  this.updatedAt = new Date();
  return this.save();
};

/**
 * 좋아요 수 증가
 */
UserMissionSubmissionSchema.methods.incrementLikeCount = async function() {
  this.stats.likeCount += 1;
  return this.save();
};

/**
 * 댓글 수 증가
 */
UserMissionSubmissionSchema.methods.incrementCommentCount = async function() {
  this.stats.commentCount += 1;
  return this.save();
};

/**
 * 조회 수 증가
 */
UserMissionSubmissionSchema.methods.incrementViewCount = async function() {
  this.stats.viewCount += 1;
  return this.save();
};

// 모델 생성 및 내보내기
const UserMissionSubmission = mongoose.model('UserMissionSubmission', UserMissionSubmissionSchema);
module.exports = UserMissionSubmission;
