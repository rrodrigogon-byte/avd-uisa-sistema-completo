import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { eq, and, desc, sql, inArray, gte, lte, between } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  consolidatedMetrics,
  departmentAnalytics,
  trendAnalytics,
  avdAssessmentProcesses,
  avdCompetencyAssessments,
  avdCompetencyAssessmentItems,
  pirIntegrityAssessments,
  pirIntegrityDimensionScores,
  pdiPlans,
  pdiItems,
  employees,
  departments,
  competencies,
} from "../../drizzle/schema";

/**
 * Router para dashboard de análise consolidada
 */
export const consolidatedDashboardRouter = router({
  // ============ MÉTRICAS CONSOLIDADAS ============

  /**
   * Obter métricas consolidadas gerais
   */
  getConsolidatedMetrics: protectedProcedure
    .input(z.object({
      periodStart: z.date(),
      periodEnd: z.date(),
      departmentId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { metrics: {} };

      const { periodStart, periodEnd, departmentId } = input;

      // Taxa de conclusão de avaliações
      const processesQuery = db
        .select({
          total: sql<number>`COUNT(*)`,
          completed: sql<number>`SUM(CASE WHEN ${avdAssessmentProcesses.currentStep} = 5 THEN 1 ELSE 0 END)`,
        })
        .from(avdAssessmentProcesses)
        .where(
          and(
            gte(avdAssessmentProcesses.createdAt, periodStart),
            lte(avdAssessmentProcesses.createdAt, periodEnd),
            departmentId ? eq(avdAssessmentProcesses.employeeId, departmentId) : undefined
          )
        );

      const processesResult = await processesQuery;
      const totalProcesses = processesResult[0]?.total || 0;
      const completedProcesses = processesResult[0]?.completed || 0;
      const completionRate = totalProcesses > 0 ? Math.round((completedProcesses / totalProcesses) * 100) : 0;

      // Média de performance geral (competências)
      const competencyScoresQuery = db
        .select({
          avgScore: sql<number>`AVG(${avdCompetencyAssessmentItems.score})`,
        })
        .from(avdCompetencyAssessmentItems)
        .leftJoin(avdCompetencyAssessments, eq(avdCompetencyAssessmentItems.assessmentId, avdCompetencyAssessments.id))
        .where(
          and(
            gte(avdCompetencyAssessments.createdAt, periodStart),
            lte(avdCompetencyAssessments.createdAt, periodEnd)
          )
        );

      const competencyScoresResult = await competencyScoresQuery;
      const avgCompetencyScore = Math.round(competencyScoresResult[0]?.avgScore || 0);

      // Média de PIR Integridade
      const pirScoresQuery = db
        .select({
          avgScore: sql<number>`AVG(${pirIntegrityAssessments.overallScore})`,
        })
        .from(pirIntegrityAssessments)
        .where(
          and(
            gte(pirIntegrityAssessments.createdAt, periodStart),
            lte(pirIntegrityAssessments.createdAt, periodEnd),
            eq(pirIntegrityAssessments.status, "completed")
          )
        );

      const pirScoresResult = await pirScoresQuery;
      const avgPirScore = Math.round(pirScoresResult[0]?.avgScore || 0);

      // PDIs ativos
      const pdiQuery = db
        .select({
          total: sql<number>`COUNT(*)`,
          active: sql<number>`SUM(CASE WHEN ${pdiPlans.status} = 'ativo' THEN 1 ELSE 0 END)`,
        })
        .from(pdiPlans)
        .where(
          and(
            gte(pdiPlans.createdAt, periodStart),
            lte(pdiPlans.createdAt, periodEnd)
          )
        );

      const pdiResult = await pdiQuery;
      const totalPdis = pdiResult[0]?.total || 0;
      const activePdis = pdiResult[0]?.active || 0;

      // Gaps críticos
      const gapsQuery = db.execute(sql`
        SELECT COUNT(*) as criticalGaps
        FROM gapAnalysis
        WHERE gapLevel = 'critico'
        AND status = 'identificado'
        AND identifiedAt BETWEEN ${periodStart} AND ${periodEnd}
      `);

      const gapsResult = await gapsQuery;
      const criticalGaps = (gapsResult[0] as any[])[0]?.criticalGaps || 0;

      return {
        metrics: {
          completionRate,
          totalProcesses,
          completedProcesses,
          avgCompetencyScore,
          avgPirScore,
          totalPdis,
          activePdis,
          criticalGaps,
        },
      };
    }),

  /**
   * Obter análises por departamento
   */
  getDepartmentAnalytics: protectedProcedure
    .input(z.object({
      periodStart: z.date(),
      periodEnd: z.date(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { departments: [] };

      const { periodStart, periodEnd } = input;

      // Buscar todos os departamentos
      const depts = await db.select().from(departments).where(eq(departments.active, true));

      const analytics = [];

      for (const dept of depts) {
        // Contar colaboradores do departamento
        const employeesCount = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(employees)
          .where(eq(employees.departmentId, dept.id));

        const totalEmployees = employeesCount[0]?.count || 0;

        // Avaliações concluídas do departamento
        const completedAssessments = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(avdAssessmentProcesses)
          .leftJoin(employees, eq(avdAssessmentProcesses.employeeId, employees.id))
          .where(
            and(
              eq(employees.departmentId, dept.id),
              eq(avdAssessmentProcesses.currentStep, 5),
              gte(avdAssessmentProcesses.createdAt, periodStart),
              lte(avdAssessmentProcesses.createdAt, periodEnd)
            )
          );

        const completed = completedAssessments[0]?.count || 0;
        const completionRate = totalEmployees > 0 ? Math.round((completed / totalEmployees) * 100) : 0;

        // Média de competências do departamento
        const avgCompetency = await db.execute(sql`
          SELECT AVG(ci.score) as avgScore
          FROM avdCompetencyAssessmentItems ci
          JOIN avdCompetencyAssessments ca ON ci.assessmentId = ca.id
          JOIN avdAssessmentProcesses ap ON ca.processId = ap.id
          JOIN employees e ON ap.employeeId = e.id
          WHERE e.departmentId = ${dept.id}
          AND ca.createdAt BETWEEN ${periodStart} AND ${periodEnd}
        `);

        const avgCompetencyScore = Math.round((avgCompetency[0] as any[])[0]?.avgScore || 0);

        // PDIs ativos do departamento
        const activePdis = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(pdiPlans)
          .leftJoin(employees, eq(pdiPlans.employeeId, employees.id))
          .where(
            and(
              eq(employees.departmentId, dept.id),
              eq(pdiPlans.status, "ativo"),
              gte(pdiPlans.createdAt, periodStart),
              lte(pdiPlans.createdAt, periodEnd)
            )
          );

        const activePdisCount = activePdis[0]?.count || 0;

        analytics.push({
          departmentId: dept.id,
          departmentName: dept.name,
          totalEmployees,
          completedAssessments: completed,
          completionRate,
          avgCompetencyScore,
          activePdisCount,
        });
      }

      return { departments: analytics };
    }),

  /**
   * Obter tendências temporais
   */
  getTrendAnalytics: protectedProcedure
    .input(z.object({
      trendType: z.enum([
        "performance_evolution",
        "competency_growth",
        "gap_reduction",
        "pdi_effectiveness",
        "assessment_participation"
      ]),
      periodStart: z.date(),
      periodEnd: z.date(),
      departmentId: z.number().optional(),
      employeeId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { trend: null };

      const { trendType, periodStart, periodEnd, departmentId, employeeId } = input;

      if (trendType === "performance_evolution") {
        // Evolução de performance ao longo do tempo (por mês)
        const query = db.execute(sql`
          SELECT 
            DATE_FORMAT(ca.createdAt, '%Y-%m') as period,
            AVG(ci.score) as avgScore
          FROM avdCompetencyAssessmentItems ci
          JOIN avdCompetencyAssessments ca ON ci.assessmentId = ca.id
          JOIN avdAssessmentProcesses ap ON ca.processId = ap.id
          ${employeeId ? sql`WHERE ap.employeeId = ${employeeId}` : sql``}
          ${departmentId && !employeeId ? sql`
            JOIN employees e ON ap.employeeId = e.id
            WHERE e.departmentId = ${departmentId}
          ` : sql``}
          ${sql`AND ca.createdAt BETWEEN ${periodStart} AND ${periodEnd}`}
          GROUP BY period
          ORDER BY period ASC
        `);

        const result = await query;
        const timeSeriesData = (result[0] as any[]).map((row: any) => ({
          period: row.period,
          value: Math.round(row.avgScore || 0),
        }));

        // Calcular tendência (crescente, estável, decrescente)
        let trend: "increasing" | "stable" | "decreasing" = "stable";
        if (timeSeriesData.length >= 2) {
          const first = timeSeriesData[0].value;
          const last = timeSeriesData[timeSeriesData.length - 1].value;
          const diff = last - first;
          if (diff > 5) trend = "increasing";
          else if (diff < -5) trend = "decreasing";
        }

        return {
          trend: {
            trendType,
            timeSeriesData,
            trend,
            trendStrength: Math.abs(timeSeriesData[timeSeriesData.length - 1]?.value - timeSeriesData[0]?.value) || 0,
          },
        };
      }

      if (trendType === "assessment_participation") {
        // Participação em avaliações ao longo do tempo
        const query = db.execute(sql`
          SELECT 
            DATE_FORMAT(createdAt, '%Y-%m') as period,
            COUNT(*) as total,
            SUM(CASE WHEN currentStep = 5 THEN 1 ELSE 0 END) as completed
          FROM avdAssessmentProcesses
          WHERE createdAt BETWEEN ${periodStart} AND ${periodEnd}
          ${employeeId ? sql`AND employeeId = ${employeeId}` : sql``}
          GROUP BY period
          ORDER BY period ASC
        `);

        const result = await query;
        const timeSeriesData = (result[0] as any[]).map((row: any) => ({
          period: row.period,
          value: row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0,
        }));

        return {
          trend: {
            trendType,
            timeSeriesData,
            trend: "stable" as const,
            trendStrength: 0,
          },
        };
      }

      return { trend: null };
    }),

  /**
   * Obter análise de competências consolidada
   */
  getCompetencyBreakdown: protectedProcedure
    .input(z.object({
      periodStart: z.date(),
      periodEnd: z.date(),
      departmentId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { competencies: [] };

      const { periodStart, periodEnd, departmentId } = input;

      const query = db.execute(sql`
        SELECT 
          c.id as competencyId,
          c.name as competencyName,
          c.category as competencyCategory,
          AVG(ci.score) as avgScore,
          COUNT(DISTINCT ci.assessmentId) as assessmentCount
        FROM avdCompetencyAssessmentItems ci
        JOIN competencies c ON ci.competencyId = c.id
        JOIN avdCompetencyAssessments ca ON ci.assessmentId = ca.id
        JOIN avdAssessmentProcesses ap ON ca.processId = ap.id
        ${departmentId ? sql`
          JOIN employees e ON ap.employeeId = e.id
          WHERE e.departmentId = ${departmentId}
          AND ca.createdAt BETWEEN ${periodStart} AND ${periodEnd}
        ` : sql`WHERE ca.createdAt BETWEEN ${periodStart} AND ${periodEnd}`}
        GROUP BY c.id, c.name, c.category
        ORDER BY avgScore ASC
      `);

      const result = await query;
      const competencies = (result[0] as any[]).map((row: any) => ({
        competencyId: row.competencyId,
        competencyName: row.competencyName,
        competencyCategory: row.competencyCategory,
        avgScore: Math.round(row.avgScore || 0),
        assessmentCount: row.assessmentCount,
      }));

      return { competencies };
    }),

  /**
   * Obter top performers
   */
  getTopPerformers: protectedProcedure
    .input(z.object({
      periodStart: z.date(),
      periodEnd: z.date(),
      departmentId: z.number().optional(),
      limit: z.number().default(10),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { performers: [] };

      const { periodStart, periodEnd, departmentId, limit } = input;

      const query = db.execute(sql`
        SELECT 
          e.id as employeeId,
          e.name as employeeName,
          d.name as departmentName,
          AVG(ci.score) as avgScore,
          COUNT(DISTINCT ca.id) as assessmentCount
        FROM employees e
        LEFT JOIN departments d ON e.departmentId = d.id
        LEFT JOIN avdAssessmentProcesses ap ON e.id = ap.employeeId
        LEFT JOIN avdCompetencyAssessments ca ON ap.id = ca.processId
        LEFT JOIN avdCompetencyAssessmentItems ci ON ca.id = ci.assessmentId
        WHERE ca.createdAt BETWEEN ${periodStart} AND ${periodEnd}
        ${departmentId ? sql`AND e.departmentId = ${departmentId}` : sql``}
        GROUP BY e.id, e.name, d.name
        HAVING assessmentCount > 0
        ORDER BY avgScore DESC
        LIMIT ${limit}
      `);

      const result = await query;
      const performers = (result[0] as any[]).map((row: any) => ({
        employeeId: row.employeeId,
        employeeName: row.employeeName,
        departmentName: row.departmentName,
        avgScore: Math.round(row.avgScore || 0),
        assessmentCount: row.assessmentCount,
      }));

      return { performers };
    }),

  /**
   * Exportar relatório consolidado
   */
  exportConsolidatedReport: protectedProcedure
    .input(z.object({
      periodStart: z.date(),
      periodEnd: z.date(),
      departmentId: z.number().optional(),
      format: z.enum(["json", "csv"]).default("json"),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { data: null };

      // Coletar todas as métricas
      const metrics = await consolidatedDashboardRouter.createCaller({ 
        user: { id: 1 } as any, 
        req: {} as any, 
        res: {} as any 
      }).getConsolidatedMetrics({
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        departmentId: input.departmentId,
      });

      const departments = await consolidatedDashboardRouter.createCaller({ 
        user: { id: 1 } as any, 
        req: {} as any, 
        res: {} as any 
      }).getDepartmentAnalytics({
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
      });

      const competencies = await consolidatedDashboardRouter.createCaller({ 
        user: { id: 1 } as any, 
        req: {} as any, 
        res: {} as any 
      }).getCompetencyBreakdown({
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        departmentId: input.departmentId,
      });

      const performers = await consolidatedDashboardRouter.createCaller({ 
        user: { id: 1 } as any, 
        req: {} as any, 
        res: {} as any 
      }).getTopPerformers({
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        departmentId: input.departmentId,
        limit: 10,
      });

      const reportData = {
        period: {
          start: input.periodStart,
          end: input.periodEnd,
        },
        metrics: metrics.metrics,
        departments: departments.departments,
        competencies: competencies.competencies,
        topPerformers: performers.performers,
        generatedAt: new Date(),
      };

      if (input.format === "csv") {
        // Converter para CSV (simplificado)
        const csvLines = [
          "Relatório Consolidado de Avaliações",
          `Período: ${input.periodStart.toLocaleDateString()} - ${input.periodEnd.toLocaleDateString()}`,
          "",
          "Métricas Gerais",
          `Taxa de Conclusão,${metrics.metrics.completionRate}%`,
          `Média de Competências,${metrics.metrics.avgCompetencyScore}`,
          `Média PIR,${metrics.metrics.avgPirScore}`,
          `PDIs Ativos,${metrics.metrics.activePdis}`,
          `Gaps Críticos,${metrics.metrics.criticalGaps}`,
        ];

        return {
          data: csvLines.join("\n"),
          format: "csv",
        };
      }

      return {
        data: reportData,
        format: "json",
      };
    }),
});
