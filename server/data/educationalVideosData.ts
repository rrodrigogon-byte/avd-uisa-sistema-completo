/**
 * Dados dos 36 Vídeos Educacionais
 * Biblioteca de conteúdo sobre ética, compliance, integridade e desenvolvimento profissional
 */

export interface VideoSeedData {
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number; // em segundos
  categoryName: string;
  tags: string[];
  relatedPIRDimensions: string[]; // IP, ID, IC, ES, FL, AU
  difficultyLevel: "basico" | "intermediario" | "avancado";
  targetAudience: string[];
}

export const educationalVideosData: VideoSeedData[] = [
  // CATEGORIA: Ética e Integridade (12 vídeos)
  {
    title: "Fundamentos da Ética Profissional",
    description: "Introdução aos princípios básicos de ética no ambiente de trabalho, incluindo honestidade, transparência e responsabilidade.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 480,
    categoryName: "Ética e Integridade",
    tags: ["ética", "integridade", "valores", "princípios"],
    relatedPIRDimensions: ["IC", "ES"],
    difficultyLevel: "basico",
    targetAudience: ["todos"]
  },
  {
    title: "Dilemas Éticos no Trabalho: Como Decidir",
    description: "Aprenda a identificar e resolver dilemas éticos comuns no ambiente corporativo com ferramentas práticas de tomada de decisão.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 540,
    categoryName: "Ética e Integridade",
    tags: ["dilemas éticos", "tomada de decisão", "casos práticos"],
    relatedPIRDimensions: ["IC", "ID"],
    difficultyLevel: "intermediario",
    targetAudience: ["todos", "gestores"]
  },
  {
    title: "Conflito de Interesses: Identificação e Prevenção",
    description: "Entenda o que são conflitos de interesse, como identificá-los e as melhores práticas para evitá-los no dia a dia.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 420,
    categoryName: "Ética e Integridade",
    tags: ["conflito de interesses", "prevenção", "compliance"],
    relatedPIRDimensions: ["IC", "ES"],
    difficultyLevel: "intermediario",
    targetAudience: ["todos", "gestores"]
  },
  {
    title: "Integridade na Liderança",
    description: "Como líderes podem cultivar uma cultura de integridade e dar o exemplo através de suas ações e decisões.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 600,
    categoryName: "Ética e Integridade",
    tags: ["liderança", "integridade", "cultura organizacional"],
    relatedPIRDimensions: ["IC", "AU", "ID"],
    difficultyLevel: "avancado",
    targetAudience: ["gestores", "lideranca"]
  },
  {
    title: "Transparência e Accountability",
    description: "A importância da transparência nas relações profissionais e como prestar contas de forma efetiva.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 450,
    categoryName: "Ética e Integridade",
    tags: ["transparência", "accountability", "prestação de contas"],
    relatedPIRDimensions: ["IC", "ES"],
    difficultyLevel: "intermediario",
    targetAudience: ["todos", "gestores"]
  },
  {
    title: "Ética nas Relações com Fornecedores",
    description: "Boas práticas éticas no relacionamento com fornecedores, incluindo negociação justa e prevenção de corrupção.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 480,
    categoryName: "Ética e Integridade",
    tags: ["fornecedores", "negociação", "anticorrupção"],
    relatedPIRDimensions: ["IC", "ID"],
    difficultyLevel: "intermediario",
    targetAudience: ["todos", "gestores"]
  },
  {
    title: "Valores Organizacionais na Prática",
    description: "Como transformar valores organizacionais em comportamentos concretos no dia a dia de trabalho.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 390,
    categoryName: "Ética e Integridade",
    tags: ["valores", "cultura", "comportamento"],
    relatedPIRDimensions: ["IC", "ES", "AU"],
    difficultyLevel: "basico",
    targetAudience: ["todos"]
  },
  {
    title: "Ética Digital e Uso de Tecnologia",
    description: "Princípios éticos no uso de tecnologia, redes sociais e comunicação digital no contexto profissional.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 420,
    categoryName: "Ética e Integridade",
    tags: ["ética digital", "tecnologia", "redes sociais"],
    relatedPIRDimensions: ["IC", "FL"],
    difficultyLevel: "basico",
    targetAudience: ["todos"]
  },
  {
    title: "Whistleblowing: Quando e Como Reportar",
    description: "Entenda a importância do canal de denúncias e como reportar irregularidades de forma segura e efetiva.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 510,
    categoryName: "Ética e Integridade",
    tags: ["denúncias", "canal de ética", "proteção"],
    relatedPIRDimensions: ["IC", "AU"],
    difficultyLevel: "intermediario",
    targetAudience: ["todos"]
  },
  {
    title: "Ética em Situações de Pressão",
    description: "Como manter a integridade e tomar decisões éticas mesmo sob pressão de prazos e resultados.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 450,
    categoryName: "Ética e Integridade",
    tags: ["pressão", "resiliência", "decisões difíceis"],
    relatedPIRDimensions: ["IC", "ES", "AU"],
    difficultyLevel: "avancado",
    targetAudience: ["todos", "gestores"]
  },
  {
    title: "Diversidade e Inclusão Ética",
    description: "A ética da diversidade e inclusão: respeito, equidade e combate a preconceitos no ambiente de trabalho.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 540,
    categoryName: "Ética e Integridade",
    tags: ["diversidade", "inclusão", "respeito"],
    relatedPIRDimensions: ["IC", "ES", "FL"],
    difficultyLevel: "intermediario",
    targetAudience: ["todos", "gestores"]
  },
  {
    title: "Ética e Sustentabilidade Empresarial",
    description: "A relação entre ética empresarial e práticas sustentáveis: responsabilidade social e ambiental.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 480,
    categoryName: "Ética e Integridade",
    tags: ["sustentabilidade", "responsabilidade social", "ESG"],
    relatedPIRDimensions: ["IC", "ES"],
    difficultyLevel: "intermediario",
    targetAudience: ["todos", "gestores", "lideranca"]
  },

  // CATEGORIA: Compliance e Regulamentação (8 vídeos)
  {
    title: "Introdução ao Compliance Corporativo",
    description: "Conceitos fundamentais de compliance: o que é, por que é importante e como funciona na prática.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 420,
    categoryName: "Compliance e Regulamentação",
    tags: ["compliance", "regulamentação", "fundamentos"],
    relatedPIRDimensions: ["IC", "ES"],
    difficultyLevel: "basico",
    targetAudience: ["todos"]
  },
  {
    title: "Lei Anticorrupção Brasileira",
    description: "Entenda a Lei 12.846/2013 (Lei Anticorrupção) e suas implicações para empresas e colaboradores.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 540,
    categoryName: "Compliance e Regulamentação",
    tags: ["anticorrupção", "legislação", "lei 12.846"],
    relatedPIRDimensions: ["IC", "ES"],
    difficultyLevel: "intermediario",
    targetAudience: ["todos", "gestores"]
  },
  {
    title: "LGPD: Proteção de Dados Pessoais",
    description: "Lei Geral de Proteção de Dados: princípios, direitos dos titulares e responsabilidades das organizações.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 600,
    categoryName: "Compliance e Regulamentação",
    tags: ["LGPD", "proteção de dados", "privacidade"],
    relatedPIRDimensions: ["IC", "ES", "FL"],
    difficultyLevel: "intermediario",
    targetAudience: ["todos"]
  },
  {
    title: "Prevenção à Lavagem de Dinheiro",
    description: "Como identificar e prevenir operações suspeitas de lavagem de dinheiro e financiamento ao terrorismo.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 480,
    categoryName: "Compliance e Regulamentação",
    tags: ["lavagem de dinheiro", "PLD-FT", "prevenção"],
    relatedPIRDimensions: ["IC", "ES"],
    difficultyLevel: "avancado",
    targetAudience: ["gestores", "lideranca"]
  },
  {
    title: "Código de Conduta: Guia Prático",
    description: "Como usar o código de conduta da empresa no dia a dia e em situações desafiadoras.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 390,
    categoryName: "Compliance e Regulamentação",
    tags: ["código de conduta", "normas", "diretrizes"],
    relatedPIRDimensions: ["IC", "ES"],
    difficultyLevel: "basico",
    targetAudience: ["todos"]
  },
  {
    title: "Auditoria e Controles Internos",
    description: "A importância dos controles internos e como colaborar com processos de auditoria.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 450,
    categoryName: "Compliance e Regulamentação",
    tags: ["auditoria", "controles internos", "governança"],
    relatedPIRDimensions: ["IC", "ES", "ID"],
    difficultyLevel: "intermediario",
    targetAudience: ["todos", "gestores"]
  },
  {
    title: "Due Diligence de Terceiros",
    description: "Processos de verificação e análise de parceiros, fornecedores e terceiros para mitigar riscos.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 510,
    categoryName: "Compliance e Regulamentação",
    tags: ["due diligence", "terceiros", "gestão de riscos"],
    relatedPIRDimensions: ["IC", "ID"],
    difficultyLevel: "avancado",
    targetAudience: ["gestores", "lideranca"]
  },
  {
    title: "Gestão de Riscos de Compliance",
    description: "Como identificar, avaliar e mitigar riscos de compliance na sua área de atuação.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 540,
    categoryName: "Compliance e Regulamentação",
    tags: ["gestão de riscos", "compliance", "mitigação"],
    relatedPIRDimensions: ["IC", "ES", "ID"],
    difficultyLevel: "avancado",
    targetAudience: ["gestores", "lideranca"]
  },

  // CATEGORIA: Desenvolvimento Profissional (10 vídeos)
  {
    title: "Inteligência Emocional no Trabalho",
    description: "Desenvolva sua inteligência emocional para melhorar relacionamentos e performance profissional.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 480,
    categoryName: "Desenvolvimento Profissional",
    tags: ["inteligência emocional", "autoconhecimento", "soft skills"],
    relatedPIRDimensions: ["ES", "AU", "FL"],
    difficultyLevel: "intermediario",
    targetAudience: ["todos"]
  },
  {
    title: "Comunicação Assertiva e Efetiva",
    description: "Técnicas de comunicação clara, respeitosa e eficaz para melhorar suas interações profissionais.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 420,
    categoryName: "Desenvolvimento Profissional",
    tags: ["comunicação", "assertividade", "relacionamento"],
    relatedPIRDimensions: ["ID", "FL", "ES"],
    difficultyLevel: "basico",
    targetAudience: ["todos"]
  },
  {
    title: "Gestão do Tempo e Produtividade",
    description: "Estratégias práticas para gerenciar seu tempo, priorizar tarefas e aumentar sua produtividade.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 450,
    categoryName: "Desenvolvimento Profissional",
    tags: ["gestão do tempo", "produtividade", "organização"],
    relatedPIRDimensions: ["AU", "ES", "ID"],
    difficultyLevel: "basico",
    targetAudience: ["todos"]
  },
  {
    title: "Trabalho em Equipe e Colaboração",
    description: "Como ser um membro efetivo de equipe e promover colaboração produtiva.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 390,
    categoryName: "Desenvolvimento Profissional",
    tags: ["trabalho em equipe", "colaboração", "sinergia"],
    relatedPIRDimensions: ["ID", "FL", "ES"],
    difficultyLevel: "basico",
    targetAudience: ["todos"]
  },
  {
    title: "Resolução de Conflitos",
    description: "Técnicas para identificar, mediar e resolver conflitos de forma construtiva.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 510,
    categoryName: "Desenvolvimento Profissional",
    tags: ["resolução de conflitos", "mediação", "negociação"],
    relatedPIRDimensions: ["ID", "ES", "FL"],
    difficultyLevel: "intermediario",
    targetAudience: ["todos", "gestores"]
  },
  {
    title: "Pensamento Crítico e Tomada de Decisão",
    description: "Desenvolva habilidades de análise crítica e tome decisões mais fundamentadas e eficazes.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 480,
    categoryName: "Desenvolvimento Profissional",
    tags: ["pensamento crítico", "tomada de decisão", "análise"],
    relatedPIRDimensions: ["ID", "IC", "AU"],
    difficultyLevel: "intermediario",
    targetAudience: ["todos", "gestores"]
  },
  {
    title: "Adaptabilidade e Resiliência",
    description: "Como desenvolver resiliência e se adaptar rapidamente a mudanças no ambiente de trabalho.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 420,
    categoryName: "Desenvolvimento Profissional",
    tags: ["adaptabilidade", "resiliência", "mudança"],
    relatedPIRDimensions: ["FL", "ES", "AU"],
    difficultyLevel: "intermediario",
    targetAudience: ["todos"]
  },
  {
    title: "Feedback: Dar e Receber",
    description: "A arte de dar e receber feedback construtivo para crescimento profissional contínuo.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 390,
    categoryName: "Desenvolvimento Profissional",
    tags: ["feedback", "desenvolvimento", "comunicação"],
    relatedPIRDimensions: ["ID", "FL", "AU"],
    difficultyLevel: "intermediario",
    targetAudience: ["todos", "gestores"]
  },
  {
    title: "Liderança Situacional",
    description: "Aprenda a adaptar seu estilo de liderança de acordo com a situação e a maturidade da equipe.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 540,
    categoryName: "Desenvolvimento Profissional",
    tags: ["liderança", "gestão de pessoas", "adaptação"],
    relatedPIRDimensions: ["AU", "FL", "ID"],
    difficultyLevel: "avancado",
    targetAudience: ["gestores", "lideranca"]
  },
  {
    title: "Inovação e Criatividade",
    description: "Técnicas para estimular o pensamento criativo e promover inovação no seu trabalho.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 450,
    categoryName: "Desenvolvimento Profissional",
    tags: ["inovação", "criatividade", "solução de problemas"],
    relatedPIRDimensions: ["FL", "AU", "ID"],
    difficultyLevel: "intermediario",
    targetAudience: ["todos"]
  },

  // CATEGORIA: Bem-estar e Qualidade de Vida (6 vídeos)
  {
    title: "Equilíbrio Trabalho-Vida Pessoal",
    description: "Estratégias para manter um equilíbrio saudável entre vida profissional e pessoal.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 420,
    categoryName: "Bem-estar e Qualidade de Vida",
    tags: ["equilíbrio", "qualidade de vida", "bem-estar"],
    relatedPIRDimensions: ["ES", "AU"],
    difficultyLevel: "basico",
    targetAudience: ["todos"]
  },
  {
    title: "Gestão do Estresse no Trabalho",
    description: "Técnicas práticas para identificar, prevenir e gerenciar o estresse profissional.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 450,
    categoryName: "Bem-estar e Qualidade de Vida",
    tags: ["estresse", "saúde mental", "bem-estar"],
    relatedPIRDimensions: ["ES", "AU", "FL"],
    difficultyLevel: "basico",
    targetAudience: ["todos"]
  },
  {
    title: "Mindfulness no Ambiente Corporativo",
    description: "Práticas de atenção plena para melhorar foco, reduzir ansiedade e aumentar bem-estar.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 390,
    categoryName: "Bem-estar e Qualidade de Vida",
    tags: ["mindfulness", "meditação", "foco"],
    relatedPIRDimensions: ["ES", "AU"],
    difficultyLevel: "basico",
    targetAudience: ["todos"]
  },
  {
    title: "Saúde Mental no Trabalho",
    description: "A importância da saúde mental, sinais de alerta e recursos disponíveis para suporte.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 480,
    categoryName: "Bem-estar e Qualidade de Vida",
    tags: ["saúde mental", "apoio psicológico", "prevenção"],
    relatedPIRDimensions: ["ES", "AU"],
    difficultyLevel: "intermediario",
    targetAudience: ["todos", "gestores"]
  },
  {
    title: "Ergonomia e Saúde Física",
    description: "Boas práticas de ergonomia e cuidados com a saúde física no ambiente de trabalho.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 360,
    categoryName: "Bem-estar e Qualidade de Vida",
    tags: ["ergonomia", "saúde física", "prevenção"],
    relatedPIRDimensions: ["ES", "AU"],
    difficultyLevel: "basico",
    targetAudience: ["todos"]
  },
  {
    title: "Energia e Motivação Sustentável",
    description: "Como manter níveis saudáveis de energia e motivação ao longo do tempo.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 420,
    categoryName: "Bem-estar e Qualidade de Vida",
    tags: ["motivação", "energia", "sustentabilidade"],
    relatedPIRDimensions: ["ES", "AU", "FL"],
    difficultyLevel: "intermediario",
    targetAudience: ["todos"]
  }
];

export const videoCategoriesData = [
  {
    name: "Ética e Integridade",
    description: "Vídeos sobre princípios éticos, integridade profissional e tomada de decisão ética",
    icon: "Shield",
    displayOrder: 1
  },
  {
    name: "Compliance e Regulamentação",
    description: "Conteúdo sobre leis, regulamentos e práticas de compliance corporativo",
    icon: "FileText",
    displayOrder: 2
  },
  {
    name: "Desenvolvimento Profissional",
    description: "Habilidades e competências para crescimento e desenvolvimento na carreira",
    icon: "TrendingUp",
    displayOrder: 3
  },
  {
    name: "Bem-estar e Qualidade de Vida",
    description: "Saúde mental, física e equilíbrio entre vida pessoal e profissional",
    icon: "Heart",
    displayOrder: 4
  }
];
