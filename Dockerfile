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

# Copiar todo o código
COPY . .

# Garantir que o frontend existe
RUN mkdir -p client/dist && \
    if [ ! -f client/dist/index.html ]; then \
      echo "Frontend não encontrado, criando placeholder..."; \
      cat > client/dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AVD UISA - Sistema de Avaliação</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .container {
      text-align: center;
      padding: 40px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
      max-width: 700px;
    }
    h1 { font-size: 3em; margin-bottom: 20px; }
    .button {
      display: inline-block;
      padding: 15px 40px;
      margin: 10px;
      background: white;
      color: #667eea;
      text-decoration: none;
      border-radius: 30px;
      font-weight: bold;
    }
    .button:hover { transform: scale(1.05); }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎯 AVD UISA v2.0.0</h1>
    <p>Sistema de Avaliação de Desempenho</p>
    <div style="margin-top: 30px;">
      <a href="/health" class="button">Health Check</a>
      <a href="/api" class="button">API Info</a>
      <a href="/api/status" class="button">System Status</a>
    </div>
    <div style="margin-top: 30px;">
      <p>📊 3.114 Funcionários | 622 Usuários | 26 Tabelas</p>
      <p>🚀 API Completa | 125+ Routers | Multi-tenancy</p>
    </div>
  </div>
</body>
</html>
EOF
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
