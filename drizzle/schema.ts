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

/**
 * PIR - Plano Individual de Resultados
 */
export const pirs = mysqlTable("pirs", {
  id: int("id").autoincrement().primaryKey(),
  /** ID do usuário dono do PIR */
  userId: int("userId").notNull(),
  /** Título do PIR */
  title: varchar("title", { length: 255 }).notNull(),
  /** Descrição geral do PIR */
  description: text("description"),
  /** Período de vigência (ex: "2024", "2024-Q1") */
  period: varchar("period", { length: 100 }).notNull(),
  /** Status do PIR */
  status: mysqlEnum("status", ["draft", "active", "completed", "cancelled"]).default("draft").notNull(),
  /** ID da avaliação que originou o PIR (se aplicável) */
  evaluationId: int("evaluationId"),
  /** ID do gestor responsável */
  managerId: int("managerId").notNull(),
  /** Data de início */
  startDate: timestamp("startDate").notNull(),
  /** Data de término */
  endDate: timestamp("endDate").notNull(),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Pir = typeof pirs.$inferSelect;
export type InsertPir = typeof pirs.$inferInsert;

/**
 * Metas do PIR
 */
export const pirGoals = mysqlTable("pirGoals", {
  id: int("id").autoincrement().primaryKey(),
  /** ID do PIR */
  pirId: int("pirId").notNull(),
  /** Título da meta */
  title: varchar("title", { length: 255 }).notNull(),
  /** Descrição detalhada */
  description: text("description"),
  /** Peso da meta no PIR (0-100) */
  weight: int("weight").notNull(),
  /** Meta numérica (se aplicável) */
  targetValue: int("targetValue"),
  /** Unidade de medida (ex: "vendas", "clientes", "%") */
  unit: varchar("unit", { length: 50 }),
  /** Valor atual alcançado */
  currentValue: int("currentValue").default(0),
  /** Status da meta */
  status: mysqlEnum("status", ["not_started", "in_progress", "completed", "blocked"]).default("not_started").notNull(),
  /** Data limite */
  deadline: timestamp("deadline"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PirGoal = typeof pirGoals.$inferSelect;
export type InsertPirGoal = typeof pirGoals.$inferInsert;

/**
 * Acompanhamento de progresso das metas
 */
export const pirProgress = mysqlTable("pirProgress", {
  id: int("id").autoincrement().primaryKey(),
  /** ID da meta */
  goalId: int("goalId").notNull(),
  /** Valor registrado */
  value: int("value").notNull(),
  /** Comentários sobre o progresso */
  comments: text("comments"),
  /** Usuário que registrou */
  recordedBy: int("recordedBy").notNull(),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
});

export type PirProgress = typeof pirProgress.$inferSelect;
export type InsertPirProgress = typeof pirProgress.$inferInsert;

/**
 * Descrições de Cargo
 */
export const jobDescriptions = mysqlTable("jobDescriptions", {
  id: int("id").autoincrement().primaryKey(),
  /** Título do cargo */
  title: varchar("title", { length: 255 }).notNull(),
  /** Código/referência do cargo */
  code: varchar("code", { length: 50 }).notNull().unique(),
  /** Departamento */
  department: varchar("department", { length: 100 }),
  /** Nível hierárquico */
  level: varchar("level", { length: 50 }),
  /** Resumo do cargo */
  summary: text("summary"),
  /** Missão do cargo */
  mission: text("mission"),
  /** Versão da descrição */
  version: int("version").default(1).notNull(),
  /** Indica se é a versão ativa */
  isActive: boolean("isActive").default(true).notNull(),
  /** ID da versão anterior (para histórico) */
  previousVersionId: int("previousVersionId"),
  /** Usuário que criou/atualizou */
  createdBy: int("createdBy").notNull(),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type JobDescription = typeof jobDescriptions.$inferSelect;
export type InsertJobDescription = typeof jobDescriptions.$inferInsert;

/**
 * Responsabilidades do cargo
 */
export const jobResponsibilities = mysqlTable("jobResponsibilities", {
  id: int("id").autoincrement().primaryKey(),
  /** ID da descrição de cargo */
  jobDescriptionId: int("jobDescriptionId").notNull(),
  /** Descrição da responsabilidade */
  description: text("description").notNull(),
  /** Ordem de exibição */
  displayOrder: int("displayOrder").default(0).notNull(),
});

export type JobResponsibility = typeof jobResponsibilities.$inferSelect;
export type InsertJobResponsibility = typeof jobResponsibilities.$inferInsert;

/**
 * Competências Técnicas
 */
export const technicalCompetencies = mysqlTable("technicalCompetencies", {
  id: int("id").autoincrement().primaryKey(),
  /** ID da descrição de cargo */
  jobDescriptionId: int("jobDescriptionId").notNull(),
  /** Nome da competência */
  name: varchar("name", { length: 255 }).notNull(),
  /** Descrição detalhada */
  description: text("description"),
  /** Nível requerido (1-5) */
  requiredLevel: int("requiredLevel").notNull(),
  /** Ordem de exibição */
  displayOrder: int("displayOrder").default(0).notNull(),
});

export type TechnicalCompetency = typeof technicalCompetencies.$inferSelect;
export type InsertTechnicalCompetency = typeof technicalCompetencies.$inferInsert;

/**
 * Competências Comportamentais
 */
export const behavioralCompetencies = mysqlTable("behavioralCompetencies", {
  id: int("id").autoincrement().primaryKey(),
  /** ID da descrição de cargo */
  jobDescriptionId: int("jobDescriptionId").notNull(),
  /** Nome da competência */
  name: varchar("name", { length: 255 }).notNull(),
  /** Descrição detalhada */
  description: text("description"),
  /** Nível requerido (1-5) */
  requiredLevel: int("requiredLevel").notNull(),
  /** Ordem de exibição */
  displayOrder: int("displayOrder").default(0).notNull(),
});

export type BehavioralCompetency = typeof behavioralCompetencies.$inferSelect;
export type InsertBehavioralCompetency = typeof behavioralCompetencies.$inferInsert;

/**
 * Requisitos do Cargo
 */
export const jobRequirements = mysqlTable("jobRequirements", {
  id: int("id").autoincrement().primaryKey(),
  /** ID da descrição de cargo */
  jobDescriptionId: int("jobDescriptionId").notNull(),
  /** Tipo de requisito */
  type: mysqlEnum("type", ["education", "experience", "certification", "other"]).notNull(),
  /** Descrição do requisito */
  description: text("description").notNull(),
  /** Indica se é obrigatório */
  isRequired: boolean("isRequired").default(true).notNull(),
  /** Ordem de exibição */
  displayOrder: int("displayOrder").default(0).notNull(),
});

export type JobRequirement = typeof jobRequirements.$inferSelect;
export type InsertJobRequirement = typeof jobRequirements.$inferInsert;

/**
 * Departamentos da organização
 */
export const departments = mysqlTable("departments", {
  id: int("id").autoincrement().primaryKey(),
  /** Nome do departamento */
  name: varchar("name", { length: 255 }).notNull().unique(),
  /** Código do departamento */
  code: varchar("code", { length: 50 }).notNull().unique(),
  /** Descrição */
  description: text("description"),
  /** ID do departamento pai (para hierarquia de departamentos) */
  parentDepartmentId: int("parentDepartmentId"),
  /** ID do gestor do departamento */
  managerId: int("managerId"),
  /** Indica se está ativo */
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = typeof departments.$inferInsert;

/**
 * Cargos/Posições na organização
 */
export const positions = mysqlTable("positions", {
  id: int("id").autoincrement().primaryKey(),
  /** Título do cargo */
  title: varchar("title", { length: 255 }).notNull(),
  /** Código do cargo */
  code: varchar("code", { length: 50 }).notNull().unique(),
  /** Nível hierárquico (1=mais alto, 10=mais baixo) */
  level: int("level").notNull(),
  /** Descrição */
  description: text("description"),
  /** ID da descrição de cargo detalhada (se existir) */
  jobDescriptionId: int("jobDescriptionId"),
  /** Indica se está ativo */
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Position = typeof positions.$inferSelect;
export type InsertPosition = typeof positions.$inferInsert;

/**
 * Funcionários da organização
 */
export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  /** ID do usuário vinculado (se tiver acesso ao sistema) */
  userId: int("userId").unique(),
  /** Nome completo */
  fullName: varchar("fullName", { length: 255 }).notNull(),
  /** Email corporativo */
  email: varchar("email", { length: 320 }).notNull().unique(),
  /** Matrícula/ID funcional */
  employeeId: varchar("employeeId", { length: 50 }).notNull().unique(),
  /** ID do departamento */
  departmentId: int("departmentId").notNull(),
  /** ID do cargo */
  positionId: int("positionId").notNull(),
  /** ID do supervisor direto */
  supervisorId: int("supervisorId"),
  /** Data de admissão */
  hireDate: timestamp("hireDate").notNull(),
  /** Data de demissão (se aplicável) */
  terminationDate: timestamp("terminationDate"),
  /** Status do funcionário */
  status: mysqlEnum("status", ["active", "on_leave", "terminated"]).default("active").notNull(),
  /** Telefone */
  phone: varchar("phone", { length: 20 }),
  /** Localização/escritório */
  location: varchar("location", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;
