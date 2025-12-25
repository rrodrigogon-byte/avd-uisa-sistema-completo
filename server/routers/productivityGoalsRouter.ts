import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { productivityGoals, productivityGoalProgress, timeTrackingSessions, manualActivities } from "../../drizzle/schema-productivity";
import { employees } from "../../drizzle/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Router de Metas de Produtividade
 * Gestores definem e acompanham metas de produtividade para equipes
 */
export const productivityGoalsRouter = router({
  /**
   * Criar meta de produtividade (apenas gestores/RH)
   */
  createGoal: protectedProcedure
    .input(z.object({
      targetType: z.enum(["individual", "team", "department"]),
      targetUserId: z.number().optional(),
      targetTeamId: z.number().optional(),
      targetDepartmentId: z.number().optional(),
      goalType: z.enum(["daily_active_hours", "weekly_active_hours", "monthly_active_hours", "productivity_score"]),
      targetValue: z.number(),
      unit: z.string(),
      startDate: z.string(),
      endDate: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verificar se é gestor ou RH
      if (ctx.user.role !== "gestor" && ctx.user.role !== "rh" && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas gestores e RH podem criar metas de produtividade",
        });
      }

      const [goal] = await db.insert(productivityGoals).values({
        targetType: input.targetType,
        targetUserId: input.targetUserId || null,
        targetTeamId: input.targetTeamId || null,
        targetDepartmentId: input.targetDepartmentId || null,
        goalType: input.goalType,
        targetValue: input.targetValue,
        unit: input.unit,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
        active: true,
        createdBy: ctx.user.id,
        creatorName: ctx.user.name || null,
      });

      return { success: true, goalId: goal.insertId };
    }),

  /**
   * Listar metas ativas
   */
  listActiveGoals: protectedProcedure
    .input(z.object({
      targetType: z.enum(["individual", "team", "department"]).optional(),
      targetUserId: z.number().optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let conditions = [eq(productivityGoals.active, true)];

      if (input.targetType) {
        conditions.push(eq(productivityGoals.targetType, input.targetType));
      }

      if (input.targetUserId) {
        conditions.push(eq(productivityGoals.targetUserId, input.targetUserId));
      }

      const goals = await db
        .select()
        .from(productivityGoals)
        .where(and(...conditions))
        .orderBy(desc(productivityGoals.createdAt));

      return goals;
    }),

  /**
   * Listar minhas metas de produtividade
   */
  listMyGoals: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const goals = await db
        .select()
        .from(productivityGoals)
        .where(and(
          eq(productivityGoals.active, true),
          eq(productivityGoals.targetType, "individual"),
          eq(productivityGoals.targetUserId, ctx.user.id)
        ))
        .orderBy(desc(productivityGoals.createdAt));

      return goals;
    }),

  /**
   * Atualizar meta de produtividade
   */
  updateGoal: protectedProcedure
    .input(z.object({
      id: z.number(),
      targetValue: z.number().optional(),
      endDate: z.string().optional(),
      active: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verificar se é gestor ou RH
      if (ctx.user.role !== "gestor" && ctx.user.role !== "rh" && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas gestores e RH podem atualizar metas",
        });
      }

      const updateData: any = {};
      if (input.targetValue !== undefined) updateData.targetValue = input.targetValue;
      if (input.endDate !== undefined) updateData.endDate = new Date(input.endDate);
      if (input.active !== undefined) updateData.active = input.active;

      await db
        .update(productivityGoals)
        .set(updateData)
        .where(eq(productivityGoals.id, input.id));

      return { success: true };
    }),

  /**
   * Calcular progresso de meta
   */
  calculateProgress: protectedProcedure
    .input(z.object({
      goalId: z.number(),
      userId: z.number(),
      periodDate: z.string(), // Data do período (dia, semana ou mês)
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar meta
      const [goal] = await db
        .select()
        .from(productivityGoals)
        .where(eq(productivityGoals.id, input.goalId))
        .limit(1);

      if (!goal) {
        throw new Error("Meta não encontrada");
      }

      const periodDate = new Date(input.periodDate);
      let startDate: Date;
      let endDate: Date;
      let periodType: "daily" | "weekly" | "monthly";

      // Determinar período baseado no tipo de meta
      if (goal.goalType === "daily_active_hours") {
        periodType = "daily";
        startDate = new Date(periodDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(periodDate);
        endDate.setHours(23, 59, 59, 999);
      } else if (goal.goalType === "weekly_active_hours") {
        periodType = "weekly";
        // Início da semana (domingo)
        startDate = new Date(periodDate);
        startDate.setDate(startDate.getDate() - startDate.getDay());
        startDate.setHours(0, 0, 0, 0);
        // Fim da semana (sábado)
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else { // monthly
        periodType = "monthly";
        startDate = new Date(periodDate.getFullYear(), periodDate.getMonth(), 1);
        endDate = new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 0, 23, 59, 59, 999);
      }

      // Calcular valor real baseado no tipo de meta
      let actualValue = 0;

      if (goal.goalType.includes("active_hours")) {
        // Somar horas ativas das sessões de rastreamento
        const sessions = await db
          .select()
          .from(timeTrackingSessions)
          .where(and(
            eq(timeTrackingSessions.userId, input.userId),
            gte(timeTrackingSessions.startTime, startDate),
            lte(timeTrackingSessions.endTime, endDate)
          ));

        const totalMinutes = sessions.reduce((sum, s) => sum + s.activeMinutes, 0);
        actualValue = Math.floor(totalMinutes / 60); // Converter para horas
      } else if (goal.goalType === "productivity_score") {
        // Calcular score médio de produtividade
        const sessions = await db
          .select()
          .from(timeTrackingSessions)
          .where(and(
            eq(timeTrackingSessions.userId, input.userId),
            gte(timeTrackingSessions.startTime, startDate),
            lte(timeTrackingSessions.endTime, endDate)
          ));

        if (sessions.length > 0) {
          const avgScore = sessions.reduce((sum, s) => sum + s.productivityScore, 0) / sessions.length;
          actualValue = Math.floor(avgScore);
        }
      }

      // Calcular porcentagem de atingimento
      const achievementPercentage = Math.floor((actualValue / goal.targetValue) * 100);

      // Determinar status
      let status: "below_target" | "on_target" | "above_target";
      if (achievementPercentage < 80) {
        status = "below_target";
      } else if (achievementPercentage >= 80 && achievementPercentage < 100) {
        status = "on_target";
      } else {
        status = "above_target";
      }

      // Verificar se já existe progresso para este período
      const [existingProgress] = await db
        .select()
        .from(productivityGoalProgress)
        .where(and(
          eq(productivityGoalProgress.goalId, input.goalId),
          eq(productivityGoalProgress.userId, input.userId),
          eq(productivityGoalProgress.periodType, periodType),
          eq(productivityGoalProgress.periodDate, startDate)
        ))
        .limit(1);

      if (existingProgress) {
        // Atualizar progresso existente
        await db
          .update(productivityGoalProgress)
          .set({
            actualValue,
            targetValue: goal.targetValue,
            achievementPercentage,
            status,
          })
          .where(eq(productivityGoalProgress.id, existingProgress.id));
      } else {
        // Criar novo progresso
        await db.insert(productivityGoalProgress).values({
          goalId: input.goalId,
          userId: input.userId,
          periodType,
          periodDate: startDate,
          actualValue,
          targetValue: goal.targetValue,
          achievementPercentage,
          status,
        });
      }

      return {
        success: true,
        actualValue,
        targetValue: goal.targetValue,
        achievementPercentage,
        status,
      };
    }),

  /**
   * Buscar progresso de meta
   */
  getProgress: protectedProcedure
    .input(z.object({
      goalId: z.number(),
      userId: z.number(),
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const progress = await db
        .select()
        .from(productivityGoalProgress)
        .where(and(
          eq(productivityGoalProgress.goalId, input.goalId),
          eq(productivityGoalProgress.userId, input.userId),
          gte(productivityGoalProgress.periodDate, new Date(input.startDate)),
          lte(productivityGoalProgress.periodDate, new Date(input.endDate))
        ))
        .orderBy(productivityGoalProgress.periodDate);

      return progress;
    }),

  /**
   * Dashboard de equipe (para gestores)
   */
  getTeamDashboard: protectedProcedure
    .input(z.object({
      managerId: z.number(),
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verificar se é gestor
      if (ctx.user.role !== "gestor" && ctx.user.role !== "rh" && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas gestores podem acessar dashboard de equipe",
        });
      }

      // Buscar funcionários da equipe
      const teamMembers = await db
        .select()
        .from(employees)
        .where(eq(employees.managerId, input.managerId));

      // Buscar metas ativas para a equipe
      const teamGoals = await db
        .select()
        .from(productivityGoals)
        .where(and(
          eq(productivityGoals.active, true),
          eq(productivityGoals.createdBy, input.managerId)
        ));

      // Buscar progresso de cada membro
      const teamProgress = [];
      for (const member of teamMembers) {
        // Buscar sessões de rastreamento
        const sessions = await db
          .select()
          .from(timeTrackingSessions)
          .where(and(
            eq(timeTrackingSessions.userId, member.id),
            gte(timeTrackingSessions.startTime, new Date(input.startDate)),
            lte(timeTrackingSessions.endTime, new Date(input.endDate))
          ));

        const totalActiveMinutes = sessions.reduce((sum, s) => sum + s.activeMinutes, 0);
        const totalActiveHours = Math.floor(totalActiveMinutes / 60);
        const avgProductivityScore = sessions.length > 0
          ? Math.floor(sessions.reduce((sum, s) => sum + s.productivityScore, 0) / sessions.length)
          : 0;

        // Buscar metas individuais
        const individualGoals = await db
          .select()
          .from(productivityGoals)
          .where(and(
            eq(productivityGoals.active, true),
            eq(productivityGoals.targetType, "individual"),
            eq(productivityGoals.targetUserId, member.id)
          ));

        teamProgress.push({
          employee: member,
          totalActiveHours,
          avgProductivityScore,
          sessionsCount: sessions.length,
          goals: individualGoals,
        });
      }

      return {
        teamMembers: teamMembers.length,
        teamGoals: teamGoals.length,
        teamProgress,
      };
    }),

  /**
   * Alertar funcionários abaixo da meta
   */
  getUnderperformingEmployees: protectedProcedure
    .input(z.object({
      managerId: z.number(),
      threshold: z.number().default(80), // % mínimo de atingimento
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verificar se é gestor
      if (ctx.user.role !== "gestor" && ctx.user.role !== "rh" && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas gestores podem acessar esta informação",
        });
      }

      // Buscar funcionários da equipe
      const teamMembers = await db
        .select()
        .from(employees)
        .where(eq(employees.managerId, input.managerId));

      const underperforming = [];

      for (const member of teamMembers) {
        // Buscar metas ativas do funcionário
        const goals = await db
          .select()
          .from(productivityGoals)
          .where(and(
            eq(productivityGoals.active, true),
            eq(productivityGoals.targetType, "individual"),
            eq(productivityGoals.targetUserId, member.id)
          ));

        for (const goal of goals) {
          // Buscar progresso mais recente
          const [latestProgress] = await db
            .select()
            .from(productivityGoalProgress)
            .where(and(
              eq(productivityGoalProgress.goalId, goal.id),
              eq(productivityGoalProgress.userId, member.id)
            ))
            .orderBy(desc(productivityGoalProgress.periodDate))
            .limit(1);

          if (latestProgress && latestProgress.achievementPercentage < input.threshold) {
            underperforming.push({
              employee: member,
              goal,
              progress: latestProgress,
            });
          }
        }
      }

      return underperforming;
    }),
});
