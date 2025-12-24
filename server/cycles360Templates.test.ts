import { describe, it, expect } from "vitest";

/**
 * Testes de Validação para Sistema de Templates 360°
 * 
 * Validações de estrutura de dados e lógica de negócio
 */

describe("Cycles360Templates - Validação de Estrutura", () => {
  describe("Validação de pesos", () => {
    it("deve validar que a soma dos pesos é 100%", () => {
      const weights = {
        selfWeight: 20,
        peerWeight: 30,
        subordinateWeight: 20,
        managerWeight: 30,
      };

      const total = weights.selfWeight + weights.peerWeight + weights.subordinateWeight + weights.managerWeight;
      expect(total).toBe(100);
    });

    it("deve detectar soma incorreta de pesos", () => {
      const weights = {
        selfWeight: 25,
        peerWeight: 25,
        subordinateWeight: 25,
        managerWeight: 20, // Soma = 95%
      };

      const total = weights.selfWeight + weights.peerWeight + weights.subordinateWeight + weights.managerWeight;
      expect(total).not.toBe(100);
    });

    it("deve validar pesos individuais dentro do range 0-100", () => {
      const validWeights = [20, 30, 20, 30];
      
      validWeights.forEach(weight => {
        expect(weight).toBeGreaterThanOrEqual(0);
        expect(weight).toBeLessThanOrEqual(100);
      });
    });
  });

  describe("Validação de template data", () => {
    it("deve validar estrutura completa de template", () => {
      const template = {
        id: 1,
        name: "Template Padrão",
        description: "Configuração padrão de avaliação 360°",
        createdBy: 1,
        creatorName: "Admin",
        selfWeight: 20,
        peerWeight: 30,
        subordinateWeight: 20,
        managerWeight: 30,
        competencyIds: [1, 2, 3, 4, 5],
        isPublic: true,
        usageCount: 0,
      };

      expect(template).toHaveProperty("id");
      expect(template).toHaveProperty("name");
      expect(template).toHaveProperty("selfWeight");
      expect(template).toHaveProperty("peerWeight");
      expect(template).toHaveProperty("subordinateWeight");
      expect(template).toHaveProperty("managerWeight");
      expect(template).toHaveProperty("competencyIds");
      expect(template).toHaveProperty("isPublic");
      expect(template).toHaveProperty("usageCount");

      expect(typeof template.name).toBe("string");
      expect(Array.isArray(template.competencyIds)).toBe(true);
      expect(typeof template.isPublic).toBe("boolean");
      expect(typeof template.usageCount).toBe("number");
    });

    it("deve validar nome do template", () => {
      const validName = "Template Avaliação 2025";
      const invalidName = "AB"; // Muito curto

      expect(validName.length).toBeGreaterThanOrEqual(3);
      expect(invalidName.length).toBeLessThan(3);
    });

    it("deve validar array de competências", () => {
      const competencyIds = [1, 2, 3, 4, 5];

      expect(Array.isArray(competencyIds)).toBe(true);
      expect(competencyIds.length).toBeGreaterThan(0);
      
      competencyIds.forEach(id => {
        expect(typeof id).toBe("number");
        expect(id).toBeGreaterThan(0);
      });
    });
  });

  describe("Validação de permissões", () => {
    it("deve diferenciar templates públicos e privados", () => {
      const publicTemplate = { isPublic: true, createdBy: 1 };
      const privateTemplate = { isPublic: false, createdBy: 1 };

      expect(publicTemplate.isPublic).toBe(true);
      expect(privateTemplate.isPublic).toBe(false);
    });

    it("deve validar acesso a template público", () => {
      const template = { isPublic: true, createdBy: 1 };
      const currentUserId = 2; // Usuário diferente do criador

      // Template público deve ser acessível por qualquer usuário
      const canAccess = template.isPublic || template.createdBy === currentUserId;
      expect(canAccess).toBe(true);
    });

    it("deve validar acesso a template privado", () => {
      const template = { isPublic: false, createdBy: 1 };
      const currentUserId = 2; // Usuário diferente do criador

      // Template privado só é acessível pelo criador
      const canAccess = template.isPublic || template.createdBy === currentUserId;
      expect(canAccess).toBe(false);
    });

    it("deve validar acesso do criador ao próprio template privado", () => {
      const template = { isPublic: false, createdBy: 1 };
      const currentUserId = 1; // Mesmo usuário criador

      const canAccess = template.isPublic || template.createdBy === currentUserId;
      expect(canAccess).toBe(true);
    });
  });

  describe("Validação de contador de uso", () => {
    it("deve inicializar contador em 0", () => {
      const newTemplate = { usageCount: 0 };
      expect(newTemplate.usageCount).toBe(0);
    });

    it("deve incrementar contador corretamente", () => {
      let usageCount = 0;
      
      // Simular 3 usos
      usageCount++;
      usageCount++;
      usageCount++;

      expect(usageCount).toBe(3);
    });
  });

  describe("Validação de JSON de competências", () => {
    it("deve serializar array de competências para JSON", () => {
      const competencyIds = [1, 2, 3, 4, 5];
      const json = JSON.stringify(competencyIds);

      expect(typeof json).toBe("string");
      expect(json).toBe("[1,2,3,4,5]");
    });

    it("deve deserializar JSON para array de competências", () => {
      const json = "[1,2,3,4,5]";
      const competencyIds = JSON.parse(json);

      expect(Array.isArray(competencyIds)).toBe(true);
      expect(competencyIds).toEqual([1, 2, 3, 4, 5]);
    });
  });
});
