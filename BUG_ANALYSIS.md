# Análise do Erro: TypeError: c.filter is not a function

## 📋 Resumo Executivo

**Erro:** `TypeError: c.filter is not a function`  
**Severidade:** CRÍTICA  
**Impacto:** Múltiplas telas do sistema  
**Causa Raiz:** Props de array sendo passadas como `undefined` ou valores não-array para componentes que executam operações de array sem validação prévia

## 🔍 Causa Raiz Identificada

### Problema Principal
Vários componentes recebem props que deveriam ser arrays (como `competencies`, `employees`, `notifications`, etc.) mas não validam se o valor recebido é realmente um array antes de chamar métodos como `.filter()`, `.map()`, `.reduce()`, etc.

### Cenários de Falha
1. **Dados ainda não carregados**: Query tRPC retorna `undefined` durante loading
2. **Erro na API**: Query falha e retorna `undefined` ou `null`
3. **Dados malformados**: Backend retorna objeto ao invés de array
4. **Race conditions**: Componente renderiza antes dos dados estarem disponíveis

### Componentes Afetados (Identificados)
1. `CompetencyRadarChart.tsx` - Linha 36: `competencies.filter()`
2. `EvaluationForm.tsx` - Linha 97: `competencies.filter()`
3. `InAppNotifications.tsx` - Linha 51: `notifications.filter()`
4. `NineBoxChart.tsx` - Linha 23: `employees.filter()`
5. `NotificationBell.tsx` - Linha 125: `notifications.filter()`
6. `OrganizationalChart.tsx` - Linha 76: `employees.filter()`

## 🎯 Estratégia de Correção

### Abordagem 1: Validação de Props (RECOMENDADA)
Adicionar validação e valores padrão em TODOS os componentes que recebem arrays como props.

**Vantagens:**
- Correção definitiva e preventiva
- Melhora robustez geral do sistema
- Evita erros similares no futuro
- Mantém componentes independentes

**Implementação:**
```typescript
// ANTES (vulnerável)
export default function Component({ items }: { items: Item[] }) {
  const filtered = items.filter(item => item.active);
  // ...
}

// DEPOIS (seguro)
export default function Component({ items = [] }: { items?: Item[] }) {
  const safeItems = ensureArray(items);
  const filtered = safeFilter(safeItems, item => item.active);
  // ...
}
```

### Abordagem 2: Usar Helpers Seguros
Utilizar os helpers já existentes em `@/lib/arrayHelpers` de forma consistente.

**Helpers Disponíveis:**
- `ensureArray(array)` - Garante que o valor é um array
- `safeFilter(array, callback)` - Filter seguro
- `safeMap(array, callback)` - Map seguro
- `safeReduce(array, callback, initial)` - Reduce seguro
- `isEmpty(array)` - Verifica se array está vazio
- `isValidArray(array)` - Valida se é array válido

### Abordagem 3: Validação nos Queries tRPC
Garantir que queries sempre retornem arrays vazios ao invés de undefined.

**Implementação no Backend:**
```typescript
// No router tRPC
listItems: publicProcedure.query(async () => {
  const items = await db.getItems();
  return items || []; // Sempre retorna array
});
```

## 📝 Plano de Ação

### Fase 1: Correção Imediata (CRÍTICO)
1. ✅ Identificar todos os componentes que usam `.filter()` em props
2. ⬜ Adicionar validação de array em TODOS os componentes identificados
3. ⬜ Substituir operações diretas por helpers seguros
4. ⬜ Adicionar valores padrão vazios nas props de array

### Fase 2: Prevenção (IMPORTANTE)
5. ⬜ Revisar TODOS os queries tRPC para garantir retorno de array
6. ⬜ Adicionar validação em componentes que usam `.map()`, `.reduce()`, etc.
7. ⬜ Criar componente wrapper `SafeArrayComponent` para casos complexos
8. ⬜ Adicionar testes unitários para validação de props

### Fase 3: Monitoramento (RECOMENDADO)
9. ⬜ Adicionar error boundary específico para erros de array
10. ⬜ Implementar logging de erros para identificar novos casos
11. ⬜ Documentar padrão de validação de arrays no código

## 🛠️ Correções Específicas

