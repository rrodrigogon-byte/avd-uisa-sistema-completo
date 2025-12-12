import { z } from "zod";
import { sql } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import {
  getPerformanceMetrics,
  getPerformanceHistory,
  getDepartmentPerformanceSummary,
  calculatePerformanceMetrics,
} from "../db";
import { TRPCError } from "@trpc/server";

/**
 * Router para Relatórios de Desempenho (Item 3)
 */
export const performanceReportsRouter = router({
  /**
   * Dashboard principal - KPIs gerais
   */
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const { getDb } = await import("../db");
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const currentYear = new Date().getFullYear();

    // Buscar estatísticas usando SQL direto
    const totalEvaluationsResult = await db.execute(
      sql`SELECT COUNT(*) as count FROM evaluationInstances`
    );
    const pendingEvaluationsResult = await db.execute(
      sql`SELECT COUNT(*) as count FROM evaluationInstances WHERE status = 'pendente'`
    );
    const completedEvaluationsResult = await db.execute(
      sql`SELECT COUNT(*) as count FROM evaluationInstances WHERE status = 'concluida'`
    );
    const activeEmployeesResult = await db.execute(
      sql`SELECT COUNT(*) as count FROM employees WHERE active = 1`
    );

    return {
      totalEvaluations: (totalEvaluationsResult as any)[0]?.[0]?.count || 0,
      pendingEvaluations: (pendingEvaluationsResult as any)[0]?.[0]?.count || 0,
      completedEvaluations: (completedEvaluationsResult as any)[0]?.[0]?.count || 0,
      activeEmployees: (activeEmployeesResult as any)[0]?.[0]?.count || 0,
      currentYear,
    };
  }),

  /**
   * Métricas de desempenho
   */
  metrics: protectedProcedure
    .input(
      z.object({
        employeeId: z.number().optional(),
        departmentId: z.number().optional(),
        periodYear: z.number(),
        periodMonth: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Verificar permissão
      if (input.departmentId && ctx.user.role === "colaborador") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Colaboradores só podem ver suas próprias métricas",
        });
      }

      return await getPerformanceMetrics(input);
    }),

  /**
   * Histórico de desempenho individual
   */
  history: protectedProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input, ctx }) => {
      // Verificar permissão
      const { getUserEmployee } = await import("../db");
      const employee = await getUserEmployee(ctx.user.id);

      const canView =
        ctx.user.role === "admin" ||
        ctx.user.role === "rh" ||
        ctx.user.role === "gestor" ||
        (employee && employee.id === input.employeeId);

      if (!canView) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sem permissão para visualizar este histórico",
        });
      }

      return await getPerformanceHistory(input.employeeId);
    }),

  /**
   * Resumo por departamento
   */
  departmentSummary: protectedProcedure
    .input(
      z.object({
        departmentId: z.number(),
        periodYear: z.number(),
        periodQuarter: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Verificar permissão
      if (ctx.user.role === "colaborador") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas gestores e RH podem ver resumos de departamento",
        });
      }

      return await getDepartmentPerformanceSummary(
        input.departmentId,
        input.periodYear,
        input.periodQuarter
      );
    }),

  /**
   * Calcular métricas
   */
  calculateMetrics: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        periodYear: z.number(),
        periodMonth: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verificar permissão
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores e RH podem calcular métricas",
        });
      }

      await calculatePerformanceMetrics(
        input.employeeId,
        input.periodYear,
        input.periodMonth
      );

      return { success: true };
    }),

  /**
   * Buscar dados para exportação com filtros
   */
  getExportData: protectedProcedure
    .input(
      z.object({
        employeeIds: z.array(z.number()).optional(),
        departmentIds: z.array(z.number()).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        testTypes: z.array(z.string()).optional(),
      })
    )
    .query(async ({ input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { testResults, employees, departments, positions } = await import("../../drizzle/schema");
      const { eq, and, gte, lte, desc, inArray } = await import("drizzle-orm");

      // Construir query base
      let query = db
        .select({
          resultId: testResults.id,
          employeeId: testResults.employeeId,
          employeeName: employees.name,
          employeeCode: employees.employeeCode,
          departmentName: departments.name,
          positionName: positions.name,
          testType: testResults.testType,
          score: testResults.score,
          completedAt: testResults.completedAt,
          answers: testResults.answers,
          interpretation: testResults.interpretation,
        })
        .from(testResults)
        .leftJoin(employees, eq(testResults.employeeId, employees.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .leftJoin(positions, eq(employees.positionId, positions.id));

      // Aplicar filtros
      const conditions = [];

      if (input.employeeIds && input.employeeIds.length > 0) {
        conditions.push(inArray(testResults.employeeId, input.employeeIds));
      }

      if (input.departmentIds && input.departmentIds.length > 0) {
        conditions.push(inArray(employees.departmentId, input.departmentIds));
      }

      if (input.startDate) {
        conditions.push(gte(testResults.completedAt, new Date(input.startDate)));
      }

      if (input.endDate) {
        conditions.push(lte(testResults.completedAt, new Date(input.endDate)));
      }

      if (input.testTypes && input.testTypes.length > 0) {
        conditions.push(inArray(testResults.testType, input.testTypes));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const results = await query.orderBy(desc(testResults.completedAt));

      // Calcular estatísticas comparativas
      const stats = {
        totalTests: results.length,
        averageScore: results.length > 0 
          ? results.reduce((sum: number, r: any) => sum + (r.score || 0), 0) / results.length 
          : 0,
        byTestType: {} as Record<string, { count: number; avgScore: number }>,
        byDepartment: {} as Record<string, { count: number; avgScore: number }>,
        byEmployee: {} as Record<string, { count: number; avgScore: number; name: string }>,
      };

      // Agrupar por tipo de teste
      results.forEach((result: any) => {
        if (result.testType) {
          if (!stats.byTestType[result.testType]) {
            stats.byTestType[result.testType] = { count: 0, avgScore: 0 };
          }
          stats.byTestType[result.testType].count++;
          stats.byTestType[result.testType].avgScore += result.score || 0;
        }

        // Agrupar por departamento
        const deptName = result.departmentName || "Sem Departamento";
        if (!stats.byDepartment[deptName]) {
          stats.byDepartment[deptName] = { count: 0, avgScore: 0 };
        }
        stats.byDepartment[deptName].count++;
        stats.byDepartment[deptName].avgScore += result.score || 0;

        // Agrupar por funcionário
        const empKey = `${result.employeeId}`;
        if (!stats.byEmployee[empKey]) {
          stats.byEmployee[empKey] = { 
            count: 0, 
            avgScore: 0, 
            name: result.employeeName || "Desconhecido" 
          };
        }
        stats.byEmployee[empKey].count++;
        stats.byEmployee[empKey].avgScore += result.score || 0;
      });

      // Calcular médias
      Object.keys(stats.byTestType).forEach(key => {
        stats.byTestType[key].avgScore /= stats.byTestType[key].count;
      });
      Object.keys(stats.byDepartment).forEach(key => {
        stats.byDepartment[key].avgScore /= stats.byDepartment[key].count;
      });
      Object.keys(stats.byEmployee).forEach(key => {
        stats.byEmployee[key].avgScore /= stats.byEmployee[key].count;
      });

      return {
        results,
        stats,
        filters: input,
        generatedAt: new Date(),
      };
    }),

  /**
   * Buscar evolução temporal de um funcionário
   */
  getEmployeeEvolution: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        testType: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { testResults, employees } = await import("../../drizzle/schema");
      const { eq, and, gte, lte } = await import("drizzle-orm");

      // Buscar dados do funcionário
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, input.employeeId))
        .limit(1);

      if (!employee) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Funcionário não encontrado" });
      }

      // Buscar histórico de testes
      const conditions = [eq(testResults.employeeId, input.employeeId)];

      if (input.testType) {
        conditions.push(eq(testResults.testType, input.testType));
      }

      if (input.startDate) {
        conditions.push(gte(testResults.completedAt, new Date(input.startDate)));
      }

      if (input.endDate) {
        conditions.push(lte(testResults.completedAt, new Date(input.endDate)));
      }

      const history = await db
        .select()
        .from(testResults)
        .where(and(...conditions))
        .orderBy(testResults.completedAt);

      // Calcular tendência (regressão linear simples)
      let trend = "stable";
      if (history.length >= 2) {
        const firstScore = history[0].score || 0;
        const lastScore = history[history.length - 1].score || 0;
        const diff = lastScore - firstScore;
        
        if (diff > 5) trend = "improving";
        else if (diff < -5) trend = "declining";
      }

      return {
        employee: {
          id: employee.id,
          name: employee.name,
          code: employee.employeeCode,
        },
        history,
        trend,
        totalTests: history.length,
        averageScore: history.length > 0
          ? history.reduce((sum: number, r: any) => sum + (r.score || 0), 0) / history.length
          : 0,
      };
    }),

  /**
   * Buscar comparação entre múltiplos funcionários
   */
  getComparativeAnalysis: protectedProcedure
    .input(
      z.object({
        employeeIds: z.array(z.number()),
        testType: z.string().optional(),
        period: z.enum(["30d", "90d", "6m", "1y", "all"]).default("all"),
      })
    )
    .query(async ({ input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { testResults, employees } = await import("../../drizzle/schema");
      const { eq, and, gte, inArray } = await import("drizzle-orm");

      // Calcular data de início baseado no período
      let startDate: Date | undefined;
      const now = new Date();
      
      switch (input.period) {
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "90d":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case "6m":
          startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
          break;
        case "1y":
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }

      // Buscar dados de todos os funcionários
      const employeesData = await db
        .select()
        .from(employees)
        .where(inArray(employees.id, input.employeeIds));

      // Buscar resultados de testes
      const conditions = [inArray(testResults.employeeId, input.employeeIds)];
      
      if (input.testType) {
        conditions.push(eq(testResults.testType, input.testType));
      }
      
      if (startDate) {
        conditions.push(gte(testResults.completedAt, startDate));
      }

      const results = await db
        .select()
        .from(testResults)
        .where(and(...conditions))
        .orderBy(testResults.completedAt);

      // Organizar dados por funcionário
      const comparison = employeesData.map(emp => {
        const empResults = results.filter((r: any) => r.employeeId === emp.id);
        const avgScore = empResults.length > 0
          ? empResults.reduce((sum: number, r: any) => sum + (r.score || 0), 0) / empResults.length
          : 0;

        return {
          employeeId: emp.id,
          employeeName: emp.name,
          employeeCode: emp.employeeCode,
          totalTests: empResults.length,
          averageScore: avgScore,
          latestScore: empResults.length > 0 ? empResults[empResults.length - 1].score : null,
          results: empResults,
        };
      });

      return {
        comparison,
        period: input.period,
        testType: input.testType,
        generatedAt: new Date(),
      };
    }),
});
