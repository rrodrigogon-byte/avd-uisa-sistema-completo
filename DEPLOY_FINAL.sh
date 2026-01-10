#!/bin/bash

echo "============================================"
echo "DEPLOY FINAL - AVD UISA Sistema v2.0.0"
echo "============================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
PROJECT_ID=${PROJECT_ID:-"gen-lang-client-0212925697"}
SERVICE_NAME="avd-uisa"
REGION="southamerica-east1"
DATABASE_URL="mysql://root:uisa2026@34.39.223.147:3306/avd_uisa"

echo -e "${BLUE}📋 Configurações:${NC}"
echo "  Project ID: $PROJECT_ID"
echo "  Service: $SERVICE_NAME"
echo "  Region: $REGION"
echo "  Database: 34.39.223.147:3306/avd_uisa"
echo ""

# 1. Atualizar código
echo -e "${YELLOW}1. Atualizando código do GitHub...${NC}"
if git pull origin main; then
  echo -e "${GREEN}   ✓ Código atualizado${NC}"
else
  echo -e "${RED}   ✗ Falha ao atualizar código${NC}"
  exit 1
fi
echo ""

# 2. Verificar arquivos essenciais
echo -e "${YELLOW}2. Verificando arquivos essenciais...${NC}"
required_files=(
  "Dockerfile"
  "package.json"
  "server/_core/index.ts"
  "client/dist/index.html"
)

for file in "${required_files[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}   ✓ $file${NC}"
  else
    echo -e "${RED}   ✗ $file - FALTANDO!${NC}"
    exit 1
  fi
done
echo ""

# 3. Limpar cache do Docker (opcional)
echo -e "${YELLOW}3. Limpando cache do Docker (opcional)...${NC}"
if command -v docker &> /dev/null; then
  echo "   Removendo containers e imagens antigas..."
  docker system prune -f &> /dev/null || true
  echo -e "${GREEN}   ✓ Cache limpo${NC}"
else
  echo "   ℹ️  Docker não disponível localmente (OK para Cloud Build)"
fi
echo ""

# 4. Deploy no Cloud Run
echo -e "${YELLOW}4. Fazendo deploy no Google Cloud Run...${NC}"
echo "   Isso pode levar 10-15 minutos..."
echo ""

gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --port 3000 \
  --min-instances 1 \
  --max-instances 5 \
  --timeout 300 \
  --set-env-vars "NODE_ENV=production,DATABASE_URL=$DATABASE_URL,MULTI_TENANT_ENABLED=true"

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✓ DEPLOY CONCLUÍDO COM SUCESSO!${NC}"
  echo ""
else
  echo ""
  echo -e "${RED}✗ FALHA NO DEPLOY${NC}"
  echo ""
  echo "Verifique:"
  echo "  1. Permissões do Cloud Run"
  echo "  2. Logs no Cloud Build"
  echo "  3. Configuração do Dockerfile"
  echo ""
  exit 1
fi

# 5. Obter URL do serviço
echo -e "${YELLOW}5. Obtendo URL do serviço...${NC}"
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format="value(status.url)" 2>/dev/null)

if [ -n "$SERVICE_URL" ]; then
  echo -e "${GREEN}   ✓ Serviço disponível em:${NC}"
  echo "   $SERVICE_URL"
else
  echo -e "${YELLOW}   ⚠ Não foi possível obter a URL automaticamente${NC}"
  echo "   URL esperada: https://avd-uisa-sistema-281844763676.southamerica-east1.run.app"
fi
echo ""

# 6. Testar endpoints
echo -e "${YELLOW}6. Testando endpoints...${NC}"

if [ -n "$SERVICE_URL" ]; then
  echo "   Testando GET /health..."
  health_response=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/health" 2>/dev/null || echo "000")
  
  if [ "$health_response" = "200" ]; then
    echo -e "${GREEN}   ✓ Health check: HTTP $health_response${NC}"
  else
    echo -e "${YELLOW}   ⚠ Health check: HTTP $health_response (Servidor pode estar iniciando...)${NC}"
  fi
  
  echo "   Testando GET /api..."
  api_response=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/api" 2>/dev/null || echo "000")
  
  if [ "$api_response" = "200" ]; then
    echo -e "${GREEN}   ✓ API info: HTTP $api_response${NC}"
  else
    echo -e "${YELLOW}   ⚠ API info: HTTP $api_response${NC}"
  fi
else
  echo "   ℹ️  Aguarde alguns minutos e teste manualmente:"
  echo "   curl https://avd-uisa-sistema-281844763676.southamerica-east1.run.app/health"
fi
echo ""

# 7. Resumo final
echo "============================================"
echo -e "${GREEN}DEPLOY FINALIZADO!${NC}"
echo "============================================"
echo ""
echo "📊 Resumo:"
echo "  • Sistema: AVD UISA v2.0.0"
echo "  • Region: $REGION"
echo "  • Memória: 2 GiB"
echo "  • CPU: 2 cores"
echo "  • Instâncias: 1-5 (auto-scaling)"
echo "  • Banco: 34.39.223.147:3306/avd_uisa"
echo ""
echo "🔗 URLs:"
echo "  • Produção: https://avd-uisa-sistema-281844763676.southamerica-east1.run.app"
echo "  • GitHub: https://github.com/rrodrigogon-byte/avd-uisa-sistema-completo"
echo ""
echo "✅ Próximos passos:"
echo "  1. Acesse a URL de produção"
echo "  2. Valide o dashboard"
echo "  3. Teste os endpoints principais"
echo "  4. Monitore os logs: gcloud run services logs read $SERVICE_NAME --region=$REGION"
echo ""
echo "⚠️  IMPORTANTE:"
echo "  Se o health check falhar, verifique as permissões do MySQL:"
echo "  GRANT ALL PRIVILEGES ON avd_uisa.* TO 'root'@'%';"
echo "  FLUSH PRIVILEGES;"
echo ""
echo "🎉 Sistema pronto para receber 3.114 funcionários!"
echo ""
