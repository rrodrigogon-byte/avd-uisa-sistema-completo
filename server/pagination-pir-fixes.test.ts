import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import { getDb } from './db';
import { employees, testResults, psychometricTests } from '../drizzle/schema';
import { eq, sql } from 'drizzle-orm';

describe('Correções de Paginação e PIR', () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
  });

  describe('Paginação de Funcionários', () => {
    it('deve retornar todos os funcionários ativos (não apenas 100)', async () => {
      if (!db) throw new Error('Database not available');

      // Contar total de funcionários ativos no banco
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(employees)
        .where(eq(employees.status, 'ativo'));

      const totalEmployees = Number(countResult.count);

      console.log(`Total de funcionários ativos no banco: ${totalEmployees}`);

      // Criar contexto mock de admin
      const mockContext = {
        user: { id: 1, role: 'admin' as const, openId: 'test-admin' },
        req: {} as any,
        res: {} as any,
      };

      const caller = appRouter.createCaller(mockContext);

      // Buscar funcionários via procedure
      const result = await caller.employees.list({});

      console.log(`Funcionários retornados pela API: ${result.length}`);

      // Verificar se retornou todos (não apenas 100)
      expect(result.length).toBe(totalEmployees);
      
      if (totalEmployees > 100) {
        expect(result.length).toBeGreaterThan(100);
        console.log('✅ Correção confirmada: retorna mais de 100 funcionários');
      } else {
        console.log('⚠️ Total de funcionários no banco é menor que 100, teste não conclusivo');
      }
    });

    it('deve retornar funcionários com estrutura correta', async () => {
      const mockContext = {
        user: { id: 1, role: 'admin' as const, openId: 'test-admin' },
        req: {} as any,
        res: {} as any,
      };

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.employees.list({});

      if (result.length > 0) {
        const firstEmployee = result[0];
        
        // Verificar estrutura
        expect(firstEmployee).toHaveProperty('id');
        expect(firstEmployee).toHaveProperty('employee');
        expect(firstEmployee).toHaveProperty('name');
        expect(firstEmployee).toHaveProperty('email');
        expect(firstEmployee).toHaveProperty('status');
        
        console.log('✅ Estrutura dos funcionários está correta');
      }
    });
  });

  describe('Resultados PIR', () => {
    it('deve buscar testes PIR da tabela testResults', async () => {
      if (!db) throw new Error('Database not available');

      // Verificar se existem testes PIR na tabela testResults
      const pirTests = await db
        .select()
        .from(testResults)
        .where(
          sql`${testResults.testType} = 'pir' AND ${testResults.completedAt} IS NOT NULL`
        )
        .limit(5);

      console.log(`Testes PIR encontrados na tabela testResults: ${pirTests.length}`);

      if (pirTests.length > 0) {
        const firstTest = pirTests[0];
        console.log('Estrutura do teste PIR:', {
          id: firstTest.id,
          employeeId: firstTest.employeeId,
          testType: firstTest.testType,
          hasScores: !!firstTest.scores,
          completedAt: firstTest.completedAt,
        });

        // Verificar se tem scores
        expect(firstTest.scores).toBeTruthy();
        expect(firstTest.testType).toBe('pir');
        expect(firstTest.completedAt).toBeTruthy();
      }
    });

    it('deve retornar testes PIR na procedure getTests', async () => {
      if (!db) throw new Error('Database not available');

      // Buscar um funcionário que tenha teste PIR
      const [pirTest] = await db
        .select()
        .from(testResults)
        .where(
          sql`${testResults.testType} = 'pir' AND ${testResults.completedAt} IS NOT NULL AND ${testResults.employeeId} IS NOT NULL`
        )
        .limit(1);

      if (!pirTest || !pirTest.employeeId) {
        console.log('⚠️ Nenhum teste PIR encontrado para testar');
        return;
      }

      console.log(`Testando com employeeId: ${pirTest.employeeId}`);

      // Buscar o employee e seu userId
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, pirTest.employeeId))
        .limit(1);

      if (!employee || !employee.userId) {
        console.log('⚠️ Funcionário não tem userId associado');
        return;
      }

      // Criar contexto mock com o userId do funcionário
      const mockContext = {
        user: { id: employee.userId, role: 'user' as const, openId: 'test-user' },
        req: {} as any,
        res: {} as any,
      };

      const caller = appRouter.createCaller(mockContext);

      // Buscar testes do funcionário
      const tests = await caller.psychometric.getTests();

      console.log(`Total de testes retornados: ${tests.length}`);
      
      // Verificar se tem teste PIR
      const pirTestsFound = tests.filter(t => t.testType === 'pir');
      console.log(`Testes PIR encontrados: ${pirTestsFound.length}`);

      expect(pirTestsFound.length).toBeGreaterThan(0);
      
      if (pirTestsFound.length > 0) {
        const firstPirTest = pirTestsFound[0];
        console.log('Estrutura do teste PIR retornado:', {
          id: firstPirTest.id,
          testType: firstPirTest.testType,
          hasProfile: !!firstPirTest.profile,
          completedAt: firstPirTest.completedAt,
        });

        expect(firstPirTest.testType).toBe('pir');
        // Profile pode ser objeto vazio {} ou objeto com dados
        expect(firstPirTest.profile).toBeDefined();
        expect(firstPirTest.profile).not.toBeNull();
        expect(typeof firstPirTest.profile).toBe('object');
        console.log('✅ Teste PIR está sendo retornado corretamente');
      }
    });

    it('deve combinar testes de ambas as tabelas (psychometricTests + testResults)', async () => {
      if (!db) throw new Error('Database not available');

      // Buscar um funcionário que tenha testes em ambas as tabelas
      const allEmployees = await db.select().from(employees).limit(100);

      for (const emp of allEmployees) {
        if (!emp.userId) continue;

        // Verificar se tem testes na tabela antiga
        const oldTests = await db
          .select()
          .from(psychometricTests)
          .where(eq(psychometricTests.employeeId, emp.id))
          .limit(1);

        // Verificar se tem testes na tabela nova
        const newTests = await db
          .select()
          .from(testResults)
          .where(
            sql`${testResults.employeeId} = ${emp.id} AND ${testResults.completedAt} IS NOT NULL`
          )
          .limit(1);

        if (oldTests.length > 0 && newTests.length > 0) {
          console.log(`Funcionário ${emp.id} tem testes em ambas as tabelas`);

          // Criar contexto e buscar testes
          const mockContext = {
            user: { id: emp.userId, role: 'user' as const, openId: 'test-user' },
            req: {} as any,
            res: {} as any,
          };

          const caller = appRouter.createCaller(mockContext);
          const tests = await caller.psychometric.getTests();

          console.log(`Total de testes combinados: ${tests.length}`);
          
          // Deve ter pelo menos 2 testes (um de cada tabela)
          expect(tests.length).toBeGreaterThanOrEqual(2);
          console.log('✅ Testes de ambas as tabelas estão sendo combinados');
          
          return; // Teste passou
        }
      }

      console.log('⚠️ Nenhum funcionário encontrado com testes em ambas as tabelas');
    });
  });
});
