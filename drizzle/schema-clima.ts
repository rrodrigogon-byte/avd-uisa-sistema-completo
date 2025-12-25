import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";
import { employees, departments } from "./schema";

/**
 * Sistema de Pesquisa de Clima Organizacional
 * Permite criar pesquisas anônimas e analisar o clima da organização
 */

/**
 * Pesquisas de Clima
 * Define as pesquisas de clima organizacional
 */
export const climateSurveys = mysqlTable("climateSurveys", {
  id: int("id").autoincrement().primaryKey(),
  
  // Conteúdo
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  // Período
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  
  // Status
  status: mysqlEnum("status", ["draft", "active", "closed"]).default("draft").notNull(),
  
  // Configurações
  isAnonymous: boolean("isAnonymous").default(true).notNull(),
  allowMultipleResponses: boolean("allowMultipleResponses").default(false).notNull(),
  
  // Público-alvo
  targetDepartments: json("targetDepartments").$type<number[]>(), // IDs dos departamentos
  targetEmployees: json("targetEmployees").$type<number[]>(), // IDs específicos (se não for para todos)
  
  // Metadados
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClimateSurvey = typeof climateSurveys.$inferSelect;
export type InsertClimateSurvey = typeof climateSurveys.$inferInsert;

/**
 * Dimensões do Clima
 * Categorias de avaliação (liderança, comunicação, ambiente, etc.)
 */
export const climateDimensions = mysqlTable("climateDimensions", {
  id: int("id").autoincrement().primaryKey(),
  
  // Conteúdo
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }), // Nome do ícone
  color: varchar("color", { length: 20 }), // Cor hex
  
  // Ordem
  displayOrder: int("displayOrder").default(0),
  
  // Status
  active: boolean("active").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ClimateDimension = typeof climateDimensions.$inferSelect;
export type InsertClimateDimension = typeof climateDimensions.$inferInsert;

/**
 * Perguntas da Pesquisa
 * Perguntas organizadas por dimensão
 */
export const climateQuestions = mysqlTable("climateQuestions", {
  id: int("id").autoincrement().primaryKey(),
  surveyId: int("surveyId").notNull().references(() => climateSurveys.id),
  dimensionId: int("dimensionId").notNull().references(() => climateDimensions.id),
  
  // Conteúdo
  questionText: text("questionText").notNull(),
  
  // Tipo de resposta
  questionType: mysqlEnum("questionType", ["scale", "multiple_choice", "text", "yes_no"]).notNull(),
  
  // Opções (para multiple_choice)
  options: json("options").$type<string[]>(),
  
  // Escala (para scale)
  scaleMin: int("scaleMin").default(1),
  scaleMax: int("scaleMax").default(5),
  scaleMinLabel: varchar("scaleMinLabel", { length: 100 }),
  scaleMaxLabel: varchar("scaleMaxLabel", { length: 100 }),
  
  // Configurações
  isRequired: boolean("isRequired").default(true).notNull(),
  displayOrder: int("displayOrder").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ClimateQuestion = typeof climateQuestions.$inferSelect;
export type InsertClimateQuestion = typeof climateQuestions.$inferInsert;

/**
 * Respostas da Pesquisa
 * Respostas anônimas dos colaboradores
 */
export const climateResponses = mysqlTable("climateResponses", {
  id: int("id").autoincrement().primaryKey(),
  surveyId: int("surveyId").notNull().references(() => climateSurveys.id),
  questionId: int("questionId").notNull().references(() => climateQuestions.id),
  
  // Identificação anônima (hash do employeeId + surveyId)
  responseToken: varchar("responseToken", { length: 64 }).notNull(),
  
  // Dados demográficos (para segmentação, mas mantendo anonimato)
  departmentId: int("departmentId").references(() => departments.id),
  hierarchyLevel: varchar("hierarchyLevel", { length: 50 }),
  tenureRange: varchar("tenureRange", { length: 50 }), // Ex: "0-1 ano", "1-3 anos"
  
  // Resposta
  responseValue: int("responseValue"), // Para scale e yes_no
  responseText: text("responseText"), // Para text e multiple_choice
  
  // Metadados
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
});

export type ClimateResponse = typeof climateResponses.$inferSelect;
export type InsertClimateResponse = typeof climateResponses.$inferInsert;

/**
 * Resultados Consolidados
 * Análise agregada dos resultados
 */
export const climateResults = mysqlTable("climateResults", {
  id: int("id").autoincrement().primaryKey(),
  surveyId: int("surveyId").notNull().references(() => climateSurveys.id),
  dimensionId: int("dimensionId").notNull().references(() => climateDimensions.id),
  
  // Segmentação
  departmentId: int("departmentId").references(() => departments.id),
  hierarchyLevel: varchar("hierarchyLevel", { length: 50 }),
  
  // Métricas
  averageScore: int("averageScore"), // Média (0-100)
  responseCount: int("responseCount").notNull(),
  participationRate: int("participationRate"), // % de participação
  
  // Distribuição de respostas
  scoreDistribution: json("scoreDistribution").$type<Record<string, number>>(), // { "1": 5, "2": 10, ... }
  
  // Análise
  trend: mysqlEnum("trend", ["improving", "stable", "declining"]),
  previousScore: int("previousScore"), // Comparação com pesquisa anterior
  
  calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
});

export type ClimateResult = typeof climateResults.$inferSelect;
export type InsertClimateResult = typeof climateResults.$inferInsert;

/**
 * Insights e Recomendações
 * Análises e sugestões baseadas nos resultados
 */
export const climateInsights = mysqlTable("climateInsights", {
  id: int("id").autoincrement().primaryKey(),
  surveyId: int("surveyId").notNull().references(() => climateSurveys.id),
  dimensionId: int("dimensionId").references(() => climateDimensions.id),
  departmentId: int("departmentId").references(() => departments.id),
  
  // Tipo de insight
  insightType: mysqlEnum("insightType", ["strength", "concern", "opportunity", "recommendation"]).notNull(),
  
  // Conteúdo
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  
  // Prioridade
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  
  // Ações sugeridas
  suggestedActions: json("suggestedActions").$type<string[]>(),
  
  // Status
  status: mysqlEnum("status", ["new", "acknowledged", "in_progress", "completed"]).default("new").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClimateInsight = typeof climateInsights.$inferSelect;
export type InsertClimateInsight = typeof climateInsights.$inferInsert;
