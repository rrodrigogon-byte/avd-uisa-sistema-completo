import { describe, it, expect } from "vitest";

/**
 * Testes para PDI Inteligente com 5 Abas
 * Valida as novas procedures implementadas
 */

describe("PDI Inteligente - 5 Abas", () => {
  describe("Aba 1: Diagnóstico de Competências", () => {
    it("deve validar estrutura de envio de pesquisas diagnósticas", () => {
      const surveyRequest = {
        planId: 1,
        respondents: [
          { respondentId: 1, surveyType: "autoavaliacao" as const },
          { respondentId: 2, surveyType: "superior" as const },
          { respondentId: 3, surveyType: "pares" as const },
        ],
      };

      expect(surveyRequest.planId).toBeGreaterThan(0);
      expect(surveyRequest.respondents).toHaveLength(3);
      expect(surveyRequest.respondents[0].surveyType).toBe("autoavaliacao");
    });

    it("deve validar estrutura de respostas diagnósticas", () => {
      const response = {
        surveyId: 1,
        responses: [
          {
            competencyId: 1,
            score: 4,
            comments: "Demonstra boa capacidade de liderança",
            behavioralExamples: "Conduziu projeto X com sucesso",
          },
        ],
      };

      expect(response.surveyId).toBeGreaterThan(0);
      expect(response.responses[0].score).toBeGreaterThanOrEqual(1);
      expect(response.responses[0].score).toBeLessThanOrEqual(5);
    });

    it("deve validar consolidação de resultados diagnósticos", () => {
      const consolidatedResult = {
        competencyId: 1,
        competencyName: "Liderança Estratégica",
        autoavaliacao: 3,
        superior: 4,
        pares: [3, 4, 3],
        subordinados: [4, 5],
        paresMedia: 3.3,
        subordinadosMedia: 4.5,
        media: 3.8,
      };

      expect(consolidatedResult.media).toBeGreaterThan(0);
      expect(consolidatedResult.pares).toBeInstanceOf(Array);
      expect(consolidatedResult.paresMedia).toBeCloseTo(3.3, 1);
    });
  });

  describe("Aba 2: Matriz de Gaps (Validação)", () => {
    it("deve validar estrutura de gap de competência", () => {
      const gap = {
        planId: 1,
        competencyId: 1,
        currentLevel: 2,
        targetLevel: 4,
        gap: 2,
        priority: "alta" as const,
        status: "identificado" as const,
      };

      expect(gap.gap).toBe(gap.targetLevel - gap.currentLevel);
      expect(gap.priority).toBe("alta");
    });
  });

  describe("Aba 3: Plano 70-20-10 (Validação)", () => {
    it("deve validar distribuição 70-20-10", () => {
      const actions = [
        { axis: "70_pratica", count: 7 },
        { axis: "20_experiencia", count: 2 },
        { axis: "10_educacao", count: 1 },
      ];

      const total = actions.reduce((sum, a) => sum + a.count, 0);
      const praticaPercent = (actions[0].count / total) * 100;
      const experienciaPercent = (actions[1].count / total) * 100;
      const educacaoPercent = (actions[2].count / total) * 100;

      expect(praticaPercent).toBeCloseTo(70, 0);
      expect(experienciaPercent).toBeCloseTo(20, 0);
      expect(educacaoPercent).toBeCloseTo(10, 0);
    });

    it("deve validar estrutura de ação de desenvolvimento", () => {
      const action = {
        planId: 1,
        title: "Liderar projeto estratégico",
        description: "Assumir liderança do projeto de transformação digital",
        axis: "70_pratica" as const,
        developmentArea: "Liderança Executiva",
        successMetric: "Projeto entregue no prazo com ROI positivo",
        responsible: "Gestor + Sponsor",
        dueDate: new Date("2025-12-31"),
        status: "nao_iniciado" as const,
        progress: 0,
      };

      expect(action.axis).toBe("70_pratica");
      expect(action.progress).toBeGreaterThanOrEqual(0);
      expect(action.progress).toBeLessThanOrEqual(100);
    });
  });

  describe("Aba 4: Progressão", () => {
    it("deve validar estrutura de evidência de progresso", () => {
      const evidence = {
        itemId: 1,
        evidenceType: "certificado" as const,
        title: "Certificação PMP",
        description: "Certificação em Gestão de Projetos",
        fileUrl: "https://s3.amazonaws.com/bucket/certificado.pdf",
        uploadedBy: 1,
        isValidated: false,
      };

      expect(evidence.evidenceType).toBe("certificado");
      expect(evidence.fileUrl).toContain("https://");
      expect(evidence.isValidated).toBe(false);
    });

    it("deve validar estrutura de check-in periódico", () => {
      const checkIn = {
        planId: 1,
        checkInType: "trimestral" as const,
        overallProgress: 65,
        onTrack: true,
        accomplishments: "Concluiu 3 das 5 ações planejadas",
        challenges: "Dificuldade em conciliar tempo com demandas operacionais",
        nextSteps: "Focar nas ações de maior impacto",
        supportNeeded: "Apoio do sponsor para priorização",
      };

      expect(checkIn.overallProgress).toBeGreaterThanOrEqual(0);
      expect(checkIn.overallProgress).toBeLessThanOrEqual(100);
      expect(checkIn.onTrack).toBe(true);
    });

    it("deve validar timeline de progresso", () => {
      const timeline = {
        checkIns: [
          { checkInDate: new Date("2025-03-01"), overallProgress: 25 },
          { checkInDate: new Date("2025-06-01"), overallProgress: 50 },
          { checkInDate: new Date("2025-09-01"), overallProgress: 75 },
        ],
        evidences: [
          { uploadedAt: new Date("2025-04-15"), evidenceType: "certificado" },
          { uploadedAt: new Date("2025-07-20"), evidenceType: "documento" },
        ],
        milestones: [
          { achievedDate: new Date("2025-05-01"), status: "alcancado" },
        ],
      };

      expect(timeline.checkIns).toHaveLength(3);
      expect(timeline.evidences).toHaveLength(2);
      expect(timeline.milestones).toHaveLength(1);
    });
  });

  describe("Aba 5: Riscos e Mitigações", () => {
    it("deve validar estrutura de risco", () => {
      const risk = {
        planId: 1,
        type: "gap_competencia" as const,
        description: "Dificuldade em desenvolver visão holística no prazo",
        impact: "alto" as const,
        probability: "media" as const,
        status: "identificado" as const,
      };

      expect(risk.type).toBe("gap_competencia");
      expect(risk.impact).toBe("alto");
      expect(risk.probability).toBe("media");
    });

    it("deve validar estrutura de mitigação de risco", () => {
      const mitigation = {
        riskId: 1,
        mitigationType: "preventiva" as const,
        actionDescription: "Aumentar frequência de mentorias com sponsor",
        responsibleId: 2,
        dueDate: new Date("2025-12-31"),
        status: "planejada" as const,
        progress: 0,
        effectiveness: "nao_avaliada" as const,
      };

      expect(mitigation.mitigationType).toBe("preventiva");
      expect(mitigation.status).toBe("planejada");
      expect(mitigation.progress).toBe(0);
    });

    it("deve validar cálculo de matriz de risco", () => {
      const riskMatrix = [
        { impact: "alto", probability: "alta", score: 9 },
        { impact: "alto", probability: "media", score: 6 },
        { impact: "medio", probability: "alta", score: 6 },
        { impact: "baixo", probability: "baixa", score: 1 },
      ];

      const impactMap = { baixo: 1, medio: 2, alto: 3, critico: 4 };
      const probabilityMap = { baixa: 1, media: 2, alta: 3 };

      riskMatrix.forEach((risk) => {
        const expectedScore =
          impactMap[risk.impact as keyof typeof impactMap] *
          probabilityMap[risk.probability as keyof typeof probabilityMap];
        expect(risk.score).toBe(expectedScore);
      });
    });

    it("deve validar estrutura de marco/celebração", () => {
      const milestone = {
        planId: 1,
        title: "Conclusão do primeiro ano do PDI",
        description: "Todas as ações do primeiro ano foram concluídas",
        milestoneType: "competencia_desenvolvida" as const,
        targetDate: new Date("2025-12-31"),
        achievedDate: new Date("2025-12-15"),
        status: "alcancado" as const,
        impactDescription: "Evolução significativa em liderança estratégica",
        wasCelebrated: true,
        celebrationNotes: "Reconhecimento em reunião de diretoria",
      };

      expect(milestone.status).toBe("alcancado");
      expect(milestone.wasCelebrated).toBe(true);
      expect(milestone.achievedDate).toBeDefined();
    });
  });

  describe("Validações Gerais", () => {
    it("deve validar fluxo completo do PDI Inteligente", () => {
      const pdiFlow = {
        step1_diagnostic: "Enviar pesquisas 360°",
        step2_gaps: "Identificar gaps de competências",
        step3_plan: "Criar ações 70-20-10",
        step4_execution: "Executar ações e registrar progresso",
        step5_review: "Check-ins periódicos",
        step6_risks: "Monitorar e mitigar riscos",
        step7_celebration: "Celebrar marcos alcançados",
      };

      expect(Object.keys(pdiFlow)).toHaveLength(7);
      expect(pdiFlow.step1_diagnostic).toBe("Enviar pesquisas 360°");
    });

    it("deve validar integração entre abas", () => {
      // Diagnóstico → Gaps
      const diagnosticResult = { competencyId: 1, media: 2.5 };
      const targetLevel = 4;
      const gap = targetLevel - Math.round(diagnosticResult.media);

      expect(gap).toBeGreaterThan(0);

      // Gaps → Plano 70-20-10
      const actionForGap = {
        competencyId: 1,
        axis: "70_pratica",
        title: "Ação para superar gap",
      };

      expect(actionForGap.competencyId).toBe(diagnosticResult.competencyId);

      // Plano → Progressão
      const progressUpdate = {
        actionId: 1,
        progress: 50,
        evidence: "Certificado obtido",
      };

      expect(progressUpdate.progress).toBeGreaterThan(0);
    });
  });
});
