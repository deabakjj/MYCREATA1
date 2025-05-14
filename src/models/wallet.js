/**
 * @file 지갑 모델
 * @description 사용자 지갑 정보를 저장하는 MongoDB 스키마 및 모델 정의
 */

const mongoose = require('mongoose');

/**
 * 지갑 스키마 정의
 */
const walletSchema = new mongoose.Schema(
  {
    // 사용자 ID (User 모델 참조)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    // 지갑 주소
    address: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    
    // 지갑 주소를 생성한 방법
    creationMethod: {
      type: String,
      enum: ['auto', 'import', 'connect'],
      default: 'auto',
    },
    
    // 지갑 ID (.nest 도메인)
    nestId: {
      type: String,
      unique: true,
      sparse: true, // null 값 허용
      trim: true,
    },
    
    // 암호화된 개인키 (AA 지갑 생성 시)
    encryptedPrivateKey: {
      type: String,
      select: false, // 쿼리 결과에 암호화된 개인키 제외
    },
    
    // 지갑 상태
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    
    // NFT 보유 정보
    nfts: [
      {
        tokenId: {
          type: String,
          required: true,
        },
        contractAddress: {
          type: String,
          required: true,
        },
        tokenType: {
          type: String,
          enum: ['attendance', 'comment', 'level', 'mission', 'badge', 'other'],
          default: 'other',
        },
        metadata: {
          type: mongoose.Schema.Types.Mixed,
        },
        acquiredAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    
    // 토큰 보유량
    tokenBalances: {
      nest: {
        type: Number,
        default: 0,
      },
      cta: {
        type: Number,
        default: 0,
      },
    },
    
    // 토큰 트랜잭션 내역
    transactions: [
      {
        txHash: {
          type: String,
        },
        type: {
          type: String,
          enum: ['send', 'receive', 'swap', 'mint', 'burn', 'reward'],
          required: true,
        },
        token: {
          type: String,
          enum: ['NEST', 'CTA'],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        from: {
          type: String,
        },
        to: {
          type: String,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ['pending', 'confirmed', 'failed'],
          default: 'pending',
        },
        description: {
          type: String,
        },
      },
    ],
    
    // 화이트리스트 상태
    isWhitelisted: {
      type: Boolean,
      default: false,
    },
    
    // 일일 스왑 한도
    dailySwapLimit: {
      type: Number,
      default: 1000, // CTA 기준
    },
    
    // 마지막 스왑 정보
    lastSwap: {
      date: Date,
      amount: Number,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt 자동 생성
  }
);

/**
 * 인덱스 생성
 */
walletSchema.index({ user: 1 });
walletSchema.index({ address: 1 });
walletSchema.index({ nestId: 1 });

/**
 * NFT 추가 메서드
 * 
 * @param {Object} nft - NFT 정보
 * @returns {Promise} 저장된 지갑 객체
 */
walletSchema.methods.addNFT = async function(nft) {
  this.nfts.push(nft);
  return this.save();
};

/**
 * 토큰 잔액 업데이트 메서드
 * 
 * @param {string} token - 토큰 유형 (NEST 또는 CTA)
 * @param {number} amount - 변경할 금액
 * @returns {Object} 업데이트된 잔액 정보
 */
walletSchema.methods.updateBalance = async function(token, amount) {
  if (token.toUpperCase() === 'NEST') {
    this.tokenBalances.nest += amount;
  } else if (token.toUpperCase() === 'CTA') {
    this.tokenBalances.cta += amount;
  } else {
    throw new Error('지원하지 않는 토큰 유형입니다.');
  }
  
  await this.save();
  
  return {
    nest: this.tokenBalances.nest,
    cta: this.tokenBalances.cta,
  };
};

/**
 * 트랜잭션 추가 메서드
 * 
 * @param {Object} transaction - 트랜잭션 정보
 * @returns {Promise} 저장된 지갑 객체
 */
walletSchema.methods.addTransaction = async function(transaction) {
  this.transactions.push(transaction);
  return this.save();
};

/**
 * 일일 스왑 한도 확인 메서드
 * 
 * @param {number} amount - 스왑할 CTA 양
 * @returns {Object} 한도 확인 결과
 */
walletSchema.methods.checkDailySwapLimit = function(amount) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let dailySwapped = 0;
  
  // 오늘 스왑한 양 계산
  if (this.lastSwap && this.lastSwap.date) {
    const lastSwapDate = new Date(this.lastSwap.date);
    lastSwapDate.setHours(0, 0, 0, 0);
    
    if (lastSwapDate.getTime() === today.getTime()) {
      dailySwapped = this.lastSwap.amount;
    }
  }
  
  // 한도 초과 여부 확인
  const remaining = this.dailySwapLimit - dailySwapped;
  const canSwap = remaining >= amount;
  
  return {
    canSwap,
    dailyLimit: this.dailySwapLimit,
    used: dailySwapped,
    remaining,
    requested: amount,
  };
};

// 지갑 모델 생성 및 내보내기
const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
