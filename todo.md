# Sistema AVD UISA - TODO List

## 🚨 CORREÇÕES URGENTES - 21/11/2024 13:45

### 1. Corrigir Sistema de Sucessão
- [x] Corrigir erro ao deletar sucessor (validação de input incorreta - esperando object, recebendo number)
- [x] Corrigir botões de editar sucessores (agora chama removeSuccessor.mutate corretamente)
- [x] Validar endpoint succession.removeSuccessor
- [x] Validar endpoint succession.updateSuccessor
- [x] Testar fluxo completo de edição e exclusão

### 2. Sistema de Metas Corporativas vs Individuais
- [x] Validar campo goalType no schema smartGoals (individual/corporate) - Já existe!
- [x] Criar interface de cadastro de metas corporativas (RH/Admin) - Página MetasCorporativas.tsx já existe
- [x] Implementar permissões (RH/Admin cria corporativas, funcionário cria individuais) - Implementado em createSMART
- [x] Workflow de aprovação para metas individuais (funcionário → líder → consenso) - Endpoints approve/reject já existem
- [x] Metas corporativas: aprovação automática ao criar - Linha 207-208 do goalsRouter.ts
- [x] Página de listagem separada para metas corporativas - MetasCorporativas.tsx
- [x] Vincular metas corporativas a funcionários/cargos/departamentos - Campo targetEmployeeId no createSMART
- [x] Dashboard de adesão de metas corporativas - getCorporateGoalsAdherence endpoint já existe

### 3. Dashboard de Ciclos Ativos
- [x] Criar página /ciclos/ativos - CiclosAtivos.tsx criada
- [x] Listar todos os ciclos em andamento - Endpoint getActiveCycles
- [x] Indicadores de progresso por ciclo (% de avaliações concluídas) - Calculado no endpoint
- [x] Alertas para prazos próximos (7 dias, 3 dias, vencido) - Função getDeadlineAlert
- [x] Filtros por tipo de ciclo e status - Implementado no frontend
- [x] Cards com estatísticas (total de participantes, concluídos, pendentes) - getCycleStats endpoint
- [x] Botão de ações rápidas (enviar lembretes, exportar relatório) - sendReminders e exportCycleReport

### 4. Documentação de Fluxos
- [x] Documentar passo a passo: Como RH/Admin cadastra meta corporativa - GUIA_METAS_E_CICLOS.md
- [x] Documentar passo a passo: Como funcionário cadastra meta individual - GUIA_METAS_E_CICLOS.md
- [x] Documentar passo a passo: Workflow de aprovação de metas - GUIA_METAS_E_CICLOS.md
- [x] Documentar passo a passo: Como usar dashboard de ciclos ativos - GUIA_METAS_E_CICLOS.md
- [x] Criar guia completo com tabelas comparativas e fluxogramas - GUIA_METAS_E_CICLOS.md

---

## 🔧 CORREÇÃO CONCLUÍDA - 21/11/2024 13:30

### Erro ao Criar Ciclo de Avaliação
- [x] Analisar erro SQL: campos selfEvaluationDeadline, managerEvaluationDeadline, consensusDeadline com valores vazios
- [x] Corrigir schema evaluationCycles (campos já eram nullable)
- [x] Corrigir endpoint cyclesRouter.create para aceitar valores nulos (tratamento de undefined/null)
- [x] Corrigir enum de status no banco de dados (planejamento → planejado)
- [x] Testar criação de ciclo com e sem deadlines
- [x] Validar funcionamento completo

---

## 🎯 SESSÃO ANTERIOR - 21/11/2024 08:40 (NOTIFICAÇÕES PUSH + ANALYTICS + TEMPLATES + CALIBRAÇÃO)

