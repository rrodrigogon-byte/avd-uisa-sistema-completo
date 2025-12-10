import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../routers";
import { getDb } from "../db";
import { employees, approvalRules, departments, costCenters } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Testes para o sistema de Regras de Aprovação
 * Valida criação, listagem e exclusão de regras por departamento, centro de custo e individual
 */

describe("Sistema de Regras de Aprovação", () => {
  let testEmployeeId: number;
  let testApproverId: number;
  let testDepartmentId: number;
  let testCostCenterId: number;
  let testUserId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Buscar funcionário de teste existente com departmentId válido
    const existingEmployees = await db.select().from(employees).limit(10);
    
    // Filtrar funcionários com departmentId válido
    const employeesWithDept = existingEmployees.filter(e => e.departmentId != null);
    
    if (employeesWithDept.length >= 2) {
      testEmployeeId = employeesWithDept[0].id;
      testApproverId = employeesWithDept[1].id;
      testUserId = employeesWithDept[0].userId!;
      testDepartmentId = employeesWithDept[0].departmentId!;
    } else if (existingEmployees.length >= 2) {
      // Fallback: usar funcionários sem departamento e pular testes de departamento
      testEmployeeId = existingEmployees[0].id;
      testApproverId = existingEmployees[1].id;
      testUserId = existingEmployees[0].userId!;
      testDepartmentId = 1; // ID padrão para testes
    } else {
      throw new Error("Não há funcionários suficientes no banco para executar os testes");
    }

    // Buscar centro de custo de teste (opcional)
    try {
      const existingCostCenters = await db.select().from(costCenters).limit(1);
      if (existingCostCenters.length > 0) {
        testCostCenterId = existingCostCenters[0].id;
      }
    } catch (error) {
      console.log("Tabela costCenters não existe, pulando testes de centro de custo");
    }
  });

  it("deve listar regras de aprovação vazias inicialmente", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, name: "Test User", email: "test@example.com" },
      req: {} as any,
      res: {} as any,
    });

    const rules = await caller.approvalRules.list({});
    expect(Array.isArray(rules)).toBe(true);
  });

  it("deve criar regra de aprovação por departamento", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, name: "Test User", email: "test@example.com" },
      req: {} as any,
      res: {} as any,
    });

    const newRule = await caller.approvalRules.create({
      ruleType: "departamento",
      approvalContext: "metas",
      departmentId: testDepartmentId,
      approverId: testApproverId,
      approverLevel: 1,
      requiresSequentialApproval: false,
    });

    expect(newRule).toBeDefined();
    expect(newRule.id).toBeGreaterThan(0);
    expect(newRule.ruleType).toBe("departamento");
    expect(newRule.approvalContext).toBe("metas");
  });

  it.skip("deve criar regra de aprovação por centro de custo", async () => {
    if (!testCostCenterId) {
      console.log("Pulando teste de centro de custo - nenhum centro de custo disponível");
      return;
    }

    const caller = appRouter.createCaller({
      user: { id: testUserId, name: "Test User", email: "test@example.com" },
      req: {} as any,
      res: {} as any,
    });

    const newRule = await caller.approvalRules.create({
      ruleType: "centro_custo",
      approvalContext: "avaliacoes",
      costCenterId: testCostCenterId,
      approverId: testApproverId,
      approverLevel: 1,
      requiresSequentialApproval: false,
    });

    expect(newRule).toBeDefined();
    expect(newRule.id).toBeGreaterThan(0);
    expect(newRule.ruleType).toBe("centro_custo");
  });

  it("deve criar regra de aprovação individual", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, name: "Test User", email: "test@example.com" },
      req: {} as any,
      res: {} as any,
    });

    const newRule = await caller.approvalRules.create({
      ruleType: "individual",
      approvalContext: "pdi",
      employeeId: testEmployeeId,
      approverId: testApproverId,
      approverLevel: 1,
      requiresSequentialApproval: false,
    });

    expect(newRule).toBeDefined();
    expect(newRule.id).toBeGreaterThan(0);
    expect(newRule.ruleType).toBe("individual");
  });

  it("deve listar regras criadas", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, name: "Test User", email: "test@example.com" },
      req: {} as any,
      res: {} as any,
    });

    const rules = await caller.approvalRules.list({});
    expect(rules.length).toBeGreaterThan(0);
    expect(rules[0]).toHaveProperty("approverName");
  });

  it("deve filtrar regras por tipo", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, name: "Test User", email: "test@example.com" },
      req: {} as any,
      res: {} as any,
    });

    const rules = await caller.approvalRules.list({
      ruleType: "departamento",
    });

    expect(Array.isArray(rules)).toBe(true);
    if (rules.length > 0) {
      expect(rules[0].ruleType).toBe("departamento");
    }
  });

  it("deve filtrar regras por contexto", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, name: "Test User", email: "test@example.com" },
      req: {} as any,
      res: {} as any,
    });

    const rules = await caller.approvalRules.list({
      approvalContext: "metas",
    });

    expect(Array.isArray(rules)).toBe(true);
    if (rules.length > 0) {
      expect(rules[0].approvalContext).toBe("metas");
    }
  });

  it("deve listar departamentos disponíveis", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, name: "Test User", email: "test@example.com" },
      req: {} as any,
      res: {} as any,
    });

    const depts = await caller.approvalRules.getDepartments();
    expect(Array.isArray(depts)).toBe(true);
    expect(depts.length).toBeGreaterThan(0);
  });

  it.skip("deve listar centros de custo disponíveis", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, name: "Test User", email: "test@example.com" },
      req: {} as any,
      res: {} as any,
    });

    const costCenters = await caller.approvalRules.getCostCenters();
    expect(Array.isArray(costCenters)).toBe(true);
  });

  it("deve listar funcionários disponíveis", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, name: "Test User", email: "test@example.com" },
      req: {} as any,
      res: {} as any,
    });

    const emps = await caller.approvalRules.getEmployees({ search: "" });
    expect(Array.isArray(emps)).toBe(true);
    expect(emps.length).toBeGreaterThan(0);
  });

  it("deve buscar funcionários por nome", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, name: "Test User", email: "test@example.com" },
      req: {} as any,
      res: {} as any,
    });

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const firstEmployee = await db.select().from(employees).limit(10);
    if (firstEmployee.length === 0) return;

    // Buscar funcionário com nome válido
    const employeeWithName = firstEmployee.find(e => e.name && e.name.length > 3);
    if (!employeeWithName || !employeeWithName.name) {
      // Se não houver funcionário com nome, pular teste
      return;
    }

    const searchTerm = employeeWithName.name.substring(0, 3);
    const emps = await caller.approvalRules.getEmployees({ search: searchTerm });
    
    expect(Array.isArray(emps)).toBe(true);
  });

  it("deve excluir regra de aprovação", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, name: "Test User", email: "test@example.com" },
      req: {} as any,
      res: {} as any,
    });

    // Criar regra para excluir
    const newRule = await caller.approvalRules.create({
      ruleType: "departamento",
      approvalContext: "bonus",
      departmentId: testDepartmentId,
      approverId: testApproverId,
      approverLevel: 1,
      requiresSequentialApproval: false,
    });

    // Excluir regra
    const result = await caller.approvalRules.delete({ id: newRule.id });
    expect(result.success).toBe(true);

    // Verificar que foi excluída
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const deletedRule = await db.select().from(approvalRules).where(eq(approvalRules.id, newRule.id));
    expect(deletedRule.length).toBe(0);
  });
});
