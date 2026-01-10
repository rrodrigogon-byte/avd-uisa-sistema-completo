#!/bin/bash

echo "============================================"
echo "VALIDAÇÃO COMPLETA - AVD UISA SISTEMA v2.0.0"
echo "============================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

errors=0
warnings=0

# 1. Estrutura de Arquivos
echo "1. VALIDANDO ESTRUTURA DE ARQUIVOS..."
echo "----------------------------------------"

required_files=(
  "package.json"
  "Dockerfile"
  "server/_core/index.ts"
  "server/db.ts"
  "server/routers.ts"
  "client/dist/index.html"
  ".env"
  "drizzle.config.ts"
)

for file in "${required_files[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $file"
  else
    echo -e "${RED}✗${NC} $file - FALTANDO"
    ((errors++))
  fi
done

echo ""

# 2. Dependências Node
echo "2. VALIDANDO DEPENDÊNCIAS..."
echo "----------------------------------------"

if [ -d "node_modules" ]; then
  echo -e "${GREEN}✓${NC} node_modules existente"
  modules_count=$(find node_modules -maxdepth 1 -type d | wc -l)
  echo "   Módulos instalados: $modules_count"
else
  echo -e "${RED}✗${NC} node_modules NÃO encontrado"
  ((errors++))
fi

echo ""

# 3. Variáveis de Ambiente
echo "3. VALIDANDO VARIÁVEIS DE AMBIENTE..."
echo "----------------------------------------"

if [ -f ".env" ]; then
  source .env
  
  required_vars=("DATABASE_URL" "NODE_ENV")
  
  for var in "${required_vars[@]}"; do
    if [ -n "${!var}" ]; then
      echo -e "${GREEN}✓${NC} $var configurada"
    else
      echo -e "${RED}✗${NC} $var NÃO configurada"
      ((errors++))
    fi
  done
else
  echo -e "${RED}✗${NC} Arquivo .env não encontrado"
  ((errors++))
fi

echo ""

# 4. Banco de Dados
echo "4. TESTANDO CONEXÃO COM BANCO DE DADOS..."
echo "----------------------------------------"

if [ -n "$DATABASE_URL" ]; then
  # Extrair informações do DATABASE_URL
  DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
  DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
  DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
  DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
  
  echo "   Host: $DB_HOST"
  echo "   Port: $DB_PORT"
  echo "   Database: $DB_NAME"
  echo "   User: $DB_USER"
  
  # Testar conexão
  if command -v mysql &> /dev/null; then
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" -e "SELECT 1" "$DB_NAME" &> /dev/null
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}✓${NC} Conexão com banco OK"
      
      # Contar tabelas
      table_count=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$DB_NAME'" 2>/dev/null)
      echo "   Tabelas no banco: $table_count"
      
      # Contar funcionários
      emp_count=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" -N -e "SELECT COUNT(*) FROM employees" "$DB_NAME" 2>/dev/null)
      echo "   Funcionários: $emp_count"
      
      # Contar usuários
      user_count=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" -N -e "SELECT COUNT(*) FROM users" "$DB_NAME" 2>/dev/null)
      echo "   Usuários: $user_count"
    else
      echo -e "${RED}✗${NC} Falha na conexão com banco"
      echo "   Verifique as credenciais e permissões"
      ((errors++))
    fi
  else
    echo -e "${YELLOW}⚠${NC} Cliente MySQL não disponível para teste"
    ((warnings++))
  fi
fi

echo ""

# 5. TypeScript e Build
echo "5. VALIDANDO TYPESCRIPT..."
echo "----------------------------------------"

if command -v npx &> /dev/null; then
  # Verificar se o TypeScript compila
  npx tsc --noEmit --skipLibCheck &> /tmp/tsc-check.log
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} TypeScript sem erros de compilação"
  else
    error_count=$(grep -c "error TS" /tmp/tsc-check.log || echo 0)
    if [ $error_count -gt 0 ]; then
      echo -e "${RED}✗${NC} $error_count erros de TypeScript encontrados"
      head -20 /tmp/tsc-check.log
      ((errors++))
    else
      echo -e "${GREEN}✓${NC} TypeScript OK"
    fi
  fi
