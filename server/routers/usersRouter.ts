import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { notifyNewUser } from "../adminRhEmailService";
import { users, employees } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "../emailService";
import { sendCredentialsEmail, sendWelcomeEmail } from "../_core/email";
import bcrypt from "bcryptjs";

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

        // Enviar email de boas-vindas para o novo usuário
        try {
          await sendWelcomeEmail(input.email, input.name);
        } catch (error) {
          console.error('[UsersRouter] Failed to send welcome email:', error);
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
   * Enviar credenciais individuais por e-mail
   */
  sendIndividualCredentials: adminOrRHProcedure
    .input(
      z.object({
        userId: z.number(),
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

      try {
        // Buscar usuário
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
            message: "Usuário não possui e-mail cadastrado",
          });
        }

        // Buscar employee vinculado ao usuário
        let employee = await database
          .select()
          .from(employees)
          .where(eq(employees.userId, user.id))
          .limit(1);

        // Se não encontrou por userId, tentar buscar por email
        if (!employee || employee.length === 0) {
          employee = await database
            .select()
            .from(employees)
            .where(eq(employees.email, user.email!))
            .limit(1);

          // Se encontrou por email, criar vinculação
          if (employee && employee.length > 0) {
            await database
              .update(employees)
              .set({ userId: user.id })
              .where(eq(employees.id, employee[0].id));
            
            console.log(`[UsersRouter] Vinculação criada: userId ${user.id} -> employeeId ${employee[0].id}`);
          }
        }

        if (!employee || employee.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Funcionário vinculado não encontrado. Verifique se existe um funcionário cadastrado com o email ${user.email}`,
          });
        }

        const employeeData = employee[0];

        // Gerar senha temporária (16 caracteres aleatórios)
        const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        // Atualizar senha no banco
        await database
          .update(employees)
          .set({ passwordHash })
          .where(eq(employees.id, employeeData.id));

        // Enviar e-mail com credenciais
        await sendEmail({
          to: user.email,
          subject: "Credenciais de Acesso - Sistema AVD UISA",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
                .credential-item { margin: 10px 0; }
                .credential-label { font-weight: bold; color: #667eea; }
                .credential-value { font-family: 'Courier New', monospace; background: #f0f0f0; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 5px; }
                .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🔐 Credenciais de Acesso</h1>
                  <p>Sistema AVD UISA - Avaliação de Desempenho</p>
                </div>
                <div class="content">
                  <p>Olá <strong>${user.name}</strong>,</p>
                  <p>Suas credenciais de acesso ao Sistema AVD UISA foram geradas com sucesso:</p>
                  
                  <div class="credentials">
                    <div class="credential-item">
                      <div class="credential-label">👤 Usuário:</div>
                      <div class="credential-value">${employee.employeeCode}</div>
                    </div>
                    <div class="credential-item">
                      <div class="credential-label">🔑 Senha Temporária:</div>
                      <div class="credential-value">${tempPassword}</div>
                    </div>
                  </div>

                  <div class="warning">
                    <strong>⚠️ Importante:</strong>
                    <ul>
                      <li>Esta é uma senha temporária gerada automaticamente</li>
                      <li>Recomendamos que você altere sua senha no primeiro acesso</li>
                      <li>Não compartilhe suas credenciais com outras pessoas</li>
                      <li>Guarde esta senha em local seguro</li>
                    </ul>
                  </div>

                  <p>Para acessar o sistema, utilize o código de funcionário como usuário e a senha temporária fornecida acima.</p>
                  
                  <p>Em caso de dúvidas, entre em contato com o departamento de RH.</p>
                </div>
                <div class="footer">
                  <p>Este é um e-mail automático. Por favor, não responda.</p>
                  <p>&copy; ${new Date().getFullYear()} UISA - Todos os direitos reservados</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        return {
          success: true,
          message: `Credenciais enviadas com sucesso para ${user.email}`,
        };
      } catch (error) {
        console.error("[UsersRouter] Erro ao enviar credenciais:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao enviar credenciais",
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

  /**
   * Enviar credenciais por email
   * Gera username e senha e envia ambos por email
   */
  sendCredentials: adminOrRHProcedure
    .input(
      z.object({
        userId: z.number(),
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

      // Buscar usuário
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

      // Gerar username (primeira parte do email)
      const username = user.email.split('@')[0];

      // Gerar senha aleatória segura (8 caracteres: letras maiúsculas, minúsculas e números)
      const generatePassword = () => {
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const all = uppercase + lowercase + numbers;
        
        let password = '';
        // Garantir pelo menos 1 maiúscula, 1 minúscula e 1 número
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        
        // Completar com caracteres aleatórios
        for (let i = 0; i < 5; i++) {
          password += all[Math.floor(Math.random() * all.length)];
        }
        
        // Embaralhar
        return password.split('').sort(() => Math.random() - 0.5).join('');
      };

      const password = generatePassword();

      // Hash da senha para armazenar no banco (se necessário)
      const passwordHash = await bcrypt.hash(password, 10);

      // Atualizar usuário com passwordHash se houver campo
      // (Nota: o schema atual de users não tem passwordHash, mas employees tem)
      // Se precisar armazenar, adicionar campo no schema

      try {
        // Enviar email com username E senha
        const emailSent = await sendCredentialsEmail(
          user.email,
          user.name || 'Usuário',
          username,
          password
        );

        if (!emailSent) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Falha ao enviar email. Verifique a configuração SMTP.",
          });
        }

        return {
          success: true,
          message: `Credenciais enviadas com sucesso para ${user.email}`,
          username,
          // NÃO retornar a senha na resposta por segurança
        };
      } catch (error) {
        console.error('[UsersRouter] Failed to send credentials email:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao enviar credenciais por email",
        });
      }
    }),
});
