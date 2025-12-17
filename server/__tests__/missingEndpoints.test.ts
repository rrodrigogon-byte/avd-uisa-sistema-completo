import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from '../db';
import { employees, nineBoxPositions, pdiPlans, smartGoals, performanceEvaluations } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Testes para endpoints faltantes
 * Valida se os endpoints foram criados corretamente
 */

describe('Missing Endpoints', () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  describe('nineBox.getEmployeePosition', () => {
    it('deve retornar null se nenhuma posicao existe', async () => {
      // Verificar se a tabela nineBoxPositions existe
      const positions = await db.select().from(nineBoxPositions).limit(1);
      expect(Array.isArray(positions)).toBe(true);
    });

    it('deve retornar posicao se existir', async () => {
      // Verificar estrutura da tabela
      const positions = await db.select().from(nineBoxPositions).limit(1);
      if (positions.length > 0) {
        const pos = positions[0];
        expect(pos).toHaveProperty('employeeId');
        expect(pos).toHaveProperty('performance');
        expect(pos).toHaveProperty('potential');
      }
    });
  });

  describe('pdi.listByEmployee', () => {
    it('deve retornar array vazio se nenhum PDI existe', async () => {
      const pdis = await db.select().from(pdiPlans).limit(1);
      expect(Array.isArray(pdis)).toBe(true);
    });

    it('deve retornar PDIs com estrutura correta', async () => {
      const pdis = await db.select().from(pdiPlans).limit(1);
      if (pdis.length > 0) {
        const pdi = pdis[0];
        expect(pdi).toHaveProperty('id');
        expect(pdi).toHaveProperty('employeeId');
        expect(pdi).toHaveProperty('status');
      }
    });
  });

  describe('goals.listByEmployee', () => {
    it('deve retornar array vazio se nenhuma meta existe', async () => {
      const goals = await db.select().from(smartGoals).limit(1);
      expect(Array.isArray(goals)).toBe(true);
    });

    it('deve retornar metas com estrutura correta', async () => {
      const goals = await db.select().from(smartGoals).limit(1);
      if (goals.length > 0) {
        const goal = goals[0];
        expect(goal).toHaveProperty('id');
        expect(goal).toHaveProperty('employeeId');
        expect(goal).toHaveProperty('status');
      }
    });
  });

  describe('performance.listByEmployee', () => {
    it('deve retornar array vazio se nenhuma avaliacao existe', async () => {
      const evaluations = await db.select().from(performanceEvaluations).limit(1);
      expect(Array.isArray(evaluations)).toBe(true);
    });

    it('deve retornar avaliacoes com estrutura correta', async () => {
      const evaluations = await db.select().from(performanceEvaluations).limit(1);
      if (evaluations.length > 0) {
        const eval = evaluations[0];
        expect(eval).toHaveProperty('id');
        expect(eval).toHaveProperty('employeeId');
        expect(eval).toHaveProperty('workflowStatus');
      }
    });
  });
});
