# Nest Platform Deployment Guide

이 가이드는 Nest Platform의 배포 과정을 단계별로 설명합니다. Nest Platform은 CreataChain의 Catena 메인넷을 기반으로 하는 Web3 대중화 플랫폼입니다.

## 목차

1. [사전 요구사항](#사전-요구사항)
2. [환경 설정](#환경-설정)
3. [배포 환경](#배포-환경)
   - [개발 환경](#개발-환경)
   - [테스트넷 환경](#테스트넷-환경)
   - [메인넷 환경](#메인넷-환경)
4. [스마트 컨트랙트 배포](#스마트-컨트랙트-배포)
5. [백엔드 서버 배포](#백엔드-서버-배포)
6. [프론트엔드 배포](#프론트엔드-배포)
7. [관리자 패널 설정](#관리자-패널-설정)
8. [모니터링 및 로깅](#모니터링-및-로깅)
9. [보안 설정](#보안-설정)
10. [유지보수](#유지보수)

## 사전 요구사항

Nest Platform을 배포하기 위해 필요한 사전 요구사항:

- Docker와 Docker Compose (v1.29.0 이상)
- Node.js (v16 이상)
- npm (v7 이상)
- Git
- Truffle (v5.5.0 이상)
- 서버/호스팅 환경
  - 최소 사양: 4 CPU, 8GB RAM, 100GB SSD
  - 권장 사양: 8 CPU, 16GB RAM, 200GB SSD
- 도메인 이름 및 SSL 인증서
- CreataChain 지갑 (개인키와 테스트넷/메인넷 CTA)

## 환경 설정

1. 리포지토리 클론:

```bash
git clone https://github.com/your-organization/nest-platform.git
cd nest-platform
```

2. 환경 변수 설정:

`.env.example` 파일을 `.env`로 복사하고 환경 변수를 설정하세요:

```bash
cp .env.example .env
```

다음 환경 변수를 설정해야 합니다:

- **데이터베이스 설정**
  - `MONGO_USERNAME`: MongoDB 사용자 이름
  - `MONGO_PASSWORD`: MongoDB 비밀번호
  - `MONGO_URI`: MongoDB 연결 문자열

- **JWT 설정**
  - `JWT_SECRET`: JWT 토큰 서명에 사용되는 비밀 키

- **CreataChain RPC 엔드포인트**
  - `CREATA_RPC_MAINNET`: Catena 메인넷 RPC URL
  - `CREATA_RPC_TESTNET`: Catena 테스트넷 RPC URL

- **컨트랙트 주소**
  - `NEST_TOKEN_ADDRESS`: NEST 토큰 컨트랙트 주소
  - `NEST_NFT_ADDRESS`: NEST NFT 컨트랙트 주소
  - `NEST_NAME_REGISTRY_ADDRESS`: NEST 이름 레지스트리 컨트랙트 주소
  - `NEST_SWAP_ADDRESS`: NEST 스왑 컨트랙트 주소

- **관리자 계정**
  - `ADMIN_EMAIL`: 관리자 이메일
  - `ADMIN_PASSWORD`: 관리자 비밀번호

- **인증 설정**
  - `WEB3_AUTH_CLIENT_ID`: Web3Auth 클라이언트 ID
  - `WEB3_AUTH_SECRET`: Web3Auth 비밀 키

- **기타 설정**
  - `NODE_ENV`: 노드 환경 (development, production)
  - `PORT`: 서버 포트
  - `LOG_LEVEL`: 로깅 레벨 (debug, info, warn, error)
  - `RATE_LIMIT_WINDOW_MS`: 속도 제한 윈도우 (밀리초)
  - `RATE_LIMIT_MAX`: 윈도우당 최대 요청 수

## 배포 환경

### 개발 환경

개발 환경에서 플랫폼을 실행하려면:

```bash
# 백엔드 실행
cd src
npm install
npm run dev

# 프론트엔드 실행
cd ../client
npm install
npm start

# 관리자 패널 실행
cd ../admin
npm install
npm start
```

### 테스트넷 환경

테스트넷 환경에서 플랫폼을 배포하려면:

1. 환경 변수 설정:

```bash
# .env 파일에서
NODE_ENV=production
CREATA_RPC_TESTNET=https://consensus.testnet.cvm.creatachain.com
CREATA_RPC_MAINNET=
```

2. 스마트 컨트랙트를 테스트넷에 배포 (아래 '스마트 컨트랙트 배포' 섹션 참조)

3. Docker Compose를 사용하여 배포:

```bash
docker-compose up -d
```

### 메인넷 환경

메인넷 환경에서 플랫폼을 배포하려면:

1. 환경 변수 설정:

```bash
# .env 파일에서
NODE_ENV=production
CREATA_RPC_MAINNET=https://cvm.node.creatachain.com
CREATA_RPC_TESTNET=
```

2. 스마트 컨트랙트를 메인넷에 배포 (아래 '스마트 컨트랙트 배포' 섹션 참조)

3. Docker Compose를 사용하여 배포:

```bash
docker-compose up -d
```

## 스마트 컨트랙트 배포

1. Truffle 설정 확인:

`truffle-config.js` 파일을 편집하여 올바른 네트워크 설정을 확인하세요.

2. 마이그레이션 스크립트 준비:

`migrations` 폴더에 있는 스크립트를 검토하세요.

3. 테스트넷에 배포:

```bash
# 배포 전 컴파일
truffle compile

# 테스트넷에 배포
truffle migrate --network testnet
```

4. 메인넷에 배포:

```bash
# 메인넷 배포는 신중하게 진행해야 합니다!
truffle migrate --network mainnet
```

5. 배포된 컨트랙트 주소 업데이트:

배포 후 생성된 컨트랙트 주소를 `.env` 파일에 업데이트하세요:

```
NEST_TOKEN_ADDRESS=0x...
NEST_NFT_ADDRESS=0x...
NEST_NAME_REGISTRY_ADDRESS=0x...
NEST_SWAP_ADDRESS=0x...
```

## 백엔드 서버 배포

Docker Compose를 사용하여 백엔드 서버를 배포하는 방법:

1. 백엔드 이미지 빌드:

```bash
docker-compose build backend
```

2. 백엔드 서비스 시작:

```bash
docker-compose up -d backend mongodb redis
```

3. 로그 확인:

```bash
docker-compose logs -f backend
```

## 프론트엔드 배포

1. 프론트엔드 및 관리자 패널 빌드:

```bash
# 프론트엔드 빌드
cd client
npm run build

# 관리자 패널 빌드
cd ../admin
npm run build
```

2. Nginx 설정 확인:

`client/deploy/nginx.conf` 파일을 검토하고 필요에 따라 조정하세요.

3. Docker Compose를 사용하여 프론트엔드 배포:

```bash
docker-compose up -d frontend
```

## 관리자 패널 설정

1. 관리자 계정으로 로그인:

브라우저에서 `https://your-domain.com/admin`에 접속하고 `.env` 파일에 설정한 관리자 자격 증명으로 로그인하세요.

2. 초기 설정:

- 시스템 설정 구성
- 미션 및 보상 정책 설정
- 화이트리스트/블랙리스트 설정
- 통합 설정

## 모니터링 및 로깅

1. Prometheus 및 Grafana 설정:

```bash
docker-compose up -d prometheus grafana
```

2. Grafana 접속:

브라우저에서 `http://your-domain.com:3000`에 접속하고 `.env` 파일에 설정한 Grafana 자격 증명으로 로그인하세요.

3. 로그 확인:

```bash
# 모든 서비스의 로그 확인
docker-compose logs

# 특정 서비스의 로그 확인
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 보안 설정

1. SSL 인증서 설정:

유효한 SSL 인증서 파일을 `ssl` 디렉토리에 복사하세요:

```
ssl/nest-platform.crt  # 인증서 파일
ssl/nest-platform.key  # 개인 키 파일
```

2. 방화벽 설정:

서버에서 필요한 포트만 열도록 방화벽을 구성하세요:

- HTTP: 80
- HTTPS: 443
- MongoDB: 27017 (내부 네트워크만)
- Redis: 6379 (내부 네트워크만)

3. 정기적인 백업 설정:

데이터베이스와 중요 파일을 정기적으로 백업하는 스크립트를 설정하세요.

## 유지보수

1. 서비스 업데이트:

```bash
# 최신 코드 가져오기
git pull

# 서비스 재빌드 및 재시작
docker-compose build
docker-compose up -d
```

2. 데이터베이스 관리:

```bash
# MongoDB 백업
docker-compose exec mongodb mongodump --out /backup/$(date +%F)

# MongoDB 복원
docker-compose exec mongodb mongorestore /backup/YYYY-MM-DD
```

3. 로그 관리:

오래된 로그 파일을 정리하는 스크립트를 설정하세요.

4. 모니터링:

Grafana 대시보드를 정기적으로 확인하여 시스템 성능과 건강 상태를 모니터링하세요.

---

## 문제 해결

자주 발생하는 문제와 해결 방법:

### 서비스 연결 문제

각 서비스가 올바르게 실행 중인지 확인하세요:

```bash
docker-compose ps
```

### 데이터베이스 연결 문제

MongoDB 연결 문자열이 올바른지 확인하세요:

```bash
docker-compose logs mongodb
docker-compose logs backend
```

### 스마트 컨트랙트 상호 작용 문제

RPC 엔드포인트가 올바르게 설정되었는지 확인하세요:

```bash
# 테스트넷 RPC 확인
curl -X POST https://consensus.testnet.cvm.creatachain.com -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# 메인넷 RPC 확인
curl -X POST https://cvm.node.creatachain.com -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### API 에러

백엔드 API 로그를 확인하세요:

```bash
docker-compose logs backend
```

### 프론트엔드 로딩 문제

Nginx 로그를 확인하세요:

```bash
docker-compose logs frontend
```

---

추가 도움이나 지원이 필요하면 GitHub 이슈를 생성하거나 개발 팀에 문의하세요.
