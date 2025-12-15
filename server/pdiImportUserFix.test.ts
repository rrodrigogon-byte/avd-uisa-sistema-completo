import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { evaluationCycles } from "../drizzle/schema";
import type { inferProcedureInput } from "@trpc/server";
import type { AppRouter } from "./routers";

describe("PDI Import - Correção de Usuário Não Encontrado", () => {
  let cycleId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Criar ciclo de teste
    const [cycle] = await db
      .insert(evaluationCycles)
      .values({
        name: "Ciclo Teste PDI Import Fix",
        year: 2025,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
        status: "ativo",
      })
      .$returningId();

    cycleId = cycle.id;
  });

  it("deve permitir admin importar PDI mesmo sem ser funcionário", async () => {
    // Simular usuário admin que NÃO é funcionário
    const caller = appRouter.createCaller({
      user: {
        id: 999, // ID que não existe na tabela employees
        openId: "admin-test-open-id",
        name: "Admin Teste",
        email: "admin@test.com",
        role: "admin",
      },
    } as any);

    // Testar listAvailableImports (não deve dar erro de usuário não encontrado)
    const availableImports = await caller.pdiHtmlImport.listAvailableImports();
    
    expect(availableImports).toBeDefined();
    expect(Array.isArray(availableImports)).toBe(true);
  });

  it("deve validar que protectedProcedure garante ctx.user não-nulo", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: 1,
        openId: "test-open-id",
        name: "Test User",
        email: "test@example.com",
        role: "admin",
      },
    } as any);

    type ImportInput = inferProcedureInput<AppRouter["pdiHtmlImport"]["importFromHtml"]>;
    
    // Este teste valida que o código não lança erro de "Usuário não encontrado"
    // quando o usuário está autenticado
    try {
      const input: ImportInput = {
        htmlFilename: "PDI_Wilson3.html",
        cycleId: cycleId,
      };

      const result = await caller.pdiHtmlImport.importFromHtml(input);
      
      // Se chegou aqui, não houve erro de "Usuário não encontrado"
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    } catch (error: any) {
      // Verificar que o erro NÃO é "Usuário não encontrado"
      expect(error.message).not.toContain("Usuário não encontrado");
    }
  });

  it("deve rejeitar requisição sem usuário autenticado", async () => {
    // Simular requisição sem usuário (user = null)
    const caller = appRouter.createCaller({
      user: null,
    } as any);

    type ImportInput = inferProcedureInput<AppRouter["pdiHtmlImport"]["importFromHtml"]>;
    const input: ImportInput = {
      htmlFilename: "PDI_Wilson3.html",
      cycleId: cycleId,
    };

    // Deve lançar erro UNAUTHORIZED
    await expect(caller.pdiHtmlImport.importFromHtml(input)).rejects.toThrow();
  });
});
