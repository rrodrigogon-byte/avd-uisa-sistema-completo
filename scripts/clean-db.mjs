import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

async function cleanDatabase() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    console.log('🗑️  Limpando banco de dados...');
    
    // Desabilitar verificação de foreign keys
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Buscar todas as tabelas
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    console.log(`📋 Encontradas ${tableNames.length} tabelas`);
    
    // Dropar todas as tabelas
    for (const tableName of tableNames) {
      console.log(`  ❌ Removendo tabela: ${tableName}`);
      await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
    }
    
    // Reabilitar verificação de foreign keys
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('✅ Banco de dados limpo com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao limpar banco de dados:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

cleanDatabase();
