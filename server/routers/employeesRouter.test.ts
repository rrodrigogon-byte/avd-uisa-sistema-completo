import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from '../routers';
import type { inferProcedureInput } from '@trpc/server';
import type { AppRouter } from '../routers';

describe('EmployeesRouter - Criação de Funcionários', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let departmentId: number;
  let positionId: number;

  beforeAll(async () => {
    // Criar contexto mockado com usuário admin
    const mockContext = {
      user: {
        id: 1,
        openId: 'test-admin',
        name: 'Admin Test',
        email: 'admin@test.com',
        role: 'admin' as const,
      },
      req: {} as any,
      res: {} as any,
    };

    caller = appRouter.createCaller(mockContext);

    // Buscar departamento existente
    const depts = await caller.employees.getDepartments();
    if (!depts || depts.length === 0) {
      throw new Error('Nenhum departamento encontrado no banco de dados. Execute seed primeiro.');
    }
    departmentId = depts[0].id;

    // Buscar cargo existente
    const positions = await caller.positions.list();
    if (!positions || positions.length === 0) {
      throw new Error('Nenhum cargo encontrado no banco de dados. Execute seed primeiro.');
    }
    positionId = positions[0].id;
  });

  it('deve criar funcionário com datas como strings ISO', async () => {
    const timestamp = Date.now();
    const input: inferProcedureInput<AppRouter['employees']['create']> = {
      employeeCode: `TEST-${timestamp}`,
      name: 'João Silva Teste',
      email: `joao.silva.${timestamp}@test.com`,
      cpf: `${timestamp}`.slice(0, 11).padStart(11, '0'),
      birthDate: '1990-05-15', // String ISO
      hireDate: '2024-01-10', // String ISO
      departmentId,
      positionId,
      salary: 500000, // R$ 5.000,00 em centavos
      phone: '11999999999',
      address: 'Rua Teste, 123',
    };

    const result = await caller.employees.create(input);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.id).toBeTypeOf('number');
  }, 15000);

  it('deve criar funcionário sem data de nascimento (opcional)', async () => {
    const timestamp = Date.now();
    const input: inferProcedureInput<AppRouter['employees']['create']> = {
      employeeCode: `TEST-${timestamp}`,
      name: 'Maria Santos Teste',
      email: `maria.santos.${timestamp}@test.com`,
      hireDate: '2024-02-20',
      departmentId,
      positionId,
    };

    const result = await caller.employees.create(input);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.id).toBeTypeOf('number');
  }, 15000);

  it('deve validar que positionId é obrigatório', async () => {
    const input = {
      employeeCode: `TEST-${Date.now()}`,
      name: 'Pedro Oliveira Teste',
      email: `pedro.oliveira.${Date.now()}@test.com`,
      hireDate: '2024-03-15',
      departmentId,
      // positionId ausente - deve falhar
    };

    await expect(
      caller.employees.create(input as any)
    ).rejects.toThrow();
  });

  it('deve validar formato de email', async () => {
    const input = {
      employeeCode: `TEST-${Date.now()}`,
      name: 'Ana Costa Teste',
      email: 'email-invalido', // Email inválido
      hireDate: '2024-04-10',
      departmentId,
      positionId,
    };

    await expect(
      caller.employees.create(input as any)
    ).rejects.toThrow();
  });

  it('deve validar que hireDate é obrigatório', async () => {
    const input = {
      employeeCode: `TEST-${Date.now()}`,
      name: 'Carlos Souza Teste',
      email: `carlos.souza.${Date.now()}@test.com`,
      // hireDate ausente - deve falhar
      departmentId,
      positionId,
    };

    await expect(
      caller.employees.create(input as any)
    ).rejects.toThrow();
  });
});
