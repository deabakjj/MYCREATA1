# Nest 플랫폼 클라이언트

## 수정 및 개선 사항

### 1. 환경 설정 및 연결 문제 해결
- `.env` 파일 생성 및 환경 변수 설정
- API 연결 URL 수정 및 통일 (http://localhost:3000/api)
- 백엔드 API 엔드포인트와 일치하도록 API 호출 경로 변경

### 2. 인증 시스템 개선
- `AuthContext.js` 수정 및 백엔드 API 호출 방식 일치
- Web3Auth/자체 인증 연동을 위한 `web3AuthService.js` 추가
- 개발 테스트용 Mock 서비스 구현

### 3. 컴포넌트 및 페이지 구조 정리
- `Layout.js` 구현 및 레이아웃 완성
- `ProtectedRoute.js` 컴포넌트 구현으로 인증 보호 강화
- `App.js`와 `index.js` 간의 프로바이더 일관성 유지

### 4. 개발 환경 지원
- Mock 서비스를 통한 백엔드 연동 전 클라이언트 개발 지원
- 개발 중 필요한 테스트 데이터 제공

## 남은 개발 작업

1. 실제 백엔드 API와 연동 테스트
2. Web3Auth 또는 자체 인증 시스템 연동 완료
3. 각 페이지 구현 완료 (Dashboard, Profile, Missions 등)
4. 상태 관리 최적화
5. 테스트 코드 작성

## 실행 방법

1. 필요한 패키지 설치:
```bash
npm install
```

2. 개발 서버 실행:
```bash
npm start
```

3. 빌드:
```bash
npm run build
```

## 주의 사항

- 개발 중인 프로젝트로, 실제 백엔드 API가 구현될 때까지 Mock 서비스를 사용합니다.
- Web3Auth 또는 자체 인증 시스템 연동 코드는 실제 시스템이 준비되면 활성화해야 합니다.
- 환경 변수 파일(.env)은 각 개발 환경에 맞게 설정해야 합니다.
