import { describe, it, expect, beforeAll } from "vitest";
import { getDb, getUserEmployee } from "../db";
import { smartGoals, goalComments, employees, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("updateProgress endpoint", () => {
  let testUserId: number;
  let testEmployeeId: number;
  let testGoalId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Buscar usuário admin existente
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"))
      .limit(1);
    
    if (userResult.length === 0) {
      throw new Error("No admin user found");
    }
    testUserId = userResult[0].id;

    // Buscar employee vinculado ao usuário
    const employee = await getUserEmployee(testUserId);
    if (!employee) {
      throw new Error(`No employee found for user ${testUserId}`);
    }
    testEmployeeId = employee.id;

    // Buscar uma meta do employee
    const goalResult = await db
      .select()
      .from(smartGoals)
      .where(eq(smartGoals.employeeId, testEmployeeId))
      .limit(1);
    
    if (goalResult.length === 0) {
      throw new Error(`No goals found for employee ${testEmployeeId}`);
    }
    testGoalId = goalResult[0].id;

    console.log(`Test setup: userId=${testUserId}, employeeId=${testEmployeeId}, goalId=${testGoalId}`);
  });

  it("should update progress without currentValue", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Simular atualização de progresso sem currentValue
    const updateData: any = {
      progress: 45,
      status: "in_progress",
      completedAt: undefined,
    };

    await db
      .update(smartGoals)
      .set(updateData)
      .where(eq(smartGoals.id, testGoalId));

    // Verificar se foi atualizado
    const result = await db
      .select()
      .from(smartGoals)
      .where(eq(smartGoals.id, testGoalId))
      .limit(1);

    expect(result.length).toBe(1);
    expect(result[0].progress).toBe(45);
    expect(result[0].status).toBe("in_progress");
  });

  it("should update progress with currentValue", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Simular atualização de progresso com currentValue
    const updateData: any = {
      progress: 50,
      currentValue: "7.5",
      status: "in_progress",
      completedAt: undefined,
    };

    await db
      .update(smartGoals)
      .set(updateData)
      .where(eq(smartGoals.id, testGoalId));

    // Verificar se foi atualizado
    const result = await db
      .select()
      .from(smartGoals)
      .where(eq(smartGoals.id, testGoalId))
      .limit(1);

    expect(result.length).toBe(1);
    expect(result[0].progress).toBe(50);
    expect(result[0].currentValue).toBe("7.5");
  });

  it("should insert comment with employee.id", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const testComment = `Test comment at ${new Date().toISOString()}`;

    // Inserir comentário
    await db.insert(goalComments).values({
      goalId: testGoalId,
      authorId: testEmployeeId,
      comment: testComment,
    });

    // Verificar se foi inserido
    const result = await db
      .select()
      .from(goalComments)
      .where(eq(goalComments.comment, testComment))
      .limit(1);

    expect(result.length).toBe(1);
    expect(result[0].goalId).toBe(testGoalId);
    expect(result[0].authorId).toBe(testEmployeeId);
    expect(result[0].comment).toBe(testComment);

    console.log(`Comment inserted successfully: id=${result[0].id}`);
  });

  it("should verify getUserEmployee returns correct employee", async () => {
    const employee = await getUserEmployee(testUserId);
    
    expect(employee).toBeDefined();
    expect(employee?.id).toBe(testEmployeeId);
    expect(employee?.userId).toBe(testUserId);
    
    console.log(`getUserEmployee verified: employee.id=${employee?.id}, employee.userId=${employee?.userId}`);
  });
});
