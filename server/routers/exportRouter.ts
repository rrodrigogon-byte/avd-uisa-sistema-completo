import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  generatePerformanceReportPDF,
  generateCompetenciesReportPDF,
  generatePDIReportPDF,
} from "../utils/pdfGenerator";

export const exportRouter = router({
  /**
   * Gera PDF de relatório de desempenho
   */
  generatePerformancePDF: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        period: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Aqui você buscaria os dados reais do banco de dados
        // Por enquanto, vamos usar dados de exemplo
        const pdfBuffer = await generatePerformanceReportPDF({
          employeeName: "João Silva",
          employeePosition: "Analista de Sistemas",
          period: input.period || "2024",
          overallScore: 85.5,
          competencies: [
            { name: "Comunicação", score: 90, description: "Excelente" },
            { name: "Trabalho em Equipe", score: 85, description: "Muito Bom" },
            { name: "Liderança", score: 80, description: "Bom" },
          ],
          goals: [
            { name: "Concluir projeto X", progress: 100, status: "Concluído" },
            { name: "Desenvolver habilidade Y", progress: 75, status: "Em andamento" },
          ],
          feedback: "Funcionário demonstra excelente desempenho e comprometimento com as metas estabelecidas.",
        });

        // Converter buffer para base64 para enviar ao frontend
        const pdfBase64 = pdfBuffer.toString("base64");

        return {
          success: true,
          pdf: pdfBase64,
          filename: `relatorio_desempenho_${input.employeeId}_${Date.now()}.pdf`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao gerar PDF: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        });
      }
    }),

  /**
   * Gera PDF de relatório de competências
   */
  generateCompetenciesPDF: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const pdfBuffer = await generateCompetenciesReportPDF({
          employeeName: "Maria Santos",
          employeePosition: "Gerente de Projetos",
          department: "TI",
          competencies: [
            {
              name: "Gestão de Projetos",
              category: "Técnica",
              selfAssessment: 85,
              managerAssessment: 90,
              gap: 5,
            },
            {
              name: "Comunicação",
              category: "Comportamental",
              selfAssessment: 80,
              managerAssessment: 85,
              gap: 5,
            },
            {
              name: "Liderança",
              category: "Comportamental",
              selfAssessment: 75,
              managerAssessment: 80,
              gap: 5,
            },
          ],
        });

        const pdfBase64 = pdfBuffer.toString("base64");

        return {
          success: true,
          pdf: pdfBase64,
          filename: `relatorio_competencias_${input.employeeId}_${Date.now()}.pdf`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao gerar PDF: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        });
      }
    }),

  /**
   * Gera PDF de PDI (Plano de Desenvolvimento Individual)
   */
  generatePDIPDF: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        period: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const pdfBuffer = await generatePDIReportPDF({
          employeeName: "Carlos Oliveira",
          employeePosition: "Desenvolvedor Sênior",
          period: input.period || "2024-2025",
          objectives: [
            {
              title: "Desenvolver habilidades de liderança",
              description: "Participar de treinamentos e assumir papel de mentor",
              deadline: "31/12/2024",
              status: "Em andamento",
            },
            {
              title: "Certificação em Cloud Computing",
              description: "Obter certificação AWS Solutions Architect",
              deadline: "30/06/2025",
              status: "Planejado",
            },
          ],
          developmentActions: [
            {
              action: "Curso de Liderança",
              responsible: "RH",
              deadline: "30/09/2024",
            },
            {
              action: "Mentoria de 2 desenvolvedores júnior",
              responsible: "Gestor Direto",
              deadline: "31/12/2024",
            },
          ],
          resources: "Orçamento para cursos e certificações: R$ 5.000,00",
        });

        const pdfBase64 = pdfBuffer.toString("base64");

        return {
          success: true,
          pdf: pdfBase64,
          filename: `pdi_${input.employeeId}_${Date.now()}.pdf`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao gerar PDF: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        });
      }
    }),

  /**
   * Exporta dados de funcionários em CSV
   */
  exportEmployeesCSV: protectedProcedure
    .input(
      z.object({
        departmentId: z.number().optional(),
        status: z.string().optional(),
      })
    .optional())
    .mutation(async ({ input, ctx }) => {
      try {
        // Aqui você buscaria os dados reais do banco de dados
        // Por enquanto, vamos usar dados de exemplo
        const csvData = [
          ["ID", "Nome", "Cargo", "Departamento", "Status", "Data Admissão"],
          ["1", "João Silva", "Analista", "TI", "Ativo", "01/01/2020"],
          ["2", "Maria Santos", "Gerente", "RH", "Ativo", "15/03/2019"],
          ["3", "Carlos Oliveira", "Desenvolvedor", "TI", "Ativo", "10/06/2021"],
        ];

        const csv = csvData.map((row) => row.join(",")).join("\n");

        return {
          success: true,
          csv,
          filename: `funcionarios_${Date.now()}.csv`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao exportar CSV: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        });
      }
    }),

  /**
   * Exporta dados de avaliações em CSV
   */
  exportEvaluationsCSV: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    .optional())
    .mutation(async ({ input, ctx }) => {
      try {
        const csvData = [
          ["ID", "Funcionário", "Avaliador", "Tipo", "Pontuação", "Data"],
          ["1", "João Silva", "Maria Santos", "Desempenho", "85", "15/11/2024"],
          ["2", "Carlos Oliveira", "Pedro Costa", "Competências", "90", "20/11/2024"],
        ];

        const csv = csvData.map((row) => row.join(",")).join("\n");

        return {
          success: true,
          csv,
          filename: `avaliacoes_${Date.now()}.csv`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao exportar CSV: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        });
      }
    }),
});