### 1. CompetencyRadarChart.tsx
**Problema:** Linhas 33-36 usam `competencies` sem validação
```typescript
// CORREÇÃO
export default function CompetencyRadarChart({
  competencies = [], // Valor padrão
  title = "Mapa de Competências",
  description = "Comparação entre nível atual e nível esperado",
}: CompetencyRadarChartProps) {
  const safeCompetencies = ensureArray(competencies);
  
  // Validação early return
  if (isEmpty(safeCompetencies)) {
    return <EmptyState message="Nenhuma competência disponível" />;
  }
  
  // Usar helpers seguros
  const avgCurrent = safeReduce(safeCompetencies, (sum, c) => sum + c.currentLevel, 0) / safeCompetencies.length;
  const competenciesWithGap = safeFilter(safeCompetencies, (c) => c.currentLevel < c.requiredLevel).length;
  // ...
}
```

### 2. EvaluationForm.tsx
**Problema:** Linha 97 usa `competencies.filter()` sem validação
```typescript
// CORREÇÃO
const handleSubmit = async () => {
  const safeCompetencies = ensureArray(competencies);
  const missingRatings = safeFilter(safeCompetencies, (c) => !ratings[c.id]);
  // ...
}
```

### 3. InAppNotifications.tsx
**Problema:** Linha 51 usa `notifications.filter()` sem validação
```typescript
// CORREÇÃO
const safeNotifications = ensureArray(notifications);
const unreadCount = safeFilter(safeNotifications, (n: InAppNotification) => !n.read).length;
```

### 4. NineBoxChart.tsx
**Problema:** Linha 23 usa `employees.filter()` sem validação
```typescript
// CORREÇÃO
export default function NineBoxChart({ employees = [], onEmployeeClick }: NineBoxChartProps) {
  const safeEmployees = ensureArray(employees);
  
  const getBoxEmployees = (perfMin: number, perfMax: number, potMin: number, potMax: number) => {
    return safeFilter(safeEmployees, (emp) =>
      emp.performance >= perfMin &&
      emp.performance < perfMax &&
      emp.potential >= potMin &&
      emp.potential < potMax
    );
  };
  // ...
}
```

### 5. NotificationBell.tsx
**Problema:** Linha 125 usa `notifications.filter()` sem validação
```typescript
// CORREÇÃO
useEffect(() => {
  const safeNotifications = ensureArray(notifications);
  const count = safeFilter(safeNotifications, (n) => !n.read).length;
  setUnreadCount(count);
}, [notifications]);
```

### 6. OrganizationalChart.tsx
**Problema:** Linha 76 usa `employees.filter()` sem validação
```typescript
// CORREÇÃO
const hierarchyTree = useMemo(() => {
  const safeEmployees = ensureArray(employees);
  let filteredEmployees = safeEmployees;

  if (selectedDepartment !== "all") {
    filteredEmployees = safeFilter(safeEmployees, (emp) => 
      emp.departmentId?.toString() === selectedDepartment
    );
  }
  // ...
}, [employees, selectedDepartment, searchTerm]);
```

## 🔄 Componentes Adicionais a Revisar

Além dos 6 componentes críticos identificados, revisar:
1. `PIRAlertSystem.tsx` - Múltiplos usos de `.filter()`
2. `SuccessionPipeline.tsx` - Usa `.filter()` em `plan.successors`
3. `TestesResultados.tsx` - Usa `.filter()` em resultados
4. `OrgChartInteractive.tsx` - Usa `.filter()` em managers
5. `PsychometricDashboard.tsx` - Usa `.filter()` em profiles
6. `QuestionBuilder.tsx` - Usa `.filter()` em questions

## 📊 Impacto Estimado

- **Componentes Críticos:** 6 componentes
- **Componentes Adicionais:** ~10 componentes
- **Total de Arquivos:** ~16 arquivos
- **Linhas de Código:** ~50-80 linhas a modificar
- **Tempo Estimado:** 2-3 horas
- **Risco de Regressão:** BAIXO (apenas adicionando validações)

## ✅ Critérios de Sucesso

1. ✅ Nenhum erro `TypeError: X.filter is not a function` no console
2. ✅ Todos os componentes renderizam corretamente mesmo com dados undefined
3. ✅ Estados de loading mostram UI apropriada
4. ✅ Testes manuais em todas as telas afetadas
5. ✅ Navegação entre telas sem erros

## 📚 Lições Aprendidas

1. **Sempre validar props de array** antes de usar métodos de array
2. **Usar valores padrão** em destructuring de props
3. **Preferir helpers seguros** ao invés de operações diretas
4. **Implementar early returns** para casos de dados vazios
5. **Adicionar error boundaries** para capturar erros não previstos
