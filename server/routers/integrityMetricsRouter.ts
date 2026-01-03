import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { pirIntegrityAssessments, employees, departments } from "../../drizzle/schema";
import { eq, and, desc, isNull, isNotNull, gte, lte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Router para Métricas de Integridade
 * Fornece estatísticas e análises dos testes de integridade PIR
 */

export const integrityMetricsRouter = router({
  /**
   * Buscar histórico de testes de integridade
   */
  getHistory: protectedProcedure
    .input(z.object({
      employeeId: z.number().optional(),
      departmentId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      status: z.enum(["pending", "completed", "expired", "all"]).optional().default("all"),
      limit: z.number().optional().default(50),
    }).default({}))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Construir condições de filtro
      const conditions = [];
      if (input.employeeId) conditions.push(eq(pirIntegrityAssessments.employeeId, input.employeeId));
      if (input.departmentId) conditions.push(eq(employees.departmentId, input.departmentId));
      if (input.startDate) conditions.push(gte(pirIntegrityAssessments.createdAt, new Date(input.startDate)));
      if (input.endDate) conditions.push(lte(pirIntegrityAssessments.createdAt, new Date(input.endDate)));

      // Filtro de status
      if (input.status === "pending") {
        conditions.push(isNull(pirIntegrityAssessments.completedAt));
      } else if (input.status === "completed") {
        conditions.push(isNotNull(pirIntegrityAssessments.completedAt));
      } else if (input.status === "expired") {
        conditions.push(and(
          isNull(pirIntegrityAssessments.completedAt),
          lte(pirIntegrityAssessments.expiresAt, new Date())
        ));
      }

      // Buscar testes
      const tests = await db
        .select({
          id: pirIntegrityAssessments.id,
          employeeId: pirIntegrityAssessments.employeeId,
          employeeName: employees.name,
          employeeEmail: employees.email,
          departmentId: employees.departmentId,
          departmentName: departments.name,
          createdAt: pirIntegrityAssessments.createdAt,
          completedAt: pirIntegrityAssessments.completedAt,
          expiresAt: pirIntegrityAssessments.expiresAt,
          score: pirIntegrityAssessments.score,
          status: pirIntegrityAssessments.status,
        })
        .from(pirIntegrityAssessments)
        .leftJoin(employees, eq(pirIntegrityAssessments.employeeId, employees.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(pirIntegrityAssessments.createdAt))
        .limit(input.limit);

      return tests;
    }),

  /**
   * Calcular taxa de conclusão de testes
   */
  getCompletionRate: protectedProcedure
    .input(z.object({
      departmentId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).default({}))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Construir condições de filtro
      const conditions = [];
      if (input.departmentId) conditions.push(eq(employees.departmentId, input.departmentId));
      if (input.startDate) conditions.push(gte(pirIntegrityAssessments.createdAt, new Date(input.startDate)));
      if (input.endDate) conditions.push(lte(pirIntegrityAssessments.createdAt, new Date(input.endDate)));

      // Contar total de testes
      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(pirIntegrityAssessments)
        .leftJoin(employees, eq(pirIntegrityAssessments.employeeId, employees.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const total = totalResult[0]?.count || 0;

      // Contar testes completados
      const completedResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(pirIntegrityAssessments)
        .leftJoin(employees, eq(pirIntegrityAssessments.employeeId, employees.id))
        .where(and(
          isNotNull(pirIntegrityAssessments.completedAt),
          ...(conditions.length > 0 ? conditions : [])
        ));

      const completed = completedResult[0]?.count || 0;

      // Contar testes pendentes
      const pendingResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(pirIntegrityAssessments)
        .leftJoin(employees, eq(pirIntegrityAssessments.employeeId, employees.id))
        .where(and(
          isNull(pirIntegrityAssessments.completedAt),
          ...(conditions.length > 0 ? conditions : [])
        ));

      const pending = pendingResult[0]?.count || 0;

      // Contar testes expirados
      const expiredResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(pirIntegrityAssessments)
        .leftJoin(employees, eq(pirIntegrityAssessments.employeeId, employees.id))
        .where(and(
          isNull(pirIntegrityAssessments.completedAt),
          lte(pirIntegrityAssessments.expiresAt, new Date()),
          ...(conditions.length > 0 ? conditions : [])
        ));

      const expired = expiredResult[0]?.count || 0;

      // Calcular taxa de conclusão
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        total,
        completed,
        pending,
        expired,
        completionRate,
      };
    }),

  /**
   * Buscar tendências de testes por período
   */
  getTrends: protectedProcedure
    .input(z.object({
      departmentId: z.number().optional(),
      months: z.number().optional().default(6),
    }).default({}))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Calcular data de início (X meses atrás)
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - input.months);

      // Construir condições de filtro
      const conditions = [gte(pirIntegrityAssessments.createdAt, startDate)];
      if (input.departmentId) conditions.push(eq(employees.departmentId, input.departmentId));

      // Buscar tendências agrupadas por mês
      const trends = await db
        .select({
          month: sql<string>`DATE_FORMAT(${pirIntegrityAssessments.createdAt}, '%Y-%m')`,
          total: sql<number>`count(*)`,
          completed: sql<number>`sum(case when ${pirIntegrityAssessments.completedAt} is not null then 1 else 0 end)`,
          pending: sql<number>`sum(case when ${pirIntegrityAssessments.completedAt} is null then 1 else 0 end)`,
        })
        .from(pirIntegrityAssessments)
        .leftJoin(employees, eq(pirIntegrityAssessments.employeeId, employees.id))
        .where(and(...conditions))
        .groupBy(sql`DATE_FORMAT(${pirIntegrityAssessments.createdAt}, '%Y-%m')`)
        .orderBy(sql`DATE_FORMAT(${pirIntegrityAssessments.createdAt}, '%Y-%m')`);

      return trends.map(trend => ({
        month: trend.month,
        total: trend.total,
        completed: trend.completed,
        pending: trend.pending,
        completionRate: trend.total > 0 ? Math.round((trend.completed / trend.total) * 100) : 0,
      }));
    }),

  /**
   * Buscar distribuição de scores
   */
  getScoreDistribution: protectedProcedure
    .input(z.object({
      departmentId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).default({}))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Construir condições de filtro
      const conditions = [isNotNull(pirIntegrityAssessments.completedAt)];
      if (input.departmentId) conditions.push(eq(employees.departmentId, input.departmentId));
      if (input.startDate) conditions.push(gte(pirIntegrityAssessments.createdAt, new Date(input.startDate)));
      if (input.endDate) conditions.push(lte(pirIntegrityAssessments.createdAt, new Date(input.endDate)));

      // Buscar scores
      const scores = await db
        .select({
          score: pirIntegrityAssessments.score,
        })
        .from(pirIntegrityAssessments)
        .leftJoin(employees, eq(pirIntegrityAssessments.employeeId, employees.id))
        .where(and(...conditions));

      // Agrupar scores por faixa
      const distribution = {
        excellent: 0,  // 90-100
        good: 0,       // 75-89
        average: 0,    // 60-74
        poor: 0,       // 0-59
      };

      scores.forEach(({ score }) => {
        if (!score) return;
        if (score >= 90) distribution.excellent++;
        else if (score >= 75) distribution.good++;
        else if (score >= 60) distribution.average++;
        else distribution.poor++;
      });

      // Calcular média de scores
      const validScores = scores.filter(s => s.score !== null).map(s => s.score!);
      const averageScore = validScores.length > 0
        ? Math.round((validScores.reduce((sum, score) => sum + score, 0) / validScores.length) * 10) / 10
        : 0;

      return {
        distribution,
        averageScore,
        totalScores: validScores.length,
      };
    }),

  /**
   * Buscar top performers (melhores scores)
   */
  getTopPerformers: protectedProcedure
    .input(z.object({
      departmentId: z.number().optional(),
      limit: z.number().optional().default(10),
    }).default({}))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Construir condições de filtro
      const conditions = [isNotNull(pirIntegrityAssessments.completedAt)];
      if (input.departmentId) conditions.push(eq(employees.departmentId, input.departmentId));

      // Buscar top performers
      const topPerformers = await db
        .select({
          employeeId: pirIntegrityAssessments.employeeId,
          employeeName: employees.name,
          departmentName: departments.name,
          score: pirIntegrityAssessments.score,
          completedAt: pirIntegrityAssessments.completedAt,
        })
        .from(pirIntegrityAssessments)
        .leftJoin(employees, eq(pirIntegrityAssessments.employeeId, employees.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .where(and(...conditions))
        .orderBy(desc(pirIntegrityAssessments.score))
        .limit(input.limit);

      return topPerformers;
    }),

  /**
   * Buscar estatísticas por departamento
   */
  getDepartmentStats: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).default({}))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Construir condições de filtro
      const conditions = [];
      if (input.startDate) conditions.push(gte(pirIntegrityAssessments.createdAt, new Date(input.startDate)));
      if (input.endDate) conditions.push(lte(pirIntegrityAssessments.createdAt, new Date(input.endDate)));

      // Buscar estatísticas por departamento
      const stats = await db
        .select({
          departmentId: employees.departmentId,
          departmentName: departments.name,
          total: sql<number>`count(*)`,
          completed: sql<number>`sum(case when ${pirIntegrityAssessments.completedAt} is not null then 1 else 0 end)`,
          averageScore: sql<number>`avg(case when ${pirIntegrityAssessments.score} is not null then ${pirIntegrityAssessments.score} else null end)`,
        })
        .from(pirIntegrityAssessments)
        .leftJoin(employees, eq(pirIntegrityAssessments.employeeId, employees.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(employees.departmentId, departments.name)
        .orderBy(desc(sql`count(*)`));

      return stats.map(stat => ({
        departmentId: stat.departmentId,
        departmentName: stat.departmentName || "Sem departamento",
        total: stat.total,
        completed: stat.completed,
        completionRate: stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0,
        averageScore: stat.averageScore ? Math.round(stat.averageScore * 10) / 10 : 0,
      }));
    }),
});
