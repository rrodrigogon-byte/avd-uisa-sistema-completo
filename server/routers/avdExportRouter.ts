import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { employees, avdAssessmentProcesses, avdCompetencyAssessments, avdCompetencyAssessmentItems, competencies, pirAssessments } from "../../drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";
import { exportEmployeeReportToExcel, exportConsolidatedReportToExcel, type EmployeeReportData } from "../exports/excelExport";
import { exportEmployeeReportToPDF, exportConsolidatedReportToPDF } from "../exports/pdfExport";

/**
 * Router para exportação de relatórios AVD em Excel e PDF
 */
export const avdExportRouter = router({
  /**
   * Exportar relatório individual de funcionário em Excel
   */
  exportEmployeeExcel: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database não disponível");

      // Buscar dados do funcionário
      const employee = await db.select().from(employees).where(eq(employees.id, input.employeeId)).limit(1);
      if (!employee || employee.length === 0) {
        throw new Error("Funcionário não encontrado");
      }

      // Buscar processo AVD
      const process = await db.select().from(avdAssessmentProcesses)
        .where(eq(avdAssessmentProcesses.employeeId, input.employeeId))
        .orderBy(avdAssessmentProcesses.createdAt)
        .limit(1);

      // Buscar resultados PIR
      const pirResults = await db.select().from(pirAssessments)
        .where(eq(pirAssessments.employeeId, input.employeeId))
        .orderBy(pirAssessments.completedAt)
        .limit(1);

      // Buscar avaliação de competências
      const compAssessment = process.length > 0 
        ? await db.select().from(avdCompetencyAssessments)
            .where(eq(avdCompetencyAssessments.processId, process[0].id))
            .limit(1)
        : [];

      // Buscar itens de competências
      const compItems = compAssessment.length > 0
        ? await db.select({
            competencyName: competencies.name,
            category: competencies.category,
            score: avdCompetencyAssessmentItems.score,
          })
          .from(avdCompetencyAssessmentItems)
          .innerJoin(competencies, eq(avdCompetencyAssessmentItems.competencyId, competencies.id))
          .where(eq(avdCompetencyAssessmentItems.assessmentId, compAssessment[0].id))
        : [];

      // Montar dados para exportação
      const reportData: EmployeeReportData = {
        employee: employee[0],
        process: process[0],
        pirResults: pirResults.length > 0 ? {
          IP: pirResults[0].ipScore || 0,
          ID: pirResults[0].idScore || 0,
          IC: pirResults[0].icScore || 0,
          ES: pirResults[0].esScore || 0,
          FL: pirResults[0].flScore || 0,
          AU: pirResults[0].auScore || 0,
          dominantDimension: pirResults[0].dominantDimension || 'N/A',
        } : undefined,
        competencyScores: compItems.map(item => ({
          competencyName: item.competencyName,
          category: item.category,
          score: item.score,
        })),
        performanceScore: compAssessment.length > 0 ? compAssessment[0].overallScore : undefined,
      };

      // Gerar Excel
      const buffer = await exportEmployeeReportToExcel(reportData);

      // Retornar como base64 para download no frontend
      return {
        success: true,
        filename: `relatorio_${employee[0].employeeCode}_${new Date().toISOString().split('T')[0]}.xlsx`,
        data: buffer.toString('base64'),
      };
    }),

  /**
   * Exportar relatório individual de funcionário em PDF
   */
  exportEmployeePDF: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database não disponível");

      // Buscar dados do funcionário (mesma lógica do Excel)
      const employee = await db.select().from(employees).where(eq(employees.id, input.employeeId)).limit(1);
      if (!employee || employee.length === 0) {
        throw new Error("Funcionário não encontrado");
      }

      const process = await db.select().from(avdAssessmentProcesses)
        .where(eq(avdAssessmentProcesses.employeeId, input.employeeId))
        .orderBy(avdAssessmentProcesses.createdAt)
        .limit(1);

      const pirResults = await db.select().from(pirAssessments)
        .where(eq(pirAssessments.employeeId, input.employeeId))
        .orderBy(pirAssessments.completedAt)
        .limit(1);

      const compAssessment = process.length > 0 
        ? await db.select().from(avdCompetencyAssessments)
            .where(eq(avdCompetencyAssessments.processId, process[0].id))
            .limit(1)
        : [];

      const compItems = compAssessment.length > 0
        ? await db.select({
            competencyName: competencies.name,
            category: competencies.category,
            score: avdCompetencyAssessmentItems.score,
          })
          .from(avdCompetencyAssessmentItems)
          .innerJoin(competencies, eq(avdCompetencyAssessmentItems.competencyId, competencies.id))
          .where(eq(avdCompetencyAssessmentItems.assessmentId, compAssessment[0].id))
        : [];

      const reportData: EmployeeReportData = {
        employee: employee[0],
        process: process[0],
        pirResults: pirResults.length > 0 ? {
          IP: pirResults[0].ipScore || 0,
          ID: pirResults[0].idScore || 0,
          IC: pirResults[0].icScore || 0,
          ES: pirResults[0].esScore || 0,
          FL: pirResults[0].flScore || 0,
          AU: pirResults[0].auScore || 0,
          dominantDimension: pirResults[0].dominantDimension || 'N/A',
        } : undefined,
        competencyScores: compItems.map(item => ({
          competencyName: item.competencyName,
          category: item.category,
          score: item.score,
        })),
        performanceScore: compAssessment.length > 0 ? compAssessment[0].overallScore : undefined,
      };

      // Gerar PDF
      const buffer = await exportEmployeeReportToPDF(reportData);

      return {
        success: true,
        filename: `relatorio_${employee[0].employeeCode}_${new Date().toISOString().split('T')[0]}.pdf`,
        data: buffer.toString('base64'),
      };
    }),

  /**
   * Exportar relatório consolidado de múltiplos funcionários em Excel
   */
  exportConsolidatedExcel: adminProcedure
    .input(z.object({
      employeeIds: z.array(z.number()).optional(),
      departmentId: z.number().optional(),
    }).optional())
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database não disponível");

      // Buscar funcionários
      let employeesList;
      if (input.employeeIds && input.employeeIds.length > 0) {
        employeesList = await db.select().from(employees)
          .where(inArray(employees.id, input.employeeIds));
      } else if (input.departmentId) {
        employeesList = await db.select().from(employees)
          .where(eq(employees.departmentId, input.departmentId));
      } else {
        employeesList = await db.select().from(employees).limit(100);
      }

      // Buscar dados para cada funcionário
      const reportsData: EmployeeReportData[] = [];

      for (const emp of employeesList) {
        const process = await db.select().from(avdAssessmentProcesses)
          .where(eq(avdAssessmentProcesses.employeeId, emp.id))
          .orderBy(avdAssessmentProcesses.createdAt)
          .limit(1);

        const pirResults = await db.select().from(pirAssessments)
          .where(eq(pirAssessments.employeeId, emp.id))
          .orderBy(pirAssessments.completedAt)
          .limit(1);

        const compAssessment = process.length > 0 
          ? await db.select().from(avdCompetencyAssessments)
              .where(eq(avdCompetencyAssessments.processId, process[0].id))
              .limit(1)
          : [];

        reportsData.push({
          employee: emp,
          process: process[0],
          pirResults: pirResults.length > 0 ? {
            IP: pirResults[0].ipScore || 0,
            ID: pirResults[0].idScore || 0,
            IC: pirResults[0].icScore || 0,
            ES: pirResults[0].esScore || 0,
            FL: pirResults[0].flScore || 0,
            AU: pirResults[0].auScore || 0,
            dominantDimension: pirResults[0].dominantDimension || 'N/A',
          } : undefined,
          performanceScore: compAssessment.length > 0 ? compAssessment[0].overallScore : undefined,
        });
      }

      // Gerar Excel consolidado
      const buffer = await exportConsolidatedReportToExcel(reportsData);

      return {
        success: true,
        filename: `relatorio_consolidado_${new Date().toISOString().split('T')[0]}.xlsx`,
        data: buffer.toString('base64'),
      };
    }),

  /**
   * Exportar relatório consolidado de múltiplos funcionários em PDF
   */
  exportConsolidatedPDF: adminProcedure
    .input(z.object({
      employeeIds: z.array(z.number()).optional(),
      departmentId: z.number().optional(),
    }).optional())
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database não disponível");

      // Buscar funcionários (mesma lógica do Excel)
      let employeesList;
      if (input.employeeIds && input.employeeIds.length > 0) {
        employeesList = await db.select().from(employees)
          .where(inArray(employees.id, input.employeeIds));
      } else if (input.departmentId) {
        employeesList = await db.select().from(employees)
          .where(eq(employees.departmentId, input.departmentId));
      } else {
        employeesList = await db.select().from(employees).limit(100);
      }

      const reportsData: EmployeeReportData[] = [];

      for (const emp of employeesList) {
        const process = await db.select().from(avdAssessmentProcesses)
          .where(eq(avdAssessmentProcesses.employeeId, emp.id))
          .orderBy(avdAssessmentProcesses.createdAt)
          .limit(1);

        const pirResults = await db.select().from(pirAssessments)
          .where(eq(pirAssessments.employeeId, emp.id))
          .orderBy(pirAssessments.completedAt)
          .limit(1);

        const compAssessment = process.length > 0 
          ? await db.select().from(avdCompetencyAssessments)
              .where(eq(avdCompetencyAssessments.processId, process[0].id))
              .limit(1)
          : [];

        reportsData.push({
          employee: emp,
          process: process[0],
          pirResults: pirResults.length > 0 ? {
            IP: pirResults[0].ipScore || 0,
            ID: pirResults[0].idScore || 0,
            IC: pirResults[0].icScore || 0,
            ES: pirResults[0].esScore || 0,
            FL: pirResults[0].flScore || 0,
            AU: pirResults[0].auScore || 0,
            dominantDimension: pirResults[0].dominantDimension || 'N/A',
          } : undefined,
          performanceScore: compAssessment.length > 0 ? compAssessment[0].overallScore : undefined,
        });
      }

      // Gerar PDF consolidado
      const buffer = await exportConsolidatedReportToPDF(reportsData);

      return {
        success: true,
        filename: `relatorio_consolidado_${new Date().toISOString().split('T')[0]}.pdf`,
        data: buffer.toString('base64'),
      };
    }),
});
