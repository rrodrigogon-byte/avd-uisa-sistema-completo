#!/usr/bin/env tsx
/**
 * Script para popular banco de dados com Mapa de Sucessão UISA
 * Dados: 30 cargos, 42 funcionários, 10 planos de sucessão
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { departments, positions, employees, successionPlans, successionCandidates } from '../drizzle/schema';
import { readFileSync } from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não configurada');
  process.exit(1);
}

async function main() {
  console.log('🔄 Conectando ao banco de dados...');
  
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  console.log('📖 Carregando dados de sucessão...');
  const data = JSON.parse(readFileSync('/tmp/succession_data_clean.json', 'utf-8'));

  console.log(`\n📊 Dados a serem inseridos:`);
  console.log(`   - ${data.positions.length} cargos`);
  console.log(`   - ${data.employees.length} funcionários`);
  console.log(`   - ${data.succession_plans.length} planos de sucessão`);

  try {
    // 0. Criar departamentos únicos
    console.log('\n🔄 Criando departamentos...');
    const departmentNames = new Set<string>();
    data.positions.forEach((p: any) => departmentNames.add(p.department));
    data.employees.forEach((e: any) => departmentNames.add(e.department));
    
    const insertedDepartments: Map<string, number> = new Map();
    
    for (const deptName of Array.from(departmentNames)) {
      const [result] = await db.insert(departments).values({
        code: `DEPT${Date.now()}-${insertedDepartments.size + 1}`,
        name: deptName,
        description: `Departamento de ${deptName}`,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      insertedDepartments.set(deptName, Number(result.insertId));
      console.log(`   ✅ ${deptName} (ID: ${result.insertId})`);
    }

    // 1. Inserir cargos (positions)
    console.log('\n🔄 Inserindo cargos...');
    const insertedPositions: Map<string, number> = new Map();
    
    for (const pos of data.positions) {
      const deptId = insertedDepartments.get(pos.department) || insertedDepartments.values().next().value;
      
      const [result] = await db.insert(positions).values({
        code: `POS${Date.now()}-${pos.id}`,
        title: pos.title,
        description: `Cargo de ${pos.department}`,
        level: pos.level === 'diretoria' ? 'diretor' : pos.level === 'gerencia' ? 'gerente' : 'coordenador',
        departmentId: deptId,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      insertedPositions.set(pos.title, Number(result.insertId));
      console.log(`   ✅ ${pos.title} (ID: ${result.insertId})`);
    }

    // 2. Inserir funcionários (employees)
    console.log('\n🔄 Inserindo funcionários...');
    const insertedEmployees: Map<string, number> = new Map();
    
    for (const emp of data.employees) {
      const positionId = insertedPositions.get(emp.position) || insertedPositions.values().next().value;
      const deptId = insertedDepartments.get(emp.department) || insertedDepartments.values().next().value;
      
      const [result] = await db.insert(employees).values({
        employeeCode: emp.employeeCode,
        name: emp.name,
        email: `${emp.name.toLowerCase().replace(/\s+/g, '.')}@uisa.com.br`,
        positionId: positionId,
        departmentId: deptId,
        hireDate: new Date('2020-01-01'),
        status: 'ativo',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      insertedEmployees.set(emp.name, Number(result.insertId));
      console.log(`   ✅ ${emp.name} (${emp.employeeCode})`);
    }

    // 3. Inserir planos de sucessão
    console.log('\n🔄 Inserindo planos de sucessão...');
    const insertedPlans: Array<{ id: number; positionTitle: string; successors: any[] }> = [];
    
    for (const plan of data.succession_plans) {
      const positionId = insertedPositions.get(plan.positionTitle);
      const currentHolderId = insertedEmployees.get(plan.currentHolder);
      
      if (!positionId) {
        console.warn(`   ⚠️  Cargo não encontrado: ${plan.positionTitle}`);
        continue;
      }
      
      const [result] = await db.insert(successionPlans).values({
        positionId: positionId,
        currentHolderId: currentHolderId || null,
        isCritical: plan.riskLevel === 'critico',
        riskLevel: plan.riskLevel,
        status: 'ativo',
        exitRisk: plan.riskLevel,
        notes: `Plano de sucessão para ${plan.positionTitle}`,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      insertedPlans.push({
        id: Number(result.insertId),
        positionTitle: plan.positionTitle,
        successors: plan.successors
      });
      
      console.log(`   ✅ ${plan.positionTitle} (ID: ${result.insertId})`);
    }

    // 4. Inserir sucessores
    console.log('\n🔄 Inserindo sucessores...');
    let successorCount = 0;
    
    for (const plan of insertedPlans) {
      for (const successor of plan.successors) {
        const employeeId = insertedEmployees.get(successor.name);
        
        if (!employeeId) {
          console.warn(`   ⚠️  Funcionário não encontrado: ${successor.name}`);
          continue;
        }
        
        // Mapear readinessLevel para o formato do schema
        const readinessMap: Record<string, string> = {
          'imediato': 'imediato',
          '1-2-anos': '1_ano',
          '2-3-anos': '2_3_anos',
          'mais-3-anos': 'mais_3_anos'
        };
        
        await db.insert(successionCandidates).values({
          planId: plan.id,
          employeeId: employeeId,
          readinessLevel: readinessMap[successor.readinessLevel] || '2_3_anos',
          priority: successor.priority,
          performanceRating: successor.performanceRating || 'medio',
          potentialRating: successor.potentialRating || 'medio',
          developmentNeeds: `Desenvolvimento para ${plan.positionTitle}`,
          notes: `Sucessor potencial para ${plan.positionTitle}`,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        successorCount++;
      }
    }
    
    console.log(`   ✅ ${successorCount} sucessores inseridos`);

    // 5. Estatísticas finais
    console.log('\n📈 Resumo da importação:');
    console.log(`   ✅ ${insertedDepartments.size} departamentos criados`);
    console.log(`   ✅ ${insertedPositions.size} cargos criados`);
    console.log(`   ✅ ${insertedEmployees.size} funcionários criados`);
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
