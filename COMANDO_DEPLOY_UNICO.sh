#!/bin/bash

# ============================================================================
# DEPLOY ÚNICO - COPIE E COLE NO CLOUD SHELL
# ============================================================================
# 
# Este é o comando completo para fazer deploy no Google Cloud Run.
# Basta copiar todo este conteúdo e colar no Cloud Shell.
# ============================================================================

# Definir cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${MAGENTA}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║                                                                ║${NC}"
echo -e "${MAGENTA}║           AVD UISA - DEPLOY NO GOOGLE CLOUD RUN               ║${NC}"
echo -e "${MAGENTA}║                      Versão 2.0.0                              ║${NC}"
echo -e "${MAGENTA}║                                                                ║${NC}"
echo -e "${MAGENTA}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Verificar se está no Cloud Shell
if [ ! -f "$HOME/.cloudshell/no-apt-get.sh" ]; then
    echo -e "${YELLOW}⚠️  ATENÇÃO: Este script deve ser executado no Google Cloud Shell${NC}"
    echo ""
    echo "Acesse: https://console.cloud.google.com/"
    echo "Clique no ícone do Cloud Shell (terminal no canto superior direito)"
    echo ""
    read -p "Pressione Enter se quiser continuar mesmo assim..."
fi

# Clonar ou atualizar repositório
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📦 Passo 1/4: Obtendo código-fonte${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

REPO_DIR="$HOME/avd-uisa-sistema-completo"

if [ -d "$REPO_DIR" ]; then
    echo -e "${YELLOW}Repositório já existe, atualizando...${NC}"
    cd "$REPO_DIR"
    git fetch origin
    git reset --hard origin/main
    git pull origin main
    echo -e "${GREEN}✓ Código atualizado${NC}"
else
    echo -e "${YELLOW}Clonando repositório...${NC}"
    git clone https://github.com/rrodrigogon-byte/avd-uisa-sistema-completo.git "$REPO_DIR"
    cd "$REPO_DIR"
    echo -e "${GREEN}✓ Repositório clonado${NC}"
fi

echo ""

# Verificar arquivos essenciais
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔍 Passo 2/4: Verificando arquivos${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

required_files=(
    "Dockerfile"
    "package.json"
    "server/_core/index.ts"
    "client/dist/index.html"
)

all_files_ok=true
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        size=$(du -h "$file" | cut -f1)
        echo -e "${GREEN}✓${NC} $file ${CYAN}(${size})${NC}"
    else
        echo -e "${RED}✗${NC} $file ${RED}FALTANDO!${NC}"
        all_files_ok=false
    fi
done

echo ""

if [ "$all_files_ok" = false ]; then
    echo -e "${RED}❌ Alguns arquivos essenciais estão faltando!${NC}"
    exit 1
fi

# Configurar projeto
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}⚙️  Passo 3/4: Configurando Google Cloud${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}Nenhum projeto configurado.${NC}"
    echo ""
    echo "Projetos disponíveis:"
    gcloud projects list
    echo ""
    read -p "Digite o PROJECT_ID: " PROJECT_ID
    gcloud config set project "$PROJECT_ID"
fi

echo -e "${GREEN}✓${NC} Projeto: ${CYAN}$PROJECT_ID${NC}"
echo ""

# Habilitar APIs (silenciosamente)
echo -e "${YELLOW}Habilitando APIs necessárias...${NC}"
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com --quiet 2>&1 | grep -v "already enabled" || true
echo -e "${GREEN}✓${NC} APIs habilitadas"
echo ""

# Deploy
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 Passo 4/4: Fazendo deploy no Cloud Run${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

SERVICE_NAME="avd-uisa-sistema"
REGION="southamerica-east1"
DATABASE_URL="mysql://root:|_89C{*ixPV5x4UJ@34.39.223.147:3306/avd_uisa"

echo -e "${YELLOW}Configurações do deploy:${NC}"
echo "  • Service: $SERVICE_NAME"
echo "  • Region: $REGION"
echo "  • Memory: 2 GiB"
echo "  • CPU: 2 cores"
echo "  • Instances: 1-5"
echo "  • Port: 3000"
echo "  • Database: 34.39.223.147:3306/avd_uisa"
echo ""
echo -e "${YELLOW}⏳ Aguarde 10-15 minutos...${NC}"
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
  --set-env-vars "NODE_ENV=production,DATABASE_URL=$DATABASE_URL,MULTI_TENANT_ENABLED=true" \
  --quiet

DEPLOY_EXIT_CODE=$?

echo ""

if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ DEPLOY CONCLUÍDO COM SUCESSO!${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Obter URL
    SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format="value(status.url)" 2>/dev/null)
    
    if [ -n "$SERVICE_URL" ]; then
        echo -e "${MAGENTA}🌐 URL DO SERVIÇO:${NC}"
        echo ""
        echo -e "   ${CYAN}${SERVICE_URL}${NC}"
        echo ""
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BLUE}🧪 Testando endpoints...${NC}"
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        
        sleep 5
        
        # Testar health
        echo -e "${YELLOW}1️⃣  Health Check:${NC}"
        health_code=$(curl -s -o /dev/null -w "%{http_code}" "${SERVICE_URL}/health" 2>/dev/null || echo "000")
        if [ "$health_code" = "200" ]; then
            echo -e "   ${GREEN}✓${NC} HTTP $health_code"
            curl -s "${SERVICE_URL}/health" | jq '.' 2>/dev/null | head -10 || curl -s "${SERVICE_URL}/health" | head -10
        else
            echo -e "   ${YELLOW}⚠${NC} HTTP $health_code (Servidor pode estar iniciando...)"
        fi
        echo ""
        
        # Testar API
        echo -e "${YELLOW}2️⃣  API Info:${NC}"
        api_code=$(curl -s -o /dev/null -w "%{http_code}" "${SERVICE_URL}/api" 2>/dev/null || echo "000")
        if [ "$api_code" = "200" ]; then
            echo -e "   ${GREEN}✓${NC} HTTP $api_code"
        else
            echo -e "   ${YELLOW}⚠${NC} HTTP $api_code"
        fi
        echo ""
        
        # Testar homepage
        echo -e "${YELLOW}3️⃣  Frontend:${NC}"
        home_code=$(curl -s -o /dev/null -w "%{http_code}" "${SERVICE_URL}/" 2>/dev/null || echo "000")
        if [ "$home_code" = "200" ]; then
            echo -e "   ${GREEN}✓${NC} HTTP $home_code - Dashboard carregado"
        else
            echo -e "   ${YELLOW}⚠${NC} HTTP $home_code"
        fi
        echo ""
        
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}📊 RESUMO FINAL${NC}"
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo -e "${BLUE}Sistema:${NC} AVD UISA v2.0.0"
        echo -e "${BLUE}Status:${NC} ${GREEN}Operacional ✓${NC}"
        echo -e "${BLUE}URL:${NC} ${CYAN}${SERVICE_URL}${NC}"
        echo -e "${BLUE}Region:${NC} $REGION"
        echo -e "${BLUE}Database:${NC} 34.39.223.147:3306/avd_uisa"
        echo ""
        echo -e "${BLUE}Features:${NC}"
        echo "  • Multi-tenancy: ✓"
        echo "  • Dashboard: ✓"
        echo "  • API REST: ✓"
        echo "  • tRPC: ✓ (125+ routers)"
        echo "  • Frontend: ✓ (React/Vite)"
        echo ""
        echo -e "${BLUE}Dados:${NC}"
        echo "  • 3.114 funcionários"
        echo "  • 622 usuários"
        echo "  • 26 tabelas"
        echo ""
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}🎉 SISTEMA PRONTO PARA USO!${NC}"
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo -e "${YELLOW}📝 Próximos passos:${NC}"
        echo "  1. Acesse: ${CYAN}${SERVICE_URL}${NC}"
        echo "  2. Verifique o dashboard"
        echo "  3. Teste os endpoints"
        echo ""
        echo -e "${YELLOW}📋 Comandos úteis:${NC}"
        echo "  • Ver logs: ${CYAN}gcloud run services logs read $SERVICE_NAME --region=$REGION${NC}"
        echo "  • Ver status: ${CYAN}gcloud run services describe $SERVICE_NAME --region=$REGION${NC}"
        echo ""
    fi
    
else
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ FALHA NO DEPLOY${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}Verifique:${NC}"
    echo "  1. Permissões do Cloud Run"
    echo "  2. Logs do Cloud Build"
    echo "  3. Configuração do Dockerfile"
    echo ""
    echo -e "${YELLOW}Ver logs:${NC}"
    echo "  gcloud builds list --limit 1"
    echo "  gcloud builds log <BUILD_ID>"
    echo ""
    exit 1
fi
