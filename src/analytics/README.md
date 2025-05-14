# Nest 플랫폼 분석 모듈

Nest 플랫폼의 사용자 행동, 참여도, 토큰 활용 등을 분석하기 위한 모듈들입니다.

## 개요

본 분석 모듈은 Nest 플랫폼의 다양한 지표를 추적하고 분석합니다:

- **사용자 전환률**: Web2 사용자가 Web3 기능을 얼마나 활용하는지 
- **지갑 유지율**: 보상 지급 이후 사용자가 지갑을 계속 사용하는지
- **토큰 교환율**: CTA와 NEST 토큰 간의 교환 패턴 및 비율
- **XP 누적량**: 커뮤니티 활동 기반 XP 누적량
- **NFT 보유량**: 사용자별 NFT 보유 현황

## 사용 방법

각 분석 모듈은 다음과 같이 사용할 수 있습니다:

```javascript
// 전체 모듈 가져오기
const analytics = require('./analytics');

// 개별 모듈 가져오기
const userConversion = require('./analytics/userConversion');
const walletRetention = require('./analytics/walletRetention');
const tokenExchange = require('./analytics/tokenExchange');
const xpAccumulation = require('./analytics/xpAccumulation');
const nftOwnership = require('./analytics/nftOwnership');

// 사용 예시: 특정 기간의 사용자 전환률 계산
async function analyzeUserConversion() {
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-12-31');
  
  const metrics = await userConversion.calculateConversionMetrics({
    startDate,
    endDate
  });
  
  console.log('사용자 전환률:', metrics.summary.totalConversionRate);
}
```

## 각 모듈 설명

### 1. userConversion.js - 사용자 전환률 분석

Web2 사용자(소셜 로그인)가 Web3 기능(지갑 생성, 블록체인 활동)을 얼마나 활용하는지 분석합니다.

**주요 메서드**:
- `calculateConversionMetrics(options)`: 기본 전환률 지표 계산
- `analyzeConversionTrends(options)`: 기간별 전환률 변화 추세 분석
- `analyzeSegmentConversion(options)`: 사용자 세그먼트별 전환률 분석
- `analyzeConversionFunnel(options)`: 전환 경로 및 퍼널 분석

### 2. walletRetention.js - 지갑 유지율 분석

보상 지급 이후 사용자가 지갑을 계속 사용하는지 여부와 관련 활동을 분석합니다.

**주요 메서드**:
- `calculateRetentionMetrics(options)`: 기본 유지율 지표 계산
- `analyzeRetentionByRewardType(options)`: 보상 유형별 유지율 분석
- `analyzeRetentionByActivityPattern(options)`: 사용자 활동 패턴과 지갑 유지율 상관관계 분석

### 3. tokenExchange.js - 토큰 교환율 분석

CTA와 NEST 토큰 간의 교환 패턴 및 비율을 분석합니다.

**주요 메서드**:
- `calculateExchangeMetrics(options)`: 기본 교환 지표 계산
- `analyzeExchangeByUserSegment(options)`: 사용자 세그먼트별 토큰 교환 패턴 분석
- `analyzeExchangeAmountDistribution(options)`: 토큰 교환 금액 분포 분석
- `analyzePostExchangeBehavior(options)`: 교환 이후 보유량 및 활동 패턴 분석

### 4. xpAccumulation.js - XP 누적량 분석

커뮤니티 활동 기반 XP 누적량을 분석하여 사용자 참여도, 레벨 진행 속도를 추적합니다.

**주요 메서드**:
- `calculateXpMetrics(options)`: 기본 XP 지표 계산
- `analyzeXpByUserSegment(options)`: 사용자 세그먼트별 XP 누적 패턴 분석
- `analyzeLevelProgression(options)`: 레벨 진행 속도 및 XP 획득 패턴 분석
- `analyzeActivityEfficiency(options)`: 활동 유형별 XP 효율성 분석

### 5. nftOwnership.js - NFT 보유 분석

사용자별 NFT 보유 현황을 분석하고, 희귀도, 카테고리, 획득 방법 등에 따른 보유 패턴을 추적합니다.

**주요 메서드**:
- `calculateNftMetrics(options)`: 기본 NFT 보유 지표 계산
- `analyzeNftByUserSegment(options)`: 사용자 세그먼트별 NFT 보유 패턴 분석
- `analyzeNftEngagementCorrelation(options)`: NFT 보유 패턴과 사용자 행동 상관관계 분석

## 옵션 설정

모든 분석 메서드는 다음과 같은 옵션을 받습니다:

```javascript
const options = {
  // 공통 옵션
  startDate: new Date('2024-01-01'), // 분석 시작 날짜
  endDate: new Date('2024-12-31'),   // 분석 종료 날짜
  
  // 메서드별 특수 옵션
  retentionDays: 30,  // 지갑 유지율 계산 기간(일)
  intervalType: 'month', // 추세 분석 간격('day', 'week', 'month')
  periods: 6,     // 추세 분석에 사용할 기간 수
  direction: 'both', // 토큰 교환 방향('cta_to_nest', 'nest_to_cta', 'both')
  daysAfter: 30,  // 이벤트 이후 행동 분석 기간(일)
};
```

## 개발 및 확장

새로운 분석 지표를 추가하려면 다음 단계를 따르세요:

1. 분석 모듈 파일 생성 (예: `newAnalytics.js`)
2. 클래스 및 분석 메서드 구현
3. `index.js`에 모듈 추가

## 참고 사항

- 모든 분석은 비동기적으로 수행되므로 `async/await`를 사용해야 합니다.
- 대규모 데이터셋의 경우 실행 시간이 길어질 수 있으므로 적절한 제한과 인덱싱을 권장합니다.
- 분석 결과의 정확성을 위해 MongoDB의 집계 파이프라인을 사용합니다.
