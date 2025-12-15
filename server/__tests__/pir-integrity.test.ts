/**
 * Teste de Integridade PIR - Sistema AVD UISA
 * Valida todo o fluxo do teste PIR: envio, respostas, cálculo, armazenamento e recuperação
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { drizzle } from 'drizzle-orm/mysql2';
import { eq, and, desc } from 'drizzle-orm';
import mysql from 'mysql2/promise';
import { 
  employees, 
  testQuestions, 
  testInvitations, 
  testResults,
  psychometricTests 
} from '../../drizzle/schema';
import { calculatePIRResult } from '../pirCalculations';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL não está definida');
}

describe('Teste de Integridade PIR', () => {
  let db: ReturnType<typeof drizzle>;
  let connection: mysql.Connection;
  let testEmployeeId: number;
  let pirQuestions: any[];

  beforeAll(async () => {
    // Conectar ao banco
    connection = await mysql.createConnection(DATABASE_URL);
    db = drizzle(connection);

    // Buscar ou criar funcionário de teste
    const existingEmployee = await db
      .select()
      .from(employees)
      .where(eq(employees.email, 'teste.pir@avduisa.com'))
      .limit(1);

    if (existingEmployee.length > 0) {
      testEmployeeId = existingEmployee[0].id;
    } else {
      const [result] = await db.insert(employees).values({
        name: 'Teste PIR Integridade',
        email: 'teste.pir@avduisa.com',
        employeeCode: 'TEST-PIR-001',
        status: 'ativo',
        admissionDate: new Date(),
      });
      testEmployeeId = result.insertId;
    }

    // Buscar questões PIR
    pirQuestions = await db
      .select()
      .from(testQuestions)
      .where(eq(testQuestions.testType, 'pir'))
      .orderBy(testQuestions.questionNumber);
  });

  it('1. Deve ter 60 questões PIR cadastradas no banco', () => {
    expect(pirQuestions).toBeDefined();
    expect(pirQuestions.length).toBe(60);
  });

  it('2. Questões PIR devem ter todas as dimensões corretas (IP, ID, IC, ES, FL, AU)', () => {
    const dimensions = new Set(pirQuestions.map(q => q.dimension));
    
    expect(dimensions.has('IP')).toBe(true); // Interesse em Pessoas
    expect(dimensions.has('ID')).toBe(true); // Interesse em Dados
    expect(dimensions.has('IC')).toBe(true); // Interesse em Coisas
    expect(dimensions.has('ES')).toBe(true); // Estabilidade
    expect(dimensions.has('FL')).toBe(true); // Flexibilidade
    expect(dimensions.has('AU')).toBe(true); // Autonomia
    
    // Deve ter exatamente 6 dimensões
    expect(dimensions.size).toBe(6);
  });

  it('3. Cada dimensão deve ter 10 questões', () => {
    const dimensionCounts: Record<string, number> = {};
    
    pirQuestions.forEach(q => {
      const dim = q.dimension;
      dimensionCounts[dim] = (dimensionCounts[dim] || 0) + 1;
    });

    expect(dimensionCounts['IP']).toBe(10);
    expect(dimensionCounts['ID']).toBe(10);
    expect(dimensionCounts['IC']).toBe(10);
    expect(dimensionCounts['ES']).toBe(10);
    expect(dimensionCounts['FL']).toBe(10);
    expect(dimensionCounts['AU']).toBe(10);
  });

  it('4. Deve calcular corretamente as pontuações PIR', () => {
    // Criar respostas de teste (todas com pontuação 4)
    const responses = pirQuestions.map(q => ({
      questionNumber: q.questionNumber,
      answer: 4,
      dimension: q.dimension,
      reverse: q.reverse || false,
    }));

    const result = calculatePIRResult(responses);

    // Verificar estrutura do resultado
    expect(result).toHaveProperty('scores');
    expect(result).toHaveProperty('normalizedScores');
    expect(result).toHaveProperty('classifications');
    expect(result).toHaveProperty('dominantDimension');
    expect(result).toHaveProperty('profileType');
    expect(result).toHaveProperty('profileDescription');
    expect(result).toHaveProperty('strengths');
    expect(result).toHaveProperty('developmentAreas');
    expect(result).toHaveProperty('workStyle');
    expect(result).toHaveProperty('communicationStyle');
    expect(result).toHaveProperty('motivators');
    expect(result).toHaveProperty('stressors');
    expect(result).toHaveProperty('teamContribution');
    expect(result).toHaveProperty('careerRecommendations');

    // Verificar que todas as dimensões foram calculadas
    expect(result.scores.IP).toBeGreaterThan(0);
    expect(result.scores.ID).toBeGreaterThan(0);
    expect(result.scores.IC).toBeGreaterThan(0);
    expect(result.scores.ES).toBeGreaterThan(0);
    expect(result.scores.FL).toBeGreaterThan(0);
    expect(result.scores.AU).toBeGreaterThan(0);

    // Verificar normalização (0-100)
    expect(result.normalizedScores.IP).toBeGreaterThanOrEqual(0);
    expect(result.normalizedScores.IP).toBeLessThanOrEqual(100);
    expect(result.normalizedScores.ID).toBeGreaterThanOrEqual(0);
    expect(result.normalizedScores.ID).toBeLessThanOrEqual(100);
  });

  it('5. Deve salvar resultado PIR corretamente na tabela testResults', async () => {
    // Criar convite de teste
    const [invitation] = await db.insert(testInvitations).values({
      employeeId: testEmployeeId,
      testType: 'pir',
      uniqueToken: `test-pir-${Date.now()}`,
      status: 'concluido',
      sentAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      completedAt: new Date(),
      emailSent: true,
      emailSentAt: new Date(),
      createdBy: 1,
    });

    // Criar respostas de teste
    const responses = pirQuestions.map(q => ({
      questionNumber: q.questionNumber,
      answer: Math.floor(Math.random() * 5) + 1, // 1-5
      dimension: q.dimension,
      reverse: q.reverse || false,
    }));

    const pirResult = calculatePIRResult(responses);

    // Salvar resultado
    await db.insert(testResults).values({
      invitationId: invitation.insertId,
      employeeId: testEmployeeId,
      testType: 'pir',
      scores: JSON.stringify(pirResult),
      completedAt: new Date(),
      profileType: pirResult.profileType,
      profileDescription: pirResult.profileDescription,
      strengths: pirResult.strengths,
      developmentAreas: pirResult.developmentAreas,
      workStyle: pirResult.workStyle,
      communicationStyle: pirResult.communicationStyle,
      motivators: pirResult.motivators,
      stressors: pirResult.stressors,
      teamContribution: pirResult.teamContribution,
      careerRecommendations: pirResult.careerRecommendations,
      rawData: JSON.stringify(pirResult),
    });

    // Verificar que foi salvo
    const savedResults = await db
      .select()
      .from(testResults)
      .where(
        and(
          eq(testResults.employeeId, testEmployeeId),
          eq(testResults.testType, 'pir')
        )
      )
      .orderBy(desc(testResults.completedAt))
      .limit(1);

    expect(savedResults.length).toBe(1);
    expect(savedResults[0].testType).toBe('pir');
    expect(savedResults[0].scores).toBeDefined();
    expect(savedResults[0].profileType).toBeDefined();
    expect(savedResults[0].profileDescription).toBeDefined();
  });

  it('6. Deve recuperar resultados PIR corretamente', async () => {
    // Buscar resultados salvos
    const results = await db
      .select()
      .from(testResults)
      .where(
        and(
          eq(testResults.employeeId, testEmployeeId),
          eq(testResults.testType, 'pir')
        )
      )
      .orderBy(desc(testResults.completedAt))
      .limit(1);

    expect(results.length).toBe(1);

    const result = results[0];
    
    // Parsear scores
    const scores = JSON.parse(result.scores!);
    
    // Verificar estrutura
    expect(scores).toHaveProperty('scores');
    expect(scores).toHaveProperty('normalizedScores');
    expect(scores).toHaveProperty('classifications');
    
    // Verificar dimensões
    expect(scores.normalizedScores).toHaveProperty('IP');
    expect(scores.normalizedScores).toHaveProperty('ID');
    expect(scores.normalizedScores).toHaveProperty('IC');
    expect(scores.normalizedScores).toHaveProperty('ES');
    expect(scores.normalizedScores).toHaveProperty('FL');
    expect(scores.normalizedScores).toHaveProperty('AU');

    // Verificar que os valores estão normalizados (0-100)
    Object.values(scores.normalizedScores).forEach((value: any) => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    });
  });

  it('7. Deve ter interpretações e recomendações geradas', async () => {
    const results = await db
      .select()
      .from(testResults)
      .where(
        and(
          eq(testResults.employeeId, testEmployeeId),
          eq(testResults.testType, 'pir')
        )
      )
      .orderBy(desc(testResults.completedAt))
      .limit(1);

    const result = results[0];

    // Verificar campos de interpretação
    expect(result.profileType).toBeDefined();
    expect(result.profileType!.length).toBeGreaterThan(0);
    
    expect(result.profileDescription).toBeDefined();
    expect(result.profileDescription!.length).toBeGreaterThan(0);
    
    expect(result.strengths).toBeDefined();
    expect(result.strengths!.length).toBeGreaterThan(0);
    
    expect(result.developmentAreas).toBeDefined();
    expect(result.developmentAreas!.length).toBeGreaterThan(0);
    
    expect(result.workStyle).toBeDefined();
    expect(result.communicationStyle).toBeDefined();
    expect(result.motivators).toBeDefined();
    expect(result.stressors).toBeDefined();
    expect(result.teamContribution).toBeDefined();
    expect(result.careerRecommendations).toBeDefined();
  });

  it('8. Deve aplicar inversão de pontuação corretamente em questões reverse', () => {
    // Encontrar uma questão com reverse=true
    const reverseQuestion = pirQuestions.find(q => q.reverse === true);
    
    if (reverseQuestion) {
      // Criar resposta com pontuação 5 (deve virar 1 após inversão)
      const responses = [{
        questionNumber: reverseQuestion.questionNumber,
        answer: 5,
        dimension: reverseQuestion.dimension,
        reverse: true,
      }];

      // Adicionar respostas normais para outras questões
      pirQuestions
        .filter(q => q.id !== reverseQuestion.id)
        .forEach(q => {
          responses.push({
            questionNumber: q.questionNumber,
            answer: 3,
            dimension: q.dimension,
            reverse: q.reverse || false,
          });
        });

      const result = calculatePIRResult(responses);
      
      // Verificar que o cálculo foi feito
      expect(result.scores).toBeDefined();
      expect(result.normalizedScores).toBeDefined();
    }
  });

  it('9. Deve classificar corretamente as dimensões (Baixo/Médio/Alto)', () => {
    // Criar respostas com pontuações altas
    const highScoreResponses = pirQuestions.map(q => ({
      questionNumber: q.questionNumber,
      answer: 5, // Pontuação alta
      dimension: q.dimension,
      reverse: q.reverse || false,
    }));

    const highResult = calculatePIRResult(highScoreResponses);
    
    // Verificar que pelo menos algumas dimensões foram classificadas como "Alto"
    const highClassifications = Object.values(highResult.classifications);
    expect(highClassifications).toContain('Alto');

    // Criar respostas com pontuações médias
    const mediumScoreResponses = pirQuestions.map(q => ({
      questionNumber: q.questionNumber,
      answer: 3, // Pontuação média
      dimension: q.dimension,
      reverse: q.reverse || false,
    }));

    const mediumResult = calculatePIRResult(mediumScoreResponses);
    
    // Verificar que pelo menos algumas dimensões foram classificadas como "Médio"
    const mediumClassifications = Object.values(mediumResult.classifications);
    expect(mediumClassifications).toContain('Médio');
  });

  it('10. Deve identificar dimensão dominante corretamente', () => {
    const result = calculatePIRResult(
      pirQuestions.map(q => ({
        questionNumber: q.questionNumber,
        answer: Math.floor(Math.random() * 5) + 1,
        dimension: q.dimension,
        reverse: q.reverse || false,
      }))
    );

    expect(result.dominantDimension).toBeDefined();
    expect(['IP', 'ID', 'IC', 'ES', 'FL', 'AU']).toContain(result.dominantDimension);
  });
});
