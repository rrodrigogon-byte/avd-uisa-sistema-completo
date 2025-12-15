import { getDb } from "./db";
import { successionCandidates, successionPlans } from "../drizzle/schema";

async function testAddSuccessor() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    return;
  }

  try {
    // Buscar um plano existente
    const plans = await db.select().from(successionPlans).limit(1);
    if (plans.length === 0) {
      console.error("Nenhum plano encontrado");
      return;
    }

    const planId = plans[0].id;
    console.log("Plano encontrado:", planId);

    // Tentar adicionar um sucessor
    const testData = {
      planId: planId,
      employeeId: 1,
      readinessLevel: "imediato" as const,
      priority: 1,
      performance: "medio" as const,
      potential: "medio" as const,
      gapAnalysis: null,
      developmentActions: null,
      comments: null,
    };

    console.log("Dados de teste:", testData);

    const [result] = await db.insert(successionCandidates).values(testData);

    console.log("Sucessor adicionado com sucesso!", result);
  } catch (error) {
    console.error("Erro ao adicionar sucessor:", error);
  }

  process.exit(0);
}

testAddSuccessor();
