# Sistema de Emails com Cópia Automática para Rodrigo Gonçalves

## 📧 Visão Geral

Este documento descreve o sistema de emails implementado no Sistema AVD UISA que **SEMPRE** envia cópia de todos os emails para `rodrigo.goncalves@uisa.com.br`.

## 🔒 Garantia de Cópia Automática

### Implementação

O sistema utiliza um helper centralizado (`server/utils/emailWithCC.ts`) que:

1. **Constante Fixa**: O email do Rodrigo está definido como constante no código
```typescript
const ALWAYS_CC_EMAIL = 'rodrigo.goncalves@uisa.com.br';
```

2. **Função Centralizada**: Todos os emails passam pela função `sendEmailWithCC()`
```typescript
export async function sendEmailWithCC(options: EmailOptionsWithCC): Promise<boolean>
```

3. **Automático e Transparente**: Não requer configuração manual - funciona automaticamente

### Características

- ✅ **Impossível esquecer**: O CC é adicionado automaticamente pelo código
- ✅ **Sem duplicatas**: Remove automaticamente emails duplicados
- ✅ **Logs de auditoria**: Registra todos os envios para rastreamento
- ✅ **Não pode ser desativado**: Constante fixa no código-fonte

## 📋 Fluxos de Email Implementados

### 1. Ciclos de Avaliação (`cyclesRouter.ts`)

#### 1.1 Novo Ciclo 360°
- **Quando**: Ao criar um novo ciclo de avaliação 360°
- **Destinatários**: Todos os participantes do ciclo
- **CC Automático**: ✅ rodrigo.goncalves@uisa.com.br
- **Template**: `createNovoCicloEmail()`
- **Assunto**: "🎯 Novo Ciclo de Avaliação 360° - [Nome do Ciclo]"

#### 1.2 Ciclo Aprovado para Metas
- **Quando**: Quando um ciclo é aprovado para criação de metas
- **Destinatários**: Todos os funcionários ativos
- **CC Automático**: ✅ rodrigo.goncalves@uisa.com.br
- **Template**: `createNovoCicloEmail()`
- **Assunto**: "🎯 Ciclo [Nome] Aprovado para Criação de Metas"

### 2. Avaliações 360° (`evaluation360Router.ts`)

#### 2.1 Avaliação Atribuída ao Gestor
- **Quando**: Após autoavaliação ser concluída
- **Destinatário**: Gestor do colaborador
- **CC Automático**: ✅ rodrigo.goncalves@uisa.com.br
- **Template**: `createAvaliacaoAtribuidaEmail()`
- **Assunto**: "Avaliação 360° - Aguardando sua avaliação de [Nome]"

#### 2.2 Avaliação Concluída
- **Quando**: Avaliação 360° é finalizada com sucesso
- **Destinatário**: Colaborador avaliado
- **CC Automático**: ✅ rodrigo.goncalves@uisa.com.br
- **Template**: `createAvaliacaoConcluidaEmail()`
- **Assunto**: "Avaliação 360° Concluída"

#### 2.3 Avaliação Rejeitada
- **Quando**: Líder rejeita uma avaliação
- **Destinatário**: Colaborador avaliado
- **CC Automático**: ✅ rodrigo.goncalves@uisa.com.br
- **Template**: HTML inline customizado
- **Assunto**: "Avaliação 360 Graus Rejeitada"

### 3. Lembretes Automáticos (`jobs/evaluationReminders.ts`)

#### 3.1 Lembrete de Avaliação Pendente
- **Quando**: Job cron diário às 9h
- **Frequência**: 3 dias, 1 dia e no dia do prazo
- **Destinatários**: Avaliadores com avaliações pendentes
- **CC Automático**: ✅ rodrigo.goncalves@uisa.com.br
- **Template**: `createLembreteAvaliacaoEmail()`
- **Assuntos**:
  - 3 dias: "Lembrete: Avaliação 360° - [Ciclo] (3 dias restantes)"
  - 1 dia: "⚠️ Urgente: Avaliação 360° - [Ciclo] (1 dia restante)"
  - Hoje: "🚨 ÚLTIMO DIA: Avaliação 360° - [Ciclo]"

## 🎨 Templates de Email

Todos os templates são profissionais, responsivos e seguem o padrão visual da UISA:

### Estrutura Padrão
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="...">
  <div style="max-width: 600px; margin: 0 auto; ...">
    <!-- Header com título -->
    <!-- Conteúdo principal -->
    <!-- Botão de ação (CTA) -->
    <!-- Footer com informações -->
  </div>
