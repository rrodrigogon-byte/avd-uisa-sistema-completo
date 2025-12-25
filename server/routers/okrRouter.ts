import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  objectives,
  keyResults,
  okrCheckIns,
  okrAlignments,
  okrHistory,
  okrTemplates,
  employees,
  departments,
} from "../../drizzle/schema";
import { eq, and, desc, sql, inArray, or, gte, lte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Router para OKRs (Objectives and Key Results)
 * Gerencia objetivos, resultados-chave, check-ins e alinhamentos
 */
export const okrRouter = router({
  /**
   * Listar objetivos
   */
  listObjectives: protectedProcedure
    .input(
      z
        .object({
          level: z.enum(["company", "department", "team", "individual"]).optional(),
          status: z.enum(["draft", "active", "completed", "cancelled"]).optional(),
          employeeId: z.number().optional(),
          departmentId: z.number().optional(),
          year: z.number().optional(),
          quarter: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [];
      
      if (input?.level) conditions.push(eq(objectives.level, input.level));
      if (input?.status) conditions.push(eq(objectives.status, input.status));
      if (input?.employeeId) conditions.push(eq(objectives.employeeId, input.employeeId));
      if (input?.departmentId) conditions.push(eq(objectives.departmentId, input.departmentId));
      if (input?.year) conditions.push(eq(objectives.year, input.year));
      if (input?.quarter) conditions.push(eq(objectives.quarter, input.quarter));

      const objectivesList = await db
        .select()
        .from(objectives)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(objectives.createdAt));

      return objectivesList || [];
    }),

  /**
   * Obter detalhes de um objetivo
   */
  getObjectiveById: protectedProcedure
    .input(z.object({ objectiveId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [objective] = await db
        .select()
        .from(objectives)
        .where(eq(objectives.id, input.objectiveId))
        .limit(1);

      if (!objective) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Objetivo não encontrado" });
      }

      // Buscar key results
      const krs = await db
        .select()
        .from(keyResults)
        .where(eq(keyResults.objectiveId, input.objectiveId));

      // Buscar check-ins recentes
      const checkIns = await db
        .select()
        .from(okrCheckIns)
        .where(eq(okrCheckIns.objectiveId, input.objectiveId))
        .orderBy(desc(okrCheckIns.checkInDate))
        .limit(5);

      // Buscar alinhamentos
      const alignments = await db
        .select()
        .from(okrAlignments)
        .where(
          or(
            eq(okrAlignments.parentObjectiveId, input.objectiveId),
            eq(okrAlignments.childObjectiveId, input.objectiveId)
          )
        );

      return {
        ...objective,
        keyResults: krs || [],
        recentCheckIns: checkIns || [],
        alignments: alignments || [],
      };
    }),

  /**
   * Criar objetivo
   */
  createObjective: protectedProcedure
    .input(
      z.object({
        parentId: z.number().optional(),
        level: z.enum(["company", "department", "team", "individual"]),
        departmentId: z.number().optional(),
        employeeId: z.number().optional(),
        title: z.string().min(3),
        description: z.string().optional(),
        startDate: z.date(),
        endDate: z.date(),
        quarter: z.number().min(1).max(4).optional(),
        year: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const result = await db.insert(objectives).values({
        ...input,
        status: "draft",
        progress: 0,
        createdBy: ctx.user.id,
      });

      // Registrar no histórico
      await db.insert(okrHistory).values({
        objectiveId: Number(result.insertId),
        changeType: "created",
        changedBy: ctx.user.id,
      });

      return { objectiveId: Number(result.insertId), success: true };
    }),

  /**
   * Atualizar objetivo
   */
  updateObjective: protectedProcedure
    .input(
      z.object({
        objectiveId: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["draft", "active", "completed", "cancelled"]).optional(),
        progress: z.number().min(0).max(100).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updateData: any = {};
      if (input.title) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.status) updateData.status = input.status;
      if (input.progress !== undefined) updateData.progress = input.progress;

      await db
        .update(objectives)
        .set(updateData)
        .where(eq(objectives.id, input.objectiveId));

      // Registrar no histórico
      await db.insert(okrHistory).values({
        objectiveId: input.objectiveId,
        changeType: "updated",
        changedBy: ctx.user.id,
      });

      return { success: true };
    }),

  /**
   * Adicionar resultado-chave
   */
  addKeyResult: protectedProcedure
    .input(
      z.object({
        objectiveId: z.number(),
        title: z.string().min(3),
        description: z.string().optional(),
        metricType: z.enum(["number", "percentage", "currency", "boolean"]),
        startValue: z.number().default(0),
        targetValue: z.number(),
        unit: z.string().optional(),
        weight: z.number().min(0).max(100).default(100),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const result = await db.insert(keyResults).values({
        ...input,
        currentValue: input.startValue,
        progress: 0,
        status: "not_started",
      });

      return { keyResultId: Number(result.insertId), success: true };
    }),

  /**
   * Atualizar progresso de resultado-chave
   */
  updateKeyResultProgress: protectedProcedure
    .input(
      z.object({
        keyResultId: z.number(),
        currentValue: z.number(),
        status: z.enum(["not_started", "on_track", "at_risk", "behind", "completed"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar key result
      const [kr] = await db
        .select()
        .from(keyResults)
        .where(eq(keyResults.id, input.keyResultId))
        .limit(1);

      if (!kr) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Key Result não encontrado" });
      }

      // Calcular progresso
      const progress = Math.min(
        100,
        Math.max(0, Math.round(((input.currentValue - kr.startValue) / (kr.targetValue - kr.startValue)) * 100))
      );

      // Determinar status automaticamente se não fornecido
      let status = input.status;
      if (!status) {
        if (progress >= 100) status = "completed";
        else if (progress >= 70) status = "on_track";
        else if (progress >= 40) status = "at_risk";
        else status = "behind";
      }

      await db
        .update(keyResults)
        .set({
          currentValue: input.currentValue,
          progress,
          status,
        })
        .where(eq(keyResults.id, input.keyResultId));

      // Atualizar progresso do objetivo pai
      await this.recalculateObjectiveProgress(db, kr.objectiveId);

      return { success: true, progress, status };
    }),

  /**
   * Criar check-in
   */
  createCheckIn: protectedProcedure
    .input(
      z.object({
        objectiveId: z.number().optional(),
        keyResultId: z.number().optional(),
        currentValue: z.number(),
        progress: z.number().min(0).max(100),
        status: z.enum(["on_track", "at_risk", "behind"]),
        confidence: z.enum(["low", "medium", "high"]).default("medium"),
        comment: z.string().optional(),
        blockers: z.string().optional(),
        nextSteps: z.string().optional(),
        checkInDate: z.date(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar valor anterior
      let previousValue = 0;
      if (input.keyResultId) {
        const [kr] = await db
          .select()
          .from(keyResults)
          .where(eq(keyResults.id, input.keyResultId))
          .limit(1);
        previousValue = kr?.currentValue || 0;
      }

      const result = await db.insert(okrCheckIns).values({
        ...input,
        previousValue,
        createdBy: ctx.user.id,
      });

      return { checkInId: Number(result.insertId), success: true };
    }),

  /**
   * Obter cascata de OKRs
   */
  getCascade: protectedProcedure
    .input(z.object({ objectiveId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar objetivo raiz
      const [rootObjective] = await db
        .select()
        .from(objectives)
        .where(eq(objectives.id, input.objectiveId))
        .limit(1);

      if (!rootObjective) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Objetivo não encontrado" });
      }

      // Buscar objetivos filhos recursivamente
      const buildCascade = async (objectiveId: number, level: number = 0): Promise<any> => {
        const [obj] = await db
          .select()
          .from(objectives)
          .where(eq(objectives.id, objectiveId))
          .limit(1);

        if (!obj) return null;

        // Buscar alinhamentos filhos
        const childAlignments = await db
          .select()
          .from(okrAlignments)
          .where(eq(okrAlignments.parentObjectiveId, objectiveId));

        const children = await Promise.all(
          childAlignments.map((alignment) => buildCascade(alignment.childObjectiveId, level + 1))
        );

        return {
          ...obj,
          level,
          children: children.filter((c) => c !== null),
        };
      };

      const cascade = await buildCascade(input.objectiveId);

      return cascade;
    }),

  /**
   * Obter progresso consolidado
   */
  getProgress: protectedProcedure
    .input(
      z.object({
        level: z.enum(["company", "department", "team", "individual"]).optional(),
        employeeId: z.number().optional(),
        departmentId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [];
      if (input.level) conditions.push(eq(objectives.level, input.level));
      if (input.employeeId) conditions.push(eq(objectives.employeeId, input.employeeId));
      if (input.departmentId) conditions.push(eq(objectives.departmentId, input.departmentId));

      const objectivesList = await db
        .select()
        .from(objectives)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const totalObjectives = objectivesList.length;
      const completedObjectives = objectivesList.filter((o) => o.status === "completed").length;
      const averageProgress =
        totalObjectives > 0
          ? Math.round(objectivesList.reduce((sum, o) => sum + (o.progress || 0), 0) / totalObjectives)
          : 0;

      return {
        totalObjectives,
        completedObjectives,
        activeObjectives: objectivesList.filter((o) => o.status === "active").length,
        averageProgress,
        objectives: objectivesList || [],
      };
    }),

  /**
   * Obter histórico de um objetivo
   */
  getHistory: protectedProcedure
    .input(z.object({ objectiveId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const history = await db
        .select()
        .from(okrHistory)
        .where(eq(okrHistory.objectiveId, input.objectiveId))
        .orderBy(desc(okrHistory.changedAt));

      return history || [];
    }),

  /**
   * Listar templates
   */
  listTemplates: protectedProcedure
    .input(
      z
        .object({
          category: z.string().optional(),
          level: z.enum(["company", "department", "team", "individual"]).optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [eq(okrTemplates.isPublic, true)];
      if (input?.category) conditions.push(eq(okrTemplates.category, input.category));
      if (input?.level) conditions.push(eq(okrTemplates.level, input.level));

      const templates = await db
        .select()
        .from(okrTemplates)
        .where(and(...conditions))
        .orderBy(desc(okrTemplates.usageCount));

      return templates || [];
    }),

  /**
   * Função auxiliar: Recalcular progresso do objetivo baseado nos key results
   */
  async recalculateObjectiveProgress(db: any, objectiveId: number) {
    const krs = await db
      .select()
      .from(keyResults)
      .where(eq(keyResults.objectiveId, objectiveId));

    if (krs.length === 0) return;

    // Calcular progresso ponderado
    const totalWeight = krs.reduce((sum: number, kr: any) => sum + (kr.weight || 100), 0);
    const weightedProgress = krs.reduce(
      (sum: number, kr: any) => sum + ((kr.progress || 0) * (kr.weight || 100)) / totalWeight,
      0
    );

    await db
      .update(objectives)
      .set({ progress: Math.round(weightedProgress) })
      .where(eq(objectives.id, objectiveId));
  },
});
