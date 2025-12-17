/**
 * Script de Seed - Competências e Metas SMART
 * Sistema AVD UISA - Ciclo 2025/2026
 * 
 * Baseado em boas práticas de RH e setor agroindustrial
 * para usina de cana-de-açúcar, energia e etanol
 */

import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não configurada');
  process.exit(1);
}

// ============================================================================
// COMPETÊNCIAS TÉCNICAS POR ÁREA
// ============================================================================

const competenciasTecnicas = [
  // ÁREA AGRÍCOLA
  {
    code: 'TEC-AGR-001',
    name: 'Gestão de Plantio e Colheita',
    description: 'Capacidade de planejar, executar e monitorar operações de plantio e colheita de cana-de-açúcar, considerando fatores climáticos, variedades de cana e otimização de recursos.',
    category: 'tecnica'
  },
  {
    code: 'TEC-AGR-002',
    name: 'Manejo de Solo e Irrigação',
    description: 'Conhecimento em técnicas de preparo do solo, correção de acidez, adubação, sistemas de irrigação e drenagem para maximizar a produtividade agrícola.',
    category: 'tecnica'
  },
  {
    code: 'TEC-AGR-003',
    name: 'Controle Fitossanitário',
    description: 'Habilidade em identificar, prevenir e controlar pragas, doenças e plantas daninhas utilizando métodos integrados de manejo (MIP).',
    category: 'tecnica'
  },
  {
    code: 'TEC-AGR-004',
    name: 'Operação de Máquinas Agrícolas',
    description: 'Competência na operação e manutenção preventiva de tratores, colhedoras, plantadoras e implementos agrícolas.',
    category: 'tecnica'
  },
  {
    code: 'TEC-AGR-005',
    name: 'Agricultura de Precisão',
    description: 'Domínio de tecnologias de agricultura de precisão: GPS, drones, sensoriamento remoto, mapas de produtividade e aplicação em taxa variável.',
    category: 'tecnica'
  },
  {
    code: 'TEC-AGR-006',
    name: 'Gestão de Frota e Logística Agrícola',
    description: 'Capacidade de coordenar a logística de transporte de cana (CTT), otimização de rotas e gestão de frota agrícola.',
    category: 'tecnica'
  },

  // ÁREA INDUSTRIAL
  {
    code: 'TEC-IND-001',
    name: 'Processo de Moagem e Extração',
    description: 'Conhecimento técnico em operação de moendas, difusores, preparo de cana e maximização da extração de caldo.',
    category: 'tecnica'
  },
  {
    code: 'TEC-IND-002',
    name: 'Tratamento de Caldo',
    description: 'Domínio dos processos de tratamento de caldo: sulfitação, caleagem, aquecimento, decantação e filtração.',
    category: 'tecnica'
  },
  {
    code: 'TEC-IND-003',
    name: 'Evaporação e Cristalização',
    description: 'Competência na operação de evaporadores, cozedores e cristalizadores para produção de açúcar de alta qualidade.',
    category: 'tecnica'
  },
  {
    code: 'TEC-IND-004',
    name: 'Centrifugação e Secagem',
    description: 'Habilidade na operação de centrífugas, secadores e ensacadeiras para finalização do produto açúcar.',
    category: 'tecnica'
  },
  {
    code: 'TEC-IND-005',
    name: 'Controle de Qualidade Industrial',
    description: 'Conhecimento em análises laboratoriais, controle de processo, especificações de produto e normas de qualidade (ISO, FSSC 22000).',
    category: 'tecnica'
  },
  {
    code: 'TEC-IND-006',
    name: 'Manutenção Industrial',
    description: 'Competência em manutenção preventiva, preditiva e corretiva de equipamentos industriais, incluindo planejamento de paradas.',
    category: 'tecnica'
  },

  // ÁREA DE ENERGIA (COGERAÇÃO)
  {
    code: 'TEC-ENE-001',
    name: 'Operação de Caldeiras',
    description: 'Domínio na operação de caldeiras de alta pressão, controle de combustão, tratamento de água e segurança operacional.',
    category: 'tecnica'
  },
  {
    code: 'TEC-ENE-002',
    name: 'Operação de Turbinas e Geradores',
    description: 'Competência na operação de turbogeradores, sistemas de condensação e controle de geração de energia elétrica.',
    category: 'tecnica'
  },
  {
    code: 'TEC-ENE-003',
    name: 'Gestão de Biomassa',
    description: 'Conhecimento em gestão de bagaço, palha e outros resíduos como combustível para cogeração de energia.',
    category: 'tecnica'
  },
  {
    code: 'TEC-ENE-004',
    name: 'Conexão e Comercialização de Energia',
    description: 'Entendimento de regulamentação ANEEL, contratos de comercialização de energia, operação no mercado livre e conexão com a rede.',
    category: 'tecnica'
  },
  {
    code: 'TEC-ENE-005',
    name: 'Eficiência Energética',
    description: 'Capacidade de identificar e implementar melhorias de eficiência energética em processos industriais e cogeração.',
    category: 'tecnica'
  },

  // ÁREA DE ETANOL (DESTILARIA)
  {
    code: 'TEC-ETA-001',
    name: 'Fermentação Alcoólica',
    description: 'Domínio do processo fermentativo: preparo de mosto, controle de leveduras, temperatura, pH e rendimento fermentativo.',
    category: 'tecnica'
  },
  {
    code: 'TEC-ETA-002',
    name: 'Destilação e Retificação',
    description: 'Competência na operação de colunas de destilação, retificação e desidratação para produção de etanol hidratado e anidro.',
    category: 'tecnica'
  },
  {
    code: 'TEC-ETA-003',
    name: 'Tratamento de Vinhaça e Resíduos',
    description: 'Conhecimento em sistemas de tratamento, biodigestão, fertirrigação e aproveitamento de vinhaça e outros efluentes.',
    category: 'tecnica'
  },
  {
    code: 'TEC-ETA-004',
    name: 'Controle de Qualidade de Etanol',
    description: 'Habilidade em análises de qualidade do etanol conforme especificações ANP e controle de processo de destilaria.',
    category: 'tecnica'
  },
  {
    code: 'TEC-ETA-005',
    name: 'Otimização de Rendimento Industrial',
    description: 'Capacidade de analisar e otimizar o rendimento industrial (RTC, ART, eficiência fermentativa) e reduzir perdas.',
    category: 'tecnica'
  },

  // ÁREA ADMINISTRATIVA
  {
    code: 'TEC-ADM-001',
    name: 'Gestão Financeira e Orçamentária',
    description: 'Competência em planejamento financeiro, controle orçamentário, análise de custos e indicadores financeiros do setor sucroenergético.',
    category: 'tecnica'
  },
  {
    code: 'TEC-ADM-002',
    name: 'Gestão de Contratos e Compras',
    description: 'Habilidade em negociação, gestão de contratos com fornecedores, processos de compras e gestão de estoque.',
    category: 'tecnica'
  },
  {
    code: 'TEC-ADM-003',
    name: 'Sistemas de Gestão Integrada',
    description: 'Domínio de sistemas ERP (SAP, TOTVS), sistemas agrícolas e ferramentas de Business Intelligence.',
    category: 'tecnica'
  },
  {
    code: 'TEC-ADM-004',
    name: 'Gestão de Pessoas e DHO',
    description: 'Conhecimento em recrutamento, treinamento, desenvolvimento, avaliação de desempenho e relações trabalhistas no setor agroindustrial.',
    category: 'tecnica'
  },
  {
    code: 'TEC-ADM-005',
    name: 'Segurança do Trabalho e Meio Ambiente',
    description: 'Competência em normas regulamentadoras (NRs), gestão ambiental, licenciamento e sustentabilidade no setor sucroenergético.',
    category: 'tecnica'
  },
  {
    code: 'TEC-ADM-006',
    name: 'Compliance e Certificações',
    description: 'Conhecimento em certificações do setor (Bonsucro, RenovaBio, ISO 14001) e conformidade regulatória.',
    category: 'tecnica'
  }
];

