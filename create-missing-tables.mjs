import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log("Criando tabela cycle360Drafts...");
  
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS cycle360Drafts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      draftKey VARCHAR(100) NOT NULL UNIQUE,
      userId INT NOT NULL,
      userEmail VARCHAR(320) NOT NULL,
      userName VARCHAR(200),
      draftData TEXT NOT NULL,
      currentStep INT NOT NULL DEFAULT 1,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  
  console.log("Tabela cycle360Drafts criada com sucesso!");
  
  await connection.end();
}

main().catch((err) => {
  console.error("Erro:", err);
  process.exit(1);
});
