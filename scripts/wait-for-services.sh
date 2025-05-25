#!/bin/sh
# wait-for-services.sh

set -e

echo "Checking external services..."

# Extract host and port from DATABASE_URL
DB_HOST=$(echo $DATABASE_URL | sed -e 's/^.*@\(.*\):[0-9]*\/.*$/\1/')
DB_PORT=$(echo $DATABASE_URL | sed -e 's/^.*:\([0-9]*\)\/.*$/\1/')

# Extract host and port from REDIS_URL or use REDIS_HOST and REDIS_PORT
if [ -n "$REDIS_URL" ]; then
  REDIS_HOST=$(echo $REDIS_URL | sed -e 's/^.*@\(.*\):[0-9]*$/\1/')
  REDIS_PORT=$(echo $REDIS_URL | sed -e 's/^.*:\([0-9]*\)$/\1/')
fi

echo "Database host: $DB_HOST, port: $DB_PORT"
echo "Redis host: $REDIS_HOST, port: $REDIS_PORT"

# Function to check if a host is reachable
check_host() {
  host=$1
  port=$2
  max_attempts=$3
  wait_seconds=$4
  service_name=$5
  
  attempt=1
  
  while [ $attempt -le $max_attempts ]; do
    nc -z -w5 $host $port >/dev/null 2>&1
    result=$?
    if [ $result -eq 0 ]; then
      echo "$service_name is available!"
      return 0
    fi
    
    echo "Waiting for $service_name to become available... attempt $attempt/$max_attempts"
    sleep $wait_seconds
    attempt=$((attempt+1))
  done
  
  echo "Error: Could not connect to $service_name at $host:$port after $max_attempts attempts"
  return 1
}

# Check database connectivity
if [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ]; then
  check_host $DB_HOST $DB_PORT 10 3 "Database" || exit 1
fi

# Check Redis connectivity
if [ -n "$REDIS_HOST" ] && [ -n "$REDIS_PORT" ]; then
  check_host $REDIS_HOST $REDIS_PORT 10 3 "Redis" || exit 1
fi

echo "All external services are available. Starting application..."
exec "$@"
