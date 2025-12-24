import { drizzle } from "drizzle-orm/mysql2";
import { testQuestions } from "./drizzle/schema.js";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

/**
 * Script para popular TODOS os testes psicométricos
 * - Big Five (50 perguntas - 10 por dimensão)
 * - MBTI (40 perguntas - 10 por dimensão)
 * - IE (40 perguntas - 10 por dimensão)
 * - VARK (40 perguntas - 10 por dimensão)
 */

// Big Five: Abertura, Conscienciosidade, Extroversão, Amabilidade, Neuroticismo
const bigFiveQuestions = [
  // Abertura (O) - 10 perguntas
  { dimension: "O", text: "Eu tenho uma imaginação vívida e criativa", reverse: false },
  { dimension: "O", text: "Eu gosto de explorar novas ideias e conceitos", reverse: false },
  { dimension: "O", text: "Eu aprecio arte, música e literatura", reverse: false },
  { dimension: "O", text: "Eu gosto de experimentar coisas novas", reverse: false },
  { dimension: "O", text: "Eu sou curioso sobre diferentes culturas", reverse: false },
  { dimension: "O", text: "Eu prefiro rotinas estabelecidas", reverse: true },
  { dimension: "O", text: "Eu gosto de pensar sobre questões abstratas", reverse: false },
  { dimension: "O", text: "Eu sou aberto a novas experiências", reverse: false },
  { dimension: "O", text: "Eu valorizo tradições e convenções", reverse: true },
  { dimension: "O", text: "Eu gosto de aprender coisas novas", reverse: false },

  // Conscienciosidade (C) - 10 perguntas
  { dimension: "C", text: "Eu sou organizado e metódico", reverse: false },
  { dimension: "C", text: "Eu sempre cumpro meus compromissos", reverse: false },
  { dimension: "C", text: "Eu planejo cuidadosamente antes de agir", reverse: false },
  { dimension: "C", text: "Eu sou disciplinado e focado", reverse: false },
  { dimension: "C", text: "Eu deixo as coisas para a última hora", reverse: true },
  { dimension: "C", text: "Eu sou pontual e confiável", reverse: false },
  { dimension: "C", text: "Eu presto atenção aos detalhes", reverse: false },
  { dimension: "C", text: "Eu termino o que começo", reverse: false },
  { dimension: "C", text: "Eu sou descuidado com minhas coisas", reverse: true },
  { dimension: "C", text: "Eu me esforço para fazer o meu melhor", reverse: false },

  // Extroversão (E) - 10 perguntas
  { dimension: "E", text: "Eu me sinto energizado em grupos sociais", reverse: false },
  { dimension: "E", text: "Eu gosto de ser o centro das atenções", reverse: false },
  { dimension: "E", text: "Eu faço amigos facilmente", reverse: false },
  { dimension: "E", text: "Eu prefiro ficar sozinho", reverse: true },
  { dimension: "E", text: "Eu sou falante e expressivo", reverse: false },
  { dimension: "E", text: "Eu gosto de festas e eventos sociais", reverse: false },
  { dimension: "E", text: "Eu sou reservado e quieto", reverse: true },
  { dimension: "E", text: "Eu tomo a iniciativa em conversas", reverse: false },
  { dimension: "E", text: "Eu me sinto confortável conhecendo novas pessoas", reverse: false },
  { dimension: "E", text: "Eu prefiro atividades solitárias", reverse: true },

  // Amabilidade (A) - 10 perguntas
  { dimension: "A", text: "Eu sou simpático e amigável", reverse: false },
  { dimension: "A", text: "Eu me preocupo com os sentimentos dos outros", reverse: false },
  { dimension: "A", text: "Eu sou cooperativo e colaborativo", reverse: false },
  { dimension: "A", text: "Eu confio nas pessoas", reverse: false },
  { dimension: "A", text: "Eu sou crítico e cético", reverse: true },
  { dimension: "A", text: "Eu ajudo os outros quando posso", reverse: false },
  { dimension: "A", text: "Eu sou gentil e compassivo", reverse: false },
  { dimension: "A", text: "Eu evito conflitos", reverse: false },
  { dimension: "A", text: "Eu sou competitivo e assertivo", reverse: true },
  { dimension: "A", text: "Eu valorizo harmonia nos relacionamentos", reverse: false },

  // Neuroticismo (N) - 10 perguntas
  { dimension: "N", text: "Eu me preocupo com frequência", reverse: false },
  { dimension: "N", text: "Eu fico estressado facilmente", reverse: false },
  { dimension: "N", text: "Eu sou emocionalmente estável", reverse: true },
  { dimension: "N", text: "Eu me sinto ansioso em situações novas", reverse: false },
  { dimension: "N", text: "Eu sou calmo e relaxado", reverse: true },
  { dimension: "N", text: "Eu me sinto sobrecarregado facilmente", reverse: false },
  { dimension: "N", text: "Eu me recupero rapidamente de contratempos", reverse: true },
  { dimension: "N", text: "Eu sou sensível a críticas", reverse: false },
  { dimension: "N", text: "Eu mantenho a calma sob pressão", reverse: true },
  { dimension: "N", text: "Eu me sinto inseguro às vezes", reverse: false },
];

