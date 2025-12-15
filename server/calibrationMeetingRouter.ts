import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { 
  calibrationSessions, 
  calibrationParticipants, 
  calibrationVotes, 
  calibrationComparisons,
  calibrationMessages,
  performanceEvaluations,
  employees
} from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Router para Reuniões de Calibração em Tempo Real
 * Sistema completo de calibração colaborativa com votação e consenso
 */
export const calibrationMeetingRouter = router({
  /**
   * Criar nova reunião de calibração
   */
  createMeeting: protectedProcedure
    .input(z.object({
      cycleId: z.number(),
      departmentId: z.number().optional(),
      scheduledDate: z.string(),
      participantIds: z.array(z.number()),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Criar sessão
      const [session] = await db.insert(calibrationSessions).values({
        cycleId: input.cycleId,
        departmentId: input.departmentId,
        facilitatorId: ctx.user.id,
        status: "agendada",
        scheduledDate: new Date(input.scheduledDate),
      });

      const sessionId = session.insertId;

      // Adicionar facilitador como participante
      await db.insert(calibrationParticipants).values({
        sessionId,
        userId: ctx.user.id,
        role: "facilitator",
      });

      // Adicionar demais participantes
      if (input.participantIds.length > 0) {
        await db.insert(calibrationParticipants).values(
          input.participantIds.map(userId => ({
            sessionId,
            userId,
            role: "participant" as const,
          }))
        );
      }

      return { sessionId, message: "Reunião criada com sucesso" };
    }),

  /**
   * Listar reuniões de calibração
   */
  listMeetings: protectedProcedure
    .input(z.object({
      cycleId: z.number().optional(),
      status: z.enum(["agendada", "em_andamento", "concluida"]).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db.select().from(calibrationSessions);

      if (input.cycleId) {
        query = query.where(eq(calibrationSessions.cycleId, input.cycleId)) as any;
      }

      if (input.status) {
        query = query.where(eq(calibrationSessions.status, input.status)) as any;
      }

      const meetings = await query.orderBy(desc(calibrationSessions.scheduledDate));

      return meetings;
    }),

  /**
   * Obter detalhes da reunião com participantes
   */
  getMeetingDetails: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Buscar sessão
      const [session] = await db
        .select()
        .from(calibrationSessions)
        .where(eq(calibrationSessions.id, input.sessionId));

      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reunião não encontrada" });
      }

      // Buscar participantes
      const participants = await db
        .select({
          id: calibrationParticipants.id,
          userId: calibrationParticipants.userId,
          userName: employees.name,
          role: calibrationParticipants.role,
          joinedAt: calibrationParticipants.joinedAt,
          leftAt: calibrationParticipants.leftAt,
          isOnline: calibrationParticipants.isOnline,
        })
        .from(calibrationParticipants)
        .leftJoin(employees, eq(calibrationParticipants.userId, employees.id))
        .where(eq(calibrationParticipants.sessionId, input.sessionId));

      return { session, participants };
    }),

  /**
   * Iniciar reunião (mudar status para em_andamento)
   */
  startMeeting: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(calibrationSessions)
        .set({ 
          status: "em_andamento",
          startedAt: new Date(),
        })
        .where(eq(calibrationSessions.id, input.sessionId));

      return { message: "Reunião iniciada" };
    }),

  /**
   * Finalizar reunião
   */
  completeMeeting: protectedProcedure
    .input(z.object({ 
      sessionId: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(calibrationSessions)
        .set({ 
          status: "concluida",
          completedAt: new Date(),
          notes: input.notes,
        })
        .where(eq(calibrationSessions.id, input.sessionId));

      return { message: "Reunião finalizada" };
    }),

  /**
   * Marcar participante como online
   */
  joinMeeting: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verificar se participante já existe
      const [existing] = await db
        .select()
        .from(calibrationParticipants)
        .where(
          and(
            eq(calibrationParticipants.sessionId, input.sessionId),
            eq(calibrationParticipants.userId, ctx.user.id)
          )
        );

      if (existing) {
        // Atualizar status
        await db
          .update(calibrationParticipants)
          .set({ 
            isOnline: true,
            joinedAt: new Date(),
          })
          .where(eq(calibrationParticipants.id, existing.id));
      } else {
        // Adicionar como observador
        await db.insert(calibrationParticipants).values({
          sessionId: input.sessionId,
          userId: ctx.user.id,
          role: "observer",
          isOnline: true,
          joinedAt: new Date(),
        });
      }

      return { message: "Entrou na reunião" };
    }),

  /**
   * Marcar participante como offline
   */
  leaveMeeting: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(calibrationParticipants)
        .set({ 
          isOnline: false,
          leftAt: new Date(),
        })
        .where(
          and(
            eq(calibrationParticipants.sessionId, input.sessionId),
            eq(calibrationParticipants.userId, ctx.user.id)
          )
        );

      return { message: "Saiu da reunião" };
    }),

  /**
   * Buscar avaliações para calibração
   */
  getEvaluationsForCalibration: protectedProcedure
    .input(z.object({ 
      sessionId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      // Buscar sessão para pegar cycleId e departmentId
      const [session] = await db
        .select()
        .from(calibrationSessions)
        .where(eq(calibrationSessions.id, input.sessionId));

      if (!session) return [];

      // Buscar avaliações do ciclo
      const evaluations = await db
        .select({
          id: performanceEvaluations.id,
          employeeId: performanceEvaluations.employeeId,
          employeeName: employees.name,
          finalScore: performanceEvaluations.finalScore,
          status: performanceEvaluations.status,
          workflowStatus: performanceEvaluations.workflowStatus,
        })
        .from(performanceEvaluations)
        .leftJoin(employees, eq(performanceEvaluations.employeeId, employees.id))
        .where(
          session.departmentId
            ? and(
                eq(performanceEvaluations.cycleId, session.cycleId),
                eq(employees.departmentId, session.departmentId)
              )
            : eq(performanceEvaluations.cycleId, session.cycleId)
        );

      return evaluations;
    }),

  /**
   * Criar comparação de avaliação
   */
  createComparison: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      evaluationId: z.number(),
      selfScore: z.number().optional(),
      managerScore: z.number().optional(),
      peerScores: z.array(z.number()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verificar se já existe comparação
      const [existing] = await db
        .select()
        .from(calibrationComparisons)
        .where(
          and(
            eq(calibrationComparisons.sessionId, input.sessionId),
            eq(calibrationComparisons.evaluationId, input.evaluationId)
          )
        );

      if (existing) {
        // Atualizar
        await db
          .update(calibrationComparisons)
          .set({
            selfScore: input.selfScore,
            managerScore: input.managerScore,
            peerScores: input.peerScores ? JSON.stringify(input.peerScores) : null,
          })
          .where(eq(calibrationComparisons.id, existing.id));

        return { comparisonId: existing.id };
      } else {
        // Criar nova
        const [result] = await db.insert(calibrationComparisons).values({
          sessionId: input.sessionId,
          evaluationId: input.evaluationId,
          selfScore: input.selfScore,
          managerScore: input.managerScore,
          peerScores: input.peerScores ? JSON.stringify(input.peerScores) : null,
        });

        return { comparisonId: result.insertId };
      }
    }),

  /**
   * Registrar voto
   */
  submitVote: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      evaluationId: z.number(),
      proposedScore: z.number(),
      justification: z.string().optional(),
      voteType: z.enum(["approve", "reject", "abstain"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.insert(calibrationVotes).values({
        sessionId: input.sessionId,
        evaluationId: input.evaluationId,
        voterId: ctx.user.id,
        proposedScore: input.proposedScore,
        justification: input.justification,
        voteType: input.voteType,
      });

      return { message: "Voto registrado" };
    }),

  /**
   * Buscar votos de uma avaliação
   */
  getVotes: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      evaluationId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const votes = await db
        .select({
          id: calibrationVotes.id,
          voterId: calibrationVotes.voterId,
          voterName: employees.name,
          proposedScore: calibrationVotes.proposedScore,
          justification: calibrationVotes.justification,
          voteType: calibrationVotes.voteType,
          createdAt: calibrationVotes.createdAt,
        })
        .from(calibrationVotes)
        .leftJoin(employees, eq(calibrationVotes.voterId, employees.id))
        .where(
          and(
            eq(calibrationVotes.sessionId, input.sessionId),
            eq(calibrationVotes.evaluationId, input.evaluationId)
          )
        )
        .orderBy(calibrationVotes.createdAt);

      return votes;
    }),

  /**
   * Registrar consenso
   */
  registerConsensus: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      evaluationId: z.number(),
      consensusScore: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Atualizar comparação
      await db
        .update(calibrationComparisons)
        .set({
          consensusScore: input.consensusScore,
          consensusReachedAt: new Date(),
          consensusBy: ctx.user.id,
        })
        .where(
          and(
            eq(calibrationComparisons.sessionId, input.sessionId),
            eq(calibrationComparisons.evaluationId, input.evaluationId)
          )
        );

      // Atualizar nota final da avaliação
      await db
        .update(performanceEvaluations)
        .set({ finalScore: input.consensusScore })
        .where(eq(performanceEvaluations.id, input.evaluationId));

      return { message: "Consenso registrado" };
    }),

  /**
   * Enviar mensagem no chat
   */
  sendMessage: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      message: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.insert(calibrationMessages).values({
        sessionId: input.sessionId,
        userId: ctx.user.id,
        message: input.message,
      });

      return { message: "Mensagem enviada" };
    }),

  /**
   * Buscar mensagens do chat
   */
  getMessages: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const messages = await db
        .select({
          id: calibrationMessages.id,
          userId: calibrationMessages.userId,
          userName: employees.name,
          message: calibrationMessages.message,
          createdAt: calibrationMessages.createdAt,
        })
        .from(calibrationMessages)
        .leftJoin(employees, eq(calibrationMessages.userId, employees.id))
        .where(eq(calibrationMessages.sessionId, input.sessionId))
        .orderBy(calibrationMessages.createdAt);

      return messages;
    }),
});
