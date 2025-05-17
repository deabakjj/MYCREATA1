# 다단계 빌드를 사용하여 클라이언트와 관리자 패널을 모두 빌드

# 클라이언트 빌드 단계
FROM node:16-alpine as client-build

# 작업 디렉토리 설정
WORKDIR /app/client

# 의존성 설치 파일 복사
COPY ./client/package*.json ./

# 의존성 설치
RUN npm ci --silent

# 클라이언트 파일 복사
COPY ./client ./

# 환경 변수 설정 (빌드 시 주입)
ARG REACT_APP_API_URL
ARG REACT_APP_CREATA_RPC_MAINNET
ARG REACT_APP_CREATA_RPC_TESTNET
ARG REACT_APP_NEST_TOKEN_ADDRESS
ARG REACT_APP_NEST_NFT_ADDRESS
ARG REACT_APP_NEST_NAME_REGISTRY_ADDRESS
ARG REACT_APP_NEST_SWAP_ADDRESS

ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV REACT_APP_CREATA_RPC_MAINNET=${REACT_APP_CREATA_RPC_MAINNET}
ENV REACT_APP_CREATA_RPC_TESTNET=${REACT_APP_CREATA_RPC_TESTNET}
ENV REACT_APP_NEST_TOKEN_ADDRESS=${REACT_APP_NEST_TOKEN_ADDRESS}
ENV REACT_APP_NEST_NFT_ADDRESS=${REACT_APP_NEST_NFT_ADDRESS}
ENV REACT_APP_NEST_NAME_REGISTRY_ADDRESS=${REACT_APP_NEST_NAME_REGISTRY_ADDRESS}
ENV REACT_APP_NEST_SWAP_ADDRESS=${REACT_APP_NEST_SWAP_ADDRESS}

# 클라이언트 빌드
RUN npm run build

# 오류 페이지 디렉토리 생성
RUN mkdir -p /app/client/build/error-pages

# 기본 오류 페이지 생성
RUN echo "<html><head><title>404 Not Found</title></head><body><h1>404 Not Found</h1><p>The page you are looking for does not exist.</p></body></html>" > /app/client/build/error-pages/404.html
RUN echo "<html><head><title>500 Server Error</title></head><body><h1>500 Server Error</h1><p>Something went wrong on the server.</p></body></html>" > /app/client/build/error-pages/50x.html

# 관리자 패널 빌드 단계
FROM node:16-alpine as admin-build

# 작업 디렉토리 설정
WORKDIR /app/admin

# 의존성 설치 파일 복사
COPY ./admin/package*.json ./

# 의존성 설치
RUN npm ci --silent

# 관리자 패널 파일 복사
COPY ./admin ./

# 환경 변수 설정 (빌드 시 주입)
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

# 관리자 패널 빌드
RUN npm run build

# 런타임 단계: Nginx
FROM nginx:alpine

# 클라이언트 빌드 파일 복사
COPY --from=client-build /app/client/build /var/www/nest-platform

# 관리자 패널 빌드 파일 복사
COPY --from=admin-build /app/admin/build /var/www/nest-platform-admin

# 오류 페이지 복사
COPY --from=client-build /app/client/build/error-pages /var/www/nest-platform/error-pages

# Nginx 설정 복사
COPY ./client/deploy/nginx.conf /etc/nginx/conf.d/default.conf

# 환경 변수 설정을 위한 스크립트
RUN apk add --no-cache bash
COPY ./client/deploy/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# SSL 디렉토리 생성
RUN mkdir -p /etc/nginx/ssl

# 80, 443 포트 노출
EXPOSE 80 443

# 컨테이너 실행 시 스크립트 실행
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