// ============================================================================
// COMPETÊNCIAS COMPORTAMENTAIS (BOAS PRÁTICAS RH)
// ============================================================================

const competenciasComportamentais = [
  {
    code: 'COMP-001',
    name: 'Orientação para Resultados',
    description: 'Capacidade de estabelecer metas desafiadoras, manter foco na entrega de resultados e superar obstáculos para atingir objetivos organizacionais.',
    category: 'comportamental'
  },
  {
    code: 'COMP-002',
    name: 'Trabalho em Equipe',
    description: 'Habilidade de colaborar efetivamente com colegas, compartilhar conhecimentos, apoiar o time e contribuir para um ambiente de trabalho positivo.',
    category: 'comportamental'
  },
  {
    code: 'COMP-003',
    name: 'Comunicação Eficaz',
    description: 'Capacidade de transmitir informações de forma clara, objetiva e assertiva, tanto verbalmente quanto por escrito, adaptando-se ao público.',
    category: 'comportamental'
  },
  {
    code: 'COMP-004',
    name: 'Resolução de Problemas',
    description: 'Habilidade de identificar problemas, analisar causas raízes, propor soluções criativas e tomar decisões baseadas em dados e fatos.',
    category: 'comportamental'
  },
  {
    code: 'COMP-005',
    name: 'Adaptabilidade e Flexibilidade',
    description: 'Capacidade de se adaptar a mudanças, lidar com incertezas, aprender continuamente e ajustar comportamentos conforme necessário.',
    category: 'comportamental'
  },
  {
    code: 'COMP-006',
    name: 'Proatividade e Iniciativa',
    description: 'Disposição para antecipar necessidades, propor melhorias, assumir responsabilidades além do esperado e agir sem necessidade de supervisão constante.',
    category: 'comportamental'
  },
  {
    code: 'COMP-007',
    name: 'Comprometimento e Responsabilidade',
    description: 'Dedicação ao trabalho, cumprimento de prazos e compromissos, assumindo responsabilidade pelos resultados de suas ações.',
    category: 'comportamental'
  },
  {
    code: 'COMP-008',
    name: 'Ética e Integridade',
    description: 'Atuação com honestidade, transparência e respeito aos valores organizacionais, normas e políticas da empresa.',
    category: 'comportamental'
  },
  {
    code: 'COMP-009',
    name: 'Foco no Cliente',
    description: 'Orientação para entender e atender as necessidades de clientes internos e externos, buscando sua satisfação e fidelização.',
    category: 'comportamental'
  },
  {
    code: 'COMP-010',
    name: 'Gestão do Tempo e Organização',
    description: 'Capacidade de priorizar tarefas, gerenciar múltiplas demandas, cumprir prazos e manter organização no trabalho.',
    category: 'comportamental'
  },
  {
    code: 'COMP-011',
    name: 'Resiliência',
    description: 'Capacidade de lidar com pressão, frustrações e adversidades, mantendo equilíbrio emocional e desempenho consistente.',
    category: 'comportamental'
  },
  {
    code: 'COMP-012',
    name: 'Consciência de Segurança',
    description: 'Comprometimento com práticas seguras de trabalho, identificação de riscos e promoção de um ambiente seguro para todos.',
    category: 'comportamental'
  }
];

