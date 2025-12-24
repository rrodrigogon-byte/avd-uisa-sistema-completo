import { getDb } from "../db";
import { 
  reportExportHistory,
  pirIntegrityAlerts,
  consolidatedReportCache
} from "../../drizzle/schema";
import { eq, desc, gte, lte } from "drizzle-orm";
import { generateConsolidatedReport, ConsolidatedReportData } from "./consolidatedReportService";

/**
 * Serviço de Exportação de Relatórios
 * Gera e exporta relatórios em diferentes formatos (CSV, JSON)
 */

export interface ExportResult {
  success: boolean;
  fileName: string;
  content: string;
  format: "csv" | "json";
  size: number;
  exportId?: number;
}

/**
 * Exportar relatório consolidado NPS + Avaliação em CSV
 */
export async function exportConsolidatedReportCSV(
  startDate?: Date,
  endDate?: Date,
  departmentId?: number,
  userId?: number
): Promise<ExportResult> {
  try {
    const report = await generateConsolidatedReport(startDate, endDate, departmentId);
    
    const csvLines: string[] = [];
    
    // Cabeçalho do resumo
    csvLines.push("=== RESUMO GERAL ===");
    csvLines.push("Métrica,Valor");
    csvLines.push(`Total de Processos,${report.summary.totalProcesses}`);
    csvLines.push(`Processos Concluídos,${report.summary.completedProcesses}`);
    csvLines.push(`Taxa de Conclusão,${report.summary.completionRate}%`);
    csvLines.push(`Score NPS Médio,${report.summary.avgNpsScore}`);
    csvLines.push(`Score Performance Médio,${report.summary.avgPerformanceScore}`);
    csvLines.push(`Período Início,${report.summary.periodStart.toISOString().split('T')[0]}`);
    csvLines.push(`Período Fim,${report.summary.periodEnd.toISOString().split('T')[0]}`);
    csvLines.push("");
    
    // Análise NPS
    csvLines.push("=== ANÁLISE NPS ===");
    csvLines.push("Métrica,Valor");
    csvLines.push(`Total de Respostas,${report.npsAnalysis.totalResponses}`);
    csvLines.push(`Score NPS,${report.npsAnalysis.npsScore}`);
    csvLines.push(`Promotores,${report.npsAnalysis.promoters} (${report.npsAnalysis.promoterPercent}%)`);
    csvLines.push(`Neutros,${report.npsAnalysis.passives} (${report.npsAnalysis.passivePercent}%)`);
    csvLines.push(`Detratores,${report.npsAnalysis.detractors} (${report.npsAnalysis.detractorPercent}%)`);
    csvLines.push(`Tempo Médio de Resposta,${report.npsAnalysis.avgResponseTime}s`);
    csvLines.push("");
    
    // Correlação Performance
    csvLines.push("=== CORRELAÇÃO NPS x PERFORMANCE ===");
    csvLines.push("Grupo,NPS Médio");
    csvLines.push(`Alta Performance,${report.performanceCorrelation.highPerformersNps}`);
    csvLines.push(`Média Performance,${report.performanceCorrelation.mediumPerformersNps}`);
    csvLines.push(`Baixa Performance,${report.performanceCorrelation.lowPerformersNps}`);
    csvLines.push(`Coeficiente de Correlação,${report.performanceCorrelation.correlationCoefficient}`);
    csvLines.push(`Insight,"${report.performanceCorrelation.insight}"`);
    csvLines.push("");
    
    // Integridade PIR
    csvLines.push("=== INTEGRIDADE PIR ===");
    csvLines.push("Métrica,Valor");
    csvLines.push(`Total de Avaliações,${report.pirIntegrity.totalAssessments}`);
    csvLines.push(`Avaliações Concluídas,${report.pirIntegrity.completedAssessments}`);
    csvLines.push(`Avaliações Pendentes,${report.pirIntegrity.pendingAssessments}`);
    csvLines.push(`Score Médio de Integridade,${report.pirIntegrity.avgIntegrityScore}%`);
    csvLines.push("");
    
    // Scores por dimensão
    csvLines.push("=== SCORES POR DIMENSÃO ===");
    csvLines.push("Dimensão,Score Médio,Questões Respondidas,Total Questões");
    for (const dim of report.pirIntegrity.dimensionScores) {
      csvLines.push(`${dim.dimension},${dim.avgScore},${dim.questionsAnswered},${dim.totalQuestions}`);
    }
    csvLines.push("");
    
    // Alertas de risco
    if (report.pirIntegrity.riskAlerts.length > 0) {
      csvLines.push("=== ALERTAS DE RISCO ===");
      csvLines.push("Nível,Quantidade,Descrição");
      for (const alert of report.pirIntegrity.riskAlerts) {
        csvLines.push(`${alert.level},${alert.count},"${alert.description}"`);
      }
      csvLines.push("");
    }
    
    // Dados faltantes
    if (report.pirIntegrity.missingData.length > 0) {
      csvLines.push("=== DADOS FALTANTES ===");
      csvLines.push("Tipo,Quantidade,Descrição");
      for (const missing of report.pirIntegrity.missingData) {
        csvLines.push(`${missing.type},${missing.count},"${missing.description}"`);
      }
      csvLines.push("");
    }
    
    // Breakdown por departamento
    if (report.departmentBreakdown.length > 0) {
      csvLines.push("=== ANÁLISE POR DEPARTAMENTO ===");
      csvLines.push("Departamento,Processos,Taxa Conclusão,NPS Médio,Performance Média,Integridade Média");
      for (const dept of report.departmentBreakdown) {
        csvLines.push(`${dept.departmentName},${dept.processCount},${dept.completionRate}%,${dept.avgNpsScore},${dept.avgPerformanceScore},${dept.avgIntegrityScore}`);
      }
      csvLines.push("");
    }
    
    // Recomendações
    csvLines.push("=== RECOMENDAÇÕES ===");
    for (let i = 0; i < report.recommendations.length; i++) {
      csvLines.push(`${i + 1},"${report.recommendations[i]}"`);
    }
    
    const content = csvLines.join("\n");
    const fileName = `relatorio-consolidado-${new Date().toISOString().split('T')[0]}.csv`;
    
    // Salvar histórico de exportação
    if (userId) {
      await saveExportHistory("nps_consolidated", "csv", fileName, content.length, userId);
    }
    
    return {
      success: true,
      fileName,
      content,
      format: "csv",
      size: content.length,
    };
  } catch (error) {
    console.error("[Report Export] Erro ao exportar CSV:", error);
    return {
      success: false,
      fileName: "",
      content: "",
      format: "csv",
      size: 0,
    };
  }
}

