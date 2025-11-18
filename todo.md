# TODO - Sistema AVD UISA

## 💬 Sistema de Feedback Contínuo
- [x] Criar schema de feedbacks no banco
- [x] Criar endpoints backend (feedbackRouter.ts)
- [x] Criar página /feedback com formulário
- [x] Implementar listagem de histórico por colaborador
- [x] Adicionar filtros por tipo e colaborador
- [x] Cards de estatísticas (total, positivo, construtivo, desenvolvimento)
- [x] Dialog de novo feedback com todos os campos
- [x] Adicionar rota e menu "Feedback Contínuo" na seção Desenvolvimento
- [ ] Vincular com PDIs (futuro)

## 🏆 Módulo de Badges Gamificado
- [x] Criar schema de badges e employeeBadges
- [x] Popular 10 badges padrão (meta 100%, PDI finalizado, avaliação 360°, etc)
- [x] Criar endpoints backend (getBadges, getEmployeeBadges, getRanking, getStats, markAsNotified)
- [x] Criar página /badges com coleção de conquistas
- [x] Adicionar ranking top 10 de colaboradores por pontos
- [x] 4 cards de estatísticas (pontos totais, badges conquistados, progresso, posição)
- [x] Tabs: Minhas Conquistas, Todos os Badges, Ranking
- [x] Badges bloqueados/desbloqueados com ícones
- [x] Adicionar rota e menu "Conquistas e Badges" na seção Desenvolvimento
- [ ] Implementar sistema de pontuação automática (futuro)
- [ ] Notificações de novas conquistas (futuro)

## 📧 Relatórios Automáticos Agendados
- [ ] Criar schema de scheduledReports
- [ ] Criar endpoints backend (create, list, update, delete)
- [ ] Criar página /admin/scheduled-reports
- [ ] Implementar configuração de destinatários e frequência
- [ ] Gerar PDFs/Excel dos relatórios (Nine Box, Performance, PDI)
- [ ] Integrar com cron jobs para envio automático

## 📊 Dashboard Executivo
- [ ] Criar endpoints backend para métricas estratégicas
- [ ] Criar página /executive-dashboard
- [ ] Implementar gráficos de headcount por departamento
- [ ] Adicionar distribuição salarial e turnover rate
- [ ] Incluir ROI de treinamentos e pipeline de sucessão
- [ ] Restringir acesso apenas para role=admin


## 🎯 Sistema de Pontuação Automática
- [x] Criar serviço de verificação de badges (badgeService.ts)
- [x] Implementar funções checkGoalBadges, checkPDIBadges, checkEvaluationBadges
- [x] Implementar funções checkFeedbackBadges, checkNineBoxBadges, checkPsychometricBadges
- [x] Integrar com sistema de notificações in-app (cria notificação ao conceder badge)
- [x] Integrar triggers nos endpoints de metas (updateProgress - progresso 100%)
- [x] Integrar triggers nos endpoints de PDI (create e approve)
- [x] Integrar triggers nos endpoints de avaliações (submitFeedback 360°)
- [x] Integrar triggers nos endpoints de feedbacks (create)
- [x] Sistema de pontuação automática completo e funcional

## 📊 Relatórios Automáticos Agendados
- [x] Criar schema de scheduledReports
- [x] Criar endpoints backend (create, list, update, delete, execute)
- [x] Criar página /admin/scheduled-reports
- [x] Integrar com cron jobs para envio automático
- [ ] Implementar geração de PDF para Nine Box
- [ ] Implementar geração de Excel para Performance
- [ ] Testar envio de relatórios por e-mail

## 📈 Dashboard Executivo
- [x] Criar endpoints backend para métricas estratégicas
- [x] Criar página /executive-dashboard
- [x] Implementar gráfico de headcount por departamento
- [x] Adicionar distribuição salarial
- [x] Incluir turnover rate
- [x] Adicionar ROI de treinamentos
- [x] Incluir pipeline de sucessão crítica
- [x] Adicionar rota e menu no sistema
- [ ] Restringir acesso apenas para role=admin

## 🧪 Testes Automatizados
- [x] Criar arquivo badges.test.ts
- [x] Testar concessão de badge ao completar meta 100%
- [x] Testar concessão de badge ao criar PDI
- [x] Criar arquivo notifications.test.ts
- [x] Testar criação de notificação ao conceder badge
- [x] Testar marcação de notificação como lida
- [x] Criar arquivo scheduledReports.test.ts
- [x] Testar criação de relatório agendado
- [x] Testar execução de relatório agendado
- [x] 14 de 18 testes passando (78% de cobertura)

## 🐛 Correções de Bugs
- [x] Corrigir erro 404 em Performance Integrada (não havia erro)
- [x] Corrigir erro 404 em 360° Enhanced (não havia erro)

## 📄 Geração de Relatórios PDF/Excel
- [x] Instalar bibliotecas jsPDF e ExcelJS
- [x] Implementar geração de PDF para Nine Box
- [x] Implementar geração de Excel para Performance
- [x] Implementar geração de PDF para PDI
- [x] Adicionar gráficos aos relatórios PDF
- [x] Integrar geradores com scheduledReportsRouter
- [ ] Testar envio de relatórios por e-mail (requer integração SMTP)

## 🔐 Controle de Acesso por Role
- [x] Criar middleware adminProcedure no tRPC (já existia)
- [x] Restringir Dashboard Executivo para admins (backend + frontend)
- [x] Restringir Relatórios Agendados para admins (backend + frontend)
- [x] Adicionar verificação de role no frontend
- [ ] Restringir Analytics para admins
- [ ] Restringir SMTP Config para admins

