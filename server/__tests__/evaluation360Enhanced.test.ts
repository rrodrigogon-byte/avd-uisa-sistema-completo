import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from '../routers';
import type { Context } from '../_core/context';

describe('Evaluation 360° Enhanced - Create Cycle', () => {
  let mockContext: Context;

  beforeAll(() => {
    // Mock context with admin user
    mockContext = {
      user: {
        id: 1,
        openId: 'test-admin',
        name: 'Admin Test',
        email: 'admin@test.com',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        loginMethod: 'email',
      },
      req: {} as any,
      res: {} as any,
    };
  });

  it('should create a 360° Enhanced cycle with weights, competencies and participants', async () => {
    const caller = appRouter.createCaller(mockContext);

    const cycleData = {
      name: 'Teste Ciclo 360° - Vitest',
      description: 'Ciclo de teste automatizado para validação do endpoint',
      startDate: '2025-11-26',
      endDate: '2025-12-31',
      evaluationDeadline: '2025-12-20',
      selfWeight: 20,
      managerWeight: 40,
      peerWeight: 25,
      subordinateWeight: 15,
      competencyIds: [1, 2, 3],
      participants: [
        {
          employeeId: 1,
          role: 'avaliado',
        },
      ],
    };

    const result = await caller.evaluationCycles.create(cycleData);

    expect(result).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    expect(result.name).toBe(cycleData.name);
    expect(result.status).toBe('planejado');

    console.log('✅ Ciclo 360° criado com sucesso:', {
      id: result.id,
      name: result.name,
      status: result.status,
    });
  });

  it('should validate weights sum to 100', async () => {
    const caller = appRouter.createCaller(mockContext);

    const invalidData = {
      name: 'Teste Pesos Inválidos',
      description: 'Teste de validação de pesos',
      startDate: '2025-11-26',
      endDate: '2025-12-31',
      evaluationDeadline: '2025-12-20',
      selfWeight: 30,
      managerWeight: 30,
      peerWeight: 30,
      subordinateWeight: 30, // Total = 120%
      competencyIds: [1],
      participants: [],
    };

    await expect(caller.evaluationCycles.create(invalidData)).rejects.toThrow();

    console.log('✅ Validação de pesos funcionando corretamente');
  });

  it('should require at least one competency', async () => {
    const caller = appRouter.createCaller(mockContext);

    const invalidData = {
      name: 'Teste Sem Competências',
      description: 'Teste de validação de competências',
      startDate: '2025-11-26',
      endDate: '2025-12-31',
      evaluationDeadline: '2025-12-20',
      selfWeight: 25,
      managerWeight: 25,
      peerWeight: 25,
      subordinateWeight: 25,
      competencyIds: [], // Vazio
      participants: [],
    };

    await expect(caller.evaluationCycles.create(invalidData)).rejects.toThrow();

    console.log('✅ Validação de competências funcionando corretamente');
  });
});
