#!/bin/bash

# Nest Platform Deployment Script (Updated)
# This script automates the deployment of the Nest Platform

# Exit on error
set -e

# Print commands
set -x

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file is missing. Please create it based on .env.example"
  exit 1
fi

# Load environment variables
source .env

# Check required environment variables
REQUIRED_VARS=(
  "MONGO_USERNAME"
  "MONGO_PASSWORD"
  "JWT_SECRET"
  "NEST_TOKEN_ADDRESS"
  "NEST_NFT_ADDRESS"
  "NEST_NAME_REGISTRY_ADDRESS"
  "NEST_SWAP_ADDRESS"
  "ADMIN_EMAIL"
  "ADMIN_PASSWORD"
  "REDIS_PASSWORD"
  "GRAFANA_USERNAME"
  "GRAFANA_PASSWORD"
)

for VAR in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!VAR}" ]; then
    echo "Error: Environment variable $VAR is not set"
    exit 1
  fi
done

# Create necessary directories
mkdir -p logs
mkdir -p ssl
mkdir -p monitoring
mkdir -p client/public/error-pages

# Ensure error pages exist
if [ ! -f client/public/error-pages/404.html ]; then
  echo "Creating default error pages..."
  
  # Create 404 page
  cat > client/public/error-pages/404.html << EOF
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>404 Not Found</title>
  <style>
    body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
    .error-container { text-align: center; max-width: 500px; }
    h1 { font-size: 72px; margin: 0; color: #3f51b5; }
  </style>
</head>
<body>
  <div class="error-container">
    <h1>404</h1>
    <h2>페이지를 찾을 수 없습니다</h2>
    <p>요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.</p>
    <a href="/">홈으로 돌아가기</a>
  </div>
</body>
</html>
EOF

  # Create 50x page
  cat > client/public/error-pages/50x.html << EOF
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>500 Server Error</title>
  <style>
    body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
    .error-container { text-align: center; max-width: 500px; }
    h1 { font-size: 72px; margin: 0; color: #f44336; }
  </style>
</head>
<body>
  <div class="error-container">
    <h1>500</h1>
    <h2>서버 오류가 발생했습니다</h2>
    <p>요청을 처리하는 동안 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.</p>
    <a href="/">홈으로 돌아가기</a>
  </div>
</body>
</html>
EOF
fi

# Check SSL certificates
if [ ! -f ssl/nest-platform.crt ] || [ ! -f ssl/nest-platform.key ]; then
  echo "Warning: SSL certificates not found. Using self-signed certificates for development."
  echo "For production, please provide valid SSL certificates."
  
  # Generate self-signed certificates for development
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/nest-platform.key -out ssl/nest-platform.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=nest-platform.example.com"
fi

# Set environment variables for the frontend
if [ -z "$API_URL" ]; then
  export API_URL="http://localhost:3000/api"
  echo "Setting default API_URL: $API_URL"
fi

if [ -z "$SERVER_NAME" ]; then
  export SERVER_NAME="nest-platform.example.com"
  echo "Setting default SERVER_NAME: $SERVER_NAME"
fi

# Create Prometheus configuration
cat > monitoring/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'nest-backend'
    static_configs:
      - targets: ['backend:3000']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
EOF

# Create Grafana dashboards directory
mkdir -p monitoring/grafana/provisioning/dashboards
mkdir -p monitoring/grafana/provisioning/datasources

# Create Grafana datasource configuration
cat > monitoring/grafana/provisioning/datasources/prometheus.yml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
EOF

# Create Grafana dashboard configuration
cat > monitoring/grafana/provisioning/dashboards/dashboard.yml << EOF
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 30
    options:
      path: /etc/grafana/provisioning/dashboards
EOF

# Make docker-entrypoint.sh executable
chmod +x client/deploy/docker-entrypoint.sh

# Build and start containers
echo "Building Nest Platform services..."
docker-compose build

echo "Starting Nest Platform services..."
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Check if services are running
if ! docker-compose ps | grep -q "Up"; then
  echo "Error: One or more services failed to start"
  docker-compose logs
  exit 1
fi

echo "Deployment completed successfully!"
echo "Frontend: https://$SERVER_NAME"
echo "Admin Panel: https://$SERVER_NAME/admin"
echo "API: https://$SERVER_NAME/api"
echo "Grafana: http://localhost:3000 (internal access only)"

# Display deployment summary
docker-compose ps
