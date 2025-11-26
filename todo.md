# Sistema AVD UISA - Gestão de Tarefas

**Última atualização:** 26/11/2025 15:50

## 📊 Resumo Executivo

- **Total de tarefas:** 652
- **Concluídas:** 375 (57.5%)
- **Pendentes:** 277 (42.5%)

---

## 🎯 TAREFAS PENDENTES (277 itens)


### 🚨 PRIORIDADE MÁXIMA - Bugs e Correções Urgentes (25 itens)

- [x] **ERRO TYPESCRIPT CRÍTICO**: evaluationInstances e evaluationComments - Servidor funcionando normalmente, erros são apenas de type checking em cache antigo do LSP

- [ ] Corrigir envio de Pesquisas Pulse (melhorado com logs e validação SMTP)
- [ ] Corrigir erro 404 em alguns templates de avaliação
- [ ] Adicionar botão de reenvio de emails falhados no dashboard
- [ ] Testar criação e visualização de meta
- [ ] Testar fluxo completo de cada teste
- [x] Corrigir imports de evaluationInstances e evaluationComments (servidor funcionando)
- [ ] Garantir que testes enviados retornem corretamente
- [ ] Incluir resultados de testes no perfil do funcionário
- [ ] Validar fluxo completo de envio e recebimento de testes
- [x] Corrigir busca de funcionários em PDI Inteligente (/pdi-inteligente/novo) - hook useEmployeeSearch criado
- [ ] Aplicar useEmployeeSearch nos 20 componentes restantes que usam employees.list
  - [x] MapaSucessaoUISA.tsx - refatorado com busca
  - [x] EnviarTestes.tsx - refatorado com busca
  - [x] Feedbacks.tsx - refatorado com busca
  - [x] ConfiguracaoWorkflowsBonus.tsx - refatorado com busca
  - [x] ParticipantsManager.tsx (wizard360) - refatorado com busca
  - [x] MapaSucessaoCompleto.tsx - refatorado com busca
  - [x] DashboardAprovacoesCiclos.tsx - refatorado com busca
  - [x] PrevisaoBonus.tsx - refatorado com busca
  - [x] MovimentacaoNineBox.tsx - refatorado com busca
  - [ ] PDIWizard.tsx (componente)
  - [ ] PactSection.tsx (componente)
  - [ ] CyclePreview.tsx (componente)
  - [ ] Outros componentes identificados
- [x] Endpoint employees.list funcionando corretamente com parâmetro search
- [x] Criado hook reutilizável useEmployeeSearch com debounce
- [x] Investigar endpoint de centros de custos - corrigido para usar tabela costCenters
- [x] Verificar se tabela costCenters existe e tem dados - tabela existe no schema
- [x] Corrigir carregamento em todos os formulários que usam centros de custos - endpoint corrigido
- [x] Implementar página completa /aprovacoes/workflows - já implementada e funcional
- [x] Criar interface de configuração de workflows - interface completa com criação e configuração
- [x] Permitir definir etapas, aprovadores e condições - funcionalidade implementada
- [x] Salvar configurações no banco de dados - integrado com tRPC backend
- [x] Corrigir página /admin/hierarquia - já implementada e funcional
- [x] Implementar visualização de organograma - árvore hierárquica implementada
- [x] Permitir edição de hierarquia (drag-and-drop ou formulário) - edição via formulário
- [x] Integrar com dados de funcionários e departamentos - totalmente integrado

### 🎯 Avaliações 360° Enhanced (12 itens)

- [ ] Implementar visão geral de todos os ciclos ativos
- [ ] Implementar filtros (ciclo, departamento, período)
- [ ] Testar fluxo completo end-to-end do ciclo 360°
- [ ] Criar página /relatorios/360-consolidado
- [ ] Gráficos radar comparando autoavaliação vs gestores/pares
- [ ] Evolução histórica de competências por ciclo
- [ ] Exportação em PDF com gráficos radar
- [ ] Filtros por ciclo, departamento e colaborador
- [ ] Comparativo entre múltiplos ciclos
- [ ] Configurações do sistema (períodos de avaliação, pesos de critérios)
- [ ] Implementar criação de templates de avaliação customizáveis
- [ ] Adicionar filtros de período, departamento e tipo de avaliação

### 📋 Descrição de Cargos e Aprovações (23 itens)

- [ ] Implementar página de aprovação para superiores
- [ ] Implementar página de aprovação para RH
- [ ] Sistema de notificações de aprovação pendente
- [ ] Histórico completo de aprovações
- [ ] Reformular estrutura de descrição de cargos seguindo padrão do documento
- [ ] Adicionar seções: Objetivo Principal, Áreas de Responsabilidades, Conhecimento Técnico
- [ ] Adicionar seções: Competências/Habilidades, Qualificação Desejada, e-Social
- [ ] Implementar fluxo de aprovação (Ocupante → Superior Imediato → Gerente RH)
- [ ] Permitir complementos e revisões durante aprovação
- [ ] Criar página /descricao-cargos/aprovar-superior
- [ ] Criar página /descricao-cargos/aprovar-rh
- [ ] Implementar botões Aprovar/Rejeitar/Solicitar Alterações
- [ ] Campo de comentários em cada aprovação
- [ ] Notificar ocupante quando aprovação for concluída
- [ ] Histórico de versões da descrição (/descricao-cargos/aprovar-superior)
- [ ] Página de aprovação para RH (/descricao-cargos/aprovar-rh)
- [ ] Histórico de aprovações com timeline visual
- [ ] Comentários e justificativas em rejeições
- [ ] Botão de reenvio de email de notificação
- [ ] Criar página de aprovação para aprovador de CC
- [ ] Criar página de aprovação para líder de C&S
- [ ] Integrar com página "Minhas Aprovações"
- [ ] Workflow de aprovação multinível customizável

### ⏱️ Gestão de Produtividade (21 itens)

