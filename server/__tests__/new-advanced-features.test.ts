import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../routers";

// Mock context com usuário autenticado
const mockContext = {
  user: {
    id: 1,
    openId: "test-user",
    name: "Test User",
    email: "test@example.com",
    role: "admin" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    loginMethod: "email",
  },
  req: {} as any,
  res: {} as any,
};

const caller = appRouter.createCaller(mockContext);

describe("Advanced Features - Templates Management", () => {
  it("deve listar templates 360°", async () => {
    const templates = await caller.cycles360Templates.list();
    expect(Array.isArray(templates)).toBe(true);
  });

  it("deve criar um template 360°", async () => {
    const result = await caller.cycles360Templates.create({
      name: "Template de Teste",
      description: "Template criado para testes automatizados",
      selfWeight: 20,
      peerWeight: 30,
      subordinateWeight: 20,
      managerWeight: 30,
      competencyIds: [1, 2, 3],
      isPublic: false,
    });

    expect(result.success).toBe(true);
    expect(result.templateId).toBeGreaterThan(0);
  });

  it("deve validar soma de pesos igual a 100%", async () => {
    await expect(
      caller.cycles360Templates.create({
        name: "Template Inválido",
        description: "Pesos não somam 100%",
        selfWeight: 25,
        peerWeight: 25,
        subordinateWeight: 25,
        managerWeight: 20, // Soma = 95%
        competencyIds: [1, 2],
        isPublic: false,
      })
    ).rejects.toThrow("A soma dos pesos deve ser 100%");
  });

  it("deve atualizar visibilidade de template", async () => {
    // Criar template
    const created = await caller.cycles360Templates.create({
      name: "Template para Atualizar",
      description: "Teste de atualização",
      selfWeight: 25,
      peerWeight: 25,
      subordinateWeight: 25,
      managerWeight: 25,
      competencyIds: [1],
      isPublic: false,
    });

    // Atualizar para público
    const result = await caller.cycles360Templates.update({
      id: created.templateId,
      isPublic: true,
    });

    expect(result.success).toBe(true);
  });

  it("deve deletar template", async () => {
    // Criar template
    const created = await caller.cycles360Templates.create({
      name: "Template para Deletar",
      description: "Será deletado",
      selfWeight: 25,
      peerWeight: 25,
      subordinateWeight: 25,
      managerWeight: 25,
      competencyIds: [1],
      isPublic: false,
    });

    // Deletar
    const result = await caller.cycles360Templates.delete({
      id: created.templateId,
    });

    expect(result.success).toBe(true);
  });
});

describe("Advanced Features - Cycle Duplication", () => {
  let sourceCycleId: number;

  beforeAll(async () => {
    // Criar ciclo fonte para duplicação
    const cycle = await caller.cycles.create({
      name: "Ciclo Fonte 2024",
      year: 2024,
      type: "anual",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      description: "Ciclo original para testes de duplicação",
    });

    sourceCycleId = cycle.id;
  });

  it("deve duplicar ciclo existente", async () => {
    const result = await caller.cycles.duplicateCycle({
      sourceCycleId,
      name: "Ciclo Duplicado 2025",
      year: 2025,
      type: "anual",
      startDate: "2025-01-01",
      endDate: "2025-12-31",
      description: "Ciclo duplicado para testes",
    });

    expect(result.success).toBe(true);
    expect(result.newCycleId).toBeGreaterThan(0);
    expect(result.newCycleId).not.toBe(sourceCycleId);
  });

  it("deve falhar ao duplicar ciclo inexistente", async () => {
    await expect(
      caller.cycles.duplicateCycle({
        sourceCycleId: 999999,
        name: "Ciclo Inválido",
        year: 2025,
        type: "anual",
        startDate: "2025-01-01",
        endDate: "2025-12-31",
      })
    ).rejects.toThrow("Ciclo original não encontrado");
  });

  it("deve copiar descrição do ciclo original se não fornecida", async () => {
    const result = await caller.cycles.duplicateCycle({
      sourceCycleId,
      name: "Ciclo com Descrição Copiada",
      year: 2025,
      type: "semestral",
      startDate: "2025-01-01",
      endDate: "2025-06-30",
      // description não fornecida - deve copiar do original
    });

    expect(result.success).toBe(true);

    // Buscar ciclo criado para verificar descrição
    const newCycle = await caller.cycles.getById({ id: result.newCycleId });
    expect(newCycle?.description).toBeTruthy();
  });
});

describe("Integration - Complete Workflow", () => {
  it("deve executar fluxo completo: criar template -> duplicar ciclo -> aplicar template", async () => {
    // 1. Criar template
    const template = await caller.cycles360Templates.create({
      name: "Template Workflow Completo",
      description: "Template para teste de integração",
      selfWeight: 20,
      peerWeight: 30,
      subordinateWeight: 20,
      managerWeight: 30,
      competencyIds: [1, 2, 3],
      isPublic: true,
    });

    expect(template.success).toBe(true);

    // 2. Criar ciclo fonte
    const sourceCycle = await caller.cycles.create({
      name: "Ciclo Fonte Workflow",
      year: 2024,
      type: "anual",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      description: "Ciclo para workflow de integração",
    });

    expect(sourceCycle.id).toBeGreaterThan(0);

    // 3. Duplicar ciclo
    const duplicated = await caller.cycles.duplicateCycle({
      sourceCycleId: sourceCycle.id,
      name: "Ciclo Duplicado Workflow",
      year: 2025,
      type: "anual",
      startDate: "2025-01-01",
      endDate: "2025-12-31",
    });

    expect(duplicated.success).toBe(true);
    expect(duplicated.newCycleId).not.toBe(sourceCycle.id);

    // 4. Verificar que o novo ciclo existe
    const newCycle = await caller.cycles.getById({ id: duplicated.newCycleId });
    expect(newCycle).toBeTruthy();
    expect(newCycle?.name).toBe("Ciclo Duplicado Workflow");
    expect(newCycle?.status).toBe("planejado");
  });
});
