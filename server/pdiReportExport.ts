import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { TRPCError } from "@trpc/server";
import { pdiPlans, pdiIntelligentDetails, employees, evaluationCycles } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

/**
 * Router para exportação de relatórios de PDI
 */
export const pdiReportExportRouter = router({
  /**
   * Exportar relatório comparativo em PDF
   */
  exportComparativePDF: protectedProcedure
    .input(z.object({
      cycleId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Banco de dados indisponível',
        });
      }

      try {
        // Buscar dados comparativos
        const query = db
          .select({
            planId: pdiPlans.id,
            employeeId: pdiPlans.employeeId,
            employeeName: employees.name,
            cycleId: pdiPlans.cycleId,
            cycleName: evaluationCycles.name,
            status: pdiPlans.status,
            startDate: pdiPlans.startDate,
            endDate: pdiPlans.endDate,
            importedFromHtml: pdiIntelligentDetails.importedFromHtml,
            importedAt: pdiIntelligentDetails.importedAt,
          })
          .from(pdiPlans)
          .leftJoin(employees, eq(pdiPlans.employeeId, employees.id))
          .leftJoin(evaluationCycles, eq(pdiPlans.cycleId, evaluationCycles.id))
          .leftJoin(pdiIntelligentDetails, eq(pdiIntelligentDetails.planId, pdiPlans.id));

        if (input.cycleId) {
          query.where(eq(pdiPlans.cycleId, input.cycleId));
        }

        const pdis = await query;

        // Separar PDIs manuais e importados
        const manualPDIs = pdis.filter(p => !p.importedFromHtml);
        const importedPDIs = pdis.filter(p => p.importedFromHtml);

        // Criar documento PDF
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));

        // Cabeçalho
        doc.fontSize(20).text('Relatório Comparativo de PDIs', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, { align: 'center' });
        doc.moveDown(2);

        // Resumo Executivo
        doc.fontSize(16).text('Resumo Executivo', { underline: true });
        doc.moveDown();
        doc.fontSize(12);
        doc.text(`Total de PDIs: ${pdis.length}`);
        doc.text(`PDIs Manuais: ${manualPDIs.length}`);
        doc.text(`PDIs Importados: ${importedPDIs.length}`);
        doc.moveDown(2);

        // Análise Comparativa
        doc.fontSize(16).text('Análise Comparativa', { underline: true });
        doc.moveDown();
        doc.fontSize(12);
        
        const manualPercentage = pdis.length > 0 ? ((manualPDIs.length / pdis.length) * 100).toFixed(1) : 0;
        const importedPercentage = pdis.length > 0 ? ((importedPDIs.length / pdis.length) * 100).toFixed(1) : 0;

        doc.text(`Percentual de PDIs Manuais: ${manualPercentage}%`);
        doc.text(`Percentual de PDIs Importados: ${importedPercentage}%`);
        doc.moveDown(2);

        // Detalhamento de PDIs Importados
        if (importedPDIs.length > 0) {
          doc.fontSize(16).text('PDIs Importados - Detalhamento', { underline: true });
          doc.moveDown();
          doc.fontSize(10);

          importedPDIs.forEach((pdi, index) => {
            doc.text(`${index + 1}. ${pdi.employeeName || 'N/A'}`);
            doc.text(`   Ciclo: ${pdi.cycleName || 'N/A'}`);
            doc.text(`   Data de Importação: ${pdi.importedAt ? new Date(pdi.importedAt).toLocaleDateString('pt-BR') : 'N/A'}`);
            doc.text(`   Status: ${pdi.status || 'N/A'}`);
            doc.moveDown();
          });
        }

        doc.end();

        // Aguardar conclusão do PDF
        const pdfBuffer = await new Promise<Buffer>((resolve) => {
          doc.on('end', () => {
            resolve(Buffer.concat(chunks));
          });
        });

        // Retornar PDF como base64
        return {
          success: true,
          filename: `relatorio_comparativo_pdi_${Date.now()}.pdf`,
          data: pdfBuffer.toString('base64'),
          mimeType: 'application/pdf',
        };
      } catch (error: any) {
        console.error('[PDI Export] Erro ao exportar PDF:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Erro ao exportar relatório: ${error.message}`,
        });
      }
    }),

  /**
   * Exportar relatório comparativo em Excel
   */
  exportComparativeExcel: protectedProcedure
    .input(z.object({
      cycleId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Banco de dados indisponível',
        });
      }

      try {
        // Buscar dados comparativos
        const query = db
          .select({
            planId: pdiPlans.id,
            employeeId: pdiPlans.employeeId,
            employeeName: employees.name,
            cycleId: pdiPlans.cycleId,
            cycleName: evaluationCycles.name,
            status: pdiPlans.status,
            startDate: pdiPlans.startDate,
            endDate: pdiPlans.endDate,
            overallProgress: pdiPlans.overallProgress,
            importedFromHtml: pdiIntelligentDetails.importedFromHtml,
            importedAt: pdiIntelligentDetails.importedAt,
          })
          .from(pdiPlans)
          .leftJoin(employees, eq(pdiPlans.employeeId, employees.id))
          .leftJoin(evaluationCycles, eq(pdiPlans.cycleId, evaluationCycles.id))
          .leftJoin(pdiIntelligentDetails, eq(pdiIntelligentDetails.planId, pdiPlans.id));

        if (input.cycleId) {
          query.where(eq(pdiPlans.cycleId, input.cycleId));
        }

        const pdis = await query;

        // Criar workbook Excel
        const workbook = new ExcelJS.Workbook();

        // Aba 1: Resumo Executivo
        const summarySheet = workbook.addWorksheet('Resumo Executivo');
        summarySheet.columns = [
          { header: 'Métrica', key: 'metric', width: 30 },
          { header: 'Valor', key: 'value', width: 20 },
        ];

        const manualPDIs = pdis.filter(p => !p.importedFromHtml);
        const importedPDIs = pdis.filter(p => p.importedFromHtml);

        summarySheet.addRows([
          { metric: 'Total de PDIs', value: pdis.length },
          { metric: 'PDIs Manuais', value: manualPDIs.length },
          { metric: 'PDIs Importados', value: importedPDIs.length },
          { metric: '% PDIs Manuais', value: pdis.length > 0 ? `${((manualPDIs.length / pdis.length) * 100).toFixed(1)}%` : '0%' },
          { metric: '% PDIs Importados', value: pdis.length > 0 ? `${((importedPDIs.length / pdis.length) * 100).toFixed(1)}%` : '0%' },
        ]);

        // Aba 2: PDIs Manuais
        const manualSheet = workbook.addWorksheet('PDIs Manuais');
        manualSheet.columns = [
          { header: 'ID', key: 'id', width: 10 },
          { header: 'Funcionário', key: 'employee', width: 30 },
          { header: 'Ciclo', key: 'cycle', width: 20 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Progresso', key: 'progress', width: 12 },
          { header: 'Data Início', key: 'startDate', width: 15 },
          { header: 'Data Fim', key: 'endDate', width: 15 },
        ];

        manualPDIs.forEach(pdi => {
          manualSheet.addRow({
            id: pdi.planId,
            employee: pdi.employeeName || 'N/A',
            cycle: pdi.cycleName || 'N/A',
            status: pdi.status || 'N/A',
            progress: `${pdi.overallProgress || 0}%`,
            startDate: pdi.startDate ? new Date(pdi.startDate).toLocaleDateString('pt-BR') : 'N/A',
            endDate: pdi.endDate ? new Date(pdi.endDate).toLocaleDateString('pt-BR') : 'N/A',
          });
        });

        // Aba 3: PDIs Importados
        const importedSheet = workbook.addWorksheet('PDIs Importados');
        importedSheet.columns = [
          { header: 'ID', key: 'id', width: 10 },
          { header: 'Funcionário', key: 'employee', width: 30 },
          { header: 'Ciclo', key: 'cycle', width: 20 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Progresso', key: 'progress', width: 12 },
          { header: 'Data Importação', key: 'importDate', width: 18 },
          { header: 'Data Início', key: 'startDate', width: 15 },
          { header: 'Data Fim', key: 'endDate', width: 15 },
        ];

        importedPDIs.forEach(pdi => {
          importedSheet.addRow({
            id: pdi.planId,
            employee: pdi.employeeName || 'N/A',
            cycle: pdi.cycleName || 'N/A',
            status: pdi.status || 'N/A',
            progress: `${pdi.overallProgress || 0}%`,
            importDate: pdi.importedAt ? new Date(pdi.importedAt).toLocaleDateString('pt-BR') : 'N/A',
            startDate: pdi.startDate ? new Date(pdi.startDate).toLocaleDateString('pt-BR') : 'N/A',
            endDate: pdi.endDate ? new Date(pdi.endDate).toLocaleDateString('pt-BR') : 'N/A',
          });
        });

        // Aba 4: Análise Comparativa
        const analysisSheet = workbook.addWorksheet('Análise Comparativa');
        analysisSheet.columns = [
          { header: 'Categoria', key: 'category', width: 25 },
          { header: 'PDIs Manuais', key: 'manual', width: 15 },
          { header: 'PDIs Importados', key: 'imported', width: 18 },
          { header: 'Total', key: 'total', width: 12 },
        ];

        analysisSheet.addRows([
          {
            category: 'Quantidade Total',
            manual: manualPDIs.length,
            imported: importedPDIs.length,
            total: pdis.length,
          },
          {
            category: 'Percentual',
            manual: pdis.length > 0 ? `${((manualPDIs.length / pdis.length) * 100).toFixed(1)}%` : '0%',
            imported: pdis.length > 0 ? `${((importedPDIs.length / pdis.length) * 100).toFixed(1)}%` : '0%',
            total: '100%',
          },
        ]);

        // Gerar buffer do Excel
        const excelBuffer = await workbook.xlsx.writeBuffer();

        // Retornar Excel como base64
        return {
          success: true,
          filename: `relatorio_comparativo_pdi_${Date.now()}.xlsx`,
          data: excelBuffer.toString('base64'),
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };
      } catch (error: any) {
        console.error('[PDI Export] Erro ao exportar Excel:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Erro ao exportar relatório: ${error.message}`,
        });
      }
    }),
});
