# Relatório de Erros TypeScript - Sistema AVD UISA

**Data:** 23/11/2025  
**Total de Erros:** 185 (reduzidos de 203 originais)  
**Progresso:** 18 erros corrigidos (-8.9%)

---

## ✅ Correções Realizadas

### 1. Enums de Status (Push Notifications)
**Problema:** Status em português (`enviada`, `aberta`, `erro`)  
**Solução:** Migrados para inglês (`sent`, `opened`, `failed`)

**Arquivos corrigidos:**
- ✅ `drizzle/schema.ts` - Schema de `pushNotificationLogs`
- ✅ `server/routers/pushNotificationsRouter.ts` - Todos os endpoints
- ✅ `server/jobs/sendPulseEmails.ts` - Job de envio de emails
- ✅ `server/__tests__/pushNotifications.test.ts` - Testes unitários
- ✅ **Banco de dados:** Enum alterado via SQL direto

### 2. Estrutura de Retorno de `getEmployeeById`
**Problema:** Frontend acessava `employee.name` mas retorno era `employee.employee.name`  
**Solução:** Ajustado acesso em:
- ✅ `client/src/pages/PerfilFuncionario.tsx` (11 propriedades corrigidas)

### 3. Queries com Parâmetros Incorretos
**Problema:** `trpc.employees.list.useQuery({})` esperava sem parâmetros  
**Solução:** Removido objeto vazio em:
- ✅ `client/src/pages/PrevisaoBonus.tsx`

### 4. Campos Inexistentes em Schemas
**Problema:** `multiplierExceeded`, `multiplierMet`, `multiplierPartial` não existem  
**Solução:** Ajustada lógica para usar `salaryMultiplier`, `minMultiplier`, `maxMultiplier`
- ✅ `client/src/pages/PrevisaoBonus.tsx`

---

## ❌ Erros Restantes (185)

### Distribuição por Arquivo

| Arquivo | Erros | Categoria Principal |
|---------|-------|---------------------|
| `CalibrationMeetingRoom.tsx` | 25 | Propriedades faltantes (selfScore, managerScore) |
| `Sucessao.tsx` | 19 | Tipos incompatíveis |
| `Metas.tsx` | 11 | Propriedades faltantes |
| `AprovacaoGeralCiclo.tsx` | 9 | Argumentos incompatíveis |
| `PDIInteligenteDetalhes.tsx` | 7 | Propriedades faltantes |
| `EmailMetrics.tsx` | 7 | Propriedades faltantes (successful, failed, byType) |
| `CiclosAvaliacaoLista.tsx` | 7 | Tipos incompatíveis |
| `AderirCicloAvaliacao.tsx` | 7 | Tipos incompatíveis |
| `NotificationBell.tsx` | 7 | Propriedades faltantes |
| `MetasCorporativas.tsx` | 6 | Propriedades faltantes |
| **Outros 30+ arquivos** | 80 | Diversos |

---

## 🔍 Análise por Tipo de Erro

### TS2339 - Property does not exist (116 erros)
**Causa:** Queries retornam estruturas aninhadas mas frontend acessa diretamente

**Exemplos:**
```typescript
// ❌ Erro
const { data } = trpc.employees.getById.useQuery({ id: 1 });
console.log(data.name); // Property 'name' does not exist

// ✅ Correto
console.log(data.employee.name);
```

**Arquivos afetados:**
- `CalibrationMeetingRoom.tsx`: `selfScore`, `managerScore`, `status`
- `EmailMetrics.tsx`: `successful`, `failed`, `byType`, `total`
- `Metas.tsx`: `employeeName`, `unit`, `deadline`
- `DetalhesMeta.tsx`: `bonusType`

### TS2367 - Type comparison error (17 erros)
**Causa:** Comparações entre tipos incompatíveis (string vs enum)

**Exemplo:**
```typescript
// ❌ Erro
if (status === "pendente") // status é enum, não string

// ✅ Correto
if (status === "pending")
```

