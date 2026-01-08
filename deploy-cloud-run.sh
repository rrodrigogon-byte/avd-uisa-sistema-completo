#!/bin/bash

# ============================================================================
# Script de Deploy Automatizado para Google Cloud Run - AVD UISA
# ============================================================================
# 
# Este script automatiza o deploy completo no Google Cloud Platform:
# - Build da imagem Docker
# - Push para Container Registry
# - Deploy no Cloud Run
# - Configuração de variáveis de ambiente
# - Testes de health check
#
# Uso: bash deploy-cloud-run.sh [production|staging|development]
# ============================================================================

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funções auxiliares
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Banner
echo -e "${BLUE}"
cat << "EOF"
  ╔═══════════════════════════════════════════════╗
  ║   Deploy AVD UISA para Google Cloud Run      ║
  ╚═══════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

# ============================================================================
# CONFIGURAÇÕES
# ============================================================================

# Ambiente (production, staging ou development)
ENVIRONMENT=${1:-production}

# Validar ambiente
if [[ ! "$ENVIRONMENT" =~ ^(production|staging|development)$ ]]; then
    print_error "Ambiente inválido: $ENVIRONMENT"
    echo "Uso: bash deploy-cloud-run.sh [production|staging|development]"
    exit 1
fi

print_info "Ambiente selecionado: $ENVIRONMENT"

# Configurações do projeto
PROJECT_ID=${GCP_PROJECT_ID:-"seu-project-id"}
REGION=${GCP_REGION:-"southamerica-east1"}
SERVICE_NAME="avd-uisa"

# Adicionar sufixo para ambientes não-produção
if [[ "$ENVIRONMENT" != "production" ]]; then
    SERVICE_NAME="${SERVICE_NAME}-${ENVIRONMENT}"
fi

# Configurações de imagem
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
IMAGE_TAG=$(git rev-parse --short HEAD)

# Configurações do Cloud Run
if [[ "$ENVIRONMENT" == "production" ]]; then
    MIN_INSTANCES=1
    MAX_INSTANCES=10
    MEMORY="2Gi"
    CPU="2"
elif [[ "$ENVIRONMENT" == "staging" ]]; then
    MIN_INSTANCES=0
    MAX_INSTANCES=5
    MEMORY="1Gi"
    CPU="1"
else  # development
    MIN_INSTANCES=0
    MAX_INSTANCES=3
    MEMORY="512Mi"
    CPU="1"
fi

TIMEOUT=300
CONCURRENCY=80
CLOUD_SQL_INSTANCE="${PROJECT_ID}:${REGION}:avd-uisa-db"

print_info "Configurações:"
echo "  Project ID: $PROJECT_ID"
echo "  Região: $REGION"
echo "  Service: $SERVICE_NAME"
echo "  Imagem: $IMAGE_NAME:$IMAGE_TAG"
echo "  Min/Max Instances: $MIN_INSTANCES/$MAX_INSTANCES"
echo "  Memory: $MEMORY"
echo "  CPU: $CPU"
echo ""

# Perguntar confirmação
read -p "Deseja continuar com o deploy? (s/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
    print_info "Deploy cancelado pelo usuário"
    exit 0
fi

# ============================================================================
# ETAPA 1: VALIDAR PRÉ-REQUISITOS
# ============================================================================

print_header "ETAPA 1: VALIDANDO PRÉ-REQUISITOS"

# Verificar gcloud CLI
print_info "Verificando gcloud CLI..."
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI não instalado"
    echo "Instale de: https://cloud.google.com/sdk/docs/install"
    exit 1
fi
print_success "gcloud CLI instalado"

# Verificar Docker
print_info "Verificando Docker..."
if ! command -v docker &> /dev/null; then
    print_error "Docker não instalado"
    echo "Instale de: https://docs.docker.com/get-docker/"
    exit 1
fi
print_success "Docker instalado"

# Verificar autenticação
print_info "Verificando autenticação..."
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [[ -z "$CURRENT_PROJECT" ]]; then
    print_error "Não autenticado no gcloud"
    echo "Execute: gcloud auth login"
    exit 1
fi
print_success "Autenticado (Project: $CURRENT_PROJECT)"

# Configurar projeto correto
if [[ "$CURRENT_PROJECT" != "$PROJECT_ID" ]]; then
    print_warning "Mudando para projeto $PROJECT_ID"
    gcloud config set project $PROJECT_ID
fi

# Verificar Git
print_info "Verificando Git..."
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Não está em um repositório Git"
    exit 1
fi

# Verificar se há mudanças não commitadas
if [[ -n $(git status -s) ]]; then
    print_warning "Há mudanças não commitadas no repositório"
    read -p "Deseja continuar mesmo assim? (s/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
        exit 0
    fi
fi

print_success "Todos os pré-requisitos OK"

# ============================================================================
# ETAPA 2: BUILD DA IMAGEM DOCKER
# ============================================================================

print_header "ETAPA 2: BUILD DA IMAGEM DOCKER"

print_info "Construindo imagem Docker..."
print_info "Tag: $IMAGE_NAME:$IMAGE_TAG"

