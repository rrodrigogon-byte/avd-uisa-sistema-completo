import cron from 'node-cron';
import { getDb } from './db';
import * as db from './db';
import { users, evaluations, pirs, notificationSettings, notificationLogs } from '../drizzle/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { notifyOwner } from './_core/notification';

/**
 * Cron Jobs para notificações automáticas do sistema AVD UISA
 * 
 * Funcionalidades:
 * 1. Lembretes de avaliações pendentes
 * 2. Notificações de novas avaliações
 * 3. Lembretes de PIR pendentes
 * 4. Notificações de prazos próximos
 */

// Função auxiliar para enviar notificação
async function sendNotification(userId: number, type: any, title: string, content: string, evaluationId?: number) {
  try {
    await db.createNotificationLog({
      userId,
      type,
      title,
      content,
      evaluationId,
    });
    console.log(`[Notification] Sent to user ${userId}: ${title}`);
  } catch (error) {
    console.error(`[Notification] Error sending to user ${userId}:`, error);
  }
}

// Função auxiliar para calcular data com offset de dias
function getDateWithOffset(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

// Função auxiliar para formatar data
function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
}

// Job 1: Verificar avaliações pendentes (executa diariamente às 9h)
const checkPendingEvaluations = cron.schedule('0 9 * * *', async () => {
  console.log('[CronJob] Checking pending evaluations...');
  
  try {
    const database = await db.getDb();
    if (!database) {
      console.warn('[CronJob] Database not available');
      return;
    }

    // Buscar avaliações em rascunho criadas há mais de 23 dias (faltam 7 dias para 30)
    const twentyThreeDaysAgo = getDateWithOffset(-23);
    
    const pendingEvaluations = await database
      .select({
        evaluation: evaluations,
        evaluator: users,
      })
      .from(evaluations)
      .leftJoin(users, eq(evaluations.evaluatorId, users.id))
      .where(
        and(
          eq(evaluations.status, 'draft'),
          lte(evaluations.createdAt, twentyThreeDaysAgo)
        )
      );

    for (const { evaluation, evaluator } of pendingEvaluations) {
      if (!evaluator) continue;

      // Verificar configurações de notificação
      const settings = await db.getNotificationSettings(evaluator.id);
      if (settings && !settings.notifyPendingReminders) continue;

      // Verificar se já enviamos notificação nas últimas 24h
      const oneDayAgo = getDateWithOffset(-1);
      const recentNotifications = await database
        .select()
        .from(notificationLogs)
        .where(
          and(
            eq(notificationLogs.userId, evaluator.id),
            eq(notificationLogs.evaluationId, evaluation.id),
            eq(notificationLogs.type, 'deadline_approaching'),
            gte(notificationLogs.sentAt, oneDayAgo)
          )
        );

      if (recentNotifications.length > 0) continue;

      // Enviar notificação
      await sendNotification(
        evaluator.id,
        'deadline_approaching',
        'Prazo de Avaliação Próximo',
        `A avaliação do período "${evaluation.period}" está próxima do prazo. Complete e submeta a avaliação o quanto antes.`,
        evaluation.id
      );

      // Notificar owner
      await notifyOwner({
        title: `Lembrete de Avaliação - ${evaluator.name}`,
        content: `O avaliador ${evaluator.name} tem uma avaliação pendente do período "${evaluation.period}" próxima do prazo.`,
      });
    }

    console.log(`[CronJob] Pending evaluations check completed. ${pendingEvaluations.length} evaluations checked.`);
  } catch (error) {
    console.error('[CronJob] Error checking pending evaluations:', error);
  }
});

// Job 2: Verificar PIRs ativos próximos do prazo (executa diariamente às 9h)
const checkPirDeadlines = cron.schedule('0 9 * * *', async () => {
  console.log('[CronJob] Checking PIR deadlines...');
  
  try {
    const database = await db.getDb();
    if (!database) {
      console.warn('[CronJob] Database not available');
      return;
    }

    const today = new Date();
    const sevenDaysFromNow = getDateWithOffset(7);
    const eightDaysFromNow = getDateWithOffset(8);
    
    // Buscar PIRs ativos com prazo entre 7 e 8 dias
    const upcomingPirs = await database
      .select({
        pir: pirs,
        user: users,
      })
      .from(pirs)
      .leftJoin(users, eq(pirs.userId, users.id))
      .where(
        and(
          eq(pirs.status, 'active'),
          gte(pirs.endDate, sevenDaysFromNow),
          lte(pirs.endDate, eightDaysFromNow)
        )
      );

    for (const { pir, user } of upcomingPirs) {
      if (!user) continue;

      // Verificar configurações de notificação
      const settings = await db.getNotificationSettings(user.id);
      if (settings && !settings.notifyPendingReminders) continue;

      // Verificar se já enviamos notificação nas últimas 24h
      const oneDayAgo = getDateWithOffset(-1);
      const recentNotifications = await database
        .select()
        .from(notificationLogs)
        .where(
          and(
            eq(notificationLogs.userId, user.id),
            sql`${notificationLogs.content} LIKE ${`%PIR%${pir.id}%`}`,
            eq(notificationLogs.type, 'deadline_approaching'),
            gte(notificationLogs.sentAt, oneDayAgo)
          )
        );

      if (recentNotifications.length > 0) continue;

      // Enviar notificação
      await sendNotification(
        user.id,
        'deadline_approaching',
        'Prazo de PIR Próximo',
        `Seu PIR "${pir.title}" do período "${pir.period}" está próximo do prazo final (${formatDate(pir.endDate)}). Verifique o progresso das suas metas.`
      );

      // Notificar owner
      await notifyOwner({
        title: `Lembrete de PIR - ${user.name}`,
        content: `O PIR "${pir.title}" de ${user.name} está próximo do prazo (${formatDate(pir.endDate)}).`,
      });
    }

    console.log(`[CronJob] PIR deadlines check completed. ${upcomingPirs.length} PIRs checked.`);
  } catch (error) {
    console.error('[CronJob] Error checking PIR deadlines:', error);
  }
});

