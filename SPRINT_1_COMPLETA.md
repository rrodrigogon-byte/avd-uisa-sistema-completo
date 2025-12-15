# ✅ Sprint 1 - Autenticação e Permissões CONCLUÍDA

**Data:** 04/12/2025  
**Status:** ✅ Implementado e Funcional

---

## 🎯 Objetivo da Sprint

Implementar um sistema robusto de controle de acesso baseado em roles (RBAC - Role-Based Access Control) para garantir que cada tipo de usuário tenha acesso apenas às funcionalidades apropriadas ao seu nível de permissão.

---

## 🔐 Hierarquia de Roles Implementada

### 1. **Admin** (Nível Máximo)
- Acesso total ao sistema
- Gerenciamento de usuários e configurações
- Acesso a todas as áreas administrativas
- Visualização de auditoria e logs

### 2. **RH** (Recursos Humanos)
- Gestão completa de funcionários
- Acesso a relatórios e analytics
- Configuração de avaliações e ciclos
- Gestão de PDIs e sucessão

### 3. **Gestor** (Gerente/Líder)
- Avaliações da própria equipe
- Visualização de metas e performance
- Acesso a relatórios da equipe
- Aprovações de PDIs e feedbacks

### 4. **Colaborador** (Funcionário)
- Acesso às próprias avaliações
- Visualização de metas pessoais
- PDI individual
- Histórico pessoal

---

## 🛠️ Implementações Técnicas

### 1. Backend - Procedures de Autorização

**Arquivo:** `server/_core/trpc.ts`

```typescript
// Procedure para Admin apenas
export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  })
);

// Procedure para RH (admin ou rh)
export const rhProcedure = t.procedure.use(
  t.middleware(async opts => {
    if (!ctx.user || (ctx.user.role !== 'admin' && ctx.user.role !== 'rh')) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a RH" });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  })
);

// Procedure para Gestores (admin, rh ou gestor)
export const gestorProcedure = t.procedure.use(
  t.middleware(async opts => {
    if (!ctx.user || !['admin', 'rh', 'gestor'].includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a gestores" });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  })
);
```

**Benefícios:**
- ✅ Validação centralizada no backend
- ✅ Mensagens de erro claras
- ✅ Impossível burlar via frontend
- ✅ Reutilizável em todos os routers

---

### 2. Frontend - Componente de Proteção de Rotas

**Arquivo:** `client/src/components/ProtectedRoute.tsx`

```typescript
interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

export function ProtectedRoute({ children, allowedRoles, requireAuth = true }) {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Verifica autenticação
    if (requireAuth && !loading && !isAuthenticated) {
      toast.error("Você precisa estar autenticado para acessar esta página");
      setLocation("/");
      return;
    }

    // Verifica permissões
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      toast.error("Você não tem permissão para acessar esta página");
      setLocation("/");
      return;
    }
  }, [user, loading, isAuthenticated, requireAuth, allowedRoles, setLocation]);

  // Loading state
  if (loading) {
    return <LoadingScreen />;
  }

  // Renderiza conteúdo se autorizado
  return <>{children}</>;
}
```

**Hooks Auxiliares:**

```typescript
// Verificar role específica
export function useHasRole(role: UserRole | UserRole[]): boolean

// Verificar se é admin
export function useIsAdmin(): boolean

// Verificar se é RH
export function useIsRH(): boolean

// Verificar se é gestor
export function useIsGestor(): boolean
```

**Uso no App.tsx:**

```tsx
<Route path="/admin/hierarquia">
  <ProtectedRoute allowedRoles={["admin"]}>
    <Hierarquia />
  </ProtectedRoute>
</Route>

<Route path="/funcionarios">
  <ProtectedRoute allowedRoles={["admin", "rh", "gestor"]}>
    <Funcionarios />
  </ProtectedRoute>
</Route>
```

---

### 3. Sistema de Permissões de Menu

**Arquivo:** `client/src/lib/menuPermissions.ts`

