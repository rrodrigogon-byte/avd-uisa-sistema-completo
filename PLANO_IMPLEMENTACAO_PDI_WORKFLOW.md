# Plano de Implementação: PDI Inteligente e Workflow de Aprovação Configurável

**Sistema:** AVD UISA - Avaliação de Desempenho  
**Data:** 07/12/2025  
**Versão:** 1.0

---

## 📋 Sumário Executivo

Este documento apresenta o plano completo de implementação de duas funcionalidades estratégicas para o Sistema AVD UISA:

1. **PDI Inteligente Completo** - Sistema avançado de Plano de Desenvolvimento Individual com 5 abas integradas (Diagnóstico, Matriz de Gaps, Plano 70-20-10, Progressão e Riscos), incluindo sugestões inteligentes via LLM e comparação de perfis.

2. **Sistema de Workflow de Aprovação Configurável** - Plataforma completa para criação e gestão de workflows de aprovação personalizados com múltiplas camadas, notificações automáticas por e-mail e interface administrativa robusta.

---

## 🎯 Objetivos

### PDI Inteligente
- Criar uma experiência completa de desenvolvimento individual com diagnóstico 360°
- Implementar sugestões inteligentes de ações de desenvolvimento usando IA
- Permitir gestão completa de gaps, riscos e progressão
- Integrar pesquisas de competências com gráficos comparativos
- Automatizar identificação de lacunas e sugestões de ações

### Workflow de Aprovação
- Criar sistema totalmente configurável de workflows de aprovação
- Implementar fluxos de aprovação em cascata com 5+ camadas
- Automatizar notificações por e-mail em cada etapa
- Permitir que administradores criem e ajustem workflows sem código
- Integrar workflows com todos os módulos principais do sistema

---

## 🏗️ Arquitetura da Solução

### Estrutura de Banco de Dados

#### PDI Inteligente - Novas Tabelas

```sql
-- Tabela principal de PDI (já existe, será expandida)
pdi
  - id (PK)
  - employeeId (FK)
  - cycleId (FK)
  - status (draft, active, completed, cancelled)
  - createdAt, updatedAt

-- Diagnóstico de Competências
pdi_diagnostico_pesquisas
  - id (PK)
  - pdiId (FK)
  - competencyId (FK)
  - sentAt
  - status (pending, completed)

pdi_diagnostico_respostas
  - id (PK)
  - pesquisaId (FK)
  - responderId (FK)
  - responseType (self, manager, peer, subordinate)
  - score (1-5)
  - comments
  - respondedAt

-- Matriz de Gaps
pdi_matriz_gaps
  - id (PK)
  - pdiId (FK)
  - competencyId (FK)
  - currentLevel (1-5)
  - desiredLevel (1-5)
  - gapSize (calculated)
  - priority (high, medium, low)
  - impact (high, medium, low)
  - source (auto, manual)
  - createdAt, updatedAt

-- Plano 70-20-10
pdi_plano_70_20_10
  - id (PK)
  - pdiId (FK)
  - gapId (FK)
  - actionType (70_experience, 20_social, 10_formal)
  - title
  - description
  - startDate, endDate
  - responsibleId (FK)
  - resources
  - status (planned, in_progress, completed, cancelled)
  - suggestedByAI (boolean)
  - createdAt, updatedAt

-- Progressão
pdi_progressao
  - id (PK)
  - actionId (FK)
  - progressPercentage (0-100)
  - evidenceType (document, link, certificate, testimonial)
  - evidenceUrl
  - evidenceDescription
  - checkinDate
  - managerFeedback
  - createdAt, updatedAt

-- Riscos
pdi_riscos
  - id (PK)
  - pdiId (FK)
  - riskType (time, resources, support, organizational, priorities, motivation)
  - description
  - probability (high, medium, low)
  - impact (high, medium, low)
  - riskScore (calculated)
  - mitigationPlan
  - mitigationResponsibleId (FK)
  - mitigationDeadline
  - status (identified, mitigating, mitigated, materialized)
  - createdAt, updatedAt
```

#### Workflow de Aprovação - Novas Tabelas

```sql
-- Configuração de Workflows
workflow_configurations
  - id (PK)
  - workflowType (goals, pdi, evaluation, bonus, vacation, promotion, overtime, expenses, job_description, other)
  - name
  - description
  - isActive (boolean)
  - flowType (sequential, parallel, conditional)
  - createdBy (FK)
  - createdAt, updatedAt

-- Definição de Etapas
workflow_step_definitions
  - id (PK)
  - workflowConfigId (FK)
  - stepOrder (1, 2, 3, 4, 5...)
  - stepName
  - stepDescription
  - approverType (by_position, by_department, by_cost_center, specific_user, immediate_manager, area_director)
  - isRequired (boolean)
  - deadlineDays (integer)
  - allowedActions (approve, reject, request_changes, delegate)
  - createdAt, updatedAt

-- Aprovadores por Etapa
workflow_step_approvers
  - id (PK)
  - stepDefinitionId (FK)
  - approverId (FK) -- pode ser userId, positionId, departmentId, etc
  - approverType (user, position, department, cost_center)
  - createdAt

-- Instâncias de Workflow (execução)
workflow_instances
  - id (PK)
  - workflowConfigId (FK)
  - entityType (goal, pdi, evaluation, job_description, etc)
  - entityId (FK)
  - requesterId (FK)
  - currentStepOrder (integer)
  - status (pending, approved, rejected, cancelled)
  - startedAt
  - completedAt
  - createdAt, updatedAt

-- Histórico de Aprovações
workflow_approvals
  - id (PK)
  - workflowInstanceId (FK)
  - stepDefinitionId (FK)
  - approverId (FK)
  - action (approved, rejected, requested_changes, delegated)
  - comments
  - responseTime (minutes)
  - approvedAt
  - createdAt
```

---

## 📐 Fases de Implementação

### **FASE 1: PDI Inteligente - Estrutura Base** (Estimativa: 2-3 dias)

#### 1.1 Modelagem e Criação do Banco de Dados
- Criar schema completo das 6 novas tabelas do PDI
- Executar migrations com `pnpm db:push`
- Criar índices para otimização de queries
- Validar relacionamentos entre tabelas

#### 1.2 Backend - Routers tRPC
Criar routers em `server/routers/pdiIntelligent.ts`:

