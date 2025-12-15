import { describe, it, expect } from "vitest";
import { appRouter } from "../routers";

/**
 * Testes para as melhorias implementadas no sistema de bônus:
 * 1. Correção de imports duplicados (validação estrutural)
 * 2. Exportação para Excel (validação de dados)
 * 3. Gráficos de evolução temporal (endpoints de agregação)
 */

describe("Melhorias do Sistema de Bônus", () => {
  // Criar caller com contexto mock
  const mockUser = {
    id: 1,
    openId: "test-user",
    name: "Test User",
    email: "test@example.com",
    role: "admin" as const,
  };

  const caller = appRouter.createCaller({
    user: mockUser,
    req: {} as any,
    res: {} as any,
  });

  describe("Endpoint getMonthlyTrends", () => {
    it("deve retornar tendências mensais de bônus", async () => {
      const trends = await caller.bonus.getMonthlyTrends({ months: 6 });

      expect(trends).toBeDefined();
      expect(Array.isArray(trends)).toBe(true);

      // Se houver dados, validar estrutura
      if (trends.length > 0) {
        const firstTrend = trends[0];
        expect(firstTrend).toHaveProperty("month");
        expect(firstTrend).toHaveProperty("totalAmount");
        expect(firstTrend).toHaveProperty("count");
        expect(firstTrend).toHaveProperty("paidAmount");
        expect(firstTrend).toHaveProperty("averageBonus");

        // Validar tipos
        expect(typeof firstTrend.month).toBe("string");
        expect(typeof firstTrend.totalAmount).toBe("number");
        expect(typeof firstTrend.count).toBe("number");
        expect(typeof firstTrend.paidAmount).toBe("number");
        expect(typeof firstTrend.averageBonus).toBe("number");
      }
    });

    it("deve respeitar o parâmetro de quantidade de meses", async () => {
      const trends3Months = await caller.bonus.getMonthlyTrends({ months: 3 });
      const trends6Months = await caller.bonus.getMonthlyTrends({ months: 6 });

      expect(trends3Months.length).toBeLessThanOrEqual(3);
      expect(trends6Months.length).toBeLessThanOrEqual(6);
    });

    it("deve calcular corretamente a média de bônus", async () => {
      const trends = await caller.bonus.getMonthlyTrends({ months: 6 });

      trends.forEach((trend) => {
        if (trend.count > 0) {
          const expectedAverage = trend.totalAmount / trend.count;
          expect(trend.averageBonus).toBeCloseTo(expectedAverage, 2);
        } else {
          expect(trend.averageBonus).toBe(0);
        }
      });
    });
  });

  describe("Endpoint getDepartmentDistribution", () => {
    it("deve retornar distribuição de bônus por departamento", async () => {
      const distribution = await caller.bonus.getDepartmentDistribution();

      expect(distribution).toBeDefined();
      expect(Array.isArray(distribution)).toBe(true);

      // Se houver dados, validar estrutura
      if (distribution.length > 0) {
        const firstDept = distribution[0];
        expect(firstDept).toHaveProperty("departmentId");
        expect(firstDept).toHaveProperty("totalAmount");
        expect(firstDept).toHaveProperty("count");
        expect(firstDept).toHaveProperty("averageBonus");

        // Validar tipos
        expect(typeof firstDept.departmentId).toBe("number");
        expect(typeof firstDept.totalAmount).toBe("number");
        expect(typeof firstDept.count).toBe("number");
        expect(typeof firstDept.averageBonus).toBe("number");
      }
    });

    it("deve calcular corretamente a média por departamento", async () => {
      const distribution = await caller.bonus.getDepartmentDistribution();

      distribution.forEach((dept) => {
        if (dept.count > 0) {
          const expectedAverage = dept.totalAmount / dept.count;
          expect(dept.averageBonus).toBeCloseTo(expectedAverage, 2);
        } else {
          expect(dept.averageBonus).toBe(0);
        }
      });
    });

    it("deve retornar apenas departamentos com bônus pagos", async () => {
      const distribution = await caller.bonus.getDepartmentDistribution();

      // Todos os departamentos retornados devem ter pelo menos 1 bônus
      distribution.forEach((dept) => {
        expect(dept.count).toBeGreaterThan(0);
        expect(dept.totalAmount).toBeGreaterThan(0);
      });
    });
  });

  describe("Validação de Dados para Exportação Excel", () => {
    it("deve retornar cálculos com todos os campos necessários para Excel", async () => {
      const calculations = await caller.bonus.listCalculations({ status: "pago" });

      expect(calculations).toBeDefined();
      expect(Array.isArray(calculations)).toBe(true);

      // Se houver dados, validar campos necessários para exportação
      if (calculations.length > 0) {
        const firstCalc = calculations[0];

        // Campos obrigatórios para exportação
        expect(firstCalc).toHaveProperty("id");
        expect(firstCalc).toHaveProperty("employeeId");
        expect(firstCalc).toHaveProperty("baseSalary");
        expect(firstCalc).toHaveProperty("bonusAmount");
        expect(firstCalc).toHaveProperty("status");
        expect(firstCalc).toHaveProperty("calculatedAt");

        // Validar tipos numéricos (valores em centavos)
        expect(typeof firstCalc.baseSalary).toBe("number");
        expect(typeof firstCalc.bonusAmount).toBe("number");
      }
    });

    it("deve retornar estatísticas corretas para KPIs do relatório", async () => {
      const stats = await caller.bonus.getStats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty("activePolicies");
      expect(stats).toHaveProperty("totalCalculations");
      expect(stats).toHaveProperty("totalBonusAmount");

      // Validar tipos
      expect(typeof stats.activePolicies).toBe("number");
      expect(typeof stats.totalCalculations).toBe("number");
      expect(typeof stats.totalBonusAmount).toBe("number");

      // Validar valores não negativos
      expect(stats.activePolicies).toBeGreaterThanOrEqual(0);
      expect(stats.totalCalculations).toBeGreaterThanOrEqual(0);
      expect(stats.totalBonusAmount).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Integridade dos Dados de Bônus", () => {
    it("deve garantir consistência entre cálculos e políticas", async () => {
      const calculations = await caller.bonus.listCalculations({});
      const policies = await caller.bonus.list({});

      expect(calculations).toBeDefined();
      expect(policies).toBeDefined();

      // Se houver cálculos, deve haver políticas
      if (calculations.length > 0) {
        expect(policies.length).toBeGreaterThan(0);
      }
    });

    it("deve validar que bônus pagos têm data de pagamento", async () => {
      const paidCalculations = await caller.bonus.listCalculations({ status: "pago" });

      paidCalculations.forEach((calc: any) => {
        if (calc.status === "pago") {
          // Bônus pagos devem ter paidAt definido
          expect(calc.paidAt).toBeDefined();
        }
      });
    });

    it("deve validar que multiplicadores estão dentro de limites razoáveis", async () => {
      const calculations = await caller.bonus.listCalculations({});

      calculations.forEach((calc: any) => {
        if (calc.appliedMultiplier) {
          // Multiplicadores devem estar entre 0 e 10 (valores razoáveis)
          expect(calc.appliedMultiplier).toBeGreaterThanOrEqual(0);
          expect(calc.appliedMultiplier).toBeLessThanOrEqual(10);
        }
      });
    });
  });

  describe("Performance e Otimização", () => {
    it("deve executar getMonthlyTrends em tempo razoável", async () => {
      const startTime = Date.now();
      await caller.bonus.getMonthlyTrends({ months: 12 });
      const endTime = Date.now();

      const executionTime = endTime - startTime;
      // Deve executar em menos de 5 segundos
      expect(executionTime).toBeLessThan(5000);
    });

    it("deve executar getDepartmentDistribution em tempo razoável", async () => {
      const startTime = Date.now();
      await caller.bonus.getDepartmentDistribution();
      const endTime = Date.now();

      const executionTime = endTime - startTime;
      // Deve executar em menos de 5 segundos
      expect(executionTime).toBeLessThan(5000);
    });
  });
});
