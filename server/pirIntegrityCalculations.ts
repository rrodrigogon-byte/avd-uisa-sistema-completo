/**
 * PIR Integridade - Cálculos e Interpretações
 * Sistema AVD UISA
 * 
 * Baseado no Modelo de Desenvolvimento Moral de Kohlberg
 * 6 Dimensões de Integridade:
 * - HON: Honestidade
 * - CON: Confiabilidade
 * - RES: Resiliência Ética
 * - RSP: Responsabilidade
 * - JUS: Justiça
 * - COR: Coragem Moral
 */

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export type KohlbergDimension = 'HON' | 'CON' | 'RES' | 'RSP' | 'JUS' | 'COR';

export type MoralLevel = 'pre_conventional' | 'conventional' | 'post_conventional';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export type Classification = 'Baixo' | 'Médio' | 'Alto';

export interface PIRIntegrityResponse {
  questionId: number;
  selectedOption?: string;
  scaleValue?: number;
  score: number;
  moralLevel: MoralLevel;
  dimensionCode: KohlbergDimension;
  timeSpent?: number;
}

export interface PIRIntegrityScores {
  HON: number;
  CON: number;
  RES: number;
  RSP: number;
  JUS: number;
  COR: number;
}

export interface PIRIntegrityResult {
  rawScores: PIRIntegrityScores;
  normalizedScores: PIRIntegrityScores;
  overallScore: number;
  classifications: Record<KohlbergDimension, Classification>;
  dominantDimension: KohlbergDimension;
  weakestDimension: KohlbergDimension;
  riskLevel: RiskLevel;
  moralLevel: MoralLevel;
  moralLevelDescription: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  profileType: string;
  profileDescription: string;
  riskIndicators: RiskIndicator[];
  totalQuestions: number;
  avgTimePerQuestion: number;
}

