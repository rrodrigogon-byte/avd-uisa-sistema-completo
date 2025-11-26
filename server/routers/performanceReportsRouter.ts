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
});