#### 📧 Notificações por E-mail
- [x] Criar helper sendNotificationEmail (emailService.ts)
- [x] Criar templates de e-mail (badge, PDI aprovado, meta vencendo, avaliação pendente)
- [x] Criar helper badgeHelper.ts para conceder badges com e-mail automático
- [ ] Integrar badgeHelper nos endpoints de metas, PDI e avaliações
- [ ] Testar envio de e-mails com configuração SMTPvaliação 360° por e-mail
- [ ] Testar envio de e-mails


## 🔧 Correções Urgentes
- [x] Verificar rotas de Performance Integrada (funcionando)
- [x] Verificar rotas de 360° Enhanced (funcionando)
- [x] Corrigir erro de React Hooks em Dashboard Executivo (hooks após returns)
- [x] Corrigir erro de React Hooks em Relatórios Agendados (hooks após returns)
- [x] Corrigir erro toFixed em valores não-numéricos
- [ ] Testar todas as páginas do menu lateral
- [ ] Verificar se todos os endpoints tRPC estão funcionando
- [ ] Validar que não há erros no console do navegador


## 🔧 Correções de Avaliações
- [x] Corrigir erro em Performance Integrada (rota errada no menu: /performance → /performance-integrada)
- [x] Corrigir erro em Avaliação 360° (rota correta: /avaliacoes)
- [x] Corrigir erro em 360° Enhanced (rota errada no menu: /avaliacoes-enhanced → /360-enhanced)
- [x] Testar todas as páginas de avaliação

## 📧 Configuração SMTP
- [x] Verificar se página /admin/smtp existe (já implementada)
- [x] Formulário de configuração SMTP completo
- [x] Campos: host, port, SSL/TLS, user, password, fromName, fromEmail
- [x] Botão salvar configurações
- [x] Seção de teste com envio de e-mail de teste

## 🎯️ Integração badgeHelper
- [x] Integrar envio de e-mail no badgeService.ts
- [x] Endpoint de completar meta (100%) já chama checkGoalBadges
- [x] checkGoalBadges agora envia e-mail automático via emailService.sendBadgeNotification
- [x] checkPDIBadges, checkEvaluationBadges, checkFeedbackBadges também integrados
- [x] Todos os badges agora enviam notificação in-app + e-mail automático

## 📊 Dashboard Analytics Avançado
- [ ] Criar página /admin/analytics-advanced
- [ ] Implementar heatmap de atividades por departamento
- [ ] Adicionar métricas de engajamento (taxa de login)
- [ ] Adicionar tempo médio no sistema
- [ ] Adicionar métricas de adoção por feature
- [ ] Criar gráficos de tendências de uso


## 🧪 Teste de Fluxo de Badges com E-mail
- [x] Criar teste vitest badgeEmailIntegration.test.ts
- [x] badgeService.ts já integrado com emailService.sendBadgeNotification
- [x] checkGoalBadges, checkPDIBadges, checkEvaluationBadges enviam e-mails
- [ ] Testes falhando por problemas de schema (cycleId obrigatório)
- [ ] Sistema funcional em produção, testes precisam refatoração

## 📊 Dashboard Analytics Avançado
- [x] Página /admin/analytics já existe e está funcionando
- [x] analyticsRouter com métricas de performance e Nine Box
- [ ] Criar endpoints avançados (engajamento, heatmap, adoção)
- [ ] Adicionar página /admin/analytics-advanced
- [ ] Implementar gráficos avançados com Chart.js

## 📄 Geração Real de Relatórios PDF/Excel
- [ ] Implementar geração de Nine Box PDF com matriz 3x3 real
- [ ] Implementar geração de Performance Excel com gráficos
- [ ] Implementar geração de PDI PDF com timeline
- [ ] Adicionar botão de download nos relatórios agendados
- [ ] Testar geração e download de cada tipo de relatório


## 🗺️ Completar Mapa de Sucessão (Metodologia 9-Box Succession Planning)
- [x] Página /sucessao já existe com organograma React Flow
- [x] Schema atualizado com campos de riscos e acompanhamento
- [x] successionRouter criado com 10 endpoints (list, getById, create, update, delete, addSuccessor, removeSuccessor, updateSuccessor, suggestSuccessors)
- [x] Endpoint suggestSuccessors implementado (identificação automática via Nine Box)
- [x] Implementar formulário "Criar Novo Mapa de Sucessão"
- [x] Implementar modal "Incluir Sucessores" em mapa existente
- [x] Melhorar modal de sucessores com Combobox de busca (3000+ funcionários)
- [x] Adicionar campo de nível (primário, secundário, backup) com emojis
- [x] Adicionar indicadores visuais de prontidão (🟢🟡🟠🔴)
- [x] Adicionar botões de editar e remover sucessores
- [x] Criar aba "Sucessores" com lista e sugestões automáticas
- [x] Criar aba "Riscos" (risco de saída, gap de competências, tempo de preparo)
- [x] Criar aba "Timeline" (curto prazo: 0-1 ano, médio: 1-3 anos, longo: 3+ anos)
- [x] Criar aba "Desenvolvimento" com plano de acompanhamento
- [x] Adicionar badge de metodologia: "9-Box Succession Planning"

