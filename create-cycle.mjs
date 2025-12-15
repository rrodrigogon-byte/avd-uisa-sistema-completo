import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('📅 Criando ciclo de avaliação 2025...');

const startDate = new Date('2025-01-01');
const endDate = new Date('2025-12-31');

try {
  // Verificar se já existe ciclo ativo
  const [existing] = await connection.query(
    "SELECT id FROM evaluationCycles WHERE status = 'active' LIMIT 1"
  );
  
  if (existing && existing.length > 0) {
    console.log(`✅ Ciclo ativo já existe: ID ${existing[0].id}`);
  } else {
    // Criar novo ciclo
    const [result] = await connection.query(
      `INSERT INTO evaluationCycles (name, year, type, startDate, endDate, status, description, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      ['Ciclo Anual 2025', 2025, 'annual', startDate, endDate, 'active', 'Ciclo de avaliação de desempenho anual 2025']
    );
    
    console.log(`✅ Ciclo criado com sucesso! ID: ${result.insertId}`);
  }
} catch (error) {
  console.error('❌ Erro ao criar ciclo:', error.message);
}

await connection.end();