export interface RiskIndicator {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

// ============================================================================
// CONSTANTES - DIMENSÕES KOHLBERG
// ============================================================================

export const KOHLBERG_DIMENSIONS: Record<KohlbergDimension, {
  name: string;
  description: string;
  highDescription: string;
  lowDescription: string;
  strengths: string[];
  developmentAreas: string[];
}> = {
  HON: {
    name: 'Honestidade',
    description: 'Capacidade de ser verdadeiro, transparente e sincero em todas as interações.',
    highDescription: 'Você demonstra alto nível de honestidade, sendo transparente e verdadeiro em suas comunicações.',
    lowDescription: 'Há oportunidades de desenvolvimento na área de honestidade.',
    strengths: [
      'Comunicação transparente e direta',
      'Confiança dos colegas e superiores',
      'Credibilidade nas relações profissionais',
      'Capacidade de dar feedback honesto'
    ],
    developmentAreas: [
      'Praticar comunicação mais transparente',
      'Desenvolver coragem para expressar opiniões verdadeiras',
      'Buscar feedback sobre percepção de honestidade',
      'Refletir sobre situações onde a verdade foi omitida'
    ]
  },
  CON: {
    name: 'Confiabilidade',
    description: 'Capacidade de cumprir compromissos, ser consistente e manter a palavra dada.',
    highDescription: 'Você é altamente confiável, cumprindo compromissos e mantendo consistência.',
    lowDescription: 'Há oportunidades de desenvolvimento na área de confiabilidade.',
    strengths: [
      'Cumprimento consistente de prazos',
      'Coerência entre discurso e ação',
      'Previsibilidade positiva nas entregas',
      'Construção de relacionamentos de confiança'
    ],
    developmentAreas: [
      'Melhorar gestão de compromissos assumidos',
      'Comunicar proativamente sobre dificuldades',
      'Desenvolver sistemas de acompanhamento de tarefas',
      'Praticar dizer não quando necessário'
    ]
  },
  RES: {
    name: 'Resiliência Ética',
    description: 'Capacidade de manter princípios éticos mesmo sob pressão ou adversidade.',
    highDescription: 'Você demonstra forte resiliência ética, mantendo seus princípios mesmo em situações de pressão.',
    lowDescription: 'Há oportunidades de desenvolvimento na área de resiliência ética.',
    strengths: [
      'Firmeza em princípios sob pressão',
      'Resistência a influências antiéticas',
      'Capacidade de tomar decisões difíceis',
      'Modelo de comportamento ético'
    ],
    developmentAreas: [
      'Desenvolver estratégias para lidar com pressão',
      'Identificar gatilhos que comprometem princípios',
      'Buscar apoio em situações de dilema ético',
      'Praticar assertividade em situações difíceis'
    ]
  },
  RSP: {
    name: 'Responsabilidade',
    description: 'Capacidade de assumir responsabilidade por ações, decisões e suas consequências.',
    highDescription: 'Você demonstra alto senso de responsabilidade, assumindo as consequências de suas ações.',
    lowDescription: 'Há oportunidades de desenvolvimento na área de responsabilidade.',
    strengths: [
      'Accountability pelas próprias ações',
      'Proatividade na resolução de problemas',
      'Não transferência de culpa',
      'Aprendizado com erros'
    ],
    developmentAreas: [
      'Praticar assumir erros abertamente',
      'Desenvolver mentalidade de ownership',
      'Evitar justificativas e desculpas',
      'Focar em soluções ao invés de culpados'
    ]
  },
  JUS: {
    name: 'Justiça',
    description: 'Capacidade de tratar pessoas de forma equitativa e tomar decisões imparciais.',
    highDescription: 'Você demonstra forte senso de justiça, tratando pessoas de forma equitativa.',
    lowDescription: 'Há oportunidades de desenvolvimento na área de justiça.',
    strengths: [
      'Tratamento equitativo de pessoas',
      'Decisões imparciais e fundamentadas',
      'Consideração de múltiplas perspectivas',
      'Defesa de princípios de equidade'
    ],
    developmentAreas: [
      'Identificar vieses inconscientes',
      'Praticar escuta ativa de diferentes pontos de vista',
      'Desenvolver critérios objetivos para decisões',
      'Buscar feedback sobre percepção de justiça'
    ]
  },
  COR: {
    name: 'Coragem Moral',
    description: 'Capacidade de agir de acordo com princípios éticos mesmo quando há riscos pessoais.',
    highDescription: 'Você demonstra forte coragem moral, agindo de acordo com seus princípios mesmo quando há riscos.',
    lowDescription: 'Há oportunidades de desenvolvimento na área de coragem moral.',
    strengths: [
      'Defesa de princípios mesmo com riscos',
      'Capacidade de confrontar situações antiéticas',
      'Liderança em questões de integridade',
      'Inspiração para outros agirem eticamente'
    ],
    developmentAreas: [
      'Desenvolver assertividade em situações difíceis',
      'Praticar confronto construtivo',
      'Buscar aliados para questões éticas',
      'Fortalecer autoconfiança em posicionamentos'
    ]
  }
};

// ============================================================================
// FUNÇÕES DE CÁLCULO
// ============================================================================

export function calculateRawScores(responses: PIRIntegrityResponse[]): PIRIntegrityScores {
  const scores: PIRIntegrityScores = { HON: 0, CON: 0, RES: 0, RSP: 0, JUS: 0, COR: 0 };
  const counts: PIRIntegrityScores = { HON: 0, CON: 0, RES: 0, RSP: 0, JUS: 0, COR: 0 };

  for (const response of responses) {
    const dim = response.dimensionCode as KohlbergDimension;
    if (dim in scores) {
      scores[dim] += response.score;
      counts[dim] += 1;
    }
  }

  for (const dim of Object.keys(scores) as KohlbergDimension[]) {
    if (counts[dim] > 0) {
      scores[dim] = Math.round(scores[dim] / counts[dim]);
    }
  }

  return scores;
}

export function normalizeScores(rawScores: PIRIntegrityScores): PIRIntegrityScores {
  return {
    HON: Math.min(100, Math.max(0, rawScores.HON)),
    CON: Math.min(100, Math.max(0, rawScores.CON)),
    RES: Math.min(100, Math.max(0, rawScores.RES)),
    RSP: Math.min(100, Math.max(0, rawScores.RSP)),
    JUS: Math.min(100, Math.max(0, rawScores.JUS)),
    COR: Math.min(100, Math.max(0, rawScores.COR)),
  };
}

export function calculateOverallScore(scores: PIRIntegrityScores): number {
  const values = Object.values(scores);
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / values.length);
}

export function classifyScores(scores: PIRIntegrityScores): Record<KohlbergDimension, Classification> {
  const classify = (score: number): Classification => {
    if (score >= 70) return 'Alto';
    if (score >= 40) return 'Médio';
    return 'Baixo';
  };

  return {
    HON: classify(scores.HON),
    CON: classify(scores.CON),
    RES: classify(scores.RES),
    RSP: classify(scores.RSP),
    JUS: classify(scores.JUS),
    COR: classify(scores.COR),
  };
}

export function determineRiskLevel(overallScore: number): RiskLevel {
  if (overallScore >= 80) return 'low';
  if (overallScore >= 60) return 'moderate';
  if (overallScore >= 40) return 'high';
  return 'critical';
}

