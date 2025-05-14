/**
 * Relay Connection 모델
 * 
 * 외부 DApp과 Nest 플랫폼 간의 연결을 관리합니다.
 * 이 모델을 통해 사용자가 외부 DApp에서 자신의 .nest ID와 지갑을 안전하게 사용할 수 있습니다.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const crypto = require('crypto');

/**
 * Relay Connection 스키마
 */
const RelayConnectionSchema = new Schema({
  // 연결 키 (외부 DApp에서 사용)
  connectionKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // 연결 이름 (사용자가 인식하기 쉬운 이름)
  name: {
    type: String,
    required: true,
    trim: true
  },

  // 연결된 사용자
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // 연결된 Nest ID
  nestId: {
    type: Schema.Types.ObjectId,
    ref: 'NestId',
    required: true
  },

  // 연결된 지갑
  wallet: {
    type: Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true
  },

  // 연결된 외부 DApp 정보
  dapp: {
    // DApp ID (등록된 경우)
    id: {
      type: String,
      index: true
    },

    // DApp 이름
    name: {
      type: String,
      required: true,
      trim: true
    },

    // DApp 도메인
    domain: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    // DApp 로고 URL
    logoUrl: {
      type: String,
      trim: true
    },

    // DApp 설명
    description: {
      type: String,
      trim: true
    },

    // 등록 여부 (검증된 DApp인지)
    registered: {
      type: Boolean,
      default: false
    }
  },

  // 연결 상태
  status: {
    type: String,
    enum: ['active', 'revoked', 'expired'],
    default: 'active',
    index: true
  },

  // 접근 권한 설정
  permissions: {
    // Nest ID 읽기 권한
    readNestId: {
      type: Boolean,
      default: true
    },

    // 지갑 주소 읽기 권한
    readWalletAddress: {
      type: Boolean,
      default: true
    },

    // 지갑 잔액 읽기 권한
    readWalletBalance: {
      type: Boolean,
      default: false
    },

    // 거래 서명 요청 권한
    requestSignature: {
      type: Boolean,
      default: false
    },

    // 자동 거래 서명 권한 (특정 조건에서)
    autoSign: {
      type: Boolean,
      default: false
    },

    // 자동 서명 가능한 최대 금액 (CTA)
    autoSignMaxAmount: {
      type: Number,
      default: 0
    },

    // 수수료 대납 사용 권한
    useGasless: {
      type: Boolean,
      default: false
    },

    // 사용자 프로필 읽기 권한
    readUserProfile: {
      type: Boolean,
      default: false
    }
  },

  // 연결 메타데이터
  metadata: {
    // 사용자 IP
    userIp: {
      type: String,
      trim: true
    },

    // 사용자 에이전트
    userAgent: {
      type: String,
      trim: true
    },

    // 기기 정보
    device: {
      type: String,
      trim: true
    }
  },

  // 연결 통계
  stats: {
    // 연결 사용 횟수
    usageCount: {
      type: Number,
      default: 0
    },

    // 마지막 사용 시간
    lastUsed: {
      type: Date
    },

    // 서명 요청 횟수
    signatureRequests: {
      type: Number,
      default: 0
    },

    // 서명 승인 횟수
    signatureApprovals: {
      type: Number,
      default: 0
    },

    // 서명 거부 횟수
    signatureRejections: {
      type: Number,
      default: 0
    }
  },

  // 세션 관리
  session: {
    // 연결 만료 시간 (없으면 영구 연결)
    expiresAt: {
      type: Date
    },

    // 인증 토큰
    token: {
      type: String,
      trim: true
    },

    // 새로고침 토큰
    refreshToken: {
      type: String,
      trim: true
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
RelayConnectionSchema.pre('save', function(next) {
  // 최초 저장 시 connectionKey 생성
  if (!this.connectionKey) {
    this.connectionKey = crypto.randomBytes(32).toString('hex');
  }

  this.updatedAt = new Date();
  next();
});

/**
 * 연결 사용 로깅
 */
RelayConnectionSchema.methods.logUsage = async function() {
  this.stats.usageCount += 1;
  this.stats.lastUsed = new Date();
  return this.save();
};

/**
 * 서명 요청 로깅
 */
RelayConnectionSchema.methods.logSignatureRequest = async function(approved) {
  this.stats.signatureRequests += 1;
  
  if (approved) {
    this.stats.signatureApprovals += 1;
  } else {
    this.stats.signatureRejections += 1;
  }
  
  return this.save();
};

/**
 * 연결 활성 상태 확인
 */
RelayConnectionSchema.methods.isActive = function() {
  if (this.status !== 'active') {
    return false;
  }

  if (this.session.expiresAt && new Date() > new Date(this.session.expiresAt)) {
    return false;
  }

  return true;
};

/**
 * 연결 갱신
 */
RelayConnectionSchema.methods.renew = async function(expiresIn) {
  // 만료 시간 설정 (expiresIn은 밀리초 단위)
  if (expiresIn) {
    this.session.expiresAt = new Date(Date.now() + expiresIn);
  } else {
    // 기본 30일
    this.session.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  // 토큰 갱신
  this.session.token = crypto.randomBytes(32).toString('hex');
  this.session.refreshToken = crypto.randomBytes(32).toString('hex');

  // 상태 업데이트
  this.status = 'active';
  this.updatedAt = new Date();

  return this.save();
};

/**
 * 연결 철회
 */
RelayConnectionSchema.methods.revoke = async function() {
  this.status = 'revoked';
  this.updatedAt = new Date();
  return this.save();
};

/**
 * 특정 도메인의 활성 연결 찾기
 */
RelayConnectionSchema.statics.findActiveByDomain = function(domain, userId) {
  return this.find({
    'dapp.domain': domain,
    'user': userId,
    'status': 'active',
    $or: [
      { 'session.expiresAt': { $gt: new Date() } },
      { 'session.expiresAt': null }
    ]
  });
};

/**
 * 사용자의 모든 활성 연결 조회
 */
RelayConnectionSchema.statics.findActiveByUser = function(userId) {
  return this.find({
    'user': userId,
    'status': 'active',
    $or: [
      { 'session.expiresAt': { $gt: new Date() } },
      { 'session.expiresAt': null }
    ]
  });
};

/**
 * 연결 키로 활성 연결 찾기
 */
RelayConnectionSchema.statics.findActiveByKey = function(connectionKey) {
  return this.findOne({
    'connectionKey': connectionKey,
    'status': 'active',
    $or: [
      { 'session.expiresAt': { $gt: new Date() } },
      { 'session.expiresAt': null }
    ]
  });
};

// 모델 생성 및 내보내기
const RelayConnection = mongoose.model('RelayConnection', RelayConnectionSchema);
module.exports = RelayConnection;
