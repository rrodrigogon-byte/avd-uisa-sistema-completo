#!/usr/bin/env node
/**
 * Script para popular banco de dados com Mapa de Sucessão UISA
 * Dados: 30 cargos, 42 funcionários, 10 planos de sucessão
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../drizzle/schema.js';
import { readFileSync } from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não configurada');
  process.exit(1);
}

async function main() {
  console.log('🔄 Conectando ao banco de dados...');
  
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection, { schema, mode: 'default' });

  console.log('📖 Carregando dados de sucessão...');
  const data = JSON.parse(readFileSync('/tmp/succession_data_clean.json', 'utf-8'));

  console.log(`\n📊 Dados a serem inseridos:`);
  console.log(`   - ${data.positions.length} cargos`);
  console.log(`   - ${data.employees.length} funcionários`);
  console.log(`   - ${data.succession_plans.length} planos de sucessão`);

  try {
    // 1. Inserir planos de sucessão (tabela principal)
    console.log('\n🔄 Inserindo planos de sucessão...');
    const insertedPlans = [];
    
    for (const plan of data.succession_plans) {
      const [result] = await db.insert(schema.successionPlans).values({
        positionTitle: plan.positionTitle,
        department: plan.department,
        currentHolder: plan.currentHolder,
        riskLevel: plan.riskLevel,
        impact: plan.impact || 'medio',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      insertedPlans.push({
        id: result.insertId,
        positionTitle: plan.positionTitle,
        successors: plan.successors
      });
      
      console.log(`   ✅ ${plan.positionTitle} (ID: ${result.insertId})`);
    }

    // 2. Inserir sucessores
    console.log('\n🔄 Inserindo sucessores...');
    let successorCount = 0;
    
    for (const plan of insertedPlans) {
      for (const successor of plan.successors) {
        await db.insert(schema.successionCandidates).values({
          planId: plan.id,
          candidateName: successor.name,
          readinessLevel: successor.readinessLevel,
          priority: successor.priority,
          performanceRating: successor.performanceRating || 'medio',
          potentialRating: successor.potentialRating || 'medio',
          notes: `Sucessor potencial para ${plan.positionTitle}`,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        successorCount++;
      }
    }
    
    console.log(`   ✅ ${successorCount} sucessores inseridos`);

    // 3. Estatísticas finais
    console.log('\n📈 Resumo da importação:');
    console.log(`   ✅ ${insertedPlans.length} planos de sucessão criados`);
    console.log(`   ✅ ${successorCount} sucessores vinculados`);
    console.log(`   ✅ Média de ${(successorCount / insertedPlans.length).toFixed(1)} sucessores por cargo`);

    console.log('\n✅ Seed de sucessão concluído com sucesso!');

  } catch (error) {
    console.error('\n❌ Erro ao popular banco:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
