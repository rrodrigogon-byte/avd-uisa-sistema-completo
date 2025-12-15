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
- [ ] Criar página de criação/edição de avaliação (EvaluationForm.tsx)
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
- [ ] Formulário de criação/edição de PIR
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


## 🎯 NOVA FUNCIONALIDADE: PIR Integridade Completo (15/12/2025)
- [ ] Analisar sistema PIR atual e metodologia
- [ ] Pesquisar melhores práticas de avaliação PIR
- [ ] Criar plano detalhado de implementação com todas as funcionalidades
- [ ] Apresentar plano para aprovação do usuário
- [ ] Implementar backend (schema, procedures, cálculos)
- [ ] Implementar frontend (interface, visualizações, relatórios)
- [ ] Criar testes automatizados
- [ ] Validar com dados reais


## 🔧 CORREÇÕES URGENTES: Funcionários e Hierarquias (15/12/2025)
- [x] Analisar schema atual de employees e identificar problemas
- [x] Corrigir relacionamento supervisor/subordinado no schema
- [x] Adicionar campos obrigatórios faltantes (departamento, cargo, etc)
- [x] Implementar validação de hierarquia circular
- [x] Atualizar procedures tRPC para employees (create, update, list)
- [x] Corrigir formulário de cadastro de funcionários
- [x] Implementar listagem de funcionários com hierarquia
- [x] Criar visualização de organograma hierárquico
- [ ] Adicionar filtros por departamento/cargo
- [x] Testar relacionamentos hierárquicos e integridade dos dados
- [x] Popular dados de teste com script de seed
- [x] Validar estrutura hierárquica completa
