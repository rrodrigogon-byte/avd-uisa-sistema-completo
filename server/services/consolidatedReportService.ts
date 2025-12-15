import { getDb } from "../db";
import { 
  npsResponses, 
  npsSurveys,
  avdAssessmentProcesses, 
  employees, 
  departments,
  performanceEvaluations,
  pirAssessments,
  pirAnswers,
  pirQuestions,
  avdCompetencyAssessments
} from "../../drizzle/schema";
import { eq, and, desc, gte, lte, sql, count, isNull, isNotNull } from "drizzle-orm";

/**
 * Serviço de Relatório Consolidado
 * Cruza dados de NPS com resultados de avaliação e verifica integridade do PIR
 */

export interface ConsolidatedReportData {
  summary: ReportSummary;
  npsAnalysis: NPSAnalysis;
  performanceCorrelation: PerformanceCorrelation;
  pirIntegrity: PIRIntegrityReport;
  departmentBreakdown: DepartmentBreakdown[];
  recommendations: string[];
}

export interface ReportSummary {
  totalProcesses: number;
  completedProcesses: number;
  completionRate: number;
  avgNpsScore: number;
  avgPerformanceScore: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface NPSAnalysis {
  totalResponses: number;
  npsScore: number;
  promoters: number;
  passives: number;
  detractors: number;
  promoterPercent: number;
  passivePercent: number;
  detractorPercent: number;
  avgResponseTime: number;
  topComments: { category: string; comment: string; score: number }[];
}

export interface PerformanceCorrelation {
  highPerformersNps: number;
  mediumPerformersNps: number;
  lowPerformersNps: number;
  correlationCoefficient: number;
  insight: string;
}

export interface PIRIntegrityReport {
  totalAssessments: number;
  completedAssessments: number;
  pendingAssessments: number;
  avgIntegrityScore: number;
  dimensionScores: {
    dimension: string;
    avgScore: number;
    questionsAnswered: number;
    totalQuestions: number;
  }[];
  riskAlerts: {
    level: "high" | "medium" | "low";
    count: number;
    description: string;
  }[];
  missingData: {
    type: string;
    count: number;
    description: string;
  }[];
}

export interface DepartmentBreakdown {
  departmentId: number;
  departmentName: string;
  processCount: number;
  completionRate: number;
  avgNpsScore: number;
  avgPerformanceScore: number;
  avgIntegrityScore: number;
}

/**
 * Gerar relatório consolidado completo
 */
export async function generateConsolidatedReport(
  startDate?: Date,
  endDate?: Date,
  departmentId?: number
): Promise<ConsolidatedReportData> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database não disponível");
  }

  const periodStart = startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const periodEnd = endDate || new Date();

  // Buscar dados base
  const [summary, npsAnalysis, performanceCorrelation, pirIntegrity, departmentBreakdown] = await Promise.all([
    generateSummary(db, periodStart, periodEnd, departmentId),
    generateNPSAnalysis(db, periodStart, periodEnd, departmentId),
    generatePerformanceCorrelation(db, periodStart, periodEnd, departmentId),
    generatePIRIntegrityReport(db, periodStart, periodEnd, departmentId),
    generateDepartmentBreakdown(db, periodStart, periodEnd),
  ]);

  // Gerar recomendações baseadas nos dados
  const recommendations = generateRecommendations(summary, npsAnalysis, performanceCorrelation, pirIntegrity);

  return {
    summary,
    npsAnalysis,
    performanceCorrelation,
    pirIntegrity,
    departmentBreakdown,
    recommendations,
  };
}

