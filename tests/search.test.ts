import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../server/routers";
import { createCallerFactory } from "../server/_core/trpc";

const createCaller = createCallerFactory(appRouter);

describe("Search Router", () => {
  let caller: ReturnType<typeof createCaller>;

  beforeAll(() => {
    // Mock de usuário para testes
    caller = createCaller({
      user: {
        id: 1,
        openId: "test-user",
        name: "Test User",
        email: "test@test.com",
        role: "colaborador",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        loginMethod: null,
        isSalaryLead: false,
        faceDescriptor: null,
        facePhotoUrl: null,
        faceRegisteredAt: null,
      },
      req: {} as any,
      res: {} as any,
    });
  });

  it("deve realizar busca global", async () => {
    const result = await caller.search.global({
      query: "test",
      limit: 10,
    });

    expect(Array.isArray(result)).toBe(true);
    result.forEach((item) => {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("type");
      expect(item).toHaveProperty("title");
      expect(item).toHaveProperty("url");
    });
  });

  it("deve buscar apenas funcionários", async () => {
    const result = await caller.search.global({
      query: "test",
      limit: 10,
      types: ["employee"],
    });

    expect(Array.isArray(result)).toBe(true);
    result.forEach((item) => {
      expect(item.type).toBe("employee");
    });
  });

  it("deve buscar apenas metas", async () => {
    const result = await caller.search.global({
      query: "test",
      limit: 10,
      types: ["goal"],
    });

    expect(Array.isArray(result)).toBe(true);
    result.forEach((item) => {
      expect(item.type).toBe("goal");
    });
  });

  it("deve realizar busca rápida", async () => {
    const result = await caller.search.quick({
      query: "test",
      limit: 5,
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeLessThanOrEqual(5);
    result.forEach((item) => {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("type");
      expect(item).toHaveProperty("title");
      expect(item).toHaveProperty("url");
    });
  });

  it("deve retornar sugestões de busca", async () => {
    const result = await caller.search.suggestions({
      query: "test",
      limit: 5,
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeLessThanOrEqual(5);
    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe("string");
    });
  });

  it("deve respeitar o limite de resultados", async () => {
    const limit = 3;
    const result = await caller.search.global({
      query: "test",
      limit,
    });

    expect(result.length).toBeLessThanOrEqual(limit);
  });

  it("deve retornar array vazio para query muito curta", async () => {
    try {
      await caller.search.global({
        query: "a", // Menos de 2 caracteres
        limit: 10,
      });
      expect.fail("Deveria ter lançado erro");
    } catch (error: any) {
      expect(error.message).toContain("String must contain at least 2 character(s)");
    }
  });

  it("deve buscar múltiplos tipos simultaneamente", async () => {
    const result = await caller.search.global({
      query: "test",
      limit: 20,
      types: ["employee", "goal", "pdi"],
    });

    expect(Array.isArray(result)).toBe(true);
    const types = new Set(result.map((item) => item.type));
    expect(types.size).toBeGreaterThan(0);
  });
});
