import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createConsolidatedReport,
  getConsolidatedReports,
  createReportExport,
  getProcessParticipants,
  getEvaluationProcessById,
} from "../db";

/**
 * Router para Relat\u00f3rios Consolidados - Onda 3
 */
export const consolidatedReportsRouter = router({
  /**
   * Listar relat\u00f3rios consolidados
   */
  list: protectedProcedure
    .input(
      z.object({
        processId: z.number().optional(),
        reportType: z
          .enum([
            "individual",
            "equipe",
            "departamento",
            "empresa",
            "comparativo",
            "evolucao",
            "gaps",
            "nine_box",
            "sucessao",
          ])
          .optional(),
      })
    )
    .query(async ({ input }) => {
      return await getConsolidatedReports(input);
    }),

  /**
   * Gerar relat\u00f3rio individual
   */
  generateIndividual: protectedProcedure
    .input(
      z.object({
        processId: z.number(),
        employeeId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Buscar dados do processo e participante
      const process = await getEvaluationProcessById(input.processId);
      if (!process) {
        throw new Error("Processo n\u00e3o encontrado");
      }

      const participants = await getProcessParticipants(input.processId);
      const participant = participants.find((p) => p.employeeId === input.employeeId);
      if (!participant) {
        throw new Error("Participante n\u00e3o encontrado");
      }

      // Calcular estat\u00edsticas
      const reportData = {
        employee: {
          id: input.employeeId,
        },
        scores: {
          self: participant.selfScore,
          manager: participant.managerScore,
          peer: participant.peerAverageScore,
          subordinate: participant.subordinateAverageScore,
          final: participant.finalScore,
        },
        progress: {
          selfCompleted: participant.selfEvaluationCompleted,
          managerCompleted: participant.managerEvaluationCompleted,
          peerCompleted: participant.peerEvaluationsCompleted,
          subordinateCompleted: participant.subordinateEvaluationsCompleted,
        },
      };

      // Salvar relat\u00f3rio
      return await createConsolidatedReport({
        processId: input.processId,
        reportType: "individual",
        filters: JSON.stringify({ employeeId: input.employeeId }),
        data: JSON.stringify(reportData),
        generatedBy: ctx.user.id,
      });
    }),

  /**
   * Gerar relat\u00f3rio de equipe
   */
  generateTeam: protectedProcedure
    .input(
      z.object({
        processId: z.number(),
        departmentId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const participants = await getProcessParticipants(input.processId);

      // Calcular estat\u00edsticas da equipe
      const totalParticipants = participants.length;
      const completedCount = participants.filter((p) => p.status === "concluido").length;
      const averageFinalScore =
        participants.reduce((sum, p) => sum + (p.finalScore || 0), 0) / totalParticipants;

      const reportData = {
        totalParticipants,
        completedCount,
        completionRate: (completedCount / totalParticipants) * 100,
        averageFinalScore,
        participants: participants.map((p) => ({
          employeeId: p.employeeId,
          status: p.status,
          finalScore: p.finalScore,
        })),
      };

      return await createConsolidatedReport({
        processId: input.processId,
        reportType: "equipe",
        filters: JSON.stringify({ departmentId: input.departmentId }),
        data: JSON.stringify(reportData),
        generatedBy: ctx.user.id,
      });
    }),

  /**
   * Gerar relat\u00f3rio comparativo
   */
  generateComparative: protectedProcedure
    .input(
      z.object({
        processIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const processesData = await Promise.all(
        input.processIds.map(async (processId) => {
          const process = await getEvaluationProcessById(processId);
          const participants = await getProcessParticipants(processId);

          const completedCount = participants.filter((p) => p.status === "concluido").length;
          const averageFinalScore =
            participants.reduce((sum, p) => sum + (p.finalScore || 0), 0) / participants.length;

          return {
            processId,
            processName: process?.name,
            totalParticipants: participants.length,
            completedCount,
            completionRate: (completedCount / participants.length) * 100,
            averageFinalScore,
          };
        })
      );

      const reportData = {
        processes: processesData,
        comparison: {
          bestProcess: processesData.reduce((best, current) =>
            current.averageFinalScore > best.averageFinalScore ? current : best
          ),
          worstProcess: processesData.reduce((worst, current) =>
            current.averageFinalScore < worst.averageFinalScore ? current : worst
          ),
        },
      };

      return await createConsolidatedReport({
        processId: null,
        reportType: "comparativo",
        filters: JSON.stringify({ processIds: input.processIds }),
        data: JSON.stringify(reportData),
        generatedBy: ctx.user.id,
      });
    }),

  /**
   * Gerar relat\u00f3rio de gaps de compet\u00eancias
   */
  generateGaps: protectedProcedure
    .input(
      z.object({
        processId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const participants = await getProcessParticipants(input.processId);

      // Identificar gaps (diferen\u00e7a entre autoavalia\u00e7\u00e3o e avalia\u00e7\u00e3o do gestor)
      const gaps = participants.map((p) => {
        const gap = (p.selfScore || 0) - (p.managerScore || 0);
        return {
          employeeId: p.employeeId,
          selfScore: p.selfScore,
          managerScore: p.managerScore,
          gap,
          gapType: gap > 0 ? "superestimado" : gap < 0 ? "subestimado" : "alinhado",
        };
      });

      const reportData = {
        totalGaps: gaps.length,
        averageGap: gaps.reduce((sum, g) => sum + Math.abs(g.gap), 0) / gaps.length,
        superestimados: gaps.filter((g) => g.gapType === "superestimado").length,
        subestimados: gaps.filter((g) => g.gapType === "subestimado").length,
        alinhados: gaps.filter((g) => g.gapType === "alinhado").length,
        gaps,
      };

      return await createConsolidatedReport({
        processId: input.processId,
        reportType: "gaps",
        filters: JSON.stringify({}),
        data: JSON.stringify(reportData),
        generatedBy: ctx.user.id,
      });
    }),

  /**
   * Exportar relat\u00f3rio
   */
  export: protectedProcedure
    .input(
      z.object({
        reportId: z.number().optional(),
        processId: z.number().optional(),
        exportType: z.enum(["pdf", "excel", "csv", "json"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Criar registro de exporta\u00e7\u00e3o
      return await createReportExport({
        reportId: input.reportId,
        processId: input.processId,
        exportType: input.exportType,
        status: "processando",
        exportedBy: ctx.user.id,
      });
    }),

  /**
   * Dashboard de estat\u00edsticas gerais
   */
  dashboard: protectedProcedure
    .input(
      z.object({
        processId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const process = await getEvaluationProcessById(input.processId);
      const participants = await getProcessParticipants(input.processId);

      const totalParticipants = participants.length;
      const completedCount = participants.filter((p) => p.status === "concluido").length;
      const inProgressCount = participants.filter((p) => p.status === "em_andamento").length;
      const pendingCount = participants.filter((p) => p.status === "pendente").length;

      const averageFinalScore =
        participants
          .filter((p) => p.finalScore !== null)
          .reduce((sum, p) => sum + (p.finalScore || 0), 0) /
        (participants.filter((p) => p.finalScore !== null).length || 1);

      return {
        process: {
          id: process?.id,
          name: process?.name,
          type: process?.type,
          status: process?.status,
          startDate: process?.startDate,
          endDate: process?.endDate,
        },
        statistics: {
          totalParticipants,
          completedCount,
          inProgressCount,
          pendingCount,
          completionRate: (completedCount / totalParticipants) * 100,
          averageFinalScore,
        },
        distribution: {
          excellent: participants.filter((p) => (p.finalScore || 0) >= 90).length,
          good: participants.filter((p) => (p.finalScore || 0) >= 70 && (p.finalScore || 0) < 90)
            .length,
          average: participants.filter((p) => (p.finalScore || 0) >= 50 && (p.finalScore || 0) < 70)
            .length,
          poor: participants.filter((p) => (p.finalScore || 0) < 50).length,
        },
      };
    }),
});
