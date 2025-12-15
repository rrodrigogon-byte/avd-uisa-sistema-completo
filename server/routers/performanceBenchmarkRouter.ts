import { z } from "zod";
import { eq, and, desc, sql, gte, lte, between } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { 
  performanceBenchmarks, 
  performanceAlerts,
  employees,
  departments,
  positions,
  individualGoals,
  employeeCompetencies,
  avdPerformanceAssessments
} from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

export const performanceBenchmarkRouter = router({
  // Calcular e salvar benchmark
  calculate: protectedProcedure
    .input(z.object({
      scope: z.enum(["organizacao", "departamento", "cargo"]),
      departmentId: z.number().optional(),
      positionId: z.number().optional(),
      periodStart: z.string(),
      periodEnd: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const startDate = new Date(input.periodStart);
      const endDate = new Date(input.periodEnd);

      // Buscar colaboradores no escopo
      const employeeConditions = [eq(employees.active, true)];
      if (input.scope === "departamento" && input.departmentId) {
        employeeConditions.push(eq(employees.departmentId, input.departmentId));
      }
      if (input.scope === "cargo" && input.positionId) {
        employeeConditions.push(eq(employees.positionId, input.positionId));
      }

      const employeesList = await db
        .select({ id: employees.id })
        .from(employees)
        .where(and(...employeeConditions));

      const employeeIds = employeesList.map(e => e.id);
      const totalEmployees = employeeIds.length;

      if (totalEmployees === 0) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Nenhum colaborador encontrado no escopo selecionado" 
        });
      }

      // Buscar avaliações de desempenho no período
      const evaluations = await db
        .select({
          employeeId: avdPerformanceAssessments.employeeId,
          finalScore: avdPerformanceAssessments.finalScore,
          competencyScore: avdPerformanceAssessments.competencyScore,
          classification: avdPerformanceAssessments.classification,
        })
        .from(avdPerformanceAssessments)
        .where(and(
          sql`${avdPerformanceAssessments.employeeId} IN (${sql.raw(employeeIds.join(',') || '0')})`,
          gte(avdPerformanceAssessments.createdAt, startDate),
          lte(avdPerformanceAssessments.createdAt, endDate)
        ));

      const evaluatedEmployees = new Set(evaluations.map(e => e.employeeId)).size;
      const scores = evaluations.map(e => e.finalScore).filter(s => s !== null) as number[];
      const competencyScores = evaluations.map(e => e.competencyScore).filter(s => s !== null) as number[];

      // Calcular estatísticas
      const sortedScores = [...scores].sort((a, b) => a - b);
      const avgOverallScore = scores.length > 0 
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
        : null;
      const avgCompetencyScore = competencyScores.length > 0
        ? Math.round(competencyScores.reduce((a, b) => a + b, 0) / competencyScores.length)
        : null;

      // Calcular percentis
      const getPercentile = (arr: number[], p: number) => {
        if (arr.length === 0) return null;
        const index = Math.ceil((p / 100) * arr.length) - 1;
        return arr[Math.max(0, index)];
      };

      const p25Score = getPercentile(sortedScores, 25);
      const p50Score = getPercentile(sortedScores, 50);
      const p75Score = getPercentile(sortedScores, 75);
      const p90Score = getPercentile(sortedScores, 90);

      // Contar classificações
      const abaixoExpectativas = evaluations.filter(e => e.classification === "abaixo_expectativas").length;
      const atendeExpectativas = evaluations.filter(e => e.classification === "atende_expectativas").length;
      const superaExpectativas = evaluations.filter(e => e.classification === "supera_expectativas").length;
      const excepcional = evaluations.filter(e => e.classification === "excepcional").length;

      // Calcular média de conclusão de metas
      const goalStats = await db
        .select({
          progressPercent: individualGoals.progressPercent,
        })
        .from(individualGoals)
        .where(and(
          sql`${individualGoals.employeeId} IN (${sql.raw(employeeIds.join(',') || '0')})`,
          gte(individualGoals.createdAt, startDate),
          lte(individualGoals.createdAt, endDate)
        ));

      const avgGoalCompletion = goalStats.length > 0
        ? Math.round(goalStats.reduce((sum, g) => sum + (g.progressPercent || 0), 0) / goalStats.length)
        : null;

      // Salvar benchmark
      const [result] = await db.insert(performanceBenchmarks).values({
        scope: input.scope,
        departmentId: input.departmentId,
        positionId: input.positionId,
        periodStart: startDate,
        periodEnd: endDate,
        avgCompetencyScore,
        avgGoalCompletion,
        avgOverallScore,
        p25Score,
        p50Score,
        p75Score,
        p90Score,
        totalEmployees,
        evaluatedEmployees,
        abaixoExpectativas,
        atendeExpectativas,
        superaExpectativas,
        excepcional,
      });

      return { id: result.insertId, success: true };
    }),

  // Listar benchmarks
  list: protectedProcedure
    .input(z.object({
      scope: z.enum(["organizacao", "departamento", "cargo"]).optional(),
      departmentId: z.number().optional(),
      positionId: z.number().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [];
      if (input.scope) conditions.push(eq(performanceBenchmarks.scope, input.scope));
      if (input.departmentId) conditions.push(eq(performanceBenchmarks.departmentId, input.departmentId));
      if (input.positionId) conditions.push(eq(performanceBenchmarks.positionId, input.positionId));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const benchmarks = await db
        .select({
          id: performanceBenchmarks.id,
          scope: performanceBenchmarks.scope,
          departmentId: performanceBenchmarks.departmentId,
          positionId: performanceBenchmarks.positionId,
          periodStart: performanceBenchmarks.periodStart,
          periodEnd: performanceBenchmarks.periodEnd,
          avgCompetencyScore: performanceBenchmarks.avgCompetencyScore,
          avgGoalCompletion: performanceBenchmarks.avgGoalCompletion,
          avgOverallScore: performanceBenchmarks.avgOverallScore,
          p25Score: performanceBenchmarks.p25Score,
          p50Score: performanceBenchmarks.p50Score,
          p75Score: performanceBenchmarks.p75Score,
          p90Score: performanceBenchmarks.p90Score,
          totalEmployees: performanceBenchmarks.totalEmployees,
          evaluatedEmployees: performanceBenchmarks.evaluatedEmployees,
          abaixoExpectativas: performanceBenchmarks.abaixoExpectativas,
          atendeExpectativas: performanceBenchmarks.atendeExpectativas,
          superaExpectativas: performanceBenchmarks.superaExpectativas,
          excepcional: performanceBenchmarks.excepcional,
          calculatedAt: performanceBenchmarks.calculatedAt,
          departmentName: departments.name,
          positionTitle: positions.title,
        })
        .from(performanceBenchmarks)
        .leftJoin(departments, eq(performanceBenchmarks.departmentId, departments.id))
        .leftJoin(positions, eq(performanceBenchmarks.positionId, positions.id))
        .where(whereClause)
        .orderBy(desc(performanceBenchmarks.calculatedAt))
        .limit(input.limit);

      return benchmarks;
    }),

  // Obter benchmark mais recente para um contexto
  getLatest: protectedProcedure
    .input(z.object({
      scope: z.enum(["organizacao", "departamento", "cargo"]),
      departmentId: z.number().optional(),
      positionId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [eq(performanceBenchmarks.scope, input.scope)];
      if (input.departmentId) conditions.push(eq(performanceBenchmarks.departmentId, input.departmentId));
      if (input.positionId) conditions.push(eq(performanceBenchmarks.positionId, input.positionId));

      const [benchmark] = await db
        .select()
        .from(performanceBenchmarks)
        .where(and(...conditions))
        .orderBy(desc(performanceBenchmarks.calculatedAt))
        .limit(1);

      return benchmark || null;
    }),

  // Comparar colaborador com benchmark
  compareEmployee: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar colaborador
      const [employee] = await db
        .select({
          id: employees.id,
          name: employees.name,
          departmentId: employees.departmentId,
          positionId: employees.positionId,
          departmentName: departments.name,
          positionTitle: positions.title,
        })
        .from(employees)
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .leftJoin(positions, eq(employees.positionId, positions.id))
        .where(eq(employees.id, input.employeeId))
        .limit(1);

      if (!employee) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Colaborador não encontrado" });
      }

      // Buscar última avaliação do colaborador
      const [evaluation] = await db
        .select()
        .from(avdPerformanceAssessments)
        .where(eq(avdPerformanceAssessments.employeeId, input.employeeId))
        .orderBy(desc(avdPerformanceAssessments.createdAt))
        .limit(1);

      // Buscar benchmarks relevantes
      const benchmarks: Record<string, typeof performanceBenchmarks.$inferSelect | null> = {
        organizacao: null,
        departamento: null,
        cargo: null,
      };

      // Benchmark organizacional
      const [orgBenchmark] = await db
        .select()
        .from(performanceBenchmarks)
        .where(eq(performanceBenchmarks.scope, "organizacao"))
        .orderBy(desc(performanceBenchmarks.calculatedAt))
        .limit(1);
      benchmarks.organizacao = orgBenchmark || null;

      // Benchmark departamental
      if (employee.departmentId) {
        const [deptBenchmark] = await db
          .select()
          .from(performanceBenchmarks)
          .where(and(
            eq(performanceBenchmarks.scope, "departamento"),
            eq(performanceBenchmarks.departmentId, employee.departmentId)
          ))
          .orderBy(desc(performanceBenchmarks.calculatedAt))
          .limit(1);
        benchmarks.departamento = deptBenchmark || null;
      }

      // Benchmark por cargo
      if (employee.positionId) {
        const [posBenchmark] = await db
          .select()
          .from(performanceBenchmarks)
          .where(and(
            eq(performanceBenchmarks.scope, "cargo"),
            eq(performanceBenchmarks.positionId, employee.positionId)
          ))
          .orderBy(desc(performanceBenchmarks.calculatedAt))
          .limit(1);
        benchmarks.cargo = posBenchmark || null;
      }

      // Calcular posição relativa
      const calculatePosition = (score: number | null, benchmark: typeof performanceBenchmarks.$inferSelect | null) => {
        if (!score || !benchmark) return null;
        
        if (benchmark.p90Score && score >= benchmark.p90Score) return "top_10";
        if (benchmark.p75Score && score >= benchmark.p75Score) return "top_25";
        if (benchmark.p50Score && score >= benchmark.p50Score) return "acima_media";
        if (benchmark.p25Score && score >= benchmark.p25Score) return "abaixo_media";
        return "bottom_25";
      };

      return {
        employee: {
          id: employee.id,
          name: employee.name,
          departmentName: employee.departmentName,
          positionTitle: employee.positionTitle,
        },
        evaluation: evaluation ? {
          finalScore: evaluation.finalScore,
          competencyScore: evaluation.competencyScore,
          classification: evaluation.classification,
        } : null,
        benchmarks,
        comparison: {
          vsOrganizacao: calculatePosition(evaluation?.finalScore || null, benchmarks.organizacao),
          vsDepartamento: calculatePosition(evaluation?.finalScore || null, benchmarks.departamento),
          vsCargo: calculatePosition(evaluation?.finalScore || null, benchmarks.cargo),
        },
      };
    }),

  // Ranking de desempenho
  getRanking: protectedProcedure
    .input(z.object({
      scope: z.enum(["organizacao", "departamento", "cargo"]),
      departmentId: z.number().optional(),
      positionId: z.number().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar colaboradores no escopo
      const employeeConditions = [eq(employees.active, true)];
      if (input.scope === "departamento" && input.departmentId) {
        employeeConditions.push(eq(employees.departmentId, input.departmentId));
      }
      if (input.scope === "cargo" && input.positionId) {
        employeeConditions.push(eq(employees.positionId, input.positionId));
      }

      const employeesList = await db
        .select({
          id: employees.id,
          name: employees.name,
          departmentId: employees.departmentId,
          positionId: employees.positionId,
        })
        .from(employees)
        .where(and(...employeeConditions));

      // Para cada colaborador, buscar última avaliação
      const rankings = await Promise.all(
        employeesList.map(async (emp) => {
          const [evaluation] = await db
            .select({
              finalScore: avdPerformanceAssessments.finalScore,
              competencyScore: avdPerformanceAssessments.competencyScore,
              classification: avdPerformanceAssessments.classification,
            })
            .from(avdPerformanceAssessments)
            .where(eq(avdPerformanceAssessments.employeeId, emp.id))
            .orderBy(desc(avdPerformanceAssessments.createdAt))
            .limit(1);

          return {
            employeeId: emp.id,
            employeeName: emp.name,
            finalScore: evaluation?.finalScore || 0,
            competencyScore: evaluation?.competencyScore || 0,
            classification: evaluation?.classification || null,
          };
        })
      );

      // Ordenar por score e adicionar ranking
      const sorted = rankings
        .filter(r => r.finalScore > 0)
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, input.limit)
        .map((r, index) => ({
          ...r,
          rank: index + 1,
        }));

      return sorted;
    }),

  // Alertas de desempenho
  getAlerts: protectedProcedure
    .input(z.object({
      employeeId: z.number().optional(),
      departmentId: z.number().optional(),
      status: z.enum(["aberto", "em_analise", "resolvido", "ignorado"]).optional(),
      severity: z.enum(["info", "warning", "critical"]).optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [];
      if (input.employeeId) conditions.push(eq(performanceAlerts.employeeId, input.employeeId));
      if (input.status) conditions.push(eq(performanceAlerts.status, input.status));
      if (input.severity) conditions.push(eq(performanceAlerts.severity, input.severity));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const alerts = await db
        .select({
          id: performanceAlerts.id,
          employeeId: performanceAlerts.employeeId,
          alertType: performanceAlerts.alertType,
          severity: performanceAlerts.severity,
          title: performanceAlerts.title,
          description: performanceAlerts.description,
          expectedValue: performanceAlerts.expectedValue,
          actualValue: performanceAlerts.actualValue,
          gapValue: performanceAlerts.gapValue,
          status: performanceAlerts.status,
          createdAt: performanceAlerts.createdAt,
          employeeName: employees.name,
        })
        .from(performanceAlerts)
        .leftJoin(employees, eq(performanceAlerts.employeeId, employees.id))
        .where(whereClause)
        .orderBy(desc(performanceAlerts.createdAt))
        .limit(input.limit);

      return alerts;
    }),

  // Criar alerta
  createAlert: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
      cycleId: z.number().optional(),
      alertType: z.enum(["competencia_abaixo_minimo", "meta_atrasada", "desempenho_geral_baixo", "gap_critico", "sem_avaliacao"]),
      severity: z.enum(["info", "warning", "critical"]),
      title: z.string(),
      description: z.string().optional(),
      competencyId: z.number().optional(),
      goalId: z.number().optional(),
      expectedValue: z.number().optional(),
      actualValue: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const gapValue = input.expectedValue && input.actualValue 
        ? input.expectedValue - input.actualValue 
        : null;

      const [result] = await db.insert(performanceAlerts).values({
        employeeId: input.employeeId,
        cycleId: input.cycleId,
        alertType: input.alertType,
        severity: input.severity,
        title: input.title,
        description: input.description,
        competencyId: input.competencyId,
        goalId: input.goalId,
        expectedValue: input.expectedValue,
        actualValue: input.actualValue,
        gapValue,
        status: "aberto",
      });

      return { id: result.insertId, success: true };
    }),

  // Resolver alerta
  resolveAlert: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["resolvido", "ignorado"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(performanceAlerts)
        .set({
          status: input.status,
          resolvedBy: ctx.user.id,
          resolvedAt: new Date(),
          resolutionNotes: input.notes,
        })
        .where(eq(performanceAlerts.id, input.id));

      return { success: true };
    }),
});
