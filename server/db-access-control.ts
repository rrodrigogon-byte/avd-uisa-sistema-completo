/**
 * Funções de banco de dados para controle de acesso
 * Sistema baseado em SOX com auditoria completa
 */

import { eq, and, inArray, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  permissions,
  profiles,
  profilePermissions,
  userProfiles,
  accessAuditLogs,
  permissionChangeRequests,
  type Permission,
  type Profile,
  type ProfilePermission,
  type UserProfile,
  type AccessAuditLog,
  type InsertAccessAuditLog,
  type PermissionChangeRequest,
  type InsertPermissionChangeRequest,
} from "../drizzle/schema";

// ============================================================================
// PERMISSÕES
// ============================================================================

export async function getAllPermissions(): Promise<Permission[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(permissions).where(eq(permissions.active, true));
}

export async function getPermissionsByCategory(category: string): Promise<Permission[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(permissions)
    .where(and(eq(permissions.category, category), eq(permissions.active, true)));
}

// ============================================================================
// PERFIS
// ============================================================================

export async function getAllProfiles(): Promise<Profile[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(profiles).where(eq(profiles.active, true)).orderBy(profiles.level);
}

export async function getProfileById(profileId: number): Promise<Profile | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(profiles).where(eq(profiles.id, profileId)).limit(1);
  return result[0];
}

export async function getProfileByCode(code: string): Promise<Profile | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(profiles).where(eq(profiles.code, code)).limit(1);
  return result[0];
}

// ============================================================================
// PERMISSÕES DE PERFIS
// ============================================================================

export async function getProfilePermissions(profileId: number): Promise<Permission[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: permissions.id,
      resource: permissions.resource,
      action: permissions.action,
      description: permissions.description,
      category: permissions.category,
      active: permissions.active,
      createdAt: permissions.createdAt,
    })
    .from(profilePermissions)
    .innerJoin(permissions, eq(profilePermissions.permissionId, permissions.id))
    .where(and(
      eq(profilePermissions.profileId, profileId),
      eq(permissions.active, true)
    ));

  return result;
}

export async function updateProfilePermissions(
  profileId: number,
  permissionIds: number[]
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Remover todas as permissões antigas
  await db.delete(profilePermissions).where(eq(profilePermissions.profileId, profileId));

  // Adicionar novas permissões
  if (permissionIds.length > 0) {
    const values = permissionIds.map(permissionId => ({
      profileId,
      permissionId,
    }));
    await db.insert(profilePermissions).values(values);
  }
}

// ============================================================================
// PERFIS DE USUÁRIOS
// ============================================================================

export async function getUserProfiles(userId: number): Promise<Profile[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: profiles.id,
      code: profiles.code,
      name: profiles.name,
      description: profiles.description,
      level: profiles.level,
      active: profiles.active,
      createdAt: profiles.createdAt,
      updatedAt: profiles.updatedAt,
    })
    .from(userProfiles)
    .innerJoin(profiles, eq(userProfiles.profileId, profiles.id))
    .where(and(
      eq(userProfiles.userId, userId),
      eq(userProfiles.active, true),
      eq(profiles.active, true)
    ))
    .orderBy(profiles.level);

  return result;
}

export async function assignProfileToUser(
  userId: number,
  profileId: number,
  assignedBy: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Verificar se já existe
  const existing = await db.select().from(userProfiles)
    .where(and(
      eq(userProfiles.userId, userId),
      eq(userProfiles.profileId, profileId),
      eq(userProfiles.active, true)
    ))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(userProfiles).values({
      userId,
      profileId,
      assignedBy,
      active: true,
    });
  }
}

export async function revokeProfileFromUser(
  userId: number,
  profileId: number,
  revokedBy: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(userProfiles)
    .set({
      active: false,
      revokedBy,
      revokedAt: new Date(),
    })
    .where(and(
      eq(userProfiles.userId, userId),
      eq(userProfiles.profileId, profileId),
      eq(userProfiles.active, true)
    ));
}

// ============================================================================
// VERIFICAÇÃO DE PERMISSÕES
// ============================================================================

