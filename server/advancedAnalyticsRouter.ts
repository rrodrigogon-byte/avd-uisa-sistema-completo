import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { safeObjectKeys } from "./utils/objectHelpers";
import { getDb } from "./db";
import {
  employees,
  goals,
  performanceEvaluations,
  pdiPlans,
  pdiItems,
  departments,
  positions,
  evaluationCycles,
  nineBoxPositions,
} from "../drizzle/schema";
import { eq, and, gte, lte, sql, desc, count } from "drizzle-orm";

/**
 * Router de Analytics Avançado
 * Análises históricas e tendências de performance
 */

export const advancedAnalyticsRouter = router({
  /**
   * Tendência de adesão de metas (últimos 12 meses)
   */
  getGoalsAdherenceTrend: protectedProcedure
    .input(
      z.object({
        departmentId: z.number().optional(),
        months: z.number().default(12),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - input.months);

      // Buscar metas criadas nos últimos N meses
      let query = db
        .select({
          month: sql<string>`DATE_FORMAT(${goals.createdAt}, '%Y-%m')`,
          totalGoals: count(goals.id),
          completedGoals: sql<number>`SUM(CASE WHEN ${goals.status} = 'completed' THEN 1 ELSE 0 END)`,
          inProgressGoals: sql<number>`SUM(CASE WHEN ${goals.status} = 'in_progress' THEN 1 ELSE 0 END)`,
          notStartedGoals: sql<number>`SUM(CASE WHEN ${goals.status} = 'not_started' THEN 1 ELSE 0 END)`,
          avgProgress: sql<number>`AVG(${goals.progress})`,
        })
        .from(goals)
        .where(gte(goals.createdAt, monthsAgo))
        .groupBy(sql`DATE_FORMAT(${goals.createdAt}, '%Y-%m')`)
        .orderBy(sql`DATE_FORMAT(${goals.createdAt}, '%Y-%m')`);

      // Se filtrar por departamento, refazer query com join
      if (input.departmentId) {
        const resultsFiltered = await db
          .select({
            month: sql<string>`DATE_FORMAT(${goals.createdAt}, '%Y-%m')`,
            totalGoals: count(goals.id),
            completedGoals: sql<number>`SUM(CASE WHEN ${goals.status} = 'completed' THEN 1 ELSE 0 END)`,
            inProgressGoals: sql<number>`SUM(CASE WHEN ${goals.status} = 'in_progress' THEN 1 ELSE 0 END)`,
            notStartedGoals: sql<number>`SUM(CASE WHEN ${goals.status} = 'not_started' THEN 1 ELSE 0 END)`,
            avgProgress: sql<number>`AVG(${goals.progress})`,
          })
          .from(goals)
          .innerJoin(employees, eq(goals.employeeId, employees.id))
          .where(
            and(
              gte(goals.createdAt, monthsAgo),
              eq(employees.departmentId, input.departmentId)
            )
          )
          .groupBy(sql`DATE_FORMAT(${goals.createdAt}, '%Y-%m')`)
          .orderBy(sql`DATE_FORMAT(${goals.createdAt}, '%Y-%m')`);

        return resultsFiltered.map((r) => ({
          month: r.month,
          totalGoals: Number(r.totalGoals),
          completedGoals: Number(r.completedGoals),
          inProgressGoals: Number(r.inProgressGoals),
          notStartedGoals: Number(r.notStartedGoals),
          avgProgress: Number(r.avgProgress || 0).toFixed(1),
          adherenceRate: r.totalGoals
            ? ((Number(r.completedGoals) + Number(r.inProgressGoals)) / Number(r.totalGoals)) * 100
            : 0,
        }));
      }

      const results = await query;

      return results.map((r) => ({
        month: r.month,
        totalGoals: Number(r.totalGoals),
        completedGoals: Number(r.completedGoals),
        inProgressGoals: Number(r.inProgressGoals),
        notStartedGoals: Number(r.notStartedGoals),
        avgProgress: Number(r.avgProgress || 0).toFixed(1),
        adherenceRate: r.totalGoals
          ? ((Number(r.completedGoals) + Number(r.inProgressGoals)) / Number(r.totalGoals)) * 100
          : 0,
      }));
    }),

  /**
   * Evolução de performance por departamento
   */
  getPerformanceEvolutionByDepartment: protectedProcedure
    .input(
      z.object({
        months: z.number().default(12),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - input.months);

      const results = await db
        .select({
          departmentId: employees.departmentId,
          departmentName: departments.name,
          month: sql<string>`DATE_FORMAT(${performanceEvaluations.createdAt}, '%Y-%m')`,
          avgFinalScore: sql<number>`AVG(${performanceEvaluations.finalScore})`,
          totalEvaluations: count(performanceEvaluations.id),
        })
        .from(performanceEvaluations)
        .innerJoin(employees, eq(performanceEvaluations.employeeId, employees.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .where(gte(performanceEvaluations.createdAt, monthsAgo))
        .groupBy(
          employees.departmentId,
          departments.name,
          sql`DATE_FORMAT(${performanceEvaluations.createdAt}, '%Y-%m')`
        )
        .orderBy(
          departments.name,
          sql`DATE_FORMAT(${performanceEvaluations.createdAt}, '%Y-%m')`
        );

      // Agrupar por departamento
      const grouped: Record<string, any[]> = {};
      results.forEach((r) => {
        const deptName = r.departmentName || "Sem Departamento";
        if (!grouped[deptName]) {
          grouped[deptName] = [];
        }
        grouped[deptName].push({
          month: r.month,
          avgFinalScore: Number(r.avgFinalScore || 0).toFixed(1),
          totalEvaluations: Number(r.totalEvaluations),
        });
      });

      return grouped;
    }),

  /**
   * Análise de ciclos de avaliação (comparação ano a ano)
   */
  getEvaluationCyclesComparison: protectedProcedure.input(z.object({}).optional()).query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const cycles = await db
      .select({
        id: evaluationCycles.id,
        name: evaluationCycles.name,
        year: sql<number>`YEAR(${evaluationCycles.startDate})`,
        startDate: evaluationCycles.startDate,
        endDate: evaluationCycles.endDate,
        status: evaluationCycles.status,
        totalEvaluations: sql<number>`(
          SELECT COUNT(*) 
          FROM performanceEvaluations 
          WHERE performanceEvaluations.cycleId = evaluationCycles.id
        )`,
        completedEvaluations: sql<number>`(
          SELECT COUNT(*) 
          FROM performanceEvaluations 
          WHERE performanceEvaluations.cycleId = evaluationCycles.id 
          AND performanceEvaluations.status = 'completed'
        )`,
        avgPerformance: sql<number>`(
          SELECT AVG(finalScore) 
          FROM performanceEvaluations 
          WHERE performanceEvaluations.cycleId = evaluationCycles.id
        )`,
      })
      .from(evaluationCycles)
      .orderBy(desc(evaluationCycles.startDate));

    return cycles.map((c) => ({
      id: c.id,
      name: c.name,
      year: Number(c.year),
      startDate: c.startDate,
      endDate: c.endDate,
      status: c.status,
      totalEvaluations: Number(c.totalEvaluations || 0),
      completedEvaluations: Number(c.completedEvaluations || 0),
      completionRate:
        Number(c.totalEvaluations) > 0
          ? (Number(c.completedEvaluations) / Number(c.totalEvaluations)) * 100
          : 0,
      avgPerformance: Number(c.avgPerformance || 0).toFixed(1),
    }));
  }),

  /**
   * Tendência de conclusão de PDI ao longo do tempo
   */
  getPDICompletionTrend: protectedProcedure
    .input(
      z.object({
        months: z.number().default(12),
        departmentId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - input.months);

      let query = db
        .select({
          month: sql<string>`DATE_FORMAT(${pdiItems.createdAt}, '%Y-%m')`,
          totalItems: count(pdiItems.id),
          completedItems: sql<number>`SUM(CASE WHEN ${pdiItems.status} = 'completed' THEN 1 ELSE 0 END)`,
          inProgressItems: sql<number>`SUM(CASE WHEN ${pdiItems.status} = 'in_progress' THEN 1 ELSE 0 END)`,
          notStartedItems: sql<number>`SUM(CASE WHEN ${pdiItems.status} = 'not_started' THEN 1 ELSE 0 END)`,
        })
        .from(pdiItems)
        .where(gte(pdiItems.createdAt, monthsAgo))
        .groupBy(sql`DATE_FORMAT(${pdiItems.createdAt}, '%Y-%m')`)
        .orderBy(sql`DATE_FORMAT(${pdiItems.createdAt}, '%Y-%m')`);

      // Se filtrar por departamento, refazer query com join
      if (input.departmentId) {
        const resultsFiltered = await db
          .select({
            month: sql<string>`DATE_FORMAT(${pdiItems.createdAt}, '%Y-%m')`,
            totalItems: count(pdiItems.id),
            completedItems: sql<number>`SUM(CASE WHEN ${pdiItems.status} = 'completed' THEN 1 ELSE 0 END)`,
            inProgressItems: sql<number>`SUM(CASE WHEN ${pdiItems.status} = 'in_progress' THEN 1 ELSE 0 END)`,
            notStartedItems: sql<number>`SUM(CASE WHEN ${pdiItems.status} = 'not_started' THEN 1 ELSE 0 END)`,
          })
          .from(pdiItems)
          .innerJoin(pdiPlans, eq(pdiItems.planId, pdiPlans.id))
          .innerJoin(employees, eq(pdiPlans.employeeId, employees.id))
          .where(
            and(
              gte(pdiItems.createdAt, monthsAgo),
              eq(employees.departmentId, input.departmentId)
            )
          )
          .groupBy(sql`DATE_FORMAT(${pdiItems.createdAt}, '%Y-%m')`)
          .orderBy(sql`DATE_FORMAT(${pdiItems.createdAt}, '%Y-%m')`);

        return resultsFiltered.map((r) => ({
          month: r.month,
          totalItems: Number(r.totalItems),
          completedItems: Number(r.completedItems),
          inProgressItems: Number(r.inProgressItems),
          notStartedItems: Number(r.notStartedItems),
          completionRate: r.totalItems
            ? (Number(r.completedItems) / Number(r.totalItems)) * 100
            : 0,
        }));
      }

      const results = await query;

      return results.map((r) => ({
        month: r.month,
        totalItems: Number(r.totalItems),
        completedItems: Number(r.completedItems),
        inProgressItems: Number(r.inProgressItems),
        notStartedItems: Number(r.notStartedItems),
        completionRate: r.totalItems
          ? (Number(r.completedItems) / Number(r.totalItems)) * 100
          : 0,
      }));
    }),

  /**
   * Heatmap de engajamento por mês/departamento
   */
  getEngagementHeatmap: protectedProcedure
    .input(
      z.object({
        year: z.number().default(new Date().getFullYear()),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const startDate = new Date(input.year, 0, 1);
      const endDate = new Date(input.year, 11, 31);

      // Calcular engajamento baseado em atividades (metas, avaliações, PDI)
      const results = await db
        .select({
          departmentId: employees.departmentId,
          departmentName: departments.name,
          month: sql<number>`MONTH(${goals.createdAt})`,
          activityCount: count(goals.id),
        })
        .from(goals)
        .innerJoin(employees, eq(goals.employeeId, employees.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .where(and(gte(goals.createdAt, startDate), lte(goals.createdAt, endDate)))
        .groupBy(employees.departmentId, departments.name, sql`MONTH(${goals.createdAt})`)
        .orderBy(departments.name, sql`MONTH(${goals.createdAt})`);

      // Estruturar dados para heatmap
      const heatmapData: Record<string, number[]> = {};
      results.forEach((r) => {
        const deptName = r.departmentName || "Sem Departamento";
        if (!heatmapData[deptName]) {
          heatmapData[deptName] = new Array(12).fill(0);
        }
        heatmapData[deptName][r.month - 1] = Number(r.activityCount);
      });

      return {
        year: input.year,
        departments: safeObjectKeys(heatmapData),
        months: [
          "Jan",
          "Fev",
          "Mar",
          "Abr",
          "Mai",
          "Jun",
          "Jul",
          "Ago",
          "Set",
          "Out",
          "Nov",
          "Dez",
        ],
        data: heatmapData,
      };
    }),

  /**
   * Previsão de performance (análise simples baseada em tendências)
   */
  getPerformanceForecast: protectedProcedure
    .input(
      z.object({
        departmentId: z.number().optional(),
      })
    .optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar últimos 6 meses de dados
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      let query = db
        .select({
          month: sql<string>`DATE_FORMAT(${performanceEvaluations.createdAt}, '%Y-%m')`,
          avgPerformance: sql<number>`AVG(${performanceEvaluations.finalScore})`,
        })
        .from(performanceEvaluations)
        .where(gte(performanceEvaluations.createdAt, sixMonthsAgo))
        .groupBy(sql`DATE_FORMAT(${performanceEvaluations.createdAt}, '%Y-%m')`)
        .orderBy(sql`DATE_FORMAT(${performanceEvaluations.createdAt}, '%Y-%m')`);

      // Se filtrar por departamento, refazer query com join
      if (input.departmentId) {
        const resultsFiltered = await db
          .select({
            month: sql<string>`DATE_FORMAT(${performanceEvaluations.createdAt}, '%Y-%m')`,
            avgPerformance: sql<number>`AVG(${performanceEvaluations.finalScore})`,
          })
          .from(performanceEvaluations)
          .innerJoin(employees, eq(performanceEvaluations.employeeId, employees.id))
          .where(
            and(
              gte(performanceEvaluations.createdAt, sixMonthsAgo),
              eq(employees.departmentId, input.departmentId)
            )
          )
          .groupBy(sql`DATE_FORMAT(${performanceEvaluations.createdAt}, '%Y-%m')`)
          .orderBy(sql`DATE_FORMAT(${performanceEvaluations.createdAt}, '%Y-%m')`);

        const values = resultsFiltered.map((r) => Number(r.avgPerformance));
        
        if (values.length < 2) {
          return {
            trend: "insufficient_data",
            forecast: null,
            message: "Dados insuficientes para previsão (mínimo 2 meses)",
          };
        }

        const n = values.length;
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / n;

        let sumXY = 0;
        let sumX2 = 0;
        values.forEach((y, x) => {
          sumXY += x * y;
          sumX2 += x * x;
        });

        const slope = (n * sumXY - sum * (n * (n - 1)) / 2) / (n * sumX2 - ((n * (n - 1)) / 2) ** 2);

        const forecast = [];
        for (let i = 1; i <= 3; i++) {
          const predictedValue = values[n - 1] + slope * i;
          forecast.push({
            month: `+${i} mês`,
            predictedPerformance: Math.max(0, Math.min(100, predictedValue)).toFixed(1),
          });
        }

        return {
          trend: slope > 0.05 ? "improving" : slope < -0.05 ? "declining" : "stable",
          slope: slope.toFixed(3),
          currentAvg: avg.toFixed(1),
          forecast,
          historicalData: resultsFiltered.map((r) => ({
            month: r.month,
            avgPerformance: Number(r.avgPerformance).toFixed(1),
          })),
        };
      }

      const results = await query;

      if (results.length < 2) {
        return {
          trend: "insufficient_data",
          forecast: null,
          message: "Dados insuficientes para previsão (mínimo 2 meses)",
        };
      }

      // Calcular tendência linear simples
      const values = results.map((r) => Number(r.avgPerformance));
      const n = values.length;
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / n;

      // Calcular inclinação (slope)
      let sumXY = 0;
      let sumX2 = 0;
      values.forEach((y, x) => {
        sumXY += x * y;
        sumX2 += x * x;
      });

      const slope = (n * sumXY - sum * (n * (n - 1)) / 2) / (n * sumX2 - ((n * (n - 1)) / 2) ** 2);

      // Prever próximos 3 meses
      const forecast = [];
      for (let i = 1; i <= 3; i++) {
        const predictedValue = values[n - 1] + slope * i;
        forecast.push({
          month: `+${i} mês`,
          predictedPerformance: Math.max(0, Math.min(5, predictedValue)).toFixed(1),
        });
      }

      return {
        trend: slope > 0.05 ? "improving" : slope < -0.05 ? "declining" : "stable",
        slope: slope.toFixed(3),
        currentAvg: avg.toFixed(1),
        forecast,
        historicalData: results.map((r) => ({
          month: r.month,
          avgPerformance: Number(r.avgPerformance).toFixed(1),
        })),
      };
    }),

  /**
   * Estatísticas gerais do dashboard avançado
   */
  getAdvancedStats: protectedProcedure.input(z.object({}).optional()).query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [
      totalEmployees,
      totalGoals,
      totalEvaluations,
      totalPDIPlans,
      avgPerformance,
      avgGoalProgress,
    ] = await Promise.all([
      db.select({ count: count() }).from(employees).where(eq(employees.status, "ativo")),
      db.select({ count: count() }).from(goals),
      db.select({ count: count() }).from(performanceEvaluations),
      db.select({ count: count() }).from(pdiPlans),
      db
        .select({ avg: sql<number>`AVG(${performanceEvaluations.finalScore})` })
        .from(performanceEvaluations),
      db.select({ avg: sql<number>`AVG(${goals.progress})` }).from(goals),
    ]);

    return {
      totalEmployees: totalEmployees[0]?.count || 0,
      totalGoals: totalGoals[0]?.count || 0,
      totalEvaluations: totalEvaluations[0]?.count || 0,
      totalPDIPlans: totalPDIPlans[0]?.count || 0,
      avgPerformance: Number(avgPerformance[0]?.avg || 0).toFixed(1),
      avgGoalProgress: Number(avgGoalProgress[0]?.avg || 0).toFixed(1),
    };
  }),
});
