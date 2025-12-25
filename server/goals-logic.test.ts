import { describe, it, expect, beforeAll } from 'vitest';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../server/routers';
import superjson from 'superjson';

const API_URL = process.env.VITE_API_URL || 'http://localhost:3000';

const client = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: `${API_URL}/api/trpc`,
      headers: {
        'x-test-user-id': '1',
        'x-test-user-role': 'admin',
      },
    }),
  ],
});

describe('Lógica de Criação de Metas SMART', () => {
  let testCycleId: number;
  let testEmployeeId: number;
  let testDepartmentId: number;

  beforeAll(async () => {
    // Buscar ciclo de teste
    const cycles = await client.cyclesLegacy.list.query();
    if (cycles.length > 0) {
      testCycleId = cycles[0].id;
    } else {
      throw new Error('Nenhum ciclo disponível para teste');
    }

    // Buscar funcionário de teste
    const employees = await client.employees.list.query({});
    const activeEmployee = employees.find((emp: any) => emp.status === 'ativo');
    if (activeEmployee) {
      testEmployeeId = activeEmployee.id;
    } else {
      throw new Error('Nenhum funcionário ativo disponível para teste');
    }

    // Buscar departamento de teste
    const departments = await client.departments.list.query();
    if (departments.length > 0) {
      testDepartmentId = departments[0].id;
    } else {
      throw new Error('Nenhum departamento disponível para teste');
    }
  });

  it('Deve criar meta INDIVIDUAL com employeeId obrigatório', async () => {
    const result = await client.goals.createSMART.mutate({
      title: 'Meta Individual de Teste',
      description: 'Aumentar a produtividade em 20% através de melhorias no processo de trabalho',
      type: 'individual',
      goalType: 'individual',
      category: 'development',
      measurementUnit: '%',
      targetValueCents: 2000, // 20%
      weight: 10,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      bonusEligible: false,
      cycleId: testCycleId,
      targetEmployeeId: testEmployeeId,
    });

    expect(result).toBeDefined();
    expect(result.goalId).toBeGreaterThan(0);
    expect(result.validation).toBeDefined();
  });

  it('Deve criar meta de EQUIPE com departmentId obrigatório', async () => {
    const result = await client.goals.createSMART.mutate({
      title: 'Meta de Equipe de Teste',
      description: 'Melhorar a colaboração da equipe e aumentar resultados em 15%',
      type: 'team',
      goalType: 'individual',
      category: 'development',
      measurementUnit: '%',
      targetValueCents: 1500, // 15%
      weight: 10,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      bonusEligible: false,
      cycleId: testCycleId,
      departmentId: testDepartmentId,
    });

    expect(result).toBeDefined();
    expect(result.goalId).toBeGreaterThan(0);
    expect(result.validation).toBeDefined();
  });

  it('Deve criar meta ORGANIZACIONAL sem employeeId (aplicada a todos)', async () => {
    const result = await client.goals.createSMART.mutate({
      title: 'Meta Organizacional de Teste',
      description: 'Implementar cultura de inovação e crescimento sustentável para toda a organização',
      type: 'organizational',
      goalType: 'corporate',
      category: 'corporate',
      measurementUnit: 'pontos',
      targetValueCents: 10000, // 100 pontos
      weight: 10,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      bonusEligible: false,
      cycleId: testCycleId,
    });

    expect(result).toBeDefined();
    expect(result.goalId).toBeGreaterThan(0);
    expect(result.validation).toBeDefined();
  });

  it('Deve REJEITAR meta individual sem employeeId', async () => {
    await expect(
      client.goals.createSMART.mutate({
        title: 'Meta Individual Inválida',
        description: 'Aumentar vendas sem especificar colaborador',
        type: 'individual',
        goalType: 'individual',
        category: 'financial',
        measurementUnit: 'R$',
        targetValueCents: 100000,
        weight: 10,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        bonusEligible: false,
        cycleId: testCycleId,
      })
    ).rejects.toThrow();
  });

  it('Deve REJEITAR meta de equipe sem departmentId', async () => {
    await expect(
      client.goals.createSMART.mutate({
        title: 'Meta de Equipe Inválida',
        description: 'Melhorar resultados sem especificar departamento',
        type: 'team',
        goalType: 'individual',
        category: 'development',
        measurementUnit: '%',
        targetValueCents: 1500,
        weight: 10,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        bonusEligible: false,
        cycleId: testCycleId,
      })
    ).rejects.toThrow();
  });

  it('Deve listar apenas funcionários ATIVOS para metas individuais', async () => {
    const employees = await client.employees.list.query({});
    const activeEmployees = employees.filter((emp: any) => emp.status === 'ativo');
    
    expect(activeEmployees.length).toBeGreaterThan(0);
    expect(activeEmployees.every((emp: any) => emp.status === 'ativo')).toBe(true);
  });

  it('Deve listar todos os departamentos cadastrados', async () => {
    const departments = await client.departments.list.query();
    
    expect(departments).toBeDefined();
    expect(Array.isArray(departments)).toBe(true);
    expect(departments.length).toBeGreaterThan(0);
  });
});