export function determineMoralLevel(responses: PIRIntegrityResponse[]): MoralLevel {
  const counts = { pre_conventional: 0, conventional: 0, post_conventional: 0 };

  for (const response of responses) {
    counts[response.moralLevel]++;
  }

  if (counts.post_conventional > counts.conventional && 
      counts.post_conventional > counts.pre_conventional) {
    return 'post_conventional';
  }
  if (counts.pre_conventional > counts.conventional) {
    return 'pre_conventional';
  }
  return 'conventional';
}

export function getMoralLevelDescription(level: MoralLevel): string {
  const descriptions: Record<MoralLevel, string> = {
    pre_conventional: 'Nível Pré-Convencional: Decisões baseadas principalmente em consequências pessoais.',
    conventional: 'Nível Convencional: Decisões baseadas em normas sociais e expectativas do grupo.',
    post_conventional: 'Nível Pós-Convencional: Decisões baseadas em princípios éticos universais.',
  };
  return descriptions[level];
}

export function getDominantDimension(scores: PIRIntegrityScores): KohlbergDimension {
  let maxScore = -1;
  let dominant: KohlbergDimension = 'HON';

  for (const [dim, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      dominant = dim as KohlbergDimension;
    }
  }

  return dominant;
}

export function getWeakestDimension(scores: PIRIntegrityScores): KohlbergDimension {
  let minScore = 101;
  let weakest: KohlbergDimension = 'HON';

  for (const [dim, score] of Object.entries(scores)) {
    if (score < minScore) {
      minScore = score;
      weakest = dim as KohlbergDimension;
    }
  }

  return weakest;
}

export function generateStrengths(classifications: Record<KohlbergDimension, Classification>): string[] {
  const strengths: string[] = [];

  for (const [dim, classification] of Object.entries(classifications)) {
    if (classification === 'Alto') {
      const dimension = KOHLBERG_DIMENSIONS[dim as KohlbergDimension];
      strengths.push(...dimension.strengths);
    }
  }

  return strengths.length > 0 ? strengths : ['Perfil equilibrado em todas as dimensões de integridade.'];
}

export function generateWeaknesses(classifications: Record<KohlbergDimension, Classification>): string[] {
  const weaknesses: string[] = [];

  for (const [dim, classification] of Object.entries(classifications)) {
    if (classification === 'Baixo') {
      const dimension = KOHLBERG_DIMENSIONS[dim as KohlbergDimension];
      weaknesses.push(`${dimension.name}: ${dimension.lowDescription}`);
    }
  }

  return weaknesses.length > 0 ? weaknesses : ['Nenhuma área crítica identificada.'];
}

export function generateRecommendations(
  classifications: Record<KohlbergDimension, Classification>,
  moralLevel: MoralLevel
): string[] {
  const recommendations: string[] = [];

  for (const [dim, classification] of Object.entries(classifications)) {
    if (classification === 'Baixo' || classification === 'Médio') {
      const dimension = KOHLBERG_DIMENSIONS[dim as KohlbergDimension];
      recommendations.push(...dimension.developmentAreas.slice(0, 2));
    }
  }

  if (moralLevel === 'pre_conventional') {
    recommendations.push(
      'Desenvolver consciência sobre impacto das ações nos outros',
      'Praticar tomada de decisão considerando perspectivas além da pessoal'
    );
  }

  return recommendations.length > 0 ? recommendations : ['Manter práticas atuais de integridade.'];
}

export function generateProfileType(
  classifications: Record<KohlbergDimension, Classification>,
  dominantDimension: KohlbergDimension
): string {
  const highDimensions = Object.entries(classifications)
    .filter(([_, c]) => c === 'Alto')
    .map(([dim]) => KOHLBERG_DIMENSIONS[dim as KohlbergDimension].name);

  if (highDimensions.length >= 5) {
    return 'Perfil de Alta Integridade';
  } else if (highDimensions.length >= 3) {
    return `Perfil Forte em ${highDimensions.slice(0, 2).join(' e ')}`;
  } else if (highDimensions.length >= 1) {
    return `Perfil com Destaque em ${highDimensions[0]}`;
  }

  return `Perfil em Desenvolvimento - Foco em ${KOHLBERG_DIMENSIONS[dominantDimension].name}`;
}

