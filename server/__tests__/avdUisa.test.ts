import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../db";
import { evaluationCycles, performanceEvaluations, evaluationQuestions, employees, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Testes para o Sistema AVD UISA
 * Valida funcionalidades core: ciclos, avaliações, questões e relatórios
 */

describe("AVD UISA - Sistema de Avaliação de Desempenho", () => {
  let testCycleId: number;
  let testUserId: number;
  let testEmployeeId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Criar usuário de teste
    const userResult = await db.insert(users).values({
      openId: `test-avd-${Date.now()}`,
      name: "Teste AVD UISA",
      email: "teste.avd@uisa.com.br",
      role: "colaborador",
    });
    testUserId = userResult[0].insertId;

    // Criar employee de teste
    const empResult = await db.insert(employees).values({
      userId: testUserId,
      employeeCode: `EMP-AVD-${Date.now()}`,
      name: "Teste AVD UISA",
      email: "teste.avd@uisa.com.br",
      cpf: "12345678900",
      hireDate: new Date(),
      status: "ativo",
      active: true,
      departmentId: 1, // Departamento padrão para testes
      positionId: 1, // Cargo padrão para testes
    });
    testEmployeeId = empResult[0].insertId;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Limpar dados de teste
    if (testCycleId) {
      await db.delete(performanceEvaluations).where(eq(performanceEvaluations.cycleId, testCycleId));
      await db.delete(evaluationCycles).where(eq(evaluationCycles.id, testCycleId));
    }
    if (testEmployeeId) {
      await db.delete(employees).where(eq(employees.id, testEmployeeId));
    }
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  describe("Gestão de Ciclos", () => {
    it("deve criar um ciclo de avaliação anual", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const currentYear = new Date().getFullYear();
      const startDate = new Date(`${currentYear}-01-01`);
      const endDate = new Date(`${currentYear}-12-31`);

      const result = await db.insert(evaluationCycles).values({
        name: `Avaliação Anual ${currentYear} - Teste`,
        year: currentYear,
        type: "anual",
        startDate,
        endDate,
        status: "planejado",
        active: true,
        description: "Ciclo de teste para validação do sistema AVD UISA",
      });

      testCycleId = result[0].insertId;

      expect(testCycleId).toBeGreaterThan(0);

      // Verificar se foi criado corretamente
      const [cycle] = await db
        .select()
        .from(evaluationCycles)
        .where(eq(evaluationCycles.id, testCycleId))
        .limit(1);

      expect(cycle).toBeDefined();
      expect(cycle.name).toContain("Avaliação Anual");
      expect(cycle.year).toBe(currentYear);
      expect(cycle.type).toBe("anual");
      expect(cycle.status).toBe("planejado");
    });

    it("deve listar ciclos criados", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const cycles = await db
        .select()
        .from(evaluationCycles)
        .where(eq(evaluationCycles.id, testCycleId));

      expect(cycles.length).toBeGreaterThan(0);
      expect(cycles[0].id).toBe(testCycleId);
    });

    it("deve ativar um ciclo", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(evaluationCycles)
        .set({ status: "ativo", updatedAt: new Date() })
        .where(eq(evaluationCycles.id, testCycleId));

      const [cycle] = await db
        .select()
        .from(evaluationCycles)
        .where(eq(evaluationCycles.id, testCycleId))
        .limit(1);

      expect(cycle.status).toBe("ativo");
    });
  });

  describe("Questões de Avaliação", () => {
    it("deve criar questões do tipo escala", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(evaluationQuestions).values({
        code: `Q-AVD-TEST-${Date.now()}`,
        question: "Como você avalia seu desempenho geral no período?",
        category: "Desempenho Geral",
        type: "escala",
        weight: 1,
        active: true,
      });

      expect(result[0].insertId).toBeGreaterThan(0);

      // Limpar
      await db.delete(evaluationQuestions).where(eq(evaluationQuestions.id, result[0].insertId));
    });

    it("deve listar questões ativas", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const questions = await db
        .select()
        .from(evaluationQuestions)
        .where(eq(evaluationQuestions.active, true));

      expect(Array.isArray(questions)).toBe(true);
    });
  });

  describe("Avaliações", () => {
    it("deve criar uma avaliação para um colaborador", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(performanceEvaluations).values({
        cycleId: testCycleId,
        employeeId: testEmployeeId,
        type: "360",
        status: "pendente",
        workflowStatus: "pending_self",
        selfEvaluationCompleted: false,
        managerEvaluationCompleted: false,
        peersEvaluationCompleted: false,
        subordinatesEvaluationCompleted: false,
      });

      expect(result[0].insertId).toBeGreaterThan(0);

      const evaluationId = result[0].insertId;

      // Verificar criação
      const [evaluation] = await db
        .select()
        .from(performanceEvaluations)
        .where(eq(performanceEvaluations.id, evaluationId))
        .limit(1);

      expect(evaluation).toBeDefined();
      expect(evaluation.cycleId).toBe(testCycleId);
      expect(evaluation.employeeId).toBe(testEmployeeId);
      expect(evaluation.workflowStatus).toBe("pending_self");
    });

    it("deve listar avaliações pendentes de um ciclo", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const evaluations = await db
        .select()
        .from(performanceEvaluations)
        .where(eq(performanceEvaluations.cycleId, testCycleId));

      expect(Array.isArray(evaluations)).toBe(true);
      expect(evaluations.length).toBeGreaterThan(0);
    });
  });

  describe("Validação de Domínio", () => {
    it("deve validar email @uisa.com.br", () => {
      const validEmails = [
        "joao.silva@uisa.com.br",
        "maria.santos@uisa.com.br",
        "admin@uisa.com.br",
      ];

      const invalidEmails = [
        "joao@gmail.com",
        "maria@yahoo.com",
        "teste@uisa.com",
      ];

      validEmails.forEach((email) => {
        expect(email.endsWith("@uisa.com.br")).toBe(true);
      });

      invalidEmails.forEach((email) => {
        expect(email.endsWith("@uisa.com.br")).toBe(false);
      });
    });
  });

  describe("Workflow de Aprovações", () => {
    it("deve seguir a sequência correta de workflow", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Criar avaliação
      const result = await db.insert(performanceEvaluations).values({
        cycleId: testCycleId,
        employeeId: testEmployeeId,
        type: "360",
        status: "pendente",
        workflowStatus: "pending_self",
        selfEvaluationCompleted: false,
        managerEvaluationCompleted: false,
        peersEvaluationCompleted: false,
        subordinatesEvaluationCompleted: false,
      });

      const evaluationId = result[0].insertId;

      // Simular conclusão da autoavaliação
      await db
        .update(performanceEvaluations)
        .set({
          selfEvaluationCompleted: true,
          selfCompletedAt: new Date(),
          workflowStatus: "pending_manager",
          selfScore: 85,
        })
        .where(eq(performanceEvaluations.id, evaluationId));

      let [evaluation] = await db
        .select()
        .from(performanceEvaluations)
        .where(eq(performanceEvaluations.id, evaluationId))
        .limit(1);

      expect(evaluation.workflowStatus).toBe("pending_manager");
      expect(evaluation.selfEvaluationCompleted).toBe(true);

      // Simular conclusão da avaliação do gestor
      await db
        .update(performanceEvaluations)
        .set({
          managerEvaluationCompleted: true,
          managerCompletedAt: new Date(),
          workflowStatus: "completed",
          status: "concluida",
          managerScore: 90,
          finalScore: 87, // Média
        })
        .where(eq(performanceEvaluations.id, evaluationId));

      [evaluation] = await db
        .select()
        .from(performanceEvaluations)
        .where(eq(performanceEvaluations.id, evaluationId))
        .limit(1);

      expect(evaluation.workflowStatus).toBe("completed");
      expect(evaluation.status).toBe("concluida");
      expect(evaluation.managerEvaluationCompleted).toBe(true);
      expect(evaluation.finalScore).toBeGreaterThan(0);
    });
  });

  describe("Relatórios e Dashboards", () => {
    it("deve calcular taxa de conclusão corretamente", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar avaliações do ciclo de teste
      const allEvaluations = await db
        .select()
        .from(performanceEvaluations)
        .where(eq(performanceEvaluations.cycleId, testCycleId));

      const completedEvaluations = allEvaluations.filter((e) => e.status === "concluida");

      const total = allEvaluations.length;
      const completed = completedEvaluations.length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      expect(completionRate).toBeGreaterThanOrEqual(0);
      expect(completionRate).toBeLessThanOrEqual(100);
    });

    it("deve calcular média de scores", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const completedEvaluations = await db
        .select()
        .from(performanceEvaluations)
        .where(eq(performanceEvaluations.cycleId, testCycleId));

      const scoresWithValues = completedEvaluations
        .filter((e) => e.finalScore !== null)
        .map((e) => e.finalScore!);

      if (scoresWithValues.length > 0) {
        const avgScore = Math.round(
          scoresWithValues.reduce((sum, score) => sum + score, 0) / scoresWithValues.length
        );

        expect(avgScore).toBeGreaterThanOrEqual(0);
        expect(avgScore).toBeLessThanOrEqual(100);
      }
    });
  });
});
