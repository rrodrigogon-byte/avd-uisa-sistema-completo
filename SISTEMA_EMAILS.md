# Sistema de Emails Automáticos - AVD UISA

## 📧 Resumo da Implementação

Este documento descreve o sistema completo de notificações por email implementado no Sistema AVD UISA. O sistema garante que todos os usuários sejam notificados sobre eventos importantes através de emails profissionais e automáticos.

---

## ✅ Emails Implementados

### 1. **Email de Boas-Vindas**
- **Quando:** Ao criar novo usuário no sistema
- **Destinatário:** Novo usuário
- **Conteúdo:** Mensagem de boas-vindas com apresentação do sistema
- **Arquivo:** `server/_core/email.ts` → `sendWelcomeEmail()`
- **Router:** `server/routers/usersRouter.ts` → `create` procedure

### 2. **Email de Credenciais de Acesso**
- **Quando:** Ao enviar credenciais para usuário
- **Destinatário:** Usuário que receberá as credenciais
- **Conteúdo:** Username e senha em formato destacado e seguro
- **Arquivo:** `server/_core/email.ts` → `sendCredentialsEmail()`
- **Router:** `server/routers/usersRouter.ts` → `sendCredentials` procedure

### 3. **Email de Notificação de Login**
- **Quando:** Toda vez que usuário faz login no sistema
- **Destinatário:** Usuário que fez login
- **Conteúdo:** Data, hora e IP do acesso (segurança)
- **Arquivo:** `server/_core/email.ts` → `sendLoginNotification()`
- **Status:** Função criada, aguardando integração no fluxo de autenticação

### 4. **Email de Nova Meta SMART Criada**
- **Quando:** Meta SMART é criada para um colaborador
- **Destinatário:** Colaborador dono da meta
- **Conteúdo:** Título da meta, prazo e informações principais
- **Arquivo:** `server/_core/email.ts` → `sendGoalCreatedEmail()`
- **Router:** `server/goalsRouter.ts` → `createSMART` procedure

### 5. **Email de Meta SMART Concluída**
- **Quando:** Meta atinge 100% de progresso
- **Destinatário:** Colaborador dono da meta
- **Conteúdo:** Parabenização pela conclusão da meta
- **Arquivo:** `server/_core/email.ts` → `sendGoalCompletedEmail()`
- **Router:** `server/goalsRouter.ts` → `updateProgress` procedure

### 6. **Email de Novo PDI Criado**
- **Quando:** Plano de Desenvolvimento Individual é criado
- **Destinatário:** Colaborador do PDI
- **Conteúdo:** Informações sobre o PDI e cargo alvo
- **Arquivo:** `server/_core/email.ts` → `sendPDICreatedEmail()`
- **Router:** `server/pdiIntelligentRouter.ts` → `create` procedure

### 7. **Email de Feedback Recebido**
- **Quando:** Colaborador recebe novo feedback
- **Destinatário:** Colaborador que recebeu o feedback
- **Conteúdo:** Nome do gestor e tipo de feedback
- **Arquivo:** `server/_core/email.ts` → `sendFeedbackReceivedEmail()`
- **Router:** `server/feedbackRouter.ts` → `create` procedure

### 8. **Email de Novo Ciclo de Avaliação**
- **Quando:** Novo ciclo de avaliação é criado
- **Destinatário:** Todos os colaboradores ativos
- **Conteúdo:** Nome do ciclo, data de início e término
- **Arquivo:** `server/_core/email.ts` → `sendCycleStartedEmail()`
- **Router:** `server/cyclesRouter.ts` → `create` procedure

### 9. **Email de Lembrete de Avaliação Pendente**
- **Quando:** Avaliação está próxima do prazo (7, 3, 1 dia antes ou no dia)
- **Destinatário:** Colaborador com avaliação pendente
- **Conteúdo:** Alerta de urgência com dias restantes
- **Arquivo:** `server/_core/email.ts` → `sendEvaluationReminderEmail()`
- **Scheduler:** `server/_core/emailScheduler.ts` → `sendPendingEvaluationReminders()`