async function generateSummary(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  periodStart: Date,
  periodEnd: Date,
  departmentId?: number
): Promise<ReportSummary> {
  // Buscar processos
  let processQuery = db.select()
    .from(avdAssessmentProcesses)
    .leftJoin(employees, eq(avdAssessmentProcesses.employeeId, employees.id))
    .where(and(
      gte(avdAssessmentProcesses.createdAt, periodStart),
      lte(avdAssessmentProcesses.createdAt, periodEnd)
    ));

  const processes = await processQuery;
  
  const filteredProcesses = departmentId 
    ? processes.filter(p => p.employees?.departmentId === departmentId)
    : processes;

  const totalProcesses = filteredProcesses.length;
  const completedProcesses = filteredProcesses.filter(p => p.avdAssessmentProcesses.status === "concluido").length;
  const completionRate = totalProcesses > 0 ? Math.round((completedProcesses / totalProcesses) * 100) : 0;

  // Buscar NPS médio
  const npsResponses_ = await db.select()
    .from(npsResponses)
    .where(and(
      gte(npsResponses.createdAt, periodStart),
      lte(npsResponses.createdAt, periodEnd)
    ));

  const avgNpsScore = npsResponses_.length > 0
    ? Math.round(npsResponses_.reduce((acc, r) => acc + r.score, 0) / npsResponses_.length * 10) / 10
    : 0;

  // Buscar performance média
  const perfEvals = await db.select()
    .from(performanceEvaluations)
    .where(and(
      gte(performanceEvaluations.createdAt, periodStart),
      lte(performanceEvaluations.createdAt, periodEnd)
    ));

  const avgPerformanceScore = perfEvals.length > 0
    ? Math.round(perfEvals.reduce((acc, e) => acc + (e.overallScore || 0), 0) / perfEvals.length * 10) / 10
    : 0;

  return {
    totalProcesses,
    completedProcesses,
    completionRate,
    avgNpsScore,
    avgPerformanceScore,
    periodStart,
    periodEnd,
  };
}

async function generateNPSAnalysis(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  periodStart: Date,
  periodEnd: Date,
  departmentId?: number
): Promise<NPSAnalysis> {
  const responses = await db.select()
    .from(npsResponses)
    .where(and(
      gte(npsResponses.createdAt, periodStart),
      lte(npsResponses.createdAt, periodEnd)
    ))
    .orderBy(desc(npsResponses.createdAt));

  const totalResponses = responses.length;
  const promoters = responses.filter(r => r.category === "promoter").length;
  const passives = responses.filter(r => r.category === "passive").length;
  const detractors = responses.filter(r => r.category === "detractor").length;

  const promoterPercent = totalResponses > 0 ? Math.round((promoters / totalResponses) * 100) : 0;
  const passivePercent = totalResponses > 0 ? Math.round((passives / totalResponses) * 100) : 0;
  const detractorPercent = totalResponses > 0 ? Math.round((detractors / totalResponses) * 100) : 0;

  const npsScore = promoterPercent - detractorPercent;

  const avgResponseTime = responses.length > 0
    ? Math.round(responses.filter(r => r.responseTimeSeconds).reduce((acc, r) => acc + (r.responseTimeSeconds || 0), 0) / responses.length)
    : 0;

  const topComments = responses
    .filter(r => r.followUpComment)
    .slice(0, 10)
    .map(r => ({
      category: r.category,
      comment: r.followUpComment!,
      score: r.score,
    }));

  return {
    totalResponses,
    npsScore,
    promoters,
    passives,
    detractors,
    promoterPercent,
    passivePercent,
    detractorPercent,
    avgResponseTime,
    topComments,
  };
}

