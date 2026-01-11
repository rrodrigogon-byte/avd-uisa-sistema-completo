#!/bin/bash
set -e

echo "=== INICIANDO DEPLOY NO GOOGLE CLOUD RUN ==="
echo ""

# Configurações
PROJECT_ID="avd-uisa-sistema"
SERVICE_NAME="avd-uisa-sistema"
REGION="southamerica-east1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Verificar se gcloud está instalado
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI não encontrado. Instalando..."
    curl https://sdk.cloud.google.com | bash
    exec -l $SHELL
    gcloud init
fi

echo "✅ Verificando autenticação..."
gcloud auth list

echo ""
echo "✅ Configurando projeto..."
gcloud config set project ${PROJECT_ID}

echo ""
echo "✅ Habilitando APIs necessárias..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

echo ""
echo "=== CONSTRUINDO IMAGEM DOCKER ==="
echo "📦 Construindo imagem: ${IMAGE_NAME}"
gcloud builds submit --tag ${IMAGE_NAME} \
  --timeout=20m \
  --machine-type=e2-highcpu-8

echo ""
echo "=== FAZENDO DEPLOY NO CLOUD RUN ==="
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --port 3000 \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 1 \
  --max-instances 5 \
  --timeout 300 \
  --set-env-vars NODE_ENV=production \
  --set-env-vars MULTI_TENANT_ENABLED=true \
  --set-env-vars DATABASE_URL="mysql://root:uisa2026@34.39.223.147:3306/avd_uisa"

echo ""
echo "=== OBTENDO URL DO SERVIÇO ==="
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
  --platform managed \
  --region ${REGION} \
  --format 'value(status.url)')

echo ""
echo "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
echo ""
echo "🌐 URL DO SERVIÇO: ${SERVICE_URL}"
echo ""
echo "=== TESTANDO ENDPOINTS ==="
echo ""
echo "1️⃣ Health Check:"
curl -s "${SERVICE_URL}/health" | jq '.' || curl -s "${SERVICE_URL}/health"
echo ""
echo ""
echo "2️⃣ API Info:"
curl -s "${SERVICE_URL}/api" | jq '.' || curl -s "${SERVICE_URL}/api"
echo ""
echo ""
echo "3️⃣ Homepage:"
curl -s "${SERVICE_URL}/" | head -20
echo ""
echo ""
echo "=== DEPLOY FINALIZADO ==="
echo "📋 URL: ${SERVICE_URL}"
echo "📊 Status: Operacional"
echo "🎯 Versão: 2.0.0"
echo ""

