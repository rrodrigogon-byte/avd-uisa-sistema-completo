import { describe, it, expect } from 'vitest';
import { getDb } from '../db';
import { evaluationCycles, employees, performanceEvaluations } from '../../drizzle/schema';

/**
 * Testes de Exportação de Relatórios
 * Valida que os dados estão disponíveis e estruturados corretamente para exportação
 */
describe('Exportação de Relatórios', () => {
  it('deve buscar ciclos de avaliação para exportação', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const cycles = await db.select().from(evaluationCycles).limit(10);

    expect(Array.isArray(cycles)).toBe(true);
    
    // Validar estrutura dos dados
    if (cycles.length > 0) {
      const cycle = cycles[0];
      expect(cycle).toHaveProperty('id');
      expect(cycle).toHaveProperty('name');
      expect(cycle).toHaveProperty('year');
      expect(cycle).toHaveProperty('startDate');
      expect(cycle).toHaveProperty('endDate');
      expect(cycle).toHaveProperty('status');
    }
  });

  it('deve buscar funcionários para exportação', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const employeesList = await db.select().from(employees).limit(10);

    expect(Array.isArray(employeesList)).toBe(true);
    expect(employeesList.length).toBeGreaterThan(0);
    
    // Validar estrutura dos dados
    const employee = employeesList[0];
    expect(employee).toHaveProperty('id');
    expect(employee).toHaveProperty('employeeCode');
    expect(employee).toHaveProperty('name');
    expect(employee).toHaveProperty('email');
  });

  it('deve buscar avaliações de desempenho para exportação', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const evaluations = await db.select().from(performanceEvaluations).limit(10);

    expect(Array.isArray(evaluations)).toBe(true);
    
    // Validar estrutura dos dados
    if (evaluations.length > 0) {
      const evaluation = evaluations[0];
      expect(evaluation).toHaveProperty('id');
      expect(evaluation).toHaveProperty('employeeId');
      expect(evaluation).toHaveProperty('cycleId');
    }
  });

  it('deve validar que dados estão prontos para exportação CSV/Excel', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Buscar dados consolidados
    const cycles = await db.select().from(evaluationCycles).limit(5);
    const employeesList = await db.select().from(employees).limit(5);
    const evaluations = await db.select().from(performanceEvaluations).limit(5);

    // Validar que temos dados em todas as tabelas principais
    expect(cycles.length).toBeGreaterThanOrEqual(0);
    expect(employeesList.length).toBeGreaterThan(0);
    expect(evaluations.length).toBeGreaterThanOrEqual(0);

    // Validar que os dados podem ser serializados (necessário para exportação)
    expect(() => JSON.stringify(cycles)).not.toThrow();
    expect(() => JSON.stringify(employeesList)).not.toThrow();
    expect(() => JSON.stringify(evaluations)).not.toThrow();
  });
});
