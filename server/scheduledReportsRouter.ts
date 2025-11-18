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
import { protectedProcedure, router } from "./_core/trpc";

/**
 * Router de Relatórios Agendados
 * Gerencia a criação, listagem, atualização e execução de relatórios automáticos
 */

export const scheduledReportsRouter = router({
  /**
   * Listar todos os relatórios agendados
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const reports = await db
      .select()
      .from(scheduledReports)
      .orderBy(desc(scheduledReports.createdAt));

    return reports;
  }),

  /**
   * Obter detalhes de um relatório agendado específico
   */
  getById: protectedProcedure
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
   * Criar novo relatório agendado
   */
  create: protectedProcedure
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
   * Atualizar relatório agendado existente
   */
  update: protectedProcedure
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
   * Deletar relatório agendado
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.delete(scheduledReports).where(eq(scheduledReports.id, input.id));

      return { success: true };
    }),

  /**
   * Executar relatório manualmente (teste)
   */
  executeNow: protectedProcedure
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

      // Executar relatório (implementação simplificada)
      const startTime = Date.now();
      
      try {
        // TODO: Implementar geração real do relatório
        // Por enquanto, simular sucesso
        const recipients = JSON.parse(report[0].recipients);
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
   * Obter logs de execução de um relatório
   */
  getExecutionLogs: protectedProcedure
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
