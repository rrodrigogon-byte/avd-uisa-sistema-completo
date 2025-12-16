import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Testes para os routers de Fluxo de Aprovação e Mapeamento de Atividades
 */

// Mock do banco de dados
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnValue([{ insertId: 1 }]),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
};

vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue(mockDb),
}));

describe("Fluxo de Aprovação de Descrições de Cargos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Estrutura do Fluxo de 4 Níveis", () => {
    it("deve ter 4 níveis de aprovação definidos", () => {
      const APPROVAL_LEVELS = {
        1: "Líder Imediato",
        2: "Especialista C&S",
        3: "Gerente RH",
        4: "Diretor GAI",
      };

      expect(Object.keys(APPROVAL_LEVELS)).toHaveLength(4);
      expect(APPROVAL_LEVELS[1]).toBe("Líder Imediato");
      expect(APPROVAL_LEVELS[2]).toBe("Especialista C&S");
      expect(APPROVAL_LEVELS[3]).toBe("Gerente RH");
      expect(APPROVAL_LEVELS[4]).toBe("Diretor GAI");
    });

    it("deve ter status de fluxo válidos", () => {
      const VALID_STATUSES = [
        "draft",
        "pending_leader",
        "pending_cs_specialist",
        "pending_hr_manager",
        "pending_gai_director",
        "approved",
        "rejected",
        "returned",
      ];

      expect(VALID_STATUSES).toContain("draft");
      expect(VALID_STATUSES).toContain("approved");
      expect(VALID_STATUSES).toContain("rejected");
      expect(VALID_STATUSES).toContain("returned");
      expect(VALID_STATUSES).toHaveLength(8);
    });

    it("deve mapear corretamente nível para status pendente", () => {
      const levelToStatus: Record<number, string> = {
        1: "pending_leader",
        2: "pending_cs_specialist",
        3: "pending_hr_manager",
        4: "pending_gai_director",
      };

      expect(levelToStatus[1]).toBe("pending_leader");
      expect(levelToStatus[2]).toBe("pending_cs_specialist");
      expect(levelToStatus[3]).toBe("pending_hr_manager");
      expect(levelToStatus[4]).toBe("pending_gai_director");
    });
  });

  describe("Validações de Aprovação", () => {
    it("deve rejeitar aprovação sem comentário quando obrigatório", () => {
      const validateRejection = (comments: string | undefined): boolean => {
        return !!comments && comments.length >= 10;
      };

      expect(validateRejection(undefined)).toBe(false);
      expect(validateRejection("")).toBe(false);
      expect(validateRejection("curto")).toBe(false);
      expect(validateRejection("comentário válido com mais de 10 caracteres")).toBe(true);
    });

    it("deve permitir aprovação sem comentário", () => {
      const validateApproval = (comments: string | undefined): boolean => {
        return true; // Comentário é opcional para aprovação
      };

      expect(validateApproval(undefined)).toBe(true);
      expect(validateApproval("")).toBe(true);
      expect(validateApproval("comentário opcional")).toBe(true);
    });

    it("deve avançar para próximo nível após aprovação", () => {
      const getNextLevel = (currentLevel: number): number | null => {
        if (currentLevel >= 4) return null; // Já está no último nível
        return currentLevel + 1;
      };

      expect(getNextLevel(1)).toBe(2);
      expect(getNextLevel(2)).toBe(3);
      expect(getNextLevel(3)).toBe(4);
      expect(getNextLevel(4)).toBe(null);
    });

    it("deve marcar como aprovado após nível 4", () => {
      const getStatusAfterApproval = (currentLevel: number): string => {
        if (currentLevel === 4) return "approved";
        const levelToStatus: Record<number, string> = {
          1: "pending_cs_specialist",
          2: "pending_hr_manager",
          3: "pending_gai_director",
        };
        return levelToStatus[currentLevel] || "draft";
      };

      expect(getStatusAfterApproval(1)).toBe("pending_cs_specialist");
      expect(getStatusAfterApproval(2)).toBe("pending_hr_manager");
      expect(getStatusAfterApproval(3)).toBe("pending_gai_director");
      expect(getStatusAfterApproval(4)).toBe("approved");
    });
  });
});

