import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import {
  goalApprovals,
  goalComments,
  goalMilestones,
  smartGoals,
  employees,
  evaluationCycles,
  pdiPlans,
} from "../drizzle/schema";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";

/**
 * Router de Metas SMART
 * Sistema completo de criação, validação, aprovação e acompanhamento de metas
 * com elegibilidade para bônus financeiro
 */

export const goalsRouter = router({
  /**
   * Validar critérios SMART de uma meta
   */
  validateSMART: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        measurementUnit: z.string().optional(),
        targetValue: z.number().optional(),
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const validation = {
        isSpecific: false,
        isMeasurable: false,
        isAchievable: false,
        isRelevant: false,
        isTimeBound: false,
        score: 0,
        feedback: [] as string[],
      };

      // S - Específica: título e descrição detalhados
      if (
        input.title.length >= 10 &&
        input.description.length >= 50 &&
        /\b(aumentar|reduzir|melhorar|implementar|criar|desenvolver)\b/i.test(
          input.description
        )
      ) {
        validation.isSpecific = true;
        validation.score += 20;
      } else {
        validation.feedback.push(
          "Meta precisa ser mais específica com verbo de ação claro"
        );
      }

      // M - Mensurável: tem unidade de medida e valor alvo
      if (input.measurementUnit && input.targetValue !== undefined) {
        validation.isMeasurable = true;
        validation.score += 20;
      } else {
        validation.feedback.push(
          "Meta precisa ter unidade de medida e valor alvo definidos"
        );
      }

      // A - Atingível: valor alvo razoável (heurística simples)
      if (input.targetValue && input.targetValue > 0 && input.targetValue < 1000000) {
        validation.isAchievable = true;
        validation.score += 20;
      } else {
        validation.feedback.push("Valor alvo deve ser realista e atingível");
      }

      // R - Relevante: descrição menciona impacto ou benefício
      if (
        /\b(impacto|resultado|benefício|objetivo|estratégia|crescimento|melhoria)\b/i.test(
          input.description
        )
      ) {
        validation.isRelevant = true;
        validation.score += 20;
      } else {
        validation.feedback.push(
          "Meta precisa demonstrar relevância e alinhamento estratégico"
        );
      }

      // T - Temporal: tem prazo definido (mínimo 1 mês, máximo 2 anos)
      const start = new Date(input.startDate);
      const end = new Date(input.endDate);
      const diffMonths =
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (diffMonths >= 1 && diffMonths <= 24) {
        validation.isTimeBound = true;
        validation.score += 20;
      } else {
        validation.feedback.push("Prazo deve estar entre 1 mês e 24 meses");
      }

      return validation;
    }),

  /**
   * Criar nova meta SMART
   */
  createSMART: protectedProcedure
    .input(
      z.object({
        title: z.string().min(10),
        description: z.string().min(50),
        type: z.enum(["individual", "team", "organizational"]),
        category: z.enum(["financial", "behavioral", "corporate", "development"]),
        measurementUnit: z.string().optional(),
        targetValue: z.number().optional(),
        weight: z.number().min(1).max(100).default(10),
        startDate: z.string(),
        endDate: z.string(),
        bonusEligible: z.boolean().default(false),
        bonusPercentage: z.number().optional(),
        bonusAmount: z.number().optional(),
        pdiPlanId: z.number().optional(),
        cycleId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Validar critérios SMART automaticamente
      const validation = {
        isSpecific: input.title.length >= 10 && input.description.length >= 50 && /\b(aumentar|reduzir|melhorar|implementar|criar|desenvolver)\b/i.test(input.description),
        isMeasurable: !!(input.measurementUnit && input.targetValue !== undefined),
        isAchievable: !!(input.targetValue && input.targetValue > 0 && input.targetValue < 1000000),
        isRelevant: /\b(impacto|resultado|benefício|objetivo|estratégia|crescimento|melhoria)\b/i.test(input.description),
        isTimeBound: (() => {
          const start = new Date(input.startDate);
          const end = new Date(input.endDate);
          const diffMonths = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30);
          return diffMonths >= 1 && diffMonths <= 24;
        })(),
        score: 0,
        feedback: [] as string[],
      };
      validation.score = [validation.isSpecific, validation.isMeasurable, validation.isAchievable, validation.isRelevant, validation.isTimeBound].filter(Boolean).length * 20;

      // Criar meta
      const [result] = await db.insert(smartGoals).values({
        employeeId: ctx.user.id,
        cycleId: input.cycleId,
        pdiPlanId: input.pdiPlanId,
        title: input.title,
        description: input.description,
        type: input.type,
        category: input.category,
        measurementUnit: input.measurementUnit,
        targetValue: input.targetValue?.toString(),
        weight: input.weight,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        bonusEligible: input.bonusEligible,
        bonusPercentage: input.bonusPercentage?.toString(),
        bonusAmount: input.bonusAmount?.toString(),
        isSpecific: validation.isSpecific,
        isMeasurable: validation.isMeasurable,
        isAchievable: validation.isAchievable,
        isRelevant: validation.isRelevant,
        isTimeBound: validation.isTimeBound,
        status: "draft",
        approvalStatus: "not_submitted",
        createdBy: ctx.user.id,
      });

      return { goalId: result.insertId, validation };
    }),

  /**
   * Listar metas do colaborador
   */
  list: protectedProcedure
    .input(
      z.object({
        cycleId: z.number().optional(),
        status: z
          .enum([
            "draft",
            "pending_approval",
            "approved",
            "rejected",
            "in_progress",
            "completed",
            "cancelled",
          ])
          .optional(),
        category: z
          .enum(["financial", "behavioral", "corporate", "development"])
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = [eq(smartGoals.employeeId, ctx.user.id)];
      if (input.cycleId) conditions.push(eq(smartGoals.cycleId, input.cycleId));
      if (input.status) conditions.push(eq(smartGoals.status, input.status));
      if (input.category) conditions.push(eq(smartGoals.category, input.category));

      const goals = await db
        .select()
        .from(smartGoals)
        .where(and(...conditions))
        .orderBy(desc(smartGoals.createdAt));

      return goals;
    }),

  /**
   * Buscar meta por ID com detalhes completos
   */
  getById: protectedProcedure
    .input(z.object({ goalId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [goal] = await db
        .select()
        .from(smartGoals)
        .where(eq(smartGoals.id, input.goalId))
        .limit(1);

      if (!goal) return null;

      // Buscar marcos
      const milestones = await db
        .select()
        .from(goalMilestones)
        .where(eq(goalMilestones.goalId, input.goalId))
        .orderBy(goalMilestones.dueDate);

      // Buscar aprovações
      const approvals = await db
        .select({
          id: goalApprovals.id,
          approverId: goalApprovals.approverId,
          approverRole: goalApprovals.approverRole,
          status: goalApprovals.status,
          comments: goalApprovals.comments,
          createdAt: goalApprovals.createdAt,
          decidedAt: goalApprovals.decidedAt,
          approverName: employees.name,
        })
        .from(goalApprovals)
        .leftJoin(employees, eq(goalApprovals.approverId, employees.id))
        .where(eq(goalApprovals.goalId, input.goalId))
        .orderBy(goalApprovals.createdAt);

      // Buscar comentários
      const comments = await db
        .select({
          id: goalComments.id,
          authorId: goalComments.authorId,
          comment: goalComments.comment,
          createdAt: goalComments.createdAt,
          authorName: employees.name,
        })
        .from(goalComments)
        .leftJoin(employees, eq(goalComments.authorId, employees.id))
        .where(eq(goalComments.goalId, input.goalId))
        .orderBy(desc(goalComments.createdAt));

      // Buscar evidências
      const { goalEvidences } = await import("../drizzle/schema");
      const evidences = await db
        .select()
        .from(goalEvidences)
        .where(eq(goalEvidences.goalId, input.goalId))
        .orderBy(desc(goalEvidences.uploadedAt));

      return {
        ...goal,
        milestones,
        approvals,
        comments,
        evidences,
      };
    }),

  /**
   * Atualizar progresso da meta
   */
  updateProgress: protectedProcedure
    .input(
      z.object({
        goalId: z.number(),
        currentValue: z.number(),
        progress: z.number().min(0).max(100),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Atualizar meta
      await db
        .update(smartGoals)
        .set({
          currentValue: input.currentValue.toString(),
          progress: input.progress,
          status: input.progress === 100 ? "completed" : "in_progress",
          completedAt: input.progress === 100 ? new Date() : undefined,
        })
        .where(eq(smartGoals.id, input.goalId));

      // Adicionar comentário se fornecido
      if (input.comment) {
        await db.insert(goalComments).values({
          goalId: input.goalId,
          authorId: ctx.user.id,
          comment: input.comment,
        });
      }

      return { success: true };
    }),

  /**
   * Adicionar marco à meta
   */
  addMilestone: protectedProcedure
    .input(
      z.object({
        goalId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        dueDate: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [milestone] = await db.insert(goalMilestones).values({
        goalId: input.goalId,
        title: input.title,
        description: input.description,
        dueDate: new Date(input.dueDate),
        status: "pending",
      });

      return { milestoneId: milestone.insertId };
    }),

  /**
   * Atualizar marco
   */
  updateMilestone: protectedProcedure
    .input(
      z.object({
        milestoneId: z.number(),
        status: z.enum(["pending", "in_progress", "completed", "delayed"]),
        progress: z.number().min(0).max(100),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(goalMilestones)
        .set({
          status: input.status,
          progress: input.progress,
          completedAt: input.status === "completed" ? new Date() : undefined,
        })
        .where(eq(goalMilestones.id, input.milestoneId));

      return { success: true };
    }),

  /**
   * Enviar meta para aprovação
   */
  submitForApproval: protectedProcedure
    .input(z.object({ goalId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Buscar meta
      const [goal] = await db
        .select()
        .from(smartGoals)
        .where(eq(smartGoals.id, input.goalId))
        .limit(1);

      if (!goal) throw new TRPCError({ code: "NOT_FOUND" });

      // Buscar gestor do colaborador
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, goal.employeeId))
        .limit(1);

      if (!employee?.managerId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Colaborador não tem gestor definido",
        });
      }

      // Atualizar status da meta
      await db
        .update(smartGoals)
        .set({
          status: "pending_approval",
          approvalStatus: "pending_manager",
        })
        .where(eq(smartGoals.id, input.goalId));

      // Criar aprovação para o gestor
      await db.insert(goalApprovals).values({
        goalId: input.goalId,
        approverId: employee.managerId,
        approverRole: "manager",
        status: "pending",
      });

      return { success: true };
    }),

  /**
   * Aprovar meta
   */
  approve: protectedProcedure
    .input(
      z.object({
        goalId: z.number(),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Buscar aprovação pendente
      const [approval] = await db
        .select()
        .from(goalApprovals)
        .where(
          and(
            eq(goalApprovals.goalId, input.goalId),
            eq(goalApprovals.approverId, ctx.user.id),
            eq(goalApprovals.status, "pending")
          )
        )
        .limit(1);

      if (!approval) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Aprovação não encontrada",
        });
      }

      // Atualizar aprovação
      await db
        .update(goalApprovals)
        .set({
          status: "approved",
          comments: input.comments,
          decidedAt: new Date(),
        })
        .where(eq(goalApprovals.id, approval.id));

      // Se for aprovação do gestor, criar aprovação para RH
      if (approval.approverRole === "manager") {
        await db
          .update(smartGoals)
          .set({ approvalStatus: "pending_hr" })
          .where(eq(smartGoals.id, input.goalId));

        // TODO: Buscar RH responsável e criar aprovação
        // Por enquanto, aprovar automaticamente
        await db
          .update(smartGoals)
          .set({
            status: "approved",
            approvalStatus: "approved",
          })
          .where(eq(smartGoals.id, input.goalId));
      } else {
        // Aprovação final
        await db
          .update(smartGoals)
          .set({
            status: "approved",
            approvalStatus: "approved",
          })
          .where(eq(smartGoals.id, input.goalId));
      }

      return { success: true };
    }),

  /**
   * Rejeitar meta
   */
  reject: protectedProcedure
    .input(
      z.object({
        goalId: z.number(),
        comments: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Buscar aprovação pendente
      const [approval] = await db
        .select()
        .from(goalApprovals)
        .where(
          and(
            eq(goalApprovals.goalId, input.goalId),
            eq(goalApprovals.approverId, ctx.user.id),
            eq(goalApprovals.status, "pending")
          )
        )
        .limit(1);

      if (!approval) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Aprovação não encontrada",
        });
      }

      // Atualizar aprovação
      await db
        .update(goalApprovals)
        .set({
          status: "rejected",
          comments: input.comments,
          decidedAt: new Date(),
        })
        .where(eq(goalApprovals.id, approval.id));

      // Atualizar meta
      await db
        .update(smartGoals)
        .set({
          status: "rejected",
          approvalStatus: "rejected",
        })
        .where(eq(smartGoals.id, input.goalId));

      return { success: true };
    }),

  /**
   * Calcular bônus baseado em metas concluídas
   */
  calculateBonus: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        cycleId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { totalBonus: 0, goals: [] };

      // Buscar metas elegíveis para bônus
      const goals = await db
        .select()
        .from(smartGoals)
        .where(
          and(
            eq(smartGoals.employeeId, input.employeeId),
            eq(smartGoals.cycleId, input.cycleId),
            eq(smartGoals.bonusEligible, true),
            eq(smartGoals.status, "completed")
          )
        );

      let totalBonus = 0;
      const bonusDetails = goals.map((goal) => {
        const progress = goal.progress || 0;
        let bonus = 0;

        if (goal.bonusAmount) {
          // Bônus fixo proporcional ao progresso
          bonus = (parseFloat(goal.bonusAmount) * progress) / 100;
        } else if (goal.bonusPercentage) {
          // Bônus percentual (precisa do salário base)
          // TODO: Buscar salário do colaborador
          bonus = 0; // Implementar quando tiver salário
        }

        totalBonus += bonus;

        return {
          goalId: goal.id,
          title: goal.title,
          progress,
          bonusAmount: bonus,
        };
      });

      return {
        totalBonus,
        goals: bonusDetails,
      };
    }),

  /**
   * Vincular meta com PDI
   */
  linkToPDI: protectedProcedure
    .input(
      z.object({
        goalId: z.number(),
        pdiPlanId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(smartGoals)
        .set({ pdiPlanId: input.pdiPlanId })
        .where(eq(smartGoals.id, input.goalId));

      return { success: true };
    }),

  /**
   * Adicionar comentário à meta
   */
  addComment: protectedProcedure
    .input(
      z.object({
        goalId: z.number(),
        comment: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [comment] = await db.insert(goalComments).values({
        goalId: input.goalId,
        authorId: ctx.user.id,
        comment: input.comment,
      });

      return { commentId: comment.insertId };
    }),

  /**
   * Dashboard de metas (KPIs e estatísticas)
   */
  getDashboard: protectedProcedure
    .input(z.object({ cycleId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        return {
          activeGoals: 0,
          completedGoals: 0,
          completionRate: 0,
          potentialBonus: 0,
        };

      const conditions = [eq(smartGoals.employeeId, ctx.user.id)];
      if (input.cycleId) conditions.push(eq(smartGoals.cycleId, input.cycleId));

      const goals = await db
        .select()
        .from(smartGoals)
        .where(and(...conditions));

      const activeGoals = goals.filter((g) =>
        ["approved", "in_progress"].includes(g.status)
      ).length;
      const completedGoals = goals.filter((g) => g.status === "completed").length;
      const completionRate =
        goals.length > 0 ? (completedGoals / goals.length) * 100 : 0;

      // Calcular bônus potencial
      const bonusGoals = goals.filter((g) => g.bonusEligible);
      const potentialBonus = bonusGoals.reduce((sum, goal) => {
        if (goal.bonusAmount) {
          return sum + parseFloat(goal.bonusAmount);
        }
        return sum;
      }, 0);

      return {
        activeGoals,
        completedGoals,
        completionRate: Math.round(completionRate),
        potentialBonus,
        totalGoals: goals.length,
        byCategory: {
          financial: goals.filter((g) => g.category === "financial").length,
          behavioral: goals.filter((g) => g.category === "behavioral").length,
          corporate: goals.filter((g) => g.category === "corporate").length,
          development: goals.filter((g) => g.category === "development").length,
        },
        byStatus: {
          draft: goals.filter((g) => g.status === "draft").length,
          pending_approval: goals.filter((g) => g.status === "pending_approval")
            .length,
          approved: goals.filter((g) => g.status === "approved").length,
          in_progress: goals.filter((g) => g.status === "in_progress").length,
          completed: goals.filter((g) => g.status === "completed").length,
          rejected: goals.filter((g) => g.status === "rejected").length,
        },
      };
    }),

  /**
   * Atualizar meta (apenas em rascunho)
   */
  update: protectedProcedure
    .input(
      z.object({
        goalId: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        type: z.enum(["individual", "team", "organizational"]).optional(),
        category: z.enum(["financial", "behavioral", "corporate", "development"]).optional(),
        measurementUnit: z.string().optional(),
        targetValue: z.number().optional(),
        weight: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        bonusEligible: z.boolean().optional(),
        bonusPercentage: z.number().optional(),
        bonusAmount: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verificar se meta existe e está em rascunho
      const [existingGoal] = await db
        .select()
        .from(smartGoals)
        .where(
          and(
            eq(smartGoals.id, input.goalId),
            eq(smartGoals.employeeId, ctx.user.id)
          )
        )
        .limit(1);

      if (!existingGoal) {
        throw new Error("Meta não encontrada");
      }

      if (existingGoal.status !== "draft") {
        throw new Error("Apenas metas em rascunho podem ser editadas");
      }

      // Atualizar meta
      const updateData: any = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.type !== undefined) updateData.type = input.type;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.measurementUnit !== undefined) updateData.measurementUnit = input.measurementUnit;
      if (input.targetValue !== undefined) updateData.targetValue = input.targetValue.toString();
      if (input.weight !== undefined) updateData.weight = input.weight;
      if (input.startDate !== undefined) updateData.startDate = new Date(input.startDate);
      if (input.endDate !== undefined) updateData.endDate = new Date(input.endDate);
      if (input.bonusEligible !== undefined) updateData.bonusEligible = input.bonusEligible;
      if (input.bonusPercentage !== undefined) updateData.bonusPercentage = input.bonusPercentage.toString();
      if (input.bonusAmount !== undefined) updateData.bonusAmount = input.bonusAmount.toString();

      await db
        .update(smartGoals)
        .set(updateData)
        .where(eq(smartGoals.id, input.goalId));

      return { success: true };
    }),

  /**
   * Exportar meta individual em PDF
   */
  exportPDF: protectedProcedure
    .input(z.object({ goalId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar meta completa
      const [goal] = await db
        .select()
        .from(smartGoals)
        .where(
          and(
            eq(smartGoals.id, input.goalId),
            eq(smartGoals.employeeId, ctx.user.id)
          )
        )
        .limit(1);

      if (!goal) {
        throw new Error("Meta não encontrada");
      }

      // Buscar marcos
      const milestones = await db
        .select()
        .from(goalMilestones)
        .where(eq(goalMilestones.goalId, input.goalId))
        .orderBy(goalMilestones.dueDate);

      // Buscar comentários
      const comments = await db
        .select()
        .from(goalComments)
        .where(eq(goalComments.goalId, input.goalId))
        .orderBy(desc(goalComments.createdAt));

      // Buscar informações do colaborador
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, goal.employeeId))
        .limit(1);

      // Buscar ciclo
      const [cycle] = await db
        .select()
        .from(evaluationCycles)
        .where(eq(evaluationCycles.id, goal.cycleId))
        .limit(1);

      const goalData = {
        ...goal,
        employeeName: employee?.name || "N/A",
        cycleName: cycle?.name || "N/A",
        milestones,
        comments,
      };

      // Gerar PDF
      const { generateGoalPDF } = await import("./utils/goalsPDF.js");
      const pdfBuffer = generateGoalPDF(goalData as any);

      // Retornar base64 para download no frontend
      return {
        filename: `meta-${goal.id}-${Date.now()}.pdf`,
        data: pdfBuffer.toString("base64"),
      };
    }),

  /**
   * Exportar relatório consolidado de metas em PDF
   */
  exportConsolidatedPDF: protectedProcedure
    .input(
      z.object({
        cycleId: z.number().optional(),
        status: z
          .enum([
            "draft",
            "pending_approval",
            "approved",
            "rejected",
            "in_progress",
            "completed",
            "cancelled",
          ])
          .optional(),
        category: z
          .enum(["financial", "behavioral", "corporate", "development"])
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar metas com filtros
      const conditions = [eq(smartGoals.employeeId, ctx.user.id)];

      if (input.cycleId) {
        conditions.push(eq(smartGoals.cycleId, input.cycleId));
      }
      if (input.status) {
        conditions.push(eq(smartGoals.status, input.status));
      }
      if (input.category) {
        conditions.push(eq(smartGoals.category, input.category));
      }

      const goals = await db
        .select()
        .from(smartGoals)
        .where(and(...conditions))
        .orderBy(desc(smartGoals.createdAt));

      if (goals.length === 0) {
        throw new Error("Nenhuma meta encontrada com os filtros selecionados");
      }

      // Buscar informações do colaborador
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, ctx.user.id))
        .limit(1);

      // Adicionar nome do colaborador em cada meta
      const goalsData = goals.map((g) => ({
        ...g,
        employeeName: employee?.name || "N/A",
      }));

      // Gerar PDF
      const { generateGoalsConsolidatedPDF } = await import("./utils/goalsPDF.js");
      const pdfBuffer = generateGoalsConsolidatedPDF(
        goalsData as any,
        `Relatório de Metas - ${employee?.name || "Colaborador"}`
      );

      // Retornar base64 para download no frontend
      return {
        filename: `relatorio-metas-${ctx.user.id}-${Date.now()}.pdf`,
        data: pdfBuffer.toString("base64"),
      };
    }),

  /**
   * Calcular bônus total por colaborador/ciclo
   */
  calculateBonusTotal: protectedProcedure
    .input(
      z.object({
        employeeId: z.number().optional(),
        cycleId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const targetEmployeeId = input.employeeId || ctx.user.id;

      // Buscar metas concluídas e elegíveis para bônus
      const goals = await db
        .select()
        .from(smartGoals)
        .where(
          and(
            eq(smartGoals.employeeId, targetEmployeeId),
            eq(smartGoals.cycleId, input.cycleId),
            eq(smartGoals.bonusEligible, true),
            eq(smartGoals.status, "completed")
          )
        );

      let totalBonusAmount = 0;
      let totalBonusPercentage = 0;
      const bonusDetails = [];

      for (const goal of goals) {
        const bonusAmount = goal.bonusAmount ? parseFloat(goal.bonusAmount) : 0;
        const bonusPercentage = goal.bonusPercentage
          ? parseFloat(goal.bonusPercentage)
          : 0;

        totalBonusAmount += bonusAmount;
        totalBonusPercentage += bonusPercentage;

        bonusDetails.push({
          goalId: goal.id,
          goalTitle: goal.title,
          bonusAmount,
          bonusPercentage,
          progress: goal.progress,
          weight: goal.weight,
        });
      }

      return {
        employeeId: targetEmployeeId,
        cycleId: input.cycleId,
        totalBonusAmount,
        totalBonusPercentage,
        eligibleGoals: goals.length,
        bonusDetails,
      };
    }),

  /**
   * Exportar planilha Excel de bônus para RH/Financeiro
   */
  exportBonusExcel: protectedProcedure
    .input(
      z.object({
        cycleId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar todas as metas concluídas e elegíveis para bônus no ciclo
      const goals = await db
        .select({
          goalId: smartGoals.id,
          goalTitle: smartGoals.title,
          employeeId: smartGoals.employeeId,
          employeeName: employees.name,
          departmentId: employees.departmentId,
          bonusAmount: smartGoals.bonusAmount,
          bonusPercentage: smartGoals.bonusPercentage,
          progress: smartGoals.progress,
          weight: smartGoals.weight,
        })
        .from(smartGoals)
        .leftJoin(employees, eq(smartGoals.employeeId, employees.id))
        .where(
          and(
            eq(smartGoals.cycleId, input.cycleId),
            eq(smartGoals.bonusEligible, true),
            eq(smartGoals.status, "completed")
          )
        )
        .orderBy(employees.name);

      // Agrupar por colaborador
      const bonusByEmployee = new Map<number, any>();

      for (const goal of goals) {
        const empId = goal.employeeId;
        if (!bonusByEmployee.has(empId)) {
          bonusByEmployee.set(empId, {
            employeeId: empId,
            employeeName: goal.employeeName || "N/A",
            department: goal.departmentId?.toString() || "N/A",
            totalBonusAmount: 0,
            totalBonusPercentage: 0,
            goalsCount: 0,
            goals: [],
          });
        }

        const empData = bonusByEmployee.get(empId);
        const bonusAmount = goal.bonusAmount ? parseFloat(goal.bonusAmount) : 0;
        const bonusPercentage = goal.bonusPercentage
          ? parseFloat(goal.bonusPercentage)
          : 0;

        empData.totalBonusAmount += bonusAmount;
        empData.totalBonusPercentage += bonusPercentage;
        empData.goalsCount += 1;
        empData.goals.push({
          title: goal.goalTitle,
          bonusAmount,
          bonusPercentage,
        });
      }

      // Gerar Excel
      const { generateBonusExcel } = await import("./utils/bonusExcel.js");
      const excelBuffer = await generateBonusExcel(
        Array.from(bonusByEmployee.values()),
        input.cycleId
      );

      return {
        filename: `bonus-ciclo-${input.cycleId}-${Date.now()}.xlsx`,
        data: excelBuffer.toString("base64"),
      };
    }),

  // ==================== EVIDÊNCIAS DE METAS ====================

  /**
   * Adicionar evidência a uma meta
   */
  addEvidence: protectedProcedure
    .input(
      z.object({
        goalId: z.number(),
        description: z.string(),
        attachmentUrl: z.string().optional(),
        attachmentName: z.string().optional(),
        attachmentType: z.string().optional(),
        attachmentSize: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { goalEvidences } = await import("../drizzle/schema");

      const result = await db.insert(goalEvidences).values({
        goalId: input.goalId,
        description: input.description,
        attachmentUrl: input.attachmentUrl || null,
        attachmentName: input.attachmentName || null,
        attachmentType: input.attachmentType || null,
        attachmentSize: input.attachmentSize || null,
        uploadedBy: ctx.user.id,
        isVerified: false,
      });

      return { id: Number((result as any).insertId), success: true };
    }),

  /**
   * Listar evidências de uma meta
   */
  listEvidences: protectedProcedure
    .input(z.object({ goalId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { goalEvidences } = await import("../drizzle/schema");

      const evidences = await db
        .select()
        .from(goalEvidences)
        .where(eq(goalEvidences.goalId, input.goalId))
        .orderBy(desc(goalEvidences.uploadedAt));

      return evidences;
    }),

  /**
   * Verificar evidência (para auditoria)
   */
  verifyEvidence: protectedProcedure
    .input(
      z.object({
        evidenceId: z.number(),
        isVerified: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { goalEvidences } = await import("../drizzle/schema");

      await db
        .update(goalEvidences)
        .set({
          isVerified: input.isVerified,
          verifiedBy: ctx.user.id,
          verifiedAt: new Date(),
        })
        .where(eq(goalEvidences.id, input.evidenceId));

      return { success: true };
    }),

  /**
   * Deletar evidência
   */
  deleteEvidence: protectedProcedure
    .input(z.object({ evidenceId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { goalEvidences } = await import("../drizzle/schema");

      await db.delete(goalEvidences).where(eq(goalEvidences.id, input.evidenceId));

      return { success: true };
    }),
});
