import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  evaluationTemplates,
  InsertEvaluationTemplate,
  EvaluationTemplate,
  evaluations,
  InsertEvaluation,
  Evaluation,
  notificationSettings,
  InsertNotificationSetting,
  NotificationSetting,
  notificationLogs,
  InsertNotificationLog,
  NotificationLog,
  reports,
  InsertReport,
  Report,
  pirs,
  pirGoals,
  pirProgress,
  pirApprovalHistory,
  jobDescriptions,
  jobResponsibilities,
  technicalCompetencies,
  behavioralCompetencies,
  jobRequirements,
  jobDescriptionApprovalHistory,
  goals,
  goalProgress,
  developmentPlans,
  developmentActions,
  successionPlans,
  successionCandidates,
  readinessAssessments,
  employees,
  positionHistory,
  timeRecords,
  timeAdjustments,
  timeBank,
  pendencies,
  approvals,
  bonusPrograms,
  bonusEligibility,
  bonusCalculations,
  evaluationCycles,
  competencies,
  departments,
  systemLogs
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// EVALUATION TEMPLATE FUNCTIONS
// ============================================================================

export async function createEvaluationTemplate(template: InsertEvaluationTemplate): Promise<EvaluationTemplate> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(evaluationTemplates).values(template);
  const insertId = Number(result[0].insertId);
  
  const created = await db.select().from(evaluationTemplates).where(eq(evaluationTemplates.id, insertId)).limit(1);
  return created[0];
}

export async function getEvaluationTemplateById(id: number): Promise<EvaluationTemplate | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(evaluationTemplates).where(eq(evaluationTemplates.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllEvaluationTemplates(): Promise<EvaluationTemplate[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(evaluationTemplates).orderBy(desc(evaluationTemplates.createdAt));
}

export async function getActiveEvaluationTemplates(): Promise<EvaluationTemplate[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(evaluationTemplates)
    .where(eq(evaluationTemplates.isActive, true))
    .orderBy(desc(evaluationTemplates.createdAt));
}

export async function updateEvaluationTemplate(id: number, data: Partial<InsertEvaluationTemplate>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(evaluationTemplates).set(data).where(eq(evaluationTemplates.id, id));
}

export async function deleteEvaluationTemplate(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(evaluationTemplates).where(eq(evaluationTemplates.id, id));
}

// ============================================================================
// EVALUATION FUNCTIONS
// ============================================================================

export async function createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(evaluations).values(evaluation);
  const insertId = Number(result[0].insertId);
  
  const created = await db.select().from(evaluations).where(eq(evaluations.id, insertId)).limit(1);
  return created[0];
}

export async function getEvaluationById(id: number): Promise<Evaluation | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(evaluations).where(eq(evaluations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getEvaluationsByEvaluatedUser(userId: number): Promise<Evaluation[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(evaluations)
    .where(eq(evaluations.evaluatedUserId, userId))
    .orderBy(desc(evaluations.createdAt));
}

export async function getEvaluationsByEvaluator(userId: number): Promise<Evaluation[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(evaluations)
    .where(eq(evaluations.evaluatorId, userId))
    .orderBy(desc(evaluations.createdAt));
}

export async function updateEvaluation(id: number, data: Partial<InsertEvaluation>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(evaluations).set(data).where(eq(evaluations.id, id));
}

export async function deleteEvaluation(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(evaluations).where(eq(evaluations.id, id));
}

// ============================================================================
// NOTIFICATION SETTINGS FUNCTIONS
// ============================================================================

export async function getNotificationSettings(userId: number): Promise<NotificationSetting | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(notificationSettings)
    .where(eq(notificationSettings.userId, userId))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertNotificationSettings(settings: InsertNotificationSetting): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(notificationSettings).values(settings).onDuplicateKeyUpdate({
    set: {
      notifyOnNewEvaluation: settings.notifyOnNewEvaluation,
      notifyPendingReminders: settings.notifyPendingReminders,
      notifyOnStatusChange: settings.notifyOnStatusChange,
      reminderDaysBefore: settings.reminderDaysBefore,
      reminderFrequency: settings.reminderFrequency,
    },
  });
}

// ============================================================================
// NOTIFICATION LOG FUNCTIONS
// ============================================================================

export async function createNotificationLog(log: InsertNotificationLog): Promise<NotificationLog> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(notificationLogs).values(log);
  const insertId = Number(result[0].insertId);
  
  const created = await db.select().from(notificationLogs).where(eq(notificationLogs.id, insertId)).limit(1);
  return created[0];
}

export async function getNotificationLogsByUser(userId: number): Promise<NotificationLog[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(notificationLogs)
    .where(eq(notificationLogs.userId, userId))
    .orderBy(desc(notificationLogs.sentAt));
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select().from(notificationLogs)
    .where(and(
      eq(notificationLogs.userId, userId),
      eq(notificationLogs.isRead, false)
    ));
  
  return result.length;
}

export async function markNotificationAsRead(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(notificationLogs).set({ isRead: true }).where(eq(notificationLogs.id, id));
}

export async function markAllNotificationsAsRead(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(notificationLogs)
    .set({ isRead: true })
    .where(and(
      eq(notificationLogs.userId, userId),
      eq(notificationLogs.isRead, false)
    ));
}

// ============================================================================
// REPORT FUNCTIONS
// ============================================================================

export async function createReport(report: InsertReport): Promise<Report> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(reports).values(report);
  const insertId = Number(result[0].insertId);
  
  const created = await db.select().from(reports).where(eq(reports.id, insertId)).limit(1);
  return created[0];
}