</body>
</html>
```

### Cores Utilizadas
- **Laranja UISA**: `#F39200` (cor principal)
- **Verde Sucesso**: `#28a745`
- **Amarelo Atenção**: `#ffc107`
- **Vermelho Urgente**: `#dc3545`

### Templates Disponíveis

1. **`createNovoCicloEmail()`**
   - Novo ciclo de avaliação
   - Informações do ciclo (nome, descrição, datas)
   - Botão "Acessar Sistema"

2. **`createAvaliacaoAtribuidaEmail()`**
   - Avaliação atribuída a avaliador
   - Nome do avaliado, tipo de avaliação, prazo
   - Botão "Preencher Avaliação"

3. **`createLembreteAvaliacaoEmail()`**
   - Lembrete de avaliação pendente
   - Urgência visual baseada em dias restantes
   - Cores dinâmicas (amarelo/vermelho)
   - Botão "Completar Agora"

4. **`createAvaliacaoConcluidaEmail()`**
   - Confirmação de conclusão
   - Data de conclusão
   - Botão "Ver Resultados"

## 📊 Logs e Auditoria

### Logs no Console
Todos os envios são registrados no console:

```
[EmailWithCC] Enviando para: funcionario@uisa.com.br
[EmailWithCC] CC: rodrigo.goncalves@uisa.com.br
[Cycles] Email enviado para funcionario@uisa.com.br (Nome do Funcionário)
```

### Métricas no Banco de Dados
Os envios são registrados na tabela `emailMetrics`:

```typescript
{
  type: string;           // Tipo de email
  toEmail: string;        // Destinatário principal
  subject: string;        // Assunto
  success: boolean;       // Sucesso/falha
  sentAt: Date;          // Data/hora de envio
  error?: string;        // Mensagem de erro (se houver)
}
```

## 🔧 Como Usar

### Para Desenvolvedores

#### Enviar Email com CC Automático

```typescript
import { sendEmailWithCC, createNovoCicloEmail } from './utils/emailWithCC';

// 1. Criar HTML do email usando template
const emailHtml = createNovoCicloEmail({
  employeeName: 'João Silva',
  cycleName: 'Avaliação 2025',
  cycleDescription: 'Ciclo anual de avaliação de desempenho',
  startDate: '01/01/2025',
  endDate: '31/12/2025',
  dashboardUrl: 'https://sistema.uisa.com.br/avaliacoes'
});

// 2. Enviar email (CC automático para rodrigo.goncalves@uisa.com.br)
const success = await sendEmailWithCC({
  to: 'funcionario@uisa.com.br',
  subject: 'Novo Ciclo de Avaliação',
  html: emailHtml
});

if (success) {
  console.log('Email enviado com sucesso!');
}
```

#### Adicionar CCs Adicionais (Opcional)

```typescript
await sendEmailWithCC({
  to: 'funcionario@uisa.com.br',
  subject: 'Assunto',
  html: emailHtml,
  cc: ['gestor@uisa.com.br', 'rh@uisa.com.br'] // CCs adicionais
});
// rodrigo.goncalves@uisa.com.br SEMPRE receberá cópia
```

## ✅ Checklist de Implementação

### Implementado ✅

- [x] Helper centralizado de email com CC automático
- [x] Templates HTML profissionais
- [x] Email de novo ciclo de avaliação
- [x] Email de avaliação atribuída
- [x] Email de lembrete de avaliação pendente
- [x] Email de avaliação concluída
- [x] Email de avaliação rejeitada
- [x] Job cron de lembretes automáticos
- [x] Logs de auditoria
- [x] Registro de métricas no banco

### Pendente 🔄

- [ ] Email de aprovação/rejeição de descrição de cargo
- [ ] Email de convite para Pesquisa Pulse
- [ ] Email de resultado de teste psicométrico
- [ ] Testes end-to-end de todos os fluxos

## 🧪 Testes

### Teste Manual

1. Criar um novo ciclo de avaliação 360°
2. Verificar se o email foi enviado para os participantes
3. Confirmar que rodrigo.goncalves@uisa.com.br recebeu cópia
4. Verificar logs no console
5. Consultar tabela `emailMetrics` no banco de dados

### Teste do Job de Lembretes

```bash
# Executar manualmente o job de lembretes
cd /home/ubuntu/avd-uisa-sistema-completo
pnpm tsx server/jobs/evaluationReminders.ts
```

## 📞 Suporte

Em caso de problemas com o sistema de emails:

1. Verificar logs no console do servidor
2. Consultar tabela `emailMetrics` para histórico
3. Verificar configuração SMTP em `/configuracoes/smtp`
4. Contatar equipe de desenvolvimento

---

**Última atualização**: 06/12/2025
**Versão**: 1.0
**Responsável**: Sistema AVD UISA
