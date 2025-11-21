# Sistema AVD UISA - TODO List

## 🎯 SESSÃO ATUAL - 21/11/2024 08:15 (LEMBRETES + RELATÓRIOS + CONFIGURAÇÕES)

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

## 🎯 SESSÃO ANTERIOR - 20/11/2024 21:00 (IMPLEMENTADAS)

### 1. Metas Corporativas vs Individuais ✅
- [x] Adicionar campo goalType (corporativa/individual) no schema smartGoals
- [x] Metas corporativas: criadas por RH/Admin, aplicam a todos os funcionários automaticamente
- [x] Metas individuais: criadas pelo funcionário, aprovadas pelo líder direto
- [x] Atualizar interface de criação de metas com seletor de tipo
- [x] Implementar lógica de aprovação diferenciada (corporativa não precisa aprovação)
- [x] Adicionar filtro por tipo de meta no dashboard

### 2. Avaliação 360° com Senha de Consenso ✅
- [x] Adicionar campo de senha na tela de consenso (Avaliacao360Consenso.tsx)
- [x] Validar senha do líder antes de finalizar avaliação
- [x] Usar bcrypt para verificação de senha (hash armazenado em employees)
- [x] Adicionar feedback visual de senha incorreta

### 3. Integração PDI ↔ Testes Psicométricos ✅
- [x] Criar seção "Perfil Psicométrico" no PDI Inteligente
- [x] Buscar automaticamente resultados de DISC, Big Five, MBTI do colaborador
- [x] Exibir perfis com gráficos radar e resumos textuais
- [x] Adicionar link para refazer testes se necessário
- [x] Mostrar data do último teste realizado

### 4. Componente BackButton Global ✅
- [x] Criar componente BackButton.tsx reutilizável
- [x] Adicionar em todas as páginas principais (metas, avaliações, PDI, etc)
- [x] Implementar navegação inteligente (voltar ou ir para home)
- [x] Estilizar com tema UISA (#F39200)
- [x] Adicionar ícone ArrowLeft do lucide-react

### 5. Interface de Cadastro de Senhas para Líderes ✅
- [x] Criar página /admin/gerenciar-senhas-lideres
- [x] Listar todos os líderes (employees com subordinados)
- [x] Formulário de cadastro/atualização de senha
- [x] Validação de força de senha (mínimo 8 caracteres)
- [x] Hash com bcrypt antes de salvar
- [x] Botão de resetar senha
- [x] Notificação por email quando senha for cadastrada

### 6. Dashboard de Metas Corporativas ✅
- [x] Criar página /metas/corporativas
- [x] KPIs: Total de metas corporativas, Funcionários impactados, Taxa de adesão
- [x] Listagem de todas as metas corporativas ativas
- [x] Filtros por departamento e status
- [x] Estatísticas de progresso por departamento
- [x] Gráfico de adesão (Chart.js)
- [x] Botão de criar nova meta corporativa

### 7. Notificações de Consenso Pendente ✅
- [x] Detectar quando avaliação 360° chega na etapa de consenso
- [x] Enviar email automático para o líder
- [x] Template de email profissional com link direto
- [x] Incluir prazo de finalização no email
- [x] Criar notificação in-app também

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
