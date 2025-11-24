import { router, publicProcedure, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { smartGoals, criticalGoalAlerts, performanceHistory, scheduledReports } from "../../drizzle/schema";
import { eq, desc, and, ne } from "drizzle-orm";
import { z } from "zod";
import { processCriticalGoals } from "../jobs/goalsMonitoring";
import { emailService } from "../services/emailService";

/**
 * Router de Performance e Metas
 * Procedimentos para gerenciar metas, alertas e relatorios
 */

export const performanceRouter = router({
  /**
   * Obter metas do usuario autenticado
   */
  getMyGoals: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const goals = await db
      .select()
      .from(smartGoals)
      .where(eq(smartGoals.userId, ctx.user.id));

    return goals.map(g => ({
      ...g,
      progress: typeof g.progress === 'string' ? parseFloat(g.progress) : g.progress,
      targetValue: g.targetValue ? (typeof g.targetValue === 'string' ? parseFloat(g.targetValue) : g.targetValue) : null,
      currentValue: g.currentValue ? (typeof g.currentValue === 'string' ? parseFloat(g.currentValue) : g.currentValue) : null,
    }));
  }),

  /**
   * Obter alertas criticos do usuario
   */
  getMyCriticalAlerts: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const alerts = await db
      .select()
      .from(criticalGoalAlerts)
      .where(eq(criticalGoalAlerts.userId, ctx.user.id))
      .orderBy(desc(criticalGoalAlerts.createdAt))
      .limit(20);

    return alerts.map(a => ({
      ...a,
      currentProgress: typeof a.currentProgress === 'string' ? parseFloat(a.currentProgress) : a.currentProgress,
    }));
  }),

  /**
   * Obter historico de performance do usuario
   */
  getMyPerformanceHistory: protectedProcedure
    .input(z.object({
      days: z.number().default(30),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const history = await db
        .select()
        .from(performanceHistory)
        .where(
          and(
            eq(performanceHistory.userId, ctx.user.id),
            // Filtrar por data se houver suporte
          )
        )
        .orderBy(desc(performanceHistory.recordedAt))
        .limit(input.days);

      return history.map(h => ({
        ...h,
        performanceScore: typeof h.performanceScore === 'string' ? parseFloat(h.performanceScore) : h.performanceScore,
      }));
    }),

  /**
   * Marcar alerta como lido
   */
  markAlertAsRead: protectedProcedure
    .input(z.object({
      alertId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verificar se o alerta pertence ao usuario
      const alert = await db
        .select()
        .from(criticalGoalAlerts)
        .where(
          and(
            eq(criticalGoalAlerts.id, input.alertId),
            eq(criticalGoalAlerts.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (alert.length === 0) {
        throw new Error("Alert not found");
      }

      // Atualizar status de leitura (implementacao completa em proxima fase)
      return { success: true };
    }),

  /**
   * Criar nova meta
   */
  createGoal: protectedProcedure
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
      category: z.enum(["financial", "behavioral", "corporate", "development"]),
      targetValue: z.number().optional(),
      unit: z.string().optional(),
      weight: z.number().default(1),
      endDate: z.date(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const newGoal = {
        userId: ctx.user.id,
        title: input.title,
        description: input.description || null,
        category: input.category,
        status: "planejada" as const,
        progress: "0" as any,
        targetValue: input.targetValue ? (input.targetValue as any) : undefined,
        currentValue: "0" as any,
        unit: input.unit || null,
        weight: input.weight,
        startDate: new Date(),
        endDate: input.endDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(smartGoals).values(newGoal);
      return { success: true };
    }),

  /**
   * Atualizar progresso de meta
   */
  updateGoalProgress: protectedProcedure
    .input(z.object({
      goalId: z.number(),
      progress: z.number().min(0).max(100),
      currentValue: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verificar se a meta pertence ao usuario
      const goal = await db
        .select()
        .from(smartGoals)
        .where(
          and(
            eq(smartGoals.id, input.goalId),
            eq(smartGoals.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (goal.length === 0) {
        throw new Error("Goal not found");
      }

      // Atualizar meta (implementacao completa em proxima fase)
      return { success: true };
    }),

  /**
   * Processar alertas criticos (Admin)
   */
  processCriticalAlerts: adminProcedure.mutation(async () => {
    try {
      const result = await processCriticalGoals();
      return {
        success: true,
        processed: result.processed,
        alertsGenerated: result.alertsGenerated,
        emailsSent: result.emailsSent,
      };
    } catch (error) {
      console.error("Error processing critical alerts:", error);
      throw error;
    }
  }),

  /**
   * Enviar relatorio de performance por email
   */
  sendPerformanceReport: protectedProcedure
    .input(z.object({
      period: z.enum(["week", "month", "quarter"]),
      recipients: z.array(z.string().email()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar dados de performance
      const history = await db
        .select()
        .from(performanceHistory)
        .where(eq(performanceHistory.userId, ctx.user.id))
        .orderBy(desc(performanceHistory.recordedAt))
        .limit(1);

      if (history.length === 0) {
        throw new Error("No performance data available");
      }

      const data = history[0];
      const recipients = input.recipients || [ctx.user.email || ""];

      const sent = await emailService.sendPerformanceReport(
        recipients,
        ctx.user.name || "Usuario",
        {
          performanceScore: typeof data.performanceScore === 'string' ? parseFloat(data.performanceScore) : (data.performanceScore || 0),
          goalsCompleted: data.goalsCompleted || 0,
          goalsTotal: data.goalsTotal || 0,
          criticalGoals: data.criticalGoals || 0,
          period: input.period,
        }
      );

      return { success: sent };
    }),

  /**
   * Agendar relatorio automatico
   */
  scheduleReport: protectedProcedure
    .input(z.object({
      name: z.string(),
      reportType: z.enum(["goals", "alerts", "performance", "summary"]),
      format: z.enum(["pdf", "excel", "csv"]),
      frequency: z.enum(["daily", "weekly", "monthly"]),
      recipients: z.array(z.string().email()),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const nextExecution = new Date();
      if (input.frequency === "daily") {
        nextExecution.setDate(nextExecution.getDate() + 1);
      } else if (input.frequency === "weekly") {
        nextExecution.setDate(nextExecution.getDate() + 7);
      } else if (input.frequency === "monthly") {
        nextExecution.setMonth(nextExecution.getMonth() + 1);
      }

      const newReport = {
        userId: ctx.user.id,
        name: input.name,
        reportType: input.reportType as any,
        format: input.format as any,
        frequency: input.frequency as any,
        recipients: JSON.stringify(input.recipients),
        nextExecution,
        isActive: 1 as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(scheduledReports).values(newReport);
      return { success: true };
    }),

  /**
   * Obter relatorios agendados do usuario
   */
  getMyScheduledReports: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const reports = await db
      .select()
      .from(scheduledReports)
      .where(eq(scheduledReports.userId, ctx.user.id));

    return reports.map(r => ({
      ...r,
      recipients: r.recipients ? JSON.parse(r.recipients) : [],
      lastExecuted: r.lastExecuted || null,
    }));
  }),

  /**
   * Obter estatisticas de performance (Admin)
   */
  getPerformanceStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const allGoals = await db.select().from(smartGoals);
    const allAlerts = await db.select().from(criticalGoalAlerts);

    const completedGoals = allGoals.filter(g => g.status === "concluida").length;
    const criticalGoals = allGoals.filter(g => {
      const progress = typeof g.progress === 'string' ? parseFloat(g.progress) : g.progress;
      return progress < 20 && g.status !== "concluida" && g.status !== "cancelada";
    }).length;

    return {
      totalGoals: allGoals.length,
      completedGoals,
      completionRate: allGoals.length > 0 ? (completedGoals / allGoals.length * 100).toFixed(2) : "0.00",
      criticalGoals,
      totalAlerts: allAlerts.length,
      unreadAlerts: allAlerts.filter(a => (a.isRead || 0) === 0).length,
    };
  }),
});
