import { drizzle } from "drizzle-orm/mysql2";
import { badges } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

const defaultBadges = [
  {
    name: "Primeira Meta Concluída",
    description: "Concluiu sua primeira meta com 100% de progresso",
    icon: "Target",
    category: "metas" as const,
    points: 50,
    condition: JSON.stringify({ type: "goal_completed", count: 1 }),
  },
  {
    name: "Mestre das Metas",
    description: "Concluiu 10 metas com 100% de progresso",
    icon: "Trophy",
    category: "metas" as const,
    points: 200,
    condition: JSON.stringify({ type: "goal_completed", count: 10 }),
  },
  {
    name: "PDI Iniciado",
    description: "Criou seu primeiro Plano de Desenvolvimento Individual",
    icon: "Lightbulb",
    category: "pdi" as const,
    points: 30,
    condition: JSON.stringify({ type: "pdi_created", count: 1 }),
  },
  {
    name: "PDI Concluído",
    description: "Finalizou um Plano de Desenvolvimento Individual completo",
    icon: "GraduationCap",
    category: "pdi" as const,
    points: 100,
    condition: JSON.stringify({ type: "pdi_completed", count: 1 }),
  },
  {
    name: "Avaliação 360° Completa",
    description: "Completou uma avaliação 360° com todos os avaliadores",
    icon: "Users",
    category: "avaliacao" as const,
    points: 75,
    condition: JSON.stringify({ type: "evaluation_360_completed", count: 1 }),
  },
  {
    name: "Feedback Ativo",
    description: "Recebeu 5 feedbacks de gestores",
    icon: "MessageSquare",
    category: "feedback" as const,
    points: 40,
    condition: JSON.stringify({ type: "feedback_received", count: 5 }),
  },
  {
    name: "Mentor",
    description: "Forneceu 10 feedbacks para outros colaboradores",
    icon: "Heart",
    category: "feedback" as const,
    points: 60,
    condition: JSON.stringify({ type: "feedback_given", count: 10 }),
  },
  {
    name: "Estrela em Ascensão",
    description: "Atingiu pontuação acima de 4.5 em avaliação de performance",
    icon: "Star",
    category: "avaliacao" as const,
    points: 150,
    condition: JSON.stringify({ type: "performance_rating", min: 4.5 }),
  },
  {
    name: "Nine Box - Alto Potencial",
    description: "Classificado como Alto Potencial na matriz Nine Box",
    icon: "TrendingUp",
    category: "avaliacao" as const,
    points: 200,
    condition: JSON.stringify({ type: "ninebox_category", categories: ["high_potential", "star", "future_leader"] }),
  },
  {
    name: "Explorador do Conhecimento",
    description: "Completou todos os testes psicométricos disponíveis",
    icon: "Brain",
    category: "geral" as const,
    points: 80,
    condition: JSON.stringify({ type: "psychometric_tests_completed", count: 5 }),
  },
];

async function seed() {
  console.log("🌱 Populando badges padrão...");
  
  for (const badge of defaultBadges) {
    await db.insert(badges).values(badge);
    console.log(`✅ Badge criado: ${badge.name}`);
  }
  
  console.log("✅ Badges populados com sucesso!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Erro ao popular badges:", error);
  process.exit(1);
});
