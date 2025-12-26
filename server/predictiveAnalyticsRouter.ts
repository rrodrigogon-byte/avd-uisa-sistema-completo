/**
 * Predictive Analytics Router
 * Dashboard de Análise Preditiva com ML e predições
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  employees,
  performanceEvaluations,
  goals,
  pdiPlans,
  feedbacks,
  nineBoxPositions,
  departments,
  positions,
} from "../drizzle/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const predictiveAnalyticsRouter = router({
  /**
   * Análise de Risco de Turnover
   * Identifica funcionários com alto risco de saída
   */
  turnoverRisk: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Buscar todos os funcionários ativos
    const activeEmployees = await db
      .select({
        id: employees.id,
        name: employees.name,
        email: employees.email,
        department: departments.name,
        position: positions.name,
        hireDate: employees.hireDate,
        salary: employees.salary,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(positions, eq(employees.positionId, positions.id))
      .where(eq(employees.active, true));

    // Para cada funcionário, calcular score de risco
    const predictions = await Promise.all(
      activeEmployees.map(async (employee) => {
        const riskScore = await calculateTurnoverRisk(db, employee.id);
        return {
          employeeId: employee.id,
          employeeName: employee.name,
          department: employee.department,
          position: employee.position,
          riskScore: riskScore.score,
          riskLevel: riskScore.level,
          factors: riskScore.factors,
          recommendations: riskScore.recommendations,
        };
      })
    );

    // Ordenar por risco (maior primeiro)
    return predictions.sort((a, b) => b.riskScore - a.riskScore);
  }),

  /**
   * Análise de Tendência de Performance
   * Prediz tendência de performance futura
   */
  performanceTrend: protectedProcedure
    .input(z.object({ employeeId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const employeeId = input.employeeId || ctx.user.id;

      // Buscar histórico de avaliações
      const evaluations = await db
        .select()
        .from(performanceEvaluations)
        .where(eq(performanceEvaluations.employeeId, employeeId))
        .orderBy(desc(performanceEvaluations.evaluationDate));

      if (evaluations.length < 2) {
        return {
          trend: "insufficient_data",
          prediction: null,
          confidence: 0,
          message: "Dados insuficientes para análise de tendência (mínimo 2 avaliações)",
        };
      }

      // Calcular tendência
      const ratings = evaluations.map((e) => e.overallRating || 0).reverse();
      const trend = calculateTrend(ratings);
      const prediction = predictNextRating(ratings);

      return {
        trend: trend.direction,
        trendPercentage: trend.percentage,
        currentRating: ratings[ratings.length - 1],
        predictedRating: prediction.value,
        confidence: prediction.confidence,
        historicalData: ratings,
        insights: generatePerformanceInsights(trend, prediction),
      };
    }),

  /**
   * Análise de Necessidades de Treinamento
   * Identifica gaps de competências e sugere treinamentos
   */
  trainingNeeds: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Buscar todos os funcionários
    const allEmployees = await db
      .select({
        id: employees.id,
        name: employees.name,
        department: departments.name,
        position: positions.name,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(positions, eq(employees.positionId, positions.id))
      .where(eq(employees.active, true));

    // Para cada funcionário, identificar necessidades
    const needs = await Promise.all(
      allEmployees.map(async (employee) => {
        const gaps = await identifyCompetencyGaps(db, employee.id);
        return {
          employeeId: employee.id,
          employeeName: employee.name,
          department: employee.department,
          position: employee.position,
          competencyGaps: gaps,
          priority: calculateTrainingPriority(gaps),
          suggestedTrainings: suggestTrainings(gaps),
        };
      })
    );

    // Ordenar por prioridade
    return needs.sort((a, b) => b.priority - a.priority);
  }),

  /**
   * Análise de Prontidão para Promoção
   * Identifica funcionários prontos para promoção
   */
  promotionReadiness: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const allEmployees = await db
      .select({
        id: employees.id,
        name: employees.name,
        department: departments.name,
        position: positions.name,
        hireDate: employees.hireDate,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(positions, eq(employees.positionId, positions.id))
      .where(eq(employees.active, true));

    const readiness = await Promise.all(
      allEmployees.map(async (employee) => {
        const score = await calculatePromotionReadiness(db, employee.id);
        return {
          employeeId: employee.id,
          employeeName: employee.name,
          department: employee.department,
          currentPosition: employee.position,
          readinessScore: score.score,
          readinessLevel: score.level,
          strengths: score.strengths,
          developmentAreas: score.developmentAreas,
          timeInPosition: calculateTimeInPosition(employee.hireDate),
          recommendedActions: score.actions,
        };
      })
    );

    return readiness.sort((a, b) => b.readinessScore - a.readinessScore);
  }),

  /**
   * Score de Engajamento
   * Prediz nível de engajamento dos funcionários
   */
  engagementScore: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const allEmployees = await db
      .select({
        id: employees.id,
        name: employees.name,
        department: departments.name,
        position: positions.name,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(positions, eq(employees.positionId, positions.id))
      .where(eq(employees.active, true));

    const scores = await Promise.all(
      allEmployees.map(async (employee) => {
        const engagement = await calculateEngagementScore(db, employee.id);
        return {
          employeeId: employee.id,
          employeeName: employee.name,
          department: employee.department,
          position: employee.position,
          engagementScore: engagement.score,
          engagementLevel: engagement.level,
          indicators: engagement.indicators,
          alerts: engagement.alerts,
          recommendations: engagement.recommendations,
        };
      })
    );

    return scores.sort((a, b) => a.engagementScore - b.engagementScore); // Menor score = maior risco
  }),

  /**
   * Alertas Proativos
   * Lista todos os alertas gerados pelas predições
   */
  proactiveAlerts: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Gerar alertas baseados nas análises
    const turnoverRisks = await db
      .select({
        id: employees.id,
        name: employees.name,
      })
      .from(employees)
      .where(eq(employees.active, true));

    const alerts = [];

    for (const employee of turnoverRisks) {
      const risk = await calculateTurnoverRisk(db, employee.id);
      if (risk.score >= 70) {
        alerts.push({
          type: "high_turnover_risk",
          severity: "critical",
          employeeId: employee.id,
          employeeName: employee.name,
          message: `${employee.name} apresenta alto risco de saída (${risk.score}%)`,
          actions: risk.recommendations,
        });
      }
    }

    return alerts;
  }),
});

