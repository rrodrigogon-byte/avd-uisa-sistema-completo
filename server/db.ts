import { and, desc, eq, gte, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  auditLogs,
  departments,
  developmentActions,
  employeeCompetencies,
  employees,
  type InsertEmployee,
  evaluationCycles,
  goals,
  InsertUser,
  nineBoxPositions,
  pdiItems,
  pdiPlans,
  performanceEvaluations,
  positions,
  users,
  pendencias,
  type InsertPendencia,
  type Pendencia,
  evaluationProcesses,
  processParticipants,
  processEvaluators,
  formTemplates,
  formSections,
  formQuestions,
  formResponses,
  consolidatedReports,
  reportExports,
  successionCandidates,
  employeeHierarchy,
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

  const results = await db
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

  return results;
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



/**
 * Busca o salário e o ID do cargo do colaborador (em centavos)
 * CRÍTICO para cálculo de bônus e produtividade
 */
export async function getEmployeeSalary(employeeId: number): Promise<{ salary: number | null; positionId: number | null; positionTitle: string | null } | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select({ 
        salary: employees.salary, 
        positionId: employees.positionId,
        positionTitle: positions.title,
    })
    .from(employees)
    .leftJoin(positions, eq(employees.positionId, positions.id))
    .where(eq(employees.id, employeeId))
    .limit(1);

  // Garante que o salário seja retornado como number (em centavos) ou null
  return result.length > 0 ? {
    salary: result[0].salary || null,
    positionId: result[0].positionId || null,
    positionTitle: result[0].positionTitle || null,
  } : undefined;
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
        eq(evaluationCycles.status, "ativo"),
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

// ============================================================================
// COMPETÊNCIAS
// ============================================================================

export async function getAllCompetencies() {
  const db = await getDb();
  if (!db) return [];

  const { competencies } = await import("../drizzle/schema");
  
  return await db
    .select()
    .from(competencies)
    .where(eq(competencies.active, true))
    .orderBy(competencies.name);
}


// ============================================================================
// GESTÃO DE USUÁRIOS - ITEM 1
// ============================================================================

/**
 * Listar todos os funcionários com filtros
 */
export async function listEmployees(filters?: {
  departmentId?: number;
  positionId?: number;
  status?: string;
  search?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  // Construir condições WHERE
  const conditions = [];
  
  // Status padrão: ativo
  if (filters?.status) {
    conditions.push(eq(employees.status, filters.status as any));
  } else {
    conditions.push(eq(employees.status, "ativo"));
  }

  // Filtros adicionais
  if (filters?.departmentId) {
    conditions.push(eq(employees.departmentId, filters.departmentId));
  }
  if (filters?.positionId) {
    conditions.push(eq(employees.positionId, filters.positionId));
  }

  // Busca por nome ou email (SQL LIKE para performance)
  if (filters?.search && filters.search.trim()) {
    const searchPattern = `%${filters.search.trim()}%`;
    conditions.push(
      or(
        sql`${employees.name} LIKE ${searchPattern}`,
        sql`${employees.email} LIKE ${searchPattern}`
      )
    );
  }

  // Executar query com todas as condições
  const results = await db
    .select({
      employee: employees,
      department: departments,
      position: positions,
    })
    .from(employees)
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(positions, eq(employees.positionId, positions.id))
    .where(and(...conditions))
    .limit(100); // Limitar a 100 resultados para performance

  // Retornar estrutura com objetos aninhados para compatibilidade com o frontend
  return results.map((row) => ({
    employee: row.employee,
    department: row.department,
    position: row.position,
  }));
}

/**
 * Criar ou atualizar funcionário
 */
export async function upsertEmployee(employeeData: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { InsertEmployee } = await import("../drizzle/schema");

  if (employeeData.id) {
    // Atualizar
    await db
      .update(employees)
      .set({ ...employeeData, updatedAt: new Date() })
      .where(eq(employees.id, employeeData.id));
    return employeeData.id;
  } else {
    // Criar
    const result = await db.insert(employees).values(employeeData);
    return result[0].insertId;
  }
}

/**
 * Desativar funcionário
 */
export async function deactivateEmployee(employeeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(employees)
    .set({ active: false, status: "desligado", updatedAt: new Date() })
    .where(eq(employees.id, employeeId));
}

/**
 * Reativar funcionário
 */
export async function reactivateEmployee(employeeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(employees)
    .set({ active: true, status: "ativo", updatedAt: new Date() })
    .where(eq(employees.id, employeeId));
}

/**
 * Registrar log de auditoria de funcionário
 */
export async function logEmployeeAudit(auditData: {
  employeeId: number;
  action: "criado" | "atualizado" | "desativado" | "reativado" | "excluido";
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  changedBy: number;
  ipAddress?: string;
  userAgent?: string;
}) {
  const db = await getDb();
  if (!db) return;
  const { employeeAuditLog } = await import("../drizzle/schema");
  await db.insert(employeeAuditLog).values(auditData);
}

/**
 * Obter histórico de auditoria de um funcionário
 */
export async function getEmployeeAuditLog(employeeId: number) {
  const db = await getDb();
  if (!db) return [];

  const { employeeAuditLog } = await import("../drizzle/schema");

  return await db
    .select()
    .from(employeeAuditLog)
    .where(eq(employeeAuditLog.employeeId, employeeId))
    .orderBy(desc(employeeAuditLog.changedAt));
}

// ============================================================================
// SISTEMA DE AVALIAÇÕES - ITEM 2
// ============================================================================

/**
 * Listar critérios de avaliação ativos
 */
export async function listEvaluationCriteria(category?: string) {
  const db = await getDb();
  if (!db) return [];

  const { evaluationCriteria } = await import("../drizzle/schema");

  const conditions = [eq(evaluationCriteria.isActive, true)];
  if (category) {
    conditions.push(eq(evaluationCriteria.category, category as any));
  }

  return await db
    .select()
    .from(evaluationCriteria)
    .where(and(...conditions))
    .orderBy(evaluationCriteria.displayOrder);
}

/**
 * Criar critério de avaliação
 */
export async function createEvaluationCriteria(criteriaData: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { evaluationCriteria } = await import("../drizzle/schema");

  const result = await db.insert(evaluationCriteria).values(criteriaData);
  return result[0].insertId;
}

/**
 * Criar instância de avaliação
 */
export async function createEvaluationInstance(instanceData: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { evaluationInstances } = await import("../drizzle/schema");

  const result = await db.insert(evaluationInstances).values({
    ...instanceData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return result[0].insertId;
}

/**
 * Listar avaliações de um funcionário
 */
export async function getEmployeeEvaluations(employeeId: number) {
  const db = await getDb();
  if (!db) return [];

  const { evaluationInstances } = await import("../drizzle/schema");

  return await db
    .select()
    .from(evaluationInstances)
    .where(eq(evaluationInstances.employeeId, employeeId))
    .orderBy(desc(evaluationInstances.createdAt));
}

/**
 * Atualizar status de avaliação
 */
export async function updateEvaluationStatus(
  instanceId: number,
  status: string,
  additionalData?: any
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { evaluationInstances } = await import("../drizzle/schema");

  await db
    .update(evaluationInstances)
    .set({
      status: status as any,
      ...additionalData,
      updatedAt: new Date(),
    })
    .where(eq(evaluationInstances.id, instanceId));
}

/**
 * Salvar resposta de critério
 */
export async function saveEvaluationResponse(responseData: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { evaluationCriteriaResponses } = await import("../drizzle/schema");

  const result = await db.insert(evaluationCriteriaResponses).values({
    ...responseData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return result[0].insertId;
}

/**
 * Obter respostas de uma avaliação
 */
export async function getEvaluationResponses(instanceId: number) {
  const db = await getDb();
  if (!db) return [];

  const { evaluationCriteriaResponses } = await import("../drizzle/schema");

  return await db
    .select()
    .from(evaluationCriteriaResponses)
    .where(eq(evaluationCriteriaResponses.instanceId, instanceId));
}

// ============================================================================
// RELATÓRIOS E MÉTRICAS - ITEM 3
// ============================================================================

/**
 * Obter métricas de desempenho
 */
export async function getPerformanceMetrics(filters: {
  employeeId?: number;
  departmentId?: number;
  periodYear: number;
  periodMonth?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const { performanceMetrics } = await import("../drizzle/schema");

  const conditions = [eq(performanceMetrics.periodYear, filters.periodYear)];
  if (filters.employeeId) {
    conditions.push(eq(performanceMetrics.employeeId, filters.employeeId));
  }
  if (filters.departmentId) {
    conditions.push(eq(performanceMetrics.departmentId, filters.departmentId));
  }
  if (filters.periodMonth) {
    conditions.push(eq(performanceMetrics.periodMonth, filters.periodMonth));
  }

  return await db
    .select()
    .from(performanceMetrics)
    .where(and(...conditions));
}

/**
 * Obter histórico de desempenho de um funcionário
 */
export async function getPerformanceHistory(employeeId: number) {
  const db = await getDb();
  if (!db) return [];

  const { performanceHistory } = await import("../drizzle/schema");

  return await db
    .select()
    .from(performanceHistory)
    .where(eq(performanceHistory.employeeId, employeeId))
    .orderBy(desc(performanceHistory.evaluationDate));
}

/**
 * Obter resumo de desempenho por departamento
 */
export async function getDepartmentPerformanceSummary(
  departmentId: number,
  periodYear: number,
  periodQuarter?: number
) {
  const db = await getDb();
  if (!db) return null;

  const { departmentPerformanceSummary } = await import("../drizzle/schema");

  const conditions = [
    eq(departmentPerformanceSummary.departmentId, departmentId),
    eq(departmentPerformanceSummary.periodYear, periodYear)
  ];

  if (periodQuarter) {
    conditions.push(eq(departmentPerformanceSummary.periodQuarter, periodQuarter));
  }

  const results = await db
    .select()
    .from(departmentPerformanceSummary)
    .where(and(...conditions))
    .limit(1);

  return results.length > 0 ? results[0] : null;
}

/**
 * Calcular e salvar métricas de desempenho
 */
export async function calculatePerformanceMetrics(
  employeeId: number,
  periodYear: number,
  periodMonth?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { performanceMetrics, evaluationInstances } = await import("../drizzle/schema");

  // Buscar avaliações do período
  const evaluations = await db
    .select()
    .from(evaluationInstances)
    .where(
      and(
        eq(evaluationInstances.employeeId, employeeId),
        eq(evaluationInstances.status, "concluida")
      )
    );

  // Calcular métricas
  const totalEvaluations = evaluations.length;
  const completedEvaluations = evaluations.filter(
    (e) => e.status === "concluida"
  ).length;
  const pendingEvaluations = evaluations.filter(
    (e) => e.status === "pendente"
  ).length;

  const scores = evaluations
    .filter((e) => e.totalScore !== null)
    .map((e) => e.totalScore!);
  const averageScore =
    scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100)
      : null;

  // Salvar métricas
  await db.insert(performanceMetrics).values({
    employeeId,
    periodYear,
    periodMonth: periodMonth || null,
    totalEvaluations,
    completedEvaluations,
    pendingEvaluations,
    averageScore,
    calculatedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}


// ============================================================================
// HELPERS PARA EVALUATION INSTANCES E COMMENTS
// ============================================================================

/**
 * Buscar instância de avaliação por ID
 */
export async function getEvaluationInstanceById(id: number) {
  const db = await getDb();
  if (!db) return null;

  // Import direto aqui para evitar problemas circulares
  const { evaluationInstances } = await import("../drizzle/schema");
  
  const instances = await db
    .select()
    .from(evaluationInstances)
    .where(eq(evaluationInstances.id, id))
    .limit(1);

  return instances.length > 0 ? instances[0] : null;
}

/**
 * Adicionar comentário em avaliação
 */
export async function addEvaluationComment(data: {
  instanceId: number;
  criteriaId?: number;
  authorId: number;
  comment: string;
  isPrivate: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { evaluationComments } = await import("../drizzle/schema");
  
  const result = await db.insert(evaluationComments).values({
    ...data,
    criteriaId: data.criteriaId || null,
  });

  return { id: result[0].insertId, success: true };
}


// ============================================================================
// GESTÃO DE USUÁRIOS (ADMIN)
// ============================================================================

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(users).orderBy(users.createdAt);
  } catch (error) {
    console.error("[Database] Failed to get all users:", error);
    return [];
  }
}

export async function updateUserRole(userId: number, role: "admin" | "rh" | "gestor" | "colaborador") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    await db.update(users).set({ role }).where(eq(users.id, userId));
  } catch (error) {
    console.error("[Database] Failed to update user role:", error);
    throw error;
  }
}

export async function updateUserSalaryLead(userId: number, isSalaryLead: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    await db.update(users).set({ isSalaryLead }).where(eq(users.id, userId));
  } catch (error) {
    console.error("[Database] Failed to update salary lead status:", error);
    throw error;
  }
}

export async function getUsersByRole(role: "admin" | "rh" | "gestor" | "colaborador") {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(users).where(eq(users.role, role)).orderBy(users.name);
  } catch (error) {
    console.error("[Database] Failed to get users by role:", error);
    return [];
  }
}

export async function searchUsers(searchTerm: string) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const searchPattern = `%${searchTerm}%`;
    return await db
      .select()
      .from(users)
      .where(
        sql`${users.name} LIKE ${searchPattern} OR ${users.email} LIKE ${searchPattern}`
      )
      .orderBy(users.name);
  } catch (error) {
    console.error("[Database] Failed to search users:", error);
    return [];
  }
}

// ============================================================================
// PENDÊNCIAS
// ============================================================================

export async function getAllPendencias(filters?: {
  status?: string;
  prioridade?: string;
  responsavelId?: number;
  categoria?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    let query = db.select().from(pendencias);
    
    const conditions = [];
    if (filters?.status) {
      conditions.push(sql`${pendencias.status} = ${filters.status}`);
    }
    if (filters?.prioridade) {
      conditions.push(sql`${pendencias.prioridade} = ${filters.prioridade}`);
    }
    if (filters?.responsavelId) {
      conditions.push(sql`${pendencias.responsavelId} = ${filters.responsavelId}`);
    }
    if (filters?.categoria) {
      conditions.push(sql`${pendencias.categoria} = ${filters.categoria}`);
    }
    
    if (conditions.length > 0) {
      query = query.where(sql.join(conditions, sql` AND `)) as any;
    }
    
    return await query.orderBy(sql`${pendencias.createdAt} DESC`);
  } catch (error) {
    console.error("[Database] Failed to get pendencias:", error);
    return [];
  }
}

export async function getPendenciaById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  try {
    const result = await db
      .select()
      .from(pendencias)
      .where(sql`${pendencias.id} = ${id}`)
      .limit(1);
    return result[0];
  } catch (error) {
    console.error("[Database] Failed to get pendencia:", error);
    return undefined;
  }
}