```typescript
// Estrutura dos routers
pdiIntelligent: router({
  // CRUD básico
  create: protectedProcedure,
  getById: protectedProcedure,
  update: protectedProcedure,
  delete: protectedProcedure,
  
  // Diagnóstico
  sendCompetencySurvey: protectedProcedure,
  getCompetencyResponses: protectedProcedure,
  submitCompetencyResponse: protectedProcedure,
  getRadarChartData: protectedProcedure,
  
  // Matriz de Gaps
  getGaps: protectedProcedure,
  createGap: protectedProcedure,
  updateGap: protectedProcedure,
  deleteGap: protectedProcedure,
  autoIdentifyGaps: protectedProcedure,
  
  // Plano 70-20-10
  getActions: protectedProcedure,
  createAction: protectedProcedure,
  updateAction: protectedProcedure,
  deleteAction: protectedProcedure,
  getActionsSuggestions: protectedProcedure, // LLM
  getDistribution: protectedProcedure, // calcula 70-20-10
  
  // Progressão
  getProgress: protectedProcedure,
  updateProgress: protectedProcedure,
  addEvidence: protectedProcedure,
  addManagerFeedback: protectedProcedure,
  
  // Riscos
  getRisks: protectedProcedure,
  createRisk: protectedProcedure,
  updateRisk: protectedProcedure,
  deleteRisk: protectedProcedure,
  identifyRisks: protectedProcedure, // LLM
  calculateRiskScore: protectedProcedure,
})
```

#### 1.3 Backend - Helpers de Banco de Dados
Criar funções em `server/db.ts`:

```typescript
// Diagnóstico
export async function sendCompetencySurvey(pdiId, competencies, recipients)
export async function getCompetencyResponses(pdiId)
export async function calculateCompetencyAverages(pdiId)

// Gaps
export async function getGapsByPdi(pdiId)
export async function autoIdentifyGaps(pdiId, evaluationData)
export async function calculateGapPriority(gap)

// Plano 70-20-10
export async function getActionsByPdi(pdiId)
export async function calculateActionDistribution(pdiId)
export async function validateDistribution(distribution)

// Progressão
export async function getProgressByAction(actionId)
export async function calculateOverallProgress(pdiId)

// Riscos
export async function getRisksByPdi(pdiId)
export async function calculateRiskScore(probability, impact)
export async function getMaterializedRisks(pdiId)
```

---

### **FASE 2: PDI Inteligente - Interface das Abas** (Estimativa: 3-4 dias)

#### 2.1 Estrutura de Navegação
Criar componente principal em `client/src/pages/PDIInteligente.tsx`:

```typescript
// Estrutura de abas
const tabs = [
  { id: 'diagnostico', label: 'Diagnóstico', icon: Activity },
  { id: 'gaps', label: 'Matriz de Gaps', icon: Target },
  { id: 'plano', label: 'Plano 70-20-10', icon: BookOpen },
  { id: 'progressao', label: 'Progressão', icon: TrendingUp },
  { id: 'riscos', label: 'Riscos', icon: AlertTriangle },
]
```

#### 2.2 Aba 1: Diagnóstico de Competências
Componente: `client/src/components/pdi/DiagnosticoTab.tsx`

**Funcionalidades:**
- Card de resumo de competências avaliadas
- Botão "Enviar Pesquisas" com modal de seleção de avaliadores
- Gráfico de estrela (Radar Chart) usando Recharts:
  - 5 séries de dados: autoavaliação, superior, pares, subordinados, média
  - Cores distintas para cada série
  - Tooltip com detalhes
  - Legenda interativa
- Tabela de competências com scores por avaliador
- Indicadores visuais de pontos fortes (verde) e áreas de melhoria (vermelho)
- Botão de exportação em PDF

**Componentes UI:**
```typescript
<DiagnosticoTab pdiId={pdiId}>
  <CompetencySummaryCard />
  <SendSurveyButton />
  <RadarChart data={competencyData} />
  <CompetencyTable data={competencyData} />
  <ExportPDFButton />
</DiagnosticoTab>
```

#### 2.3 Aba 2: Matriz de Gaps
Componente: `client/src/components/pdi/MatrizGapsTab.tsx`

**Funcionalidades:**
- Botão "Identificar Gaps Automaticamente" (usa dados da avaliação)
- Botão "Adicionar Gap Manualmente"
- Tabela de gaps com colunas:
  - Competência
  - Nível Atual (1-5)
  - Nível Desejado (1-5)
  - Gap (diferença)
  - Prioridade (badge colorido)
  - Impacto (badge colorido)
  - Ações (editar, excluir)
- Filtros: prioridade, impacto, fonte (auto/manual)
- Ordenação por gap size, prioridade, impacto
- Modal de edição de gap
- Matriz visual de prioridade x impacto

**Componentes UI:**
```typescript
<MatrizGapsTab pdiId={pdiId}>
  <GapActions>
    <AutoIdentifyButton />
    <AddGapButton />
  </GapActions>
  <GapFilters />
  <GapTable data={gaps} />
  <GapMatrixChart data={gaps} />
  <GapEditModal />
</MatrizGapsTab>
```

#### 2.4 Aba 3: Plano 70-20-10
Componente: `client/src/components/pdi/Plano702010Tab.tsx`

**Funcionalidades:**
- Indicador visual da distribuição 70-20-10 (gráfico de pizza)
- Alerta se distribuição não está equilibrada
- 3 seções expansíveis:
  - **70% Experiência Prática**
    - Lista de ações
    - Botão "Adicionar Ação 70%"
    - Botão "Sugerir Ações" (LLM)
  - **20% Aprendizado Social**
    - Lista de ações
    - Botão "Adicionar Ação 20%"
    - Botão "Sugerir Ações" (LLM)
  - **10% Educação Formal**
    - Lista de ações
    - Botão "Adicionar Ação 10%"
    - Botão "Sugerir Ações" (LLM)
- Card de ação com:
  - Título e descrição
  - Gap vinculado
  - Prazo e responsável
  - Recursos necessários
  - Status (badge)
  - Badge "Sugerido por IA" se aplicável
  - Ações: editar, excluir
- Modal de criação/edição de ação
- Modal de sugestões da IA (lista de sugestões para escolher)

