import { getDb } from "../db";
import { employees, users } from "../../drizzle/schema";
import { eq, or, and, inArray } from "drizzle-orm";

/**
 * Verifica se o usuário é administrador (verifica na tabela users)
 * @param userId - ID do usuário (users.id)
 */
export async function isAdmin(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // FIX CRÍTICO: Busca o ROLE diretamente na tabela 'users'
  const user = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  return user.length > 0 && user[0].role === 'admin';
}

/**
 * Verifica se o colaborador é líder (tem subordinados diretos)
 * @param employeeId - ID do colaborador (employees.id)
 */
export async function isLeader(employeeId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const subordinates = await db
    .select()
    .from(employees)
    .where(eq(employees.managerId, employeeId)) // Usar employeeId
    .limit(1);

  return subordinates.length > 0;
}

/**
 * Retorna lista de IDs dos subordinados diretos do líder
 * @param leaderEmployeeId - ID do colaborador líder (employees.id)
 */
export async function getDirectSubordinates(leaderEmployeeId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];

  const subordinates = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.managerId, leaderEmployeeId)); // Usar leaderEmployeeId

  return subordinates.map(s => s.id);
}

/**
 * Retorna lista de IDs de todos os subordinados (diretos e indiretos) do líder
 * @param leaderEmployeeId - ID do colaborador líder (employees.id)
 * PERFORMANCE ALERT: A implementação atual usa N+1 queries. O ideal é usar CTEs Recursivas.
 */
export async function getAllSubordinates(leaderEmployeeId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];

  const allSubordinates: number[] = [];
  const queue: number[] = [leaderEmployeeId]; // Começa com o ID do líder
  const processed = new Set<number>(); // Usa 'processed' para evitar reprocessar nós

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (processed.has(currentId)) continue;
    processed.add(currentId);

    // FIX: Não adiciona o ID do líder à lista de subordinados
    if (currentId !== leaderEmployeeId) {
        allSubordinates.push(currentId);
    }

    const directSubs = await db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.managerId, currentId));

    for (const sub of directSubs) {
      if (!processed.has(sub.id)) {
        queue.push(sub.id);
      }
    }
  }

  return allSubordinates;
}

/**
 * Retorna lista de IDs dos colaboradores do mesmo centro de custos
 */
export async function getEmployeesByCostCenter(costCenter: string): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];

  const employees_list = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.costCenter, costCenter));

  return employees_list.map(e => e.id);
}

/**
 * Verifica se o usuário pode visualizar dados do colaborador
 * @param loggedInEmployeeId - ID do colaborador logado (employees.id)
 * @param targetEmployeeId - ID do colaborador alvo (employees.id)
 * Admin: pode ver todos
 * Líder: pode ver apenas seus subordinados diretos e indiretos
 * Usuário: pode ver apenas seus próprios dados
 */
export async function canViewEmployee(loggedInEmployeeId: number, targetEmployeeId: number): Promise<boolean> {
  if (loggedInEmployeeId === targetEmployeeId) return true;
  
  // Busca o userId para verificar se é Admin
  const db = await getDb();
  if (!db) return false;
  const [loggedInUser] = await db.select({ userId: employees.userId }).from(employees).where(eq(employees.id, loggedInEmployeeId)).limit(1);
  
  // Verifica se é Admin (isAdmin espera users.id)
  if (loggedInUser && loggedInUser.userId && await isAdmin(loggedInUser.userId)) return true;

  const subordinates = await getAllSubordinates(loggedInEmployeeId);
  return subordinates.includes(targetEmployeeId);
}

/**
 * Verifica se o usuário pode fazer consenso/calibração do colaborador
 * @param loggedInEmployeeId - ID do colaborador logado (employees.id)
 * @param targetEmployeeId - ID do colaborador alvo (employees.id)
 */
export async function canDoConsensus(loggedInEmployeeId: number, targetEmployeeId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const [loggedInUser] = await db.select({ userId: employees.userId }).from(employees).where(eq(employees.id, loggedInEmployeeId)).limit(1);
  
  // Verifica se é Admin (isAdmin espera users.id)
  if (loggedInUser && loggedInUser.userId && await isAdmin(loggedInUser.userId)) return true;

  const directSubordinates = await getDirectSubordinates(loggedInEmployeeId);
  return directSubordinates.includes(targetEmployeeId);
}

/**
 * Verifica se o usuário pode aprovar avaliação do colaborador
 * @param loggedInEmployeeId - ID do colaborador logado (employees.id)
 * @param targetEmployeeId - ID do colaborador alvo (employees.id)
 */
export async function canApproveEvaluation(loggedInEmployeeId: number, targetEmployeeId: number): Promise<boolean> {
  return await canDoConsensus(loggedInEmployeeId, targetEmployeeId);
}

/**
 * Retorna lista de IDs de colaboradores que o usuário pode visualizar
 * @param loggedInEmployeeId - ID do colaborador logado (employees.id)
 */
export async function getVisibleEmployees(loggedInEmployeeId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  
  const [loggedInUser] = await db.select({ userId: employees.userId }).from(employees).where(eq(employees.id, loggedInEmployeeId)).limit(1);
  
  // Verifica se é Admin (isAdmin espera users.id)
  if (loggedInUser && loggedInUser.userId && await isAdmin(loggedInUser.userId)) {
    const all = await db.select({ id: employees.id }).from(employees);
    return all.map(e => e.id);
  }

  const subordinates = await getAllSubordinates(loggedInEmployeeId);
  return [loggedInEmployeeId, ...subordinates];
}

/**
 * Retorna centro de custos do colaborador
 */
export async function getEmployeeCostCenter(employeeId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  const employee = await db
    .select({ costCenter: employees.costCenter })
    .from(employees)
    .where(eq(employees.id, employeeId))
    .limit(1);

  return employee.length > 0 ? employee[0].costCenter : null;
}