/**
 * Exportar relatório consolidado NPS + Avaliação em JSON
 */
export async function exportConsolidatedReportJSON(
  startDate?: Date,
  endDate?: Date,
  departmentId?: number,
  userId?: number
): Promise<ExportResult> {
  try {
    const report = await generateConsolidatedReport(startDate, endDate, departmentId);
    
    const content = JSON.stringify(report, null, 2);
    const fileName = `relatorio-consolidado-${new Date().toISOString().split('T')[0]}.json`;
    
    // Salvar histórico de exportação
    if (userId) {
      await saveExportHistory("nps_consolidated", "json", fileName, content.length, userId);
    }
    
    return {
      success: true,
      fileName,
      content,
      format: "json",
      size: content.length,
    };
  } catch (error) {
    console.error("[Report Export] Erro ao exportar JSON:", error);
    return {
      success: false,
      fileName: "",
      content: "",
      format: "json",
      size: 0,
    };
  }
}

/**
 * Salvar histórico de exportação
 */
async function saveExportHistory(
  reportType: "nps_consolidated" | "performance_summary" | "department_analysis" | "trend_analysis" | "integrity_report",
  exportFormat: "csv" | "json" | "pdf" | "xlsx",
  fileName: string,
  fileSize: number,
  exportedBy: number
): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(reportExportHistory).values({
      reportType,
      exportFormat,
      fileName,
      fileSize,
      exportedBy,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
    });

    return Number(result[0].insertId);
  } catch (error) {
    console.error("[Report Export] Erro ao salvar histórico:", error);
    return null;
  }
}

/**
 * Listar histórico de exportações
 */
export async function getExportHistory(
  userId?: number,
  limit: number = 50
): Promise<Array<typeof reportExportHistory.$inferSelect>> {
  const db = await getDb();
  if (!db) return [];

  try {
    let query = db.select()
      .from(reportExportHistory)
      .orderBy(desc(reportExportHistory.exportedAt))
      .limit(limit);

    if (userId) {
      query = query.where(eq(reportExportHistory.exportedBy, userId)) as typeof query;
    }

    return await query;
  } catch (error) {
    console.error("[Report Export] Erro ao listar histórico:", error);
    return [];
  }
}

