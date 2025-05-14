/**
 * Relay Transaction 모델
 * 
 * Nest Relay를 통한 거래 요청 및 서명을 관리합니다.
 * 외부 DApp의 서명 요청과 사용자의 승인/거부 내역을 저장합니다.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Relay Transaction 스키마
 */
const RelayTransactionSchema = new Schema({
  // 연결 정보
  connection: {
    type: Schema.Types.ObjectId,
    ref: 'RelayConnection',
    required: true,
    index: true
  },

  // 사용자 정보
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // 트랜잭션 고유 ID
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // 요청 유형
  requestType: {
    type: String,
    enum: ['signMessage', 'signTransaction', 'personalSign', 'signTypedData'],
    required: true
  },

  // 요청 데이터
  requestData: {
    // 서명 대상 원본 데이터
    raw: {
      type: String,
      required: true
    },

    // 서명 유형 (EIP-712 등)
    signatureType: {
      type: String,
      default: 'standard'
    },

    // 요청 체인 ID
    chainId: {
      type: Number
    },

    // 트랜잭션 상세 (거래인 경우)
    transaction: {
      // 송신자 주소
      from: {
        type: String,
        trim: true
      },

      // 수신자 주소
      to: {
        type: String,
        trim: true
      },

      // 값 (ETH/CTA)
      value: {
        type: String,
        trim: true
      },

      // 가스 한도
      gasLimit: {
        type: String,
        trim: true
      },

      // 가스 가격
      gasPrice: {
        type: String,
        trim: true
      },

      // 컨트랙트 입력 데이터
      data: {
        type: String,
        trim: true
      },

      // 논스
      nonce: {
        type: Number
      }
    },

    // 사람이 읽을 수 있는 설명
    humanReadable: {
      // 작업 유형 (예: 토큰 전송, 컨트랙트 호출 등)
      actionType: {
        type: String,
        trim: true
      },

      // 작업 설명
      actionDescription: {
        type: String,
        trim: true
      },

      // 금액 (사람이 읽을 수 있는 형식)
      amount: {
        type: String,
        trim: true
      },

      // 자산 유형 (CTA, NEST, NFT 등)
      assetType: {
        type: String,
        trim: true
      }
    }
  },

  // 요청 상태
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'expired', 'completed', 'failed'],
    default: 'pending',
    index: true
  },

  // 서명 결과
  signatureResult: {
    // 서명 데이터
    signature: {
      type: String,
      trim: true
    },

    // 오류 메시지 (실패 시)
    error: {
      type: String,
      trim: true
    }
  },

  // 위험 평가 (0-100, 높을수록 위험)
  riskAssessment: {
    score: {
      type: Number,
      default: 0
    },

    // 위험 요소
    factors: [{
      name: {
        type: String,
        trim: true
      },
      description: {
        type: String,
        trim: true
      },
      severity: {
        type: Number,
        min: 0,
        max: 100
      }
    }]
  },

  // 메타데이터
  metadata: {
    // DApp 도메인
    dappDomain: {
      type: String,
      trim: true
    },

    // 요청 IP
    requestIp: {
      type: String,
      trim: true
    },

    // 요청 에이전트
    userAgent: {
      type: String,
      trim: true
    },

    // 요청 기기
    device: {
      type: String,
      trim: true
    }
  },

  // 자동 승인 여부
  autoApproved: {
    type: Boolean,
    default: false
  },

  // 가스 대납 사용 여부
  gaslessTransaction: {
    type: Boolean,
    default: false
  },

  // 처리 시간 정보
  timestamps: {
    // 요청 시간
    requested: {
      type: Date,
      default: Date.now,
      required: true
    },

    // 만료 시간 (자동 취소)
    expiresAt: {
      type: Date,
      required: true
    },

    // 응답 시간 (승인 또는 거부)
    responded: {
      type: Date
    },

    // 완료 시간 (블록체인에 기록됨)
    completed: {
      type: Date
    }
  },

  // 블록체인 기록 정보
  blockchain: {
    // 트랜잭션 해시
    txHash: {
      type: String,
      trim: true,
      index: true
    },

    // 블록 번호
    blockNumber: {
      type: Number
    },

    // 확인 수
    confirmations: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

/**
 * 저장 전 훅
 */
RelayTransactionSchema.pre('save', function(next) {
  // 트랜잭션 ID가 없는 경우 생성
  if (!this.transactionId) {
    this.transactionId = mongoose.Types.ObjectId().toString();
  }

  // 만료 시간 설정 (기본 10분)
  if (!this.timestamps.expiresAt) {
    this.timestamps.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  }

  next();
});

/**
 * 트랜잭션 승인
 * 
 * @param {string} signature - 서명 데이터
 * @returns {Promise<Object>} 업데이트된 트랜잭션
 */
RelayTransactionSchema.methods.approve = async function(signature) {
  // 만료 확인
  if (new Date() > new Date(this.timestamps.expiresAt)) {
    this.status = 'expired';
    return this.save();
  }

  // 승인 처리
  this.status = 'approved';
  this.signatureResult.signature = signature;
  this.timestamps.responded = new Date();
  this.autoApproved = false;

  return this.save();
};

/**
 * 트랜잭션 자동 승인
 * 
 * @param {string} signature - 서명 데이터
 * @returns {Promise<Object>} 업데이트된 트랜잭션
 */
RelayTransactionSchema.methods.autoApprove = async function(signature) {
  // 만료 확인
  if (new Date() > new Date(this.timestamps.expiresAt)) {
    this.status = 'expired';
    return this.save();
  }

  // 자동 승인 처리
  this.status = 'approved';
  this.signatureResult.signature = signature;
  this.timestamps.responded = new Date();
  this.autoApproved = true;

  return this.save();
};

/**
 * 트랜잭션 거부
 * 
 * @param {string} reason - 거부 사유
 * @returns {Promise<Object>} 업데이트된 트랜잭션
 */
RelayTransactionSchema.methods.reject = async function(reason) {
  // 만료 확인
  if (new Date() > new Date(this.timestamps.expiresAt)) {
    this.status = 'expired';
    return this.save();
  }

  // 거부 처리
  this.status = 'rejected';
  this.signatureResult.error = reason || 'User rejected request';
  this.timestamps.responded = new Date();

  return this.save();
};

/**
 * 트랜잭션 완료 처리
 * 
 * @param {string} txHash - 블록체인 트랜잭션 해시
 * @param {number} blockNumber - 블록 번호
 * @returns {Promise<Object>} 업데이트된 트랜잭션
 */
RelayTransactionSchema.methods.complete = async function(txHash, blockNumber) {
  this.status = 'completed';
  this.blockchain.txHash = txHash;
  this.blockchain.blockNumber = blockNumber;
  this.blockchain.confirmations = 1;
  this.timestamps.completed = new Date();

  return this.save();
};

/**
 * 트랜잭션 실패 처리
 * 
 * @param {string} error - 오류 메시지
 * @returns {Promise<Object>} 업데이트된 트랜잭션
 */
RelayTransactionSchema.methods.fail = async function(error) {
  this.status = 'failed';
  this.signatureResult.error = error || 'Transaction failed';
  
  // 이미 응답이 있었으면 완료 시간 설정, 없었으면 응답 시간도 설정
  if (!this.timestamps.responded) {
    this.timestamps.responded = new Date();
  }
  
  this.timestamps.completed = new Date();

  return this.save();
};

/**
 * 확인 수 업데이트
 * 
 * @param {number} confirmations - 확인 수
 * @returns {Promise<Object>} 업데이트된 트랜잭션
 */
RelayTransactionSchema.methods.updateConfirmations = async function(confirmations) {
  this.blockchain.confirmations = confirmations;
  return this.save();
};

/**
 * 미처리 트랜잭션 찾기
 */
RelayTransactionSchema.statics.findPending = function() {
  return this.find({
    status: 'pending',
    'timestamps.expiresAt': { $gt: new Date() }
  }).sort({ 'timestamps.requested': 1 });
};

/**
 * 만료된 트랜잭션 찾기
 */
RelayTransactionSchema.statics.findExpired = function() {
  return this.find({
    status: 'pending',
    'timestamps.expiresAt': { $lte: new Date() }
  });
};

/**
 * 사용자별 트랜잭션 찾기
 * 
 * @param {ObjectId} userId - 사용자 ID
 * @param {Object} query - 추가 쿼리 조건
 */
RelayTransactionSchema.statics.findByUser = function(userId, query = {}) {
  return this.find({
    user: userId,
    ...query
  }).sort({ 'timestamps.requested': -1 });
};

/**
 * 연결별 트랜잭션 찾기
 * 
 * @param {ObjectId} connectionId - 연결 ID
 * @param {Object} query - 추가 쿼리 조건
 */
RelayTransactionSchema.statics.findByConnection = function(connectionId, query = {}) {
  return this.find({
    connection: connectionId,
    ...query
  }).sort({ 'timestamps.requested': -1 });
};

// 모델 생성 및 내보내기
const RelayTransaction = mongoose.model('RelayTransaction', RelayTransactionSchema);
module.exports = RelayTransaction;
