import { drizzle } from "drizzle-orm/mysql2";
import { testQuestions } from "../drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

/**
 * Teste de Estilos de Liderança
 * 
 * Baseado em teorias de liderança (Lewin, Bass, Goleman)
 * 6 estilos principais: Autocrático, Democrático, Transformacional, Transacional, Coaching, Laissez-faire
 * 30 perguntas (5 por estilo)
 */

const leadershipQuestions = [
  // AUTOCRÁTICO (5 perguntas)
  {
    testType: "leadership",
    questionNumber: 1,
    questionText: "Prefiro tomar decisões sozinho(a) sem consultar minha equipe",
    dimension: "autocratico",
    reverse: false,
  },
  {
    testType: "leadership",
    questionNumber: 2,
    questionText: "Acredito que a melhor forma de liderar é através de controle e supervisão constante",
    dimension: "autocratico",
    reverse: false,
  },
  {
    testType: "leadership",
    questionNumber: 3,
    questionText: "Estabeleço regras claras e espero que sejam seguidas sem questionamento",
    dimension: "autocratico",
    reverse: false,
  },
  {
    testType: "leadership",
    questionNumber: 4,
    questionText: "Prefiro centralizar as decisões importantes em mim",
    dimension: "autocratico",
    reverse: false,
  },
  {
    testType: "leadership",
    questionNumber: 5,
    questionText: "Acredito que a eficiência vem de uma hierarquia clara e rígida",
    dimension: "autocratico",
    reverse: false,
  },

  // DEMOCRÁTICO (5 perguntas)
  {
    testType: "leadership",
    questionNumber: 6,
    questionText: "Valorizo a participação da equipe nas decisões importantes",
    dimension: "democratico",
    reverse: false,
  },
  {
    testType: "leadership",
    questionNumber: 7,
    questionText: "Busco consenso antes de tomar decisões críticas",
    dimension: "democratico",
    reverse: false,
  },
  {
    testType: "leadership",
    questionNumber: 8,
    questionText: "Encorajo minha equipe a expressar opiniões e sugestões",
    dimension: "democratico",
    reverse: false,
  },
  {
    testType: "leadership",
    questionNumber: 9,
    questionText: "Acredito que as melhores soluções vêm da colaboração",
    dimension: "democratico",
    reverse: false,
  },
  {
    testType: "leadership",
    questionNumber: 10,
    questionText: "Prefiro liderar através do diálogo e da construção coletiva",
    dimension: "democratico",
    reverse: false,
  },

  // TRANSFORMACIONAL (5 perguntas)
  {
    testType: "leadership",
    questionNumber: 11,
    questionText: "Inspiro minha equipe a ir além das expectativas",
    dimension: "transformacional",
    reverse: false,
  },
  {
    testType: "leadership",
    questionNumber: 12,
    questionText: "Foco em desenvolver o potencial de cada membro da equipe",
    dimension: "transformacional",
    reverse: false,
  },
  {
    testType: "leadership",
    questionNumber: 13,
    questionText: "Comunico uma visão clara e inspiradora do futuro",
    dimension: "transformacional",
    reverse: false,
  },
  {
    testType: "leadership",
    questionNumber: 14,
    questionText: "Encorajo a inovação e a criatividade na equipe",
    dimension: "transformacional",
    reverse: false,
  },
  {
    testType: "leadership",
    questionNumber: 15,
    questionText: "Atuo como mentor e modelo para minha equipe",
    dimension: "transformacional",
    reverse: false,
  },

  // TRANSACIONAL (5 perguntas)
  {
    testType: "leadership",
    questionNumber: 16,
    questionText: "Estabeleço metas claras e recompenso quem as atinge",
    dimension: "transacional",
    reverse: false,
  },
  {
    testType: "leadership",
    questionNumber: 17,
    questionText: "Foco em monitorar o desempenho e corrigir desvios",
    dimension: "transacional",
    reverse: false,
  },
  {
    testType: "leadership",
    questionNumber: 18,
    questionText: "Uso incentivos e recompensas para motivar a equipe",
    dimension: "transacional",
    reverse: false,
  },
  {
    testType: "leadership",
    questionNumber: 19,
    questionText: "Aplico consequências quando as expectativas não são atendidas",
    dimension: "transacional",
    reverse: false,
  },
  {
    testType: "leadership",
    questionNumber: 20,
    questionText: "Acredito em uma relação de troca: esforço por recompensa",
    dimension: "transacional",
    reverse: false,
  },

  // COACHING (5 perguntas)
  {
    testType: "leadership",
    questionNumber: 21,
    questionText: "Dedico tempo para desenvolver as habilidades individuais de cada pessoa",
    dimension: "coaching",
    reverse: false,
  },
  {
    testType: "leadership",
    questionNumber: 22,
    questionText: "Faço perguntas que ajudam as pessoas a encontrar suas próprias soluções",
    dimension: "coaching",
    reverse: false,
  },
  {
    testType: "leadership",
    questionNumber: 23,
    questionText: "Foco no crescimento de longo prazo da equipe",
    dimension: "coaching",
    reverse: false,
  },
  {
    testType: "leadership",
    questionNumber: 24,
    questionText: "Dou feedback construtivo e específico regularmente",
    dimension: "coaching",
    reverse: false,
  },
  {
    testType: "leadership",
    questionNumber: 25,
    questionText: "Ajudo as pessoas a identificar e superar seus pontos fracos",
    dimension: "coaching",
    reverse: false,
  },

  // LAISSEZ-FAIRE (5 perguntas)
  {
    testType: "leadership",
    questionNumber: 26,
    questionText: "Dou total autonomia para a equipe tomar decisões",
    dimension: "laissez_faire",
    reverse: false,
  },
  {
    testType: "leadership",
    questionNumber: 27,
    questionText: "Intervenho apenas quando solicitado pela equipe",
    dimension: "laissez_faire",
    reverse: false,
  },
  {
    testType: "leadership",
    questionNumber: 28,
    questionText: "Confio que a equipe sabe o que fazer sem minha supervisão",
    dimension: "laissez_faire",
    reverse: false,
  },
  {
    testType: "leadership",
    questionNumber: 29,
    questionText: "Prefiro delegar responsabilidades e dar liberdade total",
    dimension: "laissez_faire",
    reverse: false,
  },
  {
    testType: "leadership",
    questionNumber: 30,
    questionText: "Acredito que a equipe trabalha melhor sem interferência constante",
    dimension: "laissez_faire",
    reverse: false,
  },
];

async function seed() {
  console.log("🌱 Populando perguntas de Estilos de Liderança...");

  for (const question of leadershipQuestions) {
    await db.insert(testQuestions).values(question);
  }

  console.log(`✅ ${leadershipQuestions.length} perguntas de Estilos de Liderança inseridas!`);
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Erro ao popular perguntas:", error);
  process.exit(1);
});
