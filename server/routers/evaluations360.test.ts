/**
 * Testes para o relatório 360° consolidado
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from '../routers';
import type { inferProcedureInput } from '@trpc/server';
import { getDb } from '../db';

describe('Relatório 360° Consolidado', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let mockUser: any;
  let testCycleId: number;

  beforeAll(async () => {
    // Criar contexto mock para testes
    mockUser = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin',
      openId: 'test-open-id',
    };

    caller = appRouter.createCaller({
      user: mockUser,
      req: {} as any,
      res: {} as any,
    });

    // Buscar ou criar um ciclo de teste
    const db = await getDb();
    if (db) {
      const { evaluationCycles } = await import('../../drizzle/schema');
      const { desc } = await import('drizzle-orm');
      
      const cycles = await db.select().from(evaluationCycles).orderBy(desc(evaluationCycles.id)).limit(1);
      
      if (cycles.length > 0) {
        testCycleId = cycles[0].id;
      } else {
        // Se não houver ciclos, criar um de teste
        const [newCycle] = await db.insert(evaluationCycles).values({
          name: 'Ciclo de Teste 360°',
          description: 'Ciclo criado para testes automatizados',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
          status: 'active',
          type: '360',
        });
        testCycleId = newCycle.insertId;
      }
    }
  });

  it('deve retornar estrutura vazia quando não há dados', async () => {
    const input: inferProcedureInput<typeof appRouter.evaluations.get360Consolidated> = {
      cycleId: 999999, // ID inexistente
    };

    const result = await caller.evaluations.get360Consolidated(input);

    expect(result).toBeDefined();
    expect(result.competencies).toEqual([]);
    expect(result.averages).toEqual({
      self: 0,
      manager: 0,
      peers: 0,
    });
  });

  it('deve aceitar filtro por ciclo', async () => {
    const input: inferProcedureInput<typeof appRouter.evaluations.get360Consolidated> = {
      cycleId: testCycleId,
    };

    const result = await caller.evaluations.get360Consolidated(input);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('competencies');
    expect(result).toHaveProperty('averages');
    expect(Array.isArray(result.competencies)).toBe(true);
  });

  it('deve aceitar filtro por departamento', async () => {
    const input: inferProcedureInput<typeof appRouter.evaluations.get360Consolidated> = {
      cycleId: testCycleId,
      departmentId: 1,
    };

    const result = await caller.evaluations.get360Consolidated(input);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('competencies');
    expect(result).toHaveProperty('averages');
  });

  it('deve aceitar filtro por colaborador', async () => {
    const input: inferProcedureInput<typeof appRouter.evaluations.get360Consolidated> = {
      cycleId: testCycleId,
      employeeId: 1,
    };

    const result = await caller.evaluations.get360Consolidated(input);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('competencies');
    expect(result).toHaveProperty('averages');
  });

  it('deve retornar médias válidas quando há dados', async () => {
    const input: inferProcedureInput<typeof appRouter.evaluations.get360Consolidated> = {
      cycleId: testCycleId,
    };

    const result = await caller.evaluations.get360Consolidated(input);

    // Verificar que as médias são números válidos
    expect(typeof result.averages.self).toBe('number');
    expect(typeof result.averages.manager).toBe('number');
    expect(typeof result.averages.peers).toBe('number');

    // Verificar que as médias estão no intervalo válido (0-5)
    expect(result.averages.self).toBeGreaterThanOrEqual(0);
    expect(result.averages.self).toBeLessThanOrEqual(5);
    
    expect(result.averages.manager).toBeGreaterThanOrEqual(0);
    expect(result.averages.manager).toBeLessThanOrEqual(5);
    
    expect(result.averages.peers).toBeGreaterThanOrEqual(0);
    expect(result.averages.peers).toBeLessThanOrEqual(5);
  });

  it('deve retornar competências com estrutura correta', async () => {
    const input: inferProcedureInput<typeof appRouter.evaluations.get360Consolidated> = {
      cycleId: testCycleId,
    };

    const result = await caller.evaluations.get360Consolidated(input);

    if (result.competencies.length > 0) {
      const competency = result.competencies[0];
      
      expect(competency).toHaveProperty('name');
      expect(competency).toHaveProperty('selfScore');
      expect(competency).toHaveProperty('managerScore');
      expect(competency).toHaveProperty('peersScore');

      expect(typeof competency.name).toBe('string');
      expect(typeof competency.selfScore).toBe('number');
      expect(typeof competency.managerScore).toBe('number');
      expect(typeof competency.peersScore).toBe('number');
    }
  });

  it('deve calcular médias corretamente', async () => {
    const input: inferProcedureInput<typeof appRouter.evaluations.get360Consolidated> = {
      cycleId: testCycleId,
    };

    const result = await caller.evaluations.get360Consolidated(input);

    if (result.competencies.length > 0) {
      // Calcular média manual para validar
      const manualAvgSelf = result.competencies.reduce((sum, c) => sum + c.selfScore, 0) / result.competencies.length;
      const manualAvgManager = result.competencies.reduce((sum, c) => sum + c.managerScore, 0) / result.competencies.length;
      const manualAvgPeers = result.competencies.reduce((sum, c) => sum + c.peersScore, 0) / result.competencies.length;

      // Permitir pequena diferença por arredondamento
      expect(Math.abs(result.averages.self - manualAvgSelf)).toBeLessThan(0.01);
      expect(Math.abs(result.averages.manager - manualAvgManager)).toBeLessThan(0.01);
      expect(Math.abs(result.averages.peers - manualAvgPeers)).toBeLessThan(0.01);
    }
  });
});
