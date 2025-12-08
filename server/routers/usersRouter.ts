import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { notifyNewUser } from "../adminRhEmailService";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

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
   * Criar novo usuário
   */
  create: adminOrRHProcedure
    .input(
      z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        email: z.string().email("Email inválido"),
        role: z.enum(["admin", "rh", "gestor", "colaborador"]),
        isSalaryLead: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      // Verificar se email já existe
      const existingUser = await db.getUserByEmail(input.email);
      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Já existe um usuário com este email",
        });
      }

      // Gerar openId único baseado no email
      const openId = `manual_${input.email}_${Date.now()}`;

      try {
        // Inserir novo usuário
        const result = await database.insert(users).values({
          openId,
          name: input.name,
          email: input.email,
          role: input.role,
          isSalaryLead: input.isSalaryLead || false,
          loginMethod: "manual",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        });

        // Enviar notificação para Admin e RH
        try {
          await notifyNewUser(input.name, input.email, input.role);
        } catch (error) {
          console.error('[UsersRouter] Failed to send email notification:', error);
        }

        // Buscar o usuário recém-criado
        const newUser = await db.getUserByEmail(input.email);
        
        return {
          success: true,
          userId: newUser?.id || 0,
          message: "Usuário criado com sucesso",
        };
      } catch (error) {
        console.error('[UsersRouter] Failed to create user:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar usuário",
        });
      }
    }),

  /**
   * Atualizar usuário
   */
  update: adminOrRHProcedure
    .input(
      z.object({
        userId: z.number(),
        name: z.string().min(1, "Nome é obrigatório").optional(),
        email: z.string().email("Email inválido").optional(),
        role: z.enum(["admin", "rh", "gestor", "colaborador"]).optional(),
        isSalaryLead: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      // Verificar se usuário existe
      const existingUser = await db.getUserById(input.userId);
      if (!existingUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado",
        });
      }

      // Se email foi alterado, verificar se não existe outro usuário com o mesmo email
      if (input.email && input.email !== existingUser.email) {
        const userWithEmail = await db.getUserByEmail(input.email);
        if (userWithEmail && userWithEmail.id !== input.userId) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Já existe um usuário com este email",
          });
        }
      }

      try {
        const updateData: any = {
          updatedAt: new Date(),
        };

        if (input.name) updateData.name = input.name;
        if (input.email) updateData.email = input.email;
        if (input.role) updateData.role = input.role;
        if (input.isSalaryLead !== undefined) updateData.isSalaryLead = input.isSalaryLead;

        await database.update(users).set(updateData).where(eq(users.id, input.userId));

        // Se o role foi alterado, enviar notificação
        if (input.role && input.role !== existingUser.role) {
          try {
            await notifyNewUser(
              input.name || existingUser.name || "N/A",
              input.email || existingUser.email || "",
              input.role
            );
          } catch (error) {
            console.error('[UsersRouter] Failed to send email notification:', error);
          }
        }

        return {
          success: true,
          message: "Usuário atualizado com sucesso",
        };
      } catch (error) {
        console.error('[UsersRouter] Failed to update user:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao atualizar usuário",
        });
      }
    }),

  /**
   * Deletar usuário
   */
  delete: adminOrRHProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const database = await db.getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      // Não permitir deletar a si mesmo
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Você não pode deletar seu próprio usuário",
        });
      }

      // Verificar se usuário existe
      const existingUser = await db.getUserById(input.userId);
      if (!existingUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado",
        });
      }

      try {
        await database.delete(users).where(eq(users.id, input.userId));

        return {
          success: true,
          message: "Usuário deletado com sucesso",
        };
      } catch (error) {
        console.error('[UsersRouter] Failed to delete user:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao deletar usuário. Pode haver dados vinculados a este usuário.",
        });
      }
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
