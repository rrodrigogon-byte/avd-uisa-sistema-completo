import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não está definida");
  process.exit(1);
}

console.log("🌱 Criando metas corporativas de exemplo...\n");

try {
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);
  
  // Buscar um funcionário e ciclo existentes
  const [employees] = await connection.execute("SELECT id FROM employees LIMIT 1");
  const [cycles] = await connection.execute("SELECT id FROM evaluationCycles WHERE status = 'planejado' LIMIT 1");
  
  if (employees.length === 0) {
    console.error("❌ Nenhum funcionário encontrado no banco. Crie funcionários primeiro.");
    await connection.end();
    process.exit(1);
  }
  
  if (cycles.length === 0) {
    console.error("❌ Nenhum ciclo encontrado no banco. Crie um ciclo primeiro.");
    await connection.end();
    process.exit(1);
  }
  
  const employeeId = employees[0].id;
  const cycleId = cycles[0].id;
  
  console.log(`✅ Usando funcionário ID: ${employeeId}`);
  console.log(`✅ Usando ciclo ID: ${cycleId}\n`);
  
  // Metas corporativas de exemplo
  const corporateGoals = [
    {
      title: "Aumentar Receita em 20%",
      description: "Aumentar a receita total da empresa em 20% em relação ao ano anterior através de expansão de mercado e novos produtos.",
      category: "financial",
      measurementUnit: "%",
      targetValue: "20",
      currentValue: "0",
      weight: 30,
      startDate: "2025-01-01",
      endDate: "2025-12-31",
      status: "approved",
      progress: 15,
    },
    {
      title: "Reduzir Custos Operacionais em 15%",
      description: "Otimizar processos internos e reduzir desperdícios para diminuir custos operacionais em 15%.",
      category: "financial",
      measurementUnit: "%",
      targetValue: "15",
      currentValue: "0",
      weight: 25,
      startDate: "2025-01-01",
      endDate: "2025-12-31",
      status: "in_progress",
      progress: 30,
    },
    {
      title: "Melhorar Satisfação do Cliente para 90%",
      description: "Implementar melhorias no atendimento e pós-venda para alcançar 90% de satisfação do cliente (NPS).",
      category: "behavioral",
      measurementUnit: "%",
      targetValue: "90",
      currentValue: "75",
      weight: 20,
      startDate: "2025-01-01",
      endDate: "2025-12-31",
      status: "in_progress",
      progress: 50,
    },
    {
      title: "Expandir Presença Digital",
      description: "Aumentar seguidores nas redes sociais em 50% e melhorar engajamento online.",
      category: "corporate",
      measurementUnit: "%",
      targetValue: "50",
      currentValue: "10",
      weight: 15,
      startDate: "2025-01-01",
      endDate: "2025-12-31",
      status: "approved",
      progress: 20,
    },
    {
      title: "Capacitar 100% dos Colaboradores",
      description: "Oferecer pelo menos 40 horas de treinamento para todos os colaboradores durante o ano.",
      category: "development",
      measurementUnit: "%",
      targetValue: "100",
      currentValue: "25",
      weight: 20,
      startDate: "2025-01-01",
      endDate: "2025-12-31",
      status: "in_progress",
      progress: 25,
    },
    {
      title: "Reduzir Turnover para Menos de 10%",
      description: "Implementar programas de retenção e engajamento para reduzir a taxa de turnover para menos de 10% ao ano.",
      category: "behavioral",
      measurementUnit: "%",
      targetValue: "10",
      currentValue: "18",
      weight: 15,
      startDate: "2025-01-01",
      endDate: "2025-12-31",
      status: "in_progress",
      progress: 40,
    },
    {
      title: "Lançar 3 Novos Produtos",
      description: "Desenvolver e lançar 3 novos produtos inovadores no mercado até o final do ano.",
      category: "corporate",
      measurementUnit: "unidades",
      targetValue: "3",
      currentValue: "1",
      weight: 25,
      startDate: "2025-01-01",
      endDate: "2025-12-31",
      status: "in_progress",
      progress: 33,
    },
    {
      title: "Certificação ISO 9001",
      description: "Obter certificação ISO 9001 para processos de qualidade até o final do ano.",
      category: "corporate",
      measurementUnit: "sim/não",
      targetValue: "1",
      currentValue: "0",
      weight: 20,
      startDate: "2025-01-01",
      endDate: "2025-12-31",
      status: "approved",
      progress: 60,
    },
  ];
  
  console.log(`📝 Inserindo ${corporateGoals.length} metas corporativas...\n`);
  
  for (const goal of corporateGoals) {
    const sql = `
      INSERT INTO smartGoals (
        employeeId, cycleId, title, description, type, goalType, category,
        isSpecific, isMeasurable, isAchievable, isRelevant, isTimeBound,
        measurementUnit, targetValue, currentValue, weight,
        startDate, endDate, status, progress, createdBy, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    await connection.execute(sql, [
      employeeId,
      cycleId,
      goal.title,
      goal.description,
      "organizational", // type
      "corporate", // goalType
      goal.category,
      true, // isSpecific
      true, // isMeasurable
      true, // isAchievable
      true, // isRelevant
      true, // isTimeBound
      goal.measurementUnit,
      goal.targetValue,
      goal.currentValue,
      goal.weight,
      goal.startDate,
      goal.endDate,
      goal.status,
      goal.progress,
      employeeId, // createdBy
    ]);
    
    console.log(`✅ ${goal.title} (${goal.status}, ${goal.progress}%)`);
  }
  
  console.log(`\n🎉 ${corporateGoals.length} metas corporativas criadas com sucesso!`);
  
  await connection.end();
  process.exit(0);
} catch (error) {
  console.error("❌ Erro ao criar metas corporativas:", error);
  process.exit(1);
}
