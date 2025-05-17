#!/bin/bash
set -e

# 런타임에 환경 변수를 설정하는 스크립트 생성
if [ -n "$API_URL" ] || [ -n "$CREATA_RPC_MAINNET" ] || [ -n "$CREATA_RPC_TESTNET" ]; then
  echo "window.env = {" > /var/www/nest-platform/env-config.js
  
  # API URL 설정
  if [ -n "$API_URL" ]; then
    echo "  API_URL: '$API_URL'," >> /var/www/nest-platform/env-config.js
  fi
  
  # CreataChain RPC 설정
  if [ -n "$CREATA_RPC_MAINNET" ]; then
    echo "  CREATA_RPC_MAINNET: '$CREATA_RPC_MAINNET'," >> /var/www/nest-platform/env-config.js
  fi
  
  if [ -n "$CREATA_RPC_TESTNET" ]; then
    echo "  CREATA_RPC_TESTNET: '$CREATA_RPC_TESTNET'," >> /var/www/nest-platform/env-config.js
  fi
  
  # 토큰 주소 설정
  if [ -n "$NEST_TOKEN_ADDRESS" ]; then
    echo "  NEST_TOKEN_ADDRESS: '$NEST_TOKEN_ADDRESS'," >> /var/www/nest-platform/env-config.js
  fi
  
  if [ -n "$NEST_NFT_ADDRESS" ]; then
    echo "  NEST_NFT_ADDRESS: '$NEST_NFT_ADDRESS'," >> /var/www/nest-platform/env-config.js
  fi
  
  if [ -n "$NEST_NAME_REGISTRY_ADDRESS" ]; then
    echo "  NEST_NAME_REGISTRY_ADDRESS: '$NEST_NAME_REGISTRY_ADDRESS'," >> /var/www/nest-platform/env-config.js
  fi
  
  if [ -n "$NEST_SWAP_ADDRESS" ]; then
    echo "  NEST_SWAP_ADDRESS: '$NEST_SWAP_ADDRESS'," >> /var/www/nest-platform/env-config.js
  fi
  
  echo "};" >> /var/www/nest-platform/env-config.js
  
  # 환경 변수 스크립트를 HTML에 추가
  for htmlfile in /var/www/nest-platform/index.html /var/www/nest-platform-admin/index.html; do
    if [ -f "$htmlfile" ]; then
      sed -i '/<head>/a\    <script src="/env-config.js"></script>' "$htmlfile"
    fi
  done
fi

# Nginx 설정 값 대체
if [ -n "$API_BACKEND_URL" ]; then
  sed -i "s|http://backend:3000|$API_BACKEND_URL|g" /etc/nginx/conf.d/default.conf
fi

if [ -n "$SERVER_NAME" ]; then
  sed -i "s|nest-platform.example.com|$SERVER_NAME|g" /etc/nginx/conf.d/default.conf
fi

# 원래 도커 엔트리포인트 실행
exec "$@"
