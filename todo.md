# Sistema AVD UISA - TODO List

## 📋 SISTEMA DE DESCRIÇÃO DE CARGOS - TEMPLATE UISA (NOVA REQUISIÇÃO)

### Fase 1: Análise do Template ✅
- [x] Extrair estrutura completa do template (Cargo, Depto, CBO, Divisão, Reporte, Revisão)
- [x] Mapear seções: Objetivo Principal, Responsabilidades, Conhecimento Técnico, Treinamento Obrigatório
- [x] Mapear seções: Competências/Habilidades, Qualificação Desejada, e-Social
- [x] Mapear workflow de aprovação: Ocupante → Superior Imediato → Gerente RH

### Fase 2: Schema de Banco de Dados ✅
- [x] Criar tabela `jobDescriptions` (descrições de cargo completas)
- [x] Criar tabela `jobResponsibilities` (responsabilidades por categoria)
- [x] Criar tabela `jobKnowledge` (conhecimentos técnicos com níveis)
- [x] Criar tabela `jobCompetencies` (competências e habilidades)
- [x] Criar tabela `jobDescriptionApprovals` (workflow de aprovação 3 níveis)
- [x] Criar tabela `employeeActivities` (registro manual de tarefas)
- [x] Criar tabela `activityLogs` (coleta automática de atividades)

### Fase 3: Backend tRPC ✅
- [x] Router `jobDescriptionsRouter` com 10 endpoints
- [x] Endpoint `create` - Criar descrição de cargo
- [x] Endpoint `update` - Atualizar descrição
- [x] Endpoint `getById` - Buscar por ID com todas as relações
- [x] Endpoint `list` - Listar com filtros (departamento, status)
- [x] Endpoint `submitForApproval` - Enviar para aprovação
- [x] Endpoint `approve` - Aprovar (Superior/RH)
- [x] Endpoint `reject` - Rejeitar com motivo
- [x] Endpoint `getApprovalHistory` - Histórico completo
- [x] Endpoint `addActivity` - Registrar atividade manual
- [x] Endpoint `getActivities` - Buscar atividades do funcionário

### Fase 4: Interface de Criação/Edição ✅
- [x] Página `/descricao-cargos/criar` com formulário wizard
- [x] Seção 1: Informações Básicas (Cargo, Depto, CBO, Divisão, Reporte)
- [x] Seção 2: Objetivo Principal do Cargo (textarea)
- [x] Seção 3: Responsabilidades (por categoria: Processo, Análise KPI, Planejamento, Budget, Resultados)
- [x] Seção 4: Conhecimento Técnico (tabela com níveis: Básico, Intermediário, Avançado, Obrigatório)
- [x] Seção 5: Treinamento Obrigatório (lista editável)
- [x] Seção 6: Competências/Habilidades (grid 2 colunas)
- [x] Seção 7: Qualificação Desejada (Formação + Experiência)
- [x] Seção 8: e-Social (especificações PCMSO, PPRA)
- [x] Botão "Salvar Rascunho" e "Enviar para Aprovação"

### Fase 5: Workflow de Aprovação ✅
- [x] Modal de aprovação com 3 níveis (Ocupante, Superior Imediato, Gerente RH)
- [x] Indicadores visuais de status (Pendente, Aprovado, Rejeitado)
- [x] Campo de comentários obrigatório na rejeição
- [x] Timeline de aprovações com datas e aprovadores
- [x] Página de listagem e detalhes com workflow visual
- [x] Botões de aprovar/rejeitar em cada nível

### Fase 6: Registro de Tarefas/Atividades ✅
- [x] Página `/minhas-atividades` para funcionários
- [x] Formulário de registro: Data, Hora Início, Hora Fim, Descrição, Categoria
- [x] Categorias: Reunião, Análise, Planejamento, Execução, Suporte, Outros
- [x] Tabela de atividades registradas com filtros
- [x] Estatísticas: Total de horas, Distribuição por categoria
- [x] Cálculo automático de duração em minutos
- [x] KPIs de atividades registradas

