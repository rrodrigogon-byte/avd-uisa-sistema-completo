import { drizzle } from "drizzle-orm/mysql2";
import { testQuestions } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

const questions = [
  // Dimensão: Visual
  { code: "VARK_V_01", question: "Prefiro aprender através de diagramas, gráficos e imagens", dimension: "Visual", type: "vark" as const },
  { code: "VARK_V_02", question: "Lembro-me melhor de informações quando as vejo escritas ou ilustradas", dimension: "Visual", type: "vark" as const },
  { code: "VARK_V_03", question: "Gosto de usar cores e destacadores ao estudar", dimension: "Visual", type: "vark" as const },
  { code: "VARK_V_04", question: "Prefiro assistir a vídeos ou demonstrações visuais", dimension: "Visual", type: "vark" as const },
  { code: "VARK_V_05", question: "Organizo informações usando mapas mentais ou fluxogramas", dimension: "Visual", type: "vark" as const },
  
  // Dimensão: Auditivo
  { code: "VARK_A_01", question: "Aprendo melhor ouvindo explicações e discussões", dimension: "Auditivo", type: "vark" as const },
  { code: "VARK_A_02", question: "Gosto de participar de debates e conversas sobre o conteúdo", dimension: "Auditivo", type: "vark" as const },
  { code: "VARK_A_03", question: "Prefiro ouvir podcasts ou audiolivros a ler textos", dimension: "Auditivo", type: "vark" as const },
  { code: "VARK_A_04", question: "Lembro-me melhor de informações que ouvi", dimension: "Auditivo", type: "vark" as const },
  { code: "VARK_A_05", question: "Gosto de explicar conceitos em voz alta para fixar o aprendizado", dimension: "Auditivo", type: "vark" as const },
  
  // Dimensão: Leitura/Escrita
  { code: "VARK_R_01", question: "Prefiro ler textos e fazer anotações escritas", dimension: "Leitura/Escrita", type: "vark" as const },
  { code: "VARK_R_02", question: "Aprendo melhor lendo livros e artigos", dimension: "Leitura/Escrita", type: "vark" as const },
  { code: "VARK_R_03", question: "Gosto de fazer resumos e listas por escrito", dimension: "Leitura/Escrita", type: "vark" as const },
  { code: "VARK_R_04", question: "Prefiro instruções escritas a explicações verbais", dimension: "Leitura/Escrita", type: "vark" as const },
  { code: "VARK_R_05", question: "Reescrever informações me ajuda a memorizar", dimension: "Leitura/Escrita", type: "vark" as const },
  
  // Dimensão: Cinestésico
  { code: "VARK_K_01", question: "Aprendo melhor fazendo e praticando", dimension: "Cinestésico", type: "vark" as const },
  { code: "VARK_K_02", question: "Prefiro experiências práticas e hands-on", dimension: "Cinestésico", type: "vark" as const },
  { code: "VARK_K_03", question: "Gosto de usar exemplos da vida real ao aprender", dimension: "Cinestésico", type: "vark" as const },
  { code: "VARK_K_04", question: "Preciso me movimentar ou fazer pausas ao estudar", dimension: "Cinestésico", type: "vark" as const },
  { code: "VARK_K_05", question: "Aprendo melhor através de simulações e role-playing", dimension: "Cinestésico", type: "vark" as const },
];

async function seed() {
  console.log("Populando perguntas de Estilos de Aprendizagem (VARK)...");
  
  for (const q of questions) {
    try {
      await db.insert(testQuestions).values({
        testType: q.type,
        questionNumber: parseInt(q.code.split('_').pop() || '0'),
        questionText: q.question,
        dimension: q.dimension,
        reverse: false,
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
  
  console.log("\n✅ Seed VARK concluído!");
  process.exit(0);
}

seed();
