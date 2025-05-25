# Base build stage - Updated to Node 20 for compatibility with dependencies
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies for building, including build tools
RUN apk add --no-cache python3 make g++ libc6-compat

# Copy package files
COPY package.json ./

# First, generate or update package-lock.json if needed
RUN npm install --package-lock-only

# Copy all source files
COPY . .

# Install dependencies using the updated package-lock.json
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript code with verbose output
RUN echo "Building TypeScript files..." && \
    npm run build && \
    echo "Build completed. Checking dist directory:" && \
    ls -la dist && \
    if [ -f "dist/index.js" ]; then echo "✅ dist/index.js exists"; else echo "❌ dist/index.js not found"; fi && \
    ls -la src/generated/prisma/client || echo "❌ Prisma client not found at expected location"

# Production stage - Also using Node 20
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Create app user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set environment variables
ENV NODE_ENV=production

# Copy package files
COPY package.json ./
COPY --from=builder /app/package-lock.json ./

# Install production dependencies only using the consistent package-lock.json
RUN npm ci --only=production && npm cache clean --force

# Install only necessary runtime tools
RUN apk add --no-cache dumb-init curl

# Copy build artifacts from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/generated ./dist/generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/swagger.json ./swagger.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Create directories with proper permissions
RUN mkdir -p /app/uploads && \
    chown -R appuser:appgroup /app

# Verify the production image structure
RUN echo "Checking production dist directory:" && \
    ls -la dist && \
    echo "Checking Prisma client location:" && \
    ls -la dist/generated/prisma/client || echo "Prisma client not found at expected location!"

# Set user to non-root
USER appuser

# Expose the application port
EXPOSE 3000

# Use dumb-init as entrypoint to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Run the application
CMD ["node", "dist/index.js"]