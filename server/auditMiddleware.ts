/**
 * Middleware de Auditoria Automática para tRPC
 * Sistema AVD UISA
 * 
 * Este middleware captura automaticamente todas as operações de mutation
 * e registra logs de auditoria com contexto completo.
 */

import { middleware } from "./_core/trpc";
import { logAudit, type AuditContext } from "./integrity";
import { TRPCError } from "@trpc/server";

/**
 * Middleware que registra automaticamente operações de mutation
 */
export const auditMiddleware = middleware(async ({ ctx, next, path, type, input }) => {
  // Só auditar mutations (operações de escrita)
  if (type !== "mutation") {
    return next();
  }

  const startTime = Date.now();
  let success = false;
  let errorMessage: string | undefined;
  let result: any;

  try {
    // Executar operação
    result = await next();
    success = true;
    return result;
  } catch (error) {
    success = false;
    errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw error;
  } finally {
    // Registrar auditoria após operação (sucesso ou erro)
    if (ctx.user) {
      const auditContext: AuditContext = {
        userId: ctx.user.id,
        userName: ctx.user.name || undefined,
        userEmail: ctx.user.email || undefined,
        action: path,
        resource: path.split(".")[0] || "unknown",
        // Tentar extrair resourceId do resultado ou input
        resourceId: result?.id || result?.data?.id || input?.id,
      };

      await logAudit(auditContext, {
        oldValue: undefined, // Não temos valor antigo no middleware
        newValue: input, // Input da operação
        success,
        errorMessage,
      }).catch((err) => {
        // Não falhar a operação se auditoria falhar
        console.error("[AuditMiddleware] Failed to log:", err);
      });
    }
  }
});

/**
 * Middleware específico para operações críticas que requerem auditoria detalhada
 */
export const criticalAuditMiddleware = middleware(async ({ ctx, next, path, type, input }) => {
  if (type !== "mutation") {
    return next();
  }

  // Lista de operações críticas que requerem auditoria detalhada
  const criticalOperations = [
    "avd.startProcess",
    "avd.completeProcess",
    "avd.deleteProcess",
    "employees.create",
    "employees.update",
    "employees.delete",
    "evaluationCycles.create",
    "evaluationCycles.update",
    "evaluationCycles.delete",
    "performanceEvaluations.create",
    "performanceEvaluations.update",
    "performanceEvaluations.approve",
  ];

  const isCritical = criticalOperations.some((op) => path.startsWith(op));

  if (!isCritical) {
    return next();
  }

  // Para operações críticas, registrar antes e depois
  const auditContext: AuditContext = {
    userId: ctx.user?.id || 0,
    userName: ctx.user?.name || undefined,
    userEmail: ctx.user?.email || undefined,
    action: `${path} (CRITICAL)`,
    resource: path.split(".")[0] || "unknown",
  };

  try {
    const result = await next();

    // Registrar sucesso
    await logAudit(auditContext, {
      newValue: { input, result },
      success: true,
    }).catch((err) => {
      console.error("[CriticalAuditMiddleware] Failed to log success:", err);
    });

    return result;
  } catch (error) {
    // Registrar erro
    await logAudit(auditContext, {
      newValue: input,
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    }).catch((err) => {
      console.error("[CriticalAuditMiddleware] Failed to log error:", err);
    });

    throw error;
  }
});

/**
 * Middleware de rate limiting para prevenir abuso
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimitMiddleware = (maxRequests: number = 100, windowMs: number = 60000) => {
  return middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      return next();
    }

    const userId = ctx.user.id.toString();
    const now = Date.now();

    let userRequests = requestCounts.get(userId);

    if (!userRequests || now > userRequests.resetTime) {
      // Nova janela de tempo
      userRequests = {
        count: 1,
        resetTime: now + windowMs,
      };
      requestCounts.set(userId, userRequests);
      return next();
    }

    if (userRequests.count >= maxRequests) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded. Try again in ${Math.ceil((userRequests.resetTime - now) / 1000)} seconds.`,
      });
    }

    userRequests.count++;
    return next();
  });
};

/**
 * Middleware de validação de permissões por perfil
 */
export const requireRole = (...allowedRoles: string[]) => {
  return middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Access denied. Required roles: ${allowedRoles.join(", ")}`,
      });
    }

    return next();
  });
};

/**
 * Middleware de validação de permissões específicas
 */
export const requirePermission = (permission: string) => {
  return middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    // Admin tem todas as permissões
    if (ctx.user.role === "admin") {
      return next();
    }

    // Aqui você pode implementar lógica mais complexa de permissões
    // Por exemplo, verificar em uma tabela de permissões por perfil
    // Por enquanto, apenas verificamos o role

    const rolePermissions: Record<string, string[]> = {
      rh: [
        "view_employees",
        "create_employees",
        "update_employees",
        "view_evaluations",
        "create_evaluations",
        "view_reports",
      ],
      gestor: [
        "view_employees",
        "view_evaluations",
        "create_evaluations",
        "update_evaluations",
        "view_reports",
      ],
      colaborador: ["view_own_evaluation", "update_own_evaluation"],
    };

    const userPermissions = rolePermissions[ctx.user.role] || [];

    if (!userPermissions.includes(permission)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Permission denied: ${permission}`,
      });
    }

    return next();
  });
};
