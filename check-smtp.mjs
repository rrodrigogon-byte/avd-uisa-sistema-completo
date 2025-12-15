import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const result = await connection.query(
  "SELECT * FROM systemSettings WHERE settingKey LIKE 'smtp_%' ORDER BY settingKey"
);

console.log('📧 Configuração SMTP Atual:');
console.log(JSON.stringify(result[0], null, 2));

await connection.end();