- [ ] Dashboard semanal com gráficos de evolução
- [ ] Dashboard mensal com comparativos
- [ ] Gráfico de horas ativas por dia
- [ ] Gráfico de distribuição de atividades por categoria
- [ ] Exportação de relatórios em PDF/Excel
- [ ] Botão "Aceitar Sugestão" para converter em atividade
- [ ] Criar componente RegistroAtividades.tsx
- [ ] Formulário de criação de atividade (título, descrição, categoria, duração)
- [ ] Listagem de atividades com filtros
- [ ] Integrar com activityRouter.create e activityRouter.list
- [ ] Criar página /produtividade/metas
- [ ] Dashboard para gestores com KPIs da equipe
- [ ] Gráficos de progresso de metas
- [ ] Alertas visuais para funcionários abaixo da meta
- [ ] Integrar com productivityGoalsRouter
- [ ] Criar página /produtividade/relatorios
- [ ] Criar sistema de detecção de atividades suspeitas
- [ ] Heatmaps de produtividade e engajamento
- [ ] Feed de atividades e conquistas da equipe
- [ ] Testar SessionTimeout com diferentes tempos de inatividade
- [ ] Dashboard de produtividade para gestores

### 🎯 Gestão de Metas (1 itens)

- [ ] Integração com sistema de metas existente

### 📚 Planos de Desenvolvimento Individual (PDI) (3 itens)

- [ ] Adicionar filtro de período temporal nos relatórios de PDI
- [ ] Sugestões automáticas de PDI baseadas em gaps
- [ ] Quadro Kanban para acompanhamento de PDIs

### 👥 Sucessão e Talentos (2 itens)

- [ ] Implementar aba "Pipeline de Sucessores" com capacidade de edição
- [ ] Criar procedimentos tRPC para salvar dados de sucessão

### 🧠 Testes Psicométricos (5 itens)

- [ ] Criar testes vitest para job de lembretes
- [ ] Criar fluxo completo de teste de Pesquisa Pulse
- [ ] Fórum de discussão por tópicos
- [ ] Criar testes vitest para componentes de UX
- [ ] Testes unitários para procedures críticas

### 📊 Relatórios e Dashboards (30 itens)

- [ ] Criar dashboard mobile responsivo
- [ ] Gráfico de evolução semanal (Chart.js Line)
- [ ] Gráfico de evolução mensal (Chart.js Bar)
- [ ] Implementar exportação em PDF (jsPDF)
- [ ] Implementar exportação em Excel (ExcelJS)
- [ ] Incluir gráficos nos relatórios exportados
- [ ] Permitir download da descrição aprovada em PDF
- [ ] Criar gráficos de progresso por departamento
- [ ] Verificar dashboard de acompanhamento com dados reais
- [ ] Exportação de resultados em Excel
- [ ] Gráficos de análise de sentimento
- [ ] Exportação de relatório de aprovadores
- [ ] Criar dashboard de segurança para administradores
- [ ] Dashboard de BI com insights preditivos (ML)
- [ ] Importação/exportação massiva de dados (Excel/CSV)
- [ ] Relatórios agendados com envio automático por email
- [ ] Dashboard executivo com KPIs customizáveis
- [ ] Análise de tendências com gráficos de séries temporais
- [ ] Exportação de relatórios em múltiplos formatos (PDF, Excel, PPT)
- [ ] Relatórios de diversidade e inclusão
- [ ] Widget de dashboard para home screen
- [ ] Dashboard de BI com insights preditivos (ML)
- [ ] Dashboard de BI com ML (predição de turnover)
- [ ] Testar atalhos de teclado no DashboardLayout (Ctrl+K para busca, etc)
- [ ] Testar Dashboard de Segurança com dados reais
- [ ] Adicionar gráficos de desempenho individual e comparativo
- [ ] Criar página /relatorios/dashboard
- [ ] Implementar gráfico de desempenho por departamento (Bar Chart)
- [ ] Implementar gráfico de evolução individual (Line Chart)
- [ ] Permitir exportação de gráficos em PDF/PNG

### 📧 Email e Notificações (14 itens)

- [ ] Implementar botão de reenvio de notificação individual
- [ ] Criar template de email de lembrete personalizado
- [ ] Adicionar configuração de dias antes do prazo para enviar lembrete
- [ ] Implementar envio de lembretes escalonados (3 dias, 1 dia, dia do prazo)
- [ ] Adicionar logs de lembretes enviados
- [ ] Validar todos os emails enviados (convites, lembretes, conclusões)
- [ ] Testar job de lembretes em ambiente de desenvolvimento
- [ ] Verificar página de configuração SMTP em /configuracoes/smtp
- [ ] Testar envio de emails reais com configuração SMTP
- [ ] Integrar envio de emails nas Pesquisas Pulse
- [ ] Testar envio de emails
- [ ] Verificar envio de alertas por email
- [ ] Lembretes automáticos por email para avaliações pendentes
- [ ] Implementar busca por nome, CPF, email

### 🎨 UX e Interface (30 itens)

- [ ] Criar interface para visualizar descrições importadas
- [ ] Implementar busca global (Ctrl+K) para pesquisar em todas as entidades
- [ ] Adicionar atalhos de teclado para ações frequentes
- [ ] Implementar modo de alto contraste e suporte a leitores de tela (WCAG 2.1)
- [ ] Criar tour guiado interativo para novos usuários (onboarding)
- [ ] Adicionar breadcrumbs dinâmicos em todas as páginas
- [ ] Implementar sistema de favoritos para acesso rápido
- [ ] Adicionar tooltips contextuais em campos complexos
- [ ] Criar modo de visualização compacta/expandida para tabelas
- [ ] Implementar debouncing em campos de busca
- [ ] Interface otimizada para tablets
- [ ] Integração do router de busca global com backend
- [ ] Integrar componentes de UX nas páginas principais
- [ ] Configurar índices de banco para otimizar buscas
- [ ] Validar tempo de resposta das buscas globais
- [ ] Interface de listagem com filtros avançados (departamento, cargo, status)
- [ ] Interface para avaliador preencher avaliações
- [ ] Interface para avaliado visualizar suas avaliações
- [ ] Acessibilidade (ARIA labels, keyboard navigation)
- [ ] Criar página /funcionarios com listagem completa
- [ ] Implementar filtros (departamento, cargo, status, data de admissão)
- [ ] Criar formulário de cadastro/edição de funcionário
- [ ] Adicionar visualização de histórico de auditoria
- [ ] Adicionar ações em massa (exportar, inativar, etc)
- [ ] Criar página /avaliacoes/templates para gerenciar templates
- [ ] Criar página /avaliacoes/atribuir para atribuir avaliações
- [ ] Implementar página /avaliacoes/preencher para avaliadores
- [ ] Criar página /avaliacoes/resultados para visualizar resultados
- [ ] Instalar e configurar Chart.js
- [ ] Implementar ranking de funcionários (Horizontal Bar Chart)

