import { getDb } from "../server/db";
import { smartGoals, goalMilestones, goalApprovals, goalComments, employees } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

async function testGetById() {
  const db = await getDb();
  if (!db) {
    console.error("❌ Banco de dados não disponível");
    process.exit(1);
  }

  const goalId = 30001;
  console.log(`🧪 Testando endpoint getById para goalId = ${goalId}\n`);

  try {
    // 1. Buscar meta
    console.log("1️⃣ Buscando meta...");
    const [goal] = await db
      .select()
      .from(smartGoals)
      .where(eq(smartGoals.id, goalId))
      .limit(1);

    if (!goal) {
      console.error("❌ Meta não encontrada");
      process.exit(1);
    }

    console.log(`✅ Meta encontrada: ${goal.title}\n`);

    // 2. Buscar marcos
    console.log("2️⃣ Buscando marcos...");
    const milestones = await db
      .select()
      .from(goalMilestones)
      .where(eq(goalMilestones.goalId, goalId))
      .orderBy(goalMilestones.dueDate);

    console.log(`✅ Encontrados ${milestones.length} marcos\n`);

    // 3. Buscar aprovações
    console.log("3️⃣ Buscando aprovações...");
    try {
      const approvals = await db
        .select({
          id: goalApprovals.id,
          approverId: goalApprovals.approverId,
          approverRole: goalApprovals.approverRole,
          status: goalApprovals.status,
          comments: goalApprovals.comments,
          createdAt: goalApprovals.createdAt,
          decidedAt: goalApprovals.decidedAt,
          approverName: employees.name,
        })
        .from(goalApprovals)
        .leftJoin(employees, eq(goalApprovals.approverId, employees.id))
        .where(eq(goalApprovals.goalId, goalId))
        .orderBy(goalApprovals.createdAt);

      console.log(`✅ Encontradas ${approvals.length} aprovações\n`);
    } catch (error: any) {
      console.error("❌ Erro ao buscar aprovações:", error.message);
      console.error("Stack:", error.stack);
    }

    // 4. Buscar comentários
    console.log("4️⃣ Buscando comentários...");
    try {
      const comments = await db
        .select({
          id: goalComments.id,
          authorId: goalComments.authorId,
          comment: goalComments.comment,
          createdAt: goalComments.createdAt,
          authorName: employees.name,
        })
        .from(goalComments)
        .leftJoin(employees, eq(goalComments.authorId, employees.id))
        .where(eq(goalComments.goalId, goalId))
        .orderBy(desc(goalComments.createdAt));

      console.log(`✅ Encontrados ${comments.length} comentários\n`);
    } catch (error: any) {
      console.error("❌ Erro ao buscar comentários:", error.message);
      console.error("Stack:", error.stack);
    }

    // 5. Buscar evidências
    console.log("5️⃣ Buscando evidências...");
    try {
      const { goalEvidences } = await import("../drizzle/schema");
      const evidences = await db
        .select()
        .from(goalEvidences)
        .where(eq(goalEvidences.goalId, goalId))
        .orderBy(desc(goalEvidences.uploadedAt));

      console.log(`✅ Encontradas ${evidences.length} evidências\n`);
    } catch (error: any) {
      console.error("❌ Erro ao buscar evidências:", error.message);
      console.error("Stack:", error.stack);
    }

    console.log("✅ Teste concluído!");
  } catch (error: any) {
    console.error("❌ Erro geral:", error.message);
    console.error("Stack:", error.stack);
  }

  process.exit(0);
}

testGetById();
