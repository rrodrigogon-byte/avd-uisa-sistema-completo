# Guia de Segurança para Operações de Array

## 📋 Visão Geral

Este guia documenta as correções preventivas aplicadas no projeto para evitar erros com operações de array quando dados são `undefined` ou `null`.

## 🛠️ Helper Functions Disponíveis

Todas as funções estão disponíveis em `client/src/lib/arrayHelpers.ts`:

### `safeMap<T, R>(array, callback): R[]`
Executa map de forma segura, retornando array vazio se o input for inválido.

```typescript
// ❌ Antes (pode causar erro)
const names = users?.map(u => u.name) || [];

// ✅ Depois (sempre seguro)
const names = safeMap(users, u => u.name);
```

### `safeFilter<T>(array, callback): T[]`
Executa filter de forma segura, retornando array vazio se o input for inválido.

```typescript
// ❌ Antes
const activeUsers = users?.filter(u => u.active) || [];

// ✅ Depois
const activeUsers = safeFilter(users, u => u.active);
```

### `safeFind<T>(array, callback): T | undefined`
Executa find de forma segura, retornando undefined se o input for inválido.

```typescript
// ❌ Antes
const admin = users?.find(u => u.role === 'admin');

// ✅ Depois
const admin = safeFind(users, u => u.role === 'admin');
```

### `safeReduce<T, R>(array, callback, initialValue): R`
Executa reduce de forma segura, retornando o valor inicial se o input for inválido.

```typescript
// ❌ Antes
const total = items?.reduce((sum, item) => sum + item.value, 0) || 0;

// ✅ Depois
const total = safeReduce(items, (sum, item) => sum + item.value, 0);
```

### `safeLength(array): number`
Retorna o comprimento do array de forma segura.

```typescript
// ❌ Antes
const count = items?.length || 0;

// ✅ Depois
const count = safeLength(items);
```

### `ensureArray<T>(array): T[]`
Garante que o valor é um array, retornando array vazio se for inválido.

```typescript
// ❌ Antes
const list = items || [];

// ✅ Depois
const list = ensureArray(items);
```

### `isEmpty(array): boolean`
Verifica se o array está vazio ou inválido.

```typescript
// ❌ Antes
if (!items || items.length === 0) { ... }

// ✅ Depois
if (isEmpty(items)) { ... }
```

## 🎯 Casos de Uso Comuns

### 1. Renderização de Listas

```typescript
// ❌ Antes
{items?.map(item => <ItemCard key={item.id} {...item} />)}

// ✅ Depois
{safeMap(items, item => <ItemCard key={item.id} {...item} />)}
```

### 2. Cálculos com Arrays

```typescript
// ❌ Antes
const average = scores?.reduce((a, b) => a + b, 0) / (scores?.length || 1);

// ✅ Depois
const average = safeReduce(scores, (a, b) => a + b, 0) / safeLength(scores);
```

### 3. Preparação de Dados para Gráficos

```typescript
// ❌ Antes
const chartData = data?.map(item => ({
  label: item.name,
  value: item.count
})) || [];

// ✅ Depois
const chartData = safeMap(data, item => ({
  label: item.name,
  value: item.count
}));
```

### 4. Verificação de Existência

```typescript
// ❌ Antes
const hasActiveUsers = users?.some(u => u.active) || false;

// ✅ Depois
const hasActiveUsers = safeSome(users, u => u.active);
```

## 📊 Componentes de Loading

Use os componentes de skeleton para melhorar a experiência durante carregamento:

### ListSkeleton

```typescript
import { ListSkeleton } from "@/components/ui/list-skeleton";

{isLoading ? (
  <ListSkeleton count={5} variant="card" />
) : (
  safeMap(items, item => <ItemCard key={item.id} {...item} />)
)}
```

### TableSkeleton

```typescript
import { TableSkeleton } from "@/components/ui/list-skeleton";

{isLoading ? (
  <TableSkeleton rows={10} columns={5} />
) : (
  <Table>...</Table>
)}
```

### EmptyState

```typescript
import { EmptyState } from "@/components/ui/list-skeleton";
import { Users } from "lucide-react";

{isEmpty(items) && !isLoading && (
  <EmptyState
    icon={Users}
    title="Nenhum item encontrado"
    description="Não há itens para exibir no momento"
  />
)}
```

## ✅ Checklist de Implementação

Ao trabalhar com arrays em componentes:

- [ ] Importar helpers necessários de `@/lib/arrayHelpers`
- [ ] Substituir `.map()` por `safeMap()`
- [ ] Substituir `.filter()` por `safeFilter()`
- [ ] Substituir `.find()` por `safeFind()`
- [ ] Substituir `.reduce()` por `safeReduce()`
- [ ] Substituir `.length` por `safeLength()`
- [ ] Adicionar skeleton durante loading
- [ ] Adicionar EmptyState quando lista vazia
- [ ] Testar com dados undefined/null

## 🚨 Padrões a Evitar

### ❌ Optional Chaining com Map
```typescript
// Pode causar erro se retornar undefined
const result = data?.map(item => item.value);
```

### ❌ Fallback Manual
```typescript
// Verboso e propenso a erros
const result = data ? data.map(item => item.value) : [];
```

### ❌ Verificação Inline
```typescript
// Dificulta leitura
const result = (data && Array.isArray(data)) ? data.map(item => item.value) : [];
```

## 📈 Benefícios

1. **Prevenção de Erros**: Evita crashes por operações em undefined/null
2. **Código Limpo**: Menos verificações manuais e código mais legível
3. **Consistência**: Padrão único em todo o projeto
4. **Type Safety**: Mantém tipagem TypeScript
5. **Melhor UX**: Loading states e empty states apropriados

## 🔄 Migração Gradual

Os imports já foram adicionados em 49 componentes. Para migrar um componente:

1. Identifique operações de array (`map`, `filter`, `find`, etc.)
2. Substitua por funções seguras
3. Adicione skeletons para loading states
4. Adicione EmptyState para listas vazias
5. Teste o componente

## 📝 Exemplos Completos

### Antes
```typescript
function UserList() {
  const { data: users, isLoading } = trpc.users.list.useQuery();
  
  return (
    <div>
      {users?.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

### Depois
```typescript
import { safeMap, isEmpty } from "@/lib/arrayHelpers";
import { ListSkeleton, EmptyState } from "@/components/ui/list-skeleton";
import { Users } from "lucide-react";

function UserList() {
  const { data: users, isLoading } = trpc.users.list.useQuery();
  
  if (isLoading) {
    return <ListSkeleton count={5} variant="card" />;
  }
  
  if (isEmpty(users)) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhum usuário encontrado"
        description="Não há usuários cadastrados no momento"
      />
    );
  }
  
  return (
    <div className="space-y-4">
      {safeMap(users, user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

## 🎓 Recursos Adicionais

- Arquivo de helpers: `client/src/lib/arrayHelpers.ts`
- Componentes de skeleton: `client/src/components/ui/list-skeleton.tsx`
- Exemplos corrigidos: `EvolucaoTemporalPIR.tsx`, `DashboardGestor.tsx`

---

**Última atualização**: 17/12/2025
**Versão**: 1.0.0
