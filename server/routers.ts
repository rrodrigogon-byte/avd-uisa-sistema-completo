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

  // PIR - Plano Individual de Resultados
  pir: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === 'admin') {
        const asUser = await db.getPirsByUser(ctx.user.id);
        const asManager = await db.getPirsByManager(ctx.user.id);
        return { asUser, asManager };
      }
      const asUser = await db.getPirsByUser(ctx.user.id);
      return { asUser, asManager: [] };
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const pir = await db.getPirById(input.id);
        if (!pir) throw new TRPCError({ code: 'NOT_FOUND', message: 'PIR não encontrado' });
        const isOwner = pir.userId === ctx.user.id;
        const isManager = pir.managerId === ctx.user.id;
        const isAdmin = ctx.user.role === 'admin';
        if (!isOwner && !isManager && !isAdmin) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return pir;
      }),

    create: protectedProcedure
      .input(z.object({
        userId: z.number(),
        title: z.string().min(1, 'Título é obrigatório'),
        description: z.string().optional(),
        period: z.string().min(1, 'Período é obrigatório'),
        evaluationId: z.number().optional(),
        startDate: z.date(),
        endDate: z.date(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createPir({ ...input, managerId: ctx.user.id, status: 'draft' });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(['draft', 'active', 'completed', 'cancelled']).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const pir = await db.getPirById(id);
        if (!pir) throw new TRPCError({ code: 'NOT_FOUND' });
        if (pir.managerId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        const updateData: any = { ...data };
        if (data.status === 'active' && !pir.approvedAt) updateData.approvedAt = new Date();
        await db.updatePir(id, updateData);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const pir = await db.getPirById(input.id);
        if (!pir) throw new TRPCError({ code: 'NOT_FOUND' });
        if (pir.managerId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        await db.deletePir(input.id);
        return { success: true };
      }),

    // Metas do PIR
    createGoal: protectedProcedure
      .input(z.object({
        pirId: z.number(),
        title: z.string().min(1, 'Título é obrigatório'),
        description: z.string().optional(),
        weight: z.number().min(0).max(100),
        targetValue: z.number().optional(),
        unit: z.string().optional(),
        deadline: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const pir = await db.getPirById(input.pirId);
        if (!pir) throw new TRPCError({ code: 'NOT_FOUND' });
        if (pir.managerId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return await db.createPirGoal(input);
      }),

    getGoals: protectedProcedure
      .input(z.object({ pirId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPirGoalsByPirId(input.pirId);
      }),

    updateGoal: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        weight: z.number().min(0).max(100).optional(),
        currentValue: z.number().optional(),
        status: z.enum(['not_started', 'in_progress', 'completed', 'blocked']).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updatePirGoal(id, data);
        return { success: true };
      }),

    deleteGoal: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePirGoal(input.id);
        return { success: true };
      }),

    // Progresso das metas
    recordProgress: protectedProcedure
      .input(z.object({
        goalId: z.number(),
        value: z.number(),
        comments: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createPirProgress({ ...input, recordedBy: ctx.user.id });
      }),

    getProgress: protectedProcedure
      .input(z.object({ goalId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPirProgressByGoalId(input.goalId);
      }),

    // Workflow de aprovação
    submitForApproval: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const pir = await db.getPirById(input.id);
        if (!pir) throw new TRPCError({ code: 'NOT_FOUND', message: 'PIR não encontrado' });
        if (pir.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas o proprietário pode submeter o PIR' });
        }
        if (pir.status !== 'rascunho') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Apenas PIRs em rascunho podem ser submetidos' });
        }
        await db.updatePir(input.id, { status: 'em_analise', submittedAt: new Date() });
        await db.createPirApprovalHistory({
          pirId: input.id,
          action: 'submetido',
          performedBy: ctx.user.id,
          previousStatus: 'rascunho',
          newStatus: 'em_analise',
        });
        return { success: true };
      }),

    approve: protectedProcedure
      .input(z.object({ id: z.number(), comments: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const pir = await db.getPirById(input.id);
        if (!pir) throw new TRPCError({ code: 'NOT_FOUND', message: 'PIR não encontrado' });
        if (pir.managerId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas o gestor responsável ou admin pode aprovar' });
        }
        if (pir.status !== 'em_analise') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Apenas PIRs em análise podem ser aprovados' });
        }
        await db.updatePir(input.id, {
          status: 'aprovado',
          approvedBy: ctx.user.id,
          approvedAt: new Date(),
          approvalComments: input.comments,
        });
        await db.createPirApprovalHistory({
          pirId: input.id,
          action: 'aprovado',
          performedBy: ctx.user.id,
          comments: input.comments,
          previousStatus: 'em_analise',
          newStatus: 'aprovado',
        });
        return { success: true };
      }),

    reject: protectedProcedure
      .input(z.object({ id: z.number(), comments: z.string().min(1, 'Comentários são obrigatórios para rejeição') }))
      .mutation(async ({ input, ctx }) => {
        const pir = await db.getPirById(input.id);
        if (!pir) throw new TRPCError({ code: 'NOT_FOUND', message: 'PIR não encontrado' });
        if (pir.managerId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas o gestor responsável ou admin pode rejeitar' });
        }
        if (pir.status !== 'em_analise') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Apenas PIRs em análise podem ser rejeitados' });
        }
        await db.updatePir(input.id, {
          status: 'rejeitado',
          rejectedBy: ctx.user.id,
          rejectedAt: new Date(),
          approvalComments: input.comments,
        });
        await db.createPirApprovalHistory({
          pirId: input.id,
          action: 'rejeitado',
          performedBy: ctx.user.id,
          comments: input.comments,
          previousStatus: 'em_analise',
          newStatus: 'rejeitado',
        });
        return { success: true };
      }),

    getApprovalHistory: protectedProcedure
      .input(z.object({ pirId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPirApprovalHistory(input.pirId);
      }),
  }),

  // Descrições de Cargo
  jobDescription: router({
    list: publicProcedure.query(async () => {
      return await db.getActiveJobDescriptions();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const jobDesc = await db.getJobDescriptionById(input.id);
        if (!jobDesc) throw new TRPCError({ code: 'NOT_FOUND', message: 'Descrição de cargo não encontrada' });
        return jobDesc;
      }),

    getByCode: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        return await db.getJobDescriptionsByCode(input.code);
      }),

    create: adminProcedure
      .input(z.object({
        title: z.string().min(1, 'Título é obrigatório'),
        code: z.string().min(1, 'Código é obrigatório'),
        department: z.string().optional(),
        level: z.string().optional(),
        summary: z.string().optional(),
        mission: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createJobDescription({ ...input, createdBy: ctx.user.id });
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        department: z.string().optional(),
        level: z.string().optional(),
        summary: z.string().optional(),
        mission: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateJobDescription(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteJobDescription(input.id);
        return { success: true };
      }),

    // Responsabilidades
    addResponsibility: adminProcedure
      .input(z.object({
        jobDescriptionId: z.number(),
        description: z.string().min(1),
        displayOrder: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        return await db.createJobResponsibility(input);
      }),

    getResponsibilities: publicProcedure
      .input(z.object({ jobDescriptionId: z.number() }))
      .query(async ({ input }) => {
        return await db.getJobResponsibilitiesByJobId(input.jobDescriptionId);
      }),

    deleteResponsibility: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteJobResponsibility(input.id);
        return { success: true };
      }),

    // Competências Técnicas
    addTechnicalCompetency: adminProcedure
      .input(z.object({
        jobDescriptionId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        requiredLevel: z.number().min(1).max(5),
        displayOrder: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        return await db.createTechnicalCompetency(input);
      }),

    getTechnicalCompetencies: publicProcedure
      .input(z.object({ jobDescriptionId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTechnicalCompetenciesByJobId(input.jobDescriptionId);
      }),

    deleteTechnicalCompetency: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTechnicalCompetency(input.id);
        return { success: true };
      }),

    // Competências Comportamentais
    addBehavioralCompetency: adminProcedure
      .input(z.object({
        jobDescriptionId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        requiredLevel: z.number().min(1).max(5),
        displayOrder: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        return await db.createBehavioralCompetency(input);
      }),

    getBehavioralCompetencies: publicProcedure
      .input(z.object({ jobDescriptionId: z.number() }))
      .query(async ({ input }) => {
        return await db.getBehavioralCompetenciesByJobId(input.jobDescriptionId);
      }),

    deleteBehavioralCompetency: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteBehavioralCompetency(input.id);
        return { success: true };
      }),

    // Requisitos
    addRequirement: adminProcedure
      .input(z.object({
        jobDescriptionId: z.number(),
        type: z.enum(['education', 'experience', 'certification', 'other']),
        description: z.string().min(1),
        isRequired: z.boolean().default(true),
        displayOrder: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        return await db.createJobRequirement(input);
      }),

    getRequirements: publicProcedure
      .input(z.object({ jobDescriptionId: z.number() }))
      .query(async ({ input }) => {
        return await db.getJobRequirementsByJobId(input.jobDescriptionId);
      }),

    deleteRequirement: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteJobRequirement(input.id);
        return { success: true };
      }),

    // Workflow de aprovação
    submitForApproval: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const jobDesc = await db.getJobDescriptionById(input.id);
        if (!jobDesc) throw new TRPCError({ code: 'NOT_FOUND', message: 'Descrição de cargo não encontrada' });
        if (jobDesc.status !== 'rascunho') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Apenas descrições em rascunho podem ser submetidas' });
        }
        await db.updateJobDescription(input.id, { status: 'em_analise', submittedAt: new Date() });
        await db.createJobDescriptionApprovalHistory({
          jobDescriptionId: input.id,
          action: 'submetido',
          performedBy: ctx.user.id,
          previousStatus: 'rascunho',
          newStatus: 'em_analise',
        });
        return { success: true };
      }),

    approve: adminProcedure
      .input(z.object({ id: z.number(), comments: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const jobDesc = await db.getJobDescriptionById(input.id);
        if (!jobDesc) throw new TRPCError({ code: 'NOT_FOUND', message: 'Descrição de cargo não encontrada' });
        if (jobDesc.status !== 'em_analise') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Apenas descrições em análise podem ser aprovadas' });
        }
        await db.updateJobDescription(input.id, {
          status: 'aprovado',
          isActive: true,
          approvedBy: ctx.user.id,
          approvedAt: new Date(),
          approvalComments: input.comments,
        });
        await db.createJobDescriptionApprovalHistory({
          jobDescriptionId: input.id,
          action: 'aprovado',
          performedBy: ctx.user.id,
          comments: input.comments,
          previousStatus: 'em_analise',
          newStatus: 'aprovado',
        });
        return { success: true };
      }),

    reject: adminProcedure
      .input(z.object({ id: z.number(), comments: z.string().min(1, 'Comentários são obrigatórios para rejeição') }))
      .mutation(async ({ input, ctx }) => {
        const jobDesc = await db.getJobDescriptionById(input.id);
        if (!jobDesc) throw new TRPCError({ code: 'NOT_FOUND', message: 'Descrição de cargo não encontrada' });
        if (jobDesc.status !== 'em_analise') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Apenas descrições em análise podem ser rejeitadas' });
        }
        await db.updateJobDescription(input.id, {
          status: 'rejeitado',
          rejectedBy: ctx.user.id,
          rejectedAt: new Date(),
          approvalComments: input.comments,
        });
        await db.createJobDescriptionApprovalHistory({
          jobDescriptionId: input.id,
          action: 'rejeitado',
          performedBy: ctx.user.id,
          comments: input.comments,
          previousStatus: 'em_analise',
          newStatus: 'rejeitado',
        });
        return { success: true };
      }),

    getApprovalHistory: publicProcedure
      .input(z.object({ jobDescriptionId: z.number() }))
      .query(async ({ input }) => {
        return await db.getJobDescriptionApprovalHistory(input.jobDescriptionId);
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
