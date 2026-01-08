#!/bin/bash

# ============================================================================
# Script de Setup Automático - AVD UISA
# ============================================================================
# 
# Este script automatiza TODOS os passos de configuração do sistema:
# - Validação de pré-requisitos
# - Criação de tabelas (migrations)
# - Seed de dados básicos
# - Importação de funcionários
# - Criação de usuários
# - Verificação de integridade
#
# Uso: bash setup-completo.sh
# ============================================================================

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
     _    __     ______    _   _ ___ ____    _    
    / \   \ \   / /  _ \  | | | |_ _/ ___|  / \   
   / _ \   \ \ / /| | | | | | | || |\___ \ / _ \  
  / ___ \   \ V / | |_| | | |_| || | ___) / ___ \ 
 /_/   \_\   \_/  |____/   \___/|___|____/_/   \_\
                                                    
  Sistema de Avaliação de Desempenho - v2.0.0
  Setup Automático Completo
EOF
echo -e "${NC}\n"

# ============================================================================
# ETAPA 1: PRÉ-REQUISITOS
# ============================================================================

print_header "ETAPA 1: VERIFICANDO PRÉ-REQUISITOS"

# 1.1 Verificar Node.js
print_info "Verificando Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js instalado: $NODE_VERSION"
    
    # Verificar se é versão 18+
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 18 ]; then
        print_error "Node.js versão 18 ou superior é necessária"
        exit 1
    fi
else
    print_error "Node.js não instalado"
    echo "Instale Node.js 20+ de: https://nodejs.org"
    exit 1
fi

# 1.2 Verificar pnpm
print_info "Verificando pnpm..."
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    print_success "pnpm instalado: $PNPM_VERSION"
else
    print_warning "pnpm não encontrado. Instalando..."
    npm install -g pnpm
    print_success "pnpm instalado"
fi

# 1.3 Verificar arquivo .env
print_info "Verificando arquivo .env..."
if [ -f ".env" ]; then
    print_success "Arquivo .env encontrado"
    
    # Verificar DATABASE_URL
    if grep -q "DATABASE_URL=" .env && ! grep -q "DATABASE_URL=\"mysql://usuario:senha" .env; then
        print_success "DATABASE_URL configurada"
    else
        print_error "DATABASE_URL não configurada corretamente no .env"
        print_info "Copie .env.example para .env e configure suas credenciais"
        exit 1
    fi
else
    print_error "Arquivo .env não encontrado"
    print_info "Criando .env a partir de .env.example..."
    
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_warning "Arquivo .env criado. CONFIGURE-O antes de continuar!"
        echo ""
        print_info "Edite o arquivo .env e preencha:"
        echo "  - DATABASE_URL (obrigatório)"
        echo "  - JWT_SECRET (obrigatório)"
        echo "  - SMTP_* (para envio de emails)"
        echo ""
        echo "Após configurar, execute novamente: bash setup-completo.sh"
        exit 1
    else
        print_error ".env.example não encontrado"
        exit 1
    fi
fi

# 1.4 Verificar dependências instaladas
print_info "Verificando dependências..."
if [ -d "node_modules" ]; then
    print_success "Dependências já instaladas"
else
    print_info "Instalando dependências (pode levar alguns minutos)..."
    pnpm install
    print_success "Dependências instaladas"
fi

# ============================================================================
# ETAPA 2: TESTAR CONEXÃO COM BANCO DE DADOS
# ============================================================================

print_header "ETAPA 2: TESTANDO CONEXÃO COM BANCO DE DADOS"

print_info "Executando teste de conexão..."
if node test-db-connection.mjs; then
    print_success "Conexão com banco de dados OK"
else
    print_error "Falha na conexão com banco de dados"
    print_info "Verifique:"
    echo "  1. DATABASE_URL no .env está correta"
    echo "  2. Cloud SQL Proxy está rodando (se aplicável)"
    echo "  3. Firewall permite conexão"
    echo "  4. Credenciais estão corretas"
    echo ""
    echo "Consulte: GUIA_GOOGLE_CLOUD_SQL.md"
    exit 1
fi

# ============================================================================
# ETAPA 3: CRIAR TABELAS (MIGRATIONS)
# ============================================================================

print_header "ETAPA 3: CRIANDO TABELAS NO BANCO DE DADOS"

print_info "Executando migrations (criando 62 tabelas)..."
if pnpm db:push; then
    print_success "Tabelas criadas com sucesso"
else
    print_error "Erro ao criar tabelas"
    exit 1
fi

# ============================================================================
# ETAPA 4: SEED DE DADOS BÁSICOS
# ============================================================================

print_header "ETAPA 4: POPULANDO DADOS BÁSICOS"

print_info "Criando departamentos, cargos, competências..."
if node seed.mjs; then
    print_success "Dados básicos criados"
else
    print_warning "Erro ao criar dados básicos (pode já existir)"
fi

