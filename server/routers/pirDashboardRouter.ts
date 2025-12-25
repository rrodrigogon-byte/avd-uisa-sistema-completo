import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { 
  pirAssessments, 
  pirAnswers,
  pirQuestions,
  employees,
  departments,
  positions,
  evaluationCycles
} from "../../drizzle/schema";
import { eq, and, sql, desc, gte, lte, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Router para Dashboard PIR
 * Fornece estatísticas e análises consolidadas das avaliações PIR
 */

export const pirDashboardRouter = router({
  /**
   * Buscar estatísticas gerais do PIR
   */
  getStats: protectedProcedure
    .input(z.object({
      cycleId: z.number().optional(),
      departmentId: z.number().optional(),
      positionId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Construir condições de filtro
      const conditions = [];
      if (input.cycleId) conditions.push(eq(pirAssessments.cycleId, input.cycleId));
      if (input.startDate) conditions.push(gte(pirAssessments.completedAt, new Date(input.startDate)));
      if (input.endDate) conditions.push(lte(pirAssessments.completedAt, new Date(input.endDate)));

      // Buscar avaliações PIR concluídas
      let query = db
        .select({
          assessmentId: pirAssessments.id,
          employeeId: pirAssessments.employeeId,
          overallScore: pirAssessments.overallScore,
          completedAt: pirAssessments.completedAt,
          departmentId: employees.departmentId,
          positionId: employees.positionId,
        })
        .from(pirAssessments)
        .leftJoin(employees, eq(pirAssessments.employeeId, employees.id))
        .where(and(
          eq(pirAssessments.status, "concluida"),
          ...conditions
        ));

      const assessments = await query.orderBy(desc(pirAssessments.completedAt));

      // Aplicar filtros adicionais
      let filteredAssessments = assessments;
      if (input.departmentId) {
        filteredAssessments = filteredAssessments.filter(a => a.departmentId === input.departmentId);
      }
      if (input.positionId) {
        filteredAssessments = filteredAssessments.filter(a => a.positionId === input.positionId);
      }

      // Calcular estatísticas
      const totalAssessments = filteredAssessments.length;
      const avgScore = totalAssessments > 0
        ? filteredAssessments.reduce((sum, a) => sum + (a.overallScore || 0), 0) / totalAssessments
        : 0;

      // Distribuição por faixa de desempenho
      const scoreRanges = {
        excepcional: filteredAssessments.filter(a => (a.overallScore || 0) >= 90).length,
        supera: filteredAssessments.filter(a => (a.overallScore || 0) >= 75 && (a.overallScore || 0) < 90).length,
        atende: filteredAssessments.filter(a => (a.overallScore || 0) >= 60 && (a.overallScore || 0) < 75).length,
        abaixo: filteredAssessments.filter(a => (a.overallScore || 0) < 60).length,
      };

      return {
        totalAssessments,
        avgScore: Math.round(avgScore * 10) / 10,
        scoreRanges,
        assessments: filteredAssessments,
      };
    }),

  /**
   * Buscar distribuição de notas por dimensão PIR
   */
  getDimensionDistribution: protectedProcedure
    .input(z.object({
      cycleId: z.number().optional(),
      departmentId: z.number().optional(),
      positionId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Construir condições de filtro
      const conditions = [eq(pirAssessments.status, "concluida")];
      if (input.cycleId) conditions.push(eq(pirAssessments.cycleId, input.cycleId));

      // Buscar avaliações PIR concluídas com respostas
      const assessmentsData = await db
        .select({
          assessmentId: pirAssessments.id,
          employeeId: pirAssessments.employeeId,
          departmentId: employees.departmentId,
          positionId: employees.positionId,
        })
        .from(pirAssessments)
        .leftJoin(employees, eq(pirAssessments.employeeId, employees.id))
        .where(and(...conditions));

      // Aplicar filtros adicionais
      let filteredAssessments = assessmentsData;
      if (input.departmentId) {
        filteredAssessments = filteredAssessments.filter(a => a.departmentId === input.departmentId);
      }
      if (input.positionId) {
        filteredAssessments = filteredAssessments.filter(a => a.positionId === input.positionId);
      }

      // Buscar respostas de todas as avaliações filtradas
      const assessmentIds = filteredAssessments.map(a => a.assessmentId);
      
      if (assessmentIds.length === 0) {
        return {
          IP: 0, ID: 0, IC: 0, ES: 0, FL: 0, AU: 0
        };
      }

      const answers = await db
        .select({
          assessmentId: pirAnswers.assessmentId,
          questionId: pirAnswers.questionId,
          answer: pirAnswers.answer,
          dimension: pirQuestions.dimension,
        })
        .from(pirAnswers)
        .leftJoin(pirQuestions, eq(pirAnswers.questionId, pirQuestions.id))
        .where(inArray(pirAnswers.assessmentId, assessmentIds));

      // Calcular média por dimensão
      const dimensionScores: Record<string, number[]> = {
        IP: [], ID: [], IC: [], ES: [], FL: [], AU: []
      };

      // Agrupar respostas por avaliação
      const answersByAssessment: Record<number, typeof answers> = {};
      answers.forEach(answer => {
        if (!answersByAssessment[answer.assessmentId]) {
          answersByAssessment[answer.assessmentId] = [];
        }
        answersByAssessment[answer.assessmentId].push(answer);
      });

      // Calcular média por dimensão para cada avaliação
      if (!answersByAssessment || Object.keys(answersByAssessment).length === 0) {
        return {
          IP: 0, ID: 0, IC: 0, ES: 0, FL: 0, AU: 0
        };
      }

      Object.values(answersByAssessment).forEach(assessmentAnswers => {
        const dimensionSums: Record<string, { sum: number; count: number }> = {
          IP: { sum: 0, count: 0 },
          ID: { sum: 0, count: 0 },
          IC: { sum: 0, count: 0 },
          ES: { sum: 0, count: 0 },
          FL: { sum: 0, count: 0 },
          AU: { sum: 0, count: 0 },
        };

        assessmentAnswers.forEach(answer => {
          const dimension = answer.dimension || '';
          if (dimension in dimensionSums) {
            dimensionSums[dimension].sum += answer.answer || 0;
            dimensionSums[dimension].count += 1;
          }
        });

        // Adicionar médias às listas de scores
        Object.entries(dimensionSums).forEach(([dim, data]) => {
          if (data.count > 0) {
            dimensionScores[dim].push(data.sum / data.count);
          }
        });
      });

      // Calcular média geral de cada dimensão
      const avgDimensionScores: Record<string, number> = {
        IP: 0, ID: 0, IC: 0, ES: 0, FL: 0, AU: 0
      };
      Object.entries(dimensionScores).forEach(([dim, scores]) => {
        avgDimensionScores[dim] = scores.length > 0
          ? Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10) / 10
          : 0;
      });

      return avgDimensionScores;
    }),

  /**
   * Buscar evolução temporal das avaliações PIR
   */
  getTemporalEvolution: protectedProcedure
    .input(z.object({
      employeeId: z.number().optional(),
      departmentId: z.number().optional(),
      months: z.number().default(12),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Calcular data limite
      const limitDate = new Date();
      limitDate.setMonth(limitDate.getMonth() - input.months);

      // Construir condições de filtro
      const conditions = [
        eq(pirAssessments.status, "concluida"),
        gte(pirAssessments.completedAt, limitDate)
      ];
      if (input.employeeId) conditions.push(eq(pirAssessments.employeeId, input.employeeId));

      // Buscar avaliações PIR do período
      let query = db
        .select({
          assessmentId: pirAssessments.id,
          employeeId: pirAssessments.employeeId,
          overallScore: pirAssessments.overallScore,
          completedAt: pirAssessments.completedAt,
          departmentId: employees.departmentId,
        })
        .from(pirAssessments)
        .leftJoin(employees, eq(pirAssessments.employeeId, employees.id))
        .where(and(...conditions));

      const assessments = await query.orderBy(pirAssessments.completedAt);

      // Aplicar filtro de departamento
      let filteredAssessments = assessments;
      if (input.departmentId) {
        filteredAssessments = filteredAssessments.filter(a => a.departmentId === input.departmentId);
      }

      // Agrupar por mês
      const monthlyData: Record<string, { count: number; totalScore: number }> = {};
      
      filteredAssessments.forEach(assessment => {
        if (!assessment.completedAt) return;
        
        const monthKey = new Date(assessment.completedAt).toISOString().substring(0, 7); // YYYY-MM
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { count: 0, totalScore: 0 };
        }
        
        monthlyData[monthKey].count += 1;
        monthlyData[monthKey].totalScore += assessment.overallScore || 0;
      });

      // Formatar dados para gráfico
      const evolution = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          avgScore: Math.round((data.totalScore / data.count) * 10) / 10,
          count: data.count,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // Sempre retornar array, mesmo vazio
      return evolution || [];
    }),

  /**
   * Buscar lista de ciclos disponíveis
   */
  listCycles: protectedProcedure.input(z.object({}).optional()).query(async () => {
    const db = await getDb();
    if (!db) return [];

    const cycles = await db
      .select()
      .from(evaluationCycles)
      .orderBy(desc(evaluationCycles.createdAt));

    return cycles;
  }),

  /**
   * Buscar lista de departamentos
   */
  listDepartments: protectedProcedure.input(z.object({}).optional()).query(async () => {
    const db = await getDb();
    if (!db) return [];

    const depts = await db
      .select()
      .from(departments)
      .orderBy(departments.name);

    return depts;
  }),

  /**
   * Buscar lista de cargos
   */
  listPositions: protectedProcedure.input(z.object({}).optional()).query(async () => {
    const db = await getDb();
    if (!db) return [];

    const pos = await db
      .select()
      .from(positions)
      .orderBy(positions.title);

    return pos;
  }),

  /**
   * Exportar relatório em PDF
   */
  exportPDF: protectedProcedure
    .input(z.object({
      cycleId: z.number().optional(),
      departmentId: z.number().optional(),
      positionId: z.number().optional(),
    }).optional())
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar dados para o relatório (reutilizar lógica de getStats)
      const conditions = [];
      if (input.cycleId) conditions.push(eq(pirAssessments.cycleId, input.cycleId));

      let query = db
        .select({
          assessmentId: pirAssessments.id,
          employeeId: pirAssessments.employeeId,
          employeeName: employees.name,
          employeeCode: employees.employeeCode,
          departmentName: departments.name,
          positionName: positions.name,
          overallScore: pirAssessments.overallScore,
          completedAt: pirAssessments.completedAt,
        })
        .from(pirAssessments)
        .leftJoin(employees, eq(pirAssessments.employeeId, employees.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .leftJoin(positions, eq(employees.positionId, positions.id))
        .where(and(
          eq(pirAssessments.status, "concluida"),
          ...conditions
        ));

      const assessments = await query.orderBy(desc(pirAssessments.completedAt));

      // Aplicar filtros adicionais
      let filteredAssessments = assessments;
      if (input.departmentId) {
        filteredAssessments = filteredAssessments.filter(a => a.departmentName);
      }
      if (input.positionId) {
        filteredAssessments = filteredAssessments.filter(a => a.positionName);
      }

      // Retornar dados formatados para PDF
      return {
        success: true,
        data: filteredAssessments,
        totalAssessments: filteredAssessments.length,
        avgScore: filteredAssessments.length > 0
          ? filteredAssessments.reduce((sum, a) => sum + (a.overallScore || 0), 0) / filteredAssessments.length
          : 0,
      };
    }),
});