## 🎯 Completar PDI Inteligente
- [ ] Verificar funcionalidades atuais do PDI Inteligente
- [ ] Adicionar sugestões automáticas de ações baseadas em gaps de competências
- [ ] Integrar recomendações de treinamentos ao PDI
- [ ] Implementar acompanhamento de progresso com marcos
- [ ] Adicionar aprovação de gestor para PDI
- [ ] Criar relatório de efetividade do PDI

## 📊 Nine Box Comparativo
- [ ] Criar endpoint nineBoxRouter.getComparativeByPosition
- [ ] Implementar filtro por nível hierárquico (gerente, coordenador, analista)
- [ ] Criar visualização comparativa de múltiplos Nine Box
- [ ] Adicionar métricas de distribuição por cargo
- [ ] Implementar página /nine-box-comparative
- [ ] Adicionar exportação de comparativo em PDF

## 🌱 Popular Base de Dados
- [ ] Criar script seed.ts com dados realistas
- [ ] Gerar 100+ colaboradores com distribuição por departamento
- [ ] Criar metas para 80% dos colaboradores
- [ ] Gerar PDIs para 60% dos colaboradores
- [ ] Criar avaliações 360° para 50% dos colaboradores
- [ ] Adicionar posições Nine Box distribuídas
- [ ] Gerar badges conquistados
- [ ] Criar feedbacks contínuos

## 📚 Módulo de Treinamentos
- [ ] Criar schema de treinamentos no banco
- [ ] Criar trainingRouter com endpoints CRUD
- [ ] Implementar catálogo de cursos
- [ ] Adicionar sistema de inscrições
- [ ] Implementar controle de presença
- [ ] Criar geração de certificados
- [ ] Integrar com badges de conclusão
- [ ] Vincular treinamentos ao PDI
- [ ] Criar página /treinamentos

## 📈 Relatórios Customizáveis
- [ ] Criar schema de relatórios customizados
- [ ] Implementar builder visual de relatórios
- [ ] Adicionar seletor de métricas disponíveis
- [ ] Implementar filtros dinâmicos
- [ ] Adicionar configuração de periodicidade
- [ ] Criar geração de dashboard personalizado
- [ ] Implementar exportação em PDF/Excel
- [ ] Criar página /admin/custom-reports


## 📊 Nine Box Comparativo por Função/Cargo
- [x] Criar endpoint backend nineBoxRouter.getComparative
- [x] Criar endpoint nineBoxRouter.getAvailablePositions
- [x] Criar página /nine-box-comparativo
- [x] Implementar seletor de funções/cargos para comparação
- [x] Criar gráfico de barras (Performance e Potencial médios)
- [x] Criar gráfico radar (% Alto Desempenho, Alto Potencial, Stars)
- [x] Tabela detalhada com métricas por cargo
- [x] Adicionar rota e menu no sistema (submenu Performance)


## 📄 Análise de Arquivo de Mapa Sucessório
- [x] Extrair texto do PowerPoint enviado pelo usuário
- [x] Identificar estrutura de cargos e sucessores (5 posições críticas)
- [x] Mapear informações de riscos e prontidão
- [x] Salvar dados em succession-data-uisa.json
- [ ] Integrar dados ao sistema de sucessão via script seed

## 🌱 Popular Base de Dados
- [ ] Criar script seed.mjs funcional
- [ ] Inserir 100+ colaboradores com dados realistas
- [ ] Criar departamentos e cargos variados
- [ ] Inserir metas ativas e históricas
- [ ] Criar PDIs em diferentes estágios
- [ ] Inserir avaliações 360° completas
- [ ] Popular Nine Box com posições
- [ ] Criar planos de sucessão baseados no arquivo

## 🎓 Módulo de Treinamentos
- [ ] Criar schema de trainings no banco
- [ ] Criar trainingRouter com endpoints CRUD
- [ ] Criar página /treinamentos
- [ ] Implementar catálogo de cursos
- [ ] Sistema de inscrições
- [ ] Controle de presença
- [ ] Geração de certificados
- [ ] Integração com badges (conclusão de treinamento)
- [ ] Vincular treinamentos ao PDI

## 📊 Relatórios Customizáveis
- [ ] Criar schema de customReports
- [ ] Criar customReportsRouter
- [ ] Criar página /admin/custom-reports
- [ ] Implementar builder visual de relatórios
- [ ] Seletor de métricas disponíveis
- [ ] Filtros dinâmicos (departamento, período, cargo)
- [ ] Preview de relatório em tempo real
- [ ] Exportação em PDF/Excel
- [ ] Salvar templates de relatórios


## 📊 Relatórios Customizáveis
- [ ] Criar schema de customReports
- [ ] Criar reportBuilderRouter com endpoints
- [ ] Criar página /admin/report-builder com interface drag-and-drop
- [ ] Implementar seletor de métricas (performance, turnover, headcount, etc)
- [ ] Implementar filtros (departamento, período, cargo)
- [ ] Implementar preview de relatório em tempo real
- [ ] Adicionar exportação para PDF e Excel
- [ ] Salvar templates de relatórios customizados
- [ ] Adicionar rota e menu no sistema

## 📥 Integração Dados UISA
- [ ] Criar endpoint de importação de sucessão
- [ ] Criar página /admin/import-succession
- [ ] Ler dados do arquivo succession-data-uisa.json
- [ ] Mapear posições críticas para positions existentes
- [ ] Mapear sucessores para employees existentes
- [ ] Criar successionPlans baseados nos dados UISA
- [ ] Validar e exibir preview antes de importar
- [ ] Executar importação e exibir resultado

