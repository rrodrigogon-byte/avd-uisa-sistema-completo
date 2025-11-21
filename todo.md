# Sistema AVD UISA - TODO List

## 🎯 SESSÃO ATUAL - 21/11/2024 08:40 (NOTIFICAÇÕES PUSH + ANALYTICS + TEMPLATES + CALIBRAÇÃO)

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
- [ ] Criar tabela evaluationTemplates no schema
- [ ] Criar tabela templateQuestions para perguntas customizadas
- [ ] Criar página /admin/templates-avaliacao
- [ ] Interface de criação de templates (drag-and-drop)
- [ ] Categorias de perguntas (competências, comportamento, resultados)
- [ ] Tipos de resposta (escala 1-5, texto, múltipla escolha)
- [ ] Associar templates a cargos/departamentos específicos
- [ ] Pré-visualização de template antes de salvar
- [ ] Duplicar templates existentes
- [ ] Importar/exportar templates (JSON)
- [ ] Integrar templates com avaliação 360°

### 4. Tela de Calibração Diretoria com Nine Box Interativo
- [ ] Criar página /admin/calibracao-diretoria
- [ ] Grid Nine Box interativo (drag-and-drop)
- [ ] Filtros: Nível hierárquico, Gerência, Diretoria, Coordenação, Departamento, Centro de Custos
- [ ] Exibir foto, nome, cargo e score atual de cada profissional
- [ ] Modal de edição ao clicar no profissional
- [ ] Permitir alterar posição no Nine Box (performance x potencial)
- [ ] Campo de justificativa obrigatória para mudanças
- [ ] Sistema de upload de evidências (PDF, imagens, documentos)
- [ ] Tabela de anexos com preview
- [ ] Histórico de calibrações anteriores
- [ ] Comparação antes/depois da calibração
- [ ] Notificação automática ao RH quando calibração é salva
- [ ] Exportação de relatório de calibração com evidências
- [ ] Controle de acesso (apenas Admin e Diretoria)

### 5. Melhorias no Envio de Avaliações
- [ ] Envio em lote de avaliações 360° por departamento
- [ ] Template de email personalizável para convites
- [ ] Agendamento de envio (data/hora específica)
- [ ] Lembrete automático para avaliações não respondidas
- [ ] Dashboard de acompanhamento de respostas em tempo real

### 6. Melhorias em Retornos e Feedback
- [ ] Página de feedback consolidado pós-avaliação
- [ ] Geração automática de relatório individual
- [ ] Sugestões de desenvolvimento baseadas em resultados
- [ ] Comparação com média do departamento/empresa
- [ ] Plano de ação sugerido automaticamente

---

## 🎯 SESSÃO ANTERIOR - 21/11/2024 08:15 (LEMBRETES + RELATÓRIOS + CONFIGURAÇÕES)

### 1. Sistema de Lembretes Automáticos
- [x] Criar job cron para lembretes de consenso pendente (3 dias sem ação)
- [x] Implementar lembrete de metas corporativas sem progresso (7 dias)
- [x] Criar template de email para cada tipo de lembrete
- [x] Implementar notificações in-app escalonadas
- [x] Testar sistema de lembretes end-to-end

### 2. Relatório de Adesão de Metas Corporativas
- [x] Criar página /metas/corporativas/adesao
- [x] Implementar endpoint goals.getCorporateGoalsAdherence
- [x] KPIs: Total de funcionários, Atualizaram progresso, Atrasados, Taxa de adesão
- [x] Gráfico de adesão por departamento (Chart.js)
- [x] Tabela de funcionários atrasados (nome, cargo, meta, dias sem atualizar)
- [x] Filtros por departamento, meta e período
- [x] Botão de enviar lembrete em massa
- [x] Exportação Excel de relatório de adesão

### 3. Histórico de Alterações de Senha
- [x] Criar tabela passwordChangeHistory no schema
- [x] Adicionar campos: employeeId, changedBy, changedAt, ipAddress, reason
- [x] Implementar endpoint employees.getPasswordHistory
- [x] Criar página /admin/historico-senhas
- [x] Exibir timeline de alterações com usuário que alterou
- [x] Adicionar filtros por líder e período
- [x] Implementar auditoria automática em updatePassword
- [x] Exportar relatório de compliance

### 4. Configuração de Avaliações
- [x] Criar página /avaliacoes/configurar
- [x] Interface de criação de ciclos de avaliação
- [x] Configuração de prazos (autoavaliação, gestor, consenso)
- [x] Ativação/desativação de ciclos
- [x] Dashboard de status de avaliações em andamento

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
