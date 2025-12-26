import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log("🔧 Corrigindo problemas restantes...\n");

// 1. Corrigir role de Caroline para rh
const [caroline] = await connection.execute(
  `UPDATE users SET role = 'rh' WHERE email = 'caroline.silva@uisa.com.br'`
);
console.log(`✅ Caroline Mendes → role atualizado para 'rh' (${caroline.affectedRows} atualizado)`);

// 2. Buscar email correto de Diego Mamani
const [diegoInfo] = await connection.execute(
  `SELECT e.id, e.name, e.email, e.employeeCode, u.id as userId, u.email as userEmail
   FROM employees e
   LEFT JOIN users u ON e.userId = u.id
   WHERE e.id = 1858`
);

if (diegoInfo.length > 0) {
  const diego = diegoInfo[0];
  console.log(`\n📋 Diego Mamani da Costa:`);
  console.log(`   Funcionário ID: ${diego.id}`);
  console.log(`   Email funcionário: ${diego.email}`);
  console.log(`   Código: ${diego.employeeCode}`);
  if (diego.userId) {
    console.log(`   ✅ Usuário ID: ${diego.userId}`);
    console.log(`   Email usuário: ${diego.userEmail}`);
  } else {
    console.log(`   ❌ Sem usuário vinculado`);
  }
}

// 3. Verificar vínculos de Alexsandra, Caroline e Bernardo
console.log(`\n🔍 Verificando vínculos de funcionários...\n`);

const usersToCheck = [
  { email: 'alexsandra.oliveira@uisa.com.br', code: '869309' },
  { email: 'caroline.silva@uisa.com.br', code: '899674' },
  { email: 'bernardo.mendes@uisa.com.br', code: '8000446' },
];

for (const { email, code } of usersToCheck) {
  const [user] = await connection.execute(
    `SELECT id FROM users WHERE email = ?`,
    [email]
  );
  
  if (user.length > 0) {
    const userId = user[0].id;
    
    // Atualizar vínculo do funcionário
    const [update] = await connection.execute(
      `UPDATE employees SET userId = ? WHERE employeeCode = ?`,
      [userId, code]
    );
    
    if (update.affectedRows > 0) {
      console.log(`✅ ${email} → vinculado ao funcionário ${code}`);
    }
  }
}

await connection.end();
console.log("\n✅ Correções concluídas!");
process.exit(0);
