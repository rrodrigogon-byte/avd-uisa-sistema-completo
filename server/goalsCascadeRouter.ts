import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { goals } from "../drizzle/schema";
import { eq, isNull, sql } from "drizzle-orm";

/**
 * Router de Metas em Cascata Hierárquico
 * Gerencia metas organizacionais → departamentais → individuais
 */

export const goalsCascadeRouter = router({
  /**
   * Buscar árvore completa de metas em cascata
   */
  getTree: protectedProcedure
    .input(z.object({
      cycleId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar todas as metas do ciclo
      const allGoals = await db
        .select()
        .from(goals)
        .where(eq(goals.cycleId, input.cycleId));

      // Construir árvore hierárquica
      const buildTree = (parentId: number | null): any[] => {
        return allGoals
          .filter(g => (parentId === null ? g.parentGoalId === null : g.parentGoalId === parentId))
          .map(goal => ({
            ...goal,
            children: buildTree(goal.id),
          }));
      };

      return buildTree(null);
    }),

  /**
   * Buscar metas raiz (organizacionais sem pai)
   */
  getRootGoals: protectedProcedure
    .input(z.object({
      cycleId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      return await db
        .select()
        .from(goals)
        .where(sql`${goals.cycleId} = ${input.cycleId} AND ${goals.parentGoalId} IS NULL`);
    }),

  /**
   * Buscar metas filhas de uma meta pai
   */
  getChildGoals: protectedProcedure
    .input(z.object({
      parentGoalId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      return await db
        .select()
        .from(goals)
        .where(eq(goals.parentGoalId, input.parentGoalId));
    }),

  /**
   * Criar meta em cascata (vinculada a uma meta pai)
   */
  createCascadeGoal: protectedProcedure
    .input(z.object({
      parentGoalId: z.number().optional(),
      cycleId: z.number(),
      employeeId: z.number().optional(),
      departmentId: z.number().optional(),
      title: z.string(),
      description: z.string().optional(),
      type: z.enum(["individual", "equipe", "organizacional"]),
      category: z.enum(["quantitativa", "qualitativa"]),
      targetValueCents: z.number().optional(), // Valor em centavos
      unit: z.string().optional(),
      weight: z.number().default(1),
      startDate: z.date(),
      endDate: z.date(),
      alignmentPercentage: z.number().default(100),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [newGoal] = await db.insert(goals).values({
        cycleId: input.cycleId,
        employeeId: input.employeeId || ctx.user.id,
        title: input.title,
        description: input.description,
        type: input.type,
        category: input.category,
        targetValueCents: input.targetValueCents,
        currentValueCents: 0,
        unit: input.unit,
        weight: input.weight,
        startDate: input.startDate,
        endDate: input.endDate,
        status: "rascunho",
        progress: 0,
        linkedToPLR: false,
        linkedToBonus: false,
        parentGoalId: input.parentGoalId,
        departmentId: input.departmentId,
        alignmentPercentage: input.alignmentPercentage,
        createdBy: ctx.user.id,
      });

      return newGoal;
    }),

  /**
   * Atualizar % de alinhamento de uma meta
   */
  updateAlignment: protectedProcedure
    .input(z.object({
      goalId: z.number(),
      alignmentPercentage: z.number().min(0).max(100),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(goals)
        .set({ alignmentPercentage: input.alignmentPercentage })
        .where(eq(goals.id, input.goalId));

      return { success: true };
    }),

  /**
   * Calcular estatísticas da cascata
   */
  getStats: protectedProcedure
    .input(z.object({
      cycleId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const allGoals = await db
        .select()
        .from(goals)
        .where(eq(goals.cycleId, input.cycleId));

      const organizacional = allGoals.filter(g => g.type === "organizacional");
      const departamental = allGoals.filter(g => g.type === "equipe");
      const individual = allGoals.filter(g => g.type === "individual");

      const avgAlignmentOrg = organizacional.length > 0
        ? organizacional.reduce((sum, g) => sum + (g.alignmentPercentage || 0), 0) / organizacional.length
        : 0;

      const avgAlignmentDept = departamental.length > 0
        ? departamental.reduce((sum, g) => sum + (g.alignmentPercentage || 0), 0) / departamental.length
        : 0;

      const avgAlignmentInd = individual.length > 0
        ? individual.reduce((sum, g) => sum + (g.alignmentPercentage || 0), 0) / individual.length
        : 0;

      return {
        total: allGoals.length,
        organizacional: organizacional.length,
        departamental: departamental.length,
        individual: individual.length,
        avgAlignmentOrganizacional: Math.round(avgAlignmentOrg),
        avgAlignmentDepartamental: Math.round(avgAlignmentDept),
        avgAlignmentIndividual: Math.round(avgAlignmentInd),
        avgAlignmentGeral: Math.round((avgAlignmentOrg + avgAlignmentDept + avgAlignmentInd) / 3),
      };
    }),
});