export async function createPendencia(data: InsertPendencia) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    const result = await db.insert(pendencias).values(data);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create pendencia:", error);
    throw error;
  }
}

export async function updatePendencia(id: number, data: Partial<InsertPendencia>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    await db
      .update(pendencias)
      .set(data)
      .where(sql`${pendencias.id} = ${id}`);
    return await getPendenciaById(id);
  } catch (error) {
    console.error("[Database] Failed to update pendencia:", error);
    throw error;
  }
}

export async function deletePendencia(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    await db.delete(pendencias).where(sql`${pendencias.id} = ${id}`);
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to delete pendencia:", error);
    throw error;
  }
}

export async function getPendenciasByResponsavel(responsavelId: number) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db
      .select()
      .from(pendencias)
      .where(sql`${pendencias.responsavelId} = ${responsavelId}`)
      .orderBy(sql`${pendencias.createdAt} DESC`);
  } catch (error) {
    console.error("[Database] Failed to get pendencias by responsavel:", error);
    return [];
  }
}

export async function countPendenciasByStatus(responsavelId?: number) {
  const db = await getDb();
  if (!db) return { pendente: 0, em_andamento: 0, concluida: 0, cancelada: 0 };
  
  try {
    let query = db.select().from(pendencias);
    
    if (responsavelId) {
      query = query.where(sql`${pendencias.responsavelId} = ${responsavelId}`) as any;
    }
    
    const results = await query;
    
    return {
      pendente: results.filter(p => p.status === 'pendente').length,
      em_andamento: results.filter(p => p.status === 'em_andamento').length,
      concluida: results.filter(p => p.status === 'concluida').length,
      cancelada: results.filter(p => p.status === 'cancelada').length,
    };
  } catch (error) {
    console.error("[Database] Failed to count pendencias:", error);
    return { pendente: 0, em_andamento: 0, concluida: 0, cancelada: 0 };
  }
}

