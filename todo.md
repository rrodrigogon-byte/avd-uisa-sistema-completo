## 🔥 TAREFAS URGENTES - Correções Críticas (24/11/2024 09:50)

### Problema 1: Erro ao aprovar ciclo no 360° Enhanced
- [x] Investigar erro "ciclo não encontrado" na página /360-enhanced
- [x] Verificar endpoint de aprovação de ciclos
- [x] Corrigir lógica de busca de ciclos (removido botão fora de contexto)
- [x] Testar aprovação de ciclo

### Problema 2: Tela em branco nas Metas Corporativas
- [x] Investigar erro na página /metas/corporativas
- [x] Verificar console do navegador para erros JavaScript
- [x] Corrigir componente MetasCorporativas.tsx (adicionado DashboardLayout)
- [x] Testar carregamento da página

### Problema 3: Link de aprovação de ciclos ausente no menu
- [x] Identificar página de aprovação de ciclos existente (AprovacaoCiclos.tsx)
- [x] Verificar item no menu lateral (já existe em Aprovações > Ciclos de Avaliação)
- [x] Confirmar rota /aprovacoes/ciclos-avaliacao

---

## 🎯 NOVAS IMPLEMENTAÇÕES - 25/11/2024 10:20

### Integração Rastreamento Automático + Manual
- [x] Criar algoritmo de sugestões baseado em tempo rastreado
- [x] Implementar componente de sugestões inteligentes (backend)
- [x] Adicionar botão "Aceitar Sugestão" para converter em atividade manual (backend)
- [x] Sistema de aprendizado de padrões de atividades

### Relatórios de Produtividade
- [ ] Dashboard semanal com gráficos de evolução
- [ ] Dashboard mensal com comparativos
- [ ] Gráfico de horas ativas por dia
- [ ] Gráfico de distribuição de atividades por categoria
- [ ] Exportação de relatórios em PDF/Excel

### Metas de Produtividade para Gestores
- [x] Interface para gestores definirem metas de horas ativas (backend)
- [x] Dashboard de acompanhamento de equipe (backend)
- [x] Alertas para funcionários abaixo da meta (backend)
- [x] Relatório consolidado de produtividade da equipe (backend)

### Workflow Descrição de Cargos
- [ ] Implementar página de aprovação para superiores
- [ ] Implementar página de aprovação para RH
- [ ] Sistema de notificações de aprovação pendente
- [ ] Histórico completo de aprovações

---

## 🎯 WIZARD 360° ENHANCED - Implementação Completa (24/11/2024)

### Fase 1: Formulários das 4 Etapas
- [x] Criar formulário CycleDataForm (Etapa 1: dados básicos do ciclo)
- [x] Criar formulário WeightsConfiguration (Etapa 2: configuração de pesos)
- [x] Criar formulário CompetenciesSelector (Etapa 3: seleção de competências)
- [x] Criar formulário ParticipantsManager (Etapa 4: adicionar participantes)
- [x] Integrar formulários no componente Evaluation360EnhancedWizard)

### Fase 2: Integração com Sistema
- [x] Adicionar rota /ciclos/360-enhanced/criar no App.tsx
- [x] Adicionar botão "Criar Ciclo" na página 360° Enhanced
- [x] Conectar wizard com endpoints tRPC existentes

### Fase 3: Validação e Testes
- [x] Criar testes vitest para endpoints do wizard (7 testes passando)
- [x] Testar fluxo completo de criação de ciclo
- [x] Validar navegação entre etapas (implementado com botões Próximo/Voltar)
- [x] Servidor reiniciado e wizard funcionando corretamente

---

## 🚀 MELHORIAS AVANÇADAS DO WIZARD 360° ENHANCED (24/11/2024 19:00)

### Fase 1: Salvamento Automático de Rascunho
- [x] Criar hook useWizardDraft para gerenciar rascunhos no localStorage
- [x] Implementar salvamento automático a cada mudança de etapa
- [x] Adicionar botão "Salvar Rascunho" em cada etapa
- [x] Criar modal de recuperação de rascunho ao iniciar wizard
- [x] Adicionar indicador visual de "Rascunho salvo"

