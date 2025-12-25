# Padrões de Robustez - Sistema AVD UISA

## 📋 Visão Geral

Este documento estabelece os padrões obrigatórios de robustez para o desenvolvimento no Sistema AVD UISA, com foco especial na prevenção de erros relacionados a manipulação de arrays e dados potencialmente undefined/null.

## 🎯 Objetivo

Prevenir erros do tipo `TypeError: X is not a function` ou `Cannot read property 'map' of undefined` através do uso consistente de funções utilitárias seguras.

## 📚 Biblioteca de Funções Seguras

Todas as funções seguras estão disponíveis em `client/src/lib/arrayHelpers.ts`.

### Funções Principais

#### `safeMap<T, R>(array, callback): R[]`
Executa map de forma segura, retornando array vazio se o input for inválido.

```typescript
// ❌ ERRADO - pode causar erro
const names = data?.users.map(u => u.name);

// ✅ CORRETO - sempre retorna array
const names = safeMap(data?.users, u => u.name);
```

#### `safeFilter<T>(array, callback): T[]`
Executa filter de forma segura, retornando array vazio se o input for inválido.

```typescript
// ❌ ERRADO - pode causar erro
const activeUsers = users.filter(u => u.active);

// ✅ CORRETO - sempre retorna array
const activeUsers = safeFilter(users, u => u.active);
```

#### `safeReduce<T, R>(array, callback, initialValue): R`
Executa reduce de forma segura, retornando o valor inicial se o input for inválido.

```typescript
// ❌ ERRADO - pode causar erro
const total = items.reduce((sum, item) => sum + item.value, 0);

// ✅ CORRETO - sempre retorna número
const total = safeReduce(items, (sum, item) => sum + item.value, 0);
```

#### `safeFlatMap<T, R>(array, callback): R[]`
Executa flatMap de forma segura, retornando array vazio se o input for inválido.

```typescript
// ❌ ERRADO - pode causar erro
const allTags = posts.flatMap(p => p.tags);

// ✅ CORRETO - sempre retorna array
const allTags = safeFlatMap(posts, p => p.tags);
```

### Funções Auxiliares

- `isEmpty(array)` - Verifica se array está vazio ou inválido
- `ensureArray(value)` - Garante que valor é array válido
- `safeLength(array)` - Retorna comprimento seguro (0 se inválido)
- `safeFirst(array)` - Retorna primeiro elemento ou undefined
- `safeLast(array)` - Retorna último elemento ou undefined
- `safeSort(array, compareFn)` - Ordena sem mutar o original
- `safeUnique(array)` - Remove duplicatas
- `safeGroupBy(array, keyFn)` - Agrupa elementos por chave

## 🚨 Regras Obrigatórias

### 1. NUNCA usar métodos de array diretamente em dados potencialmente undefined

```typescript
// ❌ PROIBIDO
data?.items.map(...)
items.filter(...)
results.reduce(...)

// ✅ OBRIGATÓRIO
safeMap(data?.items, ...)
safeFilter(items, ...)
safeReduce(results, ...)
```

### 2. SEMPRE importar funções seguras no início do arquivo

```typescript
import { safeMap, safeFilter, isEmpty, ensureArray } from '@/lib/arrayHelpers';
```

### 3. Usar `isEmpty()` para verificações condicionais

```typescript
// ❌ EVITAR
if (items && items.length > 0) { ... }

// ✅ PREFERIR
if (!isEmpty(items)) { ... }
```

### 4. Usar `ensureArray()` ao receber dados externos

```typescript
// ✅ BOM - garante que sempre é array
const items = ensureArray(apiResponse?.data);
```

## 🔍 Detecção Automática

### ESLint Rule: `no-unsafe-array-methods`

Uma regra ESLint customizada foi criada para detectar automaticamente uso inseguro de métodos de array.

**Configuração:** `.eslintrc.json`

```json
{
  "rules": {
    "no-unsafe-array-methods": "warn"
  }
}
```

**Executar verificação:**

```bash
pnpm lint
```

### Exemplos de Detecção

A regra detecta:
- Uso de optional chaining seguido de método de array: `data?.items.map(...)`
- Variáveis com nomes suspeitos: `data`, `items`, `results`, `list`, `array`, `rows`
- Métodos: `.map()`, `.filter()`, `.reduce()`, `.flatMap()`, `.sort()`, `.find()`, `.forEach()`, `.some()`, `.every()`

## ✅ Testes Automatizados

Suite completa de testes em `client/src/lib/arrayHelpers.test.ts`:
- **88 testes** cobrindo todas as funções
- **100% de cobertura** das funções utilitárias
- Testes de casos edge: undefined, null, arrays vazios

**Executar testes:**

```bash
pnpm test client/src/lib/arrayHelpers.test.ts
```

## 📊 Status de Migração

### ✅ Módulos Migrados

- ✅ Dashboard (20 arquivos)
- ✅ Avaliações (9 arquivos)
- ✅ Relatórios (8 arquivos)
- ✅ PIR Integridade (4 arquivos)
- ✅ Componentes principais

### 📈 Cobertura Atual

- **440 arquivos TypeScript/React** no projeto
- **~80% dos arquivos** já importam arrayHelpers
- **100% dos módulos críticos** migrados

## 🎓 Guia para Novos Desenvolvedores

### Checklist ao Criar Novo Componente

1. [ ] Importar funções seguras no início do arquivo
2. [ ] Usar `safeMap` em vez de `.map()`
3. [ ] Usar `safeFilter` em vez de `.filter()`
4. [ ] Usar `isEmpty` para verificações condicionais
5. [ ] Testar com dados undefined/null
6. [ ] Executar `pnpm lint` antes de commit

### Exemplo de Componente Robusto

```typescript
import { safeMap, safeFilter, isEmpty } from '@/lib/arrayHelpers';
import { trpc } from '@/lib/trpc';

export default function UserList() {
  const { data, isLoading } = trpc.users.list.useQuery();
  
  // ✅ Uso correto de funções seguras
  const activeUsers = safeFilter(data?.users, u => u.active);
  const userNames = safeMap(activeUsers, u => u.name);
  
  if (isLoading) return <Loader />;
  
  // ✅ Verificação segura de array vazio
  if (isEmpty(activeUsers)) {
    return <EmptyState message="Nenhum usuário ativo" />;
  }
  
  return (
    <ul>
      {safeMap(activeUsers, user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

## 🔧 Troubleshooting

### Erro: "X is not a function"

**Causa:** Tentativa de usar método de array em valor undefined/null

**Solução:** Substituir por função segura correspondente

```typescript
// Antes (com erro)
items.map(...)

// Depois (sem erro)
safeMap(items, ...)
```

### Erro: "Cannot read property 'map' of undefined"

**Causa:** Optional chaining seguido de método de array

**Solução:** Passar o valor completo para função segura

```typescript
// Antes (com erro)
data?.items.map(...)

// Depois (sem erro)
safeMap(data?.items, ...)
```

## 📞 Suporte

Para dúvidas ou sugestões sobre os padrões de robustez:
- Consultar este documento
- Revisar exemplos em `client/src/lib/arrayHelpers.test.ts`
- Verificar implementações existentes nos módulos migrados

## 📝 Changelog

### 2025-12-17 - Implementação Inicial
- ✅ Criada biblioteca completa de funções seguras (20+ funções)
- ✅ Implementados 88 testes automatizados
- ✅ Criada regra ESLint customizada
- ✅ Migrados módulos críticos (Dashboard, Avaliações, Relatórios)
- ✅ Documentação completa estabelecida
