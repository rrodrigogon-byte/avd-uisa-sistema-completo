import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { evaluationCycles } from "../drizzle/schema";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";

/**
 * Router de Gestão de Ciclos de Avaliação
 * CRUD completo para gerenciar ciclos anuais/semestrais/trimestrais
 */
export const cyclesRouter = router({
  /**
   * Listar todos os ciclos
   */
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const cycles = await db.select().from(evaluationCycles).orderBy(evaluationCycles.year);
    return cycles;
  }),

  /**
   * Buscar ciclo por ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const cycle = await db
        .select()
        .from(evaluationCycles)
        .where(eq(evaluationCycles.id, input.id))
        .limit(1);

      return cycle.length > 0 ? cycle[0] : null;
    }),

  /**
   * Criar novo ciclo
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        year: z.number(),
        type: z.enum(["anual", "semestral", "trimestral"]),
        startDate: z.string(), // ISO date string
        endDate: z.string(),
        selfEvaluationDeadline: z.string().optional(),
        managerEvaluationDeadline: z.string().optional(),
        consensusDeadline: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const result = await db.insert(evaluationCycles).values({
        name: input.name,
        year: input.year,
        type: input.type,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        selfEvaluationDeadline: input.selfEvaluationDeadline ? new Date(input.selfEvaluationDeadline) : null,
        managerEvaluationDeadline: input.managerEvaluationDeadline ? new Date(input.managerEvaluationDeadline) : null,
        consensusDeadline: input.consensusDeadline ? new Date(input.consensusDeadline) : null,
        description: input.description || null,
        status: "planejamento",
      });

      return { id: 0, success: true }; // ID será gerado pelo auto-increment
    }),

  /**
   * Atualizar ciclo existente
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        year: z.number().optional(),
        type: z.enum(["anual", "semestral", "trimestral"]).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        selfEvaluationDeadline: z.string().optional(),
        managerEvaluationDeadline: z.string().optional(),
        consensusDeadline: z.string().optional(),
        status: z.enum(["planejamento", "em_andamento", "concluido", "cancelado"]).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updateData: any = {};
      if (input.name) updateData.name = input.name;
      if (input.year) updateData.year = input.year;
      if (input.type) updateData.type = input.type;
      if (input.startDate) updateData.startDate = new Date(input.startDate);
      if (input.endDate) updateData.endDate = new Date(input.endDate);
      if (input.selfEvaluationDeadline) updateData.selfEvaluationDeadline = new Date(input.selfEvaluationDeadline);
      if (input.managerEvaluationDeadline) updateData.managerEvaluationDeadline = new Date(input.managerEvaluationDeadline);
      if (input.consensusDeadline) updateData.consensusDeadline = new Date(input.consensusDeadline);
      if (input.status) updateData.status = input.status;
      if (input.description !== undefined) updateData.description = input.description;

      await db
        .update(evaluationCycles)
        .set(updateData)
        .where(eq(evaluationCycles.id, input.id));

      return { success: true };
    }),

  /**
   * Ativar ciclo (mudar status para em_andamento)
   */
  activate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(evaluationCycles)
        .set({ status: "em_andamento" })
        .where(eq(evaluationCycles.id, input.id));

      return { success: true };
    }),

  /**
   * Desativar ciclo (mudar status para cancelado)
   */
  deactivate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(evaluationCycles)
        .set({ status: "cancelado" })
        .where(eq(evaluationCycles.id, input.id));

      return { success: true };
    }),

  /**
   * Concluir ciclo
   */
  complete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(evaluationCycles)
        .set({ status: "concluido" })
        .where(eq(evaluationCycles.id, input.id));

      return { success: true };
    }),

  /**
   * Deletar ciclo
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.delete(evaluationCycles).where(eq(evaluationCycles.id, input.id));

      return { success: true };
    }),
});