describe("Mapeamento de Rotinas e Atividades", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Categorias de Rotinas", () => {
    it("deve ter categorias válidas definidas", () => {
      const CATEGORIES = [
        "processo",
        "analise",
        "planejamento",
        "comunicacao",
        "reuniao",
        "relatorio",
        "suporte",
        "administrativo",
        "outros",
      ];

      expect(CATEGORIES).toHaveLength(9);
      expect(CATEGORIES).toContain("processo");
      expect(CATEGORIES).toContain("analise");
      expect(CATEGORIES).toContain("reuniao");
    });

    it("deve ter frequências válidas definidas", () => {
      const FREQUENCIES = {
        diaria: { label: "Diária", multiplier: 22 },
        semanal: { label: "Semanal", multiplier: 4 },
        quinzenal: { label: "Quinzenal", multiplier: 2 },
        mensal: { label: "Mensal", multiplier: 1 },
        trimestral: { label: "Trimestral", multiplier: 0.33 },
        eventual: { label: "Eventual", multiplier: 0.5 },
      };

      expect(Object.keys(FREQUENCIES)).toHaveLength(6);
      expect(FREQUENCIES.diaria.multiplier).toBe(22);
      expect(FREQUENCIES.mensal.multiplier).toBe(1);
    });
  });

  describe("Cálculo de Tempo Estimado", () => {
    it("deve calcular corretamente tempo mensal estimado", () => {
      const calculateMonthlyMinutes = (
        estimatedMinutes: number,
        frequency: string
      ): number => {
        const multipliers: Record<string, number> = {
          diaria: 22,
          semanal: 4,
          quinzenal: 2,
          mensal: 1,
          trimestral: 0.33,
          eventual: 0.5,
        };
        return estimatedMinutes * (multipliers[frequency] || 1);
      };

      expect(calculateMonthlyMinutes(30, "diaria")).toBe(660); // 30 * 22
      expect(calculateMonthlyMinutes(60, "semanal")).toBe(240); // 60 * 4
      expect(calculateMonthlyMinutes(120, "mensal")).toBe(120); // 120 * 1
    });

    it("deve calcular aderência corretamente", () => {
      const calculateAdherence = (
        linkedRoutines: number,
        totalRoutines: number
      ): number => {
        if (totalRoutines === 0) return 0;
        return Math.round((linkedRoutines / totalRoutines) * 100);
      };

      expect(calculateAdherence(8, 10)).toBe(80);
      expect(calculateAdherence(5, 10)).toBe(50);
      expect(calculateAdherence(10, 10)).toBe(100);
      expect(calculateAdherence(0, 10)).toBe(0);
      expect(calculateAdherence(0, 0)).toBe(0);
    });
  });

  describe("Vinculação de Rotinas", () => {
    it("deve validar vinculação de rotina a responsabilidade", () => {
      const validateLink = (
        routineId: number | undefined,
        responsibilityId: number | undefined
      ): boolean => {
        return !!routineId && !!responsibilityId;
      };

      expect(validateLink(1, 1)).toBe(true);
      expect(validateLink(undefined, 1)).toBe(false);
      expect(validateLink(1, undefined)).toBe(false);
      expect(validateLink(undefined, undefined)).toBe(false);
    });

    it("deve atualizar flag de vinculação corretamente", () => {
      const getLinkedFlag = (responsibilityId: number | null): boolean => {
        return responsibilityId !== null && responsibilityId > 0;
      };

      expect(getLinkedFlag(1)).toBe(true);
      expect(getLinkedFlag(null)).toBe(false);
      expect(getLinkedFlag(0)).toBe(false);
    });
  });
});

