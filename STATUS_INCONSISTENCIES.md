# Inconsistências de Status - Sistema AVD UISA

## Problema Identificado

Existem inconsistências entre os valores de enum definidos no schema do banco de dados e os valores usados no código TypeScript.

## Tabelas Afetadas

### 1. evaluationCycles
- **Schema:** `["planejado", "ativo", "concluido", "cancelado"]`
- **Uso incorreto no código:**
  - `cyclesRouter.ts`: usa `"cancelado"` e `"concluido"` ✅ CORRETO

### 2. avdAssessmentProcesses  
- **Schema:** `["em_andamento", "concluido", "cancelado"]`
- **Uso incorreto no código:**
  - `avdRouter.ts`: usa `"em_andamento"` ✅ CORRETO
  - `avdRouter.admin.test.ts`: usa `"em_andamento"` e `"concluido"` ✅ CORRETO

### 3. performanceEvaluations
- **Schema:** `["pendente", "em_andamento", "concluida", "cancelada"]`
- **Uso incorreto no código:**
  - `cyclesRouter.ts`: usa `"pendente"` ✅ CORRETO
  - `evaluation360Router.ts`: usa `"em_andamento"` ✅ CORRETO
  - `evaluation-tests-validation.test.ts`: usa `"em_andamento"` ✅ CORRETO

### 4. pdiPlans
- **Schema:** `["rascunho", "pendente_aprovacao", "aprovado", "em_andamento", "concluido", "cancelado"]`
- **Uso incorreto no código:**
  - `pdi-orgchart.test.ts`: usa `"em_andamento"` ✅ CORRETO
  - `pdiIntelligentRouter.ts`: usa `"em_andamento"`, `"concluido"`, `"cancelado"` ✅ CORRETO

### 5. pdiActions
- **Schema:** `["nao_iniciado", "em_andamento", "concluido"]`
- **Uso incorreto no código:**
  - `pdiIntelligentRouter.ts`: usa `"nao_iniciado"`, `"em_andamento"`, `"concluido"` ✅ CORRETO
  - `pdiHtmlImportRouter.ts`: usa `"nao_iniciado"` ✅ CORRETO

### 6. pirAssessments
- **Schema:** `["pendente", "em_andamento", "concluida", "cancelada"]`
- **Uso incorreto no código:**
  - `avdUisaRouter.ts`: usa `"em_andamento"` ✅ CORRETO

### 7. testInvitations
- **Schema:** `["pendente", "em_andamento", "concluido", "expirado"]`
- **Uso incorreto no código:**
  - `migrate-psychometric-tests.ts`: usa `"concluido"` ✅ CORRETO
  - `evaluation-tests-validation.test.ts`: usa `"concluido"` ✅ CORRETO

### 8. calibrationSessions
- **Schema:** `["planejado", "aberto", "em_andamento", "em_avaliacao", "concluido", "cancelado"]`
- **Uso incorreto no código:**
  - `calibrationMeetingRouter.ts`: usa `"em_andamento"` ✅ CORRETO

### 9. notifications
- **Schema:** `["pendente", "enviando", "enviado", "falhou", "cancelado"]`
- **Uso incorreto no código:**
  - `notificationWorker.ts`: usa `"pendente"` ✅ CORRETO

### 10. developmentActions (db.ts)
- **Uso no código:**
  - `db.ts`: usa `"pendente"` ✅ CORRETO

## Análise

Após análise detalhada, **NÃO foram encontradas inconsistências reais** entre o schema e o código. Todos os valores de status usados no código correspondem aos valores definidos nos enums do schema.

## Causa do Erro TypeScript

O erro TypeScript reportado:
```
Type '"pendente" | "cancelado" | "concluido" | "em_andamento"' is not assignable to type 'SQL<unknown> | "pendente" | "em_andamento" | "concluida" | "cancelada" | Placeholder<string, any>'.
```

Indica que há algum lugar no código onde está sendo usado um tipo incorreto que espera `"concluida"` e `"cancelada"` (feminino) mas está recebendo `"concluido"` e `"cancelado"` (masculino).

Preciso investigar mais profundamente onde esse tipo está sendo definido.
