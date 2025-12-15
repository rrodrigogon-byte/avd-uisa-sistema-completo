import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../db";
import { scheduledReports, reportExecutionLogs } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Testes do Sistema de Relatórios Agendados
 * Sistema AVD UISA
 */

describe("Sistema de Relatórios Agendados", () => {
  let testReportId: number;

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Limpar dados de teste
    if (testReportId) {
      await db.delete(reportExecutionLogs).where(eq(reportExecutionLogs.scheduledReportId, testReportId));
      await db.delete(scheduledReports).where(eq(scheduledReports.id, testReportId));
    }
  });

  it("deve criar relatório agendado", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const nextExecution = new Date();
    nextExecution.setHours(nextExecution.getHours() + 1);

    // Criar relatório agendado
    const [report] = await db.insert(scheduledReports).values({
      reportType: "nine_box",
      reportName: "Relatório de Teste",
      frequency: "daily",
      hour: 9,
      recipients: JSON.stringify(["test@example.com"]),
      format: "pdf",
      includeCharts: true,
      active: true,
      nextExecutionAt: nextExecution,
    });

    testReportId = report.insertId;

    // Verificar se foi criado
    const createdReport = await db
      .select()
      .from(scheduledReports)
      .where(eq(scheduledReports.id, testReportId))
      .limit(1);

    expect(createdReport.length).toBe(1);
    expect(createdReport[0].reportType).toBe("nine_box");
    expect(createdReport[0].reportName).toBe("Relatório de Teste");
    expect(createdReport[0].frequency).toBe("daily");
    expect(createdReport[0].active).toBe(true);
  });

  it("deve atualizar relatório agendado", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Atualizar relatório
    await db
      .update(scheduledReports)
      .set({
        reportName: "Relatório Atualizado",
        frequency: "weekly",
        dayOfWeek: 1,
      })
      .where(eq(scheduledReports.id, testReportId));

    // Verificar se foi atualizado
    const updatedReport = await db
      .select()
      .from(scheduledReports)
      .where(eq(scheduledReports.id, testReportId))
      .limit(1);

    expect(updatedReport.length).toBe(1);
    expect(updatedReport[0].reportName).toBe("Relatório Atualizado");
    expect(updatedReport[0].frequency).toBe("weekly");
    expect(updatedReport[0].dayOfWeek).toBe(1);
  });

  it("deve desativar relatório agendado", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Desativar relatório
    await db.update(scheduledReports).set({ active: false }).where(eq(scheduledReports.id, testReportId));

    // Verificar se foi desativado
    const deactivatedReport = await db
      .select()
      .from(scheduledReports)
      .where(eq(scheduledReports.id, testReportId))
      .limit(1);

    expect(deactivatedReport.length).toBe(1);
    expect(deactivatedReport[0].active).toBe(false);
  });

  it("deve registrar execução de relatório", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Registrar execução
    const [execution] = await db.insert(reportExecutionLogs).values({
      scheduledReportId: testReportId,
      executedAt: new Date(),
      status: "success",
      recipientCount: 1,
      successCount: 1,
      failedCount: 0,
      executionTimeMs: 1500,
      fileSize: 1024000,
    });

    const executionId = execution.insertId;

    // Verificar se foi registrado
    const executionLog = await db
      .select()
      .from(reportExecutionLogs)
      .where(eq(reportExecutionLogs.id, executionId))
      .limit(1);

    expect(executionLog.length).toBe(1);
    expect(executionLog[0].status).toBe("success");
    expect(executionLog[0].recipientCount).toBe(1);
    expect(executionLog[0].successCount).toBe(1);
    expect(executionLog[0].failedCount).toBe(0);
  });

  it("deve registrar execução com falha", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Registrar execução com falha
    const [execution] = await db.insert(reportExecutionLogs).values({
      scheduledReportId: testReportId,
      executedAt: new Date(),
      status: "failed",
      recipientCount: 1,
      successCount: 0,
      failedCount: 1,
      errorMessage: "Erro de teste",
      executionTimeMs: 500,
    });

    const executionId = execution.insertId;

    // Verificar se foi registrado
    const executionLog = await db
      .select()
      .from(reportExecutionLogs)
      .where(eq(reportExecutionLogs.id, executionId))
      .limit(1);

    expect(executionLog.length).toBe(1);
    expect(executionLog[0].status).toBe("failed");
    expect(executionLog[0].errorMessage).toBe("Erro de teste");
    expect(executionLog[0].failedCount).toBe(1);
  });

  it("deve listar logs de execução de um relatório", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Buscar logs do relatório
    const logs = await db
      .select()
      .from(reportExecutionLogs)
      .where(eq(reportExecutionLogs.scheduledReportId, testReportId));

    expect(logs.length).toBeGreaterThanOrEqual(2); // Pelo menos 2 execuções registradas
  });

  it("deve validar tipos de relatório suportados", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const supportedTypes = [
      "nine_box",
      "performance",
      "pdi",
      "evaluations",
      "goals",
      "competencies",
      "succession",
      "turnover",
      "headcount",
    ];

    // Criar relatórios de cada tipo
    for (const type of supportedTypes) {
      const nextExecution = new Date();
      nextExecution.setHours(nextExecution.getHours() + 1);

      const [report] = await db.insert(scheduledReports).values({
        reportType: type as any,
        reportName: `Relatório ${type}`,
        frequency: "monthly",
        dayOfMonth: 1,
        hour: 9,
        recipients: JSON.stringify(["test@example.com"]),
        format: "pdf",
        includeCharts: true,
        active: true,
        nextExecutionAt: nextExecution,
      });

      // Limpar após teste
      await db.delete(scheduledReports).where(eq(scheduledReports.id, report.insertId));
    }

    // Se chegou aqui, todos os tipos são válidos
    expect(supportedTypes.length).toBe(9);
  });

  it("deve validar frequências suportadas", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const frequencies = ["daily", "weekly", "monthly", "quarterly"];

    for (const frequency of frequencies) {
      const nextExecution = new Date();
      nextExecution.setHours(nextExecution.getHours() + 1);

      const [report] = await db.insert(scheduledReports).values({
        reportType: "performance",
        reportName: `Relatório ${frequency}`,
        frequency: frequency as any,
        dayOfMonth: frequency === "monthly" || frequency === "quarterly" ? 1 : undefined,
        dayOfWeek: frequency === "weekly" ? 1 : undefined,
        hour: 9,
        recipients: JSON.stringify(["test@example.com"]),
        format: "pdf",
        includeCharts: true,
        active: true,
        nextExecutionAt: nextExecution,
      });

      // Limpar após teste
      await db.delete(scheduledReports).where(eq(scheduledReports.id, report.insertId));
    }

    expect(frequencies.length).toBe(4);
  });
});
