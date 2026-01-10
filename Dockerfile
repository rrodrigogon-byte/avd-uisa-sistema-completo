# ============================================================================
# Dockerfile Simplificado - Apenas Backend + Frontend Estático
# ============================================================================

FROM node:20-alpine

# Instalar pnpm
RUN npm install -g pnpm@10.15.1

WORKDIR /app

# Copiar package files
COPY package.json pnpm-lock.yaml ./

# Instalar TODAS as dependências (não apenas prod, porque precisamos do drizzle-orm)
RUN pnpm install --frozen-lockfile

# Copiar código fonte primeiro (exceto client/dist)
COPY server ./server
COPY drizzle ./drizzle
COPY db ./db
COPY *.ts *.json *.js ./

# Copiar frontend pré-buildado (CRÍTICO!)
COPY client/dist ./client/dist

# Verificar que o frontend foi copiado corretamente
RUN echo "📦 Verificando arquivos copiados..." && \
    ls -la client/dist/ && \
    if [ ! -f client/dist/index.html ]; then \
      echo "❌ ERROR: client/dist/index.html não foi copiado!"; \
      exit 1; \
    else \
      echo "✅ Frontend copiado com sucesso!"; \
      echo "📄 Tamanho do index.html: $(wc -c < client/dist/index.html) bytes"; \
    fi

# Build APENAS do backend (sem Vite)
RUN pnpm esbuild server/_core/index.ts \
    --platform=node \
    --packages=external \
    --bundle \
    --format=esm \
    --outdir=dist || echo "Backend build warning (ignored)"

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Expor porta
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Iniciar usando o código TypeScript direto (tsx)
CMD ["pnpm", "tsx", "server/_core/index.ts"]
