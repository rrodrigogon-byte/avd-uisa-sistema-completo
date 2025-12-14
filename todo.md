# Sistema AVD UISA - Lista de Tarefas

## 1. Schema do Banco de Dados
- [x] Revisar e corrigir tabelas duplicadas (notifications vs notificationSettings)
- [x] Definir schema final para usuários e perfis
- [x] Criar tabela de avaliações (evaluations)
- [x] Criar tabela de templates de avaliação (evaluationTemplates)
- [x] Criar tabela de configurações de notificações (notificationSettings)
- [x] Criar tabela de histórico de notificações enviadas (notificationLogs)
- [x] Criar tabela de relatórios (reports)
- [x] Executar migrations com `pnpm db:push`

## 2. Backend - Routers tRPC

### 2.1 Router de Avaliações
- [x] Criar router `evaluation` em server/routers.ts
- [x] Implementar `evaluation.list` - listar avaliações do usuário
- [x] Implementar `evaluation.create` - criar nova avaliação
- [x] Implementar `evaluation.update` - atualizar avaliação
- [x] Implementar `evaluation.delete` - remover avaliação
- [x] Implementar `evaluation.getById` - buscar avaliação específica

### 2.2 Router de Templates
- [x] Criar router `template` em server/routers.ts
- [x] Implementar `template.list` - listar templates disponíveis
- [x] Implementar `template.create` - criar novo template (admin)
- [x] Implementar `template.update` - atualizar template (admin)
- [x] Implementar `template.delete` - remover template (admin)
- [x] Implementar `template.getById` - buscar template específico

### 2.3 Router de Notificações
- [x] Criar router `notification` em server/routers.ts
- [x] Implementar `notification.getSettings` - buscar configurações do usuário
- [x] Implementar `notification.updateSettings` - atualizar configurações
- [x] Implementar `notification.getLogs` - histórico de notificações enviadas
- [ ] Implementar lógica de envio automático de notificações (cron job)

### 2.4 Router de Relatórios
- [x] Criar router `report` em server/routers.ts
- [x] Implementar `report.generate` - gerar relatório gerencial
- [x] Implementar `report.list` - listar relatórios salvos
- [x] Implementar `report.delete` - deletar relatório
- [x] Implementar `report.getById` - buscar relatório específico

### 2.5 Helpers do Banco de Dados
- [x] Adicionar funções em server/db.ts para avaliações
- [x] Adicionar funções em server/db.ts para templates
- [x] Adicionar funções em server/db.ts para notificações
- [x] Adicionar funções em server/db.ts para relatórios

## 3. Frontend - Interface do Usuário

### 3.1 Layout e Navegação
- [x] Configurar layout com navegação
- [x] Definir rotas principais em App.tsx
- [x] Criar página inicial (Home/Dashboard)
- [x] Configurar tema e paleta de cores em index.css

### 3.2 Páginas de Avaliações
- [x] Criar página de listagem de avaliações (Evaluations.tsx)
- [x] Criar página de criação/edição de avaliação (EvaluationForm.tsx) (NOVA SOLICITAÇÃO)
- [ ] Criar página de visualização detalhada (EvaluationDetail.tsx)
- [ ] Implementar filtros e busca na listagem

### 3.3 Páginas de Templates
- [x] Criar página de listagem de templates (Templates.tsx)
- [ ] Criar página de criação/edição de template (TemplateForm.tsx) - admin
- [ ] Criar página de visualização de template (TemplateDetail.tsx)

### 3.4 Páginas de Notificações
- [x] Criar página de configurações de notificações (Notifications.tsx)
- [x] Criar página de histórico de notificações (integrado em Notifications.tsx)
- [ ] Implementar indicadores visuais de notificações pendentes

### 3.5 Páginas de Relatórios
- [x] Criar página de geração de relatórios (Reports.tsx)
- [ ] Criar página de visualização de relatório (ReportDetail.tsx)
- [ ] Implementar gráficos e visualizações de dados
- [ ] Implementar funcionalidade de exportação

### 3.6 Componentes Reutilizáveis
- [ ] Criar componente de formulário de avaliação
- [ ] Criar componente de card de avaliação
- [ ] Criar componente de seletor de template
- [ ] Criar componente de configuração de notificação
- [ ] Criar componentes de gráficos para relatórios

## 4. Funcionalidades Avançadas
- [ ] Implementar sistema de permissões (admin vs user)
- [ ] Implementar busca e filtros avançados
- [ ] Implementar paginação nas listagens
- [ ] Implementar validação de formulários com Zod
- [ ] Implementar feedback visual (toasts, loading states)
- [ ] Implementar estados vazios (empty states)

