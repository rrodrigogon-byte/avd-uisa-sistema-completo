import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { abTestExperiments, abTestVariants, abTestAssignments, abTestResults } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const abTestRouter = router({
  createExperiment: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      targetModule: z.enum(["pir", "competencias", "desempenho", "pdi"]),
      trafficPercentage: z.number().min(1).max(100).default(100),
      startDate: z.date(),
      endDate: z.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(abTestExperiments).values({
        name: input.name,
        description: input.description,
        targetModule: input.targetModule,
        trafficPercentage: input.trafficPercentage,
        startDate: input.startDate,
        endDate: input.endDate,
        createdBy: ctx.user.id,
        status: "draft",
      });

      return { success: true, experimentId: Number(result[0].insertId) };
    }),

  addVariant: adminProcedure
    .input(z.object({
      experimentId: z.number(),
      name: z.string().min(1),
      description: z.string().optional(),
      isControl: z.boolean().default(false),
      trafficWeight: z.number().min(1).max(100).default(50),
      questionContent: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(abTestVariants).values({
        experimentId: input.experimentId,
        name: input.name,
        description: input.description,
        isControl: input.isControl,
        trafficWeight: input.trafficWeight,
        questionContent: input.questionContent,
      });

      return { success: true, variantId: Number(result[0].insertId) };
    }),

  listAll: protectedProcedure.input(z.object({})).query(async () => {
    const db = await getDb();
    if (!db) return [];

    const experiments = await db.select()
      .from(abTestExperiments)
      .orderBy(desc(abTestExperiments.createdAt));

    return experiments;
  }),

  listActive: protectedProcedure.input(z.object({})).query(async () => {
    const db = await getDb();
    if (!db) return [];

    const experiments = await db.select()
      .from(abTestExperiments)
      .where(eq(abTestExperiments.status, "active"))
      .orderBy(desc(abTestExperiments.createdAt));

    return experiments;
  }),

  getById: protectedProcedure
    .input(z.object({ experimentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [experiment] = await db.select()
        .from(abTestExperiments)
        .where(eq(abTestExperiments.id, input.experimentId))
        .limit(1);

      if (!experiment) return null;

      const variants = await db.select()
        .from(abTestVariants)
        .where(eq(abTestVariants.experimentId, input.experimentId));

      return { ...experiment, variants };
    }),

  updateStatus: adminProcedure
    .input(z.object({
      experimentId: z.number(),
      status: z.enum(["draft", "active", "paused", "completed", "archived"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(abTestExperiments)
        .set({ status: input.status })
        .where(eq(abTestExperiments.id, input.experimentId));

      return { success: true };
    }),

  assignVariant: protectedProcedure
    .input(z.object({
      experimentId: z.number(),
      employeeId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [existing] = await db.select()
        .from(abTestAssignments)
        .where(and(
          eq(abTestAssignments.experimentId, input.experimentId),
          eq(abTestAssignments.employeeId, input.employeeId)
        ))
        .limit(1);

      if (existing) {
        return { variantId: existing.variantId, assignmentId: existing.id };
      }

      const variants = await db.select()
        .from(abTestVariants)
        .where(eq(abTestVariants.experimentId, input.experimentId));

      if (variants.length === 0) {
        throw new Error("Experimento nao possui variantes");
      }

      const totalWeight = variants.reduce((acc, v) => acc + v.trafficWeight, 0);
      let random = Math.random() * totalWeight;
      let selectedVariant = variants[0];

      for (const variant of variants) {
        random -= variant.trafficWeight;
        if (random <= 0) {
          selectedVariant = variant;
          break;
        }
      }

      const result = await db.insert(abTestAssignments).values({
        experimentId: input.experimentId,
        variantId: selectedVariant.id,
        employeeId: input.employeeId,
        completed: false,
      });

      return { variantId: selectedVariant.id, assignmentId: Number(result[0].insertId) };
    }),

  recordResult: protectedProcedure
    .input(z.object({
      assignmentId: z.number(),
      responseTimeSeconds: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(abTestAssignments)
        .set({
          completed: true,
          responseTimeSeconds: input.responseTimeSeconds,
          completedAt: new Date(),
        })
        .where(eq(abTestAssignments.id, input.assignmentId));

      return { success: true };
    }),

  getAnalytics: protectedProcedure
    .input(z.object({ experimentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [experiment] = await db.select()
        .from(abTestExperiments)
        .where(eq(abTestExperiments.id, input.experimentId))
        .limit(1);

      if (!experiment) return null;

      const variants = await db.select()
        .from(abTestVariants)
        .where(eq(abTestVariants.experimentId, input.experimentId));

      const variantMetrics = await Promise.all(variants.map(async (variant) => {
        const assignments = await db.select()
          .from(abTestAssignments)
          .where(eq(abTestAssignments.variantId, variant.id));

        const sampleSize = assignments.length;
        const completions = assignments.filter(a => a.completed).length;
        const conversionRate = sampleSize > 0 ? Math.round((completions / sampleSize) * 100) : 0;
        const avgResponseTime = assignments
          .filter(a => a.responseTimeSeconds)
          .reduce((acc, a) => acc + (a.responseTimeSeconds || 0), 0) / (completions || 1);
        const dropoffRate = sampleSize > 0 ? Math.round(((sampleSize - completions) / sampleSize) * 100) : 0;

        return {
          variantId: variant.id,
          variantName: variant.name,
          isControl: variant.isControl,
          sampleSize,
          completions,
          conversionRate,
          avgResponseTimeSeconds: Math.round(avgResponseTime),
          dropoffRate,
        };
      }));

      const totalSampleSize = variantMetrics.reduce((acc, v) => acc + v.sampleSize, 0);
      const totalCompletions = variantMetrics.reduce((acc, v) => acc + v.completions, 0);
      const overallConversionRate = totalSampleSize > 0 ? Math.round((totalCompletions / totalSampleSize) * 100) : 0;
      const isStatisticallySignificant = totalSampleSize >= 100;

      type VariantMetric = typeof variantMetrics[0];
      const winner = variantMetrics.reduce((best: VariantMetric | null, current) => {
        if (!best || current.conversionRate > best.conversionRate) return current;
        return best;
      }, null);

      return {
        experiment,
        variants: variantMetrics,
        totalSampleSize,
        totalCompletions,
        overallConversionRate,
        isStatisticallySignificant,
        winner: winner && winner.conversionRate > (variantMetrics.find(v => v.isControl)?.conversionRate || 0) * 1.1 ? winner : null,
      };
    }),
});
