import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import {
  jobDescriptionApprovalFlow,
  jobDescriptionApprovalHistory,
  jobDescriptions,
  employees,
} from "../../drizzle/schema";
import { notifyOwner } from "../_core/notification";

// Níveis de aprovação
const APPROVAL_LEVELS = {
  1: { name: "Líder Imediato", field: "leader" },
  2: { name: "Especialista de Cargos e Salários", field: "csSpecialist" },
  3: { name: "Gerente de RH", field: "hrManager" },
  4: { name: "Diretor de Gente, Administração e Inovação", field: "gaiDirector" },
} as const;

// Status do fluxo por nível
const STATUS_BY_LEVEL = {
  1: "pending_leader",
  2: "pending_cs_specialist",
  3: "pending_hr_manager",
  4: "pending_gai_director",
} as const;

/**
 * Router para o novo fluxo de aprovação de descrições de cargos
 * 4 níveis obrigatórios:
 * 1. Líder Imediato
 * 2. Especialista de Cargos e Salários (Alexsandra)
 * 3. Gerente de RH (André)
 * 4. Diretor de Gente, Administração e Inovação (Rodrigo)
 */
export const approvalFlowRouter = router({
  /**
   * Criar novo fluxo de aprovação para uma descrição de cargo
   */
  create: protectedProcedure
    .input(
      z.object({
        jobDescriptionId: z.number(),
        leaderId: z.number(),
        leaderName: z.string().optional(),
        csSpecialistId: z.number(),
        csSpecialistName: z.string().optional(),
        hrManagerId: z.number(),
        hrManagerName: z.string().optional(),
        gaiDirectorId: z.number(),
        gaiDirectorName: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar se já existe um fluxo ativo para esta descrição
      const existingFlow = await db
        .select()
        .from(jobDescriptionApprovalFlow)
        .where(
          and(
            eq(jobDescriptionApprovalFlow.jobDescriptionId, input.jobDescriptionId),
            inArray(jobDescriptionApprovalFlow.status, ["draft", "pending_leader", "pending_cs_specialist", "pending_hr_manager", "pending_gai_director"])
          )
        )
        .limit(1);

      if (existingFlow.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Já existe um fluxo de aprovação ativo para esta descrição de cargo",
        });
      }

      // Criar novo fluxo
      const [result] = await db.insert(jobDescriptionApprovalFlow).values({
        jobDescriptionId: input.jobDescriptionId,
        leaderId: input.leaderId,
        leaderName: input.leaderName,
        csSpecialistId: input.csSpecialistId,
        csSpecialistName: input.csSpecialistName,
        hrManagerId: input.hrManagerId,
        hrManagerName: input.hrManagerName,
        gaiDirectorId: input.gaiDirectorId,
        gaiDirectorName: input.gaiDirectorName,
        submittedBy: ctx.user.id,
      });

      const flowId = result.insertId;

      // Registrar no histórico
      await db.insert(jobDescriptionApprovalHistory).values({
        flowId,
        jobDescriptionId: input.jobDescriptionId,
        action: "created",
        level: 0,
        levelName: "Sistema",
        userId: ctx.user.id,
        userName: ctx.user.name || "Usuário",
        userRole: ctx.user.role,
        comments: "Fluxo de aprovação criado",
      });

      return {
        success: true,
        flowId,
        message: "Fluxo de aprovação criado com sucesso",
      };
    }),

  /**
   * Submeter descrição de cargo para aprovação
   */
  submit: protectedProcedure
    .input(
      z.object({
        flowId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar fluxo
      const [flow] = await db
        .select()
        .from(jobDescriptionApprovalFlow)
        .where(eq(jobDescriptionApprovalFlow.id, input.flowId));

      if (!flow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Fluxo não encontrado" });
      }

      if (flow.status !== "draft" && flow.status !== "returned") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Fluxo já foi submetido ou não pode ser submetido neste estado",
        });
      }

      // Atualizar status para pending_leader (primeiro nível)
      await db
        .update(jobDescriptionApprovalFlow)
        .set({
          status: "pending_leader",
          submittedAt: new Date(),
        })
        .where(eq(jobDescriptionApprovalFlow.id, input.flowId));

      // Buscar descrição de cargo para notificação
      const [jobDesc] = await db
        .select()
        .from(jobDescriptions)
        .where(eq(jobDescriptions.id, flow.jobDescriptionId));

      // Registrar no histórico
      await db.insert(jobDescriptionApprovalHistory).values({
        flowId: input.flowId,
        jobDescriptionId: flow.jobDescriptionId,
        action: flow.status === "returned" ? "resubmitted" : "submitted",
        level: 1,
        levelName: APPROVAL_LEVELS[1].name,
        userId: ctx.user.id,
        userName: ctx.user.name || "Usuário",
        userRole: ctx.user.role,
        comments: "Descrição submetida para aprovação",
      });

      // Enviar notificação
      await notifyOwner({
        title: "Nova Descrição de Cargo para Aprovação",
        content: `A descrição do cargo "${jobDesc?.positionTitle}" foi submetida para aprovação e aguarda validação do Líder Imediato.`,
      });

      return {
        success: true,
        message: "Descrição submetida para aprovação",
      };
    }),

  /**
   * Aprovar descrição de cargo em um nível específico
   */
  approve: protectedProcedure
    .input(
      z.object({
        flowId: z.number(),
        level: z.number().min(1).max(4),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar fluxo
      const [flow] = await db
        .select()
        .from(jobDescriptionApprovalFlow)
        .where(eq(jobDescriptionApprovalFlow.id, input.flowId));

      if (!flow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Fluxo não encontrado" });
      }

      // Verificar se o nível está correto
      const expectedStatus = STATUS_BY_LEVEL[input.level as keyof typeof STATUS_BY_LEVEL];
      if (flow.status !== expectedStatus) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Este fluxo não está no nível ${input.level} de aprovação`,
        });
      }

      // Verificar se o usuário é o aprovador correto
      const levelInfo = APPROVAL_LEVELS[input.level as keyof typeof APPROVAL_LEVELS];
      const approverIdField = `${levelInfo.field}Id` as keyof typeof flow;
      
      if (flow[approverIdField] !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para aprovar neste nível",
        });
      }

      // Preparar campos de atualização
      const statusField = `${levelInfo.field}Status` as string;
      const commentsField = `${levelInfo.field}Comments` as string;
      const decidedAtField = `${levelInfo.field}DecidedAt` as string;

      const updateData: any = {
        [statusField]: "approved",
        [commentsField]: input.comments,
        [decidedAtField]: new Date(),
      };

      // Determinar próximo status
      if (input.level < 4) {
        const nextLevel = (input.level + 1) as keyof typeof STATUS_BY_LEVEL;
        updateData.status = STATUS_BY_LEVEL[nextLevel];
      } else {
        // Último nível - aprovar completamente
        updateData.status = "approved";
        updateData.completedAt = new Date();
      }

      // Atualizar fluxo
      await db
        .update(jobDescriptionApprovalFlow)
        .set(updateData)
        .where(eq(jobDescriptionApprovalFlow.id, input.flowId));

      // Atualizar status da descrição de cargo
      if (input.level === 4) {
        await db
          .update(jobDescriptions)
          .set({ status: "approved", approvedAt: new Date() })
          .where(eq(jobDescriptions.id, flow.jobDescriptionId));
      }

      // Registrar no histórico
      await db.insert(jobDescriptionApprovalHistory).values({
        flowId: input.flowId,
        jobDescriptionId: flow.jobDescriptionId,
        action: "approved",
        level: input.level,
        levelName: levelInfo.name,
        userId: ctx.user.id,
        userName: ctx.user.name || "Usuário",
        userRole: ctx.user.role,
        comments: input.comments,
      });

      // Buscar descrição para notificação
      const [jobDesc] = await db
        .select()
        .from(jobDescriptions)
        .where(eq(jobDescriptions.id, flow.jobDescriptionId));

      // Enviar notificação
      if (input.level < 4) {
        const nextLevelInfo = APPROVAL_LEVELS[(input.level + 1) as keyof typeof APPROVAL_LEVELS];
        await notifyOwner({
          title: `Descrição de Cargo Aprovada - Nível ${input.level}`,
          content: `A descrição do cargo "${jobDesc?.positionTitle}" foi aprovada pelo ${levelInfo.name} e aguarda aprovação do ${nextLevelInfo.name}.`,
        });
      } else {
        await notifyOwner({
          title: "Descrição de Cargo Aprovada Completamente",
          content: `A descrição do cargo "${jobDesc?.positionTitle}" foi aprovada por todos os níveis e está finalizada.`,
        });
      }

      return {
        success: true,
        message: input.level === 4 
          ? "Descrição de cargo aprovada completamente" 
          : `Aprovação de nível ${input.level} registrada`,
      };
    }),

  /**
   * Rejeitar descrição de cargo
   */
  reject: protectedProcedure
    .input(
      z.object({
        flowId: z.number(),
        level: z.number().min(1).max(4),
        comments: z.string().min(10, "Comentário deve ter pelo menos 10 caracteres"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar fluxo
      const [flow] = await db
        .select()
        .from(jobDescriptionApprovalFlow)
        .where(eq(jobDescriptionApprovalFlow.id, input.flowId));

      if (!flow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Fluxo não encontrado" });
      }

      const levelInfo = APPROVAL_LEVELS[input.level as keyof typeof APPROVAL_LEVELS];
      const statusField = `${levelInfo.field}Status` as string;
      const commentsField = `${levelInfo.field}Comments` as string;
      const decidedAtField = `${levelInfo.field}DecidedAt` as string;

      // Atualizar fluxo
      await db
        .update(jobDescriptionApprovalFlow)
        .set({
          status: "rejected",
          [statusField]: "rejected",
          [commentsField]: input.comments,
          [decidedAtField]: new Date(),
          completedAt: new Date(),
        })
        .where(eq(jobDescriptionApprovalFlow.id, input.flowId));

      // Atualizar status da descrição de cargo
      await db
        .update(jobDescriptions)
        .set({ status: "rejected" })
        .where(eq(jobDescriptions.id, flow.jobDescriptionId));

      // Registrar no histórico
      await db.insert(jobDescriptionApprovalHistory).values({
        flowId: input.flowId,
        jobDescriptionId: flow.jobDescriptionId,
        action: "rejected",
        level: input.level,
        levelName: levelInfo.name,
        userId: ctx.user.id,
        userName: ctx.user.name || "Usuário",
        userRole: ctx.user.role,
        comments: input.comments,
      });

      // Buscar descrição para notificação
      const [jobDesc] = await db
        .select()
        .from(jobDescriptions)
        .where(eq(jobDescriptions.id, flow.jobDescriptionId));

      await notifyOwner({
        title: "Descrição de Cargo Rejeitada",
        content: `A descrição do cargo "${jobDesc?.positionTitle}" foi rejeitada pelo ${levelInfo.name}. Motivo: ${input.comments}`,
      });

      return {
        success: true,
        message: "Descrição de cargo rejeitada",
      };
    }),

  /**
   * Devolver descrição de cargo para ajustes
   */
  return: protectedProcedure
    .input(
      z.object({
        flowId: z.number(),
        level: z.number().min(1).max(4),
        comments: z.string().min(10, "Comentário deve ter pelo menos 10 caracteres"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar fluxo
      const [flow] = await db
        .select()
        .from(jobDescriptionApprovalFlow)
        .where(eq(jobDescriptionApprovalFlow.id, input.flowId));

      if (!flow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Fluxo não encontrado" });
      }

      const levelInfo = APPROVAL_LEVELS[input.level as keyof typeof APPROVAL_LEVELS];
      const statusField = `${levelInfo.field}Status` as string;
      const commentsField = `${levelInfo.field}Comments` as string;
      const decidedAtField = `${levelInfo.field}DecidedAt` as string;

      // Atualizar fluxo - volta para draft
      await db
        .update(jobDescriptionApprovalFlow)
        .set({
          status: "returned",
          [statusField]: "returned",
          [commentsField]: input.comments,
          [decidedAtField]: new Date(),
        })
        .where(eq(jobDescriptionApprovalFlow.id, input.flowId));

      // Registrar no histórico
      await db.insert(jobDescriptionApprovalHistory).values({
        flowId: input.flowId,
        jobDescriptionId: flow.jobDescriptionId,
        action: "returned",
        level: input.level,
        levelName: levelInfo.name,
        userId: ctx.user.id,
        userName: ctx.user.name || "Usuário",
        userRole: ctx.user.role,
        comments: input.comments,
      });

      // Buscar descrição para notificação
      const [jobDesc] = await db
        .select()
        .from(jobDescriptions)
        .where(eq(jobDescriptions.id, flow.jobDescriptionId));

      await notifyOwner({
        title: "Descrição de Cargo Devolvida para Ajustes",
        content: `A descrição do cargo "${jobDesc?.positionTitle}" foi devolvida pelo ${levelInfo.name} para ajustes. Observações: ${input.comments}`,
      });

      return {
        success: true,
        message: "Descrição devolvida para ajustes",
      };
    }),

  /**
   * Buscar fluxo por ID de descrição de cargo
   */
  getByJobDescriptionId: protectedProcedure
    .input(z.object({ jobDescriptionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const flows = await db
        .select()
        .from(jobDescriptionApprovalFlow)
        .where(eq(jobDescriptionApprovalFlow.jobDescriptionId, input.jobDescriptionId))
        .orderBy(desc(jobDescriptionApprovalFlow.createdAt));

      return flows;
    }),

  /**
   * Buscar fluxo ativo por ID de descrição de cargo
   */
  getActiveByJobDescriptionId: protectedProcedure
    .input(z.object({ jobDescriptionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [flow] = await db
        .select()
        .from(jobDescriptionApprovalFlow)
        .where(
          and(
            eq(jobDescriptionApprovalFlow.jobDescriptionId, input.jobDescriptionId),
            inArray(jobDescriptionApprovalFlow.status, [
              "draft",
              "pending_leader",
              "pending_cs_specialist",
              "pending_hr_manager",
              "pending_gai_director",
              "returned",
            ])
          )
        )
        .orderBy(desc(jobDescriptionApprovalFlow.createdAt))
        .limit(1);

      return flow || null;
    }),

  /**
   * Listar aprovações pendentes para o usuário logado
   */
  getPendingApprovals: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Buscar fluxos onde o usuário é aprovador em algum nível pendente
    const pendingFlows = await db
      .select({
        flow: jobDescriptionApprovalFlow,
        jobDescription: jobDescriptions,
      })
      .from(jobDescriptionApprovalFlow)
      .innerJoin(jobDescriptions, eq(jobDescriptionApprovalFlow.jobDescriptionId, jobDescriptions.id))
      .where(
        sql`(
          (${jobDescriptionApprovalFlow.status} = 'pending_leader' AND ${jobDescriptionApprovalFlow.leaderId} = ${ctx.user.id})
          OR (${jobDescriptionApprovalFlow.status} = 'pending_cs_specialist' AND ${jobDescriptionApprovalFlow.csSpecialistId} = ${ctx.user.id})
          OR (${jobDescriptionApprovalFlow.status} = 'pending_hr_manager' AND ${jobDescriptionApprovalFlow.hrManagerId} = ${ctx.user.id})
          OR (${jobDescriptionApprovalFlow.status} = 'pending_gai_director' AND ${jobDescriptionApprovalFlow.gaiDirectorId} = ${ctx.user.id})
        )`
      )
      .orderBy(desc(jobDescriptionApprovalFlow.submittedAt));

    return pendingFlows.map((item) => ({
      ...item.flow,
      jobDescription: item.jobDescription,
      currentLevel: getCurrentLevel(item.flow.status),
      currentLevelName: getCurrentLevelName(item.flow.status),
    }));
  }),

  /**
   * Obter histórico de um fluxo
   */
  getHistory: protectedProcedure
    .input(z.object({ flowId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const history = await db
        .select()
        .from(jobDescriptionApprovalHistory)
        .where(eq(jobDescriptionApprovalHistory.flowId, input.flowId))
        .orderBy(desc(jobDescriptionApprovalHistory.createdAt));

      return history;
    }),

  /**
   * Estatísticas de aprovações
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Contar por status
    const stats = await db
      .select({
        status: jobDescriptionApprovalFlow.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(jobDescriptionApprovalFlow)
      .groupBy(jobDescriptionApprovalFlow.status);

    // Contar pendentes do usuário
    const pendingForUser = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(jobDescriptionApprovalFlow)
      .where(
        sql`(
          (${jobDescriptionApprovalFlow.status} = 'pending_leader' AND ${jobDescriptionApprovalFlow.leaderId} = ${ctx.user.id})
          OR (${jobDescriptionApprovalFlow.status} = 'pending_cs_specialist' AND ${jobDescriptionApprovalFlow.csSpecialistId} = ${ctx.user.id})
          OR (${jobDescriptionApprovalFlow.status} = 'pending_hr_manager' AND ${jobDescriptionApprovalFlow.hrManagerId} = ${ctx.user.id})
          OR (${jobDescriptionApprovalFlow.status} = 'pending_gai_director' AND ${jobDescriptionApprovalFlow.gaiDirectorId} = ${ctx.user.id})
        )`
      );

    const statusCounts = stats.reduce(
      (acc, item) => {
        acc[item.status] = Number(item.count);
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      byStatus: statusCounts,
      pendingForUser: Number(pendingForUser[0]?.count || 0),
      total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
    };
  }),

  /**
   * Listar todos os fluxos (para admin)
   */
  listAll: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        departmentId: z.number().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      let query = db
        .select({
          flow: jobDescriptionApprovalFlow,
          jobDescription: jobDescriptions,
        })
        .from(jobDescriptionApprovalFlow)
        .innerJoin(jobDescriptions, eq(jobDescriptionApprovalFlow.jobDescriptionId, jobDescriptions.id))
        .orderBy(desc(jobDescriptionApprovalFlow.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const results = await query;

      return results.map((item) => ({
        ...item.flow,
        jobDescription: item.jobDescription,
        currentLevel: getCurrentLevel(item.flow.status),
        currentLevelName: getCurrentLevelName(item.flow.status),
      }));
    }),
});

// Funções auxiliares
function getCurrentLevel(status: string): number {
  switch (status) {
    case "pending_leader":
      return 1;
    case "pending_cs_specialist":
      return 2;
    case "pending_hr_manager":
      return 3;
    case "pending_gai_director":
      return 4;
    case "approved":
      return 5;
    default:
      return 0;
  }
}

function getCurrentLevelName(status: string): string {
  switch (status) {
    case "draft":
      return "Rascunho";
    case "pending_leader":
      return "Aguardando Líder Imediato";
    case "pending_cs_specialist":
      return "Aguardando Especialista C&S";
    case "pending_hr_manager":
      return "Aguardando Gerente RH";
    case "pending_gai_director":
      return "Aguardando Diretor GAI";
    case "approved":
      return "Aprovado";
    case "rejected":
      return "Rejeitado";
    case "returned":
      return "Devolvido para Ajustes";
    default:
      return status;
  }
}
