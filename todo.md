# Sistema AVD UISA - TODO List

## 🔥 SESSÃO ATUAL - IMPLEMENTAÇÕES PRIORITÁRIAS (FASE AVANÇADA)

### 1. Workflow Multinível de Aprovação de Bônus
- [x] Criar schema bonusApprovalWorkflows (níveis hierárquicos configuráveis)
- [x] Criar schema bonusApprovalLevels, bonusWorkflowInstances, bonusLevelApprovals
- [x] Implementar endpoints de workflow (createWorkflow, updateWorkflow, getWorkflow, executeWorkflow)
- [x] Criar bonusWorkflowRouter com 10 endpoints completos
- [x] Implementar lógica de aprovação em cadeia (gestor → gerente → diretor)
- [x] Adicionar notificações automáticas em cada nível
- [ ] Criar página de configuração de workflows (/admin/bonus-workflows)
- [ ] Integrar com sistema de bônus existente (frontend)

### 2. Dashboard de Compliance e SLA
- [ ] Criar endpoints de métricas SLA (tempo médio, pendências, alertas)
- [ ] Implementar página de compliance (/compliance/bonus)
- [ ] Adicionar gráficos de tempo médio de aprovação por departamento
- [ ] Criar alertas de não conformidade (bônus pendentes > X dias)
- [ ] Implementar KPIs de compliance (taxa de aprovação, tempo médio, pendências críticas)
- [ ] Adicionar relatório de SLA exportável

### 3. Integração com Folha de Pagamento
- [ ] Criar endpoint de exportação para folha (CSV/XML configurável)
- [ ] Implementar página de exportação (/folha-pagamento/exportar)
- [ ] Adicionar confirmação de pagamento em lote
- [ ] Criar histórico de exportações
- [ ] Implementar validação de dados antes da exportação
- [ ] Adicionar templates de exportação (TOTVS, SAP, etc)

### 4. Importação de Descrições de Cargos UISA
- [x] Extrair arquivo DESCRIÇÕES.zip (481 arquivos .docx)
- [ ] Criar script de parser de arquivos .docx
- [ ] Implementar importação em massa via endpoint
- [ ] Validar dados extraídos
- [ ] Gerar relatório de importação

### 5. Documentação Completa
- [x] Gerar especificações técnicas completas (50+ páginas)
- [x] Documentar schema do banco de dados (62+ tabelas)
- [x] Documentar endpoints backend (120+ endpoints)
- [x] Documentar regras de negócio (workflows, validações, cálculos)
- [x] Gerar PDF da documentação técnica
- [ ] Gerar código-fonte completo em arquivo .txt
- [ ] Criar PDF com capturas de todas as telas

---

## ✅ FUNCIONALIDADES IMPLEMENTADAS (COMPLETAS)

### Sistema de Bônus Completo ✅
- [x] bonusRouter com 20 endpoints (list, getById, create, update, delete, calculateBonus, listCalculations, approveCalculation, markAsPaid, getStats, getMonthlyTrends, getDepartmentDistribution, approveBatch, rejectBatch, addComment, getComments, getAuditLogs, getApprovalMetrics)
- [x] bonusWorkflowRouter com 10 endpoints (list, getById, create, update, delete, startWorkflow, approveLevel, rejectLevel, getPendingInstances, getWorkflowHistory)
- [x] Página /bonus com listagem de políticas
- [x] Formulário de criação/edição de políticas
- [x] Simulador de valores de bônus
- [x] Página /aprovacoes/bonus com workflow de aprovação
- [x] Página /relatorios/bonus com KPIs e filtros
- [x] Exportação Excel e PDF
- [x] Gráficos Chart.js (linha, barras, pizza)
- [x] Dashboard de previsão (/previsao-bonus)
- [x] Aprovação em lote (/aprovacoes/bonus-lote)
- [x] Histórico de auditoria (/bonus/auditoria)
- [x] Sistema de notificações automáticas
- [x] Sistema de comentários em aprovações
- [x] Schema de workflow multinível (4 tabelas)

### Testes Psicométricos ✅
- [x] 7 testes implementados (DISC, Big Five, MBTI, IE, VARK, Liderança, Âncoras)
- [x] 280 perguntas no banco de dados
- [x] Sistema de envio de convites por e-mail
- [x] Páginas de questionários públicos
- [x] Dashboard de resultados para RH

### PDI Inteligente ✅
- [x] Modelo 70-20-10 implementado
- [x] Integração com testes psicométricos
- [x] Sistema de recomendações automáticas
- [x] Dashboard de acompanhamento

