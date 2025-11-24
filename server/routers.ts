import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { performanceRouter } from "./routers/performanceRouter";
import { 
  getCriticalAlerts, 
  markAlertAsRead, 
  resolveAlert,
  createScheduledReport,
  getScheduledReports,
  updateScheduledReport,
  deleteScheduledReport,
  getReportExecutionLogs,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  performance: performanceRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============ ALERTAS DE METAS CRÍTICAS ============
  alerts: router({
    /**
     * Listar alertas do usuário
     */
    list: protectedProcedure
      .input(z.object({
        limit: z.number().default(50),
      }))
      .query(async ({ input, ctx }) => {
        return getCriticalAlerts(ctx.user.id, input.limit);
      }),

    /**
     * Marcar alerta como lido
     */
    markAsRead: protectedProcedure
      .input(z.object({
        alertId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await markAlertAsRead(input.alertId);
        return { success: true };
      }),

    /**
     * Resolver alerta com ação
     */
    resolve: protectedProcedure
      .input(z.object({
        alertId: z.number(),
        actionTaken: z.string(),
      }))
      .mutation(async ({ input }) => {
        await resolveAlert(input.alertId, input.actionTaken);
        return { success: true };
      }),
  }),

  // ============ RELATÓRIOS AGENDADOS ============
  reports: router({
    /**
     * Listar relatórios agendados do usuário
     */
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return getScheduledReports(ctx.user.id);
      }),

    /**
     * Criar novo relatório agendado
     */
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        reportType: z.enum(["goals", "alerts", "performance", "summary"]),
        format: z.enum(["pdf", "excel", "csv"]),
        frequency: z.enum(["daily", "weekly", "monthly"]),
        recipients: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Calcular próxima execução
        const nextExecution = new Date();
        if (input.frequency === "daily") {
          nextExecution.setDate(nextExecution.getDate() + 1);
        } else if (input.frequency === "weekly") {
          nextExecution.setDate(nextExecution.getDate() + 7);
        } else if (input.frequency === "monthly") {
          nextExecution.setMonth(nextExecution.getMonth() + 1);
        }

        return createScheduledReport({
          userId: ctx.user.id,
          name: input.name,
          reportType: input.reportType,
          format: input.format,
          frequency: input.frequency,
          recipients: input.recipients,
          nextExecution,
          isActive: 1,
        });
      }),

    /**
     * Atualizar relatório agendado
     */
    update: protectedProcedure
      .input(z.object({
        reportId: z.number(),
        name: z.string().optional(),
        frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
        recipients: z.string().optional(),
        isActive: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { reportId, ...updates } = input;
        await updateScheduledReport(reportId, updates);
        return { success: true };
      }),

    /**
     * Deletar relatório agendado
     */
    delete: protectedProcedure
      .input(z.object({
        reportId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await deleteScheduledReport(input.reportId);
        return { success: true };
      }),

    /**
     * Obter histórico de execução de um relatório
     */
    executionHistory: protectedProcedure
      .input(z.object({
        reportId: z.number(),
        limit: z.number().default(20),
      }))
      .query(async ({ input }) => {
        return getReportExecutionLogs(input.reportId, input.limit);
      }),
  }),
});

export type AppRouter = typeof appRouter;
