import { getDb } from "../db";
import { 
  abTestExperiments, 
  abTestVariants, 
  abTestAssignments,
  abTestMetrics,
  abLayoutConfigs,
  abTestResults
} from "../../drizzle/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

/**
 * Serviço de Métricas A/B Test
 * Coleta e analisa métricas comparativas entre variantes
 */

export interface MetricData {
  experimentId: number;
  variantId: number;
  userId: number;
  metricType: "page_view" | "time_on_page" | "step_completion" | "form_submission" | "error_count" | "satisfaction_rating" | "task_completion_time";
  metricValue?: number;
  metricLabel?: string;
  pageUrl?: string;
  stepNumber?: number;
  sessionId?: string;
}

export interface VariantComparisonResult {
  experimentId: number;
  experimentName: string;
  status: string;
  variantA: VariantStats;
  variantB: VariantStats;
  comparison: {
    conversionLift: number;
    timeLift: number;
    satisfactionLift: number;
    winner: "A" | "B" | "tie" | "insufficient_data";
    confidenceLevel: number;
    recommendation: string;
  };
}

export interface VariantStats {
  variantId: number;
  variantName: string;
  isControl: boolean;
  sampleSize: number;
  completions: number;
  conversionRate: number;
  avgTimeOnPage: number;
  avgCompletionTime: number;
  avgSatisfactionRating: number;
  errorRate: number;
  dropoffRate: number;
  stepCompletionRates: Record<number, number>;
}

/**
 * Registrar métrica de experimento A/B
 */
export async function recordAbTestMetric(data: MetricData): Promise<{ metricId: number } | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(abTestMetrics).values({
      experimentId: data.experimentId,
      variantId: data.variantId,
      userId: data.userId,
      metricType: data.metricType,
      metricValue: data.metricValue,
      metricLabel: data.metricLabel,
      pageUrl: data.pageUrl,
      stepNumber: data.stepNumber,
      sessionId: data.sessionId,
    });

    return { metricId: Number(result[0].insertId) };
  } catch (error) {
    console.error("[A/B Metrics] Erro ao registrar métrica:", error);
    return null;
  }
}

/**
 * Obter comparação detalhada entre variantes
 */
export async function getVariantComparison(experimentId: number): Promise<VariantComparisonResult | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Buscar experimento
    const [experiment] = await db.select()
      .from(abTestExperiments)
      .where(eq(abTestExperiments.id, experimentId))
      .limit(1);

    if (!experiment) return null;

    // Buscar variantes
    const variants = await db.select()
      .from(abTestVariants)
      .where(eq(abTestVariants.experimentId, experimentId));

    const controlVariant = variants.find(v => v.isControl);
    const treatmentVariant = variants.find(v => !v.isControl);

    if (!controlVariant || !treatmentVariant) return null;

    // Calcular estatísticas para cada variante
    const variantAStats = await calculateVariantStats(controlVariant.id, controlVariant.name, true);
    const variantBStats = await calculateVariantStats(treatmentVariant.id, treatmentVariant.name, false);

    // Calcular comparação
    const comparison = calculateComparison(variantAStats, variantBStats);

    return {
      experimentId,
      experimentName: experiment.name,
      status: experiment.status,
      variantA: variantAStats,
      variantB: variantBStats,
      comparison,
    };
  } catch (error) {
    console.error("[A/B Metrics] Erro ao obter comparação:", error);
    return null;
  }
}

