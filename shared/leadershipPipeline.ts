/**
 * Leadership Pipeline - Biblioteca de Competências por Nível Hierárquico
 * 
 * Baseado no modelo de Ram Charan, Stephen Drotter e James Noel
 * "The Leadership Pipeline: How to Build the Leadership Powered Company"
 * 
 * Este modelo define 6 níveis de liderança com competências específicas:
 * 1. Nível 1: Operacional (Individual Contributor)
 * 2. Nível 2: Coordenação (First-Line Manager)
 * 3. Nível 3: Gerência (Manager of Managers)
 * 4. Nível 4: Diretoria (Functional Manager)
 * 5. Nível 5: Executivo (Business Manager)
 * 6. Nível 6: CEO (Enterprise Manager)
 */

export interface Competencia {
  id: string;
  nome: string;
  descricao: string;
  categoria: "tecnica" | "comportamental" | "lideranca" | "estrategica";
  peso: number; // 1-5 (importância)
}

export interface TemplateAvaliacao {
  id: string;
  nivel: string;
  titulo: string;
  descricao: string;
  competencias: Competencia[];
  focoTrabalho: string[];
  habilidadesChave: string[];
  valoresTemporais: string[];
}

/**
 * NÍVEL 1: OPERACIONAL (Individual Contributor)
 * Foco: Execução técnica, resultados individuais
 */
export const TEMPLATE_OPERACIONAL: TemplateAvaliacao = {
  id: "nivel-1-operacional",
  nivel: "Operacional",
  titulo: "Avaliação 360° - Nível Operacional",
  descricao: "Para profissionais que executam tarefas técnicas e entregam resultados individuais",
  focoTrabalho: [
    "Execução de tarefas e projetos",
    "Qualidade técnica do trabalho",
    "Cumprimento de prazos",
    "Aprendizado contínuo"
  ],
  habilidadesChave: [
    "Domínio técnico da função",
    "Organização pessoal",
    "Comunicação clara",
    "Trabalho em equipe"
  ],
  valoresTemporais: [
    "Foco em resultados de curto prazo (diário/semanal)",
    "Entregas pontuais",
    "Resolução rápida de problemas"
  ],
  competencias: [
    {
      id: "op-01",
      nome: "Conhecimento Técnico",
      descricao: "Domina as ferramentas, processos e conhecimentos necessários para executar suas atividades",
      categoria: "tecnica",
      peso: 5
    },
    {
      id: "op-02",
      nome: "Qualidade de Entrega",
      descricao: "Entrega trabalhos com alto padrão de qualidade, atenção aos detalhes e conformidade",
      categoria: "tecnica",
      peso: 5
    },
    {
      id: "op-03",
      nome: "Produtividade",
      descricao: "Gerencia bem o tempo, cumpre prazos e mantém alto volume de entregas",
      categoria: "tecnica",
      peso: 4
    },
    {
      id: "op-04",
      nome: "Aprendizado Contínuo",
      descricao: "Busca constantemente aprender novas habilidades e se desenvolver tecnicamente",
      categoria: "comportamental",
      peso: 4
    },
    {
      id: "op-05",
      nome: "Comunicação",
      descricao: "Comunica-se de forma clara, objetiva e respeitosa com colegas e gestores",
      categoria: "comportamental",
      peso: 4
    },
    {
      id: "op-06",
      nome: "Trabalho em Equipe",
      descricao: "Colabora ativamente com colegas, compartilha conhecimento e apoia o time",
      categoria: "comportamental",
      peso: 4
    },
    {
      id: "op-07",
      nome: "Proatividade",
      descricao: "Toma iniciativa para resolver problemas e propor melhorias sem esperar ordens",
      categoria: "comportamental",
      peso: 3
    },
    {
      id: "op-08",
      nome: "Adaptabilidade",
      descricao: "Adapta-se rapidamente a mudanças de prioridades, processos e ferramentas",
      categoria: "comportamental",
      peso: 3
    }
  ]
};

/**
 * NÍVEL 2: COORDENAÇÃO (First-Line Manager)
 * Foco: Gestão de pessoas, desenvolvimento de equipe
 */
