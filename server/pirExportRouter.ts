import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';
import { getDb } from './db';
import { pirAssessments, employees, pirAnswers, pirQuestions } from '../drizzle/schema';
import { eq, and, inArray, desc } from 'drizzle-orm';
import ExcelJS from 'exceljs';
import { storagePut } from './storage';

/**
 * Router para exportação de relatórios PIR
 * Suporta Excel e CSV com formatação profissional
 */
export const pirExportRouter = router({
  /**
   * Exportar relatório individual em Excel
   */
  exportIndividualExcel: protectedProcedure
    .input(z.object({ assessmentId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Buscar avaliação
      const [assessment] = await db
        .select()
        .from(pirAssessments)
        .where(eq(pirAssessments.id, input.assessmentId))
        .limit(1);

      if (!assessment) throw new Error('Assessment not found');

      // Buscar funcionário
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, assessment.employeeId))
        .limit(1);

      // Buscar respostas
      const answers = await db
        .select({
          answer: pirAnswers,
          question: pirQuestions
        })
        .from(pirAnswers)
        .innerJoin(pirQuestions, eq(pirAnswers.questionId, pirQuestions.id))
        .where(eq(pirAnswers.pirAssessmentId, assessment.id));

      // Criar workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sistema AVD UISA';
      workbook.created = new Date();

      // Aba 1: Resumo
      const summarySheet = workbook.addWorksheet('Resumo');
      summarySheet.columns = [
        { header: 'Campo', key: 'field', width: 30 },
        { header: 'Valor', key: 'value', width: 50 }
      ];

      summarySheet.addRows([
        { field: 'Funcionário', value: employee?.name || 'N/A' },
        { field: 'Matrícula', value: employee?.employeeCode || 'N/A' },
        { field: 'Departamento', value: employee?.gerencia || 'N/A' },
        { field: 'Cargo', value: employee?.cargo || 'N/A' },
        { field: 'Data da Avaliação', value: new Date(assessment.assessmentDate).toLocaleDateString('pt-BR') },
        { field: 'Score Geral', value: assessment.overallScore || 0 },
        { field: 'Status', value: assessment.status }
      ]);

      // Estilizar cabeçalho
      summarySheet.getRow(1).font = { bold: true, size: 12 };
      summarySheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

      // Aba 2: Respostas Detalhadas
      const answersSheet = workbook.addWorksheet('Respostas');
      answersSheet.columns = [
        { header: 'Questão', key: 'question', width: 60 },
        { header: 'Tipo', key: 'type', width: 15 },
        { header: 'Resposta', key: 'answer', width: 20 }
      ];

      answers.forEach(({ answer, question }) => {
        answersSheet.addRow({
          question: question.questionText,
          type: question.questionType,
          answer: answer.answerScale || answer.answerText || answer.answerOption || 'N/A'
        });
      });

      // Estilizar cabeçalho
      answersSheet.getRow(1).font = { bold: true, size: 12 };
      answersSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      answersSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

      // Gerar buffer do Excel
      const buffer = await workbook.xlsx.writeBuffer();

      // Upload para S3
      const fileName = `pir-relatorio-${assessment.id}-${Date.now()}.xlsx`;
      const { url } = await storagePut(
        `pir-reports/${fileName}`,
        Buffer.from(buffer),
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      return {
        success: true,
        url,
        fileName
      };
    }),

  /**
   * Exportar relatório consolidado (múltiplas avaliações) em Excel
   */
  exportConsolidatedExcel: protectedProcedure
    .input(
      z.object({
        employeeIds: z.array(z.number()).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        department: z.string().optional()
      })
    .optional())
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Construir query baseado nos filtros
      let query = db.select({
        assessment: pirAssessments,
        employee: employees
      }).from(pirAssessments)
        .innerJoin(employees, eq(pirAssessments.employeeId, employees.id));

      // Aplicar filtros (simplificado - em produção usar where conditions)
      const results = await query;

      // Criar workbook
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Relatório Consolidado');

      sheet.columns = [
        { header: 'Funcionário', key: 'name', width: 30 },
        { header: 'Matrícula', key: 'code', width: 15 },
        { header: 'Departamento', key: 'dept', width: 25 },
        { header: 'Cargo', key: 'position', width: 25 },
        { header: 'Data Avaliação', key: 'date', width: 15 },
        { header: 'Score Geral', key: 'score', width: 12 },
        { header: 'Status', key: 'status', width: 15 }
      ];

      results.forEach(({ assessment, employee }) => {
        sheet.addRow({
          name: employee.name,
          code: employee.employeeCode,
          dept: employee.gerencia || 'N/A',
          position: employee.cargo || 'N/A',
          date: new Date(assessment.assessmentDate).toLocaleDateString('pt-BR'),
          score: assessment.overallScore || 0,
          status: assessment.status
        });
      });

      // Estilizar cabeçalho
      sheet.getRow(1).font = { bold: true, size: 12 };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

      // Adicionar estatísticas no final
      const scores = results.map(r => r.assessment.overallScore || 0);
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const maxScore = Math.max(...scores);
      const minScore = Math.min(...scores);

      sheet.addRow({});
      sheet.addRow({ name: 'ESTATÍSTICAS' });
      sheet.addRow({ name: 'Média Geral', score: Math.round(avgScore) });
      sheet.addRow({ name: 'Score Máximo', score: maxScore });
      sheet.addRow({ name: 'Score Mínimo', score: minScore });
      sheet.addRow({ name: 'Total de Avaliações', score: results.length });

      // Gerar buffer
      const buffer = await workbook.xlsx.writeBuffer();

      // Upload para S3
      const fileName = `pir-consolidado-${Date.now()}.xlsx`;
      const { url } = await storagePut(
        `pir-reports/${fileName}`,
        Buffer.from(buffer),
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      return {
        success: true,
        url,
        fileName,
        totalRecords: results.length
      };
    }),

  /**
   * Exportar para CSV
   */
  exportCSV: protectedProcedure
    .input(
      z.object({
        employeeIds: z.array(z.number()).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional()
      })
    .optional())
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Buscar dados
      const results = await db.select({
        assessment: pirAssessments,
        employee: employees
      }).from(pirAssessments)
        .innerJoin(employees, eq(pirAssessments.employeeId, employees.id))
        .orderBy(desc(pirAssessments.assessmentDate));

      // Gerar CSV
      const headers = [
        'Funcionário',
        'Matrícula',
        'Departamento',
        'Cargo',
        'Data Avaliação',
        'Score Geral',
        'Status'
      ];

      const rows = results.map(({ assessment, employee }) => [
        employee.name,
        employee.employeeCode,
        employee.gerencia || '',
        employee.cargo || '',
        new Date(assessment.assessmentDate).toLocaleDateString('pt-BR'),
        assessment.overallScore || 0,
        assessment.status
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Upload para S3
      const fileName = `pir-export-${Date.now()}.csv`;
      const { url } = await storagePut(
        `pir-reports/${fileName}`,
        Buffer.from(csvContent, 'utf-8'),
        'text/csv'
      );

      return {
        success: true,
        url,
        fileName,
        totalRecords: results.length
      };
    })
});
