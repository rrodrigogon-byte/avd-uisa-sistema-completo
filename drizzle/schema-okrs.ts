import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";
import { employees, departments } from "./schema";

/**
 * Sistema de Metas e OKRs (Objectives and Key Results)
 * Permite definição, cascata e acompanhamento de objetivos estratégicos
 */

/**
 * Objetivos (Objectives)
 * Define os objetivos estratégicos em diferentes níveis
 */
export const objectives = mysqlTable("objectives", {
  id: int("id").autoincrement().primaryKey(),
  
  // Hierarquia
  parentId: int("parentId"), // Objetivo pai (para cascata)
  level: mysqlEnum("level", ["company", "department", "team", "individual"]).notNull(),
  
  // Vinculação
  departmentId: int("departmentId").references(() => departments.id),
  employeeId: int("employeeId").references(() => employees.id),
  
  // Conteúdo
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  // Período
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  quarter: int("quarter"), // 1, 2, 3, 4
  year: int("year").notNull(),
  
  // Status
  status: mysqlEnum("status", ["draft", "active", "completed", "cancelled"]).default("draft").notNull(),
  
  // Progresso
  progress: int("progress").default(0), // 0-100%
  
  // Metadados
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Objective = typeof objectives.$inferSelect;
export type InsertObjective = typeof objectives.$inferInsert;

/**
 * Resultados-Chave (Key Results)
 * Métricas mensuráveis para acompanhar o progresso dos objetivos
 */
export const keyResults = mysqlTable("keyResults", {
  id: int("id").autoincrement().primaryKey(),
  objectiveId: int("objectiveId").notNull().references(() => objectives.id),
  
  // Conteúdo
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  // Métrica
  metricType: mysqlEnum("metricType", ["number", "percentage", "currency", "boolean"]).notNull(),
  startValue: int("startValue").default(0),
  targetValue: int("targetValue").notNull(),
  currentValue: int("currentValue").default(0),
  unit: varchar("unit", { length: 50 }), // Ex: "vendas", "clientes", "R$"
  
  // Progresso
  progress: int("progress").default(0), // 0-100%
  
  // Status
  status: mysqlEnum("status", ["not_started", "on_track", "at_risk", "behind", "completed"]).default("not_started").notNull(),
  
  // Peso (importância relativa)
  weight: int("weight").default(100), // 0-100%
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KeyResult = typeof keyResults.$inferSelect;
export type InsertKeyResult = typeof keyResults.$inferInsert;

/**
 * Check-ins de Progresso
 * Atualizações periódicas do progresso dos objetivos
 */
export const okrCheckIns = mysqlTable("okrCheckIns", {
  id: int("id").autoincrement().primaryKey(),
  objectiveId: int("objectiveId").references(() => objectives.id),
  keyResultId: int("keyResultId").references(() => keyResults.id),
  
  // Progresso
  previousValue: int("previousValue"),
  currentValue: int("currentValue").notNull(),
  progress: int("progress").notNull(), // 0-100%
  
  // Status
  status: mysqlEnum("status", ["on_track", "at_risk", "behind"]).notNull(),
  confidence: mysqlEnum("confidence", ["low", "medium", "high"]).default("medium"),
  
  // Comentários
  comment: text("comment"),
  blockers: text("blockers"), // Impedimentos
  nextSteps: text("nextSteps"), // Próximos passos
  
  // Metadados
  checkInDate: timestamp("checkInDate").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OKRCheckIn = typeof okrCheckIns.$inferSelect;
export type InsertOKRCheckIn = typeof okrCheckIns.$inferInsert;

/**
 * Alinhamento de OKRs
 * Rastreia o alinhamento entre objetivos em diferentes níveis
 */
export const okrAlignments = mysqlTable("okrAlignments", {
  id: int("id").autoincrement().primaryKey(),
  parentObjectiveId: int("parentObjectiveId").notNull().references(() => objectives.id),
  childObjectiveId: int("childObjectiveId").notNull().references(() => objectives.id),
  
  // Tipo de alinhamento
  alignmentType: mysqlEnum("alignmentType", ["supports", "contributes_to", "depends_on"]).notNull(),
  
  // Peso da contribuição
  contributionWeight: int("contributionWeight").default(100), // 0-100%
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OKRAlignment = typeof okrAlignments.$inferSelect;
export type InsertOKRAlignment = typeof okrAlignments.$inferInsert;

/**
 * Histórico de Mudanças
 * Rastreia alterações nos OKRs ao longo do tempo
 */
export const okrHistory = mysqlTable("okrHistory", {
  id: int("id").autoincrement().primaryKey(),
  objectiveId: int("objectiveId").references(() => objectives.id),
  keyResultId: int("keyResultId").references(() => keyResults.id),
  
  // Tipo de mudança
  changeType: mysqlEnum("changeType", [
    "created",
    "updated",
    "progress_updated",
    "status_changed",
    "completed",
    "cancelled"
  ]).notNull(),
  
  // Dados da mudança
  fieldChanged: varchar("fieldChanged", { length: 100 }),
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  
  // Metadados
  changedBy: int("changedBy").notNull(),
  changedAt: timestamp("changedAt").defaultNow().notNull(),
  comment: text("comment"),
});

export type OKRHistory = typeof okrHistory.$inferSelect;
export type InsertOKRHistory = typeof okrHistory.$inferInsert;

/**
 * Templates de OKRs
 * Templates reutilizáveis para objetivos comuns
 */
export const okrTemplates = mysqlTable("okrTemplates", {
  id: int("id").autoincrement().primaryKey(),
  
  // Conteúdo
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }), // Ex: "Vendas", "Marketing", "Produto"
  
  // Template
  objectiveTemplate: text("objectiveTemplate").notNull(),
  keyResultsTemplate: text("keyResultsTemplate").notNull(), // JSON array
  
  // Configurações
  level: mysqlEnum("level", ["company", "department", "team", "individual"]).notNull(),
  recommendedDuration: int("recommendedDuration"), // Em dias
  
  // Status
  isPublic: boolean("isPublic").default(true),
  usageCount: int("usageCount").default(0),
  
  // Metadados
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OKRTemplate = typeof okrTemplates.$inferSelect;
export type InsertOKRTemplate = typeof okrTemplates.$inferInsert;
