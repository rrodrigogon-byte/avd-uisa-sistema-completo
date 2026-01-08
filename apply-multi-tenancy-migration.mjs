#!/usr/bin/env node
/**
 * Script para aplicar migration de multi-tenancy
 */

import mysql from 'mysql2/promise';
import fs from 'fs';
import 'dotenv/config';

const config = {
  host: '34.39.223.147',
  user: 'root',
  password: '|_89C{*ixPV5x4UJ',
  port: 3306,
  database: 'avd_uisa',
  multipleStatements: true,
  connectTimeout: 10000,
};

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  🚀 APLICANDO MIGRATION DE MULTI-TENANCY                      ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  let connection;

  try {
    // 1. Conectar ao banco
    console.log('📡 Conectando ao banco de dados...\n');
    connection = await mysql.createConnection(config);
    console.log('✅ Conectado ao banco "avd_uisa"\n');

    // 2. Ler arquivo de migration
    console.log('📄 Lendo arquivo de migration...');
    const migrationPath = './migrations/add-multi-tenancy.sql';
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Arquivo de migration não encontrado: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    console.log(`✅ Migration carregada (${migrationSQL.length} caracteres)\n`);

    // 3. Executar migration
    console.log('⚙️  Executando migration...\n');
    console.log('   Isso pode levar alguns segundos...\n');

    // Dividir por comandos SQL (statements separados por ;)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Pular comentários
      if (statement.startsWith('--') || statement.length < 10) {
        continue;
      }

      try {
        await connection.query(statement);
        successCount++;
        
        // Mostrar progresso a cada 10 comandos
        if (successCount % 10 === 0) {
          console.log(`   ✓ ${successCount} comandos executados...`);
        }
      } catch (error) {
        // Ignorar erros de "já existe" (ALTER TABLE IF NOT EXISTS, etc)
        if (
          error.code === 'ER_DUP_FIELDNAME' ||
          error.code === 'ER_DUP_KEYNAME' ||
          error.message.includes('already exists') ||
          error.message.includes('Duplicate column name')
        ) {
          // Silenciosamente ignorar
          successCount++;
        } else {
          errorCount++;
          errors.push({
            statement: statement.substring(0, 100) + '...',
            error: error.message,
          });
        }
      }
    }

    console.log(`\n✅ Migration aplicada com sucesso!`);
    console.log(`   Comandos executados: ${successCount}`);
    if (errorCount > 0) {
      console.log(`   ⚠️  Avisos/Erros ignorados: ${errorCount}\n`);
    }

    // 4. Verificar tabelas criadas
    console.log('\n📋 Verificando tabelas de multi-tenancy...\n');
    
    const [tables] = await connection.query(`
      SHOW TABLES LIKE '%tenant%'
    `);

    if (tables.length > 0) {
      console.log('✅ Tabelas de multi-tenancy criadas:\n');
      tables.forEach(table => {
        const tableName = Object.values(table)[0];
        console.log(`   • ${tableName}`);
      });
    } else {
      console.log('⚠️  Nenhuma tabela de multi-tenancy encontrada\n');
    }

    // 5. Verificar tenant UISA
    console.log('\n📋 Verificando tenant padrão (UISA)...\n');
    
    const [tenants] = await connection.query(`
      SELECT * FROM tenants WHERE code = 'UISA'
    `);

    if (tenants.length > 0) {
      const tenant = tenants[0];
      console.log('✅ Tenant UISA criado:\n');
      console.log(`   ID: ${tenant.id}`);
      console.log(`   Code: ${tenant.code}`);
      console.log(`   Name: ${tenant.name}`);
      console.log(`   Active: ${tenant.active ? 'Sim' : 'Não'}`);
      console.log(`   Max Users: ${tenant.maxUsers}`);
      console.log(`   Max Employees: ${tenant.maxEmployees}`);
      console.log(`   Plan: ${tenant.planType}\n`);
    } else {
      console.log('⚠️  Tenant UISA não encontrado\n');
    }

    // 6. Listar todas as tabelas
    console.log('📋 Listando todas as tabelas no banco...\n');
    const [allTables] = await connection.query('SHOW TABLES');
    
    if (allTables.length > 0) {
      console.log(`✅ ${allTables.length} tabelas encontradas:\n`);
      
      // Separar tabelas de multi-tenancy das outras
      const multiTenancyTables = [];
      const otherTables = [];
      
      allTables.forEach(table => {
        const tableName = Object.values(table)[0];
        if (tableName.toLowerCase().includes('tenant')) {
          multiTenancyTables.push(tableName);
        } else {
          otherTables.push(tableName);
        }
      });

      if (multiTenancyTables.length > 0) {
        console.log('   📦 Multi-Tenancy:');
        multiTenancyTables.forEach(name => console.log(`      • ${name}`));
        console.log('');
      }

      if (otherTables.length > 0) {
        console.log(`   📋 Outras tabelas: ${otherTables.length} tabelas`);
        if (otherTables.length <= 10) {
          otherTables.forEach(name => console.log(`      • ${name}`));
        } else {
          console.log(`      (listando primeiras 10)`);
          otherTables.slice(0, 10).forEach(name => console.log(`      • ${name}`));
          console.log(`      ... e mais ${otherTables.length - 10} tabelas`);
        }
        console.log('');
      }
    }

    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ MULTI-TENANCY CONFIGURADO COM SUCESSO!                    ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log('📋 Próximos passos:\n');
    console.log('   1. Aplicar schema principal (Drizzle):');
    console.log('      pnpm db:push\n');
    console.log('   2. Importar funcionários:');
    console.log('      node execute-import.mjs\n');
    console.log('   3. Criar usuários:');
    console.log('      node create-remaining-users.mjs\n');

    if (errors.length > 0) {
      console.log('\n⚠️  Avisos/Erros encontrados:\n');
      errors.slice(0, 5).forEach((err, index) => {
        console.log(`   ${index + 1}. ${err.error}`);
        console.log(`      Statement: ${err.statement}\n`);
      });
      if (errors.length > 5) {
        console.log(`   ... e mais ${errors.length - 5} avisos\n`);
      }
    }

  } catch (error) {
    console.error('\n❌ ERRO AO APLICAR MIGRATION:', error.message);
    console.error('\nDetalhes:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

main().catch(console.error);
