import { eq, and, desc, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  testInvitations,
  testResponses,
  testResults,
  testQuestions,
  employees,
  InsertTestInvitation,
  InsertTestResponse,
  InsertTestResult,
} from "../drizzle/schema";

/**
 * Helpers para gerenciamento de testes psicométricos
 */

// ============================================================================
// TEST INVITATIONS
// ============================================================================

export async function createTestInvitation(invitation: InsertTestInvitation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(testInvitations).values(invitation);
  return result.insertId;
}

export async function getTestInvitationByToken(token: string) {
  const db = await getDb();
  if (!db) return null;

  const [invitation] = await db
    .select()
    .from(testInvitations)
    .where(eq(testInvitations.uniqueToken, token))
    .limit(1);

  return invitation || null;
}

export async function getTestInvitationById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const [invitation] = await db
    .select()
    .from(testInvitations)
    .where(eq(testInvitations.id, id))
    .limit(1);

  return invitation || null;
}

export async function getTestInvitationsByEmployee(employeeId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(testInvitations)
    .where(eq(testInvitations.employeeId, employeeId))
    .orderBy(desc(testInvitations.createdAt));
}

export async function updateTestInvitationStatus(
  id: number,
  status: "pendente" | "em_andamento" | "concluido" | "expirado",
  additionalData?: {
    startedAt?: Date;
    completedAt?: Date;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(testInvitations)
    .set({
      status,
      ...additionalData,
      updatedAt: new Date(),
    })
    .where(eq(testInvitations.id, id));
}

export async function markInvitationEmailSent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(testInvitations)
    .set({
      emailSent: true,
      emailSentAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(testInvitations.id, id));
}

export async function getAllPendingInvitations() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      invitation: testInvitations,
      employee: employees,
    })
    .from(testInvitations)
    .leftJoin(employees, eq(testInvitations.employeeId, employees.id))
    .where(eq(testInvitations.status, "pendente"))
    .orderBy(desc(testInvitations.createdAt));
}

// ============================================================================
// TEST RESPONSES
// ============================================================================

export async function saveTestResponse(response: InsertTestResponse) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(testResponses).values(response);
  return result.insertId;
}

export async function getTestResponsesByInvitation(invitationId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(testResponses)
    .where(eq(testResponses.invitationId, invitationId))
    .orderBy(testResponses.questionId);
}

export async function countTestResponses(invitationId: number) {
  const db = await getDb();
  if (!db) return 0;

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(testResponses)
    .where(eq(testResponses.invitationId, invitationId));

  return result?.count || 0;
}

// ============================================================================
// TEST RESULTS
// ============================================================================

export async function saveTestResult(result: InsertTestResult) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [insertResult] = await db.insert(testResults).values(result);
  return insertResult.insertId;
}

export async function getTestResultByInvitation(invitationId: number) {
  const db = await getDb();
  if (!db) return null;

  const [result] = await db
    .select()
    .from(testResults)
    .where(eq(testResults.invitationId, invitationId))
    .limit(1);

  return result || null;
}

export async function getTestResultsByEmployee(employeeId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(testResults)
    .where(eq(testResults.employeeId, employeeId))
    .orderBy(desc(testResults.completedAt));
}

export async function getLatestTestResultByType(
  employeeId: number,
  testType: string
) {
  const db = await getDb();
  if (!db) return null;

  const [result] = await db
    .select()
    .from(testResults)
    .where(
      and(
        eq(testResults.employeeId, employeeId),
        eq(testResults.testType, testType as any)
      )
    )
    .orderBy(desc(testResults.completedAt))
    .limit(1);

  return result || null;
}

export async function getAllTestResults() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      result: testResults,
      employee: employees,
    })
    .from(testResults)
    .leftJoin(employees, eq(testResults.employeeId, employees.id))
    .orderBy(desc(testResults.completedAt));
}

// ============================================================================
// TEST QUESTIONS
// ============================================================================

export async function getTestQuestionsByType(testType: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(testQuestions)
    .where(eq(testQuestions.testType, testType as any))
    .orderBy(testQuestions.questionNumber);
}

export async function countTestQuestions(testType: string) {
  const db = await getDb();
  if (!db) return 0;

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(testQuestions)
    .where(eq(testQuestions.testType, testType as any));

  return result?.count || 0;
}

// ============================================================================
// ANALYTICS & REPORTS
// ============================================================================

export async function getTestCompletionStats() {
  const db = await getDb();
  if (!db) return null;

  const [stats] = await db
    .select({
      total: sql<number>`count(*)`,
      pendente: sql<number>`sum(case when status = 'pendente' then 1 else 0 end)`,
      em_andamento: sql<number>`sum(case when status = 'em_andamento' then 1 else 0 end)`,
      concluido: sql<number>`sum(case when status = 'concluido' then 1 else 0 end)`,
      expirado: sql<number>`sum(case when status = 'expirado' then 1 else 0 end)`,
    })
    .from(testInvitations);

  return stats;
}

export async function getTestResultsByType() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      testType: testResults.testType,
      count: sql<number>`count(*)`,
    })
    .from(testResults)
    .groupBy(testResults.testType);
}

/**
 * Buscar resultado de teste por ID
 */
export async function getTestResultById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(testResults)
    .where(eq(testResults.id, id))
    .limit(1);

  return results.length > 0 ? results[0] : null;
}
