#!/bin/bash
# ============================================================================
# Script de Inicialização Completa - AVD UISA v2.0.0
# ============================================================================
#
# Este script executa TUDO que falta para rodar o sistema:
# 1. Verifica pré-requisitos
# 2. Faz build da aplicação
# 3. Inicia o servidor
#
# Uso: ./start-system.sh
#
# ============================================================================

set -e  # Parar em caso de erro

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Banner
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║         🚀 Inicialização Completa - AVD UISA v2.0.0          ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# STEP 1: Verificar pré-requisitos
# ============================================================================
log_info "Verificando pré-requisitos..."

if ! command -v node &> /dev/null; then
    log_error "Node.js não encontrado. Instale Node.js 20+"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    log_error "pnpm não encontrado. Instalando..."
    npm install -g pnpm@10.15.1
fi

log_success "Pré-requisitos OK"

# ============================================================================
# STEP 2: Verificar .env
# ============================================================================
log_info "Verificando configuração..."

if [ ! -f .env ]; then
    log_error ".env não encontrado!"
    exit 1
fi

if ! grep -q "DATABASE_URL" .env; then
    log_error "DATABASE_URL não configurado no .env"
    exit 1
fi

log_success "Configuração OK"

# ============================================================================
# STEP 3: Verificar node_modules
# ============================================================================
log_info "Verificando dependencies..."

if [ ! -d "node_modules" ]; then
    log_warning "Dependencies não instaladas. Instalando..."
    pnpm install --frozen-lockfile
fi

log_success "Dependencies OK"

# ============================================================================
# STEP 4: Verificar banco de dados
# ============================================================================
log_info "Verificando banco de dados..."

# Extrair info do DATABASE_URL
DB_HOST=$(grep DATABASE_URL .env | cut -d'@' -f2 | cut -d':' -f1)
DB_PORT=$(grep DATABASE_URL .env | cut -d'@' -f2 | cut -d':' -f2 | cut -d'/' -f1)
DB_NAME=$(grep DATABASE_URL .env | cut -d'/' -f4 | tr -d '"' | tr -d '\n')

log_info "Host: $DB_HOST:$DB_PORT"
log_info "Database: $DB_NAME"

# Testar conexão (opcional)
# mysql -h $DB_HOST -P $DB_PORT -u root -p $DB_NAME -e "SELECT COUNT(*) FROM employees;" 2>/dev/null && \
#   log_success "Banco de dados acessível" || \
#   log_warning "Não foi possível testar conexão com banco"

log_success "Configuração do banco OK"

# ============================================================================
# STEP 5: Perguntar modo de execução
# ============================================================================
echo ""
log_info "Escolha o modo de execução:"
echo ""
echo "  1) Desenvolvimento (pnpm dev) - Hot reload, logs detalhados"
echo "  2) Produção (pnpm build + start) - Otimizado, como Cloud Run"
echo "  3) Apenas Build (pnpm build) - Gerar dist/"
echo ""
read -p "Opção (1-3): " MODE

# ============================================================================
# STEP 6: Executar ação escolhida
# ============================================================================
echo ""

case $MODE in
  1)
    log_info "Modo: DESENVOLVIMENTO"
    log_info "Iniciando servidor com hot reload..."
    echo ""
    log_success "Sistema será iniciado em: http://localhost:3000"
    echo ""
    log_warning "Pressione Ctrl+C para parar o servidor"
    echo ""
    sleep 2
    pnpm dev
    ;;
    
  2)
    log_info "Modo: PRODUÇÃO"
    
    # Build
    log_info "Executando build da aplicação..."
    pnpm build
    
    if [ ! -f "dist/index.js" ]; then
        log_error "Build falhou - dist/index.js não foi criado"
        exit 1
    fi
    
    log_success "Build concluído!"
    log_info "Arquivos gerados:"
    echo "  • dist/index.js (servidor)"
    echo "  • client/dist/ (frontend)"
    echo ""
    
    # Start
    log_info "Iniciando servidor em modo produção..."
    echo ""
    log_success "Sistema será iniciado em: http://localhost:3000"
    echo ""
    log_warning "Pressione Ctrl+C para parar o servidor"
    echo ""
    sleep 2
    pnpm start
    ;;
    
  3)
    log_info "Modo: APENAS BUILD"
    log_info "Executando build da aplicação..."
    pnpm build
    
    if [ ! -f "dist/index.js" ]; then
        log_error "Build falhou - dist/index.js não foi criado"
        exit 1
    fi
    
    log_success "Build concluído!"
    echo ""
    log_info "Arquivos gerados:"
    ls -lh dist/index.js
    echo ""
    du -sh client/dist/
    echo ""
    log_success "Sistema pronto para produção!"
    log_info "Para iniciar: pnpm start"
    ;;
    
  *)
    log_error "Opção inválida"
    exit 1
    ;;
esac

echo ""
log_success "Script concluído!"
echo ""