// ============================================================================
// PLANO DE SUCESSÃO E SUCESSORES
// ============================================================================

import {
  successionPlans,
  type InsertSuccessionPlan,
  type InsertSuccessionCandidate,
  type SuccessionPlan,
  type SuccessionCandidate,
} from "../drizzle/schema";

/**
 * Criar um novo plano de sucessão
 */
export async function createSuccessionPlan(plan: InsertSuccessionPlan) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(successionPlans).values(plan);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create succession plan:", error);
    throw error;
  }
}

/**
 * Listar todos os planos de sucessão
 */
export async function getAllSuccessionPlans() {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(successionPlans)
      .orderBy(sql`${successionPlans.createdAt} DESC`);
  } catch (error) {
    console.error("[Database] Failed to get succession plans:", error);
    return [];
  }
}

/**
 * Buscar plano de sucessão por ID
 */
export async function getSuccessionPlanById(id: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(successionPlans)
      .where(sql`${successionPlans.id} = ${id}`)
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get succession plan:", error);
    return null;
  }
}

/**
 * Buscar plano de sucessão por cargo
 */
export async function getSuccessionPlanByPosition(positionId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(successionPlans)
      .where(sql`${successionPlans.positionId} = ${positionId}`)
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get succession plan by position:", error);
    return null;
  }
}

