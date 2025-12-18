import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { employees, employeeMovements, departments, positions } from "../../drizzle/schema";
import { eq, and, desc, sql, gte, lte, count, avg, isNull, isNotNull } from "drizzle-orm";

/**
 * Router para Métricas de RH
 * Fornece dados analíticos sobre turnover, promoções e distribuição hierárquica
 */
export const hrMetricsRouter = router({
  /**
   * Obter métricas gerais de RH
   */
  getOverview: adminProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      const startDate = input.startDate ? new Date(input.startDate) : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
      const endDate = input.endDate ? new Date(input.endDate) : new Date();

      // Total de funcionários ativos
      const [activeEmployeesResult] = await db
        .select({ count: count() })
        .from(employees)
        .where(eq(employees.active, true));

      const totalActiveEmployees = activeEmployeesResult?.count || 0;

      // Total de funcionários desligados no período
      const [terminatedResult] = await db
        .select({ count: count() })
        .from(employeeMovements)
        .where(
          and(
            eq(employeeMovements.movementType, "desligamento"),
            gte(employeeMovements.effectiveDate, startDate),
            lte(employeeMovements.effectiveDate, endDate)
          )
        );

      const totalTerminated = terminatedResult?.count || 0;

      // Total de promoções no período
      const [promotionsResult] = await db
        .select({ count: count() })
        .from(employeeMovements)
        .where(
          and(
            eq(employeeMovements.movementType, "promocao"),
            gte(employeeMovements.effectiveDate, startDate),
            lte(employeeMovements.effectiveDate, endDate)
          )
        );

      const totalPromotions = promotionsResult?.count || 0;

      // Total de transferências no período
      const [transfersResult] = await db
        .select({ count: count() })
        .from(employeeMovements)
        .where(
          and(
            eq(employeeMovements.movementType, "transferencia"),
            gte(employeeMovements.effectiveDate, startDate),
            lte(employeeMovements.effectiveDate, endDate)
          )
        );

      const totalTransfers = transfersResult?.count || 0;

      // Calcular taxa de turnover
      // Fórmula: (Desligamentos / Média de funcionários) * 100
      const turnoverRate = totalActiveEmployees > 0 
        ? ((totalTerminated / totalActiveEmployees) * 100).toFixed(2)
        : "0.00";

      return {
        totalActiveEmployees,
        totalTerminated,
        totalPromotions,
        totalTransfers,
        turnoverRate: parseFloat(turnoverRate),
        periodStart: startDate.toISOString(),
        periodEnd: endDate.toISOString(),
      };
    }),

  /**
   * Obter dados de turnover detalhados
   */
  getTurnoverData: adminProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        departmentId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      const startDate = input.startDate ? new Date(input.startDate) : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
      const endDate = input.endDate ? new Date(input.endDate) : new Date();

      // Buscar desligamentos por mês
      const query = db
        .select({
          month: sql<string>`DATE_FORMAT(${employeeMovements.effectiveDate}, '%Y-%m')`,
          count: count(),
          departmentId: employeeMovements.previousDepartmentId,
        })
        .from(employeeMovements)
        .where(
          and(
            eq(employeeMovements.movementType, "desligamento"),
            gte(employeeMovements.effectiveDate, startDate),
            lte(employeeMovements.effectiveDate, endDate),
            input.departmentId ? eq(employeeMovements.previousDepartmentId, input.departmentId) : undefined
          )
        )
        .groupBy(sql`DATE_FORMAT(${employeeMovements.effectiveDate}, '%Y-%m')`, employeeMovements.previousDepartmentId);

      const turnoverByMonth = await query;

      // Buscar desligamentos por departamento
      const turnoverByDepartment = await db
        .select({
          departmentId: employeeMovements.previousDepartmentId,
          departmentName: departments.name,
          count: count(),
        })
        .from(employeeMovements)
        .leftJoin(departments, eq(employeeMovements.previousDepartmentId, departments.id))
        .where(
          and(
            eq(employeeMovements.movementType, "desligamento"),
            gte(employeeMovements.effectiveDate, startDate),
            lte(employeeMovements.effectiveDate, endDate)
          )
        )
        .groupBy(employeeMovements.previousDepartmentId, departments.name);

      // Buscar motivos de desligamento
      const terminationReasons = await db
        .select({
          reason: employeeMovements.reason,
          count: count(),
        })
        .from(employeeMovements)
        .where(
          and(
            eq(employeeMovements.movementType, "desligamento"),
            gte(employeeMovements.effectiveDate, startDate),
            lte(employeeMovements.effectiveDate, endDate)
          )
        )
        .groupBy(employeeMovements.reason)
        .orderBy(desc(count()));

      return {
        byMonth: turnoverByMonth,
        byDepartment: turnoverByDepartment,
        reasons: terminationReasons.slice(0, 10), // Top 10 motivos
      };
    }),

  /**
   * Obter dados de promoções
   */
  getPromotionData: adminProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      const startDate = input.startDate ? new Date(input.startDate) : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
      const endDate = input.endDate ? new Date(input.endDate) : new Date();

      // Promoções por mês
      const promotionsByMonth = await db
        .select({
          month: sql<string>`DATE_FORMAT(${employeeMovements.effectiveDate}, '%Y-%m')`,
          count: count(),
        })
        .from(employeeMovements)
        .where(
          and(
            eq(employeeMovements.movementType, "promocao"),
            gte(employeeMovements.effectiveDate, startDate),
            lte(employeeMovements.effectiveDate, endDate)
          )
        )
        .groupBy(sql`DATE_FORMAT(${employeeMovements.effectiveDate}, '%Y-%m')`);

      // Promoções por departamento
      const promotionsByDepartment = await db
        .select({
          departmentId: employeeMovements.newDepartmentId,
          departmentName: departments.name,
          count: count(),
        })
        .from(employeeMovements)
        .leftJoin(departments, eq(employeeMovements.newDepartmentId, departments.id))
        .where(
          and(
            eq(employeeMovements.movementType, "promocao"),
            gte(employeeMovements.effectiveDate, startDate),
            lte(employeeMovements.effectiveDate, endDate)
          )
        )
        .groupBy(employeeMovements.newDepartmentId, departments.name);

      // Tempo médio até promoção
      // Calcular diferença entre data de contratação e data da primeira promoção
      const avgTimeToPromotion = await db.execute(sql`
        SELECT 
          AVG(DATEDIFF(em.effectiveDate, e.hireDate)) as avgDays
        FROM employee_movements em
        INNER JOIN employees e ON em.employeeId = e.id
        WHERE em.movementType = 'promocao'
        AND em.effectiveDate >= ${startDate}
        AND em.effectiveDate <= ${endDate}
        AND em.id = (
          SELECT MIN(id) 
          FROM employee_movements 
          WHERE employeeId = em.employeeId 
          AND movementType = 'promocao'
        )
      `);

      const avgDays = (avgTimeToPromotion as any)[0]?.avgDays || 0;
      const avgMonths = avgDays ? Math.round(avgDays / 30) : 0;

      return {
        byMonth: promotionsByMonth,
        byDepartment: promotionsByDepartment,
        averageTimeToPromotion: {
          days: avgDays,
          months: avgMonths,
        },
      };
    }),

  /**
   * Obter distribuição hierárquica
   */
  getHierarchyDistribution: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Banco de dados não disponível",
      });
    }

    // Funcionários por departamento
    const employeesByDepartment = await db
      .select({
        departmentId: employees.departmentId,
        departmentName: departments.name,
        count: count(),
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .where(eq(employees.active, true))
      .groupBy(employees.departmentId, departments.name);

    // Funcionários por cargo
    const employeesByPosition = await db
      .select({
        positionId: employees.positionId,
        positionTitle: positions.title,
        count: count(),
      })
      .from(employees)
      .leftJoin(positions, eq(employees.positionId, positions.id))
      .where(eq(employees.active, true))
      .groupBy(employees.positionId, positions.title);

    // Gestores e subordinados
    const managersWithSubordinates = await db
      .select({
        managerId: employees.managerId,
        managerName: sql<string>`manager.name`,
        subordinatesCount: count(),
      })
      .from(employees)
      .leftJoin(sql`employees manager`, sql`${employees.managerId} = manager.id`)
      .where(
        and(
          eq(employees.active, true),
          isNotNull(employees.managerId)
        )
      )
      .groupBy(employees.managerId, sql`manager.name`);

    // Funcionários sem gestor (top level)
    const [topLevelResult] = await db
      .select({ count: count() })
      .from(employees)
      .where(
        and(
          eq(employees.active, true),
          isNull(employees.managerId)
        )
      );

    const topLevelCount = topLevelResult?.count || 0;

    return {
      byDepartment: employeesByDepartment,
      byPosition: employeesByPosition,
      managementStructure: {
        managersWithSubordinates,
        topLevelEmployees: topLevelCount,
      },
    };
  }),

  /**
   * Obter estatísticas de movimentações
   */
  getMovementStats: adminProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      const startDate = input.startDate ? new Date(input.startDate) : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
      const endDate = input.endDate ? new Date(input.endDate) : new Date();

      // Movimentações por tipo
      const movementsByType = await db
        .select({
          type: employeeMovements.movementType,
          count: count(),
        })
        .from(employeeMovements)
        .where(
          and(
            gte(employeeMovements.effectiveDate, startDate),
            lte(employeeMovements.effectiveDate, endDate)
          )
        )
        .groupBy(employeeMovements.movementType);

      // Movimentações por mês
      const movementsByMonth = await db
        .select({
          month: sql<string>`DATE_FORMAT(${employeeMovements.effectiveDate}, '%Y-%m')`,
          type: employeeMovements.movementType,
          count: count(),
        })
        .from(employeeMovements)
        .where(
          and(
            gte(employeeMovements.effectiveDate, startDate),
            lte(employeeMovements.effectiveDate, endDate)
          )
        )
        .groupBy(
          sql`DATE_FORMAT(${employeeMovements.effectiveDate}, '%Y-%m')`,
          employeeMovements.movementType
        );

      return {
        byType: movementsByType,
        byMonth: movementsByMonth,
      };
    }),
});
