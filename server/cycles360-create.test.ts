import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from '../server/routers';
import type { Context } from '../server/_core/context';

describe('Ciclo 360° Enhanced - Criação', () => {
  const mockContext: Context = {
    user: {
      id: 1,
      openId: 'test-user',
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      loginMethod: 'oauth',
    },
    req: {} as any,
    res: {} as any,
  };

  const caller = appRouter.createCaller(mockContext);

  it('deve criar ciclo 360° com todos os dados', async () => {
    const cycleData = {
      name: 'Ciclo 360° Teste',
      description: 'Ciclo de teste para validação',
      startDate: new Date('2025-01-01').toISOString(),
      endDate: new Date('2025-12-31').toISOString(),
      evaluationDeadline: new Date('2025-12-15').toISOString(),
      selfWeight: 25,
      peerWeight: 25,
      subordinateWeight: 25,
      managerWeight: 25,
      competencyIds: [1, 2, 3],
      participants: [
        { employeeId: 1, role: 'self' },
        { employeeId: 2, role: 'manager' },
        { employeeId: 3, role: 'peer' },
      ],
    };

    const result = await caller.evaluationCycles.create(cycleData);

    expect(result).toBeDefined();
    expect(result.name).toBe(cycleData.name);
    expect(result.description).toBe(cycleData.description);
    expect(result.status).toBe('planejado');
  });

  it('deve validar soma de pesos igual a 100%', async () => {
    const cycleData = {
      name: 'Ciclo 360° Inválido',
      startDate: new Date('2025-01-01').toISOString(),
      endDate: new Date('2025-12-31').toISOString(),
      evaluationDeadline: new Date('2025-12-15').toISOString(),
      selfWeight: 30,
      peerWeight: 30,
      subordinateWeight: 30,
      managerWeight: 30, // Total = 120%
      competencyIds: [1],
      participants: [{ employeeId: 1, role: 'self' }],
    };

    await expect(caller.evaluationCycles.create(cycleData)).rejects.toThrow();
  });

  it('deve exigir pelo menos uma competência', async () => {
    const cycleData = {
      name: 'Ciclo 360° Sem Competências',
      startDate: new Date('2025-01-01').toISOString(),
      endDate: new Date('2025-12-31').toISOString(),
      evaluationDeadline: new Date('2025-12-15').toISOString(),
      selfWeight: 25,
      peerWeight: 25,
      subordinateWeight: 25,
      managerWeight: 25,
      competencyIds: [], // Vazio
      participants: [{ employeeId: 1, role: 'self' }],
    };

    await expect(caller.evaluationCycles.create(cycleData)).rejects.toThrow();
  });

  it('deve criar ciclo sem participantes (opcional)', async () => {
    const cycleData = {
      name: 'Ciclo 360° Sem Participantes',
      startDate: new Date('2025-01-01').toISOString(),
      endDate: new Date('2025-12-31').toISOString(),
      evaluationDeadline: new Date('2025-12-15').toISOString(),
      selfWeight: 25,
      peerWeight: 25,
      subordinateWeight: 25,
      managerWeight: 25,
      competencyIds: [1, 2],
      participants: [], // Sem participantes
    };

    const result = await caller.evaluationCycles.create(cycleData);

    expect(result).toBeDefined();
    expect(result.name).toBe(cycleData.name);
  });
});
