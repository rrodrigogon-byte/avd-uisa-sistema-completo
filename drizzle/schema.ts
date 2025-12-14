import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Templates de avaliação - estruturas reutilizáveis para criar avaliações
 */
export const evaluationTemplates = mysqlTable("evaluationTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  /** JSON contendo a estrutura do template (perguntas, critérios, etc) */
  structure: text("structure").notNull(),
  /** Indica se o template está ativo para uso */
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EvaluationTemplate = typeof evaluationTemplates.$inferSelect;
export type InsertEvaluationTemplate = typeof evaluationTemplates.$inferInsert;

/**
 * Avaliações de desempenho
 */
export const evaluations = mysqlTable("evaluations", {
  id: int("id").autoincrement().primaryKey(),
  /** ID do template utilizado */
  templateId: int("templateId").notNull(),
  /** ID do usuário sendo avaliado */
  evaluatedUserId: int("evaluatedUserId").notNull(),
  /** ID do avaliador */
  evaluatorId: int("evaluatorId").notNull(),
  /** Período de avaliação (ex: "2024-Q1", "Janeiro 2024") */
  period: varchar("period", { length: 100 }).notNull(),
  /** Status da avaliação */
  status: mysqlEnum("status", ["draft", "submitted", "approved", "rejected"]).default("draft").notNull(),
  /** JSON contendo as respostas da avaliação */
  responses: text("responses").notNull(),
  /** Comentários gerais do avaliador */
  comments: text("comments"),
  /** Nota/pontuação final (0-100) */
  score: int("score"),
  submittedAt: timestamp("submittedAt"),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Evaluation = typeof evaluations.$inferSelect;
export type InsertEvaluation = typeof evaluations.$inferInsert;

/**
 * Configurações de notificações por usuário
 */
export const notificationSettings = mysqlTable("notificationSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  /** Notificar quando uma nova avaliação for atribuída */
  notifyOnNewEvaluation: boolean("notifyOnNewEvaluation").default(true).notNull(),
  /** Notificar lembretes de avaliações pendentes */
  notifyPendingReminders: boolean("notifyPendingReminders").default(true).notNull(),
  /** Notificar quando uma avaliação for aprovada/rejeitada */
  notifyOnStatusChange: boolean("notifyOnStatusChange").default(true).notNull(),
  /** Dias antes do prazo para enviar lembrete (ex: 3, 7, 14) */
  reminderDaysBefore: int("reminderDaysBefore").default(7).notNull(),
  /** Frequência de lembretes (daily, weekly) */
  reminderFrequency: mysqlEnum("reminderFrequency", ["daily", "weekly"]).default("weekly").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationSetting = typeof notificationSettings.$inferSelect;
export type InsertNotificationSetting = typeof notificationSettings.$inferInsert;

/**
 * Log de notificações enviadas
 */
export const notificationLogs = mysqlTable("notificationLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Tipo de notificação enviada */
  type: mysqlEnum("type", ["new_evaluation", "reminder", "status_change", "deadline_approaching"]).notNull(),
  /** ID da avaliação relacionada (se aplicável) */
  evaluationId: int("evaluationId"),
  /** Título da notificação */
  title: varchar("title", { length: 255 }).notNull(),
  /** Conteúdo da notificação */
  content: text("content").notNull(),
  /** Indica se a notificação foi lida */
  isRead: boolean("isRead").default(false).notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
});

export type NotificationLog = typeof notificationLogs.$inferSelect;
export type InsertNotificationLog = typeof notificationLogs.$inferInsert;

/**
 * Relatórios gerenciais salvos
 */
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  /** Nome do relatório */
  name: varchar("name", { length: 255 }).notNull(),
  /** Tipo de relatório */
  type: mysqlEnum("type", ["performance_overview", "team_comparison", "individual_progress", "custom"]).notNull(),
  /** Período do relatório */
  period: varchar("period", { length: 100 }).notNull(),
  /** JSON contendo os dados e configurações do relatório */
  data: text("data").notNull(),
  /** Usuário que gerou o relatório */
  generatedBy: int("generatedBy").notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;
