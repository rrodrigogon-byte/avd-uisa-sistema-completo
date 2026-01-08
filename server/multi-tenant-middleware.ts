/**
 * Multi-Tenancy Middleware
 * 
 * Este middleware garante o isolamento de dados entre tenants (empresas).
 * Cada requisição deve incluir o tenant_id no contexto para filtrar dados.
 */

import { TRPCError } from "@trpc/server";
import type { inferAsyncReturnType } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { getDb } from "./db.js";
import { users, tenantUsers, tenants } from "../drizzle/schema.js";
import { eq, and } from "drizzle-orm";

/**
 * Contexto da aplicação com suporte a multi-tenancy
 */
export async function createContext(opts: FetchCreateContextFnOptions) {
  const db = await getDb();
  
  if (!db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database connection not available",
    });
  }

  // Extrair tenant_id do header
  const tenantId = opts.req.headers.get("x-tenant-id");
  
  // Extrair userId do header de autenticação (simplificado)
  const userId = opts.req.headers.get("x-user-id");
  
  let currentTenant = null;
  let currentUser = null;
  let tenantUser = null;

  // Se tenant_id foi fornecido, carregar dados do tenant
  if (tenantId) {
    const tenantIdNum = parseInt(tenantId);
    
    if (isNaN(tenantIdNum)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid tenant_id",
      });
    }

    // Carregar tenant
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(and(
        eq(tenants.id, tenantIdNum),
        eq(tenants.active, true)
      ))
      .limit(1);

    if (!tenant) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Tenant not found or inactive",
      });
    }

    currentTenant = tenant;

    // Se userId foi fornecido, verificar se usuário pertence ao tenant
    if (userId) {
      const userIdNum = parseInt(userId);
      
      if (!isNaN(userIdNum)) {
        // Carregar usuário
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userIdNum))
          .limit(1);

        if (user) {
          currentUser = user;

          // Verificar se usuário pertence ao tenant
          const [tusr] = await db
            .select()
            .from(tenantUsers)
            .where(and(
              eq(tenantUsers.tenantId, tenantIdNum),
              eq(tenantUsers.userId, userIdNum),
              eq(tenantUsers.active, true)
            ))
            .limit(1);

          if (!tusr) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "User does not belong to this tenant",
            });
          }

          tenantUser = tusr;
        }
      }
    }
  }

  return {
    db,
    tenantId: currentTenant?.id || null,
    tenant: currentTenant,
    userId: currentUser?.id || null,
    user: currentUser,
    tenantUser,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;

/**
 * Middleware que garante que o tenant_id está presente
 */
export function requireTenant(ctx: Context) {
  if (!ctx.tenantId || !ctx.tenant) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Tenant context required. Please provide x-tenant-id header.",
    });
  }
  return ctx;
}

/**
 * Middleware que garante que o usuário está autenticado
 */
export function requireAuth(ctx: Context) {
  if (!ctx.userId || !ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required. Please provide x-user-id header.",
    });
  }
  return ctx;
}

/**
 * Middleware que garante que o usuário pertence ao tenant e está autenticado
 */
export function requireTenantAuth(ctx: Context) {
  const withTenant = requireTenant(ctx);
  const withAuth = requireAuth(withTenant);
  
  if (!withAuth.tenantUser) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "User does not have access to this tenant",
    });
  }
  
  return withAuth;
}

/**
 * Helper para adicionar filtro de tenant_id em queries
 */
export function withTenantFilter(ctx: Context, additionalConditions: any[] = []) {
  if (!ctx.tenantId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Tenant context required",
    });
  }
  
  // Retorna array de condições incluindo tenant_id
  return additionalConditions;
}

/**
 * Helper para adicionar tenant_id em inserções
 */
export function withTenantData<T extends Record<string, any>>(ctx: Context, data: T) {
  if (!ctx.tenantId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Tenant context required",
    });
  }
  
  return {
    ...data,
    tenantId: ctx.tenantId,
  };
}

/**
 * Verificar permissão de super admin do tenant
 */
export function requireTenantSuperAdmin(ctx: Context) {
  const withAuth = requireTenantAuth(ctx);
  
  if (withAuth.tenantUser?.role !== "super_admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Super admin permission required",
    });
  }
  
  return withAuth;
}

/**
 * Verificar permissão de admin do tenant (super_admin ou admin)
 */
export function requireTenantAdmin(ctx: Context) {
  const withAuth = requireTenantAuth(ctx);
  
  if (
    withAuth.tenantUser?.role !== "super_admin" &&
    withAuth.tenantUser?.role !== "admin"
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin permission required",
    });
  }
  
  return withAuth;
}

/**
 * Verificar permissão de manager do tenant (super_admin, admin ou manager)
 */
export function requireTenantManager(ctx: Context) {
  const withAuth = requireTenantAuth(ctx);
  
  if (
    withAuth.tenantUser?.role !== "super_admin" &&
    withAuth.tenantUser?.role !== "admin" &&
    withAuth.tenantUser?.role !== "manager"
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Manager permission required",
    });
  }
  
  return withAuth;
}

/**
 * Verificar se usuário possui permissão específica
 */
export function requirePermission(ctx: Context, permission: string) {
  const withAuth = requireTenantAuth(ctx);
  
  const permissions = withAuth.tenantUser?.permissions || [];
  
  if (!permissions.includes(permission)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Permission '${permission}' required`,
    });
  }
  
  return withAuth;
}
