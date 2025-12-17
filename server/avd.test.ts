import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import { getDb } from './db';
import { avdAssessmentProcesses, competencies, employees, users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Testes para o sistema AVD (Avaliação de Desempenho)
 * Testa os 5 passos do processo de avaliação
 */

describe('Sistema AVD - Testes de Integração', () => {
  let testEmployeeId: number;
  let testProcessId: number;
  let testUserId: number;

  // Função helper para criar caller de teste
  const createCaller = (ctx: any) => {
    return appRouter.createCaller(ctx);
  };
  
  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Criar usuário de teste
    const [userResult] = await db.insert(users).values({
      openId: `test-avd-${Date.now()}`,
      name: 'Test User AVD',
      email: 'test-avd@example.com',
      role: 'colaborador',
    });
    testUserId = userResult.insertId;

    // Criar funcionário de teste
    const [empResult] = await db.insert(employees).values({
      userId: testUserId,
      employeeCode: `EMP-AVD-${Date.now()}`,
      name: 'Test Employee AVD',
      email: 'test-avd@example.com',
      active: true,
    });
    testEmployeeId = empResult.insertId;
  });

  describe('Gerenciamento de Processos AVD', () => {
    it('deve iniciar um novo processo AVD', async () => {
      const caller = createCaller({
        user: { id: testUserId, role: 'colaborador' } as any,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.avd.startProcess({
        employeeId: testEmployeeId,
      });

      expect(result).toBeDefined();
      expect(result.id).toBeTypeOf('number');
      testProcessId = result.id;
    });

    it('deve buscar processo por funcionário', async () => {
      const caller = createCaller({
        user: { id: testUserId, role: 'colaborador' } as any,
        req: {} as any,
        res: {} as any,
      });

      const process = await caller.avd.getProcessByEmployee({
        employeeId: testEmployeeId,
      });

      expect(process).toBeDefined();
      expect(process?.id).toBe(testProcessId);
      expect(process?.employeeId).toBe(testEmployeeId);
      expect(process?.status).toBe('em_andamento');
      expect(process?.currentStep).toBe(1);
    });

    it('não deve criar processo duplicado', async () => {
      const caller = createCaller({
        user: { id: testUserId, role: 'colaborador' } as any,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.avd.startProcess({
        employeeId: testEmployeeId,
      });

      // Deve retornar o processo existente
      expect(result.id).toBe(testProcessId);
    });
  });

  describe('Passo 3: Avaliação de Competências', () => {
    it('deve listar competências disponíveis', async () => {
      const caller = createCaller({
        user: { id: testUserId, role: 'colaborador' } as any,
        req: {} as any,
        res: {} as any,
      });

      const competenciesList = await caller.avd.listCompetencies();

      expect(competenciesList).toBeDefined();
      expect(Array.isArray(competenciesList)).toBe(true);
      // Deve ter pelo menos algumas competências cadastradas
      expect(competenciesList.length).toBeGreaterThan(0);
    });

    it('deve criar avaliação de competências', async () => {
      const caller = createCaller({
        user: { id: testUserId, role: 'colaborador' } as any,
        req: {} as any,
        res: {} as any,
      });

      // Buscar competências para avaliar
      const competenciesList = await caller.avd.listCompetencies();
      const firstCompetencies = competenciesList.slice(0, 3);

      const result = await caller.avd.createCompetencyAssessment({
        processId: testProcessId,
        employeeId: testEmployeeId,
        assessmentType: 'autoavaliacao',
        items: firstCompetencies.map((comp: any) => ({
          competencyId: comp.id,
          score: 4,
          comments: 'Teste de avaliação',
          behaviorExamples: 'Exemplo de comportamento',
        })),
        comments: 'Comentários gerais da avaliação',
      });

      expect(result).toBeDefined();
      expect(result.id).toBeTypeOf('number');
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('deve buscar avaliação de competências por processo', async () => {
      const caller = createCaller({
        user: { id: testUserId, role: 'colaborador' } as any,
        req: {} as any,
        res: {} as any,
      });

      const assessment = await caller.avd.getCompetencyAssessmentByProcess({
        processId: testProcessId,
      });

      expect(assessment).toBeDefined();
      expect(assessment?.processId).toBe(testProcessId);
      expect(assessment?.employeeId).toBe(testEmployeeId);
      expect(assessment?.items).toBeDefined();
      expect(Array.isArray(assessment?.items)).toBe(true);
      expect(assessment?.items.length).toBeGreaterThan(0);
    });
  });

  describe('Passo 4: Avaliação de Desempenho', () => {
    it('deve criar avaliação de desempenho consolidada', async () => {
      const caller = createCaller({
        user: { id: testUserId, role: 'colaborador' } as any,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.avd.createPerformanceAssessment({
        processId: testProcessId,
        employeeId: testEmployeeId,
        profileScore: 75,
        pirScore: 80,
        competencyScore: 85,
        profileWeight: 20,
        pirWeight: 20,
        competencyWeight: 60,
        strengthsAnalysis: 'Pontos fortes identificados',
        gapsAnalysis: 'Gaps a desenvolver',
        developmentRecommendations: 'Recomendações de desenvolvimento',
        careerRecommendations: 'Recomendações de carreira',
        evaluatorComments: 'Comentários do avaliador',
      });

      expect(result).toBeDefined();
      expect(result.id).toBeTypeOf('number');
      expect(result.finalScore).toBeGreaterThan(0);
      expect(result.finalScore).toBeLessThanOrEqual(100);
      expect(result.performanceRating).toBeDefined();
      
      // Com essas pontuações, deve ser "supera_expectativas" ou "excepcional"
      expect(['supera_expectativas', 'excepcional']).toContain(result.performanceRating);
    });

    it('deve buscar avaliação de desempenho por processo', async () => {
      const caller = createCaller({
        user: { id: testUserId, role: 'colaborador' } as any,
        req: {} as any,
        res: {} as any,
      });

      const assessment = await caller.avd.getPerformanceAssessmentByProcess({
        processId: testProcessId,
      });

      expect(assessment).toBeDefined();
      expect(assessment?.processId).toBe(testProcessId);
      expect(assessment?.employeeId).toBe(testEmployeeId);
      expect(assessment?.finalScore).toBeGreaterThan(0);
      expect(assessment?.performanceRating).toBeDefined();
    });

    it('deve calcular pontuação final corretamente', async () => {
      const caller = createCaller({
        user: { id: testUserId, role: 'colaborador' } as any,
        req: {} as any,
        res: {} as any,
      });

      // Teste com valores conhecidos
      const result = await caller.avd.createPerformanceAssessment({
        processId: testProcessId + 1000, // ID diferente para não conflitar
        employeeId: testEmployeeId,
        profileScore: 50,
        pirScore: 50,
        competencyScore: 50,
        profileWeight: 20,
        pirWeight: 20,
        competencyWeight: 60,
      });

      // 50*0.2 + 50*0.2 + 50*0.6 = 10 + 10 + 30 = 50
      expect(result.finalScore).toBe(50);
      expect(result.performanceRating).toBe('abaixo_expectativas');
    });
  });

  describe('Passo 5: Plano de Desenvolvimento Individual (PDI)', () => {
    let performanceAssessmentId: number;

    beforeAll(async () => {
      const caller = createCaller({
        user: { id: testUserId, role: 'colaborador' } as any,
        req: {} as any,
        res: {} as any,
      });

      const assessment = await caller.avd.getPerformanceAssessmentByProcess({
        processId: testProcessId,
      });
      performanceAssessmentId = assessment!.id;
    });

    it('deve criar PDI com ações de desenvolvimento', async () => {
      const caller = createCaller({
        user: { id: testUserId, role: 'colaborador' } as any,
        req: {} as any,
        res: {} as any,
      });

      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const result = await caller.avd.createDevelopmentPlan({
        processId: testProcessId,
        employeeId: testEmployeeId,
        performanceAssessmentId,
        title: 'PDI Teste 2024',
        description: 'Plano de desenvolvimento para testes',
        startDate,
        endDate,
        objectives: 'Desenvolver competências técnicas e comportamentais',
        actions: [
          {
            title: 'Participar de projeto de liderança',
            description: 'Liderar projeto piloto',
            actionType: 'experiencia_pratica',
            category: 'Liderança',
            dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            successMetrics: 'Projeto concluído com sucesso',
            expectedOutcome: 'Desenvolver habilidades de liderança',
          },
          {
            title: 'Mentoria com gestor sênior',
            description: 'Sessões quinzenais de mentoria',
            actionType: 'mentoria_feedback',
            category: 'Desenvolvimento',
            dueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            successMetrics: '12 sessões realizadas',
            expectedOutcome: 'Aprimorar visão estratégica',
          },
          {
            title: 'Curso de gestão de projetos',
            description: 'Certificação PMP',
            actionType: 'treinamento_formal',
            category: 'Técnica',
            dueDate: new Date(Date.now() + 270 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            successMetrics: 'Certificação obtida',
            expectedOutcome: 'Dominar metodologias ágeis',
          },
        ],
      });

      expect(result).toBeDefined();
      expect(result.id).toBeTypeOf('number');
    });

    it('deve buscar PDI por processo', async () => {
      const caller = createCaller({
        user: { id: testUserId, role: 'colaborador' } as any,
        req: {} as any,
        res: {} as any,
      });

      const pdi = await caller.avd.getDevelopmentPlanByProcess({
        processId: testProcessId,
      });

      expect(pdi).toBeDefined();
      expect(pdi?.processId).toBe(testProcessId);
      expect(pdi?.employeeId).toBe(testEmployeeId);
      expect(pdi?.title).toBe('PDI Teste 2024');
      expect(pdi?.actions).toBeDefined();
      expect(Array.isArray(pdi?.actions)).toBe(true);
      expect(pdi?.actions.length).toBe(3);

      // Verificar tipos de ações (modelo 70-20-10)
      const actionTypes = pdi?.actions.map((a: any) => a.actionType);
      expect(actionTypes).toContain('experiencia_pratica');
      expect(actionTypes).toContain('mentoria_feedback');
      expect(actionTypes).toContain('treinamento_formal');
    });

    it('deve atualizar progresso de uma ação', async () => {
      const caller = createCaller({
        user: { id: testUserId, role: 'colaborador' } as any,
        req: {} as any,
        res: {} as any,
      });

      const pdi = await caller.avd.getDevelopmentPlanByProcess({
        processId: testProcessId,
      });

      const firstAction = pdi?.actions[0];
      expect(firstAction).toBeDefined();

      const result = await caller.avd.updateActionProgress({
        actionId: firstAction.id,
        progressPercent: 50,
        comments: 'Progresso parcial da ação',
        evidenceUrl: 'https://example.com/evidence',
        evidenceType: 'document',
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe('Atualização de Passos do Processo', () => {
    it('deve atualizar passo do processo', async () => {
      const caller = createCaller({
        user: { id: testUserId, role: 'colaborador' } as any,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.avd.updateProcessStep({
        processId: testProcessId,
        step: 5,
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      // Verificar se o processo foi atualizado
      const process = await caller.avd.getProcessByEmployee({
        employeeId: testEmployeeId,
      });

      expect(process?.currentStep).toBe(5);
      expect(process?.status).toBe('concluido');
      expect(process?.completedAt).toBeDefined();
    });
  });
});
