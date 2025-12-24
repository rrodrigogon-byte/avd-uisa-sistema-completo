import { describe, it, expect } from 'vitest';
import {
  safeMap,
  safeFilter,
  safeFind,
  safeReduce,
  safeForEach,
  safeSome,
  safeEvery,
  safeLength,
  isEmpty,
  ensureArray,
  safeSort,
  safeFirst,
  safeLast,
  safeSlice,
  safeJoin,
  safeIncludes,
  safeIndexOf,
  safeAt,
  safeFlatMap,
  safeUnique,
  safeGroupBy,
  isValidArray,
  toArray,
} from './arrayHelpers';

describe('arrayHelpers', () => {
  describe('safeMap', () => {
    it('deve mapear array válido corretamente', () => {
      const result = safeMap([1, 2, 3], (x) => x * 2);
      expect(result).toEqual([2, 4, 6]);
    });

    it('deve retornar array vazio para undefined', () => {
      const result = safeMap(undefined, (x) => x * 2);
      expect(result).toEqual([]);
    });

    it('deve retornar array vazio para null', () => {
      const result = safeMap(null, (x) => x * 2);
      expect(result).toEqual([]);
    });

    it('deve retornar array vazio para não-array', () => {
      const result = safeMap('not an array' as any, (x) => x);
      expect(result).toEqual([]);
    });
  });

  describe('safeFilter', () => {
    it('deve filtrar array válido corretamente', () => {
      const result = safeFilter([1, 2, 3, 4], (x) => x > 2);
      expect(result).toEqual([3, 4]);
    });

    it('deve retornar array vazio para undefined', () => {
      const result = safeFilter(undefined, (x) => x > 2);
      expect(result).toEqual([]);
    });

    it('deve retornar array vazio para null', () => {
      const result = safeFilter(null, (x) => x > 2);
      expect(result).toEqual([]);
    });
  });

  describe('safeFind', () => {
    it('deve encontrar elemento em array válido', () => {
      const result = safeFind([1, 2, 3], (x) => x === 2);
      expect(result).toBe(2);
    });

    it('deve retornar undefined se elemento não existe', () => {
      const result = safeFind([1, 2, 3], (x) => x === 5);
      expect(result).toBeUndefined();
    });

    it('deve retornar undefined para array undefined', () => {
      const result = safeFind(undefined, (x) => x === 2);
      expect(result).toBeUndefined();
    });

    it('deve retornar undefined para array null', () => {
      const result = safeFind(null, (x) => x === 2);
      expect(result).toBeUndefined();
    });
  });

  describe('safeReduce', () => {
    it('deve reduzir array válido corretamente', () => {
      const result = safeReduce([1, 2, 3], (acc, x) => acc + x, 0);
      expect(result).toBe(6);
    });

    it('deve retornar valor inicial para undefined', () => {
      const result = safeReduce(undefined, (acc, x) => acc + x, 10);
      expect(result).toBe(10);
    });

    it('deve retornar valor inicial para null', () => {
      const result = safeReduce(null, (acc, x) => acc + x, 10);
      expect(result).toBe(10);
    });
  });

  describe('safeForEach', () => {
    it('deve iterar sobre array válido', () => {
      const results: number[] = [];
      safeForEach([1, 2, 3], (x) => results.push(x * 2));
      expect(results).toEqual([2, 4, 6]);
    });

    it('não deve executar callback para undefined', () => {
      const results: number[] = [];
      safeForEach(undefined, (x) => results.push(x));
      expect(results).toEqual([]);
    });

    it('não deve executar callback para null', () => {
      const results: number[] = [];
      safeForEach(null, (x) => results.push(x));
      expect(results).toEqual([]);
    });
  });

  describe('safeSome', () => {
    it('deve retornar true se algum elemento atende condição', () => {
      const result = safeSome([1, 2, 3], (x) => x > 2);
      expect(result).toBe(true);
    });

    it('deve retornar false se nenhum elemento atende condição', () => {
      const result = safeSome([1, 2, 3], (x) => x > 5);
      expect(result).toBe(false);
    });

    it('deve retornar false para undefined', () => {
      const result = safeSome(undefined, (x) => x > 2);
      expect(result).toBe(false);
    });

    it('deve retornar false para null', () => {
      const result = safeSome(null, (x) => x > 2);
      expect(result).toBe(false);
    });
  });

  describe('safeEvery', () => {
    it('deve retornar true se todos elementos atendem condição', () => {
      const result = safeEvery([2, 3, 4], (x) => x > 1);
      expect(result).toBe(true);
    });

    it('deve retornar false se algum elemento não atende condição', () => {
      const result = safeEvery([1, 2, 3], (x) => x > 1);
      expect(result).toBe(false);
    });

    it('deve retornar true para undefined (vacuously true)', () => {
      const result = safeEvery(undefined, (x) => x > 2);
      expect(result).toBe(true);
    });

    it('deve retornar true para null (vacuously true)', () => {
      const result = safeEvery(null, (x) => x > 2);
      expect(result).toBe(true);
    });
  });

  describe('safeLength', () => {
    it('deve retornar comprimento de array válido', () => {
      expect(safeLength([1, 2, 3])).toBe(3);
    });

    it('deve retornar 0 para undefined', () => {
      expect(safeLength(undefined)).toBe(0);
    });

    it('deve retornar 0 para null', () => {
      expect(safeLength(null)).toBe(0);
    });

    it('deve retornar 0 para array vazio', () => {
      expect(safeLength([])).toBe(0);
    });
  });

  describe('isEmpty', () => {
    it('deve retornar true para array vazio', () => {
      expect(isEmpty([])).toBe(true);
    });

    it('deve retornar true para undefined', () => {
      expect(isEmpty(undefined)).toBe(true);
    });

    it('deve retornar true para null', () => {
      expect(isEmpty(null)).toBe(true);
    });

    it('deve retornar false para array com elementos', () => {
      expect(isEmpty([1, 2, 3])).toBe(false);
    });
  });

  describe('ensureArray', () => {
    it('deve retornar array original se válido', () => {
      const arr = [1, 2, 3];
      expect(ensureArray(arr)).toBe(arr);
    });

    it('deve retornar array vazio para undefined', () => {
      expect(ensureArray(undefined)).toEqual([]);
    });

    it('deve retornar array vazio para null', () => {
      expect(ensureArray(null)).toEqual([]);
    });
  });

  describe('safeSort', () => {
    it('deve ordenar array válido', () => {
      const result = safeSort([3, 1, 2]);
      expect(result).toEqual([1, 2, 3]);
    });

    it('deve ordenar com função de comparação', () => {
      const result = safeSort([3, 1, 2], (a, b) => b - a);
      expect(result).toEqual([3, 2, 1]);
    });

    it('não deve mutar array original', () => {
      const original = [3, 1, 2];
      const result = safeSort(original);
      expect(original).toEqual([3, 1, 2]);
      expect(result).toEqual([1, 2, 3]);
    });

    it('deve retornar array vazio para undefined', () => {
      expect(safeSort(undefined)).toEqual([]);
    });

    it('deve retornar array vazio para null', () => {
      expect(safeSort(null)).toEqual([]);
    });
  });

  describe('safeFirst', () => {
    it('deve retornar primeiro elemento', () => {
      expect(safeFirst([1, 2, 3])).toBe(1);
    });

    it('deve retornar undefined para array vazio', () => {
      expect(safeFirst([])).toBeUndefined();
    });

    it('deve retornar undefined para undefined', () => {
      expect(safeFirst(undefined)).toBeUndefined();
    });

    it('deve retornar undefined para null', () => {
      expect(safeFirst(null)).toBeUndefined();
    });
  });

  describe('safeLast', () => {
    it('deve retornar último elemento', () => {
      expect(safeLast([1, 2, 3])).toBe(3);
    });

    it('deve retornar undefined para array vazio', () => {
      expect(safeLast([])).toBeUndefined();
    });

    it('deve retornar undefined para undefined', () => {
      expect(safeLast(undefined)).toBeUndefined();
    });

    it('deve retornar undefined para null', () => {
      expect(safeLast(null)).toBeUndefined();
    });
  });

  describe('safeSlice', () => {
    it('deve fatiar array válido', () => {
      expect(safeSlice([1, 2, 3, 4], 1, 3)).toEqual([2, 3]);
    });

    it('deve fatiar sem end', () => {
      expect(safeSlice([1, 2, 3, 4], 2)).toEqual([3, 4]);
    });

    it('deve retornar array vazio para undefined', () => {
      expect(safeSlice(undefined, 1, 3)).toEqual([]);
    });

    it('deve retornar array vazio para null', () => {
      expect(safeSlice(null, 1, 3)).toEqual([]);
    });
  });

  describe('safeJoin', () => {
    it('deve juntar array com separador padrão', () => {
      expect(safeJoin([1, 2, 3])).toBe('1,2,3');
    });

    it('deve juntar array com separador customizado', () => {
      expect(safeJoin([1, 2, 3], ' - ')).toBe('1 - 2 - 3');
    });

    it('deve retornar string vazia para undefined', () => {
      expect(safeJoin(undefined)).toBe('');
    });

    it('deve retornar string vazia para null', () => {
      expect(safeJoin(null)).toBe('');
    });
  });

  describe('safeIncludes', () => {
    it('deve retornar true se elemento existe', () => {
      expect(safeIncludes([1, 2, 3], 2)).toBe(true);
    });

    it('deve retornar false se elemento não existe', () => {
      expect(safeIncludes([1, 2, 3], 5)).toBe(false);
    });

    it('deve retornar false para undefined', () => {
      expect(safeIncludes(undefined, 2)).toBe(false);
    });

    it('deve retornar false para null', () => {
      expect(safeIncludes(null, 2)).toBe(false);
    });
  });

  describe('safeIndexOf', () => {
    it('deve retornar índice do elemento', () => {
      expect(safeIndexOf([1, 2, 3], 2)).toBe(1);
    });

    it('deve retornar -1 se elemento não existe', () => {
      expect(safeIndexOf([1, 2, 3], 5)).toBe(-1);
    });

    it('deve retornar -1 para undefined', () => {
      expect(safeIndexOf(undefined, 2)).toBe(-1);
    });

    it('deve retornar -1 para null', () => {
      expect(safeIndexOf(null, 2)).toBe(-1);
    });
  });

  describe('safeAt', () => {
    it('deve retornar elemento no índice', () => {
      expect(safeAt([1, 2, 3], 1)).toBe(2);
    });

    it('deve retornar undefined para índice inválido', () => {
      expect(safeAt([1, 2, 3], 5)).toBeUndefined();
    });

    it('deve retornar undefined para índice negativo', () => {
      expect(safeAt([1, 2, 3], -1)).toBeUndefined();
    });

    it('deve retornar undefined para undefined', () => {
      expect(safeAt(undefined, 1)).toBeUndefined();
    });

    it('deve retornar undefined para null', () => {
      expect(safeAt(null, 1)).toBeUndefined();
    });
  });

  describe('safeFlatMap', () => {
    it('deve mapear e achatar array válido', () => {
      const result = safeFlatMap([1, 2, 3], (x) => [x, x * 2]);
      expect(result).toEqual([1, 2, 2, 4, 3, 6]);
    });

    it('deve retornar array vazio para undefined', () => {
      const result = safeFlatMap(undefined, (x) => [x, x * 2]);
      expect(result).toEqual([]);
    });

    it('deve retornar array vazio para null', () => {
      const result = safeFlatMap(null, (x) => [x, x * 2]);
      expect(result).toEqual([]);
    });
  });

  describe('safeUnique', () => {
    it('deve remover duplicatas', () => {
      expect(safeUnique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    });

    it('deve retornar array vazio para undefined', () => {
      expect(safeUnique(undefined)).toEqual([]);
    });

    it('deve retornar array vazio para null', () => {
      expect(safeUnique(null)).toEqual([]);
    });
  });

  describe('safeGroupBy', () => {
    it('deve agrupar elementos por chave', () => {
      const items = [
        { type: 'a', value: 1 },
        { type: 'b', value: 2 },
        { type: 'a', value: 3 },
      ];
      const result = safeGroupBy(items, (item) => item.type);
      expect(result).toEqual({
        a: [
          { type: 'a', value: 1 },
          { type: 'a', value: 3 },
        ],
        b: [{ type: 'b', value: 2 }],
      });
    });

    it('deve retornar objeto vazio para undefined', () => {
      const result = safeGroupBy(undefined, (item: any) => item.type);
      expect(result).toEqual({});
    });

    it('deve retornar objeto vazio para null', () => {
      const result = safeGroupBy(null, (item: any) => item.type);
      expect(result).toEqual({});
    });
  });

  describe('isValidArray', () => {
    it('deve retornar true para array válido não vazio', () => {
      expect(isValidArray([1, 2, 3])).toBe(true);
    });

    it('deve retornar false para array vazio', () => {
      expect(isValidArray([])).toBe(false);
    });

    it('deve retornar false para undefined', () => {
      expect(isValidArray(undefined)).toBe(false);
    });

    it('deve retornar false para null', () => {
      expect(isValidArray(null)).toBe(false);
    });

    it('deve retornar false para não-array', () => {
      expect(isValidArray('not an array')).toBe(false);
    });
  });

  describe('toArray', () => {
    it('deve retornar array original se já for array', () => {
      const arr = [1, 2, 3];
      expect(toArray(arr)).toBe(arr);
    });

    it('deve converter valor único em array', () => {
      expect(toArray(5)).toEqual([5]);
    });

    it('deve retornar array vazio para undefined', () => {
      expect(toArray(undefined)).toEqual([]);
    });

    it('deve retornar array vazio para null', () => {
      expect(toArray(null)).toEqual([]);
    });
  });
});
