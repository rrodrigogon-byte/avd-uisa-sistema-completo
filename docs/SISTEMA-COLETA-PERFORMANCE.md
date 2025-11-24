# Sistema de Coleta de Dados de Performance - AVD UISA

**Versão**: 1.0  
**Data**: 20 de Novembro de 2024  
**Autor**: Equipe AVD UISA

---

## 📊 Visão Geral

O Sistema AVD UISA utiliza uma **metodologia integrada de coleta de dados de performance** baseada na fórmula **40-30-30**, que combina três fontes principais de dados para calcular a performance final de cada colaborador.

### Fórmula de Performance

```
Performance Final = (Metas × 40%) + (Avaliação 360° × 30%) + (Competências × 30%)
```

Esta abordagem garante uma avaliação **holística e equilibrada**, considerando:
- **Resultados objetivos** (metas SMART)
- **Comportamentos e soft skills** (avaliação 360°)
- **Competências técnicas e gaps** (análise de competências)

---

## 🎯 Componente 1: Metas SMART (40%)

### Fonte de Dados
**Tabela**: `smartGoals`  
**Campos principais**:
- `progress` (0-100%): Progresso atual da meta
- `targetValue`: Valor alvo
- `currentValue`: Valor atual alcançado
- `status`: Status da meta (ativa, concluída, cancelada)
- `overallSmartScore`: Score de validação SMART (0-100)

### Processo de Coleta

#### 1. Criação de Metas
```typescript
// Endpoint: goalsRouter.create
const meta = await trpc.goals.create.mutate({
  employeeId: 123,
  cycleId: 2025,
  title: "Aumentar vendas em 20%",
  description: "Meta de crescimento de vendas do trimestre",
  category: "financeira",
  measurementUnit: "%",
  targetValue: 120,
  currentValue: 0,
  startDate: "2025-01-01",
  dueDate: "2025-03-31",
});
```

#### 2. Validação SMART Automática
O sistema valida automaticamente cada meta criada usando 5 critérios:

```typescript
function validateSMART(meta: Goal): SmartScores {
  return {
    specificScore: validateSpecific(meta.title, meta.description),
    measurableScore: validateMeasurable(meta.measurementUnit, meta.targetValue),
    achievableScore: validateAchievable(meta.targetValue, historicalAverage),
    relevantScore: validateRelevant(meta.category, meta.impact),
    timeBoundScore: validateTimeBound(meta.startDate, meta.dueDate),
    overallSmartScore: (S + M + A + R + T) / 5,
  };
}
```

**Critérios de Validação:**
- **S (Specific)**: Verbo de ação + descrição clara (0-100 pontos)
- **M (Measurable)**: Unidade de medida + valor alvo (0-100 pontos)
- **A (Achievable)**: Realismo baseado em histórico (0-100 pontos)
- **R (Relevant)**: Categoria + impacto no negócio (0-100 pontos)
- **T (Time-bound)**: Prazo entre 1-24 meses (0-100 pontos)

#### 3. Atualização de Progresso
```typescript
// Endpoint: goalsRouter.updateProgress
await trpc.goals.updateProgress.mutate({
  id: 456,
  currentValue: 115, // 115% de vendas (de 120% alvo)
  comments: "Vendas acima da expectativa no Q1",
});

// Sistema calcula automaticamente:
progress = (currentValue / targetValue) * 100; // 95.8%
```

#### 4. Cálculo do Score de Metas
```typescript
function calculateGoalsScore(employeeId: number, cycleId: number): number {
  const goals = getActiveGoals(employeeId, cycleId);
  
  if (goals.length === 0) return 0;
  
  // Média ponderada pelo peso de cada meta
  const weightedSum = goals.reduce((sum, goal) => {
    return sum + (goal.progress * goal.weight);
  }, 0);
  
  const totalWeight = goals.reduce((sum, goal) => sum + goal.weight, 0);
  
  return (weightedSum / totalWeight) * 100; // 0-100
}
```

