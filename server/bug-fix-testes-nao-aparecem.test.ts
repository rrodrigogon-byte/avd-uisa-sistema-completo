import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import { getDb } from './db';
import { testResults, testInvitations, employees } from '../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Teste para validar correção do bug:
 * "Testes concluídos não aparecem na aba Testes do perfil do funcionário"
 * 
 * Problema: submitTestPublic salvava apenas na tabela psychometricTests (legada)
 * mas a interface busca na tabela testResults (nova)
 * 
 * Correção: Modificado submitTestPublic para salvar em AMBAS as tabelas
 */

describe('Bug Fix: Testes não aparecem na aba Testes', () => {
  let testEmployeeId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Buscar qualquer funcionário ativo com email para teste
    const employee = await db.select()
      .from(employees)
      .where(and(
        eq(employees.active, true),
      ))
      .limit(1);

    if (employee.length === 0) {
      throw new Error('Nenhum funcionário ativo encontrado para teste');
    }

    testEmployeeId = employee[0].id;
    console.log(`[Test] Usando funcionário ID ${testEmployeeId} (${employee[0].name}) para testes`);
  });

  it('deve salvar resultado do teste na tabela testResults', async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, openId: 'test', role: 'admin' },
      req: {} as any,
      res: {} as any,
    });

    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Buscar email do funcionário
    const employee = await db.select()
      .from(employees)
      .where(eq(employees.id, testEmployeeId))
      .limit(1);

    if (employee.length === 0 || !employee[0].email) {
      throw new Error('Funcionário sem email cadastrado');
    }

    // Contar resultados antes do teste
    const resultsBefore = await db.select()
      .from(testResults)
      .where(eq(testResults.employeeId, testEmployeeId));

    const countBefore = resultsBefore.length;

    // Simular respostas do teste DISC (20 questões)
    const responses = [];
    for (let i = 1; i <= 20; i++) {
      responses.push({
        questionId: i,
        score: Math.floor(Math.random() * 5) + 1, // Score entre 1 e 5
      });
    }

    // Submeter teste
    const result = await caller.psychometric.submitTestPublic({
      testType: 'disc',
      email: employee[0].email!,
      responses,
    });

    // Validar que teste foi concluído com sucesso
    expect(result.success).toBe(true);
    expect(result.employeeName).toBe(employee[0].name);

    // Aguardar um pouco para garantir que o banco salvou
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verificar que resultado foi salvo na tabela testResults
    const resultsAfter = await db.select()
      .from(testResults)
      .where(eq(testResults.employeeId, testEmployeeId))
      .orderBy(desc(testResults.completedAt));

    const countAfter = resultsAfter.length;

    // Deve ter um resultado a mais
    expect(countAfter).toBeGreaterThan(countBefore);

    // Verificar que o último resultado é do tipo DISC
    const latestResult = resultsAfter[0];
    expect(latestResult.testType).toBe('disc');
    expect(latestResult.employeeId).toBe(testEmployeeId);
    expect(latestResult.invitationId).toBeDefined();
    expect(latestResult.scores).toBeDefined();
    expect(latestResult.completedAt).toBeDefined();
  });

  it('deve retornar testes ao buscar resultados do funcionário', async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, openId: 'test', role: 'admin' },
      req: {} as any,
      res: {} as any,
    });

    // Buscar resultados do funcionário usando o procedure que a interface usa
    const results = await caller.psychometricTests.getEmployeeResults({
      employeeId: testEmployeeId,
    });

    // Deve retornar pelo menos um resultado
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);

    // Verificar estrutura do resultado
    const firstResult = results[0];
    expect(firstResult.id).toBeDefined();
    expect(firstResult.employeeId).toBe(testEmployeeId);
    expect(firstResult.testType).toBeDefined();
    expect(firstResult.completedAt).toBeDefined();
  });

  it('deve criar convite retroativo se não existir convite prévio', async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, openId: 'test', role: 'admin' },
      req: {} as any,
      res: {} as any,
    });

    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Buscar email do funcionário
    const employee = await db.select()
      .from(employees)
      .where(eq(employees.id, testEmployeeId))
      .limit(1);

    if (employee.length === 0 || !employee[0].email) {
      throw new Error('Funcionário sem email cadastrado');
    }

    // Contar convites antes
    const invitationsBefore = await db.select()
      .from(testInvitations)
      .where(eq(testInvitations.employeeId, testEmployeeId));

    const countBefore = invitationsBefore.length;

    // Simular respostas do teste Big Five
    const responses = [];
    for (let i = 1; i <= 20; i++) {
      responses.push({
        questionId: i,
        score: Math.floor(Math.random() * 5) + 1,
      });
    }

    // Submeter teste (sem convite prévio)
    await caller.psychometric.submitTestPublic({
      testType: 'bigfive',
      email: employee[0].email!,
      responses,
    });

    // Aguardar salvamento
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verificar que convite foi criado
    const invitationsAfter = await db.select()
      .from(testInvitations)
      .where(eq(testInvitations.employeeId, testEmployeeId))
      .orderBy(desc(testInvitations.createdAt));

    const countAfter = invitationsAfter.length;

    // Deve ter pelo menos um convite a mais
    expect(countAfter).toBeGreaterThan(countBefore);

    // Verificar que o último convite está concluído
    const latestInvitation = invitationsAfter[0];
    expect(latestInvitation.status).toBe('concluido');
    expect(latestInvitation.completedAt).toBeDefined();
  });

  it('deve validar que funcionário existe e tem testes', async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, openId: 'test', role: 'admin' },
      req: {} as any,
      res: {} as any,
    });

    // Buscar perfil completo do funcionário
    const profile = await caller.employees.getById({ id: testEmployeeId });

    expect(profile).toBeDefined();
    expect(profile.employee.id).toBe(testEmployeeId);
    expect(profile.employee.id).toBe(testEmployeeId);

    // Buscar testes do funcionário
    const tests = await caller.psychometricTests.getEmployeeResults({
      employeeId: testEmployeeId,
    });

    // Deve ter pelo menos 2 testes (DISC e Big Five que acabamos de criar)
    expect(tests.length).toBeGreaterThanOrEqual(2);

    // Verificar que temos testes de diferentes tipos
    const testTypes = tests.map(t => t.testType);
    expect(testTypes).toContain('disc');
    expect(testTypes).toContain('bigfive');
  });
});
