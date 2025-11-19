import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { goalApprovals, smartGoals, users } from "../drizzle/schema";
import { createNotification } from "./notificationHelper";

/**
 * Router para gerenciar aprovações de metas
 * 
 * Endpoints:
 * - list: Listar aprovações de uma meta
 * - approve: Aprovar meta (apenas gestor/RH/diretor)
 * - reject: Rejeitar meta (apenas gestor/RH/diretor)
 * - requestApproval: Solicitar aprovação de meta
 */

export const goalApprovalsRouter = router({
  /**
   * Listar aprovações de uma meta
   */
  list: protectedProcedure
    .input(z.object({ goalId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const approvals = await db
        .select({
          id: goalApprovals.id,
          approverId: goalApprovals.approverId,
          approverRole: goalApprovals.approverRole,
          status: goalApprovals.status,
          comments: goalApprovals.comments,
          createdAt: goalApprovals.createdAt,
          decidedAt: goalApprovals.decidedAt,
          approverName: users.name,
        })
        .from(goalApprovals)
        .leftJoin(users, eq(goalApprovals.approverId, users.id))
        .where(eq(goalApprovals.goalId, input.goalId))
        .orderBy(desc(goalApprovals.createdAt));

      return approvals;
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
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verificar se usuário tem permissão (gestor, RH ou diretor)
      if (!["admin", "rh", "gestor"].includes(ctx.user.role)) {
        throw new Error("Sem permissão para aprovar metas");
      }

      // Buscar a meta
      const [goal] = await db
        .select()
        .from(smartGoals)
        .where(eq(smartGoals.id, input.goalId))
        .limit(1);

      if (!goal) throw new Error("Meta não encontrada");

      // Determinar role do aprovador
      const approverRole =
        ctx.user.role === "admin"
          ? "director"
          : ctx.user.role === "rh"
          ? "hr"
          : "manager";

      // Criar registro de aprovação
      await db.insert(goalApprovals).values({
        goalId: input.goalId,
        approverId: ctx.user.id,
        approverRole: approverRole as "manager" | "hr" | "director",
        status: "approved",
        comments: input.comments || null,
        decidedAt: new Date(),
      });

      // Atualizar status da meta
      await db
        .update(smartGoals)
        .set({
          approvalStatus: "approved",
          status: "in_progress",
          updatedAt: new Date(),
        })
        .where(eq(smartGoals.id, input.goalId));

      // Enviar notificação ao colaborador
      await createNotification({
        userId: goal.employeeId,
        type: "goal_approved",
        title: "Meta Aprovada! 🎉",
        message: `Sua meta "${goal.title}" foi aprovada por ${ctx.user.name}`,
        link: `/metas/${input.goalId}`,
      });

      return { success: true };
    }),

  /**
   * Rejeitar meta
   */
  reject: protectedProcedure
    .input(
      z.object({
        goalId: z.number(),
        comments: z.string().min(10, "Comentário obrigatório ao rejeitar (mínimo 10 caracteres)"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verificar se usuário tem permissão
      if (!["admin", "rh", "gestor"].includes(ctx.user.role)) {
        throw new Error("Sem permissão para rejeitar metas");
      }

      // Buscar a meta
      const [goal] = await db
        .select()
        .from(smartGoals)
        .where(eq(smartGoals.id, input.goalId))
        .limit(1);

      if (!goal) throw new Error("Meta não encontrada");

      // Determinar role do aprovador
      const approverRole =
        ctx.user.role === "admin"
          ? "director"
          : ctx.user.role === "rh"
          ? "hr"
          : "manager";

      // Criar registro de rejeição
      await db.insert(goalApprovals).values({
        goalId: input.goalId,
        approverId: ctx.user.id,
        approverRole: approverRole as "manager" | "hr" | "director",
        status: "rejected",
        comments: input.comments,
        decidedAt: new Date(),
      });

      // Atualizar status da meta
      await db
        .update(smartGoals)
        .set({
          approvalStatus: "rejected",
          status: "draft",
          updatedAt: new Date(),
        })
        .where(eq(smartGoals.id, input.goalId));

      // Enviar notificação ao colaborador
      await createNotification({
        userId: goal.employeeId,
        type: "goal_rejected",
        title: "Meta Rejeitada",
        message: `Sua meta "${goal.title}" foi rejeitada por ${ctx.user.name}. Motivo: ${input.comments}`,
        link: `/metas/${input.goalId}`,
      });

      return { success: true };
    }),

  /**
   * Solicitar aprovação de meta
   */
  requestApproval: protectedProcedure
    .input(z.object({ goalId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar a meta
      const [goal] = await db
        .select()
        .from(smartGoals)
        .where(and(eq(smartGoals.id, input.goalId), eq(smartGoals.employeeId, ctx.user.id)))
        .limit(1);

      if (!goal) throw new Error("Meta não encontrada ou sem permissão");

      // Atualizar status para pendente de aprovação
      await db
        .update(smartGoals)
        .set({
          approvalStatus: "pending_manager",
          updatedAt: new Date(),
        })
        .where(eq(smartGoals.id, input.goalId));

      // TODO: Enviar notificação ao gestor
      // Requer implementação de relação employee -> manager

      return { success: true };
    }),
});