**Componentes UI:**
```typescript
<Plano702010Tab pdiId={pdiId}>
  <DistributionChart distribution={distribution} />
  <DistributionAlert distribution={distribution} />
  
  <Section title="70% Experiência Prática">
    <ActionList actions={actions70} />
    <AddActionButton type="70" />
    <SuggestActionsButton type="70" />
  </Section>
  
  <Section title="20% Aprendizado Social">
    <ActionList actions={actions20} />
    <AddActionButton type="20" />
    <SuggestActionsButton type="20" />
  </Section>
  
  <Section title="10% Educação Formal">
    <ActionList actions={actions10} />
    <AddActionButton type="10" />
    <SuggestActionsButton type="10" />
  </Section>
  
  <ActionModal />
  <SuggestionsModal />
</Plano702010Tab>
```

#### 2.5 Aba 4: Progressão
Componente: `client/src/components/pdi/ProgressaoTab.tsx`

**Funcionalidades:**
- Timeline visual do PDI (componente vertical)
- Card de resumo de progresso geral (% concluído)
- Lista de ações com:
  - Barra de progresso (0%, 25%, 50%, 75%, 100%)
  - Botão "Atualizar Progresso"
  - Botão "Adicionar Evidência"
  - Lista de evidências anexadas
  - Feedback do gestor (se houver)
- Gráfico de evolução de competências ao longo do tempo (Line Chart)
- Sistema de check-in periódico com modal
- Alertas para ações atrasadas
- Celebração visual de marcos alcançados (confete, badge)
- Comparação: progresso planejado vs real (gráfico)
- Botão de exportação de relatório de progresso

**Componentes UI:**
```typescript
<ProgressaoTab pdiId={pdiId}>
  <ProgressSummaryCard progress={overallProgress} />
  <ProgressTimeline actions={actions} />
  <ActionProgressList actions={actions}>
    <ActionProgressCard>
      <ProgressBar percentage={percentage} />
      <UpdateProgressButton />
      <AddEvidenceButton />
      <EvidenceList />
      <ManagerFeedback />
    </ActionProgressCard>
  </ActionProgressList>
  <CompetencyEvolutionChart data={evolutionData} />
  <CheckinModal />
  <OverdueAlert actions={overdueActions} />
  <Milestonecelebration />
  <PlannedVsRealChart data={comparisonData} />
  <ExportReportButton />
</ProgressaoTab>
```

#### 2.6 Aba 5: Riscos
Componente: `client/src/components/pdi/RiscosTab.tsx`

**Funcionalidades:**
- Botão "Identificar Riscos Automaticamente" (LLM analisa PDI e sugere riscos)
- Botão "Adicionar Risco Manualmente"
- Matriz de risco (Probabilidade x Impacto) visual
- Tabela de riscos com colunas:
  - Tipo de risco (ícone + label)
  - Descrição
  - Probabilidade (badge)
  - Impacto (badge)
  - Score de risco (calculado)
  - Status (badge)
  - Ações (editar, excluir)
- Filtros: tipo, probabilidade, impacto, status
- Ordenação por score de risco
- Modal de criação/edição de risco com:
  - Seleção de tipo
  - Descrição do risco
  - Probabilidade (dropdown)
  - Impacto (dropdown)
  - Plano de mitigação (textarea)
  - Responsável pela mitigação (select)
  - Prazo para implementação (date)
- Alertas para riscos críticos (score alto)
- Seção de riscos materializados (histórico)
- Dashboard de monitoramento de riscos

**Componentes UI:**
```typescript
<RiscosTab pdiId={pdiId}>
  <RiskActions>
    <AutoIdentifyRisksButton />
    <AddRiskButton />
  </RiskActions>
  <RiskMatrixChart data={risks} />
  <RiskFilters />
  <RiskTable data={risks} />
  <RiskModal />
  <CriticalRiskAlert risks={criticalRisks} />
  <MaterializedRisksSection risks={materializedRisks} />
  <RiskMonitoringDashboard data={riskMetrics} />
</RiscosTab>
```

---

### **FASE 3: PDI Inteligente - Integrações LLM** (Estimativa: 2 dias)

#### 3.1 Sugestões de Ações de Desenvolvimento
Criar função em `server/_core/llm.ts`:

```typescript
export async function suggestDevelopmentActions(
  gap: Gap,
  employeeProfile: Employee,
  actionType: '70' | '20' | '10'
): Promise<ActionSuggestion[]> {
  const prompt = `
Você é um especialista em desenvolvimento de pessoas e RH.

Contexto:
- Funcionário: ${employeeProfile.name}
- Cargo: ${employeeProfile.position}
- Departamento: ${employeeProfile.department}
- Gap identificado: ${gap.competencyName}
- Nível atual: ${gap.currentLevel}
- Nível desejado: ${gap.desiredLevel}

Tarefa:
Sugira 3-5 ações de desenvolvimento do tipo ${actionType === '70' ? 'Experiência Prática (70%)' : actionType === '20' ? 'Aprendizado Social (20%)' : 'Educação Formal (10%)'} para fechar este gap.

${actionType === '70' ? 'Foque em: projetos desafiadores, novas responsabilidades, job rotation, resolução de problemas complexos.' : ''}
${actionType === '20' ? 'Foque em: mentoria, coaching, feedback de pares, comunidades de prática, networking.' : ''}
${actionType === '10' ? 'Foque em: cursos online, treinamentos presenciais, certificações, leitura de livros/artigos, workshops.' : ''}

Para cada ação, forneça:
1. Título (curto e objetivo)
2. Descrição detalhada (2-3 frases)
3. Prazo sugerido (em meses)
4. Recursos necessários
5. Resultado esperado
`;

  const response = await invokeLLM({
    messages: [
      { role: 'system', content: 'Você é um especialista em desenvolvimento de pessoas.' },
      { role: 'user', content: prompt }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'action_suggestions',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  durationMonths: { type: 'integer' },
                  resources: { type: 'string' },
                  expectedOutcome: { type: 'string' }
                },
                required: ['title', 'description', 'durationMonths', 'resources', 'expectedOutcome']
              }
            }
          },
          required: ['suggestions']
        }
      }
    }
  });

  return JSON.parse(response.choices[0].message.content).suggestions;
}
```

