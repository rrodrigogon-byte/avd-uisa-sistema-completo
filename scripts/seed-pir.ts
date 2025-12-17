/**
 * Seed para Teste PIR (Perfil de Interesses e Reações)
 * Sistema AVD UISA
 * 
 * O teste PIR avalia 6 dimensões:
 * - IP: Interesse em Pessoas
 * - ID: Interesse em Dados
 * - IC: Interesse em Coisas
 * - ES: Estabilidade
 * - FL: Flexibilidade
 * - AU: Autonomia
 * 
 * Cada dimensão possui 10 questões (total: 60 questões)
 * Escala Likert de 1 a 5 (Discordo Totalmente a Concordo Totalmente)
 */

import { getDb } from "../server/db";
import { testQuestions } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

const pirQuestions = [
  // ============================================================================
  // INTERESSE EM PESSOAS (IP) - 10 questões
  // ============================================================================
  {
    testType: "pir" as const,
    questionNumber: 1,
    questionText: "Gosto de trabalhar em equipe e colaborar com outras pessoas",
    dimension: "IP",
    reverse: false,
  },
  {
    testType: "pir" as const,
    questionNumber: 2,
    questionText: "Prefiro trabalhar sozinho(a) do que em grupo",
    dimension: "IP",
    reverse: true,
  },
  {
    testType: "pir" as const,
    questionNumber: 3,
    questionText: "Sinto-me energizado(a) ao interagir com diferentes pessoas",
    dimension: "IP",
    reverse: false,
  },
  {
    testType: "pir" as const,
    questionNumber: 4,
    questionText: "Tenho facilidade para entender as emoções dos outros",
    dimension: "IP",
    reverse: false,
  },
  {
    testType: "pir" as const,
    questionNumber: 5,
    questionText: "Evito situações que exigem muita interação social",
    dimension: "IP",
    reverse: true,
  },
  {
    testType: "pir" as const,
    questionNumber: 6,
    questionText: "Gosto de ensinar e desenvolver outras pessoas",
    dimension: "IP",
    reverse: false,
  },
  {
    testType: "pir" as const,
    questionNumber: 7,
    questionText: "Prefiro comunicação por e-mail do que pessoalmente",
    dimension: "IP",
    reverse: true,
  },
  {
    testType: "pir" as const,
    questionNumber: 8,
    questionText: "Sinto-me confortável em liderar grupos e equipes",
    dimension: "IP",
    reverse: false,
  },
  {
    testType: "pir" as const,
    questionNumber: 9,
    questionText: "Tenho dificuldade em trabalhar com pessoas muito diferentes de mim",
    dimension: "IP",
    reverse: true,
  },
  {
    testType: "pir" as const,
    questionNumber: 10,
    questionText: "Gosto de construir relacionamentos profissionais duradouros",
    dimension: "IP",
    reverse: false,
  },

  // ============================================================================
  // INTERESSE EM DADOS (ID) - 10 questões
  // ============================================================================
  {
    testType: "pir" as const,
    questionNumber: 11,
    questionText: "Gosto de analisar dados e informações detalhadas",
    dimension: "ID",
    reverse: false,
  },
  {
    testType: "pir" as const,
    questionNumber: 12,
    questionText: "Prefiro atividades práticas a análises teóricas",
    dimension: "ID",
    reverse: true,
  },
  {
    testType: "pir" as const,
    questionNumber: 13,
    questionText: "Tenho facilidade com números e estatísticas",
    dimension: "ID",
    reverse: false,
  },
  {
    testType: "pir" as const,
    questionNumber: 14,
    questionText: "Gosto de organizar e estruturar informações",
    dimension: "ID",
    reverse: false,
  },
  {
    testType: "pir" as const,
    questionNumber: 15,
    questionText: "Acho entediante trabalhar com planilhas e relatórios",
    dimension: "ID",
    reverse: true,
  },
  {
    testType: "pir" as const,
    questionNumber: 16,
    questionText: "Sinto-me confortável trabalhando com sistemas e tecnologia",
    dimension: "ID",
    reverse: false,
  },
  {
    testType: "pir" as const,
    questionNumber: 17,
    questionText: "Prefiro intuição a análise lógica na tomada de decisões",
    dimension: "ID",
    reverse: true,
  },
  {
    testType: "pir" as const,
    questionNumber: 18,
    questionText: "Gosto de identificar padrões e tendências em dados",
    dimension: "ID",
    reverse: false,
  },
  {
    testType: "pir" as const,
    questionNumber: 19,
    questionText: "Tenho dificuldade em manter atenção aos detalhes",
    dimension: "ID",
    reverse: true,
  },
  {
    testType: "pir" as const,
    questionNumber: 20,
    questionText: "Gosto de pesquisar e aprofundar conhecimentos técnicos",
    dimension: "ID",
    reverse: false,
  },

  // ============================================================================
  // INTERESSE EM COISAS (IC) - 10 questões
  // ============================================================================
  {
    testType: "pir" as const,
    questionNumber: 21,
    questionText: "Gosto de trabalhar com ferramentas e equipamentos",
    dimension: "IC",
    reverse: false,
  },
  {
    testType: "pir" as const,
    questionNumber: 22,
    questionText: "Prefiro trabalho intelectual a trabalho manual",
    dimension: "IC",
    reverse: true,
  },
  {
    testType: "pir" as const,
    questionNumber: 23,
    questionText: "Tenho habilidade para consertar e construir coisas",
    dimension: "IC",
    reverse: false,
  },
  {
    testType: "pir" as const,
    questionNumber: 24,
    questionText: "Gosto de atividades que geram resultados tangíveis e concretos",
    dimension: "IC",
    reverse: false,
  },
  {
    testType: "pir" as const,
    questionNumber: 25,
    questionText: "Evito atividades que exigem habilidades manuais",
    dimension: "IC",
    reverse: true,
  },
  {
    testType: "pir" as const,
    questionNumber: 26,
    questionText: "Sinto-me confortável operando máquinas e equipamentos",
    dimension: "IC",
    reverse: false,
  },
  {
    testType: "pir" as const,
    questionNumber: 27,
    questionText: "Prefiro planejamento a execução prática",
    dimension: "IC",
    reverse: true,
  },
  {
    testType: "pir" as const,
    questionNumber: 28,
    questionText: "Gosto de trabalhar ao ar livre e em ambientes físicos",
    dimension: "IC",
    reverse: false,
  },
  {
    testType: "pir" as const,
    questionNumber: 29,
    questionText: "Tenho dificuldade com tarefas que exigem coordenação motora",
    dimension: "IC",
    reverse: true,
  },
  {
    testType: "pir" as const,
    questionNumber: 30,
    questionText: "Gosto de projetos que envolvem construção ou montagem",
    dimension: "IC",
    reverse: false,
  },

  // ============================================================================
  // ESTABILIDADE (ES) - 10 questões
  // ============================================================================
  {
    testType: "pir" as const,
    questionNumber: 31,
    questionText: "Prefiro rotinas previsíveis a mudanças constantes",
    dimension: "ES",
    reverse: false,
  },
  {
    testType: "pir" as const,
    questionNumber: 32,
    questionText: "Gosto de enfrentar novos desafios frequentemente",
    dimension: "ES",
    reverse: true,
  },
  {
    testType: "pir" as const,
    questionNumber: 33,
    questionText: "Sinto-me mais confortável em ambientes estruturados",
    dimension: "ES",
    reverse: false,
  },
  {
    testType: "pir" as const,
    questionNumber: 34,
    questionText: "Valorizo segurança e estabilidade no trabalho",
    dimension: "ES",
    reverse: false,
  },
  {
    testType: "pir" as const,
    questionNumber: 35,
    questionText: "Fico ansioso(a) com mudanças inesperadas",
    dimension: "ES",
    reverse: false,
  },
  {
    testType: "pir" as const,
    questionNumber: 36,
    questionText: "Prefiro processos bem definidos a improvisação",
    dimension: "ES",
    reverse: false,
  },
  {
    testType: "pir" as const,
    questionNumber: 37,
    questionText: "Gosto de experimentar novas formas de fazer as coisas",
    dimension: "ES",
    reverse: true,
  },
  {
    testType: "pir" as const,
    questionNumber: 38,
    questionText: "Sinto-me mais produtivo(a) com horários fixos",
    dimension: "ES",
    reverse: false,
  },
  {
    testType: "pir" as const,
    questionNumber: 39,
    questionText: "Adapto-me facilmente a novas situações",
    dimension: "ES",
    reverse: true,
  },
  {
    testType: "pir" as const,
    questionNumber: 40,
    questionText: "Prefiro manter as coisas como estão a arriscar mudanças",
    dimension: "ES",
    reverse: false,
  },

  // ============================================================================
  // FLEXIBILIDADE (FL) - 10 questões
  // ============================================================================
  {
    testType: "pir" as const,
    questionNumber: 41,
    questionText: "Adapto-me facilmente a diferentes situações e ambientes",
    dimension: "FL",
    reverse: false,
  },
  {
    testType: "pir" as const,
    questionNumber: 42,
    questionText: "Tenho dificuldade em mudar meus planos quando necessário",
    dimension: "FL",
    reverse: true,
  },
  {
    testType: "pir" as const,
    questionNumber: 43,
    questionText: "Gosto de variedade e diversidade no trabalho",
    dimension: "FL",
    reverse: false,
  },
  {
    testType: "pir" as const,
    questionNumber: 44,
    questionText: "Consigo trabalhar bem sob pressão e prazos apertados",
    dimension: "FL",
    reverse: false,
  },
  {
    testType: "pir" as const,
    questionNumber: 45,
    questionText: "Prefiro seguir um plano rígido a improvisar",
    dimension: "FL",
    reverse: true,
  },
  {
    testType: "pir" as const,
    questionNumber: 46,
    questionText: "Sinto-me confortável com ambiguidade e incerteza",
    dimension: "FL",
    reverse: false,
  },
  {
    testType: "pir" as const,
    questionNumber: 47,
    questionText: "Fico desconfortável quando as regras não são claras",
    dimension: "FL",
    reverse: true,
  },
  {
    testType: "pir" as const,
    questionNumber: 48,
    questionText: "Gosto de assumir múltiplas responsabilidades simultaneamente",
    dimension: "FL",
    reverse: false,
  },
  {
    testType: "pir" as const,
    questionNumber: 49,
    questionText: "Tenho dificuldade em lidar com imprevistos",
    dimension: "FL",
    reverse: true,
  },
  {
    testType: "pir" as const,
    questionNumber: 50,
    questionText: "Consigo mudar de direção rapidamente quando necessário",
    dimension: "FL",
    reverse: false,
  },

  // ============================================================================
  // AUTONOMIA (AU) - 10 questões
  // ============================================================================
  {
    testType: "pir" as const,
    questionNumber: 51,
    questionText: "Prefiro trabalhar de forma independente",
    dimension: "AU",
    reverse: false,
  },
  {
    testType: "pir" as const,
    questionNumber: 52,
    questionText: "Gosto de receber orientações detalhadas sobre o que fazer",
    dimension: "AU",
    reverse: true,
  },
  {
    testType: "pir" as const,
    questionNumber: 53,
    questionText: "Sinto-me confortável tomando decisões sem consultar outros",
    dimension: "AU",
    reverse: false,
  },
  {
    testType: "pir" as const,
    questionNumber: 54,
    questionText: "Valorizo liberdade para definir meus próprios métodos de trabalho",
    dimension: "AU",
    reverse: false,
  },
  {
    testType: "pir" as const,
    questionNumber: 55,
    questionText: "Prefiro ter supervisão constante a trabalhar sozinho(a)",
    dimension: "AU",
    reverse: true,
  },
  {
    testType: "pir" as const,
    questionNumber: 56,
    questionText: "Gosto de assumir responsabilidade pelos meus resultados",
    dimension: "AU",
    reverse: false,
  },
  {
    testType: "pir" as const,
    questionNumber: 57,
    questionText: "Sinto-me inseguro(a) sem direcionamento claro",
    dimension: "AU",
    reverse: true,
  },
  {
    testType: "pir" as const,
    questionNumber: 58,
    questionText: "Prefiro definir meus próprios objetivos e metas",
    dimension: "AU",
    reverse: false,
  },
  {
    testType: "pir" as const,
    questionNumber: 59,
    questionText: "Gosto de ter controle sobre meu horário e agenda",
    dimension: "AU",
    reverse: false,
  },
  {
    testType: "pir" as const,
    questionNumber: 60,
    questionText: "Prefiro seguir instruções a criar minhas próprias soluções",
    dimension: "AU",
    reverse: true,
  },
];

