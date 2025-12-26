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
   * Listar logs de auditoria com filtros, paginação e ordenação
   */
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(25),
        userId: z.number().optional(),
        action: z.string().optional(),
        entityType: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        sortBy: z.enum(['createdAt', 'activityType', 'userId']).default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
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

      // Calcular offset
      const offset = (input.page - 1) * input.limit;

      // Ordenação
      let orderColumn;
      switch (input.sortBy) {
        case 'activityType':
          orderColumn = activityLogs.activityType;
          break;
        case 'userId':
          orderColumn = activityLogs.userId;
          break;
        default:
          orderColumn = activityLogs.createdAt;
      }
      const orderFn = input.sortOrder === 'asc' ? orderColumn : desc(orderColumn);

      const logs = await db
        .select()
        .from(activityLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(orderFn)
        .limit(input.limit)
        .offset(offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(activityLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const totalPages = Math.ceil(count / input.limit);

      return {
        data: logs,
        pagination: {
          page: input.page,
          limit: input.limit,
          total: count,
          totalPages,
        },
      };
    }),

  /**
   * Estatísticas de atividade
   */
  stats: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
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
  detectSuspiciousActivity: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
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
   * Estatísticas para dashboard analítico
   */
  getStats: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Apenas admins
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new Error("Unauthorized");
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const [{ total }] = await db
        .select({ total: sql<number>`count(*)` })
        .from(activityLogs)
        .where(gte(activityLogs.createdAt, startDate));

      const [{ uniqueUsers }] = await db
        .select({ uniqueUsers: sql<number>`count(distinct userId)` })
        .from(activityLogs)
        .where(gte(activityLogs.createdAt, startDate));

      const [{ uniqueActions }] = await db
        .select({ uniqueActions: sql<number>`count(distinct activityType)` })
        .from(activityLogs)
        .where(gte(activityLogs.createdAt, startDate));

      // Calcular variação do período anterior
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - input.days);
      const [{ prevTotal }] = await db
        .select({ prevTotal: sql<number>`count(*)` })
        .from(activityLogs)
        .where(and(
          gte(activityLogs.createdAt, prevStartDate),
          lte(activityLogs.createdAt, startDate)
        ));

      const totalChange = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;

      return {
        total,
        uniqueUsers,
        uniqueActions,
        totalChange: Math.round(totalChange * 10) / 10,
        avgPerDay: Math.round((total / input.days) * 10) / 10,
      };
    }),

  /**
   * Atividades por usuário para dashboard
   */
  getUserActivity: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Apenas admins
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new Error("Unauthorized");
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const userActivity = await db
        .select({
          userId: activityLogs.userId,
          count: sql<number>`count(*)`,
        })
        .from(activityLogs)
        .where(gte(activityLogs.createdAt, startDate))
        .groupBy(activityLogs.userId)
        .orderBy(desc(sql`count(*)`))
        .limit(input.limit);

      return userActivity.map(item => ({
        userId: item.userId,
        actions: item.count,
      }));
    }),

  /**
   * Distribuição de ações por módulo
   */
  getModuleDistribution: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Apenas admins
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new Error("Unauthorized");
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const distribution = await db
        .select({
          module: activityLogs.entityType,
          count: sql<number>`count(*)`,
        })
        .from(activityLogs)
        .where(gte(activityLogs.createdAt, startDate))
        .groupBy(activityLogs.entityType)
        .orderBy(desc(sql`count(*)`));

      return distribution.map(item => ({
        module: item.module || 'Outros',
        count: item.count,
      }));
    }),

  /**
   * Horários de pico de uso
   */
  getPeakHours: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Apenas admins
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new Error("Unauthorized");
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const peakHours = await db
        .select({
          hour: sql<number>`HOUR(createdAt)`,
          count: sql<number>`count(*)`,
        })
        .from(activityLogs)
        .where(gte(activityLogs.createdAt, startDate))
        .groupBy(sql`HOUR(createdAt)`)
        .orderBy(sql`HOUR(createdAt)`);

      return peakHours.map(item => ({
        hour: `${item.hour}:00`,
        count: item.count,
      }));
    }),

  /**
   * Ações mais frequentes
   */
  getTopActions: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Apenas admins
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new Error("Unauthorized");
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const topActions = await db
        .select({
          action: activityLogs.activityType,
          count: sql<number>`count(*)`,
        })
        .from(activityLogs)
        .where(gte(activityLogs.createdAt, startDate))
        .groupBy(activityLogs.activityType)
        .orderBy(desc(sql`count(*)`))
        .limit(input.limit);

      return topActions.map(item => ({
        action: item.action,
        count: item.count,
      }));
    }),

  /**
   * Padrões suspeitos para dashboard
   */
  getSuspiciousPatterns: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Apenas admins
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new Error("Unauthorized");
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      // Detectar volume anormal de ações
      const abnormalVolume = await db
        .select({
          userId: activityLogs.userId,
          count: sql<number>`count(*)`,
        })
        .from(activityLogs)
        .where(gte(activityLogs.createdAt, startDate))
        .groupBy(activityLogs.userId)
        .having(sql`count(*) > 500`) // Mais de 500 ações no período
        .orderBy(desc(sql`count(*)`));

      // Detectar ações fora do horário comercial (antes 6h ou depois 22h)
      const [{ offHoursCount }] = await db
        .select({ offHoursCount: sql<number>`count(*)` })
        .from(activityLogs)
        .where(and(
          gte(activityLogs.createdAt, startDate),
          sql`(HOUR(createdAt) < 6 OR HOUR(createdAt) > 22)`
        ));

      return {
        abnormalVolume: abnormalVolume.length,
        offHoursActions: offHoursCount,
        hasIssues: abnormalVolume.length > 0 || offHoursCount > 100,
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
