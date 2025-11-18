import { drizzle } from "drizzle-orm/mysql2";
import { testQuestions } from "../drizzle/schema";

/**
 * Script para popular 50 perguntas do teste Big Five
 * Modelo: OCEAN (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism)
 */

const db = drizzle(process.env.DATABASE_URL!);

const bigFiveQuestions = [
  // Openness (Abertura para experiências) - 10 perguntas
  { testType: "bigfive" as const, questionNumber: 1, dimension: "O", questionText: "Eu tenho uma imaginação fértil e criativa", reverse: false },
  { testType: "bigfive" as const, questionNumber: 2, dimension: "O", questionText: "Eu gosto de explorar novas ideias e conceitos", reverse: false },
  { testType: "bigfive" as const, questionNumber: 3, dimension: "O", questionText: "Eu prefiro rotinas e não gosto de mudanças", reverse: true },
  { testType: "bigfive" as const, questionNumber: 4, dimension: "O", questionText: "Eu aprecio arte, música e literatura", reverse: false },
  { testType: "bigfive" as const, questionNumber: 5, dimension: "O", questionText: "Eu sou curioso sobre diferentes culturas e lugares", reverse: false },
  { testType: "bigfive" as const, questionNumber: 6, dimension: "O", questionText: "Eu tenho dificuldade em entender conceitos abstratos", reverse: true },
  { testType: "bigfive" as const, questionNumber: 7, dimension: "O", questionText: "Eu gosto de experimentar coisas novas", reverse: false },
  { testType: "bigfive" as const, questionNumber: 8, dimension: "O", questionText: "Eu sou uma pessoa convencional e tradicional", reverse: true },
  { testType: "bigfive" as const, questionNumber: 9, dimension: "O", questionText: "Eu tenho uma mente aberta para novas perspectivas", reverse: false },
  { testType: "bigfive" as const, questionNumber: 10, dimension: "O", questionText: "Eu prefiro o prático ao teórico", reverse: true },

  // Conscientiousness (Conscienciosidade) - 10 perguntas
  { testType: "bigfive" as const, questionNumber: 11, dimension: "C", questionText: "Eu sou organizado e mantenho as coisas arrumadas", reverse: false },
  { testType: "bigfive" as const, questionNumber: 12, dimension: "C", questionText: "Eu planejo com antecedência e sigo meus planos", reverse: false },
  { testType: "bigfive" as const, questionNumber: 13, dimension: "C", questionText: "Eu frequentemente deixo tarefas inacabadas", reverse: true },
  { testType: "bigfive" as const, questionNumber: 14, dimension: "C", questionText: "Eu sou pontual e cumpro prazos", reverse: false },
  { testType: "bigfive" as const, questionNumber: 15, dimension: "C", questionText: "Eu presto atenção aos detalhes", reverse: false },
  { testType: "bigfive" as const, questionNumber: 16, dimension: "C", questionText: "Eu sou descuidado e cometo erros por falta de atenção", reverse: true },
  { testType: "bigfive" as const, questionNumber: 17, dimension: "C", questionText: "Eu me esforço para alcançar a excelência", reverse: false },
  { testType: "bigfive" as const, questionNumber: 18, dimension: "C", questionText: "Eu procrastino e adio tarefas importantes", reverse: true },
  { testType: "bigfive" as const, questionNumber: 19, dimension: "C", questionText: "Eu sou disciplinado e autocontrolado", reverse: false },
  { testType: "bigfive" as const, questionNumber: 20, dimension: "C", questionText: "Eu sou impulsivo e ajo sem pensar", reverse: true },

  // Extraversion (Extroversão) - 10 perguntas
  { testType: "bigfive" as const, questionNumber: 21, dimension: "E", questionText: "Eu sou o centro das atenções em festas", reverse: false },
  { testType: "bigfive" as const, questionNumber: 22, dimension: "E", questionText: "Eu me sinto energizado quando estou com outras pessoas", reverse: false },
  { testType: "bigfive" as const, questionNumber: 23, dimension: "E", questionText: "Eu prefiro ficar em casa a sair com amigos", reverse: true },
  { testType: "bigfive" as const, questionNumber: 24, dimension: "E", questionText: "Eu inicio conversas com estranhos facilmente", reverse: false },
  { testType: "bigfive" as const, questionNumber: 25, dimension: "E", questionText: "Eu gosto de estar em ambientes animados e movimentados", reverse: false },
  { testType: "bigfive" as const, questionNumber: 26, dimension: "E", questionText: "Eu sou quieto e reservado em grupos", reverse: true },
  { testType: "bigfive" as const, questionNumber: 27, dimension: "E", questionText: "Eu gosto de conhecer novas pessoas", reverse: false },
  { testType: "bigfive" as const, questionNumber: 28, dimension: "E", questionText: "Eu me sinto desconfortável sendo o centro das atenções", reverse: true },
  { testType: "bigfive" as const, questionNumber: 29, dimension: "E", questionText: "Eu sou assertivo e tomo a liderança", reverse: false },
  { testType: "bigfive" as const, questionNumber: 30, dimension: "E", questionText: "Eu preciso de muito tempo sozinho para recarregar", reverse: true },

  // Agreeableness (Amabilidade) - 10 perguntas
  { testType: "bigfive" as const, questionNumber: 31, dimension: "A", questionText: "Eu sou empático e me preocupo com os sentimentos dos outros", reverse: false },
  { testType: "bigfive" as const, questionNumber: 32, dimension: "A", questionText: "Eu coopero e trabalho bem em equipe", reverse: false },
  { testType: "bigfive" as const, questionNumber: 33, dimension: "A", questionText: "Eu sou cético e desconfio das intenções das pessoas", reverse: true },
  { testType: "bigfive" as const, questionNumber: 34, dimension: "A", questionText: "Eu ajudo os outros sem esperar nada em troca", reverse: false },
  { testType: "bigfive" as const, questionNumber: 35, dimension: "A", questionText: "Eu sou gentil e educado com todos", reverse: false },
  { testType: "bigfive" as const, questionNumber: 36, dimension: "A", questionText: "Eu critico e julgo os outros facilmente", reverse: true },
  { testType: "bigfive" as const, questionNumber: 37, dimension: "A", questionText: "Eu perdoo facilmente e não guardo rancor", reverse: false },
  { testType: "bigfive" as const, questionNumber: 38, dimension: "A", questionText: "Eu coloco minhas necessidades acima das dos outros", reverse: true },
  { testType: "bigfive" as const, questionNumber: 39, dimension: "A", questionText: "Eu sou paciente e tolerante com as diferenças", reverse: false },
  { testType: "bigfive" as const, questionNumber: 40, dimension: "A", questionText: "Eu sou competitivo e gosto de vencer a qualquer custo", reverse: true },

  // Neuroticism (Neuroticismo/Estabilidade Emocional) - 10 perguntas
  { testType: "bigfive" as const, questionNumber: 41, dimension: "N", questionText: "Eu me preocupo muito com as coisas", reverse: false },
  { testType: "bigfive" as const, questionNumber: 42, dimension: "N", questionText: "Eu fico estressado facilmente", reverse: false },
  { testType: "bigfive" as const, questionNumber: 43, dimension: "N", questionText: "Eu sou calmo e raramente me sinto ansioso", reverse: true },
  { testType: "bigfive" as const, questionNumber: 44, dimension: "N", questionText: "Eu tenho mudanças de humor frequentes", reverse: false },
  { testType: "bigfive" as const, questionNumber: 45, dimension: "N", questionText: "Eu me sinto triste ou deprimido com frequência", reverse: false },
  { testType: "bigfive" as const, questionNumber: 46, dimension: "N", questionText: "Eu sou emocionalmente estável e equilibrado", reverse: true },
  { testType: "bigfive" as const, questionNumber: 47, dimension: "N", questionText: "Eu fico irritado facilmente", reverse: false },
  { testType: "bigfive" as const, questionNumber: 48, dimension: "N", questionText: "Eu lido bem com situações estressantes", reverse: true },
  { testType: "bigfive" as const, questionNumber: 49, dimension: "N", questionText: "Eu me sinto inseguro e tenho baixa autoestima", reverse: false },
  { testType: "bigfive" as const, questionNumber: 50, dimension: "N", questionText: "Eu sou confiante e raramente me sinto nervoso", reverse: true },
];

async function seedBigFive() {
  console.log("🌱 Populando perguntas Big Five...");

  try {
    // Inserir todas as 50 perguntas
    await db.insert(testQuestions).values(bigFiveQuestions);

    console.log("✅ 50 perguntas Big Five inseridas com sucesso!");
    console.log("   - Openness (O): 10 perguntas");
    console.log("   - Conscientiousness (C): 10 perguntas");
    console.log("   - Extraversion (E): 10 perguntas");
    console.log("   - Agreeableness (A): 10 perguntas");
    console.log("   - Neuroticism (N): 10 perguntas");
  } catch (error) {
    console.error("❌ Erro ao popular Big Five:", error);
    throw error;
  }
}

seedBigFive()
  .then(() => {
    console.log("✅ Script concluído!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erro fatal:", error);
    process.exit(1);
  });
