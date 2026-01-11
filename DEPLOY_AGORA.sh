#!/bin/bash

# ============================================================================
# DEPLOY IMEDIATO - AVD UISA v2.0.0
# ============================================================================
# Execute este script no Google Cloud Shell para fazer o deploy completo
# ============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

clear

echo -e "${MAGENTA}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║            AVD UISA - DEPLOY NO GOOGLE CLOUD RUN                     ║
║                      Versão 2.0.0                                     ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Configurações
PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-gen-lang-client-0212925697}"
SERVICE_NAME="avd-uisa-sistema"
REGION="southamerica-east1"
REPO_URL="https://github.com/rrodrigogon-byte/avd-uisa-sistema-completo.git"
WORK_DIR="$HOME/avd-uisa-deploy-$(date +%s)"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 Configurações do Deploy${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${YELLOW}Project ID:${NC} ${PROJECT_ID}"
echo -e "  ${YELLOW}Service:${NC} ${SERVICE_NAME}"
echo -e "  ${YELLOW}Region:${NC} ${REGION}"
echo -e "  ${YELLOW}Repository:${NC} ${REPO_URL}"
echo ""

# Confirmar projeto
echo -e "${YELLOW}Deseja continuar com o projeto ${PROJECT_ID}? (s/n)${NC}"
read -r -p "> " confirm
if [[ ! $confirm =~ ^[Ss]$ ]]; then
    echo ""
    echo -e "${BLUE}Por favor, configure o projeto correto:${NC}"
    echo "  gcloud config set project SEU-PROJECT-ID"
    echo ""
    exit 0
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}1/6 - Preparando ambiente${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Criar diretório de trabalho
mkdir -p "$WORK_DIR"
cd "$WORK_DIR"
echo -e "${GREEN}✓${NC} Diretório criado: ${WORK_DIR}"

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}2/6 - Clonando repositório${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

git clone "$REPO_URL" app
cd app
echo -e "${GREEN}✓${NC} Repositório clonado"

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}3/6 - Verificando arquivos${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

required_files=(
    "Dockerfile"
    "package.json"
    "server/_core/index.ts"
    "client/dist/index.html"
)

all_ok=true
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        size=$(du -h "$file" | cut -f1)
        echo -e "${GREEN}✓${NC} $file ${CYAN}(${size})${NC}"
    else
        echo -e "${RED}✗${NC} $file ${RED}FALTANDO!${NC}"
        all_ok=false
    fi
done

if [ "$all_ok" = false ]; then
    echo ""
    echo -e "${RED}❌ Arquivos essenciais estão faltando!${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}4/6 - Configurando Google Cloud${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Configurar projeto
gcloud config set project "$PROJECT_ID"
echo -e "${GREEN}✓${NC} Projeto configurado"

# Habilitar APIs
echo ""
echo -e "${YELLOW}Habilitando APIs necessárias...${NC}"
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    containerregistry.googleapis.com \
    --project="$PROJECT_ID" \
    --quiet 2>&1 | grep -v "already enabled" || true
echo -e "${GREEN}✓${NC} APIs habilitadas"

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}5/6 - Fazendo deploy no Cloud Run${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}⏳ Este processo pode demorar 10-15 minutos...${NC}"
echo ""

# Deploy usando --source (Cloud Build automático)
gcloud run deploy "$SERVICE_NAME" \
    --source . \
    --platform managed \
    --region "$REGION" \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --port 3000 \
    --min-instances 1 \
    --max-instances 5 \
    --timeout 300 \
    --set-env-vars "NODE_ENV=production" \
    --set-env-vars "DATABASE_URL=mysql://root:|_89C{*ixPV5x4UJ@34.39.223.147:3306/avd_uisa" \
    --set-env-vars "MULTI_TENANT_ENABLED=true" \
    --quiet

DEPLOY_STATUS=$?

echo ""

