import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import {
  performanceEvaluations,
  smartGoals,
  pdiPlans,
  evaluationCycles,
  employees,
  departments,
} from "../../drizzle/schema";

export const reportsRouter = router({
  /**
   * Buscar progresso de avaliações 360° ao longo do tempo
   */
  getEvaluationsProgress: protectedProcedure
    .input(
      z.object({
        cycleId: z.number().optional(),
        departmentId: z.number().optional(),
        period: z.string().optional(),
      })
    .optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      // Calcular data inicial baseado no período
      const now = new Date();
      let startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

      if (input.period === "last_30_days") {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (input.period === "last_90_days") {
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      } else if (input.period === "last_6_months") {
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      }

      // Buscar avaliações
      const conditions = [gte(performanceEvaluations.createdAt, startDate)];
      if (input.cycleId) {
        conditions.push(eq(performanceEvaluations.cycleId, input.cycleId));
      }

      const evaluations = await db
        .select({
          date: performanceEvaluations.createdAt,
          status: performanceEvaluations.status,
        })
        .from(performanceEvaluations)
        .where(and(...conditions))
        .orderBy(performanceEvaluations.createdAt);

      // Agrupar por data e status
      const progressMap = new Map<string, { completed: number; inProgress: number; pending: number }>();

      evaluations.forEach((evaluation) => {
        const dateKey = evaluation.date.toISOString().split("T")[0];
        if (!progressMap.has(dateKey)) {
          progressMap.set(dateKey, { completed: 0, inProgress: 0, pending: 0 });
        }

        const progress = progressMap.get(dateKey)!;
        if (evaluation.status === "concluida") {
          progress.completed++;
        } else if (evaluation.status === "em_andamento") {
          progress.inProgress++;
        } else {
          progress.pending++;
        }
      });

      // Converter para array
      return Array.from(progressMap.entries()).map(([date, data]) => ({
        date,
        ...data,
      }));
    }),

  /**
   * Buscar progresso de metas SMART ao longo do tempo
   */
  getGoalsProgress: protectedProcedure
    .input(
      z.object({
        cycleId: z.number().optional(),
        departmentId: z.number().optional(),
        period: z.string().optional(),
      })
    .optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      // Calcular data inicial
      const now = new Date();
      let startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

      if (input.period === "last_30_days") {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (input.period === "last_90_days") {
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      } else if (input.period === "last_6_months") {
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      }

      // Buscar metas
      const conditions = [gte(smartGoals.createdAt, startDate)];
      if (input.cycleId) {
        conditions.push(eq(smartGoals.cycleId, input.cycleId));
      }

      const goals = await db
        .select({
          date: smartGoals.createdAt,
          progress: smartGoals.progress,
          endDate: smartGoals.endDate,
        })
        .from(smartGoals)
        .where(and(...conditions))
        .orderBy(smartGoals.createdAt);

      // Agrupar por data e status
      const progressMap = new Map<string, { achieved: number; inProgress: number; delayed: number }>();

      goals.forEach((goal) => {
        const dateKey = goal.date.toISOString().split("T")[0];
        if (!progressMap.has(dateKey)) {
          progressMap.set(dateKey, { achieved: 0, inProgress: 0, delayed: 0 });
        }

        const progress = progressMap.get(dateKey)!;
        const isDelayed = goal.endDate && new Date(goal.endDate) < now && goal.progress < 100;

        if (goal.progress >= 100) {
          progress.achieved++;
        } else if (isDelayed) {
          progress.delayed++;
        } else {
          progress.inProgress++;
        }
      });

      // Converter para array
      return Array.from(progressMap.entries()).map(([date, data]) => ({
        date,
        ...data,
      }));
    }),

  /**
   * Buscar progresso de PDI ao longo do tempo
   */
  getPDIProgress: protectedProcedure
    .input(
      z.object({
        cycleId: z.number().optional(),
        departmentId: z.number().optional(),
        period: z.string().optional(),
      })
    .optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      // Calcular data inicial
      const now = new Date();
      let startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

      if (input.period === "last_30_days") {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (input.period === "last_90_days") {
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      } else if (input.period === "last_6_months") {
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      }

      // Buscar PDIs
      const pdis = await db
        .select({
          date: pdiPlans.createdAt,
          status: pdiPlans.status,
        })
        .from(pdiPlans)
        .where(gte(pdiPlans.createdAt, startDate))
        .orderBy(pdiPlans.createdAt);

      // Agrupar por data e status
      const progressMap = new Map<string, { completed: number; inProgress: number; notStarted: number }>();

      pdis.forEach((pdi) => {
        const dateKey = pdi.date.toISOString().split("T")[0];
        if (!progressMap.has(dateKey)) {
          progressMap.set(dateKey, { completed: 0, inProgress: 0, notStarted: 0 });
        }

        const progress = progressMap.get(dateKey)!;
        if (pdi.status === "concluido") {
          progress.completed++;
        } else if (pdi.status === "em_andamento") {
          progress.inProgress++;
        } else {
          progress.notStarted++;
        }
      });

      // Converter para array
      return Array.from(progressMap.entries()).map(([date, data]) => ({
        date,
        ...data,
      }));
    }),

  /**
   * Buscar estatísticas gerais de um ciclo
   */
  getCycleStats: protectedProcedure
    .input(
      z.object({
        cycleId: z.number().optional(),
        departmentId: z.number().optional(),
      })
    .optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return {
          totalParticipants: 0,
          totalEvaluations: 0,
          evaluationsCompleted: 0,
          evaluationsInProgress: 0,
          evaluationsPending: 0,
          totalGoals: 0,
          goalsAchieved: 0,
          goalsInProgress: 0,
          goalsDelayed: 0,
          totalPDI: 0,
          pdiCompleted: 0,
          pdiInProgress: 0,
          pdiNotStarted: 0,
        };
      }

      // Buscar total de participantes
      const employeeConditions = [];
      if (input.departmentId) {
        employeeConditions.push(eq(employees.departmentId, input.departmentId));
      }

      const totalParticipants = await db
        .select({ count: sql<number>`count(*)` })
        .from(employees)
        .where(employeeConditions.length > 0 ? and(...employeeConditions) : undefined);

      // Buscar avaliações
      const evalConditions = [];
      if (input.cycleId) {
        evalConditions.push(eq(performanceEvaluations.cycleId, input.cycleId));
      }

      const evaluations = await db
        .select({
          status: performanceEvaluations.status,
        })
        .from(performanceEvaluations)
        .where(evalConditions.length > 0 ? and(...evalConditions) : undefined);

      const evaluationsCompleted = evaluations.filter((e) => e.status === "concluida").length;
      const evaluationsInProgress = evaluations.filter((e) => e.status === "em_andamento").length;
      const evaluationsPending = evaluations.filter((e) => e.status === "pendente").length;

      // Buscar metas
      const goalConditions = [];
      if (input.cycleId) {
        goalConditions.push(eq(smartGoals.cycleId, input.cycleId));
      }

      const goals = await db
        .select({
          progress: smartGoals.progress,
          endDate: smartGoals.endDate,
        })
        .from(smartGoals)
        .where(goalConditions.length > 0 ? and(...goalConditions) : undefined);

      const now = new Date();
      const goalsAchieved = goals.filter((g) => g.progress >= 100).length;
      const goalsDelayed = goals.filter(
        (g) => g.endDate && new Date(g.endDate) < now && g.progress < 100
      ).length;
      const goalsInProgress = goals.length - goalsAchieved - goalsDelayed;

      // Buscar PDIs
      const pdis = await db.select({ status: pdiPlans.status }).from(pdiPlans);

      const pdiCompleted = pdis.filter((p) => p.status === "concluido").length;
      const pdiInProgress = pdis.filter((p) => p.status === "em_andamento").length;
      const pdiNotStarted = pdis.filter((p) => p.status === "rascunho").length;

      return {
        totalParticipants: totalParticipants[0]?.count || 0,
        totalEvaluations: evaluations.length,
        evaluationsCompleted,
        evaluationsInProgress,
        evaluationsPending,
        totalGoals: goals.length,
        goalsAchieved,
        goalsInProgress,
        goalsDelayed,
        totalPDI: pdis.length,
        pdiCompleted,
        pdiInProgress,
        pdiNotStarted,
      };
    }),

  /**
   * Exportar relatório de ciclo
   */
  exportCycleReport: protectedProcedure
    .input(
      z.object({
        cycleId: z.number().optional(),
        departmentId: z.number().optional(),
        format: z.enum(["pdf", "excel"]),
      })
    )
    .mutation(async ({ input }) => {
      // TODO: Implementar exportação real
      // Por enquanto, retornar URL simulada
      const filename = `relatorio-ciclo-${input.cycleId || "todos"}-${Date.now()}.${input.format}`;
      return {
        url: `/api/reports/download/${filename}`,
        filename,
      };
    }),
});