## 5. Testes e Qualidade
- [ ] Escrever testes vitest para procedures críticos
- [ ] Testar fluxo completo de avaliação
- [ ] Testar sistema de notificações
- [ ] Testar geração de relatórios
- [ ] Validar responsividade mobile

## 6. Documentação e Entrega
- [ ] Documentar estrutura do banco de dados
- [ ] Documentar APIs tRPC disponíveis
- [ ] Criar checkpoint final
- [ ] Preparar instruções de uso para o usuário

## 7. Formulários de Criação/Edição - NOVA FUNCIONALIDADE
- [x] Formulário completo de criação de template com validação
- [ ] Formulário completo de edição de template com validação
- [x] Formulário completo de criação de avaliação com validação
- [ ] Formulário completo de edição de avaliação com validação
- [x] Validação de campos obrigatórios em todos os formulários
- [x] Feedback visual de erros de validação

## 8. Visualizações de Dados com Chart.js - NOVA FUNCIONALIDADE
- [x] Integrar Chart.js no projeto
- [x] Gráfico de desempenho individual nos relatórios
- [x] Gráfico de evolução temporal de avaliações
- [ ] Gráfico de comparação entre equipes
- [x] Gráfico de distribuição de scores
- [x] Dashboard com múltiplos gráficos interativos

## 9. Sistema de Notificações Automáticas - NOVA FUNCIONALIDADE
- [x] Implementar cron job para lembretes de prazos de avaliação
- [x] Implementar cron job para notificação de novas avaliações
- [x] Implementar cron job para lembretes de PIR pendentes
- [x] Sistema de agendamento de notificações
- [x] Logs de notificações enviadas

## 10. PIR - Plano Individual de Resultados - NOVA FUNCIONALIDADE
- [x] Schema do banco de dados para PIR
- [x] Schema para metas e indicadores do PIR
- [x] Schema para acompanhamento de progresso
- [x] Router tRPC para PIR (CRUD completo)
- [x] Página de listagem de PIRs
- [x] Formulário de criação/edição de PIR (NOVA SOLICITAÇÃO)
- [ ] Página de visualização detalhada de PIR
- [ ] Sistema de acompanhamento de metas
- [ ] Integração PIR com avaliações de desempenho
- [ ] Relatórios de PIR com gráficos

## 11. Descrição de Cargo UISA - NOVA FUNCIONALIDADE
- [x] Schema do banco de dados para descrições de cargo
- [x] Schema para competências técnicas
- [x] Schema para competências comportamentais
- [x] Schema para requisitos e responsabilidades
- [x] Schema para histórico de alterações
- [x] Router tRPC para descrições de cargo (CRUD completo)
- [x] Página de listagem de descrições de cargo
- [ ] Formulário dinâmico de criação/edição de descrição de cargo
- [ ] Página de visualização detalhada de descrição de cargo
- [ ] Sistema de versionamento de descrições
- [ ] Vinculação de descrições de cargo com avaliações
- [ ] Comparação entre versões de descrições

## 12. Integridades e Processos - NOVA FUNCIONALIDADE
- [ ] Validação de integridade entre PIR e avaliações
- [ ] Validação de integridade entre descrição de cargo e avaliações
- [ ] Processo automático de criação de PIR baseado em avaliação
- [ ] Processo de atualização de descrição de cargo
- [ ] Workflow de aprovação de PIR
- [ ] Workflow de aprovação de descrição de cargo

## 13. Formulários de Edição - PRIORIDADE ALTA
- [x] Formulário de edição de Templates de Avaliação
- [x] Formulário de edição de Avaliações
- [x] Formulário de edição de PIR
- [x] Formulário de edição de Descrição de Cargo

## 14. Páginas de Detalhamento - PRIORIDADE ALTA
- [x] Página de detalhes do PIR com todas as metas e informações relacionadas
- [x] Página de detalhes da Descrição de Cargo com competências e requisitos completos

## 15. Formulário Dinâmico de Cargo - PRIORIDADE ALTA
- [x] Interface completa para adição dinâmica de responsabilidades
- [x] Interface para adição dinâmica de competências técnicas
- [x] Interface para adição dinâmica de competências comportamentais
- [x] Interface para adição dinâmica de requisitos (formação, experiência, certificações)
- [x] Validação completa do formulário de cargo
- [x] Preview em tempo real das informações adicionadas

