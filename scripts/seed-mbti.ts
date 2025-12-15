import { drizzle } from "drizzle-orm/mysql2";
import { testQuestions } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

const questions = [
  // Dimensão: Extroversão (E) vs Introversão (I)
  { code: "MBTI_EI_01", question: "Você se sente energizado após passar tempo com muitas pessoas", dimension: "E/I", type: "mbti" as const },
  { code: "MBTI_EI_02", question: "Prefere atividades sociais em grupo a atividades solitárias", dimension: "E/I", type: "mbti" as const },
  { code: "MBTI_EI_03", question: "Gosta de ser o centro das atenções", dimension: "E/I", type: "mbti" as const },
  { code: "MBTI_EI_04", question: "Precisa de tempo sozinho para recarregar as energias", dimension: "E/I", type: "mbti" as const, reverse: true },
  { code: "MBTI_EI_05", question: "Prefere conversar sobre ideias com outras pessoas do que refletir sozinho", dimension: "E/I", type: "mbti" as const },
  
  // Dimensão: Sensação (S) vs Intuição (N)
  { code: "MBTI_SN_01", question: "Prefere focar em fatos e detalhes concretos", dimension: "S/N", type: "mbti" as const },
  { code: "MBTI_SN_02", question: "Gosta de explorar possibilidades e significados abstratos", dimension: "S/N", type: "mbti" as const, reverse: true },
  { code: "MBTI_SN_03", question: "Confia mais em experiências práticas do que em teorias", dimension: "S/N", type: "mbti" as const },
  { code: "MBTI_SN_04", question: "Prefere seguir métodos comprovados a experimentar novas abordagens", dimension: "S/N", type: "mbti" as const },
  { code: "MBTI_SN_05", question: "Gosta de imaginar futuros possíveis e cenários hipotéticos", dimension: "S/N", type: "mbti" as const, reverse: true },
  
  // Dimensão: Pensamento (T) vs Sentimento (F)
  { code: "MBTI_TF_01", question: "Toma decisões baseadas principalmente em lógica e análise objetiva", dimension: "T/F", type: "mbti" as const },
  { code: "MBTI_TF_02", question: "Considera os sentimentos das pessoas ao tomar decisões", dimension: "T/F", type: "mbti" as const, reverse: true },
  { code: "MBTI_TF_03", question: "Prefere ser direto e honesto, mesmo que possa magoar alguém", dimension: "T/F", type: "mbti" as const },
  { code: "MBTI_TF_04", question: "Valoriza harmonia e evita conflitos", dimension: "T/F", type: "mbti" as const, reverse: true },
  { code: "MBTI_TF_05", question: "Acredita que a verdade é mais importante que a diplomacia", dimension: "T/F", type: "mbti" as const },
  
  // Dimensão: Julgamento (J) vs Percepção (P)
  { code: "MBTI_JP_01", question: "Prefere ter planos definidos e seguir cronogramas", dimension: "J/P", type: "mbti" as const },
  { code: "MBTI_JP_02", question: "Gosta de manter opções em aberto e ser espontâneo", dimension: "J/P", type: "mbti" as const, reverse: true },
  { code: "MBTI_JP_03", question: "Sente-se confortável com estrutura e organização", dimension: "J/P", type: "mbti" as const },
  { code: "MBTI_JP_04", question: "Prefere flexibilidade e adaptação a regras rígidas", dimension: "J/P", type: "mbti" as const, reverse: true },
  { code: "MBTI_JP_05", question: "Gosta de concluir tarefas antes dos prazos", dimension: "J/P", type: "mbti" as const },
];

async function seed() {
  console.log("Populando perguntas MBTI...");
  
  for (const q of questions) {
    try {
      await db.insert(testQuestions).values({
        testType: q.type,
        questionNumber: parseInt(q.code.split('_').pop() || '0'),
        questionText: q.question,
        dimension: q.dimension,
        reverse: q.reverse || false,
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
  
  console.log("\n✅ Seed MBTI concluído!");
  process.exit(0);
}

seed();
