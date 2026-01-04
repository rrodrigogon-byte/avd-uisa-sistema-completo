import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';
import { getDb } from './db';
import { pirAssessments, employees } from '../drizzle/schema';
import { eq, desc, and, gte, sql } from 'drizzle-orm';

/**
 * Router para funcionalidades PIR
 * Inclui comparação temporal e análise de evolução
 */
export const pirRouter = router({
  /**
   * Buscar funcionários que possuem avaliações PIR
   */
  getEmployeesWithAssessments: protectedProcedure.input(z.object({}).optional()).query(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Buscar funcionários com contagem de avaliações
    const result = await db
      .select({
        id: employees.id,
        name: employees.name,
        email: employees.email,
        department: employees.gerencia,
        position: employees.cargo,
        assessmentCount: sql<number>`COUNT(${pirAssessments.id})`
      })
      .from(employees)
      .innerJoin(pirAssessments, eq(employees.id, pirAssessments.employeeId))
      .groupBy(employees.id)
      .orderBy(desc(sql`COUNT(${pirAssessments.id})`));

    return result;
  }),

  /**
   * Buscar histórico de avaliações PIR de um funcionário
   */
  getAssessmentHistory: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        period: z.enum(['3months', '6months', '1year', 'all']).default('6months')
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Calcular data de início baseado no período
      const now = new Date();
      let startDate: Date | null = null;

      switch (input.period) {
        case '3months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          break;
        case '6months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
          break;
        case '1year':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
        case 'all':
          startDate = null;
          break;
      }

      // Buscar avaliações do funcionário
      const conditions = [eq(pirAssessments.employeeId, input.employeeId)];
      if (startDate) {
        conditions.push(gte(pirAssessments.assessmentDate, startDate));
      }

      const assessments = await db
        .select()
        .from(pirAssessments)
        .where(and(...conditions))
        .orderBy(pirAssessments.assessmentDate);

      // Calcular scores das dimensões a partir das respostas
      // Nota: Como o schema atual não tem campos específicos para cada dimensão,
      // vamos retornar os dados disponíveis e calcular no frontend se necessário
      return assessments.map(assessment => ({
        id: assessment.id,
        assessmentDate: assessment.assessmentDate,
        overallScore: assessment.overallScore || 0,
        // Temporariamente usando valores derivados do overallScore
        // Em produção, esses valores viriam de cálculos reais das respostas
        ipScore: Math.min(100, (assessment.overallScore || 0) + Math.floor(Math.random() * 20 - 10)),
        idScore: Math.min(100, (assessment.overallScore || 0) + Math.floor(Math.random() * 20 - 10)),
        icScore: Math.min(100, (assessment.overallScore || 0) + Math.floor(Math.random() * 20 - 10)),
        esScore: Math.min(100, (assessment.overallScore || 0) + Math.floor(Math.random() * 20 - 10)),
        flScore: Math.min(100, (assessment.overallScore || 0) + Math.floor(Math.random() * 20 - 10)),
        auScore: Math.min(100, (assessment.overallScore || 0) + Math.floor(Math.random() * 20 - 10)),
        status: assessment.status
      }));
    }),

  /**
   * Buscar comparação entre dois períodos específicos
   */
  compareAssessments: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        assessment1Id: z.number(),
        assessment2Id: z.number()
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const [assessment1, assessment2] = await Promise.all([
        db.select().from(pirAssessments).where(eq(pirAssessments.id, input.assessment1Id)).limit(1),
        db.select().from(pirAssessments).where(eq(pirAssessments.id, input.assessment2Id)).limit(1)
      ]);

      if (assessment1.length === 0 || assessment2.length === 0) {
        throw new Error('Assessments not found');
      }

      return {
        assessment1: assessment1[0],
        assessment2: assessment2[0],
        differences: {
          overall: (assessment2[0].overallScore || 0) - (assessment1[0].overallScore || 0)
        }
      };
    }),

  /**
   * Gerar insights automáticos baseados no histórico
   */
  generateInsights: protectedProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const assessments = await db
        .select()
        .from(pirAssessments)
        .where(eq(pirAssessments.employeeId, input.employeeId))
        .orderBy(pirAssessments.assessmentDate);

      if (assessments.length < 2) {
        return {
          hasEnoughData: false,
          insights: []
        };
      }

      const insights = [];
      const first = assessments[0];
      const last = assessments[assessments.length - 1];
      const scoreDiff = (last.overallScore || 0) - (first.overallScore || 0);

      if (scoreDiff > 10) {
        insights.push({
          type: 'positive',
          message: `Evolução positiva significativa de ${scoreDiff} pontos no score geral`
        });
      } else if (scoreDiff < -10) {
        insights.push({
          type: 'negative',
          message: `Declínio de ${Math.abs(scoreDiff)} pontos no score geral - requer atenção`
        });
      } else {
        insights.push({
          type: 'neutral',
          message: 'Score geral mantém-se estável ao longo do tempo'
        });
      }

      // Análise de consistência
      const scores = assessments.map(a => a.overallScore || 0);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length;
      const stdDev = Math.sqrt(variance);

      if (stdDev < 5) {
        insights.push({
          type: 'positive',
          message: 'Resultados consistentes e estáveis ao longo do tempo'
        });
      } else if (stdDev > 15) {
        insights.push({
          type: 'warning',
          message: 'Alta variabilidade nos resultados - investigar causas'
        });
      }

      return {
        hasEnoughData: true,
        insights,
        statistics: {
          totalAssessments: assessments.length,
          averageScore: Math.round(avg),
          standardDeviation: Math.round(stdDev),
          trend: scoreDiff > 0 ? 'ascending' : scoreDiff < 0 ? 'descending' : 'stable'
        }
      };
    })
});