export async function getReportById(id: number): Promise<Report | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getReportsByUser(userId: number): Promise<Report[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(reports)
    .where(eq(reports.generatedBy, userId))
    .orderBy(desc(reports.generatedAt));
}

export async function getAllReports(): Promise<Report[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(reports).orderBy(desc(reports.generatedAt));
}

export async function deleteReport(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(reports).where(eq(reports.id, id));
}

// ============================================================================
// PIR FUNCTIONS
// ============================================================================

export async function createPir(pir: any): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(pirs).values(pir);
  const insertId = Number(result[0].insertId);
  
  const created = await db.select().from(pirs).where(eq(pirs.id, insertId)).limit(1);
  return created[0];
}

export async function getPirById(id: number): Promise<any> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(pirs).where(eq(pirs.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPirsByUser(userId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(pirs)
    .where(eq(pirs.userId, userId))
    .orderBy(desc(pirs.createdAt));
}

export async function getPirsByManager(managerId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(pirs)
    .where(eq(pirs.managerId, managerId))
    .orderBy(desc(pirs.createdAt));
}

export async function updatePir(id: number, data: any): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(pirs).set(data).where(eq(pirs.id, id));
}

export async function deletePir(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(pirs).where(eq(pirs.id, id));
}

// ============================================================================
// PIR GOAL FUNCTIONS
// ============================================================================

export async function createPirGoal(goal: any): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(pirGoals).values(goal);
  const insertId = Number(result[0].insertId);
  
  const created = await db.select().from(pirGoals).where(eq(pirGoals.id, insertId)).limit(1);
  return created[0];
}

export async function getPirGoalsByPirId(pirId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(pirGoals)
    .where(eq(pirGoals.pirId, pirId))
    .orderBy(desc(pirGoals.createdAt));
}

export async function updatePirGoal(id: number, data: any): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(pirGoals).set(data).where(eq(pirGoals.id, id));
}

export async function deletePirGoal(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(pirGoals).where(eq(pirGoals.id, id));
}

// ============================================================================
// PIR PROGRESS FUNCTIONS
// ============================================================================

export async function createPirProgress(progress: any): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(pirProgress).values(progress);
  const insertId = Number(result[0].insertId);
  
  const created = await db.select().from(pirProgress).where(eq(pirProgress.id, insertId)).limit(1);
  return created[0];
}

export async function getPirProgressByGoalId(goalId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(pirProgress)
    .where(eq(pirProgress.goalId, goalId))
    .orderBy(desc(pirProgress.recordedAt));
}

// ============================================================================
// JOB DESCRIPTION FUNCTIONS
// ============================================================================

export async function createJobDescription(jobDesc: any): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(jobDescriptions).values(jobDesc);
  const insertId = Number(result[0].insertId);
  
  const created = await db.select().from(jobDescriptions).where(eq(jobDescriptions.id, insertId)).limit(1);
  return created[0];
}

