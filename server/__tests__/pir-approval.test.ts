import { describe, it, expect, beforeAll } from 'vitest';
import * as db from '../db';
import { getDb } from '../db';
import { users } from '../../drizzle/schema';

describe('PIR Approval Workflow', () => {
  let testPirId: number;
  let testUserId: number;
  let testManagerId: number;

  beforeAll(async () => {
    const database = await getDb();
    if (!database) {
      throw new Error('Database not available');
    }

    // Criar usuários de teste
    const userResult = await database.insert(users).values({
      openId: 'test-user-pir-approval',
      name: 'Test User PIR',
      email: 'test-pir@example.com',
      role: 'user',
    });
    testUserId = Number(userResult[0].insertId);

    const managerResult = await database.insert(users).values({
      openId: 'test-manager-pir-approval',
      name: 'Test Manager PIR',
      email: 'test-manager-pir@example.com',
      role: 'admin',
    });
    testManagerId = Number(managerResult[0].insertId);

    // Criar PIR de teste
    const pir = await db.createPir({
      userId: testUserId,
      managerId: testManagerId,
      title: 'PIR de Teste - Workflow',
      description: 'Teste de workflow de aprovação',
      period: '2024',
      status: 'rascunho',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
    });
    testPirId = pir.id;
  });

  it('deve criar um PIR em status rascunho', async () => {
    const pir = await db.getPirById(testPirId);
    expect(pir).toBeDefined();
    expect(pir?.status).toBe('rascunho');
  });

  it('deve submeter PIR para análise', async () => {
    await db.updatePir(testPirId, { 
      status: 'em_analise', 
      submittedAt: new Date() 
    });
    
    await db.createPirApprovalHistory({
      pirId: testPirId,
      action: 'submetido',
      performedBy: testUserId,
      previousStatus: 'rascunho',
      newStatus: 'em_analise',
    });

    const pir = await db.getPirById(testPirId);
    expect(pir?.status).toBe('em_analise');
    expect(pir?.submittedAt).toBeDefined();
  });

  it('deve registrar histórico de aprovação', async () => {
    const history = await db.getPirApprovalHistory(testPirId);
    expect(history).toBeDefined();
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].action).toBe('submetido');
  });

  it('deve aprovar PIR', async () => {
    await db.updatePir(testPirId, {
      status: 'aprovado',
      approvedBy: testManagerId,
      approvedAt: new Date(),
      approvalComments: 'Aprovado para execução',
    });

    await db.createPirApprovalHistory({
      pirId: testPirId,
      action: 'aprovado',
      performedBy: testManagerId,
      comments: 'Aprovado para execução',
      previousStatus: 'em_analise',
      newStatus: 'aprovado',
    });

    const pir = await db.getPirById(testPirId);
    expect(pir?.status).toBe('aprovado');
    expect(pir?.approvedBy).toBe(testManagerId);
    expect(pir?.approvedAt).toBeDefined();
  });

  it('deve ter histórico completo de aprovação', async () => {
    const history = await db.getPirApprovalHistory(testPirId);
    expect(history.length).toBe(2);
    expect(history[0].action).toBe('submetido');
    expect(history[1].action).toBe('aprovado');
  });
});
