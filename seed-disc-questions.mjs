import { drizzle } from "drizzle-orm/mysql2";
import { testQuestions } from "./drizzle/schema.js";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

/**
 * Script para popular perguntas DISC com dimensões corretas
 * 
 * Dimensões DISC:
 * - D (Dominância): Assertivo, direto, orientado a resultados
 * - I (Influência): Sociável, persuasivo, entusiasta
 * - S (Estabilidade): Paciente, leal, colaborativo
 * - C (Conformidade): Analítico, preciso, sistemático
 */

const discQuestions = [
  // Dimensão D (Dominância) - 10 perguntas
  { dimension: "D", text: "Eu gosto de assumir o controle em situações desafiadoras", reverse: false },
  { dimension: "D", text: "Eu prefiro tomar decisões rápidas e agir imediatamente", reverse: false },
  { dimension: "D", text: "Eu me sinto confortável em situações competitivas", reverse: false },
  { dimension: "D", text: "Eu gosto de desafiar o status quo e buscar mudanças", reverse: false },
  { dimension: "D", text: "Eu prefiro liderar do que seguir", reverse: false },
  { dimension: "D", text: "Eu me sinto energizado por metas ambiciosas", reverse: false },
  { dimension: "D", text: "Eu sou direto ao expressar minhas opiniões", reverse: false },
  { dimension: "D", text: "Eu gosto de resolver problemas de forma independente", reverse: false },
  { dimension: "D", text: "Eu me sinto confortável tomando riscos calculados", reverse: false },
  { dimension: "D", text: "Eu prefiro resultados rápidos a processos lentos", reverse: false },

  // Dimensão I (Influência) - 10 perguntas
  { dimension: "I", text: "Eu gosto de conhecer novas pessoas e fazer amizades", reverse: false },
  { dimension: "I", text: "Eu me sinto energizado em ambientes sociais", reverse: false },
  { dimension: "I", text: "Eu gosto de persuadir e influenciar os outros", reverse: false },
  { dimension: "I", text: "Eu prefiro trabalhar em equipe do que sozinho", reverse: false },
  { dimension: "I", text: "Eu sou otimista e entusiasta na maioria das situações", reverse: false },
  { dimension: "I", text: "Eu gosto de expressar minhas ideias de forma criativa", reverse: false },
  { dimension: "I", text: "Eu me sinto confortável falando em público", reverse: false },
  { dimension: "I", text: "Eu gosto de celebrar conquistas com outras pessoas", reverse: false },
  { dimension: "I", text: "Eu prefiro ambientes dinâmicos e estimulantes", reverse: false },
  { dimension: "I", text: "Eu gosto de motivar e inspirar os outros", reverse: false },

  // Dimensão S (Estabilidade) - 10 perguntas
  { dimension: "S", text: "Eu prefiro rotinas e processos previsíveis", reverse: false },
  { dimension: "S", text: "Eu sou paciente e calmo em situações estressantes", reverse: false },
  { dimension: "S", text: "Eu gosto de ajudar e apoiar os outros", reverse: false },
  { dimension: "S", text: "Eu prefiro trabalhar em um ritmo constante e estável", reverse: false },
  { dimension: "S", text: "Eu valorizo harmonia e cooperação no trabalho", reverse: false },
  { dimension: "S", text: "Eu sou leal e comprometido com minha equipe", reverse: false },
  { dimension: "S", text: "Eu prefiro evitar conflitos e buscar consenso", reverse: false },
  { dimension: "S", text: "Eu gosto de construir relacionamentos de longo prazo", reverse: false },
  { dimension: "S", text: "Eu me sinto confortável seguindo procedimentos estabelecidos", reverse: false },
  { dimension: "S", text: "Eu prefiro mudanças graduais a mudanças abruptas", reverse: false },

  // Dimensão C (Conformidade) - 10 perguntas
  { dimension: "C", text: "Eu gosto de analisar dados e informações detalhadas", reverse: false },
  { dimension: "C", text: "Eu prefiro seguir regras e padrões estabelecidos", reverse: false },
  { dimension: "C", text: "Eu sou meticuloso e atento aos detalhes", reverse: false },
  { dimension: "C", text: "Eu gosto de planejar cuidadosamente antes de agir", reverse: false },
  { dimension: "C", text: "Eu valorizo precisão e qualidade no trabalho", reverse: false },
  { dimension: "C", text: "Eu prefiro trabalhar de forma sistemática e organizada", reverse: false },
  { dimension: "C", text: "Eu gosto de verificar e validar informações antes de decidir", reverse: false },
  { dimension: "C", text: "Eu me sinto confortável trabalhando com dados e números", reverse: false },
  { dimension: "C", text: "Eu prefiro evitar erros a trabalhar rapidamente", reverse: false },
  { dimension: "C", text: "Eu gosto de seguir procedimentos e protocolos", reverse: false },
];

async function seedDISCQuestions() {
  console.log("🔄 Limpando perguntas DISC antigas...");
  
  // Deletar perguntas DISC antigas
  await db.delete(testQuestions).where(eq(testQuestions.testType, "disc"));
  
  console.log("✅ Perguntas antigas removidas");
  console.log(`📝 Inserindo ${discQuestions.length} perguntas DISC...`);
  
  // Inserir novas perguntas
  for (const question of discQuestions) {
    await db.insert(testQuestions).values({
      testType: "disc",
      questionNumber: discQuestions.indexOf(question) + 1,
      dimension: question.dimension,
      questionText: question.text,
      reverse: question.reverse,
    });
  }
  
  console.log("✅ Perguntas DISC inseridas com sucesso!");
  console.log("\n📊 Resumo:");
  console.log(`- Dimensão D (Dominância): 10 perguntas`);
  console.log(`- Dimensão I (Influência): 10 perguntas`);
  console.log(`- Dimensão S (Estabilidade): 10 perguntas`);
  console.log(`- Dimensão C (Conformidade): 10 perguntas`);
  console.log(`- Total: ${discQuestions.length} perguntas`);
  
  process.exit(0);
}

seedDISCQuestions().catch((error) => {
  console.error("❌ Erro ao popular perguntas DISC:", error);
  process.exit(1);
});
