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
  Report
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
