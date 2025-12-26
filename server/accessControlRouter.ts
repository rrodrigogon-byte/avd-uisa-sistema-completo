/**
 * Router tRPC para Sistema de Controle de Acesso
 * Gerenciamento de perfis, permissões e auditoria (SOX compliance)
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getAllPermissions,
  getPermissionsByCategory,
  getAllProfiles,
  getProfileById,
  getProfileByCode,
  getProfilePermissions,
  updateProfilePermissions,
  getUserProfiles,
  assignProfileToUser,
  revokeProfileFromUser,
  hasPermission,
  getUserPermissions,
  logAccess,
  getAccessLogs,
  createPermissionChangeRequest,
  getPendingPermissionChangeRequests,
  approvePermissionChangeRequest,
  rejectPermissionChangeRequest,
} from "./db-access-control";

// ============================================================================
// MIDDLEWARE DE AUTORIZAÇÃO
// ============================================================================

/**
 * Middleware para verificar se usuário tem permissão específica
 */
const requirePermission = (resource: string, action: string) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    const hasAccess = await hasPermission(ctx.user.id, resource, action);

    // Registrar tentativa de acesso
    await logAccess({
      userId: ctx.user.id,
      userName: ctx.user.name || undefined,
      userEmail: ctx.user.email || undefined,
      action: `${action}_${resource}`,
      resource,
      actionType: "read",
      success: hasAccess,
      errorMessage: hasAccess ? undefined : "Permissão negada",
      ipAddress: ctx.req.ip || ctx.req.socket.remoteAddress,
      userAgent: ctx.req.headers["user-agent"],
      requestMethod: ctx.req.method,
      requestPath: ctx.req.path,
    });

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Você não tem permissão para ${action} ${resource}`,
      });
    }

    return next({ ctx });
  });

/**
 * Middleware para verificar se usuário é admin
 */
const requireAdmin = protectedProcedure.use(async ({ ctx, next }) => {
  const userProfiles = await getUserProfiles(ctx.user.id);
  const isAdmin = userProfiles.some(p => p.code === "admin");

  if (!isAdmin) {
    await logAccess({
      userId: ctx.user.id,
      userName: ctx.user.name || undefined,
      userEmail: ctx.user.email || undefined,
      action: "admin_access_denied",
      resource: "admin",
      actionType: "read",
      success: false,
      errorMessage: "Acesso administrativo negado",
      ipAddress: ctx.req.ip || ctx.req.socket.remoteAddress,
      userAgent: ctx.req.headers["user-agent"],
    });

    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Acesso restrito a administradores",
    });
  }

  return next({ ctx });
});

// ============================================================================
// ROUTER
// ============================================================================

export const accessControlRouter = router({
  // ==========================================================================
  // PERMISSÕES
  // ==========================================================================

  /**
   * Listar todas as permissões
   */
  listPermissions: requireAdmin.query(async () => {
    return getAllPermissions();
  }),

  /**
   * Listar permissões por categoria
   */
  listPermissionsByCategory: requireAdmin.input(
    z.object({
      category: z.string(),
    })
  ).query(async ({ input }) => {
    return getPermissionsByCategory(input.category);
  }),

  // ==========================================================================
  // PERFIS
  // ==========================================================================

  /**
   * Listar todos os perfis
   */
  listProfiles: requireAdmin.query(async () => {
    return getAllProfiles();
  }),

  /**
   * Obter perfil por ID
   */
  getProfile: requireAdmin.input(
    z.object({
      profileId: z.number(),
    })
  ).query(async ({ input }) => {
    const profile = await getProfileById(input.profileId);
    if (!profile) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Perfil não encontrado",
      });
    }
    return profile;
  }),

  /**
   * Obter permissões de um perfil
   */
  getProfilePermissions: requireAdmin.input(
    z.object({
      profileId: z.number(),
    })
  ).query(async ({ input }) => {
    return getProfilePermissions(input.profileId);
  }),

  /**
   * Atualizar permissões de um perfil
   */
  updateProfilePermissions: requireAdmin.input(
    z.object({
      profileId: z.number(),
      permissionIds: z.array(z.number()),
    })
  ).mutation(async ({ input, ctx }) => {
    await updateProfilePermissions(input.profileId, input.permissionIds);

    // Registrar auditoria
    await logAccess({
      userId: ctx.user.id,
      userName: ctx.user.name || undefined,
      userEmail: ctx.user.email || undefined,
      action: "update_profile_permissions",
      resource: "admin",
      resourceId: input.profileId,
      actionType: "update",
      success: true,
      newValue: JSON.stringify({ permissionIds: input.permissionIds }),
      ipAddress: ctx.req.ip || ctx.req.socket.remoteAddress,
      userAgent: ctx.req.headers["user-agent"],
    });

    return { success: true };
  }),

  // ==========================================================================
  // PERFIS DE USUÁRIOS
  // ==========================================================================

  /**
   * Obter perfis de um usuário
   */
  getUserProfiles: protectedProcedure.input(
    z.object({
      userId: z.number().optional(),
    })
  .optional()).query(async ({ input, ctx }) => {
    const userId = input.userId || ctx.user.id;

    // Apenas admin pode ver perfis de outros usuários
    if (userId !== ctx.user.id) {
      const isAdmin = await hasPermission(ctx.user.id, "admin", "gerenciar_usuarios");
      if (!isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não pode visualizar perfis de outros usuários",
        });
      }
    }

    return getUserProfiles(userId);
  }),

  /**
   * Obter permissões do usuário atual
   */
  getMyPermissions: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
    return getUserPermissions(ctx.user.id);
  }),

  /**
   * Verificar se usuário tem permissão específica
   */
  checkPermission: protectedProcedure.input(
    z.object({
      resource: z.string(),
      action: z.string(),
    })
  ).query(async ({ input, ctx }) => {
    return hasPermission(ctx.user.id, input.resource, input.action);
  }),

  /**
   * Atribuir perfil a usuário
   */
  assignProfile: requireAdmin.input(
    z.object({
      userId: z.number(),
      profileId: z.number(),
    })
  ).mutation(async ({ input, ctx }) => {
    await assignProfileToUser(input.userId, input.profileId, ctx.user.id);

    // Registrar auditoria
    await logAccess({
      userId: ctx.user.id,
      userName: ctx.user.name || undefined,
      userEmail: ctx.user.email || undefined,
      action: "assign_profile",
      resource: "admin",
      resourceId: input.userId,
      actionType: "permission_change",
      success: true,
      newValue: JSON.stringify({ profileId: input.profileId }),
      ipAddress: ctx.req.ip || ctx.req.socket.remoteAddress,
      userAgent: ctx.req.headers["user-agent"],
    });

    return { success: true };
  }),

  /**
   * Revogar perfil de usuário
   */
  revokeProfile: requireAdmin.input(
    z.object({
      userId: z.number(),
      profileId: z.number(),
    })
  ).mutation(async ({ input, ctx }) => {
    await revokeProfileFromUser(input.userId, input.profileId, ctx.user.id);

    // Registrar auditoria
    await logAccess({
      userId: ctx.user.id,
      userName: ctx.user.name || undefined,
      userEmail: ctx.user.email || undefined,
      action: "revoke_profile",
      resource: "admin",
      resourceId: input.userId,
      actionType: "permission_change",
      success: true,
      oldValue: JSON.stringify({ profileId: input.profileId }),
      ipAddress: ctx.req.ip || ctx.req.socket.remoteAddress,
      userAgent: ctx.req.headers["user-agent"],
    });

    return { success: true };
  }),

  // ==========================================================================
  // AUDITORIA
  // ==========================================================================

  /**
   * Obter logs de auditoria
   */
  getAuditLogs: requireAdmin.input(
    z.object({
      userId: z.number().optional(),
      resource: z.string().optional(),
      actionType: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      limit: z.number().default(100),
    })
  ).query(async ({ input }) => {
    return getAccessLogs(input);
  }),

  // ==========================================================================
  // SOLICITAÇÕES DE MUDANÇA DE PERMISSÕES
  // ==========================================================================

  /**
   * Criar solicitação de mudança de permissão
   */
  requestPermissionChange: protectedProcedure.input(
    z.object({
      targetUserId: z.number(),
      targetUserName: z.string(),
      changeType: z.enum(["add_profile", "remove_profile", "change_profile"]),
      currentProfileId: z.number().optional(),
      requestedProfileId: z.number(),
      reason: z.string().min(10),
      businessJustification: z.string().optional(),
      priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
    })
  ).mutation(async ({ input, ctx }) => {
    const requestId = await createPermissionChangeRequest({
      ...input,
      requestedBy: ctx.user.id,
      requestedByName: ctx.user.name || undefined,
    });

    // Registrar auditoria
    await logAccess({
      userId: ctx.user.id,
      userName: ctx.user.name || undefined,
      userEmail: ctx.user.email || undefined,
      action: "request_permission_change",
      resource: "admin",
      resourceId: requestId,
      actionType: "create",
      success: true,
      newValue: JSON.stringify(input),
      ipAddress: ctx.req.ip || ctx.req.socket.remoteAddress,
      userAgent: ctx.req.headers["user-agent"],
    });

    return { requestId };
  }),

  /**
   * Listar solicitações pendentes
   */
  listPendingRequests: requireAdmin.query(async () => {
    return getPendingPermissionChangeRequests();
  }),

  /**
   * Aprovar solicitação
   */
  approveRequest: requireAdmin.input(
    z.object({
      requestId: z.number(),
      comments: z.string().optional(),
    })
  ).mutation(async ({ input, ctx }) => {
    await approvePermissionChangeRequest(
      input.requestId,
      ctx.user.id,
      ctx.user.name || "Admin",
      input.comments
    );

    // Registrar auditoria
    await logAccess({
      userId: ctx.user.id,
      userName: ctx.user.name || undefined,
      userEmail: ctx.user.email || undefined,
      action: "approve_permission_change",
      resource: "admin",
      resourceId: input.requestId,
      actionType: "approve",
      success: true,
      ipAddress: ctx.req.ip || ctx.req.socket.remoteAddress,
      userAgent: ctx.req.headers["user-agent"],
    });

    return { success: true };
  }),

  /**
   * Rejeitar solicitação
   */
  rejectRequest: requireAdmin.input(
    z.object({
      requestId: z.number(),
      comments: z.string().min(10),
    })
  ).mutation(async ({ input, ctx }) => {
    await rejectPermissionChangeRequest(
      input.requestId,
      ctx.user.id,
      ctx.user.name || "Admin",
      input.comments
    );

    // Registrar auditoria
    await logAccess({
      userId: ctx.user.id,
      userName: ctx.user.name || undefined,
      userEmail: ctx.user.email || undefined,
      action: "reject_permission_change",
      resource: "admin",
      resourceId: input.requestId,
      actionType: "reject",
      success: true,
      ipAddress: ctx.req.ip || ctx.req.socket.remoteAddress,
      userAgent: ctx.req.headers["user-agent"],
    });

    return { success: true };
  }),
});
