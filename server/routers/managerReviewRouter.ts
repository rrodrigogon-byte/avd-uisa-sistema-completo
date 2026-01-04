import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { employees, performanceEvaluations, evaluationResponses, users } from "../../drizzle/schema";
import { eq, and, or, inArray, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Router para gestores revisarem avaliações de seus liderados
 * Permite visualização, comentários e aprovação de avaliações
 */
export const managerReviewRouter = router({
  /**
   * Listar liderados diretos do gestor logado
   */
  listMyTeam: protectedProcedure
    .input(z.object({}).optional())
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar employee vinculado ao usuário logado
      const [managerEmployee] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, ctx.user.id))
        .limit(1);

      if (!managerEmployee) {
        return [];
      }

      // Buscar liderados diretos
      const teamMembers = await db
        .select({
          id: employees.id,
          employeeCode: employees.employeeCode,
          name: employees.name,
          email: employees.email,
          positionId: employees.positionId,
          departmentId: employees.departmentId,
          active: employees.active,
        })
        .from(employees)
        .where(
          and(
            eq(employees.managerId, managerEmployee.id),
            eq(employees.active, true)
          )
        )
        .orderBy(employees.name);

      return teamMembers;
    }),

  /**
   * Listar avaliações pendentes de revisão dos liderados
   */
  listPendingReviews: protectedProcedure
    .input(
      z.object({
        employeeId: z.number().optional(),
        cycleId: z.number().optional(),
      }).optional()
    )
    .query(async ({ ctx, input = {} }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar employee vinculado ao usuário logado
      const [managerEmployee] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, ctx.user.id))
        .limit(1);

      if (!managerEmployee) {
        return [];
      }

      // Buscar IDs dos liderados
      const teamMembers = await db
        .select({ id: employees.id })
        .from(employees)
        .where(
          and(
            eq(employees.managerId, managerEmployee.id),
            eq(employees.active, true)
          )
        );

      const teamMemberIds = teamMembers.map(tm => tm.id);

      if (teamMemberIds.length === 0) {
        return [];
      }

      // Construir condições de filtro
      let conditions: any[] = [
        inArray(performanceEvaluations.employeeId, teamMemberIds),
      ];

      if (input.employeeId) {
        conditions.push(eq(performanceEvaluations.employeeId, input.employeeId));
      }

      if (input.cycleId) {
        conditions.push(eq(performanceEvaluations.cycleId, input.cycleId));
      }

      // Buscar avaliações
      const evaluations = await db
        .select({
          id: performanceEvaluations.id,
          employeeId: performanceEvaluations.employeeId,
          cycleId: performanceEvaluations.cycleId,
          evaluatorId: performanceEvaluations.evaluatorId,
          overallScore: performanceEvaluations.overallScore,
          status: performanceEvaluations.status,
          submittedAt: performanceEvaluations.submittedAt,
          managerReviewStatus: performanceEvaluations.managerReviewStatus,
          managerComments: performanceEvaluations.managerComments,
          managerReviewedAt: performanceEvaluations.managerReviewedAt,
          createdAt: performanceEvaluations.createdAt,
          
          // Dados do colaborador
          employeeName: employees.name,
          employeeCode: employees.employeeCode,
          employeeEmail: employees.email,
        })
        .from(performanceEvaluations)
        .leftJoin(employees, eq(performanceEvaluations.employeeId, employees.id))
        .where(and(...conditions))
        .orderBy(desc(performanceEvaluations.submittedAt));

      return evaluations;
    }),

  /**
   * Buscar detalhes de uma avaliação específica para revisão
   */
  getEvaluationDetails: protectedProcedure
    .input(z.object({ evaluationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar employee vinculado ao usuário logado
      const [managerEmployee] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, ctx.user.id))
        .limit(1);

      if (!managerEmployee) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não está vinculado a um colaborador no sistema",
        });
      }

      // Buscar avaliação
      const [evaluation] = await db
        .select()
        .from(performanceEvaluations)
        .where(eq(performanceEvaluations.id, input.evaluationId))
        .limit(1);

      if (!evaluation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Avaliação não encontrada",
        });
      }

      // Verificar se o colaborador avaliado é liderado do gestor
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, evaluation.employeeId))
        .limit(1);

      if (!employee || employee.managerId !== managerEmployee.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para revisar esta avaliação",
        });
      }

      // Buscar respostas da avaliação
      const responses = await db
        .select()
        .from(evaluationResponses)
        .where(eq(evaluationResponses.evaluationId, input.evaluationId));

      return {
        evaluation,
        employee,
        responses,
      };
    }),

  /**
   * Adicionar comentário do gestor na avaliação
   */
  addManagerComment: protectedProcedure
    .input(
      z.object({
        evaluationId: z.number(),
        comment: z.string().min(1, "Comentário não pode estar vazio"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar employee vinculado ao usuário logado
      const [managerEmployee] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, ctx.user.id))
        .limit(1);

      if (!managerEmployee) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não está vinculado a um colaborador no sistema",
        });
      }

      // Buscar avaliação
      const [evaluation] = await db
        .select()
        .from(performanceEvaluations)
        .where(eq(performanceEvaluations.id, input.evaluationId))
        .limit(1);

      if (!evaluation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Avaliação não encontrada",
        });
      }

      // Verificar se o colaborador avaliado é liderado do gestor
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, evaluation.employeeId))
        .limit(1);

      if (!employee || employee.managerId !== managerEmployee.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para comentar nesta avaliação",
        });
      }

      // Atualizar avaliação com comentário do gestor
      await db
        .update(performanceEvaluations)
        .set({
          managerComments: input.comment,
          managerReviewedAt: new Date(),
        })
        .where(eq(performanceEvaluations.id, input.evaluationId));

      return {
        success: true,
        message: "Comentário adicionado com sucesso",
      };
    }),

  /**
   * Aprovar ou reprovar avaliação como gestor
   */
  reviewEvaluation: protectedProcedure
    .input(
      z.object({
        evaluationId: z.number(),
        status: z.enum(["approved", "rejected", "needs_revision"]),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar employee vinculado ao usuário logado
      const [managerEmployee] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, ctx.user.id))
        .limit(1);

      if (!managerEmployee) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não está vinculado a um colaborador no sistema",
        });
      }

      // Buscar avaliação
      const [evaluation] = await db
        .select()
        .from(performanceEvaluations)
        .where(eq(performanceEvaluations.id, input.evaluationId))
        .limit(1);

      if (!evaluation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Avaliação não encontrada",
        });
      }

      // Verificar se o colaborador avaliado é liderado do gestor
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, evaluation.employeeId))
        .limit(1);

      if (!employee || employee.managerId !== managerEmployee.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para revisar esta avaliação",
        });
      }

      // Atualizar status de revisão do gestor
      await db
        .update(performanceEvaluations)
        .set({
          managerReviewStatus: input.status,
          managerComments: input.comments || evaluation.managerComments,
          managerReviewedAt: new Date(),
        })
        .where(eq(performanceEvaluations.id, input.evaluationId));

      const statusMessages = {
        approved: "Avaliação aprovada com sucesso",
        rejected: "Avaliação reprovada",
        needs_revision: "Avaliação marcada para revisão",
      };

      return {
        success: true,
        message: statusMessages[input.status],
      };
    }),

  /**
   * Estatísticas de avaliações da equipe
   */
  teamStats: protectedProcedure
    .input(z.object({}).optional())
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar employee vinculado ao usuário logado
      const [managerEmployee] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, ctx.user.id))
        .limit(1);

      if (!managerEmployee) {
        return {
          totalTeamMembers: 0,
          pendingReviews: 0,
          approvedReviews: 0,
          rejectedReviews: 0,
        };
      }

      // Buscar liderados
      const teamMembers = await db
        .select({ id: employees.id })
        .from(employees)
        .where(
          and(
            eq(employees.managerId, managerEmployee.id),
            eq(employees.active, true)
          )
        );

      const teamMemberIds = teamMembers.map(tm => tm.id);

      if (teamMemberIds.length === 0) {
        return {
          totalTeamMembers: 0,
          pendingReviews: 0,
          approvedReviews: 0,
          rejectedReviews: 0,
        };
      }

      // Buscar avaliações
      const evaluations = await db
        .select()
        .from(performanceEvaluations)
        .where(inArray(performanceEvaluations.employeeId, teamMemberIds));

      const pending = evaluations.filter(
        e => !e.managerReviewStatus || e.managerReviewStatus === "needs_revision"
      ).length;

      const approved = evaluations.filter(
        e => e.managerReviewStatus === "approved"
      ).length;

      const rejected = evaluations.filter(
        e => e.managerReviewStatus === "rejected"
      ).length;

      return {
        totalTeamMembers: teamMembers.length,
        totalEvaluations: evaluations.length,
        pendingReviews: pending,
        approvedReviews: approved,
        rejectedReviews: rejected,
      };
    }),
});
