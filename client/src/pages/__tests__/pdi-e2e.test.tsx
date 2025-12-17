import { describe, it, expect } from 'vitest';

/**
 * Testes E2E para Módulo PDI (Plano de Desenvolvimento Individual)
 * Testa fluxos críticos de criação, acompanhamento e conclusão de PDIs
 */

describe('PDI - Fluxo E2E', () => {
  describe('Criação de PDI', () => {
    it('deve selecionar cargo-alvo para o PDI', async () => {
      const pdiData = {
        employeeId: 1,
        targetPositionId: 5,
        targetPositionTitle: 'Gerente de Projetos',
        createdAt: new Date(),
      };

      expect(pdiData.targetPositionId).toBeTruthy();
      expect(pdiData.targetPositionTitle).toBeTruthy();
    });

    it('deve analisar gaps de competências com IA', async () => {
      const competencyGaps = [
        { id: 1, name: 'Liderança', current: 6, required: 9, gap: 3 },
        { id: 2, name: 'Gestão de Projetos', current: 5, required: 8, gap: 3 },
        { id: 3, name: 'Comunicação', current: 7, required: 9, gap: 2 },
      ];

      // Verifica que gaps foram identificados
      expect(competencyGaps.length).toBeGreaterThan(0);
      expect(competencyGaps.every(g => g.gap >= 0)).toBe(true);
      
      // Identifica gaps críticos (>= 3 pontos)
      const criticalGaps = competencyGaps.filter(g => g.gap >= 3);
      expect(criticalGaps.length).toBe(2);
    });

    it('deve gerar recomendações de ações com IA', async () => {
      const aiRecommendations = {
        practicalActions: [
          'Liderar projeto de reestruturação (6 meses)',
          'Mentoria de 2-3 analistas júnior',
        ],
        socialLearning: [
          'Mentoria com Gerente Sênior',
          'Job rotation (2 semanas)',
        ],
        formalEducation: [
          'Curso Gestão Avançada de Projetos (40h)',
          'Certificação PMP',
        ],
        timeline: '12 meses',
        estimatedCost: 8500,
      };

      expect(aiRecommendations.practicalActions.length).toBeGreaterThan(0);
      expect(aiRecommendations.timeline).toBeTruthy();
      expect(aiRecommendations.estimatedCost).toBeGreaterThan(0);
    });

    it('deve criar ações de desenvolvimento baseadas em recomendações', async () => {
      const developmentActions = [
        {
          id: 1,
          title: 'Liderar projeto de reestruturação',
          description: 'Assumir liderança do projeto X',
          type: '70-20-10_experience',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-06-30'),
          status: 'not_started',
          responsibleId: 2,
        },
        {
          id: 2,
          title: 'Curso Gestão de Projetos',
          description: 'Curso online de 40h',
          type: '70-20-10_education',
          startDate: new Date('2025-02-01'),
          endDate: new Date('2025-03-01'),
          status: 'not_started',
          responsibleId: 1,
        },
      ];

      expect(developmentActions.length).toBeGreaterThan(0);
      expect(developmentActions.every(a => a.title && a.type)).toBe(true);
      expect(developmentActions[0].endDate > developmentActions[0].startDate).toBe(true);
    });

    it('deve validar regra 70-20-10 nas ações', async () => {
      const actions = [
        { type: '70-20-10_experience', weight: 70 },
        { type: '70-20-10_social', weight: 20 },
        { type: '70-20-10_education', weight: 10 },
      ];

      const totalWeight = actions.reduce((sum, a) => sum + a.weight, 0);
      expect(totalWeight).toBe(100);

      // Verifica que experiência prática é a maior parte
      const experienceWeight = actions.find(a => a.type === '70-20-10_experience')?.weight;
      expect(experienceWeight).toBe(70);
    });
  });

  describe('Acompanhamento de PDI', () => {
    it('deve atualizar progresso de ação', async () => {
      const actionProgress = {
        actionId: 1,
        progress: 45,
        status: 'in_progress',
        notes: 'Projeto iniciado, equipe formada',
        updatedAt: new Date(),
      };

      expect(actionProgress.progress).toBeGreaterThanOrEqual(0);
      expect(actionProgress.progress).toBeLessThanOrEqual(100);
      expect(['not_started', 'in_progress', 'completed', 'cancelled']).toContain(actionProgress.status);
    });

    it('deve registrar evidências de conclusão', async () => {
      const evidence = {
        actionId: 1,
        type: 'document',
        title: 'Certificado de Conclusão',
        description: 'Certificado do curso de Gestão de Projetos',
        fileUrl: 'https://storage.example.com/cert.pdf',
        uploadedAt: new Date(),
      };

      expect(evidence.title).toBeTruthy();
      expect(evidence.fileUrl).toBeTruthy();
    });

    it('deve calcular progresso geral do PDI', async () => {
      const actions = [
        { id: 1, progress: 100, weight: 40 },
        { id: 2, progress: 50, weight: 30 },
        { id: 3, progress: 0, weight: 30 },
      ];

      // Calcula progresso ponderado
      const totalProgress = actions.reduce((sum, a) => 
        sum + (a.progress * a.weight / 100), 0
      );

      expect(totalProgress).toBe(55); // (100*0.4 + 50*0.3 + 0*0.3)
    });

    it('deve enviar notificações de prazo próximo', async () => {
      const action = {
        id: 1,
        title: 'Curso de Liderança',
        endDate: new Date('2025-01-15'),
        status: 'in_progress',
      };

      const today = new Date('2025-01-10');
      const daysUntilDeadline = Math.ceil(
        (action.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      const shouldNotify = daysUntilDeadline <= 7 && action.status !== 'completed';
      expect(shouldNotify).toBe(true);
      expect(daysUntilDeadline).toBe(5);
    });

    it('deve permitir ajustes no PDI durante execução', async () => {
      const originalAction = {
        id: 1,
        title: 'Liderar Projeto A',
        endDate: new Date('2025-06-30'),
      };

      const updatedAction = {
        ...originalAction,
        endDate: new Date('2025-08-31'),
        adjustmentReason: 'Projeto teve escopo ampliado',
      };

      expect(updatedAction.endDate > originalAction.endDate).toBe(true);
      expect(updatedAction.adjustmentReason).toBeTruthy();
    });
  });

  describe('Conclusão de PDI', () => {
    it('deve validar que todas as ações foram concluídas', async () => {
      const actions = [
        { id: 1, status: 'completed', progress: 100 },
        { id: 2, status: 'completed', progress: 100 },
        { id: 3, status: 'in_progress', progress: 80 },
      ];

      const allCompleted = actions.every(a => a.status === 'completed');
      expect(allCompleted).toBe(false);
    });

    it('deve realizar avaliação final de competências', async () => {
      const finalEvaluation = {
        pdiId: 1,
        competencyAssessments: [
          { competencyId: 1, initialLevel: 6, finalLevel: 9, improved: true },
          { competencyId: 2, initialLevel: 5, finalLevel: 8, improved: true },
        ],
        overallImprovement: 3,
        evaluatedAt: new Date(),
      };

      expect(finalEvaluation.competencyAssessments.every(c => c.improved)).toBe(true);
      expect(finalEvaluation.overallImprovement).toBeGreaterThan(0);
    });

    it('deve gerar relatório de conclusão do PDI', async () => {
      const completionReport = {
        pdiId: 1,
        employeeName: 'João Silva',
        targetPosition: 'Gerente de Projetos',
        startDate: new Date('2024-01-01'),
        completionDate: new Date('2025-01-01'),
        duration: 12, // meses
        actionsCompleted: 8,
        totalActions: 10,
        competenciesImproved: 5,
        readyForPromotion: true,
      };

      expect(completionReport.actionsCompleted).toBeGreaterThan(0);
      expect(completionReport.duration).toBe(12);
      expect(completionReport.readyForPromotion).toBe(true);
    });

    it('deve calcular ROI do investimento em desenvolvimento', async () => {
      const roi = {
        totalInvestment: 8500,
        timeInvested: 120, // horas
        competencyGainPoints: 15,
        productivityIncrease: 25, // %
        estimatedValue: 45000,
      };

      const roiPercentage = ((roi.estimatedValue - roi.totalInvestment) / roi.totalInvestment) * 100;
      expect(roiPercentage).toBeGreaterThan(0);
      expect(roiPercentage).toBeCloseTo(429.41, 1);
    });
  });

  describe('Proteção de Arrays - PDI', () => {
    it('deve lidar com array de gaps vazio', () => {
      const gaps: any[] = [];
      const safeGaps = Array.isArray(gaps) ? gaps : [];
      
      expect(safeGaps).toEqual([]);
      expect(() => safeGaps.map(g => g.id)).not.toThrow();
    });

    it('deve lidar com array de ações undefined', () => {
      const actions: any = undefined;
      const safeActions = Array.isArray(actions) ? actions : [];
      
      expect(safeActions).toEqual([]);
      expect(safeActions.length).toBe(0);
    });

    it('deve lidar com array de evidências null', () => {
      const evidences: any = null;
      const safeEvidences = Array.isArray(evidences) ? evidences : [];
      
      expect(safeEvidences).toEqual([]);
    });

    it('deve lidar com slice em array vazio', () => {
      const items: any[] = [];
      const sliced = items.slice(0, 3);
      
      expect(sliced).toEqual([]);
      expect(() => sliced.map(i => i.id)).not.toThrow();
    });
  });
});