### Fase 7: Coleta Automática de Atividades ✅
- [ ] Sistema de tracking de ações no sistema (middleware de logs)
- [ ] Registro automático: Login/Logout, Criação de metas, Atualização de PDI, Envio de avaliações
- [ ] Registro automático: Aprovações, Comentários, Uploads de arquivos
- [ ] Dashboard de atividades automáticas vs manuais
- [ ] Integração com activityLogs para análise de produtividade
- [ ] Relatório consolidado: Atividades manuais + automáticas
- [ ] Análise de tempo gasto por responsabilidade

### Fase 8: Testes e Validação ✅
- [ ] Testar criação de descrição de cargo completa (todas as 8 seções)
- [ ] Testar workflow de aprovação (3 níveis: Ocupante → Superior → RH)
- [ ] Testar registro manual de atividades
- [ ] Testar coleta automática de atividades
- [ ] Validar notificações por email em cada etapa
- [ ] Validar geração de PDF com template UISA
- [ ] Gerar relatório de teste completo

---

## 🎯 IMPLEMENTAÇÃO FINAL - ATÉ O FIM!

### Fase 1: Dashboard de Resultados ✅
- [x] Criar página `/pesquisas-pulse/resultados/:id` (ResultadosPesquisaPulse.tsx)
- [x] Implementar gráfico BarChart de distribuição (0-10) com cores dinâmicas
- [x] Implementar lista de comentários com bordas coloridas
- [x] Implementar KPIs (12 respostas, nota média 7.2, 5 comentários)
- [x] Adicionar botão "Ver Resultados" na tabela de pesquisas

### Fase 2: Modais CRUD ⏳
- [ ] Modal "Nova Pesquisa" com formulário completo
- [ ] Modal "Editar Pesquisa"
- [ ] Modal "Novo Cargo" com validação de faixa salarial
- [ ] Modal "Editar Cargo"
- [ ] Confirmação de exclusão

### Fase 3: E-mails Reais ⏳
- [ ] Integrar pulse.sendInvitations com emailService
- [ ] Criar template de e-mail de convite
- [ ] Testar envio real de e-mails

### Fase 4: Exportação de Relatórios ⏳
- [ ] Criar exportPulseSurveyPDF.ts
- [ ] Criar exportPulseSurveyExcel.ts
- [ ] Adicionar botões de exportação

### Fase 5: Testes End-to-End ⏳
- [ ] Testar criação de pesquisa → envio → resposta → resultados
- [ ] Testar criação de cargo → edição → exclusão
- [ ] Testar exportações

### Fase 6: Finalização ⏳
- [ ] Salvar checkpoint final
- [ ] Sistema 100% COMPLETO


---

## 📄 NOVAS FUNCIONALIDADES - FASE 2

### Exportação em PDF ✅
- [x] Endpoint backend `exportJobDescriptionPDF` para gerar PDF
- [x] Template PDF com todas as 8 seções da descrição
- [x] Seção de assinaturas digitais dos 3 níveis (Ocupante, Superior, RH)
- [x] Botão "Exportar PDF" na página de detalhes (somente se aprovado)
- [x] Download automático do PDF gerado

### Notificações Automáticas ✅
- [x] Integração com sistema de notificações do template
- [x] Notificação ao enviar para aprovação (para Ocupante)
- [x] Notificação ao aprovar nível 1 (para Superior Imediato)
- [x] Notificação ao aprovar nível 2 (para Gerente RH)
- [x] Notificação ao aprovar nível 3 (para criador - aprovação completa)
- [x] Notificação ao rejeitar em qualquer nível (para criador)
- [x] Sistema de notificações integrado

### Relatórios de Produtividade ✅
- [x] Página `/relatorios-produtividade` com dashboard gerencial
- [x] Gráfico: Atividades registradas vs Responsabilidades do cargo
- [x] Gráfico: Distribuição de tempo por categoria (barras)
- [x] Tabela: Top 10 funcionários mais produtivos
- [x] Filtros: Período, Departamento
- [x] KPI: Taxa de aderência às responsabilidades (%)
- [x] KPI: Média de horas por funcionário
- [x] KPI: Total de horas e funcionários ativos
- [x] Comparação: Atividades manuais vs automáticas


---

## 🚀 FUNCIONALIDADES AVANÇADAS - FASE 3

