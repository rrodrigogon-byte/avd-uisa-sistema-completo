import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { notifyNewUser } from "../adminRhEmailService";

/**
 * Router para gestão de usuários
 * Apenas administradores e RH podem acessar
 */

const adminOrRHProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Acesso negado. Apenas administradores e RH podem acessar esta funcionalidade.",
    });
  }
  return next({ ctx });
});

export const usersRouter = router({
  /**
   * Listar todos os usuários
   */
  list: adminOrRHProcedure.query(async () => {
    return await db.getAllUsers();
  }),

  /**
   * Buscar usuário por ID
   */
  getById: adminOrRHProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const user = await db.getUserById(input.id);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado",
        });
      }
      return user;
    }),

  /**
   * Buscar usuários por perfil
   */
  getByRole: adminOrRHProcedure
    .input(
      z.object({
        role: z.enum(["admin", "rh", "gestor", "colaborador"]),
      })
    )
    .query(async ({ input }) => {
      return await db.getUsersByRole(input.role);
    }),

  /**
   * Buscar usuários
   */
  search: adminOrRHProcedure
    .input(
      z.object({
        term: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      return await db.searchUsers(input.term);
    }),

  /**
   * Atualizar perfil do usuário
   */
  updateRole: adminOrRHProcedure
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["admin", "rh", "gestor", "colaborador"]),
      })
    )
    .mutation(async ({ input }) => {
      await db.updateUserRole(input.userId, input.role);
      
      // Enviar notificação para Admin e RH sobre mudança de perfil
      try {
        const user = await db.getUserById(input.userId);
        if (user && user.email) {
          await notifyNewUser(
            user.name || "N/A",
            user.email,
            input.role
          );
        }
      } catch (error) {
        console.error('[UsersRouter] Failed to send email notification:', error);
      }
      
      return { success: true };
    }),

  /**
   * Atualizar status de Líder de Cargos e Salários
   */
  updateSalaryLead: adminOrRHProcedure
    .input(
      z.object({
        userId: z.number(),
        isSalaryLead: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      await db.updateUserSalaryLead(input.userId, input.isSalaryLead);
      return { success: true };
    }),

  /**
   * Estatísticas de usuários
   */
  stats: adminOrRHProcedure.query(async () => {
    const allUsers = await db.getAllUsers();
    
    return {
      total: allUsers.length,
      byRole: {
        admin: allUsers.filter((u) => u.role === "admin").length,
        rh: allUsers.filter((u) => u.role === "rh").length,
        gestor: allUsers.filter((u) => u.role === "gestor").length,
        colaborador: allUsers.filter((u) => u.role === "colaborador").length,
      },
      salaryLeads: allUsers.filter((u) => u.isSalaryLead).length,
    };
  }),
});
