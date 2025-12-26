import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { eq, desc, sql } from "drizzle-orm";

/**
 * Sistema de Gamificação
 * Pontos, níveis e rankings
 */

// Configuração de níveis
const LEVELS = [
  { name: "Bronze", minPoints: 0, maxPoints: 999 },
  { name: "Prata", minPoints: 1000, maxPoints: 2999 },
  { name: "Ouro", minPoints: 3000, maxPoints: 5999 },
  { name: "Platina", minPoints: 6000, maxPoints: Infinity },
];

// Configuração de pontos por ação
const POINTS_CONFIG = {
  meta_concluida: 100,
  meta_antecipada: 150,
  avaliacao_360_completa: 50,
  pdi_item_concluido: 30,
  feedback_dado: 10,
  feedback_recebido: 5,
  badge_conquistado: 200,
  calibracao_aprovada: 75,
};

function calculateLevel(points: number): string {
  for (const level of LEVELS) {
    if (points >= level.minPoints && points <= level.maxPoints) {
      return level.name;
    }
  }
  return "Bronze";
}

export const gamificationRouter = router({
  /**
   * Adicionar pontos a um colaborador
   */
  addPoints: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        action: z.enum([
          "meta_concluida",
          "meta_antecipada",
          "avaliacao_360_completa",
          "pdi_item_concluido",
          "feedback_dado",
          "feedback_recebido",
          "badge_conquistado",
          "calibracao_aprovada",
        ]),
        customPoints: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { employees } = await import("../drizzle/schema");

      // Buscar colaborador
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, input.employeeId))
        .limit(1);

      if (!employee) throw new Error("Colaborador não encontrado");

      // Calcular pontos
      const pointsToAdd = input.customPoints || POINTS_CONFIG[input.action];
      const newPoints = (employee.gamificationPoints || 0) + pointsToAdd;
      const newLevel = calculateLevel(newPoints);

      // Atualizar colaborador
      await db
        .update(employees)
        .set({
          gamificationPoints: newPoints,
          gamificationLevel: newLevel,
          lastPointsUpdate: new Date(),
        })
        .where(eq(employees.id, input.employeeId));

      return {
        success: true,
        pointsAdded: pointsToAdd,
        totalPoints: newPoints,
        level: newLevel,
        levelUp: newLevel !== employee.gamificationLevel,
      };
    }),

  /**
   * Obter ranking geral
   */
  getRanking: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        departmentId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { employees, departments, positions } = await import("../drizzle/schema");

      let query = db
        .select({
          employee: employees,
          department: departments,
          position: positions,
        })
        .from(employees)
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .leftJoin(positions, eq(employees.positionId, positions.id))
        .orderBy(desc(employees.gamificationPoints))
        .limit(input.limit);

      if (input.departmentId) {
        query = query.where(eq(employees.departmentId, input.departmentId)) as any;
      }

      const ranking = await query;

      return ranking.map((item, index) => ({
        rank: index + 1,
        employee: item.employee,
        department: item.department,
        position: item.position,
      }));
    }),

  /**
   * Obter estatísticas de gamificação de um colaborador
   */
  getEmployeeStats: protectedProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { employees, employeeBadges, badges } = await import("../drizzle/schema");

      // Buscar colaborador
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, input.employeeId))
        .limit(1);

      if (!employee) throw new Error("Colaborador não encontrado");

      // Buscar badges conquistados
      const employeeBadgesList = await db
        .select({
          badge: badges,
          earnedAt: employeeBadges.earnedAt,
        })
        .from(employeeBadges)
        .leftJoin(badges, eq(employeeBadges.badgeId, badges.id))
        .where(eq(employeeBadges.employeeId, input.employeeId));

      // Calcular próximo nível
      const currentLevel = LEVELS.find((l) => l.name === employee.gamificationLevel);
      const nextLevel = LEVELS[LEVELS.findIndex((l) => l.name === employee.gamificationLevel) + 1];

      const pointsToNextLevel = nextLevel
        ? nextLevel.minPoints - (employee.gamificationPoints || 0)
        : 0;

      const progressToNextLevel = nextLevel
        ? ((employee.gamificationPoints || 0) - (currentLevel?.minPoints || 0)) /
          (nextLevel.minPoints - (currentLevel?.minPoints || 0))
        : 1;

      return {
        points: employee.gamificationPoints || 0,
        level: employee.gamificationLevel || "Bronze",
        badges: employeeBadgesList.length,
        pointsToNextLevel,
        progressToNextLevel: Math.min(progressToNextLevel * 100, 100),
        recentBadges: employeeBadgesList.slice(0, 5),
      };
    }),

  /**
   * Obter configuração de níveis
   */
  getLevels: protectedProcedure.input(z.object({})).query(() => {
    return LEVELS;
  }),

  /**
   * Obter configuração de pontos por ação
   */
  getPointsConfig: protectedProcedure.input(z.object({})).query(() => {
    return POINTS_CONFIG;
  }),

  /**
   * Obter ranking do mês atual
   */
  getMonthlyRanking: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { employees, departments, positions } = await import("../drizzle/schema");

      // TODO: Implementar tabela de histórico de pontos mensal
      // Por enquanto, retornar ranking geral
      const ranking = await db
        .select({
          employee: employees,
          department: departments,
          position: positions,
        })
        .from(employees)
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .leftJoin(positions, eq(employees.positionId, positions.id))
        .orderBy(desc(employees.gamificationPoints))
        .limit(input.limit);

      return ranking.map((item, index) => ({
        rank: index + 1,
        employee: item.employee,
        department: item.department,
        position: item.position,
      }));
    }),
});
