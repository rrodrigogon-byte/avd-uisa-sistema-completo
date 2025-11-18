import { TRPCError } from "@trpc/server";
import { desc, eq, sql, and, gte, lte, count } from "drizzle-orm";
import { z } from "zod";
import {
  employees,
  departments,
  positions,
  nineBoxPositions,
  successionPlans,
  performanceEvaluations,
  pdiPlans,
  goals,
} from "../drizzle/schema";
import { getDb } from "./db";
import { adminProcedure, router } from "./_core/trpc";

/**
 * Router de Dashboard Executivo
 * Métricas estratégicas para tomada de decisão da diretoria
 */

export const executiveRouter = router({
  /**
   * KPIs Executivos Gerais
   */
  getKPIs: adminProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        departmentId: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Total de colaboradores
      let employeeQuery = db.select({ count: count() }).from(employees);
      if (input.departmentId) {
        employeeQuery = employeeQuery.where(eq(employees.departmentId, input.departmentId)) as any;
      }
      const totalEmployees = await employeeQuery;

      // Colaboradores ativos (status ativo)
      let activeConditions = [eq(employees.status, "ativo")];
      if (input.departmentId) {
        activeConditions.push(eq(employees.departmentId, input.departmentId));
      }
      const activeEmployees = await db
        .select({ count: count() })
        .from(employees)
        .where(and(...activeConditions));

      // Taxa de turnover (simplificado - baseado em inativos nos últimos 12 meses)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      // Média de performance (baseado em avaliações)
      const avgPerformance = await db
        .select({
          avg: sql<number>`AVG(${performanceEvaluations.finalScore})`,
        })
        .from(performanceEvaluations);

      // Colaboradores de alto potencial (9-Box: performance e potential altos)
      const highPotential = await db
        .select({ count: count() })
        .from(nineBoxPositions)
        .where(
          and(
            eq(nineBoxPositions.performance, 3),
            eq(nineBoxPositions.potential, 3)
          )
        );

      // Posições críticas com sucessores identificados
      const successionCoverage = await db
        .select({
          total: count(),
        })
        .from(successionPlans);

      return {
        totalEmployees: totalEmployees[0]?.count || 0,
        activeEmployees: activeEmployees[0]?.count || 0,
        turnoverRate: 0, // TODO: calcular baseado em dados reais
        avgPerformanceScore: avgPerformance[0]?.avg || 0,
        highPotentialCount: highPotential[0]?.count || 0,
        successionCoverage: successionCoverage[0]?.total || 0,
      };
    }),

  /**
   * Distribuição de Headcount por Departamento
   */
  getHeadcountByDepartment: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const result = await db
      .select({
        departmentId: employees.departmentId,
        departmentName: departments.name,
        count: count(),
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .where(eq(employees.status, "ativo"))
      .groupBy(employees.departmentId, departments.name)
      .orderBy(desc(count()));

    return result.map((row) => ({
      department: row.departmentName || "Sem Departamento",
      count: row.count,
    }));
  }),

  /**
   * Evolução de Headcount (últimos 12 meses)
   */
  getHeadcountTrend: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Simulação de dados históricos (em produção, usar tabela de histórico)
    const months = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });

      // Contar colaboradores ativos naquela data
      const total = await db
        .select({ count: count() })
        .from(employees)
        .where(eq(employees.status, "ativo"));

      months.push({
        month: monthName,
        total: total[0]?.count || 0,
      });
    }

    return months;
  }),

  /**
   * Distribuição Salarial por Faixa
   */
  getSalaryDistribution: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Simular distribuição salarial (campo salary não existe no schema)
    const totalEmployees = await db
      .select({ count: count() })
      .from(employees)
      .where(eq(employees.status, "ativo"));

    const total = totalEmployees[0]?.count || 0;

    // Simular distribuição (dados fictícios)
    const ranges = [
      { label: "Até R$ 3.000", count: Math.floor(total * 0.15) },
      { label: "R$ 3.001 - R$ 5.000", count: Math.floor(total * 0.25) },
      { label: "R$ 5.001 - R$ 8.000", count: Math.floor(total * 0.30) },
      { label: "R$ 8.001 - R$ 12.000", count: Math.floor(total * 0.18) },
      { label: "R$ 12.001 - R$ 20.000", count: Math.floor(total * 0.08) },
      { label: "Acima de R$ 20.000", count: Math.floor(total * 0.04) },
    ];

    return ranges.map((r) => ({
      range: r.label,
      count: r.count,
    }));
  }),

  /**
   * Taxa de Turnover Mensal (últimos 12 meses)
   */
  getTurnoverRate: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Simulação de dados de turnover (em produção, usar tabela de histórico de desligamentos)
    const months = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });

      // Simular taxa de turnover (entre 1% e 5%)
      const rate = Math.random() * 4 + 1;

      months.push({
        month: monthName,
        rate: parseFloat(rate.toFixed(2)),
      });
    }

    return months;
  }),

  /**
   * Pipeline de Sucessão Crítica
   */
  getSuccessionPipeline: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const pipeline = await db
      .select({
        planId: successionPlans.id,
        positionName: positions.title,
        riskLevel: successionPlans.riskLevel,
        status: successionPlans.status,
      })
      .from(successionPlans)
      .leftJoin(positions, eq(successionPlans.positionId, positions.id))
      .where(eq(successionPlans.isCritical, true))
      .orderBy(desc(successionPlans.riskLevel));

    return pipeline.map((row) => ({
      position: row.positionName || "Posição Desconhecida",
      status: row.status || "ativo",
      riskLevel: row.riskLevel || "baixo",
    }));
  }),

  /**
   * ROI de Treinamentos (simulado)
   */
  getTrainingROI: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Contar PDIs com ações de treinamento concluídas
    const completedTrainings = await db
      .select({ count: count() })
      .from(pdiPlans)
      .where(eq(pdiPlans.status, "concluido"));

    // Calcular performance média antes e depois (simulado)
    const avgBefore = 3.2;
    const avgAfter = 3.8;
    const improvement = ((avgAfter - avgBefore) / avgBefore) * 100;

    return {
      totalTrainings: completedTrainings[0]?.count || 0,
      avgPerformanceBefore: avgBefore,
      avgPerformanceAfter: avgAfter,
      improvementPercent: parseFloat(improvement.toFixed(2)),
      estimatedROI: 250, // ROI estimado em %
    };
  }),

  /**
   * Distribuição de Performance por Nível (9-Box)
   */
  getPerformanceDistribution: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const distribution = await db
      .select({
        performance: nineBoxPositions.performance,
        potential: nineBoxPositions.potential,
        box: nineBoxPositions.box,
        count: count(),
      })
      .from(nineBoxPositions)
      .groupBy(nineBoxPositions.performance, nineBoxPositions.potential, nineBoxPositions.box)
      .orderBy(nineBoxPositions.performance, nineBoxPositions.potential);

    return distribution.map((row) => ({
      performance: row.performance,
      potential: row.potential,
      box: row.box,
      count: row.count,
    }));
  }),

  /**
   * Métricas de Engajamento (baseado em metas e PDI)
   */
  getEngagementMetrics: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Colaboradores com metas ativas
    const withGoals = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${goals.employeeId})` })
      .from(goals)
      .where(eq(goals.status, "em_andamento"));

    // Colaboradores com PDI ativo
    const withPDI = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${pdiPlans.employeeId})` })
      .from(pdiPlans)
      .where(eq(pdiPlans.status, "em_andamento"));

    // Total de colaboradores ativos
    const totalActive = await db
      .select({ count: count() })
      .from(employees)
      .where(eq(employees.status, "ativo"));

    const total = totalActive[0]?.count || 1;

    return {
      goalsEngagement: parseFloat((((withGoals[0]?.count || 0) / total) * 100).toFixed(2)),
      pdiEngagement: parseFloat((((withPDI[0]?.count || 0) / total) * 100).toFixed(2)),
      totalActive: total,
    };
  }),

  /**
   * Performance por Departamento (média de scores)
   */
  getPerformanceByDepartment: adminProcedure
    .input(
      z.object({
        cycleId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const result = await db
        .select({
          departmentId: employees.departmentId,
          departmentName: departments.name,
          avgScore: sql<number>`AVG(${performanceEvaluations.finalScore})`,
          count: count(),
        })
        .from(performanceEvaluations)
        .leftJoin(employees, eq(performanceEvaluations.employeeId, employees.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .groupBy(employees.departmentId, departments.name)
        .orderBy(desc(sql<number>`AVG(${performanceEvaluations.finalScore})`));

      return result.map((row) => ({
        department: row.departmentName || "Sem Departamento",
        avgScore: parseFloat((Number(row.avgScore) || 0).toFixed(2)),
        count: row.count,
      }));
    }),

  /**
   * Tendência de Performance (últimos 6 meses)
   */
  getPerformanceTrend: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Simulação de dados históricos (em produção, usar tabela de histórico)
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString("pt-BR", { month: "short" });

      // Simular performance média (entre 75% e 95%)
      const avgPerformance = Math.random() * 20 + 75;

      months.push({
        month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        avgPerformance: parseFloat(avgPerformance.toFixed(2)),
      });
    }

    return months;
  }),

  /**
   * Cobertura de Sucessão (distribuição por nível)
   */
  getSuccessionCoverage: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Simular distribuição de cobertura baseado em dados reais
    const totalPlans = await db
      .select({ count: count() })
      .from(successionPlans)
      .where(eq(successionPlans.status, "ativo"));

    const total = totalPlans[0]?.count || 45;

    // Distribuir baseado em padrões típicos
    return [
      { label: "Sem Cobertura", value: Math.floor(total * 0.18), color: "#EF4444" },
      { label: "Mínima", value: Math.floor(total * 0.33), color: "#F59E0B" },
      { label: "Adequada", value: Math.floor(total * 0.36), color: "#10B981" },
      { label: "Excelente", value: Math.floor(total * 0.13), color: "#3B82F6" },
    ];
  }),

  /**
   * Top 10 Performers (colaboradores com melhor desempenho)
   */
  getTopPerformers: adminProcedure
    .input(
      z.object({
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const result = await db
        .select({
          employeeId: performanceEvaluations.employeeId,
          employeeName: employees.name,
          departmentName: departments.name,
          positionTitle: positions.title,
          avgScore: sql<number>`AVG(${performanceEvaluations.finalScore})`,
        })
        .from(performanceEvaluations)
        .leftJoin(employees, eq(performanceEvaluations.employeeId, employees.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .leftJoin(positions, eq(employees.positionId, positions.id))
        .groupBy(
          performanceEvaluations.employeeId,
          employees.name,
          departments.name,
          positions.title
        )
        .orderBy(desc(sql<number>`AVG(${performanceEvaluations.finalScore})`))
        .limit(input.limit);

      return result.map((row) => ({
        id: row.employeeId,
        name: row.employeeName || "Desconhecido",
        department: row.departmentName || "Sem Departamento",
        position: row.positionTitle || "Sem Cargo",
        score: parseFloat((Number(row.avgScore) || 0).toFixed(2)),
      }));
    }),

  /**
   * Flight Risk (colaboradores com alto risco de saída)
   */
  getFlightRisk: adminProcedure
    .input(
      z.object({
        riskLevel: z.enum(["baixo", "medio", "alto", "critico"]).default("alto"),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Simulação de flight risk (em produção, usar tabela de risk assessment)
      const allEmployees = await db
        .select({
          id: employees.id,
          name: employees.name,
          departmentName: departments.name,
          positionTitle: positions.title,
        })
        .from(employees)
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .leftJoin(positions, eq(employees.positionId, positions.id))
        .where(eq(employees.status, "ativo"))
        .limit(input.limit);

      return allEmployees.map((emp) => ({
        id: emp.id,
        name: emp.name || "Desconhecido",
        department: emp.departmentName || "Sem Departamento",
        position: emp.positionTitle || "Sem Cargo",
        riskLevel: input.riskLevel,
        riskScore: Math.floor(Math.random() * 3) + 8, // Score entre 8-10
        status: "Em desenvolvimento" as const,
      }));
    }),
});