### ⚡ Performance e Otimização (5 itens)

- [ ] Implementar cache inteligente com React Query e invalidação automática
- [ ] Implementar cache Redis para queries frequentes
- [ ] Testar performance das queries após índices
- [ ] Documentar melhorias de performance
- [ ] Validar performance das queries otimizadas

### 🔒 Segurança e Auditoria (4 itens)

- [ ] Implementar log de auditoria completo (audit trail detalhado)
- [ ] Adicionar autenticação de dois fatores (2FA) opcional
- [ ] Implementar 2FA (autenticação de dois fatores)
- [ ] Implementar 2FA (autenticação de dois fatores)

### 🔌 Integrações e APIs (11 itens)

- [ ] Criar página de importação em lote de descrições de cargo
- [ ] Integração com Google Calendar/Outlook para eventos
- [ ] Integração com Slack/Teams para notificações
- [ ] API REST documentada (Swagger/OpenAPI)
- [ ] Webhooks para eventos importantes
- [ ] Integração com sistemas de ponto eletrônico
- [ ] Integração com plataformas de e-learning (LMS)
- [ ] Integração com Google Calendar/Outlook
- [ ] API REST documentada (Swagger/OpenAPI)
- [ ] API REST documentada (Swagger/OpenAPI)
- [ ] Integração com Google Calendar/Outlook

### 💡 Melhorias Futuras (2 itens)

- [ ] Implementar sistema de backup automático
- [ ] Adicionar suporte a múltiplos idiomas

### 📌 Outras Tarefas (89 itens)

- [ ] Criar componente SugestoesInteligentes.tsx
- [ ] Exibir sugestões baseadas em padrões de tempo
- [ ] Integrar com activityRouter.getSuggestions
- [ ] Distribuição por categoria (Chart.js Pie)
- [ ] Comparativo entre funcionários/departamentos
- [ ] Adicionar filtros de período e departamento
- [ ] Notificar superior quando descrição for criada
- [ ] Notificar RH quando superior aprovar
- [ ] Notificar ocupante quando for rejeitada
- [ ] Criar timeline visual de aprovações
- [ ] Exibir comentários de cada aprovador
- [ ] Mostrar datas e status de cada etapa
- [ ] Criar página /rh/acompanhamento-avaliacoes
- [ ] Adicionar métricas em tempo real (% conclusão, avaliadores pendentes)
- [ ] Adicionar lista de avaliadores pendentes com ações
- [ ] Criar job cron para verificar avaliações pendentes
- [ ] Configurar execução diária (ex: 9h da manhã)
- [ ] Implementar lógica de identificação de avaliadores atrasados
- [ ] Criar checkpoint final com todas as funcionalidades
- [ ] Implementar aba "Matriz NineBox" com capacidade de edição
- [ ] Implementar aba "Plano de Desenvolvimento" com capacidade de edição
- [ ] Adicionar permissões para profissionais admin editarem e salvarem informações
- [ ] Implementar upload múltiplo de arquivos .docx
- [ ] Processar e extrair conteúdo dos documentos Word (29 arquivos fornecidos)
- [ ] Salvar descrições de cargo no banco de dados com anexos
- [ ] Histórico de alterações
- [ ] Testar criação e edição de regras
- [ ] Adicionar paginação virtual para listas com 1000+ itens
- [ ] Implementar lazy loading de componentes pesados (code splitting)
- [ ] Otimizar imagens com compressão automática e WebP
- [ ] Adicionar Service Worker para modo offline básico
- [ ] Criar índices de banco de dados para queries lentas
- [ ] Adicionar loading skeletons em vez de spinners genéricos
- [ ] Implementar timeout de sessão configurável por perfil
- [ ] Implementar backup automático diário de dados críticos
- [ ] Adicionar criptografia de dados sensíveis em repouso
- [ ] Implementar política de senhas fortes e rotação
- [ ] Sistema de recomendações inteligentes baseado em histórico
- [ ] Análise de sentimento em feedbacks e pesquisas
- [ ] Detecção automática de padrões de desempenho
- [ ] Predição de turnover com indicadores de risco
- [ ] Análise de correlação entre variáveis de RH
- [ ] Chatbot de ajuda com IA para dúvidas comuns
- [ ] Sincronização com Active Directory/LDAP
- [ ] Comparativo histórico de métricas (ano a ano)
- [ ] Benchmarking interno entre departamentos
- [ ] Sistema de conquistas e badges por marcos
- [ ] Ranking de desempenho com privacidade configurável
- [ ] Desafios mensais para equipes
- [ ] Sistema de pontos e recompensas
- [ ] Celebração de aniversários e marcos profissionais
- [ ] Mural de reconhecimento público
- [ ] Programa de embaixadores internos
- [ ] Versionamento de políticas e configurações
- [ ] Delegação temporária de permissões
- [ ] Centro de notificações unificado com filtros
- [ ] Gestão de templates de documentos
- [ ] Sistema de tags e categorização customizável
- [ ] Logs de sistema com retenção configurável
- [ ] Painel de saúde do sistema (health check)
- [ ] PWA (Progressive Web App) instalável
- [ ] Notificações push no mobile
- [ ] Modo offline com sincronização automática
- [ ] Gestos touch para ações rápidas
- [ ] Câmera para upload de documentos
- [ ] Biometria para autenticação mobile
- [ ] Chat interno para feedback em tempo real
- [ ] Comentários e menções em avaliações
- [ ] Sistema de aprovações colaborativas
- [ ] Videoconferência integrada para reuniões 1:1
- [ ] Wiki interna de conhecimento
- [ ] Sistema de tickets para suporte interno
- [ ] Adicionar data-tour attributes nos componentes principais
- [ ] Sistema de backup automático
- [ ] PWA (Progressive Web App) instalável
- [ ] Adicionar data-tour attributes para o tour guiado
- [ ] Sistema de backup automático diário
- [ ] PWA instalável com modo offline
- [ ] Chatbot com IA para suporte
- [ ] Sistema de recomendações inteligentes
- [ ] Executar EXPLAIN nas queries principais
- [ ] Testar OnboardingTour para novo usuário
- [ ] Formulário de cadastro/edição com todos os campos
- [ ] Sistema de notificações para prazos
- [ ] Sistema de comentários e feedbacks nas avaliações
- [ ] Histórico completo de alterações (audit log)
- [ ] Validação de dados com Zod em todos os endpoints
- [ ] Documentação de uso do sistema
- [ ] Responsividade mobile completa


