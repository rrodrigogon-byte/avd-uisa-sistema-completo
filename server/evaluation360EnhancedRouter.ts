import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  evaluationCycles,
  evaluation360CycleWeights,
  evaluation360CycleCompetencies,
  evaluation360CycleParticipants,
  evaluation360CycleConfig,
  competencies,
  employees,
} from "../drizzle/schema";

/**
 * Router para Ciclo 360° Enhanced
 * Fluxo de 4 etapas: Dados → Pesos → Competências → Participantes
 */

export const evaluation360EnhancedRouter = router({
  /**
   * ETAPA 1: Criar ciclo com dados básicos
   */
  createCycleStep1: protectedProcedure
    .input(
      z.object({
        name: z.string().min(3, "Nome do ciclo deve ter pelo menos 3 caracteres"),
        year: z.number().min(2020).max(2100),
        type: z.enum(["anual", "semestral", "trimestral"]),
        startDate: z.date(),
        endDate: z.date(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Validar datas
      if (input.startDate >= input.endDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Data de início deve ser anterior à data de fim",
        });
      }

      // Criar ciclo com status "planejado"
      const [result] = await db.insert(evaluationCycles).values({
        name: input.name,
        year: input.year,
        type: input.type,
        startDate: input.startDate,
        endDate: input.endDate,
        description: input.description,
        status: "planejado",
        active: false,
      });

      const cycleId = result.insertId;

      // Criar configuração do ciclo (wizard)
      await db.insert(evaluation360CycleConfig).values({
        cycleId,
        currentStep: 1,
        isCompleted: false,
      });

      return {
        success: true,
        cycleId,
        message: "Ciclo criado com sucesso. Prossiga para configurar os pesos.",
      };
    }),

  /**
   * ETAPA 2: Configurar pesos das dimensões de avaliação
   */
  updateCycleWeights: protectedProcedure
    .input(
      z.object({
        cycleId: z.number(),
        selfWeight: z.number().min(0).max(100),
        managerWeight: z.number().min(0).max(100),
        peersWeight: z.number().min(0).max(100),
        subordinatesWeight: z.number().min(0).max(100),
        selfEvaluationDeadline: z.date().optional(),
        managerEvaluationDeadline: z.date().optional(),
        peersEvaluationDeadline: z.date().optional(),
        subordinatesEvaluationDeadline: z.date().optional(),
        consensusDeadline: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Validar soma dos pesos
      const totalWeight = input.selfWeight + input.managerWeight + input.peersWeight + input.subordinatesWeight;
      if (totalWeight !== 100) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Soma dos pesos deve ser 100%. Atual: ${totalWeight}%`,
        });
      }

      // Verificar se ciclo existe
      const cycle = await db.select().from(evaluationCycles).where(eq(evaluationCycles.id, input.cycleId)).limit(1);
      if (cycle.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ciclo não encontrado" });
      }

      // Verificar se já existe configuração de pesos
      const existingWeights = await db
        .select()
        .from(evaluation360CycleWeights)
        .where(eq(evaluation360CycleWeights.cycleId, input.cycleId))
        .limit(1);

      if (existingWeights.length > 0) {
        // Atualizar
        await db
          .update(evaluation360CycleWeights)
          .set({
            selfWeight: input.selfWeight,
            managerWeight: input.managerWeight,
            peersWeight: input.peersWeight,
            subordinatesWeight: input.subordinatesWeight,
            selfEvaluationDeadline: input.selfEvaluationDeadline,
            managerEvaluationDeadline: input.managerEvaluationDeadline,
            peersEvaluationDeadline: input.peersEvaluationDeadline,
            subordinatesEvaluationDeadline: input.subordinatesEvaluationDeadline,
            consensusDeadline: input.consensusDeadline,
          })
          .where(eq(evaluation360CycleWeights.cycleId, input.cycleId));
      } else {
        // Criar
        await db.insert(evaluation360CycleWeights).values({
          cycleId: input.cycleId,
          selfWeight: input.selfWeight,
          managerWeight: input.managerWeight,
          peersWeight: input.peersWeight,
          subordinatesWeight: input.subordinatesWeight,
          selfEvaluationDeadline: input.selfEvaluationDeadline,
          managerEvaluationDeadline: input.managerEvaluationDeadline,
          peersEvaluationDeadline: input.peersEvaluationDeadline,
          subordinatesEvaluationDeadline: input.subordinatesEvaluationDeadline,
          consensusDeadline: input.consensusDeadline,
        });
      }

      // Atualizar passo do wizard
      await db
        .update(evaluation360CycleConfig)
        .set({ currentStep: 2 })
        .where(eq(evaluation360CycleConfig.cycleId, input.cycleId));

      return {
        success: true,
        message: "Pesos configurados com sucesso. Prossiga para selecionar competências.",
      };
    }),

  /**
   * ETAPA 3: Adicionar competências ao ciclo
   */
  addCycleCompetencies: protectedProcedure
    .input(
      z.object({
        cycleId: z.number(),
        competencies: z.array(
          z.object({
            competencyId: z.number(),
            weight: z.number().min(1),
            minLevel: z.number().min(1).max(5),
            maxLevel: z.number().min(1).max(5),
            description: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      if (input.competencies.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Pelo menos uma competência deve ser selecionada",
        });
      }

      // Verificar se ciclo existe
      const cycle = await db.select().from(evaluationCycles).where(eq(evaluationCycles.id, input.cycleId)).limit(1);
      if (cycle.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ciclo não encontrado" });
      }

      // Remover competências antigas
      await db.delete(evaluation360CycleCompetencies).where(eq(evaluation360CycleCompetencies.cycleId, input.cycleId));

      // Adicionar novas competências
      for (const comp of input.competencies) {
        // Validar que competência existe
        const competency = await db
          .select()
          .from(competencies)
          .where(eq(competencies.id, comp.competencyId))
          .limit(1);

        if (competency.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Competência com ID ${comp.competencyId} não encontrada`,
          });
        }

        await db.insert(evaluation360CycleCompetencies).values({
          cycleId: input.cycleId,
          competencyId: comp.competencyId,
          weight: comp.weight,
          minLevel: comp.minLevel,
          maxLevel: comp.maxLevel,
          description: comp.description,
        });
      }

      // Atualizar passo do wizard
      await db
        .update(evaluation360CycleConfig)
        .set({ currentStep: 3 })
        .where(eq(evaluation360CycleConfig.cycleId, input.cycleId));

      return {
        success: true,
        message: `${input.competencies.length} competência(s) adicionada(s). Prossiga para adicionar participantes.`,
      };
    }),

  /**
   * ETAPA 4: Adicionar participantes ao ciclo
   */
  addCycleParticipants: protectedProcedure
    .input(
      z.object({
        cycleId: z.number(),
        participants: z.array(
          z.object({
            employeeId: z.number(),
            participationType: z.enum(["evaluated", "evaluator", "both"]),
            managerId: z.number().optional(),
            peerIds: z.array(z.number()).optional(),
            subordinateIds: z.array(z.number()).optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      if (input.participants.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Pelo menos um participante deve ser adicionado",
        });
      }

      // Verificar se ciclo existe
      const cycle = await db.select().from(evaluationCycles).where(eq(evaluationCycles.id, input.cycleId)).limit(1);
      if (cycle.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ciclo não encontrado" });
      }

      // Remover participantes antigos
      await db
        .delete(evaluation360CycleParticipants)
        .where(eq(evaluation360CycleParticipants.cycleId, input.cycleId));

      // Adicionar novos participantes
      for (const participant of input.participants) {
        // Validar que colaborador existe
        const employee = await db
          .select()
          .from(employees)
          .where(eq(employees.id, participant.employeeId))
          .limit(1);

        if (employee.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Colaborador com ID ${participant.employeeId} não encontrado`,
          });
        }

        await db.insert(evaluation360CycleParticipants).values({
          cycleId: input.cycleId,
          employeeId: participant.employeeId,
          participationType: participant.participationType,
          managerId: participant.managerId,
          peerIds: participant.peerIds ? JSON.stringify(participant.peerIds) : null,
          subordinateIds: participant.subordinateIds ? JSON.stringify(participant.subordinateIds) : null,
          status: "pending",
        });
      }

      // Atualizar passo do wizard
      await db
        .update(evaluation360CycleConfig)
        .set({ currentStep: 4 })
        .where(eq(evaluation360CycleConfig.cycleId, input.cycleId));

      return {
        success: true,
        message: `${input.participants.length} participante(s) adicionado(s). Pronto para finalizar o ciclo.`,
      };
    }),

  /**
   * Finalizar criação do ciclo e ativá-lo
   */
  completeCycleCreation: protectedProcedure
    .input(z.object({ cycleId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar se ciclo existe
      const cycle = await db.select().from(evaluationCycles).where(eq(evaluationCycles.id, input.cycleId)).limit(1);
      if (cycle.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ciclo não encontrado" });
      }

      // Validar que todas as etapas foram completadas
      const weights = await db
        .select()
        .from(evaluation360CycleWeights)
        .where(eq(evaluation360CycleWeights.cycleId, input.cycleId))
        .limit(1);

      const competencies = await db
        .select()
        .from(evaluation360CycleCompetencies)
        .where(eq(evaluation360CycleCompetencies.cycleId, input.cycleId))
        .limit(1);

      const participants = await db
        .select()
        .from(evaluation360CycleParticipants)
        .where(eq(evaluation360CycleParticipants.cycleId, input.cycleId))
        .limit(1);

      if (weights.length === 0 || competencies.length === 0 || participants.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Todas as etapas devem ser completadas antes de ativar o ciclo",
        });
      }

      // Atualizar ciclo para status "ativo"
      await db
        .update(evaluationCycles)
        .set({
          status: "ativo",
          active: true,
        })
        .where(eq(evaluationCycles.id, input.cycleId));

      // Marcar configuração como completa
      await db
        .update(evaluation360CycleConfig)
        .set({
          currentStep: 4,
          isCompleted: true,
        })
        .where(eq(evaluation360CycleConfig.cycleId, input.cycleId));

      return {
        success: true,
        cycleId: input.cycleId,
        message: "Ciclo 360° Enhanced criado e ativado com sucesso!",
      };
    }),

  /**
   * Buscar dados do ciclo em criação (para wizard)
   */
  getCycleData: protectedProcedure
    .input(z.object({ cycleId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const cycle = await db.select().from(evaluationCycles).where(eq(evaluationCycles.id, input.cycleId)).limit(1);

      if (cycle.length === 0) return null;

      const weights = await db
        .select()
        .from(evaluation360CycleWeights)
        .where(eq(evaluation360CycleWeights.cycleId, input.cycleId))
        .limit(1);

      const cycleCompetencies = await db
        .select()
        .from(evaluation360CycleCompetencies)
        .where(eq(evaluation360CycleCompetencies.cycleId, input.cycleId));

      const cycleParticipants = await db
        .select()
        .from(evaluation360CycleParticipants)
        .where(eq(evaluation360CycleParticipants.cycleId, input.cycleId));

      const config = await db
        .select()
        .from(evaluation360CycleConfig)
        .where(eq(evaluation360CycleConfig.cycleId, input.cycleId))
        .limit(1);

      return {
        cycle: cycle[0],
        weights: weights.length > 0 ? weights[0] : null,
        competencies: cycleCompetencies,
        participants: cycleParticipants,
        config: config.length > 0 ? config[0] : null,
      };
    }),

  /**
   * Listar todos os ciclos 360° (com filtros)
   */
  listCycles: protectedProcedure
    .input(
      z.object({
        status: z.enum(["planejado", "ativo", "concluido", "cancelado"]).optional(),
        year: z.number().optional(),
      })
    .optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db.select().from(evaluationCycles);

      if (input.status) {
        query = query.where(eq(evaluationCycles.status, input.status)) as any;
      }

      if (input.year) {
        query = query.where(eq(evaluationCycles.year, input.year)) as any;
      }

      const cycles = await query;

      return cycles.map((cycle) => ({
        id: cycle.id,
        name: cycle.name,
        year: cycle.year,
        type: cycle.type,
        status: cycle.status,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
        description: cycle.description,
      }));
    }),
});
