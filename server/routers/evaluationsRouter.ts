import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import {
  listEvaluationCriteria,
  createEvaluationCriteria,
  createEvaluationInstance,
  getEmployeeEvaluations,
  updateEvaluationStatus,
  saveEvaluationResponse,
  getEvaluationResponses,
} from "../db";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
// Import dinâmico para evitar problemas de cache TypeScript
// evaluationInstances e evaluationComments serão importados dinamicamente quando necessário

/**
 * Router para Sistema de Avaliações de Desempenho (Item 2)
 */
export const evaluationsRouter = router({
  /**
   * Listar critérios de avaliação
   */
  listCriteria: protectedProcedure
    .input(
      z.object({
        category: z
          .enum(["competencia", "meta", "comportamento", "resultado"])
          .optional(),
      })
    )
    .query(async ({ input }) => {
      return await listEvaluationCriteria(input.category);
    }),

  /**
   * Criar critério de avaliação
   */
  createCriteria: protectedProcedure
    .input(
      z.object({
        name: z.string().min(3),
        description: z.string().optional(),
        category: z.enum(["competencia", "meta", "comportamento", "resultado"]),
        weight: z.number().default(1),
        minScore: z.number().default(1),
        maxScore: z.number().default(5),
        displayOrder: z.number().default(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verificar permissão
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores e RH podem criar critérios",
        });
      }

      const criteriaId = await createEvaluationCriteria({
        ...input,
        isActive: true,
        createdBy: ctx.user.id,
      });

      return { id: criteriaId, success: true };
    }),

  /**
   * Criar instância de avaliação
   */
  createInstance: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        employeeId: z.number(),
        evaluatorId: z.number().optional(),
        cycleId: z.number().optional(),
        evaluationType: z.enum([
          "autoavaliacao",
          "superior",
          "par",
          "subordinado",
          "cliente",
        ]),
        dueDate: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verificar permissão
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh" && ctx.user.role !== "gestor") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sem permissão para criar avaliações",
        });
      }

      const instanceId = await createEvaluationInstance({
        ...input,
        evaluatorId: input.evaluatorId || ctx.user.id,
        status: "pendente",
        notificationSent: false,
        remindersSent: 0,
        createdBy: ctx.user.id,
      });

      // TODO: Enviar notificação para avaliador
      return { id: instanceId, success: true };
    }),

  /**
   * Listar avaliações de um funcionário
   */
  listByEmployee: protectedProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input, ctx }) => {
      // Verificar permissão: admin, RH, gestor ou o próprio funcionário
      const { getUserEmployee } = await import("../db");
      const employee = await getUserEmployee(ctx.user.id);

      const canView =
        ctx.user.role === "admin" ||
        ctx.user.role === "rh" ||
        ctx.user.role === "gestor" ||
        (employee && employee.id === input.employeeId);

      if (!canView) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sem permissão para visualizar estas avaliações",
        });
      }

      return await getEmployeeEvaluations(input.employeeId);
    }),

  /**
   * Obter detalhes de uma avaliação
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const { getEvaluationInstanceById } = await import("../db");

      const instance = await getEvaluationInstanceById(input.id);
      
      if (!instance) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Avaliação não encontrada",
        });
      }

      // Verificar permissão
      const { getUserEmployee } = await import("../db");
      const employee = await getUserEmployee(ctx.user.id);

      const canView =
        ctx.user.role === "admin" ||
        ctx.user.role === "rh" ||
        instance.evaluatorId === ctx.user.id ||
        (employee && employee.id === instance.employeeId);

      if (!canView) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sem permissão para visualizar esta avaliação",
        });
      }

      // Buscar respostas
      const responses = await getEvaluationResponses(input.id);

      return {
        ...instance,
        responses,
      };
    }),

  /**
   * Iniciar preenchimento de avaliação
   */
  start: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await updateEvaluationStatus(input.id, "em_andamento", {
        startedAt: new Date(),
      });

      return { success: true };
    }),

  /**
   * Salvar resposta de critério
   */
  saveResponse: protectedProcedure
    .input(
      z.object({
        instanceId: z.number(),
        criteriaId: z.number(),
        score: z.number().min(1).max(10),
        comments: z.string().optional(),
        evidences: z.string().optional(), // JSON string
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verificar se o usuário é o avaliador
      const { getEvaluationInstanceById, getDb } = await import("../db");

      const instance = await getEvaluationInstanceById(input.instanceId);
      
      if (!instance) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Avaliação não encontrada",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      if (instance.evaluatorId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas o avaliador pode salvar respostas",
        });
      }

      if (instance.status === "concluida" || instance.status === "aprovada") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Avaliação já foi concluída",
        });
      }

      const responseId = await saveEvaluationResponse(input);

      return { id: responseId, success: true };
    }),

  /**
   * Finalizar avaliação
   */
  complete: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        generalComments: z.string().optional(),
        strengths: z.string().optional(),
        improvements: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...comments } = input;

      // Verificar se todas as respostas foram preenchidas
      const responses = await getEvaluationResponses(id);

      // TODO: Validar se todos os critérios obrigatórios foram respondidos

      // Calcular pontuação total
      const totalScore = responses.reduce((sum, r) => sum + r.score, 0);
      const maxPossibleScore = responses.length * 5; // Assumindo escala 1-5

      // Determinar rating final
      const percentage = (totalScore / maxPossibleScore) * 100;
      let finalRating: string;

      if (percentage < 40) finalRating = "insatisfatorio";
      else if (percentage < 60) finalRating = "abaixo_expectativas";
      else if (percentage < 80) finalRating = "atende_expectativas";
      else if (percentage < 95) finalRating = "supera_expectativas";
      else finalRating = "excepcional";

      await updateEvaluationStatus(id, "concluida", {
        completedAt: new Date(),
        totalScore,
        maxPossibleScore,
        finalRating,
        ...comments,
      });

      // TODO: Enviar notificação para avaliado e RH

      return { success: true, totalScore, finalRating };
    }),

  /**
   * Aprovar avaliação (RH/Gestor)
   */
  approve: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Verificar permissão
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh" && ctx.user.role !== "gestor") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas RH e gestores podem aprovar avaliações",
        });
      }

      await updateEvaluationStatus(input.id, "aprovada", {
        approvedAt: new Date(),
        approvedBy: ctx.user.id,
      });

      return { success: true };
    }),

  /**
   * Rejeitar avaliação (RH/Gestor)
   */
  reject: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        reason: z.string().min(10),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verificar permissão
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh" && ctx.user.role !== "gestor") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas RH e gestores podem rejeitar avaliações",
        });
      }

      await updateEvaluationStatus(input.id, "rejeitada", {
        generalComments: input.reason,
      });

      // TODO: Notificar avaliador sobre rejeição

      return { success: true };
    }),

  /**
   * Adicionar comentário em avaliação
   */
  addComment: protectedProcedure
    .input(
      z.object({
        instanceId: z.number(),
        criteriaId: z.number().optional(),
        comment: z.string().min(1),
        isPrivate: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { addEvaluationComment } = await import("../db");

      const result = await addEvaluationComment({
        ...input,
        authorId: ctx.user.id,
      });

      return result;
    }),
});