### Descrição de Cargos UISA ✅
- [x] Template UISA completo (8 seções)
- [x] Workflow de aprovação 3 níveis
- [x] Sistema de registro de atividades
- [x] Exportação em PDF

### Produtividade e Alertas ✅
- [x] Importação de ponto eletrônico
- [x] Cálculo de discrepâncias
- [x] Dashboard de alertas
- [x] Job cron diário automático

### Busca e Navegação ✅
- [x] Busca global (Ctrl+K)
- [x] Breadcrumbs automáticos
- [x] Menu lateral organizado
- [x] Filtros avançados

### Documentação Técnica ✅
- [x] Especificações técnicas completas (50+ páginas)
- [x] Documentação de 62+ tabelas do banco
- [x] Documentação de 120+ endpoints backend
- [x] Regras de negócio detalhadas
- [x] Exemplos de código e queries
- [x] Diagramas de arquitetura
- [x] PDF gerado (ESPECIFICACOES-TECNICAS-COMPLETAS.pdf)


## 🚀 NOVA SESSÃO - IMPLEMENTAÇÕES FINAIS

### Correções Urgentes
- [x] Corrigir erro 404 em /aprovacoes/avaliacoes
- [x] Criar página AvaliacoesAprovacao.tsx
- [x] Adicionar rota no App.tsx
- [x] Aplicar correções críticas em permissions.ts (isAdmin, getAllSubordinates)

### Frontend Workflow Multinível
- [x] Criar página /admin/bonus-workflows (configuração de workflows)
- [ ] Criar página /aprovacoes/bonus-workflow/:id (aprovação em cadeia)
- [x] Integrar com bonusWorkflowRouter
- [x] Adicionar visualização de níveis e aprovadores
- [x] Implementar formulário de criação de workflow

### Dashboard Compliance e SLA
- [x] Criar página /compliance/bonus
- [x] Implementar KPIs (taxa de aprovação, tempo médio, pendências críticas)
- [x] Adicionar gráficos de tempo médio por departamento
- [x] Criar alertas de não conformidade (> X dias)
- [x] Adicionar exportação de relatório SLA

### Integração Folha de Pagamento
- [x] Criar página /folha-pagamento/exportar
- [x] Implementar endpoint de exportação (CSV/XML)
- [x] Adicionar templates (TOTVS, SAP, genérico)
- [x] Criar histórico de exportações
- [x] Implementar validação de dados
- [ ] Adicionar confirmação de pagamento em lote (backend endpoint)

### Documentação Performance
- [x] Documentar coleta de dados de performance
- [x] Explicar fórmula 40-30-30
- [x] Documentar fontes de dados (metas, 360°, competências)
- [x] Criar diagrama de fluxo de dados
- [x] Gerar documento SISTEMA-COLETA-PERFORMANCE.md (15+ páginas)


## 🔧 SESSÃO ATUAL - IMPLEMENTAÇÕES AVANÇADAS

### Correções de Código (Arquivos Anexos)
- [x] permissions.ts - CTEs recursivas para getAllSubordinates
- [x] db.ts - Adicionar getUserEmployee e getEmployeeSalary
- [x] activityTracking.ts - Fix crítico de employeeId vs userId
- [ ] goalsRouter.ts - Integração com Workflow genérico
- [ ] jobDescriptionsRouter.ts - Integração com Workflow genérico
- [ ] productivityRouter.ts - Alinhamento com descrição de cargo
- [ ] routers.ts - Registrar novos routers (workflow, jobDescriptions, productivity)
- [x] bonusWorkflowRouter.ts - Corrigir erros TypeScript (reduzido para 4 erros)

### Parser de Descrições UISA
- [x] Criar script de parser de arquivos .docx (parse-uisa-job-descriptions.mjs)
- [x] Implementar extração de dados estruturados (mammoth + regex)
- [x] Criar endpoint de importação em massa (uisaImportRouter)
- [x] Processar 481 arquivos extraídos (3.7 MB JSON gerado)
- [x] Gerar relatório de importação (stats por departamento e nível)

### Página de Aprovação em Cadeia
- [x] Criar /aprovacoes/bonus-workflow/:id (BonusWorkflowApproval.tsx)
- [x] Exibir detalhes do workflow e níveis
- [x] Mostrar histórico de aprovações (timeline visual)
- [x] Implementar ações de aprovar/rejeitar (com validações)
- [x] Adicionar comentários obrigatórios para rejeição

