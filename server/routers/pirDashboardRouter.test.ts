import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../routers";
import { getDb } from "../db";
import { employees, pirAssessments, pirAnswers, pirQuestions, evaluationCycles } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("pirDashboardRouter", () => {
  let testEmployeeId: number;
  let testCycleId: number;
  let testAssessmentId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Criar funcionário de teste
    const [employeeResult] = await db.insert(employees).values({
      name: "Test PIR Dashboard User",
      email: "test-pir-dashboard@example.com",
      employeeCode: "TEST-PIR-DASH-001",
      openId: "test-openid-pir-dashboard",
    });
    testEmployeeId = employeeResult.insertId;

    // Criar ciclo de teste
    const [cycleResult] = await db.insert(evaluationCycles).values({
      name: "Ciclo Teste PIR Dashboard",
      year: 2025,
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      status: "ativo",
    });
    testCycleId = cycleResult.insertId;

    // Criar avaliação PIR de teste
    const [assessmentResult] = await db.insert(pirAssessments).values({
      employeeId: testEmployeeId,
      cycleId: testCycleId,
      assessmentDate: new Date(),
      status: "concluida",
      overallScore: 85,
      completedAt: new Date(),
      createdBy: 1, // Campo obrigatório
    });
    testAssessmentId = assessmentResult.insertId;
  });

  it("deve retornar estatísticas gerais do PIR", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, openId: "admin-openid", role: "admin" },
      req: {} as any,
      res: {} as any,
    });

    const stats = await caller.pirDashboard.getStats({});
    
    expect(stats).toHaveProperty("totalAssessments");
    expect(stats).toHaveProperty("avgScore");
    expect(stats).toHaveProperty("scoreRanges");
    expect(stats.scoreRanges).toHaveProperty("excepcional");
    expect(stats.scoreRanges).toHaveProperty("supera");
    expect(stats.scoreRanges).toHaveProperty("atende");
    expect(stats.scoreRanges).toHaveProperty("abaixo");
  });

  it("deve filtrar estatísticas por ciclo", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, openId: "admin-openid", role: "admin" },
      req: {} as any,
      res: {} as any,
    });

    const stats = await caller.pirDashboard.getStats({
      cycleId: testCycleId,
    });
    
    expect(stats).toHaveProperty("totalAssessments");
    expect(stats.totalAssessments).toBeGreaterThanOrEqual(0);
  });

  it("deve retornar distribuição de notas por dimensão", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, openId: "admin-openid", role: "admin" },
      req: {} as any,
      res: {} as any,
    });

    const distribution = await caller.pirDashboard.getDimensionDistribution({});
    
    expect(distribution).toHaveProperty("IP");
    expect(distribution).toHaveProperty("ID");
    expect(distribution).toHaveProperty("IC");
    expect(distribution).toHaveProperty("ES");
    expect(distribution).toHaveProperty("FL");
    expect(distribution).toHaveProperty("AU");
  });

  it("deve retornar evolução temporal das avaliações", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, openId: "admin-openid", role: "admin" },
      req: {} as any,
      res: {} as any,
    });

    const evolution = await caller.pirDashboard.getTemporalEvolution({
      months: 12,
    });
    
    expect(Array.isArray(evolution)).toBe(true);
  });

  it("deve listar ciclos disponíveis", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, openId: "admin-openid", role: "admin" },
      req: {} as any,
      res: {} as any,
    });

    const cycles = await caller.pirDashboard.listCycles();
    
    expect(Array.isArray(cycles)).toBe(true);
    expect(cycles.length).toBeGreaterThan(0);
  });

  it("deve listar departamentos", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, openId: "admin-openid", role: "admin" },
      req: {} as any,
      res: {} as any,
    });

    const departments = await caller.pirDashboard.listDepartments();
    
    expect(Array.isArray(departments)).toBe(true);
  });

  it("deve listar cargos", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, openId: "admin-openid", role: "admin" },
      req: {} as any,
      res: {} as any,
    });

    const positions = await caller.pirDashboard.listPositions();
    
    expect(Array.isArray(positions)).toBe(true);
  });

  it("deve calcular corretamente as faixas de desempenho", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, openId: "admin-openid", role: "admin" },
      req: {} as any,
      res: {} as any,
    });

    const stats = await caller.pirDashboard.getStats({});
    
    const totalByRanges = 
      stats.scoreRanges.excepcional +
      stats.scoreRanges.supera +
      stats.scoreRanges.atende +
      stats.scoreRanges.abaixo;
    
    expect(totalByRanges).toBe(stats.totalAssessments);
  });

  it("deve exportar dados para PDF", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, openId: "admin-openid", role: "admin" },
      req: {} as any,
      res: {} as any,
    });

    const exportData = await caller.pirDashboard.exportPDF({
      cycleId: testCycleId,
    });
    
    expect(exportData).toHaveProperty("success");
    expect(exportData).toHaveProperty("data");
    expect(exportData).toHaveProperty("totalAssessments");
    expect(exportData).toHaveProperty("avgScore");
    expect(exportData.success).toBe(true);
  });
});
