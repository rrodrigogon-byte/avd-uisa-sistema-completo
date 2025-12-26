import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log("📊 RELATÓRIO FINAL - USUÁRIOS DO SISTEMA\n");
console.log("=" .repeat(80));

const usersList = [
  { email: 'rodrigo.goncalves@uisa.com.br', expectedRole: 'admin' },
  { email: 'diego.mamani@uisa.com.br', expectedRole: 'admin' },
  { email: 'lucas.silva@uisa.com.br', expectedRole: 'admin' },
  { email: 'andre.sbardellini@uisa.com.br', expectedRole: 'rh' },
  { email: 'fabio.leite@uisa.com.br', expectedRole: 'rh' },
  { email: 'alexsandra.oliveira@uisa.com.br', expectedRole: 'rh' },
  { email: 'caroline.silva@uisa.com.br', expectedRole: 'rh' },
  { email: 'bernardo.mendes@uisa.com.br', expectedRole: 'gestor' },
];

console.log("\n✅ USUÁRIOS CADASTRADOS:\n");

for (const { email, expectedRole } of usersList) {
  const [results] = await connection.execute(
    `SELECT u.id, u.name, u.email, u.role, e.employeeCode
     FROM users u
     LEFT JOIN employees e ON u.id = e.userId
     WHERE u.email = ?
     LIMIT 1`,
    [email]
  );
  
  if (results.length > 0) {
    const user = results[0];
    const roleMatch = user.role === expectedRole ? '✓' : '⚠️';
    console.log(`${roleMatch} ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role} ${user.role === expectedRole ? '' : `(esperado: ${expectedRole})`}`);
    console.log(`   Código Funcionário: ${user.employeeCode || 'N/A'}`);
    console.log();
  } else {
    console.log(`❌ ${email} - NÃO ENCONTRADO`);
    console.log();
  }
}

console.log("=" .repeat(80));
console.log("\n📋 RESUMO POR PERFIL:\n");

const [adminCount] = await connection.execute(
  `SELECT COUNT(*) as count FROM users WHERE role = 'admin'`
);
console.log(`👑 Administradores (admin): ${adminCount[0].count}`);

const [rhCount] = await connection.execute(
  `SELECT COUNT(*) as count FROM users WHERE role = 'rh'`
);
console.log(`👥 RH (rh): ${rhCount[0].count}`);

const [gestorCount] = await connection.execute(
  `SELECT COUNT(*) as count FROM users WHERE role = 'gestor'`
);
console.log(`📊 Gestores (gestor): ${gestorCount[0].count}`);

const [userCount] = await connection.execute(
  `SELECT COUNT(*) as count FROM users WHERE role = 'user'`
);
console.log(`👤 Usuários (user): ${userCount[0].count}`);

await connection.end();
process.exit(0);
