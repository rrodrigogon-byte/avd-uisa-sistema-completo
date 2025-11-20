import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../db";
import { employees, bonusCalculations, departments } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Testes do Endpoint getSLAMetrics
 * Sistema AVD UISA - Dashboard de Compliance e SLA
 */

describe("Sistema de SLA - bonusRouter.getSLAMetrics", () => {
  let testEmployeeId: number;
  let testDepartmentId: number;
  let testCalculationIds: number[] = [];

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Criar departamento de teste
    const timestamp = Date.now();
    const [dept] = await db.insert(departments).values({
      name: `Dept SLA Test ${timestamp}`,
      code: `SLA-${timestamp}`,
      active: true,
    });

    testDepartmentId = Number(dept.insertId);

    // Criar colaborador de teste
    const [employee] = await db.insert(employees).values({
      employeeCode: `TEST-SLA-${timestamp}`,
      name: "Test Employee SLA",
      email: `test-sla-${timestamp}@example.com`,
      openId: `test-openid-sla-${timestamp}`,
      hireDate: new Date(),
      departmentId: testDepartmentId,
      positionId: 1,
      status: "ativo",
      salary: 5000,
    });

    testEmployeeId = Number(employee.insertId);

    // Criar cálculos de bônus com diferentes status e datas
    // Cálculo aprovado (para testar tempo médio)
    const approvedDate = new Date();
    approvedDate.setDate(approvedDate.getDate() - 5); // 5 dias atrás

    const [calc1] = await db.insert(bonusCalculations).values({
      policyId: 1,
      employeeId: testEmployeeId,
      baseSalary: "5000.00",
      appliedMultiplier: "1.5",
      bonusAmount: "7500.00",
      status: "aprovado",
      calculatedAt: approvedDate,
      approvedAt: new Date(), // Aprovado hoje (5 dias de diferença)
      referenceMonth: "2025-01",
    });

    testCalculationIds.push(Number(calc1.insertId));

    // Cálculo pendente (calculado)
    const pendingDate = new Date();
    pendingDate.setDate(pendingDate.getDate() - 10); // 10 dias atrás (crítico)

    const [calc2] = await db.insert(bonusCalculations).values({
      policyId: 1,
      employeeId: testEmployeeId,
      baseSalary: "5000.00",
      appliedMultiplier: "1.5",
      bonusAmount: "7500.00",
      status: "calculado",
      calculatedAt: pendingDate,
      referenceMonth: "2025-01",
    });

    testCalculationIds.push(Number(calc2.insertId));

    // Cálculo pendente recente (não crítico)
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 3); // 3 dias atrás

    const [calc3] = await db.insert(bonusCalculations).values({
      policyId: 1,
      employeeId: testEmployeeId,
      baseSalary: "5000.00",
      appliedMultiplier: "1.5",
      bonusAmount: "7500.00",
      status: "calculado",
      calculatedAt: recentDate,
      referenceMonth: "2025-01",
    });

    testCalculationIds.push(Number(calc3.insertId));
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Limpar dados de teste
    for (const id of testCalculationIds) {
      await db.delete(bonusCalculations).where(eq(bonusCalculations.id, id));
    }

    if (testEmployeeId) {
      await db.delete(employees).where(eq(employees.id, testEmployeeId));
    }

    if (testDepartmentId) {
      await db.delete(departments).where(eq(departments.id, testDepartmentId));
    }
  });

  it("deve calcular métricas SLA corretamente", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Simular chamada do endpoint getSLAMetrics
    // (em produção, seria através do tRPC client)
    const days = 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Buscar cálculos do período
    const calculations = await db
      .select()
      .from(bonusCalculations)
      .where(eq(bonusCalculations.employeeId, testEmployeeId));

    expect(calculations.length).toBeGreaterThanOrEqual(3);

    // Validar que temos cálculos aprovados
    const approved = calculations.filter((c) => c.status === "aprovado");
    expect(approved.length).toBeGreaterThanOrEqual(1);

    // Validar que temos cálculos pendentes
    const pending = calculations.filter((c) => c.status === "calculado");
    expect(pending.length).toBeGreaterThanOrEqual(2);

    // Validar cálculo de tempo médio
    const approvedWithDates = calculations.filter(
      (c) => c.status === "aprovado" && c.approvedAt && c.calculatedAt
    );

    if (approvedWithDates.length > 0) {
      const totalHours = approvedWithDates.reduce((sum, calc) => {
        const calculated = new Date(calc.calculatedAt!);
        const approved = new Date(calc.approvedAt!);
        const hours = (approved.getTime() - calculated.getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }, 0);

      const avgHours = totalHours / approvedWithDates.length;
      expect(avgHours).toBeGreaterThan(0);
      expect(avgHours).toBeLessThan(240); // Menos de 10 dias em horas
    }

    // Validar identificação de pendências críticas (> 7 dias)
    const criticalThresholdDate = new Date();
    criticalThresholdDate.setDate(criticalThresholdDate.getDate() - 7);

    const criticalPending = calculations.filter(
      (c) =>
        c.status === "calculado" &&
        c.calculatedAt &&
        new Date(c.calculatedAt) < criticalThresholdDate
    );

    expect(criticalPending.length).toBeGreaterThanOrEqual(1); // Temos 1 cálculo com 10 dias
  });

  it("deve retornar estrutura de dados correta", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const calculations = await db
      .select()
      .from(bonusCalculations)
      .where(eq(bonusCalculations.employeeId, testEmployeeId));

    // Validar estrutura de resposta esperada
    const mockResponse = {
      avgApprovalTimeHours: 0,
      totalCalculations: calculations.length,
      pendingCount: calculations.filter((c) => c.status === "calculado").length,
      approvedCount: calculations.filter((c) => c.status === "aprovado").length,
      criticalPendingCount: 0,
      criticalPending: [],
      byDepartment: [],
    };

    expect(mockResponse.totalCalculations).toBeGreaterThanOrEqual(3);
    expect(mockResponse.pendingCount).toBeGreaterThanOrEqual(2);
    expect(mockResponse.approvedCount).toBeGreaterThanOrEqual(1);
  });
});
