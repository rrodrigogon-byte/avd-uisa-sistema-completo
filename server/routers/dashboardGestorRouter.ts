import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { 
  employees, 
  performanceEvaluations, 
  goals, 
  pdiPlans,
  departments,
  positions,
  evaluationCycles,
  nineBoxPositions
} from "../../drizzle/schema";
import { eq, and, gte, lte, sql, desc, or, inArray } from "drizzle-orm";

/**
 * Router para Dashboard do Gestor
 * Fornece dados consolidados e analytics para gestores
 */
export const dashboardGestorRouter = router({
  /**
   * Obter estatísticas gerais da equipe
   */
  getTeamStats: protectedProcedure
    .input(z.object({
      managerId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      departmentId: z.number().optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const managerId = input.managerId || ctx.user.id;
      
      // Buscar equipe do gestor
      let whereConditions: any[] = [eq(employees.managerId, managerId)];

      if (input.departmentId) {
        whereConditions.push(eq(employees.departmentId, input.departmentId));
      }

      const team = await db
        .select({
          id: employees.id,
        })
        .from(employees)
        .where(and(...whereConditions));
      
      const teamIds = team.map(e => e.id);

      if (teamIds.length === 0) {
        return {
          totalEmployees: 0,
          avgPerformance: 0,
          totalGoals: 0,
          completedGoals: 0,
          inProgressGoals: 0,
          pendingEvaluations: 0,
          activePDIs: 0,
          performanceTrend: 0,
        };
      }

      // Estatísticas de metas
      const goalsStats = await db
        .select({
          total: sql<number>`COUNT(*)`,
          completed: sql<number>`SUM(CASE WHEN ${goals.status} = 'concluida' THEN 1 ELSE 0 END)`,
          inProgress: sql<number>`SUM(CASE WHEN ${goals.status} = 'em_andamento' THEN 1 ELSE 0 END)`,
        })
        .from(goals)
        .where(inArray(goals.employeeId, teamIds));

      // Estatísticas de avaliações
      const evaluationsStats = await db
        .select({
          pending: sql<number>`SUM(CASE WHEN ${performanceEvaluations.status} = 'pendente' THEN 1 ELSE 0 END)`,
          avgScore: sql<number>`AVG(${performanceEvaluations.finalScore})`,
        })
        .from(performanceEvaluations)
        .where(inArray(performanceEvaluations.employeeId, teamIds));

      // Estatísticas de PDIs
      const pdiStats = await db
        .select({
          active: sql<number>`COUNT(*)`,
        })
        .from(pdiPlans)
        .where(
          and(
            inArray(pdiPlans.employeeId, teamIds),
            eq(pdiPlans.status, 'em_andamento')
          )
        );

      // Calcular tendência de performance (comparar com período anterior)
      let performanceTrend = 0;
      if (input.startDate && input.endDate) {
        const currentPeriodScore = evaluationsStats[0]?.avgScore || 0;
        
        // Calcular período anterior (mesmo intervalo de tempo antes)
        const start = new Date(input.startDate);
        const end = new Date(input.endDate);
        const diff = end.getTime() - start.getTime();
        const prevStart = new Date(start.getTime() - diff);
        const prevEnd = new Date(start);

        const prevPeriodStats = await db
          .select({
            avgScore: sql<number>`AVG(${performanceEvaluations.finalScore})`,
          })
          .from(performanceEvaluations)
          .where(
            and(
              inArray(performanceEvaluations.employeeId, teamIds),
              gte(performanceEvaluations.createdAt, prevStart),
              lte(performanceEvaluations.createdAt, prevEnd),
              eq(performanceEvaluations.status, 'concluida')
            )
          );

        const prevScore = prevPeriodStats[0]?.avgScore || 0;
        if (prevScore > 0) {
          performanceTrend = ((currentPeriodScore - prevScore) / prevScore) * 100;
        }
      }

      return {
        totalEmployees: team.length,
        avgPerformance: evaluationsStats[0]?.avgScore || 0,
        totalGoals: goalsStats[0]?.total || 0,
        completedGoals: goalsStats[0]?.completed || 0,
        inProgressGoals: goalsStats[0]?.inProgress || 0,
        pendingEvaluations: evaluationsStats[0]?.pending || 0,
        activePDIs: pdiStats[0]?.active || 0,
        performanceTrend,
      };
    }),

  /**
   * Obter performance por período (para gráficos)
   */
  getPerformanceByPeriod: protectedProcedure
    .input(z.object({
      managerId: z.number().optional(),
      startDate: z.string(),
      endDate: z.string(),
      groupBy: z.enum(['day', 'week', 'month', 'quarter']).default('month'),
      departmentId: z.number().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const managerId = input.managerId || ctx.user.id;
      
      // Buscar equipe do gestor
      let whereConditions2: any[] = [eq(employees.managerId, managerId)];

      if (input.departmentId) {
        whereConditions2.push(eq(employees.departmentId, input.departmentId));
      }

      const team = await db
        .select({
          id: employees.id,
        })
        .from(employees)
        .where(and(...whereConditions2));
      
      const teamIds = team.map(e => e.id);

      if (teamIds.length === 0) {
        return [];
      }

      // Determinar formato de agrupamento SQL
      let dateFormat: string;
      switch (input.groupBy) {
        case 'day':
          dateFormat = '%Y-%m-%d';
          break;
        case 'week':
          dateFormat = '%Y-%U';
          break;
        case 'month':
          dateFormat = '%Y-%m';
          break;
        case 'quarter':
          dateFormat = '%Y-Q%q';
          break;
        default:
          dateFormat = '%Y-%m';
      }

      // Buscar avaliações agrupadas por período
      const performanceData = await db
        .select({
          period: sql<string>`DATE_FORMAT(${performanceEvaluations.createdAt}, ${dateFormat})`,
          avgScore: sql<number>`AVG(${performanceEvaluations.finalScore})`,
          count: sql<number>`COUNT(*)`,
        })
        .from(performanceEvaluations)
        .where(
          and(
            inArray(performanceEvaluations.employeeId, teamIds),
            gte(performanceEvaluations.createdAt, new Date(input.startDate)),
            lte(performanceEvaluations.createdAt, new Date(input.endDate)),
            eq(performanceEvaluations.status, 'concluida')
          )
        )
        .groupBy(sql`period`)
        .orderBy(sql`period`);

      return performanceData;
    }),

  /**
   * Obter performance por departamento
   */
  getPerformanceByDepartment: protectedProcedure
    .input(z.object({
      managerId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const managerId = input.managerId || ctx.user.id;

      // Buscar equipe do gestor
      const team = await db
        .select()
        .from(employees)
        .where(eq(employees.managerId, managerId));

      const teamIds = team.map(e => e.id);

      if (teamIds.length === 0) {
        return [];
      }

      // Construir query com joins
      let whereConditions = [inArray(employees.id, teamIds)];
      
      if (input.startDate && input.endDate) {
        whereConditions.push(
          gte(performanceEvaluations.createdAt, new Date(input.startDate)),
          lte(performanceEvaluations.createdAt, new Date(input.endDate)),
          eq(performanceEvaluations.status, 'concluida')
        );
      }

      const query = db
        .select({
          departmentId: employees.departmentId,
          departmentName: departments.name,
          avgScore: sql<number>`AVG(${performanceEvaluations.finalScore})`,
          count: sql<number>`COUNT(DISTINCT ${employees.id})`,
          totalEvaluations: sql<number>`COUNT(${performanceEvaluations.id})`,
        })
        .from(employees)
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .leftJoin(performanceEvaluations, 
          and(
            eq(employees.id, performanceEvaluations.employeeId),
            eq(performanceEvaluations.status, 'concluida')
          )
        )
        .where(and(...whereConditions));

      const departmentData = await query
        .groupBy(employees.departmentId, departments.name);

      return departmentData;
    }),

  /**
   * Obter avaliações pendentes com detalhes
   */
  getPendingEvaluationsDetailed: protectedProcedure
    .input(z.object({
      managerId: z.number().optional(),
      limit: z.number().default(10),
      offset: z.number().default(0),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const managerId = input.managerId || ctx.user.id;

      // Buscar equipe do gestor
      const team = await db
        .select()
        .from(employees)
        .where(eq(employees.managerId, managerId));

      const teamIds = team.map(e => e.id);

      if (teamIds.length === 0) {
        return { evaluations: [], total: 0 };
      }

      // Buscar avaliações pendentes com detalhes
      const evaluations = await db
        .select({
          id: performanceEvaluations.id,
          employeeId: performanceEvaluations.employeeId,
          employeeName: employees.name,
          employeePosition: positions.title,
          createdAt: performanceEvaluations.createdAt,
          updatedAt: performanceEvaluations.updatedAt,
          status: performanceEvaluations.status,
          workflowStatus: performanceEvaluations.workflowStatus,
          cycleId: performanceEvaluations.cycleId,
          cycleName: evaluationCycles.name,
        })
        .from(performanceEvaluations)
        .leftJoin(employees, eq(performanceEvaluations.employeeId, employees.id))
        .leftJoin(positions, eq(employees.positionId, positions.id))
        .leftJoin(evaluationCycles, eq(performanceEvaluations.cycleId, evaluationCycles.id))
        .where(
          and(
            inArray(performanceEvaluations.employeeId, teamIds),
            or(
              eq(performanceEvaluations.status, 'pendente'),
              eq(performanceEvaluations.status, 'em_andamento')
            )
          )
        )
        .orderBy(desc(performanceEvaluations.updatedAt))
        .limit(input.limit)
        .offset(input.offset);

      // Contar total
      const totalResult = await db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(performanceEvaluations)
        .where(
          and(
            inArray(performanceEvaluations.employeeId, teamIds),
            or(
              eq(performanceEvaluations.status, 'pendente'),
              eq(performanceEvaluations.status, 'em_andamento')
            )
          )
        );

      return {
        evaluations,
        total: totalResult[0]?.count || 0,
      };
    }),

  /**
   * Obter comparativo de performance entre colaboradores
   */
  getTeamPerformanceComparison: protectedProcedure
    .input(z.object({
      managerId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const managerId = input.managerId || ctx.user.id;

      // Buscar equipe do gestor
      const team = await db
        .select()
        .from(employees)
        .where(eq(employees.managerId, managerId));

      const teamIds = team.map(e => e.id);

      if (teamIds.length === 0) {
        return [];
      }

      // Construir query de comparação
      let whereConditions = [inArray(employees.id, teamIds)];
      
      if (input.startDate && input.endDate) {
        whereConditions.push(
          gte(performanceEvaluations.createdAt, new Date(input.startDate)),
          lte(performanceEvaluations.createdAt, new Date(input.endDate)),
          eq(performanceEvaluations.status, 'concluida')
        );
      }

      const query = db
        .select({
          employeeId: employees.id,
          employeeName: employees.name,
          employeePosition: positions.title,
          departmentName: departments.name,
          avgScore: sql<number>`AVG(${performanceEvaluations.finalScore})`,
          evaluationCount: sql<number>`COUNT(${performanceEvaluations.id})`,
          completedGoals: sql<number>`(SELECT COUNT(*) FROM ${goals} WHERE ${goals.employeeId} = ${employees.id} AND ${goals.status} = 'concluida')`,
          totalGoals: sql<number>`(SELECT COUNT(*) FROM ${goals} WHERE ${goals.employeeId} = ${employees.id})`,
          nineBoxPerformance: nineBoxPositions.performance,
          nineBoxPotential: nineBoxPositions.potential,
        })
        .from(employees)
        .leftJoin(positions, eq(employees.positionId, positions.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .leftJoin(performanceEvaluations, 
          and(
            eq(employees.id, performanceEvaluations.employeeId),
            eq(performanceEvaluations.status, 'concluida')
          )
        )
        .leftJoin(nineBoxPositions, eq(employees.id, nineBoxPositions.employeeId))
        .where(and(...whereConditions));

      const comparison = await query
        .groupBy(
          employees.id,
          employees.name,
          positions.title,
          departments.name,
          nineBoxPositions.performance,
          nineBoxPositions.potential
        )
        .orderBy(desc(sql`avgScore`))
        .limit(input.limit);

      return comparison;
    }),

  /**
   * Obter heatmap de performance por área
   */
  getPerformanceHeatmap: protectedProcedure
    .input(z.object({
      managerId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const managerId = input.managerId || ctx.user.id;

      // Buscar equipe do gestor
      const team = await db
        .select()
        .from(employees)
        .where(eq(employees.managerId, managerId));

      const teamIds = team.map(e => e.id);

      if (teamIds.length === 0) {
        return [];
      }

      // Buscar dados para heatmap (departamento x cargo)
      let whereConditions = [inArray(employees.id, teamIds)];
      
      if (input.startDate && input.endDate) {
        whereConditions.push(
          gte(performanceEvaluations.createdAt, new Date(input.startDate)),
          lte(performanceEvaluations.createdAt, new Date(input.endDate)),
          eq(performanceEvaluations.status, 'concluida')
        );
      }

      const query = db
        .select({
          department: departments.name,
          position: positions.title,
          avgScore: sql<number>`AVG(${performanceEvaluations.finalScore})`,
          count: sql<number>`COUNT(DISTINCT ${employees.id})`,
        })
        .from(employees)
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .leftJoin(positions, eq(employees.positionId, positions.id))
        .leftJoin(performanceEvaluations, 
          and(
            eq(employees.id, performanceEvaluations.employeeId),
            eq(performanceEvaluations.status, 'concluida')
          )
        )
        .where(and(...whereConditions));

      const heatmapData = await query
        .groupBy(departments.name, positions.title);

      return heatmapData;
    }),

  /**
   * Obter indicadores de tendências
   */
  getTrendIndicators: protectedProcedure
    .input(z.object({
      managerId: z.number().optional(),
      months: z.number().default(6),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const managerId = input.managerId || ctx.user.id;

      // Buscar equipe do gestor
      const team = await db
        .select()
        .from(employees)
        .where(eq(employees.managerId, managerId));

      const teamIds = team.map(e => e.id);

      if (teamIds.length === 0) {
        return {
          improving: [],
          declining: [],
          stable: [],
        };
      }

      // Calcular período
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - input.months);

      // Buscar avaliações dos últimos meses
      const evaluations = await db
        .select({
          employeeId: performanceEvaluations.employeeId,
          employeeName: employees.name,
          score: performanceEvaluations.finalScore,
          createdAt: performanceEvaluations.createdAt,
        })
        .from(performanceEvaluations)
        .leftJoin(employees, eq(performanceEvaluations.employeeId, employees.id))
        .where(
          and(
            inArray(performanceEvaluations.employeeId, teamIds),
            gte(performanceEvaluations.createdAt, startDate),
            lte(performanceEvaluations.createdAt, endDate),
            eq(performanceEvaluations.status, 'concluida')
          )
        )
        .orderBy(performanceEvaluations.employeeId, performanceEvaluations.createdAt);

      // Agrupar por funcionário e calcular tendência
      const employeeTrends = new Map<number, { name: string; scores: number[]; trend: number }>();

      for (const evaluation of evaluations) {
        if (!employeeTrends.has(evaluation.employeeId)) {
          employeeTrends.set(evaluation.employeeId, {
            name: evaluation.employeeName || '',
            scores: [],
            trend: 0,
          });
        }
        employeeTrends.get(evaluation.employeeId)!.scores.push(evaluation.score || 0);
      }

      // Calcular tendência (regressão linear simples)
      const improving: Array<{ employeeId: number; name: string; trend: number }> = [];
      const declining: Array<{ employeeId: number; name: string; trend: number }> = [];
      const stable: Array<{ employeeId: number; name: string; trend: number }> = [];

      employeeTrends.forEach((data, employeeId) => {
        if (data.scores.length < 2) {
          stable.push({ employeeId, name: data.name, trend: 0 });
          return;
        }

        // Calcular tendência linear
        const n = data.scores.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = data.scores.reduce((a, b) => a + b, 0);
        const sumXY = data.scores.reduce((sum, score, i) => sum + i * score, 0);
        const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

        if (slope > 0.5) {
          improving.push({ employeeId, name: data.name, trend: slope });
        } else if (slope < -0.5) {
          declining.push({ employeeId, name: data.name, trend: slope });
        } else {
          stable.push({ employeeId, name: data.name, trend: slope });
        }
      });

      return {
        improving: improving.sort((a, b) => b.trend - a.trend),
        declining: declining.sort((a, b) => a.trend - b.trend),
        stable,
      };
    }),
});
