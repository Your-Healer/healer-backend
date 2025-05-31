# Quick rebuild script for IP-only deployment
# Use this after making changes to fix CORS/COOP issues

Write-Host "[INFO] Rebuilding and restarting services to apply CORS/COOP fixes..." -ForegroundColor Blue

# Stop existing services
Write-Host "[INFO] Stopping existing services..." -ForegroundColor Blue
docker-compose -f docker-compose.ip.yml down

# Rebuild the application with the updated middleware
Write-Host "[INFO] Rebuilding application..." -ForegroundColor Blue
docker-compose -f docker-compose.ip.yml build app

# Start services
Write-Host "[INFO] Starting services..." -ForegroundColor Blue
docker-compose -f docker-compose.ip.yml up -d

# Wait for services to be ready
Write-Host "[INFO] Waiting for services to start..." -ForegroundColor Blue
Start-Sleep -Seconds 15

# Check status
Write-Host "[INFO] Checking service status..." -ForegroundColor Blue
docker-compose -f docker-compose.ip.yml ps

# Test the health endpoint
Write-Host "[INFO] Testing health endpoint..." -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri "http://localhost/health" -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "[SUCCESS] Health check passed!" -ForegroundColor Green
        Write-Host "[SUCCESS] CORS/COOP issues should now be resolved!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Access your application at:" -ForegroundColor Blue
        Write-Host "  API: http://localhost/api/v1/" -ForegroundColor Green
        Write-Host "  Swagger: http://localhost/api/v1/swagger/api-docs/" -ForegroundColor Green
    }
}
catch {
    Write-Host "[WARNING] Health check failed. Check logs:" -ForegroundColor Yellow
    docker-compose -f docker-compose.ip.yml logs app
}
