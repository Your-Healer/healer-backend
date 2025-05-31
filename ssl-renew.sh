# SSL Certificate Renewal Script
# Run this script periodically to renew SSL certificates

#!/bin/bash

# Navigate to project directory
cd "$(dirname "$0")"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}[$(date)] Starting SSL certificate renewal...${NC}"

# Attempt to renew certificates
docker compose -f docker compose.prod.yml run --rm certbot renew --quiet

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[$(date)] SSL certificate renewal successful${NC}"
    
    # Reload Nginx to use new certificates
    docker compose -f docker compose.prod.yml restart nginx
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[$(date)] Nginx restarted successfully${NC}"
    else
        echo -e "${RED}[$(date)] Failed to restart Nginx${NC}"
        exit 1
    fi
else
    echo -e "${RED}[$(date)] SSL certificate renewal failed${NC}"
    exit 1
fi

echo -e "${GREEN}[$(date)] SSL renewal process completed${NC}"
