/**
 * Router para Notificações de Resultados por Email
 * Envia emails automáticos após conclusão de avaliações
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { sendEmail } from "../emailService";
import { generateResultNotificationEmail, generateWeeklyProgressEmail } from "../emailTemplates/resultNotification";
import { getDb } from "../db";
import { users, pirAssessments, pirIntegrityAssessments, avdCompetencyAssessments, performanceEvaluations } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const resultNotificationsRouter = router({
  /**
   * Enviar notificação de resultado PIR
   */
  sendPIRResultNotification: protectedProcedure
    .input(z.object({
      assessmentId: z.number(),
      employeeId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar dados da avaliação
      const assessment = await db
        .select()
        .from(pirAssessments)
        .where(eq(pirAssessments.id, input.assessmentId))
        .limit(1);

      if (!assessment[0]) {
        throw new Error("Avaliação não encontrada");
      }

      // Buscar dados do colaborador
      const employee = await db
        .select()
        .from(users)
        .where(eq(users.id, input.employeeId))
        .limit(1);

      if (!employee[0] || !employee[0].email) {
        throw new Error("Colaborador não encontrado ou sem email cadastrado");
      }

      const resultUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL || 'http://localhost:3000'}/pir/relatorio/${assessment[0].id}`;

      const emailHtml = generateResultNotificationEmail({
        employeeName: employee[0].name || "Colaborador",
        assessmentType: "PIR - Perfil Individual de Referência",
        score: assessment[0].overallScore || 0,
        completedDate: new Date(assessment[0].completedAt || assessment[0].createdAt).toLocaleDateString('pt-BR'),
        resultUrl,
        highlights: [
          "Avaliação concluída com sucesso",
          `Pontuação geral: ${assessment[0].overallScore || 0}/100`,
        ],
        recommendations: [
          "Acesse o relatório completo para ver análises detalhadas",
          "Compare seus resultados com avaliações anteriores",
        ],
      });

      await sendEmail({
        to: employee[0].email,
        subject: `✅ Resultados da sua Avaliação PIR`,
        html: emailHtml,
      });

      return { success: true, message: "Email enviado com sucesso" };
    }),

  /**
   * Enviar notificação de resultado PIR Integridade
   */
  sendPIRIntegrityResultNotification: protectedProcedure
    .input(z.object({
      assessmentId: z.number(),
      employeeId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const assessment = await db
        .select()
        .from(pirIntegrityAssessments)
        .where(eq(pirIntegrityAssessments.id, input.assessmentId))
        .limit(1);

      if (!assessment[0]) {
        throw new Error("Avaliação não encontrada");
      }

      const employee = await db
        .select()
        .from(users)
        .where(eq(users.id, input.employeeId))
        .limit(1);

      if (!employee[0] || !employee[0].email) {
        throw new Error("Colaborador não encontrado ou sem email cadastrado");
      }

      const resultUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL || 'http://localhost:3000'}/pir-integridade/resultado/${assessment[0].id}`;

      const emailHtml = generateResultNotificationEmail({
        employeeName: employee[0].name || "Colaborador",
        assessmentType: "PIR Integridade",
        score: assessment[0].overallScore || 0,
        completedDate: new Date(assessment[0].completedAt || assessment[0].createdAt).toLocaleDateString('pt-BR'),
        resultUrl,
        highlights: [
          "Avaliação de integridade concluída",
          `Pontuação geral: ${assessment[0].overallScore || 0}/100`,
        ],
      });

      await sendEmail({
        to: employee[0].email,
        subject: `✅ Resultados da sua Avaliação PIR Integridade`,
        html: emailHtml,
      });

      return { success: true, message: "Email enviado com sucesso" };
    }),

  /**
   * Enviar notificação de resultado de Competências
   */
  sendCompetencyResultNotification: protectedProcedure
    .input(z.object({
      assessmentId: z.number(),
      employeeId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const assessment = await db
        .select()
        .from(avdCompetencyAssessments)
        .where(eq(avdCompetencyAssessments.id, input.assessmentId))
        .limit(1);

      if (!assessment[0]) {
        throw new Error("Avaliação não encontrada");
      }

      const employee = await db
        .select()
        .from(users)
        .where(eq(users.id, input.employeeId))
        .limit(1);

      if (!employee[0] || !employee[0].email) {
        throw new Error("Colaborador não encontrado ou sem email cadastrado");
      }

      const resultUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL || 'http://localhost:3000'}/avd/processo/passo3/${assessment[0].processId}`;

      const emailHtml = generateResultNotificationEmail({
        employeeName: employee[0].name || "Colaborador",
        assessmentType: "Avaliação de Competências",
        score: assessment[0].averageScore || 0,
        completedDate: new Date(assessment[0].createdAt).toLocaleDateString('pt-BR'),
        resultUrl,
        highlights: [
          "Avaliação de competências concluída",
          `Pontuação média: ${assessment[0].averageScore || 0}/5`,
        ],
      });

      await sendEmail({
        to: employee[0].email,
        subject: `✅ Resultados da sua Avaliação de Competências`,
        html: emailHtml,
      });

      return { success: true, message: "Email enviado com sucesso" };
    }),

  /**
   * Enviar notificação de resultado de Desempenho
   */
  sendPerformanceResultNotification: protectedProcedure
    .input(z.object({
      evaluationId: z.number(),
      employeeId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const evaluation = await db
        .select()
        .from(performanceEvaluations)
        .where(eq(performanceEvaluations.id, input.evaluationId))
        .limit(1);

      if (!evaluation[0]) {
        throw new Error("Avaliação não encontrada");
      }

      const employee = await db
        .select()
        .from(users)
        .where(eq(users.id, input.employeeId))
        .limit(1);

      if (!employee[0] || !employee[0].email) {
        throw new Error("Colaborador não encontrado ou sem email cadastrado");
      }

      const resultUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL || 'http://localhost:3000'}/avd/processo/passo4/${evaluation[0].processId}`;

      const emailHtml = generateResultNotificationEmail({
        employeeName: employee[0].name || "Colaborador",
        assessmentType: "Avaliação de Desempenho",
        score: evaluation[0].overallScore || 0,
        completedDate: new Date(evaluation[0].evaluationDate).toLocaleDateString('pt-BR'),
        resultUrl,
        highlights: [
          "Avaliação de desempenho concluída",
          `Pontuação geral: ${evaluation[0].overallScore || 0}/100`,
        ],
        recommendations: [
          "Revise seu Plano de Desenvolvimento Individual (PDI)",
          "Agende uma reunião de feedback com seu gestor",
        ],
      });

      await sendEmail({
        to: employee[0].email,
        subject: `✅ Resultados da sua Avaliação de Desempenho`,
        html: emailHtml,
      });

      return { success: true, message: "Email enviado com sucesso" };
    }),

  /**
   * Enviar relatório semanal de progresso
   */
  sendWeeklyProgressReport: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const employee = await db
        .select()
        .from(users)
        .where(eq(users.id, input.employeeId))
        .limit(1);

      if (!employee[0] || !employee[0].email) {
        throw new Error("Colaborador não encontrado ou sem email cadastrado");
      }

      // TODO: Calcular estatísticas reais da semana
      const weeklyStats = {
        completedAssessments: 3,
        averageScore: 85,
        improvement: 5,
      };

      const dashboardUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL || 'http://localhost:3000'}/historico-comparacao`;

      const emailHtml = generateWeeklyProgressEmail({
        employeeName: employee[0].name || "Colaborador",
        weeklyStats,
        dashboardUrl,
      });

      await sendEmail({
        to: employee[0].email,
        subject: `📊 Seu Relatório Semanal de Progresso`,
        html: emailHtml,
      });

      return { success: true, message: "Email enviado com sucesso" };
    }),
});