#### 3.2 Identificação Automática de Riscos
Criar função em `server/_core/llm.ts`:

```typescript
export async function identifyPDIRisks(
  pdi: PDI,
  actions: Action[],
  employeeProfile: Employee
): Promise<RiskSuggestion[]> {
  const prompt = `
Você é um especialista em gestão de riscos e desenvolvimento de pessoas.

Contexto:
- Funcionário: ${employeeProfile.name}
- Cargo: ${employeeProfile.position}
- PDI com ${actions.length} ações de desenvolvimento
- Duração do PDI: ${pdi.duration} meses
- Objetivos: ${pdi.objectives}

Ações planejadas:
${actions.map(a => `- ${a.title} (${a.actionType})`).join('\n')}

Tarefa:
Identifique 3-5 riscos potenciais que podem impedir o sucesso deste PDI.

Considere riscos de:
- Falta de tempo
- Falta de recursos
- Falta de apoio da liderança
- Mudanças organizacionais
- Prioridades conflitantes
- Falta de motivação

Para cada risco, forneça:
1. Tipo de risco
2. Descrição detalhada
3. Probabilidade (high, medium, low)
4. Impacto (high, medium, low)
5. Plano de mitigação sugerido
`;

  const response = await invokeLLM({
    messages: [
      { role: 'system', content: 'Você é um especialista em gestão de riscos.' },
      { role: 'user', content: prompt }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'risk_identification',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            risks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  riskType: { type: 'string', enum: ['time', 'resources', 'support', 'organizational', 'priorities', 'motivation'] },
                  description: { type: 'string' },
                  probability: { type: 'string', enum: ['high', 'medium', 'low'] },
                  impact: { type: 'string', enum: ['high', 'medium', 'low'] },
                  mitigationPlan: { type: 'string' }
                },
                required: ['riskType', 'description', 'probability', 'impact', 'mitigationPlan']
              }
            }
          },
          required: ['risks']
        }
      }
    }
  });

  return JSON.parse(response.choices[0].message.content).risks;
}
```

#### 3.3 Análise de Diagnóstico e Sugestão de Gaps
Criar função em `server/_core/llm.ts`:

```typescript
export async function analyzeCompetencyDiagnostic(
  competencyResponses: CompetencyResponse[],
  jobRequirements: Competency[]
): Promise<GapSuggestion[]> {
  // Implementação similar às anteriores
  // Analisa respostas de competências e sugere gaps prioritários
}
```

---

### **FASE 4: Workflow de Aprovação - Estrutura Base** (Estimativa: 2-3 dias)

#### 4.1 Modelagem e Criação do Banco de Dados
- Criar schema completo das 5 novas tabelas de workflow
- Executar migrations com `pnpm db:push`
- Criar índices para otimização
- Validar relacionamentos

#### 4.2 Backend - Routers tRPC
Criar routers em `server/routers/workflowConfig.ts`:

```typescript
workflowConfig: router({
  // Configuração de Workflows
  listConfigurations: adminProcedure,
  getConfigurationById: adminProcedure,
  createConfiguration: adminProcedure,
  updateConfiguration: adminProcedure,
  deleteConfiguration: adminProcedure,
  activateConfiguration: adminProcedure,
  deactivateConfiguration: adminProcedure,
  
  // Etapas de Workflow
  getSteps: adminProcedure,
  createStep: adminProcedure,
  updateStep: adminProcedure,
  deleteStep: adminProcedure,
  reorderSteps: adminProcedure,
  
  // Aprovadores
  getApprovers: adminProcedure,
  addApprover: adminProcedure,
  removeApprover: adminProcedure,
  
  // Preview
  previewWorkflow: adminProcedure,
})

workflowExecution: router({
  // Execução de Workflows
  startWorkflow: protectedProcedure,
  getWorkflowStatus: protectedProcedure,
  getPendingApprovals: protectedProcedure,
  approve: protectedProcedure,
  reject: protectedProcedure,
  requestChanges: protectedProcedure,
  delegate: protectedProcedure,
  
  // Histórico
  getApprovalHistory: protectedProcedure,
  getWorkflowMetrics: adminProcedure,
})
```

#### 4.3 Backend - Helpers de Banco de Dados
Criar funções em `server/db.ts`:

```typescript
// Configuração
export async function getWorkflowConfigurations()
export async function getWorkflowConfigByType(type)
export async function createWorkflowConfig(config)
export async function getWorkflowSteps(configId)
export async function createWorkflowStep(step)
export async function getStepApprovers(stepId)

// Execução
export async function createWorkflowInstance(configId, entityType, entityId, requesterId)
export async function getWorkflowInstance(instanceId)
export async function getCurrentStep(instanceId)
export async function getNextStep(instanceId)
export async function advanceWorkflow(instanceId)
export async function completeWorkflow(instanceId, status)

// Aprovações
export async function getPendingApprovalsForUser(userId)
export async function recordApproval(instanceId, stepId, approverId, action, comments)
export async function getApprovalHistory(instanceId)
export async function calculateResponseTime(approvalId)

// Métricas
export async function getWorkflowMetrics(configId, startDate, endDate)
export async function getApproverPerformance(approverId)
export async function getBottleneckSteps(configId)
```

---

### **FASE 5: Workflow de Aprovação - Interface de Configuração** (Estimativa: 3 dias)

#### 5.1 Página Principal de Workflows
Componente: `client/src/pages/aprovacoes/Workflows.tsx`

**Funcionalidades:**
- Grid de cards com workflows configurados
- Cada card mostra:
  - Tipo de workflow
  - Nome
  - Status (ativo/inativo)
  - Número de etapas
  - Botão "Configurar"
  - Toggle ativo/inativo
- Botão "Criar Novo Workflow" (destaque)
- Filtros: tipo, status
- Busca por nome

**Componentes UI:**
```typescript
<WorkflowsPage>
  <PageHeader>
    <CreateWorkflowButton />
    <WorkflowFilters />
  </PageHeader>
  <WorkflowGrid>
    {workflows.map(workflow => (
      <WorkflowCard key={workflow.id}>
        <WorkflowType type={workflow.type} />
        <WorkflowName name={workflow.name} />
        <WorkflowStatus isActive={workflow.isActive} />
        <StepCount count={workflow.stepCount} />
        <ConfigureButton />
        <ActiveToggle />
      </WorkflowCard>
    ))}
  </WorkflowGrid>
</WorkflowsPage>
```

