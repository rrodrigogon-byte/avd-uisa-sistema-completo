import { getDb } from "../db";
import { abTestExperiments, abTestVariants, abTestAssignments } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Serviço de Experimentos A/B para Layout de Avaliação
 * Gerencia variações de layout no processo de avaliação
 */

export interface LayoutVariant {
  id: number;
  name: string;
  description: string | null;
  isControl: boolean;
  layoutConfig: LayoutConfig;
}

export interface LayoutConfig {
  cardStyle: "default" | "compact" | "expanded";
  showProgressBar: boolean;
  showStepIndicator: boolean;
  questionLayout: "vertical" | "horizontal" | "grid";
  colorScheme: "default" | "modern" | "minimal";
  animationsEnabled: boolean;
  showHelpTooltips: boolean;
}

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  cardStyle: "default",
  showProgressBar: true,
  showStepIndicator: true,
  questionLayout: "vertical",
  colorScheme: "default",
  animationsEnabled: true,
  showHelpTooltips: true,
};

export const VARIANT_B_LAYOUT_CONFIG: LayoutConfig = {
  cardStyle: "expanded",
  showProgressBar: true,
  showStepIndicator: true,
  questionLayout: "grid",
  colorScheme: "modern",
  animationsEnabled: true,
  showHelpTooltips: true,
};

/**
 * Criar experimento A/B para layout de avaliação
 */
export async function createLayoutExperiment(
  name: string,
  description: string,
  targetModule: "pir" | "competencias" | "desempenho" | "pdi",
  createdBy: number
): Promise<{ experimentId: number; variantAId: number; variantBId: number } | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Criar experimento
    const experimentResult = await db.insert(abTestExperiments).values({
      name,
      description,
      targetModule,
      trafficPercentage: 100,
      startDate: new Date(),
      createdBy,
      status: "draft",
    });

    const experimentId = Number(experimentResult[0].insertId);

    // Criar Variante A (Controle - layout atual)
    const variantAResult = await db.insert(abTestVariants).values({
      experimentId,
      name: "Variante A - Layout Atual (Controle)",
      description: "Layout padrão do sistema de avaliação",
      isControl: true,
      trafficWeight: 50,
      questionContent: DEFAULT_LAYOUT_CONFIG,
    });

    const variantAId = Number(variantAResult[0].insertId);

    // Criar Variante B (Tratamento - novo layout)
    const variantBResult = await db.insert(abTestVariants).values({
      experimentId,
      name: "Variante B - Layout Moderno",
      description: "Novo layout com cards expandidos e grade de questões",
      isControl: false,
      trafficWeight: 50,
      questionContent: VARIANT_B_LAYOUT_CONFIG,
    });

    const variantBId = Number(variantBResult[0].insertId);

    return { experimentId, variantAId, variantBId };
  } catch (error) {
    console.error("[A/B Test] Erro ao criar experimento:", error);
    return null;
  }
}

/**
 * Obter configuração de layout para um funcionário em um experimento
 */
export async function getLayoutConfigForEmployee(
  experimentId: number,
  employeeId: number
): Promise<LayoutConfig> {
  const db = await getDb();
  if (!db) return DEFAULT_LAYOUT_CONFIG;

  try {
    // Verificar se já tem atribuição
    const [existing] = await db.select()
      .from(abTestAssignments)
      .where(and(
        eq(abTestAssignments.experimentId, experimentId),
        eq(abTestAssignments.employeeId, employeeId)
      ))
      .limit(1);

    let variantId: number;

    if (existing) {
      variantId = existing.variantId;
    } else {
      // Atribuir variante aleatoriamente
      const variants = await db.select()
        .from(abTestVariants)
        .where(eq(abTestVariants.experimentId, experimentId));

      if (variants.length === 0) return DEFAULT_LAYOUT_CONFIG;

      const totalWeight = variants.reduce((acc, v) => acc + v.trafficWeight, 0);
      let random = Math.random() * totalWeight;
      let selectedVariant = variants[0];

      for (const variant of variants) {
        random -= variant.trafficWeight;
        if (random <= 0) {
          selectedVariant = variant;
          break;
        }
      }

      // Salvar atribuição
      await db.insert(abTestAssignments).values({
        experimentId,
        variantId: selectedVariant.id,
        employeeId,
        completed: false,
      });

      variantId = selectedVariant.id;
    }

    // Buscar configuração da variante
    const [variant] = await db.select()
      .from(abTestVariants)
      .where(eq(abTestVariants.id, variantId))
      .limit(1);

    if (!variant || !variant.questionContent) return DEFAULT_LAYOUT_CONFIG;

    return variant.questionContent as LayoutConfig;
  } catch (error) {
    console.error("[A/B Test] Erro ao obter configuração:", error);
    return DEFAULT_LAYOUT_CONFIG;
  }
}

