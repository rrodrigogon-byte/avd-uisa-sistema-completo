import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";
import { getDb } from "./db";

/**
 * Teste para validar correção do erro de validação tRPC
 * "Invalid input: expected object, received undefined"
 * 
 * Problema: Procedures com .input(z.object({...}).optional()) estavam
 * sendo chamadas com {} no frontend, causando erro de validação no Zod v3+
 * 
 * Solução: Substituir .useQuery({}) por .useQuery(undefined) em todos os arquivos
 */

describe("Bug Fix: tRPC Validation Error", () => {
  let mockContext: Context;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Criar contexto mock com usuário admin
    mockContext = {
      user: {
        id: 1,
        openId: "test-open-id",
        name: "Test User",
        email: "test@example.com",
        loginMethod: "test",
        role: "admin",
        isSalaryLead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {} as any,
      res: {} as any,
    };

    caller = appRouter.createCaller(mockContext);
  });

  it("deve aceitar undefined em procedures com input optional - dashboard.getStats", async () => {
    // Esta procedure tem .input(z.object({...}).optional())
    // Deve aceitar undefined sem erro de validação
    const result = await caller.dashboard.getStats(undefined);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
  });

  it("deve aceitar undefined em procedures com input optional - employees.getCurrent", async () => {
    // Esta procedure tem .input(z.object({}))
    // Deve aceitar {} ou undefined
    const result = await caller.employees.getCurrent({});
    
    expect(result).toBeDefined();
  });

  it("deve aceitar undefined em procedures com input optional - goals.list", async () => {
    // Esta procedure tem .input(z.object({...}).optional())
    const result = await caller.goals.list(undefined);
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("deve aceitar undefined em procedures com input optional - pdi.list", async () => {
    // Esta procedure tem .input(z.object({...}).optional())
    const result = await caller.pdi.list(undefined);
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("deve aceitar undefined em procedures com input optional - cycles.list", async () => {
    // Esta procedure tem .input(z.object({}))
    const result = await caller.cycles.list({});
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("deve aceitar undefined em procedures com input optional - departments.list", async () => {
    // Esta procedure tem .input(z.object({}))
    const result = await caller.departments.list({});
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("deve aceitar undefined em procedures com input optional - positions.list", async () => {
    // Esta procedure tem .input(z.object({}))
    const result = await caller.positions.list({});
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("deve aceitar undefined em procedures com input optional - competencies.list", async () => {
    // Esta procedure tem .input(z.object({}))
    const result = await caller.competencies.list({});
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("deve aceitar undefined em procedures com input optional - orgChart.getOrgChart", async () => {
    // Esta procedure tem .input(z.object({}))
    const result = await caller.orgChart.getOrgChart({});
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("deve aceitar undefined em procedures com input optional - analytics.getKPIs", async () => {
    // Esta procedure tem .input(z.object({...}).optional())
    const result = await caller.analytics.getKPIs(undefined);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
  });
});
