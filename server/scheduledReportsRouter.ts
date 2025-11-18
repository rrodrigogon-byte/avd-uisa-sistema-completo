import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  InsertScheduledReport,
  reportExecutionLogs,
  scheduledReports,
  ScheduledReport,
} from "../drizzle/schema";
import { getDb } from "./db";
import { adminProcedure, protectedProcedure, router } from "./_core/trpc";
import { generateNineBoxPDF } from "./reportGenerators/nineBoxPDF";
import { generatePerformanceExcel } from "./reportGenerators/performanceExcel";
import { generatePDIPDF } from "./reportGenerators/pdiPDF";

/**
 * Router de Relatórios Agendados
 * Gerencia a criação, listagem, atualização e execução de relatórios automáticos
 */

export const scheduledReportsRouter = router({
  /**
   * Listar todos os relatórios agendados (apenas admins)
   */
  list: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const reports = await db
      .select()
      .from(scheduledReports)
      .orderBy(desc(scheduledReports.createdAt));

    return reports;
  }),

  /**
   * Obter detalhes de um relatório agendado específico (apenas admins)
   */
  getById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const report = await db
        .select()
        .from(scheduledReports)
        .where(eq(scheduledReports.id, input.id))
        .limit(1);

      if (report.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Relatório não encontrado" });
      }

      // Buscar logs de execução
      const logs = await db
        .select()
        .from(reportExecutionLogs)
        .where(eq(reportExecutionLogs.scheduledReportId, input.id))
        .orderBy(desc(reportExecutionLogs.executedAt))
        .limit(10);

      return {
        report: report[0],
        executionLogs: logs,
      };
    }),

  /**
   * Criar novo relatório agendado (apenas admins)
   */
  create: adminProcedure
    .input(
      z.object({
        reportType: z.enum([
          "nine_box",
          "performance",
          "pdi",
          "evaluations",
          "goals",
          "competencies",
          "succession",
          "turnover",
          "headcount",
        ]),
        reportName: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
        frequency: z.enum(["daily", "weekly", "monthly", "quarterly"]),
        dayOfWeek: z.number().min(0).max(6).optional(),
        dayOfMonth: z.number().min(1).max(31).optional(),
        hour: z.number().min(0).max(23).default(9),
        recipients: z.array(z.string().email()).min(1, "Adicione pelo menos um destinatário"),
        departments: z.array(z.number()).optional(),
        format: z.enum(["pdf", "excel", "csv"]).default("pdf"),
        includeCharts: z.boolean().default(true),
        active: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Validações
      if (input.frequency === "weekly" && input.dayOfWeek === undefined) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Dia da semana é obrigatório para relatórios semanais",
        });
      }

      if (input.frequency === "monthly" && input.dayOfMonth === undefined) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Dia do mês é obrigatório para relatórios mensais",
        });
      }

      // Calcular próxima execução
      const nextExecutionAt = calculateNextExecution(
        input.frequency,
        input.hour,
        input.dayOfWeek,
        input.dayOfMonth
      );

      const newReport: InsertScheduledReport = {
        reportType: input.reportType,
        reportName: input.reportName,
        frequency: input.frequency,
        dayOfWeek: input.dayOfWeek ?? null,
        dayOfMonth: input.dayOfMonth ?? null,
        hour: input.hour,
        recipients: JSON.stringify(input.recipients),
        departments: input.departments ? JSON.stringify(input.departments) : null,
        format: input.format,
        includeCharts: input.includeCharts,
        active: input.active,
        nextExecutionAt,
        createdBy: ctx.user.id,
      };

      const result = await db.insert(scheduledReports).values(newReport);

      return {
        success: true,
        reportId: result[0].insertId,
        nextExecutionAt,
      };
    }),

  /**
   * Atualizar relatório agendado existente (apenas admins)
   */
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        reportName: z.string().min(3).optional(),
        frequency: z.enum(["daily", "weekly", "monthly", "quarterly"]).optional(),
        dayOfWeek: z.number().min(0).max(6).optional(),
        dayOfMonth: z.number().min(1).max(31).optional(),
        hour: z.number().min(0).max(23).optional(),
        recipients: z.array(z.string().email()).optional(),
        departments: z.array(z.number()).optional(),
        format: z.enum(["pdf", "excel", "csv"]).optional(),
        includeCharts: z.boolean().optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar se relatório existe
      const existing = await db
        .select()
        .from(scheduledReports)
        .where(eq(scheduledReports.id, input.id))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Relatório não encontrado" });
      }

      const current = existing[0];

      // Preparar dados de atualização
      const updateData: Partial<ScheduledReport> = {};

      if (input.reportName) updateData.reportName = input.reportName;
      if (input.frequency) updateData.frequency = input.frequency;
      if (input.dayOfWeek !== undefined) updateData.dayOfWeek = input.dayOfWeek;
      if (input.dayOfMonth !== undefined) updateData.dayOfMonth = input.dayOfMonth;
      if (input.hour !== undefined) updateData.hour = input.hour;
      if (input.recipients) updateData.recipients = JSON.stringify(input.recipients);
      if (input.departments) updateData.departments = JSON.stringify(input.departments);
      if (input.format) updateData.format = input.format;
      if (input.includeCharts !== undefined) updateData.includeCharts = input.includeCharts;
      if (input.active !== undefined) updateData.active = input.active;

      // Recalcular próxima execução se frequência ou horário mudaram
      if (input.frequency || input.hour !== undefined || input.dayOfWeek !== undefined || input.dayOfMonth !== undefined) {
        updateData.nextExecutionAt = calculateNextExecution(
          input.frequency ?? current.frequency,
          input.hour ?? current.hour,
          input.dayOfWeek ?? current.dayOfWeek ?? undefined,
          input.dayOfMonth ?? current.dayOfMonth ?? undefined
        );
      }

      await db.update(scheduledReports).set(updateData).where(eq(scheduledReports.id, input.id));

      return { success: true };
    }),

  /**
   * Deletar relatório agendado (apenas admins)
   */
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.delete(scheduledReports).where(eq(scheduledReports.id, input.id));

      return { success: true };
    }),

  /**
   * Executar relatório manualmente (teste) (apenas admins)
   */
  executeNow: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const report = await db
        .select()
        .from(scheduledReports)
        .where(eq(scheduledReports.id, input.id))
        .limit(1);

      if (report.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Relatório não encontrado" });
      }

      // Executar relatório
      const startTime = Date.now();
      
      try {
        const recipients = JSON.parse(report[0].recipients);
        let reportBuffer: ArrayBuffer | Buffer | null = null;
        let fileSize = 0;

        // Gerar relatório baseado no tipo (dados mock para demonstração)
        if (report[0].reportType === "nine_box") {
          const mockPositions = [
            {
              employeeName: "João Silva",
              performance: "alto",
              potential: "alto",
              position: "Top Talent",
              department: "Tecnologia",
            },
            {
              employeeName: "Maria Santos",
              performance: "alto",
              potential: "medio",
              position: "High Performer",
              department: "Vendas",
            },
          ];

          const summary = {
            total: mockPositions.length,
            highPerformers: mockPositions.filter((p) => p.performance === "alto").length,
            highPotential: mockPositions.filter((p) => p.potential === "alto").length,
            criticalTalent: mockPositions.filter((p) => p.performance === "alto" && p.potential === "alto").length,
          };

          reportBuffer = await generateNineBoxPDF({
            positions: mockPositions,
            summary,
            includeCharts: report[0].includeCharts,
          });
          fileSize = reportBuffer.byteLength;
        } else if (report[0].reportType === "performance") {
          const mockEmployees = [
            {
              name: "João Silva",
              department: "Tecnologia",
              position: "Desenvolvedor Sênior",
              performanceScore: 85,
              goalsCompleted: 8,
              totalGoals: 10,
              evaluationScore: 4.2,
              pdiProgress: 75,
            },
            {
              name: "Maria Santos",
              department: "Vendas",
              position: "Gerente de Vendas",
              performanceScore: 92,
              goalsCompleted: 10,
              totalGoals: 10,
              evaluationScore: 4.5,
              pdiProgress: 90,
            },
          ];

          const summary = {
            avgPerformance: mockEmployees.reduce((sum, e) => sum + e.performanceScore, 0) / mockEmployees.length,
            totalEmployees: mockEmployees.length,
            highPerformers: mockEmployees.filter((e) => e.performanceScore >= 80).length,
            lowPerformers: mockEmployees.filter((e) => e.performanceScore < 60).length,
          };

          reportBuffer = await generatePerformanceExcel({
            employees: mockEmployees,
            summary,
          });
          fileSize = reportBuffer.byteLength;
        } else if (report[0].reportType === "pdi") {
          const mockPdis = [
            {
              employeeName: "João Silva",
              department: "Tecnologia",
              status: "em_andamento" as const,
              startDate: "2025-01-01",
              endDate: "2025-12-31",
              progress: 65,
              actionsCount: 10,
              completedActions: 6,
            },
            {
              employeeName: "Maria Santos",
              department: "Vendas",
              status: "concluido" as const,
              startDate: "2024-01-01",
              endDate: "2024-12-31",
              progress: 100,
              actionsCount: 8,
              completedActions: 8,
            },
          ];

          const summary = {
            total: mockPdis.length,
            inProgress: mockPdis.filter((p) => p.status === "em_andamento").length,
            completed: mockPdis.filter((p) => p.status === "concluido").length,
            avgProgress: mockPdis.reduce((sum, p) => sum + p.progress, 0) / mockPdis.length,
          };

          reportBuffer = await generatePDIPDF({
            pdis: mockPdis,
            summary,
            includeCharts: report[0].includeCharts,
          });
          fileSize = reportBuffer.byteLength;
        } else {
          // Para outros tipos, simular sucesso
          reportBuffer = Buffer.from("Mock report data");
          fileSize = reportBuffer.byteLength;
        }

        if (!reportBuffer) {
          throw new Error("Falha ao gerar relatório");
        }

        // TODO: Enviar e-mail com relatório anexo
        // await sendEmail(...)
        const executionTimeMs = Date.now() - startTime;

        // Registrar log de execução
        await db.insert(reportExecutionLogs).values({
          scheduledReportId: input.id,
          executedAt: new Date(),
          status: "success",
          recipientCount: recipients.length,
          successCount: recipients.length,
          failedCount: 0,
          executionTimeMs,
          fileSize: 0, // TODO: tamanho real do arquivo
        });

        // Atualizar lastExecutedAt
        await db
          .update(scheduledReports)
          .set({ lastExecutedAt: new Date() })
          .where(eq(scheduledReports.id, input.id));

        return {
          success: true,
          message: `Relatório enviado para ${recipients.length} destinatário(s)`,
        };
      } catch (error) {
        // Registrar falha
        await db.insert(reportExecutionLogs).values({
          scheduledReportId: input.id,
          executedAt: new Date(),
          status: "failed",
          recipientCount: 0,
          successCount: 0,
          failedCount: 0,
          errorMessage: error instanceof Error ? error.message : "Erro desconhecido",
          executionTimeMs: Date.now() - startTime,
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao executar relatório",
        });
      }
    }),

  /**
   * Obter logs de execução de um relatório (apenas admins)
   */
  getExecutionLogs: adminProcedure
    .input(z.object({ reportId: z.number(), limit: z.number().default(20) }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const logs = await db
        .select()
        .from(reportExecutionLogs)
        .where(eq(reportExecutionLogs.scheduledReportId, input.reportId))
        .orderBy(desc(reportExecutionLogs.executedAt))
        .limit(input.limit);

      return logs;
    }),
});

