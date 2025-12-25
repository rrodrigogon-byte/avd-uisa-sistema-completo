import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { objectives, keyResults, okrCheckIns } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Router simplificado para OKRs
 * Gerencia objetivos e resultados-chave
 */
export const okrsRouter = router({
  
  // Criar objetivo
  createObjective: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      level: z.enum(["company", "department", "team", "individual"]),
      departmentId: z.number().optional(),
      employeeId: z.number().optional(),
      startDate: z.string(),
      endDate: z.string(),
      quarter: z.number().optional(),
      year: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [objective] = await db.insert(objectives).values({
        ...input,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        createdBy: ctx.user.id,
      });

      return { success: true, objectiveId: objective.insertId };
    }),

  // Listar objetivos
  listObjectives: protectedProcedure
    .input(z.object({
      level: z.enum(["company", "department", "team", "individual"]).optional(),
      employeeId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db.select().from(objectives);
      
      if (input?.level) {
        query = query.where(eq(objectives.level, input.level)) as any;
      }

      const results = await query.orderBy(desc(objectives.createdAt));
      return results;
    }),

  // Adicionar resultado-chave
  addKeyResult: protectedProcedure
    .input(z.object({
      objectiveId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      metricType: z.enum(["number", "percentage", "currency", "boolean"]),
      startValue: z.number().default(0),
      targetValue: z.number(),
      unit: z.string().optional(),
      weight: z.number().default(100),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.insert(keyResults).values(input);
      return { success: true };
    }),

  // Listar resultados-chave
  listKeyResults: protectedProcedure
    .input(z.object({ objectiveId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return await db
        .select()
        .from(keyResults)
        .where(eq(keyResults.objectiveId, input.objectiveId));
    }),

  // Atualizar progresso
  updateProgress: protectedProcedure
    .input(z.object({
      keyResultId: z.number(),
      currentValue: z.number(),
      comment: z.string().optional(),
      status: z.enum(["on_track", "at_risk", "behind"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Buscar KR atual
      const [kr] = await db
        .select()
        .from(keyResults)
        .where(eq(keyResults.id, input.keyResultId))
        .limit(1);

      if (!kr) throw new TRPCError({ code: "NOT_FOUND" });

      // Calcular progresso
      const progress = Math.round(((input.currentValue - kr.startValue) / (kr.targetValue - kr.startValue)) * 100);

      // Atualizar KR
      await db
        .update(keyResults)
        .set({
          currentValue: input.currentValue,
          progress: Math.max(0, Math.min(100, progress)),
          status: progress >= 100 ? "completed" : input.status,
        })
        .where(eq(keyResults.id, input.keyResultId));

      // Registrar check-in
      await db.insert(okrCheckIns).values({
        keyResultId: input.keyResultId,
        previousValue: kr.currentValue,
        currentValue: input.currentValue,
        progress,
        status: input.status,
        comment: input.comment,
        checkInDate: new Date(),
        createdBy: ctx.user.id,
      });

      return { success: true, progress };
    }),

  // Obter detalhes de objetivo
  getObjective: protectedProcedure
    .input(z.object({ objectiveId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [objective] = await db
        .select()
        .from(objectives)
        .where(eq(objectives.id, input.objectiveId))
        .limit(1);

      if (!objective) throw new TRPCError({ code: "NOT_FOUND" });

      const krs = await db
        .select()
        .from(keyResults)
        .where(eq(keyResults.objectiveId, input.objectiveId));

      return { ...objective, keyResults: krs };
    }),

  // Editar objetivo
  updateObjective: protectedProcedure
    .input(z.object({
      objectiveId: z.number(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      status: z.enum(["draft", "active", "completed", "cancelled"]).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { objectiveId, ...updateData } = input;
      const updates: any = { ...updateData };
      
      if (input.startDate) updates.startDate = new Date(input.startDate);
      if (input.endDate) updates.endDate = new Date(input.endDate);

      await db
        .update(objectives)
        .set(updates)
        .where(eq(objectives.id, objectiveId));

      return { success: true };
    }),

  // Editar key result
  updateKeyResult: protectedProcedure
    .input(z.object({
      keyResultId: z.number(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      targetValue: z.number().optional(),
      status: z.enum(["not_started", "on_track", "at_risk", "behind", "completed"]).optional(),
      weight: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { keyResultId, ...updateData } = input;
      await db
        .update(keyResults)
        .set(updateData)
        .where(eq(keyResults.id, keyResultId));

      return { success: true };
    }),

  // Listar check-ins de um objetivo ou key result
  listCheckIns: protectedProcedure
    .input(z.object({
      objectiveId: z.number().optional(),
      keyResultId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db.select().from(okrCheckIns);
      
      if (input.keyResultId) {
        query = query.where(eq(okrCheckIns.keyResultId, input.keyResultId)) as any;
      } else if (input.objectiveId) {
        query = query.where(eq(okrCheckIns.objectiveId, input.objectiveId)) as any;
      }

      return await query.orderBy(desc(okrCheckIns.createdAt));
    }),

  // Criar check-in manual
  createCheckIn: protectedProcedure
    .input(z.object({
      objectiveId: z.number().optional(),
      keyResultId: z.number().optional(),
      progress: z.number().min(0).max(100),
      status: z.enum(["on_track", "at_risk", "behind"]),
      confidence: z.enum(["low", "medium", "high"]),
      achievements: z.string().optional(),
      blockers: z.string().optional(),
      nextSteps: z.string().optional(),
      needsHelp: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Buscar progresso anterior
      let previousProgress = 0;
      if (input.keyResultId) {
        const [kr] = await db
          .select()
          .from(keyResults)
          .where(eq(keyResults.id, input.keyResultId))
          .limit(1);
        if (kr) previousProgress = kr.progress || 0;
      } else if (input.objectiveId) {
        const [obj] = await db
          .select()
          .from(objectives)
          .where(eq(objectives.id, input.objectiveId))
          .limit(1);
        if (obj) previousProgress = obj.progress || 0;
      }

      await db.insert(okrCheckIns).values({
        ...input,
        previousProgress,
        createdBy: ctx.user.id,
      });

      // Atualizar progresso na entidade
      if (input.keyResultId) {
        await db
          .update(keyResults)
          .set({ progress: input.progress, status: input.status === "on_track" ? "on_track" : "at_risk" })
          .where(eq(keyResults.id, input.keyResultId));
      } else if (input.objectiveId) {
        await db
          .update(objectives)
          .set({ progress: input.progress })
          .where(eq(objectives.id, input.objectiveId));
      }

      return { success: true };
    }),

  // Dashboard de análise de OKRs
  getOKRsDashboard: protectedProcedure
    .input(z.object({
      year: z.number().optional(),
      quarter: z.number().optional(),
      departmentId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return {
        totalObjectives: 0,
        onTrack: 0,
        atRisk: 0,
        behind: 0,
        completed: 0,
        averageProgress: 0,
        objectivesByStatus: [],
        progressOverTime: [],
      };

      // Buscar objetivos com filtros
      let query = db.select().from(objectives);
      
      if (input?.year) {
        query = query.where(eq(objectives.year, input.year)) as any;
      }
      if (input?.quarter) {
        query = query.where(eq(objectives.quarter, input.quarter)) as any;
      }
      if (input?.departmentId) {
        query = query.where(eq(objectives.departmentId, input.departmentId)) as any;
      }

      const allObjectives = await query;

      // Calcular estatísticas
      const stats = {
        totalObjectives: allObjectives.length,
        onTrack: 0,
        atRisk: 0,
        behind: 0,
        completed: allObjectives.filter(o => o.status === "completed").length,
        averageProgress: 0,
        objectivesByStatus: [] as any[],
        progressOverTime: [] as any[],
      };

      // Contar por status dos key results
      for (const obj of allObjectives) {
        const krs = await db
          .select()
          .from(keyResults)
          .where(eq(keyResults.objectiveId, obj.id));
        
        const onTrackKRs = krs.filter(kr => kr.status === "on_track" || kr.status === "completed").length;
        const atRiskKRs = krs.filter(kr => kr.status === "at_risk").length;
        const behindKRs = krs.filter(kr => kr.status === "behind").length;

        if (behindKRs > 0) stats.behind++;
        else if (atRiskKRs > 0) stats.atRisk++;
        else if (onTrackKRs > 0) stats.onTrack++;
      }

      // Calcular progresso médio
      const totalProgress = allObjectives.reduce((sum, obj) => sum + (obj.progress || 0), 0);
      stats.averageProgress = allObjectives.length > 0 ? Math.round(totalProgress / allObjectives.length) : 0;

      // Agrupar por status
      stats.objectivesByStatus = [
        { status: "on_track", count: stats.onTrack },
        { status: "at_risk", count: stats.atRisk },
        { status: "behind", count: stats.behind },
        { status: "completed", count: stats.completed },
      ];

      return stats;
    }),
});
