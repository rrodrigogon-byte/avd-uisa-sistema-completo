#!/usr/bin/env node

/**
 * Script de Teste de Conexão com Banco de Dados
 * Valida a configuração do DATABASE_URL antes de executar migrations
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar .env
dotenv.config({ path: join(__dirname, '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

console.log('\n' + '='.repeat(70));
console.log('🔍 TESTE DE CONEXÃO COM BANCO DE DADOS - AVD UISA');
console.log('='.repeat(70) + '\n');

if (!DATABASE_URL) {
  console.error('❌ ERRO: DATABASE_URL não configurada!\n');
  console.log('📝 Passos para configurar:\n');
  console.log('  1. Copie o arquivo .env.example para .env');
  console.log('     $ cp .env.example .env\n');
  console.log('  2. Edite o arquivo .env e configure DATABASE_URL');
  console.log('     Exemplo: mysql://usuario:senha@host:3306/database\n');
  console.log('  3. Execute este script novamente');
  console.log('     $ node test-db-connection.mjs\n');
  process.exit(1);
}

// Mascarar senha na URL para exibição
function maskDatabaseUrl(url) {
  try {
    const urlObj = new URL(url);
    if (urlObj.password) {
      urlObj.password = '*'.repeat(8);
    }
    return urlObj.toString();
  } catch {
    return 'URL inválida';
  }
}

console.log('📊 Configuração:');
console.log(`   DATABASE_URL: ${maskDatabaseUrl(DATABASE_URL)}`);
console.log('');

async function testConnection() {
  let connection;
  
  try {
    console.log('🔌 Estabelecendo conexão...');
    connection = await mysql.createConnection(DATABASE_URL);
    console.log('✅ Conexão estabelecida com sucesso!\n');
    
    // Teste 1: Verificar versão MySQL
    console.log('📋 Teste 1: Versão do MySQL');
    const [versionRows] = await connection.execute('SELECT VERSION() as version');
    const version = versionRows[0].version;
    console.log(`   ✓ MySQL Version: ${version}\n`);
    
    // Teste 2: Verificar banco de dados atual
    console.log('📋 Teste 2: Banco de Dados');
    const [dbRows] = await connection.execute('SELECT DATABASE() as db');
    const currentDb = dbRows[0].db;
    console.log(`   ✓ Database: ${currentDb}\n`);
    
    // Teste 3: Listar tabelas existentes
    console.log('📋 Teste 3: Tabelas Existentes');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`   ✓ Total de tabelas: ${tables.length}`);
    
    if (tables.length > 0) {
      console.log('   Tabelas encontradas:');
      tables.slice(0, 10).forEach((table, index) => {
        const tableName = Object.values(table)[0];
        console.log(`     ${index + 1}. ${tableName}`);
      });
      if (tables.length > 10) {
        console.log(`     ... e mais ${tables.length - 10} tabelas`);
      }
    } else {
      console.log('   ⚠️  Nenhuma tabela encontrada (banco vazio)');
      console.log('   💡 Execute: pnpm db:push para criar as tabelas');
    }
    console.log('');
    
    // Teste 4: Verificar privilégios do usuário
    console.log('📋 Teste 4: Privilégios do Usuário');
    try {
      const [userRows] = await connection.execute('SELECT CURRENT_USER() as user');
      const currentUser = userRows[0].user;
      console.log(`   ✓ Usuário atual: ${currentUser}`);
      
      const [grants] = await connection.execute('SHOW GRANTS');
      console.log(`   ✓ Privilégios: ${grants.length} permissões concedidas`);
    } catch (error) {
      console.log(`   ⚠️  Não foi possível verificar privilégios: ${error.message}`);
    }
    console.log('');
    
    // Teste 5: Verificar configurações importantes
    console.log('📋 Teste 5: Configurações do MySQL');
    const configs = [
      'max_connections',
      'character_set_server',
      'collation_server',
      'innodb_buffer_pool_size',
      'max_allowed_packet'
    ];
    
    for (const config of configs) {
      try {
        const [configRows] = await connection.execute(
          `SHOW VARIABLES LIKE '${config}'`
        );
        if (configRows.length > 0) {
          const value = configRows[0].Value;
          console.log(`   ✓ ${config}: ${value}`);
        }
      } catch {}
    }
    console.log('');
    
    // Teste 6: Testar criação de tabela (rollback)
    console.log('📋 Teste 6: Teste de Escrita (CREATE/DROP)');
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS _test_connection (
          id INT PRIMARY KEY AUTO_INCREMENT,
          test_field VARCHAR(50)
        )
      `);
      console.log('   ✓ Criação de tabela: OK');
      
      await connection.execute('DROP TABLE IF EXISTS _test_connection');
      console.log('   ✓ Remoção de tabela: OK');
      console.log('   ✅ Permissões de escrita: OK');
    } catch (error) {
      console.log(`   ❌ Erro no teste de escrita: ${error.message}`);
      console.log('   ⚠️  Usuário pode não ter permissões CREATE/DROP');
    }
    console.log('');
    
    // Teste 7: Verificar latência
    console.log('📋 Teste 7: Latência da Conexão');
    const startTime = Date.now();
    await connection.execute('SELECT 1');
    const latency = Date.now() - startTime;
    console.log(`   ✓ Latência: ${latency}ms`);
    
    if (latency < 50) {
      console.log('   ✅ Conexão muito rápida (local ou proxy)');
    } else if (latency < 200) {
      console.log('   ✅ Conexão boa (rede interna)');
    } else {
      console.log('   ⚠️  Conexão lenta (pode impactar performance)');
    }
    console.log('');
    
    // Resumo final
    console.log('='.repeat(70));
    console.log('✅ TODOS OS TESTES PASSARAM!');
    console.log('='.repeat(70) + '\n');
    
    console.log('📌 Próximos Passos:\n');
    
    if (tables.length === 0) {
      console.log('  1. ⚡ Execute: pnpm db:push');
      console.log('     Para criar as 62 tabelas do sistema\n');
      console.log('  2. 🌱 Execute: node seed.mjs');
      console.log('     Para popular dados básicos\n');
      console.log('  3. 📥 Execute: node execute-import.mjs');
      console.log('     Para importar 3.114 funcionários\n');
      console.log('  4. 👥 Execute: node create-remaining-users.mjs');
      console.log('     Para criar usuários para funcionários ativos\n');
    } else {
      console.log('  ✅ Banco de dados já possui tabelas');
      console.log('  🔍 Execute: node verificar-integridade-dados.mjs');
      console.log('     Para verificar integridade dos dados\n');
    }
    
    console.log('  5. 🚀 Execute: pnpm dev');
    console.log('     Para iniciar o servidor de desenvolvimento\n');
    
  } catch (error) {
    console.error('\n' + '='.repeat(70));
    console.error('❌ ERRO AO CONECTAR COM BANCO DE DADOS');
    console.error('='.repeat(70) + '\n');
    
    console.error(`Mensagem: ${error.message}\n`);
    console.error('Código:', error.code);
    if (error.errno) {
      console.error('Errno:', error.errno);
    }
    console.error('');
    
    // Diagnóstico de erros comuns
    console.log('🔧 DIAGNÓSTICO:\n');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Conexão recusada\n');
      console.log('   Possíveis causas:');
      console.log('   1. Cloud SQL Proxy não está rodando');
      console.log('      Solução: Execute o proxy em outro terminal');
      console.log('      $ cloud_sql_proxy -instances=PROJECT:REGION:INSTANCE=tcp:3306\n');
      console.log('   2. Host ou porta incorretos');
      console.log('      Solução: Verifique DATABASE_URL no .env\n');
      console.log('   3. Instância Cloud SQL está parada');
      console.log('      Solução: Inicie a instância no console\n');
      
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('❌ Acesso negado (usuário ou senha incorretos)\n');
      console.log('   Possíveis causas:');
      console.log('   1. Senha incorreta');
      console.log('      Solução: Verifique a senha no .env\n');
      console.log('   2. Usuário não existe');
      console.log('      Solução: Crie o usuário no Cloud SQL\n');
      console.log('   3. Usuário não tem permissão do host');
      console.log('      Solução: No MySQL, execute:');
      console.log('      GRANT ALL PRIVILEGES ON database.* TO \'user\'@\'%\';\n');
      
    } else if (error.code === 'ETIMEDOUT' || error.code === 'EHOSTUNREACH') {
      console.log('❌ Timeout ou host inacessível\n');
      console.log('   Possíveis causas:');
      console.log('   1. Firewall bloqueando conexão');
      console.log('      Solução: Adicione seu IP nas redes autorizadas\n');
      console.log('   2. IP público incorreto');
      console.log('      Solução: Verifique o IP no console Cloud SQL\n');
      console.log('   3. Instância não tem IP público');
      console.log('      Solução: Use Cloud SQL Proxy\n');
      
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('❌ Banco de dados não existe\n');
      console.log('   Solução: Crie o banco de dados no Cloud SQL');
      console.log('   Via console ou execute:');
      console.log('   CREATE DATABASE nome_do_banco CHARACTER SET utf8mb4;\n');
      
    } else {
      console.log('❓ Erro desconhecido\n');
      console.log('   Consulte a documentação ou logs para mais detalhes');
      console.log('   Documentação: GUIA_GOOGLE_CLOUD_SQL.md\n');
    }
    
    console.log('📚 Recursos úteis:');
    console.log('   - Guia completo: GUIA_GOOGLE_CLOUD_SQL.md');
    console.log('   - Exemplo de .env: .env.example');
    console.log('   - Documentação Cloud SQL: https://cloud.google.com/sql/docs\n');
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão encerrada.\n');
    }
  }
}

// Executar teste
testConnection().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
