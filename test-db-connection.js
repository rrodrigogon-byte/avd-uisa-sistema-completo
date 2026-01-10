import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function testConnection() {
  console.log("=== TESTE DE CONEXÃO COM BANCO DE DADOS ===\n");
  
  const DATABASE_URL = process.env.DATABASE_URL;
  console.log("DATABASE_URL:", DATABASE_URL ? "Configurado ✓" : "NÃO CONFIGURADO ✗");
  
  if (!DATABASE_URL) {
    console.error("ERROR: DATABASE_URL não está configurado no .env");
    process.exit(1);
  }
  
  try {
    // Extrair informações do DATABASE_URL
    const match = DATABASE_URL.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):([^/]+)\/(.+)/);
    if (!match) {
      console.error("ERROR: Formato inválido de DATABASE_URL");
      process.exit(1);
    }
    
    const [, user, password, host, port, database] = match;
    
    console.log("\nConexão:");
    console.log(`  Host: ${host}`);
    console.log(`  Port: ${port}`);
    console.log(`  Database: ${database}`);
    console.log(`  User: ${user}`);
    console.log(`  Password: ${"*".repeat(password.length)}`);
    
    // Teste 1: Conexão básica com mysql2
    console.log("\n1. Testando conexão básica com mysql2...");
    const connection = await mysql.createConnection({
      host,
      port: parseInt(port),
      user,
      password,
      database,
    });
    
    console.log("   ✓ Conexão estabelecida");
    
    // Teste 2: Query simples
    console.log("\n2. Executando query de teste...");
    const [result] = await connection.query("SELECT 1 as test");
    console.log("   ✓ Query executada com sucesso:", result);
    
    // Teste 3: Contar tabelas
    console.log("\n3. Contando tabelas no banco...");
    const [tables] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = ?
    `, [database]);
    console.log(`   ✓ Tabelas encontradas: ${tables[0].count}`);
    
    // Teste 4: Contar funcionários
    console.log("\n4. Contando funcionários...");
    try {
      const [employees] = await connection.query("SELECT COUNT(*) as count FROM employees");
      console.log(`   ✓ Funcionários: ${employees[0].count}`);
    } catch (error) {
      console.log(`   ✗ Erro ao contar funcionários: ${error.message}`);
    }
    
    // Teste 5: Contar usuários
    console.log("\n5. Contando usuários...");
    try {
      const [users] = await connection.query("SELECT COUNT(*) as count FROM users");
      console.log(`   ✓ Usuários: ${users[0].count}`);
    } catch (error) {
      console.log(`   ✗ Erro ao contar usuários: ${error.message}`);
    }
    
    // Teste 6: Drizzle ORM
    console.log("\n6. Testando Drizzle ORM...");
    const db = drizzle(DATABASE_URL);
    console.log("   ✓ Drizzle ORM inicializado");
    
    await connection.end();
    
    console.log("\n=== TODOS OS TESTES PASSARAM ✓ ===");
    console.log("\nBanco de dados está funcionando corretamente!");
    
  } catch (error) {
    console.error("\n=== ERRO NO TESTE ✗ ===");
    console.error("Tipo:", error.code || error.constructor.name);
    console.error("Mensagem:", error.message);
    console.error("\nDetalhes completos:", error);
    process.exit(1);
  }
}

testConnection();
