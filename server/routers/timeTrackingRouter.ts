import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { timeTrackingSessions } from "../../drizzle/schema-productivity";
import { eq, and, desc, gte, lte } from "drizzle-orm";

/**
 * Router de Rastreamento Automático de Tempo
 * Gerencia sessões de trabalho e métricas de produtividade
 */
export const timeTrackingRouter = router({
  /**
   * Salvar sessão de rastreamento
   */
  saveSession: protectedProcedure
    .input(z.object({
      startTime: z.string(),
      endTime: z.string(),
      activeMinutes: z.number(),
      idleMinutes: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const totalMinutes = input.activeMinutes + input.idleMinutes;
      const productivityScore = totalMinutes > 0 
        ? Math.round((input.activeMinutes / totalMinutes) * 100) 
        : 0;

      await db.insert(timeTrackingSessions).values({
        userId: ctx.user.id,
        startTime: new Date(input.startTime),
        endTime: new Date(input.endTime),
        activeMinutes: input.activeMinutes,
        idleMinutes: input.idleMinutes,
        productivityScore,
      });

      return { success: true };
    }),

  /**
   * Listar sessões do usuário
   */
  listMySessions: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let conditions = [eq(timeTrackingSessions.userId, ctx.user.id)];

      if (input.startDate) {
        conditions.push(gte(timeTrackingSessions.startTime, new Date(input.startDate)));
      }

      if (input.endDate) {
        conditions.push(lte(timeTrackingSessions.endTime, new Date(input.endDate)));
      }

      const sessions = await db
        .select()
        .from(timeTrackingSessions)
        .where(and(...conditions))
        .orderBy(desc(timeTrackingSessions.startTime))
        .limit(input.limit);

      return sessions;
    }),

  /**
   * Obter estatísticas de produtividade
   */
  getMyStats: protectedProcedure
    .input(z.object({
      period: z.enum(['today', 'week', 'month']).default('today'),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const now = new Date();
      let startDate: Date;

      switch (input.period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }

      const sessions = await db
        .select()
        .from(timeTrackingSessions)
        .where(
          and(
            eq(timeTrackingSessions.userId, ctx.user.id),
            gte(timeTrackingSessions.startTime, startDate)
          )
        );

      const totalActiveMinutes = sessions.reduce((sum, s) => sum + s.activeMinutes, 0);
      const totalIdleMinutes = sessions.reduce((sum, s) => sum + s.idleMinutes, 0);
      const totalMinutes = totalActiveMinutes + totalIdleMinutes;
      const avgProductivity = sessions.length > 0
        ? Math.round(sessions.reduce((sum, s) => sum + s.productivityScore, 0) / sessions.length)
        : 0;

      return {
        totalSessions: sessions.length,
        totalActiveHours: (totalActiveMinutes / 60).toFixed(1),
        totalIdleHours: (totalIdleMinutes / 60).toFixed(1),
        totalHours: (totalMinutes / 60).toFixed(1),
        avgProductivityScore: avgProductivity,
        period: input.period,
      };
    }),
});
