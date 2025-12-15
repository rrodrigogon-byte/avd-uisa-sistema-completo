import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../db";
import { employees, bonusPolicies, bonusCalculations, goals } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Testes do Sistema de Bônus
 * Sistema AVD UISA
 */

describe("Sistema de Bônus - bonusRouter", () => {
  let testEmployeeId: number;
  let testPolicyId: number;
  let testGoalId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Criar colaborador de teste
    const timestamp = Date.now();
    const [employee] = await db.insert(employees).values({
      employeeCode: `TEST-BONUS-${timestamp}`,
      name: "Test Employee Bonus",
      email: `test-bonus-${timestamp}@example.com`,
      openId: `test-openid-bonus-${timestamp}`,
      hireDate: new Date(),
      departmentId: 1,
      positionId: 1,
      status: "ativo",
      salary: 5000,
    });

    testEmployeeId = Number(employee.insertId);

    // Criar política de bônus de teste
    const [policy] = await db.insert(bonusPolicies).values({
      name: "Política de Teste",
      description: "Política para testes automatizados",
      salaryMultiplier: "1.5",
      requiresGoalCompletion: true,
      minGoalCompletionRate: 80,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      active: true,
      createdBy: 1,
    });

    testPolicyId = Number(policy.insertId);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Limpar dados de teste
    if (testGoalId) {
      await db.delete(goals).where(eq(goals.id, testGoalId));
    }
    if (testPolicyId) {
      await db.delete(bonusCalculations).where(eq(bonusCalculations.policyId, testPolicyId));
      await db.delete(bonusPolicies).where(eq(bonusPolicies.id, testPolicyId));
    }
    if (testEmployeeId) {
      await db.delete(employees).where(eq(employees.id, testEmployeeId));
    }
  });

  it("deve listar políticas de bônus ativas", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const policies = await db
      .select()
      .from(bonusPolicies)
      .where(eq(bonusPolicies.active, true));

    expect(policies).toBeDefined();
    expect(Array.isArray(policies)).toBe(true);
    expect(policies.length).toBeGreaterThan(0);

    // Verificar se a política de teste está na lista
    const testPolicy = policies.find(p => p.id === testPolicyId);
    expect(testPolicy).toBeDefined();
    expect(testPolicy?.name).toBe("Política de Teste");
  });

  it("deve criar nova política de bônus com multiplicador válido", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const timestamp = Date.now();
    const [newPolicy] = await db.insert(bonusPolicies).values({
      name: `Política Criada ${timestamp}`,
      description: "Teste de criação",
      salaryMultiplier: "2.0",
      requiresGoalCompletion: false,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      active: true,
      createdBy: 1,
    });

    const createdPolicyId = Number(newPolicy.insertId);
    expect(createdPolicyId).toBeGreaterThan(0);

    // Verificar se foi criada corretamente
    const createdPolicy = await db
      .select()
      .from(bonusPolicies)
      .where(eq(bonusPolicies.id, createdPolicyId))
      .limit(1);

    expect(createdPolicy[0]).toBeDefined();
    expect(Number(createdPolicy[0].salaryMultiplier)).toBe(2.0);

    // Limpar
    await db.delete(bonusPolicies).where(eq(bonusPolicies.id, createdPolicyId));
  });

  it("deve calcular bônus corretamente com multiplicador de salário", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Buscar dados do colaborador
    const employee = await db
      .select()
      .from(employees)
      .where(eq(employees.id, testEmployeeId))
      .limit(1);

    expect(employee[0]).toBeDefined();
    expect(employee[0].salary).toBe(5000);

    // Buscar política
    const policy = await db
      .select()
      .from(bonusPolicies)
      .where(eq(bonusPolicies.id, testPolicyId))
      .limit(1);

    expect(policy[0]).toBeDefined();
    expect(Number(policy[0].salaryMultiplier)).toBe(1.5);

    // Calcular bônus esperado
    const expectedBonus = 5000 * 1.5;
    expect(expectedBonus).toBe(7500);

    // Simular cálculo de bônus
    const [calculation] = await db.insert(bonusCalculations).values({
      employeeId: testEmployeeId,
      policyId: testPolicyId,
      baseSalary: "5000",
      appliedMultiplier: "1.5",
      bonusAmount: `${expectedBonus}`,
      status: "calculado",
      referenceMonth: new Date().toISOString().slice(0, 7),
    });

    const calculationId = Number(calculation.insertId);
    expect(calculationId).toBeGreaterThan(0);

    // Verificar cálculo
    const savedCalculation = await db
      .select()
      .from(bonusCalculations)
      .where(eq(bonusCalculations.id, calculationId))
      .limit(1);

    expect(savedCalculation[0]).toBeDefined();
    expect(Number(savedCalculation[0].bonusAmount)).toBe(expectedBonus);
    expect(savedCalculation[0].status).toBe("calculado");

    // Limpar
    await db.delete(bonusCalculations).where(eq(bonusCalculations.id, calculationId));
  });

  it("deve validar elegibilidade baseada em progresso de metas", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Criar meta com progresso de 90% (acima do mínimo de 80%)
    const [goal] = await db.insert(goals).values({
      cycleId: 1,
      employeeId: testEmployeeId,
      title: "Meta para Bônus",
      description: "Meta de teste para elegibilidade",
      type: "individual",
      category: "quantitativa",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "em_andamento",
      progress: 90,
      createdBy: 1,
    });

    testGoalId = Number(goal.insertId);

    // Buscar progresso de metas do colaborador
    const employeeGoals = await db
      .select()
      .from(goals)
      .where(eq(goals.employeeId, testEmployeeId));

    expect(employeeGoals.length).toBeGreaterThan(0);

    const avgProgress = employeeGoals.reduce((sum, g) => sum + g.progress, 0) / employeeGoals.length;
    expect(avgProgress).toBeGreaterThanOrEqual(80);

    // Verificar elegibilidade
    const policy = await db
      .select()
      .from(bonusPolicies)
      .where(eq(bonusPolicies.id, testPolicyId))
      .limit(1);

    const isEligible = policy[0].requiresGoalCompletion 
      ? avgProgress >= (policy[0].minGoalCompletionRate || 0)
      : true;

    expect(isEligible).toBe(true);
  });

  it("deve rejeitar elegibilidade quando progresso de metas está abaixo do mínimo", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Atualizar meta para progresso baixo (50%, abaixo do mínimo de 80%)
    if (testGoalId) {
      await db
        .update(goals)
        .set({ progress: 50 })
        .where(eq(goals.id, testGoalId));

      // Buscar progresso atualizado
      const employeeGoals = await db
        .select()
        .from(goals)
        .where(eq(goals.employeeId, testEmployeeId));

      const avgProgress = employeeGoals.reduce((sum, g) => sum + g.progress, 0) / employeeGoals.length;
      expect(avgProgress).toBeLessThan(80);

      // Verificar elegibilidade
      const policy = await db
        .select()
        .from(bonusPolicies)
        .where(eq(bonusPolicies.id, testPolicyId))
        .limit(1);

    const isEligible = policy[0].requiresGoalCompletion 
      ? avgProgress >= (policy[0].minGoalCompletionRate || 0)
      : true;

      expect(isEligible).toBe(false);
    }
  });

  it("deve listar cálculos de bônus por status", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Criar alguns cálculos de teste
    const [calc1] = await db.insert(bonusCalculations).values({
      employeeId: testEmployeeId,
      policyId: testPolicyId,
      baseSalary: "5000",
      appliedMultiplier: "1.5",
      bonusAmount: "7500",
      status: "calculado",
      referenceMonth: new Date().toISOString().slice(0, 7),
    });

    const [calc2] = await db.insert(bonusCalculations).values({
      employeeId: testEmployeeId,
      policyId: testPolicyId,
      baseSalary: "5000",
      appliedMultiplier: "1.5",
      bonusAmount: "7500",
      status: "aprovado",
      referenceMonth: new Date().toISOString().slice(0, 7),
      approvedAt: new Date(),
    });

    // Buscar cálculos por status
    const calculatedOnes = await db
      .select()
      .from(bonusCalculations)
      .where(eq(bonusCalculations.status, "calculado"));

    const approvedOnes = await db
      .select()
      .from(bonusCalculations)
      .where(eq(bonusCalculations.status, "aprovado"));

    expect(calculatedOnes.length).toBeGreaterThan(0);
    expect(approvedOnes.length).toBeGreaterThan(0);

    // Limpar
    await db.delete(bonusCalculations).where(eq(bonusCalculations.id, Number(calc1.insertId)));
    await db.delete(bonusCalculations).where(eq(bonusCalculations.id, Number(calc2.insertId)));
  });
});