async function seedPIRQuestions() {
  console.log("🌱 Iniciando seed de perguntas PIR...");

  const db = await getDb();
  if (!db) {
    console.error("❌ Database não disponível");
    process.exit(1);
  }

  try {
    // Verificar se já existem perguntas PIR
    const existingQuestions = await db
      .select()
      .from(testQuestions)
      .where(eq(testQuestions.testType, "pir"));

    if (existingQuestions.length > 0) {
      console.log(`⚠️  Já existem ${existingQuestions.length} perguntas PIR no banco`);
      console.log("   Deseja substituir? (Este script irá limpar e recriar)");
      
      // Deletar perguntas existentes
      await db.delete(testQuestions).where(eq(testQuestions.testType, "pir"));
      console.log("   ✓ Perguntas antigas removidas");
    }

    // Inserir novas perguntas
    console.log(`📝 Inserindo ${pirQuestions.length} perguntas PIR...`);
    
    for (const question of pirQuestions) {
      await db.insert(testQuestions).values(question);
    }

    console.log("✅ Seed de perguntas PIR concluído com sucesso!");
    console.log(`   Total: ${pirQuestions.length} perguntas`);
    console.log("   Dimensões:");
    console.log("   - IP (Interesse em Pessoas): 10 questões");
    console.log("   - ID (Interesse em Dados): 10 questões");
    console.log("   - IC (Interesse em Coisas): 10 questões");
    console.log("   - ES (Estabilidade): 10 questões");
    console.log("   - FL (Flexibilidade): 10 questões");
    console.log("   - AU (Autonomia): 10 questões");

  } catch (error) {
    console.error("❌ Erro ao fazer seed de perguntas PIR:", error);
    process.exit(1);
  }
}

// Executar seed
seedPIRQuestions();
