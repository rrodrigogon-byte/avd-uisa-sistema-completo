import { getDb } from "../server/db";
import { smartGoals, employees, users } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

async function testGoalsEndpoints() {
  const db = await getDb();
  if (!db) {
    console.error("❌ Banco de dados não disponível");
    process.exit(1);
  }

  console.log("🧪 Testando endpoints de metas...\n");

  // Simular contexto do usuário
  const userId = 1;
  console.log(`👤 Testando com userId = ${userId}\n`);

  // 1. Buscar employee vinculado ao usuário
  console.log("1️⃣ Buscando employee vinculado ao usuário...");
  const [employee] = await db
    .select()
    .from(employees)
    .where(eq(employees.userId, userId))
    .limit(1);

  if (!employee) {
    console.error("❌ Nenhum employee encontrado para userId =", userId);
    process.exit(1);
  }

  console.log(`✅ Employee encontrado: ${employee.name} (ID: ${employee.id})\n`);

  // 2. Buscar metas do employee
  console.log("2️⃣ Buscando metas do employee...");
  const goals = await db
    .select()
    .from(smartGoals)
    .where(eq(smartGoals.employeeId, employee.id))
    .orderBy(desc(smartGoals.createdAt));

  console.log(`✅ Encontradas ${goals.length} metas:\n`);
  goals.forEach((goal) => {
    console.log(`   ID: ${goal.id} | Status: ${goal.status} | Progresso: ${goal.progress}%`);
    console.log(`   Título: ${goal.title}`);
    console.log("");
  });

  // 3. Calcular KPIs do dashboard
  console.log("3️⃣ Calculando KPIs do dashboard...");
  const activeGoals = goals.filter((g) =>
    ["approved", "in_progress"].includes(g.status)
  ).length;
  const completedGoals = goals.filter((g) => g.status === "completed").length;
  const completionRate =
    goals.length > 0 ? (completedGoals / goals.length) * 100 : 0;

  const bonusGoals = goals.filter((g) => g.bonusEligible);
  const potentialBonus = bonusGoals.reduce((sum, goal) => {
    if (goal.bonusAmount) {
      return sum + parseFloat(goal.bonusAmount);
    }
    return sum;
  }, 0);

  const avgProgress =
    goals.length > 0
      ? goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length
      : 0;

  console.log(`✅ KPIs calculados:`);
  console.log(`   - Metas Ativas: ${activeGoals}`);
  console.log(`   - Metas Concluídas: ${completedGoals}`);
  console.log(`   - Taxa de Conclusão: ${Math.round(completionRate)}%`);
  console.log(`   - Bônus Potencial: R$ ${potentialBonus.toFixed(2)}`);
  console.log(`   - Média de Progresso: ${Math.round(avgProgress)}%`);
  console.log("");

  // 4. Distribuição por categoria
  console.log("4️⃣ Distribuição por categoria:");
  const byCategory = {
    financial: goals.filter((g) => g.category === "financial").length,
    behavioral: goals.filter((g) => g.category === "behavioral").length,
    corporate: goals.filter((g) => g.category === "corporate").length,
    development: goals.filter((g) => g.category === "development").length,
  };
  console.log(`   - Financeiras: ${byCategory.financial}`);
  console.log(`   - Comportamentais: ${byCategory.behavioral}`);
  console.log(`   - Corporativas: ${byCategory.corporate}`);
  console.log(`   - Desenvolvimento: ${byCategory.development}`);
  console.log("");

  console.log("✅ Todos os testes concluídos com sucesso!");
  process.exit(0);
}

testGoalsEndpoints();
