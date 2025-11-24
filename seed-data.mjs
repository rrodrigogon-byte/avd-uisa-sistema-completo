import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./drizzle/schema.ts";

// Conectar ao banco de dados
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: "default" });

console.log("🌱 Iniciando seed do banco de dados...\n");

// Limpar dados de seed anteriores
console.log("🧹 Limpando dados de seed anteriores...");
await connection.query("DELETE FROM users WHERE openId LIKE 'seed_%'");
console.log("   ✓ Dados de seed removidos\n");

// Dados realistas de colaboradores
const colaboradores = [
  { name: "Ana Silva", email: "ana.silva@uisa.com.br", department: "Vendas", role: "gestor" },
  { name: "Carlos Santos", email: "carlos.santos@uisa.com.br", department: "TI", role: "colaborador" },
  { name: "Mariana Costa", email: "mariana.costa@uisa.com.br", department: "Marketing", role: "colaborador" },
  { name: "Pedro Oliveira", email: "pedro.oliveira@uisa.com.br", department: "Financeiro", role: "gestor" },
  { name: "Juliana Ferreira", email: "juliana.ferreira@uisa.com.br", department: "RH", role: "rh" },
  { name: "Ricardo Almeida", email: "ricardo.almeida@uisa.com.br", department: "Operações", role: "colaborador" },
  { name: "Fernanda Lima", email: "fernanda.lima@uisa.com.br", department: "Vendas", role: "colaborador" },
  { name: "Lucas Martins", email: "lucas.martins@uisa.com.br", department: "TI", role: "colaborador" },
  { name: "Beatriz Rocha", email: "beatriz.rocha@uisa.com.br", department: "Marketing", role: "gestor" },
  { name: "Gabriel Souza", email: "gabriel.souza@uisa.com.br", department: "Financeiro", role: "colaborador" },
];

// Criar colaboradores
console.log("👥 Criando 10 colaboradores...");
const userIds = [];
for (const collab of colaboradores) {
  const result = await db.insert(schema.users).values({
    openId: `seed_${collab.email}`,
    name: collab.name,
    email: collab.email,
    loginMethod: "email",
    role: collab.role,
  });
  userIds.push(result[0].insertId);
  console.log(`   ✓ ${collab.name} (${collab.department})`);
}

// Criar ciclo de avaliação 2025
console.log("\n📅 Criando ciclo de avaliação 2025...");
const cycleResult = await db.insert(schema.evaluationCycles).values({
  name: "Ciclo 2025",
  year: 2025,
  type: "anual",
  startDate: new Date("2025-01-01"),
  endDate: new Date("2025-12-31"),
  status: "em_andamento",
});
const cycleId = cycleResult[0].insertId;
console.log(`   ✓ Ciclo ${cycleId} criado`);

// Criar metas SMART (5 por colaborador)
console.log("\n🎯 Criando 50 metas SMART...");
const metasTemplates = [
  { title: "Aumentar vendas em 20%", category: "financial", description: "Aumentar a receita de vendas em 20% através de novas estratégias de prospecção" },
  { title: "Reduzir custos operacionais", category: "financial", description: "Reduzir custos operacionais em 15% através de otimização de processos" },
  { title: "Melhorar satisfação do cliente", category: "behavioral", description: "Aumentar NPS de 7 para 9 através de melhorias no atendimento" },
  { title: "Implementar novo sistema", category: "corporate", description: "Implementar sistema de CRM até junho com 100% de adesão da equipe" },
  { title: "Desenvolver habilidades técnicas", category: "development", description: "Completar 3 certificações profissionais até o final do ano" },
];