## 16. Melhorias em Gráficos Chart.js
- [ ] Gráfico de comparação entre equipes
- [ ] Gráficos interativos com tooltips detalhados
- [ ] Exportação de gráficos como imagem

## 17. Processos e Integridades Completos
- [ ] Validação de integridade entre PIR e avaliações
- [ ] Validação de integridade entre descrição de cargo e avaliações
- [ ] Processo automático de criação de PIR baseado em avaliação
- [ ] Processo de atualização de descrição de cargo
- [ ] Workflow de aprovação de PIR
- [ ] Workflow de aprovação de descrição de cargo

## 18. Melhorias Fase 2 - Notificações Automáticas
- [x] Reativar e corrigir cron jobs existentes para executar a cada 6 horas
- [x] Implementar verificação de prazos de avaliação (7 dias antes)
- [x] Implementar verificação de prazos de PIR (7 dias antes)
- [x] Implementar cron job para relatório semanal de administradores
- [x] Interface de configuração de notificações já existe na página Notifications
- [ ] Testar envio automático de notificações com vitest

## 19. Melhorias Fase 2 - Gráficos Interativos
- [x] Instalar e configurar Chart.js e react-chartjs-2
- [x] Criar componente de gráfico de linha: Evolução de Desempenho ao longo do tempo
- [x] Criar componente de gráfico radar: Comparação de Competências (técnicas vs comportamentais)
- [x] Criar componente de gráfico de barras: Distribuição por Departamento com estatísticas
- [x] Criar procedimentos tRPC para obter dados dos gráficos (analytics router)
- [x] Implementar tooltips detalhados com informações de cada ponto
- [x] Estatísticas agregadas em cada gráfico (média, máximo, mínimo, gaps)
- [ ] Integrar gráficos na página de Relatórios
- [ ] Integrar gráficos na página de Dashboard
- [ ] Adicionar opções de exportação de gráficos (PNG/PDF)

## 20. Melhorias Fase 2 - Workflow de Aprovação
- [x] Adicionar campo de status ao schema de PIR (rascunho, em_analise, aprovado, rejeitado)
- [x] Adicionar campo de status ao schema de Descrição de Cargo
- [x] Adicionar campos de histórico de aprovação (aprovador, data, comentários)
- [x] Criar tabelas de histórico (pirApprovalHistory, jobDescriptionApprovalHistory)
- [x] Criar procedimentos tRPC para workflow de PIR:
  - [x] submitPirForApproval (rascunho → em_analise)
  - [x] approvePir (em_analise → aprovado)
  - [x] rejectPir (em_analise → rejeitado)
  - [x] reopenPir (rejeitado → rascunho)
- [x] Criar procedimentos tRPC para workflow de Descrição de Cargo:
  - [x] submitJobDescriptionForApproval (rascunho → em_analise)
  - [x] approveJobDescription (em_analise → aprovado)
  - [x] rejectJobDescription (em_analise → rejeitado)
  - [x] reopenJobDescription (rejeitado → rascunho)
  - [x] archiveJobDescription (aprovado → arquivado)
- [x] Registrar todas as ações no histórico de aprovações
- [x] Implementar notificações automáticas de mudança de status
- [x] Procedimento getApprovalHistory para visualização do histórico
- [ ] Implementar interface de aprovação para gestores na UI
- [ ] Adicionar visualização de histórico de aprovações na UI
- [ ] Adicionar badges de status visual nas listagens
- [ ] Adicionar filtros por status nas listagens
- [ ] Criar testes vitest para workflows de aprovação

## 21. Integração Completa de Gráficos - PRIORIDADE ALTA
- [x] Integrar todos os gráficos Chart.js na página Dashboard
- [x] Integrar todos os gráficos Chart.js na página Relatórios
- [ ] Adicionar seletor de período para filtrar dados dos gráficos
- [x] Implementar loading states nos gráficos
- [x] Adicionar empty states quando não houver dados

## 22. UI de Aprovação Completa - PRIORIDADE ALTA
- [x] Criar componente StatusBadge reutilizável com cores por status
- [x] Adicionar botões de Aprovar/Rejeitar nas páginas de PIR
- [x] Adicionar botões de Aprovar/Rejeitar nas páginas de Descrição de Cargo (NOVA SOLICITAÇÃO)
- [x] Implementar modal de confirmação para aprovações
- [x] Implementar modal com campo de comentário para rejeições
- [x] Adicionar visualização de histórico de aprovações nas páginas de detalhes
- [x] Atualizar listagens com badges de status

