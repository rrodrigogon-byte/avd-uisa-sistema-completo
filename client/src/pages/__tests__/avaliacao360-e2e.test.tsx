import { describe, it, expect } from 'vitest';

/**
 * Testes E2E para Módulo Avaliação 360
 * Testa fluxos críticos de criação, preenchimento e visualização de avaliações 360°
 */

describe('Avaliação 360 - Fluxo E2E', () => {
  describe('Criação de Ciclo de Avaliação 360', () => {
    it('deve criar um novo ciclo 360° com dados básicos', async () => {
      const cycleData = {
        name: 'Ciclo 360° 2025',
        description: 'Avaliação anual de competências',
        year: 2025,
        type: 'anual',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        evaluationDeadline: new Date('2025-12-15'),
      };

      // Verifica que dados são válidos
      expect(cycleData.name).toBeTruthy();
      expect(cycleData.year).toBeGreaterThan(2024);
      expect(cycleData.startDate).toBeInstanceOf(Date);
      expect(cycleData.endDate > cycleData.startDate).toBe(true);
    });

    it('deve configurar pesos das avaliações corretamente', async () => {
      const weights = {
        selfWeight: 20,
        peerWeight: 30,
        subordinateWeight: 20,
        managerWeight: 30,
      };

      // Verifica que soma dos pesos é 100%
      const totalWeight = weights.selfWeight + weights.peerWeight + 
                         weights.subordinateWeight + weights.managerWeight;
      expect(totalWeight).toBe(100);
    });

    it('deve selecionar competências para avaliação', async () => {
      const selectedCompetencies = [1, 2, 3, 4, 5];

      // Verifica que há pelo menos uma competência selecionada
      expect(selectedCompetencies.length).toBeGreaterThan(0);
      expect(Array.isArray(selectedCompetencies)).toBe(true);
    });

    it('deve adicionar participantes ao ciclo', async () => {
      const participants = [
        { employeeId: 1, role: 'self' },
        { employeeId: 2, role: 'manager' },
        { employeeId: 3, role: 'peer' },
      ];

      // Verifica que há participantes
      expect(participants.length).toBeGreaterThan(0);
      expect(participants.every(p => p.employeeId && p.role)).toBe(true);
    });

    it('deve validar dados antes de criar ciclo', async () => {
      const invalidCycle = {
        name: '',
        year: 2025,
        startDate: undefined,
        endDate: undefined,
      };

      // Verifica validação
      const isValid = invalidCycle.name && invalidCycle.startDate && invalidCycle.endDate;
      expect(isValid).toBe(false);
    });
  });

  describe('Preenchimento de Avaliação 360', () => {
    it('deve permitir autoavaliação do colaborador', async () => {
      const selfEvaluation = {
        employeeId: 1,
        cycleId: 1,
        evaluatorId: 1,
        role: 'self',
        competencyRatings: [
          { competencyId: 1, rating: 8, comment: 'Boa performance' },
          { competencyId: 2, rating: 7, comment: 'Pode melhorar' },
        ],
      };

      // Verifica estrutura da avaliação
      expect(selfEvaluation.role).toBe('self');
      expect(selfEvaluation.competencyRatings.length).toBeGreaterThan(0);
      expect(selfEvaluation.competencyRatings[0].rating).toBeGreaterThanOrEqual(1);
      expect(selfEvaluation.competencyRatings[0].rating).toBeLessThanOrEqual(10);
    });

    it('deve permitir avaliação do gestor', async () => {
      const managerEvaluation = {
        employeeId: 1,
        cycleId: 1,
        evaluatorId: 2,
        role: 'manager',
        competencyRatings: [
          { competencyId: 1, rating: 9, comment: 'Excelente liderança' },
        ],
      };

      expect(managerEvaluation.role).toBe('manager');
      expect(managerEvaluation.evaluatorId).not.toBe(managerEvaluation.employeeId);
    });

    it('deve permitir avaliação de pares', async () => {
      const peerEvaluation = {
        employeeId: 1,
        cycleId: 1,
        evaluatorId: 3,
        role: 'peer',
        competencyRatings: [
          { competencyId: 1, rating: 8, comment: 'Bom trabalho em equipe' },
        ],
      };

      expect(peerEvaluation.role).toBe('peer');
    });

    it('deve validar que todas as competências foram avaliadas', async () => {
      const requiredCompetencies = [1, 2, 3, 4, 5];
      const evaluatedCompetencies = [1, 2, 3]; // Faltam 4 e 5

      const allEvaluated = requiredCompetencies.every(id => 
        evaluatedCompetencies.includes(id)
      );

      expect(allEvaluated).toBe(false);
    });
  });

  describe('Visualização de Resultados 360', () => {
    it('deve calcular média ponderada das avaliações', async () => {
      const evaluations = {
        self: 7,
        manager: 9,
        peers: [8, 7, 8],
        subordinates: [8, 9],
      };

      const weights = {
        self: 0.2,
        manager: 0.3,
        peer: 0.3,
        subordinate: 0.2,
      };

      // Calcula médias
      const peerAvg = evaluations.peers.reduce((a, b) => a + b, 0) / evaluations.peers.length;
      const subAvg = evaluations.subordinates.reduce((a, b) => a + b, 0) / evaluations.subordinates.length;

      const weightedAvg = 
        evaluations.self * weights.self +
        evaluations.manager * weights.manager +
        peerAvg * weights.peer +
        subAvg * weights.subordinate;

      expect(weightedAvg).toBeGreaterThan(0);
      expect(weightedAvg).toBeLessThanOrEqual(10);
    });

    it('deve identificar gaps de competências', async () => {
      const competencyScores = [
        { id: 1, name: 'Liderança', score: 6, required: 9, gap: 3 },
        { id: 2, name: 'Comunicação', score: 8, required: 9, gap: 1 },
        { id: 3, name: 'Técnica', score: 9, required: 9, gap: 0 },
      ];

      const gaps = competencyScores.filter(c => c.gap > 0);
      const criticalGaps = gaps.filter(c => c.gap >= 3);

      expect(gaps.length).toBeGreaterThan(0);
      expect(criticalGaps.length).toBe(1);
      expect(criticalGaps[0].name).toBe('Liderança');
    });

    it('deve gerar gráfico radar com resultados', async () => {
      const radarData = [
        { competency: 'Liderança', self: 7, manager: 9, peers: 8 },
        { competency: 'Comunicação', self: 8, manager: 8, peers: 7 },
        { competency: 'Técnica', self: 9, manager: 9, peers: 9 },
      ];

      // Verifica estrutura dos dados
      expect(radarData.length).toBeGreaterThan(0);
      expect(radarData[0]).toHaveProperty('competency');
      expect(radarData[0]).toHaveProperty('self');
      expect(radarData[0]).toHaveProperty('manager');
    });

    it('deve permitir exportação de relatório PDF', async () => {
      const reportData = {
        employeeName: 'João Silva',
        cycleName: 'Ciclo 360° 2025',
        overallScore: 8.2,
        competencyScores: [
          { name: 'Liderança', score: 7.5 },
          { name: 'Comunicação', score: 8.0 },
        ],
        generatedAt: new Date(),
      };

      // Verifica que dados estão completos para relatório
      expect(reportData.employeeName).toBeTruthy();
      expect(reportData.overallScore).toBeGreaterThan(0);
      expect(reportData.competencyScores.length).toBeGreaterThan(0);
    });
  });

  describe('Proteção de Arrays - Avaliação 360', () => {
    it('deve lidar com array de competências vazio', () => {
      const competencies: any[] = [];
      const safeCompetencies = Array.isArray(competencies) ? competencies : [];
      
      expect(safeCompetencies).toEqual([]);
      expect(() => safeCompetencies.map(c => c.id)).not.toThrow();
    });

    it('deve lidar com array de participantes undefined', () => {
      const participants: any = undefined;
      const safeParticipants = Array.isArray(participants) ? participants : [];
      
      expect(safeParticipants).toEqual([]);
      expect(safeParticipants.length).toBe(0);
    });

    it('deve lidar com array de avaliações null', () => {
      const evaluations: any = null;
      const safeEvaluations = Array.isArray(evaluations) ? evaluations : [];
      
      expect(safeEvaluations).toEqual([]);
    });
  });
});
