import { and, desc, eq, gte, lte, or, sql, asc, isNull, inArray } from "drizzle-orm";
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
  employeeAttachments,
  type InsertEmployeeAttachment,
  employeeFaceProfiles,
  type InsertEmployeeFaceProfile,
  videoAnalyses,
  type InsertVideoAnalysis,
  videoAnalysisHistory,
  type InsertVideoAnalysisHistory,
  fraudDetectionLogs,
  type InsertFraudDetectionLog,
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
  // Filtrar apenas registros com ID válido para evitar erros no frontend
  return results
    .filter((row) => row.employee && row.employee.id && row.employee.id > 0)
    .map((row) => ({
      id: row.employee.id, // Adicionar ID no nível raiz para facilitar acesso
      employee: row.employee,
      department: row.department,
      position: row.position,
      // Adicionar campos calculados para facilitar uso no frontend
      status: row.employee.status,
      name: row.employee.name,
      email: row.employee.email,
    }));
}

/**
 * Criar ou atualizar funcionário
 */
export async function upsertEmployee(employeeData: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { InsertEmployee } = await import("../drizzle/schema");

  // Converter strings ISO para objetos Date (Drizzle ORM espera Date objects)
  const processedData = { ...employeeData };
  
  if (processedData.birthDate && typeof processedData.birthDate === 'string') {
    processedData.birthDate = new Date(processedData.birthDate);
  }
  
  if (processedData.hireDate && typeof processedData.hireDate === 'string') {
    processedData.hireDate = new Date(processedData.hireDate);
  }

  if (processedData.id) {
    // Atualizar
    await db
      .update(employees)
      .set({ ...processedData, updatedAt: new Date() })
      .where(eq(employees.id, processedData.id));
    return processedData.id;
  } else {
    // Criar
    const result = await db.insert(employees).values(processedData);
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

// ============================================================================
// LIMPEZA E VALIDAÇÃO DE DADOS
// ============================================================================

/**
 * Identificar e reportar registros inconsistentes no banco de dados
 */
export async function identifyInconsistentRecords() {
  const db = await getDb();
  if (!db) return { employees: [], users: [], evaluations: [] };

  const issues: any = {
    employees: [],
    users: [],
    evaluations: [],
    goals: [],
  };

  try {
    // 1. Funcionários sem ID válido ou com dados incompletos
    const allEmployees = await db.select().from(employees);
    issues.employees = allEmployees.filter(
      (emp) =>
        !emp.id ||
        emp.id <= 0 ||
        !emp.name ||
        emp.name.trim() === "" ||
        !emp.email ||
        emp.email.trim() === ""
    );

    // 2. Usuários sem openId ou email
    const allUsers = await db.select().from(users);
    issues.users = allUsers.filter(
      (user) =>
        !user.id ||
        user.id <= 0 ||
        !user.openId ||
        user.openId.trim() === ""
    );

    // 3. Avaliações sem funcionário ou ciclo válido
    const { evaluations } = await import("../drizzle/schema");
    const allEvaluations = await db.select().from(evaluations);
    issues.evaluations = allEvaluations.filter(
      (evaluation) =>
        !evaluation.id ||
        evaluation.id <= 0 ||
        !evaluation.employeeId ||
        evaluation.employeeId <= 0 ||
        !evaluation.cycleId ||
        evaluation.cycleId <= 0
    );

    // 4. Metas sem cycleId válido
    const { smartGoals } = await import("../drizzle/schema");
    const allGoals = await db.select().from(smartGoals);
    issues.goals = allGoals.filter(
      (goal) =>
        !goal.id ||
        goal.id <= 0 ||
        !goal.cycleId ||
        goal.cycleId <= 0
    );

    return issues;
  } catch (error) {
    console.error("[Database] Failed to identify inconsistent records:", error);
    return issues;
  }
}

/**
 * Limpar registros inconsistentes (soft delete)
 * Retorna o número de registros afetados
 */
export async function cleanInconsistentRecords() {
  const db = await getDb();
  if (!db) return { deleted: 0, updated: 0 };

  const stats = { deleted: 0, updated: 0 };

  try {
    // Identificar registros problemáticos
    const issues = await identifyInconsistentRecords();

    // Não deletar, apenas marcar como inativos ou corrigir
    // Para funcionários com dados incompletos, marcar como desligado
    for (const emp of issues.employees) {
      if (emp.id && emp.id > 0) {
        await db
          .update(employees)
          .set({
            status: "desligado",
            active: false,
            updatedAt: new Date(),
          })
          .where(eq(employees.id, emp.id));
        stats.updated++;
      }
    }

    return stats;
  } catch (error) {
    console.error("[Database] Failed to clean inconsistent records:", error);
    return stats;
  }
}

/**
 * Obter perfil completo de um funcionário com todas as informações
 * Inclui: dados básicos, departamento, cargo, testes realizados, avaliações, PDI, metas, etc.
 */
export async function getEmployeeFullProfile(employeeId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    // 1. Dados básicos do funcionário
    const employeeData = await db
      .select({
        employee: employees,
        department: departments,
        position: positions,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(positions, eq(employees.positionId, positions.id))
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (employeeData.length === 0) return null;

    const profile = employeeData[0];

    // 2. Testes Psicométricos realizados
    const { psychometricTests } = await import("../drizzle/schema");
    const tests = await db
      .select()
      .from(psychometricTests)
      .where(eq(psychometricTests.employeeId, employeeId))
      .orderBy(desc(psychometricTests.completedAt));

    // 3. Avaliações 360°
    const { evaluations } = await import("../drizzle/schema");
    const evaluationsData = await db
      .select()
      .from(evaluations)
      .where(eq(evaluations.employeeId, employeeId))
      .orderBy(desc(evaluations.createdAt));

    // 4. Metas SMART
    const { smartGoals } = await import("../drizzle/schema");
    const goals = await db
      .select()
      .from(smartGoals)
      .where(eq(smartGoals.employeeId, employeeId))
      .orderBy(desc(smartGoals.createdAt));

    // 5. PDI (Plano de Desenvolvimento Individual)
    const { pdiPlans } = await import("../drizzle/schema");
    const pdiData = await db
      .select()
      .from(pdiPlans)
      .where(eq(pdiPlans.employeeId, employeeId))
      .orderBy(desc(pdiPlans.createdAt));

    // 6. Feedbacks recebidos
    const { feedbacks } = await import("../drizzle/schema");
    const feedbacksData = await db
      .select()
      .from(feedbacks)
      .where(eq(feedbacks.recipientId, employeeId))
      .orderBy(desc(feedbacks.createdAt))
      .limit(20);

    // 7. Histórico de auditoria
    const auditLog = await getEmployeeAuditLog(employeeId);

    // 8. Competências e habilidades
    const { employeeCompetencies } = await import("../drizzle/schema");
    const competencies = await db
      .select()
      .from(employeeCompetencies)
      .where(eq(employeeCompetencies.employeeId, employeeId));

    // Montar perfil completo
    return {
      // Dados básicos
      id: profile.employee.id,
      employeeCode: profile.employee.employeeCode,
      name: profile.employee.name,
      email: profile.employee.email,
      cpf: profile.employee.cpf,
      birthDate: profile.employee.birthDate,
      hireDate: profile.employee.hireDate,
      status: profile.employee.status,
      active: profile.employee.active,
      phone: profile.employee.phone,
      address: profile.employee.address,
      salary: profile.employee.salary,

      // Relacionamentos
      department: profile.department,
      position: profile.position,
      managerId: profile.employee.managerId,

      // Dados agregados
      tests: tests || [],
      evaluations: evaluationsData || [],
      goals: goals || [],
      pdi: pdiData || [],
      feedbacks: feedbacksData || [],
      auditLog: auditLog || [],
      competencies: competencies || [],

      // Estatísticas
      stats: {
        totalTests: tests?.length || 0,
        totalEvaluations: evaluationsData?.length || 0,
        totalGoals: goals?.length || 0,
        completedGoals: goals?.filter((g) => g.status === "completed").length || 0,
        totalPDI: pdiData?.length || 0,
        totalFeedbacks: feedbacksData?.length || 0,
      },
    };
  } catch (error) {
    console.error("[Database] Failed to get employee full profile:", error);
    return null;
  }
}

/**
 * Buscar árvore hierárquica completa da organização
 * Retorna estrutura em árvore com todos os níveis: Presidente → Diretor → Gestor → Coordenador → Funcionários
 */
export async function getFullHierarchyTree() {
  const db = await getDb();
  if (!db) return [];

  try {
    const allHierarchy = await getAllHierarchy();
    
    if (!allHierarchy || allHierarchy.length === 0) {
      return [];
    }

    // Mapear todos os nós únicos por nível
    const presidents = new Map<string, any>();
    const directors = new Map<string, any>();
    const managers = new Map<string, any>();
    const coordinators = new Map<string, any>();
    const employees = new Map<string, any>();

    // Coletar todos os nós únicos
    for (const h of allHierarchy) {
      // Presidente
      if (h.presidentChapa && !presidents.has(h.presidentChapa)) {
        presidents.set(h.presidentChapa, {
          id: h.presidentId || 0,
          chapa: h.presidentChapa,
          name: h.presidentName || "",
          function: h.presidentFunction || "",
          email: h.presidentEmail,
          level: "presidente" as const,
          children: [],
          subordinatesCount: 0,
        });
      }

      // Diretor
      if (h.directorChapa && !directors.has(h.directorChapa)) {
        directors.set(h.directorChapa, {
          id: h.directorId || 0,
          chapa: h.directorChapa,
          name: h.directorName || "",
          function: h.directorFunction || "",
          email: h.directorEmail,
          level: "diretor" as const,
          parentChapa: h.presidentChapa,
          children: [],
          subordinatesCount: 0,
        });
      }

      // Gestor
      if (h.managerChapa && !managers.has(h.managerChapa)) {
        managers.set(h.managerChapa, {
          id: h.managerId || 0,
          chapa: h.managerChapa,
          name: h.managerName || "",
          function: h.managerFunction || "",
          email: h.managerEmail,
          level: "gestor" as const,
          parentChapa: h.directorChapa,
          children: [],
          subordinatesCount: 0,
        });
      }

      // Coordenador
      if (h.coordinatorChapa && !coordinators.has(h.coordinatorChapa)) {
        coordinators.set(h.coordinatorChapa, {
          id: h.coordinatorId || 0,
          chapa: h.coordinatorChapa,
          name: h.coordinatorName || "",
          function: h.coordinatorFunction || "",
          email: h.coordinatorEmail,
          level: "coordenador" as const,
          parentChapa: h.managerChapa,
          children: [],
          subordinatesCount: 0,
        });
      }

      // Funcionário
      if (h.employeeChapa && !employees.has(h.employeeChapa)) {
        employees.set(h.employeeChapa, {
          id: h.employeeId || 0,
          chapa: h.employeeChapa,
          name: h.employeeName || "",
          function: h.employeeFunction || "",
          email: h.employeeEmail,
          level: "funcionario" as const,
          parentChapa: h.coordinatorChapa || h.managerChapa || h.directorChapa,
          children: [],
          subordinatesCount: 0,
        });
      }
    }

    // Montar árvore hierárquica
    // Conectar funcionários aos coordenadores
    for (const emp of employees.values()) {
      if (emp.parentChapa && coordinators.has(emp.parentChapa)) {
        const coord = coordinators.get(emp.parentChapa);
        coord.children.push(emp);
        coord.subordinatesCount++;
      } else if (emp.parentChapa && managers.has(emp.parentChapa)) {
        const mgr = managers.get(emp.parentChapa);
        mgr.children.push(emp);
        mgr.subordinatesCount++;
      } else if (emp.parentChapa && directors.has(emp.parentChapa)) {
        const dir = directors.get(emp.parentChapa);
        dir.children.push(emp);
        dir.subordinatesCount++;
      }
    }

    // Conectar coordenadores aos gestores
    for (const coord of coordinators.values()) {
      if (coord.parentChapa && managers.has(coord.parentChapa)) {
        const mgr = managers.get(coord.parentChapa);
        mgr.children.push(coord);
        mgr.subordinatesCount += 1 + coord.subordinatesCount;
      }
    }

    // Conectar gestores aos diretores
    for (const mgr of managers.values()) {
      if (mgr.parentChapa && directors.has(mgr.parentChapa)) {
        const dir = directors.get(mgr.parentChapa);
        dir.children.push(mgr);
        dir.subordinatesCount += 1 + mgr.subordinatesCount;
      }
    }

    // Conectar diretores aos presidentes
    for (const dir of directors.values()) {
      if (dir.parentChapa && presidents.has(dir.parentChapa)) {
        const pres = presidents.get(dir.parentChapa);
        pres.children.push(dir);
        pres.subordinatesCount += 1 + dir.subordinatesCount;
      }
    }

    // Ordenar children por nome em cada nível
    const sortChildren = (node: any) => {
      if (node.children && node.children.length > 0) {
        node.children.sort((a: any, b: any) => a.name.localeCompare(b.name));
        node.children.forEach(sortChildren);
      }
    };

    const tree = Array.from(presidents.values());
    tree.forEach(sortChildren);
    tree.sort((a, b) => a.name.localeCompare(b.name));

    return tree;
  } catch (error) {
    console.error("[Database] Failed to get full hierarchy tree:", error);
    return [];
  }
}


// ============================================================================
// CICLO COMPLETO DE AVALIAÇÃO
// ============================================================================

import { eq, and, desc, sql as sqlOperator, inArray } from "drizzle-orm";
import { evaluationResponses, evaluationQuestions, competencies } from "../drizzle/schema";

/**
 * Criar avaliações para todos os funcionários de um ciclo
 */
export async function createEvaluationsForCycle(cycleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Buscar todos os funcionários ativos
    const activeEmployees = await db
      .select()
      .from(employees)
      .where(eq(employees.active, true));

    // Criar avaliação 360° para cada funcionário
    const evaluations = [];
    for (const employee of activeEmployees) {
      const [evaluation] = await db
        .insert(performanceEvaluations)
        .values({
          cycleId,
          employeeId: employee.id,
          type: "360",
          status: "pendente",
          workflowStatus: "pending_self",
          selfEvaluationCompleted: false,
          managerEvaluationCompleted: false,
          peersEvaluationCompleted: false,
          subordinatesEvaluationCompleted: false,
        })
        .$returningId();

      evaluations.push({ ...evaluation, employeeId: employee.id });
    }

    return evaluations;
  } catch (error) {
    console.error("[Database] Failed to create evaluations for cycle:", error);
    throw error;
  }
}

/**
 * Preencher autoavaliação automaticamente (para simulação)
 */
export async function fillSelfEvaluation(evaluationId: number, employeeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Buscar todas as questões ativas
    const questions = await db
      .select()
      .from(evaluationQuestions)
      .where(eq(evaluationQuestions.active, true));

    // Gerar respostas aleatórias mas realistas (3-5)
    const responses = questions.map((question) => ({
      evaluationId,
      questionId: question.id,
      evaluatorId: employeeId,
      evaluatorType: "self" as const,
      score: Math.floor(Math.random() * 3) + 3, // 3, 4 ou 5
    }));

    // Inserir respostas
    await db.insert(evaluationResponses).values(responses);

    // Calcular nota média
    const avgScore = responses.reduce((sum, r) => sum + r.score, 0) / responses.length;
    const selfScore = Math.round((avgScore / 5) * 100); // Converter para 0-100

    // Atualizar avaliação
    await db
      .update(performanceEvaluations)
      .set({
        selfEvaluationCompleted: true,
        selfScore,
        selfCompletedAt: new Date(),
        workflowStatus: "pending_manager",
      })
      .where(eq(performanceEvaluations.id, evaluationId));

    return { success: true, selfScore };
  } catch (error) {
    console.error("[Database] Failed to fill self evaluation:", error);
    throw error;
  }
}

/**
 * Preencher avaliação do gestor automaticamente (para simulação)
 */
export async function fillManagerEvaluation(evaluationId: number, managerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Buscar todas as questões ativas
    const questions = await db
      .select()
      .from(evaluationQuestions)
      .where(eq(evaluationQuestions.active, true));

    // Gerar respostas aleatórias mas realistas (2-5)
    const responses = questions.map((question) => ({
      evaluationId,
      questionId: question.id,
      evaluatorId: managerId,
      evaluatorType: "manager" as const,
      score: Math.floor(Math.random() * 4) + 2, // 2, 3, 4 ou 5
    }));

    // Inserir respostas
    await db.insert(evaluationResponses).values(responses);

    // Calcular nota média
    const avgScore = responses.reduce((sum, r) => sum + r.score, 0) / responses.length;
    const managerScore = Math.round((avgScore / 5) * 100); // Converter para 0-100

    // Atualizar avaliação
    await db
      .update(performanceEvaluations)
      .set({
        managerEvaluationCompleted: true,
        managerScore,
        managerCompletedAt: new Date(),
        workflowStatus: "pending_consensus",
      })
      .where(eq(performanceEvaluations.id, evaluationId));

    return { success: true, managerScore };
  } catch (error) {
    console.error("[Database] Failed to fill manager evaluation:", error);
    throw error;
  }
}

