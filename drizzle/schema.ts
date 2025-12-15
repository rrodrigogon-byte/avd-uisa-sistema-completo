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
  /** Status do PIR - workflow de aprovação */
  status: mysqlEnum("status", ["rascunho", "em_analise", "aprovado", "rejeitado", "ativo", "concluido", "cancelado"]).default("rascunho").notNull(),
  /** ID da avaliação que originou o PIR (se aplicável) */
  evaluationId: int("evaluationId"),
  /** ID do gestor responsável */
  managerId: int("managerId").notNull(),
  /** Data de início */
  startDate: timestamp("startDate").notNull(),
  /** Data de término */
  endDate: timestamp("endDate").notNull(),
  /** ID do aprovador */
  approvedBy: int("approvedBy"),
  /** Data de aprovação */
  approvedAt: timestamp("approvedAt"),
  /** ID do rejeitador */
  rejectedBy: int("rejectedBy"),
  /** Data de rejeição */
  rejectedAt: timestamp("rejectedAt"),
  /** Comentários da aprovação/rejeição */
  approvalComments: text("approvalComments"),
  /** Data de submissão para análise */
  submittedAt: timestamp("submittedAt"),
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
 * Histórico de Aprovações de PIR
 */
export const pirApprovalHistory = mysqlTable("pirApprovalHistory", {
  id: int("id").autoincrement().primaryKey(),
  /** ID do PIR */
  pirId: int("pirId").notNull(),
  /** Ação realizada */
  action: mysqlEnum("action", ["submetido", "aprovado", "rejeitado", "reaberto"]).notNull(),
  /** ID do usuário que realizou a ação */
  performedBy: int("performedBy").notNull(),
  /** Comentários sobre a ação */
  comments: text("comments"),
  /** Status anterior */
  previousStatus: varchar("previousStatus", { length: 50 }),
  /** Novo status */
  newStatus: varchar("newStatus", { length: 50 }).notNull(),
  performedAt: timestamp("performedAt").defaultNow().notNull(),
});

export type PirApprovalHistory = typeof pirApprovalHistory.$inferSelect;
export type InsertPirApprovalHistory = typeof pirApprovalHistory.$inferInsert;

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
  /** Status da descrição - workflow de aprovação */
  status: mysqlEnum("status", ["rascunho", "em_analise", "aprovado", "rejeitado", "arquivado"]).default("rascunho").notNull(),
  /** Indica se é a versão ativa */
  isActive: boolean("isActive").default(false).notNull(),
  /** ID da versão anterior (para histórico) */
  previousVersionId: int("previousVersionId"),
  /** Usuário que criou/atualizou */
  createdBy: int("createdBy").notNull(),
  /** ID do aprovador */
  approvedBy: int("approvedBy"),
  /** Data de aprovação */
  approvedAt: timestamp("approvedAt"),
  /** ID do rejeitador */
  rejectedBy: int("rejectedBy"),
  /** Data de rejeição */
  rejectedAt: timestamp("rejectedAt"),
  /** Comentários da aprovação/rejeição */
  approvalComments: text("approvalComments"),
  /** Data de submissão para análise */
  submittedAt: timestamp("submittedAt"),
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
 * Histórico de Aprovações de Descrição de Cargo
 */
export const jobDescriptionApprovalHistory = mysqlTable("jobDescriptionApprovalHistory", {
  id: int("id").autoincrement().primaryKey(),
  /** ID da descrição de cargo */
  jobDescriptionId: int("jobDescriptionId").notNull(),
  /** Ação realizada */
  action: mysqlEnum("action", ["submetido", "aprovado", "rejeitado", "reaberto", "arquivado"]).notNull(),
  /** ID do usuário que realizou a ação */
  performedBy: int("performedBy").notNull(),
  /** Comentários sobre a ação */
  comments: text("comments"),
  /** Status anterior */
  previousStatus: varchar("previousStatus", { length: 50 }),
  /** Novo status */
  newStatus: varchar("newStatus", { length: 50 }).notNull(),
  performedAt: timestamp("performedAt").defaultNow().notNull(),
});

