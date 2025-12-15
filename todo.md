# Sistema AVD UISA - Restauração Completa

## MÓDULOS QUE PRECISAM SER RESTAURADOS (PRIORIDADE MÁXIMA)

### 1. Módulo INÍCIO (Dashboard Principal)
- [ ] Criar página Início com cards de resumo
- [ ] Exibir Metas Ativas
- [ ] Exibir Avaliações do ciclo atual
- [ ] Exibir PDI Ativos (Plano de Desenvolvimento Individual)
- [ ] Exibir Ciclo Atual
- [ ] Seção "Metas em Andamento"
- [ ] Seção "Plano de Desenvolvimento"

### 2. Módulo METAS
- [ ] Schema: tabela de metas (goals)
- [ ] Schema: tabela de progresso de metas (goalProgress)
- [ ] Router tRPC para metas (CRUD completo)
- [ ] Página de listagem de metas
- [ ] Formulário de criação/edição de meta
- [ ] Página de detalhes da meta com progresso
- [ ] Sistema de acompanhamento de progresso
- [ ] Indicadores visuais de status (em andamento, concluída, atrasada)

### 3. Módulo DESENVOLVIMENTO (PDI - Plano de Desenvolvimento Individual)
- [ ] Schema: tabela de PDI (developmentPlans)
- [ ] Schema: tabela de ações de desenvolvimento (developmentActions)
- [ ] Router tRPC para PDI (CRUD completo)
- [ ] Página de listagem de PDIs
- [ ] Formulário de criação/edição de PDI
- [ ] Página de detalhes do PDI
- [ ] Sistema de acompanhamento de ações
- [ ] Integração com avaliações

### 4. Módulo SUCESSÃO
- [ ] Schema: tabela de planos de sucessão (successionPlans)
- [ ] Schema: tabela de candidatos à sucessão (successionCandidates)
- [ ] Schema: tabela de avaliação de prontidão (readinessAssessments)
- [ ] Router tRPC para sucessão (CRUD completo)
- [ ] Página de listagem de planos de sucessão
- [ ] Formulário de criação/edição de plano de sucessão
- [ ] Página de detalhes do plano com candidatos
- [ ] Sistema de avaliação de prontidão
- [ ] Matriz 9-box para identificação de talentos

### 5. Módulo PESSOAS (Gestão de Funcionários)
- [ ] Schema: expandir tabela users com campos adicionais (departamento, cargo, gestor, data admissão, etc)
- [ ] Schema: tabela de histórico de cargos (positionHistory)
- [ ] Schema: tabela de estrutura organizacional (orgStructure)
- [ ] Router tRPC para gestão de pessoas (CRUD completo)
- [ ] Página de listagem de funcionários
- [ ] Formulário de criação/edição de funcionário
- [ ] Página de perfil do funcionário
- [ ] Visualização de organograma
- [ ] Histórico de cargos e movimentações

### 6. Módulo TEMPO (Gestão de Ponto/Horas)
- [ ] Schema: tabela de registros de ponto (timeRecords)
- [ ] Schema: tabela de solicitações de ajuste (timeAdjustments)
- [ ] Schema: tabela de banco de horas (timeBank)
- [ ] Router tRPC para gestão de tempo (CRUD completo)
- [ ] Página de registro de ponto
- [ ] Página de visualização de histórico
- [ ] Página de solicitações de ajuste
- [ ] Dashboard de banco de horas
- [ ] Relatórios de frequência

### 7. Módulo PENDÊNCIAS
- [ ] Schema: tabela de pendências (pendencies)
- [ ] Schema: tipos de pendência (avaliação, aprovação, documento, etc)
- [ ] Router tRPC para pendências
- [ ] Página de listagem de pendências
- [ ] Filtros por tipo e prioridade
- [ ] Notificações de pendências
- [ ] Dashboard de pendências por usuário

### 8. Módulo APROVAÇÕES
- [ ] Schema: tabela unificada de aprovações (approvals)
- [ ] Schema: workflow de aprovação (approvalWorkflows)
- [ ] Router tRPC para aprovações
- [ ] Página de listagem de aprovações pendentes
- [ ] Interface de aprovação/rejeição com comentários
- [ ] Histórico de aprovações realizadas
- [ ] Dashboard de aprovações por tipo

### 9. Módulo BÔNUS
- [ ] Schema: tabela de programas de bônus (bonusPrograms)
- [ ] Schema: tabela de elegibilidade (bonusEligibility)
- [ ] Schema: tabela de cálculos de bônus (bonusCalculations)
- [ ] Router tRPC para bônus (CRUD completo)
- [ ] Página de listagem de programas de bônus
- [ ] Formulário de criação/edição de programa
- [ ] Página de cálculo de bônus
- [ ] Dashboard de bônus por funcionário
- [ ] Relatórios de bônus pagos

