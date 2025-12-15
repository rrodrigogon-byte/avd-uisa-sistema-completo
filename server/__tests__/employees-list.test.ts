import { describe, it, expect } from "vitest";
import { appRouter } from "../routers";
import type { Context } from "../_core/context";

const mockContext: Context = {
  req: {} as any,
  res: {} as any,
  user: {
    id: 1,
    openId: "test-open-id",
    name: "Test User",
    email: "test@example.com",
    role: "admin",
  },
};

const caller = appRouter.createCaller(mockContext);

describe("Endpoint employees.list", () => {
  it("deve retornar lista de funcionários", async () => {
    const result = await caller.employees.list();
    
    console.log("📋 Resultado employees.list:", {
      total: result?.length || 0,
      primeiros3: result?.slice(0, 3).map(e => ({ id: e.id, name: e.name }))
    });
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    
    if (result.length > 0) {
      const primeiro = result[0];
      expect(primeiro).toHaveProperty("id");
      expect(primeiro).toHaveProperty("name");
      console.log("✅ Estrutura do primeiro funcionário:", Object.keys(primeiro));
    } else {
      console.log("⚠️  Lista vazia - verificar se há dados no banco");
    }
  });
});
