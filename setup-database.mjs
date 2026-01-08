#!/usr/bin/env node
/**
 * Script para criar banco de dados avd_uisa e testar conexão
 */

import mysql from 'mysql2/promise';
import 'dotenv/config';

const config = {
  host: '34.39.223.147',
  user: 'root',
  password: '|_89C{*ixPV5x4UJ',
  port: 3306,
  connectTimeout: 10000,
};

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  🔧 CRIAÇÃO E VERIFICAÇÃO DO BANCO DE DADOS            ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  let connection;

  try {
    // 1. Conectar sem especificar database
    console.log('📡 Conectando ao servidor MySQL...');
    console.log(`   Host: ${config.host}:${config.port}`);
    console.log(`   User: ${config.user}\n`);

    connection = await mysql.createConnection(config);
    console.log('✅ Conexão estabelecida com sucesso!\n');

    // 2. Listar bancos de dados existentes
    console.log('📋 Listando bancos de dados existentes...');
    const [databases] = await connection.query('SHOW DATABASES');
    
    console.log('\nBancos encontrados:');
    databases.forEach(db => {
      console.log(`   • ${db.Database}`);
    });

    // 3. Verificar se avd_uisa existe
    const avdUisaExists = databases.some(db => db.Database === 'avd_uisa');
    
    if (avdUisaExists) {
      console.log('\n✅ Banco de dados "avd_uisa" já existe!\n');
    } else {
      console.log('\n⚠️  Banco de dados "avd_uisa" não encontrado.');
      console.log('🔨 Criando banco de dados "avd_uisa"...\n');
      
      await connection.query(`
        CREATE DATABASE IF NOT EXISTS avd_uisa
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci;
      `);
      
      console.log('✅ Banco de dados "avd_uisa" criado com sucesso!\n');
    }

    // 4. Conectar ao banco avd_uisa
    await connection.changeUser({ database: 'avd_uisa' });
    console.log('✅ Conectado ao banco "avd_uisa"\n');

    // 5. Listar tabelas existentes
    console.log('📋 Listando tabelas no banco "avd_uisa"...');
    const [tables] = await connection.query('SHOW TABLES');
    
    if (tables.length === 0) {
      console.log('   ⚠️  Nenhuma tabela encontrada (banco vazio)\n');
      console.log('📝 Próximo passo: Aplicar migrations\n');
    } else {
      console.log(`\n✅ ${tables.length} tabelas encontradas:\n`);
      tables.forEach((table, index) => {
        const tableName = Object.values(table)[0];
        console.log(`   ${(index + 1).toString().padStart(2, '0')}. ${tableName}`);
      });
      console.log('');
    }

    // 6. Verificar versão do MySQL
    const [version] = await connection.query('SELECT VERSION() as version');
    console.log('ℹ️  Versão do MySQL:', version[0].version, '\n');

    // 7. Verificar configurações de charset
    const [charset] = await connection.query(`
      SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME
      FROM information_schema.SCHEMATA
      WHERE SCHEMA_NAME = 'avd_uisa'
    `);
    
    if (charset.length > 0) {
      console.log('ℹ️  Configurações do banco:');
      console.log(`   Charset: ${charset[0].DEFAULT_CHARACTER_SET_NAME}`);
      console.log(`   Collation: ${charset[0].DEFAULT_COLLATION_NAME}\n`);
    }

    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  ✅ BANCO DE DADOS PRONTO PARA USO!                   ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log('📋 Próximos passos:');
    console.log('   1. Aplicar migrations de multi-tenancy:');
    console.log('      node apply-multi-tenancy-migration.mjs\n');
    console.log('   2. Aplicar migrations do schema principal:');
    console.log('      pnpm db:push\n');
    console.log('   3. Importar dados:');
    console.log('      node execute-import.mjs\n');

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    
    if (error.code === 'ETIMEDOUT') {
      console.error('\n🔥 Firewall ainda está bloqueando a conexão!');
      console.error('\nSolução:');
      console.error('1. Acesse: https://console.cloud.google.com/sql/instances');
      console.error('2. Selecione sua instância');
      console.error('3. Vá em "Connections" → "Networking"');
      console.error('4. Em "Authorized networks", adicione: 0.0.0.0/0');
      console.error('5. Aguarde 1-2 minutos e tente novamente\n');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n🔒 Senha incorreta ou usuário sem permissão!\n');
    } else {
      console.error('\nDetalhes:', error);
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

main().catch(console.error);
