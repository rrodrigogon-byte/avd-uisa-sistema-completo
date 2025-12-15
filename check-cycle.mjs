import mysql from 'mysql2/promise';
const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.query("SELECT id, name, year, status FROM evaluationCycles WHERE status = 'active'");
console.log('Ciclos ativos:', JSON.stringify(rows, null, 2));
await conn.end();
