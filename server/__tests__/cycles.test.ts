import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from '../routers';
import { getDb } from '../db';

describe('Cycles Router - Validação de Criação', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    // Mock context com usuário admin
    const mockContext = {
      user: {
        id: 1,
        openId: 'test-user',
        name: 'Test Admin',
        email: 'admin@test.com',
        role: 'admin' as const,
      },
      req: {} as any,
      res: {} as any,
    };

    caller = appRouter.createCaller(mockContext);
  });

  describe('evaluationCycles.create', () => {
    it('deve aceitar strings ISO para datas', async () => {
      const input = {
        name: 'Ciclo Teste 2025',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        description: 'Ciclo de teste',
      };

      const result = await caller.evaluationCycles.create(input);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.id).toBeTypeOf('number');
    });

    it('deve extrair year automaticamente da startDate', async () => {
      const input = {
        name: 'Ciclo Teste Year Auto',
        startDate: '2025-06-01',
        endDate: '2025-12-31',
      };

      const result = await caller.evaluationCycles.create(input);
      
      expect(result.success).toBe(true);
      
      // Verificar no banco se year foi extraído corretamente
      const db = await getDb();
      if (db) {
        const [cycle] = await db.select()
          .from((await import('../../drizzle/schema')).evaluationCycles)
          .where((await import('drizzle-orm')).eq(
            (await import('../../drizzle/schema')).evaluationCycles.id,
            result.id
          ));
        
        expect(cycle.year).toBe(2025);
        expect(cycle.type).toBe('anual');
      }
    });

    it('deve aceitar year e type opcionais', async () => {
      const input = {
        name: 'Ciclo Semestral 2025',
        year: 2025,
        type: 'semestral' as const,
        startDate: '2025-01-01',
        endDate: '2025-06-30',
      };

      const result = await caller.evaluationCycles.create(input);
      
      expect(result.success).toBe(true);
      
      // Verificar no banco
      const db = await getDb();
      if (db) {
        const [cycle] = await db.select()
          .from((await import('../../drizzle/schema')).evaluationCycles)
          .where((await import('drizzle-orm')).eq(
            (await import('../../drizzle/schema')).evaluationCycles.id,
            result.id
          ));
        
        expect(cycle.year).toBe(2025);
        expect(cycle.type).toBe('semestral');
      }
    });

    it('deve converter datas opcionais corretamente', async () => {
      const input = {
        name: 'Ciclo com Prazos',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        selfEvaluationDeadline: '2025-11-30',
        managerEvaluationDeadline: '2025-12-15',
        consensusDeadline: '2025-12-20',
      };

      const result = await caller.evaluationCycles.create(input);
      
      expect(result.success).toBe(true);
      
      // Verificar no banco
      const db = await getDb();
      if (db) {
        const [cycle] = await db.select()
          .from((await import('../../drizzle/schema')).evaluationCycles)
          .where((await import('drizzle-orm')).eq(
            (await import('../../drizzle/schema')).evaluationCycles.id,
            result.id
          ));
        
        expect(cycle.selfEvaluationDeadline).toBeInstanceOf(Date);
        expect(cycle.managerEvaluationDeadline).toBeInstanceOf(Date);
        expect(cycle.consensusDeadline).toBeInstanceOf(Date);
      }
    });

    it('deve rejeitar endDate anterior a startDate', async () => {
      const input = {
        name: 'Ciclo Inválido',
        startDate: '2025-12-31',
        endDate: '2025-01-01',
      };

      await expect(caller.evaluationCycles.create(input)).rejects.toThrow(
        'Data de término deve ser posterior à data de início'
      );
    });
  });

  describe('cycles.create (360° Enhanced)', () => {
    it('deve criar ciclo 360° com dados básicos', async () => {
      const input = {
        name: 'Ciclo 360° 2025',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        evaluationDeadline: '2025-12-15',
      };

      const result = await caller.cycles.create(input);
      
      expect(result).toBeDefined();
      expect(result.id).toBeTypeOf('number');
    });

    it('deve validar soma de pesos igual a 100%', async () => {
      const input = {
        name: 'Ciclo 360° com Pesos',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        selfWeight: 30,
        peerWeight: 20,
        subordinateWeight: 20,
        managerWeight: 20, // Soma = 90, deve falhar
      };

      await expect(caller.cycles.create(input)).rejects.toThrow(
        'A soma dos pesos deve ser 100%'
      );
    });

    it('deve aceitar pesos corretos (soma = 100%)', async () => {
      const input = {
        name: 'Ciclo 360° Pesos Corretos',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        selfWeight: 30,
        peerWeight: 30,
        subordinateWeight: 20,
        managerWeight: 20,
      };

      const result = await caller.cycles.create(input);
      
      expect(result.id).toBeTypeOf('number');
    });
  });
});
