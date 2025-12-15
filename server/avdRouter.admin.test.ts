/**
 * Testes para funcionalidades administrativas do AVD Router
 * Dashboard, Notificações e Relatórios
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import { getDb } from './db';
import type { Context } from './_core/context';

describe('AVD Router - Funcionalidades Administrativas', () => {
  let adminContext: Context;
  let userContext: Context;

  beforeAll(async () => {
    // Mock de contexto de admin
    adminContext = {
      user: {
        id: 1,
        openId: 'admin-test',
        name: 'Admin Test',
        email: 'admin@test.com',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        loginMethod: 'test',
        isSalaryLead: false,
        faceDescriptor: null,
        facePhotoUrl: null,
        faceRegisteredAt: null,
      },
      req: {} as any,
      res: {} as any,
    };

    // Mock de contexto de usuário comum
    userContext = {
      user: {
        id: 2,
        openId: 'user-test',
        name: 'User Test',
        email: 'user@test.com',
        role: 'colaborador',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        loginMethod: 'test',
        isSalaryLead: false,
        faceDescriptor: null,
        facePhotoUrl: null,
        faceRegisteredAt: null,
      },
      req: {} as any,
      res: {} as any,
    };
  });

  describe('Dashboard Administrativo', () => {
    it('deve permitir admin listar todos os processos', async () => {
      const caller = appRouter.createCaller(adminContext);

      const result = await caller.avd.listAllProcesses({
        limit: 10,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('deve negar acesso de usuário comum ao dashboard admin', async () => {
      const caller = appRouter.createCaller(userContext);

      await expect(
        caller.avd.listAllProcesses({
          limit: 10,
          offset: 0,
        })
      ).rejects.toThrow('Acesso negado');
    });

    it('deve retornar estatísticas do dashboard', async () => {
      const caller = appRouter.createCaller(adminContext);

      const result = await caller.avd.getAdminStats();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('totalInProgress');
      expect(result).toHaveProperty('totalCompleted');
      expect(result).toHaveProperty('byStep');
      expect(typeof result.totalInProgress).toBe('number');
      expect(typeof result.totalCompleted).toBe('number');
      expect(Array.isArray(result.byStep)).toBe(true);
    });

    it('deve filtrar processos por status', async () => {
      const caller = appRouter.createCaller(adminContext);

      const result = await caller.avd.listAllProcesses({
        status: 'em_andamento',
        limit: 10,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      // Verificar se todos os processos retornados têm o status correto
      result.forEach((item) => {
        expect(item.process.status).toBe('em_andamento');
      });
    });
  });

  describe('Sistema de Notificações', () => {
    it('deve enviar notificação de início de processo', async () => {
      const caller = appRouter.createCaller(adminContext);
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Buscar um funcionário existente
      const employees = await db.query.employees.findMany({ limit: 1 });
      if (employees.length === 0) {
        console.log('Nenhum funcionário encontrado para teste');
        return;
      }

      const employee = employees[0];

      const result = await caller.avd.sendProcessStartNotification({
        processId: 1,
        employeeId: employee.id,
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('deve enviar notificação de passo concluído', async () => {
      const caller = appRouter.createCaller(adminContext);
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const employees = await db.query.employees.findMany({ limit: 1 });
      if (employees.length === 0) {
        console.log('Nenhum funcionário encontrado para teste');
        return;
      }

      const employee = employees[0];

      const result = await caller.avd.sendStepCompletedNotification({
        processId: 1,
        employeeId: employee.id,
        step: 1,
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('deve enviar lembrete de passo pendente', async () => {
      const caller = appRouter.createCaller(adminContext);
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const employees = await db.query.employees.findMany({ limit: 1 });
      if (employees.length === 0) {
        console.log('Nenhum funcionário encontrado para teste');
        return;
      }

      const employee = employees[0];

      const result = await caller.avd.sendStepReminderNotification({
        processId: 1,
        employeeId: employee.id,
        currentStep: 2,
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('deve listar processos que precisam de lembrete', async () => {
      const caller = appRouter.createCaller(adminContext);

      const result = await caller.avd.getProcessesNeedingReminders();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Relatórios e Exportação', () => {
    it('deve gerar relatório consolidado', async () => {
      const caller = appRouter.createCaller(adminContext);

      const result = await caller.avd.generateConsolidatedReport({});

      expect(result).toBeDefined();
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('processes');
      expect(result).toHaveProperty('generatedAt');
      
      expect(result.summary).toHaveProperty('totalProcesses');
      expect(result.summary).toHaveProperty('completedProcesses');
      expect(result.summary).toHaveProperty('inProgressProcesses');
      expect(result.summary).toHaveProperty('avgPerformanceScore');
      expect(result.summary).toHaveProperty('completionRate');
      
      expect(Array.isArray(result.processes)).toBe(true);
    });

    it('deve filtrar relatório por status', async () => {
      const caller = appRouter.createCaller(adminContext);

      const result = await caller.avd.generateConsolidatedReport({
        status: 'concluido',
      });

      expect(result).toBeDefined();
      expect(result.processes).toBeDefined();
      
      // Verificar se todos os processos são concluídos
      result.processes.forEach((item) => {
        expect(item.process.status).toBe('concluido');
      });
    });

    it('deve obter dados para exportação', async () => {
      const caller = appRouter.createCaller(adminContext);

      const result = await caller.avd.getExportData({});

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      // Verificar estrutura dos dados de exportação
      if (result.length > 0) {
        const firstItem = result[0];
        expect(firstItem).toHaveProperty('processId');
        expect(firstItem).toHaveProperty('employeeName');
        expect(firstItem).toHaveProperty('status');
        expect(firstItem).toHaveProperty('currentStep');
      }
    });

    it('deve negar acesso de usuário comum aos relatórios', async () => {
      const caller = appRouter.createCaller(userContext);

      await expect(
        caller.avd.generateConsolidatedReport({})
      ).rejects.toThrow('Acesso negado');

      await expect(
        caller.avd.getExportData({})
      ).rejects.toThrow('Acesso negado');
    });
  });

  describe('Detalhes do Processo', () => {
    it('deve retornar detalhes completos de um processo', async () => {
      const caller = appRouter.createCaller(adminContext);
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Buscar um processo existente
      const processes = await db.query.avdAssessmentProcesses.findMany({ limit: 1 });
      if (processes.length === 0) {
        console.log('Nenhum processo encontrado para teste');
        return;
      }

      const process = processes[0];

      const result = await caller.avd.getProcessDetails({
        processId: process.id,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('process');
      expect(result).toHaveProperty('employee');
      expect(result.process.id).toBe(process.id);
    });

    it('deve lançar erro para processo inexistente', async () => {
      const caller = appRouter.createCaller(adminContext);

      await expect(
        caller.avd.getProcessDetails({
          processId: 999999,
        })
      ).rejects.toThrow('Processo não encontrado');
    });
  });
});
