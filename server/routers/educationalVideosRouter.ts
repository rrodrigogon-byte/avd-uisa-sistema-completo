import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { 
  educationalVideoCategories,
  educationalVideos,
  videoWatchAnalytics,
  videoWatchSessions,
  videoPerformanceCorrelation
} from "../../drizzle/schema";
import { eq, and, desc, sql, gte, lte, or, like } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const educationalVideosRouter = router({
  // ============================================================================
  // CATEGORIAS DE VÍDEOS
  // ============================================================================

  /**
   * Listar todas as categorias ativas
   */
  listCategories: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const categories = await db
      .select()
      .from(educationalVideoCategories)
      .where(eq(educationalVideoCategories.active, true))
      .orderBy(educationalVideoCategories.displayOrder, educationalVideoCategories.name);

    return categories || [];
  }),

  /**
   * Criar nova categoria (admin)
   */
  createCategory: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        icon: z.string().optional(),
        displayOrder: z.number().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [category] = await db.insert(educationalVideoCategories).values(input);

      return { success: true, categoryId: category.insertId };
    }),

  // ============================================================================
  // VÍDEOS EDUCACIONAIS
  // ============================================================================

  /**
   * Listar vídeos com filtros
   */
  listVideos: protectedProcedure
    .input(
      z.object({
        categoryId: z.number().optional(),
        difficultyLevel: z.enum(["basico", "intermediario", "avancado"]).optional(),
        featured: z.boolean().optional(),
        search: z.string().optional(),
        active: z.boolean().default(true),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [];
      
      if (input?.active !== undefined) {
        conditions.push(eq(educationalVideos.active, input.active));
      }
      if (input?.categoryId) {
        conditions.push(eq(educationalVideos.categoryId, input.categoryId));
      }
      if (input?.difficultyLevel) {
        conditions.push(eq(educationalVideos.difficultyLevel, input.difficultyLevel));
      }
      if (input?.featured !== undefined) {
        conditions.push(eq(educationalVideos.featured, input.featured));
      }
      if (input?.search) {
        conditions.push(
          or(
            like(educationalVideos.title, `%${input.search}%`),
            like(educationalVideos.description, `%${input.search}%`)
          )!
        );
      }

      let query = db
        .select({
          video: educationalVideos,
          category: educationalVideoCategories,
          userProgress: videoWatchAnalytics,
        })
        .from(educationalVideos)
        .leftJoin(educationalVideoCategories, eq(educationalVideos.categoryId, educationalVideoCategories.id))
        .leftJoin(
          videoWatchAnalytics,
          and(
            eq(videoWatchAnalytics.videoId, educationalVideos.id),
            eq(videoWatchAnalytics.userId, ctx.user.id)
          )
        );

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const results = await query
        .orderBy(desc(educationalVideos.featured), desc(educationalVideos.viewCount))
        .limit(input?.limit || 50)
        .offset(input?.offset || 0);

      return results.map(r => ({
        ...r.video,
        category: r.category,
        userProgress: r.userProgress || null,
      }));
    }),

  /**
   * Buscar vídeo por ID
   */
  getVideo: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [result] = await db
        .select({
          video: educationalVideos,
          category: educationalVideoCategories,
          userProgress: videoWatchAnalytics,
        })
        .from(educationalVideos)
        .leftJoin(educationalVideoCategories, eq(educationalVideos.categoryId, educationalVideoCategories.id))
        .leftJoin(
          videoWatchAnalytics,
          and(
            eq(videoWatchAnalytics.videoId, educationalVideos.id),
            eq(videoWatchAnalytics.userId, ctx.user.id)
          )
        )
        .where(eq(educationalVideos.id, input.id))
        .limit(1);

      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });
      }

      return {
        ...result.video,
        category: result.category,
        userProgress: result.userProgress || null,
      };
    }),

  /**
   * Criar novo vídeo (admin)
   */
  createVideo: adminProcedure
    .input(
      z.object({
        categoryId: z.number(),
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        videoUrl: z.string().url(),
        thumbnailUrl: z.string().url().optional(),
        duration: z.number().positive(),
        tags: z.array(z.string()).optional(),
        relatedCompetencies: z.array(z.number()).optional(),
        relatedPIRDimensions: z.array(z.enum(["IP", "ID", "IC", "ES", "FL", "AU"])).optional(),
        difficultyLevel: z.enum(["basico", "intermediario", "avancado"]).default("basico"),
        targetAudience: z.array(z.string()).optional(),
        featured: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [video] = await db.insert(educationalVideos).values({
        ...input,
        createdBy: ctx.user.id,
      });

      return { success: true, videoId: video.insertId };
    }),

  /**
   * Atualizar vídeo (admin)
   */
  updateVideo: adminProcedure
    .input(
      z.object({
        id: z.number(),
        categoryId: z.number().optional(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        videoUrl: z.string().url().optional(),
        thumbnailUrl: z.string().url().optional(),
        duration: z.number().positive().optional(),
        tags: z.array(z.string()).optional(),
        relatedCompetencies: z.array(z.number()).optional(),
        relatedPIRDimensions: z.array(z.enum(["IP", "ID", "IC", "ES", "FL", "AU"])).optional(),
        difficultyLevel: z.enum(["basico", "intermediario", "avancado"]).optional(),
        targetAudience: z.array(z.string()).optional(),
        featured: z.boolean().optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { id, ...updates } = input;

      await db.update(educationalVideos).set(updates).where(eq(educationalVideos.id, id));

      return { success: true };
    }),

  /**
   * Deletar vídeo (admin - soft delete)
   */
  deleteVideo: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.update(educationalVideos).set({ active: false }).where(eq(educationalVideos.id, input.id));

      return { success: true };
    }),

  // ============================================================================
  // TRACKING DE VISUALIZAÇÃO
  // ============================================================================

  /**
   * Iniciar sessão de visualização
   */
  startWatchSession: protectedProcedure
    .input(
      z.object({
        videoId: z.number(),
        startPosition: z.number().default(0),
        deviceType: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Criar sessão
      const [session] = await db.insert(videoWatchSessions).values({
        videoId: input.videoId,
        userId: ctx.user.id,
        startedAt: new Date(),
        startPosition: input.startPosition,
        deviceType: input.deviceType,
      });

      // Incrementar view count
      await db
        .update(educationalVideos)
        .set({ viewCount: sql`${educationalVideos.viewCount} + 1` })
        .where(eq(educationalVideos.id, input.videoId));

      return { success: true, sessionId: session.insertId };
    }),

  /**
   * Atualizar progresso de visualização
   */
  updateWatchProgress: protectedProcedure
    .input(
      z.object({
        videoId: z.number(),
        sessionId: z.number(),
        currentPosition: z.number(),
        watchedSeconds: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Atualizar sessão
      await db
        .update(videoWatchSessions)
        .set({
          endPosition: input.currentPosition,
          watchedSeconds: input.watchedSeconds,
          endedAt: new Date(),
        })
        .where(eq(videoWatchSessions.id, input.sessionId));

      // Upsert analytics
      const existing = await db
        .select()
        .from(videoWatchAnalytics)
        .where(
          and(
            eq(videoWatchAnalytics.videoId, input.videoId),
            eq(videoWatchAnalytics.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(videoWatchAnalytics)
          .set({
            lastWatchPosition: input.currentPosition,
            watchedSeconds: sql`${videoWatchAnalytics.watchedSeconds} + ${input.watchedSeconds}`,
            totalWatchTime: sql`${videoWatchAnalytics.totalWatchTime} + ${input.watchedSeconds}`,
            lastWatchedAt: new Date(),
          })
          .where(eq(videoWatchAnalytics.id, existing[0].id));
      } else {
        await db.insert(videoWatchAnalytics).values({
          videoId: input.videoId,
          userId: ctx.user.id,
          watchedSeconds: input.watchedSeconds,
          lastWatchPosition: input.currentPosition,
          totalWatchTime: input.watchedSeconds,
        });
      }

      return { success: true };
    }),

  /**
   * Marcar vídeo como concluído
   */
  completeVideo: protectedProcedure
    .input(
      z.object({
        videoId: z.number(),
        sessionId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Marcar sessão como concluída
      await db
        .update(videoWatchSessions)
        .set({
          completedInSession: true,
          endedAt: new Date(),
        })
        .where(eq(videoWatchSessions.id, input.sessionId));

      // Atualizar analytics
      await db
        .update(videoWatchAnalytics)
        .set({
          completed: true,
          completedAt: new Date(),
        })
        .where(
          and(
            eq(videoWatchAnalytics.videoId, input.videoId),
            eq(videoWatchAnalytics.userId, ctx.user.id)
          )
        );

      // Incrementar completion count
      await db
        .update(educationalVideos)
        .set({ completionCount: sql`${educationalVideos.completionCount} + 1` })
        .where(eq(educationalVideos.id, input.videoId));

      return { success: true };
    }),

  /**
   * Toggle like no vídeo
   */
  toggleLike: protectedProcedure
    .input(z.object({ videoId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [existing] = await db
        .select()
        .from(videoWatchAnalytics)
        .where(
          and(
            eq(videoWatchAnalytics.videoId, input.videoId),
            eq(videoWatchAnalytics.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (existing) {
        await db
          .update(videoWatchAnalytics)
          .set({ liked: !existing.liked })
          .where(eq(videoWatchAnalytics.id, existing.id));

        return { success: true, liked: !existing.liked };
      } else {
        await db.insert(videoWatchAnalytics).values({
          videoId: input.videoId,
          userId: ctx.user.id,
          liked: true,
        });

        return { success: true, liked: true };
      }
    }),

  /**
   * Toggle bookmark no vídeo
   */
  toggleBookmark: protectedProcedure
    .input(z.object({ videoId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [existing] = await db
        .select()
        .from(videoWatchAnalytics)
        .where(
          and(
            eq(videoWatchAnalytics.videoId, input.videoId),
            eq(videoWatchAnalytics.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (existing) {
        await db
          .update(videoWatchAnalytics)
          .set({ bookmarked: !existing.bookmarked })
          .where(eq(videoWatchAnalytics.id, existing.id));

        return { success: true, bookmarked: !existing.bookmarked };
      } else {
        await db.insert(videoWatchAnalytics).values({
          videoId: input.videoId,
          userId: ctx.user.id,
          bookmarked: true,
        });

        return { success: true, bookmarked: true };
      }
    }),

  // ============================================================================
  // ANALYTICS E ESTATÍSTICAS
  // ============================================================================

  /**
   * Estatísticas gerais de vídeos (admin)
   */
  getVideoStats: adminProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [];
      if (input?.startDate) {
        conditions.push(gte(educationalVideos.createdAt, input.startDate));
      }
      if (input?.endDate) {
        conditions.push(lte(educationalVideos.createdAt, input.endDate));
      }

      const [stats] = await db
        .select({
          totalVideos: sql<number>`COUNT(*)`,
          activeVideos: sql<number>`SUM(CASE WHEN ${educationalVideos.active} = 1 THEN 1 ELSE 0 END)`,
          totalViews: sql<number>`SUM(${educationalVideos.viewCount})`,
          totalCompletions: sql<number>`SUM(${educationalVideos.completionCount})`,
          avgCompletionRate: sql<number>`AVG(CASE WHEN ${educationalVideos.viewCount} > 0 THEN (${educationalVideos.completionCount} * 100.0 / ${educationalVideos.viewCount}) ELSE 0 END)`,
        })
        .from(educationalVideos);

      return stats || { totalVideos: 0, activeVideos: 0, totalViews: 0, totalCompletions: 0, avgCompletionRate: 0 };
    }),

  /**
   * Vídeos mais assistidos
   */
  getMostWatchedVideos: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const videos = await db
        .select({
          video: educationalVideos,
          category: educationalVideoCategories,
        })
        .from(educationalVideos)
        .leftJoin(educationalVideoCategories, eq(educationalVideos.categoryId, educationalVideoCategories.id))
        .where(eq(educationalVideos.active, true))
        .orderBy(desc(educationalVideos.viewCount))
        .limit(input.limit);

      return videos.map(v => ({
        ...v.video,
        category: v.category,
      }));
    }),

  /**
   * Progresso do usuário
   */
  getUserProgress: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const [stats] = await db
      .select({
        totalWatched: sql<number>`COUNT(*)`,
        totalCompleted: sql<number>`SUM(CASE WHEN ${videoWatchAnalytics.completed} = 1 THEN 1 ELSE 0 END)`,
        totalWatchTime: sql<number>`SUM(${videoWatchAnalytics.totalWatchTime})`,
        totalLiked: sql<number>`SUM(CASE WHEN ${videoWatchAnalytics.liked} = 1 THEN 1 ELSE 0 END)`,
        totalBookmarked: sql<number>`SUM(CASE WHEN ${videoWatchAnalytics.bookmarked} = 1 THEN 1 ELSE 0 END)`,
      })
      .from(videoWatchAnalytics)
      .where(eq(videoWatchAnalytics.userId, ctx.user.id));

    return stats || { totalWatched: 0, totalCompleted: 0, totalWatchTime: 0, totalLiked: 0, totalBookmarked: 0 };
  }),
});
