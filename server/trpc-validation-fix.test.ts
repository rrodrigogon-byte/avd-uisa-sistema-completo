import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import type { Request, Response } from "express";

/**
 * Teste para validar correção do erro de validação tRPC
 * "Invalid input: expected object, received undefined"
 * 
 * Problema: Procedures com .input(z.object({})) não aceitavam undefined
 * Solução: Substituir por .input(z.object({}).optional())
 * 
 * Este teste valida que as procedures agora aceitam undefined sem erro
 */

describe("Correção de Validação tRPC - input(z.object({}).optional())", () => {
  let caller: any;

  beforeAll(async () => {
    // Criar contexto de teste com usuário admin
    const mockReq = {
      headers: {},
      cookies: {},
    } as unknown as Request;

    const mockRes = {
      cookie: () => {},
      clearCookie: () => {},
    } as unknown as Response;

    const ctx = await createContext({ req: mockReq, res: mockRes });
    
    // Simular usuário autenticado como admin
    (ctx as any).user = {
      id: 1,
      openId: "test-admin",
      name: "Test Admin",
      email: "admin@test.com",
      role: "admin",
    };

    caller = appRouter.createCaller(ctx);
  });

  it("deve aceitar undefined em procedures com input optional - pendencias.countByStatus", async () => {
    const result = await caller.pendencias.countByStatus(undefined);
    expect(result).toBeDefined();
  });

  it("deve aceitar undefined em procedures com input optional - costCenters.list", async () => {
    const result = await caller.costCenters.list(undefined);
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("deve aceitar undefined em procedures com input optional - approvalRules.getDepartments", async () => {
    const result = await caller.approvalRules.getDepartments(undefined);
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("deve aceitar undefined em procedures com input optional - approvalRules.getCostCenters", async () => {
    const result = await caller.approvalRules.getCostCenters(undefined);
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("deve aceitar undefined em procedures com input optional - departments.list", async () => {
    const result = await caller.departments.list(undefined);
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("deve aceitar undefined em procedures com input optional - positions.list", async () => {
    const result = await caller.positionsManagement.list(undefined);
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("deve aceitar undefined em procedures com input optional - competencies.list", async () => {
    const result = await caller.competencies.list(undefined);
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("deve aceitar undefined em procedures com input optional - orgChart.getOrgChart", async () => {
    const result = await caller.orgChart.getOrgChart(undefined);
    expect(result).toBeDefined();
  });

  it("deve aceitar undefined em procedures com input optional - cycles.list", async () => {
    const result = await caller.cycles.list(undefined);
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("deve aceitar undefined em procedures com input optional - employees.getCurrent", async () => {
    const result = await caller.employees.getCurrent(undefined);
    expect(result).toBeDefined();
  });

  it("deve aceitar undefined em procedures com input optional - notifications.getInApp", async () => {
    const result = await caller.notifications.getInApp(undefined);
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("deve aceitar undefined em procedures com input optional - analytics.getKPIs", async () => {
    const result = await caller.analytics.getKPIs(undefined);
    expect(result).toBeDefined();
  });

  it("deve aceitar undefined em procedures com input optional - badgesRouter.getBadges", async () => {
    const result = await caller.badges.getBadges(undefined);
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("deve aceitar undefined em procedures com input optional - analytics.getPerformanceTrends", async () => {
    const result = await caller.analytics.getPerformanceTrends(undefined);
    expect(result).toBeDefined();
  });

  it("deve aceitar undefined em procedures com input optional - analytics.getNineBoxDistribution", async () => {
    const result = await caller.analytics.getNineBoxDistribution(undefined);
    expect(result).toBeDefined();
  });

  it("deve aceitar undefined em procedures com input optional - analytics.getCompletionRates", async () => {
    const result = await caller.analytics.getCompletionRates(undefined);
    expect(result).toBeDefined();
  });
});
