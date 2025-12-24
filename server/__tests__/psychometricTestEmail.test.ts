import { describe, it, expect } from "vitest";
import { appRouter } from "../routers";
import { createContext } from "../_core/context";
import { Request, Response } from "express";

describe("Envio de Emails de Testes Psicométricos", () => {
  it("deve enviar email de convite para teste psicométrico", async () => {
    // Mock de request e response
    const mockReq = {
      headers: { origin: "http://localhost:3000" },
      cookies: {},
      protocol: "http",
      get: (header: string) => header === "host" ? "localhost:3000" : undefined,
    } as unknown as Request;

    const mockRes = {
      setHeader: () => {},
      cookie: () => {},
      clearCookie: () => {},
    } as unknown as Response;

    const ctx = await createContext({ req: mockReq, res: mockRes });

    // Simular usuário admin
    ctx.user = {
      id: 1,
      openId: "test-admin",
      name: "Admin Test",
      email: "admin@uisa.com.br",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      loginMethod: "email",
    };

    const caller = appRouter.createCaller(ctx);

    // Testar envio de convite para teste DISC
    const result = await caller.psychometric.sendTestInvite({
      emails: ["rodrigo.goncalves@uisa.com.br"],
      testType: "disc",
    });

    console.log("Resultado do envio:", result);

    expect(result).toBeDefined();
    expect(result.results).toBeDefined();
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results[0].success).toBe(true);
    expect(result.results[0].message).toContain("enviado");
  });

  it("deve validar configuração SMTP antes de enviar", async () => {
    const mockReq = {
      headers: { origin: "http://localhost:3000" },
      cookies: {},
      protocol: "http",
      get: (header: string) => header === "host" ? "localhost:3000" : undefined,
    } as unknown as Request;

    const mockRes = {
      setHeader: () => {},
      cookie: () => {},
      clearCookie: () => {},
    } as unknown as Response;

    const ctx = await createContext({ req: mockReq, res: mockRes });

    ctx.user = {
      id: 1,
      openId: "test-admin",
      name: "Admin Test",
      email: "admin@uisa.com.br",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      loginMethod: "email",
    };

    const caller = appRouter.createCaller(ctx);

    // Verificar se o endpoint existe e não lança erro de configuração
    try {
      await caller.psychometric.sendTestInvite({
        emails: ["test@example.com"],
        testType: "bigfive",
      });
    } catch (error: any) {
      // Se falhar, não deve ser por falta de configuração SMTP
      expect(error.message).not.toContain("SMTP não configurado");
      expect(error.message).not.toContain("Database not available");
    }
  });
});