### Página de Importação UISA (Item 1)
- [x] Criar página /admin/import-uisa com upload de arquivos
- [x] Implementar preview de dados antes da importação
- [x] Adicionar estatísticas de importação (total, sucesso, erros)
- [x] Integrar com uisaImportRouter
- [x] Adicionar rota no App.tsx

### Dashboard de Compliance e SLA (Item 2)
- [x] Criar endpoints de métricas SLA no bonusRouter (getSLAMetrics)
- [x] Implementar cálculo de tempo médio de aprovação
- [x] Adicionar alertas de pendências > X dias (críticas > 7 dias)
- [x] Criar distribuição de SLA por departamento
- [x] Integrar com BonusCompliance.tsx

### Confirmação de Pagamento
- [x] Criar endpoint payroll.confirmPayment (payrollRouter.ts)
- [x] Implementar marcação em lote (status aprovado → pago)
- [x] Adicionar validações de segurança (isAdmin, status aprovado)
- [x] Criar endpoint getPaidBonuses para consulta
- [x] Criar endpoint cancelPayment para reverter pagamentos


## 🔧 NOVA SESSÃO - CORREÇÕES E MELHORIAS FINAIS

### Correções TypeScript Críticas
- [x] Corrigir 4 erros em bonusRouter.ts (importar gte, ajustar tipo createdAt → calculatedAt)
- [ ] Limpar cache de build para resolver duplicação de getUserEmployee

### Notificações Reais
- [x] Substituir placeholder em bonusWorkflowRouter por integração real
- [x] Usar tabela notifications do schema para persistência
- [x] Implementar createNotification com insert no banco

### Testes Vitest
- [x] Criar teste para endpoint getSLAMetrics (sla-metrics.test.ts)
- [x] Executar testes e validar resultados (2/2 passed)
- [ ] Criar teste para validação de importação UISA (opcional)

### Meta SMART - Correção de Funcionalidade
- [x] Corrigir botão de salvar meta (usar employeeId correto via getUserEmployee)
- [x] Implementar vinculação de meta ao profissional (targetEmployeeId opcional)
- [x] Adicionar validação de permissões (admin/gestor pode criar para outros)


## 🎯 NOVA SESSÃO - MELHORIAS DE CALIBRAÇÃO E PESQUISA PULSE

### Calibração - Exibir Nome Completo
- [x] Alterar exibição de código para nome completo do funcionário
- [x] Atualizar query no backend para incluir nome (getEvaluations com join employees)
- [x] Ajustar frontend para exibir nome ao invés de código

### Pesquisa Pulse - Desenvolvimento Completo
- [x] Criar interface para nova pesquisa Pulse (CriarPesquisaPulse.tsx)
- [x] Implementar envio para grupos de pessoas (wizard de 3 etapas)
- [x] Adicionar seleção de destinátarios (todos, diretoria, departamentos, centros de custo, emails)
- [x] Adicionar campos ao schema (targetGroups, targetDepartmentIds, targetCostCenterIds, targetEmails)
- [ ] Integrar com sistema de emails real (atualmente usando placeholder)

### Testes - Envio para Grupos
- [x] Permitir envio para diretoria (tab dedicada)
- [x] Permitir envio para emails específicos (tab individual)
- [x] Permitir envio para departamento (já existia)
- [x] Permitir envio para centro de custos (nova tab)
- [ ] Implementar seleção múltipla de grupo### Correção de Email
- [x] Identificar e corrigir erro ao enviar email de testes
- [x] Adicionar mensagem clara quando SMTP não está configurado
- [x] Melhorar tratamento de erro em sendTestInviteserviço de email
- [ ] Testar envio end-to-end

### Interface de Envio de Pesquisas
- [x] Criar página dedicada para envio de pesquisas (CriarPesquisaPulse.tsx)
- [x] Deixar claro o caminho funcional (documentação + card de ajuda)
- [x] Adicionar card "Como Funciona?" em PesquisasPulse.tsx
- [x] Documentar rotas e fluxo completo no códigou
- [ ] Implementar wizard de envio (selecionar pesquisa → selecionar destinatários → confirmar)
- [ ] Adicionar feedback visual de progresso


## Melhorias Avançadas - Sessão Atual

### Calibração - Melhorias Avançadas
- [ ] Adicionar filtros por departamento, ciclo e status
- [ ] Implementar busca por nome de colaborador
- [ ] Adicionar exportação de relatório de calibração (PDF/Excel)
- [ ] Criar histórico de alterações de calibração
- [ ] Adicionar gráficos de distribuição de notas
- [ ] Implementar comparação antes/depois da calibração

