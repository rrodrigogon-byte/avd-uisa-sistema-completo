/**
 * Router para Comparação Temporal de Resultados
 * Permite visualizar evolução e comparar resultados ao longo do tempo
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { pirAssessments, pirIntegrityAssessments, avdCompetencyAssessments, performanceEvaluations } from "../../drizzle/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

export const historicalComparisonRouter = router({
  /**
   * Buscar histórico de avaliações PIR de um colaborador
   */
  getPIRHistory: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().default(10)
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [eq(pirAssessments.employeeId, input.employeeId)];
      
      if (input.startDate) {
        conditions.push(gte(pirAssessments.assessmentDate, new Date(input.startDate)));
      }
      
      if (input.endDate) {
        conditions.push(lte(pirAssessments.assessmentDate, new Date(input.endDate)));
      }

      const results = await db
        .select()
        .from(pirAssessments)
        .where(and(...conditions))
        .orderBy(desc(pirAssessments.assessmentDate))
        .limit(input.limit);

      return results || [];
    }),

  /**
   * Buscar histórico de avaliações PIR Integridade de um colaborador
   */
  getPIRIntegrityHistory: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().default(10)
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [eq(pirIntegrityAssessments.employeeId, input.employeeId)];
      
      if (input.startDate) {
        conditions.push(gte(pirIntegrityAssessments.createdAt, new Date(input.startDate)));
      }
      
      if (input.endDate) {
        conditions.push(lte(pirIntegrityAssessments.createdAt, new Date(input.endDate)));
      }

      const results = await db
        .select()
        .from(pirIntegrityAssessments)
        .where(and(...conditions))
        .orderBy(desc(pirIntegrityAssessments.createdAt))
        .limit(input.limit);

      return results || [];
    }),

  /**
   * Buscar histórico de avaliações de competências de um colaborador
   */
  getCompetencyHistory: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().default(10)
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [eq(avdCompetencyAssessments.employeeId, input.employeeId)];
      
      if (input.startDate) {
        conditions.push(gte(avdCompetencyAssessments.createdAt, new Date(input.startDate)));
      }
      
      if (input.endDate) {
        conditions.push(lte(avdCompetencyAssessments.createdAt, new Date(input.endDate)));
      }

      const results = await db
        .select()
        .from(avdCompetencyAssessments)
        .where(and(...conditions))
        .orderBy(desc(avdCompetencyAssessments.createdAt))
        .limit(input.limit);

      return results || [];
    }),

  /**
   * Buscar histórico de avaliações de desempenho de um colaborador
   */
  getPerformanceHistory: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().default(10)
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [eq(performanceEvaluations.employeeId, input.employeeId)];
      
      if (input.startDate) {
        conditions.push(gte(performanceEvaluations.evaluationDate, new Date(input.startDate)));
      }
      
      if (input.endDate) {
        conditions.push(lte(performanceEvaluations.evaluationDate, new Date(input.endDate)));
      }

      const results = await db
        .select()
        .from(performanceEvaluations)
        .where(and(...conditions))
        .orderBy(desc(performanceEvaluations.evaluationDate))
        .limit(input.limit);

      return results || [];
    }),

  /**
   * Comparar dois resultados PIR lado a lado
   */
  comparePIRResults: protectedProcedure
    .input(z.object({
      assessmentId1: z.number(),
      assessmentId2: z.number()
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result1, result2] = await Promise.all([
        db.select().from(pirAssessments).where(eq(pirAssessments.id, input.assessmentId1)).limit(1),
        db.select().from(pirAssessments).where(eq(pirAssessments.id, input.assessmentId2)).limit(1)
      ]);

      if (!result1[0] || !result2[0]) {
        throw new Error("Uma ou ambas as avaliações não foram encontradas");
      }

      return {
        assessment1: result1[0],
        assessment2: result2[0],
        scoreDifference: (result2[0].overallScore || 0) - (result1[0].overallScore || 0),
        timeDifference: Math.floor(
          (new Date(result2[0].assessmentDate).getTime() - new Date(result1[0].assessmentDate).getTime()) / (1000 * 60 * 60 * 24)
        ) // Diferença em dias
      };
    }),

  /**
   * Obter estatísticas de evolução ao longo do tempo
   */
  getEvolutionStats: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
      assessmentType: z.enum(["pir", "pir_integrity", "competency", "performance"]),
      period: z.enum(["last_month", "last_quarter", "last_year", "all_time"]).default("last_year")
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Calcular data de início baseado no período
      const now = new Date();
      let startDate = new Date();
      
      switch (input.period) {
        case "last_month":
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "last_quarter":
          startDate.setMonth(now.getMonth() - 3);
          break;
        case "last_year":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        case "all_time":
          startDate = new Date(0); // Desde o início dos tempos
          break;
      }

      let results: any[] = [];

      // Buscar dados baseado no tipo de avaliação
      switch (input.assessmentType) {
        case "pir":
          results = await db
            .select()
            .from(pirAssessments)
            .where(
              and(
                eq(pirAssessments.employeeId, input.employeeId),
                gte(pirAssessments.assessmentDate, startDate)
              )
            )
            .orderBy(pirAssessments.assessmentDate);
          break;

        case "pir_integrity":
          results = await db
            .select()
            .from(pirIntegrityAssessments)
            .where(
              and(
                eq(pirIntegrityAssessments.employeeId, input.employeeId),
                gte(pirIntegrityAssessments.createdAt, startDate)
              )
            )
            .orderBy(pirIntegrityAssessments.createdAt);
          break;

        case "competency":
          results = await db
            .select()
            .from(avdCompetencyAssessments)
            .where(
              and(
                eq(avdCompetencyAssessments.employeeId, input.employeeId),
                gte(avdCompetencyAssessments.createdAt, startDate)
              )
            )
            .orderBy(avdCompetencyAssessments.createdAt);
          break;

        case "performance":
          results = await db
            .select()
            .from(performanceEvaluations)
            .where(
              and(
                eq(performanceEvaluations.employeeId, input.employeeId),
                gte(performanceEvaluations.evaluationDate, startDate)
              )
            )
            .orderBy(performanceEvaluations.evaluationDate);
          break;
      }

      // Calcular estatísticas
      if (results.length === 0) {
        return {
          totalAssessments: 0,
          averageScore: 0,
          trend: "stable" as const,
          improvement: 0,
          assessments: []
        };
      }

      const scores = results.map(r => {
        switch (input.assessmentType) {
          case "pir":
            return r.overallScore || 0;
          case "pir_integrity":
            return r.overallScore || 0;
          case "competency":
            return r.averageScore || 0;
          case "performance":
            return r.overallScore || 0;
          default:
            return 0;
        }
      });

      const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const firstScore = scores[0];
      const lastScore = scores[scores.length - 1];
      const improvement = lastScore - firstScore;
      
      let trend: "improving" | "declining" | "stable" = "stable";
      if (improvement > 5) trend = "improving";
      else if (improvement < -5) trend = "declining";

      return {
        totalAssessments: results.length,
        averageScore: Math.round(averageScore * 10) / 10,
        trend,
        improvement: Math.round(improvement * 10) / 10,
        assessments: results
      };
    }),
});
