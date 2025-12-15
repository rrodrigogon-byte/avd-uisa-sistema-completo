import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";

/**
 * Router para aprovações de descrições de cargo
 * Gerencia o fluxo de aprovação individual e em lote
 */
export const jobDescriptionsApprovalsRouter = router({
  /**
   * Listar descrições de cargo com filtros
   */
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["rascunho", "pendente_aprovacao", "aprovado", "rejeitado", "arquivado"]).optional(),
        level: z.enum(["operacional", "tatico", "estrategico"]).optional(),
        department: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return await db.listJobDescriptions(input);
    }),

  /**
   * Buscar descrição de cargo por ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getJobDescriptionById(input.id);
    }),

  /**
   * Criar nova descrição de cargo
   */
  create: protectedProcedure
    .input(
      z.object({
        code: z.string().min(1),
        title: z.string().min(1),
        department: z.string().min(1),
        level: z.enum(["operacional", "tatico", "estrategico"]),
        summary: z.string().optional(),
        responsibilities: z.string().optional(),
        requirements: z.string().optional(),
        competencies: z.string().optional(),
        educationLevel: z.string().optional(),
        experienceYears: z.number().optional(),
        technicalSkills: z.string().optional(),
        behavioralSkills: z.string().optional(),
        workConditions: z.string().optional(),
        benefits: z.string().optional(),
        salaryRange: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const id = await db.createJobDescription({
        ...input,
        status: "rascunho",
        createdBy: ctx.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return { id, success: true };
    }),

  /**
   * Atualizar descrição de cargo
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        code: z.string().min(1).optional(),
        title: z.string().min(1).optional(),
        department: z.string().min(1).optional(),
        level: z.enum(["operacional", "tatico", "estrategico"]).optional(),
        summary: z.string().optional(),
        responsibilities: z.string().optional(),
        requirements: z.string().optional(),
        competencies: z.string().optional(),
        educationLevel: z.string().optional(),
        experienceYears: z.number().optional(),
        technicalSkills: z.string().optional(),
        behavioralSkills: z.string().optional(),
        workConditions: z.string().optional(),
        benefits: z.string().optional(),
        salaryRange: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      await db.updateJobDescription(id, updateData);
      return { success: true };
    }),

  /**
   * Deletar descrição de cargo
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteJobDescription(input.id);
      return { success: true };
    }),

  /**
   * Solicitar aprovação de descrição de cargo
   */
  requestApproval: protectedProcedure
    .input(
      z.object({
        jobDescriptionId: z.number(),
        approverId: z.number(),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Atualizar status para pendente_aprovacao
      await db.updateJobDescriptionStatus(input.jobDescriptionId, "pendente_aprovacao");

      // Criar registro de aprovação
      const approvalId = await db.createJobApproval({
        jobDescriptionId: input.jobDescriptionId,
        approverId: input.approverId,
        status: "pendente",
        comments: input.comments,
        requestedAt: new Date(),
      });

      return { approvalId, success: true };
    }),

  /**
   * Aprovar descrição de cargo
   */
  approve: protectedProcedure
    .input(
      z.object({
        jobDescriptionId: z.number(),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Atualizar status da descrição
      await db.updateJobDescriptionStatus(input.jobDescriptionId, "aprovado", ctx.user.id);

      // Criar registro de aprovação
      await db.createJobApproval({
        jobDescriptionId: input.jobDescriptionId,
        approverId: ctx.user.id,
        status: "aprovado",
        comments: input.comments,
        approvedAt: new Date(),
      });

      return { success: true };
    }),

  /**
   * Rejeitar descrição de cargo
   */
  reject: protectedProcedure
    .input(
      z.object({
        jobDescriptionId: z.number(),
        comments: z.string().min(1, "Comentário é obrigatório para rejeição"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Atualizar status da descrição
      await db.updateJobDescriptionStatus(input.jobDescriptionId, "rejeitado");

      // Criar registro de aprovação
      await db.createJobApproval({
        jobDescriptionId: input.jobDescriptionId,
        approverId: ctx.user.id,
        status: "rejeitado",
        comments: input.comments,
        approvedAt: new Date(),
      });

      return { success: true };
    }),

  /**
   * Aprovar múltiplas descrições em lote
   */
  bulkApprove: protectedProcedure
    .input(
      z.object({
        jobDescriptionIds: z.array(z.number()).min(1),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const results = await db.bulkApproveJobDescriptions(
        input.jobDescriptionIds,
        ctx.user.id,
        input.comments
      );

      return {
        success: true,
        approved: results.length,
        results,
      };
    }),

  /**
   * Listar aprovações pendentes
   */
  listPendingApprovals: protectedProcedure
    .input(z.object({ approverId: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      const approverId = input.approverId || ctx.user.id;
      return await db.listPendingJobApprovals(approverId);
    }),

  /**
   * Atualizar status de aprovação
   */
  updateApprovalStatus: protectedProcedure
    .input(
      z.object({
        approvalId: z.number(),
        status: z.enum(["aprovado", "rejeitado"]),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await db.updateJobApprovalStatus(input.approvalId, input.status, input.comments);
      return { success: true };
    }),
});
