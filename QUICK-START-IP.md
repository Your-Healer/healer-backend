# Quick Start - IP-Only Deployment

This guide helps you quickly deploy the Healer Backend on a VPS using only an IP address (no domain required).

## 🚀 Quick Deployment Steps

### 1. Prepare Your VPS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
```

### 2. Clone and Setup

```bash
# Clone repository
git clone <your-repository-url> healer-backend
cd healer-backend

# Setup environment
cp .env.template .env
nano .env  # Edit with your settings

# Make scripts executable
chmod +x deploy-ip.sh
```

### 3. Deploy

```bash
# Run deployment
./deploy-ip.sh
```

### 4. Access Your API

After successful deployment:

- **API Base**: `http://YOUR_VPS_IP/api/v1/`
- **Swagger Docs**: `http://YOUR_VPS_IP/api/v1/swagger/api-docs/`
- **Health Check**: `http://YOUR_VPS_IP/health`

## 🔧 Environment Configuration

Edit your `.env` file with these required settings:

```env
# Application
PORT=3000
SECRET=your_strong_jwt_secret_here

# Database (replace with your database URL)
DATABASE_URL=postgresql://username:password@host:port/database

# Node Environment
NODE_ENV=production

# Redis (if using)
REDIS_URL=redis://username:password@host:port

# Supabase (if using)
SUPABASE_URL=your_supabase_url
SUPABASE_API_KEY=your_supabase_api_key
```

## 📝 Common Commands

```bash
# View logs
docker-compose -f docker-compose.ip.yml logs -f

# Restart services
docker-compose -f docker-compose.ip.yml restart

# Stop services
docker-compose -f docker-compose.ip.yml down

# Update application
git pull
docker-compose -f docker-compose.ip.yml build app
docker-compose -f docker-compose.ip.yml up -d
```

## 🔒 Security Notes

- This deployment uses HTTP only (no SSL)
- For production, consider getting a domain and using SSL
- Make sure to secure your database and use strong passwords
- Configure firewall to allow only necessary ports (80, 22)

## 🔍 Troubleshooting

### Service not starting?

```bash
# Check service status
docker-compose -f docker-compose.ip.yml ps

# Check logs
docker-compose -f docker-compose.ip.yml logs app
```

### Can't access API?

```bash
# Check if port 80 is open
sudo netstat -tlnp | grep :80

# Test locally
curl http://localhost/health
```

### Database connection issues?

```bash
# Check environment variables
docker-compose -f docker-compose.ip.yml exec app env | grep DATABASE
```

## 📞 Support

For detailed deployment guide, see `DEPLOYMENT.md`

For issues, check:

1. Service logs
2. Firewall settings
3. Environment variables
4. Database connectivity
