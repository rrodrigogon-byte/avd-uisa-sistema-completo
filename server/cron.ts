import cron from 'node-cron';
import { getDb } from './db';
import { startNotificationCron } from './jobs/notificationCron';
import { calculateDailyDiscrepancies } from './jobs/calculateDiscrepancies';
import { sendPulseEmailsJob } from './jobs/sendPulseEmails';
import { sendConsensusReminders } from './jobs/consensusReminders';
import { sendCorporateGoalsReminders } from './jobs/corporateGoalsReminders';
import { goals, performanceEvaluations, pdiItems, employees, pdiPlans, smartGoals } from '../drizzle/schema';
import { eq, and, lt, gte } from 'drizzle-orm';
import { emailService } from './utils/emailService';

/**
 * Cron Jobs para Lembretes Automáticos
 * Sistema AVD UISA
 */// Lembrete de metas próximas do vencimento (executa diariamente às 9h)
export const goalReminderJob = cron.schedule('0 9 * * *', async () => {
  console.log('[Cron] Executando job de lembretes de metas...');
  
  const db = await getDb();
  if (!db) {
    console.error('[Cron] Database not available');
    return;
  }

  try {
    // Buscar metas em andamento
    const activeGoals = await db.select()
      .from(goals)
      .innerJoin(employees, eq(goals.employeeId, employees.id))
      .where(eq(goals.status, 'em_andamento'));

    console.log(`[Cron] ${activeGoals.length} metas ativas encontradas`);
    // TODO: Implementar lógica de envio de e-mails
  } catch (error) {
    console.error('[Cron] Erro ao processar lembretes de metas:', error);
  }
});

// Lembrete de metas SMART 7 dias antes do vencimento (executa diariamente às 9h)
export const smartGoalDueDateReminderJob = cron.schedule('0 9 * * *', async () => {
  console.log('[Cron] Executando job de lembretes de vencimento de metas SMART...');
  
  const db = await getDb();
  if (!db) {
    console.error('[Cron] Database not available');
    return;
  }

  try {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const eightDaysFromNow = new Date();
    eightDaysFromNow.setDate(eightDaysFromNow.getDate() + 8);

    // Buscar metas que vencem em 7 dias
    const upcomingGoals = await db.select()
      .from(smartGoals)
      .innerJoin(employees, eq(smartGoals.employeeId, employees.id))
      .where(
        and(
          gte(smartGoals.endDate, sevenDaysFromNow),
          lt(smartGoals.endDate, eightDaysFromNow),
          eq(smartGoals.status, 'in_progress')
        )
      );

    console.log(`[Cron] ${upcomingGoals.length} metas SMART vencem em 7 dias`);

    // Enviar emails de lembrete
    for (const goal of upcomingGoals) {
      if (goal.employees?.email) {
        await emailService.sendGoalReminder(goal.employees.email, {
          employeeName: goal.employees.name,
          goalTitle: goal.smartGoals.title,
          dueDate: goal.smartGoals.endDate.toLocaleDateString('pt-BR'),
          progress: parseFloat(goal.smartGoals.currentValue || "0") || 0,
        });
      }
    }
  } catch (error) {
    console.error('[Cron] Erro ao processar lembretes de vencimento:', error);
  }
});

// Alerta de metas sem progresso há 15 dias (executa diariamente às 10h)
export const smartGoalNoProgressAlertJob = cron.schedule('0 10 * * *', async () => {
  console.log('[Cron] Executando job de alertas de metas sem progresso...');
  
  const db = await getDb();
  if (!db) {
    console.error('[Cron] Database not available');
    return;
  }

  try {
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    // Buscar metas sem atualização há 15 dias
    const staleGoals = await db.select()
      .from(smartGoals)
      .innerJoin(employees, eq(smartGoals.employeeId, employees.id))
      .where(
        and(
          lt(smartGoals.updatedAt, fifteenDaysAgo),
          eq(smartGoals.status, 'in_progress')
        )
      );

    console.log(`[Cron] ${staleGoals.length} metas sem progresso há 15+ dias`);

    // Enviar alertas
    for (const goal of staleGoals) {
      if (goal.employees?.email) {
        // Enviar lembrete genérico sobre progresso
        await emailService.sendGoalReminder(goal.employees.email, {
          employeeName: goal.employees.name,
          goalTitle: goal.smartGoals.title,
          dueDate: goal.smartGoals.endDate.toLocaleDateString('pt-BR'),
          progress: parseFloat(goal.smartGoals.currentValue || "0") || 0,
        });
      }
    }
  } catch (error) {
    console.error('[Cron] Erro ao processar alertas de progresso:', error);
  }
});

