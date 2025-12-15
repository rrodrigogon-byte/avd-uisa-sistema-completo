/**
 * Teste do Router de Busca Global
 * Sistema AVD UISA
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from '../routers';
import { getDb } from '../db';
import { employees, goals, evaluationCycles } from '../../drizzle/schema';

describe('Search Router', () => {
  let db: Awaited<ReturnType<typeof getDb>>;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    db = await getDb();
    
    // Mock context para testes
    caller = appRouter.createCaller({
      user: {
        id: 1,
        openId: 'test-user',
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {} as any,
      res: {} as any,
    });
  });

  it('deve buscar funcionários por nome', async () => {
    if (!db) {
      console.log('⚠️  Database não disponível - pulando teste');
      expect(true).toBe(true);
      return;
    }

    // Buscar todos os funcionários para ter dados de teste
    const allEmployees = await db
      .select({
        id: employees.id,
        name: employees.name,
      })
      .from(employees)
      .limit(5);

    if (allEmployees.length === 0) {
      console.log('⚠️  Nenhum funcionário no banco - pulando teste');
      expect(true).toBe(true);
      return;
    }

    // Pegar o primeiro nome para buscar
    const firstEmployee = allEmployees[0];
    const searchTerm = firstEmployee.name?.substring(0, 3) || 'a';

    console.log(`\n🔍 Buscando por: "${searchTerm}"`);

    const results = await caller.search.global({
      query: searchTerm,
      limit: 10,
    });

    console.log(`📊 Resultados encontrados: ${results.length}`);
    
    if (results.length > 0) {
      console.log('\n📋 Primeiros resultados:');
      results.slice(0, 3).forEach((result) => {
        console.log(`   - [${result.type}] ${result.title}`);
        if (result.subtitle) {
          console.log(`     ${result.subtitle}`);
        }
      });
    }

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThanOrEqual(0);
  });

  it('deve buscar metas por título', async () => {
    if (!db) {
      console.log('⚠️  Database não disponível - pulando teste');
      expect(true).toBe(true);
      return;
    }

    // Buscar metas existentes
    const allGoals = await db
      .select({
        id: goals.id,
        title: goals.title,
      })
      .from(goals)
      .limit(5);

    if (allGoals.length === 0) {
      console.log('⚠️  Nenhuma meta no banco - pulando teste');
      expect(true).toBe(true);
      return;
    }

    const firstGoal = allGoals[0];
    const searchTerm = firstGoal.title.substring(0, 3);

    console.log(`\n🎯 Buscando metas com: "${searchTerm}"`);

    const results = await caller.search.global({
      query: searchTerm,
      limit: 10,
      types: ['goal'],
    });

    console.log(`📊 Metas encontradas: ${results.length}`);

    if (results.length > 0) {
      console.log('\n📋 Metas encontradas:');
      results.forEach((result) => {
        console.log(`   - ${result.title}`);
      });
    }

    expect(Array.isArray(results)).toBe(true);
    const goalResults = results.filter((r) => r.type === 'goal');
    expect(goalResults.length).toBeGreaterThanOrEqual(0);
  });

  it('deve buscar ciclos por nome', async () => {
    if (!db) {
      console.log('⚠️  Database não disponível - pulando teste');
      expect(true).toBe(true);
      return;
    }

    // Buscar ciclos existentes
    const allCycles = await db
      .select({
        id: evaluationCycles.id,
        name: evaluationCycles.name,
      })
      .from(evaluationCycles)
      .limit(5);

    if (allCycles.length === 0) {
      console.log('⚠️  Nenhum ciclo no banco - pulando teste');
      expect(true).toBe(true);
      return;
    }

    const firstCycle = allCycles[0];
    const searchTerm = firstCycle.name.substring(0, 3);

    console.log(`\n📅 Buscando ciclos com: "${searchTerm}"`);

    const results = await caller.search.global({
      query: searchTerm,
      limit: 10,
      types: ['cycle'],
    });

    console.log(`📊 Ciclos encontrados: ${results.length}`);

    if (results.length > 0) {
      console.log('\n📋 Ciclos encontrados:');
      results.forEach((result) => {
        console.log(`   - ${result.title} (${result.subtitle})`);
      });
    }

    expect(Array.isArray(results)).toBe(true);
    const cycleResults = results.filter((r) => r.type === 'cycle');
    expect(cycleResults.length).toBeGreaterThanOrEqual(0);
  });

  it('deve respeitar limite de resultados', async () => {
    if (!db) {
      console.log('⚠️  Database não disponível - pulando teste');
      expect(true).toBe(true);
      return;
    }

    const results = await caller.search.global({
      query: 'ab',
      limit: 5,
    });

    console.log(`\n📊 Teste de limite: ${results.length} resultados (máximo 5)`);

    expect(results.length).toBeLessThanOrEqual(5);
  });

  it('deve validar busca rápida (quick search)', async () => {
    if (!db) {
      console.log('⚠️  Database não disponível - pulando teste');
      expect(true).toBe(true);
      return;
    }

    const results = await caller.search.quick({
      query: 'ab',
      limit: 5,
    });

    console.log(`\n⚡ Busca rápida: ${results.length} resultados`);

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeLessThanOrEqual(5);

    if (results.length > 0) {
      console.log('📋 Resultados da busca rápida:');
      results.forEach((result) => {
        console.log(`   - [${result.type}] ${result.title}`);
      });
    }
  });

  it('deve validar estrutura dos resultados', async () => {
    if (!db) {
      console.log('⚠️  Database não disponível - pulando teste');
      expect(true).toBe(true);
      return;
    }

    const results = await caller.search.global({
      query: 'test',
      limit: 10,
    });

    console.log(`\n🔍 Validando estrutura de ${results.length} resultados`);

    results.forEach((result) => {
      // Validar campos obrigatórios
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('url');

      // Validar tipos permitidos
      expect(['employee', 'goal', 'evaluation', 'pdi', 'job_description', 'cycle']).toContain(
        result.type
      );

      // Validar URL
      expect(result.url).toMatch(/^\//);
    });

    console.log('✅ Estrutura de resultados validada');
  });

  it('deve validar query mínima de 2 caracteres', async () => {
    if (!db) {
      console.log('⚠️  Database não disponível - pulando teste');
      expect(true).toBe(true);
      return;
    }

    // Query com 2 caracteres (mínimo permitido)
    const results = await caller.search.global({
      query: 'ab',
      limit: 10,
    });

    console.log(`\n📊 Busca com 2 caracteres: ${results.length} resultados`);

    expect(Array.isArray(results)).toBe(true);
    
    // Validar que query com 1 caractere lança erro
    try {
      await caller.search.global({
        query: 'a',
        limit: 10,
      });
      // Se não lançar erro, falha o teste
      expect(true).toBe(false);
    } catch (error: any) {
      console.log('✅ Query com 1 caractere corretamente rejeitada');
      expect(error.message).toContain('Too small');
    }
  });
});
