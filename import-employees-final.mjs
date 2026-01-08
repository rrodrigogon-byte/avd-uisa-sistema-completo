#!/usr/bin/env node
/**
 * Script de Importação de Funcionários - AVD UISA v2.0.0
 * Importa 3.114 funcionários validados para o banco de dados
 */

import fs from 'fs';
import mysql from 'mysql2/promise';
import crypto from 'crypto';
import 'dotenv/config';

console.log('📊 IMPORTAÇÃO DE FUNCIONÁRIOS - AVD UISA v2.0.0\n');
console.log('━'.repeat(60));

// Cargos de liderança que ganham acesso ao sistema
const LEADERSHIP_ROLES = [
  'Lider', 'Supervisor', 'Coordenador', 'Gerente',
  'Gerente Exec', 'Diretor', 'Diretor Agroindustrial',
  'CEO', 'Presidente', 'Especialista'
];

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
 * Gera hash de senha
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Gera openId único
 */
function generateOpenId(codigo, email) {
  return `emp_${codigo}_${Date.now()}`;
}

async function importEmployees() {
  const startTime = Date.now();
  
  try {
    // Conectar ao banco
    console.log('\n🔌 Conectando ao banco de dados...');
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('✅ Conexão estabelecida!\n');

    // Ler dados de importação
    console.log('📖 Lendo arquivo import-data.json...');
    const rawData = fs.readFileSync('./import-data.json', 'utf-8');
    const data = JSON.parse(rawData);
    
    console.log(`✅ Arquivo carregado:`);
    console.log(`   • Funcionários: ${data.employees?.length || 0}`);
    console.log(`   • Usuários líderes: ${data.users?.length || 0}\n`);

    const employees = data.employees || [];
    const tenant_id = 1; // UISA

    // Passo 1: Criar usuários de liderança
    console.log('👥 PASSO 1: Criando usuários de liderança\n');
    
    let usersCreated = 0;
    let usersSkipped = 0;
    
    for (const user of (data.users || [])) {
      try {
        // Verificar se usuário já existe
        const [existing] = await connection.query(
          'SELECT id FROM users WHERE email = ? LIMIT 1',
          [user.email]
        );
        
        if (existing.length > 0) {
          usersSkipped++;
          continue;
        }
        
        // Criar usuário
        const openId = generateOpenId(user.codigo, user.email);
        await connection.query(
          `INSERT INTO users (openId, name, email, role, isSalaryLead, createdAt, updatedAt, lastSignedIn)
           VALUES (?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
          [openId, user.nome, user.email, user.role, false]
        );
        
        usersCreated++;
        
        if (usersCreated % 50 === 0) {
          process.stdout.write(`   Criados: ${usersCreated}...\r`);
        }
      } catch (error) {
        console.log(`   ⚠️  Erro ao criar usuário ${user.email}: ${error.message.substring(0, 60)}`);
      }
    }
    
    console.log(`   ✅ Usuários criados: ${usersCreated}`);
    console.log(`   ⏭️  Usuários já existentes: ${usersSkipped}\n`);

    // Passo 2: Importar funcionários
    console.log('👨‍💼 PASSO 2: Importando funcionários\n');
    
    let imported = 0;
    let updated = 0;
    let errors = 0;
    const batchSize = 100;
    
    for (let i = 0; i < employees.length; i += batchSize) {
      const batch = employees.slice(i, i + batchSize);
      
      for (const emp of batch) {
        try {
          // Verificar se funcionário já existe
          const [existing] = await connection.query(
            'SELECT id FROM employees WHERE codigo = ? LIMIT 1',
            [emp.employeeCode || emp.codigo]
          );
          
          const codigo = emp.employeeCode || emp.codigo;
          const nome = emp.name || emp.nome;
          const email = emp.email || emp.corporateEmail || emp.personalEmail;
          const cargo = emp.cargo || emp.funcao;
          const status = emp.status || (emp.active ? 'ativo' : 'inativo');
          
          if (existing.length > 0) {
            // Atualizar
            await connection.query(
              `UPDATE employees 
               SET nome = ?, email = ?, cargo = ?, status = ?, updatedAt = NOW()
               WHERE codigo = ?`,
              [nome, email, cargo, status, codigo]
            );
            updated++;
          } else {
            // Inserir
            await connection.query(
              `INSERT INTO employees (codigo, nome, email, cargo, status, createdAt, updatedAt)
               VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
              [codigo, nome, email, cargo, status]
            );
            imported++;
          }
        } catch (error) {
          errors++;
          if (errors <= 5) {
            console.log(`   ⚠️  Erro no funcionário ${emp.employeeCode || emp.codigo}: ${error.message.substring(0, 60)}`);
          }
        }
      }
      
      process.stdout.write(`   Processados: ${Math.min(i + batchSize, employees.length)}/${employees.length} (${Math.round((i + batchSize) / employees.length * 100)}%)...\r`);
    }
    
    console.log(`\n   ✅ Funcionários importados: ${imported}`);
    console.log(`   🔄 Funcionários atualizados: ${updated}`);
    if (errors > 0) {
      console.log(`   ⚠️  Erros: ${errors}`);
    }

    // Passo 3: Vincular usuários aos funcionários
    console.log('\n🔗 PASSO 3: Vinculando usuários aos funcionários\n');
    
    let linked = 0;
    
    for (const user of (data.users || [])) {
      try {
        const [userRow] = await connection.query(
          'SELECT id FROM users WHERE email = ? LIMIT 1',
          [user.email]
        );
        
        if (userRow.length === 0) continue;
        
        const userId = userRow[0].id;
        const codigo = user.codigo || user.employeeCode;
        
        await connection.query(
          'UPDATE employees SET userId = ? WHERE codigo = ?',
          [userId, codigo]
        );
        
        linked++;
      } catch (error) {
        // Ignorar erros de vínculo
      }
    }
    
    console.log(`   ✅ Vínculos criados: ${linked}\n`);

    // Passo 4: Estatísticas finais
    console.log('📊 PASSO 4: Estatísticas finais\n');
    
    const [totalEmp] = await connection.query('SELECT COUNT(*) as total FROM employees');
    const [totalUsers] = await connection.query('SELECT COUNT(*) as total FROM users');
    const [activeEmp] = await connection.query('SELECT COUNT(*) as total FROM employees WHERE status = "ativo"');
    const [linkedEmp] = await connection.query('SELECT COUNT(*) as total FROM employees WHERE userId IS NOT NULL');
    
    console.log(`   📈 Total de funcionários: ${totalEmp[0].total}`);
    console.log(`   ✅ Funcionários ativos: ${activeEmp[0].total}`);
    console.log(`   👥 Total de usuários: ${totalUsers[0].total}`);
    console.log(`   🔗 Funcionários vinculados: ${linkedEmp[0].total}`);

    await connection.end();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('\n' + '━'.repeat(60));
    console.log('\n🎉 IMPORTAÇÃO CONCLUÍDA COM SUCESSO!\n');
    console.log(`⏱️  Tempo total: ${duration}s`);
    console.log(`📊 Resumo:`);
    console.log(`   • ${imported} funcionários importados`);
    console.log(`   • ${updated} funcionários atualizados`);
    console.log(`   • ${usersCreated} usuários criados`);
    console.log(`   • ${linked} vínculos criados`);
    
    if (errors > 0) {
      console.log(`   • ${errors} erros (verificar logs acima)`);
    }
    
    console.log('\n📝 Próximos passos:');
    console.log('   1. node create-remaining-users.mjs (criar usuários restantes)');
    console.log('   2. node seed-data.mjs (popular dados iniciais)');
    console.log('   3. pnpm dev (iniciar sistema)');
    console.log('━'.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ ERRO na importação:', error.message);
    console.error('\n📋 Stack:', error.stack);
    process.exit(1);
  }
}

importEmployees();
