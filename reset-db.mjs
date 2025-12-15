import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

console.log("🗑️  Dropping all tables...");

// Get all tables
const [tables] = await connection.query("SHOW TABLES");
const tableNames = tables.map(row => Object.values(row)[0]);

console.log(`Found ${tableNames.length} tables to drop`);

// Disable foreign key checks
await connection.query("SET FOREIGN_KEY_CHECKS = 0");

// Drop all tables
for (const tableName of tableNames) {
  console.log(`  Dropping ${tableName}...`);
  await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
}

// Re-enable foreign key checks
await connection.query("SET FOREIGN_KEY_CHECKS = 1");

console.log("✅ All tables dropped successfully");
await connection.end();