export function generateProfileDescription(
  scores: PIRIntegrityScores,
  classifications: Record<KohlbergDimension, Classification>,
  moralLevel: MoralLevel
): string {
  const parts: string[] = [];
  const overallScore = calculateOverallScore(scores);
  
  if (overallScore >= 80) {
    parts.push('Você demonstra um alto nível de integridade em suas atitudes e comportamentos profissionais.');
  } else if (overallScore >= 60) {
    parts.push('Você demonstra um nível adequado de integridade, com algumas áreas que podem ser fortalecidas.');
  } else if (overallScore >= 40) {
    parts.push('Há oportunidades significativas de desenvolvimento em aspectos de integridade profissional.');
  } else {
    parts.push('É importante focar no desenvolvimento de competências de integridade para o crescimento profissional.');
  }

  for (const [dim, classification] of Object.entries(classifications)) {
    if (classification === 'Alto') {
      const dimension = KOHLBERG_DIMENSIONS[dim as KohlbergDimension];
      parts.push(dimension.highDescription);
    }
  }

  parts.push(getMoralLevelDescription(moralLevel));

  return parts.join('\n\n');
}

export function detectRiskIndicators(
  responses: PIRIntegrityResponse[],
  scores: PIRIntegrityScores,
  overallScore: number
): RiskIndicator[] {
  const indicators: RiskIndicator[] = [];

  const fastResponses = responses.filter(r => (r.timeSpent || 0) < 5);
  if (fastResponses.length > responses.length * 0.3) {
    indicators.push({
      type: 'time_anomaly',
      severity: 'medium',
      description: `${fastResponses.length} respostas foram dadas em menos de 5 segundos.`,
    });
  }

  for (const [dim, score] of Object.entries(scores)) {
    if (score < 30) {
      indicators.push({
        type: 'low_dimension',
        severity: 'high',
        description: `Pontuação crítica em ${KOHLBERG_DIMENSIONS[dim as KohlbergDimension].name} (${score}/100).`,
      });
    }
  }

  if (overallScore < 40) {
    indicators.push({
      type: 'overall_risk',
      severity: 'critical',
      description: `Pontuação geral de integridade abaixo do nível aceitável (${overallScore}/100).`,
    });
  }

  const moralLevel = determineMoralLevel(responses);
  if (moralLevel === 'pre_conventional') {
    indicators.push({
      type: 'moral_level',
      severity: 'high',
      description: 'Padrão de respostas indica nível moral pré-convencional.',
    });
  }

  return indicators;
}

// ============================================================================
// FUNÇÃO PRINCIPAL DE CÁLCULO
// ============================================================================

export function calculatePIRIntegrityResult(responses: PIRIntegrityResponse[]): PIRIntegrityResult {
  const rawScores = calculateRawScores(responses);
  const normalizedScores = normalizeScores(rawScores);
  const overallScore = calculateOverallScore(normalizedScores);
  
  const classifications = classifyScores(normalizedScores);
  const dominantDimension = getDominantDimension(normalizedScores);
  const weakestDimension = getWeakestDimension(normalizedScores);
  
  const riskLevel = determineRiskLevel(overallScore);
  const moralLevel = determineMoralLevel(responses);
  const moralLevelDescription = getMoralLevelDescription(moralLevel);
  
  const strengths = generateStrengths(classifications);
  const weaknesses = generateWeaknesses(classifications);
  const recommendations = generateRecommendations(classifications, moralLevel);
  
  const profileType = generateProfileType(classifications, dominantDimension);
  const profileDescription = generateProfileDescription(normalizedScores, classifications, moralLevel);
  
  const riskIndicators = detectRiskIndicators(responses, normalizedScores, overallScore);
  
  const totalQuestions = responses.length;
  const totalTime = responses.reduce((sum, r) => sum + (r.timeSpent || 0), 0);
  const avgTimePerQuestion = totalQuestions > 0 ? Math.round(totalTime / totalQuestions) : 0;

  return {
    rawScores,
    normalizedScores,
    overallScore,
    classifications,
    dominantDimension,
    weakestDimension,
    riskLevel,
    moralLevel,
    moralLevelDescription,
    strengths,
    weaknesses,
    recommendations,
    profileType,
    profileDescription,
    riskIndicators,
    totalQuestions,
    avgTimePerQuestion,
  };
}

export function mapLegacyDimensionCode(legacyCode: string): KohlbergDimension | null {
  const mapping: Record<string, KohlbergDimension> = {
    'honesty': 'HON',
    'reliability': 'CON',
    'ethical_resilience': 'RES',
    'responsibility': 'RSP',
    'justice': 'JUS',
    'moral_courage': 'COR',
    'IP': 'HON',
    'ID': 'CON',
    'IC': 'RES',
    'ES': 'RSP',
    'FL': 'JUS',
    'AU': 'COR',
  };

  return mapping[legacyCode] || null;
}

export function isValidKohlbergDimension(code: string): code is KohlbergDimension {
  return ['HON', 'CON', 'RES', 'RSP', 'JUS', 'COR'].includes(code);
}
