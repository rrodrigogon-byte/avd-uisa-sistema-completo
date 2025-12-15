import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { npsSurveys, npsResponses } from "../../drizzle/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";

export const npsRouter = router({
  createSurvey: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      mainQuestion: z.string().min(1),
      promoterFollowUp: z.string().optional(),
      passiveFollowUp: z.string().optional(),
      detractorFollowUp: z.string().optional(),
      triggerEvent: z.enum(["process_completed", "step_completed", "manual"]).default("process_completed"),
      triggerStepNumber: z.number().optional(),
      delayMinutes: z.number().default(0),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(npsSurveys).values({
        name: input.name,
        description: input.description,
        mainQuestion: input.mainQuestion,
        promoterFollowUp: input.promoterFollowUp,
        passiveFollowUp: input.passiveFollowUp,
        detractorFollowUp: input.detractorFollowUp,
        triggerEvent: input.triggerEvent,
        triggerStepNumber: input.triggerStepNumber,
        delayMinutes: input.delayMinutes,
        createdBy: ctx.user.id,
        status: "draft",
      });

      return { success: true, surveyId: Number(result[0].insertId) };
    }),

  listSurveys: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const surveys = await db.select()
      .from(npsSurveys)
      .orderBy(desc(npsSurveys.createdAt));

    const surveysWithStats = await Promise.all(surveys.map(async (survey) => {
      const responses = await db.select()
        .from(npsResponses)
        .where(eq(npsResponses.surveyId, survey.id));

      const responseCount = responses.length;
      const promoters = responses.filter(r => r.category === "promoter").length;
      const detractors = responses.filter(r => r.category === "detractor").length;
      const npsScore = responseCount > 0 
        ? Math.round(((promoters - detractors) / responseCount) * 100) 
        : 0;

      return { ...survey, responseCount, npsScore };
    }));

    return surveysWithStats;
  }),

  getById: protectedProcedure
    .input(z.object({ surveyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [survey] = await db.select()
        .from(npsSurveys)
        .where(eq(npsSurveys.id, input.surveyId))
        .limit(1);

      return survey || null;
    }),

  getActiveSurvey: protectedProcedure
    .input(z.object({
      triggerEvent: z.enum(["process_completed", "step_completed", "manual"]),
      stepNumber: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      let query = db.select()
        .from(npsSurveys)
        .where(and(
          eq(npsSurveys.status, "active"),
          eq(npsSurveys.triggerEvent, input.triggerEvent)
        ))
        .limit(1);

      const [survey] = await query;
      return survey || null;
    }),

  updateStatus: adminProcedure
    .input(z.object({
      surveyId: z.number(),
      status: z.enum(["draft", "active", "paused", "completed"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(npsSurveys)
        .set({ status: input.status })
        .where(eq(npsSurveys.id, input.surveyId));

      return { success: true };
    }),

  hasResponded: protectedProcedure
    .input(z.object({
      surveyId: z.number(),
      employeeId: z.number(),
      processId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { hasResponded: false };

      const conditions = [
        eq(npsResponses.surveyId, input.surveyId),
        eq(npsResponses.employeeId, input.employeeId),
      ];

      if (input.processId) {
        conditions.push(eq(npsResponses.processId, input.processId));
      }

      const [existing] = await db.select()
        .from(npsResponses)
        .where(and(...conditions))
        .limit(1);

      return { hasResponded: !!existing };
    }),

  submitResponse: protectedProcedure
    .input(z.object({
      surveyId: z.number(),
      employeeId: z.number(),
      processId: z.number().optional(),
      score: z.number().min(0).max(10),
      followUpComment: z.string().optional(),
      responseTimeSeconds: z.number().optional(),
      deviceType: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const category = input.score >= 9 ? "promoter" : input.score >= 7 ? "passive" : "detractor";

      const result = await db.insert(npsResponses).values({
        surveyId: input.surveyId,
        employeeId: input.employeeId,
        processId: input.processId,
        score: input.score,
        category,
        followUpComment: input.followUpComment,
        responseTimeSeconds: input.responseTimeSeconds,
        deviceType: input.deviceType,
      });

      return { success: true, responseId: Number(result[0].insertId), category };
    }),

  getResults: protectedProcedure
    .input(z.object({ surveyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const responses = await db.select()
        .from(npsResponses)
        .where(eq(npsResponses.surveyId, input.surveyId));

      const totalResponses = responses.length;
      const promoters = responses.filter(r => r.category === "promoter").length;
      const passives = responses.filter(r => r.category === "passive").length;
      const detractors = responses.filter(r => r.category === "detractor").length;

      const promoterPercent = totalResponses > 0 ? Math.round((promoters / totalResponses) * 100) : 0;
      const passivePercent = totalResponses > 0 ? Math.round((passives / totalResponses) * 100) : 0;
      const detractorPercent = totalResponses > 0 ? Math.round((detractors / totalResponses) * 100) : 0;

      const npsScore = promoterPercent - detractorPercent;

      const scoreDistribution: Record<number, number> = {};
      for (let i = 0; i <= 10; i++) {
        scoreDistribution[i] = responses.filter(r => r.score === i).length;
      }

      const avgScore = totalResponses > 0 
        ? Math.round((responses.reduce((acc, r) => acc + r.score, 0) / totalResponses) * 10) / 10
        : 0;

      const avgResponseTimeSeconds = totalResponses > 0
        ? Math.round(responses.filter(r => r.responseTimeSeconds).reduce((acc, r) => acc + (r.responseTimeSeconds || 0), 0) / totalResponses)
        : 0;

      return {
        totalResponses,
        promoters,
        passives,
        detractors,
        promoterPercent,
        passivePercent,
        detractorPercent,
        npsScore,
        scoreDistribution,
        avgScore,
        avgResponseTimeSeconds,
      };
    }),

  getAnalytics: protectedProcedure
    .input(z.object({ surveyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const responses = await db.select()
        .from(npsResponses)
        .where(eq(npsResponses.surveyId, input.surveyId))
        .orderBy(desc(npsResponses.createdAt));

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentResponses = responses.filter(r => new Date(r.createdAt) >= thirtyDaysAgo);
      const olderResponses = responses.filter(r => new Date(r.createdAt) < thirtyDaysAgo);

      const calculateNps = (resps: typeof responses) => {
        if (resps.length === 0) return 0;
        const promoters = resps.filter(r => r.category === "promoter").length;
        const detractors = resps.filter(r => r.category === "detractor").length;
        return Math.round(((promoters - detractors) / resps.length) * 100);
      };

      const currentNps = calculateNps(recentResponses);
      const previousNps = calculateNps(olderResponses);
      const change = currentNps - previousNps;

      const promoterComments = responses
        .filter(r => r.category === "promoter" && r.followUpComment)
        .map(r => ({ comment: r.followUpComment!, score: r.score, date: r.createdAt }));

      const passiveComments = responses
        .filter(r => r.category === "passive" && r.followUpComment)
        .map(r => ({ comment: r.followUpComment!, score: r.score, date: r.createdAt }));

      const detractorComments = responses
        .filter(r => r.category === "detractor" && r.followUpComment)
        .map(r => ({ comment: r.followUpComment!, score: r.score, date: r.createdAt }));

      return {
        trend: {
          current: currentNps,
          previous: previousNps,
          change,
          direction: change > 0 ? "up" : change < 0 ? "down" : "stable",
        },
        promoterComments: promoterComments.slice(0, 10),
        passiveComments: passiveComments.slice(0, 10),
        detractorComments: detractorComments.slice(0, 10),
      };
    }),
});