async function calculateVariantStats(
  variantId: number, 
  variantName: string, 
  isControl: boolean
): Promise<VariantStats> {
  const db = await getDb();
  if (!db) {
    return getEmptyStats(variantId, variantName, isControl);
  }

  // Buscar atribuições
  const assignments = await db.select()
    .from(abTestAssignments)
    .where(eq(abTestAssignments.variantId, variantId));

  // Buscar métricas
  const metrics = await db.select()
    .from(abTestMetrics)
    .where(eq(abTestMetrics.variantId, variantId));

  const sampleSize = assignments.length;
  const completions = assignments.filter(a => a.completed).length;
  const conversionRate = sampleSize > 0 ? Math.round((completions / sampleSize) * 100) : 0;

  // Tempo médio na página
  const timeMetrics = metrics.filter(m => m.metricType === "time_on_page" && m.metricValue);
  const avgTimeOnPage = timeMetrics.length > 0
    ? Math.round(timeMetrics.reduce((acc, m) => acc + (m.metricValue || 0), 0) / timeMetrics.length)
    : 0;

  // Tempo médio de conclusão
  const completionTimeMetrics = metrics.filter(m => m.metricType === "task_completion_time" && m.metricValue);
  const avgCompletionTime = completionTimeMetrics.length > 0
    ? Math.round(completionTimeMetrics.reduce((acc, m) => acc + (m.metricValue || 0), 0) / completionTimeMetrics.length)
    : 0;

  // Satisfação média
  const satisfactionMetrics = metrics.filter(m => m.metricType === "satisfaction_rating" && m.metricValue);
  const avgSatisfactionRating = satisfactionMetrics.length > 0
    ? Math.round(satisfactionMetrics.reduce((acc, m) => acc + (m.metricValue || 0), 0) / satisfactionMetrics.length * 10) / 10
    : 0;

  // Taxa de erros
  const errorMetrics = metrics.filter(m => m.metricType === "error_count");
  const totalErrors = errorMetrics.reduce((acc, m) => acc + (m.metricValue || 0), 0);
  const errorRate = sampleSize > 0 ? Math.round((totalErrors / sampleSize) * 100) : 0;

  // Taxa de abandono
  const dropoffRate = sampleSize > 0 ? Math.round(((sampleSize - completions) / sampleSize) * 100) : 0;

  // Taxa de conclusão por passo
  const stepCompletionMetrics = metrics.filter(m => m.metricType === "step_completion" && m.stepNumber);
  const stepCompletionRates: Record<number, number> = {};
  
  for (let step = 1; step <= 5; step++) {
    const stepMetrics = stepCompletionMetrics.filter(m => m.stepNumber === step);
    stepCompletionRates[step] = sampleSize > 0 
      ? Math.round((stepMetrics.length / sampleSize) * 100) 
      : 0;
  }

  return {
    variantId,
    variantName,
    isControl,
    sampleSize,
    completions,
    conversionRate,
    avgTimeOnPage,
    avgCompletionTime,
    avgSatisfactionRating,
    errorRate,
    dropoffRate,
    stepCompletionRates,
  };
}

function getEmptyStats(variantId: number, variantName: string, isControl: boolean): VariantStats {
  return {
    variantId,
    variantName,
    isControl,
    sampleSize: 0,
    completions: 0,
    conversionRate: 0,
    avgTimeOnPage: 0,
    avgCompletionTime: 0,
    avgSatisfactionRating: 0,
    errorRate: 0,
    dropoffRate: 0,
    stepCompletionRates: {},
  };
}

function calculateComparison(variantA: VariantStats, variantB: VariantStats): {
  conversionLift: number;
  timeLift: number;
  satisfactionLift: number;
  winner: "A" | "B" | "tie" | "insufficient_data";
  confidenceLevel: number;
  recommendation: string;
} {
  const totalSamples = variantA.sampleSize + variantB.sampleSize;

  // Calcular lifts
  const conversionLift = variantA.conversionRate > 0
    ? Math.round(((variantB.conversionRate - variantA.conversionRate) / variantA.conversionRate) * 100)
    : 0;

  const timeLift = variantA.avgCompletionTime > 0
    ? Math.round(((variantA.avgCompletionTime - variantB.avgCompletionTime) / variantA.avgCompletionTime) * 100)
    : 0;

  const satisfactionLift = variantA.avgSatisfactionRating > 0
    ? Math.round(((variantB.avgSatisfactionRating - variantA.avgSatisfactionRating) / variantA.avgSatisfactionRating) * 100)
    : 0;

  // Determinar vencedor
  let winner: "A" | "B" | "tie" | "insufficient_data" = "insufficient_data";
  let confidenceLevel = 0;
  let recommendation = "";

  if (totalSamples < 30) {
    recommendation = "Dados insuficientes para conclusão estatística. Continue coletando dados.";
  } else {
    // Calcular confiança simplificada baseada em diferença e tamanho da amostra
    const conversionDiff = Math.abs(variantA.conversionRate - variantB.conversionRate);
    confidenceLevel = Math.min(95, Math.round(conversionDiff * 1.5 + Math.log10(totalSamples) * 10));

    if (confidenceLevel >= 80) {
      // Pontuar cada variante
      let scoreA = 0;
      let scoreB = 0;

      // Conversão (peso 3)
      if (variantA.conversionRate > variantB.conversionRate * 1.05) scoreA += 3;
      else if (variantB.conversionRate > variantA.conversionRate * 1.05) scoreB += 3;

      // Tempo de conclusão menor é melhor (peso 2)
      if (variantA.avgCompletionTime < variantB.avgCompletionTime * 0.95) scoreA += 2;
      else if (variantB.avgCompletionTime < variantA.avgCompletionTime * 0.95) scoreB += 2;

      // Satisfação (peso 2)
      if (variantA.avgSatisfactionRating > variantB.avgSatisfactionRating * 1.05) scoreA += 2;
      else if (variantB.avgSatisfactionRating > variantA.avgSatisfactionRating * 1.05) scoreB += 2;

      // Taxa de erro menor é melhor (peso 1)
      if (variantA.errorRate < variantB.errorRate * 0.9) scoreA += 1;
      else if (variantB.errorRate < variantA.errorRate * 0.9) scoreB += 1;

      if (scoreA > scoreB + 1) {
        winner = "A";
        recommendation = "A Variante A (controle) apresenta melhor desempenho geral. Considere manter o layout atual.";
      } else if (scoreB > scoreA + 1) {
        winner = "B";
        recommendation = "A Variante B apresenta melhor desempenho. Considere implementar o novo layout.";
      } else {
        winner = "tie";
        recommendation = "Não há diferença significativa entre as variantes. Considere outros fatores para decisão.";
      }
    } else {
      recommendation = `Confiança estatística de ${confidenceLevel}% ainda é baixa. Continue coletando dados.`;
    }
  }

  return {
    conversionLift,
    timeLift,
    satisfactionLift,
    winner,
    confidenceLevel,
    recommendation,
  };
}

