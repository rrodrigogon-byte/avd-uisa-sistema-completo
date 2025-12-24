import { describe, it, expect, beforeAll } from 'vitest';
import { drizzle } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { pirIntegrityAssessments, pirIntegrityResponses, pirIntegrityQuestions } from '../drizzle/schema';

/**
 * Teste de Submissão Completa do PIR Integridade
 * 
 * Este teste valida:
 * 1. Criação de assessment
 * 2. Salvamento de respostas
 * 3. Cálculo de resultados
 * 4. Finalização da avaliação
 */

describe('PIR Integridade - Submissão Completa', () => {
  let db: ReturnType<typeof drizzle>;
  let testAssessmentId: number;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL não configurada');
    }
    db = drizzle(process.env.DATABASE_URL);
  });

  it('deve criar um assessment de teste', async () => {
    // Criar assessment
    const [assessment] = await db.insert(pirIntegrityAssessments).values({
      employeeId: 999,
      employeeName: 'Teste Submissão',
      employeeEmail: 'teste@example.com',
      token: `test_submission_${Date.now()}`,
      status: 'in_progress',
      createdBy: 1,
    });

    expect(assessment).toBeDefined();
    testAssessmentId = assessment.insertId;
  });

  it('deve buscar questões ativas', async () => {
    const questions = await db
      .select()
      .from(pirIntegrityQuestions)
      .where(eq(pirIntegrityQuestions.active, true))
      .limit(5);

    expect(questions.length).toBeGreaterThan(0);
    console.log(`✓ Encontradas ${questions.length} questões ativas`);
  });

  it('deve salvar respostas para cada questão', async () => {
    // Buscar questões
    const questions = await db
      .select()
      .from(pirIntegrityQuestions)
      .where(eq(pirIntegrityQuestions.active, true))
      .limit(5);

    // Salvar respostas para cada questão
    for (const question of questions) {
      let options: any[] = [];
      try {
        if (typeof question.options === 'string') {
          options = JSON.parse(question.options);
        } else if (Array.isArray(question.options)) {
          options = question.options;
        }
      } catch (error) {
        console.error('Erro ao fazer parse das opções:', error);
      }

      if (options.length > 0) {
        const selectedOption = options[0].value; // Selecionar primeira opção

        await db.insert(pirIntegrityResponses).values({
          assessmentId: testAssessmentId,
          questionId: question.id,
          selectedOption,
          justification: 'Resposta de teste',
          timeSpent: 30,
        });

        console.log(`✓ Resposta salva para questão ${question.id}`);
      }
    }

    // Verificar se respostas foram salvas
    const responses = await db
      .select()
      .from(pirIntegrityResponses)
      .where(eq(pirIntegrityResponses.assessmentId, testAssessmentId));

    expect(responses.length).toBe(questions.length);
    console.log(`✓ Total de ${responses.length} respostas salvas`);
  });

  it('deve calcular resultados corretamente', async () => {
    // Buscar respostas
    const responses = await db
      .select()
      .from(pirIntegrityResponses)
      .where(eq(pirIntegrityResponses.assessmentId, testAssessmentId));

    // Buscar questões com dimensões
    const questions = await db
      .select()
      .from(pirIntegrityQuestions)
      .where(eq(pirIntegrityQuestions.active, true))
      .limit(5);

    // Calcular pontuação por dimensão
    const dimensionScores: Record<string, number[]> = {};

    for (const response of responses) {
      const question = questions.find(q => q.id === response.questionId);
      if (question && question.dimension) {
        if (!dimensionScores[question.dimension]) {
          dimensionScores[question.dimension] = [];
        }

        // Extrair pontuação da opção selecionada
        let options: any[] = [];
        try {
          if (typeof question.options === 'string') {
            options = JSON.parse(question.options);
          } else if (Array.isArray(question.options)) {
            options = question.options;
          }
        } catch (error) {
          console.error('Erro ao fazer parse das opções:', error);
        }

        const selectedOpt = options.find(opt => opt.value === response.selectedOption);
        if (selectedOpt && typeof selectedOpt.score === 'number') {
          dimensionScores[question.dimension].push(selectedOpt.score);
        }
      }
    }

    // Calcular médias
    const results: Record<string, number> = {};
    for (const [dimension, scores] of Object.entries(dimensionScores)) {
      if (scores.length > 0) {
        results[dimension] = scores.reduce((a, b) => a + b, 0) / scores.length;
      }
    }

    console.log('✓ Resultados calculados:', results);
    expect(Object.keys(results).length).toBeGreaterThan(0);
  });

  it('deve finalizar assessment com sucesso', async () => {
    // Atualizar status para completed
    await db
      .update(pirIntegrityAssessments)
      .set({
        status: 'completed',
        completedAt: new Date(),
      })
      .where(eq(pirIntegrityAssessments.id, testAssessmentId));

    // Verificar se foi atualizado
    const [assessment] = await db
      .select()
      .from(pirIntegrityAssessments)
      .where(eq(pirIntegrityAssessments.id, testAssessmentId));

    expect(assessment.status).toBe('completed');
    expect(assessment.completedAt).toBeDefined();
    console.log('✓ Assessment finalizado com sucesso');
  });

  it('deve limpar dados de teste', async () => {
    // Deletar respostas
    await db
      .delete(pirIntegrityResponses)
      .where(eq(pirIntegrityResponses.assessmentId, testAssessmentId));

    // Deletar assessment
    await db
      .delete(pirIntegrityAssessments)
      .where(eq(pirIntegrityAssessments.id, testAssessmentId));

    console.log('✓ Dados de teste limpos');
  });
});