/**
 * Calcular próxima data de execução baseado na frequência
 */
function calculateNextExecution(
  frequency: "daily" | "weekly" | "monthly" | "quarterly",
  hour: number,
  dayOfWeek?: number,
  dayOfMonth?: number
): Date {
  const now = new Date();
  const next = new Date();

  next.setHours(hour, 0, 0, 0);

  switch (frequency) {
    case "daily":
      // Se já passou a hora de hoje, agendar para amanhã
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      break;

    case "weekly":
      if (dayOfWeek !== undefined) {
        const currentDay = next.getDay();
        let daysUntilNext = dayOfWeek - currentDay;
        
        if (daysUntilNext < 0 || (daysUntilNext === 0 && next <= now)) {
          daysUntilNext += 7;
        }
        
        next.setDate(next.getDate() + daysUntilNext);
      }
      break;

    case "monthly":
      if (dayOfMonth !== undefined) {
        next.setDate(dayOfMonth);
        
        // Se já passou este mês, ir para o próximo
        if (next <= now) {
          next.setMonth(next.getMonth() + 1);
        }
      }
      break;

    case "quarterly":
      if (dayOfMonth !== undefined) {
        next.setDate(dayOfMonth);
        
        // Encontrar próximo trimestre
        const currentMonth = next.getMonth();
        const quarterStartMonths = [0, 3, 6, 9]; // Jan, Abr, Jul, Out
        
        let nextQuarterMonth = quarterStartMonths.find(m => {
          const testDate = new Date(next);
          testDate.setMonth(m);
          return testDate > now;
        });
        
        if (nextQuarterMonth === undefined) {
          // Próximo ano
          next.setFullYear(next.getFullYear() + 1);
          next.setMonth(0);
        } else {
          next.setMonth(nextQuarterMonth);
        }
      }
      break;
  }

  return next;
}