/**
 * Finalizar avaliação com consenso (média entre auto e gestor)
 */
export async function finalizeEvaluation(evaluationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Buscar avaliação
    const [evaluation] = await db
      .select()
      .from(performanceEvaluations)
      .where(eq(performanceEvaluations.id, evaluationId));

    if (!evaluation) throw new Error("Evaluation not found");

    // Calcular nota final (média entre auto e gestor)
    const finalScore = Math.round(
      ((evaluation.selfScore || 0) + (evaluation.managerScore || 0)) / 2
    );

    // Atualizar avaliação
    await db
      .update(performanceEvaluations)
      .set({
        finalScore,
        status: "concluida",
        workflowStatus: "completed",
        consensusCompletedAt: new Date(),
        completedAt: new Date(),
      })
      .where(eq(performanceEvaluations.id, evaluationId));

    return { success: true, finalScore };
  } catch (error) {
    console.error("[Database] Failed to finalize evaluation:", error);
    throw error;
  }
}

/**
 * Buscar resultados detalhados de uma avaliação
 */
export async function getEvaluationDetails(evaluationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Buscar avaliação
    const [evaluation] = await db
      .select()
      .from(performanceEvaluations)
      .where(eq(performanceEvaluations.id, evaluationId));

    if (!evaluation) return null;

    // Buscar respostas agrupadas por tipo de avaliador
    const responses = await db
      .select({
        questionId: evaluationResponses.questionId,
        question: evaluationQuestions.question,
        category: evaluationQuestions.category,
        evaluatorType: evaluationResponses.evaluatorType,
        score: evaluationResponses.score,
      })
      .from(evaluationResponses)
      .innerJoin(
        evaluationQuestions,
        eq(evaluationResponses.questionId, evaluationQuestions.id)
      )
      .where(eq(evaluationResponses.evaluationId, evaluationId));

    // Agrupar por categoria e tipo de avaliador
    const byCategory: Record<string, any> = {};
    
    for (const response of responses) {
      const category = response.category || "Geral";
      if (!byCategory[category]) {
        byCategory[category] = {
          category,
          self: [],
          manager: [],
        };
      }
      
      if (response.evaluatorType === "self") {
        byCategory[category].self.push(response.score);
      } else if (response.evaluatorType === "manager") {
        byCategory[category].manager.push(response.score);
      }
    }

    // Calcular médias por categoria
    const competencyScores = Object.values(byCategory).map((cat: any) => ({
      category: cat.category,
      selfAvg: cat.self.length > 0 
        ? cat.self.reduce((a: number, b: number) => a + b, 0) / cat.self.length 
        : 0,
      managerAvg: cat.manager.length > 0
        ? cat.manager.reduce((a: number, b: number) => a + b, 0) / cat.manager.length
        : 0,
    }));

    return {
      evaluation,
      competencyScores,
      responses,
    };
  } catch (error) {
    console.error("[Database] Failed to get evaluation details:", error);
    throw error;
  }
}