#### 5.2 Interface de Configuração de Workflow
Componente: `client/src/components/workflow/WorkflowConfigModal.tsx`

**Funcionalidades:**
- **Etapa 1: Informações Básicas**
  - Seleção de tipo de workflow (dropdown com 10 opções)
  - Nome do workflow (input)
  - Descrição (textarea)
  - Tipo de fluxo (radio: sequencial, paralelo, condicional)
  
- **Etapa 2: Definição de Etapas**
  - Lista de etapas (drag and drop para reordenar)
  - Botão "Adicionar Etapa"
  - Para cada etapa:
    - Nome da etapa (input)
    - Descrição (textarea)
    - Tipo de aprovador (dropdown):
      - Por cargo específico
      - Por departamento
      - Por centro de custo
      - Usuário específico
      - Superior imediato
      - Diretor da área
    - Seleção de aprovadores (multi-select)
    - Aprovação obrigatória? (checkbox)
    - Prazo em dias (number input)
    - Ações permitidas (checkboxes: aprovar, rejeitar, solicitar ajustes, delegar)
    - Botão remover etapa
  
- **Etapa 3: Preview do Fluxo**
  - Diagrama visual do fluxo (usando React Flow ou similar)
  - Mostra todas as etapas conectadas
  - Mostra aprovadores de cada etapa
  - Validação de configuração
  
- **Etapa 4: Confirmação**
  - Resumo da configuração
  - Botão "Salvar e Ativar"
  - Botão "Salvar como Rascunho"

**Componentes UI:**
```typescript
<WorkflowConfigModal workflowId={workflowId}>
  <WizardSteps currentStep={currentStep}>
    <Step1_BasicInfo>
      <WorkflowTypeSelect />
      <WorkflowNameInput />
      <WorkflowDescriptionTextarea />
      <FlowTypeRadio />
    </Step1_BasicInfo>
    
    <Step2_StepDefinition>
      <AddStepButton />
      <StepList sortable>
        {steps.map((step, index) => (
          <StepCard key={step.id} index={index}>
            <StepNameInput />
            <StepDescriptionTextarea />
            <ApproverTypeSelect />
            <ApproverMultiSelect />
            <RequiredCheckbox />
            <DeadlineDaysInput />
            <AllowedActionsCheckboxes />
            <RemoveStepButton />
          </StepCard>
        ))}
      </StepList>
    </Step2_StepDefinition>
    
    <Step3_Preview>
      <WorkflowDiagram steps={steps} />
      <ValidationMessages />
    </Step3_Preview>
    
    <Step4_Confirmation>
      <ConfigSummary config={config} />
      <SaveAndActivateButton />
      <SaveAsDraftButton />
    </Step4_Confirmation>
  </WizardSteps>
</WorkflowConfigModal>
```

#### 5.3 Exemplo: Configuração do Workflow de Descrição de Cargo

**Configuração:**
```json
{
  "type": "job_description",
  "name": "Aprovação de Descrição de Cargo",
  "description": "Fluxo de aprovação em 5 etapas para descrições de cargo",
  "flowType": "sequential",
  "steps": [
    {
      "order": 1,
      "name": "Coordenador do Departamento",
      "description": "Coordenador revisa e ajusta a descrição de cargo",
      "approverType": "by_position",
      "approvers": ["Coordenador"],
      "isRequired": true,
      "deadlineDays": 3,
      "allowedActions": ["approve", "request_changes"]
    },
    {
      "order": 2,
      "name": "Gerente de Centro de Custo",
      "description": "Gerente de CC valida alinhamento com orçamento",
      "approverType": "by_cost_center",
      "approvers": ["manager"],
      "isRequired": true,
      "deadlineDays": 3,
      "allowedActions": ["approve", "reject", "request_changes"]
    },
    {
      "order": 3,
      "name": "Especialistas em Cargos",
      "description": "Especialistas de RH validam estrutura de cargos",
      "approverType": "specific_user",
      "approvers": ["user_id_1", "user_id_2"],
      "isRequired": true,
      "deadlineDays": 5,
      "allowedActions": ["approve", "reject", "request_changes"]
    },
    {
      "order": 4,
      "name": "Gerente de RH",
      "description": "Gerente de RH faz revisão final de RH",
      "approverType": "by_department",
      "approvers": ["RH"],
      "isRequired": true,
      "deadlineDays": 3,
      "allowedActions": ["approve", "reject", "request_changes"]
    },
    {
      "order": 5,
      "name": "Diretor de Gente, Adm e Inovação",
      "description": "Aprovação final executiva",
      "approverType": "specific_user",
      "approvers": ["director_user_id"],
      "isRequired": true,
      "deadlineDays": 5,
      "allowedActions": ["approve", "reject"]
    }
  ]
}
```

---

### **FASE 6: Workflow de Aprovação - Interface de Execução** (Estimativa: 2 dias)

#### 6.1 Dashboard de Aprovações Pendentes
Componente: `client/src/pages/aprovacoes/Dashboard.tsx`

**Funcionalidades:**
- Card de resumo: total de aprovações pendentes
- Filtros: tipo de workflow, data, prioridade
- Tabela de aprovações pendentes com colunas:
  - Tipo de workflow (ícone + label)
  - Título do item
  - Solicitante
  - Data de solicitação
  - Prazo (badge com urgência)
  - Etapa atual
  - Ações (botão "Revisar")
- Ordenação por urgência, data, tipo
- Badge de notificação no menu lateral

**Componentes UI:**
```typescript
<ApprovalDashboard>
  <SummaryCard pendingCount={pendingCount} />
  <ApprovalFilters />
  <ApprovalTable>
    {approvals.map(approval => (
      <ApprovalRow key={approval.id}>
        <WorkflowTypeIcon type={approval.type} />
        <ItemTitle title={approval.title} />
        <RequesterName name={approval.requester} />
        <RequestDate date={approval.requestedAt} />
        <DeadlineBadge deadline={approval.deadline} />
        <CurrentStep step={approval.currentStep} />
        <ReviewButton />
      </ApprovalRow>
    ))}
  </ApprovalTable>
</ApprovalDashboard>
```

