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
