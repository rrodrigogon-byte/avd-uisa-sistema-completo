import { drizzle } from "drizzle-orm/mysql2";
import { evaluationQuestions } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

const questions = [
  // Categoria: Liderança
  { code: "LID001", question: "Demonstra capacidade de inspirar e motivar a equipe", category: "Liderança", type: "escala" as const },
  { code: "LID002", question: "Toma decisões de forma assertiva e no momento adequado", category: "Liderança", type: "escala" as const },
  { code: "LID003", question: "Delega tarefas de forma eficaz e acompanha resultados", category: "Liderança", type: "escala" as const },
  { code: "LID004", question: "Desenvolve e capacita membros da equipe", category: "Liderança", type: "escala" as const },
  
  // Categoria: Comunicação
  { code: "COM001", question: "Comunica-se de forma clara e objetiva", category: "Comunicação", type: "escala" as const },
  { code: "COM002", question: "Ouve ativamente e demonstra empatia", category: "Comunicação", type: "escala" as const },
  { code: "COM003", question: "Fornece feedback construtivo e oportuno", category: "Comunicação", type: "escala" as const },
  { code: "COM004", question: "Mantém comunicação transparente com a equipe", category: "Comunicação", type: "escala" as const },
  
  // Categoria: Trabalho em Equipe
  { code: "TEQ001", question: "Colabora ativamente com colegas de trabalho", category: "Trabalho em Equipe", type: "escala" as const },
  { code: "TEQ002", question: "Compartilha conhecimento e apoia outros membros", category: "Trabalho em Equipe", type: "escala" as const },
  { code: "TEQ003", question: "Resolve conflitos de forma construtiva", category: "Trabalho em Equipe", type: "escala" as const },
  { code: "TEQ004", question: "Contribui para um ambiente de trabalho positivo", category: "Trabalho em Equipe", type: "escala" as const },
  
  // Categoria: Resultados
  { code: "RES001", question: "Entrega resultados dentro dos prazos estabelecidos", category: "Resultados", type: "escala" as const },
  { code: "RES002", question: "Mantém alto padrão de qualidade no trabalho", category: "Resultados", type: "escala" as const },
  { code: "RES003", question: "Busca continuamente melhorias e inovação", category: "Resultados", type: "escala" as const },
  { code: "RES004", question: "Assume responsabilidade pelos resultados", category: "Resultados", type: "escala" as const },
  
  // Categoria: Desenvolvimento
  { code: "DES001", question: "Busca oportunidades de aprendizado e crescimento", category: "Desenvolvimento", type: "escala" as const },
  { code: "DES002", question: "Adapta-se bem a mudanças e novos desafios", category: "Desenvolvimento", type: "escala" as const },
  { code: "DES003", question: "Demonstra iniciativa e proatividade", category: "Desenvolvimento", type: "escala" as const },
  { code: "DES004", question: "Aplica novos conhecimentos no dia a dia", category: "Desenvolvimento", type: "escala" as const },
  
  // Perguntas abertas
  { code: "OPEN001", question: "Quais são os principais pontos fortes desta pessoa?", category: "Feedback Aberto", type: "texto" as const },
  { code: "OPEN002", question: "Quais áreas você recomenda para desenvolvimento?", category: "Feedback Aberto", type: "texto" as const },
  { code: "OPEN003", question: "Comentários adicionais ou sugestões", category: "Feedback Aberto", type: "texto" as const },
];

async function seed() {
  console.log("Populando perguntas de avaliação 360°...");
  
  for (const q of questions) {
    try {
      await db.insert(evaluationQuestions).values({
        code: q.code,
        question: q.question,
        category: q.category,
        type: q.type,
        weight: 1,
        active: true,
      });
      console.log(`✓ ${q.code}: ${q.question.substring(0, 50)}...`);
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log(`⊘ ${q.code} já existe`);
      } else {
        console.error(`✗ Erro ao inserir ${q.code}:`, error.message);
      }
    }
  }
  
  console.log("\n✅ Seed concluído!");
  process.exit(0);
}

seed();
