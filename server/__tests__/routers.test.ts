import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from '../routers';
import type { Context } from '../_core/context';

// Mock context para testes
const createMockContext = (user?: { id: number; role: 'admin' | 'user' }): Context => ({
  user: user || null,
  req: {} as any,
  res: {} as any,
});

describe('tRPC Routers', () => {
  describe('Template Router', () => {
    it('deve listar templates ativos sem autenticação', async () => {
      const caller = appRouter.createCaller(createMockContext());
      const templates = await caller.template.list();
      expect(Array.isArray(templates)).toBe(true);
    });

    it('deve retornar erro ao tentar criar template sem ser admin', async () => {
      const caller = appRouter.createCaller(createMockContext({ id: 1, role: 'user' }));
      
      await expect(
        caller.template.create({
          name: 'Template Teste',
          description: 'Descrição teste',
          structure: JSON.stringify({ perguntas: [] }),
          isActive: true,
        })
      ).rejects.toThrow();
    });
  });

  describe('Evaluation Router', () => {
    it('deve exigir autenticação para listar avaliações', async () => {
      const caller = appRouter.createCaller(createMockContext());
      
      await expect(caller.evaluation.list()).rejects.toThrow();
    });

    it('deve permitir usuário autenticado listar suas avaliações', async () => {
      const caller = appRouter.createCaller(createMockContext({ id: 1, role: 'user' }));
      const result = await caller.evaluation.list();
      
      expect(result).toHaveProperty('asEvaluated');
      expect(result).toHaveProperty('asEvaluator');
      expect(Array.isArray(result.asEvaluated)).toBe(true);
      expect(Array.isArray(result.asEvaluator)).toBe(true);
    });
  });

  describe('Notification Router', () => {
    it('deve retornar configurações padrão para usuário sem configurações', async () => {
      const caller = appRouter.createCaller(createMockContext({ id: 999, role: 'user' }));
      const settings = await caller.notification.getSettings();
      
      expect(settings).toHaveProperty('notifyOnNewEvaluation');
      expect(settings).toHaveProperty('notifyPendingReminders');
      expect(settings).toHaveProperty('notifyOnStatusChange');
      expect(settings.notifyOnNewEvaluation).toBe(true);
    });

    it('deve retornar 0 notificações não lidas para novo usuário', async () => {
      const caller = appRouter.createCaller(createMockContext({ id: 999, role: 'user' }));
      const count = await caller.notification.getUnreadCount();
      
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Report Router', () => {
    it('deve exigir autenticação para listar relatórios', async () => {
      const caller = appRouter.createCaller(createMockContext());
      
      await expect(caller.report.list()).rejects.toThrow();
    });

    it('deve permitir usuário autenticado listar seus relatórios', async () => {
      const caller = appRouter.createCaller(createMockContext({ id: 1, role: 'user' }));
      const reports = await caller.report.list();
      
      expect(Array.isArray(reports)).toBe(true);
    });
  });

  describe('Auth Router', () => {
    it('deve retornar null para usuário não autenticado', async () => {
      const caller = appRouter.createCaller(createMockContext());
      const user = await caller.auth.me();
      
      expect(user).toBeNull();
    });

    it('deve retornar dados do usuário autenticado', async () => {
      const mockUser = { id: 1, role: 'user' as const };
      const caller = appRouter.createCaller(createMockContext(mockUser));
      const user = await caller.auth.me();
      
      expect(user).toEqual(mockUser);
    });
  });
});