#### 6.2 Página de Detalhes e Aprovação
Componente: `client/src/pages/aprovacoes/ApprovalDetail.tsx`

**Funcionalidades:**
- **Seção 1: Informações do Item**
  - Tipo de workflow
  - Título
  - Solicitante
  - Data de solicitação
  - Prazo
  - Etapa atual
  
- **Seção 2: Conteúdo do Item**
  - Visualização completa do item a ser aprovado
  - Formatação específica por tipo (PDI, Meta, Descrição de Cargo, etc)
  - Comparação com versão anterior (se aplicável)
  
- **Seção 3: Histórico de Aprovações**
  - Timeline vertical
  - Para cada aprovação:
    - Nome do aprovador
    - Etapa
    - Ação (aprovado, rejeitado, ajustes solicitados)
    - Comentários
    - Data e hora
    - Tempo de resposta
  
- **Seção 4: Ações**
  - Botão "Aprovar" (verde, grande)
  - Botão "Rejeitar" (vermelho)
  - Botão "Solicitar Ajustes" (amarelo)
  - Botão "Delegar" (cinza)
  - Campo de comentários (obrigatório)
  - Modal de confirmação antes de ação final

**Componentes UI:**
```typescript
<ApprovalDetailPage instanceId={instanceId}>
  <ItemInfoSection>
    <WorkflowType />
    <ItemTitle />
    <RequesterInfo />
    <RequestDate />
    <Deadline />
    <CurrentStepIndicator />
  </ItemInfoSection>
  
  <ItemContentSection>
    <ItemViewer item={item} type={workflowType} />
    <VersionComparison current={current} previous={previous} />
  </ItemContentSection>
  
  <ApprovalHistorySection>
    <ApprovalTimeline approvals={history} />
  </ApprovalHistorySection>
  
  <ActionsSection>
    <CommentTextarea required />
    <ApproveButton />
    <RejectButton />
    <RequestChangesButton />
    <DelegateButton />
  </ActionsSection>
  
  <ConfirmationModal />
</ApprovalDetailPage>
```

---

### **FASE 7: Sistema de Notificações por E-mail** (Estimativa: 2 dias)

#### 7.1 Templates de E-mail
Criar templates em `server/_core/emailTemplates/workflow/`:

**1. Nova Aprovação Pendente** (`newApproval.ts`)
```typescript
export function newApprovalEmailTemplate(data: {
  approverName: string;
  workflowType: string;
  itemTitle: string;
  itemDescription: string;
  requesterName: string;
  deadline: Date;
  approvalUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    /* Estilos profissionais */
  </style>
</head>
<body>
  <div class="container">
    <h1>Nova Aprovação Pendente</h1>
    <p>Olá ${data.approverName},</p>
    <p>Você tem uma nova aprovação pendente no Sistema AVD UISA.</p>
    
    <div class="info-box">
      <h2>${data.itemTitle}</h2>
      <p><strong>Tipo:</strong> ${data.workflowType}</p>
      <p><strong>Solicitante:</strong> ${data.requesterName}</p>
      <p><strong>Prazo:</strong> ${formatDate(data.deadline)}</p>
      <p><strong>Descrição:</strong> ${data.itemDescription}</p>
    </div>
    
    <div class="action-button">
      <a href="${data.approvalUrl}" class="btn-primary">Revisar e Aprovar</a>
    </div>
    
    <p class="footer">Este é um e-mail automático. Por favor, não responda.</p>
  </div>
</body>
</html>
  `;
}
```

**2. Item Aprovado** (`itemApproved.ts`)
**3. Item Rejeitado** (`itemRejected.ts`)
**4. Ajustes Solicitados** (`changesRequested.ts`)
**5. Lembrete de Aprovação** (`approvalReminder.ts`)
**6. Workflow Concluído** (`workflowCompleted.ts`)

#### 7.2 Serviço de Envio de E-mails
Criar serviço em `server/_core/workflowEmailService.ts`:

```typescript
import { sendEmail } from './email';
import * as templates from './emailTemplates/workflow';

export async function sendNewApprovalEmail(
  approver: User,
  workflowInstance: WorkflowInstance,
  item: any
) {
  const emailHtml = templates.newApprovalEmailTemplate({
    approverName: approver.name,
    workflowType: workflowInstance.workflowType,
    itemTitle: item.title,
    itemDescription: item.description,
    requesterName: workflowInstance.requester.name,
    deadline: calculateDeadline(workflowInstance),
    approvalUrl: `${process.env.APP_URL}/aprovacoes/${workflowInstance.id}`
  });

  await sendEmail({
    to: approver.email,
    subject: `Nova Aprovação Pendente: ${item.title}`,
    html: emailHtml
  });
}

export async function sendItemApprovedEmail(/* ... */) { /* ... */ }
export async function sendItemRejectedEmail(/* ... */) { /* ... */ }
export async function sendChangesRequestedEmail(/* ... */) { /* ... */ }
export async function sendApprovalReminderEmail(/* ... */) { /* ... */ }
export async function sendWorkflowCompletedEmail(/* ... */) { /* ... */ }
```

#### 7.3 Integração com Routers
Adicionar envio de e-mails nos routers de workflow:

```typescript
// Em workflowExecution router
approve: protectedProcedure
  .input(z.object({ instanceId: z.number(), comments: z.string() }))
  .mutation(async ({ ctx, input }) => {
    // 1. Registrar aprovação
    await recordApproval(input.instanceId, ctx.user.id, 'approved', input.comments);
    
    // 2. Avançar workflow
    const nextStep = await advanceWorkflow(input.instanceId);
    
    // 3. Enviar e-mail ao solicitante
    await sendItemApprovedEmail(instance, ctx.user, input.comments);
    
    // 4. Se houver próxima etapa, enviar e-mail ao próximo aprovador
    if (nextStep) {
      const nextApprover = await getStepApprover(nextStep.id);
      await sendNewApprovalEmail(nextApprover, instance, item);
    } else {
      // Workflow concluído
      await sendWorkflowCompletedEmail(instance);
    }
    
    return { success: true };
  }),
