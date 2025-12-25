import { getDb } from "../server/db";

async function checkColumns() {
  const db = await getDb();
  if (!db) {
    console.error("❌ Banco de dados não disponível");
    process.exit(1);
  }

  console.log("🔍 Verificando colunas da tabela goalComments...\n");

  const [rows] = await db.execute("DESCRIBE goalComments");
  
  console.log("Colunas encontradas:");
  console.table(rows);

  process.exit(0);
}

checkColumns();
