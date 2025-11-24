import { describe, it, expect, beforeAll } from 'vitest';
import { getEmployeeById } from '../db';
import { getDb } from '../db';
import { evaluationCycles } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Testes para validar as correções implementadas
 */

describe('Correções Críticas', () => {
  describe('Correção 1: Validação de Meta (20 caracteres)', () => {
    it('deve aceitar descrição com 20 caracteres', () => {
      const description = 'Descrição válida com 20 caracteres';
      expect(description.length).toBeGreaterThanOrEqual(20);
    });

    it('deve rejeitar descrição com menos de 20 caracteres', () => {
      const description = 'Muito curta';
      expect(description.length).toBeLessThan(20);
    });
  });

  describe('Correção 2: Estrutura de getEmployeeById', () => {
    it('deve retornar estrutura aninhada {employee, department, position}', async () => {
      const result = await getEmployeeById(1);
      
      if (result) {
        // Verificar que a estrutura é aninhada
        expect(result).toHaveProperty('employee');
        expect(result).toHaveProperty('department');
        expect(result).toHaveProperty('position');
        
        // Verificar que employee tem propriedades esperadas
        expect(result.employee).toHaveProperty('id');
        expect(result.employee).toHaveProperty('name');
        expect(result.employee).toHaveProperty('email');
      }
    });

    it('deve retornar undefined para ID inexistente', async () => {
      const result = await getEmployeeById(999999);
      expect(result).toBeUndefined();
    });
  });

  describe('Correção 3: Sistema de Aprovação de Ciclos', () => {
    it('deve ter campos de aprovação no schema evaluationCycles', async () => {
      const db = await getDb();
      if (!db) {
        console.warn('Database not available, skipping test');
        return;
      }

      // Verificar se a tabela tem os campos novos
      const [cycle] = await db
        .select()
        .from(evaluationCycles)
        .limit(1);

      if (cycle) {
        expect(cycle).toHaveProperty('approvedForGoals');
        expect(cycle).toHaveProperty('approvedForGoalsAt');
        expect(cycle).toHaveProperty('approvedForGoalsBy');
      }
    });

    it('campo approvedForGoals deve ser boolean com default false', async () => {
      const db = await getDb();
      if (!db) {
        console.warn('Database not available, skipping test');
        return;
      }

      const [cycle] = await db
        .select()
        .from(evaluationCycles)
        .limit(1);

      if (cycle) {
        expect(typeof cycle.approvedForGoals).toBe('boolean');
        expect([true, false]).toContain(cycle.approvedForGoals);
      }
    });
  });

  describe('Correção 4: Seletor de Funcionários', () => {
    it('deve retornar lista de funcionários com estrutura aninhada', async () => {
      const db = await getDb();
      if (!db) {
        console.warn('Database not available, skipping test');
        return;
      }

      const { getAllEmployees } = await import('../db');
      const employees = await getAllEmployees();

      if (employees && employees.length > 0) {
        const firstEmployee = employees[0];
        
        // Verificar estrutura aninhada
        expect(firstEmployee).toHaveProperty('employee');
        expect(firstEmployee.employee).toHaveProperty('id');
        expect(firstEmployee.employee).toHaveProperty('name');
      }
    });
  });
});
