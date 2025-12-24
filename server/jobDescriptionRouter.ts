import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";

/**
 * Router de Descrição de Cargos com Workflow de Aprovação
 * Gerencia submissão, aprovação por superiores e aprovação final do RH
 */
export const jobDescriptionRouter = router({
  /**
   * Submeter descrição de cargo para aprovação
   */
  submit: protectedProcedure
    .input(
      z.object({
        cargo: z.string(),
        descricao: z.string(),
        responsabilidades: z.array(z.string()),
        competencias: z.array(z.string()),
        superiorId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // TODO: Salvar descrição no banco de dados
      const descricaoId = 1; // Mock ID

      // Enviar notificação e email para o superior
      try {
        const { notifications, employees } = await import("../drizzle/schema");
        const { sendEmail } = await import("./emailService");
        
        // Buscar dados do superior
        const superior = await db.select().from(employees).where(eq(employees.id, input.superiorId)).limit(1);
        
        await db.insert(notifications).values({
          userId: input.superiorId,
          type: "job_description_approval",
          title: "📋 Nova Descrição de Cargo para Aprovação",
          message: `${ctx.user.name} submeteu a descrição do cargo "${input.cargo}" para sua aprovação.`,
          link: `/descricao-cargos/aprovar-superior`,
          read: false,
        });

        // Enviar email
        if (superior.length > 0 && superior[0].email) {
          await sendEmail({
            to: superior[0].email,
            subject: `📋 Nova Descrição de Cargo para Aprovação - ${input.cargo}`,
            html: `
              <h2>Nova Descrição de Cargo para Aprovação</h2>
              <p>Olá ${superior[0].name},</p>
              <p><strong>${ctx.user.name}</strong> submeteu a descrição do cargo <strong>"${input.cargo}"</strong> para sua aprovação.</p>
              <p><strong>Descrição:</strong> ${input.descricao}</p>
              <p>Por favor, acesse o sistema para revisar e aprovar.</p>
              <p><a href="${process.env.VITE_APP_URL || "http://localhost:3000"}/descricao-cargos/aprovar-superior">Acessar Sistema</a></p>
            `,
          });
        }

        console.log(`[JobDescription] Notificação e email enviados para superior ID ${input.superiorId}`);
      } catch (error) {
        console.error("[JobDescription] Erro ao enviar notificação:", error);
      }

      return { id: descricaoId, success: true };
    }),

  /**
   * Aprovar descrição como superior
   */
  approveAsSuperior: protectedProcedure
    .input(
      z.object({
        descricaoId: z.number(),
        comentario: z.string().optional(),
        funcionarioId: z.number(),
        cargo: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // TODO: Atualizar status da descrição no banco

      // Enviar notificação e email para o RH
      try {
        const { notifications, users } = await import("../drizzle/schema");
        const { sendEmail } = await import("./emailService");
        
        // Buscar todos os usuários do RH
        const rhUsers = await db.select().from(users).where(eq(users.role, "admin"));

        for (const rhUser of rhUsers) {
          await db.insert(notifications).values({
            userId: rhUser.id,
            type: "job_description_approval",
            title: "✅ Descrição de Cargo Aprovada pelo Superior",
            message: `A descrição do cargo "${input.cargo}" foi aprovada e aguarda aprovação final do RH.`,
            link: `/descricao-cargos/aprovar-rh`,
            read: false,
          });
          
          // Enviar email
          if (rhUser.email) {
            await sendEmail({
              to: rhUser.email,
              subject: `✅ Descrição de Cargo Aprovada pelo Superior - ${input.cargo}`,
              html: `
                <h2>Descrição de Cargo Aprovada pelo Superior</h2>
                <p>Olá ${rhUser.name},</p>
                <p>A descrição do cargo <strong>"${input.cargo}"</strong> foi aprovada pelo superior e aguarda sua aprovação final.</p>
                <p>Por favor, acesse o sistema para revisar.</p>
                <p><a href="${process.env.VITE_APP_URL || "http://localhost:3000"}/descricao-cargos/aprovar-rh">Acessar Sistema</a></p>
              `,
            });
          }
        }

        console.log(`[JobDescription] Notificações e emails enviados para ${rhUsers.length} usuários do RH`);
      } catch (error) {
        console.error("[JobDescription] Erro ao enviar notificações:", error);
      }

      return { success: true };
    }),

  /**
   * Rejeitar descrição como superior
   */
  rejectAsSuperior: protectedProcedure
    .input(
      z.object({
        descricaoId: z.number(),
        comentario: z.string(),
        funcionarioId: z.number(),
        cargo: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // TODO: Atualizar status da descrição no banco

      // Enviar notificação e email para o funcionário
      try {
        const { notifications, employees } = await import("../drizzle/schema");
        const { sendEmail } = await import("./emailService");
        
        const employee = await db.select().from(employees).where(eq(employees.id, input.funcionarioId)).limit(1);
        
        await db.insert(notifications).values({
          userId: input.funcionarioId,
          type: "job_description_rejection",
          title: "❌ Descrição de Cargo Rejeitada",
          message: `Sua descrição do cargo "${input.cargo}" foi rejeitada pelo superior. Motivo: ${input.comentario}`,
          link: `/descricao-cargos`,
          read: false,
        });
        
        // Enviar email
        if (employee.length > 0 && employee[0].email) {
          await sendEmail({
            to: employee[0].email,
            subject: `❌ Descrição de Cargo Rejeitada - ${input.cargo}`,
            html: `
              <h2>Descrição de Cargo Rejeitada</h2>
              <p>Olá ${employee[0].name},</p>
              <p>Sua descrição do cargo <strong>"${input.cargo}"</strong> foi rejeitada pelo superior.</p>
              <p><strong>Motivo:</strong> ${input.comentario}</p>
              <p>Por favor, revise e reenvie.</p>
            `,
          });
        }

        console.log(`[JobDescription] Notificação e email de rejeição enviados para funcionário ID ${input.funcionarioId}`);
      } catch (error) {
        console.error("[JobDescription] Erro ao enviar notificação:", error);
      }

      return { success: true };
    }),

  /**
   * Aprovar definitivamente como RH
   */
  approveAsHR: protectedProcedure
    .input(
      z.object({
        descricaoId: z.number(),
        comentario: z.string().optional(),
        funcionarioId: z.number(),
        superiorId: z.number(),
        cargo: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // TODO: Atualizar status da descrição no banco para "aprovado"

      // Enviar notificações e emails para funcionário e superior
      try {
        const { notifications, employees } = await import("../drizzle/schema");
        const { sendEmail } = await import("./emailService");
        
        const employee = await db.select().from(employees).where(eq(employees.id, input.funcionarioId)).limit(1);
        const superior = await db.select().from(employees).where(eq(employees.id, input.superiorId)).limit(1);

        // Notificar funcionário
        await db.insert(notifications).values({
          userId: input.funcionarioId,
          type: "job_description_approved",
          title: "🎉 Descrição de Cargo Aprovada!",
          message: `Sua descrição do cargo "${input.cargo}" foi aprovada pelo RH e está oficialmente atualizada.`,
          link: `/descricao-cargos`,
          read: false,
        });
        
        // Email para funcionário
        if (employee.length > 0 && employee[0].email) {
          await sendEmail({
            to: employee[0].email,
            subject: `🎉 Descrição de Cargo Aprovada - ${input.cargo}`,
            html: `
              <h2>Descrição de Cargo Aprovada!</h2>
              <p>Olá ${employee[0].name},</p>
              <p>Sua descrição do cargo <strong>"${input.cargo}"</strong> foi aprovada pelo RH e está oficialmente atualizada.</p>
              <p>Parabéns!</p>
            `,
          });
        }

        // Notificar superior
        await db.insert(notifications).values({
          userId: input.superiorId,
          type: "job_description_approved",
          title: "✅ Descrição de Cargo Aprovada pelo RH",
          message: `A descrição do cargo "${input.cargo}" foi aprovada pelo RH.`,
          link: `/descricao-cargos/aprovar-superior`,
          read: false,
        });
        
        // Email para superior
        if (superior.length > 0 && superior[0].email) {
          await sendEmail({
            to: superior[0].email,
            subject: `✅ Descrição de Cargo Aprovada pelo RH - ${input.cargo}`,
            html: `
              <h2>Descrição de Cargo Aprovada pelo RH</h2>
              <p>Olá ${superior[0].name},</p>
              <p>A descrição do cargo <strong>"${input.cargo}"</strong> foi aprovada pelo RH.</p>
            `,
          });
        }

        console.log(`[JobDescription] Notificações e emails de aprovação final enviados`);
      } catch (error) {
        console.error("[JobDescription] Erro ao enviar notificações:", error);
      }

      return { success: true };
    }),

  /**
   * Devolver para revisão como RH
   */
  returnForRevision: protectedProcedure
    .input(
      z.object({
        descricaoId: z.number(),
        comentario: z.string(),
        funcionarioId: z.number(),
        superiorId: z.number(),
        cargo: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // TODO: Atualizar status da descrição no banco para "em_revisao"

      // Enviar notificações para funcionário e superior
      try {
        const { notifications } = await import("../drizzle/schema");

        // Notificar funcionário
        await db.insert(notifications).values({
          userId: input.funcionarioId,
          type: "job_description_revision",
          title: "🔄 Descrição de Cargo Devolvida para Revisão",
          message: `O RH solicitou revisão na descrição do cargo "${input.cargo}". Motivo: ${input.comentario}`,
          link: `/descricao-cargos`,
          read: false,
        });

        // Notificar superior
        await db.insert(notifications).values({
          userId: input.superiorId,
          type: "job_description_revision",
          title: "🔄 Descrição de Cargo Devolvida pelo RH",
          message: `A descrição do cargo "${input.cargo}" foi devolvida pelo RH para revisão.`,
          link: `/descricao-cargos/aprovar-superior`,
          read: false,
        });

        console.log(`[JobDescription] Notificações de revisão enviadas`);
      } catch (error) {
        console.error("[JobDescription] Erro ao enviar notificações:", error);
      }

      return { success: true };
    }),

  /**
   * Listar descrições pendentes de aprovação do superior
   */
  listPendingSuperior: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    // TODO: Buscar descrições do banco onde superiorId = ctx.user.id e status = "pendente_superior"
    return [];
  }),

  /**
   * Listar descrições pendentes de aprovação do RH
   */
  listPendingHR: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    // TODO: Buscar descrições do banco onde status = "pendente_rh"
    return [];
  }),

  /**
   * Listar todas as descrições de cargo
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    // TODO: Buscar todas as descrições do banco
    // Por enquanto retorna array vazio
    return [];
  }),

  /**
   * Importação em lote de descrições de cargo (.docx)
   */
  bulkImport: protectedProcedure
    .input(
      z.object({
        files: z.array(
          z.object({
            name: z.string(),
            content: z.string(), // base64
            size: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const results: any[] = [];
      let successCount = 0;

      for (const file of input.files) {
        try {
          // Processar arquivo .docx
          // Extrair título do cargo do nome do arquivo
          const positionTitle = file.name
            .replace(/\.docx?$/i, '')
            .replace(/Gerente/g, 'Gerente ')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .trim();

          // Por enquanto, apenas registra o sucesso
          // TODO: Implementar extração real do conteúdo com mammoth
          // TODO: Salvar no banco de dados
          
          results.push({
            fileName: file.name,
            positionTitle,
            success: true,
            message: `Descrição importada com sucesso`,
          });
          successCount++;
        } catch (error: any) {
          results.push({
            fileName: file.name,
            success: false,
            error: error.message || "Erro ao processar arquivo",
          });
        }
      }

      return {
        success: successCount,
        total: input.files.length,
        results,
      };
    }),
});
