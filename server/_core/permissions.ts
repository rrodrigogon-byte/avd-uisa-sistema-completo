import { TRPCError } from "@trpc/server";
import type { User } from "../../drizzle/schema";

/**
 * Sistema de Validação de Permissões
 * Centraliza a lógica de controle de acesso
 */

export type Permission = 
  | "admin:full_access"
  | "admin:manage_users"
  | "user:view_own_data";

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: ["admin:full_access", "admin:manage_users", "user:view_own_data"],
  user: ["user:view_own_data"],
};

export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false;
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes(permission);
}

export function requirePermission(user: User | null, permission: Permission): void {
  if (!hasPermission(user, permission)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Acesso negado. Permissão necessária: ${permission}`,
    });
  }
}

export function isAdmin(user: User | null): boolean {
  return user?.role === "admin";
}

export function requireAdmin(user: User | null): void {
  if (!isAdmin(user)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Acesso negado. Apenas administradores.",
    });
  }
}

export function validateId(id: any): number {
  const numId = Number(id);
  if (isNaN(numId) || numId <= 0 || !Number.isInteger(numId)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "ID inválido.",
    });
  }
  return numId;
}

export function limitPageSize(pageSize: number, maxSize: number = 1000): number {
  if (pageSize <= 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Tamanho de página inválido.",
    });
  }
  return Math.min(pageSize, maxSize);
}

export async function logAuditAction(
  userId: number,
  action: string,
  entityType: string,
  entityId: number,
  details?: Record<string, any>
): Promise<void> {
  try {
    const { getDb } = await import("../db");
    const { auditLogs } = await import("../../drizzle/schema");
    const db = await getDb();
    if (!db) return;
    await db.insert(auditLogs).values({
      userId,
      action,
      entityType,
      entityId,
      details: details ? JSON.stringify(details) : null,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("[Audit] Erro ao registrar log:", error);
  }
}
