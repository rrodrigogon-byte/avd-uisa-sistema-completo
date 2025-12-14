import cron from 'node-cron';
import { getDb } from './db';
import * as db from './db';
import { users, evaluations, pirs } from '../drizzle/schema';
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

// Job 1: Verificar avaliações pendentes (executa diariamente às 9h)
const checkPendingEvaluations = cron.schedule('0 9 * * *', async () => {
  console.log('[CronJob] Checking pending evaluations...');
  
  try {
    const database = await db.getDb();
    if (!database) {
      console.warn('[CronJob] Database not available');
      return;
    }

    // Buscar todas as avaliações em rascunho ou enviadas há mais de 7 dias
    const allUsers = await database.select().from(users);
    
    for (const user of allUsers) {
      const settings = await db.getNotificationSettings(user.id);
      
      // Verificar se o usuário quer receber lembretes
      if (!settings || !settings.notifyPendingReminders) continue;

      const evaluations = await db.getEvaluationsByEvaluator(user.id);
      const pendingEvals = evaluations.filter((e: any) => e.status === 'draft');

      if (pendingEvals.length > 0) {
        await sendNotification(
          user.id,
          'reminder',
          'Avaliações Pendentes',
          `Você tem ${pendingEvals.length} avaliação(ões) pendente(s) para completar.`
        );
      }
    }

    console.log('[CronJob] Pending evaluations check completed');
  } catch (error) {
    console.error('[CronJob] Error checking pending evaluations:', error);
  }
});

// Job 2: Verificar PIRs ativos próximos do prazo (executa semanalmente às segundas 10h)
const checkPirDeadlines = cron.schedule('0 10 * * 1', async () => {
  console.log('[CronJob] Checking PIR deadlines...');
  
  try {
    const database = await db.getDb();
    if (!database) {
      console.warn('[CronJob] Database not available');
      return;
    }

    const allUsers = await database.select().from(users);
    
    for (const user of allUsers) {
      const pirs = await db.getPirsByUser(user.id);
      const activePirs = pirs.filter((p: any) => p.status === 'active');

      for (const pir of activePirs) {
        const endDate = new Date(pir.endDate);
        const today = new Date();
        const daysUntilEnd = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Notificar se faltam 30, 15 ou 7 dias
        if ([30, 15, 7].includes(daysUntilEnd)) {
          await sendNotification(
            user.id,
            'deadline_approaching',
            'PIR Próximo do Prazo',
            `Seu PIR "${pir.title}" termina em ${daysUntilEnd} dias. Período: ${pir.period}`
          );
        }
      }
    }

    console.log('[CronJob] PIR deadlines check completed');
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

    const allUsers = await database.select().from(users);
    
    for (const user of allUsers) {
      const settings = await db.getNotificationSettings(user.id);
      
      if (!settings || !settings.notifyOnNewEvaluation) continue;

      const evaluations = await db.getEvaluationsByEvaluatedUser(user.id);
      
      // Verificar avaliações criadas nas últimas 6 horas
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
      const newEvaluations = evaluations.filter((e: any) => 
        new Date(e.createdAt) > sixHoursAgo && e.status === 'draft'
      );

      if (newEvaluations.length > 0) {
        for (const evaluation of newEvaluations) {
          await sendNotification(
            user.id,
            'new_evaluation',
            'Nova Avaliação Atribuída',
            `Uma nova avaliação foi criada para você. Período: ${evaluation.period}`,
            evaluation.id
          );
        }
      }
    }

    console.log('[CronJob] New evaluations check completed');
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