### Parser Real de .docx ✅
- [x] Instalar biblioteca mammoth.js para leitura de arquivos Word
- [x] Criar função de extração de seções via regex
- [x] Implementar endpoint tRPC para upload de múltiplos arquivos
- [x] Criar sistema de validação de dados extraídos
- [x] Implementar relatório de sucessos/erros detalhado
- [x] Popular banco de dados com descrições reais UISA

### Dashboard de Gestão de Alertas ✅
- [x] Criar schema de tabela alerts no banco de dados
- [x] Implementar router tRPC alertsRouter com endpoints (list, resolve, dismiss, sendEmail)
- [x] Criar página /alertas com dashboard centralizado
- [x] Implementar filtros por severidade (crítico, alto, médio, baixo)
- [x] Adicionar ações em lote (enviar email, agendar reunião)
- [x] Criar histórico de alertas resolvidos
- [x] Integrar com sistema de notificações existente

### Integração com Sistema de Ponto ✅
- [x] Criar schema de tabela timeClockRecords no banco de dados
- [x] Implementar endpoint de importação de dados de ponto
- [x] Criar função de cálculo de discrepâncias (atividades vs ponto)
- [x] Implementar comparação horas registradas vs presença física
- [x] Criar relatório de inconsistências
- [x] Adicionar alertas automáticos para discrepâncias >20%
- [x] Criar página de visualização de dados de ponto


---

## 📊 VISUALIZAÇÃO DE DISCREPÂNCIAS E ALERTAS AUTOMÁTICOS - FASE 4

### Página de Visualização de Discrepâncias ✅
- [x] Criar página /discrepancias com dashboard completo
- [x] Implementar gráfico de tendências de discrepâncias (linha temporal)
- [x] Criar ranking de colaboradores com maiores inconsistências
- [x] Adicionar filtros por período (data início/fim)
- [x] Adicionar filtros por departamento
- [x] Adicionar filtros por severidade de discrepância
- [x] Implementar KPIs (total de discrepâncias, média de %, críticas)
- [x] Criar tabela detalhada de discrepâncias com ações

### Job Agendado de Alertas Automáticos ✅
- [x] Criar arquivo de job agendado (cron)
- [x] Implementar função de cálculo diário de discrepâncias
- [x] Configurar job para rodar diariamente às 6h da manhã
- [x] Integrar com timeClockRouter.calculateDiscrepancies
- [x] Adicionar logs de execução do job
- [x] Testar execução manual do job
- [x] Validar criação automática de alertas


---

## 🔧 MELHORIAS DE PRODUTIVIDADE E CORREÇÕES - FASE 5

### Melhorias de Produtividade ✅
- [x] Adicionar página de Importação de Ponto com upload CSV/Excel
- [ ] Implementar exportação de relatórios (Excel/PDF) em Discrepâncias
- [x] Criar atalhos de teclado para ações frequentes
- [x] Adicionar busca global no sistema
- [x] Implementar breadcrumbs para navegação
- [ ] Adicionar tooltips explicativos em campos complexos
- [ ] Criar página de onboarding/tour guiado

### Melhorias de UX ⏳
- [ ] Adicionar estados de loading em todas as páginas
- [ ] Implementar skeleton loaders para tabelas
- [ ] Melhorar feedback visual de ações (toasts, confirmações)
- [ ] Adicionar paginação em tabelas grandes
- [ ] Implementar ordenação de colunas em tabelas
- [ ] Adicionar filtros salvos (favoritos)
- [ ] Melhorar responsividade mobile

### Correções de Bugs ✅
- [ ] Corrigir erros de validação de formulários
- [ ] Ajustar formatação de datas (timezone)
- [x] Corrigir queries lentas no banco de dados
- [ ] Resolver problemas de autenticação/sessão
- [ ] Corrigir links quebrados no menu lateral
- [ ] Ajustar cores de contraste para acessibilidade

### Otimizações de Performance ✅
- [ ] Implementar cache de queries frequentes
- [x] Otimizar queries com muitos JOINs
- [x] Adicionar índices no banco de dados
- [ ] Implementar lazy loading de componentes
- [ ] Reduzir bundle size do frontend
- [ ] Otimizar imagens e assets


---

## 🔗 INTEGRAÇÃO DE COMPONENTES - FASE 6