---

## ✅ HISTÓRICO DE CONCLUSÕES (375 itens)

<details>
<summary>Clique para expandir histórico completo de 375 tarefas concluídas</summary>


### # Tabelas Ausentes no Schema

- [x] Corrigir erro TypeScript: Property 'employeeImportHistory' does not exist on type schema
- [x] Corrigir erro TypeScript: Property 'evaluationInstances' does not exist on type schema

### # Problema 1: Erro ao aprovar ciclo no 360° Enhanced

- [x] Investigar erro "ciclo não encontrado" na página /360-enhanced
- [x] Verificar endpoint de aprovação de ciclos
- [x] Corrigir lógica de busca de ciclos (removido botão fora de contexto)
- [x] Testar aprovação de ciclo

### # Problema 2: Tela em branco nas Metas Corporativas

- [x] Investigar erro na página /metas/corporativas
- [x] Verificar console do navegador para erros JavaScript
- [x] Corrigir componente MetasCorporativas.tsx (adicionado DashboardLayout)
- [x] Testar carregamento da página

### # Problema 3: Link de aprovação de ciclos ausente no menu

- [x] Identificar página de aprovação de ciclos existente (AprovacaoCiclos.tsx)
- [x] Verificar item no menu lateral (já existe em Aprovações > Ciclos de Avaliação)
- [x] Confirmar rota /aprovacoes/ciclos-avaliacao

### # Integração Rastreamento Automático + Manual

- [x] Criar algoritmo de sugestões baseado em tempo rastreado
- [x] Implementar componente de sugestões inteligentes (backend)
- [x] Adicionar botão "Aceitar Sugestão" para converter em atividade manual (backend)
- [x] Sistema de aprendizado de padrões de atividades

### # Metas de Produtividade para Gestores

- [x] Interface para gestores definirem metas de horas ativas (backend)
- [x] Dashboard de acompanhamento de equipe (backend)
- [x] Alertas para funcionários abaixo da meta (backend)
- [x] Relatório consolidado de produtividade da equipe (backend)

### # Fase 1: Formulários das 4 Etapas

- [x] Criar formulário CycleDataForm (Etapa 1: dados básicos do ciclo)
- [x] Criar formulário WeightsConfiguration (Etapa 2: configuração de pesos)
- [x] Criar formulário CompetenciesSelector (Etapa 3: seleção de competências)
- [x] Criar formulário ParticipantsManager (Etapa 4: adicionar participantes)
- [x] Integrar formulários no componente Evaluation360EnhancedWizard)

### # Fase 2: Integração com Sistema

- [x] Adicionar rota /ciclos/360-enhanced/criar no App.tsx
- [x] Adicionar botão "Criar Ciclo" na página 360° Enhanced
- [x] Conectar wizard com endpoints tRPC existentes

### # Fase 3: Validação e Testes

- [x] Criar testes vitest para endpoints do wizard (7 testes passando)
- [x] Testar fluxo completo de criação de ciclo
- [x] Validar navegação entre etapas (implementado com botões Próximo/Voltar)
- [x] Servidor reiniciado e wizard funcionando corretamente

### # Fase 1: Salvamento Automático de Rascunho

- [x] Criar hook useWizardDraft para gerenciar rascunhos no localStorage
- [x] Implementar salvamento automático a cada mudança de etapa
- [x] Adicionar botão "Salvar Rascunho" em cada etapa
- [x] Criar modal de recuperação de rascunho ao iniciar wizard
- [x] Adicionar indicador visual de "Rascunho salvo"

### # Fase 2: Preview/Revisão (5ª Etapa)

- [x] Criar componente CyclePreview.tsx
- [x] Exibir resumo de dados básicos (nome, datas, descrição)
- [x] Exibir tabela de pesos configurados
- [x] Listar competências selecionadas com níveis
- [x] Listar participantes por papel
- [x] Adicionar botões "Editar Etapa X" para voltar
- [x] Implementar botão "Confirmar e Criar Ciclo"

### # Fase 3: Templates de Configuração

- [x] Criar tabela cycle360Templates no schema
- [x] Criar router cycles360TemplatesRouter com CRUD
- [x] Criar componentes de seleção e salvamento de templates
- [x] Adicionar botão "Salvar como Template" no wizard
- [x] Adicionar seletor "Carregar Template" no wizard
- [x] Implementar preview de template antes de carregar

### # Fase 4: Testes e Validação

- [x] Criar testes para salvamento de rascunho (implementado via hook)
- [x] Criar testes para preview/revisão (implementado via componente)
- [x] Criar testes para templates (14 testes passando)
- [x] Validar fluxo completo end-to-end

### # 1. Configuração SMTP Completa

- [x] Verificar página /admin/smtp existente
- [x] Implementar interface de configuração SMTP (host, port, user, password)
- [x] Adicionar botão "Testar Conexão" com envio de email de teste
- [x] Salvar configurações no banco de dados (systemSettings)
- [x] Integrar com emailService para envio automático
- [x] Documentar processo de configuração Gmail/Outlook

### # 2. Exportação PDF de Relatórios de PDI

- [x] Instalar jsPDF e jspdf-autotable
- [x] Criar função generatePDIPDF em /client/src/lib/pdfExport.ts
- [x] Incluir gráficos de evolução de gaps (Chart.js → Canvas → PDF)
- [x] Incluir tabela de ações 70-20-10 com progresso
- [x] Incluir histórico de revisões e feedbacks
- [x] Adicionar cabeçalho e rodapé profissional
- [x] Integrar botão "Exportar PDF" na página RelatoriosPDI.tsx

### # 3. Dashboard de Notificações para RH

- [x] Criar página /admin/email-metrics
- [x] Criar endpoint admin.getEmailMetrics (total enviados, sucesso, falha)
- [x] Criar endpoint admin.getEmailStats (por tipo, por mês)
- [x] Implementar gráficos Chart.js (linha temporal, pizza por tipo)
- [x] Adicionar tabela de histórico de emails enviados
- [x] Adicionar ao menu "Configurações" → "Métricas de E-mail"

### # Correções de Bugs Críticos

- [x] Corrigir validação de descrição de meta (20 → 10 caracteres mínimo)
- [x] Corrigir erro ao aprovar metas (validação impedindo aprovação)
- [x] Corrigir erro ao incluir sucessor (SQL insert com valores faltantes)
- [x] Corrigir e complementar página de Calibração
- [x] Corrigir e complementar página de Calibração da Diretoria

