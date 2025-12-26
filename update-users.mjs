import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log("🔄 Atualizando perfis de usuários...\n");

// 1. Atualizar André Sbardellini para RH
const [andre] = await connection.execute(
  `UPDATE users SET role = 'rh' WHERE email = 'andre.sbardellini@uisa.com.br'`
);
console.log(`✅ André Sbardellini → role: rh (${andre.affectedRows} atualizado)`);

// 2. Atualizar Lucas dos Passos Silva para admin (TI)
const [lucas] = await connection.execute(
  `UPDATE users SET role = 'admin' WHERE email = 'lucas.silva@uisa.com.br'`
);
console.log(`✅ Lucas dos Passos Silva → role: admin (${lucas.affectedRows} atualizado)`);

// 3. Atualizar Fabio Leite para RH
const [fabio] = await connection.execute(
  `UPDATE users SET role = 'rh' WHERE email = 'fabio.leite@uisa.com.br'`
);
console.log(`✅ Fabio Leite → role: rh (${fabio.affectedRows} atualizado)`);

// 4. Criar usuário para Alexsandra (vinculado ao funcionário)
const [alexEmployee] = await connection.execute(
  `SELECT id, email FROM employees WHERE employeeCode = '869309' LIMIT 1`
);

if (alexEmployee.length > 0) {
  const employeeId = alexEmployee[0].id;
  const employeeEmail = alexEmployee[0].email;
  
  // Criar usuário com openId temporário (será atualizado no primeiro login)
  const openId = `temp_${employeeEmail}_${Date.now()}`;
  
  const [insertResult] = await connection.execute(
    `INSERT INTO users (openId, name, email, role, createdAt, updatedAt, lastSignedIn)
     VALUES (?, 'ALEXSANDRA TAVARES SOBRAL DE OLIVEIRA', ?, 'rh', NOW(), NOW(), NOW())`,
    [openId, employeeEmail]
  );
  
  const newUserId = insertResult.insertId;
  
  // Vincular usuário ao funcionário
  await connection.execute(
    `UPDATE employees SET userId = ? WHERE id = ?`,
    [newUserId, employeeId]
  );
  
  console.log(`✅ Alexsandra → usuário criado (ID: ${newUserId}) e vinculado ao funcionário`);
} else {
  console.log(`❌ Alexsandra → funcionário não encontrado`);
}

// 5. Verificar Diego Mamani
console.log("\n🔍 Verificando Diego Mamani...");
const [diego] = await connection.execute(
  `SELECT e.id, e.name, e.email, e.userId, u.role
   FROM employees e
   LEFT JOIN users u ON e.userId = u.id
   WHERE LOWER(e.name) LIKE LOWER('%diego%mamani%')
   LIMIT 5`
);

if (diego.length > 0) {
  diego.forEach(row => {
    if (row.userId) {
      console.log(`✅ ${row.name} - Usuário ID: ${row.userId} - Role: ${row.role}`);
      if (row.role !== 'admin') {
        console.log(`   ⚠️  Precisa atualizar para admin`);
      }
    } else {
      console.log(`⚠️  ${row.name} (ID: ${row.id}) - Sem usuário vinculado`);
    }
  });
} else {
  console.log(`❌ Diego Mamani não encontrado no banco`);
}

await connection.end();
console.log("\n✅ Atualização concluída!");
process.exit(0);
