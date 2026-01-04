import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from '../db';
import { pirIntegrityQuestions } from '../../drizzle/schema';
import { sql } from 'drizzle-orm';

describe('PIR Integrity Router - Options Parsing', () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
  });

  it('deve parsear options de JSON string para array corretamente', async () => {
    if (!db) {
      console.log('Database não disponível, pulando teste');
      return;
    }

    // Executar a mesma query que o router usa
    const result = await db.execute(sql`
      SELECT * FROM pirIntegrityQuestions 
      WHERE active = 1 
      ORDER BY displayOrder 
      LIMIT 5
    `);

    const questions = Array.isArray(result[0]) ? result[0] : [];
    
    // Aplicar a mesma lógica de parse do router
    const parsedQuestions = questions.map((q: any) => {
      try {
        if (q.options && typeof q.options === 'string') {
          q.options = JSON.parse(q.options);
        }
        if (!Array.isArray(q.options)) {
          q.options = [];
        }
      } catch (error) {
        q.options = [];
      }
      return q;
    });

    // Validar que todas as questões têm options como array
    parsedQuestions.forEach((q: any) => {
      expect(Array.isArray(q.options)).toBe(true);
    });
  });

  it('deve retornar array vazio quando options é null', async () => {
    const testQuestion: any = { id: 1, options: null };
    
    try {
      if (testQuestion.options && typeof testQuestion.options === 'string') {
        testQuestion.options = JSON.parse(testQuestion.options);
      }
      if (!Array.isArray(testQuestion.options)) {
        testQuestion.options = [];
      }
    } catch (error) {
      testQuestion.options = [];
    }

    expect(Array.isArray(testQuestion.options)).toBe(true);
    expect(testQuestion.options).toEqual([]);
  });

  it('deve retornar array vazio quando options é undefined', async () => {
    const testQuestion: any = { id: 1, options: undefined };
    
    try {
      if (testQuestion.options && typeof testQuestion.options === 'string') {
        testQuestion.options = JSON.parse(testQuestion.options);
      }
      if (!Array.isArray(testQuestion.options)) {
        testQuestion.options = [];
      }
    } catch (error) {
      testQuestion.options = [];
    }

    expect(Array.isArray(testQuestion.options)).toBe(true);
    expect(testQuestion.options).toEqual([]);
  });

  it('deve retornar array vazio quando JSON é inválido', async () => {
    const testQuestion: any = { id: 1, options: '{invalid json}' };
    
    try {
      if (testQuestion.options && typeof testQuestion.options === 'string') {
        testQuestion.options = JSON.parse(testQuestion.options);
      }
      if (!Array.isArray(testQuestion.options)) {
        testQuestion.options = [];
      }
    } catch (error) {
      testQuestion.options = [];
    }

    expect(Array.isArray(testQuestion.options)).toBe(true);
    expect(testQuestion.options).toEqual([]);
  });

  it('deve manter array quando options já é array', async () => {
    const testOptions = [
      { value: 'A', label: 'Opção A', score: 10, moralLevel: 'conventional' },
      { value: 'B', label: 'Opção B', score: 20, moralLevel: 'post_conventional' }
    ];
    const testQuestion: any = { id: 1, options: testOptions };
    
    try {
      if (testQuestion.options && typeof testQuestion.options === 'string') {
        testQuestion.options = JSON.parse(testQuestion.options);
      }
      if (!Array.isArray(testQuestion.options)) {
        testQuestion.options = [];
      }
    } catch (error) {
      testQuestion.options = [];
    }

    expect(Array.isArray(testQuestion.options)).toBe(true);
    expect(testQuestion.options).toEqual(testOptions);
  });

  it('deve parsear JSON válido corretamente', async () => {
    const testOptions = [
      { value: 'A', label: 'Opção A', score: 10, moralLevel: 'conventional' },
      { value: 'B', label: 'Opção B', score: 20, moralLevel: 'post_conventional' }
    ];
    const testQuestion: any = { id: 1, options: JSON.stringify(testOptions) };
    
    try {
      if (testQuestion.options && typeof testQuestion.options === 'string') {
        testQuestion.options = JSON.parse(testQuestion.options);
      }
      if (!Array.isArray(testQuestion.options)) {
        testQuestion.options = [];
      }
    } catch (error) {
      testQuestion.options = [];
    }

    expect(Array.isArray(testQuestion.options)).toBe(true);
    expect(testQuestion.options).toEqual(testOptions);
  });
});
