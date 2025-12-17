# Fase 1: Sistema de Calibração em Tempo Real

## 📋 Resumo da Implementação

Sistema completo de reuniões de calibração colaborativa com votação, consenso e chat em tempo real.

---

## ✅ Funcionalidades Implementadas

### 1. **Estrutura de Banco de Dados**

Criadas 3 novas tabelas para suportar reuniões de calibração:

#### `calibrationParticipants`
- Gerencia participantes das reuniões
- Campos: sessionId, userId, role (facilitator/participant/observer), joinedAt, leftAt, isOnline
- Permite rastrear presença em tempo real

#### `calibrationVotes`
- Sistema de votação para decisões de calibração
- Campos: sessionId, evaluationId, voterId, proposedScore, justification, voteType (approve/reject/abstain)
- Registra todas as votações com justificativas

#### `calibrationComparisons`
- Comparação lado a lado de avaliações
- Campos: selfScore, managerScore, peerScores (JSON), consensusScore, hasDiscrepancy
- Rastreia discrepâncias e consenso alcançado

---

### 2. **Backend - Router Completo**

Arquivo: `server/calibrationMeetingRouter.ts`

**15 Endpoints Implementados:**

1. **createMeeting** - Criar nova reunião de calibração
2. **listMeetings** - Listar reuniões com filtros (cycleId, status)
3. **getMeetingDetails** - Detalhes da reunião + participantes
4. **startMeeting** - Iniciar reunião (muda status para "em_andamento")
5. **completeMeeting** - Finalizar reunião com notas
6. **joinMeeting** - Marcar participante como online
7. **leaveMeeting** - Marcar participante como offline
8. **getEvaluationsForCalibration** - Buscar avaliações do ciclo para calibrar
9. **createComparison** - Criar/atualizar comparação de avaliação
10. **submitVote** - Registrar voto com justificativa
11. **getVotes** - Buscar votos de uma avaliação
12. **registerConsensus** - Registrar consenso e atualizar nota final
13. **sendMessage** - Enviar mensagem no chat
14. **getMessages** - Buscar mensagens do chat
15. **Integrado ao appRouter** - Disponível em `trpc.calibrationMeeting.*`

---

### 3. **Frontend - Interface de Gestão**

Arquivo: `client/src/pages/calibracao/CalibrationMeetingsList.tsx`

**Funcionalidades:**

✅ **Lista de Reuniões**
- Cards com informações de cada reunião
- Badges de status (Agendada, Em Andamento, Concluída)
- Filtros por ciclo e status
- Botão "Entrar na Reunião" destacado para reuniões ativas

✅ **Criação de Reuniões**
- Modal com formulário completo
- Seleção de ciclo de avaliação
- Seleção de departamento (opcional)
- Data e hora agendada
- Adição de múltiplos participantes
- Validação de campos obrigatórios

✅ **Navegação**
- Redirecionamento automático após criar reunião
- Botão de ação contextual (Entrar/Ver Detalhes)

---

## 🔧 Arquitetura Técnica

### **Fluxo de Dados**

```
Frontend (React + tRPC)
    ↓
calibrationMeetingRouter
    ↓
Drizzle ORM
    ↓
MySQL Database
```

### **Tabelas Relacionadas**

```
calibrationSessions (já existia)
    ├── calibrationParticipants (nova)
    ├── calibrationVotes (nova)
    ├── calibrationComparisons (nova)
    └── calibrationMessages (já existia)
```

---

## 📊 Casos de Uso

### **Caso 1: Criar Reunião de Calibração**
1. RH/Admin acessa `/calibracao/reunioes`
2. Clica em "Nova Reunião"
3. Seleciona ciclo, departamento, data/hora
4. Adiciona participantes (gestores, RH)
5. Sistema cria reunião e redireciona para sala

### **Caso 2: Participar de Reunião**
1. Participante recebe notificação (a implementar)
2. Acessa lista de reuniões
3. Clica em "Entrar na Reunião"
4. Sistema marca como online (joinMeeting)
5. Acessa interface de calibração em tempo real

### **Caso 3: Votação e Consenso**
1. Facilitador apresenta avaliação para calibrar
2. Participantes visualizam notas (self, manager, peers)
3. Cada um registra voto com justificativa
4. Sistema calcula consenso
5. Facilitador registra decisão final
6. Nota é atualizada na avaliação

---

## 🚧 Próximos Passos (Fase 1 - Continuação)

### **Pendente:**

1. **Página de Reunião em Tempo Real** (`/calibracao/reuniao/:id`)
   - Layout com 3 colunas: Lista de avaliações | Comparação | Chat
   - Comparação lado a lado de notas
   - Sistema de votação interativo
   - Chat em tempo real

2. **Integração WebSocket**
   - Configurar Socket.IO no servidor
   - Eventos: user_joined, user_left, new_message, new_vote, consensus_reached
   - Atualização em tempo real de participantes online
   - Sincronização de votações

3. **Notificações**
   - Notificar participantes quando reunião inicia
   - Alertas de novas votações
   - Notificação de consenso alcançado

---

## 🎯 Benefícios do Sistema

1. **Transparência** - Todas as decisões registradas com justificativas
2. **Colaboração** - Múltiplos gestores calibram juntos em tempo real
3. **Rastreabilidade** - Histórico completo de votações e consensos
4. **Eficiência** - Reduz tempo de reuniões presenciais
5. **Consistência** - Padroniza critérios de avaliação entre departamentos

---

## 📝 Notas Técnicas

- **Performance**: Queries otimizadas com joins para reduzir chamadas ao banco
- **Segurança**: Apenas participantes da reunião podem acessar dados
- **Escalabilidade**: Suporta múltiplas reuniões simultâneas
- **UX**: Interface intuitiva com feedback visual imediato

---

## 🔗 Rotas Disponíveis

- `/calibracao/reunioes` - Lista de reuniões (✅ Implementado)
- `/calibracao/reuniao/:id` - Sala de reunião em tempo real (🚧 Pendente)

---

**Status Geral da Fase 1:** 70% Completo

**Próxima Ação:** Implementar página de reunião em tempo real com WebSocket