/**
 * Buscar todas as avaliações 360° de um funcionário com detalhes do ciclo
 */
export async function getEmployeePerformanceEvaluationsWithCycle(employeeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const evaluations = await db
      .select({
        id: performanceEvaluations.id,
        cycleId: performanceEvaluations.cycleId,
        cycleName: evaluationCycles.name,
        cycleYear: evaluationCycles.year,
        type: performanceEvaluations.type,
        status: performanceEvaluations.status,
        workflowStatus: performanceEvaluations.workflowStatus,
        selfScore: performanceEvaluations.selfScore,
        managerScore: performanceEvaluations.managerScore,
        finalScore: performanceEvaluations.finalScore,
        completedAt: performanceEvaluations.completedAt,
      })
      .from(performanceEvaluations)
      .innerJoin(
        evaluationCycles,
        eq(performanceEvaluations.cycleId, evaluationCycles.id)
      )
      .where(eq(performanceEvaluations.employeeId, employeeId))
      .orderBy(desc(evaluationCycles.year));

    return evaluations;
  } catch (error) {
    console.error("[Database] Failed to get employee evaluations:", error);
    throw error;
  }
}

/**
 * Calcular quartis de desempenho de um ciclo
 */
export async function calculateCycleQuartiles(cycleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Buscar todas as avaliações concluídas do ciclo
    const evaluations = await db
      .select({
        id: performanceEvaluations.id,
        employeeId: performanceEvaluations.employeeId,
        finalScore: performanceEvaluations.finalScore,
      })
      .from(performanceEvaluations)
      .where(
        and(
          eq(performanceEvaluations.cycleId, cycleId),
          eq(performanceEvaluations.status, "concluida")
        )
      );

    if (evaluations.length === 0) {
      return { q1: 0, q2: 0, q3: 0, q4: 0, distribution: [] };
    }

    // Ordenar por nota final
    const sorted = evaluations
      .filter((e) => e.finalScore !== null)
      .sort((a, b) => (a.finalScore || 0) - (b.finalScore || 0));

    // Calcular quartis
    const q1Index = Math.floor(sorted.length * 0.25);
    const q2Index = Math.floor(sorted.length * 0.5);
    const q3Index = Math.floor(sorted.length * 0.75);

    const q1 = sorted[q1Index]?.finalScore || 0;
    const q2 = sorted[q2Index]?.finalScore || 0;
    const q3 = sorted[q3Index]?.finalScore || 0;

    // Classificar cada avaliação em um quartil
    const distribution = sorted.map((e) => {
      let quartile = 1;
      if ((e.finalScore || 0) > q3) quartile = 4;
      else if ((e.finalScore || 0) > q2) quartile = 3;
      else if ((e.finalScore || 0) > q1) quartile = 2;

      return {
        employeeId: e.employeeId,
        finalScore: e.finalScore,
        quartile,
      };
    });

    return {
      q1,
      q2,
      q3,
      q4: sorted[sorted.length - 1]?.finalScore || 0,
      distribution,
    };
  } catch (error) {
    console.error("[Database] Failed to calculate cycle quartiles:", error);
    throw error;
  }
}

