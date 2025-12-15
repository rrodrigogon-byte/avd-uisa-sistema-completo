import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from '../server/routers';
import type { Context } from '../server/_core/context';

// Mock context para testes
const createMockContext = (userId: number = 1, role: 'user' | 'admin' = 'user'): Context => ({
  user: {
    id: userId,
    openId: `test-openid-${userId}`,
    name: `Test User ${userId}`,
    email: `test${userId}@example.com`,
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    loginMethod: 'test',
  },
  req: {} as any,
  res: {} as any,
});

describe('tRPC Routers - Sistema AVD UISA', () => {
  describe('Template Router', () => {
    it('deve listar templates ativos', async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      const templates = await caller.template.list();
      expect(Array.isArray(templates)).toBe(true);
    });

    it('deve permitir admin criar template', async () => {
      const ctx = createMockContext(1, 'admin');
      const caller = appRouter.createCaller(ctx);
      
      const newTemplate = await caller.template.create({
        name: 'Template de Teste',
        description: 'Descrição de teste',
        structure: JSON.stringify({
          questions: [
            { text: 'Pergunta 1', type: 'rating', weight: 1 }
          ]
        }),
        isActive: true,
      });

      expect(newTemplate).toBeDefined();
      expect(newTemplate.name).toBe('Template de Teste');
    });

    it('não deve permitir usuário comum criar template', async () => {
      const ctx = createMockContext(2, 'user');
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.template.create({
          name: 'Template Não Autorizado',
          structure: JSON.stringify({ questions: [] }),
        })
      ).rejects.toThrow();
    });
  });

  describe('Evaluation Router', () => {
    it('deve listar avaliações do usuário', async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      const evaluations = await caller.evaluation.list();
      expect(evaluations).toBeDefined();
      expect(evaluations.asEvaluated).toBeDefined();
      expect(evaluations.asEvaluator).toBeDefined();
    });

    it('deve criar nova avaliação', async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      // Primeiro criar um template
      const adminCtx = createMockContext(1, 'admin');
      const adminCaller = appRouter.createCaller(adminCtx);
      const template = await adminCaller.template.create({
        name: 'Template para Avaliação',
        structure: JSON.stringify({
          questions: [{ text: 'Teste', type: 'rating', weight: 1 }]
        }),
      });

      const newEvaluation = await caller.evaluation.create({
        templateId: template.id,
        evaluatedUserId: ctx.user!.id,
        period: '2024-Q1',
        responses: JSON.stringify({ q0: 5 }),
        score: 100,
      });

      expect(newEvaluation).toBeDefined();
      expect(newEvaluation.period).toBe('2024-Q1');
    });
  });

  describe('PIR Router', () => {
    it('deve listar PIRs do usuário', async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      const pirs = await caller.pir.list();
      expect(pirs).toBeDefined();
      expect(pirs.asUser).toBeDefined();
      expect(pirs.asManager).toBeDefined();
    });

    it('deve criar novo PIR', async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      const newPir = await caller.pir.create({
        userId: ctx.user!.id,
        title: 'PIR de Teste',
        description: 'Descrição do PIR',
        period: '2024',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      expect(newPir).toBeDefined();
      expect(newPir.title).toBe('PIR de Teste');
    });

    it('deve criar meta para PIR', async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      // Criar PIR primeiro
      const pir = await caller.pir.create({
        userId: ctx.user!.id,
        title: 'PIR com Metas',
        period: '2024',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      const goal = await caller.pir.createGoal({
        pirId: pir.id,
        title: 'Meta de Vendas',
        description: 'Aumentar vendas em 20%',
        weight: 50,
        targetValue: 100,
        unit: 'vendas',
      });

      expect(goal).toBeDefined();
      expect(goal.title).toBe('Meta de Vendas');
    });
  });

  describe('Job Description Router', () => {
    it('deve listar descrições de cargo ativas', async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      const jobDescriptions = await caller.jobDescription.list();
      expect(Array.isArray(jobDescriptions)).toBe(true);
    });

    it('deve permitir admin criar descrição de cargo', async () => {
      const ctx = createMockContext(1, 'admin');
      const caller = appRouter.createCaller(ctx);
      
      const newJob = await caller.jobDescription.create({
        title: 'Desenvolvedor Full Stack',
        code: 'DEV-FS-001',
        department: 'Tecnologia',
        level: 'Pleno',
        summary: 'Desenvolver aplicações web',
      });

      expect(newJob).toBeDefined();
      expect(newJob.title).toBe('Desenvolvedor Full Stack');
    });

    it('deve adicionar competência técnica à descrição de cargo', async () => {
      const ctx = createMockContext(1, 'admin');
      const caller = appRouter.createCaller(ctx);
      
      // Criar descrição de cargo primeiro
      const job = await caller.jobDescription.create({
        title: 'Analista de Sistemas',
        code: 'ANLS-001',
      });

      const competency = await caller.jobDescription.addTechnicalCompetency({
        jobDescriptionId: job.id,
        name: 'JavaScript',
        description: 'Programação em JavaScript',
        requiredLevel: 4,
        displayOrder: 1,
      });

      expect(competency).toBeDefined();
      expect(competency.name).toBe('JavaScript');
    });
  });

  describe('Notification Router', () => {
    it('deve obter configurações de notificação', async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      const settings = await caller.notification.getSettings();
      expect(settings).toBeDefined();
      expect(settings.userId).toBe(ctx.user!.id);
    });

    it('deve atualizar configurações de notificação', async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.notification.updateSettings({
        notifyOnNewEvaluation: false,
        reminderDaysBefore: 3,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Report Router', () => {
    it('deve listar relatórios do usuário', async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      const reports = await caller.report.list();
      expect(Array.isArray(reports)).toBe(true);
    });

    it('deve gerar novo relatório', async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      const report = await caller.report.generate({
        name: 'Relatório de Teste',
        type: 'performance_overview',
        period: '2024-Q1',
        data: JSON.stringify({ metrics: [] }),
      });

      expect(report).toBeDefined();
      expect(report.name).toBe('Relatório de Teste');
    });
  });
});
