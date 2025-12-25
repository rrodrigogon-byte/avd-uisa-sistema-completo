import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { 
  evaluationProcesses, 
  processParticipants, 
  processEvaluators,
  employees,
  users
} from "../../drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";
import { sendEmail } from "../_core/email";
import {
  emailProcessoIniciado,
  emailAvaliadorDesignado,
  emailLembreteAvaliacao,
  emailAvaliacoesConcluidas,
  emailResumoResultados,
} from "../_core/emailTemplates";
import { ENV } from "../_core/env";

/**
 * Router para Notificações por Email
 * Gerencia envio de emails automáticos do sistema de avaliação
 */
export const emailNotificationsRouter = router({
  /**
   * Enviar notificação de processo iniciado para todos os participantes
   */
  notifyProcessStarted: protectedProcedure
    .input(
      z.object({
        processId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar processo
      const process = await db
        .select()
        .from(evaluationProcesses)
        .where(eq(evaluationProcesses.id, input.processId))
        .limit(1);

      if (!process[0]) {
        throw new Error("Processo não encontrado");
      }

      // Buscar participantes
      const participants = await db
        .select({
          participantId: processParticipants.id,
          employeeId: processParticipants.employeeId,
          employeeName: employees.name,
          employeeEmail: employees.email,
        })
        .from(processParticipants)
        .innerJoin(employees, eq(processParticipants.employeeId, employees.id))
        .where(eq(processParticipants.processId, input.processId));

      // Enviar email para cada participante
      const results = await Promise.allSettled(
        participants.map(async (participant) => {
          if (!participant.employeeEmail) {
            return { success: false, reason: "Email não cadastrado" };
          }

          const emailData = emailProcessoIniciado({
            employeeName: participant.employeeName,
            processName: process[0].name,
            startDate: new Date(process[0].startDate).toLocaleDateString("pt-BR"),
            endDate: new Date(process[0].endDate).toLocaleDateString("pt-BR"),
            loginUrl: `${ENV.viteOAuthPortalUrl || "https://app.manus.im"}/processos-avaliativos/${input.processId}`,
          });

          await sendEmail({
            to: participant.employeeEmail,
            subject: emailData.subject,
            html: emailData.html,
          });

          return { success: true };
        })
      );

      const successCount = results.filter((r) => r.status === "fulfilled").length;
      const failureCount = results.filter((r) => r.status === "rejected").length;

      return {
        success: true,
        totalParticipants: participants.length,
        emailsSent: successCount,
        emailsFailed: failureCount,
      };
    }),

  /**
   * Enviar notificação quando avaliador é designado
   */
  notifyEvaluatorAssigned: protectedProcedure
    .input(
      z.object({
        evaluatorId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar avaliador com informações do processo e avaliado
      const evaluator = await db
        .select({
          evaluatorId: processEvaluators.id,
          evaluatorEmployeeId: processEvaluators.evaluatorEmployeeId,
          evaluatorName: employees.name,
          evaluatorEmail: employees.email,
          participantId: processEvaluators.participantId,
          processId: evaluationProcesses.id,
          processName: evaluationProcesses.name,
          endDate: evaluationProcesses.endDate,
        })
        .from(processEvaluators)
        .innerJoin(employees, eq(processEvaluators.evaluatorEmployeeId, employees.id))
        .innerJoin(processParticipants, eq(processEvaluators.participantId, processParticipants.id))
        .innerJoin(evaluationProcesses, eq(processParticipants.processId, evaluationProcesses.id))
        .where(eq(processEvaluators.id, input.evaluatorId))
        .limit(1);

      if (!evaluator[0]) {
        throw new Error("Avaliador não encontrado");
      }

      // Buscar nome do avaliado
      const participant = await db
        .select({
          employeeName: employees.name,
        })
        .from(processParticipants)
        .innerJoin(employees, eq(processParticipants.employeeId, employees.id))
        .where(eq(processParticipants.id, evaluator[0].participantId))
        .limit(1);

      if (!evaluator[0].evaluatorEmail) {
        throw new Error("Email do avaliador não cadastrado");
      }

      const emailData = emailAvaliadorDesignado({
        evaluatorName: evaluator[0].evaluatorName,
        evaluatedName: participant[0]?.employeeName || "Colaborador",
        processName: evaluator[0].processName,
        dueDate: new Date(evaluator[0].endDate).toLocaleDateString("pt-BR"),
        loginUrl: `${ENV.viteOAuthPortalUrl || "https://app.manus.im"}/processos-avaliativos/${evaluator[0].processId}`,
      });

      await sendEmail({
        to: evaluator[0].evaluatorEmail,
        subject: emailData.subject,
        html: emailData.html,
      });

      return { success: true };
    }),

  /**
   * Enviar lembretes para avaliações pendentes
   */
  sendPendingEvaluationReminders: protectedProcedure
    .input(
      z.object({
        processId: z.number(),
        daysBeforeDue: z.number().default(3),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar processo
      const process = await db
        .select()
        .from(evaluationProcesses)
        .where(eq(evaluationProcesses.id, input.processId))
        .limit(1);

      if (!process[0]) {
        throw new Error("Processo não encontrado");
      }

      // Calcular dias restantes
      const endDate = new Date(process[0].endDate);
      const today = new Date();
      const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Buscar avaliadores com avaliações pendentes
      const pendingEvaluators = await db
        .select({
          evaluatorId: processEvaluators.id,
          evaluatorName: employees.name,
          evaluatorEmail: employees.email,
          evaluatedName: employees.name,
          processName: evaluationProcesses.name,
        })
        .from(processEvaluators)
        .innerJoin(employees, eq(processEvaluators.evaluatorEmployeeId, employees.id))
        .innerJoin(processParticipants, eq(processEvaluators.participantId, processParticipants.id))
        .innerJoin(evaluationProcesses, eq(processParticipants.processId, evaluationProcesses.id))
        .where(
          and(
            eq(processEvaluators.processId, input.processId),
            eq(processEvaluators.status, "pendente")
          )
        );

      // Enviar lembretes
      const results = await Promise.allSettled(
        pendingEvaluators.map(async (evaluator) => {
          if (!evaluator.evaluatorEmail) {
            return { success: false, reason: "Email não cadastrado" };
          }

          const emailData = emailLembreteAvaliacao({
            evaluatorName: evaluator.evaluatorName,
            evaluatedName: evaluator.evaluatedName,
            processName: evaluator.processName,
            daysRemaining,
            dueDate: endDate.toLocaleDateString("pt-BR"),
            loginUrl: `${ENV.viteOAuthPortalUrl || "https://app.manus.im"}/processos-avaliativos/${input.processId}`,
          });

          await sendEmail({
            to: evaluator.evaluatorEmail,
            subject: emailData.subject,
            html: emailData.html,
          });

          return { success: true };
        })
      );

      const successCount = results.filter((r) => r.status === "fulfilled").length;
      const failureCount = results.filter((r) => r.status === "rejected").length;

      return {
        success: true,
        totalReminders: pendingEvaluators.length,
        remindersSent: successCount,
        remindersFailed: failureCount,
        daysRemaining,
      };
    }),

  /**
   * Notificar quando todas as avaliações são concluídas
   */
  notifyEvaluationsCompleted: protectedProcedure
    .input(
      z.object({
        participantId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar participante com informações do processo
      const participant = await db
        .select({
          participantId: processParticipants.id,
          employeeName: employees.name,
          employeeEmail: employees.email,
          processId: evaluationProcesses.id,
          processName: evaluationProcesses.name,
        })
        .from(processParticipants)
        .innerJoin(employees, eq(processParticipants.employeeId, employees.id))
        .innerJoin(evaluationProcesses, eq(processParticipants.processId, evaluationProcesses.id))
        .where(eq(processParticipants.id, input.participantId))
        .limit(1);

      if (!participant[0]) {
        throw new Error("Participante não encontrado");
      }

      // Contar total de avaliações
      const evaluations = await db
        .select()
        .from(processEvaluators)
        .where(eq(processEvaluators.participantId, input.participantId));

      if (!participant[0].employeeEmail) {
        throw new Error("Email do participante não cadastrado");
      }

      const emailData = emailAvaliacoesConcluidas({
        employeeName: participant[0].employeeName,
        processName: participant[0].processName,
        totalEvaluations: evaluations.length,
        loginUrl: `${ENV.viteOAuthPortalUrl || "https://app.manus.im"}/processos-avaliativos/${participant[0].processId}`,
      });

      await sendEmail({
        to: participant[0].employeeEmail,
        subject: emailData.subject,
        html: emailData.html,
      });

      return { success: true };
    }),

  /**
   * Enviar resumo de resultados
   */
  sendResultsSummary: protectedProcedure
    .input(
      z.object({
        participantId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar participante com pontuações
      const participant = await db
        .select({
          participantId: processParticipants.id,
          employeeName: employees.name,
          employeeEmail: employees.email,
          processId: evaluationProcesses.id,
          processName: evaluationProcesses.name,
          selfScore: processParticipants.selfScore,
          managerScore: processParticipants.managerScore,
          peerAverageScore: processParticipants.peerAverageScore,
          finalScore: processParticipants.finalScore,
        })
        .from(processParticipants)
        .innerJoin(employees, eq(processParticipants.employeeId, employees.id))
        .innerJoin(evaluationProcesses, eq(processParticipants.processId, evaluationProcesses.id))
        .where(eq(processParticipants.id, input.participantId))
        .limit(1);

      if (!participant[0]) {
        throw new Error("Participante não encontrado");
      }

      if (!participant[0].finalScore) {
        throw new Error("Resultados ainda não foram calculados");
      }

      if (!participant[0].employeeEmail) {
        throw new Error("Email do participante não cadastrado");
      }

      const emailData = emailResumoResultados({
        employeeName: participant[0].employeeName,
        processName: participant[0].processName,
        finalScore: participant[0].finalScore,
        selfScore: participant[0].selfScore || undefined,
        managerScore: participant[0].managerScore || undefined,
        peerScore: participant[0].peerAverageScore || undefined,
        resultsUrl: `${ENV.viteOAuthPortalUrl || "https://app.manus.im"}/resultados/${participant[0].participantId}`,
      });

      await sendEmail({
        to: participant[0].employeeEmail,
        subject: emailData.subject,
        html: emailData.html,
      });

      return { success: true };
    }),
});
