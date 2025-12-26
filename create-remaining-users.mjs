import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log("🔄 Criando usuários restantes...\n");

// 1. Criar usuário para Diego Mamani (admin)
const [diegoEmployee] = await connection.execute(
  `SELECT id, name, email FROM employees WHERE id = 1858 LIMIT 1`
);

if (diegoEmployee.length > 0) {
  const employeeId = diegoEmployee[0].id;
  const employeeEmail = diegoEmployee[0].email;
  const employeeName = diegoEmployee[0].name;
  
  const openId = `temp_${employeeEmail}_${Date.now()}`;
  
  const [insertResult] = await connection.execute(
    `INSERT INTO users (openId, name, email, role, createdAt, updatedAt, lastSignedIn)
     VALUES (?, ?, ?, 'admin', NOW(), NOW(), NOW())`,
    [openId, employeeName, employeeEmail]
  );
  
  const newUserId = insertResult.insertId;
  
  await connection.execute(
    `UPDATE employees SET userId = ? WHERE id = ?`,
    [newUserId, employeeId]
  );
  
  console.log(`✅ Diego Mamani → usuário criado (ID: ${newUserId}, role: admin) e vinculado`);
}

// 2. Buscar Bernardo (variações)
console.log("\n🔍 Buscando Bernardo Mendes...");
const [bernardoResults] = await connection.execute(
  `SELECT id, name, employeeCode, email, departmentId
   FROM employees
   WHERE (LOWER(name) LIKE '%bernardo%' AND LOWER(name) LIKE '%mendes%')
      OR employeeCode IN (SELECT employeeCode FROM employees WHERE LOWER(name) LIKE '%bernardo mendes%')
   LIMIT 5`
);

if (bernardoResults.length > 0) {
  bernardoResults.forEach(row => {
    console.log(`   - ${row.name} (Código: ${row.employeeCode}, ID: ${row.id})`);
  });
} else {
  console.log(`   ❌ Bernardo Mendes não encontrado - PRECISA CADASTRAR FUNCIONÁRIO`);
}

// 3. Buscar Caroline Mendes (variações)
console.log("\n🔍 Buscando Caroline Mendes...");
const [carolineResults] = await connection.execute(
  `SELECT id, name, employeeCode, email, departmentId
   FROM employees
   WHERE (LOWER(name) LIKE '%caroline%' AND LOWER(name) LIKE '%mendes%')
      OR employeeCode IN (SELECT employeeCode FROM employees WHERE LOWER(name) LIKE '%caroline mendes%')
   LIMIT 5`
);

if (carolineResults.length > 0) {
  carolineResults.forEach(row => {
    console.log(`   - ${row.name} (Código: ${row.employeeCode}, ID: ${row.id})`);
  });
} else {
  console.log(`   ❌ Caroline Mendes não encontrada - PRECISA CADASTRAR FUNCIONÁRIO`);
}

await connection.end();
console.log("\n✅ Processo concluído!");
process.exit(0);