// ============================================================================
// FUNÇÕES AUXILIARES DE CÁLCULO
// ============================================================================

async function calculateTurnoverRisk(db: any, employeeId: number) {
  let score = 0;
  const factors = [];
  const recommendations = [];

  // Fator 1: Performance recente
  const recentEvals = await db
    .select()
    .from(performanceEvaluations)
    .where(eq(performanceEvaluations.employeeId, employeeId))
    .orderBy(desc(performanceEvaluations.evaluationDate))
    .limit(2);

  if (recentEvals.length > 0 && recentEvals[0].overallRating && recentEvals[0].overallRating < 3) {
    score += 25;
    factors.push({ factor: "Performance abaixo da média", impact: 25 });
    recommendations.push({ action: "Reunião de feedback", priority: "high" });
  }

  // Fator 2: Metas não atingidas
  const goals = await db
    .select()
    .from(goals)
    .where(and(eq(goals.employeeId, employeeId), eq(goals.status, "em_andamento")));

  const overdueGoals = goals.filter((g: any) => g.endDate && new Date(g.endDate) < new Date());
  if (overdueGoals.length > 0) {
    score += 20;
    factors.push({ factor: `${overdueGoals.length} metas atrasadas`, impact: 20 });
    recommendations.push({ action: "Revisar metas e prazos", priority: "medium" });
  }

  // Fator 3: Falta de PDI ativo
  const activePdi = await db
    .select()
    .from(pdiPlans)
    .where(and(eq(pdiPlans.employeeId, employeeId), eq(pdiPlans.status, "em_andamento")))
    .limit(1);

  if (activePdi.length === 0) {
    score += 15;
    factors.push({ factor: "Sem plano de desenvolvimento ativo", impact: 15 });
    recommendations.push({ action: "Criar PDI personalizado", priority: "medium" });
  }

  // Fator 4: Feedback negativo recente
  const recentFeedback = await db
    .select()
    .from(feedbacks)
    .where(eq(feedbacks.receiverId, employeeId))
    .orderBy(desc(feedbacks.createdAt))
    .limit(5);

  const negativeFeedback = recentFeedback.filter((f: any) => f.rating && f.rating < 3);
  if (negativeFeedback.length >= 3) {
    score += 20;
    factors.push({ factor: "Múltiplos feedbacks negativos", impact: 20 });
    recommendations.push({ action: "Sessão de coaching", priority: "high" });
  }

  // Fator 5: Tempo sem promoção/reconhecimento
  const lastPromotion = await db
    .select()
    .from(nineBoxPositions)
    .where(eq(nineBoxPositions.employeeId, employeeId))
    .orderBy(desc(nineBoxPositions.evaluationDate))
    .limit(1);

  if (lastPromotion.length === 0) {
    score += 20;
    factors.push({ factor: "Sem avaliação de potencial", impact: 20 });
    recommendations.push({ action: "Avaliar potencial e plano de carreira", priority: "high" });
  }

  const level = score >= 70 ? "critical" : score >= 50 ? "high" : score >= 30 ? "medium" : "low";

  return { score, level, factors, recommendations };
}

