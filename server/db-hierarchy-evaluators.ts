import { eq, and, ne } from "drizzle-orm";
import { getDb } from "./db";
import { employees, employeeHierarchy } from "../drizzle/schema";

/**
 * Helpers para sugestão automática de avaliadores baseados na hierarquia
 */

export interface SuggestedEvaluators {
  manager: {
    id: number;
    name: string;
    email: string | null;
    chapa: string | null;
  } | null;
  peers: Array<{
    id: number;
    name: string;
    email: string | null;
    chapa: string | null;
  }>;
  subordinates: Array<{
    id: number;
    name: string;
    email: string | null;
    chapa: string | null;
  }>;
}

/**
 * Sugerir avaliadores automaticamente baseado na hierarquia
 */
export async function suggestEvaluators(employeeId: number): Promise<SuggestedEvaluators | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // 1. Buscar o funcionário
    const employee = await db
      .select()
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (employee.length === 0) return null;

    const emp = employee[0];

    // 2. Buscar gestor direto (managerId)
    let manager = null;
    if (emp.managerId) {
      const managerResult = await db
        .select({
          id: employees.id,
          name: employees.name,
          email: employees.email,
          chapa: employees.chapa,
        })
        .from(employees)
        .where(eq(employees.id, emp.managerId))
        .limit(1);

      if (managerResult.length > 0) {
        manager = managerResult[0];
      }
    }

    // 3. Buscar pares (mesmo departamento, mesmo nível, excluindo o próprio funcionário)
    const peers = await db
      .select({
        id: employees.id,
        name: employees.name,
        email: employees.email,
        chapa: employees.chapa,
      })
      .from(employees)
      .where(
        and(
          eq(employees.departmentId, emp.departmentId || 0),
          eq(employees.positionId, emp.positionId || 0),
          ne(employees.id, employeeId),
          eq(employees.active, true)
        )
      )
      .limit(10); // Limitar a 10 pares

    // 4. Buscar subordinados diretos (quem tem este funcionário como gestor)
    const subordinates = await db
      .select({
        id: employees.id,
        name: employees.name,
        email: employees.email,
        chapa: employees.chapa,
      })
      .from(employees)
      .where(
        and(
          eq(employees.managerId, employeeId),
          eq(employees.active, true)
        )
      )
      .limit(10); // Limitar a 10 subordinados

    return {
      manager,
      peers,
      subordinates,
    };
  } catch (error) {
    console.error("[Database] Failed to suggest evaluators:", error);
    return null;
  }
}

/**
 * Buscar pares por departamento e posição (alternativa mais flexível)
 */
export async function getPeersByDepartmentAndPosition(
  employeeId: number,
  departmentId: number | null,
  positionId: number | null,
  limit: number = 10
) {
  const db = await getDb();
  if (!db) return [];

  try {
    const conditions = [
      ne(employees.id, employeeId),
      eq(employees.active, true),
    ];

    if (departmentId) {
      conditions.push(eq(employees.departmentId, departmentId));
    }

    if (positionId) {
      conditions.push(eq(employees.positionId, positionId));
    }

    const peers = await db
      .select({
        id: employees.id,
        name: employees.name,
        email: employees.email,
        chapa: employees.chapa,
        departmentId: employees.departmentId,
        positionId: employees.positionId,
      })
      .from(employees)
      .where(and(...conditions))
      .limit(limit);

    return peers;
  } catch (error) {
    console.error("[Database] Failed to get peers:", error);
    return [];
  }
}

/**
 * Buscar subordinados de um gestor
 */
export async function getSubordinatesByManager(managerId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  try {
    const subordinates = await db
      .select({
        id: employees.id,
        name: employees.name,
        email: employees.email,
        chapa: employees.chapa,
        departmentId: employees.departmentId,
        positionId: employees.positionId,
      })
      .from(employees)
      .where(
        and(
          eq(employees.managerId, managerId),
          eq(employees.active, true)
        )
      )
      .limit(limit);

    return subordinates;
  } catch (error) {
    console.error("[Database] Failed to get subordinates:", error);
    return [];
  }
}

/**
 * Validar se um funcionário pode avaliar outro
 */
export async function canEvaluate(
  evaluatorId: number,
  evaluatedId: number,
  evaluationType: "manager" | "peer" | "subordinate"
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const evaluated = await db
      .select()
      .from(employees)
      .where(eq(employees.id, evaluatedId))
      .limit(1);

    if (evaluated.length === 0) return false;

    const emp = evaluated[0];

    switch (evaluationType) {
      case "manager":
        // Validar se o avaliador é o gestor direto
        return emp.managerId === evaluatorId;

      case "peer":
        // Validar se são do mesmo departamento e posição
        const evaluator = await db
          .select()
          .from(employees)
          .where(eq(employees.id, evaluatorId))
          .limit(1);

        if (evaluator.length === 0) return false;

        return (
          evaluator[0].departmentId === emp.departmentId &&
          evaluator[0].positionId === emp.positionId &&
          evaluatorId !== evaluatedId
        );

      case "subordinate":
        // Validar se o avaliado é o gestor do avaliador
        const subordinate = await db
          .select()
          .from(employees)
          .where(eq(employees.id, evaluatorId))
          .limit(1);

        if (subordinate.length === 0) return false;

        return subordinate[0].managerId === evaluatedId;

      default:
        return false;
    }
  } catch (error) {
    console.error("[Database] Failed to validate evaluator:", error);
    return false;
  }
}
