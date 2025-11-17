import { relations } from "drizzle-orm";
import {
  boolean,
  datetime,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Sistema AVD UISA - Schema Completo
 * Sistema de Avaliação de Desempenho e Gestão de Talentos
 */

// ============================================================================
// TABELAS DE AUTENTICAÇÃO E USUÁRIOS
// ============================================================================

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "rh", "gestor", "colaborador"]).default("colaborador").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  // Reconhecimento facial
  faceDescriptor: text("faceDescriptor"), // JSON com descritores faciais
  facePhotoUrl: varchar("facePhotoUrl", { length: 512 }),
  faceRegisteredAt: datetime("faceRegisteredAt"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const passwordResetTokens = mysqlTable("passwordResetTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: datetime("expiresAt").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

// ============================================================================
// TABELAS DE ESTRUTURA ORGANIZACIONAL
// ============================================================================

export const departments = mysqlTable("departments", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  parentId: int("parentId"), // Departamento pai (hierarquia)
  managerId: int("managerId"), // Gestor do departamento
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = typeof departments.$inferInsert;

export const positions = mysqlTable("positions", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  level: mysqlEnum("level", ["junior", "pleno", "senior", "especialista", "coordenador", "gerente", "diretor"]),
  departmentId: int("departmentId"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Position = typeof positions.$inferSelect;
export type InsertPosition = typeof positions.$inferInsert;

export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").unique(), // Vinculação com usuário do sistema
  employeeCode: varchar("employeeCode", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  cpf: varchar("cpf", { length: 14 }).unique(),
  birthDate: datetime("birthDate"),
  hireDate: datetime("hireDate").notNull(),
  departmentId: int("departmentId").notNull(),
  positionId: int("positionId").notNull(),
  managerId: int("managerId"), // Gestor direto
  photoUrl: varchar("photoUrl", { length: 512 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  status: mysqlEnum("status", ["ativo", "afastado", "desligado"]).default("ativo").notNull(),
  // Integração TOTVS RM
  rmCode: varchar("rmCode", { length: 50 }),
  rmLastSync: datetime("rmLastSync"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

// ============================================================================
// TABELAS DE COMPETÊNCIAS
// ============================================================================

export const competencies = mysqlTable("competencies", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["tecnica", "comportamental", "lideranca"]).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Competency = typeof competencies.$inferSelect;
export type InsertCompetency = typeof competencies.$inferInsert;

export const competencyLevels = mysqlTable("competencyLevels", {
  id: int("id").autoincrement().primaryKey(),
  competencyId: int("competencyId").notNull(),
  level: int("level").notNull(), // 1 a 5
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CompetencyLevel = typeof competencyLevels.$inferSelect;
export type InsertCompetencyLevel = typeof competencyLevels.$inferInsert;

export const positionCompetencies = mysqlTable("positionCompetencies", {
  id: int("id").autoincrement().primaryKey(),
  positionId: int("positionId").notNull(),
  competencyId: int("competencyId").notNull(),
  requiredLevel: int("requiredLevel").notNull(), // Nível exigido (1-5)
  weight: int("weight").default(1).notNull(), // Peso da competência
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PositionCompetency = typeof positionCompetencies.$inferSelect;
export type InsertPositionCompetency = typeof positionCompetencies.$inferInsert;

export const employeeCompetencies = mysqlTable("employeeCompetencies", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  competencyId: int("competencyId").notNull(),
  currentLevel: int("currentLevel").notNull(), // Nível atual (1-5)
  evaluatedAt: datetime("evaluatedAt").notNull(),
  evaluatedBy: int("evaluatedBy"), // ID do avaliador
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmployeeCompetency = typeof employeeCompetencies.$inferSelect;
export type InsertEmployeeCompetency = typeof employeeCompetencies.$inferInsert;

// ============================================================================
// TABELAS DE CICLOS DE AVALIAÇÃO
// ============================================================================

export const evaluationCycles = mysqlTable("evaluationCycles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  year: int("year").notNull(),
  type: mysqlEnum("type", ["anual", "semestral", "trimestral"]).notNull(),
  startDate: datetime("startDate").notNull(),
  endDate: datetime("endDate").notNull(),
  status: mysqlEnum("status", ["planejamento", "em_andamento", "concluido", "cancelado"]).default("planejamento").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EvaluationCycle = typeof evaluationCycles.$inferSelect;
export type InsertEvaluationCycle = typeof evaluationCycles.$inferInsert;

// ============================================================================
// TABELAS DE METAS
// ============================================================================

export const goals = mysqlTable("goals", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").notNull(),
  employeeId: int("employeeId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["individual", "equipe", "organizacional"]).notNull(),
  category: mysqlEnum("category", ["quantitativa", "qualitativa"]).notNull(),
  targetValue: varchar("targetValue", { length: 100 }),
  currentValue: varchar("currentValue", { length: 100 }),
  unit: varchar("unit", { length: 50 }), // unidade de medida
  weight: int("weight").default(1).notNull(), // Peso da meta
  startDate: datetime("startDate").notNull(),
  endDate: datetime("endDate").notNull(),
  status: mysqlEnum("status", ["rascunho", "pendente_aprovacao", "aprovada", "em_andamento", "concluida", "cancelada"]).default("rascunho").notNull(),
  progress: int("progress").default(0).notNull(), // Percentual 0-100
  linkedToPLR: boolean("linkedToPLR").default(false).notNull(),
  linkedToBonus: boolean("linkedToBonus").default(false).notNull(),
  createdBy: int("createdBy").notNull(),
  approvedBy: int("approvedBy"),
  approvedAt: datetime("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = typeof goals.$inferInsert;

export const goalUpdates = mysqlTable("goalUpdates", {
  id: int("id").autoincrement().primaryKey(),
  goalId: int("goalId").notNull(),
  progress: int("progress").notNull(),
  currentValue: varchar("currentValue", { length: 100 }),
  notes: text("notes"),
  updatedBy: int("updatedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GoalUpdate = typeof goalUpdates.$inferSelect;
export type InsertGoalUpdate = typeof goalUpdates.$inferInsert;

// ============================================================================
// TABELAS DE AVALIAÇÃO 360°
// ============================================================================

export const performanceEvaluations = mysqlTable("performanceEvaluations", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").notNull(),
  employeeId: int("employeeId").notNull(),
  type: mysqlEnum("type", ["360", "180", "90"]).notNull(),
  status: mysqlEnum("status", ["pendente", "em_andamento", "concluida"]).default("pendente").notNull(),
  selfEvaluationCompleted: boolean("selfEvaluationCompleted").default(false).notNull(),
  managerEvaluationCompleted: boolean("managerEvaluationCompleted").default(false).notNull(),
  peersEvaluationCompleted: boolean("peersEvaluationCompleted").default(false).notNull(),
  subordinatesEvaluationCompleted: boolean("subordinatesEvaluationCompleted").default(false).notNull(),
  finalScore: int("finalScore"), // Nota final (0-100)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: datetime("completedAt"),
});

export type PerformanceEvaluation = typeof performanceEvaluations.$inferSelect;
export type InsertPerformanceEvaluation = typeof performanceEvaluations.$inferInsert;

export const evaluationQuestions = mysqlTable("evaluationQuestions", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  question: text("question").notNull(),
  category: varchar("category", { length: 100 }),
  type: mysqlEnum("type", ["escala", "texto", "multipla_escolha"]).notNull(),
  options: text("options"), // JSON com opções para múltipla escolha
  weight: int("weight").default(1).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EvaluationQuestion = typeof evaluationQuestions.$inferSelect;
export type InsertEvaluationQuestion = typeof evaluationQuestions.$inferInsert;

export const evaluationResponses = mysqlTable("evaluationResponses", {
  id: int("id").autoincrement().primaryKey(),
  evaluationId: int("evaluationId").notNull(),
  questionId: int("questionId").notNull(),
  evaluatorId: int("evaluatorId").notNull(),
  evaluatorType: mysqlEnum("evaluatorType", ["self", "manager", "peer", "subordinate"]).notNull(),
  score: int("score"), // Para questões de escala (1-5)
  textResponse: text("textResponse"), // Para questões abertas
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EvaluationResponse = typeof evaluationResponses.$inferSelect;
export type InsertEvaluationResponse = typeof evaluationResponses.$inferInsert;

// ============================================================================
// TABELAS DE MATRIZ 9-BOX
// ============================================================================

export const nineBoxPositions = mysqlTable("nineBoxPositions", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").notNull(),
  employeeId: int("employeeId").notNull(),
  performance: int("performance").notNull(), // 1-3 (baixo, médio, alto)
  potential: int("potential").notNull(), // 1-3 (baixo, médio, alto)
  box: varchar("box", { length: 50 }).notNull(), // ex: "alto_desempenho_alto_potencial"
  calibrated: boolean("calibrated").default(false).notNull(),
  calibratedBy: int("calibratedBy"),
  calibratedAt: datetime("calibratedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NineBoxPosition = typeof nineBoxPositions.$inferSelect;
export type InsertNineBoxPosition = typeof nineBoxPositions.$inferInsert;

// ============================================================================
// TABELAS DE PDI (Plano de Desenvolvimento Individual)
// ============================================================================

export const pdiPlans = mysqlTable("pdiPlans", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").notNull(),
  employeeId: int("employeeId").notNull(),
  targetPositionId: int("targetPositionId"), // Cargo almejado
  status: mysqlEnum("status", ["rascunho", "pendente_aprovacao", "aprovado", "em_andamento", "concluido", "cancelado"]).default("rascunho").notNull(),
  startDate: datetime("startDate").notNull(),
  endDate: datetime("endDate").notNull(),
  overallProgress: int("overallProgress").default(0).notNull(), // Percentual 0-100
  approvedBy: int("approvedBy"),
  approvedAt: datetime("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: datetime("completedAt"),
});

export type PdiPlan = typeof pdiPlans.$inferSelect;
export type InsertPdiPlan = typeof pdiPlans.$inferInsert;

export const developmentActions = mysqlTable("developmentActions", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["70_pratica", "20_mentoria", "10_curso"]).notNull(), // Modelo 70-20-10
  type: varchar("type", { length: 100 }), // ex: "projeto", "job_rotation", "curso_online"
  competencyId: int("competencyId"), // Competência desenvolvida
  duration: int("duration"), // Duração em horas
  provider: varchar("provider", { length: 255 }), // Fornecedor/plataforma
  url: varchar("url", { length: 512 }),
  cost: int("cost"), // Custo em centavos
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DevelopmentAction = typeof developmentActions.$inferSelect;
export type InsertDevelopmentAction = typeof developmentActions.$inferInsert;

export const pdiItems = mysqlTable("pdiItems", {
  id: int("id").autoincrement().primaryKey(),
  planId: int("planId").notNull(),
  actionId: int("actionId"), // Ação do catálogo (opcional)
  competencyId: int("competencyId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["70_pratica", "20_mentoria", "10_curso"]).notNull(),
  type: varchar("type", { length: 100 }),
  startDate: datetime("startDate").notNull(),
  endDate: datetime("endDate").notNull(),
  status: mysqlEnum("status", ["pendente", "em_andamento", "concluida", "cancelada"]).default("pendente").notNull(),
  progress: int("progress").default(0).notNull(), // Percentual 0-100
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: datetime("completedAt"),
});

export type PdiItem = typeof pdiItems.$inferSelect;
export type InsertPdiItem = typeof pdiItems.$inferInsert;

export const pdiProgress = mysqlTable("pdiProgress", {
  id: int("id").autoincrement().primaryKey(),
  itemId: int("itemId").notNull(),
  progress: int("progress").notNull(),
  notes: text("notes"),
  evidenceUrl: varchar("evidenceUrl", { length: 512 }), // URL de evidência (certificado, etc)
  updatedBy: int("updatedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PdiProgress = typeof pdiProgress.$inferSelect;
export type InsertPdiProgress = typeof pdiProgress.$inferInsert;

// ============================================================================
// TABELAS DE SUCESSÃO
// ============================================================================

export const successionPlans = mysqlTable("successionPlans", {
  id: int("id").autoincrement().primaryKey(),
  positionId: int("positionId").notNull(),
  currentHolderId: int("currentHolderId"), // Ocupante atual
  isCritical: boolean("isCritical").default(false).notNull(),
  riskLevel: mysqlEnum("riskLevel", ["baixo", "medio", "alto", "critico"]).default("medio").notNull(),
  status: mysqlEnum("status", ["ativo", "inativo"]).default("ativo").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SuccessionPlan = typeof successionPlans.$inferSelect;
export type InsertSuccessionPlan = typeof successionPlans.$inferInsert;

export const successionCandidates = mysqlTable("successionCandidates", {
  id: int("id").autoincrement().primaryKey(),
  planId: int("planId").notNull(),
  employeeId: int("employeeId").notNull(),
  readinessLevel: mysqlEnum("readinessLevel", ["imediato", "1_ano", "2_3_anos", "mais_3_anos"]).notNull(),
  priority: int("priority").default(1).notNull(), // Ordem de prioridade
  developmentPlanId: int("developmentPlanId"), // PDI associado
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SuccessionCandidate = typeof successionCandidates.$inferSelect;
export type InsertSuccessionCandidate = typeof successionCandidates.$inferInsert;

// ============================================================================
// TABELAS DE NOTIFICAÇÕES E E-MAIL
// ============================================================================

export const emailMetrics = mysqlTable("emailMetrics", {
  id: int("id").autoincrement().primaryKey(),
  type: varchar("type", { length: 100 }).notNull(), // Tipo de e-mail
  toEmail: varchar("toEmail", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 255 }),
  success: boolean("success").notNull(),
  deliveryTime: int("deliveryTime"), // Tempo em ms
  messageId: varchar("messageId", { length: 255 }),
  error: text("error"),
  attempts: int("attempts").default(1).notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
});

export type EmailMetric = typeof emailMetrics.$inferSelect;
export type InsertEmailMetric = typeof emailMetrics.$inferInsert;

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  link: varchar("link", { length: 512 }),
  read: boolean("read").default(false).notNull(),
  readAt: datetime("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ============================================================================
// TABELAS DE AUDITORIA
// ============================================================================

export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  action: varchar("action", { length: 100 }).notNull(),
  entity: varchar("entity", { length: 100 }).notNull(),
  entityId: int("entityId"),
  changes: text("changes"), // JSON com mudanças
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ============================================================================
// RELAÇÕES (Relations)
// ============================================================================

export const employeesRelations = relations(employees, ({ one, many }) => ({
  user: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
  department: one(departments, {
    fields: [employees.departmentId],
    references: [departments.id],
  }),
  position: one(positions, {
    fields: [employees.positionId],
    references: [positions.id],
  }),
  manager: one(employees, {
    fields: [employees.managerId],
    references: [employees.id],
  }),
  goals: many(goals),
  evaluations: many(performanceEvaluations),
  pdiPlans: many(pdiPlans),
  competencies: many(employeeCompetencies),
}));

export const goalsRelations = relations(goals, ({ one, many }) => ({
  employee: one(employees, {
    fields: [goals.employeeId],
    references: [employees.id],
  }),
  cycle: one(evaluationCycles, {
    fields: [goals.cycleId],
    references: [evaluationCycles.id],
  }),
  updates: many(goalUpdates),
}));

export const pdiPlansRelations = relations(pdiPlans, ({ one, many }) => ({
  employee: one(employees, {
    fields: [pdiPlans.employeeId],
    references: [employees.id],
  }),
  cycle: one(evaluationCycles, {
    fields: [pdiPlans.cycleId],
    references: [evaluationCycles.id],
  }),
  targetPosition: one(positions, {
    fields: [pdiPlans.targetPositionId],
    references: [positions.id],
  }),
  items: many(pdiItems),
}));

export const pdiItemsRelations = relations(pdiItems, ({ one, many }) => ({
  plan: one(pdiPlans, {
    fields: [pdiItems.planId],
    references: [pdiPlans.id],
  }),
  action: one(developmentActions, {
    fields: [pdiItems.actionId],
    references: [developmentActions.id],
  }),
  competency: one(competencies, {
    fields: [pdiItems.competencyId],
    references: [competencies.id],
  }),
  progress: many(pdiProgress),
}));


// ============================================================================
// TESTES PSICOMÉTRICOS
// ============================================================================

export const psychometricTests = mysqlTable("psychometricTests", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  testType: mysqlEnum("testType", ["disc", "bigfive"]).notNull(),
  completedAt: datetime("completedAt").notNull(),
  // Resultados DISC (0-100 para cada dimensão)
  discDominance: int("discDominance"), // Dominância
  discInfluence: int("discInfluence"), // Influência
  discSteadiness: int("discSteadiness"), // Estabilidade
  discCompliance: int("discCompliance"), // Conformidade
  discProfile: varchar("discProfile", { length: 10 }), // Ex: "D", "I", "S", "C", "DI", "SC"
  // Resultados Big Five (0-100 para cada dimensão)
  bigFiveOpenness: int("bigFiveOpenness"), // Abertura
  bigFiveConscientiousness: int("bigFiveConscientiousness"), // Conscienciosidade
  bigFiveExtraversion: int("bigFiveExtraversion"), // Extroversão
  bigFiveAgreeableness: int("bigFiveAgreeableness"), // Amabilidade
  bigFiveNeuroticism: int("bigFiveNeuroticism"), // Neuroticismo
  // Metadados
  responses: text("responses"), // JSON com todas as respostas
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PsychometricTest = typeof psychometricTests.$inferSelect;
export type InsertPsychometricTest = typeof psychometricTests.$inferInsert;

export const testQuestions = mysqlTable("testQuestions", {
  id: int("id").autoincrement().primaryKey(),
  testType: mysqlEnum("testType", ["disc", "bigfive"]).notNull(),
  questionNumber: int("questionNumber").notNull(),
  questionText: text("questionText").notNull(),
  dimension: varchar("dimension", { length: 50 }).notNull(), // Ex: "dominance", "openness"
  reverse: boolean("reverse").default(false).notNull(), // Se a pontuação é invertida
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TestQuestion = typeof testQuestions.$inferSelect;
export type InsertTestQuestion = typeof testQuestions.$inferInsert;
