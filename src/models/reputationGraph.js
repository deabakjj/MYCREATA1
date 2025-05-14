/**
 * 평판 그래프 모델
 * 
 * 사용자의 온체인 활동 기반 평판 그래프 데이터를 저장하는 모델입니다.
 * 활동 내역, 연결, 평판 점수 등을 포함합니다.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * 평판 그래프 노드 스키마
 * 사용자, 미션, 커뮤니티 등의 엔티티를 나타냅니다.
 */
const ReputationNodeSchema = new Schema({
  // 노드 유형 (사용자, 미션, 커뮤니티, 태그 등)
  type: {
    type: String,
    required: true,
    enum: ['사용자', '미션', '커뮤니티', '태그', '활동'],
    index: true
  },

  // 노드 ID (실제 엔티티 참조)
  entityId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'entityType',
    index: true
  },

  // 참조 엔티티 모델명
  entityType: {
    type: String,
    required: true,
    enum: ['User', 'UserMission', 'Community', 'Tag', 'Activity'],
    index: true
  },

  // 노드 메타데이터
  metadata: {
    // 노드 표시 이름
    name: {
      type: String,
      required: true,
      trim: true
    },

    // 노드 설명
    description: {
      type: String,
      trim: true
    },

    // 노드 이미지 URL
    imageUrl: {
      type: String
    },

    // 기타 메타데이터 (노드 유형별 속성)
    attributes: {
      type: Map,
      of: Schema.Types.Mixed,
      default: new Map()
    }
  },

  // 노드 중요도 가중치 (0.0 ~ 1.0, 높을수록 중요)
  weight: {
    type: Number,
    required: true,
    default: 0.5,
    min: 0,
    max: 1
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
 * 평판 그래프 엣지(연결) 스키마
 * 노드 간의 관계를 나타냅니다.
 */
const ReputationEdgeSchema = new Schema({
  // 출발 노드
  source: {
    type: Schema.Types.ObjectId,
    ref: 'ReputationNode',
    required: true,
    index: true
  },

  // 도착 노드
  target: {
    type: Schema.Types.ObjectId,
    ref: 'ReputationNode',
    required: true,
    index: true
  },

  // 연결 유형 (참여, 생성, 댓글, 평가 등)
  type: {
    type: String,
    required: true,
    enum: ['참여', '생성', '댓글', '평가', '좋아요', '팔로우', '투표', '연관'],
    index: true
  },

  // 연결 강도 (0.0 ~ 1.0, 높을수록 강함)
  strength: {
    type: Number,
    required: true,
    default: 0.5,
    min: 0,
    max: 1
  },

  // 방향성 (단방향 또는 양방향)
  directed: {
    type: Boolean,
    default: true
  },

  // 연결 메타데이터
  metadata: {
    // 연결 설명
    description: {
      type: String,
      trim: true
    },

    // 연결 생성 기준 활동
    activityId: {
      type: Schema.Types.ObjectId,
      ref: 'Activity'
    },

    // 기타 메타데이터 (연결 유형별 속성)
    attributes: {
      type: Map,
      of: Schema.Types.Mixed,
      default: new Map()
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
 * 사용자 평판 점수 스키마
 * 특정 영역에 대한 사용자 평판 점수를 저장합니다.
 */
const UserReputationScoreSchema = new Schema({
  // 사용자 ID
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // 평판 영역 (전반적, 커뮤니티, 미션 등)
  domain: {
    type: String,
    required: true,
    enum: ['전반적', '커뮤니티', '미션', '콘텐츠', '신뢰도'],
    default: '전반적',
    index: true
  },

  // 세부 영역 (특정 태그, 카테고리 등)
  subDomain: {
    type: String,
    index: true
  },

  // 평판 점수 (0 ~ 100)
  score: {
    type: Number,
    required: true,
    default: 50,
    min: 0,
    max: 100
  },

  // 신뢰도 수준 (0.0 ~ 1.0, 높을수록 신뢰도 높음)
  confidence: {
    type: Number,
    required: true,
    default: 0.5,
    min: 0,
    max: 1
  },

  // 점수 계산 요소 (가중치 적용된 기여 요소들)
  factors: [{
    // 요소 이름
    name: {
      type: String,
      required: true
    },

    // 요소 설명
    description: {
      type: String
    },

    // 요소 점수 기여도
    contribution: {
      type: Number,
      required: true
    },

    // 요소 가중치
    weight: {
      type: Number,
      required: true,
      default: 1
    }
  }],

  // 계산 기준 시간
  calculatedAt: {
    type: Date,
    default: Date.now
  },

  // 메타데이터
  metadata: {
    type: Map,
    of: Schema.Types.Mixed,
    default: new Map()
  }
}, {
  timestamps: true
});

/**
 * 평판 그래프 계산 작업 스키마
 * 평판 그래프 분석 및 계산 작업 정보를 저장합니다.
 */
const ReputationComputationSchema = new Schema({
  // 계산 유형 (전체, 사용자별, 도메인별)
  type: {
    type: String,
    required: true,
    enum: ['전체', '사용자별', '도메인별'],
    default: '전체'
  },

  // 계산 대상 (사용자별 또는 도메인별 계산 시)
  target: {
    type: Schema.Types.ObjectId,
    refPath: 'targetType'
  },

  // 대상 참조 타입 (User, Domain 등)
  targetType: {
    type: String,
    enum: ['User', 'Domain']
  },

  // 계산 상태
  status: {
    type: String,
    required: true,
    enum: ['대기중', '진행중', '완료', '실패'],
    default: '대기중',
    index: true
  },

  // 계산 시작 시간
  startedAt: {
    type: Date
  },

  // 계산 완료 시간
  completedAt: {
    type: Date
  },

  // 계산 매개변수
  parameters: {
    type: Map,
    of: Schema.Types.Mixed,
    default: new Map()
  },

  // 계산 결과 요약
  result: {
    // 처리된 노드 수
    processedNodes: {
      type: Number,
      default: 0
    },

    // 처리된 엣지 수
    processedEdges: {
      type: Number,
      default: 0
    },

    // 생성된 점수 수
    generatedScores: {
      type: Number,
      default: 0
    },

    // 계산 성능 통계
    performance: {
      type: Map,
      of: Number,
      default: new Map()
    }
  },

  // 오류 정보 (실패한 경우)
  error: {
    message: String,
    stack: String,
    details: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// 컬렉션 인덱스 설정
ReputationNodeSchema.index({ type: 1, 'metadata.name': 1 });
ReputationNodeSchema.index({ entityId: 1, entityType: 1 }, { unique: true });
ReputationEdgeSchema.index({ source: 1, target: 1, type: 1 }, { unique: true });
UserReputationScoreSchema.index({ user: 1, domain: 1, subDomain: 1 }, { unique: true });
ReputationComputationSchema.index({ status: 1, createdAt: -1 });

// 모델 생성
const ReputationNode = mongoose.model('ReputationNode', ReputationNodeSchema);
const ReputationEdge = mongoose.model('ReputationEdge', ReputationEdgeSchema);
const UserReputationScore = mongoose.model('UserReputationScore', UserReputationScoreSchema);
const ReputationComputation = mongoose.model('ReputationComputation', ReputationComputationSchema);

// 모델 내보내기
module.exports = {
  ReputationNode,
  ReputationEdge,
  UserReputationScore,
  ReputationComputation
};
