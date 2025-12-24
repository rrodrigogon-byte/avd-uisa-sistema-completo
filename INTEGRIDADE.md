# Sistema de Integridade - AVD UISA

## Visão Geral

O Sistema AVD UISA implementa um conjunto robusto de mecanismos de integridade de dados para garantir a confiabilidade, segurança e rastreabilidade de todas as operações. Este documento descreve os componentes implementados e como utilizá-los.

## Componentes Implementados

### 1. Validações de Dados

#### Validações de Formato

O sistema implementa validações para garantir que os dados estejam em formatos corretos:

- **Email**: Valida formato de endereço de email
- **CPF**: Valida CPF brasileiro com dígitos verificadores
- **Telefone**: Valida telefones brasileiros (10 ou 11 dígitos)
- **Datas**: Valida datas passadas e ranges de datas

```typescript
import { validateEmail, validateCPF, validatePhone } from './server/integrity';

// Validar email
if (!validateEmail("usuario@empresa.com")) {
  throw new Error("Email inválido");
}

// Validar CPF
if (!validateCPF("123.456.789-09")) {
  throw new Error("CPF inválido");
}
```

#### Validações de Negócio

Validações específicas para entidades do sistema:

- **Colaborador**: Nome, email, CPF, telefone, datas de nascimento e contratação, idade mínima
- **Ciclo de Avaliação**: Nome, datas de início e fim, duração mínima

```typescript
import { validateEmployeeData, assertValid } from './server/integrity';

const validation = validateEmployeeData({
  name: "João Silva",
  email: "joao@empresa.com",
  cpf: "123.456.789-09",
  birthDate: new Date("1990-01-01"),
  hireDate: new Date("2020-01-01"),
});

// Lançar erro se inválido
assertValid(validation);
```

### 2. Integridade Referencial

Funções para verificar existência de recursos antes de operações:

```typescript
import { 
  employeeExists, 
  evaluationCycleExists,
  assertExists 
} from './server/integrity';

// Verificar se colaborador existe antes de criar avaliação
await assertExists(
  "Colaborador",
  () => employeeExists(employeeId)
);
```

Funções disponíveis:
- `employeeExists(id)` - Verifica se colaborador existe
- `evaluationCycleExists(id)` - Verifica se ciclo existe
- `evaluationExistsForEmployeeInCycle(employeeId, cycleId)` - Verifica duplicatas
- `avdProcessExistsForEmployee(employeeId)` - Verifica processo AVD

### 3. Sistema de Transações

Garante atomicidade em operações complexas com rollback automático:

```typescript
import { withTransaction } from './server/integrity';

const result = await withTransaction(async (db) => {
  // Operações que devem ser atômicas
  await db.insert(table1).values(data1);
  await db.insert(table2).values(data2);
  
  return { success: true };
});

if (!result.success) {
  console.error("Erro na transação:", result.error);
  // Rollback foi feito automaticamente
}
```

### 4. Sistema de Auditoria

Registra automaticamente todas as operações críticas:

```typescript
import { logCreate, logUpdate, logDelete, logError } from './server/integrity';

const auditContext = {
  userId: ctx.user.id,
  userName: ctx.user.name,
  userEmail: ctx.user.email,
  action: "create_employee",
  resource: "employee",
  resourceId: employeeId,
  ipAddress: ctx.req.ip,
  userAgent: ctx.req.headers['user-agent'],
};

// Registrar criação
await logCreate(auditContext, newEmployee);

// Registrar atualização
await logUpdate(auditContext, oldEmployee, newEmployee);

// Registrar exclusão
await logDelete(auditContext, oldEmployee);

// Registrar erro
await logError(auditContext, error.message);
```

### 5. Middlewares de Segurança

#### Middleware de Auditoria Automática

Registra automaticamente todas as mutations:

```typescript
import { auditMiddleware } from './server/auditMiddleware';

// Aplicar em procedures
const auditedProcedure = protectedProcedure.use(auditMiddleware);
```

#### Middleware de Rate Limiting

Previne abuso limitando requisições por usuário:

```typescript
import { rateLimitMiddleware } from './server/auditMiddleware';

// Limitar a 100 requisições por minuto
const limitedProcedure = protectedProcedure
  .use(rateLimitMiddleware(100, 60000));
```

#### Middleware de Permissões

Valida permissões por perfil:

```typescript
import { requireRole, requirePermission } from './server/auditMiddleware';

// Apenas admin e RH
const adminProcedure = protectedProcedure
  .use(requireRole('admin', 'rh'));

// Permissão específica
const createEmployeeProcedure = protectedProcedure
  .use(requirePermission('create_employees'));
```

## Mapa de Permissões por Perfil

| Perfil | Permissões |
|--------|-----------|
| **admin** | Todas as permissões |
| **rh** | view_employees, create_employees, update_employees, view_evaluations, create_evaluations, view_reports |
| **gestor** | view_employees, view_evaluations, create_evaluations, update_evaluations, view_reports |
| **colaborador** | view_own_evaluation, update_own_evaluation |

## Exemplo de Uso Completo

```typescript
import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';
import {
  validateEmployeeData,
  assertValid,
  employeeExists,
  assertNotExists,
  withTransaction,
  logCreate,
  logError,
  type AuditContext,
} from './integrity';
import { requirePermission } from './auditMiddleware';

export const employeesRouter = router({
  create: protectedProcedure
    .use(requirePermission('create_employees'))
    .input(z.object({
      name: z.string(),
      email: z.string().email(),
      cpf: z.string(),
      // ... outros campos
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // 1. Validar dados
        const validation = validateEmployeeData(input);
        assertValid(validation);
        
        // 2. Verificar duplicatas
        await assertNotExists(
          "Colaborador com este CPF",
          () => employeeExistsByCPF(input.cpf)
        );
        
        // 3. Executar em transação
        const result = await withTransaction(async (db) => {
          const [employee] = await db.insert(employees).values(input);
          return employee;
        });
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
        // 4. Registrar auditoria
        const auditContext: AuditContext = {
          userId: ctx.user.id,
          userName: ctx.user.name,
          userEmail: ctx.user.email,
          action: "create_employee",
          resource: "employee",
          resourceId: result.data.id,
        };
        
        await logCreate(auditContext, result.data);
        
        return result.data;
        
      } catch (error) {
        // Registrar erro
        const auditContext: AuditContext = {
          userId: ctx.user.id,
          userName: ctx.user.name,
          userEmail: ctx.user.email,
          action: "create_employee",
          resource: "employee",
        };
        
        await logError(auditContext, error.message);
        throw error;
      }
    }),
});
```

## Testes

O sistema inclui uma suite completa de testes automatizados:

```bash
# Executar testes de integridade
pnpm test server/integrity.test.ts
```

**Resultado**: 29/29 testes passando ✅

### Cobertura de Testes

- ✅ Validações de formato (email, CPF, telefone, datas)
- ✅ Validações de dados de negócio (colaborador, ciclo)
- ✅ Verificações de integridade referencial
- ✅ Helpers de assertion
- ✅ Sistema de transações
- ✅ Sistema de auditoria
- ✅ Integridade do banco de dados

## Boas Práticas

1. **Sempre valide dados antes de inserir no banco**
   ```typescript
   const validation = validateEmployeeData(input);
   assertValid(validation);
   ```

2. **Use transações para operações complexas**
   ```typescript
   await withTransaction(async (db) => {
     // Múltiplas operações atômicas
   });
   ```

3. **Registre auditoria em operações críticas**
   ```typescript
   await logCreate(auditContext, newData);
   ```

4. **Verifique integridade referencial**
   ```typescript
   await assertExists("Recurso", () => resourceExists(id));
   ```

5. **Use middlewares para segurança**
   ```typescript
   const securedProcedure = protectedProcedure
     .use(requireRole('admin'))
     .use(rateLimitMiddleware(100, 60000));
   ```

## Monitoramento

### Logs de Auditoria

Todos os logs são armazenados na tabela `auditLogs`:

```sql
SELECT * FROM auditLogs 
WHERE userId = ? 
ORDER BY createdAt DESC 
LIMIT 100;
```

### Análise de Segurança

```sql
-- Operações falhadas por usuário
SELECT userId, userName, COUNT(*) as failures
FROM auditLogs
WHERE JSON_EXTRACT(changes, '$.success') = false
GROUP BY userId, userName
ORDER BY failures DESC;

-- Atividade por recurso
SELECT entity, action, COUNT(*) as count
FROM auditLogs
GROUP BY entity, action
ORDER BY count DESC;
```

## Conclusão

O sistema de integridade do AVD UISA fornece uma base sólida para garantir a qualidade, segurança e rastreabilidade dos dados. Todos os componentes foram testados e validados, proporcionando confiança na operação do sistema.
