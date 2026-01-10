#!/bin/bash

echo "============================================"
echo "🚀 INICIANDO AVD UISA SISTEMA v2.0.0"
echo "============================================"
echo ""

cd /home/user/webapp

# Configurar ambiente
export NODE_ENV=production
export PORT=3000
export FORCE_COLOR=0

echo "📋 Configuração:"
echo "   NODE_ENV: $NODE_ENV"
echo "   PORT: $PORT"
echo "   Working Dir: $(pwd)"
echo ""

echo "🔧 Verificando arquivos..."
if [ ! -f server/_core/index.ts ]; then
  echo "❌ server/_core/index.ts não encontrado!"
  exit 1
fi

if [ ! -f client/dist/index.html ]; then
  echo "❌ client/dist/index.html não encontrado!"
  exit 1
fi

echo "✅ Todos os arquivos necessários estão presentes"
echo ""

echo "🚀 Iniciando servidor..."
echo ""

# Iniciar servidor com tsx
exec pnpm tsx server/_core/index.ts
