#!/usr/bin/env node
/**
 * Script de Importação Rápida - AVD UISA v2.0.0
 * Importa 3.114 funcionários usando batch inserts
 */

import fs from 'fs';
import mysql from 'mysql2/promise';
import crypto from 'crypto';
import 'dotenv/config';

console.log('⚡ IMPORTAÇÃO RÁPIDA - AVD UISA v2.0.0\n');
console.log('━'.repeat(60));

/**
 * Determina o role baseado no cargo
 */
function determineRole(cargo) {
  if (!cargo) return 'colaborador';
  
  const cargoLower = cargo.toLowerCase();
  
  if (cargoLower.includes('diretor') || cargoLower.includes('presidente') || cargoLower.includes('ceo')) {
    return 'admin';
  }
  
  if (cargoLower.includes('gerente') || cargoLower.includes('coordenador')) {
    return 'gestor';
  }
  
  if (cargoLower.includes('supervisor') || cargoLower.includes('lider')) {
    return 'gestor';
  }
  
  return 'colaborador';
}

/**
 * Gera openId único
 */
function generateOpenId(codigo) {
  return `emp_${codigo}_${crypto.randomBytes(4).toString('hex')}`;
}

async function importFast() {
  const startTime = Date.now();
  
  try {
    console.log('\n🔌 Conectando ao banco...');
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('✅ Conectado!\n');

    // Ler dados
    console.log('📖 Lendo dados...');
    const rawData = fs.readFileSync('./import-data.json', 'utf-8');
    const data = JSON.parse(rawData);
    
    const employees = data.employees || [];
    const usersData = data.users || [];
    
    console.log(`✅ ${employees.length} funcionários`);
    console.log(`✅ ${usersData.length} líderes\n`);

    // Passo 1: Inserir funcionários em batch
    console.log('👨‍💼 Importando funcionários em lote...\n');
    
    const batchSize = 500;
    let totalImported = 0;
    
    for (let i = 0; i < employees.length; i += batchSize) {
      const batch = employees.slice(i, i + batchSize);
      
      const values = batch.map(emp => [
        emp.employeeCode || emp.codigo || emp.chapa,
        emp.name || emp.nome,
        emp.email || emp.corporateEmail || emp.personalEmail,
        emp.cargo || emp.funcao,
        emp.status || (emp.active ? 'ativo' : 'inativo'),
        new Date(), // createdAt
        new Date()  // updatedAt
      ]).filter(v => v[0]); // Só incluir se tiver código
      
      if (values.length === 0) continue;
      
      try {
        await connection.query(
          `INSERT IGNORE INTO employees (codigo, nome, email, cargo, status, createdAt, updatedAt)
           VALUES ?`,
          [values]
        );
        
        totalImported += values.length;
        process.stdout.write(`   Importados: ${totalImported}/${employees.length} (${Math.round(totalImported/employees.length*100)}%)...\r`);
      } catch (error) {
        console.log(`\n   ⚠️  Erro no lote ${i}: ${error.message.substring(0, 80)}`);
      }
    }
    
    console.log(`\n   ✅ ${totalImported} funcionários importados!\n`);

    // Passo 2: Criar usuários de liderança
    console.log('👥 Criando usuários de liderança...\n');
    
    let usersCreated = 0;
    const userBatchSize = 100;
    
    for (let i = 0; i < usersData.length; i += userBatchSize) {
      const batch = usersData.slice(i, i + userBatchSize);
      
      const userValues = batch.map(user => {
        const role = determineRole(user.cargo);
        const openId = generateOpenId(user.employeeCode || user.codigo || `user_${i}`);
        
        return [
          openId,
          user.name || user.nome,
          user.email,
          role,
          false // isSalaryLead
        ];
      }).filter(v => v[2]); // Só incluir se tiver email
      
      if (userValues.length === 0) continue;
      
      try {
        await connection.query(
          `INSERT IGNORE INTO users (openId, name, email, role, isSalaryLead, createdAt, updatedAt, lastSignedIn)
           VALUES ?`,
          [userValues.map(v => [...v, new Date(), new Date(), new Date()])]
        );
        
        usersCreated += userValues.length;
        process.stdout.write(`   Criados: ${usersCreated}/${usersData.length}...\r`);
      } catch (error) {
        console.log(`\n   ⚠️  Erro no lote ${i}: ${error.message.substring(0, 80)}`);
      }
    }
    
    console.log(`\n   ✅ ${usersCreated} usuários criados!\n`);

    // Passo 3: Vincular usuários aos funcionários
    console.log('🔗 Vinculando usuários...\n');
    
    let linked = 0;
    
    for (const user of usersData.slice(0, 100)) { // Limitar para evitar timeout
      try {
        const [userRow] = await connection.query(
          'SELECT id FROM users WHERE email = ? LIMIT 1',
          [user.email]
        );
        
        if (userRow.length === 0) continue;
        
        const userId = userRow[0].id;
        const codigo = user.employeeCode || user.codigo;
        
        await connection.query(
          'UPDATE employees SET userId = ? WHERE codigo = ? LIMIT 1',
          [userId, codigo]
        );
        
        linked++;
        
        if (linked % 10 === 0) {
          process.stdout.write(`   Vinculados: ${linked}...\r`);
        }
      } catch (error) {
        // Ignorar erros
      }
    }
    
    console.log(`\n   ✅ ${linked} vínculos criados!\n`);

    // Estatísticas finais
    const [totalEmp] = await connection.query('SELECT COUNT(*) as total FROM employees');
    const [totalUsers] = await connection.query('SELECT COUNT(*) as total FROM users');
    const [activeEmp] = await connection.query('SELECT COUNT(*) as total FROM employees WHERE status = "ativo"');
    
    await connection.end();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('━'.repeat(60));
    console.log('\n🎉 IMPORTAÇÃO CONCLUÍDA!\n');
    console.log(`📊 Estatísticas:`);
    console.log(`   • Total de funcionários: ${totalEmp[0].total}`);
    console.log(`   • Funcionários ativos: ${activeEmp[0].total}`);
    console.log(`   • Total de usuários: ${totalUsers[0].total}`);
    console.log(`   • Vínculos criados: ${linked}`);
    console.log(`   • Tempo total: ${duration}s`);
    
    console.log('\n📝 Próximos passos:');
    console.log('   1. Verificar importação: node verify-import.mjs');
    console.log('   2. Seed inicial: node seed-data.mjs');
    console.log('   3. Iniciar sistema: pnpm dev');
    console.log('━'.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error('\n📋 Stack:', error.stack);
    process.exit(1);
  }
}

importFast();