// Lembrete para gestores sobre metas pendentes de aprovação (executa diariamente às 14h)
export const smartGoalApprovalReminderJob = cron.schedule('0 14 * * *', async () => {
  console.log('[Cron] Executando job de lembretes de aprovação de metas...');
  
  const db = await getDb();
  if (!db) {
    console.error('[Cron] Database not available');
    return;
  }

  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Buscar metas pendentes há mais de 3 dias
    const pendingGoals = await db.select()
      .from(smartGoals)
      .innerJoin(employees, eq(smartGoals.employeeId, employees.id))
      .where(
        lt(smartGoals.createdAt, threeDaysAgo)
      );

    console.log(`[Cron] ${pendingGoals.length} metas pendentes de aprovação há 3+ dias`);

    // Agrupar por gestor (assumindo que o gestor está no departamento)
    const managerMap = new Map<number, any[]>();
    for (const goal of pendingGoals) {
      const deptId = goal.employees?.departmentId;
      if (!deptId) continue;
      
      if (!managerMap.has(deptId)) {
        managerMap.set(deptId, []);
      }
      managerMap.get(deptId)!.push(goal);
    }

    // Enviar lembretes aos gestores
    // TODO: Buscar email do gestor do departamento
    console.log(`[Cron] ${managerMap.size} gestores precisam aprovar metas`);
  } catch (error) {
    console.error('[Cron] Erro ao processar lembretes de aprovação:', error);
  }
});

// Lembrete de avaliações pendentes (executa semanalmente às segundas-feiras às 9h)
export const evaluationReminderJob = cron.schedule('0 9 * * 1', async () => {
  console.log('[Cron] Executando job de lembretes de avaliações...');
  
  const db = await getDb();
  if (!db) {
    console.error('[Cron] Database not available');
    return;
  }

  try {
    // Buscar avaliações pendentes
    const pendingEvaluations = await db.select()
      .from(performanceEvaluations)
      .innerJoin(employees, eq(performanceEvaluations.employeeId, employees.id))
      .where(eq(performanceEvaluations.status, 'pendente'));

    console.log(`[Cron] ${pendingEvaluations.length} avaliações pendentes encontradas`);
    // TODO: Implementar lógica de envio de e-mails
  } catch (error) {
    console.error('[Cron] Erro ao processar lembretes de avaliações:', error);
  }
});

// Lembrete de ações de PDI vencidas (executa diariamente às 10h)
export const pdiOverdueJob = cron.schedule('0 10 * * *', async () => {
  console.log('[Cron] Executando job de ações de PDI vencidas...');
  
  const db = await getDb();
  if (!db) {
    console.error('[Cron] Database not available');
    return;
  }

  try {
    // Buscar ações de PDI vencidas (via pdiPlans)
    const overdueActions = await db.select()
      .from(pdiItems)
      .where(
        and(
          eq(pdiItems.status, 'em_andamento'),
          lt(pdiItems.endDate, new Date())
        )
      );

    for (const item of overdueActions) {
      // Buscar colaborador via planId
      const plan = await db.select()
        .from(pdiPlans)
        .innerJoin(employees, eq(pdiPlans.employeeId, employees.id))
        .where(eq(pdiPlans.id, item.planId))
        .limit(1);

      if (plan.length > 0 && plan[0].employees.email) {
        await emailService.sendActionOverdue(plan[0].employees.email, {
          employeeName: plan[0].employees.name,
          actionTitle: item.title,
          dueDate: item.endDate.toLocaleDateString('pt-BR'),
        });
      }
    }

    console.log(`[Cron] ${overdueActions.length} lembretes de ações vencidas enviados`);
  } catch (error) {
    console.error('[Cron] Erro ao enviar lembretes de ações vencidas:', error);
  }
});

// Job de cálculo de discrepâncias (executa diariamente às 6h)
export const calculateDiscrepanciesJob = cron.schedule('0 6 * * *', async () => {
  console.log('[Cron] Executando job de cálculo de discrepâncias...');
  
  try {
    const result = await calculateDailyDiscrepancies();
    console.log('[Cron] Resultado do cálculo de discrepâncias:', result);
  } catch (error) {
    console.error('[Cron] Erro ao calcular discrepâncias:', error);
  }
});

// Job de lembretes de consenso pendente (executa diariamente às 9h)
export const consensusReminderJob = cron.schedule('0 9 * * *', async () => {
  console.log('[Cron] Executando job de lembretes de consenso pendente...');
  
  try {
    await sendConsensusReminders();
  } catch (error) {
    console.error('[Cron] Erro ao enviar lembretes de consenso:', error);
  }
});

