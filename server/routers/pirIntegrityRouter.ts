import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { sendPIRIntegrityInvite, sendPIRIntegrityCompletionNotification, sendPIRIntegrityReminder } from "../_core/email";
import { ENV } from "../_core/env";
import {
  pirIntegrityDimensions,
  pirIntegrityQuestions,
  pirIntegrityAssessments,
  pirIntegrityResponses,
  pirIntegrityDimensionScores,
  pirIntegrityRiskIndicators,
  pirIntegrityReports,
  pirIntegrityDevelopmentPlans,
  employees,
} from "../../drizzle/schema";

// Schemas de validação
const questionOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  score: z.number().min(0).max(100),
  moralLevel: z.enum(["pre_conventional", "conventional", "post_conventional"]),
});

export const pirIntegrityRouter = router({
  // ============ DIMENSÕES ============
  listDimensions: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { dimensions: [] };
    
    const dimensions = await db
      .select()
      .from(pirIntegrityDimensions)
      .orderBy(pirIntegrityDimensions.displayOrder);
    
    return { dimensions };
  }),

  // ============ QUESTÕES ============
  listQuestions: publicProcedure
    .input(z.object({
      dimensionId: z.number().optional(),
      difficulty: z.enum(["easy", "medium", "hard"]).optional(),
      active: z.boolean().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      console.log('[listQuestions] Input recebido:', JSON.stringify(input));
      const db = await getDb();
      if (!db) {
        console.log('[listQuestions] Database não disponível');
        return { questions: [], total: 0 };
      }

      // USANDO SQL RAW para bypassing Drizzle ORM
      console.log('[listQuestions] Executando SQL raw...');
      const result = await db.execute(sql`
        SELECT * FROM pirIntegrityQuestions 
        WHERE active = 1 
        ORDER BY displayOrder 
        LIMIT 100
      `);
      
      const questions = Array.isArray(result) ? result : (result as any).rows || [];
      console.log('[listQuestions] SQL retornou:', questions.length, 'questões');
      
      return { 
        questions, 
        total: questions.length 
      };
    }),

  createQuestion: protectedProcedure
    .input(z.object({
      dimensionId: z.number(),
      questionType: z.enum(["scenario", "multiple_choice", "scale", "open_ended"]),
      title: z.string(),
      scenario: z.string().optional(),
      question: z.string(),
      options: z.array(questionOptionSchema).optional(),
      scaleMin: z.number().optional(),
      scaleMax: z.number().optional(),
      scaleLabels: z.any().optional(),
      requiresJustification: z.boolean().default(false),
      difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
      displayOrder: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(pirIntegrityQuestions).values({
        ...input,
        options: input.options ? JSON.stringify(input.options) : null,
        scaleLabels: input.scaleLabels ? JSON.stringify(input.scaleLabels) : null,
        active: true,
      });

      return { success: true, id: result[0].insertId };
    }),

  updateQuestion: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      scenario: z.string().optional(),
      question: z.string().optional(),
      options: z.array(questionOptionSchema).optional(),
      difficulty: z.enum(["easy", "medium", "hard"]).optional(),
      active: z.boolean().optional(),
      displayOrder: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;
      const processedData: any = { ...updateData };
      
      if (updateData.options) {
        processedData.options = JSON.stringify(updateData.options);
      }

      await db
        .update(pirIntegrityQuestions)
        .set(processedData)
        .where(eq(pirIntegrityQuestions.id, id));

      return { success: true };
    }),

  // ============ AVALIAÇÕES ============
  createAssessment: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
      assessmentType: z.enum(["hiring", "periodic", "promotion", "investigation"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(pirIntegrityAssessments).values({
        employeeId: input.employeeId,
        assessmentType: input.assessmentType,
        status: "draft",
        notes: input.notes,
        createdBy: ctx.user?.id,
      });

      const assessmentId = result[0].insertId;

      // Buscar dados do funcionário para enviar email
      const employee = await db
        .select()
        .from(employees)
        .where(eq(employees.id, input.employeeId))
        .limit(1);

      if (employee.length > 0 && employee[0].email) {
        const inviteLink = `${ENV.viteAppUrl || 'https://avduisa-sys-vd5bj8to.manus.space'}/pir-integridade/teste/${assessmentId}`;
        
        // Enviar email de convite (não aguardar para não bloquear a resposta)
        sendPIRIntegrityInvite(
          employee[0].email,
          employee[0].name || 'Colaborador',
          input.assessmentType,
          inviteLink
        ).catch(error => {
          console.error('[PIR Integrity] Erro ao enviar email de convite:', error);
        });
      }

      return { success: true, id: assessmentId };
    }),

  listAssessments: protectedProcedure
    .input(z.object({
      status: z.enum(["draft", "in_progress", "completed", "cancelled"]).optional(),
      employeeId: z.number().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { assessments: [], total: 0 };

      const conditions = [];
      if (input.status) {
        conditions.push(eq(pirIntegrityAssessments.status, input.status));
      }
      if (input.employeeId) {
        conditions.push(eq(pirIntegrityAssessments.employeeId, input.employeeId));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const assessments = await db
        .select({
          assessment: pirIntegrityAssessments,
          employee: employees,
        })
        .from(pirIntegrityAssessments)
        .leftJoin(employees, eq(pirIntegrityAssessments.employeeId, employees.id))
        .where(whereClause)
        .orderBy(desc(pirIntegrityAssessments.createdAt))
        .limit(input.limit)
        .offset((input.page - 1) * input.limit);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(pirIntegrityAssessments)
        .where(whereClause);

      return { 
        assessments: assessments.map(a => ({
          ...a.assessment,
          employee: a.employee,
        })),
        total: Number(countResult[0]?.count || 0),
      };
    }),

  getAssessment: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [assessment] = await db
        .select()
        .from(pirIntegrityAssessments)
        .where(eq(pirIntegrityAssessments.id, input.id))
        .limit(1);

      if (!assessment) return null;

      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, assessment.employeeId))
        .limit(1);

      const dimensionScores = await db
        .select()
        .from(pirIntegrityDimensionScores)
        .where(eq(pirIntegrityDimensionScores.assessmentId, input.id));

      const riskIndicators = await db
        .select()
        .from(pirIntegrityRiskIndicators)
        .where(eq(pirIntegrityRiskIndicators.assessmentId, input.id));

      return { assessment, employee, dimensionScores, riskIndicators };
    }),

  startAssessment: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(pirIntegrityAssessments)
        .set({ 
          status: "in_progress",
          startedAt: new Date(),
        })
        .where(eq(pirIntegrityAssessments.id, input.id));

      return { success: true };
    }),

  // ============ RESPOSTAS ============
  saveResponse: protectedProcedure
    .input(z.object({
      assessmentId: z.number(),
      questionId: z.number(),
      selectedOption: z.string().optional(),
      scaleValue: z.number().optional(),
      openResponse: z.string().optional(),
      justification: z.string().optional(),
      timeSpent: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [existing] = await db
        .select()
        .from(pirIntegrityResponses)
        .where(and(
          eq(pirIntegrityResponses.assessmentId, input.assessmentId),
          eq(pirIntegrityResponses.questionId, input.questionId)
        ))
        .limit(1);

      if (existing) {
        await db
          .update(pirIntegrityResponses)
          .set({
            selectedOption: input.selectedOption,
            scaleValue: input.scaleValue,
            openResponse: input.openResponse,
            justification: input.justification,
            timeSpent: input.timeSpent,
          })
          .where(eq(pirIntegrityResponses.id, existing.id));
      } else {
        await db.insert(pirIntegrityResponses).values(input);
      }

      return { success: true };
    }),

  getResponses: protectedProcedure
    .input(z.object({ assessmentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { responses: [] };

      const responses = await db
        .select()
        .from(pirIntegrityResponses)
        .where(eq(pirIntegrityResponses.assessmentId, input.assessmentId));

      return { responses };
    }),

  // ============ FINALIZAÇÃO E SCORING ============
  completeAssessment: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const responses = await db
        .select()
        .from(pirIntegrityResponses)
        .where(eq(pirIntegrityResponses.assessmentId, input.id));

      const questionIds = responses.map(r => r.questionId);
      if (questionIds.length === 0) {
        throw new Error("Nenhuma resposta encontrada");
      }

      const questions = await db
        .select()
        .from(pirIntegrityQuestions)
        .where(inArray(pirIntegrityQuestions.id, questionIds));

      const dimensions = await db
        .select()
        .from(pirIntegrityDimensions);

      const dimensionScoresMap: Record<number, { total: number; count: number; moralLevels: string[] }> = {};
      
      for (const response of responses) {
        const question = questions.find(q => q.id === response.questionId);
        if (!question) continue;

        const dimId = question.dimensionId;
        if (!dimensionScoresMap[dimId]) {
          dimensionScoresMap[dimId] = { total: 0, count: 0, moralLevels: [] };
        }

        let score = 0;
        let moralLevel = "conventional";

        if (response.selectedOption && question.options) {
          const options = typeof question.options === 'string' 
            ? JSON.parse(question.options) 
            : question.options;
          const selectedOpt = options.find((o: any) => o.value === response.selectedOption);
          if (selectedOpt) {
            score = selectedOpt.score;
            moralLevel = selectedOpt.moralLevel;
          }
        } else if (response.scaleValue !== null) {
          score = ((response.scaleValue || 0) / 5) * 100;
        }

        dimensionScoresMap[dimId].total += score;
        dimensionScoresMap[dimId].count += 1;
        dimensionScoresMap[dimId].moralLevels.push(moralLevel);
      }

      let overallTotal = 0;
      let overallCount = 0;
      const moralLevelCounts = { pre_conventional: 0, conventional: 0, post_conventional: 0 };

      for (const [dimId, data] of Object.entries(dimensionScoresMap)) {
        const avgScore = Math.round(data.total / data.count);
        const riskLevel = avgScore >= 80 ? "low" : avgScore >= 60 ? "moderate" : avgScore >= 40 ? "high" : "critical";

        await db.insert(pirIntegrityDimensionScores).values({
          assessmentId: input.id,
          dimensionId: parseInt(dimId),
          score: avgScore,
          riskLevel,
          strengths: JSON.stringify([]),
          weaknesses: JSON.stringify([]),
          recommendations: JSON.stringify([]),
        });

        overallTotal += avgScore;
        overallCount += 1;

        for (const ml of data.moralLevels) {
          moralLevelCounts[ml as keyof typeof moralLevelCounts]++;
        }
      }

      let moralLevel: "pre_conventional" | "conventional" | "post_conventional" = "conventional";
      if (moralLevelCounts.post_conventional > moralLevelCounts.conventional && 
          moralLevelCounts.post_conventional > moralLevelCounts.pre_conventional) {
        moralLevel = "post_conventional";
      } else if (moralLevelCounts.pre_conventional > moralLevelCounts.conventional) {
        moralLevel = "pre_conventional";
      }

      const overallScore = overallCount > 0 ? Math.round(overallTotal / overallCount) : 0;
      const riskLevel = overallScore >= 80 ? "low" : overallScore >= 60 ? "moderate" : overallScore >= 40 ? "high" : "critical";

      const fastResponses = responses.filter(r => (r.timeSpent || 0) < 5);
      if (fastResponses.length > responses.length * 0.3) {
        await db.insert(pirIntegrityRiskIndicators).values({
          assessmentId: input.id,
          indicatorType: "time_anomaly",
          severity: "medium",
          description: `${fastResponses.length} respostas foram dadas em menos de 5 segundos.`,
          detectedAt: new Date(),
        });
      }

      await db
        .update(pirIntegrityAssessments)
        .set({
          status: "completed",
          completedAt: new Date(),
          overallScore,
          riskLevel,
          moralLevel,
        })
        .where(eq(pirIntegrityAssessments.id, input.id));

      // Buscar dados da avaliação e funcionário para enviar email de conclusão
      const [assessment] = await db
        .select({
          assessment: pirIntegrityAssessments,
          employee: employees,
        })
        .from(pirIntegrityAssessments)
        .leftJoin(employees, eq(pirIntegrityAssessments.employeeId, employees.id))
        .where(eq(pirIntegrityAssessments.id, input.id))
        .limit(1);

      if (assessment?.employee?.email) {
        const resultLink = `${ENV.viteAppUrl || 'https://avduisa-sys-vd5bj8to.manus.space'}/pir-integridade/resultado/${input.id}`;
        
        // Enviar email de conclusão (não aguardar para não bloquear a resposta)
        sendPIRIntegrityCompletionNotification(
          assessment.employee.email,
          assessment.employee.name || 'Colaborador',
          assessment.assessment.assessmentType,
          resultLink,
          overallScore,
          riskLevel
        ).catch(error => {
          console.error('[PIR Integrity] Erro ao enviar email de conclusão:', error);
        });
      }

      return { success: true, overallScore, riskLevel, moralLevel };
    }),

  // ============ RELATÓRIOS ============
  generateReport: protectedProcedure
    .input(z.object({ assessmentId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [assessment] = await db
        .select()
        .from(pirIntegrityAssessments)
        .where(eq(pirIntegrityAssessments.id, input.assessmentId))
        .limit(1);

      if (!assessment) throw new Error("Avaliação não encontrada");

      const executiveSummary = `
RELATÓRIO PIR INTEGRIDADE
=========================

Pontuação Geral: ${assessment.overallScore}/100
Nível de Risco: ${assessment.riskLevel?.toUpperCase()}
Nível Moral: ${assessment.moralLevel?.replace('_', '-').toUpperCase()}

Data da Avaliação: ${assessment.completedAt?.toLocaleDateString('pt-BR')}
      `.trim();

      const result = await db.insert(pirIntegrityReports).values({
        assessmentId: input.assessmentId,
        reportType: "individual",
        executiveSummary,
        generatedBy: ctx.user?.id,
      });

      return { success: true, id: result[0].insertId };
    }),

  getReport: protectedProcedure
    .input(z.object({ assessmentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [report] = await db
        .select()
        .from(pirIntegrityReports)
        .where(eq(pirIntegrityReports.assessmentId, input.assessmentId))
        .orderBy(desc(pirIntegrityReports.createdAt))
        .limit(1);

      return report;
    }),

  // ============ DASHBOARD STATS ============
  getDashboardStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { total: 0, completed: 0, inProgress: 0, avgScore: 0, riskDistribution: {} };

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pirIntegrityAssessments);

    const [completedResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pirIntegrityAssessments)
      .where(eq(pirIntegrityAssessments.status, "completed"));

    const [inProgressResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pirIntegrityAssessments)
      .where(eq(pirIntegrityAssessments.status, "in_progress"));

    const [avgResult] = await db
      .select({ avg: sql<number>`AVG(overallScore)` })
      .from(pirIntegrityAssessments)
      .where(eq(pirIntegrityAssessments.status, "completed"));

    const riskDistribution = await db
      .select({
        riskLevel: pirIntegrityAssessments.riskLevel,
        count: sql<number>`count(*)`,
      })
      .from(pirIntegrityAssessments)
      .where(eq(pirIntegrityAssessments.status, "completed"))
      .groupBy(pirIntegrityAssessments.riskLevel);

    return {
      total: Number(totalResult?.count || 0),
      completed: Number(completedResult?.count || 0),
      inProgress: Number(inProgressResult?.count || 0),
      avgScore: Math.round(Number(avgResult?.avg || 0)),
      riskDistribution: Object.fromEntries(
        riskDistribution.map(r => [r.riskLevel || 'unknown', Number(r.count)])
      ),
    };
  }),

  // ============ LEMBRETES E NOTIFICAÇÕES ============
  sendReminders: protectedProcedure
    .input(z.object({
      daysThreshold: z.number().default(3), // Enviar lembrete se criado há mais de X dias
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar avaliações pendentes (draft ou in_progress) criadas há mais de X dias
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - input.daysThreshold);

      const pendingAssessments = await db
        .select({
          assessment: pirIntegrityAssessments,
          employee: employees,
        })
        .from(pirIntegrityAssessments)
        .leftJoin(employees, eq(pirIntegrityAssessments.employeeId, employees.id))
        .where(
          and(
            inArray(pirIntegrityAssessments.status, ["draft", "in_progress"]),
            sql`${pirIntegrityAssessments.createdAt} < ${thresholdDate}`
          )
        );

      let sentCount = 0;
      const errors: string[] = [];

      for (const { assessment, employee } of pendingAssessments) {
        if (!employee?.email) continue;

        const inviteLink = `${ENV.viteAppUrl || 'https://avduisa-sys-vd5bj8to.manus.space'}/pir-integridade/teste/${assessment.id}`;
        
        try {
          const sent = await sendPIRIntegrityReminder(
            employee.email,
            employee.name || 'Colaborador',
            assessment.assessmentType,
            inviteLink
          );
          
          if (sent) {
            sentCount++;
          }
        } catch (error) {
          console.error(`[PIR Integrity] Erro ao enviar lembrete para ${employee.email}:`, error);
          errors.push(`${employee.email}: ${error}`);
        }
      }

      return {
        success: true,
        sentCount,
        totalPending: pendingAssessments.length,
        errors: errors.length > 0 ? errors : undefined,
      };
    }),

  getPendingAssessments: protectedProcedure
    .input(z.object({
      daysThreshold: z.number().default(3),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { assessments: [] };

      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - input.daysThreshold);

      const assessments = await db
        .select({
          assessment: pirIntegrityAssessments,
          employee: employees,
        })
        .from(pirIntegrityAssessments)
        .leftJoin(employees, eq(pirIntegrityAssessments.employeeId, employees.id))
        .where(
          and(
            inArray(pirIntegrityAssessments.status, ["draft", "in_progress"]),
            sql`${pirIntegrityAssessments.createdAt} < ${thresholdDate}`
          )
        )
        .orderBy(desc(pirIntegrityAssessments.createdAt));

      return { assessments };
    }),
});
