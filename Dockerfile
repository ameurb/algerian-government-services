# 🇩🇿 Algerian Government Services - Docker Configuration
# Multi-stage build for production deployment

FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js application
RUN npm run build

# Production image, copy all the files and run applications
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built Next.js application
COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files and generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy MCP server and related files
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/pages ./pages
COPY --from=builder /app/components ./components

# Copy package.json and install production dependencies
COPY package.json ./
RUN npm install tsx express cors @prisma/client zod --production

# Create startup script
RUN echo '#!/bin/sh\n\
echo "🇩🇿 Starting Algerian Government Services..."\n\
echo "🔧 Starting MCP Server on port 8081..."\n\
npm run mcp:http &\n\
echo "📱 Starting Next.js on port 3000..."\n\
npm start' > /app/start.sh

RUN chmod +x /app/start.sh

USER nextjs

EXPOSE 3000 8081

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
ENV MCP_SERVER_PORT 8081

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start both services
CMD ["/app/start.sh"]