const goalIds = [];
for (let i = 0; i < userIds.length; i++) {
  for (let j = 0; j < 5; j++) {
    const template = metasTemplates[j];
    const progress = Math.floor(Math.random() * 100);
    const status = progress === 0 ? "not_started" : progress === 100 ? "completed" : "in_progress";
    
    const result = await db.insert(schema.smartGoals).values({
      employeeId: userIds[i],
      cycleId: cycleId,
      title: `${template.title} - ${colaboradores[i].name.split(" ")[0]}`,
      description: template.description,
      type: "individual",
      category: template.category,
      measurementUnit: j === 0 || j === 1 ? "%" : j === 2 ? "pontos" : j === 3 ? "%" : "certificações",
      targetValue: j === 0 ? 20 : j === 1 ? 15 : j === 2 ? 9 : j === 3 ? 100 : 3,
      currentValue: Math.floor((progress / 100) * (j === 0 ? 20 : j === 1 ? 15 : j === 2 ? 9 : j === 3 ? 100 : 3)),
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      status: status,
      progress: progress,
    });
    goalIds.push(result[0].insertId);
  }
}
console.log(`   ✓ ${goalIds.length} metas criadas`);

// Criar marcos (milestones) para algumas metas
console.log("\n📍 Criando marcos para metas...");
let milestoneCount = 0;
for (let i = 0; i < Math.min(20, goalIds.length); i++) {
  const numMilestones = Math.floor(Math.random() * 3) + 2; // 2-4 marcos por meta
  for (let j = 0; j < numMilestones; j++) {
    const month = j + 1;
    const status = month <= 3 ? "completed" : month <= 6 ? "in_progress" : "pending";
    await db.insert(schema.goalMilestones).values({
      goalId: goalIds[i],
      title: `Marco ${j + 1} - Trimestre ${Math.ceil(month / 3)}`,
      description: `Atividade planejada para o ${Math.ceil(month / 3)}º trimestre`,
      dueDate: new Date(`2025-${String(month * 3).padStart(2, "0")}-01`),
      status: status,
      progress: status === "completed" ? 100 : status === "in_progress" ? 50 : 0,
      completedAt: status === "completed" ? new Date() : null,
    });
    milestoneCount++;
  }
}
console.log(`   ✓ ${milestoneCount} marcos criados`);

// Criar questões de avaliação 360°
console.log("\n❓ Criando questões de avaliação 360°...");
const questions = [
  { category: "competencias_tecnicas", question: "Demonstra domínio técnico nas atividades do cargo", weight: 2 },
  { category: "competencias_tecnicas", question: "Busca atualização e aprendizado contínuo", weight: 2 },
  { category: "competencias_comportamentais", question: "Trabalha bem em equipe e colabora com colegas", weight: 3 },
  { category: "competencias_comportamentais", question: "Demonstra proatividade e iniciativa", weight: 3 },
  { category: "lideranca", question: "Inspira e motiva a equipe", weight: 2 },
  { category: "lideranca", question: "Toma decisões assertivas", weight: 2 },
  { category: "resultados", question: "Atinge as metas estabelecidas", weight: 3 },
  { category: "resultados", question: "Entrega trabalho com qualidade", weight: 3 },
];

const questionIds = [];
for (const q of questions) {
  const result = await db.insert(schema.evaluation360Questions).values({
    category: q.category,
    question: q.question,
    weight: q.weight,
    isActive: true,
  });
  questionIds.push(result[0].insertId);
}
console.log(`   ✓ ${questionIds.length} questões criadas`);

