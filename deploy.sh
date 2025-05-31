#!/bin/bash

# Healer Backend Deployment Script for VPS
# This script will help you deploy your application with SSL certificates

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN=""
EMAIL=""
COMPOSE_FILE="docker-compose.prod.yml"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "All requirements met!"
}

# Function to get domain and email from user
get_user_input() {
    if [ -z "$DOMAIN" ]; then
        read -p "Enter your domain name (e.g., api.example.com): " DOMAIN
    fi
    
    if [ -z "$EMAIL" ]; then
        read -p "Enter your email for SSL certificate: " EMAIL
    fi
    
    print_status "Domain: $DOMAIN"
    print_status "Email: $EMAIL"
}

# Function to update configuration files
update_config() {
    print_status "Updating configuration files..."
    
    # Update Nginx configuration
    sed -i "s/your-domain\.com/$DOMAIN/g" nginx/conf.d/default.conf
    sed -i "s/your-email@example\.com/$EMAIL/g" $COMPOSE_FILE
    
    print_success "Configuration files updated!"
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p certbot/conf
    mkdir -p certbot/www
    mkdir -p nginx/conf.d
    
    print_success "Directories created!"
}

# Function to start services without SSL first
start_without_ssl() {
    print_status "Starting services without SSL for initial setup..."
    
    # Comment out SSL-related lines in Nginx config temporarily
    cp nginx/conf.d/default.conf nginx/conf.d/default.conf.backup
    
    # Create a temporary config without SSL
    cat > nginx/conf.d/default.conf << EOF
upstream healer_backend {
    server app:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    client_max_body_size 50M;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        allow all;
    }
    
    location /api/ {
        proxy_pass http://healer_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /health {
        proxy_pass http://healer_backend/api/v1/ping;
        access_log off;
    }
}
EOF
    
    docker-compose -f $COMPOSE_FILE up -d nginx app
    
    print_success "Services started without SSL!"
}

# Function to obtain SSL certificate
obtain_ssl() {
    print_status "Obtaining SSL certificate..."
    
    docker-compose -f $COMPOSE_FILE run --rm certbot certonly \
        --webroot \
        --webroot-path /var/www/certbot \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN \
        -d www.$DOMAIN
    
    if [ $? -eq 0 ]; then
        print_success "SSL certificate obtained successfully!"
        return 0
    else
        print_error "Failed to obtain SSL certificate!"
        return 1
    fi
}

# Function to restore full Nginx configuration
restore_ssl_config() {
    print_status "Restoring full Nginx configuration with SSL..."
    
    mv nginx/conf.d/default.conf.backup nginx/conf.d/default.conf
    
    docker-compose -f $COMPOSE_FILE restart nginx
    
    print_success "Full configuration restored!"
}

# Function to set up SSL certificate renewal
setup_renewal() {
    print_status "Setting up SSL certificate renewal..."
    
    # Create renewal script
    cat > ssl-renew.sh << 'EOF'
#!/bin/bash
docker-compose -f docker-compose.prod.yml run --rm certbot renew --quiet
docker-compose -f docker-compose.prod.yml restart nginx
EOF
    
    chmod +x ssl-renew.sh
    
    print_status "SSL renewal script created. Add this to your crontab:"
    print_warning "0 12 * * * /path/to/your/project/ssl-renew.sh"
    
    print_success "SSL renewal setup complete!"
}

# Function to show final status
show_status() {
    print_status "Deployment completed successfully!"
    echo ""
    print_success "Your application is now running at:"
    print_success "  HTTP:  http://$DOMAIN"
    print_success "  HTTPS: https://$DOMAIN"
    print_success "  API:   https://$DOMAIN/api/v1/"
    print_success "  Docs:  https://$DOMAIN/api/v1/swagger/api-docs/"
    echo ""
    print_status "Useful commands:"
    echo "  View logs:           docker-compose -f $COMPOSE_FILE logs -f"
    echo "  Stop services:       docker-compose -f $COMPOSE_FILE down"
    echo "  Restart services:    docker-compose -f $COMPOSE_FILE restart"
    echo "  Renew SSL:           ./ssl-renew.sh"
}

# Main deployment function
main() {
    print_status "Starting Healer Backend deployment..."
    
    check_requirements
    get_user_input
    create_directories
    update_config
    
    print_status "Starting deployment process..."
    
    # Start without SSL first
    start_without_ssl
    
    # Wait a bit for services to be ready
    sleep 10
    
    # Obtain SSL certificate
    if obtain_ssl; then
        restore_ssl_config
        setup_renewal
        show_status
    else
        print_error "SSL setup failed. Your application is running on HTTP only."
        print_status "You can access it at: http://$DOMAIN"
    fi
}

# Run main function
main "$@"
