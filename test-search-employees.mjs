import { drizzle } from "drizzle-orm/mysql2";
import { eq, and, or, sql } from "drizzle-orm";
import { employees } from "./drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

// Testar busca de funcionários específicos
const searchTerms = ["Fernando Pinto", "Caroline Mendes", "Rodrigo Ribeiro", "Andre Sbardelline"];

console.log("🔍 Testando busca de funcionários...\n");

for (const searchTerm of searchTerms) {
  console.log(`\n📋 Buscando: "${searchTerm}"`);
  
  const searchPattern = `%${searchTerm.trim()}%`;
  
  const results = await db
    .select()
    .from(employees)
    .where(
      or(
        sql`LOWER(${employees.name}) LIKE LOWER(${searchPattern})`,
        sql`LOWER(${employees.email}) LIKE LOWER(${searchPattern})`,
        sql`${employees.employeeCode} LIKE ${searchPattern}`,
        sql`${employees.cpf} LIKE ${searchPattern}`
      )
    )
    .limit(5);
  
  if (results.length > 0) {
    console.log(`✅ Encontrados ${results.length} resultado(s):`);
    results.forEach(emp => {
      console.log(`   - ID: ${emp.id} | Nome: ${emp.name} | Email: ${emp.email || 'N/A'} | Status: ${emp.status}`);
    });
  } else {
    console.log(`❌ Nenhum resultado encontrado`);
  }
}

process.exit(0);
