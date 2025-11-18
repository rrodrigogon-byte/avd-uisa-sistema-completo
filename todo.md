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
- [ ] Criar schema de scheduledReports
- [ ] Criar endpoints backend (create, list, update, delete, execute)
- [ ] Criar página /admin/scheduled-reports
- [ ] Implementar geração de PDF para Nine Box
- [ ] Implementar geração de Excel para Performance
- [ ] Integrar com cron jobs para envio automático
- [ ] Testar envio de relatórios por e-mail

## 📈 Dashboard Executivo
- [ ] Criar endpoints backend para métricas estratégicas
- [ ] Criar página /executive-dashboard
- [ ] Implementar gráfico de headcount por departamento
- [ ] Adicionar distribuição salarial
- [ ] Incluir turnover rate
- [ ] Adicionar ROI de treinamentos
- [ ] Incluir pipeline de sucessão crítica
- [ ] Restringir acesso apenas para role=admin
