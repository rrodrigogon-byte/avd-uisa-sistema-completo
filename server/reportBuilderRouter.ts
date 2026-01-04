import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "./_core/trpc";
import { customReports, employees, departments, positions, nineBoxPositions, goals } from "../drizzle/schema";
import { getDb } from "./db";
import { eq, sql, and, gte, lte, count, avg } from "drizzle-orm";

export const reportBuilderRouter = router({
  // Listar relatórios customizados
  list: protectedProcedure.input(z.object({}).optional()).query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return await db
      .select()
      .from(customReports)
      .where(
        sql`${customReports.createdBy} = ${ctx.user.id} OR ${customReports.isPublic} = true`
      )
      .orderBy(sql`${customReports.createdAt} DESC`);
  }),

  // Obter relatório por ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db
        .select()
        .from(customReports)
        .where(eq(customReports.id, input.id))
        .limit(1);

      return result.length > 0 ? result[0] : null;
    }),

  // Criar relatório customizado
  create: adminProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        metrics: z.array(z.string()),
        filters: z.any().optional(),
        chartType: z.string().optional(),
        isTemplate: z.boolean().optional(),
        isPublic: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db.insert(customReports).values({
        ...input,
        createdBy: ctx.user.id,
        metrics: input.metrics as any,
        filters: input.filters as any,
      });

      return { id: result.insertId };
    }),

  // Atualizar relatório
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        metrics: z.array(z.string()).optional(),
        filters: z.any().optional(),
        chartType: z.string().optional(),
        isTemplate: z.boolean().optional(),
        isPublic: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...data } = input;
      await db
        .update(customReports)
        .set({
          ...data,
          metrics: data.metrics as any,
          filters: data.filters as any,
        })
        .where(eq(customReports.id, id));

      return { success: true };
    }),

  // Deletar relatório
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(customReports).where(eq(customReports.id, input.id));
      return { success: true };
    }),

  // Executar relatório e retornar dados
  execute: protectedProcedure
    .input(
      z.object({
        metrics: z.array(z.string()),
        filters: z.any().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { data: [], summary: {} };

      const filters = input.filters || {};
      const results: any = {};

      // Processar cada métrica solicitada
      for (const metric of input.metrics) {
        switch (metric) {
          case "headcount":
            let headcountConditions = [eq(employees.status, "ativo")];
            if (filters.departmentId) {
              headcountConditions.push(eq(employees.departmentId, filters.departmentId));
            }

            const headcount = await db
              .select({ count: count() })
              .from(employees)
              .where(and(...headcountConditions));
            results.headcount = headcount[0]?.count || 0;
            break;

          case "avgPerformance":
            const perfQuery = db
              .select({ avg: avg(nineBoxPositions.performance) })
              .from(nineBoxPositions);

            if (filters.departmentId) {
              perfQuery
                .innerJoin(employees, eq(nineBoxPositions.employeeId, employees.id))
                .where(eq(employees.departmentId, filters.departmentId));
            }

            const perf = await perfQuery;
            results.avgPerformance = perf[0]?.avg || 0;
            break;

          case "goalsCompleted":
            let goalsConditions = [eq(goals.status, "concluida")];
            if (filters.startDate && filters.endDate) {
              goalsConditions.push(
                gte(goals.startDate, new Date(filters.startDate)),
                lte(goals.endDate, new Date(filters.endDate))
              );
            }

            const goalsCompleted = await db
              .select({ count: count() })
              .from(goals)
              .where(and(...goalsConditions));
            results.goalsCompleted = goalsCompleted[0]?.count || 0;
            break;

          case "highPotential":
            const highPotQuery = db
              .select({ count: count() })
              .from(nineBoxPositions)
              .innerJoin(employees, eq(nineBoxPositions.employeeId, employees.id))
              .where(
                filters.departmentId
                  ? and(
                      sql`${nineBoxPositions.potential} >= 2`,
                      eq(employees.departmentId, filters.departmentId)
                    )
                  : sql`${nineBoxPositions.potential} >= 2`
              );

            const highPot = await highPotQuery;
            results.highPotential = highPot[0]?.count || 0;
            break;

          case "departmentBreakdown":
            const deptBreakdown = await db
              .select({
                departmentName: departments.name,
                count: count(),
              })
              .from(employees)
              .innerJoin(departments, eq(employees.departmentId, departments.id))
              .where(eq(employees.status, "ativo"))
              .groupBy(departments.name);

            results.departmentBreakdown = deptBreakdown;
            break;

          default:
            results[metric] = null;
        }
      }

      return {
        data: results,
        summary: {
          generatedAt: new Date().toISOString(),
          metricsCount: input.metrics.length,
        },
      };
    }),

  // Obter métricas disponíveis
  getAvailableMetrics: protectedProcedure.input(z.object({}).optional()).query(() => {
    return [
      { id: "headcount", name: "Total de Colaboradores", category: "geral" },
      { id: "avgPerformance", name: "Performance Média", category: "performance" },
      { id: "goalsCompleted", name: "Metas Concluídas", category: "metas" },
      { id: "highPotential", name: "Alto Potencial", category: "talentos" },
      { id: "departmentBreakdown", name: "Distribuição por Departamento", category: "geral" },
      { id: "turnoverRate", name: "Taxa de Turnover", category: "geral" },
      { id: "avgSalary", name: "Salário Médio", category: "financeiro" },
      { id: "trainingHours", name: "Horas de Treinamento", category: "desenvolvimento" },
    ];
  }),

  // Listar departamentos para filtros
  getDepartments: protectedProcedure.input(z.object({}).optional()).query(async () => {
    const db = await getDb();
    if (!db) return [];

    return await db
      .select({
        id: departments.id,
        name: departments.name,
        code: departments.code,
      })
      .from(departments)
      .where(eq(departments.active, true))
      .orderBy(departments.name);
  }),

  // Listar posições para filtros
  getPositions: protectedProcedure.input(z.object({}).optional()).query(async () => {
    const db = await getDb();
    if (!db) return [];

    return await db
      .select({
        id: positions.id,
        title: positions.title,
        code: positions.code,
      })
      .from(positions)
      .where(eq(positions.active, true))
      .orderBy(positions.title);
  }),
});