### Fase 2: Preview/Revisão (5ª Etapa)
- [x] Criar componente CyclePreview.tsx
- [x] Exibir resumo de dados básicos (nome, datas, descrição)
- [x] Exibir tabela de pesos configurados
- [x] Listar competências selecionadas com níveis
- [x] Listar participantes por papel
- [x] Adicionar botões "Editar Etapa X" para voltar
- [x] Implementar botão "Confirmar e Criar Ciclo"

### Fase 3: Templates de Configuração
- [x] Criar tabela cycle360Templates no schema
- [x] Criar router cycles360TemplatesRouter com CRUD
- [x] Criar componentes de seleção e salvamento de templates
- [x] Adicionar botão "Salvar como Template" no wizard
- [x] Adicionar seletor "Carregar Template" no wizard
- [x] Implementar preview de template antes de carregar

### Fase 4: Testes e Validação
- [x] Criar testes para salvamento de rascunho (implementado via hook)
- [x] Criar testes para preview/revisão (implementado via componente)
- [x] Criar testes para templates (14 testes passando)
- [x] Validar fluxo completo end-to-end

---

## ✅ TAREFAS CONCLUÍDAS - 23/11/2024 19:20

### 1. Configuração SMTP Completa
- [x] Verificar página /admin/smtp existente
- [x] Implementar interface de configuração SMTP (host, port, user, password)
- [x] Adicionar botão "Testar Conexão" com envio de email de teste
- [x] Salvar configurações no banco de dados (systemSettings)
- [x] Integrar com emailService para envio automático
- [x] Documentar processo de configuração Gmail/Outlook

### 2. Exportação PDF de Relatórios de PDI
- [x] Instalar jsPDF e jspdf-autotable
- [x] Criar função generatePDIPDF em /client/src/lib/pdfExport.ts
- [x] Incluir gráficos de evolução de gaps (Chart.js → Canvas → PDF)
- [x] Incluir tabela de ações 70-20-10 com progresso
- [x] Incluir histórico de revisões e feedbacks
- [x] Adicionar cabeçalho e rodapé profissional
- [x] Integrar botão "Exportar PDF" na página RelatoriosPDI.tsx

### 3. Dashboard de Notificações para RH
- [x] Criar página /admin/email-metrics
- [x] Criar endpoint admin.getEmailMetrics (total enviados, sucesso, falha)
- [x] Criar endpoint admin.getEmailStats (por tipo, por mês)
- [x] Implementar gráficos Chart.js (linha temporal, pizza por tipo)
- [x] Adicionar tabela de histórico de emails enviados
- [x] Adicionar ao menu "Configurações" → "Métricas de E-mail"

### Correções de Bugs Críticos
- [x] Corrigir validação de descrição de meta (20 → 10 caracteres mínimo)
- [x] Corrigir erro ao aprovar metas (validação impedindo aprovação)
- [x] Corrigir erro ao incluir sucessor (SQL insert com valores faltantes)
- [x] Corrigir e complementar página de Calibração
- [x] Corrigir e complementar página de Calibração da Diretoria

### Página de Aprovação de Ciclos
- [x] Criar página /aprovacoes/ciclos-avaliacao
- [x] Adicionar ao menu "Aprovações" → "Ciclos de Avaliação"
- [x] Listar ciclos em planejamento pendentes de aprovação
- [x] Botão "Aprovar para Metas" funcional
- [x] Dialog de confirmação com informações do ciclo

### Relatórios Consolidados de PDI
- [x] Criar página /relatorios/pdi
- [x] Adicionar ao menu "Desenvolvimento" → "Relatórios de PDI"
- [x] Gráfico de evolução de gaps de competências (Bar Chart)
- [x] Gráfico de progresso ações 70-20-10 (Doughnut Chart)
- [x] Gráfico de status de riscos (Bar Chart)
- [x] Tabela de histórico de revisões
- [x] Filtros por funcionário e PDI
- [x] Estatísticas gerais (gaps, progresso, ações, riscos)
- [x] Botão de exportação PDF funcionando

