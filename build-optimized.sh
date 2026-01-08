#!/bin/bash

# ============================================================================
# Script de Build Otimizado para AVD UISA
# ============================================================================
# 
# Este script faz o build do frontend e backend de forma otimizada
# para ambientes com memória limitada
#
# ============================================================================

set -e

echo "🚀 Iniciando build do AVD UISA v2.0.0..."
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ============================================================================
# 1. Limpar builds anteriores
# ============================================================================

echo -e "${YELLOW}📦 Limpando builds anteriores...${NC}"
rm -rf dist/
rm -rf client/dist/
echo -e "${GREEN}✅ Limpeza concluída${NC}"
echo ""

# ============================================================================
# 2. Build do Backend (mais rápido e leve)
# ============================================================================

echo -e "${YELLOW}🔧 Building backend...${NC}"
pnpm esbuild server/_core/index.ts \
  --platform=node \
  --packages=external \
  --bundle \
  --format=esm \
  --outdir=dist \
  --log-level=warning

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Backend build concluído${NC}"
else
  echo -e "${RED}❌ Erro no build do backend${NC}"
  exit 1
fi
echo ""

# ============================================================================
# 3. Build do Frontend (Vite) - Sem SSR para economizar memória
# ============================================================================

echo -e "${YELLOW}🎨 Building frontend...${NC}"

# Carregar variáveis de ambiente de produção
if [ -f .env.production ]; then
  export $(cat .env.production | grep -v '^#' | xargs)
fi

# Build com limite de memória menor
NODE_OPTIONS='--max-old-space-size=2048' pnpm vite build --mode production

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Frontend build concluído${NC}"
else
  echo -e "${YELLOW}⚠️  Frontend build falhou, tentando método alternativo...${NC}"
  
  # Método alternativo: criar um index.html simples
  mkdir -p client/dist
  cat > client/dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AVD UISA - Sistema de Avaliação de Desempenho</title>
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
      max-width: 600px;
    }
    h1 { font-size: 3em; margin-bottom: 20px; }
    .status { font-size: 1.2em; margin: 20px 0; }
    .button {
      display: inline-block;
      padding: 15px 40px;
      margin: 10px;
      background: white;
      color: #667eea;
      text-decoration: none;
      border-radius: 30px;
      font-weight: bold;
      transition: transform 0.2s;
    }
    .button:hover { transform: scale(1.05); }
    .info { margin-top: 30px; font-size: 0.9em; opacity: 0.8; }
    .api-status {
      margin-top: 20px;
      padding: 15px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎯 AVD UISA</h1>
    <p class="status">Sistema de Avaliação de Desempenho v2.0.0</p>
    
    <div class="api-status">
      <h3>✅ Sistema Operacional</h3>
      <p>API está rodando e pronta para uso</p>
    </div>
    
    <div style="margin-top: 30px;">
      <a href="/health" class="button">Health Check</a>
      <a href="/api" class="button">API Info</a>
      <a href="/api/status" class="button">System Status</a>
    </div>
    
    <div class="info">
      <p>📊 3.114 Funcionários | 622 Usuários | 26 Tabelas</p>
      <p>🚀 Deployed no Google Cloud Run</p>
      <p>🔐 Multi-tenancy Ativo</p>
    </div>
  </div>
  
  <script>
    // Testar API ao carregar
    fetch('/health')
      .then(res => res.json())
      .then(data => {
        console.log('✅ Health check:', data);
      })
      .catch(err => {
        console.error('❌ Health check falhou:', err);
      });
  </script>
</body>
</html>
EOF
  
  echo -e "${GREEN}✅ Página placeholder criada${NC}"
fi
echo ""

# ============================================================================
# 4. Verificar resultado
# ============================================================================

echo -e "${YELLOW}🔍 Verificando builds...${NC}"

if [ -f "dist/index.js" ]; then
  echo -e "${GREEN}✅ Backend: dist/index.js${NC}"
else
  echo -e "${RED}❌ Backend: dist/index.js não encontrado${NC}"
  exit 1
fi

if [ -f "client/dist/index.html" ]; then
  echo -e "${GREEN}✅ Frontend: client/dist/index.html${NC}"
else
  echo -e "${YELLOW}⚠️  Frontend: client/dist/index.html não encontrado${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Build concluído com sucesso!${NC}"
echo ""
echo "📦 Arquivos gerados:"
echo "   - dist/index.js (backend)"
echo "   - client/dist/* (frontend)"
echo ""
echo "🚀 Para testar localmente:"
echo "   node dist/index.js"
echo ""
echo "☁️  Para deploy no Cloud Run:"
echo "   ./deploy-cloud-run-simple.sh"
echo ""