// ============================================================================
// COMPETÊNCIAS DE LIDERANÇA
// ============================================================================

const competenciasLideranca = [
  {
    code: 'LID-001',
    name: 'Visão Estratégica',
    description: 'Capacidade de compreender o cenário macro, antecipar tendências, definir direcionamento estratégico e alinhar a equipe aos objetivos organizacionais.',
    category: 'lideranca'
  },
  {
    code: 'LID-002',
    name: 'Desenvolvimento de Pessoas',
    description: 'Habilidade de identificar potenciais, fornecer feedback construtivo, desenvolver talentos e preparar sucessores.',
    category: 'lideranca'
  },
  {
    code: 'LID-003',
    name: 'Gestão de Equipes',
    description: 'Competência em formar, motivar e liderar equipes de alto desempenho, delegando responsabilidades e promovendo engajamento.',
    category: 'lideranca'
  },
  {
    code: 'LID-004',
    name: 'Tomada de Decisão',
    description: 'Capacidade de analisar cenários complexos, avaliar riscos e tomar decisões assertivas em tempo hábil.',
    category: 'lideranca'
  },
  {
    code: 'LID-005',
    name: 'Gestão de Mudanças',
    description: 'Habilidade de liderar processos de mudança, comunicar visão, engajar stakeholders e superar resistências.',
    category: 'lideranca'
  },
  {
    code: 'LID-006',
    name: 'Influência e Negociação',
    description: 'Capacidade de influenciar pessoas e grupos, negociar acordos e construir consensos em situações complexas.',
    category: 'lideranca'
  },
  {
    code: 'LID-007',
    name: 'Gestão de Conflitos',
    description: 'Habilidade de identificar, mediar e resolver conflitos de forma construtiva, mantendo relacionamentos produtivos.',
    category: 'lideranca'
  },
  {
    code: 'LID-008',
    name: 'Pensamento Sistêmico',
    description: 'Capacidade de compreender interdependências entre áreas, processos e decisões, considerando impactos no todo organizacional.',
    category: 'lideranca'
  }
];

// ============================================================================
// NÍVEIS DE PROFICIÊNCIA (1-5)
// ============================================================================

const niveisProficiencia = [
  {
    level: 1,
    name: 'Básico',
    description: 'Conhecimento inicial. Necessita supervisão constante e orientação para executar tarefas. Em fase de aprendizado dos conceitos fundamentais.'
  },
  {
    level: 2,
    name: 'Em Desenvolvimento',
    description: 'Conhecimento em desenvolvimento. Executa tarefas rotineiras com alguma supervisão. Compreende conceitos básicos e busca aprimoramento.'
  },
  {
    level: 3,
    name: 'Competente',
    description: 'Conhecimento sólido. Executa tarefas de forma autônoma e consistente. Resolve problemas comuns e contribui para melhorias.'
  },
  {
    level: 4,
    name: 'Avançado',
    description: 'Alto nível de conhecimento. Referência técnica na área. Resolve problemas complexos, orienta colegas e propõe inovações.'
  },
  {
    level: 5,
    name: 'Especialista',
    description: 'Expertise reconhecida. Domínio completo da competência. Lidera iniciativas estratégicas, desenvolve outros e influencia a organização.'
  }
];

// ============================================================================
// DEPARTAMENTOS DA USINA
// ============================================================================

