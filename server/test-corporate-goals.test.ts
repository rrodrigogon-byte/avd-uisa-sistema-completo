import { describe, it, expect } from 'vitest';
import { getDb } from './db';
import { smartGoals } from '../drizzle/schema';
import { eq, desc } from 'drizzle-orm';

describe('Corporate Goals Endpoint Test', () => {
  it('should fetch corporate goals from database', async () => {
    const db = await getDb();
    
    if (!db) {
      console.log('⚠️  Database not available');
      return;
    }

    // Buscar todas as metas corporativas
    const goals = await db
      .select({
        id: smartGoals.id,
        title: smartGoals.title,
        description: smartGoals.description,
        status: smartGoals.status,
        progress: smartGoals.progress,
        deadline: smartGoals.endDate,
        goalType: smartGoals.goalType,
        category: smartGoals.category,
        createdAt: smartGoals.createdAt,
      })
      .from(smartGoals)
      .where(eq(smartGoals.goalType, 'corporate'))
      .orderBy(desc(smartGoals.createdAt));

    console.log(`\n✅ Encontradas ${goals.length} metas corporativas\n`);
    
    if (goals.length > 0) {
      console.log('📋 Primeiras 3 metas:');
      goals.slice(0, 3).forEach((goal, index) => {
        console.log(`\n${index + 1}. ${goal.title}`);
        console.log(`   ID: ${goal.id}`);
        console.log(`   Status: ${goal.status}`);
        console.log(`   Progresso: ${goal.progress}%`);
        console.log(`   Categoria: ${goal.category}`);
      });
    } else {
      console.log('⚠️  Nenhuma meta corporativa encontrada no banco de dados');
      console.log('   Isso explica por que a página está em branco');
    }
    
    // Verificar todas as metas (não apenas corporativas)
    const allGoals = await db
      .select({
        id: smartGoals.id,
        goalType: smartGoals.goalType,
      })
      .from(smartGoals);
    
    console.log(`\n📊 Total de metas no sistema: ${allGoals.length}`);
    
    const goalsByType = allGoals.reduce((acc: Record<string, number>, goal) => {
      acc[goal.goalType] = (acc[goal.goalType] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📈 Metas por tipo:');
    Object.entries(goalsByType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });

    expect(db).toBeDefined();
  });
});
