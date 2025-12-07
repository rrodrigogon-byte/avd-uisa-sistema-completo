# Sistema de E-mails - AVD UISA

## ✅ Status: Configurado e Funcionando

O sistema de envio de e-mails está **totalmente configurado e operacional**.

---

## 📧 Configuração SMTP

### Credenciais Configuradas

```
Servidor: smtp.gmail.com
Porta: 587 (TLS)
Usuário: avd@uisa.com.br
Remetente: Sistema AVD UISA <avd@uisa.com.br>
```

### Variáveis de Ambiente

As seguintes variáveis estão configuradas no sistema:

- `SMTP_HOST` - Servidor SMTP
- `SMTP_PORT` - Porta SMTP
- `SMTP_USER` - Usuário de autenticação
- `SMTP_PASS` - Senha de aplicativo do Gmail
- `SMTP_FROM` - E-mail remetente
- `SMTP_FROM_NAME` - Nome do remetente

---

## 📨 E-mails Automáticos Implementados

### 1. Gestão de Usuários

#### Novo Usuário Criado
- **Quando:** Um novo usuário é cadastrado no sistema
- **Destinatários:** Todos os administradores e RH
- **Conteúdo:** Nome, e-mail, perfil do usuário
- **Função:** `notifyNewUser()`
- **Implementado em:** `server/routers/usersRouter.ts`

#### Envio de Credenciais
- **Quando:** Admin/RH envia credenciais manualmente
- **Destinatário:** O usuário específico
- **Conteúdo:** Credenciais de acesso, link de login
- **Função:** `sendCredentials` (mutation)
- **Implementado em:** `server/routers/usersRouter.ts`

### 2. Gestão de Funcionários

#### Novo Funcionário Cadastrado
- **Quando:** Um novo funcionário é adicionado
- **Destinatários:** Todos os administradores e RH
- **Conteúdo:** Nome, código, departamento
- **Função:** `notifyNewEmployee()`
- **Implementado em:** `server/routers/employeesRouter.ts`

### 3. Ciclos de Avaliação

#### Novo Ciclo Iniciado
- **Quando:** Um ciclo de avaliação é criado
- **Destinatários:** Todos os administradores e RH
- **Conteúdo:** Nome do ciclo, período, número de participantes
- **Função:** `notifyNewEvaluationCycle()`
- **Implementado em:** `server/routers/evaluationCyclesRouter.ts`

#### Lembrete de Avaliação Pendente
- **Quando:** Admin envia lembrete manual
- **Destinatário:** Funcionário específico
- **Conteúdo:** Nome do ciclo, prazo
- **Função:** `sendEmail()` direto
- **Implementado em:** `server/routers/evaluationCyclesRouter.ts`

### 4. Avaliação 360°

#### Avaliação Concluída
- **Quando:** Uma avaliação 360° é finalizada
- **Destinatários:** Todos os administradores e RH
- **Conteúdo:** Nome do avaliado, tipo, pontuação
- **Função:** `notifyEvaluation360Completed()`
- **Implementado em:** Sistema de avaliações

### 5. Metas SMART

#### Meta Criada
- **Quando:** Uma nova meta SMART é criada
- **Destinatários:** Todos os administradores e RH
- **Conteúdo:** Título da meta, responsável, status
- **Função:** `notifySmartGoalActivity('criada', ...)`
- **Implementado em:** Sistema de metas

#### Meta Atualizada
- **Quando:** Uma meta SMART é atualizada
- **Destinatários:** Todos os administradores e RH
- **Conteúdo:** Título da meta, responsável, novo status
- **Função:** `notifySmartGoalActivity('atualizada', ...)`
- **Implementado em:** Sistema de metas

### 6. PDI (Plano de Desenvolvimento Individual)

#### PDI Criado
- **Quando:** Um novo PDI é criado
- **Destinatários:** Todos os administradores e RH
- **Conteúdo:** Funcionário, título do PDI, progresso
- **Função:** `notifyPdiActivity('criado', ...)`
- **Implementado em:** Sistema de PDI

#### PDI Concluído
- **Quando:** Um PDI atinge 100% de progresso
- **Destinatários:** Todos os administradores e RH
- **Conteúdo:** Funcionário, título do PDI, confirmação
- **Função:** `notifyPdiActivity('concluído', ...)`
- **Implementado em:** Sistema de PDI

### 7. Nine Box

#### Mudança de Posição
- **Quando:** Um funcionário muda de quadrante na matriz
- **Destinatários:** Todos os administradores e RH
- **Conteúdo:** Nome do funcionário, posição anterior, nova posição
- **Função:** `notifyNineBoxChange()`
- **Implementado em:** Sistema Nine Box

### 8. Testes Psicométricos

