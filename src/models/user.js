/**
 * @file 사용자 모델
 * @description 사용자 정보를 저장하는 MongoDB 스키마 및 모델 정의
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * 사용자 스키마 정의
 */
const userSchema = new mongoose.Schema(
  {
    // 기본 사용자 정보
    name: {
      type: String,
      required: [true, '이름은 필수 항목입니다.'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, '이메일은 필수 항목입니다.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        '유효한 이메일 주소를 입력하세요.',
      ],
    },
    password: {
      type: String,
      select: false, // 쿼리 결과에 비밀번호 제외
    },
    profileImage: {
      type: String,
      default: 'default.png',
    },
    
    // 사용자 역할 및 상태
    role: {
      type: String,
      enum: ['user', 'admin', 'moderator'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    
    // 소셜 로그인 정보
    socialProvider: {
      type: String,
      enum: ['local', 'google', 'kakao', 'apple'],
      default: 'local',
    },
    socialId: {
      type: String,
    },
    
    // 지갑 정보
    wallet: {
      address: {
        type: String,
        unique: true,
        sparse: true, // null 값 허용
      },
      nestId: {
        type: String,
        unique: true,
        sparse: true, // null 값 허용
      },
      createdAt: {
        type: Date,
      },
    },
    
    // XP 및 레벨 정보
    xp: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    
    // 활동 통계
    stats: {
      attendance: {
        lastCheckIn: Date,
        totalDays: {
          type: Number,
          default: 0,
        },
        streak: {
          type: Number,
          default: 0,
        },
      },
      missions: {
        completed: {
          type: Number,
          default: 0,
        },
        created: {
          type: Number,
          default: 0,
        },
      },
      comments: {
        count: {
          type: Number,
          default: 0,
        },
      },
      nfts: {
        owned: {
          type: Number,
          default: 0,
        },
      },
      tokenBalance: {
        type: Number,
        default: 0,
      },
    },
    
    // 마지막 토큰 보상 시간
    lastReward: {
      type: Date,
    },
    
    // 리프레시 토큰
    refreshToken: {
      type: String,
      select: false, // 쿼리 결과에 리프레시 토큰 제외
    },
    
    // 비밀번호 재설정 관련
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true, // createdAt, updatedAt 자동 생성
    toJSON: { virtuals: true }, // JSON 변환 시 가상 필드 포함
    toObject: { virtuals: true }, // 객체 변환 시 가상 필드 포함
  }
);

/**
 * 가상 필드: 사용자 풀네임
 */
userSchema.virtual('fullName').get(function() {
  return this.name;
});

/**
 * 저장 전 비밀번호 해싱
 */
userSchema.pre('save', async function(next) {
  // 비밀번호가 변경되지 않았으면 다음 미들웨어로
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // 소셜 로그인 사용자는 비밀번호 해시 안 함
    if (this.socialProvider !== 'local' && !this.password) {
      return next();
    }
    
    // 비밀번호 해시 생성
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * 비밀번호 일치 검사 메서드
 * @param {string} enteredPassword - 입력된 비밀번호
 * @returns {boolean} 비밀번호 일치 여부
 */
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * XP 추가 및 레벨업 처리 메서드
 * @param {number} amount - 추가할 XP 양
 * @returns {Object} 업데이트된 XP 및 레벨 정보
 */
userSchema.methods.addXP = async function(amount) {
  this.xp += amount;
  
  // 레벨업 계산 (간단한 레벨업 공식 사용)
  const newLevel = Math.floor(Math.sqrt(this.xp / 100)) + 1;
  
  // 레벨업 여부 확인
  const didLevelUp = newLevel > this.level;
  
  // 레벨 업데이트
  this.level = newLevel;
  
  // 변경사항 저장
  await this.save();
  
  return {
    currentXP: this.xp,
    currentLevel: this.level,
    xpAdded: amount,
    didLevelUp,
  };
};

/**
 * 출석 체크 처리 메서드
 * @returns {Object} 업데이트된 출석 정보
 */
userSchema.methods.checkAttendance = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastCheckIn = this.stats.attendance.lastCheckIn;
  
  // 오늘 이미 출석했으면 false 반환
  if (lastCheckIn && lastCheckIn.setHours(0, 0, 0, 0).getTime() === today.getTime()) {
    return {
      success: false,
      message: '오늘 이미 출석했습니다.',
      attendance: this.stats.attendance,
    };
  }
  
  // 연속 출석 계산
  let newStreak = 1; // 기본값은 1 (오늘 하루)
  
  if (lastCheckIn) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // 어제 출석했으면 스트릭 증가
    if (lastCheckIn.setHours(0, 0, 0, 0).getTime() === yesterday.getTime()) {
      newStreak = this.stats.attendance.streak + 1;
    }
  }
  
  // 출석 정보 업데이트
  this.stats.attendance.lastCheckIn = today;
  this.stats.attendance.totalDays += 1;
  this.stats.attendance.streak = newStreak;
  
  // 변경사항 저장
  await this.save();
  
  return {
    success: true,
    message: '출석이 완료되었습니다.',
    attendance: this.stats.attendance,
  };
};

// 사용자 모델 생성 및 내보내기
const User = mongoose.model('User', userSchema);

module.exports = User;