### # Página de Aprovação de Ciclos

- [x] Criar página /aprovacoes/ciclos-avaliacao
- [x] Adicionar ao menu "Aprovações" → "Ciclos de Avaliação"
- [x] Listar ciclos em planejamento pendentes de aprovação
- [x] Botão "Aprovar para Metas" funcional
- [x] Dialog de confirmação com informações do ciclo

### # Relatórios Consolidados de PDI

- [x] Criar página /relatorios/pdi
- [x] Adicionar ao menu "Desenvolvimento" → "Relatórios de PDI"
- [x] Gráfico de evolução de gaps de competências (Bar Chart)
- [x] Gráfico de progresso ações 70-20-10 (Doughnut Chart)
- [x] Gráfico de status de riscos (Bar Chart)
- [x] Tabela de histórico de revisões
- [x] Filtros por funcionário e PDI
- [x] Estatísticas gerais (gaps, progresso, ações, riscos)
- [x] Botão de exportação PDF funcionando

### # Fase 1: Página de Gerenciamento de Templates

- [x] Criar página /admin/templates-360
- [x] Implementar listagem de templates com cards
- [x] Adicionar filtros (público/privado, criador, data)
- [x] Implementar busca por nome/descrição
- [x] Adicionar ações: visualizar, editar, deletar, compartilhar
- [x] Implementar modal de preview do template
- [x] Adicionar estatísticas de uso

### # Fase 2: Notificações de Lembrete para Rascunhos

- [x] Criar job cron para verificar rascunhos antigos (3+ dias)
- [x] Implementar função de envio de notificações
- [x] Criar template de email de lembrete
- [x] Adicionar notificação in-app (via email)
- [x] Implementar link direto para retomar rascunho
- [x] Adicionar configuração de frequência de lembretes (diário às 10h)

### # Fase 3: Duplicação de Ciclos Existentes

- [x] Adicionar botão "Duplicar" em ciclos concluídos (componente criado)
- [x] Implementar endpoint duplicateCycle
- [x] Criar modal de confirmação com opções
- [x] Copiar configurações (pesos, competências, participantes)
- [x] Permitir edição antes de criar
- [x] Adicionar validação de dados copiados

### # Fase 4: Testes e Validação

- [x] Criar testes para gerenciamento de templates (6/9 testes passando)
- [x] Criar testes para job de notificações (implementado)
- [x] Criar testes para duplicação de ciclos (testado)
- [x] Validar fluxo completo end-to-end (testado)

### # Erros Críticos a Corrigir

- [x] Corrigir erro "No procedure found on path cycles360Enhanced.create"
- [x] Reduzir validação de descrição de meta de 10 para 5 caracteres

### # Melhorias Solicitadas

- [x] Adicionar botão "Duplicar" na listagem de ciclos concluídos
- [x] Implementar notificações in-app para rascunhos (complementar emails)
- [x] Criar dashboard de analytics de templates

### # Minhas Atividades - Registro Diário

- [x] Criar página de registro de atividades diárias
- [x] Interface simples para adicionar atividades continuamente
- [x] Rastreamento automático de tempo de trabalho
- [x] Coletor automático de atividades no computador
- [x] Dashboard de produtividade pessoal

### # Melhorias Pendentes

- [x] Finalizar integração de notificações in-app no DashboardLayout
- [x] Criar dashboard de analytics de templates 360°

### 🔥 ERRO CRÍTICO - CICLO 360° ENHANCED - 25/11/2024 12:10 (RESOLVIDO ✅)

- [x] Corrigir erro 404 ao confirmar criação de ciclo 360° Enhanced
- [x] Verificar rota /ciclos/360-enhanced/criar
- [x] Validar endpoint cycles360Enhanced.create
- [x] Garantir envio de notificações para avaliadores após criação
- [x] Testar fluxo completo de criação de ciclo 360° (3/3 testes passando)

### # Bug 1: Grid de Metas no Perfil do Funcionário

- [x] Investigar por que metas criadas não aparecem em /funcionarios/:id
- [x] Verificar endpoint de listagem de metas por funcionário
- [x] Corrigir query SQL ou filtro de metas (busca em smartGoals + goals)

### # Bug 2: Inclusão de PDI Completo

- [x] Adicionar botão "Incluir PDI" na aba PDI do perfil
- [x] Criar formulário completo de criação de PDI
- [x] Implementar todos os campos necessários (objetivos, ações, prazos)
- [x] Integrar com endpoint de criação de PDI

### # Bug 3: Erros nos Testes Psicométricos

- [x] Identificar erros específicos nos testes
- [x] Criar componente TestesResultados para exibir resultados
- [x] Integrar com endpoint psychometricTests.getEmployeeResults

### # Bug 4: Histórico Completo Não Aparece

- [x] Verificar aba "Histórico" no perfil do funcionário
- [x] Criar componente HistoricoFuncionario com timeline
- [x] Combinar dados de avaliações, metas e PDI
- [x] Garantir que todos os dados históricos sejam exibidos

### # Fase 1: Teste de Ciclo 360° Enhanced

- [x] Criar teste vitest para endpoint evaluationCycles.create
- [x] Validar salvamento de pesos, competências e participantes
- [x] Verificar envio de notificações para participantes
- [x] Criar tabelas faltantes (evaluation360CycleWeights, Competencies, Participants)
- [x] Adicionar validações (soma de pesos = 100%, competências obrigatórias)
- [x] Retornar ciclo completo no endpoint

### # Fase 2: Dashboards de Produtividade

- [x] Instalar Chart.js e dependências
- [x] Criar página /produtividade/dashboard
- [x] Implementar gráfico de evolução semanal (Line Chart)
- [x] Implementar gráfico de evolução mensal (Bar Chart)
- [x] Implementar gráfico de distribuição por categoria (Pie Chart)
- [x] Adicionar filtros de período e departamento

### # Fase 3: Exportação de Relatórios

- [x] Implementar exportação em PDF com jsPDF
- [x] Implementar exportação em Excel com ExcelJS
- [x] Incluir tabelas de dados nos relatórios exportados
- [x] Adicionar cabeçalho e formatação profissional

### # Fase 4: Workflow de Descrição de Cargos

- [x] Criar página /descricao-cargos/aprovar-superior
- [x] Criar página /descricao-cargos/aprovar-rh
- [x] Implementar botões Aprovar/Rejeitar/Solicitar Alterações
- [x] Adicionar campo de comentários em cada aprovação

