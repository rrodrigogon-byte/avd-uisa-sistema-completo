# 🚀 Guia de Continuidade de Desenvolvimento - AVD UISA

**Data**: 08/01/2026  
**Sistema**: AVD UISA v2.0.0  
**Repositório**: https://github.com/rrodrigogon-byte/avd-uisa-sistema-completo.git  
**Branch Principal**: `main`

---

## ✅ O QUE JÁ FOI FEITO

### 1. Ambiente Configurado ✅
- ✅ Dependências instaladas com pnpm (1319 pacotes)
- ✅ Sistema pronto para desenvolvimento
- ✅ Plano de melhorias documentado

### 2. Análise Completa do Sistema ✅
- ✅ Sistema possui 20+ módulos funcionais
- ✅ 342 páginas/componentes React mapeados
- ✅ Stack moderna: React 19 + TypeScript + tRPC 11
- ✅ 62 tabelas no banco de dados
- ✅ 114 testes automatizados (95% sucesso)

### 3. Documentação Criada ✅
- ✅ `PLANO_MELHORIAS_2026.md` - Plano completo de 10 semanas
- ✅ `GUIA_CONTINUIDADE_DESENVOLVIMENTO.md` - Este arquivo
- ✅ Roadmap estruturado por fases

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

### PASSO 1: Executar Testes e Identificar Problemas

```bash
# 1. Executar suite de testes completa
cd /home/user/webapp
export PATH="$HOME/.local/bin:$PATH"
pnpm test

# 2. Executar testes E2E (se banco de dados estiver configurado)
pnpm test:e2e

# 3. Verificar TypeScript
pnpm check
```

**Objetivo**: Identificar os 6 testes falhando mencionados no TODO

---

### PASSO 2: Configurar Variáveis de Ambiente

Você precisará configurar as seguintes variáveis de ambiente antes de iniciar o servidor:

```bash
# Criar arquivo .env na raiz do projeto
cd /home/user/webapp

cat > .env << 'EOF'
# Banco de Dados
DATABASE_URL="mysql://user:password@host:port/database"

# JWT
JWT_SECRET="seu-segredo-super-secreto-aqui"

# SMTP (para envio de emails)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-ou-app-password"
SMTP_FROM="noreply@uisa.com.br"
SMTP_FROM_NAME="Sistema AVD UISA"

# OAuth Manus (já configurado na plataforma)
OAUTH_CLIENT_ID="seu-client-id"
OAUTH_CLIENT_SECRET="seu-client-secret"
OAUTH_REDIRECT_URI="https://seu-dominio/auth/callback"

# AWS S3 (para storage de arquivos)
AWS_ACCESS_KEY_ID="sua-access-key"
AWS_SECRET_ACCESS_KEY="sua-secret-key"
AWS_REGION="us-east-1"
AWS_BUCKET="seu-bucket"

# Outros
NODE_ENV="development"
PORT="3000"
EOF
```

**IMPORTANTE**: Substitua os valores acima pelas suas credenciais reais.

---

### PASSO 3: Iniciar Servidor de Desenvolvimento

```bash
cd /home/user/webapp
export PATH="$HOME/.local/bin:$PATH"

# Opção 1: Com banco de dados local (migrações)
pnpm db:push  # Aplica migrations no banco
pnpm dev      # Inicia servidor

# Opção 2: Sem banco de dados (apenas frontend)
pnpm dev
```

O sistema estará disponível em: `http://localhost:3000`

---

## 🔍 PROBLEMAS IDENTIFICADOS E SOLUÇÕES

### 1. ROTAS 404 (PRIORIDADE ALTA 🔴)

**Problema**: Algumas rotas retornam 404 quando acessadas

**Como investigar**:

```bash
# 1. Listar todas as rotas definidas no App.tsx
cd /home/user/webapp
grep -n "Route path=" client/src/App.tsx | wc -l

# 2. Verificar rotas comentadas (podem estar desabilitadas)
grep -n "// <Route" client/src/App.tsx

# 3. Testar rotas no navegador após iniciar o servidor
```