// Job de lembretes de metas corporativas sem progresso (executa diariamente às 10h)
export const corporateGoalsReminderJob = cron.schedule('0 10 * * *', async () => {
  console.log('[Cron] Executando job de lembretes de metas corporativas...');
  
  try {
    await sendCorporateGoalsReminders();
  } catch (error) {
    console.error('[Cron] Erro ao enviar lembretes de metas corporativas:', error);
  }
});

// Job de envio de e-mails de Pesquisas Pulse (executa a cada 8 horas)
export const pulseSurveyEmailJob = cron.schedule('0 */8 * * *', async () => {
  console.log('[Cron] Executando job de envio de e-mails Pulse...');
  
  try {
    await sendPulseEmailsJob();
  } catch (error) {
    console.error('[Cron] Erro ao enviar e-mails Pulse:', error);
  }
});

// Iniciar todos os cron jobs
export function startCronJobs() {
  console.log('[Cron] Iniciando cron jobs...');
  goalReminderJob.start();
  evaluationReminderJob.start();
  pdiOverdueJob.start();
  scheduledReportsJob.start();
  calculateDiscrepanciesJob.start();
  pulseSurveyEmailJob.start();
  consensusReminderJob.start();
  corporateGoalsReminderJob.start();
  // Iniciar job de notificações automáticas
  startNotificationCron();
  
  console.log('[Cron] Cron jobs iniciados com sucesso');
}

// Parar todos os cron jobs
export function stopCronJobs() {
  console.log('[Cron] Parando cron jobs...');
  goalReminderJob.stop();
  evaluationReminderJob.stop();
  pdiOverdueJob.stop();
  scheduledReportsJob.stop();
  pulseSurveyEmailJob.stop();
  consensusReminderJob.stop();
  corporateGoalsReminderJob.stop();
  console.log('[Cron] Cron jobs parados');
}

// Job de relatórios agendados (executa a cada hora)
export const scheduledReportsJob = cron.schedule('0 * * * *', async () => {
  console.log('[Cron] Executando job de relatórios agendados...');
  
  const db = await getDb();
  if (!db) {
    console.error('[Cron] Database not available');
    return;
  }

  try {
    const { scheduledReports, reportExecutionLogs } = await import('../drizzle/schema');
    
    // Buscar relatórios ativos que precisam ser executados
    const now = new Date();
    const reportsToExecute = await db.select()
      .from(scheduledReports)
      .where(
        and(
          eq(scheduledReports.active, true),
          lt(scheduledReports.nextExecutionAt, now)
        )
      );

    console.log(`[Cron] ${reportsToExecute.length} relatórios para executar`);

    for (const report of reportsToExecute) {
      const startTime = Date.now();
      
      try {
        const recipients = JSON.parse(report.recipients);
        
        // TODO: Implementar geração real do relatório baseado em report.reportType
        // Por enquanto, apenas registrar execução
        
        console.log(`[Cron] Executando relatório: ${report.reportName} (${report.reportType})`);
        
        // Simular envio de e-mail
        // await emailService.sendReport(recipients, {
        //   reportName: report.reportName,
        //   reportType: report.reportType,
        //   format: report.format,
        // });

        const executionTimeMs = Date.now() - startTime;

        // Registrar log de execução bem-sucedida
        await db.insert(reportExecutionLogs).values({
          scheduledReportId: report.id,
          executedAt: new Date(),
          status: 'success',
          recipientCount: recipients.length,
          successCount: recipients.length,
          failedCount: 0,
          executionTimeMs,
          fileSize: 0, // TODO: tamanho real do arquivo
        });

        // Calcular próxima execução
        const nextExecutionAt = calculateNextExecution(
          report.frequency,
          report.hour,
          report.dayOfWeek ?? undefined,
          report.dayOfMonth ?? undefined
        );

        // Atualizar relatório
        await db.update(scheduledReports)
          .set({
            lastExecutedAt: new Date(),
            nextExecutionAt,
          })
          .where(eq(scheduledReports.id, report.id));

        console.log(`[Cron] Relatório ${report.reportName} executado com sucesso`);
      } catch (error) {
        // Registrar log de execução com falha
        await db.insert(reportExecutionLogs).values({
          scheduledReportId: report.id,
          executedAt: new Date(),
          status: 'failed',
          recipientCount: 0,
          successCount: 0,
          failedCount: 0,
          errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
          executionTimeMs: Date.now() - startTime,
        });

        console.error(`[Cron] Erro ao executar relatório ${report.reportName}:`, error);
      }
    }
  } catch (error) {
    console.error('[Cron] Erro ao processar relatórios agendados:', error);
  }
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
