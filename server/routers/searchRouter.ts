import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { employees, goals, performanceEvaluations, pdiPlans, jobDescriptions, evaluationCycles } from "../../drizzle/schema";
import { like, or, and, sql } from "drizzle-orm";

/**
 * Router de Busca Global
 * Permite buscar em múltiplas entidades do sistema
 */

export const searchRouter = router({
  /**
   * Busca global unificada
   */
  global: protectedProcedure
    .input(
      z.object({
        query: z.string().min(2),
        limit: z.number().min(1).max(50).default(20),
        types: z
          .array(z.enum(["employee", "goal", "evaluation", "pdi", "job_description", "cycle"]))
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const searchPattern = `%${input.query}%`;
      const results: Array<{
        id: number;
        type: "employee" | "goal" | "evaluation" | "pdi" | "job_description" | "cycle";
        title: string;
        subtitle?: string;
        url: string;
      }> = [];

      const types = input.types || [
        "employee",
        "goal",
        "evaluation",
        "pdi",
        "job_description",
        "cycle",
      ];

      // Buscar funcionários
      if (types.includes("employee")) {
        const employeeResults = await db
          .select({
            id: employees.id,
            name: employees.name,
            positionId: employees.positionId,
            departmentId: employees.departmentId,
          })
          .from(employees)
          .where(
            or(
              like(employees.name, searchPattern),
              like(employees.email, searchPattern)
            )
          )
          .limit(input.limit);

        employeeResults.forEach((emp) => {
          results.push({
            id: emp.id,
            type: "employee",
            title: emp.name || "Sem nome",
            subtitle: `Funcionário`,
            url: `/funcionarios/${emp.id}`,
          });
        });
      }

      // Buscar metas
      if (types.includes("goal")) {
        const goalResults = await db
          .select({
            id: goals.id,
            title: goals.title,
            description: goals.description,
            status: goals.status,
          })
          .from(goals)
          .where(
            and(
              or(like(goals.title, searchPattern), like(goals.description, searchPattern)),
              // Apenas metas do usuário ou metas públicas
              ctx.user.role === "admin" || ctx.user.role === "rh"
                ? undefined
                : sql`${goals.employeeId} = ${ctx.user.id}`
            )
          )
          .limit(input.limit);

        goalResults.forEach((goal) => {
          results.push({
            id: goal.id,
            type: "goal",
            title: goal.title,
            subtitle: goal.description?.substring(0, 100),
            url: `/metas/${goal.id}`,
          });
        });
      }

      // Buscar avaliações
      if (types.includes("evaluation")) {
        const evaluationResults = await db
          .select({
            id: performanceEvaluations.id,
            status: performanceEvaluations.status,
            employeeId: performanceEvaluations.employeeId,
          })
          .from(performanceEvaluations)
          .where(
            ctx.user.role === "admin" || ctx.user.role === "rh"
              ? undefined
              : sql`${performanceEvaluations.employeeId} = ${ctx.user.id}`
          )
          .limit(input.limit);

        evaluationResults.forEach((evaluation) => {
          results.push({
            id: evaluation.id,
            type: "evaluation",
            title: `Avaliação #${evaluation.id}`,
            subtitle: `Status: ${evaluation.status}`,
            url: `/avaliacoes/${evaluation.id}`,
          });
        });
      }

      // Buscar PDIs
      if (types.includes("pdi")) {
        const pdiResults = await db
          .select({
            id: pdiPlans.id,
            status: pdiPlans.status,
            employeeId: pdiPlans.employeeId,
          })
          .from(pdiPlans)
          .where(
            ctx.user.role === "admin" || ctx.user.role === "rh"
              ? undefined
              : sql`${pdiPlans.employeeId} = ${ctx.user.id}`
          )
          .limit(input.limit);

        pdiResults.forEach((pdi) => {
          results.push({
            id: pdi.id,
            type: "pdi",
            title: `PDI #${pdi.id}`,
            subtitle: `Status: ${pdi.status}`,
            url: `/pdi/${pdi.id}`,
          });
        });
      }

      // Buscar descrições de cargo
      if (types.includes("job_description")) {
        const jobDescResults = await db
          .select({
            id: jobDescriptions.id,
            positionTitle: jobDescriptions.positionTitle,
            departmentName: jobDescriptions.departmentName,
            status: jobDescriptions.status,
          })
          .from(jobDescriptions)
          .where(
            or(
              like(jobDescriptions.positionTitle, searchPattern),
              like(jobDescriptions.departmentName, searchPattern)
            )
          )
          .limit(input.limit);

        jobDescResults.forEach((desc) => {
          results.push({
            id: desc.id,
            type: "job_description",
            title: desc.positionTitle,
            subtitle: `${desc.departmentName} - ${desc.status}`,
            url: `/descricao-cargos/${desc.id}`,
          });
        });
      }

      // Buscar ciclos
      if (types.includes("cycle")) {
        const cycleResults = await db
          .select({
            id: evaluationCycles.id,
            name: evaluationCycles.name,
            type: evaluationCycles.type,
            status: evaluationCycles.status,
          })
          .from(evaluationCycles)
          .where(like(evaluationCycles.name, searchPattern))
          .limit(input.limit);

        cycleResults.forEach((cycle) => {
          results.push({
            id: cycle.id,
            type: "cycle",
            title: cycle.name,
            subtitle: `${cycle.type} - ${cycle.status}`,
            url: `/ciclos/${cycle.id}`,
          });
        });
      }

      // Ordenar por relevância (pode ser melhorado com algoritmo de ranking)
      return results.slice(0, input.limit);
    }),

  /**
   * Busca rápida (apenas títulos, mais rápida)
   */
  quick: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(10).default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const searchPattern = `%${input.query}%`;
      const results: Array<{
        id: number;
        type: string;
        title: string;
        url: string;
      }> = [];

      // Apenas funcionários e metas para busca rápida
      const [employeeResults, goalResults] = await Promise.all([
        db
          .select({
            id: employees.id,
            name: employees.name,
          })
          .from(employees)
          .where(like(employees.name, searchPattern))
          .limit(3),

        db
          .select({
            id: goals.id,
            title: goals.title,
          })
          .from(goals)
          .where(like(goals.title, searchPattern))
          .limit(3),
      ]);

      employeeResults.forEach((emp) => {
        results.push({
          id: emp.id,
          type: "employee",
          title: emp.name || "Sem nome",
          url: `/funcionarios/${emp.id}`,
        });
      });

      goalResults.forEach((goal) => {
        results.push({
          id: goal.id,
          type: "goal",
          title: goal.title,
          url: `/metas/${goal.id}`,
        });
      });

      return results.slice(0, input.limit);
    }),

  /**
   * Sugestões de busca (autocomplete)
   */
  suggestions: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(10).default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const searchPattern = `${input.query}%`; // Prefixo

      // Buscar nomes de funcionários
      const suggestions = await db
        .select({
          text: employees.name,
          type: sql<string>`'employee'`,
        })
        .from(employees)
        .where(like(employees.name, searchPattern))
        .limit(input.limit);

      return suggestions.map((s) => s.text);
    }),
});