else
  echo -e "${YELLOW}⚠${NC} npx não disponível"
  ((warnings++))
fi

echo ""

# 6. Imports
echo "6. VALIDANDO IMPORTS CRÍTICOS..."
echo "----------------------------------------"

critical_imports=(
  "server/_core/index.ts:server/db"
  "server/_core/index.ts:server/routers"
  "server/_core/index.ts:server/websocket"
)

for import_check in "${critical_imports[@]}"; do
  file=$(echo $import_check | cut -d':' -f1)
  module=$(echo $import_check | cut -d':' -f2)
  
  if grep -q "from ['\"].*$module" "$file" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Import $module em $file"
  else
    echo -e "${RED}✗${NC} Import $module NÃO encontrado em $file"
    ((errors++))
  fi
done

echo ""

# 7. Frontend
echo "7. VALIDANDO FRONTEND..."
echo "----------------------------------------"

if [ -f "client/dist/index.html" ]; then
  echo -e "${GREEN}✓${NC} index.html existe"
  size=$(stat -f%z "client/dist/index.html" 2>/dev/null || stat -c%s "client/dist/index.html" 2>/dev/null)
  echo "   Tamanho: $size bytes"
  
  # Verificar conteúdo básico
  if grep -q "AVD UISA" "client/dist/index.html"; then
    echo -e "${GREEN}✓${NC} Conteúdo válido detectado"
  else
    echo -e "${YELLOW}⚠${NC} Conteúdo pode estar incompleto"
    ((warnings++))
  fi
else
  echo -e "${RED}✗${NC} index.html NÃO encontrado"
  ((errors++))
fi

echo ""

# 8. Docker
echo "8. VALIDANDO DOCKERFILE..."
echo "----------------------------------------"

if [ -f "Dockerfile" ]; then
  echo -e "${GREEN}✓${NC} Dockerfile existe"
  
  # Verificar instruções essenciais
  if grep -q "FROM node" "Dockerfile"; then
    echo -e "${GREEN}✓${NC} Base image Node detectada"
  fi
  
  if grep -q "EXPOSE 3000" "Dockerfile"; then
    echo -e "${GREEN}✓${NC} Porta 3000 exposta"
  fi
  
  if grep -q "CMD" "Dockerfile"; then
    echo -e "${GREEN}✓${NC} Comando de inicialização definido"
  fi
else
  echo -e "${RED}✗${NC} Dockerfile NÃO encontrado"
  ((errors++))
fi

echo ""

# 9. Endpoints
echo "9. TESTANDO ENDPOINTS (se servidor estiver rodando)..."
echo "----------------------------------------"

if lsof -i :3000 &> /dev/null; then
  echo "Servidor detectado na porta 3000"
  
  endpoints=("/health" "/api" "/api/status")
  
  for endpoint in "${endpoints[@]}"; do
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$endpoint")
    if [ "$response" = "200" ]; then
      echo -e "${GREEN}✓${NC} GET $endpoint - HTTP $response"
    else
      echo -e "${RED}✗${NC} GET $endpoint - HTTP $response"
      ((warnings++))
    fi
  done
else
  echo -e "${YELLOW}⚠${NC} Servidor não está rodando na porta 3000"
  echo "   Execute 'pnpm dev' ou 'pnpm start' para testar endpoints"
  ((warnings++))
fi

echo ""
echo "============================================"
echo "RESUMO DA VALIDAÇÃO"
echo "============================================"
echo -e "Erros críticos: ${RED}$errors${NC}"
echo -e "Avisos: ${YELLOW}$warnings${NC}"

if [ $errors -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✓ SISTEMA VALIDADO E PRONTO PARA DEPLOY${NC}"
  exit 0
else
  echo ""
  echo -e "${RED}✗ CORRIJA OS ERROS ANTES DO DEPLOY${NC}"
  exit 1
fi
