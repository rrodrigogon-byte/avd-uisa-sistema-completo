import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import {
  recordAbTestMetric,
  getVariantComparison,
  createLayoutConfig,
  getLayoutConfigForUser,
  saveExperimentResults,
} from "../services/abTestMetricsService";
import { getDb } from "../db";
import { 
  abTestExperiments, 
  abTestVariants, 
  abTestAssignments,
  abTestMetrics,
  abLayoutConfigs,
  abTestResults
} from "../../drizzle/schema";
import { eq, and, desc, gte, count } from "drizzle-orm";

export const abTestMetricsRouter = router({
  /**
   * Registrar métrica de experimento
   */
  recordMetric: protectedProcedure
    .input(z.object({
      experimentId: z.number(),
      variantId: z.number(),
      metricType: z.enum([
        "page_view",
        "time_on_page",
        "step_completion",
        "form_submission",
        "error_count",
        "satisfaction_rating",
        "task_completion_time"
      ]),
      metricValue: z.number().optional(),
      metricLabel: z.string().optional(),
      pageUrl: z.string().optional(),
      stepNumber: z.number().optional(),
      sessionId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await recordAbTestMetric({
        ...input,
        userId: ctx.user.id,
      });

      if (!result) {
        throw new Error("Falha ao registrar métrica");
      }

      return result;
    }),

  /**
   * Obter comparação detalhada entre variantes
   */
  getComparison: adminProcedure
    .input(z.object({ experimentId: z.number() }))
    .query(async ({ input }) => {
      return await getVariantComparison(input.experimentId);
    }),

  /**
   * Criar configuração de layout para variante
   */
  createLayoutConfig: adminProcedure
    .input(z.object({
      experimentId: z.number(),
      variantId: z.number(),
      layoutType: z.enum(["control", "cards", "grid", "wizard", "minimal"]),
      colorScheme: z.string().optional(),
      fontFamily: z.string().optional(),
      spacing: z.enum(["compact", "normal", "relaxed"]).optional(),
      showProgressBar: z.boolean().optional(),
      showStepNumbers: z.boolean().optional(),
      showHelpTooltips: z.boolean().optional(),
      animationsEnabled: z.boolean().optional(),
      customCss: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await createLayoutConfig(
        input.experimentId,
        input.variantId,
        {
          layoutType: input.layoutType,
          colorScheme: input.colorScheme,
          fontFamily: input.fontFamily,
          spacing: input.spacing,
          showProgressBar: input.showProgressBar,
          showStepNumbers: input.showStepNumbers,
          showHelpTooltips: input.showHelpTooltips,
          animationsEnabled: input.animationsEnabled,
          customCss: input.customCss,
        }
      );

      if (!result) {
        throw new Error("Falha ao criar configuração de layout");
      }

      return result;
    }),

  /**
   * Obter configuração de layout para usuário
   */
  getMyLayoutConfig: protectedProcedure
    .input(z.object({ experimentId: z.number() }))
    .query(async ({ input, ctx }) => {
      return await getLayoutConfigForUser(input.experimentId, ctx.user.id);
    }),

  /**
   * Salvar resultados do experimento
   */
  saveResults: adminProcedure
    .input(z.object({ experimentId: z.number() }))
    .mutation(async ({ input }) => {
      const success = await saveExperimentResults(input.experimentId);

      if (!success) {
        throw new Error("Falha ao salvar resultados");
      }

      return { success: true };
    }),

  /**
   * Listar métricas de um experimento
   */
  listMetrics: adminProcedure
    .input(z.object({
      experimentId: z.number(),
      metricType: z.enum([
        "page_view",
        "time_on_page",
        "step_completion",
        "form_submission",
        "error_count",
        "satisfaction_rating",
        "task_completion_time"
      ]).optional(),
      limit: z.number().default(100),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db.select()
        .from(abTestMetrics)
        .where(eq(abTestMetrics.experimentId, input.experimentId))
        .orderBy(desc(abTestMetrics.createdAt))
        .limit(input.limit);

      if (input.metricType) {
        query = query.where(and(
          eq(abTestMetrics.experimentId, input.experimentId),
          eq(abTestMetrics.metricType, input.metricType)
        )) as typeof query;
      }

      return await query;
    }),

  /**
   * Obter estatísticas agregadas de métricas
   */
  getAggregatedStats: adminProcedure
    .input(z.object({ experimentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      // Buscar todas as métricas
      const metrics = await db.select()
        .from(abTestMetrics)
        .where(eq(abTestMetrics.experimentId, input.experimentId));

      // Buscar variantes
      const variants = await db.select()
        .from(abTestVariants)
        .where(eq(abTestVariants.experimentId, input.experimentId));

      // Agregar por tipo de métrica e variante
      const aggregated: Record<string, Record<number, {
        count: number;
        sum: number;
        avg: number;
        min: number;
        max: number;
      }>> = {};

      const metricTypes = [
        "page_view",
        "time_on_page",
        "step_completion",
        "form_submission",
        "error_count",
        "satisfaction_rating",
        "task_completion_time"
      ];

      for (const type of metricTypes) {
        aggregated[type] = {};
        
        for (const variant of variants) {
          const variantMetrics = metrics.filter(
            m => m.metricType === type && m.variantId === variant.id
          );

          const values = variantMetrics
            .map(m => m.metricValue)
            .filter((v): v is number => v !== null);

          aggregated[type][variant.id] = {
            count: variantMetrics.length,
            sum: values.reduce((a, b) => a + b, 0),
            avg: values.length > 0 
              ? Math.round(values.reduce((a, b) => a + b, 0) / values.length * 100) / 100 
              : 0,
            min: values.length > 0 ? Math.min(...values) : 0,
            max: values.length > 0 ? Math.max(...values) : 0,
          };
        }
      }

      return {
        experimentId: input.experimentId,
        totalMetrics: metrics.length,
        variants: variants.map(v => ({
          id: v.id,
          name: v.name,
          isControl: v.isControl,
        })),
        aggregated,
      };
    }),

  /**
   * Obter resultados salvos do experimento
   */
  getSavedResults: adminProcedure
    .input(z.object({ experimentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [result] = await db.select()
        .from(abTestResults)
        .where(eq(abTestResults.experimentId, input.experimentId))
        .limit(1);

      return result || null;
    }),

  /**
   * Listar configurações de layout
   */
  listLayoutConfigs: adminProcedure
    .input(z.object({ experimentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return await db.select({
        config: abLayoutConfigs,
        variantName: abTestVariants.name,
        isControl: abTestVariants.isControl,
      })
      .from(abLayoutConfigs)
      .leftJoin(abTestVariants, eq(abLayoutConfigs.variantId, abTestVariants.id))
      .where(eq(abLayoutConfigs.experimentId, input.experimentId));
    }),

  /**
   * Obter taxa de conclusão por passo
   */
  getStepCompletionRates: adminProcedure
    .input(z.object({ experimentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const variants = await db.select()
        .from(abTestVariants)
        .where(eq(abTestVariants.experimentId, input.experimentId));

      const assignments = await db.select()
        .from(abTestAssignments)
        .where(eq(abTestAssignments.experimentId, input.experimentId));

      const stepMetrics = await db.select()
        .from(abTestMetrics)
        .where(and(
          eq(abTestMetrics.experimentId, input.experimentId),
          eq(abTestMetrics.metricType, "step_completion")
        ));

      const result: Record<number, {
        variantName: string;
        isControl: boolean;
        totalUsers: number;
        stepRates: Record<number, number>;
      }> = {};

      for (const variant of variants) {
        const variantAssignments = assignments.filter(a => a.variantId === variant.id);
        const totalUsers = variantAssignments.length;
        
        const stepRates: Record<number, number> = {};
        
        for (let step = 1; step <= 5; step++) {
          const stepCount = stepMetrics.filter(
            m => m.variantId === variant.id && m.stepNumber === step
          ).length;
          
          stepRates[step] = totalUsers > 0 
            ? Math.round((stepCount / totalUsers) * 100) 
            : 0;
        }

        result[variant.id] = {
          variantName: variant.name,
          isControl: variant.isControl,
          totalUsers,
          stepRates,
        };
      }

      return result;
    }),

  /**
   * Obter funil de conversão
   */
  getConversionFunnel: adminProcedure
    .input(z.object({ experimentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const variants = await db.select()
        .from(abTestVariants)
        .where(eq(abTestVariants.experimentId, input.experimentId));

      const funnelData: Array<{
        variantId: number;
        variantName: string;
        isControl: boolean;
        funnel: Array<{
          step: string;
          count: number;
          rate: number;
          dropoff: number;
        }>;
      }> = [];

      for (const variant of variants) {
        const assignments = await db.select()
          .from(abTestAssignments)
          .where(eq(abTestAssignments.variantId, variant.id));

        const pageViews = await db.select()
          .from(abTestMetrics)
          .where(and(
            eq(abTestMetrics.variantId, variant.id),
            eq(abTestMetrics.metricType, "page_view")
          ));

        const completions = assignments.filter(a => a.completed);

        const steps = [
          { step: "Atribuídos", count: assignments.length },
          { step: "Visualizaram", count: new Set(pageViews.map(p => p.userId)).size },
          { step: "Iniciaram", count: Math.round(assignments.length * 0.9) }, // Estimativa
          { step: "Concluíram", count: completions.length },
        ];

        const funnel = steps.map((s, i) => ({
          step: s.step,
          count: s.count,
          rate: assignments.length > 0 ? Math.round((s.count / assignments.length) * 100) : 0,
          dropoff: i > 0 && steps[i - 1].count > 0
            ? Math.round(((steps[i - 1].count - s.count) / steps[i - 1].count) * 100)
            : 0,
        }));

        funnelData.push({
          variantId: variant.id,
          variantName: variant.name,
          isControl: variant.isControl,
          funnel,
        });
      }

      return funnelData;
    }),
});
