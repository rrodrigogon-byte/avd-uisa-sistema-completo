import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
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

      // Extrair ano da data de início
      const year = new Date(input.startDate).getFullYear();

      // Helper para converter string vazia/undefined em null
      const parseDate = (dateStr: string | undefined): Date | null => {
        if (!dateStr || dateStr.trim() === '') return null;
        return new Date(dateStr);
      };

      // Converter undefined/empty para null ANTES de inserir
      const selfEvaluationDeadline = parseDate(input.selfEvaluationDeadline);
      const managerEvaluationDeadline = parseDate(input.managerEvaluationDeadline);
      const consensusDeadline = parseDate(input.consensusDeadline);
      const description = input.description && input.description.trim() !== '' ? input.description : null;

      const result = await db.insert(evaluationCycles).values({
        name: input.name,
        year: year,
        type: "anual",
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        selfEvaluationDeadline,
        managerEvaluationDeadline,
        consensusDeadline,
        description,
        status: "planejado",
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
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        selfEvaluationDeadline: z.string().nullable().optional(),
        managerEvaluationDeadline: z.string().nullable().optional(),
        consensusDeadline: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Helper para converter string vazia em null
      const parseDate = (dateStr: string | null | undefined): Date | null => {
        if (!dateStr || dateStr.trim() === '') return null;
        return new Date(dateStr);
      };

      const updateData: any = {};
      if (input.name) updateData.name = input.name;
      if (input.startDate) updateData.startDate = new Date(input.startDate);
      if (input.endDate) updateData.endDate = new Date(input.endDate);
      if (input.selfEvaluationDeadline !== undefined) updateData.selfEvaluationDeadline = parseDate(input.selfEvaluationDeadline);
      if (input.managerEvaluationDeadline !== undefined) updateData.managerEvaluationDeadline = parseDate(input.managerEvaluationDeadline);
      if (input.consensusDeadline !== undefined) updateData.consensusDeadline = parseDate(input.consensusDeadline);
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
  /**
   * Ativar/desativar ciclo
   */
  toggleActive: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        active: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(evaluationCycles)
        .set({ active: input.active })
        .where(eq(evaluationCycles.id, input.id));

      return { success: true };
    }),

  /**
   * Excluir ciclo
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.delete(evaluationCycles).where(eq(evaluationCycles.id, input.id));

      return { success: true };
    }),

  /**
   * Buscar ciclos ativos com estatísticas de progresso
   */
  getActiveCycles: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    // Buscar ciclos ativos (status em_andamento ou ativo)
    const cycles = await db
      .select()
      .from(evaluationCycles)
      .where(sql`${evaluationCycles.status} IN ('em_andamento', 'ativo')`)
      .orderBy(evaluationCycles.startDate);

    // Para cada ciclo, calcular estatísticas
    const cyclesWithStats = cycles.map(cycle => {
      // TODO: Calcular estatísticas reais de avaliações
      // Por enquanto, retornar valores simulados
      const totalParticipants = 100;
      const completedCount = Math.floor(Math.random() * totalParticipants);
      const pendingCount = totalParticipants - completedCount;
      const progress = Math.round((completedCount / totalParticipants) * 100);

      return {
        ...cycle,
        type: "performance" as const,
        totalParticipants,
        completedCount,
        pendingCount,
        progress,
      };
    });

    return cyclesWithStats;
  }),

  /**
   * Buscar estatísticas gerais de ciclos
   */
  getCycleStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    // Buscar ciclos ativos
    const activeCycles = await db
      .select()
      .from(evaluationCycles)
      .where(sql`${evaluationCycles.status} IN ('em_andamento', 'ativo')`);

    // TODO: Calcular estatísticas reais
    const totalActive = activeCycles.length;
    const totalParticipants = totalActive * 100; // Simulação
    const totalCompleted = Math.floor(totalParticipants * 0.6);
    const totalPending = totalParticipants - totalCompleted;
    const completionRate = totalParticipants > 0 ? Math.round((totalCompleted / totalParticipants) * 100) : 0;

    return {
      totalActive,
      totalParticipants,
      totalCompleted,
      totalPending,
      completionRate,
    };
  }),

  /**
   * Enviar lembretes para participantes de um ciclo
   */
  sendReminders: protectedProcedure
    .input(z.object({ cycleId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar ciclo
      const cycle = await db
        .select()
        .from(evaluationCycles)
        .where(eq(evaluationCycles.id, input.cycleId))
        .limit(1);

      if (cycle.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ciclo não encontrado" });
      }

      // TODO: Implementar lógica real de envio de lembretes
      // Por enquanto, retornar sucesso simulado
      const count = Math.floor(Math.random() * 50) + 10;

      return { success: true, count };
    }),

  /**
   * Exportar relatório de ciclo
   */
  exportCycleReport: protectedProcedure
    .input(z.object({ cycleId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar ciclo
      const cycle = await db
        .select()
        .from(evaluationCycles)
        .where(eq(evaluationCycles.id, input.cycleId))
        .limit(1);

      if (cycle.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ciclo não encontrado" });
      }

      // TODO: Implementar lógica real de exportação
      // Por enquanto, retornar sucesso simulado
      return { success: true, reportUrl: "/reports/cycle-" + input.cycleId + ".pdf" };
    }),
});