// MBTI: Extroversão/Introversão (E/I), Sensação/Intuição (S/N), Pensamento/Sentimento (T/F), Julgamento/Percepção (J/P)
const mbtiQuestions = [
  // E/I - 10 perguntas
  { dimension: "E", text: "Eu ganho energia estando com outras pessoas", reverse: false },
  { dimension: "I", text: "Eu preciso de tempo sozinho para recarregar", reverse: false },
  { dimension: "E", text: "Eu penso melhor falando em voz alta", reverse: false },
  { dimension: "I", text: "Eu prefiro refletir antes de falar", reverse: false },
  { dimension: "E", text: "Eu gosto de ter muitos conhecidos", reverse: false },
  { dimension: "I", text: "Eu prefiro ter poucos amigos próximos", reverse: false },
  { dimension: "E", text: "Eu me sinto confortável em grupos grandes", reverse: false },
  { dimension: "I", text: "Eu prefiro conversas um-a-um", reverse: false },
  { dimension: "E", text: "Eu sou expansivo e sociável", reverse: false },
  { dimension: "I", text: "Eu sou reservado e introspectivo", reverse: false },

  // S/N - 10 perguntas
  { dimension: "S", text: "Eu confio em fatos e experiências concretas", reverse: false },
  { dimension: "N", text: "Eu confio em intuições e possibilidades", reverse: false },
  { dimension: "S", text: "Eu me concentro no presente e no prático", reverse: false },
  { dimension: "N", text: "Eu me concentro no futuro e no teórico", reverse: false },
  { dimension: "S", text: "Eu prefiro instruções passo a passo", reverse: false },
  { dimension: "N", text: "Eu prefiro entender o conceito geral", reverse: false },
  { dimension: "S", text: "Eu sou realista e prático", reverse: false },
  { dimension: "N", text: "Eu sou imaginativo e visionário", reverse: false },
  { dimension: "S", text: "Eu presto atenção aos detalhes", reverse: false },
  { dimension: "N", text: "Eu vejo padrões e significados", reverse: false },

  // T/F - 10 perguntas
  { dimension: "T", text: "Eu tomo decisões baseadas em lógica", reverse: false },
  { dimension: "F", text: "Eu tomo decisões baseadas em valores", reverse: false },
  { dimension: "T", text: "Eu valorizo verdade e justiça", reverse: false },
  { dimension: "F", text: "Eu valorizo harmonia e empatia", reverse: false },
  { dimension: "T", text: "Eu sou objetivo e imparcial", reverse: false },
  { dimension: "F", text: "Eu sou pessoal e compassivo", reverse: false },
  { dimension: "T", text: "Eu analiso prós e contras", reverse: false },
  { dimension: "F", text: "Eu considero como as pessoas se sentirão", reverse: false },
  { dimension: "T", text: "Eu sou direto e franco", reverse: false },
  { dimension: "F", text: "Eu sou diplomático e tático", reverse: false },

  // J/P - 10 perguntas
  { dimension: "J", text: "Eu gosto de planejar e organizar", reverse: false },
  { dimension: "P", text: "Eu prefiro ser espontâneo e flexível", reverse: false },
  { dimension: "J", text: "Eu gosto de tomar decisões rapidamente", reverse: false },
  { dimension: "P", text: "Eu prefiro manter opções em aberto", reverse: false },
  { dimension: "J", text: "Eu sou estruturado e metódico", reverse: false },
  { dimension: "P", text: "Eu sou adaptável e casual", reverse: false },
  { dimension: "J", text: "Eu gosto de concluir tarefas", reverse: false },
  { dimension: "P", text: "Eu gosto de explorar possibilidades", reverse: false },
  { dimension: "J", text: "Eu prefiro rotinas estabelecidas", reverse: false },
  { dimension: "P", text: "Eu prefiro variedade e mudança", reverse: false },
];

