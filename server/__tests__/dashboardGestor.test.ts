import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

/**
 * Testes para Dashboard de Gestores
 * 
 * Valida os endpoints criados para o dashboard específico de gestores:
 * - employees.getTeamByManager
 * - goals.getTeamGoals
 * - pdi.getTeamPDIs
 * - evaluations.getPendingByManager
 */

describe("Dashboard de Gestores", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    // Mock do contexto com usuário autenticado
    const mockContext: TrpcContext = {
      user: {
        id: 1,
        openId: "test-open-id",
        name: "Test Manager",
        email: "manager@test.com",
        role: "admin",
        loginMethod: "email",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {} as any,
      res: {} as any,
    };

    caller = appRouter.createCaller(mockContext);
  });

  describe("employees.getTeamByManager", () => {
    it("deve retornar lista vazia quando gestor não tem subordinados", async () => {
      const result = await caller.employees.getTeamByManager({ managerId: 999 });
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("deve retornar subordinados diretos do gestor", async () => {
      // Assumindo que o gestor ID 1 tem subordinados
      const result = await caller.employees.getTeamByManager({ managerId: 1 });
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      // Verificar estrutura dos dados retornados
      if (result.length > 0) {
        const subordinado = result[0];
        expect(subordinado).toHaveProperty("id");
        expect(subordinado).toHaveProperty("name");
        expect(subordinado).toHaveProperty("email");
        expect(subordinado).toHaveProperty("managerId");
        expect(subordinado.managerId).toBe(1);
      }
    });
  });

  describe("goals.getTeamGoals", () => {
    it("deve retornar lista vazia quando equipe não tem metas", async () => {
      const result = await caller.goals.getTeamGoals({ managerId: 999 });
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("deve retornar metas da equipe do gestor", async () => {
      const result = await caller.goals.getTeamGoals({ managerId: 1 });
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      // Verificar estrutura dos dados retornados
      if (result.length > 0) {
        const meta = result[0];
        expect(meta).toHaveProperty("id");
        expect(meta).toHaveProperty("title");
        expect(meta).toHaveProperty("employeeId");
        expect(meta).toHaveProperty("status");
        expect(meta).toHaveProperty("progress");
        expect(meta).toHaveProperty("employee");
      }
    });
  });

  describe("pdi.getTeamPDIs", () => {
    it("deve retornar lista vazia quando equipe não tem PDIs", async () => {
      const result = await caller.pdi.getTeamPDIs({ managerId: 999 });
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("deve retornar PDIs da equipe do gestor", async () => {
      const result = await caller.pdi.getTeamPDIs({ managerId: 1 });
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      // Verificar estrutura dos dados retornados
      if (result.length > 0) {
        const pdi = result[0];
        expect(pdi).toHaveProperty("id");
        expect(pdi).toHaveProperty("employeeId");
        expect(pdi).toHaveProperty("status");
        expect(pdi).toHaveProperty("overallProgress");
        expect(pdi).toHaveProperty("employee");
      }
    });
  });

  describe("evaluations.getPendingByManager", () => {
    it("deve retornar lista vazia quando não há avaliações pendentes", async () => {
      const result = await caller.evaluations.getPendingByManager({ managerId: 999 });
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("deve retornar avaliações pendentes da equipe do gestor", async () => {
      const result = await caller.evaluations.getPendingByManager({ managerId: 1 });
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      // Verificar estrutura dos dados retornados
      if (result.length > 0) {
        const avaliacao = result[0];
        expect(avaliacao).toHaveProperty("id");
        expect(avaliacao).toHaveProperty("employeeId");
        expect(avaliacao).toHaveProperty("status");
        expect(avaliacao).toHaveProperty("type");
        expect(avaliacao).toHaveProperty("employee");
        expect(avaliacao).toHaveProperty("cycle");
        
        // Verificar que o status é pendente ou em_andamento
        expect(["pendente", "em_andamento"]).toContain(avaliacao.status);
      }
    });
  });

  describe("Integração completa", () => {
    it("deve retornar dados consistentes para um gestor específico", async () => {
      const managerId = 1;
      
      // Buscar todos os dados do dashboard
      const [team, goals, pdis, evaluations] = await Promise.all([
        caller.employees.getTeamByManager({ managerId }),
        caller.goals.getTeamGoals({ managerId }),
        caller.pdi.getTeamPDIs({ managerId }),
        caller.evaluations.getPendingByManager({ managerId }),
      ]);
      
      // Todos devem retornar arrays
      expect(Array.isArray(team)).toBe(true);
      expect(Array.isArray(goals)).toBe(true);
      expect(Array.isArray(pdis)).toBe(true);
      expect(Array.isArray(evaluations)).toBe(true);
      
      // Se há subordinados, deve haver dados relacionados
      if (team.length > 0) {
        const subordinadoIds = team.map(e => e.id);
        
        // Metas devem ser de subordinados
        goals.forEach(meta => {
          expect(subordinadoIds).toContain(meta.employeeId);
        });
        
        // PDIs devem ser de subordinados
        pdis.forEach(pdi => {
          expect(subordinadoIds).toContain(pdi.employeeId);
        });
        
        // Avaliações devem ser de subordinados
        evaluations.forEach(avaliacao => {
          expect(subordinadoIds).toContain(avaliacao.employeeId);
        });
      }
    });
  });
});
