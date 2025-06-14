# Makefile for Healer Express.js Application
.PHONY: help build up down restart logs clean dev prod backup restore ssl-init ssl-renew migrate

# Default target
help:
	@echo "Available commands:"
	@echo "  build      - Build all Docker images"
	@echo "  up         - Start all services"
	@echo "  down       - Stop all services"
	@echo "  restart    - Restart all services"
	@echo "  logs       - View logs from all services"
	@echo "  clean      - Clean up Docker resources"
	@echo "  dev        - Start development environment"
	@echo "  prod       - Start production environment"
	@echo "  backup     - Backup database"
	@echo "  restore    - Restore database from backup"
	@echo "  ssl-init   - Initialize SSL certificates"
	@echo "  ssl-renew  - Renew SSL certificates"
	@echo "  migrate    - Run database migrations"
	@echo "  setup      - Initial setup for new deployment"

# Load environment variables
include .env
export

# Build all images
build:
	@echo "Building Docker images..."
	docker compose build --no-cache

# Start all services
up:
	@echo "Starting all services..."
	docker compose up -d
	@echo "Services started. Check status with: make logs"

# Stop all services
down:
	@echo "Stopping all services..."
	docker compose down

# Restart all services
restart: down up

# View logs
logs:
	docker compose logs -f

# View logs for specific service
logs-app:
	docker compose logs -f app

logs-nginx:
	docker compose logs -f nginx

logs-db:
	docker compose logs -f postgres

# Clean up Docker resources
clean:
	@echo "Cleaning up Docker resources..."
	docker compose down -v --remove-orphans
	docker system prune -f
	docker volume prune -f

# Development environment
dev:
	@echo "Starting development environment..."
	docker compose -f docker compose.yml -f docker compose.dev.yml up -d

# Production environment
prod: build
	@echo "Starting production environment..."
	docker compose up -d
	@echo "Production environment started"

# Database backup
backup:
	@echo "Creating database backup..."
	@mkdir -p ./backups
	docker compose exec postgres pg_dump -U $(DB_USER) $(DB_NAME) > ./backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Backup created in ./backups/"

# Restore database
restore:
	@read -p "Enter backup file path: " backup_file; \
	if [ -f "$$backup_file" ]; then \
		echo "Restoring database from $$backup_file..."; \
		docker compose exec -T postgres psql -U $(DB_USER) -d $(DB_NAME) < $$backup_file; \
		echo "Database restored successfully"; \
	else \
		echo "Backup file not found: $$backup_file"; \
	fi

# Initialize SSL certificates
ssl-init:
	@echo "Initializing SSL certificates..."
	@mkdir -p ./certbot/conf ./certbot/www
	@echo "Generating temporary self-signed certificate..."
	docker run --rm -v "$(PWD)/certbot/conf:/etc/letsencrypt" certbot/certbot \
		certonly --standalone --register-unsafely-without-email \
		--agree-tos --no-eff-email -d $(DOMAIN) --dry-run || \
		echo "Dry run completed"
	@echo "Starting services to obtain real certificate..."
	docker compose up -d nginx
	sleep 10
	docker compose run --rm certbot
	docker compose restart nginx

# Renew SSL certificates
ssl-renew:
	@echo "Renewing SSL certificates..."
	docker compose run --rm certbot renew
	docker compose restart nginx

# Run database migrations
migrate:
	@echo "Running database migrations..."
	docker compose exec app npx prisma migrate deploy
	@echo "Migrations completed"

# Generate Prisma client
generate:
	@echo "Generating Prisma client..."
	docker compose exec app npx prisma generate

# Database seed
seed:
	@echo "Seeding database..."
	docker compose exec app npm run seed

# Initial setup for new deployment
setup:
	@echo "Setting up new deployment..."
	@if [ ! -f .env ]; then \
		echo "Creating .env file from template..."; \
		cp .env.example .env; \
		echo "Please edit .env file with your configuration"; \
		exit 1; \
	fi
	@mkdir -p nginx/logs certbot/conf certbot/www uploads logs backups
	@echo "Building images..."
	$(MAKE) build
	@echo "Starting database..."
	docker compose up -d postgres redis
	@echo "Waiting for database to be ready..."
	sleep 15
	@echo "Running migrations..."
	$(MAKE) migrate
	@echo "Setup completed. Start services with: make up"

# Health check
health:
	@echo "Checking service health..."
	@docker compose ps
	@echo "\nNginx status:"
	@curl -s -o /dev/null -w "%{http_code}" http://localhost/api/v1/ping || echo "Service not responding"

# Monitor resources
monitor:
	@echo "Resource usage:"
	docker stats --no-stream

# Update application (production deployment)
deploy:
	@echo "Deploying application..."
	git pull origin main
	$(MAKE) build
	docker compose up -d app
	@echo "Deployment completed"

# Quick restart of app only
restart-app:
	@echo "Restarting application..."
	docker compose restart app

# View application logs in real-time
tail-logs:
	docker compose logs -f --tail=100 app

# Database shell
db-shell:
	docker compose exec postgres psql -U $(DB_USER) -d $(DB_NAME)

# Application shell
app-shell:
	docker compose exec app sh

# Nginx configuration test
nginx-test:
	docker compose exec nginx nginx -t

# Reload nginx configuration
nginx-reload:
	docker compose exec nginx nginx -s reload