/**
 * Atualizar plano de sucessão
 */
export async function updateSuccessionPlan(id: number, data: Partial<InsertSuccessionPlan>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db
      .update(successionPlans)
      .set(data)
      .where(sql`${successionPlans.id} = ${id}`);
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to update succession plan:", error);
    throw error;
  }
}

/**
 * Deletar plano de sucessão
 */
export async function deleteSuccessionPlan(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Primeiro deletar todos os sucessores vinculados
    await db.delete(successionCandidates).where(sql`${successionCandidates.planId} = ${id}`);
    // Depois deletar o plano
    await db.delete(successionPlans).where(sql`${successionPlans.id} = ${id}`);
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to delete succession plan:", error);
    throw error;
  }
}

/**
 * Adicionar sucessor ao plano
 */
export async function createSuccessionCandidate(candidate: InsertSuccessionCandidate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(successionCandidates).values(candidate);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create succession candidate:", error);
    throw error;
  }
}

/**
 * Listar sucessores de um plano
 */
export async function getSuccessionCandidatesByPlan(planId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(successionCandidates)
      .where(sql`${successionCandidates.planId} = ${planId}`)
      .orderBy(sql`${successionCandidates.priority} ASC`);
  } catch (error) {
    console.error("[Database] Failed to get succession candidates:", error);
    return [];
  }
}