/**
 * Gerar PDI automático baseado nos gaps da avaliação
 */
export async function generateAutomaticPDI(evaluationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Buscar detalhes da avaliação
    const details = await getEvaluationDetails(evaluationId);
    if (!details) throw new Error("Evaluation not found");

    const { evaluation, competencyScores } = details;

    // Identificar competências com gap (nota < 4)
    const gaps = competencyScores.filter(
      (comp) => comp.managerAvg < 4 || comp.selfAvg < 4
    );

    if (gaps.length === 0) {
      return { success: true, message: "Nenhum gap identificado" };
    }

    // Criar PDI
    const [pdi] = await db
      .insert(pdiPlans)
      .values({
        cycleId: evaluation.cycleId,
        employeeId: evaluation.employeeId,
        status: "em_andamento",
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
      })
      .$returningId();

    // Criar ações de desenvolvimento para cada gap
    const actions = gaps.map((gap) => ({
      planId: pdi.id,
      competencyId: 1, // TODO: buscar competency ID real
      title: `Desenvolver: ${gap.category}`,
      description: `Melhorar nota de ${Math.round(gap.managerAvg)} para 5`,
      category: "70_pratica" as const,
      type: "treinamento",
      startDate: new Date(),
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 meses
      status: "pendente" as const,
      progress: 0,
    }));

    await db.insert(pdiItems).values(actions);

    return {
      success: true,
      pdiId: pdi.id,
      actionsCreated: actions.length,
    };
  } catch (error) {
    console.error("[Database] Failed to generate automatic PDI:", error);
    throw error;
  }
}