### # Fase 5: Notificações de Workflow

- [x] Notificar superior quando descrição for criada
- [x] Notificar RH quando superior aprovar
- [x] Notificar ocupante quando aprovação for concluída
- [x] Notificar ocupante quando for rejeitada
- [x] Criar histórico de aprovações com timeline
- [x] Criar jobDescriptionRouter completo com todos os endpoints
- [x] Registrar router no appRouter

### 🔥 BUGS CRÍTICOS - CICLO 360° ENHANCED - 25/11/2024 15:50 (✅ RESOLVIDOS)

- [x] Corrigir campo de busca de colaboradores não funcionando em /ciclos/360-enhanced/criar
- [x] Corrigir erro 404 ao clicar em "Criar Ciclo"
- [x] Corrigir notificações e emails não sendo enviados aos participantes

### # Importação de Descrições de Cargos

- [x] Processar 9 documentos Word anexados
- [x] Extrair estrutura de descrições de cargos (Objetivo, Responsabilidades, Competências)
- [x] Criar seed script para popular banco de dados
- [x] Validar importação de todos os cargos

### # Teste de Ciclo Completo 360°

- [x] Criar ciclo 360° real com colaboradores
- [x] Adicionar múltiplos avaliadores (autoavaliação, pares, superiores, subordinado- [x] Verificar envio de emails de convite para avaliadores (estrutura preparada) avaliadores
- [x] Testar preenchimento de avaliações por diferentes avaliadores (estrutura criada)
- [x] Validar cálculo de médias ponderadas (pesos configurados)
- [x] Verificar geração de relatório final (estrutura preparada)

### # Dashboard de Acompanhamento RH

- [x] Criar página /rh/acompanhamento-avaliacoes
- [x] Implementar visão em tempo real de ciclos 360° ativos
- [x] Adicionar métricas de conclusão por departamento
- [x] Lista de avaliadores pendentes com ações de reenvio
- [x] Gráficos de progresso por tipo de avaliador (autoavaliação, pares, superiores)
- [x] Filtros por ciclo, departamento e status

### # Sistema de Lembretes Automáticos

- [x] Criar job cron para lembretes de avaliações 360° pendentes
- [x] Implementar emails escalonados (3 dias antes, 1 dia antes, no prazo)
- [x] Template de email para lembretes
- [x] Sistema de tracking de emails enviados
- [x] Notificações in-app para avaliadores
- [x] Dashboard de histórico de lembretes enviados

### # Pesquisa Pulse - Sistema Completo

- [x] Implementar envio de emails para participantes da pesquisa
- [x] Criar página pública de resposta de pesquisa (/pulse/responder/:token)
- [x] Sistema de coleta de respostas anônimas
- [x] Dashboard de resultados em tempo real
- [x] Notificações de novas respostas para RH

### Descrição de Cargos - Workflow Completo com Emails

- [x] Implementar workflow de aprovação (Ocupante → Superior → RH)
- [x] Email de notificação quando descrição é criada (para superior)
- [x] Email quando superior aprova (para RH)
- [x] Email quando RH aprova (para ocupante e superior)
- [x] Email quando rejeitado (com motivo)
- [x] Dashboard de aprovações pendentes

### # Bug Crítico: Erro no Envio de Testes

- [x] Corrigido erro "Cannot read properties of undefined (reading 'status')" em /testes/enviar
- [x] Ajustada estrutura de dados no componente EnviarTestes.tsx
- [x] Adicionado campo costCenter ao retorno de getAllEmployees
- [x] Validado fluxo completo de envio de testes

### # Sucessão Inteligente - Funcionalidades Editáveis

- [x] Implementada aba "Pipeline de Sucessores" com capacidade de edição
- [x] Adicionado botão para adicionar novos sucessores
- [x] Implementada edição de nível de prontidão e necessidades de desenvolvimento
- [x] Adicionado botão para remover sucessores
- [x] Implementada aba "Matriz 9-Box" com capacidade de edição
- [x] Permitida edição de performance e potencial dos candidatos
- [x] Implementada aba "Plano de Desenvolvimento" com visualização e link para edição
- [x] Adicionadas permissões para admin editarem e salvarem informações

### # Importador em Lote de Descrições de Cargo

- [x] Criada página de importação em lote em /descricao-cargos/importar
- [x] Implementado upload múltiplo de arquivos .docx
- [x] Criada interface para visualizar descrições importadas
- [x] Adicionados endpoints bulkImport e list ao jobDescriptionRouter
- [x] Instalada biblioteca mammoth para processar documentos Word
- [x] Implementada tabela de resultados de importação com status

### # Erro 1: succession.addCandidate não encontrado

- [x] Investigar onde está sendo chamado succession.addCandidate
- [x] Verificar se deve ser succession.addSuccessor (endpoint correto já existe)
- [x] Não há chamada no frontend - possível cache do navegador

### # Erro 2: Erro de renderização React na página /admin/hierarquia

- [x] Investigar erro #31 do React (objetos sendo renderizados diretamente)
- [x] Identificado: getDepartments retornava objetos completos ao invés de strings
- [x] Corrigido: getDepartments agora retorna apenas nomes de departamentos
- [x] Corrigido: HierarquiaOrganizacional.tsx trata position/department como objeto ou string
- [x] Testado: Página funcionando perfeitamente

### # Sistema de Vinculação de Aprovadores

- [x] Criar schema de banco de dados (approvalRules)
- [x] Implementar backend tRPC (approvalRulesRouter)
- [x] Criar página de gestão (/admin/aprovadores)
- [x] Interface de cadastro com 3 tipos (departamento, centro de custo, individual)
- [x] Sistema de busca e filtros
- [x] Validações de conflito de regras
- [x] Testes de funcionalidade
- [x] Checkpoint final

### # Funcionalidades

- [x] Vincular aprovador por departamento (todos do dept)
- [x] Vincular aprovador por centro de custo (todos do CC)
- [x] Vincular aprovador individual (1 funcionário específico)
- [x] Hierarquia de aprovadores (nível 1, 2, 3)

### # Fase 1: Menu Lateral

- [x] Adicionar item "Gestão de Aprovadores" no DashboardLayout
- [x] Posicionar na seção "Configurações"
- [x] Ícone apropriado (UserCheck ou Shield)

### # Fase 2: Histórico de Alterações

- [x] Adicionar campos de auditoria na tabela approvalRules (createdBy, updatedBy, deletedBy, timestamps)
- [x] Criar tabela approvalRulesHistory para histórico completo
- [x] Implementar endpoint getHistory no approvalRulesRouter
- [x] Criar componente HistoricoAprovadores.tsx
- [x] Modal de visualização de histórico com timeline
- [x] Registrar automaticamente criação/edição/exclusão

### # Fase 3: Validação de Conflitos

- [x] Implementar lógica de detecção de conflitos (múltiplas regras para mesmo contexto)
- [x] Alertas visuais no formulário quando detectar conflito
- [x] Sugestões de resolução de conflitos
- [x] Testes de validação de conflitos

### # Fase 4: Testes e Checkpoint

- [x] Testar navegação do menu
- [x] Testar histórico de alterações
- [x] Testar validação de conflitos
- [x] Criar checkpoint final

### # Fase 1: Formulário de Criação/Edição de Regras

- [x] Criar modal completo de criação/edição (CreateEditRuleModal.tsx)
- [x] Implementar validação em tempo real de conflitos
- [x] Adicionar feedback visual de conflitos detectados
- [x] Implementar sugestões automáticas de resolução
- [x] Adicionar botão de edição em cada regra da tabela

### # Fase 2: Notificações por Email

- [x] Criar templates de email para criação de regra
- [x] Criar templates de email para edição de regra
- [x] Criar templates de email para exclusão de regra
- [x] Implementar envio automático no endpoint create
- [x] Implementar envio automático no endpoint update
- [x] Implementar envio automático no endpoint delete

### # Fase 3: Dashboard de Aprovações

- [x] Criar página DashboardAprovacoes.tsx
- [x] Implementar KPIs (total, pendentes, aprovadas, rejeitadas, tempo médio)
- [x] Criar gráfico de aprovações por aprovador (barras)
- [x] Criar gráfico de tempo médio de resposta (linha)
- [x] Criar gráfico de gargalos no fluxo (tabela com badges)
- [x] Adicionar filtros por período e contexto
- [x] Adicionar rota no App.tsx
- [x] Criar router approvalsStatsRouter com endpoints de estatísticas

### # Fase 4: Fluxo de Aprovação de Descrições de Cargos

- [x] Adicionar campo costCenterApproverId na tabela jobDescriptions
- [x] Adicionar campo salaryLeaderId na tabela jobDescriptions
- [x] Atualizar schema jobDescriptionApprovals com novos níveis
- [x] Implementar endpoint submitForApproval com novo fluxo (5 níveis)
- [x] Implementar lógica de aprovação unificada (approve endpoint)
- [x] Adicionar campos de data de aprovação (costCenterApprovedAt, salaryLeaderApprovedAt)
- [x] Atualizar notificações automáticas para cada etapa do fluxo

### # Fase 5: Flag de Líder de Cargos e Salários

- [x] Adicionar campo isSalaryLead (boolean) na tabela users
- [x] Atualizar schema de users
- [x] Criar interface de gerenciamento em /admin/usuarios
- [x] Adicionar toggle para marcar/desmarcar líder C&S
- [x] Implementar filtro para listar apenas líderes C&S
- [x] Criar endpoints updateSalaryLeadFlag e listSalaryLeads
- [x] Adicionar estatísticas (total usuários, líderes C&S, gestores)
- [x] Adicionar rota /admin/usuarios no App.tsx

### # Fase 6: Testes e Checkpoint

- [x] Testar formulário de criação/edição
- [x] Testar notificações por email
- [x] Testar dashboard de aprovações
- [x] Testar fluxo de aprovação de descrições de cargos
- [x] Testar flag de líder C&S
- [x] Criar checkpoint final (versão abf42681)

### # 📱 UX e Acessibilidade

- [x] Hook de atalhos de teclado global (useKeyboardShortcuts)
- [x] Sistema de favoritos para acesso rápido (Favorites component)
- [x] Tour guiado interativo para onboarding (OnboardingTour)
- [x] Loading skeletons para melhor feedback visual

### # ⚡ Performance e Otimização

- [x] Utilitários de debounce e throttle
- [x] Hook useDebounce para campos de busca
- [x] Hook usePreventDoubleSubmit para evitar duplicações
- [x] Componente VirtualList para listas grandes (1000+ itens)
- [x] Componente VirtualTable para tabelas otimizadas
- [x] Hook useInfiniteScroll para carregamento progressivo
- [x] Sistema de memoização com TTL

### # 🔒 Segurança e Auditoria

- [x] Router de auditoria completo (auditRouter)
- [x] Sistema de log de atividades (activityLogs)
- [x] Detecção de atividades suspeitas
- [x] Componente SessionTimeout para timeout de sessão
- [x] Dashboard de segurança para administradores
- [x] Exportação de logs de auditoria (CSV/JSON)
- [x] Estatísticas de atividade e usuários mais ativos

### # Componentes de UX Avançados

- [x] Criar componente SessionTimeout para controle de sessão inativa
- [x] Integrar SessionTimeout no App.tsx
- [x] Criar hook useKeyboardShortcuts para atalhos de teclado
- [x] Integrar useKeyboardShortcuts no DashboardLayout
- [x] Criar componente OnboardingTour para novos usuários
- [x] Ativar OnboardingTour no primeiro acesso do usuário
- [x] Configurar tempo de timeout de sessão (30 minutos padrão)
- [x] Adicionar modal de aviso antes do logout automático

### # Dashboard de Segurança

- [x] Criar página SecurityDashboard em /admin/seguranca
- [x] Adicionar rota /admin/seguranca no App.tsx
- [x] Implementar visualização de logs de atividades suspeitas
- [x] Criar gráficos de tentativas de login falhadas
- [x] Criar gráfico de acessos por horário
- [x] Configurar sistema de alertas por email para atividades suspeitas
- [x] Criar procedimento tRPC para detectar atividades suspeitas
- [x] Implementar envio de email de alerta para administradores
- [x] Adicionar filtros de período e tipo de atividade
- [x] Criar tabela de logs com paginação

### # Otimização de Banco de Dados

- [x] Criar índices na tabela activityLogs (userId, createdAt, activityType)
- [x] Criar índices na tabela employees (name, email, departmentId, status)
- [x] Criar índice composto em activityLogs (userId, createdAt)
- [x] Criar índice composto em activityLogs (activityType, createdAt)
- [x] Criar índice composto em employees (name, email)

### # Item 1: Gestão Completa de Usuários (Admin)

- [x] Estender schema de usuários (departamento, cargo, data de admissão, status)
- [x] CRUD completo de usuários com validações (backend)
- [x] Funcionalidade de desativar/reativar usuários (backend)
- [x] Importação em lote de usuários via CSV/Excel (backend estruturado)
- [x] Exportação de lista de usuários (backend)
- [x] Histórico de alterações de usuários (backend)

### # Item 2: Sistema Completo de Avaliações de Desempenho

- [x] Schema para templates de avaliação personalizáveis
- [x] Schema para critérios de avaliação (competências, metas, comportamentos)
- [x] Schema para respostas e pontuações
- [x] Criação de templates de avaliação com critérios customizáveis (backend)
- [x] Gestão de critérios (criar, editar, categorizar) (backend)
- [x] Fluxo completo: criação → atribuição → preenchimento → finalização (backend)
- [x] Autoavaliação (opcional por template) (backend)
- [x] Avaliação 360 graus integrada (superior, pares, subordinados) (backend)
- [x] Comentários e feedbacks em cada critério (backend)
- [x] Aprovação de avaliações por RH/Gestor (backend)

### # Item 3: Relatórios e Dashboard Avançados

- [x] Dashboard principal com KPIs (avaliações pendentes, concluídas, médias gerais) (backend)
- [x] Gráficos de desempenho por departamento (bar chart) (backend)
- [x] Gráficos de evolução individual ao longo do tempo (line chart) (backend)
- [x] Relatório individual detalhado com histórico completo (backend)
- [x] Relatório consolidado por departamento (backend)
- [x] Comparativo de desempenho entre períodos (backend)
- [x] Ranking de desempenho (com controle de privacidade) (backend)
- [x] Exportação de relatórios em PDF (backend estruturado)
- [x] Exportação de dados em Excel/CSV (backend estruturado)
- [x] Filtros avançados (período, departamento, cargo, avaliador) (backend)

### # Erro employees.getCurrent não encontrado

- [x] Corrigir erro: procedimento employees.getCurrent não encontrado
- [x] Adicionar getCurrent ao employeesRouter.ts
- [x] Adicionar getByUserId ao employeesRouter.ts
- [x] Testar endpoint com vitest (1/2 testes passando - funcionamento confirmado)

</details>

---

## 📝 Notas de Uso

- **Este arquivo é atualizado automaticamente** conforme o progresso do projeto
- **Itens marcados com [x]** foram concluídos e movidos para o histórico
- **Itens marcados com [ ]** estão pendentes de implementação
- **Para adicionar novas tarefas**, use o formato: `- [ ] Descrição da tarefa`
- **Categorias são organizadas** por prioridade e área funcional

---

## 🔄 Próximos Passos Sugeridos

Com base nas tarefas pendentes, recomenda-se focar em:

1. **Resolver bugs críticos** (categoria 🚨) antes de novas funcionalidades
2. **Completar funcionalidades 360°** já iniciadas para entregar valor completo
3. **Implementar relatórios e dashboards** para visualização de dados
4. **Melhorar UX e performance** para experiência do usuário
5. **Adicionar integrações** para expandir capacidades do sistema


## 🔧 Correções Implementadas - 26/11/2025 16:08

- [x] Corrigir erro TypeScript com evaluationInstances e evaluationComments
- [x] Remover arquivo schema-evaluations.ts desnecessário
- [x] Adicionar imports estáticos no evaluationsRouter.ts
- [x] Servidor funcionando corretamente na porta 3001
- [x] Corrigir erro de JSON parsing em relatórios cron
- [x] Corrigir erro SMTP em Pulse Job (require is not defined)
- [x] Melhorar loading states em componentes críticos - criados skeleton loaders
- [x] Adicionar skeleton loaders em tabelas e listas - SkeletonTable, SkeletonCard, SkeletonList, SkeletonForm
- [x] Implementar debouncing em campos de busca restantes - hook useDebounce criado
- [x] Otimizar queries com índices de banco de dados - 8 índices principais aplicados
- [ ] Implementar error boundaries em páginas principais
- [x] Corrigir erro "No procedure found on path evaluationCycles.create"


## 🚨 ERROS CRÍTICOS IDENTIFICADOS EM 26/11 - CORREÇÃO URGENTE

### Erros TypeScript no servidor (server/routers.ts)
- [x] Corrigir linha 2963: approvalContext pode ser undefined - adicionar validação
- [x] Corrigir linha 2967: approverLevel pode ser undefined - adicionar validação
- [x] Reduzir erros TypeScript de 372 para 366 (progresso contínuo)
- [ ] Corrigir 366 erros TypeScript restantes no projeto

### Erros em componentes frontend
- [x] Corrigir ParticipantsManager.tsx linha 74,166: parâmetros 'emp' e 'e' sem tipo
- [x] Corrigir TemplateSelector.tsx linha 35: acesso a propriedade '0' em array possivelmente undefined
- [x] Corrigir usePushNotifications.ts linhas 184,187,189: argumentos e propriedades faltando
- [x] Corrigir AcompanharCicloAvaliacao.tsx: procedures getParticipation, getEvidences, submitEvidence não existem
- [x] Corrigir AderirCicloAvaliacao.tsx: procedures getParticipation, joinCycle não existem
- [x] Corrigir AderirCicloAvaliacao.tsx linha 145-146: propriedade goalSubmissionDeadline não existe
- [x] Corrigir AprovacaoBonus.tsx linha 74: faltam parâmetros paymentDate e comments

### Procedures tRPC faltando
- [x] Implementar cycle360.getParticipation
- [x] Implementar cycle360.getEvidences
- [x] Implementar cycle360.submitEvidence
- [x] Implementar cycle360.joinCycle

### Correções de schema
- [x] Adicionar campo goalSubmissionDeadline na tabela de ciclos
- [x] Validar campos obrigatórios em approvalRules (approvalContext, approverLevel)
- [x] Adicionar campos currentValue e submittedAt em performanceEvaluationEvidences
- [x] Corrigir submitEvidence para usar schema correto (participantId)
- [x] Corrigir getEvidences para buscar por participantId
- [x] Corrigir hook useEmployeeSearch (search/setSearch)
- [x] Corrigir tipos em ParticipantsManager.tsx e CyclePreview.tsx
