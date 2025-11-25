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

      // Enviar notificação para o superior
      try {
        const { notifications } = await import("../drizzle/schema");
        await db.insert(notifications).values({
          userId: input.superiorId,
          type: "job_description_approval",
          title: "📋 Nova Descrição de Cargo para Aprovação",
          message: `${ctx.user.name} submeteu a descrição do cargo "${input.cargo}" para sua aprovação.`,
          link: `/descricao-cargos/aprovar-superior`,
          read: false,
        });

        console.log(`[JobDescription] Notificação enviada para superior ID ${input.superiorId}`);
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

      // Enviar notificação para o RH (todos os usuários com role 'admin')
      try {
        const { notifications, users } = await import("../drizzle/schema");
        
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
        }

        console.log(`[JobDescription] Notificações enviadas para ${rhUsers.length} usuários do RH`);
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

      // Enviar notificação para o funcionário
      try {
        const { notifications } = await import("../drizzle/schema");
        await db.insert(notifications).values({
          userId: input.funcionarioId,
          type: "job_description_rejection",
          title: "❌ Descrição de Cargo Rejeitada",
          message: `Sua descrição do cargo "${input.cargo}" foi rejeitada pelo superior. Motivo: ${input.comentario}`,
          link: `/descricao-cargos`,
          read: false,
        });

        console.log(`[JobDescription] Notificação de rejeição enviada para funcionário ID ${input.funcionarioId}`);
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

      // Enviar notificações para funcionário e superior
      try {
        const { notifications } = await import("../drizzle/schema");

        // Notificar funcionário
        await db.insert(notifications).values({
          userId: input.funcionarioId,
          type: "job_description_approved",
          title: "🎉 Descrição de Cargo Aprovada!",
          message: `Sua descrição do cargo "${input.cargo}" foi aprovada pelo RH e está oficialmente atualizada.`,
          link: `/descricao-cargos`,
          read: false,
        });

        // Notificar superior
        await db.insert(notifications).values({
          userId: input.superiorId,
          type: "job_description_approved",
          title: "✅ Descrição de Cargo Aprovada pelo RH",
          message: `A descrição do cargo "${input.cargo}" foi aprovada pelo RH.`,
          link: `/descricao-cargos/aprovar-superior`,
          read: false,
        });

        console.log(`[JobDescription] Notificações de aprovação final enviadas`);
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
});
