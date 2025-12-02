import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { migrate } from "drizzle-orm/mysql2/migrator";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);
  
  console.log("Aplicando migrações...");
  await migrate(db, { migrationsFolder: "./drizzle/migrations" });
  console.log("Migrações aplicadas com sucesso!");
  
  await connection.end();
}

main().catch((err) => {
  console.error("Erro ao aplicar migrações:", err);
  process.exit(1);
});