if docker build \
    --tag "$IMAGE_NAME:$IMAGE_TAG" \
    --tag "$IMAGE_NAME:latest" \
    --build-arg BUILDKIT_INLINE_CACHE=1 \
    --cache-from "$IMAGE_NAME:latest" \
    . ; then
    print_success "Imagem Docker construída com sucesso"
else
    print_error "Falha ao construir imagem Docker"
    exit 1
fi

# Mostrar tamanho da imagem
IMAGE_SIZE=$(docker images "$IMAGE_NAME:$IMAGE_TAG" --format "{{.Size}}")
print_info "Tamanho da imagem: $IMAGE_SIZE"

# ============================================================================
# ETAPA 3: PUSH DA IMAGEM PARA CONTAINER REGISTRY
# ============================================================================

print_header "ETAPA 3: PUSH PARA CONTAINER REGISTRY"

print_info "Configurando Docker para usar gcloud..."
gcloud auth configure-docker --quiet

print_info "Fazendo push da imagem..."
if docker push "$IMAGE_NAME:$IMAGE_TAG" && docker push "$IMAGE_NAME:latest"; then
    print_success "Imagem enviada para Container Registry"
else
    print_error "Falha ao enviar imagem"
    exit 1
fi

# ============================================================================
# ETAPA 4: DEPLOY NO CLOUD RUN
# ============================================================================

print_header "ETAPA 4: DEPLOY NO CLOUD RUN"

print_info "Deploying $SERVICE_NAME no Cloud Run..."

# Construir comando de deploy
DEPLOY_CMD="gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME:$IMAGE_TAG \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --set-env-vars NODE_ENV=$ENVIRONMENT \
    --add-cloudsql-instances $CLOUD_SQL_INSTANCE \
    --min-instances $MIN_INSTANCES \
    --max-instances $MAX_INSTANCES \
    --memory $MEMORY \
    --cpu $CPU \
    --timeout $TIMEOUT \
    --concurrency $CONCURRENCY \
    --port 3000 \
    --ingress all \
    --labels env=$ENVIRONMENT,app=avd-uisa,version=$IMAGE_TAG \
    --quiet"

# Adicionar VPC connector se existir
if gcloud compute networks vpc-access connectors describe avd-connector \
    --region $REGION &>/dev/null; then
    DEPLOY_CMD="$DEPLOY_CMD --vpc-connector avd-connector --vpc-egress private-ranges-only"
    print_info "VPC Connector configurado"
fi

# Adicionar service account se existir
SA_EMAIL="avd-uisa-sa@${PROJECT_ID}.iam.gserviceaccount.com"
if gcloud iam service-accounts describe $SA_EMAIL &>/dev/null; then
    DEPLOY_CMD="$DEPLOY_CMD --service-account $SA_EMAIL"
    print_info "Service Account configurado"
fi

# Executar deploy
if eval $DEPLOY_CMD; then
    print_success "Deploy concluído com sucesso!"
else
    print_error "Falha no deploy"
    exit 1
fi

# ============================================================================
# ETAPA 5: OBTER URL DO SERVIÇO
# ============================================================================

print_header "ETAPA 5: VERIFICANDO SERVIÇO"

SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --region $REGION \
    --format 'value(status.url)')

print_success "Serviço disponível em:"
echo -e "${GREEN}🌐 $SERVICE_URL${NC}"
echo ""

# ============================================================================
# ETAPA 6: HEALTH CHECK
# ============================================================================

print_header "ETAPA 6: HEALTH CHECK"

print_info "Aguardando serviço ficar disponível..."
sleep 15

print_info "Testando health check..."
if curl -f -s "$SERVICE_URL/health" > /dev/null; then
    print_success "Health check passou!"
    
    # Testar endpoint principal
    print_info "Testando endpoint principal..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL")
    if [[ "$HTTP_CODE" == "200" ]]; then
        print_success "Endpoint principal OK (HTTP $HTTP_CODE)"
    else
        print_warning "Endpoint principal retornou HTTP $HTTP_CODE"
    fi
else
    print_error "Health check falhou"
    echo "Verifique os logs:"
    echo "gcloud logging read \"resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME\" --limit 50 --format json"
fi

# ============================================================================
# ETAPA 7: RESUMO FINAL
# ============================================================================

print_header "✅ DEPLOY CONCLUÍDO!"

echo ""
echo "📊 INFORMAÇÕES DO DEPLOY:"
echo "  Ambiente: $ENVIRONMENT"
echo "  Serviço: $SERVICE_NAME"
echo "  Região: $REGION"
echo "  Imagem: $IMAGE_NAME:$IMAGE_TAG"
echo "  URL: $SERVICE_URL"
echo ""

echo "📋 PRÓXIMOS PASSOS:"
echo "  1. Verificar logs:"
echo "     ${BLUE}gcloud logging read \"resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME\" --limit 50${NC}"
echo ""
echo "  2. Ver métricas:"
echo "     ${BLUE}https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME/metrics${NC}"
echo ""
echo "  3. Acessar aplicação:"
echo "     ${BLUE}$SERVICE_URL${NC}"
echo ""

print_success "Deploy realizado com sucesso! 🎉"