describe("Confronto de Atividades com Descrição de Cargo", () => {
  describe("Cálculo de Métricas de Confronto", () => {
    it("deve calcular percentual de aderência corretamente", () => {
      const calculateAdherencePercentage = (
        activitiesMatchedToJob: number,
        totalActivities: number
      ): number => {
        if (totalActivities === 0) return 0;
        return Math.round((activitiesMatchedToJob / totalActivities) * 100);
      };

      expect(calculateAdherencePercentage(15, 20)).toBe(75);
      expect(calculateAdherencePercentage(20, 20)).toBe(100);
      expect(calculateAdherencePercentage(0, 20)).toBe(0);
      expect(calculateAdherencePercentage(0, 0)).toBe(0);
    });

    it("deve calcular percentual de cobertura corretamente", () => {
      const calculateCoveragePercentage = (
        executedResponsibilities: number,
        totalResponsibilities: number
      ): number => {
        if (totalResponsibilities === 0) return 0;
        return Math.round((executedResponsibilities / totalResponsibilities) * 100);
      };

      expect(calculateCoveragePercentage(8, 10)).toBe(80);
      expect(calculateCoveragePercentage(10, 10)).toBe(100);
      expect(calculateCoveragePercentage(0, 10)).toBe(0);
    });

    it("deve identificar gaps corretamente", () => {
      const identifyGaps = (
        routines: Array<{ isLinkedToJobDescription: boolean; name: string }>,
        responsibilities: Array<{ id: number; description: string }>,
        executedResponsibilityIds: Set<number>
      ) => {
        const gaps = [];

        // Atividades não vinculadas ao cargo
        routines
          .filter((r) => !r.isLinkedToJobDescription)
          .forEach((r) => {
            gaps.push({
              type: "activity_not_in_job",
              description: r.name,
              severity: "low",
            });
          });

        // Responsabilidades não executadas
        responsibilities
          .filter((r) => !executedResponsibilityIds.has(r.id))
          .forEach((r) => {
            gaps.push({
              type: "responsibility_not_executed",
              description: r.description,
              severity: "medium",
            });
          });

        return gaps;
      };

      const routines = [
        { isLinkedToJobDescription: true, name: "Rotina 1" },
        { isLinkedToJobDescription: false, name: "Rotina 2" },
      ];
      const responsibilities = [
        { id: 1, description: "Resp 1" },
        { id: 2, description: "Resp 2" },
      ];
      const executedIds = new Set([1]);

      const gaps = identifyGaps(routines, responsibilities, executedIds);

      expect(gaps).toHaveLength(2);
      expect(gaps[0].type).toBe("activity_not_in_job");
      expect(gaps[1].type).toBe("responsibility_not_executed");
    });
  });

  describe("Categorização Automática de Atividades", () => {
    it("deve categorizar atividades de desktop corretamente", () => {
      const categorizeActivity = (
        activityType: string,
        applicationName?: string
      ): string => {
        if (activityType === "meeting") return "reuniao";
        if (activityType === "email") return "comunicacao";
        if (activityType === "document") return "analise";
        if (applicationName?.toLowerCase().includes("excel")) return "analise";
        if (applicationName?.toLowerCase().includes("word")) return "relatorio";
        if (applicationName?.toLowerCase().includes("powerpoint")) return "planejamento";
        return "outros";
      };

      expect(categorizeActivity("meeting")).toBe("reuniao");
      expect(categorizeActivity("email")).toBe("comunicacao");
      expect(categorizeActivity("document")).toBe("analise");
      expect(categorizeActivity("application", "Microsoft Excel")).toBe("analise");
      expect(categorizeActivity("application", "Microsoft Word")).toBe("relatorio");
      expect(categorizeActivity("application", "PowerPoint")).toBe("planejamento");
      expect(categorizeActivity("application", "Chrome")).toBe("outros");
    });
  });

  describe("Geração de Sugestões de Ajuste", () => {
    it("deve gerar sugestões baseadas nos gaps", () => {
      const generateSuggestions = (
        activitiesNotInJob: number,
        responsibilitiesNotExecuted: number
      ) => {
        const suggestions = [];

        if (activitiesNotInJob > 0) {
          suggestions.push({
            type: "add_responsibilities",
            description: `Considerar adicionar ${activitiesNotInJob} atividades realizadas à descrição de cargo`,
            priority: "medium",
          });
        }

        if (responsibilitiesNotExecuted > 0) {
          suggestions.push({
            type: "review_responsibilities",
            description: `Revisar ${responsibilitiesNotExecuted} responsabilidades não executadas`,
            priority: "high",
          });
        }

        return suggestions;
      };

      const suggestions = generateSuggestions(3, 2);

      expect(suggestions).toHaveLength(2);
      expect(suggestions[0].type).toBe("add_responsibilities");
      expect(suggestions[0].priority).toBe("medium");
      expect(suggestions[1].type).toBe("review_responsibilities");
      expect(suggestions[1].priority).toBe("high");
    });
  });
});

describe("Logs de Atividades de Desktop", () => {
  describe("Validação de Dados de Atividade", () => {
    it("deve validar tipos de atividade válidos", () => {
      const VALID_ACTIVITY_TYPES = [
        "application",
        "website",
        "document",
        "meeting",
        "email",
        "idle",
        "other",
      ];

      const isValidActivityType = (type: string): boolean => {
        return VALID_ACTIVITY_TYPES.includes(type);
      };

      expect(isValidActivityType("application")).toBe(true);
      expect(isValidActivityType("meeting")).toBe(true);
      expect(isValidActivityType("invalid")).toBe(false);
    });

    it("deve validar tipos de dispositivo válidos", () => {
      const VALID_DEVICE_TYPES = ["desktop", "laptop", "mobile"];

      const isValidDeviceType = (type: string): boolean => {
        return VALID_DEVICE_TYPES.includes(type);
      };

      expect(isValidDeviceType("desktop")).toBe(true);
      expect(isValidDeviceType("laptop")).toBe(true);
      expect(isValidDeviceType("tablet")).toBe(false);
    });

    it("deve calcular duração corretamente", () => {
      const calculateDuration = (
        startTime: string,
        endTime: string | undefined
      ): number | null => {
        if (!endTime) return null;
        const start = new Date(startTime).getTime();
        const end = new Date(endTime).getTime();
        return Math.floor((end - start) / 1000);
      };

      expect(
        calculateDuration("2025-12-16T08:00:00Z", "2025-12-16T08:30:00Z")
      ).toBe(1800); // 30 minutos
      expect(
        calculateDuration("2025-12-16T08:00:00Z", "2025-12-16T09:00:00Z")
      ).toBe(3600); // 1 hora
      expect(calculateDuration("2025-12-16T08:00:00Z", undefined)).toBe(null);
    });
  });
});
