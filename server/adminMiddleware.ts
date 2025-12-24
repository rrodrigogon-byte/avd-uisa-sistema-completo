import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "./_core/trpc";

/**
 * Middleware de Permissões Admin
 * Garante que apenas admins possam executar operações privilegiadas
 */

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Acesso negado. Apenas administradores podem realizar esta ação.',
    });
  }
  return next({ ctx });
});

/**
 * Verifica se o usuário é admin OU é o próprio dono do recurso
 */
export function canEditResource(userId: number, resourceOwnerId: number, userRole: string): boolean {
  return userRole === 'admin' || userId === resourceOwnerId;
}

/**
 * Verifica se o usuário pode aprovar (admin ou gestor direto)
 */
export function canApprove(userId: number, userRole: string, isDirectManager: boolean): boolean {
  return userRole === 'admin' || isDirectManager;
}