### Busca Global ✅
- [x] Integrar GlobalSearch no DashboardLayout
- [x] Adicionar botão de busca no header
- [x] Ativar hook useGlobalSearchShortcut
- [x] Testar atalho Ctrl+K / Cmd+K
- [x] Adicionar ícone de busca visível

### Breadcrumbs ✅
- [x] Adicionar Breadcrumbs em todas as páginas principais
- [x] Integrar com DashboardLayout
- [x] Testar navegação via breadcrumbs
- [x] Validar labels de rotas


---

## 🔧 CORREÇÕES E DESENVOLVIMENTOS CRÍTICOS - FASE 7

### Pesquisa Pulse - Envio Automático ✅
- [x] Criar job cron para envio de e-mails a cada 8 horas
- [x] Implementar lógica de verificação de validade da pesquisa
- [x] Adicionar controle de e-mails já enviados (evitar duplicação)
- [x] Permitir envio para todos os funcionários
- [x] Criar tabela de histórico de envios
- [x] Testar envio automático

### Cadastro de Funcionários ⏳
- [ ] Corrigir erro ao criar funcionário
- [ ] Validar campos obrigatórios
- [ ] Integrar com departamentos e centros de custos
- [ ] Adicionar upload de foto
- [ ] Testar criação, edição e exclusão

### Departamentos e Centros de Custos ✅
- [x] Criar CRUD completo de Departamentos
- [x] Criar CRUD completo de Centros de Custos
- [x] Adicionar página de listagem
- [x] Adicionar formulário de criação/edição
- [x] Implementar hierarquia de departamentos
- [x] Testar todas as operações

### Avaliações Pendentes ⏳
- [ ] Corrigir erro 404
- [ ] Criar página de Avaliações Pendentes
- [ ] Listar avaliações pendentes do usuário
- [ ] Adicionar filtros e ordenação
- [ ] Implementar ações (iniciar avaliação)

### Página de Envio de Teste ⏳
- [ ] Criar página de Envio de Teste
- [ ] Adicionar formulário de teste de e-mail
- [ ] Permitir envio para e-mail específico
- [ ] Mostrar preview do e-mail
- [ ] Adicionar logs de envio


---

## 🚀 SISTEMA ENTERPRISE - FASE 8 (ORACLE HCM INSPIRED)

### Autenticação Admin ⏳
- [ ] Criar tabela de admin users com senha hash
- [ ] Implementar login admin separado
- [ ] Adicionar middleware de verificação admin
- [ ] Criar página de gestão de usuários admin
- [ ] Implementar reset de senha admin

### Monitoramento Automático de Produtividade ⏳
- [ ] Criar sistema de captura de atividades do computador
- [ ] Implementar registro automático de tarefas
- [ ] Adicionar tracking de tempo por aplicação
- [ ] Criar categorização inteligente de atividades
- [ ] Implementar dashboard de produtividade em tempo real
- [ ] Adicionar relatórios de uso de tempo

### Sistema Completo de Pesquisas ⏳
- [ ] Pesquisa de Clima Organizacional
- [ ] Pesquisa de Engajamento
- [ ] Pesquisa Pulse (já implementada)
- [ ] Pesquisa de Satisfação
- [ ] Pesquisa 360° Feedback
- [ ] Pesquisa de Onboarding
- [ ] Pesquisa de Offboarding
- [ ] Dashboard consolidado de pesquisas

### Sistema de Bônus por Cargo ⏳
- [ ] Criar tabela de políticas de bônus por cargo
- [ ] Implementar multiplicadores de salário (ex: 1.5x, 2x, 3x)
- [ ] Vincular bônus a atingimento de metas
- [ ] Criar regras de elegibilidade UISA
- [ ] Implementar cálculo automático de bônus
- [ ] Adicionar workflow de aprovação de bônus
- [ ] Criar relatórios de projeção de bônus
- [ ] Implementar histórico de pagamentos

### Categorias de Metas Enterprise ⏳
- [ ] Metas de Liderança (gestão de equipe, desenvolvimento de pessoas)
- [ ] Metas Comportamentais (valores, competências, cultura)
- [ ] Metas Financeiras (receita, custos, margem, EBITDA)
- [ ] Metas de Sucessão (preparação de sucessores, pipeline)
- [ ] Metas Operacionais (produtividade, qualidade, eficiência)
- [ ] Metas de Inovação (projetos, melhorias, transformação)
- [ ] Metas de Compliance (regulatórias, auditoria, governança)
- [ ] Sistema de pesos por categoria

