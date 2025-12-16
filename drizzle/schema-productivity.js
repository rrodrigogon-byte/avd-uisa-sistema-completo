import { boolean, date, datetime, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
/**
 * Sessões de Rastreamento de Tempo
 * Armazena sessões de trabalho com métricas de produtividade
 */
export const timeTrackingSessions = mysqlTable("timeTrackingSessions", {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(), // ID do usuário
    // Período da sessão
    startTime: datetime("startTime").notNull(),
    endTime: datetime("endTime").notNull(),
    // Métricas de tempo (em minutos)
    activeMinutes: int("activeMinutes").notNull().default(0), // Tempo ativo trabalhando
    idleMinutes: int("idleMinutes").notNull().default(0), // Tempo inativo/pausado
    // Score de produtividade (0-100)
    productivityScore: int("productivityScore").notNull().default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});
/**
 * Atividades Manuais Registradas
 * Funcionário registra atividades manualmente ao longo do dia
 */
export const manualActivities = mysqlTable("manualActivities", {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(), // ID do usuário
    // Dados da atividade
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 100 }), // Reunião, Desenvolvimento, Planejamento, etc
    // Tempo dedicado
    startTime: datetime("startTime").notNull(),
    endTime: datetime("endTime"),
    durationMinutes: int("durationMinutes").notNull(), // Duração em minutos
    // Origem da atividade
    source: mysqlEnum("source", ["manual", "suggestion_accepted", "imported"]).default("manual").notNull(),
    suggestionId: int("suggestionId"), // ID da sugestão que originou (se aplicável)
    // Metadados
    tags: text("tags"), // JSON array de tags
    projectId: int("projectId"), // ID do projeto relacionado (se aplicável)
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
/**
 * Sugestões Inteligentes de Atividades
 * Sistema sugere atividades baseado em padrões de tempo rastreado
 */
export const activitySuggestions = mysqlTable("activitySuggestions", {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(), // ID do usuário
    // Sugestão
    suggestedTitle: varchar("suggestedTitle", { length: 255 }).notNull(),
    suggestedDescription: text("suggestedDescription"),
    suggestedCategory: varchar("suggestedCategory", { length: 100 }),
    // Período identificado
    detectedStartTime: datetime("detectedStartTime").notNull(),
    detectedEndTime: datetime("detectedEndTime").notNull(),
    detectedDurationMinutes: int("detectedDurationMinutes").notNull(),
    // Confiança da sugestão (0-100)
    confidenceScore: int("confidenceScore").notNull().default(50),
    // Padrões identificados (JSON)
    patterns: text("patterns"), // JSON: { timeOfDay, dayOfWeek, similarActivities, etc }
    // Status
    status: mysqlEnum("status", ["pending", "accepted", "rejected", "expired"]).default("pending").notNull(),
    acceptedAt: datetime("acceptedAt"),
    rejectedAt: datetime("rejectedAt"),
    // Atividade criada (se aceita)
    createdActivityId: int("createdActivityId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    expiresAt: datetime("expiresAt").notNull(), // Sugestões expiram após X dias
});
/**
 * Metas de Produtividade
 * Gestores definem metas de horas ativas para funcionários/equipes
 */
export const productivityGoals = mysqlTable("productivityGoals", {
    id: int("id").autoincrement().primaryKey(),
    // Alvo da meta
    targetType: mysqlEnum("targetType", ["individual", "team", "department"]).notNull(),
    targetUserId: int("targetUserId"), // Se individual
    targetTeamId: int("targetTeamId"), // Se equipe
    targetDepartmentId: int("targetDepartmentId"), // Se departamento
    // Meta
    goalType: mysqlEnum("goalType", ["daily_active_hours", "weekly_active_hours", "monthly_active_hours", "productivity_score"]).notNull(),
    targetValue: int("targetValue").notNull(), // Valor alvo (ex: 6 horas, 80% score)
    unit: varchar("unit", { length: 50 }).notNull(), // "hours", "minutes", "percentage"
    // Período de vigência
    startDate: date("startDate").notNull(),
    endDate: date("endDate"),
    // Status
    active: boolean("active").default(true).notNull(),
    // Criador
    createdBy: int("createdBy").notNull(), // ID do gestor
    creatorName: varchar("creatorName", { length: 200 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
/**
 * Progresso de Metas de Produtividade
 * Rastreia o progresso diário/semanal/mensal em relação às metas
 */
export const productivityGoalProgress = mysqlTable("productivityGoalProgress", {
    id: int("id").autoincrement().primaryKey(),
    goalId: int("goalId").notNull(), // ID da meta
    userId: int("userId").notNull(), // ID do usuário
    // Período
    periodType: mysqlEnum("periodType", ["daily", "weekly", "monthly"]).notNull(),
    periodDate: date("periodDate").notNull(), // Data do período (dia, primeira data da semana, primeiro dia do mês)
    // Progresso
    actualValue: int("actualValue").notNull(), // Valor real atingido
    targetValue: int("targetValue").notNull(), // Valor alvo
    achievementPercentage: int("achievementPercentage").notNull(), // % de atingimento (0-100+)
    // Status
    status: mysqlEnum("status", ["below_target", "on_target", "above_target"]).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
