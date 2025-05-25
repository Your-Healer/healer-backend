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

# Generate Prisma client
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
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/swagger.json ./swagger.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Copy additional necessary files
RUN touch .env.example

# Create volume directories with proper permissions
RUN mkdir -p /app/uploads && \
    chown -R appuser:appgroup /app

# Verify the production image structure
RUN echo "Checking production dist directory:" && \
    ls -la dist && \
    if [ -f "dist/index.js" ]; then echo "✅ dist/index.js exists in production image"; else echo "❌ dist/index.js not found in production image"; fi

# Set user to non-root
USER appuser

# Expose the application port
EXPOSE 3000

# Use dumb-init as entrypoint to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Create a debug script to help troubleshoot
RUN echo "#!/bin/sh\necho 'Searching for index.js files:'\nfind /app -name 'index.js' | sort\necho 'Directory structure:'\nfind /app -type d | sort\n" > /app/debug.sh && \
    chmod +x /app/debug.sh

# Add startup script to help with troubleshooting
CMD if [ -f "dist/index.js" ]; then \
      echo "Starting application..." && \
      node dist/index.js; \
    else \
      echo "dist/index.js not found! Running debug script..." && \
      /app/debug.sh && \
      echo "Check if src/index.js exists instead:" && \
      ls -la src/ 2>/dev/null || echo "src directory not found"; \
      exit 1; \
    fi
