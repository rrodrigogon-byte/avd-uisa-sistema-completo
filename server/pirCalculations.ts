/**
 * PIR (Perfil de Interesses e Reações) - Cálculos e Interpretações
 * Sistema AVD UISA
 */

export interface PIRResponse {
  questionNumber: number;
  answer: number; // 1-5
  dimension: string;
  reverse: boolean;
}

export interface PIRScores {
  IP: number; // Interesse em Pessoas
  ID: number; // Interesse em Dados
  IC: number; // Interesse em Coisas
  RM: number; // Reação a Mudanças
  RP: number; // Reação a Pressão
  AU: number; // Autonomia
}

export interface PIRResult {
  scores: PIRScores;
  normalizedScores: PIRScores;
  classifications: Record<keyof PIRScores, 'Baixo' | 'Médio' | 'Alto'>;
  dominantDimension: keyof PIRScores;
  profileType: string;
  profileDescription: string;
  strengths: string;
  developmentAreas: string;
  workStyle: string;
  communicationStyle: string;
  motivators: string;
  stressors: string;
  teamContribution: string;
  careerRecommendations: string;
}

/**
 * Calcula as pontuações brutas por dimensão
 */
export function calculateRawScores(responses: PIRResponse[]): PIRScores {
  const scores: PIRScores = {
    IP: 0,
    ID: 0,
    IC: 0,
    RM: 0,
    RP: 0,
    AU: 0,
  };

  for (const response of responses) {
    const dimension = response.dimension as keyof PIRScores;
    
    // Aplicar inversão se necessário
    const value = response.reverse ? (6 - response.answer) : response.answer;
    
    scores[dimension] += value;
  }

  return scores;
}

/**
 * Normaliza as pontuações para escala 0-100
 */
export function normalizeScores(rawScores: PIRScores): PIRScores {
  const maxScore = 50; // 10 questões × 5 pontos máximos
  
  return {
    IP: Math.round((rawScores.IP / maxScore) * 100),
    ID: Math.round((rawScores.ID / maxScore) * 100),
    IC: Math.round((rawScores.IC / maxScore) * 100),
    RM: Math.round((rawScores.RM / maxScore) * 100),
    RP: Math.round((rawScores.RP / maxScore) * 100),
    AU: Math.round((rawScores.AU / maxScore) * 100),
  };
}

/**
 * Classifica cada dimensão
 */
export function classifyScores(normalizedScores: PIRScores): Record<keyof PIRScores, 'Baixo' | 'Médio' | 'Alto'> {
  const classify = (score: number): 'Baixo' | 'Médio' | 'Alto' => {
    if (score <= 40) return 'Baixo';
    if (score <= 70) return 'Médio';
    return 'Alto';
  };

  return {
    IP: classify(normalizedScores.IP),
    ID: classify(normalizedScores.ID),
    IC: classify(normalizedScores.IC),
    RM: classify(normalizedScores.RM),
    RP: classify(normalizedScores.RP),
    AU: classify(normalizedScores.AU),
  };
}

/**
 * Identifica a dimensão dominante
 */
export function getDominantDimension(normalizedScores: PIRScores): keyof PIRScores {
  let maxScore = 0;
  let dominant: keyof PIRScores = 'IP';

  for (const [dimension, score] of Object.entries(normalizedScores)) {
    if (score > maxScore) {
      maxScore = score;
      dominant = dimension as keyof PIRScores;
    }
  }

  return dominant;
}

/**
 * Gera o tipo de perfil baseado nas dimensões dominantes
 */
export function getProfileType(normalizedScores: PIRScores, classifications: Record<keyof PIRScores, 'Baixo' | 'Médio' | 'Alto'>): string {
  const dominant = getDominantDimension(normalizedScores);
  
  const dimensionNames: Record<keyof PIRScores, string> = {
    IP: 'Orientado a Pessoas',
    ID: 'Orientado a Dados',
    IC: 'Orientado a Coisas',
    RM: 'Adaptável',
    RP: 'Resiliente',
    AU: 'Autônomo',
  };

  // Identificar dimensões altas
  const highDimensions = Object.entries(classifications)
    .filter(([_, classification]) => classification === 'Alto')
    .map(([dim]) => dimensionNames[dim as keyof PIRScores]);

  if (highDimensions.length === 1) {
    return dimensionNames[dominant];
  } else if (highDimensions.length > 1) {
    return highDimensions.slice(0, 2).join(' + ');
  }

  return dimensionNames[dominant];
}