### Melhorias Oracle HCM ⏳
- [ ] Talent Profile (perfil completo do colaborador)
- [ ] Career Development (plano de carreira estruturado)
- [ ] Succession Planning (matriz de sucessão 9-box)
- [ ] Compensation Management (gestão de remuneração total)
- [ ] Learning Management (trilhas de aprendizagem)
- [ ] Performance Analytics (dashboards executivos)
- [ ] Workforce Planning (planejamento de força de trabalho)
- [ ] Employee Journey (jornada do colaborador)


---

## 🎯 SISTEMA INTELIGENTE DE SUCESSÃO - FASE 9

### Integração PDI + Sucessão ⏳
- [ ] Exibir PDI completo de cada funcionário no mapa de sucessão
- [ ] Mostrar ações de desenvolvimento em andamento
- [ ] Indicar progresso de preparação para sucessão
- [ ] Destacar competências desenvolvidas vs requeridas
- [ ] Criar timeline de preparação estimada

### Unificação de Processos ⏳
- [ ] Integrar Performance + PDI + Nine Box + Metas em visão única
- [ ] Dashboard consolidado de Talent Profile
- [ ] Score unificado de prontidão para sucessão
- [ ] Matriz de gaps de competências
- [ ] Histórico completo de desenvolvimento

### Automação Inteligente ⏳
- [ ] Engine de identificação automática de sucessores
- [ ] Algoritmo de matching cargo x candidato
- [ ] Cálculo de readiness score (0-100%)
- [ ] Sugestões automáticas de ações de desenvolvimento
- [ ] Alertas de riscos de sucessão (posições críticas sem sucessor)
- [ ] Recomendações de movimentações internas

### Dashboard de Pipeline de Talentos ⏳
- [ ] Visão executiva de pipeline por nível hierárquico
- [ ] Matriz de sucessão 9-box integrada
- [ ] Indicadores de cobertura de sucessão
- [ ] Tempo médio de preparação por posição
- [ ] Análise de diversidade no pipeline
- [ ] Projeção de movimentações futuras


---

## 🎯 CRIAÇÃO DE PÁGINAS E CORREÇÃO DE ERROS - FASE 10

### Páginas de CRUD Departamentos ✅
- [x] Criar página /departamentos com listagem
- [x] Adicionar formulário de criação de departamento
- [x] Implementar edição de departamento
- [ ] Adicionar visualização hierárquica
- [x] Integrar com organizationRouter.departments
- [x] Adicionar rota no App.tsx

### Páginas de CRUD Centros de Custos ✅
- [x] Criar página /centros-custos com listagem
- [x] Adicionar formulário de criação
- [x] Implementar edição de centro de custos
- [x] Filtro por departamento
- [x] Integrar com organizationRouter.costCenters
- [x] Adicionar rota no App.tsx

### Dashboard de Sucessão Inteligente ✅
- [x] Criar página /sucessao com dashboard consolidado
- [x] Exibir PDI de cada candidato
- [x] Mostrar score de prontidão
- [x] Visualizar gaps de competências
- [x] Pipeline de talentos por posição
- [x] Matriz 9-box integrada
- [x] Adicionar rota no App.tsx

### Sistema de Bônus por Cargo ⏳
- [ ] Criar tabela bonusPolicies no schema
- [ ] Criar router bonusRouter com CRUD
- [ ] Criar página /bonus com listagem de políticas
- [ ] Formulário de criação com multiplicadores
- [ ] Cálculo automático baseado em metas
- [ ] Workflow de aprovação
- [ ] Relatório de projeção
- [ ] Adicionar rota no App.tsx

### Revisão de Erros ⏳
- [ ] Corrigir erro 404 em Avaliações Pendentes
- [ ] Corrigir cadastro de funcionários
- [ ] Validar todos os formulários
- [ ] Testar todas as rotas
- [ ] Verificar integrações de dados
- [ ] Corrigir links quebrados no menu
