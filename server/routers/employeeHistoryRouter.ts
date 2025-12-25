import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { employeeHistory, employees, users, departments, positions } from "../../drizzle/schema";
import { eq, desc, and, gte, lte, inArray } from "drizzle-orm";
import { sql } from "drizzle-orm";

/**
 * Router para gerenciar histórico de alterações de funcionários
 */
export const employeeHistoryRouter = router({
  /**
   * Registrar uma alteração no histórico
   */
  logChange: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        changeType: z.enum([
          "cargo",
          "departamento",
          "salario",
          "gestor",
          "status",
          "dados_pessoais",
          "contratacao",
          "desligamento",
          "promocao",
          "transferencia",
          "outro",
        ]),
        fieldName: z.string(),
        oldValue: z.string().nullable().optional(),
        newValue: z.string().nullable().optional(),
        reason: z.string().optional(),
        notes: z.string().optional(),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db.insert(employeeHistory).values({
        employeeId: input.employeeId,
        changeType: input.changeType,
        fieldName: input.fieldName,
        oldValue: input.oldValue || null,
        newValue: input.newValue || null,
        reason: input.reason,
        notes: input.notes,
        changedBy: ctx.user.id,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      });

      return { success: true, id: result.insertId };
    }),

  /**
   * Obter histórico completo de um funcionário
   */
  getEmployeeHistory: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        changeType: z
          .enum([
            "cargo",
            "departamento",
            "salario",
            "gestor",
            "status",
            "dados_pessoais",
            "contratacao",
            "desligamento",
            "promocao",
            "transferencia",
            "outro",
          ])
          .optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = [eq(employeeHistory.employeeId, input.employeeId)];

      if (input.changeType) {
        conditions.push(eq(employeeHistory.changeType, input.changeType));
      }

      if (input.startDate) {
        conditions.push(gte(employeeHistory.changedAt, new Date(input.startDate)));
      }

      if (input.endDate) {
        conditions.push(lte(employeeHistory.changedAt, new Date(input.endDate)));
      }

      const history = await db
        .select({
          id: employeeHistory.id,
          employeeId: employeeHistory.employeeId,
          changeType: employeeHistory.changeType,
          fieldName: employeeHistory.fieldName,
          oldValue: employeeHistory.oldValue,
          newValue: employeeHistory.newValue,
          reason: employeeHistory.reason,
          notes: employeeHistory.notes,
          changedAt: employeeHistory.changedAt,
          changedBy: employeeHistory.changedBy,
          changedByName: users.name,
          changedByEmail: users.email,
          metadata: employeeHistory.metadata,
        })
        .from(employeeHistory)
        .leftJoin(users, eq(employeeHistory.changedBy, users.id))
        .where(and(...conditions))
        .orderBy(desc(employeeHistory.changedAt));

      return history;
    }),

  /**
   * Obter estatísticas de alterações
   */
  getHistoryStats: protectedProcedure
    .input(
      z.object({
        employeeId: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    .optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { total: 0, byType: [] };

      const conditions = [];

      if (input.employeeId) {
        conditions.push(eq(employeeHistory.employeeId, input.employeeId));
      }

      if (input.startDate) {
        conditions.push(gte(employeeHistory.changedAt, new Date(input.startDate)));
      }

      if (input.endDate) {
        conditions.push(lte(employeeHistory.changedAt, new Date(input.endDate)));
      }

      // Total de alterações
      const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(employeeHistory)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      // Alterações por tipo
      const byType = await db
        .select({
          changeType: employeeHistory.changeType,
          count: sql<number>`count(*)`,
        })
        .from(employeeHistory)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(employeeHistory.changeType);

      return {
        total: totalResult?.count || 0,
        byType: byType.map((item) => ({
          type: item.changeType,
          count: item.count,
        })),
      };
    }),

  /**
   * Obter alterações recentes (últimos 30 dias)
   */
  getRecentChanges: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        changeTypes: z
          .array(
            z.enum([
              "cargo",
              "departamento",
              "salario",
              "gestor",
              "status",
              "dados_pessoais",
              "contratacao",
              "desligamento",
              "promocao",
              "transferencia",
              "outro",
            ])
          )
          .optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const conditions = [gte(employeeHistory.changedAt, thirtyDaysAgo)];

      if (input.changeTypes && input.changeTypes.length > 0) {
        conditions.push(inArray(employeeHistory.changeType, input.changeTypes));
      }

      const changes = await db
        .select({
          id: employeeHistory.id,
          employeeId: employeeHistory.employeeId,
          employeeName: employees.name,
          changeType: employeeHistory.changeType,
          fieldName: employeeHistory.fieldName,
          oldValue: employeeHistory.oldValue,
          newValue: employeeHistory.newValue,
          reason: employeeHistory.reason,
          changedAt: employeeHistory.changedAt,
          changedByName: users.name,
        })
        .from(employeeHistory)
        .leftJoin(employees, eq(employeeHistory.employeeId, employees.id))
        .leftJoin(users, eq(employeeHistory.changedBy, users.id))
        .where(and(...conditions))
        .orderBy(desc(employeeHistory.changedAt))
        .limit(input.limit);

      return changes;
    }),

  /**
   * Comparar valores de um campo ao longo do tempo
   */
  getFieldHistory: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        fieldName: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const history = await db
        .select({
          id: employeeHistory.id,
          oldValue: employeeHistory.oldValue,
          newValue: employeeHistory.newValue,
          changedAt: employeeHistory.changedAt,
          changedByName: users.name,
          reason: employeeHistory.reason,
        })
        .from(employeeHistory)
        .leftJoin(users, eq(employeeHistory.changedBy, users.id))
        .where(
          and(
            eq(employeeHistory.employeeId, input.employeeId),
            eq(employeeHistory.fieldName, input.fieldName)
          )
        )
        .orderBy(desc(employeeHistory.changedAt));

      return history;
    }),
});
