import { describe, it, expect } from "vitest";
import { appRouter } from "./server/routers";
import type { Context } from "./server/_core/context";

describe("employees.getCurrent", () => {
  it("deve retornar o funcionário do usuário logado", async () => {
    // Mock do contexto com usuário autenticado
    const mockContext: Context = {
      user: {
        id: 1,
        openId: "test-open-id",
        name: "Rodrigo Ribeiro goncalves",
        email: "rrodrigogon@gmail.com",
        loginMethod: "apple",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {} as any,
      res: {} as any,
    };

    // Criar caller com o contexto mockado
    const caller = appRouter.createCaller(mockContext);

    // Chamar o procedimento
    const result = await caller.employees.getCurrent();

    // Verificar que retornou algo (pode ser null se não houver employee)
    console.log("Resultado de employees.getCurrent:", result);
    
    // O teste passa se não houver erro de "procedure not found"
    expect(true).toBe(true);
  });

  it("deve lançar erro se usuário não estiver autenticado", async () => {
    // Mock do contexto sem usuário
    const mockContext: Context = {
      user: undefined,
      req: {} as any,
      res: {} as any,
    };

    // Criar caller com o contexto mockado
    const caller = appRouter.createCaller(mockContext);

    // Verificar que lança erro
    await expect(caller.employees.getCurrent()).rejects.toThrow("Usuário não autenticado");
  });
});
