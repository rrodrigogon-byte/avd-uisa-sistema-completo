import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createEvaluationProcess,
  getAllEvaluationProcesses,
  getEvaluationProcessById,
  updateEvaluationProcess,
  deleteEvaluationProcess,
  addProcessParticipant,
  getProcessParticipants,
  addProcessEvaluator,
  getProcessEvaluators,
} from "../db";

/**
 * Router para Processos Avaliativos - Onda 1
 */
export const evaluationProcessesRouter = router({
  /**
   * Listar todos os processos avaliativos
   */
  list: protectedProcedure.input(z.object({})).query(async () => {
    return await getAllEvaluationProcesses();
  }),

  /**
   * Buscar processo por ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await getEvaluationProcessById(input.id);
    }),

  /**
   * Criar novo processo avaliativo
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        description: z.string().optional(),
        type: z.enum(["360", "180", "90", "autoavaliacao", "gestor", "pares", "subordinados"]),
        startDate: z.string(),
        endDate: z.string(),
        allowSelfEvaluation: z.boolean().default(true),
        allowManagerEvaluation: z.boolean().default(true),
        allowPeerEvaluation: z.boolean().default(false),
        allowSubordinateEvaluation: z.boolean().default(false),
        minPeerEvaluators: z.number().default(0),
        maxPeerEvaluators: z.number().default(5),
        minSubordinateEvaluators: z.number().default(0),
        maxSubordinateEvaluators: z.number().default(5),
        selfWeight: z.number().default(20),
        managerWeight: z.number().default(50),
        peerWeight: z.number().default(15),
        subordinateWeight: z.number().default(15),
        formTemplateId: z.number().optional(),
        sendStartNotification: z.boolean().default(true),
        sendReminderNotification: z.boolean().default(true),
        reminderDaysBefore: z.number().default(3),
        sendCompletionNotification: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await createEvaluationProcess({
        ...input,
        createdBy: ctx.user.id,
      });
    }),

  /**
   * Atualizar processo avaliativo
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["rascunho", "em_andamento", "concluido", "cancelado"]).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        allowSelfEvaluation: z.boolean().optional(),
        allowManagerEvaluation: z.boolean().optional(),
        allowPeerEvaluation: z.boolean().optional(),
        allowSubordinateEvaluation: z.boolean().optional(),
        minPeerEvaluators: z.number().optional(),
        maxPeerEvaluators: z.number().optional(),
        minSubordinateEvaluators: z.number().optional(),
        maxSubordinateEvaluators: z.number().optional(),
        selfWeight: z.number().optional(),
        managerWeight: z.number().optional(),
        peerWeight: z.number().optional(),
        subordinateWeight: z.number().optional(),
        formTemplateId: z.number().optional(),
        sendStartNotification: z.boolean().optional(),
        sendReminderNotification: z.boolean().optional(),
        reminderDaysBefore: z.number().optional(),
        sendCompletionNotification: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await updateEvaluationProcess(id, data);
    }),

  /**
   * Deletar processo avaliativo
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await deleteEvaluationProcess(input.id);
    }),

  /**
   * Duplicar processo avaliativo
   */
  duplicate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const original = await getEvaluationProcessById(input.id);
      if (!original) {
        throw new Error("Processo não encontrado");
      }

      const { id, createdAt, updatedAt, completedAt, ...data } = original;
      return await createEvaluationProcess({
        ...data,
        name: `${data.name} (Cópia)`,
        status: "rascunho",
        createdBy: ctx.user.id,
      });
    }),

  /**
   * Adicionar participantes ao processo
   */
  addParticipants: protectedProcedure
    .input(
      z.object({
        processId: z.number(),
        employeeIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      const results = [];
      for (const employeeId of input.employeeIds) {
        const result = await addProcessParticipant({
          processId: input.processId,
          employeeId,
          status: "pendente",
        });
        results.push(result);
      }
      return { success: true, count: results.length };
    }),

  /**
   * Listar participantes de um processo
   */
  getParticipants: protectedProcedure
    .input(z.object({ processId: z.number() }))
    .query(async ({ input }) => {
      return await getProcessParticipants(input.processId);
    }),

  /**
   * Adicionar avaliadores a um participante
   */
  addEvaluators: protectedProcedure
    .input(
      z.object({
        participantId: z.number(),
        evaluators: z.array(
          z.object({
            evaluatorId: z.number(),
            evaluatorType: z.enum(["self", "manager", "peer", "subordinate"]),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const results = [];
      for (const evaluator of input.evaluators) {
        const result = await addProcessEvaluator({
          participantId: input.participantId,
          evaluatorId: evaluator.evaluatorId,
          evaluatorType: evaluator.evaluatorType,
          status: "pendente",
        });
        results.push(result);
      }
      return { success: true, count: results.length };
    }),

  /**
   * Listar avaliadores de um participante
   */
  getEvaluators: protectedProcedure
    .input(z.object({ participantId: z.number() }))
    .query(async ({ input }) => {
      return await getProcessEvaluators(input.participantId);
    }),

  /**
   * Iniciar processo (mudar status para em_andamento)
   */
  start: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await updateEvaluationProcess(input.id, {
        status: "em_andamento",
      });
    }),

  /**
   * Concluir processo
   */
  complete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await updateEvaluationProcess(input.id, {
        status: "concluido",
        completedAt: new Date(),
      });
    }),

  /**
   * Cancelar processo
   */
  cancel: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await updateEvaluationProcess(input.id, {
        status: "cancelado",
      });
    }),
});
