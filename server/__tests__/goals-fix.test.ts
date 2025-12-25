import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "../db";
import { smartGoals, evaluationCycles, employees, users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Teste de Correção: Salvamento de Metas SMART
 * 
 * Problema Original:
 * - Campos opcionais (pdiPlanId, departmentId, measurementUnit, etc.) 
 *   estavam sendo enviados como "default" ou undefined
 * - Causava erro SQL: "insert into `smartGoals` ... values (default, ?, ?, ?, default, ...)"
 * 
 * Solução Implementada:
 * - Usar operador ?? null para converter undefined em null
 * - Garantir que o banco receba NULL ao invés de "default" ou undefined
 */

describe("Correção: Salvamento de Metas SMART", () => {
  let db: Awaited<ReturnType<typeof getDb>>;
  let testCycleId: number;
  let testEmployeeId: number;
  let testUserId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    // Buscar um ciclo ativo para testes
    const cycles = await db.select().from(evaluationCycles).limit(1);
    if (cycles.length === 0) {
      throw new Error("Nenhum ciclo de avaliação encontrado para testes");
    }
    testCycleId = cycles[0].id;

    // Buscar um funcionário para testes
    const employeesList = await db.select().from(employees).limit(1);
    if (employeesList.length === 0) {
      throw new Error("Nenhum funcionário encontrado para testes");
    }
    testEmployeeId = employeesList[0].id;

    // Buscar usuário vinculado ao funcionário
    const usersList = await db.select().from(users).limit(1);
    if (usersList.length === 0) {
      throw new Error("Nenhum usuário encontrado para testes");
    }
    testUserId = usersList[0].id;
  });

  it("deve criar meta com campos opcionais como NULL (não undefined)", async () => {
    if (!db) throw new Error("Database not available");

    // Criar meta SEM pdiPlanId, departmentId, bonusPercentage
    const [result] = await db.insert(smartGoals).values({
      employeeId: testEmployeeId,
      departmentId: null, // Explicitamente NULL
      cycleId: testCycleId,
      pdiPlanId: null, // Explicitamente NULL
      title: "Meta de Teste - Correção de Salvamento",
      description: "Esta meta testa a correção do salvamento com campos opcionais NULL",
      type: "individual",
      goalType: "individual",
      category: "development",
      measurementUnit: null, // Explicitamente NULL
      targetValueCents: null, // Explicitamente NULL
      weight: 10,
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      bonusEligible: false,
      bonusPercentage: null, // Explicitamente NULL
      bonusAmountCents: null, // Explicitamente NULL
      isSpecific: true,
      isMeasurable: false,
      isAchievable: true,
      isRelevant: true,
      isTimeBound: true,
      status: "draft",
      approvalStatus: "not_submitted",
      createdBy: testUserId,
    });

    expect(result.insertId).toBeGreaterThan(0);

    // Verificar que a meta foi criada corretamente
    const [createdGoal] = await db
      .select()
      .from(smartGoals)
      .where(eq(smartGoals.id, result.insertId))
      .limit(1);

    expect(createdGoal).toBeDefined();
    expect(createdGoal.title).toBe("Meta de Teste - Correção de Salvamento");
    expect(createdGoal.pdiPlanId).toBeNull();
    expect(createdGoal.departmentId).toBeNull();
    expect(createdGoal.measurementUnit).toBeNull();
    expect(createdGoal.targetValueCents).toBeNull();
    expect(createdGoal.bonusPercentage).toBeNull();
    expect(createdGoal.bonusAmountCents).toBeNull();

    // Limpar teste
    await db.delete(smartGoals).where(eq(smartGoals.id, result.insertId));
  });

  it("deve criar meta com pdiPlanId e outros campos opcionais preenchidos", async () => {
    if (!db) throw new Error("Database not available");

    // Criar meta COM todos os campos opcionais preenchidos
    const [result] = await db.insert(smartGoals).values({
      employeeId: testEmployeeId,
      departmentId: null,
      cycleId: testCycleId,
      pdiPlanId: 999, // Valor fictício para teste
      title: "Meta de Teste - Com Campos Opcionais",
      description: "Esta meta testa o salvamento com todos os campos opcionais preenchidos",
      type: "individual",
      goalType: "individual",
      category: "financial",
      measurementUnit: "R$",
      targetValueCents: 10000,
      weight: 20,
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      bonusEligible: true,
      bonusPercentage: 10,
      bonusAmountCents: 50000,
      isSpecific: true,
      isMeasurable: true,
      isAchievable: true,
      isRelevant: true,
      isTimeBound: true,
      status: "draft",
      approvalStatus: "not_submitted",
      createdBy: testUserId,
    });

    expect(result.insertId).toBeGreaterThan(0);

    // Verificar que a meta foi criada corretamente
    const [createdGoal] = await db
      .select()
      .from(smartGoals)
      .where(eq(smartGoals.id, result.insertId))
      .limit(1);

    expect(createdGoal).toBeDefined();
    expect(createdGoal.title).toBe("Meta de Teste - Com Campos Opcionais");
    expect(createdGoal.pdiPlanId).toBe(999);
    expect(createdGoal.measurementUnit).toBe("R$");
    expect(createdGoal.targetValueCents).toBe(10000);
    expect(createdGoal.bonusPercentage).toBe(10);
    expect(createdGoal.bonusAmountCents).toBe(50000);

    // Limpar teste
    await db.delete(smartGoals).where(eq(smartGoals.id, result.insertId));
  });

  it("deve criar meta organizacional sem employeeId e departmentId", async () => {
    if (!db) throw new Error("Database not available");

    // Criar meta organizacional (sem employeeId)
    const [result] = await db.insert(smartGoals).values({
      employeeId: null, // Meta organizacional não tem employeeId
      departmentId: null,
      cycleId: testCycleId,
      pdiPlanId: null,
      title: "Meta Organizacional - Teste",
      description: "Meta que se aplica a toda a organização",
      type: "organizational",
      goalType: "corporate",
      category: "corporate",
      measurementUnit: "%",
      targetValueCents: 10000,
      weight: 30,
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      bonusEligible: true,
      bonusPercentage: 15,
      bonusAmountCents: null,
      isSpecific: true,
      isMeasurable: true,
      isAchievable: true,
      isRelevant: true,
      isTimeBound: true,
      status: "approved",
      approvalStatus: "approved",
      createdBy: testUserId,
    });

    expect(result.insertId).toBeGreaterThan(0);

    // Verificar que a meta foi criada corretamente
    const [createdGoal] = await db
      .select()
      .from(smartGoals)
      .where(eq(smartGoals.id, result.insertId))
      .limit(1);

    expect(createdGoal).toBeDefined();
    expect(createdGoal.title).toBe("Meta Organizacional - Teste");
    expect(createdGoal.employeeId).toBeNull();
    expect(createdGoal.departmentId).toBeNull();
    expect(createdGoal.type).toBe("organizational");
    expect(createdGoal.goalType).toBe("corporate");
    expect(createdGoal.status).toBe("approved");

    // Limpar teste
    await db.delete(smartGoals).where(eq(smartGoals.id, result.insertId));
  });
});
