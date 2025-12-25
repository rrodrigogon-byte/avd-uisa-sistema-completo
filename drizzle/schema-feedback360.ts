import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";
import { employees } from "./schema";

/**
 * Sistema de Feedback 360°
 * Permite avaliação multidirecional com autoavaliação, avaliação de pares, superiores e subordinados
 */

/**
 * Ciclos de Feedback 360°
 * Define períodos de avaliação
 */
export const feedback360Cycles = mysqlTable("feedback360Cycles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Período do ciclo
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  
  // Status do ciclo
  status: mysqlEnum("status", ["draft", "active", "closed"]).default("draft").notNull(),
  
  // Configurações
  allowSelfAssessment: boolean("allowSelfAssessment").default(true).notNull(),
  allowPeerAssessment: boolean("allowPeerAssessment").default(true).notNull(),
  allowManagerAssessment: boolean("allowManagerAssessment").default(true).notNull(),
  allowSubordinateAssessment: boolean("allowSubordinateAssessment").default(true).notNull(),
  
  // Número mínimo de avaliadores por tipo
  minPeerEvaluators: int("minPeerEvaluators").default(2),
  minSubordinateEvaluators: int("minSubordinateEvaluators").default(2),
  
  // Competências a serem avaliadas (JSON array de IDs)
  competencyIds: json("competencyIds").$type<number[]>(),
  
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Feedback360Cycle = typeof feedback360Cycles.$inferSelect;
export type InsertFeedback360Cycle = typeof feedback360Cycles.$inferInsert;

/**
 * Participantes do Ciclo de Feedback
 * Define quem será avaliado em cada ciclo
 */
export const feedback360Participants = mysqlTable("feedback360Participants", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").notNull().references(() => feedback360Cycles.id),
  employeeId: int("employeeId").notNull().references(() => employees.id),
  
  // Status da participação
  status: mysqlEnum("status", ["pending", "in_progress", "completed"]).default("pending").notNull(),
  
  // Datas de conclusão
  selfAssessmentCompletedAt: timestamp("selfAssessmentCompletedAt"),
  allAssessmentsCompletedAt: timestamp("allAssessmentsCompletedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Feedback360Participant = typeof feedback360Participants.$inferSelect;
export type InsertFeedback360Participant = typeof feedback360Participants.$inferInsert;

/**
 * Avaliadores Designados
 * Define quem irá avaliar cada participante
 */
export const feedback360Evaluators = mysqlTable("feedback360Evaluators", {
  id: int("id").autoincrement().primaryKey(),
  participantId: int("participantId").notNull().references(() => feedback360Participants.id),
  evaluatorId: int("evaluatorId").notNull().references(() => employees.id),
  
  // Tipo de relação
  evaluatorType: mysqlEnum("evaluatorType", [
    "self",        // Autoavaliação
    "manager",     // Gestor direto
    "peer",        // Colega/Par
    "subordinate", // Subordinado
    "other"        // Outro
  ]).notNull(),
  
  // Status da avaliação
  status: mysqlEnum("status", ["pending", "in_progress", "completed"]).default("pending").notNull(),
  completedAt: timestamp("completedAt"),
  
  // Convite
  invitedAt: timestamp("invitedAt").defaultNow().notNull(),
  reminderSentAt: timestamp("reminderSentAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Feedback360Evaluator = typeof feedback360Evaluators.$inferSelect;
export type InsertFeedback360Evaluator = typeof feedback360Evaluators.$inferInsert;

/**
 * Respostas de Avaliação
 * Armazena as respostas individuais para cada competência
 */
export const feedback360Responses = mysqlTable("feedback360Responses", {
  id: int("id").autoincrement().primaryKey(),
  evaluatorId: int("evaluatorId").notNull().references(() => feedback360Evaluators.id),
  competencyId: int("competencyId").notNull(),
  
  // Avaliação (escala 1-5)
  rating: int("rating").notNull(), // 1 = Muito abaixo, 2 = Abaixo, 3 = Atende, 4 = Supera, 5 = Excepcional
  
  // Comentários (opcional)
  comment: text("comment"),
  
  // Exemplos comportamentais (opcional)
  behavioralExamples: text("behavioralExamples"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Feedback360Response = typeof feedback360Responses.$inferSelect;
export type InsertFeedback360Response = typeof feedback360Responses.$inferInsert;

/**
 * Resultados Consolidados
 * Armazena os resultados agregados de cada participante
 */
export const feedback360Results = mysqlTable("feedback360Results", {
  id: int("id").autoincrement().primaryKey(),
  participantId: int("participantId").notNull().references(() => feedback360Participants.id),
  competencyId: int("competencyId").notNull(),
  
  // Médias por tipo de avaliador
  selfRating: int("selfRating"), // Autoavaliação (1-5)
  managerRating: int("managerRating"), // Média dos gestores
  peerRating: int("peerRating"), // Média dos pares
  subordinateRating: int("subordinateRating"), // Média dos subordinados
  overallRating: int("overallRating"), // Média geral ponderada
  
  // Contadores
  managerCount: int("managerCount").default(0),
  peerCount: int("peerCount").default(0),
  subordinateCount: int("subordinateCount").default(0),
  
  // Gap analysis
  selfPeerGap: int("selfPeerGap"), // Diferença entre auto e pares (pode ser negativo)
  selfManagerGap: int("selfManagerGap"), // Diferença entre auto e gestor
  
  // Comentários consolidados (JSON)
  consolidatedComments: json("consolidatedComments").$type<{
    positive: string[];
    developmental: string[];
    examples: string[];
  }>(),
  
  calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Feedback360Result = typeof feedback360Results.$inferSelect;
export type InsertFeedback360Result = typeof feedback360Results.$inferInsert;

/**
 * Planos de Ação do Feedback 360°
 * Ações de desenvolvimento baseadas nos resultados
 */
export const feedback360ActionPlans = mysqlTable("feedback360ActionPlans", {
  id: int("id").autoincrement().primaryKey(),
  participantId: int("participantId").notNull().references(() => feedback360Participants.id),
  competencyId: int("competencyId").notNull(),
  
  // Plano de ação
  actionDescription: text("actionDescription").notNull(),
  targetDate: timestamp("targetDate"),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  
  // Progresso
  progress: int("progress").default(0), // 0-100%
  completedAt: timestamp("completedAt"),
  
  // Notas
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Feedback360ActionPlan = typeof feedback360ActionPlans.$inferSelect;
export type InsertFeedback360ActionPlan = typeof feedback360ActionPlans.$inferInsert;