export const TEMPLATE_COORDENACAO: TemplateAvaliacao = {
  id: "nivel-2-coordenacao",
  nivel: "Coordenação",
  titulo: "Avaliação 360° - Nível Coordenação",
  descricao: "Para coordenadores e supervisores que gerenciam equipes operacionais",
  focoTrabalho: [
    "Gestão de pessoas e desenvolvimento de equipe",
    "Planejamento operacional",
    "Monitoramento de performance",
    "Resolução de conflitos"
  ],
  habilidadesChave: [
    "Delegação eficaz",
    "Feedback construtivo",
    "Coaching de equipe",
    "Gestão de tempo da equipe"
  ],
  valoresTemporais: [
    "Foco em resultados de curto a médio prazo (semanal/mensal)",
    "Ciclos de planejamento mensais",
    "Acompanhamento diário da equipe"
  ],
  competencias: [
    {
      id: "coord-01",
      nome: "Gestão de Pessoas",
      descricao: "Gerencia efetivamente a equipe, distribui tarefas e monitora performance individual",
      categoria: "lideranca",
      peso: 5
    },
    {
      id: "coord-02",
      nome: "Desenvolvimento de Equipe",
      descricao: "Desenvolve habilidades da equipe através de coaching, feedback e treinamento",
      categoria: "lideranca",
      peso: 5
    },
    {
      id: "coord-03",
      nome: "Planejamento Operacional",
      descricao: "Planeja atividades da equipe, define prioridades e garante cumprimento de metas",
      categoria: "lideranca",
      peso: 4
    },
    {
      id: "coord-04",
      nome: "Comunicação com a Equipe",
      descricao: "Comunica claramente expectativas, metas e feedback para a equipe",
      categoria: "comportamental",
      peso: 4
    },
    {
      id: "coord-05",
      nome: "Resolução de Conflitos",
      descricao: "Identifica e resolve conflitos na equipe de forma construtiva e imparcial",
      categoria: "lideranca",
      peso: 4
    },
    {
      id: "coord-06",
      nome: "Delegação",
      descricao: "Delega tarefas adequadamente, empodera a equipe e evita microgerenciamento",
      categoria: "lideranca",
      peso: 4
    },
    {
      id: "coord-07",
      nome: "Monitoramento de Performance",
      descricao: "Acompanha indicadores, identifica desvios e toma ações corretivas rapidamente",
      categoria: "lideranca",
      peso: 3
    },
    {
      id: "coord-08",
      nome: "Tomada de Decisão",
      descricao: "Toma decisões operacionais de forma ágil e assertiva",
      categoria: "lideranca",
      peso: 3
    }
  ]
};

/**
 * NÍVEL 3: GERÊNCIA (Manager of Managers)
 * Foco: Gestão de gestores, estratégia departamental
 */
