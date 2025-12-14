import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a administradores' });
  }
  return next({ ctx });
});

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
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

  // Templates de avaliação
  template: router({
    list: publicProcedure.query(async () => {
      return await db.getActiveEvaluationTemplates();
    }),

    listAll: adminProcedure.query(async () => {
      return await db.getAllEvaluationTemplates();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const template = await db.getEvaluationTemplateById(input.id);
        if (!template) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Template não encontrado' });
        }
        return template;
      }),

    create: adminProcedure
      .input(z.object({
        name: z.string().min(1, 'Nome é obrigatório'),
        description: z.string().optional(),
        structure: z.string().min(1, 'Estrutura é obrigatória'),
        isActive: z.boolean().default(true),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createEvaluationTemplate({
          ...input,
          createdBy: ctx.user.id,
        });
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        structure: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateEvaluationTemplate(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteEvaluationTemplate(input.id);
        return { success: true };
      }),
  }),

  // Avaliações
  evaluation: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const asEvaluated = await db.getEvaluationsByEvaluatedUser(ctx.user.id);
      const asEvaluator = await db.getEvaluationsByEvaluator(ctx.user.id);
      return { asEvaluated, asEvaluator };
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const evaluation = await db.getEvaluationById(input.id);
        if (!evaluation) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Avaliação não encontrada' });
        }
        const isEvaluated = evaluation.evaluatedUserId === ctx.user.id;
        const isEvaluator = evaluation.evaluatorId === ctx.user.id;
        const isAdmin = ctx.user.role === 'admin';
        if (!isEvaluated && !isEvaluator && !isAdmin) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Sem permissão' });
        }
        return evaluation;
      }),

    create: protectedProcedure
      .input(z.object({
        templateId: z.number(),
        evaluatedUserId: z.number(),
        period: z.string().min(1),
        responses: z.string().min(1),
        comments: z.string().optional(),
        score: z.number().min(0).max(100).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createEvaluation({ ...input, evaluatorId: ctx.user.id, status: 'draft' });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        responses: z.string().optional(),
        comments: z.string().optional(),
        score: z.number().min(0).max(100).optional(),
        status: z.enum(['draft', 'submitted', 'approved', 'rejected']).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const evaluation = await db.getEvaluationById(id);
        if (!evaluation) throw new TRPCError({ code: 'NOT_FOUND' });
        if (evaluation.evaluatorId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        const updateData: any = { ...data };
        if (data.status === 'submitted' && !evaluation.submittedAt) updateData.submittedAt = new Date();
        if (data.status === 'approved' && !evaluation.approvedAt) updateData.approvedAt = new Date();
        await db.updateEvaluation(id, updateData);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const evaluation = await db.getEvaluationById(input.id);
        if (!evaluation) throw new TRPCError({ code: 'NOT_FOUND' });
        if (evaluation.evaluatorId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        await db.deleteEvaluation(input.id);
        return { success: true };
      }),
  }),

  // Notificações
  notification: router({
    getSettings: protectedProcedure.query(async ({ ctx }) => {
      const settings = await db.getNotificationSettings(ctx.user.id);
      if (!settings) {
        return {
          userId: ctx.user.id,
          notifyOnNewEvaluation: true,
          notifyPendingReminders: true,
          notifyOnStatusChange: true,
          reminderDaysBefore: 7,
          reminderFrequency: 'weekly' as const,
        };
      }
      return settings;
    }),

    updateSettings: protectedProcedure
      .input(z.object({
        notifyOnNewEvaluation: z.boolean().optional(),
        notifyPendingReminders: z.boolean().optional(),
        notifyOnStatusChange: z.boolean().optional(),
        reminderDaysBefore: z.number().min(1).max(30).optional(),
        reminderFrequency: z.enum(['daily', 'weekly']).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.upsertNotificationSettings({ userId: ctx.user.id, ...input });
        return { success: true };
      }),

    getLogs: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(50).optional() }))
      .query(async ({ ctx, input }) => {
        const logs = await db.getNotificationLogsByUser(ctx.user.id);
        return logs.slice(0, input?.limit || 50);
      }),

    getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUnreadNotificationCount(ctx.user.id);
    }),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationAsRead(input.id);
        return { success: true };
      }),

    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    }),
  }),

  // Relatórios
  report: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === 'admin') return await db.getAllReports();
      return await db.getReportsByUser(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const report = await db.getReportById(input.id);
        if (!report) throw new TRPCError({ code: 'NOT_FOUND' });
        if (report.generatedBy !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return report;
      }),

    generate: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        type: z.enum(['performance_overview', 'team_comparison', 'individual_progress', 'custom']),
        period: z.string().min(1),
        data: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createReport({ ...input, generatedBy: ctx.user.id });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const report = await db.getReportById(input.id);
        if (!report) throw new TRPCError({ code: 'NOT_FOUND' });
        if (report.generatedBy !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        await db.deleteReport(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
