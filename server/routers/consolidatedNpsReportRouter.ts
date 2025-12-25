import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { generateConsolidatedReport } from "../services/consolidatedReportService";
import { getDb } from "../db";
import { 
  npsResponses, 
  npsSurveys, 
  performanceEvaluations, 
  pirAssessments,
  avdAssessmentProcesses,
  employees,
  departments
} from "../../drizzle/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

export const consolidatedNpsReportRouter = router({
  /**
   * Gerar relatório consolidado completo
   */
  generateReport: adminProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      departmentId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      return await generateConsolidatedReport(
        input.startDate,
        input.endDate,
        input.departmentId
      );
    }),

  /**
   * Obter resumo rápido para dashboard
   */
  getDashboardSummary: protectedProcedure.input(z.object({}).optional()).query(async () => {
    const db = await getDb();
    if (!db) return null;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // NPS
    const npsResps = await db.select()
      .from(npsResponses)
      .where(gte(npsResponses.createdAt, thirtyDaysAgo));

    const promoters = npsResps.filter(r => r.category === "promoter").length;
    const detractors = npsResps.filter(r => r.category === "detractor").length;
    const npsScore = npsResps.length > 0 
      ? Math.round(((promoters - detractors) / npsResps.length) * 100)
      : 0;

    // Processos
    const processes = await db.select()
      .from(avdAssessmentProcesses)
      .where(gte(avdAssessmentProcesses.createdAt, thirtyDaysAgo));

    const completedProcesses = processes.filter(p => p.status === "concluido").length;
    const completionRate = processes.length > 0 
      ? Math.round((completedProcesses / processes.length) * 100)
      : 0;

    // PIR
    const pirAssess = await db.select()
      .from(pirAssessments)
      .where(gte(pirAssessments.createdAt, thirtyDaysAgo));

    const avgIntegrityScore = pirAssess.length > 0
      ? Math.round(pirAssess.reduce((acc, a) => acc + (a.totalScore || 0), 0) / pirAssess.length)
      : 0;

    // Performance
    const perfEvals = await db.select()
      .from(performanceEvaluations)
      .where(gte(performanceEvaluations.createdAt, thirtyDaysAgo));

    const avgPerformanceScore = perfEvals.length > 0
      ? Math.round(perfEvals.reduce((acc, e) => acc + (e.overallScore || 0), 0) / perfEvals.length)
      : 0;

    return {
      npsScore,
      npsResponses: npsResps.length,
      completionRate,
      totalProcesses: processes.length,
      avgIntegrityScore,
      pirAssessments: pirAssess.length,
      avgPerformanceScore,
      performanceEvaluations: perfEvals.length,
      period: "Últimos 30 dias",
    };
  }),

  /**
   * Cruzar dados de NPS com performance individual
   */
  getNpsPerformanceCorrelation: adminProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const periodStart = input.startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const periodEnd = input.endDate || new Date();

      // Buscar funcionários com NPS e performance
      const employeesData = await db.select({
        employeeId: employees.id,
        employeeName: employees.name,
        departmentId: employees.departmentId,
      })
      .from(employees)
      .where(eq(employees.active, true));

      const correlationData = await Promise.all(employeesData.map(async (emp) => {
        // NPS do funcionário
        const npsResps = await db.select()
          .from(npsResponses)
          .where(and(
            eq(npsResponses.employeeId, emp.employeeId),
            gte(npsResponses.createdAt, periodStart),
            lte(npsResponses.createdAt, periodEnd)
          ));

        const avgNpsScore = npsResps.length > 0
          ? Math.round(npsResps.reduce((acc, r) => acc + r.score, 0) / npsResps.length * 10) / 10
          : null;

        // Performance do funcionário
        const perfEvals = await db.select()
          .from(performanceEvaluations)
          .where(and(
            eq(performanceEvaluations.employeeId, emp.employeeId),
            gte(performanceEvaluations.createdAt, periodStart),
            lte(performanceEvaluations.createdAt, periodEnd)
          ));

        const avgPerformanceScore = perfEvals.length > 0
          ? Math.round(perfEvals.reduce((acc, e) => acc + (e.overallScore || 0), 0) / perfEvals.length)
          : null;

        // PIR do funcionário
        const pirAssess = await db.select()
          .from(pirAssessments)
          .where(and(
            eq(pirAssessments.employeeId, emp.employeeId),
            gte(pirAssessments.createdAt, periodStart),
            lte(pirAssessments.createdAt, periodEnd)
          ));

        const avgIntegrityScore = pirAssess.length > 0
          ? Math.round(pirAssess.reduce((acc, a) => acc + (a.totalScore || 0), 0) / pirAssess.length)
          : null;

        return {
          ...emp,
          avgNpsScore,
          avgPerformanceScore,
          avgIntegrityScore,
          hasData: avgNpsScore !== null || avgPerformanceScore !== null || avgIntegrityScore !== null,
        };
      }));

      return correlationData.filter(d => d.hasData);
    }),

  /**
   * Verificar integridade do PIR
   */
  checkPirIntegrity: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    // Buscar todas as avaliações PIR
    const allAssessments = await db.select().from(pirAssessments);
    const completedAssessments = allAssessments.filter(a => a.status === "concluida");
    const pendingAssessments = allAssessments.filter(a => a.status !== "concluida");

    // Buscar questões
    const { pirQuestions, pirAnswers } = await import("../../drizzle/schema");
    const questions = await db.select().from(pirQuestions);
    const answers = await db.select().from(pirAnswers);

    // Verificar questões sem respostas
    const questionsWithoutAnswers = questions.filter(q => 
      !answers.some(a => a.questionId === q.id)
    );

    // Verificar dimensões
    const dimensions = ["IP", "ID", "IC", "ES", "FL", "AU"];
    const dimensionStatus = dimensions.map(dim => {
      const dimQuestions = questions.filter(q => q.dimension === dim);
      const dimAnswers = answers.filter(a => dimQuestions.some(q => q.id === a.questionId));
      
      return {
        dimension: dim,
        totalQuestions: dimQuestions.length,
        answeredQuestions: new Set(dimAnswers.map(a => a.questionId)).size,
        totalAnswers: dimAnswers.length,
        coverage: dimQuestions.length > 0 
          ? Math.round((new Set(dimAnswers.map(a => a.questionId)).size / dimQuestions.length) * 100)
          : 0,
      };
    });

    // Identificar problemas
    const issues: { severity: "high" | "medium" | "low"; message: string }[] = [];

    if (questionsWithoutAnswers.length > 0) {
      issues.push({
        severity: "medium",
        message: `${questionsWithoutAnswers.length} questões nunca foram respondidas`,
      });
    }

    dimensionStatus.forEach(ds => {
      if (ds.coverage < 50 && ds.totalQuestions > 0) {
        issues.push({
          severity: "high",
          message: `Dimensão ${ds.dimension} tem apenas ${ds.coverage}% de cobertura`,
        });
      }
    });

    if (pendingAssessments.length > completedAssessments.length) {
      issues.push({
        severity: "medium",
        message: `${pendingAssessments.length} avaliações pendentes vs ${completedAssessments.length} concluídas`,
      });
    }

    // Verificar avaliações com score muito baixo
    const lowScoreAssessments = completedAssessments.filter(a => (a.totalScore || 0) < 30);
    if (lowScoreAssessments.length > 0) {
      issues.push({
        severity: "high",
        message: `${lowScoreAssessments.length} avaliações com score abaixo de 30%`,
      });
    }

    return {
      summary: {
        totalAssessments: allAssessments.length,
        completedAssessments: completedAssessments.length,
        pendingAssessments: pendingAssessments.length,
        totalQuestions: questions.length,
        totalAnswers: answers.length,
        questionsWithoutAnswers: questionsWithoutAnswers.length,
      },
      dimensionStatus,
      issues,
      integrityScore: issues.length === 0 ? 100 : Math.max(0, 100 - (issues.length * 15)),
    };
  }),

  /**
   * Exportar relatório consolidado
   */
  exportReport: adminProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      format: z.enum(["json", "csv"]).default("json"),
    }))
    .mutation(async ({ input }) => {
      const report = await generateConsolidatedReport(input.startDate, input.endDate);

      if (input.format === "csv") {
        // Gerar CSV simplificado
        const csvLines = [
          "Métrica,Valor",
          `Total de Processos,${report.summary.totalProcesses}`,
          `Processos Concluídos,${report.summary.completedProcesses}`,
          `Taxa de Conclusão,${report.summary.completionRate}%`,
          `Score NPS,${report.npsAnalysis.npsScore}`,
          `Total Respostas NPS,${report.npsAnalysis.totalResponses}`,
          `Promotores,${report.npsAnalysis.promoters}`,
          `Neutros,${report.npsAnalysis.passives}`,
          `Detratores,${report.npsAnalysis.detractors}`,
          `Score Médio Performance,${report.summary.avgPerformanceScore}`,
          `Score Médio Integridade,${report.pirIntegrity.avgIntegrityScore}`,
          `Avaliações PIR Concluídas,${report.pirIntegrity.completedAssessments}`,
          `Avaliações PIR Pendentes,${report.pirIntegrity.pendingAssessments}`,
        ];

        return {
          format: "csv",
          content: csvLines.join("\n"),
          filename: `relatorio-consolidado-${new Date().toISOString().split("T")[0]}.csv`,
        };
      }

      return {
        format: "json",
        content: JSON.stringify(report, null, 2),
        filename: `relatorio-consolidado-${new Date().toISOString().split("T")[0]}.json`,
      };
    }),

  /**
   * Obter tendências ao longo do tempo
   */
  getTrends: adminProcedure
    .input(z.object({
      months: z.number().min(1).max(12).default(6),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const trends = [];
      const now = new Date();

      for (let i = input.months - 1; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

        // NPS do mês
        const npsResps = await db.select()
          .from(npsResponses)
          .where(and(
            gte(npsResponses.createdAt, monthStart),
            lte(npsResponses.createdAt, monthEnd)
          ));

        const promoters = npsResps.filter(r => r.category === "promoter").length;
        const detractors = npsResps.filter(r => r.category === "detractor").length;
        const npsScore = npsResps.length > 0 
          ? Math.round(((promoters - detractors) / npsResps.length) * 100)
          : 0;

        // Processos do mês
        const processes = await db.select()
          .from(avdAssessmentProcesses)
          .where(and(
            gte(avdAssessmentProcesses.createdAt, monthStart),
            lte(avdAssessmentProcesses.createdAt, monthEnd)
          ));

        const completedProcesses = processes.filter(p => p.status === "concluido").length;
        const completionRate = processes.length > 0 
          ? Math.round((completedProcesses / processes.length) * 100)
          : 0;

        // PIR do mês
        const pirAssess = await db.select()
          .from(pirAssessments)
          .where(and(
            gte(pirAssessments.createdAt, monthStart),
            lte(pirAssessments.createdAt, monthEnd)
          ));

        const avgIntegrityScore = pirAssess.length > 0
          ? Math.round(pirAssess.reduce((acc, a) => acc + (a.totalScore || 0), 0) / pirAssess.length)
          : 0;

        trends.push({
          month: monthStart.toLocaleDateString("pt-BR", { month: "short", year: "numeric" }),
          monthStart,
          npsScore,
          npsResponses: npsResps.length,
          completionRate,
          totalProcesses: processes.length,
          avgIntegrityScore,
          pirAssessments: pirAssess.length,
        });
      }

      return trends;
    }),
});