**Exemplo de Cálculo:**
```
Colaborador com 3 metas:
- Meta 1: 95% progresso, peso 40% → 95 × 0.40 = 38
- Meta 2: 80% progresso, peso 30% → 80 × 0.30 = 24
- Meta 3: 100% progresso, peso 30% → 100 × 0.30 = 30

Score de Metas = (38 + 24 + 30) / 100 = 92/100
```

### Workflow de Aprovação
1. **Colaborador** cria meta (status: rascunho)
2. **Sistema** valida SMART automaticamente
3. **Colaborador** submete para aprovação
4. **Gestor** aprova/rejeita (com comentários)
5. **Meta aprovada** entra no cálculo de performance

---

## 👥 Componente 2: Avaliação 360° (30%)

### Fonte de Dados
**Tabela**: `performanceEvaluations`  
**Campos principais**:
- `evaluatorType`: self, manager, peer, subordinate, consensus
- `finalScore` (0-5): Score final da avaliação
- `responses`: JSON com respostas das 23 perguntas
- `workflowStatus`: pending_self, pending_manager, pending_consensus, completed

### Processo de Coleta

#### 1. Criação de Ciclo de Avaliação
```typescript
// Endpoint: evaluation360Router.create
const avaliacao = await trpc.evaluation360.create.mutate({
  employeeId: 123,
  cycleId: 2025,
});
```

#### 2. Workflow Sequencial de Avaliação

**Etapa 1: Autoavaliação**
```typescript
// Endpoint: evaluation360Router.submitSelfAssessment
await trpc.evaluation360.submitSelfAssessment.mutate({
  evaluationId: 789,
  responses: [
    { questionId: 1, rating: 4 }, // Escala 1-5
    { questionId: 2, rating: 5 },
    // ... 23 perguntas
  ],
});

// Sistema atualiza:
workflowStatus = "pending_manager"
selfCompletedAt = NOW()
```

**Etapa 2: Avaliação do Gestor**
```typescript
// Endpoint: evaluation360Router.submitManagerAssessment
await trpc.evaluation360.submitManagerAssessment.mutate({
  evaluationId: 789,
  responses: [
    { questionId: 1, rating: 5 },
    { questionId: 2, rating: 4 },
    // ... 23 perguntas
  ],
  comments: "Colaborador demonstrou excelente desempenho...",
});

// Sistema atualiza:
workflowStatus = "pending_consensus"
managerCompletedAt = NOW()
```

**Etapa 3: Consenso (Gestor + RH)**
```typescript
// Endpoint: evaluation360Router.submitConsensus
await trpc.evaluation360.submitConsensus.mutate({
  evaluationId: 789,
  finalScore: 4.5, // Score final após consenso
  comments: "Consenso: colaborador pronto para promoção",
});

// Sistema atualiza:
workflowStatus = "completed"
consensusCompletedAt = NOW()
status = "concluida"
```

#### 3. Perguntas Padrão (23 perguntas em 6 categorias)

**Tabela**: `evaluation360Questions`

| Categoria | Perguntas | Tipo |
|-----------|-----------|------|
| **Competências Técnicas** | 5 perguntas | Escala 1-5 |
| **Trabalho em Equipe** | 4 perguntas | Escala 1-5 |
| **Liderança** | 4 perguntas | Escala 1-5 |
| **Comunicação** | 3 perguntas | Escala 1-5 |
| **Inovação** | 3 perguntas | Escala 1-5 |
| **Feedback Aberto** | 4 perguntas | Texto livre |

#### 4. Cálculo do Score 360°
```typescript
function calculate360Score(employeeId: number, cycleId: number): number {
  const evaluations = get360Evaluations(employeeId, cycleId);
  
  if (evaluations.length === 0) return 0;
  
  // Média ponderada por tipo de avaliador
  const weights = {
    self: 0.20,        // 20% autoavaliação
    manager: 0.40,     // 40% gestor
    peer: 0.20,        // 20% pares
    subordinate: 0.20, // 20% subordinados
  };
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const eval of evaluations) {
    const weight = weights[eval.evaluatorType] || 0;
    weightedSum += eval.finalScore * weight;
    totalWeight += weight;
  }
  
  return (weightedSum / totalWeight) * 20; // Escala 0-100
}
```

