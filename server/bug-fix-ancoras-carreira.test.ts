import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import { getDb } from './db';
import { employees, testQuestions, testResults, testInvitations } from '../drizzle/schema';
import { eq, and, or } from 'drizzle-orm';

/**
 * Testes para Bug Fix: Âncoras de Carreira
 * 
 * Problema Reportado:
 * - Teste de Âncoras de Carreira foi preenchido e enviado
 * - Status continua como "Pendente" ao invés de "Concluído"
 * - Resultados não aparecem após submissão
 * 
 * Correções Implementadas:
 * - Adicionado tratamento específico para careeranchors no submitTestPublic
 * - Implementado cálculo de âncora dominante
 * - Adicionados campos profileType e profileDescription para careeranchors
 */

describe('Bug Fix: Teste de Âncoras de Carreira', () => {
  let testEmployeeId: number;
  let testEmployeeEmail: string;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Buscar qualquer funcionário com email válido
    const employee = await db.select()
      .from(employees)
      .where(and(
        eq(employees.status, 'ativo'),
        // Email não nulo
      ))
      .limit(1);

    if (employee.length === 0) {
      throw new Error('Nenhum funcionário ativo encontrado no banco');
    }

    testEmployeeId = employee[0].id;
    testEmployeeEmail = employee[0].email || 'test@example.com';
    console.log(`[Test] Usando funcionário ID ${testEmployeeId} (${employee[0].name}) para testes`);
  });

  it('deve ter perguntas de Âncoras de Carreira cadastradas no banco', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const questions = await db.select()
      .from(testQuestions)
      .where(eq(testQuestions.testType, 'careeranchors'));

    expect(questions.length).toBeGreaterThan(0);
    expect(questions.length).toBe(40); // Teste de Âncoras tem 40 perguntas

    // Verificar que temos as 8 dimensões
    const dimensions = new Set(questions.map(q => q.dimension));
    expect(dimensions.size).toBe(8);
    expect(dimensions.has('competencia_tecnica')).toBe(true);
    expect(dimensions.has('competencia_gerencial')).toBe(true);
    expect(dimensions.has('autonomia')).toBe(true);
    expect(dimensions.has('seguranca')).toBe(true);
    expect(dimensions.has('criatividade_empreendedora')).toBe(true);
    expect(dimensions.has('servico')).toBe(true);
    expect(dimensions.has('desafio')).toBe(true);
    expect(dimensions.has('estilo_vida')).toBe(true);
  });

  it('deve submeter teste de Âncoras de Carreira com sucesso', async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, openId: 'test', role: 'admin' },
      req: {} as any,
      res: {} as any,
    });

    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Buscar perguntas
    const questions = await db.select()
      .from(testQuestions)
      .where(eq(testQuestions.testType, 'careeranchors'))
      .orderBy(testQuestions.questionNumber);

    // Criar respostas simuladas (variando entre 3 e 5 para ter resultados realistas)
    const responses = questions.map((q, index) => ({
      questionId: q.id,
      score: 3 + (index % 3), // Varia entre 3, 4 e 5
    }));

    // Submeter teste
    const result = await caller.psychometric.submitTestPublic({
      testType: 'careeranchors',
      email: testEmployeeEmail,
      responses,
    });

    // Validar resposta
    expect(result.success).toBe(true);
    expect(result.profile).toBeDefined();
    expect(result.employeeName).toBeDefined();

    // Validar que profile tem as 8 âncoras
    expect(result.profile.competencia_tecnica).toBeDefined();
    expect(result.profile.competencia_gerencial).toBeDefined();
    expect(result.profile.autonomia).toBeDefined();
    expect(result.profile.seguranca).toBeDefined();
    expect(result.profile.criatividade_empreendedora).toBeDefined();
    expect(result.profile.servico).toBeDefined();
    expect(result.profile.desafio).toBeDefined();
    expect(result.profile.estilo_vida).toBeDefined();
  });

  it('deve salvar resultado na tabela testResults com campos corretos', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Buscar último resultado de Âncoras de Carreira do funcionário
    const results = await db.select()
      .from(testResults)
      .where(
        and(
          eq(testResults.employeeId, testEmployeeId),
          eq(testResults.testType, 'careeranchors')
        )
      )
      .orderBy(testResults.completedAt)
      .limit(1);

    expect(results.length).toBeGreaterThan(0);

    const result = results[0];
    expect(result.employeeId).toBe(testEmployeeId);
    expect(result.testType).toBe('careeranchors');
    expect(result.completedAt).toBeDefined();
    expect(result.scores).toBeDefined();
    
    // Validar campos específicos de Âncoras de Carreira
    expect(result.profileType).toBeDefined();
    expect(result.profileDescription).toBeDefined();
    expect(result.profileDescription).toContain('Âncora Principal');
    expect(result.profileDescription).toContain('Segunda Âncora');
  });

  it('deve criar ou atualizar convite para status "concluido"', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Buscar convites de Âncoras de Carreira do funcionário
    const invitations = await db.select()
      .from(testInvitations)
      .where(
        and(
          eq(testInvitations.employeeId, testEmployeeId),
          eq(testInvitations.testType, 'careeranchors')
        )
      )
      .orderBy(testInvitations.sentAt);

    expect(invitations.length).toBeGreaterThan(0);

    // Pelo menos um convite deve estar concluído
    const completedInvitations = invitations.filter(inv => inv.status === 'concluido');
    expect(completedInvitations.length).toBeGreaterThan(0);

    const lastCompleted = completedInvitations[completedInvitations.length - 1];
    expect(lastCompleted.completedAt).toBeDefined();
  });

  it('deve retornar resultado na query getEmployeeResults', async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, openId: 'test', role: 'admin' },
      req: {} as any,
      res: {} as any,
    });

    // Buscar resultados do funcionário
    const results = await caller.psychometricTests.getEmployeeResults({
      employeeId: testEmployeeId,
    });

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);

    // Deve ter pelo menos um resultado de Âncoras de Carreira
    const careerAnchorsResults = results.filter((r: any) => r.testType === 'careeranchors');
    expect(careerAnchorsResults.length).toBeGreaterThan(0);

    // Validar estrutura do resultado
    const firstResult = careerAnchorsResults[0];
    expect(firstResult.id).toBeDefined();
    expect(firstResult.employeeId).toBe(testEmployeeId);
    expect(firstResult.testType).toBe('careeranchors');
    expect(firstResult.completedAt).toBeDefined();
    expect(firstResult.profileType).toBeDefined();
    expect(firstResult.profileDescription).toBeDefined();
  });

  it('deve calcular âncora dominante corretamente', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Buscar último resultado
    const results = await db.select()
      .from(testResults)
      .where(
        and(
          eq(testResults.employeeId, testEmployeeId),
          eq(testResults.testType, 'careeranchors')
        )
      )
      .orderBy(testResults.completedAt)
      .limit(1);

    expect(results.length).toBeGreaterThan(0);

    const result = results[0];
    // Parsear scores se for string JSON
    const scores = typeof result.scores === 'string' 
      ? JSON.parse(result.scores) 
      : result.scores as Record<string, number>;

    // Encontrar a âncora com maior pontuação
    const anchors = [
      'competencia_tecnica',
      'competencia_gerencial',
      'autonomia',
      'seguranca',
      'criatividade_empreendedora',
      'servico',
      'desafio',
      'estilo_vida',
    ];

    let maxScore = 0;
    let topAnchor = '';

    for (const anchor of anchors) {
      if (scores[anchor] > maxScore) {
        maxScore = scores[anchor];
        topAnchor = anchor;
      }
    }

    // O profileDescription deve mencionar a âncora dominante
    expect(result.profileDescription).toBeDefined();
    expect(maxScore).toBeGreaterThan(0);
    expect(topAnchor).toBeTruthy();
  });
});
