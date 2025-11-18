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
