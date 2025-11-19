import { getDb } from "../db";
import { employees, users } from "../../drizzle/schema";
import { eq, or, and, inArray } from "drizzle-orm";

/**
 * Verifica se o usuário é administrador (verifica na tabela users)
 */
export async function isAdmin(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Busca o employee para pegar o userId
  const employee = await db.select({ userId: employees.userId }).from(employees).where(eq(employees.id, userId)).limit(1);
  if (employee.length === 0 || !employee[0].userId) return false;

  // Busca o user para verificar role
  const user = await db.select({ role: users.role }).from(users).where(eq(users.id, employee[0].userId)).limit(1);
  return user.length > 0 && user[0].role === 'admin';
}

/**
 * Verifica se o usuário é líder (tem subordinados diretos)
 */
export async function isLeader(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const subordinates = await db
    .select()
    .from(employees)
    .where(eq(employees.managerId, userId))
    .limit(1);

  return subordinates.length > 0;
}

/**
 * Retorna lista de IDs dos subordinados diretos do líder
 */
export async function getDirectSubordinates(leaderId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];

  const subordinates = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.managerId, leaderId));

  return subordinates.map(s => s.id);
}

/**
 * Retorna lista de IDs de todos os subordinados (diretos e indiretos) do líder
 */
export async function getAllSubordinates(leaderId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];

  const allSubordinates: number[] = [];
  const queue: number[] = [leaderId];
  const visited = new Set<number>();

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const directSubs = await db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.managerId, currentId));

    for (const sub of directSubs) {
      allSubordinates.push(sub.id);
      queue.push(sub.id);
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
 * Admin: pode ver todos
 * Líder: pode ver apenas seus subordinados diretos e indiretos
 * Usuário: pode ver apenas seus próprios dados
 */
export async function canViewEmployee(userId: number, targetEmployeeId: number): Promise<boolean> {
  if (userId === targetEmployeeId) return true;
  if (await isAdmin(userId)) return true;

  const subordinates = await getAllSubordinates(userId);
  return subordinates.includes(targetEmployeeId);
}

/**
 * Verifica se o usuário pode fazer consenso/calibração do colaborador
 * Admin: pode fazer consenso de todos
 * Líder direto: pode fazer consenso apenas dos subordinados diretos
 */
export async function canDoConsensus(userId: number, targetEmployeeId: number): Promise<boolean> {
  if (await isAdmin(userId)) return true;

  const directSubordinates = await getDirectSubordinates(userId);
  return directSubordinates.includes(targetEmployeeId);
}

/**
 * Verifica se o usuário pode aprovar avaliação do colaborador
 * Admin: pode aprovar todas
 * Líder direto: pode aprovar apenas dos subordinados diretos
 */
export async function canApproveEvaluation(userId: number, targetEmployeeId: number): Promise<boolean> {
  return await canDoConsensus(userId, targetEmployeeId);
}

/**
 * Retorna lista de IDs de colaboradores que o usuário pode visualizar
 */
export async function getVisibleEmployees(userId: number): Promise<number[]> {
  if (await isAdmin(userId)) {
    const db = await getDb();
    if (!db) return [];
    
    const all = await db.select({ id: employees.id }).from(employees);
    return all.map(e => e.id);
  }

  const subordinates = await getAllSubordinates(userId);
  return [userId, ...subordinates];
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
