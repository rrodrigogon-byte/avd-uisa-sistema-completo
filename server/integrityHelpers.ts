import { eq, and, desc, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  integrityTestCategories,
  integrityQuestions,
  integrityResponses,
  responsePatternAnalysis,
  ethicsIndicators,
  pirAssessments,
  type InsertIntegrityTestCategory,
  type InsertIntegrityQuestion,
  type InsertIntegrityResponse,
  type InsertResponsePatternAnalysis,
  type InsertEthicsIndicator,
  type IntegrityTestCategory,
  type IntegrityQuestion,
  type IntegrityResponse,
  type ResponsePatternAnalysis,
  type EthicsIndicator,
} from "../drizzle/schema";

// ============================================================================
// CATEGORIAS DE TESTES DE INTEGRIDADE
// ============================================================================

/**
 * Cria categoria de teste de integridade
 */
export async function createIntegrityCategory(
  data: InsertIntegrityTestCategory
): Promise<IntegrityTestCategory> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(integrityTestCategories).values(data);

  const category = await db
    .select()
    .from(integrityTestCategories)
    .where(eq(integrityTestCategories.id, result[0].insertId))
    .limit(1);

  return category[0];
}

/**
 * Lista categorias ativas
 */
export async function listIntegrityCategories(): Promise<IntegrityTestCategory[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db
    .select()
    .from(integrityTestCategories)
    .where(eq(integrityTestCategories.active, true))
    .orderBy(integrityTestCategories.displayOrder);
}

// ============================================================================
// QUESTÕES DE INTEGRIDADE
// ============================================================================

/**
 * Cria questão de integridade
 */
export async function createIntegrityQuestion(
  data: InsertIntegrityQuestion
): Promise<IntegrityQuestion> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(integrityQuestions).values(data);

  const question = await db
    .select()
    .from(integrityQuestions)
    .where(eq(integrityQuestions.id, result[0].insertId))
    .limit(1);

  return question[0];
}

/**
 * Lista questões por categoria
 */
export async function listIntegrityQuestionsByCategory(
  categoryId: number
): Promise<IntegrityQuestion[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db
    .select()
    .from(integrityQuestions)
    .where(
      and(
        eq(integrityQuestions.categoryId, categoryId),
        eq(integrityQuestions.active, true)
      )
    )
    .orderBy(integrityQuestions.displayOrder);
}

/**
 * Lista todas as questões ativas
 */
export async function listAllIntegrityQuestions(): Promise<IntegrityQuestion[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db
    .select()
    .from(integrityQuestions)
    .where(eq(integrityQuestions.active, true))
    .orderBy(integrityQuestions.displayOrder);
}

// ============================================================================
// RESPOSTAS E ANÁLISE
// ============================================================================

/**
 * Salva resposta de teste de integridade
 */
export async function saveIntegrityResponse(
  data: InsertIntegrityResponse
): Promise<IntegrityResponse> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(integrityResponses).values(data);

  const response = await db
    .select()
    .from(integrityResponses)
    .where(eq(integrityResponses.id, result[0].insertId))
    .limit(1);

  return response[0];
}

/**
 * Obtém respostas de uma avaliação PIR
 */
export async function getIntegrityResponses(
  pirAssessmentId: number
): Promise<IntegrityResponse[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db
    .select()
    .from(integrityResponses)
    .where(eq(integrityResponses.pirAssessmentId, pirAssessmentId));
}

/**
 * Analisa padrões de respostas
 */
