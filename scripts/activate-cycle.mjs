import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

await connection.execute("UPDATE evaluationCycles SET status = 'em_andamento' WHERE id = 1");
console.log('✅ Ciclo de avaliação ativado!');

await connection.end();
