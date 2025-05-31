#!/bin/bash

# Simple deployment script for IP-only VPS deployment
# This script deploys without SSL certificates and domain configuration

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to get VPS IP address
get_server_ip() {
    print_status "Detecting server IP address..."
    
    # Try multiple methods to get public IP
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "")
    
    if [ -z "$SERVER_IP" ]; then
        print_warning "Could not automatically detect IP address."
        read -p "Please enter your VPS IP address: " SERVER_IP
    fi
    
    print_success "Server IP: $SERVER_IP"
}

# Function to check if .env file exists
check_env_file() {
    print_status "Checking environment configuration..."
    
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from template..."
        
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_status "Please edit .env file with your production settings:"
            print_warning "nano .env"
            read -p "Press Enter when you've finished editing .env file..."
        else
            print_error ".env.example file not found. Please create .env file manually."
            exit 1
        fi
    else
        print_success ".env file found!"
    fi
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p uploads
    mkdir -p nginx/conf.d
    
    print_success "Directories created!"
}

# Function to stop existing services
stop_existing_services() {
    print_status "Stopping any existing services..."
    
    docker-compose -f docker-compose.ip.yml down 2>/dev/null || true
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    docker-compose down 2>/dev/null || true
    
    print_success "Existing services stopped!"
}

# Function to build and start services
start_services() {
    print_status "Building and starting services..."
    
    # Build the application
    docker-compose -f docker-compose.ip.yml build
    
    # Start services
    docker-compose -f docker-compose.ip.yml up -d
    
    print_success "Services started!"
}

# Function to wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    sleep 10
    
    # Check if services are running
    if docker-compose -f docker-compose.ip.yml ps | grep -q "Up"; then
        print_success "Services are running!"
    else
        print_error "Some services failed to start. Check logs:"
        docker-compose -f docker-compose.ip.yml logs
        exit 1
    fi
}

# Function to test the deployment
test_deployment() {
    print_status "Testing deployment..."
    
    # Test health endpoint
    if curl -s -f "http://localhost/health" >/dev/null; then
        print_success "Health check passed!"
    else
        print_warning "Health check failed. Service might still be starting..."
    fi
    
    # Test API endpoint
    if curl -s -f "http://localhost/api/v1/ping" >/dev/null; then
        print_success "API endpoint is responding!"
    else
        print_warning "API endpoint test failed. Check logs if needed."
    fi
}

# Function to show final status
show_status() {
    print_status "Deployment completed successfully!"
    echo ""
    print_success "Your application is now running at:"
    print_success "  HTTP:        http://$SERVER_IP"
    print_success "  API Base:    http://$SERVER_IP/api/v1/"
    print_success "  Swagger:     http://$SERVER_IP/api/v1/swagger/api-docs/"
    print_success "  Health:      http://$SERVER_IP/health"
    echo ""
    print_status "Useful commands:"
    echo "  View logs:           docker-compose -f docker-compose.ip.yml logs -f"
    echo "  View app logs:       docker-compose -f docker-compose.ip.yml logs -f app"
    echo "  View nginx logs:     docker-compose -f docker-compose.ip.yml logs -f nginx"
    echo "  Stop services:       docker-compose -f docker-compose.ip.yml down"
    echo "  Restart services:    docker-compose -f docker-compose.ip.yml restart"
    echo ""
    print_warning "Note: This deployment uses HTTP only. For production with SSL, you'll need a domain name."
}

# Function to setup firewall (optional)
setup_firewall() {
    print_status "Checking firewall configuration..."
    
    if command -v ufw &> /dev/null; then
        print_status "UFW detected. Ensuring port 80 is open..."
        sudo ufw allow 80/tcp 2>/dev/null || true
        print_success "Port 80 is now open!"
    elif command -v firewall-cmd &> /dev/null; then
        print_status "Firewalld detected. Ensuring port 80 is open..."
        sudo firewall-cmd --permanent --add-port=80/tcp 2>/dev/null || true
        sudo firewall-cmd --reload 2>/dev/null || true
        print_success "Port 80 is now open!"
    else
        print_warning "No firewall management tool detected. Make sure port 80 is open manually."
    fi
}

# Main deployment function
main() {
    print_status "Starting IP-only deployment for Healer Backend..."
    
    check_requirements
    get_server_ip
    check_env_file
    create_directories
    stop_existing_services
    start_services
    wait_for_services
    test_deployment
    setup_firewall
    show_status
}

# Run main function
main "$@"