// Criar 3 avaliações 360° em andamento
console.log("\n⭐ Criando 3 avaliações 360° em andamento...");
const evaluationStatuses = ["self_assessment", "manager_assessment", "consensus"];
for (let i = 0; i < 3; i++) {
  const userId = userIds[i];
  const managerId = userIds[Math.floor(Math.random() * userIds.length)];
  
  const evalResult = await db.insert(schema.evaluation360).values({
    userId: userId,
    cycleId: cycleId,
    managerId: managerId,
    status: evaluationStatuses[i],
    selfAssessmentDate: i >= 0 ? new Date() : null,
    managerAssessmentDate: i >= 1 ? new Date() : null,
    consensusDate: i >= 2 ? new Date() : null,
  });
  const evaluationId = evalResult[0].insertId;
  
  // Criar respostas de autoavaliação
  if (i >= 0) {
    for (const qId of questionIds) {
      await db.insert(schema.evaluation360Responses).values({
        evaluationId: evaluationId,
        questionId: qId,
        evaluatorType: "self",
        rating: Math.floor(Math.random() * 3) + 3, // 3-5
        comments: "Autoavaliação: Considero que estou desempenhando bem nesta competência.",
      });
    }
  }
  
  // Criar respostas do gestor
  if (i >= 1) {
    for (const qId of questionIds) {
      await db.insert(schema.evaluation360Responses).values({
        evaluationId: evaluationId,
        questionId: qId,
        evaluatorType: "manager",
        rating: Math.floor(Math.random() * 3) + 3, // 3-5
        comments: "Avaliação do gestor: Desempenho satisfatório nesta área.",
      });
    }
  }
  
  // Criar consenso
  if (i >= 2) {
    for (const qId of questionIds) {
      await db.insert(schema.evaluation360Responses).values({
        evaluationId: evaluationId,
        questionId: qId,
        evaluatorType: "consensus",
        rating: Math.floor(Math.random() * 3) + 3, // 3-5
        comments: "Consenso: Nota final após discussão entre colaborador e gestor.",
      });
    }
  }
  
  console.log(`   ✓ Avaliação 360° ${i + 1} (${evaluationStatuses[i]}) - ${colaboradores[i].name}`);
}

// Criar 2 PDIs ativos
console.log("\n📋 Criando 2 PDIs ativos...");
for (let i = 0; i < 2; i++) {
  const userId = userIds[i];
  
  const pdiResult = await db.insert(schema.pdis).values({
    userId: userId,
    cycleId: cycleId,
    status: "in_progress",
    overallProgress: Math.floor(Math.random() * 50) + 25, // 25-75%
  });
  const pdiId = pdiResult[0].insertId;
  
  // Criar 3 objetivos por PDI
  for (let j = 0; j < 3; j++) {
    const objectiveResult = await db.insert(schema.pdiObjectives).values({
      pdiId: pdiId,
      title: `Objetivo ${j + 1} - Desenvolver ${j === 0 ? "liderança" : j === 1 ? "habilidades técnicas" : "comunicação"}`,
      description: `Descrição detalhada do objetivo de desenvolvimento ${j + 1}`,
      priority: j === 0 ? "high" : j === 1 ? "medium" : "low",
      status: j === 0 ? "completed" : "in_progress",
      progress: j === 0 ? 100 : Math.floor(Math.random() * 50) + 25,
    });
    const objectiveId = objectiveResult[0].insertId;
    
    // Criar 2 ações por objetivo
    for (let k = 0; k < 2; k++) {
      await db.insert(schema.pdiActions).values({
        objectiveId: objectiveId,
        action: `Ação ${k + 1}: ${k === 0 ? "Participar de curso" : "Aplicar conhecimento em projeto real"}`,
        deadline: new Date(`2025-${String((j + 1) * 3).padStart(2, "0")}-01`),
        status: j === 0 && k === 0 ? "completed" : k === 0 ? "in_progress" : "pending",
        completedAt: j === 0 && k === 0 ? new Date() : null,
      });
    }
  }
  
  console.log(`   ✓ PDI ${i + 1} criado para ${colaboradores[i].name}`);
}

console.log("\n✅ Seed concluído com sucesso!");
console.log("\n📊 Resumo:");
console.log(`   • ${userIds.length} colaboradores`);
console.log(`   • ${goalIds.length} metas SMART`);
console.log(`   • ${milestoneCount} marcos`);
console.log(`   • ${questionIds.length} questões de avaliação`);
console.log(`   • 3 avaliações 360° em andamento`);
console.log(`   • 2 PDIs ativos com 6 objetivos e 12 ações`);

await connection.end();
