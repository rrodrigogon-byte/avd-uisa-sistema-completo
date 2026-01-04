import cron from "node-cron";
import { getDb } from "../db";
import { pirIntegrityAssessments } from "../../drizzle/schema";
import { sql, and, eq } from "drizzle-orm";
import { sendPIRIntegrityReminder } from "../_core/email";

/**
 * Sistema de Jobs Cron para Notificações Automáticas de PIR Integridade
 * 
 * Este módulo implementa agendamento automático de notificações para:
 * - Testes próximos de expirar (3 dias antes)
 * - Testes pendentes há mais de 3 dias
 * - Relatórios diários de status
 */

interface PendingAssessment {
  id: number;
  candidateName: string;
  candidateEmail: string;
  expiresAt: Date;
  createdAt: Date;
  status: string;
  accessToken: string;
}

/**
 * Detecta testes pendentes que precisam de lembrete
 * Critérios:
 * - Status: pending ou in_progress
 * - Expira em até 3 dias
 * - Criado há mais de 1 dia
 */
export async function detectPendingTests(): Promise<PendingAssessment[]> {
  const db = await getDb();
  if (!db) {
    console.error("[PIR Jobs] Database não disponível");
    return [];
  }

  try {
    // Buscar testes que expiram nos próximos 3 dias e ainda não foram completados
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const result = await db.execute(sql`
      SELECT 
        id,
        candidateName,
        candidateEmail,
        expiresAt,
        createdAt,
        status,
        accessToken
      FROM pirIntegrityAssessments
      WHERE status IN ('pending', 'in_progress')
        AND expiresAt <= ${threeDaysFromNow.toISOString()}
        AND expiresAt > ${now.toISOString()}
        AND createdAt <= ${oneDayAgo.toISOString()}
      ORDER BY expiresAt ASC
    `);

    const assessments = Array.isArray(result[0]) ? result[0] : [];
    
    console.log(`[PIR Jobs] Encontrados ${assessments.length} testes pendentes que precisam de lembrete`);
    
    return assessments.map((row: any) => ({
      id: row.id,
      candidateName: row.candidateName,
      candidateEmail: row.candidateEmail,
      expiresAt: new Date(row.expiresAt),
      createdAt: new Date(row.createdAt),
      status: row.status,
      accessToken: row.accessToken,
    }));
  } catch (error) {
    console.error("[PIR Jobs] Erro ao detectar testes pendentes:", error);
    return [];
  }
}

/**
 * Envia lembretes para todos os testes pendentes
 */
export async function sendPendingReminders(): Promise<{ sent: number; failed: number }> {
  console.log("[PIR Jobs] Iniciando envio de lembretes...");
  
  const pendingTests = await detectPendingTests();
  
  if (pendingTests.length === 0) {
    console.log("[PIR Jobs] Nenhum teste pendente encontrado");
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const test of pendingTests) {
    try {
      const daysUntilExpiry = Math.ceil(
        (test.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      await sendPIRIntegrityReminder({
        candidateName: test.candidateName,
        candidateEmail: test.candidateEmail,
        testUrl: `${process.env.VITE_APP_URL || "http://localhost:3000"}/integridade/pir/acesso/${test.accessToken}`,
        expiresAt: test.expiresAt,
        daysUntilExpiry,
      });

      sent++;
      console.log(`[PIR Jobs] Lembrete enviado para ${test.candidateEmail} (expira em ${daysUntilExpiry} dias)`);
    } catch (error) {
      failed++;
      console.error(`[PIR Jobs] Erro ao enviar lembrete para ${test.candidateEmail}:`, error);
    }
  }

  console.log(`[PIR Jobs] Lembretes enviados: ${sent} sucesso, ${failed} falhas`);
  return { sent, failed };
}

/**
 * Gera relatório diário de status dos testes
 */
export async function generateDailyReport(): Promise<{
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  expired: number;
  expiringIn3Days: number;
}> {
  const db = await getDb();
  if (!db) {
    console.error("[PIR Jobs] Database não disponível");
    return { total: 0, pending: 0, inProgress: 0, completed: 0, expired: 0, expiringIn3Days: 0 };
  }

  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Total de testes
    const totalResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM pirIntegrityAssessments
    `);
    const total = (totalResult[0] as any)[0]?.count || 0;

    // Por status
    const statusResult = await db.execute(sql`
      SELECT 
        status,
        COUNT(*) as count
      FROM pirIntegrityAssessments
      GROUP BY status
    `);

    const statusCounts: Record<string, number> = {};
    (statusResult[0] as any[]).forEach((row: any) => {
      statusCounts[row.status] = row.count;
    });

    // Expirando em 3 dias
    const expiringResult = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM pirIntegrityAssessments
      WHERE status IN ('pending', 'in_progress')
        AND expiresAt <= ${threeDaysFromNow.toISOString()}
        AND expiresAt > ${now.toISOString()}
    `);
    const expiringIn3Days = (expiringResult[0] as any)[0]?.count || 0;

    const report = {
      total,
      pending: statusCounts.pending || 0,
      inProgress: statusCounts.in_progress || 0,
      completed: statusCounts.completed || 0,
      expired: statusCounts.expired || 0,
      expiringIn3Days,
    };

    console.log("[PIR Jobs] Relatório diário gerado:", report);
    return report;
  } catch (error) {
    console.error("[PIR Jobs] Erro ao gerar relatório:", error);
    return { total: 0, pending: 0, inProgress: 0, completed: 0, expired: 0, expiringIn3Days: 0 };
  }
}