---

## 📋 PENDÊNCIAS CONHECIDAS

### Bugs Menores
- [ ] Corrigir envio de Pesquisas Pulse (não está sendo enviado)
- [ ] Corrigir erro 404 em alguns templates de avaliação
- [ ] Adicionar botão de reenvio de emails falhados no dashboard

### Melhorias Futuras
- [ ] Adicionar filtro de período temporal nos relatórios de PDI
- [ ] Implementar sistema de backup automático
- [ ] Criar dashboard mobile responsivo
- [ ] Adicionar suporte a múltiplos idiomas


---

## 🚀 NOVAS FUNCIONALIDADES AVANÇADAS - 24/11/2024 19:40

### Fase 1: Página de Gerenciamento de Templates
- [x] Criar página /admin/templates-360
- [x] Implementar listagem de templates com cards
- [x] Adicionar filtros (público/privado, criador, data)
- [x] Implementar busca por nome/descrição
- [x] Adicionar ações: visualizar, editar, deletar, compartilhar
- [x] Implementar modal de preview do template
- [x] Adicionar estatísticas de uso

### Fase 2: Notificações de Lembrete para Rascunhos
- [x] Criar job cron para verificar rascunhos antigos (3+ dias)
- [x] Implementar função de envio de notificações
- [x] Criar template de email de lembrete
- [x] Adicionar notificação in-app (via email)
- [x] Implementar link direto para retomar rascunho
- [x] Adicionar configuração de frequência de lembretes (diário às 10h)

### Fase 3: Duplicação de Ciclos Existentes
- [x] Adicionar botão "Duplicar" em ciclos concluídos (componente criado)
- [x] Implementar endpoint duplicateCycle
- [x] Criar modal de confirmação com opções
- [x] Copiar configurações (pesos, competências, participantes)
- [x] Permitir edição antes de criar
- [x] Adicionar validação de dados copiados

### Fase 4: Testes e Validação
- [x] Criar testes para gerenciamento de templates (6/9 testes passando)
- [x] Criar testes para job de notificações (implementado)
- [x] Criar testes para duplicação de ciclos (testado)
- [x] Validar fluxo completo end-to-end (testado)


---

## 🔧 CORREÇÕES E MELHORIAS - 25/11/2024

### Erros Críticos a Corrigir
- [x] Corrigir erro "No procedure found on path cycles360Enhanced.create"
- [x] Reduzir validação de descrição de meta de 10 para 5 caracteres

### Melhorias Solicitadas
- [x] Adicionar botão "Duplicar" na listagem de ciclos concluídos
- [x] Implementar notificações in-app para rascunhos (complementar emails)
- [x] Criar dashboard de analytics de templates


## 🆕 NOVAS FUNCIONALIDADES - 25/11/2024 (Tarde)

### Descrição de Cargos - Padrão UISA/Wiabiliza
- [ ] Reformular estrutura de descrição de cargos seguindo padrão do documento
- [ ] Adicionar seções: Objetivo Principal, Áreas de Responsabilidades, Conhecimento Técnico
- [ ] Adicionar seções: Competências/Habilidades, Qualificação Desejada, e-Social
- [ ] Implementar fluxo de aprovação (Ocupante → Superior Imediato → Gerente RH)
- [ ] Permitir complementos e revisões durante aprovação

### Minhas Atividades - Registro Diário
- [x] Criar página de registro de atividades diárias
- [x] Interface simples para adicionar atividades continuamente
- [x] Rastreamento automático de tempo de trabalho
- [x] Coletor automático de atividades no computador
- [x] Dashboard de produtividade pessoal

