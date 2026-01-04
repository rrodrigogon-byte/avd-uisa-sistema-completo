#!/bin/bash

# Script para corrigir procedures tRPC que usam .input(z.object({}))
# Substitui por .input(z.object({}).optional())

echo "Corrigindo procedures tRPC..."

# Encontrar todos os arquivos TypeScript no diretório server/
find server/ -name "*.ts" -type f | while read file; do
  # Fazer backup do arquivo original
  cp "$file" "$file.bak"
  
  # Substituir .input(z.object({})) por .input(z.object({}).optional())
  # Mas apenas se não for seguido por .optional() já
  sed -i 's/\.input(z\.object({}))/.input(z.object({}).optional())/g' "$file"
  
  echo "Processado: $file"
done

echo "Correção concluída!"
echo "Total de arquivos processados:"
find server/ -name "*.ts.bak" -type f | wc -l
