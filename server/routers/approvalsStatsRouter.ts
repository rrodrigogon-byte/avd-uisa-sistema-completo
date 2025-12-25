/**
 * Router de Estatísticas de Aprovações
 * Dashboard consolidado com métricas e análises de aprovações
 */

import { z } from "zod";
import { eq, and, gte, lte, sql, desc, count } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  goalApprovals,
  bonusApprovals,
  calibrationApprovals,
  jobDescriptionApprovals,
  performanceEvaluationApprovals,
  workflowStepApprovals,
  employees,
} from "../../drizzle/schema";

export const approvalsStatsRouter = router({
  /**
   * Obter KPIs consolidados de aprovações
   */
  getKPIs: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        context: z.enum(["metas", "avaliacoes", "pdi", "descricao_cargo", "ciclo_360", "bonus", "todos"]).optional(),
      })
    .optional())
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      const startDate = input.startDate ? new Date(input.startDate) : undefined;
      const endDate = input.endDate ? new Date(input.endDate) : undefined;

      // Função auxiliar para aplicar filtros de data
      const buildDateConditions = (table: any) => {
        const conditions = [];
        if (startDate) conditions.push(gte(table.createdAt, startDate));
        if (endDate) conditions.push(lte(table.createdAt, endDate));
        return conditions.length > 0 ? and(...conditions) : undefined;
      };

      // Buscar aprovações de metas
      const goalApprovalsData = await database
        .select({
          total: count(),
          status: goalApprovals.status,
        })
        .from(goalApprovals)
        .where(buildDateConditions(goalApprovals))
        .groupBy(goalApprovals.status);

      // Buscar aprovações de bônus
      const bonusApprovalsData = await database
        .select({
          total: count(),
          status: bonusApprovals.status,
        })
        .from(bonusApprovals)
        .where(buildDateConditions(bonusApprovals))
        .groupBy(bonusApprovals.status);

      // Buscar aprovações de calibração
      const calibrationApprovalsData = await database
        .select({
          total: count(),
          status: calibrationApprovals.status,
        })
        .from(calibrationApprovals)
        .where(buildDateConditions(calibrationApprovals))
        .groupBy(calibrationApprovals.status);

      // Buscar aprovações de descrição de cargo
      const jobDescriptionApprovalsData = await database
        .select({
          total: count(),
          status: jobDescriptionApprovals.status,
        })
        .from(jobDescriptionApprovals)
        .where(buildDateConditions(jobDescriptionApprovals))
        .groupBy(jobDescriptionApprovals.status);

      // Buscar aprovações de avaliações 360°
      const performanceApprovalsData = await database
        .select({
          total: count(),
          action: performanceEvaluationApprovals.action,
        })
        .from(performanceEvaluationApprovals)
        .where(buildDateConditions(performanceEvaluationApprovals))
        .groupBy(performanceEvaluationApprovals.action);

      // Consolidar dados
      const consolidate = (data: any[], statusMap: Record<string, string>) => {
        let total = 0;
        let pending = 0;
        let approved = 0;
        let rejected = 0;

        data.forEach((item) => {
          const statusKey = statusMap[item.status || item.action];
          total += item.total;

          if (statusKey === "pending") pending += item.total;
          else if (statusKey === "approved") approved += item.total;
          else if (statusKey === "rejected") rejected += item.total;
        });

        return { total, pending, approved, rejected };
      };

      const goalStats = consolidate(goalApprovalsData, {
        pending: "pending",
        approved: "approved",
        rejected: "rejected",
      });

      const bonusStats = consolidate(bonusApprovalsData, {
        pending: "pending",
        approved: "approved",
        rejected: "rejected",
        cancelled: "rejected",
      });

      const calibrationStats = consolidate(calibrationApprovalsData, {
        pending: "pending",
        approved: "approved",
        rejected: "rejected",
      });

      const jobDescriptionStats = consolidate(jobDescriptionApprovalsData, {
        pending: "pending",
        approved: "approved",
        rejected: "rejected",
      });

      const performanceStats = consolidate(performanceApprovalsData, {
        aprovado: "approved",
        rejeitado: "rejected",
        solicitado_ajuste: "pending",
      });

      // Calcular totais gerais
      const totalApprovals =
        goalStats.total +
        bonusStats.total +
        calibrationStats.total +
        jobDescriptionStats.total +
        performanceStats.total;

      const totalPending =
        goalStats.pending +
        bonusStats.pending +
        calibrationStats.pending +
        jobDescriptionStats.pending +
        performanceStats.pending;

      const totalApproved =
        goalStats.approved +
        bonusStats.approved +
        calibrationStats.approved +
        jobDescriptionStats.approved +
        performanceStats.approved;

      const totalRejected =
        goalStats.rejected +
        bonusStats.rejected +
        calibrationStats.rejected +
        jobDescriptionStats.rejected +
        performanceStats.rejected;

      // Calcular tempo médio de resposta (apenas aprovações concluídas)
      const approvedGoals = await database
        .select({
          createdAt: goalApprovals.createdAt,
          approvedAt: goalApprovals.approvedAt,
        })
        .from(goalApprovals)
        .where(
          and(
            eq(goalApprovals.status, "approved"),
            buildDateConditions(goalApprovals)
          )
        );

      const approvedJobDescriptions = await database
        .select({
          createdAt: jobDescriptionApprovals.createdAt,
          decidedAt: jobDescriptionApprovals.decidedAt,
        })
        .from(jobDescriptionApprovals)
        .where(
          and(
            eq(jobDescriptionApprovals.status, "approved"),
            buildDateConditions(jobDescriptionApprovals)
          )
        );

      const calculateAvgResponseTime = (data: any[]) => {
        if (data.length === 0) return 0;

        const totalTime = data.reduce((sum, item) => {
          const created = new Date(item.createdAt).getTime();
          const decided = new Date(item.approvedAt || item.decidedAt).getTime();
          return sum + (decided - created);
        }, 0);

        return Math.round(totalTime / data.length / (1000 * 60 * 60 * 24)); // Converter para dias
      };

      const avgResponseTimeGoals = calculateAvgResponseTime(approvedGoals);
      const avgResponseTimeJobDescriptions = calculateAvgResponseTime(approvedJobDescriptions);
      const avgResponseTime = Math.round((avgResponseTimeGoals + avgResponseTimeJobDescriptions) / 2);

      return {
        total: totalApprovals,
        pending: totalPending,
        approved: totalApproved,
        rejected: totalRejected,
        avgResponseTimeDays: avgResponseTime,
        byContext: {
          metas: goalStats,
          bonus: bonusStats,
          calibration: calibrationStats,
          jobDescription: jobDescriptionStats,
          performance: performanceStats,
        },
      };
    }),

  /**
   * Obter aprovações por aprovador (para gráfico de barras)
   */
  getByApprover: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      const startDate = input.startDate ? new Date(input.startDate) : undefined;
      const endDate = input.endDate ? new Date(input.endDate) : undefined;

      // Função auxiliar para aplicar filtros de data
      const buildDateConditions = (table: any) => {
        const conditions = [];
        if (startDate) conditions.push(gte(table.createdAt, startDate));
        if (endDate) conditions.push(lte(table.createdAt, endDate));
        return conditions.length > 0 ? and(...conditions) : undefined;
      };

      // Buscar aprovações de metas por aprovador
      const goalsByApprover = await database
        .select({
          approverId: goalApprovals.approverId,
          approverName: employees.name,
          total: count(),
          approved: sql<number>`SUM(CASE WHEN ${goalApprovals.status} = 'approved' THEN 1 ELSE 0 END)`,
          rejected: sql<number>`SUM(CASE WHEN ${goalApprovals.status} = 'rejected' THEN 1 ELSE 0 END)`,
          pending: sql<number>`SUM(CASE WHEN ${goalApprovals.status} = 'pending' THEN 1 ELSE 0 END)`,
        })
        .from(goalApprovals)
        .leftJoin(employees, eq(goalApprovals.approverId, employees.id))
        .where(buildDateConditions(goalApprovals))
        .groupBy(goalApprovals.approverId, employees.name)
        .orderBy(desc(count()))
        .limit(input.limit);

      // Buscar aprovações de descrição de cargo por aprovador
      const jobDescriptionsByApprover = await database
        .select({
          approverId: jobDescriptionApprovals.approverId,
          approverName: jobDescriptionApprovals.approverName,
          total: count(),
          approved: sql<number>`SUM(CASE WHEN ${jobDescriptionApprovals.status} = 'approved' THEN 1 ELSE 0 END)`,
          rejected: sql<number>`SUM(CASE WHEN ${jobDescriptionApprovals.status} = 'rejected' THEN 1 ELSE 0 END)`,
          pending: sql<number>`SUM(CASE WHEN ${jobDescriptionApprovals.status} = 'pending' THEN 1 ELSE 0 END)`,
        })
        .from(jobDescriptionApprovals)
        .where(buildDateConditions(jobDescriptionApprovals))
        .groupBy(jobDescriptionApprovals.approverId, jobDescriptionApprovals.approverName)
        .orderBy(desc(count()))
        .limit(input.limit);

      // Consolidar dados
      const approverMap = new Map<number, any>();

      [...goalsByApprover, ...jobDescriptionsByApprover].forEach((item) => {
        const id = item.approverId;
        if (!approverMap.has(id)) {
          approverMap.set(id, {
            approverId: id,
            approverName: item.approverName || "Desconhecido",
            total: 0,
            approved: 0,
            rejected: 0,
            pending: 0,
          });
        }

        const approver = approverMap.get(id)!;
        approver.total += Number(item.total);
        approver.approved += Number(item.approved);
        approver.rejected += Number(item.rejected);
        approver.pending += Number(item.pending);
      });

      return Array.from(approverMap.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, input.limit);
    }),

  /**
   * Obter tempo médio de resposta por aprovador (para gráfico de linha)
   */
  getAvgResponseTimeByApprover: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      const startDate = input.startDate ? new Date(input.startDate) : undefined;
      const endDate = input.endDate ? new Date(input.endDate) : undefined;

      // Função auxiliar para aplicar filtros de data
      const buildDateConditions = (table: any) => {
        const conditions = [];
        if (startDate) conditions.push(gte(table.createdAt, startDate));
        if (endDate) conditions.push(lte(table.createdAt, endDate));
        return conditions.length > 0 ? and(...conditions) : undefined;
      };

      // Buscar aprovações de metas com tempo de resposta
      const goalResponseTimes = await database
        .select({
          approverId: goalApprovals.approverId,
          approverName: employees.name,
          createdAt: goalApprovals.createdAt,
          approvedAt: goalApprovals.approvedAt,
        })
        .from(goalApprovals)
        .leftJoin(employees, eq(goalApprovals.approverId, employees.id))
        .where(
          and(
            eq(goalApprovals.status, "approved"),
            buildDateConditions(goalApprovals)
          )
        );

      // Buscar aprovações de descrição de cargo com tempo de resposta
      const jobDescriptionResponseTimes = await database
        .select({
          approverId: jobDescriptionApprovals.approverId,
          approverName: jobDescriptionApprovals.approverName,
          createdAt: jobDescriptionApprovals.createdAt,
          decidedAt: jobDescriptionApprovals.decidedAt,
        })
        .from(jobDescriptionApprovals)
        .where(
          and(
            eq(jobDescriptionApprovals.status, "approved"),
            buildDateConditions(jobDescriptionApprovals)
          )
        );

      // Calcular tempo médio por aprovador
      const approverTimesMap = new Map<number, { name: string; times: number[] }>();

      goalResponseTimes.forEach((item) => {
        if (!item.approvedAt) return;

        const id = item.approverId;
        if (!approverTimesMap.has(id)) {
          approverTimesMap.set(id, {
            name: item.approverName || "Desconhecido",
            times: [],
          });
        }

        const created = new Date(item.createdAt).getTime();
        const approved = new Date(item.approvedAt).getTime();
        const timeDays = (approved - created) / (1000 * 60 * 60 * 24);

        approverTimesMap.get(id)!.times.push(timeDays);
      });

      jobDescriptionResponseTimes.forEach((item) => {
        if (!item.decidedAt) return;

        const id = item.approverId;
        if (!approverTimesMap.has(id)) {
          approverTimesMap.set(id, {
            name: item.approverName || "Desconhecido",
            times: [],
          });
        }

        const created = new Date(item.createdAt).getTime();
        const decided = new Date(item.decidedAt).getTime();
        const timeDays = (decided - created) / (1000 * 60 * 60 * 24);

        approverTimesMap.get(id)!.times.push(timeDays);
      });

      // Calcular média
      const result = Array.from(approverTimesMap.entries()).map(([id, data]) => {
        const avgTime = data.times.reduce((sum, time) => sum + time, 0) / data.times.length;
        return {
          approverId: id,
          approverName: data.name,
          avgResponseTimeDays: Math.round(avgTime * 10) / 10, // Arredondar para 1 casa decimal
          totalApprovals: data.times.length,
        };
      });

      return result
        .sort((a, b) => b.totalApprovals - a.totalApprovals)
        .slice(0, input.limit);
    }),

  /**
   * Obter gargalos no fluxo (aprovações pendentes há mais tempo)
   */
  getBottlenecks: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      // Buscar aprovações pendentes de metas
      const pendingGoals = await database
        .select({
          type: sql<string>`'meta'`,
          approverId: goalApprovals.approverId,
          approverName: employees.name,
          createdAt: goalApprovals.createdAt,
          daysWaiting: sql<number>`DATEDIFF(NOW(), ${goalApprovals.createdAt})`,
        })
        .from(goalApprovals)
        .leftJoin(employees, eq(goalApprovals.approverId, employees.id))
        .where(eq(goalApprovals.status, "pending"))
        .orderBy(desc(sql`DATEDIFF(NOW(), ${goalApprovals.createdAt})`))
        .limit(input.limit);

      // Buscar aprovações pendentes de descrição de cargo
      const pendingJobDescriptions = await database
        .select({
          type: sql<string>`'descricao_cargo'`,
          approverId: jobDescriptionApprovals.approverId,
          approverName: jobDescriptionApprovals.approverName,
          createdAt: jobDescriptionApprovals.createdAt,
          daysWaiting: sql<number>`DATEDIFF(NOW(), ${jobDescriptionApprovals.createdAt})`,
        })
        .from(jobDescriptionApprovals)
        .where(eq(jobDescriptionApprovals.status, "pending"))
        .orderBy(desc(sql`DATEDIFF(NOW(), ${jobDescriptionApprovals.createdAt})`))
        .limit(input.limit);

      // Consolidar e ordenar por dias esperando
      const bottlenecks = [...pendingGoals, ...pendingJobDescriptions]
        .sort((a, b) => Number(b.daysWaiting) - Number(a.daysWaiting))
        .slice(0, input.limit);

      return bottlenecks;
    }),
});