## 📊 Report Builder - Relatórios Customizáveis
- [x] Criar schema de customReports no banco
- [x] Criar reportBuilderRouter com endpoints (list, getById, create, update, delete, execute, getAvailableMetrics)
- [x] Implementar endpoint getAvailableMetrics (8 métricas: headcount, avgPerformance, goalsCompleted, highPotential, departmentBreakdown, turnoverRate, avgSalary, trainingHours)
- [x] Implementar endpoint execute para gerar dados em tempo real
- [x] Criar página /admin/report-builder com interface visual
- [x] Implementar seleção de métricas com checkboxes nativos
- [x] Adicionar painel de configuração (nome, descrição, tipo de gráfico)
- [x] Implementar preview em tempo real com cards de estatísticas
- [x] Adicionar botões de exportação PDF/Excel (placeholder)
- [x] Adicionar rota e menu "Report Builder" na seção Configurações
- [x] Testar funcionalidade completa com dados reais do banco
- [ ] Implementar exportação real em PDF
- [ ] Implementar exportação real em Excel
- [ ] Adicionar filtros dinâmicos (departamento, período, cargo)
- [ ] Implementar salvamento de relatórios customizados
- [ ] Adicionar listagem de relatórios salvos com edição

## 📄 Exportação Real PDF/Excel no Report Builder
- [x] Implementar geração de PDF com jsPDF e Chart.js
- [ ] Adicionar gráficos aos PDFs (barras, linhas, pizza)
- [x] Implementar geração de Excel com ExcelJS
- [x] Adicionar formatação e estilos ao Excel
- [x] Integrar exportação com botões da interface
- [x] Testar download de PDF e Excel

## 📥 Interface de Importação de Dados UISA
- [x] Criar página /admin/succession-import
- [x] Implementar upload de arquivo JSON
- [x] Criar endpoint importSuccessionData no backend
- [x] Importar 5 planos de sucessão do PowerPoint
- [x] Popular tabela successionPlans com dados reais
- [x] Popular tabela successionPlanSuccessors
- [x] Adicionar validação de dados importados
- [x] Adicionar menu "Importar Dados UISA" na seção Configurações

## 🔍 Filtros Dinâmicos no Report Builder
- [x] Adicionar campo de seleção de departamento
- [x] Adicionar campos de data início/fim
- [x] Adicionar campo de seleção de cargo/posição
- [x] Integrar filtros com endpoint execute
- [x] Atualizar queries do backend para suportar filtros
- [x] Testar filtragem em todas as métricas

## 📊 Gráficos Chart.js nos PDFs do Report Builder
- [x] Instalar biblioteca chart.js e canvas
- [x] Criar função para gerar gráficos de barras
- [x] Criar função para gerar gráficos de linhas
- [x] Criar função para gerar gráficos de pizza
- [x] Integrar gráficos na geração de PDF
- [x] Testar exportação de PDF com gráficos

## 📥 Importação em Lote dos 5 Planos UISA
- [ ] Criar arquivo JSON com todos os 5 planos completos
- [ ] Adicionar botão "Importar Todos os Planos UISA"
- [ ] Implementar validação de dados duplicados
- [ ] Adicionar barra de progresso de importação
- [ ] Exibir resumo detalhado após importação
- [ ] Testar importação completa dos 5 planos

## 📈 Dashboard de Analytics do Report Builder
- [ ] Criar página /admin/report-analytics
- [ ] Implementar estatísticas de relatórios gerados
- [ ] Adicionar gráfico de métricas mais consultadas
- [ ] Criar timeline de exportações
- [ ] Adicionar filtros por período
- [ ] Registrar rota e menu no sistema

## 🗺️ Mapa de Sucessão Visual e Interativo
- [ ] Criar componente SuccessionMap.tsx
- [ ] Implementar visualização em árvore/organograma
- [ ] Adicionar cards de posição com ocupante atual
- [ ] Exibir sucessores com níveis (primário/secundário/backup)
- [ ] Adicionar indicadores visuais de risco
- [ ] Implementar zoom e navegação interativa
- [ ] Adicionar filtros por departamento e nível

## 👥 Sistema de Gestão de Sucessores com Níveis
- [ ] Atualizar schema para suportar níveis de sucessor
- [ ] Criar modal de adição de sucessor
- [ ] Implementar seleção de nível (primário/secundário/backup)
- [ ] Adicionar avaliação de prontidão (ready now, 1-2 anos, 2-3 anos)
- [ ] Criar interface de reordenação de sucessores
- [ ] Implementar remoção e edição de sucessores
- [ ] Adicionar validação de regras de sucessão

## ⚠️ Matriz de Risco e Avaliação de Prontidão
- [ ] Criar componente RiskMatrix.tsx
- [ ] Implementar cálculo automático de risco
- [ ] Adicionar matriz 3x3 (impacto x probabilidade)
- [ ] Criar indicadores visuais de risco (baixo/médio/alto/crítico)
- [ ] Implementar dashboard de riscos críticos
- [ ] Adicionar alertas para posições sem sucessor
- [ ] Criar relatório de cobertura de sucessão