```

#### 7.4 Job Cron para Lembretes
Criar job em `server/_core/cron.ts`:

```typescript
// Lembrete de aprovações pendentes (diário às 9h)
cron.schedule('0 9 * * *', async () => {
  const overdueApprovals = await getOverdueApprovals();
  
  for (const approval of overdueApprovals) {
    const approver = await getUserById(approval.approverId);
    await sendApprovalReminderEmail(approver, approval);
  }
});
```

---

### **FASE 8: Integração de Workflows com Módulos Existentes** (Estimativa: 2 dias)

#### 8.1 Integração com PDI
Modificar `server/routers/pdiIntelligent.ts`:

```typescript
create: protectedProcedure
  .input(pdiSchema)
  .mutation(async ({ ctx, input }) => {
    // 1. Criar PDI
    const pdi = await createPDI(input);
    
    // 2. Iniciar workflow de aprovação
    const workflowConfig = await getWorkflowConfigByType('pdi');
    if (workflowConfig && workflowConfig.isActive) {
      const workflowInstance = await startWorkflow({
        configId: workflowConfig.id,
        entityType: 'pdi',
        entityId: pdi.id,
        requesterId: ctx.user.id
      });
      
      // 3. Enviar e-mail ao primeiro aprovador
      const firstStep = await getFirstStep(workflowConfig.id);
      const firstApprover = await getStepApprover(firstStep.id);
      await sendNewApprovalEmail(firstApprover, workflowInstance, pdi);
    }
    
    return pdi;
  }),
```

#### 8.2 Integração com Descrição de Cargo
Modificar `server/routers/jobDescriptions.ts`:

```typescript
create: protectedProcedure
  .input(jobDescriptionSchema)
  .mutation(async ({ ctx, input }) => {
    // 1. Criar descrição de cargo
    const jobDesc = await createJobDescription(input);
    
    // 2. Iniciar workflow de aprovação (5 etapas)
    const workflowConfig = await getWorkflowConfigByType('job_description');
    if (workflowConfig && workflowConfig.isActive) {
      const workflowInstance = await startWorkflow({
        configId: workflowConfig.id,
        entityType: 'job_description',
        entityId: jobDesc.id,
        requesterId: ctx.user.id
      });
      
      // 3. Enviar e-mail ao Coordenador (primeira etapa)
      const firstStep = await getFirstStep(workflowConfig.id);
      const coordinator = await getStepApprover(firstStep.id);
      await sendNewApprovalEmail(coordinator, workflowInstance, jobDesc);
    }
    
    return jobDesc;
  }),
```

#### 8.3 Integração com Outros Módulos
- Metas SMART (`goalsRouter.ts`)
- Avaliação de Desempenho (`evaluation360Router.ts`)
- Bônus (`bonusRouter.ts`)
- Promoção (criar novo router se necessário)

#### 8.4 Indicador de Status de Aprovação
Adicionar componente visual em cada módulo:

```typescript
<WorkflowStatusBadge instanceId={item.workflowInstanceId}>
  {/* Mostra: Pendente, Em Aprovação (Etapa X/Y), Aprovado, Rejeitado */}
