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
required_files=(".env" "docker-compose.yml" "Dockerfile")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Required file not found: $file${NC}"
        exit 1
    fi
done

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | grep -v '^$' | awk '/=/ {print $1}')
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
mkdir -p nginx/conf.d nginx/logs certbot/conf certbot/www uploads logs backups

# Create nginx configuration if it doesn't exist
if [ ! -f "nginx/nginx.conf" ] || [ ! -f "nginx/conf.d/default.conf" ]; then
    echo -e "${YELLOW}📝 Creating nginx configuration files...${NC}"
    
    # Run setup script to create nginx configs
    if [ -f "setup.sh" ]; then
        chmod +x setup.sh
        ./setup.sh
    else
        echo -e "${RED}❌ nginx configuration files missing and setup.sh not found${NC}"
        exit 1
    fi
fi

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
docker compose build --no-cache app

# Start application
echo -e "${YELLOW}🚀 Starting application...${NC}"
docker compose up -d app

# Wait for application to be ready
echo -e "${YELLOW}⏳ Waiting for application to be ready...${NC}"
timeout=120
counter=0
until docker compose exec app curl -f http://localhost:3000 2>/dev/null; do
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

# Start nginx
echo -e "${YELLOW}🌐 Starting nginx...${NC}"
docker compose up -d nginx

# Handle SSL certificates for production
if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${YELLOW}🔒 Setting up SSL certificates...${NC}"
    
    # Wait for nginx to be ready
    sleep 5
    
    if [ ! -d "./certbot/conf/live/$DOMAIN" ]; then
        echo -e "${YELLOW}📜 No existing SSL certificates found. Getting new certificates...${NC}"
        
        # Get SSL certificate
        docker compose run --rm certbot certonly \
            --webroot \
            --webroot-path /var/www/certbot \
            --email admin@$DOMAIN \
            --agree-tos \
            --no-eff-email \
            -d $DOMAIN \
            --non-interactive || {
            echo -e "${RED}❌ Failed to get SSL certificate${NC}"
            echo -e "${YELLOW}Continuing with HTTP only...${NC}"
        }
        
        # If SSL was successful, update nginx config and restart
        if [ -d "./certbot/conf/live/$DOMAIN" ]; then
            echo -e "${YELLOW}📝 Updating nginx configuration for HTTPS...${NC}"
            
            # Replace template variables in nginx config
            envsubst '${DOMAIN}' < nginx/conf.d/default.conf.template > nginx/conf.d/default.conf
            
            # Restart nginx with SSL configuration
            docker compose restart nginx
        fi
    else
        echo -e "${GREEN}✅ SSL certificates already exist${NC}"
        # Make sure nginx config is updated with domain
        envsubst '${DOMAIN}' < nginx/conf.d/default.conf.template > nginx/conf.d/default.conf
        docker compose restart nginx
    fi
fi

# Final health checks
echo -e "${YELLOW}🏥 Running health checks...${NC}"

# Check if all services are running
services=("app" "nginx")
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

# Test ping endpoint via nginx
if curl -f http://localhost/api/v1/ping &>/dev/null; then
    echo -e "${GREEN}✅ Ping endpoint working${NC}"
else
    echo -e "${RED}❌ Ping endpoint failed${NC}"
    docker compose logs nginx
    docker compose logs app
    exit 1
fi

# Test HTTPS (production only)
if [ "$ENVIRONMENT" = "production" ] && [ -d "./certbot/conf/live/$DOMAIN" ]; then
    echo -e "${YELLOW}🔐 Testing HTTPS endpoint...${NC}"
    if curl -f https://$DOMAIN/api/v1/ping &>/dev/null; then
        echo -e "${GREEN}✅ HTTPS endpoint working${NC}"
    else
        echo -e "${YELLOW}⚠️ HTTPS endpoint not working (may need time to propagate)${NC}"
    fi
fi

# Setup log rotation
echo -e "${YELLOW}📊 Setting up log rotation...${NC}"
if [ ! -f "/etc/logrotate.d/healer-app" ]; then
    sudo tee /etc/logrotate.d/healer-app > /dev/null <<EOF
$(pwd)/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
}

$(pwd)/nginx/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
    postrotate
        docker compose exec nginx nginx -s reload
    endscript
}
EOF
    echo -e "${GREEN}✅ Log rotation configured${NC}"
fi

# Create backup script
echo -e "${YELLOW}💾 Creating backup script...${NC}"
cat > backup.sh << 'EOF'
#!/bin/bash
# Backup script for Healer application

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup uploads
echo "Backing up uploads..."
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz uploads/

# Backup configuration
echo "Backing up configuration..."
tar -czf $BACKUP_DIR/config_backup_$DATE.tar.gz .env nginx/ docker-compose.yml

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x backup.sh

# Set up cron job for SSL renewal (production only)
if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${YELLOW}⏰ Setting up SSL certificate renewal...${NC}"
    
    # Create renewal script
    cat > ssl-renew.sh << 'EOF'
#!/bin/bash
cd $(dirname $0)
docker compose run --rm certbot renew --quiet
docker compose exec nginx nginx -s reload
EOF
    chmod +x ssl-renew.sh
    
    # Add to crontab if not exists
    if ! crontab -l 2>/dev/null | grep -q "ssl-renew.sh"; then
        (crontab -l 2>/dev/null; echo "0 12 * * * $(pwd)/ssl-renew.sh") | crontab -
        echo -e "${GREEN}✅ SSL auto-renewal configured${NC}"
    fi
fi

# Print deployment summary
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${YELLOW}📋 Deployment Summary:${NC}"
echo -e "  Environment: $ENVIRONMENT"
echo -e "  Domain: $DOMAIN"
echo -e "  Application: http://localhost:3000"
echo -e "  Nginx: http://localhost"
if [ "$ENVIRONMENT" = "production" ] && [ -d "./certbot/conf/live/$DOMAIN" ]; then
    echo -e "  HTTPS: https://$DOMAIN"
fi
echo -e ""
echo -e "${YELLOW}📊 Useful commands:${NC}"
echo -e "  View logs: docker compose logs -f [service]"
echo -e "  Stop services: docker compose down"
echo -e "  Restart services: docker compose restart [service]"
echo -e "  Backup data: ./backup.sh"
echo -e "  Check status: docker compose ps"
echo -e ""
echo -e "${GREEN}✅ Your application is now running!${NC}"