// IE (Inteligência Emocional): Autoconsciência, Autogestão, Consciência Social, Gestão de Relacionamentos
const ieQuestions = [
  // Autoconsciência - 10 perguntas
  { dimension: "Autoconsciência", text: "Eu reconheço minhas emoções quando elas acontecem", reverse: false },
  { dimension: "Autoconsciência", text: "Eu entendo por que me sinto de determinada maneira", reverse: false },
  { dimension: "Autoconsciência", text: "Eu conheço meus pontos fortes e fracos", reverse: false },
  { dimension: "Autoconsciência", text: "Eu sei como minhas emoções afetam meu desempenho", reverse: false },
  { dimension: "Autoconsciência", text: "Eu reflito sobre meus sentimentos regularmente", reverse: false },
  { dimension: "Autoconsciência", text: "Eu tenho dificuldade em identificar minhas emoções", reverse: true },
  { dimension: "Autoconsciência", text: "Eu entendo meus valores e motivações", reverse: false },
  { dimension: "Autoconsciência", text: "Eu sei quando estou ficando estressado", reverse: false },
  { dimension: "Autoconsciência", text: "Eu reconheço meus gatilhos emocionais", reverse: false },
  { dimension: "Autoconsciência", text: "Eu sou consciente de como os outros me veem", reverse: false },

  // Autogestão - 10 perguntas
  { dimension: "Autogestão", text: "Eu controlo minhas emoções em situações difíceis", reverse: false },
  { dimension: "Autogestão", text: "Eu mantenho a calma sob pressão", reverse: false },
  { dimension: "Autogestão", text: "Eu adapto-me bem a mudanças", reverse: false },
  { dimension: "Autogestão", text: "Eu sou resiliente diante de adversidades", reverse: false },
  { dimension: "Autogestão", text: "Eu explodo facilmente quando frustrado", reverse: true },
  { dimension: "Autogestão", text: "Eu mantenho compromissos e promessas", reverse: false },
  { dimension: "Autogestão", text: "Eu gerencio bem meu tempo e prioridades", reverse: false },
  { dimension: "Autogestão", text: "Eu me motivo para alcançar meus objetivos", reverse: false },
  { dimension: "Autogestão", text: "Eu deixo emoções negativas me dominarem", reverse: true },
  { dimension: "Autogestão", text: "Eu sou otimista e positivo", reverse: false },

  // Consciência Social - 10 perguntas
  { dimension: "Consciência Social", text: "Eu percebo como os outros estão se sentindo", reverse: false },
  { dimension: "Consciência Social", text: "Eu entendo as perspectivas dos outros", reverse: false },
  { dimension: "Consciência Social", text: "Eu sou empático e compassivo", reverse: false },
  { dimension: "Consciência Social", text: "Eu leio bem as dinâmicas de grupo", reverse: false },
  { dimension: "Consciência Social", text: "Eu tenho dificuldade em entender os outros", reverse: true },
  { dimension: "Consciência Social", text: "Eu me importo com as necessidades dos outros", reverse: false },
  { dimension: "Consciência Social", text: "Eu percebo sinais não-verbais", reverse: false },
  { dimension: "Consciência Social", text: "Eu entendo a cultura organizacional", reverse: false },
  { dimension: "Consciência Social", text: "Eu sou sensível aos sentimentos dos outros", reverse: false },
  { dimension: "Consciência Social", text: "Eu reconheço quando alguém precisa de ajuda", reverse: false },

  // Gestão de Relacionamentos - 10 perguntas
  { dimension: "Gestão de Relacionamentos", text: "Eu construo relacionamentos fortes", reverse: false },
  { dimension: "Gestão de Relacionamentos", text: "Eu comunico-me claramente e efetivamente", reverse: false },
  { dimension: "Gestão de Relacionamentos", text: "Eu resolvo conflitos de forma construtiva", reverse: false },
  { dimension: "Gestão de Relacionamentos", text: "Eu inspiro e influencio os outros", reverse: false },
  { dimension: "Gestão de Relacionamentos", text: "Eu tenho dificuldade em trabalhar com outros", reverse: true },
  { dimension: "Gestão de Relacionamentos", text: "Eu colaboro bem em equipe", reverse: false },
  { dimension: "Gestão de Relacionamentos", text: "Eu dou feedback construtivo", reverse: false },
  { dimension: "Gestão de Relacionamentos", text: "Eu lidero e motivo equipes", reverse: false },
  { dimension: "Gestão de Relacionamentos", text: "Eu evito confrontos", reverse: true },
  { dimension: "Gestão de Relacionamentos", text: "Eu desenvolvo os outros", reverse: false },
];

