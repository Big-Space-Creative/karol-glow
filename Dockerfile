# syntax=docker/dockerfile:1
# Imagem única: a API serve também o front compilado (mesmo padrão dos outros projetos).
# Build: docker build -t karol-glow/app:TAG .

# ── Stage 1: build do front (Vue + Vite) ─────────────────────────────────────
FROM node:22-alpine AS client-builder
WORKDIR /build
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --prefer-offline
COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src
RUN npm run build

# ── Stage 2: dependências de produção da API ─────────────────────────────────
FROM node:22-alpine AS api-deps
WORKDIR /build
COPY server/package.json server/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --prefer-offline

# ── Stage 3: runtime ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
ENV NODE_ENV=production PORT=3008
WORKDIR /app/server

COPY --from=api-deps /build/node_modules ./node_modules
COPY server/package.json ./
COPY server/src ./src
COPY server/scripts ./scripts
COPY db /app/db
# Front compilado, servido como arquivos estáticos pela API
COPY --from=client-builder /build/dist ./public

USER node
EXPOSE 3008
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# migrate.js é idempotente: aplica o esquema só na primeira vez
CMD ["sh", "-c", "node scripts/migrate.js && node src/index.js"]
