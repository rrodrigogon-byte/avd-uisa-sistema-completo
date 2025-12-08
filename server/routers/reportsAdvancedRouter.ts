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
  nineBoxPositions,
  pdiItems
} from "../../drizzle/schema";
import { eq, and, gte, lte, sql, desc, or, inArray } from "drizzle-orm";
import jsPDF from "jspdf";
import ExcelJS from "exceljs";

/**
 * Router para Relatórios Avançados
 * Geração de relatórios individuais, consolidados e gerais com exportação
 */
export const reportsAdvancedRouter = router({
  /**
   * Gerar relatório individual de colaborador
   */
  generateIndividualReport: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      includeGoals: z.boolean().default(true),
      includePDI: z.boolean().default(true),
      includeEvaluations: z.boolean().default(true),
      includeNineBox: z.boolean().default(true),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar dados do colaborador
      const employeeData = await db
        .select({
          id: employees.id,
          name: employees.name,
          email: employees.email,
          phone: employees.phone,
          positionTitle: positions.title,
          departmentName: departments.name,
          hireDate: employees.hireDate,
          managerId: employees.managerId,
        })
        .from(employees)
        .leftJoin(positions, eq(employees.positionId, positions.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .where(eq(employees.id, input.employeeId))
        .limit(1);

      if (employeeData.length === 0) {
        throw new Error("Colaborador não encontrado");
      }

      const employee = employeeData[0];

      // Buscar avaliações
      let evaluations: any[] = [];
      if (input.includeEvaluations) {
        let evalWhere: any[] = [eq(performanceEvaluations.employeeId, input.employeeId)];

        if (input.startDate && input.endDate) {
          evalWhere.push(
            gte(performanceEvaluations.createdAt, new Date(input.startDate)),
            lte(performanceEvaluations.createdAt, new Date(input.endDate))
          );
        }

        evaluations = await db
          .select({
            id: performanceEvaluations.id,
            cycleId: performanceEvaluations.cycleId,
            cycleName: evaluationCycles.name,
            type: performanceEvaluations.type,
            status: performanceEvaluations.status,
            selfScore: performanceEvaluations.selfScore,
            managerScore: performanceEvaluations.managerScore,
            finalScore: performanceEvaluations.finalScore,
            managerComments: performanceEvaluations.managerComments,
            createdAt: performanceEvaluations.createdAt,
            updatedAt: performanceEvaluations.updatedAt,
          })
          .from(performanceEvaluations)
          .leftJoin(evaluationCycles, eq(performanceEvaluations.cycleId, evaluationCycles.id))
          .where(and(...evalWhere))
          .orderBy(desc(performanceEvaluations.createdAt));
      }

      // Buscar metas
      let goalsData: any[] = [];
      if (input.includeGoals) {
        let goalsWhere: any[] = [eq(goals.employeeId, input.employeeId)];

        if (input.startDate && input.endDate) {
          goalsWhere.push(
            gte(goals.createdAt, new Date(input.startDate)),
            lte(goals.createdAt, new Date(input.endDate))
          );
        }

        goalsData = await db
          .select()
          .from(goals)
          .where(and(...goalsWhere))
          .orderBy(desc(goals.createdAt));
      }

      // Buscar PDIs
      let pdis: any[] = [];
      if (input.includePDI) {
        let pdiWhere: any[] = [eq(pdiPlans.employeeId, input.employeeId)];

        if (input.startDate && input.endDate) {
          pdiWhere.push(
            gte(pdiPlans.createdAt, new Date(input.startDate)),
            lte(pdiPlans.createdAt, new Date(input.endDate))
          );
        }

        pdis = await db
          .select()
          .from(pdiPlans)
          .where(and(...pdiWhere))
          .orderBy(desc(pdiPlans.createdAt));

        // Buscar itens dos PDIs
        for (const pdi of pdis) {
          const items = await db
            .select()
            .from(pdiItems)
            .where(eq(pdiItems.planId, pdi.id));
          pdi.items = items;
        }
      }

      // Buscar posição Nine Box
      let nineBox: any = null;
      if (input.includeNineBox) {
        const nineBoxData = await db
          .select()
          .from(nineBoxPositions)
          .where(eq(nineBoxPositions.employeeId, input.employeeId))
          .limit(1);

        if (nineBoxData.length > 0) {
          nineBox = nineBoxData[0];
        }
      }

      // Calcular estatísticas
      const avgEvaluationScore = evaluations.length > 0
        ? evaluations.reduce((sum, e) => sum + (e.finalScore || 0), 0) / evaluations.length
        : 0;

      const completedGoals = goalsData.filter(g => g.status === 'concluida').length;
      const totalGoals = goalsData.length;
      const goalsCompletionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

      const completedPDIs = pdis.filter(p => p.status === 'concluido').length;
      const totalPDIs = pdis.length;

      return {
        employee,
        evaluations,
        goals: goalsData,
        pdis,
        nineBox,
        statistics: {
          avgEvaluationScore,
          totalEvaluations: evaluations.length,
          completedGoals,
          totalGoals,
          goalsCompletionRate,
          completedPDIs,
          totalPDIs,
        },
      };
    }),

  /**
   * Gerar relatório consolidado por departamento
   */
  generateDepartmentReport: protectedProcedure
    .input(z.object({
      departmentId: z.number(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar dados do departamento
      const departmentData = await db
        .select()
        .from(departments)
        .where(eq(departments.id, input.departmentId))
        .limit(1);

      if (departmentData.length === 0) {
        throw new Error("Departamento não encontrado");
      }

      const department = departmentData[0];

      // Buscar colaboradores do departamento
      const employeesData = await db
        .select({
          id: employees.id,
          name: employees.name,
          positionTitle: positions.title,
          hireDate: employees.hireDate,
        })
        .from(employees)
        .leftJoin(positions, eq(employees.positionId, positions.id))
        .where(eq(employees.departmentId, input.departmentId));

      const employeeIds = employeesData.map(e => e.id);

      if (employeeIds.length === 0) {
        return {
          department,
          employees: [],
          statistics: {
            totalEmployees: 0,
            avgPerformance: 0,
            totalGoals: 0,
            completedGoals: 0,
            goalsCompletionRate: 0,
            activePDIs: 0,
          },
          performanceDistribution: [],
          topPerformers: [],
        };
      }

      // Buscar avaliações
      let evalQuery = db
        .select({
          employeeId: performanceEvaluations.employeeId,
          finalScore: performanceEvaluations.finalScore,
        })
        .from(performanceEvaluations)
        .where(
          and(
            inArray(performanceEvaluations.employeeId, employeeIds),
            eq(performanceEvaluations.status, 'concluida')
          )
        );

      if (input.startDate && input.endDate) {
        evalQuery = evalQuery.where(
          and(
            gte(performanceEvaluations.createdAt, new Date(input.startDate)),
            lte(performanceEvaluations.createdAt, new Date(input.endDate))
          )
        );
      }

      const evaluations = await evalQuery;

      // Buscar metas
      let goalsQuery = db
        .select({
          status: goals.status,
        })
        .from(goals)
        .where(inArray(goals.employeeId, employeeIds));

      if (input.startDate && input.endDate) {
        goalsQuery = goalsQuery.where(
          and(
            gte(goals.createdAt, new Date(input.startDate)),
            lte(goals.createdAt, new Date(input.endDate))
          )
        );
      }

      const goalsData = await goalsQuery;

      // Buscar PDIs
      const pdisData = await db
        .select({
          status: pdiPlans.status,
        })
        .from(pdiPlans)
        .where(inArray(pdiPlans.employeeId, employeeIds));

      // Calcular estatísticas
      const avgPerformance = evaluations.length > 0
        ? evaluations.reduce((sum, e) => sum + (e.finalScore || 0), 0) / evaluations.length
        : 0;

      const completedGoals = goalsData.filter(g => g.status === 'concluida').length;
      const totalGoals = goalsData.length;
      const goalsCompletionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

      const activePDIs = pdisData.filter(p => p.status === 'em_andamento').length;

      // Distribuição de performance
      const performanceByEmployee = new Map<number, number[]>();
      evaluations.forEach(e => {
        if (!performanceByEmployee.has(e.employeeId)) {
          performanceByEmployee.set(e.employeeId, []);
        }
        performanceByEmployee.get(e.employeeId)!.push(e.finalScore || 0);
      });

      const employeeAvgScores = Array.from(performanceByEmployee.entries()).map(([employeeId, scores]) => ({
        employeeId,
        avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      }));

      const topPerformers = employeeAvgScores
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 10)
        .map(ep => {
          const emp = employeesData.find(e => e.id === ep.employeeId);
          return {
            ...emp,
            avgScore: ep.avgScore,
          };
        });

      // Distribuição por faixas
      const distribution = [
        { range: '90-100', count: 0 },
        { range: '75-89', count: 0 },
        { range: '60-74', count: 0 },
        { range: '0-59', count: 0 },
      ];

      employeeAvgScores.forEach(({ avgScore }) => {
        if (avgScore >= 90) distribution[0].count++;
        else if (avgScore >= 75) distribution[1].count++;
        else if (avgScore >= 60) distribution[2].count++;
        else distribution[3].count++;
      });

      return {
        department,
        employees: employeesData,
        statistics: {
          totalEmployees: employeesData.length,
          avgPerformance,
          totalGoals,
          completedGoals,
          goalsCompletionRate,
          activePDIs,
        },
        performanceDistribution: distribution,
        topPerformers,
      };
    }),

  /**
   * Gerar relatório geral da organização
   */
  generateOrganizationReport: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar todos os departamentos
      const departmentsData = await db.select().from(departments);

      // Buscar todos os colaboradores
      const employeesData = await db
        .select({
          id: employees.id,
          name: employees.name,
          departmentId: employees.departmentId,
        })
        .from(employees);

      const employeeIds = employeesData.map(e => e.id);

      // Buscar avaliações
      let evalWhere2: any[] = [
        inArray(performanceEvaluations.employeeId, employeeIds),
        eq(performanceEvaluations.status, 'concluida')
      ];

      if (input.startDate && input.endDate) {
        evalWhere2.push(
          gte(performanceEvaluations.createdAt, new Date(input.startDate)),
          lte(performanceEvaluations.createdAt, new Date(input.endDate))
        );
      }

      const evaluations = await db
        .select({
          employeeId: performanceEvaluations.employeeId,
          finalScore: performanceEvaluations.finalScore,
        })
        .from(performanceEvaluations)
        .where(and(...evalWhere2));

      // Buscar metas
      let goalsWhere2: any[] = [inArray(goals.employeeId, employeeIds)];

      if (input.startDate && input.endDate) {
        goalsWhere2.push(
          gte(goals.createdAt, new Date(input.startDate)),
          lte(goals.createdAt, new Date(input.endDate))
        );
      }

      const goalsData = await db
        .select({
          employeeId: goals.employeeId,
          status: goals.status,
        })
        .from(goals)
        .where(and(...goalsWhere2));

      // Buscar PDIs
      const pdisData = await db
        .select({
          status: pdiPlans.status,
        })
        .from(pdiPlans)
        .where(inArray(pdiPlans.employeeId, employeeIds));

      // Estatísticas gerais
      const avgPerformance = evaluations.length > 0
        ? evaluations.reduce((sum, e) => sum + (e.finalScore || 0), 0) / evaluations.length
        : 0;

      const completedGoals = goalsData.filter(g => g.status === 'concluida').length;
      const totalGoals = goalsData.length;
      const goalsCompletionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

      const activePDIs = pdisData.filter(p => p.status === 'em_andamento').length;
      const completedPDIs = pdisData.filter(p => p.status === 'concluido').length;

      // Performance por departamento
      const performanceByDept = new Map<number, { scores: number[]; name: string }>();
      
      for (const dept of departmentsData) {
        performanceByDept.set(dept.id, { scores: [], name: dept.name });
      }

      evaluations.forEach(e => {
        const emp = employeesData.find(emp => emp.id === e.employeeId);
        if (emp && emp.departmentId && performanceByDept.has(emp.departmentId)) {
          performanceByDept.get(emp.departmentId)!.scores.push(e.finalScore || 0);
        }
      });

      const departmentPerformance = Array.from(performanceByDept.entries())
        .map(([deptId, data]) => ({
          departmentId: deptId,
          departmentName: data.name,
          avgScore: data.scores.length > 0
            ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length
            : 0,
          employeeCount: employeesData.filter(e => e.departmentId === deptId).length,
        }))
        .filter(d => d.employeeCount > 0)
        .sort((a, b) => b.avgScore - a.avgScore);

      return {
        statistics: {
          totalEmployees: employeesData.length,
          totalDepartments: departmentsData.length,
          avgPerformance,
          totalEvaluations: evaluations.length,
          totalGoals,
          completedGoals,
          goalsCompletionRate,
          activePDIs,
          completedPDIs,
        },
        departmentPerformance,
      };
    }),

  /**
   * Listar histórico de relatórios gerados
   */
  listReportHistory: protectedProcedure
    .input(z.object({
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // TODO: Implementar tabela de histórico de relatórios
      // Por enquanto, retornar array vazio
      return {
        reports: [],
        total: 0,
      };
    }),
});
