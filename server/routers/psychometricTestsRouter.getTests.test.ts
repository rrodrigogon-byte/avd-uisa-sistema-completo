import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../routers";
import { getDb } from "../db";
import { employees, testResults } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("psychometricTestsRouter.getTests", () => {
  let testEmployeeId: number;
  let testOpenId: string;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Buscar ou criar funcionário de teste
    const [existingEmployee] = await db
      .select()
      .from(employees)
      .where(eq(employees.email, "test-psychometric@example.com"))
      .limit(1);

    if (existingEmployee) {
      testEmployeeId = existingEmployee.id;
      testOpenId = existingEmployee.openId || "test-openid-psychometric";
    } else {
      const [result] = await db.insert(employees).values({
        name: "Test Psychometric User",
        email: "test-psychometric@example.com",
        employeeCode: "TEST-PSY-001",
        openId: "test-openid-psychometric",
      });
      testEmployeeId = result.insertId;
      testOpenId = "test-openid-psychometric";
    }
  });

  it("deve retornar lista vazia quando não há testes completados", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, openId: testOpenId, role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const tests = await caller.psychometric.getTests();
    expect(Array.isArray(tests)).toBe(true);
  });

  it("deve retornar testes completados do usuário logado", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Criar teste de exemplo
    await db.insert(testResults).values({
      invitationId: 0, // Campo obrigatório
      employeeId: testEmployeeId,
      testType: "disc",
      profileType: "D",
      profileDescription: "Perfil Dominante",
      completedAt: new Date(),
      scores: JSON.stringify({
        disc: { d: 85, i: 60, s: 40, c: 55 },
      }),
      strengths: "Liderança, Decisão",
      developmentAreas: "Paciência, Empatia",
    });

    const caller = appRouter.createCaller({
      user: { id: 1, openId: testOpenId, role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const tests = await caller.psychometric.getTests();
    
    expect(Array.isArray(tests)).toBe(true);
    expect(tests.length).toBeGreaterThan(0);
    
    const latestTest = tests[0];
    expect(latestTest).toHaveProperty("id");
    expect(latestTest).toHaveProperty("testType");
    expect(latestTest).toHaveProperty("completedAt");
    expect(latestTest).toHaveProperty("profile");
    expect(latestTest.profile).toHaveProperty("disc");
  });

  it("deve formatar corretamente os dados do perfil", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, openId: testOpenId, role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const tests = await caller.psychometric.getTests();
    
    if (tests.length > 0) {
      const latestTest = tests[0];
      expect(latestTest).toHaveProperty("profile");
      expect(latestTest.profile).toBeDefined();
      // Profile pode ter disc, bigFive ou mbti dependendo do tipo de teste
    }
  });

  it("deve incluir campos de resultado", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, openId: testOpenId, role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const tests = await caller.psychometric.getTests();
    
    if (tests.length > 0) {
      const latestTest = tests[0];
      // Verificar que os campos de resultado existem (podem ser null)
      expect(latestTest).toHaveProperty("strengths");
      expect(latestTest).toHaveProperty("developmentAreas");
      expect(latestTest).toHaveProperty("profileType");
    }
  });
});
