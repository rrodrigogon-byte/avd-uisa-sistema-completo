import { z } from "zod";
import { router, adminProcedure, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { jobDescriptions, jobApprovals, employees, notifications } from "../drizzle/schema";
import { eq, and, or, desc, inArray, sql } from "drizzle-orm";
import { sendEmail } from "./emailService";

/**
 * Router de Aprovação em Lote de Descrições de Cargo
 * 
 * Funcionalidades:
 * - Aprovação/rejeição em lote pelo líder
 * - Painel de aprovações pendentes
 * - Notificações automáticas
 * - Histórico de versões
 * - Comentários e feedback
 */

export const jobDescriptionBatchApprovalRouter = router({
  /**
   * Listar descrições pendentes de aprovação para o líder
   */
  getPendingApprovals: protectedProcedure
    .input(z.object({
      status: z.enum(["pendente", "aprovado", "rejeitado"]).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar funcionário vinculado ao usuário
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, ctx.user.id))
        .limit(1);

      if (!employee) {
        return [];
      }

      // Buscar descrições de cargos dos subordinados diretos
      const conditions = [eq(jobDescriptions.managerId, employee.id)];
      
      if (input?.status) {
        conditions.push(eq(jobDescriptions.approvalStatus, input.status));
      } else {
        conditions.push(eq(jobDescriptions.approvalStatus, "pendente"));
      }

      const descriptions = await db
        .select({
          id: jobDescriptions.id,
          employeeId: jobDescriptions.employeeId,
          positionId: jobDescriptions.positionId,
          title: jobDescriptions.title,
          description: jobDescriptions.description,
          responsibilities: jobDescriptions.responsibilities,
          requirements: jobDescriptions.requirements,
          competencies: jobDescriptions.competencies,
          approvalStatus: jobDescriptions.approvalStatus,
          submittedAt: jobDescriptions.submittedAt,
          version: jobDescriptions.version,
          employeeName: employees.name,
          employeeEmail: employees.email,
        })
        .from(jobDescriptions)
        .leftJoin(employees, eq(jobDescriptions.employeeId, employees.id))
        .where(and(...conditions))
        .orderBy(desc(jobDescriptions.submittedAt));

      return descriptions;
    }),

  /**
   * Aprovar descrições em lote
   */
  batchApprove: protectedProcedure
    .input(
      z.object({
        descriptionIds: z.array(z.number()),
        comment: z.string().optional(),
        notifyEmployees: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (const descId of input.descriptionIds) {
        try {
          // Buscar descrição
          const [description] = await db
            .select()
            .from(jobDescriptions)
            .where(eq(jobDescriptions.id, descId))
            .limit(1);

          if (!description) {
            results.failed++;
            results.errors.push(`Descrição ${descId} não encontrada`);
            continue;
          }

          // Atualizar status
          await db
            .update(jobDescriptions)
            .set({
              approvalStatus: "aprovado",
              approvedBy: ctx.user.id,
              approvedAt: new Date(),
            })
            .where(eq(jobDescriptions.id, descId));

          // Registrar aprovação
          await db.insert(jobApprovals).values({
            jobDescriptionId: descId,
            approverId: ctx.user.id,
            approverName: ctx.user.name || "Sistema",
            action: "aprovado",
            comment: input.comment || "Aprovação em lote",
            approvedAt: new Date(),
          });

          // Notificar funcionário
          if (input.notifyEmployees && description.employeeId) {
            await db.insert(notifications).values({
              userId: description.employeeId,
              type: "job_description_approved",
              title: "✅ Descrição de Cargo Aprovada",
              message: `Sua descrição de cargo "${description.title}" foi aprovada pelo líder.`,
              link: `/descricoes-cargo/${descId}`,
              read: false,
            });

            // Enviar email
            const [employee] = await db
              .select()
              .from(employees)
              .where(eq(employees.id, description.employeeId))
              .limit(1);

            if (employee && employee.email) {
              await sendEmail({
                to: employee.email,
                subject: `✅ Descrição de Cargo Aprovada - ${description.title}`,
                html: `
                  <h2>Descrição de Cargo Aprovada</h2>
                  <p>Olá ${employee.name},</p>
                  <p>Sua descrição de cargo <strong>"${description.title}"</strong> foi aprovada por ${ctx.user.name}.</p>
                  ${input.comment ? `<p><strong>Comentário:</strong> ${input.comment}</p>` : ""}
                  <p>Acesse o sistema para visualizar os detalhes.</p>
                `,
              });
            }
          }

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Erro ao aprovar descrição ${descId}: ${error}`);
        }
      }

      return results;
    }),

  /**
   * Rejeitar descrições em lote
   */
  batchReject: protectedProcedure
    .input(
      z.object({
        descriptionIds: z.array(z.number()),
        reason: z.string(),
        notifyEmployees: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      if (!input.reason || input.reason.trim().length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Motivo da rejeição é obrigatório" });
      }

      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (const descId of input.descriptionIds) {
        try {
          // Buscar descrição
          const [description] = await db
            .select()
            .from(jobDescriptions)
            .where(eq(jobDescriptions.id, descId))
            .limit(1);

          if (!description) {
            results.failed++;
            results.errors.push(`Descrição ${descId} não encontrada`);
            continue;
          }

          // Atualizar status
          await db
            .update(jobDescriptions)
            .set({
              approvalStatus: "rejeitado",
              rejectedBy: ctx.user.id,
              rejectedAt: new Date(),
              rejectionReason: input.reason,
            })
            .where(eq(jobDescriptions.id, descId));

          // Registrar rejeição
          await db.insert(jobApprovals).values({
            jobDescriptionId: descId,
            approverId: ctx.user.id,
            approverName: ctx.user.name || "Sistema",
            action: "rejeitado",
            comment: input.reason,
            approvedAt: new Date(),
          });

          // Notificar funcionário
          if (input.notifyEmployees && description.employeeId) {
            await db.insert(notifications).values({
              userId: description.employeeId,
              type: "job_description_rejected",
              title: "❌ Descrição de Cargo Rejeitada",
              message: `Sua descrição de cargo "${description.title}" foi rejeitada. Motivo: ${input.reason}`,
              link: `/descricoes-cargo/${descId}`,
              read: false,
            });

            // Enviar email
            const [employee] = await db
              .select()
              .from(employees)
              .where(eq(employees.id, description.employeeId))
              .limit(1);

            if (employee && employee.email) {
              await sendEmail({
                to: employee.email,
                subject: `❌ Descrição de Cargo Rejeitada - ${description.title}`,
                html: `
                  <h2>Descrição de Cargo Rejeitada</h2>
                  <p>Olá ${employee.name},</p>
                  <p>Sua descrição de cargo <strong>"${description.title}"</strong> foi rejeitada por ${ctx.user.name}.</p>
                  <p><strong>Motivo:</strong> ${input.reason}</p>
                  <p>Por favor, revise e reenvie a descrição.</p>
                `,
              });
            }
          }

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Erro ao rejeitar descrição ${descId}: ${error}`);
        }
      }

      return results;
    }),

  /**
   * Solicitar revisão em lote
   */
  batchRequestRevision: protectedProcedure
    .input(
      z.object({
        descriptionIds: z.array(z.number()),
        feedback: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (const descId of input.descriptionIds) {
        try {
          const [description] = await db
            .select()
            .from(jobDescriptions)
            .where(eq(jobDescriptions.id, descId))
            .limit(1);

          if (!description) {
            results.failed++;
            results.errors.push(`Descrição ${descId} não encontrada`);
            continue;
          }

          // Atualizar status para revisão
          await db
            .update(jobDescriptions)
            .set({
              approvalStatus: "em_revisao",
              revisionFeedback: input.feedback,
            })
            .where(eq(jobDescriptions.id, descId));

          // Registrar solicitação de revisão
          await db.insert(jobApprovals).values({
            jobDescriptionId: descId,
            approverId: ctx.user.id,
            approverName: ctx.user.name || "Sistema",
            action: "revisao_solicitada",
            comment: input.feedback,
            approvedAt: new Date(),
          });

          // Notificar funcionário
          if (description.employeeId) {
            await db.insert(notifications).values({
              userId: description.employeeId,
              type: "job_description_revision",
              title: "🔄 Revisão Solicitada na Descrição de Cargo",
              message: `Seu líder solicitou revisão na descrição "${description.title}". Feedback: ${input.feedback}`,
              link: `/descricoes-cargo/${descId}`,
              read: false,
            });

            const [employee] = await db
              .select()
              .from(employees)
              .where(eq(employees.id, description.employeeId))
              .limit(1);

            if (employee && employee.email) {
              await sendEmail({
                to: employee.email,
                subject: `🔄 Revisão Solicitada - ${description.title}`,
                html: `
                  <h2>Revisão Solicitada na Descrição de Cargo</h2>
                  <p>Olá ${employee.name},</p>
                  <p>Seu líder ${ctx.user.name} solicitou revisão na descrição de cargo <strong>"${description.title}"</strong>.</p>
                  <p><strong>Feedback:</strong> ${input.feedback}</p>
                  <p>Por favor, revise e reenvie a descrição.</p>
                `,
              });
            }
          }

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Erro ao solicitar revisão ${descId}: ${error}`);
        }
      }

      return results;
    }),

  /**
   * Obter histórico de aprovações de uma descrição
   */
  getApprovalHistory: protectedProcedure
    .input(z.object({ descriptionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const history = await db
        .select()
        .from(jobApprovals)
        .where(eq(jobApprovals.jobDescriptionId, input.descriptionId))
        .orderBy(desc(jobApprovals.approvedAt));

      return history;
    }),

  /**
   * Obter estatísticas de aprovações pendentes
   */
  getApprovalStats: protectedProcedure
    .input(z.object({}))
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar funcionário vinculado ao usuário
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, ctx.user.id))
        .limit(1);

      if (!employee) {
        return {
          pendente: 0,
          aprovado: 0,
          rejeitado: 0,
          em_revisao: 0,
          total: 0,
        };
      }

      // Contar por status
      const stats = await db
        .select({
          status: jobDescriptions.approvalStatus,
          count: sql<number>`COUNT(*)`,
        })
        .from(jobDescriptions)
        .where(eq(jobDescriptions.managerId, employee.id))
        .groupBy(jobDescriptions.approvalStatus);

      const result = {
        pendente: 0,
        aprovado: 0,
        rejeitado: 0,
        em_revisao: 0,
        total: 0,
      };

      stats.forEach((stat) => {
        const count = Number(stat.count);
        result[stat.status as keyof typeof result] = count;
        result.total += count;
      });

      return result;
    }),

  /**
   * Adicionar comentário em uma descrição
   */
  addComment: protectedProcedure
    .input(
      z.object({
        descriptionId: z.number(),
        comment: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.insert(jobApprovals).values({
        jobDescriptionId: input.descriptionId,
        approverId: ctx.user.id,
        approverName: ctx.user.name || "Sistema",
        action: "comentario",
        comment: input.comment,
        approvedAt: new Date(),
      });

      return { success: true };
    }),
});