async function generatePerformanceCorrelation(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  periodStart: Date,
  periodEnd: Date,
  departmentId?: number
): Promise<PerformanceCorrelation> {
  // Buscar avaliações de performance com respostas NPS
  const perfEvals = await db.select()
    .from(performanceEvaluations)
    .where(and(
      gte(performanceEvaluations.createdAt, periodStart),
      lte(performanceEvaluations.createdAt, periodEnd)
    ));

  const npsResps = await db.select()
    .from(npsResponses)
    .where(and(
      gte(npsResponses.createdAt, periodStart),
      lte(npsResponses.createdAt, periodEnd)
    ));

  // Agrupar por nível de performance
  const highPerformers = perfEvals.filter(e => (e.overallScore || 0) >= 80);
  const mediumPerformers = perfEvals.filter(e => (e.overallScore || 0) >= 50 && (e.overallScore || 0) < 80);
  const lowPerformers = perfEvals.filter(e => (e.overallScore || 0) < 50);

  // Calcular NPS médio por grupo
  const getNpsForGroup = (employeeIds: number[]) => {
    const groupNps = npsResps.filter(r => employeeIds.includes(r.employeeId));
    if (groupNps.length === 0) return 0;
    const promoters = groupNps.filter(r => r.category === "promoter").length;
    const detractors = groupNps.filter(r => r.category === "detractor").length;
    return Math.round(((promoters - detractors) / groupNps.length) * 100);
  };

  const highPerformersNps = getNpsForGroup(highPerformers.map(e => e.employeeId));
  const mediumPerformersNps = getNpsForGroup(mediumPerformers.map(e => e.employeeId));
  const lowPerformersNps = getNpsForGroup(lowPerformers.map(e => e.employeeId));

  // Calcular correlação simplificada
  const correlationCoefficient = calculateSimpleCorrelation(
    perfEvals.map(e => e.overallScore || 0),
    npsResps.map(r => r.score)
  );

  let insight = "";
  if (highPerformersNps > lowPerformersNps + 20) {
    insight = "Funcionários de alta performance tendem a dar notas NPS significativamente maiores, indicando satisfação com o processo.";
  } else if (lowPerformersNps > highPerformersNps + 20) {
    insight = "Funcionários de baixa performance dão notas NPS maiores, o que pode indicar desalinhamento de expectativas.";
  } else {
    insight = "Não há correlação significativa entre performance e satisfação com o processo de avaliação.";
  }

  return {
    highPerformersNps,
    mediumPerformersNps,
    lowPerformersNps,
    correlationCoefficient,
    insight,
  };
}

async function generatePIRIntegrityReport(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  periodStart: Date,
  periodEnd: Date,
  departmentId?: number
): Promise<PIRIntegrityReport> {
  // Buscar avaliações PIR
  const assessments = await db.select()
    .from(pirAssessments)
    .where(and(
      gte(pirAssessments.createdAt, periodStart),
      lte(pirAssessments.createdAt, periodEnd)
    ));

  const totalAssessments = assessments.length;
  const completedAssessments = assessments.filter(a => a.status === "concluida").length;
  const pendingAssessments = totalAssessments - completedAssessments;

  // Calcular score médio de integridade
  const avgIntegrityScore = completedAssessments > 0
    ? Math.round(assessments.filter(a => a.status === "concluida").reduce((acc, a) => acc + (a.totalScore || 0), 0) / completedAssessments)
    : 0;

  // Buscar questões e respostas por dimensão
  const questions = await db.select().from(pirQuestions);
  const answers = await db.select()
    .from(pirAnswers)
    .where(and(
      gte(pirAnswers.createdAt, periodStart),
      lte(pirAnswers.createdAt, periodEnd)
    ));

  // Agrupar por dimensão
  const dimensions = ["IP", "ID", "IC", "ES", "FL", "AU"];
  const dimensionNames: Record<string, string> = {
    IP: "Integridade Pessoal",
    ID: "Integridade Decisória",
    IC: "Integridade Comportamental",
    ES: "Estabilidade",
    FL: "Flexibilidade",
    AU: "Autonomia",
  };

  const dimensionScores = dimensions.map(dim => {
    const dimQuestions = questions.filter(q => q.dimension === dim);
    const dimAnswers = answers.filter(a => dimQuestions.some(q => q.id === a.questionId));
    
    const avgScore = dimAnswers.length > 0
      ? Math.round(dimAnswers.reduce((acc, a) => acc + (a.score || 0), 0) / dimAnswers.length * 10) / 10
      : 0;

    return {
      dimension: dimensionNames[dim] || dim,
      avgScore,
      questionsAnswered: dimAnswers.length,
      totalQuestions: dimQuestions.length * totalAssessments,
    };
  });

  // Identificar alertas de risco
  const riskAlerts: PIRIntegrityReport["riskAlerts"] = [];
  
  const lowScoreAssessments = assessments.filter(a => (a.totalScore || 0) < 40);
  if (lowScoreAssessments.length > 0) {
    riskAlerts.push({
      level: "high",
      count: lowScoreAssessments.length,
      description: `${lowScoreAssessments.length} avaliações com score de integridade abaixo de 40%`,
    });
  }

  const incompleteAssessments = assessments.filter(a => a.status !== "concluida");
  if (incompleteAssessments.length > totalAssessments * 0.2) {
    riskAlerts.push({
      level: "medium",
      count: incompleteAssessments.length,
      description: `${incompleteAssessments.length} avaliações incompletas (${Math.round((incompleteAssessments.length / totalAssessments) * 100)}%)`,
    });
  }

  // Identificar dados faltantes
  const missingData: PIRIntegrityReport["missingData"] = [];

  const questionsWithoutAnswers = questions.filter(q => 
    !answers.some(a => a.questionId === q.id)
  );
  if (questionsWithoutAnswers.length > 0) {
    missingData.push({
      type: "Questões sem respostas",
      count: questionsWithoutAnswers.length,
      description: `${questionsWithoutAnswers.length} questões do PIR nunca foram respondidas`,
    });
  }

  // Verificar dimensões com poucas respostas
  dimensionScores.forEach(ds => {
    const completionRate = ds.totalQuestions > 0 ? (ds.questionsAnswered / ds.totalQuestions) * 100 : 0;
    if (completionRate < 50 && ds.totalQuestions > 0) {
      missingData.push({
        type: `Dimensão ${ds.dimension}`,
        count: ds.totalQuestions - ds.questionsAnswered,
        description: `Apenas ${Math.round(completionRate)}% das questões respondidas`,
      });
    }
  });

  return {
    totalAssessments,
    completedAssessments,
    pendingAssessments,
    avgIntegrityScore,
    dimensionScores,
    riskAlerts,
    missingData,
  };
}