export async function getJobDescriptionById(id: number): Promise<any> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(jobDescriptions).where(eq(jobDescriptions.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getActiveJobDescriptions(): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(jobDescriptions)
    .where(eq(jobDescriptions.isActive, true))
    .orderBy(desc(jobDescriptions.createdAt));
}

export async function getJobDescriptionsByCode(code: string): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(jobDescriptions)
    .where(eq(jobDescriptions.code, code))
    .orderBy(desc(jobDescriptions.version));
}

export async function updateJobDescription(id: number, data: any): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(jobDescriptions).set(data).where(eq(jobDescriptions.id, id));
}

export async function deleteJobDescription(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(jobDescriptions).where(eq(jobDescriptions.id, id));
}

// ============================================================================
// JOB RESPONSIBILITY FUNCTIONS
// ============================================================================

export async function createJobResponsibility(resp: any): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(jobResponsibilities).values(resp);
  const insertId = Number(result[0].insertId);
  
  const created = await db.select().from(jobResponsibilities).where(eq(jobResponsibilities.id, insertId)).limit(1);
  return created[0];
}

export async function getJobResponsibilitiesByJobId(jobDescriptionId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(jobResponsibilities)
    .where(eq(jobResponsibilities.jobDescriptionId, jobDescriptionId))
    .orderBy(jobResponsibilities.displayOrder);
}

export async function deleteJobResponsibility(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(jobResponsibilities).where(eq(jobResponsibilities.id, id));
}

// ============================================================================
// TECHNICAL COMPETENCY FUNCTIONS
// ============================================================================

export async function createTechnicalCompetency(comp: any): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(technicalCompetencies).values(comp);
  const insertId = Number(result[0].insertId);
  
  const created = await db.select().from(technicalCompetencies).where(eq(technicalCompetencies.id, insertId)).limit(1);
  return created[0];
}

export async function getTechnicalCompetenciesByJobId(jobDescriptionId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(technicalCompetencies)
    .where(eq(technicalCompetencies.jobDescriptionId, jobDescriptionId))
    .orderBy(technicalCompetencies.displayOrder);
}

export async function deleteTechnicalCompetency(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(technicalCompetencies).where(eq(technicalCompetencies.id, id));
}

// ============================================================================
// BEHAVIORAL COMPETENCY FUNCTIONS
// ============================================================================

export async function createBehavioralCompetency(comp: any): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(behavioralCompetencies).values(comp);
  const insertId = Number(result[0].insertId);
  
  const created = await db.select().from(behavioralCompetencies).where(eq(behavioralCompetencies.id, insertId)).limit(1);
  return created[0];
}

export async function getBehavioralCompetenciesByJobId(jobDescriptionId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(behavioralCompetencies)
    .where(eq(behavioralCompetencies.jobDescriptionId, jobDescriptionId))
    .orderBy(behavioralCompetencies.displayOrder);
}

export async function deleteBehavioralCompetency(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(behavioralCompetencies).where(eq(behavioralCompetencies.id, id));
}

// ============================================================================
// JOB REQUIREMENT FUNCTIONS
// ============================================================================

export async function createJobRequirement(req: any): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(jobRequirements).values(req);
  const insertId = Number(result[0].insertId);
  
  const created = await db.select().from(jobRequirements).where(eq(jobRequirements.id, insertId)).limit(1);
  return created[0];
}

export async function getJobRequirementsByJobId(jobDescriptionId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(jobRequirements)
    .where(eq(jobRequirements.jobDescriptionId, jobDescriptionId))
    .orderBy(jobRequirements.displayOrder);
}

export async function deleteJobRequirement(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(jobRequirements).where(eq(jobRequirements.id, id));
}

// ============================================================================
// PIR APPROVAL HISTORY FUNCTIONS
// ============================================================================

export async function createPirApprovalHistory(history: any): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(pirApprovalHistory).values(history);
  const insertId = Number(result[0].insertId);
  
  const created = await db.select().from(pirApprovalHistory).where(eq(pirApprovalHistory.id, insertId)).limit(1);
  return created[0];
}

export async function getPirApprovalHistory(pirId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(pirApprovalHistory)
    .where(eq(pirApprovalHistory.pirId, pirId))
    .orderBy(pirApprovalHistory.performedAt);
}

