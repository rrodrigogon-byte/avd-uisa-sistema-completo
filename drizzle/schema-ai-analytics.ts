import {
  boolean,
  datetime,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Schema para Análise Preditiva com IA e Machine Learning
 * Sistema AVD UISA - Módulo de Inteligência Artificial
 */

// ============================================================================
// PREDIÇÃO DE TURNOVER
// ============================================================================

/**
 * Modelos de predição de turnover treinados
 */
export const turnoverPredictionModels = mysqlTable("turnoverPredictionModels", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  version: varchar("version", { length: 50 }).notNull(),
  
  // Configuração do modelo
  algorithm: mysqlEnum("algorithm", [
    "random_forest",
    "gradient_boosting",
    "neural_network",
    "logistic_regression"
  ]).notNull(),
  features: json("features").$type<string[]>().notNull(), // Features usadas
  hyperparameters: json("hyperparameters").$type<Record<string, any>>(),
  
  // Métricas de performance
  accuracy: int("accuracy").notNull(), // 0-100
  precision: int("precision").notNull(), // 0-100
  recall: int("recall").notNull(), // 0-100
  f1Score: int("f1Score").notNull(), // 0-100
  auc: int("auc").notNull(), // 0-100
  
  // Dados de treinamento
  trainingDataSize: int("trainingDataSize").notNull(),
  trainingStartDate: datetime("trainingStartDate").notNull(),
  trainingEndDate: datetime("trainingEndDate").notNull(),
  
  // Status
  status: mysqlEnum("status", ["treinando", "ativo", "inativo", "obsoleto"]).default("treinando").notNull(),
  isProduction: boolean("isProduction").default(false).notNull(),
  
  // Metadados
  trainedBy: int("trainedBy").notNull(),
  trainedAt: timestamp("trainedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TurnoverPredictionModel = typeof turnoverPredictionModels.$inferSelect;
export type InsertTurnoverPredictionModel = typeof turnoverPredictionModels.$inferInsert;

/**
 * Predições de turnover para colaboradores
 */
export const turnoverPredictions = mysqlTable("turnoverPredictions", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  modelId: int("modelId").notNull(),
  
  // Resultado da predição
  riskLevel: mysqlEnum("riskLevel", ["baixo", "medio", "alto", "critico"]).notNull(),
  probabilityPercent: int("probabilityPercent").notNull(), // 0-100
  confidenceScore: int("confidenceScore").notNull(), // 0-100
  
  // Fatores de risco identificados
  topRiskFactors: json("topRiskFactors").$type<Array<{
    factor: string;
    impact: number;
    description: string;
  }>>().notNull(),
  
  // Recomendações de ação
  recommendations: json("recommendations").$type<Array<{
    action: string;
    priority: "baixa" | "media" | "alta";
    expectedImpact: string;
  }>>(),
  
  // Dados usados na predição
  inputFeatures: json("inputFeatures").$type<Record<string, any>>().notNull(),
  
  // Período de validade
  predictedFor: datetime("predictedFor").notNull(), // Data para qual a predição é válida
  validUntil: datetime("validUntil").notNull(),
  
  // Feedback e validação
  actualOutcome: mysqlEnum("actualOutcome", ["permaneceu", "saiu", "pendente"]).default("pendente"),
  outcomeDate: datetime("outcomeDate"),
  wasAccurate: boolean("wasAccurate"),
  
  // Metadados
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TurnoverPrediction = typeof turnoverPredictions.$inferSelect;
export type InsertTurnoverPrediction = typeof turnoverPredictions.$inferInsert;

// ============================================================================
// ANÁLISE DE SENTIMENTO
// ============================================================================

/**
 * Análise de sentimento em feedbacks e comentários
 */
export const sentimentAnalysis = mysqlTable("sentimentAnalysis", {
  id: int("id").autoincrement().primaryKey(),
  
  // Origem do texto
  sourceType: mysqlEnum("sourceType", [
    "feedback",
    "avaliacao_comentario",
    "pdi_feedback",
    "pesquisa_resposta",
    "one_on_one"
  ]).notNull(),
  sourceId: int("sourceId").notNull(),
  
  // Texto analisado
  originalText: text("originalText").notNull(),
  language: varchar("language", { length: 10 }).default("pt-BR").notNull(),
  
  // Resultado da análise
  sentiment: mysqlEnum("sentiment", ["muito_negativo", "negativo", "neutro", "positivo", "muito_positivo"]).notNull(),
  sentimentScore: int("sentimentScore").notNull(), // -100 a +100
  confidenceScore: int("confidenceScore").notNull(), // 0-100
  
  // Emoções detectadas
  emotions: json("emotions").$type<Array<{
    emotion: string;
    intensity: number; // 0-100
  }>>(),
  
  // Tópicos e temas identificados
  topics: json("topics").$type<Array<{
    topic: string;
    relevance: number; // 0-100
  }>>(),
  
  // Palavras-chave e entidades
  keywords: json("keywords").$type<string[]>(),
  entities: json("entities").$type<Array<{
    entity: string;
    type: string;
    sentiment: string;
  }>>(),
  
  // Flags de alerta
  requiresAttention: boolean("requiresAttention").default(false).notNull(),
  alertReason: text("alertReason"),
  
  // Metadados
  analyzedBy: varchar("analyzedBy", { length: 100 }).default("ai_model").notNull(),
  modelVersion: varchar("modelVersion", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SentimentAnalysis = typeof sentimentAnalysis.$inferSelect;
export type InsertSentimentAnalysis = typeof sentimentAnalysis.$inferInsert;

// ============================================================================
// RECOMENDAÇÕES DE DESENVOLVIMENTO
// ============================================================================

/**
 * Recomendações de ações de desenvolvimento geradas por IA
 */
export const aiDevelopmentRecommendations = mysqlTable("aiDevelopmentRecommendations", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  
  // Tipo de recomendação
  recommendationType: mysqlEnum("recommendationType", [
    "curso",
    "mentoria",
    "projeto",
    "job_rotation",
    "certificacao",
    "leitura",
    "workshop"
  ]).notNull(),
  
  // Detalhes da recomendação
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description").notNull(),
  rationale: text("rationale").notNull(), // Por que foi recomendado
  
  // Prioridade e impacto
  priority: mysqlEnum("priority", ["baixa", "media", "alta", "urgente"]).notNull(),
  expectedImpact: mysqlEnum("expectedImpact", ["baixo", "medio", "alto"]).notNull(),
  
  // Competências relacionadas
  targetCompetencies: json("targetCompetencies").$type<Array<{
    competencyId: number;
    competencyName: string;
    currentLevel: number;
    targetLevel: number;
  }>>().notNull(),
  
  // Recursos necessários
  estimatedDuration: int("estimatedDuration"), // em horas
  estimatedCost: int("estimatedCost"), // em centavos
  resources: json("resources").$type<Array<{
    type: string;
    name: string;
    url?: string;
  }>>(),
  
  // Score de relevância
  relevanceScore: int("relevanceScore").notNull(), // 0-100
  confidenceScore: int("confidenceScore").notNull(), // 0-100
  
  // Status
  status: mysqlEnum("status", ["sugerida", "aceita", "em_andamento", "concluida", "rejeitada"]).default("sugerida").notNull(),
  acceptedAt: datetime("acceptedAt"),
  completedAt: datetime("completedAt"),
  
  // Feedback
  employeeFeedback: text("employeeFeedback"),
  rating: int("rating"), // 1-5
  wasHelpful: boolean("wasHelpful"),
  
  // Metadados
  generatedBy: varchar("generatedBy", { length: 100 }).default("ai_recommender").notNull(),
  modelVersion: varchar("modelVersion", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AIDevelopmentRecommendation = typeof aiDevelopmentRecommendations.$inferSelect;
export type InsertAIDevelopmentRecommendation = typeof aiDevelopmentRecommendations.$inferInsert;

// ============================================================================
// PREDIÇÃO DE DESEMPENHO
// ============================================================================

/**
 * Predições de desempenho futuro
 */
export const performancePredictions = mysqlTable("performancePredictions", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  
  // Período da predição
  predictionPeriod: mysqlEnum("predictionPeriod", ["proximo_trimestre", "proximo_semestre", "proximo_ano"]).notNull(),
  targetDate: datetime("targetDate").notNull(),
  
  // Predição de rating
  predictedRating: mysqlEnum("predictedRating", [
    "abaixo_expectativas",
    "atende_expectativas",
    "supera_expectativas",
    "excepcional"
  ]).notNull(),
  confidenceScore: int("confidenceScore").notNull(), // 0-100
  
  // Predição numérica
  predictedScore: int("predictedScore").notNull(), // 0-100
  scoreRange: json("scoreRange").$type<{
    min: number;
    max: number;
    median: number;
  }>().notNull(),
  
  // Tendência
  trend: mysqlEnum("trend", ["declinio_forte", "declinio", "estavel", "crescimento", "crescimento_forte"]).notNull(),
  trendConfidence: int("trendConfidence").notNull(), // 0-100
  
  // Fatores influenciadores
  positiveFactors: json("positiveFactors").$type<Array<{
    factor: string;
    impact: number;
    description: string;
  }>>(),
  negativeFactors: json("negativeFactors").$type<Array<{
    factor: string;
    impact: number;
    description: string;
  }>>(),
  
  // Recomendações para melhorar
  recommendations: json("recommendations").$type<Array<{
    action: string;
    expectedImprovement: number;
    priority: string;
  }>>(),
  
  // Validação
  actualRating: mysqlEnum("actualRating", [
    "abaixo_expectativas",
    "atende_expectativas",
    "supera_expectativas",
    "excepcional"
  ]),
  actualScore: int("actualScore"),
  wasAccurate: boolean("wasAccurate"),
  
  // Metadados
  modelVersion: varchar("modelVersion", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PerformancePrediction = typeof performancePredictions.$inferSelect;
export type InsertPerformancePrediction = typeof performancePredictions.$inferInsert;

// ============================================================================
// DETECÇÃO DE ANOMALIAS
// ============================================================================

/**
 * Anomalias detectadas em padrões de performance
 */
export const performanceAnomalies = mysqlTable("performanceAnomalies", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  
  // Tipo de anomalia
  anomalyType: mysqlEnum("anomalyType", [
    "queda_repentina",
    "aumento_repentino",
    "variacao_extrema",
    "padrao_incomum",
    "desvio_historico"
  ]).notNull(),
  
  // Severidade
  severity: mysqlEnum("severity", ["baixa", "media", "alta", "critica"]).notNull(),
  
  // Descrição
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description").notNull(),
  
  // Métricas afetadas
  affectedMetrics: json("affectedMetrics").$type<Array<{
    metric: string;
    expectedValue: number;
    actualValue: number;
    deviation: number;
  }>>().notNull(),
  
  // Período detectado
  detectedAt: datetime("detectedAt").notNull(),
  periodStart: datetime("periodStart").notNull(),
  periodEnd: datetime("periodEnd").notNull(),
  
  // Possíveis causas
  possibleCauses: json("possibleCauses").$type<Array<{
    cause: string;
    probability: number;
    evidence: string;
  }>>(),
  
  // Ações sugeridas
  suggestedActions: json("suggestedActions").$type<Array<{
    action: string;
    priority: string;
    expectedOutcome: string;
  }>>(),
  
  // Status
  status: mysqlEnum("status", ["nova", "investigando", "resolvida", "falso_positivo"]).default("nova").notNull(),
  resolution: text("resolution"),
  resolvedAt: datetime("resolvedAt"),
  resolvedBy: int("resolvedBy"),
  
  // Metadados
  detectionAlgorithm: varchar("detectionAlgorithm", { length: 100 }).notNull(),
  confidenceScore: int("confidenceScore").notNull(), // 0-100
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PerformanceAnomaly = typeof performanceAnomalies.$inferSelect;
export type InsertPerformanceAnomaly = typeof performanceAnomalies.$inferInsert;

// ============================================================================
// CLUSTERING DE PERFIS
// ============================================================================

/**
 * Clusters de perfis de colaboradores
 */
export const employeeClusters = mysqlTable("employeeClusters", {
  id: int("id").autoincrement().primaryKey(),
  
  // Identificação do cluster
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  
  // Características do cluster
  clusterNumber: int("clusterNumber").notNull(),
  size: int("size").notNull(), // Número de colaboradores
  
  // Perfil médio do cluster
  averageProfile: json("averageProfile").$type<{
    performanceScore: number;
    potentialScore: number;
    engagementScore: number;
    tenureMonths: number;
    age: number;
  }>().notNull(),
  
  // Características distintivas
  distinctiveFeatures: json("distinctiveFeatures").$type<Array<{
    feature: string;
    value: any;
    importance: number;
  }>>().notNull(),
  
  // Padrões de comportamento
  behaviorPatterns: json("behaviorPatterns").$type<Array<{
    pattern: string;
    frequency: number;
    significance: number;
  }>>(),
  
  // Riscos e oportunidades
  risks: json("risks").$type<string[]>(),
  opportunities: json("opportunities").$type<string[]>(),
  
  // Recomendações de gestão
  managementRecommendations: json("managementRecommendations").$type<Array<{
    recommendation: string;
    priority: string;
    expectedImpact: string;
  }>>(),
  
  // Metadados do clustering
  algorithm: varchar("algorithm", { length: 100 }).notNull(),
  silhouetteScore: int("silhouetteScore"), // 0-100, qualidade do cluster
  
  // Período de análise
  analysisStartDate: datetime("analysisStartDate").notNull(),
  analysisEndDate: datetime("analysisEndDate").notNull(),
  
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  
  // Metadados
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmployeeCluster = typeof employeeClusters.$inferSelect;
export type InsertEmployeeCluster = typeof employeeClusters.$inferInsert;

/**
 * Associação de colaboradores a clusters
 */
export const employeeClusterAssignments = mysqlTable("employeeClusterAssignments", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  clusterId: int("clusterId").notNull(),
  
  // Score de pertencimento
  membershipScore: int("membershipScore").notNull(), // 0-100
  
  // Distância ao centroide
  distanceToCentroid: int("distanceToCentroid").notNull(),
  
  // Características que levaram à atribuição
  matchingFeatures: json("matchingFeatures").$type<Array<{
    feature: string;
    employeeValue: any;
    clusterAverage: any;
    similarity: number;
  }>>(),
  
  // Período de validade
  validFrom: datetime("validFrom").notNull(),
  validUntil: datetime("validUntil"),
  
  // Metadados
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
});

export type EmployeeClusterAssignment = typeof employeeClusterAssignments.$inferSelect;
export type InsertEmployeeClusterAssignment = typeof employeeClusterAssignments.$inferInsert;

// ============================================================================
// INSIGHTS DE IA
// ============================================================================

/**
 * Insights gerados automaticamente pela IA
 */
export const aiInsights = mysqlTable("aiInsights", {
  id: int("id").autoincrement().primaryKey(),
  
  // Tipo de insight
  insightType: mysqlEnum("insightType", [
    "tendencia",
    "correlacao",
    "anomalia",
    "oportunidade",
    "risco",
    "recomendacao"
  ]).notNull(),
  
  // Categoria
  category: mysqlEnum("category", [
    "desempenho",
    "engajamento",
    "turnover",
    "desenvolvimento",
    "sucessao",
    "clima",
    "diversidade"
  ]).notNull(),
  
  // Conteúdo
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description").notNull(),
  
  // Impacto
  impactLevel: mysqlEnum("impactLevel", ["baixo", "medio", "alto", "critico"]).notNull(),
  affectedEmployees: int("affectedEmployees"), // Número de colaboradores afetados
  affectedDepartments: json("affectedDepartments").$type<number[]>(),
  
  // Dados de suporte
  supportingData: json("supportingData").$type<Record<string, any>>().notNull(),
  visualizationConfig: json("visualizationConfig").$type<{
    chartType: string;
    data: any[];
    options: Record<string, any>;
  }>(),
  
  // Ações recomendadas
  recommendedActions: json("recommendedActions").$type<Array<{
    action: string;
    priority: string;
    expectedOutcome: string;
    estimatedEffort: string;
  }>>(),
  
  // Confiança e relevância
  confidenceScore: int("confidenceScore").notNull(), // 0-100
  relevanceScore: int("relevanceScore").notNull(), // 0-100
  
  // Status
  status: mysqlEnum("status", ["novo", "visualizado", "em_acao", "resolvido", "descartado"]).default("novo").notNull(),
  viewedBy: json("viewedBy").$type<number[]>(), // IDs de usuários que visualizaram
  
  // Feedback
  wasHelpful: boolean("wasHelpful"),
  userFeedback: text("userFeedback"),
  
  // Metadados
  generatedBy: varchar("generatedBy", { length: 100 }).default("ai_insights_engine").notNull(),
  modelVersion: varchar("modelVersion", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  expiresAt: datetime("expiresAt"), // Insights podem ter validade temporal
});

export type AIInsight = typeof aiInsights.$inferSelect;
export type InsertAIInsight = typeof aiInsights.$inferInsert;