**Exemplo de Cálculo:**
```
Colaborador com 4 avaliações:
- Autoavaliação: 4.0, peso 20% → 4.0 × 0.20 = 0.80
- Gestor: 4.5, peso 40% → 4.5 × 0.40 = 1.80
- Par: 4.2, peso 20% → 4.2 × 0.20 = 0.84
- Subordinado: 4.3, peso 20% → 4.3 × 0.20 = 0.86

Score 360° = (0.80 + 1.80 + 0.84 + 0.86) / 1.0 = 4.3/5.0
Convertido para 0-100: 4.3 × 20 = 86/100
```

---

## 🎓 Componente 3: Competências (30%)

### Fonte de Dados
**Tabela**: `pdiCompetencyGaps`  
**Campos principais**:
- `competencyName`: Nome da competência
- `currentLevel` (1-5): Nível atual do colaborador
- `targetLevel` (1-5): Nível esperado para o cargo
- `gap`: Diferença (targetLevel - currentLevel)
- `priority`: alta, media, baixa

### Processo de Coleta

#### 1. Identificação de Gaps de Competências
```typescript
// Endpoint: pdiIntelligentRouter.addGap
await trpc.pdiIntelligent.addGap.mutate({
  pdiPlanId: 456,
  competencyName: "Liderança de Equipes",
  currentLevel: 3,
  targetLevel: 5,
  gap: 2,
  priority: "alta",
  responsibilities: "Liderar equipe de 10 pessoas, definir metas...",
});
```

#### 2. Fontes de Identificação de Gaps

**Fonte 1: Testes Psicométricos**
```typescript
// Após teste DISC, Big Five, etc.
const testResults = await trpc.psychometric.getTests.query({ employeeId: 123 });

// Sistema analisa resultados e sugere gaps
const recommendations = await trpc.psychometric.getPDIRecommendations.query({
  employeeId: 123,
  testTypes: ["disc", "bigfive", "leadership"],
});

// Exemplo de recomendação:
{
  competency: "Liderança Transformacional",
  currentLevel: 2,
  targetLevel: 4,
  gap: 2,
  reasoning: "Teste de Liderança indica perfil mais operacional que estratégico",
}
```

**Fonte 2: Comparação de Perfis**
```typescript
// Endpoint: pdiIntelligentRouter.compareProfiles
const comparison = await trpc.pdiIntelligent.compareProfiles.mutate({
  employeeId: 123,
  targetPositionId: 456, // Cargo-alvo (ex: Gerente)
});

// Sistema compara:
// - Perfil atual (testes psicométricos)
// - Perfil desejado (requisitos do cargo-alvo)
// - Identifica gaps automaticamente
```

**Fonte 3: Avaliação 360° (Feedback de Competências)**
```typescript
// Perguntas da avaliação 360° mapeadas para competências
const competencyMapping = {
  "Trabalho em Equipe": [1, 2, 3, 4],     // IDs das perguntas
  "Comunicação": [5, 6, 7],
  "Liderança": [8, 9, 10, 11],
  // ...
};

// Sistema extrai scores por competência
const competencyScores = extractCompetencyScores(evaluation360);
```

#### 3. Cálculo do Score de Competências
```typescript
function calculateCompetenciesScore(employeeId: number): number {
  const gaps = getCompetencyGaps(employeeId);
  
  if (gaps.length === 0) return 50; // Sem gaps = neutro
  
  // Média de aderência (quanto menor o gap, maior o score)
  const adherenceSum = gaps.reduce((sum, gap) => {
    const adherence = (gap.targetLevel - gap.gap) / gap.targetLevel;
    return sum + (adherence * 100);
  }, 0);
  
  return adherenceSum / gaps.length; // 0-100
}
```