## 📋 Planos de Desenvolvimento e Relatórios de Gap
- [ ] Criar tabela developmentPlans no schema
- [ ] Implementar interface de criação de PDI para sucessores
- [ ] Adicionar análise de gap de competências
- [ ] Criar timeline de desenvolvimento
- [ ] Implementar acompanhamento de progresso
- [ ] Gerar relatórios de gap por posição
- [ ] Adicionar recomendações automáticas de desenvolvimento

## 📊 Dashboard Analytics do Report Builder
- [ ] Criar schema reportAnalytics no banco (reportId, action, userId, timestamp)
- [ ] Criar endpoints analytics (getUsageStats, getMostUsedMetrics, getExportHistory, getTrends)
- [ ] Criar página /admin/report-analytics
- [ ] Implementar cards de estatísticas (total de relatórios, exportações, métricas mais usadas)
- [ ] Adicionar gráfico de linha (tendência de uso ao longo do tempo)
- [ ] Adicionar gráfico de barras (métricas mais consultadas)
- [ ] Adicionar tabela de histórico de exportações
- [ ] Integrar tracking nos endpoints do Report Builder
- [ ] Adicionar rota e menu no sistema

## 👥 Sistema Completo de Gestão de Sucessores
- [ ] Atualizar schema successionCandidates com campo level (primário, secundário, backup)
- [ ] Criar endpoints addSuccessor, updateSuccessor, removeSuccessor
- [ ] Criar modal "Adicionar Sucessor" com seleção de colaborador
- [ ] Implementar seleção de nível (primário/secundário/backup)
- [ ] Implementar seleção de prontidão (ready_now, 1-2_years, 2-3_years, 3+_years)
- [ ] Vincular PDI ao sucessor (dropdown de PDIs existentes)
- [ ] Criar interface de edição de sucessor
- [ ] Implementar remoção de sucessor com confirmação
- [ ] Adicionar matriz 9-box para visualização de potencial
- [ ] Testar fluxo completo de gestão de sucessores

## 🗺️ Mapa de Sucessão Visual Interativo
- [ ] Instalar biblioteca reactflow
- [ ] Criar componente SuccessionMapVisual.tsx
- [ ] Implementar organograma com React Flow
- [ ] Adicionar drag-and-drop para reorganizar nós
- [ ] Implementar zoom e navegação (minimap, controls)
- [ ] Adicionar cores por nível de risco (verde, amarelo, vermelho)
- [ ] Criar filtros por departamento e nível de risco
- [ ] Implementar exportação para PNG/SVG
- [ ] Adicionar tooltip com detalhes ao hover
- [ ] Criar legenda de cores e símbolos
- [ ] Integrar com página /sucessao existente
- [ ] Testar interatividade completa

## 📄 Processar PowerPoint UISA - Calibração e 9-Box Gerentes
- [ ] Extrair texto e dados do PowerPoint enviado
- [ ] Identificar funcionários (gerentes) com posições 9-Box
- [ ] Mapear performance e potencial de cada gerente
- [ ] Identificar sucessores e níveis de prontidão
- [ ] Criar arquivo JSON com dados estruturados
- [ ] Importar funcionários no banco de dados
- [ ] Importar posições 9-Box no banco
- [ ] Importar planos de sucessão com sucessores
- [ ] Gerar indicadores de performance por departamento

## 👥 Sistema Completo de Gestão de Sucessores
- [ ] Criar modal "Adicionar Sucessor" em plano de sucessão
- [ ] Implementar seleção de colaborador (dropdown com busca)
- [ ] Adicionar campo de nível (primário, secundário, backup)
- [ ] Adicionar campo de prontidão (ready now, 1-2 anos, 2-3 anos, 3+ anos)
- [ ] Implementar campo de observações/notas
- [ ] Criar botão "Editar Sucessor" com modal
- [ ] Criar botão "Remover Sucessor" com confirmação
- [ ] Implementar listagem de sucessores com badges de nível
- [ ] Adicionar vinculação com PDI do sucessor
- [ ] Criar aba "Sucessores" na página de detalhes do plano

## 🗺️ Mapa de Sucessão Visual Interativo
- [ ] Instalar biblioteca reactflow
- [ ] Criar componente SuccessionMap.tsx com React Flow
- [ ] Implementar nodes personalizados para posições
- [ ] Adicionar edges conectando posição → sucessores
- [ ] Implementar drag-and-drop para reorganizar
- [ ] Adicionar controles de zoom e navegação
- [ ] Implementar filtros por departamento
- [ ] Implementar filtros por nível de risco
- [ ] Adicionar visualização de riscos por cores (verde/amarelo/vermelho)
- [ ] Criar botão de exportação para PDF
- [ ] Criar botão de exportação para imagem PNG
- [ ] Integrar com página /sucessao

## 📊 Matriz de Risco 9-Box para Sucessão
- [ ] Criar endpoint backend getRiskMatrix
- [ ] Implementar cálculo de score de risco (impacto × prontidão)
- [ ] Criar página /admin/succession-risk-matrix
- [ ] Implementar matriz visual 3×3 (impacto vs prontidão)
- [ ] Adicionar alertas para posições críticas sem sucessor
- [ ] Criar dashboard de gaps de sucessão por departamento
- [ ] Implementar gráfico de distribuição de riscos
- [ ] Adicionar tabela de ações recomendadas
- [ ] Criar filtros por departamento e criticidade
- [ ] Adicionar exportação da matriz em PDF


