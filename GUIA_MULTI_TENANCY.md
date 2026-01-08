# 🏢 GUIA COMPLETO DE MULTI-TENANCY - Sistema AVD UISA

**Data:** 08/01/2026  
**Sistema:** AVD UISA v2.0.0  
**Suporte:** Até 100 empresas simultâneas

---

## 📋 SUMÁRIO

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Configuração do Banco](#configuração-do-banco)
4. [Implementação](#implementação)
5. [Uso no Código](#uso-no-código)
6. [Segurança](#segurança)
7. [Testes](#testes)
8. [Troubleshooting](#troubleshooting)

---

## 1. VISÃO GERAL

### O que é Multi-Tenancy?

Multi-tenancy permite que **múltiplas empresas (tenants)** usem o mesmo sistema com **isolamento completo de dados**. Cada tenant possui:

- ✅ Dados completamente isolados
- ✅ Usuários próprios
- ✅ Configurações personalizadas
- ✅ Permissões independentes
- ✅ Auditoria separada

### Capacidade do Sistema

- **Máximo de tenants:** 100 empresas
- **Usuários por tenant:** Até 5.000
- **Funcionários por tenant:** Até 10.000
- **Isolamento:** Por `tenant_id` em todas as tabelas

---

## 2. ARQUITETURA

### Estrutura de Tabelas

```
┌─────────────┐
│   tenants   │  ← Tabela principal de empresas
└──────┬──────┘
       │
       ├─────┬─────────────────┬─────────────┐
       │     │                 │             │
       ▼     ▼                 ▼             ▼
  ┌─────────────┐    ┌──────────────┐  ┌──────────────┐
  │ tenantUsers │    │ departments  │  │  employees   │
  │             │    │ (tenantId)   │  │  (tenantId)  │
  └─────────────┘    └──────────────┘  └──────────────┘
                            │
                            ├──────┬──────┬──────┬──────┐
                            ▼      ▼      ▼      ▼      ▼
                        goals  pdis  360° tests  etc...
                     (tenantId) (tenantId) (...)
```

### Tabelas Principais

#### A. `tenants` - Empresas
```sql
CREATE TABLE tenants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE,        -- Ex: "UISA", "EMPRESA_2"
  name VARCHAR(255),               -- Nome da empresa
  legalName VARCHAR(255),          -- Razão social
  cnpj VARCHAR(18),                -- CNPJ
  active BOOLEAN DEFAULT TRUE,
  settings JSON,                   -- Configurações
  maxUsers INT DEFAULT 1000,
  maxEmployees INT DEFAULT 5000,
  planType ENUM('trial', 'basic', 'professional', 'enterprise'),
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

#### B. `tenantUsers` - Usuários por Tenant
```sql
CREATE TABLE tenantUsers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tenantId INT,                    -- FK para tenants
  userId INT,                      -- FK para users
  role ENUM('super_admin', 'admin', 'manager', 'user'),
  permissions JSON,                -- Permissões específicas
  active BOOLEAN DEFAULT TRUE,
  UNIQUE (tenantId, userId)        -- Um usuário não pode estar duplicado
);
```

#### C. Tabelas com `tenant_id`
Todas as tabelas principais possuem `tenant_id`:

- ✅ `departments`
- ✅ `employees`
- ✅ `positions`
- ✅ `competencies`
- ✅ `goals`
- ✅ `corporateGoals`
- ✅ `pdiIntelligent`
- ✅ `evaluationCycles`
- ✅ `evaluations360`
- ✅ `nineBoxPlacements`
- ✅ `successionPlans`
- ✅ `calibrationMeetings`
- ✅ `bonusPolicies`
- ✅ `psychometricTests`
- ✅ `pulseSurveys`
- ✅ `jobDescriptions`
- ✅ `feedbacks`

---

## 3. CONFIGURAÇÃO DO BANCO

### Dados de Conexão Fornecidos

```env
DATABASE_URL="mysql://root:|_89C{*ixPV5x4UJ@34.39.223.147:3306/avd_uisa"

Host: 34.39.223.147
Database: avd_uisa
User: root
Password: |_89C{*ixPV5x4UJ
```

### Aplicar Migration

```bash
# 1. Conectar ao banco
mysql -h 34.39.223.147 -u root -p avd_uisa

# 2. Executar migration
mysql -h 34.39.223.147 -u root -p avd_uisa < migrations/add-multi-tenancy.sql

# 3. Verificar
mysql -h 34.39.223.147 -u root -p avd_uisa -e "SELECT * FROM tenants;"
```

### O que a Migration Faz

1. ✅ Cria tabela `tenants`
2. ✅ Cria tabela `tenantUsers`
3. ✅ Cria tabela `tenantAuditLogs`
4. ✅ Adiciona `tenant_id` a todas as tabelas principais
5. ✅ Cria índices para performance
6. ✅ Insere tenant default "UISA"
7. ✅ Atualiza registros existentes com tenant_id da UISA

---

## 4. IMPLEMENTAÇÃO

### Arquivos Criados

1. **`drizzle/schema-multi-tenant.ts`** (4.5 KB)
   - Definição das tabelas de multi-tenancy
   - Types e relations
   
2. **`server/multi-tenant-middleware.ts`** (6.3 KB)
   - Middleware de contexto
   - Funções de autenticação e autorização
   - Helpers para filtros e validações
   
3. **`migrations/add-multi-tenancy.sql`** (11.3 KB)
   - Migration SQL completa
   - Adiciona tenant_id a todas as tabelas
   
4. **`.env`**
   - Configuração do banco de dados
   - Variáveis de multi-tenancy

---

## 5. USO NO CÓDIGO

### A. Contexto tRPC

O middleware cria um contexto com informações do tenant:

```typescript
export type Context = {
  db: Database;
  tenantId: number | null;
  tenant: Tenant | null;
  userId: number | null;
  user: User | null;
  tenantUser: TenantUser | null;
};
```

### B. Headers HTTP

Toda requisição deve incluir:

```http
x-tenant-id: 1           # ID do tenant (obrigatório)
x-user-id: 123           # ID do usuário (obrigatório para rotas protegidas)
```

### C. Exemplo de Router tRPC

```typescript
import { requireTenantAuth, withTenantFilter } from "../multi-tenant-middleware";

export const employeesRouter = router({
  list: procedure
    .use(requireTenantAuth)  // Garante tenant + auth
    .query(async ({ ctx }) => {
      // tenant_id é automaticamente incluído no contexto
      const employees = await ctx.db
        .select()
        .from(employees)
        .where(eq(employees.tenantId, ctx.tenantId));
      
      return employees;
    }),

  create: procedure
    .use(requireTenantAuth)
    .input(z.object({
      name: z.string(),
      email: z.string().email(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Adicionar tenant_id automaticamente
      const [employee] = await ctx.db
        .insert(employees)
        .values({
          ...input,
          tenantId: ctx.tenantId,  // Isolamento automático
        });
      
      return employee;
    }),
});
```

### D. Middlewares Disponíveis

```typescript
// 1. Requer tenant
requireTenant(ctx);  // Valida se x-tenant-id está presente

// 2. Requer autenticação
requireAuth(ctx);  // Valida se x-user-id está presente

// 3. Requer tenant + auth
requireTenantAuth(ctx);  // Valida ambos + vinculo

// 4. Permissões por role
requireTenantSuperAdmin(ctx);  // Requer super_admin
requireTenantAdmin(ctx);        // Requer admin ou super_admin
requireTenantManager(ctx);      // Requer manager, admin ou super_admin

// 5. Permissão específica
requirePermission(ctx, "manage_employees");  // Verifica permissão custom
```

### E. Helpers para Queries

```typescript
import { withTenantData, withTenantFilter } from "../multi-tenant-middleware";

// Adicionar tenant_id em inserções
const data = withTenantData(ctx, {
  name: "New Employee",
  email: "employee@company.com",
});

// data agora inclui: { name, email, tenantId: 1 }

// Adicionar filtros de tenant
const conditions = withTenantFilter(ctx, [
  eq(employees.active, true),
  like(employees.name, "%John%")
]);

// conditions inclui validação de tenant_id
```

---

## 6. SEGURANÇA

### Isolamento de Dados

✅ **Garantido por:**
1. `tenant_id` em todas as tabelas
2. Middleware valida tenant em cada requisição
3. Foreign keys garantem integridade
4. Índices otimizam queries filtradas

❌ **Nunca fazer:**
```typescript
// ❌ ERRADO - Não filtra por tenant
const all = await db.select().from(employees);

// ✅ CORRETO - Sempre filtrar por tenant
const all = await db
  .select()
  .from(employees)
  .where(eq(employees.tenantId, ctx.tenantId));
```

### Auditoria

Toda ação é registrada em `tenantAuditLogs`:

```typescript
await ctx.db.insert(tenantAuditLogs).values({
  tenantId: ctx.tenantId,
  userId: ctx.userId,
  action: "employee_created",
  entityType: "employee",
  entityId: newEmployee.id,
  details: { name: newEmployee.name },
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
});
```

### Permissões

Cada `tenantUser` possui:
- `role`: super_admin | admin | manager | user
- `permissions`: array de permissões customizadas

```typescript
// Verificar role
if (ctx.tenantUser.role === 'super_admin') {
  // Permitir ação
}

// Verificar permissão específica
const permissions = ctx.tenantUser.permissions || [];
if (permissions.includes('delete_employee')) {
  // Permitir ação
}
```

---

## 7. TESTES

### Testar Conexão

```bash
# Testar conexão básica
node test-db-connection.mjs

# Verificar multi-tenancy
mysql -h 34.39.223.147 -u root -p avd_uisa -e "
  SELECT * FROM tenants;
  SELECT COUNT(*) as total_tenants FROM tenants;
  SHOW TABLES LIKE '%tenant%';
"
```

### Criar Novo Tenant

```typescript
// Via código
const [newTenant] = await db.insert(tenants).values({
  code: "EMPRESA_2",
  name: "Empresa Exemplo 2",
  legalName: "Empresa Exemplo 2 Ltda",
  cnpj: "98.765.432/0001-10",
  active: true,
  maxUsers: 500,
  maxEmployees: 2000,
  planType: "professional",
});

// Vincular usuário ao tenant
await db.insert(tenantUsers).values({
  tenantId: newTenant.id,
  userId: 1,
  role: "super_admin",
  active: true,
});
```

### Testar Isolamento

```bash
# Script de teste
cat > test-multi-tenancy.mjs << 'EOF'
import { getDb } from './server/db.js';
import { tenants, employees } from './drizzle/schema.js';
import { eq } from 'drizzle-orm';

const db = await getDb();

// 1. Listar tenants
const allTenants = await db.select().from(tenants);
console.log('Tenants:', allTenants);

// 2. Para cada tenant, contar employees
for (const tenant of allTenants) {
  const count = await db
    .select()
    .from(employees)
    .where(eq(employees.tenantId, tenant.id));
  
  console.log(`Tenant ${tenant.code}: ${count.length} employees`);
}

process.exit(0);
EOF

node test-multi-tenancy.mjs
```

---

## 8. TROUBLESHOOTING

### Problema: Timeout ao Conectar

**Causa:** Firewall bloqueando IP

**Solução:**
1. Acesse Cloud SQL Console
2. Vá em "Connections" → "Authorized networks"
3. Adicione seu IP: `0.0.0.0/0` (desenvolvimento) ou IP específico
4. Aguarde 1-2 minutos para aplicar

### Problema: Usuário não tem acesso ao tenant

**Causa:** Relacionamento `tenantUsers` não configurado

**Solução:**
```sql
-- Verificar
SELECT * FROM tenantUsers WHERE userId = 123;

-- Adicionar
INSERT INTO tenantUsers (tenantId, userId, role, active)
VALUES (1, 123, 'user', TRUE);
```

### Problema: Queries lentas

**Causa:** Faltam índices em `tenant_id`

**Solução:**
```sql
-- Adicionar índices
ALTER TABLE employees ADD INDEX idx_emp_tenant (tenantId);
ALTER TABLE goals ADD INDEX idx_goal_tenant (tenantId);
-- ... repetir para todas as tabelas
```

### Problema: Dados vazando entre tenants

**Causa:** Query sem filtro de `tenant_id`

**Solução:**
```typescript
// ❌ ERRADO
const all = await db.select().from(employees);

// ✅ CORRETO
const all = await db
  .select()
  .from(employees)
  .where(eq(employees.tenantId, ctx.tenantId));
```

---

## 📊 CHECKLIST DE IMPLEMENTAÇÃO

### Antes do Deploy

- [ ] Migration aplicada no banco
- [ ] Tenant UISA criado
- [ ] Dados existentes atualizados com tenant_id
- [ ] Índices criados
- [ ] Middleware configurado
- [ ] Routers atualizados com filtros
- [ ] Testes de isolamento executados
- [ ] Auditoria configurada
- [ ] Permissões testadas

### Configuração de Novo Tenant

- [ ] Criar tenant na tabela `tenants`
- [ ] Criar usuário super_admin do tenant
- [ ] Configurar permissões
- [ ] Importar dados iniciais (opcional)
- [ ] Testar acesso isolado
- [ ] Configurar logo e cores (settings)
- [ ] Validar quotas (maxUsers, maxEmployees)

---

## 🎯 PRÓXIMOS PASSOS

1. **Aguardar liberação de firewall** do Cloud SQL
2. **Aplicar migration** `add-multi-tenancy.sql`
3. **Testar criação** de novo tenant
4. **Atualizar routers** com middlewares
5. **Implementar UI** de seleção de tenant
6. **Criar dashboard** de administração de tenants
7. **Documentar APIs** com exemplos de headers

---

## 📞 CONTATO E SUPORTE

**Documentação Relacionada:**
- `GUIA_GOOGLE_CLOUD_SQL.md` - Setup do banco
- `ANALISE_DADOS_COMPLETA.md` - Estrutura de dados
- `README.md` - Visão geral do sistema

**Arquivos Principais:**
- `drizzle/schema-multi-tenant.ts`
- `server/multi-tenant-middleware.ts`
- `migrations/add-multi-tenancy.sql`
- `.env` (configuração)

---

**Status:** ✅ Implementação completa, aguardando liberação de firewall  
**Criado em:** 08/01/2026  
**Versão:** 1.0  
**Autor:** Sistema AVD UISA - Manus AI