/**
 * Buscar sucessor por ID
 */
export async function getSuccessionCandidateById(id: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(successionCandidates)
      .where(sql`${successionCandidates.id} = ${id}`)
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get succession candidate:", error);
    return null;
  }
}

/**
 * Atualizar sucessor
 */
export async function updateSuccessionCandidate(id: number, data: Partial<InsertSuccessionCandidate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db
      .update(successionCandidates)
      .set(data)
      .where(sql`${successionCandidates.id} = ${id}`);
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to update succession candidate:", error);
    throw error;
  }
}

/**
 * Deletar sucessor
 */
export async function deleteSuccessionCandidate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db.delete(successionCandidates).where(sql`${successionCandidates.id} = ${id}`);
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to delete succession candidate:", error);
    throw error;
  }
}

/**
 * Listar sucessores de um funcionário específico
 */
export async function getSuccessionCandidatesByEmployee(employeeId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(successionCandidates)
      .where(sql`${successionCandidates.employeeId} = ${employeeId}`)
      .orderBy(sql`${successionCandidates.createdAt} DESC`);
  } catch (error) {
    console.error("[Database] Failed to get succession candidates by employee:", error);
    return [];
  }
}

// ============================================================================
// ONDAS 1, 2 E 3 - PROCESSOS AVALIATIVOS E FORMULÁRIOS DINÂMICOS
// ============================================================================

