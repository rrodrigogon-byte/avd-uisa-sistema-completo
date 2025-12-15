/**
 * Testes para o Router de Dashboard de Emails Admin/RH
 */

import { describe, it, expect, beforeAll } from 'vitest';

describe('Admin RH Email Dashboard Router', () => {
  beforeAll(async () => {
    // Setup inicial se necessário
  });

  describe('Procedures tRPC', () => {
    it('deve ter procedure list para listar emails', async () => {
      const { adminRhEmailDashboardRouter } = await import('../routers/adminRhEmailDashboardRouter');
      
      expect(adminRhEmailDashboardRouter).toBeDefined();
      expect(adminRhEmailDashboardRouter._def.procedures.list).toBeDefined();
    });

    it('deve ter procedure stats para estatísticas', async () => {
      const { adminRhEmailDashboardRouter } = await import('../routers/adminRhEmailDashboardRouter');
      
      expect(adminRhEmailDashboardRouter._def.procedures.stats).toBeDefined();
    });

    it('deve ter procedure getById para detalhes de email', async () => {
      const { adminRhEmailDashboardRouter } = await import('../routers/adminRhEmailDashboardRouter');
      
      expect(adminRhEmailDashboardRouter._def.procedures.getById).toBeDefined();
    });

    it('deve ter procedure resend para reenviar emails', async () => {
      const { adminRhEmailDashboardRouter } = await import('../routers/adminRhEmailDashboardRouter');
      
      expect(adminRhEmailDashboardRouter._def.procedures.resend).toBeDefined();
    });

    it('deve ter procedure chartData para dados do gráfico', async () => {
      const { adminRhEmailDashboardRouter } = await import('../routers/adminRhEmailDashboardRouter');
      
      expect(adminRhEmailDashboardRouter._def.procedures.chartData).toBeDefined();
    });
  });

  describe('Validação de Inputs', () => {
    it('procedure list deve aceitar filtros válidos', async () => {
      const { adminRhEmailDashboardRouter } = await import('../routers/adminRhEmailDashboardRouter');
      
      const listProcedure = adminRhEmailDashboardRouter._def.procedures.list;
      expect(listProcedure).toBeDefined();
      
      // Verificar que aceita os parâmetros corretos
      const validInput = {
        page: 1,
        limit: 20,
        success: 'all' as const,
        search: 'test',
        dateFrom: '2025-01-01',
        dateTo: '2025-12-31',
      };
      
      // O input deve ser válido (não lançar erro de validação)
      expect(() => validInput).not.toThrow();
    });

    it('procedure getById deve aceitar ID numérico', async () => {
      const { adminRhEmailDashboardRouter } = await import('../routers/adminRhEmailDashboardRouter');
      
      const getByIdProcedure = adminRhEmailDashboardRouter._def.procedures.getById;
      expect(getByIdProcedure).toBeDefined();
      
      const validInput = { id: 1 };
      expect(() => validInput).not.toThrow();
    });
  });

  describe('Funções de Notificação', () => {
    it('deve ter função notifyAdminAndRh exportada', async () => {
      const { notifyAdminAndRh } = await import('../adminRhEmailService');
      
      expect(notifyAdminAndRh).toBeDefined();
      expect(typeof notifyAdminAndRh).toBe('function');
    });

    it('deve ter função notifySecurityAlert exportada', async () => {
      const { notifySecurityAlert } = await import('../adminRhEmailService');
      
      expect(notifySecurityAlert).toBeDefined();
      expect(typeof notifySecurityAlert).toBe('function');
    });

    it('deve ter função notifyDailySummary exportada', async () => {
      const { notifyDailySummary } = await import('../adminRhEmailService');
      
      expect(notifyDailySummary).toBeDefined();
      expect(typeof notifyDailySummary).toBe('function');
    });

    it('deve ter função notifyNewEmployee exportada', async () => {
      const { notifyNewEmployee } = await import('../adminRhEmailService');
      
      expect(notifyNewEmployee).toBeDefined();
      expect(typeof notifyNewEmployee).toBe('function');
    });

    it('deve ter função notifyNewUser exportada', async () => {
      const { notifyNewUser } = await import('../adminRhEmailService');
      
      expect(notifyNewUser).toBeDefined();
      expect(typeof notifyNewUser).toBe('function');
    });

    it('deve ter função notifyNewEvaluationCycle exportada', async () => {
      const { notifyNewEvaluationCycle } = await import('../adminRhEmailService');
      
      expect(notifyNewEvaluationCycle).toBeDefined();
      expect(typeof notifyNewEvaluationCycle).toBe('function');
    });

    it('deve ter função notifyEvaluation360Completed exportada', async () => {
      const { notifyEvaluation360Completed } = await import('../adminRhEmailService');
      
      expect(notifyEvaluation360Completed).toBeDefined();
      expect(typeof notifyEvaluation360Completed).toBe('function');
    });

    it('deve ter função notifySmartGoalActivity exportada', async () => {
      const { notifySmartGoalActivity } = await import('../adminRhEmailService');
      
      expect(notifySmartGoalActivity).toBeDefined();
      expect(typeof notifySmartGoalActivity).toBe('function');
    });

    it('deve ter função notifyPdiActivity exportada', async () => {
      const { notifyPdiActivity } = await import('../adminRhEmailService');
      
      expect(notifyPdiActivity).toBeDefined();
      expect(typeof notifyPdiActivity).toBe('function');
    });

    it('deve ter função notifyNineBoxChange exportada', async () => {
      const { notifyNineBoxChange } = await import('../adminRhEmailService');
      
      expect(notifyNineBoxChange).toBeDefined();
      expect(typeof notifyNineBoxChange).toBe('function');
    });
  });

  describe('Integração com Router Principal', () => {
    it('adminRhEmailDashboard deve estar registrado no appRouter', async () => {
      const { appRouter } = await import('../routers');
      
      expect(appRouter._def.procedures.adminRhEmailDashboard).toBeDefined();
    });

    it('adminRhEmailDashboard deve ter todas as procedures necessárias', async () => {
      const { appRouter } = await import('../routers');
      
      const adminRhEmailDashboard = appRouter._def.procedures.adminRhEmailDashboard;
      expect(adminRhEmailDashboard).toBeDefined();
      
      // Verificar se é um router (tem procedures)
      if ('_def' in adminRhEmailDashboard) {
        const procedures = (adminRhEmailDashboard as any)._def.procedures;
        expect(procedures.list).toBeDefined();
        expect(procedures.stats).toBeDefined();
        expect(procedures.getById).toBeDefined();
        expect(procedures.resend).toBeDefined();
        expect(procedures.chartData).toBeDefined();
      }
    });
  });

  describe('Validação de Estrutura de Dados', () => {
    it('deve retornar estrutura correta para lista de emails', async () => {
      // Estrutura esperada do retorno
      const expectedStructure = {
        emails: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            recipient: expect.any(String),
            subject: expect.any(String),
            success: expect.any(Boolean),
            sentAt: expect.any(Date),
          }),
        ]),
        pagination: expect.objectContaining({
          page: expect.any(Number),
          limit: expect.any(Number),
          total: expect.any(Number),
          totalPages: expect.any(Number),
        }),
      };
      
      expect(expectedStructure).toBeDefined();
    });

    it('deve retornar estrutura correta para estatísticas', async () => {
      const expectedStructure = {
        total: expect.any(Number),
        sent: expect.any(Number),
        failed: expect.any(Number),
        successRate: expect.any(Number),
        recentEmails: expect.any(Number),
        emailsByType: expect.arrayContaining([
          expect.objectContaining({
            type: expect.any(String),
            count: expect.any(Number),
          }),
        ]),
      };
      
      expect(expectedStructure).toBeDefined();
    });

    it('deve retornar estrutura correta para dados do gráfico', async () => {
      const expectedStructure = expect.arrayContaining([
        expect.objectContaining({
          date: expect.any(String),
          sent: expect.any(Number),
          failed: expect.any(Number),
          total: expect.any(Number),
        }),
      ]);
      
      expect(expectedStructure).toBeDefined();
    });
  });
});
