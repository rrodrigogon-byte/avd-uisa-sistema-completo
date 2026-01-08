# ============================================================================
# Dockerfile Multi-Stage para AVD UISA - Otimizado para Google Cloud Run
# ============================================================================
# 
# Este Dockerfile usa build multi-stage para:
# - Reduzir tamanho da imagem final
# - Melhorar segurança (sem devDependencies)
# - Otimizar tempo de build com cache
# - Usar non-root user
#
# Build: docker build -t avd-uisa .
# Run: docker run -p 3000:3000 avd-uisa
# ============================================================================

# ============================================================================
# STAGE 1: Base - Imagem base com Node.js e pnpm
# ============================================================================
FROM node:20-alpine AS base

# Instalar pnpm globalmente
RUN npm install -g pnpm@10.15.1

# Criar diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package.json pnpm-lock.yaml ./

# ============================================================================
# STAGE 2: Dependencies - Instalar todas as dependências
# ============================================================================
FROM base AS dependencies

# Instalar todas as dependências (incluindo devDependencies para build)
RUN pnpm install --frozen-lockfile

# ============================================================================
# STAGE 3: Build - Compilar aplicação TypeScript
# ============================================================================
FROM base AS build

# Copiar node_modules da stage anterior
COPY --from=dependencies /app/node_modules ./node_modules

# Copiar código fonte
COPY . .

# Build da aplicação
# - Frontend: Vite build
# - Backend: esbuild bundle
RUN pnpm build

# ============================================================================
# STAGE 4: Production Dependencies - Instalar apenas dependências de produção
# ============================================================================
FROM base AS prod-dependencies

# Instalar apenas dependências de produção (sem devDependencies)
RUN pnpm install --prod --frozen-lockfile

# ============================================================================
# STAGE 5: Production - Imagem final otimizada
# ============================================================================
FROM node:20-alpine AS production

# Labels para metadata
LABEL maintainer="AVD UISA Team"
LABEL version="2.0.0"
LABEL description="Sistema de Avaliação de Desempenho UISA"

# Instalar apenas dependências necessárias do sistema
RUN apk add --no-cache \
    tini \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Criar diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração
COPY --chown=nodejs:nodejs package.json ./

# Copiar node_modules de produção da stage anterior
COPY --from=prod-dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copiar código buildado
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist

# Copiar arquivos do cliente (frontend build)
COPY --from=build --chown=nodejs:nodejs /app/client/dist ./client/dist

# Copiar schema do banco de dados (necessário para Drizzle ORM)
COPY --from=build --chown=nodejs:nodejs /app/drizzle ./drizzle

# Copiar arquivos estáticos públicos (se houver)
COPY --from=build --chown=nodejs:nodejs /app/client/public ./client/public

# Configurar variáveis de ambiente para produção
ENV NODE_ENV=production
ENV PORT=3000

# Expor porta 3000 (padrão Cloud Run)
EXPOSE 3000

# Mudar para usuário não-root
USER nodejs

# Health check (Cloud Run usa isso para verificar se o container está healthy)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Usar tini como init system para gerenciar sinais corretamente
ENTRYPOINT ["/sbin/tini", "--"]

# Comando para iniciar aplicação
CMD ["node", "dist/index.js"]

# ============================================================================
# Notas de Otimização:
# ============================================================================
# 
# 1. Multi-stage build reduz imagem final de ~1GB para ~200MB
# 2. Alpine Linux é mínimo e seguro
# 3. Non-root user (nodejs:nodejs) aumenta segurança
# 4. Cache de layers otimiza builds subsequentes
# 5. tini garante que sinais (SIGTERM) sejam tratados corretamente
# 6. Health check integrado para Cloud Run
# 7. Apenas dependências de produção na imagem final
#
# ============================================================================
# Build e Push para GCP:
# ============================================================================
#
# # Build local
# docker build -t gcr.io/[PROJECT_ID]/avd-uisa:latest .
#
# # Push para Container Registry
# docker push gcr.io/[PROJECT_ID]/avd-uisa:latest
#
# # Deploy no Cloud Run
# gcloud run deploy avd-uisa \
#   --image gcr.io/[PROJECT_ID]/avd-uisa:latest \
#   --region southamerica-east1 \
#   --platform managed \
#   --allow-unauthenticated
#
# ============================================================================