export const TEMPLATE_GERENCIA: TemplateAvaliacao = {
  id: "nivel-3-gerencia",
  nivel: "Gerência",
  titulo: "Avaliação 360° - Nível Gerência",
  descricao: "Para gerentes que lideram coordenadores e supervisores",
  focoTrabalho: [
    "Gestão de gestores",
    "Estratégia departamental",
    "Alocação de recursos",
    "Integração entre áreas"
  ],
  habilidadesChave: [
    "Pensamento estratégico",
    "Desenvolvimento de líderes",
    "Gestão de múltiplas equipes",
    "Visão sistêmica"
  ],
  valoresTemporais: [
    "Foco em resultados de médio prazo (trimestral/semestral)",
    "Planejamento trimestral",
    "Revisões mensais de estratégia"
  ],
  competencias: [
    {
      id: "ger-01",
      nome: "Gestão de Gestores",
      descricao: "Desenvolve e orienta coordenadores/supervisores, garantindo alinhamento e performance",
      categoria: "lideranca",
      peso: 5
    },
    {
      id: "ger-02",
      nome: "Pensamento Estratégico",
      descricao: "Define estratégias departamentais alinhadas aos objetivos organizacionais",
      categoria: "estrategica",
      peso: 5
    },
    {
      id: "ger-03",
      nome: "Gestão de Recursos",
      descricao: "Aloca recursos (pessoas, orçamento, tempo) de forma eficiente entre as áreas",
      categoria: "estrategica",
      peso: 4
    },
    {
      id: "ger-04",
      nome: "Visão Sistêmica",
      descricao: "Compreende interdependências entre áreas e toma decisões considerando o todo",
      categoria: "estrategica",
      peso: 4
    },
    {
      id: "ger-05",
      nome: "Desenvolvimento de Líderes",
      descricao: "Desenvolve pipeline de liderança, prepara sucessores e promove crescimento",
      categoria: "lideranca",
      peso: 4
    },
    {
      id: "ger-06",
      nome: "Gestão de Mudanças",
      descricao: "Lidera processos de mudança, engaja equipes e garante transições suaves",
      categoria: "lideranca",
      peso: 4
    },
    {
      id: "ger-07",
      nome: "Comunicação Executiva",
      descricao: "Comunica-se efetivamente com diretoria, pares e equipes sobre estratégia e resultados",
      categoria: "comportamental",
      peso: 3
    },
    {
      id: "ger-08",
      nome: "Gestão de Performance",
      descricao: "Define KPIs, monitora resultados e implementa melhorias contínuas",
      categoria: "lideranca",
      peso: 3
    }
  ]
};

/**
 * NÍVEL 4: DIRETORIA (Functional Manager)
 * Foco: Estratégia funcional, integração multifuncional
 */
export const TEMPLATE_DIRETORIA: TemplateAvaliacao = {
  id: "nivel-4-diretoria",
  nivel: "Diretoria",
  titulo: "Avaliação 360° - Nível Diretoria",
  descricao: "Para diretores que lideram múltiplas gerências e definem estratégia funcional",
  focoTrabalho: [
    "Estratégia funcional de longo prazo",
    "Integração com outras diretorias",
    "Gestão de orçamento significativo",
    "Representação institucional"
  ],
  habilidadesChave: [
    "Visão estratégica de longo prazo",
    "Influência sem autoridade",
    "Gestão de stakeholders",
    "Pensamento sistêmico"
  ],
  valoresTemporais: [
    "Foco em resultados de longo prazo (anual/plurianual)",
    "Planejamento anual",
    "Revisões trimestrais de estratégia"
  ],
  competencias: [
    {
      id: "dir-01",
      nome: "Visão Estratégica",
      descricao: "Define visão e estratégia de longo prazo para a função, antecipando tendências",
      categoria: "estrategica",
      peso: 5
    },
    {
      id: "dir-02",
      nome: "Liderança de Líderes",
      descricao: "Lidera e desenvolve gerentes, criando cultura de alta performance",
      categoria: "lideranca",
      peso: 5
    },
    {
      id: "dir-03",
      nome: "Gestão Orçamentária",
      descricao: "Gerencia orçamentos significativos, prioriza investimentos e garante ROI",
      categoria: "estrategica",
      peso: 4
    },
    {
      id: "dir-04",
      nome: "Integração Multifuncional",
      descricao: "Colabora com outras diretorias para garantir alinhamento e sinergia organizacional",
      categoria: "estrategica",
      peso: 4
    },
    {
      id: "dir-05",
      nome: "Gestão de Stakeholders",
      descricao: "Gerencia relacionamentos com stakeholders internos e externos estratégicos",
      categoria: "lideranca",
      peso: 4
    },
    {
      id: "dir-06",
      nome: "Tomada de Decisão Estratégica",
      descricao: "Toma decisões complexas com impacto significativo no negócio",
      categoria: "estrategica",
      peso: 4
    },
    {
      id: "dir-07",
      nome: "Inovação e Transformação",
      descricao: "Promove inovação, lidera transformações e posiciona a função para o futuro",
      categoria: "estrategica",
      peso: 3
    },
    {
      id: "dir-08",
      nome: "Representação Institucional",
      descricao: "Representa a organização externamente, constrói reputação e network estratégico",
      categoria: "comportamental",
      peso: 3
    }
  ]
};

