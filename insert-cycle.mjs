import mysql from 'mysql2/promise';
const conn = await mysql.createConnection(process.env.DATABASE_URL);

console.log('Inserindo ciclo 2025...');
await conn.query(`
  INSERT INTO evaluationCycles (name, year, type, startDate, endDate, status, description, createdAt, updatedAt)
  VALUES ('Ciclo Anual 2025', 2025, 'annual', '2025-01-01', '2025-12-31', 'active', 'Ciclo de avaliação 2025', NOW(), NOW())
  ON DUPLICATE KEY UPDATE status='active'
`);

const [rows] = await conn.query("SELECT id, name FROM evaluationCycles WHERE year = 2025");
console.log('Ciclo criado:', rows[0]);
await conn.end();
