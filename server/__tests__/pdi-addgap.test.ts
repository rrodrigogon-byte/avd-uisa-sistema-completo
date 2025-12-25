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

describe("PDI Inteligente - addGap", () => {
  it("deve verificar se endpoint addGap existe e funciona", async () => {
    // Primeiro, buscar um PDI existente
    const pdis = await caller.pdiIntelligent.list({});
    
    console.log("📋 PDIs encontrados:", pdis.length);
    
    if (pdis.length === 0) {
      console.log("⚠️  Nenhum PDI encontrado, pulando teste de addGap");
      return;
    }
    
    const pdiId = pdis[0].id;
    console.log("🎯 Testando addGap no PDI:", pdiId);
    
    // Buscar competências disponíveis
    const competencies = await caller.competencies.list();
    console.log("📚 Competências disponíveis:", competencies?.length || 0);
    
    if (!competencies || competencies.length === 0) {
      console.log("⚠️  Nenhuma competência encontrada, pulando teste");
      return;
    }
    
    // Tentar adicionar um gap
    try {
      const result = await caller.pdiIntelligent.addGap({
        planId: pdiId,
        competencyId: competencies[0].id,
        currentLevel: 2,
        targetLevel: 4,
        priority: "media",
      });
      
      console.log("✅ Gap adicionado com sucesso:", result);
      expect(result).toHaveProperty("success");
      expect(result.success).toBe(true);
    } catch (error: any) {
      console.error("❌ Erro ao adicionar gap:", error.message);
      throw error;
    }
  });
});