// VARK: Visual, Auditivo, Leitura/Escrita, Cinestésico
const varkQuestions = [
  // Visual - 10 perguntas
  { dimension: "Visual", text: "Eu aprendo melhor com diagramas e gráficos", reverse: false },
  { dimension: "Visual", text: "Eu prefiro assistir vídeos para aprender", reverse: false },
  { dimension: "Visual", text: "Eu uso cores e marcadores para organizar informações", reverse: false },
  { dimension: "Visual", text: "Eu me lembro melhor de rostos do que nomes", reverse: false },
  { dimension: "Visual", text: "Eu gosto de mapas mentais e fluxogramas", reverse: false },
  { dimension: "Visual", text: "Eu visualizo conceitos na minha mente", reverse: false },
  { dimension: "Visual", text: "Eu prefiro apresentações com imagens", reverse: false },
  { dimension: "Visual", text: "Eu desenho para entender ideias", reverse: false },
  { dimension: "Visual", text: "Eu me oriento bem com mapas", reverse: false },
  { dimension: "Visual", text: "Eu prefiro instruções visuais", reverse: false },

  // Auditivo - 10 perguntas
  { dimension: "Auditivo", text: "Eu aprendo melhor ouvindo explicações", reverse: false },
  { dimension: "Auditivo", text: "Eu prefiro podcasts e audiolivros", reverse: false },
  { dimension: "Auditivo", text: "Eu me lembro de conversas facilmente", reverse: false },
  { dimension: "Auditivo", text: "Eu gosto de discutir ideias em voz alta", reverse: false },
  { dimension: "Auditivo", text: "Eu prefiro instruções verbais", reverse: false },
  { dimension: "Auditivo", text: "Eu uso gravações para estudar", reverse: false },
  { dimension: "Auditivo", text: "Eu aprendo bem em palestras", reverse: false },
  { dimension: "Auditivo", text: "Eu falo comigo mesmo para processar informações", reverse: false },
  { dimension: "Auditivo", text: "Eu me lembro de músicas facilmente", reverse: false },
  { dimension: "Auditivo", text: "Eu prefiro explicar conceitos falando", reverse: false },

  // Leitura/Escrita - 10 perguntas
  { dimension: "Leitura", text: "Eu aprendo melhor lendo textos", reverse: false },
  { dimension: "Leitura", text: "Eu prefiro manuais e documentação escrita", reverse: false },
  { dimension: "Leitura", text: "Eu faço muitas anotações", reverse: false },
  { dimension: "Leitura", text: "Eu gosto de escrever para organizar pensamentos", reverse: false },
  { dimension: "Leitura", text: "Eu prefiro listas e textos detalhados", reverse: false },
  { dimension: "Leitura", text: "Eu reescrevo informações para memorizar", reverse: false },
  { dimension: "Leitura", text: "Eu prefiro artigos a vídeos", reverse: false },
  { dimension: "Leitura", text: "Eu gosto de ler instruções passo a passo", reverse: false },
  { dimension: "Leitura", text: "Eu aprendo bem com livros didáticos", reverse: false },
  { dimension: "Leitura", text: "Eu prefiro comunicação por escrito", reverse: false },

  // Cinestésico - 10 perguntas
  { dimension: "Cinestésico", text: "Eu aprendo melhor fazendo e praticando", reverse: false },
  { dimension: "Cinestésico", text: "Eu prefiro atividades práticas", reverse: false },
  { dimension: "Cinestésico", text: "Eu me movimento enquanto penso", reverse: false },
  { dimension: "Cinestésico", text: "Eu gosto de experimentos e demonstrações", reverse: false },
  { dimension: "Cinestésico", text: "Eu aprendo bem com simulações", reverse: false },
  { dimension: "Cinestésico", text: "Eu uso gestos ao explicar", reverse: false },
  { dimension: "Cinestésico", text: "Eu prefiro aprender no trabalho", reverse: false },
  { dimension: "Cinestésico", text: "Eu me lembro de coisas que fiz", reverse: false },
  { dimension: "Cinestésico", text: "Eu gosto de construir e criar", reverse: false },
  { dimension: "Cinestésico", text: "Eu prefiro estudar fazendo exercícios", reverse: false },
];

