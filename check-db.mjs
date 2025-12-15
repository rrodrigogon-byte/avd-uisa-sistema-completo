import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [tables] = await connection.query("SHOW TABLES");
console.log(`Tables in database: ${tables.length}`);
tables.forEach(row => console.log(`  - ${Object.values(row)[0]}`));
await connection.end();
