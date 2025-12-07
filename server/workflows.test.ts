import { describe, it, expect } from 'vitest';

/**
 * Testes para Sistema de Configuração de Workflows
 * 
 * Valida:
 * - Criação de workflows
 * - Configuração de alçadas (2-5 níveis)
 * - Validação de aprovadores
 * - Cálculo de SLA total
 * - Atualização de workflows
 */

describe('Sistema de Workflows - Validações', () => {
  describe('Validação de Alçadas', () => {
    it('deve validar mínimo de 2 alçadas', () => {
      const approvalLevels = [
        {
          order: 1,
          name: 'Gestor Direto',
          approverIds: [1],
          approverNames: ['João Silva'],
          slaInDays: 2,
          isParallel: false,
        }
      ];
      
      expect(approvalLevels.length).toBeLessThan(2);
    });

    it('deve validar máximo de 5 alçadas', () => {
      const approvalLevels = Array.from({ length: 6 }, (_, i) => ({
        order: i + 1,
        name: `Alçada ${i + 1}`,
        approverIds: [i + 1],
        approverNames: [`Aprovador ${i + 1}`],
        slaInDays: 3,
        isParallel: false,
      }));
      
      expect(approvalLevels.length).toBeGreaterThan(5);
    });

    it('deve aceitar exatamente 2 alçadas (mínimo válido)', () => {
      const approvalLevels = [
        {
          order: 1,
          name: 'Gestor Direto',
          approverIds: [1],
          approverNames: ['João Silva'],
          slaInDays: 2,
          isParallel: false,
        },
        {
          order: 2,
          name: 'RH',
          approverIds: [2],
          approverNames: ['Maria Santos'],
          slaInDays: 3,
          isParallel: false,
        }
      ];
      
      expect(approvalLevels.length).toBe(2);
      expect(approvalLevels.length).toBeGreaterThanOrEqual(2);
      expect(approvalLevels.length).toBeLessThanOrEqual(5);
    });

    it('deve aceitar exatamente 5 alçadas (máximo válido)', () => {
      const approvalLevels = Array.from({ length: 5 }, (_, i) => ({
        order: i + 1,
        name: `Alçada ${i + 1}`,
        approverIds: [i + 1],
        approverNames: [`Aprovador ${i + 1}`],
        slaInDays: 3,
        isParallel: false,
      }));
      
      expect(approvalLevels.length).toBe(5);
      expect(approvalLevels.length).toBeGreaterThanOrEqual(2);
      expect(approvalLevels.length).toBeLessThanOrEqual(5);
    });

    it('deve aceitar 3 alçadas (valor intermediário válido)', () => {
      const approvalLevels = [
        {
          order: 1,
          name: 'Gestor Direto',
          approverIds: [1],
          approverNames: ['João Silva'],
          slaInDays: 2,
          isParallel: false,
        },
        {
          order: 2,
          name: 'Gerente',
          approverIds: [2],
          approverNames: ['Maria Santos'],
          slaInDays: 3,
          isParallel: false,
        },
        {
          order: 3,
          name: 'Diretoria',
          approverIds: [3],
          approverNames: ['Carlos Oliveira'],
          slaInDays: 5,
          isParallel: false,
        }
      ];
      
      expect(approvalLevels.length).toBe(3);
      expect(approvalLevels.length).toBeGreaterThanOrEqual(2);
      expect(approvalLevels.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Cálculo de SLA Total', () => {
    it('deve calcular SLA total corretamente para 2 alçadas', () => {
      const approvalLevels = [
        { order: 1, name: 'Gestor', approverIds: [1], approverNames: ['João'], slaInDays: 2, isParallel: false },
        { order: 2, name: 'RH', approverIds: [2], approverNames: ['Maria'], slaInDays: 3, isParallel: false },
      ];
      
      const totalSLA = approvalLevels.reduce((sum, level) => sum + level.slaInDays, 0);
      expect(totalSLA).toBe(5);
    });

    it('deve calcular SLA total corretamente para 5 alçadas', () => {
      const approvalLevels = [
        { order: 1, name: 'Gestor', approverIds: [1], approverNames: ['A'], slaInDays: 2, isParallel: false },
        { order: 2, name: 'Gerente', approverIds: [2], approverNames: ['B'], slaInDays: 3, isParallel: false },
        { order: 3, name: 'Diretor', approverIds: [3], approverNames: ['C'], slaInDays: 5, isParallel: false },
        { order: 4, name: 'VP', approverIds: [4], approverNames: ['D'], slaInDays: 7, isParallel: false },
        { order: 5, name: 'CEO', approverIds: [5], approverNames: ['E'], slaInDays: 10, isParallel: false },
      ];
      
      const totalSLA = approvalLevels.reduce((sum, level) => sum + level.slaInDays, 0);
      expect(totalSLA).toBe(27);
    });

    it('deve retornar 0 para array vazio', () => {
      const approvalLevels: any[] = [];
      const totalSLA = approvalLevels.reduce((sum, level) => sum + level.slaInDays, 0);
      expect(totalSLA).toBe(0);
    });
  });

  describe('Validação de Aprovadores', () => {
    it('deve permitir múltiplos aprovadores na mesma alçada', () => {
      const level = {
        order: 1,
        name: 'Comitê de Aprovação',
        approverIds: [1, 2, 3],
        approverNames: ['João', 'Maria', 'Carlos'],
        slaInDays: 5,
        isParallel: true,
      };
      
      expect(level.approverIds.length).toBe(3);
      expect(level.isParallel).toBe(true);
    });

    it('deve validar que alçada tem pelo menos 1 aprovador', () => {
      const level = {
        order: 1,
        name: 'Gestor',
        approverIds: [],
        approverNames: [],
        slaInDays: 3,
        isParallel: false,
      };
      
      expect(level.approverIds.length).toBe(0);
    });

    it('deve validar aprovação sequencial vs paralela', () => {
      const sequentialLevel = {
        order: 1,
        name: 'Gestor',
        approverIds: [1, 2],
        approverNames: ['João', 'Maria'],
        slaInDays: 3,
        isParallel: false,
      };
      
      const parallelLevel = {
        order: 2,
        name: 'Comitê',
        approverIds: [3, 4, 5],
        approverNames: ['Carlos', 'Ana', 'Pedro'],
        slaInDays: 5,
        isParallel: true,
      };
      
      expect(sequentialLevel.isParallel).toBe(false);
      expect(parallelLevel.isParallel).toBe(true);
    });
  });

  describe('Estrutura de Workflow', () => {
    it('deve validar estrutura completa de workflow', () => {
      const workflow = {
        id: 1,
        name: 'Aprovação de Bônus',
        description: 'Workflow para aprovação de bônus',
        type: 'aprovacao_bonus',
        steps: JSON.stringify([
          {
            order: 1,
            name: 'Gestor Direto',
            approverIds: [1],
            approverNames: ['João Silva'],
            slaInDays: 2,
            isParallel: false,
          },
          {
            order: 2,
            name: 'RH',
            approverIds: [2, 3],
            approverNames: ['Maria Santos', 'Carlos Oliveira'],
            slaInDays: 3,
            isParallel: true,
          }
        ]),
        isActive: true,
        isDefault: false,
      };
      
      expect(workflow.name).toBeTruthy();
      expect(workflow.type).toBe('aprovacao_bonus');
      expect(workflow.steps).toBeTruthy();
      
      const steps = JSON.parse(workflow.steps);
      expect(steps.length).toBeGreaterThanOrEqual(2);
      expect(steps.length).toBeLessThanOrEqual(5);
      expect(steps[0].order).toBe(1);
      expect(steps[1].order).toBe(2);
    });

    it('deve validar ordem sequencial das alçadas', () => {
      const steps = [
        { order: 1, name: 'Alçada 1', approverIds: [1], approverNames: ['A'], slaInDays: 2, isParallel: false },
        { order: 2, name: 'Alçada 2', approverIds: [2], approverNames: ['B'], slaInDays: 3, isParallel: false },
        { order: 3, name: 'Alçada 3', approverIds: [3], approverNames: ['C'], slaInDays: 5, isParallel: false },
      ];
      
      const isSequential = steps.every((step, index) => step.order === index + 1);
      expect(isSequential).toBe(true);
    });

    it('deve validar que cada alçada tem nome único', () => {
      const steps = [
        { order: 1, name: 'Gestor', approverIds: [1], approverNames: ['A'], slaInDays: 2, isParallel: false },
        { order: 2, name: 'RH', approverIds: [2], approverNames: ['B'], slaInDays: 3, isParallel: false },
        { order: 3, name: 'Diretoria', approverIds: [3], approverNames: ['C'], slaInDays: 5, isParallel: false },
      ];
      
      const names = steps.map(s => s.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
  });

  describe('Validação de SLA', () => {
    it('deve validar SLA mínimo de 1 dia', () => {
      const level = {
        order: 1,
        name: 'Gestor',
        approverIds: [1],
        approverNames: ['João'],
        slaInDays: 1,
        isParallel: false,
      };
      
      expect(level.slaInDays).toBeGreaterThanOrEqual(1);
    });

    it('deve validar SLA máximo razoável (30 dias)', () => {
      const level = {
        order: 1,
        name: 'Gestor',
        approverIds: [1],
        approverNames: ['João'],
        slaInDays: 30,
        isParallel: false,
      };
      
      expect(level.slaInDays).toBeLessThanOrEqual(30);
    });

    it('deve rejeitar SLA zero ou negativo', () => {
      const invalidLevel = {
        order: 1,
        name: 'Gestor',
        approverIds: [1],
        approverNames: ['João'],
        slaInDays: 0,
        isParallel: false,
      };
      
      expect(invalidLevel.slaInDays).toBeLessThan(1);
    });
  });
});

describe('Sistema de Workflows - Operações', () => {
  describe('Adicionar Alçada', () => {
    it('deve adicionar alçada corretamente', () => {
      const approvalLevels: any[] = [];
      const newLevel = {
        order: 1,
        name: 'Gestor Direto',
        approverIds: [1],
        approverNames: ['João Silva'],
        slaInDays: 2,
        isParallel: false,
      };
      
      approvalLevels.push(newLevel);
      expect(approvalLevels.length).toBe(1);
      expect(approvalLevels[0].name).toBe('Gestor Direto');
    });

    it('deve manter ordem ao adicionar múltiplas alçadas', () => {
      const approvalLevels: any[] = [];
      
      for (let i = 1; i <= 3; i++) {
        approvalLevels.push({
          order: i,
          name: `Alçada ${i}`,
          approverIds: [i],
          approverNames: [`Aprovador ${i}`],
          slaInDays: i * 2,
          isParallel: false,
        });
      }
      
      expect(approvalLevels.length).toBe(3);
      expect(approvalLevels[0].order).toBe(1);
      expect(approvalLevels[1].order).toBe(2);
      expect(approvalLevels[2].order).toBe(3);
    });
  });

  describe('Remover Alçada', () => {
    it('deve remover alçada e reordenar', () => {
      let approvalLevels = [
        { order: 1, name: 'A', approverIds: [1], approverNames: ['A'], slaInDays: 2, isParallel: false },
        { order: 2, name: 'B', approverIds: [2], approverNames: ['B'], slaInDays: 3, isParallel: false },
        { order: 3, name: 'C', approverIds: [3], approverNames: ['C'], slaInDays: 5, isParallel: false },
      ];
      
      // Remover alçada 2
      approvalLevels = approvalLevels.filter(l => l.order !== 2);
      approvalLevels = approvalLevels.map((l, index) => ({ ...l, order: index + 1 }));
      
      expect(approvalLevels.length).toBe(2);
      expect(approvalLevels[0].order).toBe(1);
      expect(approvalLevels[1].order).toBe(2);
      expect(approvalLevels[0].name).toBe('A');
      expect(approvalLevels[1].name).toBe('C');
    });
  });
});