/**
 * Gera descrição completa do perfil
 */
export function generateProfileDescription(
  normalizedScores: PIRScores,
  classifications: Record<keyof PIRScores, 'Baixo' | 'Médio' | 'Alto'>,
  profileType: string
): string {
  const descriptions: Record<keyof PIRScores, Record<'Baixo' | 'Médio' | 'Alto', string>> = {
    IP: {
      Alto: 'Você demonstra forte interesse em trabalhar com pessoas, possui alta capacidade de empatia e comunicação. Sente-se energizado em ambientes colaborativos e tem facilidade para construir relacionamentos.',
      Médio: 'Você consegue trabalhar bem tanto em equipe quanto individualmente. Possui habilidades sociais adequadas e se adapta a diferentes contextos de interação.',
      Baixo: 'Você prefere trabalhar de forma mais independente, com menos interação social. Pode se sentir mais confortável em atividades que exigem concentração individual.',
    },
    ID: {
      Alto: 'Você tem forte afinidade com análise de dados, números e informações estruturadas. Possui pensamento lógico e organizado, com atenção aos detalhes e capacidade analítica desenvolvida.',
      Médio: 'Você consegue trabalhar com dados quando necessário, mantendo equilíbrio entre análise e outras atividades. Possui capacidade analítica adequada para a maioria das situações.',
      Baixo: 'Você prefere atividades menos analíticas e mais práticas ou interpessoais. Pode se sentir mais confortável com tarefas que não exigem análise detalhada de dados.',
    },
    IC: {
      Alto: 'Você demonstra forte interesse por atividades práticas e manuais. Gosta de trabalhar com objetos concretos, ferramentas e tecnologia física. Valoriza resultados tangíveis.',
      Médio: 'Você consegue realizar atividades práticas quando necessário, mantendo equilíbrio entre trabalho manual e conceitual.',
      Baixo: 'Você prefere atividades mais conceituais e abstratas a trabalhos manuais. Sente-se mais confortável com ideias e conceitos do que com objetos físicos.',
    },
    RM: {
      Alto: 'Você é altamente adaptável e flexível. Lida bem com mudanças, novidades e situações inesperadas. Possui abertura para experimentar novas abordagens e aprender rapidamente.',
      Médio: 'Você consegue se adaptar a mudanças quando necessário, mas prefere algum nível de estabilidade. Equilibra bem inovação e procedimentos estabelecidos.',
      Baixo: 'Você prefere ambientes estáveis e previsíveis. Pode sentir desconforto com mudanças frequentes e valoriza procedimentos bem estabelecidos.',
    },
    RP: {
      Alto: 'Você mantém alta performance sob pressão. Consegue tomar decisões rápidas e eficazes em situações de estresse, mantendo a calma e o foco mesmo em momentos críticos.',
      Médio: 'Você consegue lidar com pressão moderada, mas pode precisar de estratégias de gerenciamento de estresse em situações muito intensas.',
      Baixo: 'Você prefere ambientes de trabalho mais tranquilos e com menos pressão. Pode se sentir sobrecarregado em situações de alta demanda ou estresse.',
    },
    AU: {
      Alto: 'Você é altamente independente e autogerido. Prefere trabalhar com autonomia, tomando suas próprias decisões e gerenciando seu tempo e métodos de trabalho.',
      Médio: 'Você consegue trabalhar tanto de forma autônoma quanto com orientação. Equilibra bem independência e colaboração.',
      Baixo: 'Você prefere receber orientações claras e trabalhar com supervisão. Sente-se mais confortável com direcionamento e feedback frequente.',
    },
  };

  let description = `**Perfil: ${profileType}**\n\n`;

  // Adicionar descrições das dimensões altas e baixas
  for (const [dimension, classification] of Object.entries(classifications)) {
    const dim = dimension as keyof PIRScores;
    if (classification === 'Alto' || classification === 'Baixo') {
      description += descriptions[dim][classification] + '\n\n';
    }
  }

  return description.trim();
}

/**
 * Gera pontos fortes baseados nas dimensões altas
 */
