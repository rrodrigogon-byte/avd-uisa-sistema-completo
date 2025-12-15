/**
 * Job de Cálculo Automático de Scores
 * 
 * Calcula selfScore e managerScore baseado nas respostas de evaluationResponses
 * Executa diariamente para manter os scores atualizados
 */

import { getDb } from "../db";
import { evaluationResponses, performanceEvaluations } from "../../drizzle/schema";
import { eq, and, isNull, sql } from "drizzle-orm";

interface ScoreCalculation {
  evaluationId: number;
  selfScore: number | null;
  managerScore: number | null;
}

/**
 * Calcula a média das respostas de um avaliador específico
 */
async function calculateAverageScore(
  evaluationId: number,
  evaluatorType: "self" | "manager"
): Promise<number | null> {
  const db = await getDb();
  if (!db) {
    console.error("[Calculate Scores] Database não disponível");
    return null;
  }

  try {
    // Buscar todas as respostas do tipo especificado
    const responses = await db
      .select({
        score: evaluationResponses.score,
      })
      .from(evaluationResponses)
      .where(
        and(
          eq(evaluationResponses.evaluationId, evaluationId),
          eq(evaluationResponses.evaluatorType, evaluatorType),
          sql`${evaluationResponses.score} IS NOT NULL`
        )
      );

    if (responses.length === 0) {
      return null;
    }

    // Calcular média
    const total = responses.reduce((sum, r) => sum + (r.score || 0), 0);
    const average = total / responses.length;

    return Math.round(average * 100) / 100; // Arredondar para 2 casas decimais
  } catch (error) {
    console.error(`[Calculate Scores] Erro ao calcular score ${evaluatorType}:`, error);
    return null;
  }
}

/**
 * Atualiza os scores de uma avaliação
 */
async function updateEvaluationScores(evaluation: ScoreCalculation): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.error("[Calculate Scores] Database não disponível");
    return false;
  }

  try {
    await db
      .update(performanceEvaluations)
      .set({
        selfScore: evaluation.selfScore,
        managerScore: evaluation.managerScore,
        updatedAt: new Date(),
      })
      .where(eq(performanceEvaluations.id, evaluation.evaluationId));

    return true;
  } catch (error) {
    console.error("[Calculate Scores] Erro ao atualizar scores:", error);
    return false;
  }
}

/**
 * Processa todas as avaliações que precisam de cálculo de scores
 */
export async function calculateAllScores(): Promise<{
  processed: number;
  updated: number;
  errors: number;
}> {
  const db = await getDb();
  if (!db) {
    console.error("[Calculate Scores] Database não disponível");
    return { processed: 0, updated: 0, errors: 0 };
  }

  console.log("[Calculate Scores] Iniciando cálculo de scores...");

  try {
    // Buscar avaliações que precisam de cálculo
    // (avaliações com status diferente de "pendente" e que possuem respostas)
    const evaluations = await db
      .select({
        id: performanceEvaluations.id,
        status: performanceEvaluations.status,
      })
      .from(performanceEvaluations)
      .where(
        sql`${performanceEvaluations.status} IN ('em_andamento', 'concluido')`
      );

    console.log(`[Calculate Scores] ${evaluations.length} avaliações encontradas`);

    let processed = 0;
    let updated = 0;
    let errors = 0;

    for (const evaluation of evaluations) {
      processed++;

      // Calcular selfScore
      const selfScore = await calculateAverageScore(evaluation.id, "self");

      // Calcular managerScore
      const managerScore = await calculateAverageScore(evaluation.id, "manager");

      // Atualizar apenas se houver pelo menos um score calculado
      if (selfScore !== null || managerScore !== null) {
        const success = await updateEvaluationScores({
          evaluationId: evaluation.id,
          selfScore,
          managerScore,
        });

        if (success) {
          updated++;
          console.log(
            `[Calculate Scores] Avaliação ${evaluation.id}: selfScore=${selfScore}, managerScore=${managerScore}`
          );
        } else {
          errors++;
        }
      }
    }

    console.log(
      `[Calculate Scores] Concluído: ${processed} processadas, ${updated} atualizadas, ${errors} erros`
    );

    return { processed, updated, errors };
  } catch (error) {
    console.error("[Calculate Scores] Erro ao processar avaliações:", error);
    return { processed: 0, updated: 0, errors: 1 };
  }
}

/**
 * Calcula scores de uma avaliação específica
 */
export async function calculateScoresForEvaluation(evaluationId: number): Promise<boolean> {
  console.log(`[Calculate Scores] Calculando scores para avaliação ${evaluationId}`);

  const selfScore = await calculateAverageScore(evaluationId, "self");
  const managerScore = await calculateAverageScore(evaluationId, "manager");

  if (selfScore === null && managerScore === null) {
    console.log(`[Calculate Scores] Nenhum score disponível para avaliação ${evaluationId}`);
    return false;
  }

  const success = await updateEvaluationScores({
    evaluationId,
    selfScore,
    managerScore,
  });

  if (success) {
    console.log(
      `[Calculate Scores] Avaliação ${evaluationId} atualizada: selfScore=${selfScore}, managerScore=${managerScore}`
    );
  }

  return success;
}
