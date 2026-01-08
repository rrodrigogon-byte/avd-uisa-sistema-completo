#!/bin/bash
# ============================================================================
# Deploy Rápido AVD UISA - Cloud Shell
# ============================================================================

set -e

echo "🚀 Deploy AVD UISA v2.0.0 para Cloud Run"
echo "=========================================="
echo ""

cd ~/avd-uisa-sistema-completo

# Pull das últimas mudanças
echo "📥 Atualizando código..."
git stash 2>/dev/null || true
git pull origin main

# Deploy
echo ""
echo "🚀 Iniciando deploy no Cloud Run..."
echo ""

gcloud run deploy avd-uisa \
  --source . \
  --region southamerica-east1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --port 3000 \
  --set-env-vars "NODE_ENV=production,DATABASE_URL=mysql://root:uisa2026@34.39.223.147:3306/avd_uisa,MULTI_TENANT_ENABLED=true"

echo ""
echo "✅ Deploy concluído!"
echo ""
echo "🌐 URL: https://avd-uisa-sistema-281844763676.southamerica-east1.run.app"
echo ""
echo "🧪 Teste agora:"
echo "   curl https://avd-uisa-sistema-281844763676.southamerica-east1.run.app/health"
echo ""
