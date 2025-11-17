import cron from 'node-cron';
import { getDb } from './db';
import { goals, performanceEvaluations, pdiItems, employees, pdiPlans } from '../drizzle/schema';
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
          pdiTitle: 'PDI ' + new Date().getFullYear(),
        });
      }
    }

    console.log(`[Cron] ${overdueActions.length} lembretes de ações vencidas enviados`);
  } catch (error) {
    console.error('[Cron] Erro ao enviar lembretes de ações vencidas:', error);
  }
});

// Iniciar todos os cron jobs
export function startCronJobs() {
  console.log('[Cron] Iniciando cron jobs...');
  goalReminderJob.start();
  evaluationReminderJob.start();
  pdiOverdueJob.start();
  console.log('[Cron] Cron jobs iniciados com sucesso');
}

// Parar todos os cron jobs
export function stopCronJobs() {
  console.log('[Cron] Parando cron jobs...');
  goalReminderJob.stop();
  evaluationReminderJob.stop();
  pdiOverdueJob.stop();
  console.log('[Cron] Cron jobs parados');
}
