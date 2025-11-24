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
  pdiActions,
  pdiGovernanceReviews,
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
   * Atualizar Pacto de Desenvolvimento (sponsors, mentores, guardiões)
   */
  updatePact: protectedProcedure
    .input(
      z.object({
        planId: z.number(),
        mentorId: z.number().optional(),
        sponsorId1: z.number().optional(),
        sponsorId2: z.number().optional(),
        guardianId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(pdiIntelligentDetails)
        .set({
          mentorId: input.mentorId,
          sponsorId1: input.sponsorId1,
          sponsorId2: input.sponsorId2,
          guardianId: input.guardianId,
        })
        .where(eq(pdiIntelligentDetails.planId, input.planId));

      return { success: true };
    }),

  /**
   * Gerar sugestões automáticas de ações 70-20-10 baseadas nos gaps
   */
  generateActionSuggestions: protectedProcedure
    .input(z.object({ planId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar gaps do PDI
      const gaps = await db
        .select({
          gap: pdiCompetencyGaps,
          competency: competencies,
        })
        .from(pdiCompetencyGaps)
        .leftJoin(competencies, eq(pdiCompetencyGaps.competencyId, competencies.id))
        .where(eq(pdiCompetencyGaps.planId, input.planId));

      // Gerar sugestões baseadas nos gaps
      const suggestions = {
        pratica_70: gaps.slice(0, 3).map((g, i) => ({
          title: `Projeto prático: ${g.competency?.name || 'Competência'}`,
          description: `Liderar projeto que desenvolva ${g.competency?.name?.toLowerCase()} através de aplicação prática no dia a dia`,
          axis: "70_pratica" as const,
          developmentArea: g.competency?.name || "Competência",
          successMetric: `Aumentar nível de ${g.gap.currentLevel} para ${g.gap.targetLevel}`,
          evidenceRequired: "Resultados mensuráveis do projeto + feedback de stakeholders",
          dueDate: new Date(Date.now() + (6 + i * 3) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        })),
        experiencia_20: gaps.slice(0, 2).map((g, i) => ({
          title: `Mentoria/Job Rotation: ${g.competency?.name || 'Competência'}`,
          description: `Participar de programa de mentoria ou rotação de função para desenvolver ${g.competency?.name?.toLowerCase()}`,
          axis: "20_experiencia" as const,
          developmentArea: g.competency?.name || "Competência",
          successMetric: `Experiência documentada em ${g.competency?.name}`,
          evidenceRequired: "Relatório de aprendizados + avaliação do mentor",
          dueDate: new Date(Date.now() + (9 + i * 4) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        })),
        educacao_10: gaps.slice(0, 2).map((g, i) => ({
          title: `Formação: ${g.competency?.name || 'Competência'}`,
          description: `Curso ou certificação em ${g.competency?.name?.toLowerCase()}`,
          axis: "10_educacao" as const,
          developmentArea: g.competency?.name || "Competência",
          successMetric: "Certificado de conclusão + aplicação prática",
          evidenceRequired: "Certificado + apresentação de aprendizados",
          dueDate: new Date(Date.now() + (3 + i * 2) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        })),
      };

      return suggestions;
    }),

  /**
   * Listar principais riscos pré-definidos para PDI
   */
  getMainRisks: protectedProcedure
    .input(z.object({ planId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      // Buscar riscos já cadastrados
      const existingRisks = await db
        .select()
        .from(pdiRisks)
        .where(eq(pdiRisks.planId, input.planId));

      // Riscos principais pré-definidos
      const mainRisks = [
        {
          type: "saida" as const,
          description: "Risco de saída do colaborador durante o período do PDI",
          impact: "critico" as const,
          probability: "media" as const,
          mitigation: "Engajamento contínuo, alinhamento de expectativas e plano de carreira claro",
        },
        {
          type: "gap_competencia" as const,
          description: "Gaps de competências muito grandes que podem inviabilizar o desenvolvimento no prazo",
          impact: "alto" as const,
          probability: "media" as const,
          mitigation: "Revisão trimestral do plano e ajuste de prazos se necessário",
        },
        {
          type: "tempo_preparo" as const,
          description: "Tempo insuficiente para preparação adequada para a posição-alvo",
          impact: "alto" as const,
          probability: "media" as const,
          mitigation: "Priorização de competências críticas e extensão do prazo se necessário",
        },
        {
          type: "mudanca_estrategica" as const,
          description: "Mudanças estratégicas da organização que alterem requisitos da posição-alvo",
          impact: "medio" as const,
          probability: "baixa" as const,
          mitigation: "Revisão semestral do PDI alinhada com estratégia organizacional",
        },
      ];

      return {
        existing: existingRisks,
        suggestions: mainRisks,
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

  /**
   * Adicionar ação ao PDI
   */
  addAction: protectedProcedure
    .input(
      z.object({
        planId: z.number(),
        title: z.string(),
        description: z.string(),
        axis: z.enum(["70_pratica", "20_experiencia", "10_educacao"]),
        developmentArea: z.string(),
        successMetric: z.string(),
        evidenceRequired: z.string().optional(),
        responsible: z.string(),
        dueDate: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.insert(pdiActions).values({
        planId: input.planId,
        title: input.title,
        description: input.description,
        axis: input.axis,
        developmentArea: input.developmentArea,
        successMetric: input.successMetric,
        evidenceRequired: input.evidenceRequired,
        responsible: input.responsible,
        dueDate: new Date(input.dueDate),
        status: "nao_iniciado",
        progress: 0,
      });

      return { success: true };
    }),

  /**
   * Atualizar status de ação
   */
  updateActionStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["nao_iniciado", "em_andamento", "concluido"]),
        progress: z.number().min(0).max(100).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updates: any = {
        status: input.status,
        updatedAt: new Date(),
      };

      if (input.progress !== undefined) {
        updates.progress = input.progress;
      }

      if (input.status === "concluido") {
        updates.completedAt = new Date();
        updates.progress = 100;
      }

      await db.update(pdiActions).set(updates).where(eq(pdiActions.id, input.id));

      return { success: true };
    }),

  /**
   * Buscar ações de um PDI
   */
  getActions: protectedProcedure
    .input(z.object({ planId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const actions = await db
        .select()
        .from(pdiActions)
        .where(eq(pdiActions.planId, input.planId))
        .orderBy(pdiActions.dueDate);

      return actions;
    }),

  /**
   * Adicionar feedback de governança (DGC)
   */
  addGovernanceReview: protectedProcedure
    .input(
      z.object({
        planId: z.number(),
        reviewDate: z.string(),
        reviewerId: z.number(),
        reviewerRole: z.enum(["dgc", "mentor", "sponsor"]),
        readinessIndex: z.number().min(1).max(5),
        keyPoints: z.string(),
        strengths: z.string().optional(),
        improvements: z.string().optional(),
        nextSteps: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.insert(pdiGovernanceReviews).values({
        planId: input.planId,
        reviewDate: new Date(input.reviewDate),
        reviewerId: input.reviewerId,
        reviewerRole: input.reviewerRole,
        readinessIndex: input.readinessIndex.toString(),
        keyPoints: input.keyPoints,
        strengths: input.strengths,
        improvements: input.improvements,
        nextSteps: input.nextSteps,
      });

      return { success: true };
    }),

  /**
   * Buscar histórico de feedbacks de governança
   */
  getGovernanceReviews: protectedProcedure
    .input(z.object({ planId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const reviews = await db
        .select({
          id: pdiGovernanceReviews.id,
          reviewDate: pdiGovernanceReviews.reviewDate,
          readinessIndex: pdiGovernanceReviews.readinessIndex,
          keyPoints: pdiGovernanceReviews.keyPoints,
          strengths: pdiGovernanceReviews.strengths,
          improvements: pdiGovernanceReviews.improvements,
          nextSteps: pdiGovernanceReviews.nextSteps,
          reviewerName: employees.name,
          reviewerRole: pdiGovernanceReviews.reviewerRole,
        })
        .from(pdiGovernanceReviews)
        .leftJoin(employees, eq(pdiGovernanceReviews.reviewerId, employees.id))
        .where(eq(pdiGovernanceReviews.planId, input.planId))
        .orderBy(desc(pdiGovernanceReviews.reviewDate));

      return reviews;
    }),

  /**
   * Calcular evolução do IPS ao longo do tempo
   */
  getIPSEvolution: protectedProcedure
    .input(z.object({ planId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const evolution = await db
        .select({
          reviewDate: pdiGovernanceReviews.reviewDate,
          readinessIndex: pdiGovernanceReviews.readinessIndex,
        })
        .from(pdiGovernanceReviews)
        .where(eq(pdiGovernanceReviews.planId, input.planId))
        .orderBy(pdiGovernanceReviews.reviewDate);

      return evolution;
    }),

  /**
   * Buscar perfil psicométrico do colaborador (DISC, Big Five, MBTI)
   */
  getPsychometricProfile: protectedProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      // Buscar últimos resultados de cada teste
      const discResult = await db
        .select()
        .from(psychometricTests)
        .where(
          and(
            eq(psychometricTests.employeeId, input.employeeId),
            sql`${psychometricTests.testType} = 'disc'`
          )
        )
        .orderBy(desc(psychometricTests.completedAt))
        .limit(1);

      const bigFiveResult = await db
        .select()
        .from(psychometricTests)
        .where(
          and(
            eq(psychometricTests.employeeId, input.employeeId),
            sql`${psychometricTests.testType} = 'bigfive'`
          )
        )
        .orderBy(desc(psychometricTests.completedAt))
        .limit(1);

      const mbtiResult = await db
        .select()
        .from(psychometricTests)
        .where(
          and(
            eq(psychometricTests.employeeId, input.employeeId),
            sql`${psychometricTests.testType} = 'mbti'`
          )
        )
        .orderBy(desc(psychometricTests.completedAt))
        .limit(1);

      return {
        disc: discResult[0] || null,
        bigFive: bigFiveResult[0] || null,
        mbti: mbtiResult[0] || null,
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


