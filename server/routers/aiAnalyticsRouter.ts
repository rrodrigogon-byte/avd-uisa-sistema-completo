import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  analyzeTurnoverRisk,
  predictPerformance,
  generateOrganizationalInsights,
  generateDevelopmentRecommendations,
} from "../services/aiAnalyticsService";

/**
 * Router para Análise Preditiva com IA
 * Endpoints para predições, insights e recomendações geradas por IA
 */
export const aiAnalyticsRouter = router({
  /**
   * Analisa risco de turnover de um colaborador
   */
  analyzeTurnoverRisk: protectedProcedure
    .input(
      z.object({
        employeeId: z.number().int().positive(),
      })
    )
    .mutation(async ({ input }) => {
      return await analyzeTurnoverRisk(input.employeeId);
    }),

  /**
   * Prediz desempenho futuro de um colaborador
   */
  predictPerformance: protectedProcedure
    .input(
      z.object({
        employeeId: z.number().int().positive(),
      })
    )
    .mutation(async ({ input }) => {
      return await predictPerformance(input.employeeId);
    }),

  /**
   * Gera insights organizacionais automáticos
   */
  generateInsights: protectedProcedure.query(async () => {
    return await generateOrganizationalInsights();
  }),

  /**
   * Gera recomendações de desenvolvimento personalizadas
   */
  generateDevelopmentRecommendations: protectedProcedure
    .input(
      z.object({
        employeeId: z.number().int().positive(),
      })
    )
    .mutation(async ({ input }) => {
      return await generateDevelopmentRecommendations(input.employeeId);
    }),

  /**
   * Análise em lote de risco de turnover
   */
  batchAnalyzeTurnover: protectedProcedure
    .input(
      z.object({
        employeeIds: z.array(z.number().int().positive()).max(50), // Máximo 50 por vez
      })
    )
    .mutation(async ({ input }) => {
      const results = await Promise.all(input.employeeIds.map((id) => analyzeTurnoverRisk(id).catch(() => null)));

      return results.filter((r) => r !== null);
    }),

  /**
   * Análise em lote de predição de desempenho
   */
  batchPredictPerformance: protectedProcedure
    .input(
      z.object({
        employeeIds: z.array(z.number().int().positive()).max(50),
      })
    )
    .mutation(async ({ input }) => {
      const results = await Promise.all(input.employeeIds.map((id) => predictPerformance(id).catch(() => null)));

      return results.filter((r) => r !== null);
    }),

  /**
   * Dashboard de IA - Retorna todos os insights e predições principais
   */
  getAIDashboard: protectedProcedure.query(async () => {
    const insights = await generateOrganizationalInsights();

    return {
      insights,
      generatedAt: new Date().toISOString(),
      summary: {
        totalInsights: insights.length,
        criticalInsights: insights.filter((i) => i.impactLevel === "critico").length,
        highImpactInsights: insights.filter((i) => i.impactLevel === "alto").length,
        categories: insights.reduce(
          (acc, i) => {
            acc[i.category] = (acc[i.category] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
      },
    };
  }),
});
