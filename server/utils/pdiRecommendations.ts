/**
 * Sistema de Recomendações Inteligentes para PDI
 * Mapeia perfis psicométricos para competências e sugestões de desenvolvimento
 */

export interface PDIRecommendation {
  competency: string;
  description: string;
  actions: string[];
  courses: string[];
  priority: "high" | "medium" | "low";
  reasoning: string;
}

/**
 * Gera recomendações baseadas em perfil DISC
 */
export function generateDISCRecommendations(profile: {
  D: number;
  I: number;
  S: number;
  C: number;
}): PDIRecommendation[] {
  const recommendations: PDIRecommendation[] = [];

  // Dominância Alta (D > 70)
  if (profile.D > 70) {
    recommendations.push({
      competency: "Liderança Assertiva",
      description: "Seu perfil indica forte orientação para resultados e tomada de decisões rápidas",
      actions: [
        "Liderar projetos estratégicos com prazos desafiadores",
        "Mentorar colegas em técnicas de negociação",
        "Participar de comitês de decisão estratégica",
      ],
      courses: [
        "Liderança de Alto Impacto",
        "Gestão de Conflitos e Negociação",
        "Tomada de Decisão Estratégica",
      ],
      priority: "high",
      reasoning: "Alta Dominância indica potencial para cargos de liderança e gestão de mudanças",
    });

    recommendations.push({
      competency: "Empatia e Escuta Ativa",
      description: "Desenvolver habilidades de relacionamento para equilibrar o perfil orientado a resultados",
      actions: [
        "Praticar escuta ativa em reuniões de equipe",
        "Solicitar feedback sobre estilo de comunicação",
        "Participar de dinâmicas de team building",
      ],
      courses: [
        "Inteligência Emocional no Trabalho",
        "Comunicação Assertiva e Empática",
        "Gestão de Equipes de Alta Performance",
      ],
      priority: "medium",
      reasoning: "Perfil D alto pode se beneficiar de desenvolver soft skills para melhor colaboração",
    });
  }

  // Influência Alta (I > 70)
  if (profile.I > 70) {
    recommendations.push({
      competency: "Comunicação e Networking",
      description: "Seu perfil indica excelentes habilidades sociais e capacidade de influenciar",
      actions: [
        "Representar a empresa em eventos e conferências",
        "Liderar iniciativas de engajamento de equipe",
        "Atuar como embaixador da cultura organizacional",
      ],
      courses: [
        "Storytelling e Apresentações Impactantes",
        "Marketing Pessoal e Networking Estratégico",
        "Facilitação de Workshops e Treinamentos",
      ],
      priority: "high",
      reasoning: "Alta Influência indica talento natural para comunicação e engajamento de pessoas",
    });

    recommendations.push({
      competency: "Foco e Organização",
      description: "Desenvolver estrutura e disciplina para complementar o perfil comunicativo",
      actions: [
        "Implementar sistema de gestão de tempo (ex: Pomodoro)",
        "Definir metas SMART para projetos pessoais",
        "Utilizar ferramentas de produtividade (Trello, Notion)",
      ],
      courses: [
        "Gestão de Tempo e Produtividade",
        "Planejamento Estratégico Pessoal",
        "Metodologias Ágeis para Organização",
      ],
      priority: "medium",
      reasoning: "Perfil I alto pode se beneficiar de técnicas de organização e foco",
    });
  }

  // Estabilidade Alta (S > 70)
  if (profile.S > 70) {
    recommendations.push({
      competency: "Trabalho em Equipe e Colaboração",
      description: "Seu perfil indica excelente capacidade de colaboração e suporte à equipe",
      actions: [
        "Atuar como mediador em conflitos de equipe",
        "Mentorar novos colaboradores",
        "Liderar iniciativas de bem-estar organizacional",
      ],
      courses: [
        "Facilitação de Grupos e Mediação",
        "Mentoria e Desenvolvimento de Pessoas",
        "Cultura Organizacional e Clima",
      ],
      priority: "high",
      reasoning: "Alta Estabilidade indica talento para criar ambientes colaborativos e harmoniosos",
    });

    recommendations.push({
      competency: "Adaptabilidade e Inovação",
      description: "Desenvolver flexibilidade para lidar com mudanças e incertezas",
      actions: [
        "Participar de projetos de inovação e transformação",
        "Experimentar novas metodologias de trabalho",
        "Buscar feedback sobre resistência a mudanças",
      ],
      courses: [
        "Gestão de Mudanças Organizacionais",
        "Design Thinking e Inovação",
        "Resiliência e Adaptabilidade",
      ],
      priority: "medium",
      reasoning: "Perfil S alto pode se beneficiar de desenvolver flexibilidade diante de mudanças",
    });
  }

  // Conformidade Alta (C > 70)
  if (profile.C > 70) {
    recommendations.push({
      competency: "Análise e Qualidade",
      description: "Seu perfil indica forte atenção a detalhes e busca por excelência",
      actions: [
        "Liderar projetos de melhoria de processos",
        "Atuar em auditorias e controles de qualidade",
        "Desenvolver padrões e procedimentos técnicos",
      ],
      courses: [
        "Gestão da Qualidade e Processos",
        "Análise de Dados e Business Intelligence",
        "Auditoria e Compliance",
      ],
      priority: "high",
      reasoning: "Alta Conformidade indica talento para análise crítica e garantia de qualidade",
    });

    recommendations.push({
      competency: "Comunicação e Visibilidade",
      description: "Desenvolver habilidades de comunicação para compartilhar expertise",
      actions: [
        "Apresentar resultados de análises em reuniões executivas",
        "Escrever artigos técnicos internos",
        "Participar de comitês técnicos multidisciplinares",
      ],
      courses: [
        "Comunicação Técnica Eficaz",
        "Apresentações para Executivos",
        "Influência sem Autoridade",
      ],
      priority: "medium",
      reasoning: "Perfil C alto pode se beneficiar de aumentar visibilidade e comunicação",
    });
  }

  // Perfis Balanceados
  if (Math.max(profile.D, profile.I, profile.S, profile.C) < 70) {
    recommendations.push({
      competency: "Versatilidade e Adaptação",
      description: "Seu perfil balanceado indica capacidade de atuar em diversos contextos",
      actions: [
        "Buscar projetos multidisciplinares",
        "Desenvolver especialização em área de interesse",
        "Atuar como facilitador entre diferentes perfis",
      ],
      courses: [
        "Gestão de Projetos Multidisciplinares",
        "Liderança Situacional",
        "Desenvolvimento de Carreira em T",
      ],
      priority: "medium",
      reasoning: "Perfil balanceado oferece flexibilidade, mas pode se beneficiar de especialização",
    });
  }

  return recommendations;
}

