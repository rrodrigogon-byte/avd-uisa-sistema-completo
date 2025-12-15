import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  datetime,
  decimal,
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
  
  // Validação de Testes
  testsValidated: boolean("testsValidated").default(false).notNull(),
  testsValidatedAt: datetime("testsValidatedAt"),
  testsValidatedBy: int("testsValidatedBy"),
  
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
    "imediato",
    "1_ano",
    "2_3_anos",
    "mais_3_anos"
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
  
  // Validação pelo gestor
  validationStatus: mysqlEnum("validationStatus", ["pendente", "aprovado", "reprovado"]).default("pendente").notNull(),
  validatedBy: int("validatedBy"), // ID do gestor que validou
  validatedAt: datetime("validatedAt"),
  validationComments: text("validationComments"), // Comentários do gestor
  
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
 * Hierarquia de Liderança - Estrutura organizacional completa
 * Permite queries hierárquicas eficientes usando path-based queries
 */
export const leadershipHierarchy = mysqlTable("leadershipHierarchy", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  managerId: int("managerId"), // Líder imediato (null para CEO/Diretor)
  managerName: varchar("managerName", { length: 255 }),
  level: int("level").notNull(), // 1=Diretor, 2=Gerente, 3=Coordenador, 4=Supervisor, 5=Operacional
  path: varchar("path", { length: 500 }), // Caminho completo na hierarquia (ex: "1/5/23/45")
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LeadershipHierarchy = typeof leadershipHierarchy.$inferSelect;
export type InsertLeadershipHierarchy = typeof leadershipHierarchy.$inferInsert;

/**
 * Aprovações de Descrição de Cargo - Workflow 4 níveis obrigatórios
 * Fluxo: Líder Imediato → Alexsandra Oliveira (RH C&S) → André (Gerente RH) → Rodrigo (Diretor)
 */
export const jobDescriptionApprovals = mysqlTable("jobDescriptionApprovals", {
  id: int("id").autoincrement().primaryKey(),
  jobDescriptionId: int("jobDescriptionId").notNull(),
  
  // Nível 1: Líder Imediato
  level1ApproverId: int("level1ApproverId").notNull(),
  level1ApproverName: varchar("level1ApproverName", { length: 255 }),
  level1Status: mysqlEnum("level1Status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  level1Comments: text("level1Comments"),
  level1ApprovedAt: datetime("level1ApprovedAt"),
  
  // Nível 2: Alexsandra Oliveira (RH Cargos e Salários)
  level2ApproverId: int("level2ApproverId").notNull(),
  level2ApproverName: varchar("level2ApproverName", { length: 255 }),
  level2Status: mysqlEnum("level2Status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  level2Comments: text("level2Comments"),
  level2ApprovedAt: datetime("level2ApprovedAt"),
  
  // Nível 3: André (Gerente de RH)
  level3ApproverId: int("level3ApproverId").notNull(),
  level3ApproverName: varchar("level3ApproverName", { length: 255 }),
  level3Status: mysqlEnum("level3Status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  level3Comments: text("level3Comments"),
  level3ApprovedAt: datetime("level3ApprovedAt"),
  
  // Nível 4: Rodrigo Ribeiro Gonçalves (Diretor)
  level4ApproverId: int("level4ApproverId").notNull(),
  level4ApproverName: varchar("level4ApproverName", { length: 255 }),
  level4Status: mysqlEnum("level4Status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  level4Comments: text("level4Comments"),
  level4ApprovedAt: datetime("level4ApprovedAt"),
  
  // Controle do workflow
  currentLevel: int("currentLevel").default(1).notNull(), // Nível atual de aprovação (1-4)
  overallStatus: mysqlEnum("overallStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
  
  // Auditoria
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: datetime("completedAt"), // Data de conclusão do workflow completo
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

// ============================================================================
// TABELAS DE PIR COM VÍDEO E DETECÇÃO DE FRAUDES
// ============================================================================

/**
 * PIR Assessments - Avaliações do Plano Individual de Resultados
 * Armazena as avaliações PIR incluindo vídeos gravados
 */
export const pirAssessments = mysqlTable("pirAssessments", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  cycleId: int("cycleId"), // Ciclo de avaliação (se aplicável)
  
  // Dados da avaliação
  assessmentDate: datetime("assessmentDate").notNull(),
  status: mysqlEnum("status", ["pendente", "em_andamento", "concluida", "cancelada"]).default("pendente").notNull(),
  
  // Vídeo
  videoUrl: varchar("videoUrl", { length: 512 }), // URL do vídeo no S3
  videoKey: varchar("videoKey", { length: 512 }), // Chave do arquivo no S3
  videoDuration: int("videoDuration"), // Duração em segundos
  videoRecordedAt: datetime("videoRecordedAt"),
  
  // Resultados da avaliação
  overallScore: int("overallScore"), // Pontuação geral (0-100)
  comments: text("comments"),
  evaluatorId: int("evaluatorId"), // Quem avaliou
  
  // Metadados
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: datetime("completedAt"),
});

export type PirAssessment = typeof pirAssessments.$inferSelect;
export type InsertPirAssessment = typeof pirAssessments.$inferInsert;

/**
 * Video Metadata - Metadados de validação de vídeos
 * Armazena dados de detecção de fraudes e validações
 */
export const videoMetadata = mysqlTable("videoMetadata", {
  id: int("id").autoincrement().primaryKey(),
  pirAssessmentId: int("pirAssessmentId").notNull(), // Referência ao PIR
  
  // Validações de face
  facesDetected: boolean("facesDetected").default(false).notNull(), // Face detectada?
  multipleFacesDetected: boolean("multipleFacesDetected").default(false).notNull(), // Múltiplas faces?
  noFaceDetected: boolean("noFaceDetected").default(false).notNull(), // Ausência de face?
  personChanged: boolean("personChanged").default(false).notNull(), // Mudança de pessoa?
  
  // Estatísticas
  totalFramesAnalyzed: int("totalFramesAnalyzed").default(0), // Total de frames analisados
  framesWithFace: int("framesWithFace").default(0), // Frames com face detectada
  framesWithMultipleFaces: int("framesWithMultipleFaces").default(0), // Frames com múltiplas faces
  framesWithNoFace: int("framesWithNoFace").default(0), // Frames sem face
  
  // Timestamps de alertas (JSON array)
  multipleFacesTimestamps: json("multipleFacesTimestamps").$type<number[]>(), // [10.5, 45.2, ...]
  noFaceTimestamps: json("noFaceTimestamps").$type<number[]>(), // [5.1, 30.8, ...]
  personChangeTimestamps: json("personChangeTimestamps").$type<number[]>(), // [20.3, ...]
  
  // Descritores faciais para comparação
  faceDescriptors: json("faceDescriptors").$type<any[]>(), // Array de descritores ao longo do vídeo
  
  // Validação geral
  validationPassed: boolean("validationPassed").default(false).notNull(), // Passou na validação?
  validationScore: int("validationScore"), // Pontuação de validação (0-100)
  validationNotes: text("validationNotes"), // Observações da validação
  
  // Metadados
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VideoMetadata = typeof videoMetadata.$inferSelect;
export type InsertVideoMetadata = typeof videoMetadata.$inferInsert;

/**
 * PIR Questions - Perguntas do PIR
 * Armazena as perguntas que compõem o PIR
 */
export const pirQuestions = mysqlTable("pirQuestions", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId"), // Ciclo específico ou null para padrão
  
  // Dados da pergunta
  questionText: text("questionText").notNull(),
  questionType: mysqlEnum("questionType", ["texto", "multipla_escolha", "escala", "sim_nao"]).notNull(),
  questionCategory: varchar("questionCategory", { length: 100 }), // Ex: "Metas", "Competências"
  
  // Opções (para múltipla escolha)
  options: json("options").$type<string[]>(), // ["Opção 1", "Opção 2", ...]
  
  // Escala (para tipo escala)
  scaleMin: int("scaleMin"), // Ex: 1
  scaleMax: int("scaleMax"), // Ex: 5
  scaleLabels: json("scaleLabels").$type<string[]>(), // ["Ruim", "Regular", "Bom", "Muito Bom", "Excelente"]
  
  // Configurações
  required: boolean("required").default(true).notNull(),
  order: int("order").default(0), // Ordem de exibição
  active: boolean("active").default(true).notNull(),
  
  // Metadados
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PirQuestion = typeof pirQuestions.$inferSelect;
export type InsertPirQuestion = typeof pirQuestions.$inferInsert;

/**
 * PIR Answers - Respostas do PIR
 * Armazena as respostas dadas pelos funcionários
 */
export const pirAnswers = mysqlTable("pirAnswers", {
  id: int("id").autoincrement().primaryKey(),
  pirAssessmentId: int("pirAssessmentId").notNull(),
  questionId: int("questionId").notNull(),
  
  // Resposta
  answerText: text("answerText"), // Para perguntas de texto
  answerOption: varchar("answerOption", { length: 255 }), // Para múltipla escolha
  answerScale: int("answerScale"), // Para escala
  answerBoolean: boolean("answerBoolean"), // Para sim/não
  
  // Metadados
  answeredAt: datetime("answeredAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PirAnswer = typeof pirAnswers.$inferSelect;
export type InsertPirAnswer = typeof pirAnswers.$inferInsert;

/**
 * PIR Invitations - Convites para responder PIR
 * Permite envio de PIR para funcionários e candidatos externos via link único
 */
export const pirInvitations = mysqlTable("pirInvitations", {
  id: int("id").autoincrement().primaryKey(),
  
  // Destinatário (funcionário OU candidato externo)
  employeeId: int("employeeId"), // Null para candidatos externos
  candidateEmail: varchar("candidateEmail", { length: 320 }),
  candidateName: varchar("candidateName", { length: 255 }),
  candidatePhone: varchar("candidatePhone", { length: 50 }),
  
  // Token único para acesso
  token: varchar("token", { length: 255 }).notNull().unique(),
  
  // Status do convite
  status: mysqlEnum("status", ["pending", "sent", "in_progress", "completed", "expired"]).default("pending").notNull(),
  
  // Controle de validade
  expiresAt: datetime("expiresAt").notNull(),
  sentAt: datetime("sentAt"),
  startedAt: datetime("startedAt"), // Quando começou a responder
  completedAt: datetime("completedAt"),
  
  // Vínculo com avaliação PIR (após conclusão)
  pirAssessmentId: int("pirAssessmentId"),
  
  // Metadados
  createdBy: int("createdBy").notNull(),
  createdByName: varchar("createdByName", { length: 255 }),
  purpose: varchar("purpose", { length: 255 }), // Ex: "Processo Seletivo", "Avaliação Anual"
  notes: text("notes"), // Observações internas
  
  // Auditoria
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PirInvitation = typeof pirInvitations.$inferSelect;
export type InsertPirInvitation = typeof pirInvitations.$inferInsert;

// ============================================================================
// TABELAS DE ANEXOS E DOCUMENTOS
// ============================================================================

/**
 * Employee Attachments - Anexos dos funcionários
 * Armazena documentos, certificados, fotos e outros arquivos dos funcionários
 */
export const employeeAttachments = mysqlTable("employeeAttachments", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  
  // Dados do arquivo
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 512 }).notNull(), // URL do arquivo no S3
  fileKey: varchar("fileKey", { length: 512 }).notNull(), // Chave do arquivo no S3
  fileType: varchar("fileType", { length: 100 }).notNull(), // MIME type
  fileSize: int("fileSize").notNull(), // Tamanho em bytes
  
  // Categorização
  category: mysqlEnum("category", [
    "certificado",
    "documento",
    "foto",
    "curriculo",
    "diploma",
    "comprovante",
    "contrato",
    "outro"
  ]).notNull(),
  description: text("description"),
  
  // Controle de acesso
  isPublic: boolean("isPublic").default(false).notNull(), // Visível para todos?
  visibleToEmployee: boolean("visibleToEmployee").default(true).notNull(),
  visibleToManager: boolean("visibleToManager").default(true).notNull(),
  visibleToHR: boolean("visibleToHR").default(true).notNull(),
  
  // Metadados
  uploadedBy: int("uploadedBy").notNull(),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deletedAt: datetime("deletedAt"), // Soft delete
});

export type EmployeeAttachment = typeof employeeAttachments.$inferSelect;
export type InsertEmployeeAttachment = typeof employeeAttachments.$inferInsert;

// ============================================================================
// TABELAS DE VALIDAÇÃO FACIAL E ANÁLISE DE VÍDEO
// ============================================================================

/**
 * Employee Face Profiles - Perfis faciais dos funcionários
 * Armazena dados de reconhecimento facial para validação de identidade
 */
export const employeeFaceProfiles = mysqlTable("employeeFaceProfiles", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull().unique(), // Um perfil por funcionário
  
  // Dados da foto de referência
  referencePhotoUrl: varchar("referencePhotoUrl", { length: 512 }).notNull(),
  referencePhotoKey: varchar("referencePhotoKey", { length: 512 }).notNull(),
  
  // Descritores faciais (JSON com dados do reconhecimento facial)
  faceDescriptor: text("faceDescriptor").notNull(), // JSON com descritores
  faceEncoding: text("faceEncoding"), // Encoding adicional se necessário
  
  // Qualidade da foto
  photoQuality: mysqlEnum("photoQuality", ["baixa", "media", "alta", "excelente"]).default("media"),
  confidenceScore: int("confidenceScore"), // 0-100
  
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  verifiedBy: int("verifiedBy"), // Quem verificou o perfil
  verifiedAt: datetime("verifiedAt"),
  
  // Metadados
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmployeeFaceProfile = typeof employeeFaceProfiles.$inferSelect;
export type InsertEmployeeFaceProfile = typeof employeeFaceProfiles.$inferInsert;

/**
 * Video Analyses - Análises de vídeo PIR com IA
 * Armazena resultados detalhados de análise de vídeos PIR
 */
export const videoAnalyses = mysqlTable("videoAnalyses", {
  id: int("id").autoincrement().primaryKey(),
  pirAssessmentId: int("pirAssessmentId").notNull(),
  employeeId: int("employeeId").notNull(),
  
  // Validação de identidade facial
  faceValidationStatus: mysqlEnum("faceValidationStatus", [
    "pendente",
    "validado",
    "falhou",
    "sem_perfil",
    "multiplas_faces",
    "face_nao_detectada"
  ]).default("pendente").notNull(),
  faceMatchScore: int("faceMatchScore"), // 0-100 (similaridade com foto de referência)
  faceValidationTimestamp: datetime("faceValidationTimestamp"),
  faceValidationDetails: text("faceValidationDetails"), // JSON com detalhes
  
  // Análise de comportamento e linguagem corporal
  eyeContactScore: int("eyeContactScore"), // 0-100
  confidenceScore: int("confidenceScore"), // 0-100
  clarityScore: int("clarityScore"), // 0-100 (clareza da fala)
  enthusiasmScore: int("enthusiasmScore"), // 0-100
  
  // Análise de conteúdo (transcrição e análise semântica)
  transcription: text("transcription"), // Transcrição completa do áudio
  keyPoints: text("keyPoints"), // JSON com pontos-chave identificados
  sentimentAnalysis: text("sentimentAnalysis"), // JSON com análise de sentimento
  
  // Competências identificadas
  competenciesDetected: text("competenciesDetected"), // JSON com competências
  strengthsIdentified: text("strengthsIdentified"), // JSON com pontos fortes
  areasForImprovement: text("areasForImprovement"), // JSON com áreas de melhoria
  
  // Pontuação geral
  overallScore: int("overallScore"), // 0-100
  aiConfidence: int("aiConfidence"), // 0-100 (confiança da IA na análise)
  
  // Status da análise
  analysisStatus: mysqlEnum("analysisStatus", [
    "pendente",
    "processando",
    "concluida",
    "erro",
    "cancelada"
  ]).default("pendente").notNull(),
  errorMessage: text("errorMessage"),
  
  // Notificações
  notificationSent: boolean("notificationSent").default(false).notNull(),
  notificationSentAt: datetime("notificationSentAt"),
  notifiedUsers: text("notifiedUsers"), // JSON com IDs dos usuários notificados
  
  // Metadados
  analyzedBy: int("analyzedBy"), // ID do sistema ou usuário que iniciou análise
  analyzedAt: datetime("analyzedAt"),
  processingTimeSeconds: int("processingTimeSeconds"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VideoAnalysis = typeof videoAnalyses.$inferSelect;
export type InsertVideoAnalysis = typeof videoAnalyses.$inferInsert;

/**
 * Video Analysis History - Histórico de análises para comparação temporal
 * Permite comparar evolução do funcionário ao longo do tempo
 */
export const videoAnalysisHistory = mysqlTable("videoAnalysisHistory", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  analysisId: int("analysisId").notNull(), // Referência a videoAnalyses
  
  // Snapshot dos dados para comparação temporal
  snapshotDate: datetime("snapshotDate").notNull(),
  overallScore: int("overallScore"),
  eyeContactScore: int("eyeContactScore"),
  confidenceScore: int("confidenceScore"),
  clarityScore: int("clarityScore"),
  enthusiasmScore: int("enthusiasmScore"),
  
  // Competências no momento
  competenciesSnapshot: text("competenciesSnapshot"), // JSON
  
  // Metadados
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VideoAnalysisHistory = typeof videoAnalysisHistory.$inferSelect;
export type InsertVideoAnalysisHistory = typeof videoAnalysisHistory.$inferInsert;

/**
 * Fraud Detection Logs - Logs de detecção de fraude
 * Registra todas as tentativas de fraude detectadas
 */
export const fraudDetectionLogs = mysqlTable("fraudDetectionLogs", {
  id: int("id").autoincrement().primaryKey(),
  pirAssessmentId: int("pirAssessmentId").notNull(),
  employeeId: int("employeeId").notNull(),
  videoAnalysisId: int("videoAnalysisId"),
  
  // Tipo de fraude detectada
  fraudType: mysqlEnum("fraudType", [
    "multiplas_faces",
    "face_nao_correspondente",
    "ausencia_face",
    "mudanca_pessoa",
    "video_manipulado",
    "outro"
  ]).notNull(),
  
  // Detalhes
  description: text("description"),
  severity: mysqlEnum("severity", ["baixa", "media", "alta", "critica"]).default("media").notNull(),
  confidenceLevel: int("confidenceLevel"), // 0-100
  evidenceData: text("evidenceData"), // JSON com evidências
  
  // Ação tomada
  actionTaken: text("actionTaken"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: datetime("reviewedAt"),
  reviewNotes: text("reviewNotes"),
  
  // Status
  status: mysqlEnum("status", [
    "pendente_revisao",
    "confirmada",
    "falso_positivo",
    "resolvida"
  ]).default("pendente_revisao").notNull(),
  
  // Metadados
  detectedAt: timestamp("detectedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FraudDetectionLog = typeof fraudDetectionLogs.$inferSelect;
export type InsertFraudDetectionLog = typeof fraudDetectionLogs.$inferInsert;

// ============================================================================
// TABELAS DE RECONHECIMENTO FACIAL GCP VISION
// ============================================================================

/**
 * Face Embeddings - Embeddings faciais para reconhecimento
 * Armazena os descritores faciais gerados pelo GCP Vision API
 */
export const faceEmbeddings = mysqlTable("faceEmbeddings", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull().unique(),
  
  // Dados faciais do GCP Vision
  gcpFaceDescriptor: text("gcpFaceDescriptor").notNull(), // JSON com landmarks e features
  gcpFaceId: varchar("gcpFaceId", { length: 255 }), // ID único do GCP
  
  // Imagens de referência
  primaryPhotoUrl: varchar("primaryPhotoUrl", { length: 512 }).notNull(),
  secondaryPhotoUrl: varchar("secondaryPhotoUrl", { length: 512 }), // Foto adicional para melhor precisão
  
  // Qualidade da captura
  faceQualityScore: int("faceQualityScore"), // 0-100
  lightingQuality: mysqlEnum("lightingQuality", ["ruim", "aceitavel", "boa", "excelente"]),
  faceAngle: varchar("faceAngle", { length: 50 }), // frontal, perfil, etc
  
  // Metadados
  registeredBy: int("registeredBy").notNull(),
  registeredAt: timestamp("registeredAt").defaultNow().notNull(),
  lastValidatedAt: datetime("lastValidatedAt"),
  validationCount: int("validationCount").default(0).notNull(),
  
  // Status
  active: boolean("active").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FaceEmbedding = typeof faceEmbeddings.$inferSelect;
export type InsertFaceEmbedding = typeof faceEmbeddings.$inferInsert;

/**
 * Face Validation History - Histórico de validações faciais
 * Registra todas as tentativas de validação facial
 */
export const faceValidationHistory = mysqlTable("faceValidationHistory", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  pirAssessmentId: int("pirAssessmentId"), // Se foi durante avaliação PIR
  
  // Dados da validação
  validationPhotoUrl: varchar("validationPhotoUrl", { length: 512 }).notNull(),
  matchScore: int("matchScore").notNull(), // 0-100 (confiança da correspondência)
  matchResult: mysqlEnum("matchResult", ["sucesso", "falha", "inconclusivo"]).notNull(),
  
  // Detalhes técnicos do GCP Vision
  gcpResponseData: text("gcpResponseData"), // JSON com resposta completa do GCP
  facesDetected: int("facesDetected").default(1).notNull(),
  primaryFaceConfidence: int("primaryFaceConfidence"), // 0-100
  
  // Contexto da validação
  validationType: mysqlEnum("validationType", [
    "cadastro_inicial",
    "avaliacao_pir",
    "atualizacao_perfil",
    "verificacao_manual"
  ]).notNull(),
  
  // Resultado e ações
  approved: boolean("approved").notNull(),
  rejectionReason: text("rejectionReason"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: datetime("reviewedAt"),
  
  // Metadados
  validatedAt: timestamp("validatedAt").defaultNow().notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FaceValidationHistory = typeof faceValidationHistory.$inferSelect;
export type InsertFaceValidationHistory = typeof faceValidationHistory.$inferInsert;

// ============================================================================
// TABELAS DE ANÁLISE TEMPORAL AVANÇADA
// ============================================================================

/**
 * Temporal Analysis Configs - Configurações de análises temporais
 * Define períodos e parâmetros para análises comparativas
 */
export const temporalAnalysisConfigs = mysqlTable("temporalAnalysisConfigs", {
  id: int("id").autoincrement().primaryKey(),
  
  // Identificação
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  
  // Tipo de análise
  analysisType: mysqlEnum("analysisType", [
    "individual",
    "comparativa",
    "departamento",
    "organizacional"
  ]).notNull(),
  
  // Período de análise
  periodType: mysqlEnum("periodType", [
    "mensal",
    "trimestral",
    "semestral",
    "anual",
    "customizado"
  ]).notNull(),
  startDate: datetime("startDate").notNull(),
  endDate: datetime("endDate").notNull(),
  
  // Funcionários incluídos
  employeeIds: text("employeeIds"), // JSON array de IDs
  departmentIds: text("departmentIds"), // JSON array de departamentos
  includeAllActive: boolean("includeAllActive").default(false).notNull(),
  
  // Métricas a analisar
  metricsToAnalyze: text("metricsToAnalyze").notNull(), // JSON com métricas selecionadas
  includeGoals: boolean("includeGoals").default(true).notNull(),
  includePir: boolean("includePir").default(true).notNull(),
  include360: boolean("include360").default(true).notNull(),
  includeCompetencies: boolean("includeCompetencies").default(true).notNull(),
  
  // Configurações de comparação
  compareWithPreviousPeriod: boolean("compareWithPreviousPeriod").default(true).notNull(),
  compareWithDepartmentAvg: boolean("compareWithDepartmentAvg").default(true).notNull(),
  compareWithOrgAvg: boolean("compareWithOrgAvg").default(true).notNull(),
  
  // Limites para alertas
  significantChangeThreshold: int("significantChangeThreshold").default(15).notNull(), // % de mudança
  criticalChangeThreshold: int("criticalChangeThreshold").default(30).notNull(),
  
  // Status
  active: boolean("active").default(true).notNull(),
  
  // Metadados
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TemporalAnalysisConfig = typeof temporalAnalysisConfigs.$inferSelect;
export type InsertTemporalAnalysisConfig = typeof temporalAnalysisConfigs.$inferInsert;

/**
 * Temporal Analysis Results - Resultados de análises temporais
 * Armazena os resultados calculados das análises
 */
export const temporalAnalysisResults = mysqlTable("temporalAnalysisResults", {
  id: int("id").autoincrement().primaryKey(),
  configId: int("configId").notNull(),
  
  // Dados da análise
  analysisDate: datetime("analysisDate").notNull(),
  periodLabel: varchar("periodLabel", { length: 100 }).notNull(), // Ex: "Q1 2025"
  
  // Resultados agregados
  totalEmployeesAnalyzed: int("totalEmployeesAnalyzed").notNull(),
  averagePirScore: int("averagePirScore"),
  averageGoalCompletion: int("averageGoalCompletion"),
  average360Score: int("average360Score"),
  
  // Tendências identificadas
  trendsData: text("trendsData").notNull(), // JSON com tendências detalhadas
  significantChanges: text("significantChanges"), // JSON com mudanças significativas
  topPerformers: text("topPerformers"), // JSON com top performers
  needsAttention: text("needsAttention"), // JSON com funcionários que precisam atenção
  
  // Comparações
  previousPeriodComparison: text("previousPeriodComparison"), // JSON
  departmentComparison: text("departmentComparison"), // JSON
  organizationalComparison: text("organizationalComparison"), // JSON
  
  // Estatísticas
  improvementRate: int("improvementRate"), // % de funcionários que melhoraram
  declineRate: int("declineRate"), // % de funcionários que pioraram
  stableRate: int("stableRate"), // % de funcionários estáveis
  
  // Insights e recomendações
  insights: text("insights"), // JSON com insights gerados
  recommendations: text("recommendations"), // JSON com recomendações
  
  // Status
  status: mysqlEnum("status", [
    "processando",
    "concluido",
    "erro"
  ]).default("processando").notNull(),
  errorMessage: text("errorMessage"),
  
  // Metadados
  generatedBy: int("generatedBy"),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  processingTimeSeconds: int("processingTimeSeconds"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TemporalAnalysisResult = typeof temporalAnalysisResults.$inferSelect;
export type InsertTemporalAnalysisResult = typeof temporalAnalysisResults.$inferInsert;

/**
 * Employee Temporal Snapshots - Snapshots temporais de funcionários
 * Armazena estado do funcionário em momentos específicos para comparação
 */
export const employeeTemporalSnapshots = mysqlTable("employeeTemporalSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  analysisResultId: int("analysisResultId"),
  
  // Momento do snapshot
  snapshotDate: datetime("snapshotDate").notNull(),
  periodLabel: varchar("periodLabel", { length: 100 }).notNull(),
  
  // Dados do funcionário no momento
  positionId: int("positionId"),
  departmentId: int("departmentId"),
  
  // Métricas PIR
  pirScore: int("pirScore"),
  pirAnswers: text("pirAnswers"), // JSON com respostas
  pirCompletionDate: datetime("pirCompletionDate"),
  
  // Metas SMART
  totalGoals: int("totalGoals").default(0).notNull(),
  completedGoals: int("completedGoals").default(0).notNull(),
  goalCompletionRate: int("goalCompletionRate"),
  
  // Avaliação 360°
  score360: int("score360"),
  evaluation360Data: text("evaluation360Data"), // JSON
  
  // Competências
  competenciesData: text("competenciesData"), // JSON com níveis de competências
  
  // Análise de vídeo (se disponível)
  videoAnalysisScore: int("videoAnalysisScore"),
  videoAnalysisData: text("videoAnalysisData"), // JSON
  
  // Comparação com período anterior
  changeFromPrevious: int("changeFromPrevious"), // % de mudança
  changeType: mysqlEnum("changeType", ["melhoria", "declinio", "estavel"]),
  
  // Metadados
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmployeeTemporalSnapshot = typeof employeeTemporalSnapshots.$inferSelect;
export type InsertEmployeeTemporalSnapshot = typeof employeeTemporalSnapshots.$inferInsert;

// ============================================================================
// TABELAS DE NOTIFICAÇÕES AUTOMÁTICAS
// ============================================================================

/**
 * Notification Rules - Regras de notificação automática
 * Define quando e como enviar notificações
 */
export const notificationRules = mysqlTable("notificationRules", {
  id: int("id").autoincrement().primaryKey(),
  
  // Identificação
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  
  // Tipo de evento que dispara a notificação
  triggerEvent: mysqlEnum("triggerEvent", [
    "novo_anexo",
    "mudanca_pir_significativa",
    "mudanca_pir_critica",
    "meta_concluida",
    "meta_atrasada",
    "avaliacao_360_concluida",
    "novo_feedback",
    "competencia_atualizada",
    "pdi_atualizado"
  ]).notNull(),
  
  // Condições para disparo
  conditions: text("conditions").notNull(), // JSON com condições específicas
  
  // Limites para mudanças PIR
  pirChangeThreshold: int("pirChangeThreshold"), // % de mudança mínima
  pirChangeDirection: mysqlEnum("pirChangeDirection", ["qualquer", "melhoria", "declinio"]),
  
  // Destinatários
  notifyEmployee: boolean("notifyEmployee").default(false).notNull(),
  notifyDirectManager: boolean("notifyDirectManager").default(true).notNull(),
  notifyHR: boolean("notifyHR").default(false).notNull(),
  notifyCustomEmails: text("notifyCustomEmails"), // JSON array de emails
  
  // Canais de notificação
  sendEmail: boolean("sendEmail").default(true).notNull(),
  sendInApp: boolean("sendInApp").default(true).notNull(),
  sendPush: boolean("sendPush").default(false).notNull(),
  
  // Template de mensagem
  emailSubjectTemplate: varchar("emailSubjectTemplate", { length: 500 }),
  emailBodyTemplate: text("emailBodyTemplate"),
  inAppMessageTemplate: text("inAppMessageTemplate"),
  
  // Frequência e limites
  maxNotificationsPerDay: int("maxNotificationsPerDay").default(10).notNull(),
  cooldownMinutes: int("cooldownMinutes").default(60).notNull(), // Tempo mínimo entre notificações
  
  // Período de atividade
  activeFrom: datetime("activeFrom"),
  activeUntil: datetime("activeUntil"),
  
  // Status
  active: boolean("active").default(true).notNull(),
  
  // Metadados
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationRule = typeof notificationRules.$inferSelect;
export type InsertNotificationRule = typeof notificationRules.$inferInsert;

/**
 * Notification Queue - Fila de notificações a serem enviadas
 * Gerencia o envio assíncrono de notificações
 */
export const notificationQueue = mysqlTable("notificationQueue", {
  id: int("id").autoincrement().primaryKey(),
  ruleId: int("ruleId"),
  
  // Dados do evento que disparou
  triggerEvent: varchar("triggerEvent", { length: 100 }).notNull(),
  eventData: text("eventData").notNull(), // JSON com dados do evento
  
  // Destinatário
  recipientUserId: int("recipientUserId"),
  recipientEmail: varchar("recipientEmail", { length: 320 }),
  recipientName: varchar("recipientName", { length: 255 }),
  
  // Conteúdo da notificação
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  
  // Canal
  channel: mysqlEnum("channel", ["email", "in_app", "push"]).notNull(),
  
  // Prioridade
  priority: mysqlEnum("priority", ["baixa", "normal", "alta", "urgente"]).default("normal").notNull(),
  
  // Status de envio
  status: mysqlEnum("status", [
    "pendente",
    "processando",
    "enviado",
    "falha",
    "cancelado"
  ]).default("pendente").notNull(),
  
  // Tentativas de envio
  attempts: int("attempts").default(0).notNull(),
  maxAttempts: int("maxAttempts").default(3).notNull(),
  lastAttemptAt: datetime("lastAttemptAt"),
  nextAttemptAt: datetime("nextAttemptAt"),
  
  // Resultado
  sentAt: datetime("sentAt"),
  errorMessage: text("errorMessage"),
  
  // Metadados
  scheduledFor: datetime("scheduledFor"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationQueueItem = typeof notificationQueue.$inferSelect;
export type InsertNotificationQueueItem = typeof notificationQueue.$inferInsert;

/**
 * Notification History - Histórico de notificações enviadas
 * Registra todas as notificações enviadas para auditoria
 */
export const notificationHistory = mysqlTable("notificationHistory", {
  id: int("id").autoincrement().primaryKey(),
  queueId: int("queueId"),
  ruleId: int("ruleId"),
  
  // Dados do envio
  recipientUserId: int("recipientUserId"),
  recipientEmail: varchar("recipientEmail", { length: 320 }),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  channel: varchar("channel", { length: 50 }).notNull(),
  
  // Resultado
  status: mysqlEnum("status", ["enviado", "falha"]).notNull(),
  errorMessage: text("errorMessage"),
  
  // Interação do usuário
  opened: boolean("opened").default(false).notNull(),
  openedAt: datetime("openedAt"),
  clicked: boolean("clicked").default(false).notNull(),
  clickedAt: datetime("clickedAt"),
  
  // Metadados
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NotificationHistoryItem = typeof notificationHistory.$inferSelect;
export type InsertNotificationHistoryItem = typeof notificationHistory.$inferInsert;

/**
 * User Notification Preferences - Preferências de notificação por usuário
 * Permite usuários controlarem quais notificações receber
 */
export const userNotificationPreferences = mysqlTable("userNotificationPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  
  // Preferências por tipo de evento
  notifyNewAttachment: boolean("notifyNewAttachment").default(true).notNull(),
  notifyPirChanges: boolean("notifyPirChanges").default(true).notNull(),
  notifyGoalUpdates: boolean("notifyGoalUpdates").default(true).notNull(),
  notify360Completion: boolean("notify360Completion").default(true).notNull(),
  notifyFeedback: boolean("notifyFeedback").default(true).notNull(),
  notifyPdiUpdates: boolean("notifyPdiUpdates").default(true).notNull(),
  
  // Preferências por canal
  emailEnabled: boolean("emailEnabled").default(true).notNull(),
  inAppEnabled: boolean("inAppEnabled").default(true).notNull(),
  pushEnabled: boolean("pushEnabled").default(false).notNull(),
  
  // Horários de notificação (quiet hours)
  quietHoursEnabled: boolean("quietHoursEnabled").default(false).notNull(),
  quietHoursStart: varchar("quietHoursStart", { length: 5 }), // HH:MM
  quietHoursEnd: varchar("quietHoursEnd", { length: 5 }), // HH:MM
  
  // Frequência
  digestMode: boolean("digestMode").default(false).notNull(), // Agrupar notificações
  digestFrequency: mysqlEnum("digestFrequency", ["diario", "semanal"]),
  
  // Metadados
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserNotificationPreference = typeof userNotificationPreferences.$inferSelect;
export type InsertUserNotificationPreference = typeof userNotificationPreferences.$inferInsert;

// ============================================================================
// SISTEMA AVD UISA - FLUXO DE AVALIAÇÃO EM 5 PASSOS
// ============================================================================

/**
 * AVD Assessment Processes - Processos de Avaliação AVD
 * Gerencia o fluxo completo de avaliação em 5 passos
 */
export const avdAssessmentProcesses = mysqlTable("avdAssessmentProcesses", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  
  // Status do processo
  status: mysqlEnum("status", ["em_andamento", "concluido", "cancelado"]).default("em_andamento").notNull(),
  currentStep: int("currentStep").default(1).notNull(), // 1-5
  
  // Datas de conclusão de cada passo
  step1CompletedAt: datetime("step1CompletedAt"), // Perfil Profissional
  step2CompletedAt: datetime("step2CompletedAt"), // PIR
  step3CompletedAt: datetime("step3CompletedAt"), // Avaliação de Competências
  step4CompletedAt: datetime("step4CompletedAt"), // Avaliação de Desempenho
  step5CompletedAt: datetime("step5CompletedAt"), // PDI
  
  // IDs dos registros de cada passo
  step1Id: int("step1Id"), // ID do perfil profissional
  step2Id: int("step2Id"), // ID do teste PIR
  step3Id: int("step3Id"), // ID da avaliação de competências
  step4Id: int("step4Id"), // ID da avaliação de desempenho
  step5Id: int("step5Id"), // ID do PDI
  
  // Metadados
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: datetime("completedAt"),
});

export type AvdAssessmentProcess = typeof avdAssessmentProcesses.$inferSelect;
export type InsertAvdAssessmentProcess = typeof avdAssessmentProcesses.$inferInsert;

/**
 * AVD Competency Assessments - Avaliações de Competências (Passo 3)
 * Avalia competências comportamentais e técnicas em escala 1-5
 */
export const avdCompetencyAssessments = mysqlTable("avdCompetencyAssessments", {
  id: int("id").autoincrement().primaryKey(),
  processId: int("processId").notNull(), // Referência ao processo AVD
  employeeId: int("employeeId").notNull(),
  
  // Tipo de avaliação
  assessmentType: mysqlEnum("assessmentType", ["autoavaliacao", "avaliacao_gestor", "avaliacao_pares"]).default("autoavaliacao").notNull(),
  evaluatorId: int("evaluatorId"), // ID do avaliador (null para autoavaliação)
  
  // Status
  status: mysqlEnum("status", ["em_andamento", "concluida"]).default("em_andamento").notNull(),
  
  // Pontuação geral
  overallScore: int("overallScore"), // Média ponderada de todas as competências (0-100)
  
  // Observações gerais
  comments: text("comments"),
  
  // Metadados
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: datetime("completedAt"),
});

export type AvdCompetencyAssessment = typeof avdCompetencyAssessments.$inferSelect;
export type InsertAvdCompetencyAssessment = typeof avdCompetencyAssessments.$inferInsert;

/**
 * AVD Competency Assessment Items - Itens de Avaliação de Competências
 * Cada item representa a avaliação de uma competência específica
 */
export const avdCompetencyAssessmentItems = mysqlTable("avdCompetencyAssessmentItems", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessmentId").notNull(),
  competencyId: int("competencyId").notNull(), // Referência à tabela de competências
  
  // Avaliação
  score: int("score").notNull(), // 1-5
  comments: text("comments"),
  
  // Exemplos de comportamentos observados
  behaviorExamples: text("behaviorExamples"),
  
  // Metadados
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AvdCompetencyAssessmentItem = typeof avdCompetencyAssessmentItems.$inferSelect;
export type InsertAvdCompetencyAssessmentItem = typeof avdCompetencyAssessmentItems.$inferInsert;

/**
 * AVD Performance Assessments - Avaliações de Desempenho (Passo 4)
 * Consolida dados dos passos anteriores e gera avaliação final
 */
export const avdPerformanceAssessments = mysqlTable("avdPerformanceAssessments", {
  id: int("id").autoincrement().primaryKey(),
  processId: int("processId").notNull(),
  employeeId: int("employeeId").notNull(),
  
  // Pontuações dos passos anteriores
  profileScore: int("profileScore"), // Pontuação do Perfil Profissional (0-100)
  pirScore: int("pirScore"), // Pontuação do PIR (0-100)
  competencyScore: int("competencyScore"), // Pontuação de Competências (0-100)
  
  // Pesos de cada dimensão (%)
  profileWeight: int("profileWeight").default(20).notNull(),
  pirWeight: int("pirWeight").default(20).notNull(),
  competencyWeight: int("competencyWeight").default(60).notNull(),
  
  // Pontuação final ponderada
  finalScore: int("finalScore").notNull(), // 0-100
  
  // Classificação final
  performanceRating: mysqlEnum("performanceRating", [
    "insatisfatorio",
    "abaixo_expectativas",
    "atende_expectativas",
    "supera_expectativas",
    "excepcional"
  ]).notNull(),
  
  // Análise de gaps
  strengthsAnalysis: text("strengthsAnalysis"), // JSON com pontos fortes identificados
  gapsAnalysis: text("gapsAnalysis"), // JSON com gaps identificados
  
  // Recomendações
  developmentRecommendations: text("developmentRecommendations"),
  careerRecommendations: text("careerRecommendations"),
  
  // Observações do avaliador
  evaluatorComments: text("evaluatorComments"),
  evaluatorId: int("evaluatorId"),
  
  // Status
  status: mysqlEnum("status", ["em_andamento", "concluida", "aprovada"]).default("em_andamento").notNull(),
  
  // Metadados
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: datetime("completedAt"),
  approvedAt: datetime("approvedAt"),
  approvedBy: int("approvedBy"),
});

export type AvdPerformanceAssessment = typeof avdPerformanceAssessments.$inferSelect;
export type InsertAvdPerformanceAssessment = typeof avdPerformanceAssessments.$inferInsert;

/**
 * AVD Development Plans - Planos de Desenvolvimento Individual (Passo 5)
 * PDI gerado com base nos gaps identificados na avaliação
 */
export const avdDevelopmentPlans = mysqlTable("avdDevelopmentPlans", {
  id: int("id").autoincrement().primaryKey(),
  processId: int("processId").notNull(),
  employeeId: int("employeeId").notNull(),
  performanceAssessmentId: int("performanceAssessmentId").notNull(),
  
  // Informações do plano
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  // Período
  startDate: datetime("startDate").notNull(),
  endDate: datetime("endDate").notNull(),
  
  // Objetivos gerais
  objectives: text("objectives"), // JSON com objetivos do PDI
  
  // Status
  status: mysqlEnum("status", [
    "rascunho",
    "aguardando_aprovacao",
    "aprovado",
    "em_andamento",
    "concluido",
    "cancelado"
  ]).default("rascunho").notNull(),
  
  // Aprovação
  approvedBy: int("approvedBy"),
  approvedAt: datetime("approvedAt"),
  approvalComments: text("approvalComments"),
  
  // Progresso geral
  overallProgress: int("overallProgress").default(0).notNull(), // 0-100
  
  // Metadados
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: datetime("completedAt"),
});

export type AvdDevelopmentPlan = typeof avdDevelopmentPlans.$inferSelect;
export type InsertAvdDevelopmentPlan = typeof avdDevelopmentPlans.$inferInsert;

/**
 * AVD Development Actions - Ações de Desenvolvimento
 * Ações específicas do PDI para desenvolver competências
 */
export const avdDevelopmentActions = mysqlTable("avdDevelopmentActions", {
  id: int("id").autoincrement().primaryKey(),
  planId: int("planId").notNull(),
  competencyId: int("competencyId"), // Competência a ser desenvolvida
  
  // Informações da ação
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  // Tipo de ação (Modelo 70-20-10)
  actionType: mysqlEnum("actionType", [
    "experiencia_pratica", // 70%
    "mentoria_feedback", // 20%
    "treinamento_formal" // 10%
  ]).notNull(),
  
  // Categoria específica
  category: varchar("category", { length: 100 }), // ex: "projeto", "job_rotation", "curso_online"
  
  // Responsável e prazos
  responsibleId: int("responsibleId"), // Quem vai apoiar/acompanhar
  dueDate: datetime("dueDate").notNull(),
  
  // Métricas de sucesso
  successMetrics: text("successMetrics"),
  expectedOutcome: text("expectedOutcome"),
  
  // Status e progresso
  status: mysqlEnum("status", [
    "nao_iniciada",
    "em_andamento",
    "concluida",
    "cancelada",
    "atrasada"
  ]).default("nao_iniciada").notNull(),
  progress: int("progress").default(0).notNull(), // 0-100
  
  // Evidências de conclusão
  evidences: text("evidences"), // JSON com links, documentos, etc
  
  // Avaliação da ação
  effectiveness: int("effectiveness"), // 1-5 (efetividade da ação após conclusão)
  feedback: text("feedback"),
  
  // Metadados
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: datetime("completedAt"),
});

export type AvdDevelopmentAction = typeof avdDevelopmentActions.$inferSelect;
export type InsertAvdDevelopmentAction = typeof avdDevelopmentActions.$inferInsert;

/**
 * AVD Development Action Progress - Acompanhamento de Ações
 * Registra o progresso e atualizações das ações
 */
export const avdDevelopmentActionProgress = mysqlTable("avdDevelopmentActionProgress", {
  id: int("id").autoincrement().primaryKey(),
  actionId: int("actionId").notNull(),
  
  // Atualização de progresso
  progressPercent: int("progressPercent").notNull(), // 0-100
  comments: text("comments"),
  
  // Evidências
  evidenceUrl: varchar("evidenceUrl", { length: 512 }),
  evidenceType: varchar("evidenceType", { length: 50 }), // "documento", "foto", "link", etc
  
  // Quem registrou
  registeredBy: int("registeredBy").notNull(),
  registeredAt: timestamp("registeredAt").defaultNow().notNull(),
});

export type AvdDevelopmentActionProgress = typeof avdDevelopmentActionProgress.$inferSelect;
export type InsertAvdDevelopmentActionProgress = typeof avdDevelopmentActionProgress.$inferInsert;


// ============================================================================
// SISTEMA DE CONTROLE DE ACESSO BASEADO EM SOX
// ============================================================================

/**
 * Permissions - Permissões do Sistema
 * Define todas as permissões disponíveis (recursos + ações)
 */
export const permissions = mysqlTable("permissions", {
  id: int("id").autoincrement().primaryKey(),
  resource: varchar("resource", { length: 100 }).notNull(), // Ex: "metas", "avaliacoes", "pdi"
  action: varchar("action", { length: 50 }).notNull(), // Ex: "criar", "editar", "excluir", "visualizar", "aprovar"
  description: text("description"),
  category: varchar("category", { length: 100 }), // Categoria para organização (ex: "Gestão de Pessoas", "Avaliações")
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = typeof permissions.$inferInsert;

/**
 * Profiles - Perfis de Acesso
 * Define os perfis disponíveis no sistema
 */
export const profiles = mysqlTable("profiles", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(), // Ex: "admin", "rh_gerente", "especialista_cs"
  name: varchar("name", { length: 200 }).notNull(), // Nome amigável
  description: text("description"),
  level: int("level").notNull(), // Nível hierárquico (1=mais alto, 5=mais baixo)
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;

/**
 * Profile Permissions - Permissões por Perfil
 * Relaciona perfis com suas permissões
 */
export const profilePermissions = mysqlTable("profilePermissions", {
  id: int("id").autoincrement().primaryKey(),
  profileId: int("profileId").notNull(),
  permissionId: int("permissionId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProfilePermission = typeof profilePermissions.$inferSelect;
export type InsertProfilePermission = typeof profilePermissions.$inferInsert;

/**
 * User Profiles - Perfis Atribuídos aos Usuários
 * Relaciona usuários com seus perfis
 */
export const userProfiles = mysqlTable("userProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  profileId: int("profileId").notNull(),
  assignedBy: int("assignedBy").notNull(), // Quem atribuiu o perfil
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  revokedBy: int("revokedBy"), // Quem revogou (se aplicável)
  revokedAt: datetime("revokedAt"), // Quando foi revogado
  active: boolean("active").default(true).notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

/**
 * Access Audit Logs - Logs de Auditoria de Acesso
 * Registra todas as ações sensíveis para compliance SOX
 */
export const accessAuditLogs = mysqlTable("accessAuditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 255 }),
  userEmail: varchar("userEmail", { length: 320 }),
  
  // Ação realizada
  action: varchar("action", { length: 100 }).notNull(), // Ex: "criar_meta", "aprovar_avaliacao", "editar_bonus"
  resource: varchar("resource", { length: 100 }).notNull(), // Ex: "metas", "avaliacoes", "bonus"
  resourceId: int("resourceId"), // ID do recurso afetado
  
  // Detalhes da ação
  actionType: mysqlEnum("actionType", [
    "create", "read", "update", "delete", 
    "approve", "reject", "export", "import",
    "login", "logout", "permission_change"
  ]).notNull(),
  
  // Dados da requisição
  ipAddress: varchar("ipAddress", { length: 45 }), // IPv4 ou IPv6
  userAgent: text("userAgent"),
  requestMethod: varchar("requestMethod", { length: 10 }), // GET, POST, PUT, DELETE
  requestPath: varchar("requestPath", { length: 500 }),
  
  // Dados da mudança (para auditoria)
  oldValue: text("oldValue"), // JSON com valores anteriores
  newValue: text("newValue"), // JSON com novos valores
  
  // Status e resultado
  success: boolean("success").notNull(),
  errorMessage: text("errorMessage"),
  
  // Metadados
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  sessionId: varchar("sessionId", { length: 255 }),
});

export type AccessAuditLog = typeof accessAuditLogs.$inferSelect;
export type InsertAccessAuditLog = typeof accessAuditLogs.$inferInsert;

/**
 * Permission Change Requests - Solicitações de Mudança de Permissões
 * Para workflow de aprovação de mudanças de perfil (SOX compliance)
 */
export const permissionChangeRequests = mysqlTable("permissionChangeRequests", {
  id: int("id").autoincrement().primaryKey(),
  
  // Usuário afetado
  targetUserId: int("targetUserId").notNull(),
  targetUserName: varchar("targetUserName", { length: 255 }),
  
  // Mudança solicitada
  changeType: mysqlEnum("changeType", ["add_profile", "remove_profile", "change_profile"]).notNull(),
  currentProfileId: int("currentProfileId"), // Perfil atual (se aplicável)
  requestedProfileId: int("requestedProfileId").notNull(), // Perfil solicitado
  
  // Justificativa
  reason: text("reason").notNull(),
  businessJustification: text("businessJustification"),
  
  // Solicitante
  requestedBy: int("requestedBy").notNull(),
  requestedByName: varchar("requestedByName", { length: 255 }),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  
  // Aprovação
  status: mysqlEnum("status", ["pending", "approved", "rejected", "cancelled"]).default("pending").notNull(),
  approvedBy: int("approvedBy"),
  approvedByName: varchar("approvedByName", { length: 255 }),
  approvedAt: datetime("approvedAt"),
  approvalComments: text("approvalComments"),
  
  // Implementação
  implementedBy: int("implementedBy"),
  implementedAt: datetime("implementedAt"),
  
  // Metadados
  expiresAt: datetime("expiresAt"), // Data de expiração da solicitação
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
});

export type PermissionChangeRequest = typeof permissionChangeRequests.$inferSelect;
export type InsertPermissionChangeRequest = typeof permissionChangeRequests.$inferInsert;


// ============================================================================
// INTEGRAÇÃO CBO - CLASSIFICAÇÃO BRASILEIRA DE OCUPAÇÕES
// ============================================================================

/**
 * Cache local de cargos CBO
 * Armazena dados da API CBO para busca rápida e offline
 */
export const cboCargos = mysqlTable("cboCargos", {
  id: int("id").autoincrement().primaryKey(),
  
  // Código CBO (formato: 9999-99)
  codigoCBO: varchar("codigoCBO", { length: 10 }).notNull().unique(),
  
  // Título do cargo
  titulo: varchar("titulo", { length: 500 }).notNull(),
  
  // Descrição sumária
  descricaoSumaria: text("descricaoSumaria"),
  
  // Formação e experiência
  formacao: text("formacao"),
  experiencia: text("experiencia"),
  
  // Condições gerais de exercício
  condicoesExercicio: text("condicoesExercicio"),
  
  // Recursos de trabalho
  recursosTrabalho: json("recursosTrabalho"), // Array de strings
  
  // Atividades principais
  atividadesPrincipais: json("atividadesPrincipais"), // Array de strings
  
  // Competências pessoais
  competenciasPessoais: json("competenciasPessoais"), // Array de strings
  
  // Família ocupacional
  familiaOcupacional: varchar("familiaOcupacional", { length: 255 }),
  
  // Sinônimos
  sinonimos: json("sinonimos"), // Array de strings
  
  // Metadados
  ultimaAtualizacao: datetime("ultimaAtualizacao"),
  fonteDados: varchar("fonteDados", { length: 255 }).default("API CBO"),
  
  // Estatísticas de uso
  vezesUtilizado: int("vezesUtilizado").default(0).notNull(),
  ultimoUso: datetime("ultimoUso"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CBOCargo = typeof cboCargos.$inferSelect;
export type InsertCBOCargo = typeof cboCargos.$inferInsert;

/**
 * Histórico de buscas CBO
 * Rastreia buscas para melhorar sugestões
 */
export const cboSearchHistory = mysqlTable("cboSearchHistory", {
  id: int("id").autoincrement().primaryKey(),
  
  userId: int("userId").notNull(),
  searchTerm: varchar("searchTerm", { length: 255 }).notNull(),
  codigoCBOSelecionado: varchar("codigoCBOSelecionado", { length: 10 }),
  
  resultadosEncontrados: int("resultadosEncontrados").default(0).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CBOSearchHistory = typeof cboSearchHistory.$inferSelect;
export type InsertCBOSearchHistory = typeof cboSearchHistory.$inferInsert;

// ============================================================================
// FLUXO DE APROVAÇÃO DE DESCRIÇÃO DE CARGOS - 4 NÍVEIS
// ============================================================================

/**
 * Workflow de aprovação de descrição de cargos
 * Estende o sistema existente para 4 níveis
 */
export const jobDescriptionWorkflow = mysqlTable("jobDescriptionWorkflow", {
  id: int("id").autoincrement().primaryKey(),
  
  jobDescriptionId: int("jobDescriptionId").notNull(),
  
  // Status geral do workflow
  status: mysqlEnum("status", [
    "draft",
    "pending_cs_specialist",  // Nível 1: Especialista C&S
    "pending_direct_leader",  // Nível 2: Líder Direto
    "pending_hr_manager",     // Nível 3: Gerente RH
    "pending_gai_director",   // Nível 4: Diretor GAI
    "approved",
    "rejected"
  ]).default("draft").notNull(),
  
  // Nível atual de aprovação (1-4)
  currentLevel: int("currentLevel").default(1).notNull(),
  
  // Aprovadores designados para cada nível
  csSpecialistId: int("csSpecialistId"), // Nível 1
  directLeaderId: int("directLeaderId"), // Nível 2
  hrManagerId: int("hrManagerId"),       // Nível 3
  gaiDirectorId: int("gaiDirectorId"),   // Nível 4
  
  // Datas de aprovação de cada nível
  csSpecialistApprovedAt: datetime("csSpecialistApprovedAt"),
  directLeaderApprovedAt: datetime("directLeaderApprovedAt"),
  hrManagerApprovedAt: datetime("hrManagerApprovedAt"),
  gaiDirectorApprovedAt: datetime("gaiDirectorApprovedAt"),
  
  // Comentários de cada nível
  csSpecialistComments: text("csSpecialistComments"),
  directLeaderComments: text("directLeaderComments"),
  hrManagerComments: text("hrManagerComments"),
  gaiDirectorComments: text("gaiDirectorComments"),
  
  // Auditoria
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: datetime("completedAt"),
});

export type JobDescriptionWorkflow = typeof jobDescriptionWorkflow.$inferSelect;
export type InsertJobDescriptionWorkflow = typeof jobDescriptionWorkflow.$inferInsert;

/**
 * Histórico de ações no workflow
 * Rastreia todas as mudanças de status
 */
export const jobDescriptionWorkflowHistory = mysqlTable("jobDescriptionWorkflowHistory", {
  id: int("id").autoincrement().primaryKey(),
  
  workflowId: int("workflowId").notNull(),
  jobDescriptionId: int("jobDescriptionId").notNull(),
  
  // Ação realizada
  action: mysqlEnum("action", [
    "created",
    "submitted",
    "approved",
    "rejected",
    "returned",
    "cancelled"
  ]).notNull(),
  
  // Nível em que a ação ocorreu
  level: int("level").notNull(),
  
  // Usuário que realizou a ação
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 255 }),
  userRole: varchar("userRole", { length: 100 }),
  
  // Comentários
  comments: text("comments"),
  
  // Status anterior e novo
  previousStatus: varchar("previousStatus", { length: 50 }),
  newStatus: varchar("newStatus", { length: 50 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type JobDescriptionWorkflowHistory = typeof jobDescriptionWorkflowHistory.$inferSelect;
export type InsertJobDescriptionWorkflowHistory = typeof jobDescriptionWorkflowHistory.$inferInsert;

/**
 * Aprovações em lote
 * Permite aprovar múltiplas descrições de cargos de uma vez
 */
export const batchApprovals = mysqlTable("batchApprovals", {
  id: int("id").autoincrement().primaryKey(),
  
  // Identificador do lote
  batchId: varchar("batchId", { length: 100 }).notNull().unique(),
  
  // Aprovador
  approverId: int("approverId").notNull(),
  approverName: varchar("approverName", { length: 255 }),
  
  // Nível de aprovação
  approvalLevel: int("approvalLevel").notNull(),
  
  // Descrições de cargos no lote
  jobDescriptionIds: json("jobDescriptionIds").notNull(), // Array de IDs
  
  // Status
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  
  // Resultados
  totalItems: int("totalItems").notNull(),
  approvedCount: int("approvedCount").default(0).notNull(),
  rejectedCount: int("rejectedCount").default(0).notNull(),
  failedCount: int("failedCount").default(0).notNull(),
  
  // Comentário geral do lote
  batchComments: text("batchComments"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: datetime("completedAt"),
});

export type BatchApproval = typeof batchApprovals.$inferSelect;
export type InsertBatchApproval = typeof batchApprovals.$inferInsert;

// ============================================================================
// PIR DE INTEGRIDADE APRIMORADO
// ============================================================================

/**
 * Categorias de testes de integridade
 */
export const integrityTestCategories = mysqlTable("integrityTestCategories", {
  id: int("id").autoincrement().primaryKey(),
  
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  
  // Peso da categoria no cálculo final
  weight: int("weight").default(1).notNull(),
  
  active: boolean("active").default(true).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IntegrityTestCategory = typeof integrityTestCategories.$inferSelect;
export type InsertIntegrityTestCategory = typeof integrityTestCategories.$inferInsert;

/**
 * Questões de testes de integridade e ética
 */
export const integrityQuestions = mysqlTable("integrityQuestions", {
  id: int("id").autoincrement().primaryKey(),
  
  categoryId: int("categoryId").notNull(),
  
  // Texto da questão
  questionText: text("questionText").notNull(),
  
  // Tipo de questão
  questionType: mysqlEnum("questionType", [
    "likert_scale",      // Escala Likert 1-5
    "multiple_choice",   // Múltipla escolha
    "true_false",        // Verdadeiro/Falso
    "scenario"           // Cenário situacional
  ]).notNull(),
  
  // Opções de resposta (para múltipla escolha)
  options: json("options"), // Array de {value, label, score}
  
  // Resposta esperada (para validação cruzada)
  expectedAnswer: varchar("expectedAnswer", { length: 50 }),
  
  // Indicadores
  measuresEthics: boolean("measuresEthics").default(false).notNull(),
  measuresIntegrity: boolean("measuresIntegrity").default(false).notNull(),
  measuresHonesty: boolean("measuresHonesty").default(false).notNull(),
  measuresReliability: boolean("measuresReliability").default(false).notNull(),
  
  // Questão de verificação cruzada
  isCrossValidation: boolean("isCrossValidation").default(false).notNull(),
  relatedQuestionId: int("relatedQuestionId"), // ID da questão relacionada
  
  // Detecção de respostas socialmente desejáveis
  socialDesirabilityFlag: boolean("socialDesirabilityFlag").default(false).notNull(),
  
  active: boolean("active").default(true).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IntegrityQuestion = typeof integrityQuestions.$inferSelect;
export type InsertIntegrityQuestion = typeof integrityQuestions.$inferInsert;

/**
 * Respostas dos testes de integridade
 */
export const integrityResponses = mysqlTable("integrityResponses", {
  id: int("id").autoincrement().primaryKey(),
  
  pirAssessmentId: int("pirAssessmentId").notNull(),
  questionId: int("questionId").notNull(),
  
  // Resposta do candidato
  response: text("response").notNull(),
  responseValue: int("responseValue"), // Valor numérico da resposta
  
  // Tempo de resposta (em segundos)
  responseTime: int("responseTime"),
  
  // Flags de análise
  isInconsistent: boolean("isInconsistent").default(false).notNull(),
  isSociallyDesirable: boolean("isSociallyDesirable").default(false).notNull(),
  
  // Pontuação
  score: int("score"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type IntegrityResponse = typeof integrityResponses.$inferSelect;
export type InsertIntegrityResponse = typeof integrityResponses.$inferInsert;

/**
 * Análise de padrões de respostas
 */
export const responsePatternAnalysis = mysqlTable("responsePatternAnalysis", {
  id: int("id").autoincrement().primaryKey(),
  
  pirAssessmentId: int("pirAssessmentId").notNull(),
  
  // Indicadores de consistência
  consistencyScore: int("consistencyScore"), // 0-100
  inconsistentResponsesCount: int("inconsistentResponsesCount").default(0).notNull(),
  
  // Indicadores de desejabilidade social
  socialDesirabilityScore: int("socialDesirabilityScore"), // 0-100
  socialDesirableResponsesCount: int("socialDesirableResponsesCount").default(0).notNull(),
  
  // Indicadores de tempo
  averageResponseTime: int("averageResponseTime"), // Em segundos
  tooFastResponsesCount: int("tooFastResponsesCount").default(0).notNull(),
  tooSlowResponsesCount: int("tooSlowResponsesCount").default(0).notNull(),
  
  // Padrões identificados
  patternsDetected: json("patternsDetected"), // Array de padrões
  
  // Flags de alerta
  hasInconsistencies: boolean("hasInconsistencies").default(false).notNull(),
  hasSocialDesirability: boolean("hasSocialDesirability").default(false).notNull(),
  hasAnomalousTimings: boolean("hasAnomalousTimings").default(false).notNull(),
  
  // Confiabilidade geral
  reliabilityScore: int("reliabilityScore"), // 0-100
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResponsePatternAnalysis = typeof responsePatternAnalysis.$inferSelect;
export type InsertResponsePatternAnalysis = typeof responsePatternAnalysis.$inferInsert;

/**
 * Indicadores de ética e integridade
 */
export const ethicsIndicators = mysqlTable("ethicsIndicators", {
  id: int("id").autoincrement().primaryKey(),
  
  pirAssessmentId: int("pirAssessmentId").notNull(),
  
  // Scores por dimensão
  ethicsScore: int("ethicsScore"), // 0-100
  integrityScore: int("integrityScore"), // 0-100
  honestyScore: int("honestyScore"), // 0-100
  reliabilityScore: int("reliabilityScore"), // 0-100
  
  // Score geral
  overallScore: int("overallScore"), // 0-100
  
  // Classificação
  classification: mysqlEnum("classification", [
    "muito_baixo",
    "baixo",
    "medio",
    "alto",
    "muito_alto"
  ]),
  
  // Recomendação
  recommendation: text("recommendation"),
  
  // Alertas
  alerts: json("alerts"), // Array de alertas
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EthicsIndicator = typeof ethicsIndicators.$inferSelect;
export type InsertEthicsIndicator = typeof ethicsIndicators.$inferInsert;

// ============================================================================
// SISTEMA DE GRAVAÇÃO E ANÁLISE DE VÍDEOS
// ============================================================================

/**
 * Gravações de vídeo durante testes PIR
 */
export const pirVideoRecordings = mysqlTable("pirVideoRecordings", {
  id: int("id").autoincrement().primaryKey(),
  
  pirAssessmentId: int("pirAssessmentId").notNull(),
  
  // Arquivo de vídeo
  videoUrl: varchar("videoUrl", { length: 512 }).notNull(),
  videoS3Key: varchar("videoS3Key", { length: 512 }).notNull(),
  
  // Metadados do vídeo
  duration: int("duration"), // Duração em segundos
  fileSize: int("fileSize"), // Tamanho em bytes
  format: varchar("format", { length: 50 }), // mp4, webm, etc
  resolution: varchar("resolution", { length: 50 }), // 1920x1080, etc
  
  // Status de processamento
  processingStatus: mysqlEnum("processingStatus", [
    "uploaded",
    "processing",
    "completed",
    "failed"
  ]).default("uploaded").notNull(),
  
  // Timestamps de questões
  questionTimestamps: json("questionTimestamps"), // Array de {questionId, startTime, endTime}
  
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  processedAt: datetime("processedAt"),
});

export type PIRVideoRecording = typeof pirVideoRecordings.$inferSelect;
export type InsertPIRVideoRecording = typeof pirVideoRecordings.$inferInsert;

/**
 * Análise de micro-expressões faciais
 */
export const facialMicroExpressions = mysqlTable("facialMicroExpressions", {
  id: int("id").autoincrement().primaryKey(),
  
  videoRecordingId: int("videoRecordingId").notNull(),
  questionId: int("questionId"),
  
  // Timestamp no vídeo
  timestamp: int("timestamp").notNull(), // Em segundos
  
  // Expressão detectada
  expression: mysqlEnum("expression", [
    "neutral",
    "happiness",
    "sadness",
    "anger",
    "fear",
    "disgust",
    "surprise",
    "contempt"
  ]).notNull(),
  
  // Intensidade (0-100)
  intensity: int("intensity").notNull(),
  
  // Confiança da detecção (0-100)
  confidence: int("confidence").notNull(),
  
  // Duração da expressão
  duration: int("duration"), // Em milissegundos
  
  // Flag de micro-expressão (< 500ms)
  isMicroExpression: boolean("isMicroExpression").default(false).notNull(),
  
  detectedAt: timestamp("detectedAt").defaultNow().notNull(),
});

export type FacialMicroExpression = typeof facialMicroExpressions.$inferSelect;
export type InsertFacialMicroExpression = typeof facialMicroExpressions.$inferInsert;

/**
 * Análise de linguagem corporal
 */
export const bodyLanguageAnalysis = mysqlTable("bodyLanguageAnalysis", {
  id: int("id").autoincrement().primaryKey(),
  
  videoRecordingId: int("videoRecordingId").notNull(),
  questionId: int("questionId"),
  
  // Timestamp no vídeo
  timestamp: int("timestamp").notNull(),
  
  // Comportamentos detectados
  headMovement: varchar("headMovement", { length: 50 }), // nod, shake, tilt, etc
  eyeContact: mysqlEnum("eyeContact", ["direct", "averted", "looking_away", "closed"]),
  posture: mysqlEnum("posture", ["upright", "slouched", "leaning_forward", "leaning_back"]),
  handGestures: varchar("handGestures", { length: 255 }), // touching_face, fidgeting, etc
  
  // Indicadores de nervosismo
  nervousnessIndicators: json("nervousnessIndicators"), // Array de indicadores
  nervousnessScore: int("nervousnessScore"), // 0-100
  
  // Indicadores de confiança
  confidenceIndicators: json("confidenceIndicators"),
  confidenceScore: int("confidenceScore"), // 0-100
  
  detectedAt: timestamp("detectedAt").defaultNow().notNull(),
});

export type BodyLanguageAnalysis = typeof bodyLanguageAnalysis.$inferSelect;
export type InsertBodyLanguageAnalysis = typeof bodyLanguageAnalysis.$inferInsert;

/**
 * Análise de comportamento verbal
 */
export const verbalBehaviorAnalysis = mysqlTable("verbalBehaviorAnalysis", {
  id: int("id").autoincrement().primaryKey(),
  
  videoRecordingId: int("videoRecordingId").notNull(),
  questionId: int("questionId"),
  
  // Transcrição de áudio (se disponível)
  transcription: text("transcription"),
  
  // Análise de tom de voz
  tonePitch: varchar("tonePitch", { length: 50 }), // high, medium, low
  toneVariation: int("toneVariation"), // 0-100
  speakingRate: int("speakingRate"), // Palavras por minuto
  
  // Pausas
  pauseCount: int("pauseCount").default(0).notNull(),
  averagePauseDuration: int("averagePauseDuration"), // Em milissegundos
  longestPause: int("longestPause"), // Em milissegundos
  
  // Hesitações
  hesitationCount: int("hesitationCount").default(0).notNull(),
  fillerWordsCount: int("fillerWordsCount").default(0).notNull(), // "uhm", "ah", etc
  
  // Indicadores emocionais
  emotionalTone: mysqlEnum("emotionalTone", [
    "neutral",
    "positive",
    "negative",
    "anxious",
    "confident"
  ]),
  
  // Confiança na análise
  analysisConfidence: int("analysisConfidence"), // 0-100
  
  analyzedAt: timestamp("analyzedAt").defaultNow().notNull(),
});

export type VerbalBehaviorAnalysis = typeof verbalBehaviorAnalysis.$inferSelect;
export type InsertVerbalBehaviorAnalysis = typeof verbalBehaviorAnalysis.$inferInsert;

/**
 * Marcações de momentos relevantes no vídeo
 */
export const videoMarkers = mysqlTable("videoMarkers", {
  id: int("id").autoincrement().primaryKey(),
  
  videoRecordingId: int("videoRecordingId").notNull(),
  
  // Timestamp
  timestamp: int("timestamp").notNull(),
  
  // Tipo de marcação
  markerType: mysqlEnum("markerType", [
    "inconsistency",
    "high_stress",
    "deception_indicator",
    "confidence_peak",
    "notable_expression",
    "manual_note"
  ]).notNull(),
  
  // Descrição
  description: text("description"),
  
  // Severidade/Importância
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  
  // Criado automaticamente ou manualmente
  isAutomatic: boolean("isAutomatic").default(true).notNull(),
  createdBy: int("createdBy"), // ID do usuário (se manual)
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VideoMarker = typeof videoMarkers.$inferSelect;
export type InsertVideoMarker = typeof videoMarkers.$inferInsert;

/**
 * Relatório consolidado de análise de vídeo
 */
export const videoAnalysisReports = mysqlTable("videoAnalysisReports", {
  id: int("id").autoincrement().primaryKey(),
  
  pirAssessmentId: int("pirAssessmentId").notNull(),
  videoRecordingId: int("videoRecordingId").notNull(),
  
  // Scores consolidados
  overallBehaviorScore: int("overallBehaviorScore"), // 0-100
  facialExpressionScore: int("facialExpressionScore"), // 0-100
  bodyLanguageScore: int("bodyLanguageScore"), // 0-100
  verbalBehaviorScore: int("verbalBehaviorScore"), // 0-100
  
  // Indicadores de alerta
  deceptionIndicators: json("deceptionIndicators"),
  stressIndicators: json("stressIndicators"),
  inconsistencyIndicators: json("inconsistencyIndicators"),
  
  // Contadores
  totalMicroExpressions: int("totalMicroExpressions").default(0).notNull(),
  totalMarkers: int("totalMarkers").default(0).notNull(),
  criticalMarkersCount: int("criticalMarkersCount").default(0).notNull(),
  
  // Resumo executivo
  executiveSummary: text("executiveSummary"),
  
  // Recomendações
  recommendations: json("recommendations"),
  
  // Confiabilidade da análise
  analysisReliability: int("analysisReliability"), // 0-100
  
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VideoAnalysisReport = typeof videoAnalysisReports.$inferSelect;
export type InsertVideoAnalysisReport = typeof videoAnalysisReports.$inferInsert;

// ============================================================================
// SISTEMA DE ENVIO DE EMAILS E TEMPLATES
// ============================================================================

/**
 * Templates de email para avaliações
 */
export const emailTemplates = mysqlTable("emailTemplates", {
  id: int("id").autoincrement().primaryKey(),
  
  // Identificador único do template
  templateCode: varchar("templateCode", { length: 100 }).notNull().unique(),
  
  // Nome e descrição
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Tipo de template
  templateType: mysqlEnum("templateType", [
    "evaluation_invitation",
    "evaluation_reminder",
    "evaluation_completed",
    "approval_request",
    "approval_reminder",
    "approval_completed",
    "pir_invitation",
    "pir_results",
    "general_notification"
  ]).notNull(),
  
  // Conteúdo do email
  subject: varchar("subject", { length: 500 }).notNull(),
  bodyHtml: text("bodyHtml").notNull(),
  bodyText: text("bodyText"),
  
  // Variáveis disponíveis
  availableVariables: json("availableVariables"), // Array de variáveis
  
  // Configurações
  fromName: varchar("fromName", { length: 255 }),
  replyTo: varchar("replyTo", { length: 320 }),
  
  active: boolean("active").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

/**
 * Envios de email agendados
 */
export const scheduledEmails = mysqlTable("scheduledEmails", {
  id: int("id").autoincrement().primaryKey(),
  
  templateId: int("templateId").notNull(),
  
  // Destinatários
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  recipientName: varchar("recipientName", { length: 255 }),
  recipientUserId: int("recipientUserId"),
  
  // Dados para substituição de variáveis
  templateData: json("templateData").notNull(),
  
  // Agendamento
  scheduledFor: datetime("scheduledFor").notNull(),
  
  // Status
  status: mysqlEnum("status", [
    "pending",
    "sending",
    "sent",
    "failed",
    "cancelled"
  ]).default("pending").notNull(),
  
  // Tentativas
  attempts: int("attempts").default(0).notNull(),
  maxAttempts: int("maxAttempts").default(3).notNull(),
  lastAttemptAt: datetime("lastAttemptAt"),
  
  // Resultado
  sentAt: datetime("sentAt"),
  errorMessage: text("errorMessage"),
  
  // Rastreamento
  trackingId: varchar("trackingId", { length: 100 }).unique(),
  opened: boolean("opened").default(false).notNull(),
  openedAt: datetime("openedAt"),
  clicked: boolean("clicked").default(false).notNull(),
  clickedAt: datetime("clickedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduledEmail = typeof scheduledEmails.$inferSelect;
export type InsertScheduledEmail = typeof scheduledEmails.$inferInsert;

/**
 * Envios em lote de emails
 */
export const batchEmailSends = mysqlTable("batchEmailSends", {
  id: int("id").autoincrement().primaryKey(),
  
  // Identificador do lote
  batchId: varchar("batchId", { length: 100 }).notNull().unique(),
  
  templateId: int("templateId").notNull(),
  
  // Informações do lote
  totalRecipients: int("totalRecipients").notNull(),
  sentCount: int("sentCount").default(0).notNull(),
  failedCount: int("failedCount").default(0).notNull(),
  
  // Status
  status: mysqlEnum("status", [
    "pending",
    "processing",
    "completed",
    "partially_completed",
    "failed"
  ]).default("pending").notNull(),
  
  // Agendamento
  scheduledFor: datetime("scheduledFor"),
  
  // Criado por
  createdBy: int("createdBy").notNull(),
  createdByName: varchar("createdByName", { length: 255 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  startedAt: datetime("startedAt"),
  completedAt: datetime("completedAt"),
});

export type BatchEmailSend = typeof batchEmailSends.$inferSelect;
export type InsertBatchEmailSend = typeof batchEmailSends.$inferInsert;

/**
 * Log detalhado de envios de email
 */
export const emailSendLogs = mysqlTable("emailSendLogs", {
  id: int("id").autoincrement().primaryKey(),
  
  scheduledEmailId: int("scheduledEmailId"),
  batchEmailId: int("batchEmailId"),
  
  // Informações do email
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  
  // Status
  status: mysqlEnum("status", ["sent", "failed", "bounced", "complained"]).notNull(),
  
  // Detalhes do envio
  messageId: varchar("messageId", { length: 255 }),
  errorMessage: text("errorMessage"),
  
  // Rastreamento
  opened: boolean("opened").default(false).notNull(),
  openedAt: datetime("openedAt"),
  clicked: boolean("clicked").default(false).notNull(),
  clickedAt: datetime("clickedAt"),
  
  sentAt: timestamp("sentAt").defaultNow().notNull(),
});

export type EmailSendLog = typeof emailSendLogs.$inferSelect;
export type InsertEmailSendLog = typeof emailSendLogs.$inferInsert;

// ============================================================================
// RELATÓRIOS DETALHADOS DO PIR
// ============================================================================

/**
 * Relatórios individuais detalhados do PIR
 */
export const pirDetailedReports = mysqlTable("pirDetailedReports", {
  id: int("id").autoincrement().primaryKey(),
  
  pirAssessmentId: int("pirAssessmentId").notNull().unique(),
  employeeId: int("employeeId").notNull(),
  
  // Scores consolidados
  behavioralProfileScore: int("behavioralProfileScore"), // 0-100
  integrityScore: int("integrityScore"), // 0-100
  ethicsScore: int("ethicsScore"), // 0-100
  videoAnalysisScore: int("videoAnalysisScore"), // 0-100
  overallScore: int("overallScore"), // 0-100
  
  // Perfil comportamental
  dominantDimension: varchar("dominantDimension", { length: 50 }),
  dimensionScores: json("dimensionScores"), // {IP, ID, IC, ES, FL, AU}
  
  // Análise de integridade
  integrityIndicators: json("integrityIndicators"),
  ethicsIndicators: json("ethicsIndicators"),
  consistencyAnalysis: json("consistencyAnalysis"),
  
  // Análise de vídeo
  videoAnalysisSummary: json("videoAnalysisSummary"),
  criticalMarkers: json("criticalMarkers"),
  
  // Comparação com perfil ideal do cargo
  positionId: int("positionId"),
  positionTitle: varchar("positionTitle", { length: 255 }),
  fitScore: int("fitScore"), // 0-100 - compatibilidade com o cargo
  fitAnalysis: json("fitAnalysis"),
  
  // Compatibilidade com cultura organizacional
  culturalFitScore: int("culturalFitScore"), // 0-100
  culturalFitAnalysis: json("culturalFitAnalysis"),
  
  // Pontos fortes e áreas de desenvolvimento
  strengths: json("strengths"), // Array de pontos fortes
  developmentAreas: json("developmentAreas"), // Array de áreas a desenvolver
  
  // Sugestões de desenvolvimento
  developmentSuggestions: json("developmentSuggestions"),
  
  // Recomendações
  hiringRecommendation: mysqlEnum("hiringRecommendation", [
    "highly_recommended",
    "recommended",
    "recommended_with_reservations",
    "not_recommended",
    "strongly_not_recommended"
  ]),
  recommendationRationale: text("recommendationRationale"),
  
  // Alertas e flags
  alerts: json("alerts"),
  redFlags: json("redFlags"),
  
  // Relatório em PDF
  reportPdfUrl: varchar("reportPdfUrl", { length: 512 }),
  reportPdfS3Key: varchar("reportPdfS3Key", { length: 512 }),
  
  // Metadados
  generatedBy: int("generatedBy"),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PIRDetailedReport = typeof pirDetailedReports.$inferSelect;
export type InsertPIRDetailedReport = typeof pirDetailedReports.$inferInsert;

/**
 * Relatórios consolidados por departamento/equipe
 */
export const pirConsolidatedReports = mysqlTable("pirConsolidatedReports", {
  id: int("id").autoincrement().primaryKey(),
  
  // Escopo do relatório
  reportType: mysqlEnum("reportType", ["department", "position", "team", "company"]).notNull(),
  departmentId: int("departmentId"),
  positionId: int("positionId"),
  
  // Período
  periodStart: datetime("periodStart").notNull(),
  periodEnd: datetime("periodEnd").notNull(),
  
  // Estatísticas gerais
  totalAssessments: int("totalAssessments").notNull(),
  averageOverallScore: int("averageOverallScore"),
  averageIntegrityScore: int("averageIntegrityScore"),
  averageEthicsScore: int("averageEthicsScore"),
  
  // Distribuição de scores
  scoreDistribution: json("scoreDistribution"),
  
  // Análise de tendências
  trends: json("trends"),
  
  // Comparações
  departmentComparisons: json("departmentComparisons"),
  positionComparisons: json("positionComparisons"),
  
  // Insights
  keyInsights: json("keyInsights"),
  recommendations: json("recommendations"),
  
  // Relatório em PDF
  reportPdfUrl: varchar("reportPdfUrl", { length: 512 }),
  reportPdfS3Key: varchar("reportPdfS3Key", { length: 512 }),
  
  generatedBy: int("generatedBy").notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
});

export type PIRConsolidatedReport = typeof pirConsolidatedReports.$inferSelect;
export type InsertPIRConsolidatedReport = typeof pirConsolidatedReports.$inferInsert;

// ============================================================================
// TESTES DE INTEGRIDADE E ÉTICA (EXPANSÃO DO PIR)
// ============================================================================

/**
 * Integrity Tests - Testes de Integridade
 * Catálogo de testes de integridade e ética disponíveis
 */
export const integrityTests = mysqlTable("integrityTests", {
  id: int("id").autoincrement().primaryKey(),
  
  // Informações do teste
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Questões do teste (JSON array)
  questions: json("questions").notNull(), // [{id, text, type, options, scoring}]
  
  // Regras de pontuação (JSON)
  scoringRules: json("scoringRules").notNull(), // {dimensions, weights, thresholds}
  
  // Categorias avaliadas
  categories: json("categories"), // ["ética", "integridade", "honestidade", "confiabilidade"]
  
  // Configurações
  timeLimit: int("timeLimit"), // Tempo limite em minutos
  randomizeQuestions: boolean("randomizeQuestions").default(false).notNull(),
  
  // Status
  active: boolean("active").default(true).notNull(),
  
  // Metadados
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IntegrityTest = typeof integrityTests.$inferSelect;
export type InsertIntegrityTest = typeof integrityTests.$inferInsert;

/**
 * Integrity Test Results - Resultados dos Testes de Integridade
 * Armazena resultados e análises dos testes aplicados
 */
export const integrityTestResults = mysqlTable("integrityTestResults", {
  id: int("id").autoincrement().primaryKey(),
  
  // Vinculação
  employeeId: int("employeeId").notNull(),
  testId: int("testId").notNull(),
  pirAssessmentId: int("pirAssessmentId"), // Vinculação com PIR (opcional)
  
  // Respostas (JSON array)
  answers: json("answers").notNull(), // [{questionId, answer, responseTime}]
  
  // Pontuações
  score: int("score").notNull(), // Pontuação geral (0-100)
  dimensionScores: json("dimensionScores"), // Pontuações por dimensão
  
  // Análise comportamental (JSON)
  behavioralAnalysis: json("behavioralAnalysis").notNull(), // {patterns, insights, recommendations}
  
  // Indicadores de alerta
  alerts: json("alerts"), // Array de alertas identificados
  redFlags: json("redFlags"), // Flags críticos
  
  // Classificação
  classification: mysqlEnum("classification", [
    "muito_baixo",
    "baixo",
    "medio",
    "alto",
    "muito_alto"
  ]),
  
  // Recomendação
  recommendation: text("recommendation"),
  
  // Tempo de conclusão
  startedAt: datetime("startedAt").notNull(),
  completedAt: datetime("completedAt").notNull(),
  totalTime: int("totalTime"), // Tempo total em segundos
  
  // Metadados
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IntegrityTestResult = typeof integrityTestResults.$inferSelect;
export type InsertIntegrityTestResult = typeof integrityTestResults.$inferInsert;

/**
 * Tabela de aprovações de descrições de cargo
 * Gerencia o fluxo de aprovação individual e em lote
 */
export const jobApprovals = mysqlTable("jobApprovals", {
  id: int("id").autoincrement().primaryKey(),
  jobDescriptionId: int("jobDescriptionId").notNull(),
  approverId: int("approverId").notNull(),
  status: mysqlEnum("status", ["pendente", "aprovado", "rejeitado"]).default("pendente").notNull(),
  comments: text("comments"),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  approvedAt: timestamp("approvedAt"),
});

export type JobApproval = typeof jobApprovals.$inferSelect;
export type InsertJobApproval = typeof jobApprovals.$inferInsert;


// ============================================================================
// CONFIGURAÇÃO DE APROVADORES PADRÃO
// ============================================================================

/**
 * Configuração de Aprovadores Padrão
 * Define os aprovadores padrão para cada nível do workflow de aprovações
 */
export const defaultApprovers = mysqlTable("defaultApprovers", {
  id: int("id").autoincrement().primaryKey(),
  
  // Identificação do nível
  level: int("level").notNull(), // 1, 2, 3, 4
  levelName: varchar("levelName", { length: 255 }).notNull(), // Ex: "Líder Imediato", "RH C&S", etc.
  
  // Aprovador padrão
  approverId: int("approverId").notNull(), // ID do funcionário
  approverName: varchar("approverName", { length: 255 }).notNull(),
  approverEmail: varchar("approverEmail", { length: 320 }),
  approverRole: varchar("approverRole", { length: 255 }), // Cargo/função
  
  // Tipo de workflow
  workflowType: mysqlEnum("workflowType", [
    "job_description", // Descrição de cargos
    "pdi", // PDI
    "bonus", // Bônus
    "evaluation", // Avaliações
    "all" // Todos os workflows
  ]).default("all").notNull(),
  
  // Configurações
  isActive: boolean("isActive").default(true).notNull(),
  canSkip: boolean("canSkip").default(false).notNull(), // Se pode pular este nível
  isRequired: boolean("isRequired").default(true).notNull(), // Se é obrigatório
  
  // Notificações
  notifyOnSubmission: boolean("notifyOnSubmission").default(true).notNull(),
  notifyOnApproval: boolean("notifyOnApproval").default(true).notNull(),
  notifyOnRejection: boolean("notifyOnRejection").default(true).notNull(),
  
  // Auditoria
  createdBy: int("createdBy"),
  createdByName: varchar("createdByName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DefaultApprover = typeof defaultApprovers.$inferSelect;
export type InsertDefaultApprover = typeof defaultApprovers.$inferInsert;


// ============================================================================
// PIR COMPLETO - PROGRAMA DE INTEGRIDADE RESPIRATÓRIA
// ============================================================================

/**
 * Programas PIR
 * Gerenciamento de programas de integridade respiratória
 */
export const pirPrograms = mysqlTable("pirPrograms", {
  id: int("id").autoincrement().primaryKey(),
  
  // Informações do programa
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  startDate: date("startDate").notNull(),
  endDate: date("endDate"),
  status: mysqlEnum("status", ["active", "inactive", "completed"]).default("active").notNull(),
  
  // Responsáveis
  coordinatorId: int("coordinatorId"), // ID do coordenador do programa
  coordinatorName: varchar("coordinatorName", { length: 255 }),
  
  // Configurações
  requiresMedicalExam: boolean("requiresMedicalExam").default(true).notNull(),
  requiresTraining: boolean("requiresTraining").default(true).notNull(),
  testFrequencyMonths: int("testFrequencyMonths").default(12).notNull(), // Frequência de reteste
  
  // Auditoria
  createdBy: int("createdBy"),
  createdByName: varchar("createdByName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PirProgram = typeof pirPrograms.$inferSelect;
export type InsertPirProgram = typeof pirPrograms.$inferInsert;

/**
 * Participantes do Programa PIR
 * Funcionários cadastrados no programa de integridade respiratória
 */
export const pirParticipants = mysqlTable("pirParticipants", {
  id: int("id").autoincrement().primaryKey(),
  
  // Relacionamentos
  programId: int("programId").notNull(),
  employeeId: int("employeeId").notNull(),
  
  // Status
  status: mysqlEnum("status", ["active", "inactive", "suspended", "completed"]).default("active").notNull(),
  enrollmentDate: date("enrollmentDate").notNull(),
  lastTestDate: date("lastTestDate"),
  nextTestDue: date("nextTestDue"),
  
  // Exame médico
  medicalExamDate: date("medicalExamDate"),
  medicalExamStatus: mysqlEnum("medicalExamStatus", ["pending", "approved", "rejected", "expired"]).default("pending").notNull(),
  medicalExamExpiry: date("medicalExamExpiry"),
  medicalNotes: text("medicalNotes"),
  
  // Treinamento
  trainingDate: date("trainingDate"),
  trainingStatus: mysqlEnum("trainingStatus", ["pending", "completed", "expired"]).default("pending").notNull(),
  trainingExpiry: date("trainingExpiry"),
  trainingCertificate: varchar("trainingCertificate", { length: 500 }), // URL do certificado
  
  // Auditoria
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PirParticipant = typeof pirParticipants.$inferSelect;
export type InsertPirParticipant = typeof pirParticipants.$inferInsert;

/**
 * Equipamentos de Proteção Respiratória (EPR)
 * Cadastro de respiradores e máscaras
 */
export const pirEquipment = mysqlTable("pirEquipment", {
  id: int("id").autoincrement().primaryKey(),
  
  // Informações do equipamento
  name: varchar("name", { length: 255 }).notNull(),
  manufacturer: varchar("manufacturer", { length: 255 }),
  model: varchar("model", { length: 255 }),
  type: mysqlEnum("type", [
    "half_mask", // Meia-face
    "full_mask", // Face inteira
    "n95", // N95/PFF2
    "powered", // Motorizado
    "supplied_air", // Ar mandado
    "scba" // Autônomo
  ]).notNull(),
  
  // Especificações técnicas
  protectionFactor: int("protectionFactor"), // Fator de proteção nominal
  approvalNumber: varchar("approvalNumber", { length: 100 }), // CA (Certificado de Aprovação)
  sizes: text("sizes"), // JSON com tamanhos disponíveis
  
  // Controle
  isActive: boolean("isActive").default(true).notNull(),
  stockQuantity: int("stockQuantity").default(0),
  
  // Auditoria
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PirEquipment = typeof pirEquipment.$inferSelect;
export type InsertPirEquipment = typeof pirEquipment.$inferInsert;

/**
 * Testes de Integridade (Fit Tests)
 * Registro completo de testes qualitativos e quantitativos
 */
export const pirFitTests = mysqlTable("pirFitTests", {
  id: int("id").autoincrement().primaryKey(),
  
  // Relacionamentos
  programId: int("programId").notNull(),
  participantId: int("participantId").notNull(),
  employeeId: int("employeeId").notNull(),
  equipmentId: int("equipmentId").notNull(),
  
  // Informações do teste
  testDate: datetime("testDate").notNull(),
  testType: mysqlEnum("testType", ["qualitative", "quantitative"]).notNull(),
  protocol: mysqlEnum("protocol", [
    "osha_qualitative", // OSHA Qualitativo (sacarina, bitrex)
    "osha_quantitative", // OSHA Quantitativo (PortaCount)
    "iso_16975", // ISO 16975-3
    "nbr_15052" // NBR 15052
  ]).notNull(),
  
  // Equipamento testado
  equipmentSize: varchar("equipmentSize", { length: 50 }),
  equipmentCondition: mysqlEnum("equipmentCondition", ["new", "good", "fair", "poor"]).default("good"),
  
  // Resultado do teste
  result: mysqlEnum("result", ["pass", "fail", "inconclusive"]).notNull(),
  overallFitFactor: decimal("overallFitFactor", { precision: 10, scale: 2 }), // Fator de ajuste geral
  
  // Exercícios do teste (JSON com resultados por exercício)
  exerciseResults: text("exerciseResults"), // JSON: {exercise: "normal_breathing", fitFactor: 150, pass: true}
  
  // Gravação de vídeo
  videoUrl: varchar("videoUrl", { length: 500 }), // URL do vídeo no S3
  videoS3Key: varchar("videoS3Key", { length: 500 }), // Chave S3 do vídeo
  videoDuration: int("videoDuration"), // Duração em segundos
  videoThumbnail: varchar("videoThumbnail", { length: 500 }), // URL da thumbnail
  
  // Observações
  testNotes: text("testNotes"),
  testerName: varchar("testerName", { length: 255 }), // Nome do aplicador do teste
  testerId: int("testerId"), // ID do aplicador
  
  // Certificado
  certificateUrl: varchar("certificateUrl", { length: 500 }), // URL do certificado gerado
  certificateNumber: varchar("certificateNumber", { length: 100 }), // Número do certificado
  certificateExpiry: date("certificateExpiry"), // Validade do certificado
  
  // Auditoria
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PirFitTest = typeof pirFitTests.$inferSelect;
export type InsertPirFitTest = typeof pirFitTests.$inferInsert;

/**
 * Treinamentos PIR
 * Registro de treinamentos obrigatórios
 */
export const pirTrainings = mysqlTable("pirTrainings", {
  id: int("id").autoincrement().primaryKey(),
  
  // Informações do treinamento
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  trainingDate: datetime("trainingDate").notNull(),
  duration: int("duration"), // Duração em minutos
  
  // Instrutor
  instructorName: varchar("instructorName", { length: 255 }),
  instructorId: int("instructorId"),
  
  // Conteúdo
  topics: text("topics"), // JSON com tópicos abordados
  materials: text("materials"), // JSON com materiais utilizados
  
  // Controle
  maxParticipants: int("maxParticipants"),
  status: mysqlEnum("status", ["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled").notNull(),
  
  // Auditoria
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PirTraining = typeof pirTrainings.$inferSelect;
export type InsertPirTraining = typeof pirTrainings.$inferInsert;

/**
 * Participantes de Treinamentos
 * Registro de presença e aprovação em treinamentos
 */
export const pirTrainingParticipants = mysqlTable("pirTrainingParticipants", {
  id: int("id").autoincrement().primaryKey(),
  
  // Relacionamentos
  trainingId: int("trainingId").notNull(),
  employeeId: int("employeeId").notNull(),
  
  // Status
  attendanceStatus: mysqlEnum("attendanceStatus", ["registered", "present", "absent", "excused"]).default("registered").notNull(),
  completionStatus: mysqlEnum("completionStatus", ["pending", "completed", "failed"]).default("pending").notNull(),
  
  // Avaliação
  assessmentScore: int("assessmentScore"), // Nota da avaliação (0-100)
  assessmentPassed: boolean("assessmentPassed"),
  
  // Certificado
  certificateUrl: varchar("certificateUrl", { length: 500 }),
  certificateIssued: boolean("certificateIssued").default(false),
  certificateIssuedAt: datetime("certificateIssuedAt"),
  
  // Auditoria
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PirTrainingParticipant = typeof pirTrainingParticipants.$inferSelect;
export type InsertPirTrainingParticipant = typeof pirTrainingParticipants.$inferInsert;

/**
 * Exames Médicos Ocupacionais
 * Registro de exames para aptidão ao uso de EPR
 */
export const pirMedicalExams = mysqlTable("pirMedicalExams", {
  id: int("id").autoincrement().primaryKey(),
  
  // Relacionamentos
  employeeId: int("employeeId").notNull(),
  programId: int("programId"),
  
  // Informações do exame
  examDate: date("examDate").notNull(),
  examType: mysqlEnum("examType", ["admissional", "periodico", "retorno_trabalho", "mudanca_funcao", "demissional"]).notNull(),
  
  // Médico
  doctorName: varchar("doctorName", { length: 255 }),
  doctorCRM: varchar("doctorCRM", { length: 50 }),
  clinicName: varchar("clinicName", { length: 255 }),
  
  // Resultado
  result: mysqlEnum("result", ["apto", "inapto", "apto_com_restricoes"]).notNull(),
  restrictions: text("restrictions"), // Restrições se houver
  
  // Exames complementares
  spirometry: text("spirometry"), // JSON com resultados da espirometria
  chestXray: text("chestXray"), // JSON com resultados do raio-X
  otherExams: text("otherExams"), // JSON com outros exames
  
  // Validade
  expiryDate: date("expiryDate"),
  
  // Documentos
  reportUrl: varchar("reportUrl", { length: 500 }), // URL do laudo
  
  // Auditoria
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PirMedicalExam = typeof pirMedicalExams.$inferSelect;
export type InsertPirMedicalExam = typeof pirMedicalExams.$inferInsert;

/**
 * Histórico de Uso de EPR
 * Registro de utilização de equipamentos
 */
export const pirEquipmentUsage = mysqlTable("pirEquipmentUsage", {
  id: int("id").autoincrement().primaryKey(),
  
  // Relacionamentos
  employeeId: int("employeeId").notNull(),
  equipmentId: int("equipmentId").notNull(),
  
  // Informações de uso
  assignedDate: date("assignedDate").notNull(),
  returnedDate: date("returnedDate"),
  status: mysqlEnum("status", ["in_use", "returned", "damaged", "lost"]).default("in_use").notNull(),
  
  // Detalhes
  equipmentSize: varchar("equipmentSize", { length: 50 }),
  serialNumber: varchar("serialNumber", { length: 100 }),
  
  // Condição
  assignedCondition: mysqlEnum("assignedCondition", ["new", "good", "fair"]).default("good"),
  returnedCondition: mysqlEnum("returnedCondition", ["good", "fair", "poor", "damaged"]),
  
  // Observações
  notes: text("notes"),
  
  // Auditoria
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PirEquipmentUsage = typeof pirEquipmentUsage.$inferSelect;
export type InsertPirEquipmentUsage = typeof pirEquipmentUsage.$inferInsert;


// ============================================================================
// CAMPOS DINÂMICOS PARA DESCRIÇÕES DE CARGOS
// ============================================================================

/**
 * Templates de Campos Dinâmicos
 * Define campos personalizados que podem ser adicionados às descrições de cargos
 */
export const customFieldTemplates = mysqlTable("customFieldTemplates", {
  id: int("id").autoincrement().primaryKey(),
  
  // Informações do Campo
  name: varchar("name", { length: 255 }).notNull(), // Nome do campo (ex: "Certificações Necessárias")
  label: varchar("label", { length: 255 }).notNull(), // Label exibido no formulário
  description: text("description"), // Descrição/ajuda do campo
  
  // Tipo do Campo
  fieldType: mysqlEnum("fieldType", [
    "text", // Texto curto
    "textarea", // Texto longo
    "number", // Número
    "date", // Data
    "select", // Seleção única
    "multiselect", // Seleção múltipla
    "checkbox", // Checkbox
    "radio", // Radio button
    "file", // Upload de arquivo
    "url", // URL
    "email", // Email
  ]).notNull(),
  
  // Configurações do Campo
  options: json("options"), // Opções para select/multiselect/radio (array de strings)
  placeholder: varchar("placeholder", { length: 255 }), // Placeholder do campo
  defaultValue: text("defaultValue"), // Valor padrão
  
  // Validações
  required: boolean("required").default(false).notNull(), // Campo obrigatório
  minLength: int("minLength"), // Comprimento mínimo (para text/textarea)
  maxLength: int("maxLength"), // Comprimento máximo (para text/textarea)
  minValue: int("minValue"), // Valor mínimo (para number)
  maxValue: int("maxValue"), // Valor máximo (para number)
  pattern: varchar("pattern", { length: 500 }), // Regex de validação
  validationMessage: varchar("validationMessage", { length: 500 }), // Mensagem de erro customizada
  
  // Organização
  category: varchar("category", { length: 100 }), // Categoria do campo (ex: "Qualificações", "Requisitos")
  displayOrder: int("displayOrder").default(0).notNull(), // Ordem de exibição
  
  // Visibilidade e Status
  active: boolean("active").default(true).notNull(),
  isGlobal: boolean("isGlobal").default(true).notNull(), // Se true, disponível para todos os cargos
  
  // Auditoria
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomFieldTemplate = typeof customFieldTemplates.$inferSelect;
export type InsertCustomFieldTemplate = typeof customFieldTemplates.$inferInsert;

/**
 * Valores de Campos Dinâmicos
 * Armazena os valores dos campos dinâmicos para cada job description
 */
export const customFieldValues = mysqlTable("customFieldValues", {
  id: int("id").autoincrement().primaryKey(),
  
  // Relacionamentos
  jobDescriptionId: int("jobDescriptionId").notNull(),
  templateId: int("templateId").notNull(), // Referência ao template do campo
  
  // Valor do Campo
  value: text("value"), // Valor armazenado como texto (JSON para multiselect/checkbox)
  
  // Ordem de Exibição (pode ser diferente da ordem do template)
  displayOrder: int("displayOrder").default(0).notNull(),
  
  // Auditoria
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomFieldValue = typeof customFieldValues.$inferSelect;
export type InsertCustomFieldValue = typeof customFieldValues.$inferInsert;

/**
 * Associação de Templates de Campos com Cargos
 * Define quais campos dinâmicos estão ativos para cada cargo específico
 */
export const positionFieldTemplates = mysqlTable("positionFieldTemplates", {
  id: int("id").autoincrement().primaryKey(),
  
  // Relacionamentos
  positionId: int("positionId").notNull(), // Cargo específico
  templateId: int("templateId").notNull(), // Template do campo
  
  // Configurações Específicas do Cargo
  required: boolean("required").default(false).notNull(), // Sobrescreve a configuração do template
  displayOrder: int("displayOrder").default(0).notNull(), // Ordem específica para este cargo
  
  // Status
  active: boolean("active").default(true).notNull(),
  
  // Auditoria
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PositionFieldTemplate = typeof positionFieldTemplates.$inferSelect;
export type InsertPositionFieldTemplate = typeof positionFieldTemplates.$inferInsert;

/**
 * Histórico de Alterações em Campos Dinâmicos
 * Rastreia mudanças nos valores dos campos para auditoria
 */
export const customFieldHistory = mysqlTable("customFieldHistory", {
  id: int("id").autoincrement().primaryKey(),
  
  // Relacionamentos
  fieldValueId: int("fieldValueId").notNull(), // Referência ao customFieldValues
  jobDescriptionId: int("jobDescriptionId").notNull(),
  templateId: int("templateId").notNull(),
  
  // Alteração
  action: mysqlEnum("action", ["created", "updated", "deleted"]).notNull(),
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  
  // Auditoria
  changedById: int("changedById").notNull(),
  changedByName: varchar("changedByName", { length: 255 }),
  changedAt: timestamp("changedAt").defaultNow().notNull(),
});

export type CustomFieldHistory = typeof customFieldHistory.$inferSelect;
export type InsertCustomFieldHistory = typeof customFieldHistory.$inferInsert;