const departamentos = [
  {
    code: 'DEP-AGR',
    name: 'Agrícola',
    description: 'Responsável pelo plantio, cultivo, colheita e transporte de cana-de-açúcar.'
  },
  {
    code: 'DEP-IND',
    name: 'Industrial',
    description: 'Responsável pelo processamento da cana e produção de açúcar.'
  },
  {
    code: 'DEP-ENE',
    name: 'Energia',
    description: 'Responsável pela cogeração de energia elétrica a partir de biomassa.'
  },
  {
    code: 'DEP-ETA',
    name: 'Etanol',
    description: 'Responsável pela produção de etanol hidratado e anidro.'
  },
  {
    code: 'DEP-ADM',
    name: 'Administrativo',
    description: 'Responsável pelas funções de suporte: RH, Financeiro, Compras, TI, Jurídico.'
  },
  {
    code: 'DEP-QUA',
    name: 'Qualidade',
    description: 'Responsável pelo controle de qualidade, laboratório e certificações.'
  },
  {
    code: 'DEP-MAN',
    name: 'Manutenção',
    description: 'Responsável pela manutenção industrial, agrícola e predial.'
  },
  {
    code: 'DEP-SSM',
    name: 'SSMA',
    description: 'Responsável por Segurança, Saúde e Meio Ambiente.'
  }
];

// ============================================================================
// METAS SMART ORGANIZACIONAIS - CICLO 2025/2026
// ============================================================================

const metasOrganizacionais = [
  // METAS ESTRATÉGICAS (CORPORATIVAS)
  {
    title: 'Aumentar Moagem Total de Cana',
    description: 'Aumentar a moagem total de cana-de-açúcar de 4,5 milhões para 5,0 milhões de toneladas na safra 2025/2026, representando crescimento de 11% em relação à safra anterior.',
    type: 'organizational',
    goalType: 'corporate',
    category: 'financial',
    measurementUnit: 'toneladas',
    targetValueCents: 500000000, // 5.000.000 toneladas
    startDate: '2025-04-01',
    endDate: '2026-03-31',
    bonusEligible: true,
    bonusPercentage: 15,
    weight: 20
  },
  {
    title: 'Melhorar ATR Médio',
    description: 'Elevar o ATR (Açúcar Total Recuperável) médio de 138 kg/ton para 142 kg/ton, através de melhorias no manejo agrícola e redução de perdas industriais.',
    type: 'organizational',
    goalType: 'corporate',
    category: 'financial',
    measurementUnit: 'kg/ton',
    targetValueCents: 14200, // 142 kg/ton
    startDate: '2025-04-01',
    endDate: '2026-03-31',
    bonusEligible: true,
    bonusPercentage: 10,
    weight: 15
  },
  {
    title: 'Aumentar Exportação de Energia',
    description: 'Aumentar a exportação de energia elétrica para a rede de 180 GWh para 220 GWh, representando incremento de 22% na comercialização de energia.',
    type: 'organizational',
    goalType: 'corporate',
    category: 'financial',
    measurementUnit: 'GWh',
    targetValueCents: 22000, // 220 GWh
    startDate: '2025-04-01',
    endDate: '2026-03-31',
    bonusEligible: true,
    bonusPercentage: 12,
    weight: 15
  },
  {
    title: 'Reduzir Custo de Produção',
    description: 'Reduzir o custo de produção por tonelada de cana processada em 5%, através de otimização de processos, eficiência energética e redução de perdas.',
    type: 'organizational',
    goalType: 'corporate',
    category: 'financial',
    measurementUnit: '%',
    targetValueCents: 500, // 5%
    startDate: '2025-04-01',
    endDate: '2026-03-31',
    bonusEligible: true,
    bonusPercentage: 10,
    weight: 15
  },
  {
    title: 'Obter Certificação RenovaBio',
    description: 'Obter e manter a certificação RenovaBio com nota de eficiência energético-ambiental superior a 60 gCO2eq/MJ, habilitando a comercialização de CBIOs.',
    type: 'organizational',
    goalType: 'corporate',
    category: 'corporate',
    measurementUnit: 'gCO2eq/MJ',
    targetValueCents: 6000, // 60 gCO2eq/MJ
    startDate: '2025-04-01',
    endDate: '2026-03-31',
    bonusEligible: true,
    bonusPercentage: 8,
    weight: 10
  },
  {
    title: 'Zero Acidentes com Afastamento',
    description: 'Manter índice de acidentes com afastamento igual a zero durante toda a safra 2025/2026, através de programas de segurança e conscientização.',
    type: 'organizational',
    goalType: 'corporate',
    category: 'behavioral',
    measurementUnit: 'acidentes',
    targetValueCents: 0,
    startDate: '2025-04-01',
    endDate: '2026-03-31',
    bonusEligible: true,
    bonusPercentage: 10,
    weight: 15
  },
  {
    title: 'Índice de Engajamento de Colaboradores',
    description: 'Elevar o índice de engajamento de colaboradores de 72% para 80% na pesquisa de clima organizacional, através de ações de desenvolvimento e reconhecimento.',
    type: 'organizational',
    goalType: 'corporate',
    category: 'behavioral',
    measurementUnit: '%',
    targetValueCents: 8000, // 80%
    startDate: '2025-04-01',
    endDate: '2026-03-31',
    bonusEligible: true,
    bonusPercentage: 5,
    weight: 10
  }
];

