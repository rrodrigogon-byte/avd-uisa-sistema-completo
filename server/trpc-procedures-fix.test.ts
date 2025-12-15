import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";

describe("Correção de Procedimentos tRPC Faltantes", () => {
  beforeAll(async () => {
    // Garantir que o banco de dados está disponível
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available for testing");
    }
  });

  describe("Notifications Router", () => {
    it("deve ter o procedimento getMyNotifications", () => {
      // Verificar se o procedimento existe no router
      expect(appRouter.notifications.getMyNotifications).toBeDefined();
    });

    it("deve ter o procedimento getInApp", () => {
      // Verificar se o procedimento existe no router
      expect(appRouter.notifications.getInApp).toBeDefined();
    });

    it("deve ter o procedimento list (original)", () => {
      // Verificar que o procedimento original ainda existe
      expect(appRouter.notifications.list).toBeDefined();
    });
  });

  describe("Psychometric Tests Router", () => {
    it("deve ter o procedimento getResultsByEmployee", () => {
      // Verificar se o procedimento existe no router
      expect(appRouter.psychometricTests.getResultsByEmployee).toBeDefined();
    });

    it("deve ter o procedimento getEmployeeResults (original)", () => {
      // Verificar que o procedimento original ainda existe
      expect(appRouter.psychometricTests.getEmployeeResults).toBeDefined();
    });
  });

  describe("Verificação de Routers", () => {
    it("todos os routers necessários devem estar acessíveis", () => {
      // Verificar que todos os routers estão definidos e acessíveis
      expect(appRouter.notifications).toBeDefined();
      expect(appRouter.psychometricTests).toBeDefined();
      
      // Verificar que os procedimentos específicos existem
      expect(appRouter.notifications.getMyNotifications).toBeDefined();
      expect(appRouter.notifications.getInApp).toBeDefined();
      expect(appRouter.psychometricTests.getResultsByEmployee).toBeDefined();
    });
  });
});
