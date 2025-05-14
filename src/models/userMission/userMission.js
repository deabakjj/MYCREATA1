/**
 * 유저 생성 미션 모델
 * 
 * 사용자가 직접 생성한 미션에 대한 정보를 관리합니다.
 * 미션 내용, 보상, 참여 조건, 상태 등을 포함합니다.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * 유저 생성 미션 스키마
 */
const UserMissionSchema = new Schema({
  // 미션 제목
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },

  // 미션 설명
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 5000
  },

  // 미션 생성자
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // 미션 카테고리
  category: {
    type: String,
    required: true,
    enum: ['창작', '학습', '운동', '환경', '사회공헌', '기술', '기타'],
    index: true
  },

  // 미션 태그 (최대 5개)
  tags: [{
    type: String,
    trim: true,
    maxlength: 20
  }],

  // 미션 난이도 (1~5)
  difficulty: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    default: 3
  },

  // 미션 이미지 URL
  imageUrl: {
    type: String,
    trim: true
  },

  // 미션 제출 형식
  submissionType: {
    type: String,
    required: true,
    enum: ['텍스트', '이미지', '파일', '링크', '체크리스트', '복합'],
    default: '텍스트'
  },

  // 미션 제출 필드 정의
  submissionFields: [{
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

    // 필드 설명
    description: {
      type: String,
      trim: true
    },

    // 필수 여부
    required: {
      type: Boolean,
      default: true
    },

    // 최대 길이 (텍스트 필드일 경우)
    maxLength: {
      type: Number
    },

    // 최소 길이 (텍스트 필드일 경우)
    minLength: {
      type: Number
    },

    // 옵션 (체크리스트일 경우)
    options: [{
      type: String,
      trim: true
    }]
  }],

  // 미션 유효 기간
  duration: {
    // 시작 날짜
    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },

    // 종료 날짜 (없으면 무기한)
    endDate: {
      type: Date
    }
  },

  // 미션 승인 방식
  approvalType: {
    type: String,
    required: true,
    enum: ['자동', '생성자', 'DAO', '투표'],
    default: '생성자'
  },

  // DAO 투표 승인에 필요한 찬성률 (%)
  approvalThreshold: {
    type: Number,
    min: 50,
    max: 100,
    default: 66
  },

  // 미션 대상 (특정 등급 이상만 참여 가능)
  targetLevel: {
    type: Number,
    min: 0,
    default: 0
  },

  // 미션 참여 제한 인원 (0이면 무제한)
  maxParticipants: {
    type: Number,
    min: 0,
    default: 0
  },

  // 미션 상태
  status: {
    type: String,
    required: true,
    enum: ['대기', '활성', '종료', '취소', '반려'],
    default: '대기',
    index: true
  },

  // 반려 사유 (관리자 또는 DAO에 의해 반려된 경우)
  rejectionReason: {
    type: String,
    trim: true
  },

  // 미션 공개 여부
  isPublic: {
    type: Boolean,
    default: true
  },

  // 미션 보상 정보
  rewards: {
    // XP 보상
    xp: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },

    // NEST 토큰 보상
    nestToken: {
      // 보상 금액
      amount: {
        type: Number,
        min: 0,
        default: 0
      },

      // 총 보상 예산 (모든 참여자에게 지급될 총 금액)
      budget: {
        type: Number,
        min: 0,
        default: 0
      },
      
      // 보상 타입 (고정, 예산)
      type: {
        type: String,
        enum: ['고정', '예산'],
        default: '고정'
      }
    },

    // NFT 보상
    nft: {
      // 보상 여부
      enabled: {
        type: Boolean,
        default: false
      },

      // NFT 컬렉션 ID
      collectionId: {
        type: Schema.Types.ObjectId,
        ref: 'NftCollection'
      },

      // NFT 메타데이터
      metadata: {
        name: { type: String, trim: true },
        description: { type: String, trim: true },
        imageUrl: { type: String, trim: true }
      }
    },

    // 뱃지 보상
    badge: {
      // 보상 여부
      enabled: {
        type: Boolean,
        default: false
      },

      // 뱃지 ID
      badgeId: {
        type: Schema.Types.ObjectId,
        ref: 'Badge'
      }
    },

    // 추가 보상 설명
    additionalRewards: {
      type: String,
      trim: true
    }
  },

  // 미션 펀딩 정보
  funding: {
    // 펀딩 활성화 여부
    enabled: {
      type: Boolean,
      default: false
    },

    // 목표 금액
    targetAmount: {
      type: Number,
      min: 0,
      default: 0
    },

    // 모금된 금액
    raisedAmount: {
      type: Number,
      min: 0,
      default: 0
    },

    // 펀딩 참여자 목록
    contributors: [{
      // 참여자
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },

      // 기여 금액
      amount: {
        type: Number,
        min: 0
      },

      // 기여 시간
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],

    // 펀딩 시작 날짜
    startDate: {
      type: Date
    },

    // 펀딩 종료 날짜
    endDate: {
      type: Date
    }
  },

  // 미션 통계
  stats: {
    // 참여자 수
    participantCount: {
      type: Number,
      min: 0,
      default: 0
    },

    // 제출 수
    submissionCount: {
      type: Number,
      min: 0,
      default: 0
    },

    // 승인된 제출 수
    approvedCount: {
      type: Number,
      min: 0,
      default: 0
    },

    // 조회 수
    viewCount: {
      type: Number,
      min: 0,
      default: 0
    },

    // 좋아요 수
    likeCount: {
      type: Number,
      min: 0,
      default: 0
    },

    // 공유 수
    shareCount: {
      type: Number,
      min: 0,
      default: 0
    }
  },

  // 미션 커뮤니티 설정
  community: {
    // 댓글 활성화 여부
    commentEnabled: {
      type: Boolean,
      default: true
    },

    // 댓글 수
    commentCount: {
      type: Number,
      min: 0,
      default: 0
    },

    // 참여자 간 결과물 공개 여부
    resultSharing: {
      type: String,
      enum: ['모두', '참여자만', '승인됨만', '비공개'],
      default: '참여자만'
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
UserMissionSchema.pre('save', function(next) {
  // 태그 최대 5개로 제한
  if (this.tags && this.tags.length > 5) {
    this.tags = this.tags.slice(0, 5);
  }

  // 업데이트 시간 갱신
  this.updatedAt = new Date();
  next();
});

/**
 * 인덱스 설정
 */
UserMissionSchema.index({ title: 'text', description: 'text', tags: 'text' });
UserMissionSchema.index({ 'duration.startDate': 1, 'duration.endDate': 1 });
UserMissionSchema.index({ isPublic: 1, status: 1 });

/**
 * 활성 미션 조회
 */
UserMissionSchema.statics.findActive = function() {
  return this.find({
    status: '활성',
    isPublic: true,
    $or: [
      { 'duration.endDate': { $gt: new Date() } },
      { 'duration.endDate': null }
    ]
  });
};

/**
 * 인기 미션 조회
 */
UserMissionSchema.statics.findPopular = function(limit = 10) {
  return this.find({
    status: '활성',
    isPublic: true,
    $or: [
      { 'duration.endDate': { $gt: new Date() } },
      { 'duration.endDate': null }
    ]
  })
  .sort({ 'stats.participantCount': -1, 'stats.viewCount': -1 })
  .limit(limit);
};

/**
 * 유저별 미션 조회
 */
UserMissionSchema.statics.findByUser = function(userId) {
  return this.find({ creator: userId });
};

/**
 * 카테고리별 미션 조회
 */
UserMissionSchema.statics.findByCategory = function(category) {
  return this.find({
    category,
    status: '활성',
    isPublic: true,
    $or: [
      { 'duration.endDate': { $gt: new Date() } },
      { 'duration.endDate': null }
    ]
  });
};

/**
 * 태그별 미션 조회
 */
UserMissionSchema.statics.findByTag = function(tag) {
  return this.find({
    tags: tag,
    status: '활성',
    isPublic: true,
    $or: [
      { 'duration.endDate': { $gt: new Date() } },
      { 'duration.endDate': null }
    ]
  });
};

/**
 * 미션 활성화
 */
UserMissionSchema.methods.activate = async function() {
  this.status = '활성';
  this.updatedAt = new Date();
  return this.save();
};

/**
 * 미션 종료
 */
UserMissionSchema.methods.complete = async function() {
  this.status = '종료';
  this.updatedAt = new Date();
  return this.save();
};

/**
 * 미션 취소
 */
UserMissionSchema.methods.cancel = async function(reason) {
  this.status = '취소';
  this.rejectionReason = reason;
  this.updatedAt = new Date();
  return this.save();
};

/**
 * 미션 반려
 */
UserMissionSchema.methods.reject = async function(reason) {
  this.status = '반려';
  this.rejectionReason = reason;
  this.updatedAt = new Date();
  return this.save();
};

/**
 * 미션 펀딩 추가
 */
UserMissionSchema.methods.addFunding = async function(userId, amount) {
  // 펀딩이 활성화되어 있지 않으면 에러
  if (!this.funding.enabled) {
    throw new Error('미션 펀딩이 활성화되어 있지 않습니다.');
  }

  // 펀딩 기간이 아니면 에러
  const now = new Date();
  if (this.funding.startDate && now < this.funding.startDate) {
    throw new Error('미션 펀딩이 아직 시작되지 않았습니다.');
  }
  if (this.funding.endDate && now > this.funding.endDate) {
    throw new Error('미션 펀딩이 종료되었습니다.');
  }

  // 펀딩 추가
  this.funding.contributors.push({
    user: userId,
    amount,
    timestamp: now
  });

  // 모금액 업데이트
  this.funding.raisedAmount += amount;

  // 저장
  return this.save();
};

/**
 * 통계 업데이트
 */
UserMissionSchema.methods.updateStats = async function(stats) {
  if (typeof stats !== 'object') {
    throw new Error('통계 데이터는 객체여야 합니다.');
  }

  // 통계 업데이트
  for (const [key, value] of Object.entries(stats)) {
    if (this.stats[key] !== undefined) {
      this.stats[key] = value;
    }
  }

  // 저장
  return this.save();
};

/**
 * 참여자 수 증가
 */
UserMissionSchema.methods.incrementParticipantCount = async function() {
  this.stats.participantCount += 1;
  return this.save();
};

/**
 * 제출 수 증가
 */
UserMissionSchema.methods.incrementSubmissionCount = async function() {
  this.stats.submissionCount += 1;
  return this.save();
};

/**
 * 승인된 제출 수 증가
 */
UserMissionSchema.methods.incrementApprovedCount = async function() {
  this.stats.approvedCount += 1;
  return this.save();
};

/**
 * 조회 수 증가
 */
UserMissionSchema.methods.incrementViewCount = async function() {
  this.stats.viewCount += 1;
  return this.save();
};

/**
 * 좋아요 수 증가
 */
UserMissionSchema.methods.incrementLikeCount = async function() {
  this.stats.likeCount += 1;
  return this.save();
};

/**
 * 공유 수 증가
 */
UserMissionSchema.methods.incrementShareCount = async function() {
  this.stats.shareCount += 1;
  return this.save();
};

/**
 * 댓글 수 증가
 */
UserMissionSchema.methods.incrementCommentCount = async function() {
  this.community.commentCount += 1;
  return this.save();
};

// 모델 생성 및 내보내기
const UserMission = mongoose.model('UserMission', UserMissionSchema);
module.exports = UserMission;
