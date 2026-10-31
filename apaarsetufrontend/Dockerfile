# ============================================================================
# APAARSetu National Registry System — Next.js Frontend Multi-Stage Dockerfile
# ============================================================================
# Stage 1: Dependency resolution and installation
# ============================================================================
FROM node:20-alpine AS deps

# Install libc6-compat for Alpine compatibility
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./
COPY scripts ./scripts

# Install dependencies strictly matching lockfile
RUN npm ci

# ============================================================================
# Stage 2: Application compilation & standalone packaging
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set production environment flags during build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Compile production bundles into standalone distribution
RUN npm run build

# ============================================================================
# Stage 3: Hardened, Ultra-lightweight Production Runtime (~110MB)
# ============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install curl for container health check
RUN apk add --no-cache curl

# Create dedicated non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static assets and public directory
COPY --from=builder /app/public ./public

# Set correct ownership for prerender cache
RUN mkdir .next && chown nextjs:nodejs .next

# Copy standalone output and static chunk assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to unprivileged non-root user
USER nextjs

EXPOSE 3000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["node", "server.js"]