// ============================================================================
// METAS SMART POR DEPARTAMENTO - CICLO 2025/2026
// ============================================================================

const metasPorDepartamento = {
  'DEP-AGR': [
    {
      title: 'Produtividade Agrícola (TCH)',
      description: 'Atingir produtividade média de 85 toneladas de cana por hectare (TCH) nas áreas próprias, através de manejo adequado e renovação de canaviais.',
      type: 'team',
      goalType: 'individual',
      category: 'financial',
      measurementUnit: 'ton/ha',
      targetValueCents: 8500, // 85 TCH
      weight: 25
    },
    {
      title: 'Renovação de Canavial',
      description: 'Renovar 18% da área de canavial próprio, priorizando variedades de alta produtividade e resistência a pragas.',
      type: 'team',
      goalType: 'individual',
      category: 'financial',
      measurementUnit: '%',
      targetValueCents: 1800, // 18%
      weight: 20
    },
    {
      title: 'Redução de Perdas na Colheita',
      description: 'Reduzir perdas visíveis na colheita mecanizada de 4,5% para 3,5%, através de treinamento de operadores e manutenção de colhedoras.',
      type: 'team',
      goalType: 'individual',
      category: 'financial',
      measurementUnit: '%',
      targetValueCents: 350, // 3,5%
      weight: 20
    },
    {
      title: 'Disponibilidade de Frota Agrícola',
      description: 'Manter disponibilidade mecânica da frota agrícola acima de 92% durante a safra.',
      type: 'team',
      goalType: 'individual',
      category: 'financial',
      measurementUnit: '%',
      targetValueCents: 9200, // 92%
      weight: 15
    },
    {
      title: 'Implementação de Agricultura de Precisão',
      description: 'Implementar agricultura de precisão em 100% da área própria, incluindo mapeamento de produtividade e aplicação em taxa variável.',
      type: 'team',
      goalType: 'individual',
      category: 'development',
      measurementUnit: '%',
      targetValueCents: 10000, // 100%
      weight: 20
    }
  ],
  'DEP-IND': [
    {
      title: 'Eficiência de Extração',
      description: 'Atingir eficiência de extração de açúcar de 97,5% no processo de moagem.',
      type: 'team',
      goalType: 'individual',
      category: 'financial',
      measurementUnit: '%',
      targetValueCents: 9750, // 97,5%
      weight: 25
    },
    {
      title: 'Qualidade do Açúcar VHP',
      description: 'Manter 98% da produção de açúcar VHP dentro das especificações de exportação (cor ICUMSA < 1000).',
      type: 'team',
      goalType: 'individual',
      category: 'financial',
      measurementUnit: '%',
      targetValueCents: 9800, // 98%
      weight: 20
    },
    {
      title: 'Uptime Industrial',
      description: 'Manter uptime industrial (tempo efetivo de moagem) acima de 92% durante a safra.',
      type: 'team',
      goalType: 'individual',
      category: 'financial',
      measurementUnit: '%',
      targetValueCents: 9200, // 92%
      weight: 20
    },
    {
      title: 'Redução de Consumo de Insumos',
      description: 'Reduzir consumo de insumos químicos (cal, enxofre, ácidos) em 8% por tonelada de cana processada.',
      type: 'team',
      goalType: 'individual',
      category: 'financial',
      measurementUnit: '%',
      targetValueCents: 800, // 8%
      weight: 15
    },
    {
      title: 'Certificação FSSC 22000',
      description: 'Manter certificação FSSC 22000 com zero não-conformidades maiores na auditoria de recertificação.',
      type: 'team',
      goalType: 'individual',
      category: 'corporate',
      measurementUnit: 'não-conformidades',
      targetValueCents: 0,
      weight: 20
    }
  ],
  'DEP-ENE': [
    {
      title: 'Geração de Energia Elétrica',
      description: 'Gerar 320 GWh de energia elétrica total na safra, com 220 GWh destinados à exportação.',
      type: 'team',
      goalType: 'individual',
      category: 'financial',
      measurementUnit: 'GWh',
      targetValueCents: 32000, // 320 GWh
      weight: 30
    },
    {
      title: 'Eficiência de Caldeiras',
      description: 'Manter eficiência térmica das caldeiras acima de 85%.',
      type: 'team',
      goalType: 'individual',
      category: 'financial',
      measurementUnit: '%',
      targetValueCents: 8500, // 85%
      weight: 25
    },
    {
      title: 'Disponibilidade de Turbogeradores',
      description: 'Manter disponibilidade dos turbogeradores acima de 95% durante a safra.',
      type: 'team',
      goalType: 'individual',
      category: 'financial',
      measurementUnit: '%',
      targetValueCents: 9500, // 95%
      weight: 20
    },
    {
      title: 'Consumo Específico de Vapor',
      description: 'Reduzir consumo específico de vapor do processo para 450 kg/ton cana.',
      type: 'team',
      goalType: 'individual',
      category: 'financial',
      measurementUnit: 'kg/ton',
      targetValueCents: 45000, // 450 kg/ton
      weight: 15
    },
    {
      title: 'Aproveitamento de Palha',
      description: 'Aumentar aproveitamento de palha como combustível para 50% do potencial disponível.',
      type: 'team',
      goalType: 'individual',
      category: 'development',
      measurementUnit: '%',
      targetValueCents: 5000, // 50%
      weight: 10
    }
  ],
  'DEP-ETA': [
    {
      title: 'Rendimento Fermentativo',
      description: 'Atingir rendimento fermentativo de 91% em relação ao teórico.',
      type: 'team',
      goalType: 'individual',
      category: 'financial',
      measurementUnit: '%',
      targetValueCents: 9100, // 91%
      weight: 30
    },
    {
      title: 'Produção de Etanol Anidro',
      description: 'Produzir 180 milhões de litros de etanol (hidratado + anidro) na safra.',
      type: 'team',
      goalType: 'individual',
      category: 'financial',
      measurementUnit: 'milhões litros',
      targetValueCents: 18000, // 180 milhões
      weight: 25
    },
    {
      title: 'Qualidade do Etanol',
      description: 'Manter 100% da produção de etanol dentro das especificações ANP.',
      type: 'team',
      goalType: 'individual',
      category: 'financial',
      measurementUnit: '%',
      targetValueCents: 10000, // 100%
      weight: 20
    },
    {
      title: 'Eficiência de Destilação',
      description: 'Manter eficiência de destilação acima de 99,5%.',
      type: 'team',
      goalType: 'individual',
      category: 'financial',
      measurementUnit: '%',
      targetValueCents: 9950, // 99,5%
      weight: 15
    },
    {
      title: 'Tratamento de Vinhaça',
      description: 'Tratar e destinar 100% da vinhaça produzida de forma ambientalmente adequada (fertirrigação ou biodigestão).',
      type: 'team',
      goalType: 'individual',
      category: 'corporate',
      measurementUnit: '%',
      targetValueCents: 10000, // 100%
      weight: 10
    }
  ],
  'DEP-ADM': [
    {
      title: 'Redução de Custos Administrativos',
      description: 'Reduzir custos administrativos em 5% em relação à safra anterior, mantendo qualidade dos serviços.',
      type: 'team',
      goalType: 'individual',
      category: 'financial',
      measurementUnit: '%',
      targetValueCents: 500, // 5%
      weight: 20
    },
    {
      title: 'Turnover Voluntário',
      description: 'Manter turnover voluntário abaixo de 8% ao ano.',
      type: 'team',
      goalType: 'individual',
      category: 'behavioral',
      measurementUnit: '%',
      targetValueCents: 800, // 8%
      weight: 20
    },
    {
      title: 'Horas de Treinamento',
      description: 'Atingir média de 40 horas de treinamento por colaborador no ano.',
      type: 'team',
      goalType: 'individual',
      category: 'development',
      measurementUnit: 'horas',
      targetValueCents: 4000, // 40 horas
      weight: 15
    },
    {
      title: 'Digitalização de Processos',
      description: 'Digitalizar 80% dos processos administrativos, eliminando documentos físicos.',
      type: 'team',
      goalType: 'individual',
      category: 'development',
      measurementUnit: '%',
      targetValueCents: 8000, // 80%
      weight: 15
    },
    {
      title: 'Satisfação de Clientes Internos',
      description: 'Atingir índice de satisfação de clientes internos de 85% na pesquisa semestral.',
      type: 'team',
      goalType: 'individual',
      category: 'behavioral',
      measurementUnit: '%',
      targetValueCents: 8500, // 85%
      weight: 15
    },
    {
      title: 'Compliance Trabalhista',
      description: 'Manter 100% de conformidade em auditorias trabalhistas e previdenciárias.',
      type: 'team',
      goalType: 'individual',
      category: 'corporate',
      measurementUnit: '%',
      targetValueCents: 10000, // 100%
      weight: 15
    }
  ],
  'DEP-QUA': [
    {
      title: 'Tempo de Resposta Laboratorial',
      description: 'Manter tempo médio de resposta de análises laboratoriais abaixo de 2 horas.',
      type: 'team',
      goalType: 'individual',
      category: 'financial',
      measurementUnit: 'horas',
      targetValueCents: 200, // 2 horas
      weight: 25
    },
    {
      title: 'Acurácia de Análises',
      description: 'Manter acurácia de análises laboratoriais acima de 99% em comparação com laboratórios externos.',
      type: 'team',
      goalType: 'individual',
      category: 'financial',
      measurementUnit: '%',
      targetValueCents: 9900, // 99%
      weight: 25
    },
    {
      title: 'Reclamações de Clientes',
      description: 'Reduzir reclamações de clientes relacionadas à qualidade em 30% em relação à safra anterior.',
      type: 'team',
      goalType: 'individual',
      category: 'behavioral',
      measurementUnit: '%',
      targetValueCents: 3000, // 30% redução
      weight: 25
    },
    {
      title: 'Manutenção de Certificações',
      description: 'Manter todas as certificações vigentes (ISO 9001, FSSC 22000, Bonsucro) sem não-conformidades maiores.',
      type: 'team',
      goalType: 'individual',
      category: 'corporate',
      measurementUnit: 'não-conformidades',
      targetValueCents: 0,
      weight: 25
    }
  ],
  'DEP-MAN': [
    {
      title: 'Disponibilidade de Equipamentos',
      description: 'Manter disponibilidade média de equipamentos críticos acima de 94%.',
      type: 'team',
      goalType: 'individual',
      category: 'financial',
      measurementUnit: '%',
      targetValueCents: 9400, // 94%
      weight: 30
    },
    {
      title: 'MTBF (Tempo Médio Entre Falhas)',
      description: 'Aumentar MTBF de equipamentos críticos em 15% em relação à safra anterior.',
      type: 'team',
      goalType: 'individual',
      category: 'financial',
      measurementUnit: '%',
      targetValueCents: 1500, // 15%
      weight: 25
    },
    {
      title: 'Cumprimento do Plano de Manutenção',
      description: 'Cumprir 95% do plano de manutenção preventiva programada.',
      type: 'team',
      goalType: 'individual',
      category: 'financial',
      measurementUnit: '%',
      targetValueCents: 9500, // 95%
      weight: 25
    },
    {
      title: 'Custo de Manutenção',
      description: 'Manter custo de manutenção por tonelada de cana processada dentro do orçamento aprovado.',
      type: 'team',
      goalType: 'individual',
      category: 'financial',
      measurementUnit: '%',
      targetValueCents: 10000, // 100% do orçamento
      weight: 20
    }
  ],
  'DEP-SSM': [
    {
      title: 'Taxa de Frequência de Acidentes',
      description: 'Manter taxa de frequência de acidentes (TF) abaixo de 2,0.',
      type: 'team',
      goalType: 'individual',
      category: 'behavioral',
      measurementUnit: 'TF',
      targetValueCents: 200, // 2,0
      weight: 30
    },
    {
      title: 'Treinamentos de Segurança',
      description: 'Realizar 100% dos treinamentos de segurança obrigatórios (NRs) para todos os colaboradores.',
      type: 'team',
      goalType: 'individual',
      category: 'behavioral',
      measurementUnit: '%',
      targetValueCents: 10000, // 100%
      weight: 25
    },
    {
      title: 'Conformidade Ambiental',
      description: 'Manter 100% de conformidade com condicionantes de licenças ambientais.',
      type: 'team',
      goalType: 'individual',
      category: 'corporate',
      measurementUnit: '%',
      targetValueCents: 10000, // 100%
      weight: 25
    },
    {
      title: 'Redução de Emissões',
      description: 'Reduzir emissões de material particulado em 10% através de melhorias em lavadores de gases.',
      type: 'team',
      goalType: 'individual',
      category: 'corporate',
      measurementUnit: '%',
      targetValueCents: 1000, // 10%
      weight: 20
    }
  ]
};