/**
 * Gera recomendações baseadas em perfil Big Five
 */
export function generateBigFiveRecommendations(profile: {
  O: number; // Abertura
  C: number; // Conscienciosidade
  E: number; // Extroversão
  A: number; // Amabilidade
  N: number; // Neuroticismo
}): PDIRecommendation[] {
  const recommendations: PDIRecommendation[] = [];

  // Abertura Alta (O > 0.7)
  if (profile.O > 0.7) {
    recommendations.push({
      competency: "Inovação e Criatividade",
      description: "Alta abertura a experiências indica potencial criativo e inovador",
      actions: [
        "Liderar projetos de inovação e transformação digital",
        "Participar de hackathons e desafios de inovação",
        "Propor melhorias em processos e produtos",
      ],
      courses: [
        "Design Thinking e Inovação",
        "Criatividade Aplicada aos Negócios",
        "Transformação Digital",
      ],
      priority: "high",
      reasoning: "Alta Abertura favorece pensamento criativo e adaptação a novidades",
    });
  }

  // Conscienciosidade Alta (C > 0.7)
  if (profile.C > 0.7) {
    recommendations.push({
      competency: "Gestão de Projetos e Processos",
      description: "Alta conscienciosidade indica organização e responsabilidade",
      actions: [
        "Certificar-se em metodologias de gestão de projetos",
        "Liderar iniciativas de melhoria contínua",
        "Mentorar colegas em organização e planejamento",
      ],
      courses: [
        "PMP - Project Management Professional",
        "Lean Six Sigma",
        "OKRs e Gestão por Objetivos",
      ],
      priority: "high",
      reasoning: "Alta Conscienciosidade favorece disciplina e entrega de resultados",
    });
  }

  // Extroversão Alta (E > 0.7)
  if (profile.E > 0.7) {
    recommendations.push({
      competency: "Liderança e Engajamento",
      description: "Alta extroversão indica energia e capacidade de mobilizar pessoas",
      actions: [
        "Liderar equipes e projetos colaborativos",
        "Atuar como facilitador em workshops",
        "Representar a empresa externamente",
      ],
      courses: [
        "Liderança Inspiradora",
        "Gestão de Equipes Remotas",
        "Public Speaking e Oratória",
      ],
      priority: "high",
      reasoning: "Alta Extroversão favorece interações sociais e liderança de grupos",
    });
  }

  // Amabilidade Alta (A > 0.7)
  if (profile.A > 0.7) {
    recommendations.push({
      competency: "Relacionamento e Colaboração",
      description: "Alta amabilidade indica empatia e cooperação",
      actions: [
        "Atuar em projetos de responsabilidade social",
        "Mediar conflitos e facilitar consensos",
        "Desenvolver programas de bem-estar",
      ],
      courses: [
        "Mediação e Resolução de Conflitos",
        "Coaching e Mentoria",
        "Responsabilidade Social Corporativa",
      ],
      priority: "medium",
      reasoning: "Alta Amabilidade favorece relacionamentos harmoniosos e cooperação",
    });
  }

  // Neuroticismo Baixo (N < 0.3) - Estabilidade Emocional
  if (profile.N < 0.3) {
    recommendations.push({
      competency: "Gestão de Crises e Pressão",
      description: "Baixo neuroticismo indica estabilidade emocional sob pressão",
      actions: [
        "Liderar projetos críticos e de alta pressão",
        "Atuar em situações de crise e emergência",
        "Mentorar colegas em gestão de estresse",
      ],
      courses: [
        "Gestão de Crises Organizacionais",
        "Liderança em Ambientes de Alta Pressão",
        "Resiliência e Bem-Estar",
      ],
      priority: "high",
      reasoning: "Baixo Neuroticismo indica capacidade de manter calma em situações desafiadoras",
    });
  }

  return recommendations;
}