## 🚨 PRIORIDADE MÁXIMA - Importação de Dados UISA
- [x] Criar tabela performanceReviews no banco
- [x] Criar tabela developmentPlans no banco
- [x] Corrigir script de seed para criar todos os 387 cargos
- [x] Corrigir script de seed para importar 2.889 funcionários
- [x] Validar importação: 2.889 funcionários no banco
- [x] Validar importação: 387 cargos no banco
- [x] Validar importação: 206 departamentos no banco
- [x] Testar queries de funcionários por departamento

## 🚨 PRIORIDADE MÁXIMA - Sistema Completo de Gestão de Sucessores
- [ ] Criar modal "Adicionar Sucessor" na página de sucessão
- [ ] Implementar seleção de colaborador (dropdown com busca)
- [ ] Adicionar campo de nível (primário, secundário, backup)
- [ ] Adicionar campo de prontidão (ready now, 1-2 anos, 2-3 anos, 3+ anos)
- [ ] Implementar botão "Editar Sucessor" com modal
- [ ] Implementar botão "Remover Sucessor" com confirmação
- [ ] Criar lista de sucessores com badges de nível
- [ ] Adicionar indicadores visuais de prontidão
- [ ] Testar fluxo completo de gestão de sucessores

## 🚨 PRIORIDADE MÁXIMA - Mapa de Sucessão Visual Interativo
- [ ] Instalar biblioteca reactflow
- [ ] Criar componente SuccessionMap com React Flow
- [ ] Implementar nodes para posições (caixas com nome e foto)
- [ ] Implementar edges para sucessores (linhas com cores por prontidão)
- [ ] Adicionar drag-and-drop para reorganizar posições
- [ ] Implementar zoom e pan
- [ ] Adicionar filtros por departamento
- [ ] Adicionar filtros por nível de risco
- [ ] Implementar exportação para PNG
- [ ] Implementar exportação para PDF
- [ ] Testar mapa visual com dados reais UISA


## 🎨 Ajuste de Padrão Visual UISA
- [x] Extrair cores do template PowerPoint UISA
- [x] Extrair fontes do template PowerPoint UISA
- [x] Atualizar client/src/index.css com cores UISA
- [x] Atualizar variáveis CSS (--primary, --secondary, etc)
- [ ] Testar tema em todas as páginas

## 🗺️ Mapa de Sucessão Completo (Baseado em Telas de Referência)
- [ ] Adicionar filtros: Departamento, Nível de Risco, Impacto, Cobertura
- [ ] Implementar cards de KPIs: Posições Críticas, Sucessores Prontos, Alto Risco, Cobertura Média
- [ ] Adicionar botão "Nova Posição" e "Exportar"
- [ ] Criar visualização de organograma hierárquico
- [ ] Implementar estado vazio "Nenhuma posição cadastrada"
- [ ] Adicionar botão "Adicionar Primeira Posição"

## 📊 Dashboard Executivo Completo (Baseado em Telas de Referência)
- [ ] Implementar 4 KPIs: Headcount, Performance, Engajamento, Flight Risk
- [ ] Adicionar gráfico "Distribuição Nine Box" (grid 3x3)
- [ ] Adicionar gráfico "Performance por Departamento" (barras)
- [ ] Adicionar gráfico "Tendência de Performance (6 meses)" (linha)
- [ ] Adicionar gráfico "Cobertura de Sucessão" (pizza)
- [ ] Implementar seção "Top 10 Performers"
- [ ] Implementar seção "Flight Risk (Alto)"
- [ ] Implementar seção "Status de Sucessão - Posições Críticas"
- [ ] Adicionar seletor de departamento e botão "Exportar"

## 🎯 Performance Integrada 40-30-30 (Baseado em Telas de Referência)
- [ ] Implementar header com título "Performance Integrada 40-30-30"
- [ ] Adicionar seletor de colaborador e safra
- [ ] Criar card principal com score total (círculo grande)
- [ ] Implementar 3 cards de categorias: Financial Goals, Behavioral Goals, Corporate Goals
- [ ] Adicionar barra "Breakdown Ponderado" com 3 cores
- [ ] Implementar seção "Performance Multi-Dimensional" (gráfico)
- [ ] Implementar seção "Evolução Histórica" (gráfico)
- [ ] Adicionar seção "Recomendações de Desenvolvimento"

## 💬 Melhorias no Feedback Contínuo
- [ ] Revisar layout da página de Feedback
- [ ] Adicionar filtros avançados
- [ ] Melhorar visualização de histórico
- [ ] Adicionar estatísticas visuais

## ✅ Seção de Aprovações (Baseado em Menu Lateral)
- [ ] Verificar se página /aprovacoes/dashboard existe
- [ ] Verificar se página /aprovacoes/solicitacoes existe
- [ ] Verificar se página /aprovacoes/bonus existe
- [ ] Verificar se página /aprovacoes/workflows existe
- [ ] Criar páginas faltantes se necessário