// ============================================================================
// FUNÇÃO PRINCIPAL DE SEED
// ============================================================================

async function seed() {
  console.log('🌱 Iniciando seed de competências e metas SMART...\n');
  
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    // 1. Inserir Departamentos
    console.log('📁 Inserindo departamentos...');
    for (const dept of departamentos) {
      await connection.execute(
        `INSERT INTO departments (code, name, description, active) 
         VALUES (?, ?, ?, true)
         ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)`,
        [dept.code, dept.name, dept.description]
      );
    }
    console.log(`   ✅ ${departamentos.length} departamentos inseridos/atualizados\n`);

    // 2. Inserir Competências Técnicas
    console.log('🔧 Inserindo competências técnicas...');
    for (const comp of competenciasTecnicas) {
      await connection.execute(
        `INSERT INTO competencies (code, name, description, category, active) 
         VALUES (?, ?, ?, ?, true)
         ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)`,
        [comp.code, comp.name, comp.description, comp.category]
      );
    }
    console.log(`   ✅ ${competenciasTecnicas.length} competências técnicas inseridas/atualizadas\n`);

    // 3. Inserir Competências Comportamentais
    console.log('🧠 Inserindo competências comportamentais...');
    for (const comp of competenciasComportamentais) {
      await connection.execute(
        `INSERT INTO competencies (code, name, description, category, active) 
         VALUES (?, ?, ?, ?, true)
         ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)`,
        [comp.code, comp.name, comp.description, comp.category]
      );
    }
    console.log(`   ✅ ${competenciasComportamentais.length} competências comportamentais inseridas/atualizadas\n`);

    // 4. Inserir Competências de Liderança
    console.log('👔 Inserindo competências de liderança...');
    for (const comp of competenciasLideranca) {
      await connection.execute(
        `INSERT INTO competencies (code, name, description, category, active) 
         VALUES (?, ?, ?, ?, true)
         ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)`,
        [comp.code, comp.name, comp.description, comp.category]
      );
    }
    console.log(`   ✅ ${competenciasLideranca.length} competências de liderança inseridas/atualizadas\n`);

    // 5. Inserir Níveis de Proficiência para cada competência
    console.log('📊 Inserindo níveis de proficiência...');
    const [competencias] = await connection.execute('SELECT id FROM competencies');
    let niveisInseridos = 0;
    
    for (const comp of competencias) {
      for (const nivel of niveisProficiencia) {
        await connection.execute(
          `INSERT INTO competencyLevels (competencyId, level, name, description) 
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)`,
          [comp.id, nivel.level, nivel.name, nivel.description]
        );
        niveisInseridos++;
      }
    }
    console.log(`   ✅ ${niveisInseridos} níveis de proficiência inseridos/atualizados\n`);

    // 6. Criar/Buscar Ciclo de Avaliação 2025/2026
    console.log('📅 Verificando ciclo de avaliação 2025/2026...');
    const [cicloExistente] = await connection.execute(
      `SELECT id FROM evaluationCycles WHERE year = 2025 AND name LIKE '%2025/2026%' LIMIT 1`
    );
    
    let cycleId;
    if (cicloExistente.length > 0) {
      cycleId = cicloExistente[0].id;
      console.log(`   ✅ Ciclo existente encontrado (ID: ${cycleId})\n`);
    } else {
      const [result] = await connection.execute(
        `INSERT INTO evaluationCycles (name, year, type, startDate, endDate, status, active, description) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'Ciclo de Avaliação 2025/2026',
          2025,
          'anual',
          '2025-04-01 00:00:00',
          '2026-03-31 23:59:59',
          'planejado',
          true,
          'Ciclo de avaliação de desempenho da safra 2025/2026'
        ]
      );
      cycleId = result.insertId;
      console.log(`   ✅ Novo ciclo criado (ID: ${cycleId})\n`);
    }

    // 7. Inserir Metas Organizacionais
    console.log('🎯 Inserindo metas organizacionais...');
    for (const meta of metasOrganizacionais) {
      await connection.execute(
        `INSERT INTO smartGoals (
          cycleId, title, description, type, goalType, category,
          measurementUnit, targetValueCents, startDate, endDate,
          bonusEligible, bonusPercentage, weight, status, createdBy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 1)
        ON DUPLICATE KEY UPDATE 
          description = VALUES(description),
          targetValueCents = VALUES(targetValueCents)`,
        [
          cycleId, meta.title, meta.description, meta.type, meta.goalType, meta.category,
          meta.measurementUnit, meta.targetValueCents, meta.startDate, meta.endDate,
          meta.bonusEligible, meta.bonusPercentage, meta.weight
        ]
      );
    }
    console.log(`   ✅ ${metasOrganizacionais.length} metas organizacionais inseridas/atualizadas\n`);

    // 8. Inserir Metas por Departamento
    console.log('🏢 Inserindo metas por departamento...');
    let totalMetasDept = 0;
    
    for (const [deptCode, metas] of Object.entries(metasPorDepartamento)) {
      // Buscar ID do departamento
      const [deptResult] = await connection.execute(
        'SELECT id FROM departments WHERE code = ? LIMIT 1',
        [deptCode]
      );
      
      if (deptResult.length === 0) {
        console.log(`   ⚠️ Departamento ${deptCode} não encontrado, pulando...`);
        continue;
      }
      
      const departmentId = deptResult[0].id;
      
      for (const meta of metas) {
        await connection.execute(
          `INSERT INTO smartGoals (
            cycleId, departmentId, title, description, type, goalType, category,
            measurementUnit, targetValueCents, startDate, endDate,
            weight, status, createdBy
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '2025-04-01', '2026-03-31', ?, 'approved', 1)
          ON DUPLICATE KEY UPDATE 
            description = VALUES(description),
            targetValueCents = VALUES(targetValueCents)`,
          [
            cycleId, departmentId, meta.title, meta.description, meta.type, 
            meta.goalType, meta.category, meta.measurementUnit, meta.targetValueCents,
            meta.weight
          ]
        );
        totalMetasDept++;
      }
    }
    console.log(`   ✅ ${totalMetasDept} metas departamentais inseridas/atualizadas\n`);

    // 9. Resumo Final
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 RESUMO DO SEED - CICLO 2025/2026');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`   📁 Departamentos: ${departamentos.length}`);
    console.log(`   🔧 Competências Técnicas: ${competenciasTecnicas.length}`);
    console.log(`   🧠 Competências Comportamentais: ${competenciasComportamentais.length}`);
    console.log(`   👔 Competências de Liderança: ${competenciasLideranca.length}`);
    console.log(`   📊 Níveis de Proficiência: ${niveisProficiencia.length} por competência`);
    console.log(`   🎯 Metas Organizacionais: ${metasOrganizacionais.length}`);
    console.log(`   🏢 Metas Departamentais: ${totalMetasDept}`);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\n✅ Seed concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Executar
seed().catch(console.error);
