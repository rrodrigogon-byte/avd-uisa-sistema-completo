import { z } from "zod";
import { desc, eq, and, sql, inArray } from "drizzle-orm";
import { getDb } from "./db";
import { 
  nineBoxPositions,
  employees,
  positions,
  departments
} from "../drizzle/schema";
import { protectedProcedure, router } from "./_core/trpc";

/**
 * Nine Box Router
 * Endpoints para análise comparativa de Nine Box por função/cargo
 */

export const nineBoxRouter = router({
  // Análise comparativa por função/cargo
  getComparative: protectedProcedure
    .input(
      z.object({
        positionIds: z.array(z.number()).optional(),
        departmentId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) return [];

      // Buscar últimas posições Nine Box de cada colaborador
      const latestPositions = await database
        .select({
          employeeId: nineBoxPositions.employeeId,
          employeeName: employees.name,
          positionId: employees.positionId,
          positionTitle: positions.title,
          departmentId: employees.departmentId,
          departmentName: departments.name,
          performance: nineBoxPositions.performance,
          potential: nineBoxPositions.potential,
          createdAt: nineBoxPositions.createdAt,
        })
        .from(nineBoxPositions)
        .innerJoin(employees, eq(nineBoxPositions.employeeId, employees.id))
        .leftJoin(positions, eq(employees.positionId, positions.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .where(
          and(
            input.departmentId ? eq(employees.departmentId, input.departmentId) : undefined,
            input.positionIds && input.positionIds.length > 0
              ? inArray(employees.positionId, input.positionIds)
              : undefined
          )
        )
        .orderBy(desc(nineBoxPositions.createdAt));

      // Agrupar por colaborador (pegar apenas a posição mais recente)
      const uniqueEmployees = new Map();
      for (const pos of latestPositions) {
        if (!uniqueEmployees.has(pos.employeeId)) {
          uniqueEmployees.set(pos.employeeId, pos);
        }
      }

      const data = Array.from(uniqueEmployees.values());

      // Agrupar por cargo
      const byPosition: Record<string, typeof data> = {};
      for (const item of data) {
        const key = item.positionTitle || "Sem cargo";
        if (!byPosition[key]) {
          byPosition[key] = [];
        }
        byPosition[key].push(item);
      }

      // Calcular distribuição Nine Box por cargo
      const comparative = Object.entries(byPosition).map(([positionTitle, items]) => {
        // Contar distribuição na matriz 3x3
        const distribution = {
          baixo_desempenho_baixo_potencial: 0, // Perf 1, Pot 1
          baixo_desempenho_medio_potencial: 0,  // Perf 1, Pot 2
          baixo_desempenho_alto_potencial: 0,   // Perf 1, Pot 3
          medio_desempenho_baixo_potencial: 0,  // Perf 2, Pot 1
          medio_desempenho_medio_potencial: 0,  // Perf 2, Pot 2
          medio_desempenho_alto_potencial: 0,   // Perf 2, Pot 3
          alto_desempenho_baixo_potencial: 0,   // Perf 3, Pot 1
          alto_desempenho_medio_potencial: 0,   // Perf 3, Pot 2
          alto_desempenho_alto_potencial: 0,    // Perf 3, Pot 3 (Stars)
        };

        items.forEach((item) => {
          const key = `${
            item.performance === 1 ? "baixo" : item.performance === 2 ? "medio" : "alto"
          }_desempenho_${
            item.potential === 1 ? "baixo" : item.potential === 2 ? "medio" : "alto"
          }_potencial`;
          distribution[key as keyof typeof distribution]++;
        });

        // Calcular métricas agregadas
        const avgPerformance =
          items.reduce((sum, item) => sum + item.performance, 0) / items.length;
        const avgPotential =
          items.reduce((sum, item) => sum + item.potential, 0) / items.length;

        const highPerformers = items.filter((i) => i.performance >= 3).length;
        const highPotential = items.filter((i) => i.potential >= 3).length;
        const stars = items.filter((i) => i.performance >= 3 && i.potential >= 3).length;

        return {
          positionTitle,
          totalEmployees: items.length,
          distribution,
          avgPerformance: Number(avgPerformance.toFixed(2)),
          avgPotential: Number(avgPotential.toFixed(2)),
          highPerformersCount: highPerformers,
          highPerformersPercent: Number(((highPerformers / items.length) * 100).toFixed(1)),
          highPotentialCount: highPotential,
          highPotentialPercent: Number(((highPotential / items.length) * 100).toFixed(1)),
          starsCount: stars,
          starsPercent: Number(((stars / items.length) * 100).toFixed(1)),
        };
      });

      return comparative;
    }),

  // Listar todas as posições disponíveis para comparação
  getAvailablePositions: protectedProcedure.query(async () => {
    const database = await getDb();
    if (!database) return [];

    const positionsWithCount = await database
      .select({
        id: positions.id,
        title: positions.title,
        employeeCount: sql<number>`COUNT(${employees.id})`,
      })
      .from(positions)
      .leftJoin(employees, eq(positions.id, employees.positionId))
      .groupBy(positions.id, positions.title)
      .having(sql`COUNT(${employees.id}) > 0`)
      .orderBy(positions.title);

    return positionsWithCount;
  }),
});