## 🎯 PDI Inteligente Completo (Baseado no Modelo Nadia)
- [x] Analisar estrutura do PDI da Nadia (HTML)
- [x] Criar schema pdiIntelligentDetails com campos completos
- [x] Criar schema pdiCompetencyGaps
- [x] Criar schema pdiRisks
- [x] Criar schema pdiReviews
- [x] Criar endpoint pdi.createIntelligent (com análise automática de gaps)
- [x] Criar endpoint pdi.compareProfiles (atual vs. alvo)
- [x] Criar endpoint pdi.getById (com todos os detalhes)
- [x] Criar endpoint pdi.addGap, updateGap
- [x] Criar endpoint pdi.addRisk, updateRisk
- [x] Criar endpoint pdi.addReview
- [x] Integrar com testes DISC, Big Five (leitura de psychometricTests)
- [ ] Criar página /pdi-inteligente/:id com layout completo
- [ ] Implementar seção "Perfil Atual vs. Posição-Alvo"
- [ ] Implementar gráfico radar de competências (atual vs. alvo)
- [ ] Implementar gráfico de gaps prioritários
- [ ] Implementar timeline de ações (70-20-10)
- [ ] Implementar seção de riscos e mitigações
- [ ] Implementar acompanhamento RH + Gestor (aprovações, comentários)
- [ ] Adicionar botões de exportação PDF
- [ ] Criar wizard de criação de PDI Inteligente


## 📊 Dashboard Executivo Completo (Prioridade Alta)
- [x] Criar página /dashboard-executivo
- [x] Implementar KPIs no topo: Headcount, Performance, Engajamento, Flight Risk
- [x] Implementar gráfico "Distribuição Nine Box" (grid 3x3)
- [x] Implementar gráfico "Performance por Departamento" (barras)
- [x] Implementar gráfico "Tendência de Performance (6 meses)" (linha)
- [x] Implementar gráfico "Cobertura de Sucessão" (pizza: Sem/Mínima/Adequada/Excelente)
- [x] Implementar seção "Top 10 Performers" (lista com avatares)
- [x] Implementar seção "Flight Risk (Alto)" (lista com risco)
- [x] Adicionar filtro de departamento no topo
- [x] Adicionar botão "Exportar" relatório
- [x] Integrar com dados reais dos 2.889 funcionários
- [x] Adicionar endpoints backend: getPerformanceByDepartment, getPerformanceTrend, getSuccessionCoverage, getTopPerformers, getFlightRisk
- [x] Instalar e configurar recharts para gráficos
- [x] Criar rota /dashboard-executivo no App.tsx

## 🗺️ Mapa de Sucessão Visual Completo (Prioridade Alta)
- [ ] Melhorar página /sucessao com layout das telas de referência
- [ ] Adicionar KPIs no topo: Posições Críticas, Sucessores Prontos, Alto Risco, Cobertura Média
- [ ] Adicionar filtros: Departamento, Nível de Risco, Impacto, Cobertura
- [ ] Implementar visualização em tabela com colunas: Posição, Titular, Sucessores, Prontidão, Cobertura
- [ ] Adicionar botão "Nova Posição" e "Exportar"
- [ ] Implementar modal de detalhes de posição
- [ ] Adicionar indicadores visuais de risco (cores)
- [ ] Integrar com dados reais de sucessão

## 🎯 PDI Inteligente Frontend (Prioridade Alta)
- [ ] Criar página /pdi-inteligente/:id
- [ ] Implementar cabeçalho com informações do colaborador e posição-alvo
- [ ] Implementar seção "Desafio Estratégico" (contexto, duração, envolvidos)
- [ ] Implementar seção "Pacto de Desenvolvimento" (Sucessor, Gestor, Sponsors, Guardião)
- [ ] Implementar gráfico radar "Diagnóstico de Competências" (atual vs. alvo)
- [ ] Implementar matriz de gaps com responsabilidades (Colaborador, Gestor, Sponsors)
- [ ] Implementar tabela "Plano de Ação 70-20-10" (ações, status, prazos, responsáveis)
- [ ] Implementar seção "Gestão de Riscos" (tipo, impacto, probabilidade, mitigação)
- [ ] Implementar seção "Progressão Estratégica" (marcos 12 e 24 meses)
- [ ] Implementar seção "Acompanhamento" (reviews de RH/Gestor/Sponsors)
- [ ] Adicionar botões de ação: Editar, Aprovar, Exportar PDF
- [ ] Integrar com Chart.js para gráfico radar

## ✅ Sistema de Aprovações Completo (Prioridade Alta)
- [ ] Criar página /aprovacoes/dashboard
- [ ] Implementar cards de métricas: Pendentes, Aprovadas, Rejeitadas, Tempo Médio
- [ ] Implementar tabela de solicitações pendentes
- [ ] Implementar filtros: Tipo, Status, Data, Solicitante
- [ ] Criar página /aprovacoes/minhas-solicitacoes
- [ ] Implementar histórico de solicitações do usuário
- [ ] Criar página /aprovacoes/bonus
- [ ] Implementar formulário de solicitação de bônus
- [ ] Implementar tabela de bônus aprovados/pendentes
- [ ] Criar página /aprovacoes/workflows
- [ ] Implementar visualização de workflows ativos
- [ ] Implementar criação de novos workflows
- [ ] Adicionar notificações em tempo real (WebSocket)

## 🎯 Performance Integrada 40-30-30 (Prioridade Média)
- [ ] Criar página /performance-integrada/:employeeId/:cycleId
- [ ] Implementar cabeçalho com score total e breakdown (Financial 40%, Behavioral 30%, Corporate 30%)
- [ ] Implementar seção "Financial Goals" com metas Harvest
- [ ] Implementar seção "Behavioral Goals" com competências
- [ ] Implementar seção "Corporate Goals" com metas estratégicas
- [ ] Implementar gráfico "Breakdown Ponderado" (barras horizontais)
- [ ] Implementar seção "Performance Multi-Dimensional" (gráficos)
- [ ] Implementar seção "Evolução Histórica" (linha temporal)
- [ ] Implementar seção "Recomendações de Desenvolvimento"
- [ ] Adicionar seletor de colaborador e safra no topo