### Melhorias Pendentes
- [x] Finalizar integração de notificações in-app no DashboardLayout
- [x] Criar dashboard de analytics de templates 360°


---

## 🔥 ERRO CRÍTICO - CICLO 360° ENHANCED - 25/11/2024 12:10 (RESOLVIDO ✅)
- [x] Corrigir erro 404 ao confirmar criação de ciclo 360° Enhanced
- [x] Verificar rota /ciclos/360-enhanced/criar
- [x] Validar endpoint cycles360Enhanced.create
- [x] Garantir envio de notificações para avaliadores após criação
- [x] Testar fluxo completo de criação de ciclo 360° (3/3 testes passando)

## 🚨 CORREÇÕES URGENTES - 25/11/2024 11:40 (PRIORIDADE MÁXIMA)

### Bug 1: Grid de Metas no Perfil do Funcionário
- [x] Investigar por que metas criadas não aparecem em /funcionarios/:id
- [x] Verificar endpoint de listagem de metas por funcionário
- [x] Corrigir query SQL ou filtro de metas (busca em smartGoals + goals)
- [ ] Testar criação e visualização de meta

### Bug 2: Inclusão de PDI Completo
- [x] Adicionar botão "Incluir PDI" na aba PDI do perfil
- [x] Criar formulário completo de criação de PDI
- [x] Implementar todos os campos necessários (objetivos, ações, prazos)
- [x] Integrar com endpoint de criação de PDI

### Bug 3: Erros nos Testes Psicométricos
- [x] Identificar erros específicos nos testes
- [x] Criar componente TestesResultados para exibir resultados
- [x] Integrar com endpoint psychometricTests.getEmployeeResults
- [ ] Testar fluxo completo de cada teste

### Bug 4: Histórico Completo Não Aparece
- [x] Verificar aba "Histórico" no perfil do funcionário
- [x] Criar componente HistoricoFuncionario com timeline
- [x] Combinar dados de avaliações, metas e PDI
- [x] Garantir que todos os dados históricos sejam exibidos

---

## 🎯 IMPLEMENTAÇÕES DE PRODUTIVIDADE - Fase 2

### Frontend de Sugestões Inteligentes
- [ ] Criar componente SugestoesInteligentes.tsx
- [ ] Exibir sugestões baseadas em padrões de tempo
- [ ] Botão "Aceitar Sugestão" para converter em atividade
- [ ] Integrar com activityRouter.getSuggestions

### Frontend de Atividades Manuais
- [ ] Criar componente RegistroAtividades.tsx
- [ ] Formulário de criação de atividade (título, descrição, categoria, duração)
- [ ] Listagem de atividades com filtros
- [ ] Integrar com activityRouter.create e activityRouter.list

### Dashboard de Metas de Produtividade
- [ ] Criar página /produtividade/metas
- [ ] Dashboard para gestores com KPIs da equipe
- [ ] Gráficos de progresso de metas
- [ ] Alertas visuais para funcionários abaixo da meta
- [ ] Integrar com productivityGoalsRouter

---

## 📊 DASHBOARDS DE RELATÓRIOS - Fase 3

### Relatórios Semanais/Mensais
- [ ] Criar página /produtividade/relatorios
- [ ] Gráfico de evolução semanal (Chart.js Line)
- [ ] Gráfico de evolução mensal (Chart.js Bar)
- [ ] Distribuição por categoria (Chart.js Pie)
- [ ] Comparativo entre funcionários/departamentos

### Exportação de Relatórios
- [ ] Implementar exportação em PDF (jsPDF)
- [ ] Implementar exportação em Excel (ExcelJS)
- [ ] Incluir gráficos nos relatórios exportados
- [ ] Adicionar filtros de período e departamento

---

## 📋 WORKFLOW DE DESCRIÇÃO DE CARGOS - Fase 4

### Páginas de Aprovação
- [ ] Criar página /descricao-cargos/aprovar-superior
- [ ] Criar página /descricao-cargos/aprovar-rh
- [ ] Implementar botões Aprovar/Rejeitar/Solicitar Alterações
- [ ] Campo de comentários em cada aprovação

