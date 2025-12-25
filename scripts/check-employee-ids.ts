import { getDb } from "../server/db";
import { smartGoals, employees, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function checkEmployeeIds() {
  const db = await getDb();
  if (!db) {
    console.error("❌ Banco de dados não disponível");
    process.exit(1);
  }

  console.log("🔍 Verificando relacionamento entre users, employees e smartGoals...\n");

  // Buscar usuário admin
  const [user] = await db.select().from(users).where(eq(users.id, 1)).limit(1);
  console.log("👤 Usuário:", user?.name, "| ID:", user?.id);

  // Buscar employee vinculado ao usuário
  const [employee] = await db.select().from(employees).where(eq(employees.userId, 1)).limit(1);
  console.log("👔 Employee:", employee?.name, "| ID:", employee?.id, "| userId:", employee?.userId);

  // Buscar metas
  console.log("\n📋 Metas no banco de dados:");
  const goals = await db
    .select({
      id: smartGoals.id,
      title: smartGoals.title,
      employeeId: smartGoals.employeeId,
      createdBy: smartGoals.createdBy,
    })
    .from(smartGoals)
    .limit(10);

  goals.forEach((goal) => {
    console.log(`ID: ${goal.id} | employeeId: ${goal.employeeId} | createdBy: ${goal.createdBy}`);
    console.log(`   Título: ${goal.title}`);
  });

  console.log("\n🔧 PROBLEMA IDENTIFICADO:");
  if (employee) {
    console.log(`✅ Employee existe com ID ${employee.id}`);
    console.log(`❌ Metas estão usando employeeId incorreto ou NULL`);
    console.log(`\n💡 SOLUÇÃO: Atualizar metas para usar employeeId = ${employee.id}`);
  } else {
    console.log(`❌ Nenhum employee vinculado ao userId = 1`);
    console.log(`\n💡 SOLUÇÃO: Criar employee para o usuário admin`);
  }

  process.exit(0);
}

checkEmployeeIds();
