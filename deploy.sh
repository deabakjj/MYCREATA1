#!/bin/bash

# Nest Platform Deployment Script
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

# Check SSL certificates
if [ ! -f ssl/nest-platform.crt ] || [ ! -f ssl/nest-platform.key ]; then
  echo "Warning: SSL certificates not found. Using self-signed certificates for development."
  echo "For production, please provide valid SSL certificates."
  
  # Generate self-signed certificates for development
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/nest-platform.key -out ssl/nest-platform.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=nest-platform.example.com"
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

# Build and start containers
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
echo "Frontend: https://nest-platform.example.com"
echo "Admin Panel: https://nest-platform.example.com/admin"
echo "API: https://nest-platform.example.com/api"
echo "Grafana: http://localhost:3000 (internal access only)"

# Display deployment summary
docker-compose ps
