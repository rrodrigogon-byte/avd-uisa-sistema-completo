import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Buscar variações
const variations = [
  { name: "Caroline", desc: "Buscando apenas 'Caroline'" },
  { name: "Mendes", desc: "Buscando apenas 'Mendes'" },
  { name: "Andre", desc: "Buscando apenas 'Andre'" },
  { name: "André", desc: "Buscando 'André' com acento" },
  { name: "Sbardelline", desc: "Buscando apenas 'Sbardelline'" },
  { name: "Sbardellini", desc: "Buscando 'Sbardellini' (variação)" },
  { name: "Lucas", desc: "Buscando 'Lucas'" },
  { name: "Passos", desc: "Buscando 'Passos'" },
  { name: "Bernardo", desc: "Buscando 'Bernardo'" },
  { name: "Fabio", desc: "Buscando 'Fabio'" },
  { name: "Fábio", desc: "Buscando 'Fábio' com acento" },
  { name: "Leite", desc: "Buscando 'Leite'" },
  { name: "Alexsandra", desc: "Buscando 'Alexsandra'" },
  { name: "Alexandra", desc: "Buscando 'Alexandra' (variação)" },
];

console.log("🔍 Testando variações de nomes...\n");

for (const { name, desc } of variations) {
  const searchPattern = `%${name}%`;
  
  const [results] = await connection.execute(
    `SELECT id, employeeCode, name, email, status 
     FROM employees 
     WHERE LOWER(name) LIKE LOWER(?) 
     LIMIT 3`,
    [searchPattern]
  );
  
  if (results.length > 0) {
    console.log(`\n✅ ${desc} - Encontrados ${results.length} resultado(s):`);
    results.forEach(emp => {
      console.log(`   - ${emp.name} (${emp.employeeCode})`);
    });
  }
}

await connection.end();
process.exit(0);