**Rotas comentadas encontradas** (podem ser os 404):
- `/admin/bonus-workflows` - Temporariamente desabilitado
- `/admin/import-uisa` - Temporariamente desabilitado
- `/metas/corporativas/adesao` - Temporariamente desabilitado
- `/aprovacoes/bonus-workflow/:id` - Temporariamente desabilitado
- `/compliance/bonus` - Temporariamente desabilitado
- `/folha-pagamento/exportar` - Temporariamente desabilitado

**Solução sugerida**:
1. Descomentar rotas necessárias
2. Ou remover links que apontam para essas rotas
3. Ou criar páginas de "Em desenvolvimento"

---

### 2. TESTES FALHANDO (PRIORIDADE ALTA 🔴)

**Problema**: 6 testes automatizados falhando (95% sucesso)

**Como corrigir**:

```bash
# 1. Executar testes com detalhes
cd /home/user/webapp
export PATH="$HOME/.local/bin:$PATH"
pnpm test -- --verbose

# 2. Executar teste específico
pnpm test -- nome-do-teste.test.ts

# 3. Ver logs de erro detalhados
pnpm test 2>&1 | tee test-errors.log
```

**Causas comuns**:
- Falta de variáveis de ambiente
- Banco de dados não configurado
- Mocks desatualizados
- Dependências faltando

---

### 3. MELHORIAS NA IMPORTAÇÃO DE PDI (PRIORIDADE ALTA 🔴)

**Funcionalidades a adicionar**:

#### 3.1 Validação Avançada de Competências

```typescript
// Arquivo: server/routers/pdiRouter.ts

// Adicionar procedure para validar competências
validateCompetencies: publicProcedure
  .input(z.object({
    competencies: z.array(z.string())
  }))
  .mutation(async ({ input, ctx }) => {
    // 1. Buscar competências existentes no DB
    const existing = await ctx.db.query.competencies.findMany({
      where: inArray(competencies.name, input.competencies)
    });
    
    // 2. Identificar competências não encontradas
    const missing = input.competencies.filter(
      c => !existing.find(e => e.name === c)
    );
    
    // 3. Sugerir competências similares (fuzzy search)
    const suggestions = await findSimilarCompetencies(missing);
    
    // 4. Retornar resultado
    return {
      existing,
      missing,
      suggestions
    };
  });

// Adicionar procedure para criar competências automaticamente
createCompetenciesAuto: publicProcedure
  .input(z.object({
    names: z.array(z.string())
  }))
  .mutation(async ({ input, ctx }) => {
    const created = [];
    for (const name of input.names) {
      const comp = await ctx.db.insert(competencies).values({
        name,
        description: `Competência importada automaticamente: ${name}`,
        createdAt: new Date()
      });
      created.push(comp);
    }
    return { created, count: created.length };
  });
```

#### 3.2 Notificações de Importação

```typescript
// Arquivo: server/routers/pdiRouter.ts

// Adicionar ao final da importação bem-sucedida
await sendEmailNotification({
  to: user.email,
  subject: "Importação de PDI concluída com sucesso",
  template: "pdi-import-success",
  data: {
    userName: user.name,
    totalImported: importedCount,
    successCount,
    errorCount,
    fileName: file.name,
    timestamp: new Date()
  }
});

// Notificar colaboradores sobre PDIs importados
for (const pdi of importedPDIs) {
  await sendEmailNotification({
    to: pdi.employee.email,
    subject: "Novo PDI disponível para você",
    template: "pdi-assigned",
    data: {
      employeeName: pdi.employee.name,
      cycle: pdi.cycle,
      actionsCount: pdi.actions.length
    }
  });
}

// Notificar gestores sobre PDIs pendentes
const managers = await getUniqueManagers(importedPDIs);
for (const manager of managers) {
  const teamPDIs = importedPDIs.filter(p => p.managerId === manager.id);
  await sendEmailNotification({
    to: manager.email,
    subject: `${teamPDIs.length} PDIs aguardando aprovação`,
    template: "pdi-approval-pending",
    data: {
      managerName: manager.name,
      pdisCount: teamPDIs.length,
      employees: teamPDIs.map(p => p.employee.name)
    }
  });
}
```

