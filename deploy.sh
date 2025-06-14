#!/bin/bash

# Healer Backend Deployment Script
set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="healer-backend"
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"
ENV_TEMPLATE=".env.template"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if required files exist
check_requirements() {
    log "Checking deployment requirements..."
    
    local missing_files=()
    
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        missing_files+=("$COMPOSE_FILE")
    fi
    
    if [[ ! -f "Dockerfile" ]]; then
        missing_files+=("Dockerfile")
    fi
    
    # Check for .env file or template
    if [[ ! -f "$ENV_FILE" ]]; then
        if [[ -f "$ENV_TEMPLATE" ]]; then
            warning ".env file not found, but .env.template exists"
            read -p "Do you want to create .env from template? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                cp "$ENV_TEMPLATE" "$ENV_FILE"
                warning "Created $ENV_FILE from template. Please update it with your actual values."
                log "Opening $ENV_FILE for editing..."
                ${EDITOR:-nano} "$ENV_FILE"
            else
                missing_files+=("$ENV_FILE")
            fi
        else
            missing_files+=("$ENV_FILE")
        fi
    fi
    
    if [[ ${#missing_files[@]} -gt 0 ]]; then
        error "Missing required files: ${missing_files[*]}"
        exit 1
    fi
    
    # Validate critical environment variables
    validate_env_variables
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        error "Docker is not running or not accessible"
        exit 1
    fi
    
    # Check if docker-compose is available
    if ! command -v docker-compose &> /dev/null; then
        error "docker-compose is not installed"
        exit 1
    fi
    
    success "All requirements met"
}

# Validate environment variables
validate_env_variables() {
    log "Validating environment variables..."
    
    # Source the .env file
    set -a  # automatically export all variables
    source "$ENV_FILE"
    set +a
    
    local missing_vars=()
    local critical_vars=("DATABASE_URL" "DIRECT_URL" "SECRET")
    
    for var in "${critical_vars[@]}"; do
        if [[ -z "${!var}" || "${!var}" == "3434" || "${!var}" == "343434" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        error "Missing or invalid critical environment variables: ${missing_vars[*]}"
        warning "Please update your $ENV_FILE file with proper values"
        log "Current problematic variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var: ${!var:-'(not set)'}"
        done
        exit 1
    fi
    
    # Validate DATABASE_URL format
    if [[ ! "$DATABASE_URL" =~ ^postgresql:// ]]; then
        error "DATABASE_URL must start with 'postgresql://'"
        exit 1
    fi
    
    if [[ ! "$DIRECT_URL" =~ ^postgresql:// ]]; then
        error "DIRECT_URL must start with 'postgresql://'"
        exit 1
    fi
    
    success "Environment variables validated"
}

# Test database connectivity
test_database_connection() {
    log "Testing database connectivity..."
    
    # Simplified database test using environment variables directly
    local test_result=$(docker run --rm \
        --env-file "$ENV_FILE" \
        node:20-alpine \
        sh -c "
            apk add --no-cache postgresql-client &&
            npm install -g prisma @prisma/client &&
            cat > schema.prisma << 'EOF'
generator client {
  provider = \"prisma-client-js\"
}

datasource db {
  provider = \"postgresql\"
  url = env(\"DATABASE_URL\")
  directUrl = env(\"DIRECT_URL\")
}

model TestConnection {
  id String @id @default(uuid())
}
EOF
            echo 'Testing database connection...' &&
            echo 'SELECT 1 as test;' | npx prisma db execute --schema=schema.prisma --stdin &&
            echo '✅ Database connection successful'
        " 2>&1)
    
    local exit_code=$?
    
    if [[ $exit_code -eq 0 ]]; then
        success "Database connection successful"
        log "Database test output:"
        echo "$test_result" | tail -5
    else
        error "Database connection failed"
        warning "Please check your DATABASE_URL and DIRECT_URL in $ENV_FILE"
        log "Database test error output:"
        echo "$test_result" | tail -10
        
        # Show current environment variables (partially masked for security)
        log "Current database configuration:"
        echo "  DATABASE_URL: ${DATABASE_URL:0:30}..." 
        echo "  DIRECT_URL: ${DIRECT_URL:0:30}..."
        
        # Suggest common fixes
        warning "Common database connection issues:"
        echo "  1. Check if database server is accessible from this machine"
        echo "  2. Verify username/password in connection string"
        echo "  3. Ensure database exists and is running"
        echo "  4. Check firewall settings for database port"
        echo "  5. Verify SSL settings (sslmode=require vs sslmode=prefer)"
        
        exit 1
    fi
}

# Build new images
build_images() {
    log "Building Docker images..."
    
    # Pull latest base images
    log "Pulling latest base images..."
    docker-compose pull || warning "Some base images could not be pulled"
    
    # Build with no cache to ensure fresh build and pass build args
    log "Building application images..."
    docker-compose build --no-cache --build-arg NODE_ENV=production
    
    success "Images built successfully"
}

# Deploy application
deploy() {
    log "Deploying application..."
    
    # Stop existing containers
    log "Stopping existing containers..."
    docker-compose down --remove-orphans || true
    
    # Start new containers with explicit env file
    log "Starting new containers..."
    docker-compose --env-file "$ENV_FILE" up -d
    
    success "Containers started"
}

# Health check
health_check() {
    log "Performing health checks..."
    
    local max_attempts=120  # 10 minutes total
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log "Health check attempt $attempt/$max_attempts"
        
        # Check if containers are running
        local app_status=$(docker-compose ps app --format "table {{.State}}" 2>/dev/null | tail -n 1 || echo "unknown")
        
        if [[ "$app_status" == *"Up"* ]]; then
            # Try multiple health check methods
            if curl -f -s http://localhost:3000/api/v1/ping &> /dev/null; then
                success "Application is healthy (ping endpoint)"
                return 0
            elif curl -f -s http://localhost:3000/ &> /dev/null; then
                success "Application is responding (root endpoint)"
                return 0
            elif wget -q --spider http://localhost:3000 &> /dev/null; then
                success "Application is responding (wget test)"
                return 0
            elif nc -z localhost 3000 &> /dev/null; then
                log "Port 3000 is open, but application not responding yet..."
            else
                log "Port 3000 is not yet open..."
            fi
        else
            log "Container status: $app_status"
            
            # Show logs if container is failing
            if [[ "$app_status" == *"Exit"* ]] || [[ "$app_status" == *"Restarting"* ]]; then
                log "Container issue detected. Recent logs:"
                docker-compose logs app --tail=10
            fi
        fi
        
        # Show progress and logs periodically
        if [[ $((attempt % 20)) -eq 0 ]]; then
            log "Still waiting... Current status:"
            docker-compose ps
            log "Recent application logs:"
            docker-compose logs app --tail=10
        fi
        
        sleep 5
        ((attempt++))
    done
    
    error "Health check failed after $max_attempts attempts (10 minutes)"
    log "Final diagnosis:"
    log "Container status:"
    docker-compose ps
    log "Application logs (last 50 lines):"
    docker-compose logs app --tail=50
    log "System resources:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
    return 1
}

# Rollback function
rollback() {
    error "Deployment failed, initiating rollback..."
    
    log "Stopping failed containers..."
    docker-compose down --remove-orphans || true
    
    error "Rollback completed. Please check logs and fix issues before redeploying."
    exit 1
}

# Cleanup old images and containers
cleanup() {
    log "Cleaning up old images and containers..."
    
    # Remove dangling images
    docker image prune -f &> /dev/null || true
    
    # Remove unused containers
    docker container prune -f &> /dev/null || true
    
    success "Cleanup completed"
}

# Show deployment status
show_status() {
    log "Deployment Status:"
    echo
    docker-compose ps
    echo
    docker-compose logs --tail=20
}

# Main deployment function
main() {
    log "Starting deployment of $PROJECT_NAME..."
    
    # Check requirements
    check_requirements
    
    # Test database connection before deployment
    test_database_connection
    
    # Build images
    build_images
    
    # Deploy
    deploy
    
    # Health check
    if ! health_check; then
        rollback
    fi
    
    # Cleanup
    cleanup
    
    # Show status
    show_status
    
    success "Deployment completed successfully!"
    log "Application is running at:"
    log "  - HTTP: http://localhost:80"
    log "  - Direct: http://localhost:3000"
    log "  - Health: http://localhost:3000/api/v1/ping"
    log "  - API Docs: http://localhost:3000/api-docs (if available)"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "logs")
        docker-compose logs -f
        ;;
    "status")
        docker-compose ps
        ;;
    "stop")
        log "Stopping all containers..."
        docker-compose down
        success "All containers stopped"
        ;;
    "restart")
        log "Restarting containers..."
        docker-compose restart
        success "Containers restarted"
        ;;
    "rollback")
        rollback
        ;;
    *)
        echo "Usage: $0 {deploy|logs|status|stop|restart|rollback}"
        echo "  deploy   - Full deployment (default)"
        echo "  logs     - Show container logs"
        echo "  status   - Show container status"
        echo "  stop     - Stop all containers"
        echo "  restart  - Restart containers"
        echo "  rollback - Rollback deployment"
        exit 1
        ;;
esac
        ;;
    "stop")
        log "Stopping all containers..."
        docker-compose down
        success "All containers stopped"
        ;;
    "restart")
        log "Restarting containers..."
        docker-compose restart
        success "Containers restarted"
        ;;
    "rollback")
        rollback
        ;;
    *)
        echo "Usage: $0 {deploy|logs|status|stop|restart|rollback}"
        echo "  deploy   - Full deployment (default)"
        echo "  logs     - Show container logs"
        echo "  status   - Show container status"
        echo "  stop     - Stop all containers"
        echo "  restart  - Restart containers"
        echo "  rollback - Rollback deployment"
        exit 1
        ;;
esac
        exit 1
        ;;
esac
