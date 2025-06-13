#!/bin/bash

# Deployment script for Healer Express.js Application
# Usage: ./deploy.sh [environment]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Environment (default: production)
ENVIRONMENT=${1:-production}

echo -e "${GREEN}🚀 Starting deployment for environment: $ENVIRONMENT${NC}"

# Check if required files exist
required_files=(".env" "docker-compose.yml" "Dockerfile" "Makefile")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Required file not found: $file${NC}"
        exit 1
    fi
done

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

# Check if DOMAIN is set
if [ -z "$DOMAIN" ]; then
    echo -e "${RED}❌ DOMAIN not set in .env file${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Pre-deployment checks...${NC}"

# Check Docker and Docker Compose
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install Docker.${NC}"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose not found. Please install Docker Compose.${NC}"
    exit 1
fi

# Create necessary directories
echo -e "${YELLOW}📁 Creating necessary directories...${NC}"
mkdir -p nginx/logs certbot/conf certbot/www uploads logs backups

# Stop existing services
echo -e "${YELLOW}🛑 Stopping existing services...${NC}"
docker compose down || true

# Pull latest code (if git repository)
if [ -d ".git" ]; then
    echo -e "${YELLOW}📥 Pulling latest code...${NC}"
    git pull origin main || echo "Warning: Could not pull latest code"
fi

# Build images
echo -e "${YELLOW}🏗️ Building Docker images...${NC}"
docker compose build --no-cache

# Handle SSL certificates
if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${YELLOW}🔒 Setting up SSL certificates...${NC}"
    
    if [ ! -d "./certbot/conf/live/$DOMAIN" ]; then
        echo -e "${YELLOW}📜 No existing SSL certificates found. Initializing...${NC}"
        
        # Start nginx without SSL first
        docker compose up -d nginx
        sleep 10
        
        # Get SSL certificate
        docker compose run --rm certbot certonly \
            --webroot \
            --webroot-path /var/www/certbot \
            --agree-tos \
            --no-eff-email \
            -d $DOMAIN \
            --non-interactive
        
        # Restart nginx with SSL
        docker compose restart nginx
    else
        echo -e "${GREEN}✅ SSL certificates already exist${NC}"
    fi
fi

# Start database first
echo -e "${YELLOW}🗄️ Starting database services...${NC}"
docker compose up -d postgres redis

# Wait for database
echo -e "${YELLOW}⏳ Waiting for database to be ready...${NC}"
timeout=60
counter=0
until docker compose exec postgres pg_isready -U $DB_USER -d $DB_NAME; do
    counter=$((counter + 1))
    if [ $counter -gt $timeout ]; then
        echo -e "${RED}❌ Database failed to start within $timeout seconds${NC}"
        exit 1
    fi
    echo "Waiting for database... ($counter/$timeout)"
    sleep 1
done

# Run database migrations
echo -e "${YELLOW}🔄 Running database migrations...${NC}"
docker compose run --rm app npx prisma migrate deploy

# Start all services
echo -e "${YELLOW}🚀 Starting all services...${NC}"
docker compose up -d

# Wait for application to be ready
echo -e "${YELLOW}⏳ Waiting for application to be ready...${NC}"
timeout=120
counter=0
until curl -f http://localhost/api/v1/ping &>/dev/null; do
    counter=$((counter + 1))
    if [ $counter -gt $timeout ]; then
        echo -e "${RED}❌ Application failed to start within $timeout seconds${NC}"
        echo -e "${YELLOW}📋 Checking logs...${NC}"
        docker compose logs app
        exit 1
    fi
    echo "Waiting for application... ($counter/$timeout)"
    sleep 2
done

# Health checks
echo -e "${YELLOW}🏥 Running health checks...${NC}"

# Check if all services are running
services=("postgres" "redis" "app" "nginx")
for service in "${services[@]}"; do
    if ! docker compose ps $service | grep -q "Up"; then
        echo -e "${RED}❌ Service $service is not running${NC}"
        docker compose logs $service
        exit 1
    else
        echo -e "${GREEN}✅ Service $service is running${NC}"
    fi
done

# Test HTTP endpoints
echo -e "${YELLOW}🧪 Testing endpoints...${NC}"

# Test ping endpoint
if curl -f http://localhost/api/v1/ping &>/dev/null; then
    echo -e "${GREEN}✅ Ping endpoint working${NC}"
else
    echo -e "${RED}❌ Ping endpoint failed${NC}"
    exit 1
fi

# Test HTTPS (production only)
if [ "$ENVIRONMENT" = "production" ] && [ -d "./certbot/conf/live/$DOMAIN" ]; then
    if curl -f https://$DOMAIN/api/v1/ping &>/dev/null; then
        echo -e "${GREEN}✅ HTTPS endpoint working${NC}"
    else
        echo -e "${YELLOW}⚠️ HTTPS endpoint not working (may need time to propagate)${NC}"
    fi
fi

#