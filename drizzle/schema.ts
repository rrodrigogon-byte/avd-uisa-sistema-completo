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
  costCenter: varchar("costCenter", { length: 100 }), // Centro de custos
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

export const calibrationSessions = mysqlTable("calibrationSessions", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").notNull(),
  departmentId: int("departmentId"),
  facilitatorId: int("facilitatorId").notNull(), // Quem conduziu a sessão
  status: mysqlEnum("status", ["agendada", "em_andamento", "concluida"]).default("agendada").notNull(),
  scheduledDate: datetime("scheduledDate"),
  startedAt: datetime("startedAt"),
  completedAt: datetime("completedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
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
  testType: mysqlEnum("testType", ["disc", "bigfive", "mbti", "ie", "vark", "leadership", "careeranchors"]).notNull(),
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
  testType: mysqlEnum("testType", ["disc", "bigfive", "mbti", "ie", "vark", "leadership", "careeranchors"]).notNull(),
  questionNumber: int("questionNumber").notNull(),
  questionText: text("questionText").notNull(),
  dimension: varchar("dimension", { length: 50 }).notNull(), // Ex: "dominance", "openness", "E/I", "Autoconsciência", "Visual"
  reverse: boolean("reverse").default(false).notNull(), // Se a pontuação é invertida
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TestQuestion = typeof testQuestions.$inferSelect;
export type InsertTestQuestion = typeof testQuestions.$inferInsert;

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
  employeeId: int("employeeId").notNull(),
  cycleId: int("cycleId").notNull(),
  pdiPlanId: int("pdiPlanId"), // Opcional: vincular com PDI
  
  // Informações básicas
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  type: mysqlEnum("type", ["individual", "team", "organizational"]).notNull(),
  category: mysqlEnum("category", ["financial", "behavioral", "corporate", "development"]).notNull(),
  
  // Critérios SMART
  isSpecific: boolean("isSpecific").default(false).notNull(), // S - Específica
  isMeasurable: boolean("isMeasurable").default(false).notNull(), // M - Mensurável
  isAchievable: boolean("isAchievable").default(false).notNull(), // A - Atingível
  isRelevant: boolean("isRelevant").default(false).notNull(), // R - Relevante
  isTimeBound: boolean("isTimeBound").default(false).notNull(), // T - Temporal
  
  // Métricas
  measurementUnit: varchar("measurementUnit", { length: 50 }), // Ex: "R$", "%", "unidades"
  targetValue: decimal("targetValue", { precision: 10, scale: 2 }), // Valor alvo
  currentValue: decimal("currentValue", { precision: 10, scale: 2 }).default("0"), // Valor atual
  weight: int("weight").default(10).notNull(), // Peso da meta (para cálculo de bônus)
  
  // Datas
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  
  // Bônus financeiro
  bonusEligible: boolean("bonusEligible").default(false).notNull(), // Elegível para bônus?
  bonusPercentage: decimal("bonusPercentage", { precision: 5, scale: 2 }), // % de bônus se atingir
  bonusAmount: decimal("bonusAmount", { precision: 10, scale: 2 }), // Valor fixo de bônus
  
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
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  decidedAt: timestamp("decidedAt"),
});

export const goalComments = mysqlTable("goalComments", {
  id: int("id").autoincrement().primaryKey(),
  goalId: int("goalId").notNull(),
  
  authorId: int("authorId").notNull(),
  comment: text("comment").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
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
  baseSalaryMultiplier: decimal("baseSalaryMultiplier", { precision: 5, scale: 2 }).default("0").notNull(), // Ex: 1.5 = 1.5 salários
  extraBonusPercentage: decimal("extraBonusPercentage", { precision: 5, scale: 2 }).default("0").notNull(), // % adicional
  
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
  eligibleAmount: decimal("eligibleAmount", { precision: 10, scale: 2 }).notNull(), // Valor elegível baseado em metas
  extraBonusPercentage: decimal("extraBonusPercentage", { precision: 5, scale: 2 }).default("0"), // Bônus extra do RH
  finalAmount: decimal("finalAmount", { precision: 10, scale: 2 }).notNull(), // Valor final aprovado
  
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
  readinessIndex: decimal("readinessIndex", { precision: 3, scale: 1 }).notNull(), // 1.0 a 5.0
  
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