/**
 * ONDA 1: Processos Avaliativos
 */

/**
 * Criar novo processo avaliativo
 */
export async function createEvaluationProcess(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(evaluationProcesses).values(data);
    return { id: Number(result[0].insertId), success: true };
  } catch (error) {
    console.error("[Database] Failed to create evaluation process:", error);
    throw error;
  }
}

/**
 * Listar todos os processos avaliativos
 */
export async function getAllEvaluationProcesses() {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(evaluationProcesses)
      .orderBy(sql`${evaluationProcesses.createdAt} DESC`);
  } catch (error) {
    console.error("[Database] Failed to get evaluation processes:", error);
    return [];
  }
}

/**
 * Buscar processo avaliativo por ID
 */
export async function getEvaluationProcessById(id: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(evaluationProcesses)
      .where(sql`${evaluationProcesses.id} = ${id}`)
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get evaluation process:", error);
    return null;
  }
}

/**
 * Atualizar processo avaliativo
 */
export async function updateEvaluationProcess(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db
      .update(evaluationProcesses)
      .set(data)
      .where(sql`${evaluationProcesses.id} = ${id}`);
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to update evaluation process:", error);
    throw error;
  }
}

/**
 * Deletar processo avaliativo
 */
export async function deleteEvaluationProcess(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db.delete(evaluationProcesses).where(sql`${evaluationProcesses.id} = ${id}`);
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to delete evaluation process:", error);
    throw error;
  }
}

/**
 * Adicionar participante ao processo
 */
export async function addProcessParticipant(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(processParticipants).values(data);
    return { id: Number(result[0].insertId), success: true };
  } catch (error) {
    console.error("[Database] Failed to add process participant:", error);
    throw error;
  }
}

/**
 * Listar participantes de um processo
 */
export async function getProcessParticipants(processId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(processParticipants)
      .where(sql`${processParticipants.processId} = ${processId}`)
      .orderBy(sql`${processParticipants.createdAt} DESC`);
  } catch (error) {
    console.error("[Database] Failed to get process participants:", error);
    return [];
  }
}

/**
 * Adicionar avaliador ao participante
 */
export async function addProcessEvaluator(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(processEvaluators).values(data);
    return { id: Number(result[0].insertId), success: true };
  } catch (error) {
    console.error("[Database] Failed to add process evaluator:", error);
    throw error;
  }
}

/**
 * Listar avaliadores de um participante
 */
export async function getProcessEvaluators(participantId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(processEvaluators)
      .where(sql`${processEvaluators.participantId} = ${participantId}`)
      .orderBy(sql`${processEvaluators.createdAt} DESC`);
  } catch (error) {
    console.error("[Database] Failed to get process evaluators:", error);
    return [];
  }
}

/**
 * ONDA 2: Formulários Dinâmicos
 */

/**
 * Criar template de formulário
 */
export async function createFormTemplate(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(formTemplates).values(data);
    return { id: Number(result[0].insertId), success: true };
  } catch (error) {
    console.error("[Database] Failed to create form template:", error);
    throw error;
  }
}

/**
 * Listar todos os templates de formulários
 */
export async function getAllFormTemplates() {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(formTemplates)
      .where(sql`${formTemplates.isActive} = true`)
      .orderBy(sql`${formTemplates.createdAt} DESC`);
  } catch (error) {
    console.error("[Database] Failed to get form templates:", error);
    return [];
  }
}

/**
 * Buscar template de formulário por ID
 */
export async function getFormTemplateById(id: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(formTemplates)
      .where(sql`${formTemplates.id} = ${id}`)
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get form template:", error);
    return null;
  }
}

/**
 * Criar seção de formulário
 */
export async function createFormSection(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(formSections).values(data);
    return { id: Number(result[0].insertId), success: true };
  } catch (error) {
    console.error("[Database] Failed to create form section:", error);
    throw error;
  }
}

