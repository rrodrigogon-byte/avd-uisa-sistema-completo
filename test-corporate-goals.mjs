import { drizzle } from "drizzle-orm/mysql2";
import { eq, desc } from "drizzle-orm";
import { smartGoals } from "./drizzle/schema.js";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não está definida");
  process.exit(1);
}

console.log("🔍 Testando endpoint de metas corporativas...\n");

try {
  const db = drizzle(DATABASE_URL);
  
  // Buscar todas as metas corporativas
  const goals = await db
    .select({
      id: smartGoals.id,
      title: smartGoals.title,
      description: smartGoals.description,
      status: smartGoals.status,
      progress: smartGoals.progress,
      deadline: smartGoals.endDate,
      goalType: smartGoals.goalType,
      category: smartGoals.category,
      createdAt: smartGoals.createdAt,
    })
    .from(smartGoals)
    .where(eq(smartGoals.goalType, 'corporate'))
    .orderBy(desc(smartGoals.createdAt));

  console.log(`✅ Encontradas ${goals.length} metas corporativas\n`);
  
  if (goals.length > 0) {
    console.log("📋 Primeiras 5 metas:");
    goals.slice(0, 5).forEach((goal, index) => {
      console.log(`\n${index + 1}. ${goal.title}`);
      console.log(`   ID: ${goal.id}`);
      console.log(`   Status: ${goal.status}`);
      console.log(`   Progresso: ${goal.progress}%`);
      console.log(`   Categoria: ${goal.category}`);
      console.log(`   Criada em: ${goal.createdAt}`);
    });
  } else {
    console.log("⚠️  Nenhuma meta corporativa encontrada no banco de dados");
    console.log("   Isso pode explicar por que a página está em branco");
  }
  
  // Verificar todas as metas (não apenas corporativas)
  const allGoals = await db
    .select({
      id: smartGoals.id,
      goalType: smartGoals.goalType,
    })
    .from(smartGoals);
  
  console.log(`\n📊 Total de metas no sistema: ${allGoals.length}`);
  
  const goalsByType = allGoals.reduce((acc, goal) => {
    acc[goal.goalType] = (acc[goal.goalType] || 0) + 1;
    return acc;
  }, {});
  
  console.log("\n📈 Metas por tipo:");
  Object.entries(goalsByType).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });
  
  process.exit(0);
} catch (error) {
  console.error("❌ Erro ao buscar metas corporativas:", error);
  process.exit(1);
}