async function generateDepartmentBreakdown(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  periodStart: Date,
  periodEnd: Date
): Promise<DepartmentBreakdown[]> {
  const depts = await db.select().from(departments).where(eq(departments.active, true));
  
  const breakdown: DepartmentBreakdown[] = [];

  for (const dept of depts) {
    // Buscar funcionários do departamento
    const deptEmployees = await db.select()
      .from(employees)
      .where(eq(employees.departmentId, dept.id));

    const employeeIds = deptEmployees.map(e => e.id);
    if (employeeIds.length === 0) continue;

    // Buscar processos
    const processes = await db.select()
      .from(avdAssessmentProcesses)
      .where(and(
        sql`${avdAssessmentProcesses.employeeId} IN (${sql.join(employeeIds.map(id => sql`${id}`), sql`, `)})`,
        gte(avdAssessmentProcesses.createdAt, periodStart),
        lte(avdAssessmentProcesses.createdAt, periodEnd)
      ));

    const processCount = processes.length;
    const completedCount = processes.filter(p => p.status === "concluido").length;
    const completionRate = processCount > 0 ? Math.round((completedCount / processCount) * 100) : 0;

    // Buscar NPS
    const npsResps = await db.select()
      .from(npsResponses)
      .where(and(
        sql`${npsResponses.employeeId} IN (${sql.join(employeeIds.map(id => sql`${id}`), sql`, `)})`,
        gte(npsResponses.createdAt, periodStart),
        lte(npsResponses.createdAt, periodEnd)
      ));

    const avgNpsScore = npsResps.length > 0
      ? Math.round(npsResps.reduce((acc, r) => acc + r.score, 0) / npsResps.length * 10) / 10
      : 0;

    // Buscar performance
    const perfEvals = await db.select()
      .from(performanceEvaluations)
      .where(and(
        sql`${performanceEvaluations.employeeId} IN (${sql.join(employeeIds.map(id => sql`${id}`), sql`, `)})`,
        gte(performanceEvaluations.createdAt, periodStart),
        lte(performanceEvaluations.createdAt, periodEnd)
      ));

    const avgPerformanceScore = perfEvals.length > 0
      ? Math.round(perfEvals.reduce((acc, e) => acc + (e.overallScore || 0), 0) / perfEvals.length)
      : 0;

    // Buscar integridade
    const pirAssess = await db.select()
      .from(pirAssessments)
      .where(and(
        sql`${pirAssessments.employeeId} IN (${sql.join(employeeIds.map(id => sql`${id}`), sql`, `)})`,
        gte(pirAssessments.createdAt, periodStart),
        lte(pirAssessments.createdAt, periodEnd)
      ));

    const avgIntegrityScore = pirAssess.length > 0
      ? Math.round(pirAssess.reduce((acc, a) => acc + (a.totalScore || 0), 0) / pirAssess.length)
      : 0;

    breakdown.push({
      departmentId: dept.id,
      departmentName: dept.name,
      processCount,
      completionRate,
      avgNpsScore,
      avgPerformanceScore,
      avgIntegrityScore,
    });
  }

  return breakdown.sort((a, b) => b.processCount - a.processCount);
}

