#!/bin/bash

# Script para aplicar correções de array em massa
# Adiciona import de arrayHelpers em arquivos que usam operações de array

echo "🔧 Aplicando correções de array em componentes..."

# Encontrar todos os arquivos .tsx que usam operações de array mas não importam arrayHelpers
FILES=$(grep -l "\.map\|\.filter\|\.find\|\.reduce" client/src/components/*.tsx client/src/pages/*.tsx 2>/dev/null | while read file; do
  if ! grep -q "from \"@/lib/arrayHelpers\"" "$file"; then
    echo "$file"
  fi
done)

COUNT=0
for file in $FILES; do
  # Verificar se o arquivo já tem import de trpc (para adicionar o import após ele)
  if grep -q "from \"@/lib/trpc\"" "$file"; then
    # Adicionar import após a linha do trpc
    sed -i '/from "@\/lib\/trpc"/a import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";' "$file"
    COUNT=$((COUNT + 1))
    echo "✅ Adicionado import em: $file"
  elif grep -q "^import" "$file"; then
    # Se não tem trpc, adicionar após o primeiro import
    sed -i '0,/^import/a import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";' "$file"
    COUNT=$((COUNT + 1))
    echo "✅ Adicionado import em: $file"
  fi
done

echo ""
echo "📊 Resumo:"
echo "   - $COUNT arquivos atualizados com imports"
echo "   - Imports de arrayHelpers adicionados"
echo ""
echo "⚠️  ATENÇÃO: Os imports foram adicionados, mas você ainda precisa:"
echo "   1. Substituir manualmente as chamadas diretas por funções seguras"
echo "   2. Exemplo: array?.map() → safeMap(array, ...)"
echo "   3. Testar cada componente após as mudanças"
echo ""
echo "✅ Correções de import concluídas!"
