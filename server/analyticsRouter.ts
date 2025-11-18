import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "./db";
import { 
  performanceEvaluations, 
  nineBoxPositions, 
  goals, 
  pdiPlans, 
  employees 
} from "../drizzle/schema";
import { protectedProcedure, router } from "./_core/trpc";

export const analyticsRouter = router({
  // Buscar dados de tendências de performance
  getPerformanceTrends: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Acesso negado");
    }

    const database = await getDb();
    if (!database) return [];

    // Buscar avaliações agrupadas por mês
    const evaluations = await database.select()
      .from(performanceEvaluations)
      .orderBy(desc(performanceEvaluations.createdAt));

    // Agrupar por mês e calcular médias
    const monthlyData = new Map<string, { total: number; count: number }>();
    
    evaluations.forEach(evaluation => {
      const month = new Date(evaluation.createdAt).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { total: 0, count: 0 });
      }
      const data = monthlyData.get(month)!;
      data.total += evaluation.finalScore || 0;
      data.count += 1;
    });

    return Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      average: data.count > 0 ? data.total / data.count : 0,
      count: data.count,
    })).sort((a, b) => a.month.localeCompare(b.month)).slice(-12); // Últimos 12 meses
  }),

  // Buscar distribuição Nine Box
  getNineBoxDistribution: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Acesso negado");
    }

    const database = await getDb();
    if (!database) return [];

    const positions = await database.select()
      .from(nineBoxPositions);

    // Contar por quadrante
    const distribution: Record<string, number> = {};
    positions.forEach(pos => {
      const key = `${pos.performance}-${pos.potential}`;
      distribution[key] = (distribution[key] || 0) + 1;
    });

    return Object.entries(distribution).map(([key, count]) => {
      const [performance, potential] = key.split('-');
      return { performance, potential, count };
    });
  }),

  // Buscar taxas de conclusão
  getCompletionRates: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Acesso negado");
    }

    const database = await getDb();
    if (!database) return { goals: 0, pdis: 0 };

    // Metas
    const allGoals = await database.select().from(goals);
    const completedGoals = allGoals.filter(g => g.status === "concluida").length;
    const goalsRate = allGoals.length > 0 ? (completedGoals / allGoals.length) * 100 : 0;

    // PDIs
    const allPDIs = await database.select().from(pdiPlans);
    const completedPDIs = allPDIs.filter(p => p.status === "concluido").length;
    const pdisRate = allPDIs.length > 0 ? (completedPDIs / allPDIs.length) * 100 : 0;

    return {
      goals: Math.round(goalsRate),
      pdis: Math.round(pdisRate),
      totalGoals: allGoals.length,
      completedGoals,
      totalPDIs: allPDIs.length,
      completedPDIs,
    };
  }),

  // Buscar KPIs principais
  getKPIs: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Acesso negado");
    }

    const database = await getDb();
    if (!database) return {};

    // Média geral de performance
    const evaluations = await database.select().from(performanceEvaluations);
    const avgPerformance = evaluations.length > 0
      ? evaluations.reduce((sum, e) => sum + (e.finalScore || 0), 0) / evaluations.length
      : 0;

    // Total de colaboradores
    const allEmployees = await database.select().from(employees);
    const totalEmployees = allEmployees.length;

    // Colaboradores com PDI ativo
    const activePDIs = await database.select()
      .from(pdiPlans)
      .where(eq(pdiPlans.status, "em_andamento"));

    return {
      avgPerformance: Math.round(avgPerformance * 10) / 10,
      totalEmployees,
      employeesWithPDI: activePDIs.length,
      totalEvaluations: evaluations.length,
    };
  }),
});