// Job 3: Notificar sobre novas avaliações atribuídas (executa a cada 6 horas)
const checkNewEvaluations = cron.schedule('0 */6 * * *', async () => {
  console.log('[CronJob] Checking new evaluations...');
  
  try {
    const database = await db.getDb();
    if (!database) {
      console.warn('[CronJob] Database not available');
      return;
    }

    // Buscar avaliações criadas nas últimas 6 horas
    const sixHoursAgo = getDateWithOffset(0);
    sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);
    
    const newEvaluations = await database
      .select({
        evaluation: evaluations,
        evaluator: users,
      })
      .from(evaluations)
      .leftJoin(users, eq(evaluations.evaluatorId, users.id))
      .where(
        and(
          eq(evaluations.status, 'draft'),
          gte(evaluations.createdAt, sixHoursAgo)
        )
      );

    for (const { evaluation, evaluator } of newEvaluations) {
      if (!evaluator) continue;

      // Verificar configurações de notificação
      const settings = await db.getNotificationSettings(evaluator.id);
      if (settings && !settings.notifyOnNewEvaluation) continue;

      // Verificar se já enviamos notificação para esta avaliação
      const existingNotifications = await database
        .select()
        .from(notificationLogs)
        .where(
          and(
            eq(notificationLogs.userId, evaluator.id),
            eq(notificationLogs.evaluationId, evaluation.id),
            eq(notificationLogs.type, 'new_evaluation')
          )
        );

      if (existingNotifications.length > 0) continue;

      // Enviar notificação
      await sendNotification(
        evaluator.id,
        'new_evaluation',
        'Nova Avaliação Atribuída',
        `Você foi designado para avaliar um colaborador no período "${evaluation.period}". Acesse o sistema para preencher a avaliação.`,
        evaluation.id
      );
    }

    console.log(`[CronJob] New evaluations check completed. ${newEvaluations.length} evaluations checked.`);
  } catch (error) {
    console.error('[CronJob] Error checking new evaluations:', error);
  }
});

// Job 4: Relatório semanal para administradores (executa às sextas 17h)
const weeklyAdminReport = cron.schedule('0 17 * * 5', async () => {
  console.log('[CronJob] Generating weekly admin report...');
  
  try {
    const database = await db.getDb();
    if (!database) {
      console.warn('[CronJob] Database not available');
      return;
    }

    const allEvaluations = await database.select().from(evaluations);
    const allPirs = await database.select().from(pirs);

    const draftEvaluations = allEvaluations.filter((e: any) => e.status === 'draft').length;
    const submittedEvaluations = allEvaluations.filter((e: any) => e.status === 'submitted').length;
    const activePirs = allPirs.filter((p: any) => p.status === 'active').length;

    const reportContent = `
Relatório Semanal - Sistema AVD UISA

Avaliações:
- Rascunhos: ${draftEvaluations}
- Enviadas: ${submittedEvaluations}
- Total: ${allEvaluations.length}

PIRs:
- Ativos: ${activePirs}
- Total: ${allPirs.length}
    `.trim();

    await notifyOwner({
      title: 'Relatório Semanal AVD UISA',
      content: reportContent
    });

    console.log('[CronJob] Weekly admin report sent');
  } catch (error) {
    console.error('[CronJob] Error generating weekly report:', error);
  }
});

// Função para iniciar todos os cron jobs
export function startCronJobs() {
  console.log('[CronJobs] Starting all cron jobs...');
  
  checkPendingEvaluations.start();
  checkPirDeadlines.start();
  checkNewEvaluations.start();
  weeklyAdminReport.start();
  
  console.log('[CronJobs] All cron jobs started successfully');
  console.log('[CronJobs] Schedule:');
  console.log('  - Pending evaluations: Daily at 9:00 AM');
  console.log('  - PIR deadlines: Weekly on Mondays at 10:00 AM');
  console.log('  - New evaluations: Every 6 hours');
  console.log('  - Admin report: Weekly on Fridays at 5:00 PM');
}

// Função para parar todos os cron jobs
export function stopCronJobs() {
  console.log('[CronJobs] Stopping all cron jobs...');
  
  checkPendingEvaluations.stop();
  checkPirDeadlines.stop();
  checkNewEvaluations.stop();
  weeklyAdminReport.stop();
  
  console.log('[CronJobs] All cron jobs stopped');
}

// Exportar jobs individuais para testes
export const cronJobs = {
  checkPendingEvaluations,
  checkPirDeadlines,
  checkNewEvaluations,
  weeklyAdminReport,
};
