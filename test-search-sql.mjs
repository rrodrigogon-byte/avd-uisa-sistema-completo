import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const searchTerms = ["Fernando Pinto", "Caroline Mendes", "Rodrigo Ribeiro", "Andre Sbardelline"];

console.log("🔍 Testando busca de funcionários no banco...\n");

for (const searchTerm of searchTerms) {
  console.log(`\n📋 Buscando: "${searchTerm}"`);
  
  const searchPattern = `%${searchTerm.trim()}%`;
  
  const [results] = await connection.execute(
    `SELECT id, employeeCode, name, email, status 
     FROM employees 
     WHERE LOWER(name) LIKE LOWER(?) 
        OR LOWER(email) LIKE LOWER(?) 
        OR employeeCode LIKE ? 
        OR cpf LIKE ?
     LIMIT 5`,
    [searchPattern, searchPattern, searchPattern, searchPattern]
  );
  
  if (results.length > 0) {
    console.log(`✅ Encontrados ${results.length} resultado(s):`);
    results.forEach(emp => {
      console.log(`   - ID: ${emp.id} | Código: ${emp.employeeCode} | Nome: ${emp.name} | Email: ${emp.email || 'N/A'} | Status: ${emp.status}`);
    });
  } else {
    console.log(`❌ Nenhum resultado encontrado`);
  }
}

await connection.end();
process.exit(0);