#### 3.3 Exportação de PDIs

```typescript
// Arquivo: server/routers/pdiRouter.ts

exportPDIs: publicProcedure
  .input(z.object({
    cycleId: z.number().optional(),
    departmentId: z.number().optional(),
    employeeId: z.number().optional(),
    format: z.enum(["excel", "csv"])
  }))
  .mutation(async ({ input, ctx }) => {
    // 1. Buscar PDIs com filtros
    const pdis = await ctx.db.query.pdis.findMany({
      where: and(
        input.cycleId ? eq(pdis.cycleId, input.cycleId) : undefined,
        input.departmentId ? eq(pdis.departmentId, input.departmentId) : undefined,
        input.employeeId ? eq(pdis.employeeId, input.employeeId) : undefined
      ),
      with: {
        employee: true,
        actions: true,
        competencies: true
      }
    });
    
    // 2. Transformar em formato de exportação
    const data = pdis.map(pdi => ({
      "Colaborador": pdi.employee.name,
      "Ciclo": pdi.cycle.name,
      "Competência": pdi.competencies.map(c => c.name).join(", "),
      "Ação de Desenvolvimento": pdi.actions.map(a => a.description).join(" | "),
      "Prazo": pdi.actions.map(a => format(a.deadline, "dd/MM/yyyy")).join(" | "),
      "Status": pdi.status,
      "Progresso": `${pdi.progress}%`
    }));
    
    // 3. Gerar arquivo (Excel ou CSV)
    if (input.format === "excel") {
      return await generateExcel(data, "PDIs_Exportados");
    } else {
      return await generateCSV(data, "PDIs_Exportados");
    }
  });
```

---

## 📚 DOCUMENTAÇÃO A CRIAR

### Guia do Administrador
Criar arquivo: `docs/GUIA_ADMINISTRADOR.md`

Conteúdo sugerido:
- Como configurar o sistema (SMTP, OAuth, DB)
- Como gerenciar usuários e permissões
- Como criar ciclos avaliativos
- Como importar dados (funcionários, metas, PDIs)
- Como configurar aprovadores
- Como monitorar o sistema

### Guia do Colaborador
Criar arquivo: `docs/GUIA_COLABORADOR.md`

Conteúdo sugerido:
- Como fazer primeiro acesso
- Como fazer autoavaliação
- Como gerenciar metas pessoais
- Como acessar e atualizar PDI
- Como dar e receber feedbacks
- Como participar de avaliação 360°

### Guia do Gestor
Criar arquivo: `docs/GUIA_GESTOR.md`

Conteúdo sugerido:
- Como avaliar equipe
- Como aprovar metas de subordinados
- Como acompanhar performance da equipe
- Como participar de calibração
- Como revisar PDIs da equipe

---

## 🔧 SCRIPTS ÚTEIS

### Script para identificar rotas quebradas

```bash
#!/bin/bash
# Arquivo: scripts/check-routes.sh

echo "🔍 Verificando rotas do sistema..."

# Extrair todas as rotas definidas
grep -oP 'path="\K[^"]+' client/src/App.tsx > /tmp/routes-defined.txt

# Extrair todas as rotas usadas em Links
grep -rh "to=\"/" client/src --include="*.tsx" | grep -oP 'to="\K[^"]+' | sort -u > /tmp/routes-used.txt

echo "📋 Rotas definidas: $(wc -l < /tmp/routes-defined.txt)"
echo "📋 Rotas utilizadas: $(wc -l < /tmp/routes-used.txt)"

echo ""
echo "⚠️  Rotas utilizadas mas não definidas (podem causar 404):"
comm -13 <(sort /tmp/routes-defined.txt) <(sort /tmp/routes-used.txt)
```

### Script para executar testes específicos

