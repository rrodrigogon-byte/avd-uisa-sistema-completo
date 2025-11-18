import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
  competencies,
  employees,
  employeeCompetencies,
  pdiCompetencyGaps,
  pdiIntelligentDetails,
  pdiItems,
  pdiPlans,
  pdiReviews,
  pdiRisks,
  positionCompetencies,
  positions,
  psychometricTests,
} from "../drizzle/schema";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";

/**
 * Router para PDI Inteligente
 * Sistema avançado de desenvolvimento para sucessão estratégica
 */

export const pdiIntelligentRouter = router({
  /**
   * Criar PDI Inteligente com análise automática de gaps
   */
  create: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        cycleId: z.number(),
        targetPositionId: z.number(),
        startDate: z.string(),
        endDate: z.string(),
        strategicContext: z.string(),
        durationMonths: z.number().default(24),
        mentorId: z.number().optional(),
        sponsorId1: z.number().optional(),
        sponsorId2: z.number().optional(),
        guardianId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // 1. Buscar perfil atual do colaborador (testes psicométricos)
      const currentTests = await db
        .select()
        .from(psychometricTests)
        .where(eq(psychometricTests.employeeId, input.employeeId))
        .orderBy(desc(psychometricTests.completedAt))
        .limit(1);

      const currentProfile = currentTests[0]
        ? {
            disc: {
              d: currentTests[0].discDominance || 0,
              i: currentTests[0].discInfluence || 0,
              s: currentTests[0].discSteadiness || 0,
              c: currentTests[0].discCompliance || 0,
            },
            bigFive: {
              o: currentTests[0].bigFiveOpenness || 0,
              c: currentTests[0].bigFiveConscientiousness || 0,
              e: currentTests[0].bigFiveExtraversion || 0,
              a: currentTests[0].bigFiveAgreeableness || 0,
              n: currentTests[0].bigFiveNeuroticism || 0,
            },
          }
        : null;

      // 2. Buscar competências atuais do colaborador
      const currentCompetencies = await db
        .select()
        .from(employeeCompetencies)
        .where(eq(employeeCompetencies.employeeId, input.employeeId));

      // 3. Buscar competências requeridas pela posição-alvo
      const targetCompetencies = await db
        .select()
        .from(positionCompetencies)
        .where(eq(positionCompetencies.positionId, input.targetPositionId));

      // 4. Criar o PDI Plan base
      const [plan] = await db
        .insert(pdiPlans)
        .values({
          cycleId: input.cycleId,
          employeeId: input.employeeId,
          targetPositionId: input.targetPositionId,
          status: "rascunho",
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
          overallProgress: 0,
        })
        .$returningId();

      // 5. Criar detalhes inteligentes do PDI
      await db.insert(pdiIntelligentDetails).values({
        planId: plan.id,
        strategicContext: input.strategicContext,
        durationMonths: input.durationMonths,
        mentorId: input.mentorId,
        sponsorId1: input.sponsorId1,
        sponsorId2: input.sponsorId2,
        guardianId: input.guardianId,
        currentProfile: currentProfile,
        targetProfile: null, // Será preenchido posteriormente
        gapsAnalysis: null,
        milestone12Months: "Conclusão do primeiro ano do PDI com evolução comprovada nos gaps identificados",
        milestone24Months: "Conclusão de todas as ações do PDI e elegibilidade para posição executiva",
      });

      // 6. Identificar e criar gaps de competências
      const gaps: any[] = [];
      for (const targetComp of targetCompetencies) {
        const currentComp = currentCompetencies.find((cc: any) => cc.competencyId === targetComp.competencyId);
        const currentLevel = currentComp?.currentLevel || 0;
        const targetLevel = targetComp.requiredLevel;
        const gap = targetLevel - currentLevel;

        if (gap > 0) {
          gaps.push({
            planId: plan.id,
            competencyId: targetComp.competencyId,
            currentLevel,
            targetLevel,
            gap,
            priority: gap >= 3 ? "alta" : gap >= 2 ? "media" : "baixa",
            status: "identificado",
          });
        }
      }

      if (gaps.length > 0) {
        await db.insert(pdiCompetencyGaps).values(gaps);
      }

      return {
        success: true,
        planId: plan.id,
        gapsCount: gaps.length,
      };
    }),

  /**
   * Buscar PDI Inteligente por ID com todos os detalhes
   */
  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const [plan] = await db
      .select()
      .from(pdiPlans)
      .leftJoin(employees, eq(pdiPlans.employeeId, employees.id))
      .leftJoin(positions, eq(pdiPlans.targetPositionId, positions.id))
      .where(eq(pdiPlans.id, input.id))
      .limit(1);

    const items = await db
      .select()
      .from(pdiItems)
      .where(eq(pdiItems.planId, input.id));

    if (!plan) {
      throw new TRPCError({ code: "NOT_FOUND", message: "PDI não encontrado" });
    }

    // Buscar detalhes inteligentes
    const [details] = await db
      .select()
      .from(pdiIntelligentDetails)
      .where(eq(pdiIntelligentDetails.planId, input.id))
      .limit(1);

    // Buscar gaps
    const gaps = await db
      .select({
        id: pdiCompetencyGaps.id,
        competencyId: pdiCompetencyGaps.competencyId,
        competencyName: competencies.name,
        currentLevel: pdiCompetencyGaps.currentLevel,
        targetLevel: pdiCompetencyGaps.targetLevel,
        gap: pdiCompetencyGaps.gap,
        priority: pdiCompetencyGaps.priority,
        employeeActions: pdiCompetencyGaps.employeeActions,
        managerActions: pdiCompetencyGaps.managerActions,
        sponsorActions: pdiCompetencyGaps.sponsorActions,
        status: pdiCompetencyGaps.status,
      })
      .from(pdiCompetencyGaps)
      .leftJoin(competencies, eq(pdiCompetencyGaps.competencyId, competencies.id))
      .where(eq(pdiCompetencyGaps.planId, input.id));

    // Buscar riscos
    const risks = await db.select().from(pdiRisks).where(eq(pdiRisks.planId, input.id));

    // Buscar reviews
    const reviews = await db
      .select({
        id: pdiReviews.id,
        reviewerId: pdiReviews.reviewerId,
        reviewerName: employees.name,
        reviewerRole: pdiReviews.reviewerRole,
        reviewDate: pdiReviews.reviewDate,
        overallProgress: pdiReviews.overallProgress,
        strengths: pdiReviews.strengths,
        improvements: pdiReviews.improvements,
        nextSteps: pdiReviews.nextSteps,
        recommendation: pdiReviews.recommendation,
        createdAt: pdiReviews.createdAt,
      })
      .from(pdiReviews)
      .leftJoin(employees, eq(pdiReviews.reviewerId, employees.id))
      .where(eq(pdiReviews.planId, input.id))
      .orderBy(desc(pdiReviews.reviewDate));

    // Buscar informações dos sponsors/mentores
    let mentor = null;
    let sponsor1 = null;
    let sponsor2 = null;
    let guardian = null;

    if (details?.mentorId) {
      [mentor] = await db.select().from(employees).where(eq(employees.id, details.mentorId)).limit(1);
    }
    if (details?.sponsorId1) {
      [sponsor1] = await db.select().from(employees).where(eq(employees.id, details.sponsorId1)).limit(1);
    }
    if (details?.sponsorId2) {
      [sponsor2] = await db.select().from(employees).where(eq(employees.id, details.sponsorId2)).limit(1);
    }
    if (details?.guardianId) {
      [guardian] = await db.select().from(employees).where(eq(employees.id, details.guardianId)).limit(1);
    }

    return {
      ...plan,
      details,
      gaps,
      risks,
      reviews,
      mentor,
      sponsor1,
      sponsor2,
      guardian,
    };
  }),

  /**
   * Listar PDIs Inteligentes
   */
  list: protectedProcedure
    .input(
      z.object({
        employeeId: z.number().optional(),
        status: z.enum(["rascunho", "pendente_aprovacao", "aprovado", "em_andamento", "concluido", "cancelado"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [];
      if (input.employeeId) {
        conditions.push(eq(pdiPlans.employeeId, input.employeeId));
      }
      if (input.status) {
        conditions.push(eq(pdiPlans.status, input.status));
      }

      const plans = await db
        .select({
          id: pdiPlans.id,
          employeeId: pdiPlans.employeeId,
          employeeName: employees.name,
          targetPositionId: pdiPlans.targetPositionId,
          targetPositionTitle: positions.title,
          status: pdiPlans.status,
          startDate: pdiPlans.startDate,
          endDate: pdiPlans.endDate,
          overallProgress: pdiPlans.overallProgress,
          createdAt: pdiPlans.createdAt,
        })
        .from(pdiPlans)
        .leftJoin(employees, eq(pdiPlans.employeeId, employees.id))
        .leftJoin(positions, eq(pdiPlans.targetPositionId, positions.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(pdiPlans.createdAt));

      return plans;
    }),

  /**
   * Adicionar gap de competência
   */
  addGap: protectedProcedure
    .input(
      z.object({
        planId: z.number(),
        competencyId: z.number(),
        currentLevel: z.number().min(0).max(5),
        targetLevel: z.number().min(1).max(5),
        priority: z.enum(["alta", "media", "baixa"]),
        employeeActions: z.string().optional(),
        managerActions: z.string().optional(),
        sponsorActions: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const gap = input.targetLevel - input.currentLevel;

      await db.insert(pdiCompetencyGaps).values({
        planId: input.planId,
        competencyId: input.competencyId,
        currentLevel: input.currentLevel,
        targetLevel: input.targetLevel,
        gap,
        priority: input.priority,
        employeeActions: input.employeeActions,
        managerActions: input.managerActions,
        sponsorActions: input.sponsorActions,
        status: "identificado",
      });

      return { success: true };
    }),

  /**
   * Atualizar gap de competência
   */
  updateGap: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        employeeActions: z.string().optional(),
        managerActions: z.string().optional(),
        sponsorActions: z.string().optional(),
        status: z.enum(["identificado", "em_desenvolvimento", "superado"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updates: any = {};
      if (input.employeeActions !== undefined) updates.employeeActions = input.employeeActions;
      if (input.managerActions !== undefined) updates.managerActions = input.managerActions;
      if (input.sponsorActions !== undefined) updates.sponsorActions = input.sponsorActions;
      if (input.status) updates.status = input.status;

      await db.update(pdiCompetencyGaps).set(updates).where(eq(pdiCompetencyGaps.id, input.id));

      return { success: true };
    }),

  /**
   * Adicionar risco ao PDI
   */
  addRisk: protectedProcedure
    .input(
      z.object({
        planId: z.number(),
        type: z.enum(["saida", "gap_competencia", "tempo_preparo", "mudanca_estrategica", "outro"]),
        description: z.string(),
        impact: z.enum(["baixo", "medio", "alto", "critico"]),
        probability: z.enum(["baixa", "media", "alta"]),
        mitigation: z.string().optional(),
        responsible: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.insert(pdiRisks).values({
        planId: input.planId,
        type: input.type,
        description: input.description,
        impact: input.impact,
        probability: input.probability,
        mitigation: input.mitigation,
        responsible: input.responsible,
        status: "identificado",
      });

      return { success: true };
    }),

  /**
   * Atualizar risco
   */
  updateRisk: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        mitigation: z.string().optional(),
        status: z.enum(["identificado", "em_mitigacao", "mitigado", "materializado"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updates: any = {};
      if (input.mitigation !== undefined) updates.mitigation = input.mitigation;
      if (input.status) updates.status = input.status;

      await db.update(pdiRisks).set(updates).where(eq(pdiRisks.id, input.id));

      return { success: true };
    }),

  /**
   * Adicionar review/acompanhamento
   */
  addReview: protectedProcedure
    .input(
      z.object({
        planId: z.number(),
        reviewerId: z.number(),
        reviewerRole: z.enum(["mentor", "sponsor", "guardiao"]),
        reviewDate: z.string(),
        overallProgress: z.number().min(0).max(100),
        strengths: z.string().optional(),
        improvements: z.string().optional(),
        nextSteps: z.string().optional(),
        recommendation: z.enum(["manter", "acelerar", "ajustar", "pausar"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.insert(pdiReviews).values({
        planId: input.planId,
        reviewerId: input.reviewerId,
        reviewerRole: input.reviewerRole,
        reviewDate: new Date(input.reviewDate),
        overallProgress: input.overallProgress,
        strengths: input.strengths,
        improvements: input.improvements,
        nextSteps: input.nextSteps,
        recommendation: input.recommendation,
      });

      return { success: true };
    }),

  /**
   * Atualizar status do PDI
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["rascunho", "pendente_aprovacao", "aprovado", "em_andamento", "concluido", "cancelado"]),
        approvedBy: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updates: any = {
        status: input.status,
      };

      if (input.status === "aprovado" && input.approvedBy) {
        updates.approvedBy = input.approvedBy;
        updates.approvedAt = new Date();
      }

      if (input.status === "concluido") {
        updates.completedAt = new Date();
        updates.overallProgress = 100;
      }

      await db.update(pdiPlans).set(updates).where(eq(pdiPlans.id, input.id));

      return { success: true };
    }),

  /**
   * Comparar perfil atual vs. posição-alvo
   */
  compareProfiles: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        targetPositionId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar perfil atual
      const currentTests = await db
        .select()
        .from(psychometricTests)
        .where(eq(psychometricTests.employeeId, input.employeeId))
        .orderBy(desc(psychometricTests.completedAt))
        .limit(1);

      const currentProfile = currentTests[0] || null;

      // Buscar competências atuais
      const currentCompetencies = await db
        .select({
          competencyId: competencies.id,
          competencyName: competencies.name,
          level: sql<number>`${competencies.id}`.as("level"),
        })
        .from(competencies)
        .leftJoin(sql`employee_competencies ec`, sql`ec.competency_id = ${competencies.id} AND ec.employee_id = ${input.employeeId}`);

      // Buscar competências requeridas
      const targetCompetencies = await db
        .select({
          competencyId: competencies.id,
          competencyName: competencies.name,
          requiredLevel: sql<number>`pc.required_level`.as("requiredLevel"),
        })
        .from(competencies)
        .leftJoin(sql`position_competencies pc`, sql`pc.competency_id = ${competencies.id} AND pc.position_id = ${input.targetPositionId}`);

      return {
        currentProfile,
        currentCompetencies,
        targetCompetencies,
      };
    }),

  /**
   * Buscar todos os testes psicométricos de um colaborador
   */
  getEmployeeTests: protectedProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const tests = await db
        .select()
        .from(psychometricTests)
        .where(eq(psychometricTests.employeeId, input.employeeId))
        .orderBy(desc(psychometricTests.completedAt));

      return tests;
    }),

  /**
   * Comparar testes psicométricos do colaborador com perfil da posição-alvo
   */
  compareTestsWithPosition: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        targetPositionId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      // Buscar testes do colaborador
      const employeeTests = await db
        .select()
        .from(psychometricTests)
        .where(eq(psychometricTests.employeeId, input.employeeId))
        .orderBy(desc(psychometricTests.completedAt));

      // Buscar perfil ideal da posição (simulado - em produção viria de uma tabela position_profiles)
      const targetProfile = {
        disc: { D: 70, I: 50, S: 40, C: 60 },
        bigFive: { openness: 70, conscientiousness: 80, extraversion: 60, agreeableness: 50, neuroticism: 30 },
      };

      // Pegar o teste mais recente de cada tipo
      const latestDISC = employeeTests.find((t) => t.testType === "disc");
      const latestBigFive = employeeTests.find((t) => t.testType === "bigfive");

      // Calcular gaps
      const gaps = {
        disc: latestDISC
          ? {
              D: targetProfile.disc.D - (latestDISC.discDominance || 0),
              I: targetProfile.disc.I - (latestDISC.discInfluence || 0),
              S: targetProfile.disc.S - (latestDISC.discSteadiness || 0),
              C: targetProfile.disc.C - (latestDISC.discCompliance || 0),
            }
          : null,
        bigFive: latestBigFive
          ? {
              openness: targetProfile.bigFive.openness - (latestBigFive.bigFiveOpenness || 0),
              conscientiousness: targetProfile.bigFive.conscientiousness - (latestBigFive.bigFiveConscientiousness || 0),
              extraversion: targetProfile.bigFive.extraversion - (latestBigFive.bigFiveExtraversion || 0),
              agreeableness: targetProfile.bigFive.agreeableness - (latestBigFive.bigFiveAgreeableness || 0),
              neuroticism: targetProfile.bigFive.neuroticism - (latestBigFive.bigFiveNeuroticism || 0),
            }
          : null,

      };

      // Gerar recomendações baseadas nos gaps
      const recommendations = [];
      if (gaps.disc) {
        if (gaps.disc.D > 20) recommendations.push("Desenvolver assertividade e tomada de decisão rápida");
        if (gaps.disc.I > 20) recommendations.push("Melhorar habilidades de comunicação e relacionamento interpessoal");
        if (gaps.disc.S > 20) recommendations.push("Fortalecer capacidade de trabalho em equipe e estabilidade");
        if (gaps.disc.C > 20) recommendations.push("Aprimorar atenção a detalhes e processos");
      }
      if (gaps.bigFive) {
        if (gaps.bigFive.conscientiousness > 20) recommendations.push("Desenvolver organização e disciplina");
        if (gaps.bigFive.openness > 20) recommendations.push("Estimular criatividade e abertura a novas ideias");
      }

      return {
        employeeTests: {
          disc: latestDISC,
          bigFive: latestBigFive,
        },
        targetProfile,
        gaps,
        recommendations,
        compatibilityScore: calculateCompatibility(gaps),
      };
    }),
});

/**
 * Calcular score de compatibilidade (0-100)
 */
function calculateCompatibility(gaps: any): number {
  let totalGap = 0;
  let count = 0;

  if (gaps.disc) {
    totalGap += Math.abs(gaps.disc.D) + Math.abs(gaps.disc.I) + Math.abs(gaps.disc.S) + Math.abs(gaps.disc.C);
    count += 4;
  }
  if (gaps.bigFive) {
    totalGap += Math.abs(gaps.bigFive.openness) + Math.abs(gaps.bigFive.conscientiousness) + Math.abs(gaps.bigFive.extraversion) + Math.abs(gaps.bigFive.agreeableness) + Math.abs(gaps.bigFive.neuroticism);
    count += 5;
  }


  if (count === 0) return 0;

  const averageGap = totalGap / count;
  const compatibility = Math.max(0, 100 - averageGap);

  return Math.round(compatibility);
}
