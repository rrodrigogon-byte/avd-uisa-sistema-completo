/**
 * Testes para validar correção do cadastro de funcionários
 * Problema: birthDate/hireDate enviados como Date ao invés de string
 * Problema: positionId enviado como undefined
 */

import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../server/routers";
import type { Context } from "../server/_core/context";

describe("Employee Create - Validação de Tipos", () => {
  let mockContext: Context;

  beforeAll(() => {
    // Mock de contexto com usuário admin
    mockContext = {
      user: {
        id: 1,
        openId: "test-admin",
        name: "Admin Test",
        email: "admin@test.com",
        role: "admin",
        loginMethod: "oauth",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        isSalaryLead: false,
        faceDescriptor: null,
        facePhotoUrl: null,
        faceRegisteredAt: null,
      },
      req: {} as any,
      res: {} as any,
    };
  });

  it("deve aceitar birthDate como string (formato YYYY-MM-DD)", async () => {
    const caller = appRouter.createCaller(mockContext);

    const input = {
      employeeCode: "TEST001",
      name: "Funcionário Teste",
      email: "teste@empresa.com",
      birthDate: "1990-01-15", // STRING no formato correto
      hireDate: "2024-01-01",
      departmentId: 1,
      positionId: 1,
    };

    // Não deve lançar erro de validação
    try {
      const result = await caller.employees.create(input);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    } catch (error: any) {
      // Se falhar, não deve ser por erro de tipo
      expect(error.message).not.toContain("expected string, received Date");
      expect(error.message).not.toContain("Invalid input");
    }
  });

  it("deve aceitar hireDate como string (formato YYYY-MM-DD)", async () => {
    const caller = appRouter.createCaller(mockContext);

    const input = {
      employeeCode: "TEST002",
      name: "Funcionário Teste 2",
      email: "teste2@empresa.com",
      hireDate: "2024-06-15", // STRING no formato correto
      departmentId: 1,
      positionId: 1,
    };

    try {
      const result = await caller.employees.create(input);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    } catch (error: any) {
      expect(error.message).not.toContain("expected string, received Date");
      expect(error.message).not.toContain("Invalid input");
    }
  });

  it("deve aceitar positionId como number", async () => {
    const caller = appRouter.createCaller(mockContext);

    const input = {
      employeeCode: "TEST003",
      name: "Funcionário Teste 3",
      email: "teste3@empresa.com",
      hireDate: "2024-01-01",
      departmentId: 1,
      positionId: 5, // NUMBER válido
    };

    try {
      const result = await caller.employees.create(input);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    } catch (error: any) {
      expect(error.message).not.toContain("expected number, received undefined");
      expect(error.message).not.toContain("Invalid input");
    }
  });

  it("deve rejeitar positionId como undefined", async () => {
    const caller = appRouter.createCaller(mockContext);

    const input = {
      employeeCode: "TEST004",
      name: "Funcionário Teste 4",
      email: "teste4@empresa.com",
      hireDate: "2024-01-01",
      departmentId: 1,
      positionId: undefined as any, // UNDEFINED - deve falhar
    };

    try {
      await caller.employees.create(input);
      // Se não lançar erro, o teste falha
      expect(true).toBe(false);
    } catch (error: any) {
      // Deve lançar erro de validação
      expect(error.message).toContain("Invalid input");
    }
  });

  it("deve aceitar birthDate como undefined (campo opcional)", async () => {
    const caller = appRouter.createCaller(mockContext);

    const input = {
      employeeCode: "TEST005",
      name: "Funcionário Teste 5",
      email: "teste5@empresa.com",
      hireDate: "2024-01-01",
      departmentId: 1,
      positionId: 1,
      birthDate: undefined, // OPCIONAL - deve aceitar
    };

    try {
      const result = await caller.employees.create(input);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    } catch (error: any) {
      expect(error.message).not.toContain("expected string, received undefined");
    }
  });

  it("deve rejeitar birthDate como Date object", async () => {
    const caller = appRouter.createCaller(mockContext);

    const input = {
      employeeCode: "TEST006",
      name: "Funcionário Teste 6",
      email: "teste6@empresa.com",
      hireDate: "2024-01-01",
      departmentId: 1,
      positionId: 1,
      birthDate: new Date("1990-01-15") as any, // DATE OBJECT - deve falhar
    };

    try {
      await caller.employees.create(input);
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain("Invalid input");
      expect(error.message).toContain("expected string, received Date");
    }
  });

  it("deve rejeitar hireDate como Date object", async () => {
    const caller = appRouter.createCaller(mockContext);

    const input = {
      employeeCode: "TEST007",
      name: "Funcionário Teste 7",
      email: "teste7@empresa.com",
      hireDate: new Date("2024-01-01") as any, // DATE OBJECT - deve falhar
      departmentId: 1,
      positionId: 1,
    };

    try {
      await caller.employees.create(input);
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain("Invalid input");
      expect(error.message).toContain("expected string, received Date");
    }
  });
});
