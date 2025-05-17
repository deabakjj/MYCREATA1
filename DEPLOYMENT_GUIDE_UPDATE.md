# Nest Platform 배포 가이드 업데이트

이 문서는 Nest Platform의 배포 과정에 대한 업데이트된 가이드입니다. 이전 문제점들을 해결하고 배포 프로세스를 개선하였습니다.

## 최근 업데이트 내용

1. 클라이언트 및 관리자 패널 통합 빌드 프로세스 개선
2. 환경 변수 설정 및 관리 방식 개선
3. Nginx 설정 오류 수정
4. 오류 페이지 및 정적 리소스 관리 개선

## 배포 단계

### 1. 환경 변수 설정

`.env` 파일에 다음 환경 변수들을 추가하십시오:

```
# API URL (클라이언트에서 사용)
API_URL=https://your-domain.com/api

# 서버 도메인 설정
SERVER_NAME=your-domain.com

# CreataChain RPC 엔드포인트
CREATA_RPC_MAINNET=https://cvm.node.creatachain.com
CREATA_RPC_TESTNET=https://consensus.testnet.cvm.creatachain.com
```

### 2. 수정된 Docker Compose로 배포하기

업데이트된 Docker Compose 파일은 다음과 같은 개선 사항을 포함합니다:

- 클라이언트와 관리자 패널을 통합 빌드하는 다단계 빌드
- 빌드 및 런타임 환경 변수 관리 개선
- 정적 리소스 및 오류 페이지 처리 개선

배포를 위해 다음 명령어를 실행하세요:

```bash
# 이미지 빌드
docker-compose build

# 서비스 시작
docker-compose up -d
```

### 3. SSL 인증서 설정

배포 전에 유효한 SSL 인증서를 준비하세요:

```bash
# SSL 디렉토리 생성
mkdir -p ssl

# 인증서 파일 복사
cp /path/to/your/certificate.crt ssl/nest-platform.crt
cp /path/to/your/private.key ssl/nest-platform.key
```

또는 Let's Encrypt를 사용하여 인증서를 자동으로 발급받을 수 있습니다:

```bash
# Certbot을 사용한 인증서 발급 (예시)
certbot certonly --webroot -w /var/www/html -d your-domain.com
```

### 4. 배포 확인

배포 후 다음을 확인하세요:

1. 프론트엔드 접속: `https://your-domain.com`
2. 관리자 패널 접속: `https://your-domain.com/admin`
3. API 동작 확인: `https://your-domain.com/api/health`

### 5. 모니터링 설정

Prometheus와 Grafana를 사용하여 시스템을 모니터링할 수 있습니다:

1. Grafana 접속: `http://your-domain.com:3000`
2. 기본 사용자 이름과 비밀번호로 로그인 (.env 파일에 설정)
3. 대시보드 구성 및 알림 설정

## 문제 해결

### 1. 클라이언트와 백엔드 연결 문제

API 연결에 문제가 있는 경우 다음을 확인하세요:

- Nginx 프록시 설정
- 환경 변수 설정 (API_URL, API_BACKEND_URL)
- 백엔드 서비스 상태

### 2. 환경 변수 문제

환경 변수가 올바르게 설정되지 않았을 경우:

```bash
# 서비스 로그 확인
docker-compose logs frontend

# 환경 변수 파일 확인
cat /var/www/nest-platform/env-config.js
```

### 3. SSL 인증서 문제

SSL 연결에 문제가 있는 경우:

```bash
# Nginx 설정 확인
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf

# SSL 인증서 확인
docker-compose exec frontend ls -la /etc/nginx/ssl
```

## 배포 스크립트 사용

자동화된 배포를 위해 `deploy.sh` 스크립트를 사용할 수 있습니다:

```bash
# 스크립트에 실행 권한 부여
chmod +x deploy.sh

# 배포 실행
./deploy.sh
```

## 백업 및 복원

정기적인 백업을 설정하는 것을 권장합니다:

```bash
# MongoDB 백업
docker-compose exec mongodb mongodump --out /backup/$(date +%F)

# 파일 백업
tar -czf backup-$(date +%F).tar.gz .env ssl logs
```

---

추가 지원이나 문의 사항이 있으면 개발팀에 문의하세요.
