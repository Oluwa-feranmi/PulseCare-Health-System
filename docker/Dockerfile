# ==============================================================================
# PulseCare Health System - Multi-Stage Production Dockerfile
# Optimized for AWS ECS (Fargate), minimal surface area, non-root execution
# ==============================================================================

# Stage 1: Build & Dependencies
FROM node:22-alpine AS builder

WORKDIR /app

# Install build prerequisites
RUN apk add --no-cache python3 make g++

# Copy package descriptors
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Run production build (Vite frontend + bundled Node CJS server)
RUN npm run build

# Stage 2: Production Container
FROM node:22-alpine AS runner

WORKDIR /app

# Set container environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Install runtime security packages (dumb-init for PID 1 signal forwarding, curl for health checks)
RUN apk add --no-cache dumb-init curl

# Create non-root system group & user for container security (CWE-250)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Copy package descriptors & production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled artifacts from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/database ./database
COPY --from=builder /app/package.json ./package.json

# Set ownership of workspace to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose container ingress port
EXPOSE 3000

# Container Healthcheck used by Docker and AWS ECS Task Definitions
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Launch using dumb-init to gracefully handle SIGTERM from AWS ECS
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.cjs"]