/**
 * Obter experimento ativo para um módulo
 */
export async function getActiveExperimentForModule(
  targetModule: "pir" | "competencias" | "desempenho" | "pdi"
): Promise<typeof abTestExperiments.$inferSelect | null> {
  const db = await getDb();
  if (!db) return null;

  const [experiment] = await db.select()
    .from(abTestExperiments)
    .where(and(
      eq(abTestExperiments.targetModule, targetModule),
      eq(abTestExperiments.status, "active")
    ))
    .orderBy(desc(abTestExperiments.createdAt))
    .limit(1);

  return experiment || null;
}

/**
 * Registrar conclusão de experimento para um funcionário
 */
export async function recordExperimentCompletion(
  experimentId: number,
  employeeId: number,
  responseTimeSeconds: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(abTestAssignments)
      .set({
        completed: true,
        responseTimeSeconds,
        completedAt: new Date(),
      })
      .where(and(
        eq(abTestAssignments.experimentId, experimentId),
        eq(abTestAssignments.employeeId, employeeId)
      ));

    return true;
  } catch (error) {
    console.error("[A/B Test] Erro ao registrar conclusão:", error);
    return false;
  }
}

/**
 * Calcular métricas comparativas entre variantes
 */
export async function calculateVariantMetrics(experimentId: number): Promise<{
  variantA: VariantMetrics;
  variantB: VariantMetrics;
  winner: "A" | "B" | "tie" | "insufficient_data";
  confidenceLevel: number;
}> {
  const db = await getDb();
  if (!db) {
    return {
      variantA: getEmptyMetrics(),
      variantB: getEmptyMetrics(),
      winner: "insufficient_data",
      confidenceLevel: 0,
    };
  }

  const variants = await db.select()
    .from(abTestVariants)
    .where(eq(abTestVariants.experimentId, experimentId));

  const controlVariant = variants.find(v => v.isControl);
  const treatmentVariant = variants.find(v => !v.isControl);

  if (!controlVariant || !treatmentVariant) {
    return {
      variantA: getEmptyMetrics(),
      variantB: getEmptyMetrics(),
      winner: "insufficient_data",
      confidenceLevel: 0,
    };
  }

  const variantAMetrics = await calculateMetricsForVariant(controlVariant.id);
  const variantBMetrics = await calculateMetricsForVariant(treatmentVariant.id);

  // Determinar vencedor baseado em taxa de conclusão e tempo médio
  const totalSamples = variantAMetrics.sampleSize + variantBMetrics.sampleSize;
  let winner: "A" | "B" | "tie" | "insufficient_data" = "insufficient_data";
  let confidenceLevel = 0;

  if (totalSamples >= 30) {
    // Calcular significância estatística simplificada
    const conversionDiff = Math.abs(variantAMetrics.conversionRate - variantBMetrics.conversionRate);
    confidenceLevel = Math.min(95, Math.round(conversionDiff * 2 + (totalSamples / 10)));

    if (confidenceLevel >= 80) {
      if (variantBMetrics.conversionRate > variantAMetrics.conversionRate * 1.05) {
        winner = "B";
      } else if (variantAMetrics.conversionRate > variantBMetrics.conversionRate * 1.05) {
        winner = "A";
      } else {
        winner = "tie";
      }
    }
  }

  return {
    variantA: variantAMetrics,
    variantB: variantBMetrics,
    winner,
    confidenceLevel,
  };
}

interface VariantMetrics {
  sampleSize: number;
  completions: number;
  conversionRate: number;
  avgResponseTimeSeconds: number;
  dropoffRate: number;
}

function getEmptyMetrics(): VariantMetrics {
  return {
    sampleSize: 0,
    completions: 0,
    conversionRate: 0,
    avgResponseTimeSeconds: 0,
    dropoffRate: 0,
  };
}

async function calculateMetricsForVariant(variantId: number): Promise<VariantMetrics> {
  const db = await getDb();
  if (!db) return getEmptyMetrics();

  const assignments = await db.select()
    .from(abTestAssignments)
    .where(eq(abTestAssignments.variantId, variantId));

  const sampleSize = assignments.length;
  const completions = assignments.filter(a => a.completed).length;
  const conversionRate = sampleSize > 0 ? Math.round((completions / sampleSize) * 100) : 0;
  
  const completedWithTime = assignments.filter(a => a.completed && a.responseTimeSeconds);
  const avgResponseTimeSeconds = completedWithTime.length > 0
    ? Math.round(completedWithTime.reduce((acc, a) => acc + (a.responseTimeSeconds || 0), 0) / completedWithTime.length)
    : 0;
  
  const dropoffRate = sampleSize > 0 ? Math.round(((sampleSize - completions) / sampleSize) * 100) : 0;

  return {
    sampleSize,
    completions,
    conversionRate,
    avgResponseTimeSeconds,
    dropoffRate,
  };
}