/**
 * Listar seções de um template
 */
export async function getFormSections(templateId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(formSections)
      .where(sql`${formSections.templateId} = ${templateId}`)
      .orderBy(sql`${formSections.order} ASC`);
  } catch (error) {
    console.error("[Database] Failed to get form sections:", error);
    return [];
  }
}

/**
 * Criar questão de formulário
 */
export async function createFormQuestion(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(formQuestions).values(data);
    return { id: Number(result[0].insertId), success: true };
  } catch (error) {
    console.error("[Database] Failed to create form question:", error);
    throw error;
  }
}

/**
 * Listar questões de uma seção
 */
export async function getFormQuestions(sectionId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(formQuestions)
      .where(sql`${formQuestions.sectionId} = ${sectionId}`)
      .orderBy(sql`${formQuestions.order} ASC`);
  } catch (error) {
    console.error("[Database] Failed to get form questions:", error);
    return [];
  }
}

/**
 * Salvar resposta de formulário
 */
export async function saveFormResponse(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(formResponses).values(data);
    return { id: Number(result[0].insertId), success: true };
  } catch (error) {
    console.error("[Database] Failed to save form response:", error);
    throw error;
  }
}

/**
 * Buscar respostas de um avaliador
 */
export async function getFormResponses(processId: number, evaluatorId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(formResponses)
      .where(
        sql`${formResponses.processId} = ${processId} AND ${formResponses.evaluatorId} = ${evaluatorId}`
      )
      .orderBy(sql`${formResponses.createdAt} DESC`);
  } catch (error) {
    console.error("[Database] Failed to get form responses:", error);
    return [];
  }
}

/**
 * ONDA 3: Relatórios Consolidados
 */

/**
 * Criar relatório consolidado
 */
export async function createConsolidatedReport(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(consolidatedReports).values(data);
    return { id: Number(result[0].insertId), success: true };
  } catch (error) {
    console.error("[Database] Failed to create consolidated report:", error);
    throw error;
  }
}

/**
 * Buscar relatórios consolidados
 */
export async function getConsolidatedReports(filters: any) {
  const db = await getDb();
  if (!db) return [];

  try {
    const conditions = [];
    
    if (filters.processId) {
      conditions.push(eq(consolidatedReports.processId, filters.processId));
    }
    
    if (filters.reportType) {
      conditions.push(eq(consolidatedReports.reportType, filters.reportType));
    }
    
    const query = db.select().from(consolidatedReports);
    const finalQuery = conditions.length > 0 ? query.where(and(...conditions)) : query;
    
    return await finalQuery.orderBy(desc(consolidatedReports.generatedAt));
  } catch (error) {
    console.error("[Database] Failed to get consolidated reports:", error);
    return [];
  }
}

/**
 * Registrar exportação de relatório
 */
export async function createReportExport(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(reportExports).values(data);
    return { id: Number(result[0].insertId), success: true };
  } catch (error) {
    console.error("[Database] Failed to create report export:", error);
    throw error;
  }
}


// ============================================================================
// HIERARQUIA ORGANIZACIONAL
// ============================================================================

/**
 * Buscar hierarquia de um funcionário
 */
export async function getEmployeeHierarchy(employeeId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(employeeHierarchy)
      .where(eq(employeeHierarchy.employeeId, employeeId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get employee hierarchy:", error);
    return null;
  }
}

/**
 * Buscar hierarquia por chapa do funcionário
 */
export async function getEmployeeHierarchyByChapa(chapa: string) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(employeeHierarchy)
      .where(eq(employeeHierarchy.employeeChapa, chapa))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get employee hierarchy by chapa:", error);
    return null;
  }
}

/**
 * Buscar todos os subordinados diretos de um líder
 * @param leaderChapa - Chapa do líder
 * @param level - Nível hierárquico ('coordinator', 'manager', 'director', 'president')
 */
