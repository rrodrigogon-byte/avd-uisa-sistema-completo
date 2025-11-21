import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { pushSubscriptions } from "../../drizzle/schema";
import { eq, and, sql, gte, lte, desc } from "drizzle-orm";

export const pushNotificationsRouter = router({
  /**
   * Registrar nova subscription de push
   */
  subscribe: protectedProcedure
    .input(
      z.object({
        endpoint: z.string(),
        p256dh: z.string(),
        auth: z.string(),
        userAgent: z.string().optional(),
        deviceType: z.enum(["desktop", "mobile", "tablet"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verificar se já existe subscription para este endpoint
      const existing = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, input.endpoint))
        .limit(1);

      if (existing.length > 0) {
        // Atualizar lastUsedAt
        await db
          .update(pushSubscriptions)
          .set({ lastUsedAt: new Date() })
          .where(eq(pushSubscriptions.id, existing[0].id));

        return { subscriptionId: existing[0].id, isNew: false };
      }

      // Criar nova subscription
      const result = await db.insert(pushSubscriptions).values({
        userId: ctx.user.id,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        userAgent: input.userAgent || null,
        deviceType: input.deviceType || "desktop",
        active: true,
      });

      return { subscriptionId: result[0].insertId, isNew: true };
    }),

  /**
   * Remover subscription
   */
  unsubscribe: protectedProcedure
    .input(z.object({ endpoint: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(pushSubscriptions)
        .set({ active: false })
        .where(eq(pushSubscriptions.endpoint, input.endpoint));

      return { success: true };
    }),

  /**
   * Listar subscriptions ativas do usuário
   */
  listUserSubscriptions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(and(eq(pushSubscriptions.userId, ctx.user.id), eq(pushSubscriptions.active, true)))
      .orderBy(desc(pushSubscriptions.createdAt));

    return subscriptions;
  }),

  /**
   * **NOVO: Métricas de notificações push (Admin)**
   */
  getNotificationMetrics: adminProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const startDate = input.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 dias atrás
      const endDate = input.endDate || new Date();

      // Total de subscriptions ativas
      const totalActiveResult = await db.execute(
        sql`SELECT COUNT(*) as total FROM pushSubscriptions WHERE active = 1`
      );
      const totalActive = (totalActiveResult[0] as unknown as any[])[0]?.total || 0;

      // Total de subscriptions criadas no período
      const totalCreatedResult = await db.execute(
        sql`SELECT COUNT(*) as total FROM pushSubscriptions 
           WHERE createdAt >= ${startDate} AND createdAt <= ${endDate}`
      );
      const totalCreated = (totalCreatedResult[0] as unknown as any[])[0]?.total || 0;

      // Distribuição por tipo de dispositivo
      const deviceDistributionResult = await db.execute(
        sql`SELECT deviceType, COUNT(*) as count FROM pushSubscriptions 
           WHERE active = 1 
           GROUP BY deviceType`
      );
      const deviceDistribution = (deviceDistributionResult[0] as unknown as any[]).map((row: any) => ({
        deviceType: row.deviceType,
        count: row.count,
      }));

      // Subscriptions criadas por dia (últimos 30 dias)
      const dailySubscriptionsResult = await db.execute(
        sql`SELECT DATE(createdAt) as date, COUNT(*) as count 
           FROM pushSubscriptions 
           WHERE createdAt >= ${startDate} AND createdAt <= ${endDate}
           GROUP BY DATE(createdAt)
           ORDER BY date ASC`
      );
      const dailySubscriptions = (dailySubscriptionsResult[0] as unknown as any[]).map((row: any) => ({
        date: row.date,
        count: row.count,
      }));

      // Subscriptions mais ativas (últimas usadas)
      const mostActiveResult = await db.execute(
        sql`SELECT ps.*, u.name as userName 
           FROM pushSubscriptions ps
           LEFT JOIN users u ON u.id = ps.userId
           WHERE ps.active = 1
           ORDER BY ps.lastUsedAt DESC
           LIMIT 10`
      );
      const mostActive = (mostActiveResult[0] as unknown as any[]).map((row: any) => ({
        id: row.id,
        userName: row.userName,
        deviceType: row.deviceType,
        lastUsedAt: row.lastUsedAt,
        createdAt: row.createdAt,
      }));

      // Taxa de retenção (subscriptions ainda ativas após 7 dias)
      const retentionResult = await db.execute(
        sql`SELECT 
           COUNT(*) as total,
           SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as activeCount
           FROM pushSubscriptions
           WHERE createdAt <= DATE_SUB(NOW(), INTERVAL 7 DAY)`
      );
      const retentionData = (retentionResult[0] as unknown as any[])[0];
      const retentionRate =
        retentionData.total > 0 ? ((retentionData.activeCount / retentionData.total) * 100).toFixed(2) : "0";

      return {
        summary: {
          totalActive,
          totalCreated,
          retentionRate: parseFloat(retentionRate),
        },
        deviceDistribution,
        dailySubscriptions,
        mostActive,
      };
    }),

  /**
   * **NOVO: Histórico de notificações enviadas (simulado)**
   * Nota: Este endpoint retorna dados simulados. Para implementação real,
   * seria necessário criar uma tabela `pushNotificationLogs` para registrar
   * cada notificação enviada.
   */
  getNotificationHistory: adminProcedure
    .input(
      z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const limit = input.limit || 50;
      const offset = input.offset || 0;

      // Simulação de histórico baseado em subscriptions
      const historyResult = await db.execute(
        sql`SELECT 
           ps.id,
           ps.userId,
           u.name as userName,
           ps.deviceType,
           ps.lastUsedAt as sentAt,
           'Notificação de teste' as title,
           'Esta é uma notificação simulada' as body,
           CASE WHEN ps.active = 1 THEN 'delivered' ELSE 'failed' END as status
           FROM pushSubscriptions ps
           LEFT JOIN users u ON u.id = ps.userId
           ORDER BY ps.lastUsedAt DESC
           LIMIT ${limit} OFFSET ${offset}`
      );

      const history = (historyResult[0] as unknown as any[]).map((row: any) => ({
        id: row.id,
        userId: row.userId,
        userName: row.userName,
        deviceType: row.deviceType,
        title: row.title,
        body: row.body,
        status: row.status,
        sentAt: row.sentAt,
      }));

      return history;
    }),

  /**
   * **NOVO: Análise de horários de maior engajamento**
   */
  getEngagementByHour: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Análise de horários baseada em lastUsedAt
    const hourlyEngagementResult = await db.execute(
      sql`SELECT 
         HOUR(lastUsedAt) as hour,
         COUNT(*) as count
         FROM pushSubscriptions
         WHERE active = 1 AND lastUsedAt IS NOT NULL
         GROUP BY HOUR(lastUsedAt)
         ORDER BY hour ASC`
    );

    const hourlyEngagement = (hourlyEngagementResult[0] as unknown as any[]).map((row: any) => ({
      hour: row.hour,
      count: row.count,
    }));

    // Preencher horas faltantes com 0
    const fullHourlyData = Array.from({ length: 24 }, (_, i) => {
      const existing = hourlyEngagement.find((h) => h.hour === i);
      return { hour: i, count: existing?.count || 0 };
    });

    return fullHourlyData;
  }),
});
