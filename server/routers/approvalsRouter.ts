import { z } from "zod";
import { protectedProcedure, router, adminProcedure } from "../_core/trpc";
import {
  createApprovalFlowConfig,
  listApprovalFlowConfigs,
  getApprovalFlowConfigById,
  updateApprovalFlowConfig,
  createApprovalInstance,
  listApprovalInstances,
  getApprovalInstanceById,
  updateApprovalInstance,
  createApprovalAction,
  getApprovalActionsByInstance,
  createApprovalNotification,
} from "../db";

/**
 * Router para sistema de aprovações flexível
 * Gerencia fluxos de aprovação configuráveis
 */
export const approvalsRouter = router({
  // ============================================================================
  // CONFIGURAÇÃO DE FLUXOS
  // ============================================================================

  /**
   * Criar configuração de fluxo de aprovação
   */
  createFlowConfig: adminProcedure
    .input(
      z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        description: z.string().optional(),
        processType: z.enum([
          "job_description",
          "performance_review",
          "salary_adjustment",
          "promotion",
          "bonus_approval",
          "pdi_approval",
          "hiring",
          "termination",
          "transfer",
          "custom",
        ]),
        scope: z.enum(["global", "department", "position", "level"]).default("global"),
        departmentId: z.number().optional(),
        positionId: z.number().optional(),
        hierarchyLevel: z.string().optional(),
        approvalLevels: z.array(
          z.object({
            level: z.number(),
            name: z.string(),
            description: z.string().optional(),
            roleRequired: z.string().optional(),
            specificApproverId: z.number().optional(),
            autoApprove: z.boolean().optional(),
            requiredAll: z.boolean().optional(),
            timeoutDays: z.number().optional(),
          })
        ),
        allowParallelApproval: z.boolean().default(false),
        allowSkipLevels: z.boolean().default(false),
        requireComments: z.boolean().default(false),
        notifyOnEachLevel: z.boolean().default(true),
        isDefault: z.boolean().default(false),
        priority: z.number().default(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const flowConfigId = await createApprovalFlowConfig({
        ...input,
        createdBy: ctx.user.id,
      });

      return {
        success: true,
        flowConfigId,
        message: "Fluxo de aprovação criado com sucesso",
      };
    }),

  /**
   * Listar configurações de fluxo
   */
  listFlowConfigs: protectedProcedure
    .input(
      z.object({
        processType: z.string().optional(),
        scope: z.string().optional(),
        active: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ input = {} }) => {
      return await listApprovalFlowConfigs(input);
    }),

  /**
   * Buscar configuração de fluxo por ID
   */
  getFlowConfigById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await getApprovalFlowConfigById(input.id);
    }),

  /**
   * Atualizar configuração de fluxo
   */
  updateFlowConfig: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        approvalLevels: z.array(z.any()).optional(),
        active: z.boolean().optional(),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateApprovalFlowConfig(id, data);

      return {
        success: true,
        message: "Fluxo de aprovação atualizado com sucesso",
      };
    }),

  // ============================================================================
  // INSTÂNCIAS DE APROVAÇÃO
  // ============================================================================

  /**
   * Criar instância de aprovação
   */
  createInstance: protectedProcedure
    .input(
      z.object({
        flowConfigId: z.number(),
        processType: z.string(),
        processId: z.number(),
        processTitle: z.string().optional(),
        processData: z.any().optional(),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const instanceId = await createApprovalInstance({
        ...input,
        requesterId: ctx.user.id,
        requesterName: ctx.user.name || undefined,
        status: "draft",
        currentLevel: 1,
      });

      return {
        success: true,
        instanceId,
        message: "Instância de aprovação criada com sucesso",
      };
    }),

  /**
   * Submeter instância para aprovação
   */
  submitInstance: protectedProcedure
    .input(z.object({ instanceId: z.number() }))
    .mutation(async ({ input }) => {
      await updateApprovalInstance(input.instanceId, {
        status: "pending",
        submittedAt: new Date(),
      });

      // TODO: Criar notificações para aprovadores do nível 1

      return {
        success: true,
        message: "Instância submetida para aprovação",
      };
    }),

  /**
   * Listar instâncias de aprovação
   */
  listInstances: protectedProcedure
    .input(
      z.object({
        processType: z.string().optional(),
        status: z.string().optional(),
        requesterId: z.number().optional(),
      }).optional()
    )
    .query(async ({ input = {} }) => {
      return await listApprovalInstances(input);
    }),

  /**
   * Buscar instância por ID
   */
  getInstanceById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await getApprovalInstanceById(input.id);
    }),

  /**
   * Minhas aprovações pendentes
   */
  myPendingApprovals: protectedProcedure
    .query(async ({ ctx }) => {
      // TODO: Implementar lógica para buscar aprovações pendentes do usuário
      // baseado em seu role e níveis de aprovação configurados
      return [];
    }),

  // ============================================================================
  // AÇÕES DE APROVAÇÃO
  // ============================================================================

  /**
   * Aprovar
   */
  approve: protectedProcedure
    .input(
      z.object({
        instanceId: z.number(),
        level: z.number(),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const instance = await getApprovalInstanceById(input.instanceId);
      if (!instance) {
        throw new Error("Instância não encontrada");
      }

      // Criar ação de aprovação
      await createApprovalAction({
        instanceId: input.instanceId,
        level: input.level,
        approverId: ctx.user.id,
        approverName: ctx.user.name || undefined,
        approverRole: ctx.user.role,
        action: "approved",
        comments: input.comments,
      });

      // TODO: Verificar se deve avançar para próximo nível ou completar

      return {
        success: true,
        message: "Aprovação registrada com sucesso",
      };
    }),

  /**
   * Rejeitar
   */
  reject: protectedProcedure
    .input(
      z.object({
        instanceId: z.number(),
        level: z.number(),
        comments: z.string().min(1, "Comentário é obrigatório para rejeição"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Criar ação de rejeição
      await createApprovalAction({
        instanceId: input.instanceId,
        level: input.level,
        approverId: ctx.user.id,
        approverName: ctx.user.name || undefined,
        approverRole: ctx.user.role,
        action: "rejected",
        comments: input.comments,
      });

      // Atualizar status da instância
      await updateApprovalInstance(input.instanceId, {
        status: "rejected",
        completedAt: new Date(),
      });

      return {
        success: true,
        message: "Rejeição registrada com sucesso",
      };
    }),

  /**
   * Listar ações de uma instância
   */
  getInstanceActions: protectedProcedure
    .input(z.object({ instanceId: z.number() }))
    .query(async ({ input }) => {
      return await getApprovalActionsByInstance(input.instanceId);
    }),

  // ============================================================================
  // ESTATÍSTICAS
  // ============================================================================

  /**
   * Estatísticas de aprovações
   */
  stats: protectedProcedure
    .query(async () => {
      const allInstances = await listApprovalInstances();
      
      const byStatus = allInstances.reduce((acc, inst: any) => {
        acc[inst.status] = (acc[inst.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const byProcessType = allInstances.reduce((acc, inst: any) => {
        acc[inst.processType] = (acc[inst.processType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        total: allInstances.length,
        byStatus,
        byProcessType,
      };
    }),
});