export async function getDirectSubordinates(leaderChapa: string, level: 'coordinator' | 'manager' | 'director' | 'president') {
  const db = await getDb();
  if (!db) return [];

  try {
    let condition;
    
    switch (level) {
      case 'coordinator':
        condition = eq(employeeHierarchy.coordinatorChapa, leaderChapa);
        break;
      case 'manager':
        condition = eq(employeeHierarchy.managerChapa, leaderChapa);
        break;
      case 'director':
        condition = eq(employeeHierarchy.directorChapa, leaderChapa);
        break;
      case 'president':
        condition = eq(employeeHierarchy.presidentChapa, leaderChapa);
        break;
      default:
        return [];
    }

    const result = await db
      .select()
      .from(employeeHierarchy)
      .where(condition)
      .orderBy(employeeHierarchy.employeeName);

    return result;
  } catch (error) {
    console.error("[Database] Failed to get direct subordinates:", error);
    return [];
  }
}

/**
 * Buscar toda a cadeia hierárquica de um funcionário (do funcionário até o presidente)
 */
export async function getHierarchyChain(employeeId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const hierarchy = await getEmployeeHierarchy(employeeId);
    
    if (!hierarchy) return null;

    // Montar cadeia hierárquica
    const chain = {
      employee: {
        id: hierarchy.employeeId,
        chapa: hierarchy.employeeChapa,
        name: hierarchy.employeeName,
        email: hierarchy.employeeEmail,
        function: hierarchy.employeeFunction,
        functionCode: hierarchy.employeeFunctionCode,
        section: hierarchy.employeeSection,
        sectionCode: hierarchy.employeeSectionCode,
      },
      coordinator: hierarchy.coordinatorChapa ? {
        id: hierarchy.coordinatorId,
        chapa: hierarchy.coordinatorChapa,
        name: hierarchy.coordinatorName,
        email: hierarchy.coordinatorEmail,
        function: hierarchy.coordinatorFunction,
      } : null,
      manager: hierarchy.managerChapa ? {
        id: hierarchy.managerId,
        chapa: hierarchy.managerChapa,
        name: hierarchy.managerName,
        email: hierarchy.managerEmail,
        function: hierarchy.managerFunction,
      } : null,
      director: hierarchy.directorChapa ? {
        id: hierarchy.directorId,
        chapa: hierarchy.directorChapa,
        name: hierarchy.directorName,
        email: hierarchy.directorEmail,
        function: hierarchy.directorFunction,
      } : null,
      president: hierarchy.presidentChapa ? {
        id: hierarchy.presidentId,
        chapa: hierarchy.presidentChapa,
        name: hierarchy.presidentName,
        email: hierarchy.presidentEmail,
        function: hierarchy.presidentFunction,
      } : null,
    };

    return chain;
  } catch (error) {
    console.error("[Database] Failed to get hierarchy chain:", error);
    return null;
  }
}

/**
 * Buscar todos os funcionários de uma hierarquia (organograma completo)
 */
export async function getAllHierarchy() {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select()
      .from(employeeHierarchy)
      .orderBy(employeeHierarchy.employeeName);

    return result;
  } catch (error) {
    console.error("[Database] Failed to get all hierarchy:", error);
    return [];
  }
}

/**
 * Buscar estatísticas da hierarquia
 */
export async function getHierarchyStats() {
  const db = await getDb();
  if (!db) return null;

  try {
    const allHierarchy = await getAllHierarchy();
    
    // Contar por nível
    const stats = {
      totalEmployees: allHierarchy.length,
      withCoordinator: allHierarchy.filter(h => h.coordinatorChapa).length,
      withManager: allHierarchy.filter(h => h.managerChapa).length,
      withDirector: allHierarchy.filter(h => h.directorChapa).length,
      withPresident: allHierarchy.filter(h => h.presidentChapa).length,
      uniqueCoordinators: new Set(allHierarchy.map(h => h.coordinatorChapa).filter(Boolean)).size,
      uniqueManagers: new Set(allHierarchy.map(h => h.managerChapa).filter(Boolean)).size,
      uniqueDirectors: new Set(allHierarchy.map(h => h.directorChapa).filter(Boolean)).size,
      uniquePresidents: new Set(allHierarchy.map(h => h.presidentChapa).filter(Boolean)).size,
    };

    return stats;
  } catch (error) {
    console.error("[Database] Failed to get hierarchy stats:", error);
    return null;
  }
}
