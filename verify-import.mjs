#!/usr/bin/env node
/**
 * Script de Verificação de Importação - AVD UISA v2.0.0
 * Verifica se os 3.114 funcionários foram importados corretamente
 */

import mysql from 'mysql2/promise';
import 'dotenv/config';

console.log('🔍 VERIFICAÇÃO DE IMPORTAÇÃO - AVD UISA v2.0.0\n');
console.log('━'.repeat(60));

async function verifyImport() {
  try {
    console.log('\n🔌 Conectando ao banco...');
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('✅ Conectado!\n');

    // 1. Estatísticas gerais
    console.log('📊 ESTATÍSTICAS GERAIS\n');
    
    const [totalEmp] = await connection.query('SELECT COUNT(*) as total FROM employees');
    const [activeEmp] = await connection.query('SELECT COUNT(*) as total FROM employees WHERE status = "ativo"');
    const [inactiveEmp] = await connection.query('SELECT COUNT(*) as total FROM employees WHERE status != "ativo"');
    const [withEmail] = await connection.query('SELECT COUNT(*) as total FROM employees WHERE email IS NOT NULL AND email != ""');
    const [withUserId] = await connection.query('SELECT COUNT(*) as total FROM employees WHERE userId IS NOT NULL');
    
    console.log(`   📈 Total de funcionários: ${totalEmp[0].total}`);
    console.log(`   ✅ Funcionários ativos: ${activeEmp[0].total} (${(activeEmp[0].total/totalEmp[0].total*100).toFixed(1)}%)`);
    console.log(`   ⏸️  Funcionários inativos: ${inactiveEmp[0].total}`);
    console.log(`   📧 Com email: ${withEmail[0].total} (${(withEmail[0].total/totalEmp[0].total*100).toFixed(1)}%)`);
    console.log(`   🔗 Vinculados a usuário: ${withUserId[0].total} (${(withUserId[0].total/totalEmp[0].total*100).toFixed(1)}%)`);

    // 2. Estatísticas de usuários
    console.log('\n👥 ESTATÍSTICAS DE USUÁRIOS\n');
    
    const [totalUsers] = await connection.query('SELECT COUNT(*) as total FROM users');
    const [adminUsers] = await connection.query('SELECT COUNT(*) as total FROM users WHERE role = "admin"');
    const [gestorUsers] = await connection.query('SELECT COUNT(*) as total FROM users WHERE role = "gestor"');
    const [collabUsers] = await connection.query('SELECT COUNT(*) as total FROM users WHERE role = "colaborador"');
    
    console.log(`   📊 Total de usuários: ${totalUsers[0].total}`);
    console.log(`   👔 Administradores: ${adminUsers[0].total} (${(adminUsers[0].total/totalUsers[0].total*100).toFixed(1)}%)`);
    console.log(`   👨‍💼 Gestores: ${gestorUsers[0].total} (${(gestorUsers[0].total/totalUsers[0].total*100).toFixed(1)}%)`);
    console.log(`   👨‍🔧 Colaboradores: ${collabUsers[0].total} (${(collabUsers[0].total/totalUsers[0].total*100).toFixed(1)}%)`);

    // 3. Top cargos
    console.log('\n🏢 TOP 10 CARGOS\n');
    
    const [topCargos] = await connection.query(`
      SELECT cargo, COUNT(*) as total 
      FROM employees 
      WHERE cargo IS NOT NULL 
      GROUP BY cargo 
      ORDER BY total DESC 
      LIMIT 10
    `);
    
    topCargos.forEach((row, i) => {
      console.log(`   ${i+1}. ${row.cargo}: ${row.total} funcionários`);
    });

    // 4. Exemplos de funcionários
    console.log('\n👤 EXEMPLOS DE FUNCIONÁRIOS\n');
    
    const [examples] = await connection.query(`
      SELECT 
        e.codigo, 
        e.nome, 
        e.email, 
        e.cargo, 
        e.status,
        CASE WHEN e.userId IS NOT NULL THEN 'Sim' ELSE 'Não' END as temUsuario,
        u.role as roleUsuario
      FROM employees e
      LEFT JOIN users u ON e.userId = u.id
      LIMIT 5
    `);
    
    examples.forEach((emp, i) => {
      console.log(`   ${i+1}. ${emp.nome}`);
      console.log(`      Código: ${emp.codigo} | Cargo: ${emp.cargo || 'N/A'}`);
      console.log(`      Email: ${emp.email || 'N/A'} | Status: ${emp.status}`);
      console.log(`      Tem usuário: ${emp.temUsuario}${emp.roleUsuario ? ` (${emp.roleUsuario})` : ''}`);
    });

    // 5. Verificações de integridade
    console.log('\n🔍 VERIFICAÇÕES DE INTEGRIDADE\n');
    
    const [dupCodigo] = await connection.query(`
      SELECT codigo, COUNT(*) as total 
      FROM employees 
      GROUP BY codigo 
      HAVING total > 1
    `);
    
    const [dupEmail] = await connection.query(`
      SELECT email, COUNT(*) as total 
      FROM users 
      WHERE email IS NOT NULL 
      GROUP BY email 
      HAVING total > 1
    `);
    
    const [orphanUsers] = await connection.query(`
      SELECT COUNT(*) as total 
      FROM users u 
      LEFT JOIN employees e ON u.id = e.userId 
      WHERE e.id IS NULL
    `);
    
    console.log(`   ${dupCodigo.length === 0 ? '✅' : '⚠️ '} Códigos duplicados: ${dupCodigo.length}`);
    console.log(`   ${dupEmail.length === 0 ? '✅' : '⚠️ '} Emails duplicados: ${dupEmail.length}`);
    
    if (dupEmail.length > 0 && dupEmail.length <= 5) {
      dupEmail.forEach(row => {
        console.log(`      • ${row.email}: ${row.total} ocorrências`);
      });
    }

    // 6. Tenant verification
    console.log('\n🏢 MULTI-TENANCY\n');
    
    const [tenants] = await connection.query('SELECT * FROM tenants ORDER BY id');
    
    tenants.forEach(tenant => {
      console.log(`   🏢 ${tenant.name} (ID: ${tenant.id}, Código: ${tenant.code})`);
      console.log(`      Max usuários: ${tenant.max_users} | Max funcionários: ${tenant.max_employees}`);
      console.log(`      Status: ${tenant.active ? 'Ativo' : 'Inativo'}`);
    });

    await connection.end();
    
    console.log('\n' + '━'.repeat(60));
    console.log('\n✅ VERIFICAÇÃO CONCLUÍDA!');
    console.log('\n📝 Resumo:');
    console.log(`   • ${totalEmp[0].total} funcionários importados`);
    console.log(`   • ${totalUsers[0].total} usuários criados`);
    console.log(`   • ${dupCodigo.length} códigos duplicados`);
    console.log(`   • ${dupEmail.length} emails duplicados`);
    console.log(`   • ${tenants.length} tenant(s) configurado(s)`);
    
    console.log('\n📊 Status:');
    if (totalEmp[0].total >= 3100 && dupCodigo.length === 0) {
      console.log('   🟢 EXCELENTE - Sistema pronto para uso!');
    } else if (totalEmp[0].total >= 3000) {
      console.log('   🟡 BOM - Sistema funcional com pequenos ajustes necessários');
    } else {
      console.log('   🔴 ATENÇÃO - Verificar importação');
    }
    
    console.log('\n📝 Próximos passos:');
    console.log('   1. node seed-data.mjs (popular dados iniciais)');
    console.log('   2. pnpm dev (iniciar sistema)');
    console.log('   3. Acessar http://localhost:3000');
    console.log('━'.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error('\n📋 Stack:', error.stack);
    process.exit(1);
  }
}

verifyImport();
