import { z } from "zod";
import { protectedProcedure, adminProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  climateSurveys,
  climateDimensions,
  climateQuestions,
  climateResponses,
  climateResults,
  climateInsights,
  employees,
  departments,
} from "../../drizzle/schema";
import { eq, and, desc, sql, inArray, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";

/**
 * Router de Pesquisa de Clima Organizacional
 * Gerencia pesquisas de clima, respostas anônimas e análises
 */
export const climaRouter = router({
  /**
   * Listar pesquisas de clima
   */
  listSurveys: protectedProcedure
    .input(
      z
        .object({
          status: z.enum(["draft", "active", "closed"]).optional(),
          limit: z.number().default(50),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      let query = db
        .select()
        .from(climateSurveys)
        .orderBy(desc(climateSurveys.createdAt))
        .limit(input?.limit || 50);

      if (input?.status) {
        query = query.where(eq(climateSurveys.status, input.status)) as any;
      }

      const surveys = await query;

      // Buscar estatísticas de cada pesquisa
      const surveysWithStats = await Promise.all(
        surveys.map(async (survey) => {
          const [responseCount] = await db
            .select({ count: sql<number>`COUNT(DISTINCT responseToken)` })
            .from(climateResponses)
            .where(eq(climateResponses.surveyId, survey.id));

          const [questionCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(climateQuestions)
            .where(eq(climateQuestions.surveyId, survey.id));

          return {
            ...survey,
            responseCount: responseCount?.count || 0,
            questionCount: questionCount?.count || 0,
          };
        })
      );

      return surveysWithStats;
    }),

  /**
   * Obter detalhes de uma pesquisa
   */
  getSurveyById: protectedProcedure
    .input(z.object({ surveyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      const [survey] = await db
        .select()
        .from(climateSurveys)
        .where(eq(climateSurveys.id, input.surveyId))
        .limit(1);

      if (!survey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pesquisa não encontrada",
        });
      }

      // Buscar questões agrupadas por dimensão
      const questions = await db
        .select({
          id: climateQuestions.id,
          surveyId: climateQuestions.surveyId,
          dimensionId: climateQuestions.dimensionId,
          questionText: climateQuestions.questionText,
          questionType: climateQuestions.questionType,
          options: climateQuestions.options,
          scaleMin: climateQuestions.scaleMin,
          scaleMax: climateQuestions.scaleMax,
          scaleMinLabel: climateQuestions.scaleMinLabel,
          scaleMaxLabel: climateQuestions.scaleMaxLabel,
          isRequired: climateQuestions.isRequired,
          displayOrder: climateQuestions.displayOrder,
          dimensionName: climateDimensions.name,
          dimensionColor: climateDimensions.color,
        })
        .from(climateQuestions)
        .leftJoin(climateDimensions, eq(climateQuestions.dimensionId, climateDimensions.id))
        .where(eq(climateQuestions.surveyId, input.surveyId))
        .orderBy(climateQuestions.displayOrder);

      return {
        ...survey,
        questions,
      };
    }),

  /**
   * Criar nova pesquisa de clima
   */
  createSurvey: adminProcedure
    .input(
      z.object({
        title: z.string().min(5, "Título deve ter no mínimo 5 caracteres"),
        description: z.string().optional(),
        startDate: z.string(),
        endDate: z.string(),
        isAnonymous: z.boolean().default(true),
        allowMultipleResponses: z.boolean().default(false),
        targetDepartments: z.array(z.number()).optional(),
        targetEmployees: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      const [result] = await db.insert(climateSurveys).values({
        title: input.title,
        description: input.description || null,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        status: "draft",
        isAnonymous: input.isAnonymous,
        allowMultipleResponses: input.allowMultipleResponses,
        targetDepartments: input.targetDepartments || null,
        targetEmployees: input.targetEmployees || null,
        createdBy: ctx.user.id,
      });

      return {
        success: true,
        surveyId: result.insertId,
        message: "Pesquisa criada com sucesso",
      };
    }),

  /**
   * Atualizar pesquisa
   */
  updateSurvey: adminProcedure
    .input(
      z.object({
        surveyId: z.number(),
        title: z.string().min(5).optional(),
        description: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        status: z.enum(["draft", "active", "closed"]).optional(),
        isAnonymous: z.boolean().optional(),
        allowMultipleResponses: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      const updateData: any = {};

      if (input.title) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.startDate) updateData.startDate = new Date(input.startDate);
      if (input.endDate) updateData.endDate = new Date(input.endDate);
      if (input.status) updateData.status = input.status;
      if (input.isAnonymous !== undefined) updateData.isAnonymous = input.isAnonymous;
      if (input.allowMultipleResponses !== undefined)
        updateData.allowMultipleResponses = input.allowMultipleResponses;

      await db
        .update(climateSurveys)
        .set(updateData)
        .where(eq(climateSurveys.id, input.surveyId));

      return {
        success: true,
        message: "Pesquisa atualizada com sucesso",
      };
    }),

  /**
   * Listar dimensões do clima
   */
  listDimensions: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database not available",
      });

    const dimensions = await db
      .select()
      .from(climateDimensions)
      .where(eq(climateDimensions.active, true))
      .orderBy(climateDimensions.displayOrder);

    return dimensions;
  }),

  /**
   * Criar dimensão
   */
  createDimension: adminProcedure
    .input(
      z.object({
        name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
        description: z.string().optional(),
        icon: z.string().optional(),
        color: z.string().optional(),
        displayOrder: z.number().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      const [result] = await db.insert(climateDimensions).values({
        name: input.name,
        description: input.description || null,
        icon: input.icon || null,
        color: input.color || null,
        displayOrder: input.displayOrder,
        active: true,
      });

      return {
        success: true,
        dimensionId: result.insertId,
        message: "Dimensão criada com sucesso",
      };
    }),

  /**
   * Adicionar questão à pesquisa
   */
  addQuestion: adminProcedure
    .input(
      z.object({
        surveyId: z.number(),
        dimensionId: z.number(),
        questionText: z.string().min(10, "Questão deve ter no mínimo 10 caracteres"),
        questionType: z.enum(["scale", "multiple_choice", "text", "yes_no"]),
        options: z.array(z.string()).optional(),
        scaleMin: z.number().default(1),
        scaleMax: z.number().default(5),
        scaleMinLabel: z.string().optional(),
        scaleMaxLabel: z.string().optional(),
        isRequired: z.boolean().default(true),
        displayOrder: z.number().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      const [result] = await db.insert(climateQuestions).values({
        surveyId: input.surveyId,
        dimensionId: input.dimensionId,
        questionText: input.questionText,
        questionType: input.questionType,
        options: input.options || null,
        scaleMin: input.scaleMin,
        scaleMax: input.scaleMax,
        scaleMinLabel: input.scaleMinLabel || null,
        scaleMaxLabel: input.scaleMaxLabel || null,
        isRequired: input.isRequired,
        displayOrder: input.displayOrder,
      });

      return {
        success: true,
        questionId: result.insertId,
        message: "Questão adicionada com sucesso",
      };
    }),

  /**
   * Submeter resposta (anônima ou identificada)
   */
  submitResponse: protectedProcedure
    .input(
      z.object({
        surveyId: z.number(),
        responses: z.array(
          z.object({
            questionId: z.number(),
            responseValue: z.number().optional(),
            responseText: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      // Verificar se pesquisa está ativa
      const [survey] = await db
        .select()
        .from(climateSurveys)
        .where(eq(climateSurveys.id, input.surveyId))
        .limit(1);

      if (!survey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pesquisa não encontrada",
        });
      }

      if (survey.status !== "active") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Pesquisa não está ativa",
        });
      }

      // Gerar token de resposta (hash do employeeId + surveyId)
      const responseToken = crypto
        .createHash("sha256")
        .update(`${ctx.user.id}-${input.surveyId}-${Date.now()}`)
        .digest("hex");

      // Buscar dados demográficos do colaborador
      const [employee] = await db
        .select({
          departmentId: employees.departmentId,
        })
        .from(employees)
        .where(eq(employees.id, ctx.user.id))
        .limit(1);

      // Inserir respostas
      for (const response of input.responses) {
        await db.insert(climateResponses).values({
          surveyId: input.surveyId,
          questionId: response.questionId,
          responseToken,
          departmentId: employee?.departmentId || null,
          hierarchyLevel: null, // Pode ser calculado depois
          tenureRange: null, // Pode ser calculado depois
          responseValue: response.responseValue || null,
          responseText: response.responseText || null,
        });
      }

      return {
        success: true,
        message: "Respostas enviadas com sucesso",
      };
    }),

  /**
   * Calcular resultados da pesquisa
   */
  calculateResults: adminProcedure
    .input(z.object({ surveyId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      // Buscar todas as dimensões
      const dimensions = await db
        .select()
        .from(climateDimensions)
        .where(eq(climateDimensions.active, true));

      // Calcular resultados por dimensão
      for (const dimension of dimensions) {
        // Buscar questões da dimensão
        const questions = await db
          .select()
          .from(climateQuestions)
          .where(
            and(
              eq(climateQuestions.surveyId, input.surveyId),
              eq(climateQuestions.dimensionId, dimension.id)
            )
          );

        if (questions.length === 0) continue;

        const questionIds = questions.map((q) => q.id);

        // Calcular média geral
        const [avgResult] = await db
          .select({
            avg: sql<number>`AVG(responseValue)`,
            count: sql<number>`COUNT(DISTINCT responseToken)`,
          })
          .from(climateResponses)
          .where(
            and(
              eq(climateResponses.surveyId, input.surveyId),
              inArray(climateResponses.questionId, questionIds)
            )
          );

        if (!avgResult || !avgResult.avg) continue;

        // Normalizar para escala 0-100
        const averageScore = Math.round((avgResult.avg / 5) * 100);

        // Inserir ou atualizar resultado
        await db.insert(climateResults).values({
          surveyId: input.surveyId,
          dimensionId: dimension.id,
          departmentId: null, // Resultado geral
          hierarchyLevel: null,
          averageScore,
          responseCount: avgResult.count || 0,
          participationRate: null,
          scoreDistribution: null,
          trend: null,
          previousScore: null,
        });

        // Calcular resultados por departamento
        const departments = await db
          .select({ id: departments.id })
          .from(departments);

        for (const dept of departments) {
          const [deptAvg] = await db
            .select({
              avg: sql<number>`AVG(responseValue)`,
              count: sql<number>`COUNT(DISTINCT responseToken)`,
            })
            .from(climateResponses)
            .where(
              and(
                eq(climateResponses.surveyId, input.surveyId),
                eq(climateResponses.departmentId, dept.id),
                inArray(climateResponses.questionId, questionIds)
              )
            );

          if (!deptAvg || !deptAvg.avg) continue;

          const deptScore = Math.round((deptAvg.avg / 5) * 100);

          await db.insert(climateResults).values({
            surveyId: input.surveyId,
            dimensionId: dimension.id,
            departmentId: dept.id,
            hierarchyLevel: null,
            averageScore: deptScore,
            responseCount: deptAvg.count || 0,
            participationRate: null,
            scoreDistribution: null,
            trend: null,
            previousScore: null,
          });
        }
      }

      return {
        success: true,
        message: "Resultados calculados com sucesso",
      };
    }),

  /**
   * Obter resultados da pesquisa
   */
  getResults: protectedProcedure
    .input(
      z.object({
        surveyId: z.number(),
        departmentId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      let conditions = [eq(climateResults.surveyId, input.surveyId)];

      if (input.departmentId) {
        conditions.push(eq(climateResults.departmentId, input.departmentId));
      } else {
        // Apenas resultados gerais (sem departamento)
        conditions.push(sql`${climateResults.departmentId} IS NULL`);
      }

      const results = await db
        .select({
          id: climateResults.id,
          surveyId: climateResults.surveyId,
          dimensionId: climateResults.dimensionId,
          dimensionName: climateDimensions.name,
          dimensionColor: climateDimensions.color,
          departmentId: climateResults.departmentId,
          averageScore: climateResults.averageScore,
          responseCount: climateResults.responseCount,
          participationRate: climateResults.participationRate,
          trend: climateResults.trend,
          previousScore: climateResults.previousScore,
        })
        .from(climateResults)
        .leftJoin(climateDimensions, eq(climateResults.dimensionId, climateDimensions.id))
        .where(and(...conditions))
        .orderBy(climateDimensions.displayOrder);

      return results;
    }),

  /**
   * Criar insight
   */
  createInsight: adminProcedure
    .input(
      z.object({
        surveyId: z.number(),
        dimensionId: z.number().optional(),
        departmentId: z.number().optional(),
        insightType: z.enum(["strength", "concern", "opportunity", "recommendation"]),
        title: z.string().min(5, "Título deve ter no mínimo 5 caracteres"),
        description: z.string().min(10, "Descrição deve ter no mínimo 10 caracteres"),
        priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
        suggestedActions: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      const [result] = await db.insert(climateInsights).values({
        surveyId: input.surveyId,
        dimensionId: input.dimensionId || null,
        departmentId: input.departmentId || null,
        insightType: input.insightType,
        title: input.title,
        description: input.description,
        priority: input.priority,
        suggestedActions: input.suggestedActions || null,
        status: "new",
      });

      return {
        success: true,
        insightId: result.insertId,
        message: "Insight criado com sucesso",
      };
    }),

  /**
   * Listar insights
   */
  listInsights: protectedProcedure
    .input(
      z.object({
        surveyId: z.number(),
        status: z.enum(["new", "acknowledged", "in_progress", "completed"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      let conditions = [eq(climateInsights.surveyId, input.surveyId)];

      if (input.status) {
        conditions.push(eq(climateInsights.status, input.status));
      }

      const insights = await db
        .select({
          id: climateInsights.id,
          surveyId: climateInsights.surveyId,
          dimensionId: climateInsights.dimensionId,
          dimensionName: climateDimensions.name,
          departmentId: climateInsights.departmentId,
          departmentName: departments.name,
          insightType: climateInsights.insightType,
          title: climateInsights.title,
          description: climateInsights.description,
          priority: climateInsights.priority,
          suggestedActions: climateInsights.suggestedActions,
          status: climateInsights.status,
          createdAt: climateInsights.createdAt,
        })
        .from(climateInsights)
        .leftJoin(climateDimensions, eq(climateInsights.dimensionId, climateDimensions.id))
        .leftJoin(departments, eq(climateInsights.departmentId, departments.id))
        .where(and(...conditions))
        .orderBy(desc(climateInsights.createdAt));

      return insights;
    }),

  /**
   * Atualizar status do insight
   */
  updateInsightStatus: adminProcedure
    .input(
      z.object({
        insightId: z.number(),
        status: z.enum(["new", "acknowledged", "in_progress", "completed"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      await db
        .update(climateInsights)
        .set({ status: input.status })
        .where(eq(climateInsights.id, input.insightId));

      return {
        success: true,
        message: "Status do insight atualizado com sucesso",
      };
    }),
});
