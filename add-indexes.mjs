import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL não configurada");
  process.exit(1);
}

console.log("Conectando ao banco de dados...");
const db = drizzle(DATABASE_URL);

const indexes = [
  // Índices para activityLogs
  "CREATE INDEX IF NOT EXISTS idx_activityLogs_userId ON activityLogs(userId)",
  "CREATE INDEX IF NOT EXISTS idx_activityLogs_createdAt ON activityLogs(createdAt)",
  "CREATE INDEX IF NOT EXISTS idx_activityLogs_activityType ON activityLogs(activityType)",
  "CREATE INDEX IF NOT EXISTS idx_activityLogs_userId_createdAt ON activityLogs(userId, createdAt)",
  "CREATE INDEX IF NOT EXISTS idx_activityLogs_activityType_createdAt ON activityLogs(activityType, createdAt)",
  
  // Índices para employees
  "CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(name)",
  "CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email)",
  "CREATE INDEX IF NOT EXISTS idx_employees_departmentId ON employees(departmentId)",
  "CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status)",
  "CREATE INDEX IF NOT EXISTS idx_employees_name_email ON employees(name, email)",
];

console.log(`\nCriando ${indexes.length} índices...\n`);

for (const indexSql of indexes) {
  try {
    console.log(`Executando: ${indexSql}`);
    await db.execute(sql.raw(indexSql));
    console.log("✓ Índice criado com sucesso\n");
  } catch (error) {
    console.error(`✗ Erro ao criar índice: ${error.message}\n`);
  }
}

console.log("Processo concluído!");
process.exit(0);