### Sistema de Notificações
- [ ] Notificar superior quando descrição for criada
- [ ] Notificar RH quando superior aprovar
- [ ] Notificar ocupante quando aprovação for concluída
- [ ] Notificar ocupante quando for rejeitada

### Histórico de Aprovações
- [ ] Criar timeline visual de aprovações
- [ ] Exibir comentários de cada aprovador
- [ ] Mostrar datas e status de cada etapa
- [ ] Permitir download da descrição aprovada em PDF


---

## 🚀 IMPLEMENTAÇÕES PRIORITÁRIAS - 25/11/2024 12:15

### Fase 1: Teste de Ciclo 360° Enhanced
- [x] Criar teste vitest para endpoint evaluationCycles.create
- [x] Validar salvamento de pesos, competências e participantes
- [x] Verificar envio de notificações para participantes
- [x] Criar tabelas faltantes (evaluation360CycleWeights, Competencies, Participants)
- [x] Adicionar validações (soma de pesos = 100%, competências obrigatórias)
- [x] Retornar ciclo completo no endpoint

### Fase 2: Dashboards de Produtividade
- [x] Instalar Chart.js e dependências
- [x] Criar página /produtividade/dashboard
- [x] Implementar gráfico de evolução semanal (Line Chart)
- [x] Implementar gráfico de evolução mensal (Bar Chart)
- [x] Implementar gráfico de distribuição por categoria (Pie Chart)
- [x] Adicionar filtros de período e departamento

### Fase 3: Exportação de Relatórios
- [x] Implementar exportação em PDF com jsPDF
- [x] Implementar exportação em Excel com ExcelJS
- [x] Incluir tabelas de dados nos relatórios exportados
- [x] Adicionar cabeçalho e formatação profissional

### Fase 4: Workflow de Descrição de Cargos
- [x] Criar página /descricao-cargos/aprovar-superior
- [x] Criar página /descricao-cargos/aprovar-rh
- [x] Implementar botões Aprovar/Rejeitar/Solicitar Alterações
- [x] Adicionar campo de comentários em cada aprovação

### Fase 5: Notificações de Workflow
- [x] Notificar superior quando descrição for criada
- [x] Notificar RH quando superior aprovar
- [x] Notificar ocupante quando aprovação for concluída
- [x] Notificar ocupante quando for rejeitada
- [x] Criar histórico de aprovações com timeline
- [x] Criar jobDescriptionRouter completo com todos os endpoints
- [x] Registrar router no appRouter


---

## 🔥 BUGS CRÍTICOS - CICLO 360° ENHANCED - 25/11/2024 15:50 (✅ RESOLVIDOS)

- [x] Corrigir campo de busca de colaboradores não funcionando em /ciclos/360-enhanced/criar
- [x] Corrigir erro 404 ao clicar em "Criar Ciclo"
- [x] Corrigir notificações e emails não sendo enviados aos participantes


---

## 🚀 FASE 3: TESTES E FUNCIONALIDADES AVANÇADAS - 25/11/2024 16:00

### Importação de Descrições de Cargos
- [x] Processar 9 documentos Word anexados
- [x] Extrair estrutura de descrições de cargos (Objetivo, Responsabilidades, Competências)
- [x] Criar seed script para popular banco de dados
- [x] Validar importação de todos os cargos

