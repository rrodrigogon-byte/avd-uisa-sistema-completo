#!/bin/bash

# ============================================================================
# Script de Deploy Forçado - AVD UISA v2.0.0
# ============================================================================
# 
# Este script força um rebuild completo e deploy no Cloud Run
# Garante que a nova versão com o frontend visual seja deployada
#
# ============================================================================

set -e

echo "🚀 Deploy Forçado do AVD UISA v2.0.0"
echo "======================================"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ============================================================================
# 1. Verificar se está no diretório correto
# ============================================================================

if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Erro: Execute este script na raiz do projeto${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Diretório correto${NC}"
echo ""

# ============================================================================
# 2. Verificar se o frontend existe
# ============================================================================

if [ ! -f "client/dist/index.html" ]; then
  echo -e "${RED}❌ Erro: client/dist/index.html não encontrado${NC}"
  echo "Execute: git pull origin main"
  exit 1
fi

echo -e "${GREEN}✅ Frontend encontrado em client/dist/index.html${NC}"
echo ""

# ============================================================================
# 3. Configurar PROJECT_ID
# ============================================================================

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
  echo -e "${YELLOW}⚠️  PROJECT_ID não configurado${NC}"
  echo ""
  echo "Configure com:"
  echo "  gcloud config set project SEU_PROJECT_ID"
  echo ""
  echo "Ou informe o PROJECT_ID agora:"
  read -p "PROJECT_ID: " PROJECT_ID
  
  if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ PROJECT_ID é obrigatório${NC}"
    exit 1
  fi
fi

echo -e "${GREEN}✅ PROJECT_ID: ${PROJECT_ID}${NC}"
echo ""

# ============================================================================
# 4. Configurar variáveis
# ============================================================================

REGION="southamerica-east1"
SERVICE_NAME="avd-uisa"
IMAGE_TAG="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:$(date +%Y%m%d-%H%M%S)"
IMAGE_LATEST="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"

echo "📦 Configuração do Deploy:"
echo "   Região: ${REGION}"
echo "   Service: ${SERVICE_NAME}"
echo "   Image Tag: ${IMAGE_TAG}"
echo ""

# ============================================================================
# 5. Solicitar DATABASE_URL
# ============================================================================

echo -e "${YELLOW}🔐 Configure a DATABASE_URL:${NC}"
echo ""
echo "Formato: mysql://user:password@host:port/database"
echo "Exemplo: mysql://root:senha123@34.39.223.147:3306/avd_uisa"
echo ""
read -p "DATABASE_URL: " DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}❌ DATABASE_URL é obrigatória${NC}"
  exit 1
fi

echo ""

# ============================================================================
# 6. Build da imagem Docker
# ============================================================================

echo -e "${YELLOW}🔨 Building Docker image...${NC}"
echo ""

docker build \
  --no-cache \
  --platform linux/amd64 \
  -t "${IMAGE_TAG}" \
  -t "${IMAGE_LATEST}" \
  .

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Erro no build da imagem${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ Build concluído${NC}"
echo ""

# ============================================================================
# 7. Push da imagem para GCR
# ============================================================================

echo -e "${YELLOW}📤 Pushing image to Google Container Registry...${NC}"
echo ""

docker push "${IMAGE_TAG}"
docker push "${IMAGE_LATEST}"

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Erro no push da imagem${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ Push concluído${NC}"
echo ""

# ============================================================================
# 8. Deploy no Cloud Run
# ============================================================================

echo -e "${YELLOW}🚀 Deploying to Cloud Run...${NC}"
echo ""

gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE_TAG}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --concurrency 80 \
  --min-instances 1 \
  --max-instances 5 \
  --port 3000 \
  --set-env-vars "NODE_ENV=production,DATABASE_URL=${DATABASE_URL},MULTI_TENANT_ENABLED=true"

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Erro no deploy${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ Deploy concluído${NC}"
echo ""

# ============================================================================
# 9. Obter URL do serviço
# ============================================================================

SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --region "${REGION}" \
  --format 'value(status.url)')

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║   🎉  DEPLOY CONCLUÍDO COM SUCESSO!                   ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}🌐 URL do Serviço:${NC}"
echo "   ${SERVICE_URL}"
echo ""
echo -e "${GREEN}📊 Próximos Passos:${NC}"
echo "   1. Acesse a URL acima"
echo "   2. Você verá a página visual completa"
echo "   3. Teste os endpoints:"
echo "      - ${SERVICE_URL}/health"
echo "      - ${SERVICE_URL}/api"
echo "      - ${SERVICE_URL}/api/status"
echo ""
echo -e "${YELLOW}⏱️  Aguarde 1-2 minutos para o serviço inicializar${NC}"
echo ""

# ============================================================================
# 10. Teste de Health Check
# ============================================================================

echo -e "${YELLOW}🔍 Testando health check em 30 segundos...${NC}"
sleep 30

HEALTH_STATUS=$(curl -s "${SERVICE_URL}/health" | jq -r '.status' 2>/dev/null || echo "error")

if [ "$HEALTH_STATUS" == "ok" ]; then
  echo -e "${GREEN}✅ Health check passou!${NC}"
  echo ""
  echo "Sistema está rodando corretamente!"
else
  echo -e "${YELLOW}⚠️  Health check ainda não passou${NC}"
  echo ""
  echo "Tente acessar manualmente em alguns minutos:"
  echo "${SERVICE_URL}/health"
fi

echo ""
echo -e "${GREEN}✨ Deploy finalizado!${NC}"
echo ""