/**
 * Gera recomendações baseadas em Estilos de Liderança
 */
export function generateLeadershipRecommendations(profile: Record<string, number>): PDIRecommendation[] {
  const recommendations: PDIRecommendation[] = [];

  // Encontrar estilo predominante
  const styles = Object.entries(profile).sort((a, b) => b[1] - a[1]);
  const dominant = styles[0];

  if (dominant[0] === "transformacional" && dominant[1] > 70) {
    recommendations.push({
      competency: "Liderança Transformacional",
      description: "Seu estilo transformacional inspira e motiva equipes para mudanças",
      actions: [
        "Liderar projetos de transformação organizacional",
        "Desenvolver visão estratégica de longo prazo",
        "Mentorar futuros líderes",
      ],
      courses: [
        "Liderança Transformacional Avançada",
        "Gestão de Mudanças Complexas",
        "Visão Estratégica e Inovação",
      ],
      priority: "high",
      reasoning: "Liderança transformacional é ideal para contextos de mudança e inovação",
    });
  }

  if (dominant[0] === "democratico" && dominant[1] > 70) {
    recommendations.push({
      competency: "Liderança Participativa",
      description: "Seu estilo democrático valoriza participação e consenso",
      actions: [
        "Facilitar processos de tomada de decisão coletiva",
        "Implementar metodologias ágeis e colaborativas",
        "Desenvolver cultura de feedback contínuo",
      ],
      courses: [
        "Facilitação de Grupos e Decisões Coletivas",
        "Metodologias Ágeis para Liderança",
        "Cultura de Feedback e Transparência",
      ],
      priority: "high",
      reasoning: "Liderança democrática favorece engajamento e inovação colaborativa",
    });
  }

  return recommendations;
}