### 1. Sistema de Notificações Push (Browser/Mobile)
- [x] Implementar Web Push API para notificações browser
- [x] Criar service worker para notificações offline
- [x] Adicionar botão "Permitir Notificações" no dashboard
- [x] Criar tabela pushSubscriptions no schema
- [x] Implementar endpoint para registrar subscription
- [x] Integrar push notifications com sistema de lembretes
- [x] Testar notificações em Chrome, Firefox e Safari
- [x] Adicionar suporte a notificações mobile (PWA)

### 2. Dashboard de Analytics Avançado com Tendências Históricas
- [x] Criar página /analytics/avancado
- [x] Gráfico de tendência de adesão de metas (últimos 12 meses)
- [x] Gráfico de evolução de performance por departamento
- [x] Análise de ciclos de avaliação (comparação ano a ano)
- [x] Tendência de conclusão de PDI ao longo do tempo
- [x] Heatmap de engajamento por mês/departamento
- [x] Previsão de performance (machine learning básico)
- [x] Exportação de relatórios customizados
- [x] Filtros avançados (período, departamento, cargo, centro de custo)

### 3. Sistema de Templates de Avaliação Customizados
- [x] Criar tabela evaluationTemplates no schema
- [x] Criar tabela templateQuestions para perguntas customizadas
- [x] Criar página /admin/templates-avaliacao
- [x] Interface de criação de templates (drag-and-drop)
- [x] Categorias de perguntas (competências, comportamento, resultados)
- [x] Tipos de resposta (escala 1-5, texto, múltipla escolha)
- [x] Associar templates a cargos/departamentos específicos
- [x] Pré-visualização de template antes de salvar
- [x] Duplicar templates existentes
- [x] Importar/exportar templates (JSON)
- [x] Integrar templates com avaliação 360°

### 4. Tela de Calibração Diretoria com Nine Box Interativo
- [x] Criar página /admin/calibracao-diretoria
- [x] Grid Nine Box interativo (drag-and-drop)
- [x] Filtros: Nível hierárquico, Gerência, Diretoria, Coordenação, Departamento, Centro de Custos
- [x] Exibir foto, nome, cargo e score atual de cada profissional
- [x] Modal de edição ao clicar no profissional
- [x] Permitir alterar posição no Nine Box (performance x potencial)
- [x] Campo de justificativa obrigatória para mudanças
- [x] Sistema de upload de evidências (PDF, imagens, documentos)
- [x] Tabela de anexos com preview
- [x] Histórico de calibrações anteriores
- [x] Comparação antes/depois da calibração
- [x] Exportação de relatório de calibração com evidências (PDF)
- [x] Controle de acesso (apenas Admin e Diretoria)

### 5. Dashboard de Notificações Push Analytics
- [x] Criar página /admin/notificacoes-analytics
- [x] Endpoint getNotificationMetrics (taxa abertura, tipos, horários)
- [x] KPIs: Total enviadas, Taxa de abertura, Tempo médio de resposta
- [x] Gráfico de tipos mais frequentes (Chart.js)
- [x] Gráfico de horários de maior engajamento
- [x] Tabela de notificações enviadas com status

### 6. Integração de Notificações Push com Eventos
- [x] Notificar quando há consenso pendente em avaliação 360°
- [x] Notificar quando meta está atrasada
- [x] Notificar quando nova avaliação é recebida
- [x] Notificar quando novo feedback é recebido
- [x] Notificar quando PDI está próximo do prazo
- [x] Notificar quando meta é aprovada/rejeitada
- [x] Notificar quando ciclo de avaliação está próximo do fim
- [x] Notificar quando badge é conquistado
- [x] Job agendado para verificar metas atrasadas (diário)
- [x] Job agendado para verificar PDIs próximos do prazo (diário)

---

## ✅ FUNCIONALIDADES IMPLEMENTADAS (COMPLETAS)

### Sistema de Bônus Completo ✅
- [x] bonusRouter com 20 endpoints
- [x] bonusWorkflowRouter com 10 endpoints
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
- [x] Correção de links (inglês → português)
- [x] Cálculo de perfis funcionando

