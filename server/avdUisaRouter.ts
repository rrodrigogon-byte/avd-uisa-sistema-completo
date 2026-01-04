import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  evaluationCycles,
  performanceEvaluations,
  evaluationQuestions,
  evaluationResponses,
  employees,
  departments,
  positions,
  users,
  notifications,
} from "../drizzle/schema";
import { and, eq, gte, lte, desc, sql, or, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Router AVD UISA - Sistema de Avaliação de Desempenho
 * Focado em: ciclos anuais, workflow hierárquico, aprovações e relatórios
 */

export const avdUisaRouter = router({
  // ============================================================================
  // CICLOS DE AVALIAÇÃO
  // ============================================================================

  /**
   * Listar ciclos de avaliação
   */
  listCycles: protectedProcedure
    .input(
      z.object({
        year: z.number().optional(),
        status: z.enum(["planejado", "ativo", "concluido", "cancelado"]).optional(),
      })
    .optional())
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [];
      if (input.year) conditions.push(eq(evaluationCycles.year, input.year));
      if (input.status) conditions.push(eq(evaluationCycles.status, input.status));

      const cycles = await db
        .select()
        .from(evaluationCycles)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(evaluationCycles.year), desc(evaluationCycles.startDate));

      return cycles;
    }),

  /**
   * Criar novo ciclo de avaliação (apenas admin/rh)
   */
  createCycle: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        year: z.number().int().min(2020).max(2100),
        type: z.enum(["anual", "semestral", "trimestral"]),
        startDate: z.date(),
        endDate: z.date(),
        description: z.string().optional(),
        selfEvaluationDeadline: z.date().optional(),
        managerEvaluationDeadline: z.date().optional(),
        consensusDeadline: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar permissão
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores e RH podem criar ciclos" });
      }

      // Validar datas
      if (input.endDate <= input.startDate) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Data de término deve ser posterior à data de início" });
      }

      const [result] = await db.insert(evaluationCycles).values({
        name: input.name,
        year: input.year,
        type: input.type,
        startDate: input.startDate,
        endDate: input.endDate,
        description: input.description,
        selfEvaluationDeadline: input.selfEvaluationDeadline,
        managerEvaluationDeadline: input.managerEvaluationDeadline,
        consensusDeadline: input.consensusDeadline,
        status: "planejado",
        active: true,
      });

      return { id: result.insertId, success: true };
    }),

  /**
   * Ativar ciclo de avaliação
   */
  activateCycle: protectedProcedure
    .input(z.object({ cycleId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores e RH podem ativar ciclos" });
      }

      await db
        .update(evaluationCycles)
        .set({ status: "ativo", updatedAt: new Date() })
        .where(eq(evaluationCycles.id, input.cycleId));

      return { success: true };
    }),

  // ============================================================================
  // AVALIAÇÕES
  // ============================================================================

  /**
   * Listar minhas avaliações pendentes
   */
  myPendingEvaluations: protectedProcedure.input(z.object({}).optional()).query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Buscar employee do usuário
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.userId, ctx.user.id))
      .limit(1);

    if (!employee) {
      return { selfEvaluations: [], managerEvaluations: [] };
    }

    // Autoavaliações pendentes
    const selfEvaluations = await db
      .select({
        evaluation: performanceEvaluations,
        cycle: evaluationCycles,
        employee: employees,
        department: departments,
        position: positions,
      })
      .from(performanceEvaluations)
      .leftJoin(evaluationCycles, eq(performanceEvaluations.cycleId, evaluationCycles.id))
      .leftJoin(employees, eq(performanceEvaluations.employeeId, employees.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(positions, eq(employees.positionId, positions.id))
      .where(
        and(
          eq(performanceEvaluations.employeeId, employee.id),
          eq(performanceEvaluations.selfEvaluationCompleted, false),
          eq(evaluationCycles.status, "ativo")
        )
      )
      .orderBy(evaluationCycles.selfEvaluationDeadline);

    // Avaliações de subordinados pendentes (se for gestor)
    const managerEvaluations = await db
      .select({
        evaluation: performanceEvaluations,
        cycle: evaluationCycles,
        employee: employees,
        department: departments,
        position: positions,
      })
      .from(performanceEvaluations)
      .leftJoin(evaluationCycles, eq(performanceEvaluations.cycleId, evaluationCycles.id))
      .leftJoin(employees, eq(performanceEvaluations.employeeId, employees.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(positions, eq(employees.positionId, positions.id))
      .where(
        and(
          eq(employees.managerId, employee.id),
          eq(performanceEvaluations.managerEvaluationCompleted, false),
          eq(performanceEvaluations.selfEvaluationCompleted, true),
          eq(evaluationCycles.status, "ativo")
        )
      )
      .orderBy(evaluationCycles.managerEvaluationDeadline);

    return {
      selfEvaluations,
      managerEvaluations,
    };
  }),

  /**
   * Obter detalhes de uma avaliação
   */
  getEvaluation: protectedProcedure
    .input(z.object({ evaluationId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [evaluation] = await db
        .select({
          evaluation: performanceEvaluations,
          cycle: evaluationCycles,
          employee: employees,
          department: departments,
          position: positions,
        })
        .from(performanceEvaluations)
        .leftJoin(evaluationCycles, eq(performanceEvaluations.cycleId, evaluationCycles.id))
        .leftJoin(employees, eq(performanceEvaluations.employeeId, employees.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .leftJoin(positions, eq(employees.positionId, positions.id))
        .where(eq(performanceEvaluations.id, input.evaluationId))
        .limit(1);

      if (!evaluation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Avaliação não encontrada" });
      }

      // Verificar permissão
      const [currentEmployee] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, ctx.user.id))
        .limit(1);

      const isOwner = evaluation.employee?.id === currentEmployee?.id;
      const isManager = evaluation.employee?.managerId === currentEmployee?.id;
      const isAdmin = ctx.user.role === "admin" || ctx.user.role === "rh";

      if (!isOwner && !isManager && !isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para visualizar esta avaliação" });
      }

      // Buscar questões do ciclo
      const questions = await db
        .select()
        .from(evaluationQuestions)
        .where(eq(evaluationQuestions.active, true))
        .orderBy(evaluationQuestions.category, evaluationQuestions.id);

      // Buscar respostas existentes
      const responses = await db
        .select()
        .from(evaluationResponses)
        .where(eq(evaluationResponses.evaluationId, input.evaluationId));

      return {
        ...evaluation,
        questions,
        responses,
        permissions: {
          canEditSelf: isOwner && !evaluation.evaluation.selfEvaluationCompleted,
          canEditManager: isManager && evaluation.evaluation.selfEvaluationCompleted && !evaluation.evaluation.managerEvaluationCompleted,
          isAdmin,
        },
      };
    }),

  /**
   * Salvar respostas de avaliação (rascunho ou submissão)
   */
  saveEvaluationResponses: protectedProcedure
    .input(
      z.object({
        evaluationId: z.number(),
        evaluatorType: z.enum(["self", "manager", "peer", "subordinate"]),
        responses: z.array(
          z.object({
            questionId: z.number(),
            score: z.number().min(1).max(5).optional(),
            textResponse: z.string().optional(),
          })
        ),
        submit: z.boolean().default(false), // true = submeter, false = salvar rascunho
        managerComments: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar avaliação
      const [evaluation] = await db
        .select()
        .from(performanceEvaluations)
        .where(eq(performanceEvaluations.id, input.evaluationId))
        .limit(1);

      if (!evaluation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Avaliação não encontrada" });
      }

      // Buscar employee do usuário
      const [currentEmployee] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, ctx.user.id))
        .limit(1);

      if (!currentEmployee) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Funcionário não encontrado" });
      }

      // Verificar permissão
      const isOwner = evaluation.employeeId === currentEmployee.id;
      const [evaluatedEmployee] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, evaluation.employeeId))
        .limit(1);
      const isManager = evaluatedEmployee?.managerId === currentEmployee.id;

      if (input.evaluatorType === "self" && !isOwner) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas o próprio funcionário pode fazer autoavaliação" });
      }

      if (input.evaluatorType === "manager" && !isManager) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas o gestor direto pode avaliar" });
      }

      // Deletar respostas antigas deste avaliador
      await db
        .delete(evaluationResponses)
        .where(
          and(
            eq(evaluationResponses.evaluationId, input.evaluationId),
            eq(evaluationResponses.evaluatorId, currentEmployee.id),
            eq(evaluationResponses.evaluatorType, input.evaluatorType)
          )
        );

      // Inserir novas respostas
      if (input.responses.length > 0) {
        await db.insert(evaluationResponses).values(
          input.responses.map((r) => ({
            evaluationId: input.evaluationId,
            questionId: r.questionId,
            evaluatorId: currentEmployee.id,
            evaluatorType: input.evaluatorType,
            score: r.score,
            textResponse: r.textResponse,
          }))
        );
      }

      // Se for submissão, atualizar status
      if (input.submit) {
        const updateData: any = {
          updatedAt: new Date(),
        };

        if (input.evaluatorType === "self") {
          updateData.selfEvaluationCompleted = true;
          updateData.selfCompletedAt = new Date();
          updateData.workflowStatus = "pending_manager";

          // Calcular score da autoavaliação
          const avgScore = input.responses.reduce((sum, r) => sum + (r.score || 0), 0) / input.responses.length;
          updateData.selfScore = Math.round(avgScore * 20); // Converter escala 1-5 para 0-100

          // Notificar gestor
          if (evaluatedEmployee?.managerId) {
            const [manager] = await db
              .select()
              .from(employees)
              .where(eq(employees.id, evaluatedEmployee.managerId))
              .limit(1);

            if (manager?.userId) {
              await db.insert(notifications).values({
                userId: manager.userId,
                type: "avaliacao_pendente",
                title: "Avaliação Pendente",
                message: `${evaluatedEmployee.name} completou a autoavaliação. Aguardando sua avaliação como gestor.`,
                link: `/avaliacoes/${input.evaluationId}`,
                read: false,
              });
            }
          }
        } else if (input.evaluatorType === "manager") {
          updateData.managerEvaluationCompleted = true;
          updateData.managerCompletedAt = new Date();
          updateData.workflowStatus = "completed";
          updateData.status = "concluida";
          updateData.completedAt = new Date();

          if (input.managerComments) {
            updateData.managerComments = input.managerComments;
          }

          // Calcular score do gestor
          const avgScore = input.responses.reduce((sum, r) => sum + (r.score || 0), 0) / input.responses.length;
          updateData.managerScore = Math.round(avgScore * 20);
          updateData.finalScore = Math.round(((updateData.managerScore || 0) + (evaluation.selfScore || 0)) / 2);

          // Notificar funcionário
          if (evaluatedEmployee?.userId) {
            await db.insert(notifications).values({
              userId: evaluatedEmployee.userId,
              type: "avaliacao_concluida",
              title: "Avaliação Concluída",
              message: "Sua avaliação foi concluída pelo gestor. Você já pode visualizar o resultado.",
              link: `/avaliacoes/${input.evaluationId}`,
              read: false,
            });
          }
        }

        await db
          .update(performanceEvaluations)
          .set(updateData)
          .where(eq(performanceEvaluations.id, input.evaluationId));
      }

      return { success: true, submitted: input.submit };
    }),

  // ============================================================================
  // QUESTÕES
  // ============================================================================

  /**
   * Listar questões ativas
   */
  listQuestions: protectedProcedure.input(z.object({}).optional()).query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const questions = await db
      .select()
      .from(evaluationQuestions)
      .where(eq(evaluationQuestions.active, true))
      .orderBy(evaluationQuestions.category, evaluationQuestions.id);

    return questions;
  }),

  /**
   * Criar questão (apenas admin/rh)
   */
  createQuestion: protectedProcedure
    .input(
      z.object({
        code: z.string().min(1),
        question: z.string().min(1),
        category: z.string().optional(),
        type: z.enum(["escala", "texto", "multipla_escolha"]),
        options: z.string().optional(),
        weight: z.number().int().min(1).default(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores e RH podem criar questões" });
      }

      const [result] = await db.insert(evaluationQuestions).values({
        code: input.code,
        question: input.question,
        category: input.category,
        type: input.type,
        options: input.options,
        weight: input.weight,
        active: true,
      });

      return { id: result.insertId, success: true };
    }),

  // ============================================================================
  // DASHBOARDS E RELATÓRIOS
  // ============================================================================

  /**
   * Dashboard executivo - KPIs gerais
   */
  executiveDashboard: protectedProcedure
    .input(
      z.object({
        cycleId: z.number().optional(),
        departmentId: z.number().optional(),
      })
    .optional())
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar permissão (apenas admin, rh e gestores)
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh" && ctx.user.role !== "gestor") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para visualizar dashboard executivo" });
      }

      const conditions = [];
      if (input.cycleId) conditions.push(eq(performanceEvaluations.cycleId, input.cycleId));

      // Total de avaliações
      const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(performanceEvaluations)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const total = totalResult?.count || 0;

      // Avaliações concluídas
      const [completedResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(performanceEvaluations)
        .where(
          and(
            eq(performanceEvaluations.status, "concluida"),
            ...(conditions.length > 0 ? conditions : [])
          )
        );

      const completed = completedResult?.count || 0;

      // Autoavaliações pendentes
      const [selfPendingResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(performanceEvaluations)
        .where(
          and(
            eq(performanceEvaluations.selfEvaluationCompleted, false),
            ...(conditions.length > 0 ? conditions : [])
          )
        );

      const selfPending = selfPendingResult?.count || 0;

      // Avaliações de gestor pendentes
      const [managerPendingResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(performanceEvaluations)
        .where(
          and(
            eq(performanceEvaluations.selfEvaluationCompleted, true),
            eq(performanceEvaluations.managerEvaluationCompleted, false),
            ...(conditions.length > 0 ? conditions : [])
          )
        );

      const managerPending = managerPendingResult?.count || 0;

      // Taxa de conclusão
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Média de scores finais
      const [avgScoreResult] = await db
        .select({ avg: sql<number>`avg(${performanceEvaluations.finalScore})` })
        .from(performanceEvaluations)
        .where(
          and(
            eq(performanceEvaluations.status, "concluida"),
            ...(conditions.length > 0 ? conditions : [])
          )
        );

      const averageScore = avgScoreResult?.avg ? Math.round(avgScoreResult.avg) : 0;

      // Avaliações por departamento
      const byDepartment = await db
        .select({
          departmentId: employees.departmentId,
          departmentName: departments.name,
          total: sql<number>`count(*)`,
          completed: sql<number>`sum(case when ${performanceEvaluations.status} = 'concluida' then 1 else 0 end)`,
          avgScore: sql<number>`avg(case when ${performanceEvaluations.status} = 'concluida' then ${performanceEvaluations.finalScore} else null end)`,
        })
        .from(performanceEvaluations)
        .leftJoin(employees, eq(performanceEvaluations.employeeId, employees.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(employees.departmentId, departments.name);

      return {
        summary: {
          total,
          completed,
          selfPending,
          managerPending,
          completionRate,
          averageScore,
        },
        byDepartment: byDepartment.map((d) => ({
          departmentId: d.departmentId,
          departmentName: d.departmentName || "Sem departamento",
          total: d.total,
          completed: d.completed,
          completionRate: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0,
          avgScore: d.avgScore ? Math.round(d.avgScore) : 0,
        })),
      };
    }),

  /**
   * Relatório de compliance - funcionários com avaliações pendentes
   */
  complianceReport: protectedProcedure
    .input(
      z.object({
        cycleId: z.number(),
        departmentId: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores e RH podem visualizar relatório de compliance" });
      }

      const conditions = [eq(performanceEvaluations.cycleId, input.cycleId)];
      if (input.departmentId) {
        conditions.push(eq(employees.departmentId, input.departmentId));
      }

      // Funcionários com autoavaliação pendente
      const selfPending = await db
        .select({
          employee: employees,
          department: departments,
          position: positions,
          evaluation: performanceEvaluations,
          cycle: evaluationCycles,
        })
        .from(performanceEvaluations)
        .leftJoin(employees, eq(performanceEvaluations.employeeId, employees.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .leftJoin(positions, eq(employees.positionId, positions.id))
        .leftJoin(evaluationCycles, eq(performanceEvaluations.cycleId, evaluationCycles.id))
        .where(
          and(
            ...conditions,
            eq(performanceEvaluations.selfEvaluationCompleted, false)
          )
        )
        .orderBy(departments.name, employees.name);

      // Gestores com avaliação de subordinados pendente
      const managerPending = await db
        .select({
          employee: employees,
          department: departments,
          position: positions,
          evaluation: performanceEvaluations,
          cycle: evaluationCycles,
          manager: sql<any>`(SELECT * FROM employees WHERE id = ${employees.managerId})`,
        })
        .from(performanceEvaluations)
        .leftJoin(employees, eq(performanceEvaluations.employeeId, employees.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .leftJoin(positions, eq(employees.positionId, positions.id))
        .leftJoin(evaluationCycles, eq(performanceEvaluations.cycleId, evaluationCycles.id))
        .where(
          and(
            ...conditions,
            eq(performanceEvaluations.selfEvaluationCompleted, true),
            eq(performanceEvaluations.managerEvaluationCompleted, false)
          )
        )
        .orderBy(departments.name, employees.name);

      return {
        selfPending,
        managerPending,
      };
    }),

  /**
   * Relatório de evolução temporal
   */
  evolutionReport: protectedProcedure
    .input(
      z.object({
        employeeId: z.number().optional(),
        departmentId: z.number().optional(),
        startYear: z.number().int(),
        endYear: z.number().int(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [
        gte(evaluationCycles.year, input.startYear),
        lte(evaluationCycles.year, input.endYear),
        eq(performanceEvaluations.status, "concluida"),
      ];

      if (input.employeeId) {
        conditions.push(eq(performanceEvaluations.employeeId, input.employeeId));
      }

      if (input.departmentId) {
        conditions.push(eq(employees.departmentId, input.departmentId));
      }

      const evolution = await db
        .select({
          year: evaluationCycles.year,
          cycleName: evaluationCycles.name,
          avgSelfScore: sql<number>`avg(${performanceEvaluations.selfScore})`,
          avgManagerScore: sql<number>`avg(${performanceEvaluations.managerScore})`,
          avgFinalScore: sql<number>`avg(${performanceEvaluations.finalScore})`,
          count: sql<number>`count(*)`,
        })
        .from(performanceEvaluations)
        .leftJoin(evaluationCycles, eq(performanceEvaluations.cycleId, evaluationCycles.id))
        .leftJoin(employees, eq(performanceEvaluations.employeeId, employees.id))
        .where(and(...conditions))
        .groupBy(evaluationCycles.year, evaluationCycles.name)
        .orderBy(evaluationCycles.year);

      return evolution.map((e) => ({
        year: e.year,
        cycleName: e.cycleName,
        avgSelfScore: e.avgSelfScore ? Math.round(e.avgSelfScore) : 0,
        avgManagerScore: e.avgManagerScore ? Math.round(e.avgManagerScore) : 0,
        avgFinalScore: e.avgFinalScore ? Math.round(e.avgFinalScore) : 0,
        count: e.count,
      }));
    }),

  // ============================================================================
  // PROCESSO AVD - INTEGRAÇÃO COM PASSOS
  // ============================================================================

  /**
   * Buscar processo AVD por ID
   */
  getProcessById: protectedProcedure
    .input(z.object({ processId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { avdAssessmentProcesses } = await import("../drizzle/schema");
      
      const [process] = await db.select()
        .from(avdAssessmentProcesses)
        .where(eq(avdAssessmentProcesses.id, input.processId))
        .limit(1);

      return process || null;
    }),

  /**
   * Buscar avaliação PIR por processo
   */
  getPirAssessmentByProcess: protectedProcedure
    .input(z.object({ processId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { pirAssessments, pirAnswers } = await import("../drizzle/schema");
      
      const [assessment] = await db.select()
        .from(pirAssessments)
        .where(eq(pirAssessments.processId, input.processId))
        .limit(1);

      if (!assessment) return null;

      const answers = await db.select()
        .from(pirAnswers)
        .where(eq(pirAnswers.assessmentId, assessment.id));

      return { ...assessment, answers };
    }),

  /**
   * Salvar avaliação PIR
   */
  savePirAssessment: protectedProcedure
    .input(z.object({
      processId: z.number(),
      responses: z.array(z.object({
        questionId: z.number(),
        response: z.number(),
      })).min(1, "Pelo menos uma resposta é necessária"),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log('[savePirAssessment] Input recebido:', JSON.stringify({ 
        processId: input.processId, 
        responsesCount: input.responses?.length, 
        hasResponses: !!input.responses,
        responsesType: typeof input.responses,
        isArray: Array.isArray(input.responses),
        firstResponse: input.responses?.[0],
        userId: ctx.user?.id
      }));
      
      // Validação adicional de segurança
      if (!input.responses || !Array.isArray(input.responses) || input.responses.length === 0) {
        console.error('[savePirAssessment] ERRO: responses inválido:', { 
          responses: input.responses,
          type: typeof input.responses,
          isArray: Array.isArray(input.responses)
        });
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Nenhuma resposta fornecida. Por favor, responda pelo menos uma questão." 
        });
      }
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { pirAssessments, pirAnswers, avdAssessmentProcesses } = await import("../drizzle/schema");

      // Verificar se processo existe
      const [process] = await db.select()
        .from(avdAssessmentProcesses)
        .where(eq(avdAssessmentProcesses.id, input.processId))
        .limit(1);

      if (!process) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Processo não encontrado" });
      }

      // Buscar ou criar assessment
      let [assessment] = await db.select()
        .from(pirAssessments)
        .where(eq(pirAssessments.processId, input.processId))
        .limit(1);

      if (!assessment) {
        const [result] = await db.insert(pirAssessments).values({
          processId: input.processId,
          employeeId: process.employeeId,
          status: 'em_andamento',
          assessmentDate: new Date(),
          createdBy: ctx.user.id,
        });
        [assessment] = await db.select()
          .from(pirAssessments)
          .where(eq(pirAssessments.id, result.insertId))
          .limit(1);
      }

      // Salvar respostas
      for (const response of input.responses) {
        // Verificar se já existe resposta
        const [existing] = await db.select()
          .from(pirAnswers)
          .where(and(
            eq(pirAnswers.assessmentId, assessment.id),
            eq(pirAnswers.questionId, response.questionId)
          ))
          .limit(1);

        if (existing) {
          await db.update(pirAnswers)
            .set({ response: response.response, updatedAt: new Date() })
            .where(eq(pirAnswers.id, existing.id));
        } else {
          await db.insert(pirAnswers).values({
            assessmentId: assessment.id,
            questionId: response.questionId,
            response: response.response,
          });
        }
      }

      return { success: true, assessmentId: assessment.id };
    }),

  /**
   * Completar passo do processo AVD
   */
  completeStep: protectedProcedure
    .input(z.object({
      processId: z.number(),
      step: z.number().min(1).max(5),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { avdAssessmentProcesses } = await import("../drizzle/schema");

      const updateData: Record<string, any> = {
        updatedAt: new Date(),
      };

      // Marcar data de conclusão do passo
      const stepCompletedField = `step${input.step}CompletedAt`;
      updateData[stepCompletedField] = new Date();

      // Avançar para o próximo passo
      if (input.step < 5) {
        updateData.currentStep = input.step + 1;
      } else {
        updateData.currentStep = 5;
        updateData.status = 'concluido';
        updateData.completedAt = new Date();
      }

      await db.update(avdAssessmentProcesses)
        .set(updateData)
        .where(eq(avdAssessmentProcesses.id, input.processId));

      return { 
        success: true, 
        nextStep: input.step < 5 ? input.step + 1 : null,
        processCompleted: input.step === 5,
      };
    }),
});
