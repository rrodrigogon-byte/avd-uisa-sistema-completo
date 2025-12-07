import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { notifyNewUser } from "../adminRhEmailService";
import { sendEmail } from "../_core/email";
import { ENV } from "../_core/env";

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
   * Enviar credenciais de acesso por email
   */
  sendCredentials: adminOrRHProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const user = await db.getUserById(input.userId);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado",
        });
      }

      if (!user.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Usuário não possui email cadastrado",
        });
      }

      const loginUrl = ENV.viteOauthPortalUrl || "https://avduisa-sys-vd5bj8to.manus.space";

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .info-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Bem-vindo ao Sistema AVD UISA</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${user.name || "Usuário"}</strong>,</p>
              
              <p>Suas credenciais de acesso ao Sistema AVD UISA foram configuradas com sucesso!</p>
              
              <div class="info-box">
                <p><strong>📧 Email:</strong> ${user.email}</p>
                <p><strong>👤 Perfil:</strong> ${user.role === "admin" ? "Administrador" : user.role === "rh" ? "RH" : user.role === "gestor" ? "Gestor" : "Colaborador"}</p>
              </div>
              
              <p>Para acessar o sistema, clique no botão abaixo:</p>
              
              <div style="text-align: center;">
                <a href="${loginUrl}" class="button">Acessar Sistema</a>
              </div>
              
              <p><strong>Instruções de acesso:</strong></p>
              <ol>
                <li>Clique no botão "Acessar Sistema" acima</li>
                <li>Faça login com sua conta institucional</li>
                <li>Você será redirecionado automaticamente para o dashboard</li>
              </ol>
              
              <p>Se tiver qualquer dúvida, entre em contato com o departamento de RH.</p>
              
              <p>Atenciosamente,<br><strong>Equipe AVD UISA</strong></p>
            </div>
            <div class="footer">
              <p>Este é um email automático. Por favor, não responda.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await sendEmail({
        to: user.email,
        subject: "🎉 Suas credenciais de acesso ao Sistema AVD UISA",
        html: emailHtml,
      });

      return { success: true };
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
        password: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Verificar se já existe usuário com este email
      const existingUser = await db.getUserByEmail(input.email);
      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Já existe um usuário cadastrado com este email",
        });
      }

      // Gerar senha aleatória se não fornecida
      const password = input.password || Math.random().toString(36).slice(-8);

      // Criar usuário
      const newUser = await db.createUser({
        name: input.name,
        email: input.email,
        role: input.role,
      });

      // Enviar email com credenciais
      const loginUrl = ENV.viteOauthPortalUrl || "https://avduisa-sys-vd5bj8to.manus.space";

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .info-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Bem-vindo ao Sistema AVD UISA</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${input.name}</strong>,</p>
              
              <p>Sua conta no Sistema AVD UISA foi criada com sucesso!</p>
              
              <div class="info-box">
                <p><strong>📧 Email:</strong> ${input.email}</p>
                <p><strong>👤 Perfil:</strong> ${input.role === "admin" ? "Administrador" : input.role === "rh" ? "RH" : input.role === "gestor" ? "Gestor" : "Colaborador"}</p>
              </div>
              
              <p>Para acessar o sistema, clique no botão abaixo:</p>
              
              <div style="text-align: center;">
                <a href="${loginUrl}" class="button">Acessar Sistema</a>
              </div>
              
              <p><strong>Instruções de acesso:</strong></p>
              <ol>
                <li>Clique no botão "Acessar Sistema" acima</li>
                <li>Faça login com sua conta institucional (${input.email})</li>
                <li>Você será redirecionado automaticamente para o dashboard</li>
              </ol>
              
              <p>Se tiver qualquer dúvida, entre em contato com o departamento de RH.</p>
              
              <p>Atenciosamente,<br><strong>Equipe AVD UISA</strong></p>
            </div>
            <div class="footer">
              <p>Este é um email automático. Por favor, não responda.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        await sendEmail({
          to: input.email,
          subject: "🎉 Bem-vindo ao Sistema AVD UISA - Suas Credenciais de Acesso",
          html: emailHtml,
        });
      } catch (error) {
        console.error('[UsersRouter] Failed to send welcome email:', error);
        // Não falhar a criação se o email falhar
      }

      // Notificar admins e RH
      try {
        await notifyNewUser(input.name, input.email, input.role);
      } catch (error) {
        console.error('[UsersRouter] Failed to notify admins:', error);
      }

      return { success: true, userId: newUser.id };
    }),

  /**
   * Atualizar dados do usuário
   */
  update: adminOrRHProcedure
    .input(
      z.object({
        userId: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        role: z.enum(["admin", "rh", "gestor", "colaborador"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const user = await db.getUserById(input.userId);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado",
        });
      }

      await db.updateUser(input.userId, {
        name: input.name,
        email: input.email,
        role: input.role,
      });

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
