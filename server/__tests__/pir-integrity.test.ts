/**
 * Teste de Integridade PIR - Sistema AVD UISA
 * Valida todo o fluxo do teste PIR Integridade: dimensões Kohlberg, cálculos e armazenamento
 * 
 * 6 Dimensões do Modelo Kohlberg:
 * - HON: Honestidade
 * - CON: Confiabilidade
 * - RES: Resiliência Ética
 * - RSP: Responsabilidade
 * - JUS: Justiça
 * - COR: Coragem Moral
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import mysql from 'mysql2/promise';
import { 
  pirIntegrityDimensions,
  pirIntegrityQuestions,
} from '../../drizzle/schema';
import {
  calculatePIRIntegrityResult,
  calculateRawScores,
  normalizeScores,
  calculateOverallScore,
  classifyScores,
  determineRiskLevel,
  determineMoralLevel,
  getDominantDimension,
  getWeakestDimension,
  generateStrengths,
  generateWeaknesses,
  generateRecommendations,
  KOHLBERG_DIMENSIONS,
  type PIRIntegrityResponse,
  type KohlbergDimension,
} from '../pirIntegrityCalculations';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL não está definida');
}

const EXPECTED_DIMENSIONS: KohlbergDimension[] = ['HON', 'CON', 'RES', 'RSP', 'JUS', 'COR'];

describe('PIR Integridade - Modelo Kohlberg', () => {
  let db: ReturnType<typeof drizzle>;
  let connection: mysql.Connection;
  let activeDimensions: any[];
  let activeQuestions: any[];

  beforeAll(async () => {
    connection = await mysql.createConnection(DATABASE_URL);
    db = drizzle(connection);

    activeDimensions = await db
      .select()
      .from(pirIntegrityDimensions)
      .where(eq(pirIntegrityDimensions.active, true))
      .orderBy(pirIntegrityDimensions.displayOrder);

    // Questões não são necessárias para os testes de cálculo
    activeQuestions = [];
  });

  it('1. Deve ter exatamente 6 dimensões Kohlberg ativas', () => {
    expect(activeDimensions).toBeDefined();
    expect(activeDimensions.length).toBe(6);
  });

  it('2. Dimensões devem ter os códigos corretos (HON, CON, RES, RSP, JUS, COR)', () => {
    const codes = activeDimensions.map(d => d.code);
    
    expect(codes).toContain('HON');
    expect(codes).toContain('CON');
    expect(codes).toContain('RES');
    expect(codes).toContain('RSP');
    expect(codes).toContain('JUS');
    expect(codes).toContain('COR');
    
    expect(codes).not.toContain('IP');
    expect(codes).not.toContain('ID');
    expect(codes).not.toContain('IC');
    expect(codes).not.toContain('ES');
    expect(codes).not.toContain('FL');
    expect(codes).not.toContain('AU');
  });

  it('3. Dimensões devem ter nomes corretos em português', () => {
    const dimensionMap = Object.fromEntries(
      activeDimensions.map(d => [d.code, d.name])
    );

    expect(dimensionMap['HON']).toBe('Honestidade');
    expect(dimensionMap['CON']).toBe('Confiabilidade');
    expect(dimensionMap['RES']).toBe('Resiliência Ética');
    expect(dimensionMap['RSP']).toBe('Responsabilidade');
    expect(dimensionMap['JUS']).toBe('Justiça');
    expect(dimensionMap['COR']).toBe('Coragem Moral');
  });

  it('4. Deve calcular pontuações brutas corretamente', () => {
    const responses: PIRIntegrityResponse[] = [
      { questionId: 1, score: 80, moralLevel: 'conventional', dimensionCode: 'HON', timeSpent: 10 },
      { questionId: 2, score: 60, moralLevel: 'conventional', dimensionCode: 'HON', timeSpent: 12 },
      { questionId: 3, score: 90, moralLevel: 'post_conventional', dimensionCode: 'CON', timeSpent: 15 },
      { questionId: 4, score: 70, moralLevel: 'conventional', dimensionCode: 'CON', timeSpent: 8 },
      { questionId: 5, score: 50, moralLevel: 'pre_conventional', dimensionCode: 'RES', timeSpent: 20 },
      { questionId: 6, score: 85, moralLevel: 'post_conventional', dimensionCode: 'RSP', timeSpent: 11 },
      { questionId: 7, score: 75, moralLevel: 'conventional', dimensionCode: 'JUS', timeSpent: 14 },
      { questionId: 8, score: 65, moralLevel: 'conventional', dimensionCode: 'COR', timeSpent: 9 },
    ];

    const rawScores = calculateRawScores(responses);

    expect(rawScores.HON).toBe(70);
    expect(rawScores.CON).toBe(80);
    expect(rawScores.RES).toBe(50);
    expect(rawScores.RSP).toBe(85);
    expect(rawScores.JUS).toBe(75);
    expect(rawScores.COR).toBe(65);
  });

  it('5. Deve normalizar pontuações para escala 0-100', () => {
    const rawScores = { HON: 70, CON: 80, RES: 50, RSP: 85, JUS: 75, COR: 65 };
    const normalized = normalizeScores(rawScores);

    Object.values(normalized).forEach(value => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    });
  });

  it('6. Deve calcular score geral corretamente', () => {
    const scores = { HON: 70, CON: 80, RES: 50, RSP: 85, JUS: 75, COR: 65 };
    const overall = calculateOverallScore(scores);

    expect(overall).toBe(71);
  });

  it('7. Deve classificar dimensões corretamente (Baixo/Médio/Alto)', () => {
    const scores = { HON: 75, CON: 45, RES: 30, RSP: 85, JUS: 60, COR: 70 };
    const classifications = classifyScores(scores);

    expect(classifications.HON).toBe('Alto');
    expect(classifications.CON).toBe('Médio');
    expect(classifications.RES).toBe('Baixo');
    expect(classifications.RSP).toBe('Alto');
    expect(classifications.JUS).toBe('Médio');
    expect(classifications.COR).toBe('Alto');
  });

  it('8. Deve determinar nível de risco corretamente', () => {
    expect(determineRiskLevel(85)).toBe('low');
    expect(determineRiskLevel(70)).toBe('moderate');
    expect(determineRiskLevel(50)).toBe('high');
    expect(determineRiskLevel(30)).toBe('critical');
  });

  it('9. Deve determinar nível moral predominante', () => {
    const postConventional: PIRIntegrityResponse[] = [
      { questionId: 1, score: 90, moralLevel: 'post_conventional', dimensionCode: 'HON' },
      { questionId: 2, score: 85, moralLevel: 'post_conventional', dimensionCode: 'CON' },
      { questionId: 3, score: 80, moralLevel: 'post_conventional', dimensionCode: 'RES' },
      { questionId: 4, score: 70, moralLevel: 'conventional', dimensionCode: 'RSP' },
      { questionId: 5, score: 75, moralLevel: 'conventional', dimensionCode: 'JUS' },
    ];
    expect(determineMoralLevel(postConventional)).toBe('post_conventional');

    const conventional: PIRIntegrityResponse[] = [
      { questionId: 1, score: 70, moralLevel: 'conventional', dimensionCode: 'HON' },
      { questionId: 2, score: 65, moralLevel: 'conventional', dimensionCode: 'CON' },
      { questionId: 3, score: 60, moralLevel: 'conventional', dimensionCode: 'RES' },
      { questionId: 4, score: 50, moralLevel: 'pre_conventional', dimensionCode: 'RSP' },
      { questionId: 5, score: 80, moralLevel: 'post_conventional', dimensionCode: 'JUS' },
    ];
    expect(determineMoralLevel(conventional)).toBe('conventional');
  });

  it('10. Deve identificar dimensão dominante e mais fraca', () => {
    const scores = { HON: 70, CON: 90, RES: 50, RSP: 85, JUS: 60, COR: 45 };
    
    expect(getDominantDimension(scores)).toBe('CON');
    expect(getWeakestDimension(scores)).toBe('COR');
  });
});
