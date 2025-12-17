import { getDb } from "../server/db";
import { smartGoals } from "../drizzle/schema";

async function checkGoalIds() {
  const db = await getDb();
  if (!db) {
    console.error("❌ Banco de dados não disponível");
    process.exit(1);
  }

  console.log("🔍 Buscando IDs das metas no banco de dados...\n");

  const goals = await db
    .select({
      id: smartGoals.id,
      title: smartGoals.title,
      status: smartGoals.status,
      progress: smartGoals.progress,
    })
    .from(smartGoals)
    .orderBy(smartGoals.id)
    .limit(10);

  console.log(`✅ Encontradas ${goals.length} metas:\n`);
  
  goals.forEach((goal) => {
    console.log(`ID: ${goal.id} | Status: ${goal.status} | Progresso: ${goal.progress}%`);
    console.log(`   Título: ${goal.title}`);
    console.log("");
  });

  process.exit(0);
}

checkGoalIds();
