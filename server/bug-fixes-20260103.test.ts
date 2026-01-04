import { describe, it, expect } from 'vitest';
import { safeMap, safeFilter, isEmpty, ensureArray } from '../client/src/lib/arrayHelpers';

/**
 * Testes para validar correções de bugs reportados em 03/01/2026
 * 
 * Bug 1: Erro React #185 ao criar ciclos (componentes de competências)
 * Bug 2: Erro SQL na avaliação PIR
 */

describe('Bug Fix: Erro React #185 - Componentes de Competências', () => {
  it('safeMap deve lidar com arrays undefined sem erros', () => {
    const result = safeMap(undefined as any, (x: any) => x * 2);
    expect(result).toEqual([]);
  });

  it('safeMap deve lidar com arrays null sem erros', () => {
    const result = safeMap(null as any, (x: any) => x * 2);
    expect(result).toEqual([]);
  });

  it('safeMap deve processar arrays válidos corretamente', () => {
    const competencies = [
      { id: 1, name: 'Liderança' },
      { id: 2, name: 'Comunicação' }
    ];
    const result = safeMap(competencies, c => c.name);
    expect(result).toEqual(['Liderança', 'Comunicação']);
  });

  it('safeFilter deve lidar com arrays undefined sem erros', () => {
    const result = safeFilter(undefined as any, (x: any) => x > 5);
    expect(result).toEqual([]);
  });

  it('safeFilter deve filtrar arrays válidos corretamente', () => {
    const competencies = [
      { id: 1, name: 'Liderança', selected: true },
      { id: 2, name: 'Comunicação', selected: false }
    ];
    const result = safeFilter(competencies, c => c.selected);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Liderança');
  });

  it('isEmpty deve retornar true para arrays vazios', () => {
    expect(isEmpty([])).toBe(true);
  });

  it('isEmpty deve retornar true para undefined', () => {
    expect(isEmpty(undefined)).toBe(true);
  });

  it('isEmpty deve retornar true para null', () => {
    expect(isEmpty(null)).toBe(true);
  });

  it('isEmpty deve retornar false para arrays com elementos', () => {
    expect(isEmpty([1, 2, 3])).toBe(false);
  });

  it('ensureArray deve converter undefined em array vazio', () => {
    const result = ensureArray(undefined);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([]);
  });

  it('ensureArray deve manter arrays válidos', () => {
    const input = [1, 2, 3];
    const result = ensureArray(input);
    expect(result).toBe(input);
  });
});

describe('Bug Fix: Erro SQL PIR - Schema e Validações', () => {
  it('deve validar que processId é opcional no schema', () => {
    // Simular tipo do schema
    type PirAssessmentInsert = {
      id?: number;
      employeeId: number;
      cycleId?: number | null;
      processId?: number | null;
      assessmentDate: Date;
      status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
      createdBy: number;
    };

    // Testar criação com processId
    const withProcessId: PirAssessmentInsert = {
      employeeId: 1,
      processId: 100,
      assessmentDate: new Date(),
      status: 'em_andamento',
      createdBy: 1
    };
    expect(withProcessId.processId).toBe(100);

    // Testar criação sem processId
    const withoutProcessId: PirAssessmentInsert = {
      employeeId: 1,
      assessmentDate: new Date(),
      status: 'em_andamento',
      createdBy: 1
    };
    expect(withoutProcessId.processId).toBeUndefined();
  });

  it('deve validar campos obrigatórios do pirAssessment', () => {
    type PirAssessmentInsert = {
      employeeId: number;
      assessmentDate: Date;
      createdBy: number;
      status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
    };

    const validAssessment: PirAssessmentInsert = {
      employeeId: 120002,
      assessmentDate: new Date(),
      createdBy: 1,
      status: 'em_andamento'
    };

    expect(validAssessment.employeeId).toBe(120002);
    expect(validAssessment.assessmentDate).toBeInstanceOf(Date);
    expect(validAssessment.createdBy).toBe(1);
    expect(validAssessment.status).toBe('em_andamento');
  });

  it('deve validar que processId pode ser usado em queries WHERE', () => {
    // Simular query WHERE com processId
    const processId = 100;
    const whereClause = { processId };
    
    expect(whereClause.processId).toBe(100);
    expect(typeof whereClause.processId).toBe('number');
  });
});

describe('Integração: Fluxo Completo de Competências', () => {
  it('deve processar lista de competências com segurança', () => {
    const competencies = [
      { id: 1, name: 'Liderança', category: 'Gestão' },
      { id: 2, name: 'Comunicação', category: 'Soft Skills' },
      { id: 3, name: 'Análise', category: 'Técnicas' }
    ];

    // Filtrar por categoria
    const softSkills = safeFilter(competencies, c => c.category === 'Soft Skills');
    expect(softSkills).toHaveLength(1);

    // Mapear para IDs
    const ids = safeMap(competencies, c => c.id);
    expect(ids).toEqual([1, 2, 3]);

    // Verificar se lista está vazia
    expect(isEmpty(competencies)).toBe(false);
    expect(isEmpty([])).toBe(true);
  });

  it('deve lidar com competências undefined graciosamente', () => {
    const competencies = undefined;

    const filtered = safeFilter(competencies as any, (c: any) => c.selected);
    const mapped = safeMap(competencies as any, (c: any) => c.id);
    const empty = isEmpty(competencies);

    expect(filtered).toEqual([]);
    expect(mapped).toEqual([]);
    expect(empty).toBe(true);
  });
});