async function seedAllTests() {
  console.log("🔄 Limpando perguntas antigas...");
  
  // Deletar perguntas antigas
  await db.delete(testQuestions).where(eq(testQuestions.testType, "bigfive"));
  await db.delete(testQuestions).where(eq(testQuestions.testType, "mbti"));
  await db.delete(testQuestions).where(eq(testQuestions.testType, "ie"));
  await db.delete(testQuestions).where(eq(testQuestions.testType, "vark"));
  
  console.log("✅ Perguntas antigas removidas\n");
  
  // Inserir Big Five
  console.log(`📝 Inserindo ${bigFiveQuestions.length} perguntas Big Five...`);
  for (const question of bigFiveQuestions) {
    await db.insert(testQuestions).values({
      testType: "bigfive",
      questionNumber: bigFiveQuestions.indexOf(question) + 1,
      dimension: question.dimension,
      questionText: question.text,
      reverse: question.reverse,
    });
  }
  console.log("✅ Big Five inserido\n");
  
  // Inserir MBTI
  console.log(`📝 Inserindo ${mbtiQuestions.length} perguntas MBTI...`);
  for (const question of mbtiQuestions) {
    await db.insert(testQuestions).values({
      testType: "mbti",
      questionNumber: mbtiQuestions.indexOf(question) + 1,
      dimension: question.dimension,
      questionText: question.text,
      reverse: question.reverse,
    });
  }
  console.log("✅ MBTI inserido\n");
  
  // Inserir IE
  console.log(`📝 Inserindo ${ieQuestions.length} perguntas IE...`);
  for (const question of ieQuestions) {
    await db.insert(testQuestions).values({
      testType: "ie",
      questionNumber: ieQuestions.indexOf(question) + 1,
      dimension: question.dimension,
      questionText: question.text,
      reverse: question.reverse,
    });
  }
  console.log("✅ IE inserido\n");
  
  // Inserir VARK
  console.log(`📝 Inserindo ${varkQuestions.length} perguntas VARK...`);
  for (const question of varkQuestions) {
    await db.insert(testQuestions).values({
      testType: "vark",
      questionNumber: varkQuestions.indexOf(question) + 1,
      dimension: question.dimension,
      questionText: question.text,
      reverse: question.reverse,
    });
  }
  console.log("✅ VARK inserido\n");
  
  console.log("🎉 Todos os testes foram populados com sucesso!");
  console.log("\n📊 Resumo:");
  console.log(`- Big Five: ${bigFiveQuestions.length} perguntas (5 dimensões)`);
  console.log(`- MBTI: ${mbtiQuestions.length} perguntas (8 dimensões)`);
  console.log(`- IE: ${ieQuestions.length} perguntas (4 dimensões)`);
  console.log(`- VARK: ${varkQuestions.length} perguntas (4 dimensões)`);
  console.log(`- Total: ${bigFiveQuestions.length + mbtiQuestions.length + ieQuestions.length + varkQuestions.length} perguntas`);
  
  process.exit(0);
}

seedAllTests().catch((error) => {
  console.error("❌ Erro ao popular testes:", error);
  process.exit(1);
});