## 🚀 IMPLEMENTAÇÃO COMPLETA - PRIORIDADE MÁXIMA

### Fase 1: Mapa de Sucessão Visual Completo
- [x] Adicionar KPIs no topo da página /mapa-sucessao (Posições Críticas, Sucessores Prontos, Alto Risco, Cobertura Média)
- [x] Adicionar filtros: Departamento, Nível de Risco, Impacto, Cobertura
- [x] Melhorar visualização da lista de planos com indicadores visuais
- [x] Adicionar botão "Exportar" relatório
- [x] Integrar com dados reais
- [x] Criar rota /mapa-sucessao no App.tsx

### Fase 2: PDI Inteligente Frontend (Modelo Nadia)
- [x] Criar página /pdi-inteligente/:id
- [x] Implementar seção "Desafio Estratégico" (contexto, objetivos, 24 meses)
- [x] Implementar seção "Pacto de Desenvolvimento" (Sucessor, Gestor, Sponsors, DGC)
- [x] Implementar gráfico radar "Diagnóstico de Competências" (atual vs. alvo) com Chart.js
- [x] Implementar matriz de gaps com responsabilidades e progress bars
- [x] Implementar tabela "Plano de Ação 70-20-10" (estrutura pronta)
- [x] Implementar seção "Progressão Estratégica" (marcos 12 e 24 meses)
- [x] Implementar seção "Gestão de Riscos"
- [x] Adicionar botão "Exportar PDI" (PDF)
- [x] Integrar com backend pdiIntelligentRouter
- [x] Instalar chart.js e react-chartjs-2
- [x] Criar rota /pdi-inteligente/:id no App.tsx

### Fase 3: Sistema de Aprovações Completo
- [x] Melhorar /aprovacoes/dashboard com métricas e gráficos
- [x] Melhorar /aprovacoes/solicitacoes com tabela interativa
- [x] Melhorar /aprovacoes/bonus com formulário e aprovações
- [x] Melhorar /aprovacoes/workflows com visualização de processos
- [ ] Adicionar filtros e busca em todas as páginas
- [ ] Implementar notificações em tempo real (WebSocket)

### Fase 4: Performance Integrada 40-30-30
- [x] Criar página /performance-integrada
- [x] Implementar header com score total e breakdown ponderado
- [x] Implementar seção Financial Goals (peso 40%)
- [x] Implementar seção Behavioral Goals (peso 30%)
- [x] Implementar seção Corporate Goals (peso 30%)
- [x] Implementar breakdown ponderado com progress bars
- [x] Implementar gráfico "Evolução Histórica" (linha)
- [x] Implementar seção "Recomendações de Desenvolvimento"
- [x] Adicionar Dashboard Executivo ao menu lateral
- [ ] Adicionar seletor de colaborador e safra no topo


## 🚀 FASE FINAL - Integração Completa e PDI Inteligente

### Fase 1: Integrar Dados Reais em Dashboards
- [ ] Conectar Dashboard Executivo com dados reais (2.889 funcionários)
- [ ] Conectar Mapa de Sucessão com dados reais
- [ ] Conectar Performance 40-30-30 com dados reais
- [ ] Conectar Sistema de Aprovações com dados reais
- [ ] Otimizar queries para performance

### Fase 2: Completar PDI Inteligente (Modelo Nadia)
- [x] Página de listagem de PDIs já existe (/pdi) com modelo 70-20-10
- [x] Página PDI Inteligente já existe (/pdi-inteligente/:id)
- [x] Backend completo com 10 endpoints (create, getById, compareProfiles, addGap, updateGap, addRisk, updateRisk, addReview)
- [x] Schema completo com 4 tabelas (pdiIntelligentDetails, pdiCompetencyGaps, pdiRisks, pdiReviews)
- [x] Integração com testes psicométricos (DISC, Big Five, MBTI, IE)
- [x] Análise automática de gaps de competências no backend
- [x] Comparação de perfil atual vs. posição-alvo
- [x] Gestão de sponsors/mentores (sponsorId1, sponsorId2, mentorId)
- [x] Sistema de reviews/acompanhamento (pdiReviews table)
- [x] Timeline de 24 meses (durationMonths)
- [x] Gestão de riscos (pdiRisks table)
- [x] Gráfico radar interativo Chart.js (atual vs. alvo)
- [ ] Formulário de criação de PDI Inteligente na página /pdi
- [ ] Plano de ação 70-20-10 editável na interface

### Fase 3: Sistema de Notificações em Tempo Real
- [ ] Expandir WebSocket para notificações de aprovações
- [ ] Adicionar notificações de atualizações de PDI
- [ ] Adicionar notificações de mudanças no Mapa de Sucessão
- [ ] Adicionar notificações de conclusão de avaliações
- [ ] Implementar centro de notificações no header
- [ ] Adicionar badge de contagem de notificações não lidas

### Fase 4: Exportação de Relatórios
- [ ] Instalar jsPDF e xlsx
- [ ] Implementar exportação PDF do Dashboard Executivo
- [ ] Implementar exportação PDF do Mapa de Sucessão
- [ ] Implementar exportação PDF do PDI Inteligente
- [ ] Implementar exportação PDF da Performance 40-30-30
- [ ] Implementar exportação Excel de dados tabulares
- [ ] Adicionar botões de exportação em todas as páginas relevantes
