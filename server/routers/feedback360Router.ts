import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  feedback360Cycles,
  feedback360Participants,
  feedback360Evaluators,
  feedback360Questions,
  feedback360Responses,
  feedback360Reports,
  employees,
} from "../../drizzle/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Router de Feedback 360°
 * Gerencia ciclos de feedback, avaliações e relatórios
 */
export const feedback360Router = router({
  /**
   * Listar todos os ciclos de feedback
   */
  listCycles: protectedProcedure
    .input(
      z
        .object({
          status: z.enum(["draft", "active", "closed", "archived"]).optional(),
          limit: z.number().default(50),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      let query = db
        .select({
          id: feedback360Cycles.id,
          name: feedback360Cycles.name,
          description: feedback360Cycles.description,
          startDate: feedback360Cycles.startDate,
          endDate: feedback360Cycles.endDate,
          status: feedback360Cycles.status,
          allowSelfAssessment: feedback360Cycles.allowSelfAssessment,
          minEvaluators: feedback360Cycles.minEvaluators,
          maxEvaluators: feedback360Cycles.maxEvaluators,
          anonymousResponses: feedback360Cycles.anonymousResponses,
          createdBy: feedback360Cycles.createdBy,
          createdAt: feedback360Cycles.createdAt,
        })
        .from(feedback360Cycles)
        .orderBy(desc(feedback360Cycles.createdAt))
        .limit(input?.limit || 50);

      if (input?.status) {
        query = query.where(eq(feedback360Cycles.status, input.status)) as any;
      }

      const cycles = await query;

      // Buscar estatísticas de cada ciclo
      const cyclesWithStats = await Promise.all(
        cycles.map(async (cycle) => {
          const [participantsCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(feedback360Participants)
            .where(eq(feedback360Participants.cycleId, cycle.id));

          const [completedCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(feedback360Participants)
            .where(
              and(
                eq(feedback360Participants.cycleId, cycle.id),
                eq(feedback360Participants.status, "completed")
              )
            );

          return {
            ...cycle,
            totalParticipants: participantsCount?.count || 0,
            completedParticipants: completedCount?.count || 0,
            completionRate:
              participantsCount?.count > 0
                ? Math.round(
                    ((completedCount?.count || 0) / participantsCount.count) *
                      100
                  )
                : 0,
          };
        })
      );

      return cyclesWithStats;
    }),

  /**
   * Obter detalhes de um ciclo específico
   */
  getCycleById: protectedProcedure
    .input(z.object({ cycleId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      const [cycle] = await db
        .select()
        .from(feedback360Cycles)
        .where(eq(feedback360Cycles.id, input.cycleId))
        .limit(1);

      if (!cycle) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ciclo não encontrado",
        });
      }

      // Buscar questões do ciclo
      const questions = await db
        .select()
        .from(feedback360Questions)
        .where(eq(feedback360Questions.cycleId, input.cycleId))
        .orderBy(feedback360Questions.order);

      // Buscar participantes
      const participants = await db
        .select({
          id: feedback360Participants.id,
          employeeId: feedback360Participants.employeeId,
          employeeName: employees.name,
          employeeEmail: employees.email,
          status: feedback360Participants.status,
          invitedAt: feedback360Participants.invitedAt,
          completedAt: feedback360Participants.completedAt,
        })
        .from(feedback360Participants)
        .leftJoin(
          employees,
          eq(feedback360Participants.employeeId, employees.id)
        )
        .where(eq(feedback360Participants.cycleId, input.cycleId));

      return {
        ...cycle,
        questions,
        participants,
      };
    }),

  /**
   * Criar novo ciclo de feedback
   */
  createCycle: adminProcedure
    .input(
      z.object({
        name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
        description: z.string().optional(),
        startDate: z.string(),
        endDate: z.string(),
        allowSelfAssessment: z.boolean().default(true),
        minEvaluators: z.number().default(3),
        maxEvaluators: z.number().default(10),
        anonymousResponses: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      const [result] = await db.insert(feedback360Cycles).values({
        name: input.name,
        description: input.description || null,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        status: "draft",
        allowSelfAssessment: input.allowSelfAssessment,
        minEvaluators: input.minEvaluators,
        maxEvaluators: input.maxEvaluators,
        anonymousResponses: input.anonymousResponses,
        createdBy: ctx.user.id,
      });

      return {
        success: true,
        cycleId: result.insertId,
        message: "Ciclo criado com sucesso",
      };
    }),

  /**
   * Atualizar ciclo de feedback
   */
  updateCycle: adminProcedure
    .input(
      z.object({
        cycleId: z.number(),
        name: z.string().min(3).optional(),
        description: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        status: z.enum(["draft", "active", "closed", "archived"]).optional(),
        allowSelfAssessment: z.boolean().optional(),
        minEvaluators: z.number().optional(),
        maxEvaluators: z.number().optional(),
        anonymousResponses: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      const updateData: any = {};

      if (input.name) updateData.name = input.name;
      if (input.description !== undefined)
        updateData.description = input.description;
      if (input.startDate) updateData.startDate = new Date(input.startDate);
      if (input.endDate) updateData.endDate = new Date(input.endDate);
      if (input.status) updateData.status = input.status;
      if (input.allowSelfAssessment !== undefined)
        updateData.allowSelfAssessment = input.allowSelfAssessment;
      if (input.minEvaluators) updateData.minEvaluators = input.minEvaluators;
      if (input.maxEvaluators) updateData.maxEvaluators = input.maxEvaluators;
      if (input.anonymousResponses !== undefined)
        updateData.anonymousResponses = input.anonymousResponses;

      await db
        .update(feedback360Cycles)
        .set(updateData)
        .where(eq(feedback360Cycles.id, input.cycleId));

      return {
        success: true,
        message: "Ciclo atualizado com sucesso",
      };
    }),

  /**
   * Adicionar questão ao ciclo
   */
  addQuestion: adminProcedure
    .input(
      z.object({
        cycleId: z.number(),
        category: z.string(),
        question: z.string().min(10, "Questão deve ter no mínimo 10 caracteres"),
        description: z.string().optional(),
        responseType: z.enum(["scale", "text", "multiple_choice"]).default("scale"),
        scaleMin: z.number().default(1),
        scaleMax: z.number().default(5),
        options: z.array(z.string()).optional(),
        required: z.boolean().default(true),
        order: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      const [result] = await db.insert(feedback360Questions).values({
        cycleId: input.cycleId,
        category: input.category,
        question: input.question,
        description: input.description || null,
        responseType: input.responseType,
        scaleMin: input.scaleMin,
        scaleMax: input.scaleMax,
        options: input.options || null,
        required: input.required,
        order: input.order,
      });

      return {
        success: true,
        questionId: result.insertId,
        message: "Questão adicionada com sucesso",
      };
    }),

  /**
   * Adicionar participantes ao ciclo
   */
  addParticipants: adminProcedure
    .input(
      z.object({
        cycleId: z.number(),
        employeeIds: z.array(z.number()).min(1, "Selecione pelo menos um colaborador"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      // Verificar se já existem participantes
      const existing = await db
        .select({ employeeId: feedback360Participants.employeeId })
        .from(feedback360Participants)
        .where(
          and(
            eq(feedback360Participants.cycleId, input.cycleId),
            inArray(feedback360Participants.employeeId, input.employeeIds)
          )
        );

      const existingIds = existing.map((e) => e.employeeId);
      const newIds = input.employeeIds.filter((id) => !existingIds.includes(id));

      if (newIds.length === 0) {
        return {
          success: true,
          message: "Todos os colaboradores já são participantes",
          added: 0,
        };
      }

      // Adicionar novos participantes
      await db.insert(feedback360Participants).values(
        newIds.map((employeeId) => ({
          cycleId: input.cycleId,
          employeeId,
          status: "invited" as const,
        }))
      );

      return {
        success: true,
        message: `${newIds.length} participante(s) adicionado(s) com sucesso`,
        added: newIds.length,
      };
    }),

  /**
   * Adicionar avaliadores para um participante
   */
  addEvaluators: adminProcedure
    .input(
      z.object({
        participantId: z.number(),
        evaluators: z.array(
          z.object({
            evaluatorId: z.number(),
            relationshipType: z.enum(["self", "manager", "peer", "subordinate", "other"]),
          })
        ).min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      // Verificar se já existem avaliadores
      const existing = await db
        .select({ evaluatorId: feedback360Evaluators.evaluatorId })
        .from(feedback360Evaluators)
        .where(
          and(
            eq(feedback360Evaluators.participantId, input.participantId),
            inArray(
              feedback360Evaluators.evaluatorId,
              input.evaluators.map((e) => e.evaluatorId)
            )
          )
        );

      const existingIds = existing.map((e) => e.evaluatorId);
      const newEvaluators = input.evaluators.filter(
        (e) => !existingIds.includes(e.evaluatorId)
      );

      if (newEvaluators.length === 0) {
        return {
          success: true,
          message: "Todos os avaliadores já foram adicionados",
          added: 0,
        };
      }

      // Adicionar novos avaliadores
      await db.insert(feedback360Evaluators).values(
        newEvaluators.map((evaluator) => ({
          participantId: input.participantId,
          evaluatorId: evaluator.evaluatorId,
          relationshipType: evaluator.relationshipType,
          status: "pending" as const,
        }))
      );

      return {
        success: true,
        message: `${newEvaluators.length} avaliador(es) adicionado(s) com sucesso`,
        added: newEvaluators.length,
      };
    }),

  /**
   * Obter avaliações pendentes para o usuário logado
   */
  getMyPendingEvaluations: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database not available",
      });

    // Buscar avaliações onde o usuário é avaliador
    const evaluations = await db
      .select({
        evaluatorRecordId: feedback360Evaluators.id,
        cycleId: feedback360Cycles.id,
        cycleName: feedback360Cycles.name,
        cycleEndDate: feedback360Cycles.endDate,
        participantId: feedback360Participants.id,
        participantName: employees.name,
        participantEmail: employees.email,
        relationshipType: feedback360Evaluators.relationshipType,
        status: feedback360Evaluators.status,
        invitedAt: feedback360Evaluators.invitedAt,
      })
      .from(feedback360Evaluators)
      .innerJoin(
        feedback360Participants,
        eq(feedback360Evaluators.participantId, feedback360Participants.id)
      )
      .innerJoin(
        feedback360Cycles,
        eq(feedback360Participants.cycleId, feedback360Cycles.id)
      )
      .innerJoin(
        employees,
        eq(feedback360Participants.employeeId, employees.id)
      )
      .where(
        and(
          eq(feedback360Evaluators.evaluatorId, ctx.user.id),
          eq(feedback360Evaluators.status, "pending"),
          eq(feedback360Cycles.status, "active")
        )
      );

    return evaluations;
  }),

  /**
   * Iniciar avaliação
   */
  startEvaluation: protectedProcedure
    .input(z.object({ evaluatorRecordId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      // Verificar se o usuário é o avaliador
      const [evaluator] = await db
        .select()
        .from(feedback360Evaluators)
        .where(
          and(
            eq(feedback360Evaluators.id, input.evaluatorRecordId),
            eq(feedback360Evaluators.evaluatorId, ctx.user.id)
          )
        )
        .limit(1);

      if (!evaluator) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para esta avaliação",
        });
      }

      // Atualizar status para in_progress
      await db
        .update(feedback360Evaluators)
        .set({
          status: "in_progress",
          startedAt: new Date(),
        })
        .where(eq(feedback360Evaluators.id, input.evaluatorRecordId));

      // Buscar questões do ciclo
      const [participant] = await db
        .select({ cycleId: feedback360Participants.cycleId })
        .from(feedback360Participants)
        .where(eq(feedback360Participants.id, evaluator.participantId))
        .limit(1);

      const questions = await db
        .select()
        .from(feedback360Questions)
        .where(eq(feedback360Questions.cycleId, participant.cycleId))
        .orderBy(feedback360Questions.order);

      return {
        success: true,
        questions,
      };
    }),

  /**
   * Submeter respostas da avaliação
   */
  submitResponses: protectedProcedure
    .input(
      z.object({
        evaluatorRecordId: z.number(),
        responses: z.array(
          z.object({
            questionId: z.number(),
            scaleValue: z.number().optional(),
            textValue: z.string().optional(),
            selectedOption: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      // Verificar permissão
      const [evaluator] = await db
        .select()
        .from(feedback360Evaluators)
        .where(
          and(
            eq(feedback360Evaluators.id, input.evaluatorRecordId),
            eq(feedback360Evaluators.evaluatorId, ctx.user.id)
          )
        )
        .limit(1);

      if (!evaluator) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para esta avaliação",
        });
      }

      // Deletar respostas anteriores (se houver)
      await db
        .delete(feedback360Responses)
        .where(eq(feedback360Responses.evaluatorRecordId, input.evaluatorRecordId));

      // Inserir novas respostas
      if (input.responses.length > 0) {
        await db.insert(feedback360Responses).values(
          input.responses.map((response) => ({
            evaluatorRecordId: input.evaluatorRecordId,
            questionId: response.questionId,
            scaleValue: response.scaleValue || null,
            textValue: response.textValue || null,
            selectedOption: response.selectedOption || null,
          }))
        );
      }

      // Atualizar status para completed
      await db
        .update(feedback360Evaluators)
        .set({
          status: "completed",
          completedAt: new Date(),
        })
        .where(eq(feedback360Evaluators.id, input.evaluatorRecordId));

      // Verificar se todas as avaliações do participante foram concluídas
      const [participant] = await db
        .select()
        .from(feedback360Participants)
        .where(eq(feedback360Participants.id, evaluator.participantId))
        .limit(1);

      const allEvaluators = await db
        .select()
        .from(feedback360Evaluators)
        .where(eq(feedback360Evaluators.participantId, evaluator.participantId));

      const allCompleted = allEvaluators.every((e) => e.status === "completed");

      if (allCompleted) {
        await db
          .update(feedback360Participants)
          .set({
            status: "completed",
            completedAt: new Date(),
          })
          .where(eq(feedback360Participants.id, evaluator.participantId));
      }

      return {
        success: true,
        message: "Avaliação submetida com sucesso",
      };
    }),

  /**
   * Gerar relatório de feedback para um participante
   */
  generateReport: adminProcedure
    .input(z.object({ participantId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      // Buscar participante e ciclo
      const [participant] = await db
        .select({
          participantId: feedback360Participants.id,
          employeeId: feedback360Participants.employeeId,
          cycleId: feedback360Participants.cycleId,
        })
        .from(feedback360Participants)
        .where(eq(feedback360Participants.id, input.participantId))
        .limit(1);

      if (!participant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Participante não encontrado",
        });
      }

      // Buscar todos os avaliadores e suas respostas
      const evaluators = await db
        .select({
          evaluatorId: feedback360Evaluators.id,
          relationshipType: feedback360Evaluators.relationshipType,
          status: feedback360Evaluators.status,
        })
        .from(feedback360Evaluators)
        .where(eq(feedback360Evaluators.participantId, input.participantId));

      const completedEvaluators = evaluators.filter((e) => e.status === "completed");

      if (completedEvaluators.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nenhuma avaliação concluída para gerar relatório",
        });
      }

      // Buscar questões do ciclo
      const questions = await db
        .select()
        .from(feedback360Questions)
        .where(eq(feedback360Questions.cycleId, participant.cycleId));

      // Buscar todas as respostas
      const responses = await db
        .select({
          questionId: feedback360Responses.questionId,
          scaleValue: feedback360Responses.scaleValue,
          textValue: feedback360Responses.textValue,
          evaluatorRecordId: feedback360Responses.evaluatorRecordId,
          relationshipType: feedback360Evaluators.relationshipType,
          category: feedback360Questions.category,
        })
        .from(feedback360Responses)
        .innerJoin(
          feedback360Evaluators,
          eq(feedback360Responses.evaluatorRecordId, feedback360Evaluators.id)
        )
        .innerJoin(
          feedback360Questions,
          eq(feedback360Responses.questionId, feedback360Questions.id)
        )
        .where(
          inArray(
            feedback360Responses.evaluatorRecordId,
            completedEvaluators.map((e) => e.evaluatorId)
          )
        );

      // Calcular média geral
      const scaleResponses = responses.filter((r) => r.scaleValue !== null);
      const averageScore =
        scaleResponses.length > 0
          ? Math.round(
              (scaleResponses.reduce((sum, r) => sum + (r.scaleValue || 0), 0) /
                scaleResponses.length) *
                20
            )
          : 0;

      // Calcular médias por categoria
      const categoryScores: { category: string; averageScore: number; responses: number }[] = [];
      const categories = [...new Set(responses.map((r) => r.category))];

      categories.forEach((category) => {
        const categoryResponses = responses.filter(
          (r) => r.category === category && r.scaleValue !== null
        );
        if (categoryResponses.length > 0) {
          const avg =
            categoryResponses.reduce((sum, r) => sum + (r.scaleValue || 0), 0) /
            categoryResponses.length;
          categoryScores.push({
            category,
            averageScore: Math.round(avg * 20),
            responses: categoryResponses.length,
          });
        }
      });

      // Calcular médias por tipo de relacionamento
      const scoresByRelationship: {
        relationshipType: string;
        averageScore: number;
        count: number;
      }[] = [];
      const relationshipTypes = [...new Set(responses.map((r) => r.relationshipType))];

      relationshipTypes.forEach((type) => {
        const typeResponses = responses.filter(
          (r) => r.relationshipType === type && r.scaleValue !== null
        );
        if (typeResponses.length > 0) {
          const avg =
            typeResponses.reduce((sum, r) => sum + (r.scaleValue || 0), 0) /
            typeResponses.length;
          scoresByRelationship.push({
            relationshipType: type,
            averageScore: Math.round(avg * 20),
            count: typeResponses.length,
          });
        }
      });

      // Identificar pontos fortes e áreas de melhoria
      const sortedCategories = [...categoryScores].sort(
        (a, b) => b.averageScore - a.averageScore
      );
      const strengths = sortedCategories.slice(0, 3).map((c) => c.category);
      const improvementAreas = sortedCategories
        .slice(-3)
        .reverse()
        .map((c) => c.category);

      // Coletar comentários (anônimos)
      const comments = responses
        .filter((r) => r.textValue && r.textValue.trim() !== "")
        .map((r) => ({
          category: r.category,
          comment: r.textValue!,
          relationshipType: r.relationshipType,
        }));

      // Inserir ou atualizar relatório
      const [existingReport] = await db
        .select({ id: feedback360Reports.id })
        .from(feedback360Reports)
        .where(eq(feedback360Reports.participantId, input.participantId))
        .limit(1);

      if (existingReport) {
        await db
          .update(feedback360Reports)
          .set({
            totalEvaluators: evaluators.length,
            completedEvaluations: completedEvaluators.length,
            averageScore,
            categoryScores,
            scoresByRelationship,
            strengths,
            improvementAreas,
            comments,
            status: "completed",
            generatedBy: ctx.user.id,
          })
          .where(eq(feedback360Reports.id, existingReport.id));
      } else {
        await db.insert(feedback360Reports).values({
          participantId: input.participantId,
          totalEvaluators: evaluators.length,
          completedEvaluations: completedEvaluators.length,
          averageScore,
          categoryScores,
          scoresByRelationship,
          strengths,
          improvementAreas,
          comments,
          status: "completed",
          generatedBy: ctx.user.id,
        });
      }

      return {
        success: true,
        message: "Relatório gerado com sucesso",
        report: {
          averageScore,
          categoryScores,
          scoresByRelationship,
          strengths,
          improvementAreas,
          totalEvaluators: evaluators.length,
          completedEvaluations: completedEvaluators.length,
        },
      };
    }),

  /**
   * Obter relatório de um participante
   */
  getReport: protectedProcedure
    .input(z.object({ participantId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      // Verificar se o usuário tem permissão (é o participante ou admin)
      const [participant] = await db
        .select({ employeeId: feedback360Participants.employeeId })
        .from(feedback360Participants)
        .where(eq(feedback360Participants.id, input.participantId))
        .limit(1);

      if (!participant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Participante não encontrado",
        });
      }

      if (ctx.user.role !== "admin" && participant.employeeId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para visualizar este relatório",
        });
      }

      const [report] = await db
        .select()
        .from(feedback360Reports)
        .where(eq(feedback360Reports.participantId, input.participantId))
        .limit(1);

      if (!report) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Relatório não encontrado. Gere o relatório primeiro.",
        });
      }

      return report;
    }),
});