/**
 * Job principal que roda diariamente às 9h
 * Envia lembretes e gera relatório
 */
export function startDailyNotificationJob() {
  // Cron expression: "0 9 * * *" = todos os dias às 9h
  // Formato: segundo minuto hora dia mês dia-da-semana
  const job = cron.schedule(
    "0 9 * * *",
    async () => {
      console.log("[PIR Jobs] Iniciando job diário de notificações às", new Date().toISOString());

      try {
        // 1. Enviar lembretes
        const reminderResult = await sendPendingReminders();
        console.log(`[PIR Jobs] Lembretes enviados: ${reminderResult.sent} sucesso, ${reminderResult.failed} falhas`);

        // 2. Gerar relatório
        const report = await generateDailyReport();
        console.log("[PIR Jobs] Relatório diário:", JSON.stringify(report, null, 2));

        // TODO: Enviar relatório por email para administradores
        // await sendDailyReportEmail(report);
      } catch (error) {
        console.error("[PIR Jobs] Erro ao executar job diário:", error);
      }
    },
    {
      scheduled: true,
      timezone: "America/Sao_Paulo", // Timezone do Brasil
    }
  );

  console.log("[PIR Jobs] Job diário de notificações agendado para 9h (horário de Brasília)");
  return job;
}

/**
 * Job de teste que roda a cada 5 minutos (para desenvolvimento)
 * REMOVER EM PRODUÇÃO
 */
export function startTestNotificationJob() {
  const job = cron.schedule(
    "*/5 * * * *", // A cada 5 minutos
    async () => {
      console.log("[PIR Jobs TEST] Executando job de teste às", new Date().toISOString());
      
      try {
        const reminderResult = await sendPendingReminders();
        console.log(`[PIR Jobs TEST] Lembretes: ${reminderResult.sent} enviados, ${reminderResult.failed} falhas`);
        
        const report = await generateDailyReport();
        console.log("[PIR Jobs TEST] Status:", report);
      } catch (error) {
        console.error("[PIR Jobs TEST] Erro:", error);
      }
    },
    {
      scheduled: true,
      timezone: "America/Sao_Paulo",
    }
  );

  console.log("[PIR Jobs] Job de teste agendado (a cada 5 minutos)");
  return job;
}

/**
 * Execução manual do job (para testes)
 */
export async function runJobManually() {
  console.log("[PIR Jobs] Executando job manualmente...");
  
  const reminderResult = await sendPendingReminders();
  const report = await generateDailyReport();
  
  return {
    reminders: reminderResult,
    report,
  };
}
