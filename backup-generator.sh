#!/bin/bash

# Script de Backup Completo do Sistema AVD UISA
# Gera arquivo TXT com todo o código-fonte e estrutura

BACKUP_FILE="backup-completo-$(date +%Y%m%d-%H%M%S).txt"

echo "==================================================================" > "$BACKUP_FILE"
echo "BACKUP COMPLETO - SISTEMA AVD UISA" >> "$BACKUP_FILE"
echo "Data: $(date '+%d/%m/%Y %H:%M:%S')" >> "$BACKUP_FILE"
echo "==================================================================" >> "$BACKUP_FILE"
echo "" >> "$BACKUP_FILE"

echo "## ESTRUTURA DO PROJETO" >> "$BACKUP_FILE"
echo "" >> "$BACKUP_FILE"
tree -L 3 -I 'node_modules|.git|dist|build' >> "$BACKUP_FILE" 2>/dev/null || find . -type d -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' | head -100 >> "$BACKUP_FILE"
echo "" >> "$BACKUP_FILE"

echo "==================================================================" >> "$BACKUP_FILE"
echo "## SCHEMA DO BANCO DE DADOS" >> "$BACKUP_FILE"
echo "==================================================================" >> "$BACKUP_FILE"
echo "" >> "$BACKUP_FILE"
cat drizzle/schema.ts >> "$BACKUP_FILE"
echo "" >> "$BACKUP_FILE"

echo "==================================================================" >> "$BACKUP_FILE"
echo "## BACKEND - ROUTERS" >> "$BACKUP_FILE"
echo "==================================================================" >> "$BACKUP_FILE"
echo "" >> "$BACKUP_FILE"
cat server/routers.ts >> "$BACKUP_FILE"
echo "" >> "$BACKUP_FILE"

echo "==================================================================" >> "$BACKUP_FILE"
echo "## BACKEND - DATABASE" >> "$BACKUP_FILE"
echo "==================================================================" >> "$BACKUP_FILE"
echo "" >> "$BACKUP_FILE"
cat server/db.ts >> "$BACKUP_FILE"
echo "" >> "$BACKUP_FILE"

echo "==================================================================" >> "$BACKUP_FILE"
echo "## FRONTEND - APP" >> "$BACKUP_FILE"
echo "==================================================================" >> "$BACKUP_FILE"
echo "" >> "$BACKUP_FILE"
cat client/src/App.tsx >> "$BACKUP_FILE"
echo "" >> "$BACKUP_FILE"

echo "==================================================================" >> "$BACKUP_FILE"
echo "## PACKAGE.JSON" >> "$BACKUP_FILE"
echo "==================================================================" >> "$BACKUP_FILE"
echo "" >> "$BACKUP_FILE"
cat package.json >> "$BACKUP_FILE"
echo "" >> "$BACKUP_FILE"

echo "==================================================================" >> "$BACKUP_FILE"
echo "## TODO.MD - FUNCIONALIDADES" >> "$BACKUP_FILE"
echo "==================================================================" >> "$BACKUP_FILE"
echo "" >> "$BACKUP_FILE"
cat todo.md >> "$BACKUP_FILE"
echo "" >> "$BACKUP_FILE"

echo "==================================================================" >> "$BACKUP_FILE"
echo "## PÁGINAS PRINCIPAIS" >> "$BACKUP_FILE"
echo "==================================================================" >> "$BACKUP_FILE"
echo "" >> "$BACKUP_FILE"

for file in client/src/pages/*.tsx; do
  if [ -f "$file" ]; then
    echo "------- $(basename $file) -------" >> "$BACKUP_FILE"
    head -50 "$file" >> "$BACKUP_FILE"
    echo "" >> "$BACKUP_FILE"
  fi
done

echo "==================================================================" >> "$BACKUP_FILE"
echo "FIM DO BACKUP" >> "$BACKUP_FILE"
echo "==================================================================" >> "$BACKUP_FILE"

echo "Backup gerado: $BACKUP_FILE"