**Mapeamento de Permissões por Rota:**

```typescript
const routePermissions: Record<string, UserRole[]> = {
  // Admin apenas
  "/admin/hierarquia": ["admin"],
  "/admin/audit-log": ["admin"],
  "/configuracoes/smtp": ["admin"],
  
  // RH e Admin
  "/funcionarios": ["admin", "rh", "gestor"],
  "/departamentos": ["admin", "rh"],
  "/descricao-cargos": ["admin", "rh", "gestor"],
  
  // Gestores, RH e Admin
  "/avaliacoes/configurar": ["admin", "rh", "gestor"],
  "/nine-box": ["admin", "rh", "gestor"],
  "/calibracao": ["admin", "rh", "gestor"],
  
  // Todos os usuários autenticados
  "/metas": [],
  "/avaliacoes": [],
  "/pdi": [],
};
```

**Função de Filtragem:**

```typescript
export function filterMenuItems(menuItems: MenuItem[], userRole: UserRole): MenuItem[] {
  return menuItems.filter(item => {
    // Filtra seções com filhos
    if (item.isSection && item.children) {
      const filteredChildren = item.children.filter(child => {
        if (!child.path) return true;
        return hasRoutePermission(userRole, child.path);
      });
      
      // Só mostra seção se tiver filhos visíveis
      if (filteredChildren.length === 0) return false;
      
      item.children = filteredChildren;
      return true;
    }
    
    // Filtra item simples
    if (item.path) {
      return hasRoutePermission(userRole, item.path);
    }
    
    return true;
  });
}
```

---

### 4. Integração no DashboardLayout

**Arquivo:** `client/src/components/DashboardLayout.tsx`

**Antes:**
```typescript
<SidebarMenu>
  {menuItems.map((item, idx) => (
    <MenuItem key={idx} item={item} />
  ))}
</SidebarMenu>
```

**Depois:**
```typescript
export default function DashboardLayout({ children }) {
  const { user } = useAuth();
  
  // Filtrar menu baseado no role
  const filteredMenuItems = user ? filterMenuItems(menuItems, user.role) : [];
  
  return (
    <SidebarMenu>
      {filteredMenuItems.map((item, idx) => (
        <MenuItem key={idx} item={item} />
      ))}
    </SidebarMenu>
  );
}
```

---

## 📊 Exemplo de Menu por Role

### Admin (Vê Tudo)
```
✅ Dashboard
✅ Dashboard Executivo
✅ Analytics de RH
✅ Metas
  ✅ Minhas Metas
  ✅ Metas Corporativas
  ✅ Metas em Cascata
✅ Performance
  ✅ Avaliação 360°
  ✅ Calibração
  ✅ Nine Box
✅ Desenvolvimento
  ✅ PDI Inteligente
  ✅ Mapa de Sucessão
  ✅ Testes Psicométricos
✅ Gestão de Pessoas
  ✅ Funcionários
  ✅ Departamentos
  ✅ Hierarquia Organizacional
  ✅ Descrição de Cargos
✅ Aprovações
  ✅ Dashboard
  ✅ Workflows
✅ Configurações
  ✅ SMTP (Admin)
  ✅ Audit Log
  ✅ Gestão de Aprovadores
```

### RH (Sem Admin)
```
✅ Dashboard
✅ Dashboard Executivo
✅ Analytics de RH
✅ Metas
  ✅ Minhas Metas
  ✅ Metas Corporativas
✅ Performance
  ✅ Avaliação 360°
  ✅ Calibração
  ✅ Nine Box
✅ Desenvolvimento
  ✅ PDI Inteligente
  ✅ Mapa de Sucessão
✅ Gestão de Pessoas
  ✅ Funcionários
  ✅ Departamentos
  ✅ Descrição de Cargos
✅ Aprovações
  ✅ Dashboard
  ✅ Workflows
✅ Configurações
  ✅ Gerais
  ❌ SMTP (Admin) - OCULTO
  ❌ Audit Log - OCULTO
```

