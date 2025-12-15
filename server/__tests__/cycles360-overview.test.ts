import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../routers";
import type { Context } from "../_core/context";

/**
 * Testes para Ciclos 360° Overview
 * Valida os novos endpoints de visão geral e detalhes de ciclos
 */

describe("Cycles 360° Overview Router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    // Mock do contexto com usuário autenticado
    const mockContext: Context = {
      user: {
        id: 1,
        openId: "test-open-id",
        name: "Test User",
        email: "test@example.com",
        role: "admin",
        loginMethod: "oauth",
        isSalaryLead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        faceDescriptor: null,
        facePhotoUrl: null,
        faceRegisteredAt: null,
      },
      req: {} as any,
      res: {} as any,
    };

    caller = appRouter.createCaller(mockContext);
  });

  describe("getOverallStats", () => {
    it("deve retornar estatísticas gerais dos ciclos", async () => {
      const stats = await caller.cycles360Overview.getOverallStats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty("totalCycles");
      expect(stats).toHaveProperty("activeCycles");
      expect(stats).toHaveProperty("plannedCycles");
      expect(stats).toHaveProperty("completedCycles");
      expect(stats).toHaveProperty("canceledCycles");
      expect(stats).toHaveProperty("totalParticipants");
      expect(stats).toHaveProperty("completedEvaluations");
      expect(stats).toHaveProperty("pendingEvaluations");
      expect(stats).toHaveProperty("overallCompletionRate");

      // Validar tipos
      expect(typeof stats.totalCycles).toBe("number");
      expect(typeof stats.activeCycles).toBe("number");
      expect(typeof stats.overallCompletionRate).toBe("number");

      // Validar ranges
      expect(stats.totalCycles).toBeGreaterThanOrEqual(0);
      expect(stats.overallCompletionRate).toBeGreaterThanOrEqual(0);
      expect(stats.overallCompletionRate).toBeLessThanOrEqual(100);

      console.log("✅ Estatísticas gerais:", stats);
    });
  });

  describe("listCycles", () => {
    it("deve listar todos os ciclos sem filtros", async () => {
      const cycles = await caller.cycles360Overview.listCycles({});

      expect(Array.isArray(cycles)).toBe(true);
      console.log(`✅ Total de ciclos encontrados: ${cycles.length}`);

      if (cycles.length > 0) {
        const cycle = cycles[0];
        expect(cycle).toHaveProperty("id");
        expect(cycle).toHaveProperty("name");
        expect(cycle).toHaveProperty("year");
        expect(cycle).toHaveProperty("type");
        expect(cycle).toHaveProperty("status");
        expect(cycle).toHaveProperty("stats");

        // Validar stats
        expect(cycle.stats).toHaveProperty("totalParticipants");
        expect(cycle.stats).toHaveProperty("completedParticipants");
        expect(cycle.stats).toHaveProperty("pendingParticipants");
        expect(cycle.stats).toHaveProperty("completionRate");

        console.log("✅ Exemplo de ciclo:", {
          id: cycle.id,
          name: cycle.name,
          status: cycle.status,
          completionRate: cycle.stats.completionRate,
        });
      }
    });

    it("deve filtrar ciclos por status ativo", async () => {
      const cycles = await caller.cycles360Overview.listCycles({
        status: "ativo",
      });

      expect(Array.isArray(cycles)).toBe(true);
      cycles.forEach((cycle) => {
        expect(cycle.status).toBe("ativo");
      });

      console.log(`✅ Ciclos ativos encontrados: ${cycles.length}`);
    });

    it("deve filtrar ciclos por ano", async () => {
      const year = 2025;
      const cycles = await caller.cycles360Overview.listCycles({
        year,
      });

      expect(Array.isArray(cycles)).toBe(true);
      cycles.forEach((cycle) => {
        expect(cycle.year).toBe(year);
      });

      console.log(`✅ Ciclos de ${year} encontrados: ${cycles.length}`);
    });

    it("deve filtrar ciclos por tipo", async () => {
      const type = "anual";
      const cycles = await caller.cycles360Overview.listCycles({
        type,
      });

      expect(Array.isArray(cycles)).toBe(true);
      cycles.forEach((cycle) => {
        expect(cycle.type).toBe(type);
      });

      console.log(`✅ Ciclos ${type} encontrados: ${cycles.length}`);
    });

    it("deve aplicar múltiplos filtros simultaneamente", async () => {
      const cycles = await caller.cycles360Overview.listCycles({
        status: "ativo",
        year: 2025,
        type: "anual",
      });

      expect(Array.isArray(cycles)).toBe(true);
      cycles.forEach((cycle) => {
        expect(cycle.status).toBe("ativo");
        expect(cycle.year).toBe(2025);
        expect(cycle.type).toBe("anual");
      });

      console.log(`✅ Ciclos com múltiplos filtros encontrados: ${cycles.length}`);
    });
  });

  describe("getCycleDetails", () => {
    it("deve retornar detalhes completos de um ciclo existente", async () => {
      // Primeiro, buscar um ciclo existente
      const cycles = await caller.cycles360Overview.listCycles({});

      if (cycles.length === 0) {
        console.log("⚠️ Nenhum ciclo encontrado para testar detalhes");
        return;
      }

      const cycleId = cycles[0].id;
      const details = await caller.cycles360Overview.getCycleDetails({ cycleId });

      expect(details).toBeDefined();
      expect(details.cycle).toBeDefined();
      expect(details.cycle.id).toBe(cycleId);

      // Validar estrutura
      expect(details).toHaveProperty("cycle");
      expect(details).toHaveProperty("config");
      expect(details).toHaveProperty("weights");
      expect(details).toHaveProperty("competencies");
      expect(details).toHaveProperty("participants");

      // Validar arrays
      expect(Array.isArray(details.competencies)).toBe(true);
      expect(Array.isArray(details.participants)).toBe(true);

      console.log("✅ Detalhes do ciclo:", {
        id: details.cycle.id,
        name: details.cycle.name,
        competencias: details.competencies.length,
        participantes: details.participants.length,
        configCompleta: details.config?.isCompleted || false,
      });
    });

    it("deve lançar erro para ciclo inexistente", async () => {
      const invalidCycleId = 999999;

      await expect(
        caller.cycles360Overview.getCycleDetails({ cycleId: invalidCycleId })
      ).rejects.toThrow();

      console.log("✅ Erro esperado para ciclo inexistente");
    });
  });

  describe("getCompetencyEvolution", () => {
    it("deve retornar evolução de competências de um colaborador", async () => {
      // Buscar um participante existente
      const cycles = await caller.cycles360Overview.listCycles({});

      if (cycles.length === 0) {
        console.log("⚠️ Nenhum ciclo encontrado para testar evolução");
        return;
      }

      const cycleId = cycles[0].id;
      const details = await caller.cycles360Overview.getCycleDetails({ cycleId });

      if (details.participants.length === 0) {
        console.log("⚠️ Nenhum participante encontrado para testar evolução");
        return;
      }

      const employeeId = details.participants[0].employeeId;
      const evolution = await caller.cycles360Overview.getCompetencyEvolution({
        employeeId,
      });

      expect(Array.isArray(evolution)).toBe(true);
      console.log(`✅ Evolução de competências encontrada: ${evolution.length} ciclos`);

      if (evolution.length > 0) {
        const item = evolution[0];
        if (item) {
          expect(item).toHaveProperty("cycle");
          expect(item).toHaveProperty("competencies");
          expect(item).toHaveProperty("participantStatus");
        }
      }
    });
  });

  describe("compareCycles", () => {
    it("deve comparar múltiplos ciclos", async () => {
      const cycles = await caller.cycles360Overview.listCycles({});

      if (cycles.length < 2) {
        console.log("⚠️ Menos de 2 ciclos encontrados para comparação");
        return;
      }

      const cycleIds = cycles.slice(0, Math.min(3, cycles.length)).map((c) => c.id);
      const comparison = await caller.cycles360Overview.compareCycles({ cycleIds });

      expect(Array.isArray(comparison)).toBe(true);
      expect(comparison.length).toBe(cycleIds.length);

      comparison.forEach((item) => {
        if (item) {
          expect(item).toHaveProperty("cycle");
          expect(item).toHaveProperty("stats");
          expect(item).toHaveProperty("participants");
          expect(item).toHaveProperty("competencies");
        }
      });

      console.log(`✅ Comparação de ${cycleIds.length} ciclos realizada com sucesso`);
    });

    it("deve validar mínimo de 2 ciclos para comparação", async () => {
      await expect(
        caller.cycles360Overview.compareCycles({ cycleIds: [1] })
      ).rejects.toThrow();

      console.log("✅ Validação de mínimo de ciclos funcionando");
    });

    it("deve validar máximo de 5 ciclos para comparação", async () => {
      const cycleIds = [1, 2, 3, 4, 5, 6]; // 6 ciclos (mais que o máximo)

      await expect(
        caller.cycles360Overview.compareCycles({ cycleIds })
      ).rejects.toThrow();

      console.log("✅ Validação de máximo de ciclos funcionando");
    });
  });

  describe("Integração completa", () => {
    it("deve executar fluxo completo de consultas", async () => {
      console.log("\n🔄 Iniciando teste de integração completa...\n");

      // 1. Buscar estatísticas gerais
      const stats = await caller.cycles360Overview.getOverallStats();
      console.log("1️⃣ Estatísticas gerais obtidas:", {
        totalCycles: stats.totalCycles,
        activeCycles: stats.activeCycles,
        completionRate: stats.overallCompletionRate,
      });

      // 2. Listar ciclos ativos
      const activeCycles = await caller.cycles360Overview.listCycles({
        status: "ativo",
      });
      console.log(`2️⃣ Ciclos ativos encontrados: ${activeCycles.length}`);

      // 3. Se houver ciclos, buscar detalhes do primeiro
      if (activeCycles.length > 0) {
        const cycleId = activeCycles[0].id;
        const details = await caller.cycles360Overview.getCycleDetails({ cycleId });
        console.log("3️⃣ Detalhes do primeiro ciclo ativo:", {
          id: details.cycle.id,
          name: details.cycle.name,
          participantes: details.participants.length,
          competencias: details.competencies.length,
        });

        // 4. Se houver participantes, buscar evolução
        if (details.participants.length > 0) {
          const employeeId = details.participants[0].employeeId;
          const evolution = await caller.cycles360Overview.getCompetencyEvolution({
            employeeId,
          });
          console.log(`4️⃣ Evolução do colaborador ${employeeId}: ${evolution.length} ciclos`);
        }
      }

      // 5. Comparar ciclos se houver pelo menos 2
      const allCycles = await caller.cycles360Overview.listCycles({});
      if (allCycles.length >= 2) {
        const cycleIds = allCycles.slice(0, 2).map((c) => c.id);
        const comparison = await caller.cycles360Overview.compareCycles({ cycleIds });
        console.log(`5️⃣ Comparação de ${comparison.length} ciclos realizada`);
      }

      console.log("\n✅ Teste de integração completa finalizado com sucesso!\n");
    });
  });
});