// ============================================================================
// JOB DESCRIPTION APPROVAL HISTORY FUNCTIONS
// ============================================================================

export async function createJobDescriptionApprovalHistory(history: any): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(jobDescriptionApprovalHistory).values(history);
  const insertId = Number(result[0].insertId);
  
  const created = await db.select().from(jobDescriptionApprovalHistory).where(eq(jobDescriptionApprovalHistory.id, insertId)).limit(1);
  return created[0];
}

export async function getJobDescriptionApprovalHistory(jobDescriptionId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(jobDescriptionApprovalHistory)
    .where(eq(jobDescriptionApprovalHistory.jobDescriptionId, jobDescriptionId))
    .orderBy(jobDescriptionApprovalHistory.performedAt);
}

// ==================== METAS (GOALS) ====================

export async function createGoal(goal: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(goals).values(goal);
  return result;
}

export async function getGoalsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(goals).where(eq(goals.userId, userId));
}

export async function getGoalById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(goals).where(eq(goals.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateGoal(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(goals).set(data).where(eq(goals.id, id));
}

export async function deleteGoal(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(goals).where(eq(goals.id, id));
}

export async function createGoalProgress(progress: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(goalProgress).values(progress);
  return result;
}

export async function getGoalProgress(goalId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(goalProgress).where(eq(goalProgress.goalId, goalId));
}

// ==================== PDI (DEVELOPMENT PLANS) ====================

export async function createDevelopmentPlan(plan: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(developmentPlans).values(plan);
  return result;
}

export async function getDevelopmentPlansByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(developmentPlans).where(eq(developmentPlans.userId, userId));
}

export async function getDevelopmentPlanById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(developmentPlans).where(eq(developmentPlans.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateDevelopmentPlan(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(developmentPlans).set(data).where(eq(developmentPlans.id, id));
}

export async function deleteDevelopmentPlan(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(developmentPlans).where(eq(developmentPlans.id, id));
}

export async function createDevelopmentAction(action: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(developmentActions).values(action);
  return result;
}

export async function getDevelopmentActionsByPlan(planId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(developmentActions).where(eq(developmentActions.planId, planId));
}

export async function updateDevelopmentAction(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(developmentActions).set(data).where(eq(developmentActions.id, id));
}

export async function deleteDevelopmentAction(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(developmentActions).where(eq(developmentActions.id, id));
}

// ==================== SUCESSÃO ====================

export async function createSuccessionPlan(plan: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(successionPlans).values(plan);
  return result;
}

export async function getAllSuccessionPlans() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(successionPlans);
}

export async function getSuccessionPlanById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(successionPlans).where(eq(successionPlans.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateSuccessionPlan(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(successionPlans).set(data).where(eq(successionPlans.id, id));
}

export async function deleteSuccessionPlan(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(successionPlans).where(eq(successionPlans.id, id));
}

export async function createSuccessionCandidate(candidate: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(successionCandidates).values(candidate);
  return result;
}

export async function getSuccessionCandidatesByPlan(planId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(successionCandidates).where(eq(successionCandidates.planId, planId));
}

export async function updateSuccessionCandidate(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(successionCandidates).set(data).where(eq(successionCandidates.id, id));
}

export async function deleteSuccessionCandidate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(successionCandidates).where(eq(successionCandidates.id, id));
}

export async function createReadinessAssessment(assessment: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(readinessAssessments).values(assessment);
  return result;
}

export async function getReadinessAssessmentsByCandidate(candidateId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(readinessAssessments).where(eq(readinessAssessments.candidateId, candidateId));
}

// ==================== PESSOAS (EMPLOYEES) ====================

export async function createEmployee(employee: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(employees).values(employee);
  return result;
}

export async function getAllEmployees() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(employees);
}

export async function getEmployeeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getEmployeeByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(employees).where(eq(employees.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateEmployee(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(employees).set(data).where(eq(employees.id, id));
}

export async function deleteEmployee(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(employees).where(eq(employees.id, id));
}

export async function createPositionHistory(history: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(positionHistory).values(history);
  return result;
}

export async function getPositionHistoryByEmployee(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(positionHistory).where(eq(positionHistory.employeeId, employeeId));
}

// ==================== TEMPO (TIME RECORDS) ====================

export async function createTimeRecord(record: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(timeRecords).values(record);
  return result;
}

export async function getTimeRecordsByEmployee(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(timeRecords).where(eq(timeRecords.employeeId, employeeId));
}

export async function getTimeRecordById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(timeRecords).where(eq(timeRecords.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateTimeRecord(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(timeRecords).set(data).where(eq(timeRecords.id, id));
}

export async function createTimeAdjustment(adjustment: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(timeAdjustments).values(adjustment);
  return result;
}

export async function getTimeAdjustmentsByEmployee(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  // Need to join with timeRecords to filter by employee
  return await db.select().from(timeAdjustments);
}

export async function updateTimeAdjustment(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(timeAdjustments).set(data).where(eq(timeAdjustments.id, id));
}

export async function getTimeBankByEmployee(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(timeBank).where(eq(timeBank.employeeId, employeeId));
}

export async function upsertTimeBank(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(timeBank).values(data).onDuplicateKeyUpdate({ set: data });
}

// ==================== PENDÊNCIAS ====================

export async function createPendency(pendency: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(pendencies).values(pendency);
  return result;
}

export async function getPendenciesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(pendencies).where(eq(pendencies.userId, userId));
}

export async function updatePendency(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(pendencies).set(data).where(eq(pendencies.id, id));
}

export async function deletePendency(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(pendencies).where(eq(pendencies.id, id));
}

// ==================== APROVAÇÕES ====================

export async function createApproval(approval: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(approvals).values(approval);
  return result;
}

export async function getApprovalsByApprover(approverId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(approvals).where(eq(approvals.approverId, approverId));
}

export async function getApprovalsByRequester(requestedBy: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(approvals).where(eq(approvals.requestedBy, requestedBy));
}

export async function updateApproval(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(approvals).set(data).where(eq(approvals.id, id));
}

// ==================== BÔNUS ====================

export async function createBonusProgram(program: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(bonusPrograms).values(program);
  return result;
}

export async function getAllBonusPrograms() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(bonusPrograms);
}

export async function getBonusProgramById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bonusPrograms).where(eq(bonusPrograms.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateBonusProgram(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(bonusPrograms).set(data).where(eq(bonusPrograms.id, id));
}

export async function deleteBonusProgram(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(bonusPrograms).where(eq(bonusPrograms.id, id));
}

export async function createBonusEligibility(eligibility: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(bonusEligibility).values(eligibility);
  return result;
}

export async function getBonusEligibilityByProgram(programId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(bonusEligibility).where(eq(bonusEligibility.programId, programId));
}

export async function createBonusCalculation(calculation: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(bonusCalculations).values(calculation);
  return result;
}

export async function getBonusCalculationsByProgram(programId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(bonusCalculations).where(eq(bonusCalculations.programId, programId));
}

export async function getBonusCalculationsByEmployee(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(bonusCalculations).where(eq(bonusCalculations.employeeId, employeeId));
}

// ==================== ADMINISTRAÇÃO ====================

export async function createEvaluationCycle(cycle: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(evaluationCycles).values(cycle);
  return result;
}

export async function getAllEvaluationCycles() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(evaluationCycles);
}

export async function getEvaluationCycleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(evaluationCycles).where(eq(evaluationCycles.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateEvaluationCycle(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(evaluationCycles).set(data).where(eq(evaluationCycles.id, id));
}

export async function createCompetency(competency: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(competencies).values(competency);
  return result;
}

export async function getAllCompetencies() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(competencies);
}

export async function updateCompetency(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(competencies).set(data).where(eq(competencies.id, id));
}

export async function deleteCompetency(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(competencies).where(eq(competencies.id, id));
}

export async function createDepartment(department: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(departments).values(department);
  return result;
}

export async function getAllDepartments() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(departments);
}

export async function updateDepartment(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(departments).set(data).where(eq(departments.id, id));
}

export async function deleteDepartment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(departments).where(eq(departments.id, id));
}

export async function createSystemLog(log: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(systemLogs).values(log);
  return result;
}

export async function getSystemLogs(limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(systemLogs).limit(limit);
}