/**
 * Criar configuração de layout para variante
 */
export async function createLayoutConfig(
  experimentId: number,
  variantId: number,
  config: {
    layoutType: "control" | "cards" | "grid" | "wizard" | "minimal";
    colorScheme?: string;
    fontFamily?: string;
    spacing?: "compact" | "normal" | "relaxed";
    showProgressBar?: boolean;
    showStepNumbers?: boolean;
    showHelpTooltips?: boolean;
    animationsEnabled?: boolean;
    customCss?: string;
  }
): Promise<{ configId: number } | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(abLayoutConfigs).values({
      experimentId,
      variantId,
      layoutType: config.layoutType,
      colorScheme: config.colorScheme,
      fontFamily: config.fontFamily,
      spacing: config.spacing || "normal",
      showProgressBar: config.showProgressBar ?? true,
      showStepNumbers: config.showStepNumbers ?? true,
      showHelpTooltips: config.showHelpTooltips ?? false,
      animationsEnabled: config.animationsEnabled ?? true,
      customCss: config.customCss,
    });

    return { configId: Number(result[0].insertId) };
  } catch (error) {
    console.error("[A/B Layout] Erro ao criar configuração:", error);
    return null;
  }
}

/**
 * Obter configuração de layout para usuário
 */
export async function getLayoutConfigForUser(
  experimentId: number,
  userId: number
): Promise<typeof abLayoutConfigs.$inferSelect | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Verificar atribuição do usuário
    const [assignment] = await db.select()
      .from(abTestAssignments)
      .where(and(
        eq(abTestAssignments.experimentId, experimentId),
        eq(abTestAssignments.employeeId, userId)
      ))
      .limit(1);

    if (!assignment) return null;

    // Buscar configuração da variante
    const [config] = await db.select()
      .from(abLayoutConfigs)
      .where(and(
        eq(abLayoutConfigs.experimentId, experimentId),
        eq(abLayoutConfigs.variantId, assignment.variantId)
      ))
      .limit(1);

    return config || null;
  } catch (error) {
    console.error("[A/B Layout] Erro ao obter configuração:", error);
    return null;
  }
}

/**
 * Salvar resultados do experimento
 */
export async function saveExperimentResults(experimentId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const comparison = await getVariantComparison(experimentId);
    if (!comparison) return false;

    // Verificar se já existe resultado
    const [existing] = await db.select()
      .from(abTestResults)
      .where(eq(abTestResults.experimentId, experimentId))
      .limit(1);

    const resultData = {
      experimentId,
      variantAId: comparison.variantA.variantId,
      variantBId: comparison.variantB.variantId,
      sampleSizeA: comparison.variantA.sampleSize,
      sampleSizeB: comparison.variantB.sampleSize,
      conversionRateA: comparison.variantA.conversionRate,
      conversionRateB: comparison.variantB.conversionRate,
      avgTimeA: comparison.variantA.avgCompletionTime,
      avgTimeB: comparison.variantB.avgCompletionTime,
      satisfactionA: Math.round(comparison.variantA.avgSatisfactionRating * 10),
      satisfactionB: Math.round(comparison.variantB.avgSatisfactionRating * 10),
      dropoffRateA: comparison.variantA.dropoffRate,
      dropoffRateB: comparison.variantB.dropoffRate,
      isStatisticallySignificant: comparison.comparison.confidenceLevel >= 80,
      confidenceLevel: comparison.comparison.confidenceLevel,
    };

    if (existing) {
      await db.update(abTestResults)
        .set(resultData)
        .where(eq(abTestResults.id, existing.id));
    } else {
      await db.insert(abTestResults).values(resultData);
    }

    return true;
  } catch (error) {
    console.error("[A/B Results] Erro ao salvar resultados:", error);
    return false;
  }
}