export async function hasPermission(
  userId: number,
  resource: string,
  action: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Buscar perfis ativos do usuário
  const userProfilesResult = await db
    .select({ profileId: userProfiles.profileId })
    .from(userProfiles)
    .where(and(
      eq(userProfiles.userId, userId),
      eq(userProfiles.active, true)
    ));

  if (userProfilesResult.length === 0) return false;

  const profileIds = userProfilesResult.map(up => up.profileId);

  // Verificar se algum perfil tem a permissão
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(profilePermissions)
    .innerJoin(permissions, eq(profilePermissions.permissionId, permissions.id))
    .where(and(
      inArray(profilePermissions.profileId, profileIds),
      eq(permissions.resource, resource),
      eq(permissions.action, action),
      eq(permissions.active, true)
    ));

  return result[0]?.count > 0;
}

export async function getUserPermissions(userId: number): Promise<Permission[]> {
  const db = await getDb();
  if (!db) return [];

  // Buscar perfis ativos do usuário
  const userProfilesResult = await db
    .select({ profileId: userProfiles.profileId })
    .from(userProfiles)
    .where(and(
      eq(userProfiles.userId, userId),
      eq(userProfiles.active, true)
    ));

  if (userProfilesResult.length === 0) return [];

  const profileIds = userProfilesResult.map(up => up.profileId);

  // Buscar todas as permissões dos perfis
  const result = await db
    .select({
      id: permissions.id,
      resource: permissions.resource,
      action: permissions.action,
      description: permissions.description,
      category: permissions.category,
      active: permissions.active,
      createdAt: permissions.createdAt,
    })
    .from(profilePermissions)
    .innerJoin(permissions, eq(profilePermissions.permissionId, permissions.id))
    .where(and(
      inArray(profilePermissions.profileId, profileIds),
      eq(permissions.active, true)
    ));

  // Remover duplicatas
  const uniquePermissions = Array.from(
    new Map(result.map(p => [`${p.resource}-${p.action}`, p])).values()
  );

  return uniquePermissions;
}

// ============================================================================
// AUDITORIA
// ============================================================================

export async function logAccess(data: InsertAccessAuditLog): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(accessAuditLogs).values(data);
}

export async function getAccessLogs(filters: {
  userId?: number;
  resource?: string;
  actionType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<AccessAuditLog[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  
  if (filters.userId) {
    conditions.push(eq(accessAuditLogs.userId, filters.userId));
  }
  if (filters.resource) {
    conditions.push(eq(accessAuditLogs.resource, filters.resource));
  }
  if (filters.startDate) {
    conditions.push(sql`${accessAuditLogs.timestamp} >= ${filters.startDate}`);
  }
  if (filters.endDate) {
    conditions.push(sql`${accessAuditLogs.timestamp} <= ${filters.endDate}`);
  }

  let query = db.select().from(accessAuditLogs);

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  query = query.orderBy(sql`${accessAuditLogs.timestamp} DESC`);

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  return query;
}

// ============================================================================
// SOLICITAÇÕES DE MUDANÇA DE PERMISSÕES
// ============================================================================

export async function createPermissionChangeRequest(
  data: InsertPermissionChangeRequest
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.insert(permissionChangeRequests).values(data);
  return result[0].insertId;
}

export async function getPendingPermissionChangeRequests(): Promise<PermissionChangeRequest[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(permissionChangeRequests)
    .where(eq(permissionChangeRequests.status, "pending"))
    .orderBy(sql`${permissionChangeRequests.priority} DESC, ${permissionChangeRequests.requestedAt} ASC`);
}

export async function approvePermissionChangeRequest(
  requestId: number,
  approvedBy: number,
  approvedByName: string,
  comments?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(permissionChangeRequests)
    .set({
      status: "approved",
      approvedBy,
      approvedByName,
      approvedAt: new Date(),
      approvalComments: comments,
    })
    .where(eq(permissionChangeRequests.id, requestId));
}

export async function rejectPermissionChangeRequest(
  requestId: number,
  approvedBy: number,
  approvedByName: string,
  comments: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(permissionChangeRequests)
    .set({
      status: "rejected",
      approvedBy,
      approvedByName,
      approvedAt: new Date(),
      approvalComments: comments,
    })
    .where(eq(permissionChangeRequests.id, requestId));
}
