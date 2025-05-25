#!/bin/sh
set -e

# Ensure uploads directory exists
mkdir -p /app/uploads

# Log environment info (without revealing secrets)
echo "Starting application with:"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "Database host: $(echo $DATABASE_URL | sed -r 's/^.*@([^:]+).*$/\1/')"
echo "Redis host: $REDIS_HOST"

# Start the application
echo "Starting application..."
exec node dist/index.js