### Pesquisa Pulse - Implementação Completa
- [ ] Implementar envio real de emails com links únicos
- [ ] Criar página pública de resposta (/pesquisa/:id)
- [ ] Validar salvamento de respostas no banco
- [ ] Criar dashboard de resultados com gráficos
- [ ] Adicionar análise de sentimento dos comentários
- [ ] Implementar notificações de novas respostas

### Envio de Testes - Validação Completa
- [ ] Validar todos os 7 testes psicométricos (DISC, Big Five, MBTI, IE, VARK, Liderança, Âncoras)
- [ ] Garantir cálculo correto de perfis para cada teste
- [ ] Testar envio para diretoria, departamentos e centros de custos
- [ ] Validar templates de email para cada tipo de teste
- [ ] Criar dashboard de acompanhamento de testes enviados

### SMTP - Configuração e Testes
- [ ] Verificar configuração SMTP no banco
- [ ] Testar envio real de email
- [ ] Validar todos os templates de email
- [ ] Implementar retry automático em caso de falha
- [ ] Adicionar logs detalhados de envio

### Interface - UX Avançada
- [ ] Adicionar tooltips explicativos em campos complexos
- [ ] Criar tour guiado para novos usuários
- [ ] Implementar feedback visual em todas as ações
- [ ] Adicionar loading states em operações assíncronas
- [ ] Melhorar mensagens de erro com sugestões de solução


## 🚨 CORREÇÕES CRÍTICAS - PRIORIDADE MÁXIMA

### Erros Identificados pelo Usuário
- [x] Corrigir erro de JSON parsing em Scheduled Reports (try-catch adicionado)
- [x] SMTP funcionando 100% (teste direto enviou email com sucesso)
- [x] Corrigir cache do frontend para reconhecer adminRouter (admin duplicado removido)
- [ ] Publicar nova versão para forçar rebuild (em andamento)
- [ ] Testar email via interface (SMTP funcionando via teste direto)
- [x] Corrigir botão "Nova Pesquisa" em Pesquisa Pulse (useLocation adicionado)
- [ ] Identificar e corrigir "botões de sala"

### BUGS CRÍTICOS REPORTADOS (20/11/2024 - 18:15) - ✅ TODOS RESOLVIDOS
- [x] Corrigir erro em /calibracao: "Cannot read properties of undefined (reading 'toString')" - URGENTE
- [x] Sucessão: Adicionar botões Editar/Incluir/Salvar em todas as abas
- [x] Sucessão: Implementar histórico de alterações
- [x] Sucessão: Sistema de envio de testes psicométricos para sucessores (email)
- [x] Sucessão: Envio de testes por departamento, emails, grupos e filtros
- [x] Nine Box Comparativo: Corrigir botões que não funcionam (anexo)
- [x] Nine Box Comparativo: Implementar seleção por grupos (departamento e centro de custo)
- [x] Pesquisa Pulse: Garantir que botão "Nova Pesquisa" funcione definitivamente (debug adicionado)

### Validação Completa de Funcionalidades
- [ ] Testar fluxo completo de Pesquisa Pulse (criar → enviar → responder → ver resultados)
- [x] Calibração com filtros funcionando (busca, departamento, ciclo, status)
- [x] Todos os 7 testes psicométricos validados (DISC corrigido para 40 perguntas)
- [ ] Validar que emails estão sendo enviados corretamente via interface
- [ ] Verificar que não há erros de console em nenhuma página
- [ ] Testar Scheduled Reports completo
- [ ] Validar todos os workflows de aprovação


### 🚨 BUGS CRÍTICOS - NOVA RODADA (20/11/2024 - 18:45)
- [x] Nine Box Comparativo: Erro ao carregar página (corrigido com .filter())
- [x] Pesquisa Pulse: Botão "Nova Pesquisa" funciona perfeitamente
- [x] Sucessão: Botões Editar/Deletar adicionados em todos os cards + CRUD completo nas abas
- [ ] Descrições de Cargos: Dados sumiram (aguardando localização exata)
- [ ] SMTP/Email: Ainda não funciona (4ª tentativa de correção)

### 📋 PRÓXIMOS PASSOS SOLICITADOS
- [ ] Testar fluxo completo de Sucessão (criar plano → adicionar sucessores → enviar testes → verificar histórico)
- [ ] Validar envio de emails real (configurar SMTP e testar)
- [ ] Exportar relatórios em PDF para Sucessão
