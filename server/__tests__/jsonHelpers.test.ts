import { describe, it, expect } from 'vitest';
import { safeJSONParse, parseOptions, parseConfig, parseJSONFields, parseJSONFieldsSingle } from '../jsonHelpers';

describe('JSON Helpers', () => {
  describe('safeJSONParse', () => {
    it('deve parsear JSON válido corretamente', () => {
      const result = safeJSONParse('{"key": "value"}', {});
      expect(result).toEqual({ key: 'value' });
    });

    it('deve retornar defaultValue quando JSON é inválido', () => {
      const result = safeJSONParse('{invalid json}', { default: true });
      expect(result).toEqual({ default: true });
    });

    it('deve retornar defaultValue quando valor é null', () => {
      const result = safeJSONParse(null, []);
      expect(result).toEqual([]);
    });

    it('deve retornar defaultValue quando valor é undefined', () => {
      const result = safeJSONParse(undefined, []);
      expect(result).toEqual([]);
    });

    it('deve retornar o valor direto quando já é objeto', () => {
      const obj = { key: 'value' };
      const result = safeJSONParse(obj, {});
      expect(result).toBe(obj);
    });

    it('deve retornar o valor direto quando já é array', () => {
      const arr = [1, 2, 3];
      const result = safeJSONParse(arr, []);
      expect(result).toBe(arr);
    });
  });

  describe('parseOptions', () => {
    it('deve parsear options de JSON string', () => {
      const options = '[{"value": "A", "label": "Opção A"}]';
      const result = parseOptions(options);
      expect(result).toEqual([{ value: 'A', label: 'Opção A' }]);
    });

    it('deve retornar array vazio quando options é null', () => {
      const result = parseOptions(null);
      expect(result).toEqual([]);
    });

    it('deve retornar array vazio quando JSON é inválido', () => {
      const result = parseOptions('{invalid}');
      expect(result).toEqual([]);
    });
  });

  describe('parseConfig', () => {
    it('deve parsear config de JSON string', () => {
      const config = '{"setting": "value"}';
      const result = parseConfig(config);
      expect(result).toEqual({ setting: 'value' });
    });

    it('deve retornar objeto vazio quando config é null', () => {
      const result = parseConfig(null);
      expect(result).toEqual({});
    });

    it('deve retornar objeto vazio quando JSON é inválido', () => {
      const result = parseConfig('[invalid]');
      expect(result).toEqual({});
    });
  });

  describe('parseJSONFields', () => {
    it('deve parsear múltiplos campos JSON em array de registros', () => {
      const records = [
        { id: 1, options: '[1,2,3]', config: '{"key": "val"}' },
        { id: 2, options: '[4,5,6]', config: '{"key": "val2"}' }
      ];
      
      const result = parseJSONFields(records, ['options', 'config']);
      
      expect(result[0].options).toEqual([1, 2, 3]);
      expect(result[0].config).toEqual({ key: 'val' });
      expect(result[1].options).toEqual([4, 5, 6]);
      expect(result[1].config).toEqual({ key: 'val2' });
    });

    it('deve usar defaultValues quando parse falha', () => {
      const records = [
        { id: 1, options: '{invalid}', config: null }
      ];
      
      const result = parseJSONFields(records, ['options', 'config'], {
        options: [],
        config: { default: true }
      });
      
      expect(result[0].options).toEqual([]);
      expect(result[0].config).toEqual({ default: true });
    });

    it('deve manter campos não especificados intactos', () => {
      const records = [
        { id: 1, options: '[1,2]', name: 'Test' }
      ];
      
      const result = parseJSONFields(records, ['options']);
      
      expect(result[0].name).toBe('Test');
      expect(result[0].id).toBe(1);
    });
  });

  describe('parseJSONFieldsSingle', () => {
    it('deve parsear campos JSON em registro único', () => {
      const record = { id: 1, options: '[1,2,3]', config: '{"key": "val"}' };
      
      const result = parseJSONFieldsSingle(record, ['options', 'config']);
      
      expect(result?.options).toEqual([1, 2, 3]);
      expect(result?.config).toEqual({ key: 'val' });
    });

    it('deve retornar null quando record é null', () => {
      const result = parseJSONFieldsSingle(null, ['options']);
      expect(result).toBeNull();
    });

    it('deve retornar null quando record é undefined', () => {
      const result = parseJSONFieldsSingle(undefined, ['options']);
      expect(result).toBeNull();
    });

    it('deve usar defaultValues quando parse falha', () => {
      const record = { id: 1, options: '{invalid}' };
      
      const result = parseJSONFieldsSingle(record, ['options'], {
        options: []
      });
      
      expect(result?.options).toEqual([]);
    });
  });
});