**Exemplo de Cálculo:**
```
Colaborador com 4 competências:
- Liderança: atual 3, alvo 5, gap 2 → aderência = (5-2)/5 = 60%
- Comunicação: atual 4, alvo 5, gap 1 → aderência = (5-1)/5 = 80%
- Inovação: atual 5, alvo 5, gap 0 → aderência = (5-0)/5 = 100%
- Técnica: atual 3, alvo 4, gap 1 → aderência = (4-1)/4 = 75%

Score de Competências = (60 + 80 + 100 + 75) / 4 = 78.75/100
```

---

## 🔄 Integração e Cálculo Final

### Endpoint de Cálculo Integrado
```typescript
// Endpoint: performanceRouter.calculateFinalScore
const finalScore = await trpc.performance.calculateFinalScore.query({
  employeeId: 123,
  cycleId: 2025,
});

// Retorna:
{
  employeeId: 123,
  cycleId: 2025,
  goalsScore: 92,        // 40% de peso
  evaluation360Score: 86, // 30% de peso
  competenciesScore: 79,  // 30% de peso
  finalScore: 86.5,       // Média ponderada
  classification: "Alto Desempenho", // Baseado em faixas
  calculatedAt: "2025-11-20T12:00:00Z",
}
```

### Fórmula Detalhada
```typescript
function calculateFinalPerformance(employeeId: number, cycleId: number): PerformanceResult {
  // 1. Calcular componente de Metas (40%)
  const goalsScore = calculateGoalsScore(employeeId, cycleId);
  
  // 2. Calcular componente de Avaliação 360° (30%)
  const evaluation360Score = calculate360Score(employeeId, cycleId);
  
  // 3. Calcular componente de Competências (30%)
  const competenciesScore = calculateCompetenciesScore(employeeId);
  
  // 4. Aplicar pesos e calcular score final
  const finalScore = (
    (goalsScore * 0.40) +
    (evaluation360Score * 0.30) +
    (competenciesScore * 0.30)
  );
  
  // 5. Classificar baseado em faixas
  const classification = classifyPerformance(finalScore);
  
  return {
    goalsScore,
    evaluation360Score,
    competenciesScore,
    finalScore,
    classification,
  };
}
```

### Faixas de Classificação
```typescript
function classifyPerformance(score: number): string {
  if (score >= 90) return "Excepcional";
  if (score >= 80) return "Alto Desempenho";
  if (score >= 70) return "Bom Desempenho";
  if (score >= 60) return "Desempenho Adequado";
  return "Necessita Melhoria";
}
```

---

## 📈 Armazenamento e Auditoria

### Tabela de Performance Consolidada
```sql
CREATE TABLE performanceScores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employeeId INT NOT NULL,
  cycleId INT NOT NULL,
  
  -- Componentes
  goalsScore DECIMAL(5,2),
  evaluation360Score DECIMAL(5,2),
  competenciesScore DECIMAL(5,2),
  
  -- Score final
  finalScore DECIMAL(5,2) NOT NULL,
  classification VARCHAR(50),
  
  -- Detalhes
  goalsCount INT,
  goalsCompleted INT,
  evaluationsCount INT,
  competencyGapsCount INT,
  
  -- Auditoria
  calculatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  calculatedBy INT,
  
  FOREIGN KEY (employeeId) REFERENCES employees(id),
  FOREIGN KEY (cycleId) REFERENCES evaluationCycles(id),
  UNIQUE KEY unique_employee_cycle (employeeId, cycleId)
);
```

### Histórico de Alterações
```sql
CREATE TABLE performanceScoreHistory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  performanceScoreId INT NOT NULL,
  oldScore DECIMAL(5,2),
  newScore DECIMAL(5,2),
  reason TEXT,
  changedBy INT,
  changedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (performanceScoreId) REFERENCES performanceScores(id)
);
```

---

## 🔍 Validações e Regras de Negócio

