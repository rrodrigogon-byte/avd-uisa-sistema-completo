#!/bin/bash
# ============================================================================
# Script de Deploy Automatizado - AVD UISA para Cloud Run
# ============================================================================
#
# Este script automatiza o deploy do sistema AVD UISA no Google Cloud Run
#
# Uso: ./deploy-cloud-run-simple.sh
#
# ============================================================================

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de log
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Banner
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║         🚀 Deploy Automatizado - AVD UISA v2.0.0              ║"
echo "║                   Google Cloud Run                            ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# STEP 1: Verificar pré-requisitos
# ============================================================================
log_info "Verificando pré-requisitos..."

# Verificar gcloud
if ! command -v gcloud &> /dev/null; then
    log_error "gcloud CLI não encontrado. Instale: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Verificar docker
if ! command -v docker &> /dev/null; then
    log_error "Docker não encontrado. Instale: https://docs.docker.com/get-docker/"
    exit 1
fi

log_success "Pré-requisitos verificados"

# ============================================================================
# STEP 2: Obter configurações
# ============================================================================
log_info "Configurando projeto..."

# Obter projeto atual
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    log_error "Nenhum projeto configurado. Execute: gcloud config set project SEU-PROJECT-ID"
    exit 1
fi

log_info "Projeto: $PROJECT_ID"

# Configurações
REGION="southamerica-east1"
SERVICE_NAME="avd-uisa"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

log_info "Região: $REGION"
log_info "Serviço: $SERVICE_NAME"
log_info "Imagem: $IMAGE_NAME"

# ============================================================================
# STEP 3: Solicitar DATABASE_URL
# ============================================================================
echo ""
log_info "Configuração do banco de dados"
echo ""
echo "Banco de dados detectado: 34.39.223.147:3306/avd_uisa"
echo ""
read -sp "Digite a senha do banco (root): " DB_PASSWORD
echo ""

if [ -z "$DB_PASSWORD" ]; then
    log_error "Senha não pode estar vazia"
    exit 1
fi

DATABASE_URL="mysql://root:${DB_PASSWORD}@34.39.223.147:3306/avd_uisa"

# ============================================================================
# STEP 4: Habilitar APIs necessárias
# ============================================================================
log_info "Habilitando APIs necessárias..."

gcloud services enable cloudbuild.googleapis.com --quiet
gcloud services enable run.googleapis.com --quiet
gcloud services enable containerregistry.googleapis.com --quiet

log_success "APIs habilitadas"

# ============================================================================
# STEP 5: Build da imagem Docker
# ============================================================================
log_info "Iniciando build da imagem Docker..."
echo ""

docker build -t $IMAGE_NAME:latest . || {
    log_error "Falha no build da imagem"
    exit 1
}

log_success "Build concluído"

# ============================================================================
# STEP 6: Push da imagem para Container Registry
# ============================================================================
log_info "Enviando imagem para Container Registry..."

# Configurar docker para usar gcloud
gcloud auth configure-docker --quiet

docker push $IMAGE_NAME:latest || {
    log_error "Falha no push da imagem"
    exit 1
}

log_success "Imagem enviada: $IMAGE_NAME:latest"

# ============================================================================
# STEP 7: Deploy no Cloud Run
# ============================================================================
log_info "Iniciando deploy no Cloud Run..."
echo ""

gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME:latest \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,DATABASE_URL=$DATABASE_URL" \
  --min-instances=1 \
  --max-instances=5 \
  --memory=2Gi \
  --cpu=2 \
  --port=3000 \
  --timeout=300 \
  --concurrency=80 \
  --quiet || {
    log_error "Falha no deploy"
    exit 1
}

log_success "Deploy concluído"

# ============================================================================
# STEP 8: Obter URL do serviço
# ============================================================================
log_info "Obtendo URL do serviço..."

SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --format 'value(status.url)')

log_success "Serviço disponível em: $SERVICE_URL"

# ============================================================================
# STEP 9: Testar health check
# ============================================================================
log_info "Testando health check..."
sleep 5

if curl -f -s "$SERVICE_URL/health" > /dev/null 2>&1; then
    log_success "Health check OK"
else
    log_warning "Health check falhou - verificar logs"
fi

# ============================================================================
# STEP 10: Resumo final
# ============================================================================
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║                  ✅ DEPLOY CONCLUÍDO COM SUCESSO!             ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
log_info "📊 Informações do Deploy:"
echo ""
echo "   🏢 Projeto:       $PROJECT_ID"
echo "   🌎 Região:        $REGION"
echo "   🚀 Serviço:       $SERVICE_NAME"
echo "   🌐 URL:           $SERVICE_URL"
echo "   🗄️  Banco:         34.39.223.147:3306/avd_uisa"
echo ""
log_info "📝 Comandos úteis:"
echo ""
echo "   # Ver logs:"
echo "   gcloud run services logs tail $SERVICE_NAME --region $REGION"
echo ""
echo "   # Ver status:"
echo "   gcloud run services describe $SERVICE_NAME --region $REGION"
echo ""
echo "   # Atualizar serviço:"
echo "   gcloud run services update $SERVICE_NAME --region $REGION --memory=4Gi"
echo ""
echo "   # Deletar serviço:"
echo "   gcloud run services delete $SERVICE_NAME --region $REGION"
echo ""
log_success "Sistema pronto para uso em: $SERVICE_URL"
echo ""
