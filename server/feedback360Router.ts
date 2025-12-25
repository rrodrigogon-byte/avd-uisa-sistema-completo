import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { 
  feedback360Cycles,
  feedback360Participants,
  feedback360Evaluators,
  feedback360Responses,
  feedback360Results,
  feedback360ActionPlans,
  employees,
  competencies
} from "../drizzle/schema";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Router para Feedback 360°
 * Gerencia ciclos de avaliação multidirecional
 */
export const feedback360Router = router({
  
  // ============================================================================
  // CICLOS DE FEEDBACK
  // ============================================================================
  
  /**
   * Criar novo ciclo de feedback 360°
   */
  createCycle: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      startDate: z.string(), // ISO date
      endDate: z.string(), // ISO date
      allowSelfAssessment: z.boolean().default(true),
      allowPeerAssessment: z.boolean().default(true),
      allowManagerAssessment: z.boolean().default(true),
      allowSubordinateAssessment: z.boolean().default(true),
      minPeerEvaluators: z.number().min(0).default(2),
      minSubordinateEvaluators: z.number().min(0).default(2),
      competencyIds: z.array(z.number()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [cycle] = await db.insert(feedback360Cycles).values({
        ...input,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        createdBy: ctx.user.id,
      });

      return { success: true, cycleId: cycle.insertId };
    }),

  /**
   * Listar todos os ciclos
   */
  listCycles: protectedProcedure
    .input(z.object({
      status: z.enum(["draft", "active", "closed"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db.select().from(feedback360Cycles);
      
      if (input?.status) {
        query = query.where(eq(feedback360Cycles.status, input.status)) as any;
      }

      const cycles = await query.orderBy(desc(feedback360Cycles.createdAt));
      return cycles;
    }),

  /**
   * Obter detalhes de um ciclo
   */
  getCycle: protectedProcedure
    .input(z.object({ cycleId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [cycle] = await db
        .select()
        .from(feedback360Cycles)
        .where(eq(feedback360Cycles.id, input.cycleId))
        .limit(1);

      if (!cycle) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cycle not found" });
      }

      // Buscar participantes
      const participants = await db
        .select({
          id: feedback360Participants.id,
          employeeId: feedback360Participants.employeeId,
          employeeName: employees.name,
          status: feedback360Participants.status,
          selfAssessmentCompletedAt: feedback360Participants.selfAssessmentCompletedAt,
          allAssessmentsCompletedAt: feedback360Participants.allAssessmentsCompletedAt,
        })
        .from(feedback360Participants)
        .leftJoin(employees, eq(feedback360Participants.employeeId, employees.id))
        .where(eq(feedback360Participants.cycleId, input.cycleId));

      return { ...cycle, participants };
    }),

  /**
   * Atualizar status do ciclo
   */
  updateCycleStatus: adminProcedure
    .input(z.object({
      cycleId: z.number(),
      status: z.enum(["draft", "active", "closed"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(feedback360Cycles)
        .set({ status: input.status })
        .where(eq(feedback360Cycles.id, input.cycleId));

      return { success: true };
    }),

  // ============================================================================
  // PARTICIPANTES
  // ============================================================================

  /**
   * Adicionar participantes ao ciclo
   */
  addParticipants: adminProcedure
    .input(z.object({
      cycleId: z.number(),
      employeeIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const values = input.employeeIds.map(employeeId => ({
        cycleId: input.cycleId,
        employeeId,
      }));

      await db.insert(feedback360Participants).values(values);

      return { success: true, count: values.length };
    }),

  /**
   * Listar participantes do ciclo
   */
  listParticipants: protectedProcedure
    .input(z.object({ cycleId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const participants = await db
        .select({
          id: feedback360Participants.id,
          employeeId: feedback360Participants.employeeId,
          employeeName: employees.name,
          employeeEmail: employees.email,
          status: feedback360Participants.status,
          selfAssessmentCompletedAt: feedback360Participants.selfAssessmentCompletedAt,
          allAssessmentsCompletedAt: feedback360Participants.allAssessmentsCompletedAt,
        })
        .from(feedback360Participants)
        .leftJoin(employees, eq(feedback360Participants.employeeId, employees.id))
        .where(eq(feedback360Participants.cycleId, input.cycleId));

      return participants;
    }),

  // ============================================================================
  // AVALIADORES
  // ============================================================================

  /**
   * Designar avaliadores para um participante
   */
  assignEvaluators: adminProcedure
    .input(z.object({
      participantId: z.number(),
      evaluators: z.array(z.object({
        evaluatorId: z.number(),
        evaluatorType: z.enum(["self", "manager", "peer", "subordinate", "other"]),
      })),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const values = input.evaluators.map(e => ({
        participantId: input.participantId,
        evaluatorId: e.evaluatorId,
        evaluatorType: e.evaluatorType,
      }));

      await db.insert(feedback360Evaluators).values(values);

      return { success: true, count: values.length };
    }),

  /**
   * Listar avaliadores de um participante
   */
  listEvaluators: protectedProcedure
    .input(z.object({ participantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const evaluators = await db
        .select({
          id: feedback360Evaluators.id,
          evaluatorId: feedback360Evaluators.evaluatorId,
          evaluatorName: employees.name,
          evaluatorType: feedback360Evaluators.evaluatorType,
          status: feedback360Evaluators.status,
          completedAt: feedback360Evaluators.completedAt,
        })
        .from(feedback360Evaluators)
        .leftJoin(employees, eq(feedback360Evaluators.evaluatorId, employees.id))
        .where(eq(feedback360Evaluators.participantId, input.participantId));

      return evaluators;
    }),

  /**
   * Obter avaliações pendentes para um avaliador
   */
  getMyPendingEvaluations: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];

      // Buscar employee vinculado ao user
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, ctx.user.id))
        .limit(1);

      if (!employee) return [];

      const pendingEvaluations = await db
        .select({
          evaluatorId: feedback360Evaluators.id,
          participantId: feedback360Participants.id,
          participantName: employees.name,
          cycleName: feedback360Cycles.name,
          evaluatorType: feedback360Evaluators.evaluatorType,
          status: feedback360Evaluators.status,
        })
        .from(feedback360Evaluators)
        .leftJoin(feedback360Participants, eq(feedback360Evaluators.participantId, feedback360Participants.id))
        .leftJoin(employees, eq(feedback360Participants.employeeId, employees.id))
        .leftJoin(feedback360Cycles, eq(feedback360Participants.cycleId, feedback360Cycles.id))
        .where(
          and(
            eq(feedback360Evaluators.evaluatorId, employee.id),
            eq(feedback360Evaluators.status, "pending")
          )
        );

      return pendingEvaluations;
    }),

  // ============================================================================
  // RESPOSTAS DE AVALIAÇÃO
  // ============================================================================

  /**
   * Submeter respostas de avaliação
   */
  submitResponses: protectedProcedure
    .input(z.object({
      evaluatorId: z.number(),
      responses: z.array(z.object({
        competencyId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
        behavioralExamples: z.string().optional(),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar se o avaliador pertence ao usuário logado
      const [evaluator] = await db
        .select()
        .from(feedback360Evaluators)
        .where(eq(feedback360Evaluators.id, input.evaluatorId))
        .limit(1);

      if (!evaluator) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Evaluator not found" });
      }

      // Buscar employee do usuário
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, ctx.user.id))
        .limit(1);

      if (!employee || employee.id !== evaluator.evaluatorId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to submit this evaluation" });
      }

      // Inserir respostas
      const values = input.responses.map(r => ({
        evaluatorId: input.evaluatorId,
        competencyId: r.competencyId,
        rating: r.rating,
        comment: r.comment,
        behavioralExamples: r.behavioralExamples,
      }));

      await db.insert(feedback360Responses).values(values);

      // Atualizar status do avaliador
      await db
        .update(feedback360Evaluators)
        .set({ 
          status: "completed",
          completedAt: new Date(),
        })
        .where(eq(feedback360Evaluators.id, input.evaluatorId));

      // Se for autoavaliação, atualizar participante
      if (evaluator.evaluatorType === "self") {
        await db
          .update(feedback360Participants)
          .set({ selfAssessmentCompletedAt: new Date() })
          .where(eq(feedback360Participants.id, evaluator.participantId));
      }

      return { success: true };
    }),

  // ============================================================================
  // RESULTADOS
  // ============================================================================

  /**
   * Calcular resultados de um participante
   */
  calculateResults: adminProcedure
    .input(z.object({ participantId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar todas as respostas do participante
      const responses = await db
        .select({
          competencyId: feedback360Responses.competencyId,
          rating: feedback360Responses.rating,
          evaluatorType: feedback360Evaluators.evaluatorType,
        })
        .from(feedback360Responses)
        .leftJoin(feedback360Evaluators, eq(feedback360Responses.evaluatorId, feedback360Evaluators.id))
        .where(eq(feedback360Evaluators.participantId, input.participantId));

      // Agrupar por competência
      const competencyMap = new Map<number, {
        self: number[];
        manager: number[];
        peer: number[];
        subordinate: number[];
      }>();

      for (const response of responses) {
        if (!competencyMap.has(response.competencyId)) {
          competencyMap.set(response.competencyId, {
            self: [],
            manager: [],
            peer: [],
            subordinate: [],
          });
        }

        const comp = competencyMap.get(response.competencyId)!;
        if (response.evaluatorType === "self") comp.self.push(response.rating);
        else if (response.evaluatorType === "manager") comp.manager.push(response.rating);
        else if (response.evaluatorType === "peer") comp.peer.push(response.rating);
        else if (response.evaluatorType === "subordinate") comp.subordinate.push(response.rating);
      }

      // Calcular médias e inserir resultados
      const results = [];
      for (const [competencyId, ratings] of competencyMap.entries()) {
        const selfRating = ratings.self.length > 0 ? Math.round(ratings.self.reduce((a, b) => a + b, 0) / ratings.self.length) : null;
        const managerRating = ratings.manager.length > 0 ? Math.round(ratings.manager.reduce((a, b) => a + b, 0) / ratings.manager.length) : null;
        const peerRating = ratings.peer.length > 0 ? Math.round(ratings.peer.reduce((a, b) => a + b, 0) / ratings.peer.length) : null;
        const subordinateRating = ratings.subordinate.length > 0 ? Math.round(ratings.subordinate.reduce((a, b) => a + b, 0) / ratings.subordinate.length) : null;

        // Calcular média geral ponderada
        const allRatings = [...ratings.manager, ...ratings.peer, ...ratings.subordinate];
        const overallRating = allRatings.length > 0 ? Math.round(allRatings.reduce((a, b) => a + b, 0) / allRatings.length) : null;

        // Calcular gaps
        const selfPeerGap = selfRating && peerRating ? selfRating - peerRating : null;
        const selfManagerGap = selfRating && managerRating ? selfRating - managerRating : null;

        results.push({
          participantId: input.participantId,
          competencyId,
          selfRating,
          managerRating,
          peerRating,
          subordinateRating,
          overallRating,
          managerCount: ratings.manager.length,
          peerCount: ratings.peer.length,
          subordinateCount: ratings.subordinate.length,
          selfPeerGap,
          selfManagerGap,
        });
      }

      // Deletar resultados antigos
      await db
        .delete(feedback360Results)
        .where(eq(feedback360Results.participantId, input.participantId));

      // Inserir novos resultados
      if (results.length > 0) {
        await db.insert(feedback360Results).values(results);
      }

      return { success: true, resultsCount: results.length };
    }),

  /**
   * Obter resultados de um participante
   */
  getResults: protectedProcedure
    .input(z.object({ participantId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      // Verificar se o usuário tem permissão (admin, RH ou o próprio participante)
      const [participant] = await db
        .select()
        .from(feedback360Participants)
        .where(eq(feedback360Participants.id, input.participantId))
        .limit(1);

      if (!participant) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Participant not found" });
      }

      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, ctx.user.id))
        .limit(1);

      if (ctx.user.role !== "admin" && ctx.user.role !== "rh" && employee?.id !== participant.employeeId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to view these results" });
      }

      // Buscar resultados com competências
      const results = await db
        .select({
          id: feedback360Results.id,
          competencyId: feedback360Results.competencyId,
          competencyName: competencies.name,
          competencyCategory: competencies.category,
          selfRating: feedback360Results.selfRating,
          managerRating: feedback360Results.managerRating,
          peerRating: feedback360Results.peerRating,
          subordinateRating: feedback360Results.subordinateRating,
          overallRating: feedback360Results.overallRating,
          managerCount: feedback360Results.managerCount,
          peerCount: feedback360Results.peerCount,
          subordinateCount: feedback360Results.subordinateCount,
          selfPeerGap: feedback360Results.selfPeerGap,
          selfManagerGap: feedback360Results.selfManagerGap,
        })
        .from(feedback360Results)
        .leftJoin(competencies, eq(feedback360Results.competencyId, competencies.id))
        .where(eq(feedback360Results.participantId, input.participantId));

      return results;
    }),

  /**
   * Obter estatísticas do ciclo
   */
  getCycleStats: protectedProcedure
    .input(z.object({ cycleId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [stats] = await db
        .select({
          totalParticipants: sql<number>`COUNT(DISTINCT ${feedback360Participants.id})`,
          completedSelfAssessments: sql<number>`COUNT(DISTINCT CASE WHEN ${feedback360Participants.selfAssessmentCompletedAt} IS NOT NULL THEN ${feedback360Participants.id} END)`,
          completedAllAssessments: sql<number>`COUNT(DISTINCT CASE WHEN ${feedback360Participants.allAssessmentsCompletedAt} IS NOT NULL THEN ${feedback360Participants.id} END)`,
        })
        .from(feedback360Participants)
        .where(eq(feedback360Participants.cycleId, input.cycleId));

      const [evaluatorStats] = await db
        .select({
          totalEvaluators: sql<number>`COUNT(*)`,
          completedEvaluations: sql<number>`COUNT(CASE WHEN ${feedback360Evaluators.status} = 'completed' THEN 1 END)`,
        })
        .from(feedback360Evaluators)
        .leftJoin(feedback360Participants, eq(feedback360Evaluators.participantId, feedback360Participants.id))
        .where(eq(feedback360Participants.cycleId, input.cycleId));

      return {
        ...stats,
        ...evaluatorStats,
      };
    }),
});