export function generateStrengths(classifications: Record<keyof PIRScores, 'Baixo' | 'Médio' | 'Alto'>): string {
  const strengthsMap: Record<keyof PIRScores, string> = {
    IP: '• Excelente em trabalho em equipe e colaboração\n• Alta capacidade de comunicação e empatia\n• Facilidade para construir relacionamentos\n• Habilidade para ensinar e desenvolver outras pessoas',
    ID: '• Forte capacidade analítica e lógica\n• Atenção aos detalhes e precisão\n• Habilidade para organizar e estruturar informações\n• Facilidade com tecnologia e sistemas',
    IC: '• Habilidades práticas e manuais desenvolvidas\n• Capacidade de gerar resultados tangíveis\n• Facilidade com ferramentas e equipamentos\n• Pensamento prático e orientado a soluções',
    RM: '• Alta adaptabilidade e flexibilidade\n• Abertura para inovação e mudanças\n• Capacidade de aprendizado rápido\n• Facilidade para lidar com situações novas',
    RP: '• Excelente desempenho sob pressão\n• Capacidade de tomar decisões rápidas\n• Resiliência e controle emocional\n• Habilidade para priorizar em momentos críticos',
    AU: '• Alta autonomia e autogestão\n• Capacidade de trabalhar independentemente\n• Iniciativa e proatividade\n• Habilidade para gerenciar tempo e recursos',
  };

  const strengths: string[] = [];
  for (const [dimension, classification] of Object.entries(classifications)) {
    if (classification === 'Alto') {
      strengths.push(strengthsMap[dimension as keyof PIRScores]);
    }
  }

  return strengths.length > 0 ? strengths.join('\n\n') : 'Perfil equilibrado em todas as dimensões.';
}

/**
 * Gera áreas de desenvolvimento baseadas nas dimensões baixas
 */
export function generateDevelopmentAreas(classifications: Record<keyof PIRScores, 'Baixo' | 'Médio' | 'Alto'>): string {
  const developmentMap: Record<keyof PIRScores, string> = {
    IP: '• Desenvolver habilidades de comunicação interpessoal\n• Praticar trabalho em equipe e colaboração\n• Buscar oportunidades de networking\n• Trabalhar empatia e escuta ativa',
    ID: '• Desenvolver pensamento analítico e lógico\n• Praticar organização e atenção aos detalhes\n• Aprimorar habilidades com dados e tecnologia\n• Buscar cursos de análise e metodologias estruturadas',
    IC: '• Desenvolver habilidades práticas e manuais\n• Buscar atividades que gerem resultados tangíveis\n• Explorar ferramentas e tecnologias físicas\n• Praticar resolução prática de problemas',
    RM: '• Trabalhar adaptabilidade e flexibilidade\n• Praticar saída da zona de conforto\n• Buscar experiências novas e desafiadoras\n• Desenvolver abertura para mudanças',
    RP: '• Desenvolver técnicas de gerenciamento de estresse\n• Praticar tomada de decisão sob pressão\n• Trabalhar resiliência emocional\n• Buscar atividades que desenvolvam controle emocional',
    AU: '• Desenvolver autonomia e autogestão\n• Praticar tomada de decisão independente\n• Trabalhar organização pessoal e gestão do tempo\n• Buscar projetos que exijam iniciativa própria',
  };

  const developments: string[] = [];
  for (const [dimension, classification] of Object.entries(classifications)) {
    if (classification === 'Baixo') {
      developments.push(developmentMap[dimension as keyof PIRScores]);
    }
  }

  return developments.length > 0 ? developments.join('\n\n') : 'Continue desenvolvendo todas as dimensões de forma equilibrada.';
}

/**
 * Gera estilo de trabalho
 */
export function generateWorkStyle(normalizedScores: PIRScores): string {
  const dominant = getDominantDimension(normalizedScores);
  
  const workStyles: Record<keyof PIRScores, string> = {
    IP: 'Você trabalha melhor em ambientes colaborativos, com interação frequente com colegas e clientes. Prefere projetos que envolvam trabalho em equipe e comunicação constante. Ambientes sociais e dinâmicos potencializam sua produtividade.',
    ID: 'Você trabalha melhor em ambientes organizados e estruturados, com acesso a dados e informações. Prefere tarefas que exijam análise, planejamento e atenção aos detalhes. Ambientes que valorizam precisão e lógica potencializam sua produtividade.',
    IC: 'Você trabalha melhor em ambientes práticos, com acesso a ferramentas e equipamentos. Prefere tarefas que gerem resultados tangíveis e concretos. Ambientes que valorizam habilidades manuais e técnicas potencializam sua produtividade.',
    RM: 'Você trabalha melhor em ambientes dinâmicos e inovadores, com variedade e mudanças. Prefere projetos desafiadores que exijam adaptação e criatividade. Ambientes que valorizam flexibilidade e inovação potencializam sua produtividade.',
    RP: 'Você trabalha melhor em ambientes desafiadores e acelerados, com prazos e metas claras. Prefere situações que exijam decisões rápidas e alta performance. Ambientes que valorizam resiliência e resultados sob pressão potencializam sua produtividade.',
    AU: 'Você trabalha melhor em ambientes que oferecem autonomia e liberdade. Prefere projetos onde possa definir seus próprios métodos e horários. Ambientes que valorizam iniciativa e autogestão potencializam sua produtividade.',
  };

  return workStyles[dominant];
}

