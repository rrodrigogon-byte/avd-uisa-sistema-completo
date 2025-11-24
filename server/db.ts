import { eq, and, gte, lt, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, criticalGoalAlerts, CriticalGoalAlert, InsertCriticalGoalAlert, scheduledReports, ScheduledReport, InsertScheduledReport, reportExecutionLogs, InsertReportExecutionLog, goalMonitoringLogs, InsertGoalMonitoringLog } from "../drizzle/schema";
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

// ============ CRITICAL GOAL ALERTS ============

export async function createCriticalAlert(alert: InsertCriticalGoalAlert): Promise<CriticalGoalAlert> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(criticalGoalAlerts).values(alert);
  const inserted = await db.select().from(criticalGoalAlerts).where(eq(criticalGoalAlerts.id, Number(result[0].insertId))).limit(1);
  return inserted[0];
}

export async function getCriticalAlerts(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(criticalGoalAlerts)
    .where(eq(criticalGoalAlerts.userId, userId))
    .orderBy(desc(criticalGoalAlerts.createdAt))
    .limit(limit);
}

export async function markAlertAsRead(alertId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(criticalGoalAlerts)
    .set({ isRead: 1 })
    .where(eq(criticalGoalAlerts.id, alertId));
}

export async function resolveAlert(alertId: number, actionTaken: string) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(criticalGoalAlerts)
    .set({ 
      actionTaken,
      resolvedAt: new Date(),
      isRead: 1
    })
    .where(eq(criticalGoalAlerts.id, alertId));
}

// ============ SCHEDULED REPORTS ============

export async function createScheduledReport(report: InsertScheduledReport): Promise<ScheduledReport> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(scheduledReports).values(report);
  const inserted = await db.select().from(scheduledReports).where(eq(scheduledReports.id, Number(result[0].insertId))).limit(1);
  return inserted[0];
}

export async function getScheduledReports(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(scheduledReports)
    .where(eq(scheduledReports.userId, userId))
    .orderBy(desc(scheduledReports.createdAt));
}

export async function getActiveScheduledReports() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(scheduledReports)
    .where(eq(scheduledReports.isActive, 1));
}

export async function updateScheduledReport(reportId: number, updates: Partial<ScheduledReport>) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(scheduledReports)
    .set(updates)
    .where(eq(scheduledReports.id, reportId));
}

export async function deleteScheduledReport(reportId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(scheduledReports).where(eq(scheduledReports.id, reportId));
}

// ============ REPORT EXECUTION LOGS ============

export async function logReportExecution(log: InsertReportExecutionLog) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(reportExecutionLogs).values(log);
}

export async function getReportExecutionLogs(reportId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(reportExecutionLogs)
    .where(eq(reportExecutionLogs.reportId, reportId))
    .orderBy(desc(reportExecutionLogs.executedAt))
    .limit(limit);
}

// ============ GOAL MONITORING LOGS ============

export async function logGoalMonitoring(log: InsertGoalMonitoringLog) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(goalMonitoringLogs).values(log);
}

export async function getLatestMonitoringLog() {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select()
    .from(goalMonitoringLogs)
    .orderBy(desc(goalMonitoringLogs.executedAt))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}