// ============================================================================
// ANEXOS DE FUNCIONÁRIOS
// ============================================================================

/**
 * Criar anexo de funcionário
 */
export async function createEmployeeAttachment(data: InsertEmployeeAttachment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(employeeAttachments).values(data);
  return result;
}

/**
 * Listar anexos de um funcionário
 */
export async function getEmployeeAttachments(employeeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(employeeAttachments)
    .where(eq(employeeAttachments.employeeId, employeeId))
    .where(isNull(employeeAttachments.deletedAt));
  
  return result;
}

/**
 * Deletar anexo (soft delete)
 */
export async function deleteEmployeeAttachment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(employeeAttachments)
    .set({ deletedAt: new Date() })
    .where(eq(employeeAttachments.id, id));
}

// ============================================================================
// PERFIS FACIAIS
// ============================================================================

/**
 * Criar ou atualizar perfil facial de funcionário
 */
export async function upsertEmployeeFaceProfile(data: InsertEmployeeFaceProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .insert(employeeFaceProfiles)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        referencePhotoUrl: data.referencePhotoUrl,
        referencePhotoKey: data.referencePhotoKey,
        faceDescriptor: data.faceDescriptor,
        faceEncoding: data.faceEncoding,
        photoQuality: data.photoQuality,
        confidenceScore: data.confidenceScore,
        updatedAt: new Date(),
      },
    });
  
  return result;
}

/**
 * Buscar perfil facial de funcionário
 */
export async function getEmployeeFaceProfile(employeeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(employeeFaceProfiles)
    .where(eq(employeeFaceProfiles.employeeId, employeeId))
    .where(eq(employeeFaceProfiles.isActive, true))
    .limit(1);
  
  return result[0] || null;
}

// ============================================================================
// ANÁLISES DE VÍDEO
// ============================================================================

/**
 * Criar análise de vídeo
 */
export async function createVideoAnalysis(data: InsertVideoAnalysis) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(videoAnalyses).values(data);
  return result;
}

/**
 * Atualizar análise de vídeo
 */
