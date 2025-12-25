import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";

/**
 * Router para testes de integridade e ética (expansão do PIR)
 * Gerencia testes, aplicação e análises comportamentais
 */
export const integrityTestsRouter = router({
  /**
   * Listar testes de integridade disponíveis
   */
  listTests: protectedProcedure
    .input(z.object({ activeOnly: z.boolean().optional().default(true) }).optional())
    .query(async ({ input }) => {
      return await db.listIntegrityTests(input.activeOnly);
    }),

  /**
   * Buscar teste por ID
   */
  getTestById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getIntegrityTestById(input.id);
    }),

  /**
   * Criar novo teste de integridade
   */
  createTest: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        questions: z.string(), // JSON stringified
        scoringRules: z.string(), // JSON stringified
        categories: z.string().optional(), // JSON stringified
        timeLimit: z.number().optional(),
        randomizeQuestions: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const id = await db.createIntegrityTest({
        ...input,
        isActive: true,
        createdBy: ctx.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return { id, success: true };
    }),

  /**
   * Atualizar teste de integridade
   */
  updateTest: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        questions: z.string().optional(), // JSON stringified
        scoringRules: z.string().optional(), // JSON stringified
        categories: z.string().optional(), // JSON stringified
        timeLimit: z.number().optional(),
        randomizeQuestions: z.boolean().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      await db.updateIntegrityTest(id, updateData);
      return { success: true };
    }),

  /**
   * Submeter respostas de teste de integridade
   */
  submitTestResult: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        testId: z.number(),
        pirAssessmentId: z.number().optional(),
        answers: z.string(), // JSON stringified
        score: z.number(),
        behavioralAnalysis: z.string().optional(),
        riskLevel: z.enum(["baixo", "medio", "alto", "critico"]).optional(),
        recommendations: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = await db.createIntegrityTestResult({
        ...input,
        completedAt: new Date(),
      });

      return { id, success: true };
    }),

  /**
   * Buscar resultados de testes de um funcionário
   */
  getEmployeeResults: protectedProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input }) => {
      return await db.getEmployeeIntegrityTestResults(input.employeeId);
    }),

  /**
   * Buscar resultado específico de teste
   */
  getResultById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getIntegrityTestResultById(input.id);
    }),

  /**
   * Buscar análise comportamental detalhada
   */
  getIntegrityAnalysis: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        testId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await db.getIntegrityAnalysis(input.employeeId, input.testId);
    }),

  /**
   * Gerar relatório consolidado de integridade
   */
  generateConsolidatedReport: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        includeHistory: z.boolean().optional().default(true),
        periodMonths: z.number().optional().default(12),
      })
    )
    .query(async ({ input }) => {
      const results = await db.getEmployeeIntegrityTestResults(input.employeeId);

      if (results.length === 0) {
        return {
          employeeId: input.employeeId,
          totalTests: 0,
          averageScore: 0,
          riskLevel: "desconhecido",
          trends: [],
          recommendations: [],
        };
      }

      // Calcular estatísticas
      const totalTests = results.length;
      const averageScore =
        results.reduce((sum, r) => sum + (r.result.score || 0), 0) / totalTests;

      // Determinar nível de risco geral
      const riskLevels = results.map((r) => r.result.riskLevel).filter(Boolean);
      const highRiskCount = riskLevels.filter((r) => r === "alto" || r === "critico").length;
      const riskLevel =
        highRiskCount > totalTests / 2
          ? "alto"
          : highRiskCount > 0
          ? "medio"
          : "baixo";

      // Análise de tendências (últimos 3 testes)
      const recentTests = results.slice(0, 3);
      const trends = recentTests.map((r) => ({
        testName: r.test.name,
        completedAt: r.result.completedAt,
        score: r.result.score,
        riskLevel: r.result.riskLevel,
      }));

      // Compilar recomendações
      const recommendations = results
        .map((r) => r.result.recommendations)
        .filter(Boolean)
        .slice(0, 5);

      return {
        employeeId: input.employeeId,
        totalTests,
        averageScore: Math.round(averageScore * 100) / 100,
        riskLevel,
        trends,
        recommendations,
        lastTestDate: results[0]?.result.completedAt,
      };
    }),
});