```bash
#!/bin/bash
# Arquivo: scripts/run-specific-tests.sh

export PATH="$HOME/.local/bin:$PATH"

echo "🧪 Executando testes específicos..."

# Testes unitários
pnpm test -- --run --reporter=verbose

# Testes E2E
pnpm test:e2e -- --reporter=html

echo "✅ Testes concluídos!"
```

---

## 📊 MÉTRICAS DE QUALIDADE

Antes de fazer commit, sempre verifique:

```bash
# 1. Verificação de TypeScript (0 erros)
pnpm check

# 2. Formatação de código
pnpm format

# 3. Testes (100% passando)
pnpm test

# 4. Build (sem erros)
pnpm build
```

---

## 🔄 WORKFLOW GIT

### Criar Branch para Nova Feature

```bash
cd /home/user/webapp

# Garantir que está na branch main atualizada
git checkout main
git pull origin main

# Criar branch para feature
git checkout -b feature/melhorias-importacao-pdi

# Fazer alterações...
# ... editar arquivos ...

# Commit
git add .
git commit -m "feat: adiciona validação avançada de competências na importação de PDI"

# Push
git push origin feature/melhorias-importacao-pdi
```

### Criar Pull Request

1. Acessar: https://github.com/rrodrigogon-byte/avd-uisa-sistema-completo/pulls
2. Clicar em "New Pull Request"
3. Selecionar branch: `feature/melhorias-importacao-pdi` → `main`
4. Preencher descrição:
   - O que foi implementado
   - Por que foi necessário
   - Como testar
   - Capturas de tela (se aplicável)
5. Solicitar review (se houver time)
6. Aguardar aprovação e fazer merge

---

## 🚀 DEPLOY

### Preparação para Deploy

```bash
cd /home/user/webapp

# 1. Executar testes
pnpm test

# 2. Verificar TypeScript
pnpm check

# 3. Fazer build de produção
pnpm build

# 4. Testar build localmente
pnpm start
```

### Checklist de Deploy

- [ ] Todos os testes passando (100%)
- [ ] Build sem erros
- [ ] Variáveis de ambiente configuradas no servidor
- [ ] Banco de dados com migrations aplicadas
- [ ] Backup do banco antes do deploy
- [ ] Documentação atualizada
- [ ] CHANGELOG atualizado
- [ ] Tag de versão criada no Git

---

## 📞 RECURSOS E CONTATOS

- **Repositório**: https://github.com/rrodrigogon-byte/avd-uisa-sistema-completo.git
- **Documentação Principal**: `/home/user/webapp/README.md`
- **Plano de Melhorias**: `/home/user/webapp/PLANO_MELHORIAS_2026.md`
- **TODO Atual**: `/home/user/webapp/todo.md`
- **Próximos Passos**: `/home/user/webapp/PROXIMOS_PASSOS.md`

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Semana 1-2: Correções Urgentes
- [ ] Executar testes e identificar os 6 falhando
- [ ] Corrigir testes falhando
- [ ] Identificar rotas 404
- [ ] Corrigir ou remover rotas quebradas
- [ ] Criar páginas "Em desenvolvimento" se necessário

### Semana 3-4: Melhorias de Usabilidade
- [ ] Implementar validação avançada de competências
- [ ] Adicionar notificações de importação
- [ ] Criar sistema de exportação de PDIs
- [ ] Criar guia do administrador
- [ ] Criar guia do colaborador
- [ ] Criar guia do gestor

### Semana 5-6: Otimizações
- [ ] Analisar queries lentas
- [ ] Adicionar índices no banco
- [ ] Implementar cache
- [ ] Criar fila de importação assíncrona

### Semana 7-10: Novas Funcionalidades
- [ ] Implementar fluxo de aprovação de descrições de cargo
- [ ] Criar exportação de relatórios (Excel e PDF)
- [ ] Implementar dashboard de métricas de importações

---

**Boa sorte com o desenvolvimento! 🚀**

*Este guia será atualizado conforme o progresso do projeto.*
