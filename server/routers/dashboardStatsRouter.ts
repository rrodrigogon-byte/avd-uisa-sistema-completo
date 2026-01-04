import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { employees, departments, positions } from "../../drizzle/schema";
import { eq, sql, and, isNotNull } from "drizzle-orm";

/**
 * Router para estatísticas e dashboard de funcionários
 */
export const dashboardStatsRouter = router({
  /**
   * Obter estatísticas gerais de funcionários
   */
  getGeneralStats: protectedProcedure.input(z.object({}).optional()).query(async () => {
    const db = await getDb();
    if (!db) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        withEmail: 0,
        withManager: 0,
      };
    }

    const [stats] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        active: sql<number>`SUM(CASE WHEN ${employees.active} = 1 THEN 1 ELSE 0 END)`,
        inactive: sql<number>`SUM(CASE WHEN ${employees.active} = 0 THEN 1 ELSE 0 END)`,
        withEmail: sql<number>`SUM(CASE WHEN ${employees.email} IS NOT NULL THEN 1 ELSE 0 END)`,
        withManager: sql<number>`SUM(CASE WHEN ${employees.managerId} IS NOT NULL THEN 1 ELSE 0 END)`,
      })
      .from(employees);

    return stats || {
      total: 0,
      active: 0,
      inactive: 0,
      withEmail: 0,
      withManager: 0,
    };
  }),

  /**
   * Obter distribuição por departamento
   */
  getByDepartment: protectedProcedure.input(z.object({}).optional()).query(async () => {
    const db = await getDb();
    if (!db) return [];

    const distribution = await db
      .select({
        departmentId: employees.departmentId,
        departmentName: departments.name,
        count: sql<number>`COUNT(*)`,
        activeCount: sql<number>`SUM(CASE WHEN ${employees.active} = 1 THEN 1 ELSE 0 END)`,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .where(isNotNull(employees.departmentId))
      .groupBy(employees.departmentId, departments.name)
      .orderBy(sql`COUNT(*) DESC`);

    return distribution.map((item) => ({
      departmentId: item.departmentId,
      departmentName: item.departmentName || "Sem Departamento",
      count: item.count,
      activeCount: item.activeCount,
    }));
  }),

  /**
   * Obter distribuição por cargo
   */
  getByPosition: protectedProcedure.input(z.object({}).optional()).query(async () => {
    const db = await getDb();
    if (!db) return [];

    const distribution = await db
      .select({
        positionId: employees.positionId,
        positionName: positions.name,
        count: sql<number>`COUNT(*)`,
        activeCount: sql<number>`SUM(CASE WHEN ${employees.active} = 1 THEN 1 ELSE 0 END)`,
      })
      .from(employees)
      .leftJoin(positions, eq(employees.positionId, positions.id))
      .where(isNotNull(employees.positionId))
      .groupBy(employees.positionId, positions.name)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(20); // Top 20 cargos

    return distribution.map((item) => ({
      positionId: item.positionId,
      positionName: item.positionName || "Sem Cargo",
      count: item.count,
      activeCount: item.activeCount,
    }));
  }),

  /**
   * Obter distribuição por tempo de empresa
   */
  getByTenure: protectedProcedure.input(z.object({}).optional()).query(async () => {
    const db = await getDb();
    if (!db) return [];

    // Calcular tempo de empresa em anos e agrupar em faixas
    const distribution = await db
      .select({
        tenure: sql<string>`
          CASE 
            WHEN TIMESTAMPDIFF(YEAR, ${employees.hireDate}, NOW()) < 1 THEN '0-1 ano'
            WHEN TIMESTAMPDIFF(YEAR, ${employees.hireDate}, NOW()) BETWEEN 1 AND 2 THEN '1-3 anos'
            WHEN TIMESTAMPDIFF(YEAR, ${employees.hireDate}, NOW()) BETWEEN 3 AND 4 THEN '3-5 anos'
            WHEN TIMESTAMPDIFF(YEAR, ${employees.hireDate}, NOW()) BETWEEN 5 AND 9 THEN '5-10 anos'
            WHEN TIMESTAMPDIFF(YEAR, ${employees.hireDate}, NOW()) >= 10 THEN '10+ anos'
            ELSE 'Não informado'
          END
        `,
        count: sql<number>`COUNT(*)`,
      })
      .from(employees)
      .where(isNotNull(employees.hireDate))
      .groupBy(sql`
        CASE 
          WHEN TIMESTAMPDIFF(YEAR, ${employees.hireDate}, NOW()) < 1 THEN '0-1 ano'
          WHEN TIMESTAMPDIFF(YEAR, ${employees.hireDate}, NOW()) BETWEEN 1 AND 2 THEN '1-3 anos'
          WHEN TIMESTAMPDIFF(YEAR, ${employees.hireDate}, NOW()) BETWEEN 3 AND 4 THEN '3-5 anos'
          WHEN TIMESTAMPDIFF(YEAR, ${employees.hireDate}, NOW()) BETWEEN 5 AND 9 THEN '5-10 anos'
          WHEN TIMESTAMPDIFF(YEAR, ${employees.hireDate}, NOW()) >= 10 THEN '10+ anos'
          ELSE 'Não informado'
        END
      `);

    // Ordenar as faixas na ordem correta
    const order = ["0-1 ano", "1-3 anos", "3-5 anos", "5-10 anos", "10+ anos", "Não informado"];
    return distribution.sort((a, b) => {
      const indexA = order.indexOf(a.tenure);
      const indexB = order.indexOf(b.tenure);
      return indexA - indexB;
    });
  }),

  /**
   * Obter média de tempo de empresa
   */
  getAverageTenure: protectedProcedure.input(z.object({}).optional()).query(async () => {
    const db = await getDb();
    if (!db) return { averageYears: 0, averageMonths: 0 };

    const [result] = await db
      .select({
        averageMonths: sql<number>`AVG(TIMESTAMPDIFF(MONTH, ${employees.hireDate}, NOW()))`,
      })
      .from(employees)
      .where(and(isNotNull(employees.hireDate), eq(employees.active, true)));

    const averageMonths = result?.averageMonths || 0;
    const averageYears = Math.floor(averageMonths / 12);
    const remainingMonths = Math.round(averageMonths % 12);

    return {
      averageYears,
      averageMonths: remainingMonths,
      totalMonths: Math.round(averageMonths),
    };
  }),

  /**
   * Obter distribuição por status (ativo/inativo)
   */
  getByStatus: protectedProcedure.input(z.object({}).optional()).query(async () => {
    const db = await getDb();
    if (!db) return [];

    const distribution = await db
      .select({
        status: sql<string>`CASE WHEN ${employees.active} = 1 THEN 'Ativo' ELSE 'Inativo' END`,
        count: sql<number>`COUNT(*)`,
      })
      .from(employees)
      .groupBy(sql`CASE WHEN ${employees.active} = 1 THEN 'Ativo' ELSE 'Inativo' END`);

    return distribution;
  }),

  /**
   * Obter top departamentos por número de funcionários
   */
  getTopDepartments: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const topDepartments = await db
        .select({
          departmentId: employees.departmentId,
          departmentName: departments.name,
          count: sql<number>`COUNT(*)`,
          activeCount: sql<number>`SUM(CASE WHEN ${employees.active} = 1 THEN 1 ELSE 0 END)`,
          inactiveCount: sql<number>`SUM(CASE WHEN ${employees.active} = 0 THEN 1 ELSE 0 END)`,
        })
        .from(employees)
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .where(isNotNull(employees.departmentId))
        .groupBy(employees.departmentId, departments.name)
        .orderBy(sql`COUNT(*) DESC`)
        .limit(input.limit);

      return topDepartments.map((item) => ({
        departmentId: item.departmentId,
        departmentName: item.departmentName || "Sem Departamento",
        total: item.count,
        active: item.activeCount,
        inactive: item.inactiveCount,
      }));
    }),

  /**
   * Obter estatísticas de contratações por período
   */
  getHiringTrend: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    .optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let conditions = [isNotNull(employees.hireDate)];

      if (input.startDate) {
        conditions.push(sql`${employees.hireDate} >= ${input.startDate}`);
      }

      if (input.endDate) {
        conditions.push(sql`${employees.hireDate} <= ${input.endDate}`);
      }

      const trend = await db
        .select({
          year: sql<number>`YEAR(${employees.hireDate})`,
          month: sql<number>`MONTH(${employees.hireDate})`,
          count: sql<number>`COUNT(*)`,
        })
        .from(employees)
        .where(and(...conditions))
        .groupBy(sql`YEAR(${employees.hireDate})`, sql`MONTH(${employees.hireDate})`)
        .orderBy(sql`YEAR(${employees.hireDate})`, sql`MONTH(${employees.hireDate})`);

      return trend.map((item) => ({
        year: item.year,
        month: item.month,
        count: item.count,
        label: `${item.month}/${item.year}`,
      }));
    }),
});