### 1. Validação de Dados Mínimos
```typescript
function validatePerformanceCalculation(employeeId: number, cycleId: number): ValidationResult {
  const errors: string[] = [];
  
  // Verificar metas
  const goals = getActiveGoals(employeeId, cycleId);
  if (goals.length === 0) {
    errors.push("Colaborador não possui metas ativas no ciclo");
  }
  
  // Verificar avaliação 360°
  const evaluations = get360Evaluations(employeeId, cycleId);
  if (!evaluations.some(e => e.evaluatorType === "manager")) {
    errors.push("Avaliação do gestor não foi concluída");
  }
  
  // Verificar competências
  const gaps = getCompetencyGaps(employeeId);
  if (gaps.length === 0) {
    errors.push("Gaps de competências não foram identificados");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

### 2. Regras de Cálculo
- **Mínimo de 1 meta ativa** para cálculo de performance
- **Avaliação do gestor obrigatória** (autoavaliação opcional)
- **Metas canceladas não entram no cálculo**
- **Apenas avaliações concluídas** são consideradas
- **Gaps de competências priorizados** têm peso maior

### 3. Recálculo Automático
```typescript
// Triggers de recálculo
cron.schedule("0 0 * * *", async () => {
  // Recalcular performance de todos os colaboradores com dados atualizados
  const employees = await getActiveEmployees();
  
  for (const employee of employees) {
    const currentCycle = await getCurrentCycle();
    
    const validation = validatePerformanceCalculation(employee.id, currentCycle.id);
    
    if (validation.isValid) {
      const performance = calculateFinalPerformance(employee.id, currentCycle.id);
      await savePerformanceScore(performance);
    }
  }
});
```

---

## 📊 Dashboards e Relatórios

### Dashboard de Performance Integrada
**Página**: `/performance-integrada`

**Visualizações:**
1. **Score Final** (gauge chart 0-100)
2. **Breakdown por Componente** (gráfico de barras)
3. **Evolução Temporal** (linha temporal)
4. **Comparação com Média do Departamento** (radar chart)
5. **Detalhamento de Metas** (tabela)
6. **Detalhamento de Avaliações 360°** (tabela)
7. **Detalhamento de Gaps de Competências** (tabela)

### Relatório Executivo
```typescript
// Endpoint: performanceRouter.getExecutiveReport
const report = await trpc.performance.getExecutiveReport.query({
  departmentId: 10,
  cycleId: 2025,
});

// Retorna:
{
  department: "Tecnologia",
  cycle: "2025",
  totalEmployees: 50,
  avgFinalScore: 82.5,
  distribution: {
    excepcional: 10,
    altoDesempenho: 25,
    bomDesempenho: 12,
    adequado: 3,
    necessitaMelhoria: 0,
  },
  topPerformers: [...],
  lowPerformers: [...],
  trends: {
    goalsCompletion: 85%,
    evaluation360Completion: 100%,
    avgCompetencyGap: 1.2,
  },
}
```

---

## 🔐 Segurança e Permissões

### Controle de Acesso
```typescript
// Quem pode ver performance de quem?
const permissions = {
  // Colaborador vê apenas sua própria performance
  employee: (userId: number, targetEmployeeId: number) => {
    return userId === targetEmployeeId;
  },
  
  // Gestor vê performance de subordinados diretos e indiretos
  manager: async (userId: number, targetEmployeeId: number) => {
    const employee = await getEmployeeByUserId(userId);
    const subordinates = await getAllSubordinates(employee.id);
    return subordinates.some(s => s.id === targetEmployeeId);
  },
  
  // RH vê performance de todos
  hr: (userRole: string) => {
    return userRole === "admin";
  },
};
```

---

## 📚 Referências

### Documentação Relacionada
- [Especificações Técnicas Completas](./ESPECIFICACOES-TECNICAS-COMPLETAS.md)
- [Regras de Negócio - Metas SMART](./ESPECIFICACOES-TECNICAS-COMPLETAS.md#validação-smart-de-metas)
- [Workflow de Avaliação 360°](./ESPECIFICACOES-TECNICAS-COMPLETAS.md#avaliação-360°)

### Endpoints Backend
- `goalsRouter`: Gestão de metas SMART
- `evaluation360Router`: Avaliação 360° completa
- `pdiIntelligentRouter`: PDI e gaps de competências
- `performanceRouter`: Cálculo integrado de performance

---

**Documento gerado pelo Sistema AVD UISA**  
**Última atualização**: 20/11/2024
