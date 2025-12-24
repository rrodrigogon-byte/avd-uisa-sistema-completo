import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { badges, employeeBadges, employees } from "../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";

export const badgesRouter = router({
  // Buscar todos os badges disponíveis
  getBadges: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const allBadges = await db
      .select()
      .from(badges)
      .where(eq(badges.isActive, true))
      .orderBy(badges.category, badges.points);

    return allBadges;
  }),

  // Buscar badges conquistados por um colaborador
  getEmployeeBadges: protectedProcedure
    .input(z.object({ employeeId: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Se não passar employeeId, busca do próprio usuário
      let targetEmployeeId = input.employeeId;
      if (!targetEmployeeId) {
        const employee = await db
          .select()
          .from(employees)
          .where(eq(employees.userId, ctx.user.id))
          .limit(1);
        if (!employee[0]) throw new Error("Employee not found");
        targetEmployeeId = employee[0].id;
      }

      const earnedBadges = await db
        .select({
          id: employeeBadges.id,
          badgeId: employeeBadges.badgeId,
          earnedAt: employeeBadges.earnedAt,
          notified: employeeBadges.notified,
          badge: badges,
        })
        .from(employeeBadges)
        .innerJoin(badges, eq(employeeBadges.badgeId, badges.id))
        .where(eq(employeeBadges.employeeId, targetEmployeeId))
        .orderBy(desc(employeeBadges.earnedAt));

      // Calcular total de pontos
      const totalPoints = earnedBadges.reduce((sum, item) => sum + (item.badge.points || 0), 0);

      return {
        badges: earnedBadges,
        totalPoints,
        badgeCount: earnedBadges.length,
      };
    }),

  // Ranking de colaboradores por pontos
  getRanking: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const ranking = await db
        .select({
          employeeId: employeeBadges.employeeId,
          employee: employees,
          totalPoints: sql<number>`SUM(${badges.points})`,
          badgeCount: sql<number>`COUNT(${employeeBadges.id})`,
        })
        .from(employeeBadges)
        .innerJoin(badges, eq(employeeBadges.badgeId, badges.id))
        .innerJoin(employees, eq(employeeBadges.employeeId, employees.id))
        .groupBy(employeeBadges.employeeId, employees.id)
        .orderBy(desc(sql`SUM(${badges.points})`))
        .limit(input.limit);

      return ranking;
    }),

  // Marcar badge como notificado
  markAsNotified: protectedProcedure
    .input(z.object({ employeeBadgeId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(employeeBadges)
        .set({ notified: true })
        .where(eq(employeeBadges.id, input.employeeBadgeId));

      return { success: true };
    }),

  // Estatísticas gerais de badges
  getStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const totalBadges = await db.select({ count: sql<number>`COUNT(*)` }).from(badges);
    const totalEarned = await db.select({ count: sql<number>`COUNT(*)` }).from(employeeBadges);
    const totalPoints = await db
      .select({ total: sql<number>`SUM(${badges.points})` })
      .from(employeeBadges)
      .innerJoin(badges, eq(employeeBadges.badgeId, badges.id));

    return {
      totalBadgesAvailable: totalBadges[0]?.count || 0,
      totalBadgesEarned: totalEarned[0]?.count || 0,
      totalPointsDistributed: totalPoints[0]?.total || 0,
    };
  }),
});
