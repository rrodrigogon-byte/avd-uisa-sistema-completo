import { drizzle } from "drizzle-orm/mysql2";
import { eq, and } from "drizzle-orm";
import mysql from "mysql2/promise";

// Import schemas
import { 
  employees, 
  evaluationCycles, 
  pirAssessments, 
  pirAssessmentAnswers,
  pirQuestions 
} from "../drizzle/schema.js";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não está definida");
  process.exit(1);
}

// Criar conexão com o banco
const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

console.log("🚀 Iniciando seed de avaliações PIR de teste...\n");

// 1. Buscar o ciclo "Ciclo Fonte Workflow - 2023"
console.log("📋 Buscando ciclo de avaliação...");
const cycles = await db
  .select()
  .from(evaluationCycles)
  .where(eq(evaluationCycles.name, "Ciclo Fonte Workflow - 2023"))
  .limit(1);

if (cycles.length === 0) {
  console.error("❌ Ciclo 'Ciclo Fonte Workflow - 2023' não encontrado");
  await connection.end();
  process.exit(1);
}

const cycle = cycles[0];
console.log(`✅ Ciclo encontrado: ${cycle.name} (ID: ${cycle.id})\n`);

// 2. Buscar funcionários para criar avaliações
console.log("👥 Buscando funcionários...");
const employeesList = await db
  .select()
  .from(employees)
  .limit(20); // Criar avaliações para 20 funcionários

console.log(`✅ ${employeesList.length} funcionários encontrados\n`);

// 3. Buscar todas as questões PIR
console.log("❓ Buscando questões PIR...");
const questions = await db.select().from(pirQuestions);
console.log(`✅ ${questions.length} questões encontradas\n`);

if (questions.length === 0) {
  console.error("❌ Nenhuma questão PIR encontrada no banco");
  await connection.end();
  process.exit(1);
}

// 4. Criar avaliações PIR para cada funcionário
console.log("📝 Criando avaliações PIR...\n");

let createdCount = 0;
let skippedCount = 0;

for (const employee of employeesList) {
  try {
    // Verificar se já existe avaliação para este funcionário neste ciclo
    const existing = await db
      .select()
      .from(pirAssessments)
      .where(
        and(
          eq(pirAssessments.employeeId, employee.id),
          eq(pirAssessments.cycleId, cycle.id)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      console.log(`⏭️  Pulando ${employee.name} - já possui avaliação`);
      skippedCount++;
      continue;
    }

    // Criar avaliação PIR
    const [assessment] = await db
      .insert(pirAssessments)
      .values({
        employeeId: employee.id,
        cycleId: cycle.id,
        status: "completed",
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .$returningId();

    // Gerar respostas aleatórias para todas as questões
    const answers = questions.map((question) => {
      // Gerar pontuação aleatória entre 1 e 5
      const score = Math.floor(Math.random() * 5) + 1;

      return {
        assessmentId: assessment.id,
        questionId: question.id,
        score,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    // Inserir todas as respostas
    await db.insert(pirAssessmentAnswers).values(answers);

    console.log(`✅ Avaliação criada para ${employee.name} (${answers.length} respostas)`);
    createdCount++;

  } catch (error) {
    console.error(`❌ Erro ao criar avaliação para ${employee.name}:`, error.message);
  }
}

console.log("\n" + "=".repeat(60));
console.log("📊 RESUMO DO SEED");
console.log("=".repeat(60));
console.log(`✅ Avaliações criadas: ${createdCount}`);
console.log(`⏭️  Avaliações puladas (já existentes): ${skippedCount}`);
console.log(`📋 Total de funcionários processados: ${employeesList.length}`);
console.log(`❓ Questões PIR por avaliação: ${questions.length}`);
console.log("=".repeat(60) + "\n");

await connection.end();
console.log("✅ Seed concluído com sucesso!");
