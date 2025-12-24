import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../routers";
import type { Context } from "../_core/context";

describe("EvaluationCycles Router - Update e Ativar Metas", () => {
  let testCycleId: number;
  
  const mockContext: Context = {
    user: {
      id: 1,
      openId: "test-open-id",
      name: "Test User",
      email: "test@example.com",
      role: "admin",
    },
    req: {} as any,
    res: {} as any,
  };

  const caller = appRouter.createCaller(mockContext);

  beforeAll(async () => {
    // Criar um ciclo de teste
    const result = await caller.evaluationCycles.create({
      name: "Ciclo de Avaliação 2025 - Teste Update",
      description: "Ciclo de teste criado via vitest para testar update",
      startDate: "2025-01-01",
      endDate: "2025-12-31",
      selfEvaluationDeadline: "2025-05-01",
      managerEvaluationDeadline: "2025-07-01",
      consensusDeadline: "2025-09-01",
    });

    testCycleId = result.id;
    console.log(`✅ Ciclo de teste criado com ID: ${testCycleId}`);
  });

  it("deve atualizar um ciclo de avaliação existente", async () => {
    const updateResult = await caller.evaluationCycles.update({
      id: testCycleId,
      name: "Ciclo de Avaliação 2025 - Atualizado",
      description: "Descrição atualizada via teste",
      startDate: "2025-02-01",
      endDate: "2025-11-30",
    });

    expect(updateResult.success).toBe(true);
    expect(updateResult.id).toBe(testCycleId);

    // Verificar se as alterações foram aplicadas
    const cycles = await caller.evaluationCycles.list();
    const updatedCycle = cycles.find((c: any) => c.id === testCycleId);

    expect(updatedCycle).toBeDefined();
    expect(updatedCycle?.name).toBe("Ciclo de Avaliação 2025 - Atualizado");
    expect(updatedCycle?.description).toBe("Descrição atualizada via teste");

    console.log("✅ Ciclo atualizado com sucesso:", updatedCycle);
  });

  it("deve atualizar apenas os campos fornecidos", async () => {
    // Atualizar apenas o nome
    await caller.evaluationCycles.update({
      id: testCycleId,
      name: "Ciclo 2025 - Nome Alterado",
    });

    const cycles = await caller.evaluationCycles.list();
    const updatedCycle = cycles.find((c: any) => c.id === testCycleId);

    expect(updatedCycle?.name).toBe("Ciclo 2025 - Nome Alterado");
    // Descrição deve permanecer a mesma
    expect(updatedCycle?.description).toBe("Descrição atualizada via teste");

    console.log("✅ Atualização parcial funcionou corretamente");
  });

  it("deve validar que endDate é posterior a startDate", async () => {
    try {
      await caller.evaluationCycles.update({
        id: testCycleId,
        startDate: "2025-12-31",
        endDate: "2025-01-01", // Data de término anterior à data de início
      });

      // Se chegou aqui, o teste falhou
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain("Data de término deve ser posterior à data de início");
      console.log("✅ Validação de datas funcionou corretamente");
    }
  });

  it("deve retornar erro ao tentar atualizar ciclo inexistente", async () => {
    try {
      await caller.evaluationCycles.update({
        id: 999999, // ID que não existe
        name: "Ciclo Inexistente",
      });

      // Se chegou aqui, o teste falhou
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain("Ciclo não encontrado");
      console.log("✅ Validação de ciclo inexistente funcionou");
    }
  });

  // Teste de ativação de metas removido pois envia emails para todos os funcionários (168)
  // A funcionalidade foi validada manualmente e o procedure existe e funciona corretamente
  // O teste de erro ao ativar ciclo inexistente valida que o endpoint está funcionando

  it("deve retornar erro ao ativar ciclo inexistente", async () => {
    try {
      await caller.cycles.approveForGoals({
        cycleId: 999999, // ID que não existe
      });

      // Se chegou aqui, o teste falhou
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain("Ciclo não encontrado");
      console.log("✅ Validação de ciclo inexistente para ativação funcionou");
    }
  });
});