</WorkflowStatusBadge>
```

---

### **FASE 9: Dashboard Administrativo de Workflows** (Estimativa: 1 dia)

#### 9.1 Página de Métricas
Componente: `client/src/pages/aprovacoes/WorkflowMetrics.tsx`

**Funcionalidades:**
- Cards de resumo:
  - Total de workflows ativos
  - Total de aprovações pendentes
  - Taxa de aprovação geral
  - Tempo médio de aprovação
- Gráficos:
  - Aprovações por período (Line Chart)
  - Taxa de aprovação por tipo (Bar Chart)
  - Distribuição de status (Pie Chart)
  - Gargalos por etapa (Bar Chart horizontal)
- Tabela de performance de aprovadores:
  - Nome
  - Total de aprovações
  - Taxa de aprovação
  - Tempo médio de resposta
  - Aprovações pendentes
- Filtros: período, tipo de workflow, departamento
- Exportação de relatório em PDF/Excel

---

### **FASE 10: Testes e Validação** (Estimativa: 2 dias)

#### 10.1 Testes Unitários - PDI Inteligente
Criar testes em `tests/pdi-intelligent.test.ts`:

```typescript
describe('PDI Inteligente', () => {
  describe('Diagnóstico', () => {
    it('deve enviar pesquisa de competências', async () => { /* ... */ });
    it('deve calcular médias de competências corretamente', async () => { /* ... */ });
    it('deve gerar dados para gráfico de estrela', async () => { /* ... */ });
  });
  
  describe('Matriz de Gaps', () => {
    it('deve identificar gaps automaticamente', async () => { /* ... */ });
    it('deve calcular prioridade de gaps', async () => { /* ... */ });
    it('deve permitir CRUD de gaps', async () => { /* ... */ });
  });
  
  describe('Plano 70-20-10', () => {
    it('deve sugerir ações usando LLM', async () => { /* ... */ });
    it('deve calcular distribuição 70-20-10', async () => { /* ... */ });
    it('deve validar distribuição equilibrada', async () => { /* ... */ });
  });
  
  describe('Progressão', () => {
    it('deve atualizar progresso de ação', async () => { /* ... */ });
    it('deve adicionar evidências', async () => { /* ... */ });
    it('deve calcular progresso geral', async () => { /* ... */ });
  });
  
  describe('Riscos', () => {
    it('deve identificar riscos automaticamente', async () => { /* ... */ });
    it('deve calcular score de risco', async () => { /* ... */ });
    it('deve permitir CRUD de riscos', async () => { /* ... */ });
  });
});
```

#### 10.2 Testes Unitários - Workflow de Aprovação
Criar testes em `tests/workflow.test.ts`:

```typescript
describe('Workflow de Aprovação', () => {
  describe('Configuração', () => {
    it('deve criar workflow com múltiplas etapas', async () => { /* ... */ });
    it('deve validar configuração de workflow', async () => { /* ... */ });
    it('deve permitir reordenar etapas', async () => { /* ... */ });
  });
  
  describe('Execução', () => {
    it('deve iniciar workflow ao criar PDI', async () => { /* ... */ });
    it('deve avançar para próxima etapa após aprovação', async () => { /* ... */ });
    it('deve enviar e-mail ao aprovador', async () => { /* ... */ });
    it('deve registrar aprovação no histórico', async () => { /* ... */ });
    it('deve concluir workflow após todas as aprovações', async () => { /* ... */ });
  });
  
  describe('Aprovação', () => {
    it('deve permitir aprovar item', async () => { /* ... */ });
    it('deve permitir rejeitar item', async () => { /* ... */ });
    it('deve permitir solicitar ajustes', async () => { /* ... */ });
    it('deve validar permissões de aprovador', async () => { /* ... */ });
  });
  
  describe('Notificações', () => {
    it('deve enviar e-mail de nova aprovação', async () => { /* ... */ });
    it('deve enviar e-mail de item aprovado', async () => { /* ... */ });
    it('deve enviar e-mail de item rejeitado', async () => { /* ... */ });
    it('deve enviar lembrete de aprovação pendente', async () => { /* ... */ });
  });
});
```

#### 10.3 Testes de Integração
Criar testes em `tests/integration/workflow-pdi.test.ts`:

```typescript
describe('Integração Workflow + PDI', () => {
  it('deve criar PDI e iniciar workflow automaticamente', async () => { /* ... */ });
  it('deve aprovar PDI em todas as 5 etapas', async () => { /* ... */ });
  it('deve enviar e-mails em cada etapa', async () => { /* ... */ });
  it('deve concluir workflow e ativar PDI', async () => { /* ... */ });
});
```

#### 10.4 Testes Manuais
- [ ] Testar criação de PDI completo com todas as abas
- [ ] Testar envio de pesquisas de competências
- [ ] Testar sugestões de ações via LLM
- [ ] Testar identificação de riscos via LLM
- [ ] Testar configuração de workflow de 5 etapas
- [ ] Testar fluxo completo de aprovação
- [ ] Testar envio de e-mails em cada etapa
- [ ] Testar rejeição e solicitação de ajustes
- [ ] Testar delegação de aprovação
- [ ] Testar lembretes automáticos
- [ ] Testar dashboard de métricas
- [ ] Testar responsividade em mobile

---

## 📊 Resumo de Entregas

### PDI Inteligente
✅ **5 Abas Completas:**
1. Diagnóstico - Gráfico de estrela 360°, envio de pesquisas
2. Matriz de Gaps - Identificação automática, priorização
3. Plano 70-20-10 - Sugestões IA, distribuição visual
4. Progressão - Timeline, evidências, check-ins
5. Riscos - Identificação IA, matriz de risco, mitigação

✅ **Integrações LLM:**
- Sugestões de ações de desenvolvimento personalizadas
- Identificação automática de riscos
- Análise de diagnóstico e sugestão de gaps

✅ **Funcionalidades:**
- CRUD completo em todas as abas
- Comparação de perfis (atual vs desejado)
- Exportação de relatórios em PDF
- Notificações automáticas

### Workflow de Aprovação
✅ **Sistema Configurável:**
- Interface completa de configuração de workflows
- Suporte a 10 tipos de workflow (extensível)
- Drag and drop para reordenar etapas
- Preview visual do fluxo

✅ **Execução de Workflows:**
- Fluxo de aprovação em cascata (5+ camadas)
- Dashboard de aprovações pendentes
- Histórico completo de aprovações
- Métricas e performance

✅ **Notificações por E-mail:**
- 6 templates profissionais
- Envio automático em cada etapa
- Lembretes de aprovações pendentes
- Confirmação de conclusão

✅ **Integrações:**
- PDI Inteligente
- Descrição de Cargo
- Metas SMART
- Avaliação de Desempenho
- Bônus e outros módulos

---

## 🎯 Cronograma Estimado

| Fase | Descrição | Duração | Dependências |
|------|-----------|---------|--------------|
| 1 | PDI - Estrutura Base | 2-3 dias | - |
| 2 | PDI - Interface das Abas | 3-4 dias | Fase 1 |
| 3 | PDI - Integrações LLM | 2 dias | Fase 2 |
| 4 | Workflow - Estrutura Base | 2-3 dias | - |
| 5 | Workflow - Interface de Configuração | 3 dias | Fase 4 |
| 6 | Workflow - Interface de Execução | 2 dias | Fase 5 |
| 7 | Sistema de Notificações por E-mail | 2 dias | Fase 6 |
| 8 | Integração com Módulos Existentes | 2 dias | Fases 3, 7 |
| 9 | Dashboard Administrativo | 1 dia | Fase 8 |
| 10 | Testes e Validação | 2 dias | Todas |

**Total Estimado: 21-24 dias úteis (4-5 semanas)**

---

## 🚀 Próximos Passos

1. **Aprovação do Plano** - Revisar e aprovar este plano de implementação
2. **Priorização** - Decidir se implementar PDI primeiro, Workflow primeiro, ou em paralelo
3. **Início da Implementação** - Começar pela Fase 1 do módulo priorizado
4. **Revisões Periódicas** - Checkpoints ao final de cada fase para validação
5. **Entrega Incremental** - Entregar funcionalidades à medida que ficam prontas

---

## 📝 Observações Importantes

### Tecnologias Utilizadas
- **Backend:** tRPC, Drizzle ORM, MySQL/TiDB
- **Frontend:** React 19, Tailwind CSS 4, shadcn/ui
- **Gráficos:** Recharts (Radar Chart, Line Chart, Bar Chart, Pie Chart)
- **LLM:** Integração com Manus LLM (invokeLLM)
- **E-mail:** SMTP configurável, templates HTML profissionais
- **Notificações:** WebSocket para notificações em tempo real

### Considerações de Performance
- Índices otimizados nas tabelas de workflow para queries rápidas
- Cache de configurações de workflow em memória
- Paginação em listas de aprovações
- Lazy loading de evidências e anexos

### Considerações de Segurança
- Validação de permissões em cada etapa de aprovação
- Apenas aprovadores designados podem aprovar
- Logs de auditoria de todas as ações de workflow
- Proteção contra aprovação duplicada
- Validação de integridade de dados

### Escalabilidade
- Sistema de workflow suporta workflows complexos (10+ etapas)
- Suporte a aprovação paralela (múltiplos aprovadores simultâneos)
- Suporte a workflows condicionais (baseados em regras)
- Arquitetura preparada para adicionar novos tipos de workflow

---

**Documento preparado por:** Sistema AVD UISA  
**Data:** 07/12/2025  
**Versão:** 1.0
