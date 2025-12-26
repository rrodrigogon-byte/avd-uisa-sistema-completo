import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log("🔄 Criando usuários para Bernardo e Caroline...\n");

// 1. Criar usuário para Bernardo Mendes (gestor - Coordenador de Comunicação)
const [bernardoEmployee] = await connection.execute(
  `SELECT id, name, email FROM employees WHERE employeeCode = '8000446' LIMIT 1`
);

if (bernardoEmployee.length > 0) {
  const employeeId = bernardoEmployee[0].id;
  const employeeEmail = bernardoEmployee[0].email;
  const employeeName = bernardoEmployee[0].name;
  
  const openId = `temp_${employeeEmail}_${Date.now()}`;
  
  const [insertResult] = await connection.execute(
    `INSERT INTO users (openId, name, email, role, createdAt, updatedAt, lastSignedIn)
     VALUES (?, ?, ?, 'gestor', NOW(), NOW(), NOW())`,
    [openId, employeeName, employeeEmail]
  );
  
  const newUserId = insertResult.insertId;
  
  await connection.execute(
    `UPDATE employees SET userId = ? WHERE id = ?`,
    [newUserId, employeeId]
  );
  
  console.log(`✅ Bernardo Mendes → usuário criado (ID: ${newUserId}, role: gestor) e vinculado`);
  console.log(`   Email: ${employeeEmail}`);
} else {
  console.log(`❌ Bernardo Mendes não encontrado`);
}

// 2. Criar usuário para Caroline Mendes (rh - Coordenadora de DHO)
const [carolineEmployee] = await connection.execute(
  `SELECT id, name, email FROM employees WHERE employeeCode = '899674' LIMIT 1`
);

if (carolineEmployee.length > 0) {
  const employeeId = carolineEmployee[0].id;
  const employeeEmail = carolineEmployee[0].email;
  const employeeName = carolineEmployee[0].name;
  
  const openId = `temp_${employeeEmail}_${Date.now()}`;
  
  const [insertResult] = await connection.execute(
    `INSERT INTO users (openId, name, email, role, createdAt, updatedAt, lastSignedIn)
     VALUES (?, ?, ?, 'rh', NOW(), NOW(), NOW())`,
    [openId, employeeName, employeeEmail]
  );
  
  const newUserId = insertResult.insertId;
  
  await connection.execute(
    `UPDATE employees SET userId = ? WHERE id = ?`,
    [newUserId, employeeId]
  );
  
  console.log(`✅ Caroline Mendes → usuário criado (ID: ${newUserId}, role: rh) e vinculado`);
  console.log(`   Email: ${employeeEmail}`);
} else {
  console.log(`❌ Caroline Mendes não encontrada`);
}

await connection.end();
console.log("\n✅ Todos os usuários foram criados com sucesso!");
process.exit(0);
