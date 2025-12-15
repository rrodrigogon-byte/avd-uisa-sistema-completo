/**
 * Custom Report Builder Router
 * Sistema de Relatórios Personalizados com construtor drag-and-drop
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  customReports,
  employees,
  goals,
  performanceEvaluations,
  pdiPlans,
  nineBoxPositions,
  departments,
  positions,
} from "../drizzle/schema";
import { eq, and, gte, lte, like, inArray, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Schema de validação para filtros
const filterSchema = z.object({
  field: z.string(),
  operator: z.enum(["eq", "ne", "gt", "lt", "gte", "lte", "contains", "startsWith", "endsWith", "in"]),
  value: z.any(),
});

// Schema de validação para visualizações
const visualizationSchema = z.object({
  type: z.enum(["table", "bar", "line", "pie", "area", "scatter"]),
  xAxis: z.string().optional(),
  yAxis: z.string().optional(),
  config: z.record(z.any()).optional(),
});

export const customReportBuilderRouter = router({
  /**
   * Listar todos os relatórios personalizados do usuário
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const reports = await db
      .select()
      .from(customReports)
      .where(eq(customReports.createdBy, ctx.user.id))
      .orderBy(desc(customReports.createdAt));

    return reports;
  }),

  /**
   * Criar novo relatório personalizado
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        dataSource: z.enum(["employees", "goals", "evaluations", "pdi", "ninebox", "succession", "calibration", "bonus", "feedback", "competencies"]),
        selectedFields: z.array(z.string()),
        filters: z.array(filterSchema).optional(),
        groupBy: z.array(z.string()).optional(),
        orderBy: z.array(z.object({ field: z.string(), direction: z.enum(["asc", "desc"]) })).optional(),
        visualizations: z.array(visualizationSchema).optional(),
        isPublic: z.boolean().default(false),
        sharedWith: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [report] = await db.insert(customReports).values({
        name: input.name,
        description: input.description,
        createdBy: ctx.user.id,
        metrics: JSON.stringify({
          dataSource: input.dataSource,
          selectedFields: input.selectedFields,
          visualizations: input.visualizations,
        }),
        filters: JSON.stringify({}),
        chartType: input.visualizations[0]?.type || 'table',
      });

      return { id: report.insertId, message: "Relatório criado com sucesso!" };
    }),

  /**
   * Executar relatório personalizado
   */
  execute: protectedProcedure
    .input(z.object({ reportId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar configuração do relatório
      const [report] = await db
        .select()
        .from(customReports)
        .where(eq(customReports.id, input.reportId))
        .limit(1);

      if (!report) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Relatório não encontrado" });
      }

      // Verificar permissão
      const config = JSON.parse(report.config || "{}");
      if (report.createdBy !== ctx.user.id && !config.isPublic && !config.sharedWith?.includes(ctx.user.id)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Você não tem permissão para executar este relatório" });
      }

      // Executar query baseado na fonte de dados
      let data: any[] = [];
      const startTime = Date.now();

      try {
        switch (config.dataSource) {
          case "employees":
            data = await executeEmployeesQuery(db, config);
            break;
          case "goals":
            data = await executeGoalsQuery(db, config);
            break;
          case "evaluations":
            data = await executeEvaluationsQuery(db, config);
            break;
          case "pdi":
            data = await executePdiQuery(db, config);
            break;
          case "ninebox":
            data = await executeNineBoxQuery(db, config);
            break;
          default:
            throw new TRPCError({ code: "BAD_REQUEST", message: "Fonte de dados não suportada" });
        }

        const executionTimeMs = Date.now() - startTime;

        return {
          data,
          rowCount: data.length,
          executionTimeMs,
          config,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao executar relatório: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        });
      }
    }),

  /**
   * Atualizar relatório personalizado
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        selectedFields: z.array(z.string()).optional(),
        filters: z.array(filterSchema).optional(),
        visualizations: z.array(visualizationSchema).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [report] = await db
        .select()
        .from(customReports)
        .where(eq(customReports.id, input.id))
        .limit(1);

      if (!report || report.createdBy !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Você não tem permissão para editar este relatório" });
      }

      const currentConfig = JSON.parse(report.config || "{}");
      const updatedConfig = {
        ...currentConfig,
        ...(input.selectedFields && { selectedFields: input.selectedFields }),
        ...(input.filters && { filters: input.filters }),
        ...(input.visualizations && { visualizations: input.visualizations }),
      };

      await db
        .update(customReports)
        .set({
          ...(input.name && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
          config: JSON.stringify(updatedConfig),
        })
        .where(eq(customReports.id, input.id));

      return { message: "Relatório atualizado com sucesso!" };
    }),

  /**
   * Deletar relatório personalizado
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [report] = await db
        .select()
        .from(customReports)
        .where(eq(customReports.id, input.id))
        .limit(1);

      if (!report || report.createdBy !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Você não tem permissão para deletar este relatório" });
      }

      await db.delete(customReports).where(eq(customReports.id, input.id));

      return { message: "Relatório deletado com sucesso!" };
    }),
});

// ============================================================================
// FUNÇÕES AUXILIARES PARA EXECUTAR QUERIES
// ============================================================================

async function executeEmployeesQuery(db: any, config: any) {
  let query = db
    .select({
      id: employees.id,
      name: employees.name,
      email: employees.email,
      department: departments.name,
      position: positions.name,
      status: employees.status,
      hireDate: employees.hireDate,
    })
    .from(employees)
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(positions, eq(employees.positionId, positions.id));

  // Aplicar filtros
  if (config.filters && config.filters.length > 0) {
    for (const filter of config.filters) {
      query = applyFilter(query, employees, filter);
    }
  }

  const results = await query;
  return results;
}

async function executeGoalsQuery(db: any, config: any) {
  let query = db
    .select({
      id: goals.id,
      title: goals.title,
      description: goals.description,
      employee: employees.name,
      status: goals.status,
      progress: goals.progress,
      startDate: goals.startDate,
      endDate: goals.endDate,
    })
    .from(goals)
    .leftJoin(employees, eq(goals.employeeId, employees.id));

  if (config.filters && config.filters.length > 0) {
    for (const filter of config.filters) {
      query = applyFilter(query, goals, filter);
    }
  }

  const results = await query;
  return results;
}

async function executeEvaluationsQuery(db: any, config: any) {
  let query = db
    .select({
      id: performanceEvaluations.id,
      employee: employees.name,
      rating: performanceEvaluations.overallRating,
      status: performanceEvaluations.status,
      evaluationDate: performanceEvaluations.evaluationDate,
    })
    .from(performanceEvaluations)
    .leftJoin(employees, eq(performanceEvaluations.employeeId, employees.id));

  if (config.filters && config.filters.length > 0) {
    for (const filter of config.filters) {
      query = applyFilter(query, performanceEvaluations, filter);
    }
  }

  const results = await query;
  return results;
}

async function executePdiQuery(db: any, config: any) {
  let query = db
    .select({
      id: pdiPlans.id,
      employee: employees.name,
      title: pdiPlans.title,
      status: pdiPlans.status,
      progress: pdiPlans.progress,
      startDate: pdiPlans.startDate,
      endDate: pdiPlans.endDate,
    })
    .from(pdiPlans)
    .leftJoin(employees, eq(pdiPlans.employeeId, employees.id));

  if (config.filters && config.filters.length > 0) {
    for (const filter of config.filters) {
      query = applyFilter(query, pdiPlans, filter);
    }
  }

  const results = await query;
  return results;
}

async function executeNineBoxQuery(db: any, config: any) {
  let query = db
    .select({
      id: nineBoxPositions.id,
      employee: employees.name,
      performance: nineBoxPositions.performance,
      potential: nineBoxPositions.potential,
      quadrant: nineBoxPositions.quadrant,
      evaluationDate: nineBoxPositions.evaluationDate,
    })
    .from(nineBoxPositions)
    .leftJoin(employees, eq(nineBoxPositions.employeeId, employees.id));

  if (config.filters && config.filters.length > 0) {
    for (const filter of config.filters) {
      query = applyFilter(query, nineBoxPositions, filter);
    }
  }

  const results = await query;
  return results;
}

function applyFilter(query: any, table: any, filter: any) {
  const field = table[filter.field];
  if (!field) return query;

  switch (filter.operator) {
    case "eq":
      return query.where(eq(field, filter.value));
    case "ne":
      return query.where(eq(field, filter.value)); // Implementar NOT
    case "gt":
      return query.where(gte(field, filter.value));
    case "lt":
      return query.where(lte(field, filter.value));
    case "gte":
      return query.where(gte(field, filter.value));
    case "lte":
      return query.where(lte(field, filter.value));
    case "contains":
      return query.where(like(field, `%${filter.value}%`));
    case "startsWith":
      return query.where(like(field, `${filter.value}%`));
    case "endsWith":
      return query.where(like(field, `%${filter.value}`));
    case "in":
      return query.where(inArray(field, filter.value));
    default:
      return query;
  }
}