## 23. Sistema de Filtros por Status - PRIORIDADE ALTA
- [x] Criar componente FilterBar reutilizável
- [x] Adicionar filtro por status na listagem de PIR
- [ ] Adicionar filtro por status na listagem de Descrição de Cargo
- [x] Adicionar filtro por departamento nas listagens (NOVA SOLICITAÇÃO)
- [x] Adicionar filtro por período nas listagens (NOVA SOLICITAÇÃO)
- [ ] Implementar persistência de filtros na URL
- [x] Adicionar contador de resultados filtrados

## 24. Correções de Erros e UX - PRIORIDADE ALTA
- [ ] Corrigir navegação entre páginas (verificar todas as rotas)
- [ ] Corrigir tipos TypeScript em todos os componentes
- [ ] Melhorar feedback visual de loading em todas as páginas
- [ ] Adicionar tratamento de erros em todos os formulários
- [ ] Corrigir responsividade em dispositivos mobile
- [ ] Adicionar validações completas em todos os formulários
- [ ] Implementar debouncing em campos de busca
- [ ] Adicionar confirmação antes de ações destrutivas (delete)

## 25. CORREÇÕES CRÍTICAS - FASE 1 (URGENTE)
- [x] Corrigir 57 erros TypeScript em comparações de enum do Drizzle ORM (TODOS CORRIGIDOS!)
- [ ] Adicionar foreign keys explícitas no schema do banco de dados
- [ ] Criar página JobDescriptionForm.tsx completa
- [ ] Registrar rota de JobDescriptionForm em App.tsx

## 26. PÁGINAS DE DETALHES - FASE 2 (ALTA PRIORIDADE)
- [ ] Criar EvaluationDetail.tsx com visualização completa
- [ ] Criar TemplateDetail.tsx com estrutura do template
- [ ] Criar ReportDetail.tsx com dados do relatório
- [ ] Adicionar navegação para detalhes em todas as listagens

## 27. MELHORIAS DE UX - FASE 3 (MÉDIA PRIORIDADE)
- [ ] Adicionar filtros completos na listagem de Descrições de Cargo
- [ ] Adicionar filtros na listagem de Avaliações
- [ ] Adicionar filtros na listagem de Templates
- [ ] Implementar confirmação antes de deletar em todas as páginas
- [ ] Adicionar debouncing em todos os campos de busca
- [ ] Padronizar loading states em todas as páginas
- [ ] Padronizar empty states em todas as listagens

## 28. INTEGRAÇÃO DE GRÁFICOS - FASE 4 (MÉDIA PRIORIDADE)
- [ ] Integrar todos os gráficos Chart.js no Dashboard principal
- [ ] Integrar gráficos na página de Relatórios
- [ ] Adicionar seletor de período para filtrar dados dos gráficos
- [ ] Implementar exportação de gráficos como PNG

## 29. TESTES COMPLETOS - FASE 5 (BAIXA PRIORIDADE)
- [ ] Escrever testes vitest para analytics router
- [ ] Escrever testes para notificações automáticas (cron jobs)
- [ ] Escrever testes de integração frontend-backend
- [ ] Validar todos os workflows de aprovação com testes

## 30. PROCESSOS AVANÇADOS - FASE 6 (FUTURO)
- [ ] Implementar criação automática de PIR baseado em avaliação
- [ ] Implementar validações de integridade entre PIR e avaliações
- [ ] Implementar versionamento de descrições de cargo
- [ ] Implementar comparação entre versões de descrições
- [ ] Implementar vinculação de descrições de cargo com avaliações

## 31. ERRO CRÍTICO - CORREÇÃO IMEDIATA
- [x] Corrigir erro "Cannot read properties of undefined (reading 'length')" nos gráficos
- [x] Adicionar verificações de undefined antes de acessar propriedades de dados
- [x] Adicionar Array.isArray() em Dashboard e Reports

## 32. MENU COMPLETO - CORREÇÃO IMEDIATA
- [x] Verificar se todos os 7 módulos estão visíveis no menu lateral
- [x] Garantir que todas as rotas estão registradas em App.tsx
- [x] Adicionar DashboardLayout à página Home para menu consistente


## 33. CORREÇÕES INCREMENTAIS - SEGURAS
- [x] Verificar quais páginas usam DashboardLayout
- [x] Adicionar DashboardLayout a Dashboard, Templates, Evaluations, PIR, JobDescriptions, Notifications, Reports
- [x] Testar cada página após adicionar DashboardLayout
- [x] Corrigir verificações de undefined nos gráficos (Dashboard e Reports) - Já estava correto
- [x] Array.isArray() já implementado antes de .length
- [x] Criar testes vitest para validação do sistema
