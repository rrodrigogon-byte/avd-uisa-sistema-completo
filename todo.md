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