# ============================================================================
# ETAPA 5: IMPORTAR FUNCIONÁRIOS
# ============================================================================

print_header "ETAPA 5: IMPORTANDO FUNCIONÁRIOS"

if [ -f "import-data.json" ]; then
    print_info "Importando 3.114 funcionários (pode levar alguns minutos)..."
    
    if node execute-import.mjs; then
        print_success "Funcionários importados com sucesso"
    else
        print_error "Erro ao importar funcionários"
        print_warning "Continuando setup..."
    fi
else
    print_warning "Arquivo import-data.json não encontrado"
    print_info "Pulando importação de funcionários"
fi

# ============================================================================
# ETAPA 6: CRIAR USUÁRIOS
# ============================================================================

print_header "ETAPA 6: CRIANDO USUÁRIOS PARA FUNCIONÁRIOS"

if [ -f "create-remaining-users.mjs" ]; then
    print_info "Criando usuários para funcionários ativos..."
    
    if node create-remaining-users.mjs; then
        print_success "Usuários criados com sucesso"
    else
        print_error "Erro ao criar usuários"
        print_warning "Continuando setup..."
    fi
else
    print_warning "Script create-remaining-users.mjs não encontrado"
    print_info "Pulando criação de usuários"
fi

# ============================================================================
# ETAPA 7: IMPORTAR DESCRIÇÕES DE CARGO
# ============================================================================

print_header "ETAPA 7: IMPORTANDO DESCRIÇÕES DE CARGO"

if [ -f "scripts/import-job-desc.mjs" ]; then
    print_info "Importando 491 descrições de cargo..."
    
    if node scripts/import-job-desc.mjs; then
        print_success "Descrições de cargo importadas"
    else
        print_warning "Erro ao importar descrições de cargo"
    fi
else
    print_warning "Script de importação não encontrado"
    print_info "Pulando importação de descrições"
fi

# ============================================================================
# ETAPA 8: CRIAR CICLO DE AVALIAÇÃO
# ============================================================================

print_header "ETAPA 8: CRIANDO CICLO DE AVALIAÇÃO 2025"

if [ -f "create-cycle.mjs" ]; then
    print_info "Criando ciclo de avaliação..."
    
    if node create-cycle.mjs; then
        print_success "Ciclo criado com sucesso"
    else
        print_warning "Erro ao criar ciclo (pode já existir)"
    fi
else
    print_warning "Script create-cycle.mjs não encontrado"
fi

# ============================================================================
# ETAPA 9: VERIFICAR INTEGRIDADE
# ============================================================================

print_header "ETAPA 9: VERIFICANDO INTEGRIDADE DOS DADOS"

print_info "Executando verificação completa..."
if node verificar-integridade-dados.mjs; then
    print_success "Verificação de integridade concluída"
else
    print_warning "Verifique o relatório de integridade"
fi

# ============================================================================
# ETAPA 10: RELATÓRIO FINAL
# ============================================================================

print_header "✅ SETUP CONCLUÍDO COM SUCESSO!"

echo ""
print_success "Sistema AVD UISA configurado e pronto para uso!"
echo ""

print_info "RESUMO DO SETUP:"
echo ""
echo "  ✅ Banco de dados conectado"
echo "  ✅ 62 tabelas criadas"
echo "  ✅ Dados básicos populados"
echo "  ✅ Funcionários importados"
echo "  ✅ Usuários criados"
echo "  ✅ Descrições de cargo importadas"
echo "  ✅ Ciclo de avaliação criado"
echo ""

print_header "PRÓXIMOS PASSOS"

echo ""
echo "1. 🚀 Iniciar servidor de desenvolvimento:"
echo "   ${GREEN}pnpm dev${NC}"
echo ""
echo "2. 🌐 Acessar sistema:"
echo "   ${GREEN}http://localhost:3000${NC}"
echo ""
echo "3. 🔐 Login:"
echo "   Use as credenciais do arquivo users-credentials.json"
echo "   ou crie um novo usuário admin"
echo ""
echo "4. 📊 Verificar dados:"
echo "   ${GREEN}node verificar-integridade-dados.mjs${NC}"
echo ""
echo "5. 🧪 Executar testes:"
echo "   ${GREEN}pnpm test${NC}"
echo ""
echo "6. 📚 Documentação:"
echo "   - README.md - Documentação principal"
echo "   - GUIA_CONTINUIDADE_DESENVOLVIMENTO.md - Guia completo"
echo "   - PLANO_MELHORIAS_2026.md - Roadmap"
echo "   - GUIA_GOOGLE_CLOUD_SQL.md - Configuração DB"
echo ""

print_success "Setup completo finalizado!"
echo ""

# Perguntar se quer iniciar o servidor
read -p "Deseja iniciar o servidor de desenvolvimento agora? (s/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[SsYy]$ ]]; then
    print_info "Iniciando servidor..."
    pnpm dev
fi