function generateRecommendations(
  summary: ReportSummary,
  npsAnalysis: NPSAnalysis,
  performanceCorrelation: PerformanceCorrelation,
  pirIntegrity: PIRIntegrityReport
): string[] {
  const recommendations: string[] = [];

  // Recomendações baseadas em NPS
  if (npsAnalysis.npsScore < 0) {
    recommendations.push("⚠️ O NPS está negativo. Recomenda-se investigar as principais causas de insatisfação através dos comentários dos detratores.");
  } else if (npsAnalysis.npsScore < 30) {
    recommendations.push("📊 O NPS está abaixo da média do mercado. Considere implementar melhorias no processo de avaliação baseadas no feedback dos colaboradores.");
  }

  if (npsAnalysis.detractorPercent > 30) {
    recommendations.push("🔴 Alto percentual de detratores. Priorize ações de melhoria na experiência do colaborador durante o processo de avaliação.");
  }

  // Recomendações baseadas em taxa de conclusão
  if (summary.completionRate < 70) {
    recommendations.push("📉 Taxa de conclusão de processos abaixo de 70%. Considere enviar lembretes automáticos e simplificar etapas do processo.");
  }

  // Recomendações baseadas em PIR
  if (pirIntegrity.pendingAssessments > pirIntegrity.completedAssessments) {
    recommendations.push("⏳ Mais avaliações PIR pendentes do que concluídas. Reforce a importância da avaliação de integridade junto aos gestores.");
  }

  if (pirIntegrity.avgIntegrityScore < 50) {
    recommendations.push("🎯 Score médio de integridade baixo. Considere revisar as questões do PIR ou oferecer treinamentos sobre ética e integridade.");
  }

  if (pirIntegrity.riskAlerts.some(a => a.level === "high")) {
    recommendations.push("🚨 Existem alertas de risco de alta prioridade no PIR. Revise os casos identificados com urgência.");
  }

  if (pirIntegrity.missingData.length > 0) {
    recommendations.push(`📋 Foram identificados ${pirIntegrity.missingData.length} tipos de dados faltantes no PIR. Verifique a integridade dos dados.`);
  }

  // Recomendações baseadas em correlação
  if (performanceCorrelation.lowPerformersNps > performanceCorrelation.highPerformersNps) {
    recommendations.push("🔄 Funcionários de baixa performance estão mais satisfeitos com o processo. Revise os critérios de avaliação para garantir alinhamento.");
  }

  if (recommendations.length === 0) {
    recommendations.push("✅ Os indicadores estão dentro dos parâmetros esperados. Continue monitorando e buscando melhorias contínuas.");
  }

  return recommendations;
}

function calculateSimpleCorrelation(x: number[], y: number[]): number {
  if (x.length === 0 || y.length === 0 || x.length !== y.length) return 0;

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
  const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100) / 100;
}
