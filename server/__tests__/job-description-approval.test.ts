import { describe, it, expect, beforeAll } from 'vitest';
import * as db from '../db';
import { getDb } from '../db';
import { users } from '../../drizzle/schema';

describe('Job Description Approval Workflow', () => {
  let testJobDescId: number;
  let testAdminId: number;

  beforeAll(async () => {
    const database = await getDb();
    if (!database) {
      throw new Error('Database not available');
    }

    // Criar admin de teste
    const adminResult = await database.insert(users).values({
      openId: 'test-admin-job-approval',
      name: 'Test Admin Job',
      email: 'test-admin-job@example.com',
      role: 'admin',
    });
    testAdminId = Number(adminResult[0].insertId);

    // Criar descrição de cargo de teste
    const jobDesc = await db.createJobDescription({
      title: 'Analista de Sistemas',
      code: 'AS-TEST-001',
      department: 'TI',
      level: 'Pleno',
      summary: 'Desenvolvimento de sistemas',
      mission: 'Desenvolver soluções tecnológicas',
      createdBy: testAdminId,
      status: 'rascunho',
    });
    testJobDescId = jobDesc.id;
  });

  it('deve criar uma descrição de cargo em status rascunho', async () => {
    const jobDesc = await db.getJobDescriptionById(testJobDescId);
    expect(jobDesc).toBeDefined();
    expect(jobDesc?.status).toBe('rascunho');
    expect(jobDesc?.isActive).toBe(false);
  });

  it('deve submeter descrição de cargo para análise', async () => {
    await db.updateJobDescription(testJobDescId, { 
      status: 'em_analise', 
      submittedAt: new Date() 
    });
    
    await db.createJobDescriptionApprovalHistory({
      jobDescriptionId: testJobDescId,
      action: 'submetido',
      performedBy: testAdminId,
      previousStatus: 'rascunho',
      newStatus: 'em_analise',
    });

    const jobDesc = await db.getJobDescriptionById(testJobDescId);
    expect(jobDesc?.status).toBe('em_analise');
    expect(jobDesc?.submittedAt).toBeDefined();
  });

  it('deve registrar histórico de aprovação', async () => {
    const history = await db.getJobDescriptionApprovalHistory(testJobDescId);
    expect(history).toBeDefined();
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].action).toBe('submetido');
  });

  it('deve aprovar descrição de cargo e ativá-la', async () => {
    await db.updateJobDescription(testJobDescId, {
      status: 'aprovado',
      isActive: true,
      approvedBy: testAdminId,
      approvedAt: new Date(),
      approvalComments: 'Descrição aprovada',
    });

    await db.createJobDescriptionApprovalHistory({
      jobDescriptionId: testJobDescId,
      action: 'aprovado',
      performedBy: testAdminId,
      comments: 'Descrição aprovada',
      previousStatus: 'em_analise',
      newStatus: 'aprovado',
    });

    const jobDesc = await db.getJobDescriptionById(testJobDescId);
    expect(jobDesc?.status).toBe('aprovado');
    expect(jobDesc?.isActive).toBe(true);
    expect(jobDesc?.approvedBy).toBe(testAdminId);
    expect(jobDesc?.approvedAt).toBeDefined();
  });

  it('deve ter histórico completo de aprovação', async () => {
    const history = await db.getJobDescriptionApprovalHistory(testJobDescId);
    expect(history.length).toBe(2);
    expect(history[0].action).toBe('submetido');
    expect(history[1].action).toBe('aprovado');
  });

  it('deve aparecer na lista de descrições ativas após aprovação', async () => {
    const activeJobs = await db.getActiveJobDescriptions();
    const found = activeJobs.find(j => j.id === testJobDescId);
    expect(found).toBeDefined();
    expect(found?.status).toBe('aprovado');
  });
});
