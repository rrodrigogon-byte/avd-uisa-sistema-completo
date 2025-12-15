import { describe, it, expect } from 'vitest';
import { getDb } from './db';
import { evaluationCycles } from '../drizzle/schema';
import { desc } from 'drizzle-orm';

describe('Evaluation Cycles Test', () => {
  it('should fetch evaluation cycles from database', async () => {
    const db = await getDb();
    
    if (!db) {
      console.log('⚠️  Database not available');
      return;
    }

    // Buscar todos os ciclos
    const cycles = await db
      .select()
      .from(evaluationCycles)
      .orderBy(desc(evaluationCycles.createdAt));

    console.log(`\n✅ Encontrados ${cycles.length} ciclos de avaliação\n`);
    
    if (cycles.length > 0) {
      console.log('📋 Todos os ciclos:');
      cycles.forEach((cycle, index) => {
        console.log(`\n${index + 1}. ${cycle.name}`);
        console.log(`   ID: ${cycle.id}`);
        console.log(`   Status: ${cycle.status}`);
        console.log(`   Aprovado para metas: ${cycle.approvedForGoals ? 'Sim' : 'Não'}`);
        console.log(`   Tipo: ${cycle.type}`);
        console.log(`   Ano: ${cycle.year}`);
        console.log(`   Período: ${cycle.startDate} - ${cycle.endDate}`);
      });
      
      // Contar por status
      const byStatus = cycles.reduce((acc: Record<string, number>, cycle) => {
        acc[cycle.status] = (acc[cycle.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📊 Ciclos por status:');
      Object.entries(byStatus).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
      
      // Contar pendentes de aprovação
      const pendingApproval = cycles.filter(c => c.status === 'planejado' && !c.approvedForGoals);
      console.log(`\n⏳ Ciclos pendentes de aprovação: ${pendingApproval.length}`);
      
      if (pendingApproval.length > 0) {
        console.log('   Estes ciclos deveriam aparecer na página de aprovação:');
        pendingApproval.forEach(c => {
          console.log(`   - ${c.name} (ID: ${c.id})`);
        });
      }
    } else {
      console.log('⚠️  Nenhum ciclo encontrado no banco de dados');
    }

    expect(db).toBeDefined();
  });
});