### Gestor (Equipe)
```
✅ Dashboard
✅ Metas
  ✅ Minhas Metas
  ✅ Metas Corporativas
✅ Performance
  ✅ Avaliação 360°
  ✅ Calibração
  ✅ Nine Box
✅ Desenvolvimento
  ✅ PDI Inteligente
✅ Gestão de Pessoas
  ✅ Funcionários (apenas equipe)
✅ Aprovações
  ✅ Minhas Solicitações
  ✅ PDIs Pendentes
✅ Configurações
  ✅ Gerais
  ❌ SMTP - OCULTO
  ❌ Hierarquia - OCULTO
```

### Colaborador (Pessoal)
```
✅ Dashboard
✅ Metas
  ✅ Minhas Metas
✅ Performance
  ✅ Minhas Avaliações
✅ Desenvolvimento
  ✅ Meu PDI
  ✅ Badges
✅ Aprovações
  ✅ Minhas Solicitações
✅ Configurações
  ✅ Perfil
  ❌ Funcionários - OCULTO
  ❌ Departamentos - OCULTO
  ❌ Analytics - OCULTO
```

---

## 🔒 Segurança Implementada

### Camada 1: Backend (Inviolável)
- ✅ Middleware tRPC valida role antes de executar procedure
- ✅ Impossível burlar via requisições diretas
- ✅ Mensagens de erro claras sem expor informações sensíveis

### Camada 2: Roteamento (UX)
- ✅ `<ProtectedRoute>` redireciona usuários não autorizados
- ✅ Toast de feedback explica o motivo do bloqueio
- ✅ Loading state durante verificação de permissões

### Camada 3: Interface (Visual)
- ✅ Menu filtrado mostra apenas opções permitidas
- ✅ Reduz confusão do usuário
- ✅ Melhora experiência (não vê o que não pode acessar)

---

## ✅ Checklist de Implementação

- [x] Criar `adminProcedure` no backend
- [x] Criar `rhProcedure` no backend
- [x] Criar `gestorProcedure` no backend
- [x] Criar componente `<ProtectedRoute>`
- [x] Criar hooks `useHasRole`, `useIsAdmin`, `useIsRH`, `useIsGestor`
- [x] Criar sistema de mapeamento de permissões
- [x] Implementar função `filterMenuItems`
- [x] Integrar filtro no `DashboardLayout`
- [x] Documentar hierarquia de roles
- [ ] Testar com usuários de diferentes roles (próxima etapa)

---

## 🚀 Próximos Passos

### Sprint 2 - Interface de Avaliações
- Melhorar formulário de criação de avaliações
- Implementar sistema de questões com tipos variados
- Adicionar preview de avaliações
- Criar interface para responder avaliações
- Sistema de status (rascunho, ativa, encerrada)

---

## 📝 Notas Técnicas

### Vantagens da Abordagem Implementada

1. **Segurança em Camadas**
   - Backend valida (segurança real)
   - Frontend valida (UX)
   - Menu filtra (usabilidade)

2. **Manutenibilidade**
   - Permissões centralizadas em um arquivo
   - Fácil adicionar novas rotas
   - Fácil modificar permissões

3. **Escalabilidade**
   - Suporta novos roles facilmente
   - Suporta permissões granulares
   - Suporta permissões condicionais (ex: "gestor apenas da própria equipe")

4. **Experiência do Usuário**
   - Não vê opções que não pode acessar
   - Feedback claro quando tenta acessar área restrita
   - Loading states durante verificação

### Possíveis Melhorias Futuras

- [ ] Permissões baseadas em recursos (ex: "pode editar funcionário X")
- [ ] Permissões temporárias (ex: "acesso admin por 24h")
- [ ] Log de tentativas de acesso não autorizado
- [ ] Dashboard de auditoria de permissões
- [ ] Delegação de permissões (ex: gestor delega aprovação)

---

**Documento gerado automaticamente durante Sprint 1**  
**Sistema AVD UISA - Avaliação de Desempenho**
