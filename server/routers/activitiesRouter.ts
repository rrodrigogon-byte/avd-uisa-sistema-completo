import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { manualActivities, activitySuggestions, timeTrackingSessions } from "../../drizzle/schema-productivity";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

/**
 * Router de Atividades Manuais e Sugestões Inteligentes
 * Gerencia registro manual de atividades e sugestões baseadas em padrões
 */
export const activitiesRouter = router({
  /**
   * Criar atividade manual
   */
  createActivity: protectedProcedure
    .input(z.object({
      title: z.string().min(3),
      description: z.string().optional(),
      category: z.string().optional(),
      startTime: z.string(),
      endTime: z.string().optional(),
      durationMinutes: z.number(),
      tags: z.array(z.string()).optional(),
      projectId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [activity] = await db.insert(manualActivities).values({
        userId: ctx.user.id,
        title: input.title,
        description: input.description || null,
        category: input.category || null,
        startTime: new Date(input.startTime),
        endTime: input.endTime ? new Date(input.endTime) : null,
        durationMinutes: input.durationMinutes,
        source: "manual",
        tags: input.tags ? JSON.stringify(input.tags) : null,
        projectId: input.projectId || null,
      });

      return { success: true, activityId: activity.insertId };
    }),

  /**
   * Listar atividades manuais do usuário
   */
  listMyActivities: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      category: z.string().optional(),
      limit: z.number().default(100),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let conditions = [eq(manualActivities.userId, ctx.user.id)];

      if (input.startDate) {
        conditions.push(gte(manualActivities.startTime, new Date(input.startDate)));
      }

      if (input.endDate) {
        conditions.push(lte(manualActivities.startTime, new Date(input.endDate)));
      }

      if (input.category) {
        conditions.push(eq(manualActivities.category, input.category));
      }

      const activities = await db
        .select()
        .from(manualActivities)
        .where(and(...conditions))
        .orderBy(desc(manualActivities.startTime))
        .limit(input.limit);

      return activities.map(activity => ({
        ...activity,
        tags: activity.tags ? JSON.parse(activity.tags) : [],
      }));
    }),

  /**
   * Atualizar atividade manual
   */
  updateActivity: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(3).optional(),
      description: z.string().optional(),
      category: z.string().optional(),
      durationMinutes: z.number().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: any = {};
      if (input.title) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.durationMinutes) updateData.durationMinutes = input.durationMinutes;
      if (input.tags) updateData.tags = JSON.stringify(input.tags);

      await db
        .update(manualActivities)
        .set(updateData)
        .where(and(
          eq(manualActivities.id, input.id),
          eq(manualActivities.userId, ctx.user.id)
        ));

      return { success: true };
    }),

  /**
   * Deletar atividade manual
   */
  deleteActivity: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .delete(manualActivities)
        .where(and(
          eq(manualActivities.id, input.id),
          eq(manualActivities.userId, ctx.user.id)
        ));

      return { success: true };
    }),

  /**
   * Gerar sugestões inteligentes baseadas em padrões de tempo rastreado
   */
  generateSuggestions: protectedProcedure
    .input(z.object({
      date: z.string(), // Data para gerar sugestões
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const targetDate = new Date(input.date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Buscar sessões de rastreamento do dia
      const sessions = await db
        .select()
        .from(timeTrackingSessions)
        .where(and(
          eq(timeTrackingSessions.userId, ctx.user.id),
          gte(timeTrackingSessions.startTime, startOfDay),
          lte(timeTrackingSessions.endTime, endOfDay)
        ))
        .orderBy(timeTrackingSessions.startTime);

      // Buscar atividades manuais já registradas
      const existingActivities = await db
        .select()
        .from(manualActivities)
        .where(and(
          eq(manualActivities.userId, ctx.user.id),
          gte(manualActivities.startTime, startOfDay),
          lte(manualActivities.startTime, endOfDay)
        ));

      // Buscar padrões históricos (últimos 30 dias)
      const thirtyDaysAgo = new Date(targetDate);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const historicalActivities = await db
        .select()
        .from(manualActivities)
        .where(and(
          eq(manualActivities.userId, ctx.user.id),
          gte(manualActivities.startTime, thirtyDaysAgo)
        ))
        .orderBy(desc(manualActivities.startTime))
        .limit(100);

      // Algoritmo de sugestões
      const suggestions: any[] = [];
      const expiresAt = new Date(targetDate);
      expiresAt.setDate(expiresAt.getDate() + 7); // Sugestões expiram em 7 dias

      // Identificar blocos de tempo sem atividade manual
      for (const session of sessions) {
        const sessionStart = new Date(session.startTime);
        const sessionEnd = new Date(session.endTime);

        // Verificar se já existe atividade manual neste período
        const hasActivity = existingActivities.some(activity => {
          const activityStart = new Date(activity.startTime);
          return activityStart >= sessionStart && activityStart <= sessionEnd;
        });

        if (!hasActivity && session.activeMinutes >= 15) {
          // Buscar padrão similar no histórico
          const hourOfDay = sessionStart.getHours();
          const dayOfWeek = sessionStart.getDay();

          const similarActivities = historicalActivities.filter(activity => {
            const activityStart = new Date(activity.startTime);
            const activityHour = activityStart.getHours();
            const activityDay = activityStart.getDay();
            
            // Mesmo horário (±2 horas) e mesmo dia da semana
            return Math.abs(activityHour - hourOfDay) <= 2 && activityDay === dayOfWeek;
          });

          // Determinar categoria e título mais comum
          const categoryCount: Record<string, number> = {};
          const titleCount: Record<string, number> = {};

          similarActivities.forEach(activity => {
            if (activity.category) {
              categoryCount[activity.category] = (categoryCount[activity.category] || 0) + 1;
            }
            titleCount[activity.title] = (titleCount[activity.title] || 0) + 1;
          });

          const mostCommonCategory = Object.keys(categoryCount).sort((a, b) => 
            categoryCount[b] - categoryCount[a]
          )[0] || "Trabalho";

          const mostCommonTitle = Object.keys(titleCount).sort((a, b) => 
            titleCount[b] - titleCount[a]
          )[0] || "Atividade de trabalho";

          // Calcular confiança baseado em padrões
          const confidenceScore = Math.min(100, Math.floor(
            (similarActivities.length / 5) * 100 // Máximo 100% com 5+ ocorrências similares
          ));

          suggestions.push({
            userId: ctx.user.id,
            suggestedTitle: mostCommonTitle,
            suggestedDescription: `Baseado em ${similarActivities.length} atividades similares`,
            suggestedCategory: mostCommonCategory,
            detectedStartTime: sessionStart,
            detectedEndTime: sessionEnd,
            detectedDurationMinutes: session.activeMinutes,
            confidenceScore: confidenceScore,
            patterns: JSON.stringify({
              hourOfDay,
              dayOfWeek,
              similarCount: similarActivities.length,
              mostCommonCategory,
            }),
            status: "pending",
            expiresAt,
          });
        }
      }

      // Inserir sugestões no banco
      if (suggestions.length > 0) {
        await db.insert(activitySuggestions).values(suggestions);
      }

      return { 
        success: true, 
        suggestionsCount: suggestions.length,
        suggestions 
      };
    }),

  /**
   * Listar sugestões pendentes
   */
  listPendingSuggestions: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const now = new Date();

      const suggestions = await db
        .select()
        .from(activitySuggestions)
        .where(and(
          eq(activitySuggestions.userId, ctx.user.id),
          eq(activitySuggestions.status, "pending"),
          gte(activitySuggestions.expiresAt, now)
        ))
        .orderBy(desc(activitySuggestions.confidenceScore), desc(activitySuggestions.createdAt))
        .limit(20);

      return suggestions.map(suggestion => ({
        ...suggestion,
        patterns: suggestion.patterns ? JSON.parse(suggestion.patterns) : {},
      }));
    }),

  /**
   * Aceitar sugestão e criar atividade
   */
  acceptSuggestion: protectedProcedure
    .input(z.object({
      suggestionId: z.number(),
      customTitle: z.string().optional(),
      customCategory: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar sugestão
      const [suggestion] = await db
        .select()
        .from(activitySuggestions)
        .where(and(
          eq(activitySuggestions.id, input.suggestionId),
          eq(activitySuggestions.userId, ctx.user.id),
          eq(activitySuggestions.status, "pending")
        ))
        .limit(1);

      if (!suggestion) {
        throw new Error("Sugestão não encontrada ou já processada");
      }

      // Criar atividade manual
      const [activity] = await db.insert(manualActivities).values({
        userId: ctx.user.id,
        title: input.customTitle || suggestion.suggestedTitle,
        description: suggestion.suggestedDescription || null,
        category: input.customCategory || suggestion.suggestedCategory || null,
        startTime: suggestion.detectedStartTime,
        endTime: suggestion.detectedEndTime,
        durationMinutes: suggestion.detectedDurationMinutes,
        source: "suggestion_accepted",
        suggestionId: suggestion.id,
      });

      // Atualizar sugestão
      await db
        .update(activitySuggestions)
        .set({
          status: "accepted",
          acceptedAt: new Date(),
          createdActivityId: activity.insertId,
        })
        .where(eq(activitySuggestions.id, input.suggestionId));

      return { success: true, activityId: activity.insertId };
    }),

  /**
   * Rejeitar sugestão
   */
  rejectSuggestion: protectedProcedure
    .input(z.object({ suggestionId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(activitySuggestions)
        .set({
          status: "rejected",
          rejectedAt: new Date(),
        })
        .where(and(
          eq(activitySuggestions.id, input.suggestionId),
          eq(activitySuggestions.userId, ctx.user.id)
        ));

      return { success: true };
    }),

  /**
   * Estatísticas de atividades
   */
  getActivityStats: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const activities = await db
        .select()
        .from(manualActivities)
        .where(and(
          eq(manualActivities.userId, ctx.user.id),
          gte(manualActivities.startTime, new Date(input.startDate)),
          lte(manualActivities.startTime, new Date(input.endDate))
        ));

      const totalActivities = activities.length;
      const totalMinutes = activities.reduce((sum, a) => sum + a.durationMinutes, 0);
      const totalHours = Math.floor(totalMinutes / 60);

      // Agrupar por categoria
      const byCategory: Record<string, { count: number; minutes: number }> = {};
      activities.forEach(activity => {
        const category = activity.category || "Sem categoria";
        if (!byCategory[category]) {
          byCategory[category] = { count: 0, minutes: 0 };
        }
        byCategory[category].count++;
        byCategory[category].minutes += activity.durationMinutes;
      });

      // Agrupar por dia
      const byDay: Record<string, { count: number; minutes: number }> = {};
      activities.forEach(activity => {
        const day = new Date(activity.startTime).toISOString().split('T')[0];
        if (!byDay[day]) {
          byDay[day] = { count: 0, minutes: 0 };
        }
        byDay[day].count++;
        byDay[day].minutes += activity.durationMinutes;
      });

      return {
        totalActivities,
        totalMinutes,
        totalHours,
        byCategory,
        byDay,
      };
    }),
});
