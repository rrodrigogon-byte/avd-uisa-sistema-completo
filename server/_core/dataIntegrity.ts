/**
 * Sistema de Validação de Integridade de Dados
 * 
 * Garante consistência e qualidade dos dados no sistema
 */

import { getDb } from "../db";
import { employees, departments, positions, goals, performanceEvaluations } from "../../drizzle/schema";
import { eq, isNull, sql } from "drizzle-orm";

export interface IntegrityIssue {
  type: string;
  severity: "critical" | "warning" | "info";
  entity: string;
  entityId: number | null;
  message: string;
  details?: any;
}

/**
 * Verifica integridade de funcionários
 */
export async function checkEmployeesIntegrity(): Promise<IntegrityIssue[]> {
  const db = await getDb();
  if (!db) return [];

  const issues: IntegrityIssue[] = [];

  try {
    // Verificar funcionários sem departamento
    const employeesWithoutDept = await db
      .select()
      .from(employees)
      .where(isNull(employees.departmentId))
      .limit(100);

    employeesWithoutDept.forEach(emp => {
      issues.push({
        type: "missing_department",
        severity: "warning",
        entity: "employee",
        entityId: emp.id,
        message: `Funcionário ${emp.name} (${emp.chapa}) sem departamento`,
      });
    });

    // Verificar funcionários sem cargo
    const employeesWithoutPosition = await db
      .select()
      .from(employees)
      .where(isNull(employees.positionId))
      .limit(100);

    employeesWithoutPosition.forEach(emp => {
      issues.push({
        type: "missing_position",
        severity: "warning",
        entity: "employee",
        entityId: emp.id,
        message: `Funcionário ${emp.name} (${emp.chapa}) sem cargo`,
      });
    });

    // Verificar chapas duplicadas
    const duplicateChapas = await db
      .select({
        chapa: employees.chapa,
        count: sql<number>`count(*)`,
      })
      .from(employees)
      .groupBy(employees.chapa)
      .having(sql`count(*) > 1`);

    duplicateChapas.forEach(dup => {
      issues.push({
        type: "duplicate_chapa",
        severity: "critical",
        entity: "employee",
        entityId: null,
        message: `Chapa duplicada: ${dup.chapa} (${dup.count} ocorrências)`,
        details: { chapa: dup.chapa, count: dup.count },
      });
    });

  } catch (error) {
    console.error("[DataIntegrity] Erro ao verificar funcionários:", error);
  }

  return issues;
}

/**
 * Verifica integridade de metas
 */
export async function checkGoalsIntegrity(): Promise<IntegrityIssue[]> {
  const db = await getDb();
  if (!db) return [];

  const issues: IntegrityIssue[] = [];

  try {
    // Verificar metas com datas inválidas
    const invalidDateGoals = await db
      .select()
      .from(goals)
      .where(sql`${goals.endDate} < ${goals.startDate}`)
      .limit(100);

    invalidDateGoals.forEach(goal => {
      issues.push({
        type: "invalid_dates",
        severity: "critical",
        entity: "goal",
        entityId: goal.id,
        message: `Meta com data final anterior à data inicial`,
        details: { startDate: goal.startDate, endDate: goal.endDate },
      });
    });

    // Verificar metas sem funcionário (que não são organizacionais)
    const goalsWithoutEmployee = await db
      .select()
      .from(goals)
      .where(
        sql`${goals.employeeId} IS NULL AND ${goals.type} != 'organizational'`
      )
      .limit(100);

    goalsWithoutEmployee.forEach(goal => {
      issues.push({
        type: "missing_employee",
        severity: "warning",
        entity: "goal",
        entityId: goal.id,
        message: `Meta individual sem funcionário atribuído`,
      });
    });

  } catch (error) {
    console.error("[DataIntegrity] Erro ao verificar metas:", error);
  }

  return issues;
}

/**
 * Verifica integridade de avaliações
 */
export async function checkEvaluationsIntegrity(): Promise<IntegrityIssue[]> {
  const db = await getDb();
  if (!db) return [];

  const issues: IntegrityIssue[] = [];

  try {
    // Verificar avaliações sem avaliador
    const evaluationsWithoutEvaluator = await db
      .select()
      .from(performanceEvaluations)
      .where(isNull(performanceEvaluations.evaluatorId))
      .limit(100);

    evaluationsWithoutEvaluator.forEach(eval => {
      issues.push({
        type: "missing_evaluator",
        severity: "warning",
        entity: "evaluation",
        entityId: eval.id,
        message: `Avaliação sem avaliador`,
      });
    });

    // Verificar avaliações com scores inválidos
    const invalidScoreEvaluations = await db
      .select()
      .from(performanceEvaluations)
      .where(
        sql`${performanceEvaluations.finalScore} < 0 OR ${performanceEvaluations.finalScore} > 100`
      )
      .limit(100);

    invalidScoreEvaluations.forEach(eval => {
      issues.push({
        type: "invalid_score",
        severity: "critical",
        entity: "evaluation",
        entityId: eval.id,
        message: `Avaliação com score inválido: ${eval.finalScore}`,
        details: { score: eval.finalScore },
      });
    });

  } catch (error) {
    console.error("[DataIntegrity] Erro ao verificar avaliações:", error);
  }

  return issues;
}

/**
 * Executa todas as verificações de integridade
 */
export async function checkAllIntegrity(): Promise<{
  issues: IntegrityIssue[];
  summary: {
    total: number;
    critical: number;
    warning: number;
    info: number;
  };
}> {
  const allIssues: IntegrityIssue[] = [];

  // Executar todas as verificações
  const [employeeIssues, goalIssues, evaluationIssues] = await Promise.all([
    checkEmployeesIntegrity(),
    checkGoalsIntegrity(),
    checkEvaluationsIntegrity(),
  ]);

  allIssues.push(...employeeIssues, ...goalIssues, ...evaluationIssues);

  // Calcular resumo
  const summary = {
    total: allIssues.length,
    critical: allIssues.filter(i => i.severity === "critical").length,
    warning: allIssues.filter(i => i.severity === "warning").length,
    info: allIssues.filter(i => i.severity === "info").length,
  };

  return { issues: allIssues, summary };
}

/**
 * Corrige problemas de integridade automaticamente quando possível
 */
export async function autoFixIntegrityIssues(
  issues: IntegrityIssue[]
): Promise<{
  fixed: number;
  failed: number;
  errors: string[];
}> {
  const db = await getDb();
  if (!db) return { fixed: 0, failed: 0, errors: ["Database not available"] };

  let fixed = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const issue of issues) {
    try {
      // Implementar correções automáticas para casos específicos
      if (issue.type === "missing_department" && issue.entityId) {
        // Atribuir a um departamento padrão
        // await db.update(employees)
        //   .set({ departmentId: DEFAULT_DEPT_ID })
        //   .where(eq(employees.id, issue.entityId));
        // fixed++;
      }
      // Adicionar mais casos conforme necessário
    } catch (error) {
      failed++;
      errors.push(`Erro ao corrigir ${issue.type}: ${error}`);
    }
  }

  return { fixed, failed, errors };
}
