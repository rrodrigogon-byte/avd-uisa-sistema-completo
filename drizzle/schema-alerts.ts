import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { employees } from "./schema";

/**
 * Sistema de Alertas de Produtividade
 * Centraliza todos os alertas gerados automaticamente pelo sistema
 */
export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull().references(() => employees.id),
  
  // Tipo e severidade do alerta
  type: mysqlEnum("type", [
    "low_productivity",
    "inconsistent_hours",
    "low_diversity",
    "missing_activities",
    "time_discrepancy",
    "goal_overdue",
    "evaluation_pending"
  ]).notNull(),
  severity: mysqlEnum("severity", ["critical", "high", "medium", "low"]).notNull(),
  
  // Conteúdo do alerta
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  
  // Métricas relacionadas (JSON)
  metrics: text("metrics"), // JSON: { efficiency: 0.45, consistency: 0.3, etc }
  
  // Status e ações
  status: mysqlEnum("status", ["active", "resolved", "dismissed"]).default("active").notNull(),
  resolvedBy: int("resolvedBy").references(() => employees.id),
  resolvedAt: timestamp("resolvedAt"),
  resolutionNotes: text("resolutionNotes"),
  
  // Ações tomadas
  actionTaken: mysqlEnum("actionTaken", [
    "email_sent",
    "meeting_scheduled",
    "warning_issued",
    "training_assigned",
    "none"
  ]),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Registros de Ponto Eletrônico
 * Armazena dados importados do sistema de ponto para comparação
 */
export const timeClockRecords = mysqlTable("timeClockRecords", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull().references(() => employees.id),
  
  // Data e horários
  date: timestamp("date").notNull(),
  clockIn: timestamp("clockIn"),
  clockOut: timestamp("clockOut"),
  
  // Horas calculadas (em minutos)
  totalMinutes: int("totalMinutes"), // Total de minutos trabalhados
  breakMinutes: int("breakMinutes").default(0), // Minutos de intervalo
  workedMinutes: int("workedMinutes"), // totalMinutes - breakMinutes
  
  // Tipo de registro
  recordType: mysqlEnum("recordType", [
    "normal",
    "overtime",
    "absence",
    "late",
    "early_leave",
    "holiday"
  ]).default("normal").notNull(),
  
  // Localização (se disponível)
  location: varchar("location", { length: 255 }),
  
  // Observações
  notes: text("notes"),
  
  // Importação
  importedAt: timestamp("importedAt").defaultNow().notNull(),
  importSource: varchar("importSource", { length: 100 }), // "manual", "api", "csv"
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Discrepâncias entre Atividades e Ponto
 * Identifica inconsistências entre horas registradas manualmente e ponto eletrônico
 */
export const timeDiscrepancies = mysqlTable("timeDiscrepancies", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull().references(() => employees.id),
  
  // Período da discrepância
  date: timestamp("date").notNull(),
  
  // Horas registradas (em minutos)
  clockMinutes: int("clockMinutes").notNull(), // Do ponto eletrônico
  activityMinutes: int("activityMinutes").notNull(), // Das atividades manuais
  
  // Diferença
  differenceMinutes: int("differenceMinutes").notNull(), // clockMinutes - activityMinutes
  differencePercentage: decimal("differencePercentage", { precision: 5, scale: 2 }), // % de diferença
  
  // Classificação
  discrepancyType: mysqlEnum("discrepancyType", [
    "over_reported", // Mais atividades que ponto
    "under_reported", // Menos atividades que ponto
    "acceptable" // Diferença < 10%
  ]).notNull(),
  
  // Status
  status: mysqlEnum("status", ["pending", "reviewed", "justified", "flagged"]).default("pending").notNull(),
  reviewedBy: int("reviewedBy").references(() => employees.id),
  reviewedAt: timestamp("reviewedAt"),
  justification: text("justification"),
  
  // Alerta gerado
  alertId: int("alertId").references(() => alerts.id),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

export type TimeClockRecord = typeof timeClockRecords.$inferSelect;
export type InsertTimeClockRecord = typeof timeClockRecords.$inferInsert;

export type TimeDiscrepancy = typeof timeDiscrepancies.$inferSelect;
export type InsertTimeDiscrepancy = typeof timeDiscrepancies.$inferInsert;