/**
 * Gera recomendações baseadas em Âncoras de Carreira
 */
export function generateCareerAnchorsRecommendations(profile: Record<string, number>): PDIRecommendation[] {
  const recommendations: PDIRecommendation[] = [];

  // Encontrar âncora predominante
  const anchors = Object.entries(profile).sort((a, b) => b[1] - a[1]);
  const dominant = anchors[0];

  if (dominant[0] === "competencia_tecnica" && dominant[1] > 70) {
    recommendations.push({
      competency: "Especialização Técnica",
      description: "Sua âncora indica motivação por expertise e domínio técnico",
      actions: [
        "Buscar certificações técnicas avançadas",
        "Participar de comunidades técnicas e conferências",
        "Publicar artigos e compartilhar conhecimento",
      ],
      courses: [
        "Certificações Técnicas Avançadas",
        "Arquitetura e Design de Sistemas",
        "Pesquisa e Desenvolvimento",
      ],
      priority: "high",
      reasoning: "Âncora de Competência Técnica indica satisfação em ser referência especialista",
    });
  }

  if (dominant[0] === "competencia_gerencial" && dominant[1] > 70) {
    recommendations.push({
      competency: "Gestão e Liderança",
      description: "Sua âncora indica motivação por cargos de gestão e liderança",
      actions: [
        "Buscar oportunidades de liderança de equipes",
        "Desenvolver habilidades de gestão estratégica",
        "Participar de programas de desenvolvimento de líderes",
      ],
      courses: [
        "MBA em Gestão Estratégica",
        "Liderança de Equipes de Alta Performance",
        "Gestão Financeira e Orçamentária",
      ],
      priority: "high",
      reasoning: "Âncora Gerencial indica aspiração a posições de liderança organizacional",
    });
  }

  if (dominant[0] === "autonomia" && dominant[1] > 70) {
    recommendations.push({
      competency: "Autonomia e Empreendedorismo",
      description: "Sua âncora indica necessidade de independência e liberdade",
      actions: [
        "Buscar projetos com alta autonomia",
        "Considerar trabalho remoto ou freelance",
        "Desenvolver projetos pessoais e side hustles",
      ],
      courses: [
        "Empreendedorismo e Inovação",
        "Gestão de Carreira Independente",
        "Freelancing e Consultoria",
      ],
      priority: "high",
      reasoning: "Âncora de Autonomia indica satisfação em ambientes com liberdade e flexibilidade",
    });
  }

  return recommendations;
}

/**
 * Gera recomendações consolidadas baseadas em todos os testes disponíveis
 */
export function generateConsolidatedRecommendations(tests: {
  disc?: any;
  bigfive?: any;
  leadership?: any;
  careeranchors?: any;
}): PDIRecommendation[] {
  let allRecommendations: PDIRecommendation[] = [];

  if (tests.disc) {
    allRecommendations = allRecommendations.concat(generateDISCRecommendations(tests.disc));
  }

  if (tests.bigfive) {
    allRecommendations = allRecommendations.concat(generateBigFiveRecommendations(tests.bigfive));
  }

  if (tests.leadership) {
    allRecommendations = allRecommendations.concat(generateLeadershipRecommendations(tests.leadership));
  }

  if (tests.careeranchors) {
    allRecommendations = allRecommendations.concat(generateCareerAnchorsRecommendations(tests.careeranchors));
  }

  // Remover duplicatas e priorizar
  const uniqueRecommendations = allRecommendations.reduce((acc, rec) => {
    const existing = acc.find(r => r.competency === rec.competency);
    if (!existing) {
      acc.push(rec);
    }
    return acc;
  }, [] as PDIRecommendation[]);

  // Ordenar por prioridade
  return uniqueRecommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}
