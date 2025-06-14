# Base build stage - Updated to Node 20 for compatibility with dependencies
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies for building, including build tools
RUN apk add --no-cache python3 make g++ libc6-compat

# Copy package files
COPY package.json ./

# Generate fresh package-lock.json to ensure sync
RUN npm install --package-lock-only

# Copy prisma schema first for better layer caching
COPY prisma ./prisma

# Install dependencies using npm
RUN npm install

# Generate Prisma client BEFORE copying source code
RUN npx prisma generate

# Copy all source files
COPY . .

# Build TypeScript code with verbose output
RUN echo "Building TypeScript files..." && \
  npm run build && \
  echo "Build completed. Checking dist directory:" && \
  ls -la dist && \
  if [ -f "dist/index.js" ]; then echo "✅ dist/index.js exists"; else echo "❌ dist/index.js not found"; fi

# Production stage - Also using Node 20
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Create app user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set environment variables
ENV NODE_ENV=production

# Copy package files and the fresh lock file from builder
COPY package.json ./
COPY --from=builder /app/package-lock.json ./

# Copy prisma schema
COPY --from=builder /app/prisma ./prisma

# Install production dependencies - use --omit=dev instead of deprecated --only=production
RUN npm ci --omit=dev && npm cache clean --force

# Generate Prisma client in production stage
RUN npx prisma generate

# Install necessary runtime tools including wget for health checks and postgresql-client for database operations
RUN apk add --no-cache dumb-init curl wget postgresql-client

# Copy build artifacts from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/swagger.json ./swagger.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Create directories with proper permissions
RUN mkdir -p /app/uploads /app/logs && \
  chown -R appuser:appgroup /app

# Verify the production image structure
RUN echo "Checking production dist directory:" && \
  ls -la dist && \
  echo "Checking Prisma client in node_modules:" && \
  ls -la node_modules/@prisma/client || echo "Prisma client not found in node_modules!"

# Set user to non-root
USER appuser

# Expose the application port
EXPOSE 3000

# Use dumb-init as entrypoint to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Run the application
CMD ["node", "dist/index.js"]