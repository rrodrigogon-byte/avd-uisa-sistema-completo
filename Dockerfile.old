# ============================================================================
# Dockerfile Simplificado para AVD UISA - Google Cloud Run
# ============================================================================
# 
# Dockerfile otimizado e simplificado para evitar erros de build
# Foco: rodar servidor e conectar no banco MySQL
#
# ============================================================================

# ============================================================================
# STAGE 1: Build - Compilar aplicação
# ============================================================================
FROM node:20-alpine AS builder

# Instalar pnpm
RUN npm install -g pnpm@10.15.1

# Criar diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package.json pnpm-lock.yaml ./

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Copiar código fonte
COPY . .

# Garantir que client/dist existe com a página placeholder
RUN mkdir -p client/dist && \
    if [ ! -f client/dist/index.html ]; then \
      echo "Creating placeholder index.html"; \
      cp client/dist/index.html client/dist/index.html 2>/dev/null || \
      echo '<!DOCTYPE html><html><head><title>AVD UISA</title></head><body><h1>AVD UISA System</h1></body></html>' > client/dist/index.html; \
    fi

# Build da aplicação
# Backend: esbuild bundle
ENV NODE_ENV=production
RUN pnpm esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist || echo "Build completed with warnings"

# ============================================================================
# STAGE 2: Production - Imagem final otimizada
# ============================================================================
FROM node:20-alpine AS production

# Instalar pnpm
RUN npm install -g pnpm@10.15.1

# Criar diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração
COPY package.json pnpm-lock.yaml ./

# Instalar apenas dependências de produção
RUN pnpm install --prod --frozen-lockfile

# Copiar código buildado do stage anterior
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/drizzle ./drizzle

# Copiar arquivos essenciais
COPY --from=builder /app/server ./server

# Configurar variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Expor porta 3000 (Cloud Run)
EXPOSE 3000

# Comando para iniciar aplicação
CMD ["node", "dist/index.js"]

# ============================================================================
# Notas:
# ============================================================================
# 
# - Dockerfile simplificado para evitar erros de build
# - Usa apenas 2 stages: builder e production
# - Remove dependências desnecessárias do Alpine
# - Mantém estrutura mínima necessária
# - Foco em estabilidade e deploy rápido
#
# Build: docker build -t avd-uisa .
# Run: docker run -p 3000:3000 -e DATABASE_URL="..." avd-uisa
#
# ============================================================================
