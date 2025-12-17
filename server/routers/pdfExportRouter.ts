/**
 * PDF Export Router
 * Procedures tRPC para exportação de relatórios em PDF
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { generateTemporalAnalysisPDF, generateEmployeeComparisonPDF } from "../pdfGenerator";
import { storagePut } from "../storage";

export const pdfExportRouter = router({
  /**
   * Exportar análise temporal em PDF
   */
  exportTemporalAnalysis: protectedProcedure
    .input(z.object({ resultId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        // Buscar resultado da análise
        const result = await db.getTemporalAnalysisResult(input.resultId);
        
        if (!result) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Resultado de análise não encontrado",
          });
        }
        
        // Buscar configuração
        const config = await db.getTemporalAnalysisConfig(result.configId);
        
        if (!config) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Configuração de análise não encontrada",
          });
        }
        
        // Buscar dados dos top performers
        const topPerformerIds = result.topPerformers ? JSON.parse(result.topPerformers) : [];
        const topPerformers = await Promise.all(
          topPerformerIds.slice(0, 10).map(async (id: number) => {
            const employee = await db.getEmployeeById(id);
            const snapshots = await db.getEmployeeSnapshots(id, 2);
            
            const currentScore = snapshots[0]?.pirScore || 0;
            const previousScore = snapshots[1]?.pirScore || currentScore;
            const improvement = currentScore - previousScore;
            
            return {
              employeeId: id,
              name: employee?.name || "Desconhecido",
              score: currentScore,
              improvement,
            };
          })
        );
        
        // Buscar dados dos que precisam atenção
        const needsAttentionIds = result.needsAttention ? JSON.parse(result.needsAttention) : [];
        const needsAttention = await Promise.all(
          needsAttentionIds.slice(0, 10).map(async (id: number) => {
            const employee = await db.getEmployeeById(id);
            const snapshots = await db.getEmployeeSnapshots(id, 2);
            
            const currentScore = snapshots[0]?.pirScore || 0;
            const previousScore = snapshots[1]?.pirScore || currentScore;
            const decline = currentScore - previousScore;
            
            return {
              employeeId: id,
              name: employee?.name || "Desconhecido",
              score: currentScore,
              decline,
            };
          })
        );
        
        // Preparar dados para o PDF
        const pdfData = {
          title: config.name,
          period: result.periodLabel,
          generatedAt: new Date(),
          totalEmployees: result.totalEmployeesAnalyzed,
          averagePirScore: result.averagePirScore,
          improvementRate: result.improvementRate,
          declineRate: result.declineRate,
          stableRate: result.stableRate,
          topPerformers,
          needsAttention,
        };
        
        // Gerar PDF
        const pdfBuffer = await generateTemporalAnalysisPDF(pdfData);
        
        // Upload para S3
        const fileName = `temporal-analysis-${result.id}-${Date.now()}.pdf`;
        const { url } = await storagePut(
          `reports/${fileName}`,
          pdfBuffer,
          "application/pdf"
        );
        
        return {
          success: true,
          url,
          fileName,
        };
      } catch (error) {
        console.error("Erro ao exportar PDF:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao gerar PDF",
        });
      }
    }),

  /**
   * Exportar comparação de funcionários em PDF
   */
  exportEmployeeComparison: protectedProcedure
    .input(
      z.object({
        employeeIds: z.array(z.number()),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Buscar dados dos funcionários
        const employeesData = await Promise.all(
          input.employeeIds.map(async (employeeId) => {
            const employee = await db.getEmployeeById(employeeId);
            
            if (!employee) {
              return null;
            }
            
            // Buscar snapshots
            const snapshots = await db.getEmployeeSnapshots(employeeId, 12);
            
            const currentScore = snapshots[0]?.pirScore || 0;
            const previousScore = snapshots[1]?.pirScore || currentScore;
            const change = currentScore - previousScore;
            
            // Buscar departamento
            const department = employee.departmentId
              ? await db.getDepartmentById(employee.departmentId)
              : null;
            
            return {
              name: employee.name,
              chapa: employee.chapa || employee.employeeCode,
              department: department?.name || "N/A",
              currentScore,
              previousScore,
              change,
              trends: snapshots.slice(0, 6).map(s => ({
                period: s.periodLabel,
                score: s.pirScore || 0,
              })),
            };
          })
        );
        
        // Filtrar nulls
        const validEmployees = employeesData.filter(e => e !== null) as any[];
        
        if (validEmployees.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Nenhum funcionário válido encontrado",
          });
        }
        
        // Gerar PDF
        const pdfBuffer = await generateEmployeeComparisonPDF(validEmployees);
        
        // Upload para S3
        const fileName = `employee-comparison-${Date.now()}.pdf`;
        const { url } = await storagePut(
          `reports/${fileName}`,
          pdfBuffer,
          "application/pdf"
        );
        
        return {
          success: true,
          url,
          fileName,
        };
      } catch (error) {
        console.error("Erro ao exportar comparação:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao gerar PDF",
        });
      }
    }),

  /**
   * Listar relatórios exportados
   */
  listExportedReports: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(20),
      })
    )
    .query(async ({ input }) => {
      // Aqui você poderia ter uma tabela de histórico de exports
      // Por enquanto, retornar array vazio
      return [];
    }),
});
