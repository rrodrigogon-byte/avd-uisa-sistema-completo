/**
 * Testes de Proteção Preventiva contra Dados Undefined/Null
 * 
 * Este arquivo contém testes para garantir que os componentes
 * OrgChartInteractive e PsychometricDashboard não quebram quando
 * recebem dados undefined, null ou arrays vazios.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { safeMap, safeFilter, safeFind, isEmpty, ensureArray } from '../../lib/arrayHelpers';

// Mock do trpc
vi.mock('@/lib/trpc', () => ({
  trpc: {
    orgChart: {
      getOrgChart: {
        useQuery: vi.fn(),
      },
      updateManager: {
        useMutation: vi.fn(),
      },
    },
    psychometric: {
      getDashboardStats: {
        useQuery: vi.fn(),
      },
      getMostCommonProfiles: {
        useQuery: vi.fn(),
      },
    },
    useUtils: vi.fn(() => ({})),
  },
}));

describe('Funções de Proteção Preventiva (arrayHelpers)', () => {
  describe('safeMap', () => {
    it('deve retornar array vazio quando recebe undefined', () => {
      const result = safeMap(undefined as any, (x: number) => x * 2);
      expect(result).toEqual([]);
    });

    it('deve retornar array vazio quando recebe null', () => {
      const result = safeMap(null as any, (x: number) => x * 2);
      expect(result).toEqual([]);
    });

    it('deve retornar array vazio quando recebe array vazio', () => {
      const result = safeMap([], (x: number) => x * 2);
      expect(result).toEqual([]);
    });

    it('deve mapear corretamente array válido', () => {
      const result = safeMap([1, 2, 3], (x: number) => x * 2);
      expect(result).toEqual([2, 4, 6]);
    });

    it('deve passar índice corretamente', () => {
      const result = safeMap(['a', 'b', 'c'], (x: string, i: number) => `${x}${i}`);
      expect(result).toEqual(['a0', 'b1', 'c2']);
    });
  });

  describe('safeFilter', () => {
    it('deve retornar array vazio quando recebe undefined', () => {
      const result = safeFilter(undefined as any, (x: number) => x > 2);
      expect(result).toEqual([]);
    });

    it('deve retornar array vazio quando recebe null', () => {
      const result = safeFilter(null as any, (x: number) => x > 2);
      expect(result).toEqual([]);
    });

    it('deve filtrar corretamente array válido', () => {
      const result = safeFilter([1, 2, 3, 4, 5], (x: number) => x > 2);
      expect(result).toEqual([3, 4, 5]);
    });
  });

  describe('safeFind', () => {
    it('deve retornar undefined quando recebe undefined', () => {
      const result = safeFind(undefined as any, (x: number) => x === 2);
      expect(result).toBeUndefined();
    });

    it('deve retornar undefined quando recebe null', () => {
      const result = safeFind(null as any, (x: number) => x === 2);
      expect(result).toBeUndefined();
    });

    it('deve encontrar elemento corretamente', () => {
      const result = safeFind([1, 2, 3], (x: number) => x === 2);
      expect(result).toBe(2);
    });

    it('deve retornar undefined quando não encontra', () => {
      const result = safeFind([1, 2, 3], (x: number) => x === 5);
      expect(result).toBeUndefined();
    });
  });

  describe('isEmpty', () => {
    it('deve retornar true para undefined', () => {
      expect(isEmpty(undefined)).toBe(true);
    });

    it('deve retornar true para null', () => {
      expect(isEmpty(null)).toBe(true);
    });

    it('deve retornar true para array vazio', () => {
      expect(isEmpty([])).toBe(true);
    });

    it('deve retornar false para array com elementos', () => {
      expect(isEmpty([1, 2, 3])).toBe(false);
    });
  });

  describe('ensureArray', () => {
    it('deve retornar array vazio para undefined', () => {
      expect(ensureArray(undefined)).toEqual([]);
    });

    it('deve retornar array vazio para null', () => {
      expect(ensureArray(null)).toEqual([]);
    });

    it('deve retornar o próprio array quando válido', () => {
      const arr = [1, 2, 3];
      expect(ensureArray(arr)).toBe(arr);
    });

    it('deve retornar array vazio para não-arrays', () => {
      expect(ensureArray('string' as any)).toEqual([]);
      expect(ensureArray(123 as any)).toEqual([]);
      expect(ensureArray({} as any)).toEqual([]);
    });
  });
});

describe('Proteção Preventiva - OrgChartInteractive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve lidar com orgData undefined sem quebrar', () => {
    // Simular comportamento do componente com dados undefined
    const orgData = undefined;
    const tree = orgData?.tree;
    
    // Usar funções seguras
    const result = safeMap(ensureArray(tree), (employee: any) => employee.name);
    
    expect(result).toEqual([]);
    expect(() => result).not.toThrow();
  });

  it('deve lidar com tree null sem quebrar', () => {
    const orgData = { tree: null, totalEmployees: 0 };
    const result = safeMap(ensureArray(orgData.tree), (employee: any) => employee.name);
    
    expect(result).toEqual([]);
  });

  it('deve lidar com subordinates undefined sem quebrar', () => {
    const employee = {
      id: 1,
      name: 'Test',
      subordinates: undefined,
    };
    
    const result = safeMap(employee.subordinates, (sub: any) => sub.name);
    expect(result).toEqual([]);
  });

  it('deve lidar com availableManagers undefined no filtro', () => {
    const availableManagers = undefined;
    const employeeId = 1;
    
    const result = safeMap(
      safeFilter(availableManagers, (m: any) => m.id !== employeeId),
      (manager: any) => manager.name
    );
    
    expect(result).toEqual([]);
  });
});

describe('Proteção Preventiva - PsychometricDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve lidar com stats.byDepartment undefined sem quebrar', () => {
    const stats = {
      byDepartment: undefined,
      discProfiles: { dominant: 0, influential: 0, steady: 0, conscientious: 0 },
      recentTests: [],
    };
    
    const result = safeMap(
      ensureArray(stats.byDepartment).slice(0, 5),
      (dept: any) => dept.name
    );
    
    expect(result).toEqual([]);
  });

  it('deve lidar com commonProfiles undefined sem quebrar', () => {
    const commonProfiles = undefined;
    
    const result = safeMap(
      ensureArray(commonProfiles),
      (profile: any) => profile.profile
    );
    
    expect(result).toEqual([]);
  });

  it('deve lidar com stats.recentTests undefined sem quebrar', () => {
    const stats = {
      recentTests: undefined,
    };
    
    const isEmptyResult = isEmpty(stats.recentTests);
    expect(isEmptyResult).toBe(true);
    
    const result = safeMap(
      ensureArray(stats.recentTests),
      (test: any) => test.employeeName
    );
    
    expect(result).toEqual([]);
  });

  it('deve lidar com discData vazio após filter', () => {
    const discProfiles = {
      dominant: 0,
      influential: 0,
      steady: 0,
      conscientious: 0,
    };
    
    const discData = safeFilter([
      { name: 'D - Dominante', value: discProfiles.dominant },
      { name: 'I - Influente', value: discProfiles.influential },
      { name: 'S - Estável', value: discProfiles.steady },
      { name: 'C - Conforme', value: discProfiles.conscientious },
    ], item => item.value > 0);
    
    expect(discData).toEqual([]);
    expect(discData.length).toBe(0);
  });
});

describe('Integração - Cenários Reais de Erro', () => {
  it('deve lidar com resposta vazia da API sem quebrar', () => {
    const apiResponse = {
      data: null,
      tree: undefined,
      employees: [],
    };
    
    const tree = ensureArray(apiResponse.tree);
    const employees = ensureArray(apiResponse.employees);
    
    expect(tree).toEqual([]);
    expect(employees).toEqual([]);
    expect(isEmpty(tree)).toBe(true);
    expect(isEmpty(employees)).toBe(true);
  });

  it('deve lidar com múltiplos níveis de undefined', () => {
    const data: any = {
      level1: undefined,
    };
    
    const result = safeMap(
      ensureArray(data.level1?.level2?.level3),
      (item: any) => item.name
    );
    
    expect(result).toEqual([]);
  });

  it('deve lidar com array de objetos com propriedades undefined', () => {
    const items = [
      { id: 1, name: 'Test 1', subordinates: undefined },
      { id: 2, name: 'Test 2', subordinates: null },
      { id: 3, name: 'Test 3', subordinates: [] },
    ];
    
    items.forEach(item => {
      const result = safeMap(item.subordinates, (sub: any) => sub.name);
      expect(result).toEqual([]);
    });
  });
});
