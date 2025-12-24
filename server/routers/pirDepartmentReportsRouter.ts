import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { eq, and, desc, sql, gte, lte, inArray, or, between } from "drizzle-orm";
import {
  pirIntegrityAssessments,
  pirIntegrityDimensionScores,
  pirIntegrityDimensions,
  employees,
  departments,
} from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

/**
 * Router para Relatórios Comparativos de Integridade por Departamento
 * Análise organizacional de integridade
 */
export const pirDepartmentReportsRouter = router({
  /**
   * Obter comparativo geral entre departamentos
   */
  getDepartmentComparison: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { departments: [], organizationAverage: 0 };

      const conditions = [eq(pirIntegrityAssessments.status, "completed")];
      
      if (input.startDate) {
        conditions.push(gte(pirIntegrityAssessments.completedAt, new Date(input.startDate)));
      }
      if (input.endDate) {
        conditions.push(lte(pirIntegrityAssessments.completedAt, new Date(input.endDate)));
      }

      // Buscar dados agregados por departamento
      const departmentStats = await db
        .select({
          departmentId: employees.departmentId,
          departmentName: departments.name,
          departmentCode: departments.code,
          avgScore: sql<number>`AVG(${pirIntegrityAssessments.overallScore})`,
          minScore: sql<number>`MIN(${pirIntegrityAssessments.overallScore})`,
          maxScore: sql<number>`MAX(${pirIntegrityAssessments.overallScore})`,
          totalAssessments: sql<number>`COUNT(DISTINCT ${pirIntegrityAssessments.id})`,
          totalEmployees: sql<number>`COUNT(DISTINCT ${pirIntegrityAssessments.employeeId})`,
          lowRiskCount: sql<number>`SUM(CASE WHEN ${pirIntegrityAssessments.riskLevel} = 'low' THEN 1 ELSE 0 END)`,
          moderateRiskCount: sql<number>`SUM(CASE WHEN ${pirIntegrityAssessments.riskLevel} = 'moderate' THEN 1 ELSE 0 END)`,
          highRiskCount: sql<number>`SUM(CASE WHEN ${pirIntegrityAssessments.riskLevel} = 'high' THEN 1 ELSE 0 END)`,
          criticalRiskCount: sql<number>`SUM(CASE WHEN ${pirIntegrityAssessments.riskLevel} = 'critical' THEN 1 ELSE 0 END)`,
        })
        .from(pirIntegrityAssessments)
        .innerJoin(employees, eq(pirIntegrityAssessments.employeeId, employees.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .where(and(...conditions))
        .groupBy(employees.departmentId, departments.name, departments.code);

      // Calcular média organizacional
      const [orgStats] = await db
        .select({
          avgScore: sql<number>`AVG(${pirIntegrityAssessments.overallScore})`,
          totalAssessments: sql<number>`COUNT(*)`,
        })
        .from(pirIntegrityAssessments)
        .where(and(...conditions));

      const organizationAverage = Math.round(Number(orgStats?.avgScore || 0));

      // Processar dados dos departamentos
      const processedDepartments = departmentStats.map(dept => ({
        departmentId: dept.departmentId,
        departmentName: dept.departmentName || "Sem Departamento",
        departmentCode: dept.departmentCode,
        avgScore: Math.round(Number(dept.avgScore || 0)),
        minScore: Number(dept.minScore || 0),
        maxScore: Number(dept.maxScore || 0),
        totalAssessments: Number(dept.totalAssessments || 0),
        totalEmployees: Number(dept.totalEmployees || 0),
        riskDistribution: {
          low: Number(dept.lowRiskCount || 0),
          moderate: Number(dept.moderateRiskCount || 0),
          high: Number(dept.highRiskCount || 0),
          critical: Number(dept.criticalRiskCount || 0),
        },
        comparedToOrg: Math.round(Number(dept.avgScore || 0)) - organizationAverage,
        riskPercentage: {
          low: Math.round((Number(dept.lowRiskCount || 0) / Number(dept.totalAssessments || 1)) * 100),
          moderate: Math.round((Number(dept.moderateRiskCount || 0) / Number(dept.totalAssessments || 1)) * 100),
          high: Math.round((Number(dept.highRiskCount || 0) / Number(dept.totalAssessments || 1)) * 100),
          critical: Math.round((Number(dept.criticalRiskCount || 0) / Number(dept.totalAssessments || 1)) * 100),
        },
      }));

      // Ordenar por pontuação média (decrescente)
      processedDepartments.sort((a, b) => b.avgScore - a.avgScore);

      return { 
        departments: processedDepartments, 
        organizationAverage,
        totalAssessments: Number(orgStats?.totalAssessments || 0),
      };
    }),

  /**
   * Obter comparativo por dimensão entre departamentos
   */
  getDimensionComparison: protectedProcedure
    .input(z.object({
      dimensionId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { dimensions: [], departments: [] };

      // Buscar todas as dimensões
      const dimensions = await db
        .select()
        .from(pirIntegrityDimensions)
        .orderBy(pirIntegrityDimensions.displayOrder);

      const conditions = [eq(pirIntegrityAssessments.status, "completed")];
      
      if (input.startDate) {
        conditions.push(gte(pirIntegrityAssessments.completedAt, new Date(input.startDate)));
      }
      if (input.endDate) {
        conditions.push(lte(pirIntegrityAssessments.completedAt, new Date(input.endDate)));
      }

      // Buscar pontuações por dimensão e departamento
      const dimensionStats = await db
        .select({
          departmentId: employees.departmentId,
          departmentName: departments.name,
          dimensionId: pirIntegrityDimensionScores.dimensionId,
          avgScore: sql<number>`AVG(${pirIntegrityDimensionScores.score})`,
          minScore: sql<number>`MIN(${pirIntegrityDimensionScores.score})`,
          maxScore: sql<number>`MAX(${pirIntegrityDimensionScores.score})`,
          count: sql<number>`COUNT(*)`,
        })
        .from(pirIntegrityDimensionScores)
        .innerJoin(pirIntegrityAssessments, eq(pirIntegrityDimensionScores.assessmentId, pirIntegrityAssessments.id))
        .innerJoin(employees, eq(pirIntegrityAssessments.employeeId, employees.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .where(and(...conditions))
        .groupBy(employees.departmentId, departments.name, pirIntegrityDimensionScores.dimensionId);

      // Organizar dados por departamento
      const departmentMap = new Map<number | null, {
        departmentId: number | null;
        departmentName: string;
        dimensions: Record<number, {
          avgScore: number;
          minScore: number;
          maxScore: number;
          count: number;
        }>;
      }>();

      for (const stat of dimensionStats) {
        const deptId = stat.departmentId;
        if (!departmentMap.has(deptId)) {
          departmentMap.set(deptId, {
            departmentId: deptId,
            departmentName: stat.departmentName || "Sem Departamento",
            dimensions: {},
          });
        }
        const dept = departmentMap.get(deptId)!;
        dept.dimensions[stat.dimensionId] = {
          avgScore: Math.round(Number(stat.avgScore || 0)),
          minScore: Number(stat.minScore || 0),
          maxScore: Number(stat.maxScore || 0),
          count: Number(stat.count || 0),
        };
      }

      return {
        dimensions: dimensions.map(d => ({
          id: d.id,
          code: d.code,
          name: d.name,
        })),
        departments: Array.from(departmentMap.values()),
      };
    }),

  /**
   * Obter ranking de departamentos
   */
  getDepartmentRanking: protectedProcedure
    .input(z.object({
      metric: z.enum(["avgScore", "lowRiskPercentage", "improvement"]).default("avgScore"),
      limit: z.number().default(10),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { ranking: [] };

      const conditions = [eq(pirIntegrityAssessments.status, "completed")];
      
      if (input.startDate) {
        conditions.push(gte(pirIntegrityAssessments.completedAt, new Date(input.startDate)));
      }
      if (input.endDate) {
        conditions.push(lte(pirIntegrityAssessments.completedAt, new Date(input.endDate)));
      }

      const stats = await db
        .select({
          departmentId: employees.departmentId,
          departmentName: departments.name,
          avgScore: sql<number>`AVG(${pirIntegrityAssessments.overallScore})`,
          totalAssessments: sql<number>`COUNT(*)`,
          lowRiskCount: sql<number>`SUM(CASE WHEN ${pirIntegrityAssessments.riskLevel} = 'low' THEN 1 ELSE 0 END)`,
        })
        .from(pirIntegrityAssessments)
        .innerJoin(employees, eq(pirIntegrityAssessments.employeeId, employees.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .where(and(...conditions))
        .groupBy(employees.departmentId, departments.name);

      const ranking = stats.map((stat, index) => ({
        position: 0,
        departmentId: stat.departmentId,
        departmentName: stat.departmentName || "Sem Departamento",
        avgScore: Math.round(Number(stat.avgScore || 0)),
        totalAssessments: Number(stat.totalAssessments || 0),
        lowRiskPercentage: Math.round((Number(stat.lowRiskCount || 0) / Number(stat.totalAssessments || 1)) * 100),
      }));

      // Ordenar pelo métrica escolhida
      if (input.metric === "avgScore") {
        ranking.sort((a, b) => b.avgScore - a.avgScore);
      } else if (input.metric === "lowRiskPercentage") {
        ranking.sort((a, b) => b.lowRiskPercentage - a.lowRiskPercentage);
      }

      // Atribuir posições
      ranking.forEach((item, index) => {
        item.position = index + 1;
      });

      return { ranking: ranking.slice(0, input.limit) };
    }),

  /**
   * Obter tendência temporal por departamento
   */
  getDepartmentTrend: protectedProcedure
    .input(z.object({
      departmentId: z.number().optional(),
      months: z.number().default(6),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { trends: [] };

      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - input.months);

      const conditions = [
        eq(pirIntegrityAssessments.status, "completed"),
        gte(pirIntegrityAssessments.completedAt, startDate),
      ];

      if (input.departmentId) {
        // Filtrar por departamento específico
        const deptEmployees = await db
          .select({ id: employees.id })
          .from(employees)
          .where(eq(employees.departmentId, input.departmentId));
        
        if (deptEmployees.length > 0) {
          conditions.push(inArray(pirIntegrityAssessments.employeeId, deptEmployees.map(e => e.id)));
        }
      }

      const monthlyStats = await db
        .select({
          month: sql<string>`DATE_FORMAT(${pirIntegrityAssessments.completedAt}, '%Y-%m')`,
          avgScore: sql<number>`AVG(${pirIntegrityAssessments.overallScore})`,
          totalAssessments: sql<number>`COUNT(*)`,
          lowRiskCount: sql<number>`SUM(CASE WHEN ${pirIntegrityAssessments.riskLevel} = 'low' THEN 1 ELSE 0 END)`,
          highRiskCount: sql<number>`SUM(CASE WHEN ${pirIntegrityAssessments.riskLevel} IN ('high', 'critical') THEN 1 ELSE 0 END)`,
        })
        .from(pirIntegrityAssessments)
        .innerJoin(employees, eq(pirIntegrityAssessments.employeeId, employees.id))
        .where(and(...conditions))
        .groupBy(sql`DATE_FORMAT(${pirIntegrityAssessments.completedAt}, '%Y-%m')`)
        .orderBy(sql`DATE_FORMAT(${pirIntegrityAssessments.completedAt}, '%Y-%m')`);

      const trends = monthlyStats.map(stat => ({
        month: stat.month,
        avgScore: Math.round(Number(stat.avgScore || 0)),
        totalAssessments: Number(stat.totalAssessments || 0),
        lowRiskPercentage: Math.round((Number(stat.lowRiskCount || 0) / Number(stat.totalAssessments || 1)) * 100),
        highRiskPercentage: Math.round((Number(stat.highRiskCount || 0) / Number(stat.totalAssessments || 1)) * 100),
      }));

      return { trends };
    }),

  /**
   * Obter análise detalhada de um departamento
   */
  getDepartmentDetails: protectedProcedure
    .input(z.object({
      departmentId: z.number(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      // Buscar departamento
      const [department] = await db
        .select()
        .from(departments)
        .where(eq(departments.id, input.departmentId))
        .limit(1);

      if (!department) return null;

      // Buscar funcionários do departamento
      const deptEmployees = await db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.departmentId, input.departmentId));

      if (deptEmployees.length === 0) {
        return {
          department,
          stats: null,
          dimensionScores: [],
          riskDistribution: { low: 0, moderate: 0, high: 0, critical: 0 },
          recentAssessments: [],
        };
      }

      const employeeIds = deptEmployees.map(e => e.id);

      const conditions = [
        eq(pirIntegrityAssessments.status, "completed"),
        inArray(pirIntegrityAssessments.employeeId, employeeIds),
      ];

      if (input.startDate) {
        conditions.push(gte(pirIntegrityAssessments.completedAt, new Date(input.startDate)));
      }
      if (input.endDate) {
        conditions.push(lte(pirIntegrityAssessments.completedAt, new Date(input.endDate)));
      }

      // Estatísticas gerais
      const [stats] = await db
        .select({
          avgScore: sql<number>`AVG(${pirIntegrityAssessments.overallScore})`,
          minScore: sql<number>`MIN(${pirIntegrityAssessments.overallScore})`,
          maxScore: sql<number>`MAX(${pirIntegrityAssessments.overallScore})`,
          totalAssessments: sql<number>`COUNT(*)`,
          totalEmployees: sql<number>`COUNT(DISTINCT ${pirIntegrityAssessments.employeeId})`,
        })
        .from(pirIntegrityAssessments)
        .where(and(...conditions));

      // Distribuição de risco
      const riskStats = await db
        .select({
          riskLevel: pirIntegrityAssessments.riskLevel,
          count: sql<number>`COUNT(*)`,
        })
        .from(pirIntegrityAssessments)
        .where(and(...conditions))
        .groupBy(pirIntegrityAssessments.riskLevel);

      const riskDistribution = {
        low: 0,
        moderate: 0,
        high: 0,
        critical: 0,
      };
      for (const stat of riskStats) {
        if (stat.riskLevel && stat.riskLevel in riskDistribution) {
          riskDistribution[stat.riskLevel as keyof typeof riskDistribution] = Number(stat.count);
        }
      }

      // Pontuações por dimensão
      const dimensionStats = await db
        .select({
          dimensionId: pirIntegrityDimensionScores.dimensionId,
          dimensionName: pirIntegrityDimensions.name,
          dimensionCode: pirIntegrityDimensions.code,
          avgScore: sql<number>`AVG(${pirIntegrityDimensionScores.score})`,
          minScore: sql<number>`MIN(${pirIntegrityDimensionScores.score})`,
          maxScore: sql<number>`MAX(${pirIntegrityDimensionScores.score})`,
        })
        .from(pirIntegrityDimensionScores)
        .innerJoin(pirIntegrityAssessments, eq(pirIntegrityDimensionScores.assessmentId, pirIntegrityAssessments.id))
        .leftJoin(pirIntegrityDimensions, eq(pirIntegrityDimensionScores.dimensionId, pirIntegrityDimensions.id))
        .where(and(...conditions))
        .groupBy(pirIntegrityDimensionScores.dimensionId, pirIntegrityDimensions.name, pirIntegrityDimensions.code);

      // Avaliações recentes
      const recentAssessments = await db
        .select({
          assessment: pirIntegrityAssessments,
          employee: employees,
        })
        .from(pirIntegrityAssessments)
        .innerJoin(employees, eq(pirIntegrityAssessments.employeeId, employees.id))
        .where(and(...conditions))
        .orderBy(desc(pirIntegrityAssessments.completedAt))
        .limit(10);

      return {
        department,
        stats: {
          avgScore: Math.round(Number(stats?.avgScore || 0)),
          minScore: Number(stats?.minScore || 0),
          maxScore: Number(stats?.maxScore || 0),
          totalAssessments: Number(stats?.totalAssessments || 0),
          totalEmployees: Number(stats?.totalEmployees || 0),
        },
        dimensionScores: dimensionStats.map(d => ({
          dimensionId: d.dimensionId,
          dimensionName: d.dimensionName,
          dimensionCode: d.dimensionCode,
          avgScore: Math.round(Number(d.avgScore || 0)),
          minScore: Number(d.minScore || 0),
          maxScore: Number(d.maxScore || 0),
        })),
        riskDistribution,
        recentAssessments: recentAssessments.map(a => ({
          ...a.assessment,
          employeeName: a.employee.name,
          employeeCode: a.employee.employeeCode,
        })),
      };
    }),

  /**
   * Exportar relatório comparativo
   */
  exportComparisonReport: protectedProcedure
    .input(z.object({
      format: z.enum(["json", "csv"]).default("json"),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [eq(pirIntegrityAssessments.status, "completed")];
      
      if (input.startDate) {
        conditions.push(gte(pirIntegrityAssessments.completedAt, new Date(input.startDate)));
      }
      if (input.endDate) {
        conditions.push(lte(pirIntegrityAssessments.completedAt, new Date(input.endDate)));
      }

      // Buscar dados completos
      const data = await db
        .select({
          departmentId: employees.departmentId,
          departmentName: departments.name,
          employeeId: pirIntegrityAssessments.employeeId,
          employeeName: employees.name,
          overallScore: pirIntegrityAssessments.overallScore,
          riskLevel: pirIntegrityAssessments.riskLevel,
          moralLevel: pirIntegrityAssessments.moralLevel,
          completedAt: pirIntegrityAssessments.completedAt,
        })
        .from(pirIntegrityAssessments)
        .innerJoin(employees, eq(pirIntegrityAssessments.employeeId, employees.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .where(and(...conditions))
        .orderBy(departments.name, employees.name);

      if (input.format === "csv") {
        // Gerar CSV
        const headers = ["Departamento", "Funcionário", "Pontuação", "Nível de Risco", "Nível Moral", "Data"];
        const rows = data.map(d => [
          d.departmentName || "Sem Departamento",
          d.employeeName,
          d.overallScore?.toString() || "0",
          d.riskLevel || "N/A",
          d.moralLevel || "N/A",
          d.completedAt?.toISOString().split("T")[0] || "N/A",
        ]);

        const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        return { format: "csv", data: csv };
      }

      return { format: "json", data };
    }),

  /**
   * Obter métricas organizacionais consolidadas
   */
  getOrganizationMetrics: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const conditions = [eq(pirIntegrityAssessments.status, "completed")];
      
      if (input.startDate) {
        conditions.push(gte(pirIntegrityAssessments.completedAt, new Date(input.startDate)));
      }
      if (input.endDate) {
        conditions.push(lte(pirIntegrityAssessments.completedAt, new Date(input.endDate)));
      }

      // Métricas gerais
      const [generalStats] = await db
        .select({
          avgScore: sql<number>`AVG(${pirIntegrityAssessments.overallScore})`,
          totalAssessments: sql<number>`COUNT(*)`,
          totalEmployees: sql<number>`COUNT(DISTINCT ${pirIntegrityAssessments.employeeId})`,
          totalDepartments: sql<number>`COUNT(DISTINCT ${employees.departmentId})`,
        })
        .from(pirIntegrityAssessments)
        .innerJoin(employees, eq(pirIntegrityAssessments.employeeId, employees.id))
        .where(and(...conditions));

      // Distribuição de risco organizacional
      const riskStats = await db
        .select({
          riskLevel: pirIntegrityAssessments.riskLevel,
          count: sql<number>`COUNT(*)`,
        })
        .from(pirIntegrityAssessments)
        .where(and(...conditions))
        .groupBy(pirIntegrityAssessments.riskLevel);

      const riskDistribution = {
        low: 0,
        moderate: 0,
        high: 0,
        critical: 0,
      };
      for (const stat of riskStats) {
        if (stat.riskLevel && stat.riskLevel in riskDistribution) {
          riskDistribution[stat.riskLevel as keyof typeof riskDistribution] = Number(stat.count);
        }
      }

      // Distribuição de nível moral
      const moralStats = await db
        .select({
          moralLevel: pirIntegrityAssessments.moralLevel,
          count: sql<number>`COUNT(*)`,
        })
        .from(pirIntegrityAssessments)
        .where(and(...conditions))
        .groupBy(pirIntegrityAssessments.moralLevel);

      const moralDistribution = {
        pre_conventional: 0,
        conventional: 0,
        post_conventional: 0,
      };
      for (const stat of moralStats) {
        if (stat.moralLevel && stat.moralLevel in moralDistribution) {
          moralDistribution[stat.moralLevel as keyof typeof moralDistribution] = Number(stat.count);
        }
      }

      // Pontuação média por dimensão
      const dimensionStats = await db
        .select({
          dimensionId: pirIntegrityDimensionScores.dimensionId,
          dimensionName: pirIntegrityDimensions.name,
          dimensionCode: pirIntegrityDimensions.code,
          avgScore: sql<number>`AVG(${pirIntegrityDimensionScores.score})`,
        })
        .from(pirIntegrityDimensionScores)
        .innerJoin(pirIntegrityAssessments, eq(pirIntegrityDimensionScores.assessmentId, pirIntegrityAssessments.id))
        .leftJoin(pirIntegrityDimensions, eq(pirIntegrityDimensionScores.dimensionId, pirIntegrityDimensions.id))
        .where(and(...conditions))
        .groupBy(pirIntegrityDimensionScores.dimensionId, pirIntegrityDimensions.name, pirIntegrityDimensions.code);

      return {
        general: {
          avgScore: Math.round(Number(generalStats?.avgScore || 0)),
          totalAssessments: Number(generalStats?.totalAssessments || 0),
          totalEmployees: Number(generalStats?.totalEmployees || 0),
          totalDepartments: Number(generalStats?.totalDepartments || 0),
        },
        riskDistribution,
        moralDistribution,
        dimensionScores: dimensionStats.map(d => ({
          dimensionId: d.dimensionId,
          dimensionName: d.dimensionName,
          dimensionCode: d.dimensionCode,
          avgScore: Math.round(Number(d.avgScore || 0)),
        })),
        healthIndex: calculateHealthIndex(riskDistribution),
      };
    }),
});

/**
 * Calcula um índice de saúde organizacional baseado na distribuição de risco
 */
function calculateHealthIndex(riskDistribution: { low: number; moderate: number; high: number; critical: number }): number {
  const total = riskDistribution.low + riskDistribution.moderate + riskDistribution.high + riskDistribution.critical;
  if (total === 0) return 0;

  // Pesos: low = 100, moderate = 70, high = 30, critical = 0
  const weightedSum = 
    (riskDistribution.low * 100) + 
    (riskDistribution.moderate * 70) + 
    (riskDistribution.high * 30) + 
    (riskDistribution.critical * 0);

  return Math.round(weightedSum / total);
}
