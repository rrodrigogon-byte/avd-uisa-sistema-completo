import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  auditLogs,
  departments,
  developmentActions,
  employeeCompetencies,
  employees,
  evaluationCycles,
  goals,
  InsertUser,
  nineBoxPositions,
  pdiItems,
  pdiPlans,
  performanceEvaluations,
  positions,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

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

// ============================================================================
// USUÁRIOS E AUTENTICAÇÃO
// ============================================================================

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
      values.role = "admin";
      updateSet.role = "admin";
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

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// COLABORADORES
// ============================================================================

export async function getAllEmployees() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      employee: employees,
      department: departments,
      position: positions,
    })
    .from(employees)
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(positions, eq(employees.positionId, positions.id))
    .where(eq(employees.status, "ativo"))
    .orderBy(employees.name);
}

export async function getEmployeeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select({
      employee: employees,
      department: departments,
      position: positions,
    })
    .from(employees)
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(positions, eq(employees.positionId, positions.id))
    .where(eq(employees.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getEmployeeByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(employees)
    .where(eq(employees.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// METAS
// ============================================================================

export async function getGoalsByEmployee(employeeId: number, cycleId?: number) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(goals.employeeId, employeeId)];
  if (cycleId) {
    conditions.push(eq(goals.cycleId, cycleId));
  }

  return await db
    .select()
    .from(goals)
    .where(and(...conditions))
    .orderBy(desc(goals.createdAt));
}

export async function getGoalById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(goals).where(eq(goals.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// AVALIAÇÕES 360°
// ============================================================================

export async function getEvaluationsByEmployee(employeeId: number, cycleId?: number) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(performanceEvaluations.employeeId, employeeId)];
  if (cycleId) {
    conditions.push(eq(performanceEvaluations.cycleId, cycleId));
  }

  return await db
    .select()
    .from(performanceEvaluations)
    .where(and(...conditions))
    .orderBy(desc(performanceEvaluations.createdAt));
}

export async function getEvaluationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(performanceEvaluations)
    .where(eq(performanceEvaluations.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// PDI (Plano de Desenvolvimento Individual)
// ============================================================================

export async function getPDIsByEmployee(employeeId: number, cycleId?: number) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(pdiPlans.employeeId, employeeId)];
  if (cycleId) {
    conditions.push(eq(pdiPlans.cycleId, cycleId));
  }

  return await db
    .select()
    .from(pdiPlans)
    .where(and(...conditions))
    .orderBy(desc(pdiPlans.createdAt));
}

export async function getPDIById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(pdiPlans)
    .where(eq(pdiPlans.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getPDIItemsByPlan(planId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(pdiItems)
    .where(eq(pdiItems.planId, planId))
    .orderBy(pdiItems.startDate);
}

export async function getDevelopmentActions() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(developmentActions)
    .where(eq(developmentActions.active, true))
    .orderBy(developmentActions.title);
}

// ============================================================================
// MATRIZ 9-BOX
// ============================================================================

export async function getNineBoxByCycle(cycleId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      nineBox: nineBoxPositions,
      employee: employees,
      position: positions,
    })
    .from(nineBoxPositions)
    .leftJoin(employees, eq(nineBoxPositions.employeeId, employees.id))
    .leftJoin(positions, eq(employees.positionId, positions.id))
    .where(eq(nineBoxPositions.cycleId, cycleId))
    .orderBy(desc(nineBoxPositions.performance), desc(nineBoxPositions.potential));
}

// ============================================================================
// COMPETÊNCIAS
// ============================================================================

export async function getEmployeeCompetencies(employeeId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(employeeCompetencies)
    .where(eq(employeeCompetencies.employeeId, employeeId))
    .orderBy(desc(employeeCompetencies.evaluatedAt));
}

// ============================================================================
// CICLOS DE AVALIAÇÃO
// ============================================================================

export async function getActiveCycle() {
  const db = await getDb();
  if (!db) return undefined;

  const now = new Date();
  const result = await db
    .select()
    .from(evaluationCycles)
    .where(
      and(
        eq(evaluationCycles.status, "em_andamento"),
        lte(evaluationCycles.startDate, now),
        gte(evaluationCycles.endDate, now)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAllCycles() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(evaluationCycles)
    .orderBy(desc(evaluationCycles.year), desc(evaluationCycles.startDate));
}

// ============================================================================
// DEPARTAMENTOS E CARGOS
// ============================================================================

export async function getAllDepartments() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(departments)
    .where(eq(departments.active, true))
    .orderBy(departments.name);
}

export async function getAllPositions() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(positions)
    .where(eq(positions.active, true))
    .orderBy(positions.title);
}

// ============================================================================
// AUDITORIA
// ============================================================================

export async function logAudit(
  userId: number | undefined,
  action: string,
  entity: string,
  entityId: number | undefined,
  changes: any,
  ipAddress?: string,
  userAgent?: string
) {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(auditLogs).values({
      userId: userId || null,
      action,
      entity,
      entityId: entityId || null,
      changes: JSON.stringify(changes),
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });
  } catch (error) {
    console.error("[Database] Failed to log audit:", error);
  }
}

// ============================================================================
// DASHBOARD - ESTATÍSTICAS
// ============================================================================

export async function getDashboardStats(employeeId: number, cycleId?: number) {
  const db = await getDb();
  if (!db) return null;

  const cycle = cycleId ? await db.select().from(evaluationCycles).where(eq(evaluationCycles.id, cycleId)).limit(1) : [];
  const activeCycle = cycle.length > 0 ? cycle[0] : await getActiveCycle();

  if (!activeCycle) return null;

  // Contar metas
  const goalsCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(goals)
    .where(and(eq(goals.employeeId, employeeId), eq(goals.cycleId, activeCycle.id)));

  // Contar PDIs
  const pdisCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(pdiPlans)
    .where(and(eq(pdiPlans.employeeId, employeeId), eq(pdiPlans.cycleId, activeCycle.id)));

  // Contar avaliações
  const evaluationsCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(performanceEvaluations)
    .where(and(eq(performanceEvaluations.employeeId, employeeId), eq(performanceEvaluations.cycleId, activeCycle.id)));

  return {
    cycle: activeCycle,
    goalsCount: goalsCount[0]?.count || 0,
    pdisCount: pdisCount[0]?.count || 0,
    evaluationsCount: evaluationsCount[0]?.count || 0,
  };
}

/**
 * Buscar employee vinculado a um usuário
 */
export async function getUserEmployee(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(employees)
    .where(eq(employees.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}