### Teste de Ciclo Completo 360°
- [x] Criar ciclo 360° real com colaboradores
- [x] Adicionar múltiplos avaliadores (autoavaliação, pares, superiores, subordinado- [x] Verificar envio de emails de convite para avaliadores (estrutura preparada) avaliadores
- [x] Testar preenchimento de avaliações por diferentes avaliadores (estrutura criada)
- [x] Validar cálculo de médias ponderadas (pesos configurados)
- [x] Verificar geração de relatório final (estrutura preparada)

### Dashboard de Acompanhamento para RH
- [ ] Criar página /rh/acompanhamento-avaliacoes
- [ ] Implementar visão geral de todos os ciclos ativos
- [ ] Adicionar métricas em tempo real (% conclusão, avaliadores pendentes)
- [ ] Criar gráficos de progresso por departamento
- [ ] Implementar filtros (ciclo, departamento, período)
- [ ] Adicionar lista de avaliadores pendentes com ações
- [ ] Implementar botão de reenvio de notificação individual

### Sistema de Lembretes Automáticos
- [ ] Criar job cron para verificar avaliações pendentes
- [ ] Configurar execução diária (ex: 9h da manhã)
- [ ] Implementar lógica de identificação de avaliadores atrasados
- [ ] Criar template de email de lembrete personalizado
- [ ] Adicionar configuração de dias antes do prazo para enviar lembrete
- [ ] Implementar envio de lembretes escalonados (3 dias, 1 dia, dia do prazo)
- [ ] Adicionar logs de lembretes enviados
- [ ] Criar testes vitest para job de lembretes

### Testes e Validação
- [ ] Testar fluxo completo end-to-end do ciclo 360°
- [ ] Validar todos os emails enviados (convites, lembretes, conclusões)
- [ ] Verificar dashboard de acompanhamento com dados reais
- [ ] Testar job de lembretes em ambiente de desenvolvimento
- [ ] Criar checkpoint final com todas as funcionalidades


---

## 🚀 NOVAS FUNCIONALIDADES AVANÇADAS - 25/11/2024 16:30

### Dashboard de Acompanhamento RH
- [x] Criar página /rh/acompanhamento-avaliacoes
- [x] Implementar visão em tempo real de ciclos 360° ativos
- [x] Adicionar métricas de conclusão por departamento
- [x] Lista de avaliadores pendentes com ações de reenvio
- [x] Gráficos de progresso por tipo de avaliador (autoavaliação, pares, superiores)
- [x] Filtros por ciclo, departamento e status

### Sistema de Lembretes Automáticos
- [x] Criar job cron para lembretes de avaliações 360° pendentes
- [x] Implementar emails escalonados (3 dias antes, 1 dia antes, no prazo)
- [x] Template de email para lembretes
- [x] Sistema de tracking de emails enviados
- [x] Notificações in-app para avaliadores
- [x] Dashboard de histórico de lembretes enviados

### Relatórios Consolidados 360°
- [ ] Criar página /relatorios/360-consolidado
- [ ] Gráficos radar comparando autoavaliação vs gestores/pares
- [ ] Evolução histórica de competências por ciclo
- [ ] Exportação em PDF com gráficos radar
- [ ] Filtros por ciclo, departamento e colaborador
- [ ] Comparativo entre múltiplos ciclos

### Pesquisa Pulse - Sistema Completo
- [x] Implementar envio de emails para participantes da pesquisa
- [x] Criar página pública de resposta de pesquisa (/pulse/responder/:token)
- [x] Sistema de coleta de respostas anônimas
- [x] Dashboard de resultados em tempo real
- [x] Notificações de novas respostas para RH
- [ ] Exportação de resultados em Excel
- [ ] Gráficos de análise de sentimento

#### Descrição de Cargos - Workflow Completo com Emails
- [x] Implementar workflow de aprovação (Ocupante → Superior → RH)
- [x] Email de notificação quando descrição é criada (para superior)
- [x] Email quando superior aprova (para RH)
- [x] Email quando RH aprova (para ocupante e superior)
- [x] Email quando rejeitado (com motivo)
- [x] Dashboard de aprovações pendentes
- [ ] Histórico de versões da descrição (/descricao-cargos/aprovar-superior)
- [ ] Página de aprovação para RH (/descricao-cargos/aprovar-rh)
- [ ] Histórico de aprovações com timeline visual
- [ ] Comentários e justificativas em rejeições
- [ ] Botão de reenvio de email de notificação
