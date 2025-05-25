# Base build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies for building, including build tools
RUN apk add --no-cache python3 make g++ libc6-compat

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy application source
COPY . .

# Generate Prisma client to the specified output path
RUN npx prisma generate

# Build TypeScript code with verbose output
RUN echo "Building TypeScript files..." && \
    npm run build && \
    echo "Build completed. Checking dist directory:" && \
    ls -la dist && \
    if [ -f "dist/index.js" ]; then echo "✅ dist/index.js exists"; else echo "❌ dist/index.js not found"; fi

# Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Create app user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set environment variables
ENV NODE_ENV=production

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# Install only necessary runtime tools
RUN apk add --no-cache dumb-init curl

# Copy build artifacts from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/swagger.json ./swagger.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Create script for checking app readiness
RUN echo '#!/bin/sh\necho "Checking application readiness..."\nfind /app -name "index.js" | grep -q "dist/index.js" && echo "✅ Application files ready" || echo "❌ Missing main application file"' > /app/healthcheck.sh && \
    chmod +x /app/healthcheck.sh

# Create directories with proper permissions
RUN mkdir -p /app/uploads && \
    chown -R appuser:appgroup /app

# Set user to non-root
USER appuser

# Expose the application port
EXPOSE 3000

# Use dumb-init as entrypoint to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Run the application with inspection enabled for debugging
CMD ["npm", "run", "start:docker"]