/**
 * Gera recomendações de carreira
 */
export function generateCareerRecommendations(normalizedScores: PIRScores, classifications: Record<keyof PIRScores, 'Baixo' | 'Médio' | 'Alto'>): string {
  const recommendations: string[] = [];

  if (classifications.IP === 'Alto') {
    recommendations.push('**Áreas recomendadas:** Recursos Humanos, Vendas, Atendimento ao Cliente, Educação, Psicologia, Assistência Social, Relações Públicas, Marketing de Relacionamento');
  }

  if (classifications.ID === 'Alto') {
    recommendations.push('**Áreas recomendadas:** Análise de Dados, Finanças, Contabilidade, Auditoria, Pesquisa, Estatística, Business Intelligence, Ciência de Dados');
  }

  if (classifications.IC === 'Alto') {
    recommendations.push('**Áreas recomendadas:** Engenharia, Manutenção, Produção, Construção Civil, Design de Produto, Tecnologia da Informação (Hardware), Mecânica, Eletrônica');
  }

  if (classifications.RM === 'Alto') {
    recommendations.push('**Áreas recomendadas:** Startups, Consultoria, Gestão de Projetos, Inovação, Transformação Digital, Gestão de Mudanças, Desenvolvimento de Negócios');
  }

  if (classifications.RP === 'Alto') {
    recommendations.push('**Áreas recomendadas:** Gestão de Crises, Operações, Emergência Médica, Forças Armadas, Bombeiros, Gestão de Riscos, Trading, Jornalismo');
  }

  if (classifications.AU === 'Alto') {
    recommendations.push('**Áreas recomendadas:** Empreendedorismo, Consultoria Independente, Pesquisa Acadêmica, Freelancing, Gestão de Projetos Autônomos, Desenvolvimento de Software');
  }

  // Combinações especiais
  if (classifications.IP === 'Alto' && classifications.ID === 'Alto') {
    recommendations.push('\n**Combinação especial:** Seu perfil combina habilidades interpessoais e analíticas, ideal para Gestão de Pessoas, Consultoria de RH, Psicologia Organizacional ou Business Partner.');
  }

  if (classifications.RM === 'Alto' && classifications.RP === 'Alto') {
    recommendations.push('\n**Combinação especial:** Seu perfil combina adaptabilidade e resiliência, ideal para Gestão de Mudanças, Liderança em Ambientes Dinâmicos ou Gestão de Crises.');
  }

  return recommendations.length > 0 ? recommendations.join('\n\n') : 'Explore diferentes áreas para identificar aquela que mais se alinha aos seus interesses e valores pessoais.';
}

/**
 * Calcula resultado completo do PIR
 */
export function calculatePIRResult(responses: PIRResponse[]): PIRResult {
  const rawScores = calculateRawScores(responses);
  const normalizedScores = normalizeScores(rawScores);
  const classifications = classifyScores(normalizedScores);
  const dominantDimension = getDominantDimension(normalizedScores);
  const profileType = getProfileType(normalizedScores, classifications);
  
  return {
    scores: rawScores,
    normalizedScores,
    classifications,
    dominantDimension,
    profileType,
    profileDescription: generateProfileDescription(normalizedScores, classifications, profileType),
    strengths: generateStrengths(classifications),
    developmentAreas: generateDevelopmentAreas(classifications),
    workStyle: generateWorkStyle(normalizedScores),
    communicationStyle: generateCommunicationStyle(normalizedScores),
    motivators: generateMotivators(classifications),
    stressors: generateStressors(classifications),
    teamContribution: generateTeamContribution(normalizedScores, classifications),
    careerRecommendations: generateCareerRecommendations(normalizedScores, classifications),
  };
}

/**
 * Gera estilo de comunicação
 */
