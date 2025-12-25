import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../server/routers";
import { getDb } from "../server/db";

describe("evaluationCycles.create", () => {
  beforeAll(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available for testing");
    }
  });

  it("should create a new evaluation cycle successfully", async () => {
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: {
        id: 1,
        openId: "test-open-id",
        name: "Test User",
        email: "test@example.com",
        role: "admin",
        isSalaryLead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        loginMethod: "test",
        faceDescriptor: null,
        facePhotoUrl: null,
        faceRegisteredAt: null,
      },
    });

    const startDate = new Date("2025-01-01");
    const endDate = new Date("2025-12-31");

    const result = await caller.evaluationCycles.create({
      name: "Ciclo de Avaliação 2025 - Teste",
      year: 2025,
      type: "anual",
      startDate,
      endDate,
      description: "Ciclo de teste criado via vitest",
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.id).toBeGreaterThan(0);
  });

  it("should fail when endDate is before startDate", async () => {
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: {
        id: 1,
        openId: "test-open-id",
        name: "Test User",
        email: "test@example.com",
        role: "admin",
        isSalaryLead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        loginMethod: "test",
        faceDescriptor: null,
        facePhotoUrl: null,
        faceRegisteredAt: null,
      },
    });

    const startDate = new Date("2025-12-31");
    const endDate = new Date("2025-01-01");

    await expect(
      caller.evaluationCycles.create({
        name: "Ciclo Inválido",
        year: 2025,
        type: "anual",
        startDate,
        endDate,
      })
    ).rejects.toThrow("Data de término deve ser posterior à data de início");
  });

  it("should require authentication", async () => {
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: undefined,
    });

    const startDate = new Date("2025-01-01");
    const endDate = new Date("2025-12-31");

    await expect(
      caller.evaluationCycles.create({
        name: "Ciclo sem autenticação",
        year: 2025,
        type: "anual",
        startDate,
        endDate,
      })
    ).rejects.toThrow();
  });
});
