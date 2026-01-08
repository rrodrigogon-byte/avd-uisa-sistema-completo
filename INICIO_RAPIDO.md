# 🚀 INÍCIO RÁPIDO - AVD UISA

**Última Atualização**: 08/01/2026

---

## ⚡ Setup Automático (Recomendado)

Execute um único comando para configurar tudo:

```bash
bash setup-completo.sh
```

Este script irá:
1. ✅ Verificar pré-requisitos (Node.js, pnpm)
2. ✅ Testar conexão com banco de dados
3. ✅ Criar 62 tabelas
4. ✅ Popular dados básicos
5. ✅ Importar 3.114 funcionários
6. ✅ Criar usuários
7. ✅ Importar descrições de cargo
8. ✅ Criar ciclo de avaliação
9. ✅ Verificar integridade dos dados

**Tempo estimado**: 5-10 minutos

---

## 📋 Setup Manual (Passo a Passo)

Se preferir fazer manualmente, siga os passos:

### 1. Pré-requisitos

```bash
# Verificar Node.js (precisa ser 18+)
node --version

# Instalar pnpm (se necessário)
npm install -g pnpm

# Instalar dependências
pnpm install
```

### 2. Configurar Banco de Dados

```bash
# Copiar template de configuração
cp .env.example .env

# Editar .env e configurar DATABASE_URL
nano .env
# ou
vim .env
```

**Exemplo de DATABASE_URL**:
```env
# Com Cloud SQL Proxy (recomendado)
DATABASE_URL="mysql://avd_user:senha@127.0.0.1:3306/avd_uisa_db"

# Com IP público
DATABASE_URL="mysql://avd_user:senha@34.95.123.45:3306/avd_uisa_db"
```

**Consulte**: `GUIA_GOOGLE_CLOUD_SQL.md` para instruções completas

### 3. Testar Conexão

```bash
node test-db-connection.mjs
```

Se der erro, verifique:
- DATABASE_URL no .env
- Cloud SQL Proxy está rodando (se usar)
- Firewall permite conexão
- Credenciais estão corretas

### 4. Criar Tabelas

```bash
pnpm db:push
```

Isso criará 62 tabelas no banco de dados.

### 5. Popular Dados Básicos

```bash
node seed.mjs
```

Criará: departamentos, cargos, competências, ciclo inicial.

### 6. Importar Funcionários

```bash
node execute-import.mjs
```

Importará 3.114 funcionários do arquivo `import-data.json`.

### 7. Criar Usuários

```bash
node create-remaining-users.mjs
```

Criará usuários para todos os funcionários ativos.

### 8. Verificar Integridade

```bash
node verificar-integridade-dados.mjs
```

Gera relatório completo de todos os dados importados.

### 9. Iniciar Servidor

```bash
pnpm dev
```

Acesse: http://localhost:3000

---

## 🔑 Credenciais de Acesso

As credenciais dos usuários estão no arquivo: `users-credentials.json`

**Exemplo**:
```json
{
  "email": "thallys.lima@uisa.com.br",
  "username": "thallys.fernando",
  "password": "WGO*oJqIjC%7",
  "role": "gestor"
}
```

**Distribuição de usuários**:
- 👨‍💼 Gestores: 260 usuários (84%)
- 👤 Colaboradores: 44 usuários (14%)
- 🔑 Administradores: 6 usuários (2%)

---

## 📊 Dados Disponíveis

| Tipo | Quantidade | Arquivo |
|------|-----------|---------|
| Funcionários | 3.114 | import-data.json |
| Usuários | 310 | users-credentials.json |
| Descrições de Cargo | 491 | data/uisa-job-descriptions.json |
| PDIs | 2 | pdi_data.json |
| Sucessão | - | succession-data-uisa.json |

---

## 🧪 Testes

```bash
# Executar testes unitários
pnpm test

# Executar testes E2E
pnpm test:e2e

# Verificar TypeScript
pnpm check
```

---

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
pnpm dev                    # Iniciar servidor dev
pnpm build                  # Build para produção
pnpm start                  # Iniciar produção

# Banco de Dados
pnpm db:push                # Criar/atualizar tabelas
node test-db-connection.mjs # Testar conexão

# Dados
node seed.mjs                          # Popular dados base
node execute-import.mjs                # Importar funcionários
node create-remaining-users.mjs        # Criar usuários
node verificar-integridade-dados.mjs   # Verificar integridade

# Qualidade
pnpm test                   # Testes
pnpm check                  # TypeScript
pnpm format                 # Formatar código
```

---

## 📚 Documentação

- **README.md** - Documentação principal completa
- **GUIA_CONTINUIDADE_DESENVOLVIMENTO.md** - Guia de desenvolvimento
- **PLANO_MELHORIAS_2026.md** - Roadmap de 10 semanas
- **GUIA_GOOGLE_CLOUD_SQL.md** - Configuração de banco
- **RELATORIO_INTEGRIDADE_DADOS.md** - Análise de dados
- **.env.example** - Template de configuração

---

## ❓ Troubleshooting

### Erro: "DATABASE_URL não configurada"
**Solução**: Copie `.env.example` para `.env` e configure DATABASE_URL

### Erro: "Can't connect to MySQL server"
**Solução**: 
- Verifique se Cloud SQL Proxy está rodando
- Confirme IP/host no .env
- Verifique firewall

### Erro: "Access denied for user"
**Solução**: 
- Verifique usuário e senha no .env
- Confirme que usuário existe no banco
- Verifique privilégios do usuário

### Erro: "pnpm: command not found"
**Solução**: 
```bash
npm install -g pnpm
```

### Erro ao importar dados
**Solução**:
- Verifique se banco tem espaço suficiente
- Confirme que tabelas foram criadas (pnpm db:push)
- Verifique logs de erro detalhados

---

## 🆘 Suporte

Se encontrar problemas:

1. **Consulte a documentação** em `/docs` ou arquivos `.md`
2. **Execute diagnóstico**: `node test-db-connection.mjs`
3. **Verifique integridade**: `node verificar-integridade-dados.mjs`
4. **Revise logs** de erro no terminal
5. **Consulte guias** específicos (GUIA_*.md)

---

## 🎯 Próximos Passos Após Setup

1. ✅ Sistema configurado e rodando
2. 🔐 Fazer login com credencial de `users-credentials.json`
3. 👥 Explorar módulo de funcionários
4. 📊 Criar primeiro ciclo de avaliação
5. 🎯 Configurar metas corporativas
6. 📋 Criar PDIs para colaboradores
7. 🧪 Executar testes (`pnpm test`)
8. 📈 Explorar dashboards e relatórios

---

## 🚀 Deploy em Produção

Para deploy no Google Cloud Run, consulte:
- `GUIA_GOOGLE_CLOUD_SQL.md` - Seção 7: Deploy no Cloud Run
- `README.md` - Seção de Deploy

---

**Sistema AVD UISA v2.0.0**  
**Desenvolvido por**: Manus AI  
**Repositório**: https://github.com/rrodrigogon-byte/avd-uisa-sistema-completo