### 10. Módulo ANALYTICS
- [ ] Schema: tabela de métricas agregadas (analyticsMetrics)
- [ ] Router tRPC para analytics com queries otimizadas
- [ ] Página de Analytics com múltiplos dashboards
- [ ] Gráficos de desempenho organizacional
- [ ] Gráficos de turnover e retenção
- [ ] Gráficos de evolução de competências
- [ ] Gráficos de distribuição de bônus
- [ ] Exportação de dados para análise

### 11. Módulo ADMINISTRAÇÃO (com submenu)
- [ ] Submenu: Usuários
- [ ] Submenu: Configurações do Sistema
- [ ] Submenu: Ciclos de Avaliação
- [ ] Submenu: Tipos de Meta
- [ ] Submenu: Competências
- [ ] Submenu: Cargos e Níveis
- [ ] Submenu: Departamentos
- [ ] Submenu: Logs do Sistema
- [ ] Página de gestão de usuários (admin)
- [ ] Página de configurações gerais
- [ ] Página de gestão de ciclos
- [ ] Página de gestão de competências
- [ ] Página de gestão de estrutura organizacional

## INTEGRAÇÕES E MELHORIAS

### 12. Menu Lateral Completo
- [ ] Atualizar DashboardLayout com todos os 13 módulos
- [ ] Implementar submenus expansíveis (Administração)
- [ ] Adicionar ícones apropriados para cada módulo
- [ ] Implementar indicadores de pendências (badges com contadores)
- [ ] Destacar módulo ativo

### 13. Rotas Completas
- [ ] Registrar todas as rotas em App.tsx
- [ ] Implementar proteção de rotas por permissão
- [ ] Implementar rotas de administração (admin only)

### 14. Integrações Entre Módulos
- [ ] Integrar Metas com Avaliações
- [ ] Integrar Desenvolvimento com Avaliações
- [ ] Integrar Sucessão com Pessoas
- [ ] Integrar Bônus com Avaliações e Metas
- [ ] Integrar Pendências com todos os módulos
- [ ] Integrar Aprovações com PIR, Descrições de Cargo, Tempo, etc

### 15. Notificações Automáticas Expandidas
- [ ] Notificações de novas pendências
- [ ] Notificações de aprovações necessárias
- [ ] Notificações de metas próximas do prazo
- [ ] Notificações de PDI em atraso
- [ ] Notificações de sucessão (avaliações de prontidão)

### 16. Relatórios Expandidos
- [ ] Relatório de Metas por Departamento
- [ ] Relatório de Desenvolvimento Individual
- [ ] Relatório de Sucessão e Talentos
- [ ] Relatório de Frequência e Ponto
- [ ] Relatório de Bônus Pagos
- [ ] Relatório de Aprovações Realizadas

## MÓDULOS JÁ IMPLEMENTADOS (Manter)

### ✅ Templates de Avaliação
- [x] Schema completo
- [x] Router tRPC
- [x] Páginas de listagem e formulários

### ✅ Avaliações
- [x] Schema completo
- [x] Router tRPC
- [x] Páginas de listagem e formulários

### ✅ PIR (Plano Individual de Resultados)
- [x] Schema completo
- [x] Router tRPC
- [x] Páginas de listagem, formulários e detalhes
- [x] Workflow de aprovação

### ✅ Descrições de Cargo
- [x] Schema completo
- [x] Router tRPC
- [x] Páginas de listagem, formulários e detalhes
- [x] Workflow de aprovação

### ✅ Notificações
- [x] Schema completo
- [x] Router tRPC
- [x] Página de configurações
- [x] Cron jobs automáticos

### ✅ Relatórios
- [x] Schema básico
- [x] Router tRPC
- [x] Página de relatórios
- [x] Gráficos Chart.js

## ORDEM DE IMPLEMENTAÇÃO

### Fase 1: Schema e Database (ATUAL)
1. Criar todas as tabelas no schema.ts
2. Executar pnpm db:push

### Fase 2: Backend (Routers tRPC)
1. Criar helpers em db.ts
2. Criar routers para cada módulo

### Fase 3: Frontend (Páginas e Componentes)
1. Criar páginas para cada módulo
2. Criar formulários
3. Criar componentes reutilizáveis

### Fase 4: Integração
1. Atualizar menu lateral
2. Registrar rotas
3. Integrar módulos

### Fase 5: Testes e Validação
1. Testar todos os fluxos
2. Corrigir bugs
3. Criar checkpoint final
