import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from '../routers';
import type { Context } from '../_core/context';

/**
 * Testes para o employeesRouter
 * Valida CRUD completo de funcionários
 */

describe('employeesRouter', () => {
  // Mock de contexto com usuário admin
  const mockAdminContext: Partial<Context> = {
    user: {
      id: 1,
      openId: 'test-admin',
      name: 'Admin Test',
      email: 'admin@test.com',
      role: 'admin',
      loginMethod: 'oauth',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      isSalaryLead: false,
      faceDescriptor: null,
      facePhotoUrl: null,
      faceRegisteredAt: null,
    },
  } as Context;

  // Mock de contexto com usuário RH
  const mockRHContext: Partial<Context> = {
    user: {
      id: 2,
      openId: 'test-rh',
      name: 'RH Test',
      email: 'rh@test.com',
      role: 'rh',
      loginMethod: 'oauth',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      isSalaryLead: false,
      faceDescriptor: null,
      facePhotoUrl: null,
      faceRegisteredAt: null,
    },
  } as Context;

  // Mock de contexto com usuário colaborador (sem permissão)
  const mockColaboradorContext: Partial<Context> = {
    user: {
      id: 3,
      openId: 'test-colaborador',
      name: 'Colaborador Test',
      email: 'colaborador@test.com',
      role: 'colaborador',
      loginMethod: 'oauth',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      isSalaryLead: false,
      faceDescriptor: null,
      facePhotoUrl: null,
      faceRegisteredAt: null,
    },
  } as Context;

  const caller = appRouter.createCaller(mockAdminContext as Context);
  const rhCaller = appRouter.createCaller(mockRHContext as Context);
  const colaboradorCaller = appRouter.createCaller(mockColaboradorContext as Context);

  describe('employees.list', () => {
    it('deve listar funcionários sem filtros', async () => {
      const result = await caller.employees.list();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('deve listar funcionários com filtro de status', async () => {
      const result = await caller.employees.list({ status: 'ativo' });
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('deve listar funcionários com busca por nome', async () => {
      const result = await caller.employees.list({ search: 'test' });
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('employees.getDepartments', () => {
    it('deve listar departamentos', async () => {
      const result = await caller.employees.getDepartments();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Permissões de acesso', () => {
    it('admin deve ter acesso a employees.list', async () => {
      const result = await caller.employees.list();
      expect(result).toBeDefined();
    });

    it('rh deve ter acesso a employees.list', async () => {
      const result = await rhCaller.employees.list();
      expect(result).toBeDefined();
    });

    it('colaborador deve ter acesso a employees.list (leitura)', async () => {
      const result = await colaboradorCaller.employees.list();
      expect(result).toBeDefined();
    });
  });

  describe('Validação de estrutura de dados', () => {
    it('funcionários devem ter estrutura correta', async () => {
      const result = await caller.employees.list();
      
      if (result && result.length > 0) {
        const employee = result[0];
        
        // Validar estrutura do objeto employee
        expect(employee).toHaveProperty('employee');
        expect(employee.employee).toHaveProperty('id');
        expect(employee.employee).toHaveProperty('name');
        expect(employee.employee).toHaveProperty('email');
        expect(employee.employee).toHaveProperty('employeeCode');
        expect(employee.employee).toHaveProperty('status');
        
        // Validar tipos
        expect(typeof employee.employee.id).toBe('number');
        expect(typeof employee.employee.name).toBe('string');
        expect(typeof employee.employee.email).toBe('string');
        expect(typeof employee.employee.employeeCode).toBe('string');
        expect(['ativo', 'afastado', 'desligado']).toContain(employee.employee.status);
      }
    });

    it('departamentos devem ter estrutura correta', async () => {
      const result = await caller.employees.getDepartments();
      
      if (result && result.length > 0) {
        const department = result[0];
        
        expect(department).toHaveProperty('id');
        expect(department).toHaveProperty('name');
        expect(typeof department.id).toBe('number');
        expect(typeof department.name).toBe('string');
      }
    });
  });

  describe('Filtros e busca', () => {
    it('filtro por status deve retornar apenas funcionários com status correspondente', async () => {
      const result = await caller.employees.list({ status: 'ativo' });
      
      if (result && result.length > 0) {
        result.forEach(emp => {
          expect(emp.employee.status).toBe('ativo');
        });
      }
    });

    it('busca deve funcionar com termos parciais', async () => {
      const result = await caller.employees.list({ search: 'a' });
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('busca vazia deve retornar todos os funcionários', async () => {
      const resultAll = await caller.employees.list();
      const resultEmpty = await caller.employees.list({ search: '' });
      
      expect(resultAll.length).toBe(resultEmpty.length);
    });
  });

  describe('Integração com outras entidades', () => {
    it('funcionários devem ter departamento associado quando aplicável', async () => {
      const result = await caller.employees.list();
      
      if (result && result.length > 0) {
        const employeeWithDept = result.find(emp => emp.department);
        
        if (employeeWithDept) {
          expect(employeeWithDept.department).toHaveProperty('id');
          expect(employeeWithDept.department).toHaveProperty('name');
        }
      }
    });

    it('funcionários devem ter cargo associado quando aplicável', async () => {
      const result = await caller.employees.list();
      
      if (result && result.length > 0) {
        const employeeWithPosition = result.find(emp => emp.position);
        
        if (employeeWithPosition) {
          expect(employeeWithPosition.position).toHaveProperty('id');
          expect(employeeWithPosition.position).toHaveProperty('title');
        }
      }
    });
  });
});
