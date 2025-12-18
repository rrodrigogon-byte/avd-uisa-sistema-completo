import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../routers";
import { getDb } from "../db";
import { educationalVideos, educationalVideoCategories, videoWatchAnalytics } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Testes para o sistema de vídeos educacionais
 * Valida seed, listagem, recomendações e progresso de vídeos
 */
describe("Educational Videos System", () => {
  let db: Awaited<ReturnType<typeof getDb>>;
  let adminCaller: ReturnType<typeof appRouter.createCaller>;
  let userCaller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    // Criar callers para admin e usuário comum
    adminCaller = appRouter.createCaller({
      user: { id: 1, name: "Admin User", email: "admin@test.com", role: "admin", openId: "admin-123" },
      req: {} as any,
      res: {} as any,
    });

    userCaller = appRouter.createCaller({
      user: { id: 2, name: "Regular User", email: "user@test.com", role: "user", openId: "user-123" },
      req: {} as any,
      res: {} as any,
    });
  });

  describe("Categories", () => {
    it("deve listar categorias de vídeos", async () => {
      const categories = await adminCaller.educationalVideos.listCategories();

      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      
      const firstCategory = categories[0];
      expect(firstCategory).toHaveProperty("id");
      expect(firstCategory).toHaveProperty("name");
      expect(firstCategory).toHaveProperty("description");
    });
  });

  describe("Seed Videos", () => {
    it("deve popular banco com 36 vídeos educacionais", async () => {
      const result = await adminCaller.educationalVideos.seedVideos();

      expect(result).toHaveProperty("success");
      expect(result.success).toBe(true);
      expect(result).toHaveProperty("message");
      expect(result.message).toContain("36 vídeos");
      expect(result).toHaveProperty("categoriesCreated");
      expect(result).toHaveProperty("videosCreated");
      
      // Verificar que 6 categorias foram criadas
      expect(result.categoriesCreated).toBe(6);
      
      // Verificar que 36 vídeos foram criados
      expect(result.videosCreated).toBe(36);
    });

    it("deve evitar duplicação ao executar seed novamente", async () => {
      // Executar seed pela segunda vez
      const result = await adminCaller.educationalVideos.seedVideos();

      expect(result.success).toBe(true);
      expect(result.videosCreated).toBe(0); // Nenhum vídeo novo criado
      expect(result.message).toContain("já existem");
    });

    it("deve criar vídeos com dimensões PIR corretas", async () => {
      if (!db) throw new Error("Database not available");

      const videos = await db
        .select()
        .from(educationalVideos)
        .limit(10);

      expect(videos.length).toBeGreaterThan(0);

      // Verificar que todos os vídeos têm dimensões PIR válidas
      const validDimensions = ["IP", "ID", "IC", "ES", "FL", "AU"];
      
      videos.forEach(video => {
        expect(video.relatedPIRDimensions).toBeDefined();
        const dimensions = video.relatedPIRDimensions as string[];
        expect(Array.isArray(dimensions)).toBe(true);
        expect(dimensions.length).toBeGreaterThan(0);
        
        // Todas as dimensões devem ser válidas
        dimensions.forEach(dim => {
          expect(validDimensions).toContain(dim);
        });
      });
    });
  });

  describe("List Videos", () => {
    it("deve listar todos os vídeos ativos", async () => {
      const result = await userCaller.educationalVideos.listVideos({ limit: 100 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(36);

      const firstVideo = result[0];
      expect(firstVideo).toHaveProperty("id");
      expect(firstVideo).toHaveProperty("title");
      expect(firstVideo).toHaveProperty("description");
      expect(firstVideo).toHaveProperty("videoUrl");
      expect(firstVideo).toHaveProperty("duration");
      expect(firstVideo).toHaveProperty("categoryId");
      expect(firstVideo).toHaveProperty("categoryName");
      expect(firstVideo).toHaveProperty("relatedPIRDimensions");
      expect(firstVideo).toHaveProperty("difficultyLevel");
    });

    it("deve filtrar vídeos por categoria", async () => {
      const categories = await userCaller.educationalVideos.listCategories();
      const firstCategory = categories[0];

      const result = await userCaller.educationalVideos.listVideos({
        categoryId: firstCategory.id,
        limit: 100
      });

      expect(Array.isArray(result)).toBe(true);
      
      // Todos os vídeos devem ser da categoria selecionada
      result.forEach(video => {
        expect(video.categoryId).toBe(firstCategory.id);
      });
    });

    it("deve incluir progresso do usuário nos vídeos", async () => {
      const result = await userCaller.educationalVideos.listVideos({ limit: 10 });

      expect(Array.isArray(result)).toBe(true);
      
      // Cada vídeo deve ter campo userProgress (mesmo que null)
      result.forEach(video => {
        expect(video).toHaveProperty("userProgress");
      });
    });
  });

  describe("Watch Sessions", () => {
    it("deve iniciar sessão de visualização", async () => {
      const videos = await userCaller.educationalVideos.listVideos({ limit: 1 });
      const testVideo = videos[0];

      const result = await userCaller.educationalVideos.startWatchSession({
        videoId: testVideo.id,
        startPosition: 0
      });

      expect(result).toHaveProperty("success");
      expect(result.success).toBe(true);
      expect(result).toHaveProperty("sessionId");
      expect(typeof result.sessionId).toBe("number");
    });

    it("deve marcar vídeo como concluído", async () => {
      const videos = await userCaller.educationalVideos.listVideos({ limit: 1 });
      const testVideo = videos[0];

      // Iniciar sessão
      const session = await userCaller.educationalVideos.startWatchSession({
        videoId: testVideo.id,
        startPosition: 0
      });

      // Marcar como concluído
      const result = await userCaller.educationalVideos.completeVideo({
        videoId: testVideo.id,
        sessionId: session.sessionId
      });

      expect(result).toHaveProperty("success");
      expect(result.success).toBe(true);
      expect(result).toHaveProperty("message");
      expect(result.message).toContain("concluído");
    });

    it("deve atualizar estatísticas do usuário após conclusão", async () => {
      const statsBefore = await userCaller.educationalVideos.getUserStats();
      const completedBefore = statsBefore.completedVideos;

      const videos = await userCaller.educationalVideos.listVideos({ limit: 1 });
      const testVideo = videos[0];

      // Completar vídeo
      const session = await userCaller.educationalVideos.startWatchSession({
        videoId: testVideo.id,
        startPosition: 0
      });
      await userCaller.educationalVideos.completeVideo({
        videoId: testVideo.id,
        sessionId: session.sessionId
      });

      const statsAfter = await userCaller.educationalVideos.getUserStats();
      
      expect(statsAfter.completedVideos).toBeGreaterThanOrEqual(completedBefore);
    });
  });

  describe("User Statistics", () => {
    it("deve retornar estatísticas do usuário", async () => {
      const stats = await userCaller.educationalVideos.getUserStats();

      expect(stats).toHaveProperty("totalVideos");
      expect(stats).toHaveProperty("watchedVideos");
      expect(stats).toHaveProperty("completedVideos");
      expect(stats).toHaveProperty("totalWatchTimeMinutes");
      expect(stats).toHaveProperty("completionRate");

      expect(typeof stats.totalVideos).toBe("number");
      expect(typeof stats.watchedVideos).toBe("number");
      expect(typeof stats.completedVideos).toBe("number");
      expect(typeof stats.totalWatchTimeMinutes).toBe("number");
      expect(typeof stats.completionRate).toBe("number");

      expect(stats.completionRate).toBeGreaterThanOrEqual(0);
      expect(stats.completionRate).toBeLessThanOrEqual(100);
    });
  });

  describe("Recommendations", () => {
    it("deve retornar vídeos recomendados", async () => {
      const recommendations = await userCaller.educationalVideos.getRecommendations({
        limit: 6
      });

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeLessThanOrEqual(6);

      const firstRec = recommendations[0];
      expect(firstRec).toHaveProperty("id");
      expect(firstRec).toHaveProperty("title");
      expect(firstRec).toHaveProperty("description");
      expect(firstRec).toHaveProperty("reason");
      expect(firstRec).toHaveProperty("relatedPIRDimensions");
    });

    it("deve priorizar vídeos não assistidos", async () => {
      const recommendations = await userCaller.educationalVideos.getRecommendations({
        limit: 10
      });

      // Verificar que as recomendações incluem vídeos não concluídos
      recommendations.forEach(video => {
        // Se o vídeo tem userProgress, não deve estar completo
        if (video.userProgress) {
          expect(video.userProgress.completed).toBe(false);
        }
      });
    });

    it("deve retornar vídeos em destaque quando não há PIR", async () => {
      // Criar um novo usuário sem PIR
      const newUserCaller = appRouter.createCaller({
        user: { id: 999, name: "New User", email: "new@test.com", role: "user", openId: "new-999" },
        req: {} as any,
        res: {} as any,
      });

      const recommendations = await newUserCaller.educationalVideos.getRecommendations({
        limit: 6
      });

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      
      // Deve retornar vídeos em destaque
      recommendations.forEach(video => {
        expect(video.reason).toBe("Vídeo em destaque");
      });
    });
  });

  describe("Analytics", () => {
    it("deve retornar analytics de vídeos", async () => {
      const analytics = await adminCaller.educationalVideos.getVideoAnalytics({
        days: 30
      });

      expect(analytics).toHaveProperty("videos");
      expect(analytics).toHaveProperty("categoryStats");
      expect(analytics).toHaveProperty("performanceCorrelation");
      expect(analytics).toHaveProperty("timeSeriesData");
      expect(analytics).toHaveProperty("summary");

      expect(Array.isArray(analytics.videos)).toBe(true);
      expect(Array.isArray(analytics.categoryStats)).toBe(true);
      expect(Array.isArray(analytics.performanceCorrelation)).toBe(true);
      expect(Array.isArray(analytics.timeSeriesData)).toBe(true);

      const summary = analytics.summary;
      expect(summary).toHaveProperty("totalViews");
      expect(summary).toHaveProperty("totalCompletions");
      expect(summary).toHaveProperty("uniqueViewers");
      expect(summary).toHaveProperty("avgCompletionRate");
      expect(summary).toHaveProperty("avgWatchTime");
      expect(summary).toHaveProperty("engagementScore");
    });

    it("deve filtrar analytics por categoria", async () => {
      const categories = await adminCaller.educationalVideos.listCategories();
      const firstCategory = categories[0];

      const analytics = await adminCaller.educationalVideos.getVideoAnalytics({
        categoryId: firstCategory.id,
        days: 30
      });

      expect(analytics).toHaveProperty("videos");
      
      // Todos os vídeos devem ser da categoria filtrada
      analytics.videos.forEach((video: any) => {
        expect(video.categoryId).toBe(firstCategory.id);
      });
    });
  });

  describe("Integration Tests", () => {
    it("deve completar fluxo completo: seed -> listar -> assistir -> recomendar", async () => {
      // 1. Seed (já executado)
      const categories = await adminCaller.educationalVideos.listCategories();
      expect(categories.length).toBeGreaterThan(0);

      // 2. Listar vídeos
      const videos = await userCaller.educationalVideos.listVideos({ limit: 5 });
      expect(videos.length).toBeGreaterThan(0);

      // 3. Assistir e completar vídeo
      const testVideo = videos[0];
      const session = await userCaller.educationalVideos.startWatchSession({
        videoId: testVideo.id,
        startPosition: 0
      });
      expect(session.success).toBe(true);

      const completion = await userCaller.educationalVideos.completeVideo({
        videoId: testVideo.id,
        sessionId: session.sessionId
      });
      expect(completion.success).toBe(true);

      // 4. Verificar estatísticas
      const stats = await userCaller.educationalVideos.getUserStats();
      expect(stats.completedVideos).toBeGreaterThan(0);

      // 5. Obter recomendações
      const recommendations = await userCaller.educationalVideos.getRecommendations({
        limit: 3
      });
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });
});
