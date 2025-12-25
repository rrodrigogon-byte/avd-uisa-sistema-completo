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
});
