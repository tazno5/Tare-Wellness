# syntax=docker/dockerfile:1.7

# ============================================================
# Tare Wellness — Production Dockerfile
# ============================================================
# Multi-stage build for Next.js 16 with standalone output.
#
# Build:  docker build -t tare-wellness .
# Run:    docker run -p 3000:3000 \
#           -e DATABASE_URL=$DATABASE_URL \
#           -e NEXTAUTH_SECRET=$NEXTAUTH_SECRET \
#           -e NEXTAUTH_URL=$NEXTAUTH_URL \
#           -e RESEND_API_KEY=$RESEND_API_KEY \
#           -e EMAIL_FROM=$EMAIL_FROM \
#           tare-wellness
# ============================================================

# ---------- Stage 1: deps ----------
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Enable Bun for faster installs (optional — falls back to npm)
RUN npm install -g bun

COPY package.json bun.lock* package-lock.json* ./
COPY prisma ./prisma
RUN \
  if [ -f bun.lock ]; then bun install --frozen-lockfile; \
  else npm ci; fi

# Generate Prisma client
RUN npx prisma generate

# ---------- Stage 2: builder ----------
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
RUN npm install -g bun

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build the standalone Next.js output
# NOTE: `next build` requires NEXTAUTH_SECRET to be set at build time
# because of the fail-fast check in src/lib/auth.ts. Provide a dummy
# build-time secret — the real secret is injected at runtime.
ARG NEXTAUTH_SECRET=build-time-placeholder-not-used-at-runtime
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXTAUTH_URL=https://placeholder.example.com

RUN \
  if [ -f bun.lock ]; then bun run build; \
  else npm run build; fi

# ---------- Stage 3: runner ----------
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the standalone build output + static assets + public dir
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy Prisma schema + migrations for runtime db commands
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api || exit 1

CMD ["node", "server.js"]
