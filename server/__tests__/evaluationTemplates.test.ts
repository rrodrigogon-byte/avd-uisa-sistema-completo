import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../routers";
import { getDb } from "../db";
import { evaluationTemplates, templateQuestions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Testes para os endpoints de exportação e importação de templates
 */
describe("Evaluation Templates - Export/Import", () => {
  let db: Awaited<ReturnType<typeof getDb>>;
  let testTemplateId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    // Criar template de teste
    const result = await db.insert(evaluationTemplates).values({
      name: "Template de Teste Export/Import",
      description: "Template criado para testar exportação e importação",
      templateType: "custom",
      targetRoles: JSON.stringify([1, 2, 3]),
      targetDepartments: JSON.stringify([10, 20]),
      isActive: true,
      isDefault: false,
      createdBy: 1,
    });

    testTemplateId = result[0].insertId;

    // Criar perguntas de teste
    await db.insert(templateQuestions).values([
      {
        templateId: testTemplateId,
        category: "competencias",
        questionText: "Como você avalia a comunicação?",
        questionType: "scale_1_5",
        weight: 1,
        displayOrder: 1,
        isRequired: true,
      },
      {
        templateId: testTemplateId,
        category: "comportamento",
        questionText: "Como você avalia o trabalho em equipe?",
        questionType: "scale_1_5",
        weight: 1,
        displayOrder: 2,
        isRequired: true,
      },
    ]);
  });

  it("deve exportar template como JSON", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, name: "Test User", email: "test@test.com", role: "admin" },
      req: {} as any,
      res: {} as any,
    });

    const exported = await caller.evaluationTemplates.exportTemplate({
      id: testTemplateId,
    });

    expect(exported).toHaveProperty("version");
    expect(exported).toHaveProperty("exportedAt");
    expect(exported).toHaveProperty("template");
    expect(exported.template).toHaveProperty("name");
    expect(exported.template).toHaveProperty("questions");
    expect(Array.isArray(exported.template.questions)).toBe(true);
    expect(exported.template.questions.length).toBe(2);
    expect(exported.template.name).toBe("Template de Teste Export/Import");
  });

  it("deve importar template de JSON", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, name: "Test User", email: "test@test.com", role: "admin" },
      req: {} as any,
      res: {} as any,
    });

    // Primeiro exportar
    const exported = await caller.evaluationTemplates.exportTemplate({
      id: testTemplateId,
    });

    // Modificar nome para importar como novo
    const importData = {
      ...exported,
      template: {
        ...exported.template,
        name: "Template Importado - Teste",
      },
    };

    // Importar
    const result = await caller.evaluationTemplates.importTemplate({
      json: JSON.stringify(importData),
    });

    expect(result).toHaveProperty("templateId");
    expect(result.templateId).toBeGreaterThan(0);

    // Verificar se foi criado no banco
    if (!db) throw new Error("Database not available");
    const [imported] = await db
      .select()
      .from(evaluationTemplates)
      .where(eq(evaluationTemplates.id, result.templateId))
      .limit(1);

    expect(imported).toBeDefined();
    expect(imported.name).toBe("Template Importado - Teste");
    expect(imported.isActive).toBe(false); // Importado como inativo por segurança

    // Verificar se as perguntas foram importadas
    const questions = await db
      .select()
      .from(templateQuestions)
      .where(eq(templateQuestions.templateId, result.templateId));

    expect(questions.length).toBe(2);
  });

  it("deve rejeitar JSON inválido na importação", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, name: "Test User", email: "test@test.com", role: "admin" },
      req: {} as any,
      res: {} as any,
    });

    await expect(
      caller.evaluationTemplates.importTemplate({
        json: "{ invalid json",
      })
    ).rejects.toThrow("JSON inválido");
  });

  it("deve rejeitar JSON com estrutura inválida", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, name: "Test User", email: "test@test.com", role: "admin" },
      req: {} as any,
      res: {} as any,
    });

    await expect(
      caller.evaluationTemplates.importTemplate({
        json: JSON.stringify({ invalid: "structure" }),
      })
    ).rejects.toThrow("Estrutura de JSON inválida");
  });
});
