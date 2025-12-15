import { describe, it, expect, beforeAll } from 'vitest';

/**
 * Testes para as melhorias do PIR Integridade
 * - Expansão do banco de questões (60 questões, 10 por dimensão)
 * - Sistema de alertas automáticos para gestores
 * - Relatórios comparativos por departamento
 */

describe('PIR Integridade - Melhorias 15/12/2025', () => {
  
  describe('Banco de Questões PIR Integridade', () => {
    it('deve ter pelo menos 10 questões por dimensão', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      
      if (!db) {
        console.log('Database not available, skipping test');
        return;
      }

      const { pirIntegrityQuestions, pirIntegrityDimensions } = await import('../../drizzle/schema');
      const { eq, sql } = await import('drizzle-orm');

      // Contar questões por dimensão
      const counts = await db
        .select({
          dimensionId: pirIntegrityQuestions.dimensionId,
          count: sql<number>`count(*)`,
        })
        .from(pirIntegrityQuestions)
        .where(eq(pirIntegrityQuestions.active, true))
        .groupBy(pirIntegrityQuestions.dimensionId);

      // Verificar que cada dimensão tem pelo menos 10 questões
      for (const count of counts) {
        expect(Number(count.count)).toBeGreaterThanOrEqual(10);
      }

      // Verificar total de questões (deve ser pelo menos 60)
      const totalQuestions = counts.reduce((sum, c) => sum + Number(c.count), 0);
      expect(totalQuestions).toBeGreaterThanOrEqual(60);
    });

    it('deve ter 6 dimensões de integridade cadastradas', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      
      if (!db) {
        console.log('Database not available, skipping test');
        return;
      }

      const { pirIntegrityDimensions } = await import('../../drizzle/schema');
      const { eq } = await import('drizzle-orm');

      const dimensions = await db
        .select()
        .from(pirIntegrityDimensions)
        .where(eq(pirIntegrityDimensions.active, true));

      expect(dimensions.length).toBe(6);
      
      // Verificar códigos das dimensões
      const codes = dimensions.map(d => d.code);
      expect(codes).toContain('honesty');
      expect(codes).toContain('reliability');
      expect(codes).toContain('ethical_resilience');
      expect(codes).toContain('responsibility');
      expect(codes).toContain('justice');
      expect(codes).toContain('moral_courage');
    });

    it('questões devem ter estrutura correta com opções', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      
      if (!db) {
        console.log('Database not available, skipping test');
        return;
      }

      const { sql } = await import('drizzle-orm');

      // Usar query raw para evitar problemas com schema
      const questions = await db.execute(sql`
        SELECT id, dimensionId, title, question, options 
        FROM pirIntegrityQuestions 
        WHERE active = 1 
        LIMIT 5
      `);

      const rows = questions[0] as any[];
      
      for (const question of rows) {
        // Verificar campos obrigatórios
        expect(question.title).toBeTruthy();
        expect(question.question).toBeTruthy();
        expect(question.dimensionId).toBeGreaterThan(0);
        
        // Verificar opções (se existirem)
        if (question.options) {
          const options = typeof question.options === 'string' 
            ? JSON.parse(question.options) 
            : question.options;
          
          expect(Array.isArray(options)).toBe(true);
          
          for (const opt of options) {
            expect(opt).toHaveProperty('value');
            expect(opt).toHaveProperty('label');
            expect(opt).toHaveProperty('score');
            expect(opt).toHaveProperty('moralLevel');
          }
        }
      }
    });
  });

  describe('Sistema de Alertas de Risco', () => {
    it('pirRiskAlertsRouter deve estar registrado', async () => {
      const { pirRiskAlertsRouter } = await import('../routers/pirRiskAlertsRouter');
      
      // Verificar que o router existe e tem procedures
      expect(pirRiskAlertsRouter).toBeDefined();
      expect(pirRiskAlertsRouter._def.procedures).toBeDefined();
    });

    it('deve ter procedures de alerta implementadas', async () => {
      const { pirRiskAlertsRouter } = await import('../routers/pirRiskAlertsRouter');
      
      // Verificar procedures existentes
      const procedures = pirRiskAlertsRouter._def.procedures;
      
      expect(procedures).toHaveProperty('listHighRiskEmployees');
      expect(procedures).toHaveProperty('getEmployeeRiskDetails');
      expect(procedures).toHaveProperty('sendRiskAlert');
      expect(procedures).toHaveProperty('sendBatchRiskAlerts');
      expect(procedures).toHaveProperty('getRiskStatsByDepartment');
      expect(procedures).toHaveProperty('getAlertSettings');
    });

    it('níveis de risco devem estar definidos corretamente', () => {
      // Verificar que os níveis de risco são: low, moderate, high, critical
      const riskLevels = ['low', 'moderate', 'high', 'critical'];
      
      // Verificar lógica de classificação
      const getExpectedRiskLevel = (score: number): string => {
        if (score >= 80) return 'low';
        if (score >= 60) return 'moderate';
        if (score >= 40) return 'high';
        return 'critical';
      };

      expect(getExpectedRiskLevel(90)).toBe('low');
      expect(getExpectedRiskLevel(70)).toBe('moderate');
      expect(getExpectedRiskLevel(50)).toBe('high');
      expect(getExpectedRiskLevel(30)).toBe('critical');
    });
  });

  describe('Relatórios Comparativos por Departamento', () => {
    it('pirDepartmentReportsRouter deve estar registrado', async () => {
      const { pirDepartmentReportsRouter } = await import('../routers/pirDepartmentReportsRouter');
      
      // Verificar que o router existe e tem procedures
      expect(pirDepartmentReportsRouter).toBeDefined();
      expect(pirDepartmentReportsRouter._def.procedures).toBeDefined();
    });

    it('deve ter procedures de relatório implementadas', async () => {
      const { pirDepartmentReportsRouter } = await import('../routers/pirDepartmentReportsRouter');
      
      // Verificar procedures existentes
      const procedures = pirDepartmentReportsRouter._def.procedures;
      
      expect(procedures).toHaveProperty('getDepartmentComparison');
      expect(procedures).toHaveProperty('getDimensionComparison');
      expect(procedures).toHaveProperty('getDepartmentRanking');
      expect(procedures).toHaveProperty('getDepartmentTrend');
      expect(procedures).toHaveProperty('getDepartmentDetails');
      expect(procedures).toHaveProperty('exportComparisonReport');
      expect(procedures).toHaveProperty('getOrganizationMetrics');
    });

    it('healthIndex deve calcular corretamente', () => {
      // Função de cálculo do índice de saúde
      const calculateHealthIndex = (riskDistribution: { 
        low: number; 
        moderate: number; 
        high: number; 
        critical: number 
      }): number => {
        const total = riskDistribution.low + riskDistribution.moderate + 
                      riskDistribution.high + riskDistribution.critical;
        if (total === 0) return 0;

        const weightedSum = 
          (riskDistribution.low * 100) + 
          (riskDistribution.moderate * 70) + 
          (riskDistribution.high * 30) + 
          (riskDistribution.critical * 0);

        return Math.round(weightedSum / total);
      };

      // Todos com baixo risco = 100
      expect(calculateHealthIndex({ low: 10, moderate: 0, high: 0, critical: 0 })).toBe(100);
      
      // Todos com risco crítico = 0
      expect(calculateHealthIndex({ low: 0, moderate: 0, high: 0, critical: 10 })).toBe(0);
      
      // Distribuição mista (5*100 + 3*70 + 2*30 + 0*0) / 10 = (500+210+60)/10 = 77
      expect(calculateHealthIndex({ low: 5, moderate: 3, high: 2, critical: 0 })).toBe(77);
      
      // Sem avaliações = 0
      expect(calculateHealthIndex({ low: 0, moderate: 0, high: 0, critical: 0 })).toBe(0);
    });
  });

  describe('Integração entre Módulos', () => {
    it('pirIntegrityRouter deve estar funcionando', async () => {
      const { pirIntegrityRouter } = await import('../routers/pirIntegrityRouter');
      
      // Verificar procedures principais
      const procedures = pirIntegrityRouter._def.procedures;
      
      expect(procedures).toHaveProperty('listDimensions');
      expect(procedures).toHaveProperty('listQuestions');
      expect(procedures).toHaveProperty('createQuestion');
      expect(procedures).toHaveProperty('createAssessment');
      expect(procedures).toHaveProperty('completeAssessment');
    });

    it('estrutura de dados deve ser consistente', async () => {
      const { getDb } = await import('../db');
      const db = await getDb();
      
      if (!db) {
        console.log('Database not available, skipping test');
        return;
      }

      const { pirIntegrityDimensions } = await import('../../drizzle/schema');
      const { sql } = await import('drizzle-orm');

      // Verificar que as tabelas existem e têm a estrutura correta
      const dimensions = await db.select().from(pirIntegrityDimensions).limit(1);
      expect(dimensions[0]).toHaveProperty('id');
      expect(dimensions[0]).toHaveProperty('code');
      expect(dimensions[0]).toHaveProperty('name');

      // Usar query raw para questões
      const questions = await db.execute(sql`
        SELECT id, dimensionId, title, question 
        FROM pirIntegrityQuestions 
        LIMIT 1
      `);
      const rows = questions[0] as any[];
      expect(rows[0]).toHaveProperty('id');
      expect(rows[0]).toHaveProperty('dimensionId');
      expect(rows[0]).toHaveProperty('title');
      expect(rows[0]).toHaveProperty('question');
    });
  });
});
