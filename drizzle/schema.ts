import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
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
 * Tabela de Alertas de Metas Críticas
 * Armazena alertas gerados pelo job cron de monitoramento
 */
export const criticalGoalAlerts = mysqlTable("criticalGoalAlerts", {
  id: int("id").autoincrement().primaryKey(),
  goalId: int("goalId").notNull(),
  userId: int("userId").notNull(),
  goalTitle: varchar("goalTitle", { length: 255 }).notNull(),
  currentProgress: decimal("currentProgress", { precision: 5, scale: 2 }).default("0"),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  message: text("message").notNull(),
  isRead: int("isRead").default(0),
  actionTaken: varchar("actionTaken", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export type CriticalGoalAlert = typeof criticalGoalAlerts.$inferSelect;
export type InsertCriticalGoalAlert = typeof criticalGoalAlerts.$inferInsert;

/**
 * Tabela de Relatórios Agendados
 * Controla agendamento automático de relatórios
 */
export const scheduledReports = mysqlTable("scheduledReports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  reportType: mysqlEnum("reportType", ["goals", "alerts", "performance", "summary"]).notNull(),
  format: mysqlEnum("format", ["pdf", "excel", "csv"]).notNull(),
  frequency: mysqlEnum("frequency", ["daily", "weekly", "monthly"]).notNull(),
  recipients: text("recipients"), // JSON array de emails
  lastExecuted: timestamp("lastExecuted"),
  nextExecution: timestamp("nextExecution"),
  isActive: int("isActive").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduledReport = typeof scheduledReports.$inferSelect;
export type InsertScheduledReport = typeof scheduledReports.$inferInsert;

/**
 * Tabela de Histórico de Execução de Relatórios
 * Rastreia sucesso/falha de execuções de relatórios agendados
 */
export const reportExecutionLogs = mysqlTable("reportExecutionLogs", {
  id: int("id").autoincrement().primaryKey(),
  reportId: int("reportId").notNull(),
  status: mysqlEnum("status", ["success", "failed", "pending"]).notNull(),
  executedAt: timestamp("executedAt").defaultNow().notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }),
  errorMessage: text("errorMessage"),
});

export type ReportExecutionLog = typeof reportExecutionLogs.$inferSelect;
export type InsertReportExecutionLog = typeof reportExecutionLogs.$inferInsert;

/**
 * Tabela de Histórico de Monitoramento de Metas
 * Rastreia execuções do job cron de monitoramento
 */
export const goalMonitoringLogs = mysqlTable("goalMonitoringLogs", {
  id: int("id").autoincrement().primaryKey(),
  executedAt: timestamp("executedAt").defaultNow().notNull(),
  goalsProcessed: int("goalsProcessed").default(0),
  alertsGenerated: int("alertsGenerated").default(0),
  status: mysqlEnum("status", ["success", "failed"]).notNull(),
  errorMessage: text("errorMessage"),
});

export type GoalMonitoringLog = typeof goalMonitoringLogs.$inferSelect;
export type InsertGoalMonitoringLog = typeof goalMonitoringLogs.$inferInsert;

/**
 * Tabela de Metas SMART
 * Armazena metas dos colaboradores com validacao SMART
 */
export const smartGoals = mysqlTable("smartGoals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["financial", "behavioral", "corporate", "development"]).notNull(),
  status: mysqlEnum("status", ["planejada", "em_andamento", "concluida", "cancelada"]).default("planejada"),
  progress: decimal("progress", { precision: 5, scale: 2 }).default("0").notNull(),
  targetValue: decimal("targetValue", { precision: 10, scale: 2 }),
  currentValue: decimal("currentValue", { precision: 10, scale: 2 }).default("0").notNull(),
  unit: varchar("unit", { length: 50 }),
  weight: int("weight").default(1),
  startDate: timestamp("startDate").defaultNow(),
  endDate: timestamp("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SmartGoal = typeof smartGoals.$inferSelect;
export type InsertSmartGoal = typeof smartGoals.$inferInsert;

/**
 * Tabela de Historico de Performance
 * Rastreia evolucao de performance ao longo do tempo
 */
export const performanceHistory = mysqlTable("performanceHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  performanceScore: decimal("performanceScore", { precision: 5, scale: 2 }).default("0"),
  goalsCompleted: int("goalsCompleted").default(0),
  goalsTotal: int("goalsTotal").default(0),
  alertsGenerated: int("alertsGenerated").default(0),
  criticalGoals: int("criticalGoals").default(0),
  recordedAt: timestamp("recordedAt").defaultNow(),
});

export type PerformanceHistory = typeof performanceHistory.$inferSelect;
export type InsertPerformanceHistory = typeof performanceHistory.$inferInsert;

/**
 * Tabela de Configuracao de Email
 * Armazena credenciais e configuracoes de SMTP
 */
export const emailConfig = mysqlTable("emailConfig", {
  id: int("id").autoincrement().primaryKey(),
  provider: mysqlEnum("provider", ["smtp", "sendgrid", "aws_ses"]).notNull(),
  smtpHost: varchar("smtpHost", { length: 255 }),
  smtpPort: int("smtpPort"),
  smtpUser: varchar("smtpUser", { length: 255 }),
  smtpPassword: varchar("smtpPassword", { length: 255 }),
  sendgridApiKey: varchar("sendgridApiKey", { length: 255 }),
  awsAccessKey: varchar("awsAccessKey", { length: 255 }),
  awsSecretKey: varchar("awsSecretKey", { length: 255 }),
  fromEmail: varchar("fromEmail", { length: 255 }).notNull(),
  fromName: varchar("fromName", { length: 255 }),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailConfig = typeof emailConfig.$inferSelect;
export type InsertEmailConfig = typeof emailConfig.$inferInsert;
