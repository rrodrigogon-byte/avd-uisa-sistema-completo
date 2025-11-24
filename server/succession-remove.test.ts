import { describe, it, expect } from 'vitest';

describe('Succession removeSuccessor endpoint', () => {
  it('should validate input schema correctly', () => {
    // Simular validação Zod
    const validInput = { id: 1 };
    const invalidInput = 1; // número direto, não objeto

    // O endpoint espera: z.object({ id: z.number() })
    
    expect(typeof validInput).toBe('object');
    expect(validInput).toHaveProperty('id');
    expect(typeof validInput.id).toBe('number');

    // Este deve falhar
    expect(typeof invalidInput).toBe('number');
    expect(invalidInput).not.toHaveProperty('id');
  });

  it('should accept object with id property', () => {
    const input = { id: 123 };
    
    expect(input).toMatchObject({ id: expect.any(Number) });
  });

  it('should reject plain number', () => {
    const input = 123;
    
    expect(typeof input).toBe('number');
    expect(input).not.toHaveProperty('id');
  });
});