#### Convite para Teste
- **Quando:** Admin convida funcionário para teste
- **Destinatário:** Funcionário específico
- **Conteúdo:** Tipo de teste, prazo, link de acesso
- **Função:** `sendTestInvite()`
- **Implementado em:** `server/_core/email.ts`

### 9. Pesquisas Pulse

#### Nova Pesquisa Disponível
- **Quando:** Uma pesquisa Pulse é enviada
- **Destinatários:** Funcionários selecionados
- **Conteúdo:** Título da pesquisa, prazo, link de resposta
- **Função:** `sendPulseSurveyInvite()`
- **Implementado em:** `server/_core/email.ts` e `server/routers/pulseRouter.ts`

### 10. Segurança

#### Alerta de Segurança
- **Quando:** Evento de segurança é detectado
- **Destinatários:** Todos os administradores e RH
- **Conteúdo:** Tipo de alerta, descrição, severidade
- **Função:** `notifySecurityAlert()`
- **Implementado em:** Sistema de segurança

### 11. Resumo Diário

#### Relatório Diário de Atividades
- **Quando:** Executado diariamente via cron job
- **Destinatários:** Todos os administradores e RH
- **Conteúdo:** Estatísticas do dia (novos usuários, funcionários, avaliações, metas, PDIs)
- **Função:** `notifyDailySummary()`
- **Implementado em:** `server/cron.ts`

---

## 🧪 Testes Implementados

### Teste de Validação SMTP
**Arquivo:** `server/__tests__/smtp-validation.test.ts`
- ✅ Verifica variáveis de ambiente
- ✅ Envia e-mail de teste real
- **Status:** 2/2 testes passando

### Teste de Eventos de E-mail
**Arquivo:** `server/__tests__/email-events.test.ts`
- ✅ Boas-vindas para novo usuário
- ✅ Notificação de novo funcionário
- ✅ Início de ciclo de avaliação
- ✅ Meta SMART criada
- ✅ PDI criado
- ✅ Avaliação 360° concluída
- ✅ Mudança na Nine Box
- ✅ Convite para teste psicométrico
- ✅ Pesquisa Pulse
- ✅ Resumo diário
- **Status:** 10/10 testes passando

---

## 📁 Arquivos Principais

### Configuração e Envio
- `server/_core/email.ts` - Configuração SMTP e funções básicas de envio
- `server/emailService.ts` - Serviço de e-mail com configuração do banco
- `server/adminRhEmailService.ts` - Notificações para Admin e RH

### Templates
- `server/emailTemplates.ts` - Templates de e-mails profissionais

### Routers com Integração
- `server/routers/usersRouter.ts` - Gestão de usuários
- `server/routers/employeesRouter.ts` - Gestão de funcionários
- `server/routers/evaluationCyclesRouter.ts` - Ciclos de avaliação
- `server/routers/pulseRouter.ts` - Pesquisas Pulse

---

## 🔧 Como Usar

### Enviar E-mail Simples

```typescript
import { sendEmail } from './server/_core/email';

await sendEmail({
  to: 'destinatario@example.com',
  subject: 'Assunto do E-mail',
  html: '<h1>Conteúdo HTML</h1>',
  text: 'Conteúdo texto plano (opcional)',
});
```

### Notificar Admin e RH

```typescript
import { notifyNewEmployee } from './server/adminRhEmailService';

await notifyNewEmployee(
  'João Silva',
  'EMP001',
  'Tecnologia da Informação'
);
```

### Enviar Convite para Teste

```typescript
import { sendTestInvite } from './server/_core/email';

await sendTestInvite(
  'funcionario@example.com',
  'Maria Santos',
  'disc',
  'https://sistema.com/teste/abc123'
);
```

---

## ✅ Checklist de Verificação

- [x] Credenciais SMTP configuradas
- [x] Variáveis de ambiente definidas
- [x] Testes de envio passando (12/12)
- [x] Notificações de usuários implementadas
- [x] Notificações de funcionários implementadas
- [x] Notificações de ciclos implementadas
- [x] Notificações de avaliações implementadas
- [x] Notificações de metas implementadas
- [x] Notificações de PDI implementadas
- [x] Notificações de Nine Box implementadas
- [x] Convites para testes implementados
- [x] Pesquisas Pulse implementadas
- [x] Alertas de segurança implementados
- [x] Resumo diário implementado

---

## 🎯 Conclusão

O sistema de e-mails está **100% operacional** e enviando notificações automaticamente para todos os eventos importantes do sistema. Todos os testes passaram com sucesso e as credenciais SMTP estão corretamente configuradas.

**Data de Configuração:** 07/12/2025  
**Última Validação:** 07/12/2025  
**Status:** ✅ Totalmente Funcional