/**
 * NÍVEL 5: EXECUTIVO (Business Manager)
 * Foco: Gestão de P&L, resultados de negócio
 */
export const TEMPLATE_EXECUTIVO: TemplateAvaliacao = {
  id: "nivel-5-executivo",
  nivel: "Executivo",
  titulo: "Avaliação 360° - Nível Executivo",
  descricao: "Para executivos C-Level que gerenciam unidades de negócio ou áreas corporativas",
  focoTrabalho: [
    "Gestão de P&L (Profit & Loss)",
    "Resultados de negócio",
    "Estratégia corporativa",
    "Governança e compliance"
  ],
  habilidadesChave: [
    "Visão de negócio",
    "Gestão de múltiplas funções",
    "Liderança transformacional",
    "Pensamento estratégico corporativo"
  ],
  valoresTemporais: [
    "Foco em resultados plurianuais (3-5 anos)",
    "Planejamento estratégico de longo prazo",
    "Revisões trimestrais de negócio"
  ],
  competencias: [
    {
      id: "exec-01",
      nome: "Gestão de P&L",
      descricao: "Gerencia receitas, custos e lucratividade, garantindo sustentabilidade financeira",
      categoria: "estrategica",
      peso: 5
    },
    {
      id: "exec-02",
      nome: "Visão de Negócio",
      descricao: "Compreende profundamente o negócio, mercado, concorrência e oportunidades",
      categoria: "estrategica",
      peso: 5
    },
    {
      id: "exec-03",
      nome: "Liderança Transformacional",
      descricao: "Inspira e mobiliza a organização para alcançar resultados extraordinários",
      categoria: "lideranca",
      peso: 4
    },
    {
      id: "exec-04",
      nome: "Estratégia Corporativa",
      descricao: "Define e executa estratégia corporativa alinhada à visão de longo prazo",
      categoria: "estrategica",
      peso: 4
    },
    {
      id: "exec-05",
      nome: "Gestão de Múltiplas Funções",
      descricao: "Integra e alinha múltiplas funções (vendas, operações, finanças, etc.)",
      categoria: "estrategica",
      peso: 4
    },
    {
      id: "exec-06",
      nome: "Desenvolvimento de Talento Executivo",
      descricao: "Desenvolve pipeline executivo, prepara sucessores e atrai top talent",
      categoria: "lideranca",
      peso: 4
    },
    {
      id: "exec-07",
      nome: "Governança e Compliance",
      descricao: "Garante governança corporativa, compliance e gestão de riscos",
      categoria: "estrategica",
      peso: 3
    },
    {
      id: "exec-08",
      nome: "Relacionamento com Conselho/Acionistas",
      descricao: "Gerencia relacionamento com conselho, acionistas e investidores",
      categoria: "comportamental",
      peso: 3
    }
  ]
};

/**
 * Mapeamento de templates por nível hierárquico
 */
export const TEMPLATES_POR_NIVEL: Record<string, TemplateAvaliacao> = {
  "operacional": TEMPLATE_OPERACIONAL,
  "supervisao": TEMPLATE_COORDENACAO,
  "coordenacao": TEMPLATE_COORDENACAO,
  "gerencia": TEMPLATE_GERENCIA,
  "diretoria": TEMPLATE_DIRETORIA,
  "executivo": TEMPLATE_EXECUTIVO,
};

/**
 * Função auxiliar para obter template por nível
 */
export function getTemplatePorNivel(nivel: string): TemplateAvaliacao | null {
  return TEMPLATES_POR_NIVEL[nivel.toLowerCase()] || null;
}

/**
 * Função auxiliar para listar todos os templates
 */
export function listarTodosTemplates(): TemplateAvaliacao[] {
  return [
    TEMPLATE_OPERACIONAL,
    TEMPLATE_COORDENACAO,
    TEMPLATE_GERENCIA,
    TEMPLATE_DIRETORIA,
    TEMPLATE_EXECUTIVO,
  ];
}