function calculateTrend(ratings: number[]) {
  if (ratings.length < 2) return { direction: "stable", percentage: 0 };

  const firstHalf = ratings.slice(0, Math.floor(ratings.length / 2));
  const secondHalf = ratings.slice(Math.floor(ratings.length / 2));

  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const diff = avgSecond - avgFirst;
  const percentage = Math.round((diff / avgFirst) * 100);

  const direction = diff > 0.2 ? "improving" : diff < -0.2 ? "declining" : "stable";

  return { direction, percentage };
}

function predictNextRating(ratings: number[]) {
  // Regressão linear simples
  const n = ratings.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = ratings;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const predicted = slope * n + intercept;
  const confidence = Math.min(95, 50 + n * 5); // Mais dados = mais confiança

  return {
    value: Math.max(1, Math.min(5, Math.round(predicted * 10) / 10)),
    confidence,
  };
}

function generatePerformanceInsights(trend: any, prediction: any) {
  const insights = [];

  if (trend.direction === "improving") {
    insights.push("Tendência positiva de melhoria de performance");
    insights.push("Continue investindo no desenvolvimento deste colaborador");
  } else if (trend.direction === "declining") {
    insights.push("Atenção: Performance em declínio");
    insights.push("Recomenda-se intervenção imediata com feedback e suporte");
  } else {
    insights.push("Performance estável");
    insights.push("Considere novos desafios para estimular crescimento");
  }

  if (prediction.confidence > 70) {
    insights.push(`Alta confiança na predição (${prediction.confidence}%)`);
  }

  return insights;
}

async function identifyCompetencyGaps(db: any, employeeId: number) {
  // Buscar feedbacks recentes para identificar áreas de melhoria
  const feedbacks = await db
    .select()
    .from(feedbacks)
    .where(eq(feedbacks.receiverId, employeeId))
    .orderBy(desc(feedbacks.createdAt))
    .limit(10);

  const gaps = [];

  // Análise simplificada baseada em feedbacks
  const lowRatings = feedbacks.filter((f: any) => f.rating && f.rating < 3);
  if (lowRatings.length > 0) {
    gaps.push({
      competency: "Comunicação",
      currentLevel: 2,
      targetLevel: 4,
      gap: 2,
      priority: "high",
    });
  }

  return gaps;
}

function calculateTrainingPriority(gaps: any[]) {
  return gaps.reduce((total, gap) => total + gap.gap * (gap.priority === "high" ? 2 : 1), 0);
}

function suggestTrainings(gaps: any[]) {
  return gaps.map((gap) => ({
    competency: gap.competency,
    training: `Curso de ${gap.competency} - Nível Intermediário`,
    duration: "40 horas",
    priority: gap.priority,
  }));
}