/**
 * Criar alerta de integridade do PIR
 */
export async function createPirIntegrityAlert(
  processId: number,
  employeeId: number,
  alertType: "missing_dimensions" | "inconsistent_scores" | "incomplete_assessment" | "outlier_detected" | "data_mismatch",
  severity: "low" | "medium" | "high" | "critical",
  description: string,
  affectedFields?: string[],
  expectedValue?: string,
  actualValue?: string
): Promise<{ alertId: number } | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(pirIntegrityAlerts).values({
      processId,
      employeeId,
      alertType,
      severity,
      description,
      affectedFields: affectedFields ? JSON.stringify(affectedFields) : null,
      expectedValue,
      actualValue,
      status: "open",
    });

    return { alertId: Number(result[0].insertId) };
  } catch (error) {
    console.error("[PIR Integrity] Erro ao criar alerta:", error);
    return null;
  }
}

/**
 * Listar alertas de integridade do PIR
 */
export async function getPirIntegrityAlerts(
  status?: "open" | "investigating" | "resolved" | "false_positive",
  severity?: "low" | "medium" | "high" | "critical"
): Promise<Array<typeof pirIntegrityAlerts.$inferSelect>> {
  const db = await getDb();
  if (!db) return [];

  try {
    let query = db.select()
      .from(pirIntegrityAlerts)
      .orderBy(desc(pirIntegrityAlerts.createdAt));

    if (status) {
      query = query.where(eq(pirIntegrityAlerts.status, status)) as typeof query;
    }

    if (severity) {
      query = query.where(eq(pirIntegrityAlerts.severity, severity)) as typeof query;
    }

    return await query;
  } catch (error) {
    console.error("[PIR Integrity] Erro ao listar alertas:", error);
    return [];
  }
}

/**
 * Atualizar status de alerta de integridade
 */
export async function updatePirIntegrityAlertStatus(
  alertId: number,
  status: "investigating" | "resolved" | "false_positive",
  userId: number,
  notes?: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const updateData: Record<string, unknown> = { status };

    if (status === "resolved" || status === "false_positive") {
      updateData.resolvedBy = userId;
      updateData.resolvedAt = new Date();
      if (notes) {
        updateData.resolutionNotes = notes;
      }
    }

    await db.update(pirIntegrityAlerts)
      .set(updateData)
      .where(eq(pirIntegrityAlerts.id, alertId));

    return true;
  } catch (error) {
    console.error("[PIR Integrity] Erro ao atualizar status:", error);
    return false;
  }
}

/**
 * Cachear relatório consolidado
 */
export async function cacheConsolidatedReport(
  report: ConsolidatedReportData,
  departmentId: number | null,
  userId: number
): Promise<{ cacheId: number } | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(consolidatedReportCache).values({
      periodStart: report.summary.periodStart,
      periodEnd: report.summary.periodEnd,
      departmentId,
      npsData: report.npsAnalysis,
      performanceData: report.performanceCorrelation,
      correlationData: { correlation: report.performanceCorrelation.correlationCoefficient },
      departmentBreakdown: report.departmentBreakdown,
      trends: null,
      integrityAlerts: report.pirIntegrity.riskAlerts,
      riskIndicators: report.pirIntegrity.missingData,
      generatedBy: userId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
    });

    return { cacheId: Number(result[0].insertId) };
  } catch (error) {
    console.error("[Report Cache] Erro ao cachear relatório:", error);
    return null;
  }
}

/**
 * Obter relatório cacheado
 */
export async function getCachedReport(
  departmentId?: number
): Promise<typeof consolidatedReportCache.$inferSelect | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const now = new Date();
    
    const conditions = [gte(consolidatedReportCache.expiresAt, now)];
    
    if (departmentId) {
      conditions.push(eq(consolidatedReportCache.departmentId, departmentId));
    }

    const [cached] = await db.select()
      .from(consolidatedReportCache)
      .where(conditions.length === 1 ? conditions[0] : conditions[0])
      .orderBy(desc(consolidatedReportCache.generatedAt))
      .limit(1);

    return cached || null;
  } catch (error) {
    console.error("[Report Cache] Erro ao obter cache:", error);
    return null;
  }
}
