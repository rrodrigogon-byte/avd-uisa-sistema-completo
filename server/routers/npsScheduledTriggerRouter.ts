import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import {
  scheduleNpsTriggerAfterPDI,
  processPendingTriggers,
  createDetractorAlert,
  getPendingDetractorAlerts,
  updateDetractorAlertStatus,
  checkPendingNpsProcesses,
  getNpsSettings,
} from "../services/npsScheduledTriggerService";
import { getDb } from "../db";
import { 
  npsScheduledTriggers, 
  npsSettings, 
  npsDetractorAlerts,
  npsSurveys,
  npsResponses,
  employees 
} from "../../drizzle/schema";
import { eq, and, desc, count } from "drizzle-orm";

export const npsScheduledTriggerRouter = router({
  /**
   * Agendar trigger de NPS após conclusão do PDI
   */
  scheduleAfterPDI: protectedProcedure
    .input(z.object({
      processId: z.number(),
      employeeId: z.number(),
      delayMinutes: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      return await scheduleNpsTriggerAfterPDI(
        input.processId,
        input.employeeId,
        input.delayMinutes
      );
    }),

  /**
   * Processar triggers pendentes (job automático)
   */
  processPending: adminProcedure.mutation(async () => {
    return await processPendingTriggers();
  }),

  /**
   * Verificar processos pendentes de NPS
   */
  checkPendingProcesses: adminProcedure.query(async () => {
    return await checkPendingNpsProcesses();
  }),

  /**
   * Obter configurações de NPS
   */
  getSettings: adminProcedure.query(async () => {
    return await getNpsSettings();
  }),

  /**
   * Atualizar configurações de NPS
   */
  updateSettings: adminProcedure
    .input(z.object({
      autoTriggerEnabled: z.boolean().optional(),
      defaultDelayMinutes: z.number().min(0).optional(),
      reminderEnabled: z.boolean().optional(),
      reminderDelayMinutes: z.number().min(0).optional(),
      maxReminders: z.number().min(0).max(10).optional(),
      detractorAlertEnabled: z.boolean().optional(),
      detractorThreshold: z.number().min(0).max(10).optional(),
      alertRecipientEmails: z.string().optional(),
      surveyExpirationDays: z.number().min(1).max(30).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database não disponível");

      const [existing] = await db.select().from(npsSettings).limit(1);

      if (existing) {
        await db.update(npsSettings)
          .set(input)
          .where(eq(npsSettings.id, existing.id));
      } else {
        await db.insert(npsSettings).values({
          ...input,
          autoTriggerEnabled: input.autoTriggerEnabled ?? true,
          defaultDelayMinutes: input.defaultDelayMinutes ?? 1440,
        });
      }

      return { success: true };
    }),

  /**
   * Listar triggers agendados
   */
  listScheduledTriggers: adminProcedure
    .input(z.object({
      status: z.enum(["pending", "sent", "responded", "expired", "cancelled"]).optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db.select({
        id: npsScheduledTriggers.id,
        surveyId: npsScheduledTriggers.surveyId,
        surveyName: npsSurveys.name,
        employeeId: npsScheduledTriggers.employeeId,
        employeeName: employees.name,
        processId: npsScheduledTriggers.processId,
        scheduledFor: npsScheduledTriggers.scheduledFor,
        status: npsScheduledTriggers.status,
        sentAt: npsScheduledTriggers.sentAt,
        respondedAt: npsScheduledTriggers.respondedAt,
        createdAt: npsScheduledTriggers.createdAt,
      })
      .from(npsScheduledTriggers)
      .leftJoin(npsSurveys, eq(npsScheduledTriggers.surveyId, npsSurveys.id))
      .leftJoin(employees, eq(npsScheduledTriggers.employeeId, employees.id))
      .orderBy(desc(npsScheduledTriggers.createdAt))
      .limit(input.limit);

      if (input.status) {
        query = query.where(eq(npsScheduledTriggers.status, input.status)) as typeof query;
      }

      return await query;
    }),

  /**
   * Cancelar trigger agendado
   */
  cancelTrigger: adminProcedure
    .input(z.object({ triggerId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database não disponível");

      await db.update(npsScheduledTriggers)
        .set({ status: "cancelled" })
        .where(eq(npsScheduledTriggers.id, input.triggerId));

      return { success: true };
    }),

  /**
   * Listar alertas de detratores
   */
  listDetractorAlerts: adminProcedure
    .input(z.object({
      status: z.enum(["new", "acknowledged", "in_progress", "resolved", "dismissed"]).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db.select({
        id: npsDetractorAlerts.id,
        employeeId: npsDetractorAlerts.employeeId,
        employeeName: employees.name,
        surveyId: npsDetractorAlerts.surveyId,
        surveyName: npsSurveys.name,
        score: npsDetractorAlerts.score,
        comment: npsDetractorAlerts.comment,
        status: npsDetractorAlerts.status,
        acknowledgedAt: npsDetractorAlerts.acknowledgedAt,
        resolvedAt: npsDetractorAlerts.resolvedAt,
        resolutionNotes: npsDetractorAlerts.resolutionNotes,
        createdAt: npsDetractorAlerts.createdAt,
      })
      .from(npsDetractorAlerts)
      .leftJoin(employees, eq(npsDetractorAlerts.employeeId, employees.id))
      .leftJoin(npsSurveys, eq(npsDetractorAlerts.surveyId, npsSurveys.id))
      .orderBy(desc(npsDetractorAlerts.createdAt));

      if (input.status) {
        query = query.where(eq(npsDetractorAlerts.status, input.status)) as typeof query;
      }

      return await query;
    }),

  /**
   * Atualizar status de alerta de detrator
   */
  updateAlertStatus: adminProcedure
    .input(z.object({
      alertId: z.number(),
      status: z.enum(["acknowledged", "in_progress", "resolved", "dismissed"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const success = await updateDetractorAlertStatus(
        input.alertId,
        input.status,
        ctx.user.id,
        input.notes
      );

      if (!success) {
        throw new Error("Falha ao atualizar status do alerta");
      }

      return { success: true };
    }),

  /**
   * Obter estatísticas de triggers
   */
  getTriggerStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    const allTriggers = await db.select().from(npsScheduledTriggers);

    const pending = allTriggers.filter(t => t.status === "pending").length;
    const sent = allTriggers.filter(t => t.status === "sent").length;
    const responded = allTriggers.filter(t => t.status === "responded").length;
    const expired = allTriggers.filter(t => t.status === "expired").length;
    const cancelled = allTriggers.filter(t => t.status === "cancelled").length;

    const responseRate = sent + responded > 0 
      ? Math.round((responded / (sent + responded)) * 100) 
      : 0;

    // Alertas de detratores
    const alerts = await db.select().from(npsDetractorAlerts);
    const newAlerts = alerts.filter(a => a.status === "new").length;
    const resolvedAlerts = alerts.filter(a => a.status === "resolved").length;

    return {
      triggers: {
        total: allTriggers.length,
        pending,
        sent,
        responded,
        expired,
        cancelled,
        responseRate,
      },
      detractorAlerts: {
        total: alerts.length,
        new: newAlerts,
        resolved: resolvedAlerts,
        pending: alerts.length - resolvedAlerts,
      },
    };
  }),

  /**
   * Submeter resposta NPS com criação automática de alerta de detrator
   */
  submitResponseWithAlert: protectedProcedure
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

      const responseId = Number(result[0].insertId);

      // Atualizar trigger se existir
      if (input.processId) {
        await db.update(npsScheduledTriggers)
          .set({
            status: "responded",
            responseId,
            respondedAt: new Date(),
          })
          .where(and(
            eq(npsScheduledTriggers.surveyId, input.surveyId),
            eq(npsScheduledTriggers.employeeId, input.employeeId),
            eq(npsScheduledTriggers.processId, input.processId)
          ));
      }

      // Criar alerta de detrator se necessário
      let alertCreated = false;
      if (category === "detractor") {
        const alertResult = await createDetractorAlert(
          responseId,
          input.employeeId,
          input.surveyId,
          input.score,
          input.followUpComment
        );
        alertCreated = !!alertResult;
      }

      return {
        success: true,
        responseId,
        category,
        alertCreated,
      };
    }),
});
