import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../server/routers";
import { createCallerFactory } from "../server/_core/trpc";

const createCaller = createCallerFactory(appRouter);

describe("Audit Router", () => {
  let caller: ReturnType<typeof createCaller>;

  beforeAll(() => {
    // Mock de usuário admin para testes
    caller = createCaller({
      user: {
        id: 1,
        openId: "test-admin",
        name: "Admin Test",
        email: "admin@test.com",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        loginMethod: null,
        isSalaryLead: false,
        faceDescriptor: null,
        facePhotoUrl: null,
        faceRegisteredAt: null,
      },
      req: {} as any,
      res: {} as any,
    });
  });

  it("deve registrar uma ação de auditoria", async () => {
    const result = await caller.audit.log({
      action: "test_action",
      entityType: "test_entity",
      entityId: 123,
      details: { test: "data" },
      ipAddress: "127.0.0.1",
      userAgent: "test-agent",
    });

    expect(result.success).toBe(true);
  });

  it("deve listar logs de auditoria", async () => {
    const result = await caller.audit.list({
      limit: 10,
      offset: 0,
    });

    expect(result).toHaveProperty("logs");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("hasMore");
    expect(Array.isArray(result.logs)).toBe(true);
  });

  it("deve obter estatísticas de auditoria", async () => {
    const result = await caller.audit.stats();

    expect(result).toHaveProperty("total24h");
    expect(result).toHaveProperty("total7d");
    expect(result).toHaveProperty("total30d");
    expect(result).toHaveProperty("topActions");
    expect(result).toHaveProperty("topUsers");
    expect(Array.isArray(result.topActions)).toBe(true);
    expect(Array.isArray(result.topUsers)).toBe(true);
  });

  it("deve detectar atividades suspeitas", async () => {
    const result = await caller.audit.detectSuspiciousActivity();

    expect(result).toHaveProperty("failedActions");
    expect(result).toHaveProperty("multipleIPs");
    expect(result).toHaveProperty("abnormalVolume");
    expect(result).toHaveProperty("hasIssues");
    expect(Array.isArray(result.failedActions)).toBe(true);
    expect(Array.isArray(result.multipleIPs)).toBe(true);
    expect(Array.isArray(result.abnormalVolume)).toBe(true);
  });

  it("deve exportar logs em formato CSV", async () => {
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    const result = await caller.audit.export({
      startDate,
      endDate,
      format: "csv",
    });

    expect(result.format).toBe("csv");
    expect(result.data).toBeTypeOf("string");
    expect(result.data).toContain("ID");
  });

  it("deve exportar logs em formato JSON", async () => {
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    const result = await caller.audit.export({
      startDate,
      endDate,
      format: "json",
    });

    expect(result.format).toBe("json");
    expect(result.data).toBeTypeOf("string");
    expect(() => JSON.parse(result.data)).not.toThrow();
  });

  it("deve filtrar logs por usuário", async () => {
    const result = await caller.audit.list({
      userId: 1,
      limit: 10,
      offset: 0,
    });

    expect(result.logs.every((log) => log.userId === 1)).toBe(true);
  });

  it("deve filtrar logs por tipo de ação", async () => {
    const result = await caller.audit.list({
      action: "test",
      limit: 10,
      offset: 0,
    });

    expect(result.logs.every((log) => log.action.includes("test"))).toBe(true);
  });

  it("deve filtrar logs por período", async () => {
    const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const endDate = new Date();

    const result = await caller.audit.list({
      startDate,
      endDate,
      limit: 10,
      offset: 0,
    });

    expect(
      result.logs.every(
        (log) => log.timestamp >= startDate && log.timestamp <= endDate
      )
    ).toBe(true);
  });
});
