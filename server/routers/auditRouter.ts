import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { activityLogs } from "../../drizzle/schema";
import { desc, eq, and, gte, lte, like, sql } from "drizzle-orm";

/**
 * Router de Auditoria e Segurança
 * Rastreia todas as ações importantes no sistema
 */

export const auditRouter = router({
  /**
   * Registrar ação de auditoria
   */
  log: protectedProcedure
    .input(
      z.object({
        action: z.string(),
        entityType: z.string(),
        entityId: z.number().optional(),
        details: z.record(z.string(), z.any()).optional(),
        ipAddress: z.string().optional(),
        userAgent: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(activityLogs).values({
        userId: ctx.user.id,
        employeeId: ctx.user.id, // Assumindo que user.id = employee.id
        activityType: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        activityDescription: input.details ? JSON.stringify(input.details) : null,
        metadata: input.ipAddress || input.userAgent ? { ipAddress: input.ipAddress, userAgent: input.userAgent } : null,
      });

      return { success: true };
    }),

  /**
   * Listar logs de auditoria com filtros
   */
  list: protectedProcedure
    .input(
      z.object({
        userId: z.number().optional(),
        action: z.string().optional(),
        entityType: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Apenas admins podem ver todos os logs
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        input.userId = ctx.user.id;
      }

      const conditions = [];

      if (input.userId) {
        conditions.push(eq(activityLogs.userId, input.userId));
      }

      if (input.action) {
        conditions.push(eq(activityLogs.activityType, input.action));
      }

      if (input.entityType) {
        conditions.push(eq(activityLogs.entityType, input.entityType));
      }

      if (input.startDate) {
        conditions.push(gte(activityLogs.createdAt, input.startDate));
      }

      if (input.endDate) {
        conditions.push(lte(activityLogs.createdAt, input.endDate));
      }

      const logs = await db
        .select()
        .from(activityLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(activityLogs.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(activityLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return {
        logs,
        total: count,
        hasMore: input.offset + input.limit < count,
      };
    }),

  /**
   * Estatísticas de atividade
   */
  stats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Apenas admins
    if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
      throw new Error("Unauthorized");
    }

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [total24h] = await db
      .select({ count: sql<number>`count(*)` })
      .from(activityLogs)
      .where(gte(activityLogs.createdAt, last24h));

    const [total7d] = await db
      .select({ count: sql<number>`count(*)` })
      .from(activityLogs)
      .where(gte(activityLogs.createdAt, last7d));

    const [total30d] = await db
      .select({ count: sql<number>`count(*)` })
      .from(activityLogs)
      .where(gte(activityLogs.createdAt, last30d));

    // Ações mais comuns
    const topActions = await db
      .select({
        action: activityLogs.activityType,
        count: sql<number>`count(*)`,
      })
      .from(activityLogs)
      .where(gte(activityLogs.createdAt, last30d))
      .groupBy(activityLogs.activityType)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    // Usuários mais ativos
    const topUsers = await db
      .select({
        userId: activityLogs.userId,
        count: sql<number>`count(*)`,
      })
      .from(activityLogs)
      .where(gte(activityLogs.createdAt, last30d))
      .groupBy(activityLogs.userId)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    return {
      total24h: total24h.count,
      total7d: total7d.count,
      total30d: total30d.count,
      topActions,
      topUsers,
    };
  }),

  /**
   * Detectar atividades suspeitas
   */
  detectSuspiciousActivity: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Apenas admins
    if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
      throw new Error("Unauthorized");
    }

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 1. Múltiplas tentativas de ações falhadas
    const failedActions = await db
      .select({
        userId: activityLogs.userId,
        action: activityLogs.activityType,
        count: sql<number>`count(*)`,
      })
      .from(activityLogs)
      .where(
        and(
          gte(activityLogs.createdAt, last24h),
          like(activityLogs.activityType, "%failed%")
        )
      )
      .groupBy(activityLogs.userId, activityLogs.activityType)
      .having(sql`count(*) > 5`);

    // 2. Acessos de IPs diferentes no mesmo período
    const multipleIPs = await db
      .select({
        userId: activityLogs.userId,
        count: sql<number>`count(*)`,
      })
      .from(activityLogs)
      .where(gte(activityLogs.createdAt, last24h))
      .groupBy(activityLogs.userId)
      .having(sql`count(*) > 100`); // Detectar volume anormal

    // 3. Volume anormal de ações
    const avgActions = await db
      .select({
        avg: sql<number>`AVG(action_count)`,
      })
      .from(
        db
          .select({
            userId: activityLogs.userId,
            action_count: sql<number>`count(*)`,
          })
          .from(activityLogs)
          .where(gte(activityLogs.createdAt, last24h))
          .groupBy(activityLogs.userId)
          .as("user_actions")
      );

    const threshold = (avgActions[0]?.avg || 0) * 3; // 3x a média

    const abnormalVolume = await db
      .select({
        userId: activityLogs.userId,
        count: sql<number>`count(*)`,
      })
      .from(activityLogs)
      .where(gte(activityLogs.createdAt, last24h))
      .groupBy(activityLogs.userId)
      .having(sql`count(*) > ${threshold}`);

    return {
      failedActions,
      multipleIPs,
      abnormalVolume,
      hasIssues:
        failedActions.length > 0 ||
        multipleIPs.length > 0 ||
        abnormalVolume.length > 0,
    };
  }),

  /**
   * Exportar logs de auditoria
   */
  export: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        format: z.enum(["csv", "json"]).default("csv"),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Apenas admins
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new Error("Unauthorized");
      }

      const logs = await db
        .select()
        .from(activityLogs)
        .where(
          and(
            gte(activityLogs.createdAt, input.startDate),
            lte(activityLogs.createdAt, input.endDate)
          )
        )
        .orderBy(desc(activityLogs.createdAt));

      if (input.format === "json") {
        return {
          format: "json",
          data: JSON.stringify(logs, null, 2),
        };
      }

      // CSV
      const headers = [
        "ID",
        "User ID",
        "Action",
        "Entity Type",
        "Entity ID",
        "Details",
        "IP Address",
        "User Agent",
        "Timestamp",
      ];

      const rows = logs.map((log) => [
        log.id,
        log.userId,
        log.activityType,
        log.entityType || "",
        log.entityId || "",
        log.activityDescription || "",
        "", // ipAddress (armazenado em metadata)
        "", // userAgent (armazenado em metadata)
        log.createdAt.toISOString(),
      ]);

      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

      return {
        format: "csv",
        data: csv,
      };
    }),
});