function generateCommunicationStyle(normalizedScores: PIRScores): string {
  if (normalizedScores.IP > 70) {
    return 'Você possui um estilo de comunicação aberto, empático e colaborativo. Valoriza o diálogo, a escuta ativa e a construção de consenso. Prefere comunicação face a face e ambientes de discussão em grupo.';
  } else if (normalizedScores.ID > 70) {
    return 'Você possui um estilo de comunicação objetivo, preciso e baseado em dados. Valoriza informações claras, estruturadas e fundamentadas. Prefere comunicação escrita e documentada.';
  } else if (normalizedScores.AU > 70) {
    return 'Você possui um estilo de comunicação direto e independente. Valoriza autonomia nas decisões e prefere comunicação objetiva, sem necessidade de validação constante.';
  }
  return 'Você adapta seu estilo de comunicação conforme o contexto, equilibrando objetividade e empatia.';
}

/**
 * Gera principais motivadores
 */
function generateMotivators(classifications: Record<keyof PIRScores, 'Baixo' | 'Médio' | 'Alto'>): string {
  const motivators: string[] = [];

  if (classifications.IP === 'Alto') {
    motivators.push('• Trabalhar com pessoas e fazer diferença na vida dos outros');
  }
  if (classifications.ID === 'Alto') {
    motivators.push('• Resolver problemas complexos e alcançar precisão');
  }
  if (classifications.IC === 'Alto') {
    motivators.push('• Criar resultados tangíveis e ver o impacto prático do trabalho');
  }
  if (classifications.RM === 'Alto') {
    motivators.push('• Enfrentar novos desafios e aprender constantemente');
  }
  if (classifications.RP === 'Alto') {
    motivators.push('• Superar desafios difíceis e alcançar metas ambiciosas');
  }
  if (classifications.AU === 'Alto') {
    motivators.push('• Ter liberdade para tomar decisões e controlar seu trabalho');
  }

  return motivators.length > 0 ? motivators.join('\n') : '• Equilíbrio entre diferentes aspectos do trabalho';
}

/**
 * Gera principais estressores
 */
function generateStressors(classifications: Record<keyof PIRScores, 'Baixo' | 'Médio' | 'Alto'>): string {
  const stressors: string[] = [];

  if (classifications.IP === 'Baixo') {
    stressors.push('• Ambientes com excesso de interação social e reuniões frequentes');
  }
  if (classifications.ID === 'Baixo') {
    stressors.push('• Tarefas que exigem análise detalhada de dados e números');
  }
  if (classifications.IC === 'Baixo') {
    stressors.push('• Trabalhos manuais ou que exigem habilidades técnicas práticas');
  }
  if (classifications.RM === 'Baixo') {
    stressors.push('• Mudanças frequentes e ambientes imprevisíveis');
  }
  if (classifications.RP === 'Baixo') {
    stressors.push('• Prazos apertados e situações de alta pressão');
  }
  if (classifications.AU === 'Baixo') {
    stressors.push('• Falta de orientação clara e necessidade de tomar decisões sozinho');
  }

  return stressors.length > 0 ? stressors.join('\n') : '• Perfil equilibrado, sem estressores específicos identificados';
}

/**
 * Gera contribuição para equipe
 */
function generateTeamContribution(normalizedScores: PIRScores, classifications: Record<keyof PIRScores, 'Baixo' | 'Médio' | 'Alto'>): string {
  const contributions: string[] = [];

  if (classifications.IP === 'Alto') {
    contributions.push('Você contribui para a equipe facilitando a comunicação, construindo relacionamentos e promovendo um ambiente colaborativo.');
  }
  if (classifications.ID === 'Alto') {
    contributions.push('Você contribui para a equipe trazendo análise, organização e atenção aos detalhes, garantindo decisões baseadas em dados.');
  }
  if (classifications.IC === 'Alto') {
    contributions.push('Você contribui para a equipe com soluções práticas, habilidades técnicas e foco em resultados tangíveis.');
  }
  if (classifications.RM === 'Alto') {
    contributions.push('Você contribui para a equipe trazendo flexibilidade, inovação e capacidade de adaptação a mudanças.');
  }
  if (classifications.RP === 'Alto') {
    contributions.push('Você contribui para a equipe mantendo a calma em crises, tomando decisões rápidas e liderando em momentos críticos.');
  }
  if (classifications.AU === 'Alto') {
    contributions.push('Você contribui para a equipe com iniciativa, proatividade e capacidade de trabalhar independentemente.');
  }

  return contributions.length > 0 ? contributions.join(' ') : 'Você contribui para a equipe de forma equilibrada, adaptando-se às necessidades do grupo.';
}