export type JobDescriptionApprovalHistory = typeof jobDescriptionApprovalHistory.$inferSelect;
export type InsertJobDescriptionApprovalHistory = typeof jobDescriptionApprovalHistory.$inferInsert;

/**
 * Metas (Goals)
 */
export const goals = mysqlTable("goals", {
  id: int("id").autoincrement().primaryKey(),
  /** ID do usuário dono da meta */
  userId: int("userId").notNull(),
  /** Título da meta */
  title: varchar("title", { length: 255 }).notNull(),
  /** Descrição detalhada */
  description: text("description"),
  /** Tipo de meta */
  type: mysqlEnum("type", ["individual", "team", "organizational"]).default("individual").notNull(),
  /** Categoria */
  category: varchar("category", { length: 100 }),
  /** Meta numérica (valor alvo) */
  targetValue: int("targetValue"),
  /** Valor atual alcançado */
  currentValue: int("currentValue").default(0),
  /** Unidade de medida */
  unit: varchar("unit", { length: 50 }),
  /** Status da meta */
  status: mysqlEnum("status", ["not_started", "in_progress", "completed", "cancelled", "overdue"]).default("not_started").notNull(),
  /** Prioridade */
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  /** Data de início */
  startDate: timestamp("startDate").notNull(),
  /** Data limite */
  deadline: timestamp("deadline").notNull(),
  /** ID do gestor responsável */
  managerId: int("managerId"),
  /** Peso da meta (para cálculo de bônus) */
  weight: int("weight").default(100),
  /** Vinculada a ciclo de avaliação */
  evaluationCycle: varchar("evaluationCycle", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = typeof goals.$inferInsert;

/**
 * Progresso de Metas
 */
export const goalProgress = mysqlTable("goalProgress", {
  id: int("id").autoincrement().primaryKey(),
  /** ID da meta */
  goalId: int("goalId").notNull(),
  /** Valor registrado */
  value: int("value").notNull(),
  /** Percentual de progresso */
  percentage: int("percentage").notNull(),
  /** Comentários sobre o progresso */
  comments: text("comments"),
  /** Usuário que registrou */
  recordedBy: int("recordedBy").notNull(),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
});

export type GoalProgress = typeof goalProgress.$inferSelect;
export type InsertGoalProgress = typeof goalProgress.$inferInsert;

/**
 * PDI - Plano de Desenvolvimento Individual
 */
export const developmentPlans = mysqlTable("developmentPlans", {
  id: int("id").autoincrement().primaryKey(),
  /** ID do usuário dono do PDI */
  userId: int("userId").notNull(),
  /** Título do PDI */
  title: varchar("title", { length: 255 }).notNull(),
  /** Descrição geral */
  description: text("description"),
  /** Período de vigência */
  period: varchar("period", { length: 100 }).notNull(),
  /** Status do PDI */
  status: mysqlEnum("status", ["rascunho", "ativo", "concluido", "cancelado"]).default("rascunho").notNull(),
  /** ID do gestor responsável */
  managerId: int("managerId").notNull(),
  /** Data de início */
  startDate: timestamp("startDate").notNull(),
  /** Data de término */
  endDate: timestamp("endDate").notNull(),
  /** Percentual de conclusão geral */
  completionPercentage: int("completionPercentage").default(0),
  /** Vinculado a avaliação */
  evaluationId: int("evaluationId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DevelopmentPlan = typeof developmentPlans.$inferSelect;
export type InsertDevelopmentPlan = typeof developmentPlans.$inferInsert;

/**
 * Ações de Desenvolvimento
 */
export const developmentActions = mysqlTable("developmentActions", {
  id: int("id").autoincrement().primaryKey(),
  /** ID do PDI */
  planId: int("planId").notNull(),
  /** Título da ação */
  title: varchar("title", { length: 255 }).notNull(),
  /** Descrição detalhada */
  description: text("description"),
  /** Tipo de ação */
  type: mysqlEnum("type", ["training", "course", "mentoring", "project", "reading", "certification", "other"]).notNull(),
  /** Status da ação */
  status: mysqlEnum("status", ["not_started", "in_progress", "completed", "cancelled"]).default("not_started").notNull(),
  /** Data limite */
  deadline: timestamp("deadline"),
  /** Data de conclusão */
  completedAt: timestamp("completedAt"),
  /** Comentários */
  comments: text("comments"),
  /** Ordem de exibição */
  displayOrder: int("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DevelopmentAction = typeof developmentActions.$inferSelect;
export type InsertDevelopmentAction = typeof developmentActions.$inferInsert;

/**
 * Planos de Sucessão
 */
export const successionPlans = mysqlTable("successionPlans", {
  id: int("id").autoincrement().primaryKey(),
  /** Cargo/posição crítica */
  position: varchar("position", { length: 255 }).notNull(),
  /** ID da descrição de cargo vinculada */
  jobDescriptionId: int("jobDescriptionId"),
  /** Departamento */
  department: varchar("department", { length: 100 }),
  /** Ocupante atual */
  currentOccupantId: int("currentOccupantId"),
  /** Risco de vacância */
  vacancyRisk: mysqlEnum("vacancyRisk", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  /** Prazo estimado de vacância */
  estimatedVacancyDate: timestamp("estimatedVacancyDate"),
  /** Status do plano */
  status: mysqlEnum("status", ["ativo", "em_andamento", "concluido", "cancelado"]).default("ativo").notNull(),
  /** Notas e observações */
  notes: text("notes"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SuccessionPlan = typeof successionPlans.$inferSelect;
export type InsertSuccessionPlan = typeof successionPlans.$inferInsert;

/**
 * Candidatos à Sucessão
 */
export const successionCandidates = mysqlTable("successionCandidates", {
  id: int("id").autoincrement().primaryKey(),
  /** ID do plano de sucessão */
  planId: int("planId").notNull(),
  /** ID do candidato */
  candidateId: int("candidateId").notNull(),
  /** Nível de prontidão */
  readinessLevel: mysqlEnum("readinessLevel", ["ready_now", "ready_1_year", "ready_2_years", "ready_3_years", "not_ready"]).notNull(),
  /** Potencial */
  potential: mysqlEnum("potential", ["low", "medium", "high"]).default("medium").notNull(),
  /** Desempenho */
  performance: mysqlEnum("performance", ["below", "meets", "exceeds", "outstanding"]).default("meets").notNull(),
  /** Gaps de competências */
  competencyGaps: text("competencyGaps"),
  /** Plano de desenvolvimento para sucessão */
  developmentPlanId: int("developmentPlanId"),
  /** Notas */
  notes: text("notes"),
  /** Ordem de prioridade */
  priority: int("priority").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SuccessionCandidate = typeof successionCandidates.$inferSelect;
export type InsertSuccessionCandidate = typeof successionCandidates.$inferInsert;

/**
 * Avaliações de Prontidão para Sucessão
 */
export const readinessAssessments = mysqlTable("readinessAssessments", {
  id: int("id").autoincrement().primaryKey(),
  /** ID do candidato à sucessão */
  candidateId: int("candidateId").notNull(),
  /** Data da avaliação */
  assessmentDate: timestamp("assessmentDate").notNull(),
  /** Avaliador */
  assessorId: int("assessorId").notNull(),
  /** Nível de prontidão avaliado */
  readinessLevel: mysqlEnum("readinessLevel", ["ready_now", "ready_1_year", "ready_2_years", "ready_3_years", "not_ready"]).notNull(),
  /** Pontos fortes */
  strengths: text("strengths"),
  /** Áreas de desenvolvimento */
  developmentAreas: text("developmentAreas"),
  /** Recomendações */
  recommendations: text("recommendations"),
  /** Score geral (0-100) */
  overallScore: int("overallScore"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReadinessAssessment = typeof readinessAssessments.$inferSelect;
export type InsertReadinessAssessment = typeof readinessAssessments.$inferInsert;

/**
 * Informações Expandidas de Funcionários (estende users)
 */
export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  /** ID do usuário vinculado */
  userId: int("userId").notNull().unique(),
  /** Matrícula/ID funcional */
  employeeNumber: varchar("employeeNumber", { length: 50 }).unique(),
  /** Departamento */
  department: varchar("department", { length: 100 }),
  /** Cargo atual */
  position: varchar("position", { length: 255 }),
  /** Nível hierárquico */
  level: varchar("level", { length: 50 }),
  /** ID do gestor direto */
  managerId: int("managerId"),
  /** Data de admissão */
  hireDate: timestamp("hireDate"),
  /** Tipo de contrato */
  contractType: mysqlEnum("contractType", ["clt", "pj", "estagio", "temporario", "terceirizado"]),
  /** Status do funcionário */
  status: mysqlEnum("status", ["ativo", "ferias", "afastado", "desligado"]).default("ativo").notNull(),
  /** Localização/Escritório */
  location: varchar("location", { length: 100 }),
  /** Telefone */
  phone: varchar("phone", { length: 20 }),
  /** Data de nascimento */
  birthDate: timestamp("birthDate"),
  /** Salário base (armazenado em centavos para precisão) */
  baseSalary: int("baseSalary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

/**
 * Histórico de Cargos e Movimentações
 */
export const positionHistory = mysqlTable("positionHistory", {
  id: int("id").autoincrement().primaryKey(),
  /** ID do funcionário */
  employeeId: int("employeeId").notNull(),
  /** Tipo de movimentação */
  type: mysqlEnum("type", ["admissao", "promocao", "transferencia", "rebaixamento", "desligamento"]).notNull(),
  /** Cargo anterior */
  previousPosition: varchar("previousPosition", { length: 255 }),
  /** Novo cargo */
  newPosition: varchar("newPosition", { length: 255 }).notNull(),
  /** Departamento anterior */
  previousDepartment: varchar("previousDepartment", { length: 100 }),
  /** Novo departamento */
  newDepartment: varchar("newDepartment", { length: 100 }),
  /** Salário anterior (em centavos) */
  previousSalary: int("previousSalary"),
  /** Novo salário (em centavos) */
  newSalary: int("newSalary"),
  /** Data efetiva da mudança */
  effectiveDate: timestamp("effectiveDate").notNull(),
  /** Motivo/Justificativa */
  reason: text("reason"),
  /** Aprovado por */
  approvedBy: int("approvedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PositionHistory = typeof positionHistory.$inferSelect;
export type InsertPositionHistory = typeof positionHistory.$inferInsert;

/**
 * Registros de Ponto
 */
export const timeRecords = mysqlTable("timeRecords", {
  id: int("id").autoincrement().primaryKey(),
  /** ID do funcionário */
  employeeId: int("employeeId").notNull(),
  /** Data do registro */
  date: timestamp("date").notNull(),
  /** Hora de entrada */
  checkIn: timestamp("checkIn"),
  /** Hora de saída para almoço */
  lunchOut: timestamp("lunchOut"),
  /** Hora de retorno do almoço */
  lunchIn: timestamp("lunchIn"),
  /** Hora de saída */
  checkOut: timestamp("checkOut"),
  /** Total de horas trabalhadas (em minutos) */
  totalMinutes: int("totalMinutes"),
  /** Horas extras (em minutos) */
  overtimeMinutes: int("overtimeMinutes").default(0),
  /** Status do registro */
  status: mysqlEnum("status", ["normal", "falta", "atestado", "ferias", "folga", "pendente_ajuste"]).default("normal").notNull(),
  /** Observações */
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TimeRecord = typeof timeRecords.$inferSelect;
export type InsertTimeRecord = typeof timeRecords.$inferInsert;

/**
 * Solicitações de Ajuste de Ponto
 */
export const timeAdjustments = mysqlTable("timeAdjustments", {
  id: int("id").autoincrement().primaryKey(),
  /** ID do registro de ponto */
  timeRecordId: int("timeRecordId").notNull(),
  /** ID do solicitante */
  requestedBy: int("requestedBy").notNull(),
  /** Tipo de ajuste */
  type: mysqlEnum("type", ["entrada", "saida", "almoco_saida", "almoco_retorno", "justificativa_falta"]).notNull(),
  /** Valor original */
  originalValue: timestamp("originalValue"),
  /** Novo valor solicitado */
  requestedValue: timestamp("requestedValue"),
  /** Justificativa */
  justification: text("justification").notNull(),
  /** Status da solicitação */
  status: mysqlEnum("status", ["pendente", "aprovado", "rejeitado"]).default("pendente").notNull(),
  /** Aprovado/Rejeitado por */
  reviewedBy: int("reviewedBy"),
  /** Data da revisão */
  reviewedAt: timestamp("reviewedAt"),
  /** Comentários do revisor */
  reviewComments: text("reviewComments"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TimeAdjustment = typeof timeAdjustments.$inferSelect;
export type InsertTimeAdjustment = typeof timeAdjustments.$inferInsert;

/**
 * Banco de Horas
 */
export const timeBank = mysqlTable("timeBank", {
  id: int("id").autoincrement().primaryKey(),
  /** ID do funcionário */
  employeeId: int("employeeId").notNull(),
  /** Período (mês/ano) */
  period: varchar("period", { length: 20 }).notNull(),
  /** Saldo de horas (em minutos, pode ser negativo) */
  balanceMinutes: int("balanceMinutes").default(0).notNull(),
  /** Horas extras acumuladas */
  overtimeMinutes: int("overtimeMinutes").default(0).notNull(),
  /** Horas compensadas */
  compensatedMinutes: int("compensatedMinutes").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TimeBank = typeof timeBank.$inferSelect;
export type InsertTimeBank = typeof timeBank.$inferInsert;

/**
 * Pendências Unificadas
 */
export const pendencies = mysqlTable("pendencies", {
  id: int("id").autoincrement().primaryKey(),
  /** ID do usuário com pendência */
  userId: int("userId").notNull(),
  /** Tipo de pendência */
  type: mysqlEnum("type", ["avaliacao", "aprovacao", "documento", "meta", "pdi", "ponto", "treinamento", "outro"]).notNull(),
  /** Título da pendência */
  title: varchar("title", { length: 255 }).notNull(),
  /** Descrição */
  description: text("description"),
  /** Prioridade */
  priority: mysqlEnum("priority", ["baixa", "media", "alta", "urgente"]).default("media").notNull(),
  /** Status */
  status: mysqlEnum("status", ["pendente", "em_andamento", "concluida", "cancelada"]).default("pendente").notNull(),
  /** Data limite */
  dueDate: timestamp("dueDate"),
  /** Link/referência para o item relacionado */
  referenceId: int("referenceId"),
  /** Tipo de referência */
  referenceType: varchar("referenceType", { length: 50 }),
  /** Concluída em */
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Pendency = typeof pendencies.$inferSelect;
export type InsertPendency = typeof pendencies.$inferInsert;

/**
 * Aprovações Unificadas
 */
export const approvals = mysqlTable("approvals", {
  id: int("id").autoincrement().primaryKey(),
  /** Tipo de item a ser aprovado */
  itemType: mysqlEnum("itemType", ["pir", "job_description", "time_adjustment", "development_plan", "bonus", "expense", "outro"]).notNull(),
  /** ID do item */
  itemId: int("itemId").notNull(),
  /** Título/Descrição */
  title: varchar("title", { length: 255 }).notNull(),
  /** ID do solicitante */
  requestedBy: int("requestedBy").notNull(),
  /** ID do aprovador */
  approverId: int("approverId").notNull(),
  /** Status */
  status: mysqlEnum("status", ["pendente", "aprovado", "rejeitado"]).default("pendente").notNull(),
  /** Comentários do aprovador */
  comments: text("comments"),
  /** Data da decisão */
  decidedAt: timestamp("decidedAt"),
  /** Prioridade */
  priority: mysqlEnum("priority", ["baixa", "media", "alta", "urgente"]).default("media").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Approval = typeof approvals.$inferSelect;
export type InsertApproval = typeof approvals.$inferInsert;

/**
 * Programas de Bônus
 */
export const bonusPrograms = mysqlTable("bonusPrograms", {
  id: int("id").autoincrement().primaryKey(),
  /** Nome do programa */
  name: varchar("name", { length: 255 }).notNull(),
  /** Descrição */
  description: text("description"),
  /** Tipo de bônus */
  type: mysqlEnum("type", ["performance", "goal_achievement", "profit_sharing", "retention", "project", "spot"]).notNull(),
  /** Período de vigência */
  period: varchar("period", { length: 100 }).notNull(),
  /** Data de início */
  startDate: timestamp("startDate").notNull(),
  /** Data de término */
  endDate: timestamp("endDate").notNull(),
  /** Orçamento total (em centavos) */
  totalBudget: int("totalBudget"),
  /** Status do programa */
  status: mysqlEnum("status", ["planejamento", "ativo", "em_calculo", "pago", "cancelado"]).default("planejamento").notNull(),
  /** Critérios de elegibilidade (JSON) */
  eligibilityCriteria: text("eligibilityCriteria"),
  /** Fórmula de cálculo (JSON) */
  calculationFormula: text("calculationFormula"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BonusProgram = typeof bonusPrograms.$inferSelect;
export type InsertBonusProgram = typeof bonusPrograms.$inferInsert;

/**
 * Elegibilidade de Bônus
 */
export const bonusEligibility = mysqlTable("bonusEligibility", {
  id: int("id").autoincrement().primaryKey(),
  /** ID do programa */
  programId: int("programId").notNull(),
  /** ID do funcionário */
  employeeId: int("employeeId").notNull(),
  /** Elegível */
  isEligible: boolean("isEligible").default(true).notNull(),
  /** Motivo de inelegibilidade */
  ineligibilityReason: text("ineligibilityReason"),
  /** Peso/Multiplicador individual */
  multiplier: int("multiplier").default(100).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BonusEligibility = typeof bonusEligibility.$inferSelect;
export type InsertBonusEligibility = typeof bonusEligibility.$inferInsert;

/**
 * Cálculos de Bônus
 */
export const bonusCalculations = mysqlTable("bonusCalculations", {
  id: int("id").autoincrement().primaryKey(),
  /** ID do programa */
  programId: int("programId").notNull(),
  /** ID do funcionário */
  employeeId: int("employeeId").notNull(),
  /** Valor base calculado (em centavos) */
  baseAmount: int("baseAmount").notNull(),
  /** Multiplicadores aplicados (JSON) */
  appliedMultipliers: text("appliedMultipliers"),
  /** Valor final (em centavos) */
  finalAmount: int("finalAmount").notNull(),
  /** Score de desempenho */
  performanceScore: int("performanceScore"),
  /** Percentual de atingimento de metas */
  goalAchievementPercentage: int("goalAchievementPercentage"),
  /** Status do pagamento */
  paymentStatus: mysqlEnum("paymentStatus", ["calculado", "aprovado", "pago", "cancelado"]).default("calculado").notNull(),
  /** Data de pagamento */
  paidAt: timestamp("paidAt"),
  /** Notas */
  notes: text("notes"),
  calculatedBy: int("calculatedBy").notNull(),
  calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
});

export type BonusCalculation = typeof bonusCalculations.$inferSelect;
export type InsertBonusCalculation = typeof bonusCalculations.$inferInsert;

/**
 * Métricas de Analytics (agregadas)
 */
export const analyticsMetrics = mysqlTable("analyticsMetrics", {
  id: int("id").autoincrement().primaryKey(),
  /** Tipo de métrica */
  metricType: varchar("metricType", { length: 100 }).notNull(),
  /** Período (ano-mês ou ano-trimestre) */
  period: varchar("period", { length: 20 }).notNull(),
  /** Dimensão (departamento, cargo, etc) */
  dimension: varchar("dimension", { length: 100 }),
  /** Valor da dimensão */
  dimensionValue: varchar("dimensionValue", { length: 255 }),
  /** Valor da métrica */
  value: int("value").notNull(),
  /** Dados adicionais (JSON) */
  metadata: text("metadata"),
  calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
});

export type AnalyticsMetric = typeof analyticsMetrics.$inferSelect;
export type InsertAnalyticsMetric = typeof analyticsMetrics.$inferInsert;

/**
 * Ciclos de Avaliação (Configuração)
 */
export const evaluationCycles = mysqlTable("evaluationCycles", {
  id: int("id").autoincrement().primaryKey(),
  /** Nome do ciclo */
  name: varchar("name", { length: 255 }).notNull(),
  /** Ano */
  year: int("year").notNull(),
  /** Tipo de ciclo */
  type: mysqlEnum("type", ["anual", "semestral", "trimestral", "mensal"]).notNull(),
  /** Data de início */
  startDate: timestamp("startDate").notNull(),
  /** Data de término */
  endDate: timestamp("endDate").notNull(),
  /** Status */
  status: mysqlEnum("status", ["planejamento", "ativo", "em_avaliacao", "concluido", "cancelado"]).default("planejamento").notNull(),
  /** Template padrão para este ciclo */
  defaultTemplateId: int("defaultTemplateId"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EvaluationCycle = typeof evaluationCycles.$inferSelect;
export type InsertEvaluationCycle = typeof evaluationCycles.$inferInsert;

/**
 * Competências Organizacionais (Biblioteca)
 */
export const competencies = mysqlTable("competencies", {
  id: int("id").autoincrement().primaryKey(),
  /** Nome da competência */
  name: varchar("name", { length: 255 }).notNull(),
  /** Tipo */
  type: mysqlEnum("type", ["tecnica", "comportamental", "lideranca"]).notNull(),
  /** Descrição */
  description: text("description"),
  /** Categoria */
  category: varchar("category", { length: 100 }),
  /** Níveis de proficiência (JSON) */
  proficiencyLevels: text("proficiencyLevels"),
  /** Ativa */
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Competency = typeof competencies.$inferSelect;
export type InsertCompetency = typeof competencies.$inferInsert;

/**
 * Departamentos
 */
export const departments = mysqlTable("departments", {
  id: int("id").autoincrement().primaryKey(),
  /** Nome do departamento */
  name: varchar("name", { length: 255 }).notNull().unique(),
  /** Código */
  code: varchar("code", { length: 50 }).unique(),
  /** Descrição */
  description: text("description"),
  /** ID do departamento pai (para hierarquia) */
  parentId: int("parentId"),
  /** ID do gestor do departamento */
  managerId: int("managerId"),
  /** Ativo */
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = typeof departments.$inferInsert;

/**
 * Logs do Sistema
 */
export const systemLogs = mysqlTable("systemLogs", {
  id: int("id").autoincrement().primaryKey(),
  /** Tipo de log */
  type: mysqlEnum("type", ["info", "warning", "error", "security", "audit"]).notNull(),
  /** Módulo/Área */
  module: varchar("module", { length: 100 }).notNull(),
  /** Ação realizada */
  action: varchar("action", { length: 255 }).notNull(),
  /** ID do usuário (se aplicável) */
  userId: int("userId"),
  /** Detalhes (JSON) */
  details: text("details"),
  /** IP do usuário */
  ipAddress: varchar("ipAddress", { length: 45 }),
  /** User Agent */
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SystemLog = typeof systemLogs.$inferSelect;
export type InsertSystemLog = typeof systemLogs.$inferInsert;
