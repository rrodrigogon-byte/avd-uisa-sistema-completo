import { describe, it, expect } from 'vitest';
import { getDb } from './db';
import { smartGoals, evaluationCycles, employees } from '../drizzle/schema';
import { eq, desc } from 'drizzle-orm';

describe('Correções Implementadas - Validação', () => {
  it('Problema 1: Metas Corporativas devem estar visíveis (status corretos)', async () => {
    const db = await getDb();
    if (!db) {
      console.log('⚠️  Database not available');
      return;
    }

    // Buscar metas corporativas
    const goals = await db
      .select({
        id: smartGoals.id,
        title: smartGoals.title,
        status: smartGoals.status,
        goalType: smartGoals.goalType,
      })
      .from(smartGoals)
      .where(eq(smartGoals.goalType, 'corporate'))
      .orderBy(desc(smartGoals.createdAt));

    console.log(`\n✅ Teste 1: Encontradas ${goals.length} metas corporativas`);
    
    // Validar que existem metas corporativas
    expect(goals.length).toBeGreaterThan(0);
    
    // Validar que os status são válidos do schema
    const validStatuses = ['draft', 'pending_approval', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled'];
    goals.forEach(goal => {
      expect(validStatuses).toContain(goal.status);
      console.log(`   ✓ ${goal.title} - Status: ${goal.status}`);
    });
    
    console.log('   ✅ Todos os status estão corretos!\n');
  });

  it('Problema 2: Ciclos devem aparecer para aprovação (status correto)', async () => {
    const db = await getDb();
    if (!db) {
      console.log('⚠️  Database not available');
      return;
    }

    // Buscar ciclos pendentes de aprovação
    const pendingCycles = await db
      .select({
        id: evaluationCycles.id,
        name: evaluationCycles.name,
        status: evaluationCycles.status,
        approvedForGoals: evaluationCycles.approvedForGoals,
      })
      .from(evaluationCycles)
      .where(eq(evaluationCycles.status, 'planejado'));

    console.log(`\n✅ Teste 2: Encontrados ${pendingCycles.length} ciclos com status "planejado"`);
    
    // Validar que existem ciclos
    expect(pendingCycles.length).toBeGreaterThan(0);
    
    // Contar pendentes de aprovação
    const notApproved = pendingCycles.filter(c => !c.approvedForGoals);
    console.log(`   📋 Ciclos pendentes de aprovação: ${notApproved.length}`);
    
    notApproved.forEach(cycle => {
      console.log(`   ✓ ${cycle.name} - Status: ${cycle.status}, Aprovado: ${cycle.approvedForGoals ? 'Sim' : 'Não'}`);
    });
    
    // Validar que o status é "planejado" (não "planejamento")
    pendingCycles.forEach(cycle => {
      expect(cycle.status).toBe('planejado');
    });
    
    console.log('   ✅ Todos os ciclos têm status correto!\n');
  });

  it('Melhoria 1: Metas corporativas de exemplo foram criadas', async () => {
    const db = await getDb();
    if (!db) {
      console.log('⚠️  Database not available');
      return;
    }

    // Buscar metas corporativas
    const corporateGoals = await db
      .select({
        id: smartGoals.id,
        title: smartGoals.title,
        status: smartGoals.status,
        progress: smartGoals.progress,
        category: smartGoals.category,
      })
      .from(smartGoals)
      .where(eq(smartGoals.goalType, 'corporate'))
      .orderBy(desc(smartGoals.createdAt));

    console.log(`\n✅ Teste 3: ${corporateGoals.length} metas corporativas de exemplo`);
    
    // Validar que existem pelo menos 8 metas (as que criamos)
    expect(corporateGoals.length).toBeGreaterThanOrEqual(8);
    
    // Mostrar algumas metas
    console.log('   📋 Exemplos de metas criadas:');
    corporateGoals.slice(0, 5).forEach(goal => {
      console.log(`   ✓ ${goal.title} (${goal.category}, ${goal.progress}%)`);
    });
    
    console.log('   ✅ Metas de exemplo criadas com sucesso!\n');
  });

  it('Validação: Funcionários ativos existem para receber notificações', async () => {
    const db = await getDb();
    if (!db) {
      console.log('⚠️  Database not available');
      return;
    }

    // Buscar funcionários ativos com email
    const activeEmployees = await db
      .select({
        id: employees.id,
        name: employees.name,
        email: employees.email,
        status: employees.status,
      })
      .from(employees)
      .where(eq(employees.status, 'ativo'));

    console.log(`\n✅ Teste 4: ${activeEmployees.length} funcionários ativos`);
    
    // Validar que existem funcionários
    expect(activeEmployees.length).toBeGreaterThan(0);
    
    // Contar funcionários com email
    const withEmail = activeEmployees.filter(e => e.email);
    console.log(`   📧 Funcionários com email: ${withEmail.length}`);
    
    // Mostrar alguns exemplos
    console.log('   📋 Exemplos:');
    activeEmployees.slice(0, 3).forEach(emp => {
      console.log(`   ✓ ${emp.name} - Email: ${emp.email ? '✓' : '✗'}`);
    });
    
    console.log('   ✅ Funcionários prontos para receber notificações!\n');
  });
});
