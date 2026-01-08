# Plano de Melhorias AVD UISA - 2026

**Data de Criação**: 08/01/2026  
**Sistema**: AVD UISA v2.0.0  
**Repositório**: https://github.com/rrodrigogon-byte/avd-uisa-sistema-completo.git

---

## 🎯 Objetivo

Dar continuidade ao desenvolvimento do Sistema AVD UISA, implementando melhorias, correções e novas funcionalidades para aumentar a robustez, usabilidade e valor do sistema.

---

## 📊 Status Atual do Sistema

### ✅ Pontos Fortes
- Sistema 100% funcional e operacional
- 20+ módulos implementados (360°, PDI, Metas SMART, Nine Box, etc.)
- Stack moderna: React 19, TypeScript, tRPC 11, Express 4
- 62 tabelas normalizadas no banco de dados
- Sistema de notificações e emails funcionando
- Autenticação OAuth configurada
- 114 testes automatizados (95% de sucesso)

### ⚠️ Pontos de Atenção (Identificados no TODO)
- **CRÍTICO**: Erro 404 em algumas rotas do sistema
- **IMPORTANTE**: 6 testes automatizados falhando (5% de falha)
- **MELHORIA**: Sistema de importação de PDI precisa de validações avançadas
- **MELHORIA**: Falta documentação de usuário (guias e tutoriais)

---

## 🚀 Plano de Ação Imediato

### Fase 1: Correções Urgentes (Semana 1-2)

#### 1.1 Corrigir Rotas 404
**Prioridade**: 🔴 ALTA  
**Impacto**: Usuários não conseguem acessar certas páginas

**Ações**:
- [ ] Mapear todas as rotas do sistema
- [ ] Identificar rotas quebradas retornando 404
- [ ] Verificar configuração do Wouter (router)
- [ ] Corrigir rotas no frontend e backend
- [ ] Testar navegação completa do sistema

**Arquivos a verificar**:
- `client/src/App.tsx` - Definição de rotas
- `server/routers.ts` - Registro de routers tRPC
- `client/src/pages/*` - Componentes de páginas

---

#### 1.2 Corrigir Testes Automatizados
**Prioridade**: 🔴 ALTA  
**Impacto**: Garantir qualidade e estabilidade do código

**Ações**:
- [ ] Executar suite de testes completa
- [ ] Identificar os 6 testes falhando
- [ ] Investigar causa raiz de cada falha
- [ ] Corrigir implementações ou testes
- [ ] Garantir 100% de testes passando

**Comando para executar testes**:
```bash
pnpm test
pnpm test:e2e
```

---

### Fase 2: Melhorias de Usabilidade (Semana 3-4)

#### 2.1 Melhorias na Importação de PDI
**Prioridade**: 🟡 MÉDIA  
**Impacto**: Facilitar trabalho do RH na importação de dados

**Melhorias a implementar**:
- [ ] **Validação Avançada de Competências**
  - Criar competências automaticamente se não existirem
  - Sugerir competências similares quando não encontradas
  - Permitir mapeamento de competências no preview

- [ ] **Notificações de Importação**
  - Enviar email quando importação for concluída
  - Notificar colaboradores sobre PDIs importados
  - Alertar gestores sobre PDIs pendentes de aprovação

- [ ] **Exportação de PDIs**
  - Permitir exportar PDIs existentes no formato do template
  - Exportar por ciclo, departamento ou colaborador
  - Incluir filtros avançados na exportação

**Arquivos a modificar**:
- `server/routers/pdiRouter.ts`
- `client/src/pages/PDIImport.tsx`

---

#### 2.2 Documentação de Usuário
**Prioridade**: 🟡 MÉDIA  
**Impacto**: Facilitar onboarding e reduzir dúvidas

**Documentos a criar**:
- [ ] **Guia do Administrador**
  - Como configurar o sistema
  - Como gerenciar usuários e permissões
  - Como criar ciclos avaliativos
  - Como importar dados

- [ ] **Guia do Colaborador**
  - Como acessar o sistema
  - Como fazer autoavaliação
  - Como gerenciar metas e PDI
  - Como dar e receber feedbacks

- [ ] **Guia do Gestor**
  - Como avaliar equipe
  - Como aprovar metas
  - Como acompanhar performance
  - Como participar de calibração

- [ ] **FAQ e Troubleshooting**
  - Perguntas frequentes
  - Solução de problemas comuns
  - Vídeos tutoriais (opcional)

**Local dos documentos**: `/home/user/webapp/docs/`

---

### Fase 3: Otimizações e Performance (Semana 5-6)

#### 3.1 Otimização de Banco de Dados
**Prioridade**: 🟡 MÉDIA  
**Impacto**: Melhorar velocidade de consultas

**Ações**:
- [ ] Analisar queries lentas (>1s)
- [ ] Adicionar índices em colunas frequentemente consultadas
- [ ] Otimizar queries complexas com JOINs
- [ ] Implementar cache para dados estáticos
- [ ] Testar performance com dados reais (4471 funcionários)

**Script de análise de performance**:
```sql
-- Identificar queries lentas
SHOW PROCESSLIST;
EXPLAIN SELECT ...;
```

---

