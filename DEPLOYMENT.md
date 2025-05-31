# Healer Backend - VPS Deployment Guide

This guide will help you deploy the Healer Backend application on a VPS with Nginx as a reverse proxy and SSL certificates.

## Prerequisites

1. **VPS Requirements:**

   - Ubuntu 20.04+ or CentOS 7+ (recommended)
   - At least 2GB RAM and 20GB disk space
   - Root or sudo access
   - Domain name pointing to your VPS IP

2. **Software Requirements:**
   - Docker
   - Docker Compose
   - Git

## Quick Deployment

### Step 1: Install Docker and Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again to apply group changes
```

### Step 2: Clone and Setup Project

```bash
# Clone your repository
git clone <your-repo-url> healer-backend
cd healer-backend

# Make deployment scripts executable
chmod +x deploy.sh
chmod +x ssl-renew.sh

# Create environment file
cp .env.example .env
# Edit .env with your production settings
nano .env
```

### Step 3: Configure Domain

Make sure your domain DNS A record points to your VPS IP address:

```
A    your-domain.com      YOUR_VPS_IP
A    www.your-domain.com  YOUR_VPS_IP
```

### Step 4: Deploy Application

```bash
# Run the deployment script
./deploy.sh
```

The script will:

1. Ask for your domain name and email
2. Update configuration files
3. Start services without SSL
4. Obtain SSL certificates from Let's Encrypt
5. Configure Nginx with SSL
6. Set up automatic certificate renewal

## Manual Deployment

If you prefer manual deployment:

### Step 1: Update Configuration

1. Edit `nginx/conf.d/default.conf`:

   - Replace `your-domain.com` with your actual domain
   - Replace `www.your-domain.com` with your www subdomain

2. Update `docker-compose.prod.yml`:
   - Replace `your-email@example.com` with your email

### Step 2: Start Services

```bash
# Build and start the application
docker-compose -f docker-compose.prod.yml up -d app nginx

# Wait for services to be ready
sleep 10

# Obtain SSL certificate
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d your-domain.com \
  -d www.your-domain.com

# Restart Nginx to load SSL certificates
docker-compose -f docker-compose.prod.yml restart nginx
```

## SSL Certificate Renewal

SSL certificates are automatically renewed. The renewal is handled by:

1. **Automatic Renewal Script:** `ssl-renew.sh`
2. **Cron Job:** Add to your crontab:

   ```bash
   # Edit crontab
   crontab -e

   # Add this line to renew certificates daily at noon
   0 12 * * * /path/to/your/project/ssl-renew.sh
   ```

## Useful Commands

### Service Management

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f app
docker-compose -f docker-compose.prod.yml logs -f nginx

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Stop services
docker-compose -f docker-compose.prod.yml down

# Update and restart (for code changes)
git pull
docker-compose -f docker-compose.prod.yml build app
docker-compose -f docker-compose.prod.yml up -d
```

### SSL Management

```bash
# Manual certificate renewal
./ssl-renew.sh

# Check certificate status
docker-compose -f docker-compose.prod.yml run --rm certbot certificates

# Test certificate renewal (dry run)
docker-compose -f docker-compose.prod.yml run --rm certbot renew --dry-run
```

### Monitoring

```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# Monitor resource usage
docker stats

# Check Nginx access logs
docker-compose -f docker-compose.prod.yml exec nginx tail -f /var/log/nginx/access.log

# Check Nginx error logs
docker-compose -f docker-compose.prod.yml exec nginx tail -f /var/log/nginx/error.log
```

## Security Features

### Implemented Security Measures:

1. **SSL/TLS encryption** with Let's Encrypt certificates
2. **Security headers** (HSTS, XSS Protection, etc.)
3. **Rate limiting** for API endpoints
4. **CORS configuration** for cross-origin requests
5. **File upload size limits**
6. **HTTP to HTTPS redirection**

### Nginx Security Features:

- **Rate limiting:** 10 requests/second for general API, 5 requests/second for auth
- **Security headers:** XSS protection, content type sniffing protection
- **SSL best practices:** Modern TLS protocols and ciphers
- **Request size limits:** 50MB maximum request body

## Troubleshooting

### Common Issues:

1. **SSL Certificate Issues:**

   ```bash
   # Check if port 80 is accessible
   curl http://your-domain.com/.well-known/acme-challenge/test

   # Verify DNS resolution
   nslookup your-domain.com
   ```

2. **Service Not Starting:**

   ```bash
   # Check service logs
   docker-compose -f docker-compose.prod.yml logs app

   # Check if ports are available
   sudo netstat -tlnp | grep :80
   sudo netstat -tlnp | grep :443
   ```

3. **Database Connection Issues:**

   ```bash
   # Check environment variables
   docker-compose -f docker-compose.prod.yml exec app env | grep DATABASE

   # Test database connection
   docker-compose -f docker-compose.prod.yml exec app npm run db:test
   ```

### Log Locations:

- **Application logs:** `docker-compose logs app`
- **Nginx access logs:** `docker-compose exec nginx cat /var/log/nginx/access.log`
- **Nginx error logs:** `docker-compose exec nginx cat /var/log/nginx/error.log`
- **SSL certificate logs:** `docker-compose logs certbot`

## API Endpoints

After deployment, your API will be available at:

- **Base URL:** `https://your-domain.com/api/v1/`
- **API Documentation:** `https://your-domain.com/api/v1/swagger/api-docs/`
- **Health Check:** `https://your-domain.com/health`

### Example API Calls:

```bash
# Health check
curl https://your-domain.com/health

# Get API documentation
curl https://your-domain.com/api/v1/swagger/api-docs/

# Test authentication endpoint
curl -X POST https://your-domain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## Environment Variables

Make sure to set these in your `.env` file:

```env
# Database
DATABASE_URL="your-database-connection-string"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# Node Environment
NODE_ENV="production"
PORT=3000

# CORS Origins (update with your frontend domain)
CORS_ORIGINS="https://your-frontend-domain.com,https://www.your-frontend-domain.com"

# File Upload
MAX_FILE_SIZE="50mb"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Monitoring and Maintenance

### Regular Maintenance Tasks:

1. **Monitor logs** for errors and security issues
2. **Update Docker images** regularly
3. **Monitor disk space** and clean up old logs
4. **Backup database** regularly
5. **Monitor SSL certificate expiration**

### Health Monitoring:

```bash
# Create a simple health check script
cat > health-check.sh << 'EOF'
#!/bin/bash
response=$(curl -s -o /dev/null -w "%{http_code}" https://your-domain.com/health)
if [ $response -eq 200 ]; then
    echo "$(date): Service is healthy"
else
    echo "$(date): Service is down (HTTP $response)"
    # Add notification logic here (email, Slack, etc.)
fi
EOF

chmod +x health-check.sh

# Add to crontab for regular health checks
# */5 * * * * /path/to/health-check.sh >> /var/log/health-check.log
```

## Support

If you encounter any issues during deployment:

1. Check the logs for error messages
2. Verify your DNS settings
3. Ensure firewall allows ports 80 and 443
4. Check environment variables are correctly set
5. Verify database connectivity

For additional support, check the project documentation or create an issue in the repository.
