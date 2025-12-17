import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../server/routers";
import type { Context } from "../server/_core/context";

/**
 * Testes para o router de usuários
 * Valida funcionalidades de listagem, busca e gestão de usuários
 */

// Mock de contexto para admin
const createAdminContext = (): Context => ({
  user: {
    id: 1,
    openId: "admin_test",
    name: "Admin Test",
    email: "admin@test.com",
    role: "admin",
    isSalaryLead: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    loginMethod: "oauth",
    faceDescriptor: null,
    facePhotoUrl: null,
    faceRegisteredAt: null,
  },
  req: {} as any,
  res: {} as any,
});

// Mock de contexto para RH
const createRHContext = (): Context => ({
  user: {
    id: 2,
    openId: "rh_test",
    name: "RH Test",
    email: "rh@test.com",
    role: "rh",
    isSalaryLead: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    loginMethod: "oauth",
    faceDescriptor: null,
    facePhotoUrl: null,
    faceRegisteredAt: null,
  },
  req: {} as any,
  res: {} as any,
});

// Mock de contexto para gestor (não deve ter acesso)
const createGestorContext = (): Context => ({
  user: {
    id: 3,
    openId: "gestor_test",
    name: "Gestor Test",
    email: "gestor@test.com",
    role: "gestor",
    isSalaryLead: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    loginMethod: "oauth",
    faceDescriptor: null,
    facePhotoUrl: null,
    faceRegisteredAt: null,
  },
  req: {} as any,
  res: {} as any,
});

// Mock de contexto sem usuário (não autenticado)
const createUnauthenticatedContext = (): Context => ({
  user: undefined,
  req: {} as any,
  res: {} as any,
});

describe("Users Router", () => {
  const caller = appRouter.createCaller(createAdminContext());
  const rhCaller = appRouter.createCaller(createRHContext());
  const gestorCaller = appRouter.createCaller(createGestorContext());
  const unauthCaller = appRouter.createCaller(createUnauthenticatedContext());

  describe("Permissões de Acesso", () => {
    it("deve permitir acesso para admin", async () => {
      const result = await caller.users.list();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("deve permitir acesso para RH", async () => {
      const result = await rhCaller.users.list();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("deve negar acesso para gestor", async () => {
      await expect(gestorCaller.users.list()).rejects.toThrow();
    });

    it("deve negar acesso para usuário não autenticado", async () => {
      await expect(unauthCaller.users.list()).rejects.toThrow();
    });
  });

  describe("Listagem de Usuários", () => {
    it("deve retornar lista de usuários", async () => {
      const users = await caller.users.list();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
    });

    it("deve retornar usuários com propriedades corretas", async () => {
      const users = await caller.users.list();
      if (users.length > 0) {
        const user = users[0];
        expect(user).toHaveProperty("id");
        expect(user).toHaveProperty("name");
        expect(user).toHaveProperty("email");
        expect(user).toHaveProperty("role");
        expect(user).toHaveProperty("isSalaryLead");
      }
    });
  });

  describe("Busca de Usuários por Role", () => {
    it("deve retornar apenas administradores", async () => {
      const admins = await caller.users.getByRole({ role: "admin" });
      expect(Array.isArray(admins)).toBe(true);
      admins.forEach((user) => {
        expect(user.role).toBe("admin");
      });
    });

    it("deve retornar apenas gestores", async () => {
      const gestores = await caller.users.getByRole({ role: "gestor" });
      expect(Array.isArray(gestores)).toBe(true);
      gestores.forEach((user) => {
        expect(user.role).toBe("gestor");
      });
    });

    it("deve retornar apenas RH", async () => {
      const rh = await caller.users.getByRole({ role: "rh" });
      expect(Array.isArray(rh)).toBe(true);
      rh.forEach((user) => {
        expect(user.role).toBe("rh");
      });
    });
  });

  describe("Estatísticas de Usuários", () => {
    it("deve retornar estatísticas corretas", async () => {
      const stats = await caller.users.stats();
      
      expect(stats).toHaveProperty("total");
      expect(stats).toHaveProperty("byRole");
      expect(stats).toHaveProperty("salaryLeads");
      
      expect(typeof stats.total).toBe("number");
      expect(stats.total).toBeGreaterThan(0);
      
      expect(stats.byRole).toHaveProperty("admin");
      expect(stats.byRole).toHaveProperty("rh");
      expect(stats.byRole).toHaveProperty("gestor");
      expect(stats.byRole).toHaveProperty("colaborador");
      
      // Soma dos roles deve ser igual ao total
      const sumByRole = 
        stats.byRole.admin + 
        stats.byRole.rh + 
        stats.byRole.gestor + 
        stats.byRole.colaborador;
      expect(sumByRole).toBe(stats.total);
    });
  });

  describe("Busca de Usuários", () => {
    it("deve buscar usuários por termo", async () => {
      const allUsers = await caller.users.list();
      if (allUsers.length > 0) {
        const firstUser = allUsers[0];
        if (firstUser.name) {
          const searchTerm = firstUser.name.substring(0, 5);
          const results = await caller.users.search({ term: searchTerm });
          expect(Array.isArray(results)).toBe(true);
        }
      }
    });
  });

  describe("Validação de Dados", () => {
    it("deve garantir que usuários tenham roles válidos", async () => {
      const users = await caller.users.list();
      const validRoles = ["admin", "rh", "gestor", "colaborador"];
      
      users.forEach((user) => {
        expect(validRoles).toContain(user.role);
      });
    });

    it("deve garantir que isSalaryLead seja booleano", async () => {
      const users = await caller.users.list();
      
      users.forEach((user) => {
        expect(typeof user.isSalaryLead).toBe("boolean");
      });
    });

    it("deve garantir que todos os usuários tenham email", async () => {
      const users = await caller.users.list();
      
      users.forEach((user) => {
        expect(user.email).toBeDefined();
        if (user.email) {
          expect(user.email).toContain("@");
        }
      });
    });
  });
});
