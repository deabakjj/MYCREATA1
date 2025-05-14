# Nest Platform - AI 시대의 Web3 대중화 플랫폼

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![CreataChain](https://img.shields.io/badge/chain-Catena-orange)](https://creatachain.com)

> Web3를 모르게 사용하는 사용자 경험 설계

## 🌟 소개

Nest는 Web3를 모르는 사용자도 쉽게 사용할 수 있는 플랫폼입니다. 핵심은 블록체인 요소(지갑, NFT, 토큰, 체인)를 백엔드에 숨기고, Web2와 같은 친숙한 인터페이스를 제공하는 것입니다.

## ✨ 주요 특징

- **자동 지갑 생성**: 소셜 로그인(구글, 카카오, 애플)으로 자동으로 EOA 또는 AA 지갑 생성
- **커스텀 ID 시스템**: johnchoi.nest와 같은 형식의 친숙한 ID 제공
- **가스비 제거**: 모든 트랜잭션 비용은 플랫폼이 부담
- **행동 기반 보상**: NFT와 토큰으로 다양한 활동에 대한 보상 제공
- **다양한 미션**: 출석, 댓글, 랭킹, AI 활용 등 다양한 미션 제공
- **모듈형 UX**: 외부 DApp과 연동 가능한 Web3 인프라 모듈 제공

## 📋 주요 컴포넌트

1. **NestToken (CIP20)**: 플랫폼 내부 토큰 시스템
2. **NestNFT (CIP721)**: 보상 및 소속감 제공을 위한 NFT 발행
3. **NestNameRegistry**: 사용자 친화적인 ID 매핑 시스템
4. **NestSwap**: CTA ↔ NEST 토큰 교환 모듈
5. **NestRelay**: 외부 DApp 연동을 위한 브릿지 모듈
6. **NestAdmin**: 관리자 패널 및 분석 도구

## 🛠️ 기술 스택

- **프론트엔드**: React.js, Next.js, TailwindCSS
- **백엔드**: Node.js, Express.js
- **블록체인**: CreataChain의 Catena 메인넷(EVM 호환)
- **스마트 컨트랙트**: Solidity (CIP20/CIP721 기반)
- **인증**: Magic.link 또는 Web3Auth 연동
- **데이터베이스**: MongoDB (사용자 데이터, 미션 정보 등)
- **인프라**: Docker, Kubernetes, AWS 또는 Google Cloud
- **모니터링**: Prometheus, Grafana

## 🚀 시작하기

### 개발 환경 설정

1. **소스 코드 클론**:
   ```bash
   git clone https://github.com/your-organization/nest-platform.git
   cd nest-platform
   ```

2. **환경 설정**:
   ```bash
   cp .env.example .env
   # .env 파일 내용 편집
   ```

3. **의존성 설치**:
   ```bash
   npm install
   cd client && npm install
   cd ../admin && npm install
   ```

4. **개발 서버 실행**:
   ```bash
   # 백엔드
   npm run dev
   
   # 프론트엔드 (별도 터미널에서)
   cd client && npm start
   
   # 관리자 패널 (별도 터미널에서)
   cd admin && npm start
   ```

### 프로덕션 배포

프로덕션 배포에 관한 상세 지침은 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)를 참조하세요.

```bash
# Docker Compose를 사용한 배포
docker-compose up -d
```

## 📊 분석 및 모니터링

Nest 플랫폼은 다음과 같은 핵심 지표를 모니터링합니다:

- **Web2 사용자 전환률**: 일반 사용자가 Web3 사용자로 전환되는 비율
- **지갑 유지율**: 보상 지급 이후 지갑을 계속 사용하는 비율
- **토큰 교환률**: CTA와 NEST 간 교환 활동
- **XP 누적량**: 사용자의 활동 기반 경험치 데이터
- **NFT 보유율**: 유저별 평균 NFT 보유량

Grafana 대시보드를 통해 이러한 지표를 실시간으로 모니터링할 수 있습니다.

## 🌉 외부 통합 (SDK)

Nest 플랫폼은, Web3 UX Layer as a Service를 제공합니다. 다음 모듈을 통해 외부 DApp과 통합할 수 있습니다:

- **NestAuth**: 소셜 로그인 및 자동 지갑 생성 모듈
- **NestID**: .nest 도메인 관리 모듈
- **NestXP**: 경험치 시스템 모듈
- **NestNFT**: NFT 발행 및 관리 모듈
- **NestScan**: 활동 기록 조회 모듈

자세한 통합 방법은 [SDK 문서](client/sdk/README.md)를 참조하세요.

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🤝 기여하기

기여에 관심이 있으신가요? [CONTRIBUTING.md](CONTRIBUTING.md)를 참조하세요.

## 📞 연락처

문의사항이 있으시면 다음 메일로 연락주세요: team@nestplatform.com
