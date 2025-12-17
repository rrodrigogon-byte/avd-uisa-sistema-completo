import { describe, it, expect } from 'vitest';
import { safeMap, safeFilter, safeFind, isEmpty, ensureArray } from '../../client/src/lib/arrayHelpers';

/**
 * Teste E2E para validar proteção de arrays no fluxo PIR Integridade
 * 
 * Este teste valida que as funções de proteção funcionam corretamente
 * em cenários reais do sistema, incluindo:
 * - Dados vazios
 * - Dados undefined/null
 * - Arrays populados
 * - Casos extremos
 */

describe('PIR Integridade - Proteção de Arrays E2E', () => {
  describe('Cenário 1: Lista vazia de funcionários', () => {
    it('safeMap deve retornar array vazio para lista vazia', () => {
      const employees: any[] = [];
      const result = safeMap(employees, (e) => e.name);
      
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('isEmpty deve retornar true para lista vazia', () => {
      const employees: any[] = [];
      
      expect(isEmpty(employees)).toBe(true);
    });

    it('safeFilter não deve quebrar com lista vazia', () => {
      const employees: any[] = [];
      const result = safeFilter(employees, (e) => e.status === 'active');
      
      expect(result).toEqual([]);
    });
  });

  describe('Cenário 2: Dados undefined/null', () => {
    it('safeMap deve retornar array vazio para undefined', () => {
      const employees: any = undefined;
      const result = safeMap(employees, (e) => e.name);
      
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('safeMap deve retornar array vazio para null', () => {
      const employees: any = null;
      const result = safeMap(employees, (e) => e.name);
      
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('isEmpty deve retornar true para undefined', () => {
      const employees: any = undefined;
      
      expect(isEmpty(employees)).toBe(true);
    });

    it('isEmpty deve retornar true para null', () => {
      const employees: any = null;
      
      expect(isEmpty(employees)).toBe(true);
    });

    it('ensureArray deve converter undefined em array vazio', () => {
      const employees: any = undefined;
      const result = ensureArray(employees);
      
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('ensureArray deve converter null em array vazio', () => {
      const employees: any = null;
      const result = ensureArray(employees);
      
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Cenário 3: Lista populada de funcionários', () => {
    const mockEmployees = [
      { id: 1, name: 'João Silva', status: 'active' },
      { id: 2, name: 'Maria Santos', status: 'active' },
      { id: 3, name: 'Pedro Costa', status: 'inactive' },
    ];

    it('safeMap deve mapear corretamente lista populada', () => {
      const result = safeMap(mockEmployees, (e) => e.name);
      
      expect(result).toEqual(['João Silva', 'Maria Santos', 'Pedro Costa']);
    });

    it('safeFilter deve filtrar corretamente lista populada', () => {
      const result = safeFilter(mockEmployees, (e) => e.status === 'active');
      
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('João Silva');
      expect(result[1].name).toBe('Maria Santos');
    });

    it('safeFind deve encontrar item corretamente', () => {
      const result = safeFind(mockEmployees, (e) => e.id === 2);
      
      expect(result).toBeDefined();
      expect(result?.name).toBe('Maria Santos');
    });

    it('safeFind deve retornar undefined quando não encontra', () => {
      const result = safeFind(mockEmployees, (e) => e.id === 999);
      
      expect(result).toBeUndefined();
    });

    it('isEmpty deve retornar false para lista populada', () => {
      expect(isEmpty(mockEmployees)).toBe(false);
    });
  });

  describe('Cenário 4: Dados malformados (casos extremos)', () => {
    it('safeMap deve lidar com objetos sem propriedades esperadas', () => {
      const malformedData = [
        { id: 1 }, // Sem name
        { name: 'Maria' }, // Sem id
        {}, // Vazio
      ];

      const result = safeMap(malformedData, (e) => e.name || 'Unknown');
      
      expect(result).toEqual(['Unknown', 'Maria', 'Unknown']);
    });

    it('safeMap deve lidar com valores null dentro do array', () => {
      const dataWithNulls = [
        { id: 1, name: 'João' },
        null,
        { id: 2, name: 'Maria' },
        undefined,
      ];

      // safeMap deve pular valores null/undefined
      const result = safeMap(dataWithNulls, (e) => e?.name);
      
      expect(result).toHaveLength(4);
    });

    it('safeFilter deve lidar com predicados que retornam undefined', () => {
      const employees = [
        { id: 1, name: 'João' },
        { id: 2, name: 'Maria' },
      ];

      const result = safeFilter(employees, (e) => {
        // Predicado que pode retornar undefined
        return e.id > 1 ? true : undefined as any;
      });
      
      // Deve filtrar apenas os que retornam true
      expect(result).toHaveLength(1);
    });
  });

  describe('Cenário 5: Arrays muito grandes (performance)', () => {
    it('safeMap deve lidar com 1000 itens sem problemas', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `Employee ${i + 1}`,
      }));

      const result = safeMap(largeArray, (e) => e.name);
      
      expect(result).toHaveLength(1000);
      expect(result[0]).toBe('Employee 1');
      expect(result[999]).toBe('Employee 1000');
    });

    it('safeFilter deve lidar com 1000 itens sem problemas', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        status: i % 2 === 0 ? 'active' : 'inactive',
      }));

      const result = safeFilter(largeArray, (e) => e.status === 'active');
      
      expect(result).toHaveLength(500);
    });
  });

  describe('Cenário 6: Simulação de resposta tRPC', () => {
    it('deve lidar com estrutura de resposta tRPC vazia', () => {
      // Simula resposta vazia do tRPC
      const response = {
        data: {
          assessments: [],
          total: 0,
        },
      };

      const assessments = response.data?.assessments;
      const result = safeMap(assessments, (a) => a.id);
      
      expect(result).toEqual([]);
      expect(isEmpty(assessments)).toBe(true);
    });

    it('deve lidar com estrutura de resposta tRPC undefined', () => {
      // Simula resposta undefined do tRPC (loading ou erro)
      const response = {
        data: undefined,
      };

      const assessments = response.data?.assessments;
      const result = safeMap(assessments, (a) => a.id);
      
      expect(result).toEqual([]);
      expect(isEmpty(assessments)).toBe(true);
    });

    it('deve lidar com estrutura de resposta tRPC populada', () => {
      // Simula resposta populada do tRPC
      const response = {
        data: {
          assessments: [
            { id: 1, employee: { name: 'João' }, status: 'completed' },
            { id: 2, employee: { name: 'Maria' }, status: 'in_progress' },
          ],
          total: 2,
        },
      };

      const assessments = response.data?.assessments;
      const result = safeMap(assessments, (a) => a.employee?.name);
      
      expect(result).toEqual(['João', 'Maria']);
      expect(isEmpty(assessments)).toBe(false);
    });

    it('deve lidar com employee null dentro de assessment', () => {
      // Simula assessment com employee null
      const response = {
        data: {
          assessments: [
            { id: 1, employee: null, status: 'draft' },
            { id: 2, employee: { name: 'Maria' }, status: 'completed' },
          ],
          total: 2,
        },
      };

      const assessments = response.data?.assessments;
      const result = safeMap(assessments, (a) => a.employee?.name || 'Colaborador');
      
      expect(result).toEqual(['Colaborador', 'Maria']);
    });
  });

  describe('Cenário 7: Fluxo completo de criação de convite', () => {
    it('deve simular fluxo completo sem quebrar', () => {
      // 1. Buscar lista de funcionários (pode vir vazia)
      const employeesResponse = {
        data: undefined, // Simula loading inicial
      };
      
      let employees = employeesResponse.data;
      expect(isEmpty(employees)).toBe(true);
      
      // 2. Após carregamento, lista vem vazia
      employees = [];
      expect(isEmpty(employees)).toBe(true);
      
      // 3. Usuário adiciona funcionários
      employees = [
        { id: 1, name: 'João Silva' },
        { id: 2, name: 'Maria Santos' },
      ];
      expect(isEmpty(employees)).toBe(false);
      
      // 4. Mapear funcionários para criar convites
      const invites = safeMap(employees, (e) => ({
        employeeId: e.id,
        employeeName: e.name,
        status: 'pending',
      }));
      
      expect(invites).toHaveLength(2);
      expect(invites[0].employeeName).toBe('João Silva');
      
      // 5. Filtrar apenas convites pendentes
      const pendingInvites = safeFilter(invites, (i) => i.status === 'pending');
      
      expect(pendingInvites).toHaveLength(2);
      
      // 6. Buscar convite específico
      const specificInvite = safeFind(invites, (i) => i.employeeId === 2);
      
      expect(specificInvite).toBeDefined();
      expect(specificInvite?.employeeName).toBe('Maria Santos');
    });
  });
});
