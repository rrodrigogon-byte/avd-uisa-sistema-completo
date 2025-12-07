import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { encryptPassword, decryptPassword, generateSecurePassword, validatePasswordStrength } from "../encryption";

/**
 * Router para gerenciamento de senhas de líderes
 * Apenas administradores podem acessar
 */

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Acesso negado. Apenas administradores podem acessar esta funcionalidade.",
    });
  }
  return next({ ctx });
});

export const leaderPasswordsRouter = router({
  /**
   * Listar todas as senhas de líderes
   */
  list: adminProcedure.query(async () => {
    const passwords = await db.getAllLeaderPasswords();
    
    // Não retornar senhas descriptografadas na listagem
    return passwords.map((p) => ({
      ...p,
      encryptedPassword: undefined, // Remover senha da listagem
      hasPassword: true,
    }));
  }),

  /**
   * Buscar senha por ID
   */
  getById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const password = await db.getLeaderPasswordById(input.id);
      if (!password) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Senha não encontrada",
        });
      }
      
      // Não retornar senha descriptografada
      return {
        ...password,
        encryptedPassword: undefined,
        hasPassword: true,
      };
    }),

  /**
   * Buscar senhas por líder
   */
  getByLeaderId: adminProcedure
    .input(z.object({ leaderId: z.number() }))
    .query(async ({ input }) => {
      const passwords = await db.getLeaderPasswordsByLeaderId(input.leaderId);
      
      return passwords.map((p) => ({
        ...p,
        encryptedPassword: undefined,
        hasPassword: true,
      }));
    }),

  /**
   * Descriptografar e visualizar senha
   * Registra acesso no log de auditoria
   */
  viewPassword: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const password = await db.getLeaderPasswordById(input.id);
      if (!password) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Senha não encontrada",
        });
      }

      // Descriptografar senha
      const decryptedPassword = decryptPassword(password.encryptedPassword);

      // Registrar acesso
      await db.logLeaderPasswordAccess({
        passwordId: input.id,
        accessedBy: ctx.user.id,
        action: "view",
        ipAddress: ctx.req.ip || ctx.req.socket.remoteAddress,
        userAgent: ctx.req.headers["user-agent"],
      });

      // Atualizar último acesso
      await db.updateLeaderPassword(input.id, {
        lastAccessedAt: new Date(),
        lastAccessedBy: ctx.user.id,
      });

      return {
        password: decryptedPassword,
      };
    }),

  /**
   * Criar nova senha
   */
  create: adminProcedure
    .input(
      z.object({
        leaderId: z.number(),
        systemName: z.string().min(1),
        username: z.string().min(1),
        password: z.string().min(1),
        url: z.string().optional(),
        notes: z.string().optional(),
        category: z.enum(["sistema_rh", "sistema_financeiro", "sistema_operacional", "portal_web", "outro"]),
        expiresAt: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Criptografar senha
      const encryptedPassword = encryptPassword(input.password);

      const id = await db.createLeaderPassword({
        leaderId: input.leaderId,
        systemName: input.systemName,
        username: input.username,
        encryptedPassword,
        url: input.url || null,
        notes: input.notes || null,
        category: input.category,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        isActive: true,
        createdBy: ctx.user.id,
      });

      return { success: true, id };
    }),

  /**
   * Atualizar senha
   */
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        systemName: z.string().min(1).optional(),
        username: z.string().min(1).optional(),
        password: z.string().min(1).optional(),
        url: z.string().optional(),
        notes: z.string().optional(),
        category: z.enum(["sistema_rh", "sistema_financeiro", "sistema_operacional", "portal_web", "outro"]).optional(),
        expiresAt: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const password = await db.getLeaderPasswordById(input.id);
      if (!password) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Senha não encontrada",
        });
      }

      const updateData: any = {};
      if (input.systemName) updateData.systemName = input.systemName;
      if (input.username) updateData.username = input.username;
      if (input.password) updateData.encryptedPassword = encryptPassword(input.password);
      if (input.url !== undefined) updateData.url = input.url || null;
      if (input.notes !== undefined) updateData.notes = input.notes || null;
      if (input.category) updateData.category = input.category;
      if (input.expiresAt !== undefined) updateData.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;

      await db.updateLeaderPassword(input.id, updateData);

      // Registrar edição
      await db.logLeaderPasswordAccess({
        passwordId: input.id,
        accessedBy: ctx.user.id,
        action: "edit",
        ipAddress: ctx.req.ip || ctx.req.socket.remoteAddress,
        userAgent: ctx.req.headers["user-agent"],
      });

      return { success: true };
    }),

  /**
   * Deletar senha (soft delete)
   */
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const password = await db.getLeaderPasswordById(input.id);
      if (!password) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Senha não encontrada",
        });
      }

      await db.deleteLeaderPassword(input.id);

      // Registrar exclusão
      await db.logLeaderPasswordAccess({
        passwordId: input.id,
        accessedBy: ctx.user.id,
        action: "delete",
        ipAddress: ctx.req.ip || ctx.req.socket.remoteAddress,
        userAgent: ctx.req.headers["user-agent"],
      });

      return { success: true };
    }),

  /**
   * Gerar senha segura
   */
  generatePassword: adminProcedure
    .input(z.object({ length: z.number().min(8).max(64).optional() }))
    .query(({ input }) => {
      const password = generateSecurePassword(input.length || 16);
      const strength = validatePasswordStrength(password);
      
      return {
        password,
        strength,
      };
    }),

  /**
   * Validar força de senha
   */
  validateStrength: adminProcedure
    .input(z.object({ password: z.string() }))
    .query(({ input }) => {
      return validatePasswordStrength(input.password);
    }),

  /**
   * Buscar logs de acesso de uma senha
   */
  getAccessLogs: adminProcedure
    .input(z.object({ passwordId: z.number() }))
    .query(async ({ input }) => {
      return await db.getLeaderPasswordAccessLogs(input.passwordId);
    }),
});
