# PowerShell deployment script for IP-only VPS deployment
# This script deploys without SSL certificates and domain configuration

param(
    [string]$ServerIP = ""
)

# Color functions for output
function Write-StatusInfo($message) {
    Write-Host "[INFO] $message" -ForegroundColor Blue
}

function Write-StatusSuccess($message) {
    Write-Host "[SUCCESS] $message" -ForegroundColor Green
}

function Write-StatusWarning($message) {
    Write-Host "[WARNING] $message" -ForegroundColor Yellow
}

function Write-StatusError($message) {
    Write-Host "[ERROR] $message" -ForegroundColor Red
}

# Function to check if required tools are installed
function Test-Requirements {
    Write-StatusInfo "Checking requirements..."
    
    if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-StatusError "Docker is not installed. Please install Docker Desktop first."
        exit 1
    }
    
    if (!(Get-Command docker compose -ErrorAction SilentlyContinue)) {
        Write-StatusError "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    }
    
    Write-StatusSuccess "All requirements met!"
}

# Function to get server IP
function Get-ServerIP {
    Write-StatusInfo "Getting server IP address..."
    
    if ([string]::IsNullOrEmpty($ServerIP)) {
        try {
            $ServerIP = (Invoke-RestMethod -Uri "http://ifconfig.me" -TimeoutSec 10).Trim()
        }
        catch {
            try {
                $ServerIP = (Invoke-RestMethod -Uri "http://ipinfo.io/ip" -TimeoutSec 10).Trim()
            }
            catch {
                $ServerIP = Read-Host "Could not detect IP automatically. Please enter your VPS IP address"
            }
        }
    }
    
    Write-StatusSuccess "Server IP: $ServerIP"
    return $ServerIP
}

# Function to check environment file
function Test-EnvFile {
    Write-StatusInfo "Checking environment configuration..."
    
    if (!(Test-Path ".env")) {
        Write-StatusWarning ".env file not found."
        
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            Write-StatusInfo "Created .env from template. Please edit it with your production settings."
            Write-StatusWarning "Edit the .env file now and press Enter when done..."
            Read-Host
        }
        else {
            Write-StatusError ".env.example file not found. Please create .env file manually."
            exit 1
        }
    }
    else {
        Write-StatusSuccess ".env file found!"
    }
}

# Function to create necessary directories
function New-RequiredDirectories {
    Write-StatusInfo "Creating necessary directories..."
    
    if (!(Test-Path "uploads")) { New-Item -ItemType Directory -Path "uploads" -Force | Out-Null }
    if (!(Test-Path "nginx\conf.d")) { New-Item -ItemType Directory -Path "nginx\conf.d" -Force | Out-Null }
    
    Write-StatusSuccess "Directories created!"
}

# Function to stop existing services
function Stop-ExistingServices {
    Write-StatusInfo "Stopping any existing services..."
    
    try {
        & docker compose -f docker compose.ip.yml down 2>$null
    } catch {}
    
    try {
        & docker compose -f docker compose.prod.yml down 2>$null
    } catch {}
    
    try {
        & docker compose down 2>$null
    } catch {}
    
    Write-StatusSuccess "Existing services stopped!"
}

# Function to build and start services
function Start-Services {
    Write-StatusInfo "Building and starting services..."
    
    # Build the application
    & docker compose -f docker compose.ip.yml build
    if ($LASTEXITCODE -ne 0) {
        Write-StatusError "Failed to build application!"
        exit 1
    }
    
    # Start services
    & docker compose -f docker compose.ip.yml up -d
    if ($LASTEXITCODE -ne 0) {
        Write-StatusError "Failed to start services!"
        exit 1
    }
    
    Write-StatusSuccess "Services started!"
}

# Function to wait for services
function Wait-ForServices {
    Write-StatusInfo "Waiting for services to be ready..."
    
    Start-Sleep -Seconds 10
    
    $services = & docker compose -f docker compose.ip.yml ps
    if ($services -match "Up") {
        Write-StatusSuccess "Services are running!"
    }
    else {
        Write-StatusError "Some services failed to start. Check logs:"
        & docker compose -f docker compose.ip.yml logs
        exit 1
    }
}

# Function to test deployment
function Test-Deployment {
    Write-StatusInfo "Testing deployment..."
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost/health" -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-StatusSuccess "Health check passed!"
        }
    }
    catch {
        Write-StatusWarning "Health check failed. Service might still be starting..."
    }
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost/api/v1/ping" -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-StatusSuccess "API endpoint is responding!"
        }
    }
    catch {
        Write-StatusWarning "API endpoint test failed. Check logs if needed."
    }
}

# Function to show final status
function Show-Status {
    param([string]$IP)
    
    Write-StatusInfo "Deployment completed successfully!"
    Write-Host ""
    Write-StatusSuccess "Your application is now running at:"
    Write-StatusSuccess "  HTTP:        http://$IP"
    Write-StatusSuccess "  API Base:    http://$IP/api/v1/"
    Write-StatusSuccess "  Swagger:     http://$IP/api/v1/swagger/api-docs/"
    Write-StatusSuccess "  Health:      http://$IP/health"
    Write-Host ""
    Write-StatusInfo "Useful commands:"
    Write-Host "  View logs:           docker compose -f docker compose.ip.yml logs -f"
    Write-Host "  View app logs:       docker compose -f docker compose.ip.yml logs -f app"
    Write-Host "  View nginx logs:     docker compose -f docker compose.ip.yml logs -f nginx"
    Write-Host "  Stop services:       docker compose -f docker compose.ip.yml down"
    Write-Host "  Restart services:    docker compose -f docker compose.ip.yml restart"
    Write-Host ""
    Write-StatusWarning "Note: This deployment uses HTTP only. For production with SSL, you'll need a domain name."
}

# Main function
function Main {
    Write-StatusInfo "Starting IP-only deployment for Healer Backend..."
    
    Test-Requirements
    $IP = Get-ServerIP
    Test-EnvFile
    New-RequiredDirectories
    Stop-ExistingServices
    Start-Services
    Wait-ForServices
    Test-Deployment
    Show-Status -IP $IP
}

# Run main function
Main