export async function updateVideoAnalysis(id: number, data: Partial<InsertVideoAnalysis>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(videoAnalyses)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(videoAnalyses.id, id));
}

/**
 * Buscar análises de vídeo de um funcionário
 */
export async function getEmployeeVideoAnalyses(employeeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(videoAnalyses)
    .where(eq(videoAnalyses.employeeId, employeeId))
    .orderBy(desc(videoAnalyses.createdAt));
  
  return result;
}

/**
 * Buscar análise de vídeo por ID
 */
export async function getVideoAnalysisById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(videoAnalyses)
    .where(eq(videoAnalyses.id, id))
    .limit(1);
  
  return result[0] || null;
}

// ============================================================================
// HISTÓRICO DE ANÁLISES (COMPARAÇÃO TEMPORAL)
// ============================================================================

/**
 * Criar snapshot de análise para histórico
 */
export async function createVideoAnalysisSnapshot(data: InsertVideoAnalysisHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(videoAnalysisHistory).values(data);
  return result;
}

/**
 * Buscar histórico de análises de um funcionário
 */
export async function getEmployeeAnalysisHistory(employeeId: number, limit = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(videoAnalysisHistory)
    .where(eq(videoAnalysisHistory.employeeId, employeeId))
    .orderBy(desc(videoAnalysisHistory.snapshotDate))
    .limit(limit);
  
  return result;
}

/**
 * Comparar análises de um funcionário em dois períodos
 */
export async function compareEmployeeAnalyses(
  employeeId: number,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(videoAnalysisHistory)
    .where(eq(videoAnalysisHistory.employeeId, employeeId))
    .where(
      and(
        gte(videoAnalysisHistory.snapshotDate, startDate),
        lte(videoAnalysisHistory.snapshotDate, endDate)
      )
    )
    .orderBy(asc(videoAnalysisHistory.snapshotDate));
  
  return result;
}

// ============================================================================
// DETECÇÃO DE FRAUDES
// ============================================================================

/**
 * Registrar detecção de fraude
 */
export async function createFraudDetectionLog(data: InsertFraudDetectionLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(fraudDetectionLogs).values(data);
  return result;
}

/**
 * Buscar logs de fraude de um funcionário
 */
export async function getEmployeeFraudLogs(employeeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(fraudDetectionLogs)
    .where(eq(fraudDetectionLogs.employeeId, employeeId))
    .orderBy(desc(fraudDetectionLogs.detectedAt));
  
  return result;
}

/**
 * Buscar logs de fraude pendentes de revisão
 */
export async function getPendingFraudLogs() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(fraudDetectionLogs)
    .where(eq(fraudDetectionLogs.status, "pendente_revisao"))
    .orderBy(desc(fraudDetectionLogs.detectedAt));
  
  return result;
}

/**
 * Atualizar status de log de fraude
 */
export async function updateFraudLogStatus(
  id: number,
  status: "confirmada" | "falso_positivo" | "resolvida",
  reviewedBy: number,
  reviewNotes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(fraudDetectionLogs)
    .set({
      status,
      reviewedBy,
      reviewedAt: new Date(),
      reviewNotes,
      updatedAt: new Date(),
    })
    .where(eq(fraudDetectionLogs.id, id));
}

// ============================================================================
// RECONHECIMENTO FACIAL GCP VISION
// ============================================================================

import {
  faceEmbeddings,
  type FaceEmbedding,
  type InsertFaceEmbedding,
  faceValidationHistory,
  type FaceValidationHistory,
  type InsertFaceValidationHistory,
} from "../drizzle/schema";

/**
 * Criar ou atualizar embedding facial de funcionário
 */
export async function upsertFaceEmbedding(data: InsertFaceEmbedding) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db
    .select()
    .from(faceEmbeddings)
    .where(eq(faceEmbeddings.employeeId, data.employeeId))
    .limit(1);
  
  if (existing.length > 0) {
    await db
      .update(faceEmbeddings)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(faceEmbeddings.employeeId, data.employeeId));
    
    return existing[0].id;
  } else {
    const result = await db.insert(faceEmbeddings).values(data);
    return result[0].insertId;
  }
}

/**
 * Buscar embedding facial de funcionário
 */
export async function getFaceEmbedding(employeeId: number): Promise<FaceEmbedding | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(faceEmbeddings)
    .where(eq(faceEmbeddings.employeeId, employeeId))
    .limit(1);
  
  return result[0];
}

/**
 * Registrar validação facial
 */
export async function createFaceValidation(data: InsertFaceValidationHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(faceValidationHistory).values(data);
  
  // Atualizar contador de validações no embedding
  if (data.approved) {
    await db
      .update(faceEmbeddings)
      .set({
        lastValidatedAt: new Date(),
        validationCount: sql`${faceEmbeddings.validationCount} + 1`,
      })
      .where(eq(faceEmbeddings.employeeId, data.employeeId));
  }
  
  return result[0].insertId;
}

/**
 * Buscar histórico de validações de um funcionário
 */
export async function getFaceValidationHistory(employeeId: number, limit = 20): Promise<FaceValidationHistory[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(faceValidationHistory)
    .where(eq(faceValidationHistory.employeeId, employeeId))
    .orderBy(desc(faceValidationHistory.validatedAt))
    .limit(limit);
}

/**
 * Buscar validações por avaliação PIR
 */
