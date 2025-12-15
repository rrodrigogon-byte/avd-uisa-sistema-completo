import { drizzle } from "drizzle-orm/mysql2";
import { testQuestions } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

const questions = [
  // Dimensão: Autoconsciência
  { code: "IE_AUTO_01", question: "Reconheço facilmente minhas emoções quando elas surgem", dimension: "Autoconsciência", type: "ie" as const },
  { code: "IE_AUTO_02", question: "Entendo como minhas emoções afetam meu desempenho", dimension: "Autoconsciência", type: "ie" as const },
  { code: "IE_AUTO_03", question: "Conheço bem meus pontos fortes e limitações", dimension: "Autoconsciência", type: "ie" as const },
  { code: "IE_AUTO_04", question: "Tenho clareza sobre meus valores e objetivos", dimension: "Autoconsciência", type: "ie" as const },
  { code: "IE_AUTO_05", question: "Sei o que me motiva e o que me desmotiva", dimension: "Autoconsciência", type: "ie" as const },
  
  // Dimensão: Autorregulação
  { code: "IE_AUTO_REG_01", question: "Consigo manter a calma em situações estressantes", dimension: "Autorregulação", type: "ie" as const },
  { code: "IE_AUTO_REG_02", question: "Controlo bem meus impulsos e reações emocionais", dimension: "Autorregulação", type: "ie" as const },
  { code: "IE_AUTO_REG_03", question: "Adapto-me facilmente a mudanças e imprevistos", dimension: "Autorregulação", type: "ie" as const },
  { code: "IE_AUTO_REG_04", question: "Mantenho integridade e assumo responsabilidade por minhas ações", dimension: "Autorregulação", type: "ie" as const },
  { code: "IE_AUTO_REG_05", question: "Consigo me recuperar rapidamente de contratempos", dimension: "Autorregulação", type: "ie" as const },
  
  // Dimensão: Motivação
  { code: "IE_MOT_01", question: "Busco constantemente melhorar e atingir padrões de excelência", dimension: "Motivação", type: "ie" as const },
  { code: "IE_MOT_02", question: "Mantenho-me motivado mesmo diante de obstáculos", dimension: "Motivação", type: "ie" as const },
  { code: "IE_MOT_03", question: "Alinhos meus objetivos pessoais com os da organização", dimension: "Motivação", type: "ie" as const },
  { code: "IE_MOT_04", question: "Tomo iniciativa e aproveito oportunidades", dimension: "Motivação", type: "ie" as const },
  { code: "IE_MOT_05", question: "Persisto em meus objetivos apesar das dificuldades", dimension: "Motivação", type: "ie" as const },
  
  // Dimensão: Empatia
  { code: "IE_EMP_01", question: "Percebo e compreendo as emoções dos outros", dimension: "Empatia", type: "ie" as const },
  { code: "IE_EMP_02", question: "Mostro interesse genuíno pelas preocupações dos outros", dimension: "Empatia", type: "ie" as const },
  { code: "IE_EMP_03", question: "Ajudo no desenvolvimento de outras pessoas", dimension: "Empatia", type: "ie" as const },
  { code: "IE_EMP_04", question: "Reconheço e valorizo a diversidade de perspectivas", dimension: "Empatia", type: "ie" as const },
  { code: "IE_EMP_05", question: "Entendo as dinâmicas políticas e sociais da organização", dimension: "Empatia", type: "ie" as const },
  
  // Dimensão: Habilidades Sociais
  { code: "IE_SOC_01", question: "Comunico-me de forma clara e persuasiva", dimension: "Habilidades Sociais", type: "ie" as const },
  { code: "IE_SOC_02", question: "Inspiro e influencio positivamente os outros", dimension: "Habilidades Sociais", type: "ie" as const },
  { code: "IE_SOC_03", question: "Gerencio bem conflitos e negocio soluções", dimension: "Habilidades Sociais", type: "ie" as const },
  { code: "IE_SOC_04", question: "Construo e mantenho relacionamentos produtivos", dimension: "Habilidades Sociais", type: "ie" as const },
  { code: "IE_SOC_05", question: "Trabalho bem em equipe e promovo colaboração", dimension: "Habilidades Sociais", type: "ie" as const },
];

async function seed() {
  console.log("Populando perguntas de Inteligência Emocional...");
  
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
  
  console.log("\n✅ Seed IE concluído!");
  process.exit(0);
}

seed();