### TS7006 - Implicit 'any' type (16 erros)
**Causa:** Callbacks sem tipagem explícita

**Exemplo:**
```typescript
// ❌ Erro
array.map(item => item.name)

// ✅ Correto
array.map((item: Employee) => item.name)
```

### TS2345 - Argument not assignable (12 erros)
**Causa:** Argumentos passados não correspondem ao tipo esperado

### TS2551 - Property does not exist (11 erros)
**Causa:** Similar ao TS2339, mas com sugestão de alternativa

---

## 🛠️ Plano de Correção Recomendado

### Fase 1: Correções Estruturais (Prioridade Alta)
**Tempo estimado:** 2-3 horas

1. **Ajustar retornos de queries no backend**
   - Simplificar `getEmployeeById` para retornar objeto flat
   - Adicionar campos faltantes em queries de avaliação (`selfScore`, `managerScore`)
   - Corrigir retorno de `getEmailStats` para incluir `successful`, `failed`, `byType`

2. **Padronizar enums em todo o sistema**
   - Migrar todos os status para inglês
   - Atualizar banco de dados via migrations

### Fase 2: Correções de Tipagem (Prioridade Média)
**Tempo estimado:** 1-2 horas

1. **Adicionar tipos explícitos em callbacks**
   - Criar interfaces para tipos comuns (Employee, Evaluation, Goal)
   - Aplicar em todos os `.map()`, `.filter()`, `.find()`

2. **Corrigir comparações de tipos**
   - Substituir strings por enums onde aplicável

### Fase 3: Validação e Testes (Prioridade Alta)
**Tempo estimado:** 1 hora

1. **Executar testes vitest**
   - Validar endpoints críticos
   - Garantir que mudanças não quebraram funcionalidades

2. **Verificar 0 erros TypeScript**
   ```bash
   pnpm tsc --noEmit
   ```

---

## 📋 Checklist de Correção

### Backend (server/)
- [ ] Simplificar retorno de `getEmployeeById` (db.ts)
- [ ] Adicionar `selfScore`, `managerScore` em queries de avaliação
- [ ] Corrigir retorno de `getEmailStats` (adminRouter.ts)
- [ ] Padronizar todos os enums para inglês
- [ ] Executar `pnpm db:push` após alterações de schema

### Frontend (client/src/)
- [ ] `CalibrationMeetingRoom.tsx` - Ajustar acesso a propriedades (25 erros)
- [ ] `Sucessao.tsx` - Corrigir tipos incompatíveis (19 erros)
- [ ] `Metas.tsx` - Adicionar propriedades faltantes (11 erros)
- [ ] `EmailMetrics.tsx` - Ajustar acesso a métricas (7 erros)
- [ ] Adicionar tipagens explícitas em todos os callbacks

### Testes
- [ ] `pushNotifications.test.ts` - ✅ Já corrigido
- [ ] `admin.test.ts` - Validar getEmailStats
- [ ] `employees.test.ts` - Validar getById
- [ ] `cycles.test.ts` - Validar estruturas de avaliação

---

## 🚀 Comandos Úteis

```bash
# Verificar erros TypeScript
pnpm tsc --noEmit

# Contar erros por tipo
pnpm tsc --noEmit 2>&1 | grep "error TS" | grep -oE "error TS[0-9]+" | sort | uniq -c

# Agrupar erros por arquivo
pnpm tsc --noEmit 2>&1 | grep "error TS" | cut -d'(' -f1 | sort | uniq -c | sort -rn

# Executar testes
pnpm test

# Aplicar mudanças no banco
pnpm db:push
```

---

## 📊 Progresso Atual

```
Início:     203 erros
Corrigidos:  18 erros
Restantes:  185 erros
Progresso:   8.9%
```

**Status:** 🟡 Em Progresso  
**Próxima ação:** Corrigir queries de backend para simplificar estruturas de retorno