### 10. **Email de Avaliação Criada**
- **Quando:** Nova avaliação é criada/atribuída
- **Destinatário:** Avaliado e avaliadores
- **Conteúdo:** Tipo de avaliação, ciclo e prazo
- **Arquivo:** `server/_core/email.ts` → `sendEvaluationCreatedEmail()`
- **Status:** Função criada, aguardando integração nos routers de avaliação

### 11. **Email de Avaliação Concluída**
- **Quando:** Avaliação é finalizada
- **Destinatário:** Avaliado e RH
- **Conteúdo:** Confirmação de conclusão e quem concluiu
- **Arquivo:** `server/_core/email.ts` → `sendEvaluationCompletedEmail()`
- **Status:** Função criada, aguardando integração nos routers de avaliação

### 12. **Email de Mudança de Cargo/Promoção**
- **Quando:** Colaborador é promovido, transferido ou muda de cargo
- **Destinatário:** Colaborador afetado
- **Conteúdo:** Detalhes da mudança
- **Arquivo:** `server/_core/email.ts` → `sendRoleChangeEmail()`
- **Status:** Função criada, aguardando integração no router de funcionários

### 13. **Email de Relatório Periódico para Administradores**
- **Quando:** Semanalmente (segundas-feiras às 9h)
- **Destinatário:** Administradores e RH
- **Conteúdo:** Estatísticas gerais do sistema (colaboradores, avaliações, metas)
- **Arquivo:** `server/_core/email.ts` → `sendAdminReportEmail()`
- **Scheduler:** `server/_core/emailScheduler.ts` → `sendAdminPeriodicReport()`

---

## 🤖 Sistema de Agendamento Automático

### Arquivo Principal
`server/_core/emailScheduler.ts`

### Funcionalidades

#### 1. **Lembretes de Avaliações Pendentes**
- **Função:** `sendPendingEvaluationReminders()`
- **Frequência:** A cada hora
- **Lógica:** Verifica avaliações em andamento com prazo próximo e envia lembretes em marcos específicos (7, 3, 1 dia antes e no dia do prazo)

#### 2. **Notificação de Novos Ciclos**
- **Função:** `notifyNewCycles()`
- **Frequência:** A cada hora
- **Lógica:** Detecta ciclos que iniciaram nas últimas 24 horas e notifica todos os colaboradores

#### 3. **Relatórios Periódicos**
- **Função:** `sendAdminPeriodicReport()`
- **Frequência:** Semanalmente (segundas-feiras às 9h)
- **Lógica:** Coleta estatísticas gerais e envia para administradores e RH

#### 4. **Execução do Scheduler**
- **Função:** `runScheduledTasks()`
- **Inicialização:** Automática ao iniciar o servidor
- **Intervalo:** 60 minutos (configurável)
- **Integração:** `server/_core/index.ts` → `startEmailScheduler()`

---

## 🎨 Templates de Email

Todos os emails seguem um padrão visual profissional:

### Características dos Templates
- **Cores:** Laranja (#F39200) como cor principal do sistema
- **Tipografia:** Arial, sans-serif para melhor compatibilidade
- **Layout:** Responsivo e compatível com todos os clientes de email
- **Estrutura:**
  - Cabeçalho com gradiente laranja
  - Corpo com informações destacadas em caixas coloridas
  - Rodapé com informações de contato
  - Botões de ação quando aplicável

### Níveis de Urgência (Lembretes)
- **7 dias:** Cor laranja (#F39200) - Informativo
- **3 dias:** Cor amarela (#ffc107) - Atenção
- **1 dia ou menos:** Cor vermelha (#dc3545) - Urgente

---

## 🔧 Configuração SMTP

### Variáveis de Ambiente Necessárias
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
SMTP_FROM=seu-email@gmail.com
SMTP_FROM_NAME=Sistema AVD UISA
```

### Notas Importantes
- Para Gmail, use "Senha de App" ao invés da senha normal
- O sistema já está configurado para usar TLS/SSL automaticamente
- Todos os envios são logados no console para auditoria

---

## 📊 Logs e Monitoramento

### Logs Implementados
Todos os envios de email geram logs no console com o formato:
```
[Email] Enviado: <messageId>
[EmailScheduler] Lembrete enviado para <nome> - <dias> dias restantes
[EmailScheduler] Verificação de lembretes concluída - <quantidade> avaliações verificadas
```

### Tratamento de Erros
- Todos os envios de email estão em blocos `try-catch`
- Erros não interrompem o fluxo principal da aplicação
- Erros são logados com detalhes: `[EmailRouter] Failed to send email notification: <erro>`

---

## 🚀 Como Funciona

### Fluxo de Envio de Email

1. **Evento Ocorre** (ex: usuário cria meta)
2. **Router tRPC** detecta o evento
3. **Busca Dados** necessários (nome, email do destinatário)
4. **Chama Função de Email** com os parâmetros
5. **Função Monta Template** HTML do email
6. **Envia via SMTP** usando nodemailer
7. **Loga Resultado** (sucesso ou erro)

### Fluxo do Scheduler

1. **Servidor Inicia** → `startEmailScheduler()` é chamado
2. **Execução Imediata** → `runScheduledTasks()` executa pela primeira vez
3. **Agendamento** → `setInterval()` agenda próximas execuções
4. **A Cada Hora:**
   - Verifica avaliações pendentes
   - Verifica novos ciclos
   - Envia relatórios (se for segunda-feira às 9h)
5. **Loop Infinito** → Continua enquanto servidor estiver ativo

---

## ✅ Status de Implementação

### Totalmente Implementado e Testado
- ✅ Email de boas-vindas
- ✅ Email de credenciais
- ✅ Email de meta criada
- ✅ Email de meta concluída
- ✅ Email de PDI criado
- ✅ Email de feedback recebido
- ✅ Email de novo ciclo
- ✅ Lembretes automáticos de avaliação
- ✅ Relatórios periódicos
- ✅ Sistema de agendamento

### Funções Criadas (Aguardando Integração)
- ⏳ Email de notificação de login
- ⏳ Email de avaliação criada
- ⏳ Email de avaliação concluída
- ⏳ Email de mudança de cargo/promoção

---

## 📝 Próximos Passos Sugeridos

1. **Integrar emails restantes** nos routers de avaliação e funcionários
2. **Criar dashboard de monitoramento** para visualizar estatísticas de envio
3. **Implementar sistema de preferências** para usuários escolherem quais emails receber
4. **Adicionar suporte a templates personalizáveis** via interface administrativa
5. **Implementar fila de prioridade** para emails críticos (já preparado na estrutura)

---

## 🎯 Garantias do Sistema

### Confiabilidade
- ✅ Sistema de retry automático para falhas de envio
- ✅ Logs detalhados de todas as operações
- ✅ Tratamento de erros que não interrompe o sistema
- ✅ Validação de emails antes do envio

### Performance
- ✅ Envios assíncronos (não bloqueiam operações principais)
- ✅ Scheduler otimizado (executa apenas quando necessário)
- ✅ Templates pré-compilados para melhor performance

### Segurança
- ✅ Credenciais SMTP em variáveis de ambiente
- ✅ Validação de destinatários
- ✅ Logs de auditoria de todos os envios
- ✅ Suporte a TLS/SSL

---

## 📞 Suporte

Para dúvidas ou problemas com o sistema de emails:
1. Verifique os logs do servidor
2. Valide as configurações SMTP
3. Confirme que as variáveis de ambiente estão corretas
4. Teste o envio manual através dos routers tRPC

---

**Data de Implementação:** 09/12/2025  
**Versão:** 1.0  
**Status:** ✅ Produção
