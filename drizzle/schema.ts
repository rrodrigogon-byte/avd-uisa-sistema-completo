import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  datetime,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

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
  
  // Flag de Líder de Cargos e Salários
  isSalaryLead: boolean("isSalaryLead").default(false).notNull(),
  
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

/**
 * Admin Users - Usuários administrativos do sistema
 */
export const adminUsers = mysqlTable("adminUsers", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["super_admin", "admin", "hr_manager"]).default("admin").notNull(),
  active: boolean("active").default(true).notNull(),
  lastLoginAt: datetime("lastLoginAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;

// ============================================================================
// TABELAS DE BÔNUS POR CARGO
// ============================================================================

export const bonusPolicies = mysqlTable("bonusPolicies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  positionId: int("positionId"), // Cargo específico ou null para todos
  departmentId: int("departmentId"), // Departamento específico ou null
  
  // Multiplicadores
  salaryMultiplierPercent: int("salaryMultiplierPercent").notNull(), // Ex: 150 = 150% do salário
  minMultiplierPercent: int("minMultiplierPercent").default(50), // Mínimo 50%
  maxMultiplierPercent: int("maxMultiplierPercent").default(200), // Máximo 200%
  
  // Critérios de Elegibilidade
  minPerformanceRating: mysqlEnum("minPerformanceRating", ["abaixo_expectativas", "atende_expectativas", "supera_expectativas", "excepcional"]).default("atende_expectativas"),
  minTenureMonths: int("minTenureMonths").default(6), // Mínimo de meses na empresa
  requiresGoalCompletion: boolean("requiresGoalCompletion").default(true),
  minGoalCompletionRate: int("minGoalCompletionRate").default(70), // % mínimo de metas atingidas
  
  // Período de Vigência
  validFrom: datetime("validFrom").notNull(),
  validUntil: datetime("validUntil"),
  
  // Status
  active: boolean("active").default(true).notNull(),
  approvalStatus: mysqlEnum("approvalStatus", ["pendente", "aprovado", "rejeitado"]).default("pendente").notNull(),
  approvedBy: int("approvedBy"), // ID do aprovador
  approvedAt: datetime("approvedAt"),
  
  // Metadados
  createdBy: int("createdBy").notNull(),
  createdAt: datetime("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime("updatedAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type BonusPolicy = typeof bonusPolicies.$inferSelect;
export type InsertBonusPolicy = typeof bonusPolicies.$inferInsert;

// Tabela de Cálculos de Bônus
export const bonusCalculations = mysqlTable("bonusCalculations", {
  id: int("id").autoincrement().primaryKey(),
  policyId: int("policyId").notNull(),
  employeeId: int("employeeId").notNull(),
  
  // Valores Calculados
  baseSalaryCents: int("baseSalaryCents").notNull(), // Salário base em centavos
  appliedMultiplierPercent: int("appliedMultiplierPercent").notNull(), // Multiplicador em %
  bonusAmountCents: int("bonusAmountCents").notNull(), // Valor do bônus em centavos
  
  // Justificativa
  performanceScore: int("performanceScore"), // 0-100
  goalCompletionRate: int("goalCompletionRate"), // 0-100
  adjustmentReason: text("adjustmentReason"),
  
  // Status
  status: mysqlEnum("status", ["calculado", "aprovado", "pago", "cancelado"]).default("calculado").notNull(),
  approvedBy: int("approvedBy"),
  approvedAt: datetime("approvedAt"),
  paidAt: datetime("paidAt"),
  
  // Metadados
  calculatedAt: datetime("calculatedAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  referenceMonth: varchar("referenceMonth", { length: 7 }).notNull(), // YYYY-MM
});

export type BonusCalculation = typeof bonusCalculations.$inferSelect;
export type InsertBonusCalculation = typeof bonusCalculations.$inferInsert;

// Tabela de Auditoria de Bônus
export const bonusAuditLogs = mysqlTable("bonusAuditLogs", {
  id: int("id").autoincrement().primaryKey(),
  entityType: mysqlEnum("entityType", ["policy", "calculation"]).notNull(),
  entityId: int("entityId").notNull(),
  action: mysqlEnum("action", ["created", "updated", "deleted", "approved", "rejected", "paid"]).notNull(),
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 200 }),
  fieldName: varchar("fieldName", { length: 100 }),
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BonusAuditLog = typeof bonusAuditLogs.$inferSelect;
export type InsertBonusAuditLog = typeof bonusAuditLogs.$inferInsert;

// Tabela de Comentários em Aprovações de Bônus
export const bonusApprovalComments = mysqlTable("bonusApprovalComments", {
  id: int("id").autoincrement().primaryKey(),
  calculationId: int("calculationId").notNull(),
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 200 }),
  comment: text("comment").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BonusApprovalComment = typeof bonusApprovalComments.$inferSelect;
export type InsertBonusApprovalComment = typeof bonusApprovalComments.$inferInsert;

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

/**
 * Centros de Custos
 */
export const costCenters = mysqlTable("costCenters", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  departmentId: int("departmentId"), // Departamento vinculado
  budgetCents: int("budgetCents"), // Orçamento em centavos
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CostCenter = typeof costCenters.$inferSelect;
export type InsertCostCenter = typeof costCenters.$inferInsert;

export const positions = mysqlTable("positions", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  level: mysqlEnum("level", ["junior", "pleno", "senior", "especialista", "coordenador", "gerente", "diretor"]),
  departmentId: int("departmentId"),
  salaryMin: int("salaryMin"),
  salaryMax: int("salaryMax"),
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
  email: varchar("email", { length: 320 }),
  personalEmail: varchar("personalEmail", { length: 320 }),
  corporateEmail: varchar("corporateEmail", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }), // Senha para validação de consenso
  cpf: varchar("cpf", { length: 14 }).unique(),
  birthDate: datetime("birthDate"),
  hireDate: datetime("hireDate"),
  departmentId: int("departmentId"),
  positionId: int("positionId"),
  managerId: int("managerId"), // Gestor direto
  costCenter: varchar("costCenter", { length: 100 }), // Centro de custos
  active: boolean("active").default(true).notNull(), // Status ativo/inativo
  
  // Campos da planilha TOTVS
  chapa: varchar("chapa", { length: 50 }), // CHAPA
  codSecao: varchar("codSecao", { length: 100 }), // CODSEÇÃO
  secao: varchar("secao", { length: 255 }), // SEÇÃO
  codFuncao: varchar("codFuncao", { length: 50 }), // CODFUNÇÃO
  funcao: varchar("funcao", { length: 255 }), // FUNÇÃO
  situacao: varchar("situacao", { length: 50 }), // SITUAÇÃO
  gerencia: varchar("gerencia", { length: 255 }), // GERENCIA
  diretoria: varchar("diretoria", { length: 255 }), // DIRETORIA
  cargo: varchar("cargo", { length: 255 }), // CARGO
  telefone: varchar("telefone", { length: 50 }), // TELEFONE
  
  // Informações financeiras e hierárquicas
  salary: int("salary"), // Salário em centavos (ex: 500000 = R$ 5.000,00)
  hierarchyLevel: mysqlEnum("hierarchyLevel", [
    "diretoria",
    "gerencia",
    "coordenacao",
    "supervisao",
    "operacional"
  ]),
  
  photoUrl: varchar("photoUrl", { length: 512 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  status: mysqlEnum("status", ["ativo", "afastado", "desligado"]).default("ativo").notNull(),
  // Integração TOTVS RM
  rmCode: varchar("rmCode", { length: 50 }),
  rmLastSync: datetime("rmLastSync"),
  // Gamificação
  gamificationPoints: int("gamificationPoints").default(0).notNull(),
  gamificationLevel: varchar("gamificationLevel", { length: 20 }).default("Bronze").notNull(),
  lastPointsUpdate: timestamp("lastPointsUpdate").defaultNow(),
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
  status: mysqlEnum("status", ["planejado", "ativo", "concluido", "cancelado"]).default("planejado").notNull(),
  active: boolean("active").default(true).notNull(),
  description: text("description"),
  // Prazos por etapa do fluxo 360°
  selfEvaluationDeadline: datetime("selfEvaluationDeadline"),
  managerEvaluationDeadline: datetime("managerEvaluationDeadline"),
  consensusDeadline: datetime("consensusDeadline"),
  // Aprovação para preenchimento de metas
  approvedForGoals: boolean("approvedForGoals").default(false).notNull(),
  approvedForGoalsAt: datetime("approvedForGoalsAt"),
  approvedForGoalsBy: int("approvedForGoalsBy"),
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
  employeeId: int("employeeId"), // Opcional - null para metas organizacionais
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
  parentGoalId: int("parentGoalId"), // Meta pai (para cascata hierárquico)
  departmentId: int("departmentId"), // Departamento responsável
  alignmentPercentage: int("alignmentPercentage").default(0), // % de alinhamento com meta pai
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
  
  // Workflow de etapas sequenciais
  workflowStatus: mysqlEnum("workflowStatus", [
    "pending_self",        // Aguardando autoavaliação
    "pending_manager",     // Aguardando avaliação do gestor
    "pending_consensus",   // Aguardando consenso do líder
    "completed"            // Concluído
  ]).default("pending_self").notNull(),
  
  selfEvaluationCompleted: boolean("selfEvaluationCompleted").default(false).notNull(),
  managerEvaluationCompleted: boolean("managerEvaluationCompleted").default(false).notNull(),
  peersEvaluationCompleted: boolean("peersEvaluationCompleted").default(false).notNull(),
  subordinatesEvaluationCompleted: boolean("subordinatesEvaluationCompleted").default(false).notNull(),
  
  // Datas de conclusão de cada etapa
  selfCompletedAt: datetime("selfCompletedAt"),
  managerCompletedAt: datetime("managerCompletedAt"),
  consensusCompletedAt: datetime("consensusCompletedAt"),
  
  selfScore: int("selfScore"), // Nota da autoavaliação (0-100)
  managerScore: int("managerScore"), // Nota do gestor (0-100)
  finalScore: int("finalScore"), // Nota final (0-100)
  managerComments: text("managerComments"), // Comentários do gestor
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

export const calibrationSessions = mysqlTable("calibrationSessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionName: varchar("sessionName", { length: 255 }),
  cycleId: int("cycleId"),
  departmentId: int("departmentId"),
  departmentFilter: text("departmentFilter"), // JSON array de department IDs
  levelFilter: text("levelFilter"), // JSON array de níveis hierárquicos
  facilitatorId: int("facilitatorId"), // Quem conduziu a sessão
  createdBy: int("createdBy"),
  status: mysqlEnum("status", ["draft", "in_progress", "completed", "agendada", "em_andamento", "concluida"]).default("draft").notNull(),
  scheduledDate: datetime("scheduledDate"),
  startedAt: datetime("startedAt"),
  completedAt: datetime("completedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type CalibrationSession = typeof calibrationSessions.$inferSelect;
export type InsertCalibrationSession = typeof calibrationSessions.$inferInsert;

export const calibrationReviews = mysqlTable("calibrationReviews", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  evaluationId: int("evaluationId").notNull(),
  originalScore: int("originalScore").notNull(),
  calibratedScore: int("calibratedScore").notNull(),
  reason: text("reason").notNull(),
  reviewedBy: int("reviewedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CalibrationReview = typeof calibrationReviews.$inferSelect;
export type InsertCalibrationReview = typeof calibrationReviews.$inferInsert;

export const calibrationMessages = mysqlTable("calibrationMessages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  userId: int("userId").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CalibrationMessage = typeof calibrationMessages.$inferSelect;
export type InsertCalibrationMessage = typeof calibrationMessages.$inferInsert;

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
  
  // Riscos (Metodologia 9-Box Succession Planning)
  exitRisk: mysqlEnum("exitRisk", ["baixo", "medio", "alto"]).default("medio"),
  competencyGap: text("competencyGap"), // Gaps de competências identificados
  preparationTime: int("preparationTime"), // Tempo estimado de preparo em meses
  
  // Plano de Acompanhamento
  trackingPlan: text("trackingPlan"), // JSON com marcos e progress
  nextReviewDate: timestamp("nextReviewDate"),
  
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
  
  // Nível de Prontidão (conforme modal)
  readinessLevel: mysqlEnum("readinessLevel", [
    "pronto_ate_12_meses",
    "pronto_12_24_meses",
    "pronto_24_36_meses",
    "pronto_mais_36_meses"
  ]).notNull(),
  
  // Prioridade (1 = mais alta)
  priority: int("priority").default(1).notNull(),
  
  // Avaliações de Performance e Potencial (conforme modal)
  performance: mysqlEnum("performance", ["baixo", "medio", "alto"]).notNull(),
  potential: mysqlEnum("potential", ["baixo", "medio", "alto"]).notNull(),
  
  // Análise de Gaps de Competências
  gapAnalysis: text("gapAnalysis"),
  
  // Ações de Desenvolvimento Recomendadas
  developmentActions: text("developmentActions"),
  
  // Comentários sobre o sucessor
  comments: text("comments"),
  
  // Metadados
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SuccessionCandidate = typeof successionCandidates.$inferSelect;
export type InsertSuccessionCandidate = typeof successionCandidates.$inferInsert;

/**
 * Histórico de alterações em planos de sucessão
 */
export const successionHistory = mysqlTable("successionHistory", {
  id: int("id").autoincrement().primaryKey(),
  planId: int("planId").notNull(),
  candidateId: int("candidateId"), // Null se for alteração no plano, preenchido se for no candidato
  userId: int("userId").notNull(), // Quem fez a alteração
  actionType: mysqlEnum("actionType", [
    "plan_created", "plan_updated", "plan_deleted",
    "candidate_added", "candidate_updated", "candidate_removed",
    "risk_updated", "timeline_updated", "development_updated",
    "test_sent" // Envio de teste psicométrico
  ]).notNull(),
  fieldName: varchar("fieldName", { length: 100 }), // Campo alterado
  oldValue: text("oldValue"), // Valor anterior
  newValue: text("newValue"), // Novo valor
  notes: text("notes"), // Observações adicionais
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SuccessionHistory = typeof successionHistory.$inferSelect;
export type InsertSuccessionHistory = typeof successionHistory.$inferInsert;

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

/**
 * Histórico de Alterações de Senha
 * Auditoria de mudanças de senha de líderes para consenso
 */
export const passwordChangeHistory = mysqlTable("passwordChangeHistory", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(), // Líder que teve a senha alterada
  changedBy: int("changedBy").notNull(), // Usuário que alterou (admin/RH)
  changedByName: varchar("changedByName", { length: 255 }), // Nome do usuário
  reason: text("reason"), // Motivo da alteração
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasswordChangeHistory = typeof passwordChangeHistory.$inferSelect;
export type InsertPasswordChangeHistory = typeof passwordChangeHistory.$inferInsert;

// ============================================================================
// SISTEMA DE FEEDBACK CONTÍNUO
// ============================================================================

export const feedbacks = mysqlTable("feedbacks", {
  id: int("id").autoincrement().primaryKey(),
  managerId: int("managerId").notNull(), // Gestor que deu o feedback
  employeeId: int("employeeId").notNull(), // Colaborador que recebeu
  type: mysqlEnum("type", ["positivo", "construtivo", "desenvolvimento"]).notNull(),
  category: varchar("category", { length: 100 }), // Ex: Comunicação, Liderança, etc
  content: text("content").notNull(), // Conteúdo do feedback
  context: text("context"), // Contexto/situação
  actionItems: text("actionItems"), // Ações recomendadas (JSON)
  linkedPDIId: int("linkedPDIId"), // PDI vinculado (opcional)
  isPrivate: boolean("isPrivate").default(false).notNull(), // Visível apenas para gestor e colaborador
  acknowledgedAt: datetime("acknowledgedAt"), // Quando o colaborador visualizou
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Feedback = typeof feedbacks.$inferSelect;
export type InsertFeedback = typeof feedbacks.$inferInsert;

// ============================================================================
// SISTEMA DE BADGES E GAMIFICAÇÃO
// ============================================================================

export const badges = mysqlTable("badges", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }), // Código único do badge
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 50 }), // Nome do ícone lucide-react
  category: mysqlEnum("category", ["metas", "pdi", "avaliacao", "feedback", "geral"]).notNull(),
  points: int("points").notNull().default(0), // Pontos ganhos ao conquistar
  condition: text("condition"), // Condição para desbloquear (JSON)
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = typeof badges.$inferInsert;

export const employeeBadges = mysqlTable("employeeBadges", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  badgeId: int("badgeId").notNull(),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
  notified: boolean("notified").default(false).notNull(), // Se o colaborador foi notificado
});

export type EmployeeBadge = typeof employeeBadges.$inferSelect;
export type InsertEmployeeBadge = typeof employeeBadges.$inferInsert;

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
  testType: mysqlEnum("testType", ["disc", "bigfive", "mbti", "ie", "vark", "leadership", "careeranchors", "pir"]).notNull(),
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
  testType: mysqlEnum("testType", ["disc", "bigfive", "mbti", "ie", "vark", "leadership", "careeranchors", "pir"]).notNull(),
  questionNumber: int("questionNumber").notNull(),
  questionText: text("questionText").notNull(),
  dimension: varchar("dimension", { length: 50 }).notNull(), // Ex: "dominance", "openness", "E/I", "Autoconsciência", "Visual"
  reverse: boolean("reverse").default(false).notNull(), // Se a pontuação é invertida
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TestQuestion = typeof testQuestions.$inferSelect;
export type InsertTestQuestion = typeof testQuestions.$inferInsert;

/**
 * Test Invitations - Convites para realização de testes psicométricos
 * Gerencia envio de links únicos para colaboradores responderem testes
 */
export const testInvitations = mysqlTable("testInvitations", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId"), // Nullable para candidatos externos
  testType: mysqlEnum("testType", ["disc", "bigfive", "mbti", "ie", "vark", "leadership", "careeranchors", "pir"]).notNull(),
  
  // Campos para candidatos externos
  isExternalCandidate: boolean("isExternalCandidate").default(false).notNull(),
  candidateName: varchar("candidateName", { length: 255 }),
  candidateEmail: varchar("candidateEmail", { length: 320 }),
  
  // Link único de acesso
  uniqueToken: varchar("uniqueToken", { length: 128 }).notNull().unique(),
  
  // Status do convite
  status: mysqlEnum("status", ["pendente", "em_andamento", "concluido", "expirado"]).default("pendente").notNull(),
  
  // Datas
  sentAt: datetime("sentAt").notNull(),
  expiresAt: datetime("expiresAt").notNull(),
  startedAt: datetime("startedAt"),
  completedAt: datetime("completedAt"),
  
  // E-mail enviado
  emailSent: boolean("emailSent").default(false).notNull(),
  emailSentAt: datetime("emailSentAt"),
  
  // Metadados
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TestInvitation = typeof testInvitations.$inferSelect;
export type InsertTestInvitation = typeof testInvitations.$inferInsert;

/**
 * Test Responses - Respostas individuais de testes psicométricos
 * Armazena cada resposta dada pelo colaborador durante o teste
 */
export const testResponses = mysqlTable("testResponses", {
  id: int("id").autoincrement().primaryKey(),
  invitationId: int("invitationId").notNull(),
  questionId: int("questionId").notNull(),
  
  // Resposta
  answer: int("answer").notNull(), // Escala 1-5 ou similar
  
  // Tempo de resposta (em segundos)
  responseTime: int("responseTime"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TestResponse = typeof testResponses.$inferSelect;
export type InsertTestResponse = typeof testResponses.$inferInsert;

/**
 * Test Results - Resultados consolidados e descritivos dos testes
 * Armazena não apenas pontuações, mas também interpretações descritivas completas
 */
export const testResults = mysqlTable("testResults", {
  id: int("id").autoincrement().primaryKey(),
  invitationId: int("invitationId").notNull(),
  employeeId: int("employeeId"), // Nullable para candidatos externos
  testType: mysqlEnum("testType", ["disc", "bigfive", "mbti", "ie", "vark", "leadership", "careeranchors", "pir"]).notNull(),
  
  // Pontuações numéricas (JSON)
  scores: text("scores").notNull(), // JSON com todas as pontuações por dimensão
  
  // Resultados descritivos completos
  profileType: varchar("profileType", { length: 50 }), // Ex: "ENTJ", "Alto D", etc
  profileDescription: text("profileDescription"), // Descrição completa do perfil
  strengths: text("strengths"), // Pontos fortes identificados
  developmentAreas: text("developmentAreas"), // Áreas de desenvolvimento
  workStyle: text("workStyle"), // Estilo de trabalho
  communicationStyle: text("communicationStyle"), // Estilo de comunicação
  leadershipStyle: text("leadershipStyle"), // Estilo de liderança (se aplicável)
  motivators: text("motivators"), // Principais motivadores
  stressors: text("stressors"), // Principais estressores
  teamContribution: text("teamContribution"), // Contribuição para equipe
  careerRecommendations: text("careerRecommendations"), // Recomendações de carreira
  
  // Dados brutos para análises futuras
  rawData: text("rawData"), // JSON com dados completos do teste
  
  // Metadados
  completedAt: datetime("completedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TestResult = typeof testResults.$inferSelect;
export type InsertTestResult = typeof testResults.$inferInsert;

// ============================================================================
// CONFIGURAÇÕES DO SISTEMA
// ============================================================================

export const systemSettings = mysqlTable("systemSettings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
  settingValue: text("settingValue"),
  description: text("description"),
  isEncrypted: boolean("isEncrypted").default(false).notNull(),
  updatedBy: int("updatedBy"), // ID do usuário que atualizou
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;


// ============================================================================
// RELATÓRIOS AGENDADOS
// ============================================================================

export const scheduledReports = mysqlTable("scheduledReports", {
  id: int("id").autoincrement().primaryKey(),
  reportType: mysqlEnum("reportType", [
    "nine_box",
    "performance",
    "pdi",
    "evaluations",
    "goals",
    "competencies",
    "succession",
    "turnover",
    "headcount"
  ]).notNull(),
  reportName: varchar("reportName", { length: 255 }).notNull(),
  frequency: mysqlEnum("frequency", ["daily", "weekly", "monthly", "quarterly"]).notNull(),
  dayOfWeek: int("dayOfWeek"), // 0-6 para semanal (0=domingo)
  dayOfMonth: int("dayOfMonth"), // 1-31 para mensal
  hour: int("hour").default(9).notNull(), // Hora do dia (0-23)
  recipients: text("recipients").notNull(), // JSON array de e-mails
  departments: text("departments"), // JSON array de IDs de departamentos (filtro opcional)
  format: mysqlEnum("format", ["pdf", "excel", "csv"]).default("pdf").notNull(),
  includeCharts: boolean("includeCharts").default(true).notNull(),
  active: boolean("active").default(true).notNull(),
  lastExecutedAt: datetime("lastExecutedAt"),
  nextExecutionAt: datetime("nextExecutionAt"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduledReport = typeof scheduledReports.$inferSelect;
export type InsertScheduledReport = typeof scheduledReports.$inferInsert;

export const reportExecutionLogs = mysqlTable("reportExecutionLogs", {
  id: int("id").autoincrement().primaryKey(),
  scheduledReportId: int("scheduledReportId").notNull(),
  executedAt: datetime("executedAt").notNull(),
  status: mysqlEnum("status", ["success", "failed", "partial"]).notNull(),
  recipientCount: int("recipientCount").default(0).notNull(),
  successCount: int("successCount").default(0).notNull(),
  failedCount: int("failedCount").default(0).notNull(),
  errorMessage: text("errorMessage"),
  executionTimeMs: int("executionTimeMs"), // Tempo de execução em milissegundos
  fileSize: int("fileSize"), // Tamanho do arquivo gerado em bytes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReportExecutionLog = typeof reportExecutionLogs.$inferSelect;
export type InsertReportExecutionLog = typeof reportExecutionLogs.$inferInsert;


// ============================================================================
// TABELAS DE RELATÓRIOS CUSTOMIZÁVEIS
// ============================================================================

export const customReports = mysqlTable("customReports", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdBy: int("createdBy").notNull(),
  metrics: json("metrics").notNull(), // Array de métricas selecionadas
  filters: json("filters"), // Filtros aplicados (departamento, período, cargo)
  chartType: varchar("chartType", { length: 50 }), // bar, line, pie, table
  isTemplate: boolean("isTemplate").default(false).notNull(),
  isPublic: boolean("isPublic").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomReport = typeof customReports.$inferSelect;
export type InsertCustomReport = typeof customReports.$inferInsert;

// Tabela de analytics de relatórios
export const reportAnalytics = mysqlTable("reportAnalytics", {
  id: int("id").autoincrement().primaryKey(),
  reportId: int("reportId"), // ID do relatório customizado (se aplicável)
  reportName: varchar("reportName", { length: 255 }),
  action: mysqlEnum("action", ["view", "export_pdf", "export_excel", "create", "update", "delete"]).notNull(),
  userId: int("userId").notNull(),
  metrics: json("metrics"), // Métricas utilizadas
  filters: json("filters"), // Filtros aplicados
  executionTimeMs: int("executionTimeMs"), // Tempo de execução
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReportAnalytic = typeof reportAnalytics.$inferSelect;
export type InsertReportAnalytic = typeof reportAnalytics.$inferInsert;

// ============================================================================
// TABELAS DE PDI INTELIGENTE (Extensão para Sucessão Estratégica)
// ============================================================================

/**
 * Tabela de detalhes estendidos do PDI para sucessão estratégica
 * Armazena informações de comparação de perfis, gaps, sponsors e riscos
 */
export const pdiIntelligentDetails = mysqlTable("pdiIntelligentDetails", {
  id: int("id").autoincrement().primaryKey(),
  planId: int("planId").notNull().unique(), // Relacionamento 1:1 com pdiPlans
  
  // Importação de HTML
  importedFromHtml: boolean("importedFromHtml").default(false).notNull(),
  htmlOriginalPath: varchar("htmlOriginalPath", { length: 512 }), // Caminho do HTML original
  htmlContent: text("htmlContent"), // Conteúdo HTML completo para referência
  importedAt: datetime("importedAt"),
  importedBy: int("importedBy"), // ID do usuário que importou
  
  // Contexto estratégico
  strategicContext: text("strategicContext"), // Descrição do desafio estratégico
  durationMonths: int("durationMonths").default(24).notNull(), // Duração do plano em meses
  
  // Sponsors e responsáveis
  mentorId: int("mentorId"), // Gestor/Mentor direto
  sponsorId1: int("sponsorId1"), // Sponsor 1 (ex: Diretor Agroindustrial)
  sponsorId2: int("sponsorId2"), // Sponsor 2 (ex: Diretor de Gente e Cultura)
  guardianId: int("guardianId"), // Guardião do PDI (DGC)
  
  // Perfil atual (JSON com dados de testes psicométricos)
  currentProfile: json("currentProfile").$type<{
    disc?: { d: number; i: number; s: number; c: number };
    bigFive?: { o: number; c: number; e: number; a: number; n: number };
    mbti?: string;
    ie?: number;
    competencies?: { competencyId: number; level: number }[];
  }>(),
  
  // Perfil da posição-alvo (JSON)
  targetProfile: json("targetProfile").$type<{
    disc?: { d: number; i: number; s: number; c: number };
    bigFive?: { o: number; c: number; e: number; a: number; n: number };
    mbti?: string;
    ie?: number;
    competencies?: { competencyId: number; level: number }[];
  }>(),
  
  // Análise de gaps (JSON)
  gapsAnalysis: json("gapsAnalysis").$type<{
    gaps: Array<{
      type: "competency" | "behavioral" | "technical" | "leadership";
      name: string;
      currentLevel: number;
      targetLevel: number;
      priority: "high" | "medium" | "low";
      actions: string[];
    }>;
  }>(),
  
  // Marcos de progressão
  milestone12Months: text("milestone12Months"), // Marco de 12 meses
  milestone24Months: text("milestone24Months"), // Marco de 24 meses
  milestone12Status: mysqlEnum("milestone12Status", ["pendente", "concluido", "atrasado"]).default("pendente"),
  milestone24Status: mysqlEnum("milestone24Status", ["pendente", "concluido", "atrasado"]).default("pendente"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PdiIntelligentDetail = typeof pdiIntelligentDetails.$inferSelect;
export type InsertPdiIntelligentDetail = typeof pdiIntelligentDetails.$inferInsert;

/**
 * Tabela de gaps de competências identificados no PDI
 */
export const pdiCompetencyGaps = mysqlTable("pdiCompetencyGaps", {
  id: int("id").autoincrement().primaryKey(),
  planId: int("planId").notNull(),
  competencyId: int("competencyId").notNull(),
  
  currentLevel: int("currentLevel").notNull(), // Nível atual (1-5)
  targetLevel: int("targetLevel").notNull(), // Nível desejado (1-5)
  gap: int("gap").notNull(), // Diferença (targetLevel - currentLevel)
  priority: mysqlEnum("priority", ["alta", "media", "baixa"]).default("media").notNull(),
  
  // Responsabilidades para superar o gap
  employeeActions: text("employeeActions"), // Ações do colaborador
  managerActions: text("managerActions"), // Ações do gestor
  sponsorActions: text("sponsorActions"), // Ações dos sponsors
  
  status: mysqlEnum("status", ["identificado", "em_desenvolvimento", "superado"]).default("identificado").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PdiCompetencyGap = typeof pdiCompetencyGaps.$inferSelect;
export type InsertPdiCompetencyGap = typeof pdiCompetencyGaps.$inferInsert;

/**
 * Tabela de riscos do PDI
 */
export const pdiRisks = mysqlTable("pdiRisks", {
  id: int("id").autoincrement().primaryKey(),
  planId: int("planId").notNull(),
  
  type: mysqlEnum("type", ["saida", "gap_competencia", "tempo_preparo", "mudanca_estrategica", "outro"]).notNull(),
  description: text("description").notNull(),
  impact: mysqlEnum("impact", ["baixo", "medio", "alto", "critico"]).notNull(),
  probability: mysqlEnum("probability", ["baixa", "media", "alta"]).notNull(),
  
  mitigation: text("mitigation"), // Plano de mitigação
  responsible: int("responsible"), // Responsável pela mitigação
  
  status: mysqlEnum("status", ["identificado", "em_mitigacao", "mitigado", "materializado"]).default("identificado").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PdiRisk = typeof pdiRisks.$inferSelect;
export type InsertPdiRisk = typeof pdiRisks.$inferInsert;

/**
 * Tabela de acompanhamento e reviews do PDI
 */
export const pdiReviews = mysqlTable("pdiReviews", {
  id: int("id").autoincrement().primaryKey(),
  planId: int("planId").notNull(),
  reviewerId: int("reviewerId").notNull(), // Quem fez o review (gestor, sponsor, DGC)
  reviewerRole: mysqlEnum("reviewerRole", ["mentor", "sponsor", "guardiao"]).notNull(),
  
  reviewDate: datetime("reviewDate").notNull(),
  overallProgress: int("overallProgress").notNull(), // Avaliação geral (0-100)
  
  strengths: text("strengths"), // Pontos fortes observados
  improvements: text("improvements"), // Pontos de melhoria
  nextSteps: text("nextSteps"), // Próximos passos recomendados
  
  recommendation: mysqlEnum("recommendation", ["manter", "acelerar", "ajustar", "pausar"]).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PdiReview = typeof pdiReviews.$inferSelect;
export type InsertPdiReview = typeof pdiReviews.$inferInsert;

// Relações para PDI Inteligente
export const pdiIntelligentDetailsRelations = relations(pdiIntelligentDetails, ({ one }) => ({
  plan: one(pdiPlans, {
    fields: [pdiIntelligentDetails.planId],
    references: [pdiPlans.id],
  }),
  mentor: one(employees, {
    fields: [pdiIntelligentDetails.mentorId],
    references: [employees.id],
  }),
  sponsor1: one(employees, {
    fields: [pdiIntelligentDetails.sponsorId1],
    references: [employees.id],
  }),
  sponsor2: one(employees, {
    fields: [pdiIntelligentDetails.sponsorId2],
    references: [employees.id],
  }),
  guardian: one(employees, {
    fields: [pdiIntelligentDetails.guardianId],
    references: [employees.id],
  }),
}));

export const pdiCompetencyGapsRelations = relations(pdiCompetencyGaps, ({ one }) => ({
  plan: one(pdiPlans, {
    fields: [pdiCompetencyGaps.planId],
    references: [pdiPlans.id],
  }),
  competency: one(competencies, {
    fields: [pdiCompetencyGaps.competencyId],
    references: [competencies.id],
  }),
}));

export const pdiRisksRelations = relations(pdiRisks, ({ one }) => ({
  plan: one(pdiPlans, {
    fields: [pdiRisks.planId],
    references: [pdiPlans.id],
  }),
  responsibleEmployee: one(employees, {
    fields: [pdiRisks.responsible],
    references: [employees.id],
  }),
}));

export const pdiReviewsRelations = relations(pdiReviews, ({ one }) => ({
  plan: one(pdiPlans, {
    fields: [pdiReviews.planId],
    references: [pdiPlans.id],
  }),
  reviewer: one(employees, {
    fields: [pdiReviews.reviewerId],
    references: [employees.id],
  }),
}));


/**
 * ========================================
 * METAS SMART (SMART Goals)
 * ========================================
 * Sistema completo de metas com validação SMART,
 * aprovações e elegibilidade para bônus financeiro
 */

export const smartGoals = mysqlTable("smartGoals", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId"), // Opcional - null para metas organizacionais e de equipe
  departmentId: int("departmentId"), // Para metas de equipe
  cycleId: int("cycleId").notNull(),
  pdiPlanId: int("pdiPlanId"), // Opcional: vincular com PDI
  
  // Informações básicas
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  type: mysqlEnum("type", ["individual", "team", "organizational"]).notNull(),
  goalType: mysqlEnum("goalType", ["individual", "corporate"]).default("individual").notNull(), // Nova: corporativa ou individual
  category: mysqlEnum("category", ["financial", "behavioral", "corporate", "development"]).notNull(),
  
  // Critérios SMART
  isSpecific: boolean("isSpecific").default(false).notNull(), // S - Específica
  isMeasurable: boolean("isMeasurable").default(false).notNull(), // M - Mensurável
  isAchievable: boolean("isAchievable").default(false).notNull(), // A - Atingível
  isRelevant: boolean("isRelevant").default(false).notNull(), // R - Relevante
  isTimeBound: boolean("isTimeBound").default(false).notNull(), // T - Temporal
  
  // Métricas
  measurementUnit: varchar("measurementUnit", { length: 50 }), // Ex: "R$", "%", "unidades"
  targetValueCents: int("targetValueCents"), // Valor alvo em centavos
  currentValueCents: int("currentValueCents").default(0), // Valor atual em centavos
  weight: int("weight").default(10).notNull(), // Peso da meta (para cálculo de bônus)
  
  // Datas
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  
  // Bônus financeiro
  bonusEligible: boolean("bonusEligible").default(false).notNull(), // Elegível para bônus?
  bonusPercentage: int("bonusPercentage"), // % de bônus se atingir (0-100)
  bonusAmountCents: int("bonusAmountCents"), // Valor fixo de bônus em centavos
  
  // Status e aprovação
  status: mysqlEnum("status", ["draft", "pending_approval", "approved", "rejected", "in_progress", "completed", "cancelled"]).default("draft").notNull(),
  approvalStatus: mysqlEnum("approvalStatus", ["not_submitted", "pending_manager", "pending_hr", "approved", "rejected"]).default("not_submitted").notNull(),
  progress: int("progress").default(0).notNull(), // 0-100%
  
  // Metadados
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export const goalMilestones = mysqlTable("goalMilestones", {
  id: int("id").autoincrement().primaryKey(),
  goalId: int("goalId").notNull(),
  
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: date("dueDate").notNull(),
  
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "delayed"]).default("pending").notNull(),
  progress: int("progress").default(0).notNull(), // 0-100%
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export const goalApprovals = mysqlTable("goalApprovals", {
  id: int("id").autoincrement().primaryKey(),
  goalId: int("goalId").notNull(),
  
  approverId: int("approverId").notNull(), // ID do aprovador (gestor ou RH)
  approverRole: mysqlEnum("approverRole", ["manager", "hr", "director"]).notNull(),
  
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  comments: text("comments"),
  
  approvedAt: timestamp("approvedAt"), // Data de aprovação/rejeição
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const goalComments = mysqlTable("goalComments", {
  id: int("id").autoincrement().primaryKey(),
  goalId: int("goalId").notNull(),
  
  authorId: int("authorId").notNull(),
  comment: text("comment").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Relations
export const smartGoalsRelations = relations(smartGoals, ({ one, many }) => ({
  employee: one(employees, {
    fields: [smartGoals.employeeId],
    references: [employees.id],
  }),
  cycle: one(evaluationCycles, {
    fields: [smartGoals.cycleId],
    references: [evaluationCycles.id],
  }),
  pdiPlan: one(pdiPlans, {
    fields: [smartGoals.pdiPlanId],
    references: [pdiPlans.id],
  }),
  creator: one(employees, {
    fields: [smartGoals.createdBy],
    references: [employees.id],
  }),
  milestones: many(goalMilestones),
  approvals: many(goalApprovals),
  comments: many(goalComments),
}));

export const goalMilestonesRelations = relations(goalMilestones, ({ one }) => ({
  goal: one(smartGoals, {
    fields: [goalMilestones.goalId],
    references: [smartGoals.id],
  }),
}));

export const goalApprovalsRelations = relations(goalApprovals, ({ one }) => ({
  goal: one(smartGoals, {
    fields: [goalApprovals.goalId],
    references: [smartGoals.id],
  }),
  approver: one(employees, {
    fields: [goalApprovals.approverId],
    references: [employees.id],
  }),
}));

export const goalCommentsRelations = relations(goalComments, ({ one }) => ({
  goal: one(smartGoals, {
    fields: [goalComments.goalId],
    references: [smartGoals.id],
  }),
  author: one(employees, {
    fields: [goalComments.authorId],
    references: [employees.id],
  }),
}));

export type SmartGoal = typeof smartGoals.$inferSelect;
export type InsertSmartGoal = typeof smartGoals.$inferInsert;
export type GoalMilestone = typeof goalMilestones.$inferSelect;
export type InsertGoalMilestone = typeof goalMilestones.$inferInsert;
export type GoalApproval = typeof goalApprovals.$inferSelect;
export type InsertGoalApproval = typeof goalApprovals.$inferInsert;
export type GoalComment = typeof goalComments.$inferSelect;
export type InsertGoalComment = typeof goalComments.$inferInsert;

/**
 * Configurações de Bônus por Função
 * Define quantos salários cada função tem direito + bônus extra
 */
export const bonusConfigs = mysqlTable("bonusConfigs", {
  id: int("id").autoincrement().primaryKey(),
  positionId: int("positionId").notNull(), // Referência para positions
  positionName: varchar("positionName", { length: 255 }).notNull(),
  
  // Configuração de bônus
  baseSalaryMultiplierPercent: int("baseSalaryMultiplierPercent").default(0).notNull(), // Ex: 150 = 1.5 salários
  extraBonusPercentage: int("extraBonusPercentage").default(0).notNull(), // % adicional (0-100)
  
  // Metadados
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Workflows de Aprovação de Bônus
 * Define até 5 níveis de aprovadores
 */
export const bonusWorkflows = mysqlTable("bonusWorkflows", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Aprovadores (até 5 níveis)
  approver1Id: int("approver1Id"), // RH
  approver1Role: varchar("approver1Role", { length: 100 }), // Ex: "Analista RH"
  approver2Id: int("approver2Id"), // Gerente RH
  approver2Role: varchar("approver2Role", { length: 100 }),
  approver3Id: int("approver3Id"), // Diretor de Gente
  approver3Role: varchar("approver3Role", { length: 100 }),
  approver4Id: int("approver4Id"), // Opcional
  approver4Role: varchar("approver4Role", { length: 100 }),
  approver5Id: int("approver5Id"), // Opcional
  approver5Role: varchar("approver5Role", { length: 100 }),
  
  // Configurações
  requireAllApprovals: boolean("requireAllApprovals").default(true).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Aprovações de Bônus
 * Registra cada etapa de aprovação no workflow
 */
export const bonusApprovals = mysqlTable("bonusApprovals", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").notNull(),
  employeeId: int("employeeId").notNull(),
  workflowId: int("workflowId").notNull(),
  
  // Valores de bônus
  eligibleAmountCents: int("eligibleAmountCents").notNull(), // Valor elegível em centavos
  extraBonusPercentage: int("extraBonusPercentage").default(0), // Bônus extra do RH (0-100)
  finalAmountCents: int("finalAmountCents").notNull(), // Valor final aprovado em centavos
  
  // Status do workflow
  currentLevel: int("currentLevel").default(1).notNull(), // Nível atual de aprovação (1-5)
  status: mysqlEnum("status", ["pending", "approved", "rejected", "cancelled"]).default("pending").notNull(),
  
  // Aprovações por nível
  level1Status: mysqlEnum("level1Status", ["pending", "approved", "rejected"]).default("pending"),
  level1ApproverId: int("level1ApproverId"),
  level1ApprovedAt: timestamp("level1ApprovedAt"),
  level1Comments: text("level1Comments"),
  
  level2Status: mysqlEnum("level2Status", ["pending", "approved", "rejected"]).default("pending"),
  level2ApproverId: int("level2ApproverId"),
  level2ApprovedAt: timestamp("level2ApprovedAt"),
  level2Comments: text("level2Comments"),
  
  level3Status: mysqlEnum("level3Status", ["pending", "approved", "rejected"]).default("pending"),
  level3ApproverId: int("level3ApproverId"),
  level3ApprovedAt: timestamp("level3ApprovedAt"),
  level3Comments: text("level3Comments"),
  
  level4Status: mysqlEnum("level4Status", ["pending", "approved", "rejected"]).default("pending"),
  level4ApproverId: int("level4ApproverId"),
  level4ApprovedAt: timestamp("level4ApprovedAt"),
  level4Comments: text("level4Comments"),
  
  level5Status: mysqlEnum("level5Status", ["pending", "approved", "rejected"]).default("pending"),
  level5ApproverId: int("level5ApproverId"),
  level5ApprovedAt: timestamp("level5ApprovedAt"),
  level5Comments: text("level5Comments"),
  
  // Documento final
  signedPdfUrl: varchar("signedPdfUrl", { length: 500 }), // URL do PDF assinado
  sentToFinanceAt: timestamp("sentToFinanceAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Evidências de Cumprimento de Metas
 * Armazena descrições e anexos que comprovam a conclusão da meta
 */
export const goalEvidences = mysqlTable("goalEvidences", {
  id: int("id").autoincrement().primaryKey(),
  goalId: int("goalId").notNull(),
  
  // Evidência
  description: text("description").notNull(), // Descrição da evidência
  attachmentUrl: varchar("attachmentUrl", { length: 500 }), // URL do arquivo anexado (S3)
  attachmentName: varchar("attachmentName", { length: 255 }), // Nome original do arquivo
  attachmentType: varchar("attachmentType", { length: 100 }), // Tipo MIME
  attachmentSize: int("attachmentSize"), // Tamanho em bytes
  
  // Metadados
  uploadedBy: int("uploadedBy").notNull(),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  isVerified: boolean("isVerified").default(false).notNull(), // Verificado por auditor/gestor
  verifiedBy: int("verifiedBy"),
  verifiedAt: timestamp("verifiedAt"),
});

// Relations
export const bonusConfigsRelations = relations(bonusConfigs, ({ one }) => ({
  position: one(positions, {
    fields: [bonusConfigs.positionId],
    references: [positions.id],
  }),
  creator: one(employees, {
    fields: [bonusConfigs.createdBy],
    references: [employees.id],
  }),
}));

export const bonusWorkflowsRelations = relations(bonusWorkflows, ({ one, many }) => ({
  approver1: one(employees, {
    fields: [bonusWorkflows.approver1Id],
    references: [employees.id],
  }),
  approver2: one(employees, {
    fields: [bonusWorkflows.approver2Id],
    references: [employees.id],
  }),
  approver3: one(employees, {
    fields: [bonusWorkflows.approver3Id],
    references: [employees.id],
  }),
  approver4: one(employees, {
    fields: [bonusWorkflows.approver4Id],
    references: [employees.id],
  }),
  approver5: one(employees, {
    fields: [bonusWorkflows.approver5Id],
    references: [employees.id],
  }),
  creator: one(employees, {
    fields: [bonusWorkflows.createdBy],
    references: [employees.id],
  }),
  approvals: many(bonusApprovals),
}));

export const bonusApprovalsRelations = relations(bonusApprovals, ({ one }) => ({
  cycle: one(evaluationCycles, {
    fields: [bonusApprovals.cycleId],
    references: [evaluationCycles.id],
  }),
  employee: one(employees, {
    fields: [bonusApprovals.employeeId],
    references: [employees.id],
  }),
  workflow: one(bonusWorkflows, {
    fields: [bonusApprovals.workflowId],
    references: [bonusWorkflows.id],
  }),
}));

export const goalEvidencesRelations = relations(goalEvidences, ({ one }) => ({
  goal: one(smartGoals, {
    fields: [goalEvidences.goalId],
    references: [smartGoals.id],
  }),
  uploader: one(employees, {
    fields: [goalEvidences.uploadedBy],
    references: [employees.id],
  }),
  verifier: one(employees, {
    fields: [goalEvidences.verifiedBy],
    references: [employees.id],
  }),
}));

// Types
export type BonusConfig = typeof bonusConfigs.$inferSelect;
export type InsertBonusConfig = typeof bonusConfigs.$inferInsert;
export type BonusWorkflow = typeof bonusWorkflows.$inferSelect;
export type InsertBonusWorkflow = typeof bonusWorkflows.$inferInsert;
export type BonusApproval = typeof bonusApprovals.$inferSelect;
export type InsertBonusApproval = typeof bonusApprovals.$inferInsert;
export type GoalEvidence = typeof goalEvidences.$inferSelect;
export type InsertGoalEvidence = typeof goalEvidences.$inferInsert;

/**
 * Tabela de movimentações de calibração no Nine Box
 */
export const calibrationMovements = mysqlTable("calibrationMovements", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  movedBy: int("movedBy").notNull(), // ID do usuário que moveu (RH)
  fromPerformance: mysqlEnum("fromPerformance", ["baixo", "médio", "alto"]),
  fromPotential: mysqlEnum("fromPotential", ["baixo", "médio", "alto"]),
  toPerformance: mysqlEnum("toPerformance", ["baixo", "médio", "alto"]).notNull(),
  toPotential: mysqlEnum("toPotential", ["baixo", "médio", "alto"]).notNull(),
  justification: text("justification").notNull(), // Justificativa obrigatória
  status: mysqlEnum("status", ["pending", "approved_hr", "approved_people_director", "approved_area_director", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CalibrationMovement = typeof calibrationMovements.$inferSelect;
export type InsertCalibrationMovement = typeof calibrationMovements.$inferInsert;

/**
 * Tabela de aprovações de calibração (workflow)
 */
export const calibrationApprovals = mysqlTable("calibrationApprovals", {
  id: int("id").autoincrement().primaryKey(),
  movementId: int("movementId").notNull(),
  approverId: int("approverId").notNull(), // ID do aprovador
  approverRole: mysqlEnum("approverRole", ["hr", "people_director", "area_director"]).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  evidence: text("evidence"), // Evidências (obrigatório para Diretor de Área)
  comments: text("comments"),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CalibrationApproval = typeof calibrationApprovals.$inferSelect;
export type InsertCalibrationApproval = typeof calibrationApprovals.$inferInsert;

/**
 * Tabela de configuração de workflows de calibração
 */
export const calibrationWorkflows = mysqlTable("calibrationWorkflows", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  steps: text("steps").notNull(), // JSON com os passos do workflow
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CalibrationWorkflow = typeof calibrationWorkflows.$inferSelect;
export type InsertCalibrationWorkflow = typeof calibrationWorkflows.$inferInsert;

// ============================================================================
// TABELAS DE WORKFLOWS GENÉRICOS
// ============================================================================

/**
 * Workflows Genéricos
 * Sistema flexível de aprovação para qualquer tipo de processo
 */
export const workflows = mysqlTable("workflows", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", [
    "aprovacao_metas",
    "aprovacao_pdi",
    "aprovacao_avaliacao",
    "aprovacao_bonus",
    "aprovacao_ferias",
    "aprovacao_promocao",
    "aprovacao_horas_extras",
    "aprovacao_despesas",
    "outro"
  ]).notNull(),
  
  // Configuração das etapas (JSON)
  steps: text("steps").notNull(), // Array de { order, name, approverType, approverIds, condition }
  
  // Status e controle
  isActive: boolean("isActive").default(true).notNull(),
  isDefault: boolean("isDefault").default(false).notNull(), // Workflow padrão para o tipo
  
  // Auditoria
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = typeof workflows.$inferInsert;

/**
 * Instâncias de Execução de Workflows
 * Rastreia cada execução de um workflow
 */
export const workflowInstances = mysqlTable("workflowInstances", {
  id: int("id").autoincrement().primaryKey(),
  workflowId: int("workflowId").notNull(),
  entityType: varchar("entityType", { length: 100 }).notNull(), // "goal", "pdi", "evaluation", etc
  entityId: int("entityId").notNull(), // ID da entidade sendo aprovada
  
  // Status atual
  currentStep: int("currentStep").default(1).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "cancelled"]).default("pending").notNull(),
  
  // Auditoria
  requestedBy: int("requestedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type WorkflowInstance = typeof workflowInstances.$inferSelect;
export type InsertWorkflowInstance = typeof workflowInstances.$inferInsert;

/**
 * Aprovações de Etapas de Workflow
 * Registra cada aprovação individual em uma etapa
 */
export const workflowStepApprovals = mysqlTable("workflowStepApprovals", {
  id: int("id").autoincrement().primaryKey(),
  instanceId: int("instanceId").notNull(),
  stepOrder: int("stepOrder").notNull(),
  approverId: int("approverId").notNull(),
  
  // Decisão
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  comments: text("comments"),
  
  // Auditoria
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  approvedAt: timestamp("approvedAt"),
});

export type WorkflowStepApproval = typeof workflowStepApprovals.$inferSelect;
export type InsertWorkflowStepApproval = typeof workflowStepApprovals.$inferInsert;


/**
 * SMTP Configuration
 * Stores email server configuration for sending notifications
 */
export const smtpConfig = mysqlTable("smtp_config", {
  id: int("id").autoincrement().primaryKey(),
  host: varchar("host", { length: 255 }).notNull(),
  port: int("port").notNull().default(587),
  secure: boolean("secure").default(false), // true for 465, false for other ports
  user: varchar("user", { length: 255 }).notNull(),
  password: text("password").notNull(), // Encrypted
  fromEmail: varchar("from_email", { length: 320 }).notNull(),
  fromName: varchar("from_name", { length: 255 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type SmtpConfig = typeof smtpConfig.$inferSelect;
export type InsertSmtpConfig = typeof smtpConfig.$inferInsert;

// ============================================================================
// BENCHMARKING EXTERNO
// ============================================================================

/**
 * Dados de Benchmarking de Mercado
 * Armazena médias de mercado por setor, cargo e região para comparação
 */
export const marketBenchmarks = mysqlTable("marketBenchmarks", {
  id: int("id").autoincrement().primaryKey(),
  sector: varchar("sector", { length: 100 }).notNull(), // Setor (TI, Saúde, Financeiro, etc)
  position: varchar("position", { length: 100 }).notNull(), // Cargo
  region: varchar("region", { length: 100 }).default("Brasil").notNull(), // Região
  
  // Métricas de Performance
  avgPerformanceScore: int("avgPerformanceScore"), // Média de performance (0-100)
  avgEngagementScore: int("avgEngagementScore"), // Média de engajamento (0-100)
  avgTurnoverRate: int("avgTurnoverRate"), // Taxa de turnover (%)
  avgTenureYears: int("avgTenureYears"), // Tempo médio de permanência (anos)
  
  // Métricas Salariais
  avgSalary: int("avgSalary"), // Salário médio
  medianSalary: int("medianSalary"), // Salário mediano
  
  // Perfis Psicométricos Médios (DISC)
  avgDiscD: int("avgDiscD"), // Dominância (0-100)
  avgDiscI: int("avgDiscI"), // Influência (0-100)
  avgDiscS: int("avgDiscS"), // Estabilidade (0-100)
  avgDiscC: int("avgDiscC"), // Conformidade (0-100)
  
  // Perfis Psicométricos Médios (Big Five)
  avgOpenness: int("avgOpenness"), // Abertura (0-100)
  avgConscientiousness: int("avgConscientiousness"), // Conscienciosidade (0-100)
  avgExtraversion: int("avgExtraversion"), // Extroversão (0-100)
  avgAgreeableness: int("avgAgreeableness"), // Amabilidade (0-100)
  avgNeuroticism: int("avgNeuroticism"), // Neuroticismo (0-100)
  
  // Metadados
  sampleSize: int("sampleSize"), // Tamanho da amostra
  dataSource: varchar("dataSource", { length: 255 }), // Fonte dos dados
  year: int("year").notNull(), // Ano de referência
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MarketBenchmark = typeof marketBenchmarks.$inferSelect;
export type InsertMarketBenchmark = typeof marketBenchmarks.$inferInsert;


// ============================================================================
// PDI INTELIGENTE - AÇÕES E ACOMPANHAMENTO (MODELO NADIA)
// ============================================================================

/**
 * Ações do PDI Inteligente (Modelo 70-20-10)
 * Tabela de ações específicas do plano de desenvolvimento com status e métricas
 */
export const pdiActions = mysqlTable("pdiActions", {
  id: int("id").autoincrement().primaryKey(),
  planId: int("planId").notNull(), // Relacionamento com pdiPlans
  
  // Informações da ação
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  axis: mysqlEnum("axis", ["70_pratica", "20_experiencia", "10_educacao"]).notNull(), // Eixo 70-20-10
  developmentArea: varchar("developmentArea", { length: 100 }).notNull(), // Ex: "Visão Holística", "Liderança Sênior"
  
  // Métrica de sucesso
  successMetric: text("successMetric").notNull(), // Como medir o sucesso
  evidenceRequired: text("evidenceRequired"), // Evidências necessárias
  
  // Responsáveis
  responsible: varchar("responsible", { length: 255 }).notNull(), // Ex: "Nadia C. (Líder), Carlos M. (Sponsor)"
  
  // Prazo e status
  dueDate: datetime("dueDate").notNull(),
  status: mysqlEnum("status", ["nao_iniciado", "em_andamento", "concluido"]).default("nao_iniciado").notNull(),
  progress: int("progress").default(0).notNull(), // Percentual 0-100
  
  // Auditoria
  completedAt: datetime("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PdiAction = typeof pdiActions.$inferSelect;
export type InsertPdiAction = typeof pdiActions.$inferInsert;

/**
 * Acompanhamento e Feedbacks do PDI (Governança DGC)
 * Registros de reuniões de acompanhamento com índice de prontidão
 */
export const pdiGovernanceReviews = mysqlTable("pdiGovernanceReviews", {
  id: int("id").autoincrement().primaryKey(),
  planId: int("planId").notNull(),
  
  // Data e responsável
  reviewDate: datetime("reviewDate").notNull(),
  reviewerId: int("reviewerId").notNull(), // Quem fez o acompanhamento (DGC, Gestor, Sponsor)
  reviewerRole: mysqlEnum("reviewerRole", ["dgc", "mentor", "sponsor"]).notNull(),
  
  // Índice de Prontidão para Sucessão (IPS)
  readinessIndexTimes10: int("readinessIndexTimes10").notNull(), // 10 a 50 (1.0 a 5.0 * 10)
  
  // Feedback
  keyPoints: text("keyPoints").notNull(), // Pontos-chave da reunião
  strengths: text("strengths"), // Pontos fortes observados
  improvements: text("improvements"), // Áreas de melhoria
  nextSteps: text("nextSteps"), // Próximos passos
  
  // Auditoria
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PdiGovernanceReview = typeof pdiGovernanceReviews.$inferSelect;
export type InsertPdiGovernanceReview = typeof pdiGovernanceReviews.$inferInsert;

/**
 * Tabela de histórico de importações de PDI
 * Registra todas as importações em lote de PDIs via arquivo
 */
export const pdiImportHistory = mysqlTable("pdiImportHistory", {
  id: int("id").autoincrement().primaryKey(),
  
  // Informações do arquivo
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileSize: int("fileSize").notNull(), // Tamanho em bytes
  fileType: mysqlEnum("fileType", ["xlsx", "xls", "csv", "pdf", "html", "txt"]).notNull(),
  fileUrl: varchar("fileUrl", { length: 512 }), // URL do arquivo no S3
  
  // Status da importação
  status: mysqlEnum("status", ["processando", "concluido", "erro", "parcial"]).default("processando").notNull(),
  
  // Estatísticas
  totalRecords: int("totalRecords").default(0).notNull(), // Total de registros no arquivo
  successCount: int("successCount").default(0).notNull(), // Registros importados com sucesso
  errorCount: int("errorCount").default(0).notNull(), // Registros com erro
  
  // Detalhes de erros (JSON)
  errors: json("errors").$type<Array<{
    row: number;
    field: string;
    message: string;
    value?: string;
  }>>(),
  
  // Metadados
  importedBy: int("importedBy").notNull(), // Usuário que fez a importação
  startedAt: datetime("startedAt").notNull(),
  completedAt: datetime("completedAt"),
  
  // Auditoria
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PdiImportHistory = typeof pdiImportHistory.$inferSelect;
export type InsertPdiImportHistory = typeof pdiImportHistory.$inferInsert;

/**
 * Histórico de Edições de PDI
 * Registra todas as alterações feitas em PDIs importados
 */
export const pdiEditHistory = mysqlTable("pdiEditHistory", {
  id: int("id").autoincrement().primaryKey(),
  
  // Relacionamento
  pdiId: int("pdiId").notNull(), // ID do PDI editado
  actionId: int("actionId"), // ID da ação editada (null se edição do PDI geral)
  
  // Informações da edição
  editType: mysqlEnum("editType", ["pdi_update", "action_update", "action_create", "action_delete"]).notNull(),
  fieldChanged: varchar("fieldChanged", { length: 100 }), // Campo alterado
  oldValue: text("oldValue"), // Valor anterior
  newValue: text("newValue"), // Novo valor
  
  // Metadados
  editedBy: int("editedBy").notNull(), // Usuário que fez a edição
  editReason: text("editReason"), // Motivo da edição
  
  // Auditoria
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PdiEditHistory = typeof pdiEditHistory.$inferSelect;
export type InsertPdiEditHistory = typeof pdiEditHistory.$inferInsert;


// ============================================================================
// PESQUISAS DE PULSE (ENGAJAMENTO E CLIMA ORGANIZACIONAL)
// ============================================================================

/**
 * Pesquisas de Pulse - Questionários rápidos de clima e engajamento
 */
export const pulseSurveys = mysqlTable("pulseSurveys", {
  id: int("id").autoincrement().primaryKey(),
  
  // Informações da pesquisa
  title: varchar("title", { length: 255 }).notNull(),
  question: text("question").notNull(),
  description: text("description"),
  
  // Status e controle
  status: mysqlEnum("status", ["draft", "active", "closed"]).default("draft").notNull(),
  
  // Público-alvo
  targetDepartmentId: int("targetDepartmentId"), // null = todos os departamentos
  targetEmployeeIds: json("targetEmployeeIds"), // Array de IDs específicos (opcional)
  targetGroups: json("targetGroups"), // Array de grupos: ["all", "diretoria", "department", "costCenter", "emails"]
  targetDepartmentIds: json("targetDepartmentIds"), // Array de IDs de departamentos
  targetCostCenterIds: json("targetCostCenterIds"), // Array de IDs de centros de custo
  targetEmails: json("targetEmails"), // Array de emails específicos
  
  // Criação e auditoria
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  
  // Datas de ativação e encerramento
  activatedAt: datetime("activatedAt"),
  closedAt: datetime("closedAt"),
});

export type PulseSurvey = typeof pulseSurveys.$inferSelect;
export type InsertPulseSurvey = typeof pulseSurveys.$inferInsert;

/**
 * Respostas das Pesquisas de Pulse
 */
export const pulseSurveyResponses = mysqlTable("pulseSurveyResponses", {
  id: int("id").autoincrement().primaryKey(),
  
  // Relacionamentos
  surveyId: int("surveyId").notNull(),
  employeeId: int("employeeId"), // null = resposta anônima
  
  // Resposta
  rating: int("rating").notNull(), // 0-10
  comment: text("comment"),
  
  // Auditoria
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }), // Para evitar duplicatas
});

export type PulseSurveyResponse = typeof pulseSurveyResponses.$inferSelect;
export type InsertPulseSurveyResponse = typeof pulseSurveyResponses.$inferInsert;

/**
 * Histórico de Envios de E-mail das Pesquisas Pulse
 */
export const pulseSurveyEmailLogs = mysqlTable("pulseSurveyEmailLogs", {
  id: int("id").autoincrement().primaryKey(),
  
  // Relacionamentos
  surveyId: int("surveyId").notNull(),
  employeeId: int("employeeId").notNull(),
  
  // Dados do envio
  email: varchar("email", { length: 320 }).notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending").notNull(),
  
  // Controle de tentativas
  attemptCount: int("attemptCount").default(0).notNull(),
  lastAttemptAt: datetime("lastAttemptAt"),
  
  // Erro (se houver)
  errorMessage: text("errorMessage"),
  
  // Auditoria
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  sentAt: datetime("sentAt"),
});

export type PulseSurveyEmailLog = typeof pulseSurveyEmailLogs.$inferSelect;
export type InsertPulseSurveyEmailLog = typeof pulseSurveyEmailLogs.$inferInsert;


// ============================================================================
// DESCRIÇÃO DE CARGOS (JOB DESCRIPTIONS) - TEMPLATE UISA
// ============================================================================

/**
 * Descrições de Cargo - Baseado no template oficial UISA
 * Inclui: Objetivo, Responsabilidades, Conhecimentos, Competências, Qualificações
 */
export const jobDescriptions = mysqlTable("jobDescriptions", {
  id: int("id").autoincrement().primaryKey(),
  
  // Informações Básicas (Cabeçalho)
  positionId: int("positionId").notNull(), // Vinculação com tabela positions
  positionTitle: varchar("positionTitle", { length: 255 }).notNull(), // Cargo
  departmentId: int("departmentId").notNull(),
  departmentName: varchar("departmentName", { length: 255 }).notNull(), // Depto
  cbo: varchar("cbo", { length: 50 }), // Código Brasileiro de Ocupações
  division: varchar("division", { length: 255 }), // Divisão (ex: ADMINISTRATIVA)
  reportsTo: varchar("reportsTo", { length: 255 }), // Superior Imediato (ex: COORDENADOR PLANEJAMENTO CUSTOS)
  revision: varchar("revision", { length: 50 }), // Número da revisão
  
  // Objetivo Principal do Cargo
  mainObjective: text("mainObjective").notNull(),
  
  // Treinamento Obrigatório
  mandatoryTraining: json("mandatoryTraining"), // Array de strings
  
  // Qualificação Desejada
  educationLevel: varchar("educationLevel", { length: 255 }), // Ex: Ensino Superior
  requiredExperience: text("requiredExperience"), // Ex: Desejável de 4 a 6 anos no cargo ou posições similares
  
  // e-Social
  eSocialSpecs: text("eSocialSpecs"), // Especificações do Programa de Medicina e Segurança do Trabalho
  
  // Status e Workflow
  status: mysqlEnum("status", ["draft", "pending_occupant", "pending_manager", "pending_hr", "approved", "rejected"]).default("draft").notNull(),
  
  // Aprovadores Adicionais (Centro de Custo + Líder C&S)
  costCenterApproverId: int("costCenterApproverId"), // Aprovador do Centro de Custo
  salaryLeaderId: int("salaryLeaderId"), // Líder de Cargos e Salários
  costCenterApprovedAt: datetime("costCenterApprovedAt"), // Data de aprovação do aprovador CC
  salaryLeaderApprovedAt: datetime("salaryLeaderApprovedAt"), // Data de aprovação do líder C&S
  
  // Auditoria
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  approvedAt: datetime("approvedAt"),
});

export type JobDescription = typeof jobDescriptions.$inferSelect;
export type InsertJobDescription = typeof jobDescriptions.$inferInsert;

/**
 * Responsabilidades do Cargo - Agrupadas por categoria
 */
export const jobResponsibilities = mysqlTable("jobResponsibilities", {
  id: int("id").autoincrement().primaryKey(),
  
  jobDescriptionId: int("jobDescriptionId").notNull(),
  
  // Categoria da responsabilidade
  category: varchar("category", { length: 100 }).notNull(), // Ex: Processo, Análise KPI, Planejamento, Budget/Capex/Forecast, Resultados
  
  // Descrição da responsabilidade
  description: text("description").notNull(),
  
  // Ordem de exibição
  displayOrder: int("displayOrder").default(0).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type JobResponsibility = typeof jobResponsibilities.$inferSelect;
export type InsertJobResponsibility = typeof jobResponsibilities.$inferInsert;

/**
 * Conhecimentos Técnicos - Com níveis de proficiência
 */
export const jobKnowledge = mysqlTable("jobKnowledge", {
  id: int("id").autoincrement().primaryKey(),
  
  jobDescriptionId: int("jobDescriptionId").notNull(),
  
  // Nome do conhecimento técnico
  name: varchar("name", { length: 255 }).notNull(), // Ex: Office, Análise Processos, Processo Produtivo e Transformação Açúcar e Álcool
  
  // Nível de proficiência
  level: mysqlEnum("level", ["basico", "intermediario", "avancado", "obrigatorio"]).notNull(),
  
  // Ordem de exibição
  displayOrder: int("displayOrder").default(0).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type JobKnowledge = typeof jobKnowledge.$inferSelect;
export type InsertJobKnowledge = typeof jobKnowledge.$inferInsert;

/**
 * Competências e Habilidades - Grid 2 colunas
 */
export const jobCompetencies = mysqlTable("jobCompetencies", {
  id: int("id").autoincrement().primaryKey(),
  
  jobDescriptionId: int("jobDescriptionId").notNull(),
  
  // Nome da competência/habilidade
  name: varchar("name", { length: 255 }).notNull(), // Ex: Planejamento, Organização e Controle, Comunicação, Análise e Solução de Problemas
  
  // Tipo (para organizar em colunas)
  type: mysqlEnum("type", ["competencia", "habilidade"]).default("competencia").notNull(),
  
  // Ordem de exibição
  displayOrder: int("displayOrder").default(0).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type JobCompetency = typeof jobCompetencies.$inferSelect;
export type InsertJobCompetency = typeof jobCompetencies.$inferInsert;

/**
 * Aprovações de Descrição de Cargo - Workflow 3 níveis
 */
export const jobDescriptionApprovals = mysqlTable("jobDescriptionApprovals", {
  id: int("id").autoincrement().primaryKey(),
  
  jobDescriptionId: int("jobDescriptionId").notNull(),
  
  // Nível de aprovação
  approvalLevel: mysqlEnum("approvalLevel", ["occupant", "manager", "hr"]).notNull(), // Ocupante do Cargo, Superior Imediato, Gerente de RH
  
  // Aprovador
  approverId: int("approverId").notNull(),
  approverName: varchar("approverName", { length: 255 }).notNull(),
  
  // Status da aprovação
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  
  // Comentários
  comments: text("comments"),
  
  // Datas
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  decidedAt: datetime("decidedAt"),
});

export type JobDescriptionApproval = typeof jobDescriptionApprovals.$inferSelect;
export type InsertJobDescriptionApproval = typeof jobDescriptionApprovals.$inferInsert;

// ============================================================================
// REGISTRO DE ATIVIDADES E TAREFAS
// ============================================================================

/**
 * Atividades Manuais - Registradas pelo funcionário
 */
export const employeeActivities = mysqlTable("employeeActivities", {
  id: int("id").autoincrement().primaryKey(),
  
  // Relacionamentos
  employeeId: int("employeeId").notNull(),
  jobDescriptionId: int("jobDescriptionId"), // Vinculação com descrição de cargo (opcional)
  responsibilityId: int("responsibilityId"), // Vinculação com responsabilidade específica (opcional)
  
  // Informações da atividade
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["reuniao", "analise", "planejamento", "execucao", "suporte", "outros"]).notNull(),
  
  // Tempo
  activityDate: datetime("activityDate").notNull(),
  startTime: varchar("startTime", { length: 5 }), // HH:MM
  endTime: varchar("endTime", { length: 5 }), // HH:MM
  durationMinutes: int("durationMinutes"), // Calculado automaticamente
  
  // Auditoria
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmployeeActivity = typeof employeeActivities.$inferSelect;
export type InsertEmployeeActivity = typeof employeeActivities.$inferInsert;

/**
 * Logs de Atividades Automáticas - Coletadas pelo sistema
 */
export const activityLogs = mysqlTable("activityLogs", {
  id: int("id").autoincrement().primaryKey(),
  
  // Relacionamentos
  employeeId: int("employeeId").notNull(),
  userId: int("userId").notNull(),
  
  // Tipo de atividade
  activityType: varchar("activityType", { length: 100 }).notNull(), // Ex: login, logout, create_goal, update_pdi, submit_evaluation
  
  // Detalhes da atividade
  activityDescription: varchar("activityDescription", { length: 500 }),
  entityType: varchar("entityType", { length: 100 }), // Ex: goal, pdi, evaluation, feedback
  entityId: int("entityId"), // ID da entidade relacionada
  
  // Metadados
  metadata: json("metadata"), // Dados adicionais (ex: IP, user agent, etc)
  
  // Auditoria
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

// ============================================================================
// TABELAS DE NOTIFICAÇÕES PUSH
// ============================================================================

/**
 * Push Subscriptions - Assinaturas de notificações push do navegador
 */
export const pushSubscriptions = mysqlTable("pushSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  
  // Relacionamento
  userId: int("userId").notNull(),
  
  // Dados da subscription (Web Push API)
  endpoint: varchar("endpoint", { length: 500 }).notNull(),
  p256dh: varchar("p256dh", { length: 200 }).notNull(), // Public key
  auth: varchar("auth", { length: 100 }).notNull(), // Auth secret
  
  // Metadados do dispositivo
  userAgent: varchar("userAgent", { length: 500 }),
  deviceType: mysqlEnum("deviceType", ["desktop", "mobile", "tablet"]).default("desktop"),
  
  // Status
  active: boolean("active").default(true).notNull(),
  
  // Auditoria
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastUsedAt: timestamp("lastUsedAt").defaultNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

/**
 * Push Notification Logs - Registro de notificações push enviadas
 */
export const pushNotificationLogs = mysqlTable("pushNotificationLogs", {
  id: int("id").autoincrement().primaryKey(),
  
  // Relacionamento
  userId: int("userId").notNull(),
  
  // Conteúdo da notificação
  type: varchar("type", { length: 100 }).notNull(), // meta_atrasada, avaliacao_pendente, consenso_pendente, pdi_prazo, etc
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  actionUrl: varchar("actionUrl", { length: 500 }), // URL para redirecionar ao clicar
  
  // Metadados do dispositivo
  deviceType: mysqlEnum("deviceType", ["desktop", "mobile", "tablet"]).default("desktop"),
  
  // Status de entrega
  status: mysqlEnum("status", ["sent", "opened", "failed"]).default("sent").notNull(),
  errorMessage: text("errorMessage"), // Mensagem de erro se status = erro
  
  // Timestamps
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  openedAt: timestamp("openedAt"), // Quando foi aberta/clicada
  
  // Auditoria
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PushNotificationLog = typeof pushNotificationLogs.$inferSelect;
export type InsertPushNotificationLog = typeof pushNotificationLogs.$inferInsert;

// ============================================================================
// TABELAS DE TEMPLATES DE AVALIAÇÃO
// ============================================================================

/**
 * Evaluation Templates - Templates customizados de avaliação
 */
export const evaluationTemplates = mysqlTable("evaluationTemplates", {
  id: int("id").autoincrement().primaryKey(),
  
  // Informações básicas
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  templateType: mysqlEnum("templateType", ["360", "180", "90", "custom"]).default("custom").notNull(),
  hierarchyLevel: mysqlEnum("hierarchyLevel", ["operacional", "coordenacao", "gerencia", "diretoria"]), // Nível hierárquico do Leadership Pipeline
  
  // Alvos (JSON arrays de IDs)
  targetRoles: json("targetRoles"), // Array de IDs de cargos
  targetDepartments: json("targetDepartments"), // Array de IDs de departamentos
  
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  
  // Auditoria
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EvaluationTemplate = typeof evaluationTemplates.$inferSelect;
export type InsertEvaluationTemplate = typeof evaluationTemplates.$inferInsert;

/**
 * Template Questions - Perguntas customizadas dos templates
 */
export const templateQuestions = mysqlTable("templateQuestions", {
  id: int("id").autoincrement().primaryKey(),
  
  // Relacionamento
  templateId: int("templateId").notNull(),
  
  // Conteúdo da pergunta
  category: varchar("category", { length: 100 }).notNull(), // competencias, comportamento, resultados, etc
  questionText: text("questionText").notNull(),
  questionType: mysqlEnum("questionType", ["scale_1_5", "scale_1_10", "text", "multiple_choice", "yes_no"]).default("scale_1_5").notNull(),
  options: json("options"), // Opções para multiple_choice
  
  // Configurações
  weight: int("weight").default(1).notNull(), // Peso da pergunta no cálculo final
  displayOrder: int("displayOrder").default(0).notNull(),
  isRequired: boolean("isRequired").default(true).notNull(),
  helpText: text("helpText"), // Texto de ajuda/explicação
  
  // Auditoria
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TemplateQuestion = typeof templateQuestions.$inferSelect;
export type InsertTemplateQuestion = typeof templateQuestions.$inferInsert;

// ============================================================================
// TABELAS DE CALIBRAÇÃO EM TEMPO REAL
// ============================================================================

/**
 * Calibration Meeting Participants - Participantes das reuniões de calibração
 */
export const calibrationParticipants = mysqlTable("calibrationParticipants", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["facilitator", "participant", "observer"]).default("participant").notNull(),
  joinedAt: datetime("joinedAt"),
  leftAt: datetime("leftAt"),
  isOnline: boolean("isOnline").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CalibrationParticipant = typeof calibrationParticipants.$inferSelect;
export type InsertCalibrationParticipant = typeof calibrationParticipants.$inferInsert;

/**
 * Calibration Votes - Sistema de votação para consenso
 */
export const calibrationVotes = mysqlTable("calibrationVotes", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  evaluationId: int("evaluationId").notNull(),
  voterId: int("voterId").notNull(),
  proposedScore: int("proposedScore").notNull(),
  justification: text("justification"),
  voteType: mysqlEnum("voteType", ["approve", "reject", "abstain"]).default("approve").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CalibrationVote = typeof calibrationVotes.$inferSelect;
export type InsertCalibrationVote = typeof calibrationVotes.$inferInsert;

/**
 * Calibration Comparisons - Comparações lado a lado de avaliações
 */
export const calibrationComparisons = mysqlTable("calibrationComparisons", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  evaluationId: int("evaluationId").notNull(),
  
  // Notas de diferentes avaliadores
  selfScore: int("selfScore"),
  managerScore: int("managerScore"),
  peerScores: json("peerScores"), // Array de notas dos pares
  
  // Consenso
  consensusScore: int("consensusScore"),
  consensusReachedAt: datetime("consensusReachedAt"),
  consensusBy: int("consensusBy"),
  
  // Discrepâncias
  hasDiscrepancy: boolean("hasDiscrepancy").default(false).notNull(),
  discrepancyReason: text("discrepancyReason"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CalibrationComparison = typeof calibrationComparisons.$inferSelect;
export type InsertCalibrationComparison = typeof calibrationComparisons.$inferInsert;

// ============================================================================
// CICLO DE AVALIAÇÃO DE DESEMPENHO
// ============================================================================

/**
 * Ciclos de Avaliação de Desempenho
 * Gerencia ciclos anuais/semestrais com metas corporativas e individuais
 */
export const performanceEvaluationCycles = mysqlTable("performanceEvaluationCycles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  year: int("year").notNull(),
  period: mysqlEnum("period", ["anual", "semestral", "trimestral"]).default("anual").notNull(),
  
  // Prazos
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  adhesionDeadline: date("adhesionDeadline").notNull(), // Prazo para funcionário aderir
  managerApprovalDeadline: date("managerApprovalDeadline").notNull(), // Prazo para gestor aprovar
  trackingStartDate: date("trackingStartDate"), // Início do acompanhamento
  trackingEndDate: date("trackingEndDate"), // Fim do acompanhamento
  evaluationDeadline: date("evaluationDeadline"), // Prazo para avaliação final
  goalSubmissionDeadline: date("goalSubmissionDeadline"), // Prazo para submissão de metas
  
  // Metas corporativas do ciclo (JSON array de IDs)
  corporateGoalIds: text("corporateGoalIds"), // JSON: [1, 2, 3]
  
  // Status
  status: mysqlEnum("status", ["planejado", "aberto", "em_andamento", "em_avaliacao", "concluido", "cancelado"]).default("planejado").notNull(),
  
  // Auditoria
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PerformanceEvaluationCycle = typeof performanceEvaluationCycles.$inferSelect;
export type InsertPerformanceEvaluationCycle = typeof performanceEvaluationCycles.$inferInsert;

/**
 * Participantes do Ciclo de Avaliação
 * Cada funcionário que participa do ciclo
 */
export const performanceEvaluationParticipants = mysqlTable("performanceEvaluationParticipants", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").notNull(),
  employeeId: int("employeeId").notNull(),
  managerId: int("managerId"), // Gestor responsável pela aprovação
  
  // Metas individuais (JSON array de objetos)
  individualGoals: text("individualGoals"), // JSON: [{title, description, deadline, weight}]
  
  // Status do participante no ciclo
  status: mysqlEnum("status", [
    "pendente_adesao", // Aguardando funcionário aderir
    "aguardando_aprovacao_gestor", // Aguardando gestor aprovar metas
    "metas_aprovadas", // Metas aprovadas, pode acompanhar
    "em_acompanhamento", // Acompanhando progresso
    "aguardando_avaliacao", // Aguardando avaliação final
    "avaliacao_concluida", // Avaliação final concluída
    "aprovado_rh" // Aprovado pela aprovação geral (RH/Diretoria)
  ]).default("pendente_adesao").notNull(),
  
  // Datas de transição de status
  adhesionDate: datetime("adhesionDate"), // Data que funcionário aderiu
  managerApprovalDate: datetime("managerApprovalDate"), // Data que gestor aprovou
  evaluationDate: datetime("evaluationDate"), // Data da avaliação final
  finalApprovalDate: datetime("finalApprovalDate"), // Data da aprovação geral
  
  // Justificativas
  managerRejectionReason: text("managerRejectionReason"),
  managerComments: text("managerComments"),
  
  // Scores finais
  selfEvaluationScore: int("selfEvaluationScore"), // Autoavaliação (1-5)
  managerEvaluationScore: int("managerEvaluationScore"), // Avaliação do gestor (1-5)
  finalScore: int("finalScore"), // Score final consensuado
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PerformanceEvaluationParticipant = typeof performanceEvaluationParticipants.$inferSelect;
export type InsertPerformanceEvaluationParticipant = typeof performanceEvaluationParticipants.$inferInsert;

/**
 * Evidências de Acompanhamento
 * Funcionário adiciona evidências durante o acompanhamento
 */
export const performanceEvaluationEvidences = mysqlTable("performanceEvaluationEvidences", {
  id: int("id").autoincrement().primaryKey(),
  participantId: int("participantId").notNull(),
  goalType: mysqlEnum("goalType", ["corporativa", "individual"]).notNull(),
  goalIndex: int("goalIndex"), // Índice da meta no array (corporativa ou individual)
  
  // Evidência
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  evidenceType: mysqlEnum("evidenceType", ["documento", "link", "imagem", "video", "texto"]).notNull(),
  fileUrl: varchar("fileUrl", { length: 512 }), // URL do arquivo no S3
  linkUrl: varchar("linkUrl", { length: 512 }), // URL externa
  
  // Progresso
  progressPercentage: int("progressPercentage").default(0), // 0-100
  currentValue: varchar("currentValue", { length: 255 }), // Valor atual da meta
  submittedAt: timestamp("submittedAt").defaultNow(), // Data de submissão
  
  // Auditoria
  uploadedBy: int("uploadedBy").notNull(),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PerformanceEvaluationEvidence = typeof performanceEvaluationEvidences.$inferSelect;
export type InsertPerformanceEvaluationEvidence = typeof performanceEvaluationEvidences.$inferInsert;

/**
 * Histórico de Aprovações
 * Registra todas as aprovações/rejeições do ciclo
 */
export const performanceEvaluationApprovals = mysqlTable("performanceEvaluationApprovals", {
  id: int("id").autoincrement().primaryKey(),
  participantId: int("participantId").notNull(),
  approverType: mysqlEnum("approverType", ["gestor", "rh", "diretoria"]).notNull(),
  approverId: int("approverId").notNull(),
  
  action: mysqlEnum("action", ["aprovado", "rejeitado", "solicitado_ajuste"]).notNull(),
  comments: text("comments"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PerformanceEvaluationApproval = typeof performanceEvaluationApprovals.$inferSelect;
export type InsertPerformanceEvaluationApproval = typeof performanceEvaluationApprovals.$inferInsert;

// Re-export from schema-alerts.ts
export * from "./schema-alerts";


// Tabela de templates de notificações personalizadas
export const notificationTemplates = mysqlTable("notificationTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  eventType: varchar("eventType", { length: 100 }).notNull(), // meta_vencida, avaliacao_pendente, etc
  title: varchar("title", { length: 255 }).notNull(), // Suporta variáveis: {{nome}}, {{data}}
  message: text("message").notNull(), // Suporta variáveis: {{nome}}, {{meta}}, {{prazo}}
  link: varchar("link", { length: 500 }), // Link opcional
  priority: mysqlEnum("priority", ["baixa", "media", "alta", "critica"]).notNull().default("media"),
  active: mysqlEnum("active", ["yes", "no"]).notNull().default("yes"),
  sendEmail: mysqlEnum("sendEmail", ["yes", "no"]).notNull().default("no"),
  sendPush: mysqlEnum("sendPush", ["yes", "no"]).notNull().default("yes"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type InsertNotificationTemplate = typeof notificationTemplates.$inferInsert;


// ============================================================================
// TABELAS PARA CICLO 360° ENHANCED
// ============================================================================

/**
 * Pesos das dimensões de avaliação para cada ciclo 360°
 * Define a distribuição entre autoavaliação, gestor, pares e subordinados
 */
export const evaluation360CycleWeights = mysqlTable("evaluation360CycleWeights", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").notNull(),
  selfWeight: int("selfWeight").default(25).notNull(), // Peso da autoavaliação (0-100)
  managerWeight: int("managerWeight").default(25).notNull(), // Peso da avaliação do gestor (0-100)
  peersWeight: int("peersWeight").default(25).notNull(), // Peso da avaliação de pares (0-100)
  subordinatesWeight: int("subordinatesWeight").default(25).notNull(), // Peso da avaliação de subordinados (0-100)
  
  // Prazos para cada etapa
  selfEvaluationDeadline: datetime("selfEvaluationDeadline"),
  managerEvaluationDeadline: datetime("managerEvaluationDeadline"),
  peersEvaluationDeadline: datetime("peersEvaluationDeadline"),
  subordinatesEvaluationDeadline: datetime("subordinatesEvaluationDeadline"),
  consensusDeadline: datetime("consensusDeadline"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Evaluation360CycleWeights = typeof evaluation360CycleWeights.$inferSelect;
export type InsertEvaluation360CycleWeights = typeof evaluation360CycleWeights.$inferInsert;

/**
 * Competências vinculadas a um ciclo 360°
 * Define quais competências serão avaliadas e seus pesos
 */
export const evaluation360CycleCompetencies = mysqlTable("evaluation360CycleCompetencies", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").notNull(),
  competencyId: int("competencyId").notNull(),
  weight: int("weight").default(1).notNull(), // Peso relativo da competência
  minLevel: int("minLevel").default(1).notNull(), // Nível mínimo esperado (1-5)
  maxLevel: int("maxLevel").default(5).notNull(), // Nível máximo esperado (1-5)
  description: text("description"), // Descrição adicional para este ciclo
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Evaluation360CycleCompetency = typeof evaluation360CycleCompetencies.$inferSelect;
export type InsertEvaluation360CycleCompetency = typeof evaluation360CycleCompetencies.$inferInsert;

/**
 * Participantes de um ciclo 360°
 * Define quem participa do ciclo e em que capacidade
 */
export const evaluation360CycleParticipants = mysqlTable("evaluation360CycleParticipants", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").notNull(),
  employeeId: int("employeeId").notNull(),
  
  // Tipo de participação
  participationType: mysqlEnum("participationType", ["evaluated", "evaluator", "both"]).default("evaluated").notNull(),
  
  // Relacionamentos
  managerId: int("managerId"), // Gestor direto (se aplicável)
  peerIds: text("peerIds"), // JSON array de IDs de pares
  subordinateIds: text("subordinateIds"), // JSON array de IDs de subordinados
  
  // Status
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  
  // Datas
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Evaluation360CycleParticipant = typeof evaluation360CycleParticipants.$inferSelect;
export type InsertEvaluation360CycleParticipant = typeof evaluation360CycleParticipants.$inferInsert;

/**
 * Configuração de ciclo 360° (metadados da criação)
 * Armazena o estado do ciclo durante a criação (wizard)
 */
export const evaluation360CycleConfig = mysqlTable("evaluation360CycleConfig", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").notNull(),
  
  // Estado do wizard
  currentStep: int("currentStep").default(1).notNull(), // 1-4
  isCompleted: boolean("isCompleted").default(false).notNull(),
  
  // Dados temporários
  tempData: text("tempData"), // JSON com dados em progresso
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Evaluation360CycleConfig = typeof evaluation360CycleConfig.$inferSelect;
export type InsertEvaluation360CycleConfig = typeof evaluation360CycleConfig.$inferInsert;


// ============================================================================
// TEMPLATES DE CONFIGURAÇÃO 360° ENHANCED
// ============================================================================

/**
 * Templates de Configuração de Ciclos 360°
 * Permite salvar e reutilizar configurações de pesos e competências
 */
export const cycle360Templates = mysqlTable("cycle360Templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  
  // Criador do template
  createdBy: int("createdBy").notNull(), // ID do usuário
  creatorName: varchar("creatorName", { length: 200 }),
  
  // Configuração de pesos
  selfWeight: int("selfWeight").notNull().default(20),
  peerWeight: int("peerWeight").notNull().default(30),
  subordinateWeight: int("subordinateWeight").notNull().default(20),
  managerWeight: int("managerWeight").notNull().default(30),
  
  // Competências (JSON array de IDs)
  competencyIds: text("competencyIds").notNull(), // JSON: [1, 2, 3, ...]
  
  // Metadados
  isPublic: boolean("isPublic").default(false).notNull(), // Se outros usuários podem usar
  usageCount: int("usageCount").default(0).notNull(), // Quantas vezes foi usado
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Cycle360Template = typeof cycle360Templates.$inferSelect;
export type InsertCycle360Template = typeof cycle360Templates.$inferInsert;

/**
 * Rascunhos de Ciclos 360° (salvamento automático)
 * Armazena progresso do wizard para recuperação posterior
 */
export const cycle360Drafts = mysqlTable("cycle360Drafts", {
  id: int("id").autoincrement().primaryKey(),
  draftKey: varchar("draftKey", { length: 100 }).notNull().unique(), // Chave única do rascunho
  userId: int("userId").notNull(), // ID do usuário
  userEmail: varchar("userEmail", { length: 320 }).notNull(),
  userName: varchar("userName", { length: 200 }),
  
  // Dados do rascunho (JSON com todas as etapas)
  draftData: text("draftData").notNull(), // JSON: { cycleData, weights, competencies, participants }
  currentStep: int("currentStep").default(1).notNull(), // Etapa atual do wizard (1-5)
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Cycle360Draft = typeof cycle360Drafts.$inferSelect;
export type InsertCycle360Draft = typeof cycle360Drafts.$inferInsert;


// ============================================================================
// TABELAS DE REGRAS DE APROVAÇÃO
// ============================================================================

/**
 * Regras de Aprovação - Define quem aprova o quê
 * Permite vinculação por departamento, centro de custo ou funcionário individual
 */
export const approvalRules = mysqlTable("approvalRules", {
  id: int("id").autoincrement().primaryKey(),
  
  // Tipo de regra
  ruleType: mysqlEnum("ruleType", ["departamento", "centro_custo", "individual"]).notNull(),
  
  // Contexto da regra (o que está sendo aprovado)
  approvalContext: mysqlEnum("approvalContext", [
    "metas",
    "avaliacoes",
    "pdi",
    "descricao_cargo",
    "ciclo_360",
    "bonus",
    "promocao",
    "todos"
  ]).default("todos").notNull(),
  
  // Vinculação (apenas um será preenchido)
  departmentId: int("departmentId"), // Para regras por departamento
  costCenterId: int("costCenterId"), // Para regras por centro de custo
  employeeId: int("employeeId"), // Para regras individuais
  
  // Aprovador
  approverId: int("approverId").notNull(), // ID do funcionário aprovador
  approverLevel: int("approverLevel").default(1).notNull(), // Nível hierárquico (1, 2, 3...)
  
  // Configurações
  requiresSequentialApproval: boolean("requiresSequentialApproval").default(false).notNull(), // Aprovação sequencial ou paralela
  isActive: boolean("isActive").default(true).notNull(),
  
  // Metadados
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApprovalRule = typeof approvalRules.$inferSelect;
export type InsertApprovalRule = typeof approvalRules.$inferInsert;

/**
 * Histórico de Alterações de Regras de Aprovação
 */
export const approvalRuleHistory = mysqlTable("approvalRuleHistory", {
  id: int("id").autoincrement().primaryKey(),
  ruleId: int("ruleId").notNull(),
  action: mysqlEnum("action", ["criado", "atualizado", "desativado", "excluido"]).notNull(),
  previousData: text("previousData"), // JSON com dados anteriores
  newData: text("newData"), // JSON com novos dados
  changedBy: int("changedBy").notNull(),
  changedAt: timestamp("changedAt").defaultNow().notNull(),
});

export type ApprovalRuleHistory = typeof approvalRuleHistory.$inferSelect;
export type InsertApprovalRuleHistory = typeof approvalRuleHistory.$inferInsert;

// ============================================================================
// TABELAS PARA GESTÃO COMPLETA DE USUÁRIOS (ITEM 1)
// ============================================================================

/**
 * Employee Import History - Histórico de importações em lote
 */
export const employeeImportHistory = mysqlTable("employeeImportHistory", {
  id: int("id").autoincrement().primaryKey(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 512 }),
  totalRecords: int("totalRecords").notNull(),
  successCount: int("successCount").default(0).notNull(),
  errorCount: int("errorCount").default(0).notNull(),
  errors: text("errors"), // JSON com erros detalhados
  status: mysqlEnum("status", ["processando", "concluido", "erro"]).default("processando").notNull(),
  importedBy: int("importedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmployeeImportHistory = typeof employeeImportHistory.$inferSelect;
export type InsertEmployeeImportHistory = typeof employeeImportHistory.$inferInsert;

/**
 * Employee Audit Log - Log de alterações de funcionários
 */
export const employeeAuditLog = mysqlTable("employeeAuditLog", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  action: mysqlEnum("action", ["criado", "atualizado", "desativado", "reativado", "excluido"]).notNull(),
  fieldChanged: varchar("fieldChanged", { length: 100 }), // Campo alterado
  oldValue: text("oldValue"), // Valor anterior
  newValue: text("newValue"), // Novo valor
  changedBy: int("changedBy").notNull(),
  changedAt: timestamp("changedAt").defaultNow().notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
});

export type EmployeeAuditLog = typeof employeeAuditLog.$inferSelect;
export type InsertEmployeeAuditLog = typeof employeeAuditLog.$inferInsert;

// ============================================================================
// TABELAS PARA SISTEMA DE AVALIAÇÕES (ITEM 2)
// ============================================================================

/**
 * Evaluation Criteria - Critérios de avaliação detalhados
 */
export const evaluationCriteria = mysqlTable("evaluationCriteria", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["competencia", "meta", "comportamento", "resultado"]).notNull(),
  weight: int("weight").default(1).notNull(), // Peso no cálculo final
  minScore: int("minScore").default(1).notNull(),
  maxScore: int("maxScore").default(5).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EvaluationCriteria = typeof evaluationCriteria.$inferSelect;
export type InsertEvaluationCriteria = typeof evaluationCriteria.$inferInsert;

/**
 * Template Criteria - Relacionamento entre templates e critérios
 */
export const templateCriteria = mysqlTable("templateCriteria", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").notNull(),
  criteriaId: int("criteriaId").notNull(),
  weight: int("weight").default(1).notNull(), // Peso específico neste template
  isRequired: boolean("isRequired").default(true).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TemplateCriteria = typeof templateCriteria.$inferSelect;
export type InsertTemplateCriteria = typeof templateCriteria.$inferInsert;

/**
 * Evaluation Instances - Instâncias de avaliações criadas
 */
export const evaluationInstances = mysqlTable("evaluationInstances", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").notNull(),
  employeeId: int("employeeId").notNull(), // Avaliado
  evaluatorId: int("evaluatorId").notNull(), // Avaliador
  cycleId: int("cycleId"), // Ciclo de avaliação (se aplicável)
  
  // Tipo de avaliação
  evaluationType: mysqlEnum("evaluationType", ["autoavaliacao", "superior", "par", "subordinado", "cliente"]).notNull(),
  
  // Status e prazos
  status: mysqlEnum("status", ["pendente", "em_andamento", "concluida", "aprovada", "rejeitada"]).default("pendente").notNull(),
  dueDate: datetime("dueDate"),
  startedAt: datetime("startedAt"),
  completedAt: datetime("completedAt"),
  approvedAt: datetime("approvedAt"),
  approvedBy: int("approvedBy"),
  
  // Pontuação
  totalScore: int("totalScore"), // Pontuação total calculada
  maxPossibleScore: int("maxPossibleScore"),
  finalRating: mysqlEnum("finalRating", ["insatisfatorio", "abaixo_expectativas", "atende_expectativas", "supera_expectativas", "excepcional"]),
  
  // Comentários gerais
  generalComments: text("generalComments"),
  strengths: text("strengths"), // Pontos fortes
  improvements: text("improvements"), // Pontos de melhoria
  
  // Notificações
  notificationSent: boolean("notificationSent").default(false).notNull(),
  remindersSent: int("remindersSent").default(0).notNull(),
  
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EvaluationInstance = typeof evaluationInstances.$inferSelect;
export type InsertEvaluationInstance = typeof evaluationInstances.$inferInsert;

/**
 * Evaluation Criteria Responses - Respostas detalhadas por critério
 */
export const evaluationCriteriaResponses = mysqlTable("evaluationCriteriaResponses", {
  id: int("id").autoincrement().primaryKey(),
  instanceId: int("instanceId").notNull(),
  criteriaId: int("criteriaId").notNull(),
  score: int("score").notNull(),
  comments: text("comments"),
  evidences: text("evidences"), // JSON com evidências/exemplos
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EvaluationCriteriaResponse = typeof evaluationCriteriaResponses.$inferSelect;
export type InsertEvaluationCriteriaResponse = typeof evaluationCriteriaResponses.$inferInsert;

/**
 * Evaluation Comments - Sistema de comentários nas avaliações
 */
export const evaluationComments = mysqlTable("evaluationComments", {
  id: int("id").autoincrement().primaryKey(),
  instanceId: int("instanceId").notNull(),
  criteriaId: int("criteriaId"), // Null = comentário geral
  authorId: int("authorId").notNull(),
  comment: text("comment").notNull(),
  isPrivate: boolean("isPrivate").default(false).notNull(), // Visível apenas para RH/Gestor
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EvaluationComment = typeof evaluationComments.$inferSelect;
export type InsertEvaluationComment = typeof evaluationComments.$inferInsert;

// ============================================================================
// TABELAS PARA RELATÓRIOS E DASHBOARD (ITEM 3)
// ============================================================================

/**
 * Performance Metrics - Métricas agregadas de desempenho
 */
export const performanceMetrics = mysqlTable("performanceMetrics", {
  id: int("id").autoincrement().primaryKey(),
  
  // Dimensões
  employeeId: int("employeeId"),
  departmentId: int("departmentId"),
  positionId: int("positionId"),
  periodYear: int("periodYear").notNull(),
  periodMonth: int("periodMonth"), // Null para métricas anuais
  
  // Métricas de avaliação
  totalEvaluations: int("totalEvaluations").default(0).notNull(),
  completedEvaluations: int("completedEvaluations").default(0).notNull(),
  pendingEvaluations: int("pendingEvaluations").default(0).notNull(),
  averageScore: int("averageScore"), // Média * 100 para armazenar como int
  averageRating: mysqlEnum("averageRating", ["insatisfatorio", "abaixo_expectativas", "atende_expectativas", "supera_expectativas", "excepcional"]),
  
  // Métricas de metas
  totalGoals: int("totalGoals").default(0).notNull(),
  completedGoals: int("completedGoals").default(0).notNull(),
  goalCompletionRate: int("goalCompletionRate"), // Percentual * 100
  
  // Métricas de competências
  averageCompetencyScore: int("averageCompetencyScore"),
  topCompetency: varchar("topCompetency", { length: 200 }),
  improvementArea: varchar("improvementArea", { length: 200 }),
  
  // Metadados
  calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetric = typeof performanceMetrics.$inferInsert;

/**
 * Performance History - Histórico de evolução de desempenho
 */
export const performanceHistory = mysqlTable("performanceHistory", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  evaluationId: int("evaluationId").notNull(),
  score: int("score").notNull(),
  rating: mysqlEnum("rating", ["insatisfatorio", "abaixo_expectativas", "atende_expectativas", "supera_expectativas", "excepcional"]).notNull(),
  evaluationDate: datetime("evaluationDate").notNull(),
  evaluationType: varchar("evaluationType", { length: 50 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PerformanceHistory = typeof performanceHistory.$inferSelect;
export type InsertPerformanceHistory = typeof performanceHistory.$inferInsert;

/**
 * Department Performance Summary - Resumo de desempenho por departamento
 */
export const departmentPerformanceSummary = mysqlTable("departmentPerformanceSummary", {
  id: int("id").autoincrement().primaryKey(),
  departmentId: int("departmentId").notNull(),
  periodYear: int("periodYear").notNull(),
  periodQuarter: int("periodQuarter"), // 1-4 ou null para anual
  
  // Métricas agregadas
  totalEmployees: int("totalEmployees").notNull(),
  evaluatedEmployees: int("evaluatedEmployees").notNull(),
  averageScore: int("averageScore"),
  topPerformerCount: int("topPerformerCount").default(0).notNull(),
  lowPerformerCount: int("lowPerformerCount").default(0).notNull(),
  
  // Distribuição de ratings
  ratingDistribution: text("ratingDistribution"), // JSON com contagem por rating
  
  // Comparação com período anterior
  scoreChange: int("scoreChange"), // Variação percentual * 100
  trend: mysqlEnum("trend", ["melhorando", "estavel", "declinando"]),
  
  calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DepartmentPerformanceSummary = typeof departmentPerformanceSummary.$inferSelect;
export type InsertDepartmentPerformanceSummary = typeof departmentPerformanceSummary.$inferInsert;

/**
 * Report Templates - Templates de relatórios customizáveis
 */
export const reportTemplates = mysqlTable("reportTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  reportType: mysqlEnum("reportType", ["individual", "departamento", "consolidado", "comparativo", "ranking"]).notNull(),
  
  // Configuração do relatório (JSON)
  config: text("config"), // Campos, filtros, ordenação, etc.
  
  // Permissões
  isPublic: boolean("isPublic").default(false).notNull(),
  allowedRoles: text("allowedRoles"), // JSON array de roles
  
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReportTemplate = typeof reportTemplates.$inferSelect;
export type InsertReportTemplate = typeof reportTemplates.$inferInsert;

/**
 * Generated Reports - Relatórios gerados e armazenados
 */
export const generatedReports = mysqlTable("generatedReports", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId"),
  title: varchar("title", { length: 255 }).notNull(),
  reportType: varchar("reportType", { length: 50 }).notNull(),
  
  // Filtros aplicados
  filters: text("filters"), // JSON com filtros usados
  
  // Arquivo gerado
  fileUrl: varchar("fileUrl", { length: 512 }),
  fileFormat: mysqlEnum("fileFormat", ["pdf", "excel", "csv"]).notNull(),
  fileSize: int("fileSize"), // Tamanho em bytes
  
  // Status
  status: mysqlEnum("status", ["gerando", "concluido", "erro"]).default("gerando").notNull(),
  errorMessage: text("errorMessage"),
  
  generatedBy: int("generatedBy").notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  expiresAt: datetime("expiresAt"), // Data de expiração do arquivo
});

export type GeneratedReport = typeof generatedReports.$inferSelect;
export type InsertGeneratedReport = typeof generatedReports.$inferInsert;

// ============================================================================
// TABELA DE PENDÊNCIAS
// ============================================================================

/**
 * Pendências - Sistema de gerenciamento de tarefas e pendências
 */
export const pendencias = mysqlTable("pendencias", {
  id: int("id").autoincrement().primaryKey(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descricao: text("descricao"),
  
  // Status e Prioridade
  status: mysqlEnum("status", ["pendente", "em_andamento", "concluida", "cancelada"]).default("pendente").notNull(),
  prioridade: mysqlEnum("prioridade", ["baixa", "media", "alta", "urgente"]).default("media").notNull(),
  
  // Responsável e Criador
  responsavelId: int("responsavelId").notNull(), // ID do funcionário responsável
  criadoPorId: int("criadoPorId").notNull(), // ID do usuário que criou
  
  // Datas
  dataVencimento: datetime("dataVencimento"),
  dataInicio: datetime("dataInicio"),
  dataConclusao: datetime("dataConclusao"),
  
  // Categoria e Tags
  categoria: varchar("categoria", { length: 100 }), // Ex: "Avaliação", "Meta", "PDI", etc
  tags: text("tags"), // JSON array de tags
  
  // Relacionamentos opcionais
  avaliacaoId: int("avaliacaoId"), // Relacionado a uma avaliação
  metaId: int("metaId"), // Relacionado a uma meta
  pdiId: int("pdiId"), // Relacionado a um PDI
  funcionarioId: int("funcionarioId"), // Relacionado a um funcionário específico
  
  // Progresso
  progresso: int("progresso").default(0), // 0-100%
  
  // Observações e anexos
  observacoes: text("observacoes"),
  anexos: text("anexos"), // JSON array de URLs de anexos
  
  // Metadados
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Pendencia = typeof pendencias.$inferSelect;
export type InsertPendencia = typeof pendencias.$inferInsert;

// ============================================================================
// TABELAS DE TESTES GERIÁTRICOS
// ============================================================================

/**
 * Pacientes - Cadastro de pacientes para testes geriátricos
 */
export const geriatricPatients = mysqlTable("geriatricPatients", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  dataNascimento: date("dataNascimento").notNull(),
  cpf: varchar("cpf", { length: 14 }).unique(),
  rg: varchar("rg", { length: 20 }),
  sexo: mysqlEnum("sexo", ["masculino", "feminino", "outro"]),
  
  // Contato
  telefone: varchar("telefone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  endereco: text("endereco"),
  
  // Informações médicas
  escolaridade: mysqlEnum("escolaridade", ["analfabeto", "fundamental_incompleto", "fundamental_completo", "medio_incompleto", "medio_completo", "superior_incompleto", "superior_completo", "pos_graduacao"]),
  historicoMedico: text("historicoMedico"),
  medicamentosEmUso: text("medicamentosEmUso"),
  
  // Responsável
  nomeResponsavel: varchar("nomeResponsavel", { length: 255 }),
  telefoneResponsavel: varchar("telefoneResponsavel", { length: 20 }),
  parentescoResponsavel: varchar("parentescoResponsavel", { length: 100 }),
  
  // Status
  ativo: boolean("ativo").default(true).notNull(),
  observacoes: text("observacoes"),
  
  // Metadados
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GeriatricPatient = typeof geriatricPatients.$inferSelect;
export type InsertGeriatricPatient = typeof geriatricPatients.$inferInsert;

/**
 * Teste de Katz - Avaliação de Atividades Básicas de Vida Diária (AVD)
 */
export const katzTests = mysqlTable("katzTests", {
  id: int("id").autoincrement().primaryKey(),
  pacienteId: int("pacienteId").notNull(),
  dataAvaliacao: datetime("dataAvaliacao").notNull(),
  
  // 6 atividades (0 = dependente, 1 = independente)
  banho: int("banho").notNull(), // 0 ou 1
  vestir: int("vestir").notNull(),
  higienePessoal: int("higienePessoal").notNull(),
  transferencia: int("transferencia").notNull(),
  continencia: int("continencia").notNull(),
  alimentacao: int("alimentacao").notNull(),
  
  // Pontuação total (0-6)
  pontuacaoTotal: int("pontuacaoTotal").notNull(),
  
  // Classificação
  classificacao: mysqlEnum("classificacao", ["independente", "dependencia_parcial", "dependencia_total"]).notNull(),
  
  // Observações
  observacoes: text("observacoes"),
  
  // Metadados
  avaliadorId: int("avaliadorId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KatzTest = typeof katzTests.$inferSelect;
export type InsertKatzTest = typeof katzTests.$inferInsert;

/**
 * Teste de Lawton - Avaliação de Atividades Instrumentais de Vida Diária (AIVD)
 */
export const lawtonTests = mysqlTable("lawtonTests", {
  id: int("id").autoincrement().primaryKey(),
  pacienteId: int("pacienteId").notNull(),
  dataAvaliacao: datetime("dataAvaliacao").notNull(),
  
  // 8 atividades (0 = dependente, 1 = independente)
  usarTelefone: int("usarTelefone").notNull(),
  fazerCompras: int("fazerCompras").notNull(),
  prepararRefeicoes: int("prepararRefeicoes").notNull(),
  cuidarCasa: int("cuidarCasa").notNull(),
  lavarRoupa: int("lavarRoupa").notNull(),
  usarTransporte: int("usarTransporte").notNull(),
  controlarMedicacao: int("controlarMedicacao").notNull(),
  controlarFinancas: int("controlarFinancas").notNull(),
  
  // Pontuação total (0-8)
  pontuacaoTotal: int("pontuacaoTotal").notNull(),
  
  // Classificação
  classificacao: mysqlEnum("classificacao", ["independente", "dependencia_parcial", "dependencia_total"]).notNull(),
  
  // Observações
  observacoes: text("observacoes"),
  
  // Metadados
  avaliadorId: int("avaliadorId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LawtonTest = typeof lawtonTests.$inferSelect;
export type InsertLawtonTest = typeof lawtonTests.$inferInsert;

/**
 * Minimental - Avaliação Cognitiva (MEEM)
 */
export const miniMentalTests = mysqlTable("miniMentalTests", {
  id: int("id").autoincrement().primaryKey(),
  pacienteId: int("pacienteId").notNull(),
  dataAvaliacao: datetime("dataAvaliacao").notNull(),
  
  // Orientação Temporal (5 pontos)
  orientacaoTemporal: int("orientacaoTemporal").notNull(),
  
  // Orientação Espacial (5 pontos)
  orientacaoEspacial: int("orientacaoEspacial").notNull(),
  
  // Memória Imediata (3 pontos)
  memoriaImediata: int("memoriaImediata").notNull(),
  
  // Atenção e Cálculo (5 pontos)
  atencaoCalculo: int("atencaoCalculo").notNull(),
  
  // Evocação (3 pontos)
  evocacao: int("evocacao").notNull(),
  
  // Linguagem (8 pontos)
  linguagem: int("linguagem").notNull(),
  
  // Praxia Construtiva (1 ponto)
  praxiaConstrutiva: int("praxiaConstrutiva").notNull(),
  
  // Pontuação total (0-30)
  pontuacaoTotal: int("pontuacaoTotal").notNull(),
  
  // Classificação ajustada por escolaridade
  classificacao: mysqlEnum("classificacao", ["normal", "comprometimento_leve", "comprometimento_moderado", "comprometimento_grave"]).notNull(),
  
  // Observações
  observacoes: text("observacoes"),
  
  // Metadados
  avaliadorId: int("avaliadorId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MiniMentalTest = typeof miniMentalTests.$inferSelect;
export type InsertMiniMentalTest = typeof miniMentalTests.$inferInsert;

/**
 * Escala de Depressão Geriátrica (GDS-15)
 */
export const gdsTests = mysqlTable("gdsTests", {
  id: int("id").autoincrement().primaryKey(),
  pacienteId: int("pacienteId").notNull(),
  dataAvaliacao: datetime("dataAvaliacao").notNull(),
  
  // 15 perguntas (0 = não, 1 = sim) - algumas invertidas
  q1_satisfeitoVida: int("q1_satisfeitoVida").notNull(),
  q2_abandonouAtividades: int("q2_abandonouAtividades").notNull(),
  q3_vidaVazia: int("q3_vidaVazia").notNull(),
  q4_aborrece: int("q4_aborrece").notNull(),
  q5_bomHumor: int("q5_bomHumor").notNull(),
  q6_medoCoisaRuim: int("q6_medoCoisaRuim").notNull(),
  q7_felizMaiorTempo: int("q7_felizMaiorTempo").notNull(),
  q8_desamparado: int("q8_desamparado").notNull(),
  q9_prefereFicarCasa: int("q9_prefereFicarCasa").notNull(),
  q10_problemasMemoria: int("q10_problemasMemoria").notNull(),
  q11_bomEstarVivo: int("q11_bomEstarVivo").notNull(),
  q12_inutil: int("q12_inutil").notNull(),
  q13_cheioEnergia: int("q13_cheioEnergia").notNull(),
  q14_situacaoSemEsperanca: int("q14_situacaoSemEsperanca").notNull(),
  q15_outrosMelhorSituacao: int("q15_outrosMelhorSituacao").notNull(),
  
  // Pontuação total (0-15)
  pontuacaoTotal: int("pontuacaoTotal").notNull(),
  
  // Classificação
  classificacao: mysqlEnum("classificacao", ["normal", "depressao_leve", "depressao_grave"]).notNull(),
  
  // Observações
  observacoes: text("observacoes"),
  
  // Metadados
  avaliadorId: int("avaliadorId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GDSTest = typeof gdsTests.$inferSelect;
export type InsertGDSTest = typeof gdsTests.$inferInsert;

/**
 * Teste do Relógio
 */
export const clockTests = mysqlTable("clockTests", {
  id: int("id").autoincrement().primaryKey(),
  pacienteId: int("pacienteId").notNull(),
  dataAvaliacao: datetime("dataAvaliacao").notNull(),
  
  // URL da imagem do desenho do relógio
  imagemUrl: varchar("imagemUrl", { length: 512 }),
  
  // Pontuação (0-10 pontos)
  // Critérios: círculo, números, ponteiros, hora correta
  pontuacaoCirculo: int("pontuacaoCirculo").notNull(), // 0-2
  pontuacaoNumeros: int("pontuacaoNumeros").notNull(), // 0-4
  pontuacaoPonteiros: int("pontuacaoPonteiros").notNull(), // 0-4
  
  // Pontuação total (0-10)
  pontuacaoTotal: int("pontuacaoTotal").notNull(),
  
  // Classificação
  classificacao: mysqlEnum("classificacao", ["normal", "comprometimento_leve", "comprometimento_moderado", "comprometimento_grave"]).notNull(),
  
  // Observações
  observacoes: text("observacoes"),
  
  // Metadados
  avaliadorId: int("avaliadorId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClockTest = typeof clockTests.$inferSelect;
export type InsertClockTest = typeof clockTests.$inferInsert;

/**
 * Fila de E-mails - Sistema robusto de envio com retry
 */
export const emailQueue = mysqlTable("emailQueue", {
  id: int("id").autoincrement().primaryKey(),
  destinatario: varchar("destinatario", { length: 320 }).notNull(),
  assunto: varchar("assunto", { length: 500 }).notNull(),
  corpo: text("corpo").notNull(),
  tipoEmail: varchar("tipoEmail", { length: 100 }).notNull(),
  prioridade: mysqlEnum("prioridade", ["baixa", "normal", "alta", "urgente"]).default("normal").notNull(),
  status: mysqlEnum("status", ["pendente", "enviando", "enviado", "falhou", "cancelado"]).default("pendente").notNull(),
  tentativas: int("tentativas").default(0).notNull(),
  maxTentativas: int("maxTentativas").default(3).notNull(),
  proximaTentativa: datetime("proximaTentativa"),
  erroMensagem: text("erroMensagem"),
  metadados: text("metadados"),
  enviadoEm: datetime("enviadoEm"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailQueue = typeof emailQueue.$inferSelect;
export type InsertEmailQueue = typeof emailQueue.$inferInsert;

/**
 * Logs de E-mails - Histórico detalhado de todos os envios
 */
export const emailLogs = mysqlTable("emailLogs", {
  id: int("id").autoincrement().primaryKey(),
  emailQueueId: int("emailQueueId"),
  destinatario: varchar("destinatario", { length: 320 }).notNull(),
  assunto: varchar("assunto", { length: 500 }).notNull(),
  tipoEmail: varchar("tipoEmail", { length: 100 }).notNull(),
  status: mysqlEnum("status", ["sucesso", "falha", "bounce", "spam"]).notNull(),
  tentativa: int("tentativa").notNull(),
  erroMensagem: text("erroMensagem"),
  tempoResposta: int("tempoResposta"),
  smtpResponse: text("smtpResponse"),
  metadados: text("metadados"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;

// ============================================================================
// ONDAS 1, 2 E 3 - PROCESSOS AVALIATIVOS E FORMULÁRIOS DINÂMICOS
// ============================================================================

/**
 * Processos Avaliativos - Onda 1
 * Gerencia processos completos de avaliação com configurações e períodos
 */
export const evaluationProcesses = mysqlTable("evaluationProcesses", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Tipo de processo
  type: mysqlEnum("type", ["360", "180", "90", "autoavaliacao", "gestor", "pares", "subordinados"]).notNull(),
  
  // Status do processo
  status: mysqlEnum("status", ["rascunho", "em_andamento", "concluido", "cancelado"]).default("rascunho").notNull(),
  
  // Períodos
  startDate: datetime("startDate").notNull(),
  endDate: datetime("endDate").notNull(),
  
  // Configurações
  allowSelfEvaluation: boolean("allowSelfEvaluation").default(true).notNull(),
  allowManagerEvaluation: boolean("allowManagerEvaluation").default(true).notNull(),
  allowPeerEvaluation: boolean("allowPeerEvaluation").default(false).notNull(),
  allowSubordinateEvaluation: boolean("allowSubordinateEvaluation").default(false).notNull(),
  
  // Número de avaliadores
  minPeerEvaluators: int("minPeerEvaluators").default(0),
  maxPeerEvaluators: int("maxPeerEvaluators").default(5),
  minSubordinateEvaluators: int("minSubordinateEvaluators").default(0),
  maxSubordinateEvaluators: int("maxSubordinateEvaluators").default(5),
  
  // Pesos para cálculo final
  selfWeight: int("selfWeight").default(20), // %
  managerWeight: int("managerWeight").default(50), // %
  peerWeight: int("peerWeight").default(15), // %
  subordinateWeight: int("subordinateWeight").default(15), // %
  
  // Formulário associado
  formTemplateId: int("formTemplateId"),
  
  // Notificações
  sendStartNotification: boolean("sendStartNotification").default(true).notNull(),
  sendReminderNotification: boolean("sendReminderNotification").default(true).notNull(),
  reminderDaysBefore: int("reminderDaysBefore").default(3),
  sendCompletionNotification: boolean("sendCompletionNotification").default(true).notNull(),
  
  // Metadados
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: datetime("completedAt"),
});

export type EvaluationProcess = typeof evaluationProcesses.$inferSelect;
export type InsertEvaluationProcess = typeof evaluationProcesses.$inferInsert;

/**
 * Participantes de Processos Avaliativos
 * Vincula funcionários aos processos como avaliados
 */
export const processParticipants = mysqlTable("processParticipants", {
  id: int("id").autoincrement().primaryKey(),
  processId: int("processId").notNull(),
  employeeId: int("employeeId").notNull(),
  status: mysqlEnum("status", ["pendente", "em_andamento", "concluido"]).default("pendente").notNull(),
  
  // Progresso
  selfEvaluationCompleted: boolean("selfEvaluationCompleted").default(false).notNull(),
  managerEvaluationCompleted: boolean("managerEvaluationCompleted").default(false).notNull(),
  peerEvaluationsCompleted: int("peerEvaluationsCompleted").default(0),
  subordinateEvaluationsCompleted: int("subordinateEvaluationsCompleted").default(0),
  
  // Pontuações
  selfScore: int("selfScore"),
  managerScore: int("managerScore"),
  peerAverageScore: int("peerAverageScore"),
  subordinateAverageScore: int("subordinateAverageScore"),
  finalScore: int("finalScore"),
  
  // Datas
  startedAt: datetime("startedAt"),
  completedAt: datetime("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProcessParticipant = typeof processParticipants.$inferSelect;
export type InsertProcessParticipant = typeof processParticipants.$inferInsert;

/**
 * Avaliadores de Processos
 * Vincula avaliadores aos participantes
 */
export const processEvaluators = mysqlTable("processEvaluators", {
  id: int("id").autoincrement().primaryKey(),
  participantId: int("participantId").notNull(),
  evaluatorId: int("evaluatorId").notNull(),
  evaluatorType: mysqlEnum("evaluatorType", ["self", "manager", "peer", "subordinate"]).notNull(),
  status: mysqlEnum("status", ["pendente", "em_andamento", "concluido"]).default("pendente").notNull(),
  
  // Pontuação
  score: int("score"),
  comments: text("comments"),
  
  // Datas
  notifiedAt: datetime("notifiedAt"),
  startedAt: datetime("startedAt"),
  completedAt: datetime("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProcessEvaluator = typeof processEvaluators.$inferSelect;
export type InsertProcessEvaluator = typeof processEvaluators.$inferInsert;

/**
 * Templates de Formulários - Onda 2
 * Biblioteca de templates reutilizáveis
 */
export const formTemplates = mysqlTable("formTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  
  // Tipo de formulário
  type: mysqlEnum("type", ["avaliacao_desempenho", "feedback", "competencias", "metas", "pdi", "outro"]).notNull(),
  
  // Status
  isPublic: boolean("isPublic").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  
  // Configurações
  allowComments: boolean("allowComments").default(true).notNull(),
  allowAttachments: boolean("allowAttachments").default(false).notNull(),
  requireAllQuestions: boolean("requireAllQuestions").default(true).notNull(),
  
  // Metadados
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  usageCount: int("usageCount").default(0),
});

export type FormTemplate = typeof formTemplates.$inferSelect;
export type InsertFormTemplate = typeof formTemplates.$inferInsert;

/**
 * Seções de Formulários
 * Organiza questões em seções/dimensões
 */
export const formSections = mysqlTable("formSections", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  order: int("order").notNull(),
  weight: int("weight").default(1).notNull(), // Peso para cálculo final
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FormSection = typeof formSections.$inferSelect;
export type InsertFormSection = typeof formSections.$inferInsert;

/**
 * Questões de Formulários Dinâmicos
 * Suporta múltiplos tipos de questões
 */
export const formQuestions = mysqlTable("formQuestions", {
  id: int("id").autoincrement().primaryKey(),
  sectionId: int("sectionId").notNull(),
  question: text("question").notNull(),
  description: text("description"),
  
  // Tipo de questão
  type: mysqlEnum("type", [
    "escala",           // Escala numérica (1-5, 1-10)
    "multipla_escolha", // Múltipla escolha
    "texto_curto",      // Texto curto (input)
    "texto_longo",      // Texto longo (textarea)
    "matriz",           // Matriz de avaliação
    "sim_nao",          // Sim/Não
    "data",             // Data
    "numero"            // Número
  ]).notNull(),
  
  // Configurações por tipo
  scaleMin: int("scaleMin").default(1),
  scaleMax: int("scaleMax").default(5),
  scaleMinLabel: varchar("scaleMinLabel", { length: 100 }),
  scaleMaxLabel: varchar("scaleMaxLabel", { length: 100 }),
  
  // Opções (JSON) para múltipla escolha ou matriz
  options: text("options"), // [{"value": "opt1", "label": "Opção 1"}]
  
  // Validações
  required: boolean("required").default(true).notNull(),
  minLength: int("minLength"),
  maxLength: int("maxLength"),
  
  // Peso e ordem
  weight: int("weight").default(1).notNull(),
  order: int("order").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FormQuestion = typeof formQuestions.$inferSelect;
export type InsertFormQuestion = typeof formQuestions.$inferInsert;

/**
 * Respostas de Formulários Dinâmicos
 * Armazena respostas de avaliações
 */
export const formResponses = mysqlTable("formResponses", {
  id: int("id").autoincrement().primaryKey(),
  processId: int("processId"),
  participantId: int("participantId"),
  evaluatorId: int("evaluatorId").notNull(),
  questionId: int("questionId").notNull(),
  
  // Tipo de resposta
  responseType: mysqlEnum("responseType", ["number", "text", "json"]).notNull(),
  
  // Valores
  numberValue: int("numberValue"),
  textValue: text("textValue"),
  jsonValue: text("jsonValue"), // Para respostas complexas (matriz, múltipla escolha)
  
  // Metadados
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FormResponse = typeof formResponses.$inferSelect;
export type InsertFormResponse = typeof formResponses.$inferInsert;

/**
 * Comentários em Avaliações de Processos
 * Permite comentários em questões ou seções
 */
export const processEvaluationComments = mysqlTable("processEvaluationComments", {
  id: int("id").autoincrement().primaryKey(),
  processId: int("processId"),
  participantId: int("participantId"),
  evaluatorId: int("evaluatorId").notNull(),
  questionId: int("questionId"),
  sectionId: int("sectionId"),
  comment: text("comment").notNull(),
  isPrivate: boolean("isPrivate").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProcessEvaluationComment = typeof processEvaluationComments.$inferSelect;
export type InsertProcessEvaluationComment = typeof processEvaluationComments.$inferInsert;

/**
 * Anexos de Avaliações
 * Permite anexar documentos/evidências
 */
export const evaluationAttachments = mysqlTable("evaluationAttachments", {
  id: int("id").autoincrement().primaryKey(),
  processId: int("processId"),
  participantId: int("participantId"),
  evaluatorId: int("evaluatorId").notNull(),
  questionId: int("questionId"),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 512 }).notNull(),
  fileSize: int("fileSize"),
  mimeType: varchar("mimeType", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EvaluationAttachment = typeof evaluationAttachments.$inferSelect;
export type InsertEvaluationAttachment = typeof evaluationAttachments.$inferInsert;

/**
 * Relatórios Consolidados - Onda 3
 * Armazena relatórios gerados para cache e histórico
 */
export const consolidatedReports = mysqlTable("consolidatedReports", {
  id: int("id").autoincrement().primaryKey(),
  processId: int("processId"),
  reportType: mysqlEnum("reportType", [
    "individual",
    "equipe",
    "departamento",
    "empresa",
    "comparativo",
    "evolucao",
    "gaps",
    "nine_box",
    "sucessao"
  ]).notNull(),
  
  // Filtros aplicados
  filters: text("filters"), // JSON com filtros
  
  // Dados do relatório
  data: text("data").notNull(), // JSON com dados processados
  
  // Metadados
  generatedBy: int("generatedBy").notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  expiresAt: datetime("expiresAt"),
});

export type ConsolidatedReport = typeof consolidatedReports.$inferSelect;
export type InsertConsolidatedReport = typeof consolidatedReports.$inferInsert;

/**
 * Histórico de Exportações
 * Rastreia exportações de relatórios
 */
export const reportExports = mysqlTable("reportExports", {
  id: int("id").autoincrement().primaryKey(),
  reportId: int("reportId"),
  processId: int("processId"),
  exportType: mysqlEnum("exportType", ["pdf", "excel", "csv", "json"]).notNull(),
  fileUrl: varchar("fileUrl", { length: 512 }),
  status: mysqlEnum("status", ["processando", "concluido", "falhou"]).default("processando").notNull(),
  exportedBy: int("exportedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReportExport = typeof reportExports.$inferSelect;
export type InsertReportExport = typeof reportExports.$inferInsert;

// Re-export from schema-productivity.ts
export * from "./schema-productivity";


// ============================================================================
// TABELA DE HIERARQUIA ORGANIZACIONAL
// ============================================================================

/**
 * Hierarquia Organizacional dos Funcionários
 * Armazena os vínculos hierárquicos entre funcionários e seus líderes em múltiplos níveis
 * Baseado na estrutura: Funcionário -> Coordenador -> Gestor -> Diretor -> Presidente
 */
export const employeeHierarchy = mysqlTable("employeeHierarchy", {
  id: int("id").autoincrement().primaryKey(),
  
  // Funcionário
  employeeId: int("employeeId").notNull(), // ID do funcionário na tabela employees
  employeeChapa: varchar("employeeChapa", { length: 50 }).notNull(), // Chapa do funcionário
  employeeName: varchar("employeeName", { length: 255 }).notNull(),
  employeeEmail: varchar("employeeEmail", { length: 320 }),
  employeeFunction: varchar("employeeFunction", { length: 255 }), // Função do funcionário
  employeeFunctionCode: varchar("employeeFunctionCode", { length: 50 }), // Código da função
  employeeSection: varchar("employeeSection", { length: 255 }), // Seção do funcionário
  employeeSectionCode: varchar("employeeSectionCode", { length: 100 }), // Código da seção
  
  // Nível 1 - Coordenador
  coordinatorChapa: varchar("coordinatorChapa", { length: 50 }),
  coordinatorName: varchar("coordinatorName", { length: 255 }),
  coordinatorFunction: varchar("coordinatorFunction", { length: 255 }),
  coordinatorEmail: varchar("coordinatorEmail", { length: 320 }),
  coordinatorId: int("coordinatorId"), // ID do coordenador na tabela employees (se existir)
  
  // Nível 2 - Gestor
  managerChapa: varchar("managerChapa", { length: 50 }),
  managerName: varchar("managerName", { length: 255 }),
  managerFunction: varchar("managerFunction", { length: 255 }),
  managerEmail: varchar("managerEmail", { length: 320 }),
  managerId: int("managerId"), // ID do gestor na tabela employees (se existir)
  
  // Nível 3 - Diretor
  directorChapa: varchar("directorChapa", { length: 50 }),
  directorName: varchar("directorName", { length: 255 }),
  directorFunction: varchar("directorFunction", { length: 255 }),
  directorEmail: varchar("directorEmail", { length: 320 }),
  directorId: int("directorId"), // ID do diretor na tabela employees (se existir)
  
  // Nível 4 - Presidente
  presidentChapa: varchar("presidentChapa", { length: 50 }),
  presidentName: varchar("presidentName", { length: 255 }),
  presidentFunction: varchar("presidentFunction", { length: 255 }),
  presidentEmail: varchar("presidentEmail", { length: 320 }),
  presidentId: int("presidentId"), // ID do presidente na tabela employees (se existir)
  
  // Metadados
  importedAt: timestamp("importedAt").defaultNow().notNull(), // Data da importação
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  
  // Índices para performance
  // Adicionar índices nas colunas de chapa para buscas rápidas
});

export type EmployeeHierarchy = typeof employeeHierarchy.$inferSelect;
export type InsertEmployeeHierarchy = typeof employeeHierarchy.$inferInsert;