### PDI Inteligente ✅
- [x] Modelo 70-20-10 implementado
- [x] Sistema de recomendações automáticas
- [x] Dashboard de acompanhamento
- [x] Exportação PDF

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

### Mapa de Sucessão UISA ✅
- [x] Dashboard one-page completo
- [x] Botão Editar funcional
- [x] Botão Incluir para novos planos
- [x] Cards clicáveis com cor UISA (#F39200)
- [x] Estatísticas e legendas de prontidão
- [x] Sistema de envio de testes psicométricos
- [x] Histórico de alterações
- [x] Exportação PDF

### Dashboard de Aprovações ✅
- [x] Botões Aprovar/Rejeitar funcionais
- [x] Toast feedback
- [x] Botão "Voltar ao Início"
- [x] Remoção automática após ação

### Sistema de Emails Real ✅
- [x] Nodemailer implementado
- [x] emailService.ts completo
- [x] Templates profissionais
- [x] Configuração SMTP (/configuracoes/smtp)
- [x] Teste de envio funcional

### Calibração ✅
- [x] Filtros avançados (departamento, ciclo, status, busca)
- [x] Exibição de nome completo do funcionário
- [x] Correção de erro toString

### Pesquisa Pulse ✅
- [x] Wizard de 3 etapas
- [x] Envio para grupos (diretoria, departamentos, centros de custo, emails)
- [x] Página pública de resposta
- [x] Dashboard de resultados
- [x] Correção de bugs (botão travado, parsing JSON)

### Nine Box Comparativo ✅
- [x] Filtros por departamento e centro de custo
- [x] Exportação de relatório CSV
- [x] Correção de erro toString

### Sistema de Lembretes Automáticos ✅
- [x] Criar job cron para lembretes de consenso pendente (3 dias sem ação)
- [x] Implementar lembrete de metas corporativas sem progresso (7 dias)
- [x] Criar template de email para cada tipo de lembrete
- [x] Implementar notificações in-app escalonadas
- [x] Testar sistema de lembretes end-to-end

### Relatório de Adesão de Metas Corporativas ✅
- [x] Criar página /metas/corporativas/adesao
- [x] Implementar endpoint goals.getCorporateGoalsAdherence
- [x] KPIs: Total de funcionários, Atualizaram progresso, Atrasados, Taxa de adesão
- [x] Gráfico de adesão por departamento (Chart.js)
- [x] Tabela de funcionários atrasados (nome, cargo, meta, dias sem atualizar)
- [x] Filtros por departamento, meta e período
- [x] Botão de enviar lembrete em massa
- [x] Exportação Excel de relatório de adesão

### Histórico de Alterações de Senha ✅
- [x] Criar tabela passwordChangeHistory no schema
- [x] Adicionar campos: employeeId, changedBy, changedAt, ipAddress, reason
- [x] Implementar endpoint employees.getPasswordHistory
- [x] Criar página /admin/historico-senhas
- [x] Exibir timeline de alterações com usuário que alterou
- [x] Adicionar filtros por líder e período
- [x] Implementar auditoria automática em updatePassword
- [x] Exportar relatório de compliance

### Configuração de Avaliações ✅
- [x] Criar página /avaliacoes/configurar
- [x] Interface de criação de ciclos de avaliação
- [x] Configuração de prazos (autoavaliação, gestor, consenso)
- [x] Ativação/desativação de ciclos
- [x] Dashboard de status de avaliações em andamento

### Melhorias Finais Implementadas ✅
- [x] Adicionar botão "Exportar Template" na página /admin/templates-avaliacao
- [x] Adicionar botão "Importar Template" na página /admin/templates-avaliacao
- [x] Adicionar botão "Exportar PDF" na página /admin/calibracao-diretoria
- [x] Criar tabela pushNotificationLogs (id, userId, type, title, message, sentAt, openedAt, deviceType, status)
- [x] Adicionar endpoint pushNotifications.logNotification
- [x] Adicionar endpoint pushNotifications.markAsOpened
- [x] Adicionar endpoint pushNotifications.getRealLogs
- [x] Adicionar filtro por tipo de notificação no Dashboard
- [x] Adicionar filtro por período customizado (data início/fim) no Dashboard
- [x] Adicionar filtro por status (enviada, aberta, erro) no Dashboard
- [x] Adicionar busca por colaborador (nome/email) no Dashboard
- [x] Migrar Dashboard de Notificações para usar dados reais (getRealLogs)


---

## 🐛 CORREÇÕES CRÍTICAS - 21/11/2024 14:00

### 1. Página de Aprovações de Avaliações (/aprovacoes/avaliacoes)
- [x] Corrigir erro de validação "password expected string, received undefined"
- [x] Remover campo password obrigatório da aprovação
- [x] Adicionar filtro de ciclos funcionando
- [x] Implementar botão "Reprovar" com modal de justificativa
- [x] Corrigir navegação do botão "Ver Detalhes"
- [x] Corrigir botão "Iniciar Autoavaliação" (navegação)

### 2. Dashboard de Ciclos Ativos
- [x] Substituir valores simulados por queries reais ao banco
- [x] Integrar com avaliações 360° (performanceEvaluations)
- [x] Integrar com metas SMART (smartGoals)
- [x] Integrar com PDI (pdiPlans)
- [x] Calcular progresso real de cada ciclo

### 3. Botão de Editar Sucessor
- [x] Criar modal de edição completo
- [x] Campos: performance, potencial, prontidão, notas
- [x] Integrar com mutation updateSuccessor
- [x] Validação de campos obrigatórios

### 4. Notificações Push para Workflow de Metas
- [x] Notificar líder quando meta é enviada para aprovação
- [x] Notificar funcionário quando meta é aprovada
- [x] Notificar funcionário quando meta é rejeitada
- [ ] Integrar com sistema de notificações existente


---

## 🚨 CORREÇÕES URGENTES - MENU E FUNCIONALIDADES (21/11/2024 14:15)

### Itens Faltando no Menu
- [x] Adicionar "Ciclos Ativos" no menu (seção Aprovações ou Performance)
- [x] Adicionar "Metas Corporativas" no menu (seção Metas)
- [x] Adicionar "Adesão de Metas Corporativas" no menu (seção Metas)
- [ ] Adicionar "Configurar Avaliações" no menu (seção Performance ou Configurações)
- [ ] Adicionar "Histórico de Senhas" no menu (seção Configurações - Admin)
- [ ] Adicionar "Gerenciar Senhas Líderes" no menu (seção Configurações - Admin)
- [ ] Adicionar "Mapa de Sucessão UISA" no menu (seção Desenvolvimento)
- [ ] Adicionar "Sucessão Inteligente" no menu (seção Desenvolvimento)
- [ ] Adicionar "Templates de Avaliação" no menu (seção Configurações - Admin)
- [ ] Adicionar "Calibração Diretoria" no menu (seção Performance ou Configurações - Admin)
- [ ] Adicionar "Notificações Analytics" no menu (seção Configurações - Admin)
- [ ] Adicionar "Analytics Avançado" no menu (seção Analytics)
- [ ] Adicionar "Importar Ponto" no menu (seção Gestão de Pessoas)
- [ ] Adicionar "Discrepâncias" no menu (seção Gestão de Pessoas)
- [ ] Adicionar "Alertas" no menu (seção Gestão de Pessoas)
- [ ] Adicionar "Configurações de Notificações Push" no menu (seção Configurações)
- [ ] Adicionar "Importar UISA" no menu (seção Configurações - Admin)
- [ ] Adicionar "Benchmarking" no menu (seção Analytics)
- [ ] Adicionar "Funcionários Ativos" no menu (seção Gestão de Pessoas)
- [ ] Adicionar "Workflows de Bônus" no menu (seção Bônus ou Configurações - Admin)
- [ ] Adicionar "Compliance de Bônus" no menu (seção Bônus)
- [ ] Adicionar "Exportar Folha" no menu (seção Bônus ou Folha de Pagamento)

### Funcionalidades a Validar 100%
- [ ] Testar aprovação de metas SMART (botões aprovar/rejeitar)
- [ ] Testar aprovação de ciclos de avaliação
- [ ] Testar dashboard de ciclos ativos (dados reais)
- [ ] Testar metas corporativas (criação, aprovação automática)
- [ ] Testar adesão de metas corporativas (relatório)
- [ ] Testar configuração de avaliações (criar/editar ciclos)
- [ ] Testar histórico de senhas (auditoria)
- [ ] Testar gerenciamento de senhas de líderes
- [ ] Testar mapa de sucessão UISA (editar/incluir)
- [ ] Testar sucessão inteligente (filtros, pipeline)
- [ ] Testar templates de avaliação (criar/editar/importar/exportar)
- [ ] Testar calibração diretoria (drag-and-drop, evidências)
- [ ] Testar notificações push (browser/mobile)
- [ ] Testar analytics avançado (gráficos temporais)
- [ ] Testar importação de ponto eletrônico
- [ ] Testar dashboard de discrepâncias
- [ ] Testar sistema de alertas
- [ ] Testar benchmarking
- [ ] Testar workflows de bônus multinível
- [ ] Testar compliance de bônus (SLA)
- [ ] Testar exportação para folha de pagamento

### Próximas Funcionalidades Solicitadas
- [x] Criar página de relatórios de progresso de ciclos (/relatorios/ciclos)
- [x] Implementar gráficos de evolução (avaliações 360°, metas, PDI)
- [x] Adicionar filtros avançados no dashboard de sucessão
- [x] Criar fluxo de calibração de avaliações (reuniões de calibração)
- [x] Implementar comparação de avaliações entre gestores


---

## 🚀 PRÓXIMAS FUNCIONALIDADES AVANÇADAS - 21/11/2024 15:10

### Fase 1: Fluxo Completo de Calibração com Reuniões em Tempo Real
- [x] Criar tabelas calibrationParticipants, calibrationVotes, calibrationComparisons
- [x] Criar router backend calibrationMeetingRouter com 15 endpoints
- [x] Criar interface de lista de reuniões (/calibracao/reunioes)
- [x] Implementar criação de reuniões com participantes
- [x] Adicionar sistema de votação/consenso (endpoints prontos)
- [x] Implementar endpoints de chat em tempo real
- [x] Adicionar histórico de ajustes com justificativas
- [x] Criar endpoints para salvar decisões da reunião
- [ ] Criar página de reunião em tempo real (/calibracao/reuniao/:id) - EM ANDAMENTO
- [ ] Integrar WebSocket para chat e atualizações em tempo real - EM ANDAMENTO

### Fase 2: Sistema de Notificações Push em Tempo Real
- [ ] Implementar WebSocket para notificações em tempo real (já existe, expandir)
- [ ] Criar sistema de alertas para aprovações pendentes (metas, avaliações, PDI)
- [ ] Adicionar alertas para metas vencendo (7, 3, 1 dia antes)
- [ ] Implementar notificações para avaliações atrasadas
- [ ] Criar badge de contador no ícone de notificações (header)
- [ ] Adicionar som/vibração para alertas críticos
- [ ] Implementar preferências de notificação por usuário (/configuracoes/notificacoes)
- [ ] Criar página de histórico de notificações (/notificacoes/historico)
- [ ] Adicionar filtros por tipo, data e status (lida/não lida)

### Fase 3: Dashboard Mobile-First para Gestores
- [ ] Criar layout responsivo mobile-first (/gestor/mobile)
- [ ] Implementar KPIs otimizados para tela pequena (cards compactos)
- [ ] Adicionar gestos de swipe para navegação entre seções
- [ ] Criar cards compactos para metas e avaliações (lista vertical)
- [ ] Implementar filtros em bottom sheet (modal inferior)
- [ ] Adicionar modo offline com cache local (Service Worker)
- [ ] Otimizar performance para conexões lentas (lazy loading)
- [ ] Implementar pull-to-refresh para atualizar dados
- [ ] Adicionar atalhos rápidos (aprovar/rejeitar com 1 toque)
- [ ] Criar visualização de gráficos otimizada para mobile


---

## 🚨 CORREÇÕES URGENTES - 21/11/2024 15:55

### Erros 404 e Páginas Faltantes
- [x] Criar página /metas/corporativas/adesao (AdesaoMetasCorporativas.tsx)
- [x] Criar rota /ciclos/ativos (CiclosAtivos.tsx)
- [x] Adicionar rotas faltantes no App.tsx

### Botões e Funcionalidades Quebradas
- [x] Corrigir botão "Nova Meta" em Metas em Cascata
- [x] Corrigir erro Select.Item em Calibração Diretoria (value vazio)

### Sucessão Inteligente
- [ ] Completar implementação da página /sucessao-inteligente
- [ ] Adicionar filtros funcionais
- [ ] Implementar pipeline de sucessão
- [ ] Testar fluxo completo

### Dashboard Executivo - Nine Box Interativo
- [x] Adicionar modal de detalhes ao clicar em quadrante do Nine Box
- [x] Mostrar lista de profissionais no quadrante selecionado
- [x] Exibir informações detalhadas (nome, cargo, performance, potencial)
- [x] Adicionar ações rápidas (ver perfil, editar avaliação)

### Correções em Metas SMART
- [ ] Corrigir botão de criar meta individual em /metas/criar (não está salvando)
- [x] Adicionar botão "Voltar" na página de Metas SMART
- [ ] Validar formulário de criação de metas
- [ ] Testar fluxo completo de criação

### Integração PDI com Metas
- [x] Exibir metas do PDI individual na página de Metas SMART
- [x] Permitir medição e acompanhamento de progresso das metas do PDI
- [ ] Adicionar filtro para separar metas SMART e metas do PDI
- [ ] Sincronizar status entre PDI e metas
- [x] Criar visualização unificada de todas as metas (SMART + PDI)


---

## 🔧 CORREÇÕES E MELHORIAS - 21/11/2024 16:02

### Erro tRPC - Notificações
- [x] Criar router notifications.getMyNotifications
- [x] Implementar backend de notificações
- [x] Testar integração com NotificationBell

### Permissões de Admin
- [ ] Permitir admin editar todas as metas (individual, equipe, corporativa)
- [ ] Permitir admin editar todas as avaliações 360°
- [ ] Permitir admin editar todas as avaliações Enhanced
- [ ] Adicionar controle de acesso baseado em role (admin vs user)

### Templates de Avaliação - Melhores Práticas
- [ ] Criar templates completos de avaliação 360°
- [ ] Criar templates de avaliação Enhanced
- [ ] Adicionar competências baseadas em frameworks reconhecidos
- [ ] Incluir escalas de avaliação padronizadas
- [ ] Documentar melhores práticas de avaliação


### Sistema Completo de Ciclos de Avaliação
- [x] Criar página de gestão de ciclos (/ciclos-avaliacao/gerenciar)
- [x] Implementar abertura de novo ciclo com configurações
- [x] Gerar avaliações automaticamente para todos os funcionários
- [x] Suportar múltiplos tipos: 360°, Enhanced, Performance Integrada
- [ ] Permitir edição de ciclos ativos
- [x] Funcionalidade de reabrir ciclo finalizado
- [x] Finalizar ciclo e bloquear edições
- [ ] Templates de avaliação baseados em melhores práticas
- [ ] Configurar competências e dimensões por tipo de avaliação
- [ ] Dashboard de acompanhamento do ciclo