export async function getFaceValidationsByPIR(pirAssessmentId: number): Promise<FaceValidationHistory[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(faceValidationHistory)
    .where(eq(faceValidationHistory.pirAssessmentId, pirAssessmentId))
    .orderBy(desc(faceValidationHistory.validatedAt));
}

// ============================================================================
// ANÁLISE TEMPORAL AVANÇADA
// ============================================================================

import {
  temporalAnalysisConfigs,
  type TemporalAnalysisConfig,
  type InsertTemporalAnalysisConfig,
  temporalAnalysisResults,
  type TemporalAnalysisResult,
  type InsertTemporalAnalysisResult,
  employeeTemporalSnapshots,
  type EmployeeTemporalSnapshot,
  type InsertEmployeeTemporalSnapshot,
} from "../drizzle/schema";

/**
 * Criar configuração de análise temporal
 */
export async function createTemporalAnalysisConfig(data: InsertTemporalAnalysisConfig) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(temporalAnalysisConfigs).values(data);
  return result[0].insertId;
}

/**
 * Listar configurações de análise temporal
 */
export async function listTemporalAnalysisConfigs(activeOnly = true): Promise<TemporalAnalysisConfig[]> {
  const db = await getDb();
  if (!db) return [];
  
  const query = db.select().from(temporalAnalysisConfigs);
  
  if (activeOnly) {
    return await query.where(eq(temporalAnalysisConfigs.active, true));
  }
  
  return await query;
}

/**
 * Buscar configuração de análise por ID
 */
export async function getTemporalAnalysisConfig(id: number): Promise<TemporalAnalysisConfig | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(temporalAnalysisConfigs)
    .where(eq(temporalAnalysisConfigs.id, id))
    .limit(1);
  
  return result[0];
}

/**
 * Atualizar configuração de análise
 */
export async function updateTemporalAnalysisConfig(id: number, data: Partial<InsertTemporalAnalysisConfig>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(temporalAnalysisConfigs)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(temporalAnalysisConfigs.id, id));
}

/**
 * Criar resultado de análise temporal
 */
export async function createTemporalAnalysisResult(data: InsertTemporalAnalysisResult) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(temporalAnalysisResults).values(data);
  return result[0].insertId;
}

/**
 * Buscar resultados de análise por configuração
 */
export async function getTemporalAnalysisResults(configId: number, limit = 10): Promise<TemporalAnalysisResult[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(temporalAnalysisResults)
    .where(eq(temporalAnalysisResults.configId, configId))
    .orderBy(desc(temporalAnalysisResults.analysisDate))
    .limit(limit);
}

/**
 * Buscar resultado de análise por ID
 */
export async function getTemporalAnalysisResult(id: number): Promise<TemporalAnalysisResult | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(temporalAnalysisResults)
    .where(eq(temporalAnalysisResults.id, id))
    .limit(1);
  
  return result[0];
}

/**
 * Atualizar status de resultado de análise
 */
export async function updateTemporalAnalysisStatus(
  id: number,
  status: "processando" | "concluido" | "erro",
  errorMessage?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(temporalAnalysisResults)
    .set({
      status,
      errorMessage,
      updatedAt: new Date(),
    })
    .where(eq(temporalAnalysisResults.id, id));
}

/**
 * Criar snapshot temporal de funcionário
 */
export async function createEmployeeSnapshot(data: InsertEmployeeTemporalSnapshot) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(employeeTemporalSnapshots).values(data);
  return result[0].insertId;
}

/**
 * Buscar snapshots de funcionário
 */
export async function getEmployeeSnapshots(employeeId: number, limit = 12): Promise<EmployeeTemporalSnapshot[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(employeeTemporalSnapshots)
    .where(eq(employeeTemporalSnapshots.employeeId, employeeId))
    .orderBy(desc(employeeTemporalSnapshots.snapshotDate))
    .limit(limit);
}

/**
 * Comparar múltiplos funcionários em um período
 */
export async function compareEmployeesInPeriod(
  employeeIds: number[],
  startDate: Date,
  endDate: Date
): Promise<EmployeeTemporalSnapshot[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(employeeTemporalSnapshots)
    .where(
      and(
        inArray(employeeTemporalSnapshots.employeeId, employeeIds),
        gte(employeeTemporalSnapshots.snapshotDate, startDate),
        lte(employeeTemporalSnapshots.snapshotDate, endDate)
      )
    )
    .orderBy(
      employeeTemporalSnapshots.employeeId,
      desc(employeeTemporalSnapshots.snapshotDate)
    );
}

// ============================================================================
// NOTIFICAÇÕES AUTOMÁTICAS
// ============================================================================

import {
  notificationRules,
  type NotificationRule,
  type InsertNotificationRule,
  notificationQueue,
  type NotificationQueueItem,
  type InsertNotificationQueueItem,
  notificationHistory,
  type NotificationHistoryItem,
  type InsertNotificationHistoryItem,
  userNotificationPreferences,
  type UserNotificationPreference,
  type InsertUserNotificationPreference,
} from "../drizzle/schema";

/**
 * Criar regra de notificação
 */
export async function createNotificationRule(data: InsertNotificationRule) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(notificationRules).values(data);
  return result[0].insertId;
}

/**
 * Listar regras de notificação ativas
 */
export async function getActiveNotificationRules(): Promise<NotificationRule[]> {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  
  return await db
    .select()
    .from(notificationRules)
    .where(
      and(
        eq(notificationRules.active, true),
        or(
          isNull(notificationRules.activeFrom),
          lte(notificationRules.activeFrom, now)
        ),
        or(
          isNull(notificationRules.activeUntil),
          gte(notificationRules.activeUntil, now)
        )
      )
    );
}