async function calculatePromotionReadiness(db: any, employeeId: number) {
  let score = 0;
  const strengths = [];
  const developmentAreas = [];
  const actions = [];

  // Fator 1: Performance consistente
  const recentEvals = await db
    .select()
    .from(performanceEvaluations)
    .where(eq(performanceEvaluations.employeeId, employeeId))
    .orderBy(desc(performanceEvaluations.evaluationDate))
    .limit(3);

  const avgRating = recentEvals.reduce((sum: number, e: any) => sum + (e.overallRating || 0), 0) / (recentEvals.length || 1);
  if (avgRating >= 4) {
    score += 30;
    strengths.push("Performance consistentemente alta");
  } else if (avgRating < 3) {
    developmentAreas.push("Melhorar performance geral");
  }

  // Fator 2: Metas atingidas
  const completedGoals = await db
    .select()
    .from(goals)
    .where(and(eq(goals.employeeId, employeeId), eq(goals.status, "concluida")));

  if (completedGoals.length >= 5) {
    score += 25;
    strengths.push("Histórico sólido de atingimento de metas");
  } else {
    developmentAreas.push("Aumentar taxa de conclusão de metas");
  }

  // Fator 3: PDI concluído
  const completedPdi = await db
    .select()
    .from(pdiPlans)
    .where(and(eq(pdiPlans.employeeId, employeeId), eq(pdiPlans.status, "concluido")));

  if (completedPdi.length > 0) {
    score += 20;
    strengths.push("Comprometimento com desenvolvimento");
  } else {
    developmentAreas.push("Completar plano de desenvolvimento");
    actions.push({ action: "Criar e executar PDI", priority: "high" });
  }

  // Fator 4: Feedback positivo
  const positiveFeedback = await db
    .select()
    .from(feedbacks)
    .where(eq(feedbacks.receiverId, employeeId))
    .orderBy(desc(feedbacks.createdAt))
    .limit(10);

  const highRatings = positiveFeedback.filter((f: any) => f.rating && f.rating >= 4);
  if (highRatings.length >= 7) {
    score += 25;
    strengths.push("Reconhecimento consistente dos pares");
  }

  const level = score >= 80 ? "ready" : score >= 60 ? "almost_ready" : score >= 40 ? "developing" : "not_ready";

  return { score, level, strengths, developmentAreas, actions };
}

function calculateTimeInPosition(hireDate: Date | null) {
  if (!hireDate) return 0;
  const now = new Date();
  const diff = now.getTime() - new Date(hireDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 30)); // meses
}

async function calculateEngagementScore(db: any, employeeId: number) {
  let score = 100; // Começa com 100 e deduz pontos
  const indicators = [];
  const alerts = [];
  const recommendations = [];

  // Indicador 1: Participação em feedbacks
  const feedbacksGiven = await db
    .select()
    .from(feedbacks)
    .where(eq(feedbacks.giverId, employeeId));

  if (feedbacksGiven.length < 3) {
    score -= 20;
    indicators.push({ indicator: "Baixa participação em feedbacks", impact: -20 });
    alerts.push("Funcionário pouco engajado em dar feedback");
    recommendations.push({ action: "Incentivar cultura de feedback", priority: "medium" });
  }

  // Indicador 2: Progresso em metas
  const activeGoals = await db
    .select()
    .from(goals)
    .where(and(eq(goals.employeeId, employeeId), eq(goals.status, "em_andamento")));

  const lowProgressGoals = activeGoals.filter((g: any) => (g.progress || 0) < 30);
  if (lowProgressGoals.length > 2) {
    score -= 25;
    indicators.push({ indicator: "Múltiplas metas com baixo progresso", impact: -25 });
    alerts.push("Possível desengajamento com objetivos");
    recommendations.push({ action: "Revisar metas e remover bloqueios", priority: "high" });
  }

  // Indicador 3: PDI ativo
  const activePdi = await db
    .select()
    .from(pdiPlans)
    .where(and(eq(pdiPlans.employeeId, employeeId), eq(pdiPlans.status, "em_andamento")));

  if (activePdi.length === 0) {
    score -= 15;
    indicators.push({ indicator: "Sem PDI ativo", impact: -15 });
    recommendations.push({ action: "Criar plano de desenvolvimento", priority: "medium" });
  }

  const level = score >= 80 ? "high" : score >= 60 ? "medium" : score >= 40 ? "low" : "very_low";

  return { score, level, indicators, alerts, recommendations };
}
