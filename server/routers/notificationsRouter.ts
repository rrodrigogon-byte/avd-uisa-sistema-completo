import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { notifications, notificationHistory } from "../../drizzle/schema";
import { desc, eq, and, gte, lte, sql } from "drizzle-orm";

/**
 * Router de Notificações com Analytics
 * Gerencia notificações e fornece estatísticas para dashboards
 */

export const notificationsRouter = router({
  /**
   * Listar notificações do usuário
   */
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(25),
        read: z.boolean().optional(),
        type: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        sortBy: z.enum(['createdAt', 'type']).default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [eq(notifications.userId, ctx.user.id)];

      if (input.read !== undefined) {
        conditions.push(eq(notifications.read, input.read));
      }

      if (input.type) {
        conditions.push(eq(notifications.type, input.type));
      }

      if (input.startDate) {
        conditions.push(gte(notifications.createdAt, input.startDate));
      }

      if (input.endDate) {
        conditions.push(lte(notifications.createdAt, input.endDate));
      }

      const offset = (input.page - 1) * input.limit;

      let orderColumn;
      switch (input.sortBy) {
        case 'type':
          orderColumn = notifications.type;
          break;
        default:
          orderColumn = notifications.createdAt;
      }
      const orderFn = input.sortOrder === 'asc' ? orderColumn : desc(orderColumn);

      const items = await db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(orderFn)
        .limit(input.limit)
        .offset(offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(and(...conditions));

      const totalPages = Math.ceil(count / input.limit);

      return {
        data: items,
        pagination: {
          page: input.page,
          limit: input.limit,
          total: count,
          totalPages,
        },
      };
    }),

  /**
   * Marcar notificação como lida
   */
  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(notifications)
        .set({ read: true, readAt: new Date() })
        .where(and(
          eq(notifications.id, input.id),
          eq(notifications.userId, ctx.user.id)
        ));

      return { success: true };
    }),

  /**
   * Marcar todas como lidas
   */
  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(notifications)
        .set({ read: true, readAt: new Date() })
        .where(and(
          eq(notifications.userId, ctx.user.id),
          eq(notifications.read, false)
        ));

      return { success: true };
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

      // Total de notificações
      const [{ total }] = await db
        .select({ total: sql<number>`count(*)` })
        .from(notificationHistory)
        .where(gte(notificationHistory.sentAt, startDate));

      // Notificações lidas
      const [{ readCount }] = await db
        .select({ readCount: sql<number>`count(*)` })
        .from(notifications)
        .where(and(
          gte(notifications.createdAt, startDate),
          eq(notifications.read, true)
        ));

      // Notificações não lidas
      const [{ unreadCount }] = await db
        .select({ unreadCount: sql<number>`count(*)` })
        .from(notifications)
        .where(and(
          gte(notifications.createdAt, startDate),
          eq(notifications.read, false)
        ));

      // Calcular variação do período anterior
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - input.days);
      const [{ prevTotal }] = await db
        .select({ prevTotal: sql<number>`count(*)` })
        .from(notificationHistory)
        .where(and(
          gte(notificationHistory.sentAt, prevStartDate),
          lte(notificationHistory.sentAt, startDate)
        ));

      const totalChange = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;

      return {
        total,
        read: readCount,
        unread: unreadCount,
        totalChange: Math.round(totalChange * 10) / 10,
        readRate: total > 0 ? Math.round((readCount / total) * 100) : 0,
      };
    }),

  /**
   * Tendências de notificações ao longo do tempo
   */
  getTrends: protectedProcedure
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

      const trends = await db
        .select({
          date: sql<string>`DATE(sentAt)`,
          count: sql<number>`count(*)`,
        })
        .from(notificationHistory)
        .where(gte(notificationHistory.sentAt, startDate))
        .groupBy(sql`DATE(sentAt)`)
        .orderBy(sql`DATE(sentAt)`);

      return trends.map(item => ({
        date: item.date,
        count: item.count,
      }));
    }),

  /**
   * Distribuição por tipo de notificação
   */
  getDistribution: protectedProcedure
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
          type: notifications.type,
          count: sql<number>`count(*)`,
        })
        .from(notifications)
        .where(gte(notifications.createdAt, startDate))
        .groupBy(notifications.type)
        .orderBy(desc(sql`count(*)`));

      return distribution.map(item => ({
        type: item.type,
        count: item.count,
      }));
    }),

  /**
   * Taxa de leitura de notificações
   */
  getReadRate: protectedProcedure
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

      // Taxa de leitura por tipo
      const readRateByType = await db
        .select({
          type: notifications.type,
          total: sql<number>`count(*)`,
          read: sql<number>`sum(case when \`read\` = 1 then 1 else 0 end)`,
        })
        .from(notifications)
        .where(gte(notifications.createdAt, startDate))
        .groupBy(notifications.type);

      return readRateByType.map(item => ({
        type: item.type,
        total: item.total,
        read: item.read,
        rate: item.total > 0 ? Math.round((item.read / item.total) * 100) : 0,
      }));
    }),

  /**
   * Contar notificações não lidas do usuário
   */
  countUnread: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(and(
          eq(notifications.userId, ctx.user.id),
          eq(notifications.read, false)
        ));

      return count;
    }),

  /**
   * Buscar notificações do usuário (para dropdown/modal)
   */
  getMyNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const items = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, ctx.user.id))
        .orderBy(desc(notifications.createdAt))
        .limit(input.limit);

      return items;
    }),

  /**
   * Buscar notificações in-app (alias para compatibilidade)
   */
  getInApp: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const items = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, ctx.user.id))
        .orderBy(desc(notifications.createdAt))
        .limit(input.limit);

      return items;
    }),
});
