import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { 
  triggerNPSAfterPDICompletion,
  triggerNPSAfterStepCompletion,
  getProcessesPendingNPS,
  calculateRealTimeNPSStats,
  notifyAdminAboutNPSResponse
} from "../services/npsTriggerService";
import { getDb } from "../db";
import { npsSurveys, npsResponses, employees } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const npsTriggerRouter = router({
  /**
   * Trigger manual de NPS após conclusão do PDI
   * Chamado pelo frontend quando o PDI é finalizado
   */
  triggerAfterPDI: protectedProcedure
    .input(z.object({
      processId: z.number(),
      employeeId: z.number(),
    }))
    .mutation(async ({ input }) => {
      return await triggerNPSAfterPDICompletion(input.processId, input.employeeId);
    }),

  /**
   * Trigger de NPS após conclusão de um passo específico
   */
  triggerAfterStep: protectedProcedure
    .input(z.object({
      processId: z.number(),
      employeeId: z.number(),
      stepNumber: z.number().min(1).max(5),
    }))
    .mutation(async ({ input }) => {
      return await triggerNPSAfterStepCompletion(
        input.processId, 
        input.employeeId, 
        input.stepNumber
      );
    }),

  /**
   * Listar processos que completaram PDI mas não responderam NPS
   * Usado para follow-up e relatórios
   */
  getPendingProcesses: adminProcedure.query(async () => {
    return await getProcessesPendingNPS();
  }),

  /**
   * Obter estatísticas NPS em tempo real
   */
  getRealTimeStats: protectedProcedure
    .input(z.object({ surveyId: z.number() }))
    .query(async ({ input }) => {
      return await calculateRealTimeNPSStats(input.surveyId);
    }),

  /**
   * Registrar resposta NPS com notificação automática
   */
  submitWithNotification: protectedProcedure
    .input(z.object({
      surveyId: z.number(),
      employeeId: z.number(),
      processId: z.number().optional(),
      score: z.number().min(0).max(10),
      followUpComment: z.string().optional(),
      responseTimeSeconds: z.number().optional(),
      deviceType: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database não disponível");

      // Determinar categoria
      const category = input.score >= 9 ? "promoter" : input.score >= 7 ? "passive" : "detractor";

      // Inserir resposta
      const result = await db.insert(npsResponses).values({
        surveyId: input.surveyId,
        employeeId: input.employeeId,
        processId: input.processId,
        score: input.score,
        category,
        followUpComment: input.followUpComment,
        responseTimeSeconds: input.responseTimeSeconds,
        deviceType: input.deviceType,
      });

      // Buscar dados para notificação
      const [survey] = await db.select()
        .from(npsSurveys)
        .where(eq(npsSurveys.id, input.surveyId))
        .limit(1);

      const [employee] = await db.select()
        .from(employees)
        .where(eq(employees.id, input.employeeId))
        .limit(1);

      // Notificar admin sobre detratores (score baixo)
      if (category === "detractor") {
        await notifyAdminAboutNPSResponse(
          survey?.name || "Pesquisa NPS",
          employee?.name || "Funcionário",
          input.score,
          category
        );
      }

      return { 
        success: true, 
        responseId: Number(result[0].insertId), 
        category,
        notificationSent: category === "detractor"
      };
    }),

  /**
   * Obter configuração de trigger para um evento
   */
  getTriggerConfig: protectedProcedure
    .input(z.object({
      triggerEvent: z.enum(["process_completed", "step_completed", "manual"]),
      stepNumber: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const conditions = [
        eq(npsSurveys.status, "active"),
        eq(npsSurveys.triggerEvent, input.triggerEvent),
      ];

      if (input.stepNumber !== undefined) {
        conditions.push(eq(npsSurveys.triggerStepNumber, input.stepNumber));
      }

      const [survey] = await db.select()
        .from(npsSurveys)
        .where(and(...conditions))
        .limit(1);

      if (!survey) return null;

      return {
        surveyId: survey.id,
        surveyName: survey.name,
        mainQuestion: survey.mainQuestion,
        delayMinutes: survey.delayMinutes,
        promoterFollowUp: survey.promoterFollowUp,
        passiveFollowUp: survey.passiveFollowUp,
        detractorFollowUp: survey.detractorFollowUp,
      };
    }),

  /**
   * Listar últimas respostas NPS com detalhes
   */
  getRecentResponses: adminProcedure
    .input(z.object({
      surveyId: z.number().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db.select({
        id: npsResponses.id,
        score: npsResponses.score,
        category: npsResponses.category,
        followUpComment: npsResponses.followUpComment,
        createdAt: npsResponses.createdAt,
        employeeId: npsResponses.employeeId,
        employeeName: employees.name,
        surveyId: npsResponses.surveyId,
        surveyName: npsSurveys.name,
      })
      .from(npsResponses)
      .leftJoin(employees, eq(npsResponses.employeeId, employees.id))
      .leftJoin(npsSurveys, eq(npsResponses.surveyId, npsSurveys.id))
      .orderBy(desc(npsResponses.createdAt))
      .limit(input.limit);

      if (input.surveyId) {
        query = query.where(eq(npsResponses.surveyId, input.surveyId)) as typeof query;
      }

      return await query;
    }),

  /**
   * Obter taxa de resposta NPS
   */
  getResponseRate: adminProcedure
    .input(z.object({ surveyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { rate: 0, total: 0, responded: 0 };

      // Contar respostas
      const responses = await db.select()
        .from(npsResponses)
        .where(eq(npsResponses.surveyId, input.surveyId));

      // Contar processos elegíveis (concluídos)
      const { avdAssessmentProcesses } = await import("../../drizzle/schema");
      const completedProcesses = await db.select()
        .from(avdAssessmentProcesses)
        .where(eq(avdAssessmentProcesses.status, "concluido"));

      const total = completedProcesses.length;
      const responded = responses.length;
      const rate = total > 0 ? Math.round((responded / total) * 100) : 0;

      return { rate, total, responded };
    }),
});
