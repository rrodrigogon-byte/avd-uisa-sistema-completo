/**
 * AVD Router - Sistema de Avaliação de Desempenho em 5 Passos
 * Sistema AVD UISA
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { 
  avdAssessmentProcesses,
  avdCompetencyAssessments,
  avdCompetencyAssessmentItems,
  avdPerformanceAssessments,
  avdDevelopmentPlans,
  avdDevelopmentActions,
  avdDevelopmentActionProgress,
  competencies,
  employees,
  psychometricTests,
  notifications,
} from "../drizzle/schema";
import { eq, and, desc, lte, gte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const avdRouter = router({
  // ============================================================================
  // GERENCIAMENTO DE PROCESSOS AVD
  // ============================================================================
  
  /**
   * Iniciar novo processo de avaliação AVD
   */
  startProcess: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar se já existe processo em andamento
      const existingProcess = await db.select()
        .from(avdAssessmentProcesses)
        .where(
          and(
            eq(avdAssessmentProcesses.employeeId, input.employeeId),
            eq(avdAssessmentProcesses.status, 'em_andamento')
          )
        )
        .limit(1);

      if (existingProcess.length > 0) {
        return existingProcess[0];
      }

      // Criar novo processo
      const [result] = await db.insert(avdAssessmentProcesses).values({
        employeeId: input.employeeId,
        status: 'em_andamento',
        currentStep: 1,
        createdBy: ctx.user.id,
      });

      return { id: result.insertId };
    }),

  /**
   * Buscar processo AVD por funcionário
   */
  getProcessByEmployee: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const processes = await db.select()
        .from(avdAssessmentProcesses)
        .where(eq(avdAssessmentProcesses.employeeId, input.employeeId))
        .orderBy(desc(avdAssessmentProcesses.createdAt))
        .limit(1);

      return processes.length > 0 ? processes[0] : null;
    }),

  /**
   * Atualizar passo atual do processo
   */
  updateProcessStep: protectedProcedure
    .input(z.object({
      processId: z.number(),
      step: z.number().min(1).max(5),
      stepId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updateData: any = {
        currentStep: input.step,
        updatedAt: new Date(),
      };

      // Marcar data de conclusão do passo
      const completedAtField = `step${input.step}CompletedAt` as keyof typeof avdAssessmentProcesses;
      updateData[completedAtField] = new Date();

      // Salvar ID do registro do passo
      if (input.stepId) {
        const stepIdField = `step${input.step}Id` as keyof typeof avdAssessmentProcesses;
        updateData[stepIdField] = input.stepId;
      }

      // Se chegou no passo 5, marcar como concluído
      if (input.step === 5) {
        updateData.status = 'concluido';
        updateData.completedAt = new Date();
      }

      await db.update(avdAssessmentProcesses)
        .set(updateData)
        .where(eq(avdAssessmentProcesses.id, input.processId));

      return { success: true };
    }),

  // ============================================================================
  // PASSO 3: AVALIAÇÃO DE COMPETÊNCIAS
  // ============================================================================

  /**
   * Listar competências disponíveis
   */
  listCompetencies: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const allCompetencies = await db.select().from(competencies);
      return allCompetencies;
    }),

  /**
   * Criar avaliação de competências
   */
  createCompetencyAssessment: protectedProcedure
    .input(z.object({
      processId: z.number(),
      employeeId: z.number(),
      assessmentType: z.enum(['autoavaliacao', 'avaliacao_gestor', 'avaliacao_pares']),
      evaluatorId: z.number().optional(),
      items: z.array(z.object({
        competencyId: z.number(),
        score: z.number().min(1).max(5),
        comments: z.string().optional(),
        behaviorExamples: z.string().optional(),
      })),
      comments: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Calcular pontuação geral (média dos scores)
      const totalScore = input.items.reduce((sum, item) => sum + item.score, 0);
      const overallScore = Math.round((totalScore / input.items.length / 5) * 100);

      // Criar avaliação
      const [assessmentResult] = await db.insert(avdCompetencyAssessments).values({
        processId: input.processId,
        employeeId: input.employeeId,
        assessmentType: input.assessmentType,
        evaluatorId: input.evaluatorId ?? null,
        status: 'concluida',
        overallScore,
        comments: input.comments ?? null,
        completedAt: new Date(),
      });

      const assessmentId = assessmentResult.insertId;

      // Criar itens da avaliação
      for (const item of input.items) {
        await db.insert(avdCompetencyAssessmentItems).values({
          assessmentId,
          competencyId: item.competencyId,
          score: item.score,
          comments: item.comments ?? null,
          behaviorExamples: item.behaviorExamples ?? null,
        });
      }

      return { 
        id: assessmentId,
        overallScore,
      };
    }),

  /**
   * Buscar avaliação de competências por processo
   */
  getCompetencyAssessmentByProcess: protectedProcedure
    .input(z.object({
      processId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const assessments = await db.select()
        .from(avdCompetencyAssessments)
        .where(eq(avdCompetencyAssessments.processId, input.processId))
        .orderBy(desc(avdCompetencyAssessments.createdAt))
        .limit(1);

      if (assessments.length === 0) return null;

      const assessment = assessments[0];

      // Buscar itens da avaliação
      const items = await db.select()
        .from(avdCompetencyAssessmentItems)
        .where(eq(avdCompetencyAssessmentItems.assessmentId, assessment.id));

      return {
        ...assessment,
        items,
      };
    }),

  // ============================================================================
  // PASSO 4: AVALIAÇÃO DE DESEMPENHO
  // ============================================================================

  /**
   * Criar avaliação de desempenho consolidada
   */
  createPerformanceAssessment: protectedProcedure
    .input(z.object({
      processId: z.number(),
      employeeId: z.number(),
      profileScore: z.number().optional(),
      pirScore: z.number().optional(),
      competencyScore: z.number(),
      profileWeight: z.number().default(20),
      pirWeight: z.number().default(20),
      competencyWeight: z.number().default(60),
      strengthsAnalysis: z.string().optional(),
      gapsAnalysis: z.string().optional(),
      developmentRecommendations: z.string().optional(),
      careerRecommendations: z.string().optional(),
      evaluatorComments: z.string().optional(),
      evaluatorId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Calcular pontuação final ponderada
      const profileScoreWeighted = (input.profileScore || 0) * (input.profileWeight / 100);
      const pirScoreWeighted = (input.pirScore || 0) * (input.pirWeight / 100);
      const competencyScoreWeighted = input.competencyScore * (input.competencyWeight / 100);
      
      const finalScore = Math.round(profileScoreWeighted + pirScoreWeighted + competencyScoreWeighted);

      // Determinar classificação de desempenho
      let performanceRating: 'insatisfatorio' | 'abaixo_expectativas' | 'atende_expectativas' | 'supera_expectativas' | 'excepcional';
      if (finalScore < 40) {
        performanceRating = 'insatisfatorio';
      } else if (finalScore < 60) {
        performanceRating = 'abaixo_expectativas';
      } else if (finalScore < 75) {
        performanceRating = 'atende_expectativas';
      } else if (finalScore < 90) {
        performanceRating = 'supera_expectativas';
      } else {
        performanceRating = 'excepcional';
      }

      // Criar avaliação de desempenho
      const [result] = await db.insert(avdPerformanceAssessments).values({
        processId: input.processId,
        employeeId: input.employeeId,
        profileScore: input.profileScore ?? null,
        pirScore: input.pirScore ?? null,
        competencyScore: input.competencyScore,
        profileWeight: input.profileWeight,
        pirWeight: input.pirWeight,
        competencyWeight: input.competencyWeight,
        finalScore,
        performanceRating,
        strengthsAnalysis: input.strengthsAnalysis ?? null,
        gapsAnalysis: input.gapsAnalysis ?? null,
        developmentRecommendations: input.developmentRecommendations ?? null,
        careerRecommendations: input.careerRecommendations ?? null,
        evaluatorComments: input.evaluatorComments ?? null,
        evaluatorId: input.evaluatorId ?? null,
        status: 'concluida',
        completedAt: new Date(),
      });

      return {
        id: result.insertId,
        finalScore,
        performanceRating,
      };
    }),

  /**
   * Buscar avaliação de desempenho por processo
   */
  getPerformanceAssessmentByProcess: protectedProcedure
    .input(z.object({
      processId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const assessments = await db.select()
        .from(avdPerformanceAssessments)
        .where(eq(avdPerformanceAssessments.processId, input.processId))
        .orderBy(desc(avdPerformanceAssessments.createdAt))
        .limit(1);

      return assessments.length > 0 ? assessments[0] : null;
    }),

  // ============================================================================
  // PASSO 5: PLANO DE DESENVOLVIMENTO INDIVIDUAL (PDI)
  // ============================================================================

  /**
   * Criar PDI
   */
  createDevelopmentPlan: protectedProcedure
    .input(z.object({
      processId: z.number(),
      employeeId: z.number(),
      performanceAssessmentId: z.number(),
      title: z.string(),
      description: z.string().optional(),
      startDate: z.string(),
      endDate: z.string(),
      objectives: z.string().optional(),
      actions: z.array(z.object({
        competencyId: z.number().optional(),
        title: z.string(),
        description: z.string().optional(),
        actionType: z.enum(['experiencia_pratica', 'mentoria_feedback', 'treinamento_formal']),
        category: z.string().optional(),
        responsibleId: z.number().optional(),
        dueDate: z.string(),
        successMetrics: z.string().optional(),
        expectedOutcome: z.string().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Criar PDI
      const [planResult] = await db.insert(avdDevelopmentPlans).values({
        processId: input.processId,
        employeeId: input.employeeId,
        performanceAssessmentId: input.performanceAssessmentId,
        title: input.title,
        description: input.description ?? null,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        objectives: input.objectives ?? null,
        status: 'aprovado',
        createdBy: ctx.user.id,
        approvedBy: ctx.user.id,
        approvedAt: new Date(),
      });

      const planId = planResult.insertId;

      // Criar ações de desenvolvimento
      for (const action of input.actions) {
        await db.insert(avdDevelopmentActions).values({
          planId,
          competencyId: action.competencyId ?? null,
          title: action.title,
          description: action.description ?? null,
          actionType: action.actionType,
          category: action.category ?? null,
          responsibleId: action.responsibleId ?? null,
          dueDate: new Date(action.dueDate),
          successMetrics: action.successMetrics ?? null,
          expectedOutcome: action.expectedOutcome ?? null,
          status: 'nao_iniciada',
          progress: 0,
        });
      }

      return { id: planId };
    }),

  /**
   * Buscar PDI por processo
   */
  getDevelopmentPlanByProcess: protectedProcedure
    .input(z.object({
      processId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const plans = await db.select()
        .from(avdDevelopmentPlans)
        .where(eq(avdDevelopmentPlans.processId, input.processId))
        .orderBy(desc(avdDevelopmentPlans.createdAt))
        .limit(1);

      if (plans.length === 0) return null;

      const plan = plans[0];

      // Buscar ações do PDI
      const actions = await db.select()
        .from(avdDevelopmentActions)
        .where(eq(avdDevelopmentActions.planId, plan.id));

      return {
        ...plan,
        actions,
      };
    }),

  /**
   * Atualizar progresso de uma ação
   */
  updateActionProgress: protectedProcedure
    .input(z.object({
      actionId: z.number(),
      progressPercent: z.number().min(0).max(100),
      comments: z.string().optional(),
      evidenceUrl: z.string().optional(),
      evidenceType: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Registrar progresso
      await db.insert(avdDevelopmentActionProgress).values({
        actionId: input.actionId,
        progressPercent: input.progressPercent,
        comments: input.comments ?? null,
        evidenceUrl: input.evidenceUrl ?? null,
        evidenceType: input.evidenceType ?? null,
        registeredBy: ctx.user.id,
      });

      // Atualizar ação
      const updateData: any = {
        progress: input.progressPercent,
        updatedAt: new Date(),
      };

      // Atualizar status baseado no progresso
      if (input.progressPercent === 0) {
        updateData.status = 'nao_iniciada';
      } else if (input.progressPercent === 100) {
        updateData.status = 'concluida';
        updateData.completedAt = new Date();
      } else {
        updateData.status = 'em_andamento';
      }

      await db.update(avdDevelopmentActions)
        .set(updateData)
        .where(eq(avdDevelopmentActions.id, input.actionId));

      // Recalcular progresso geral do PDI
      const action = await db.select()
        .from(avdDevelopmentActions)
        .where(eq(avdDevelopmentActions.id, input.actionId))
        .limit(1);

      if (action.length > 0) {
        const planId = action[0].planId;
        const allActions = await db.select()
          .from(avdDevelopmentActions)
          .where(eq(avdDevelopmentActions.planId, planId));

        const totalProgress = allActions.reduce((sum, a) => sum + (a.progress || 0), 0);
        const overallProgress = Math.round(totalProgress / allActions.length);

        await db.update(avdDevelopmentPlans)
          .set({ 
            overallProgress,
            updatedAt: new Date(),
          })
          .where(eq(avdDevelopmentPlans.id, planId));
      }

      return { success: true };
    }),

  /**
   * Salvar dados de um passo do processo
   */
  saveProcessData: protectedProcedure
    .input(z.object({
      processId: z.string().optional(),
      step: z.number().min(1).max(5),
      data: z.record(z.string(), z.any()).optional().default({}),
      employeeId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log('[AVD] saveProcessData chamado:', {
        userId: ctx.user.id,
        processId: input.processId,
        step: input.step,
        employeeId: input.employeeId,
        dataKeys: Object.keys(input.data || {}),
      });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      let processId = input.processId ? parseInt(input.processId) : null;

      // Se não tem processId, criar novo processo
      if (!processId) {
        const [result] = await db.insert(avdAssessmentProcesses).values({
          employeeId: input.employeeId,
          status: 'em_andamento',
          currentStep: input.step,
          createdBy: ctx.user.id,
          step1Data: input.step === 1 ? input.data : null,
          step2Data: input.step === 2 ? input.data : null,
          step3Data: input.step === 3 ? input.data : null,
          step4Data: input.step === 4 ? input.data : null,
          step5Data: input.step === 5 ? input.data : null,
        });
        processId = result.insertId;
      } else {
        // Atualizar processo existente
        const updateData: any = {
          updatedAt: new Date(),
        };

        // Atualizar passo atual se for maior
        const [process] = await db.select()
          .from(avdAssessmentProcesses)
          .where(eq(avdAssessmentProcesses.id, processId))
          .limit(1);

        if (process && input.step > process.currentStep) {
          updateData.currentStep = input.step;
        }

        // Salvar dados do passo específico
        if (input.step === 1) updateData.step1Data = input.data;
        if (input.step === 2) updateData.step2Data = input.data;
        if (input.step === 3) updateData.step3Data = input.data;
        if (input.step === 4) updateData.step4Data = input.data;
        if (input.step === 5) updateData.step5Data = input.data;

        await db.update(avdAssessmentProcesses)
          .set(updateData)
          .where(eq(avdAssessmentProcesses.id, processId));
      }

      return { processId: processId.toString(), success: true };
    }),

  /**
   * Buscar dados salvos de um passo
   */
  getProcessData: protectedProcedure
    .input(z.object({
      processId: z.string(),
      step: z.number().min(1).max(5),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const processIdNum = parseInt(input.processId);
      const [process] = await db.select()
        .from(avdAssessmentProcesses)
        .where(eq(avdAssessmentProcesses.id, processIdNum))
        .limit(1);

      if (!process) {
        return { data: null };
      }

      // Retornar dados do passo específico
      let stepData = null;
      if (input.step === 1) stepData = process.step1Data;
      if (input.step === 2) stepData = process.step2Data;
      if (input.step === 3) stepData = process.step3Data;
      if (input.step === 4) stepData = process.step4Data;
      if (input.step === 5) stepData = process.step5Data;

      return { data: stepData };
    }),

  /**
   * Buscar progresso do processo AVD
   */
  getProcessProgress: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [process] = await db.select()
        .from(avdAssessmentProcesses)
        .where(eq(avdAssessmentProcesses.employeeId, input.employeeId))
        .orderBy(desc(avdAssessmentProcesses.createdAt))
        .limit(1);

      if (!process) {
        return {
          processId: null,
          currentStep: 1,
          completedSteps: 0,
          status: 'nao_iniciado' as const,
        };
      }

      // Calcular passos completados baseado no currentStep
      const completedSteps = process.currentStep > 1 ? process.currentStep - 1 : 0;

      return {
        processId: process.id.toString(),
        currentStep: process.currentStep,
        completedSteps,
        status: process.status,
      };
    }),

  // ============================================================================
  // DASHBOARD ADMINISTRATIVO
  // ============================================================================

  /**
   * Listar todos os processos AVD (Admin/RH)
   */
  listAllProcesses: protectedProcedure
    .input(z.object({
      status: z.enum(['em_andamento', 'concluido', 'cancelado']).optional(),
      departmentId: z.number().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar permissão
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'rh') {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      const conditions = [];
      if (input.status) {
        conditions.push(eq(avdAssessmentProcesses.status, input.status));
      }

      const processes = await db.select({
        process: avdAssessmentProcesses,
        employee: employees,
      })
        .from(avdAssessmentProcesses)
        .leftJoin(employees, eq(avdAssessmentProcesses.employeeId, employees.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(avdAssessmentProcesses.updatedAt))
        .limit(input.limit)
        .offset(input.offset);

      return processes;
    }),

  /**
   * Obter estatísticas do dashboard administrativo
   */
  getAdminStats: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar permissão
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'rh') {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      // Total de processos em andamento
      const [inProgress] = await db.select({ count: sql<number>`count(*)` })
        .from(avdAssessmentProcesses)
        .where(eq(avdAssessmentProcesses.status, 'em_andamento'));

      // Total de processos concluídos
      const [completed] = await db.select({ count: sql<number>`count(*)` })
        .from(avdAssessmentProcesses)
        .where(eq(avdAssessmentProcesses.status, 'concluido'));

      // Processos por passo
      const byStep = await db.select({
        step: avdAssessmentProcesses.currentStep,
        count: sql<number>`count(*)`,
      })
        .from(avdAssessmentProcesses)
        .where(eq(avdAssessmentProcesses.status, 'em_andamento'))
        .groupBy(avdAssessmentProcesses.currentStep);

      return {
        totalInProgress: inProgress.count,
        totalCompleted: completed.count,
        byStep: byStep.map(s => ({ step: s.step, count: s.count })),
      };
    }),

  /**
   * Obter detalhes completos de um processo (Admin/RH)
   */
  getProcessDetails: protectedProcedure
    .input(z.object({
      processId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar permissão
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'rh') {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      // Buscar processo
      const [process] = await db.select()
        .from(avdAssessmentProcesses)
        .where(eq(avdAssessmentProcesses.id, input.processId))
        .limit(1);

      if (!process) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Processo não encontrado" });
      }

      // Buscar dados do funcionário
      const [employee] = await db.select()
        .from(employees)
        .where(eq(employees.id, process.employeeId))
        .limit(1);

      // Buscar avaliação de competências
      const [competencyAssessment] = await db.select()
        .from(avdCompetencyAssessments)
        .where(eq(avdCompetencyAssessments.processId, input.processId))
        .limit(1);

      // Buscar avaliação de desempenho
      const [performanceAssessment] = await db.select()
        .from(avdPerformanceAssessments)
        .where(eq(avdPerformanceAssessments.processId, input.processId))
        .limit(1);

      // Buscar PDI
      const [developmentPlan] = await db.select()
        .from(avdDevelopmentPlans)
        .where(eq(avdDevelopmentPlans.processId, input.processId))
        .limit(1);

      return {
        process,
        employee,
        competencyAssessment,
        performanceAssessment,
        developmentPlan,
      };
    }),

  // ============================================================================
  // SISTEMA DE NOTIFICAÇÕES
  // ============================================================================

  /**
   * Enviar notificação de início de processo
   */
  sendProcessStartNotification: protectedProcedure
    .input(z.object({
      processId: z.number(),
      employeeId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar dados do funcionário
      const [employee] = await db.select()
        .from(employees)
        .where(eq(employees.id, input.employeeId))
        .limit(1);

      if (!employee || !employee.userId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Funcionário não encontrado" });
      }

      // Criar notificação
      await db.insert(notifications).values({
        userId: employee.userId,
        type: 'avd_process_started',
        title: 'Processo AVD Iniciado',
        message: `Seu processo de Avaliação de Desempenho foi iniciado. Acesse o sistema para começar.`,
        link: `/avd/processo/dashboard`,
        read: false,
      });

      return { success: true };
    }),

  /**
   * Enviar notificação de passo concluído
   */
  sendStepCompletedNotification: protectedProcedure
    .input(z.object({
      processId: z.number(),
      employeeId: z.number(),
      step: z.number().min(1).max(5),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [employee] = await db.select()
        .from(employees)
        .where(eq(employees.id, input.employeeId))
        .limit(1);

      if (!employee || !employee.userId) {
        return { success: false };
      }

      const stepNames = {
        1: 'Dados Pessoais',
        2: 'PIR',
        3: 'Competências',
        4: 'Desempenho',
        5: 'PDI',
      };

      const stepName = stepNames[input.step as keyof typeof stepNames];
      const nextStep = input.step + 1;

      let message = `Parabéns! Você concluiu o passo ${input.step}: ${stepName}.`;
      if (nextStep <= 5) {
        message += ` Continue para o próximo passo.`;
      } else {
        message += ` Processo AVD concluído com sucesso!`;
      }

      await db.insert(notifications).values({
        userId: employee.userId,
        type: 'avd_step_completed',
        title: `Passo ${input.step} Concluído`,
        message,
        link: `/avd/processo/dashboard`,
        read: false,
      });

      return { success: true };
    }),

  /**
   * Enviar lembrete de passo pendente
   */
  sendStepReminderNotification: protectedProcedure
    .input(z.object({
      processId: z.number(),
      employeeId: z.number(),
      currentStep: z.number().min(1).max(5),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [employee] = await db.select()
        .from(employees)
        .where(eq(employees.id, input.employeeId))
        .limit(1);

      if (!employee || !employee.userId) {
        return { success: false };
      }

      const stepNames = {
        1: 'Dados Pessoais',
        2: 'PIR',
        3: 'Competências',
        4: 'Desempenho',
        5: 'PDI',
      };

      const stepName = stepNames[input.currentStep as keyof typeof stepNames];

      await db.insert(notifications).values({
        userId: employee.userId,
        type: 'avd_step_reminder',
        title: 'Lembrete: Processo AVD Pendente',
        message: `Você tem o passo ${input.currentStep}: ${stepName} pendente. Não esqueça de concluir sua avaliação.`,
        link: `/avd/processo/passo${input.currentStep}`,
        read: false,
      });

      return { success: true };
    }),

  /**
   * Listar processos com prazos próximos (para envio de lembretes)
   */
  getProcessesNeedingReminders: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar permissão
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'rh') {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      // Buscar processos em andamento há mais de 7 dias sem atualização
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const processes = await db.select({
        process: avdAssessmentProcesses,
        employee: employees,
      })
        .from(avdAssessmentProcesses)
        .leftJoin(employees, eq(avdAssessmentProcesses.employeeId, employees.id))
        .where(
          and(
            eq(avdAssessmentProcesses.status, 'em_andamento'),
            lte(avdAssessmentProcesses.updatedAt, sevenDaysAgo)
          )
        )
        .orderBy(avdAssessmentProcesses.updatedAt);

      return processes;
    }),

  // ============================================================================
  // RELATÓRIOS E EXPORTAÇÃO
  // ============================================================================

  /**
   * Gerar relatório consolidado de processos
   */
  generateConsolidatedReport: protectedProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      departmentId: z.number().optional(),
      status: z.enum(['em_andamento', 'concluido', 'cancelado']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar permissão
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'rh') {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      const conditions = [];
      if (input.status) {
        conditions.push(eq(avdAssessmentProcesses.status, input.status));
      }
      if (input.startDate) {
        conditions.push(gte(avdAssessmentProcesses.createdAt, input.startDate));
      }
      if (input.endDate) {
        conditions.push(lte(avdAssessmentProcesses.createdAt, input.endDate));
      }

      // Buscar processos com dados relacionados
      const processes = await db.select({
        process: avdAssessmentProcesses,
        employee: employees,
      })
        .from(avdAssessmentProcesses)
        .leftJoin(employees, eq(avdAssessmentProcesses.employeeId, employees.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(avdAssessmentProcesses.createdAt));

      // Para cada processo, buscar avaliações
      const detailedProcesses = await Promise.all(
        processes.map(async (item) => {
          const [competencyAssessment] = await db.select()
            .from(avdCompetencyAssessments)
            .where(eq(avdCompetencyAssessments.processId, item.process.id))
            .limit(1);

          const [performanceAssessment] = await db.select()
            .from(avdPerformanceAssessments)
            .where(eq(avdPerformanceAssessments.processId, item.process.id))
            .limit(1);

          const [developmentPlan] = await db.select()
            .from(avdDevelopmentPlans)
            .where(eq(avdDevelopmentPlans.processId, item.process.id))
            .limit(1);

          return {
            ...item,
            competencyAssessment,
            performanceAssessment,
            developmentPlan,
          };
        })
      );

      // Calcular estatísticas do relatório
      const totalProcesses = detailedProcesses.length;
      const completedProcesses = detailedProcesses.filter(
        (p) => p.process.status === 'concluido'
      ).length;
      const inProgressProcesses = detailedProcesses.filter(
        (p) => p.process.status === 'em_andamento'
      ).length;

      // Média de pontuação de desempenho
      const performanceScores = detailedProcesses
        .filter((p) => p.performanceAssessment)
        .map((p) => p.performanceAssessment!.finalScore);
      const avgPerformanceScore =
        performanceScores.length > 0
          ? Math.round(
              performanceScores.reduce((sum, score) => sum + score, 0) /
                performanceScores.length
            )
          : 0;

      return {
        summary: {
          totalProcesses,
          completedProcesses,
          inProgressProcesses,
          avgPerformanceScore,
          completionRate:
            totalProcesses > 0
              ? Math.round((completedProcesses / totalProcesses) * 100)
              : 0,
        },
        processes: detailedProcesses,
        generatedAt: new Date(),
      };
    }),

  /**
   * Obter dados para exportação em CSV/Excel
   */
  getExportData: protectedProcedure
    .input(z.object({
      status: z.enum(['em_andamento', 'concluido', 'cancelado']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar permissão
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'rh') {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      const conditions = [];
      if (input.status) {
        conditions.push(eq(avdAssessmentProcesses.status, input.status));
      }

      const processes = await db.select({
        processId: avdAssessmentProcesses.id,
        employeeName: employees.nome,
        employeeChapa: employees.chapa,
        employeeCargo: employees.cargo,
        employeeDepartamento: employees.departamento,
        status: avdAssessmentProcesses.status,
        currentStep: avdAssessmentProcesses.currentStep,
        createdAt: avdAssessmentProcesses.createdAt,
        updatedAt: avdAssessmentProcesses.updatedAt,
        completedAt: avdAssessmentProcesses.completedAt,
      })
        .from(avdAssessmentProcesses)
        .leftJoin(employees, eq(avdAssessmentProcesses.employeeId, employees.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(avdAssessmentProcesses.createdAt));

      return processes;
    }),
});
