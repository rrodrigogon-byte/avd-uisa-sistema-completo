import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  createJobDescriptionWorkflow,
  getWorkflowByJobDescriptionId,
  approveJobDescription,
  rejectJobDescription,
  getWorkflowHistory,
  createBatchApproval,
  processBatchApproval,
  getBatchApprovalsByApprover,
  getPendingJobDescriptionsByLevel,
} from "../jobDescriptionWorkflowHelpers";

/**
 * Router para workflow de aprovação de descrição de cargos (4 níveis)
 */
export const jobDescriptionWorkflowRouter = router({
  /**
   * Cria workflow de aprovação para uma descrição de cargo
   */
  create: protectedProcedure
    .input(
      z.object({
        jobDescriptionId: z.number(),
        csSpecialistId: z.number(),
        directLeaderId: z.number(),
        hrManagerId: z.number(),
        gaiDirectorId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const { jobDescriptionId, ...approvers } = input;

      const workflow = await createJobDescriptionWorkflow(jobDescriptionId, approvers);

      return {
        success: true,
        workflow,
        message: "Workflow de aprovação criado com sucesso",
      };
    }),

  /**
   * Obtém workflow por ID de descrição de cargo
   */
  getByJobDescriptionId: protectedProcedure
    .input(
      z.object({
        jobDescriptionId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const workflow = await getWorkflowByJobDescriptionId(input.jobDescriptionId);

      if (!workflow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workflow não encontrado",
        });
      }

      return workflow;
    }),

  /**
   * Aprova descrição de cargo em um nível específico
   */
  approve: protectedProcedure
    .input(
      z.object({
        workflowId: z.number(),
        level: z.number().min(1).max(4),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { workflowId, level, comments } = input;

      try {
        const workflow = await approveJobDescription(
          workflowId,
          level,
          ctx.user.id,
          ctx.user.name || "Usuário",
          ctx.user.role,
          comments
        );

        return {
          success: true,
          workflow,
          message: `Aprovação de nível ${level} registrada com sucesso`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Erro ao aprovar",
        });
      }
    }),

  /**
   * Rejeita descrição de cargo
   */
  reject: protectedProcedure
    .input(
      z.object({
        workflowId: z.number(),
        level: z.number().min(1).max(4),
        comments: z.string().min(10, "Comentário deve ter pelo menos 10 caracteres"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { workflowId, level, comments } = input;

      try {
        const workflow = await rejectJobDescription(
          workflowId,
          level,
          ctx.user.id,
          ctx.user.name || "Usuário",
          ctx.user.role,
          comments
        );

        return {
          success: true,
          workflow,
          message: "Descrição de cargo rejeitada",
        };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Erro ao rejeitar",
        });
      }
    }),

  /**
   * Obtém histórico de um workflow
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        workflowId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const history = await getWorkflowHistory(input.workflowId);

      return {
        history,
        total: history.length,
      };
    }),

  /**
   * Obtém descrições de cargo pendentes de aprovação para o usuário
   */
  getPendingApprovals: protectedProcedure
    .input(
      z.object({
        level: z.number().min(1).max(4),
      })
    )
    .query(async ({ input, ctx }) => {
      const pending = await getPendingJobDescriptionsByLevel(input.level, ctx.user.id);

      return {
        pending,
        total: pending.length,
      };
    }),

  // ============================================================================
  // APROVAÇÕES EM LOTE
  // ============================================================================

  /**
   * Cria lote de aprovações
   */
  createBatch: protectedProcedure
    .input(
      z.object({
        approvalLevel: z.number().min(1).max(4),
        jobDescriptionIds: z.array(z.number()).min(1, "Selecione pelo menos uma descrição"),
        batchComments: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { approvalLevel, jobDescriptionIds, batchComments } = input;

      const batch = await createBatchApproval(
        ctx.user.id,
        ctx.user.name || "Usuário",
        approvalLevel,
        jobDescriptionIds,
        batchComments
      );

      return {
        success: true,
        batch,
        message: `Lote criado com ${jobDescriptionIds.length} descrições de cargo`,
      };
    }),

  /**
   * Processa lote de aprovações
   */
  processBatch: protectedProcedure
    .input(
      z.object({
        batchId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const batch = await processBatchApproval(
          input.batchId,
          ctx.user.id,
          ctx.user.name || "Usuário",
          ctx.user.role
        );

        return {
          success: true,
          batch,
          message: `Lote processado: ${batch.approvedCount} aprovadas, ${batch.failedCount} falharam`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Erro ao processar lote",
        });
      }
    }),

  /**
   * Lista lotes de aprovação do usuário
   */
  listMyBatches: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
    const batches = await getBatchApprovalsByApprover(ctx.user.id);

    return {
      batches,
      total: batches.length,
    };
  }),

  /**
   * Obtém estatísticas de aprovações pendentes
   */
  getApprovalStats: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
    // Busca pendências em todos os níveis
    const level1 = await getPendingJobDescriptionsByLevel(1, ctx.user.id);
    const level2 = await getPendingJobDescriptionsByLevel(2, ctx.user.id);
    const level3 = await getPendingJobDescriptionsByLevel(3, ctx.user.id);
    const level4 = await getPendingJobDescriptionsByLevel(4, ctx.user.id);

    return {
      byLevel: {
        level1: level1.length,
        level2: level2.length,
        level3: level3.length,
        level4: level4.length,
      },
      total: level1.length + level2.length + level3.length + level4.length,
    };
  }),
});