/**
 * Buscar regras por tipo de evento
 */
export async function getNotificationRulesByEvent(
  triggerEvent: string
): Promise<NotificationRule[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(notificationRules)
    .where(
      and(
        eq(notificationRules.triggerEvent, triggerEvent as any),
        eq(notificationRules.active, true)
      )
    );
}

/**
 * Adicionar notificação à fila
 */
export async function enqueueNotification(data: InsertNotificationQueueItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(notificationQueue).values(data);
  return result[0].insertId;
}

/**
 * Buscar notificações pendentes na fila
 */
export async function getPendingNotifications(limit = 50): Promise<NotificationQueueItem[]> {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  
  return await db
    .select()
    .from(notificationQueue)
    .where(
      and(
        eq(notificationQueue.status, "pendente"),
        or(
          isNull(notificationQueue.scheduledFor),
          lte(notificationQueue.scheduledFor, now)
        ),
        or(
          isNull(notificationQueue.nextAttemptAt),
          lte(notificationQueue.nextAttemptAt, now)
        )
      )
    )
    .orderBy(notificationQueue.priority, notificationQueue.createdAt)
    .limit(limit);
}

/**
 * Atualizar status de notificação na fila
 */
export async function updateNotificationQueueStatus(
  id: number,
  status: "processando" | "enviado" | "falha" | "cancelado",
  errorMessage?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updates: any = {
    status,
    updatedAt: new Date(),
  };
  
  if (status === "processando") {
    updates.attempts = sql`${notificationQueue.attempts} + 1`;
    updates.lastAttemptAt = new Date();
  } else if (status === "enviado") {
    updates.sentAt = new Date();
  } else if (status === "falha") {
    updates.errorMessage = errorMessage;
    // Calcular próxima tentativa com backoff exponencial
    const nextAttempt = new Date();
    nextAttempt.setMinutes(nextAttempt.getMinutes() + Math.pow(2, updates.attempts || 1) * 5);
    updates.nextAttemptAt = nextAttempt;
  }
  
  await db
    .update(notificationQueue)
    .set(updates)
    .where(eq(notificationQueue.id, id));
}

/**
 * Registrar notificação no histórico
 */
export async function createNotificationHistory(data: InsertNotificationHistoryItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(notificationHistory).values(data);
  return result[0].insertId;
}

/**
 * Buscar histórico de notificações de um usuário
 */
export async function getUserNotificationHistory(
  userId: number,
  limit = 50
): Promise<NotificationHistoryItem[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(notificationHistory)
    .where(eq(notificationHistory.recipientUserId, userId))
    .orderBy(desc(notificationHistory.sentAt))
    .limit(limit);
}

/**
 * Marcar notificação como lida
 */
export async function markNotificationAsOpened(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(notificationHistory)
    .set({
      opened: true,
      openedAt: new Date(),
    })
    .where(eq(notificationHistory.id, id));
}

/**
 * Buscar ou criar preferências de notificação do usuário
 */
export async function getUserNotificationPreferences(
  userId: number
): Promise<UserNotificationPreference> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db
    .select()
    .from(userNotificationPreferences)
    .where(eq(userNotificationPreferences.userId, userId))
    .limit(1);
  
  if (existing.length > 0) {
    return existing[0];
  }
  
  // Criar preferências padrão
  const result = await db.insert(userNotificationPreferences).values({
    userId,
  });
  
  const created = await db
    .select()
    .from(userNotificationPreferences)
    .where(eq(userNotificationPreferences.userId, userId))
    .limit(1);
  
  return created[0];
}

/**
 * Atualizar preferências de notificação
 */
export async function updateUserNotificationPreferences(
  userId: number,
  data: Partial<InsertUserNotificationPreference>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(userNotificationPreferences)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(userNotificationPreferences.userId, userId));
}

/**
 * Verificar se usuário deve receber notificação
 */
export async function shouldNotifyUser(
  userId: number,
  eventType: string,
  channel: "email" | "in_app" | "push"
): Promise<boolean> {
  const prefs = await getUserNotificationPreferences(userId);
  
  // Verificar se canal está habilitado
  if (channel === "email" && !prefs.emailEnabled) return false;
  if (channel === "in_app" && !prefs.inAppEnabled) return false;
  if (channel === "push" && !prefs.pushEnabled) return false;
  
  // Verificar quiet hours
  if (prefs.quietHoursEnabled && prefs.quietHoursStart && prefs.quietHoursEnd) {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    if (currentTime >= prefs.quietHoursStart && currentTime <= prefs.quietHoursEnd) {
      return false;
    }
  }
  
  // Verificar preferências por tipo de evento
  const eventPrefs: Record<string, keyof UserNotificationPreference> = {
    novo_anexo: 'notifyNewAttachment',
    mudanca_pir_significativa: 'notifyPirChanges',
    mudanca_pir_critica: 'notifyPirChanges',
    meta_concluida: 'notifyGoalUpdates',
    meta_atrasada: 'notifyGoalUpdates',
    avaliacao_360_concluida: 'notify360Completion',
    novo_feedback: 'notifyFeedback',
    pdi_atualizado: 'notifyPdiUpdates',
  };
  
  const prefKey = eventPrefs[eventType];
  if (prefKey && prefs[prefKey] === false) {
    return false;
  }
  
  return true;
}
