# Healer Backend

## System Architecture

### Database

![Class diagram](<./assets//Healer%20Application%20(1).png>)

## Deployment with Docker

### Prerequisites

- Docker and Docker Compose installed on your VPS
- External PostgreSQL database service
- External Redis service

### Setup Instructions

1. **Create your .env file**

   Copy the template and fill in your actual values:

   ```bash
   cp .env.template .env
   ```

   Then edit the .env file with your actual database and Redis connection details:

   ```
   # Example .env file
   PORT=3000
   SECRET=your_jwt_secret_key_here
   DATABASE_URL=postgresql://username:password@your-db-host.com:5432/healer_db
   DIRECT_URL=postgresql://username:password@your-db-host.com:5432/healer_db
   REDIS_HOST=your-redis-host.com
   REDIS_PORT=6379
   REDIS_USERNAME=default
   REDIS_PASSWORD=your_redis_password
   ```

2. **Deploy with Docker Compose**

   ```bash
   docker-compose up -d
   ```

3. **Run Database Migrations**

   ```bash
   docker-compose exec app npx prisma migrate deploy
   ```

4. **Seed the Database (Optional)**

   ```bash
   docker-compose exec app npx prisma db seed
   ```

5. **Check logs**

   ```bash
   docker-compose logs -f app
   ```

### Additional Information

- The application runs on port 3000 by default
- Swagger API documentation is available at `/api/v1/docs`
- Make sure your database and Redis services allow connections from your VPS IP address
