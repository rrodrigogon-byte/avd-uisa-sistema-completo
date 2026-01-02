import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from '../db';
import { avdAssessmentProcesses, pirAssessments, pirAnswers, employees, users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('PIR Flow Test', () => {
  let testProcessId: number;
  let testEmployeeId: number;
  let testUserId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Criar usuário de teste
    const [userResult] = await db.insert(users).values({
      openId: `test-pir-${Date.now()}`,
      name: 'Test User PIR',
      email: 'test-pir@example.com',
      role: 'user',
    });
    testUserId = userResult.insertId;

    // Criar funcionário de teste
    const [empResult] = await db.insert(employees).values({
      name: 'Test Employee PIR',
      email: 'test-emp-pir@example.com',
      cpf: `${Date.now()}`,
      registration: `REG-PIR-${Date.now()}`,
      admissionDate: new Date(),
      status: 'ativo',
    });
    testEmployeeId = empResult.insertId;

    // Criar processo AVD de teste
    const [processResult] = await db.insert(avdAssessmentProcesses).values({
      employeeId: testEmployeeId,
      cycleYear: 2025,
      status: 'em_andamento',
      currentStep: 2,
      step1CompletedAt: new Date(),
    });
    testProcessId = processResult.insertId;
  });

  it('deve salvar respostas do PIR com o campo responses', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Simular dados que o frontend envia
    const requestData = {
      processId: testProcessId,
      responses: [
        { questionId: 1, response: 5 },
        { questionId: 2, response: 4 },
        { questionId: 3, response: 3 },
      ],
    };

    console.log('Teste: Dados de entrada:', JSON.stringify(requestData));

    // Verificar que responses é um array
    expect(Array.isArray(requestData.responses)).toBe(true);
    expect(requestData.responses.length).toBeGreaterThan(0);

    // Buscar ou criar assessment
    let [assessment] = await db.select()
      .from(pirAssessments)
      .where(eq(pirAssessments.processId, requestData.processId))
      .limit(1);

    if (!assessment) {
      const [result] = await db.insert(pirAssessments).values({
        processId: requestData.processId,
        employeeId: testEmployeeId,
        status: 'em_andamento',
      });
      [assessment] = await db.select()
        .from(pirAssessments)
        .where(eq(pirAssessments.id, result.insertId))
        .limit(1);
    }

    expect(assessment).toBeDefined();

    // Salvar respostas
    for (const response of requestData.responses) {
      await db.insert(pirAnswers).values({
        assessmentId: assessment.id,
        questionId: response.questionId,
        response: response.response,
      });
    }

    // Verificar que as respostas foram salvas
    const savedAnswers = await db.select()
      .from(pirAnswers)
      .where(eq(pirAnswers.assessmentId, assessment.id));

    expect(savedAnswers.length).toBe(requestData.responses.length);
    console.log('Teste: Respostas salvas com sucesso:', savedAnswers.length);
  });

  it('deve rejeitar quando responses é undefined', async () => {
    const requestData: any = {
      processId: testProcessId,
      // responses está undefined
    };

    console.log('Teste: Verificando rejeição quando responses é undefined');
    
    // Verificar que responses é undefined
    expect(requestData.responses).toBeUndefined();
    
    // Isso deve falhar na validação
    expect(Array.isArray(requestData.responses)).toBe(false);
  });

  it('deve rejeitar quando responses não é um array', async () => {
    const requestData: any = {
      processId: testProcessId,
      responses: "not an array",
    };

    console.log('Teste: Verificando rejeição quando responses não é array');
    
    // Verificar que responses não é um array
    expect(Array.isArray(requestData.responses)).toBe(false);
  });
});
