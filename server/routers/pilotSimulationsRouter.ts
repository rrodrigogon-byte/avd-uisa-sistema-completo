import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { eq, and, desc, sql, gte, lte, count, inArray } from "drizzle-orm";
import {
  pilotSimulations,
  pilotParticipants,
  pilotSchedule,
  pilotMetrics,
  employees,
} from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

/**
 * Router para Gerenciamento de Simulados do Piloto
 * Sistema para executar piloto com 20-30 colaboradores
 */
export const pilotSimulationsRouter = router({
  /**
   * Criar novo piloto
   */
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(3),
      description: z.string().optional(),
      targetParticipants: z.number().min(20).max(50).default(30),
      startDate: z.date(),
      endDate: z.date(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [result] = await db.insert(pilotSimulations).values({
        name: input.name,
        description: input.description || null,
        targetParticipants: input.targetParticipants,
        startDate: input.startDate,
        endDate: input.endDate,
        phase: "preparation",
        status: "draft",
        createdBy: ctx.user?.id || 0,
      });

      const pilotId = result.insertId;

      // Criar cronograma padrão baseado no material de treinamento
      const defaultSchedule = [
        { stepNumber: 1, title: "Seleção de Participantes", description: "Identificar e selecionar 20-30 colaboradores para o piloto" },
        { stepNumber: 2, title: "Comunicação Inicial", description: "Enviar convites e explicar objetivos do piloto" },
        { stepNumber: 3, title: "Treinamento", description: "Capacitar participantes sobre o processo de avaliação" },
        { stepNumber: 4, title: "Execução - Fase 1", description: "Início das avaliações PIR" },
        { stepNumber: 5, title: "Execução - Fase 2", description: "Avaliações de competências e desempenho" },
        { stepNumber: 6, title: "Coleta de Feedback", description: "Reunir feedback dos participantes sobre o processo" },
        { stepNumber: 7, title: "Análise de Resultados", description: "Analisar dados e identificar melhorias" },
        { stepNumber: 8, title: "Ajustes e Documentação", description: "Implementar ajustes e documentar lições aprendidas" },
      ];

      const totalDays = Math.ceil((input.endDate.getTime() - input.startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysPerStep = Math.floor(totalDays / defaultSchedule.length);

      for (let i = 0; i < defaultSchedule.length; i++) {
        const step = defaultSchedule[i];
        const stepStart = new Date(input.startDate.getTime() + (i * daysPerStep * 24 * 60 * 60 * 1000));
        const stepEnd = new Date(stepStart.getTime() + (daysPerStep * 24 * 60 * 60 * 1000) - 1);

        await db.insert(pilotSchedule).values({
          pilotId: pilotId,
          stepNumber: step.stepNumber,
          title: step.title,
          description: step.description,
          plannedStartDate: stepStart,
          plannedEndDate: stepEnd,
          status: "pending",
        });
      }

      return { success: true, id: pilotId };
    }),

  /**
   * Listar todos os pilotos
   */
  list: protectedProcedure
    .input(z.object({
      status: z.enum(["draft", "active", "paused", "completed", "cancelled", "all"]).default("all"),
      page: z.number().default(1),
      limit: z.number().default(10),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { pilots: [], total: 0 };

      const conditions: any[] = [];
      if (input.status !== "all") {
        conditions.push(eq(pilotSimulations.status, input.status));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const pilots = await db
        .select()
        .from(pilotSimulations)
        .where(whereClause)
        .orderBy(desc(pilotSimulations.createdAt))
        .limit(input.limit)
        .offset((input.page - 1) * input.limit);

      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(pilotSimulations)
        .where(whereClause);

      return {
        pilots,
        total: countResult?.count || 0,
      };
    }),

  /**
   * Obter detalhes de um piloto
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [pilot] = await db
        .select()
        .from(pilotSimulations)
        .where(eq(pilotSimulations.id, input.id))
        .limit(1);

      if (!pilot) return null;

      // Buscar participantes
      const participants = await db
        .select({
          participant: pilotParticipants,
          employee: employees,
        })
        .from(pilotParticipants)
        .leftJoin(employees, eq(pilotParticipants.employeeId, employees.id))
        .where(eq(pilotParticipants.pilotId, input.id))
        .orderBy(pilotParticipants.status);

      // Buscar cronograma
      const schedule = await db
        .select()
        .from(pilotSchedule)
        .where(eq(pilotSchedule.pilotId, input.id))
        .orderBy(pilotSchedule.stepNumber);

      // Buscar última métrica
      const [latestMetric] = await db
        .select()
        .from(pilotMetrics)
        .where(eq(pilotMetrics.pilotId, input.id))
        .orderBy(desc(pilotMetrics.recordedAt))
        .limit(1);

      return {
        ...pilot,
        participants,
        schedule,
        latestMetric,
      };
    }),

  /**
   * Adicionar participantes ao piloto
   */
  addParticipants: protectedProcedure
    .input(z.object({
      pilotId: z.number(),
      employeeIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar se piloto existe
      const [pilot] = await db
        .select()
        .from(pilotSimulations)
        .where(eq(pilotSimulations.id, input.pilotId))
        .limit(1);

      if (!pilot) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Piloto não encontrado" });
      }

      // Verificar participantes existentes
      const existingParticipants = await db
        .select({ employeeId: pilotParticipants.employeeId })
        .from(pilotParticipants)
        .where(eq(pilotParticipants.pilotId, input.pilotId));

      const existingIds = new Set(existingParticipants.map(p => p.employeeId));
      const newEmployeeIds = input.employeeIds.filter(id => !existingIds.has(id));

      if (newEmployeeIds.length === 0) {
        return { success: true, added: 0, message: "Todos os participantes já estão no piloto" };
      }

      // Adicionar novos participantes
      for (const employeeId of newEmployeeIds) {
        await db.insert(pilotParticipants).values({
          pilotId: input.pilotId,
          employeeId,
          status: "invited",
        });
      }

      return { success: true, added: newEmployeeIds.length };
    }),

  /**
   * Atualizar status do participante
   */
  updateParticipantStatus: protectedProcedure
    .input(z.object({
      participantId: z.number(),
      status: z.enum(["invited", "accepted", "in_training", "ready", "in_progress", "completed", "declined", "removed"]),
      feedbackNotes: z.string().optional(),
      overallScore: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updateData: any = {
        status: input.status,
      };

      if (input.status === "accepted" || input.status === "declined") {
        updateData.respondedAt = new Date();
      }
      if (input.status === "in_training") {
        updateData.trainingCompletedAt = null;
      }
      if (input.status === "ready") {
        updateData.trainingCompletedAt = new Date();
      }
      if (input.status === "in_progress") {
        updateData.assessmentStartedAt = new Date();
      }
      if (input.status === "completed") {
        updateData.assessmentCompletedAt = new Date();
        if (input.overallScore !== undefined) {
          updateData.overallScore = input.overallScore;
        }
      }
      if (input.feedbackNotes) {
        updateData.feedbackNotes = input.feedbackNotes;
      }

      await db
        .update(pilotParticipants)
        .set(updateData)
        .where(eq(pilotParticipants.id, input.participantId));

      return { success: true };
    }),

  /**
   * Atualizar fase do piloto
   */
  updatePhase: protectedProcedure
    .input(z.object({
      pilotId: z.number(),
      phase: z.enum(["preparation", "training", "execution", "analysis", "adjustment", "completed"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(pilotSimulations)
        .set({ phase: input.phase })
        .where(eq(pilotSimulations.id, input.pilotId));

      return { success: true };
    }),

  /**
   * Atualizar status do piloto
   */
  updateStatus: protectedProcedure
    .input(z.object({
      pilotId: z.number(),
      status: z.enum(["draft", "active", "paused", "completed", "cancelled"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(pilotSimulations)
        .set({ status: input.status })
        .where(eq(pilotSimulations.id, input.pilotId));

      return { success: true };
    }),

  /**
   * Atualizar etapa do cronograma
   */
  updateScheduleStep: protectedProcedure
    .input(z.object({
      stepId: z.number(),
      status: z.enum(["pending", "in_progress", "completed", "delayed", "cancelled"]),
      actualStartDate: z.date().optional(),
      actualEndDate: z.date().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updateData: any = { status: input.status };
      if (input.actualStartDate) updateData.actualStartDate = input.actualStartDate;
      if (input.actualEndDate) updateData.actualEndDate = input.actualEndDate;
      if (input.notes) updateData.notes = input.notes;

      await db
        .update(pilotSchedule)
        .set(updateData)
        .where(eq(pilotSchedule.id, input.stepId));

      return { success: true };
    }),

  /**
   * Registrar métricas do piloto
   */
  recordMetrics: protectedProcedure
    .input(z.object({ pilotId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Calcular métricas atuais
      const participants = await db
        .select()
        .from(pilotParticipants)
        .where(eq(pilotParticipants.pilotId, input.pilotId));

      const total = participants.length;
      const active = participants.filter(p => ["accepted", "in_training", "ready", "in_progress"].includes(p.status)).length;
      const completed = participants.filter(p => p.status === "completed").length;
      const scores = participants.filter(p => p.overallScore !== null).map(p => p.overallScore!);
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

      await db.insert(pilotMetrics).values({
        pilotId: input.pilotId,
        totalParticipants: total,
        activeParticipants: active,
        completedParticipants: completed,
        averageProgress: total > 0 ? Math.round((completed / total) * 100) : 0,
        averageScore: avgScore,
        alertsCount: 0,
      });

      // Atualizar taxa de conclusão no piloto
      await db
        .update(pilotSimulations)
        .set({
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
          averageScore: avgScore,
        })
        .where(eq(pilotSimulations.id, input.pilotId));

      return { success: true };
    }),

  /**
   * Obter dashboard do piloto
   */
  getDashboard: protectedProcedure
    .input(z.object({ pilotId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      // Buscar piloto
      const [pilot] = await db
        .select()
        .from(pilotSimulations)
        .where(eq(pilotSimulations.id, input.pilotId))
        .limit(1);

      if (!pilot) return null;

      // Estatísticas de participantes
      const participants = await db
        .select()
        .from(pilotParticipants)
        .where(eq(pilotParticipants.pilotId, input.pilotId));

      const statusCounts = participants.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Cronograma
      const schedule = await db
        .select()
        .from(pilotSchedule)
        .where(eq(pilotSchedule.pilotId, input.pilotId))
        .orderBy(pilotSchedule.stepNumber);

      const completedSteps = schedule.filter(s => s.status === "completed").length;
      const currentStep = schedule.find(s => s.status === "in_progress") || schedule.find(s => s.status === "pending");

      // Histórico de métricas
      const metricsHistory = await db
        .select()
        .from(pilotMetrics)
        .where(eq(pilotMetrics.pilotId, input.pilotId))
        .orderBy(desc(pilotMetrics.recordedAt))
        .limit(30);

      return {
        pilot,
        stats: {
          totalParticipants: participants.length,
          statusCounts,
          completedParticipants: statusCounts["completed"] || 0,
          completionRate: participants.length > 0 
            ? Math.round(((statusCounts["completed"] || 0) / participants.length) * 100) 
            : 0,
        },
        schedule: {
          totalSteps: schedule.length,
          completedSteps,
          currentStep,
          progress: schedule.length > 0 ? Math.round((completedSteps / schedule.length) * 100) : 0,
        },
        metricsHistory: metricsHistory.reverse(),
      };
    }),

  /**
   * Buscar funcionários disponíveis para adicionar ao piloto
   */
  getAvailableEmployees: protectedProcedure
    .input(z.object({
      pilotId: z.number(),
      search: z.string().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      // Buscar IDs de funcionários já no piloto
      const existingParticipants = await db
        .select({ employeeId: pilotParticipants.employeeId })
        .from(pilotParticipants)
        .where(eq(pilotParticipants.pilotId, input.pilotId));

      const existingIds = existingParticipants.map(p => p.employeeId);

      // Buscar funcionários ativos que não estão no piloto
      let query = db
        .select()
        .from(employees)
        .where(eq(employees.active, true))
        .limit(input.limit);

      const allEmployees = await query;

      // Filtrar funcionários que já estão no piloto
      let availableEmployees = allEmployees.filter(e => !existingIds.includes(e.id));

      // Aplicar busca se fornecida
      if (input.search) {
        const searchLower = input.search.toLowerCase();
        availableEmployees = availableEmployees.filter(e => 
          e.name?.toLowerCase().includes(searchLower) ||
          e.email?.toLowerCase().includes(searchLower) ||
          e.employeeCode?.toLowerCase().includes(searchLower)
        );
      }

      return availableEmployees;
    }),
});
