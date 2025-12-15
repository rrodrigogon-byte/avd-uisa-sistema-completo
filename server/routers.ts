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
          reminderFrequency: 'weekly' as 'daily' | 'weekly',
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
        // Notificar usuário sobre aprovação
        await db.createNotificationLog({
          userId: pir.userId,
          type: 'status_change',
          title: 'PIR Aprovado',
          content: `Seu PIR "${pir.title}" foi aprovado. ${input.comments || ''}`,
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
        // Notificar usuário sobre rejeição
        await db.createNotificationLog({
          userId: pir.userId,
          type: 'status_change',
          title: 'PIR Rejeitado',
          content: `Seu PIR "${pir.title}" foi rejeitado. Motivo: ${input.comments}`,
        });
        return { success: true };
      }),

    reopen: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const pir = await db.getPirById(input.id);
        if (!pir) throw new TRPCError({ code: 'NOT_FOUND', message: 'PIR não encontrado' });
        if (pir.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas o proprietário ou admin pode reabrir' });
        }
        if (pir.status !== 'rejeitado') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Apenas PIRs rejeitados podem ser reabertos' });
        }
        await db.updatePir(input.id, {
          status: 'rascunho',
          rejectedBy: null,
          rejectedAt: null,
          approvalComments: null,
        });
        await db.createPirApprovalHistory({
          pirId: input.id,
          action: 'reaberto',
          performedBy: ctx.user.id,
          previousStatus: 'rejeitado',
          newStatus: 'rascunho',
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
        // Notificar criador sobre aprovação
        await db.createNotificationLog({
          userId: jobDesc.createdBy,
          type: 'status_change',
          title: 'Descrição de Cargo Aprovada',
          content: `A descrição de cargo "${jobDesc.title}" foi aprovada. ${input.comments || ''}`,
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
        // Notificar criador sobre rejeição
        await db.createNotificationLog({
          userId: jobDesc.createdBy,
          type: 'status_change',
          title: 'Descrição de Cargo Rejeitada',
          content: `A descrição de cargo "${jobDesc.title}" foi rejeitada. Motivo: ${input.comments}`,
        });
        return { success: true };
      }),

    reopen: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const jobDesc = await db.getJobDescriptionById(input.id);
        if (!jobDesc) throw new TRPCError({ code: 'NOT_FOUND', message: 'Descrição de cargo não encontrada' });
        if (jobDesc.status !== 'rejeitado') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Apenas descrições rejeitadas podem ser reabertas' });
        }
        await db.updateJobDescription(input.id, {
          status: 'rascunho',
          rejectedBy: null,
          rejectedAt: null,
          approvalComments: null,
        });
        await db.createJobDescriptionApprovalHistory({
          jobDescriptionId: input.id,
          action: 'reaberto',
          performedBy: ctx.user.id,
          previousStatus: 'rejeitado',
          newStatus: 'rascunho',
        });
        return { success: true };
      }),

    archive: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const jobDesc = await db.getJobDescriptionById(input.id);
        if (!jobDesc) throw new TRPCError({ code: 'NOT_FOUND', message: 'Descrição de cargo não encontrada' });
        if (jobDesc.status !== 'aprovado') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Apenas descrições aprovadas podem ser arquivadas' });
        }
        await db.updateJobDescription(input.id, {
          status: 'arquivado',
          isActive: false,
        });
        await db.createJobDescriptionApprovalHistory({
          jobDescriptionId: input.id,
          action: 'arquivado',
          performedBy: ctx.user.id,
          previousStatus: 'aprovado',
          newStatus: 'arquivado',
        });
        return { success: true };
      }),

    getApprovalHistory: publicProcedure
      .input(z.object({ jobDescriptionId: z.number() }))
      .query(async ({ input }) => {
        return await db.getJobDescriptionApprovalHistory(input.jobDescriptionId);
      }),
  }),

  // Analytics e Gráficos
  analytics: router({
    // Gráfico de evolução de desempenho
    performanceEvolution: protectedProcedure
      .input(z.object({ userId: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        const userId = input.userId || ctx.user.id;
        const evaluations = await db.getEvaluationsByEvaluatedUser(userId);
        const approved = evaluations.filter((e: any) => e.status === 'approved' && e.score !== null);
        return approved.map((e: any) => ({
          period: e.period,
          score: e.score,
          date: e.approvedAt || e.createdAt,
        }));
      }),

    // Gráfico de comparação de competências
    competencyComparison: protectedProcedure
      .input(z.object({ jobDescriptionId: z.number() }))
      .query(async ({ input }) => {
        const technical = await db.getTechnicalCompetenciesByJobId(input.jobDescriptionId);
        const behavioral = await db.getBehavioralCompetenciesByJobId(input.jobDescriptionId);
        return {
          technical: technical.map((c: any) => ({
            name: c.name,
            currentLevel: Math.floor(Math.random() * 5) + 1, // TODO: Implementar lógica real
            requiredLevel: c.requiredLevel,
          })),
          behavioral: behavioral.map((c: any) => ({
            name: c.name,
            currentLevel: Math.floor(Math.random() * 5) + 1, // TODO: Implementar lógica real
            requiredLevel: c.requiredLevel,
          })),
        };
      }),

    // Gráfico de distribuição por departamento
    departmentDistribution: adminProcedure
      .query(async () => {
        const database = await db.getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        const { evaluations, jobDescriptions } = await import('../drizzle/schema');
        const allEvaluations = await database.select().from(evaluations);
        const allJobDescriptions = await database.select().from(jobDescriptions);
        
        // Agrupar por departamento
        const deptMap = new Map<string, { scores: number[], count: number }>();
        
        for (const evaluation of allEvaluations) {
          if (evaluation.status === 'approved' && evaluation.score !== null) {
            // Encontrar departamento do usuário avaliado (simplificado)
            const dept = 'Departamento Geral'; // TODO: Implementar lógica real de departamento
            if (!deptMap.has(dept)) {
              deptMap.set(dept, { scores: [], count: 0 });
            }
            const deptData = deptMap.get(dept)!;
            deptData.scores.push(evaluation.score);
            deptData.count++;
          }
        }
        
        // Adicionar departamentos das descrições de cargo
        for (const job of allJobDescriptions) {
          if (job.department && !deptMap.has(job.department)) {
            deptMap.set(job.department, { scores: [], count: 0 });
          }
        }
        
        return Array.from(deptMap.entries()).map(([department, data]) => {
          const averageScore = data.scores.length > 0
            ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length
            : 0;
          const minScore = data.scores.length > 0 ? Math.min(...data.scores) : 0;
          const maxScore = data.scores.length > 0 ? Math.max(...data.scores) : 0;
          return {
            department,
            averageScore,
            evaluationCount: data.count,
            minScore,
            maxScore,
          };
        });
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

  // ==================== METAS (GOALS) ====================
  goal: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getGoalsByUser(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const goal = await db.getGoalById(input.id);
        if (!goal) throw new TRPCError({ code: 'NOT_FOUND', message: 'Meta não encontrada' });
        if (goal.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return goal;
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        type: z.enum(['individual', 'team', 'organizational']).default('individual'),
        category: z.string().optional(),
        targetValue: z.number().optional(),
        currentValue: z.number().default(0),
        unit: z.string().optional(),
        status: z.enum(['not_started', 'in_progress', 'completed', 'cancelled', 'overdue']).default('not_started'),
        priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
        startDate: z.date(),
        deadline: z.date(),
        managerId: z.number().optional(),
        weight: z.number().default(100),
        evaluationCycle: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createGoal({ ...input, userId: ctx.user.id });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        targetValue: z.number().optional(),
        currentValue: z.number().optional(),
        status: z.enum(['not_started', 'in_progress', 'completed', 'cancelled', 'overdue']).optional(),
        priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        deadline: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const goal = await db.getGoalById(id);
        if (!goal) throw new TRPCError({ code: 'NOT_FOUND' });
        if (goal.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        await db.updateGoal(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const goal = await db.getGoalById(input.id);
        if (!goal) throw new TRPCError({ code: 'NOT_FOUND' });
        if (goal.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        await db.deleteGoal(input.id);
        return { success: true };
      }),

    addProgress: protectedProcedure
      .input(z.object({
        goalId: z.number(),
        value: z.number(),
        percentage: z.number(),
        comments: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const goal = await db.getGoalById(input.goalId);
        if (!goal) throw new TRPCError({ code: 'NOT_FOUND' });
        if (goal.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return await db.createGoalProgress({ ...input, recordedBy: ctx.user.id });
      }),

    getProgress: protectedProcedure
      .input(z.object({ goalId: z.number() }))
      .query(async ({ input, ctx }) => {
        const goal = await db.getGoalById(input.goalId);
        if (!goal) throw new TRPCError({ code: 'NOT_FOUND' });
        if (goal.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return await db.getGoalProgress(input.goalId);
      }),
  }),

  // ==================== PDI (DEVELOPMENT PLANS) ====================
  developmentPlan: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getDevelopmentPlansByUser(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const plan = await db.getDevelopmentPlanById(input.id);
        if (!plan) throw new TRPCError({ code: 'NOT_FOUND', message: 'PDI não encontrado' });
        if (plan.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        const actions = await db.getDevelopmentActionsByPlan(input.id);
        return { ...plan, actions };
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        period: z.string().min(1),
        status: z.enum(['rascunho', 'ativo', 'concluido', 'cancelado']).default('rascunho'),
        managerId: z.number(),
        startDate: z.date(),
        endDate: z.date(),
        evaluationId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createDevelopmentPlan({ ...input, userId: ctx.user.id });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(['rascunho', 'ativo', 'concluido', 'cancelado']).optional(),
        completionPercentage: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const plan = await db.getDevelopmentPlanById(id);
        if (!plan) throw new TRPCError({ code: 'NOT_FOUND' });
        if (plan.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        await db.updateDevelopmentPlan(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const plan = await db.getDevelopmentPlanById(input.id);
        if (!plan) throw new TRPCError({ code: 'NOT_FOUND' });
        if (plan.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        await db.deleteDevelopmentPlan(input.id);
        return { success: true };
      }),

    addAction: protectedProcedure
      .input(z.object({
        planId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        type: z.enum(['training', 'course', 'mentoring', 'project', 'reading', 'certification', 'other']),
        status: z.enum(['not_started', 'in_progress', 'completed', 'cancelled']).default('not_started'),
        deadline: z.date().optional(),
        comments: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const plan = await db.getDevelopmentPlanById(input.planId);
        if (!plan) throw new TRPCError({ code: 'NOT_FOUND' });
        if (plan.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return await db.createDevelopmentAction(input);
      }),

    updateAction: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(['not_started', 'in_progress', 'completed', 'cancelled']).optional(),
        completedAt: z.date().optional(),
        comments: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        await db.updateDevelopmentAction(id, data);
        return { success: true };
      }),

    deleteAction: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteDevelopmentAction(input.id);
        return { success: true };
      }),
  }),

  // ==================== SUCESSÃO ====================
  succession: router({
    listPlans: protectedProcedure.query(async () => {
      return await db.getAllSuccessionPlans();
    }),

    getPlanById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const plan = await db.getSuccessionPlanById(input.id);
        if (!plan) throw new TRPCError({ code: 'NOT_FOUND', message: 'Plano de sucessão não encontrado' });
        const candidates = await db.getSuccessionCandidatesByPlan(input.id);
        return { ...plan, candidates };
      }),

    createPlan: adminProcedure
      .input(z.object({
        position: z.string().min(1),
        jobDescriptionId: z.number().optional(),
        department: z.string().optional(),
        currentOccupantId: z.number().optional(),
        vacancyRisk: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
        estimatedVacancyDate: z.date().optional(),
        status: z.enum(['ativo', 'em_andamento', 'concluido', 'cancelado']).default('ativo'),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createSuccessionPlan({ ...input, createdBy: ctx.user.id });
      }),

    updatePlan: adminProcedure
      .input(z.object({
        id: z.number(),
        position: z.string().optional(),
        vacancyRisk: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        estimatedVacancyDate: z.date().optional(),
        status: z.enum(['ativo', 'em_andamento', 'concluido', 'cancelado']).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateSuccessionPlan(id, data);
        return { success: true };
      }),

    deletePlan: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteSuccessionPlan(input.id);
        return { success: true };
      }),

    addCandidate: adminProcedure
      .input(z.object({
        planId: z.number(),
        candidateId: z.number(),
        readinessLevel: z.enum(['ready_now', 'ready_1_year', 'ready_2_years', 'ready_3_years', 'not_ready']),
        potential: z.enum(['low', 'medium', 'high']).default('medium'),
        performance: z.enum(['below', 'meets', 'exceeds', 'outstanding']).default('meets'),
        competencyGaps: z.string().optional(),
        developmentPlanId: z.number().optional(),
        notes: z.string().optional(),
        priority: z.number().default(1),
      }))
      .mutation(async ({ input }) => {
        return await db.createSuccessionCandidate(input);
      }),

    updateCandidate: adminProcedure
      .input(z.object({
        id: z.number(),
        readinessLevel: z.enum(['ready_now', 'ready_1_year', 'ready_2_years', 'ready_3_years', 'not_ready']).optional(),
        potential: z.enum(['low', 'medium', 'high']).optional(),
        performance: z.enum(['below', 'meets', 'exceeds', 'outstanding']).optional(),
        competencyGaps: z.string().optional(),
        notes: z.string().optional(),
        priority: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateSuccessionCandidate(id, data);
        return { success: true };
      }),

    deleteCandidate: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteSuccessionCandidate(input.id);
        return { success: true };
      }),

    addReadinessAssessment: adminProcedure
      .input(z.object({
        candidateId: z.number(),
        assessmentDate: z.date(),
        readinessLevel: z.enum(['ready_now', 'ready_1_year', 'ready_2_years', 'ready_3_years', 'not_ready']),
        strengths: z.string().optional(),
        developmentAreas: z.string().optional(),
        recommendations: z.string().optional(),
        overallScore: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createReadinessAssessment({ ...input, assessorId: ctx.user.id });
      }),

    getReadinessAssessments: protectedProcedure
      .input(z.object({ candidateId: z.number() }))
      .query(async ({ input }) => {
        return await db.getReadinessAssessmentsByCandidate(input.candidateId);
      }),
  }),

  // ==================== PESSOAS (EMPLOYEES) ====================
  employee: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllEmployees();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const employee = await db.getEmployeeById(input.id);
        if (!employee) throw new TRPCError({ code: 'NOT_FOUND', message: 'Funcionário não encontrado' });
        const history = await db.getPositionHistoryByEmployee(input.id);
        return { ...employee, history };
      }),

    getByUserId: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return await db.getEmployeeByUserId(input.userId);
      }),

    create: adminProcedure
      .input(z.object({
        userId: z.number(),
        employeeNumber: z.string().optional(),
        department: z.string().optional(),
        position: z.string().optional(),
        level: z.string().optional(),
        managerId: z.number().optional(),
        hireDate: z.date().optional(),
        contractType: z.enum(['clt', 'pj', 'estagio', 'temporario', 'terceirizado']).optional(),
        status: z.enum(['ativo', 'ferias', 'afastado', 'desligado']).default('ativo'),
        location: z.string().optional(),
        phone: z.string().optional(),
        birthDate: z.date().optional(),
        baseSalary: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createEmployee(input);
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        employeeNumber: z.string().optional(),
        department: z.string().optional(),
        position: z.string().optional(),
        level: z.string().optional(),
        managerId: z.number().optional(),
        contractType: z.enum(['clt', 'pj', 'estagio', 'temporario', 'terceirizado']).optional(),
        status: z.enum(['ativo', 'ferias', 'afastado', 'desligado']).optional(),
        location: z.string().optional(),
        phone: z.string().optional(),
        baseSalary: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateEmployee(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteEmployee(input.id);
        return { success: true };
      }),

    addPositionHistory: adminProcedure
      .input(z.object({
        employeeId: z.number(),
        type: z.enum(['admissao', 'promocao', 'transferencia', 'rebaixamento', 'desligamento']),
        previousPosition: z.string().optional(),
        newPosition: z.string(),
        previousDepartment: z.string().optional(),
        newDepartment: z.string().optional(),
        previousSalary: z.number().optional(),
        newSalary: z.number().optional(),
        effectiveDate: z.date(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createPositionHistory({ ...input, approvedBy: ctx.user.id });
      }),

    getPositionHistory: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPositionHistoryByEmployee(input.employeeId);
      }),
  }),

  // ==================== TEMPO (TIME RECORDS) ====================
  timeRecord: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const employee = await db.getEmployeeByUserId(ctx.user.id);
      if (!employee) throw new TRPCError({ code: 'NOT_FOUND', message: 'Funcionário não encontrado' });
      return await db.getTimeRecordsByEmployee(employee.id);
    }),

    create: protectedProcedure
      .input(z.object({
        date: z.date(),
        checkIn: z.date().optional(),
        lunchOut: z.date().optional(),
        lunchIn: z.date().optional(),
        checkOut: z.date().optional(),
        totalMinutes: z.number().optional(),
        overtimeMinutes: z.number().default(0),
        status: z.enum(['normal', 'falta', 'atestado', 'ferias', 'folga', 'pendente_ajuste']).default('normal'),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const employee = await db.getEmployeeByUserId(ctx.user.id);
        if (!employee) throw new TRPCError({ code: 'NOT_FOUND', message: 'Funcionário não encontrado' });
        return await db.createTimeRecord({ ...input, employeeId: employee.id });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        checkIn: z.date().optional(),
        lunchOut: z.date().optional(),
        lunchIn: z.date().optional(),
        checkOut: z.date().optional(),
        totalMinutes: z.number().optional(),
        overtimeMinutes: z.number().optional(),
        status: z.enum(['normal', 'falta', 'atestado', 'ferias', 'folga', 'pendente_ajuste']).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const record = await db.getTimeRecordById(id);
        if (!record) throw new TRPCError({ code: 'NOT_FOUND' });
        const employee = await db.getEmployeeByUserId(ctx.user.id);
        if (!employee || record.employeeId !== employee.id) {
          if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        }
        await db.updateTimeRecord(id, data);
        return { success: true };
      }),

    requestAdjustment: protectedProcedure
      .input(z.object({
        timeRecordId: z.number(),
        type: z.enum(['entrada', 'saida', 'almoco_saida', 'almoco_retorno', 'justificativa_falta']),
        originalValue: z.date().optional(),
        requestedValue: z.date().optional(),
        justification: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createTimeAdjustment({ ...input, requestedBy: ctx.user.id });
      }),

    listAdjustments: protectedProcedure.query(async ({ ctx }) => {
      const employee = await db.getEmployeeByUserId(ctx.user.id);
      if (!employee) throw new TRPCError({ code: 'NOT_FOUND', message: 'Funcionário não encontrado' });
      return await db.getTimeAdjustmentsByEmployee(employee.id);
    }),

    reviewAdjustment: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['aprovado', 'rejeitado']),
        reviewComments: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, status, reviewComments } = input;
        await db.updateTimeAdjustment(id, {
          status,
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          reviewComments,
        });
        return { success: true };
      }),

    getTimeBank: protectedProcedure.query(async ({ ctx }) => {
      const employee = await db.getEmployeeByUserId(ctx.user.id);
      if (!employee) throw new TRPCError({ code: 'NOT_FOUND', message: 'Funcionário não encontrado' });
      return await db.getTimeBankByEmployee(employee.id);
    }),
  }),

  // ==================== PENDÊNCIAS ====================
  pendency: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getPendenciesByUser(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        type: z.enum(['avaliacao', 'aprovacao', 'documento', 'meta', 'pdi', 'ponto', 'treinamento', 'outro']),
        title: z.string().min(1),
        description: z.string().optional(),
        priority: z.enum(['baixa', 'media', 'alta', 'urgente']).default('media'),
        dueDate: z.date().optional(),
        referenceId: z.number().optional(),
        referenceType: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createPendency({ ...input, userId: ctx.user.id });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['pendente', 'em_andamento', 'concluida', 'cancelada']).optional(),
        completedAt: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        await db.updatePendency(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePendency(input.id);
        return { success: true };
      }),
  }),

  // ==================== APROVAÇÕES ====================
  approval: router({
    listPending: protectedProcedure.query(async ({ ctx }) => {
      return await db.getApprovalsByApprover(ctx.user.id);
    }),

    listRequested: protectedProcedure.query(async ({ ctx }) => {
      return await db.getApprovalsByRequester(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        itemType: z.enum(['pir', 'job_description', 'time_adjustment', 'development_plan', 'bonus', 'expense', 'outro']),
        itemId: z.number(),
        title: z.string().min(1),
        approverId: z.number(),
        priority: z.enum(['baixa', 'media', 'alta', 'urgente']).default('media'),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createApproval({ ...input, requestedBy: ctx.user.id });
      }),

    approve: protectedProcedure
      .input(z.object({
        id: z.number(),
        comments: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, comments } = input;
        await db.updateApproval(id, {
          status: 'aprovado',
          comments,
          decidedAt: new Date(),
        });
        return { success: true };
      }),

    reject: protectedProcedure
      .input(z.object({
        id: z.number(),
        comments: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, comments } = input;
        await db.updateApproval(id, {
          status: 'rejeitado',
          comments,
          decidedAt: new Date(),
        });
        return { success: true };
      }),
  }),

  // ==================== BÔNUS ====================
  bonus: router({
    listPrograms: protectedProcedure.query(async () => {
      return await db.getAllBonusPrograms();
    }),

    getProgramById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const program = await db.getBonusProgramById(input.id);
        if (!program) throw new TRPCError({ code: 'NOT_FOUND', message: 'Programa de bônus não encontrado' });
        const eligibility = await db.getBonusEligibilityByProgram(input.id);
        const calculations = await db.getBonusCalculationsByProgram(input.id);
        return { ...program, eligibility, calculations };
      }),

    createProgram: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        type: z.enum(['performance', 'goal_achievement', 'profit_sharing', 'retention', 'project', 'spot']),
        period: z.string().min(1),
        startDate: z.date(),
        endDate: z.date(),
        totalBudget: z.number().optional(),
        status: z.enum(['planejamento', 'ativo', 'em_calculo', 'pago', 'cancelado']).default('planejamento'),
        eligibilityCriteria: z.string().optional(),
        calculationFormula: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createBonusProgram({ ...input, createdBy: ctx.user.id });
      }),

    updateProgram: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(['planejamento', 'ativo', 'em_calculo', 'pago', 'cancelado']).optional(),
        totalBudget: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateBonusProgram(id, data);
        return { success: true };
      }),

    deleteProgram: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteBonusProgram(input.id);
        return { success: true };
      }),

    addEligibility: adminProcedure
      .input(z.object({
        programId: z.number(),
        employeeId: z.number(),
        isEligible: z.boolean().default(true),
        ineligibilityReason: z.string().optional(),
        multiplier: z.number().default(100),
      }))
      .mutation(async ({ input }) => {
        return await db.createBonusEligibility(input);
      }),

    calculateBonus: adminProcedure
      .input(z.object({
        programId: z.number(),
        employeeId: z.number(),
        baseAmount: z.number(),
        appliedMultipliers: z.string().optional(),
        finalAmount: z.number(),
        performanceScore: z.number().optional(),
        goalAchievementPercentage: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createBonusCalculation({ ...input, calculatedBy: ctx.user.id });
      }),

    getMyBonuses: protectedProcedure.query(async ({ ctx }) => {
      const employee = await db.getEmployeeByUserId(ctx.user.id);
      if (!employee) return [];
      return await db.getBonusCalculationsByEmployee(employee.id);
    }),
  }),

  // ==================== ADMINISTRAÇÃO ====================
  admin: router({
    // Ciclos de Avaliação
    listCycles: adminProcedure.query(async () => {
      return await db.getAllEvaluationCycles();
    }),

    getCycleById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getEvaluationCycleById(input.id);
      }),

    createCycle: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        year: z.number(),
        type: z.enum(['anual', 'semestral', 'trimestral', 'mensal']),
        startDate: z.date(),
        endDate: z.date(),
        status: z.enum(['planejamento', 'ativo', 'em_avaliacao', 'concluido', 'cancelado']).default('planejamento'),
        defaultTemplateId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createEvaluationCycle({ ...input, createdBy: ctx.user.id });
      }),

    updateCycle: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        status: z.enum(['planejamento', 'ativo', 'em_avaliacao', 'concluido', 'cancelado']).optional(),
        defaultTemplateId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateEvaluationCycle(id, data);
        return { success: true };
      }),

    // Competências
    listCompetencies: adminProcedure.query(async () => {
      return await db.getAllCompetencies();
    }),

    createCompetency: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        type: z.enum(['tecnica', 'comportamental', 'lideranca']),
        description: z.string().optional(),
        category: z.string().optional(),
        proficiencyLevels: z.string().optional(),
        isActive: z.boolean().default(true),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createCompetency({ ...input, createdBy: ctx.user.id });
      }),

    updateCompetency: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCompetency(id, data);
        return { success: true };
      }),

    deleteCompetency: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCompetency(input.id);
        return { success: true };
      }),

    // Departamentos
    listDepartments: protectedProcedure.query(async () => {
      return await db.getAllDepartments();
    }),

    createDepartment: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        code: z.string().optional(),
        description: z.string().optional(),
        parentId: z.number().optional(),
        managerId: z.number().optional(),
        isActive: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        return await db.createDepartment(input);
      }),

    updateDepartment: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        managerId: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateDepartment(id, data);
        return { success: true };
      }),

    deleteDepartment: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteDepartment(input.id);
        return { success: true };
      }),

    // Logs do Sistema
    getSystemLogs: adminProcedure
      .input(z.object({ limit: z.number().default(100) }))
      .query(async ({ input }) => {
        return await db.getSystemLogs(input.limit);
      }),
  }),
});

export type AppRouter = typeof appRouter;
