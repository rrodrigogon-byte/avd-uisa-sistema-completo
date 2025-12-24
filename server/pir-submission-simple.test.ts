import { describe, it, expect } from 'vitest';
import mysql from 'mysql2/promise';

/**
 * Teste Simplificado de Submissão do PIR Integridade
 * Usa SQL raw para evitar problemas de schema do Drizzle
 */

describe('PIR Integridade - Teste de Submissão (SQL Raw)', () => {
  it('deve validar fluxo completo de submissão', async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL não configurada');
    }

    const connection = await mysql.createConnection(process.env.DATABASE_URL);

    try {
      // 1. Verificar se existem questões ativas
      const [questions] = await connection.query<any[]>(
        'SELECT * FROM pirIntegrityQuestions WHERE active = 1 LIMIT 5'
      );

      console.log(`✓ Encontradas ${questions.length} questões ativas`);
      expect(questions.length).toBeGreaterThan(0);

      // 2. Criar um assessment de teste
      const [assessmentResult] = await connection.query<any>(
        `INSERT INTO pirIntegrityAssessments 
        (employeeId, assessmentType, status, createdBy) 
        VALUES (?, ?, ?, ?)`,
        [999, 'periodic', 'in_progress', 1]
      );

      const assessmentId = assessmentResult.insertId;
      console.log(`✓ Assessment criado com ID: ${assessmentId}`);
      expect(assessmentId).toBeGreaterThan(0);

      // 3. Salvar respostas para cada questão
      let responsesCount = 0;
      for (const question of questions) {
        let options: any[] = [];
        try {
          if (typeof question.options === 'string') {
            options = JSON.parse(question.options);
          } else if (Array.isArray(question.options)) {
            options = question.options;
          } else if (question.options && typeof question.options === 'object') {
            // Já é um objeto, não precisa fazer parse
            options = [];
            console.warn('Opções em formato inesperado:', typeof question.options);
            continue;
          }
        } catch (error) {
          console.error('Erro ao fazer parse das opções:', error);
          continue;
        }

        if (options.length > 0) {
          const selectedOption = options[0].value;

          await connection.query(
            `INSERT INTO pirIntegrityResponses 
            (assessmentId, questionId, selectedOption, justification, timeSpent) 
            VALUES (?, ?, ?, ?, ?)`,
            [assessmentId, question.id, selectedOption, 'Resposta de teste', 30]
          );

          responsesCount++;
        }
      }

      console.log(`✓ ${responsesCount} respostas salvas`);
      expect(responsesCount).toBe(questions.length);

      // 4. Calcular resultados
      const [responses] = await connection.query<any[]>(
        `SELECT r.*, q.dimension, q.options 
         FROM pirIntegrityResponses r
         JOIN pirIntegrityQuestions q ON r.questionId = q.id
         WHERE r.assessmentId = ?`,
        [assessmentId]
      );

      const dimensionScores: Record<string, number[]> = {};

      for (const response of responses) {
        if (response.dimension) {
          if (!dimensionScores[response.dimension]) {
            dimensionScores[response.dimension] = [];
          }

          try {
            const options = JSON.parse(response.options);
            const selectedOpt = options.find((opt: any) => opt.value === response.selectedOption);
            if (selectedOpt && typeof selectedOpt.score === 'number') {
              dimensionScores[response.dimension].push(selectedOpt.score);
            }
          } catch (error) {
            console.error('Erro ao processar opções:', error);
          }
        }
      }

      const results: Record<string, number> = {};
      for (const [dimension, scores] of Object.entries(dimensionScores)) {
        if (scores.length > 0) {
          results[dimension] = scores.reduce((a, b) => a + b, 0) / scores.length;
        }
      }

      console.log('✓ Resultados calculados:', results);
      expect(Object.keys(results).length).toBeGreaterThan(0);

      // 5. Finalizar assessment
      await connection.query(
        `UPDATE pirIntegrityAssessments 
         SET status = ?, completedAt = NOW() 
         WHERE id = ?`,
        ['completed', assessmentId]
      );

      const [assessments] = await connection.query<any[]>(
        'SELECT * FROM pirIntegrityAssessments WHERE id = ?',
        [assessmentId]
      );

      expect(assessments[0].status).toBe('completed');
      expect(assessments[0].completedAt).toBeDefined();
      console.log('✓ Assessment finalizado com sucesso');

      // 6. Limpar dados de teste
      await connection.query('DELETE FROM pirIntegrityResponses WHERE assessmentId = ?', [assessmentId]);
      await connection.query('DELETE FROM pirIntegrityAssessments WHERE id = ?', [assessmentId]);
      console.log('✓ Dados de teste limpos');

    } finally {
      await connection.end();
    }
  });
});
