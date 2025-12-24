import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createVideoAnalysis,
  updateVideoAnalysis,
  getEmployeeVideoAnalyses,
  getVideoAnalysisById,
  createVideoAnalysisSnapshot,
  getEmployeeAnalysisHistory,
  compareEmployeeAnalyses,
} from "../db";
import { TRPCError } from "@trpc/server";
import { sendEmail } from "../_core/email";

/**
 * Router para análise de vídeo PIR e comparação temporal
 */
export const videoAnalysisRouter = router({
  /**
   * Criar nova análise de vídeo
   */
  create: protectedProcedure
    .input(
      z.object({
        pirAssessmentId: z.number(),
        employeeId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await createVideoAnalysis({
          pirAssessmentId: input.pirAssessmentId,
          employeeId: input.employeeId,
          analysisStatus: "pendente",
          faceValidationStatus: "pendente",
          notificationSent: false,
          analyzedBy: ctx.user.id,
        });

        return {
          success: true,
          analysisId: result.insertId,
          message: "Análise criada com sucesso",
        };
      } catch (error) {
        console.error("[VideoAnalysis] Erro ao criar análise:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar análise",
        });
      }
    }),

  /**
   * Atualizar análise de vídeo com resultados
   */
  updateResults: protectedProcedure
    .input(
      z.object({
        analysisId: z.number(),
        faceValidationStatus: z
          .enum([
            "pendente",
            "validado",
            "falhou",
            "sem_perfil",
            "multiplas_faces",
            "face_nao_detectada",
          ])
          .optional(),
        faceMatchScore: z.number().optional(),
        eyeContactScore: z.number().optional(),
        confidenceScore: z.number().optional(),
        clarityScore: z.number().optional(),
        enthusiasmScore: z.number().optional(),
        transcription: z.string().optional(),
        keyPoints: z.string().optional(), // JSON
        sentimentAnalysis: z.string().optional(), // JSON
        competenciesDetected: z.string().optional(), // JSON
        strengthsIdentified: z.string().optional(), // JSON
        areasForImprovement: z.string().optional(), // JSON
        overallScore: z.number().optional(),
        aiConfidence: z.number().optional(),
        analysisStatus: z
          .enum(["pendente", "processando", "concluida", "erro", "cancelada"])
          .optional(),
        errorMessage: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { analysisId, ...updateData } = input;

        await updateVideoAnalysis(analysisId, {
          ...updateData,
          analyzedAt: new Date(),
        });

        // Se a análise foi concluída, criar snapshot para histórico
        if (input.analysisStatus === "concluida" && input.overallScore) {
          const analysis = await getVideoAnalysisById(analysisId);
          if (analysis) {
            await createVideoAnalysisSnapshot({
              employeeId: analysis.employeeId,
              analysisId: analysisId,
              snapshotDate: new Date(),
              overallScore: input.overallScore,
              eyeContactScore: input.eyeContactScore || null,
              confidenceScore: input.confidenceScore || null,
              clarityScore: input.clarityScore || null,
              enthusiasmScore: input.enthusiasmScore || null,
              competenciesSnapshot: input.competenciesDetected || null,
            });
          }
        }

        return {
          success: true,
          message: "Análise atualizada com sucesso",
        };
      } catch (error) {
        console.error("[VideoAnalysis] Erro ao atualizar análise:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao atualizar análise",
        });
      }
    }),

  /**
   * Enviar notificações quando análise for concluída
   */
  sendCompletionNotifications: protectedProcedure
    .input(
      z.object({
        analysisId: z.number(),
        employeeId: z.number(),
        employeeName: z.string(),
        managerEmail: z.string().optional(),
        hrEmails: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const analysis = await getVideoAnalysisById(input.analysisId);

        if (!analysis) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Análise não encontrada",
          });
        }

        const recipients: string[] = [];
        if (input.managerEmail) recipients.push(input.managerEmail);
        if (input.hrEmails) recipients.push(...input.hrEmails);

        // Enviar email para cada destinatário
        const emailPromises = recipients.map((email) =>
          sendEmail({
            to: email,
            subject: `Análise de Vídeo PIR Concluída - ${input.employeeName}`,
            html: `
              <h2>Análise de Vídeo PIR Concluída</h2>
              <p>A análise de vídeo PIR do funcionário <strong>${input.employeeName}</strong> foi concluída.</p>
              
              <h3>Resumo da Análise:</h3>
              <ul>
                <li><strong>Pontuação Geral:</strong> ${analysis.overallScore || "N/A"}/100</li>
                <li><strong>Contato Visual:</strong> ${analysis.eyeContactScore || "N/A"}/100</li>
                <li><strong>Confiança:</strong> ${analysis.confidenceScore || "N/A"}/100</li>
                <li><strong>Clareza:</strong> ${analysis.clarityScore || "N/A"}/100</li>
                <li><strong>Entusiasmo:</strong> ${analysis.enthusiasmScore || "N/A"}/100</li>
              </ul>
              
              <p><strong>Status de Validação Facial:</strong> ${analysis.faceValidationStatus}</p>
              ${
                analysis.faceMatchScore
                  ? `<p><strong>Score de Correspondência Facial:</strong> ${analysis.faceMatchScore}%</p>`
                  : ""
              }
              
              <p>Acesse o sistema para visualizar o relatório completo.</p>
            `,
          })
        );

        await Promise.all(emailPromises);

        // Marcar notificação como enviada
        await updateVideoAnalysis(input.analysisId, {
          notificationSent: true,
          notificationSentAt: new Date(),
          notifiedUsers: JSON.stringify(recipients),
        });

        return {
          success: true,
          message: `Notificações enviadas para ${recipients.length} destinatário(s)`,
        };
      } catch (error) {
        console.error("[VideoAnalysis] Erro ao enviar notificações:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao enviar notificações",
        });
      }
    }),

  /**
   * Listar análises de um funcionário
   */
  listByEmployee: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const analyses = await getEmployeeVideoAnalyses(input.employeeId);
        return analyses;
      } catch (error) {
        console.error("[VideoAnalysis] Erro ao listar análises:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao listar análises",
        });
      }
    }),

  /**
   * Buscar análise por ID
   */
  getById: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const analysis = await getVideoAnalysisById(input.id);
        return analysis;
      } catch (error) {
        console.error("[VideoAnalysis] Erro ao buscar análise:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar análise",
        });
      }
    }),

  /**
   * Buscar histórico de análises para comparação temporal
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      try {
        const history = await getEmployeeAnalysisHistory(
          input.employeeId,
          input.limit
        );
        return history;
      } catch (error) {
        console.error("[VideoAnalysis] Erro ao buscar histórico:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar histórico",
        });
      }
    }),

  /**
   * Comparar análises em um período específico
   */
  compareByPeriod: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        startDate: z.string(), // ISO date
        endDate: z.string(), // ISO date
      })
    )
    .query(async ({ input }) => {
      try {
        const startDate = new Date(input.startDate);
        const endDate = new Date(input.endDate);

        const analyses = await compareEmployeeAnalyses(
          input.employeeId,
          startDate,
          endDate
        );

        // Calcular estatísticas de evolução
        if (analyses.length < 2) {
          return {
            analyses,
            evolution: null,
            message: "Dados insuficientes para comparação",
          };
        }

        const first = analyses[0];
        const last = analyses[analyses.length - 1];

        const evolution = {
          overallScore: {
            initial: first.overallScore,
            final: last.overallScore,
            change: last.overallScore && first.overallScore
              ? last.overallScore - first.overallScore
              : null,
            percentChange: last.overallScore && first.overallScore
              ? ((last.overallScore - first.overallScore) / first.overallScore) * 100
              : null,
          },
          eyeContactScore: {
            initial: first.eyeContactScore,
            final: last.eyeContactScore,
            change: last.eyeContactScore && first.eyeContactScore
              ? last.eyeContactScore - first.eyeContactScore
              : null,
          },
          confidenceScore: {
            initial: first.confidenceScore,
            final: last.confidenceScore,
            change: last.confidenceScore && first.confidenceScore
              ? last.confidenceScore - first.confidenceScore
              : null,
          },
          clarityScore: {
            initial: first.clarityScore,
            final: last.clarityScore,
            change: last.clarityScore && first.clarityScore
              ? last.clarityScore - first.clarityScore
              : null,
          },
          enthusiasmScore: {
            initial: first.enthusiasmScore,
            final: last.enthusiasmScore,
            change: last.enthusiasmScore && first.enthusiasmScore
              ? last.enthusiasmScore - first.enthusiasmScore
              : null,
          },
        };

        return {
          analyses,
          evolution,
          totalAnalyses: analyses.length,
          periodDays: Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
          ),
        };
      } catch (error) {
        console.error("[VideoAnalysis] Erro ao comparar análises:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao comparar análises",
        });
      }
    }),

  /**
   * Obter insights de evolução (últimos 3, 6, 12 meses)
   */
  getEvolutionInsights: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        period: z.enum(["3months", "6months", "12months"]),
      })
    )
    .query(async ({ input }) => {
      try {
        const now = new Date();
        const monthsAgo = input.period === "3months" ? 3 : input.period === "6months" ? 6 : 12;
        const startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - monthsAgo);

        const analyses = await compareEmployeeAnalyses(
          input.employeeId,
          startDate,
          now
        );

        if (analyses.length === 0) {
          return {
            hasData: false,
            message: "Nenhuma análise encontrada no período",
          };
        }

        // Calcular médias e tendências
        const avgOverallScore =
          analyses.reduce((sum, a) => sum + (a.overallScore || 0), 0) /
          analyses.length;
        const avgEyeContact =
          analyses.reduce((sum, a) => sum + (a.eyeContactScore || 0), 0) /
          analyses.length;
        const avgConfidence =
          analyses.reduce((sum, a) => sum + (a.confidenceScore || 0), 0) /
          analyses.length;

        // Determinar tendência
        const first = analyses[0];
        const last = analyses[analyses.length - 1];
        const trend =
          last.overallScore && first.overallScore
            ? last.overallScore > first.overallScore
              ? "melhorando"
              : last.overallScore < first.overallScore
              ? "declinando"
              : "estável"
            : "indefinido";

        return {
          hasData: true,
          period: input.period,
          totalAnalyses: analyses.length,
          averages: {
            overallScore: Math.round(avgOverallScore),
            eyeContactScore: Math.round(avgEyeContact),
            confidenceScore: Math.round(avgConfidence),
          },
          trend,
          firstAnalysis: first,
          lastAnalysis: last,
          analyses,
        };
      } catch (error) {
        console.error("[VideoAnalysis] Erro ao buscar insights:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar insights de evolução",
        });
      }
    }),
});