export async function analyzeResponsePatterns(
  pirAssessmentId: number
): Promise<ResponsePatternAnalysis> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Busca todas as respostas
  const responses = await getIntegrityResponses(pirAssessmentId);

  if (responses.length === 0) {
    throw new Error("No responses found for analysis");
  }

  // Análise de consistência
  const inconsistentResponses = responses.filter((r) => r.isInconsistent);
  const consistencyScore = Math.round(
    ((responses.length - inconsistentResponses.length) / responses.length) * 100
  );

  // Análise de desejabilidade social
  const socialDesirableResponses = responses.filter((r) => r.isSociallyDesirable);
  const socialDesirabilityScore = Math.round(
    (socialDesirableResponses.length / responses.length) * 100
  );

  // Análise de tempo de resposta
  const responseTimes = responses
    .filter((r) => r.responseTime !== null)
    .map((r) => r.responseTime!);

  const averageResponseTime =
    responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

  // Detecta respostas muito rápidas (< 3 segundos) ou muito lentas (> 60 segundos)
  const tooFastResponses = responseTimes.filter((t) => t < 3);
  const tooSlowResponses = responseTimes.filter((t) => t > 60);

  // Padrões detectados
  const patterns: string[] = [];

  if (inconsistentResponses.length > responses.length * 0.2) {
    patterns.push("high_inconsistency");
  }

  if (socialDesirableResponses.length > responses.length * 0.3) {
    patterns.push("social_desirability_bias");
  }

  if (tooFastResponses.length > responses.length * 0.2) {
    patterns.push("rushed_responses");
  }

  if (tooSlowResponses.length > responses.length * 0.2) {
    patterns.push("overthinking");
  }

  // Calcula score de confiabilidade
  let reliabilityScore = 100;
  reliabilityScore -= inconsistentResponses.length * 5;
  reliabilityScore -= socialDesirableResponses.length * 3;
  reliabilityScore -= tooFastResponses.length * 2;
  reliabilityScore -= tooSlowResponses.length * 1;
  reliabilityScore = Math.max(0, Math.min(100, reliabilityScore));

  // Salva análise
  const analysisData: InsertResponsePatternAnalysis = {
    pirAssessmentId,
    consistencyScore,
    inconsistentResponsesCount: inconsistentResponses.length,
    socialDesirabilityScore,
    socialDesirableResponsesCount: socialDesirableResponses.length,
    averageResponseTime,
    tooFastResponsesCount: tooFastResponses.length,
    tooSlowResponsesCount: tooSlowResponses.length,
    patternsDetected: patterns,
    hasInconsistencies: inconsistentResponses.length > 0,
    hasSocialDesirability: socialDesirableResponses.length > 0,
    hasAnomalousTimings: tooFastResponses.length > 0 || tooSlowResponses.length > 0,
    reliabilityScore,
  };

  const result = await db.insert(responsePatternAnalysis).values(analysisData);

  const analysis = await db
    .select()
    .from(responsePatternAnalysis)
    .where(eq(responsePatternAnalysis.id, result[0].insertId))
    .limit(1);

  return analysis[0];
}

/**
 * Calcula indicadores de ética
 */
export async function calculateEthicsIndicators(
  pirAssessmentId: number
): Promise<EthicsIndicator> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Busca respostas com questões
  const responses = await db
    .select({
      response: integrityResponses,
      question: integrityQuestions,
    })
    .from(integrityResponses)
    .leftJoin(
      integrityQuestions,
      eq(integrityResponses.questionId, integrityQuestions.id)
    )
    .where(eq(integrityResponses.pirAssessmentId, pirAssessmentId));

  if (responses.length === 0) {
    throw new Error("No responses found for ethics calculation");
  }

  // Calcula scores por dimensão
  const ethicsQuestions = responses.filter((r) => r.question?.measuresEthics);
  const integrityQuestions = responses.filter((r) => r.question?.measuresIntegrity);
  const honestyQuestions = responses.filter((r) => r.question?.measuresHonesty);
  const reliabilityQuestions = responses.filter((r) => r.question?.measuresReliability);

  const calculateScore = (questions: typeof responses) => {
    if (questions.length === 0) return 0;
    const totalScore = questions.reduce((sum, q) => sum + (q.response.score || 0), 0);
    const maxScore = questions.length * 100;
    return Math.round((totalScore / maxScore) * 100);
  };

  const ethicsScore = calculateScore(ethicsQuestions);
  const integrityScore = calculateScore(integrityQuestions);
  const honestyScore = calculateScore(honestyQuestions);
  const reliabilityScore = calculateScore(reliabilityQuestions);

  // Score geral (média ponderada)
  const overallScore = Math.round(
    (ethicsScore + integrityScore + honestyScore + reliabilityScore) / 4
  );

  // Classificação
  let classification: "muito_baixo" | "baixo" | "medio" | "alto" | "muito_alto";
  if (overallScore >= 80) classification = "muito_alto";
  else if (overallScore >= 60) classification = "alto";
  else if (overallScore >= 40) classification = "medio";
  else if (overallScore >= 20) classification = "baixo";
  else classification = "muito_baixo";

  // Recomendação
  let recommendation = "";
  const alerts: string[] = [];

  if (overallScore >= 80) {
    recommendation =
      "Candidato demonstra alto nível de ética e integridade. Recomendado para posições de confiança.";
  } else if (overallScore >= 60) {
    recommendation =
      "Candidato demonstra bom nível de ética e integridade. Adequado para a maioria das posições.";
  } else if (overallScore >= 40) {
    recommendation =
      "Candidato demonstra nível médio de ética e integridade. Recomenda-se avaliação adicional.";
    alerts.push("Requer avaliação complementar");
  } else {
    recommendation =
      "Candidato demonstra baixo nível de ética e integridade. Não recomendado sem avaliação aprofundada.";
    alerts.push("Baixo score de integridade");
    alerts.push("Requer entrevista comportamental adicional");
  }

  // Alertas específicos
  if (ethicsScore < 50) alerts.push("Score de ética abaixo do esperado");
  if (integrityScore < 50) alerts.push("Score de integridade abaixo do esperado");
  if (honestyScore < 50) alerts.push("Score de honestidade abaixo do esperado");

  // Salva indicadores
  const indicatorData: InsertEthicsIndicator = {
    pirAssessmentId,
    ethicsScore,
    integrityScore,
    honestyScore,
    reliabilityScore,
    overallScore,
    classification,
    recommendation,
    alerts,
  };

  const result = await db.insert(ethicsIndicators).values(indicatorData);

  const indicator = await db
    .select()
    .from(ethicsIndicators)
    .where(eq(ethicsIndicators.id, result[0].insertId))
    .limit(1);

  return indicator[0];
}

