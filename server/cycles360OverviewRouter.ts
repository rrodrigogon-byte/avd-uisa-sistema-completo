import { z } from "zod";
import { eq, and, gte, lte, desc, sql, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  evaluationCycles,
  evaluation360CycleWeights,
  evaluation360CycleCompetencies,
  evaluation360CycleParticipants,
  evaluation360CycleConfig,
  employees,
  departments,
} from "../drizzle/schema";

/**
 * Router para Visão Geral de Ciclos 360°
 * Fornece listagem, filtros e estatísticas de ciclos ativos
 */

export const cycles360OverviewRouter = router({
  /**
   * Listar todos os ciclos 360° com filtros
   */
  listCycles: protectedProcedure
    .input(
      z.object({
        status: z.enum(["planejado", "ativo", "concluido", "cancelado"]).optional(),
        year: z.number().optional(),
        departmentId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        type: z.enum(["anual", "semestral", "trimestral"]).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Construir query com filtros
      let query = db
        .select({
          id: evaluationCycles.id,
          name: evaluationCycles.name,
          year: evaluationCycles.year,
          type: evaluationCycles.type,
          startDate: evaluationCycles.startDate,
          endDate: evaluationCycles.endDate,
          status: evaluationCycles.status,
          active: evaluationCycles.active,
          description: evaluationCycles.description,
          createdAt: evaluationCycles.createdAt,
        })
        .from(evaluationCycles);

      // Aplicar filtros
      const conditions = [];
      
      if (input.status) {
        conditions.push(eq(evaluationCycles.status, input.status));
      }
      
      if (input.year) {
        conditions.push(eq(evaluationCycles.year, input.year));
      }
      
      if (input.type) {
        conditions.push(eq(evaluationCycles.type, input.type));
      }
      
      if (input.startDate) {
        conditions.push(gte(evaluationCycles.startDate, input.startDate));
      }
      
      if (input.endDate) {
        conditions.push(lte(evaluationCycles.endDate, input.endDate));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const cycles = await query.orderBy(desc(evaluationCycles.createdAt));

      // Para cada ciclo, buscar estatísticas
      const cyclesWithStats = await Promise.all(
        cycles.map(async (cycle) => {
          // Buscar configuração
          const [config] = await db
            .select()
            .from(evaluation360CycleConfig)
            .where(eq(evaluation360CycleConfig.cycleId, cycle.id))
            .limit(1);

          // Buscar participantes
          const participants = await db
            .select()
            .from(evaluation360CycleParticipants)
            .where(eq(evaluation360CycleParticipants.cycleId, cycle.id));

          // Calcular estatísticas
          const totalParticipants = participants.length;
          const completedParticipants = participants.filter(
            (p) => p.status === "completed"
          ).length;
          const pendingParticipants = participants.filter(
            (p) => p.status === "pending"
          ).length;
          const inProgressParticipants = participants.filter(
            (p) => p.status === "in_progress"
          ).length;

          const completionRate = totalParticipants > 0 
            ? Math.round((completedParticipants / totalParticipants) * 100) 
            : 0;

          return {
            ...cycle,
            config: config || null,
            stats: {
              totalParticipants,
              completedParticipants,
              pendingParticipants,
              inProgressParticipants,
              completionRate,
            },
          };
        })
      );

      return cyclesWithStats;
    }),

  /**
   * Obter detalhes completos de um ciclo específico
   */
  getCycleDetails: protectedProcedure
    .input(z.object({ cycleId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar ciclo
      const [cycle] = await db
        .select()
        .from(evaluationCycles)
        .where(eq(evaluationCycles.id, input.cycleId))
        .limit(1);

      if (!cycle) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ciclo não encontrado" });
      }

      // Buscar configuração
      const [config] = await db
        .select()
        .from(evaluation360CycleConfig)
        .where(eq(evaluation360CycleConfig.cycleId, input.cycleId))
        .limit(1);

      // Buscar pesos
      const [weights] = await db
        .select()
        .from(evaluation360CycleWeights)
        .where(eq(evaluation360CycleWeights.cycleId, input.cycleId))
        .limit(1);

      // Buscar competências
      const competenciesData = await db
        .select()
        .from(evaluation360CycleCompetencies)
        .where(eq(evaluation360CycleCompetencies.cycleId, input.cycleId));

      // Buscar participantes com informações dos colaboradores
      const participantsData = await db
        .select({
          participant: evaluation360CycleParticipants,
          employee: employees,
        })
        .from(evaluation360CycleParticipants)
        .leftJoin(employees, eq(evaluation360CycleParticipants.employeeId, employees.id))
        .where(eq(evaluation360CycleParticipants.cycleId, input.cycleId));

      return {
        cycle,
        config: config || null,
        weights: weights || null,
        competencies: competenciesData,
        participants: participantsData.map((p) => ({
          ...p.participant,
          employeeData: p.employee,
        })),
      };
    }),

  /**
   * Obter estatísticas gerais de todos os ciclos
   */
  getOverallStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Total de ciclos
    const allCycles = await db.select().from(evaluationCycles);
    const totalCycles = allCycles.length;

    // Ciclos por status
    const activeCycles = allCycles.filter((c) => c.status === "ativo").length;
    const plannedCycles = allCycles.filter((c) => c.status === "planejado").length;
    const completedCycles = allCycles.filter((c) => c.status === "concluido").length;
    const canceledCycles = allCycles.filter((c) => c.status === "cancelado").length;

    // Total de participantes em todos os ciclos
    const allParticipants = await db.select().from(evaluation360CycleParticipants);
    const totalParticipants = allParticipants.length;
    const completedEvaluations = allParticipants.filter((p) => p.status === "completed").length;
    const pendingEvaluations = allParticipants.filter((p) => p.status === "pending").length;

    // Taxa de conclusão geral
    const overallCompletionRate = totalParticipants > 0 
      ? Math.round((completedEvaluations / totalParticipants) * 100) 
      : 0;

    return {
      totalCycles,
      activeCycles,
      plannedCycles,
      completedCycles,
      canceledCycles,
      totalParticipants,
      completedEvaluations,
      pendingEvaluations,
      overallCompletionRate,
    };
  }),

  /**
   * Obter evolução histórica de competências por ciclo
   */
  getCompetencyEvolution: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        competencyId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar todos os ciclos do colaborador
      const participations = await db
        .select({
          cycle: evaluationCycles,
          participant: evaluation360CycleParticipants,
        })
        .from(evaluation360CycleParticipants)
        .leftJoin(evaluationCycles, eq(evaluation360CycleParticipants.cycleId, evaluationCycles.id))
        .where(eq(evaluation360CycleParticipants.employeeId, input.employeeId))
        .orderBy(evaluationCycles.startDate);

      // Filtrar por data se fornecido
      let filteredParticipations = participations;
      if (input.startDate) {
        filteredParticipations = filteredParticipations.filter(
          (p) => p.cycle && new Date(p.cycle.startDate) >= input.startDate!
        );
      }
      if (input.endDate) {
        filteredParticipations = filteredParticipations.filter(
          (p) => p.cycle && new Date(p.cycle.endDate) <= input.endDate!
        );
      }

      // Para cada ciclo, buscar as avaliações de competências
      const evolution = await Promise.all(
        filteredParticipations.map(async (participation) => {
          if (!participation.cycle) return null;

          const cycleCompetencies = await db
            .select()
            .from(evaluation360CycleCompetencies)
            .where(eq(evaluation360CycleCompetencies.cycleId, participation.cycle.id));

          // Filtrar por competência específica se fornecido
          const relevantCompetencies = input.competencyId
            ? cycleCompetencies.filter((c) => c.competencyId === input.competencyId)
            : cycleCompetencies;

          return {
            cycle: participation.cycle,
            competencies: relevantCompetencies,
            participantStatus: participation.participant.status,
          };
        })
      );

      return evolution.filter((e) => e !== null);
    }),

  /**
   * Comparar múltiplos ciclos
   */
  compareCycles: protectedProcedure
    .input(
      z.object({
        cycleIds: z.array(z.number()).min(2).max(5),
        employeeId: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar informações de cada ciclo
      const cyclesData = await Promise.all(
        input.cycleIds.map(async (cycleId) => {
          const [cycle] = await db
            .select()
            .from(evaluationCycles)
            .where(eq(evaluationCycles.id, cycleId))
            .limit(1);

          if (!cycle) return null;

          // Buscar participantes
          let participantsQuery = db
            .select()
            .from(evaluation360CycleParticipants)
            .where(eq(evaluation360CycleParticipants.cycleId, cycleId));

          // Filtrar por colaborador se fornecido
          if (input.employeeId) {
            participantsQuery = participantsQuery.where(
              eq(evaluation360CycleParticipants.employeeId, input.employeeId)
            ) as any;
          }

          const participants = await participantsQuery;

          // Buscar competências
          const competencies = await db
            .select()
            .from(evaluation360CycleCompetencies)
            .where(eq(evaluation360CycleCompetencies.cycleId, cycleId));

          // Calcular estatísticas
          const totalParticipants = participants.length;
          const completedParticipants = participants.filter((p) => p.status === "completed").length;
          const completionRate = totalParticipants > 0 
            ? Math.round((completedParticipants / totalParticipants) * 100) 
            : 0;

          return {
            cycle,
            stats: {
              totalParticipants,
              completedParticipants,
              completionRate,
              totalCompetencies: competencies.length,
            },
            participants,
            competencies,
          };
        })
      );

      return cyclesData.filter((c) => c !== null);
    }),
});