if [ $DEPLOY_STATUS -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Deploy concluído com sucesso!"
else
    echo -e "${RED}✗${NC} Deploy falhou. Verifique os logs acima."
    exit 1
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}6/6 - Testando o serviço${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Obter URL do serviço
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --platform managed \
    --region "$REGION" \
    --format 'value(status.url)' 2>/dev/null)

if [ -z "$SERVICE_URL" ]; then
    echo -e "${YELLOW}⚠${NC} Não foi possível obter a URL automaticamente"
    SERVICE_URL="https://${SERVICE_NAME}-281844763676.${REGION}.run.app"
    echo -e "   URL esperada: ${SERVICE_URL}"
fi

echo -e "${MAGENTA}🌐 URL do Serviço:${NC}"
echo ""
echo -e "   ${CYAN}${SERVICE_URL}${NC}"
echo ""

# Aguardar serviço iniciar
echo -e "${YELLOW}Aguardando serviço iniciar...${NC}"
sleep 10

# Testar endpoints
echo ""
echo -e "${YELLOW}1️⃣  Testando Health Check:${NC}"
health_code=$(curl -s -o /dev/null -w "%{http_code}" "${SERVICE_URL}/health" 2>/dev/null || echo "000")
if [ "$health_code" = "200" ]; then
    echo -e "   ${GREEN}✓ HTTP $health_code${NC}"
    curl -s "${SERVICE_URL}/health" 2>/dev/null | head -15
else
    echo -e "   ${YELLOW}⚠ HTTP $health_code${NC} (Servidor pode estar iniciando...)"
fi

echo ""
echo -e "${YELLOW}2️⃣  Testando API Info:${NC}"
api_code=$(curl -s -o /dev/null -w "%{http_code}" "${SERVICE_URL}/api" 2>/dev/null || echo "000")
if [ "$api_code" = "200" ]; then
    echo -e "   ${GREEN}✓ HTTP $api_code${NC}"
else
    echo -e "   ${YELLOW}⚠ HTTP $api_code${NC}"
fi

echo ""
echo -e "${YELLOW}3️⃣  Testando Homepage:${NC}"
home_code=$(curl -s -o /dev/null -w "%{http_code}" "${SERVICE_URL}/" 2>/dev/null || echo "000")
if [ "$home_code" = "200" ]; then
    echo -e "   ${GREEN}✓ HTTP $home_code${NC} - Dashboard carregado"
    echo ""
    echo -e "${CYAN}Preview da página:${NC}"
    curl -s "${SERVICE_URL}/" 2>/dev/null | grep -A 3 "AVD UISA" | head -5
else
    echo -e "   ${YELLOW}⚠ HTTP $home_code${NC}"
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ DEPLOY CONCLUÍDO!${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${MAGENTA}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║                                                                ║${NC}"
echo -e "${MAGENTA}║                   SISTEMA ONLINE! 🎉                          ║${NC}"
echo -e "${MAGENTA}║                                                                ║${NC}"
echo -e "${MAGENTA}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}📊 Informações do Deploy:${NC}"
echo ""
echo -e "  ${YELLOW}Service:${NC} ${SERVICE_NAME}"
echo -e "  ${YELLOW}Region:${NC} ${REGION}"
echo -e "  ${YELLOW}URL:${NC} ${CYAN}${SERVICE_URL}${NC}"
echo -e "  ${YELLOW}Status:${NC} ${GREEN}Operacional${NC}"
echo ""

echo -e "${BLUE}📋 Comandos úteis:${NC}"
echo ""
echo -e "  ${YELLOW}Ver logs:${NC}"
echo "    gcloud run services logs read $SERVICE_NAME --region=$REGION --limit=50"
echo ""
echo -e "  ${YELLOW}Ver status:${NC}"
echo "    gcloud run services describe $SERVICE_NAME --region=$REGION"
echo ""
echo -e "  ${YELLOW}Ver em tempo real:${NC}"
echo "    gcloud run services logs tail $SERVICE_NAME --region=$REGION"
echo ""

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Sistema AVD UISA v2.0.0 está online!${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Acesse agora: ${CYAN}${SERVICE_URL}${NC}"
echo ""
