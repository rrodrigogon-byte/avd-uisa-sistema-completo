import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../server/routers";
import type { inferProcedureInput } from "@trpc/server";
import type { AppRouter } from "../server/routers";
import { getDb } from "../server/db";
import { evaluationCycles } from "../drizzle/schema";

describe("PDI HTML Import Router", () => {
  let cycleId: number;

  beforeAll(async () => {
    // Criar ciclo de teste para importação
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const [cycle] = await db
      .insert(evaluationCycles)
      .values({
        name: "Ciclo Teste PDI Import",
        year: 2025,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
        status: "ativo",
      })
      .$returningId();

    cycleId = cycle.id;
  });

  it("deve listar PDIs disponíveis para importação", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: 1,
        openId: "test-open-id",
        name: "Test User",
        email: "test@example.com",
        role: "admin",
      },
    } as any);

    const result = await caller.pdiHtmlImport.listAvailableImports();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    
    // Verificar estrutura dos dados
    const firstItem = result[0];
    expect(firstItem).toHaveProperty("nome");
    expect(firstItem).toHaveProperty("cargo");
    expect(firstItem).toHaveProperty("htmlFilename");
    expect(firstItem).toHaveProperty("gaps_count");
    expect(firstItem).toHaveProperty("acoes_count");
  });

  it("deve visualizar preview de PDI antes de importar", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: 1,
        openId: "test-open-id",
        name: "Test User",
        email: "test@example.com",
        role: "admin",
      },
    } as any);

    type PreviewInput = inferProcedureInput<AppRouter["pdiHtmlImport"]["previewImport"]>;
    const input: PreviewInput = {
      htmlFilename: "PDI_Wilson3.html",
    };

    const result = await caller.pdiHtmlImport.previewImport(input);

    expect(result).toBeDefined();
    expect(result.nome).toBe("Wilson de Oliveira Eduardo");
    expect(result.cargo).toBe("Coordenador (Contábil e Tesouraria)");
    expect(result.kpis).toBeDefined();
    expect(result.plano_acao).toBeDefined();
    expect(result.plano_acao["70_pratica"]).toBeDefined();
    expect(result.plano_acao["20_social"]).toBeDefined();
    expect(result.plano_acao["10_formal"]).toBeDefined();
  });

  it("deve importar PDI de HTML com sucesso", async () => {
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
    const input: ImportInput = {
      htmlFilename: "PDI_Wilson3.html",
      cycleId: cycleId,
    };

    const result = await caller.pdiHtmlImport.importFromHtml(input);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.planId).toBeDefined();
    expect(result.employeeId).toBeDefined();
    expect(result.employeeName).toBe("Wilson de Oliveira Eduardo");
    expect(result.message).toContain("importado com sucesso");
  });

  it("deve importar segundo PDI de HTML com sucesso", async () => {
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
    const input: ImportInput = {
      htmlFilename: "PDI_Fernando9.html",
      cycleId: cycleId,
    };

    const result = await caller.pdiHtmlImport.importFromHtml(input);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.planId).toBeDefined();
    expect(result.employeeId).toBeDefined();
    expect(result.employeeName).toBe("Fernando Pinto");
    expect(result.message).toContain("importado com sucesso");
  });
});
