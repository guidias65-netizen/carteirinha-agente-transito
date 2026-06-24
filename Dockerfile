# ── Stage 1: Build do frontend ──────────────────────────────────────────────
  FROM node:22-alpine AS builder

  WORKDIR /app

  COPY package.json ./
  RUN npm install

  COPY . .
  RUN npm run build

  # ── Stage 2: Imagem de produção ──────────────────────────────────────────────
  FROM node:22-alpine AS production

  WORKDIR /app

  RUN addgroup -S appgroup && adduser -S appuser -G appgroup

  COPY package.json ./
  RUN npm install --omit=dev

  COPY server.js ./
  COPY --from=builder /app/dist ./dist

  RUN chown -R appuser:appgroup /app
  USER appuser

  EXPOSE 3300

  HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD node -e "fetch('http://localhost:' + (process.env.PORT || 3300) + '/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

  CMD ["node", "server.js"]
  