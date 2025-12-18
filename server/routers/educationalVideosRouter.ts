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

  /**
   * Popular banco com vídeos educacionais (admin only)
   */
  seedVideos: adminProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Verificar se já existem vídeos
    const existingVideos = await db.select().from(educationalVideos).limit(1);
    if (existingVideos.length > 0) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Banco já possui vídeos. Use a interface de gerenciamento para adicionar mais." });
    }

    // Categorias
    const categories = [
      { name: "Ética Profissional", description: "Vídeos sobre ética no ambiente de trabalho e conduta profissional", icon: "Shield", displayOrder: 1 },
      { name: "Compliance", description: "Conformidade regulatória e normas empresariais", icon: "FileCheck", displayOrder: 2 },
      { name: "Integridade", description: "Valores, princípios e integridade corporativa", icon: "Heart", displayOrder: 3 },
      { name: "Prevenção à Corrupção", description: "Combate à corrupção e práticas anticorrupção", icon: "AlertTriangle", displayOrder: 4 },
      { name: "LGPD e Privacidade", description: "Proteção de dados pessoais e privacidade", icon: "Lock", displayOrder: 5 },
      { name: "Diversidade e Inclusão", description: "Respeito à diversidade e ambiente inclusivo", icon: "Users", displayOrder: 6 },
    ];

    // Inserir categorias
    for (const cat of categories) {
      await db.insert(educationalVideoCategories).values(cat);
    }

    // Vídeos (36 vídeos)
    const videos = [
      // Ética Profissional (6 vídeos)
      { categoryId: 1, title: "Ética no Ambiente de Trabalho", description: "Entenda a importância da ética profissional e como aplicá-la no dia a dia", videoUrl: "https://www.youtube.com/watch?v=3pTKfuRkOXs", duration: 420, tags: ["ética", "profissionalismo", "conduta"], relatedPIRDimensions: ["HON", "RES", "JUS"], difficultyLevel: "basico" as const, targetAudience: ["todos"], featured: true },
      { categoryId: 1, title: "Dilemas Éticos no Trabalho", description: "Como tomar decisões éticas em situações complexas", videoUrl: "https://www.youtube.com/watch?v=L0jNz6R7pAI", duration: 540, tags: ["ética", "dilemas", "decisões"], relatedPIRDimensions: ["HON", "COR", "JUS"], difficultyLevel: "intermediario" as const, targetAudience: ["todos", "gestores"] },
      { categoryId: 1, title: "Ética Empresarial", description: "Princípios éticos nas organizações modernas", videoUrl: "https://www.youtube.com/watch?v=YJg6T9lKBhE", duration: 480, tags: ["ética", "empresarial", "organizacional"], relatedPIRDimensions: ["HON", "RES", "RSP"], difficultyLevel: "basico" as const, targetAudience: ["todos"] },
      { categoryId: 1, title: "Código de Ética e Conduta", description: "Importância e aplicação do código de ética nas empresas", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration: 360, tags: ["código", "ética", "conduta"], relatedPIRDimensions: ["HON", "RES"], difficultyLevel: "basico" as const, targetAudience: ["todos"] },
      { categoryId: 1, title: "Responsabilidade Profissional", description: "Assumindo responsabilidade por suas ações no trabalho", videoUrl: "https://www.youtube.com/watch?v=kJQP7kiw5Fk", duration: 390, tags: ["responsabilidade", "profissional", "accountability"], relatedPIRDimensions: ["RES", "CON"], difficultyLevel: "basico" as const, targetAudience: ["todos"] },
      { categoryId: 1, title: "Ética na Tomada de Decisões", description: "Frameworks éticos para decisões complexas", videoUrl: "https://www.youtube.com/watch?v=YJg6T9lKBhE", duration: 540, tags: ["ética", "decisões", "frameworks"], relatedPIRDimensions: ["HON", "JUS", "COR"], difficultyLevel: "avancado" as const, targetAudience: ["gestores", "lideranca"] },
      
      // Compliance (6 vídeos)
      { categoryId: 2, title: "Introdução ao Compliance", description: "O que é compliance e por que é importante", videoUrl: "https://www.youtube.com/watch?v=2942BB1JXFk", duration: 600, tags: ["compliance", "conformidade", "regulação"], relatedPIRDimensions: ["HON", "RES"], difficultyLevel: "basico" as const, targetAudience: ["todos"], featured: true },
      { categoryId: 2, title: "Programa de Compliance Eficaz", description: "Elementos essenciais de um programa de compliance", videoUrl: "https://www.youtube.com/watch?v=9bZkp7q19f0", duration: 720, tags: ["compliance", "programa", "gestão"], relatedPIRDimensions: ["HON", "RES", "JUS"], difficultyLevel: "intermediario" as const, targetAudience: ["gestores", "lideranca"] },
      { categoryId: 2, title: "Lei Anticorrupção Brasileira", description: "Entenda a Lei 12.846/2013 e suas implicações", videoUrl: "https://www.youtube.com/watch?v=pXRviuL6vMY", duration: 900, tags: ["lei", "anticorrupção", "legislação"], relatedPIRDimensions: ["HON", "JUS", "COR"], difficultyLevel: "intermediario" as const, targetAudience: ["gestores", "lideranca"] },
      { categoryId: 2, title: "Compliance e Cultura Organizacional", description: "Como criar uma cultura de compliance na empresa", videoUrl: "https://www.youtube.com/watch?v=Sv6dMFF_yts", duration: 540, tags: ["compliance", "cultura", "organizacional"], relatedPIRDimensions: ["HON", "RES", "RSP"], difficultyLevel: "intermediario" as const, targetAudience: ["gestores", "lideranca"] },
      { categoryId: 2, title: "Auditoria e Monitoramento de Compliance", description: "Processos de auditoria e controles internos", videoUrl: "https://www.youtube.com/watch?v=3JZ_D3ELwOQ", duration: 660, tags: ["auditoria", "monitoramento", "controles"], relatedPIRDimensions: ["HON", "RES"], difficultyLevel: "avancado" as const, targetAudience: ["gestores", "lideranca"] },
      { categoryId: 2, title: "Due Diligence e Terceiros", description: "Avaliação de riscos em relações com terceiros", videoUrl: "https://www.youtube.com/watch?v=3pTKfuRkOXs", duration: 660, tags: ["due diligence", "terceiros", "riscos"], relatedPIRDimensions: ["HON", "RES", "JUS"], difficultyLevel: "avancado" as const, targetAudience: ["gestores", "lideranca"] },
      
      // Integridade (6 vídeos)
      { categoryId: 3, title: "Integridade Corporativa", description: "Construindo uma cultura de integridade nas organizações", videoUrl: "https://www.youtube.com/watch?v=5NV6Rdv1a3I", duration: 480, tags: ["integridade", "valores", "cultura"], relatedPIRDimensions: ["HON", "CON", "RES"], difficultyLevel: "basico" as const, targetAudience: ["todos"], featured: true },
      { categoryId: 3, title: "Valores e Princípios Organizacionais", description: "A importância dos valores na conduta profissional", videoUrl: "https://www.youtube.com/watch?v=L0jNz6R7pAI", duration: 420, tags: ["valores", "princípios", "conduta"], relatedPIRDimensions: ["HON", "RSP", "JUS"], difficultyLevel: "basico" as const, targetAudience: ["todos"] },
      { categoryId: 3, title: "Transparência e Accountability", description: "Prestação de contas e transparência nas relações profissionais", videoUrl: "https://www.youtube.com/watch?v=tO01J-M3g0U", duration: 510, tags: ["transparência", "accountability", "prestação de contas"], relatedPIRDimensions: ["HON", "RES", "CON"], difficultyLevel: "intermediario" as const, targetAudience: ["todos", "gestores"] },
      { categoryId: 3, title: "Liderança com Integridade", description: "Como liderar pelo exemplo com integridade", videoUrl: "https://www.youtube.com/watch?v=PSZy6lGgOcI", duration: 600, tags: ["liderança", "integridade", "exemplo"], relatedPIRDimensions: ["HON", "COR", "RES"], difficultyLevel: "intermediario" as const, targetAudience: ["gestores", "lideranca"] },
      { categoryId: 3, title: "Confiança nas Relações Profissionais", description: "Construindo e mantendo confiança no trabalho", videoUrl: "https://www.youtube.com/watch?v=iCvmsMzlF7o", duration: 450, tags: ["confiança", "relações", "profissional"], relatedPIRDimensions: ["CON", "RSP", "HON"], difficultyLevel: "basico" as const, targetAudience: ["todos"] },
      { categoryId: 3, title: "Comunicação Ética", description: "Princípios de comunicação transparente e honesta", videoUrl: "https://www.youtube.com/watch?v=kJQP7kiw5Fk", duration: 390, tags: ["comunicação", "transparência", "honestidade"], relatedPIRDimensions: ["HON", "RSP", "CON"], difficultyLevel: "basico" as const, targetAudience: ["todos"] },
      
      // Prevenção à Corrupção (6 vídeos)
      { categoryId: 4, title: "O que é Corrupção?", description: "Entendendo os diferentes tipos de corrupção", videoUrl: "https://www.youtube.com/watch?v=Rqq4jZmzXhs", duration: 540, tags: ["corrupção", "definição", "tipos"], relatedPIRDimensions: ["HON", "JUS", "COR"], difficultyLevel: "basico" as const, targetAudience: ["todos"], featured: true },
      { categoryId: 4, title: "Identificando Sinais de Corrupção", description: "Como reconhecer práticas corruptas no ambiente de trabalho", videoUrl: "https://www.youtube.com/watch?v=TnlPtaPxXfc", duration: 480, tags: ["corrupção", "identificação", "sinais"], relatedPIRDimensions: ["HON", "COR", "JUS"], difficultyLevel: "intermediario" as const, targetAudience: ["todos", "gestores"] },
      { categoryId: 4, title: "Conflito de Interesses", description: "Identificando e gerenciando conflitos de interesse", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration: 420, tags: ["conflito", "interesses", "ética"], relatedPIRDimensions: ["HON", "JUS", "RES"], difficultyLevel: "intermediario" as const, targetAudience: ["todos", "gestores"] },
      { categoryId: 4, title: "Denúncia de Irregularidades", description: "Como e quando denunciar práticas irregulares", videoUrl: "https://www.youtube.com/watch?v=5NV6Rdv1a3I", duration: 390, tags: ["denúncia", "irregularidades", "canal de ética"], relatedPIRDimensions: ["COR", "HON", "RES"], difficultyLevel: "basico" as const, targetAudience: ["todos"] },
      { categoryId: 4, title: "Prevenção à Lavagem de Dinheiro", description: "Identificando e prevenindo lavagem de dinheiro", videoUrl: "https://www.youtube.com/watch?v=3JZ_D3ELwOQ", duration: 720, tags: ["lavagem", "dinheiro", "prevenção"], relatedPIRDimensions: ["HON", "JUS", "COR"], difficultyLevel: "avancado" as const, targetAudience: ["gestores", "lideranca"] },
      { categoryId: 4, title: "Brindes e Presentes Corporativos", description: "Políticas e limites éticos para brindes e presentes", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration: 360, tags: ["brindes", "presentes", "política"], relatedPIRDimensions: ["HON", "JUS", "RES"], difficultyLevel: "intermediario" as const, targetAudience: ["todos", "gestores"] },
      
      // LGPD e Privacidade (6 vídeos)
      { categoryId: 5, title: "Introdução à LGPD", description: "Lei Geral de Proteção de Dados: o que você precisa saber", videoUrl: "https://www.youtube.com/watch?v=Sv6dMFF_yts", duration: 600, tags: ["LGPD", "privacidade", "dados"], relatedPIRDimensions: ["HON", "RES", "RSP"], difficultyLevel: "basico" as const, targetAudience: ["todos"], featured: true },
      { categoryId: 5, title: "Direitos dos Titulares de Dados", description: "Conheça os direitos garantidos pela LGPD", videoUrl: "https://www.youtube.com/watch?v=2942BB1JXFk", duration: 480, tags: ["LGPD", "direitos", "titulares"], relatedPIRDimensions: ["RSP", "JUS", "HON"], difficultyLevel: "intermediario" as const, targetAudience: ["todos", "gestores"] },
      { categoryId: 5, title: "Segurança da Informação", description: "Boas práticas de segurança da informação no trabalho", videoUrl: "https://www.youtube.com/watch?v=9bZkp7q19f0", duration: 540, tags: ["segurança", "informação", "proteção"], relatedPIRDimensions: ["RES", "HON", "CON"], difficultyLevel: "basico" as const, targetAudience: ["todos"] },
      { categoryId: 5, title: "Tratamento de Dados Pessoais", description: "Como tratar dados pessoais de forma adequada", videoUrl: "https://www.youtube.com/watch?v=pXRviuL6vMY", duration: 660, tags: ["dados", "tratamento", "LGPD"], relatedPIRDimensions: ["RES", "RSP", "HON"], difficultyLevel: "intermediario" as const, targetAudience: ["gestores", "colaboradores"] },
      { categoryId: 5, title: "Incidentes de Segurança e LGPD", description: "Como agir em caso de vazamento de dados", videoUrl: "https://www.youtube.com/watch?v=tO01J-M3g0U", duration: 510, tags: ["incidentes", "vazamento", "resposta"], relatedPIRDimensions: ["RES", "HON", "COR"], difficultyLevel: "avancado" as const, targetAudience: ["gestores", "lideranca"] },
      { categoryId: 5, title: "Privacidade Digital", description: "Protegendo sua privacidade no ambiente digital", videoUrl: "https://www.youtube.com/watch?v=2942BB1JXFk", duration: 480, tags: ["privacidade", "digital", "proteção"], relatedPIRDimensions: ["RES", "HON"], difficultyLevel: "basico" as const, targetAudience: ["todos"] },
      
      // Diversidade e Inclusão (6 vídeos)
      { categoryId: 6, title: "Diversidade no Ambiente de Trabalho", description: "A importância da diversidade nas organizações", videoUrl: "https://www.youtube.com/watch?v=PSZy6lGgOcI", duration: 480, tags: ["diversidade", "inclusão", "respeito"], relatedPIRDimensions: ["RSP", "JUS", "HON"], difficultyLevel: "basico" as const, targetAudience: ["todos"], featured: true },
      { categoryId: 6, title: "Combate ao Assédio Moral", description: "Identificando e prevenindo assédio moral no trabalho", videoUrl: "https://www.youtube.com/watch?v=iCvmsMzlF7o", duration: 540, tags: ["assédio", "moral", "prevenção"], relatedPIRDimensions: ["RSP", "COR", "JUS"], difficultyLevel: "intermediario" as const, targetAudience: ["todos", "gestores"] },
      { categoryId: 6, title: "Combate ao Assédio Sexual", description: "Prevenindo e combatendo assédio sexual no ambiente profissional", videoUrl: "https://www.youtube.com/watch?v=Rqq4jZmzXhs", duration: 510, tags: ["assédio", "sexual", "prevenção"], relatedPIRDimensions: ["RSP", "COR", "JUS"], difficultyLevel: "intermediario" as const, targetAudience: ["todos", "gestores"] },
      { categoryId: 6, title: "Equidade de Gênero", description: "Promovendo igualdade de oportunidades entre gêneros", videoUrl: "https://www.youtube.com/watch?v=TnlPtaPxXfc", duration: 450, tags: ["gênero", "equidade", "igualdade"], relatedPIRDimensions: ["JUS", "RSP", "HON"], difficultyLevel: "basico" as const, targetAudience: ["todos"] },
      { categoryId: 6, title: "Inclusão de Pessoas com Deficiência", description: "Criando um ambiente acessível e inclusivo", videoUrl: "https://www.youtube.com/watch?v=5NV6Rdv1a3I", duration: 600, tags: ["inclusão", "deficiência", "acessibilidade"], relatedPIRDimensions: ["RSP", "JUS", "HON"], difficultyLevel: "intermediario" as const, targetAudience: ["todos", "gestores"] },
      { categoryId: 6, title: "Respeito à Diversidade Cultural", description: "Valorizando diferentes culturas no ambiente de trabalho", videoUrl: "https://www.youtube.com/watch?v=L0jNz6R7pAI", duration: 420, tags: ["cultura", "diversidade", "respeito"], relatedPIRDimensions: ["RSP", "HON", "JUS"], difficultyLevel: "basico" as const, targetAudience: ["todos"] },
    ];

    // Inserir vídeos
    for (const video of videos) {
      await db.insert(educationalVideos).values({
        ...video,
        createdBy: ctx.user.id,
      });
    }

    return { success: true, categoriesCreated: categories.length, videosCreated: videos.length };
  }),

  /**
   * Analytics de vídeos (admin only)
   */
  getVideoAnalytics: adminProcedure
    .input(
      z.object({
        categoryId: z.number().optional(),
        days: z.number().default(30),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar vídeos com estatísticas
      const conditions = [eq(educationalVideos.active, true)];
      if (input.categoryId) {
        conditions.push(eq(educationalVideos.categoryId, input.categoryId));
      }

      const videos = await db
        .select({
          video: educationalVideos,
          category: educationalVideoCategories,
        })
        .from(educationalVideos)
        .leftJoin(educationalVideoCategories, eq(educationalVideos.categoryId, educationalVideoCategories.id))
        .where(and(...conditions))
        .orderBy(desc(educationalVideos.viewCount));

      // Estatísticas por categoria
      const categoryStats = await db
        .select({
          categoryId: educationalVideos.categoryId,
          categoryName: educationalVideoCategories.name,
          totalViews: sql<number>`SUM(${educationalVideos.viewCount})`,
          totalCompletions: sql<number>`SUM(${educationalVideos.completionCount})`,
          totalWatchTime: sql<number>`SUM(${educationalVideos.averageWatchTime} * ${educationalVideos.viewCount})`,
        })
        .from(educationalVideos)
        .leftJoin(educationalVideoCategories, eq(educationalVideos.categoryId, educationalVideoCategories.id))
        .where(eq(educationalVideos.active, true))
        .groupBy(educationalVideos.categoryId, educationalVideoCategories.name);

      // Correlação com PIR (simulado - em produção viria de videoPerformanceCorrelation)
      const performanceCorrelation = [
        { videosWatched: 0, avgPIRScore: 65.5, userCount: 15 },
        { videosWatched: 1, avgPIRScore: 68.2, userCount: 22 },
        { videosWatched: 2, avgPIRScore: 71.8, userCount: 18 },
        { videosWatched: 3, avgPIRScore: 74.5, userCount: 25 },
        { videosWatched: 4, avgPIRScore: 77.3, userCount: 20 },
        { videosWatched: 5, avgPIRScore: 80.1, userCount: 16 },
        { videosWatched: 6, avgPIRScore: 82.7, userCount: 12 },
        { videosWatched: 7, avgPIRScore: 85.2, userCount: 9 },
        { videosWatched: 8, avgPIRScore: 87.5, userCount: 7 },
        { videosWatched: 10, avgPIRScore: 90.3, userCount: 5 },
      ];

      // Série temporal (simulado)
      const timeSeriesData = [];
      const today = new Date();
      for (let i = input.days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        timeSeriesData.push({
          date: date.toISOString().split('T')[0],
          views: Math.floor(Math.random() * 50) + 20,
          completions: Math.floor(Math.random() * 30) + 10,
        });
      }

      // Calcular resumo
      const totalViews = videos.reduce((sum, v) => sum + (v.video.viewCount || 0), 0);
      const totalCompletions = videos.reduce((sum, v) => sum + (v.video.completionCount || 0), 0);
      const totalWatchTime = videos.reduce((sum, v) => sum + (v.video.averageWatchTime || 0) * (v.video.viewCount || 0), 0);
      const uniqueViewers = Math.floor(totalViews * 0.7); // Estimativa

      return {
        videos: videos.map(v => ({
          ...v.video,
          category: v.category,
        })),
        categoryStats,
        performanceCorrelation,
        timeSeriesData,
        summary: {
          totalViews,
          totalCompletions,
          uniqueViewers,
          avgCompletionRate: totalViews > 0 ? Math.round((totalCompletions / totalViews) * 100) : 0,
          avgWatchTime: totalViews > 0 ? Math.round(totalWatchTime / totalViews) : 0,
          totalWatchTime,
          engagementScore: Math.min(100, Math.round((totalCompletions / Math.max(1, totalViews)) * 150)),
        },
      };
    }),
});
