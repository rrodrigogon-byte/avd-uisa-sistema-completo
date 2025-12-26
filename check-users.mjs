import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const employeeIds = [
  { id: 134, name: "RODRIGO RIBEIRO GONCALVES", code: "892106" },
  { id: null, name: "ANDRE ROGERIO SBARDELLINI CARDOSO", code: "8004668" },
  { id: null, name: "LUCAS DOS PASSOS SILVA", code: "892343" },
  { id: null, name: "FABIO DE SOUZA LEITE", code: "8004425" },
  { id: null, name: "ALEXSANDRA TAVARES SOBRAL DE OLIVEIRA", code: "869309" },
];

console.log("🔍 Verificando usuários vinculados aos funcionários...\n");

// Buscar IDs dos funcionários
for (const emp of employeeIds) {
  if (!emp.id) {
    const [results] = await connection.execute(
      `SELECT id FROM employees WHERE employeeCode = ? LIMIT 1`,
      [emp.code]
    );
    if (results.length > 0) {
      emp.id = results[0].id;
    }
  }
}

// Verificar usuários
for (const emp of employeeIds) {
  if (!emp.id) {
    console.log(`❌ ${emp.name} - Funcionário não encontrado no banco`);
    continue;
  }
  
  const [results] = await connection.execute(
    `SELECT e.id, e.name, e.email, e.userId, u.id as user_id, u.email as user_email, u.role
     FROM employees e
     LEFT JOIN users u ON e.userId = u.id
     WHERE e.id = ?`,
    [emp.id]
  );
  
  if (results.length > 0) {
    const row = results[0];
    if (row.userId) {
      console.log(`✅ ${row.name}`);
      console.log(`   - Funcionário ID: ${row.id}`);
      console.log(`   - Usuário ID: ${row.user_id}`);
      console.log(`   - Email: ${row.user_email || row.email}`);
      console.log(`   - Role: ${row.role || 'user'}`);
    } else {
      console.log(`⚠️  ${row.name}`);
      console.log(`   - Funcionário ID: ${row.id}`);
      console.log(`   - Email: ${row.email || 'N/A'}`);
      console.log(`   - Sem usuário vinculado`);
    }
    console.log();
  }
}

await connection.end();
process.exit(0);
