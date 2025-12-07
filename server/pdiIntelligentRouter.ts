import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { notifyPdiActivity } from "./adminRhEmailService";
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
  pdiDiagnosticSurveys,
  pdiDiagnosticResponses,
  pdiProgressEvidences,
  pdiRiskMitigations,
  pdiCheckIns,
  pdiMilestones,
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

      // Notificar Admin e RH sobre novo PDI criado
      try {
        const [employee] = await db.select()
          .from(employees)
          .where(eq(employees.id, input.employeeId))
          .limit(1);
        
        const [targetPosition] = await db.select()
          .from(positions)
          .where(eq(positions.id, input.targetPositionId))
          .limit(1);
        
        if (employee && targetPosition) {
          await notifyPdiActivity(
            'criado',
            employee.name,
            `PDI para ${targetPosition.title}`,
            0
          );
        }
      } catch (error) {
        console.error('[PdiIntelligentRouter] Failed to send email notification:', error);
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

      // Notificar Admin e RH quando PDI for concluído
      if (input.status === "concluido") {
        try {
          const [plan] = await db.select()
            .from(pdiPlans)
            .where(eq(pdiPlans.id, input.id))
            .limit(1);
          
          if (plan) {
            const [employee] = await db.select()
              .from(employees)
              .where(eq(employees.id, plan.employeeId))
              .limit(1);
            
            const [targetPosition] = await db.select()
              .from(positions)
              .where(eq(positions.id, plan.targetPositionId))
              .limit(1);
            
            if (employee && targetPosition) {
              await notifyPdiActivity(
                'concluído',
                employee.name,
                `PDI para ${targetPosition.title}`,
                100
              );
            }
          }
        } catch (error) {
          console.error('[PdiIntelligentRouter] Failed to send email notification:', error);
        }
      }

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
   * Gerar sugestões automáticas de ações 70-20-10 baseadas nos gaps com IA
   */
  generateActionSuggestions: protectedProcedure
    .input(z.object({ planId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar informações do PDI
      const [pdiPlan] = await db
        .select({
          plan: pdiPlans,
          employee: employees,
          targetPosition: positions,
          details: pdiIntelligentDetails,
        })
        .from(pdiPlans)
        .leftJoin(employees, eq(pdiPlans.employeeId, employees.id))
        .leftJoin(positions, eq(pdiPlans.targetPositionId, positions.id))
        .leftJoin(pdiIntelligentDetails, eq(pdiIntelligentDetails.planId, pdiPlans.id))
        .where(eq(pdiPlans.id, input.planId))
        .limit(1);

      if (!pdiPlan) {
        throw new TRPCError({ code: "NOT_FOUND", message: "PDI não encontrado" });
      }

      // Buscar gaps do PDI
      const gaps = await db
        .select({
          gap: pdiCompetencyGaps,
          competency: competencies,
        })
        .from(pdiCompetencyGaps)
        .leftJoin(competencies, eq(pdiCompetencyGaps.competencyId, competencies.id))
        .where(eq(pdiCompetencyGaps.planId, input.planId));

      if (gaps.length === 0) {
        // Retornar sugestões vazias se não houver gaps
        return {
          pratica_70: [],
          experiencia_20: [],
          educacao_10: [],
        };
      }

      // Preparar contexto para IA
      const gapsContext = gaps.map(g => ({
        competencia: g.competency?.name || "Competência",
        nivelAtual: g.gap.currentLevel,
        nivelAlvo: g.gap.targetLevel,
        gap: g.gap.gap,
        prioridade: g.gap.priority,
      }));

      const prompt = `Você é um especialista em desenvolvimento de pessoas e planos de desenvolvimento individual (PDI).

Contexto:
- Colaborador: ${pdiPlan.employee?.name || "N/A"}
- Cargo atual: ${pdiPlan.employee?.position || "N/A"}
- Cargo alvo: ${pdiPlan.targetPosition?.title || "N/A"}
- Contexto estratégico: ${pdiPlan.details?.strategicContext || "Desenvolvimento para posição de liderança"}
- Duração do PDI: ${pdiPlan.details?.durationMonths || 24} meses

Gaps de competências identificados:
${JSON.stringify(gapsContext, null, 2)}

Gere sugestões de ações de desenvolvimento seguindo o modelo 70-20-10:
- 70% Prática (experiências no trabalho, projetos, desafios)
- 20% Experiência (mentoria, coaching, job rotation, networking)
- 10% Educação (cursos, certificações, leituras)

Para cada categoria, crie 2-3 ações ESPECÍFICAS, PRÁTICAS e MENSURÁVEIS que:
1. Sejam adequadas ao contexto da pessoa e da organização
2. Abordem os gaps identificados (priorizando os de maior prioridade)
3. Tenham métricas de sucesso claras
4. Incluam evidências necessárias para comprovar o desenvolvimento
5. Tenham prazos realistas distribuídos ao longo do período do PDI

Retorne um JSON no formato:
{
  "pratica_70": [
    {
      "title": "Título da ação",
      "description": "Descrição detalhada e específica",
      "developmentArea": "Competência que desenvolve",
      "successMetric": "Métrica de sucesso mensurável",
      "evidenceRequired": "Evidências necessárias",
      "dueDate": "YYYY-MM-DD"
    }
  ],
  "experiencia_20": [...],
  "educacao_10": [...]
}`;

      try {
        // Chamar IA para gerar sugestões
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "Você é um especialista em desenvolvimento de pessoas. Retorne apenas JSON válido, sem markdown ou texto adicional.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "pdi_suggestions",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  pratica_70: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        developmentArea: { type: "string" },
                        successMetric: { type: "string" },
                        evidenceRequired: { type: "string" },
                        dueDate: { type: "string" },
                      },
                      required: ["title", "description", "developmentArea", "successMetric", "evidenceRequired", "dueDate"],
                      additionalProperties: false,
                    },
                  },
                  experiencia_20: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        developmentArea: { type: "string" },
                        successMetric: { type: "string" },
                        evidenceRequired: { type: "string" },
                        dueDate: { type: "string" },
                      },
                      required: ["title", "description", "developmentArea", "successMetric", "evidenceRequired", "dueDate"],
                      additionalProperties: false,
                    },
                  },
                  educacao_10: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        developmentArea: { type: "string" },
                        successMetric: { type: "string" },
                        evidenceRequired: { type: "string" },
                        dueDate: { type: "string" },
                      },
                      required: ["title", "description", "developmentArea", "successMetric", "evidenceRequired", "dueDate"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["pratica_70", "experiencia_20", "educacao_10"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error("IA não retornou conteúdo");
        }

        const aiSuggestions = JSON.parse(content);

        // Adicionar axis a cada sugestão
        const suggestions = {
          pratica_70: aiSuggestions.pratica_70.map((s: any) => ({ ...s, axis: "70_pratica" as const })),
          experiencia_20: aiSuggestions.experiencia_20.map((s: any) => ({ ...s, axis: "20_experiencia" as const })),
          educacao_10: aiSuggestions.educacao_10.map((s: any) => ({ ...s, axis: "10_educacao" as const })),
        };

        return suggestions;
      } catch (error) {
        console.error("Erro ao gerar sugestões com IA:", error);
        
        // Fallback: gerar sugestões estáticas se IA falhar
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
      }
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
        readinessIndexTimes10: z.number().min(10).max(50), // 1.0 a 5.0 * 10
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
        readinessIndexTimes10: input.readinessIndexTimes10,
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
          readinessIndexTimes10: pdiGovernanceReviews.readinessIndexTimes10,
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
          readinessIndexTimes10: pdiGovernanceReviews.readinessIndexTimes10,
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

  // ============================================================================
  // ABA 1: DIAGNÓSTICO DE COMPETÊNCIAS
  // ============================================================================

  /**
   * Enviar pesquisas de diagnóstico 360°
   */
  sendDiagnosticSurveys: protectedProcedure
    .input(
      z.object({
        planId: z.number(),
        respondents: z.array(
          z.object({
            respondentId: z.number(),
            surveyType: z.enum(["autoavaliacao", "superior", "pares", "subordinados"]),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const surveys = input.respondents.map((r) => ({
        planId: input.planId,
        surveyType: r.surveyType,
        respondentId: r.respondentId,
        status: "pendente" as const,
        sentAt: new Date(),
      }));

      await db.insert(pdiDiagnosticSurveys).values(surveys);

      return { success: true, surveysCount: surveys.length };
    }),

  /**
   * Submeter respostas do diagnóstico
   */
  submitDiagnosticResponse: protectedProcedure
    .input(
      z.object({
        surveyId: z.number(),
        responses: z.array(
          z.object({
            competencyId: z.number(),
            score: z.number().min(1).max(5),
            comments: z.string().optional(),
            behavioralExamples: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Inserir respostas
      const responseValues = input.responses.map((r) => ({
        surveyId: input.surveyId,
        competencyId: r.competencyId,
        score: r.score,
        comments: r.comments,
        behavioralExamples: r.behavioralExamples,
      }));

      await db.insert(pdiDiagnosticResponses).values(responseValues);

      // Atualizar status da pesquisa
      await db
        .update(pdiDiagnosticSurveys)
        .set({ status: "concluida", completedAt: new Date() })
        .where(eq(pdiDiagnosticSurveys.id, input.surveyId));

      return { success: true };
    }),

  /**
   * Obter resultados consolidados do diagnóstico
   */
  getDiagnosticResults: protectedProcedure
    .input(z.object({ planId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar todas as pesquisas do plano
      const surveys = await db
        .select()
        .from(pdiDiagnosticSurveys)
        .where(eq(pdiDiagnosticSurveys.planId, input.planId));

      // Buscar todas as respostas
      const allResponses = [];
      for (const survey of surveys) {
        const responses = await db
          .select({
            surveyType: pdiDiagnosticSurveys.surveyType,
            competencyId: pdiDiagnosticResponses.competencyId,
            competencyName: competencies.name,
            score: pdiDiagnosticResponses.score,
            comments: pdiDiagnosticResponses.comments,
          })
          .from(pdiDiagnosticResponses)
          .leftJoin(pdiDiagnosticSurveys, eq(pdiDiagnosticResponses.surveyId, pdiDiagnosticSurveys.id))
          .leftJoin(competencies, eq(pdiDiagnosticResponses.competencyId, competencies.id))
          .where(eq(pdiDiagnosticResponses.surveyId, survey.id));

        allResponses.push(...responses);
      }

      // Consolidar por competência
      const consolidatedByCompetency: Record<number, any> = {};

      for (const response of allResponses) {
        const compId = response.competencyId;
        if (!consolidatedByCompetency[compId]) {
          consolidatedByCompetency[compId] = {
            competencyId: compId,
            competencyName: response.competencyName,
            autoavaliacao: null,
            superior: null,
            pares: [],
            subordinados: [],
            media: 0,
          };
        }

        const surveyType = response.surveyType;
        if (surveyType === "autoavaliacao") {
          consolidatedByCompetency[compId].autoavaliacao = response.score;
        } else if (surveyType === "superior") {
          consolidatedByCompetency[compId].superior = response.score;
        } else if (surveyType === "pares") {
          consolidatedByCompetency[compId].pares.push(response.score);
        } else if (surveyType === "subordinados") {
          consolidatedByCompetency[compId].subordinados.push(response.score);
        }
      }

      // Calcular médias
      const results = Object.values(consolidatedByCompetency).map((comp: any) => {
        const scores = [];
        if (comp.autoavaliacao) scores.push(comp.autoavaliacao);
        if (comp.superior) scores.push(comp.superior);
        scores.push(...comp.pares);
        scores.push(...comp.subordinados);

        const media = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

        return {
          ...comp,
          paresMedia: comp.pares.length > 0 ? comp.pares.reduce((a: number, b: number) => a + b, 0) / comp.pares.length : null,
          subordinadosMedia: comp.subordinados.length > 0 ? comp.subordinados.reduce((a: number, b: number) => a + b, 0) / comp.subordinados.length : null,
          media: Math.round(media * 10) / 10,
        };
      });

      return {
        surveys,
        results,
      };
    }),

  // ============================================================================
  // ABA 4: PROGRESSÃO
  // ============================================================================

  /**
   * Adicionar evidência de progresso
   */
  addProgressEvidence: protectedProcedure
    .input(
      z.object({
        itemId: z.number(),
        evidenceType: z.enum(["certificado", "documento", "link_projeto", "depoimento", "foto", "video", "outro"]),
        title: z.string(),
        description: z.string().optional(),
        fileUrl: z.string().optional(),
        externalUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [evidence] = await db
        .insert(pdiProgressEvidences)
        .values({
          itemId: input.itemId,
          evidenceType: input.evidenceType,
          title: input.title,
          description: input.description,
          fileUrl: input.fileUrl,
          externalUrl: input.externalUrl,
          uploadedBy: ctx.user.id,
        })
        .$returningId();

      return { success: true, evidenceId: evidence.id };
    }),

  /**
   * Validar evidência
   */
  validateEvidence: protectedProcedure
    .input(
      z.object({
        evidenceId: z.number(),
        isValidated: z.boolean(),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(pdiProgressEvidences)
        .set({
          isValidated: input.isValidated,
          validatedBy: ctx.user.id,
          validatedAt: new Date(),
          validationComments: input.comments,
        })
        .where(eq(pdiProgressEvidences.id, input.evidenceId));

      return { success: true };
    }),

  /**
   * Adicionar check-in periódico
   */
  addCheckIn: protectedProcedure
    .input(
      z.object({
        planId: z.number(),
        checkInType: z.enum(["mensal", "trimestral", "semestral", "ad_hoc"]),
        overallProgress: z.number().min(0).max(100),
        onTrack: z.boolean(),
        accomplishments: z.string().optional(),
        challenges: z.string().optional(),
        nextSteps: z.string().optional(),
        supportNeeded: z.string().optional(),
        planAdjustments: z.string().optional(),
        participantIds: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [checkIn] = await db
        .insert(pdiCheckIns)
        .values({
          planId: input.planId,
          checkInDate: new Date(),
          checkInType: input.checkInType,
          conductedBy: ctx.user.id,
          participantIds: input.participantIds ? JSON.stringify(input.participantIds) : null,
          overallProgress: input.overallProgress,
          onTrack: input.onTrack,
          accomplishments: input.accomplishments,
          challenges: input.challenges,
          nextSteps: input.nextSteps,
          supportNeeded: input.supportNeeded,
          planAdjustments: input.planAdjustments,
        })
        .$returningId();

      // Atualizar progresso geral do plano
      await db
        .update(pdiPlans)
        .set({ overallProgress: input.overallProgress })
        .where(eq(pdiPlans.id, input.planId));

      return { success: true, checkInId: checkIn.id };
    }),

  /**
   * Obter timeline de progresso
   */
  getProgressTimeline: protectedProcedure
    .input(z.object({ planId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar check-ins
      const checkIns = await db
        .select({
          id: pdiCheckIns.id,
          checkInDate: pdiCheckIns.checkInDate,
          checkInType: pdiCheckIns.checkInType,
          conductedByName: employees.name,
          overallProgress: pdiCheckIns.overallProgress,
          onTrack: pdiCheckIns.onTrack,
          accomplishments: pdiCheckIns.accomplishments,
          challenges: pdiCheckIns.challenges,
          nextSteps: pdiCheckIns.nextSteps,
        })
        .from(pdiCheckIns)
        .leftJoin(employees, eq(pdiCheckIns.conductedBy, employees.id))
        .where(eq(pdiCheckIns.planId, input.planId))
        .orderBy(desc(pdiCheckIns.checkInDate));

      // Buscar evidências
      const evidences = await db
        .select({
          id: pdiProgressEvidences.id,
          itemId: pdiProgressEvidences.itemId,
          evidenceType: pdiProgressEvidences.evidenceType,
          title: pdiProgressEvidences.title,
          uploadedAt: pdiProgressEvidences.uploadedAt,
          uploadedByName: employees.name,
          isValidated: pdiProgressEvidences.isValidated,
        })
        .from(pdiProgressEvidences)
        .leftJoin(pdiItems, eq(pdiProgressEvidences.itemId, pdiItems.id))
        .leftJoin(employees, eq(pdiProgressEvidences.uploadedBy, employees.id))
        .where(eq(pdiItems.planId, input.planId))
        .orderBy(desc(pdiProgressEvidences.uploadedAt));

      // Buscar marcos
      const milestones = await db
        .select()
        .from(pdiMilestones)
        .where(eq(pdiMilestones.planId, input.planId))
        .orderBy(desc(pdiMilestones.achievedDate));

      return {
        checkIns,
        evidences,
        milestones,
      };
    }),

  // ============================================================================
  // ABA 5: RISCOS (EXPANSÃO)
  // ============================================================================

  /**
   * Adicionar plano de mitigação de risco
   */
  addRiskMitigation: protectedProcedure
    .input(
      z.object({
        riskId: z.number(),
        mitigationType: z.enum(["preventiva", "corretiva"]),
        actionDescription: z.string(),
        responsibleId: z.number(),
        dueDate: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [mitigation] = await db
        .insert(pdiRiskMitigations)
        .values({
          riskId: input.riskId,
          mitigationType: input.mitigationType,
          actionDescription: input.actionDescription,
          responsibleId: input.responsibleId,
          dueDate: new Date(input.dueDate),
          status: "planejada",
          progress: 0,
        })
        .$returningId();

      return { success: true, mitigationId: mitigation.id };
    }),

  /**
   * Atualizar status de mitigação
   */
  updateMitigationStatus: protectedProcedure
    .input(
      z.object({
        mitigationId: z.number(),
        status: z.enum(["planejada", "em_andamento", "concluida", "cancelada"]),
        progress: z.number().min(0).max(100),
        effectiveness: z.enum(["nao_avaliada", "baixa", "media", "alta"]).optional(),
        effectivenessNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updateData: any = {
        status: input.status,
        progress: input.progress,
      };

      if (input.status === "concluida") {
        updateData.completedAt = new Date();
      }

      if (input.effectiveness) {
        updateData.effectiveness = input.effectiveness;
        updateData.effectivenessNotes = input.effectivenessNotes;
      }

      await db
        .update(pdiRiskMitigations)
        .set(updateData)
        .where(eq(pdiRiskMitigations.id, input.mitigationId));

      return { success: true };
    }),

  /**
   * Obter mitigações de um risco
   */
  getRiskMitigations: protectedProcedure
    .input(z.object({ riskId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const mitigations = await db
        .select({
          id: pdiRiskMitigations.id,
          mitigationType: pdiRiskMitigations.mitigationType,
          actionDescription: pdiRiskMitigations.actionDescription,
          responsibleName: employees.name,
          dueDate: pdiRiskMitigations.dueDate,
          status: pdiRiskMitigations.status,
          progress: pdiRiskMitigations.progress,
          effectiveness: pdiRiskMitigations.effectiveness,
          effectivenessNotes: pdiRiskMitigations.effectivenessNotes,
          completedAt: pdiRiskMitigations.completedAt,
        })
        .from(pdiRiskMitigations)
        .leftJoin(employees, eq(pdiRiskMitigations.responsibleId, employees.id))
        .where(eq(pdiRiskMitigations.riskId, input.riskId));

      return mitigations;
    }),

  /**
   * Adicionar marco/celebração
   */
  addMilestone: protectedProcedure
    .input(
      z.object({
        planId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        milestoneType: z.enum([
          "competencia_desenvolvida",
          "certificacao_obtida",
          "projeto_concluido",
          "promocao",
          "reconhecimento",
          "outro",
        ]),
        targetDate: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [milestone] = await db
        .insert(pdiMilestones)
        .values({
          planId: input.planId,
          title: input.title,
          description: input.description,
          milestoneType: input.milestoneType,
          targetDate: input.targetDate ? new Date(input.targetDate) : null,
          status: "planejado",
        })
        .$returningId();

      return { success: true, milestoneId: milestone.id };
    }),

  /**
   * Celebrar marco alcançado
   */
  celebrateMilestone: protectedProcedure
    .input(
      z.object({
        milestoneId: z.number(),
        impactDescription: z.string().optional(),
        celebrationNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(pdiMilestones)
        .set({
          status: "alcancado",
          achievedDate: new Date(),
          impactDescription: input.impactDescription,
          wasCelebrated: true,
          celebrationNotes: input.celebrationNotes,
        })
        .where(eq(pdiMilestones.id, input.milestoneId));

      return { success: true };
    }),

  /**
   * Listar marcos do PDI
   */
  getMilestones: protectedProcedure
    .input(z.object({ planId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const milestones = await db
        .select()
        .from(pdiMilestones)
        .where(eq(pdiMilestones.planId, input.planId))
        .orderBy(pdiMilestones.targetDate);

      return milestones;
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


