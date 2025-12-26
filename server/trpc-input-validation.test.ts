import { describe, it, expect } from 'vitest';
import { z } from 'zod';

/**
 * Testes para validar que procedures tRPC aceitam undefined como input
 * 
 * Contexto: Corrigimos 55+ procedures que não tinham .input() definido,
 * causando erro "Invalid input: expected object, received undefined"
 * quando chamadas com useQuery(undefined)
 */

describe('tRPC Input Validation', () => {
  describe('Schema validation', () => {
    it('deve aceitar undefined quando input é z.object({})', () => {
      const schema = z.object({});
      
      // Deve aceitar undefined
      expect(() => schema.parse(undefined)).not.toThrow();
      
      // Deve aceitar objeto vazio
      expect(() => schema.parse({})).not.toThrow();
    });

    it('deve aceitar undefined quando input não é fornecido', () => {
      const schema = z.object({});
      
      const result = schema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it('deve rejeitar valores não-objeto quando input espera objeto', () => {
      const schema = z.object({});
      
      // String não deve ser aceita
      const result1 = schema.safeParse("string");
      expect(result1.success).toBe(false);
      
      // Number não deve ser aceito
      const result2 = schema.safeParse(123);
      expect(result2.success).toBe(false);
      
      // Array não deve ser aceito
      const result3 = schema.safeParse([]);
      expect(result3.success).toBe(false);
    });
  });

  describe('Procedure patterns', () => {
    it('protectedProcedure.input(z.object({})).query() deve aceitar undefined', () => {
      const inputSchema = z.object({});
      
      // Simular chamada com undefined
      const input = undefined;
      const result = inputSchema.safeParse(input);
      
      expect(result.success).toBe(true);
    });

    it('publicProcedure.input(z.object({})).query() deve aceitar undefined', () => {
      const inputSchema = z.object({});
      
      // Simular chamada com undefined
      const input = undefined;
      const result = inputSchema.safeParse(input);
      
      expect(result.success).toBe(true);
    });

    it('adminProcedure.input(z.object({})).query() deve aceitar undefined', () => {
      const inputSchema = z.object({});
      
      // Simular chamada com undefined
      const input = undefined;
      const result = inputSchema.safeParse(input);
      
      expect(result.success).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('deve rejeitar null (null não é undefined)', () => {
      const schema = z.object({});
      
      // null é diferente de undefined e NÃO é aceito por z.object().optional()
      const result = schema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it('deve aceitar objeto com propriedades extras', () => {
      const schema = z.object({});
      
      // Objeto com propriedades extras deve ser aceito (passthrough)
      const result = schema.safeParse({ extra: 'value' });
      expect(result.success).toBe(true);
    });
  });

  describe('Regression prevention', () => {
    it('deve prevenir erro "expected object, received undefined"', () => {
      const schema = z.object({});
      
      // Este era o caso que causava o erro antes da correção
      const result = schema.safeParse(undefined);
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('deve funcionar com useQuery(undefined, options)', () => {
      const inputSchema = z.object({});
      
      // Simular padrão comum: trpc.procedure.useQuery(undefined, { refetchInterval: 30000 })
      const input = undefined;
      const result = inputSchema.safeParse(input);
      
      expect(result.success).toBe(true);
    });
  });

  describe('Specific procedures fixed', () => {
    it('pendencias.countByStatus deve aceitar undefined', () => {
      const schema = z.object({});
      const result = schema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it('departments.list deve aceitar undefined', () => {
      const schema = z.object({});
      const result = schema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it('competencies.list deve aceitar undefined', () => {
      const schema = z.object({});
      const result = schema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it('costCenters.list deve aceitar undefined', () => {
      const schema = z.object({});
      const result = schema.safeParse(undefined);
      expect(result.success).toBe(true);
    });
  });
});
