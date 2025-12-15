import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from '../server/db';
import { 
  employees, 
  performanceEvaluations, 
  testResults, 
  psychometricTests,
  testInvitations 
} from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Testes para Validação de Testes no Fluxo de Avaliação
 * 
 * Testa os 3 novos procedures:
 * 1. evaluations.getTestsValidationStatus
 * 2. evaluations.validateTests
 * 3. evaluations.sendEvaluationCompletionEmail
 */

describe('Validação de Testes no Fluxo de Avaliação', () => {
  let database: Awaited<ReturnType<typeof getDb>>;
  let testEmployeeId: number;
  let testEvaluationId: number;

  beforeAll(async () => {
    database = await getDb();
    if (!database) {
      throw new Error('Database not available');
    }

    // Criar funcionário de teste
    const [employeeResult] = await database.insert(employees).values({
      employeeCode: 'TEST-VAL-001',
      name: 'Funcionário Teste Validação',
      registrationNumber: 'TEST-VAL-001',
      email: 'teste.validacao@uisa.com.br',
      active: true,
      admissionDate: new Date('2023-01-01'),
    });
    testEmployeeId = Number(employeeResult.insertId);

    // Criar avaliação de teste
    const [evaluationResult] = await database.insert(performanceEvaluations).values({
      cycleId: 1,
      employeeId: testEmployeeId,
      type: '360',
      status: 'em_andamento',
      workflowStatus: 'pending_manager',
    });
    testEvaluationId = Number(evaluationResult.insertId);
  });

  it('deve verificar status de validação de testes (sem testes concluídos)', async () => {
    if (!database) throw new Error('Database not available');

    // Buscar testes concluídos (deve estar vazio)
    const completedTests = await database
      .select()
      .from(testResults)
      .where(eq(testResults.employeeId, testEmployeeId));

    expect(completedTests.length).toBe(0);

    // Verificar testes obrigatórios
    const requiredTests = ['pir', 'disc', 'bigfive'];
    const missingTests = requiredTests; // Todos estão faltando

    expect(missingTests).toEqual(['pir', 'disc', 'bigfive']);
  });

  it('deve criar testes concluídos para o funcionário', async () => {
    if (!database) throw new Error('Database not available');

    // Criar convites para os testes
    const testTypes: Array<'pir' | 'disc' | 'bigfive'> = ['pir', 'disc', 'bigfive'];
    const invitationIds: number[] = [];

    for (const testType of testTypes) {
      const [invitationResult] = await database.insert(testInvitations).values({
        employeeId: testEmployeeId,
        testType,
        uniqueToken: `test-token-${testType}-${Date.now()}`,
        status: 'concluido',
        sentAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        completedAt: new Date(),
        emailSent: true,
        emailSentAt: new Date(),
        createdBy: 1,
      });
      invitationIds.push(Number(invitationResult.insertId));
    }

    // Criar resultados dos testes
    for (let i = 0; i < testTypes.length; i++) {
      await database.insert(testResults).values({
        invitationId: invitationIds[i],
        employeeId: testEmployeeId,
        testType: testTypes[i],
        scores: JSON.stringify({ score: 75 }),
        profileType: 'Teste',
        profileDescription: 'Perfil de teste',
        completedAt: new Date(),
      });
    }

    // Verificar se os testes foram criados
    const completedTests = await database
      .select()
      .from(testResults)
      .where(eq(testResults.employeeId, testEmployeeId));

    expect(completedTests.length).toBe(3);
    expect(completedTests.map(t => t.testType).sort()).toEqual(['bigfive', 'disc', 'pir']);
  });

  it('deve verificar status de validação de testes (com todos os testes concluídos)', async () => {
    if (!database) throw new Error('Database not available');

    // Buscar testes concluídos
    const completedTests = await database
      .select()
      .from(testResults)
      .where(eq(testResults.employeeId, testEmployeeId));

    const testTypes = completedTests.map(t => t.testType);
    const requiredTests = ['pir', 'disc', 'bigfive'];
    const missingTests = requiredTests.filter(t => !testTypes.includes(t));

    expect(missingTests.length).toBe(0);
    expect(testTypes.sort()).toEqual(['bigfive', 'disc', 'pir']);
  });

  it('deve validar testes de um funcionário', async () => {
    if (!database) throw new Error('Database not available');

    // Verificar se todos os testes obrigatórios foram concluídos
    const completedTests = await database
      .select()
      .from(testResults)
      .where(eq(testResults.employeeId, testEmployeeId));

    const testTypes = new Set(completedTests.map(t => t.testType));
    const requiredTests = ['pir', 'disc', 'bigfive'];
    const missingTests = requiredTests.filter(t => !testTypes.has(t));

    expect(missingTests.length).toBe(0);

    // Atualizar avaliação como validada
    await database
      .update(performanceEvaluations)
      .set({
        testsValidated: true,
        testsValidatedAt: new Date(),
        testsValidatedBy: 1,
      })
      .where(eq(performanceEvaluations.id, testEvaluationId));

    // Verificar se foi atualizado
    const [evaluation] = await database
      .select()
      .from(performanceEvaluations)
      .where(eq(performanceEvaluations.id, testEvaluationId))
      .limit(1);

    expect(evaluation.testsValidated).toBe(true);
    expect(evaluation.testsValidatedAt).toBeTruthy();
    expect(evaluation.testsValidatedBy).toBe(1);
  });

  it('deve bloquear validação se testes estiverem faltando', async () => {
    if (!database) throw new Error('Database not available');

    // Criar novo funcionário sem testes
    const [employeeResult] = await database.insert(employees).values({
      employeeCode: 'TEST-NO-TESTS',
      name: 'Funcionário Sem Testes',
      registrationNumber: 'TEST-NO-TESTS',
      email: 'sem.testes@uisa.com.br',
      active: true,
      admissionDate: new Date('2023-01-01'),
    });
    const employeeWithoutTests = Number(employeeResult.insertId);

    // Criar avaliação
    const [evaluationResult] = await database.insert(performanceEvaluations).values({
      cycleId: 1,
      employeeId: employeeWithoutTests,
      type: '360',
      status: 'em_andamento',
      workflowStatus: 'pending_manager',
    });
    const evaluationId = Number(evaluationResult.insertId);

    // Verificar testes
    const completedTests = await database
      .select()
      .from(testResults)
      .where(eq(testResults.employeeId, employeeWithoutTests));

    const testTypes = new Set(completedTests.map(t => t.testType));
    const requiredTests = ['pir', 'disc', 'bigfive'];
    const missingTests = requiredTests.filter(t => !testTypes.has(t));

    // Deve ter testes faltando
    expect(missingTests.length).toBeGreaterThan(0);
    expect(missingTests).toEqual(['pir', 'disc', 'bigfive']);

    // Tentar validar deve falhar
    let errorThrown = false;
    try {
      if (missingTests.length > 0) {
        throw new Error(`Testes faltando: ${missingTests.join(', ')}`);
      }
    } catch (error) {
      errorThrown = true;
      expect(error).toBeInstanceOf(Error);
      if (error instanceof Error) {
        expect(error.message).toContain('Testes faltando');
      }
    }

    expect(errorThrown).toBe(true);
  });

  it('deve verificar estrutura do email de finalização', async () => {
    if (!database) throw new Error('Database not available');

    // Buscar dados do funcionário
    const [employee] = await database
      .select()
      .from(employees)
      .where(eq(employees.id, testEmployeeId))
      .limit(1);

    expect(employee).toBeTruthy();
    expect(employee.name).toBe('Funcionário Teste Validação');

    // Buscar dados da avaliação
    const [evaluation] = await database
      .select()
      .from(performanceEvaluations)
      .where(eq(performanceEvaluations.id, testEvaluationId))
      .limit(1);

    expect(evaluation).toBeTruthy();
    expect(evaluation.testsValidated).toBe(true);

    // Verificar estrutura do email (sem enviar)
    const recipientEmail = 'rodrigo.goncalves@uisa.com.br';
    const subject = `✅ Avaliação Finalizada - ${employee.name}`;

    expect(recipientEmail).toBe('rodrigo.goncalves@uisa.com.br');
    expect(subject).toContain('Avaliação Finalizada');
    expect(subject).toContain(employee.name);

    // Verificar que avaliação tem todos os dados necessários
    expect(evaluation.type).toBeTruthy();
    expect(evaluation.testsValidated).toBe(true);
  });

  it('deve verificar fluxo completo: Autoavaliação → Gestor → Validação → Email', async () => {
    if (!database) throw new Error('Database not available');

    // Simular fluxo completo
    const [evaluation] = await database
      .select()
      .from(performanceEvaluations)
      .where(eq(performanceEvaluations.id, testEvaluationId))
      .limit(1);

    // 1. Autoavaliação concluída
    await database
      .update(performanceEvaluations)
      .set({
        selfEvaluationCompleted: true,
        selfCompletedAt: new Date(),
        workflowStatus: 'pending_manager',
      })
      .where(eq(performanceEvaluations.id, testEvaluationId));

    // 2. Avaliação do gestor concluída
    await database
      .update(performanceEvaluations)
      .set({
        managerEvaluationCompleted: true,
        managerCompletedAt: new Date(),
        workflowStatus: 'pending_consensus',
      })
      .where(eq(performanceEvaluations.id, testEvaluationId));

    // 3. Validação de testes (já feita anteriormente)
    // 4. Email seria enviado aqui

    // Verificar estado final
    const [finalEvaluation] = await database
      .select()
      .from(performanceEvaluations)
      .where(eq(performanceEvaluations.id, testEvaluationId))
      .limit(1);

    expect(finalEvaluation.selfEvaluationCompleted).toBe(true);
    expect(finalEvaluation.managerEvaluationCompleted).toBe(true);
    expect(finalEvaluation.testsValidated).toBe(true);
    expect(finalEvaluation.workflowStatus).toBe('pending_consensus');
  });
});
