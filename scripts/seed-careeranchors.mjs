import { drizzle } from "drizzle-orm/mysql2";
import { testQuestions } from "../drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

/**
 * Teste de Âncoras de Carreira (Edgar Schein)
 * 
 * 8 âncoras de carreira que representam valores e motivações profissionais:
 * 1. Competência Técnica/Funcional
 * 2. Competência Gerencial
 * 3. Autonomia/Independência
 * 4. Segurança/Estabilidade
 * 5. Criatividade Empreendedora
 * 6. Serviço/Dedicação a uma Causa
 * 7. Desafio Puro
 * 8. Estilo de Vida
 * 
 * 40 perguntas (5 por âncora)
 */

const careerAnchorsQuestions = [
  // COMPETÊNCIA TÉCNICA/FUNCIONAL (5 perguntas)
  {
    testType: "careeranchors",
    questionNumber: 1,
    questionText: "Sinto-me mais realizado(a) quando posso aprofundar minha expertise técnica",
    dimension: "competencia_tecnica",
    reverse: false,
  },
  {
    testType: "careeranchors",
    questionNumber: 2,
    questionText: "Prefiro ser reconhecido(a) como especialista na minha área",
    dimension: "competencia_tecnica",
    reverse: false,
  },
  {
    testType: "careeranchors",
    questionNumber: 3,
    questionText: "Trabalhar em projetos técnicos complexos me motiva mais que gerenciar pessoas",
    dimension: "competencia_tecnica",
    reverse: false,
  },
  {
    testType: "careeranchors",
    questionNumber: 4,
    questionText: "Valorizo oportunidades de me tornar referência técnica na minha área",
    dimension: "competencia_tecnica",
    reverse: false,
  },
  {
    testType: "careeranchors",
    questionNumber: 5,
    questionText: "Prefiro cargos que me permitam aplicar e desenvolver habilidades técnicas",
    dimension: "competencia_tecnica",
    reverse: false,
  },

  // COMPETÊNCIA GERENCIAL (5 perguntas)
  {
    testType: "careeranchors",
    questionNumber: 6,
    questionText: "Aspiro a posições de liderança e gestão de equipes",
    dimension: "competencia_gerencial",
    reverse: false,
  },
  {
    testType: "careeranchors",
    questionNumber: 7,
    questionText: "Sinto-me realizado(a) quando consigo coordenar e integrar esforços de diferentes pessoas",
    dimension: "competencia_gerencial",
    reverse: false,
  },
  {
    testType: "careeranchors",
    questionNumber: 8,
    questionText: "Quero ser responsável por resultados organizacionais importantes",
    dimension: "competencia_gerencial",
    reverse: false,
  },
  {
    testType: "careeranchors",
    questionNumber: 9,
    questionText: "Prefiro cargos que envolvam tomada de decisões estratégicas",
    dimension: "competencia_gerencial",
    reverse: false,
  },
  {
    testType: "careeranchors",
    questionNumber: 10,
    questionText: "Valorizo oportunidades de influenciar a direção da organização",
    dimension: "competencia_gerencial",
    reverse: false,
  },

  // AUTONOMIA/INDEPENDÊNCIA (5 perguntas)
  {
    testType: "careeranchors",
    questionNumber: 11,
    questionText: "Preciso de liberdade para fazer meu trabalho do meu jeito",
    dimension: "autonomia",
    reverse: false,
  },
  {
    testType: "careeranchors",
    questionNumber: 12,
    questionText: "Sinto-me sufocado(a) por regras e procedimentos rígidos",
    dimension: "autonomia",
    reverse: false,
  },
  {
    testType: "careeranchors",
    questionNumber: 13,
    questionText: "Prefiro trabalhar de forma independente com mínima supervisão",
    dimension: "autonomia",
    reverse: false,
  },
  {
    testType: "careeranchors",
    questionNumber: 14,
    questionText: "Valorizo ambientes que me permitem definir meus próprios horários e métodos",
    dimension: "autonomia",
    reverse: false,
  },
  {
    testType: "careeranchors",
    questionNumber: 15,
    questionText: "Considero trabalhar como freelancer ou consultor(a) independente",
    dimension: "autonomia",
    reverse: false,
  },

  // SEGURANÇA/ESTABILIDADE (5 perguntas)
  {
    testType: "careeranchors",
    questionNumber: 16,
    questionText: "Valorizo estabilidade e previsibilidade na minha carreira",
    dimension: "seguranca",
    reverse: false,
  },
  {
    testType: "careeranchors",
    questionNumber: 17,
    questionText: "Prefiro organizações que oferecem segurança de longo prazo",
    dimension: "seguranca",
    reverse: false,
  },
  {
    testType: "careeranchors",
    questionNumber: 18,
    questionText: "Benefícios como plano de saúde e aposentadoria são muito importantes para mim",
    dimension: "seguranca",
    reverse: false,
  },
  {
    testType: "careeranchors",
    questionNumber: 19,
    questionText: "Evito mudanças frequentes de emprego",
    dimension: "seguranca",
    reverse: false,
  },
  {
    testType: "careeranchors",
    questionNumber: 20,
    questionText: "Prefiro um ambiente de trabalho estável e estruturado",
    dimension: "seguranca",
    reverse: false,
  },

  // CRIATIVIDADE EMPREENDEDORA (5 perguntas)
  {
    testType: "careeranchors",
    questionNumber: 21,
    questionText: "Tenho vontade de criar meu próprio negócio ou produto",
    dimension: "criatividade_empreendedora",
    reverse: false,
  },
  {
    testType: "careeranchors",
    questionNumber: 22,
    questionText: "Sinto-me motivado(a) por desafios de inovação e criação",
    dimension: "criatividade_empreendedora",
    reverse: false,
  },
  {
    testType: "careeranchors",
    questionNumber: 23,
    questionText: "Gosto de assumir riscos calculados em busca de oportunidades",
    dimension: "criatividade_empreendedora",
    reverse: false,
  },
  {
    testType: "careeranchors",
    questionNumber: 24,
    questionText: "Prefiro ambientes que incentivam a experimentação e a inovação",
    dimension: "criatividade_empreendedora",
    reverse: false,
  },
  {
    testType: "careeranchors",
    questionNumber: 25,
    questionText: "Valorizo a possibilidade de transformar ideias em realidade",
    dimension: "criatividade_empreendedora",
    reverse: false,
  },

  // SERVIÇO/DEDICAÇÃO A UMA CAUSA (5 perguntas)
  {
    testType: "careeranchors",
    questionNumber: 26,
    questionText: "Quero que meu trabalho faça diferença positiva no mundo",
    dimension: "servico",
    reverse: false,
  },
  {
    testType: "careeranchors",
    questionNumber: 27,
    questionText: "Valorizo trabalhar em causas que acredito serem importantes",
    dimension: "servico",
    reverse: false,
  },
  {
    testType: "careeranchors",
    questionNumber: 28,
    questionText: "Sinto-me realizado(a) quando ajudo outras pessoas",
    dimension: "servico",
    reverse: false,
  },
  {
    testType: "careeranchors",
    questionNumber: 29,
    questionText: "Prefiro organizações com propósito social ou ambiental claro",
    dimension: "servico",
    reverse: false,
  },
  {
    testType: "careeranchors",
    questionNumber: 30,
    questionText: "O impacto social do meu trabalho é mais importante que o salário",
    dimension: "servico",
    reverse: false,
  },

  // DESAFIO PURO (5 perguntas)
  {
    testType: "careeranchors",
    questionNumber: 31,
    questionText: "Sinto-me motivado(a) por problemas difíceis e complexos",
    dimension: "desafio",
    reverse: false,
  },
  {
    testType: "careeranchors",
    questionNumber: 32,
    questionText: "Busco constantemente novos desafios e obstáculos para superar",
    dimension: "desafio",
    reverse: false,
  },
  {
    testType: "careeranchors",
    questionNumber: 33,
    questionText: "Perco o interesse quando o trabalho se torna rotineiro",
    dimension: "desafio",
    reverse: false,
  },
  {
    testType: "careeranchors",
    questionNumber: 34,
    questionText: "Valorizo situações que testam meus limites e capacidades",
    dimension: "desafio",
    reverse: false,
  },
  {
    testType: "careeranchors",
    questionNumber: 35,
    questionText: "Prefiro projetos que parecem impossíveis à primeira vista",
    dimension: "desafio",
    reverse: false,
  },

  // ESTILO DE VIDA (5 perguntas)
  {
    testType: "careeranchors",
    questionNumber: 36,
    questionText: "Busco equilíbrio entre vida pessoal e profissional",
    dimension: "estilo_vida",
    reverse: false,
  },
  {
    testType: "careeranchors",
    questionNumber: 37,
    questionText: "Valorizo flexibilidade de horários e local de trabalho",
    dimension: "estilo_vida",
    reverse: false,
  },
  {
    testType: "careeranchors",
    questionNumber: 38,
    questionText: "Minha família e vida pessoal são prioridades sobre a carreira",
    dimension: "estilo_vida",
    reverse: false,
  },
  {
    testType: "careeranchors",
    questionNumber: 39,
    questionText: "Prefiro organizações que respeitam meu tempo pessoal",
    dimension: "estilo_vida",
    reverse: false,
  },
  {
    testType: "careeranchors",
    questionNumber: 40,
    questionText: "Recusaria uma promoção se comprometesse minha qualidade de vida",
    dimension: "estilo_vida",
    reverse: false,
  },
];

async function seed() {
  console.log("🌱 Populando perguntas de Âncoras de Carreira (Schein)...");

  for (const question of careerAnchorsQuestions) {
    await db.insert(testQuestions).values(question);
  }

  console.log(`✅ ${careerAnchorsQuestions.length} perguntas de Âncoras de Carreira inseridas!`);
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Erro ao popular perguntas:", error);
  process.exit(1);
});