/**
 * Obtém análise completa de integridade
 */
export async function getIntegrityAnalysis(pirAssessmentId: number): Promise<{
  responses: IntegrityResponse[];
  patternAnalysis: ResponsePatternAnalysis | null;
  ethicsIndicators: EthicsIndicator | null;
}> {
  const db = await getDb();
  if (!db) {
    return {
      responses: [],
      patternAnalysis: null,
      ethicsIndicators: null,
    };
  }

  const responses = await getIntegrityResponses(pirAssessmentId);

  const patternAnalysisResult = await db
    .select()
    .from(responsePatternAnalysis)
    .where(eq(responsePatternAnalysis.pirAssessmentId, pirAssessmentId))
    .limit(1);

  const ethicsIndicatorsResult = await db
    .select()
    .from(ethicsIndicators)
    .where(eq(ethicsIndicators.pirAssessmentId, pirAssessmentId))
    .limit(1);

  return {
    responses,
    patternAnalysis: patternAnalysisResult[0] || null,
    ethicsIndicators: ethicsIndicatorsResult[0] || null,
  };
}

/**
 * Verifica respostas cruzadas para detectar inconsistências
 */
export async function checkCrossValidation(
  pirAssessmentId: number
): Promise<{ inconsistencies: number; details: any[] }> {
  const db = await getDb();
  if (!db) {
    return { inconsistencies: 0, details: [] };
  }

  // Busca questões de verificação cruzada
  const crossValidationQuestions = await db
    .select()
    .from(integrityQuestions)
    .where(eq(integrityQuestions.isCrossValidation, true));

  const inconsistencies: any[] = [];

  for (const question of crossValidationQuestions) {
    if (!question.relatedQuestionId) continue;

    // Busca respostas das duas questões relacionadas
    const responses = await db
      .select()
      .from(integrityResponses)
      .where(
        and(
          eq(integrityResponses.pirAssessmentId, pirAssessmentId),
          sql`${integrityResponses.questionId} IN (${question.id}, ${question.relatedQuestionId})`
        )
      );

    if (responses.length === 2) {
      const [resp1, resp2] = responses;

      // Verifica se as respostas são consistentes
      // (lógica específica depende do tipo de questão)
      const isConsistent = Math.abs((resp1.responseValue || 0) - (resp2.responseValue || 0)) <= 1;

      if (!isConsistent) {
        inconsistencies.push({
          questionId: question.id,
          relatedQuestionId: question.relatedQuestionId,
          response1: resp1.response,
          response2: resp2.response,
        });

        // Marca respostas como inconsistentes
        await db
          .update(integrityResponses)
          .set({ isInconsistent: true })
          .where(eq(integrityResponses.id, resp1.id));

        await db
          .update(integrityResponses)
          .set({ isInconsistent: true })
          .where(eq(integrityResponses.id, resp2.id));
      }
    }
  }

  return {
    inconsistencies: inconsistencies.length,
    details: inconsistencies,
  };
}
