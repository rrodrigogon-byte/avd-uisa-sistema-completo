import { describe, it, expect } from 'vitest';
import { getDb } from './db';
import { jobDescriptions, jobResponsibilities, jobKnowledge, jobCompetencies, employeeActivities } from '../drizzle/schema';

describe('Job Descriptions Database', () => {
  it('deve conectar ao banco de dados', async () => {
    const db = await getDb();
    expect(db).toBeDefined();
  });

  it('deve ter as tabelas necessárias criadas', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Verificar se as tabelas existem fazendo uma query simples
    const jobDescsResult = await db.select().from(jobDescriptions).limit(1);
    expect(Array.isArray(jobDescsResult)).toBe(true);

    const responsibilitiesResult = await db.select().from(jobResponsibilities).limit(1);
    expect(Array.isArray(responsibilitiesResult)).toBe(true);

    const knowledgeResult = await db.select().from(jobKnowledge).limit(1);
    expect(Array.isArray(knowledgeResult)).toBe(true);

    const competenciesResult = await db.select().from(jobCompetencies).limit(1);
    expect(Array.isArray(competenciesResult)).toBe(true);

    const activitiesResult = await db.select().from(employeeActivities).limit(1);
    expect(Array.isArray(activitiesResult)).toBe(true);
  });
});