#### 3.2 Importação Assíncrona
**Prioridade**: 🟢 BAIXA  
**Impacto**: Melhorar UX em importações grandes

**Ações**:
- [ ] Implementar fila de processamento (Bull ou Redis)
- [ ] Criar worker para processar importações em background
- [ ] Adicionar feedback em tempo real do progresso
- [ ] Implementar resumo de importação ao final

**Arquivos a criar**:
- `server/queues/importQueue.ts`
- `server/workers/importWorker.ts`

---

### Fase 4: Novas Funcionalidades (Semana 7-10)

#### 4.1 Fluxo de Aprovação de Descrições de Cargo
**Prioridade**: 🔴 ALTA (Solicitado)  
**Impacto**: Formalizar processo de aprovação

**Detalhes completos**: Ver `ROADMAP_NOVAS_FUNCIONALIDADES.md` seção 1

**Resumo**:
- Implementar fluxo sequencial de 4 níveis de aprovação
- Envio automático de emails para cada aprovador
- Interface para revisar e aprovar alterações
- Comparação lado a lado (antes vs depois)

**Estimativa**: 8-12 horas

---

#### 4.2 Exportação de Dados (Excel e PDF)
**Prioridade**: 🟡 MÉDIA (Solicitado)  
**Impacto**: Facilitar análise e compartilhamento de dados

**Detalhes completos**: Ver `ROADMAP_NOVAS_FUNCIONALIDADES.md` seção 2

**Resumo**:
- Exportação para Excel (relatórios de funcionários, metas, avaliações, PDIs)
- Exportação para PDF (relatórios individuais, 360°, PDI)
- Formatação profissional com logo e estilos

**Estimativa**: 6-10 horas

---

#### 4.3 Dashboard de Métricas de Importações
**Prioridade**: 🟢 BAIXA  
**Impacto**: Monitorar uso do sistema

**Ações**:
- [ ] Criar tabela de logs de importação
- [ ] Registrar métricas: data, usuário, tipo, sucesso/erro, tempo
- [ ] Criar dashboard com gráficos:
  - Importações por período
  - Taxa de sucesso/erro
  - Tempo médio de processamento
  - Tipos de importação mais usados

**Arquivos a criar**:
- `server/routers/importMetricsRouter.ts`
- `client/src/pages/ImportMetrics.tsx`

---

## 📋 Checklist de Qualidade

Antes de considerar uma tarefa concluída:

- [ ] Código testado localmente
- [ ] Testes automatizados criados/atualizados
- [ ] Documentação atualizada
- [ ] Code review realizado (se aplicável)
- [ ] Commit com mensagem clara
- [ ] Pull Request criado no GitHub

---

## 🔧 Comandos Úteis

### Desenvolvimento
```bash
# Iniciar servidor de desenvolvimento
pnpm dev

# Verificar TypeScript
pnpm check

# Formatar código
pnpm format

# Executar testes
pnpm test

# Executar testes E2E
pnpm test:e2e
```

### Banco de Dados
```bash
# Aplicar migrações
pnpm db:push

# Criar seed de dados
node seed.mjs
```

### Git
```bash
# Criar branch para nova feature
git checkout -b feature/nome-da-feature

# Commit seguindo padrão
git commit -m "feat: adiciona nova funcionalidade X"
git commit -m "fix: corrige bug Y"
git commit -m "docs: atualiza documentação Z"

# Push e criar PR
git push origin feature/nome-da-feature
```

---

## 📈 Métricas de Sucesso

### KPIs do Projeto
- **Taxa de Conclusão de Tarefas**: Meta 90%
- **Cobertura de Testes**: Meta 100%
- **Performance de Queries**: Meta <500ms
- **Tempo de Importação**: Meta <5s para 100 registros
- **Satisfação do Usuário**: Meta NPS >50

---

## 🗓️ Cronograma Estimado

| Fase | Duração | Data Início | Data Fim |
|------|---------|-------------|----------|
| Fase 1: Correções Urgentes | 2 semanas | 08/01/2026 | 22/01/2026 |
| Fase 2: Melhorias de Usabilidade | 2 semanas | 23/01/2026 | 05/02/2026 |
| Fase 3: Otimizações e Performance | 2 semanas | 06/02/2026 | 19/02/2026 |
| Fase 4: Novas Funcionalidades | 4 semanas | 20/02/2026 | 19/03/2026 |

**Total estimado**: 10 semanas (~2,5 meses)

---

## 📞 Contatos e Recursos

- **Repositório GitHub**: https://github.com/rrodrigogon-byte/avd-uisa-sistema-completo.git
- **Documentação Técnica**: `/home/user/webapp/README.md`
- **TODO Atual**: `/home/user/webapp/todo.md`
- **Próximos Passos**: `/home/user/webapp/PROXIMOS_PASSOS.md`

---

## ✅ Progresso

- [x] Plano de melhorias criado
- [x] Ambiente de desenvolvimento configurado
- [x] Dependências instaladas
- [ ] Fase 1 iniciada
- [ ] Fase 2 iniciada
- [ ] Fase 3 iniciada
- [ ] Fase 4 iniciada

---

**Última Atualização**: 08/01/2026  
**Responsável**: Manus AI  
**Status**: 🟢 Ativo
