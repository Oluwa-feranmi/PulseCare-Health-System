# ==============================================================================
# PulseCare Health System - Multi-Stage Production Dockerfile
# Optimized for AWS ECS (Fargate), minimal surface area, non-root execution
# ==============================================================================

# Stage 1: Build & Dependencies
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Run production build (Vite frontend + bundled Node CJS server)
RUN npm run build

# Stage 2: Production Container
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install runtime security packages (dumb-init for signal handling, curl for healthcheck)
RUN apk add --no-cache dumb-init curl

# Create non-root system group & user for container security
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

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.cjs"]
